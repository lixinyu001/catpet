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

// ==================== 公共技能生成函数 ====================
// 消除重复代码：原 generatePetBase/createStarterPet/resetPet/generateDivineBeast/generateFusionOnlyPet
// 中各有一份近乎相同的技能生成逻辑，统一提取为此函数
/**
 * 为宠物生成天生技能列表
 * @param {string} petName - 宠物名称（用于查找图鉴）
 * @param {number} maxSkills - 最大技能数上限
 * @param {Object} [overrideDex] - 可选的图鉴覆盖（融合限定宠物等）
 * @returns {Array} 天生技能数组
 */
function generateInnateSkills(petName, maxSkills, overrideDex) {
  var dex = overrideDex || (typeof getPetDex === 'function' ? getPetDex(petName) : null);
  if (!dex) return [];
  var skillLibIds = (typeof getPetSkillLib === 'function') ? getPetSkillLib(petName) : [];
  var innateSkills = [];
  var usedBaseIds = new Set();
  // 需求：主动技能数量上限为3个
  var MAX_ACTIVE_SKILLS = 3;
  var activeSkillCount = 0;
  // 天生技能必带
  if (dex.innateSkills && dex.innateSkills.length > 0) {
    dex.innateSkills.forEach(function(sid) {
      var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
      if (sk && !usedBaseIds.has(getSkillBaseId(sid))) {
        innateSkills.push(Object.assign({}, sk, { isInnate: true }));
        usedBaseIds.add(getSkillBaseId(sid));
        if (sk.type === 'active') activeSkillCount++;
      }
    });
  }
  // 从技能库随机获得额外技能
  var availableLib = skillLibIds.map(function(id) {
    return ALL_SKILLS.find(function(s) { return s.id === id; });
  }).filter(function(s) {
    return s && !usedBaseIds.has(getSkillBaseId(s.id));
  });
  var minTotal = Math.max(1, innateSkills.length);
  var totalSkills = randomInt(minTotal, maxSkills);
  var extraCount = totalSkills - innateSkills.length;
  // 需求：降低高级技能出现频率，超级技能设置为稀有产出
  // 概率权重：普通(tier1/无tier) 85%，高级(tier2) 10%，超级(tier3) 5%
  for (var i = 0; i < extraCount && availableLib.length > 0; i++) {
    // 按tier分组可用技能
    var tier1Pool = availableLib.filter(function(s) { return !s.tier || s.tier === 1; });
    var tier2Pool = availableLib.filter(function(s) { return s.tier === 2; });
    var tier3Pool = availableLib.filter(function(s) { return s.tier === 3; });
    // 过滤掉已满上限的主动技能
    var filterActive = function(arr) {
      if (activeSkillCount >= MAX_ACTIVE_SKILLS) return arr.filter(function(s) { return s.type !== 'active'; });
      return arr;
    };
    tier1Pool = filterActive(tier1Pool);
    tier2Pool = filterActive(tier2Pool);
    tier3Pool = filterActive(tier3Pool);
    // 按概率选择tier
    var roll = Math.random();
    var selectedPool = null;
    if (roll < 0.85 && tier1Pool.length > 0) {
      selectedPool = tier1Pool;
    } else if (roll < 0.95 && tier2Pool.length > 0) {
      selectedPool = tier2Pool;
    } else if (tier3Pool.length > 0) {
      selectedPool = tier3Pool;
    } else {
      // 回退：按优先级选择非空池
      if (tier1Pool.length > 0) selectedPool = tier1Pool;
      else if (tier2Pool.length > 0) selectedPool = tier2Pool;
      else if (tier3Pool.length > 0) selectedPool = tier3Pool;
    }
    if (!selectedPool || selectedPool.length === 0) break;
    var idx = randomInt(0, selectedPool.length - 1);
    var sk = selectedPool[idx];
    // 从availableLib中移除
    var libIdx = availableLib.indexOf(sk);
    if (libIdx >= 0) availableLib.splice(libIdx, 1);
    innateSkills.push(Object.assign({}, sk, { isInnate: true }));
    usedBaseIds.add(getSkillBaseId(sk.id));
    if (sk.type === 'active') activeSkillCount++;
  }
  return innateSkills;
}

function generatePetBase(forcedName, qualityBoost, excludeCommon) {
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

    // v2.9.0 需求2.1：还原完整6档品质体系 —— 普通/优秀/稀有/史诗/传说/神话
    // 主线/转盘/藏宝图/副本：可产出全部6档；抽蛋池(excludeCommon=true)：不产出普通
    if (excludeCommon) {
      // 抽蛋池：仅优秀及以上5档
      if (qualityScore < 0.35) rarity = 'uncommon';
      else if (qualityScore < 0.55) rarity = 'rare';
      else if (qualityScore < 0.72) rarity = 'epic';
      else if (qualityScore < 0.86) rarity = 'legendary';
      else rarity = 'mythic';
    } else {
      // 全渠道：6档品质
      if (qualityScore < 0.20) rarity = 'common';
      else if (qualityScore < 0.40) rarity = 'uncommon';
      else if (qualityScore < 0.60) rarity = 'rare';
      else if (qualityScore < 0.78) rarity = 'epic';
      else if (qualityScore < 0.90) rarity = 'legendary';
      else rarity = 'mythic';
    }
  }

  // 血统重构：pet.bloodline 不再在创建时设置，运行时通过 getPetBloodlineSkill(pet) 从 PET_BLOOD_ALL 动态查询
  const bloodline = null;

  // 技能生成——使用公共函数 generateInnateSkills（消除重复代码）
  var maxSkills = getPetMaxSkills(name);
  var innateSkills = generateInnateSkills(name, maxSkills);

  // 新进阶系统：根据图鉴 evolvable 标志设置 advanceable
  // v2.8.0 需求1.1：宠物获取时初始等级同步为玩家当前等级，属性按对应等级完整计算
  var initLevel = (typeof G !== 'undefined' && G.player && G.player.level) ? G.player.level : 1;
  var attrPoints = { 力量: 0, 敏捷: 0, 体质: 0, 耐力: 0, 魔力: 0 };
  // 按等级完整累加固定属性点（每级各维+1）
  ATTRIBUTES.forEach(function(attr) {
    attrPoints[attr] = initLevel; // 每级固定+1
  });
  // 自由属性点保留为未分配（玩家可自行分配）
  // v2.8.0 评审修复：移除冗余的 initLevel===1 特殊处理，公式简化为 initLevel * 每级自由点数
  var freeAttrPoints = initLevel * getPetFreeAttrPointsPerLevel();
  return {
    name: name,
    race, rarity, growth, aptitude, bloodline,
    innateSkills, learnedSkills: [], level: initLevel, moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    advanceStage: 0, advanceable: !!(dex.evolvable), advanceValue: 0, // 新进阶系统
    lifespan: randomInt(10000, 15000), // 初始寿命：10000~15000
    attrPoints: attrPoints,    // 需求16：五维属性点（按等级完整计算）
    freeAttrPoints: freeAttrPoints, // 需求16：可自由分配的属性点
    id: 'pet_' + Date.now() + '_' + randomInt(1000, 9999),
  };
}

// 根据宠物当前的成长和资质重新计算品质（重生/融合/月华露等刷新品质）
// qualityBoost 可选：抽蛋池品质加成
// 注意：异化(special)仅在生成时1.5%概率判定，recalcRarity不自动判定异化
// 成长/资质超过图鉴上限时按满分1.0计算（月华露培养的宠物可达到更高品质）
// v2.9.0 需求2.1：还原完整6档品质体系，recalcRarity 使用全6档阈值
function recalcRarity(pet, qualityBoost) {
  if (!pet || !pet.name) return pet ? pet.rarity : 'common';
  // 异化品质保持不变（生成时已固定）
  if (pet.rarity === 'special') return 'special';
  // 神兽品质固定为神话，不参与重算（修复品质衰减BUG）
  if (pet.isDivineBeast) return 'mythic';
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
  // v2.9.0 需求2.1：完整6档品质判断
  if (qualityScore < 0.20) return 'common';
  if (qualityScore < 0.40) return 'uncommon';
  if (qualityScore < 0.60) return 'rare';
  if (qualityScore < 0.78) return 'epic';
  if (qualityScore < 0.90) return 'legendary';
  return 'mythic';
}

