// ===== battle.js : 鎴樻枟绯荤粺 =====

// ==================== VISUAL BATTLE SYSTEM ====================

function getTeamPets() {
  return G.player.activeTeam.map(id => G.pets.find(p => p.id === id)).filter(Boolean);
}

function getPlayerCombatPower() {
  const team = getTeamPets();
  if (team.length === 0) return G.player.level * 10;
  return team.reduce((sum, p) => sum + getPetCombatPower(p), 0) * (1 + G.player.rebirth * 0.15);
}

function getMapProgress() {
  const mapId = G.player.currentMap;
  if (!G.mapProgress[mapId]) {
    const map = MAPS.find(m => m.id === mapId);
    G.mapProgress[mapId] = { currentLayer: 1, mobsKilled: 0, mobsNeeded: randomInt(8, 12), phase: 'mobs' };
  }
  return G.mapProgress[mapId];
}

function getLayerMonster(mapId, forceType) {
  const map = MAPS.find(m => m.id === mapId);
  if (!map) return null;
  const prog = getMapProgress();
  const lv = randomInt(map.minLv, map.maxLv);
  let name, hpMult, atkMult, enemyType;
  // 怪物强度强化：小怪×5, 精英×4, Boss×3（整体强度提升）
  // forceType 用于波次系统生成混合波次
  if (forceType) {
    enemyType = forceType;
  } else {
    if (prog.phase === 'mobs') enemyType = 'mob';
    else if (prog.phase === 'elite') enemyType = 'elite';
    else enemyType = 'boss';
  }
  // 任务16：怪物的种族与技能——boss使用 MAP_BOSSES 固定配置，小怪/精英按种族池随机
  var race = '史莱姆';
  var monsterSkills = [];
  var monsterPassives = [];
  var bossConfig = null;
  var mapRaces = MAP_MONSTER_RACES[mapId] || ['史莱姆', '哥布林'];

  if (enemyType === 'boss') {
    // boss 使用固定配置
    bossConfig = MAP_BOSSES[mapId] || MAP_BOSSES[1];
    name = bossConfig.name;
    race = bossConfig.race;
    monsterSkills = bossConfig.skills.slice();
    monsterPassives = bossConfig.passives.slice();
    hpMult = 24; atkMult = 12;
  } else if (enemyType === 'elite') {
    name = map.eliteName;
    race = pickRandom(mapRaces);
    var eliteCombo = (MONSTER_RACE_SKILLS[race] || MONSTER_RACE_SKILLS['史莱姆']).elite;
    monsterSkills = eliteCombo.active.slice();
    monsterPassives = eliteCombo.passive.slice();
    hpMult = 12; atkMult = 8;
  } else {
    name = pickRandom(map.monsters);
    race = pickRandom(mapRaces);
    var mobCombo = (MONSTER_RACE_SKILLS[race] || MONSTER_RACE_SKILLS['史莱姆']).mob;
    monsterSkills = mobCombo.active.slice();
    monsterPassives = mobCombo.passive.slice();
    hpMult = 5; atkMult = 5;
  }
  // 连续成长曲线：避免 lv 20/50/80 阶梯突变导致跨图难度跳跃过大
  var lvScale = 1 + lv * 0.012;
  var baseHp = Math.floor((40 + lv * 20) * hpMult * lvScale);
  var baseAtk = Math.floor((4 + lv * 3.8) * atkMult * lvScale);
  // 起源草地（地图1）强度削弱一半
  if (mapId === 1) {
    baseHp = Math.floor(baseHp * 0.5);
    baseAtk = Math.floor(baseAtk * 0.5);
  }
  var defMult = enemyType === 'boss' ? 2.2 : enemyType === 'elite' ? 1.6 : 1.2;
  // 修复：hp 与 maxHp 必须使用同一随机值，否则怪物开局就少血/超血
  var finalHp = baseHp + randomInt(-Math.floor(baseHp*0.05), Math.floor(baseHp*0.05));
  return {
    name, level: lv, enemyType,
    race,                       // 任务16：怪物种族
    skills: monsterSkills,      // 任务16：主动技能列表（id 数组）
    passives: monsterPassives,  // 任务16：被动技能列表（id 数组）
    bossConfig: bossConfig,     // 任务16：boss 配置（含 buffs/loot），非 boss 时为 null
    // 修复：hp 与 maxHp 必须使用同一随机值，否则怪物开局就少血/超血
    hp: finalHp,
    maxHp: finalHp,
    atk: baseAtk + randomInt(-Math.floor(baseAtk*0.1), Math.floor(baseAtk*0.1)),
    def: Math.floor(lv * 2.0 * defMult),
  };
}

// 生成怪物波次：根据当前关卡阶段生成多个怪物
// 小怪关卡：3-6个小怪 | 精英关卡：2精英+4小怪 | Boss关卡：1boss+2精英+3小怪
function generateMonsterWave(mapId) {
  const map = MAPS.find(m => m.id === mapId);
  if (!map) return [getLayerMonster(mapId)];
  const prog = getMapProgress();
  const wave = [];
  if (prog.phase === 'mobs') {
    // 小怪关卡：3-6个小怪
    const count = randomInt(3, 6);
    for (let i = 0; i < count; i++) wave.push(getLayerMonster(mapId, 'mob'));
  } else if (prog.phase === 'elite') {
    // 精英关卡：4小怪 + 2精英（精英最后出场）
    for (let i = 0; i < 4; i++) wave.push(getLayerMonster(mapId, 'mob'));
    for (let i = 0; i < 2; i++) wave.push(getLayerMonster(mapId, 'elite'));
  } else if (prog.phase === 'boss') {
    // Boss关卡：3小怪 + 2精英 + 1Boss（Boss最后出场）
    for (let i = 0; i < 3; i++) wave.push(getLayerMonster(mapId, 'mob'));
    for (let i = 0; i < 2; i++) wave.push(getLayerMonster(mapId, 'elite'));
    wave.push(getLayerMonster(mapId, 'boss'));
  } else {
    wave.push(getLayerMonster(mapId));
  }
  return wave;
}

// Live battle state for visual rendering
let liveBattle = null;
let battleTurnTimer = null;
let battleSpawnTimer = null;

// v2.2.0 需求1：走路阶段状态（主线战斗前置动画）
let walkPhase = null;  // { active: true, mapId, team, walkTimer, steps }
let walkTimer = null;

// v2.2.0 需求1：在线挂机彩蛋系统
const IDLE_EGG_DROP_CHANCE = 0.025; // 2.5% 概率掉落彩蛋
const IDLE_EGG_REWARDS = [
  { type: 'gold', min: 200, max: 800, icon: '🪙', name: '金币' },
  { type: 'exp', min: 100, max: 500, icon: '⭐', name: '经验' },
  { type: 'diamond', min: 1, max: 5, icon: '💎', name: '钻石' },
  { type: 'item', itemId: 'moon_dew', count: 1, icon: '🌙', name: '月华露' },
  { type: 'item', itemId: 'hatch_stone', count: 1, icon: '🥚', name: '孵化石' },
];

function getTurnDelay() {
  const speeds = { 1: 1200, 2: 600, 4: 250, 8: 125, 16: 62, 32: 31 };
  return speeds[G.battleSpeed] || 1200;
}

// v2.2.0 需求1：走路动画时长（按战斗速度缩放）
function getWalkDuration() {
  const baseMs = 2500; // 基础2.5秒
  const speedMult = G.battleSpeed <= 1 ? 1 : G.battleSpeed <= 2 ? 0.7 : G.battleSpeed <= 4 ? 0.5 : 0.3;
  return Math.floor(baseMs * speedMult);
}

function startLiveBattle() {
  if (liveBattle || walkPhase) return;
  const team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物！', 'error');
    return;
  }
  spawnMonster();
}

// v2.2.0 需求1：主线战斗走路动画阶段
function startWalkPhase() {
  const team = getTeamPets();
  if (team.length === 0) return;
  const map = MAPS.find(m => m.id === G.player.currentMap);
  if (!map) { spawnMonsterDirect(); return; }
  walkPhase = {
    active: true,
    mapId: G.player.currentMap,
    mapName: map.name,
    team: team,
    steps: 0,
  };
  if (currentScreen === 'main') renderBattleArena();
  // 走路动画结束后进入战斗
  clearTimeout(walkTimer);
  walkTimer = setTimeout(function() {
    walkPhase = null;
    spawnMonsterDirect();
  }, getWalkDuration());
}

// v2.2.0 需求1：spawnMonster 包装器——主线先走路，特殊战斗直接生成
function spawnMonster() {
  // 正在走路或战斗中，不重复触发
  if (walkPhase || liveBattle) return;
  // v2.2.0 需求3：移除不可达的死代码（liveBattle在此处必为null）
  // 主线战斗：先走路再遇敌（副本/藏宝图/竞技场通过各自的入口函数直接调用 spawnMonsterDirect）
  startWalkPhase();
}

// v2.2.0 需求1：直接生成怪物（跳过走路阶段），用于副本/藏宝图等
function spawnMonsterDirect() {
  const isSpecialBattle = liveBattle && (liveBattle.isDungeon || liveBattle.isTreasure || liveBattle.isArena);
  let monsters;
  if (liveBattle && (liveBattle.isDungeon || liveBattle.isTreasure)) {
    // 副本/藏宝图：单怪
    monsters = [getLayerMonster(G.player.currentMap)];
  } else {
    // 主线：使用波次系统——所有怪物同时上场
    monsters = generateMonsterWave(G.player.currentMap);
  }
  if (!monsters || monsters.length === 0) return;
  // 限制最多6个敌人
  if (monsters.length > 6) monsters = monsters.slice(0, 6);
  // 为每个怪物添加speed属性
  monsters.forEach(m => { if (!m.speed) m.speed = Math.floor((m.level || 1) * 2 + 10); });
  const team = getTeamPets();
  const petHp = {};
  const petMp = {};
  const petBuffs = {};
  const petStatus = {};
  const skillCooldowns = {};
  team.forEach(p => {
    const stats = getPetStats(p);
    petHp[p.id] = { current: stats.气血, max: stats.气血 };
    petMp[p.id] = { current: stats.魔法值, max: stats.魔法值 };
    petBuffs[p.id] = { atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0, dodgeBuff: 0, dodgeTurns: 0 };
    petStatus[p.id] = { frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, burning: 0, burnPct: 0 };
    skillCooldowns[p.id] = {};
  });
  // 每个怪物独立的HP和状态
  const monsterHpArray = monsters.map(m => m.hp);
  const monsterMaxHpArray = monsters.map(m => m.maxHp || m.hp);
  const monsterStatusArray = monsters.map(() => ({ frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, poisonStacks: 0, burning: 0, burnPct: 0, defReduced: 0, defReduceTurns: 0, tauntedBy: null, tauntTurns: 0 }));
  // 任务16：怪物buff数组（与 petBuffs 结构一致），boss 战斗开始时自动施加初始 buff
  const monsterBuffsArray = monsters.map(function(m) {
    var b = { atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0, dodgeBuff: 0, dodgeTurns: 0 };
    // boss 初始 buff：永久生效（reflectTurns 给一个大值表示持续整场）
    if (m.enemyType === 'boss' && m.bossConfig && m.bossConfig.buffs) {
      var buffs = m.bossConfig.buffs;
      if (buffs.atk)  { b.atk = buffs.atk;  b.buffTurns.atk = 9999; }
      if (buffs.def)  { b.def = buffs.def;  b.buffTurns.def = 9999; }
      if (buffs.spd)  { b.spd = buffs.spd;  b.buffTurns.spd = 9999; }
      if (buffs.all)  { b.all = buffs.all;  b.buffTurns.all = 9999; }
      if (buffs.reflect) { b.reflectBuff = buffs.reflect; b.reflectTurns = 9999; }
    }
    return b;
  });
  liveBattle = {
    monsters,                    // 怪物数组（所有同时上场的敌人）
    monsterHpArray,              // 每个怪物的HP
    monsterMaxHpArray,           // 每个怪物的MaxHP
    monsterStatusArray,          // 每个怪物的状态
    monsterBuffsArray,           // 任务16：每个怪物的buff（boss初始buff）
    team,
    petHp, petMp,
    petBuffs,
    petStatus,
    skillCooldowns,
    turnQueue: [],
    round: 0,
    animating: false,
    totalDamage: 0,
    logs: [],
    droppedChests: [],
    isDungeon: false,
    dungeonId: null,
    dungeonWave: 0,
    dungeonMaxWaves: 0,
    isArena: false,
    isTreasure: false,
    treasureMap: null,
    activeAuras: {}, // 需求20：已生效的光环技能（key=技能ID，value=true），避免重复释放
  };
  if (currentScreen === 'main') renderBattleArena();
  buildTurnQueue();
  scheduleNextTurn();
}

// ===== 多怪物辅助函数 =====
// 获取所有存活怪物的索引
function getAliveMonsterIndices() {
  if (!liveBattle || !liveBattle.monsters) return [];
  var indices = [];
  for (var i = 0; i < liveBattle.monsters.length; i++) {
    if (liveBattle.monsterHpArray[i] > 0) indices.push(i);
  }
  return indices;
}
// 随机选择一个存活怪物索引
function getRandomAliveMonsterIdx() {
  var alive = getAliveMonsterIndices();
  if (alive.length === 0) return -1;
  return alive[Math.floor(Math.random() * alive.length)];
}
// 检查是否所有怪物都死了
function allMonstersDead() {
  return getAliveMonsterIndices().length === 0;
}

// 推进波次或结束战斗（怪物被击败时调用）
function advanceWaveOrEndBattle() {
  if (!liveBattle) return;
  // 如果还有存活怪物，继续战斗
  if (!allMonstersDead()) {
    liveBattle.animating = false;
    scheduleNextTurn();
    return;
  }
  // 所有怪物都死了，给奖励（已死亡的怪物逐个给，去重）
  liveBattle.monsters.forEach(function(m) { giveMonsterKillRewards(m); });
  // 处理关卡进度
  processWaveCleared();
}

// 给予单个怪物击杀奖励（经验、宝箱、统计）- 不含关卡进度
function giveMonsterKillRewards(monster) {
  if (!monster) return;
  // 去重：避免对同一怪物重复给奖励
  if (monster._rewarded) return;
  monster._rewarded = true;
  const lvDiff = monster.level - G.player.level;
  const expGain = Math.max(5, (monster.level * 8 + lvDiff * 5) * (1 + G.player.rebirth * 0.2));
  const actualExpGain = addExp(expGain);
  addBattleLog('loot', `⭐ 获得 ${actualExpGain} 经验`);
  // 主线掉落金币
  const goldGain = Math.floor(monster.level * 5 * (1 + G.player.rebirth * 0.1));
  addGold(goldGain);
  addBattleLog('loot', `🪙 获得 ${goldGain} 金币`);
  const enemyType = monster.enemyType || 'mob';
  // 恢复主线宝箱掉落（需求22）
  const droppedChests = dropChests(enemyType);
  droppedChests.forEach(c => {
    const cr = CHEST_RARITIES.find(r => r.id === c.rarity);
    addBattleLog('loot', `${cr.icon} 掉落了 ${cr.name}！`);
  });
  if (G.autoOpenChests) {
    droppedChests.forEach(c => openChestDirect(c));
  } else {
    G.chests.push(...droppedChests);
    if (liveBattle) liveBattle.droppedChests = droppedChests;
  }
  G.statistics.totalBattles++;
  updateAchievement('battle', 1);
  // 天赋额外掉落（所有战斗）
  maybeDropTalentLoot(enemyType);
  updateDailyTask('battle_10', 1);
  G.player.battlePassExp += 10;
  checkBattlePassLevelUp();
  // 需求1：主线任务进度更新（战斗类）
  if (typeof updateMainQuest === 'function') updateMainQuest('battle', 1);
  if (typeof updateMainQuest === 'function') updateMainQuest('battle_exp', 1);
  if (typeof updateMainQuest === 'function') updateMainQuest('battle_gold', 1);
}

// 波次清空后处理关卡进度（原 processBattleRewardsLive 的进度逻辑）
function processWaveCleared() {
  if (!liveBattle) return;
  const map = MAPS.find(m => m.id === G.player.currentMap);
  // 副本/藏宝图走原流程
  if (liveBattle.isDungeon) {
    processDungeonWaveComplete();
    return;
  }
  if (liveBattle.isTreasure && liveBattle.treasureMap) {
    processTreasureRewards();
    return;
  }
  // 主线关卡进度推进（按波次计1次）
  // 多怪物同时上场：取最高等级的怪物类型判定关卡进度
  // boss优先 > elite > mob
  let enemyType = 'mob';
  for (let i = 0; i < liveBattle.monsters.length; i++) {
    const t = liveBattle.monsters[i].enemyType || 'mob';
    if (t === 'boss') { enemyType = 'boss'; break; }
    if (t === 'elite' && enemyType === 'mob') enemyType = 'elite';
  }
  const prog = getMapProgress();
  if (enemyType === 'mob') {
    prog.mobsKilled++;
    if (prog.mobsKilled >= prog.mobsNeeded) {
      prog.phase = 'elite';
      prog.mobsKilled = 0;
      addBattleLog('info', `⚡ 第${prog.currentLayer}层小怪已清完！精英怪出现了！`);
    }
  } else if (enemyType === 'elite') {
    if (prog.currentLayer >= map.layers) {
      prog.phase = 'boss';
      addBattleLog('info', `👑 最终BOSS ${map.bossName} 降临！`);
    } else {
      prog.currentLayer++;
      prog.phase = 'mobs';
      prog.mobsKilled = 0;
      prog.mobsNeeded = randomInt(8, 12);
      addBattleLog('info', `🏁 通关第${prog.currentLayer - 1}层！进入第${prog.currentLayer}层`);
    }
  } else if (enemyType === 'boss') {
    prog.phase = 'cleared';
    addBattleLog('info', `🎊 恭喜！击败了 ${map.bossName}，${map.name} 已通关！`);
    if (G.player.currentMap < MAPS.length) {
      addBattleLog('info', `🗺️ 解锁了新地图：${MAPS[G.player.currentMap].name}！`);
    }
    updateAchievement('map_clear', 1);
  }
  maybeDropTreasureMap();
  // v2.2.0 需求1：在线挂机彩蛋掉落（仅主线战斗，仅在线挂机时）
  if (autoBattleInterval) maybeDropIdleEgg();
  saveGame();
  liveBattle = null;
  if (currentScreen === 'main') render();
  if (autoBattleInterval) {
    battleSpawnTimer = setTimeout(() => {
      spawnMonster();
      if (currentScreen === 'main') {
        render();
        setTimeout(() => renderBattleArena(), 50);
      }
    }, 1000);
  }
}

