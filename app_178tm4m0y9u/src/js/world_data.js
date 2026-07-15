﻿// ===== world_data.js : 地图、怪物、物品、副本、装备、符文等世界数据（从config.js拆分） =====


// v3.1.0 需求3.1：11张主线地图按每10级一张标准划分，依次对应10/20/30...110级
const MAPS = [
  { id: 1, name: '起源草地', minLv: 1, maxLv: 10, monsters: ['草地史莱姆', '小野兔', '蝴蝶妖'], eliteName: '巨角野兔', bossName: '草原因子', layers: 10 },
  { id: 2, name: '新手森林', minLv: 11, maxLv: 20, monsters: ['森林史莱姆', '野狼', '巨型蜘蛛'], eliteName: '森林巨狼', bossName: '树精之王', layers: 10 },
  { id: 3, name: '幽暗矿洞', minLv: 21, maxLv: 30, monsters: ['矿洞蝙蝠', '岩石傀儡', '暗影矿工'], eliteName: '矿洞巨魔', bossName: '暗影矿主', layers: 10 },
  { id: 4, name: '亡灵墓地', minLv: 31, maxLv: 40, monsters: ['骷髅战士', '幽灵', '亡灵法师'], eliteName: '死亡骑士', bossName: '巫妖之王', layers: 10 },
  { id: 5, name: '烈焰火山', minLv: 41, maxLv: 50, monsters: ['火焰蜥蜴', '熔岩元素', '火龙幼崽'], eliteName: '熔岩巨人', bossName: '炎魔领主', layers: 10 },
  { id: 6, name: '冰霜高原', minLv: 51, maxLv: 60, monsters: ['冰霜巨魔', '雪狼', '冰晶凤凰'], eliteName: '冰霜巨人', bossName: '冰龙女王', layers: 10 },
  { id: 7, name: '暗影沼泽', minLv: 61, maxLv: 70, monsters: ['沼泽巨鳄', '毒雾花', '暗影蛇'], eliteName: '沼泽九头蛇', bossName: '暗影之主', layers: 10 },
  { id: 8, name: '天空之城', minLv: 71, maxLv: 80, monsters: ['云中守卫', '风暴鹰', '天使哨兵'], eliteName: '大天使长', bossName: '天空之神', layers: 10 },
  { id: 9, name: '深渊裂隙', minLv: 81, maxLv: 90, monsters: ['深渊恶魔', '虚空行者', '混沌之眼'], eliteName: '深渊领主', bossName: '混沌魔王', layers: 10 },
  { id: 10, name: '龙之巢穴', minLv: 91, maxLv: 100, monsters: ['远古巨龙', '龙人守卫', '龙蛋守护者'], eliteName: '上古龙卫', bossName: '万龙之祖', layers: 10 },
  { id: 11, name: '终焉神殿', minLv: 101, maxLv: 110, monsters: ['堕落天使', '末日使者', '创世神卫'], eliteName: '终焉使者', bossName: '创世神', layers: 10 },
];

// ==================== 怪物种族技能组合 ====================
// 任务16：怪现在和宠物一样有种族，每种种族有标准"满技能状态"
// mob=3主动+2被动，elite=4主动+2被动，boss=5主动+3被动（在 MAP_BOSSES 中单独配置）
const MONSTER_RACE_SKILLS = {
  '龙': {
    mob:   { active: ['flame_strike', 'thunder_strike', 'fatal_blow'], passive: ['power_up', 'crit_strike'] },
    elite: { active: ['flame_strike', 'fatal_blow', 'meteor', 'double_slash'], passive: ['power_up_2', 'vampire'] },
  },
  '史莱姆': {
    mob:   { active: ['iron_wall', 'guard_shield', 'flame_strike'], passive: ['def_up', 'regen'] },
    elite: { active: ['iron_wall', 'guard_shield', 'counter_stance', 'thorn_shield'], passive: ['def_up_2', 'parry'] },
  },
  '哥布林': {
    mob:   { active: ['sneak_atk', 'poison_fang', 'poison_mist'], passive: ['sneak_atk', 'dodge'] },
    elite: { active: ['sneak_atk', 'poison_fang', 'poison_mist', 'entangle'], passive: ['sneak_atk_2', 'poison_atk'] },
  },
  '天使': {
    mob:   { active: ['thunder_strike', 'stun_strike', 'holy_light'], passive: ['speed_up', 'lucky'] },
    elite: { active: ['thunder_strike', 'stun_strike', 'holy_light', 'haste'], passive: ['speed_up_2', 'magic_heart'] },
  },
  '精灵': {
    mob:   { active: ['ice_arrow', 'freeze', 'cure'], passive: ['magic_heart', 'regen'] },
    elite: { active: ['ice_arrow', 'freeze', 'blizzard', 'cure'], passive: ['magic_heart_2', 'magic_double'] },
  },
  '恶魔': {
    mob:   { active: ['shadow_strike', 'blood_drain', 'silence'], passive: ['vampire', 'magic_heart'] },
    elite: { active: ['shadow_strike', 'doom_judge', 'blood_drain', 'silence'], passive: ['vampire_2', 'magic_heart_2'] },
  },
};

// 不同地图出现的怪物种族池（小怪/精英）
const MAP_MONSTER_RACES = {
  1:  ['史莱姆', '哥布林'],   // 起源草地
  2:  ['精灵', '哥布林'],     // 新手森林
  3:  ['史莱姆', '哥布林'],   // 幽暗矿洞
  4:  ['恶魔', '史莱姆'],     // 亡灵墓地
  5:  ['龙', '恶魔'],         // 烈焰火山
  6:  ['龙', '天使'],         // 冰霜高原
  7:  ['恶魔', '哥布林'],     // 暗影沼泽
  8:  ['天使', '龙'],         // 天空之城
  9:  ['恶魔', '精灵'],       // 深渊裂隙
  10: ['龙', '恶魔'],         // 龙之巢穴
  11: ['恶魔', '龙'],         // 终焉神殿
};

// ==================== 需求2：主线野怪池（T1-T4宠物按等级梯度分配） ====================
// 11张主线地图分4个等级段：低(1-3)=T1, 中低(4-6)=T1-T2, 中高(7-9)=T2-T3, 高(10-11)=T3-T4
// T5/融合怪/神兽不进入主线野怪池
var _mapMonsterPoolCache = {};
function getMapMonsterPool(mapId) {
  if (_mapMonsterPoolCache[mapId]) return _mapMonsterPoolCache[mapId];
  // 确定该地图的T级范围
  var tierMin, tierMax;
  if (mapId <= 3) { tierMin = 1; tierMax = 1; }       // 低阶段：T1
  else if (mapId <= 6) { tierMin = 1; tierMax = 2; }   // 中低阶段：T1-T2
  else if (mapId <= 9) { tierMin = 2; tierMax = 3; }   // 中高阶段：T2-T3
  else { tierMin = 3; tierMax = 4; }                    // 高阶段：T3-T4
  // 从PET_NAMES中筛选符合条件的宠物
  var pool = [];
  for (var i = 0; i < PET_NAMES.length; i++) {
    var name = PET_NAMES[i];
    var dex = getPetDex(name);
    if (!dex) continue;
    // 排除融合限定、神兽
    if (dex.fusionOnly) continue;
    if (dex.isDivineBeast) continue;
    if (dex.forceTier && dex.forceTier >= 5) continue;
    var tier = getPetTier(name);
    if (tier < tierMin || tier > tierMax) continue;
    pool.push(name);
  }
  // 兜底：如果池为空，使用所有T1宠物
  if (pool.length === 0) {
    for (var j = 0; j < PET_NAMES.length; j++) {
      var n = PET_NAMES[j];
      var d = getPetDex(n);
      if (!d || d.fusionOnly || d.isDivineBeast) continue;
      if (getPetTier(n) === 1) pool.push(n);
    }
  }
  _mapMonsterPoolCache[mapId] = pool;
  return pool;
}

// ==================== 每个地图固定Boss设计（任务16） ====================
// 每个boss有：固定名称、race、5主动+3被动技能组合、buff列表、独特战利品
// buff 字段含义：atk=攻击力加成, def=防御力加成, spd=速度加成, all=全属性加成, reflect=反伤比例
const MAP_BOSSES = {
  1: { // 起源草地 - 草原因子（史莱姆王）：高防御+反伤buff
    name: '草原因子', race: '史莱姆',
    skills: ['iron_wall', 'guard_shield', 'counter_stance', 'poison_mist', 'thorn_shield'],
    passives: ['def_up_3', 'regen_2', 'parry_2'],
    buffs: { atk: 0.10, def: 0.50, all: 0.10, reflect: 0.30 },
    loot: [],
  },
  2: { // 新手森林 - 树精之王（精灵）：控制+治疗
    name: '树精之王', race: '精灵',
    skills: ['entangle', 'poison_mist', 'cure', 'life_bloom', 'heal_wind'],
    passives: ['regen_2', 'magic_heart_2', 'lucky'],
    buffs: { atk: 0.20, def: 0.30, all: 0.15 },
    loot: [],
  },
  3: { // 幽暗矿洞 - 暗影矿主（哥布林）：高速+毒控
    name: '暗影矿主', race: '哥布林',
    skills: ['sneak_atk', 'poison_fang', 'silence', 'entangle', 'earthquake'],
    passives: ['sneak_atk_2', 'dodge_2', 'poison_atk'],
    buffs: { atk: 0.40, spd: 0.30, all: 0.10 },
    loot: ['exp_ticket'],
  },
  4: { // 亡灵墓地 - 巫妖之王（恶魔）：法术爆发+控制
    name: '巫妖之王', race: '恶魔',
    skills: ['shadow_strike', 'doom_judge', 'silence', 'hypnosis', 'blizzard'],
    passives: ['magic_heart_2', 'vampire_2', 'lucky_2'],
    buffs: { atk: 0.50, def: 0.30, all: 0.20 },
    loot: ['gold_ticket'],
  },
  5: { // 烈焰火山 - 炎魔领主（火龙）：高攻击+燃烧buff
    name: '炎魔领主', race: '龙',
    skills: ['flame_strike', 'flame_storm', 'meteor', 'berserk', 'blood_drain'],
    passives: ['power_up_2', 'crit_strike_2', 'vampire_2'],
    buffs: { atk: 0.50, def: 0.20, all: 0.15 },
    loot: ['egg_ticket'],
  },
  6: { // 冰霜高原 - 冰龙女王（龙）：冰冻控制+防御
    name: '冰龙女王', race: '龙',
    skills: ['ice_arrow', 'freeze', 'blizzard', 'mass_freeze', 'iron_wall'],
    passives: ['magic_heart_2', 'def_up_2', 'regen_2'],
    buffs: { atk: 0.40, def: 0.40, all: 0.15 },
    loot: ['egg_ticket'],
  },
  7: { // 暗影沼泽 - 暗影之主（恶魔）：吸血+沉默
    name: '暗影之主', race: '恶魔',
    skills: ['shadow_strike', 'shadow_burst', 'silence', 'hypnosis', 'blood_drain'],
    passives: ['vampire_2', 'magic_heart_2', 'dodge_2'],
    buffs: { atk: 0.50, spd: 0.30, all: 0.20 },
    // v2.2.0 需求4：技能秘境门票已移除，改为掉落血统副本门票
    loot: ['blood_dungeon_ticket'],
  },
  8: { // 天空之城 - 天空之神（天使）：雷电+圣光
    name: '天空之神', race: '天使',
    skills: ['thunder_strike', 'lightning_chain', 'stun_strike', 'holy_radiance', 'blessing'],
    passives: ['speed_up_2', 'crit_strike_2', 'magic_heart_2'],
    buffs: { atk: 0.50, spd: 0.40, all: 0.25 },
    loot: ['forge_ticket'],
  },
  9: { // 深渊裂隙 - 混沌魔王（恶魔）：混沌法术+狂暴
    name: '混沌魔王', race: '恶魔',
    skills: ['doom_judge', 'meteor', 'shadow_burst', 'berserk', 'silence'],
    passives: ['magic_heart_3', 'vampire_2', 'crit_strike_2'],
    buffs: { atk: 0.60, def: 0.30, all: 0.30 },
    loot: ['map_ticket'],
  },
  10: { // 龙之巢穴 - 万龙之祖（龙）：物理爆发+穿透
    name: '万龙之祖', race: '龙',
    skills: ['fatal_blow', 'flame_storm', 'meteor', 'thunder_strike', 'berserk'],
    passives: ['power_up_3', 'crit_strike_2', 'penetration_2'],
    buffs: { atk: 0.70, def: 0.40, all: 0.30 },
    loot: ['gem_ticket'],
  },
  11: { // 终焉神殿 - 创世神（混沌恶魔）：全属性强化，终极boss
    name: '创世神', race: '恶魔',
    skills: ['doom_judge', 'meteor', 'freeze', 'holy_radiance', 'berserker_fury'],
    passives: ['magic_heart_3', 'vampire_3', 'crit_strike_3'],
    buffs: { atk: 0.80, def: 0.50, all: 0.40 },
    loot: ['guixu_pill'],
  },
};

const CHEST_RARITIES = [
  { id: 'white', name: '白色宝箱', color: '#c0c0c0', icon: '⬜', glow: 'chest-white' },
  { id: 'green', name: '绿色宝箱', color: '#22c55e', icon: '🟩', glow: 'chest-green' },
  { id: 'blue', name: '蓝色宝箱', color: '#3b82f6', icon: '🟦', glow: 'chest-blue' },
  { id: 'purple', name: '紫色宝箱', color: '#a855f7', icon: '🟪', glow: 'chest-purple' },
  { id: 'orange', name: '橙色宝箱', color: '#fb923c', icon: '🟧', glow: 'chest-orange' },
];

function getChestEmoji(rarity) {
  const map = { white: '📦', green: '🧰', blue: '🎁', purple: '💜', orange: '🧡' };
  return map[rarity] || '📦';
}

// ==================== 物品品质系统 ====================
// 低级：孵化石、低级强化石
// 中级：孵化加速器、融合石、所有门票、归元丹、宝石、中级强化石
// 高级：月华露、保底石、归虚丹、高级强化石
const ITEM_QUALITY = {
  low:  { name: '低级', weightMult: 1.0, color: '#9ca3af' },
  mid:  { name: '中级', weightMult: 0.6, color: '#3b82f6' },
  high: { name: '高级', weightMult: 0.3, color: '#a855f7' },
};

