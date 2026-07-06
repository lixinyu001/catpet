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
    cultivation: { 力量: 0, 体质: 0, 敏捷: 0, 智力: 0 },
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
  redeemCodesUsed: [],
  hatchStones: 0,
  // 抽奖历史记录
  lotteryHistory: [],
  // 宝石系统：已镶嵌宝石按装备栏为键；宝石背包数组
  gems: { weapon: null, helmet: null, armor: null, pants: null, gloves: null, shoes: null },
  gemBag: [],
  // 宠物装备系统：宠物装备背包、材料背包（需求2：材料按低/中/高级分级；需求4：已移除兽皮）
  petEquipBag: [],
  petEquipMaterials: {
    mystic_crystal_low: 0, mystic_crystal_mid: 0, mystic_crystal_high: 0,
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
  // 进阶试炼每日使用记录（原 bloodlineTrialUsed，已重命名）
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
};

let G = JSON.parse(JSON.stringify(DEFAULT_STATE));

function saveGame() {
  // 删除存档时跳过所有自动保存
  if (window.__DELETING_SAVE__) return;
  try {
    G.lastSaveTime = Date.now();
    localStorage.setItem('shadow_era_save', JSON.stringify(G));
  } catch(e) {}
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
if (!G.player.cultivation) G.player.cultivation = { 力量: 0, 体质: 0, 敏捷: 0, 智力: 0 };
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
      // 宠物装备系统迁移
      if (!G.petEquipBag || !Array.isArray(G.petEquipBag)) G.petEquipBag = [];
      if (!G.petEquipMaterials) G.petEquipMaterials = { mystic_crystal_low: 0, mystic_crystal_mid: 0, mystic_crystal_high: 0, ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
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
      // 确保新材料字段都存在
      ['mystic_crystal_low','mystic_crystal_mid','mystic_crystal_high','ancient_rune_low','ancient_rune_mid','ancient_rune_high'].forEach(function(mid) {
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
      migratePetAttributes();
      migrateInnateSkills();
      migratePetAdvance(); // 需求3：宠物进阶字段迁移
      migrateGemSlots();
      restoreEquipmentAffixes();
      migrateTreasureMaps();
      migratePetRarity();
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
    // 注意：不再截断为 1 个技能。createStarterPet 和 generatePetBase 都会生成多技能宠物，
    // 旧版迁移逻辑会在每次加载时丢失玩家合法获得的多技能。
    // 仅修复旧存档中可能存在的 isInnate 标记缺失。
    pet.innateSkills.forEach(function(s) {
      if (s && s.isInnate === undefined) s.isInnate = true;
    });
  });
}

// 需求3：宠物进阶字段迁移 - 旧存档宠物补充 advanceValue/advanceStage/advanceable 字段
function migratePetAdvance() {
  if (!G.pets || !Array.isArray(G.pets)) return;
  if (typeof PET_ADVANCE_CHAINS === 'undefined') return;
  G.pets.forEach(function(pet) {
    if (!pet || !pet.name) return;
    if (pet.advanceValue === undefined) pet.advanceValue = 0;
    if (pet.advanceStage === undefined) pet.advanceStage = 0;
    // 需求2：T3 mid 宠物可直接孵化（无幼年体），单次进阶 mid → top
    // 重新计算 advanceable：仅 mid 名可进阶；base 不再可进阶；top 已是最终形态
    var isMid = PET_ADVANCE_CHAINS.some(function(c) { return c.mid === pet.name; });
    var isTop = PET_ADVANCE_CHAINS.some(function(c) { return c.top === pet.name; });
    pet.advanceable = isMid;
    if (isTop) pet.advanceStage = 2;
    else if (isMid) {
      // mid 宠物：保留旧 advanceStage（1=从 base 进阶而来）或 0（孵化获得）
      if (pet.advanceStage > 2) pet.advanceStage = 0;
    } else {
      pet.advanceStage = 0;
    }
  });
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
    if (a.智力 === undefined) a.智力 = randomInt(10, 25);
    // 重算衍生属性
    a.气血 = a.体质 * 5 + randomInt(20, 40);
    a.法力 = a.智力 * 3 + randomInt(10, 25);
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
    'digDailyUsed'
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
  const bloodline = BLOODLINE_SKILLS.find(b => b.race === race);
  // 使用技能库系统（新手宠物从技能库随机获得1~满技能）
  var maxSkills = getPetMaxSkills(name);
  var skillLibIds = getPetSkillLib(name);
  var innateSkills = [];
  var usedBaseIds = new Set();
  // 天生技能必带
  if (dex.innateSkills && dex.innateSkills.length > 0) {
    dex.innateSkills.forEach(function(sid) {
      var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
      if (sk && !usedBaseIds.has(getSkillBaseId(sid))) {
        innateSkills.push({ ...sk, isInnate: true });
        usedBaseIds.add(getSkillBaseId(sid));
      }
    });
  }
  var availableLib = skillLibIds.map(function(id){ return ALL_SKILLS.find(function(s){ return s.id === id; }); })
    .filter(function(s){ return s && !usedBaseIds.has(getSkillBaseId(s.id)); });
  var totalSkills = randomInt(Math.max(1, innateSkills.length), maxSkills);
  var extraCount = totalSkills - innateSkills.length;
  for (var i = 0; i < extraCount && availableLib.length > 0; i++) {
    var idx = randomInt(0, availableLib.length - 1);
    var sk = availableLib.splice(idx, 1)[0];
    innateSkills.push({ ...sk, isInnate: true });
    usedBaseIds.add(getSkillBaseId(sk.id));
  }

  return {
    name, race, rarity, growth, aptitude, bloodline,
    innateSkills, learnedSkills: [], level: 1, moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    advanceValue: 0, advanceStage: 0, advanceable: false,
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

  const starter1 = createStarterPet(defName, defDex.race, 'common'); // 防御型→前排
  const starter2 = createStarterPet(dmgName, dmgDex.race, 'common'); // 伤害型→中排
  const starter3 = createStarterPet(supName, supDex.race, 'common'); // 辅助型→后排

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

