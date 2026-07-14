window.__GAME_LOADED__ = true;

// ==================== 核心系统初始化 ====================
// 配置缓存索引初始化（在 config.js 加载后、游戏初始化前执行）
if (typeof ConfigCache !== 'undefined' && typeof ConfigCache.initIndices === 'function') {
  ConfigCache.initIndices();
}
// 注册游戏状态机
if (typeof StateMachine !== 'undefined') {
  StateMachine.register('main', { enter: function() {}, exit: function() {} });
  StateMachine.register('battle', { enter: function() {}, exit: function() {} });
  StateMachine.register('idle', { enter: function() {}, exit: function() {} });
  StateMachine.register('menu', { enter: function() {}, exit: function() {} });
  StateMachine.transition('main');
}
// 设置生产环境日志级别
if (typeof Logger !== 'undefined') {
  Logger.setLevel('INFO');
}
// ===== main.js : 鍒濆鍖?=====

// ==================== INITIALIZATION ====================
(function init() {
  try {
    loadGame();
    checkDailyReset();

    // 离线挂机奖励
    var offlineRewards = calculateOfflineRewards();
    if (offlineRewards) {
      claimOfflineRewards();
      setTimeout(function() { showOfflineRewardsModal(offlineRewards); }, 500);
    }

    if (G.dailyTasks && !G.dailyTasks['login_claimed']) {
      updateDailyTask('login', 1);
      claimDailyTask('login');
    }

    // 需求1：初始化主线剧情任务
    if (typeof initMainQuest === 'function') {
      initMainQuest();
    }

    // 需求15：初始化游戏内时间系统
    if (typeof updateGameTime === 'function') {
      updateGameTime();
    }

    render();

    // 需求3：恢复孵化进程（基于时间戳计算离线进度）
    if (typeof resumeHatching === 'function') {
      resumeHatching();
    }

    if (G.pets && G.pets.length === 0 && !G.newPlayerGiftClaimed) {
      currentScreen = 'main';
      render();
    }
  } catch(e) {
    console.error('Init error:', e);
    try {
      G = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveGame();
      render();
    } catch(e2) {
      console.error('Init recovery failed:', e2);
      try {
        localStorage.removeItem('shadow_era_save');
      } catch(e3) {}
      window.__GAME_LOADED__ = false;
      var errMsg2 = (e && e.message) ? e.message : String(e || '未知错误');
      document.getElementById('app').innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#e2e8f0;font-family:-apple-system,sans-serif;"><div style="text-align:center;padding:2rem;max-width:420px;"><p style="color:#ef4444;font-size:1.125rem;margin-bottom:0.5rem;">游戏初始化失败</p><p style="color:#94a3b8;font-size:0.875rem;margin-bottom:1rem;">' + errMsg2 + '</p><p style="color:#f59e0b;font-size:0.8rem;margin-bottom:0.75rem;">存档已自动清除</p><button onclick="window.clearSaveAndReload()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:1px solid #f87171;padding:0.75rem 2rem;border-radius:0.5rem;cursor:pointer;font-size:0.95rem;font-weight:700;margin-bottom:0.75rem;">清除存档并刷新</button><br><button onclick="localStorage.clear();location.reload()" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:1px solid #8b5cf6;padding:0.5rem 1.5rem;border-radius:0.5rem;cursor:pointer;font-size:0.875rem;margin-top:0.5rem;">清除所有缓存并刷新</button></div></div>';
    }
  }
})();