// 根据物品id获取品质
function getItemQualityById(id) {
  var lowItems = ['hatch_stone', 'forge_stone_low'];
  // v2.2.0 需求4：移除已废弃的 skill_ticket、pet_ticket，补充 blood_dungeon_ticket
  var midItems = ['hatch_boost', 'fusion_stone', 'exp_ticket', 'gold_ticket', 'egg_ticket', 'forge_ticket', 'map_ticket', 'gem_ticket', 'blood_dungeon_ticket', 'guiyuan_pill', 'forge_stone_mid'];
  var highItems = ['moon_dew', 'protection_stone', 'guixu_pill', 'forge_stone_high'];
  if (lowItems.indexOf(id) >= 0) return 'low';
  if (midItems.indexOf(id) >= 0) return 'mid';
  if (highItems.indexOf(id) >= 0) return 'high';
  if (id && id.indexOf('gem_') === 0) return 'mid';
  return 'mid';
}

// 获取宝箱内容的品质
function getChestContentQuality(content) {
  if (!content) return 'mid';
  if (content.type === 'gold') return 'low';
  if (content.type === 'diamond') return 'high';
  if (content.type === 'talent_point') return 'mid';
  if (content.type === 'egg') return content.tier >= 2 ? 'high' : 'mid';
  if (content.type === 'equipment') {
    if (content.equip && content.equip.rarity) {
      if (content.equip.rarity === 'white' || content.equip.rarity === 'green') return 'low';
      if (content.equip.rarity === 'blue' || content.equip.rarity === 'purple') return 'mid';
      return 'high';
    }
    return 'mid';
  }
  if (content.type === 'skill_book') {
    if (content.book && content.book.tier) {
      if (content.book.tier === 1) return 'low';
      if (content.book.tier === 2) return 'mid';
      return 'high';
    }
    return 'mid';
  }
  if (content.type === 'item') return getItemQualityById(content.id);
  return 'mid';
}

// 需求17：主线掉落梯度平衡辅助函数
// 地图分段：低阶段(1-3)/中低阶段(4-6)/中高阶段(7-9)/高阶段(10-11)
function getMapSegment(mapId) {
  if (mapId <= 3) return 'low';        // 低阶段
  if (mapId <= 6) return 'mid_low';    // 中低阶段
  if (mapId <= 9) return 'mid_high';   // 中高阶段
  return 'high';                        // 高阶段
}
// 各分段装备品质上限：低/中低=蓝, 中高=紫, 高=橙
function getMapSegmentEquipCap(segment) {
  var caps = { low: 'blue', mid_low: 'blue', mid_high: 'purple', high: 'orange' };
  return caps[segment] || 'blue';
}
// 各分段技能书tier上限：低=1, 中低/中高/高=2（超级tier3主线全地图零掉落）
function getMapSegmentSkillTierMax(segment) {
  if (segment === 'low') return 1;
  return 2;
}
// v3.1.0 需求3.2：关卡推进式解锁——第1张地图默认开放，后续地图需通关前一张且玩家等级达标
function isMapUnlocked(mapId) {
  if (mapId <= 1) return true;
  var map = MAPS.find(function(m) { return m.id === mapId; });
  if (!map) return false;
  // 等级门槛：玩家等级 >= 该地图 minLv
  if (G.player.level < map.minLv) return false;
  // 关卡推进：前一张地图必须已通关
  var prevProg = G.mapProgress && G.mapProgress[mapId - 1];
  return !!(prevProg && prevProg.phase === 'cleared');
}
// 统计已通关主线地图数量
function countClearedMaps() {
  if (!G.mapProgress) return 0;
  var cnt = 0;
  for (var i = 1; i <= 11; i++) {
    if (G.mapProgress[i] && G.mapProgress[i].phase === 'cleared') cnt++;
  }
  return cnt;
}
// 新手保护：通关地图<3时，转盘/掉落屏蔽T3及以上阶位道具
function isNewbieProtected() {
  return countClearedMaps() < 3;
}
// 蛋阶位：绑定地图等级 + 新手保护
function getDropEggTier() {
  var tier = getEggTierByMapLevel();
  // T5阶蛋(tier>=4)主线不掉落
  if (tier > 3) tier = 3;
  // 新手保护：屏蔽T3及以上阶位蛋
  if (isNewbieProtected() && tier >= 2) tier = 1;
  return tier;
}
// 装备品质上限过滤
function capEquipRarity(rarity, segment) {
  var cap = getMapSegmentEquipCap(segment);
  var order = ['white','green','blue','purple','orange'];
  var capIdx = order.indexOf(cap);
  var rIdx = order.indexOf(rarity);
  if (rIdx > capIdx) return cap;
  return rarity;
}
// 技能书池：按地图分段过滤tier，排除超级技能书(tier3)
function getSkillBookPool(segment, includeAura) {
  var tierMax = getMapSegmentSkillTierMax(segment);
  var pool = PASSIVE_SKILLS.filter(function(s) { return s.tier <= tierMax; });
  if (includeAura) {
    pool = pool.concat(AURA_SKILLS.filter(function(s) { return s.tier <= tierMax; }));
  }
  // 新手保护：屏蔽T3+道具时仅保留tier1
  if (isNewbieProtected()) {
    pool = pool.filter(function(s) { return s.tier === 1; });
  }
  return pool.length > 0 ? pool : PASSIVE_SKILLS.filter(function(s) { return s.tier === 1; });
}

function generateChestContents(rarity) {
  const map = MAPS.find(m => m.id === G.player.currentMap);
  const lv = map ? randomInt(map.minLv, map.maxLv) : G.player.level;
  var mapId = map ? map.id : 1;
  var segment = getMapSegment(mapId);
  // 需求3：蛋掉落概率提升50%（权重上调）
  // 需求17：主线掉落全量梯度管控——蛋/技能书/装备阶位严格与地图难度绑定
  // 超级技能书(tier3)、T5蛋主线全地图零掉落
  // v2.7.0 需求2.1：移除直接金币，替换为金币箱（仅紫色+宝箱产出）
  // v2.7.0 需求2.2：宝石等级按地图等级控制（低=1级，中低/中高=1-2级，高=2-3级）
  // v2.7.0 需求2.3：紫色+宝箱新增养成道具（归元丹/归墟丹/炼化精魄/延寿丹）
  // v2.7.0 需求2.4：移除月华露常规掉落，仅保留秘藏等专属渠道
  // v2.9.0 需求1.1：宝石类型对齐五维，移除 hp/mp
  var _gemTypes = ['vit','str','agi','end','mag'];
  var _ticketPool = ['exp_ticket','gold_ticket','egg_ticket','forge_ticket','map_ticket','gem_ticket','blood_dungeon_ticket'];
  var _fragmentPool = ['treasure_fragment_1','treasure_fragment_2','treasure_fragment_3','treasure_fragment_4','treasure_fragment_5'];

  // v2.7.0 需求2.2：按地图等级区间匹配宝石等级
  function _getGemLevelRange(segment) {
    if (segment === 'low') return { min: 1, max: 1 };       // 低等级地图：仅1级宝石
    if (segment === 'mid_low') return { min: 1, max: 2 };   // 中低等级：1-2级
    if (segment === 'mid_high') return { min: 1, max: 2 };  // 中高等级：1-2级
    return { min: 2, max: 3 };                                // 高等级：2-3级
  }
  function _genGem(){
    var gt = _gemTypes[randomInt(0,_gemTypes.length-1)];
    var range = _getGemLevelRange(segment);
    var gemLv = randomInt(range.min, range.max);
    return { type: 'item', id: 'gem_'+gt+'_'+gemLv, amount: 1, name: GEM_TYPES.find(function(g){return g.id===gt;}).name+'+'+gemLv };
  }
  function _genTicket(){ var tid = _ticketPool[randomInt(0,_ticketPool.length-1)]; return { type: 'item', id: tid, amount: 1, name: getItemName(tid) }; }
  function _genEgg(tierMin) {
    var t = getDropEggTier();
    if (tierMin !== undefined && t < tierMin) t = tierMin;
    return { type: 'egg', tier: t, name: '宠物蛋' };
  }
  function _genEquip(baseRarity) {
    var r = capEquipRarity(baseRarity, segment);
    var names = { white:'白色装备', green:'绿色装备', blue:'蓝色装备', purple:'紫色装备', orange:'橙色装备' };
    return { type: 'equipment', equip: generateEquipment(r, lv), name: names[r] || '装备' };
  }
  function _genSkillBook(includeAura, label) {
    var pool = getSkillBookPool(segment, includeAura);
    return { type: 'skill_book', book: pickRandom(pool), name: label || '技能书' };
  }
  // v2.7.0 需求2.1：金币箱按地图等级区间匹配档位
  function _genGoldChest() {
    if (segment === 'low') return { type: 'item', id: 'gold_chest_small', amount: 1, name: '小金币箱' };
    if (segment === 'mid_low' || segment === 'mid_high') return { type: 'item', id: 'gold_chest_mid', amount: 1, name: '中金币箱' };
    return { type: 'item', id: 'gold_chest_large', amount: 1, name: '大金币箱' };
  }
  // v2.7.0 需求3.1：密藏碎片随机掉落
  function _genFragment() {
    var fid = _fragmentPool[randomInt(0, _fragmentPool.length - 1)];
    return { type: 'item', id: fid, amount: 1, name: getItemName(fid) };
  }
  var pools = {
    // v3.x 需求3.4：提升装备类掉落概率，降低孵化加速器概率（同比例调整）
    white: [
      { w: 13, quality: 'mid',  gen: function(){ return { type: 'item', id: 'hatch_boost', amount: 1, name: '孵化加速器' }; } },
      { w: 25, quality: 'low',  gen: function(){ return _genEquip('white'); } },
      { w: 15, quality: 'low',  gen: function(){ return _genSkillBook(false, '初级被动技能书'); } },
      { w: 15, quality: 'mid',  gen: _genGem },
      { w: 12, quality: 'mid',  gen: _genTicket },
      { w: 10, quality: 'low',  gen: function(){ return { type: 'item', id: 'forge_stone_low', amount: 1, name: '低级强化石' }; } },
      { w: 10, quality: 'high', gen: _genFragment },
    ],
    green: [
      { w: 20, quality: 'low',  gen: function(){ return _genEquip('green'); } },
      { w: 18, quality: 'mid',  gen: _genGem },
      { w: 15, quality: 'mid',  gen: _genTicket },
      { w: 14, quality: 'low',  gen: function(){ return { type: 'item', id: 'forge_stone_low', amount: randomInt(1, 2), name: '低级强化石' }; } },
      { w: 18, quality: 'mid',  gen: function(){ return _genEgg(); } },
      { w: 10, quality: 'low',  gen: function(){ return _genSkillBook(false, '初级被动技能书'); } },
      { w: 5,  quality: 'high', gen: _genFragment },
    ],
    blue: [
      { w: 22, quality: 'mid',  gen: function(){ return _genEquip('blue'); } },
      { w: 18, quality: 'mid',  gen: _genGem },
      { w: 15, quality: 'mid',  gen: _genTicket },
      { w: 16, quality: 'mid',  gen: function(){ return _genSkillBook(false, '技能书'); } },
      { w: 18, quality: 'mid',  gen: function(){ return _genEgg(); } },
      { w: 11, quality: 'mid',  gen: function(){ return { type: 'item', id: 'forge_stone_mid', amount: 1, name: '中级强化石' }; } },
    ],
    purple: [
      { w: 18, quality: 'high', gen: _genGoldChest },
      { w: 20, quality: 'high', gen: function(){ return _genEgg(); } },
      { w: 12, quality: 'mid',  gen: function(){ return _genEquip('purple'); } },
      { w: 10, quality: 'mid',  gen: _genGem },
      { w: 8,  quality: 'mid',  gen: _genTicket },
      { w: 10, quality: 'high', gen: function(){ return _genSkillBook(true, '高级技能书'); } },
      { w: 6,  quality: 'high', gen: function(){ return { type: 'diamond', amount: randomInt(5, 20), name: '钻石' }; } },
      { w: 5,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'guiyuan_pill', amount: 1, name: '归元丹' }; } },
      { w: 5,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'refine_essence', amount: 1, name: '炼化精魄' }; } },
      { w: 4,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'lifespan_low', amount: 1, name: '低级延寿丹' }; } },
      { w: 2,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'forge_stone_mid', amount: randomInt(1, 2), name: '中级强化石' }; } },
    ],
    orange: [
      { w: 16, quality: 'high', gen: _genGoldChest },
      { w: 20, quality: 'high', gen: function(){ return _genEgg(2); } },
      { w: 10, quality: 'mid',  gen: _genGem },
      { w: 8,  quality: 'mid',  gen: _genTicket },
      { w: 12, quality: 'high', gen: function(){ return _genEquip('orange'); } },
      { w: 10, quality: 'high', gen: function(){ return _genSkillBook(true, '高级技能书'); } },
      { w: 8,  quality: 'high', gen: function(){ return { type: 'diamond', amount: randomInt(20, 50), name: '钻石' }; } },
      { w: 5,  quality: 'high', gen: function(){ return { type: 'item', id: 'guixu_pill', amount: 1, name: '归墟丹' }; } },
      { w: 4,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'refine_essence', amount: randomInt(1, 2), name: '炼化精魄' }; } },
      { w: 3,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'lifespan_mid', amount: 1, name: '中级延寿丹' }; } },
      { w: 4,  quality: 'high', gen: function(){ return { type: 'item', id: 'forge_stone_high', amount: randomInt(1, 2), name: '高级强化石' }; } },
      // v2.9.0 需求2.3：传奇宝箱新增宠物洗点丹
      { w: 4,  quality: 'high', gen: function(){ return { type: 'item', id: 'pet_reset_pill', amount: 1, name: '宠物洗点丹' }; } },
    ],
  };
  var pool = pools[rarity] || pools.white;
  // 计算有效权重：高品质物品权重更低（出现概率更低）
  var totalW = pool.reduce(function(s, p){
    var q = p.quality || 'mid';
    var mult = ITEM_QUALITY[q] ? ITEM_QUALITY[q].weightMult : 1.0;
    return s + p.w * mult;
  }, 0);
  var roll = Math.random() * totalW;
  var acc = 0;
  for (var i = 0; i < pool.length; i++) {
    var q = pool[i].quality || 'mid';
    var mult = ITEM_QUALITY[q] ? ITEM_QUALITY[q].weightMult : 1.0;
    acc += pool[i].w * mult;
    if (roll < acc) return [pool[i].gen()];
  }
  return [pool[pool.length - 1].gen()];
}

// 宝箱基础掉落率（受天赋加成）
function getChestDropRate(enemyType) {
  var base = enemyType === 'boss' ? 0.20 : enemyType === 'elite' ? 0.10 : 0.05;
  return base * (1 + getTalentBonus('chest_drop') + getTalentBonus('loot_mastery'));
}

