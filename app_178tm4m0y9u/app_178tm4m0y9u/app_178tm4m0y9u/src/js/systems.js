// ===== systems.js : 鎴愬氨/Buff/澶╄祴绯荤粺 =====

// ==================== ACHIEVEMENT SYSTEM ====================
// 成就定义：阶梯式，可无限叠加，每个阶梯钻石奖励递增
const ACHIEVEMENT_DEFS = [
  { id: 'hatch', name: '孵化大师', desc: '累计孵化宠物蛋', icon: '🥚',
    milestones: [1, 5, 10, 25, 50, 100, 200, 500, 1000], baseReward: 10, rewardGrowth: 1.25 },
  { id: 'fuse', name: '融合专家', desc: '累计融合宠物', icon: '⚗️',
    milestones: [1, 5, 10, 25, 50, 100, 200, 500], baseReward: 15, rewardGrowth: 1.25 },
  { id: 'battle', name: '战斗狂人', desc: '累计完成战斗', icon: '⚔️',
    milestones: [10, 50, 100, 500, 1000, 5000, 10000], baseReward: 10, rewardGrowth: 1.15 },
  { id: 'dungeon', name: '副本达人', desc: '累计完成副本', icon: '🏰',
    milestones: [1, 5, 10, 25, 50, 100, 200], baseReward: 15, rewardGrowth: 1.2 },
  { id: 'tower', name: '登塔者', desc: '爬塔层数', icon: '🗼',
    milestones: [1, 5, 10, 25, 50, 75, 100], baseReward: 25, rewardGrowth: 1.25 },
  { id: 'arena', name: '竞技高手', desc: '竞技场胜场', icon: '🏆',
    milestones: [1, 5, 10, 25, 50, 100, 200], baseReward: 15, rewardGrowth: 1.2 },
  { id: 'pool_draw', name: '抽蛋玩家', desc: '宠物池抽蛋次数', icon: '🎰',
    milestones: [1, 5, 10, 25, 50, 100, 200], baseReward: 10, rewardGrowth: 1.2 },
  { id: 'forge', name: '锻造匠人', desc: '装备强化次数', icon: '🔨',
    milestones: [1, 5, 10, 25, 50, 100, 200], baseReward: 10, rewardGrowth: 1.15 },
  { id: 'gold_earn', name: '财富积累', desc: '累计获得金币', icon: '💰',
    milestones: [1000, 10000, 50000, 100000, 500000, 1000000], baseReward: 3, rewardGrowth: 1.15 },
  { id: 'map_clear', name: '地图征服', desc: '通关地图数', icon: '🗺️',
    milestones: [5, 10, 15, 20, 25, 35, 45, 55], baseReward: 10, rewardGrowth: 1.1 },
  { id: 'skill_learn', name: '技能学者', desc: '累计学习技能书', icon: '📖',
    milestones: [1, 5, 10, 25, 50, 100, 200], baseReward: 10, rewardGrowth: 1.2 },
  { id: 'diamond_earn', name: '钻石收藏家', desc: '累计获得钻石', icon: '💎',
    milestones: [50, 200, 500, 1000, 5000, 10000], baseReward: 15, rewardGrowth: 1.25 },
  { id: 'pet_collect', name: '宠物收藏家', desc: '收集宠物种类数', icon: '🐾',
    milestones: [3, 6, 10, 15, 20, 30, 50], baseReward: 12, rewardGrowth: 1.2 },
  { id: 'chest_open', name: '宝箱猎人', desc: '累计开启宝箱数', icon: '📦',
    milestones: [10, 50, 100, 500, 1000, 5000], baseReward: 10, rewardGrowth: 1.2 },
  { id: 'rebirth', name: '轮回者', desc: '转生次数', icon: '🔄',
    milestones: [1, 2, 3, 5, 7, 10], baseReward: 50, rewardGrowth: 1.3 },
];

function updateAchievement(id, amount) {
  if (!G.achievements) G.achievements = {};
  if (!G.achievements[id]) G.achievements[id] = 0;
  G.achievements[id] += amount;
}