// 构建速度排序的行动队列：所有存活宠物+所有存活怪物按速度降序
function buildTurnQueue() {
  if (!liveBattle) return;
  var actors = [];
  liveBattle.team.forEach(function(pet) {
    var hp = liveBattle.petHp[pet.id];
    if (hp && hp.current > 0) {
      var stats = getPetStats(pet);
      actors.push({ type: 'pet', petId: pet.id, speed: stats.速度 || 10 });
    }
  });
  // 所有存活怪物都加入队列
  for (var i = 0; i < liveBattle.monsters.length; i++) {
    if (liveBattle.monsterHpArray[i] > 0) {
      actors.push({ type: 'monster', monsterIdx: i, speed: liveBattle.monsters[i].speed || 10 });
    }
  }
  actors.sort(function(a, b) { return b.speed - a.speed; });
  liveBattle.turnQueue = actors;
  liveBattle.round++;
  addBattleLog('info', '── 第 ' + liveBattle.round + ' 回合 ──');
}

function scheduleNextTurn() {
  if (!liveBattle || !autoBattleInterval) return;
  clearTimeout(battleTurnTimer);
  battleTurnTimer = setTimeout(function() { executeTurn(); }, getTurnDelay());
}

function executeTurn() {
  if (!liveBattle || !autoBattleInterval) return;
  if (liveBattle.animating) return;

  // 队列空 -> 回合结束，开始新回合
  if (liveBattle.turnQueue.length === 0) {
    applyTurnRegen();
    // 检查是否所有怪物都死了（DoT击杀）
    if (allMonstersDead()) {
      // 记录所有本轮击杀的怪物日志
      liveBattle.monsters.forEach(function(m, i) {
        if (liveBattle.monsterHpArray[i] <= 0 && !m._killLogged) {
          m._killLogged = true;
          liveBattle.logs.unshift({ type: 'loot', msg: `🏆 击败了 ${m.name}！` });
          addBattleLog('loot', `🏆 击败了 ${m.name}！`);
        }
      });
      advanceWaveOrEndBattle();
      return;
    }
    var aliveCount = liveBattle.team.filter(function(p) { return liveBattle.petHp[p.id] && liveBattle.petHp[p.id].current > 0; }).length;
    if (aliveCount === 0) { processBattleDefeat(); return; }
    buildTurnQueue();
  }

  var actor = liveBattle.turnQueue.shift();
  if (!actor) { scheduleNextTurn(); return; }

  if (actor.type === 'pet') {
    var pet = liveBattle.team.find(function(p) { return p.id === actor.petId; });
    if (!pet || !liveBattle.petHp[pet.id] || liveBattle.petHp[pet.id].current <= 0) {
      scheduleNextTurn(); return; // 跳过已死宠物
    }
    executePetAction(pet);
  } else {
    executeMonsterAction(actor.monsterIdx);
  }
}

function getFormationPet(formPos) {
  if (!liveBattle) return null;
  const formation = G.player.formation || ['front','mid','back'];
  const idx = formation.indexOf(formPos);
  if (idx < 0 || idx >= liveBattle.team.length) return null;
  const pet = liveBattle.team[idx];
  if (!pet) return null;
  const hp = liveBattle.petHp[pet.id];
  if (!hp || hp.current <= 0) return null;
  return pet;
}

function getActiveSkills(pet) {
  const normalSkills = getNormalSkills(pet);
  return normalSkills.filter(s => s.type === 'active');
}

// 判断技能是物理还是法术
function isPhysicalSkill(skill) {
  if (skill.category === 'single_heal' || skill.category === 'aoe_heal' || skill.category === 'single_buff' || skill.category === 'aoe_buff') return false;
  // 法术元素：冰/雷/暗/光/毒/火（部分）
  var magicElements = ['冰', '雷', '暗', '光', '毒'];
  if (skill.element && magicElements.indexOf(skill.element) >= 0) return false;
  return true; // 默认物理
}

// 主动技能概率触发 + 魔法值检查
// 重做：物理≤15%, 法术≤40%, 辅助≤50%，多技能独立判断，主动技能只生效3个
function tryUseActiveSkill(pet) {
  if (!liveBattle) return null;
  const status = liveBattle.petStatus[pet.id];
  if (status && (status.silenced > 0 || status.stunned > 0 || status.frozen > 0 || status.sleeping > 0)) return null;
  const activeSkills = getActiveSkills(pet);
  if (activeSkills.length === 0) return null;
  // 魔法值不足的技能不可用
  var mp = liveBattle.petMp[pet.id];
  const cooldowns = liveBattle.skillCooldowns[pet.id];
  var available = activeSkills.filter(function(s) {
    if (cooldowns[s.id] && cooldowns[s.id] > 0) return false;
    var cost = getSkillMpCost(s);
    if (mp && mp.current < cost) return false;
    return true;
  });
  if (available.length === 0) return null;
  const passives = getPassiveEffects(pet);
  const bloodline = getBloodlineSkill(pet);
  const petStats = getPetStats(pet);
  // 被动技能触发加成
  var passiveBonus = passives.skillTrigger || 0;
  // 天赋法术共鸣加成（pet_skill_trigger）
  if (petStats.skillTrigger) passiveBonus += petStats.skillTrigger;
  // 血统技能触发加成（通用效果系统）
  if (bloodline && bloodline.effects && bloodline.effects.skillTrigger) passiveBonus += bloodline.effects.skillTrigger;
  // 重做：按技能类型独立判断触发概率
  // 物理≤15%, 法术≤40%, 辅助≤50%，超过3个只生效3个
  var triggeredSkills = [];
  // 限制最多3个技能生效
  var checkList = available.slice(0, Math.min(3, available.length));
  for (var i = 0; i < checkList.length; i++) {
    var skill = checkList[i];
    var isMagic = !isPhysicalSkill(skill);
    var isSupport = (skill.category === 'single_heal' || skill.category === 'aoe_heal' || skill.category === 'single_buff' || skill.category === 'aoe_buff');
    var baseChance;
    if (isSupport) {
      baseChance = 0.25; // 辅助基础25%，上限50%
    } else if (isMagic) {
      baseChance = 0.20; // 法术基础20%，上限40%
    } else {
      baseChance = 0.08; // 物理基础8%，上限15%
    }
    var triggerChance = baseChance + passiveBonus * 0.5; // 被动加成只生效50%
    // 应用上限
    if (isSupport) triggerChance = Math.min(triggerChance, 0.50);
    else if (isMagic) triggerChance = Math.min(triggerChance, 0.40);
    else triggerChance = Math.min(triggerChance, 0.15);
    if (Math.random() < triggerChance) {
      triggeredSkills.push(skill);
    }
  }
  if (triggeredSkills.length === 0) return null;
  // 返回第一个触发的技能
  return triggeredSkills[0];
}

// 技能魔法消耗
function getSkillMpCost(skill) {
  if (!skill) return 0;
  if (skill.mpCost) return skill.mpCost;
  // 按类型自动计算：攻击技能消耗较高，辅助较低
  var cat = skill.category || '';
  var tier = getSkillTier(skill.id);
  if (cat.indexOf('atk') >= 0 || cat.indexOf('cc') >= 0) return 8 + tier * 4;
  if (cat.indexOf('heal') >= 0) return 6 + tier * 3;
  if (cat.indexOf('buff') >= 0) return 5 + tier * 2;
  return 8;
}

function getSkillTarget(skill, pet) {
  if (!liveBattle) return null;
  const target = skill.target;
  if (target === 'enemy_front' || target === 'enemy_all') return 'monster';
  if (target === 'ally_self') return pet;
  if (target === 'ally_lowest') {
    let lowest = null, lowestHp = Infinity;
    liveBattle.team.forEach(p => {
      const hp = liveBattle.petHp[p.id];
      if (hp && hp.current > 0 && hp.current < lowestHp) { lowest = p; lowestHp = hp.current; }
    });
    return lowest || pet;
  }
  // 需求3：复活技能目标 - 优先选择已阵亡队友
  if (target === 'ally_dead') {
    let deadAlly = null;
    liveBattle.team.forEach(p => {
      const hp = liveBattle.petHp[p.id];
      if (hp && hp.current <= 0 && !deadAlly) { deadAlly = p; }
    });
    // 如果没有阵亡队友，退化为最低血量队友
    if (deadAlly) return deadAlly;
    let lowest = null, lowestHp = Infinity;
    liveBattle.team.forEach(p => {
      const hp = liveBattle.petHp[p.id];
      if (hp && hp.current > 0 && hp.current < lowestHp) { lowest = p; lowestHp = hp.current; }
    });
    return lowest || pet;
  }
  if (target === 'ally_all') return 'all_allies';
  return 'monster';
}

function executePetAction(pet) {
  if (!liveBattle) return;
  liveBattle.animating = true;

  const status = liveBattle.petStatus[pet.id];
  if (status) {
    if (status.stunned > 0) { addBattleLog('info', `💫 ${getPetDisplayName(pet)} 被眩晕，无法行动！`); status.stunned--; nextFromQueue(); return; }
    if (status.frozen > 0) { addBattleLog('info', `❄️ ${getPetDisplayName(pet)} 被冻结，无法行动！`); status.frozen--; nextFromQueue(); return; }
    if (status.sleeping > 0) { addBattleLog('info', `😴 ${getPetDisplayName(pet)} 正在睡眠...`); status.sleeping--; nextFromQueue(); return; }
    if (status.rooted > 0) { addBattleLog('info', `🌿 ${getPetDisplayName(pet)} 被定身，无法行动！`); status.rooted--; nextFromQueue(); return; }
  }

  // 需求20：光环技能无冷却时必定释放（在主动技能检查之前，不占用主动技能触发次数）
  tryExecuteAuraSkills(pet);

  const activeSkill = tryUseActiveSkill(pet);
  if (activeSkill) {
    executeActiveSkill(pet, activeSkill);
    return;
  }
  executeNormalAttack(pet);
}

// 需求20：获取宠物的光环技能列表
function getAuraSkills(pet) {
  const allSkills = getAllSkills(pet);
  return allSkills.filter(s => s.type === 'aura');
}

// 需求20：检查并释放无冷却的光环技能（100%触发，不经过概率判定）
function tryExecuteAuraSkills(pet) {
  if (!liveBattle) return;
  if (!liveBattle.activeAuras) liveBattle.activeAuras = {};
  const auraSkills = getAuraSkills(pet);
  if (!auraSkills || auraSkills.length === 0) return;
  auraSkills.forEach(skill => {
    // 仅处理无冷却（cd 不存在或为0）的光环技能
    if (skill.cd && skill.cd > 0) return;
    // 当前已有同名光环生效，跳过避免重复释放
    if (liveBattle.activeAuras[skill.id]) return;
    // 标记为已生效
    liveBattle.activeAuras[skill.id] = true;
    // 释放光环技能（应用效果 + 日志 + 动画）
    executeAuraSkill(pet, skill);
  });
}

// 需求20：光环技能效果应用函数
// 光环效果本身已通过 getAuraEffects(liveBattle.team) 被动叠加到全队属性上，
// 这里负责显示性的"释放"动作：日志、动画、记录生效状态。
function executeAuraSkill(pet, skill) {
  if (!liveBattle || !skill) return;
  const auraName = skill.name || '光环';
  if (typeof showSkillCastAnnouncement === 'function') {
    showSkillCastAnnouncement(getPetDisplayName(pet), auraName, skill.type || 'aura');
  }
  // 构造效果描述
  var descParts = [];
  if (skill.effect) {
    var effMap = {
      teamAtk: '全队攻击力', teamDef: '全队防御力', teamSpd: '全队速度',
      teamHp: '全队气血上限', teamCrit: '全队暴击率', teamRegen: '全队每回合回复',
    };
    Object.keys(skill.effect).forEach(k => {
      if (effMap[k]) {
        var pct = Math.round(skill.effect[k] * 100);
        descParts.push(effMap[k] + '+' + pct + '%');
      }
    });
  }
  var desc = descParts.length > 0 ? descParts.join('，') : (skill.desc || '光环效果');
  addBattleLog('skill', `✨ ${getPetDisplayName(pet)} 释放光环【${auraName}】：${desc}`);
  liveBattle.logs.unshift({ type: 'skill', msg: `✨ ${getPetDisplayName(pet)} 释放光环【${auraName}】` });
  // 光环释放动画：对自身播放
  if (currentScreen === 'main') {
    var petEl = document.getElementById('battle-pet-' + pet.id);
    if (petEl) {
      petEl.classList.remove('animate-pet-attack');
      void petEl.offsetWidth;
      petEl.classList.add('animate-pet-attack');
    }
  }
}

// 获取宠物攻击力（含各种加成）
function getPetAtkPower(pet, stats, passives, auras, buffs, bloodline) {
  var atkPower = stats.攻击力 * (1 + G.player.rebirth * 0.1);
  if (passives.atkBonus) atkPower *= (1 + passives.atkBonus);
  if (passives.strBonus) atkPower *= (1 + passives.strBonus);
  if (auras.teamAtk) atkPower *= (1 + auras.teamAtk);
  if (buffs && buffs.atk) atkPower *= (1 + buffs.atk);
  if (buffs && buffs.all) atkPower *= (1 + buffs.all);
  // 血统加成（通用效果系统）
  if (bloodline && bloodline.effects) {
    var eff = bloodline.effects;
    if (eff.atkPct) atkPower *= (1 + eff.atkPct);
    if (eff.allPct) atkPower *= (1 + eff.allPct);
    // 低血量攻击力加成（恶魔契约等）
    if (eff.lowHpAtkBoost) {
      const hp = liveBattle.petHp[pet.id];
      const hpPct = hp ? hp.current / hp.max : 1;
      atkPower *= (1 + Math.max(0, (1 - hpPct) * eff.lowHpAtkBoost));
    }
  }
  // 人物属性20%已通过getPetStats()附加到宠物四维属性中，不再重复计算
  const charBonus = getCharacterBonusForPet();
  if (charBonus.petDmg) atkPower *= (1 + charBonus.petDmg);
  // 偷取的攻击力加成
  if (buffs && buffs.stolenAtk) atkPower += buffs.stolenAtk;
  return atkPower;
}

// 获取宠物灵力（含加成）
function getPetSpiritPower(pet, stats, passives, auras, buffs) {
  var spirit = stats.灵力 * (1 + G.player.rebirth * 0.1);
  if (passives.atkBonus) spirit *= (1 + passives.atkBonus);
  if (auras.teamAtk) spirit *= (1 + auras.teamAtk);
  if (buffs && buffs.atk) spirit *= (1 + buffs.atk);
  if (buffs && buffs.all) spirit *= (1 + buffs.all);
  const charBonus = getCharacterBonusForPet();
  if (charBonus.petDmg) spirit *= (1 + charBonus.petDmg);
  return spirit;
}