function dropChests(enemyType) {
  const chests = [];
  var dropRate = getChestDropRate(enemyType);
  if (Math.random() > dropRate) return chests; // 未掉落
  if (enemyType === 'mob') {
    const roll = Math.random();
    const rarity = roll < 0.8 ? 'white' : 'green';
    chests.push({ id: 'chest_' + Date.now() + '_' + randomInt(1000, 9999), rarity, contents: generateChestContents(rarity), opened: false });
  } else if (enemyType === 'elite') {
    const roll = Math.random();
    let rarity;
    if (roll < 0.5) rarity = 'green';
    else if (roll < 0.9) rarity = 'blue';
    else rarity = 'purple';
    const count = randomInt(1, 2);
    for (let i = 0; i < count; i++) {
      chests.push({ id: 'chest_' + Date.now() + '_' + i + '_' + randomInt(1000, 9999), rarity, contents: generateChestContents(rarity), opened: false });
    }
  } else if (enemyType === 'boss') {
    const roll = Math.random();
    const rarity = roll < 0.7 ? 'purple' : 'orange';
    // 修复：boss固定掉落1个宝箱（原来2~3个是bug）
    chests.push({ id: 'chest_' + Date.now() + '_' + randomInt(1000, 9999), rarity, contents: generateChestContents(rarity), opened: false });
  }
  return chests;
}

function maybeDropTreasureMap() {
  if (G.player.level < 60) return;
  // 应用藏宝图掉落率天赋
  var mapBonus = getTalentBonus('map_drop') + getTalentBonus('loot_mastery');
  const roll = Math.random();
  let rarity = null;
  // 需求4：打宝图概率提高到40%（white 15% + green 10% + blue 15% = 40%）
  if (roll < 0.15 * (1 + mapBonus)) rarity = 'white';
  else if (roll < 0.25 * (1 + mapBonus)) rarity = 'green';
  else if (roll < 0.40 * (1 + mapBonus)) rarity = 'blue';
  if (rarity) {
    if (!G.treasureMaps) G.treasureMaps = [];
    G.treasureMaps.push(generateTreasureMap(rarity));
    addBattleLog('loot', `🗺️ 获得 ${TREASURE_MAP_RARITIES.find(r=>r.id===rarity).name}！`);
  }
}

// 战斗掉落：基于天赋的额外掉落（装备/宝石/打孔钉/修补胶）
// 需求1：主线掉落移除融合石和孵化石（融合石仅由融合页消耗、孵化石仅由商城/活动获取）
// 在 processBattleRewardsLive 中调用
function maybeDropTalentLoot(enemyType) {
  var isBoss = enemyType === 'boss';
  var isElite = enemyType === 'elite';
  var lootMastery = getTalentBonus('loot_mastery');
  // 装备掉落
  var equipChance = getTalentBonus('equip_drop') + lootMastery * 0.5;
  if (isBoss) equipChance += 0.30;
  else if (isElite) equipChance += 0.10;
  if (Math.random() < equipChance) {
    var pl = G.player.level;
    var rarity = Math.random() < 0.05 ? 'orange' : Math.random() < 0.2 ? 'purple' : Math.random() < 0.5 ? 'blue' : 'green';
    var equip = generateEquipment(rarity, pl);
    addEquipmentToBag(equip);
    addBattleLog('loot', `⚔️ 获得 ${EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(rarity)]} ${equip.name}`);
  }
// 需求4：主线掉落去除打孔钉/修补胶/宝石
// 这些道具改为只能通过活动/商城/打宝图/宠物秘境等途径获取
}

// 需求10：宠物炼化系统配置
// 炼化道具品级与成功率，后台可调整
var PET_REFINE_CONFIG = {
  // 炼化道具：低级炼化精魄（金币购买）和高级炼化晶石（钻石购买）
  items: {
    refine_essence: {
      name: '炼化精魄',
      quality: 'low',
      successRate: 0.50,  // 50%成功率
      desc: '低品质炼化材料，成功率50%',
    },
    refine_crystal: {
      name: '炼化晶石',
      quality: 'high',
      successRate: 0.85,  // 85%成功率
      desc: '高品质炼化材料，成功率85%，推荐使用',
    },
  },
  // 全局开关：设置为false可一键关闭炼化功能
  enabled: true,
};

// 需求9：副本倍率掉落扩容配置
// 固定三档倍率：×3、×9、×27，后台独立配置概率
// 需求12：副本收益暴击概率提升50%（原0.05/0.01/0.002 → 0.075/0.015/0.003）
var DUNGEON_DROP_MULTIPLIER = {
  tiers: [
    { mult: 3,  chance: 0.075  }, // ×3  ：7.5%概率（原5%）
    { mult: 9,  chance: 0.015  }, // ×9  ：1.5%概率（原1%）
    { mult: 27, chance: 0.003  }, // ×27 ：0.3%概率（原0.2%）
  ],
};

const DUNGEONS = [
  { id: 'exp_cave', name: '经验洞穴', type: 'special', minLv: 30, desc: '通关获得大量人物经验（3~5波）', ticketItem: 'exp_ticket' },
  { id: 'gold_mine', name: '黄金矿洞', type: 'special', minLv: 20, desc: '通关获得大量金币（3~5波）', ticketItem: 'gold_ticket' },
  { id: 'egg_forest', name: '蛋之森林', type: 'special', minLv: 15, desc: '通关掉落T2+宠物蛋（3~5波）', ticketItem: 'egg_ticket' },
  // 需求6：技能秘境已移到活动页面（赚取技能书）
  { id: 'forge_mine', name: '强化石矿脉', type: 'special', minLv: 35, desc: '通关掉落2~4颗强化石（按等级分级，3~5波）', ticketItem: 'forge_ticket' },
  { id: 'treasure_ruin', name: '藏宝遗迹', type: 'special', minLv: 40, desc: '通关掉落1~2张藏宝图（3~5波）', ticketItem: 'map_ticket' },
  { id: 'gem_cavern', name: '宝石秘洞', type: 'special', minLv: 30, desc: '通关掉落1~3颗宝石（含天赋额外掉落，3~5波）', ticketItem: 'gem_ticket' },
  // 需求5：血统副本
  { id: 'bloodline_dungeon', name: '血统副本', type: 'special', minLv: 25, desc: '每波概率掉落血统珠，通关额外金币（3波，每日3次）', ticketItem: 'blood_dungeon_ticket' },
  // 需求12：宠物秘境已移到活动页面
];

// 特殊副本每日次数上限（默认3次）
// 需求5：血统副本每日3次；需求12：宠物秘境已移到活动页面（次数由活动管理）
const DUNGEON_DAILY_LIMITS = {
  bloodline_dungeon: 3,
};
function getDungeonDailyLimit(dungeonId) {
if (DUNGEON_DAILY_LIMITS && DUNGEON_DAILY_LIMITS[dungeonId] != null) return DUNGEON_DAILY_LIMITS[dungeonId];
return 3;
}

// ==================== 符文洞窟活动（原进化森林，v2.8.0重构） ====================
// v2.8.0 需求4.1：进化森林 → 符文洞窟，奖励池替换为符文材料 + 符文成品
// 参考阴阳师副本设计：5层固定难度，层数越高奖励越丰厚
// 每日限挑战50次，挑战成功发放奖励，挑战失败不扣除挑战次数
// 需配备独立的战斗界面
var EVOLUTION_FOREST_CONFIG = {
  id: 'evolution_forest',
  name: '符文洞窟',
  desc: '探索神秘的符文洞窟，挑战5层难度递增的关卡，可获得符文材料和成品符文。挑战失败不扣除次数，可反复尝试！',
  dailyLimit: 50,
  minLevel: 20,
  layers: [
    { layer: 1, name: '洞窟入口', level: 20,  icon: '🔮', monsterName: '洞窟史莱姆',   hpMult: 5,  atkMult: 4,  desc: '低难度，适合新手练手' },
    { layer: 2, name: '符文回廊', level: 40,  icon: '✨', monsterName: '符文哥布林',   hpMult: 8,  atkMult: 6,  desc: '中等难度，掉落中级符文材料' },
    { layer: 3, name: '远古祭坛', level: 60,  icon: '📜', monsterName: '远古守护者',   hpMult: 12, atkMult: 9,  desc: '较高难度，必掉中级符文材料' },
    { layer: 4, name: '深渊裂隙', level: 80,  icon: '🌑', monsterName: '深渊巨兽',     hpMult: 18, atkMult: 14, desc: '高难度，概率掉落高级符文材料' },
    { layer: 5, name: '符文圣殿', level: 100, icon: '💎', monsterName: '符文之灵',     hpMult: 28, atkMult: 22, desc: '最高难度，必掉高级符文材料+成品符文' },
  ],
  // v2.8.0 需求4.1：奖励池替换为符文材料 + 符文成品
  // runeLow/runeMid/runeHigh: 远古符文材料数量；runeDropRate: 成品符文掉落概率
  // v2.9.0 需求3.1：成品符文掉落率在原有基础上提升100%（翻倍）
  rewards: [
// layer 1: 低级符文材料×2~4, 10%概率中级材料×1, 11.5%掉成品符文(v3.x需求3.5:原10%提升15%)
{ layer: 1, runeLow: [2, 4], runeMid: { chance: 0.10, count: 1 }, runeHigh: null, runeDropRate: 0.115, gold: [500, 1500], exp: [200, 500] },
// layer 2: 低级符文材料×3~6, 30%概率中级材料×1, 18.4%掉成品符文(v3.x需求3.5:原16%提升15%)
{ layer: 2, runeLow: [3, 6], runeMid: { chance: 0.30, count: 1 }, runeHigh: null, runeDropRate: 0.184, gold: [1000, 3000], exp: [500, 1000] },
// layer 3: 必掉中级符文材料×1~2, 5%概率高级材料×1, 27.6%掉成品符文(v3.x需求3.5:原24%提升15%)
{ layer: 3, runeLow: [5, 8], runeMid: { chance: 1.00, count: 2 }, runeHigh: { chance: 0.05, count: 1 }, runeDropRate: 0.276, gold: [2000, 5000], exp: [1000, 2000] },
// layer 4: 必掉中级符文材料×2~3, 20%概率高级材料×1, 41.4%掉成品符文(v3.x需求3.5:原36%提升15%)
{ layer: 4, runeLow: [8, 12], runeMid: { chance: 1.00, count: 3 }, runeHigh: { chance: 0.20, count: 1 }, runeDropRate: 0.414, gold: [4000, 8000], exp: [2000, 4000] },
// layer 5: 必掉高级符文材料×1~2, 50%概率额外高级×1, 69%掉成品符文(v3.x需求3.5:原60%提升15%)
{ layer: 5, runeLow: [10, 15], runeMid: { chance: 1.00, count: 5 }, runeHigh: { chance: 0.80, count: 2 }, runeDropRate: 0.69, gold: [8000, 15000], exp: [4000, 8000] },
  ],
};

const TEAM_DUNGEONS = [
  { id: 'dragon_lair', name: '巨龙巢穴', bosses: ['火龙', '冰龙', '龙王'], rewards: ['dragon_scale', 'dragon_tooth', 'dragon_crystal'] },
  { id: 'demon_gate', name: '恶魔之门', bosses: ['小恶魔', '恶魔将军', '恶魔领主'], rewards: ['demon_horn', 'demon_heart', 'demon_contract'] },
  { id: 'ancient_ruins', name: '远古遗迹', bosses: ['石像守卫', '远古法师', '遗迹守护者'], rewards: ['ancient_coin', 'magic_book', 'artifact_shard'] },
];

// 需求10：精简核心日常任务到10项，移除边缘任务（宠物装备分解/打造、装备打孔、血统提取）
// 低频重时长玩法移入周常任务池，降低每日负担
const DAILY_TASKS = [
  { id: 'login', name: '每日登录', desc: '登录游戏', reward: { diamond: 10 }, target: 1 },
  { id: 'battle_10', name: '战斗达人', desc: '完成10场战斗', reward: { diamond: 20 }, target: 10 },
  { id: 'draw_10', name: '抽蛋爱好者', desc: '抽蛋10次', reward: { diamond: 15 }, target: 10 },
  { id: 'hatch_egg', name: '孵化师', desc: '孵化1个宠物蛋', reward: { diamond: 15 }, target: 1 },
  { id: 'forge_1', name: '锻造匠人', desc: '强化装备1次', reward: { diamond: 15 }, target: 1 },
  { id: 'gold_earn_5k', name: '财富日赚', desc: '当日累计获得5000金币', reward: { diamond: 10 }, target: 5000 },
  { id: 'skill_learn', name: '技能研习', desc: '学习1本技能书', reward: { diamond: 15 }, target: 1 },
  { id: 'dungeon_run', name: '副本勇士', desc: '完成1次副本', reward: { diamond: 30 }, target: 1 },
  { id: 'arena_3', name: '竞技斗士', desc: '竞技场挑战3次', reward: { diamond: 20 }, target: 3 },
  { id: 'market_trade', name: '商人', desc: '在市场进行1次交易', reward: { diamond: 10 }, target: 1 },
];

// 需求10：周常任务池 —— 低频、重时长的玩法，每周结算一次，奖励更丰厚
const WEEKLY_TASKS = [
  { id: 'tower_5', name: '爬塔先锋', desc: '本周爬塔15层', reward: { diamond: 100 }, target: 15 },
  { id: 'treasure_hunt', name: '寻宝猎人', desc: '本周完成3次打宝图', reward: { diamond: 80 }, target: 3 },
  { id: 'fuse_pet', name: '融合实验', desc: '本周进行3次宠物融合', reward: { diamond: 100 }, target: 3 },
  { id: 'formation_escort', name: '押镖勇士', desc: '本周参与3次押镖', reward: { diamond: 80 }, target: 3 },
  { id: 'skillbook_hunt', name: '技能秘境', desc: '本周参与3次技能秘境', reward: { diamond: 80 }, target: 3 },
  { id: 'petcave_1', name: '宠物秘境', desc: '本周参与3次宠物秘境', reward: { diamond: 100 }, target: 3 },
  { id: 'dispatch_finish', name: '派遣归来', desc: '本周完成3次派遣奇遇', reward: { diamond: 80 }, target: 3 },
  { id: 'fortress', name: '血色要塞', desc: '本周参与2次血色要塞', reward: { diamond: 100 }, target: 2 },
];

