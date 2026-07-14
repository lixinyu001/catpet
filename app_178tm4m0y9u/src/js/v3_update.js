// ===== v3_update.js : v3.0 大版本更新——7大功能模块 =====
// 任务体系重构、宠物加点预览、团本玩法、藏宝图负面词条、抽蛋保底、天赋重置、活动战斗弹窗化
(function() {
'use strict';

// ==================== 一、任务体系重构 ====================

// 1.1 主线任务线——新增等级阶梯式引导任务类型
// 在原有 MAIN_QUEST_CHAIN 基础上扩展，新增以下引导节点：
// - 宠物获取引导（level 3）
// - 加点引导（level 8）
// - 装备穿戴引导（level 18）
// - 符文引导（level 50）
// - 天赋引导（level 55）

// 主线任务追踪扩展：在原有 updateMainQuest 基础上增加新任务类型追踪
var _origUpdateMainQuest = (typeof updateMainQuest === 'function') ? updateMainQuest : null;

// 1.2 日常历练→支线任务分类
// 在 UI 中将 "日常任务" / "每日任务" 改为 "支线任务"
// 已实现：renderDailyScreen 中支线任务标题已改为"📜 支线任务"
// 需求4.1：主线/支线任务分栏展示——在任务中心顶部新增主线任务分栏（紫色渐变边框），
// 含任务链进度（如"主线进度 3/17"）、类型标签修正（随机任务显示"历练任务"非"支线任务"）、
// 导航栏"任务"标签添加可领取红点角标

// ==================== 二、宠物加点预览功能 ====================

// 预览加点：不实际消耗属性点，仅计算并展示加点前/后属性对比
window._petAttrPreview = null; // { petId, before, after, allocations }

function previewAttrAllocation(petId, allocations) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (typeof getPetAttrPoints !== 'function') return;
  if (!pet.attrPoints) getPetAttrPoints(pet);
  if (typeof syncPetAttrPoints === 'function') syncPetAttrPoints(pet);

  var freePts = pet.freeAttrPoints || 0;
  var totalRequest = 0;
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(attr) {
    totalRequest += Math.max(0, parseInt(allocations[attr]) || 0);
  });
  if (totalRequest === 0) { showToast('请输入加点数值后再预览', 'error'); return; }
  if (totalRequest > freePts) {
    showToast('输入加点数值超过剩余自由属性点（剩余 ' + freePts + ' 点）', 'error');
    return;
  }

  // 获取加点前属性
  var stats = (typeof getPetStats === 'function') ? getPetStats(pet) : {};
  var before = {
    attrPoints: {},
    stats: {
      气血: stats.气血 || 0,
      攻击力: stats.攻击力 || 0,
      防御力: stats.防御力 || 0,
      速度: stats.速度 || 0,
      法力: stats.法力 || 0,
    }
  };
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(k) {
    before.attrPoints[k] = pet.attrPoints[k] || 0;
  });

  // 模拟加点后的属性
  var simPet = JSON.parse(JSON.stringify(pet));
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(attr) {
    var n = Math.max(0, parseInt(allocations[attr]) || 0);
    if (n > 0) {
      simPet.attrPoints[attr] = (simPet.attrPoints[attr] || 0) + n;
    }
  });
  var afterStats = (typeof getPetStats === 'function') ? getPetStats(simPet) : {};
  var after = {
    attrPoints: {},
    stats: {
      气血: afterStats.气血 || 0,
      攻击力: afterStats.攻击力 || 0,
      防御力: afterStats.防御力 || 0,
      速度: afterStats.速度 || 0,
      法力: afterStats.法力 || 0,
    }
  };
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(k) {
    after.attrPoints[k] = simPet.attrPoints[k] || 0;
  });

  window._petAttrPreview = {
    petId: petId,
    before: before,
    after: after,
    allocations: allocations,
    totalAllocated: totalRequest,
  };
  render();
}

function confirmAttrAllocation(petId) {
  if (!window._petAttrPreview || window._petAttrPreview.petId !== petId) {
    showToast('请先预览加点', 'error'); return;
  }
  var allocations = window._petAttrPreview.allocations;
  if (typeof batchAllocateAttrPoints !== 'function') { showToast('加点功能未加载', 'error'); return; }
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var result = batchAllocateAttrPoints(pet, allocations);
  if (result.ok) {
    showToast('✨ 确认加点成功，共分配 ' + result.allocated + ' 点', 'success');
    window._petAttrPreview = null;
    // v3.0 主线任务追踪：属性加点
    if (typeof _trackAllocateAttr === 'function') _trackAllocateAttr();
    render();
  } else {
    showToast(result.msg || '加点失败', 'error');
  }
}

function cancelAttrPreview() {
  window._petAttrPreview = null;
  render();
}

window.previewAttrAllocation = previewAttrAllocation;
window.confirmAttrAllocation = confirmAttrAllocation;
window.cancelAttrPreview = cancelAttrPreview;

// 渲染加点预览面板
function renderAttrPreviewPanel(petId) {
  var pv = window._petAttrPreview;
  if (!pv || pv.petId !== petId) return '';
  var attrs = ['力量','敏捷','体质','耐力','魔力'];
  var statKeys = ['气血','攻击力','防御力','速度','法力'];

  // 属性点对比
  var attrRows = attrs.map(function(k) {
    var bv = pv.before.attrPoints[k] || 0;
    var av = pv.after.attrPoints[k] || 0;
    var diff = av - bv;
    var highlight = diff > 0 ? 'color:#22c55e;font-weight:bold;' : '';
    return '<div class="flex items-center justify-between py-1 px-2 rounded ' + (diff > 0 ? 'bg-green-900/20' : '') + '">' +
      '<span class="text-xs text-secondary">' + k + '</span>' +
      '<span class="text-xs"><span class="text-secondary">' + bv + '</span>' +
      (diff > 0 ? ' <span class="text-gray-500">→</span> <span style="' + highlight + '">' + av + '</span>' +
      ' <span class="text-green-400 text-[10px]">+' + diff + '</span>' : '') +
      '</span></div>';
  }).join('');

  // 衍生属性对比
  var statRows = statKeys.map(function(k) {
    var bv = pv.before.stats[k] || 0;
    var av = pv.after.stats[k] || 0;
    var diff = av - bv;
    var highlight = diff > 0 ? 'color:#22c55e;' : '';
    var diffStr = diff > 0 ? '<span class="text-green-400 text-[10px]">+' + diff + '</span>' :
                  diff < 0 ? '<span class="text-red-400 text-[10px]">' + diff + '</span>' : '';
    return '<div class="flex items-center justify-between py-1 px-2 rounded ' + (diff > 0 ? 'bg-green-900/10' : '') + '">' +
      '<span class="text-xs text-secondary">' + k + '</span>' +
      '<span class="text-xs"><span class="text-secondary">' + bv.toLocaleString() + '</span>' +
      (diff !== 0 ? ' <span class="text-gray-500">→</span> <span style="' + highlight + '">' + av.toLocaleString() + '</span> ' + diffStr : '') +
      '</span></div>';
  }).join('');

  return '<div class="bg-card border-2 border-yellow-600/50 rounded-xl p-3 mt-2 animate-fade-in">' +
    '<div class="flex items-center justify-between mb-2">' +
    '<h4 class="font-bold text-sm text-yellow-400">📊 加点预览（共分配 ' + pv.totalAllocated + ' 点）</h4>' +
    '<button class="text-secondary hover:text-white text-xs" onclick="cancelAttrPreview()">✕</button>' +
    '</div>' +
    '<div class="grid grid-cols-2 gap-3">' +
    '<div><p class="text-xs text-secondary mb-1">属性点</p>' + attrRows + '</div>' +
    '<div><p class="text-xs text-secondary mb-1">衍生属性</p>' + statRows + '</div>' +
    '</div>' +
    '<div class="flex gap-2 mt-3">' +
    '<button class="btn-gold btn-sm flex-1" onclick="confirmAttrAllocation(\'' + petId + '\')">✓ 确认加点</button>' +
    '<button class="btn-primary btn-sm flex-1" onclick="cancelAttrPreview()">取消</button>' +
    '</div>' +
    '<p class="text-xs text-secondary mt-1 text-center">预览不消耗属性点，确认后才会实际加点</p>' +
    '</div>';
}
window.renderAttrPreviewPanel = renderAttrPreviewPanel;

// ==================== 三、团本玩法 ====================

// 3.1-3.4 团本数据、状态、逻辑、UI

