import { describe, it, expect } from 'vitest';
import { extractIosPermKeys, extractAndroidPermKeys, extractMacosEntKeys } from '../src/tabs/platform/handler';

describe('extractIosPermKeys', () => {
  it('extracts NS*UsageDescription keys from plist', () => {
    const plist = [
      '<?xml version="1.0"?>',
      '<plist><dict>',
      '<key>NSCameraUsageDescription</key><string>Camera access</string>',
      '<key>NSMicrophoneUsageDescription</key><string>Mic access</string>',
      '<key>CFBundleDisplayName</key><string>MyApp</string>',
      '</dict></plist>',
    ].join('\n');

    const keys = extractIosPermKeys(plist);
    expect(keys).toContain('NSCameraUsageDescription');
    expect(keys).toContain('NSMicrophoneUsageDescription');
    expect(keys).not.toContain('CFBundleDisplayName');
  });

  it('returns empty for empty input', () => {
    expect(extractIosPermKeys('')).toEqual([]);
  });
});

describe('extractAndroidPermKeys', () => {
  it('extracts permission names from manifest', () => {
    const xml = [
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
      '<uses-permission android:name="android.permission.CAMERA" />',
      '<uses-permission android:name="android.permission.INTERNET" />',
      '<application android:label="MyApp" />',
      '</manifest>',
    ].join('\n');

    const keys = extractAndroidPermKeys(xml);
    expect(keys).toContain('CAMERA');
    expect(keys).toContain('INTERNET');
    expect(keys).toHaveLength(2);
  });

  it('returns empty for empty input', () => {
    expect(extractAndroidPermKeys('')).toEqual([]);
  });
});

describe('extractMacosEntKeys', () => {
  it('extracts entitlement keys with true values', () => {
    const ent = [
      '<?xml version="1.0"?>',
      '<plist><dict>',
      '<key>com.apple.security.app-sandbox</key><true/>',
      '<key>com.apple.security.network.client</key><true/>',
      '<key>com.apple.security.device.camera</key><false/>',
      '</dict></plist>',
    ].join('\n');

    const keys = extractMacosEntKeys(ent);
    expect(keys).toContain('com.apple.security.app-sandbox');
    expect(keys).toContain('com.apple.security.network.client');
    expect(keys).not.toContain('com.apple.security.device.camera');
  });

  it('returns empty for empty input', () => {
    expect(extractMacosEntKeys('')).toEqual([]);
  });
});