// ==================== 需求1：主线剧情任务链 ====================
// 按功能开启等级设置任务，引导新手了解各功能
// 当没有新功能开启时，任务为3种随机之一：击败敌人奖励经验/金币/孵化蛋奖励钻石
const MAIN_QUEST_CHAIN = [
  { level: 1,  type: 'tutorial', name: '初出茅庐', desc: '欢迎来到暗影纪元！击败5个敌人开始你的冒险', target: 5,  reward: { exp: 200, gold: 500 } },
  { level: 3,  type: 'tutorial', name: '宠物获取', desc: '通过抽蛋或孵化获得1只新宠物，扩充你的队伍', target: 1, reward: { exp: 300, gold: 800, diamond: 3 }, taskType: 'pet_acquire' },
  { level: 5,  type: 'feature',  name: '派遣奇遇', desc: '达到5级解锁竞技场活动，击败10个敌人', target: 10, reward: { exp: 500, gold: 1000, diamond: 5 } },
  { level: 8,  type: 'tutorial', name: '属性加点', desc: '为宠物分配1次自由属性点，提升战斗能力', target: 1, reward: { exp: 600, gold: 1200, diamond: 5 }, taskType: 'allocate_attr' },
  { level: 10, type: 'feature',  name: '金币矿洞', desc: '达到10级解锁金币副本，击败15个敌人', target: 15, reward: { exp: 800, gold: 2000, diamond: 5 } },
  { level: 15, type: 'feature',  name: '蛋之森林', desc: '达到15级解锁蛋副本，孵化1个宠物蛋', target: 1, reward: { exp: 1000, gold: 1500, diamond: 10 }, taskType: 'hatch' },
  { level: 18, type: 'tutorial', name: '装备穿戴', desc: '穿戴1件装备，增强你的战斗力', target: 1, reward: { exp: 1200, gold: 2000, diamond: 8 }, taskType: 'equip_weapon' },
  { level: 20, type: 'feature',  name: '锻造强化', desc: '达到20级解锁锻造强化功能，击败20个敌人', target: 20, reward: { exp: 1500, gold: 3000, diamond: 10 } },
  { level: 25, type: 'feature',  name: '宝石秘洞', desc: '达到25级解锁宝石功能和技能秘境，击败25个敌人', target: 25, reward: { exp: 2000, gold: 4000, diamond: 15 } },
  { level: 30, type: 'feature',  name: '阵法押镖', desc: '达到30级解锁阵法功能和押镖活动，击败30个敌人', target: 30, reward: { exp: 3000, gold: 5000, diamond: 15 } },
  { level: 35, type: 'feature',  name: '血统觉醒', desc: '达到35级解锁血统功能和血统副本，击败35个敌人', target: 35, reward: { exp: 4000, gold: 6000, diamond: 20 } },
  { level: 40, type: 'feature',  name: '宠物炼化', desc: '达到40级解锁宠物炼化功能，击败40个敌人', target: 40, reward: { exp: 5000, gold: 8000, diamond: 20 } },
  { level: 50, type: 'feature',  name: '藏宝装备', desc: '达到50级解锁藏宝图、宠物装备和符文系统，击败50个敌人', target: 50, reward: { exp: 8000, gold: 12000, diamond: 25 } },
  { level: 52, type: 'tutorial', name: '符文镶嵌', desc: '为宠物镶嵌1枚符文，获得强力属性加成', target: 1, reward: { exp: 9000, gold: 13000, diamond: 25 }, taskType: 'rune_equip' },
  { level: 55, type: 'tutorial', name: '天赋点亮', desc: '在天赋星图中点亮1个天赋节点，开启专精之路', target: 1, reward: { exp: 10000, gold: 15000, diamond: 30 }, taskType: 'talent_learn' },
  { level: 60, type: 'feature',  name: '宠物秘境', desc: '达到60级解锁宠物秘境，击败60个敌人', target: 60, reward: { exp: 12000, gold: 18000, diamond: 30 } },
  { level: 100,type: 'feature',  name: '转生之路', desc: '达到100级解锁转生功能，击败100个敌人', target: 100, reward: { exp: 50000, gold: 50000, diamond: 100 } },
];

// 随机日常任务模板（无新功能时使用）
// 需求5：10次为一轮循环，第1-9次为经验/金币任务，第10次固定为钻石任务
// 经验任务=击杀怪物，金币任务=分解装备，钻石任务=孵化蛋
const MAIN_QUEST_RANDOM_TEMPLATES = [
  { taskType: 'battle_exp',    name: '战斗历练', desc: '击败{N}个敌人，获得经验奖励', targets: [20, 30, 50], reward: { type: 'exp', base: 500, perKill: 50 } },
  { taskType: 'decompose_gold',name: '装备分解', desc: '分解{N}件装备，获得金币奖励', targets: [3, 5, 8], reward: { type: 'gold', base: 1000, perKill: 200 } },
  { taskType: 'hatch',         name: '孵化专家', desc: '孵化{N}个宠物蛋，获得钻石奖励', targets: [1, 2, 3], reward: { type: 'diamond', base: 3, perHatch: 2 } },
];

// 战令奖励按目前游戏设定重做（覆盖新材料/打孔钉/血统珠/活动门票等）
// 战令总50级，每级都有奖励；每5级为奖励大关
const BATTLE_PASS_REWARDS = [
  // 1-10级：基础起步
  { level: 1, free: { type: 'gold', amount: 1000 }, premium: { type: 'diamond', amount: 50 } },
  { level: 2, free: { type: 'item', id: 'forge_stone_low', amount: 3 }, premium: { type: 'item', id: 'mystic_crystal_low', amount: 2 } },
  { level: 3, free: { type: 'item', id: 'exp_ticket', amount: 2 }, premium: { type: 'item', id: 'egg_ticket', amount: 3 } },
  { level: 4, free: { type: 'gold', amount: 2000 }, premium: { type: 'item', id: 'forge_stone_mid', amount: 3 } },
  { level: 5, free: { type: 'item', id: 'forge_stone_low', amount: 5 }, premium: { type: 'item', id: 'mystic_crystal_mid', amount: 2 } },
  { level: 6, free: { type: 'gold', amount: 3000 }, premium: { type: 'item', id: 'forge_stone_mid', amount: 2 } },
  { level: 7, free: { type: 'item', id: 'exp_book', amount: 1 }, premium: { type: 'item', id: 'protection_stone', amount: 1 } },
  { level: 8, free: { type: 'gold', amount: 4000 }, premium: { type: 'item', id: 'socket_nail', amount: 2 } },
  { level: 9, free: { type: 'item', id: 'hatch_stone', amount: 1 }, premium: { type: 'item', id: 'forge_stone_mid', amount: 3 } },
  { level: 10, free: { type: 'gold', amount: 5000 }, premium: { type: 'diamond', amount: 100 } },
  // 11-20级：宠物装备&材料
  { level: 11, free: { type: 'item', id: 'forge_stone_low', amount: 5 }, premium: { type: 'item', id: 'war_book_low', amount: 3 } },
  { level: 12, free: { type: 'gold', amount: 6000 }, premium: { type: 'item', id: 'mystic_crystal_mid', amount: 3 } },
  { level: 13, free: { type: 'item', id: 'exp_book_mid', amount: 1 }, premium: { type: 'item', id: 'yuanxiao_str', amount: 1 } },
  { level: 14, free: { type: 'item', id: 'forge_stone_mid', amount: 4 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 1 } },
  { level: 15, free: { type: 'item', id: 'hatch_boost', amount: 3 }, premium: { type: 'item', id: 'hatch_boost', amount: 5 } },
  { level: 16, free: { type: 'gold', amount: 7000 }, premium: { type: 'item', id: 'socket_nail', amount: 3 } },
  { level: 17, free: { type: 'item', id: 'forge_stone_mid', amount: 2 }, premium: { type: 'item', id: 'forge_stone_high', amount: 2 } },
  { level: 18, free: { type: 'gold', amount: 8000 }, premium: { type: 'item', id: 'yuanxiao_con', amount: 1 } },
  { level: 19, free: { type: 'item', id: 'forge_stone_mid', amount: 2 }, premium: { type: 'item', id: 'blood_orb_low', amount: 2 } },
  { level: 20, free: { type: 'gold', amount: 10000 }, premium: { type: 'diamond', amount: 200 } },
  // 21-30级：技能&血统
  { level: 21, free: { type: 'item', id: 'mystic_crystal_low', amount: 6 }, premium: { type: 'item', id: 'war_book_mid', amount: 3 } },
  { level: 22, free: { type: 'gold', amount: 12000 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 2 } },
  { level: 23, free: { type: 'item', id: 'forge_stone_mid', amount: 3 }, premium: { type: 'item', id: 'forge_stone_high', amount: 3 } },
  { level: 24, free: { type: 'item', id: 'exp_book_mid', amount: 2 }, premium: { type: 'item', id: 'blood_orb_low', amount: 3 } },
  { level: 25, free: { type: 'item', id: 'egg_ticket', amount: 2 }, premium: { type: 'egg', tier: 3, amount: 1 } },
  { level: 26, free: { type: 'gold', amount: 14000 }, premium: { type: 'item', id: 'socket_nail', amount: 5 } },
  { level: 27, free: { type: 'item', id: 'blood_orb_low', amount: 2 }, premium: { type: 'item', id: 'blood_orb_mid', amount: 2 } },
  { level: 28, free: { type: 'gold', amount: 15000 }, premium: { type: 'item', id: 'protection_stone', amount: 2 } },
  { level: 29, free: { type: 'item', id: 'repair_glue', amount: 1 }, premium: { type: 'item', id: 'repair_glue', amount: 3 } },
  { level: 30, free: { type: 'gold', amount: 20000 }, premium: { type: 'diamond', amount: 500 } },
  // 31-40级：高级材料
  { level: 31, free: { type: 'item', id: 'forge_stone_high', amount: 1 }, premium: { type: 'item', id: 'forge_stone_high', amount: 3 } },
  { level: 32, free: { type: 'gold', amount: 22000 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 3 } },
  { level: 33, free: { type: 'item', id: 'moon_dew', amount: 2 }, premium: { type: 'item', id: 'yuanxiao_agi', amount: 1 } },
  { level: 34, free: { type: 'item', id: 'mystic_crystal_mid', amount: 8 }, premium: { type: 'item', id: 'war_book_high', amount: 2 } },
  { level: 35, free: { type: 'gold', amount: 25000 }, premium: { type: 'egg', tier: 4, amount: 1 } },
  { level: 36, free: { type: 'item', id: 'forge_stone_high', amount: 2 }, premium: { type: 'item', id: 'blood_orb_mid', amount: 2 } },
  { level: 37, free: { type: 'item', id: 'forge_stone_mid', amount: 5 }, premium: { type: 'item', id: 'forge_stone_high', amount: 5 } },
  { level: 38, free: { type: 'gold', amount: 28000 }, premium: { type: 'item', id: 'yuanxiao_int', amount: 1 } },
  { level: 39, free: { type: 'item', id: 'socket_nail', amount: 3 }, premium: { type: 'item', id: 'repair_glue', amount: 2 } },
  { level: 40, free: { type: 'diamond', amount: 50 }, premium: { type: 'diamond', amount: 800 } },
  // 41-50级：巅峰奖励
  { level: 41, free: { type: 'gold', amount: 30000 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 5 } },
  { level: 42, free: { type: 'item', id: 'forge_stone_high', amount: 3 }, premium: { type: 'item', id: 'war_book_high', amount: 5 } },
  { level: 43, free: { type: 'item', id: 'blood_orb_mid', amount: 2 }, premium: { type: 'item', id: 'blood_orb_high', amount: 2 } },
  { level: 44, free: { type: 'gold', amount: 32000 }, premium: { type: 'item', id: 'blood_orb_mid', amount: 3 } },
  { level: 45, free: { type: 'gold', amount: 35000 }, premium: { type: 'egg', tier: 4, amount: 1 } },
  { level: 46, free: { type: 'item', id: 'exp_book_high', amount: 1 }, premium: { type: 'item', id: 'exp_book_high', amount: 3 } },
  { level: 47, free: { type: 'item', id: 'socket_nail', amount: 5 }, premium: { type: 'item', id: 'repair_glue', amount: 3 } },
  { level: 48, free: { type: 'gold', amount: 38000 }, premium: { type: 'item', id: 'protection_stone', amount: 3 } },
  { level: 49, free: { type: 'item', id: 'blood_orb_low', amount: 2 }, premium: { type: 'item', id: 'blood_orb_mid', amount: 5 } },
  { level: 50, free: { type: 'gold', amount: 50000 }, premium: { type: 'diamond', amount: 1500 } },
];

const TOWER_FLOORS = [];
for (let i = 1; i <= 100; i++) {
  const isBoss = i % 10 === 0;
  // 爬塔难度强化：小怪×5, Boss×3
  const powerMult = isBoss ? 3 : 5;
  TOWER_FLOORS.push({
    floor: i, isBoss,
    hp: (100 + i * 50 + (isBoss ? i * 200 : 0)) * powerMult,
    atk: (10 + i * 3 + (isBoss ? i * 10 : 0)) * powerMult,
    def: Math.floor(i * 1.5 * 1.5),
    reward: isBoss ? { diamond: Math.floor(i * 3), gold: i * 200, exp: i * 50 } : { gold: i * 50, diamond: Math.floor(i * 0.5), exp: i * 20 },
    name: isBoss ? `第${i}层首领` : `第${i}层守卫`
  });
}

// 爬塔最大层数：每转生一次增加50层
function getMaxTowerFloors() {
  return 100 + (G.player.rebirth || 0) * 50;
}

// 获取指定层数的塔数据（支持超过100层的动态生成）
function getTowerFloorData(floorNum) {
  if (floorNum < TOWER_FLOORS.length) return TOWER_FLOORS[floorNum];
  // 动态生成超过100层的楼层
  const i = floorNum + 1; // 1-based
  const isBoss = i % 10 === 0;
  // 爬塔难度强化：小怪×5, Boss×3
  const powerMult = isBoss ? 3 : 5;
  return {
    floor: i, isBoss,
    hp: (100 + i * 50 + (isBoss ? i * 200 : 0)) * powerMult,
    atk: (10 + i * 3 + (isBoss ? i * 10 : 0)) * powerMult,
    def: Math.floor(i * 1.5 * 1.5),
    reward: isBoss ? { diamond: Math.floor(i * 3), gold: i * 200, exp: i * 50 } : { gold: i * 50, diamond: Math.floor(i * 0.5), exp: i * 20 },
    name: isBoss ? `第${i}层首领` : `第${i}层守卫`
  };
}