function getPetStats(pet) {
  const lv = pet.level;
  const growth = pet.growth || 1.0;
  // 需求16：五维资质系统（兼容旧存档：智力资质→魔力资质，新增耐力资质）
  const apt = pet.aptitude || { 力量资质:1500, 敏捷资质:1500, 体质资质:1500, 耐力资质:1500, 魔力资质:1500 };
  // 旧存档兼容：智力资质→魔力资质
  var apt力量 = apt.力量资质 || 1500;
  var apt敏捷 = apt.敏捷资质 || 1500;
  var apt体质 = apt.体质资质 || 1500;
  var apt耐力 = apt.耐力资质 || apt.智力资质 || 1500; // 旧存档无耐力资质时 fallback
  var apt魔力 = apt.魔力资质 || apt.智力资质 || 1500; // 旧存档智力资质→魔力资质
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
  var eApt力量 = apt力量, eApt敏捷 = apt敏捷, eApt体质 = apt体质, eApt耐力 = apt耐力, eApt魔力 = apt魔力;
  if (peAptAdd) {
    eApt力量 += peAptAdd.力量资质 || 0;
    eApt体质 += peAptAdd.体质资质 || 0;
    eApt敏捷 += peAptAdd.敏捷资质 || 0;
    eApt耐力 += peAptAdd.耐力资质 || 0;
    eApt魔力 += peAptAdd.魔力资质 || peAptAdd.智力资质 || 0;
  }
  // 需求16：五维属性点转化公式
  // 单属性点对应战斗值 = 1 + (资质/10000) × (1 + (成长+种族值)/10)
  // 总属性 = 属性点数 × 单属性点对应战斗值
  var attrPts = getPetAttrPoints(pet);
  var ptVal力量 = getAttrPointValue(eApt力量, effectiveGrowth, rv.力量);
  var ptVal敏捷 = getAttrPointValue(eApt敏捷, effectiveGrowth, rv.敏捷);
  var ptVal体质 = getAttrPointValue(eApt体质, effectiveGrowth, rv.体质);
  var ptVal耐力 = getAttrPointValue(eApt耐力, effectiveGrowth, rv.耐力);
  var ptVal魔力 = getAttrPointValue(eApt魔力, effectiveGrowth, rv.魔力);
  var 力量 = Math.round((attrPts.力量 || 0) * ptVal力量);
  var 敏捷 = Math.round((attrPts.敏捷 || 0) * ptVal敏捷);
  var 体质 = Math.round((attrPts.体质 || 0) * ptVal体质);
  var 耐力 = Math.round((attrPts.耐力 || 0) * ptVal耐力);
  var 魔力 = Math.round((attrPts.魔力 || 0) * ptVal魔力);
  // 需求16：五维→战斗属性收益规则
  // 力量: 大幅物理攻击力, 少量灵力/命中
  // 敏捷: 大幅速度, 闪避率
  // 体质: 大幅生命值, 少量灵力
  // 耐力: 大幅物理防御力, 少量灵力
  // 魔力: 大幅法术攻击力/法术防御力, 法力值上限
  var 气血 = Math.round(体质 * 10 + lv * 20);
  var 魔法值 = Math.round(魔力 * 3 + 力量 * 0.5 + lv * 5);
  var 攻击力 = Math.round(力量 * 2 + 敏捷 * 0.5);
  var 防御力 = Math.round(耐力 * 1.5 + 体质 * 0.3); // 耐力大幅提升防御
  var 灵力 = Math.round(魔力 * 1.5 + 体质 * 0.3 + 耐力 * 0.3 + 力量 * 0.2); // 魔力大幅，其余少量
  var 速度 = Math.round(敏捷 * 1.5);
  // 宠物装备随机词条（属性加成）
  if (peBonus && peBonus.statAdditions) {
    体质 += peBonus.statAdditions.体质 || 0;
    力量 += peBonus.statAdditions.力量 || 0;
    敏捷 += peBonus.statAdditions.敏捷 || 0;
    耐力 += peBonus.statAdditions.耐力 || 0;
    魔力 += peBonus.statAdditions.魔力 || peBonus.statAdditions.智力 || 0;
    气血 += peBonus.statAdditions.气血 || 0;
    攻击力 += peBonus.statAdditions.攻击力 || 0;
    防御力 += peBonus.statAdditions.防御力 || 0;
    速度 += peBonus.statAdditions.速度 || 0;
  }
  // 符文系统加成：固定值属性（主属性+副属性）
  // v2.8.0 需求6.1：新增五维/魔法值加成
  var runeBonus = (typeof getRuneBonus === 'function') ? getRuneBonus(pet) : null;
  if (runeBonus && runeBonus.statAdditions) {
    攻击力 += runeBonus.statAdditions.攻击力 || 0;
    防御力 += runeBonus.statAdditions.防御力 || 0;
    气血 += runeBonus.statAdditions.气血 || 0;
    灵力 += runeBonus.statAdditions.灵力 || 0;
    速度 += runeBonus.spdFlat || 0;
    // v2.8.0 需求6.1：五维主属性 + 魔法值
    力量 += runeBonus.statAdditions.力量 || 0;
    敏捷 += runeBonus.statAdditions.敏捷 || 0;
    体质 += runeBonus.statAdditions.体质 || 0;
    耐力 += runeBonus.statAdditions.耐力 || 0;
    魔力 += runeBonus.statAdditions.魔力 || 0;
    魔法值 += runeBonus.statAdditions.魔法值 || 0;
  }
  // v2.9.0 需求1.1：宝石改为百分比加成，作用于人物基础五维（在 getCharacterBonusForPet 内应用）
  // 宠物通过人物20%属性附加间接获得宝石收益，此处不再直接叠加宝石 flat 值
  // 人物属性20%真实附加到宠物五维基础属性（需求16：四维→五维）
  const cb = getCharacterBonusForPet();
  var charBonusDetail = {
    力量: cb.力量 || 0, 体质: cb.体质 || 0, 敏捷: cb.敏捷 || 0,
    耐力: cb.耐力 || 0, 魔力: cb.魔力 || cb.智力 || 0, // 兼容旧人物数据
    气血: cb.气血 || 0, atk: cb.atk || 0, def: cb.def || 0,
  };
  // 将人物20%属性直接附加到宠物五维
  力量 += charBonusDetail.力量;
  体质 += charBonusDetail.体质;
  敏捷 += charBonusDetail.敏捷;
  耐力 += charBonusDetail.耐力;
  魔力 += charBonusDetail.魔力;
  // 重新计算衍生属性（五维已含人物20%加成，cb.气血/cb.atk/cb.def为额外flat加成）
  气血 = Math.round(体质 * 10 + lv * 20) + charBonusDetail.气血;
  魔法值 = Math.round(魔力 * 3 + 力量 * 0.5 + lv * 5);
  攻击力 = Math.round(力量 * 2 + 敏捷 * 0.5) + charBonusDetail.atk;
  防御力 = Math.round(耐力 * 1.5 + 体质 * 0.3) + charBonusDetail.def;
  灵力 = Math.round(魔力 * 1.5 + 体质 * 0.3 + 耐力 * 0.3 + 力量 * 0.2);
  速度 = Math.round(敏捷 * 1.5);
  // v2.8.0 评审修复（严重问题2）：补回 peBonus/runeBonus 的 flat 衍生属性加成
  // 上述 recalculation 使用 = 覆盖了 L327-330（peBonus）和 L336-340（runeBonus）的 flat 加成
  // 五维加成已通过 recalculation 保留，但 flat 攻击力/防御力/气血/灵力/速度 加成被覆盖丢失
  if (peBonus && peBonus.statAdditions) {
    攻击力 += peBonus.statAdditions.攻击力 || 0;
    防御力 += peBonus.statAdditions.防御力 || 0;
    气血 += peBonus.statAdditions.气血 || 0;
    灵力 += peBonus.statAdditions.灵力 || 0;
    速度 += peBonus.statAdditions.速度 || 0;
  }
  if (runeBonus && runeBonus.statAdditions) {
    攻击力 += runeBonus.statAdditions.攻击力 || 0;
    防御力 += runeBonus.statAdditions.防御力 || 0;
    气血 += runeBonus.statAdditions.气血 || 0;
    灵力 += runeBonus.statAdditions.灵力 || 0;
    速度 += runeBonus.spdFlat || 0;
  }
  // 天赋加成（含子天赋拆分）
  var atkMult = 1 + getTalentBonus('pet_atk') + getTalentBonus('pet_atk_2') + getTalentBonus('pet_atk_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var hpMult = 1 + getTalentBonus('pet_hp') + getTalentBonus('pet_hp_2') + getTalentBonus('pet_hp_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var defMult = 1 + getTalentBonus('pet_def') + getTalentBonus('pet_def_2') + getTalentBonus('combat_ultimate');
  var spdMult = 1 + getTalentBonus('pet_speed') + getTalentBonus('combat_ultimate');
  // v2.11.0 需求8.2：修复灵力天赋倍率——灵力/魔力仅受全属性天赋(combat_ultimate)影响
  var intMult = 1 + getTalentBonus('combat_ultimate');
  // 宠物装备套装加成（百分比）
  var setAtkPct = 0, setHpPct = 0, setDefPct = 0, setSpdPct = 0, setIntPct = 0;
  var setAllPct = 0, setCritRate = 0, setCritDmg = 0, setDodgeRate = 0;
  var setRegenPct = 0, setMagicDmgPct = 0;
  // v2.11.0 需求4.3：套装特殊效果变量（endRegen=回合回血百分比, extraAttack=追加普攻概率,
  // extraTarget=普攻额外目标数, magicExtraTarget=法术额外目标数, deathImmune=免死标记）
  var _setEndRegen = 0, _setExtraAttack = 0, _setExtraTarget = 0, _setMagicExtraTarget = 0;
  var _setDeathImmune = false;
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
      // v2.11.0 需求4.3：提取套装特殊效果
      _setEndRegen += sb.endRegen || 0;
      _setExtraAttack += sb.extraAttack || 0;
      _setExtraTarget += sb.extraTarget || 0;
      _setMagicExtraTarget += sb.magicExtraTarget || 0;
      if (sb.deathImmune) _setDeathImmune = true;
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
  // 符文系统加成：百分比属性（套装2件/4件效果）
  if (runeBonus && runeBonus.pctAdditions) {
    setAtkPct += runeBonus.pctAdditions.atkPct || 0;
    setHpPct += runeBonus.pctAdditions.hpPct || 0;
    setDefPct += runeBonus.pctAdditions.defPct || 0;
    setIntPct += runeBonus.pctAdditions.intPct || 0;
    setAllPct += runeBonus.pctAdditions.allPct || 0;
    setCritRate += runeBonus.pctAdditions.critRate || 0;
    setCritDmg += runeBonus.pctAdditions.critDmg || 0;
    setDodgeRate += runeBonus.pctAdditions.dodgeRate || 0; // v2.8.0 需求6.1：闪避率
    setRegenPct += runeBonus.pctAdditions.regenPct || 0;
  }
  var formMpPct = formBonus ? (formBonus.mpPct || 0) : 0;
  var formHitRate = formBonus ? (formBonus.hitRate || 0) : 0;
  var formDmgReduce = formBonus ? (formBonus.dmgReduce || 0) : 0;
  // 符文套装减伤加成
  if (runeBonus && runeBonus.pctAdditions) {
    formDmgReduce += runeBonus.pctAdditions.dmgReduce || 0;
  }
  // 基础气血（五维已含人物20%加成 + 天赋 + 宠物装备基础词条 + 套装百分比 + 阵法百分比）
  var finalHp = Math.round((气血 + peBaseHp) * hpMult);
  finalHp = Math.round(finalHp * (1 + petHpBonus + setHpPct + setAllPct));
  // 基础攻击力（五维已含人物20%加成 + 天赋 + 宠物装备基础词条 + 套装百分比 + 阵法百分比）
  var finalAtk = Math.round((攻击力 + peBaseAtk) * atkMult);
  finalAtk = Math.round(finalAtk * (1 + setAtkPct + setAllPct));
  // 基础防御力（五维已含人物20%加成 + 天赋 + 宠物装备基础词条 + 套装百分比 + 阵法百分比）
  var finalDef = Math.round((防御力 + peBaseDef) * defMult);
  finalDef = Math.round(finalDef * (1 + petDefBonus + setDefPct + setAllPct));
  var finalSpd = Math.round(敏捷 * spdMult * (1 + setSpdPct + setAllPct));
  var finalMag = Math.round(魔力 * intMult * (1 + setIntPct + setAllPct));
  var finalEnd = Math.round(耐力 * defMult * (1 + setDefPct + setAllPct));
  var finalLingli = Math.round(灵力 * intMult * (1 + setIntPct + setAllPct));
  // 魔法值受阵法 mpPct 影响
  var finalMp = Math.round(魔法值 * (1 + formMpPct));
  // v2.8.0 需求1.3：二级属性基础衍生值（从五维属性衍生，确保不显示0）
  // 基础暴击率：力量和敏捷提供基础暴击（每点力量+0.02%，每点敏捷+0.01%）
  var baseCritRate = (力量 * 0.0002 + 敏捷 * 0.0001);
  // 基础暴击伤害：力量提供基础暴伤（每点力量+0.1%），基础暴伤150%
  var baseCritDmg = 0.5 + 力量 * 0.001;
  // 基础闪避率：敏捷提供基础闪避（每点敏捷+0.02%）
  var baseDodgeRate = 敏捷 * 0.0002;
  // 基础命中率：基础90% + 力量提供命中（每点力量+0.01%）
  var baseHitRate = 0.9 + 力量 * 0.0001;
  // 基础减伤：耐力提供基础减伤（每点耐力+0.01%）
  var baseDmgReduce = 耐力 * 0.0001;
  // NaN/Infinity 安全检查：确保所有返回值为有效整数
  // 修复：如果任何中间计算产生 NaN/Infinity，战斗系统会完全崩溃
  function safeNum(v) { return (typeof v === 'number' && isFinite(v) && !isNaN(v)) ? Math.floor(v) : 0; }
  function safePct(v) { return (typeof v === 'number' && isFinite(v) && !isNaN(v)) ? v : 0; }
  return {
    气血: safeNum(finalHp),
    魔法值: safeNum(finalMp),
    攻击力: safeNum(finalAtk),
    防御力: safeNum(finalDef),
    灵力: safeNum(finalLingli),
    速度: safeNum(finalSpd),
    // 需求16：五维属性（智慧/智力保留为旧字段别名，兼容战斗系统）
    体质: safeNum(体质), 力量: safeNum(力量), 敏捷: safeNum(敏捷),
    耐力: safeNum(耐力), 魔力: safeNum(魔力),
    智慧: safeNum(魔力), 智力: safeNum(finalMag), // 旧字段兼容
    法力: safeNum(finalMp), 力量_: safeNum(力量), 体质_: safeNum(体质),
    // v2.8.0 需求1.3：二级属性 = 基础衍生值 + 外部加成值
    critRate: safePct(baseCritRate + (cb.critRate || 0) + setCritRate),
    dodgeRate: safePct(baseDodgeRate + (cb.dodgeRate || 0) + setDodgeRate),
    hitRate: safePct(baseHitRate + (cb.hitRate || 0) + formHitRate),
    critDmg: safePct(baseCritDmg + (cb.critDmg || 0) + setCritDmg),
    skillTrigger: safePct(cb.skillTrigger || 0),
    skillDmg: safePct(cb.skillDmg || 0),
    vampPct: safePct((cb.vampPct || 0) + (runeBonus ? (runeBonus.pctAdditions.vampPct || 0) : 0)),
    dmgReduce: safePct(baseDmgReduce + (cb.dmgReduce || 0) + formDmgReduce),
    regenPct: safePct(setRegenPct),
    magicDmgPct: safePct(setMagicDmgPct + (runeBonus ? (runeBonus.pctAdditions.skillDmg || 0) : 0)),
    petDmgBonus: safeNum(petDmgBonus),
    equipSpecials: cb.specials || [],
    petEquipBonus: peBonus,
    runeBonus: runeBonus,
    formationBonus: formBonus,
    charBonus: charBonusDetail,
    // v2.11.0 需求4.3：宠物装备套装特殊效果（战斗内生效）
    setEndRegen: safePct(_setEndRegen),
    setExtraAttack: safePct(_setExtraAttack),
    setExtraTarget: _setExtraTarget,
    setMagicExtraTarget: _setMagicExtraTarget,
    setDeathImmune: _setDeathImmune,
  };
}

// ==================== 种族值系统 ====================
// 需求16：五维种族值，每个种族5维种族值，总和6.0，保留1位小数
// 种族天赋(BLOODLINE_SKILLS)保持不变
const RACE_VALUES = {
  '史莱姆': { 力量:0.8, 敏捷:0.7, 体质:2.0, 耐力:1.5, 魔力:1.0 }, // 防御型
  '龙':     { 力量:1.5, 敏捷:0.8, 体质:1.2, 耐力:1.0, 魔力:1.5 }, // 综合战士
  '恶魔':   { 力量:1.7, 敏捷:1.0, 体质:1.0, 耐力:0.8, 魔力:1.5 }, // 攻击型
  '天使':   { 力量:0.8, 敏捷:1.0, 体质:1.0, 耐力:0.8, 魔力:2.4 }, // 法系辅助
  '哥布林': { 力量:1.0, 敏捷:2.4, 体质:0.8, 耐力:0.8, 魔力:1.0 }, // 敏捷型
  '精灵':   { 力量:0.7, 敏捷:1.8, 体质:0.8, 耐力:0.7, 魔力:2.0 }, // 敏法型
};

function getRaceValues(race) {
  return RACE_VALUES[race] || { 力量:1.2, 敏捷:1.2, 体质:1.2, 耐力:1.2, 魔力:1.2 };
}

// ==================== 需求16：五维属性点转化公式 ====================
// 每1点五维属性点转化为对应战斗属性值的公式：
// 单属性点对应战斗值 = 1 + (对应单项资质 / 10000) × (1 + (成长值 + 种族值) / 10)
// 资质、成长、种族值越高，单属性点转化出的战斗属性值越高
function getAttrPointValue(aptitudeVal, growth, raceVal) {
  return 1 + (aptitudeVal / 10000) * (1 + (growth + raceVal) / 10);
}

// 需求16：宠物每升1级获得10点属性点（5固定+5自由）
// 固定属性点：力量、敏捷、体质、耐力、魔力各+1
// 自由属性点：5点（玩家可自由分配，存储在 pet.freeAttrPoints）
function getPetAttrPointsPerLevel() { return 10; }
function getPetFixedAttrPointsPerLevel() { return 5; }
function getPetFreeAttrPointsPerLevel() { return 5; }

// 需求16：获取宠物当前五维属性点（含固定+自由分配）
// 旧存档宠物无 attrPoints 字段时，按等级自动补算
// v2.7.0 需求1.2：修复未出战宠物属性点计算异常——统一出战/未出战状态下的计算逻辑
function getPetAttrPoints(pet) {
  if (!pet) return { 力量:0, 敏捷:0, 体质:0, 耐力:0, 魔力:0 };
  // 旧存档迁移：无 attrPoints 时按等级自动生成（每级10点，固定5点平均分配）
  if (!pet.attrPoints) {
    var lv = pet.level || 1;
    // 固定点每级各维+1
    var fixed = { 力量: lv, 敏捷: lv, 体质: lv, 耐力: lv, 魔力: lv };
    // 自由点默认平均分配到各维（旧存档无分配记录）
    var freeTotal = lv * getPetFreeAttrPointsPerLevel();
    var perAttr = Math.floor(freeTotal / 5);
    var remainder = freeTotal - perAttr * 5;
    pet.attrPoints = {
      力量: fixed.力量 + perAttr + (remainder > 0 ? 1 : 0),
      敏捷: fixed.敏捷 + perAttr + (remainder > 1 ? 1 : 0),
      体质: fixed.体质 + perAttr + (remainder > 2 ? 1 : 0),
      耐力: fixed.耐力 + perAttr + (remainder > 3 ? 1 : 0),
      魔力: fixed.魔力 + perAttr,
    };
    pet.freeAttrPoints = 0; // 旧存档无剩余自由点
  }
  // v2.7.0 需求1.2：同步 freeAttrPoints —— 确保无论是否出战，属性点数值一致
  // 总属性点 = 等级 × 10（5固定 + 5自由）
  // 已分配 = sum(attrPoints)
  // 剩余自由点 = 总属性点 - 已分配
  syncPetAttrPoints(pet);
  return pet.attrPoints;
}

// v2.7.0 需求1.2：同步宠物自由属性点（统一出战/未出战计算逻辑）
// 完整核算：总属性点（基础点 + 等级成长点 + 额外加成点）、已分配属性点、剩余自由属性点
function syncPetAttrPoints(pet) {
  if (!pet || !pet.attrPoints) return;
  var lv = pet.level || 1;
  var totalExpected = lv * getPetAttrPointsPerLevel(); // 每级10点
  var allocated = 0;
  ATTRIBUTES.forEach(function(attr) {
    allocated += (pet.attrPoints[attr] || 0);
  });
  var expectedFree = totalExpected - allocated;
  if (expectedFree < 0) {
    // 已分配超出总额（可能因进阶/融合等操作），不修正但确保不为负
    expectedFree = 0;
  }
  pet.freeAttrPoints = expectedFree;
}

// 需求16：分配自由属性点到指定五维
function allocateAttrPoint(pet, attrName) {
  if (!pet || !ATTRIBUTES.includes(attrName)) return false;
  if (!pet.attrPoints) getPetAttrPoints(pet); // 触发迁移
  syncPetAttrPoints(pet); // v2.7.0：确保 freeAttrPoints 准确
  if ((pet.freeAttrPoints || 0) <= 0) return false;
  pet.attrPoints[attrName] = (pet.attrPoints[attrName] || 0) + 1;
  pet.freeAttrPoints--;
  saveGame();
  return true;
}

// v2.7.0 需求1.1：批量手动加点 —— 玩家一次性输入各属性加点数值
// allocations = { 力量: 5, 敏捷: 3, 体质: 2, 耐力: 0, 魔力: 0 }
function batchAllocateAttrPoints(pet, allocations) {
  if (!pet || !allocations) return { ok: false, msg: '参数错误' };
  if (!pet.attrPoints) getPetAttrPoints(pet);
  syncPetAttrPoints(pet);
  var totalRequest = 0;
  ATTRIBUTES.forEach(function(attr) {
    totalRequest += Math.max(0, parseInt(allocations[attr]) || 0);
  });
  if (totalRequest === 0) return { ok: false, msg: '请输入加点数值' };
  if (totalRequest > (pet.freeAttrPoints || 0)) {
    return { ok: false, msg: '剩余自由属性点不足（剩余 ' + (pet.freeAttrPoints || 0) + ' 点）' };
  }
  ATTRIBUTES.forEach(function(attr) {
    var n = Math.max(0, parseInt(allocations[attr]) || 0);
    if (n > 0) {
      pet.attrPoints[attr] = (pet.attrPoints[attr] || 0) + n;
      pet.freeAttrPoints -= n;
    }
  });
  saveGame();
  return { ok: true, allocated: totalRequest };
}

// v2.7.0 需求1.1：自动比例加点 —— 按设定比例分配剩余自由属性点
// ratios = { 力量: 20, 敏捷: 20, 体质: 20, 耐力: 20, 魔力: 20 }（总和需=100）
function autoAllocateAttrPoints(pet, ratios) {
  if (!pet || !ratios) return { ok: false, msg: '参数错误' };
  if (!pet.attrPoints) getPetAttrPoints(pet);
  syncPetAttrPoints(pet);
  var free = pet.freeAttrPoints || 0;
  if (free <= 0) return { ok: false, msg: '无自由属性点可分配' };
  var totalRatio = 0;
  ATTRIBUTES.forEach(function(attr) {
    totalRatio += Math.max(0, parseInt(ratios[attr]) || 0);
  });
  if (totalRatio !== 100) return { ok: false, msg: '比例总和需等于100%（当前 ' + totalRatio + '%）' };
  var allocated = 0;
  ATTRIBUTES.forEach(function(attr) {
    var r = Math.max(0, parseInt(ratios[attr]) || 0);
    var n = Math.floor(free * r / 100);
    if (n > 0) {
      pet.attrPoints[attr] = (pet.attrPoints[attr] || 0) + n;
      pet.freeAttrPoints -= n;
      allocated += n;
    }
  });
  // 无法整除的零散点数保留为未分配自由属性点，不强制分配
  saveGame();
  return { ok: true, allocated: allocated, remaining: pet.freeAttrPoints };
}

// 需求16：宠物升级时发放属性点
function grantAttrPointsOnLevelUp(pet) {
  if (!pet) return;
  if (!pet.attrPoints) getPetAttrPoints(pet); // 触发迁移
  // 固定点：五维各+1
  ATTRIBUTES.forEach(function(attr) {
    pet.attrPoints[attr] = (pet.attrPoints[attr] || 0) + 1;
  });
  // 自由点：+5
  pet.freeAttrPoints = (pet.freeAttrPoints || 0) + getPetFreeAttrPointsPerLevel();
}

// v2.8.0 需求1.1：宠物上阵时重新计算属性，按当前状态刷新到正确情况
// 确保宠物属性点与等级匹配，出战/未出战共用同一套计算逻辑
// v2.11.0 需求3.1：属性点计算逻辑重制 —— 简化为仅校验自由属性点
// 等级固定加成属性（每级每维+1）随等级自动同步，不纳入加点/洗点/校验操作范围
// 校验公式：已分配自由属性点 + 剩余自由属性点 = 宠物等级 × 5
function recalcPetOnDeploy(pet) {
  if (!pet) return;
  // 确保属性点已初始化
  if (!pet.attrPoints) getPetAttrPoints(pet);
  var lv = pet.level || 1;

  // ===== v2.11.0 需求3.1：等级固定加成属性自动同步 =====
  // 每级每维固定+1，确保 attrPoints[attr] 不低于等级值（固定加成部分）
  // 固定加成部分不纳入加点/洗点/校验，仅随等级自动同步
  ATTRIBUTES.forEach(function(attr) {
    if ((pet.attrPoints[attr] || 0) < lv) {
      pet.attrPoints[attr] = lv; // 补齐固定加成
    }
  });

  // ===== v2.11.0 需求3.1：自由属性点校验 =====
  // 已分配自由属性点 = sum(attrPoints[attr] - lv)（即超出固定加成的部分）
  // 校验公式：已分配自由属性点 + 剩余自由属性点 = 等级 × 5
  var freeAllocated = 0;
  ATTRIBUTES.forEach(function(attr) {
    freeAllocated += Math.max(0, (pet.attrPoints[attr] || 0) - lv);
  });
  var freeExpected = lv * getPetFreeAttrPointsPerLevel(); // 等级 × 5
  var freeTotal = freeAllocated + (pet.freeAttrPoints || 0);
  if (freeTotal < freeExpected) {
    // 差额补充到剩余自由属性点
    pet.freeAttrPoints = (pet.freeAttrPoints || 0) + (freeExpected - freeTotal);
  }

  // 同步自由属性点
  syncPetAttrPoints(pet);
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
    // v2.11.0 需求8.2：修复技能倍率计算——所有伤害均计入贡献，高伤技能额外加成
    // 基础贡献：平均伤害系数×0.2（所有技能都有贡献，不再只计超1.0部分）
    mult += avgDmgPct * 0.2;
    // 超出1.0的部分额外×0.3加成（高伤技能奖励）
    mult += Math.max(0, avgDmgPct - 1.0) * 0.3;
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
// v2.11.0 需求8.1/8.2：属性加成权重提升 + 灵力天赋倍率修复 + 技能倍率计算修复
// 战斗力由以下部分组成：
//   1. 基础属性战力（资质+成长+等级+种族值，无任何加成；含进阶突破）
//   2. 宝石加成战力
//   3. 人物属性加成战力（cb flat属性）—— v2.11.0: 权重×1.5提升
//   4. 天赋倍率战力 —— v2.11.0: 灵力使用独立intMult（仅全属性天赋）
//   5. 装备特效战力（petHp/petDef百分比加成）
//   6. 宠物装备战力（基础词条+随机词条+成长资质加成+套装百分比）
//   7. 血统战力（血统技能效果）
//   8. 阵法战力（阵法加成）
//   9. 技能加成战力 —— v2.11.0: 所有伤害均计入贡献（不再只计超1.0部分）
// 战力权重：气血0.3 / 攻击力3 / 防御力2 / 灵力2.5 / 速度1.5
var CP_WEIGHTS = { 气血:0.3, 攻击力:3, 防御力:2, 灵力:2.5, 速度:1.5 };

function getCombatPowerBreakdown(pet) {
  const lv = pet.level || 1;
  const growth = pet.growth || 1.0;
  // 需求16：五维资质系统（兼容旧存档：智力资质→魔力资质，新增耐力资质）
  const apt = pet.aptitude || { 力量资质:1500, 敏捷资质:1500, 体质资质:1500, 耐力资质:1500, 魔力资质:1500 };
  var apt力量 = apt.力量资质 || 1500;
  var apt敏捷 = apt.敏捷资质 || 1500;
  var apt体质 = apt.体质资质 || 1500;
  var apt耐力 = apt.耐力资质 || apt.智力资质 || 1500; // 旧存档兼容
  var apt魔力 = apt.魔力资质 || apt.智力资质 || 1500; // 旧存档兼容
  const rv = getRaceValues(pet.race);
  var W = CP_WEIGHTS;

  // ===== 1. 基础属性（需求16：五维属性点转化公式）=====
  var attrPts = getPetAttrPoints(pet);
  var ptVal力量 = getAttrPointValue(apt力量, growth, rv.力量);
  var ptVal敏捷 = getAttrPointValue(apt敏捷, growth, rv.敏捷);
  var ptVal体质 = getAttrPointValue(apt体质, growth, rv.体质);
  var ptVal耐力 = getAttrPointValue(apt耐力, growth, rv.耐力);
  var ptVal魔力 = getAttrPointValue(apt魔力, growth, rv.魔力);
  var 体质 = (attrPts.体质 || 0) * ptVal体质;
  var 力量 = (attrPts.力量 || 0) * ptVal力量;
  var 敏捷 = (attrPts.敏捷 || 0) * ptVal敏捷;
  var 耐力 = (attrPts.耐力 || 0) * ptVal耐力;
  var 魔力 = (attrPts.魔力 || 0) * ptVal魔力;

  var 气血 = 体质 * 10 + lv * 20;
  var 攻击力 = 力量 * 2 + 敏捷 * 0.5;
  var 防御力 = 耐力 * 1.5 + 体质 * 0.3; // 需求16：耐力大幅提升防御
  var 灵力 = 魔力 * 1.5 + 体质 * 0.3 + 耐力 * 0.3 + 力量 * 0.2; // 需求16：魔力大幅提升灵力
  var 速度 = 敏捷 * 1.5;
  var baseCp = 气血 * W.气血 + 攻击力 * W.攻击力 + 防御力 * W.防御力 + 灵力 * W.灵力 + 速度 * W.速度;

  // ===== 2. 宝石加成 =====
  // v2.9.0 需求1.1：宝石改为百分比加成，作用于人物基础五维（在 getCharacterBonusForPet 内应用）
  // 宝石收益已并入下方 charCp，此处不再单独计算 gemCp
  var gemCp = 0;

  // ===== 3. 人物属性加成（cb flat属性，需求16：五维，已含宝石百分比收益）=====
  const cb = getCharacterBonusForPet();
  var charFlatHp = cb.气血 || 0;
  var charFlatAtk = (cb.力量 || 0) * 0.5 + (cb.atk || 0);
  var charFlatDef = (cb.耐力 || 0) * 1.5 + (cb.体质 || 0) * 0.3 + (cb.def || 0);
  var charFlatInt = (cb.魔力 || cb.智力 || 0) * 1.5 + (cb.体质 || 0) * 0.3 + (cb.耐力 || 0) * 0.3 + (cb.力量 || 0) * 0.2;
  var charFlatSpd = cb.敏捷 || 0;
  var charCp = charFlatHp * W.气血 + charFlatAtk * W.攻击力 + charFlatDef * W.防御力 + charFlatInt * W.灵力 + charFlatSpd * W.速度;

  // 各属性的「基础+人物」总值（用于计算天赋倍率加成）
  // v2.9.0 需求1.1：宝石收益已并入 charCp/charFlat*，不再单独叠加
  var totalHp = 气血 + charFlatHp;
  var totalAtk = 攻击力 + charFlatAtk;
  var totalDef = 防御力 + charFlatDef;
  var totalInt = 灵力 + charFlatInt;
  var totalSpd = 速度 + charFlatSpd;

  // ===== 4. 天赋倍率加成（含子天赋拆分）=====
  var atkMult = 1 + getTalentBonus('pet_atk') + getTalentBonus('pet_atk_2') + getTalentBonus('pet_atk_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var hpMult = 1 + getTalentBonus('pet_hp') + getTalentBonus('pet_hp_2') + getTalentBonus('pet_hp_3') + getTalentBonus('combat_mastery') + getTalentBonus('combat_ultimate');
  var defMult = 1 + getTalentBonus('pet_def') + getTalentBonus('pet_def_2') + getTalentBonus('combat_ultimate');
  var spdMult = 1 + getTalentBonus('pet_speed') + getTalentBonus('combat_ultimate');
  // v2.11.0 需求8.2：修复灵力天赋倍率——灵力仅受全属性天赋(combat_ultimate)影响，不应使用atkMult
  var intMult = 1 + getTalentBonus('combat_ultimate');
  var talentCp = totalHp * (hpMult - 1) * W.气血
              + totalAtk * (atkMult - 1) * W.攻击力
              + totalDef * (defMult - 1) * W.防御力
              + totalInt * (intMult - 1) * W.灵力
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
    var peInt = peBonus.statAdditions ? ((peBonus.statAdditions.魔力 || peBonus.statAdditions.智力 || 0) * 1.5 + (peBonus.statAdditions.体质 || 0) * 0.3 + (peBonus.statAdditions.耐力 || 0) * 0.3 + (peBonus.statAdditions.力量 || 0) * 0.2) : 0;
    // 成长/资质加成（折算为基础属性增量）
    var peGrowthAdd = peBonus.growthAddition || 0;
    var peAptAdd = peBonus.aptAdditions || {};
    var peAptFactor = function(v) { return (v || 0) / 100; };
    var peGrowthBonus = peGrowthAdd * (1 + lv * 0.05);
    var peAptHp = peAptFactor(peAptAdd.体质资质 || 0) * peGrowthBonus * 10;
    var peAptAtk = (peAptFactor(peAptAdd.力量资质 || 0) * 2 + peAptFactor(peAptAdd.敏捷资质 || 0) * 0.5) * peGrowthBonus;
    var peAptDef = (peAptFactor(peAptAdd.耐力资质 || 0) * 1.5 + peAptFactor(peAptAdd.体质资质 || 0) * 0.3) * peGrowthBonus;
    var peAptInt = (peAptFactor(peAptAdd.魔力资质 || peAptAdd.智力资质 || 0) * 1.5 + peAptFactor(peAptAdd.体质资质 || 0) * 0.3 + peAptFactor(peAptAdd.耐力资质 || 0) * 0.3 + peAptFactor(peAptAdd.力量资质 || 0) * 0.2) * peGrowthBonus;
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
                + (totalInt * intMult) * (setIntPct + setAllPct) * W.灵力
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
                + (totalInt * intMult) * (blIntPct + blAllPct) * W.灵力
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
                    + (totalInt * intMult) * (fIntPct + fAllPct) * W.灵力
                    + (totalSpd * spdMult) * (fSpdPct + fAllPct) * W.速度;
      }
    }
  }

  // 属性战力小计（保留用于兼容性展示）
  var statCp = baseCp + gemCp + charCp + talentCp + petBonusCp + petEquipCp + bloodlineCp + formationCp;

  // ===== 9. 技能加成倍率 =====
  var skillMult = getSkillPowerMultiplier(pet);

  // ===== 10. v2.8.0 需求1.2：二级战斗属性加成（暴击率/暴击伤害/闪避/命中）=====
  var petStats = getPetStats(pet);
  var critRate = petStats.critRate || 0;       // 暴击率（小数，0.05=5%）
  var critDmg = petStats.critDmg || 0;          // 暴击伤害加成（小数，0.5=150%总暴伤）
  var dodgeRate = petStats.dodgeRate || 0;      // 闪避率（小数）
  var hitRate = petStats.hitRate || 0;           // 命中率（小数）
  var vampPct = petStats.vampPct || 0;           // 吸血
  var dmgReduce = petStats.dmgReduce || 0;       // 减伤
  var skillTrigger = petStats.skillTrigger || 0; // 技能触发
  var skillDmg = petStats.skillDmg || 0;         // 技能伤害
  var regenPct = petStats.regenPct || 0;         // 回复
  var magicDmgPct = petStats.magicDmgPct || 0;   // 法术伤害
  // 二级属性对战力的百分比加成：暴击/暴伤/闪避/命中/吸血/减伤/技能触发/技能伤害/回复/法伤
  var secondaryPct = critRate * 1.0      // 暴击率：每1%加1%战力
                   + critDmg * 0.3        // 暴击伤害：每1%加0.3%战力
                   + dodgeRate * 0.8      // 闪避率：每1%加0.8%战力
                   + Math.max(0, hitRate - 0.8) * 0.5 // 命中率超80%部分：每1%加0.5%战力
                   + vampPct * 0.6        // 吸血：每1%加0.6%战力
                   + dmgReduce * 1.0      // 减伤：每1%加1%战力
                   + skillTrigger * 0.8   // 技能触发：每1%加0.8%战力
                   + skillDmg * 0.5       // 技能伤害：每1%加0.5%战力
                   + regenPct * 0.4       // 回复：每1%加0.4%战力
                   + magicDmgPct * 0.5;   // 法术伤害：每1%加0.5%战力

  // ===== v2.10.0 需求4.1：战斗力计算公式全维度重构（6大模块加权求和）=====
  // 宠物总战力 = 基础属性战力 + 技能战力 + 人物加成战力 + 阵法战力 + 天赋战力 + 神通战力
  //
  // 模块1：基础属性战力 —— 宠物自身五维 + 宠物装备/符文加成 + 二级属性加成
  //   baseAttrCp = (baseCp + petEquipCp) × (1 + secondaryPct)
  var baseAttrCp = (baseCp + petEquipCp) * (1 + secondaryPct);

  // 模块2：技能战力 —— 主动/被动技能倍率贡献 + 血统天赋技能战力
  //   skillCpTotal = (baseCp + petEquipCp) × (skillMult - 1) + bloodlineCp
  var skillCpTotal = (baseCp + petEquipCp) * (skillMult - 1) + bloodlineCp;

  // 模块3：人物加成战力 —— 人物额外属性加成 + 装备特效（petHp/petDef）
  // v2.11.0 需求8.1：属性加成战力权重提升×1.5（人物装备/宝石等外部投资对战力贡献放大）
  //   charTotalCp = (charCp + petBonusCp) × 1.5
  var charTotalCp = (charCp + petBonusCp) * 1.5;

  // 模块4：阵法战力 —— 阵法提供的属性/效果加成
  //   formationCp 已在上方计算

  // 模块5：天赋战力 —— 玩家已点亮天赋中对宠物生效的加成
  //   talentCp 已在上方计算

  // 模块6：神通战力 —— 宠物神通系统提供的全部加成
  //   基于总属性 × 神通百分比加成 × 权重
  var divineCp = 0;
  if (typeof getAllDivinePowerEffects === 'function') {
    var dpEffects = getAllDivinePowerEffects();
    var dpAtkPct = 0, dpDefPct = 0, dpHpPct = 0, dpSpdPct = 0, dpIntPct = 0, dpAllPct = 0;
    dpEffects.forEach(function(eff) {
      var v = eff.effect.value;
      switch (eff.effect.type) {
        case 'atkPct': dpAtkPct += v; break;
        case 'defPct': dpDefPct += v; break;
        case 'hpPct':  dpHpPct  += v; break;
        case 'spdPct': dpSpdPct += v; break;
        case 'intPct': dpIntPct += v; break;
        case 'allPct': dpAllPct += v; break;
      }
    });
    // 神通基于天赋后的总属性计算战力贡献
    var finalHp  = totalHp * hpMult;
    var finalAtk = totalAtk * atkMult;
    var finalDef = totalDef * defMult;
    var finalInt = totalInt * intMult;
    var finalSpd = totalSpd * spdMult;
    divineCp = finalHp  * (dpHpPct  + dpAllPct) * W.气血
             + finalAtk * (dpAtkPct + dpAllPct) * W.攻击力
             + finalDef * (dpDefPct + dpAllPct) * W.防御力
             + finalInt * (dpIntPct + dpAllPct) * W.灵力
             + finalSpd * (dpSpdPct + dpAllPct) * W.速度;
  }

  // 兼容性：secondaryCp 用于展示
  var secondaryCp = (baseCp + petEquipCp) * secondaryPct;
  // 兼容性：skillCp 用于展示
  var skillCp = skillCpTotal;

  // v2.10.0 需求4.1：最终战力 = 6大模块加权求和
  var total = Math.round(baseAttrCp + skillCpTotal + charTotalCp + formationCp + talentCp + divineCp);

  return {
    // v2.10.0 需求4.1：6大模块战力
    baseAttrCp: Math.round(baseAttrCp),    // 模块1：基础属性战力（五维+装备/符文+二级属性）
    skillCpTotal: Math.round(skillCpTotal), // 模块2：技能战力（技能倍率+血统天赋）
    charTotalCp: Math.round(charTotalCp),   // 模块3：人物加成战力（人物属性+装备特效）
    formationCp: Math.round(formationCp),   // 模块4：阵法战力
    talentCp: Math.round(talentCp),         // 模块5：天赋战力
    divineCp: Math.round(divineCp),         // 模块6：神通战力
    // 兼容字段（保留旧字段供UI过渡）
    baseCp: Math.round(baseCp),
    gemCp: Math.round(gemCp),
    charCp: Math.round(charCp),
    petBonusCp: Math.round(petBonusCp),
    petEquipCp: Math.round(petEquipCp),
    bloodlineCp: Math.round(bloodlineCp),
    skillCp: Math.round(skillCp),
    secondaryCp: Math.round(secondaryCp),
    statCp: Math.round(statCp),
    skillMult: skillMult,
    secondaryPct: secondaryPct,
    total: total  // 总战力 = 6大模块加权求和
  };
}

