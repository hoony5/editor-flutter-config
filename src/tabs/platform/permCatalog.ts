export const permCatalogJs = `
var PERM_META={
camera:{links:[['Apple Docs','https://developer.apple.com/documentation/avfoundation/capture_setup'],['Android Docs','https://developer.android.com/training/camera2']],acts:[],pkgs:[]},
mic:{links:[['Apple Docs','https://developer.apple.com/documentation/avfoundation/audio_capture']],acts:[],pkgs:[]},
bt:{links:[['Apple BLE','https://developer.apple.com/bluetooth/'],['Android BLE','https://developer.android.com/develop/connectivity/bluetooth/btle']],acts:[],pkgs:['flutter_reactive_ble']},
loc:{links:[['Apple Location','https://developer.apple.com/documentation/corelocation'],['Android Location','https://developer.android.com/develop/sensors-and-location/location']],acts:[],pkgs:['geolocator']},
contacts:{links:[['Apple Contacts','https://developer.apple.com/documentation/contacts']],acts:[],pkgs:['contacts_service']},
cal:{links:[['Apple EventKit','https://developer.apple.com/documentation/eventkit']],acts:[],pkgs:['device_calendar']},
health:{links:[['Apple HealthKit','https://developer.apple.com/documentation/healthkit']],acts:[],pkgs:['flutter_health']},
photos:{links:[['Apple PhotoKit','https://developer.apple.com/documentation/photokit'],['Android Media','https://developer.android.com/training/data-storage/shared/media']],acts:[],pkgs:['image_picker','photo_manager']},
biometric:{links:[['Apple LocalAuth','https://developer.apple.com/documentation/localauthentication'],['Android Biometric','https://developer.android.com/training/sign-in/biometric-auth']],acts:[],pkgs:['local_auth']},
tracking:{links:[['Apple ATT','https://developer.apple.com/documentation/apptrackingtransparency']],acts:[],pkgs:['app_tracking_transparency']},
inet:{links:[['Android Network','https://developer.android.com/training/basics/network-ops']],acts:[],pkgs:[]},
notif:{links:[['Android Notif','https://developer.android.com/develop/ui/views/notifications'],['Firebase FCM','https://firebase.google.com/docs/cloud-messaging/flutter/client']],acts:[['flutterfire configure','dart pub global activate flutterfire_cli && flutterfire configure']],pkgs:['firebase_messaging','flutter_local_notifications']},
push:{links:[['Firebase FCM','https://firebase.google.com/docs/cloud-messaging/flutter/client'],['FlutterFire','https://firebase.flutter.dev/docs/messaging/overview'],['APNs Setup','https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server']],acts:[['flutterfire configure','dart pub global activate flutterfire_cli && flutterfire configure']],pkgs:['firebase_messaging','firebase_core'],iosReq:'aps-environment entitlement + Xcode Push Notifications capability',androidReq:'FCM SDK (google-services.json)'},
alarm:{links:[['Android AlarmManager','https://developer.android.com/reference/android/app/AlarmManager']],acts:[],pkgs:['android_alarm_manager_plus']},
bgmode:{links:[['Apple Background','https://developer.apple.com/documentation/backgroundtasks'],['Flutter Background','https://docs.flutter.dev/develop/platform-integration/background-processes']],acts:[],pkgs:['workmanager']},
storage:{links:[['Android Storage','https://developer.android.com/training/data-storage'],['Apple Files','https://developer.apple.com/documentation/fileprovider']],acts:[],pkgs:['path_provider','permission_handler']},
local:{links:[['Apple NetworkExtension','https://developer.apple.com/documentation/networkextension']],acts:[],pkgs:[]},
sandbox:{links:[['Apple Sandbox','https://developer.apple.com/documentation/security/app_sandbox']],acts:[],pkgs:[]},
overlay:{links:[['Android Overlay','https://developer.android.com/reference/android/view/WindowManager.LayoutParams#TYPE_APPLICATION_OVERLAY']],acts:[],pkgs:[]},
speech:{links:[['Apple Speech','https://developer.apple.com/documentation/speech']],acts:[],pkgs:['speech_to_text']},
siri:{links:[['Apple SiriKit','https://developer.apple.com/documentation/sirikit']],acts:[],pkgs:[]},
homekit:{links:[['Apple HomeKit','https://developer.apple.com/documentation/homekit']],acts:[],pkgs:[]},
motion:{links:[['Apple CoreMotion','https://developer.apple.com/documentation/coremotion'],['Android Sensors','https://developer.android.com/develop/sensors-and-location/sensors/sensors_overview']],acts:[],pkgs:['sensors_plus']},
fgsvc:{links:[['Android ForegroundService','https://developer.android.com/develop/background-work/services/foreground-services']],acts:[],pkgs:['flutter_foreground_task']},
};
const PC=[
{c:'Hardware & Sensors',items:[
{id:'camera',l:'Camera',d:'Photo and video capture',w:'User consent dialog on first access',p:{ios:'NSCameraUsageDescription',android:'CAMERA',macos:'com.apple.security.device.camera'},sdk:{ios:'7+',android:'1+'}},
{id:'mic',l:'Microphone',d:'Audio recording and voice input',w:'Background recording needs extra configuration',p:{ios:'NSMicrophoneUsageDescription',android:'RECORD_AUDIO',macos:'com.apple.security.device.audio-input'},sdk:{ios:'7+',android:'1+'}},
{id:'bt',l:'Bluetooth',d:'BLE device communication',w:'Android 12+ splits into granular permissions',p:{ios:'NSBluetoothAlwaysUsageDescription'},sdk:{ios:'13+',android:'31+'},subs:[
{id:'conn',l:'Connect',android:'BLUETOOTH_CONNECT',sdk:'31+'},{id:'scan',l:'Scan',android:'BLUETOOTH_SCAN',sdk:'31+'},{id:'adv',l:'Advertise',android:'BLUETOOTH_ADVERTISE',sdk:'31+'}]},
{id:'nfc',l:'NFC',d:'Near-field communication',p:{android:'NFC'},sdk:{android:'10+'}},
{id:'uwb',l:'UWB Ranging',d:'Ultra-wideband spatial awareness',p:{android:'UWB_RANGING'},sdk:{android:'31+'}},
{id:'motion',l:'Motion & Sensors',d:'Accelerometer, gyroscope, body sensors',w:'High-frequency access increases battery drain',p:{ios:'NSMotionUsageDescription'},sdk:{ios:'5+',android:'20+'},subs:[
{id:'body',l:'Body Sensors',android:'BODY_SENSORS',sdk:'20+'},{id:'activity',l:'Activity Recognition',android:'ACTIVITY_RECOGNITION',sdk:'29+'},{id:'highfreq',l:'High-freq Sensors',android:'HIGH_SAMPLING_RATE_SENSORS',sdk:'31+'}]},
{id:'fall',l:'Fall Detection',d:'Detect user falls for emergency alerts',p:{ios:'NSFallDetectionUsageDescription'},sdk:{ios:'15+'}},
]},
{c:'Location',items:[
{id:'loc',l:'Location',d:'GPS and network-based positioning',w:'Background access triggers Play Store review',p:{},subs:[
{id:'fine',l:'Fine (GPS)',ios:'NSLocationWhenInUseUsageDescription',android:'ACCESS_FINE_LOCATION',sdk:'iOS 8+ / API 1+'},
{id:'coarse',l:'Coarse (Network)',android:'ACCESS_COARSE_LOCATION',sdk:'API 1+'},
{id:'bg',l:'Background',android:'ACCESS_BACKGROUND_LOCATION',sdk:'API 29+',w:'Separate Play Store justification required'},
{id:'always',l:'Always',ios:'NSLocationAlwaysAndWhenInUseUsageDescription',sdk:'iOS 11+',w:'Apple review scrutiny'}]},
]},
{c:'Personal Data',items:[
{id:'contacts',l:'Contacts',d:'Access device contact list',p:{ios:'NSContactsUsageDescription',macos:'com.apple.security.personal-information.addressbook'},sdk:{ios:'6+'},subs:[
{id:'read',l:'Read',android:'READ_CONTACTS',sdk:'API 1+'},{id:'write',l:'Write',android:'WRITE_CONTACTS',sdk:'API 1+'}]},
{id:'cal',l:'Calendar',d:'Read and modify calendar events',p:{ios:'NSCalendarsUsageDescription',macos:'com.apple.security.personal-information.calendars'},sdk:{ios:'6+'},subs:[
{id:'read',l:'Read',android:'READ_CALENDAR',sdk:'API 1+'},{id:'write',l:'Write',android:'WRITE_CALENDAR',sdk:'API 1+'},
{id:'full',l:'Full Access',ios:'NSCalendarsFullAccessUsageDescription',sdk:'iOS 17+'},{id:'wo',l:'Write Only',ios:'NSCalendarsWriteOnlyAccessUsageDescription',sdk:'iOS 17+'}]},
{id:'reminders',l:'Reminders',d:'Access device reminders',p:{ios:'NSRemindersUsageDescription'},sdk:{ios:'6+'},subs:[
{id:'full',l:'Full Access',ios:'NSRemindersFullAccessUsageDescription',sdk:'iOS 17+'}]},
{id:'health',l:'Health',d:'HealthKit data read/write',w:'Requires HealthKit entitlement + Apple review',p:{},subs:[
{id:'read',l:'Read',ios:'NSHealthShareUsageDescription',sdk:'iOS 8+'},{id:'write',l:'Write',ios:'NSHealthUpdateUsageDescription',sdk:'iOS 8+'}]},
{id:'photos',l:'Photos & Media',d:'Photo library and media file access',w:'iOS 14+ shows limited library picker',p:{ios:'NSPhotoLibraryUsageDescription'},sdk:{ios:'6+',android:'33+'},subs:[
{id:'add',l:'Add Only',ios:'NSPhotoLibraryAddUsageDescription',sdk:'iOS 11+'},
{id:'images',l:'Images',android:'READ_MEDIA_IMAGES',sdk:'API 33+'},{id:'video',l:'Video',android:'READ_MEDIA_VIDEO',sdk:'API 33+'},{id:'audio',l:'Audio',android:'READ_MEDIA_AUDIO',sdk:'API 33+'}]},
{id:'music',l:'Apple Music',d:'Apple Music catalog access',p:{ios:'NSAppleMusicUsageDescription'},sdk:{ios:'9.3+'}},
{id:'speech',l:'Speech Recognition',d:'On-device speech-to-text',p:{ios:'NSSpeechRecognitionUsageDescription'},sdk:{ios:'10+'}},
{id:'biometric',l:'Biometric / Face ID',d:'Fingerprint and face authentication',p:{ios:'NSFaceIDUsageDescription',android:'USE_BIOMETRIC'},sdk:{ios:'11+',android:'28+'}},
{id:'identity',l:'Identity',d:'System identity verification',p:{ios:'NSIdentityUsageDescription'},sdk:{ios:'16+'}},
{id:'focus',l:'Focus Status',d:'Read Focus / Do Not Disturb state',p:{ios:'NSFocusStatusUsageDescription'},sdk:{ios:'15+'}},
{id:'tracking',l:'App Tracking',d:'Cross-app tracking (ATT)',w:'Apple ATT review — rejection risk without clear purpose',p:{ios:'NSUserTrackingUsageDescription'},sdk:{ios:'14+'}},
]},
{c:'Storage & Files',items:[
{id:'storage',l:'File Storage',d:'External storage and file access',w:'MANAGE_EXTERNAL_STORAGE triggers Play review',p:{},subs:[
{id:'read',l:'Read (deprecated)',android:'READ_EXTERNAL_STORAGE',sdk:'API 1+ (dep 33)'},{id:'write',l:'Write (deprecated)',android:'WRITE_EXTERNAL_STORAGE',sdk:'API 1+ (dep 30)'},
{id:'manage',l:'Manage All',android:'MANAGE_EXTERNAL_STORAGE',sdk:'API 30+',w:'Play Store justification required'},
{id:'ro',l:'Files Read',macos:'com.apple.security.files.user-selected.read-only'},{id:'rw',l:'Files Write',macos:'com.apple.security.files.user-selected.read-write'}]},
{id:'netvol',l:'Network Volumes',d:'Access network-mounted drives',p:{ios:'NSNetworkVolumesUsageDescription'},sdk:{ios:'13+'}},
{id:'remvol',l:'Removable Volumes',d:'Access USB / SD storage',p:{ios:'NSRemovableVolumesUsageDescription'},sdk:{ios:'13+'}},
{id:'fileprov',l:'File Provider',d:'File provider extension access',p:{ios:'NSFileProviderDomainUsageDescription'},sdk:{ios:'11+'}},
]},
{c:'Network',items:[
{id:'inet',l:'Internet',d:'Outbound network access',p:{android:'INTERNET',macos:'com.apple.security.network.client'},sdk:{android:'1+'}},
{id:'netstate',l:'Network State',d:'Check connectivity status',p:{android:'ACCESS_NETWORK_STATE'},sdk:{android:'1+'},subs:[{id:'wifi',l:'WiFi State',android:'ACCESS_WIFI_STATE',sdk:'API 1+'}]},
{id:'local',l:'Local Network',d:'Discover and connect LAN devices',w:'iOS shows local network consent dialog',p:{ios:'NSLocalNetworkUsageDescription'},sdk:{ios:'14+'}},
{id:'nearwifi',l:'Nearby WiFi',d:'WiFi-based proximity detection',p:{android:'NEARBY_WIFI_DEVICES'},sdk:{android:'33+'}},
{id:'nearby',l:'Nearby Interaction',d:'Spatial awareness between devices',p:{ios:'NSNearbyInteractionUsageDescription'},sdk:{ios:'14+'}},
{id:'netserver',l:'Network Server',d:'Accept incoming connections (macOS)',p:{macos:'com.apple.security.network.server'}},
]},
{c:'Notifications & Alarms',items:[
{id:'notif',l:'Notifications',d:'Push notification display',p:{android:'POST_NOTIFICATIONS'},sdk:{android:'33+'}},
{id:'push',l:'Push (FCM/APNs)',d:'Remote push notification delivery',w:'iOS: aps-environment entitlement + APNs 인증서 필요. Android: FCM SDK setup 필요',p:{android:'com.google.android.c2dm.permission.RECEIVE'},sdk:{android:'API 1+'}},
{id:'alarm',l:'Alarms',d:'Schedule alarms and reminders',w:'Exact alarm requires user opt-in on Android 12+',p:{},subs:[
{id:'exact',l:'Exact Alarm',android:'SCHEDULE_EXACT_ALARM',sdk:'API 31+',w:'User can revoke in Settings'}]},
{id:'boot',l:'Boot Completed',d:'Run on device startup',p:{android:'RECEIVE_BOOT_COMPLETED'},sdk:{android:'1+'}},
{id:'fgsvc',l:'Foreground Service',d:'Long-running background tasks',p:{android:'FOREGROUND_SERVICE'},sdk:{android:'28+'}},
]},
{c:'Background & Fetch',items:[
{id:'bgmode',l:'Background Modes (iOS)',d:'iOS UIBackgroundModes — Info.plist 배열 설정',w:'Xcode Signing & Capabilities에서 togg 권장',p:{},subs:[
{id:'audio',l:'Audio',ios:'UIBackgroundModes:audio'},
{id:'location',l:'Location',ios:'UIBackgroundModes:location'},
{id:'voip',l:'VoIP',ios:'UIBackgroundModes:voip'},
{id:'fetch',l:'Background Fetch',ios:'UIBackgroundModes:fetch'},
{id:'remote',l:'Remote Notifications',ios:'UIBackgroundModes:remote-notification'},
{id:'processing',l:'Background Processing',ios:'UIBackgroundModes:processing'}]},
{id:'bgtransfer',l:'Background Transfer',d:'Large file upload/download in background',p:{ios:'NSBackgroundUsageDescription'},sdk:{ios:'13+'}},
]},
{c:'System & UI',items:[
{id:'vibrate',l:'Vibrate',d:'Haptic feedback control',p:{android:'VIBRATE'},sdk:{android:'1+'}},
{id:'wakelock',l:'Wake Lock',d:'Prevent screen sleep',p:{android:'WAKE_LOCK'},sdk:{android:'1+'}},
{id:'overlay',l:'Overlay Window',d:'Draw over other apps',w:'Sensitive permission — Play review required',p:{android:'SYSTEM_ALERT_WINDOW'},sdk:{android:'1+'}},
]},
{c:'macOS Security',items:[
{id:'sandbox',l:'App Sandbox',d:'macOS sandboxing requirement',w:'Required for App Store distribution',p:{macos:'com.apple.security.app-sandbox'}},
]},
{c:'Integrations',items:[
{id:'siri',l:'SiriKit',d:'Siri voice shortcuts',p:{ios:'NSSiriUsageDescription'},sdk:{ios:'10+'}},
{id:'homekit',l:'HomeKit',d:'Smart home device control',p:{ios:'NSHomeKitUsageDescription'},sdk:{ios:'8+'}},
{id:'gamecenter',l:'Game Center',d:'Game Center friend list',p:{ios:'NSGKFriendListUsageDescription'},sdk:{ios:'14+'}},
{id:'tvprov',l:'TV Provider',d:'Video subscriber account',p:{ios:'NSVideoSubscriberAccountUsageDescription'},sdk:{ios:'10+'}},
]},
];
`;