// ==================== 宠物装备系统 ====================
// 宠物装备3栏：1-攻击/灵力, 2-气血, 3-防御
const PET_EQUIP_SLOTS = [
  { id: 'attack', name: '攻击栏', icon: '⚔️', desc: '攻击/灵力加成' },
  { id: 'hp', name: '气血栏', icon: '❤️', desc: '气血加成' },
  { id: 'defense', name: '防御栏', icon: '🛡️', desc: '防御加成' },
];

// 宠物装备品质：优秀(0词条) / 稀有1词条 / 史诗2词条 / 传说3词条 / 神话4词条
const PET_EQUIP_RARITIES = ['uncommon', 'rare', 'epic', 'legend', 'mythic'];
const PET_EQUIP_RARITY_NAMES = ['优秀', '稀有', '史诗', '传说', '神话'];
const PET_EQUIP_RARITY_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#fb923c', '#ef4444'];
const PET_EQUIP_AFFIX_COUNT = [0, 1, 2, 3, 4];

// 宠物装备基础名（按栏位）
const PET_EQUIP_BASE_NAMES = {
  attack: ['爪牙', '利齿', '锋角', '尖刺', '战爪', '尖牙项圈'],
  hp: ['护心镜', '生命符', '气血玉', '魂魄链', '生机护符', '生命项圈'],
  defense: ['护甲壳', '硬皮甲', '鳞片护', '玄铁甲', '护体符', '防御项圈'],
};

// 随机词条类型：增加属性 / 增加资质 / 增加成长 / 宠物技能
const PET_AFFIX_TYPES = [
  // 属性类
  { id: 'p_str', kind: 'stat', stat: '力量', format: v => '力量 +' + v },
  { id: 'p_con', kind: 'stat', stat: '体质', format: v => '体质 +' + v },
  { id: 'p_agi', kind: 'stat', stat: '敏捷', format: v => '敏捷 +' + v },
  { id: 'p_int', kind: 'stat', stat: '魔力', format: v => '魔力 +' + v },
  { id: 'p_hp', kind: 'stat', stat: '气血', format: v => '气血 +' + v },
  { id: 'p_atk', kind: 'stat', stat: '攻击力', format: v => '攻击力 +' + v },
  { id: 'p_def', kind: 'stat', stat: '防御力', format: v => '防御力 +' + v },
  { id: 'p_spd', kind: 'stat', stat: '速度', format: v => '速度 +' + v },
  // 资质类
  { id: 'p_apt_str', kind: 'aptitude', stat: '力量资质', format: v => '力量资质 +' + v },
  { id: 'p_apt_con', kind: 'aptitude', stat: '体质资质', format: v => '体质资质 +' + v },
  { id: 'p_apt_agi', kind: 'aptitude', stat: '敏捷资质', format: v => '敏捷资质 +' + v },
  { id: 'p_apt_int', kind: 'aptitude', stat: '魔力资质', format: v => '魔力资质 +' + v },
  // 成长类
  { id: 'p_growth', kind: 'growth', stat: '成长', format: v => '成长 +' + v.toFixed(2) },
  // 需求5/10：技能词条类 —— 宠物装备随机出现技能词条，装备时附加对应被动技能
  // 需求5修复：format函数汉化，显示中文技能名称与效果描述，而非英文技能ID
  { id: 'p_skill_atk', kind: 'skill', skillPool: ['sneak_atk','power_up','crit_strike','double_atk','precision','charge','pursuit'], format: function(v) {
    if (!v) return '';
    var s = (typeof ALL_SKILLS !== 'undefined') ? ALL_SKILLS.find(function(x) { return x.id === v; }) : null;
    return s ? ('📜 ' + s.name + '：' + s.desc) : '📜 未知技能';
  } },
  { id: 'p_skill_def', kind: 'skill', skillPool: ['def_up','parry','regen','sturdy','solid_shield','tenacity','solid_magic'], format: function(v) {
    if (!v) return '';
    var s = (typeof ALL_SKILLS !== 'undefined') ? ALL_SKILLS.find(function(x) { return x.id === v; }) : null;
    return s ? ('📜 ' + s.name + '：' + s.desc) : '📜 未知技能';
  } },
  { id: 'p_skill_spd', kind: 'skill', skillPool: ['dodge','speed_up','wind_chaser','initiative','blink'], format: function(v) {
    if (!v) return '';
    var s = (typeof ALL_SKILLS !== 'undefined') ? ALL_SKILLS.find(function(x) { return x.id === v; }) : null;
    return s ? ('📜 ' + s.name + '：' + s.desc) : '📜 未知技能';
  } },
  { id: 'p_skill_magic', kind: 'skill', skillPool: ['magic_heart','magic_double','arcane_focus','spell_resist','mana_shield','mana_pool','intellect_up','element_ward'], format: function(v) {
    if (!v) return '';
    var s = (typeof ALL_SKILLS !== 'undefined') ? ALL_SKILLS.find(function(x) { return x.id === v; }) : null;
    return s ? ('📜 ' + s.name + '：' + s.desc) : '📜 未知技能';
  } },
  { id: 'p_skill_survival', kind: 'skill', skillPool: ['revive','survival','vampire','reflect','lucky','self_heal','clear_mind'], format: function(v) {
    if (!v) return '';
    var s = (typeof ALL_SKILLS !== 'undefined') ? ALL_SKILLS.find(function(x) { return x.id === v; }) : null;
    return s ? ('📜 ' + s.name + '：' + s.desc) : '📜 未知技能';
  } },
];

// 宠物装备套装系统：1件/3件加成
// weeklyGroup：该套装出现的日期分组（1=周一 2=周二 3=周三 4=周四 5=周五；周六周日全部出现）
const PET_EQUIP_SETS = [
  // 需求18：套装3件套效果独特化，bonus3 中新增效果标识
  {
    id: 'beast', name: '野兽之力', color: '#ef4444',
    desc: '攻击力+5%', desc3: '攻击力+15%, 暴击率+10%, 攻击时30%概率追加一次普攻',
    bonus: { atkPct: 0.05 }, bonus3: { atkPct: 0.15, critRate: 0.10, extraAttack: 0.30 },
    weeklyGroup: [1, 3, 5],
  },
  {
    id: 'guardian', name: '守护之魂', color: '#3b82f6',
    desc: '防御力+10%', desc3: '防御力+25%, 气血+10%, 受到致命伤害免死一次（保留30%气血，每场1次）',
    bonus: { defPct: 0.10 }, bonus3: { defPct: 0.25, hpPct: 0.10, deathImmune: true },
    weeklyGroup: [1, 4],
  },
  {
    id: 'vitality', name: '生机之息', color: '#22c55e',
    desc: '气血+8%', desc3: '气血+20%, 每回合回血5%, 回合结束恢复10%气血',
    bonus: { hpPct: 0.08 }, bonus3: { hpPct: 0.20, regenPct: 0.05, endRegen: 0.10 },
    weeklyGroup: [1, 4],
  },
  {
    id: 'swift', name: '疾风之翼', color: '#06b6d4',
    desc: '速度+8%', desc3: '速度+20%, 闪避率+10%, 攻击目标数+1（普攻可打2个目标）',
    bonus: { spdPct: 0.08 }, bonus3: { spdPct: 0.20, dodgeRate: 0.10, extraTarget: 1 },
    weeklyGroup: [2, 3],
  },
  {
    id: 'wisdom', name: '智慧之源', color: '#a855f7',
    desc: '魔力+10%', desc3: '魔力+25%, 法术伤害+15%, 法术技能目标数+1（秒3变秒4）',
    bonus: { intPct: 0.10 }, bonus3: { intPct: 0.25, magicDmgPct: 0.15, magicExtraTarget: 1 },
    weeklyGroup: [2, 3, 5],
  },
  {
    id: 'ancient', name: '远古之印', color: '#f59e0b',
    desc: '全属性+3%', desc3: '全属性+8%, 暴击伤害+30%',
    bonus: { allPct: 0.03 }, bonus3: { allPct: 0.08, critDmg: 0.30 },
    weeklyGroup: [2, 4, 5],
  },
];

// 任务14：获取当天可出现的宠物装备套装ID数组
// 周一~周五每天固定3种套装，周六周日全部6种套装都出现
function getWeeklyPetEquipSets() {
  var day = new Date().getDay(); // 0=周日, 1=周一, ..., 6=周六
  // 周六(6)或周日(0)：全部套装 
  if (day === 0 || day === 6) {
    return PET_EQUIP_SETS.map(function(s) { return s.id; });
  }
  // 周一~周五：按 weeklyGroup 过滤
  return PET_EQUIP_SETS.filter(function(s) {
    return s.weeklyGroup && s.weeklyGroup.indexOf(day) >= 0;
  }).map(function(s) { return s.id; });
}

// 宠物装备副本：通关奖励为宠物装备
const PET_EQUIP_DUNGEON = {
  id: 'pet_equip_cave',
  name: '宠物秘境',
  icon: '🐾',
  desc: '挑战神秘秘境，获取宠物装备',
  minLv: 20,   // v2.11.0 需求4.2：解锁等级下调至20级
  maxWaves: 5,
  waves: [
    { name: '秘境入口', hpMult: 4, atkMult: 4, reward: '低概率宠物装备' },
    { name: '秘境深处', hpMult: 5, atkMult: 5, reward: '中概率宠物装备' },
    { name: '秘境核心', hpMult: 6, atkMult: 6, reward: '高概率宠物装备' },
    { name: '秘境BOSS', hpMult: 8, atkMult: 8, reward: '稀有宠物装备' },
    { name: '远古守护者', hpMult: 12, atkMult: 10, reward: '传说宠物装备' },
  ],
};

// 需求2：宠物装备材料分级
// v2.11.0 需求2.1：宠装打造材料「远古符文」更名为「战兵图册」，与符文系统的「远古符文」彻底拆分
// 神秘水晶和战兵图册按低级/中级/高级分级（需求4：已移除兽皮通用材料）
const PET_EQUIP_MATERIALS = [
  'mystic_crystal_low', 'mystic_crystal_mid', 'mystic_crystal_high',
  'war_book_low', 'war_book_mid', 'war_book_high',
];
const PET_EQUIP_MATERIAL_NAMES = {
  mystic_crystal_low: '低级神秘水晶', mystic_crystal_mid: '中级神秘水晶', mystic_crystal_high: '高级神秘水晶',
  war_book_low: '低级战兵图册', war_book_mid: '中级战兵图册', war_book_high: '高级战兵图册',
};
const PET_EQUIP_MATERIAL_ICONS = {
  mystic_crystal_low: '💠', mystic_crystal_mid: '💠', mystic_crystal_high: '💠',
  war_book_low: '📖', war_book_mid: '📖', war_book_high: '📖',
};
// 材料等级颜色（用于UI展示品质区分）
const PET_EQUIP_MATERIAL_GRADE_COLORS = {
  mystic_crystal_low: '#9ca3af', war_book_low: '#9ca3af',
  mystic_crystal_mid: '#3b82f6', war_book_mid: '#3b82f6',
  mystic_crystal_high: '#f59e0b', war_book_high: '#f59e0b',
};
// 旧材料ID到新低级材料的映射（用于存档迁移）
const PET_EQUIP_LEGACY_MATS = {
  mystic_crystal: 'mystic_crystal_low',
  ancient_rune: 'war_book_low', // v2.11.0：旧的远古符文材料迁移到战兵图册
};
// 不同品质分解产出的材料数量（产出对应等级的水晶/战兵图册；需求4：已移除兽皮）
// 需求5：平衡分解产出——确保分解回收率低于打造消耗，防止"打造→分解"材料循环刷取
// 低级打造消耗 2低水晶+1低战兵图册，分解优秀仅1低水晶，分解稀有1~2低水晶+0~1低战兵图册（期望回收<消耗）
const PET_EQUIP_DECOMP_YIELD = {
  uncommon: { mystic_crystal_low: [1, 1] },
  rare:   { mystic_crystal_low: [1, 2], war_book_low: [0, 1] },
  epic:   { mystic_crystal_mid: [2, 3], war_book_mid: [1, 1] },
  legend: { mystic_crystal_high: [3, 4], war_book_high: [1, 2] },
  mythic: { mystic_crystal_high: [4, 6], war_book_high: [2, 3] },
};

// 需求2：重做打造系统——按打造等级（low/mid/high）消耗不同品质材料
// 打造等级越高，消耗越高，但产出高品质概率越大
const PET_EQUIP_CRAFT_GRADES = ['low', 'mid', 'high'];
const PET_EQUIP_CRAFT_GRADE_NAMES = { low: '低级打造', mid: '中级打造', high: '高级打造' };
const PET_EQUIP_CRAFT_GRADE_COLORS = { low: '#9ca3af', mid: '#3b82f6', high: '#f59e0b' };
const PET_EQUIP_CRAFT_RECIPES = {
  low:  { mystic_crystal_low: 2, war_book_low: 1, gold: 5000 },
  mid:  { mystic_crystal_mid: 3, war_book_mid: 2, gold: 30000 },
  high: { mystic_crystal_high: 5, war_book_high: 4, gold: 150000 },
};

// v2.11.0 需求2.1：符文系统独立材料定义（远古符文，仅用于符文强化/分解/养成）
const RUNE_MATERIALS = ['ancient_rune_low', 'ancient_rune_mid', 'ancient_rune_high'];
const RUNE_MATERIAL_NAMES = {
  ancient_rune_low: '低级远古符文', ancient_rune_mid: '中级远古符文', ancient_rune_high: '高级远古符文',
};
const RUNE_MATERIAL_ICONS = {
  ancient_rune_low: '📜', ancient_rune_mid: '📜', ancient_rune_high: '📜',
};
const RUNE_MATERIAL_GRADE_COLORS = {
  ancient_rune_low: '#9ca3af', ancient_rune_mid: '#3b82f6', ancient_rune_high: '#f59e0b',
};
// 产出品质概率（按打造等级）
// 低级打造：60%优秀(只有基础属性没有词条) + 40%稀有
// 中级打造：50%稀有 + 40%史诗 + 10%传说
// 高级打造：20%稀有 + 40%史诗 + 40%传说
const PET_EQUIP_CRAFT_RATES = {
low:  { uncommon: 0.60, rare: 0.40 },
mid:  { rare: 0.50, epic: 0.40, legend: 0.10 },
high: { rare: 0.20, epic: 0.40, legend: 0.40 },
};