function getPetCombatPower(pet) {
  return getCombatPowerBreakdown(pet).total;
}

function getAllSkills(pet) {
  var skills = [...pet.innateSkills, ...pet.learnedSkills];
  // 需求8：宠物装备附加技能不占用6格上限，直接追加到技能列表
  if (typeof getPetEquipBonus === 'function' && pet.petEquipment) {
    var bonus = getPetEquipBonus(pet);
    if (bonus.skillAdditions && bonus.skillAdditions.length > 0) {
      skills = skills.concat(bonus.skillAdditions);
    }
  }
  return skills;
}

function getBloodlineSkill(pet) {
  // 需求1重构：使用 config.js 中的 getPetBloodlineSkill（含血统珠覆盖）
  // 需求1修复：删除种族通用血统兜底，每只宠物仅拥有自身专属血统
  if (typeof getPetBloodlineSkill === 'function') return getPetBloodlineSkill(pet);
  return null;
}

function getNormalSkills(pet) {
  return getAllSkills(pet).filter(s => s.type !== 'bloodline' && !s.isEquipSkill);
}

// 需求8：获取宠物装备附加技能列表（不占6格上限）
function getEquipSkills(pet) {
  if (typeof getPetEquipBonus === 'function' && pet.petEquipment) {
    var bonus = getPetEquipBonus(pet);
    if (bonus.skillAdditions && bonus.skillAdditions.length > 0) {
      return bonus.skillAdditions;
    }
  }
  return [];
}

