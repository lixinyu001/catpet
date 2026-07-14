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
    milestones: [25, 50, 75, 100, 125, 175, 225, 275], baseReward: 10, rewardGrowth: 1.1 },
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
  // 需求15：时间系统金币加成
  var timeEff = (typeof getTimePhaseEffects === 'function') ? getTimePhaseEffects() : {};
  if (timeEff.goldMult) mult *= timeEff.goldMult;
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

// v2.10.0 需求6.1：天赋树全面重构（7大专精分支）
// 分支：战斗攻击/战斗防御/常规资源系/装备养成系/宠物养成系/藏宝图专属/副本活动
// 总点数320点，玩家最多获得160点（6次转生达160级），无法点满全树
const TALENT_TREE = [
  // 中心起点（自动点亮，无效果）
  { id: 'origin', name: '星图之源', icon: '✦', branch: 'center', type: 'origin', x: 500, y: 410, maxLevel: 1, perLevel: 0, requires: [],
    desc: function(lv){ return '星图中心，七大专精方向由此展开'; } },

  // ===== 战斗攻击分支（右上，红色）— 16节点，71点 =====
  { id: 'pet_atk', name: '战宠统御', icon: '⚔️', branch: 'attack', type: 'small', x: 560, y: 380, maxLevel: 6, perLevel: 0.02, requires: ['origin'],
    desc: function(lv){ return '全队宠物攻击力 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_atk_2', name: '战宠精通', icon: '⚔️', branch: 'attack', type: 'small', x: 620, y: 350, maxLevel: 4, perLevel: 0.02, requires: ['pet_atk'],
    desc: function(lv){ return '宠物攻击力额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_atk_3', name: '战宠觉醒', icon: '⚔️', branch: 'attack', type: 'medium', x: 690, y: 320, maxLevel: 3, perLevel: 0.015, requires: ['pet_atk_2'],
    desc: function(lv){ return '宠物攻击力再 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_crit', name: '致命一击', icon: '🎯', branch: 'attack', type: 'medium', x: 560, y: 320, maxLevel: 4, perLevel: 0.015, requires: ['pet_atk'],
    desc: function(lv){ return '宠物暴击率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_crit_dmg', name: '暴击精通', icon: '�', branch: 'attack', type: 'medium', x: 620, y: 280, maxLevel: 4, perLevel: 0.04, requires: ['pet_crit'],
    desc: function(lv){ return '宠物暴击伤害 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_skill_trigger', name: '法术共鸣', icon: '✨', branch: 'attack', type: 'medium', x: 560, y: 270, maxLevel: 4, perLevel: 0.02, requires: ['pet_atk'],
    desc: function(lv){ return '主动技能触发率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_skill_dmg', name: '法术穿透', icon: '�', branch: 'attack', type: 'medium', x: 620, y: 220, maxLevel: 4, perLevel: 0.03, requires: ['pet_skill_trigger'],
    desc: function(lv){ return '技能伤害 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'crit_cap_raise', name: '暴击上限', icon: '🎯', branch: 'attack', type: 'small', x: 680, y: 230, maxLevel: 4, perLevel: 0.01, requires: ['pet_crit_dmg'],
    desc: function(lv){ return '宠物暴击率上限 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'skill_empower', name: '秘法强化', icon: '�', branch: 'attack', type: 'small', x: 680, y: 170, maxLevel: 5, perLevel: 0.03, requires: ['pet_skill_dmg'],
    desc: function(lv){ return '技能伤害额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'skill_crit', name: '法术暴击', icon: '💫', branch: 'attack', type: 'medium', x: 740, y: 200, maxLevel: 5, perLevel: 0.015, requires: ['crit_cap_raise'],
    desc: function(lv){ return '技能可触发暴击，暴击率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_lifesteal', name: '吸血之印', icon: '�', branch: 'attack', type: 'medium', x: 800, y: 160, maxLevel: 4, perLevel: 0.02, requires: ['pet_skill_dmg'],
    desc: function(lv){ return '宠物吸血 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'atk_overdrive', name: '攻击超载', icon: '⚡', branch: 'attack', type: 'medium', x: 740, y: 280, maxLevel: 5, perLevel: 0.02, requires: ['pet_atk_3'],
    desc: function(lv){ return '宠物攻击力超载 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'atk_breakthrough', name: '破甲之力', icon: '🗡️', branch: 'attack', type: 'medium', x: 800, y: 240, maxLevel: 5, perLevel: 0.015, requires: ['atk_overdrive'],
    desc: function(lv){ return '攻击无视防御 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'output_mastery_2', name: '输出精通', icon: '👑', branch: 'attack', type: 'medium', x: 740, y: 120, maxLevel: 5, perLevel: 0.03, requires: ['skill_empower', 'skill_crit'],
    desc: function(lv){ return '攻击与技能伤害额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'combat_mastery', name: '战斗大师', icon: '👑', branch: 'attack', type: 'core', x: 820, y: 80, maxLevel: 4, perLevel: 0.04, requires: ['output_mastery_2', 'pet_lifesteal'],
    desc: function(lv){ return '宠物攻击与气血额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'combat_ultimate', name: '战神之巅', icon: '🌟', branch: 'attack', type: 'core', x: 900, y: 50, maxLevel: 5, perLevel: 0.04, requires: ['combat_mastery'],
    desc: function(lv){ return '宠物全属性 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },

  // ===== 战斗防御分支（右下，蓝色）— 16节点，68点 =====
  { id: 'pet_hp', name: '生命守护', icon: '❤️', branch: 'defense', type: 'small', x: 560, y: 440, maxLevel: 6, perLevel: 0.02, requires: ['origin'],
    desc: function(lv){ return '全队宠物气血 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_hp_2', name: '生命之泉', icon: '❤️', branch: 'defense', type: 'small', x: 620, y: 470, maxLevel: 4, perLevel: 0.02, requires: ['pet_hp'],
    desc: function(lv){ return '宠物气血额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_hp_3', name: '生命觉醒', icon: '❤️', branch: 'defense', type: 'medium', x: 690, y: 490, maxLevel: 3, perLevel: 0.015, requires: ['pet_hp_2'],
    desc: function(lv){ return '宠物气血再 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_def', name: '坚韧之力', icon: '🛡️', branch: 'defense', type: 'medium', x: 560, y: 500, maxLevel: 4, perLevel: 0.03, requires: ['pet_hp'],
    desc: function(lv){ return '宠物防御 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_def_2', name: '钢铁意志', icon: '🛡️', branch: 'defense', type: 'medium', x: 620, y: 540, maxLevel: 3, perLevel: 0.02, requires: ['pet_def'],
    desc: function(lv){ return '宠物防御额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_dodge', name: '灵动之躯', icon: '�', branch: 'defense', type: 'medium', x: 560, y: 560, maxLevel: 4, perLevel: 0.015, requires: ['pet_def'],
    desc: function(lv){ return '宠物闪避率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_speed', name: '迅捷之风', icon: '💨', branch: 'defense', type: 'small', x: 620, y: 600, maxLevel: 3, perLevel: 0.02, requires: ['pet_dodge'],
    desc: function(lv){ return '宠物速度 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_resolve', name: '坚毅之心', icon: '🛡️', branch: 'defense', type: 'small', x: 560, y: 630, maxLevel: 3, perLevel: 0.03, requires: ['pet_dodge'],
    desc: function(lv){ return '宠物减伤 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'hp_regen', name: '回春之术', icon: '💚', branch: 'defense', type: 'medium', x: 740, y: 520, maxLevel: 5, perLevel: 0.02, requires: ['pet_hp_3'],
    desc: function(lv){ return '宠物每回合回血 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'dmg_reduce', name: '减伤精通', icon: '🛡️', branch: 'defense', type: 'medium', x: 680, y: 580, maxLevel: 5, perLevel: 0.015, requires: ['pet_def_2'],
    desc: function(lv){ return '受到伤害减少 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'hp_breakthrough', name: '生命突破', icon: '❤️', branch: 'defense', type: 'medium', x: 800, y: 560, maxLevel: 5, perLevel: 0.02, requires: ['hp_regen'],
    desc: function(lv){ return '宠物气血突破 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'shield_mastery', name: '护盾精通', icon: '�️', branch: 'defense', type: 'medium', x: 740, y: 620, maxLevel: 5, perLevel: 0.03, requires: ['dmg_reduce'],
    desc: function(lv){ return '获得护盾值 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'def_breakthrough', name: '防御突破', icon: '⚔️', branch: 'defense', type: 'medium', x: 800, y: 660, maxLevel: 5, perLevel: 0.02, requires: ['dmg_reduce'],
    desc: function(lv){ return '宠物防御突破 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'dodge_mastery', name: '闪避精通', icon: '💫', branch: 'defense', type: 'small', x: 680, y: 640, maxLevel: 4, perLevel: 0.015, requires: ['pet_dodge'],
    desc: function(lv){ return '宠物闪避率额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'survival_core', name: '生存核心', icon: '👑', branch: 'defense', type: 'core', x: 860, y: 680, maxLevel: 5, perLevel: 0.03, requires: ['hp_breakthrough', 'def_breakthrough', 'shield_mastery'],
    desc: function(lv){ return '气血与防御额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'survival_ultimate', name: '不灭之躯', icon: '🌟', branch: 'defense', type: 'core', x: 920, y: 740, maxLevel: 4, perLevel: 0.04, requires: ['survival_core'],
    desc: function(lv){ return '受到致命伤害时' + (lv*this.perLevel*100).toFixed(0) + '%概率保留1点生命'; } },

  // ===== 装备养成系（左上，紫色）— 6节点，25点 =====
  // v2.10.0 需求6.1：从原资源分支拆分，专注装备/强化石/打孔道具/宝石等装备相关掉落
  { id: 'chest_drop', name: '寻宝直觉', icon: '📦', branch: 'drop_equip', type: 'small', x: 440, y: 380, maxLevel: 5, perLevel: 0.02, requires: ['origin'],
    desc: function(lv){ return '宝箱掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'equip_drop', name: '装备共鸣', icon: '⚔️', branch: 'drop_equip', type: 'small', x: 360, y: 310, maxLevel: 4, perLevel: 0.03, requires: ['chest_drop'],
    desc: function(lv){ return '装备掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'equip_quality', name: '装备精铸', icon: '⚔️', branch: 'drop_equip', type: 'small', x: 280, y: 270, maxLevel: 3, perLevel: 0.025, requires: ['equip_drop'],
    desc: function(lv){ return '装备品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'socket_nail_drop', name: '锻造之钉', icon: '�', branch: 'drop_equip', type: 'medium', x: 360, y: 250, maxLevel: 4, perLevel: 0.04, requires: ['equip_drop'],
    desc: function(lv){ return '打孔钉掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'gem_drop_rate', name: '宝石之眼', icon: '💠', branch: 'drop_equip', type: 'medium', x: 320, y: 200, maxLevel: 4, perLevel: 0.05, requires: ['socket_nail_drop'],
    desc: function(lv){ return '宝石副本掉落量 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'chest_quality', name: '宝箱精纯', icon: '📦', branch: 'drop_equip', type: 'small', x: 240, y: 220, maxLevel: 5, perLevel: 0.025, requires: ['equip_quality'],
    desc: function(lv){ return '宝箱品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },

  // ===== 常规资源系（左上，金色）— 8节点，36点 =====
  // v2.10.0 需求6.1：从原资源分支拆分，专注金币/钻石等基础货币掉落加成
  { id: 'gold_bonus', name: '财富之心', icon: '💰', branch: 'drop_regular', type: 'small', x: 380, y: 360, maxLevel: 5, perLevel: 0.04, requires: ['chest_drop'],
    desc: function(lv){ return '金币获取 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'gold_mastery', name: '财富精通', icon: '�', branch: 'drop_regular', type: 'small', x: 300, y: 370, maxLevel: 4, perLevel: 0.04, requires: ['gold_bonus'],
    desc: function(lv){ return '金币额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'diamond_find', name: '璀璨之眼', icon: '💎', branch: 'drop_regular', type: 'medium', x: 220, y: 350, maxLevel: 4, perLevel: 0.04, requires: ['gold_mastery'],
    desc: function(lv){ return '钻石掉落加成 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'diamond_mastery', name: '钻石精通', icon: '💎', branch: 'drop_regular', type: 'small', x: 140, y: 350, maxLevel: 3, perLevel: 0.03, requires: ['diamond_find'],
    desc: function(lv){ return '钻石额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'fragment_drop', name: '碎片收集', icon: '�', branch: 'drop_regular', type: 'medium', x: 160, y: 280, maxLevel: 5, perLevel: 0.03, requires: ['diamond_mastery'],
    desc: function(lv){ return '碎片掉落 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'resource_mastery_2', name: '资源精通', icon: '�', branch: 'drop_regular', type: 'medium', x: 280, y: 160, maxLevel: 5, perLevel: 0.03, requires: ['gem_drop_rate', 'chest_quality'],
    desc: function(lv){ return '所有掉落额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'loot_mastery', name: '寻宝大师', icon: '👑', branch: 'drop_regular', type: 'core', x: 360, y: 120, maxLevel: 5, perLevel: 0.04, requires: ['resource_mastery_2', 'repair_glue_drop'],
    desc: function(lv){ return '所有掉落加成 +' + (lv*this.perLevel*100).toFixed(0) + '%（宝箱/金币/钻石/蛋/装备/宝图/打孔钉/修补胶）'; } },
  { id: 'resource_ultimate', name: '财富之巅', icon: '🌟', branch: 'drop_regular', type: 'core', x: 220, y: 80, maxLevel: 5, perLevel: 0.04, requires: ['loot_mastery', 'fragment_drop'],
    desc: function(lv){ return '金币与钻石获取额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },

  // ===== 宠物养成系（左中，绿色）— 10节点，40点 =====
  // v2.10.0 需求6.1：从原资源/辅助分支拆分，专注宠物蛋/技能书/元宵/月华露/归元丹等宠物养成道具
  { id: 'egg_drop', name: '生命恩赐', icon: '🥚', branch: 'drop_pet', type: 'small', x: 440, y: 330, maxLevel: 4, perLevel: 0.025, requires: ['chest_drop'],
    desc: function(lv){ return '宠物蛋掉落加成 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'egg_quality', name: '生命精纯', icon: '🥚', branch: 'drop_pet', type: 'small', x: 440, y: 280, maxLevel: 3, perLevel: 0.02, requires: ['egg_drop'],
    desc: function(lv){ return '宠物蛋品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'skill_drop', name: '秘典领悟', icon: '�', branch: 'drop_pet', type: 'small', x: 440, y: 490, maxLevel: 4, perLevel: 0.025, requires: ['egg_drop'],
    desc: function(lv){ return '技能书掉落 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'skill_quality', name: '秘典精纯', icon: '�', branch: 'drop_pet', type: 'small', x: 440, y: 540, maxLevel: 3, perLevel: 0.02, requires: ['skill_drop'],
    desc: function(lv){ return '技能书品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'skill_quality_2', name: '秘典大师', icon: '📚', branch: 'drop_pet', type: 'small', x: 440, y: 600, maxLevel: 5, perLevel: 0.02, requires: ['skill_quality'],
    desc: function(lv){ return '技能书品质额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'hatch_speed', name: '孵化秘术', icon: '⚡', branch: 'drop_pet', type: 'medium', x: 380, y: 560, maxLevel: 4, perLevel: 0.06, requires: ['skill_drop'],
    desc: function(lv){ return '孵化速度 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'hatch_speed_2', name: '神速孵化', icon: '⚡', branch: 'drop_pet', type: 'medium', x: 320, y: 620, maxLevel: 3, perLevel: 0.05, requires: ['hatch_speed'],
    desc: function(lv){ return '孵化速度额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'hatch_speed_3', name: '极速孵化', icon: '⚡', branch: 'drop_pet', type: 'small', x: 260, y: 680, maxLevel: 4, perLevel: 0.05, requires: ['hatch_speed_2'],
    desc: function(lv){ return '孵化速度再 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'fusion_luck', name: '融合之幸', icon: '⚗️', branch: 'drop_pet', type: 'medium', x: 260, y: 640, maxLevel: 5, perLevel: 0.03, requires: ['hatch_speed_3'],
    desc: function(lv){ return '融合特殊结果概率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'pet_exp_boost', name: '宠物经验', icon: '🐾', branch: 'drop_pet', type: 'medium', x: 380, y: 660, maxLevel: 5, perLevel: 0.025, requires: ['fusion_luck'],
    desc: function(lv){ return '宠物经验获取 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },

  // ===== 藏宝图专属（上方，橙色）— 8节点，33点 =====
  // v2.10.0 需求6.1：密藏/藏宝图相关天赋，含奖励提升、彩蛋概率加成、额外次数
  { id: 'map_drop', name: '藏宝之眼', icon: '🗺️', branch: 'treasure', type: 'small', x: 440, y: 230, maxLevel: 4, perLevel: 0.03, requires: ['egg_drop'],
    desc: function(lv){ return '藏宝图掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'treasure_luck', name: '密藏之幸', icon: '🗝️', branch: 'treasure', type: 'medium', x: 400, y: 200, maxLevel: 4, perLevel: 0.03, requires: ['map_drop'],
    desc: function(lv){ return '密藏稀有奖励 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'repair_glue_drop', name: '修补之胶', icon: '🩹', branch: 'treasure', type: 'medium', x: 440, y: 170, maxLevel: 4, perLevel: 0.04, requires: ['map_drop'],
    desc: function(lv){ return '修补胶掉落率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  // v2.10.0 需求6.1：新增藏宝图专属节点
  { id: 'treasure_quality', name: '密藏精纯', icon: '�️', branch: 'treasure', type: 'medium', x: 360, y: 140, maxLevel: 4, perLevel: 0.03, requires: ['treasure_luck'],
    desc: function(lv){ return '密藏道具品质 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'treasure_freq', name: '密藏频遇', icon: '�️', branch: 'treasure', type: 'small', x: 500, y: 140, maxLevel: 3, perLevel: 0.04, requires: ['repair_glue_drop'],
    desc: function(lv){ return '密藏彩蛋触发概率 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'treasure_egg', name: '密藏蛋缘', icon: '🥚', branch: 'treasure', type: 'medium', x: 540, y: 100, maxLevel: 4, perLevel: 0.04, requires: ['treasure_freq'],
    desc: function(lv){ return '密藏宠物蛋掉落 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'treasure_core', name: '密藏核心', icon: '👑', branch: 'treasure', type: 'core', x: 440, y: 60, maxLevel: 5, perLevel: 0.04, requires: ['treasure_quality', 'treasure_egg'],
    desc: function(lv){ return '密藏所有奖励额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'treasure_ultimate', name: '密藏之巅', icon: '🌟', branch: 'treasure', type: 'core', x: 580, y: 40, maxLevel: 5, perLevel: 0.04, requires: ['treasure_core'],
    desc: function(lv){ return '密藏每日次数 +' + lv + ' 次'; } },

  // ===== 副本活动（左下，青色）— 11节点，47点 =====
  // v2.10.0 需求6.1：副本/限时活动相关天赋，含收益提升、次数增加、难度优化
  { id: 'exp_bonus', name: '智慧之泉', icon: '⭐', branch: 'dungeon', type: 'small', x: 440, y: 440, maxLevel: 6, perLevel: 0.03, requires: ['origin'],
    desc: function(lv){ return '经验获取 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'exp_mastery', name: '智慧精通', icon: '⭐', branch: 'dungeon', type: 'small', x: 380, y: 460, maxLevel: 4, perLevel: 0.03, requires: ['exp_bonus'],
    desc: function(lv){ return '经验额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'exp_special', name: '奇遇之缘', icon: '🌟', branch: 'dungeon', type: 'small', x: 320, y: 590, maxLevel: 3, perLevel: 0.04, requires: ['exp_mastery'],
    desc: function(lv){ return '特殊事件经验 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'mp_efficiency', name: '魔力亲和', icon: '🔮', branch: 'dungeon', type: 'medium', x: 380, y: 510, maxLevel: 4, perLevel: 0.04, requires: ['exp_bonus'],
    desc: function(lv){ return '技能魔法消耗 -' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'mp_efficiency_2', name: '魔力精通', icon: '🔮', branch: 'dungeon', type: 'small', x: 260, y: 560, maxLevel: 4, perLevel: 0.04, requires: ['mp_efficiency'],
    desc: function(lv){ return '技能魔法消耗额外 -' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'buff_duration', name: '祝福延续', icon: '✨', branch: 'dungeon', type: 'small', x: 320, y: 540, maxLevel: 3, perLevel: 0.05, requires: ['mp_efficiency'],
    desc: function(lv){ return '增益持续时间 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'buff_duration_2', name: '祝福精通', icon: '✨', branch: 'dungeon', type: 'small', x: 200, y: 600, maxLevel: 4, perLevel: 0.05, requires: ['buff_duration'],
    desc: function(lv){ return '增益持续时间额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'buff_power', name: '祝福之力', icon: '✨', branch: 'dungeon', type: 'medium', x: 140, y: 660, maxLevel: 5, perLevel: 0.03, requires: ['buff_duration_2'],
    desc: function(lv){ return '增益效果强度 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'support_core', name: '副本核心', icon: '🏰', branch: 'dungeon', type: 'core', x: 200, y: 720, maxLevel: 5, perLevel: 0.03, requires: ['buff_power', 'exp_special'],
    desc: function(lv){ return '副本经验与金币额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'growth_mastery', name: '成长大师', icon: '👑', branch: 'dungeon', type: 'core', x: 340, y: 720, maxLevel: 4, perLevel: 0.04, requires: ['support_core'],
    desc: function(lv){ return '宠物成长速度 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },
  { id: 'support_mastery', name: '副本之巅', icon: '🌟', branch: 'dungeon', type: 'core', x: 280, y: 770, maxLevel: 5, perLevel: 0.04, requires: ['support_core', 'growth_mastery'],
    desc: function(lv){ return '所有副本收益额外 +' + (lv*this.perLevel*100).toFixed(0) + '%'; } },

  // v2.10.0 需求6.1：7大专精分支重构
  // 总点数：attack 71 + defense 68 + drop_equip 25 + drop_regular 36 + drop_pet 40 + treasure 33 + dungeon 47 = 320点
  // 玩家最多获得160点（6次转生达160级），无法点满全树
];

const TALENT_BRANCHES = {
  center: { name: '星图之源', icon: '✦', color: '#e5e7eb' },
  // v2.10.0 需求6.1：6大专精分支重构
  attack: { name: '战斗攻击', icon: '⚔️', color: '#ef4444' },
  defense: { name: '战斗防御', icon: '🛡️', color: '#3b82f6' },
  drop_regular: { name: '常规资源系', icon: '💰', color: '#f59e0b' },
  drop_equip: { name: '装备养成系', icon: '⚔️', color: '#a855f7' },
  drop_pet: { name: '宠物养成系', icon: '🥚', color: '#22c55e' },
  treasure: { name: '藏宝图专属', icon: '🗺️', color: '#f97316' },
  dungeon: { name: '副本活动', icon: '🏰', color: '#06b6d4' },
};

function getTalentLevel(id) {
  // v2.11.0 需求6.1：支持双方案，从当前激活方案读取
  var build = G.activeTalentBuild || 1;
  var talents = (build === 2) ? (G.talents2 || {}) : (G.talents || {});
  return talents[id] || 0;
}

function getTalentBonus(id) {
  var def = TALENT_TREE.find(function(t){ return t.id === id; });
  if (!def) return 0;
  return getTalentLevel(id) * def.perLevel;
}

// v2.11.0 需求6.1：获取当前方案已分配的天赋点总数（origin节点免费，不计入）
function getAllocatedTalentPoints(build) {
  if (build === undefined) build = G.activeTalentBuild || 1;
  var talents = (build === 2) ? (G.talents2 || {}) : (G.talents || {});
  var total = 0;
  Object.keys(talents).forEach(function(id) {
    if (id === 'origin') return; // origin自动点亮，不消耗天赋点
    total += talents[id] || 0;
  });
  return total;
}

function getTalentPoints() {
  // v2.11.0 需求6.1：可用点数 = 总获得点数 - 当前方案已分配点数
  var totalEarned = G.totalTalentPointsEarned || 0;
  var allocated = getAllocatedTalentPoints();
  return Math.max(0, totalEarned - allocated);
}

// v2.11.0 需求6.1：切换天赋方案
function switchTalentBuild(build) {
  if (build === (G.activeTalentBuild || 1)) return;
  if (build === 2 && !G.talentBuild2Unlocked) {
    showToast('第二套天赋方案尚未解锁！', 'error');
    return;
  }
  // 战斗中不允许切换
  if (typeof liveBattle !== 'undefined' && liveBattle) {
    showToast('战斗中无法切换天赋方案！', 'error');
    return;
  }
  G.activeTalentBuild = build;
  saveGame();
  render();
  showToast('🔄 已切换至天赋方案 ' + build, 'success');
}

// v2.11.0 需求6.1：解锁第二套天赋方案（消耗钻石）
function unlockTalentBuild2() {
  if (G.talentBuild2Unlocked) {
    showToast('第二套天赋方案已解锁！', 'info');
    return;
  }
  var cost = 500; // 解锁消耗500钻石
  if ((G.player.diamond || 0) < cost) {
    showToast('钻石不足！需要 ' + cost + ' 钻石解锁第二套天赋方案', 'error');
    return;
  }
  G.player.diamond -= cost;
  G.talentBuild2Unlocked = true;
  if (!G.talents2) G.talents2 = {};
  if (!G.talents2.origin) G.talents2.origin = 1;
  saveGame();
  render();
  showToast('🎉 已解锁第二套天赋方案！可自由切换两套加点', 'success');
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
  // v2.11.0 需求6.1：修改当前激活方案的天赋
  var build = G.activeTalentBuild || 1;
  if (build === 2) {
    if (!G.talents2) G.talents2 = {};
    G.talents2[id] = lv + 1;
  } else {
    if (!G.talents) G.talents = {};
    G.talents[id] = lv + 1;
  }
  saveGame();
  // v3.0 主线任务追踪：天赋学习
  if (typeof _trackTalentLearn === 'function') _trackTalentLearn();
  render();
  var label = def.type === 'core' ? '【核心天赋】' : '';
  showToast(def.icon + ' ' + label + def.name + ' 升至 ' + (lv+1) + ' 级！', 'success');
}

// 经验曲线公式：基于等级计算升到下一级所需经验
// 平衡调整：1.8→1.6，缓解后期升级过慢的问题
// Lv1->2: 200, Lv10->11: ~2190, Lv50->51: ~25700, Lv100->101: ~129000
// 使用 GAME_CONSTANTS 配置化，避免硬编码
function getExpForLevel(lv) {
  var base = (typeof GAME_CONSTANTS !== 'undefined') ? GAME_CONSTANTS.EXP_CURVE_BASE : 100;
  var expNum = (typeof GAME_CONSTANTS !== 'undefined') ? GAME_CONSTANTS.EXP_CURVE_EXPONENT : 16;
  var expDiv = (typeof GAME_CONSTANTS !== 'undefined') ? GAME_CONSTANTS.EXP_CURVE_EXPONENT_DIVISOR : 10;
  // 等级安全保护：lv 必须 >= 1
  if (!lv || lv < 1) lv = 1;
  // 使用整数运算避免浮点精度：100 * lv^(16/10) + 100
  return Math.floor(base * Math.pow(lv, expNum / expDiv) + base);
}

// 统一的加经验函数：应用经验buff和天赋加成，处理升级和天赋点
// 天赋点规则：转生后已获得天赋点的等级不会重复获得，只有突破后的等级才获得天赋点
// 通过 talentPointsEarned 记录已发放天赋点的最高等级
function addExp(amount) {
  var growthMastery = getTalentBonus('growth_mastery');
  var mult = getBuffMult('exp_mult') * (1 + getTalentBonus('exp_bonus') + getTalentBonus('exp_mastery') + growthMastery);
  // 需求15：时间系统经验加成
  var timeEff = (typeof getTimePhaseEffects === 'function') ? getTimePhaseEffects() : {};
  if (timeEff.expMult) mult *= timeEff.expMult;
  var gain = Math.floor(amount * mult);
  G.player.exp += gain;
  while (G.player.exp >= G.player.expToNext && G.player.level < G.player.maxLevel) {
    G.player.exp -= G.player.expToNext;
    G.player.level++;
    G.player.expToNext = getExpForLevel(G.player.level);
    // 天赋点：只在超过 rebirth*10 的等级时发放（配合已发放最高等级记录）
    // v2.9.0 需求4.2：天赋点总数固定为160点（6次转生达160级即可获得全部160点）
    // 0转：1-100级发放100点；1转：101-110级发放10点...6转：151-160级发放10点，共160点
    var talentThreshold = (G.player.rebirth || 0) * 10;
    var TALENT_POINT_CAP = 160; // v2.9.0：天赋点获取上限
    if (G.player.level > talentThreshold && G.player.level > (G.talentPointsEarned || 0) && (G.talentPointsEarned || 0) < TALENT_POINT_CAP) {
      // v2.11.0 需求6.1：天赋点计入总获得点数（双方案共用）
      addTalentPoints(1);
      G.talentPointsEarned = G.player.level;
      addBattleLog('info', '🎉 升级了！当前等级 ' + G.player.level + '（获得1天赋点）');
    } else {
      addBattleLog('info', '🎉 升级了！当前等级 ' + G.player.level + '（已获得的等级，无新天赋点）');
    }
    G.pets.forEach(function(p){
      var oldLv = p.level || 1;
      p.level = G.player.level;
      // 需求16：宠物升级时发放五维属性点（每级10点：5固定+5自由）
      if (typeof grantAttrPointsOnLevelUp === 'function') {
        var lvGain = p.level - oldLv;
        for (var i = 0; i < lvGain; i++) {
          grantAttrPointsOnLevelUp(p);
        }
      }
    });
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

// v2.11.0 需求6.1：天赋点加到总获得点数（双方案共用）
// 注意：G.talentPointsEarned 是"已发放天赋点的最高玩家等级"追踪器（非点数计数），不可在此递增
function addTalentPoints(n) {
  var TALENT_POINT_CAP = 160; // v2.9.0：天赋点获取上限
  var current = G.totalTalentPointsEarned || 0;
  if (current >= TALENT_POINT_CAP) return;
  G.totalTalentPointsEarned = Math.min(TALENT_POINT_CAP, current + n);
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
  // 找到已达成的最高阶——有界遍历，最大200阶（里程碑按指数增长，200阶已达天文数字）
  // 修复：原代码使用10000次无界循环，存在性能风险
  var tier = -1;
  var MAX_TIER = 200;
  for (var i = 0; i < MAX_TIER; i++) {
    var ms = getAchievementMilestone(def, i);
    if (ms <= progress) tier = i;
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
  // 找到该milestone对应的tier——有界遍历，最大200阶
  var tier = -1;
  var MAX_TIER = 200;
  for (var i = 0; i < MAX_TIER; i++) {
    var ms = getAchievementMilestone(def, i);
    if (ms === milestone) { tier = i; break; }
    if (ms > milestone) break;
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

// 需求：成就一键领取 - 批量领取所有已达成但未领取的成就奖励
function claimAllAchievements() {
  if (!G.achievementRewardsClaimed) G.achievementRewardsClaimed = {};
  var totalReward = 0;
  var claimCount = 0;
  ACHIEVEMENT_DEFS.forEach(function(def) {
    var progress = getAchievementProgress(def.id);
    var currentTier = getCurrentAchievementTier(def, progress);
    // 遍历所有已达成的tier，领取未领取的
    for (var i = 0; i <= currentTier; i++) {
      var ms = getAchievementMilestone(def, i);
      var claimKey = def.id + '_' + ms;
      if (!G.achievementRewardsClaimed[claimKey]) {
        var reward = getAchievementReward(def, i);
        G.achievementRewardsClaimed[claimKey] = true;
        totalReward += reward;
        claimCount++;
      }
    }
  });
  if (claimCount > 0) {
    addDiamond(totalReward);
    saveGame();
    render();
    showToast('一键领取 ' + claimCount + ' 个成就奖励！获得 💎' + totalReward.toLocaleString(), 'success');
  } else {
    showToast('暂无可领取的成就奖励', 'info');
  }
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
      <button class="btn-gold w-full mb-2" onclick="claimAllAchievements()">🎁 一键领取所有已达成成就奖励</button>
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

// ==================== 游戏内时间系统（需求15）====================
// 参考《梦幻西游》时辰切换机制：白天→黄昏→夜晚循环
// 每个阶段持续5分钟（实时），循环往复
// 不同时间段有不同的游戏效果加成

const TIME_PHASES = [
  {
    id: 'day', name: '白天', icon: '☀️', color: '#fbbf24',
    duration: 300000, // 5分钟
    desc: '阳光普照，精力充沛',
    effects: { expMult: 1.10, goldMult: 1.10, eggDropMult: 1.0 },
  },
  {
    id: 'dusk', name: '黄昏', icon: '🌅', color: '#f97316',
    duration: 300000, // 5分钟
    desc: '夕阳西下，奇遇渐多',
    effects: { expMult: 1.0, goldMult: 1.0, eggDropMult: 1.15, itemDropMult: 1.10 },
  },
  {
    id: 'night', name: '夜晚', icon: '🌙', color: '#6366f1',
    duration: 300000, // 5分钟
    desc: '夜幕降临，怪物强化但掉落更丰',
    effects: { expMult: 1.20, goldMult: 1.0, eggDropMult: 1.0, monsterAtkMult: 1.15 },
  },
];

// 获取当前时间阶段配置
function getCurrentTimePhase() {
  if (!G.gameTime) G.gameTime = { phase: 'day', phaseStartTime: Date.now(), cycleCount: 0 };
  var phase = TIME_PHASES.find(function(p) { return p.id === G.gameTime.phase; });
  return phase || TIME_PHASES[0];
}

// 更新游戏时间（检查是否需要切换阶段）
function updateGameTime() {
  if (!G.gameTime) {
    G.gameTime = { phase: 'day', phaseStartTime: Date.now(), cycleCount: 0 };
    return;
  }
  var now = Date.now();
  var currentPhase = getCurrentTimePhase();
  var elapsed = now - (G.gameTime.phaseStartTime || now);
  if (elapsed >= currentPhase.duration) {
    // 切换到下一个阶段
    var currentIdx = TIME_PHASES.findIndex(function(p) { return p.id === G.gameTime.phase; });
    var nextIdx = (currentIdx + 1) % TIME_PHASES.length;
    G.gameTime.phase = TIME_PHASES[nextIdx].id;
    G.gameTime.phaseStartTime = now;
    if (nextIdx === 0) G.gameTime.cycleCount = (G.gameTime.cycleCount || 0) + 1;
    // 通知阶段切换
    var newPhase = TIME_PHASES[nextIdx];
    if (typeof addBattleLog === 'function') {
      addBattleLog('info', newPhase.icon + ' 时辰更替：' + newPhase.name + ' — ' + newPhase.desc);
    }
    if (typeof showToast === 'function') {
      showToast(newPhase.icon + ' 时辰更替：' + newPhase.name, 'info');
    }
    saveGame();
  }
}

// 获取当前时间阶段的效果加成
function getTimePhaseEffects() {
  var phase = getCurrentTimePhase();
  return phase.effects || {};
}

// 获取当前时间阶段的剩余时间（毫秒）
function getTimePhaseRemaining() {
  if (!G.gameTime || !G.gameTime.phaseStartTime) return 0;
  var phase = getCurrentTimePhase();
  var elapsed = Date.now() - G.gameTime.phaseStartTime;
  return Math.max(0, phase.duration - elapsed);
}

// 获取时间阶段的剩余时间文本
function getTimePhaseRemainingText() {
  var remaining = getTimePhaseRemaining();
  var min = Math.floor(remaining / 60000);
  var sec = Math.floor((remaining % 60000) / 1000);
  return min + '分' + sec + '秒';
}

// 获取下一个时间阶段
function getNextTimePhase() {
  var currentIdx = TIME_PHASES.findIndex(function(p) { return p.id === (G.gameTime ? G.gameTime.phase : 'day'); });
  var nextIdx = (currentIdx + 1) % TIME_PHASES.length;
  return TIME_PHASES[nextIdx];
}
