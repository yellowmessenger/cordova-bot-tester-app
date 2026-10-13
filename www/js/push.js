// Push notification setup, equivalent of the Firebase setup in the iOS
// tester app's AppDelegate: ask for permission, then store the FCM token so
// profiles with "Push Notification" enabled pass it to the SDK.
//
// Firebase is optional. Cordova Firebase plugins need both Firebase config
// files at build time, so this app doesn't include one by default. To test
// push, add cordova-plugin-firebasex (see README); this file picks it up.
(function () {
  'use strict';

  function initPush() {
    var firebase = window.FirebasePlugin;
    if (!firebase) {
      console.log('[push] Push notifications not set up (optional): no Firebase plugin');
      return;
    }
    firebase.grantPermission(function () {}, function () {});
    firebase.getToken(
      function (token) {
        if (token) BotStore.setFcmToken(token);
      },
      function (error) {
        console.log('[push] Push notifications not set up (optional):', error);
      },
    );
    firebase.onTokenRefresh(function (token) {
      if (token) BotStore.setFcmToken(token);
    });
  }

  window.Push = {initPush: initPush};
})();
