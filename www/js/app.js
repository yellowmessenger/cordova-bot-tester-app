// UI: Quick Start / Profiles / Info tabs, profile form and payload editor,
// mirroring the iOS tester app.
(function () {
  'use strict';

  // Keep in sync with the version in config.xml.
  var APP_VERSION = '1.0.0';

  var $ = function (id) {
    return document.getElementById(id);
  };

  // ---------------------------------------------------------------------------
  // Dialogs and action sheet

  function showAlert(title, message) {
    $('dialog-title').textContent = title || '';
    $('dialog-message').textContent = message;
    $('dialog').hidden = false;
  }

  function showError(message) {
    showAlert('Error', message);
  }

  function errorText(e) {
    if (!e) return 'Unknown error';
    return typeof e === 'string' ? e : e.message || JSON.stringify(e);
  }

  // Cross-platform replacement for the iOS app's UIAlertController sheet.
  function showSheet(title, actions) {
    $('sheet-title').textContent = title;
    var container = $('sheet-actions');
    container.innerHTML = '';
    actions.forEach(function (action) {
      var button = document.createElement('button');
      button.className = 'sheet-button' + (action.destructive ? ' destructive' : '');
      button.textContent = action.title;
      button.addEventListener('click', function () {
        hideSheet();
        action.onPress();
      });
      container.appendChild(button);
    });
    $('sheet').hidden = false;
  }

  function hideSheet() {
    $('sheet').hidden = true;
  }

  // ---------------------------------------------------------------------------
  // Navigation: three tabs, plus a stack for the profile form and payload.

  var TABS = {
    'quick-start': {view: 'view-quick-start', title: 'Quick Start'},
    profiles: {view: 'view-profiles', title: 'Profiles', action: '＋', onAction: openProfileForm},
    info: {view: 'view-info', title: 'Info'},
  };

  var currentTab = 'quick-start';
  var stack = []; // pushed screens: {view, title, action, onAction}

  function showScreen(screen, canGoBack) {
    document.querySelectorAll('.view').forEach(function (v) {
      v.hidden = v.id !== screen.view;
    });
    $('header-title').textContent = screen.title;
    $('header-back').hidden = !canGoBack;
    var action = $('header-action');
    action.hidden = !screen.action;
    action.textContent = screen.action || '';
    action.onclick = screen.onAction || null;
    $('tab-bar').hidden = canGoBack;
  }

  function render() {
    if (stack.length) {
      showScreen(stack[stack.length - 1], true);
    } else {
      showScreen(TABS[currentTab], false);
    }
  }

  function selectTab(tab) {
    currentTab = tab;
    stack = [];
    document.querySelectorAll('#tab-bar button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    if (tab === 'profiles') renderProfileList();
    if (tab === 'info') renderInfo();
    render();
  }

  function push(screen) {
    stack.push(screen);
    render();
  }

  function pop() {
    stack.pop();
    if (!stack.length && currentTab === 'profiles') renderProfileList();
    render();
  }

  // ---------------------------------------------------------------------------
  // Quick Start

  function quickStart() {
    var botId = $('quick-bot-id').value.trim();
    if (!botId) {
      showError('Enter a valid bot id to start');
      return;
    }
    $('quick-bot-id').blur();
    Chatbot.quickStart(botId);
  }

  // ---------------------------------------------------------------------------
  // Profiles list

  function renderProfileList() {
    var bots = BotStore.getBotList();
    var list = $('profile-list');
    list.innerHTML = '';
    bots.forEach(function (bot) {
      var item = document.createElement('li');
      item.className = 'tappable';
      var text = document.createElement('div');
      var title = document.createElement('div');
      title.className = 'title';
      title.textContent = bot.name || 'Unnamed';
      var subtitle = document.createElement('div');
      subtitle.className = 'subtitle';
      subtitle.textContent = bot.id;
      text.append(title, subtitle);
      var chevron = document.createElement('span');
      chevron.className = 'chevron';
      chevron.textContent = '›';
      item.append(text, chevron);
      item.addEventListener('click', function () {
        showProfileActions(bot);
      });
      list.appendChild(item);
    });
    $('profile-empty').hidden = bots.length > 0;
  }

  function showProfileActions(bot) {
    var actions = [{title: '🤖 Start Bot', onPress: function () { Chatbot.startBot(bot); }}];
    // Same visibility rules as the iOS tester app.
    if (bot.apiKey && bot.ymAuthToken && bot.enableNotification) {
      actions.push({
        title: 'Register Device',
        onPress: function () {
          Chatbot.registerDevice(bot)
            .then(function () { showAlert('', 'Device Registered Successfully'); })
            .catch(function (e) { showError(errorText(e)); });
        },
      });
    }
    if (bot.apiKey && bot.enableNotification) {
      actions.push({
        title: 'Unlink Device Token',
        onPress: function () {
          Chatbot.unlinkDeviceToken(bot)
            .then(function () { showAlert('', 'Device Unlinked Successfully'); })
            .catch(function (e) { showError(errorText(e)); });
        },
      });
    }
    actions.push(
      {title: 'Edit', onPress: function () { openProfileForm(bot.id); }},
      {
        title: 'Delete',
        destructive: true,
        onPress: function () {
          BotStore.deleteBot(bot.id);
          renderProfileList();
        },
      },
    );
    showSheet(bot.id, actions);
  }

  // ---------------------------------------------------------------------------
  // Add / Edit Profile

  var form = $('profile-form');
  var editing = null; // bot id when editing
  var payload = '';

  function segmentValue(name) {
    var selected = form.querySelector('.segmented[data-name="' + name + '"] .selected');
    return selected ? selected.dataset.value : null;
  }

  function setSegment(name, value) {
    form.querySelectorAll('.segmented[data-name="' + name + '"] button').forEach(function (b) {
      b.classList.toggle('selected', b.dataset.value === String(value));
    });
    if (name === 'version') updateVersionFields();
  }

  // v3-only and v1/v2-only fields, like the iOS app's profile form.
  function updateVersionFields() {
    var isV3 = segmentValue('version') === '3';
    form.querySelectorAll('.v3-only').forEach(function (el) { el.hidden = !isV3; });
    form.querySelectorAll('.v12-only').forEach(function (el) { el.hidden = isV3; });
  }

  function setPayloadPreview() {
    $('payload-preview').textContent = payload || 'Tap to add a JSON payload';
  }

  function openProfileForm(botId) {
    editing = typeof botId === 'string' ? botId : null;
    var bot = editing ? BotStore.getBot(editing) : BotStore.newBot();
    if (editing && !bot) {
      showError('Cannot find bot ' + editing + '. Please reinstall the app');
      return;
    }
    form.elements.id.value = bot.id;
    form.elements.id.disabled = !!editing;
    ['name', 'initialUserMessage', 'ymAuthToken', 'apiKey', 'customBaseURL'].forEach(function (f) {
      form.elements[f].value = bot[f];
    });
    ['enableSpeech', 'enableLiteVersion', 'enableNotification'].forEach(function (f) {
      form.elements[f].checked = bot[f];
    });
    setSegment('version', bot.version);
    setSegment('activationMode', bot.activationMode);
    payload = bot.payload;
    setPayloadPreview();
    push({
      view: 'view-profile-form',
      title: editing ? 'Edit Profile' : 'Add Profile',
      action: 'Save',
      onAction: saveProfile,
    });
  }

  function saveProfile() {
    var id = form.elements.id.value.trim();
    if (!id) {
      showError('Bot ID cannot be empty');
      return;
    }
    var value = function (f) { return form.elements[f].value.trim(); };
    var checked = function (f) { return form.elements[f].checked; };
    BotStore.saveBot(BotStore.newBot({
      id: id,
      name: value('name'),
      ymAuthToken: value('ymAuthToken'),
      customBaseURL: value('customBaseURL'),
      apiKey: value('apiKey'),
      version: Number(segmentValue('version')),
      enableSpeech: checked('enableSpeech'),
      enableLiteVersion: checked('enableLiteVersion'),
      enableNotification: checked('enableNotification'),
      date: Date.now(),
      payload: payload,
      activationMode: segmentValue('activationMode'),
      initialUserMessage: value('initialUserMessage'),
    }));
    pop();
  }

  // ---------------------------------------------------------------------------
  // Payload editor

  function openPayload() {
    if (!form.elements.id.value.trim()) {
      showAlert('', 'Enter the bot id first');
      return;
    }
    $('payload-text').value = payload;
    push({view: 'view-payload', title: 'Payload', action: 'Save', onAction: savePayload});
  }

  function savePayload() {
    var text = $('payload-text').value;
    if (!BotStore.isValidPayload(text)) {
      showError('Payload not compatible with JSON format');
      return;
    }
    // Like the iOS app, persist straight away if the profile already exists.
    var bot = BotStore.getBot(form.elements.id.value.trim());
    if (bot) {
      bot.payload = text;
      BotStore.saveBot(bot);
    }
    payload = text;
    setPayloadPreview();
    pop();
  }

  // ---------------------------------------------------------------------------
  // Info

  function renderInfo() {
    var plugins = cordova.require('cordova/plugin_list').metadata || {};
    var rows = [
      ['App Version', APP_VERSION],
      ['cordova-plugin-ymchat', plugins['cordova-plugin-ymchat'] || '-'],
      ['Cordova platform', cordova.platformId + ' ' + cordova.platformVersion],
    ];
    var list = $('info-list');
    list.innerHTML = '';
    rows.forEach(function (row) {
      var item = document.createElement('li');
      var label = document.createElement('span');
      label.textContent = row[0];
      var value = document.createElement('span');
      value.className = 'value';
      value.textContent = row[1];
      item.append(label, value);
      list.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------------
  // Startup

  function onDeviceReady() {
    $('quick-start').addEventListener('click', quickStart);
    $('quick-bot-id').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') quickStart();
    });
    document.querySelectorAll('#tab-bar button').forEach(function (b) {
      b.addEventListener('click', function () { selectTab(b.dataset.tab); });
    });
    $('header-back').addEventListener('click', pop);
    form.querySelectorAll('.segmented button').forEach(function (b) {
      b.addEventListener('click', function () {
        setSegment(b.parentElement.dataset.name, b.dataset.value);
      });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $('open-payload').addEventListener('click', openPayload);
    $('sheet-cancel').addEventListener('click', hideSheet);
    $('sheet').addEventListener('click', function (e) {
      if (e.target === $('sheet')) hideSheet();
    });
    $('dialog-close').addEventListener('click', function () { $('dialog').hidden = true; });

    // Android hardware back: close overlays, then pop the stack.
    document.addEventListener('backbutton', function () {
      if (!$('dialog').hidden) $('dialog').hidden = true;
      else if (!$('sheet').hidden) hideSheet();
      else if (stack.length) pop();
      else navigator.app.exitApp();
    });

    Chatbot.listen({
      onEvent: function (event) { console.log('[YMChat] event', JSON.stringify(event)); },
      onClose: function () { console.log('[YMChat] bot closed'); },
      onLoadFailed: function () { showError('Bot failed to load. Check the bot id and network.'); },
    });
    Push.initPush();
    selectTab('quick-start');
  }

  document.addEventListener('deviceready', onDeviceReady, false);
})();
