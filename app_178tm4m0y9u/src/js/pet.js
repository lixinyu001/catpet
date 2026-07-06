// ===== pet.js : 瀹犵墿鐢熸垚銆佸睘鎬с€佹妧鑳姐€佽泲銆佽瀺鍚?=====

// ==================== PET DISPLAY NAME ====================

// 获取宠物展示名称：优先使用自定义名称，无则使用真名
// 异化宠物（isSpecialTag=true）在真名/自定义名前加 ★ 后缀·异，仅用于展示，不影响 getPetDex 查找
function getPetDisplayName(pet) {
  if (!pet) return '';
  var base = pet.customName || pet.name || '';
  if (pet.isSpecialTag && !pet.customName) return '★' + base + '·异';
  if (pet.isSpecialTag && pet.customName) return '★' + base + '·异';
  return base;
}

// 重命名宠物（仅修改展示名称，不改变真名）
function renamePet(petId, newName) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  newName = (newName || '').trim();
  if (newName.length === 0) {
    // 空名称则清除自定义名称，恢复真名
    delete pet.customName;
    showToast('🔄 已恢复原名：' + pet.name, 'info');
  } else if (newName.length > 12) {
    showToast('❌ 名称过长（最多12字）', 'error');
  } else {
    pet.customName = newName;
    showToast('✏️ 已重命名为：' + newName, 'success');
  }
  saveGame();
  if (typeof render === 'function') render();
}

