// ===== state.js : 娓告垙鐘舵€併€佸瓨妗ｃ€佽縼绉汇€佹柊鐜╁绀煎寘 =====

// ==================== GAME STATE ====================

const DEFAULT_STATE = {
  player: {
    name: '冒险者', level: 1, exp: 0, expToNext: 200,
    gold: 0, diamond: 0, rebirth: 0, maxLevel: 100,
    talent: 'warrior', battlePassLevel: 0, battlePassExp: 0,
    battlePassPremium: false, activeTeam: [null, null, null],
    currentMap: 1, currentRoute: 0,
    equipment: { weapon: null, helmet: null, armor: null, pants: null, gloves: null, shoes: null },
    forgeLevels: { weapon: 0, helmet: 0, armor: 0, pants: 0, gloves: 0, shoes: 0 },
    formation: ['front','mid','back'],
    cultivation: { 伤害: 0, 抗性: 0, 辅助: 0 },
    mainBattleLifespanCounter: 0, // 主线战斗寿命消耗计数器（每10次扣1点）
  },
  pets: [],
  eggs: [],
  inventory: [],
  battleState: null,
  battleLog: [],
  dailyTasks: {},
  dailyTaskDate: '',
  weeklyTasks: {},       // 需求10：周常任务进度
  weeklyTaskDate: '',   // 需求10：周常任务重置标识（周一日期）
  teamDungeonUsed: {},
  towerProgress: 0,
  towerMaxFloor: 0,
  towerWeeklyResetDate: '', // 爬塔每周重置日期
  lastTreasureHuntDate: '', // 打宝图每天一轮限制
  arenaDailyRewardDate: '', // 竞技场每日奖励领取日期
  statistics: { totalBattles: 0, totalHatches: 0, totalFusions: 0, totalDungeons: 0 },
  marketListings: [],
  newPlayerGiftClaimed: false,
  battleSpeed: 1,
  autoDecompose: { enabled: false, maxRarity: 'green', maxLevel: 10 },
  mapProgress: {},
  chests: [],
  autoOpenChests: true,
  eggShards: {},
  dungeonDailyUsed: {},
  skillBooks: [],
  equipmentBag: [],
  treasureMaps: [],
  arenaScore: 0,
  arenaRank: 'bronze',
  arenaDailyUsed: 0,
  arenaWeeklyDate: '',
  arenaOpponents: [],
  arenaChallengedOpps: {},
  achievements: {},
  achievementRewardsClaimed: {},
  buffs: {},
  talents: { origin: 1 },
  talentPoints: 0,
  talentPointsEarned: 0, // 已获得天赋点记录（避免转生后重复发放）
  // v2.11.0 需求6.1：天赋双方案系统
  totalTalentPointsEarned: 0, // 总获得天赋点数（双方案共用，权威来源）
  talents2: { origin: 1 },    // 第二套天赋方案
  activeTalentBuild: 1,       // 当前激活方案（1或2）
  talentBuild2Unlocked: false, // 第二套方案是否已解锁（消耗500钻石）
  redeemCodesUsed: [],
  hatchStones: 0,
  // 抽奖历史记录
  lotteryHistory: [],
  // 宝石系统：已镶嵌宝石按装备栏为键；宝石背包数组
  gems: { weapon: null, helmet: null, armor: null, pants: null, gloves: null, shoes: null },
  gemBag: [],
  // 宠物装备系统：宠物装备背包、材料背包（需求2：材料按低/中/高级分级；需求4：已移除兽皮）
  // v2.11.0 需求2.1：宠装打造材料更名 ancient_rune_* → war_book_*（战兵图册），与符文材料彻底拆分
  petEquipBag: [],
  petEquipMaterials: {
    mystic_crystal_low: 0, mystic_crystal_mid: 0, mystic_crystal_high: 0,
    war_book_low: 0, war_book_mid: 0, war_book_high: 0,
  },
  // v2.11.0 需求2.1：符文系统独立材料存储（远古符文，仅用于符文强化/分解）
  runeMaterials: {
    ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0,
  },
  // 需求6：活动收获日志（按活动ID→日期→条目数组）
  activityLogs: {},
  // 阵法系统：已学阵法ID→{level, exp}，当前激活阵法ID
  formations: {},
  activeFormation: null,
  formationFragments: 0, // 阵法碎片：分解阵法获得，5个可合成随机阵法书
  formationActivityUsed: {},
  formationEscortUsed: {},  // 需求2：押镖活动每日使用记录 {date: count}
  formationEscortProgress: null, // 需求2：押镖活动进度 {stage, rewardsEarned}
  // 需求6：技能书活动每日使用记录与进度
  skillBookHuntUsed: {},   // 需求6：技能书活动每日使用记录 {date: count}
  skillBookHuntProgress: null, // 需求6：当前活动阶段进度（null/0表示未开始，1-5表示当前阶段）
  petCaveUsed: {},         // 需求12：宠物秘境每日使用记录 {date: count}
  // 血统试炼每日使用记录（原 advanceTrialUsed，进阶系统移除后仅血统试炼使用）
  advanceTrialUsed: {},
  // 宠物派遣奇遇系统：当前派遣列表 & 历史
  dispatches: [],          // 当前进行中的派遣 [{id, mapId, petIds, startTs, durationIdx, totalPower}]
  dispatchHistory: [],     // 已领取的派遣历史 [{id, mapId, mapName, petIds, durationIdx, totalPower, startTs, collectTs, rewards}]
  dispatchDailyUsed: {},  // 每日派遣次数记录 {date: count}
  // 离线挂机：上次保存时间戳
  lastSaveTime: 0,
  // 需求1：主线剧情任务链
  mainQuest: null,  // { chainIdx, progress, questData, claimed }
  // 需求5：血色要塞活动
  crimsonFortress: null,      // 当前活动状态 { difficulty, round, kills, buffs, active, pendingBuffs }
  crimsonFortressUsed: {},    // 每日使用记录 { date: count }
  // v2.2.0 需求1：在线挂机彩蛋统计
  idleEggStats: { total: 0, gold: 0, exp: 0, diamond: 0, items: 0 },
  // v2.2.0 需求9：挖密藏系统——当前挖掘会话状态
  digSession: null,  // { grid: [...], digsLeft, maxDigs, lensUsed: [], keyUsed, totalFound: {} }
  digDailyUsed: {},  // 每日挖密藏次数记录 { date: count }
  // 符文系统：符文背包（对标阴阳师御魂系统）
  runeBag: [],  // [{ id, setId, slot, grade, level, mainStat:{type,value}, subStats:[{type,value}] }]
  // 进化森林活动每日使用记录 {date: count}
  evolutionForestUsed: {},
  // 战斗上下文（用于标记特殊战斗类型，如进化森林）
  battleContext: null,
  // 六道轮回活动系统
  samsara: {
    currentFloor: 0,      // 当前挑战层数
    maxFloorCleared: 0,   // 历史最高通关层数
    reincarnationPoints: 0, // 轮回积分
    inChallenge: false,   // 是否正在挑战中
    divinePowers: {},     // 已获得的神通 { powerId: { star: 1 } }
  },
};