export const platformCss = `
.ptag{padding:1px 5px;border-radius:3px;font-size:9px;border:1px solid var(--ib);background:transparent;color:var(--fg);cursor:pointer;opacity:.35;transition:all .15s}
.ptag:hover{opacity:.7}
.ptag.on{opacity:1}
.ptag.on.t-ios{border-color:#007aff;color:#007aff}
.ptag.on.t-android{border-color:#3fb950;color:#3fb950}
.ptag.on.t-macos{border-color:#d29922;color:#d29922}
.pcat{margin-bottom:2px}
.pcat-h{display:flex;align-items:center;gap:4px;padding:4px 0;cursor:pointer;font-size:11px;font-weight:600;opacity:.7;border-bottom:1px solid var(--ib)}
.pcat-h:hover{opacity:1}
.pcat-h .cnt{margin-left:auto;font-weight:400;font-size:10px;opacity:.6}
.pitem-h{display:flex;align-items:center;gap:4px;padding:4px 2px;cursor:pointer;border-bottom:1px solid var(--ib);font-size:12px}
.pitem-h:hover{background:var(--ibg)}
.pitem-h .arrow{transition:transform .15s;flex-shrink:0;opacity:.4}
.pitem-h .arrow.open{transform:rotate(90deg)}
.pitem-h .pl{flex:1;min-width:0}
.pitem-h .tags{display:flex;gap:2px;flex-shrink:0}
.pbody{padding:4px 0 8px 18px;border-left:2px solid var(--ib);margin-left:6px}
.pdesc{font-size:11px;opacity:.7;padding:1px 0}
.pwarn{font-size:10px;color:#d29922;padding:1px 0}
.psub{display:flex;align-items:center;gap:5px;padding:3px 0;font-size:11px;border-bottom:1px solid var(--ib)}
.psub .sdk{margin-left:auto;font-size:9px;white-space:nowrap;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground);padding:1px 5px;border-radius:3px;font-weight:600}
`;