// ==================== PET GENERATION ====================

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max) { return Math.random() * (max - min) + min; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generatePetBase(forcedName, qualityBoost) {
  const name = forcedName || PET_NAMES[randomInt(0, PET_NAMES.length - 1)];
  const dex = getPetDex(name);
  const race = dex.race;

  // 异化判定：1.5% 概率出现异化品质
  // 正常情况下成长和资质都在图鉴上下限内随机，只有异化时才突破上限
  var isSpecial = Math.random() < 0.015;
  var rarity;

  const aptitude = {};
  APTITUDE_KEYS.forEach(function(k) {
    var range = dex.aptRange[k] || [1200, 1800];
    var lo = range[0], hi = range[1];
    if (isSpecial) {
      // 异化：资质突破上限10-20%
      var overPct = randomFloat(0.10, 0.20);
      aptitude[k] = Math.min(3000, Math.floor(hi * (1 + overPct)));
    } else {
      // 正常：资质在上下限内随机
      aptitude[k] = randomInt(lo, hi);
    }
  });

  // 成长值
  var gMin = dex.growthRange[0];
  var gMax = dex.growthRange[1];
  var growth;
  if (isSpecial) {
    // 异化：成长突破上限10-20%
    var overPct = randomFloat(0.10, 0.20);
    growth = Math.round(gMax * (1 + overPct) * 100) / 100;
    growth = Math.min(growth, gMax * 1.25);
  } else {
    // 正常：成长在上下限内随机
    growth = Math.round(randomFloat(gMin, gMax) * 100) / 100;
  }

  // 品质判定
  if (isSpecial) {
    rarity = 'special';
  } else {
    // 品质由成长和资质决定：越接近上限品质越高
    var gScore = (growth - gMin) / Math.max(0.01, gMax - gMin); // 0~1
    var aptScoreSum = 0, aptScoreCount = 0;
    APTITUDE_KEYS.forEach(function(k) {
      var range = dex.aptRange[k] || [1200, 1800];
      aptScoreSum += (aptitude[k] - range[0]) / Math.max(1, range[1] - range[0]);
      aptScoreCount++;
    });
    var aptScore = aptScoreCount > 0 ? aptScoreSum / aptScoreCount : 0.5; // 0~1
    var qualityScore = gScore * 0.45 + aptScore * 0.55; // 成长占45%，资质占55%
    // 抽蛋池品质加成：qualityScore 统一提高
    if (qualityBoost) qualityScore = Math.min(1, qualityScore * (1 + qualityBoost));

    // 品质分布：普通40% / 优秀25% / 稀有20% / 史诗10% / 传说4% / 神话1%
    if (qualityScore < 0.40) rarity = 'common';
    else if (qualityScore < 0.65) rarity = 'uncommon';
    else if (qualityScore < 0.85) rarity = 'rare';
    else if (qualityScore < 0.95) rarity = 'epic';
    else if (qualityScore < 0.99) rarity = 'legendary';
    else rarity = 'mythic';
  }

  const bloodline = BLOODLINE_SKILLS.find(b => b.race === race);

  // 技能库系统：天生技能必带，其余从技能库随机获得（可能1个~满技能）
  var maxSkills = getPetMaxSkills(name); // 6
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
  // 从技能库随机获得额外技能（可能0个~满技能）
  var availableLib = skillLibIds.map(function(id){ return ALL_SKILLS.find(function(s){ return s.id === id; }); })
    .filter(function(s){ return s && !usedBaseIds.has(getSkillBaseId(s.id)); });
  // 总技能数随机：至少max(1, innate数量)，最多maxSkills
  var minTotal = Math.max(1, innateSkills.length);
  var totalSkills = randomInt(minTotal, maxSkills);
  var extraCount = totalSkills - innateSkills.length;
  for (var i = 0; i < extraCount && availableLib.length > 0; i++) {
    var idx = randomInt(0, availableLib.length - 1);
    var sk = availableLib.splice(idx, 1)[0];
    innateSkills.push({ ...sk, isInnate: true });
    usedBaseIds.add(getSkillBaseId(sk.id));
  }

  // 需求2：进阶系统字段 - advanceValue 进阶值, advanceStage 进阶阶段(0=未进阶,2=top)
  // T3 mid 宠物可直接孵化（无幼年体），孵化即成长体，天生成长资质较强
  // mid 宠物 advanceable=true（可进阶到 top）；base 宠物 advanceable=false（不再进阶）
  var advStage = 0;
  var advMidChain = (typeof PET_ADVANCE_CHAINS !== 'undefined')
    ? PET_ADVANCE_CHAINS.find(function(c) { return c.mid === name; })
    : null;
  return {
    name: name,
    race, rarity, growth, aptitude, bloodline,
    innateSkills, learnedSkills: [], level: 1, moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    advanceValue: 0,      // 进阶值，达到阈值升级
    advanceStage: advStage, // 0=未进阶（mid 或 base），2=T5(top)
    advanceable: !!advMidChain, // 需求2：仅 mid 名可进阶
    id: 'pet_' + Date.now() + '_' + randomInt(1000, 9999),
  };
}

// 根据宠物当前的成长和资质重新计算品质（重生/融合/月华露等刷新品质）
// qualityBoost 可选：抽蛋池品质加成
// 注意：异化(special)仅在生成时1.5%概率判定，recalcRarity不自动判定异化
// 成长/资质超过图鉴上限时按满分1.0计算（月华露培养的宠物可达到更高品质）
function recalcRarity(pet, qualityBoost) {
  if (!pet || !pet.name) return pet ? pet.rarity : 'common';
  // 异化品质保持不变（生成时已固定）
  if (pet.rarity === 'special') return 'special';
  var dex = getPetDex(pet.name);
  var gMin = dex.growthRange[0], gMax = dex.growthRange[1];
  var growth = pet.growth || gMin;
  // 成长得分：超过上限按1.0计算
  var gScore = (growth - gMin) / Math.max(0.01, gMax - gMin);
  gScore = Math.max(0, Math.min(1, gScore));
  var aptScoreSum = 0, aptScoreCount = 0;
  APTITUDE_KEYS.forEach(function(k) {
    var range = dex.aptRange[k] || [1200, 1800];
    var val = (pet.aptitude && pet.aptitude[k]) || range[0];
    // 资质得分：超过上限按1.0计算
    var score = (val - range[0]) / Math.max(1, range[1] - range[0]);
    aptScoreSum += Math.max(0, Math.min(1, score));
    aptScoreCount++;
  });
  var aptScore = aptScoreCount > 0 ? aptScoreSum / aptScoreCount : 0.5;
  var qualityScore = gScore * 0.45 + aptScore * 0.55;
  if (qualityBoost) qualityScore = Math.min(1, qualityScore * (1 + qualityBoost));
  // 需求11：宠物品质判断调整 - 史诗0.85-0.9，传说0.9-0.95，神话0.95以上
  if (qualityScore < 0.40) return 'common';
  if (qualityScore < 0.65) return 'uncommon';
  if (qualityScore < 0.85) return 'rare';
  if (qualityScore < 0.90) return 'epic';
  if (qualityScore < 0.95) return 'legendary';
  return 'mythic';
}

function getPetStats(pet) {
  const lv = pet.level;
  const growth = pet.growth || 1.0;
  const apt = pet.aptitude || { 力量资质:1500, 体质资质:1500, 敏捷资质:1500, 智力资质:1500 };
  const rv = getRaceValues(pet.race);
  // 宠物装备加成：在计算属性前应用（含基础词条、随机词条、套装）
  var peBonus = (typeof getPetEquipBonus === 'function') ? getPetEquipBonus(pet) : null;
  var peGrowthAdd = peBonus ? peBonus.growthAddition : 0;
  var peAptAdd = peBonus ? peBonus.aptAdditions : null;
  // 宠物装备基础词条（攻击/气血/防御）作为附加绝对值
  var peBaseAtk = 0, peBaseHp = 0, peBaseDef = 0;
  if (pet.petEquipment) {
    ['attack','hp','defense'].forEach(function(slot) {
      var e = pet.petEquipment[slot];
      if (!e) return;
      // 需求5：基础词条受封印解封比例影响
      var unsealRatio = (typeof getPetEquipUnsealRatio === 'function') ? getPetEquipUnsealRatio(e) : 1;
      if (e.slot === 'attack') peBaseAtk += Math.floor((e.baseValue || 0) * unsealRatio);
      if (e.slot === 'hp') peBaseHp += Math.floor((e.baseValue || 0) * unsealRatio);
      if (e.slot === 'defense') peBaseDef += Math.floor((e.baseValue || 0) * unsealRatio);
    });
  }
  // 应用宠物装备的成长和资质加成
  var effectiveGrowth = growth + peGrowthAdd;
  var effectiveApt = { 力量资质: apt.力量资质, 体质资质: apt.体质资质, 敏捷资质: apt.敏捷资质, 智力资质: apt.智力资质 };
  if (peAptAdd) {
    effectiveApt.力量资质 += peAptAdd.力量资质 || 0;
    effectiveApt.体质资质 += peAptAdd.体质资质 || 0;
    effectiveApt.敏捷资质 += peAptAdd.敏捷资质 || 0;
    effectiveApt.智力资质 += peAptAdd.智力资质 || 0;
  }
  // 属性公式（种族值系统）：
  // 基础 = (资质/100) × 成长 × (1 + 等级×0.05)
  // 种族值贡献 = 等级 × 成长 × 种族值
  // 总属性 = 基础 + 种族值贡献
  const aptFactor = function(val) { return (val || 1500) / 100; };
  const lvFactor = 1 + lv * 0.05;
  var 体质 = Math.round(aptFactor(effectiveApt.体质资质) * effectiveGrowth * lvFactor + lv * effectiveGrowth * rv.体质);
  var 力量 = Math.round(aptFactor(effectiveApt.力量资质) * effectiveGrowth * lvFactor + lv * effectiveGrowth * rv.力量);
  var 敏捷 = Math.round(aptFactor(effectiveApt.敏捷资质) * effectiveGrowth * lvFactor + lv * effectiveGrowth * rv.敏捷);
  var 智慧 = Math.round(aptFactor(effectiveApt.智力资质) * effectiveGrowth * lvFactor + lv * effectiveGrowth * rv.智力);
  // 派生战斗属性（种族值通过四维间接影响，不再单独设气血/法力种族系数）
  var 气血 = Math.round(体质 * 10 + lv * 20);
  var 魔法值 = Math.round(力量 * 1.5 + 智慧 * 2 + lv * 5);
  var 攻击力 = Math.round(力量 * 2 + 敏捷 * 0.5);
  var 防御力 = Math.round(体质 * 0.6);
  var 灵力 = Math.round(智慧 * 2);
  var 速度 = Math.round(敏捷 * 1.5);
  // 宠物装备随机词条（属性加成）
  if (peBonus && peBonus.statAdditions) {
    体质 += peBonus.statAdditions.体质 || 0;
    力量 += peBonus.statAdditions.力量 || 0;
    敏捷 += peBonus.statAdditions.敏捷 || 0;
    智慧 += peBonus.statAdditions.智力 || 0;
    气血 += peBonus.statAdditions.气血 || 0;
    攻击力 += peBonus.statAdditions.攻击力 || 0;
    防御力 += peBonus.statAdditions.防御力 || 0;
    速度 += peBonus.statAdditions.速度 || 0;
  }
  // 宝石加成（运行时 getGemStatBonus 已定义）
  var gemBonus = (typeof getGemStatBonus === 'function') ? getGemStatBonus() : null;
  if (gemBonus) {
    体质 += gemBonus.体质 || 0;
    力量 += gemBonus.力量 || 0;
    敏捷 += gemBonus.敏捷 || 0;
    智慧 += gemBonus.智慧 || 0;
    气血 += gemBonus.气血 || 0;
    魔法值 += gemBonus.魔法值 || 0;
    // 四维宝石会影响衍生属性
    攻击力 = Math.round(力量 * 2 + 敏捷 * 0.5);
    防御力 = Math.round(体质 * 0.6);
    灵力 = Math.round(智慧 * 2);
    速度 = Math.round(敏捷 * 1.5);
  }
  // 天赋加成（含子天赋拆分）
  const cb = getCharacterBonusForPet();
  var atkMult = 1 + getTalentBonus('pet_atk') + getTalentBonus('pet_atk_2') + getTalentBonus('pet_atk_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var hpMult = 1 + getTalentBonus('pet_hp') + getTalentBonus('pet_hp_2') + getTalentBonus('pet_hp_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var defMult = 1 + getTalentBonus('pet_def') + getTalentBonus('pet_def_2') + getTalentBonus('combat_ultimate');
  var spdMult = 1 + getTalentBonus('pet_speed') + getTalentBonus('combat_ultimate');
  // 宠物装备套装加成（百分比）
  var setAtkPct = 0, setHpPct = 0, setDefPct = 0, setSpdPct = 0, setIntPct = 0;
  var setAllPct = 0, setCritRate = 0, setCritDmg = 0, setDodgeRate = 0;
  var setRegenPct = 0, setMagicDmgPct = 0;
  if (peBonus && peBonus.setBonuses) {
    Object.keys(peBonus.setBonuses).forEach(function(setId) {
      var sb = peBonus.setBonuses[setId].bonus || {};
      setAtkPct += sb.atkPct || 0;
      setHpPct += sb.hpPct || 0;
      setDefPct += sb.defPct || 0;
      setSpdPct += sb.spdPct || 0;
      setIntPct += sb.intPct || 0;
      setAllPct += sb.allPct || 0;
      setCritRate += sb.critRate || 0;
      setCritDmg += sb.critDmg || 0;
      setDodgeRate += sb.dodgeRate || 0;
      setRegenPct += sb.regenPct || 0;
      setMagicDmgPct += sb.magicDmgPct || 0;
    });
  }
  // 宠物额外加成（宠物伤害/宠物防御力/宠物气血为额外百分比，全额生效）
  var petHpBonus = cb.petHp || 0;
  var petDefBonus = cb.petDef || 0;
  var petDmgBonus = cb.petDmg || 0;
  // 阵法加成（根据宠物在出战队伍中的位置）
  var formBonus = null;
  if (typeof getFormationBonusForPos === 'function' && typeof getPetFormationPos === 'function') {
    var pos = getPetFormationPos(pet.id);
    if (pos && pos !== -1) formBonus = getFormationBonusForPos(pos);
  }
  if (formBonus) {
    setAtkPct += formBonus.atkPct || 0;
    setHpPct += formBonus.hpPct || 0;
    setDefPct += formBonus.defPct || 0;
    setSpdPct += formBonus.spdPct || 0;
    setIntPct += formBonus.intPct || 0;
    setAllPct += formBonus.allPct || 0;
    setCritRate += formBonus.critRate || 0;
    setCritDmg += formBonus.critDmg || 0;
    setDodgeRate += formBonus.dodgeRate || 0;
    setRegenPct += formBonus.regenPct || 0;
    setMagicDmgPct += formBonus.magicDmgPct || 0;
  }
  // 血统加成（通用效果系统）
  var blSkill = (typeof getPetBloodlineSkill === 'function') ? getPetBloodlineSkill(pet) : null;
  var blEff = (blSkill && blSkill.effects) ? blSkill.effects : null;
  if (blEff) {
    setAtkPct += blEff.atkPct || 0;
    setHpPct += blEff.hpPct || 0;
    setDefPct += blEff.defPct || 0;
    setSpdPct += blEff.spdPct || 0;
    setIntPct += blEff.intPct || 0;
    setAllPct += blEff.allPct || 0;
    setCritRate += blEff.critRate || 0;
    setCritDmg += blEff.critDmg || 0;
    setDodgeRate += blEff.dodgeRate || 0;
    setMagicDmgPct += blEff.magicDmgPct || 0;
    // skillTrigger 由 battle.js 处理（不直接加到 stats）
  }
  var formMpPct = formBonus ? (formBonus.mpPct || 0) : 0;
  var formHitRate = formBonus ? (formBonus.hitRate || 0) : 0;
  var formDmgReduce = formBonus ? (formBonus.dmgReduce || 0) : 0;
  // 基础气血（含人物20%加成 + 天赋 + 宠物装备基础词条 + 套装百分比 + 阵法百分比）
  var finalHp = Math.round((气血 + (cb.气血 || 0) + peBaseHp) * hpMult);
  finalHp = Math.round(finalHp * (1 + petHpBonus + setHpPct + setAllPct));
  // 基础攻击力（含人物20%加成 + 天赋 + 宠物装备基础词条 + 套装百分比 + 阵法百分比）
  var finalAtk = Math.round((攻击力 + (cb.力量 || 0) * 0.5 + (cb.atk || 0) + peBaseAtk) * atkMult);
  finalAtk = Math.round(finalAtk * (1 + setAtkPct + setAllPct));
  // 基础防御力（含人物20%加成 + 天赋 + 宠物装备基础词条 + 套装百分比 + 阵法百分比）
  var finalDef = Math.round((防御力 + (cb.体质 || 0) * 0.3 + (cb.def || 0) + peBaseDef) * defMult);
  finalDef = Math.round(finalDef * (1 + petDefBonus + setDefPct + setAllPct));
  var finalSpd = Math.round((敏捷 + (cb.敏捷 || 0)) * spdMult * (1 + setSpdPct + setAllPct));
  var finalInt = Math.round((智慧 + (cb.智力 || 0) * 0.5) * atkMult * (1 + setIntPct + setAllPct));
  var finalLingli = Math.round((灵力 + (cb.智力 || 0) * 0.5) * atkMult * (1 + setIntPct + setAllPct));
  // 魔法值受阵法 mpPct 影响
  var finalMp = Math.round(魔法值 * (1 + formMpPct));
  return {
    气血: finalHp,
    魔法值: finalMp,
    攻击力: finalAtk,
    防御力: finalDef,
    灵力: finalLingli,
    速度: finalSpd,
    体质: 体质, 力量: 力量, 敏捷: 敏捷, 智慧: 智慧,
    法力: finalMp, 智力: finalInt, 力量_: 力量, 体质_: 体质,
    critRate: (cb.critRate || 0) + setCritRate,
    dodgeRate: (cb.dodgeRate || 0) + setDodgeRate,
    hitRate: (cb.hitRate || 0) + formHitRate,
    critDmg: (cb.critDmg || 0) + setCritDmg,
    skillTrigger: cb.skillTrigger || 0,
    skillDmg: cb.skillDmg || 0,
    vampPct: cb.vampPct || 0,
    dmgReduce: (cb.dmgReduce || 0) + formDmgReduce,
    regenPct: setRegenPct,
    magicDmgPct: setMagicDmgPct,
    petDmgBonus: petDmgBonus,
    equipSpecials: cb.specials || [],
    petEquipBonus: peBonus,
    formationBonus: formBonus,
  };
}

// ==================== 种族值系统 ====================
// 取代原RACE_COEFFICIENTS，每个种族4维种族值，总和5.0，保留1位小数
// 种族天赋(BLOODLINE_SKILLS)保持不变
const RACE_VALUES = {
  '史莱姆': { 力量:0.8, 体质:2.0, 敏捷:0.7, 智力:1.5 }, // 防御型
  '龙':     { 力量:1.5, 体质:1.2, 敏捷:0.8, 智力:1.5 }, // 综合战士
  '恶魔':   { 力量:1.7, 体质:1.0, 敏捷:1.0, 智力:1.3 }, // 攻击型
  '天使':   { 力量:0.8, 体质:1.0, 敏捷:1.0, 智力:2.2 }, // 法系辅助
  '哥布林': { 力量:1.0, 体质:0.8, 敏捷:2.4, 智力:0.8 }, // 敏捷型
  '精灵':   { 力量:0.7, 体质:0.8, 敏捷:1.8, 智力:1.7 }, // 敏法型
};

function getRaceValues(race) {
  return RACE_VALUES[race] || { 力量:1.25, 体质:1.25, 敏捷:1.25, 智力:1.25 };
}

// 计算技能对战力的加成倍率（反映实际战力差距）
// 同样属性的宠物，多技能/超级技能的战力应远高于少技能/普攻宠物
function getSkillPowerMultiplier(pet) {
  var skills = getAllSkills(pet);
  var mult = 1.0;

  // 主动技能贡献：根据平均伤害系数 + 技能数量
  var activeCount = 0;
  var totalDmgPct = 0;
  skills.forEach(function(s) {
    if (s.type !== 'active') return;
    activeCount++;
    if (s.dmgPct) {
      totalDmgPct += s.dmgPct;
      // 多段攻击额外加成
      if (s.hits) totalDmgPct += s.dmgPct * (s.hits - 1) * 0.6;
    } else if (s.healPct) {
      // 治疗/buff技能贡献较低
      totalDmgPct += s.healPct * 0.4;
    } else {
      // 纯buff技能
      totalDmgPct += 0.4;
    }
  });
  if (activeCount > 0) {
    var avgDmgPct = totalDmgPct / activeCount;
    // 平均伤害系数超过1.0的部分作为输出加成（×0.5 防止过度膨胀）
    mult += Math.max(0, avgDmgPct - 1.0) * 0.5;
    // 技能数量加成：多技能可触发更多，每个+3%（上限8个）
    mult += Math.min(activeCount, 8) * 0.03;
  }

  // 被动技能贡献：根据tier和效果类型加权
  var passives = getPassiveEffects(pet);
  // 攻击加成（直接提升输出）
  if (passives.atkBonus) mult += passives.atkBonus * 1.0;
  // 暴击率（暴击造成1.5倍伤害）
  if (passives.critRate) mult += passives.critRate * 0.6;
  // 暴击伤害加成
  if (passives.critDmg) mult += passives.critDmg * 0.3;
  // 技能伤害加成（直接影响主动技能输出）
  if (passives.skillDmg) mult += passives.skillDmg * 0.8;
  // 无视防御
  if (passives.ignoreDef) mult += passives.ignoreDef * 0.5;
  // 连击/追击概率（额外攻击机会）
  if (passives.doubleChance) mult += passives.doubleChance * 0.6;
  if (passives.tripleChance) mult += passives.tripleChance * 0.8;
  // 法术连发
  if (passives.skillDouble) mult += passives.skillDouble * 0.5;
  // 吸血（提升续航）
  if (passives.vampPct) mult += passives.vampPct * 0.4;
  // 先手概率
  if (passives.firstStrike) mult += passives.firstStrike * 0.2;

  // 生存型被动（贡献较低，避免坦克型战力虚高）
  if (passives.dmgReduce) mult += passives.dmgReduce * 0.2;
  if (passives.regenPct) mult += passives.regenPct * 0.3;
  if (passives.parryChance) mult += passives.parryChance * 0.2;
  if (passives.dodgeBonus) mult += passives.dodgeBonus * 0.3;
  if (passives.reflectPct) mult += passives.reflectPct * 0.2;
  if (passives.antiCrit) mult += passives.antiCrit * 0.1;

  // 异化品质额外加成（生成时已突破上限）
  if (pet.rarity === 'special') mult *= 1.2;

  return mult;
}

// ==================== 战斗力系统 ====================
// 需求8：战力计算更新 - 包含所有宠物相关属性
// 战斗力由以下部分组成：
//   1. 基础属性战力（资质+成长+等级+种族值，无任何加成；含进阶突破）
//   2. 宝石加成战力
//   3. 人物属性加成战力（cb flat属性）
//   4. 天赋倍率战力
//   5. 装备特效战力（petHp/petDef百分比加成）
//   6. 宠物装备战力（基础词条+随机词条+成长资质加成+套装百分比）
//   7. 血统战力（血统技能效果）
//   8. 阵法战力（阵法加成）
//   9. 技能加成战力
// 战力权重：气血0.3 / 攻击力3 / 防御力2 / 灵力2.5 / 速度1.5
var CP_WEIGHTS = { 气血:0.3, 攻击力:3, 防御力:2, 灵力:2.5, 速度:1.5 };

function getCombatPowerBreakdown(pet) {
  const lv = pet.level || 1;
  const growth = pet.growth || 1.0;
  const apt = pet.aptitude || { 力量资质:1500, 体质资质:1500, 敏捷资质:1500, 智力资质:1500 };
  const rv = getRaceValues(pet.race);
  var W = CP_WEIGHTS;

  // ===== 1. 基础属性（无任何加成；含进阶突破的成长/资质）=====
  const aptFactor = function(val) { return (val || 1500) / 100; };
  const lvFactor = 1 + lv * 0.05;
  var 体质 = aptFactor(apt.体质资质) * growth * lvFactor + lv * growth * rv.体质;
  var 力量 = aptFactor(apt.力量资质) * growth * lvFactor + lv * growth * rv.力量;
  var 敏捷 = aptFactor(apt.敏捷资质) * growth * lvFactor + lv * growth * rv.敏捷;
  var 智慧 = aptFactor(apt.智力资质) * growth * lvFactor + lv * growth * rv.智力;

  var 气血 = 体质 * 10 + lv * 20;
  var 攻击力 = 力量 * 2 + 敏捷 * 0.5;
  var 防御力 = 体质 * 0.6;
  var 灵力 = 智慧 * 2;
  var 速度 = 敏捷 * 1.5;
  var baseCp = 气血 * W.气血 + 攻击力 * W.攻击力 + 防御力 * W.防御力 + 灵力 * W.灵力 + 速度 * W.速度;

  // ===== 2. 宝石加成 =====
  var gemBonus = (typeof getGemStatBonus === 'function') ? getGemStatBonus() : null;
  var gemCp = 0;
  var 体质_g = 0, 力量_g = 0, 敏捷_g = 0, 智慧_g = 0, 气血_g = 0;
  if (gemBonus) {
    体质_g = gemBonus.体质 || 0;
    力量_g = gemBonus.力量 || 0;
    敏捷_g = gemBonus.敏捷 || 0;
    智慧_g = gemBonus.智慧 || 0;
    气血_g = gemBonus.气血 || 0;
    var 攻击力_g = 力量_g * 2 + 敏捷_g * 0.5;
    var 防御力_g = 体质_g * 0.6;
    var 灵力_g = 智慧_g * 2;
    var 速度_g = 敏捷_g * 1.5;
    gemCp = 气血_g * W.气血 + 攻击力_g * W.攻击力 + 防御力_g * W.防御力 + 灵力_g * W.灵力 + 速度_g * W.速度;
  }

  // ===== 3. 人物属性加成（cb flat属性）=====
  const cb = getCharacterBonusForPet();
  var charFlatHp = cb.气血 || 0;
  var charFlatAtk = (cb.力量 || 0) * 0.5 + (cb.atk || 0);
  var charFlatDef = (cb.体质 || 0) * 0.3 + (cb.def || 0);
  var charFlatInt = (cb.智力 || 0) * 0.5;
  var charFlatSpd = cb.敏捷 || 0;
  var charCp = charFlatHp * W.气血 + charFlatAtk * W.攻击力 + charFlatDef * W.防御力 + charFlatInt * W.灵力 + charFlatSpd * W.速度;

  // 各属性的「基础+宝石+人物」总值（用于计算天赋倍率加成）
  var totalHp = 气血 + 气血_g + charFlatHp;
  var totalAtk = 攻击力 + (力量_g * 2 + 敏捷_g * 0.5) + charFlatAtk;
  var totalDef = 防御力 + (体质_g * 0.6) + charFlatDef;
  var totalInt = 灵力 + (智慧_g * 2) + charFlatInt;
  var totalSpd = 速度 + (敏捷_g * 1.5) + charFlatSpd;

  // ===== 4. 天赋倍率加成（含子天赋拆分）=====
  var atkMult = 1 + getTalentBonus('pet_atk') + getTalentBonus('pet_atk_2') + getTalentBonus('pet_atk_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var hpMult = 1 + getTalentBonus('pet_hp') + getTalentBonus('pet_hp_2') + getTalentBonus('pet_hp_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var defMult = 1 + getTalentBonus('pet_def') + getTalentBonus('pet_def_2') + getTalentBonus('combat_ultimate');
  var spdMult = 1 + getTalentBonus('pet_speed') + getTalentBonus('combat_ultimate');
  var talentCp = totalHp * (hpMult - 1) * W.气血
              + totalAtk * (atkMult - 1) * W.攻击力
              + totalDef * (defMult - 1) * W.防御力
              + totalInt * (atkMult - 1) * W.灵力
              + totalSpd * (spdMult - 1) * W.速度;

  // ===== 5. 装备特效百分比加成（petHp/petDef）=====
  var petHpBonus = cb.petHp || 0;
  var petDefBonus = cb.petDef || 0;
  var hpAfterTalent = totalHp * hpMult;
  var defAfterTalent = totalDef * defMult;
  var petBonusCp = hpAfterTalent * petHpBonus * W.气血 + defAfterTalent * petDefBonus * W.防御力;

  // ===== 6. 需求8：宠物装备加成（基础词条+随机词条+成长资质+套装）=====
  var peBonus = (typeof getPetEquipBonus === 'function') ? getPetEquipBonus(pet) : null;
  var petEquipCp = 0;
  if (peBonus) {
    // 基础词条（攻击/气血/防御）
    var peBaseAtk = 0, peBaseHp = 0, peBaseDef = 0;
    if (pet.petEquipment) {
      ['attack','hp','defense'].forEach(function(slot) {
        var e = pet.petEquipment[slot];
        if (!e) return;
        if (e.slot === 'attack') peBaseAtk += e.baseValue || 0;
        if (e.slot === 'hp') peBaseHp += e.baseValue || 0;
        if (e.slot === 'defense') peBaseDef += e.baseValue || 0;
      });
    }
    // 随机词条
    var peAtk = peBaseAtk + (peBonus.statAdditions ? (peBonus.statAdditions.攻击力 || 0) : 0);
    var peHp = peBaseHp + (peBonus.statAdditions ? (peBonus.statAdditions.气血 || 0) : 0);
    var peDef = peBaseDef + (peBonus.statAdditions ? (peBonus.statAdditions.防御力 || 0) : 0);
    var peSpd = peBonus.statAdditions ? (peBonus.statAdditions.速度 || 0) : 0;
    var peInt = peBonus.statAdditions ? (peBonus.statAdditions.智力 || 0) * 2 : 0;
    // 成长/资质加成（折算为基础属性增量）
    var peGrowthAdd = peBonus.growthAddition || 0;
    var peAptAdd = peBonus.aptAdditions || {};
    var peAptFactor = function(v) { return (v || 0) / 100; };
    var peGrowthBonus = peGrowthAdd * lvFactor;
    var peAptHp = peAptFactor(peAptAdd.体质资质 || 0) * peGrowthBonus * 10;
    var peAptAtk = (peAptFactor(peAptAdd.力量资质 || 0) * 2 + peAptFactor(peAptAdd.敏捷资质 || 0) * 0.5) * peGrowthBonus;
    var peAptDef = peAptFactor(peAptAdd.体质资质 || 0) * 0.6 * peGrowthBonus;
    var peAptInt = peAptFactor(peAptAdd.智力资质 || 0) * 2 * peGrowthBonus;
    var peAptSpd = peAptFactor(peAptAdd.敏捷资质 || 0) * 1.5 * peGrowthBonus;
    // 套装百分比（基于天赋后的总值）
    var setAtkPct = 0, setHpPct = 0, setDefPct = 0, setSpdPct = 0, setIntPct = 0, setAllPct = 0;
    if (peBonus.setBonuses) {
      Object.keys(peBonus.setBonuses).forEach(function(setId) {
        var sb = peBonus.setBonuses[setId].bonus || {};
        setAtkPct += sb.atkPct || 0;
        setHpPct += sb.hpPct || 0;
        setDefPct += sb.defPct || 0;
        setSpdPct += sb.spdPct || 0;
        setIntPct += sb.intPct || 0;
        setAllPct += sb.allPct || 0;
      });
    }
    var peFlatCp = (peHp + peAptHp) * W.气血 + (peAtk + peAptAtk) * W.攻击力 + (peDef + peAptDef) * W.防御力 + (peInt + peAptInt) * W.灵力 + peSpd * W.速度 + peAptSpd * W.速度;
    var peSetCp = (totalHp * hpMult) * (setHpPct + setAllPct) * W.气血
                + (totalAtk * atkMult) * (setAtkPct + setAllPct) * W.攻击力
                + (totalDef * defMult) * (setDefPct + setAllPct) * W.防御力
                + (totalInt * atkMult) * (setIntPct + setAllPct) * W.灵力
                + (totalSpd * spdMult) * (setSpdPct + setAllPct) * W.速度;
    petEquipCp = peFlatCp + peSetCp;
  }

  // ===== 7. 需求8：血统加成 =====
  var blSkill = (typeof getPetBloodlineSkill === 'function') ? getPetBloodlineSkill(pet) : null;
  var blEff = (blSkill && blSkill.effects) ? blSkill.effects : null;
  var bloodlineCp = 0;
  if (blEff) {
    var blAtkPct = blEff.atkPct || 0;
    var blHpPct = blEff.hpPct || 0;
    var blDefPct = blEff.defPct || 0;
    var blSpdPct = blEff.spdPct || 0;
    var blIntPct = blEff.intPct || 0;
    var blAllPct = blEff.allPct || 0;
    // 进阶倍率已通过 effects 数值体现
    bloodlineCp = (totalHp * hpMult) * (blHpPct + blAllPct) * W.气血
                + (totalAtk * atkMult) * (blAtkPct + blAllPct) * W.攻击力
                + (totalDef * defMult) * (blDefPct + blAllPct) * W.防御力
                + (totalInt * atkMult) * (blIntPct + blAllPct) * W.灵力
                + (totalSpd * spdMult) * (blSpdPct + blAllPct) * W.速度;
  }

  // ===== 8. 需求8：阵法加成 =====
  var formationCp = 0;
  if (typeof getFormationBonusForPos === 'function' && typeof getPetFormationPos === 'function') {
    var pos = getPetFormationPos(pet.id);
    if (pos && pos !== -1) {
      var formBonus = getFormationBonusForPos(pos);
      if (formBonus) {
        var fAtkPct = formBonus.atkPct || 0;
        var fHpPct = formBonus.hpPct || 0;
        var fDefPct = formBonus.defPct || 0;
        var fSpdPct = formBonus.spdPct || 0;
        var fIntPct = formBonus.intPct || 0;
        var fAllPct = formBonus.allPct || 0;
        formationCp = (totalHp * hpMult) * (fHpPct + fAllPct) * W.气血
                    + (totalAtk * atkMult) * (fAtkPct + fAllPct) * W.攻击力
                    + (totalDef * defMult) * (fDefPct + fAllPct) * W.防御力
                    + (totalInt * atkMult) * (fIntPct + fAllPct) * W.灵力
                    + (totalSpd * spdMult) * (fSpdPct + fAllPct) * W.速度;
      }
    }
  }

  // 属性战力小计
  var statCp = baseCp + gemCp + charCp + talentCp + petBonusCp + petEquipCp + bloodlineCp + formationCp;

  // ===== 9. 技能加成倍率 =====
  var skillMult = getSkillPowerMultiplier(pet);
  var skillCp = statCp * (skillMult - 1);

  var total = Math.round(statCp * skillMult);

  return {
    baseCp: Math.round(baseCp),            // 1. 基础属性战力（含进阶突破）
    gemCp: Math.round(gemCp),              // 2. 宝石加成战力
    charCp: Math.round(charCp),           // 3. 人物属性加成战力
    talentCp: Math.round(talentCp),       // 4. 天赋倍率战力
    petBonusCp: Math.round(petBonusCp),   // 5. 装备特效战力（petHp/petDef）
    petEquipCp: Math.round(petEquipCp),    // 6. 宠物装备战力（基础+随机+成长+套装）
    bloodlineCp: Math.round(bloodlineCp),  // 7. 血统战力
    formationCp: Math.round(formationCp),  // 8. 阵法战力
    skillCp: Math.round(skillCp),          // 9. 技能加成战力
    statCp: Math.round(statCp),            // 属性战力小计（1-8之和）
    skillMult: skillMult,                  // 技能倍率
    total: total                           // 总战力
  };
}

function getPetCombatPower(pet) {
  return getCombatPowerBreakdown(pet).total;
}

function getAllSkills(pet) {
  return [...pet.innateSkills, ...pet.learnedSkills];
}

function getBloodlineSkill(pet) {
  // 优先使用 config.js 中的 getPetBloodlineSkill（含血统珠覆盖）
  if (typeof getPetBloodlineSkill === 'function') return getPetBloodlineSkill(pet);
  // 兼容旧逻辑
  return pet.bloodline || BLOODLINE_SKILLS.find(b => b.race === pet.race) || null;
}

function getNormalSkills(pet) {
  return getAllSkills(pet).filter(s => s.type !== 'bloodline');
}

function getMaxSkillSlots(pet) {
  // 所有宠物初始技能格满格都是6技能
  return 6;
}

function getAuraEffects(team) {
  const effects = {};
  team.forEach(pet => {
    const skills = getAllSkills(pet);
    skills.filter(s => s.type === 'aura').forEach(s => {
      if (!s.effect) return;
      Object.entries(s.effect).forEach(([k, v]) => {
        if (!effects[k] || v > effects[k]) effects[k] = v;
      });
    });
  });
  return effects;
}

function getPassiveEffects(pet) {
  const skills = getAllSkills(pet);
  const effects = {};
  skills.filter(s => s.type === 'passive' && s.effect).forEach(s => {
    Object.entries(s.effect).forEach(([k, v]) => {
      if (effects[k] === undefined || v > effects[k]) effects[k] = v;
    });
  });
  return effects;
}

// ==================== EGG SYSTEM ====================

function generateEgg(tier) {
  // 修复：tier=0(T1)时不能用 || 判断，否则会变成随机T级
  const tierIdx = (tier !== undefined && tier !== null) ? tier : randomInt(0, 4);
  // 修复：根据T级筛选对应宠物名字，确保蛋的T级和宠物实际T级一致
  var targetTier = tierIdx + 1; // tierIdx 0-4 对应 T1-T5
  // 防御性：T6不存在（getPetTier最高返回5），降级为T5
  if (targetTier > 5) targetTier = 5;
  var candidates = PET_NAMES.filter(function(name) {
    return getPetTier(name) === targetTier;
  });
  // 需求2：T3 类（mid 进阶宠）可直接孵化（无幼年体，孵化即成长体，天生较强）
  if (targetTier === 3 && typeof PET_ADVANCE_CHAINS !== 'undefined') {
    PET_ADVANCE_CHAINS.forEach(function(c) {
      if (PET_NAMES.indexOf(c.mid) < 0 && typeof getPetTier === 'function' && getPetTier(c.mid) === 3) {
        candidates.push(c.mid);
      }
    });
  }
  // 若无对应T级宠物则从全部宠物中随机选
  if (candidates.length === 0) candidates = PET_NAMES.slice();
  var chosenName = pickRandom(candidates);
  const pet = generatePetBase(chosenName);
  // 修复：异化(special)品质是 generatePetBase 中 1.5% 概率判定的稀有结果，
  // 不应被蛋 T 级限制强制降级为 mythic。仅对非异化品质应用 T 级上限。
  if (pet.rarity !== 'special') {
    const rarityIdx = Math.min(RARITIES.indexOf(pet.rarity), tierIdx + 1);
    pet.rarity = RARITIES[Math.min(rarityIdx, 5)]; // 上限 mythic，special 单独保留
  }
  return {
    id: 'egg_' + Date.now() + '_' + randomInt(1000, 9999),
    petData: pet, tier: tierIdx, appraisalLevel: 0,
    // 隐藏品质：未鉴定前不显示任何信息
    // 鉴定顺序：1=技能, 2=成长, 3=资质（价格逐个提高，资质最贵）
    revealed: { skills: false, growth: false, aptitude: false },
    // 孵化时间按T级递增：T1=30-120s, T2=×15, T3=×50, T4=×210, T5=×405
    hatchTime: randomInt(30, 120) * ([1, 15, 50, 210, 405][tierIdx] || 1), hatchProgress: 0,
    isHatching: false, hatchInterval: null,
  };
}

// 需求5：根据宠物名生成蛋（用于藏宝图按地图类型掉落宠物蛋）
// petName 必须是 PET_NAMES 中的有效名字
// 根据该宠物的T级决定孵化时间与品质上限
function generateEggFromName(petName) {
  if (!petName) petName = pickRandom(PET_NAMES);
  var tierIdx = 0;
  if (typeof getPetTier === 'function') {
    var t = getPetTier(petName);
    if (t >= 1 && t <= 5) tierIdx = t - 1;
  }
  var pet = generatePetBase(petName);
  // 按T级限制品质上限（异化special单独保留）
  if (pet.rarity !== 'special') {
    var rarityIdx = Math.min(RARITIES.indexOf(pet.rarity), tierIdx + 1);
    pet.rarity = RARITIES[Math.min(rarityIdx, 5)];
  }
  return {
    id: 'egg_' + Date.now() + '_' + randomInt(1000, 9999),
    petData: pet, tier: tierIdx, appraisalLevel: 0,
    revealed: { skills: false, growth: false, aptitude: false },
    hatchTime: randomInt(30, 120) * ([1, 15, 50, 210, 405][tierIdx] || 1),
    hatchProgress: 0,
    isHatching: false, hatchInterval: null,
  };
}

// 根据地图等级决定宠物蛋品质
// 低等级地图不会掉T5，随着等级提升高T蛋概率增加
function getEggTierByMapLevel() {
  var map = MAPS.find(function(m) { return m.id === G.player.currentMap; });
  var mapLv = map ? map.maxLv : G.player.level;
  var roll = Math.random();
  // T5(神话)概率：30级1%，60级5%，100级10%
  var t5Chance = Math.min(0.10, Math.max(0, (mapLv - 25) / 100 * 0.15));
  // T4(传说)概率：20级3%，50级10%，80级15%
  var t4Chance = Math.min(0.15, Math.max(0, (mapLv - 15) / 100 * 0.20));
  // T3(史诗)概率：10级8%，40级20%
  var t3Chance = Math.min(0.25, Math.max(0, (mapLv - 5) / 100 * 0.30));
  if (mapLv >= 25 && roll < t5Chance) return 4;
  if (mapLv >= 15 && roll < t5Chance + t4Chance) return 3;
  if (mapLv >= 5 && roll < t5Chance + t4Chance + t3Chance) return 2;
  if (roll < 0.5) return 1;
  return 0;
}

// 鉴定蛋：1=技能(1000金币) 2=成长(5000金币) 3=资质(20000金币)
function appraiseEgg(egg, level) {
  if (egg.appraisalLevel >= level) return false;
  if (!egg.revealed) egg.revealed = { skills: false, growth: false, aptitude: false };
  const cost = { 1: { gold: 1000 }, 2: { gold: 5000 }, 3: { gold: 20000 } };
  const req = cost[level];
  if (!req) return false;
  if (req.gold && G.player.gold < req.gold) return false;
  if (req.diamond && G.player.diamond < req.diamond) return false;
  if (req.gold) G.player.gold -= req.gold;
  if (req.diamond) G.player.diamond -= req.diamond;
  egg.appraisalLevel = level;
  if (level >= 1) egg.revealed.skills = true;
  if (level >= 2) egg.revealed.growth = true;
  if (level >= 3) egg.revealed.aptitude = true;
  return true;
}

// ==================== PET FUSION ====================

// 融合限定特殊宠物列表
const FUSION_ONLY_PETS = ['混元圣兽', '灭世魔神', '时空龙神'];

function fusePets(pet1, pet2) {
  // 极低概率（1.5%）出现融合限定特殊宠物
  var fusionOnlyChance = 0.015;
  if (Math.random() < fusionOnlyChance) {
    return generateFusionOnlyPet(pet1, pet2);
  }

  // 融合结果为两只宠物中的其中一个（随机选择作为基础）
  var basePet = Math.random() < 0.5 ? pet1 : pet2;
  var newPet = {
    name: basePet.name,
    race: basePet.race,
    rarity: basePet.rarity,
    growth: 0,
    aptitude: {},
    bloodline: basePet.bloodline || BLOODLINE_SKILLS.find(b => b.race === basePet.race),
    innateSkills: [],
    learnedSkills: [],
    level: 1,
    moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    id: 'pet_' + Date.now() + '_' + randomInt(1000, 9999),
  };

  // 成长融合：从两只宠物成长的较低值(下限)和较高值(上限)中随机取值
  var g1 = pet1.growth || 1.0;
  var g2 = pet2.growth || 1.0;
  var gMin = Math.min(g1, g2);
  var gMax = Math.max(g1, g2);
  newPet.growth = Math.round(randomFloat(gMin, gMax) * 100) / 100;

  // 资质融合：每项资质从两只宠物对应资质的较低值(下限)和较高值(上限)中随机取值
  APTITUDE_KEYS.forEach(function(k) {
    var v1 = (pet1.aptitude && pet1.aptitude[k]) || 1500;
    var v2 = (pet2.aptitude && pet2.aptitude[k]) || 1500;
    var lo = Math.min(v1, v2);
    var hi = Math.max(v1, v2);
    newPet.aptitude[k] = randomInt(lo, hi);
  });

  // 技能融合：收集两只宠物所有普通技能
  // 相同技能（baseId相同）有概率升级（tier+1），不同技能有概率保留
  const allSkills = [...getNormalSkills(pet1), ...getNormalSkills(pet2)];
  const skillMap = {};
  allSkills.forEach(s => {
    const baseId = getSkillBaseId(s.id);
    if (!skillMap[baseId]) skillMap[baseId] = { skill: s, count: 1, maxTier: getSkillTier(s.id) };
    else {
      skillMap[baseId].count++;
      skillMap[baseId].maxTier = Math.max(skillMap[baseId].maxTier, getSkillTier(s.id));
    }
  });

  const resultSkills = [];
  Object.values(skillMap).forEach(entry => {
    const s = entry.skill;
    // 相同技能（两只都有）：50%概率升级（tier+1），50%概率保留原技能
    if (entry.count >= 2 && entry.maxTier < 3 && Math.random() < 0.50) {
      const newTier = Math.min(entry.maxTier + 1, 3);
      const upgradedId = s.id.replace(/(_\d)?$/, newTier > 1 ? '_' + newTier : '');
      const upgraded = ALL_SKILLS.find(sk => sk.id === upgradedId);
      if (upgraded) { resultSkills.push({ ...upgraded }); return; }
    }
    // 不同技能（仅一只拥有）：60%概率保留
    if (Math.random() < 0.60) {
      resultSkills.push({ ...s });
    }
  });
  // 至少保留1个技能
  if (resultSkills.length === 0) {
    const s = pickRandom(allSkills);
    resultSkills.push({ ...s });
  }
  // 融合不限制技能数量可以超过6格
  newPet.innateSkills = resultSkills.map(s => ({ ...s, isInnate: true }));

  // 品质：根据融合后的新成长/资质重新计算（融合刷新品质）
  newPet.rarity = recalcRarity(newPet);

  // 3%概率出现异化宠物（成长/资质额外提升）
  var isSpecial = Math.random() < 0.03;
  if (isSpecial) {
    // 修复：不修改 newPet.name，避免 getPetDex/getPetTier/getPetSkillLib 查找失败。
    // 异化通过 rarity='special' 标记即可识别，展示层用 isSpecialTag 字段添加前缀。
    newPet.rarity = 'special';
    newPet.isSpecialTag = true; // 展示层可据此添加 ★前缀·异 后缀
    APTITUDE_KEYS.forEach(function(k) {
      if (newPet.aptitude[k]) newPet.aptitude[k] = Math.min(3000, Math.floor(newPet.aptitude[k] * 1.2));
    });
    newPet.growth = Math.min(newPet.growth * 1.3, 3.5);
  }
  return { result: newPet, isSpecial };
}

// 生成融合限定特殊宠物
function generateFusionOnlyPet(pet1, pet2) {
  var name = pickRandom(FUSION_ONLY_PETS);
  var dex = getPetDex(name);
  var newPet = {
    name: name,
    race: dex.race,
    rarity: 'special', // 融合限定宠物固定为异化品质
    growth: 0,
    aptitude: {},
    bloodline: BLOODLINE_SKILLS.find(b => b.race === dex.race),
    innateSkills: [],
    learnedSkills: [],
    level: 1,
    moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    id: 'pet_' + Date.now() + '_' + randomInt(1000, 9999),
  };
  // 资质：取两只宠物较高值 × 1.2，再在图鉴范围内取较高值
  APTITUDE_KEYS.forEach(function(k) {
    var v1 = (pet1.aptitude && pet1.aptitude[k]) || 1500;
    var v2 = (pet2.aptitude && pet2.aptitude[k]) || 1500;
    var higher = Math.max(v1, v2);
    var range = dex.aptRange[k] || [2000, 3000];
    // 取融合较高值×1.2 和 图鉴上限的较高者
    newPet.aptitude[k] = Math.min(3000, Math.floor(Math.max(higher * 1.2, range[1])));
  });
  // 成长：取两只宠物较高值 × 1.15，再在图鉴范围内取较高值
  var higherGrowth = Math.max(pet1.growth, pet2.growth);
  var gMax = dex.growthRange[1];
  newPet.growth = Math.min(3.5, Math.round(Math.max(higherGrowth * 1.15, gMax) * 100) / 100);
  // 天生技能：图鉴定义的独有技能（全部必带）
  var usedBaseIds = new Set();
  if (dex.innateSkills && dex.innateSkills.length > 0) {
    dex.innateSkills.forEach(function(sid) {
      var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
      if (sk && !usedBaseIds.has(getSkillBaseId(sid))) {
        newPet.innateSkills.push({ ...sk, isInnate: true });
        usedBaseIds.add(getSkillBaseId(sid));
      }
    });
  }
  return { result: newPet, isSpecial: true, isFusionOnly: true };
}

// ==================== 宠物重置（归元丹/归虚丹） ====================
// 重置宠物的成长、资质、技能，保留名字/种族/血统/等级
// T1-T3 使用归元丹，T4-T5 使用归虚丹
function resetPet(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return { ok: false, msg: '宠物不存在' };
  var tier = getPetTier(pet.name);
  var needItem = tier >= 4 ? 'guixu_pill' : 'guiyuan_pill';
  var inv = G.inventory.find(function(i) { return i.id === needItem; });
  if (!inv || inv.count <= 0) {
    return { ok: false, msg: '需要' + (tier >= 4 ? '归虚丹' : '归元丹') + '才能重置T' + (tier+1) + '宠物' };
  }
  // 消耗道具
  inv.count--;
  if (inv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== needItem; });
  // 重新生成成长、资质、技能
  var dex = getPetDex(pet.name);
  // 成长重置
  var gMin = dex.growthRange[0], gMax = dex.growthRange[1];
  pet.growth = Math.round(randomFloat(gMin, gMax) * 100) / 100;
  // 资质重置
  pet.aptitude = pet.aptitude || {};
  APTITUDE_KEYS.forEach(function(k) {
    var range = dex.aptRange[k] || [1200, 1800];
    pet.aptitude[k] = randomInt(range[0], range[1]);
  });
  // 技能重置：天生技能必带 + 从技能库随机获得
  var maxSkills = getPetMaxSkills(pet.name);
  var skillLibIds = getPetSkillLib(pet.name);
  var innateSkills = [];
  var usedBaseIds = new Set();
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
  var minTotal = Math.max(1, innateSkills.length);
  var totalSkills = randomInt(minTotal, maxSkills);
  var extraCount = totalSkills - innateSkills.length;
  for (var i = 0; i < extraCount && availableLib.length > 0; i++) {
    var idx = randomInt(0, availableLib.length - 1);
    var sk = availableLib.splice(idx, 1)[0];
    innateSkills.push({ ...sk, isInnate: true });
    usedBaseIds.add(getSkillBaseId(sk.id));
  }
  pet.innateSkills = innateSkills;
  pet.learnedSkills = [];
  pet.moonDewUsed = 0;
  // 重生刷新品质：根据新的成长/资质重新计算
  pet.rarity = recalcRarity(pet);
  return { ok: true, pet: pet };
}

