// ===== mediator.js : UI中介层 =====
// 解耦UI与核心逻辑：UI不直接调用底层逻辑，统一通过 UIMediator 访问
// 职责：参数校验、防连点、事件广播、异常隔离

var UIMediator = (function() {
  'use strict';

  // ==================== 导航控制 ====================
  function navigate(screen) {
    if (!Debounce.throttle('navigate', 200)) return;
    if (typeof currentScreen === 'undefined') return;
    var prev = currentScreen;
    currentScreen = screen;
    // 通过事件总线广播导航事件，而非直接调用 render
    EventBus.emit('ui:navigate', { from: prev, to: screen });
    if (typeof render === 'function') {
      try { render(); } catch(e) { Logger.error('[UIMediator]', 'navigate render 异常:', e); }
    }
  }

  function goBack() {
    if (typeof currentScreen === 'undefined') return;
    navigate('main');
  }

  // ==================== 数据操作中介 ====================
  function addGold(amount) {
    if (typeof amount !== 'number' || amount <= 0) return 0;
    var gain = (typeof window.addGold === 'function') ? window.addGold(amount) : 0;
    EventBus.emit('economy:gold_change', { amount: gain, total: G.player.gold });
    return gain;
  }

  function addDiamond(amount) {
    if (typeof amount !== 'number' || amount <= 0) return 0;
    var gain = (typeof window.addDiamond === 'function') ? window.addDiamond(amount) : 0;
    EventBus.emit('economy:diamond_change', { amount: gain, total: G.player.diamond });
    return gain;
  }

  function addExp(amount) {
    if (typeof amount !== 'number' || amount <= 0) return 0;
    var gain = (typeof window.addExp === 'function') ? window.addExp(amount) : 0;
    EventBus.emit('player:exp_change', { amount: gain });
    return gain;
  }

  // ==================== 存档操作中介 ====================
  function save() {
    if (typeof saveGame === 'function') saveGame();
  }

  function saveImmediate() {
    if (typeof saveGameImmediate === 'function') saveGameImmediate();
    else if (typeof saveGame === 'function') saveGame();
  }

  function deleteSave() {
    window.__DELETING_SAVE__ = true;
    try { localStorage.removeItem('shadow_era_save'); } catch(e) {}
    EventBus.emit('save:deleted');
  }

  // ==================== 战斗操作中介 ====================
  function startAutoBattle() {
    if (!Debounce.throttle('autoBattle', 500)) return;
    EventBus.emit('battle:auto_start');
    // 具体逻辑由 battle.js 监听事件处理
  }

  function stopAutoBattle() {
    EventBus.emit('battle:auto_stop');
  }

  // ==================== 宠物操作中介 ====================
  function hatchEgg(eggId) {
    if (!Debounce.throttle('hatch_' + eggId, 1000)) return;
    EventBus.emit('pet:hatch', { eggId: eggId });
  }

  function fusePets(pet1Id, pet2Id) {
    if (!Debounce.throttle('fuse', 1000)) return;
    EventBus.emit('pet:fuse', { pet1Id: pet1Id, pet2Id: pet2Id });
  }

  // ==================== 渲染中介 ====================
  function refresh() {
    if (typeof render === 'function') {
      try { render(); } catch(e) { Logger.error('[UIMediator]', 'refresh 异常:', e); }
    }
  }

  function showToast(msg, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type || 'info');
    }
  }

  // ==================== 通用操作中介（防连点） ====================
  function action(key, fn, throttleMs) {
    throttleMs = throttleMs || 500;
    if (!Debounce.throttle(key, throttleMs)) return;
    try {
      var result = fn();
      EventBus.emit('ui:action', { key: key, result: result });
      return result;
    } catch(e) {
      Logger.error('[UIMediator]', 'action "' + key + '" 异常:', e);
      showToast('操作失败，请重试', 'error');
      return null;
    }
  }

  return {
    navigate: navigate,
    goBack: goBack,
    addGold: addGold,
    addDiamond: addDiamond,
    addExp: addExp,
    save: save,
    saveImmediate: saveImmediate,
    deleteSave: deleteSave,
    startAutoBattle: startAutoBattle,
    stopAutoBattle: stopAutoBattle,
    hatchEgg: hatchEgg,
    fusePets: fusePets,
    refresh: refresh,
    showToast: showToast,
    action: action,
  };
})();

window.UIMediator = UIMediator;
