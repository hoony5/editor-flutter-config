import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as vscode from 'vscode';
import { readText, readJson, regexFirst, parsePubspecDeps } from '../../shared/fileUtils';
import { safePath, escapeRegex } from '../../shared/security';
import type { PostFn } from '../../types';

export function extractIosPermKeys(plist: string): string[] {
  if (!plist) return [];
  const keys: string[] = [];
  const re = /<key>(NS\w+UsageDescription)<\/key>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plist)) !== null) keys.push(m[1]);
  return keys;
}

export function extractAndroidPermKeys(xml: string): string[] {
  if (!xml) return [];
  const keys: string[] = [];
  const re = /uses-permission[^>]*android:name="android\.permission\.([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) keys.push(m[1]);
  return keys;
}

export function extractMacosEntKeys(ent: string): string[] {
  if (!ent) return [];
  const keys: string[] = [];
  const re = /<key>(com\.apple\.[^<]+)<\/key>\s*<true\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ent)) !== null) keys.push(m[1]);
  return keys;
}

function plistKeys(plist: string, keys: string[]): [string, string][] {
  if (!plist) return [['(file not found)', '']];
  const result: [string, string][] = [];
  for (const key of keys) {
    const m = plist.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`));
    if (m) result.push([key, m[1]]);
  }
  return result.length > 0 ? result : [['(no entries)', '']];
}

function plistAllPermissions(plist: string): [string, string][] {
  if (!plist) return [];
  const result: [string, string][] = [];
  const re = /<key>(NS\w+UsageDescription)<\/key>\s*<string>([^<]*)<\/string>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plist)) !== null) result.push([m[1], m[2] || '✓']);
  return result;
}

function xcconfigKeys(content: string): [string, string][] {
  if (!content) return [['(file not found)', '']];
  return content.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('//') && !l.startsWith('#'))
    .map(l => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').trim()] as [string, string];
    });
}

function manifestPermissions(xml: string): [string, string][] {
  if (!xml) return [['(file not found)', '']];
  const perms: [string, string][] = [];
  const re = /uses-permission[^>]*android:name="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) perms.push([m[1].replace('android.permission.', ''), '✓']);
  const appLabel = regexFirst(xml, /android:label="([^"]+)"/);
  if (appLabel) perms.unshift(['app label', appLabel]);
  return perms.length > 0 ? perms : [['(no permissions)', '']];
}

function rcVal(rc: string, key: string): string {
  if (!rc) return '(file not found)';
  const m = rc.match(new RegExp(`VALUE\\s+"${key}",\\s*"([^"]*)"`));
  return m ? m[1] : '(not set)';
}