function executeNormalAttack(pet) {
  if (!liveBattle) return;
  // 随机选择一个存活怪物作为目标
  var targetIdx = getRandomAliveMonsterIdx();
  if (targetIdx < 0) { nextFromQueue(); return; }
  var monster = liveBattle.monsters[targetIdx];
  var ms = liveBattle.monsterStatusArray[targetIdx];
  const stats = getPetStats(pet);
  const passives = getPassiveEffects(pet);
  const auras = getAuraEffects(liveBattle.team);
  const bloodline = getBloodlineSkill(pet);
  const buffs = liveBattle.petBuffs[pet.id];

  let atkPower = getPetAtkPower(pet, stats, passives, auras, buffs, bloodline);

  // 需求1：目标怪物被动技能（防御类）
  var tgtMPassivesAtk = getMonsterPassiveEffects(targetIdx);

  // 需求1：怪物被动闪避（dodge / 闪避）
  var mDodgeChanceAtk = tgtMPassivesAtk.dodgeBonus || 0;
  if (mDodgeChanceAtk > 0 && Math.random() < mDodgeChanceAtk) {
    liveBattle.logs.unshift({ type: 'dodge', msg: `🌀 ${monster.name} 闪避了 ${getPetDisplayName(pet)} 的攻击！` });
    addBattleLog('dodge', `🌀 ${monster.name} 闪避了 ${getPetDisplayName(pet)} 的普攻！`);
    if (currentScreen === 'main') animateDodge(pet);
    setTimeout(() => nextFromQueue(), 400);
    return;
  }

  let critChance = 0.10;
  if (passives.critRate) critChance += passives.critRate;
  if (auras.teamCrit) critChance += auras.teamCrit;
  // 血统暴击率加成（通用效果系统）
  if (bloodline && bloodline.effects && bloodline.effects.critRate) critChance += bloodline.effects.critRate;
  // 人物暴击率20%附加给宠物
  if (stats.critRate) critChance += stats.critRate;
  // 需求1：怪物被动 antiCrit（幸运）- 降低被暴击概率
  if (tgtMPassivesAtk.antiCrit) critChance = Math.max(0, critChance - tgtMPassivesAtk.antiCrit);
  const isCrit = Math.random() < critChance;

  let ignoreDef = 0;
  if (passives.ignoreDef) ignoreDef = passives.ignoreDef;

  let def = monster.def;
  if (ms.defReduced > 0) def *= (1 - ms.defReduced);
  // 需求1：怪物被动 defBonus 加成（防御/坚盾）
  if (tgtMPassivesAtk.defBonus) def *= (1 + tgtMPassivesAtk.defBonus);
  // 防御削减系数0.7→0.6：让防御收益相对降低，提升技能/普攻伤害的体感
  let rawDmg = atkPower - def * (0.6 - ignoreDef);
  rawDmg = Math.round(rawDmg * randomFloat(0.90, 1.10));
  if (isCrit) {
    // 需求1：暴击倍率1.8→1.5（与经典梦幻保持一致，避免爆发过高）
    let critMult = 1.5;
    if (passives.critDmg) critMult += passives.critDmg;
    // 天赋暴击伤害加成（pet_crit_dmg）
    if (stats.critDmg) critMult += stats.critDmg;
    rawDmg = Math.round(rawDmg * critMult);
  }
  let damage = Math.max(1, rawDmg);

  // 需求1：怪物被动 dmgReduce 减伤（坚韧/坚盾）
  if (tgtMPassivesAtk.dmgReduce) damage = Math.round(damage * (1 - tgtMPassivesAtk.dmgReduce));
  // 需求1：怪物被动 parryChance 招架（招架/parry）
  if (tgtMPassivesAtk.parryChance && Math.random() < tgtMPassivesAtk.parryChance) {
    damage = Math.round(damage * (1 - (tgtMPassivesAtk.parryReduce || 0.5)));
    addBattleLog('skill', `🛡️ ${monster.name} 招架了攻击！伤害降低`);
    if (tgtMPassivesAtk.parryCounter) {
      var parryCounterDmg = Math.max(1, Math.floor(monster.atk * 0.4));
      liveBattle.petHp[pet.id].current = Math.max(0, liveBattle.petHp[pet.id].current - parryCounterDmg);
      addBattleLog('skill', `⚡ ${monster.name} 招架反击对 ${getPetDisplayName(pet)} 造成 ${parryCounterDmg} 伤害`);
    }
  }

  // 装备特效：绝杀（5%概率秒杀小怪，对精英/首领无效）
  var equipSpecials = stats.equipSpecials || [];
  if (equipSpecials.indexOf('execute') >= 0 && monster.enemyType === 'mob' && Math.random() < 0.05) {
    damage = liveBattle.monsterHpArray[targetIdx];
    addBattleLog('skill', `💀 ${getPetDisplayName(pet)} 触发【绝杀】！秒杀了 ${monster.name}`);
  }

  let doubleChance = 0;
  if (passives.doubleChance) doubleChance = passives.doubleChance;
  const isDouble = Math.random() < doubleChance;
  let tripleChance = passives.tripleChance || 0;
  const isTriple = Math.random() < tripleChance;

  liveBattle.monsterHpArray[targetIdx] -= damage;
  liveBattle.totalDamage += damage;

  // 需求1：怪物被动 reflectPct 反震（报复/反击/反震）
  if (tgtMPassivesAtk.reflectPct && damage > 0) {
    var reflectDmgM = Math.floor(damage * tgtMPassivesAtk.reflectPct);
    if (reflectDmgM > 0) {
      liveBattle.petHp[pet.id].current = Math.max(0, liveBattle.petHp[pet.id].current - reflectDmgM);
      addBattleLog('skill', `💢 ${monster.name} 反震对 ${getPetDisplayName(pet)} 造成 ${reflectDmgM} 伤害`);
      // 需求1：反震眩晕（counter_strike 逆击等）
      if (tgtMPassivesAtk.stunChance && Math.random() < tgtMPassivesAtk.stunChance) {
        var ps = liveBattle.petStatus[pet.id];
        if (ps) ps.stunned = (ps.stunned || 0) + 1;
        addBattleLog('skill', `💫 ${monster.name} 的反震眩晕了 ${getPetDisplayName(pet)}！`);
      }
    }
  }

  // 血统额外伤害（通用效果系统）
  if (bloodline && bloodline.effects) {
    var eff2 = bloodline.effects;
    // 龙族威压：对非龙族敌人额外10%伤害
    if (eff2.extraDmgVsNonDragon && monster.race !== '龙') {
      var extraDmg = Math.round(damage * eff2.extraDmgVsNonDragon);
      liveBattle.monsterHpArray[targetIdx] -= extraDmg;
      damage += extraDmg;
    }
    // 审判之翼：对恶魔系敌人额外20%伤害
    if (eff2.extraDmgVsDemon && monster.race === '恶魔') {
      var extraDmg2 = Math.round(damage * eff2.extraDmgVsDemon);
      liveBattle.monsterHpArray[targetIdx] -= extraDmg2;
      damage += extraDmg2;
    }
    // 灼烧概率（龙息烈焰 / 法术系血统招牌效果）
    if (eff2.burnChance && Math.random() < eff2.burnChance && !ms.burning) {
      ms.burning = eff2.burnTurns || 3;
      ms.burnPct = eff2.burnPct || 0.05;
      addBattleLog('skill', `🔥 ${getPetDisplayName(pet)} 的血统点燃了 ${monster.name}！`);
    }
  }

  const dmgDisplay = isCrit ? { val: damage, crit: true } : { val: damage, crit: false };
  const logType = isCrit ? 'crit' : 'damage';
  // 需求9.2：优化普攻日志格式
  const logMsg = isCrit
    ? `${getPetDisplayName(pet)} 普攻 ${monster.name} 造成 ${damage} 点伤害（暴击）`
    : `${getPetDisplayName(pet)} 普攻 ${monster.name} 造成 ${damage} 点伤害`;
  liveBattle.logs.unshift({ type: logType, msg: logMsg });
  addBattleLog(logType, logMsg);

  if (passives.vampPct) {
    const heal = Math.floor(damage * passives.vampPct * (isCrit && passives.vampCritDouble ? 2 : 1));
    liveBattle.petHp[pet.id].current = Math.min(liveBattle.petHp[pet.id].max, liveBattle.petHp[pet.id].current + heal);
    if (heal > 0) addBattleLog('heal', `💚 ${getPetDisplayName(pet)} 吸血恢复 ${heal} 气血`);
  }
  // 血统吸血（通用效果系统）
  if (bloodline && bloodline.effects && bloodline.effects.lifestealPct) {
    const heal = Math.floor(damage * bloodline.effects.lifestealPct);
    if (heal > 0) {
      liveBattle.petHp[pet.id].current = Math.min(liveBattle.petHp[pet.id].max, liveBattle.petHp[pet.id].current + heal);
    }
  }

  if (currentScreen === 'main') {
    animatePetAttack(pet, dmgDisplay, targetIdx);
  }

  if (liveBattle.monsterHpArray[targetIdx] <= 0) {
    liveBattle.monsterHpArray[targetIdx] = 0;
    logMonsterKill(targetIdx);
    if (currentScreen === 'main') animateMonsterDeath(targetIdx);
    advanceWaveOrEndBattle();
    return;
  }

  if (isTriple) {
    setTimeout(() => {
      const dmg2 = Math.max(1, Math.floor(damage * 0.7));
      const dmg3 = Math.max(1, Math.floor(damage * 0.5));
      liveBattle.monsterHpArray[targetIdx] -= (dmg2 + dmg3);
      liveBattle.totalDamage += (dmg2 + dmg3);
      // 需求9.2：连击触发日志
      addBattleLog('skill', `⚡ ${getPetDisplayName(pet)} 触发连击！追加一次普攻，对 ${monster.name} 额外造成 ${dmg2}+${dmg3} 点伤害`);
      liveBattle.logs.unshift({ type: 'skill', msg: `⚡ ${getPetDisplayName(pet)} 超级连击！对 ${monster.name} 造成 ${dmg2}+${dmg3} 点伤害` });
      if (currentScreen === 'main') animatePetAttack(pet, { val: dmg2, crit: false }, targetIdx);
      if (liveBattle.monsterHpArray[targetIdx] <= 0) {
        liveBattle.monsterHpArray[targetIdx] = 0;
        logMonsterKill(targetIdx);
        if (currentScreen === 'main') animateMonsterDeath(targetIdx);
        advanceWaveOrEndBattle();
        return;
      }
      nextFromQueue();
    }, 400);
  } else if (isDouble) {
    setTimeout(() => {
      const dmg2 = Math.max(1, Math.floor(damage * 0.7));
      liveBattle.monsterHpArray[targetIdx] -= dmg2;
      liveBattle.totalDamage += dmg2;
      // 需求9.2：连击触发日志
      addBattleLog('skill', `⚡ ${getPetDisplayName(pet)} 触发连击！追加一次普攻，对 ${monster.name} 造成 ${dmg2} 点伤害`);
      liveBattle.logs.unshift({ type: 'skill', msg: `⚡ ${getPetDisplayName(pet)} 连击！对 ${monster.name} 造成 ${dmg2} 点伤害` });
      if (currentScreen === 'main') {
        animatePetAttack(pet, { val: dmg2, crit: false }, targetIdx);
      }
      if (liveBattle.monsterHpArray[targetIdx] <= 0) {
        liveBattle.monsterHpArray[targetIdx] = 0;
        logMonsterKill(targetIdx);
        if (currentScreen === 'main') animateMonsterDeath(targetIdx);
        advanceWaveOrEndBattle();
        return;
      }
      nextFromQueue();
    }, 400);
  } else {
    setTimeout(() => nextFromQueue(), 400);
  }
}

// 记录怪物击杀日志（去重，避免重复记录）
function logMonsterKill(idx) {
  if (!liveBattle) return;
  var m = liveBattle.monsters[idx];
  if (!m || m._killLogged) return;
  m._killLogged = true;
  liveBattle.logs.unshift({ type: 'loot', msg: `🏆 击败了 ${m.name}！` });
  addBattleLog('loot', `🏆 击败了 ${m.name}！`);
}