// ==================== 进化之梯活动（原符文循环，v2.8.0重构） ====================
// v2.8.0 需求4.1：符文循环 → 进化之梯，奖励池替换为进化晶石
// 每日3次挑战，按战力获得进化晶石奖励
const RUNE_CYCLE_CONFIG = {
  name: '进化之梯',
  desc: '挑战进化之梯，按战力获得进化晶石等丰厚奖励',
  dailyLimit: 3,
  minLevel: 50,
  // v2.8.0 需求4.1：奖励池替换为进化晶石
  // 战力档位奖励：[战力下限, 低级晶石, 中级晶石, 高级晶石]
  tiers: [
    { cpMin: 0,       crystalLow: 3, crystalMid: 0, crystalHigh: 0 },
    { cpMin: 50000,   crystalLow: 2, crystalMid: 2, crystalHigh: 0 },
    { cpMin: 150000,  crystalLow: 1, crystalMid: 3, crystalHigh: 1 },
    { cpMin: 300000,  crystalLow: 0, crystalMid: 4, crystalHigh: 2 },
    { cpMin: 600000,  crystalLow: 0, crystalMid: 2, crystalHigh: 4 },
    { cpMin: 1000000, crystalLow: 0, crystalMid: 0, crystalHigh: 6 },
  ],
};

// 宠物技能池（用作随机词条时附加到宠物）
const PET_EQUIP_SKILL_POOL = [
  'skill_p_atk_up', 'skill_p_def_up', 'skill_p_spd_up', 'skill_p_hp_up',
  'skill_p_crit_up', 'skill_p_dodge_up',
];

// ==================== 需求9：功能解锁等级路线 ====================
// 按成长路线规划功能开启等级，未在此表中的功能默认不限制
// 已转生玩家不受等级限制（所有功能自动解锁）
const FEATURE_UNLOCK_LEVELS = {
  // 副本类型
  dungeon_exp:     5,    // 经验副本
  dungeon_gold:    10,   // 金币副本
  dungeon_egg:     15,   // 蛋副本
  dungeon_forge:   20,   // 强化石副本
  dungeon_gem:     25,   // 宝石副本
  dungeon_blood:   35,   // 血统副本
  // 功能模块
  dispatch:        1,    // 需求5.1：派遣奇遇默认解锁
  arena:           10,   // 需求5.1：竞技场10级解锁
  tower:           15,   // 需求5.1：爬塔15级解锁
  evolution_forest: 20, // 需求5.1：符文洞窟20级解锁（与config.minLevel一致）
  crimson_fortress: 35,  // 需求5.1：血色要塞35级解锁
  forge:           20,   // 锻造强化
  cultivation:     20,   // 人物修炼
  gem:             25,   // 宝石功能
  skill_book_hunt: 25,   // 技能秘境
  formation:       30,   // 阵法功能
  formation_escort:30,   // 押镖活动
  bloodline:       35,   // 血统功能
  equip_refine:    45,   // 装备洗练
treasure:        50,   // 藏宝图功能
treasure_hunt:   50,   // 打宝图活动
dig:             55,   // 挖密藏
pet_equip:       20,   // v2.11.0 需求4.2：宠物装备解锁等级下调至20级
  pet_cave:        20,   // v2.11.0 需求4.2：宠物秘境解锁等级下调至20级
  pet_refine:      40,   // 需求10：宠物炼化（与进阶同页，40级解锁）
  rune_cycle:      50,   // 符文循环活动（与宠物装备同期解锁）
  rebirth:         100,  // 转生
  samsara:         70,   // 六道轮回活动
};

// 检查功能是否已解锁
function isFeatureUnlocked(featureId) {
  if (G.player.rebirth > 0) return true; // 已转生不受限制
  var level = FEATURE_UNLOCK_LEVELS[featureId];
  if (level === undefined) return true; // 未在表中的功能不限制
  return G.player.level >= level;
}

// 获取功能解锁等级（用于UI提示）
function getFeatureUnlockLevel(featureId) {
  return FEATURE_UNLOCK_LEVELS[featureId] || 0;
}

// 需求5：页面/活动到功能ID的映射（用于导航栏等级限制）
const SCREEN_FEATURE_MAP = {
  formation: 'formation',        // 阵法页 → 阵法功能
  petequip: 'pet_equip',         // 宠物装备页 → 宠物装备
treasure: 'treasure',          // 藏宝图页 → 藏宝图功能
dig: 'dig',                    // 挖密藏页 → 挖密藏功能
rebirth: 'rebirth',            // 转生页 → 转生功能
samsara: 'samsara',            // 六道轮回页 → 六道轮回功能
};

// 活动页签到功能ID的映射
// 需求5.1：补全所有活动的功能映射，使解锁等级统一管理
const ACTIVITY_TAB_FEATURE_MAP = {
  dispatch: 'dispatch',          // 派遣奇遇（默认解锁）
  arena: 'arena',                // 竞技场（10级）
  tower: 'tower',                // 爬塔（15级）
  petcave: 'pet_cave',           // 宠物秘境（20级）
  evoforest: 'evolution_forest', // 符文洞窟（20级）
  skillbook: 'skill_book_hunt',  // 技能秘境（25级）
  formation: 'formation_escort', // 押镖（30级）
  fortress: 'crimson_fortress',  // 血色要塞（35级）
  treasure: 'treasure',          // 打宝图（50级）
  runecycle: 'rune_cycle',       // 进化之梯（50级）
  samsara: 'samsara',            // 六道轮回（70级）需求3.2
};

// 功能解锁时显示的剧情文案
const FEATURE_UNLOCK_STORY = {
  dispatch:        '【派遣奇遇】酒馆老板向你招手：「听说附近的森林里藏着不少宝贝，派你的宠物去探索吧！」',
  forge:           '【锻造强化】铁匠铺的锤声响起：「你的装备还不够强！来，让我教你锻造的奥秘。」',
  gem:             '【宝石镶嵌】宝石商人神秘一笑：「这些闪亮的石头能赋予装备新的力量……」',
  skill_book_hunt: '【技能秘境】神秘学者低语：「技能秘境中藏着失传的技能书，你有勇气去探索吗？」',
  formation:       '【阵法系统】老将军展开一幅阵图：「排兵布阵，方能百战百胜！学会阵法，你的队伍将如虎添翼。」',
  formation_escort:'【押镖活动】镖局掌柜拍着你的肩膀：「护送镖车穿越险地，报酬丰厚！敢来吗？」',
  bloodline:       '【血统觉醒】血脉深处的力量在涌动……「你的宠物体内沉睡着远古的血统之力，是时候觉醒了！」',
  treasure:        '【藏宝图】一张泛黄的藏宝图在风中展开……「传说中埋藏着无尽宝藏，去寻找吧！」',
dig:             '【挖密藏】神秘老人递给你一张密藏图：「九宫格下暗藏玄机，运气与策略并存，敢来挖宝吗？」',
  treasure_hunt:   '【打宝图活动】藏宝图碎片散落在各处，击败怪物就能收集到它们！',
  pet_equip:       '【宠物装备】装备匠人展示了精致的宠物护甲：「给你的宠物穿上装备，战斗力将大幅提升！」',
  pet_cave:        '【宠物秘境】神秘的宠物秘境入口若隐若现……「深处藏着稀有宠物，带上你的队伍去探索吧！」',
  rebirth:         '【转生之路】天空中光芒大盛……「你已达到凡人的极限，转生后将获得新生，所有功能自动解锁！」',
  cultivation:     '【人物修炼】修炼大师端坐在蒲团上：「内外兼修，方能突破极限。修炼你的四维属性，让宠物也更加强大！」',
  equip_refine:    '【装备洗练】洗练大师展示了神秘的洗练石：「重新洗练装备词条，追求完美属性，就在今日！」',
};

// 获取功能解锁时的剧情文案
function getFeatureUnlockStory(featureId) {
  return FEATURE_UNLOCK_STORY[featureId] || '';
}

// 检查升级后是否有新功能解锁，返回解锁的功能列表
function checkNewlyUnlockedFeatures(newLevel) {
  var unlocked = [];
  for (var featureId in FEATURE_UNLOCK_LEVELS) {
    var reqLevel = FEATURE_UNLOCK_LEVELS[featureId];
    if (reqLevel === newLevel) {
      unlocked.push(featureId);
    }
  }
  return unlocked;
}

// ==================== 需求5：血色要塞活动配置 ====================
// Roguelike无限轮战斗，每5关选增益buff，失败结算奖励
// 怪物强度按等级判断，3个难度，每5关整体强化5%

// 难度配置
const CRIMSON_FORTRESS_DIFFICULTIES = [
  { id: 'easy',   name: '简单', desc: '怪物整体强度下降30%', powerMult: 0.7,  expMult: 3.0 },
  { id: 'normal', name: '普通', desc: '怪物强度与主线一致',   powerMult: 1.0,  expMult: 3.0 },
  { id: 'hard',   name: '困难', desc: '怪物整体强度为1.5倍',   powerMult: 1.5,  expMult: 3.0 },
];

// 增益buff池（按品质决定刷出概率）
const CRIMSON_FORTRESS_BUFF_POOL = [
  // 普通（白色）- 50%权重
  { id: 'cf_atk_up',     name: '攻击强化',   desc: '攻击力+10%',      quality: 'common',   weight: 50, effect: { atkPct: 0.10 } },
  { id: 'cf_def_up',     name: '防御强化',   desc: '防御力+10%',      quality: 'common',   weight: 50, effect: { defPct: 0.10 } },
  { id: 'cf_hp_up',      name: '生命强化',   desc: '气血+15%',        quality: 'common',   weight: 50, effect: { hpPct: 0.15 } },
  { id: 'cf_spd_up',     name: '速度强化',   desc: '速度+10%',        quality: 'common',   weight: 50, effect: { spdPct: 0.10 } },
  { id: 'cf_regen',      name: '持续恢复',   desc: '每回合恢复3%气血', quality: 'common',   weight: 50, effect: { regenPct: 0.03 } },
  // 优秀（绿色）- 30%权重
  { id: 'cf_crit_up',    name: '暴击强化',   desc: '暴击率+10%',      quality: 'uncommon', weight: 30, effect: { critRate: 0.10 } },
  { id: 'cf_vamp_up',    name: '吸血强化',   desc: '攻击吸血10%',     quality: 'uncommon', weight: 30, effect: { vampPct: 0.10 } },
  { id: 'cf_skill_dmg',  name: '法术强化',   desc: '技能伤害+15%',    quality: 'uncommon', weight: 30, effect: { skillDmg: 0.15 } },
  { id: 'cf_dmg_reduce', name: '减伤强化',   desc: '受到伤害-8%',     quality: 'uncommon', weight: 30, effect: { dmgReduce: 0.08 } },
  { id: 'cf_dodge_up',   name: '闪避强化',   desc: '闪避率+8%',       quality: 'uncommon', weight: 30, effect: { dodgeBonus: 0.08 } },
  // 稀有（蓝色）- 15%权重
  { id: 'cf_atk_up2',    name: '攻击精通',   desc: '攻击力+20%',      quality: 'rare',     weight: 15, effect: { atkPct: 0.20 } },
  { id: 'cf_double_atk', name: '连击精通',   desc: '20%概率追加攻击', quality: 'rare',     weight: 15, effect: { doubleChance: 0.20 } },
  { id: 'cf_ignore_def', name: '穿透精通',   desc: '无视15%防御',     quality: 'rare',     weight: 15, effect: { ignoreDef: 0.15 } },
  { id: 'cf_crit_dmg',   name: '暴伤精通',   desc: '暴击伤害+40%',    quality: 'rare',     weight: 15, effect: { critDmg: 0.40 } },
  // 史诗（紫色）- 4%权重
  { id: 'cf_atk_up3',    name: '攻击大师',   desc: '攻击力+30%',      quality: 'epic',     weight: 4,  effect: { atkPct: 0.30 } },
  { id: 'cf_skill_double',name: '法术连发',  desc: '主动技能25%概率连放', quality: 'epic',  weight: 4,  effect: { skillDouble: 0.25 } },
  { id: 'cf_revive',     name: '不屈意志',   desc: '死亡时30%概率复活', quality: 'epic',    weight: 4,  effect: { reviveChance: 0.30, revivePct: 0.50 } },
  // 传说（金色）- 1%权重
  { id: 'cf_all_stat',   name: '全属性强化', desc: '全属性+15%',      quality: 'legendary',weight: 1,  effect: { atkPct: 0.15, defPct: 0.15, hpPct: 0.15, spdPct: 0.15 } },
  { id: 'cf_god_mode',   name: '战神降临',   desc: '攻击力+25%，暴击率+15%，暴击伤害+50%', quality: 'legendary', weight: 1, effect: { atkPct: 0.25, critRate: 0.15, critDmg: 0.50 } },
];

// 每日可开启次数
const CRIMSON_FORTRESS_DAILY_MAX = 2;

// 从buff池中随机3个不同效果的buff
function rollCrimsonFortressBuffs() {
  var pool = CRIMSON_FORTRESS_BUFF_POOL.slice();
  var result = [];
  for (var i = 0; i < 3 && pool.length > 0; i++) {
    var totalWeight = pool.reduce(function(sum, b) { return sum + b.weight; }, 0);
    var r = Math.random() * totalWeight;
    var cum = 0;
    for (var j = 0; j < pool.length; j++) {
      cum += pool[j].weight;
      if (r < cum) {
        result.push(pool[j]);
        pool.splice(j, 1);
        break;
      }
    }
  }
  return result;
}

// ==================== 标准化道具配置表 (ITEM_CONFIG) ====================
// 统一管理全游戏道具的配置表，包含：ID、名称、描述、品级、价值等级、掉落权重、
// 交易/分解/炼化权限、使用限制、堆叠上限、商城售价、产出渠道
// tier: 1=普通(白) 2=优秀(绿) 3=稀有(蓝) 4=史诗(紫) 5=传说(金) 6=神话(红)
// valueLevel: S/A/B/C/D 价值分级，用于掉落分配参考
// dropWeight: 在通用掉落池中的权重（0=不可掉落）
// tradeable: 是否可在市场交易
// decomposable: 是否可分解
// refinable: 是否可作为炼化材料
// stackMax: 堆叠上限（0=无限）
// shopPrice: 商城售价（null=不可购买）；currency: gold/diamond
// sources: 产出渠道列表
const ITEM_TIERS = [1, 2, 3, 4, 5, 6];
const ITEM_TIER_NAMES = { 1:'普通', 2:'优秀', 3:'稀有', 4:'史诗', 5:'传说', 6:'神话' };
const ITEM_TIER_COLORS = { 1:'#9ca3af', 2:'#22c55e', 3:'#3b82f6', 4:'#a855f7', 5:'#f59e0b', 6:'#ef4444' };
const ITEM_VALUE_NAMES = { S:'S级', A:'A级', B:'B级', C:'C级', D:'D级' };

