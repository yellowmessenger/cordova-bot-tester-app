// Bridges saved profiles to cordova-plugin-ymchat (cordova.plugins.ymchat).
(function () {
  'use strict';

  function sdk() {
    return cordova.plugins.ymchat;
  }

  // Equivalent of `Bot.toYMConfig` in the iOS tester app. setBotId() creates
  // a fresh config natively on both platforms, so it must be called first.
  function applyConfig(bot) {
    var ym = sdk();
    ym.setBotId(bot.id);
    ym.setVersion(bot.version);
    ym.showCloseButton(true);

    if (bot.version === 3) {
      ym.setActivationMode(bot.activationMode);
      if (bot.initialUserMessage) ym.setInitialUserMessage(bot.initialUserMessage);
    } else {
      ym.setEnableSpeech(bot.enableSpeech);
      ym.useLiteVersion(bot.enableLiteVersion);
    }

    if (bot.ymAuthToken) ym.setAuthenticationToken(bot.ymAuthToken);
    if (bot.enableNotification) ym.setDeviceToken(BotStore.getFcmToken());
    if (bot.customBaseURL) ym.setCustomURL(bot.customBaseURL);
    // Always set the payload: on Android the previous bot's payload otherwise
    // carries over into the next config.
    ym.setPayload(bot.payload.trim() ? JSON.parse(bot.payload) : {});
  }

  function startBot(bot) {
    applyConfig(bot);
    sdk().startChatbot();
  }

  // Quick Start: bot id only, everything else at SDK defaults.
  function quickStart(botId) {
    var ym = sdk();
    ym.setBotId(botId);
    ym.setPayload({});
    ym.showCloseButton(true);
    ym.startChatbot();
  }

  function registerDevice(bot) {
    return new Promise(function (resolve, reject) {
      applyConfig(bot);
      sdk().registerDevice(bot.apiKey, resolve, reject);
    });
  }

  // The plugin unlinks the device token of the current config, so the
  // profile (with its FCM token) is applied first.
  function unlinkDeviceToken(bot) {
    return new Promise(function (resolve, reject) {
      applyConfig(bot);
      sdk().unlinkDeviceToken(bot.apiKey, resolve, reject);
    });
  }

  // Native SDK events. The plugin keeps these callbacks registered.
  function listen(handlers) {
    var ym = sdk();
    ym.onEventFromBot(handlers.onEvent);
    ym.onBotClose(handlers.onClose);
    ym.onBotLoadFailed(handlers.onLoadFailed);
  }

  window.Chatbot = {
    startBot: startBot,
    quickStart: quickStart,
    registerDevice: registerDevice,
    unlinkDeviceToken: unlinkDeviceToken,
    listen: listen,
  };
})();