function executeActiveSkill(pet, skill) {
  if (!liveBattle) return;
  if (typeof showSkillCastAnnouncement === 'function') {
    showSkillCastAnnouncement(getPetDisplayName(pet), skill.name, skill.type);
  }
  const stats = getPetStats(pet);
  const passives = getPassiveEffects(pet);
  const auras = getAuraEffects(liveBattle.team);
  const buffs = liveBattle.petBuffs[pet.id];
  const bloodline = getBloodlineSkill(pet);

  // 消耗魔法值
  var mpCost = getSkillMpCost(skill);
  if (liveBattle.petMp[pet.id]) {
    liveBattle.petMp[pet.id].current = Math.max(0, liveBattle.petMp[pet.id].current - mpCost);
  }

  let skillDmgMult = 1;
  if (passives.skillDmg) skillDmgMult += passives.skillDmg;

  const category = skill.category;
  var isMagic = !isPhysicalSkill(skill);
  // 需求17：powerAttr 新伤害体系 - 根据技能字段决定攻击力来源
  var powerAttr = skill.powerAttr;
  var power;
  if (powerAttr === 'hp') {
    power = liveBattle.petHp[pet.id].current;
  } else if (powerAttr === 'mp') {
    power = (liveBattle.petMp[pet.id] && liveBattle.petMp[pet.id].current) || 0;
  } else if (powerAttr === 'def') {
    power = stats.防御力;
  } else if (powerAttr === 'spd') {
    power = stats.速度;
  } else if (powerAttr === 'hpDiff') {
    power = 0; // 占位：按目标计算（见下方 actualPower）
  } else {
    // 默认：物理用攻击力，法术用灵力
    power = isMagic
      ? getPetSpiritPower(pet, stats, passives, auras, buffs)
      : getPetAtkPower(pet, stats, passives, auras, buffs, bloodline);
  }

  let logMsg = '';
  // 需求9.1：法术连击（magic_double）追踪变量
  var magicDoubleTargets = []; // 法连触发时的目标列表（供追加施法使用）
  var magicDoublePower = powerAttr === 'hpDiff' ? liveBattle.petHp[pet.id].current : power; // 法连追加施法的攻击力来源（hpDiff退化为自身气血）
  var magicDoubleDmgPct = skill.dmgPct || 1;
  var magicDoubleIgnoreDef = skill.ignoreDefPct || 0;

  if (category === 'single_atk' || category === 'aoe_atk' || category === 'single_cc' || category === 'aoe_cc') {
    // 判断是否为群体攻击：target === 'enemy_all' 或 AOE 类别
    var isAOE = skill.target === 'enemy_all' || category === 'aoe_atk' || category === 'aoe_cc';
    // 确定目标列表：单体随机选一个存活怪物，群体选所有存活怪物
    var targetIndices;
    if (isAOE) {
      var aliveIndices = getAliveMonsterIndices();
      // 需求19：法术群体技能 targetCount 限制（秒3/秒4/秒5），目标数越多伤害系数越低
      if (skill.targetCount && skill.targetCount > 0 && aliveIndices.length > skill.targetCount) {
        // 随机选取 targetCount 个目标
        var shuffled = aliveIndices.slice();
        for (var si = shuffled.length - 1; si > 0; si--) {
          var swapIdx = Math.floor(Math.random() * (si + 1));
          var tmp = shuffled[si]; shuffled[si] = shuffled[swapIdx]; shuffled[swapIdx] = tmp;
        }
        targetIndices = shuffled.slice(0, skill.targetCount);
      } else {
        targetIndices = aliveIndices;
      }
    } else {
      var singleIdx = getRandomAliveMonsterIdx();
      targetIndices = singleIdx >= 0 ? [singleIdx] : [];
    }
    if (targetIndices.length === 0) { nextFromQueue(); return; }
    var primaryIdx = targetIndices[0];

    // 需求17：纯嘲讽/控制技能（无dmgPct字段且含tauntTurns）不造成伤害
    let dmgPct = (skill.dmgPct === undefined && skill.tauntTurns) ? 0 : (skill.dmgPct || 1);
    // 需求1：纯嘲讽技能（dmgPct=0且含tauntTurns）允许伤害为0，不再被Math.max(1,...)兜底为1
    let isPureTaunt = (dmgPct === 0 && skill.tauntTurns) ? true : false;
    let ignoreDefPct = skill.ignoreDefPct || 0;
    // 天赋法术穿透加成（pet_skill_dmg）
    let skillDmgBonus = stats.skillDmg || 0;
    // 需求10：血统法术伤害加成（法术系招牌效果）
    if (isMagic && bloodline && bloodline.effects && bloodline.effects.magicDmgPct) {
      skillDmgBonus += bloodline.effects.magicDmgPct;
    }

    let critChance = 0.10;
    if (passives.critRate) critChance += passives.critRate;
    if (skill.bonusCrit) critChance += skill.bonusCrit;
    // 人物暴击率20%附加给宠物
    if (stats.critRate) critChance += stats.critRate;
    let critMult = 1.5;
    if (passives.critDmg) critMult += passives.critDmg;
    if (stats.critDmg) critMult += stats.critDmg;

    let totalDamage = 0;
    let executeTriggered = false;
    var statusHitCount = 0; // 记录状态命中的目标数

    // 对每个目标计算并施加伤害
    targetIndices.forEach(function(idx) {
      var tgtMonster = liveBattle.monsters[idx];
      var tgtMs = liveBattle.monsterStatusArray[idx];
      // 需求1：目标怪物被动技能（防御类）
      var tgtMPassives = getMonsterPassiveEffects(idx);
      let def = tgtMonster.def;
      if (tgtMs.defReduced > 0) def *= (1 - tgtMs.defReduced);
      // 需求1：怪物被动 defBonus 加成（防御/坚盾）
      if (tgtMPassives.defBonus) def *= (1 + tgtMPassives.defBonus);
      // 需求17：hpDiff 按目标计算实际威力（自身气血 - 目标气血）
      var actualPower = power;
      if (powerAttr === 'hpDiff') {
        actualPower = Math.max(0, liveBattle.petHp[pet.id].current - liveBattle.monsterHpArray[idx]);
      }
      // 真实伤害：无视防御
      let rawDmg;
      if (skill.trueDmg) {
        rawDmg = actualPower * dmgPct * skillDmgMult * (1 + skillDmgBonus);
      } else {
        // 防御削减系数0.7→0.6：技能伤害更明显
        rawDmg = actualPower * dmgPct * skillDmgMult * (1 + skillDmgBonus) - def * (0.6 - ignoreDefPct);
      }
      rawDmg = Math.round(rawDmg * randomFloat(0.90, 1.10));
      // 需求1：怪物被动闪避（dodge / 闪避）
      var mDodgeChance = tgtMPassives.dodgeBonus || 0;
      // 需求1：怪物 dodgeBuff 增益
      var tgtMBuff = liveBattle.monsterBuffsArray[idx];
      if (tgtMBuff && tgtMBuff.dodgeBuff && tgtMBuff.dodgeTurns > 0) mDodgeChance += tgtMBuff.dodgeBuff;
      if (mDodgeChance > 0 && Math.random() < mDodgeChance) {
        liveBattle.logs.unshift({ type: 'dodge', msg: `🌀 ${tgtMonster.name} 闪避了 ${getPetDisplayName(pet)} 的技能！` });
        addBattleLog('dodge', `🌀 ${tgtMonster.name} 闪避了 ${skill.name}！`);
        return; // 跳过该目标
      }
      // 需求1：怪物被动 antiCrit（幸运）- 降低被暴击概率
      var mAntiCrit = tgtMPassives.antiCrit || 0;
      var effectiveCritChance = Math.max(0, critChance - mAntiCrit);
      const isCrit = Math.random() < effectiveCritChance;
      if (isCrit) rawDmg = Math.round(rawDmg * critMult);
      // 需求1：纯嘲讽技能允许伤害为0，其他技能最低保留1点伤害
      let dmg = isPureTaunt ? Math.max(0, rawDmg) : Math.max(1, rawDmg);

      // 需求1：怪物被动 dmgReduce 减伤（坚韧/坚盾）
      if (tgtMPassives.dmgReduce) dmg = Math.round(dmg * (1 - tgtMPassives.dmgReduce));
      // 需求1：怪物被动 parryChance 招架（招架/parry）
      if (tgtMPassives.parryChance && Math.random() < tgtMPassives.parryChance) {
        dmg = Math.round(dmg * (1 - (tgtMPassives.parryReduce || 0.5)));
        addBattleLog('skill', `🛡️ ${tgtMonster.name} 招架！伤害降低`);
      }

      // 斩杀：目标血量低于阈值时伤害翻倍
      if (skill.executeThreshold && liveBattle.monsterHpArray[idx] < liveBattle.monsterMaxHpArray[idx] * skill.executeThreshold) {
        dmg = Math.round(dmg * (skill.executeMult || 2));
        executeTriggered = true;
      }

      if (skill.hits) {
        for (let i = 0; i < skill.hits; i++) {
          const mult = skill.decayPerHit !== undefined
            ? Math.pow(1 - skill.decayPerHit, i)
            : 1;
          const hitDmg = isPureTaunt ? Math.max(0, Math.round(dmg * mult)) : Math.max(1, Math.round(dmg * mult));
          liveBattle.monsterHpArray[idx] -= hitDmg;
          liveBattle.totalDamage += hitDmg;
          totalDamage += hitDmg;
        }
      } else {
        liveBattle.monsterHpArray[idx] -= dmg;
        liveBattle.totalDamage += dmg;
        totalDamage += dmg;
        // 需求1：怪物被动 reflectPct 反震（报复/反击/反震）
        if (tgtMPassives.reflectPct && dmg > 0) {
          var reflectDmgS = Math.floor(dmg * tgtMPassives.reflectPct);
          if (reflectDmgS > 0) {
            liveBattle.petHp[pet.id].current = Math.max(0, liveBattle.petHp[pet.id].current - reflectDmgS);
            addBattleLog('skill', `💢 ${tgtMonster.name} 反震对 ${getPetDisplayName(pet)} 造成 ${reflectDmgS} 伤害`);
            if (tgtMPassives.stunChance && Math.random() < tgtMPassives.stunChance) {
              var ps2 = liveBattle.petStatus[pet.id];
              if (ps2) ps2.stunned = (ps2.stunned || 0) + 1;
              addBattleLog('skill', `💫 ${tgtMonster.name} 的反震眩晕了 ${getPetDisplayName(pet)}！`);
            }
          }
        }
      }

      // 状态效果：每个目标独立判定
      var statusApplied = false;
      if (skill.freezeChance && Math.random() < skill.freezeChance) {
        tgtMs.frozen = (skill.freezeTurns || 1);
        statusApplied = true;
      }
      if (skill.stunChance && Math.random() < skill.stunChance) {
        tgtMs.stunned = (skill.stunTurns || 1);
        statusApplied = true;
      }
      if (skill.silenceChance && Math.random() < skill.silenceChance) {
        tgtMs.silenced = (skill.silenceTurns || 1);
        statusApplied = true;
      }
      if (skill.rootChance && Math.random() < skill.rootChance) {
        tgtMs.rooted = (skill.rootTurns || 1);
        statusApplied = true;
      }
      if (skill.sleepChance && Math.random() < skill.sleepChance) {
        tgtMs.sleeping = (skill.sleepTurns || 1);
        statusApplied = true;
      }
      if (skill.poisonTurns) {
        if (skill.stackPoison) {
          const maxStacks = skill.maxPoisonStacks || 5;
          tgtMs.poisonStacks = Math.min(maxStacks, (tgtMs.poisonStacks || 0) + 1);
          tgtMs.poisoned = skill.poisonTurns;
          tgtMs.poisonPct = (skill.poisonPctPerStack || 0.03) * tgtMs.poisonStacks;
        } else {
          tgtMs.poisoned = skill.poisonTurns;
          tgtMs.poisonPct = skill.poisonPct || 0.05;
        }
        statusApplied = true;
      }
      if (skill.burnTurns && (!skill.burnChance || Math.random() < skill.burnChance)) {
        tgtMs.burning = skill.burnTurns;
        tgtMs.burnPct = skill.burnPct || 0.05;
        statusApplied = true;
      }
      if (skill.defReduce) {
        tgtMs.defReduced = skill.defReduce;
        tgtMs.defReduceTurns = skill.defReduceTurns || 2;
        statusApplied = true;
      }
      // 需求10：血统灼烧（法术系招牌效果，主动技能攻击时概率触发）
      if (bloodline && bloodline.effects && bloodline.effects.burnChance && !tgtMs.burning && Math.random() < bloodline.effects.burnChance) {
        tgtMs.burning = bloodline.effects.burnTurns || 3;
        tgtMs.burnPct = bloodline.effects.burnPct || 0.05;
        statusApplied = true;
      }
      if (statusApplied) statusHitCount++;
    });

    // 需求17：嘲讽类技能 - 施加嘲讽状态（强制目标攻击施法者）
    if (skill.tauntTurns && skill.tauntTurns > 0) {
      targetIndices.forEach(function(idx) {
        var ms = liveBattle.monsterStatusArray[idx];
        if (ms) {
          ms.tauntedBy = pet.id;
          ms.tauntTurns = skill.tauntTurns;
        }
      });
      logMsg = (logMsg ? logMsg + '；' : '') + `${getPetDisplayName(pet)} 嘲讽了 ${targetIndices.length} 个敌人，持续${skill.tauntTurns}回合`;
    }

    // 需求9.1：记录法连触发时的存活目标列表（供追加施法使用）
    magicDoubleTargets = targetIndices.slice();

    // 构建日志（需求9.2：优化战斗日志）
    var targetName = isAOE && targetIndices.length > 1 ? '全体敌人' : (liveBattle.monsters[primaryIdx] ? liveBattle.monsters[primaryIdx].name : '敌人');
    if (skill.hits) {
      logMsg = `${getPetDisplayName(pet)} 释放 ${skill.name} ${skill.hits}连击对 ${targetName} 造成 ${totalDamage} 点${isMagic ? '法术' : '物理'}伤害${isAOE && targetIndices.length > 1 ? '（群体）' : ''}`;
    } else {
      logMsg = `${getPetDisplayName(pet)} 释放 ${skill.name} 对 ${targetName} 造成 ${totalDamage} 点${isMagic ? '法术' : '物理'}伤害${isAOE && targetIndices.length > 1 ? '（群体）' : ''}`;
      if (skill.trueDmg) logMsg += '（真实伤害）';
    }
    if (executeTriggered) logMsg += ' 🗡️斩杀！';
    if (isAOE && statusHitCount > 0) logMsg += `，状态命中${statusHitCount}个目标`;

    if (skill.vampPct) {
      const heal = Math.floor(totalDamage * skill.vampPct);
      liveBattle.petHp[pet.id].current = Math.min(liveBattle.petHp[pet.id].max, liveBattle.petHp[pet.id].current + heal);
      logMsg += `，吸血恢复 ${heal}`;
    }
    // 天赋吸血之印（pet_lifesteal）：宠物所有攻击均触发吸血
    if (stats.vampPct && stats.vampPct > 0) {
      const heal = Math.floor(totalDamage * stats.vampPct);
      if (heal > 0) {
        liveBattle.petHp[pet.id].current = Math.min(liveBattle.petHp[pet.id].max, liveBattle.petHp[pet.id].current + heal);
        logMsg += `，天赋吸血 ${heal}`;
      }
    }
    // 需求10：血统吸血（物理系招牌效果，所有攻击均触发）
    if (bloodline && bloodline.effects && bloodline.effects.lifestealPct && totalDamage > 0) {
      const heal = Math.floor(totalDamage * bloodline.effects.lifestealPct);
      if (heal > 0) {
        liveBattle.petHp[pet.id].current = Math.min(liveBattle.petHp[pet.id].max, liveBattle.petHp[pet.id].current + heal);
        logMsg += `，血统吸血 ${heal}`;
      }
    }
    if (skill.selfDmgPct) {
      const selfDmg = Math.floor(liveBattle.petHp[pet.id].max * skill.selfDmgPct);
      liveBattle.petHp[pet.id].current = Math.max(0, liveBattle.petHp[pet.id].current - selfDmg);
      logMsg += `，自损 ${selfDmg}`;
    }
    // 需求1：攻击技能自带的自愈（selfHealPct）- 回复自身最大气血百分比
    if (skill.selfHealPct) {
      var healAmt = Math.floor(liveBattle.petHp[pet.id].max * skill.selfHealPct);
      liveBattle.petHp[pet.id].current = Math.min(liveBattle.petHp[pet.id].max, liveBattle.petHp[pet.id].current + healAmt);
      logMsg += `，自身回复 ${healAmt}`;
    }
    // 需求1：魔力灼烧（mpBurnPct）- 灼烧主目标魔法值并回复自身
    if (skill.mpBurnPct && primaryIdx >= 0) {
      var burnedMp = Math.floor((liveBattle.monsters[primaryIdx].mp || 0) * skill.mpBurnPct);
      if (burnedMp > 0) {
        var myMp = liveBattle.petMp[pet.id];
        if (myMp) {
          myMp.current = Math.min(myMp.max, myMp.current + burnedMp);
        }
        logMsg += `，灼魔 ${burnedMp}`;
      } else {
        logMsg += `，灼魔（目标无魔法）`;
      }
    }
    // 需求1：攻击技能自带的自身增益（defBuff/counterBuff/shieldPct/dodgeBuff）
    if (skill.defBuff || skill.counterBuff || skill.shieldPct || skill.dodgeBuff) {
      var sb = liveBattle.petBuffs[pet.id];
      if (sb) {
        var sbTurns = skill.buffTurns || 3;
        if (skill.defBuff)  { sb.def = skill.defBuff;  sb.buffTurns.def = sbTurns; }
        if (skill.counterBuff) { sb.counterBuff = skill.counterBuff; sb.counterTurns = sbTurns; }
        if (skill.shieldPct) { sb.shield = Math.floor(liveBattle.petHp[pet.id].max * skill.shieldPct); sb.shieldTurns = skill.shieldTurns || sbTurns; }
        if (skill.dodgeBuff) { sb.dodgeBuff = skill.dodgeBuff; sb.dodgeTurns = sbTurns; }
        logMsg += `，获得增益效果${sbTurns}回合`;
      }
    }
    // 偷取攻击力：从主目标偷取
    if (skill.stealAtk) {
      const stolenAtk = Math.floor(liveBattle.monsters[primaryIdx].atk * skill.stealAtk);
      buffs.stolenAtk = (buffs.stolenAtk || 0) + stolenAtk;
      buffs.stolenAtkTurns = skill.stealTurns || 3;
      logMsg += ` 🩸偷取${stolenAtk}攻击力`;
    }
    // 需求1：修复buddha_seal/buddha_quake/chaos_strike描述含治疗但无治疗逻辑
    // 攻击后附加治疗：postHealPct + postHealTarget ('self'/'lowest'/'team')
    if (skill.postHealPct && skill.postHealTarget) {
      var healAmt = 0;
      var postSpiritBonus = Math.floor(getPetSpiritPower(pet, stats, passives, auras, buffs) * 0.5);
      if (skill.postHealTarget === 'self') {
        var shp = liveBattle.petHp[pet.id];
        if (shp && shp.current > 0) {
          healAmt = Math.floor(shp.max * skill.postHealPct) + postSpiritBonus;
          shp.current = Math.min(shp.max, shp.current + healAmt);
          logMsg += `，自身回复${healAmt}气血`;
        }
      } else if (skill.postHealTarget === 'lowest') {
        var lowestPet = null, lowestHp = Infinity;
        liveBattle.team.forEach(function(p) {
          var hp = liveBattle.petHp[p.id];
          if (hp && hp.current > 0 && hp.current < lowestHp) { lowestPet = p; lowestHp = hp.current; }
        });
        if (lowestPet) {
          var lhp = liveBattle.petHp[lowestPet.id];
          healAmt = Math.floor(lhp.max * skill.postHealPct) + postSpiritBonus;
          lhp.current = Math.min(lhp.max, lhp.current + healAmt);
          logMsg += `，回复${getPetDisplayName(lowestPet)}${healAmt}气血`;
        }
      } else if (skill.postHealTarget === 'team') {
        var totalTeamHeal = 0;
        liveBattle.team.forEach(function(p) {
          var hp = liveBattle.petHp[p.id];
          if (hp && hp.current > 0) {
            healAmt = Math.floor(hp.max * skill.postHealPct) + postSpiritBonus;
            hp.current = Math.min(hp.max, hp.current + healAmt);
            totalTeamHeal += healAmt;
          }
        });
        logMsg += `，全队共回复${totalTeamHeal}气血`;
      }
    }
    // 需求9：记录击杀日志并将HP归零，避免负数HP导致渲染/进度异常
    targetIndices.forEach(function(idx) {
      if (liveBattle.monsterHpArray[idx] <= 0) {
        liveBattle.monsterHpArray[idx] = 0;
        logMonsterKill(idx);
        if (currentScreen === 'main') animateMonsterDeath(idx);
      }
    });
  } else if (category === 'single_heal' || category === 'aoe_heal') {
    // 治疗量受灵力影响：基础百分比 + 灵力加成
    var spirit = getPetSpiritPower(pet, stats, passives, auras, buffs);
    // 血统治疗效果加成（月光狐、圣光天使等）
    var healBoostMult = (bloodline && bloodline.effects && bloodline.effects.healBoost) ? (1 + bloodline.effects.healBoost) : 1;
    var healBonus = Math.floor(spirit * 0.5 * healBoostMult); // 灵力50%转为额外治疗
    const healPct = (skill.healPct || 0) * healBoostMult;
    var revivedCount = 0;
    // 提升到外层声明：净化分支需要复用同一目标，避免 getSkillTarget 二次调用造成目标偏移
    var healTarget = null;
    if (skill.target === 'ally_all' || category === 'aoe_heal') {
      liveBattle.team.forEach(p => {
        const hp = liveBattle.petHp[p.id];
        if (!hp) return;
        // 复活已阵亡队友
        if (skill.revive && hp.current <= 0) {
          hp.current = Math.floor(hp.max * (skill.revivePct || 0.30));
          revivedCount++;
        }
        if (hp.current > 0) {
          const heal = Math.floor(hp.max * healPct) + healBonus;
          hp.current = Math.min(hp.max, hp.current + heal);
        }
      });
      logMsg = `💚 ${getPetDisplayName(pet)} 使用【${skill.name}】全体恢复 ${Math.floor(healPct*100)}%+${healBonus} 气血`;
      if (revivedCount > 0) logMsg += `，复活${revivedCount}名队友`;
      // 需求3：mass_resurrection 群体复活+攻击增益（atkBuff 字段在 aoe_heal 分支中应用）
      if (skill.atkBuff) {
        liveBattle.team.forEach(p => {
          const b = liveBattle.petBuffs[p.id];
          if (!b) return;
          b.atk = skill.atkBuff;
          b.buffTurns.atk = skill.buffTurns || 3;
        });
        logMsg += `，全队攻击力+${Math.floor(skill.atkBuff*100)}%（持续${skill.buffTurns || 3}回合）`;
      }
    } else {
      healTarget = getSkillTarget(skill, pet);
      if (healTarget && healTarget.id) {
        const hp = liveBattle.petHp[healTarget.id];
        if (hp) {
          // 复活已阵亡队友（需求3：修复复活+治疗双叠加bug，复活后不再叠加healPct治疗）
          if (skill.revive && hp.current <= 0) {
            var reviveHealBonus = Math.floor((liveBattle.petHp[pet.id] ? liveBattle.petHp[pet.id].max : 0) * 0.30);
            hp.current = Math.floor(hp.max * (skill.revivePct || 0.30)) + reviveHealBonus;
            hp.current = Math.min(hp.max, hp.current);
            logMsg = `✨ ${getPetDisplayName(pet)} 使用【${skill.name}】复活了 ${getPetDisplayName(healTarget)}！恢复${Math.floor((skill.revivePct||0.30)*100)}%气血`;
            // 复活附带持续恢复效果
            if (skill.hotTurns) {
              const b = liveBattle.petBuffs[healTarget.id];
              if (b) { b.hotTurns = skill.hotTurns; b.hotPct = skill.hotPct || 0; }
              logMsg += `，持续恢复${Math.floor((skill.hotPct||0)*100)}%/${skill.hotTurns}回合`;
            }
          } else if (hp.current > 0 && healPct > 0) {
            const heal = Math.floor(hp.max * healPct) + healBonus;
            hp.current = Math.min(hp.max, hp.current + heal);
            logMsg = `💚 ${getPetDisplayName(pet)} 使用【${skill.name}】恢复 ${getPetDisplayName(healTarget)} ${heal} 气血`;
          } else if (!skill.revive && !skill.healPct) {
            // 纯辅助技能无治疗效果时跳过
            logMsg = `✨ ${getPetDisplayName(pet)} 使用了【${skill.name}】`;
          }
        }
      }
    }
    // 净化：清除目标负面状态（复用 healTarget 保持目标一致）
    if (skill.cleanse) {
      const cleanseTarget = (p) => {
        const st = liveBattle.petStatus[p.id];
        if (st) {
          st.frozen = 0; st.stunned = 0; st.silenced = 0; st.rooted = 0; st.sleeping = 0;
          st.poisoned = 0; st.poisonPct = 0; st.burning = 0; st.burnPct = 0;
        }
      };
      if (skill.target === 'ally_all' || category === 'aoe_heal') {
        liveBattle.team.forEach(cleanseTarget);
        logMsg += `，全体净化`;
      } else if (healTarget && healTarget.id) {
        cleanseTarget(healTarget);
        logMsg += `，净化负面状态`;
      }
    }
    if (skill.hotTurns) {
      if (skill.target === 'ally_all' || category === 'aoe_heal') {
        liveBattle.team.forEach(p => {
          const b = liveBattle.petBuffs[p.id];
          if (b) { b.hotTurns = skill.hotTurns; b.hotPct = skill.hotPct || 0; }
        });
      } else {
        const b = liveBattle.petBuffs[pet.id];
        if (b) { b.hotTurns = skill.hotTurns; b.hotPct = skill.hotPct || 0; }
      }
      logMsg += `，持续恢复${skill.hotTurns}回合`;
    }
  } else if (category === 'single_buff' || category === 'aoe_buff') {
    const applyBuff = (p) => {
      const b = liveBattle.petBuffs[p.id];
      if (!b) return;
      if (skill.atkBuff) { b.atk = skill.atkBuff; b.buffTurns.atk = skill.buffTurns || 3; }
      if (skill.defBuff) { b.def = skill.defBuff; b.buffTurns.def = skill.buffTurns || 3; }
      if (skill.spdBuff) { b.spd = skill.spdBuff; b.buffTurns.spd = skill.buffTurns || 3; }
      if (skill.allBuff) { b.all = skill.allBuff; b.buffTurns.all = skill.buffTurns || 3; }
      // 护盾：基于最大气血百分比，受 buffTurns 控制（修复护盾永不过期）
      if (skill.shieldPct) {
        b.shield = Math.floor(liveBattle.petHp[p.id].max * skill.shieldPct);
        b.shieldTurns = skill.buffTurns || skill.reflectTurns || 3;
      }
      // 自身防御降低（副作用）
      if (skill.defDebuff) { b.defDebuff = skill.defDebuff; b.buffTurns.defDebuff = skill.buffTurns || 3; }
      // 反击姿态
      if (skill.counterBuff) { b.counterBuff = skill.counterBuff; b.counterTurns = skill.buffTurns || 3; }
      // 反射伤害
      if (skill.reflectBuff) { b.reflectBuff = skill.reflectBuff; b.reflectTurns = skill.reflectTurns || skill.buffTurns || 3; }
      // 需求1：闪避增益
      if (skill.dodgeBuff) { b.dodgeBuff = skill.dodgeBuff; b.dodgeTurns = skill.buffTurns || 3; }
    };
    if (skill.target === 'ally_all' || category === 'aoe_buff') {
      liveBattle.team.forEach(applyBuff);
      logMsg = `🛡️ ${getPetDisplayName(pet)} 释放 ${skill.name}，全队获得 ${skill.name} 效果（持续${skill.buffTurns || 3}回合）`;
    } else {
      applyBuff(pet);
      logMsg = `🛡️ ${getPetDisplayName(pet)} 释放 ${skill.name}，获得 ${skill.name} 效果（持续${skill.buffTurns || 3}回合）`;
    }
  }

  if (skill.cd) liveBattle.skillCooldowns[pet.id][skill.id] = skill.cd;
  addBattleLog('skill', logMsg);
  liveBattle.logs.unshift({ type: 'skill', msg: logMsg });

  // 需求9.1：法术连击（magic_double）触发逻辑
  // 仅对法术攻击技能生效：施法后按 passives.skillDouble 概率追加一次同技能施法
  if (isMagic && (category === 'single_atk' || category === 'aoe_atk' || category === 'single_cc' || category === 'aoe_cc') && passives.skillDouble && magicDoubleTargets.length > 0) {
    if (Math.random() < passives.skillDouble) {
      // 第二次施法伤害倍率：默认衰减到 0.7，超级法连(skillDoubleFull)不衰减
      var followUpMult = passives.skillDoubleFull ? 1.0 : 0.7;
      var followUpTotal = 0;
      // 对同一批目标追加一次伤害
      magicDoubleTargets.forEach(function(idx) {
        if (liveBattle.monsterHpArray[idx] <= 0) return; // 跳过已死目标
        var tgtM = liveBattle.monsters[idx];
        var tgtMs = liveBattle.monsterStatusArray[idx];
        var fDef = tgtM.def;
        if (tgtMs.defReduced > 0) fDef *= (1 - tgtMs.defReduced);
        var fRaw;
        if (skill.trueDmg) {
          fRaw = magicDoublePower * magicDoubleDmgPct * skillDmgMult * (1 + (stats.skillDmg || 0));
        } else {
          fRaw = magicDoublePower * magicDoubleDmgPct * skillDmgMult * (1 + (stats.skillDmg || 0)) - fDef * (0.6 - magicDoubleIgnoreDef);
        }
        fRaw = Math.round(fRaw * followUpMult * randomFloat(0.90, 1.10));
        // 独立判定暴击
        var fCritChance = 0.10 + (passives.critRate || 0) + (skill.bonusCrit || 0) + (stats.critRate || 0);
        if (Math.random() < fCritChance) {
          var fCritMult = 1.5 + (passives.critDmg || 0) + (stats.critDmg || 0);
          fRaw = Math.round(fRaw * fCritMult);
        }
        var fDmg = Math.max(1, fRaw);
        liveBattle.monsterHpArray[idx] -= fDmg;
        liveBattle.totalDamage += fDmg;
        followUpTotal += fDmg;
        // 需求9：法术连击击杀时也将HP归零
        if (liveBattle.monsterHpArray[idx] <= 0) {
          liveBattle.monsterHpArray[idx] = 0;
          logMonsterKill(idx);
          if (currentScreen === 'main') animateMonsterDeath(idx);
        }
      });
      addBattleLog('skill', `🔮 ${getPetDisplayName(pet)} 触发法术连击！追加一次 ${skill.name}，造成 ${followUpTotal} 点法术伤害`);
      liveBattle.logs.unshift({ type: 'skill', msg: `🔮 ${getPetDisplayName(pet)} 法术连击追加 ${skill.name}` });
    }
  }

  if (currentScreen === 'main') {
    const isHeal = category === 'single_heal' || category === 'aoe_heal';
    if (isHeal) {
      const petEl = document.getElementById('battle-pet-' + pet.id);
      if (petEl) spawnDamageFloat(petEl, { val: 0, heal: true });
    } else {
      // 攻击技能：对所有存活怪物播放动画
      var animIndices = getAliveMonsterIndices();
      // 已死亡的也播放死亡动画
      liveBattle.monsters.forEach(function(m, i) {
        if (liveBattle.monsterHpArray[i] <= 0) animIndices.push(i);
      });
      animIndices.forEach(function(idx) {
        animateSkillAttack(pet, skill, { val: 0, crit: false }, idx);
      });
    }
  }

  // 检查是否所有怪物都死了
  if (allMonstersDead()) {
    advanceWaveOrEndBattle();
    return;
  }

  setTimeout(() => nextFromQueue(), 400);
}