// 团本数据定义：3个团本，每个含3小Boss+1大Boss
var RAID_DUNGEONS = [
  {
    id: 'raid_1', name: '幽冥裂隙', icon: '🌑', desc: '暗影深处的裂隙中涌出无尽亡灵，击败所有Boss才能封印裂隙。',
    minLevel: 40, bossCount: 4,
    bosses: [
      { id: 'r1b1', name: '暗影刺客', icon: '🗡️', isFinal: false, difficulty: 'normal',
        hp: 50000, atk: 800, def: 300, speed: 120,
        mechanic: { type: 'mark', desc: '每3回合标记一名目标，被标记者受到双倍伤害', triggerTurn: 3 } },
      { id: 'r1b2', name: '护盾守卫', icon: '🛡️', isFinal: false, difficulty: 'normal',
        hp: 80000, atk: 600, def: 800, speed: 80,
        mechanic: { type: 'shield', desc: '每5回合获得护盾，吸收20000点伤害', triggerTurn: 5 } },
      { id: 'r1b3', name: '召唤师', icon: '🧙', isFinal: false, difficulty: 'normal',
        hp: 60000, atk: 500, def: 400, speed: 100,
        mechanic: { type: 'summon', desc: '每4回合召唤小怪，小怪存在时Boss攻击力提升50%', triggerTurn: 4 } },
      { id: 'r1b4', name: '幽冥领主', icon: '💀', isFinal: true, difficulty: 'hard',
        hp: 200000, atk: 1500, def: 600, speed: 110,
        phases: [
          { hpThreshold: 1.0, name: '一阶段·暗影降临', atkMult: 1.0, defMult: 1.0, skills: ['暗影斩','诅咒之眼'] },
          { hpThreshold: 0.7, name: '二阶段·死亡凝视', atkMult: 1.3, defMult: 1.2, skills: ['死亡凝视','暗影爆发','诅咒之眼'] },
          { hpThreshold: 0.3, name: '三阶段·终焉降临', atkMult: 1.6, defMult: 1.5, skills: ['终焉之握','暗影爆发','死亡凝视','亡者苏生'] },
        ] },
    ],
  },
  {
    id: 'raid_2', name: '熔岩深渊', icon: '🌋', desc: '地心深处的熔岩王国，烈焰统治者掌控着无尽火海。',
    minLevel: 60, bossCount: 4,
    bosses: [
      { id: 'r2b1', name: '烈焰犬王', icon: '🔥', isFinal: false, difficulty: 'normal',
        hp: 120000, atk: 1500, def: 500, speed: 130,
        mechanic: { type: 'burn', desc: '攻击附带灼烧效果，每回合造成最大生命5%伤害', triggerTurn: 1 } },
      { id: 'r2b2', name: '熔岩巨人', icon: '🗿', isFinal: false, difficulty: 'normal',
        hp: 200000, atk: 1000, def: 1200, speed: 60,
        mechanic: { type: 'reflect', desc: '反弹30%受到的伤害', triggerTurn: 1 } },
      { id: 'r2b3', name: '火焰巫师', icon: '🧙‍♂️', isFinal: false, difficulty: 'normal',
        hp: 100000, atk: 2000, def: 300, speed: 150,
        mechanic: { type: 'vulnerable', desc: '冰属性攻击造成3倍伤害，火属性攻击回血', triggerTurn: 1 } },
      { id: 'r2b4', name: '炎魔之王', icon: '👹', isFinal: true, difficulty: 'hard',
        hp: 500000, atk: 3000, def: 1000, speed: 120,
        phases: [
          { hpThreshold: 1.0, name: '一阶段·烈焰风暴', atkMult: 1.0, defMult: 1.0, skills: ['烈焰风暴','火焰冲击'] },
          { hpThreshold: 0.7, name: '二阶段·熔岩之怒', atkMult: 1.4, defMult: 1.3, skills: ['熔岩喷发','烈焰风暴','灼烧凝视'] },
          { hpThreshold: 0.3, name: '三阶段·毁灭烈焰', atkMult: 1.8, defMult: 1.6, skills: ['末日烈焰','熔岩喷发','灼烧凝视','烈焰风暴','炎魔召唤'] },
        ] },
    ],
  },
  {
    id: 'raid_3', name: '虚空神殿', icon: '🌌', desc: '连接虚空的远古神殿，虚空之主在此沉睡了万年。',
    minLevel: 80, bossCount: 4,
    bosses: [
      { id: 'r3b1', name: '虚空猎手', icon: '🎯', isFinal: false, difficulty: 'normal',
        hp: 300000, atk: 3000, def: 1000, speed: 180,
        mechanic: { type: 'mark', desc: '标记目标并优先攻击，被标记者防御降低50%', triggerTurn: 2 } },
      { id: 'r3b2', name: '混沌守护者', icon: '🌀', isFinal: false, difficulty: 'normal',
        hp: 400000, atk: 2500, def: 2000, speed: 100,
        mechanic: { type: 'shield', desc: '每3回合获得混沌护盾，吸收100000点伤害并免疫控制', triggerTurn: 3 } },
      { id: 'r3b3', name: '虚空织者', icon: '🕸️', isFinal: false, difficulty: 'normal',
        hp: 350000, atk: 3500, def: 800, speed: 160,
        mechanic: { type: 'summon', desc: '召唤虚空裂隙，每回合对全队造成最大生命10%伤害', triggerTurn: 3 } },
      { id: 'r3b4', name: '虚空之主', icon: '👁️', isFinal: true, difficulty: 'hard',
        hp: 1000000, atk: 6000, def: 2000, speed: 150,
        phases: [
          { hpThreshold: 1.0, name: '一阶段·虚空降临', atkMult: 1.0, defMult: 1.0, skills: ['虚空射线','空间扭曲'] },
          { hpThreshold: 0.7, name: '二阶段·混沌之力', atkMult: 1.5, defMult: 1.4, skills: ['混沌爆发','虚空射线','空间扭曲','虚空吞噬'] },
          { hpThreshold: 0.3, name: '三阶段·终焉虚空', atkMult: 2.0, defMult: 1.8, skills: ['终焉虚空','混沌爆发','虚空吞噬','空间扭曲','虚空射线','万虚归一'] },
        ] },
    ],
  },
];
window.RAID_DUNGEONS = RAID_DUNGEONS;

// 团本状态初始化
function getRaidState() {
  if (!G.raidState) {
    G.raidState = {};
  }
  return G.raidState;
}
window.getRaidState = getRaidState;

// 获取团本进度
function getRaidProgress(raidId) {
  var rs = getRaidState();
  if (!rs[raidId]) {
    var raid = RAID_DUNGEONS.find(function(r) { return r.id === raidId; });
    if (!raid) return null;
    rs[raidId] = {
      bossesDefeated: {}, // { bossId: true }
      raidCompleted: false,
      currentBossIdx: 0,
    };
  }
  return rs[raidId];
}
window.getRaidProgress = getRaidProgress;

// 检查团本是否可进入
function canEnterRaid(raidId) {
  var raid = RAID_DUNGEONS.find(function(r) { return r.id === raidId; });
  if (!raid) return false;
  if (G.player.level < raid.minLevel) return false;
  return true;
}
window.canEnterRaid = canEnterRaid;

// 重置团本进度（可重复挑战）
function resetRaidProgress(raidId) {
  var rs = getRaidState();
  var raid = RAID_DUNGEONS.find(function(r) { return r.id === raidId; });
  if (!raid) return;
  rs[raidId] = {
    bossesDefeated: {},
    raidCompleted: false,
    currentBossIdx: 0,
  };
  saveGame();
}
window.resetRaidProgress = resetRaidProgress;

// 检查Boss是否可以挑战
function canChallengeBoss(raidId, bossId) {
  var raid = RAID_DUNGEONS.find(function(r) { return r.id === raidId; });
  if (!raid) return false;
  var progress = getRaidProgress(raidId);
  var boss = raid.bosses.find(function(b) { return b.id === bossId; });
  if (!boss) return false;
  // 已击败的不能重复挑战
  if (progress.bossesDefeated[bossId]) return false;
  // 小Boss：只要还没被击败就可以挑战
  if (!boss.isFinal) return true;
  // 大Boss：需要所有小Boss被击败
  var smallBosses = raid.bosses.filter(function(b) { return !b.isFinal; });
  for (var i = 0; i < smallBosses.length; i++) {
    if (!progress.bossesDefeated[smallBosses[i].id]) return false;
  }
  return true;
}
window.canChallengeBoss = canChallengeBoss;

