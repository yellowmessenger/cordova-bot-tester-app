# Yellow Bot Cordova (Cordova Bot Tester App)

Cordova port of the iOS Bot Tester App. It runs on **iOS and Android** and tests bots through the [`cordova-plugin-ymchat`](https://www.npmjs.com/package/cordova-plugin-ymchat) plugin. Use it to try v1, v2 and v3 widgets without embedding the SDK into a real host app first.

| | Version |
|---|---|
| Cordova CLI | 13 (local dev dependency, run with `npx cordova`) |
| cordova-ios / cordova-android | 8.1.1 / 15.1.0 |
| cordova-plugin-ymchat | 3.4.8 |
| Native YMChat (iOS / Android) | 2.4.3 / 3.5.5 (pulled in by the plugin) |
| Bundle id / applicationId | `ai.yellow.demoapp` |
| Minimum OS | iOS 15.0 / Android 7.0 (API 24) |

The UI is plain HTML, CSS and JavaScript in `www/`, with no framework or build step.

## Requirements

- Node 18+
- **iOS:** Xcode, CocoaPods (`brew install cocoapods`), an iOS 15+ simulator or device
- **Android:** JDK 17, the Android SDK (API 35) and **Gradle** (`brew install gradle`). Cordova uses the system Gradle once to generate the project's Gradle wrapper.

## Setup and running

```bash
npm install
npx cordova prepare      # creates platforms/ and plugins/ from package.json
npm run ios              # cordova run ios (opens the simulator)
npm run android          # cordova run android (emulator or device)
```

Build only: `npm run build:ios` / `npm run build:android`. Pick a simulator with `npx cordova run ios --target "iPhone 16"`.

`platforms/` and `plugins/` are generated, so they aren't committed. Delete them and run `npx cordova prepare` to start clean.

## Testing a bot

The app mirrors the iOS tester app: three tabs, same fields, same behaviour.

### Quick Start

Enter a **Bot Id** and tap **Start Chat Bot**. Launches the bot with SDK defaults (v1 widget, no auth token, no payload). Nothing is saved.

### Profiles

Saved bot configs, stored in the web view's `localStorage` (the equivalent of `UserDefaults` in the iOS app).

1. Tap **＋** to add a profile, or tap an existing one and choose **Edit**.
2. Fill in the fields:

   | Field | Notes |
   |---|---|
   | Bot Id | Required. Can't be changed after the profile is created. |
   | Name | Label shown in the list. |
   | Version | `v1`, `v2` or `v3` widget. |
   | Activation Mode | **v3 only.** `chat` or `voice`. |
   | Initial Message | **v3 only.** Optional first user message. |
   | Enable Speech | **v1/v2 only.** |
   | Use Lite Version | **v1/v2 only.** |
   | YMAuthToken | Optional auth token. |
   | Api Key | Needed for Register Device / Unlink Device Token. |
   | Push Notification | Passes the FCM token to the SDK as the device token. |
   | Custom Base URL | Leave empty for the default region (R0). |
   | Payload | JSON object sent with the session. Validated before saving. |

3. Tap **Save**. Tap the profile to open the action sheet:
   - **🤖 Start Bot**
   - **Register Device**: shown when Api Key, YMAuthToken and Push Notification are all set
   - **Unlink Device Token**: shown when Api Key and Push Notification are set
   - **Edit** / **Delete**

### Info

Shows the app version, the installed `cordova-plugin-ymchat` version and the Cordova platform.

## Push notifications (optional)

Unlike the native, React Native and Flutter apps, this app doesn't include Firebase by default. Cordova Firebase plugins need **both** `GoogleService-Info.plist` and `google-services.json` at build time, and the Android build fails without them.

To test push:

1. Put `GoogleService-Info.plist` and `google-services.json` (for `ai.yellow.demoapp`) in the project root.
2. `npx cordova plugin add cordova-plugin-firebasex`
3. Rebuild. `www/js/push.js` detects the plugin, asks for notification permission and stores the FCM token. Profiles with **Push Notification** on then pass it to the SDK.

## Where things live

| Path | What |
|---|---|
| `www/index.html` | All screens, tab bar, action sheet and dialog |
| `www/css/index.css` | Styles |
| `www/js/app.js` | UI: navigation, profile form, payload editor, Info, SDK event listeners |
| `www/js/chatbot.js` | Profile → `cordova.plugins.ymchat` config (equivalent of `Bot.toYMConfig`), start / register / unlink |
| `www/js/storage.js` | Profile model and persistence (`BotStore`) |
| `www/js/push.js` | Optional Firebase push setup |
| `config.xml` | App id/name, iOS deployment target and usage strings, Android SDK levels and permissions |
| `hooks/ios-pods-deployment-target.js` | Raises the Pods project's deployment targets to iOS 15.0 before compiling |

## Plugin version

Use `cordova-plugin-ymchat` **3.4.8 or later**. 3.4.7 and earlier don't install or build cleanly on current tooling:

- iOS install fails with `ParseError: Opening and ending tag mismatch: "string" != "plist"`.
- iOS install clones the full CocoaPods specs repo from GitHub (several GB).
- Android builds fail on cordova-android 15 (`minSdkVersion 23 cannot be smaller than version 24`).

## Notes

- The YMChat pod declares iOS 12.0, which recent Xcode SDKs refuse to build. Cordova generates the Podfile, so `hooks/ios-pods-deployment-target.js` raises the Pods project's targets before compiling.
- On Android the plugin keeps the previous bot's payload when you call `setBotId`, so the app always sets the payload explicitly (an empty object when none is configured).
- `unlinkDeviceToken` uses the current SDK config's bot id and device token, so the app applies the profile before unlinking.
- On Android, `YMBotCloseEvent` currently fires twice per close (native SDK behaviour, also seen in the React Native and Flutter apps).