// 队列下一名行动者
function nextFromQueue() {
  if (!liveBattle) return;
  liveBattle.animating = false;
  if (currentScreen === 'main') renderBattleArena();
  scheduleNextTurn();
}

// 任务16：获取怪物有效攻击力（含 buff 加成 + 被动技能加成）
function getMonsterAtkPower(monsterIdx) {
  if (!liveBattle) return 0;
  var monster = liveBattle.monsters[monsterIdx];
  if (!monster) return 0;
  var atk = monster.atk;
  var buffs = liveBattle.monsterBuffsArray && liveBattle.monsterBuffsArray[monsterIdx];
  if (buffs) {
    if (buffs.atk) atk *= (1 + buffs.atk);
    if (buffs.all) atk *= (1 + buffs.all);
    if (buffs.stolenAtk) atk += buffs.stolenAtk;
  }
  // 需求1：怪物被动技能 - atkBonus / strBonus 加成
  var passives = getMonsterPassiveEffects(monsterIdx);
  if (passives.atkBonus) atk *= (1 + passives.atkBonus);
  if (passives.strBonus) atk *= (1 + passives.strBonus);
  return atk;
}

// 需求1：获取怪物被动技能效果（与 getPassiveEffects 同结构，从 monster.passives 读取）
function getMonsterPassiveEffects(monsterIdx) {
  if (!liveBattle) return {};
  var monster = liveBattle.monsters[monsterIdx];
  if (!monster || !monster.passives || monster.passives.length === 0) return {};
  var effects = {};
  monster.passives.forEach(function(skillId) {
    var skill = getSkillById(skillId);
    if (!skill || skill.type !== 'passive' || !skill.effect) return;
    Object.keys(skill.effect).forEach(function(k) {
      var v = skill.effect[k];
      if (effects[k] === undefined || v > effects[k]) effects[k] = v;
    });
  });
  return effects;
}

// 任务16：怪物使用主动技能（目标改为宠物，参考 executeActiveSkill 但简化）
// 攻击技能打宠物，治疗技能治疗怪物，buff技能给自己加buff
function executeMonsterSkill(monsterIdx, skill) {
  if (!liveBattle || !skill) { nextFromQueue(); return; }
  var monster = liveBattle.monsters[monsterIdx];
  if (!monster) { nextFromQueue(); return; }
  if (typeof showSkillCastAnnouncement === 'function') {
    showSkillCastAnnouncement(monster.name, skill.name, skill.type);
  }
  var isMagic = !isPhysicalSkill(skill);
  // 技能伤害公式：物理技能用 atk，法术技能用 atk*1.2 作为 power（含buff加成）
  var baseAtk = getMonsterAtkPower(monsterIdx);
  var power = isMagic ? baseAtk * 1.2 : baseAtk;
  var category = skill.category;
  var logMsg = '';
  // 需求1：怪物被动技能效果（critRate/critDmg/skillDmg/vampPct/skillDouble）
  var mPassives = getMonsterPassiveEffects(monsterIdx);
  // 技能伤害加成（magic_heart 魔心）
  var mSkillDmgBonus = mPassives.skillDmg || 0;
  // 暴击率：基础10% + 被动 critRate
  var mCritChance = 0.10 + (mPassives.critRate || 0) + (skill.bonusCrit || 0);
  var mCritMult = 1.5 + (mPassives.critDmg || 0);

  if (category === 'single_atk' || category === 'aoe_atk' || category === 'single_cc' || category === 'aoe_cc') {
    // 攻击技能：目标为宠物
    var isAOE = skill.target === 'enemy_all' || category === 'aoe_atk' || category === 'aoe_cc';
    var targetPets = [];
    if (isAOE) {
      liveBattle.team.forEach(function(p) {
        var hp = liveBattle.petHp[p.id];
        if (hp && hp.current > 0) targetPets.push(p);
      });
    } else {
      // 需求17：嘲讽状态 - 怪物被嘲讽时只能攻击施法者
      var msTaunt2 = liveBattle.monsterStatusArray[monsterIdx];
      var tauntTarget = null;
      if (msTaunt2 && msTaunt2.tauntedBy && msTaunt2.tauntTurns > 0) {
        tauntTarget = liveBattle.team.find(function(p) {
          return p && p.id === msTaunt2.tauntedBy && liveBattle.petHp[p.id] && liveBattle.petHp[p.id].current > 0;
        });
      }
      if (tauntTarget) {
        targetPets.push(tauntTarget);
      } else {
        var alivePets = liveBattle.team.filter(function(p) {
          var hp = liveBattle.petHp[p.id];
          return hp && hp.current > 0;
        });
        if (alivePets.length > 0) targetPets.push(alivePets[Math.floor(Math.random() * alivePets.length)]);
      }
    }
    if (targetPets.length === 0) { nextFromQueue(); return; }

    var dmgPct = skill.dmgPct || 1;
    var totalDamage = 0;
    var dmgPerPet = {};

    targetPets.forEach(function(tp) {
      var tStats = getPetStats(tp);
      var tPassives = getPassiveEffects(tp);
      var tBuffs = liveBattle.petBuffs[tp.id];
      var tDef = tStats.防御力;
      if (tBuffs && tBuffs.defDebuff) tDef *= (1 - tBuffs.defDebuff);
      // 需求1：怪物被动 skillDmg 加成（魔心）
      var rawDmg = power * dmgPct * (1 + mSkillDmgBonus) - tDef * 0.6;
      rawDmg = Math.round(rawDmg * randomFloat(0.90, 1.10));
      // 需求1：怪物被动 critRate/critDmg 加成
      if (Math.random() < mCritChance) rawDmg = Math.round(rawDmg * mCritMult);
      var dmg = Math.max(1, rawDmg);
      // 减伤被动
      if (tPassives.dmgReduce) dmg = Math.round(dmg * (1 - tPassives.dmgReduce));
      if (tStats.dmgReduce) dmg = Math.round(dmg * (1 - tStats.dmgReduce));
      // 护盾
      if (tBuffs && tBuffs.shield > 0) {
        if (tBuffs.shield >= dmg) { tBuffs.shield -= dmg; dmg = 0; }
        else { dmg -= tBuffs.shield; tBuffs.shield = 0; }
      }
      liveBattle.petHp[tp.id].current = Math.max(0, liveBattle.petHp[tp.id].current - dmg);
      totalDamage += dmg;
      dmgPerPet[tp.id] = dmg;
      // 需求1：怪物吸血被动（vampire）
      if (mPassives.vampPct && dmg > 0) {
        var mHeal = Math.floor(dmg * mPassives.vampPct);
        liveBattle.monsterHpArray[monsterIdx] = Math.min(
          liveBattle.monsterMaxHpArray[monsterIdx],
          liveBattle.monsterHpArray[monsterIdx] + mHeal
        );
      }
      // 状态效果施加给宠物
      var ps = liveBattle.petStatus[tp.id];
      if (ps) {
        if (skill.freezeChance && Math.random() < skill.freezeChance) ps.frozen = (skill.freezeTurns || 1);
        if (skill.stunChance && Math.random() < skill.stunChance) ps.stunned = (skill.stunTurns || 1);
        if (skill.silenceChance && Math.random() < skill.silenceChance) ps.silenced = (skill.silenceTurns || 1);
        if (skill.rootChance && Math.random() < skill.rootChance) ps.rooted = (skill.rootTurns || 1);
        if (skill.sleepChance && Math.random() < skill.sleepChance) ps.sleeping = (skill.sleepTurns || 1);
        if (skill.poisonTurns) { ps.poisoned = skill.poisonTurns; ps.poisonPct = skill.poisonPct || 0.05; }
        if (skill.burnTurns) { ps.burning = skill.burnTurns; ps.burnPct = skill.burnPct || 0.05; }
      }
    });

    // 需求9.2：优化怪物技能日志
    var monsterTargetName = isAOE && targetPets.length > 1 ? '全体宠物' : (targetPets[0] ? getPetDisplayName(targetPets[0]) : '宠物');
    logMsg = `${monster.name} 释放 ${skill.name} 对 ${monsterTargetName} 造成 ${totalDamage} 点${isMagic ? '法术' : '物理'}伤害${isAOE && targetPets.length > 1 ? '（群体）' : ''}`;
    // 吸血：怪物回复
    if (skill.vampPct) {
      var heal = Math.floor(totalDamage * skill.vampPct);
      liveBattle.monsterHpArray[monsterIdx] = Math.min(liveBattle.monsterMaxHpArray[monsterIdx], liveBattle.monsterHpArray[monsterIdx] + heal);
      logMsg += `，吸血恢复 ${heal}`;
    }
    // 自损
    if (skill.selfDmgPct) {
      var selfDmg = Math.floor(liveBattle.monsterMaxHpArray[monsterIdx] * skill.selfDmgPct);
      liveBattle.monsterHpArray[monsterIdx] = Math.max(0, liveBattle.monsterHpArray[monsterIdx] - selfDmg);
      logMsg += `，自损 ${selfDmg}`;
    }
    // 需求1：怪物攻击技能自带的增益/自愈/灼魔
    if (skill.selfHealPct) {
      var mHealAmt = Math.floor(liveBattle.monsterMaxHpArray[monsterIdx] * skill.selfHealPct);
      liveBattle.monsterHpArray[monsterIdx] = Math.min(liveBattle.monsterMaxHpArray[monsterIdx], liveBattle.monsterHpArray[monsterIdx] + mHealAmt);
      logMsg += `，自身回复 ${mHealAmt}`;
    }
    if (skill.defBuff || skill.counterBuff || skill.shieldPct || skill.dodgeBuff) {
      var mb = liveBattle.monsterBuffsArray[monsterIdx];
      if (mb) {
        var mbTurns = skill.buffTurns || 3;
        if (skill.defBuff)  { mb.def = skill.defBuff;  mb.buffTurns.def = mbTurns; }
        if (skill.counterBuff) { mb.counterBuff = skill.counterBuff; mb.counterTurns = mbTurns; }
        if (skill.shieldPct) { mb.shield = Math.floor(liveBattle.monsterMaxHpArray[monsterIdx] * skill.shieldPct); mb.shieldTurns = skill.shieldTurns || mbTurns; }
        if (skill.dodgeBuff) { mb.dodgeBuff = skill.dodgeBuff; mb.dodgeTurns = mbTurns; }
        logMsg += `，获得增益效果${mbTurns}回合`;
      }
    }
    // 检查宠物死亡
    targetPets.forEach(function(tp) {
      if (liveBattle.petHp[tp.id].current <= 0) {
        addBattleLog('info', `💔 ${getPetDisplayName(tp)} 阵亡了！`);
      }
      // 播放动画
      if (currentScreen === 'main') animateMonsterAttackAnim(tp, dmgPerPet[tp.id] || 0, monsterIdx);
    });
  } else if (category === 'single_heal' || category === 'aoe_heal') {
    // 治疗技能：治疗怪物自己或其他存活怪物
    var healPct = skill.healPct || 0;
    var healBonus = Math.floor(power * 0.5);
    var healTargets = [];
    if (skill.target === 'ally_all' || category === 'aoe_heal') {
      for (var i = 0; i < liveBattle.monsters.length; i++) {
        if (liveBattle.monsterHpArray[i] > 0) healTargets.push(i);
      }
    } else {
      // 治疗生命最低的存活怪物
      var lowestIdx = monsterIdx;
      var lowestHp = Infinity;
      for (var j = 0; j < liveBattle.monsters.length; j++) {
        if (liveBattle.monsterHpArray[j] > 0 && liveBattle.monsterHpArray[j] < lowestHp) {
          lowestHp = liveBattle.monsterHpArray[j]; lowestIdx = j;
        }
      }
      healTargets.push(lowestIdx);
    }
    healTargets.forEach(function(idx) {
      var heal = Math.floor(liveBattle.monsterMaxHpArray[idx] * healPct) + healBonus;
      liveBattle.monsterHpArray[idx] = Math.min(liveBattle.monsterMaxHpArray[idx], liveBattle.monsterHpArray[idx] + heal);
    });
    logMsg = `💚 ${monster.name} 使用【${skill.name}】治疗恢复 ${Math.floor(healPct*100)}%+${healBonus}`;
  } else if (category === 'single_buff' || category === 'aoe_buff') {
    // buff技能：给自己或全体怪物加buff
    var buffTargets = [];
    if (skill.target === 'ally_all' || category === 'aoe_buff') {
      for (var k = 0; k < liveBattle.monsters.length; k++) {
        if (liveBattle.monsterHpArray[k] > 0) buffTargets.push(k);
      }
    } else {
      buffTargets.push(monsterIdx);
    }
    buffTargets.forEach(function(idx) {
      var b = liveBattle.monsterBuffsArray[idx];
      if (!b) return;
      if (skill.atkBuff) { b.atk = skill.atkBuff; b.buffTurns.atk = skill.buffTurns || 3; }
      if (skill.defBuff) { b.def = skill.defBuff; b.buffTurns.def = skill.buffTurns || 3; }
      if (skill.spdBuff) { b.spd = skill.spdBuff; b.buffTurns.spd = skill.buffTurns || 3; }
      if (skill.allBuff) { b.all = skill.allBuff; b.buffTurns.all = skill.buffTurns || 3; }
      if (skill.shieldPct) { b.shield = Math.floor(liveBattle.monsterMaxHpArray[idx] * skill.shieldPct); b.shieldTurns = skill.buffTurns || 3; }
      if (skill.counterBuff) { b.counterBuff = skill.counterBuff; b.counterTurns = skill.buffTurns || 3; }
      if (skill.reflectBuff) { b.reflectBuff = skill.reflectBuff; b.reflectTurns = skill.reflectTurns || skill.buffTurns || 3; }
      if (skill.dodgeBuff) { b.dodgeBuff = skill.dodgeBuff; b.dodgeTurns = skill.buffTurns || 3; }
    });
    logMsg = `🛡️ ${monster.name} 释放 ${skill.name}，获得 ${skill.name} 效果（持续${skill.buffTurns || 3}回合）`;
  }

  addBattleLog('skill', logMsg);
  liveBattle.logs.unshift({ type: 'skill', msg: logMsg });

  // 检查是否所有宠物都死了
  var allDead = liveBattle.team.every(function(p) {
    var hp = liveBattle.petHp[p.id];
    return !hp || hp.current <= 0;
  });
  if (allDead) {
    addBattleLog('info', '💀 所有宠物已阵亡！战斗失败...');
    processBattleDefeat();
    return;
  }

  // 检查该怪物是否被自损击杀
  if (liveBattle.monsterHpArray[monsterIdx] <= 0) {
    liveBattle.monsterHpArray[monsterIdx] = 0;
    logMonsterKill(monsterIdx);
    if (currentScreen === 'main') animateMonsterDeath(monsterIdx);
    advanceWaveOrEndBattle();
    return;
  }

  setTimeout(function() { nextFromQueue(); }, 400);
}