// 统一的金币增加函数，自动记录成就
function addGold(amount) {
  var mult = getBuffMult('gold_mult') * (1 + getTalentBonus('gold_bonus') + getTalentBonus('gold_mastery') + getTalentBonus('growth_mastery') + getTalentBonus('loot_mastery'));
  var gain = Math.floor(amount * mult);
  G.player.gold += gain;
  updateAchievement('gold_earn', gain);
  if (typeof updateDailyTask === 'function') updateDailyTask('gold_earn_5k', gain);
  return gain;
}

// 统一的钻石增加函数，自动记录成就（修复钻石收藏家不计数bug）
function addDiamond(amount) {
  if (!amount || amount <= 0) return 0;
  G.player.diamond += amount;
  updateAchievement('diamond_earn', amount);
  return amount;
}

// ==================== BUFF SYSTEM ====================

// 激活Buff：修复bug - 高buff时禁用低buff，持续时间独立不叠加
function activateBuff(buffType, mult, durationMin) {
  if (!G.buffs) G.buffs = {};
  var now = Date.now();
  var expireAt = now + durationMin * 60 * 1000;
  // 修复：已有同类buff时，新buff倍率必须 >= 现有倍率才能激活
  // 持续时间独立计算，不再叠加（避免低倍率buff延长高倍率buff的bug）
  if (G.buffs[buffType]) {
    var existing = G.buffs[buffType];
    // 检查现有buff是否过期
    if (now > existing.expireAt) {
      // 已过期，直接激活新buff
      G.buffs[buffType] = { mult: mult, expireAt: expireAt };
      return true;
    }
    // 未过期：新buff倍率必须 >= 现有倍率才能激活（替换，非叠加）
    if (mult >= existing.mult) {
      G.buffs[buffType] = { mult: mult, expireAt: expireAt };
      return true;
    } else {
      // 新buff倍率低于现有buff，拒绝激活
      return false;
    }
  } else {
    G.buffs[buffType] = { mult: mult, expireAt: expireAt };
    return true;
  }
}

function getBuffMult(buffType) {
  if (!G.buffs) return 1;
  var buff = G.buffs[buffType];
  if (!buff) return 1;
  if (Date.now() > buff.expireAt) { delete G.buffs[buffType]; return 1; }
  return buff.mult || 1;
}

// 获取flat值buff（如all_stat），默认返回0而非1
function getFlatBuff(buffType) {
  if (!G.buffs) return 0;
  var buff = G.buffs[buffType];
  if (!buff) return 0;
  if (Date.now() > buff.expireAt) { delete G.buffs[buffType]; return 0; }
  return buff.mult || 0;
}

function getBuffRemainingText(buffType) {
  if (!G.buffs || !G.buffs[buffType]) return '';
  var buff = G.buffs[buffType];
  var remaining = buff.expireAt - Date.now();
  if (remaining <= 0) { delete G.buffs[buffType]; return ''; }
  var min = Math.floor(remaining / 60000);
  var sec = Math.floor((remaining % 60000) / 1000);
  return min + '分' + sec + '秒';
}

// 获取当前激活的buff列表（用于展示）
function getActiveBuffs() {
  if (!G.buffs) return [];
  var now = Date.now();
  var result = [];
  Object.keys(G.buffs).forEach(function(key) {
    var b = G.buffs[key];
    if (b && b.expireAt > now) {
      result.push({ type: key, mult: b.mult, remaining: b.expireAt - now });
    } else if (b) {
      delete G.buffs[key];
    }
  });
  return result;
}

// ==================== TALENT SYSTEM (星图) ====================