// 需求5：校验宠物装备技能词条是否正确挂载——返回校验结果对象
// 用于调试和验证装备技能词条的汉化与生效状态
function validateEquipSkills(pet) {
  var result = { valid: true, errors: [], warnings: [], mounted: [], rawAffixes: [] };
  if (!pet || !pet.petEquipment) return result;
  ['attack', 'hp', 'defense'].forEach(function(slot) {
    var equip = pet.petEquipment[slot];
    if (!equip || !equip.affixes) return;
    equip.affixes.forEach(function(a, idx) {
      var affixDef = (typeof PET_AFFIX_TYPES !== 'undefined') ? PET_AFFIX_TYPES.find(function(t) { return t.id === a.id; }) : null;
      if (!affixDef) {
        result.errors.push('栏位[' + slot + ']词条#' + idx + '：未找到词条定义(ID=' + a.id + ')');
        result.valid = false;
        return;
      }
      if (affixDef.kind === 'skill') {
        var skillId = a.value;
        var entry = { slot: slot, affixId: a.id, skillId: skillId, affixIndex: idx };
        if (!skillId) {
          result.warnings.push('栏位[' + slot + ']技能词条#' + idx + '：技能ID为空');
          entry.status = 'empty';
        } else if (typeof ALL_SKILLS !== 'undefined') {
          var skill = ALL_SKILLS.find(function(s) { return s.id === skillId; });
          if (!skill) {
            result.errors.push('栏位[' + slot + ']技能词条#' + idx + '：技能ID[' + skillId + ']在ALL_SKILLS中不存在');
            entry.status = 'invalid';
            result.valid = false;
          } else {
            entry.status = 'ok';
            entry.skillName = skill.name;
            entry.skillDesc = skill.desc;
            entry.skillType = skill.type;
          }
        }
        result.rawAffixes.push(entry);
      }
    });
  });
  // 校验挂载结果
  var equipSkills = getEquipSkills(pet);
  result.mounted = equipSkills.map(function(s) {
    return { id: s.id, name: s.name, desc: s.desc, type: s.type, isEquipSkill: s.isEquipSkill };
  });
  // 对比：原始技能词条数 vs 挂载数（去重后可能不同）
  var rawSkillCount = result.rawAffixes.filter(function(e) { return e.status === 'ok'; }).length;
  var uniqueSkillIds = {};
  result.rawAffixes.forEach(function(e) {
    if (e.status === 'ok') uniqueSkillIds[e.skillId] = true;
  });
  var uniqueCount = Object.keys(uniqueSkillIds).length;
  if (uniqueCount !== result.mounted.length) {
    result.warnings.push('去重后技能数(' + uniqueCount + ')与挂载数(' + result.mounted.length + ')不一致');
  }
  return result;
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
  // T3 类（mid 名宠物）可直接孵化（无幼年体，孵化即成长体，天生较强）
  // 进阶系统已移除，但 mid 名仍是有效的 T3 宠物，可正常孵化
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
    // 需求Bug修复：T级品质上限调整，最低稀有（index=2），T1=稀有, T2=史诗, T3=传说, T4/T5=神话
    const rarityIdx = Math.min(RARITIES.indexOf(pet.rarity), tierIdx + 2);
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
    // 需求Bug修复：T级品质上限调整，最低稀有（index=2）
    var rarityIdx = Math.min(RARITIES.indexOf(pet.rarity), tierIdx + 2);
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
// 需求3/需求17：蛋的阶位与地图等级绑定
// 低阶段(1-3图)=T1蛋, 中低阶段(4-6图)=T1-T2蛋, 中高阶段(7-9图)=T2-T3蛋, 高阶段(10-11图)=T3-T4蛋
// T5阶蛋主线不掉落
function getEggTierByMapLevel() {
  var map = MAPS.find(function(m) { return m.id === G.player.currentMap; });
  var mapId = map ? map.id : 1;
  var roll = Math.random();
  var tierMin, tierMax;
  if (mapId <= 3) { tierMin = 0; tierMax = 0; }        // 低阶段：T1蛋（tier=0）
  else if (mapId <= 6) { tierMin = 0; tierMax = 1; }    // 中低阶段：T1-T2蛋
  else if (mapId <= 9) { tierMin = 1; tierMax = 2; }    // 中高阶段：T2-T3蛋
  else { tierMin = 2; tierMax = 3; }                     // 高阶段：T3-T4蛋
  // 在阶位范围内随机
  if (tierMin === tierMax) return tierMin;
  return roll < 0.5 ? tierMin : tierMax;
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
    bloodline: null, // 血统重构：运行时通过 getPetBloodlineSkill 动态查询
    innateSkills: [],
    learnedSkills: [],
    level: 1,
    moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    advanceStage: 0, advanceable: false, advanceValue: 0, // 融合宠物不可进阶
    lifespan: randomInt(10000, 15000), // 初始寿命：10000~15000
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
    bloodline: null, // 血统重构：运行时通过 getPetBloodlineSkill 动态查询
    innateSkills: [],
    learnedSkills: [],
    level: 1,
    moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    lifespan: randomInt(10000, 15000), // 初始寿命：10000~15000
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
  // 天生技能——使用公共函数（仅获取图鉴定义技能）
  newPet.innateSkills = generateInnateSkills(name, (dex.innateSkills ? dex.innateSkills.length : 1), dex);
  return { result: newPet, isSpecial: true, isFusionOnly: true };
}

// ==================== 神兽生成 ====================
// 随机生成1只神兽（6种族各1只），固定3.0成长/3000全资质/神话品质
// 仅可通过99个神兽精华兑换获得
// 需求：神兽必定为满技能配置，固定技能组成为：3个主动技能 + 2个超级被动技能 + 1个超级光环技能
function generateDivineBeast() {
  var name = pickRandom(DIVINE_BEASTS);
  var dex = getPetDex(name);
  var race = dex.race;
  // 血统重构：神兽血统同样通过 getPetBloodlineSkill 从 PET_BLOOD_ALL 动态查询
  var bloodline = null;
  // 固定属性：3.0成长，3000全资质
  var aptitude = {};
  APTITUDE_KEYS.forEach(function(k) {
    aptitude[k] = 3000;
  });
  var growth = 3.0;
  // 神兽固定技能：3主动 + 2超级被动 + 1超级光环
  var innateSkills = generateDivineBeastSkills();
  var newPet = {
    name: name,
    race: race,
    rarity: 'mythic',     // 神兽固定为神话品质
    growth: growth,       // 固定3.0
    aptitude: aptitude,   // 固定3000全资质
    bloodline: bloodline,
    innateSkills: innateSkills,
    learnedSkills: [],
    level: G.player.level || 1, // 神兽等级同步玩家等级
    moonDewUsed: 0,
    petEquipment: { attack: null, hp: null, defense: null },
    advanceStage: 0, advanceable: false, advanceValue: 0, // 神兽不可进阶
    isDivineBeast: true,  // 神兽标记
    lifespan: 99999, // 神兽寿命无限（设为极大值）
    id: 'pet_' + Date.now() + '_' + randomInt(1000, 9999),
  };
  return { result: newPet, isDivineBeast: true };
}

// 神兽固定技能生成：3主动 + 2超级被动 + 1超级光环
function generateDivineBeastSkills() {
  var skills = [];
  var usedBaseIds = new Set();
  // 3个主动技能（从主动技能池随机选取，优先高品质）
  var activePool = ACTIVE_SKILLS.filter(function(s) {
    return FUSION_EXCLUSIVE_SKILL_IDS.indexOf(s.id) < 0;
  }).slice();
  // 打乱顺序
  for (var i = activePool.length - 1; i > 0; i--) {
    var j = randomInt(0, i);
    var tmp = activePool[i]; activePool[i] = activePool[j]; activePool[j] = tmp;
  }
  var activeCount = 0;
  for (var i = 0; i < activePool.length && activeCount < 3; i++) {
    var s = activePool[i];
    var baseId = getSkillBaseId(s.id);
    if (!usedBaseIds.has(baseId)) {
      skills.push(Object.assign({}, s, { isInnate: true }));
      usedBaseIds.add(baseId);
      activeCount++;
    }
  }
  // 2个超级被动技能（tier=3）
  var superPassivePool = PASSIVE_SKILLS.filter(function(s) { return s.tier === 3; }).slice();
  for (var i = superPassivePool.length - 1; i > 0; i--) {
    var j = randomInt(0, i);
    var tmp = superPassivePool[i]; superPassivePool[i] = superPassivePool[j]; superPassivePool[j] = tmp;
  }
  var passiveCount = 0;
  for (var i = 0; i < superPassivePool.length && passiveCount < 2; i++) {
    var s = superPassivePool[i];
    var baseId = getSkillBaseId(s.id);
    if (!usedBaseIds.has(baseId)) {
      skills.push(Object.assign({}, s, { isInnate: true }));
      usedBaseIds.add(baseId);
      passiveCount++;
    }
  }
  // 1个超级光环技能（tier=3）
  var superAuraPool = AURA_SKILLS.filter(function(s) { return s.tier === 3; }).slice();
  if (superAuraPool.length > 0) {
    var s = superAuraPool[randomInt(0, superAuraPool.length - 1)];
    skills.push(Object.assign({}, s, { isInnate: true }));
  }
  return skills;
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
  // 技能重置——使用公共函数 generateInnateSkills（消除重复代码）
  var maxSkills = getPetMaxSkills(pet.name);
  var innateSkills = generateInnateSkills(pet.name, maxSkills);
  pet.innateSkills = innateSkills;
  pet.learnedSkills = [];
  pet.moonDewUsed = 0;
  // 重生刷新品质：根据新的成长/资质重新计算
  pet.rarity = recalcRarity(pet);
  return { ok: true, pet: pet };
}

// v2.9.0 需求2.3：宠物洗点丹 —— 重置指定宠物的全部自由属性点
// 全额返还为未分配状态，供玩家重新分配（不影响成长/资质/技能/等级/血统/符文等）
function resetPetAttrPoints(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return { ok: false, msg: '宠物不存在' };
  // 检查道具
  var inv = G.inventory.find(function(i) { return i.id === 'pet_reset_pill'; });
  if (!inv || inv.count <= 0) {
    return { ok: false, msg: '需要宠物洗点丹才能洗点' };
  }
  // 确保属性点已初始化
  if (!pet.attrPoints) getPetAttrPoints(pet);
  // 计算总属性点（等级 × 10）
  var lv = pet.level || 1;
  var totalExpected = lv * getPetAttrPointsPerLevel();
  // 固定点每级各维+1（不可重置）
  var fixedPerAttr = lv;
  // 可自由分配的点数 = 总点数 - 固定点（5维×固定lv）
  var freePoints = totalExpected - fixedPerAttr * 5;
  if (freePoints < 0) freePoints = 0;
  // 重置：固定点保留，自由点全额返还
  pet.attrPoints = {
    力量: fixedPerAttr,
    敏捷: fixedPerAttr,
    体质: fixedPerAttr,
    耐力: fixedPerAttr,
    魔力: fixedPerAttr,
  };
  pet.freeAttrPoints = freePoints;
  // 消耗道具
  inv.count--;
  if (inv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== 'pet_reset_pill'; });
  // 清除缓存
  if (pet._statsCache) delete pet._statsCache;
  return { ok: true, pet: pet, refunded: freePoints };
}