function executeMonsterAction(monsterIdx) {
  if (!liveBattle) return;
  liveBattle.animating = true;

  var monster = liveBattle.monsters[monsterIdx];
  var ms = liveBattle.monsterStatusArray[monsterIdx];
  // 如果怪物已死，跳过
  if (liveBattle.monsterHpArray[monsterIdx] <= 0) { nextFromQueue(); return; }

  if (ms) {
    if (ms.stunned > 0) { addBattleLog('info', `💫 ${monster.name} 被眩晕，无法行动！`); ms.stunned--; nextFromQueue(); return; }
    if (ms.frozen > 0) { addBattleLog('info', `❄️ ${monster.name} 被冻结，无法行动！`); ms.frozen--; nextFromQueue(); return; }
    if (ms.sleeping > 0) { addBattleLog('info', `😴 ${monster.name} 正在睡眠...`); ms.sleeping--; nextFromQueue(); return; }
    if (ms.rooted > 0) { addBattleLog('info', `🌿 ${monster.name} 被定身，无法行动！`); ms.rooted--; nextFromQueue(); return; }
  }

  // 任务16：怪物 50% 概率使用主动技能（不需要魔法值检查，按概率触发），50% 概率普通攻击
  // 需求1：被沉默时无法使用主动技能，只能普通攻击
  var isSilenced = ms && ms.silenced > 0;
  if (isSilenced) {
    addBattleLog('info', `🤐 ${monster.name} 被沉默，无法使用技能！`);
    ms.silenced--;
  }
  if (!isSilenced && monster.skills && monster.skills.length > 0 && Math.random() < 0.5) {
    var skillId = monster.skills[Math.floor(Math.random() * monster.skills.length)];
    var mSkill = getSkillById(skillId);
    if (mSkill && mSkill.type === 'active') {
      executeMonsterSkill(monsterIdx, mSkill);
      return;
    }
  }

  const formation = G.player.formation || ['front','mid','back'];
  let targetPet = null;
  // 需求17：嘲讽状态 - 怪物被嘲讽时只能攻击施法者
  var msTaunt = liveBattle.monsterStatusArray[monsterIdx];
  if (msTaunt && msTaunt.tauntedBy && msTaunt.tauntTurns > 0) {
    var tauntPet = liveBattle.team.find(function(p) {
      return p && p.id === msTaunt.tauntedBy && liveBattle.petHp[p.id] && liveBattle.petHp[p.id].current > 0;
    });
    if (tauntPet) {
      targetPet = tauntPet;
    }
  }
  if (!targetPet) {
    for (const pos of formation) {
      const idx = formation.indexOf(pos);
      if (idx >= liveBattle.team.length) continue;
      const pet = liveBattle.team[idx];
      if (!pet) continue;
      const hp = liveBattle.petHp[pet.id];
      if (hp && hp.current > 0) { targetPet = pet; break; }
    }
  }
  if (!targetPet) {
    addBattleLog('info', '💀 所有宠物已阵亡！战斗失败...');
    processBattleDefeat();
    return;
  }

  const passives = getPassiveEffects(targetPet);
  const auras = getAuraEffects(liveBattle.team);
  const bloodline = getBloodlineSkill(targetPet);
  const buffs = liveBattle.petBuffs[targetPet.id];
  const targetStats = getPetStats(targetPet);
  // 需求1：怪物被动技能（critRate/vampPct 等）
  var mPassives2 = getMonsterPassiveEffects(monsterIdx);

  let dodgeChance = 0.05;
  if (passives.dodgeBonus) dodgeChance += passives.dodgeBonus;
  // 血统闪避加成（通用效果系统）
  if (bloodline && bloodline.effects && bloodline.effects.dodgeRate) dodgeChance += bloodline.effects.dodgeRate;
  // 人物闪避率20%附加给宠物
  if (targetStats.dodgeRate) dodgeChance += targetStats.dodgeRate;
  // 需求1：闪避增益 buff（dodgeBuff）
  if (buffs && buffs.dodgeBuff && buffs.dodgeTurns > 0) dodgeChance += buffs.dodgeBuff;

  if (Math.random() < dodgeChance) {
    liveBattle.logs.unshift({ type: 'dodge', msg: `🌀 ${getPetDisplayName(targetPet)} 闪避了 ${monster.name} 的攻击！` });
    addBattleLog('dodge', `🌀 ${getPetDisplayName(targetPet)} 闪避了攻击！`);
    if (passives.dodgeCounter) {
      const counterDmg = Math.max(1, Math.floor(targetStats.攻击力 * 0.5));
      liveBattle.monsterHpArray[monsterIdx] -= counterDmg;
      addBattleLog('skill', `⚡ ${getPetDisplayName(targetPet)} 闪避反击对 ${monster.name} 造成 ${counterDmg} 伤害`);
    }
    if (currentScreen === 'main') animateDodge(targetPet);
  } else {
    let defBonus = 0;
    if (passives.defBonus) defBonus += passives.defBonus;
    if (auras.teamDef) defBonus += auras.teamDef;
    if (buffs && buffs.def) defBonus += buffs.def;
    if (buffs && buffs.all) defBonus += buffs.all;
    // 自身防御降低副作用（如狂战之怒 -30% 防御）：直接削弱防御力百分比
    let defMult = 1;
    if (buffs && buffs.defDebuff) defMult *= (1 - buffs.defDebuff);

    // 使用防御力属性（defBonus 是百分比加成 *0.1 系数；defDebuff 直接乘到防御力上）
    let effectiveDef = targetStats.防御力 * defMult;
    // 防御削减系数0.7→0.6：与玩家攻击公式保持一致，宠物防御收益相对降低
    // 任务16：怪物攻击力含 buff 加成（atk/all/stolenAtk）
    let rawMonsterDmg = getMonsterAtkPower(monsterIdx) - effectiveDef * (0.6 + defBonus * 0.1);
    rawMonsterDmg = Math.round(rawMonsterDmg * randomFloat(0.90, 1.10));
    // 需求1：怪物被动 critRate/critDmg 加成（必杀等）
    var mCritChance2 = 0.10 + (mPassives2.critRate || 0);
    if (Math.random() < mCritChance2) {
      rawMonsterDmg = Math.round(rawMonsterDmg * (1.5 + (mPassives2.critDmg || 0)));
    }
    let monsterDmg = Math.max(1, rawMonsterDmg);

    if (passives.dmgReduce) monsterDmg = Math.round(monsterDmg * (1 - passives.dmgReduce));
    // 天赋坚毅之心减伤（pet_resolve）
    if (targetStats.dmgReduce) monsterDmg = Math.round(monsterDmg * (1 - targetStats.dmgReduce));
    // 血统减伤（通用效果系统）
    if (bloodline && bloodline.effects && bloodline.effects.dmgReduce) monsterDmg = Math.round(monsterDmg * (1 - bloodline.effects.dmgReduce));
    // 血统受到伤害增加（如嗜血狂化副作用）
    if (bloodline && bloodline.effects && bloodline.effects.dmgTakenPct) monsterDmg = Math.round(monsterDmg * (1 + bloodline.effects.dmgTakenPct));

    // 装备特效：格挡（10%概率格挡50%伤害）
    var targetSpecials = targetStats.equipSpecials || [];
    if (targetSpecials.indexOf('block') >= 0 && Math.random() < 0.10) {
      monsterDmg = Math.floor(monsterDmg * 0.5);
      addBattleLog('skill', `🛡️ ${getPetDisplayName(targetPet)} 触发【格挡】！伤害减半`);
    }

    if (passives.parryChance && Math.random() < passives.parryChance) {
      monsterDmg = Math.round(monsterDmg * (1 - passives.parryReduce));
      addBattleLog('skill', `🛡️ ${getPetDisplayName(targetPet)} 格挡！伤害降低`);
      if (passives.parryCounter) {
        const counterDmg = Math.max(1, Math.floor(targetStats.攻击力 * 0.4));
        liveBattle.monsterHpArray[monsterIdx] -= counterDmg;
        addBattleLog('skill', `⚡ ${getPetDisplayName(targetPet)} 格挡反击对 ${monster.name} 造成 ${counterDmg} 伤害`);
      }
    }

    if (buffs && buffs.shield > 0) {
      if (buffs.shield >= monsterDmg) { buffs.shield -= monsterDmg; monsterDmg = 0; }
      else { monsterDmg -= buffs.shield; buffs.shield = 0; }
    }

    liveBattle.petHp[targetPet.id].current = Math.max(0, liveBattle.petHp[targetPet.id].current - monsterDmg);
    liveBattle.logs.unshift({ type: 'damage', msg: `👹 ${monster.name} 普攻 ${getPetDisplayName(targetPet)} 造成 ${monsterDmg} 点伤害` });
    addBattleLog('damage', `👹 ${monster.name} 普攻 ${getPetDisplayName(targetPet)} 造成 ${monsterDmg} 点伤害`);

    // 需求1：怪物吸血被动（vampire）
    if (mPassives2.vampPct && monsterDmg > 0) {
      var mHeal2 = Math.floor(monsterDmg * mPassives2.vampPct);
      liveBattle.monsterHpArray[monsterIdx] = Math.min(
        liveBattle.monsterMaxHpArray[monsterIdx],
        liveBattle.monsterHpArray[monsterIdx] + mHeal2
      );
    }

    // 反射状态（荆棘护盾）：反弹受到的伤害
    if (buffs && buffs.reflectBuff && buffs.reflectBuff > 0 && monsterDmg > 0) {
      const reflectDmg = Math.floor(monsterDmg * buffs.reflectBuff);
      liveBattle.monsterHpArray[monsterIdx] -= reflectDmg;
      if (reflectDmg > 0) addBattleLog('skill', `💢 ${getPetDisplayName(targetPet)} 荆棘反射对 ${monster.name} 造成 ${reflectDmg} 伤害`);
    }
    // 反击状态（反击姿态）：受击时反击造成攻击力百分比伤害
    if (buffs && buffs.counterBuff && buffs.counterBuff > 0 && buffs.counterTurns > 0 && monsterDmg > 0) {
      const counterDmg = Math.max(1, Math.floor(targetStats.攻击力 * buffs.counterBuff));
      liveBattle.monsterHpArray[monsterIdx] -= counterDmg;
      addBattleLog('skill', `⚡ ${getPetDisplayName(targetPet)} 反击对 ${monster.name} 造成 ${counterDmg} 伤害`);
    }

    if (passives.reflectPct) {
      const reflectDmg = Math.floor(monsterDmg * passives.reflectPct);
      liveBattle.monsterHpArray[monsterIdx] -= reflectDmg;
      if (reflectDmg > 0) addBattleLog('skill', `💢 ${getPetDisplayName(targetPet)} 反震对 ${monster.name} 造成 ${reflectDmg} 伤害`);
      if (passives.stunChance && Math.random() < passives.stunChance) {
        addBattleLog('skill', `💫 ${getPetDisplayName(targetPet)} 的反震眩晕了 ${monster.name}！`);
      }
    }
    // 血统反弹（凝胶护盾等，通用效果系统）
    if (bloodline && bloodline.effects && bloodline.effects.reflectChance && Math.random() < bloodline.effects.reflectChance) {
      var reflectDmg2 = Math.floor(monsterDmg * (bloodline.effects.reflectPct || 0.3));
      liveBattle.monsterHpArray[monsterIdx] -= reflectDmg2;
      if (reflectDmg2 > 0) addBattleLog('skill', `💢 ${getPetDisplayName(targetPet)} 血统反弹对 ${monster.name} 造成 ${reflectDmg2} 伤害`);
    }
    // 需求10：血统反击（速度系招牌效果，受击时概率反击造成攻击力百分比伤害）
    if (bloodline && bloodline.effects && bloodline.effects.counterChance && monsterDmg > 0 && Math.random() < bloodline.effects.counterChance) {
      var counterDmgBl = Math.max(1, Math.floor(targetStats.攻击力 * (bloodline.effects.counterPct || 0.5)));
      liveBattle.monsterHpArray[monsterIdx] -= counterDmgBl;
      if (counterDmgBl > 0) addBattleLog('skill', `⚔️ ${getPetDisplayName(targetPet)} 血统反击对 ${monster.name} 造成 ${counterDmgBl} 伤害`);
    }

    if (liveBattle.petHp[targetPet.id].current <= 0) {
      let revived = false;
      if (passives.reviveChance && Math.random() < passives.reviveChance) {
        liveBattle.petHp[targetPet.id].current = Math.floor(liveBattle.petHp[targetPet.id].max * passives.revivePct);
        addBattleLog('heal', `✨ ${getPetDisplayName(targetPet)} 神佑复活！恢复 ${Math.floor(passives.revivePct*100)}% 气血`);
        revived = true;
      }
      // 血统复活（史莱姆之躯等，通用效果系统，每场战斗1次）
      if (!revived && bloodline && bloodline.effects && bloodline.effects.reviveChance && Math.random() < bloodline.effects.reviveChance) {
        var revivePct = bloodline.effects.reviveHpPct || 0.30;
        liveBattle.petHp[targetPet.id].current = Math.floor(liveBattle.petHp[targetPet.id].max * revivePct);
        addBattleLog('heal', `🟢 ${getPetDisplayName(targetPet)} 血统复活！恢复 ${Math.floor(revivePct*100)}% 气血`);
        // 复活概率降为0避免重复触发
        bloodline = Object.assign({}, bloodline, { effects: Object.assign({}, bloodline.effects, { reviveChance: 0 }) });
        revived = true;
      }
      if (!revived) {
        addBattleLog('info', `💔 ${getPetDisplayName(targetPet)} 阵亡了！`);
      }
    }
    if (currentScreen === 'main') animateMonsterAttackAnim(targetPet, monsterDmg, monsterIdx);
  }

  // 检查该怪物是否被反击击杀
  if (liveBattle.monsterHpArray[monsterIdx] <= 0) {
    liveBattle.monsterHpArray[monsterIdx] = 0;
    logMonsterKill(monsterIdx);
    if (currentScreen === 'main') animateMonsterDeath(monsterIdx);
    advanceWaveOrEndBattle();
    return;
  }

  setTimeout(() => nextFromQueue(), 400);
}

function applyTurnRegen() {
  if (!liveBattle) return;
  const auras = getAuraEffects(liveBattle.team);
  liveBattle.team.forEach(pet => {
    const hp = liveBattle.petHp[pet.id];
    if (!hp || hp.current <= 0) return;
    const passives = getPassiveEffects(pet);
    const bloodline = getBloodlineSkill(pet);
    const buffs = liveBattle.petBuffs[pet.id];
    const status = liveBattle.petStatus[pet.id];
    let regenPct = 0;
    if (passives.regenPct) regenPct += passives.regenPct;
    if (auras.teamRegen) regenPct += auras.teamRegen;
    // 血统回血（通用效果系统）
    if (bloodline && bloodline.effects && bloodline.effects.regenPct) regenPct += bloodline.effects.regenPct;
    if (regenPct > 0) {
      const heal = Math.floor(hp.max * regenPct);
      hp.current = Math.min(hp.max, hp.current + heal);
    }
    // 需求1：meditation 被动 - 每回合恢复魔法值（mpRegenPct）
    if (passives.mpRegenPct) {
      const mp = liveBattle.petMp[pet.id];
      if (mp && mp.current < mp.max) {
        const mpRecover = Math.floor(mp.max * passives.mpRegenPct);
        mp.current = Math.min(mp.max, mp.current + mpRecover);
      }
    }
    // 血统魔法回复（mpRegenPct，微光蝶、虚空主宰等）
    if (bloodline && bloodline.effects && bloodline.effects.mpRegenPct) {
      const mp2 = liveBattle.petMp[pet.id];
      if (mp2 && mp2.current < mp2.max) {
        const mpRecover2 = Math.floor(mp2.max * bloodline.effects.mpRegenPct);
        mp2.current = Math.min(mp2.max, mp2.current + mpRecover2);
      }
    }
    if (buffs && buffs.hotTurns > 0) {
      const hotHeal = Math.floor(hp.max * buffs.hotPct);
      hp.current = Math.min(hp.max, hp.current + hotHeal);
      buffs.hotTurns--;
    }
    if (status && status.poisoned > 0) {
      const poisonDmg = Math.floor(hp.max * status.poisonPct);
      hp.current = Math.max(0, hp.current - poisonDmg);
      status.poisoned--;
      if (poisonDmg > 0) addBattleLog('info', `☠️ ${getPetDisplayName(pet)} 中毒损失 ${poisonDmg} 气血`);
    }
    if (status && status.burning > 0) {
      const burnDmg = Math.floor(hp.max * status.burnPct);
      hp.current = Math.max(0, hp.current - burnDmg);
      status.burning--;
      if (burnDmg > 0) addBattleLog('info', `🔥 ${getPetDisplayName(pet)} 燃烧损失 ${burnDmg} 气血`);
    }
    if (buffs) {
      Object.keys(buffs.buffTurns || {}).forEach(k => {
        if (buffs.buffTurns[k] > 0) {
          buffs.buffTurns[k]--;
          if (buffs.buffTurns[k] <= 0) {
            if (k === 'atk') buffs.atk = 0;
            if (k === 'def') buffs.def = 0;
            if (k === 'spd') buffs.spd = 0;
            if (k === 'all') buffs.all = 0;
            if (k === 'defDebuff') buffs.defDebuff = 0;
          }
        }
      });
      // 反击/反射状态回合递减
      if (buffs.counterTurns > 0) { buffs.counterTurns--; if (buffs.counterTurns <= 0) buffs.counterBuff = 0; }
      if (buffs.reflectTurns > 0) { buffs.reflectTurns--; if (buffs.reflectTurns <= 0) buffs.reflectBuff = 0; }
      // 偷取攻击力回合递减
      if (buffs.stolenAtkTurns > 0) { buffs.stolenAtkTurns--; if (buffs.stolenAtkTurns <= 0) buffs.stolenAtk = 0; }
      // 护盾持续回合递减（修复护盾永不过期）
      if (buffs.shieldTurns > 0) { buffs.shieldTurns--; if (buffs.shieldTurns <= 0) buffs.shield = 0; }
      // 需求1：闪避增益回合递减
      if (buffs.dodgeTurns > 0) { buffs.dodgeTurns--; if (buffs.dodgeTurns <= 0) buffs.dodgeBuff = 0; }
    }
  });
  if (liveBattle.skillCooldowns) {
    Object.values(liveBattle.skillCooldowns).forEach(cds => {
      Object.keys(cds).forEach(k => { if (cds[k] > 0) cds[k]--; });
    });
  }
  // 怪物DoT和状态持续时间递减（对所有存活怪物）
  for (var mi = 0; mi < liveBattle.monsters.length; mi++) {
    if (liveBattle.monsterHpArray[mi] <= 0) continue;
    var ms = liveBattle.monsterStatusArray[mi];
    if (!ms) continue;
    // 需求1：怪物被动 regenPct 回血（再生）
    var mRegenPassives = getMonsterPassiveEffects(mi);
    if (mRegenPassives.regenPct) {
      var mHeal = Math.floor(liveBattle.monsterMaxHpArray[mi] * mRegenPassives.regenPct);
      liveBattle.monsterHpArray[mi] = Math.min(
        liveBattle.monsterMaxHpArray[mi],
        liveBattle.monsterHpArray[mi] + mHeal
      );
    }
    if (ms.poisoned > 0) {
      const dmg = Math.floor(liveBattle.monsterMaxHpArray[mi] * ms.poisonPct);
      liveBattle.monsterHpArray[mi] = Math.max(0, liveBattle.monsterHpArray[mi] - dmg);
      ms.poisoned--;
      if (ms.poisoned <= 0) {
        // 中毒结束，清除层数
        ms.poisonStacks = 0;
        ms.poisonPct = 0;
      }
      if (dmg > 0) addBattleLog('info', `☠️ ${liveBattle.monsters[mi].name} 中毒损失 ${dmg} 气血`);
    }
    if (ms.burning > 0) {
      const dmg = Math.floor(liveBattle.monsterMaxHpArray[mi] * ms.burnPct);
      liveBattle.monsterHpArray[mi] = Math.max(0, liveBattle.monsterHpArray[mi] - dmg);
      ms.burning--;
      if (dmg > 0) addBattleLog('info', `🔥 ${liveBattle.monsters[mi].name} 燃烧损失 ${dmg} 气血`);
    }
    // 其他状态持续时间递减
    if (ms.frozen > 0) ms.frozen--;
    if (ms.stunned > 0) ms.stunned--;
    if (ms.silenced > 0) ms.silenced--;
    if (ms.rooted > 0) ms.rooted--;
    if (ms.sleeping > 0) ms.sleeping--;
    if (ms.defReduceTurns > 0) {
      ms.defReduceTurns--;
      if (ms.defReduceTurns <= 0) ms.defReduced = 0;
    }
    // 需求17：嘲讽状态回合递减
    if (ms.tauntTurns > 0) {
      ms.tauntTurns--;
      if (ms.tauntTurns <= 0) ms.tauntedBy = null;
    }
  }
}