export function sendPlatformConfig(root: string, post: PostFn): void {
  const platforms: Record<string, { file: string; entries: [string, string][] }[]> = {};

  const iosPlist = readText(path.join(root, 'ios/Runner/Info.plist'));
  const iosXc = readText(path.join(root, 'ios/Flutter/AppConfig.xcconfig'));
  const iosPbx = readText(path.join(root, 'ios/Runner.xcodeproj/project.pbxproj'));
  platforms.ios = [
    { file: 'ios/Runner/Info.plist', entries: [...plistKeys(iosPlist, ['CFBundleDisplayName', 'CFBundleIdentifier', 'CFBundleShortVersionString']), ...plistAllPermissions(iosPlist)] },
    { file: 'ios/Flutter/AppConfig.xcconfig', entries: xcconfigKeys(iosXc) },
    { file: 'Signing', entries: [['DEVELOPMENT_TEAM', regexFirst(iosPbx, /DEVELOPMENT_TEAM\s*=\s*([A-Z0-9]+)/) ?? '(not set)']] },
    {
      file: 'ios/Runner/Info.plist',
      entries: (() => {
        const schemes: [string, string][] = [];
        let m: RegExpExecArray | null;
        const re = /<key>CFBundleURLSchemes<\/key>\s*<array>\s*<string>([^<]*)<\/string>/g;
        while ((m = re.exec(iosPlist)) !== null) schemes.push(['URL Scheme', m[1]]);
        const nameRe = /<key>CFBundleURLName<\/key>\s*<string>([^<]*)<\/string>/g;
        while ((m = nameRe.exec(iosPlist)) !== null) schemes.push(['URL Name', m[1]]);
        return schemes.length > 0 ? schemes : [['(no URL schemes)', '']];
      })(),
    },
  ];

  const androidManifest = readText(path.join(root, 'android/app/src/main/AndroidManifest.xml'));
  const keyProps = readText(path.join(root, 'android/key.properties'));
  const buildGradle = readText(path.join(root, 'android/app/build.gradle'));
  platforms.android = [
    { file: 'AndroidManifest.xml', entries: manifestPermissions(androidManifest) },
    {
      file: 'android/key.properties',
      entries: keyProps
        ? keyProps.split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => {
            const [k, ...v] = l.split('=');
            const key = k.trim();
            return [key, /password|secret/i.test(key) ? '••••••' : v.join('=').trim()] as [string, string];
          })
        : [['(file not found)', '']],
    },
    {
      file: 'build.gradle',
      entries: [
        ['applicationId', regexFirst(buildGradle, /applicationId\s+["']([^"']+)["']/) ?? '(not set)'],
        ['minSdk', regexFirst(buildGradle, /minSdk\s*=?\s*(\d+)/) ?? regexFirst(buildGradle, /minSdkVersion\s+(\d+)/) ?? '(not set)'],
        ['targetSdk', regexFirst(buildGradle, /targetSdk\s*=?\s*(\d+)/) ?? regexFirst(buildGradle, /targetSdkVersion\s+(\d+)/) ?? '(not set)'],
        ['compileSdk', regexFirst(buildGradle, /compileSdk\s*=?\s*(\d+)/) ?? regexFirst(buildGradle, /compileSdkVersion\s+(\d+)/) ?? '(not set)'],
      ],
    },
    {
      file: 'android/app/src/main/AndroidManifest.xml',
      entries: (() => {
        const schemes: [string, string][] = [];
        let m: RegExpExecArray | null;
        const re = /android:scheme="([^"]+)"/g;
        while ((m = re.exec(androidManifest)) !== null) schemes.push(['intent scheme', m[1]]);
        const hostRe = /android:host="([^"]+)"/g;
        while ((m = hostRe.exec(androidManifest)) !== null) schemes.push(['intent host', m[1]]);
        return schemes.length > 0 ? schemes : [['(no deep links)', '']];
      })(),
    },
  ];

  const macPlist = readText(path.join(root, 'macos/Runner/Info.plist'));
  const macXc = readText(path.join(root, 'macos/Runner/Configs/AppInfo.xcconfig'));
  const macEnt = readText(path.join(root, 'macos/Runner/DebugProfile.entitlements'));
  platforms.macos = [
    { file: 'macos/Runner/Info.plist', entries: [...plistKeys(macPlist, ['CFBundleName', 'CFBundleDisplayName', 'CFBundleIdentifier', 'CFBundleShortVersionString', 'NSHumanReadableCopyright']), ...plistAllPermissions(macPlist)] },
    { file: 'AppInfo.xcconfig', entries: xcconfigKeys(macXc) },
    { file: 'Entitlements', entries: extractMacosEntKeys(macEnt).map(k => [k, 'true'] as [string, string]) },
  ];

  const winRc = readText(path.join(root, 'windows/runner/Runner.rc'));
  const winSign = readText(path.join(root, 'windows/signing.properties'));
  platforms.windows = [
    {
      file: 'windows/runner/Runner.rc',
      entries: [
        ['ProductName', rcVal(winRc, 'ProductName')],
        ['FileDescription', rcVal(winRc, 'FileDescription')],
        ['CompanyName', rcVal(winRc, 'CompanyName')],
        ['LegalCopyright', rcVal(winRc, 'LegalCopyright')],
        ['InternalName', rcVal(winRc, 'InternalName')],
        ['OriginalFilename', rcVal(winRc, 'OriginalFilename')],
      ],
    },
    {
      file: 'windows/signing.properties',
      entries: winSign
        ? winSign.split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => {
            const [k, ...v] = l.split('=');
            return [k.trim(), v.join('=').trim()] as [string, string];
          })
        : [['(file not found)', '']],
    },
  ];

  const webIndex = readText(path.join(root, 'web/index.html'));
  const webManifest = readJson(path.join(root, 'web/manifest.json'));
  platforms.web = [
    {
      file: 'web/index.html',
      entries: [
        ['title', regexFirst(webIndex, /<title>([^<]*)<\/title>/) ?? '(not set)'],
        ['description', regexFirst(webIndex, /content="([^"]*)"[^>]*name="description"/) ?? regexFirst(webIndex, /name="description"[^>]*content="([^"]*)"/) ?? '(not set)'],
      ],
    },
    {
      file: 'web/manifest.json',
      entries: webManifest && Object.keys(webManifest).length > 0
        ? Object.entries(webManifest).map(([k, v]) => [k, String(v)] as [string, string])
        : [['(file not found)', '']],
    },
  ];

  const permState = {
    ios: extractIosPermKeys(iosPlist),
    android: extractAndroidPermKeys(androidManifest),
    macos: extractMacosEntKeys(macEnt),
  };

  const pubDeps = parsePubspecDeps(root).deps.map(d => d.name);

  const permUsage = scanPermissionUsage(root);
  post({ type: 'platformConfig', platforms, permState, pubDeps, permUsage });
}