// ==================== 新进阶系统（进化晶石） ====================

/**
 * 进化晶石暴击计算
 * 使用进化晶石时有低概率触发暴击，暴击倍率为 2~9 倍
 * @param {string} itemTier - 道具品质: 'low' / 'mid' / 'high'
 * @returns {{ value: number, crit: boolean, critMult: number }} 进阶值增量及暴击信息
 */
function calculateEvolutionCrystalValue(itemTier) {
  var config = EVOLVE_SYSTEM_CONFIG.ITEMS[itemTier];
  if (!config) return { value: 0, crit: false, critMult: 1 };
  var baseValue = config.baseValue;
  var crit = Math.random() < config.critChance;
  var critMult = 1;
  if (crit) {
    critMult = randomInt(EVOLVE_SYSTEM_CONFIG.CRIT_MIN, EVOLVE_SYSTEM_CONFIG.CRIT_MAX);
  }
  return {
    value: baseValue * critMult,
    crit: crit,
    critMult: critMult,
  };
}

/**
 * 执行宠物进阶（当 advanceValue 达到上限时调用）
 * 进阶效果：
 * 1. 宠物名变更为进阶链中下一阶段名
 * 2. 成长和资质在原基础上 ×1.3
 * 3. advanceStage +1
 * 4. 按目标 T 级解锁技能格（T5=6格）
 * 5. advanceValue 清零
 * 6. 更新 advanceable（是否还能继续进阶）
 * @param {string} petId - 宠物ID
 * @returns {{ ok: boolean, msg: string, pet?: object }}
 */