// 3.3 老虎机式奖励结算
// 击败最终大Boss后弹出4格老虎机
function generateRaidSlotMachineRewards(raidId) {
  var raid = RAID_DUNGEONS.find(function(r) { return r.id === raidId; });
  if (!raid) return [];
  // 高价值道具奖励池
  var rewardPool = [
    { id: 'yuanxiao_str', name: '力量元宵', icon: '🍖', baseAmount: 2 },
    { id: 'yuanxiao_con', name: '体质元宵', icon: '🛡️', baseAmount: 2 },
    { id: 'yuanxiao_agi', name: '敏捷元宵', icon: '💨', baseAmount: 2 },
    { id: 'yuanxiao_int', name: '魔力元宵', icon: '🔮', baseAmount: 2 },
    { id: 'moon_dew', name: '月华露', icon: '🌙', baseAmount: 3 },
    { id: 'protection_stone', name: '保底石', icon: '🛡️', baseAmount: 2 },
    { id: 'hatch_stone', name: '孵化石', icon: '🥚', baseAmount: 3 },
    { id: 'forge_stone_high', name: '高级强化石', icon: '🔨', baseAmount: 5 },
    { id: 'golden_chest', name: '黄金宝藏', icon: '🏆', baseAmount: 1 },
    { id: 'divine_essence', name: '神兽精华', icon: '✨', baseAmount: 1 },
  ];
  // 4格独立随机
  var slots = [];
  for (var i = 0; i < 4; i++) {
    var reward = rewardPool[Math.floor(Math.random() * rewardPool.length)];
    slots.push({
      id: reward.id,
      name: reward.name,
      icon: reward.icon,
      baseAmount: reward.baseAmount,
    });
  }
  return slots;
}
window.generateRaidSlotMachineRewards = generateRaidSlotMachineRewards;

// 计算老虎机最终奖励（相同道具叠加规则：k个相同→数量×k²）
function calculateRaidSlotMachineRewards(slots) {
  // 按道具ID分组
  var groups = {};
  slots.forEach(function(s) {
    if (!groups[s.id]) groups[s.id] = { id: s.id, name: s.name, icon: s.icon, baseAmount: s.baseAmount, count: 0 };
    groups[s.id].count++;
  });
  // 计算最终数量
  var rewards = [];
  Object.keys(groups).forEach(function(id) {
    var g = groups[id];
    var finalAmount = g.baseAmount * g.count * g.count; // k²倍
    rewards.push({
      id: g.id,
      name: g.name,
      icon: g.icon,
      amount: finalAmount,
      multiplier: g.count,
      isMulti: g.count > 1,
    });
  });
  return rewards;
}
window.calculateRaidSlotMachineRewards = calculateRaidSlotMachineRewards;

// 发放团本奖励到背包
function grantRaidRewards(rewards) {
  rewards.forEach(function(r) {
    if (r.id === 'golden_chest') {
      // 黄金宝藏直接发放金币
      var goldAmount = randomInt(50000, 100000) * r.amount;
      addGold(goldAmount);
    } else if (r.id === 'divine_essence') {
      // 神兽精华
      var existing = G.inventory.find(function(i) { return i.id === r.id; });
      if (existing) existing.count += r.amount;
      else G.inventory.push({ id: r.id, count: r.amount });
    } else {
      var item = G.inventory.find(function(i) { return i.id === r.id; });
      if (item) item.count += r.amount;
      else G.inventory.push({ id: r.id, count: r.amount });
    }
  });
  saveGame();
}
window.grantRaidRewards = grantRaidRewards;

// 团本Boss战斗：使用活动战斗弹窗系统
function challengeRaidBoss(raidId, bossId) {
  var raid = RAID_DUNGEONS.find(function(r) { return r.id === raidId; });
  if (!raid) return;
  var boss = raid.bosses.find(function(b) { return b.id === bossId; });
  if (!boss) return;
  if (!canChallengeBoss(raidId, bossId)) {
    showToast('无法挑战该Boss', 'error');
    return;
  }
  var team = (typeof getTeamPets === 'function') ? getTeamPets() : [];
  if (team.length === 0) {
    showToast('请先选择上阵宠物', 'error');
    return;
  }

  // 标记Boss击败（简化：通过活动战斗系统判定胜负）
  // 使用弹窗战斗
  if (typeof startPopupBattle === 'function') {
    var monsterPower = boss.hp * 0.06 + boss.atk * 20 + boss.def * 30;
    var playerCp = (typeof getPlayerCombatPower === 'function') ? getPlayerCombatPower() : 10000;
    var winChance = Math.max(0.1, Math.min(0.95, playerCp / (monsterPower * 1.2)));

    startPopupBattle({
      type: 'raid',
      stage: boss.isFinal ? 'final' : 'small',
      enemyName: boss.name,
      enemyIcon: boss.icon,
      enemyLv: raid.minLevel,
      monsterPower: monsterPower,
      playerCp: playerCp,
      winChance: winChance,
      onComplete: function(success) {
        if (success) {
          // 标记Boss击败
          var progress = getRaidProgress(raidId);
          progress.bossesDefeated[bossId] = true;
          showToast('✅ 击败 ' + boss.name + '！', 'success');
          // 检查是否为最终Boss
          if (boss.isFinal) {
            progress.raidCompleted = true;
            // 触发老虎机奖励
            window._raidSlotMachine = {
              raidId: raidId,
              slots: generateRaidSlotMachineRewards(raidId),
              revealed: [false, false, false, false],
              completed: false,
            };
          }
          saveGame();
          render();
        } else {
          showToast('❌ 挑战 ' + boss.name + ' 失败，可以再次尝试', 'error');
        }
      },
    });
  }
}
window.challengeRaidBoss = challengeRaidBoss;

// 渲染团本界面
function renderRaidScreen() {
  var html = '<div class="min-h-screen flex flex-col">' +
    '<header class="bg-panel border-b border-game px-4 py-3">' +
    '<h1 class="font-fantasy text-gold text-lg">⚔️ 团本挑战</h1>' +
    '</header>' +
    '<nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">' +
    (typeof renderNav === 'function' ? renderNav() : '') +
    '</nav>' +
    '<main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">';

  RAID_DUNGEONS.forEach(function(raid) {
    var canEnter = canEnterRaid(raid.id);
    var progress = getRaidProgress(raid.id);
    var defeatedCount = Object.keys(progress.bossesDefeated).length;
    var allSmallDefeated = raid.bosses.filter(function(b) { return !b.isFinal; }).every(function(b) { return progress.bossesDefeated[b.id]; });

    html += '<div class="bg-card border-2 rounded-xl p-4 ' + (canEnter ? 'border-purple-600/50' : 'border-gray-700/30 opacity-60') + '">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<div class="flex items-center gap-3">' +
      '<div class="text-4xl">' + raid.icon + '</div>' +
      '<div>' +
      '<h2 class="font-bold text-lg text-gold">' + raid.name + '</h2>' +
      '<p class="text-xs text-secondary">' + raid.desc + '</p>' +
      '<p class="text-xs ' + (canEnter ? 'text-green-400' : 'text-red-400') + '">需要等级 ' + raid.minLevel + (canEnter ? ' ✓' : ' ✗') + '</p>' +
      '</div></div>' +
      '<div class="text-right">' +
      '<p class="text-xs text-secondary">进度</p>' +
      '<p class="font-bold text-sm ' + (progress.raidCompleted ? 'text-green-400' : 'text-yellow-400') + '">' + defeatedCount + '/' + raid.bossCount + (progress.raidCompleted ? ' ✅' : '') + '</p>' +
      (progress.raidCompleted || defeatedCount > 0 ? '<button class="btn-sm bg-gray-700 text-gray-300 border border-gray-600 rounded mt-1" onclick="resetRaidProgress(\'' + raid.id + '\')">🔄 重置进度</button>' : '') +
      '</div></div>';

    // Boss卡片展示
    html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">';
    raid.bosses.forEach(function(boss) {
      var isDefeated = progress.bossesDefeated[boss.id];
      var canChallenge = canChallengeBoss(raid.id, boss.id);
      var borderClass = isDefeated ? 'border-green-600/50' : boss.isFinal ? 'border-red-600/50' : 'border-game';
      var opacityClass = isDefeated ? 'opacity-50' : '';
      var bgClass = boss.isFinal ? 'bg-red-900/10' : 'bg-panel';

      html += '<div class="' + bgClass + ' border-2 ' + borderClass + ' ' + opacityClass + ' rounded-xl p-3 text-center relative">';
      // 已击败标记
      if (isDefeated) {
        html += '<div class="absolute top-1 right-1 text-green-400 text-xs font-bold">✅ 已击败</div>';
      }
      // Boss图标和名称
      html += '<div class="text-4xl mb-2">' + boss.icon + '</div>' +
        '<p class="font-bold text-sm">' + boss.name + '</p>';
      // 难度标识
      if (boss.isFinal) {
        html += '<p class="text-xs text-red-400 font-bold mt-1">👑 最终Boss</p>';
        if (!isDefeated && !allSmallDefeated) {
          html += '<p class="text-xs text-gray-500 mt-1">🔒 需先击败全部小Boss</p>';
        }
      } else {
        html += '<p class="text-xs text-secondary mt-1">⚔️ 小Boss</p>';
      }
      // 机制描述
      if (boss.mechanic) {
        html += '<p class="text-[10px] text-purple-300 mt-1">🔮 ' + boss.mechanic.desc + '</p>';
      }
      if (boss.phases) {
        html += '<p class="text-[10px] text-orange-300 mt-1">📊 ' + boss.phases.length + '阶段切换</p>';
      }
      // 挑战按钮
      if (canEnter && !isDefeated) {
        if (canChallenge) {
          html += '<button class="btn-primary btn-sm w-full mt-2" onclick="challengeRaidBoss(\'' + raid.id + '\',\'' + boss.id + '\')">⚔️ 挑战</button>';
        } else {
          html += '<button class="btn-sm bg-gray-800 text-gray-600 border border-gray-700 rounded w-full mt-2" disabled>🔒 锁定</button>';
        }
      }
      html += '</div>';
    });
    html += '</div>'; // grid
    html += '</div>'; // raid card
  });

  html += '</main></div>';
  return html;
}
window.renderRaidScreen = renderRaidScreen;

