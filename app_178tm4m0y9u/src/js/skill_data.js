// ===== skill_data.js : 技能系统、阵法、血珠、派遣等活动配置（从config.js拆分） =====


// 格式化血统效果为中文描述字符串（UI展示用，不参与战斗计算）
function formatBloodlineEffects(effects) {
  if (!effects) return '';
  return Object.keys(effects).map(function(k) {
    var label = BLOODLINE_EFFECT_NAMES[k] || k;
    var v = effects[k];
    if (BLOODLINE_EFFECT_FLAT[k]) return label + '+' + v;
    return label + '+' + (Math.round(v * 1000) / 10) + '%';
  }).join('，');
}

// 需求Bug修复：根据宠物名查找其所属进化链的基础名（chain[0]）
// 进阶后的宠物名不在 PET_DEX 中直接存在，需遍历进化链查找
// 返回基础名（如"星光战鹰"→"星光雏"），未找到返回 null
function getEvolveChainBaseName(petName) {
  if (!petName) return null;
  // 先查直接命中
  if (PET_DEX[petName] && PET_DEX[petName].evolvable) return petName;
  // 遍历所有可进化宠物的进化链
  for (var key in PET_DEX) {
    var d = PET_DEX[key];
    if (d && d.evolvable && d.evolveChain) {
      var idx = d.evolveChain.indexOf(petName);
      if (idx > 0) return key; // 返回链的基础名（chain[0]）
    }
  }
  return null;
}

// ==================== 血统读取函数（全量重构）====================
// 唯一入参依赖：pet.name，直接从 PET_BLOOD_ALL 查表
// 命中则返回完整的 {name, desc, effects, mechanics} 结构
// 未命中返回 null，无任何兜底、降级、默认通用逻辑
// effects 按进阶倍率正常缩放，mechanics 原样传递（结构化数据不可缩放）
function generatePetBloodlineSkill(pet) {
  if (!pet || !pet.name) return null;

  // —— 血统珠覆盖逻辑 ——
  // 临时覆盖为完整的血统结构化对象，优先级高于原生血统
  // 品质乘数强化 effects，mechanics 保持原样确保临时效果也能完整结算
  if (pet.bloodlineOrb && pet.bloodlineOrb.sourcePetName) {
    var orbData = PET_BLOOD_ALL[pet.name];
    // 需求Bug修复：进阶后宠物名变更，回退到进化链基础名查表
    if (!orbData) {
      var orbBase = getEvolveChainBaseName(pet.name);
      if (orbBase && orbBase !== pet.name) orbData = PET_BLOOD_ALL[orbBase];
    }
    if (orbData) {
      var orbQuality = pet.bloodlineOrb.quality || 'common';
      var orbMult = (typeof BLOOD_ORB_QUALITY_MULT !== 'undefined') ? (BLOOD_ORB_QUALITY_MULT[orbQuality] || 1.0) : 1.0;
      var orbStage = pet.advanceStage || 0;
      var orbStageMult = orbStage === 2 ? 2.0 : orbStage === 1 ? 1.5 : 1.0;
      var orbEffects = {};
      var orbBaseEff = orbData.effects || {};
      Object.keys(orbBaseEff).forEach(function(k) {
        orbEffects[k] = Math.round(orbBaseEff[k] * orbStageMult * orbMult * 100) / 100;
      });
      return {
        id: 'bl_' + pet.name + '_orb',
        name: orbData.name,
        type: 'bloodline',
        desc: '【植入强化】' + orbData.desc,
        effects: orbEffects,
        mechanics: orbData.mechanics || [],
        fromBloodlineOrb: true,
        quality: orbQuality,
        sourcePetName: pet.bloodlineOrb.sourcePetName
      };
    }
    // 血统珠但无配置：返回 null，无兜底
    return null;
  }

  // —— 标准血统读取：PET_BLOOD_ALL[pet.name] ——
  var data = PET_BLOOD_ALL[pet.name];
  // 需求Bug修复：进阶后宠物名变更（如"星光雏"→"星光战鹰"），新名不在 PET_BLOOD_ALL 中
  // 回退到进化链的基础名查表，确保进阶后血统技能仍能正常显示
  if (!data) {
    var baseName = getEvolveChainBaseName(pet.name);
    if (baseName && baseName !== pet.name) {
      data = PET_BLOOD_ALL[baseName];
    }
  }
  if (!data) return null; // 未命中，无血统，无任何兜底/降级/默认逻辑

  // 进阶倍率缩放 effects（数值类放大，概率类不放大，回合类不放大）
  var stage = pet.advanceStage || 0;
  var mult = stage === 2 ? 2.0 : stage === 1 ? 1.5 : 1.0;
  var effects = {};
  var baseEff = data.effects || {};
  // 不受倍率影响的字段（概率类、回合类）
  var _noScale = { burnTurns: true, reviveChance: true, freezeChance: true, stunChance: true,
    silenceChance: true, rootChance: true, sleepChance: true, poisonTurns: true };
  Object.keys(baseEff).forEach(function(k) {
    if (_noScale[k]) {
      effects[k] = baseEff[k];
    } else {
      effects[k] = Math.round(baseEff[k] * mult * 100) / 100;
    }
  });

  return {
    id: 'bl_' + pet.name,
    name: data.name,
    type: 'bloodline',
    desc: data.desc,        // 仅UI展示，不参与战斗逻辑
    effects: effects,       // 常驻属性加成，直接参与属性面板计算
    mechanics: data.mechanics || []  // 触发型特殊效果，battle.js 中按 trigger 判定执行
  };
}

// 获取宠物血统技能对象（对外统一接口）
// 唯一入参依赖：pet.name → PET_BLOOD_ALL 查表
function getPetBloodlineSkill(pet) {
  return generatePetBloodlineSkill(pet);
}