const ITEM_CONFIG = {
  // ===== 副本门票 =====
  exp_ticket:       { name:'经验副本门票', desc:'进入经验洞穴的凭证', tier:2, valueLevel:'C', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:1000, currency:'gold', sources:['商城','日常任务'] },
  gold_ticket:      { name:'金币副本门票', desc:'进入黄金矿洞的凭证', tier:2, valueLevel:'C', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:800, currency:'gold', sources:['商城','日常任务'] },
  egg_ticket:       { name:'蛋之森林门票', desc:'进入蛋之森林的凭证', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:1500, currency:'gold', sources:['商城'] },
  forge_ticket:     { name:'强化石矿脉门票', desc:'进入强化石矿脉的凭证', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2000, currency:'gold', sources:['商城'] },
  map_ticket:       { name:'藏宝遗迹门票', desc:'进入藏宝遗迹的凭证', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2500, currency:'gold', sources:['商城'] },
  gem_ticket:       { name:'宝石秘洞门票', desc:'进入宝石秘洞的凭证', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2200, currency:'gold', sources:['商城'] },
  blood_dungeon_ticket: { name:'血统副本门票', desc:'进入血统副本的凭证（35级开启）', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2000, currency:'gold', sources:['商城'] },

  // ===== 孵化/融合道具 =====
  hatch_boost:      { name:'孵化加速器', desc:'孵化中点击加速，减少30分钟孵化时间', tier:2, valueLevel:'C', dropWeight:5, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:250, currency:'gold', sources:['商城','副本掉落'] },
  hatch_crystal:    { name:'孵化结晶', desc:'瞬间完成孵化，无需等待', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:30, currency:'diamond', sources:['商城'] },
  hatch_stone:      { name:'孵化石', desc:'孵化宠物蛋必需的神秘石头', tier:1, valueLevel:'D', dropWeight:10, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:800, currency:'gold', sources:['商城','副本掉落','挖秘藏'] },
  fusion_stone:     { name:'融合石', desc:'宠物融合必需材料', tier:2, valueLevel:'C', dropWeight:5, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:500, currency:'gold', sources:['商城','副本掉落'] },
  rare_egg:         { name:'稀有宠物蛋', desc:'随机获得T2-T4宠物蛋', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:30, currency:'diamond', sources:['商城'] },
  moon_dew:         { name:'月华露', desc:'提升宠物成长值0.02~0.05（每只限50次）', tier:4, valueLevel:'A', dropWeight:2, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:1200, currency:'gold', sources:['商城','挖秘藏','藏宝图'] },

  // ===== 强化石/锻造道具 =====
  forge_stone_low:  { name:'低级强化石', desc:'用于装备+1~+6强化', tier:1, valueLevel:'D', dropWeight:15, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:400, currency:'gold', sources:['商城','副本掉落','装备分解'] },
  forge_stone_mid:  { name:'中级强化石', desc:'用于装备+7~+9强化', tier:3, valueLevel:'B', dropWeight:8, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:1800, currency:'gold', sources:['商城','副本掉落','装备分解'] },
  forge_stone_high: { name:'高级强化石', desc:'用于装备+10~+12强化', tier:5, valueLevel:'S', dropWeight:2, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:7000, currency:'gold', sources:['商城','副本掉落','装备分解'] },
  protection_stone: { name:'保底石', desc:'强化时消耗可防止失败降级', tier:4, valueLevel:'A', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:4500, currency:'gold', sources:['商城','副本掉落'] },
  socket_nail:      { name:'打孔钉', desc:'为装备打孔，成功率随孔数递减', tier:3, valueLevel:'B', dropWeight:4, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2500, currency:'gold', sources:['商城','藏宝图'] },
  repair_glue:      { name:'修补胶', desc:'重置装备孔洞为0', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:15, currency:'diamond', sources:['商城'] },
  refine_stone:     { name:'洗练石', desc:'重新随机装备词条（45级开启）', tier:4, valueLevel:'A', dropWeight:2, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:3000, currency:'gold', sources:['商城','藏宝图'] },

  // ===== 资质/进阶道具 =====
  yuanxiao_str:     { name:'力量元宵', desc:'提升宠物力量资质10~30', tier:3, valueLevel:'B', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2500, currency:'gold', sources:['商城','藏宝图'] },
  yuanxiao_con:     { name:'体质元宵', desc:'提升宠物质质资质10~30', tier:3, valueLevel:'B', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2500, currency:'gold', sources:['商城','藏宝图'] },
  yuanxiao_agi:     { name:'敏捷元宵', desc:'提升宠物敏捷资质10~30', tier:3, valueLevel:'B', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2500, currency:'gold', sources:['商城','藏宝图'] },
  yuanxiao_int:     { name:'魔力元宵', desc:'提升宠物魔力资质10~30', tier:3, valueLevel:'B', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:2500, currency:'gold', sources:['商城','藏宝图'] },
  // [已移除] 进阶丸道具定义已删除
  // ===== 进阶系统道具（进化晶石） =====
  evolution_crystal_low:  { name:'低级进化晶石', desc:'宠物进阶材料，提供15点进阶值，低概率触发暴击', tier:2, valueLevel:'C', dropWeight:6, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:500, currency:'gold', sources:['进化之梯','商城'] },
  evolution_crystal_mid:  { name:'中级进化晶石', desc:'宠物进阶材料，提供50点进阶值，低概率触发暴击', tier:4, valueLevel:'A', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:3000, currency:'gold', sources:['进化之梯','商城'] },
  evolution_crystal_high: { name:'高级进化晶石', desc:'宠物进阶材料，提供150点进阶值，低概率触发暴击', tier:5, valueLevel:'S', dropWeight:1, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:20, currency:'diamond', sources:['进化之梯','商城'] },

  // ===== 重置道具 =====
  guiyuan_pill:     { name:'归元丹', desc:'重置T1-T3宠物的成长、资质、技能', tier:3, valueLevel:'B', dropWeight:2, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:5000, currency:'gold', sources:['商城','藏宝图'] },
  guixu_pill:       { name:'归虚丹', desc:'重置T4-T5宠物的成长、资质、技能', tier:5, valueLevel:'S', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:20, currency:'diamond', sources:['商城'] },
  pet_reset_pill:   { name:'宠物洗点丹', desc:'重置指定宠物的全部自由属性点，全额返还为未分配状态', tier:4, valueLevel:'A', dropWeight:1, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:15, currency:'diamond', sources:['密藏','藏宝图','传奇宝箱','商城'] },

  // ===== 炼化道具 =====
  refine_essence:   { name:'炼化精魄', desc:'低品质炼化材料，成功率50%（40级开启）', tier:3, valueLevel:'B', dropWeight:4, tradeable:true, decomposable:false, refinable:true, stackMax:99, shopPrice:3000, currency:'gold', sources:['商城','副本掉落','挖秘藏'] },
  refine_crystal:   { name:'炼化晶石', desc:'高品质炼化材料，成功率85%（40级开启）', tier:5, valueLevel:'S', dropWeight:1, tradeable:true, decomposable:false, refinable:true, stackMax:99, shopPrice:35, currency:'diamond', sources:['商城','挖秘藏'] },

  // ===== 经验书/Buff卡 =====
  exp_book:         { name:'经验书', desc:'使用后获得10000人物经验', tier:2, valueLevel:'C', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:1, currency:'diamond', sources:['商城'] },
  exp_book_mid:     { name:'中级经验书', desc:'使用后获得100000人物经验', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:5, currency:'diamond', sources:['商城'] },
  exp_book_high:    { name:'高级经验书', desc:'使用后获得1000000人物经验', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:20, currency:'diamond', sources:['商城'] },
  exp_book_bulk:    { name:'经验书包×5', desc:'5本经验书打包（节省20%）', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:4, currency:'diamond', sources:['商城'] },
  exp_card_2x:      { name:'双倍经验卡', desc:'30分钟内获得经验双倍', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:5, currency:'diamond', sources:['商城'] },
  exp_card_5x:      { name:'五倍经验卡', desc:'30分钟内获得经验五倍', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:20, currency:'diamond', sources:['商城'] },
  exp_card_10x:     { name:'十倍经验卡', desc:'30分钟内获得经验十倍', tier:5, valueLevel:'S', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:50, currency:'diamond', sources:['商城'] },
  gold_card_2x:     { name:'双倍金币卡', desc:'30分钟内获得金币双倍', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:5, currency:'diamond', sources:['商城'] },
  gold_card_5x:     { name:'五倍金币卡', desc:'30分钟内获得金币五倍', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:20, currency:'diamond', sources:['商城'] },
  gold_card_10x:    { name:'十倍金币卡', desc:'30分钟内获得金币十倍', tier:5, valueLevel:'S', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:50, currency:'diamond', sources:['商城'] },
  lucky_charm:      { name:'幸运符', desc:'30分钟内掉宝率提升50%', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:15, currency:'diamond', sources:['商城'] },

  // ===== 金币箱 =====
  gold_chest_s:     { name:'小金币箱', desc:'开启获得10万金币', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:5, currency:'diamond', sources:['商城'] },
  gold_chest_m:     { name:'中金币箱', desc:'开启获得100万金币', tier:4, valueLevel:'A', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:40, currency:'diamond', sources:['商城'] },
  gold_chest_l:     { name:'大金币箱', desc:'开启获得1000万金币', tier:5, valueLevel:'S', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:300, currency:'diamond', sources:['商城'] },

  // ===== 改名卡 =====
  rename_card:      { name:'改名卡', desc:'重命名一只宠物的显示名称', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:5, currency:'diamond', sources:['商城'] },

  // ===== 挖秘藏道具 =====
  dig_map:          { name:'密藏图', desc:'使用后开启挖秘藏九宫格玩法（5种密藏碎片合成获得）', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:0, currency:'gold', sources:['密藏碎片合成'] },
  dig_shovel:       { name:'探宝铲', desc:'挖秘藏中额外增加1次选择机会', tier:3, valueLevel:'B', dropWeight:0, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:5, currency:'diamond', sources:['商城'] },

  // v2.7.0 需求2.1：金币箱道具（可堆叠，使用后获得对应档位金币）
  gold_chest_small: { name:'小金币箱', desc:'使用后获得500~2000金币', tier:2, valueLevel:'C', dropWeight:8, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:0, currency:'gold', sources:['转盘(低等级地图)','紫色宝箱','橙色宝箱'] },
  gold_chest_mid:   { name:'中金币箱', desc:'使用后获得3000~8000金币', tier:3, valueLevel:'B', dropWeight:6, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:0, currency:'gold', sources:['转盘(中等级地图)','紫色宝箱','橙色宝箱'] },
  gold_chest_large: { name:'大金币箱', desc:'使用后获得10000~30000金币', tier:4, valueLevel:'A', dropWeight:4, tradeable:true, decomposable:false, refinable:false, stackMax:999, shopPrice:0, currency:'gold', sources:['转盘(高等级地图)','橙色宝箱'] },

  // v2.7.0 需求3.1：密藏碎片（5种，集齐各1个可合成密藏图）
  treasure_fragment_1: { name:'密藏碎片·青龙', desc:'蕴含青龙之力的密藏碎片，集齐5种碎片可合成密藏图', tier:4, valueLevel:'A', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:0, currency:'gold', sources:['藏宝图','副本掉落','秘藏彩蛋'] },
  treasure_fragment_2: { name:'密藏碎片·白虎', desc:'蕴含白虎之力的密藏碎片，集齐5种碎片可合成密藏图', tier:4, valueLevel:'A', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:0, currency:'gold', sources:['藏宝图','副本掉落','秘藏彩蛋'] },
  treasure_fragment_3: { name:'密藏碎片·朱雀', desc:'蕴含朱雀之力的密藏碎片，集齐5种碎片可合成密藏图', tier:4, valueLevel:'A', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:0, currency:'gold', sources:['藏宝图','副本掉落','秘藏彩蛋'] },
  treasure_fragment_4: { name:'密藏碎片·玄武', desc:'蕴含玄武之力的密藏碎片，集齐5种碎片可合成密藏图', tier:4, valueLevel:'A', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:0, currency:'gold', sources:['藏宝图','副本掉落','秘藏彩蛋'] },
  treasure_fragment_5: { name:'密藏碎片·麒麟', desc:'蕴含麒麟之力的密藏碎片，集齐5种碎片可合成密藏图', tier:4, valueLevel:'A', dropWeight:3, tradeable:true, decomposable:false, refinable:false, stackMax:99, shopPrice:0, currency:'gold', sources:['藏宝图','副本掉落','秘藏彩蛋'] },

  // ===== 神兽精华（新增） =====
  divine_essence:   { name:'神兽精华', desc:'蕴含神兽之力的精华，集齐99个可随机兑换1只神兽。不可交易、分解、炼化', tier:6, valueLevel:'S', dropWeight:1, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:200, currency:'diamond', sources:['商城','藏宝图(史诗/传奇)','挖秘藏(黄金宝藏)','兑换码'] },

  // ===== 宠物装备材料（战兵图册 + 神秘水晶） =====
  // v2.11.0 需求2.1：远古符文（宠装）更名为战兵图册
  mystic_crystal_low:  { name:'低级神秘水晶', desc:'宠物装备打造材料', tier:2, valueLevel:'C', dropWeight:8, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['宠物秘境','宠物装备分解'] },
  mystic_crystal_mid:  { name:'中级神秘水晶', desc:'宠物装备打造材料', tier:3, valueLevel:'B', dropWeight:4, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['宠物秘境','宠物装备分解'] },
  mystic_crystal_high: { name:'高级神秘水晶', desc:'宠物装备打造材料', tier:5, valueLevel:'S', dropWeight:1, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['宠物秘境','宠物装备分解'] },
  war_book_low:        { name:'低级战兵图册', desc:'宠物装备打造材料', tier:2, valueLevel:'C', dropWeight:8, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['宠物秘境','宠物装备分解'] },
  war_book_mid:        { name:'中级战兵图册', desc:'宠物装备打造材料', tier:3, valueLevel:'B', dropWeight:4, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['宠物秘境','宠物装备分解'] },
  war_book_high:       { name:'高级战兵图册', desc:'宠物装备打造材料', tier:5, valueLevel:'S', dropWeight:1, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['宠物秘境','宠物装备分解'] },
  // ===== 符文系统独立材料（远古符文，仅用于符文强化/分解/养成） =====
  ancient_rune_low:    { name:'低级远古符文', desc:'符文强化专用材料', tier:2, valueLevel:'C', dropWeight:8, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['符文洞窟','符文分解'] },
  ancient_rune_mid:    { name:'中级远古符文', desc:'符文强化专用材料', tier:3, valueLevel:'B', dropWeight:4, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['符文洞窟','符文分解'] },
  ancient_rune_high:   { name:'高级远古符文', desc:'符文强化专用材料', tier:5, valueLevel:'S', dropWeight:1, tradeable:false, decomposable:false, refinable:false, stackMax:999, shopPrice:null, sources:['符文洞窟','符文分解'] },
};