// 渲染老虎机奖励弹窗
function renderRaidSlotMachineModal() {
  var sm = window._raidSlotMachine;
  if (!sm) return '';
  var allRevealed = sm.revealed.every(function(r) { return r; });
  var html = '<div id="raidSlotModal" class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.85);">' +
    '<div class="bg-card border-2 border-yellow-600 rounded-xl p-6 max-w-lg w-full mx-4" style="box-shadow:0 0 40px rgba(245,158,11,0.4);">' +
    '<h2 class="font-bold text-xl text-center text-yellow-400 mb-2">🎰 老虎机奖励</h2>' +
    '<p class="text-xs text-secondary text-center mb-4">击败最终Boss！点击格子揭晓奖励</p>';

  // 4格老虎机
  html += '<div class="grid grid-cols-4 gap-3 mb-4">';
  for (var i = 0; i < 4; i++) {
    var slot = sm.slots[i];
    var revealed = sm.revealed[i];
    if (revealed) {
      html += '<div class="bg-panel border-2 border-yellow-500 rounded-xl p-3 text-center animate-fade-in" style="min-height:100px;">' +
        '<div class="text-3xl mb-1">' + slot.icon + '</div>' +
        '<p class="text-xs font-bold text-yellow-400">' + slot.name + '</p>' +
        '<p class="text-xs text-green-400">×' + slot.baseAmount + '</p>' +
        '</div>';
    } else {
      html += '<div class="bg-panel border-2 border-purple-600 rounded-xl p-3 text-center cursor-pointer hover:border-yellow-500 transition-all" style="min-height:100px;display:flex;align-items:center;justify-content:center;" onclick="_revealRaidSlot(' + i + ')">' +
        '<div class="text-3xl animate-pulse">❓</div>' +
        '</div>';
    }
  }
  html += '</div>';

  if (allRevealed && !sm.completed) {
    // 计算最终奖励
    var rewards = calculateRaidSlotMachineRewards(sm.slots);
    html += '<div class="bg-panel rounded-xl p-3 mb-3">' +
      '<p class="text-sm font-bold text-center text-yellow-400 mb-2">🎁 最终奖励</p>';
    rewards.forEach(function(r) {
      var multStr = r.isMulti ? ' <span class="text-orange-400 text-xs">(' + r.multiplier + '格相同 ×' + r.multiplier * r.multiplier + ')</span>' : '';
      html += '<div class="flex items-center justify-between py-1">' +
        '<span class="text-sm">' + r.icon + ' ' + r.name + multStr + '</span>' +
        '<span class="font-bold text-green-400">×' + r.amount + '</span>' +
        '</div>';
    });
    html += '</div>';
    html += '<button class="btn-gold w-full" onclick="_claimRaidRewards()">📦 领取奖励</button>';
  }

  html += '</div></div>';
  return html;
}
window.renderRaidSlotMachineModal = renderRaidSlotMachineModal;

window._revealRaidSlot = function(idx) {
  var sm = window._raidSlotMachine;
  if (!sm || sm.revealed[idx]) return;
  sm.revealed[idx] = true;
  render();
};

window._claimRaidRewards = function() {
  var sm = window._raidSlotMachine;
  if (!sm) return;
  var rewards = calculateRaidSlotMachineRewards(sm.slots);
  grantRaidRewards(rewards);
  // 奖励明细
  var summary = rewards.map(function(r) { return r.icon + r.name + '×' + r.amount; }).join('，');
  showToast('🎁 获得奖励：' + summary, 'success');
  window._raidSlotMachine = null;
  render();
};

// ==================== 四、藏宝图负面词条机制 ====================