export async function savePlatformEdit(
  root: string,
  post: PostFn,
  edits: { file: string; key: string; value?: string; action?: string }[],
): Promise<void> {
  if (!edits.length) return;
  const summary = edits.map(e => {
    const act = e.action === 'remove' ? '−' : e.action === 'add' ? '+' : '~';
    return `${act} ${e.key} (${e.file.split('/').pop()})`;
  }).join('\n');
  const confirm = await vscode.window.showInformationMessage(
    `Apply ${edits.length} change(s)?\n${summary}`,
    { modal: true },
    'Apply',
  );
  if (confirm !== 'Apply') { sendPlatformConfig(root, post); return; }
  const SECRET_RE = /password|secret|pass|token|private.?key|api.?key|credential/i;
  const isGitTracked = (rel: string): boolean => {
    try {
      execSync('git ls-files --error-unmatch', { cwd: root, encoding: 'utf-8', timeout: 3000, stdio: ['pipe', 'pipe', 'pipe'], input: rel });
      return true;
    } catch {
      // fail-closed: git 실패 시 tracked로 간주해 secret 차단
      return true;
    }
  };

  const touched = new Set<string>();
  const blocked: string[] = [];

  for (const edit of edits) {
    const rel = edit.file;
    const filePath = safePath(root, rel);
    if (!filePath) { blocked.push(`${rel} (path traversal blocked)`); continue; }
    const ext = path.extname(filePath);
    const isSecret = SECRET_RE.test(edit.key) || SECRET_RE.test(edit.value ?? '');

    if (isSecret && isGitTracked(rel)) {
      blocked.push(`${edit.key} → ${rel}`);
      continue;
    }

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      if (ext === '.plist' || ext === '.entitlements') {
        fs.writeFileSync(filePath, '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n</dict>\n</plist>\n');
      } else if (ext === '.xcconfig') {
        fs.writeFileSync(filePath, '// Generated by Flutter Project Settings\n');
      } else if (ext === '.properties') {
        fs.writeFileSync(filePath, '# Generated by Flutter Project Settings\n');
      } else {
        fs.writeFileSync(filePath, '');
      }
    }

    if (!touched.has(filePath)) {
      const content = readText(filePath);
      const bakPath = filePath + '.bak';
      if (!SECRET_RE.test(content) && !fs.existsSync(bakPath)) fs.copyFileSync(filePath, bakPath);
      touched.add(filePath);
    }

    let text = readText(filePath);
    const ek = escapeRegex(edit.key);
    const keyExists = (t: string, k: string): boolean => {
      if (ext === '.plist' || ext === '.entitlements') return t.includes(`<key>${k}</key>`);
      if (ext === '.xcconfig' || ext === '.properties') return new RegExp(`^${escapeRegex(k)}\\s*=`, 'm').test(t);
      if (ext === '.rc') return t.includes(`"${k}"`);
      return t.includes(k);
    };

    if (edit.action === 'remove') {
      if (ext === '.entitlements') text = text.replace(new RegExp(`\\s*<key>${ek}</key>\\s*<true/>`, 'g'), '');
      else if (ext === '.plist') text = text.replace(new RegExp(`\\s*<key>${ek}</key>\\s*<string>[^<]*</string>`, 'g'), '');
      else if (filePath.includes('AndroidManifest')) text = text.replace(new RegExp(`\\s*<uses-permission[^>]*android:name="[^"]*${ek}"[^/]*/>`, 'g'), '');
    } else if (edit.action === 'add' || !keyExists(text, edit.key)) {
      if (ext === '.entitlements') {
        if (!text.includes(`<key>${edit.key}</key>`)) text = text.replace('</dict>', `\t<key>${edit.key}</key>\n\t<true/>\n</dict>`);
      } else if (ext === '.plist') {
        text = text.replace(/<\/dict>\s*<\/plist>/, `\t<key>${edit.key}</key>\n\t<string>${edit.value ?? ''}</string>\n</dict>\n</plist>`);
      } else if (filePath.includes('AndroidManifest')) {
        text = text.replace('<application', `<uses-permission android:name="android.permission.${edit.key}" />\n    <application`);
      } else if (ext === '.xcconfig') {
        text += `${edit.key} = ${edit.value ?? ''}\n`;
      } else if (ext === '.properties') {
        text += `${edit.key}=${edit.value ?? ''}\n`;
      }
    } else {
      if (ext === '.xcconfig') text = text.replace(new RegExp(`^${ek}\\s*=.*$`, 'm'), `${edit.key} = ${edit.value ?? ''}`);
      else if (ext === '.properties') text = text.replace(new RegExp(`^${ek}\\s*=.*$`, 'm'), `${edit.key}=${edit.value ?? ''}`);
      else if (ext === '.rc') text = text.replace(new RegExp(`(VALUE\\s+"${ek}",\\s*)"[^"]*"`), `$1"${edit.value ?? ''}"`);
      else if (ext === '.plist') text = text.replace(new RegExp(`(<key>${ek}</key>\\s*<string>)[^<]*(</string>)`), `$1${edit.value ?? ''}$2`);
      else if (filePath.includes('build.gradle')) {
        if (edit.key === 'applicationId') text = text.replace(/(applicationId\s+["'])[^"']*(["'])/, `$1${edit.value}$2`);
        else if (edit.key === 'minSdk') text = text.replace(/(minSdk\s*=?\s*)\d+/, `$1${edit.value}`);
        else if (edit.key === 'targetSdk') text = text.replace(/(targetSdk\s*=?\s*)\d+/, `$1${edit.value}`);
        else if (edit.key === 'compileSdk') text = text.replace(/(compileSdk\s*=?\s*)\d+/, `$1${edit.value}`);
      }
    }

    fs.writeFileSync(filePath, text);

    if (ext === '.entitlements' && filePath.includes('DebugProfile')) {
      const releasePath = filePath.replace('DebugProfile', 'Release');
      if (fs.existsSync(releasePath)) {
        let relText = readText(releasePath);
        if (edit.action === 'remove') relText = relText.replace(new RegExp(`\\s*<key>${ek}</key>\\s*<true/>`, 'g'), '');
        else if (!relText.includes(`<key>${edit.key}</key>`)) relText = relText.replace('</dict>', `\t<key>${edit.key}</key>\n\t<true/>\n</dict>`);
        fs.writeFileSync(releasePath, relText);
      }
    }
  }

  const names = [...touched].map(f => path.basename(f));
  const invalid: string[] = [];
  for (const filePath of touched) {
    const ext = path.extname(filePath);
    if (['.plist', '.entitlements'].includes(ext) || filePath.includes('AndroidManifest')) {
      const content = readText(filePath);
      if (!validateXml(content)) {
        const bakPath = filePath + '.bak';
        if (fs.existsSync(bakPath)) {
          fs.copyFileSync(bakPath, filePath);
          invalid.push(path.basename(filePath));
        }
      }
    }
  }
  let msg = `Saved: ${names.join(', ')} (.bak backup)`;
  if (invalid.length) {
    msg += `\n❌ Validation failed, rolled back: ${invalid.join(', ')}`;
    vscode.window.showErrorMessage(`XML validation failed — rolled back: ${invalid.join(', ')}`);
  }
  if (blocked.length) {
    msg += `\n⚠ Blocked: ${blocked.join(', ')}`;
    vscode.window.showWarningMessage(`Secret values blocked from git-tracked files:\n${blocked.join('\n')}`);
  }
  if (!invalid.length) vscode.window.showInformationMessage(msg);
  sendPlatformConfig(root, post);
}

