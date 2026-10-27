# Yellow.ai Chatbot SDK: Cordova Demo App

A sample Cordova app that shows how to add a Yellow.ai chatbot to a Cordova or Ionic app with the [`cordova-plugin-ymchat`](https://www.npmjs.com/package/cordova-plugin-ymchat) plugin. It runs on iOS and Android, and the UI is plain HTML, CSS and JavaScript in `www/`.

Use it to:

- **See your bot running in a mobile app in a few minutes**, before you write any integration code.
- **Try different settings** (v1, v2 or v3 widget, auth token, payload, region) without rebuilding.
- **Copy working integration code**: starting the bot, listening to bot events, and registering for push notifications.

| | Version |
|---|---|
| cordova-plugin-ymchat | 3.4.8 |
| cordova-ios / cordova-android | 8.1.1 / 15.1.0 |
| Minimum OS | iOS 15.0 / Android 7.0 |

For the full SDK reference, see the [Cordova SDK docs](https://docs.yellow.ai/docs/platform_concepts/mobile/chatbot/cordova).

## Requirements

- Node 18 or later
- **iOS:** a Mac with Xcode and CocoaPods (`brew install cocoapods`)
- **Android:** JDK 17, the Android SDK (API 35) and Gradle (`brew install gradle`)
- Your bot's **Bot ID**. Open your bot on the [Yellow.ai platform](https://cloud.yellow.ai); the Bot ID is in the URL and starts with `x` (for example `x1587041004122`).

## Run the app

```bash
npm install
npx cordova prepare    # sets up the iOS and Android platforms and plugins
npm run ios            # opens in the iOS simulator
npm run android        # runs on an Android emulator or device
```

To pick a simulator: `npx cordova run ios --target "iPhone 16"`. To start clean, delete `platforms/` and `plugins/` and run `npx cordova prepare` again.

## Try your bot

### Quick Start

Enter your **Bot ID** and tap **Start Chat Bot**. The bot opens with default settings: v1 widget, no auth token, no payload.

### Profiles

Save a bot with specific settings and reuse it. Profiles are stored on the device.

1. Open the **Profiles** tab and tap **＋**.
2. Fill in the fields you need:

   | Field | What it does |
   |---|---|
   | Bot ID | Your bot's ID. Required. To change it later, delete the profile and add it again. |
   | Name | A label for the profile list. |
   | Version | Which chat widget to load: `v1`, `v2` or `v3`. |
   | Activation Mode | **v3 only.** Open the widget in `chat` or `voice` mode. |
   | Initial Message | **v3 only.** A message to start the conversation with. |
   | Enable Speech | **v1/v2 only.** Adds voice input to the widget. |
   | Use Lite Version | **v1/v2 only.** Loads the lite widget. |
   | YMAuthToken | A token that identifies the user, for bots that need an authenticated session. |
   | Api Key | Your Yellow.ai API key. Needed only for **Register Device** and **Unlink Device Token**. |
   | Push Notification | Sends this device's push token to the bot. Needs Firebase (see below). |
   | Custom Base URL | Leave empty if your bot is in the default region. For other regions use `https://rx.cloud.yellow.ai` (for example `https://r5.cloud.yellow.ai`), or your on-premise URL. |
   | Payload | Any JSON object you want to send to the bot when the chat starts, such as user details. Must be valid JSON. |

3. Tap **Save**, then tap the profile:
   - **Start Bot** opens the chat with this profile's settings.
   - **Register Device** links this device to the user for push notifications. Shown when Api Key, YMAuthToken and Push Notification are set.
   - **Unlink Device Token** stops push notifications to this device, for example on logout. Shown when Api Key and Push Notification are set.
   - **Edit** / **Delete**

### Info

Shows the app version, the `cordova-plugin-ymchat` version and the platform.

## Push notifications (optional)

Firebase isn't included by default, because Cordova's Firebase plugin needs both platform config files to build. To test push notifications from your bot:

1. In your own [Firebase project](https://console.firebase.google.com), add an iOS app and an Android app with the ID `ai.yellow.demoapp`. For iOS, upload your APNs key to Firebase.
2. Download `GoogleService-Info.plist` and `google-services.json` and put both in the project root.
3. Add the Firebase plugin: `npx cordova plugin add cordova-plugin-firebasex`
4. Map your Firebase service account key to your Bot ID, as described in [Push notifications for mobile SDKs](https://docs.yellow.ai/docs/platform_concepts/mobile/chatbot/sdk-faq-worflows/push-notifications-sdks).
5. Rebuild, turn on **Push Notification** in a profile, and use **Register Device**.

Push on a real iOS device needs a bundle ID and signing team from your Apple Developer account.

## Integration code to reuse

| File | What to look at |
|---|---|
| `www/js/chatbot.js` | Turning your settings into the `cordova.plugins.ymchat` config, starting the bot, registering and unlinking the device |
| `www/js/app.js` | Listening to bot events |
| `www/js/push.js` | Getting the Firebase push token when the Firebase plugin is installed |
| `config.xml` | iOS deployment target, usage descriptions, Android SDK levels and permissions |
| `hooks/ios-pods-deployment-target.js` | Fixing the iOS pods' deployment target before the build (see tips) |

## Tips for your own integration

- Use `cordova-plugin-ymchat` **3.4.8 or later**. Earlier versions fail to install on iOS or to build on cordova-android 15.
- **iOS:** the YMChat pod targets an iOS version that current Xcode won't build. Cordova regenerates the Podfile, so this app uses `hooks/ios-pods-deployment-target.js` to raise the pods to iOS 15.0. Copy the hook into your project if your build fails with a deployment target error.
- **Android:** the plugin keeps the previous bot's payload when you call `setBotId`. Always set the payload when you start the bot, even if it's an empty object.
- `unlinkDeviceToken` uses the bot ID and device token from the current config, so set the config before you call it.
- `YMBotCloseEvent` currently fires twice on Android when the bot closes. Make your close handler safe to run twice.

## Help

- [Cordova SDK docs](https://docs.yellow.ai/docs/platform_concepts/mobile/chatbot/cordova)
- [Mobile SDK FAQ](https://docs.yellow.ai/docs/platform_concepts/mobile/chatbot/sdk-faq-worflows/mobile-sdk-faq)
- Email [apps@yellow.ai](mailto:apps@yellow.ai)