const ACTIVE_SKILLS = [
  // ===== 单体攻击 =====
  // 伤害公式：rawDmg = power × dmgPct × skillDmgMult − def × (0.7 − ignoreDefPct)，±10%波动
  // power：物理技能=攻击力，法术技能=灵力；skillDmgMult = 1 + 被动技能加成
  // 暴击率 = 10% + 被动critRate + 技能bonusCrit + 玩家critRate；暴击伤害×1.5
  { id: 'flame_strike', name: '烈焰冲击', type: 'active', category: 'single_atk', desc: '【物理·单体】对单体造成 150% 攻击力的火焰伤害。\n伤害公式：攻击力×1.5×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%，暴击造成1.5倍伤害。', element: '火', dmgPct: 1.5, cd: 0, target: 'enemy_front' },
  { id: 'ice_arrow', name: '寒冰箭', type: 'active', category: 'single_atk', desc: '【法术·单体】对单体造成 130% 灵力的冰系伤害。\n伤害公式：灵力×1.3×技能加成 − 目标防御×0.7。\n30%概率冻结目标1回合（无法行动）。\n基础暴击率10%。', element: '冰', dmgPct: 1.3, cd: 0, target: 'enemy_front', freezeChance: 0.30, freezeTurns: 1 },
  { id: 'thunder_strike', name: '雷霆一击', type: 'active', category: 'single_atk', desc: '【法术·单体·必中】对单体造成 180% 灵力的雷系伤害，必定命中。\n伤害公式：灵力×1.8×技能加成 − 目标防御×0.7。\n基础暴击率10%。', element: '雷', dmgPct: 1.8, cd: 0, target: 'enemy_front', alwaysHit: true },
  { id: 'shadow_strike', name: '暗影突袭', type: 'active', category: 'single_atk', desc: '【法术·单体】对单体造成 140% 灵力的暗影伤害，无视30%防御。\n伤害公式：灵力×1.4×技能加成 − 目标防御×(0.7−0.3)=×0.4。\n基础暴击率10%。', element: '暗', dmgPct: 1.4, cd: 0, target: 'enemy_front', ignoreDefPct: 0.30 },
  { id: 'armor_break', name: '破甲击', type: 'active', category: 'single_atk', desc: '【物理·单体】对单体造成 120% 攻击力的伤害，并降低目标30%防御2回合。\n伤害公式：攻击力×1.2×技能加成 − 目标防御×0.7。\n基础暴击率10%。', element: '无', dmgPct: 1.2, cd: 0, target: 'enemy_front', defReduce: 0.30, defReduceTurns: 2 },
  { id: 'blood_drain', name: '吸血攻击', type: 'active', category: 'single_atk', desc: '【法术·单体】对单体造成 130% 灵力的暗影伤害，吸血50%。\n伤害公式：灵力×1.3×技能加成 − 目标防御×0.7。\n回复量 = 造成伤害×50%。基础暴击率10%。', element: '暗', dmgPct: 1.3, cd: 0, target: 'enemy_front', vampPct: 0.50 },
  { id: 'double_slash', name: '连续斩', type: 'active', category: 'single_atk', desc: '【物理·单体·双击】攻击2次，首击造成 80% 攻击力伤害，次击造成 64%（80%×0.8）伤害。\n总伤害 ≈ 攻击力×1.44×技能加成 − 目标防御×1.4。\n每击独立判定暴击（基础10%）。', element: '无', dmgPct: 0.8, cd: 0, target: 'enemy_front', hits: 2 },
  { id: 'fatal_blow', name: '致命一击', type: 'active', category: 'single_atk', desc: '【物理·单体·高暴击】对单体造成 250% 攻击力的伤害，额外+30%暴击率。\n伤害公式：攻击力×2.5×技能加成 − 目标防御×0.7。\n暴击率 = 10%+30%+被动加成（暴击×1.5）。', element: '无', dmgPct: 2.5, cd: 0, target: 'enemy_front', bonusCrit: 0.30 },
  { id: 'poison_fang', name: '毒牙撕咬', type: 'active', category: 'single_atk', desc: '【法术·单体·持续】对单体造成 100% 灵力的毒系伤害，附加中毒3回合。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。\n中毒效果：每回合损失目标5%最大气血。基础暴击率10%。', element: '毒', dmgPct: 1.0, cd: 0, target: 'enemy_front', poisonTurns: 3, poisonPct: 0.05 },
  { id: 'doom_judge', name: '末日审判', type: 'active', category: 'single_atk', desc: '【法术·单体·自损】对单体造成 300% 灵力的暗影伤害，自损10%最大气血。\n伤害公式：灵力×3.0×技能加成 − 目标防御×0.7。\n自损 = 自身最大气血×10%。基础暴击率10%。', element: '暗', dmgPct: 3.0, cd: 0, target: 'enemy_front', selfDmgPct: 0.10 },
  // ===== 群体攻击 =====
  { id: 'meteor', name: '陨石天降', type: 'active', category: 'aoe_atk', desc: '【物理·群体·秒3】对3个目标造成 80% 攻击力的火焰伤害。\n每目标伤害：攻击力×0.8×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%。', element: '火', dmgPct: 0.8, cd: 0, target: 'enemy_all', targetCount: 3 },
  { id: 'blizzard', name: '暴风雪', type: 'active', category: 'aoe_atk', desc: '【法术·群体·秒4·控制】对4个目标造成 60% 灵力的冰系伤害，20%概率冻结1回合。\n伤害公式：灵力×0.6×技能加成 − 目标防御×0.7。\n冻结：无法行动。', element: '冰', dmgPct: 0.6, cd: 0, target: 'enemy_all', targetCount: 4, freezeChance: 0.20, freezeTurns: 1 },
  { id: 'lightning_chain', name: '闪电链', type: 'active', category: 'aoe_atk', desc: '【法术·全体】对全体敌人造成 110% 灵力的雷系伤害。\n伤害公式：灵力×1.1×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%。', element: '雷', dmgPct: 1.1, cd: 0, target: 'enemy_all' },
  { id: 'shadow_burst', name: '暗影爆发', type: 'active', category: 'aoe_atk', desc: '【法术·全体·吸血】对全体敌人造成 100% 灵力的暗影伤害，吸血10%。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。\n回复量 = 总伤害×10%。', element: '暗', dmgPct: 1.0, cd: 0, target: 'enemy_all', vampPct: 0.10 },
  { id: 'flame_storm', name: '烈焰风暴', type: 'active', category: 'aoe_atk', desc: '【物理·群体·秒3·持续】对3个目标造成 85% 攻击力的火焰伤害，附加燃烧2回合。\n伤害公式：攻击力×0.85×技能加成 − 目标防御×0.7。\n燃烧：每回合损失5%最大气血。', element: '火', dmgPct: 0.85, cd: 0, target: 'enemy_all', targetCount: 3, burnTurns: 2, burnPct: 0.05 },
  { id: 'poison_mist', name: '毒雾', type: 'active', category: 'aoe_atk', desc: '【法术·群体·秒4·持续】对4个目标造成 50% 灵力的毒系伤害，全体中毒3回合。\n伤害公式：灵力×0.5×技能加成 − 目标防御×0.7。\n中毒：每回合损失5%最大气血。', element: '毒', dmgPct: 0.5, cd: 0, target: 'enemy_all', targetCount: 4, poisonTurns: 3, poisonPct: 0.05 },
  { id: 'earth_crack', name: '地裂术', type: 'active', category: 'aoe_atk', desc: '【物理·全体·控制】对全体敌人造成 150% 攻击力的伤害，30%概率眩晕1回合。\n伤害公式：攻击力×1.5×技能加成 − 目标防御×0.7。', element: '无', dmgPct: 1.5, cd: 0, target: 'enemy_all', stunChance: 0.30, stunTurns: 1 },
  // ===== 单体治疗 =====
  // 治疗公式：heal = 目标最大气血×healPct + 施法者灵力×0.5
  { id: 'holy_light', name: '圣光术', type: 'active', category: 'single_heal', desc: '【治疗·单体·秒3】恢复生命最低3个友方 25% 最大气血。\n治疗公式：目标最大气血×25% + 施法者灵力×50%。', element: '光', healPct: 0.25, dmgPct: 0.7, cd: 0, target: 'ally_lowest', targetCount: 3 },
  { id: 'cure', name: '治愈术', type: 'active', category: 'single_heal', desc: '【治疗·单体】恢复生命最低友方 40% 最大气血。\n治疗公式：目标最大气血×40% + 施法者灵力×50%。', element: '光', healPct: 0.40, cd: 0, target: 'ally_lowest' },
  { id: 'emergency_heal', name: '急救术', type: 'active', category: 'single_heal', desc: '【治疗·单体·冷却】恢复生命最低友方 60% 最大气血，冷却3回合。\n治疗公式：目标最大气血×60% + 施法者灵力×50%。', element: '光', healPct: 0.60, cd: 3, target: 'ally_lowest' },
  { id: 'life_bloom', name: '生命绽放', type: 'active', category: 'single_heal', desc: '【持续治疗·单体】生命最低友方每回合恢复 10% 最大气血，持续3回合。\n总治疗量 = 目标最大气血×30%。', element: '光', hotPct: 0.10, hotTurns: 3, cd: 0, target: 'ally_lowest' },
  // ===== 群体治疗 =====
  { id: 'heal_wind', name: '治愈之风', type: 'active', category: 'aoe_heal', desc: '【治疗·全体】全体友方恢复 15% 最大气血。\n治疗公式：各友方最大气血×15% + 施法者灵力×50%。', element: '光', healPct: 0.15, cd: 0, target: 'ally_all' },
  { id: 'holy_radiance', name: '神圣光辉', type: 'active', category: 'aoe_heal', desc: '【治疗·全体】全体友方恢复 25% 最大气血。\n治疗公式：各友方最大气血×25% + 施法者灵力×50%。', element: '光', healPct: 0.25, cd: 0, target: 'ally_all' },
  { id: 'life_spring', name: '生命之泉', type: 'active', category: 'aoe_heal', desc: '【持续治疗·全体】全体友方每回合恢复 8% 最大气血，持续3回合。\n总治疗量 = 各友方最大气血×24%。', element: '光', hotPct: 0.08, hotTurns: 3, cd: 0, target: 'ally_all' },
  // ===== 单体控制 =====
  { id: 'freeze', name: '冰冻术', type: 'active', category: 'single_cc', desc: '【法术·单体·控制】对单体造成 100% 灵力的冰系伤害，50%概率冻结2回合。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。\n冻结：无法行动2回合。', element: '冰', dmgPct: 1.0, cd: 0, target: 'enemy_front', freezeChance: 0.50, freezeTurns: 2 },
  { id: 'stun_strike', name: '眩晕击', type: 'active', category: 'single_cc', desc: '【物理·单体·控制】对单体造成 80% 攻击力的伤害，40%概率眩晕1回合。\n伤害公式：攻击力×0.8×技能加成 − 目标防御×0.7。\n眩晕：无法行动。', element: '无', dmgPct: 0.8, cd: 0, target: 'enemy_front', stunChance: 0.40, stunTurns: 1 },
  { id: 'silence', name: '沉默术', type: 'active', category: 'single_cc', desc: '【法术·单体·控制】对单体造成 60% 灵力的暗影伤害，35%概率沉默2回合。\n伤害公式：灵力×0.6×技能加成 − 目标防御×0.7。\n沉默：无法使用主动技能。', element: '暗', dmgPct: 0.6, cd: 0, target: 'enemy_front', silenceChance: 0.35, silenceTurns: 2 },
  { id: 'entangle', name: '缠绕', type: 'active', category: 'single_cc', desc: '【物理·单体·控制】对单体造成 70% 攻击力的伤害，45%概率定身2回合。\n伤害公式：攻击力×0.7×技能加成 − 目标防御×0.7。\n定身：无法行动。', element: '无', dmgPct: 0.7, cd: 0, target: 'enemy_front', rootChance: 0.45, rootTurns: 2 },
  // ===== 群体控制 =====
  { id: 'mass_freeze', name: '群体冰冻', type: 'active', category: 'aoe_cc', desc: '【法术·全体·控制】对全体敌人造成 60% 灵力的冰系伤害，30%概率冻结1回合。\n伤害公式：灵力×0.6×技能加成 − 目标防御×0.7。', element: '冰', dmgPct: 0.6, cd: 0, target: 'enemy_all', freezeChance: 0.30, freezeTurns: 1 },
  { id: 'earthquake', name: '地震术', type: 'active', category: 'aoe_cc', desc: '【物理·全体·控制】对全体敌人造成 70% 攻击力的伤害，25%概率眩晕1回合。\n伤害公式：攻击力×0.7×技能加成 − 目标防御×0.7。', element: '无', dmgPct: 0.7, cd: 0, target: 'enemy_all', stunChance: 0.25, stunTurns: 1 },
  { id: 'hypnosis', name: '催眠术', type: 'active', category: 'aoe_cc', desc: '【法术·全体·控制】对全体敌人造成 40% 灵力的暗影伤害，20%概率睡眠1回合。\n伤害公式：灵力×0.4×技能加成 − 目标防御×0.7。\n睡眠：无法行动，受到攻击会醒来。', element: '暗', dmgPct: 0.4, cd: 0, target: 'enemy_all', sleepChance: 0.20, sleepTurns: 1 },
  // ===== 单体辅助 =====
  { id: 'berserk', name: '狂暴', type: 'active', category: 'single_buff', desc: '【增益·自身·冷却】自身攻击力+50%，持续3回合，冷却5回合。\n攻击力提升 = 基础攻击力×50%。', element: '无', atkBuff: 0.50, buffTurns: 3, cd: 5, target: 'ally_self' },
  { id: 'iron_wall', name: '铁壁', type: 'active', category: 'single_buff', desc: '【增益·自身·冷却】自身防御力+50%，持续3回合，冷却5回合。\n防御力提升 = 基础防御力×50%。', element: '无', defBuff: 0.50, buffTurns: 3, cd: 5, target: 'ally_self' },
  { id: 'haste', name: '加速', type: 'active', category: 'single_buff', desc: '【增益·自身】自身速度+40%，持续3回合。\n速度提升 = 基础速度×40%。', element: '无', spdBuff: 0.40, buffTurns: 3, cd: 0, target: 'ally_self' },
  { id: 'guard_shield', name: '护盾', type: 'active', category: 'single_buff', desc: '【护盾·自身】自身获得 40% 最大气血的护盾，吸收伤害。\n护盾值 = 自身最大气血×40%。', element: '光', shieldPct: 0.40, cd: 0, target: 'ally_self' },
  { id: 'blessing', name: '祝福', type: 'active', category: 'single_buff', desc: '【增益·自身】自身全属性+15%，持续3回合。\n全属性 = 攻击/防御/速度/灵力 均提升15%。', element: '光', allBuff: 0.15, buffTurns: 3, cd: 0, target: 'ally_self' },
  // ===== 群体辅助 =====
  { id: 'power_aura_active', name: '力量光环（主动）', type: 'active', category: 'aoe_buff', desc: '【增益·全体】全体友方攻击力+20%，持续3回合。\n攻击力提升 = 各友方基础攻击力×20%。', element: '无', atkBuff: 0.20, buffTurns: 3, cd: 0, target: 'ally_all' },
  { id: 'guard_aura_active', name: '守护光环（主动）', type: 'active', category: 'aoe_buff', desc: '【增益·全体】全体友方防御力+20%，持续3回合。\n防御力提升 = 各友方基础防御力×20%。', element: '无', defBuff: 0.20, buffTurns: 3, cd: 0, target: 'ally_all' },
  { id: 'mass_haste', name: '群体加速', type: 'active', category: 'aoe_buff', desc: '【增益·全体】全体友方速度+25%，持续3回合。\n速度提升 = 各友方基础速度×25%。', element: '无', spdBuff: 0.25, buffTurns: 3, cd: 0, target: 'ally_all' },
  { id: 'mass_shield', name: '群体护盾', type: 'active', category: 'aoe_buff', desc: '【护盾·全体】全体友方获得 20% 最大气血的护盾，吸收伤害。\n护盾值 = 各友方最大气血×20%。', element: '光', shieldPct: 0.20, cd: 0, target: 'ally_all' },
  // ===== 参考长安幻想主动技能 =====
  { id: 'flame_charge', name: '烈焰冲撞', type: 'active', category: 'aoe_atk', desc: '【物理·群体】对2个目标造成 120% 攻击力的火焰伤害。\n每目标伤害：攻击力×1.2×技能加成 − 目标防御×0.7（±10%波动）。', element: '火', dmgPct: 1.2, cd: 0, target: 'enemy_all' },
  { id: 'thunder_spell', name: '奔雷咒', type: 'active', category: 'aoe_atk', desc: '【法术·全体】对全体敌人造成 125% 灵力的雷系伤害。\n伤害公式：灵力×1.25×技能加成 − 目标防御×0.7（±10%波动）。', element: '雷', dmgPct: 1.25, cd: 0, target: 'enemy_all' },
  { id: 'water_deluge', name: '碧水滔天', type: 'active', category: 'aoe_atk', desc: '【物理·群体·秒4】对4个目标造成 55% 攻击力的水系伤害，附带减速效果。\n伤害公式：攻击力×0.55×技能加成 − 目标防御×0.7。', element: '水', dmgPct: 0.55, cd: 0, target: 'enemy_all', targetCount: 4 },
  { id: 'mountain_crush', name: '泰山压顶', type: 'active', category: 'aoe_cc', desc: '【物理·全体·控制】对全体敌人造成 135% 攻击力的土系伤害，25%概率眩晕1回合。\n伤害公式：攻击力×1.35×技能加成 − 目标防御×0.7。', element: '土', dmgPct: 1.35, cd: 0, target: 'enemy_all', stunChance: 0.25, stunTurns: 1 },
  { id: 'soul_slash', name: '裂魂斩', type: 'active', category: 'single_atk', desc: '【物理·单体】对单体造成 200% 攻击力的伤害。\n伤害公式：攻击力×2.0×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%。', element: '无', dmgPct: 2.0, cd: 0, target: 'enemy_front' },
  { id: 'soul_search', name: '搜魂斩', type: 'active', category: 'aoe_atk', desc: '【物理·群体】横扫3个目标，每个造成 90% 攻击力的物理伤害。\n每目标伤害：攻击力×0.9×技能加成 − 目标防御×0.7。', element: '无', dmgPct: 0.9, cd: 0, target: 'enemy_all' },
  { id: 'dream_butterfly', name: '梦蝶', type: 'active', category: 'single_cc', desc: '【法术·单体·控制】对单体造成 80% 灵力的暗影伤害，35%概率附加梦魇（沉默）2回合。\n伤害公式：灵力×0.8×技能加成 − 目标防御×0.7。', element: '暗', dmgPct: 0.8, cd: 0, target: 'enemy_front', silenceChance: 0.35, silenceTurns: 2 },
  { id: 'butterfly_tide', name: '蝶潮', type: 'active', category: 'aoe_cc', desc: '【法术·群体·秒5·控制】对5个目标造成 45% 灵力的暗影伤害，20%概率附加梦魇（睡眠）1回合。\n伤害公式：灵力×0.45×技能加成 − 目标防御×0.7。', element: '暗', dmgPct: 0.45, cd: 0, target: 'enemy_all', targetCount: 5, sleepChance: 0.20, sleepTurns: 1 },
  { id: 'buddha_seal', name: '佛佑圣印', type: 'active', category: 'single_atk', desc: '【法术·单体·治疗】对单体造成 160% 灵力的光系伤害，并为主人回复10%最大气血。\n伤害公式：灵力×1.6×技能加成 − 目标防御×0.7。', element: '光', dmgPct: 1.6, cd: 0, target: 'enemy_front', postHealPct: 0.10, postHealTarget: 'self' },
  { id: 'buddha_quake', name: '佛行震地', type: 'active', category: 'aoe_atk', desc: '【法术·群体·秒5·治疗】对5个目标造成 50% 灵力的光系伤害，并回复生命最低友方20%最大气血。\n伤害公式：灵力×0.5×技能加成 − 目标防御×0.7。', element: '光', dmgPct: 0.5, cd: 0, target: 'enemy_all', targetCount: 5, postHealPct: 0.20, postHealTarget: 'lowest' },
  // ===== 融合限定特殊宠物独有主动技能 =====
  { id: 'chaos_strike', name: '混元一击', type: 'active', category: 'aoe_atk', desc: '【物理·全体·融合限定】混元之力对全体敌人造成 200% 攻击力的伤害，并回复全队30%最大气血。\n伤害公式：攻击力×2.0×技能加成 − 目标防御×0.7。\n治疗量 = 各友方最大气血×30%。', element: '混沌', dmgPct: 2.0, cd: 0, target: 'enemy_all', postHealPct: 0.30, postHealTarget: 'team' },
  { id: 'doom_inferno', name: '灭世之炎', type: 'active', category: 'aoe_cc', desc: '【物理·全体·融合限定】对全体敌人造成 220% 攻击力的火焰伤害，50%概率附加灼烧3回合。\n伤害公式：攻击力×2.2×技能加成 − 目标防御×0.7。\n灼烧：每回合损失5%最大气血。', element: '火', dmgPct: 2.2, cd: 0, target: 'enemy_all', burnChance: 0.50, burnTurns: 3 },
  { id: 'time_rift', name: '时空断裂', type: 'active', category: 'single_atk', desc: '【物理·单体·必暴·融合限定】对单体造成 300% 攻击力的时空伤害，必定暴击，35%概率眩晕2回合。\n伤害公式：攻击力×3.0×技能加成×1.5（暴击）− 目标防御×0.7。', element: '时空', dmgPct: 3.0, cd: 0, target: 'enemy_front', stunChance: 0.35, stunTurns: 2 },
  // ===== 创新主动技能（参考长安幻想） =====
  // 多段伤害：5连击，单次低伤害但总伤可观
  { id: 'thousand_blades', name: '千刀斩', type: 'active', category: 'single_atk', desc: '【物理·单体·5连击】极速斩击5次，首击50%攻击力，后续每击递减20%。\n每击伤害：攻击力×0.5×(0.8^i)×技能加成 − 目标防御×0.7（每击独立判定暴击）。\n总伤害 ≈ 攻击力×1.6×技能加成 − 目标防御×3.5。', element: '无', dmgPct: 0.5, cd: 0, target: 'enemy_front', hits: 5, decayPerHit: 0.20 },
  // 叠加型持续伤害：每次施放增加毒层数
  { id: 'venom_coil', name: '毒蛇缠', type: 'active', category: 'single_atk', desc: '【法术·单体·叠加毒】对单体造成 90% 灵力的毒系伤害，附加可叠加的中毒。\n伤害公式：灵力×0.9×技能加成 − 目标防御×0.7。\n每次施放中毒层数+1，每层每回合损失3%最大气血（最高5层）。', element: '毒', dmgPct: 0.9, cd: 0, target: 'enemy_front', stackPoison: true, poisonTurns: 3, poisonPctPerStack: 0.03, maxPoisonStacks: 5 },
  // 斩杀型：目标血量低于阈值时伤害翻倍
  { id: 'execute_blade', name: '斩杀之刃', type: 'active', category: 'single_atk', desc: '【物理·单体·斩杀】对单体造成 130% 攻击力的伤害，目标血量低于30%时伤害×2.5。\n伤害公式：攻击力×1.3×技能加成×(目标血量<30%?2.5:1) − 目标防御×0.7。', element: '无', dmgPct: 1.3, cd: 0, target: 'enemy_front', executeThreshold: 0.30, executeMult: 2.5 },
  // 真实伤害：无视防御
  { id: 'true_blade', name: '真实之刃', type: 'active', category: 'single_atk', desc: '【物理·单体·真伤】对单体造成 110% 攻击力的真实伤害，无视目标防御。\n伤害公式：攻击力×1.1×技能加成（不减防御）。基础暴击率10%。', element: '无', dmgPct: 1.1, cd: 0, target: 'enemy_front', trueDmg: true },
  // 多段群体伤害
  { id: 'thunderous_might', name: '雷霆万钧', type: 'active', category: 'aoe_atk', desc: '【法术·群体·3连击】对全体敌人连续3次雷系伤害，每次55%灵力。\n每击伤害：灵力×0.55×技能加成 − 目标防御×0.7（每击独立判定暴击）。', element: '雷', dmgPct: 0.55, cd: 0, target: 'enemy_all', hits: 3 },
  // 反击状态：受击时反击
  { id: 'counter_stance', name: '反击姿态', type: 'active', category: 'single_buff', desc: '【增益·自身·反击·冷却】进入反击姿态3回合，受到攻击时反击造成60%攻击力伤害，冷却3回合。\n反击伤害 = 攻击力×60%。', element: '无', counterBuff: 0.60, buffTurns: 3, cd: 3, target: 'ally_self' },
  // 反射+护盾：反弹伤害并吸收
  { id: 'thorn_shield', name: '荆棘护盾', type: 'active', category: 'single_buff', desc: '【增益·自身·反射】获得20%最大气血护盾，并反弹50%受到的伤害，持续3回合。\n护盾值 = 自身最大气血×20%。反射伤害 = 受到伤害×50%。', element: '光', reflectBuff: 0.50, reflectTurns: 3, shieldPct: 0.20, cd: 0, target: 'ally_self' },
  // 净化治疗：清除debuff
  { id: 'purify_light', name: '净化之光', type: 'active', category: 'single_heal', desc: '【治疗·单体·净化】恢复生命最低友方30%最大气血，并清除所有负面状态（中毒/燃烧/眩晕/冻结/沉默/定身/睡眠）。\n治疗公式：目标最大气血×30% + 施法者灵力×50%。', element: '光', healPct: 0.30, cleanse: true, cd: 0, target: 'ally_lowest' },
  // 时光倒流：复活已阵亡队友
  { id: 'time_reverse', name: '时光倒流', type: 'active', category: 'aoe_heal', desc: '【治疗·全体·复活·冷却】复活已阵亡的友方（恢复30%气血），并全体恢复15%最大气血，冷却6回合。\n治疗公式：各友方最大气血×15% + 施法者灵力×50%。复活量 = 最大气血×30%。', element: '光', healPct: 0.15, revive: true, revivePct: 0.30, cd: 6, target: 'ally_all' },
  // ===== 需求3：复活类辅助技能 =====
  // 单体复活：复活已阵亡队友
  { id: 'resurrection', name: '复活术', type: 'active', category: 'single_heal', quality: 'rare',
    desc: '【复活·单体·冷却】复活已阵亡的友方，恢复40%最大气血，冷却4回合。\n复活量 = 目标最大气血×40% + 施法者灵力×30%。',
    element: '光', revive: true, revivePct: 0.40, cd: 4, target: 'ally_dead' },
  // 高级单体复活：复活+持续恢复
  { id: 'phoenix_revive', name: '凤凰涅槃', type: 'active', category: 'single_heal', quality: 'epic',
    desc: '【复活·单体·持续恢复·冷却】复活已阵亡的友方，恢复50%最大气血，并使其每回合恢复10%气血，持续3回合，冷却5回合。\n复活量 = 目标最大气血×50%。总恢复 = 50% + 30% = 80%。',
    element: '光', revive: true, revivePct: 0.50, hotPct: 0.10, hotTurns: 3, cd: 5, target: 'ally_dead' },
  // 群体复活：复活全体+攻击增益
  { id: 'mass_resurrection', name: '群体复活', type: 'active', category: 'aoe_heal', quality: 'legend',
    desc: '【复活·全体·增益·冷却】复活已阵亡的友方（恢复35%气血），并使全体友方攻击力+20%持续3回合，冷却8回合。\n复活量 = 各友方最大气血×35%。',
    element: '光', revive: true, revivePct: 0.35, atkBuff: 0.20, buffTurns: 3, cd: 8, target: 'ally_all' },
  // 狂战之怒：高攻击增益但降防
  { id: 'berserker_fury', name: '狂战之怒', type: 'active', category: 'single_buff', desc: '【增益·自身·狂暴·冷却】攻击力+80%，但防御力-30%，持续3回合，冷却4回合。\n攻击力提升 = 基础攻击力×80%。防御力降低 = 基础防御力×30%。', element: '无', atkBuff: 0.80, defDebuff: 0.30, buffTurns: 3, cd: 4, target: 'ally_self' },
  // 吞噬意志：偷取目标攻击力
  { id: 'devour_will', name: '吞噬意志', type: 'active', category: 'single_atk', desc: '【法术·单体·偷取】对单体造成 100% 灵力的暗影伤害，并偷取目标30%攻击力转化为自身攻击力加成，持续3回合。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。', element: '暗', dmgPct: 1.0, cd: 0, target: 'enemy_front', stealAtk: 0.30, stealTurns: 3 },
  // ===== 需求17：新伤害体系+嘲讽控制技能 =====
  // 血量决定伤害的技能
  // 需求1：调整dmgPct平衡气血/魔法/防御/速度四种新威力体系的伤害（属性数值远低于攻击力/灵力）
  { id: 'blood_surge', name: '血脉涌动', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【血量·单体】伤害 = 自身气血 × 50%。\n伤害公式：自身当前气血×0.50×技能加成 − 目标防御×0.7。\n气血越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 0.50, powerAttr: 'hp', cd: 0, target: 'enemy_front' },
  { id: 'life_exchange', name: '生命交换', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【血量差·单体】伤害 = (自身气血 − 目标气血) × 50%。\n伤害公式：(自身气血−目标气血)×0.50×技能加成 − 目标防御×0.7。\n气血差越大，伤害越高。基础暴击率10%。',
    element: '无', dmgPct: 0.50, powerAttr: 'hpDiff', cd: 0, target: 'enemy_front' },
  // 魔法决定伤害的技能
  { id: 'arcane_burst', name: '奥术爆发', type: 'active', category: 'aoe_atk', quality: 'epic',
    desc: '【魔法·群体·秒3】伤害 = 自身魔法值 × 80%，对3个目标造成奥术伤害。\n每目标伤害：自身魔法值×0.80×技能加成 − 目标防御×0.7。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 0.80, powerAttr: 'mp', cd: 0, target: 'enemy_all', targetCount: 3 },
  // 防御决定伤害的技能
  { id: 'shield_bash', name: '盾击', type: 'active', category: 'single_atk', quality: 'uncommon',
    desc: '【防御·单体】伤害 = 自身防御力 × 500%。\n伤害公式：自身防御力×5.00×技能加成 − 目标防御×0.7。\n防御越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 5.00, powerAttr: 'def', cd: 0, target: 'enemy_front' },
  // 速度决定伤害的技能
  { id: 'swift_strike', name: '迅捷打击', type: 'active', category: 'single_atk', quality: 'uncommon',
    desc: '【速度·单体】伤害 = 自身速度 × 300%。\n伤害公式：自身速度×3.00×技能加成 − 目标防御×0.7。\n速度越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 3.00, powerAttr: 'spd', cd: 0, target: 'enemy_front' },
  // ===== 需求1：扩展血量/魔法/防御/速度技能库 =====
  // 血量系进阶
  { id: 'blood_pool_burst', name: '血池爆裂', type: 'active', category: 'aoe_atk', quality: 'epic',
    desc: '【血量·群体·秒4】伤害 = 自身气血 × 30%，对4个目标造成血系伤害。\n每目标伤害：自身当前气血×0.30×技能加成 − 目标防御×0.7。\n气血越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 0.30, powerAttr: 'hp', cd: 0, target: 'enemy_all', targetCount: 4 },
  { id: 'blood_frenzy', name: '鲜血狂热', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【血量·单体·吸血】伤害 = 自身气血 × 70%，吸血20%。\n伤害公式：自身当前气血×0.70×技能加成 − 目标防御×0.7。\n回复量 = 造成伤害×20%。基础暴击率10%。',
    element: '无', dmgPct: 0.70, powerAttr: 'hp', cd: 0, target: 'enemy_front', vampPct: 0.20 },
  { id: 'blood_oath_slash', name: '血誓斩', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【血量·单体·自损】伤害 = 自身气血 × 100%，自损8%最大气血。\n伤害公式：自身当前气血×1.00×技能加成 − 目标防御×0.7。\n自损 = 自身最大气血×8%。基础暴击率15%。',
    element: '无', dmgPct: 1.00, powerAttr: 'hp', cd: 0, target: 'enemy_front', selfDmgPct: 0.08, bonusCrit: 0.05 },
  { id: 'undying_blood', name: '不死血战', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【血量·单体·自愈】伤害 = 自身气血 × 45%，并回复自身15%最大气血。\n伤害公式：自身当前气血×0.45×技能加成 − 目标防御×0.7。\n回复量 = 自身最大气血×15%。基础暴击率10%。',
    element: '无', dmgPct: 0.45, powerAttr: 'hp', cd: 0, target: 'enemy_front', selfHealPct: 0.15 },
  { id: 'blood_curse', name: '血之诅咒', type: 'active', category: 'single_atk', quality: 'legend',
    desc: '【血量·单体·持续】伤害 = 自身气血 × 35%，附加流血3回合。\n伤害公式：自身当前气血×0.35×技能加成 − 目标防御×0.7。\n流血：每回合损失目标6%最大气血。基础暴击率10%。',
    element: '无', dmgPct: 0.35, powerAttr: 'hp', cd: 0, target: 'enemy_front', poisonTurns: 3, poisonPct: 0.06 },
  // 血量差系进阶
  { id: 'life_torrent', name: '生命洪流', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【血量差·群体·秒3】伤害 = (自身气血 − 目标气血) × 35%，对3个目标造成伤害。\n每目标伤害：(自身气血−目标气血)×0.35×技能加成 − 目标防御×0.7。\n气血差越大，伤害越高。基础暴击率10%。',
    element: '无', dmgPct: 0.35, powerAttr: 'hpDiff', cd: 0, target: 'enemy_all', targetCount: 3 },
  { id: 'life_judgment', name: '生命裁决', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【血量差·单体·高暴击】伤害 = (自身气血 − 目标气血) × 65%，+25%暴击率。\n伤害公式：(自身气血−目标气血)×0.65×技能加成 − 目标防御×0.7。\n气血差越大，伤害越高。暴击率 = 10%+25%+被动加成。',
    element: '无', dmgPct: 0.65, powerAttr: 'hpDiff', cd: 0, target: 'enemy_front', bonusCrit: 0.25 },
  // 魔法系进阶
  { id: 'arcane_barrage', name: '魔能弹幕', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【魔法·群体·秒5】伤害 = 自身魔法值 × 60%，对5个目标造成奥术伤害。\n每目标伤害：自身魔法值×0.60×技能加成 − 目标防御×0.7。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 0.60, powerAttr: 'mp', cd: 0, target: 'enemy_all', targetCount: 5 },
  { id: 'arcane_pierce', name: '奥术穿透', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【魔法·单体·无视防御】伤害 = 自身魔法值 × 150%，无视50%防御。\n伤害公式：自身魔法值×1.50×技能加成 − 目标防御×(0.7−0.5)=×0.2。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 1.50, powerAttr: 'mp', cd: 0, target: 'enemy_front', ignoreDefPct: 0.50 },
  { id: 'mana_burn', name: '魔力灼烧', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【魔法·单体·灼魔】伤害 = 自身魔法值 × 70%，并灼烧目标魔法值10%转化为自身魔法。\n伤害公式：自身魔法值×0.70×技能加成 − 目标防御×0.7。\n灼魔：目标损失魔法值×10%，自身回复等量魔法。基础暴击率10%。',
    element: '奥术', dmgPct: 0.70, powerAttr: 'mp', cd: 0, target: 'enemy_front', mpBurnPct: 0.10 },
  { id: 'mana_storm', name: '法力风暴', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【魔法·全体】伤害 = 自身魔法值 × 50%，对全体敌人造成奥术伤害。\n伤害公式：自身魔法值×0.50×技能加成 − 目标防御×0.7。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 0.50, powerAttr: 'mp', cd: 0, target: 'enemy_all' },
  { id: 'arcane_resonance', name: '奥术共鸣', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【魔法·单体·双击】攻击2次，每击造成 50% 魔法值的奥术伤害。\n总伤害 ≈ 自身魔法值×1.00×技能加成 − 目标防御×1.4。\n每击独立判定暴击。基础暴击率10%。',
    element: '奥术', dmgPct: 0.50, powerAttr: 'mp', cd: 0, target: 'enemy_front', hits: 2 },
  // 防御系进阶
  { id: 'iron_bulwark', name: '钢铁壁垒', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【防御·单体·增益】伤害 = 自身防御力 × 300%，自身防御+20%持续3回合。\n伤害公式：自身防御力×3.00×技能加成 − 目标防御×0.7。\n防御越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 3.00, powerAttr: 'def', cd: 0, target: 'enemy_front', defBuff: 0.20, buffTurns: 3 },
  { id: 'counter_storm', name: '反击风暴', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【防御·单体·反击】伤害 = 自身防御力 × 400%，开启反击50%持续3回合。\n伤害公式：自身防御力×4.00×技能加成 − 目标防御×0.7。\n反击：受到攻击时反击50%伤害。基础暴击率10%。',
    element: '无', dmgPct: 4.00, powerAttr: 'def', cd: 0, target: 'enemy_front', counterBuff: 0.50, counterTurns: 3 },
  { id: 'guardian_wrath', name: '守护之怒', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【防御·群体·秒4·嘲讽】伤害 = 自身防御力 × 200%，对4个目标造成伤害并全体嘲讽1回合。\n每目标伤害：自身防御力×2.00×技能加成 − 目标防御×0.7。\n嘲讽：敌人只能攻击施法者。基础暴击率10%。',
    element: '无', dmgPct: 2.00, powerAttr: 'def', cd: 0, target: 'enemy_all', targetCount: 4, tauntTurns: 1 },
  { id: 'unshakable', name: '不可撼动', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【防御·单体·护盾】伤害 = 自身防御力 × 600%，并获得护盾（自身防御×300%）持续2回合。\n伤害公式：自身防御力×6.00×技能加成 − 目标防御×0.7。\n护盾：吸收自身防御力×300%的伤害。基础暴击率10%。',
    element: '无', dmgPct: 6.00, powerAttr: 'def', cd: 0, target: 'enemy_front', shieldPct: 3.00, shieldTurns: 2 },
  { id: 'fortress_crush', name: '要塞碾压', type: 'active', category: 'single_atk', quality: 'legend',
    desc: '【防御·单体·降防】伤害 = 自身防御力 × 450%，降低目标30%防御2回合。\n伤害公式：自身防御力×4.50×技能加成 − 目标防御×0.7。\n降防：目标防御-30%，持续2回合。基础暴击率10%。',
    element: '无', dmgPct: 4.50, powerAttr: 'def', cd: 0, target: 'enemy_front', defReduce: 0.30, defReduceTurns: 2 },
  // 速度系进阶
  { id: 'gale_combo', name: '疾风连击', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【速度·单体·三击】攻击3次，每击造成 100% 速度的伤害。\n总伤害 ≈ 自身速度×3.00×技能加成 − 目标防御×2.1。\n每击独立判定暴击。基础暴击率10%。',
    element: '无', dmgPct: 1.00, powerAttr: 'spd', cd: 0, target: 'enemy_front', hits: 3 },
  { id: 'lightning_raid', name: '闪电突袭', type: 'active', category: 'aoe_atk', quality: 'epic',
    desc: '【速度·群体·秒3】伤害 = 自身速度 × 200%，对3个目标造成雷电伤害，20%概率眩晕1回合。\n每目标伤害：自身速度×2.00×技能加成 − 目标防御×0.7。\n速度越高，伤害越强。基础暴击率10%。',
    element: '雷', dmgPct: 2.00, powerAttr: 'spd', cd: 0, target: 'enemy_all', targetCount: 3, stunChance: 0.20, stunTurns: 1 },
  { id: 'storm_blade', name: '风暴之刃', type: 'active', category: 'single_atk', quality: 'legend',
    desc: '【速度·单体·高暴击】伤害 = 自身速度 × 400%，+30%暴击率。\n伤害公式：自身速度×4.00×技能加成 − 目标防御×0.7。\n暴击率 = 10%+30%+被动加成（暴击×1.5）。',
    element: '无', dmgPct: 4.00, powerAttr: 'spd', cd: 0, target: 'enemy_front', bonusCrit: 0.30 },
  { id: 'shadow_clone', name: '影分身', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【速度·群体·秒4·必中】伤害 = 自身速度 × 250%，对4个目标造成伤害，必定命中。\n每目标伤害：自身速度×2.50×技能加成 − 目标防御×0.7。\n速度越高，伤害越强。基础暴击率10%。',
    element: '暗', dmgPct: 2.50, powerAttr: 'spd', cd: 0, target: 'enemy_all', targetCount: 4, alwaysHit: true },
  { id: 'wind_whisper', name: '风之低语', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【速度·单体·闪避增益】伤害 = 自身速度 × 250%，自身闪避+15%持续3回合。\n伤害公式：自身速度×2.50×技能加成 − 目标防御×0.7。\n闪避：被攻击时15%概率闪避。基础暴击率10%。',
    element: '无', dmgPct: 2.50, powerAttr: 'spd', cd: 0, target: 'enemy_front', dodgeBuff: 0.15, buffTurns: 3 },
  // 嘲嘲类技能
  { id: 'taunt', name: '嘲讽', type: 'active', category: 'single_cc', quality: 'uncommon',
    desc: '【控制·单体·嘲讽】强制目标攻击自己，持续2回合。\n被嘲讽的目标只能攻击施法者。',
    element: '无', cd: 0, target: 'enemy_front', tauntTurns: 2 },
  { id: 'provoke', name: '挑衅', type: 'active', category: 'aoe_cc', quality: 'rare',
    desc: '【控制·全体·嘲讽】全体嘲讽，强制所有敌人攻击自己，持续1回合。\n被嘲讽的敌人只能攻击施法者。',
    element: '无', cd: 0, target: 'enemy_all', tauntTurns: 1 },
  // 控制类技能
  { id: 'freeze_trap', name: '冰冻陷阱', type: 'active', category: 'single_cc', quality: 'rare',
    desc: '【控制·单体·冰冻】冰冻目标2回合，无法行动。\n冰冻：无法行动，受到攻击有概率破冰。',
    element: '冰', dmgPct: 0.5, cd: 0, target: 'enemy_front', freezeChance: 0.80, freezeTurns: 2 },
  { id: 'stun_wave', name: '震晕波', type: 'active', category: 'aoe_cc', quality: 'rare',
    desc: '【控制·全体·眩晕】震晕全体敌人1回合，无法行动。\n眩晕：无法行动。',
    element: '无', dmgPct: 0.3, cd: 0, target: 'enemy_all', stunChance: 0.60, stunTurns: 1 },
  { id: 'sleep_powder', name: '催眠粉', type: 'active', category: 'single_cc', quality: 'uncommon',
    desc: '【控制·单体·睡眠】催眠目标3回合，无法行动。\n睡眠：无法行动，受到攻击会醒来。',
    element: '无', dmgPct: 0.4, cd: 0, target: 'enemy_front', sleepChance: 0.70, sleepTurns: 3 },
  { id: 'silence_field', name: '沉默领域', type: 'active', category: 'aoe_cc', quality: 'rare',
    desc: '【控制·全体·沉默】沉默全体敌人2回合，无法使用主动技能。\n沉默：无法使用主动技能。',
    element: '暗', dmgPct: 0.3, cd: 0, target: 'enemy_all', silenceChance: 0.60, silenceTurns: 2 },
];

// ===== 主动技能品质系统 =====
// 品质分级：common（普通）、uncommon（优秀）、rare（稀有）、epic（史诗）、legend（传说）
const SKILL_QUALITY_NAMES = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legend: '传说',
};
const SKILL_QUALITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legend: '#f59e0b',
};
// 按品质定义的主动技能书商城价格（钻石）- 需求26
// 需求：按技能书强度梯度全面上调售价（约3倍）
const SKILL_QUALITY_PRICES = {
  common: 15,      // 普通品质
  uncommon: 60,    // 优秀品质
  rare: 240,       // 稀有品质
  epic: 900,       // 史诗品质
  legend: 3000,    // 传说品质
};
// 需求8：主动技能品质正序排序权重（用于技能书商店展示）
const SKILL_QUALITY_ORDER = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legend: 4,
};

// 判断技能是否为辅助类（与 battle.js 中 isPhysicalSkill 保持一致逻辑）
function isSkillSupport(s) {
  return s.category === 'single_heal' || s.category === 'aoe_heal' || s.category === 'single_buff' || s.category === 'aoe_buff';
}
// 判断技能是否为法术类（魔法元素：冰/雷/暗/光/毒；辅助技能归为法术类触发概率）
function isSkillMagic(s) {
  if (isSkillSupport(s)) return true;
  var magicElements = ['冰', '雷', '暗', '光', '毒'];
  return !!(s.element && magicElements.indexOf(s.element) >= 0);
}

// 特殊技能品质覆盖（融合限定、强力复活/狂暴等单独指定）
var SKILL_QUALITY_OVERRIDE = {
  chaos_strike: 'epic',     // 融合限定·全体+回血
  doom_inferno: 'epic',     // 融合限定·灼烧3回合
  time_rift: 'epic',        // 融合限定·必暴+眩晕
  time_reverse: 'epic',     // 复活技·冷却
  berserker_fury: 'epic',   // 攻击+80%/防御-30%
  emergency_heal: 'epic',   // 单体60%治疗+冷却
  resurrection: 'rare',      // 单体复活
  phoenix_revive: 'epic',   // 凤凰涅槃·复活+持续恢复
  mass_resurrection: 'legend', // 群体复活+攻击增益
};

// 按强度规则为每个主动技能分配 quality 字段
ACTIVE_SKILLS.forEach(function(s) {
  if (s.quality) return; // 已显式指定则保留
  if (SKILL_QUALITY_OVERRIDE[s.id]) { s.quality = SKILL_QUALITY_OVERRIDE[s.id]; return; }
  var dmgPct = s.dmgPct || 0;
  var hasExecute = !!(s.executeThreshold && s.executeMult);          // 斩杀
  var hasMultiHit = !!(s.hits && s.hits >= 3);                        // 多段（3+次）
  var strongCC = ((s.freezeChance || 0) >= 0.4 && (s.freezeTurns || 0) >= 2) ||
                 ((s.stunChance || 0) >= 0.4) ||
                 ((s.silenceChance || 0) >= 0.35 && (s.silenceTurns || 0) >= 2);
  var hasControl = !!(s.freezeChance || s.stunChance || s.silenceChance || s.rootChance || s.sleepChance);
  var hasExtraEffect = !!(s.vampPct || s.burnTurns || s.poisonTurns || s.ignoreDefPct || s.defReduce ||
                          s.trueDmg || s.stealAtk || s.counterBuff || s.reflectBuff || s.shieldPct ||
                          s.hotPct || s.healPct || s.revive || s.bonusCrit || s.atkBuff || s.defBuff ||
                          s.spdBuff || s.allBuff || s.stackPoison || s.selfDmgPct || s.hits);

  // 优先级从高到低判断
  if (hasExecute || hasMultiHit || dmgPct > 3.5) {
    s.quality = 'legend';
  } else if (dmgPct >= 2.5 || strongCC) {
    s.quality = 'epic';
  } else if (dmgPct >= 2.0 || hasControl) {
    s.quality = 'rare';
  } else if (dmgPct >= 1.5 || hasExtraEffect) {
    s.quality = 'uncommon';
  } else {
    s.quality = 'common';
  }
});

// 主动技能统一追加触发概率信息到描述中 + 前置品质标签
// 触发概率：物理 8%（上限15%）、法术 20%（上限40%）、辅助 25%（上限50%）
// 多技能独立判断，最多3个主动技能生效
ACTIVE_SKILLS.forEach(function(s) {
  var isSup = isSkillSupport(s);
  var isMag = isSkillMagic(s);
  var typeLabel, baseChance, capChance;
  if (isSup) {
    typeLabel = '辅助'; baseChance = 0.25; capChance = 0.50;
  } else if (isMag) {
    typeLabel = '法术'; baseChance = 0.20; capChance = 0.40;
  } else {
    typeLabel = '物理'; baseChance = 0.08; capChance = 0.15;
  }
  s.desc += '\n⏱ 触发概率：基础' + Math.floor(baseChance * 100) + '%（' + typeLabel + '上限' + Math.floor(capChance * 100) + '%，受技能触发加成提升，多技能独立判断，最多3个主动技能生效）';
  // 前置品质标签
  var qName = SKILL_QUALITY_NAMES[s.quality] || '普通';
  s.desc = '[' + qName + '] ' + s.desc;
});

// 站位系统
const FORMATION_POSITIONS = [
  { id: 'front', name: '前排', icon: '🛡️', order: 0 },
  { id: 'mid', name: '中排', icon: '⚔️', order: 1 },
  { id: 'back', name: '后排', icon: '🏹', order: 2 },
];

// ==================== 阵法系统 ====================
// 阵法：对不同位置的宠物产生不同增益，满级5级
// bonus: { front: {}, mid: {}, back: {} } per level (level 1-5, multiplier)
// baseLevelBonus 为1级时的加成，每升一级 +20% 加成 (lv5 = baseLevelBonus × 1.8)
const FORMATIONS = [
  // 需求10：阵法重做，参考梦幻西游，每个阵法有独特的站位效果和特色加成
  // 每个阵法包含5个位置（前/中/后/左/右），不同位置有不同属性加成
  // aura 字段为阵法全体效果（数据定义，供战斗系统扩展使用）
  {
    id: 'attack_formation',
    name: '天覆阵',
    icon: '⚔️',
    color: '#ef4444',
    desc: '【全体攻击型】全体伤害+10%，但速度-5%。前排主攻，中后排强化输出。',
    aura: { dmgBonus: 0.10, spdPct: -0.05 },
    bonus: {
      front: { atkPct: 0.15 },           // 前排：攻击+15%
      mid: { atkPct: 0.10, critRate: 0.05 },   // 中排：攻击+10%，暴击+5%
      back: { atkPct: 0.10, critDmg: 0.15 },  // 后排：攻击+10%，暴伤+15%
      left: { atkPct: 0.12, critRate: 0.03 },  // 左翼：攻击+12%，暴击+3%
      right: { atkPct: 0.12, critDmg: 0.10 }, // 右翼：攻击+12%，暴伤+10%
    },
  },
  {
    id: 'defense_formation',
    name: '地载阵',
    icon: '🛡️',
    color: '#3b82f6',
    desc: '【全体防御型】全体防御+15%，受到AOE伤害-10%。稳如磐石，适合持久战。',
    aura: { defPct: 0.15, aoeReduce: 0.10 },
    bonus: {
      front: { defPct: 0.20, hpPct: 0.10 },   // 前排：防御+20%，气血+10%
      mid: { defPct: 0.15, dmgReduce: 0.08 },  // 中排：防御+15%，减伤+8%
      back: { defPct: 0.15, hpPct: 0.12 },     // 后排：防御+15%，气血+12%
      left: { defPct: 0.15, dmgReduce: 0.05 }, // 左翼：防御+15%，减伤+5%
      right: { defPct: 0.15, dmgReduce: 0.05 },// 右翼：防御+15%，减伤+5%
    },
  },
  {
    id: 'speed_formation',
    name: '风扬阵',
    icon: '💨',
    color: '#06b6d4',
    desc: '【速度型】速度+15%，暴击率+5%。抢占先机，疾风骤雨。',
    aura: { spdPct: 0.15, critRate: 0.05 },
    bonus: {
      front: { spdPct: 0.15, dodgeRate: 0.05 }, // 前排：速度+15%，闪避+5%
      mid: { spdPct: 0.18, critRate: 0.08 },    // 中排：速度+18%，暴击+8%
      back: { spdPct: 0.15, hitRate: 0.10 },    // 后排：速度+15%，命中+10%
      left: { spdPct: 0.15, critRate: 0.05 },   // 左翼：速度+15%，暴击+5%
      right: { spdPct: 0.15, critRate: 0.05 },  // 右翼：速度+15%，暴击+5%
    },
  },
  {
    id: 'magic_formation',
    name: '云垂阵',
    icon: '🔮',
    color: '#a855f7',
    desc: '【法术型】法术伤害+15%，物理伤害-5%。强化法术输出，适合法系阵容。',
    aura: { magicDmgPct: 0.15, physDmgPct: -0.05 },
    bonus: {
      front: { intPct: 0.12, magicDmgPct: 0.10 }, // 前排：灵力+12%，法伤+10%
      mid: { magicDmgPct: 0.18, mpPct: 0.15 },    // 中排：法伤+18%，魔法+15%
      back: { intPct: 0.15, magicDmgPct: 0.12 },  // 后排：灵力+15%，法伤+12%
      left: { magicDmgPct: 0.15, mpPct: 0.10 },   // 左翼：法伤+15%，魔法+10%
      right: { magicDmgPct: 0.15, intPct: 0.08 }, // 右翼：法伤+15%，灵力+8%
    },
  },
  {
    id: 'snake_formation',
    name: '蛇蟠阵',
    icon: '🐍',
    color: '#10b981',
    desc: '【闪避型】闪避+10%，被攻击时有10%概率免疫。灵动如蛇，规避伤害。',
    aura: { dodgeRate: 0.10, immuneChance: 0.10 },
    bonus: {
      front: { dodgeRate: 0.12, hpPct: 0.08 },   // 前排：闪避+12%，气血+8%
      mid: { dodgeRate: 0.15, spdPct: 0.08 },    // 中排：闪避+15%，速度+8%
      back: { dodgeRate: 0.12, hitRate: 0.10 },   // 后排：闪避+12%，命中+10%
      left: { dodgeRate: 0.10, spdPct: 0.05 },   // 左翼：闪避+10%，速度+5%
      right: { dodgeRate: 0.10, spdPct: 0.05 },  // 右翼：闪避+10%，速度+5%
    },
  },
  {
    id: 'ambush_formation',
    name: '鸟翔阵',
    icon: '🦅',
    color: '#0ea5e9',
    desc: '【突击型】速度+10%，首回合额外行动一次。先发制人，迅猛突击。',
    aura: { spdPct: 0.10, firstTurnExtra: true },
    bonus: {
      front: { spdPct: 0.12, atkPct: 0.10 },     // 前排：速度+12%，攻击+10%
      mid: { spdPct: 0.15, critRate: 0.05 },     // 中排：速度+15%，暴击+5%
      back: { spdPct: 0.12, hitRate: 0.10 },     // 后排：速度+12%，命中+10%
      left: { spdPct: 0.10, atkPct: 0.08 },      // 左翼：速度+10%，攻击+8%
      right: { spdPct: 0.10, atkPct: 0.08 },     // 右翼：速度+10%，攻击+8%
    },
  },
  {
    id: 'balance_formation',
    name: '龙飞阵',
    icon: '🐉',
    color: '#f59e0b',
    desc: '【平衡型】全属性+5%，各位置均衡发展，万金油阵法。',
    aura: { allPct: 0.05 },
    bonus: {
      front: { allPct: 0.06, defPct: 0.05 },    // 前排：全属性+6%，防御+5%
      mid: { allPct: 0.06, atkPct: 0.05 },      // 中排：全属性+6%，攻击+5%
      back: { allPct: 0.06, intPct: 0.05 },     // 后排：全属性+6%，灵力+5%
      left: { allPct: 0.05, hpPct: 0.05 },      // 左翼：全属性+5%，气血+5%
      right: { allPct: 0.05, spdPct: 0.05 },    // 右翼：全属性+5%，速度+5%
    },
  },
];

// 阵法等级上限
const FORMATION_MAX_LEVEL = 5;
// 需求11：阵法升级经验优化
// 1级→2级需要5经验，2级→3级需要25经验，3级→4级需要125经验，4级→5级需要600经验
function getFormationExpForLevel(level) {
  var expTable = { 1: 5, 2: 25, 3: 125, 4: 600 };
  return expTable[level] || 999999; // 满级后返回超大值
}
// 需求11：阵法书提供经验值（初级/中级/高级阵法书对应不同经验）
const FORMATION_BOOK_EXP = {
  primary: 5,        // 初级阵法书 +5 经验
  intermediate: 25,  // 中级阵法书 +25 经验
  advanced: 125,     // 高级阵法书 +125 经验
};

// 计算阵法在某等级的加成倍率：1级×1.0, 每升一级+0.2, 5级×1.8
function getFormationLevelMult(level) {
  return 1 + (level - 1) * 0.2;
}

// 阵法书道具ID前缀
const FORMATION_BOOK_PREFIX = 'formation_book_';

// ==================== 血统珠系统 ====================
// 血统珠道具：3个等级（低/中/高），用于抽取不同T级宠物的血统
// 抽取后获得 "extracted_blood_orb" 道具，含来源宠物名、血统ID、品质
const BLOOD_ORB_TIERS = [
  { id: 'blood_orb_low', name: '低级血统珠', icon: '🔮', color: '#9ca3af',
    desc: '可抽取 T1-T2 宠物的血统，必出史诗品质血统珠',
    minTier: 1, maxTier: 2, qualityChance: { epic: 1.0, legendary: 0 } },
  { id: 'blood_orb_mid', name: '中级血统珠', icon: '🔮', color: '#3b82f6',
    desc: '可抽取 T3-T4 宠物的血统，按宠物品质决定血统珠品质',
    minTier: 3, maxTier: 4, qualityChance: { epic: 0.6, legendary: 0.4 } },
  { id: 'blood_orb_high', name: '高级血统珠', icon: '🔮', color: '#a855f7',
    desc: '可抽取 T5 宠物的血统，按宠物品质决定血统珠品质',
    minTier: 5, maxTier: 5, qualityChance: { epic: 0.3, legendary: 0.7 } },
];

// 血统抽取品质概率（随机，与宠物品质无关）- 需求8
// 普通30% / 优秀25% / 稀有20% / 史诗15% / 传说10%
const BLOOD_ORB_RANDOM_QUALITY = {
  common: 0.30, uncommon: 0.25, rare: 0.20, epic: 0.15, legendary: 0.10,
};

// 血统珠品质加成倍率
const BLOOD_ORB_QUALITY_MULT = {
  common: 0.6,      // 普通品质：60% 原血统能力
  uncommon: 0.8,    // 优秀品质：80% 原血统能力
  rare: 1.0,        // 稀有品质：100% 原血统能力
  epic: 1.2,        // 史诗品质：120% 原血统能力
  legendary: 1.5,   // 传说品质：150% 原血统能力
};

const BLOOD_ORB_QUALITY_NAMES = { common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' };
const BLOOD_ORB_QUALITY_COLORS = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };

// 血统珠分解规则（需求8）：不同品质分解成不同等级的血统珠道具
// 史诗/传说 → 高级血统珠；稀有 → 中级血统珠；普通/优秀 → 低级血统珠
const BLOOD_ORB_DECOMPOSE_RULES = {
  common: 'blood_orb_low',
  uncommon: 'blood_orb_low',
  rare: 'blood_orb_mid',
  epic: 'blood_orb_high',
  legendary: 'blood_orb_high',
};

// 血统试炼活动配置
const BLOODLINE_TRIAL = {
  id: 'bloodline_trial',
  name: '血统试炼',
  minLevel: 20,
  desc: '挑战血统试炼，击败血统守护者获得血统珠道具',
};

// [已移除] 进阶试炼活动配置已删除（进阶系统全量移除）

// ==================== 宠物派遣奇遇系统（DISPATCH）====================
// 核心机制：闲置宠物可派遣至已通过地图探索，派遣3只宠物
// 总战斗力需达到标准才能开始，战斗力越高额外收益加成
// 探索时长可选 1/4/8 小时，基础产出金币、养成材料，低概率掉落稀有道具
var DISPATCH_DURATIONS = [
  { hours: 1, label: '1小时', mult: 1.0 },
  { hours: 4, label: '4小时', mult: 4.5 },
  { hours: 8, label: '8小时', mult: 10.0 },
];

// 派遣地图配置：地图通关后解锁对应派遣区域
// v2.11.0 需求2.1：材料名 ancient_rune_* → war_book_*（宠装材料）
var DISPATCH_MAPS = [
  { mapId: 1,  name: '起源草地',   minPower: 500,    rewardMult: 1.0, materials: ['forge_stone_low','mystic_crystal_low'],              rarePool: ['rare_egg'], unlockDesc: '通过起源草地' },
  { mapId: 2,  name: '新手森林',   minPower: 2000,   rewardMult: 1.5, materials: ['forge_stone_low','mystic_crystal_low','war_book_low'], rarePool: ['rare_egg','blood_orb_low'], unlockDesc: '通过新手森林' },
  { mapId: 3,  name: '幽暗矿洞',   minPower: 5000,   rewardMult: 2.0, materials: ['forge_stone_mid','mystic_crystal_low','war_book_low'], rarePool: ['rare_egg','blood_orb_low','skill_random'], unlockDesc: '通过幽暗矿洞' },
  { mapId: 4,  name: '亡灵墓地',   minPower: 10000,  rewardMult: 2.5, materials: ['forge_stone_mid','mystic_crystal_mid','war_book_low'], rarePool: ['rare_egg','blood_orb_mid','skill_random'], unlockDesc: '通过亡灵墓地' },
  { mapId: 5,  name: '烈焰火山',   minPower: 20000,  rewardMult: 3.0, materials: ['forge_stone_mid','mystic_crystal_mid','war_book_mid'], rarePool: ['rare_egg','blood_orb_mid','skill_random'], unlockDesc: '通过烈焰火山' },
  { mapId: 6,  name: '冰霜高原',   minPower: 35000,  rewardMult: 3.5, materials: ['forge_stone_high','mystic_crystal_mid','war_book_mid'], rarePool: ['rare_egg','blood_orb_mid','skill_random'], unlockDesc: '通过冰霜高原' },
  { mapId: 7,  name: '暗影沼泽',   minPower: 50000,  rewardMult: 4.0, materials: ['forge_stone_high','mystic_crystal_high','war_book_mid'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过暗影沼泽' },
  { mapId: 8,  name: '天空之城',   minPower: 80000,  rewardMult: 4.5, materials: ['forge_stone_high','mystic_crystal_high','war_book_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过天空之城' },
  { mapId: 9,  name: '深渊裂隙',   minPower: 120000, rewardMult: 5.0, materials: ['forge_stone_high','mystic_crystal_high','war_book_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过深渊裂隙' },
  { mapId: 10, name: '龙之巢穴',   minPower: 180000, rewardMult: 5.5, materials: ['forge_stone_high','mystic_crystal_high','war_book_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过龙之巢穴' },
  { mapId: 11, name: '终焉神殿',   minPower: 250000, rewardMult: 6.0, materials: ['forge_stone_high','mystic_crystal_high','war_book_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过终焉神殿' },
];

// 派遣奖励基础值（1小时基础）
var DISPATCH_BASE_REWARD = {
  gold: 1000,      // 基础金币
  exp: 500,         // 基础经验
  materialCount: 2, // 基础材料数量
  rareChance: 0.05, // 稀有道具掉落概率（5%）
};

// 战斗力额外加成：超过最低战力每10%额外+5%奖励
var DISPATCH_POWER_BONUS_PER_10PCT = 0.05;

// 同时派遣上限
var DISPATCH_MAX_SLOTS = 3;

// 需求2：阵法押镖活动配置（参考梦幻西游押镖）
const FORMATION_ESCORT = {
  id: 'formation_escort',
  name: '押镖运送',
  minLevel: 15,
  dailyLimit: 3,
  stages: 4, // 共4个阶段（路线上的关卡）
  desc: '护送镖车安全抵达目的地，每阶段击败拦路怪物获得阵法书奖励，全部完成额外金币奖励',
};

// 需求6：赚取技能书活动配置
const SKILL_BOOK_HUNT = {
  id: 'skill_book_hunt',
  name: '技能秘境挑战',
  minLevel: 25,
  dailyLimit: 3,
  maxStages: 5,
  desc: '挑战技能秘境多层关卡，越高阶越难但奖励越丰厚',
  // 各阶段怪物强度倍率和奖励倍率
  stageConfig: [
    { stage: 1, hpMult: 1.0, atkMult: 1.0, rewardMult: 1.0, name: '初级' },
    { stage: 2, hpMult: 1.5, atkMult: 1.3, rewardMult: 1.5, name: '中级' },
    { stage: 3, hpMult: 2.0, atkMult: 1.6, rewardMult: 2.2, name: '高级' },
    { stage: 4, hpMult: 2.8, atkMult: 2.0, rewardMult: 3.0, name: '精英' },
    { stage: 5, hpMult: 4.0, atkMult: 2.5, rewardMult: 4.5, name: '宗师' },
  ],
};

// 需求5：血统副本配置
const BLOODLINE_DUNGEON_CFG = {
  id: 'bloodline_dungeon',
  name: '血统副本',
  minLevel: 25,
  desc: '挑战血统守护者，掉落各级血统珠',
  // 副本配置：5波怪物，最后一波boss掉落血统珠
  waves: 5,
  // 血统珠掉落概率（每波）
  dropChance: [0, 0, 0.10, 0.20, 1.0], // 第1-2波不掉，第3波10%，第4波20%，第5波boss必掉
  // 血统珠等级分布
  orbTierChance: { low: 0.60, mid: 0.30, high: 0.10 },
};

// 竞技场段位
const ARENA_RANKS = [
  { id: 'bronze', name: '青铜', icon: '🥉', minScore: 0, color: '#cd7f32' },
  { id: 'silver', name: '白银', icon: '🥈', minScore: 1000, color: '#c0c0c0' },
  { id: 'gold', name: '黄金', icon: '🥇', minScore: 2000, color: '#ffd700' },
  { id: 'platinum', name: '铂金', icon: '💎', minScore: 3500, color: '#e5e4e2' },
  { id: 'diamond', name: '钻石', icon: '💠', minScore: 5500, color: '#b9f2ff' },
  { id: 'master', name: '大师', icon: '👑', minScore: 8000, color: '#ff4500' },
];

// 藏宝图品质
const TREASURE_MAP_RARITIES = [
  { id: 'white', name: '普通藏宝图', icon: '⚪', color: '#9ca3af', affixCount: 1 },
  { id: 'green', name: '精良藏宝图', icon: '🟢', color: '#22c55e', affixCount: 2 },
  { id: 'blue', name: '稀有藏宝图', icon: '🔵', color: '#3b82f6', affixCount: 3 },
  { id: 'purple', name: '史诗藏宝图', icon: '🟣', color: '#a855f7', affixCount: 4 },
  { id: 'orange', name: '传说藏宝图', icon: '🟠', color: '#f97316', affixCount: 5 },
];

// 藏宝图词条
const TREASURE_AFFIXES = [
  { id: 'gold_bonus', name: '金币奖励', format: v => `金币 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.8) },
  { id: 'exp_bonus', name: '经验奖励', format: v => `经验 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.8) },
  { id: 'equip_drop', name: '装备掉落率', format: v => `装备掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'egg_drop', name: '宠物蛋掉落率', format: v => `蛋掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'skill_drop', name: '技能书掉落率', format: v => `技能书掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'moon_dew', name: '月华露数量', format: v => `月华露 +${v}`, genVal: () => randomInt(1, 5) },
  { id: 'diamond_bonus', name: '钻石奖励', format: v => `钻石 +${v}`, genVal: () => randomInt(5, 30) },
  { id: 'monster_power', name: '怪物强度', format: v => `怪物强度 +${Math.floor(v*100)}%（奖励更多）`, genVal: () => randomFloat(0.2, 0.6) },
  // v2.2.0 需求10：新增词缀
  { id: 'gem_drop', name: '宝石掉落率', format: v => `宝石掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.8) },
  { id: 'pet_exp_bonus', name: '宠物经验加成', format: v => `宠物经验 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'forge_stone_drop', name: '强化石掉落率', format: v => `强化石掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 0.8) },
  { id: 'dig_item_drop', name: '密藏道具掉落', format: v => `密藏道具掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.6) },
];

const TREASURE_SPECIAL_AFFIXES = [
  { id: 'double_reward', name: '双倍奖励', format: () => '所有奖励翻倍！' },
  { id: 'guaranteed_egg', name: '必出宠物蛋', format: () => '必定掉落一颗稀有蛋' },
  { id: 'guaranteed_equip', name: '必出装备', format: () => '必定掉落一件史诗以上装备' },
  // v2.2.0 需求10：新增特殊词缀
  { id: 'triple_reward', name: '三倍奖励', format: () => '所有奖励三倍！！' },
  { id: 'guaranteed_dig_map', name: '必出密藏图', format: () => '必定掉落一张密藏图' },
];

// 需求5：藏宝图地图类型 - 以主线的11张图为名字，按风格分配宠物类型
// 每张图对应一个宠物蛋掉落池（按图风格选宠物）
const TREASURE_MAP_TYPES = [
  { id: 1, name: '起源草地', icon: '🌿', mapId: 1, desc: '起源之地的温和宠物', petPool: ['小史莱姆','绿毛虫','野鼠','麻雀','青蛙','蜗牛','蝌蚪','小田鼠','泥巴怪','落叶虫','萌新史莱姆','小石子','飘浮气泡'] },
  { id: 2, name: '新手森林', icon: '🌲', mapId: 2, desc: '森林中的精灵与野兽', petPool: ['小精灵','小树精','花仙子','蘑菇人','萤火虫','风精灵','微光蝶','嫩芽精','小孢子','风信子','露珠精','林间鹿','月牙兔'] },
  { id: 3, name: '幽暗矿洞', icon: '⛏️', mapId: 3, desc: '矿洞中的岩石生物', petPool: ['小地精','刺猬','小石怪','铜甲蟹','铁甲蚁','岩蜥蜴','苔藓鼠','锈甲虫','小石子','灰岩龟','苔甲蜥','青铜蟹','巨角羊'] },
  { id: 4, name: '亡灵墓地', icon: '💀', mapId: 4, desc: '亡灵与暗影生物', petPool: ['小骷髅','小幽灵','蝙蝠崽','小恶魔犬','腐尸虫','暮色鸦','暗影貂','幻影鸦','稻草人','小跳蛛','暗影狼'] },
  { id: 5, name: '烈焰火山', icon: '🌋', mapId: 5, desc: '火焰与熔岩生物', petPool: ['幼龙','小龙崽','火蜥蜴','流火蜥','烈焰犬','赤焰马','焚天魔','烈焰龙骑','烈日战神','火焰领主','烈风隼王'] },
  { id: 6, name: '冰霜高原', icon: '❄️', mapId: 6, desc: '冰霜与寒风生物', petPool: ['霜精灵','霜狼','雪雏','寒霜鼠','寒冰蝶','霜羽雕','冰封王','寒冰女王','冰霜巨龙','玄冰蛇','玄冰麒麟'] },
  { id: 7, name: '暗影沼泽', icon: '🌫️', mapId: 7, desc: '沼泽中的毒物', petPool: ['青苔蛇','泥潭怪','沙蝎','沙暴蝎','毒液蜘蛛','血藤蛇','幽冥蛇君','玄冥蛟','暗影刺客','暗夜君王','泥巴怪'] },
  { id: 8, name: '天空之城', icon: '☁️', mapId: 8, desc: '天空的飞禽与天使', petPool: ['雏鹰','黑鸦','灰羽雀','岩鸽','紫羽鸽','啼鸣鸟','雷羽雀','烬羽鸟','紫电隼','翔云马','风暴巨雕','烈风雕','天空霸主'] },
  { id: 9, name: '深渊裂隙', icon: '🌌', mapId: 9, desc: '深渊的恶魔生物', petPool: ['小恶魔','影狐','碧眼猫','幻影鸦','暗影貂','幻影蝶','暗夜蝙蝠','虚空魔神','永夜主宰','虚空主宰','混沌之眼'] },
  { id: 10, name: '龙之巢穴', icon: '🐉', mapId: 10, desc: '远古龙族栖息地', petPool: ['幼龙','小龙崽','火蜥蜴','银鳞龙','苍穹龙','冰封王','圣辉麒麟','混沌麒麟','乾坤龙尊','远古龙神','混沌魔龙','创世神龙','灭世魔龙'] },
  { id: 11, name: '终焉神殿', icon: '⛪', mapId: 11, desc: '终焉的神圣生物', petPool: ['光之子','晨曦鹿','银光鹿','圣光天使','永恒天使','创世天使','圣渊天马','圣光审判','圣光龙神','万物之母','太初神兽','万古灵尊'] },
];

// 需求5：根据地图类型ID获取宠物蛋掉落池
function getTreasureMapPetPool(typeId) {
  var t = TREASURE_MAP_TYPES.find(function(x) { return x.id === typeId; });
  return t ? t.petPool : [];
}

// 需求5：根据地图类型ID获取地图类型信息
function getTreasureMapType(typeId) {
  return TREASURE_MAP_TYPES.find(function(x) { return x.id === typeId; }) || null;
}

const PASSIVE_SKILLS = [
  { id: 'crit_strike', name: '必杀', type: 'passive', tier: 1, desc: '暴击率+10%', effect: { critRate: 0.10 } },
  { id: 'crit_strike_2', name: '高级必杀', type: 'passive', tier: 2, desc: '暴击率+20%', effect: { critRate: 0.20 } },
  { id: 'crit_strike_3', name: '超级必杀', type: 'passive', tier: 3, desc: '暴击率+35%，暴击伤害+50%', effect: { critRate: 0.35, critDmg: 0.50 } },
  { id: 'double_atk', name: '连击', type: 'passive', tier: 1, desc: '20%概率追加一次攻击', effect: { doubleChance: 0.20 } },
  { id: 'double_atk_2', name: '高级连击', type: 'passive', tier: 2, desc: '35%概率追加一次攻击', effect: { doubleChance: 0.35 } },
  { id: 'double_atk_3', name: '超级连击', type: 'passive', tier: 3, desc: '45%概率追加一次攻击，10%概率追加两次', effect: { doubleChance: 0.45, tripleChance: 0.10 } },
  { id: 'sneak_atk', name: '偷袭', type: 'passive', tier: 1, desc: '攻击力+10%', effect: { atkBonus: 0.10 } },
  { id: 'sneak_atk_2', name: '高级偷袭', type: 'passive', tier: 2, desc: '攻击力+18%', effect: { atkBonus: 0.18 } },
  { id: 'sneak_atk_3', name: '超级偷袭', type: 'passive', tier: 3, desc: '攻击力+28%，无视10%防御', effect: { atkBonus: 0.28, ignoreDef: 0.10 } },
  { id: 'power_up', name: '强力', type: 'passive', tier: 1, desc: '力量属性+15%', effect: { strBonus: 0.15 } },
  { id: 'power_up_2', name: '高级强力', type: 'passive', tier: 2, desc: '力量属性+25%', effect: { strBonus: 0.25 } },
  { id: 'power_up_3', name: '超级强力', type: 'passive', tier: 3, desc: '力量属性+40%，攻击+10%', effect: { strBonus: 0.40, atkBonus: 0.10 } },
  { id: 'def_up', name: '防御', type: 'passive', tier: 1, desc: '防御力+15%', effect: { defBonus: 0.15 } },
  { id: 'def_up_2', name: '高级防御', type: 'passive', tier: 2, desc: '防御力+25%', effect: { defBonus: 0.25 } },
  { id: 'def_up_3', name: '超级防御', type: 'passive', tier: 3, desc: '防御力+40%，受到伤害-10%', effect: { defBonus: 0.40, dmgReduce: 0.10 } },
  { id: 'parry', name: '招架', type: 'passive', tier: 1, desc: '15%概率格挡减伤50%', effect: { parryChance: 0.15, parryReduce: 0.50 } },
  { id: 'parry_2', name: '高级招架', type: 'passive', tier: 2, desc: '25%概率格挡减伤60%', effect: { parryChance: 0.25, parryReduce: 0.60 } },
  { id: 'parry_3', name: '超级招架', type: 'passive', tier: 3, desc: '35%概率格挡减伤70%，格挡后反击', effect: { parryChance: 0.35, parryReduce: 0.70, parryCounter: true } },
  { id: 'dodge', name: '闪避', type: 'passive', tier: 1, desc: '闪避率+10%', effect: { dodgeBonus: 0.10 } },
  { id: 'dodge_2', name: '高级闪避', type: 'passive', tier: 2, desc: '闪避率+18%', effect: { dodgeBonus: 0.18 } },
  { id: 'dodge_3', name: '超级闪避', type: 'passive', tier: 3, desc: '闪避率+28%，闪避后反击', effect: { dodgeBonus: 0.28, dodgeCounter: true } },
  { id: 'regen', name: '再生', type: 'passive', tier: 1, desc: '每回合恢复5%气血', effect: { regenPct: 0.05 } },
  { id: 'regen_2', name: '高级再生', type: 'passive', tier: 2, desc: '每回合恢复8%气血', effect: { regenPct: 0.08 } },
  { id: 'regen_3', name: '超级再生', type: 'passive', tier: 3, desc: '每回合恢复12%气血，战斗开始时额外恢复20%', effect: { regenPct: 0.12, regenStart: 0.20 } },
  { id: 'vampire', name: '吸血', type: 'passive', tier: 1, desc: '攻击恢复伤害的10%气血', effect: { vampPct: 0.10 } },
  { id: 'vampire_2', name: '高级吸血', type: 'passive', tier: 2, desc: '攻击恢复伤害的18%气血', effect: { vampPct: 0.18 } },
  { id: 'vampire_3', name: '超级吸血', type: 'passive', tier: 3, desc: '攻击恢复伤害的28%气血，暴击时吸血翻倍', effect: { vampPct: 0.28, vampCritDouble: true } },
  { id: 'reflect', name: '反震', type: 'passive', tier: 1, desc: '受到攻击反弹15%伤害', effect: { reflectPct: 0.15 } },
  { id: 'reflect_2', name: '高级反震', type: 'passive', tier: 2, desc: '受到攻击反弹25%伤害', effect: { reflectPct: 0.25 } },
  { id: 'reflect_3', name: '超级反震', type: 'passive', tier: 3, desc: '受到攻击反弹35%伤害，10%概率眩晕攻击者', effect: { reflectPct: 0.35, stunChance: 0.10 } },
  { id: 'revive', name: '神佑', type: 'passive', tier: 1, desc: '死亡时15%概率复活恢复50%血', effect: { reviveChance: 0.15, revivePct: 0.50 } },
  { id: 'revive_2', name: '高级神佑', type: 'passive', tier: 2, desc: '死亡时25%概率复活恢复70%血', effect: { reviveChance: 0.25, revivePct: 0.70 } },
  { id: 'revive_3', name: '超级神佑', type: 'passive', tier: 3, desc: '死亡时35%概率复活恢复100%血并提升20%攻击', effect: { reviveChance: 0.35, revivePct: 1.00, reviveAtk: 0.20 } },
  { id: 'speed_up', name: '敏捷', type: 'passive', tier: 1, desc: '速度+15%', effect: { speedBonus: 0.15 } },
  { id: 'speed_up_2', name: '高级敏捷', type: 'passive', tier: 2, desc: '速度+25%', effect: { speedBonus: 0.25 } },
  { id: 'speed_up_3', name: '超级敏捷', type: 'passive', tier: 3, desc: '速度+40%，先手攻击概率+20%', effect: { speedBonus: 0.40, firstStrike: 0.20 } },
  { id: 'magic_heart', name: '魔心', type: 'passive', tier: 1, desc: '技能伤害+15%', effect: { skillDmg: 0.15 } },
  { id: 'magic_heart_2', name: '高级魔心', type: 'passive', tier: 2, desc: '技能伤害+25%', effect: { skillDmg: 0.25 } },
  { id: 'magic_heart_3', name: '超级魔心', type: 'passive', tier: 3, desc: '技能伤害+40%，技能触发率+10%', effect: { skillDmg: 0.40, skillTrigger: 0.10 } },
  { id: 'magic_double', name: '法连', type: 'passive', tier: 1, desc: '主动技能20%概率连放两次', effect: { skillDouble: 0.20 } },
  { id: 'magic_double_2', name: '高级法连', type: 'passive', tier: 2, desc: '主动技能30%概率连放两次', effect: { skillDouble: 0.30 } },
  { id: 'magic_double_3', name: '超级法连', type: 'passive', tier: 3, desc: '主动技能40%概率连放两次，第二次不衰减', effect: { skillDouble: 0.40, skillDoubleFull: true } },
  { id: 'lucky', name: '幸运', type: 'passive', tier: 1, desc: '受到暴击概率-20%', effect: { antiCrit: 0.20 } },
  { id: 'lucky_2', name: '高级幸运', type: 'passive', tier: 2, desc: '受到暴击概率-40%，闪避+5%', effect: { antiCrit: 0.40, dodgeBonus: 0.05 } },
  { id: 'lucky_3', name: '超级幸运', type: 'passive', tier: 3, desc: '不会被暴击，闪避+10%，受到伤害-5%', effect: { antiCrit: 1.00, dodgeBonus: 0.10, dmgReduce: 0.05 } },
  // ===== 参考2026长安幻想新增技能 =====
  // 强壮：减伤型生存技能（区别于防御的加防）
  { id: 'sturdy', name: '强壮', type: 'passive', tier: 1, desc: '受到伤害-5%，气血上限+8%', effect: { dmgReduce: 0.05 } },
  { id: 'sturdy_2', name: '高级强壮', type: 'passive', tier: 2, desc: '受到伤害-10%，气血上限+15%', effect: { dmgReduce: 0.10 } },
  { id: 'sturdy_3', name: '超级强壮', type: 'passive', tier: 3, desc: '受到伤害-18%，气血上限+25%，受到致命伤时减伤翻倍', effect: { dmgReduce: 0.18 } },
  // 穿透：无视防御型输出技能（区别于偷袭的加攻）
  { id: 'penetration', name: '穿透', type: 'passive', tier: 1, desc: '无视5%防御', effect: { ignoreDef: 0.05 } },
  { id: 'penetration_2', name: '高级穿透', type: 'passive', tier: 2, desc: '无视10%防御', effect: { ignoreDef: 0.10 } },
  { id: 'penetration_3', name: '超级穿透', type: 'passive', tier: 3, desc: '无视18%防御，攻击力+8%', effect: { ignoreDef: 0.18, atkBonus: 0.08 } },
  // 精准：暴击+攻击双加成（长安幻想热门技能）
  { id: 'precision', name: '精准', type: 'passive', tier: 1, desc: '暴击率+5%，攻击力+5%', effect: { critRate: 0.05, atkBonus: 0.05 } },
  { id: 'precision_2', name: '高级精准', type: 'passive', tier: 2, desc: '暴击率+10%，攻击力+10%', effect: { critRate: 0.10, atkBonus: 0.10 } },
  { id: 'precision_3', name: '超级精准', type: 'passive', tier: 3, desc: '暴击率+15%，攻击力+15%，暴击伤害+30%', effect: { critRate: 0.15, atkBonus: 0.15, critDmg: 0.30 } },
  // 追击：击倒后追击（长安幻想核心输出技能，区别于连击的随机双击）
  { id: 'pursuit', name: '追击', type: 'passive', tier: 1, desc: '15%概率追加一次攻击', effect: { doubleChance: 0.15 } },
  { id: 'pursuit_2', name: '高级追击', type: 'passive', tier: 2, desc: '25%概率追加一次攻击', effect: { doubleChance: 0.25 } },
  { id: 'pursuit_3', name: '超级追击', type: 'passive', tier: 3, desc: '35%概率追加一次攻击，10%概率追加两次', effect: { doubleChance: 0.35, tripleChance: 0.10 } },
  // 保命：濒死保命（长安幻想保命技能，区别于神佑的满血复活）
  { id: 'survival', name: '保命', type: 'passive', tier: 1, desc: '死亡时20%概率保留1点血', effect: { reviveChance: 0.20, revivePct: 0.01 } },
  { id: 'survival_2', name: '高级保命', type: 'passive', tier: 2, desc: '死亡时30%概率保留1点血并恢复20%血', effect: { reviveChance: 0.30, revivePct: 0.20 } },
  { id: 'survival_3', name: '超级保命', type: 'passive', tier: 3, desc: '死亡时40%概率保留1点血并恢复40%血，攻击+15%', effect: { reviveChance: 0.40, revivePct: 0.40, reviveAtk: 0.15 } },
  // 超级撕裂：2026长安幻想物理核心超级技能（保底伤害）
  { id: 'tear_3', name: '超级撕裂', type: 'passive', tier: 3, desc: '无视20%防御，攻击力+12%，造成保底伤害', effect: { ignoreDef: 0.20, atkBonus: 0.12 } },
  // 超级暴伤：2026长安幻想通用爆发技能
  { id: 'crit_dmg_3', name: '超级暴伤', type: 'passive', tier: 3, desc: '暴击伤害+60%，暴击率+8%', effect: { critDmg: 0.60, critRate: 0.08 } },
  // ===== 参考长安幻想普通被动技能 =====
  { id: 'charge', name: '突进', type: 'passive', tier: 1, desc: '攻击力+8%，先手概率+10%', effect: { atkBonus: 0.08, firstStrike: 0.10 } },
  { id: 'magic_fluctuation', name: '法术波动', type: 'passive', tier: 1, desc: '技能伤害在90%~140%间波动，平均+10%', effect: { skillDmg: 0.10 } },
  { id: 'focus', name: '会心', type: 'passive', tier: 1, desc: '暴击伤害+25%', effect: { critDmg: 0.25 } },
  { id: 'meditation', name: '冥思', type: 'passive', tier: 1, desc: '每回合恢复5%魔法值', effect: { mpRegenPct: 0.05 } },
  { id: 'miracle', name: '神迹', type: 'passive', tier: 1, desc: '回合末自动解除异常状态，受到暴击-15%', effect: { antiCrit: 0.15 } },
  { id: 'counter', name: '反击', type: 'passive', tier: 1, desc: '受到攻击时20%概率反击，反弹15%伤害', effect: { reflectPct: 0.15 } },
  { id: 'solid_magic', name: '固法', type: 'passive', tier: 1, desc: '法术防御+15%', effect: { defBonus: 0.15 } },
  { id: 'magic_absorb', name: '法术吸收', type: 'passive', tier: 1, desc: '受到伤害-8%，有概率吸收法术伤害', effect: { dmgReduce: 0.08 } },
  { id: 'perception', name: '感知', type: 'passive', tier: 1, desc: '暴击率+5%，攻击力+5%，无视隐身', effect: { critRate: 0.05, atkBonus: 0.05 } },
  { id: 'poison_atk', name: '毒', type: 'passive', tier: 1, desc: '攻击时20%概率使目标中毒', effect: { doubleChance: 0.20 } },
  { id: 'stealth', name: '隐身', type: 'passive', tier: 1, desc: '进入战斗隐身3回合，闪避+10%', effect: { dodgeBonus: 0.10 } },
  { id: 'cooperation', name: '协力', type: 'passive', tier: 1, desc: '全队存活时攻击力+12%', effect: { atkBonus: 0.12 } },
  { id: 'initiative', name: '先发', type: 'passive', tier: 1, desc: '速度+15%，先手概率+15%', effect: { speedBonus: 0.15, firstStrike: 0.15 } },
  { id: 'unity', name: '归一', type: 'passive', tier: 1, desc: '死亡时15%概率复活恢复30%血', effect: { reviveChance: 0.15, revivePct: 0.30 } },
  { id: 'solid_shield', name: '坚盾', type: 'passive', tier: 1, desc: '防御+10%，受到伤害-5%', effect: { defBonus: 0.10, dmgReduce: 0.05 } },
  { id: 'tenacity', name: '坚韧', type: 'passive', tier: 1, desc: '受到伤害-8%，15%概率格挡', effect: { dmgReduce: 0.08, parryChance: 0.15, parryReduce: 0.40 } },
  { id: 'brave', name: '英勇', type: 'passive', tier: 1, desc: '攻击力+8%，免疫恐惧和胁迫', effect: { atkBonus: 0.08, antiCrit: 0.10 } },
  { id: 'concentration', name: '专注', type: 'passive', tier: 1, desc: '暴击率+8%，攻击力+3%', effect: { critRate: 0.08, atkBonus: 0.03 } },
  { id: 'charge_up', name: '蓄势', type: 'passive', tier: 1, desc: '每回合攻击力+3%，最多+15%', effect: { atkBonus: 0.05 } },
  { id: 'momentum', name: '气势', type: 'passive', tier: 1, desc: '前两回合攻击力+15%', effect: { atkBonus: 0.10, skillDmg: 0.05 } },
  { id: 'longevity', name: '长生', type: 'passive', tier: 1, desc: '每回合恢复4%气血，气血上限+5%', effect: { regenPct: 0.04 } },
  { id: 'wind_chaser', name: '追风', type: 'passive', tier: 1, desc: '速度+20%，闪避+5%', effect: { speedBonus: 0.20, dodgeBonus: 0.05 } },
  { id: 'blink', name: '闪现', type: 'passive', tier: 1, desc: '首回合闪避+30%', effect: { dodgeBonus: 0.15 } },
  { id: 'instant_strike', name: '瞬击', type: 'passive', tier: 1, desc: '15%概率瞬发追加攻击', effect: { doubleChance: 0.15 } },
  { id: 'self_heal', name: '自愈', type: 'passive', tier: 1, desc: '每回合恢复6%气血，免疫封印', effect: { regenPct: 0.06 } },
  { id: 'clear_mind', name: '清心', type: 'passive', tier: 1, desc: '免疫沉默，受到暴击-20%', effect: { antiCrit: 0.20 } },
  { id: 'retaliation', name: '报复', type: 'passive', tier: 1, desc: '受到攻击时25%概率反弹20%伤害', effect: { reflectPct: 0.20 } },
  { id: 'counter_strike', name: '逆击', type: 'passive', tier: 1, desc: '受到攻击时20%概率反击造成50%攻击伤害', effect: { reflectPct: 0.15 } },
  { id: 'eternity', name: '永恒', type: 'passive', tier: 1, desc: '增益状态持续回合+1，技能伤害+8%', effect: { skillDmg: 0.08 } },
  // ===== 需求8：法术类被动技能（增加法术防御/法术辅助类被动，平衡物理/法术比例） =====
  // 法术护盾系：以法力抵伤
  { id: 'mana_shield', name: '法术护盾', type: 'passive', tier: 1, desc: '受到伤害的10%由法力承担', effect: { manaShield: 0.10 } },
  { id: 'mana_shield_2', name: '高级法术护盾', type: 'passive', tier: 2, desc: '受到伤害的20%由法力承担', effect: { manaShield: 0.20 } },
  { id: 'mana_shield_3', name: '超级法术护盾', type: 'passive', tier: 3, desc: '受到伤害的30%由法力承担，法力恢复+5%', effect: { manaShield: 0.30, mpRegenPct: 0.05 } },
  // 法术抵抗系：减少受到的法术伤害
  { id: 'spell_resist', name: '法术抵抗', type: 'passive', tier: 1, desc: '受到法术伤害-10%', effect: { magicDmgReduce: 0.10 } },
  { id: 'spell_resist_2', name: '高级法术抵抗', type: 'passive', tier: 2, desc: '受到法术伤害-18%', effect: { magicDmgReduce: 0.18 } },
  { id: 'spell_resist_3', name: '超级法术抵抗', type: 'passive', tier: 3, desc: '受到法术伤害-28%，免疫沉默', effect: { magicDmgReduce: 0.28 } },
  // 法术穿透系：无视法术防御
  { id: 'spell_pen', name: '法穿', type: 'passive', tier: 1, desc: '法术无视8%防御', effect: { spellPen: 0.08 } },
  { id: 'spell_pen_2', name: '高级法穿', type: 'passive', tier: 2, desc: '法术无视15%防御', effect: { spellPen: 0.15 } },
  { id: 'spell_pen_3', name: '超级法穿', type: 'passive', tier: 3, desc: '法术无视22%防御，技能伤害+10%', effect: { spellPen: 0.22, skillDmg: 0.10 } },
  // 法术暴击系：法术专属暴击
  { id: 'spell_crit', name: '法术暴击', type: 'passive', tier: 1, desc: '法术暴击率+10%', effect: { spellCritRate: 0.10 } },
  { id: 'spell_crit_2', name: '高级法术暴击', type: 'passive', tier: 2, desc: '法术暴击率+18%，法术暴击伤害+25%', effect: { spellCritRate: 0.18, spellCritDmg: 0.25 } },
  { id: 'spell_crit_3', name: '超级法术暴击', type: 'passive', tier: 3, desc: '法术暴击率+28%，法术暴击伤害+50%', effect: { spellCritRate: 0.28, spellCritDmg: 0.50 } },
  // 法力充能系：提升法力上限和恢复
  { id: 'mana_pool', name: '法力充沛', type: 'passive', tier: 1, desc: '法力上限+20%，每回合恢复3%法力', effect: { manaMaxPct: 0.20, mpRegenPct: 0.03 } },
  { id: 'mana_pool_2', name: '高级法力充沛', type: 'passive', tier: 2, desc: '法力上限+35%，每回合恢复5%法力', effect: { manaMaxPct: 0.35, mpRegenPct: 0.05 } },
  { id: 'mana_pool_3', name: '超级法力充沛', type: 'passive', tier: 3, desc: '法力上限+50%，每回合恢复8%法力，技能伤害+10%', effect: { manaMaxPct: 0.50, mpRegenPct: 0.08, skillDmg: 0.10 } },
  // 奥术系：综合法术增强
  { id: 'arcane_focus', name: '奥术聚焦', type: 'passive', tier: 1, desc: '法术伤害+12%，法力恢复3%', effect: { skillDmg: 0.12, mpRegenPct: 0.03 } },
  { id: 'arcane_focus_2', name: '高级奥术聚焦', type: 'passive', tier: 2, desc: '法术伤害+20%，法力恢复5%，法术穿透5%', effect: { skillDmg: 0.20, mpRegenPct: 0.05, spellPen: 0.05 } },
  { id: 'arcane_focus_3', name: '超级奥术聚焦', type: 'passive', tier: 3, desc: '法术伤害+30%，法力恢复8%，法术穿透10%，法术暴击+10%', effect: { skillDmg: 0.30, mpRegenPct: 0.08, spellPen: 0.10, spellCritRate: 0.10 } },
  // 元素亲和系：减少受到的元素伤害并增强对应法术
  { id: 'element_ward', name: '元素守护', type: 'passive', tier: 1, desc: '受到元素伤害-12%', effect: { magicDmgReduce: 0.12 } },
  { id: 'element_ward_2', name: '高级元素守护', type: 'passive', tier: 2, desc: '受到元素伤害-20%，法术伤害+8%', effect: { magicDmgReduce: 0.20, skillDmg: 0.08 } },
  { id: 'element_ward_3', name: '超级元素守护', type: 'passive', tier: 3, desc: '受到元素伤害-30%，法术伤害+15%，每回合恢复3%法力', effect: { magicDmgReduce: 0.30, skillDmg: 0.15, mpRegenPct: 0.03 } },
  // 法术反制系：被攻击时有概率反弹法术伤害
  { id: 'spell_reflect', name: '法术反制', type: 'passive', tier: 1, desc: '受到法术攻击时15%概率反弹30%伤害', effect: { spellReflectChance: 0.15, spellReflectPct: 0.30 } },
  { id: 'spell_reflect_2', name: '高级法术反制', type: 'passive', tier: 2, desc: '受到法术攻击时25%概率反弹40%伤害', effect: { spellReflectChance: 0.25, spellReflectPct: 0.40 } },
  { id: 'spell_reflect_3', name: '超级法术反制', type: 'passive', tier: 3, desc: '受到法术攻击时35%概率反弹50%伤害，反弹时恢复5%法力', effect: { spellReflectChance: 0.35, spellReflectPct: 0.50, mpRegenPct: 0.05 } },
  // 灵力系：提升魔力属性
  { id: 'intellect_up', name: '灵力', type: 'passive', tier: 1, desc: '魔力属性+15%', effect: { intBonus: 0.15 } },
  { id: 'intellect_up_2', name: '高级灵力', type: 'passive', tier: 2, desc: '魔力属性+25%，法力上限+10%', effect: { intBonus: 0.25, manaMaxPct: 0.10 } },
  { id: 'intellect_up_3', name: '超级灵力', type: 'passive', tier: 3, desc: '魔力属性+40%，法力上限+20%，法术伤害+10%', effect: { intBonus: 0.40, manaMaxPct: 0.20, skillDmg: 0.10 } },
];

const AURA_SKILLS = [
  { id: 'aura_atk', name: '力量光环', type: 'aura', tier: 1, desc: '全队攻击力+8%', effect: { teamAtk: 0.08 } },
  { id: 'aura_atk_2', name: '高级力量光环', type: 'aura', tier: 2, desc: '全队攻击力+15%', effect: { teamAtk: 0.15 } },
  { id: 'aura_atk_3', name: '超级力量光环', type: 'aura', tier: 3, desc: '全队攻击力+25%', effect: { teamAtk: 0.25 } },
  { id: 'aura_def', name: '防御光环', type: 'aura', tier: 1, desc: '全队防御力+8%', effect: { teamDef: 0.08 } },
  { id: 'aura_def_2', name: '高级防御光环', type: 'aura', tier: 2, desc: '全队防御力+15%', effect: { teamDef: 0.15 } },
  { id: 'aura_def_3', name: '超级防御光环', type: 'aura', tier: 3, desc: '全队防御力+25%', effect: { teamDef: 0.25 } },
  { id: 'aura_spd', name: '速度光环', type: 'aura', tier: 1, desc: '全队速度+8%', effect: { teamSpd: 0.08 } },
  { id: 'aura_spd_2', name: '高级速度光环', type: 'aura', tier: 2, desc: '全队速度+15%', effect: { teamSpd: 0.15 } },
  { id: 'aura_spd_3', name: '超级速度光环', type: 'aura', tier: 3, desc: '全队速度+25%', effect: { teamSpd: 0.25 } },
  { id: 'aura_hp', name: '生命光环', type: 'aura', tier: 1, desc: '全队气血上限+10%', effect: { teamHp: 0.10 } },
  { id: 'aura_hp_2', name: '高级生命光环', type: 'aura', tier: 2, desc: '全队气血上限+18%', effect: { teamHp: 0.18 } },
  { id: 'aura_hp_3', name: '超级生命光环', type: 'aura', tier: 3, desc: '全队气血上限+30%', effect: { teamHp: 0.30 } },
  { id: 'aura_crit', name: '暴击光环', type: 'aura', tier: 1, desc: '全队暴击率+5%', effect: { teamCrit: 0.05 } },
  { id: 'aura_crit_2', name: '高级暴击光环', type: 'aura', tier: 2, desc: '全队暴击率+10%', effect: { teamCrit: 0.10 } },
  { id: 'aura_crit_3', name: '超级暴击光环', type: 'aura', tier: 3, desc: '全队暴击率+18%', effect: { teamCrit: 0.18 } },
  { id: 'aura_regen', name: '回复光环', type: 'aura', tier: 1, desc: '全队每回合恢复3%气血', effect: { teamRegen: 0.03 } },
  { id: 'aura_regen_2', name: '高级回复光环', type: 'aura', tier: 2, desc: '全队每回合恢复5%气血', effect: { teamRegen: 0.05 } },
  { id: 'aura_regen_3', name: '超级回复光环', type: 'aura', tier: 3, desc: '全队每回合恢复8%气血', effect: { teamRegen: 0.08 } },
];

// 需求12：统一技能库（SKILL_LIBRARY）- 商城/宠物/怪物的技能信息均来自此库
// 包含所有主动/被动/光环/血统技能，修改技能只需改这里其他地方自动同步
const ALL_SKILLS = [...ACTIVE_SKILLS, ...PASSIVE_SKILLS, ...AURA_SKILLS];
// 技能库完整索引（含血统技能），统一查询入口
const SKILL_LIBRARY = [...ALL_SKILLS, ...BLOODLINE_SKILLS];

function getSkillById(id) {
  // 优先从完整技能库查询（包含血统技能）
  return SKILL_LIBRARY.find(s => s.id === id) || ALL_SKILLS.find(s => s.id === id);
}

function getSkillBaseId(id) {
  return id.replace(/_(2|3)$/, '');
}

function getSkillBaseName(name) {
  return name.replace(/^(超级|高级)/, '');
}

function getEffectiveSkills(pet) {
  const all = getAllSkills(pet);
  const bestByBase = {};
  all.forEach(s => {
    const baseId = getSkillBaseId(s.id);
    if (!bestByBase[baseId] || getSkillTier(s.id) > getSkillTier(bestByBase[baseId].id)) {
      bestByBase[baseId] = s;
    }
  });
  const effectiveIds = new Set(Object.values(bestByBase).map(s => s.id));
  return all.map(s => ({
    ...s,
    isEffective: effectiveIds.has(s.id),
  }));
}

function getSkillTier(id) {
  if (id.endsWith('_3')) return 3;
  if (id.endsWith('_2')) return 2;
  return 1;
}

function getSkillTierLabel(tier) {
  if (tier === 3) return '超级';
  if (tier === 2) return '高级';
  return '初级';
}

function getSkillTierColor(tier) {
  if (tier === 3) return '#f59e0b';
  if (tier === 2) return '#a855f7';
  return '#22c55e';
}

function getSkillTypeIcon(type) {
  if (type === 'bloodline') return '👑';
  if (type === 'active') return '⚔️';
  if (type === 'passive') return '🛡️';
  if (type === 'aura') return '✨';
  return '📖';
}

function getSkillTypeLabel(type) {
  if (type === 'bloodline') return '血统';
  if (type === 'active') return '主动';
  if (type === 'passive') return '被动';
  if (type === 'aura') return '光环';
  return '技能';
}