// 自动保存——使用配置常量替代硬编码
var _autosaveInterval = (typeof GAME_CONSTANTS !== 'undefined') ? GAME_CONSTANTS.AUTOSAVE_INTERVAL_MS : 30000;
setInterval(() => { saveGame(); }, _autosaveInterval);
// 每秒刷新buff栏（更新剩余时间）
setInterval(() => { if (typeof renderBuffBar === 'function') renderBuffBar(); }, 1000);
// 需求15：每5秒检查游戏时间阶段切换
setInterval(function() { if (typeof updateGameTime === 'function') updateGameTime(); }, 5000);
// 需求15：每秒刷新时间显示
setInterval(function() { if (typeof renderTimeBar === 'function') renderTimeBar(); }, 1000);
// v2.2.0 需求3：战斗卡死看门狗——每5秒检查一次，如果自动挂机中但无战斗/走路/定时器，则恢复
// 优化：加入 walkTimer 检查、连续恢复计数限制、出战队伍校验、残留定时器清理
var _watchdogRecoverCount = 0;
var _watchdogLastWarn = 0;
setInterval(function() {
  if (typeof autoBattleInterval === 'undefined' || typeof liveBattle === 'undefined') return;
  if (!autoBattleInterval) {
    _watchdogRecoverCount = 0; // 挂机停止时重置计数
    return;
  }
  // 综合判断：无战斗、无走路、无任何定时器（含 walkTimer）
  if (!liveBattle && !walkPhase && !battleTurnTimer && !battleSpawnTimer && !walkTimer) {
    // 出战队伍为空时不触发恢复，避免无意义刷屏
    var team = (typeof getTeamPets === 'function') ? getTeamPets() : [];
    if (team.length === 0) return;

    // 连续恢复超过3次则认为有深层问题，停止自动恢复并定期警告
    if (_watchdogRecoverCount >= 3) {
      var now = Date.now();
      if (now - _watchdogLastWarn > 30000) {
        console.warn('[看门狗] 连续恢复次数过多（' + _watchdogRecoverCount + '次），暂停自动恢复。请检查游戏状态或手动重新挂机。');
        _watchdogLastWarn = now;
      }
      return;
    }

    console.log('[看门狗] 检测到战斗卡死，自动恢复...（第' + (_watchdogRecoverCount + 1) + '次）');
    _watchdogRecoverCount++;

    // 清理可能残留的定时器，防止双重触发
    if (typeof stopLiveBattle === 'function') stopLiveBattle();

    if (typeof spawnMonster === 'function') spawnMonster();

    // 10秒后检查是否恢复正常，若恢复则重置计数
    setTimeout(function() {
      if (typeof liveBattle !== 'undefined' && (liveBattle || walkPhase)) {
        _watchdogRecoverCount = 0;
      }
    }, 10000);
  } else {
    // 战斗正常进行中，重置恢复计数
    _watchdogRecoverCount = 0;
  }
}, 5000);
window.addEventListener('beforeunload', () => {
  stopLiveBattle();
  if (autoBattleInterval) clearInterval(autoBattleInterval);
  // 删除存档时跳过自动保存
  if (window.__DELETING_SAVE__) return;
  // 页面关闭时强制立即保存（不走防抖）
  if (typeof saveGameImmediate === 'function') saveGameImmediate();
  else saveGame();
});
// 页面可见性变化：隐藏时暂停挂机，恢复可见时自动续挂
var _wasAutoBattling = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 记录挂机状态，停止战斗以节省资源
    _wasAutoBattling = !!autoBattleInterval;
    if (autoBattleInterval) {
      clearInterval(autoBattleInterval);
      autoBattleInterval = null;
    }
    stopLiveBattle();
  } else {
    // 页面恢复可见：如果之前在自动挂机，自动恢复
    if (_wasAutoBattling && !autoBattleInterval) {
      _wasAutoBattling = false;
      var team = (typeof getTeamPets === 'function') ? getTeamPets() : [];
      if (team.length > 0) {
        autoBattleInterval = setInterval(() => {}, 999999);
        startLiveBattle();
        console.log('[看门狗] 页面恢复可见，自动恢复挂机...');
      }
    }
  }
});

console.log('🦴 暗影纪元 - 挂机宠物养成游戏已就绪');
console.log('💡 新玩家点击"新手礼包"领取初始宠物，然后点击"开始挂机"即可自动战斗');
console.log('📊 数据自动保存到 localStorage');

try {
  if (typeof render === 'function') {
    var appEl = document.getElementById('app');
    if (appEl && (!appEl.innerHTML || appEl.innerHTML.trim() === '')) {
      render();
    }
  }
} catch(e) {
  console.error('Final init error:', e);
  try { localStorage.removeItem('shadow_era_save'); } catch(e3) {}
  window.__GAME_LOADED__ = false;
  var appEl2 = document.getElementById('app');
  if (appEl2) {
    appEl2.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#e2e8f0;font-family:-apple-system,sans-serif;"><div style="text-align:center;padding:2rem;max-width:420px;"><div style="font-size:3rem;margin-bottom:0.5rem;">💥</div><p style="color:#ef4444;font-size:1.125rem;font-weight:700;margin-bottom:0.5rem;">初始化异常</p><p style="color:#94a3b8;font-size:0.875rem;margin-bottom:0.25rem;word-break:break-all;">' + (e.message || '未知错误') + '</p><p style="color:#f59e0b;font-size:0.8rem;margin-bottom:0.75rem;">存档已自动清除，请点击下方按钮刷新</p><button onclick="window.clearSaveAndReload()" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:1px solid #f87171;padding:0.75rem 2rem;border-radius:0.5rem;cursor:pointer;font-size:0.95rem;font-weight:700;margin-bottom:0.75rem;">清除存档并刷新</button><br><button onclick="localStorage.clear();location.reload()" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:1px solid #8b5cf6;padding:0.625rem 1.5rem;border-radius:0.5rem;cursor:pointer;font-size:0.875rem;font-weight:600;margin-top:0.75rem;">清除所有缓存并刷新</button></div></div>';
  }
}
