window.__GAME_LOADED__ = true;
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

    render();

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

setInterval(() => { saveGame(); }, 30000);
// 每秒刷新buff栏（更新剩余时间）
setInterval(() => { if (typeof renderBuffBar === 'function') renderBuffBar(); }, 1000);
// v2.2.0 需求3：战斗卡死看门狗——每5秒检查一次，如果自动挂机中但无战斗/走路/定时器，则恢复
setInterval(function() {
  if (typeof autoBattleInterval === 'undefined' || typeof liveBattle === 'undefined') return;
  if (autoBattleInterval && !liveBattle && !walkPhase && !battleTurnTimer && !battleSpawnTimer) {
    // 战斗卡死：自动挂机标志存在，但没有任何战斗状态或定时器
    console.log('[看门狗] 检测到战斗卡死，自动恢复...');
    if (typeof spawnMonster === 'function') spawnMonster();
  }
}, 5000);
window.addEventListener('beforeunload', () => {
  stopLiveBattle();
  if (autoBattleInterval) clearInterval(autoBattleInterval);
  // 删除存档时跳过自动保存
  if (window.__DELETING_SAVE__) return;
  saveGame();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (autoBattleInterval) {
      clearInterval(autoBattleInterval);
      autoBattleInterval = null;
    }
    stopLiveBattle();
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