// 道具配置表查询函数
function getItemConfig(id) {
  return ITEM_CONFIG[id] || null;
}

// 获取道具名称（优先从ITEM_CONFIG查询）
function getItemConfigName(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? cfg.name : id;
}

// 获取道具品级颜色
function getItemTierColor(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? (ITEM_TIER_COLORS[cfg.tier] || '#9ca3af') : '#9ca3af';
}

// 获取道具价值等级
function getItemValueLevel(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? cfg.valueLevel : 'D';
}

// 获取道具掉落权重
function getItemDropWeight(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? cfg.dropWeight : 0;
}

// 检查道具是否可交易
function isItemTradeable(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? cfg.tradeable : true;
}

// 检查道具是否可分解
function isItemDecomposable(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? cfg.decomposable : false;
}

// 检查道具是否可炼化
function isItemRefinable(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? cfg.refinable : false;
}

// 获取道具堆叠上限
function getItemStackMax(id) {
  var cfg = ITEM_CONFIG[id];
  return cfg ? cfg.stackMax : 99;
}

// 按价值等级筛选道具（用于掉落池配置）
function getItemsByValueLevel(level) {
  return Object.keys(ITEM_CONFIG).filter(function(id) {
    return ITEM_CONFIG[id].valueLevel === level;
  });
}

// 按品级筛选道具
function getItemsByTier(tier) {
  return Object.keys(ITEM_CONFIG).filter(function(id) {
    return ITEM_CONFIG[id].tier === tier;
  });
}

// ==================== 符文系统（对标阴阳师御魂）====================
// 符文为独立于宠物装备的养成系统，每只宠物可装备6枚符文（位置1-6）
// 符文有主属性（按位置固定）、副属性（随机）、套装效果（2件/4件）
// 符文可通过消耗远古符文材料强化升级

// ===== 符文品质 =====
const RUNE_GRADES = ['common', 'rare', 'epic', 'legend', 'mythic'];
const RUNE_GRADE_NAMES = ['普通', '稀有', '史诗', '传说', '神话'];
const RUNE_GRADE_COLORS = ['#9ca3af', '#3b82f6', '#a855f7', '#fb923c', '#ef4444'];
const RUNE_GRADE_ICONS = ['⚪', '🔵', '🟣', '🟠', '🔴'];
// 每品质初始副属性数量 & 强化上限
const RUNE_GRADE_SUB_COUNT = [1, 2, 3, 4, 4];
const RUNE_MAX_LEVEL = 15; // 符文最高强化等级

// ===== 符文位置（1-6）及主属性池 =====
// v2.8.0 需求6.1：参考阴阳师御魂号位规则重构
// 1/3/5 号位：基础词缀为固定数值类属性（气血/攻击力/灵力/防御/魔法/速度）
// 2/4/6 号位：基础词缀为百分比属性或五维主属性（属性%/暴击率/暴击伤害/闪避率/五维基础）
const RUNE_SLOTS = [
  { id: 1, name: '一号位', icon: '⚔️', mainStatPool: ['atk_flat', 'hp_flat', 'int_flat', 'def_flat', 'mp_flat', 'spd_flat'] },
  { id: 2, name: '二号位', icon: '💨', mainStatPool: ['hp_pct', 'atk_pct', 'def_pct', 'crit_rate', 'crit_dmg', 'dodge_rate', 'str_flat', 'agi_flat', 'vit_flat', 'end_flat', 'mag_flat'] },
  { id: 3, name: '三号位', icon: '🛡️', mainStatPool: ['atk_flat', 'hp_flat', 'int_flat', 'def_flat', 'mp_flat', 'spd_flat'] },
  { id: 4, name: '四号位', icon: '❤️', mainStatPool: ['hp_pct', 'atk_pct', 'def_pct', 'crit_rate', 'crit_dmg', 'dodge_rate', 'str_flat', 'agi_flat', 'vit_flat', 'end_flat', 'mag_flat'] },
  { id: 5, name: '五号位', icon: '💖', mainStatPool: ['atk_flat', 'hp_flat', 'int_flat', 'def_flat', 'mp_flat', 'spd_flat'] },
  { id: 6, name: '六号位', icon: '🎯', mainStatPool: ['hp_pct', 'atk_pct', 'def_pct', 'crit_rate', 'crit_dmg', 'dodge_rate', 'str_flat', 'agi_flat', 'vit_flat', 'end_flat', 'mag_flat'] },
];

// ===== 主属性数值公式（按品质Idx和等级）=====
// 基础值 × (1 + 品质Idx × 0.3) × (1 + 等级 × 0.10)
var RUNE_MAIN_STAT_BASE = {
  atk_flat: 15,    // 攻击力固定值
  spd_flat: 8,     // 速度固定值
  def_flat: 10,    // 防御力固定值
  hp_flat: 60,     // 气血固定值
  hp_pct: 0.05,    // 气血百分比
  crit_rate: 0.04, // 暴击率
  crit_dmg: 0.08,  // 暴击伤害
  atk_pct: 0.05,   // 攻击力百分比
  def_pct: 0.05,   // 防御力百分比
  // v2.8.0 需求6.1：新增主属性类型
  int_flat: 12,    // 灵力固定值
  mp_flat: 30,     // 魔法固定值
  dodge_rate: 0.03,// 闪避率
  str_flat: 10,    // 力量
  agi_flat: 10,    // 敏捷
  vit_flat: 10,    // 体质
  end_flat: 10,    // 耐力
  mag_flat: 10,    // 魔力
};

// 判断符文属性是否为百分比类型
function isRuneStatPct(statType) {
  return statType.indexOf('pct') >= 0 || statType === 'crit_rate' || statType === 'crit_dmg' || statType === 'dodge_rate';
}

// 计算符文主属性数值
// v2.11.0 需求5.1：1/3/5号位固定值基础属性提升5倍，强化成长改为线性递增
function calcRuneMainStat(statType, gradeIdx, level, slot) {
  var base = RUNE_MAIN_STAT_BASE[statType] || 10;
  // v2.11.0 需求5.1：1/3/5号位固定值基础属性提升5倍
  var isFlat = !isRuneStatPct(statType);
  var isOddSlot = (slot === 1 || slot === 3 || slot === 5);
  if (isFlat && isOddSlot) base *= 5;
  // v2.11.0 需求5.1：强化成长改为线性递增（每级提升1级初始值的等量数值）
  // 1级(level=0) = initialVal，2级(level=1) = initialVal×2，3级(level=2) = initialVal×3
  var initialVal = base * (1 + gradeIdx * 0.3);
  var val = initialVal * (level + 1);
  // 百分比类保留3位小数，固定值取整
  if (isRuneStatPct(statType)) {
    return Math.round(val * 1000) / 1000;
  }
  return Math.floor(val);
}

// ===== 副属性类型池（v2.8.0 需求6.1：精简优化，剔除低价值属性，数值梯度匹配品质）=====
const RUNE_SUB_STAT_TYPES = [
  // 固定值类
  { id: 'atk_flat',   name: '攻击力',   isPct: false, baseRange: [3, 8] },
  { id: 'def_flat',   name: '防御力',   isPct: false, baseRange: [2, 6] },
  { id: 'hp_flat',    name: '气血',     isPct: false, baseRange: [20, 50] },
  { id: 'spd_flat',   name: '速度',     isPct: false, baseRange: [2, 5] },
  { id: 'int_flat',   name: '灵力',     isPct: false, baseRange: [3, 8] },
  { id: 'mp_flat',    name: '魔法',     isPct: false, baseRange: [10, 25] },
  // 百分比类（高价值）
  { id: 'atk_pct',    name: '攻击力%',  isPct: true,  baseRange: [0.01, 0.03] },
  { id: 'def_pct',    name: '防御力%',  isPct: true,  baseRange: [0.01, 0.03] },
  { id: 'hp_pct',     name: '气血%',    isPct: true,  baseRange: [0.01, 0.03] },
  { id: 'crit_rate',  name: '暴击率',   isPct: true,  baseRange: [0.01, 0.02] },
  { id: 'crit_dmg',   name: '暴击伤害', isPct: true,  baseRange: [0.02, 0.04] },
  { id: 'dodge_rate', name: '闪避率',   isPct: true,  baseRange: [0.01, 0.02] },
];

// 副属性强化增幅（每次强化+3/6/9/12/15级时触发）
var RUNE_SUB_STAT_INCREMENT = {
  atk_flat: 3, def_flat: 2, hp_flat: 20, spd_flat: 2, int_flat: 3, mp_flat: 10,
  atk_pct: 0.01, def_pct: 0.01, hp_pct: 0.01,
  crit_rate: 0.01, crit_dmg: 0.02, dodge_rate: 0.01,
};

// ===== 符文套装系统（对标阴阳师御魂套装）=====
const RUNE_SETS = [
  {
    id: 'berserk', name: '狂战之怒', color: '#ef4444', icon: '⚔️',
    desc2: '攻击力 +15%', desc4: '暴击伤害 +40%',
    bonus2: { atkPct: 0.15 }, bonus4: { critDmg: 0.40 },
  },
  {
    id: 'guardian', name: '守护之壁', color: '#3b82f6', icon: '🛡️',
    desc2: '防御力 +30%', desc4: '受到伤害减少 15%',
    bonus2: { defPct: 0.30 }, bonus4: { dmgReduce: 0.15 },
  },
  {
    id: 'vitality', name: '生机之泉', color: '#22c55e', icon: '❤️',
    desc2: '气血 +15%', desc4: '每回合恢复 8% 气血',
    bonus2: { hpPct: 0.15 }, bonus4: { regenPct: 0.08 },
  },
  {
    id: 'swift', name: '疾风之翼', color: '#06b6d4', icon: '💨',
    desc2: '速度 +25', desc4: '行动后 20% 概率获得额外行动',
    bonus2: { spdFlat: 25 }, bonus4: { extraTurnChance: 0.20 },
  },
  {
    id: 'critical', name: '破军之眼', color: '#f59e0b', icon: '🎯',
    desc2: '暴击率 +12%', desc4: '暴击时恢复 5% 气血',
    bonus2: { critRate: 0.12 }, bonus4: { critHeal: 0.05 },
  },
  {
    id: 'vampire', name: '嗜血之牙', color: '#a855f7', icon: '🩸',
    desc2: '吸血 +5%', desc4: '击杀目标恢复 20% 气血',
    bonus2: { vampPct: 0.05 }, bonus4: { killHeal: 0.20 },
  },
  {
    id: 'magic', name: '魔心之印', color: '#8b5cf6', icon: '🔮',
    desc2: '灵力 +15%', desc4: '技能伤害 +20%',
    bonus2: { intPct: 0.15 }, bonus4: { skillDmg: 0.20 },
  },
  {
    id: 'ancient', name: '远古之息', color: '#fde047', icon: '🌟',
    desc2: '全属性 +5%', desc4: '全属性 +12%, 暴击伤害 +25%',
    bonus2: { allPct: 0.05 }, bonus4: { allPct: 0.12, critDmg: 0.25 },
  },
];

// 获取符文套装定义
function getRuneSet(setId) {
  return RUNE_SETS.find(function(s) { return s.id === setId; });
}

// ===== 符文强化消耗配置 =====
// 按品质和等级消耗远古符文材料
var RUNE_UPGRADE_COST = {
  // 每级消耗的材料数量 [低级, 中级, 高级]（按当前强化等级段）
  // 0-4级: 低级材料; 5-9级: 中级材料; 10-14级: 高级材料
  getCost: function(currentLevel) {
    if (currentLevel < 5) {
      return { material: 'ancient_rune_low', count: 2 + currentLevel };
    } else if (currentLevel < 10) {
      return { material: 'ancient_rune_mid', count: 1 + (currentLevel - 5) };
    } else {
      return { material: 'ancient_rune_high', count: 1 + (currentLevel - 10) };
    }
  },
  // 金币消耗
  getGoldCost: function(currentLevel, gradeIdx) {
    return (500 + currentLevel * 200) * (1 + gradeIdx * 0.5);
  },
};

// ===== 符文掉落概率（按品质）=====
var RUNE_DROP_RATES = {
  // 品质概率（按来源等级调整）
  // 副本掉落: 根据副本难度决定品质池
  cave: [
    { grade: 'common', weight: 40 },
    { grade: 'rare',   weight: 35 },
    { grade: 'epic',   weight: 18 },
    { grade: 'legend', weight: 6 },
    { grade: 'mythic', weight: 1 },
  ],
  treasure: [
    { grade: 'common', weight: 20 },
    { grade: 'rare',   weight: 35 },
    { grade: 'epic',   weight: 28 },
    { grade: 'legend', weight: 14 },
    { grade: 'mythic', weight: 3 },
  ],
  dig: [
    { grade: 'rare',   weight: 40 },
    { grade: 'epic',   weight: 35 },
    { grade: 'legend', weight: 20 },
    { grade: 'mythic', weight: 5 },
  ],
};

// 按权重随机选择品质
function rollRuneGrade(source) {
  var rates = RUNE_DROP_RATES[source] || RUNE_DROP_RATES.cave;
  var total = rates.reduce(function(s, r) { return s + r.weight; }, 0);
  var roll = Math.random() * total;
  var acc = 0;
  for (var i = 0; i < rates.length; i++) {
    acc += rates[i].weight;
    if (roll < acc) return rates[i].grade;
  }
  return rates[0].grade;
}

// 获取符文主属性中文名（v2.8.0 需求6.1：新增五维/魔法/闪避率）
function getRuneStatName(statType) {
  var names = {
    atk_flat: '攻击力', def_flat: '防御力', hp_flat: '气血',
    spd_flat: '速度', atk_pct: '攻击力%', def_pct: '防御力%',
    hp_pct: '气血%', crit_rate: '暴击率', crit_dmg: '暴击伤害',
    int_flat: '灵力', int_pct: '灵力%',
    mp_flat: '魔法', dodge_rate: '闪避率',
    str_flat: '力量', agi_flat: '敏捷', vit_flat: '体质',
    end_flat: '耐力', mag_flat: '魔力',
  };
  return names[statType] || statType;
}

// 格式化符文属性数值（v2.8.0 需求6.1：统一使用 isRuneStatPct 判断）
function formatRuneStatValue(statType, value) {
  if (isRuneStatPct(statType)) {
    return '+' + (value * 100).toFixed(1) + '%';
  }
  return '+' + Math.floor(value);
}