let G = JSON.parse(JSON.stringify(DEFAULT_STATE));

// ==================== SaveManager : 存档管理器 ====================
// 防抖保存、版本管理、存档完整性校验
// 修复：原 saveGame 每次直接 JSON.stringify + localStorage.setItem，高频调用导致性能问题
var SAVE_VERSION = 3; // 存档版本号，用于迁移管理
var SAVE_KEY = 'shadow_era_save';
var _saveTimer = null;
var _saveDirty = false; // 标记是否有未保存的更改
var _lastSaveTime = 0;
var SAVE_DEBOUNCE_MS = 2000; // 防抖间隔：2秒内的多次保存合并为一次
var SAVE_MIN_INTERVAL_MS = 1000; // 最小保存间隔

function saveGame() {
  // 删除存档时跳过所有自动保存
  if (window.__DELETING_SAVE__) return;
  _saveDirty = true;
  // 防抖：延迟合并保存
  if (_saveTimer) return;
  var now = Date.now();
  var elapsed = now - _lastSaveTime;
  var delay = elapsed < SAVE_MIN_INTERVAL_MS ? SAVE_MIN_INTERVAL_MS - elapsed : 0;
  _saveTimer = setTimeout(function() {
    _saveTimer = null;
    _doSave();
  }, Math.max(delay, SAVE_DEBOUNCE_MS));
}

// 强制立即保存（用于关键操作如转生、购买等）
function saveGameImmediate() {
  if (window.__DELETING_SAVE__) return;
  if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  _doSave();
}