const TALENT_TREE = [
  // 中心起点（自动点亮，无效果）
  { id: 'origin', name: '星图之源', icon: '✦', branch: 'center', type: 'origin', x: 500, y: 390, maxLevel: 1, perLevel: 0, requires: [],
    desc: function(lv){ return '星图中心，所有星轨由此展开'; } },
  // ===== 寻宝星轨（向上，金色）— 14节点，56点 =====
  { id: 'chest_drop', name: '寻宝直觉', icon: '📦', branch: 'loot', type: 'small', x: 500, y: 310, maxLevel: 5, perLevel: 0.02, requires: ['origin'],
    desc: function(lv){ return '宝箱掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'gold_bonus', name: '财富之心', icon: '💰', branch: 'loot', type: 'small', x: 380, y: 260, maxLevel: 5, perLevel: 0.04, requires: ['chest_drop'],
    desc: function(lv){ return '金币获取 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'gold_mastery', name: '财富精通', icon: '💰', branch: 'loot', type: 'small', x: 280, y: 290, maxLevel: 4, perLevel: 0.04, requires: ['gold_bonus'],
    desc: function(lv){ return '金币额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'diamond_find', name: '璀璨之眼', icon: '💎', branch: 'loot', type: 'medium', x: 180, y: 240, maxLevel: 4, perLevel: 0.04, requires: ['gold_mastery'],
    desc: function(lv){ return '钻石掉落加成 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'diamond_mastery', name: '钻石精通', icon: '💎', branch: 'loot', type: 'small', x: 80, y: 270, maxLevel: 3, perLevel: 0.03, requires: ['diamond_find'],
    desc: function(lv){ return '钻石额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'egg_drop', name: '生命恩赐', icon: '🥚', branch: 'loot', type: 'small', x: 620, y: 260, maxLevel: 4, perLevel: 0.025, requires: ['chest_drop'],
    desc: function(lv){ return '宠物蛋掉落加成 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'egg_quality', name: '生命精纯', icon: '🥚', branch: 'loot', type: 'small', x: 720, y: 290, maxLevel: 3, perLevel: 0.02, requires: ['egg_drop'],
    desc: function(lv){ return '宠物蛋品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'map_drop', name: '藏宝之眼', icon: '🗺️', branch: 'loot', type: 'small', x: 820, y: 260, maxLevel: 4, perLevel: 0.03, requires: ['egg_drop'],
    desc: function(lv){ return '藏宝图掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'equip_drop', name: '装备共鸣', icon: '⚔️', branch: 'loot', type: 'small', x: 380, y: 180, maxLevel: 4, perLevel: 0.03, requires: ['gold_bonus'],
    desc: function(lv){ return '装备掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'equip_quality', name: '装备精铸', icon: '⚔️', branch: 'loot', type: 'small', x: 280, y: 150, maxLevel: 3, perLevel: 0.025, requires: ['equip_drop'],
    desc: function(lv){ return '装备品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'socket_nail_drop', name: '锻造之钉', icon: '🔨', branch: 'loot', type: 'medium', x: 500, y: 130, maxLevel: 4, perLevel: 0.04, requires: ['equip_drop', 'diamond_find'],
    desc: function(lv){ return '打孔钉掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'repair_glue_drop', name: '修补之胶', icon: '🩹', branch: 'loot', type: 'medium', x: 620, y: 170, maxLevel: 4, perLevel: 0.04, requires: ['map_drop'],
    desc: function(lv){ return '修补胶掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'gem_drop_rate', name: '宝石之眼', icon: '💠', branch: 'loot', type: 'medium', x: 720, y: 150, maxLevel: 4, perLevel: 0.05, requires: ['repair_glue_drop'],
    desc: function(lv){ return '宝石副本掉落量 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'loot_mastery', name: '寻宝大师', icon: '👑', branch: 'loot', type: 'core', x: 500, y: 60, maxLevel: 5, perLevel: 0.04, requires: ['socket_nail_drop', 'repair_glue_drop'],
    desc: function(lv){ return '所有掉落加成 +' + (lv*this.perLevel*100).toFixed(0) + '%（宝箱/金币/钻石/蛋/装备/宝图/打孔钉/修补胶）'; } },
  // ===== 成长星轨（向右，绿色）— 10节点，38点 =====
  { id: 'exp_bonus', name: '智慧之泉', icon: '⭐', branch: 'growth', type: 'small', x: 580, y: 390, maxLevel: 6, perLevel: 0.03, requires: ['origin'],
    desc: function(lv){ return '经验获取 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'exp_mastery', name: '智慧精通', icon: '⭐', branch: 'growth', type: 'small', x: 660, y: 360, maxLevel: 4, perLevel: 0.03, requires: ['exp_bonus'],
    desc: function(lv){ return '经验额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'skill_drop', name: '秘典领悟', icon: '📖', branch: 'growth', type: 'small', x: 740, y: 390, maxLevel: 4, perLevel: 0.025, requires: ['exp_bonus'],
    desc: function(lv){ return '技能书掉落 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'skill_quality', name: '秘典精纯', icon: '📖', branch: 'growth', type: 'small', x: 820, y: 360, maxLevel: 3, perLevel: 0.02, requires: ['skill_drop'],
    desc: function(lv){ return '技能书品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'mp_efficiency', name: '魔力亲和', icon: '🔮', branch: 'growth', type: 'medium', x: 660, y: 470, maxLevel: 4, perLevel: 0.04, requires: ['exp_bonus'],
    desc: function(lv){ return '技能魔法消耗 -' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'hatch_speed', name: '孵化秘术', icon: '⚡', branch: 'growth', type: 'medium', x: 740, y: 470, maxLevel: 4, perLevel: 0.06, requires: ['skill_drop'],
    desc: function(lv){ return '孵化速度 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'hatch_speed_2', name: '神速孵化', icon: '⚡', branch: 'growth', type: 'medium', x: 820, y: 500, maxLevel: 3, perLevel: 0.05, requires: ['hatch_speed'],
    desc: function(lv){ return '孵化速度额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'buff_duration', name: '祝福延续', icon: '✨', branch: 'growth', type: 'small', x: 900, y: 400, maxLevel: 3, perLevel: 0.05, requires: ['skill_quality'],
    desc: function(lv){ return '增益持续时间 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'exp_special', name: '奇遇之缘', icon: '🌟', branch: 'growth', type: 'small', x: 900, y: 470, maxLevel: 3, perLevel: 0.04, requires: ['hatch_speed_2'],
    desc: function(lv){ return '特殊事件经验 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'growth_mastery', name: '成长大师', icon: '👑', branch: 'growth', type: 'core', x: 950, y: 430, maxLevel: 4, perLevel: 0.04, requires: ['buff_duration', 'exp_special'],
    desc: function(lv){ return '经验与金币额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  // ===== 战斗星轨（向左下，红色）— 18节点，65点 =====
  { id: 'pet_atk', name: '战宠统御', icon: '⚔️', branch: 'combat', type: 'small', x: 420, y: 390, maxLevel: 6, perLevel: 0.02, requires: ['origin'],
    desc: function(lv){ return '全队宠物攻击力 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_atk_2', name: '战宠精通', icon: '⚔️', branch: 'combat', type: 'small', x: 340, y: 420, maxLevel: 4, perLevel: 0.02, requires: ['pet_atk'],
    desc: function(lv){ return '宠物攻击力额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_atk_3', name: '战宠觉醒', icon: '⚔️', branch: 'combat', type: 'medium', x: 260, y: 440, maxLevel: 3, perLevel: 0.015, requires: ['pet_atk_2'],
    desc: function(lv){ return '宠物攻击力再 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_hp', name: '生命守护', icon: '❤️', branch: 'combat', type: 'small', x: 420, y: 470, maxLevel: 6, perLevel: 0.02, requires: ['pet_atk'],
    desc: function(lv){ return '全队宠物气血 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_hp_2', name: '生命之泉', icon: '❤️', branch: 'combat', type: 'small', x: 340, y: 500, maxLevel: 4, perLevel: 0.02, requires: ['pet_hp'],
    desc: function(lv){ return '宠物气血额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_hp_3', name: '生命觉醒', icon: '❤️', branch: 'combat', type: 'medium', x: 260, y: 520, maxLevel: 3, perLevel: 0.015, requires: ['pet_hp_2'],
    desc: function(lv){ return '宠物气血再 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_def', name: '坚韧之力', icon: '🛡️', branch: 'combat', type: 'medium', x: 340, y: 570, maxLevel: 4, perLevel: 0.03, requires: ['pet_hp_2'],
    desc: function(lv){ return '宠物防御 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_def_2', name: '钢铁意志', icon: '🛡️', branch: 'combat', type: 'medium', x: 260, y: 590, maxLevel: 3, perLevel: 0.02, requires: ['pet_def'],
    desc: function(lv){ return '宠物防御额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_crit', name: '致命一击', icon: '🎯', branch: 'combat', type: 'medium', x: 180, y: 540, maxLevel: 4, perLevel: 0.015, requires: ['pet_def'],
    desc: function(lv){ return '宠物暴击率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_crit_dmg', name: '暴击精通', icon: '💥', branch: 'combat', type: 'medium', x: 100, y: 510, maxLevel: 4, perLevel: 0.04, requires: ['pet_crit'],
    desc: function(lv){ return '宠物暴击伤害 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_dodge', name: '灵动之躯', icon: '💫', branch: 'combat', type: 'medium', x: 180, y: 620, maxLevel: 4, perLevel: 0.015, requires: ['pet_def'],
    desc: function(lv){ return '宠物闪避率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_speed', name: '迅捷之风', icon: '💨', branch: 'combat', type: 'small', x: 100, y: 650, maxLevel: 3, perLevel: 0.02, requires: ['pet_dodge'],
    desc: function(lv){ return '宠物速度 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_skill_trigger', name: '法术共鸣', icon: '✨', branch: 'combat', type: 'medium', x: 340, y: 640, maxLevel: 4, perLevel: 0.02, requires: ['pet_def'],
    desc: function(lv){ return '主动技能触发率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_skill_dmg', name: '法术穿透', icon: '🔮', branch: 'combat', type: 'medium', x: 260, y: 670, maxLevel: 4, perLevel: 0.03, requires: ['pet_skill_trigger'],
    desc: function(lv){ return '技能伤害 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_lifesteal', name: '吸血之印', icon: '🩸', branch: 'combat', type: 'medium', x: 180, y: 700, maxLevel: 3, perLevel: 0.02, requires: ['pet_skill_trigger'],
    desc: function(lv){ return '宠物吸血 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_resolve', name: '坚毅之心', icon: '🛡️', branch: 'combat', type: 'small', x: 100, y: 730, maxLevel: 3, perLevel: 0.03, requires: ['pet_dodge'],
    desc: function(lv){ return '宠物减伤 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'combat_mastery', name: '战斗大师', icon: '👑', branch: 'combat', type: 'core', x: 340, y: 720, maxLevel: 4, perLevel: 0.04, requires: ['pet_def_2', 'pet_skill_trigger'],
    desc: function(lv){ return '宠物攻击与气血额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'combat_ultimate', name: '战神之巅', icon: '🌟', branch: 'combat', type: 'core', x: 220, y: 760, maxLevel: 3, perLevel: 0.05, requires: ['combat_mastery'],
    desc: function(lv){ return '宠物全属性 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  // 总点数：56+38+65 = 159点（满足"所有天赋点满至少150点"要求）
];

const TALENT_BRANCHES = {
  center: { name: '星图之源', icon: '✦', color: '#e5e7eb' },
  loot: { name: '寻宝星轨', icon: '🗺️', color: '#f59e0b' },
  growth: { name: '成长星轨', icon: '🌱', color: '#22c55e' },
  combat: { name: '战斗星轨', icon: '⚔️', color: '#ef4444' },
};

function getTalentLevel(id) {
  if (!G.talents) G.talents = {};
  return G.talents[id] || 0;
}

function getTalentBonus(id) {
  var def = TALENT_TREE.find(function(t){ return t.id === id; });
  if (!def) return 0;
  return getTalentLevel(id) * def.perLevel;
}

function getTalentPoints() {
  if (!G.talentPoints) G.talentPoints = 0;
  return G.talentPoints;
}

// 判断天赋节点是否满足前置条件（所有 requires 节点至少1级）
function canUnlockTalent(id) {
  var def = TALENT_TREE.find(function(t){ return t.id === id; });
  if (!def) return false;
  if (def.type === 'origin') return true;
  if (!def.requires || def.requires.length === 0) return true;
  return def.requires.every(function(reqId){ return getTalentLevel(reqId) >= 1; });
}

function upgradeTalent(id) {
  var def = TALENT_TREE.find(function(t){ return t.id === id; });
  if (!def) return;
  if (def.type === 'origin') { showToast('星图之源已激活', 'info'); return; }
  var lv = getTalentLevel(id);
  if (lv >= def.maxLevel) { showToast('该天赋已满级！', 'error'); return; }
  if (!canUnlockTalent(id)) { showToast('需要先点亮前置天赋！', 'error'); return; }
  if (getTalentPoints() < 1) { showToast('天赋点不足！', 'error'); return; }
  G.talents[id] = lv + 1;
  G.talentPoints -= 1;
  saveGame();
  render();
  var label = def.type === 'core' ? '【核心天赋】' : '';
  showToast(def.icon + ' ' + label + def.name + ' 升至 ' + (lv+1) + ' 级！', 'success');
}

// 经验曲线公式：基于等级计算升到下一级所需经验
// 平衡调整：1.8→1.6，缓解后期升级过慢的问题
// Lv1->2: 200, Lv10->11: ~2190, Lv50->51: ~25700, Lv100->101: ~129000
function getExpForLevel(lv) {
  return Math.floor(100 * Math.pow(lv, 1.6) + 100);
}

// 统一的加经验函数：应用经验buff和天赋加成，处理升级和天赋点
// 天赋点规则：转生后已获得天赋点的等级不会重复获得，只有突破后的等级才获得天赋点
// 通过 talentPointsEarned 记录已发放天赋点的最高等级
function addExp(amount) {
  var growthMastery = getTalentBonus('growth_mastery');
  var mult = getBuffMult('exp_mult') * (1 + getTalentBonus('exp_bonus') + getTalentBonus('exp_mastery') + growthMastery);
  var gain = Math.floor(amount * mult);
  G.player.exp += gain;
  while (G.player.exp >= G.player.expToNext && G.player.level < G.player.maxLevel) {
    G.player.exp -= G.player.expToNext;
    G.player.level++;
    G.player.expToNext = getExpForLevel(G.player.level);
    // 天赋点：只在超过 rebirth*10 的等级时发放（配合已发放最高等级记录）
    // 0转：1-100级发放100点；1转：101-110级发放10点；2转：111-120级发放10点...5转共150点
    var talentThreshold = (G.player.rebirth || 0) * 10;
    if (G.player.level > talentThreshold && G.player.level > (G.talentPointsEarned || 0)) {
      G.talentPoints = (G.talentPoints || 0) + 1;
      G.talentPointsEarned = G.player.level;
      addBattleLog('info', '🎉 升级了！当前等级 ' + G.player.level + '（获得1天赋点）');
    } else {
      addBattleLog('info', '🎉 升级了！当前等级 ' + G.player.level + '（已获得的等级，无新天赋点）');
    }
    G.pets.forEach(function(p){ p.level = G.player.level; });
    // 需求1：升级后检查主线任务是否可升级
    if (typeof checkMainQuestUpgrade === 'function') checkMainQuestUpgrade();
    // 需求5：检查是否有新功能解锁并显示剧情通知
    if (typeof checkNewlyUnlockedFeatures === 'function') {
      var unlocked = checkNewlyUnlockedFeatures(G.player.level);
      unlocked.forEach(function(featId) {
        var story = getFeatureUnlockStory(featId);
        var featureName = FEATURE_UNLOCK_LEVELS && Object.keys(FEATURE_UNLOCK_LEVELS).indexOf(featId) >= 0 ? featId : featId;
        if (story) {
          addBattleLog('info', '🔓 ' + story);
        } else {
          addBattleLog('info', '🔓 新功能「' + featId + '」已解锁！');
        }
        // 同时弹出toast提示
        if (typeof showToast === 'function') {
          showToast('🔓 等级 ' + G.player.level + ' 解锁新功能！', 'success');
        }
      });
    }
  }
  return gain;
}

function addTalentPoints(n) {
  G.talentPoints = (G.talentPoints || 0) + n;
}

function setAchievement(id, value) {
  if (!G.achievements) G.achievements = {};
  if (!G.achievements[id] || value > G.achievements[id]) G.achievements[id] = value;
}

function getAchievementProgress(id) {
  if (!G.achievements) return 0;
  return G.achievements[id] || 0;
}

function getAchievementMilestone(def, tier) {
  // tier 0 = first milestone, tier 1 = second, etc. 无限阶
  if (tier < def.milestones.length) return def.milestones[tier];
  // 超过预定义的里程碑：按rewardGrowth比例外推
  var last = def.milestones[def.milestones.length - 1];
  var extra = tier - def.milestones.length + 1;
  return Math.floor(last * Math.pow(def.rewardGrowth, extra));
}

function getAchievementReward(def, tier) {
  // 奖励按rewardGrowth递增，无限阶
  return Math.floor(def.baseReward * Math.pow(def.rewardGrowth, tier));
}

function getCurrentAchievementTier(def, progress) {
  // 找到已达成的最高阶
  var tier = -1;
  for (var i = 0; i < 10000; i++) {
    if (getAchievementMilestone(def, i) <= progress) tier = i;
    else break;
  }
  return tier;
}

function claimAchievementReward(id, milestone) {
  var def = ACHIEVEMENT_DEFS.find(function(d) { return d.id === id; });
  if (!def) return false;
  var progress = getAchievementProgress(id);
  if (progress < milestone) return false;
  var claimKey = id + '_' + milestone;
  if (!G.achievementRewardsClaimed) G.achievementRewardsClaimed = {};
  if (G.achievementRewardsClaimed[claimKey]) return false;
  // 找到该milestone对应的tier
  var tier = -1;
  for (var i = 0; i < 10000; i++) {
    if (getAchievementMilestone(def, i) === milestone) { tier = i; break; }
    if (getAchievementMilestone(def, i) > milestone) break;
  }
  if (tier < 0) return false;
  var reward = getAchievementReward(def, tier);
  G.achievementRewardsClaimed[claimKey] = true;
  addDiamond(reward);
  saveGame();
  render();
  showToast('成就达成：' + def.name + ' ' + milestone + '次！获得 💎' + reward, 'success');
  return true;
}

function renderAchievementScreen() {
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🏆 成就</h1>
      <span class="text-blue-400 text-sm">💎 ${G.player.diamond.toLocaleString()}</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-3">
      ${ACHIEVEMENT_DEFS.map(def => {
        var progress = getAchievementProgress(def.id);
        var currentTier = getCurrentAchievementTier(def, progress);
        var nextTier = currentTier + 1;
        var nextMilestone = getAchievementMilestone(def, nextTier);
        var prevMilestone = currentTier >= 0 ? getAchievementMilestone(def, currentTier) : 0;
        // 收集所有可领取的（当前tier及以下未领取的）
        var claimable = [];
        for (var i = 0; i <= currentTier; i++) {
          var ms = getAchievementMilestone(def, i);
          if (!G.achievementRewardsClaimed[def.id + '_' + ms]) claimable.push({ tier: i, milestone: ms });
        }
        var pct = Math.min(100, Math.floor((progress - prevMilestone) / (nextMilestone - prevMilestone) * 100));
        var nextReward = getAchievementReward(def, nextTier);
        return '<div class="bg-card border border-game rounded-xl p-4">' +
          '<div class="flex items-center justify-between mb-2">' +
          '<div class="flex items-center gap-2">' +
          '<span class="text-2xl">' + def.icon + '</span>' +
          '<div><p class="font-bold text-sm">' + def.name + '</p>' +
          '<p class="text-xs text-secondary">' + def.desc + ' · 当前进度 ' + progress.toLocaleString() + (currentTier >= 0 ? '（第' + (currentTier + 1) + '阶）' : '') + '</p></div>' +
          '</div>' +
          '<span class="text-xs text-blue-400">下一阶 💎' + nextReward + '</span>' +
          '</div>' +
          '<div class="progress-bar mb-1"><div class="progress-fill bg-gradient-to-r from-blue-500 to-purple-500" style="width:' + pct + '%"></div></div>' +
          '<p class="text-xs text-secondary mb-1">' + progress.toLocaleString() + '/' + nextMilestone.toLocaleString() + '</p>' +
          (claimable.length > 0 ?
            '<div class="flex flex-wrap gap-1 mt-2">' +
            claimable.map(function(c) {
              var r = getAchievementReward(def, c.tier);
              return '<button class="btn-gold btn-sm text-xs" onclick="claimAchievementReward(\'' + def.id + '\',' + c.milestone + ')">领取 ' + c.milestone.toLocaleString() + ' 💎' + r + '</button>';
            }).join('') +
            '</div>' : '') +
          '</div>';
      }).join('')}
    </main>
  </div>`;
}

