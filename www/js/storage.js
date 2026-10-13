// Profile model and on-device storage. Mirrors `struct Bot` and the
// UserDefaults storage in the iOS tester app, with the same keys and JSON
// fields as the React Native and Flutter tester apps.
(function () {
  'use strict';

  var BOT_PREFIX = 'bot-';
  var FCM_TOKEN_KEY = 'fcmToken';

  function newBot(fields) {
    return Object.assign(
      {
        id: '',
        name: '',
        ymAuthToken: '',
        customBaseURL: '',
        apiKey: '',
        version: 1, // 1, 2 or 3
        enableSpeech: false,
        enableLiteVersion: false,
        enableNotification: false,
        date: Date.now(), // sorts the profile list, newest first
        payload: '', // raw JSON text, validated in the payload editor
        activationMode: 'chat', // 'chat' | 'voice'
        initialUserMessage: '',
      },
      fields,
    );
  }

  function getBotList() {
    var bots = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.indexOf(BOT_PREFIX) !== 0) continue;
      try {
        bots.push(newBot(JSON.parse(localStorage.getItem(key))));
      } catch (e) {
        // Skip a corrupt entry rather than breaking the whole list.
      }
    }
    return bots.sort(function (a, b) {
      return b.date - a.date;
    });
  }

  function getBot(botId) {
    var value = localStorage.getItem(BOT_PREFIX + botId);
    return value ? newBot(JSON.parse(value)) : null;
  }

  function saveBot(bot) {
    localStorage.setItem(BOT_PREFIX + bot.id, JSON.stringify(bot));
  }

  function deleteBot(botId) {
    localStorage.removeItem(BOT_PREFIX + botId);
  }

  function getFcmToken() {
    return localStorage.getItem(FCM_TOKEN_KEY) || '';
  }

  function setFcmToken(token) {
    localStorage.setItem(FCM_TOKEN_KEY, token);
  }

  // A payload must be empty or a JSON object.
  function isValidPayload(text) {
    if (text.trim() === '') return true;
    try {
      var parsed = JSON.parse(text);
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch (e) {
      return false;
    }
  }

  window.BotStore = {
    newBot: newBot,
    getBotList: getBotList,
    getBot: getBot,
    saveBot: saveBot,
    deleteBot: deleteBot,
    getFcmToken: getFcmToken,
    setFcmToken: setFcmToken,
    isValidPayload: isValidPayload,
  };
})();