function validateXml(content: string): boolean {
  if (!content.trim()) return false;
  const openTags = (content.match(/<(\w+)[^/]*?>/g) || []).length;
  const closeTags = (content.match(/<\/\w+>/g) || []).length;
  const selfClose = (content.match(/<[^>]+\/>/g) || []).length;
  if (!content.includes('<') || !content.includes('>')) return false;
  if (openTags > closeTags + selfClose + 5) return false;
  if (content.includes('<key>') && !content.includes('</key>')) return false;
  if (content.includes('<dict>') && !content.includes('</dict>')) return false;
  if (content.includes('<plist') && !content.includes('</plist>')) return false;
  return true;
}

const API_PERM_MAP: { pattern: RegExp; perm: string; platform: string; label: string }[] = [
  { pattern: /Geolocator|LocationPermission|positionStream|getCurrentPosition/, perm: 'NSLocationWhenInUseUsageDescription', platform: 'ios', label: 'Location (iOS)' },
  { pattern: /Geolocator|LocationPermission|positionStream|getCurrentPosition/, perm: 'ACCESS_FINE_LOCATION', platform: 'android', label: 'Location (Android)' },
  { pattern: /Camera\(|CameraController|openCamera|image_picker.*camera/, perm: 'NSCameraUsageDescription', platform: 'ios', label: 'Camera (iOS)' },
  { pattern: /Camera\(|CameraController|openCamera|image_picker.*camera/, perm: 'CAMERA', platform: 'android', label: 'Camera (Android)' },
  { pattern: /Microphone|recordAudio|AudioRecorder|flutter_sound/, perm: 'NSMicrophoneUsageDescription', platform: 'ios', label: 'Microphone (iOS)' },
  { pattern: /Microphone|recordAudio|AudioRecorder|flutter_sound/, perm: 'RECORD_AUDIO', platform: 'android', label: 'Microphone (Android)' },
  { pattern: /Permission\.photos|PhotoManager|image_picker.*gallery/, perm: 'NSPhotoLibraryUsageDescription', platform: 'ios', label: 'Photos (iOS)' },
  { pattern: /Permission\.bluetooth|FlutterBlue|flutter_reactive_ble/, perm: 'NSBluetoothAlwaysUsageDescription', platform: 'ios', label: 'Bluetooth (iOS)' },
  { pattern: /Permission\.bluetooth|FlutterBlue|flutter_reactive_ble/, perm: 'BLUETOOTH_CONNECT', platform: 'android', label: 'Bluetooth (Android)' },
  { pattern: /firebase_messaging|FirebaseMessaging|FlutterLocalNotifications/, perm: 'POST_NOTIFICATIONS', platform: 'android', label: 'Notifications (Android)' },
  { pattern: /local_auth|LocalAuthentication|authenticate\(/, perm: 'NSFaceIDUsageDescription', platform: 'ios', label: 'Face ID (iOS)' },
  { pattern: /local_auth|LocalAuthentication|authenticate\(/, perm: 'USE_BIOMETRIC', platform: 'android', label: 'Biometric (Android)' },
  { pattern: /speech_to_text|SpeechRecognition|listen\(/, perm: 'NSSpeechRecognitionUsageDescription', platform: 'ios', label: 'Speech (iOS)' },
  { pattern: /contacts_service|Contacts\.open|fetchContacts/, perm: 'NSContactsUsageDescription', platform: 'ios', label: 'Contacts (iOS)' },
  { pattern: /supabase\.storage|SupabaseStorage|uploadFile|getPublicUrl/, perm: 'NSPhotoLibraryUsageDescription', platform: 'ios', label: 'Storage Upload (iOS)' },
  { pattern: /firebase_auth|FirebaseAuth|signInWithCredential/, perm: 'NSFaceIDUsageDescription', platform: 'ios', label: 'Firebase Auth (iOS)' },
  { pattern: /firebase_messaging|FirebaseMessaging/, perm: 'aps-environment', platform: 'ios', label: 'Push (iOS entitlement)' },
  { pattern: /health|HealthKit|HKHealthStore|health_store/, perm: 'NSHealthShareUsageDescription', platform: 'ios', label: 'Health Read (iOS)' },
  { pattern: /health|HealthKit|HKHealthStore|health_store/, perm: 'NSHealthUpdateUsageDescription', platform: 'ios', label: 'Health Write (iOS)' },
  { pattern: /InAppPurchase|StoreKit|purchase_flutter|in_app_purchase/, perm: 'com.apple.developer.in-app-payments', platform: 'ios', label: 'IAP (iOS entitlement)' },
  { pattern: /InAppPurchase|StoreKit|purchase_flutter|in_app_purchase/, perm: 'com.android.vending.BILLING', platform: 'android', label: 'IAP (Android)' },
  { pattern: /calendar|device_calendar|EventKit/, perm: 'NSCalendarsUsageDescription', platform: 'ios', label: 'Calendar (iOS)' },
  { pattern: /calendar|device_calendar|EventKit/, perm: 'READ_CALENDAR', platform: 'android', label: 'Calendar (Android)' },
  { pattern: /app_tracking_transparency|AppTrackingTransparency|requestTrackingAuthorization/, perm: 'NSUserTrackingUsageDescription', platform: 'ios', label: 'ATT (iOS)' },
  { pattern: /webview|WebView|InAppWebView|webview_flutter/, perm: 'INTERNET', platform: 'android', label: 'WebView Internet (Android)' },
];

export function scanPermissionUsage(root: string): { label: string; platform: string; perm: string; used: boolean; configured: boolean }[] {
  const libDir = path.join(root, 'lib');
  let allCode = '';
  if (fs.existsSync(libDir)) {
    const walk = (dir: string): void => {
      let entries: fs.Dirent[];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.dart')) allCode += readText(full) + '\n';
      }
    };
    walk(libDir);
  }

  const iosPlist = readText(path.join(root, 'ios/Runner/Info.plist'));
  const androidManifest = readText(path.join(root, 'android/app/src/main/AndroidManifest.xml'));
  const iosKeys = extractIosPermKeys(iosPlist);
  const androidPerms = extractAndroidPermKeys(androidManifest);

  const results: { label: string; platform: string; perm: string; used: boolean; configured: boolean }[] = [];
  const seen = new Set<string>();
  for (const entry of API_PERM_MAP) {
    const used = entry.pattern.test(allCode);
    if (!used) continue;
    const key = `${entry.perm}|${entry.platform}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const configured = entry.platform === 'ios' ? iosKeys.includes(entry.perm) : androidPerms.includes(entry.perm);
    results.push({ label: entry.label, platform: entry.platform, perm: entry.perm, used, configured });
  }
  return results;
}