function _doSave() {
  try {
    if (!_saveDirty) return;
    G.lastSaveTime = Date.now();
    G._saveVersion = SAVE_VERSION;
    var data = JSON.stringify(G);
    // 存档大小安全检查（超过 5MB 警告）
    if (data.length > 5 * 1024 * 1024) {
      Logger.warn('[Save]', '存档体积过大: ' + (data.length / 1024 / 1024).toFixed(2) + 'MB，可能影响性能');
    }
    localStorage.setItem(SAVE_KEY, data);
    _saveDirty = false;
    _lastSaveTime = Date.now();
  } catch(e) {
    Logger.error('[Save]', '保存失败: ' + (e.message || e));
    // 存储空间不足时尝试清理
    if (e.name === 'QuotaExceededError') {
      Logger.error('[Save]', '存储空间不足，尝试清理旧数据...');
      try { localStorage.removeItem(SAVE_KEY); } catch(e2) {}
    }
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem('shadow_era_save');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || !parsed.player) {
        throw new Error('存档数据损坏');
      }
      G = { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...parsed };
      if (!G.player) G.player = JSON.parse(JSON.stringify(DEFAULT_STATE.player));
  if (!G.dailyTasks || typeof G.dailyTasks !== 'object') G.dailyTasks = {};
  if (!G.dailyTaskDate) G.dailyTaskDate = '';
  if (!G.weeklyTasks || typeof G.weeklyTasks !== 'object') G.weeklyTasks = {};
  if (!G.weeklyTaskDate) G.weeklyTaskDate = '';
      if (!G.player.activeTeam || !Array.isArray(G.player.activeTeam)) G.player.activeTeam = [null, null, null];
      if (!G.statistics) G.statistics = { totalBattles: 0, totalHatches: 0, totalFusions: 0, totalDungeons: 0 };
      if (!G.marketListings || !Array.isArray(G.marketListings)) G.marketListings = [];
      if (!G.towerProgress) G.towerProgress = 0;
      if (!G.towerMaxFloor) G.towerMaxFloor = 0;
      if (G.towerWeeklyResetDate === undefined) G.towerWeeklyResetDate = '';
      if (G.lastTreasureHuntDate === undefined) G.lastTreasureHuntDate = '';
      if (G.arenaDailyRewardDate === undefined) G.arenaDailyRewardDate = '';
      if (!G.teamDungeonUsed) G.teamDungeonUsed = {};
      if (G.newPlayerGiftClaimed === undefined) G.newPlayerGiftClaimed = false;
      if (!G.battleSpeed) G.battleSpeed = 1;
      if (!G.mapProgress) G.mapProgress = {};
      if (!G.chests || !Array.isArray(G.chests)) G.chests = [];
      if (G.autoOpenChests === undefined) G.autoOpenChests = true;
      if (!G.eggShards) G.eggShards = {};
      if (!G.dungeonDailyUsed) G.dungeonDailyUsed = {};
      if (!G.skillBooks || !Array.isArray(G.skillBooks)) G.skillBooks = [];
      if (!G.player.equipment) G.player.equipment = { weapon: null, helmet: null, armor: null, pants: null, gloves: null, shoes: null };
      if (!G.player.forgeLevels) G.player.forgeLevels = { weapon: 0, helmet: 0, armor: 0, pants: 0, gloves: 0, shoes: 0 };
if (!G.player.cultivation) G.player.cultivation = { 伤害: 0, 抗性: 0, 辅助: 0 };
      if (!G.equipmentBag || !Array.isArray(G.equipmentBag)) G.equipmentBag = [];
      if (!G.autoDecompose) G.autoDecompose = JSON.parse(JSON.stringify(DEFAULT_STATE.autoDecompose));
      if (!G.player.formation || !Array.isArray(G.player.formation)) G.player.formation = ['front','mid','back'];
      if (!G.treasureMaps || !Array.isArray(G.treasureMaps)) G.treasureMaps = [];
      if (G.arenaScore === undefined) G.arenaScore = 0;
      if (!G.arenaRank) G.arenaRank = 'bronze';
      if (G.arenaDailyUsed === undefined) G.arenaDailyUsed = 0;
      if (!G.arenaWeeklyDate) G.arenaWeeklyDate = '';
      if (!G.arenaOpponents || !Array.isArray(G.arenaOpponents)) G.arenaOpponents = [];
      if (!G.arenaChallengedOpps) G.arenaChallengedOpps = {};
      if (!G.achievements || typeof G.achievements !== 'object') G.achievements = {};
      if (!G.achievementRewardsClaimed || typeof G.achievementRewardsClaimed !== 'object') G.achievementRewardsClaimed = {};
      if (!G.pets || !Array.isArray(G.pets)) G.pets = [];
      if (!G.eggs || !Array.isArray(G.eggs)) G.eggs = [];
      if (!G.inventory || !Array.isArray(G.inventory)) G.inventory = [];
      // 天赋星图迁移：自动点亮星图之源，初始化已获得天赋点记录
      if (!G.talents || typeof G.talents !== 'object') G.talents = {};
      if (!G.talents.origin) G.talents.origin = 1;
      if (G.talentPointsEarned === undefined) G.talentPointsEarned = G.player.level;
      // v2.11.0 需求6.1：天赋双方案迁移
      // 旧存档无 totalTalentPointsEarned，从旧 talentPoints（剩余池）+ 当前方案已分配点数推算总获得点数
      if (G.totalTalentPointsEarned === undefined) {
        var _allocated = 0;
        if (G.talents) Object.keys(G.talents).forEach(function(id) { if (id !== 'origin') _allocated += G.talents[id] || 0; });
        G.totalTalentPointsEarned = (G.talentPoints || 0) + _allocated;
      }
      if (!G.talents2 || typeof G.talents2 !== 'object') G.talents2 = {};
      if (!G.talents2.origin) G.talents2.origin = 1;
      if (G.activeTalentBuild === undefined) G.activeTalentBuild = 1;
      if (G.talentBuild2Unlocked === undefined) G.talentBuild2Unlocked = false;
      // 经验曲线迁移：旧存档使用 1.15 倍增长，新公式基于等级
      // 检测旧公式：旧公式 Lv1=100，新公式 Lv1=200。若 expToNext 与新公式差距大，则重新计算
      if (typeof G.player.expToNext === 'number' && G.player.level >= 1) {
        var expected = getExpForLevel(G.player.level);
        // 若差距超过 30%，认为是旧公式，重置为新公式值
        if (Math.abs(G.player.expToNext - expected) > expected * 0.3) {
          G.player.expToNext = expected;
        }
      }
      // 兑换码使用记录初始化
      if (!G.redeemCodesUsed || !Array.isArray(G.redeemCodesUsed)) G.redeemCodesUsed = [];
      // 孵化石库存初始化
      if (G.hatchStones === undefined) G.hatchStones = 0;
      // 抽奖历史记录迁移
      if (!G.lotteryHistory || !Array.isArray(G.lotteryHistory)) G.lotteryHistory = [];
      // 宝石系统迁移
      if (!G.gems || typeof G.gems !== 'object') {
        G.gems = { weapon: null, helmet: null, armor: null, pants: null, gloves: null, shoes: null };
      } else {
        ['weapon','helmet','armor','pants','gloves','shoes'].forEach(function(slot) {
          if (!G.gems[slot]) G.gems[slot] = null;
        });
      }
      if (!G.gemBag || !Array.isArray(G.gemBag)) G.gemBag = [];
      // v2.9.0 需求1.1：宝石类型迁移 —— hp→vit, mp→mag, int→mag
      if (G.gemBag.length > 0) {
        var _gemChanged = false;
        G.gemBag.forEach(function(g) {
          var newType = g.type;
          if (g.type === 'hp') { newType = 'vit'; _gemChanged = true; }
          else if (g.type === 'mp' || g.type === 'int') { newType = 'mag'; _gemChanged = true; }
          if (newType !== g.type) {
            // 合并到已有同类型同等级的宝石堆
            var existing = G.gemBag.find(function(x) { return x.type === newType && x.level === g.level && x !== g; });
            if (existing) { existing.count += g.count; g.count = 0; }
            else { g.type = newType; }
          }
        });
        if (_gemChanged) G.gemBag = G.gemBag.filter(function(g) { return g.count > 0; });
      }
      // 迁移已装备装备上的宝石孔类型
      if (G.player && G.player.equipment) {
        Object.keys(G.player.equipment).forEach(function(slotId) {
          var item = G.player.equipment[slotId];
          if (!item || !Array.isArray(item.gemSlots)) return;
          item.gemSlots.forEach(function(gs) {
            if (gs.type === 'hp') gs.type = 'vit';
            else if (gs.type === 'mp' || gs.type === 'int') gs.type = 'mag';
            if (gs.gem && gs.gem.type) {
              if (gs.gem.type === 'hp') gs.gem.type = 'vit';
              else if (gs.gem.type === 'mp' || gs.gem.type === 'int') gs.gem.type = 'mag';
            }
          });
        });
      }
      // 宠物装备系统迁移
      if (!G.petEquipBag || !Array.isArray(G.petEquipBag)) G.petEquipBag = [];
      if (!G.petEquipMaterials) G.petEquipMaterials = { mystic_crystal_low: 0, mystic_crystal_mid: 0, mystic_crystal_high: 0, war_book_low: 0, war_book_mid: 0, war_book_high: 0 };
      // 需求2：旧材料（mystic_crystal/ancient_rune）迁移为新的低级材料
      if (typeof PET_EQUIP_LEGACY_MATS !== 'undefined' && PET_EQUIP_LEGACY_MATS) {
        Object.keys(PET_EQUIP_LEGACY_MATS).forEach(function(oldId) {
          if (G.petEquipMaterials[oldId] && !G.petEquipMaterials[PET_EQUIP_LEGACY_MATS[oldId]]) {
            G.petEquipMaterials[PET_EQUIP_LEGACY_MATS[oldId]] = G.petEquipMaterials[oldId];
            delete G.petEquipMaterials[oldId];
          } else if (G.petEquipMaterials[oldId]) {
            G.petEquipMaterials[PET_EQUIP_LEGACY_MATS[oldId]] = (G.petEquipMaterials[PET_EQUIP_LEGACY_MATS[oldId]] || 0) + G.petEquipMaterials[oldId];
            delete G.petEquipMaterials[oldId];
          }
        });
      }
      // v2.11.0 需求2.1：拆分 ancient_rune_* 材料
      // 旧存档中 petEquipMaterials.ancient_rune_* 同时用于宠装打造和符文强化
      // 拆分后：宠装打造使用 war_book_*，符文强化使用 runeMaterials.ancient_rune_*
      // 旧存档的 ancient_rune_* 数量按1:1迁移到两个新存储（保护玩家既有库存）
      if (!G.runeMaterials) G.runeMaterials = { ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
      ['ancient_rune_low','ancient_rune_mid','ancient_rune_high'].forEach(function(matId) {
        var newId = matId.replace('ancient_rune_', 'war_book_');
        // 旧存档的 ancient_rune_* 数量迁移到 war_book_* (宠装材料)
        if (G.petEquipMaterials[matId] && !G.petEquipMaterials[newId]) {
          G.petEquipMaterials[newId] = G.petEquipMaterials[matId];
        } else if (G.petEquipMaterials[matId]) {
          G.petEquipMaterials[newId] = (G.petEquipMaterials[newId] || 0) + G.petEquipMaterials[matId];
        }
        // 同时复制到 runeMaterials.ancient_rune_* (符文材料)
        if (G.petEquipMaterials[matId]) {
          G.runeMaterials[matId] = (G.runeMaterials[matId] || 0) + G.petEquipMaterials[matId];
        }
        delete G.petEquipMaterials[matId];
      });
      // 确保 runeMaterials 字段都存在
      ['ancient_rune_low','ancient_rune_mid','ancient_rune_high'].forEach(function(mid) {
        if (G.runeMaterials[mid] === undefined) G.runeMaterials[mid] = 0;
      });
      // 确保新材料字段都存在
      ['mystic_crystal_low','mystic_crystal_mid','mystic_crystal_high','war_book_low','war_book_mid','war_book_high'].forEach(function(mid) {
        if (G.petEquipMaterials[mid] === undefined) G.petEquipMaterials[mid] = 0;
      });
      // 需求4：旧兽皮（beast_leather）迁移为低级神秘水晶（1:1 比例）
      if (G.petEquipMaterials['beast_leather'] && G.petEquipMaterials['beast_leather'] > 0) {
        G.petEquipMaterials['mystic_crystal_low'] = (G.petEquipMaterials['mystic_crystal_low'] || 0) + G.petEquipMaterials['beast_leather'];
        delete G.petEquipMaterials['beast_leather'];
      }
      // petEquipDungeonUsed 已废弃（旧宠物装备副本系统已移除），清理旧存档数据
      if (G.petEquipDungeonUsed) delete G.petEquipDungeonUsed;
      // 需求6：活动收获日志（按活动ID和日期分组）
      if (!G.activityLogs || typeof G.activityLogs !== 'object') G.activityLogs = {};
      // 阵法系统迁移
      if (!G.formations || typeof G.formations !== 'object') G.formations = {};
      if (G.activeFormation === undefined) G.activeFormation = null;
if (G.formationFragments === undefined) G.formationFragments = 0;
if (!G.formationActivityUsed || typeof G.formationActivityUsed !== 'object') G.formationActivityUsed = {};
// 需求2：押镖活动迁移
if (!G.formationEscortUsed || typeof G.formationEscortUsed !== 'object') G.formationEscortUsed = {};
if (G.formationEscortProgress === undefined) G.formationEscortProgress = null;
// 需求5：血色要塞活动迁移
if (!G.crimsonFortressUsed || typeof G.crimsonFortressUsed !== 'object') G.crimsonFortressUsed = {};
if (G.crimsonFortress === undefined) G.crimsonFortress = null;
// 需求1：主线剧情迁移
if (G.mainQuest === undefined) G.mainQuest = null;
// 需求5：日常历练任务轮次循环计数器迁移
if (G.mainQuestCycleCount === undefined) G.mainQuestCycleCount = 0;
      // 需求6：技能书活动迁移
      if (!G.skillBookHuntUsed || typeof G.skillBookHuntUsed !== 'object') G.skillBookHuntUsed = {};
      if (G.skillBookHuntProgress === undefined) G.skillBookHuntProgress = null;
      // 需求12：宠物秘境活动迁移
      if (!G.petCaveUsed || typeof G.petCaveUsed !== 'object') G.petCaveUsed = {};
      // 进阶试炼迁移（原 bloodlineTrialUsed → advanceTrialUsed）
      if (G.bloodlineTrialUsed && !G.advanceTrialUsed) {
        G.advanceTrialUsed = G.bloodlineTrialUsed;
        delete G.bloodlineTrialUsed;
      }
      if (!G.advanceTrialUsed || typeof G.advanceTrialUsed !== 'object') G.advanceTrialUsed = {};
      // 天赋节点ID迁移：fusion_drop → socket_nail_drop, hatch_drop → repair_glue_drop
      if (G.talents) {
        if (G.talents['fusion_drop'] && !G.talents['socket_nail_drop']) {
          G.talents['socket_nail_drop'] = G.talents['fusion_drop'];
          delete G.talents['fusion_drop'];
        }
        if (G.talents['hatch_drop'] && !G.talents['repair_glue_drop']) {
          G.talents['repair_glue_drop'] = G.talents['hatch_drop'];
          delete G.talents['hatch_drop'];
        }
      }
      // 宠物派遣奇遇系统迁移
      if (!G.dispatches || !Array.isArray(G.dispatches)) G.dispatches = [];
      if (!G.dispatchHistory || !Array.isArray(G.dispatchHistory)) G.dispatchHistory = [];
      if (!G.dispatchDailyUsed || typeof G.dispatchDailyUsed !== 'object') G.dispatchDailyUsed = {};
      // v2.2.0 迁移：在线挂机彩蛋统计
      if (!G.idleEggStats || typeof G.idleEggStats !== 'object') G.idleEggStats = { total: 0, gold: 0, exp: 0, diamond: 0, items: 0 };
      // v2.2.0 迁移：挖密藏系统
      if (G.digSession === undefined) G.digSession = null;
      if (!G.digDailyUsed || typeof G.digDailyUsed !== 'object') G.digDailyUsed = {};
      // 符文系统迁移：初始化符文背包
      if (!G.runeBag || !Array.isArray(G.runeBag)) G.runeBag = [];
      // 进化森林活动迁移
      if (!G.evolutionForestUsed || typeof G.evolutionForestUsed !== 'object') G.evolutionForestUsed = {};
      // 主线战斗寿命计数器迁移
      if (G.player.mainBattleLifespanCounter === undefined) G.player.mainBattleLifespanCounter = 0;
      // 六道轮回活动系统迁移
      if (!G.samsara || typeof G.samsara !== 'object') {
        G.samsara = { currentFloor: 0, maxFloorCleared: 0, reincarnationPoints: 0, inChallenge: false, divinePowers: {} };
      } else {
        if (G.samsara.currentFloor === undefined) G.samsara.currentFloor = 0;
        if (G.samsara.maxFloorCleared === undefined) G.samsara.maxFloorCleared = 0;
        if (G.samsara.reincarnationPoints === undefined) G.samsara.reincarnationPoints = 0;
        if (G.samsara.inChallenge === undefined) G.samsara.inChallenge = false;
        if (!G.samsara.divinePowers || typeof G.samsara.divinePowers !== 'object') G.samsara.divinePowers = {};
        // v2.11.0 需求7.1：神通星级上限6，旧存档中超出的星级截断
        var _maxDpStar = (typeof MAX_DIVINE_POWER_STAR !== 'undefined') ? MAX_DIVINE_POWER_STAR : 6;
        Object.keys(G.samsara.divinePowers).forEach(function(pid) {
          if (G.samsara.divinePowers[pid] && G.samsara.divinePowers[pid].star > _maxDpStar) {
            G.samsara.divinePowers[pid].star = _maxDpStar;
          }
        });
      }
      // 宠物符文槽位迁移：为每只宠物初始化 runes 字段
      if (G.pets && Array.isArray(G.pets)) {
        G.pets.forEach(function(pet) {
          if (pet && !pet.runes) {
            pet.runes = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
          }
        });
      }
      // v2.11.0 需求5.1：符文主属性重算（1/3/5号位固定值×5倍 + 强化线性递增）
      if (G.runeBag && Array.isArray(G.runeBag)) {
        G.runeBag.forEach(function(rune) {
          if (rune && rune.mainStat && typeof rune.level === 'number') {
            var gradeIdx = RUNE_GRADES.indexOf(rune.grade);
            if (gradeIdx < 0) gradeIdx = 0;
            rune.mainStat.value = calcRuneMainStat(rune.mainStat.type, gradeIdx, rune.level, rune.slot);
          }
        });
      }
      // 同步重算宠物已装备的符文
      if (G.pets && Array.isArray(G.pets)) {
        G.pets.forEach(function(pet) {
          if (pet && pet.runes) {
            Object.keys(pet.runes).forEach(function(slotKey) {
              var rune = pet.runes[slotKey];
              if (rune && rune.mainStat && typeof rune.level === 'number') {
                var gradeIdx = RUNE_GRADES.indexOf(rune.grade);
                if (gradeIdx < 0) gradeIdx = 0;
                rune.mainStat.value = calcRuneMainStat(rune.mainStat.type, gradeIdx, rune.level, rune.slot);
              }
            });
          }
        });
      }
      migratePetAttributes();
      migrateInnateSkills();
      migratePetAdvance(); // 需求3：宠物进阶字段迁移
      migrateGemSlots();
      restoreEquipmentAffixes();
      migrateTreasureMaps();
      migratePetRarity();
      migrateFiveDimAttributes(); // 需求16：五维属性系统迁移
      // 迁移：修复旧存档all_stat buff值（从50更新为200）
      if (G.buffs && G.buffs.all_stat && G.buffs.all_stat.mult < 200 && G.buffs.all_stat.expireAt > Date.now()) {
        G.buffs.all_stat.mult = 200;
      }
      // 迁移：修复旧存档all_stat buff默认值问题（getBuffMult默认返回1，all_stat应为0）
      checkDailyReset();
      checkArenaWeeklyReset();
    }
  } catch(e) {
    console.error('Load game error, resetting:', e);
    try { localStorage.removeItem('shadow_era_save'); } catch(e2) {}
    G = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

// 宝石孔系统迁移：旧装备补充 gemSlots 字段；旧 G.gems 数据退还到背包
function migrateGemSlots() {
  function fixItem(item) {
    if (item && !Array.isArray(item.gemSlots)) {
      item.gemSlots = [];
    }
  }
  if (G.equipmentBag && Array.isArray(G.equipmentBag)) {
    G.equipmentBag.forEach(fixItem);
  }
  if (G.player && G.player.equipment) {
    Object.values(G.player.equipment).forEach(fixItem);
  }
  if (G.marketListings && Array.isArray(G.marketListings)) {
    G.marketListings.forEach(function(listing) {
      if (listing && listing.item) fixItem(listing.item);
    });
  }
  // 旧 G.gems 数据迁移：将旧槽位上的宝石退还到背包，避免玩家损失
  if (G.gems && Array.isArray(G.gemBag)) {
    var migrated = false;
    Object.keys(G.gems).forEach(function(slotId) {
      var gem = G.gems[slotId];
      // 仅迁移有效的旧宝石数据
      if (gem && typeof gem.type === 'string' && typeof gem.level === 'number' && gem.level > 0) {
        var existing = G.gemBag.find(function(g) { return g.type === gem.type && g.level === gem.level; });
        if (existing) existing.count = (existing.count || 0) + 1;
        else G.gemBag.push({ type: gem.type, level: gem.level, count: 1 });
        migrated = true;
      }
    });
    if (migrated) {
      console.log('宝石孔系统迁移：旧 G.gems 数据已退还到背包');
    }
    // 清空旧的 G.gems 字段（不再使用），保持默认结构避免其它代码报错
    G.gems = { weapon: null, helmet: null, armor: null, pants: null, gloves: null, shoes: null };
  }
}

function migrateInnateSkills() {
  if (!G.pets || !Array.isArray(G.pets)) return;
  G.pets.forEach(pet => {
    if (!pet || typeof pet !== 'object') return;
    if (!pet.innateSkills || !Array.isArray(pet.innateSkills)) pet.innateSkills = [];
    if (pet.moonDewUsed === undefined) pet.moonDewUsed = 0;
    if (pet.yuanxiaoUsed === undefined) pet.yuanxiaoUsed = 0;
    // 宠物装备栏初始化
    if (!pet.petEquipment || typeof pet.petEquipment !== 'object') {
      pet.petEquipment = { attack: null, hp: null, defense: null };
    } else {
      if (!pet.petEquipment.attack) pet.petEquipment.attack = null;
      if (!pet.petEquipment.hp) pet.petEquipment.hp = null;
      if (!pet.petEquipment.defense) pet.petEquipment.defense = null;
    }
// 血统珠字段初始化（无血统珠时为 null）
if (!pet.bloodlineOrb || typeof pet.bloodlineOrb !== 'object') pet.bloodlineOrb = null;
// 符文槽位初始化（6个位置，初始全部为空）
if (!pet.runes || typeof pet.runes !== 'object') pet.runes = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
// 需求1迁移：旧存档血统珠可能缺少 sourcePetName 字段，补全以确保专属血统逻辑生效
if (pet.bloodlineOrb && !pet.bloodlineOrb.sourcePetName) {
pet.bloodlineOrb.sourcePetName = pet.name || '未知宠物';
}
    // 注意：不再截断为 1 个技能。createStarterPet 和 generatePetBase 都会生成多技能宠物，
    // 旧版迁移逻辑会在每次加载时丢失玩家合法获得的多技能。
    // 仅修复旧存档中可能存在的 isInnate 标记缺失。
    pet.innateSkills.forEach(function(s) {
      if (s && s.isInnate === undefined) s.isInnate = true;
    });
  });
}

// 新进阶系统迁移：处理旧进阶丸补偿 + 初始化新进阶字段
// 1. 将背包中的旧进阶丸按价值转化为钻石补偿
// 2. 可进阶宠物（PET_DEX中evolvable=true）标记为 advanceable=true
// 3. 初始化 advanceValue 和 advanceStage 字段
function migratePetAdvance() {
  if (!G.pets || !Array.isArray(G.pets)) return;
  // 步骤1：宠物字段迁移
  G.pets.forEach(function(pet) {
    if (!pet) return;
    // 新进阶系统：检查宠物是否为可进阶宠物
    var dex = (typeof PET_DEX !== 'undefined' && pet.name) ? PET_DEX[pet.name] : null;
    if (dex && dex.evolvable) {
      pet.advanceable = true;
    } else {
      // 旧系统宠物保持不可进阶
      pet.advanceable = false;
    }
    if (pet.advanceValue === undefined) pet.advanceValue = 0;
    if (pet.advanceStage === undefined) pet.advanceStage = 0;
  });
  // 步骤2：旧进阶丸道具补偿 — 按价值转化为钻石（仅处理旧道具，新进化晶石不受影响）
  var pillCompensation = { advance_pill_low: 5, advance_pill_mid: 15, advance_pill_high: 50 };
  var totalDiamonds = 0;
  if (G.inventory && Array.isArray(G.inventory)) {
    var toRemove = [];
    G.inventory.forEach(function(inv) {
      if (inv && pillCompensation[inv.id] && inv.count > 0) {
        totalDiamonds += pillCompensation[inv.id] * inv.count;
        toRemove.push(inv);
      }
    });
    toRemove.forEach(function(inv) {
      var idx = G.inventory.indexOf(inv);
      if (idx >= 0) G.inventory.splice(idx, 1);
    });
  }
  if (totalDiamonds > 0) {
    if (G.player && typeof G.player.diamond === 'number') {
      G.player.diamond += totalDiamonds;
    }
    if (typeof addBattleLog === 'function') {
      addBattleLog('loot', '💎 旧进阶丸已转化为钻石补偿 ×' + totalDiamonds);
    }
    console.log('[迁移] 旧进阶丸道具补偿：钻石 +' + totalDiamonds);
  }
}

// 梦幻西游风格属性迁移：旧存档的宠物补充缺失的核心属性，重算衍生属性，补充资质
function migratePetAttributes() {
  if (!G.pets || !Array.isArray(G.pets)) return;
  G.pets.forEach(function(pet) {
    if (!pet) return;
    // 兜底：缺失 attributes 的宠物初始化空对象继续迁移
    if (!pet.attributes) pet.attributes = {};
    var a = pet.attributes;
    // 确保核心属性存在
    if (a.力量 === undefined) a.力量 = randomInt(10, 25);
    if (a.体质 === undefined) a.体质 = randomInt(15, 30);
    if (a.敏捷 === undefined) a.敏捷 = randomInt(10, 25);
    if (a.耐力 === undefined) a.耐力 = randomInt(10, 25);
    // 旧存档兼容：智力→魔力（先迁移再初始化，避免随机值覆盖旧值）
    if (a.智力 !== undefined && a.魔力 === undefined) { a.魔力 = a.智力; delete a.智力; }
    if (a.魔力 === undefined) a.魔力 = randomInt(10, 25);
    // 重算衍生属性
    a.气血 = a.体质 * 5 + randomInt(20, 40);
    a.法力 = (a.魔力 || a.智力 || 0) * 3 + randomInt(10, 25);
    // 补充资质：按宠物类型的图鉴范围生成
    if (!pet.aptitude) {
      var dex = getPetDex(pet.name);
      pet.aptitude = {};
      APTITUDE_KEYS.forEach(function(k) {
        var range = dex.aptRange[k] || [1200, 1800];
        pet.aptitude[k] = randomInt(range[0], range[1]);
      });
    }
    // 同步种族：无论是否已有 race，都从图鉴同步（修正种族错误）
    var dex2 = getPetDex(pet.name);
    if (dex2 && dex2.race) pet.race = dex2.race;
  });
}

// 品质迁移：根据当前成长/资质重新计算品质（修复月华露培养后品质未刷新的问题）
function migratePetRarity() {
  if (!G.pets || !Array.isArray(G.pets)) return;
  if (typeof recalcRarity !== 'function') return;
  G.pets.forEach(function(pet) {
    if (!pet || !pet.name) return;
    // 迁移：修复旧版本中 fusePets 把异化宠物 name 改成 '★XX·异' 导致 getPetDex 失效的问题
    // 还原真名，并通过 isSpecialTag 字段标记异化（rarity='special' 保持不变）
    if (pet.rarity === 'special' && pet.name.indexOf('★') === 0 && pet.name.indexOf('·异') >= 0) {
      pet.name = pet.name.replace(/^★/, '').replace(/·异$/, '');
      pet.isSpecialTag = true;
    }
    // 异化品质保持不变
    if (pet.rarity === 'special') return;
    var oldRarity = pet.rarity;
    var newRarity = recalcRarity(pet);
    if (newRarity !== oldRarity) {
      pet.rarity = newRarity;
    }
  });
}

// 需求16：五维属性系统迁移
// 1. 宠物资质：智力资质→魔力资质，新增耐力资质
// 2. 宠物属性点：初始化 attrPoints 和 freeAttrPoints（由 getPetAttrPoints 延迟处理）
// 3. 人物属性：智力→魔力，新增耐力
function migrateFiveDimAttributes() {
  // 迁移宠物资质
  if (G.pets && Array.isArray(G.pets)) {
    G.pets.forEach(function(pet) {
      if (!pet) return;
      if (pet.aptitude) {
        // 智力资质 → 魔力资质
        if (pet.aptitude.智力资质 !== undefined && pet.aptitude.魔力资质 === undefined) {
          pet.aptitude.魔力资质 = pet.aptitude.智力资质;
          delete pet.aptitude.智力资质;
        }
        // 新增耐力资质（默认取魔力资质的值作为基础）
        if (pet.aptitude.耐力资质 === undefined) {
          pet.aptitude.耐力资质 = pet.aptitude.体质资质 || 1500;
        }
      }
      // attrPoints 和 freeAttrPoints 由 getPetAttrPoints 延迟初始化
    });
  }
  // 迁移人物属性（如有）
  if (G.player) {
    // 智力 → 魔力
    if (G.player.int !== undefined && G.player.mag === undefined) {
      G.player.mag = G.player.int;
    }
    // 新增耐力
    if (G.player.end === undefined) {
      G.player.end = G.player.vit || 10;
    }
  }
}

// 藏宝图迁移：补充等级属性 + 恢复词条format函数（JSON序列化会丢失函数）
function migrateTreasureMaps() {
  if (!G.treasureMaps || !Array.isArray(G.treasureMaps)) return;
  // 构建词条映射表
  var affixMap = {};
  if (typeof TREASURE_AFFIXES !== 'undefined') {
    TREASURE_AFFIXES.forEach(function(a) { affixMap[a.id] = a; });
  }
  G.treasureMaps.forEach(function(tmap) {
    if (tmap && tmap.playerLevel === undefined) {
      tmap.playerLevel = G.player.level || 1;
    }
    // 需求5：旧藏宝图补充 mapType / mapTypeName 字段（随机分配1-11）
    if (tmap && tmap.mapType === undefined) {
      var mapType = randomInt(1, 11);
      var mapTypeInfo = (typeof getTreasureMapType === 'function') ? getTreasureMapType(mapType) : null;
      tmap.mapType = mapType;
      tmap.mapTypeName = mapTypeInfo ? mapTypeInfo.name : '未知地图';
    }
    // 恢复词条的format函数
    if (tmap.affixes && Array.isArray(tmap.affixes)) {
      tmap.affixes.forEach(function(a) {
        if (a && typeof a.format !== 'function' && affixMap[a.id]) {
          a.format = affixMap[a.id].format;
          a.name = affixMap[a.id].name;
        }
      });
    }
  });
}

function restoreEquipmentAffixes() {
  if (typeof AFFIX_TYPES === 'undefined') return;
  var affixMap = {};
  AFFIX_TYPES.forEach(function(a) { affixMap[a.id] = a; });
  function fixAffixes(affixes) {
    if (!affixes || !Array.isArray(affixes)) return;
    affixes.forEach(function(a) {
      if (a && typeof a.format !== 'function' && affixMap[a.id]) {
        a.format = affixMap[a.id].format;
        a.name = affixMap[a.id].name;
        if (affixMap[a.id].special) a.special = true;
      }
    });
  }
  if (G.equipmentBag && Array.isArray(G.equipmentBag)) {
    G.equipmentBag.forEach(function(item) { if (item) fixAffixes(item.affixes); });
  }
  if (G.player && G.player.equipment) {
    Object.values(G.player.equipment).forEach(function(item) {
      if (item) fixAffixes(item.affixes);
    });
  }
  if (G.marketListings && Array.isArray(G.marketListings)) {
    G.marketListings.forEach(function(listing) {
      if (listing && listing.item && listing.item.affixes) fixAffixes(listing.item.affixes);
    });
  }
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (G.dailyTaskDate !== today) {
    G.dailyTasks = {};
    G.dailyTaskDate = today;
    G.teamDungeonUsed = {};
    G.dungeonDailyUsed = {};
    G.arenaDailyUsed = 0;
    // 竞技场已挑战对手记录跨日清空（修复 checkArenaWeeklyReset 永不执行的 bug）
    G.arenaChallengedOpps = {};
  }
  // 统一清理日期键控对象中的过期日期数据，防止存档膨胀
  // 这些对象使用 {date: count} 模式，只需保留当天数据
  var dailyKeyedFields = [
    'advanceTrialUsed', 'formationActivityUsed', 'formationEscortUsed',
    'skillBookHuntUsed', 'petCaveUsed', 'dispatchDailyUsed', 'crimsonFortressUsed',
    'digDailyUsed', 'evolutionForestUsed'
  ];
  dailyKeyedFields.forEach(function(field) {
    if (G[field] && typeof G[field] === 'object') {
      Object.keys(G[field]).forEach(function(date) {
        if (date !== today) delete G[field][date];
      });
    }
  });
  // 需求10：周常任务每周一重置
  var weekKey = getWeekKey();
  if (G.weeklyTaskDate !== weekKey) {
    G.weeklyTasks = {};
    G.weeklyTaskDate = weekKey;
  }
  // 清理废弃字段（已移除的系统遗留数据）
  if (G.petEquipDungeonUsed) delete G.petEquipDungeonUsed;
}

// 需求10：获取当前周标识（周一日期字符串，同周内不变）
function getWeekKey() {
  var d = new Date();
  var day = d.getDay() || 7; // 0=周日 → 7
  d.setDate(d.getDate() - day + 1); // 回到周一
  return d.toDateString();
}

// ==================== OFFLINE PROGRESSION ====================

function calculateOfflineRewards() {
  if (!G.lastSaveTime || G.lastSaveTime <= 0) return null;
  var now = Date.now();
  var elapsedMs = now - G.lastSaveTime;
  // 最少离线5分钟才计算
  if (elapsedMs < 5 * 60 * 1000) return null;
  // 最多累计8小时
  var maxMs = 8 * 60 * 60 * 1000;
  if (elapsedMs > maxMs) elapsedMs = maxMs;
  var elapsedMin = Math.floor(elapsedMs / 60000);
  // 按当前地图等级计算每分钟收益（约每30秒一波怪）
  var mapLv = G.player.currentMap || 1;
  var playerLv = G.player.level || 1;
  var baseLv = Math.max(playerLv, mapLv * 5);
  // 经验：每分钟约2波怪，每波怪经验 ≈ baseLv * 8
  var expPerMin = Math.floor(baseLv * 8 * 2 * (1 + G.player.rebirth * 0.2));
  // 金币：每波怪金币 ≈ baseLv * 5
  var goldPerMin = Math.floor(baseLv * 5 * 2 * (1 + G.player.rebirth * 0.1));
  // 宠物经验：队伍宠物均分经验
  var petExpPerMin = Math.floor(baseLv * 4 * 2);
  // 蛋掉落概率：每分钟约0.1个
  var eggChance = 0.1;
  var totalExp = expPerMin * elapsedMin;
  var totalGold = goldPerMin * elapsedMin;
  var totalPetExp = petExpPerMin * elapsedMin;
  var eggsEarned = Math.floor(eggChance * elapsedMin);
  // 应用经验加成buff（离线时buff已过期，但计算时按基础值）
  return {
    minutes: elapsedMin,
    exp: totalExp,
    gold: totalGold,
    petExp: totalPetExp,
    eggs: eggsEarned,
  };
}

function claimOfflineRewards() {
  var rewards = calculateOfflineRewards();
  if (!rewards) return;
  // 发放奖励
  if (rewards.exp > 0) addExp(rewards.exp);
  if (rewards.gold > 0) addGold(rewards.gold);
  // 宠物经验
  if (rewards.petExp > 0 && G.player.activeTeam) {
    G.player.activeTeam.forEach(function(petId) {
      if (!petId) return;
      var pet = G.pets.find(function(p) { return p.id === petId; });
      if (pet && pet.level < G.player.level) {
        var needed = pet.level * 100;
        pet.exp = (pet.exp || 0) + rewards.petExp;
        while (pet.exp >= needed && pet.level < G.player.level) {
          pet.exp -= needed;
          pet.level++;
          // v2.11.0 需求3.2：升级时发放属性点 + 自动加点方案
          if (typeof grantAttrPointsOnLevelUp === 'function') grantAttrPointsOnLevelUp(pet);
          if (pet.autoAllocateRatios && typeof autoAllocateAttrPoints === 'function' && (pet.freeAttrPoints || 0) > 0) {
            autoAllocateAttrPoints(pet, pet.autoAllocateRatios);
          }
          needed = pet.level * 100;
        }
      }
    });
  }
  // 蛋掉落
  if (rewards.eggs > 0) {
    for (var i = 0; i < rewards.eggs && i < 10; i++) {
      if (typeof generateEgg === 'function') {
        G.eggs.push(generateEgg(randomInt(0, 1)));
      }
    }
  }
  // 更新存档时间
  G.lastSaveTime = Date.now();
  saveGame();
  return rewards;
}

// ==================== NEW PLAYER GIFT ====================

function createStarterPet(name, race, rarity) {
  const rarityIdx = RARITIES.indexOf(rarity);
  const growthBase = 1.0 + rarityIdx * 0.3;
  const growth = Math.round(growthBase * 100) / 100;
  // 资质系统：按宠物类型图鉴范围生成
  var dex = getPetDex(name);
  const aptitude = {};
  APTITUDE_KEYS.forEach(function(k) {
    var range = dex.aptRange[k] || [1200, 1800];
    aptitude[k] = randomInt(range[0], range[1]);
  });
  const bloodline = null; // 血统重构：运行时通过 getPetBloodlineSkill 动态查询
  // 技能生成——使用公共函数 generateInnateSkills（消除重复代码）
  var maxSkills = getPetMaxSkills(name);
  var innateSkills = generateInnateSkills(name, maxSkills);

  return {
    name, race, rarity, growth, aptitude, bloodline,
    innateSkills, learnedSkills: [], level: 1, moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    advanceStage: 0, advanceable: !!(dex.evolvable), advanceValue: 0, // 新进阶系统：可进阶宠物标记为 advanceable=true
    lifespan: randomInt(10000, 15000), // 初始寿命：10000~15000
    id: 'pet_' + Date.now() + '_' + randomInt(1000, 9999),
  };
}

function claimNewPlayerGift() {
  if (G.newPlayerGiftClaimed) return;

  // 需求10：新手礼包从T1中随机选1只防御类型放前排、1只伤害类放中排、1只辅助类放后排
  var t1Names = PET_NAMES.filter(function(name) {
    return getPetTier(name) === 1;
  });
  var defPets = t1Names.filter(function(name) {
    var dex = getPetDex(name);
    return dex.specialty === 'defense';
  });
  var dmgPets = t1Names.filter(function(name) {
    var dex = getPetDex(name);
    return dex.specialty === 'physical' || dex.specialty === 'speed';
  });
  var supPets = t1Names.filter(function(name) {
    var dex = getPetDex(name);
    return dex.specialty === 'magic';
  });
  // 兜底：如果某类型为空，从所有T1中选
  if (defPets.length === 0) defPets = t1Names.slice();
  if (dmgPets.length === 0) dmgPets = t1Names.filter(function(name) {
    return defPets.indexOf(name) < 0;
  });
  if (supPets.length === 0) supPets = t1Names.filter(function(name) {
    return defPets.indexOf(name) < 0 && dmgPets.indexOf(name) < 0;
  });
  if (dmgPets.length === 0) dmgPets = t1Names.slice();
  if (supPets.length === 0) supPets = t1Names.slice();

  var defName = pickRandom(defPets);
  var dmgName = pickRandom(dmgPets.filter(function(n) { return n !== defName; }));
  if (!dmgName) dmgName = pickRandom(dmgPets);
  var supName = pickRandom(supPets.filter(function(n) { return n !== defName && n !== dmgName; }));
  if (!supName) supName = pickRandom(supPets);

  var defDex = getPetDex(defName);
  var dmgDex = getPetDex(dmgName);
  var supDex = getPetDex(supName);

  const starter1 = createStarterPet(defName, defDex.race, 'uncommon'); // 防御型→前排
  const starter2 = createStarterPet(dmgName, dmgDex.race, 'uncommon'); // 伤害型→中排
  const starter3 = createStarterPet(supName, supDex.race, 'uncommon'); // 辅助型→后排

  starter1.level = G.player.level;
  starter2.level = G.player.level;
  starter3.level = G.player.level;

  G.pets.push(starter1, starter2, starter3);
  // 防御→前排(0), 伤害→中排(1), 辅助→后排(2)
  G.player.activeTeam = [starter1.id, starter2.id, starter3.id];
  G.player.formation = ['front', 'mid', 'back'];
  addDiamond(10);

  // 初始5个宠物蛋
  for (var i = 0; i < 5; i++) {
    G.eggs.push(generateEgg(randomInt(0, 1)));
  }

  // 需求2/3：新手礼包激活5个buff，统一120分钟，全属性+200，赠送5个孵化石
  activateBuff('all_stat', 200, 120);       // 全属性+200, 120分钟
  activateBuff('exp_mult', 2, 120);          // 双倍经验, 120分钟
  activateBuff('gold_mult', 2, 120);         // 双倍金币, 120分钟
  activateBuff('hatch_mult', 10, 120);       // 孵化速度10倍, 120分钟
  activateBuff('egg_drop_mult', 2, 120);     // 双倍蛋掉落, 120分钟
  // 需求3：赠送5个孵化石
  G.hatchStones = (G.hatchStones || 0) + 5;

  G.newPlayerGiftClaimed = true;
  saveGame();
  showToast('🎉 新手礼包已领取！获得防御型(' + defName + ')+伤害型(' + dmgName + ')+辅助型(' + supName + ')，5项增益已激活，开始冒险吧！', 'success');
  render();
}