function advancePetEvolve(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return { ok: false, msg: '宠物不存在' };
  var evolveInfo = getPetEvolveInfo(pet);
  if (!evolveInfo.canEvolve) {
    if (evolveInfo.maxed) return { ok: false, msg: '该宠物已达到最高进阶形态' };
    return { ok: false, msg: '该宠物不可进阶' };
  }
  // 检查进阶值是否达到上限
  if ((pet.advanceValue || 0) < evolveInfo.advanceValueMax) {
    return { ok: false, msg: '进阶值不足，需 ' + evolveInfo.advanceValueMax + ' 点' };
  }

  // 执行进阶
  var oldName = pet.name;
  var newName = evolveInfo.nextName;
  var newStage = (pet.advanceStage || 0) + 1;
  var newDex = getPetDex(newName);

  // 更新宠物名和进阶阶段
  pet.name = newName;
  pet.advanceStage = newStage;

  // 成长和资质在原基础上 ×1.3
  var aptMult = EVOLVE_SYSTEM_CONFIG.ADVANCE_APTITUDE_MULT;
  var gMult = EVOLVE_SYSTEM_CONFIG.ADVANCE_GROWTH_MULT;
  APTITUDE_KEYS.forEach(function(k) {
    if (pet.aptitude && pet.aptitude[k]) {
      pet.aptitude[k] = Math.floor(pet.aptitude[k] * aptMult);
    }
  });
  if (pet.growth) {
    pet.growth = Math.round(pet.growth * gMult * 100) / 100;
  }

  // 按目标 T 级解锁技能格：更新天生技能
  // 需求Bug修复：dex.innateSkills 存储的是技能ID（字符串），pet.innateSkills 存储的是技能对象
  // 必须从 ALL_SKILLS 查找完整技能对象后再push，否则详情页访问 skill.name/type/desc 会渲染崩溃
  if (newDex && newDex.innateSkills) {
    var maxSkills = getPetMaxSkills(newName);
    var existingSkillIds = {};
    if (pet.innateSkills) {
      pet.innateSkills.forEach(function(s) { existingSkillIds[s.id || s] = true; });
    }
    newDex.innateSkills.forEach(function(sid) {
      var skillId = typeof sid === 'string' ? sid : (sid.id || sid);
      if (!existingSkillIds[skillId] && pet.innateSkills.length < maxSkills) {
        // 从 ALL_SKILLS 查找完整技能对象，与 generateInnateSkills 保持一致
        var sk = (typeof ALL_SKILLS !== 'undefined') ? ALL_SKILLS.find(function(s) { return s.id === skillId; }) : null;
        if (sk) {
          pet.innateSkills.push(Object.assign({}, sk, { isInnate: true }));
          existingSkillIds[skillId] = true;
        }
      }
    });
  }

  // 进阶值清零
  pet.advanceValue = 0;

  // 更新 advanceable：检查是否还能继续进阶
  var newEvolveInfo = getPetEvolveInfo(pet);
  pet.advanceable = newEvolveInfo.canEvolve;

  // 重新计算品质
  pet.rarity = recalcRarity(pet);

  return {
    ok: true,
    msg: oldName + ' 进阶成功！变为 ' + newName,
    pet: pet,
  };
}