function processBattleDefeat() {
  if (!liveBattle) return;
  const expLoss = Math.floor(G.player.exp * 0.05);
  G.player.exp = Math.max(0, G.player.exp - expLoss);
  addBattleLog('info', `😞 战斗失败！损失 ${expLoss} 经验`);
  if (liveBattle.isDungeon) {
    addBattleLog('info', '门票已消耗，副本挑战失败...');
  }
  G.statistics.totalBattles++;
  updateAchievement('battle', 1);
  saveGame();
  liveBattle = null;
  if (currentScreen === 'main') render();
  if (autoBattleInterval) {
    battleSpawnTimer = setTimeout(() => {
      spawnMonster();
      if (currentScreen === 'main') render();
    }, 1500);
  }
  showToast('战斗失败！宠物全部阵亡', 'error');
}

// processBattleRewardsLive 已被拆分为 advanceWaveOrEndBattle + giveMonsterKillRewards + processWaveCleared
// 保留空函数作为向后兼容（如果有其他地方调用）
function processBattleRewardsLive() {
  advanceWaveOrEndBattle();
}

function processTreasureRewards() {
  if (!liveBattle || !liveBattle.treasureMap) return;
  const tmap = liveBattle.treasureMap;
  let goldBonus = 0, expBonus = 0, equipDrop = 0, eggDrop = 0, skillDrop = 0, moonDewCount = 0, diamondBonus = 0;
  // v2.2.0 需求10：新增词缀变量
  let gemDrop = 0, petExpBonus = 0, forgeStoneDrop = 0, digItemDrop = 0;
  tmap.affixes.forEach(a => {
    if (a.id === 'gold_bonus') goldBonus += a.value;
    if (a.id === 'exp_bonus') expBonus += a.value;
    if (a.id === 'equip_drop') equipDrop += a.value;
    if (a.id === 'egg_drop') eggDrop += a.value;
    if (a.id === 'skill_drop') skillDrop += a.value;
    if (a.id === 'moon_dew') moonDewCount += a.value;
    if (a.id === 'diamond_bonus') diamondBonus += a.value;
    if (a.id === 'gem_drop') gemDrop += a.value;
    if (a.id === 'pet_exp_bonus') petExpBonus += a.value;
    if (a.id === 'forge_stone_drop') forgeStoneDrop += a.value;
    if (a.id === 'dig_item_drop') digItemDrop += a.value;
  });
  let isDouble = tmap.special && tmap.special.id === 'double_reward';
  let isTriple = tmap.special && tmap.special.id === 'triple_reward';
  const mult = isTriple ? 3 : (isDouble ? 2 : 1);
  // 藏宝图等级越高，奖励越多（按获得时人物等级计算）
  const tmLevel = tmap.playerLevel || G.player.level || 1;
  const levelBonus = 1 + (tmLevel - 1) * 0.02; // 每级+2%奖励
  const baseGold = randomInt(500, 2000) * mult * levelBonus;
  const gold = Math.floor(baseGold * (1 + goldBonus));
  addGold(gold);
  addBattleLog('loot', `💰 获得 ${gold.toLocaleString()} 金币`);
  const baseExp = tmLevel * 30 * mult * levelBonus;
  const exp = Math.floor(baseExp * (1 + expBonus));
  const actualExp = addExp(exp);
  addBattleLog('loot', `⭐ 获得 ${actualExp} 经验`);
  var rewards = [];
  rewards.push({ icon: '💰', name: '金币', amount: gold, color: '#fbbf24' });
  rewards.push({ icon: '⭐', name: '经验', amount: actualExp, color: '#a78bfa' });
  if (diamondBonus > 0) {
    addDiamond(diamondBonus * mult);
    addBattleLog('loot', `💎 获得 ${diamondBonus * mult} 钻石`);
    rewards.push({ icon: '💎', name: '钻石', amount: diamondBonus * mult, color: '#60a5fa' });
  }
  if (moonDewCount > 0) {
    const existing = G.inventory.find(i => i.id === 'moon_dew');
    if (existing) existing.count += moonDewCount * mult;
    else G.inventory.push({ id: 'moon_dew', count: moonDewCount * mult });
    addBattleLog('loot', `🌙 获得月华露 x${moonDewCount * mult}`);
    rewards.push({ icon: '🌙', name: '月华露', amount: moonDewCount * mult, color: '#c084fc' });
  }
  if (Math.random() < equipDrop || (tmap.special && tmap.special.id === 'guaranteed_equip')) {
    const rarity = tmap.special && tmap.special.id === 'guaranteed_equip' ? 'purple' : (Math.random() < 0.3 ? 'purple' : 'blue');
    const equip = generateEquipment(rarity, G.player.level);
    addEquipmentToBag(equip);
    addBattleLog('loot', `⚔️ 获得 ${EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(equip.rarity)]} ${equip.name}`);
    rewards.push({ icon: '⚔️', name: equip.name, amount: 1, color: EQUIP_RARITY_COLORS[EQUIP_RARITIES.indexOf(equip.rarity)], sub: EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(equip.rarity)] });
  }
  if (Math.random() < eggDrop || (tmap.special && tmap.special.id === 'guaranteed_egg')) {
    // 需求5：根据藏宝图地图类型从对应宠物池中掉落宠物蛋
    var egg = null;
    if (tmap.mapType && typeof getTreasureMapPetPool === 'function') {
      var petPool = getTreasureMapPetPool(tmap.mapType);
      // guaranteed_egg 特殊词条：优先从池中选高T级宠物
      if (tmap.special && tmap.special.id === 'guaranteed_egg' && petPool.length > 0) {
        // 按 T 级降序排序，从高T级中随机选一个
        var sorted = petPool.slice().sort(function(a, b) {
          return (typeof getPetTier === 'function' ? getPetTier(b) : 1) - (typeof getPetTier === 'function' ? getPetTier(a) : 1);
        });
        var topT = sorted.length > 0 && typeof getPetTier === 'function' ? getPetTier(sorted[0]) : 1;
        var topCands = sorted.filter(function(n) { return typeof getPetTier === 'function' && getPetTier(n) === topT; });
        var chosenName = pickRandom(topCands.length > 0 ? topCands : sorted);
        egg = generateEggFromName(chosenName);
      } else {
        var chosenName2 = petPool.length > 0 ? pickRandom(petPool) : null;
        egg = chosenName2 ? generateEggFromName(chosenName2) : generateEgg(getEggTierByMapLevel());
      }
    } else {
      var tier = tmap.special && tmap.special.id === 'guaranteed_egg' ? Math.min(4, getEggTierByMapLevel() + 1) : getEggTierByMapLevel();
      egg = generateEgg(tier);
    }
    G.eggs.push(egg);
    var eggTierNum = (typeof getPetTier === 'function' && egg.petData && egg.petData.name) ? getPetTier(egg.petData.name) : (egg.tier + 1);
    addBattleLog('loot', `🥚 获得 T${eggTierNum} 宠物蛋 (${egg.petData.name})`);
    rewards.push({ icon: '🥚', name: 'T' + eggTierNum + ' 宠物蛋', amount: 1, color: RARITY_COLORS[eggTierNum - 1] });
  }
  if (Math.random() < skillDrop) {
    const skill = pickRandom(ALL_SKILLS);
    const existing = G.skillBooks.find(b => b.id === skill.id);
    if (existing) existing.count++;
    else G.skillBooks.push({ id: skill.id, count: 1 });
    addBattleLog('loot', `📖 获得技能书：${skill.name}`);
    rewards.push({ icon: '📖', name: skill.name, amount: 1, color: '#f59e0b' });
  }
  // v2.2.0 需求10：宝石掉落
  if (Math.random() < gemDrop) {
    var gemDef = GEM_TYPES[randomInt(0, GEM_TYPES.length - 1)];
    var gemLv = Math.random() < 0.2 ? 2 : 1;
    addGemToBag(gemDef.id, gemLv, 1);
    addBattleLog('loot', `💎 获得 ${gemDef.name}+${gemLv}`);
    rewards.push({ icon: gemDef.icon, name: gemDef.name + '+' + gemLv, amount: 1, color: gemDef.color });
  }
  // v2.2.0 需求10：宠物经验加成
  if (petExpBonus > 0 && G.player.activeTeam) {
    var petExpTotal = Math.floor(tmLevel * 20 * mult * (1 + petExpBonus));
    G.player.activeTeam.forEach(function(petId) {
      if (!petId) return;
      var pet = G.pets.find(function(p) { return p.id === petId; });
      if (pet && pet.level < G.player.level) {
        var needed = pet.level * 100;
        pet.exp = (pet.exp || 0) + petExpTotal;
        while (pet.exp >= needed && pet.level < G.player.level) {
          pet.exp -= needed;
          pet.level++;
          needed = pet.level * 100;
        }
      }
    });
    addBattleLog('loot', `🐾 队伍宠物获得 ${petExpTotal} 经验`);
    rewards.push({ icon: '🐾', name: '宠物经验', amount: petExpTotal, color: '#22c55e' });
  }
  // v2.2.0 需求10：强化石掉落
  if (Math.random() < forgeStoneDrop) {
    var stoneGrades = ['forge_stone_low', 'forge_stone_low', 'forge_stone_mid'];
    var stoneId = stoneGrades[randomInt(0, stoneGrades.length - 1)];
    var stoneCount = randomInt(1, 3) * (isTriple ? 3 : (isDouble ? 2 : 1));
    var stoneExisting = G.inventory.find(function(i) { return i.id === stoneId; });
    if (stoneExisting) stoneExisting.count += stoneCount;
    else G.inventory.push({ id: stoneId, count: stoneCount });
    addBattleLog('loot', `🔩 获得 ${getItemName(stoneId)} x${stoneCount}`);
    rewards.push({ icon: '🔩', name: getItemName(stoneId), amount: stoneCount, color: '#94a3b8' });
  }
  // v2.2.0 需求10：密藏道具掉落（与挖密藏系统联动）
  if (Math.random() < digItemDrop || (tmap.special && tmap.special.id === 'guaranteed_dig_map')) {
    var digItemPool = ['dig_map', 'dig_shovel', 'dig_lens', 'dig_key'];
    var digItemId = digItemPool[randomInt(0, digItemPool.length - 1)];
    var digCount = (tmap.special && tmap.special.id === 'guaranteed_dig_map') ? 1 : randomInt(1, 2);
    // guaranteed_dig_map 特殊词缀：必定掉落密藏图
    if (tmap.special && tmap.special.id === 'guaranteed_dig_map') digItemId = 'dig_map';
    var digExisting = G.inventory.find(function(i) { return i.id === digItemId; });
    if (digExisting) digExisting.count += digCount;
    else G.inventory.push({ id: digItemId, count: digCount });
    addBattleLog('loot', `🗺️ 获得 ${getItemName(digItemId)} x${digCount}`);
    rewards.push({ icon: digItemId === 'dig_map' ? '🗺️' : (digItemId === 'dig_shovel' ? '⛏️' : (digItemId === 'dig_lens' ? '🔍' : '🗝️')), name: getItemName(digItemId), amount: digCount, color: '#fde047' });
  }
  G.statistics.totalBattles++;
  updateAchievement('battle', 1);
  // 修复：藏宝图是活动道具，与主地图通关是两个概念，不应累加 map_clear 成就。
  // 主地图通关的成就计数已在 battle.js processBattleRewardsLive 的 boss 击杀分支处理。
  saveGame();
  liveBattle = null;
  if (autoBattleInterval) { clearInterval(autoBattleInterval); autoBattleInterval = null; }
  if (currentScreen === 'main') render();
  showTreasureRewardModal(rewards);
}