// 4.1 负面词条池
var TREASURE_NEGATIVE_AFFIXES = [
  { id: 'neg_atk', name: '宠物攻击力降低', format: function(v) { return '宠物攻击力 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.05 + qualityIdx * 0.03, 0.10 + qualityIdx * 0.05); } },
  { id: 'neg_crit', name: '暴击率降低', format: function(v) { return '暴击率 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.05 + qualityIdx * 0.02, 0.10 + qualityIdx * 0.04); } },
  { id: 'neg_hp', name: '气血上限降低', format: function(v) { return '气血上限 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.05 + qualityIdx * 0.03, 0.10 + qualityIdx * 0.05); } },
  { id: 'neg_def', name: '防御力降低', format: function(v) { return '防御力 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.05 + qualityIdx * 0.03, 0.10 + qualityIdx * 0.05); } },
  { id: 'neg_heal', name: '治疗效果降低', format: function(v) { return '治疗效果 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.10 + qualityIdx * 0.05, 0.20 + qualityIdx * 0.08); } },
  { id: 'neg_hit', name: '技能命中率降低', format: function(v) { return '技能命中率 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.05 + qualityIdx * 0.02, 0.10 + qualityIdx * 0.04); } },
  { id: 'neg_speed', name: '速度降低', format: function(v) { return '速度 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.05 + qualityIdx * 0.02, 0.10 + qualityIdx * 0.04); } },
  { id: 'neg_dodge', name: '闪避率降低', format: function(v) { return '闪避率 -' + Math.floor(v * 100) + '%'; }, genVal: function(qualityIdx) { return randomFloat(0.05 + qualityIdx * 0.02, 0.10 + qualityIdx * 0.04); } },
];
window.TREASURE_NEGATIVE_AFFIXES = TREASURE_NEGATIVE_AFFIXES;

// 生成负面词条
function generateNegativeAffixes(count, qualityIdx) {
  var result = [];
  var usedIds = {};
  var pool = TREASURE_NEGATIVE_AFFIXES.slice();
  for (var i = 0; i < count && pool.length > 0; i++) {
    var idx = Math.floor(Math.random() * pool.length);
    var affix = pool[idx];
    pool.splice(idx, 1); // 不重复
    result.push({
      id: affix.id,
      name: affix.name,
      value: affix.genVal(qualityIdx),
      format: affix.format,
      isNegative: true,
    });
  }
  return result;
}
window.generateNegativeAffixes = generateNegativeAffixes;

// 4.2 藏宝图合成时同步生成负面词条
// 在 synthTreasureMap 和 doManualSynth 中调用
function synthesizeNegativeAffixes(materials, targetAffixCount, qualityIdx) {
  // 收集所有材料的负面词条
  var negPool = {};
  materials.forEach(function(m) {
    (m.negativeAffixes || []).forEach(function(a) {
      if (!negPool[a.id]) negPool[a.id] = { id: a.id, name: a.name, format: a.format, values: [], isNegative: true };
      negPool[a.id].values.push(a.value);
    });
  });
  var resultNeg = [];
  // 相同负面词条：取最大值（负面效果更强）
  Object.keys(negPool).forEach(function(aid) {
    var pool = negPool[aid];
    if (pool.values.length >= 2) {
      var maxVal = Math.max.apply(null, pool.values);
      resultNeg.push({ id: pool.id, name: pool.name, value: Math.round(maxVal * 100) / 100, format: pool.format, isNegative: true });
    }
  });
  // 如果还没凑满，从剩余中随机保留
  var remainingNeg = Object.keys(negPool).filter(function(aid) { return negPool[aid].values.length < 2; }).map(function(aid) { return negPool[aid]; });
  remainingNeg.sort(function() { return Math.random() - 0.5; });
  for (var i = 0; i < remainingNeg.length && resultNeg.length < targetAffixCount; i++) {
    var pool = remainingNeg[i];
    var val = pool.values[0];
    if (Math.random() < 0.3) val *= 1.1;
    resultNeg.push({ id: pool.id, name: pool.name, value: Math.round(val * 100) / 100, format: pool.format, isNegative: true });
  }
  // 如果还不够，随机生成新负面词条
  while (resultNeg.length < targetAffixCount) {
    var newNegs = generateNegativeAffixes(1, qualityIdx);
    if (newNegs.length > 0 && !resultNeg.some(function(r) { return r.id === newNegs[0].id; })) {
      resultNeg.push(newNegs[0]);
    } else {
      break;
    }
  }
  return resultNeg.slice(0, targetAffixCount);
}
window.synthesizeNegativeAffixes = synthesizeNegativeAffixes;

// ==================== 五、抽蛋系统保底机制 ====================

// 5.1 T5宠物蛋100抽保底
// 保底计数器存储在 G.eggPityCount
function getEggPityCount() {
  if (G.eggPityCount === undefined) G.eggPityCount = 0;
  return G.eggPityCount;
}
window.getEggPityCount = getEggPityCount;

// 检查并执行保底逻辑（在每次抽蛋后调用）
function checkEggPity(drawnEgg) {
  var T5_PITY_THRESHOLD = 100;
  // 如果抽到T5（tier >= 4），重置计数
  if (drawnEgg && drawnEgg.tier >= 4) {
    G.eggPityCount = 0;
    return null; // 无保底触发
  }
  // 未抽到T5，计数+1
  G.eggPityCount = (G.eggPityCount || 0) + 1;
  // 检查是否达到保底
  if (G.eggPityCount >= T5_PITY_THRESHOLD) {
    G.eggPityCount = 0; // 重置计数
    // 发放随机T5宠物蛋
    var t5Names = [];
    if (typeof PET_NAMES !== 'undefined') {
      t5Names = PET_NAMES.filter(function(name) {
        return (typeof getPetTier === 'function') ? getPetTier(name) === 5 : false;
      });
    }
    if (t5Names.length === 0) return null;
    var chosenName = t5Names[Math.floor(Math.random() * t5Names.length)];
    var pet = (typeof generatePetBase === 'function') ? generatePetBase(chosenName, 0.10, true) : null;
    if (!pet) return null;
    var pityEgg = {
      id: 'egg_pity_' + Date.now() + '_' + randomInt(1000, 9999),
      petData: pet,
      tier: 4, // T5 (tier index 4)
      appraisalLevel: 0,
      revealed: { skills: false, growth: false, aptitude: false },
      hatchTime: randomInt(30, 120) * 405, // T5孵化时间
      hatchProgress: 0,
      isHatching: false,
      hatchInterval: null,
      poolType: 'pity',
      isPityReward: true,
    };
    G.eggs.push(pityEgg);
    saveGame();
    return pityEgg;
  }
  return null;
}
window.checkEggPity = checkEggPity;

// ==================== 六、天赋系统重置功能 ====================

// 6.1 单套天赋点重置
// 收费：10000金币/每点天赋点
function resetTalentBuild(build) {
  if (build === undefined) build = G.activeTalentBuild || 1;
  var talents = (build === 2) ? (G.talents2 || {}) : (G.talents || {});
  // 统计已分配点数（origin不计入）
  var allocatedPoints = 0;
  Object.keys(talents).forEach(function(id) {
    if (id === 'origin') return;
    allocatedPoints += talents[id] || 0;
  });
  if (allocatedPoints === 0) {
    showToast('当前方案无已分配的天赋点', 'info');
    return false;
  }
  var cost = allocatedPoints * 10000;
  if ((G.player.gold || 0) < cost) {
    showToast('金币不足！需要 ' + cost.toLocaleString() + ' 金币（' + allocatedPoints + '点 × 10000）', 'error');
    return false;
  }
  // 扣除金币
  G.player.gold -= cost;
  // 重置天赋
  if (build === 2) {
    G.talents2 = { origin: 1 };
  } else {
    G.talents = { origin: 1 };
  }
  saveGame();
  showToast('🔄 天赋方案' + build + '已重置！返还 ' + allocatedPoints + ' 点天赋点，消耗 ' + cost.toLocaleString() + ' 金币', 'success');
  render();
  return true;
}
window.resetTalentBuild = resetTalentBuild;

// 弹窗确认重置天赋
function confirmResetTalentBuild(build) {
  if (build === undefined) build = G.activeTalentBuild || 1;
  var talents = (build === 2) ? (G.talents2 || {}) : (G.talents || {});
  var allocatedPoints = 0;
  Object.keys(talents).forEach(function(id) {
    if (id === 'origin') return;
    allocatedPoints += talents[id] || 0;
  });
  if (allocatedPoints === 0) {
    showToast('当前方案无已分配的天赋点', 'info');
    return;
  }
  var cost = allocatedPoints * 10000;
  var html = '<div class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.8);" id="talentResetModal">' +
    '<div class="bg-card border-2 border-yellow-600 rounded-xl p-6 max-w-sm w-full mx-4">' +
    '<h2 class="font-bold text-lg text-yellow-400 mb-3 text-center">🔄 重置天赋方案' + build + '</h2>' +
    '<div class="bg-panel rounded-lg p-3 mb-3 space-y-1">' +
    '<p class="text-sm">已分配天赋点：<span class="font-bold text-yellow-400">' + allocatedPoints + ' 点</span></p>' +
    '<p class="text-sm">重置单价：<span class="text-secondary">10,000 金币/点</span></p>' +
    '<p class="text-sm">总消耗：<span class="font-bold text-red-400">' + cost.toLocaleString() + ' 金币</span></p>' +
    '<p class="text-sm">当前金币：<span class="text-secondary">' + (G.player.gold || 0).toLocaleString() + ' 金币</span></p>' +
    '</div>' +
    '<p class="text-xs text-secondary mb-3 text-center">重置后当前方案所有天赋点将全部返还，另一套方案不受影响。</p>' +
    '<div class="flex gap-2">' +
    '<button class="btn-gold flex-1" onclick="window._doResetTalent(' + build + ')">✓ 确认重置</button>' +
    '<button class="btn-primary flex-1" onclick="window._cancelResetTalent()">取消</button>' +
    '</div>' +
    '</div></div>';
  // 移除已有弹窗
  var existing = document.getElementById('talentResetModal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', html);
}
window.confirmResetTalentBuild = confirmResetTalentBuild;

window._doResetTalent = function(build) {
  var modal = document.getElementById('talentResetModal');
  if (modal) modal.remove();
  resetTalentBuild(build);
};

window._cancelResetTalent = function() {
  var modal = document.getElementById('talentResetModal');
  if (modal) modal.remove();
};

// ==================== 七、活动玩法战斗弹窗化重构 ====================

// 7.1 弹窗式完整战斗界面
// 使用标准战斗逻辑，封装为弹窗，不跳转页面

// 弹窗战斗状态
window._popupBattle = null;
window._popupBattleTimer = null;

// 启动弹窗战斗（替代原 startActivityBattleModal 的简化版）
// 使用与全屏战斗相同的底层逻辑
function startPopupBattle(opts) {
  if (!opts) return;
  var team = (typeof getTeamPets === 'function') ? getTeamPets() : [];
  if (team.length === 0) {
    showToast('请先选择上阵宠物', 'error');
    return;
  }

  // v3.1.0 需求2.1：获取宠物真实属性 + 技能列表（用于战斗特效展示）
  var realPetStats = team.map(function(p) {
    var stats = (typeof getPetStats === 'function') ? getPetStats(p) : null;
    var petCp = (typeof getPetCombatPower === 'function') ? getPetCombatPower(p) : 0;
    // 获取宠物主动技能列表
    var activeSkills = [];
    if (typeof getAllSkills === 'function') {
      var allSk = getAllSkills(p);
      activeSkills = allSk.filter(function(s) { return s.type === 'active' || !s.type; }).slice(0, 4);
    }
    return {
      pet: p,
      name: (typeof getPetDisplayName === 'function') ? getPetDisplayName(p) : (p.name || '宠物'),
      race: p.race || '史莱姆',
      rarity: p.rarity || 'white',
      level: p.level || 1,
      icon: '🐾',
      hp: stats ? Math.max(1, Math.floor(stats.气血 || 0)) : Math.max(1, Math.floor(petCp / 8)),
      maxHp: stats ? Math.max(1, Math.floor(stats.气血 || 0)) : Math.max(1, Math.floor(petCp / 8)),
      atk: stats ? Math.max(1, Math.floor(stats.攻击力 || 0)) : Math.max(1, Math.floor(petCp / 20)),
      def: stats ? Math.max(0, Math.floor(stats.防御力 || 0)) : 0,
      speed: stats ? Math.max(1, Math.floor(stats.速度 || 0)) : 100,
      critRate: stats ? (stats.暴击率 || 0.05) : 0.05,
      critDmg: stats ? (stats.暴击伤害 || 1.5) : 1.5,
      dodgeRate: 0.08, // 基础闪避率
      isAlive: true,
      skills: activeSkills,
    };
  });

  // 敌人属性
  var monsterPower = opts.monsterPower || 10000;
  var enemyMaxHp = Math.max(3000, Math.floor(monsterPower / 6));
  var enemyAtk = Math.max(100, Math.floor(monsterPower / 20));
  var enemyDef = Math.max(50, Math.floor(monsterPower / 40));
  var enemySpeed = Math.max(50, Math.floor(monsterPower / 100));
  var enemyRace = opts.enemyRace || '恶魔';
  var enemyType = opts.enemyType || 'mob';

  var winChance = Math.max(0.05, Math.min(0.98, opts.winChance || 0.5));
  var petDmgMult = 0.8 + winChance * 0.8;
  var enemyDmgMult = 0.8 + (1 - winChance) * 0.8;

  // v3.1.0 需求2.1：增强战斗模拟——含技能释放、暴击、闪避、格挡
  var logs = [];
  var maxTurns = 30;
  var petHp = realPetStats.reduce(function(s, p) { return s + p.hp; }, 0);
  var petMaxHp = petHp;
  var enemyHp = enemyMaxHp;
  // 保存宠物初始HP快照（用于UI渲染个体血条）
  var petHpSnapshots = realPetStats.map(function(s) { return { name: s.name, hp: s.hp, maxHp: s.maxHp, isAlive: true, race: s.race, rarity: s.rarity, level: s.level }; });

  for (var t = 0; t < maxTurns; t++) {
    var turn = t + 1;
    var actingPet = realPetStats[t % realPetStats.length];
    if (!actingPet.isAlive) {
      actingPet = realPetStats.find(function(p) { return p.isAlive; });
      if (!actingPet) break;
    }

    // v3.1.0：随机选择技能或普攻
    var useSkill = actingPet.skills && actingPet.skills.length > 0 && Math.random() < 0.6;
    var skillName = useSkill ? actingPet.skills[Math.floor(Math.random() * actingPet.skills.length)].name : '普攻';
    var skillMult = useSkill ? (1.3 + Math.random() * 0.7) : 1.0;

    // 闪避判定
    var isDodge = Math.random() < 0.06;
    if (isDodge) {
      logs.push({ turn: turn, actor: 'pet', petName: actingPet.name, skillName: skillName, isDodge: true, isCrit: false, dmg: 0, enemyHpLeft: Math.max(0, enemyHp), petHpLeft: petHp, petSnapshots: petHpSnapshots.map(function(s){return Object.assign({},s);}) });
    } else {
      var baseDmg = Math.floor(actingPet.atk * (0.8 + Math.random() * 0.4) * petDmgMult * skillMult);
      var isCrit = Math.random() < actingPet.critRate;
      var isBlock = !isCrit && Math.random() < 0.08;
      var petDmg = isCrit ? Math.floor(baseDmg * actingPet.critDmg) : baseDmg;
      if (isBlock) petDmg = Math.floor(petDmg * 0.5);
      petDmg = Math.max(1, petDmg);
      enemyHp -= petDmg;
      logs.push({ turn: turn, actor: 'pet', petName: actingPet.name, skillName: skillName, isDodge: false, isCrit: isCrit, isBlock: isBlock, dmg: petDmg, enemyHpLeft: Math.max(0, enemyHp), petHpLeft: petHp, petSnapshots: petHpSnapshots.map(function(s){return Object.assign({},s);}) });
    }

    if (enemyHp <= 0) break;

    // 敌人攻击
    var enemyDmg = Math.floor(enemyAtk * (0.8 + Math.random() * 0.4) * 0.8 * enemyDmgMult);
    enemyDmg = Math.max(1, enemyDmg);
    var alivePets = realPetStats.filter(function(p) { return p.isAlive; });
    var targetPet = null;
    var enemyDodge = false;
    if (alivePets.length > 0) {
      targetPet = alivePets[Math.floor(Math.random() * alivePets.length)];
      // 宠物闪避判定
      enemyDodge = Math.random() < (targetPet.dodgeRate || 0.08);
      if (!enemyDodge) {
        targetPet.hp -= enemyDmg;
        petHp -= enemyDmg;
        if (targetPet.hp <= 0) {
          targetPet.isAlive = false;
          targetPet.hp = 0;
        }
        // 更新快照
        var snapIdx = petHpSnapshots.findIndex(function(s) { return s.name === targetPet.name; });
        if (snapIdx >= 0) { petHpSnapshots[snapIdx].hp = targetPet.hp; petHpSnapshots[snapIdx].isAlive = targetPet.isAlive; }
      }
    }

    logs.push({
      turn: turn, actor: 'enemy', target: targetPet ? targetPet.name : '队伍',
      dmg: enemyDodge ? 0 : enemyDmg, isDodge: enemyDodge,
      enemyHpLeft: Math.max(0, enemyHp), petHpLeft: Math.max(0, petHp),
      petSnapshots: petHpSnapshots.map(function(s){return Object.assign({},s);})
    });

    if (petHp <= 0) break;
  }

  // 判定胜负
  var success;
  if (enemyHp <= 0) {
    success = true;
    enemyHp = 0;
  } else if (petHp <= 0) {
    success = false;
    petHp = 0;
  } else {
    var petRatio = petHp / petMaxHp;
    var enemyRatio = enemyHp / enemyMaxHp;
    success = petRatio >= enemyRatio;
    if (success) enemyHp = 0;
    else petHp = 0;
  }

  // v3.1.0 需求2.1：设置弹窗战斗状态（含种族、类型等标准战斗字段）
  window._popupBattle = {
    type: opts.type || 'activity',
    stage: opts.stage || 1,
    enemyName: opts.enemyName || '拦路怪物',
    enemyIcon: opts.enemyIcon || '👹',
    enemyLv: opts.enemyLv || G.player.level,
    enemyRace: enemyRace,
    enemyType: enemyType,
    enemyMaxHp: enemyMaxHp,
    enemyHp: enemyMaxHp,
    petMaxHp: petMaxHp,
    petHp: petMaxHp,
    team: team,
    realPetStats: realPetStats,
    petSnapshots: petHpSnapshots.map(function(s){return Object.assign({},s);}),
    logs: logs,
    currentTurn: 0,
    result: null,
    pendingResult: success,
    onComplete: opts.onComplete || null,
    showResultDelay: 1200,
    battleSpeed: G.battleSpeed || 1,
    isPaused: false,
    isSkipped: false,
    castEffect: null, // v3.1.0：技能特效播报
  };

  _schedulePopupBattleTurn();
  if (typeof render === 'function') render();
}
window.startPopupBattle = startPopupBattle;

function _schedulePopupBattleTurn() {
  if (window._popupBattleTimer) clearTimeout(window._popupBattleTimer);
  var pb = window._popupBattle;
  if (!pb || pb.result) return;
  if (pb.isPaused) return;
  var speed = pb.battleSpeed || 1;
  var delay = Math.max(200, 900 / speed);
  window._popupBattleTimer = setTimeout(_advancePopupBattleTurn, delay);
}
window._schedulePopupBattleTurn = _schedulePopupBattleTurn;

function _advancePopupBattleTurn() {
  var pb = window._popupBattle;
  if (!pb || pb.result) return;
  if (pb.currentTurn >= pb.logs.length) {
    // 战斗结束
    var success = pb.pendingResult;
    pb.result = success ? 'win' : 'lose';
    // 更新最终HP
    var lastLog = pb.logs[pb.logs.length - 1];
    if (lastLog) {
      pb.enemyHp = lastLog.enemyHpLeft;
      pb.petHp = lastLog.petHpLeft;
      if (lastLog.petSnapshots) pb.petSnapshots = lastLog.petSnapshots;
    }
    pb.castEffect = null;
    if (pb.onComplete) pb.onComplete(success);
    if (typeof render === 'function') render();
    return;
  }
  var log = pb.logs[pb.currentTurn];
  pb.currentTurn++;
  // 更新HP显示
  pb.enemyHp = log.enemyHpLeft;
  pb.petHp = log.petHpLeft;
  // v3.1.0：更新个体宠物血条快照
  if (log.petSnapshots) pb.petSnapshots = log.petSnapshots;
  // v3.1.0：设置技能特效播报
  if (log.actor === 'pet' && !log.isDodge) {
    pb.castEffect = { name: log.petName, skill: log.skillName || '普攻', isCrit: !!log.isCrit, isBlock: !!log.isBlock };
  } else if (log.actor === 'enemy' && !log.isDodge) {
    pb.castEffect = { name: pb.enemyName, skill: '攻击', isEnemy: true };
  } else {
    pb.castEffect = null;
  }
  if (typeof render === 'function') render();
  // v3.1.0：特效播报1秒后清除
  if (pb.castEffect) {
    setTimeout(function() {
      if (pb === window._popupBattle && pb.castEffect) {
        pb.castEffect = null;
      }
    }, 800);
  }
  _schedulePopupBattleTurn();
}
window._advancePopupBattleTurn = _advancePopupBattleTurn;

function closePopupBattleModal() {
  var pb = window._popupBattle;
  if (!pb) return;
  // 战斗过程中关闭=判定失败
  if (!pb.result) {
    if (pb.onComplete) pb.onComplete(false);
    showToast('战斗中途退出，判定为失败', 'error');
  }
  if (window._popupBattleTimer) { clearTimeout(window._popupBattleTimer); window._popupBattleTimer = null; }
  window._popupBattle = null;
  if (typeof render === 'function') render();
}
window.closePopupBattleModal = closePopupBattleModal;

function setPopupBattleSpeed(speed) {
  var pb = window._popupBattle;
  if (!pb) return;
  pb.battleSpeed = speed;
  _schedulePopupBattleTurn();
}
window.setPopupBattleSpeed = setPopupBattleSpeed;

function togglePopupBattlePause() {
  var pb = window._popupBattle;
  if (!pb) return;
  pb.isPaused = !pb.isPaused;
  if (!pb.isPaused) _schedulePopupBattleTurn();
  if (typeof render === 'function') render();
}
window.togglePopupBattlePause = togglePopupBattlePause;

function skipPopupBattle() {
  var pb = window._popupBattle;
  if (!pb || pb.result) return;
  // 快进到结果
  if (window._popupBattleTimer) { clearTimeout(window._popupBattleTimer); window._popupBattleTimer = null; }
  pb.currentTurn = pb.logs.length;
  _advancePopupBattleTurn();
}
window.skipPopupBattle = skipPopupBattle;

// 渲染弹窗战斗界面（完整标准战斗界面）
function renderPopupBattleModal() {
  var pb = window._popupBattle;
  if (!pb) return '';
  var enemyHpPct = Math.max(0, Math.min(100, (pb.enemyHp / pb.enemyMaxHp) * 100));
  var petHpPct = Math.max(0, Math.min(100, (pb.petHp / pb.petMaxHp) * 100));

  // v3.1.0 需求2.1：标准战斗日志——含技能名、暴击、闪避、格挡
  var visibleLogs = pb.logs.slice(0, pb.currentTurn).slice(-8);
  var logsHtml = visibleLogs.map(function(l) {
    if (l.actor === 'pet') {
      if (l.isDodge) {
        return '<p class="text-xs text-gray-400">回合' + l.turn + ' · 💨 敌人闪避了 ' + (l.petName || '') + ' 的' + (l.skillName || '攻击') + '</p>';
      }
      var parts = '回合' + l.turn + ' · ⚔️ ' + (l.petName || '') + ' 释放' + (l.skillName || '普攻');
      if (l.isBlock) parts += ' <span class="text-blue-400">格挡</span>';
      parts += ' 造成 <span class="font-bold text-green-400">' + l.dmg + '</span> 伤害';
      if (l.isCrit) parts += ' <span class="text-yellow-400 font-bold">暴击！</span>';
      return '<p class="text-xs" style="color:#86efac">' + parts + '</p>';
    } else {
      if (l.isDodge) {
        return '<p class="text-xs text-cyan-400">回合' + l.turn + ' · 💨 ' + (l.target || '队伍') + ' 闪避了敌人的攻击</p>';
      }
      return '<p class="text-xs" style="color:#fca5a5">回合' + l.turn + ' · 💢 敌人对 ' + (l.target || '队伍') + ' 造成 <span class="font-bold">' + l.dmg + '</span> 伤害</p>';
    }
  }).join('');

  // v3.1.0：使用当前快照渲染个体宠物血条
  var snapshots = pb.petSnapshots || [];
  var teamHtml = snapshots.slice(0, 3).map(function(s) {
    var raceEmoji = (typeof getRaceEmoji === 'function') ? getRaceEmoji(s.race) : '🐾';
    var icon = s.isAlive ? raceEmoji : '🪦';
    var hpPct = s.maxHp > 0 ? Math.max(0, Math.min(100, (s.hp / s.maxHp) * 100)) : 0;
    var rarityColor = '#9ca3af';
    if (typeof RARITIES !== 'undefined' && typeof RARITY_COLORS !== 'undefined') {
      var rIdx = RARITIES.indexOf(s.rarity);
      if (rIdx >= 0 && RARITY_COLORS[rIdx]) rarityColor = RARITY_COLORS[rIdx];
    }
    return '<div class="text-center flex-1">' +
      '<div class="text-2xl mb-0.5 ' + (s.isAlive ? '' : 'grayscale opacity-30') + '">' + icon + '</div>' +
      '<p class="text-[10px] font-bold truncate max-w-[70px] mx-auto" style="color:' + rarityColor + '">' + (s.name || '') + '</p>' +
      '<p class="text-[9px] text-secondary">Lv.' + (s.level || 1) + '</p>' +
      '<div class="w-full bg-gray-800 rounded-full h-1.5 mt-0.5 overflow-hidden border border-gray-700">' +
      '<div class="h-1.5 rounded-full transition-all duration-500 ' + (hpPct > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' : hpPct > 25 ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse') + '" style="width:' + hpPct + '%"></div>' +
      '</div></div>';
  }).join('');

  // 结果展示
  var resultHtml = '';
  if (pb.result) {
    var win = pb.result === 'win';
    resultHtml = '<div class="text-center py-4 animate-fade-in">' +
      '<div class="text-5xl mb-2">' + (win ? '🏆' : '💀') + '</div>' +
      '<p class="text-xl font-bold ' + (win ? 'text-green-400' : 'text-red-400') + '">' + (win ? '战斗胜利！' : '战斗失败...') + '</p>' +
      '</div>';
  }

  // v3.1.0：速度按钮（与主线战斗一致的倍速样式）
  var speedBtns = [1, 2, 4].map(function(s) {
    return '<button class="speed-btn ' + (pb.battleSpeed === s ? 'active' : '') + '" onclick="setPopupBattleSpeed(' + s + ')">' + (s * 1.5) + 'x</button>';
  }).join('');

  // v3.1.0：技能特效播报
  var castEffectHtml = '';
  if (pb.castEffect) {
    var ce = pb.castEffect;
    var castColor = ce.isEnemy ? '#ef4444' : '#fbbf24';
    var castIcon = ce.isCrit ? '💥' : ce.isBlock ? '🛡️' : '✨';
    castEffectHtml = '<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">' +
      '<div class="text-center animate-fade-in" style="animation-duration:0.3s;">' +
      '<div class="text-3xl mb-1">' + castIcon + '</div>' +
      '<p class="text-sm font-bold" style="color:' + castColor + ';text-shadow:0 0 10px ' + castColor + ';">' + (ce.name || '') + ' · ' + (ce.skill || '普攻') + '</p>' +
      (ce.isCrit ? '<p class="text-xs text-yellow-400 font-bold animate-pulse">暴击！</p>' : '') +
      (ce.isBlock ? '<p class="text-xs text-blue-400">格挡减伤</p>' : '') +
      '</div></div>';
  }

  // v3.1.0：敌人类型标签
  var enemyTypeLabel = pb.enemyType === 'boss' ? 'BOSS' : pb.enemyType === 'elite' ? '精英' : '';
  var enemyTypeColor = pb.enemyType === 'boss' ? '#ef4444' : pb.enemyType === 'elite' ? '#f59e0b' : '#94a3b8';
  var enemyIcon = pb.enemyType === 'boss' ? '👑' : pb.enemyType === 'elite' ? '⭐' : (pb.enemyIcon || '👹');
  var enemyRaceEmoji = (typeof getRaceEmoji === 'function') ? getRaceEmoji(pb.enemyRace) : '👹';

  return '<div id="popupBattleModal" class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.9);">' +
    '<div class="bg-card border-2 border-yellow-600 rounded-xl p-4 max-w-2xl w-full mx-4" style="box-shadow:0 0 40px rgba(245,158,11,0.3);max-height:90vh;overflow-y:auto;">' +
    // 顶部信息区 + 倍速控制
    '<div class="flex items-center justify-between mb-3">' +
    '<div class="flex items-center gap-2">' +
    '<h2 class="font-bold text-lg text-yellow-400">⚔️ ' + (pb.enemyName || '战斗') + '</h2>' +
    (pb.stage ? '<span class="text-xs text-secondary">第' + pb.stage + '关</span>' : '') +
    '</div>' +
    '<div class="flex items-center gap-2">' +
    '<span class="text-xs text-secondary">回合 ' + pb.currentTurn + '/' + pb.logs.length + '</span>' +
    '<div class="flex items-center gap-1">' + speedBtns + '</div>' +
    (!pb.result ? '<button class="speed-btn" onclick="togglePopupBattlePause()">' + (pb.isPaused ? '▶' : '⏸') + '</button>' : '') +
    (!pb.result ? '<button class="speed-btn" onclick="skipPopupBattle()">⏭</button>' : '') +
    '<button class="text-secondary hover:text-white text-sm" onclick="closePopupBattleModal()" ' + (pb.result ? '' : 'style="opacity:0.5"') + '>✕</button>' +
    '</div></div>' +
    // v3.1.0：标准战斗场景（与主线 renderBattleArena 一致的视觉风格）
    '<div class="battle-scene relative w-full flex flex-col overflow-hidden rounded-lg mb-3" style="background:linear-gradient(180deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%);min-height:280px;">' +
    '<div class="absolute inset-0 opacity-10 animate-battle-bg" style="background-image:radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px);background-size:20px 20px;"></div>' +
    // 技能特效播报层
    castEffectHtml +
    // 敌人区域（上方）
    '<div class="flex-1 flex flex-col relative z-10 p-3">' +
    '<div class="flex justify-end mb-2">' +
    '<div class="flex flex-col items-center">' +
    '<div class="relative">' +
    '<div class="text-3xl mb-0.5 drop-shadow-lg ' + (enemyHpPct <= 0 ? 'opacity-30' : '') + '">' + (enemyHpPct <= 0 ? '🪦' : enemyIcon) + '</div>' +
    '</div>' +
    '<span class="text-xs font-bold truncate max-w-[100px] text-center" style="color:' + enemyTypeColor + '">' + (pb.enemyName || '敌人') + '</span>' +
    '<span class="text-[10px] text-secondary">' + enemyRaceEmoji + 'Lv.' + (pb.enemyLv || 1) + (enemyTypeLabel ? ' <span style="color:' + enemyTypeColor + '">' + enemyTypeLabel + '</span>' : '') + '</span>' +
    '<div class="w-[120px] mt-0.5">' +
    '<div class="flex justify-between text-[10px] mb-0.5">' +
    '<span class="text-red-400 font-bold">HP</span>' +
    '<span class="text-secondary">' + Math.floor(Math.max(0, pb.enemyHp)) + '/' + pb.enemyMaxHp + '</span>' +
    '</div>' +
    '<div class="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">' +
    '<div class="h-full rounded-full transition-all duration-500 ' + (enemyHpPct > 50 ? 'bg-gradient-to-r from-red-500 to-red-400' : enemyHpPct > 25 ? 'bg-gradient-to-r from-orange-500 to-yellow-400' : 'bg-gradient-to-r from-red-700 to-red-500 animate-pulse') + '" style="width:' + enemyHpPct + '%"></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    // 队伍宠物区域（下方）
    '<div class="flex items-end pb-1">' +
    '<div class="flex flex-wrap gap-2 w-full">' +
    teamHtml +
    '</div>' +
    '</div>' +
    // 底部信息栏
    '<div class="flex justify-between items-center text-xs text-secondary bg-black/30 rounded-lg px-3 py-1 mt-1">' +
    '<span>' + (pb.enemyName || '') + '</span>' +
    '<span>队伍总HP: ' + Math.max(0, pb.petHp).toLocaleString() + ' / ' + pb.petMaxHp.toLocaleString() + '</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    // 战斗日志区
    '<div class="bg-panel rounded-lg p-2 mb-3 min-h-[80px] max-h-[120px] overflow-y-auto scrollbar-thin battle-log">' +
    (logsHtml || '<p class="text-xs text-secondary text-center py-4">⚔️ 战斗开始...</p>') +
    '</div>' +
    // 结果或操作栏
    (pb.result ? resultHtml + '<button class="btn-primary w-full mt-2" onclick="closePopupBattleModal()">确认</button>' :
     '<div class="text-center text-xs text-secondary">⚔️ 战斗进行中... 回合 ' + pb.currentTurn + '/' + pb.logs.length + '</div>') +
    '</div></div>';
}
window.renderPopupBattleModal = renderPopupBattleModal;

// v3.0 全面替换：将所有活动战斗入口重定向到弹窗战斗系统
// 原 economy.js 中的 startActivityBattleModal 调用将自动使用弹窗战斗
var _origStartActivityBattle = (typeof startActivityBattleModal === 'function') ? startActivityBattleModal : null;
window._origStartActivityBattle = _origStartActivityBattle;
window.startActivityBattleModal = function(opts) {
  if (typeof startPopupBattle === 'function') {
    startPopupBattle(opts);
  } else if (_origStartActivityBattle) {
    _origStartActivityBattle(opts);
  }
};

// ==================== 主线任务扩展：新增任务追踪 ====================

// 在关键操作时追踪主线任务进度
// 宠物获取追踪
function _trackPetAcquire() {
  if (typeof updateMainQuest === 'function') updateMainQuest('pet_acquire', 1);
}
window._trackPetAcquire = _trackPetAcquire;

// 属性加点追踪
function _trackAllocateAttr() {
  if (typeof updateMainQuest === 'function') updateMainQuest('allocate_attr', 1);
}
window._trackAllocateAttr = _trackAllocateAttr;

// 装备穿戴追踪
function _trackEquipWeapon() {
  if (typeof updateMainQuest === 'function') updateMainQuest('equip_weapon', 1);
}
window._trackEquipWeapon = _trackEquipWeapon;

// 符文装备追踪
function _trackRuneEquip() {
  if (typeof updateMainQuest === 'function') updateMainQuest('rune_equip', 1);
}
window._trackRuneEquip = _trackRuneEquip;

// 天赋学习追踪
function _trackTalentLearn() {
  if (typeof updateMainQuest === 'function') updateMainQuest('talent_learn', 1);
}
window._trackTalentLearn = _trackTalentLearn;

console.log('📦 v3_update.js 已加载——7大功能模块就绪');

// ==================== v3.1.0 更新记录 ====================
// 需求4.1：主线/支线任务分栏展示——在任务中心顶部新增主线任务分栏（紫色渐变边框）
// 需求5.1：活动解锁等级与排序重设——按解锁等级正序排列活动标签
// 需求7.1：新手礼包标准化——固定初始宠物成长值为1，品质改为普通（common）
// 需求8.1：活动页面描述优化——优化所有活动的描述文案，使其更清晰简洁

})();