// ==================== 宠物寿命系统 ====================

/**
 * 消耗宠物寿命（主线战斗每10次扣1，副本/活动每次扣1，阵亡每次扣50）
 * @param {string} battleType - 'main' | 'dungeon' | 'activity' | 'death'
 * @param {Array} teamPetIds - 参战的宠物ID数组（death模式时只需传单个宠物ID）
 * @returns {Array} 寿命耗尽的宠物ID列表
 */
function consumePetLifespan(battleType, teamPetIds) {
  var expiredPets = [];
  if (!teamPetIds || teamPetIds.length === 0) return expiredPets;

  if (battleType === 'death') {
    // 宠物阵亡：扣除50点寿命
    var pet = G.pets.find(function(p) { return p.id === teamPetIds; });
    if (pet && pet.lifespan !== undefined && pet.lifespan < 99999) {
      pet.lifespan = Math.max(0, pet.lifespan - 50);
      if (pet.lifespan <= 0) expiredPets.push(pet.id);
    }
    return expiredPets;
  }

  if (battleType === 'main') {
    // 主线战斗：每10次扣除1点
    if (!G.player.mainBattleLifespanCounter) G.player.mainBattleLifespanCounter = 0;
    G.player.mainBattleLifespanCounter++;
    if (G.player.mainBattleLifespanCounter < 10) return expiredPets;
    // 达到10次，扣除1点并重置计数器
    G.player.mainBattleLifespanCounter = 0;
    teamPetIds.forEach(function(pid) {
      var p = G.pets.find(function(pet) { return pet.id === pid; });
      if (p && p.lifespan !== undefined && p.lifespan < 99999) {
        p.lifespan = Math.max(0, p.lifespan - 1);
        if (p.lifespan <= 0) expiredPets.push(p.id);
      }
    });
  } else if (battleType === 'dungeon' || battleType === 'activity') {
    // 副本/活动：每次扣除1点
    teamPetIds.forEach(function(pid) {
      var p = G.pets.find(function(pet) { return pet.id === pid; });
      if (p && p.lifespan !== undefined && p.lifespan < 99999) {
        p.lifespan = Math.max(0, p.lifespan - 1);
        if (p.lifespan <= 0) expiredPets.push(p.id);
      }
    });
  }
  return expiredPets;
}