function processDungeonWaveComplete() {
  if (!liveBattle) return;
  if (liveBattle.teamDungeonData) {
    processTeamDungeonWave();
    return;
  }
  const dungeon = DUNGEONS.find(d => d.id === liveBattle.dungeonId);
  liveBattle.dungeonWave++;
  // 需求5：血统副本每波掉落血统珠（第3波10%，第4波20%，第5波boss必掉）
  if (liveBattle.dungeonId === 'bloodline_dungeon' && typeof BLOODLINE_DUNGEON_CFG !== 'undefined' && typeof addBloodOrb === 'function') {
    var waveIdx = liveBattle.dungeonWave - 1; // 0-indexed
    var dropChance = (BLOODLINE_DUNGEON_CFG.dropChance && BLOODLINE_DUNGEON_CFG.dropChance[waveIdx]) || 0;
    if (Math.random() < dropChance) {
      // 随机决定血统珠等级
      var r = Math.random();
      var orbId = 'blood_orb_low';
      var orbName = '低级血统珠';
      if (r < (BLOODLINE_DUNGEON_CFG.orbTierChance.high || 0.10)) {
        orbId = 'blood_orb_high';
        orbName = '高级血统珠';
      } else if (r < (BLOODLINE_DUNGEON_CFG.orbTierChance.high || 0.10) + (BLOODLINE_DUNGEON_CFG.orbTierChance.mid || 0.30)) {
        orbId = 'blood_orb_mid';
        orbName = '中级血统珠';
      }
      addBloodOrb(orbId, 1);
      addBattleLog('loot', `🩸 第${liveBattle.dungeonWave}波掉落 ${orbName} ×1`);
    }
  }
  if (liveBattle.dungeonWave >= liveBattle.dungeonMaxWaves) {
    addBattleLog('info', `🎉 副本完成！`);
    let reward = '';
    if (liveBattle.dungeonId === 'exp_cave') {
      const exp = G.player.level * 500 + randomInt(100, 500);
      const actualExp = addExp(exp);
      reward = `获得 ${actualExp.toLocaleString()} 经验`;
    } else if (liveBattle.dungeonId === 'gold_mine') {
      const gold = G.player.level * 200 + randomInt(500, 2000);
      addGold(gold);
      reward = `获得 ${gold.toLocaleString()} 金币`;
    } else if (liveBattle.dungeonId === 'egg_forest') {
      var tier = getEggTierByMapLevel();
      // 蛋之森林额外提升1级
      tier = Math.min(4, tier + 1);
      const egg = generateEgg(tier);
      G.eggs.push(egg);
      reward = `获得 T${tier+1} 宠物蛋`;
    } else if (liveBattle.dungeonId === 'skill_tower') {
      // 技能秘境：从全技能池随机掉落1~2本技能书
      const pool = ALL_SKILLS;
      const dropCount = randomInt(1, 2);
      var droppedNames = [];
      for (var si = 0; si < dropCount; si++) {
        const skill = pool[randomInt(0, pool.length - 1)];
        const existing = G.skillBooks.find(b => b.id === skill.id);
        if (existing) existing.count++;
        else G.skillBooks.push({ id: skill.id, count: 1 });
        droppedNames.push(skill.name);
      }
      reward = `获得技能书：${droppedNames.join('、')}`;
    } else if (liveBattle.dungeonId === 'forge_mine') {
      // 强化石矿脉：根据玩家等级掉落对应级别的强化石2~4颗
      const pl = G.player.level;
      var stoneId = 'forge_stone_low';
      if (pl >= 70) stoneId = 'forge_stone_high';
      else if (pl >= 40) stoneId = 'forge_stone_mid';
      const stoneCount = randomInt(2, 4);
      var existing = G.inventory.find(function(i) { return i.id === stoneId; });
      if (existing) existing.count += stoneCount;
      else G.inventory.push({ id: stoneId, count: stoneCount });
      var stoneName = { forge_stone_low: '低级强化石', forge_stone_mid: '中级强化石', forge_stone_high: '高级强化石' }[stoneId];
      reward = `获得 ${stoneName} ×${stoneCount}`;
    } else if (liveBattle.dungeonId === 'treasure_ruin') {
      // 藏宝遗迹：根据玩家等级掉落对应稀有度的藏宝图1~2张
      const pl2 = G.player.level;
      var rarities = ['white', 'green', 'blue', 'purple', 'orange'];
      var rIdx = pl2 < 30 ? 0 : pl2 < 50 ? 1 : pl2 < 70 ? 2 : pl2 < 90 ? 3 : 4;
      const mapCount = randomInt(1, 2);
      if (!G.treasureMaps) G.treasureMaps = [];
      for (var mi = 0; mi < mapCount; mi++) {
        // 30%概率提升一档
        var finalIdx = Math.min(rarities.length - 1, rIdx + (Math.random() < 0.3 ? 1 : 0));
        G.treasureMaps.push(generateTreasureMap(rarities[finalIdx]));
      }
      var mapName = TREASURE_MAP_RARITIES.find(r => r.id === rarities[Math.min(rarities.length - 1, rIdx + (mapCount > 1 ? 1 : 0))]).name;
      reward = `获得 ${mapName}${mapCount > 1 ? ' ×' + mapCount : ''}`;
    } else if (liveBattle.dungeonId === 'gem_cavern') {
      // 宝石秘洞：掉落1~3颗宝石（1级为主，小概率2级），受宝石掉落率天赋影响
      var gemDropBonus = getTalentBonus('gem_drop_rate');
      var baseDropCount = randomInt(1, 3);
      // 天赋每级增加20%掉落数量（向上取整概率）
      var extraDropChance = gemDropBonus;
      var bonusDrops = 0;
      for (var gi = 0; gi < 3; gi++) {
        if (Math.random() < extraDropChance) bonusDrops++;
      }
      var totalGemDrops = baseDropCount + bonusDrops;
      if (!G.gemBag) G.gemBag = [];
      var droppedGemNames = [];
      for (var gj = 0; gj < totalGemDrops; gj++) {
        var gemDef = GEM_TYPES[randomInt(0, GEM_TYPES.length - 1)];
        // 10%概率掉落2级宝石，受天赋影响额外提升
        var gemLevel = (Math.random() < 0.10 + gemDropBonus * 0.5) ? 2 : 1;
        addGemToBag(gemDef.id, gemLevel, 1);
        droppedGemNames.push(gemDef.name + '+' + gemLevel);
      }
      reward = `获得宝石：${droppedGemNames.join('、')}`;
    } else if (liveBattle.dungeonId === 'pet_equip_cave') {
      // 宠物秘境：通关奖励为宠物装备
      // 通关波次越多，奖励品质越高
      var waveCount = liveBattle.dungeonMaxWaves;
      // 根据波次决定品质
      var peRarityPool;
      if (waveCount >= 5) peRarityPool = ['rare','rare','epic','epic','legend'];
      else if (waveCount >= 4) peRarityPool = ['rare','rare','epic','epic'];
      else if (waveCount >= 3) peRarityPool = ['rare','rare','epic'];
      else peRarityPool = ['rare','rare'];
      // 通关5波极小概率出神话
      if (waveCount >= 5 && Math.random() < 0.05) peRarityPool.push('mythic');
      var peRarity = peRarityPool[randomInt(0, peRarityPool.length - 1)];
      var peEquip = generatePetEquip(peRarity);
      addPetEquipToBag(peEquip);
      var peRarityIdx = PET_EQUIP_RARITIES.indexOf(peRarity);
      reward = `获得 ${PET_EQUIP_RARITY_NAMES[peRarityIdx]} ${peEquip.name}`;
      // 需求6：宠物秘境收获日志
      if (typeof addActivityLog === 'function') {
        addActivityLog('petcave', '通关宠物秘境（' + waveCount + '波），获得 ' + PET_EQUIP_RARITY_NAMES[peRarityIdx] + ' ' + peEquip.name, 'win');
      }
      // 需求2：30%概率额外掉落材料（按波次决定材料等级）
      if (Math.random() < 0.30) {
        // 波次越多，材料等级越高
        var matPool;
        if (waveCount >= 5) matPool = ['mystic_crystal_mid','mystic_crystal_high','ancient_rune_mid','ancient_rune_high'];
        else if (waveCount >= 3) matPool = ['mystic_crystal_low','mystic_crystal_mid','ancient_rune_low','ancient_rune_mid'];
        else matPool = ['mystic_crystal_low','ancient_rune_low'];
        var matKey = matPool[randomInt(0, matPool.length - 1)];
        var matCount = randomInt(1, 3);
        G.petEquipMaterials[matKey] = (G.petEquipMaterials[matKey] || 0) + matCount;
        reward += '，' + PET_EQUIP_MATERIAL_NAMES[matKey] + ' x' + matCount;
        if (typeof addActivityLog === 'function') {
          addActivityLog('petcave', '额外掉落 ' + PET_EQUIP_MATERIAL_NAMES[matKey] + ' x' + matCount, 'win');
        }
      }
    } else if (liveBattle.dungeonId === 'bloodline_dungeon') {
      // 需求5：血统副本通关奖励（血统珠已在每波掉落逻辑中处理，这里给额外金币和经验）
      var bdGold = G.player.level * 100 + randomInt(200, 800);
      addGold(bdGold);
      reward = `获得 ${bdGold.toLocaleString()} 金币（血统珠已在波次中掉落）`;
    }
    addBattleLog('loot', reward);
    G.statistics.totalDungeons++;
    updateDailyTask('dungeon_run', 1);
    updateAchievement('dungeon', 1);
    saveGame();
    liveBattle = null;
    if (currentScreen === 'main') render();
    showToast(`副本完成！${reward}`, 'success');
    // v2.2.0 需求3：副本完成后恢复自动挂机（修复战斗卡死问题）
    if (autoBattleInterval) {
      battleSpawnTimer = setTimeout(function() {
        spawnMonster();
        if (currentScreen === 'main') {
          render();
          setTimeout(function() { renderBattleArena(); }, 50);
        }
      }, 1500);
    }
  } else {
    addBattleLog('info', `⚔️ 第${liveBattle.dungeonWave + 1}/${liveBattle.dungeonMaxWaves}波怪物出现！`);
    const map = MAPS.find(m => m.id === G.player.currentMap);
    const lv = map ? randomInt(map.minLv, map.maxLv) : G.player.level;
    // 同步主地图：使用连续成长曲线 + 提升后的基础属性 + 副本难度强化（小怪×5）
    var lvScale = 1 + lv * 0.012;
    const baseHp = Math.floor((40 + lv * 20) * 5 * lvScale);
    const baseAtk = Math.floor((4 + lv * 3.8) * 5 * lvScale);
    var newMonster = {
      name: pickRandom(map ? map.monsters : ['怪物']),
      level: lv, enemyType: 'mob',
      hp: baseHp, maxHp: baseHp,
      atk: baseAtk, def: Math.floor(lv * 2.0 * 1.2 * 1.5),
    };
    if (!newMonster.speed) newMonster.speed = Math.floor((newMonster.level || 1) * 2 + 10);
    // 副本为单怪模式：monsters 数组只含1个元素
    liveBattle.monsters = [newMonster];
    liveBattle.monsterHpArray = [newMonster.hp];
    liveBattle.monsterMaxHpArray = [newMonster.maxHp || newMonster.hp];
    liveBattle.monsterStatusArray = [{ frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, poisonStacks: 0, burning: 0, burnPct: 0, defReduced: 0, defReduceTurns: 0 }];
    // 任务16：同步重置怪物 buff 数组（保持数组一致性）
    liveBattle.monsterBuffsArray = [{ atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0, dodgeBuff: 0, dodgeTurns: 0 }];
    liveBattle.round = 0;
    liveBattle.phase = 'player_turn';
    liveBattle.animating = false;
    saveGame();
    if (currentScreen === 'main') render();
    buildTurnQueue();
    scheduleNextTurn();
  }
}

function openChestDirect(chest) {
  chest.contents.forEach(c => {
    if (c.type === 'gold') { addGold(c.amount); addBattleLog('loot', `💰 获得 ${c.amount.toLocaleString()} 金币`); }
    else if (c.type === 'diamond') { var dAmt = Math.floor(c.amount * (1 + getTalentBonus('diamond_find') + getTalentBonus('diamond_mastery') + getTalentBonus('loot_mastery'))); addDiamond(dAmt); addBattleLog('loot', `💎 获得 ${dAmt} 钻石`); }
    else if (c.type === 'egg') {
      const egg = generateEgg(c.tier);
      G.eggs.push(egg);
      addBattleLog('loot', `🥚 获得 T${c.tier+1} 宠物蛋`);
      // 需求7：双倍宠物蛋掉落buff（egg_drop_mult > 1 时额外掉落）
      var eggDropMult = (typeof getBuffMult === 'function') ? getBuffMult('egg_drop_mult') : 1;
      for (var ei = 1; ei < eggDropMult; ei++) {
        var extraEgg = generateEgg(c.tier);
        G.eggs.push(extraEgg);
        addBattleLog('loot', `🥚 双倍蛋buff：额外获得 T${c.tier+1} 宠物蛋`);
      }
    }
    else if (c.type === 'equipment') { addEquipmentToBag(c.equip); addBattleLog('loot', `⚔️ 获得 ${EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(c.equip.rarity)]} ${c.equip.name} Lv.${c.equip.level}`); }
    else if (c.type === 'skill_book') {
      const existing = G.skillBooks.find(b => b.id === c.book.id);
      if (existing) existing.count++;
      else G.skillBooks.push({ id: c.book.id, count: 1 });
      addBattleLog('loot', `📖 获得技能书：${c.book.name}`);
    }
    else if (c.type === 'item') {
      const existing = G.inventory.find(i => i.id === c.id);
      if (existing) existing.count += c.amount;
      else G.inventory.push({ id: c.id, count: c.amount });
      addBattleLog('loot', `📦 获得 ${getItemName(c.id)} x${c.amount}`);
    }
    else if (c.type === 'talent_point') {
      addTalentPoints(c.amount);
      addBattleLog('loot', `🌟 获得天赋点 x${c.amount}！`);
    }
  });
  chest.opened = true;
  updateAchievement('chest_open', 1);
}

function openChestFromBag(chestId) {
  const idx = G.chests.findIndex(c => c.id === chestId);
  if (idx === -1) return;
  const chest = G.chests[idx];
  // 手动开宝箱：显示转盘
  if (typeof showChestRoulette === 'function') {
    showChestRoulette(chest);
  } else {
    openChestDirect(chest);
    G.chests.splice(idx, 1);
    saveGame();
    render();
    showToast(`打开了${CHEST_RARITIES.find(r => r.id === chest.rarity).name}！`, 'success');
  }
}

function openAllChests() {
  while (G.chests.length > 0) {
    openChestDirect(G.chests[0]);
    G.chests.shift();
  }
  saveGame();
  render();
  showToast('已打开所有宝箱！', 'success');
}

function toggleAutoChests() {
  G.autoOpenChests = !G.autoOpenChests;
  saveGame();
  render();
  showToast(G.autoOpenChests ? '自动开箱：开启' : '自动开箱：关闭（宝箱存入背包）', 'info');
}

function stopLiveBattle() {
  clearTimeout(battleTurnTimer);
  clearTimeout(battleSpawnTimer);
  clearTimeout(walkTimer);
  liveBattle = null;
  walkPhase = null;
  battleTurnTimer = null;
  battleSpawnTimer = null;
}

// v2.2.0 需求1：在线挂机彩蛋掉落——仅在线挂机时触发
function maybeDropIdleEgg() {
  if (Math.random() > IDLE_EGG_DROP_CHANCE) return;
  var reward = IDLE_EGG_REWARDS[Math.floor(Math.random() * IDLE_EGG_REWARDS.length)];
  var amount = 0;
  if (reward.type === 'gold') {
    amount = randomInt(reward.min, reward.max);
    var goldMult = 1 + G.player.rebirth * 0.1;
    amount = Math.floor(amount * goldMult);
    addGold(amount);
  } else if (reward.type === 'exp') {
    amount = randomInt(reward.min, reward.max);
    var expMult = 1 + G.player.rebirth * 0.2;
    amount = Math.floor(amount * expMult);
    addExp(amount);
  } else if (reward.type === 'diamond') {
    amount = randomInt(reward.min, reward.max);
    addDiamond(amount);
  } else if (reward.type === 'item') {
    amount = reward.count;
    var existing = G.inventory.find(function(i) { return i.id === reward.itemId; });
    if (existing) existing.count += amount;
    else G.inventory.push({ id: reward.itemId, count: amount });
    if (reward.itemId === 'hatch_stone') G.hatchStones = (G.hatchStones || 0) + amount;
  }
  // 彩蛋统计
  if (!G.idleEggStats) G.idleEggStats = { total: 0, gold: 0, exp: 0, diamond: 0, items: 0 };
  G.idleEggStats.total++;
  if (reward.type === 'gold') G.idleEggStats.gold++;
  else if (reward.type === 'exp') G.idleEggStats.exp++;
  else if (reward.type === 'diamond') G.idleEggStats.diamond++;
  else if (reward.type === 'item') G.idleEggStats.items++;
  addBattleLog('loot', '🥚 发现了彩蛋！获得 ' + reward.icon + ' ' + reward.name + (amount > 1 ? ' x' + amount : ''));
  showToast('🥚 彩蛋！获得 ' + reward.icon + ' ' + reward.name + (amount > 1 ? ' x' + amount : ''), 'success');
}

// Battle animation helpers
// 获取怪物DOM元素：优先 battle-monster-{idx}，回退到 battle-monster（兼容）
function getMonsterEl(monsterIdx) {
  if (monsterIdx !== undefined && monsterIdx !== null) {
    var el = document.getElementById('battle-monster-' + monsterIdx);
    if (el) return el;
  }
  return document.getElementById('battle-monster');
}

function animatePetAttack(pet, dmg, monsterIdx) {
  const petEl = document.getElementById('battle-pet-' + pet.id);
  const monsterEl = getMonsterEl(monsterIdx);
  if (petEl) { petEl.classList.remove('animate-pet-attack'); void petEl.offsetWidth; petEl.classList.add('animate-pet-attack'); }
  setTimeout(() => {
    if (monsterEl) { monsterEl.classList.remove('animate-monster-hurt'); void monsterEl.offsetWidth; monsterEl.classList.add('animate-monster-hurt'); }
    if (monsterEl && dmg) spawnDamageFloat(monsterEl, dmg);
  }, 150);
}

function getSkillElementClass(skill) {
  if (!skill || !skill.element) return '';
  const map = { '火': 'animate-skill-fire', '冰': 'animate-skill-ice', '雷': 'animate-skill-thunder', '暗': 'animate-skill-shadow', '光': 'animate-skill-heal', '毒': 'animate-status-poison' };
  return map[skill.element] || '';
}

function animateSkillAttack(pet, skill, dmg, monsterIdx) {
  const petEl = document.getElementById('battle-pet-' + pet.id);
  const monsterEl = getMonsterEl(monsterIdx);
  const skillClass = getSkillElementClass(skill);
  if (petEl) { petEl.classList.remove('animate-pet-attack'); void petEl.offsetWidth; petEl.classList.add('animate-pet-attack'); }
  setTimeout(() => {
    if (monsterEl) {
      monsterEl.classList.remove('animate-monster-hurt'); void monsterEl.offsetWidth;
      monsterEl.classList.add('animate-monster-hurt');
      if (skillClass) { monsterEl.classList.remove(skillClass); void monsterEl.offsetWidth; monsterEl.classList.add(skillClass); }
    }
    if (monsterEl && dmg) spawnDamageFloat(monsterEl, dmg);
  }, 150);
}

function animateMonsterAttackAnim(targetPet, dmg, monsterIdx) {
  const monsterEl = getMonsterEl(monsterIdx);
  const petEl = document.getElementById('battle-pet-' + targetPet.id);
  if (monsterEl) { monsterEl.classList.remove('animate-monster-attack'); void monsterEl.offsetWidth; monsterEl.classList.add('animate-monster-attack'); }
  setTimeout(() => {
    if (petEl) { petEl.classList.remove('animate-pet-hurt'); void petEl.offsetWidth; petEl.classList.add('animate-pet-hurt'); }
    if (petEl) spawnDamageFloat(petEl, { val: dmg, crit: false });
  }, 150);
}

function animateDodge(targetPet) {
  const petEl = document.getElementById('battle-pet-' + targetPet.id);
  if (petEl) {
    spawnDodgeFloat(petEl);
    petEl.style.opacity = '0.3';
    setTimeout(() => { if (petEl) petEl.style.opacity = '1'; }, 300);
  }
}

function animateMonsterDeath(monsterIdx) {
  // 无索引时对所有已死亡怪物播放死亡动画
  if (monsterIdx === undefined || monsterIdx === null) {
    if (!liveBattle) return;
    for (var i = 0; i < liveBattle.monsters.length; i++) {
      if (liveBattle.monsterHpArray[i] <= 0) {
        var el = document.getElementById('battle-monster-' + i);
        if (el) el.classList.add('animate-monster-die');
      }
    }
    return;
  }
  const monsterEl = document.getElementById('battle-monster-' + monsterIdx) || document.getElementById('battle-monster');
  if (monsterEl) monsterEl.classList.add('animate-monster-die');
}

function spawnDamageFloat(parentEl, dmg) {
  const floatEl = document.createElement('div');
  if (dmg.heal) {
    floatEl.className = 'heal-float';
    floatEl.textContent = '+' + dmg.val;
    floatEl.style.cssText = 'position:absolute;font-weight:900;pointer-events:none;z-index:10;color:#4ade80;font-size:1.1rem;text-shadow:0 0 8px rgba(74,222,128,0.6);left:50%;top:20%;animation:healFloat 1s ease-out forwards;';
  } else if (dmg.crit) {
    floatEl.className = 'crit-float';
    floatEl.textContent = dmg.val + '!!';
    floatEl.style.cssText = 'position:absolute;font-weight:900;pointer-events:none;z-index:10;color:#fbbf24;font-size:1.6rem;text-shadow:0 0 12px rgba(251,191,36,0.8);left:50%;top:15%;animation:critFloat 1.4s ease-out forwards;';
  } else {
    floatEl.className = 'damage-float';
    floatEl.textContent = '-' + dmg.val;
    floatEl.style.cssText = 'position:absolute;font-weight:900;pointer-events:none;z-index:10;color:#f87171;font-size:1.1rem;left:50%;top:25%;animation:damageFloat 0.9s ease-out forwards;';
  }
  parentEl.style.position = 'relative';
  parentEl.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), dmg.crit ? 1400 : dmg.heal ? 1000 : 900);
}

function spawnDodgeFloat(parentEl) {
  const floatEl = document.createElement('div');
  floatEl.textContent = '闪避';
  floatEl.style.cssText = 'position:absolute;font-weight:900;pointer-events:none;z-index:10;color:#94a3b8;font-size:1rem;left:50%;top:30%;animation:dodgeFloat 0.8s ease-out forwards;';
  parentEl.style.position = 'relative';
  parentEl.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), 800);
}

function addBattleLog(type, msg) {
  G.battleLog.push({ type, msg, time: Date.now() });
  if (G.battleLog.length > 100) G.battleLog.shift();
}