/**
 * 使用延寿道具
 * @param {string} itemId - 道具ID（lifespan_low / lifespan_mid / lifespan_high）
 * @param {string} petId - 目标宠物ID
 * @returns {{ ok: boolean, msg: string, sideEffect?: string }}
 */
function useLifespanItem(itemId, petId) {
  var amounts = { lifespan_low: 500, lifespan_mid: 1000, lifespan_high: 2000 };
  var amount = amounts[itemId];
  if (!amount) return { ok: false, msg: '无效的延寿道具' };

  var inv = G.inventory.find(function(i) { return i.id === itemId; });
  if (!inv || inv.count <= 0) return { ok: false, msg: '道具不足' };

  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return { ok: false, msg: '宠物不存在' };
  if (pet.lifespan === undefined) pet.lifespan = 10000;
  // 神兽寿命无限，不允许使用延寿道具
  if (pet.lifespan >= 99999) return { ok: false, msg: '神兽寿命无限，无需延寿' };

  // 消耗道具
  inv.count--;
  if (inv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== itemId; });

  // 增加寿命
  pet.lifespan += amount;

  // 10%概率触发副作用：随机降低某项资质或成长
  var sideEffectMsg = '';
  if (Math.random() < 0.10) {
    var dex = getPetDex(pet.name);
    // 50%概率降低资质，50%概率降低成长
    if (Math.random() < 0.5 && pet.aptitude) {
      // 随机降低一项资质（降低5%~10%）
      var aptKeys = APTITUDE_KEYS.slice();
      var randKey = aptKeys[randomInt(0, aptKeys.length - 1)];
      var curVal = pet.aptitude[randKey] || 1500;
      var reducePct = randomFloat(0.05, 0.10);
      var newVal = Math.max(800, Math.floor(curVal * (1 - reducePct)));
      var actualReduce = curVal - newVal;
      pet.aptitude[randKey] = newVal;
      sideEffectMsg = '⚠️ 副作用触发！' + randKey + ' 降低 ' + actualReduce + ' 点';
    } else {
      // 降低成长（降低5%~10%）
      var curGrowth = pet.growth || 1.0;
      var gReducePct = randomFloat(0.05, 0.10);
      var newGrowth = Math.max(0.5, Math.round(curGrowth * (1 - gReducePct) * 100) / 100);
      var actualGReduce = Math.round((curGrowth - newGrowth) * 100) / 100;
      pet.growth = newGrowth;
      sideEffectMsg = '⚠️ 副作用触发！成长降低 ' + actualGReduce;
    }
    // 重新计算品质
    pet.rarity = recalcRarity(pet);
  }

  return {
    ok: true,
    msg: '寿命 +' + amount + '，当前寿命：' + pet.lifespan,
    sideEffect: sideEffectMsg,
  };
}

