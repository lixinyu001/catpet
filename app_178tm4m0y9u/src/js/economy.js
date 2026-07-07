// ===== economy.js : 鐗╁搧銆佷换鍔°€佽浆鐢熴€佸銆佸競鍦?=====

// ==================== ITEMS ====================

function getItemName(id) {
  const names = {
    exp_ticket: '经验副本门票', gold_ticket: '金币副本门票', egg_ticket: '蛋之森林门票',
    skill_ticket: '技能秘境门票', forge_ticket: '强化石矿脉门票', map_ticket: '藏宝遗迹门票', gem_ticket: '宝石秘洞门票', pet_ticket: '宠物秘境门票',
    blood_dungeon_ticket: '血统副本门票',
    hatch_boost: '孵化加速器', hatch_stone: '孵化石', fusion_stone: '融合石', rare_egg: '稀有宠物蛋',
    moon_dew: '月华露',
    forge_stone_low: '低级强化石', forge_stone_mid: '中级强化石', forge_stone_high: '高级强化石',
    protection_stone: '保底石',
    yuanxiao_str: '力量元宵', yuanxiao_con: '体质元宵', yuanxiao_agi: '敏捷元宵', yuanxiao_int: '智力元宵',
    exp_book: '经验书', exp_book_mid: '中级经验书', exp_book_high: '高级经验书',
    dragon_scale: '龙鳞', dragon_tooth: '龙牙', dragon_crystal: '龙晶',
    demon_horn: '恶魔角', demon_heart: '恶魔之心', demon_contract: '恶魔契约',
    ancient_coin: '古代金币', magic_book: '魔法书', artifact_shard: '神器碎片',
    guiyuan_pill: '归元丹', guixu_pill: '归虚丹',
    rename_card: '改名卡',
    blood_orb_low: '低级血统珠', blood_orb_mid: '中级血统珠', blood_orb_high: '高级血统珠',
    // 需求7：打孔系统道具
    socket_nail: '打孔钉', repair_glue: '修补胶',
    // 装备洗练系统道具
    refine_stone: '洗练石',
    // 需求3：宠物进阶丸
    advance_pill_low: '低级进阶丸', advance_pill_mid: '中级进阶丸', advance_pill_high: '高级进阶丸',
    // 需求4：宠物装备材料中文名
    mystic_crystal_low: '低级神秘水晶', mystic_crystal_mid: '中级神秘水晶', mystic_crystal_high: '高级神秘水晶',
    ancient_rune_low: '低级远古符文', ancient_rune_mid: '中级远古符文', ancient_rune_high: '高级远古符文',
    // v2.2.0 需求9：挖密藏系统道具
    dig_map: '密藏图', dig_shovel: '探宝铲', dig_lens: '透视镜', dig_key: '密藏钥匙',
  };
  // 阵法书道具名
  if (id && id.indexOf(FORMATION_BOOK_PREFIX) === 0) {
    var formId = id.substring(FORMATION_BOOK_PREFIX.length);
    var formDef = FORMATIONS.find(function(f) { return f.id === formId; });
    if (formDef) return formDef.name + '书';
    return '未知阵法书';
  }
  // 已抽取的血统珠道具名（带来源与品质信息）
  if (id && id.indexOf(EXTRACTED_BLOOD_ORB_PREFIX) === 0) {
    var item = G.inventory.find(function(i) { return i.id === id; });
    if (item && item.isExtractedBloodOrb) {
      var blDef = BLOODLINE_SKILLS.find(function(b) { return b.id === item.bloodlineId; });
      var blName = blDef ? blDef.name : '未知血统';
      var qColor = BLOOD_ORB_QUALITY_NAMES[item.quality] || item.quality;
      return blName + '·' + qColor + '珠（来源:' + item.sourcePetName + '）';
    }
    return '血统珠';
  }
  return names[id] || id;
}

// ==================== 装备自动分解 ====================
// 添加装备到背包时检查自动分解设置
function addEquipmentToBag(equip) {
  if (!equip) return;
  var settings = G.autoDecompose || { enabled: false, maxRarity: 'green', maxLevel: 10 };
  if (settings.enabled) {
    // 需求6：上锁的装备不自动分解
    if (equip.locked) { G.equipmentBag.push(equip); return; }
    // 检查品质和等级是否符合自动分解条件
    var rarityOrder = ['white', 'green', 'blue', 'purple', 'orange'];
    var equipRarityIdx = rarityOrder.indexOf(equip.rarity);
    var maxRarityIdx = rarityOrder.indexOf(settings.maxRarity);
    if (equipRarityIdx >= 0 && maxRarityIdx >= 0 && equipRarityIdx <= maxRarityIdx && (equip.level || 1) <= settings.maxLevel) {
      // 自动分解：给强化石
      var stoneId, stoneName, count;
      switch (equip.rarity) {
        case 'white': stoneId = 'forge_stone_low'; stoneName = '低级强化石'; count = 1; break;
        case 'green': stoneId = 'forge_stone_low'; stoneName = '低级强化石'; count = 1; break;
        case 'blue': stoneId = 'forge_stone_mid'; stoneName = '中级强化石'; count = 1; break;
        case 'purple': stoneId = 'forge_stone_mid'; stoneName = '中级强化石'; count = 2; break;
        case 'orange': stoneId = 'forge_stone_high'; stoneName = '高级强化石'; count = 1; break;
        default: stoneId = 'forge_stone_low'; stoneName = '低级强化石'; count = 1;
      }
      var existing = G.inventory.find(function(i) { return i.id === stoneId; });
      if (existing) existing.count += count;
      else G.inventory.push({ id: stoneId, count: count });
      if (typeof addBattleLog === 'function') {
        addBattleLog('loot', '♻️ 自动分解 ' + (equip.name || '装备') + ' → ' + stoneName + ' x' + count);
      }
      return;
    }
  }
  G.equipmentBag.push(equip);
}

// ==================== 强化石合成 ====================
// 10个低级强化石 → 1个中级强化石
// 10个中级强化石 → 1个高级强化石
function composeForgeStone(fromTier, count) {
  // fromTier: 'low' → 'mid', 'mid' → 'high'
  var fromId = 'forge_stone_' + fromTier;
  var toId = 'forge_stone_' + (fromTier === 'low' ? 'mid' : 'high');
  var fromName = fromTier === 'low' ? '低级强化石' : '中级强化石';
  var toName = fromTier === 'low' ? '中级强化石' : '高级强化石';
  var cost = count * 10;
  var item = G.inventory.find(function(i) { return i.id === fromId; });
  if (!item || item.count < cost) {
    showToast('❌ ' + fromName + '数量不足（需要' + cost + '个）', 'error');
    return;
  }
  item.count -= cost;
  if (item.count <= 0) {
    var idx = G.inventory.indexOf(item);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  var toItem = G.inventory.find(function(i) { return i.id === toId; });
  if (toItem) toItem.count += count;
  else G.inventory.push({ id: toId, count: count });
  saveGame();
  showToast('🔨 合成成功！' + cost + '个' + fromName + ' → ' + count + '个' + toName, 'success');
  if (typeof render === 'function') render();
}

// ==================== 宠物装备系统 ====================
// 生成宠物装备：3栏(attack/hp/defense)，按品质有随机词条数
// rarity: rare/epic/legend/mythic, slot: attack/hp/defense
function generatePetEquip(rarity, slot, level) {
  if (!rarity) rarity = 'rare';
  if (!slot) slot = pickRandom(PET_EQUIP_SLOTS).id;
  if (!level) level = G.player.level || 1;
  var rarityIdx = PET_EQUIP_RARITIES.indexOf(rarity);
  if (rarityIdx < 0) { rarityIdx = 0; rarity = 'rare'; }
  var baseNames = PET_EQUIP_BASE_NAMES[slot] || PET_EQUIP_BASE_NAMES.attack;
  var name = pickRandom(baseNames);
  // 基础词条：1-攻击/灵力, 2-气血, 3-防御
  var baseStat = '';
  var baseVal = 0;
  var lvlScale = 1 + level * 0.08;
  switch (slot) {
    case 'attack':
      // 攻击/灵力：基础攻击力
      baseStat = '攻击力';
      baseVal = Math.floor((10 + level * 2) * (1 + rarityIdx * 0.3) * lvlScale);
      break;
    case 'hp':
      baseStat = '气血';
      baseVal = Math.floor((30 + level * 6) * (1 + rarityIdx * 0.3) * lvlScale);
      break;
    case 'defense':
      baseStat = '防御力';
      baseVal = Math.floor((6 + level * 1.5) * (1 + rarityIdx * 0.3) * lvlScale);
      break;
  }
  // 随机词条：优秀0, 稀有1, 史诗2, 传说3, 神话4
  var affixCount = PET_EQUIP_AFFIX_COUNT[rarityIdx];
  var affixes = [];
  var usedAffixIds = {};
  for (var i = 0; i < affixCount; i++) {
    var available = PET_AFFIX_TYPES.filter(function(a) { return !usedAffixIds[a.id]; });
    if (available.length === 0) break;
    var affix = pickRandom(available);
    usedAffixIds[affix.id] = true;
    var value = 0;
    var valScale = 1 + rarityIdx * 0.4;
    if (affix.kind === 'stat') {
      // 属性类：按属性类型决定数值范围
      if (affix.stat === '气血') {
        value = randomInt(20, 50) * level;
      } else if (affix.stat === '攻击力' || affix.stat === '防御力') {
        value = randomInt(5, 12) * level;
      } else if (affix.stat === '速度') {
        value = randomInt(2, 6) * Math.max(1, Math.floor(level / 5));
      } else {
        // 力量/体质/敏捷/智力
        value = randomInt(3, 8) * Math.max(1, Math.floor(level / 3));
      }
      value = Math.floor(value * valScale);
    } else if (affix.kind === 'aptitude') {
      // 资质类：随机20-100
      value = Math.floor(randomInt(20, 100) * valScale);
    } else if (affix.kind === 'growth') {
      // 成长类：0.05-0.20
      value = Math.round(randomFloat(0.05, 0.20) * valScale * 100) / 100;
    } else if (affix.kind === 'skill') {
      // 需求8：技能词条类——从技能池随机选一个技能ID作为值
      if (affix.skillPool && affix.skillPool.length > 0) {
        value = pickRandom(affix.skillPool);
      } else {
        value = ''; // 无技能池则跳过
      }
    }
    affixes.push({ id: affix.id, value: value });
  }
  // 套装：20%概率出现（仅史诗及以上）
  // 任务14：套装按周分布，从当天可出现的套装中选取
  var setId = null;
  if (rarityIdx >= 1 && Math.random() < 0.20) {
    var weeklySetIds = getWeeklyPetEquipSets();
    var weeklySets = (weeklySetIds && weeklySetIds.length) ? PET_EQUIP_SETS.filter(function(s) { return weeklySetIds.indexOf(s.id) >= 0; }) : PET_EQUIP_SETS;
    setId = pickRandom(weeklySets).id;
  }
  return {
    id: 'petequip_' + Date.now() + '_' + randomInt(1000, 9999) + '_' + Math.floor(Math.random()*1000),
    name: name,
    slot: slot,
    rarity: rarity,
    level: level,
    baseStat: baseStat,
    baseValue: baseVal,
    affixes: affixes,
    setId: setId,
  };
}

// 添加宠物装备到背包
function addPetEquipToBag(equip) {
  if (!equip) return;
  G.petEquipBag.push(equip);
}

// 装备宠物装备到指定宠物的指定栏位
function equipPetEquipment(petId, equipId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (!pet.petEquipment) pet.petEquipment = { attack: null, hp: null, defense: null };
  var idx = G.petEquipBag.findIndex(function(e) { return e.id === equipId; });
  if (idx < 0) { showToast('装备不存在', 'error'); return; }
  var equip = G.petEquipBag[idx];
  var slot = equip.slot;
  // 卸下旧装备
  var old = pet.petEquipment[slot];
  if (old) G.petEquipBag.push(old);
  // 装备新装备
  pet.petEquipment[slot] = equip;
  G.petEquipBag.splice(idx, 1);
  saveGame();
  showToast('已装备 ' + equip.name + ' 到 ' + getPetDisplayName(pet), 'success');
  if (typeof render === 'function') render();
}

// 卸下宠物装备
function unequipPetEquipment(petId, slot) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet || !pet.petEquipment) return;
  var old = pet.petEquipment[slot];
  if (!old) return;
  G.petEquipBag.push(old);
  pet.petEquipment[slot] = null;
  saveGame();
  showToast('已卸下 ' + old.name, 'info');
  if (typeof render === 'function') render();
}

// 分解宠物装备：获得材料
function decomposePetEquip(equipId) {
  var idx = G.petEquipBag.findIndex(function(e) { return e.id === equipId; });
  if (idx < 0) { showToast('装备不存在', 'error'); return; }
  var equip = G.petEquipBag[idx];
  var yields = PET_EQUIP_DECOMP_YIELD[equip.rarity] || PET_EQUIP_DECOMP_YIELD.rare;
  var gained = {};
  Object.keys(yields).forEach(function(mat) {
    var range = yields[mat];
    var count = randomInt(range[0], range[1]);
    if (count > 0) {
      G.petEquipMaterials[mat] = (G.petEquipMaterials[mat] || 0) + count;
      gained[mat] = count;
    }
  });
  G.petEquipBag.splice(idx, 1);
  saveGame();
  var msg = Object.keys(gained).map(function(mat) {
    return PET_EQUIP_MATERIAL_NAMES[mat] + ' x' + gained[mat];
  }).join(', ');
  showToast('♻️ 分解获得：' + (msg || '无材料'), 'success');
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('petequip_decomp', 1);
  if (typeof render === 'function') render();
}

// 需求2：PET_EQUIP_CRAFT_RATES/RECIPES/GRADES 已在 config.js 中定义（按 low/mid/high 等级）
// 根据打造等级（low/mid/high）的概率决定产出品质
function rollCraftRarity(grade) {
  var rates = PET_EQUIP_CRAFT_RATES[grade];
  if (!rates) return 'rare';
  var roll = Math.random();
  var acc = 0;
  for (var r in rates) {
    acc += rates[r];
    if (roll < acc) return r;
  }
  return Object.keys(rates)[0];
}

// 打造宠物装备：选择栏位 + 选择打造等级
// 需求2：栏位由玩家选择（attack/hp/defense），打造等级由玩家选择（low/mid/high）
function craftPetEquip(slot, grade) {
  if (!slot || PET_EQUIP_SLOTS.findIndex(function(s) { return s.id === slot; }) < 0) {
    showToast('请选择打造栏位', 'error'); return;
  }
  if (PET_EQUIP_CRAFT_GRADES.indexOf(grade) < 0) {
    showToast('请选择打造等级', 'error'); return;
  }
  var recipe = PET_EQUIP_CRAFT_RECIPES[grade];
  if (!recipe) { showToast('配方不存在', 'error'); return; }
  // 检查材料
  for (var mat in recipe) {
    if (mat === 'gold') continue;
    if ((G.petEquipMaterials[mat] || 0) < recipe[mat]) {
      showToast(PET_EQUIP_MATERIAL_NAMES[mat] + ' 不足', 'error');
      return;
    }
  }
  if (G.player.gold < recipe.gold) {
    showToast('金币不足（需要 ' + recipe.gold + ' 金币）', 'error');
    return;
  }
  // 扣除材料和金币
  for (var mat2 in recipe) {
    if (mat2 === 'gold') {
      G.player.gold -= recipe.gold;
    } else {
      G.petEquipMaterials[mat2] -= recipe[mat2];
    }
  }
  // 根据打造等级概率决定产出品质
  var outputRarity = rollCraftRarity(grade);
  // 生成装备：使用玩家选择的栏位
  var equip = generatePetEquip(outputRarity, slot, G.player.level);
  addPetEquipToBag(equip);
  saveGame();
  var rarityIdx = PET_EQUIP_RARITIES.indexOf(outputRarity);
  var slotInfo = PET_EQUIP_SLOTS.find(function(s) { return s.id === slot; });
  showToast('🔨 ' + PET_EQUIP_CRAFT_GRADE_NAMES[grade] + ' 成功！获得 ' + PET_EQUIP_RARITY_NAMES[rarityIdx] + ' ' + (slotInfo ? slotInfo.name : '') + ' ' + equip.name, 'success');
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('petequip_craft', 1);
  if (typeof render === 'function') render();
}

// 出售宠物装备：按品质给金币
function sellPetEquip(equipId) {
  var idx = G.petEquipBag.findIndex(function(e) { return e.id === equipId; });
  if (idx < 0) return;
  var equip = G.petEquipBag[idx];
  var rarityIdx = PET_EQUIP_RARITIES.indexOf(equip.rarity);
var price = [500, 2000, 8000, 30000][rarityIdx] || 500;
price *= Math.max(1, equip.level || 1);
addGold(price);
  G.petEquipBag.splice(idx, 1);
  saveGame();
  showToast('💰 出售获得 ' + price + ' 金币', 'success');
  if (typeof render === 'function') render();
}

// 批量分解宠物装备：分解指定稀有度及以下的所有装备
function batchDecomposePetEquip(maxRarity) {
  var maxIdx = PET_EQUIP_RARITIES.indexOf(maxRarity);
  if (maxIdx < 0) maxIdx = 0;
  var toDecomp = G.petEquipBag.filter(function(e) {
    return PET_EQUIP_RARITIES.indexOf(e.rarity) <= maxIdx;
  });
  if (toDecomp.length === 0) {
    showToast('没有可分解的装备', 'error');
    return;
  }
  var totalGained = {};
  toDecomp.forEach(function(equip) {
    var yields = PET_EQUIP_DECOMP_YIELD[equip.rarity] || PET_EQUIP_DECOMP_YIELD.rare;
    Object.keys(yields).forEach(function(mat) {
      var range = yields[mat];
      var count = randomInt(range[0], range[1]);
      if (count > 0) {
        G.petEquipMaterials[mat] = (G.petEquipMaterials[mat] || 0) + count;
        totalGained[mat] = (totalGained[mat] || 0) + count;
      }
    });
  });
  // 从背包中移除已分解的装备
  var toRemoveIds = new Set(toDecomp.map(function(e) { return e.id; }));
  G.petEquipBag = G.petEquipBag.filter(function(e) { return !toRemoveIds.has(e.id); });
  saveGame();
  var msg = Object.keys(totalGained).map(function(mat) {
    return PET_EQUIP_MATERIAL_NAMES[mat] + ' x' + totalGained[mat];
  }).join(', ');
  showToast('♻️ 批量分解 ' + toDecomp.length + ' 件装备，获得：' + (msg || '无材料'), 'success');
  if (typeof updateDailyTask === 'function') updateDailyTask('petequip_decomp', toDecomp.length);
  if (typeof render === 'function') render();
}

// 批量出售宠物装备：出售指定稀有度及以下的所有装备
function batchSellPetEquip(maxRarity) {
  var maxIdx = PET_EQUIP_RARITIES.indexOf(maxRarity);
  if (maxIdx < 0) maxIdx = 0;
  var toSell = G.petEquipBag.filter(function(e) {
    return PET_EQUIP_RARITIES.indexOf(e.rarity) <= maxIdx;
  });
  if (toSell.length === 0) {
    showToast('没有可出售的装备', 'error');
    return;
  }
  var totalGold = 0;
  toSell.forEach(function(equip) {
    var rarityIdx = PET_EQUIP_RARITIES.indexOf(equip.rarity);
var price = [500, 2000, 8000, 30000][rarityIdx] || 500;
price *= Math.max(1, equip.level || 1);
totalGold += price;
  });
  addGold(totalGold);
  var toRemoveIds = new Set(toSell.map(function(e) { return e.id; }));
  G.petEquipBag = G.petEquipBag.filter(function(e) { return !toRemoveIds.has(e.id); });
  saveGame();
  showToast('💰 批量出售 ' + toSell.length + ' 件装备，获得 ' + totalGold + ' 金币', 'success');
  if (typeof render === 'function') render();
}

// 需求5：获取宠物装备解封比例（0~1）
// 转生后装备属性按 人物等级/装备等级 比例解封
// 例：100级装备，人物1级时属性为1%，人物5级时5%，人物50级时50%，人物100级时100%
// 资质/成长/技能不受此影响
function getPetEquipUnsealRatio(equip) {
  if (!equip || !equip.sealed) return 1;
  var playerLevel = (G.player && G.player.level) || 1;
  var equipLevel = equip.sealedLevel || equip.level || 1;
  // 比例 = 人物等级 / 装备等级，最高100%
  var ratio = Math.min(1, playerLevel / equipLevel);
  // 至少1%
  return Math.max(0.01, ratio);
}

// 计算宠物装备加成（含套装效果）
// 返回 { statAdditions, aptAdditions, growthAddition, setBonuses, skillAdditions }
function getPetEquipBonus(pet) {
  var result = {
    statAdditions: { 力量:0, 体质:0, 敏捷:0, 智力:0, 气血:0, 攻击力:0, 防御力:0, 速度:0 },
    aptAdditions: { 力量资质:0, 体质资质:0, 敏捷资质:0, 智力资质:0 },
    growthAddition: 0,
    setBonuses: {},
    skillAdditions: [],
  };
  if (!pet || !pet.petEquipment) return result;
  // 收集套装计数
  var setCounts = {};
  // 需求5：收集每个套装的最低解封比例（取套装内所有装备的最小值）
  var setMinRatio = {};
  // 遍历3个装备栏
  ['attack', 'hp', 'defense'].forEach(function(slot) {
    var equip = pet.petEquipment[slot];
    if (!equip) return;
    // 套装计数
    if (equip.setId) {
      setCounts[equip.setId] = (setCounts[equip.setId] || 0) + 1;
    }
    // 需求5：封印解封比例（仅影响属性类词条，不影响资质/成长/技能）
    var unsealRatio = getPetEquipUnsealRatio(equip);
    // 记录套装最低解封比例
    if (equip.setId) {
      if (setMinRatio[equip.setId] === undefined || unsealRatio < setMinRatio[equip.setId]) {
        setMinRatio[equip.setId] = unsealRatio;
      }
    }
    // 随机词条加成
    (equip.affixes || []).forEach(function(a) {
      var affixDef = PET_AFFIX_TYPES.find(function(t) { return t.id === a.id; });
      if (!affixDef) return;
      if (affixDef.kind === 'stat') {
        // 属性类词条受封印影响
        result.statAdditions[affixDef.stat] = (result.statAdditions[affixDef.stat] || 0) + Math.floor(a.value * unsealRatio);
      } else if (affixDef.kind === 'aptitude') {
        // 资质不受封印影响
        result.aptAdditions[affixDef.stat] = (result.aptAdditions[affixDef.stat] || 0) + a.value;
      } else if (affixDef.kind === 'growth') {
        // 成长不受封印影响
        result.growthAddition += a.value;
      } else if (affixDef.kind === 'skill') {
        // 需求8：技能词条不受封印影响，装备时附加对应技能（不占6格上限）
        var skillId = a.value;
        if (skillId && typeof ALL_SKILLS !== 'undefined') {
          var skill = ALL_SKILLS.find(function(s) { return s.id === skillId; });
          if (skill) {
            // 推送完整技能对象（含effect/tier等），并标记为装备技能
            result.skillAdditions.push(Object.assign({}, skill, { isEquipSkill: true }));
          }
        }
      }
    });
  });
  // 套装加成：1件/3件
  // 需求9：同时记录 setProgress 用于右侧套装进度展示
  result.setProgress = {};
  Object.keys(setCounts).forEach(function(setId) {
    var setDef = PET_EQUIP_SETS.find(function(s) { return s.id === setId; });
    if (!setDef) return;
    var count = setCounts[setId];
    // 需求5：套装属性也受封印影响（取套装内最低解封比例）
    var setRatio = setMinRatio[setId] !== undefined ? setMinRatio[setId] : 1;
    if (count >= 3) {
      result.setBonuses[setId] = { count: 3, bonus: scaleSetBonus(setDef.bonus3, setRatio), name: setDef.name, color: setDef.color, sealedRatio: setRatio };
    } else if (count >= 1) {
      result.setBonuses[setId] = { count: 1, bonus: scaleSetBonus(setDef.bonus, setRatio), name: setDef.name, color: setDef.color, sealedRatio: setRatio };
    }
    // 需求9：记录进度（含未达3件的套装）
    result.setProgress[setId] = { count: count, threshold: 3, name: setDef.name, color: setDef.color };
  });
  return result;
}

// 需求5：按解封比例缩放套装属性加成
function scaleSetBonus(bonus, ratio) {
  if (!bonus || ratio >= 1) return bonus;
  var scaled = {};
  Object.keys(bonus).forEach(function(k) {
    var v = bonus[k];
    if (typeof v === 'number') scaled[k] = v * ratio;
    else scaled[k] = v;
  });
  return scaled;
}

// ==================== 阵法系统 ====================
// 阵法书道具ID格式: formation_book_<formationId>
function getFormationBookId(formationId) {
  return FORMATION_BOOK_PREFIX + formationId;
}

// 获取阵法书在 inventory 中的数量
function getFormationBookCount(formationId) {
  var id = getFormationBookId(formationId);
  var item = G.inventory.find(function(i) { return i.id === id; });
  return item ? item.count : 0;
}

// ==================== 装备打孔系统（需求7） ====================
// 最大孔洞数
const MAX_GEM_SLOTS = 3;
// 打孔成功率：0孔→1孔80%，1孔→2孔50%，2孔→3孔20%
const SOCKET_SUCCESS_RATES = [0.80, 0.50, 0.20];

// 查找装备（可查找已装备或背包中的装备）
// 返回 { item, location: 'equipment'|'bag', slotOrIdx }
function findEquipmentById(equipId) {
  if (!equipId) return null;
  // 查找已装备
  if (G.player && G.player.equipment) {
    var slots = Object.keys(G.player.equipment);
    for (var i = 0; i < slots.length; i++) {
      var it = G.player.equipment[slots[i]];
      if (it && it.id === equipId) return { item: it, location: 'equipment', slotOrIdx: slots[i] };
    }
  }
  // 查找背包
  if (G.equipmentBag) {
    for (var j = 0; j < G.equipmentBag.length; j++) {
      if (G.equipmentBag[j] && G.equipmentBag[j].id === equipId) return { item: G.equipmentBag[j], location: 'bag', slotOrIdx: j };
    }
  }
  return null;
}

// 为装备打孔（消耗1个打孔钉）
function socketEquipment(equipId) {
  var found = findEquipmentById(equipId);
  if (!found) { showToast('❌ 未找到装备', 'error'); return; }
  var item = found.item;
  // 确保装备有 gemSlots 字段
  if (!Array.isArray(item.gemSlots)) item.gemSlots = [];
  var currentSlots = item.gemSlots.length;
  if (currentSlots >= MAX_GEM_SLOTS) {
    showToast('❌ 该装备孔洞已满（' + MAX_GEM_SLOTS + '/' + MAX_GEM_SLOTS + '）', 'error');
    return;
  }
  // 检查打孔钉
  var nail = G.inventory.find(function(i) { return i.id === 'socket_nail'; });
  if (!nail || nail.count < 1) {
    showToast('❌ 需要1个打孔钉', 'error');
    return;
  }
  // 扣除打孔钉
  nail.count -= 1;
  if (nail.count <= 0) {
    var idx = G.inventory.indexOf(nail);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  // 计算成功率
  var rate = SOCKET_SUCCESS_RATES[currentSlots] || 0;
  var roll = Math.random();
  if (roll < rate) {
    // 成功：添加一个新孔，类型从该槽位可用的宝石类型中随机
    var slotId = item.slot;
    var validGems = (typeof getGemsForSlot === 'function') ? getGemsForSlot(slotId) : null;
    var newType;
    if (validGems && validGems.length > 0) {
      newType = validGems[Math.floor(Math.random() * validGems.length)].id;
    } else {
      // 兜底：随机一种
      var allTypes = ['hp', 'mp', 'vit', 'str', 'agi', 'int'];
      newType = allTypes[Math.floor(Math.random() * allTypes.length)];
    }
    item.gemSlots.push({ type: newType, gem: null });
    saveGame();
    showToast('🔨 打孔成功！当前孔洞 ' + item.gemSlots.length + '/' + MAX_GEM_SLOTS, 'success');
  } else {
    saveGame();
    showToast('💔 打孔失败…孔洞数不变（' + currentSlots + '/' + MAX_GEM_SLOTS + '）', 'error');
  }
  // 需求3：每日任务追踪（无论成功失败都算1次）
  if (typeof updateDailyTask === 'function') updateDailyTask('socket_drill', 1);
  if (typeof render === 'function') render();
}

// 重置装备孔洞（消耗1个修补胶，已镶嵌宝石返还背包）
function resetSockets(equipId) {
  var found = findEquipmentById(equipId);
  if (!found) { showToast('❌ 未找到装备', 'error'); return; }
  var item = found.item;
  if (!Array.isArray(item.gemSlots) || item.gemSlots.length === 0) {
    showToast('❌ 该装备没有孔洞可重置', 'error');
    return;
  }
  // 检查修补胶
  var glue = G.inventory.find(function(i) { return i.id === 'repair_glue'; });
  if (!glue || glue.count < 1) {
    showToast('❌ 需要1个修补胶', 'error');
    return;
  }
  // 二次确认
  if (!window._confirmResetSockets) {
    window._confirmResetSockets = equipId;
    showToast('⚠️ 再次点击确认重置：所有孔洞清零，已镶嵌宝石将返还背包', 'info');
    setTimeout(function() { window._confirmResetSockets = null; }, 3000);
    return;
  }
  if (window._confirmResetSockets !== equipId) {
    window._confirmResetSockets = equipId;
    showToast('⚠️ 再次点击确认重置', 'info');
    setTimeout(function() { window._confirmResetSockets = null; }, 3000);
    return;
  }
  window._confirmResetSockets = null;
  // 扣除修补胶
  glue.count -= 1;
  if (glue.count <= 0) {
    var idx = G.inventory.indexOf(glue);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  // 返还已镶嵌宝石
  var returned = 0;
  item.gemSlots.forEach(function(gs) {
    if (gs.gem && gs.gem.level > 0) {
      if (typeof addGemToBag === 'function') {
        addGemToBag(gs.gem.type, gs.gem.level, 1);
      }
      returned++;
    }
  });
  // 清零孔洞
  item.gemSlots = [];
  saveGame();
  showToast('🩹 孔洞已重置！' + (returned > 0 ? '返还宝石×' + returned : '无宝石返还'), 'success');
  if (typeof render === 'function') render();
}

// ==================== 装备洗练系统（45级开启） ====================

// 洗练金币消耗：装备等级 × 200
function getRefineGoldCost(item) {
  return (item.level || 1) * 200;
}

// 洗练：重新随机装备所有词条（消耗1个洗练石 + 金币）
// 需求4：支持单一词条定向刷新——传入 affixIndex 时仅刷新指定词条，其余保持不变
function refineEquipment(equipId, affixIndex) {
  // 等级检查
  if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('equip_refine')) {
    showToast('🔒 需要' + getFeatureUnlockLevel('equip_refine') + '级解锁装备洗练', 'error');
    return;
  }
  var found = findEquipmentById(equipId);
  if (!found) { showToast('❌ 未找到装备', 'error'); return; }
  var item = found.item;
  // 必须有词条才能洗练
  if (!item.affixes || item.affixes.length === 0) {
    showToast('❌ 该装备没有词条可洗练', 'error');
    return;
  }
  // 需求4：定向刷新模式校验
  var isSingleMode = (affixIndex !== undefined && affixIndex !== null && affixIndex >= 0 && affixIndex < item.affixes.length);
  // 检查洗练石
  var stone = G.inventory.find(function(i) { return i.id === 'refine_stone'; });
  if (!stone || stone.count < 1) {
    showToast('❌ 需要1个洗练石', 'error');
    return;
  }
  // 检查金币（定向刷新消耗为全额的60%）
  var goldCost = isSingleMode ? Math.floor(getRefineGoldCost(item) * 0.6) : getRefineGoldCost(item);
  if (G.player.gold < goldCost) {
    showToast('❌ 金币不足，需要 ' + goldCost.toLocaleString() + ' 金币', 'error');
    return;
  }
  // 扣除洗练石和金币
  stone.count -= 1;
  if (stone.count <= 0) {
    var idx = G.inventory.indexOf(stone);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  G.player.gold -= goldCost;

  var level = item.level || 1;
  var isOrange = item.rarity === 'orange';

  // 需求4：定向刷新——仅刷新指定词条，其余保持不变
  if (isSingleMode) {
    // 收集已有词条ID（排除要刷新的那个）
    var usedIdsSingle = {};
    item.affixes.forEach(function(a, i) { if (i !== affixIndex) usedIdsSingle[a.id] = true; });
    // 随机新词条（排除已有词条）
    var newAffix = null;
    var attempts = 0;
    do {
      newAffix = pickRandom(AFFIX_TYPES);
      attempts++;
    } while (usedIdsSingle[newAffix.id] && attempts < 30);
    var val = newAffix.id.endsWith('_pct') ? randomFloat(0.03, 0.12) :
              newAffix.id === 'crit_rate' || newAffix.id === 'dodge_rate' ? randomFloat(0.02, 0.08) :
              newAffix.id === 'pet_dmg' || newAffix.id === 'pet_def' || newAffix.id === 'pet_hp' ? randomFloat(0.05, 0.15) :
              randomInt(level, level * 3);
    // 如果原词条是特殊词条，新词条也尽量保持特殊
    if (item.affixes[affixIndex].special) {
      var specialPoolSingle = AFFIX_TYPES.filter(function(a) { return a.special && !usedIdsSingle[a.id]; });
      if (specialPoolSingle.length > 0) {
        newAffix = pickRandom(specialPoolSingle);
        val = randomFloat(0.05, 0.15);
      }
    }
    item.affixes[affixIndex] = { id: newAffix.id, name: newAffix.name, format: newAffix.format, value: Math.round(val * 100) / 100, special: newAffix.special || false };
    saveGame();
    showToast('✨ 定向洗练成功！第' + (affixIndex + 1) + '条词条已刷新（消耗 ' + goldCost.toLocaleString() + ' 金币）', 'success');
    if (typeof render === 'function') render();
    return;
  }

  // 全部洗练模式（原逻辑）
  var affixCount = item.affixes.length;
  var newAffixes = [];
  var usedAffixIds = {};

  for (var i = 0; i < affixCount; i++) {
    var affix = null;
    var attempts = 0;
    do {
      affix = pickRandom(AFFIX_TYPES);
      attempts++;
    } while (usedAffixIds[affix.id] && attempts < 30);
    usedAffixIds[affix.id] = true;
    var val = affix.id.endsWith('_pct') ? randomFloat(0.03, 0.12) :
              affix.id === 'crit_rate' || affix.id === 'dodge_rate' ? randomFloat(0.02, 0.08) :
              affix.id === 'pet_dmg' || affix.id === 'pet_def' || affix.id === 'pet_hp' ? randomFloat(0.05, 0.15) :
              randomInt(level, level * 3);
    newAffixes.push({ id: affix.id, name: affix.name, format: affix.format, value: Math.round(val * 100) / 100, special: affix.special || false });
  }

  // 橙色装备保持特殊词条（pet_dmg/pet_def/pet_hp）
  if (isOrange && !newAffixes.some(function(a) { return a.special; })) {
    var specialPool = AFFIX_TYPES.filter(function(a) { return a.special && !usedAffixIds[a.id]; });
    if (specialPool.length > 0) {
      for (var j = newAffixes.length - 1; j >= 0; j--) {
        if (!newAffixes[j].special) {
          var sp = pickRandom(specialPool);
          newAffixes[j] = { id: sp.id, name: sp.name, format: sp.format, value: randomFloat(0.05, 0.15), special: true };
          break;
        }
      }
    }
  }

  item.affixes = newAffixes;
  saveGame();
  showToast('✨ 洗练成功！词条已刷新（消耗 ' + goldCost.toLocaleString() + ' 金币）', 'success');
  if (typeof render === 'function') render();
}

// 获取装备孔洞上限
function getMaxGemSlots() {
return MAX_GEM_SLOTS;
}

// ==================== 人物修炼系统（20级开启） ====================
// 需求5：重构修炼系统——不再单纯增加基础属性，而是提供额外伤害加成/减免
// 3种修炼方向：伤害修炼（增加宠物最终结算伤害加成）、抗性修炼（最终伤害减免）、辅助修炼（治疗效果加成）
// 计算公式参考：伤害 = 攻击力 * 技能系数 * (1 + 装备宠物伤害加成) * (1 + 修炼等级 * 0.02)

var CULTIVATION_MAX_LEVEL = 50;
var CULTIVATION_PER_LEVEL_BONUS = 0.02; // 每级+2%加成
var CULTIVATION_TYPES = ['伤害', '抗性', '辅助'];
var CULTIVATION_TYPE_NAMES = {
  '伤害': '伤害修炼',
  '抗性': '抗性修炼',
  '辅助': '辅助修炼',
};
var CULTIVATION_TYPE_DESCS = {
  '伤害': '增加宠物最终结算伤害加成（每级+2%伤害）',
  '抗性': '提供最终伤害减免（每级+2%减伤）',
  '辅助': '提升治疗效果加成（每级+2%治疗）',
};
var CULTIVATION_TYPE_ICONS = { '伤害': '⚔️', '抗性': '🛡️', '辅助': '💚' };

// 修炼金币消耗公式：随等级递增
function getCultivationGoldCost(currentLevel) {
  var lv = currentLevel || 0;
  if (lv < 10) return (lv + 1) * 2000;       // 1-10级：2000~20000
  if (lv < 20) return (lv + 1) * 5000;       // 11-20级：55000~105000
  if (lv < 30) return (lv + 1) * 10000;      // 21-30级：210000~310000
  if (lv < 40) return (lv + 1) * 20000;      // 31-40级：620000~820000
  return (lv + 1) * 50000;                    // 41-50级：2050000~2550000
}

// 获取修炼总加成（用于战斗计算）
// 返回 { dmgBonus, dmgReduce, healBonus } 均为小数百分比
function getCultivationBonus() {
  if (!G.player.cultivation) G.player.cultivation = { 伤害: 0, 抗性: 0, 辅助: 0 };
  var c = G.player.cultivation;
  return {
    dmgBonus: (c.伤害 || 0) * CULTIVATION_PER_LEVEL_BONUS,
    dmgReduce: (c.抗性 || 0) * CULTIVATION_PER_LEVEL_BONUS,
    healBonus: (c.辅助 || 0) * CULTIVATION_PER_LEVEL_BONUS,
  };
}

// 旧版四维修炼兼容迁移
function migrateCultivationSystem() {
  if (!G.player.cultivation) { G.player.cultivation = { 伤害: 0, 抗性: 0, 辅助: 0 }; return; }
  var c = G.player.cultivation;
  // 检测旧版四维属性
  if (c.力量 !== undefined || c.体质 !== undefined || c.敏捷 !== undefined || c.智力 !== undefined) {
    var oldTotal = (c.力量 || 0) + (c.体质 || 0) + (c.敏捷 || 0) + (c.智力 || 0);
    // 将旧四维总等级按比例转换为新系统
    G.player.cultivation = {
      伤害: Math.floor(oldTotal * 0.4),
      抗性: Math.floor(oldTotal * 0.4),
      辅助: Math.floor(oldTotal * 0.2),
    };
  }
}

// 修炼属性
function cultivateAttribute(attr) {
  // 等级检查
  if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('cultivation')) {
    showToast('🔒 需要' + getFeatureUnlockLevel('cultivation') + '级解锁人物修炼', 'error');
    return;
  }
  if (CULTIVATION_TYPES.indexOf(attr) < 0) {
    showToast('❌ 无效的修炼方向', 'error');
    return;
  }
  if (!G.player.cultivation) G.player.cultivation = { 伤害: 0, 抗性: 0, 辅助: 0 };
  var currentLv = G.player.cultivation[attr] || 0;
  if (currentLv >= CULTIVATION_MAX_LEVEL) {
    showToast('✅ ' + CULTIVATION_TYPE_NAMES[attr] + '已满级（' + CULTIVATION_MAX_LEVEL + '级）', 'info');
    return;
  }
  var goldCost = getCultivationGoldCost(currentLv);
  if (G.player.gold < goldCost) {
    showToast('❌ 金币不足，需要 ' + goldCost.toLocaleString() + ' 金币', 'error');
    return;
  }
  G.player.gold -= goldCost;
  G.player.cultivation[attr] = currentLv + 1;
  saveGame();
  var newLv = G.player.cultivation[attr];
  var bonusPct = (newLv * CULTIVATION_PER_LEVEL_BONUS * 100).toFixed(0);
  showToast('🌀 ' + CULTIVATION_TYPE_NAMES[attr] + '提升至 ' + newLv + ' 级！当前加成：' + bonusPct + '%（消耗 ' + goldCost.toLocaleString() + ' 金币）', 'success');
  if (typeof render === 'function') render();
}

// 一键修炼（连续修炼直到金币不足或满级）
function cultivateMax(attr) {
  if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('cultivation')) {
    showToast('🔒 需要' + getFeatureUnlockLevel('cultivation') + '级解锁人物修炼', 'error');
    return;
  }
  if (CULTIVATION_TYPES.indexOf(attr) < 0) return;
  if (!G.player.cultivation) G.player.cultivation = { 伤害: 0, 抗性: 0, 辅助: 0 };
  var count = 0;
  var totalGold = 0;
  while (G.player.cultivation[attr] < CULTIVATION_MAX_LEVEL) {
    var lv = G.player.cultivation[attr];
    var cost = getCultivationGoldCost(lv);
    if (G.player.gold < cost) break;
    G.player.gold -= cost;
    G.player.cultivation[attr] = lv + 1;
    totalGold += cost;
    count++;
    if (count >= 100) break; // 安全阀
  }
  if (count > 0) {
    saveGame();
    var newLv = G.player.cultivation[attr];
    showToast('🌀 ' + CULTIVATION_TYPE_NAMES[attr] + '连升 ' + count + ' 级！当前等级：' + newLv + '（消耗 ' + totalGold.toLocaleString() + ' 金币）', 'success');
  } else {
    showToast('❌ 金币不足，无法修炼', 'error');
  }
  if (typeof render === 'function') render();
}


// ==================== 宠物进阶系统（需求3） ====================
// 进阶阈值：T3→T6 需要 2000 进阶值（单次进阶）
// 需求7：T3 mid 宠物无幼年体，孵化即为 mid(T3)，单次进阶 mid→top(T6)
const ADVANCE_THRESHOLDS = { 2: 2000 };

// 获取进阶链信息：返回 { chain, nextName, nextStage, threshold } 或 null
// 需求7：仅 mid 名宠物(T3)可进阶到 top(T6)，base 不可进阶，top 已是最终形态
function getPetAdvanceInfo(pet) {
  if (!pet || !pet.name) return null;
  if (typeof PET_ADVANCE_CHAINS === 'undefined') return null;
  var stage = pet.advanceStage || 0;
  if (stage >= 2) return null; // 已是最高阶段(T6)
  // 仅 mid 名宠物可进阶（T3→T6）
  for (var i = 0; i < PET_ADVANCE_CHAINS.length; i++) {
    var c = PET_ADVANCE_CHAINS[i];
    if (c.mid === pet.name) {
      return { chain: c, nextName: c.top, nextStage: 2, threshold: ADVANCE_THRESHOLDS[2] || 2000 };
    }
  }
  return null;
}

// 使用进阶丸：增加宠物进阶值，达到阈值自动进阶
// pillTier: 'low' | 'mid' | 'high'
function useAdvancePill(petId, pillTier) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (!pet.advanceable && (pet.advanceStage || 0) >= 2) {
    showToast('该宠物已达最高进阶阶段', 'error');
    return;
  }
  var advInfo = getPetAdvanceInfo(pet);
  if (!advInfo) {
    showToast('该宠物不可进阶', 'error');
    return;
  }
  // 校验道具
  var pillId = 'advance_pill_' + pillTier;
  var inv = G.inventory.find(function(i) { return i.id === pillId; });
  if (!inv || inv.count <= 0) { showToast('道具不足', 'error'); return; }
  // 进阶值增量
  var gainRange = { low: [10, 30], mid: [50, 100], high: [200, 500] }[pillTier];
  var gain = randomInt(gainRange[0], gainRange[1]);
  // 扣除道具
  inv.count--;
  if (inv.count <= 0) {
    var idx = G.inventory.indexOf(inv);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  pet.advanceValue = (pet.advanceValue || 0) + gain;
  var pillName = { low: '低级进阶丸', mid: '中级进阶丸', high: '高级进阶丸' }[pillTier];
  addBattleLog('loot', '💊 ' + getPetDisplayName(pet) + ' 使用 ' + pillName + '，进阶值 +' + gain + '（当前 ' + pet.advanceValue + '/' + advInfo.threshold + '）');
  // 检查是否达到进阶阈值
  if (pet.advanceValue >= advInfo.threshold) {
    advancePet(pet, advInfo);
  }
  saveGame();
  if (typeof render === 'function') render();
}

// 执行宠物进阶：升级名字、阶段，刷新成长/资质/品质/技能
// 需求14：进阶后的成长/资质基于进阶前数值按系数提升，可突破图鉴上限
function advancePet(pet, advInfo) {
  if (!pet || !advInfo) return;
  var oldName = pet.name;
  var newName = advInfo.nextName;
  var newStage = advInfo.nextStage;
  // 需求14：先捕获进阶前的图鉴范围与数值（用于按系数提升）
  var oldDex = getPetDex(oldName);
  var oldAptRange = oldDex && oldDex.aptRange ? oldDex.aptRange : null;
  var oldGrowthRange = oldDex && oldDex.growthRange ? oldDex.growthRange : null;
  var oldAptitude = {};
  APTITUDE_KEYS.forEach(function(k) { oldAptitude[k] = pet.aptitude[k] || 1500; });
  var oldGrowth = pet.growth || 1.0;
  // 升级名字
  pet.name = newName;
  pet.advanceStage = newStage;
  pet.advanceValue = 0;
  // 需求7/8：T3→T6 进阶系数1.35（资质上限2400，成长按T6级）
  var advanceCoeff = 1.35;
  // 进阶后：刷新图鉴并强化成长/资质
  var dex = getPetDex(newName);
  if (dex) {
    // 重置资质：基于进阶前资质在新图鉴范围内的相对位置 × 进阶系数
    if (dex.aptRange) {
      APTITUDE_KEYS.forEach(function(k) {
        var newRange = dex.aptRange[k] || [1500, 2000];
        var oldRange = (oldAptRange && oldAptRange[k]) ? oldAptRange[k] : [newRange[0], newRange[1]];
        var oldVal = oldAptitude[k];
        // 进阶前资质在旧图鉴范围的相对得分（0~1+，>1 表示已突破上限）
        var oldLo = oldRange[0], oldHi = oldRange[1];
        var oldSpan = Math.max(1, oldHi - oldLo);
        var oldScore = (oldVal - oldLo) / oldSpan; // 可能 >1
        // 应用进阶系数：得分 × 系数 → 新资质（可突破新图鉴上限）
        var newLo = newRange[0], newHi = newRange[1];
        var newSpan = Math.max(1, newHi - newLo);
        var newScore = oldScore * advanceCoeff;
        // 微随机扰动 ±5%（避免完全确定）
        newScore = newScore * (0.95 + Math.random() * 0.10);
        var newVal = Math.floor(newLo + newSpan * newScore);
        // 需求8：T3进阶宠(top/T6)资质上限2400，T2进阶宠(mid/T3)资质上限1800
        var aptCeiling = (newStage === 2) ? 2400 : 1800;
        // 允许小幅突破图鉴上限但不超过资质天花板
        newVal = Math.min(aptCeiling, Math.max(newLo, newVal));
        pet.aptitude[k] = newVal;
      });
    }
    // 重置成长：基于进阶前成长在新图鉴范围内的相对位置 × 进阶系数
    if (dex.growthRange) {
      var gNewMin = dex.growthRange[0], gNewMax = dex.growthRange[1];
      var gOldMin = oldGrowthRange ? oldGrowthRange[0] : gNewMin;
      var gOldMax = oldGrowthRange ? oldGrowthRange[1] : gNewMax;
      var gOldSpan = Math.max(0.01, gOldMax - gOldMin);
      var gOldScore = (oldGrowth - gOldMin) / gOldSpan; // 0~1+
      var gNewSpan = Math.max(0.01, gNewMax - gNewMin);
      var gNewScore = gOldScore * advanceCoeff * (0.95 + Math.random() * 0.10);
      var newGrowth = Math.round((gNewMin + gNewSpan * gNewScore) * 100) / 100;
      // 需求7：T6进阶宠成长上限4.5（T6级成长比T5更高）
      var growthCeiling = (newStage === 2) ? 4.5 : 3.0;
      newGrowth = Math.min(growthCeiling, Math.max(gNewMin, newGrowth));
      pet.growth = newGrowth;
    }
    // 刷新技能：进阶后按新图鉴的天生技能列表重置（保留已学技能）
    if (dex.innateSkills && dex.innateSkills.length > 0) {
      var usedBaseIds = new Set();
      var newInnate = [];
      dex.innateSkills.forEach(function(sid) {
        var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
        if (sk && !usedBaseIds.has(getSkillBaseId(sid))) {
          newInnate.push({ ...sk, isInnate: true });
          usedBaseIds.add(getSkillBaseId(sid));
        }
      });
      // 保留宠物原有非天生技能（learnedSkills 不变）
      pet.innateSkills = newInnate;
    }
    // 同步种族
    if (dex.race) pet.race = dex.race;
  }
  // 重新计算品质
  if (typeof recalcRarity === 'function') recalcRarity(pet);
  // 进阶宠标记为不可再进阶（除非还有下一阶段）
  var nextAdvInfo = getPetAdvanceInfo(pet);
  pet.advanceable = !!nextAdvInfo;
  addBattleLog('loot', '✨ ' + oldName + ' 进化为 ' + newName + '！（进阶+' + newStage + '，系数×' + advanceCoeff + '）');
  showToast('✨ 进化成功！' + oldName + ' → ' + newName, 'success');
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('pet_advance', 1);
}

// 进阶试炼活动（替换血统试炼，按战力10档奖励进阶丸）
function startAdvanceTrial() {
  var today = new Date().toDateString();
  if (G.advanceTrialUsed && G.advanceTrialUsed[today]) {
    showToast('今日已完成进阶试炼', 'error');
    return;
  }
  if (G.player.level < ADVANCE_TRIAL.minLevel) {
    showToast('需要 Lv.' + ADVANCE_TRIAL.minLevel + ' 解锁进阶试炼', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  var cp = Math.floor(getPlayerCombatPower());
  // 找到最高档（战力满足的最大档）
  var tier = ADVANCE_TRIAL.tiers[0];
  for (var i = 0; i < ADVANCE_TRIAL.tiers.length; i++) {
    if (cp >= ADVANCE_TRIAL.tiers[i].cpMin) tier = ADVANCE_TRIAL.tiers[i];
  }
  // 发放奖励
  var pillId = tier.pill;
  var pillName = { advance_pill_low: '低级进阶丸', advance_pill_mid: '中级进阶丸', advance_pill_high: '高级进阶丸' }[pillId];
  var existing = G.inventory.find(function(i) { return i.id === pillId; });
  if (existing) existing.count += tier.count;
  else G.inventory.push({ id: pillId, count: tier.count });
  if (!G.advanceTrialUsed) G.advanceTrialUsed = {};
  G.advanceTrialUsed[today] = true;
  // 经验和金币奖励
  addExp(500 + G.player.level * 20);
  addGold(1000 + G.player.level * 50);
  saveGame();
  showToast('⚔️ 进阶试炼完成！战力 ' + cp.toLocaleString() + ' 达到第 ' + (ADVANCE_TRIAL.tiers.indexOf(tier) + 1) + ' 档，获得 ' + pillName + ' ×' + tier.count, 'success');
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('advance_trial', 1);
  // 需求6：进阶试炼收获日志
  if (typeof addActivityLog === 'function') {
    addActivityLog('advance', '进阶试炼完成：战力 ' + cp.toLocaleString() + '，达到第 ' + (ADVANCE_TRIAL.tiers.indexOf(tier) + 1) + ' 档，获得 ' + pillName + ' ×' + tier.count + '，金币 +' + (1000 + G.player.level * 50), 'win');
  }
  if (typeof render === 'function') render();
}

// 添加阵法书到背包
function addFormationBook(formationId, count) {
  if (!count) count = 1;
  var id = getFormationBookId(formationId);
  var existing = G.inventory.find(function(i) { return i.id === id; });
  if (existing) existing.count += count;
  else G.inventory.push({ id: id, count: count });
}

// 学习阵法（消耗1本对应阵法书）
function learnFormation(formationId) {
  var formDef = FORMATIONS.find(function(f) { return f.id === formationId; });
  if (!formDef) { showToast('阵法不存在', 'error'); return; }
  if (G.formations[formationId]) {
    showToast('已学习过此阵法，请使用升级功能', 'error');
    return;
  }
  if (getFormationBookCount(formationId) < 1) {
    showToast('需要1本「' + formDef.name + '书」', 'error');
    return;
  }
  // 扣除阵法书
  var id = getFormationBookId(formationId);
  var item = G.inventory.find(function(i) { return i.id === id; });
  item.count -= 1;
  if (item.count <= 0) {
    var idx = G.inventory.indexOf(item);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  // 学习：1级，0经验
  G.formations[formationId] = { level: 1, exp: 0 };
  // 自动激活首学的阵法
  if (!G.activeFormation) G.activeFormation = formationId;
  saveGame();
  showToast('📜 已学习阵法：' + formDef.name + '（Lv.1）', 'success');
  if (typeof render === 'function') render();
}

// 升级阵法：吃相同阵法书+1经验，达到阈值升级，满级5
function upgradeFormation(formationId) {
  var formDef = FORMATIONS.find(function(f) { return f.id === formationId; });
  if (!formDef) { showToast('阵法不存在', 'error'); return; }
  var f = G.formations[formationId];
  if (!f) { showToast('请先学习此阵法', 'error'); return; }
  if (f.level >= FORMATION_MAX_LEVEL) {
    showToast('该阵法已满级', 'error');
    return;
  }
  if (getFormationBookCount(formationId) < 1) {
    showToast('需要1本「' + formDef.name + '书」升级', 'error');
    return;
  }
  // 扣除阵法书
  var id = getFormationBookId(formationId);
  var item = G.inventory.find(function(i) { return i.id === id; });
  item.count -= 1;
  if (item.count <= 0) {
    var idx = G.inventory.indexOf(item);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  // +1 经验
  f.exp = (f.exp || 0) + 1;
  // 检查升级
  var need = getFormationExpForLevel(f.level); // 升级所需经验
  while (f.level < FORMATION_MAX_LEVEL && f.exp >= need) {
    f.exp -= need;
    f.level += 1;
    showToast('⚡ 「' + formDef.name + '」升级！Lv.' + f.level, 'success');
    if (f.level >= FORMATION_MAX_LEVEL) { f.exp = 0; break; }
    need = getFormationExpForLevel(f.level);
  }
  saveGame();
  if (typeof render === 'function') render();
}

// 批量升级：连续使用所有可用阵法书
function upgradeFormationMax(formationId) {
  var formDef = FORMATIONS.find(function(f) { return f.id === formationId; });
  if (!formDef) return;
  var f = G.formations[formationId];
  if (!f) { showToast('请先学习此阵法', 'error'); return; }
  if (f.level >= FORMATION_MAX_LEVEL) {
    showToast('该阵法已满级', 'error');
    return;
  }
  var used = 0;
  while (f.level < FORMATION_MAX_LEVEL) {
    var need = getFormationExpForLevel(f.level) - (f.exp || 0);
    if (getFormationBookCount(formationId) < 1) break;
    if (getFormationBookCount(formationId) < need && used === 0) {
      // 一本都不够升级，至少消耗1本
      upgradeFormation(formationId);
      return;
    }
    // 消耗1本
    var id = getFormationBookId(formationId);
    var item = G.inventory.find(function(i) { return i.id === id; });
    item.count -= 1;
    if (item.count <= 0) {
      var idx = G.inventory.indexOf(item);
      if (idx >= 0) G.inventory.splice(idx, 1);
    }
    f.exp = (f.exp || 0) + 1;
    used++;
    if (f.exp >= getFormationExpForLevel(f.level)) {
      f.exp -= getFormationExpForLevel(f.level);
      f.level += 1;
      showToast('⚡ 「' + formDef.name + '」升级！Lv.' + f.level, 'success');
      if (f.level >= FORMATION_MAX_LEVEL) { f.exp = 0; break; }
    }
    if (used > 100) break; // 安全上限
  }
  if (used === 0) showToast('阵法书数量不足', 'error');
  else { saveGame(); if (typeof render === 'function') render(); }
}

// 设置当前激活阵法
function setActiveFormation(formationId) {
  if (formationId && !G.formations[formationId]) {
    showToast('未学习该阵法', 'error');
    return;
  }
  G.activeFormation = formationId || null;
  saveGame();
  showToast('🎴 已切换阵法', 'info');
  if (typeof render === 'function') render();
}

// 计算宠物在某阵法位置获得的加成
// pos: 'front' / 'mid' / 'back'
// 返回 { atkPct, defPct, hpPct, spdPct, intPct, critRate, critDmg, dodgeRate, hitRate, dmgReduce, magicDmgPct, mpPct, allPct }
function getFormationBonusForPos(pos) {
  var result = { atkPct:0, defPct:0, hpPct:0, spdPct:0, intPct:0, critRate:0, critDmg:0, dodgeRate:0, hitRate:0, dmgReduce:0, magicDmgPct:0, mpPct:0, allPct:0 };
  if (!G.activeFormation) return result;
  var f = G.formations[G.activeFormation];
  if (!f) return result;
  var formDef = FORMATIONS.find(function(frm) { return frm.id === G.activeFormation; });
  if (!formDef) return result;
  var posBonus = formDef.bonus[pos];
  if (!posBonus) return result;
  var mult = getFormationLevelMult(f.level);
  Object.keys(posBonus).forEach(function(key) {
    result[key] = (result[key] || 0) + posBonus[key] * mult;
  });
  return result;
}

// 获取宠物在出战队伍中的位置索引（0/1/2），不在队伍返回 -1
function getPetFormationPos(petId) {
  if (!G.player.activeTeam) return -1;
  var idx = G.player.activeTeam.indexOf(petId);
  if (idx < 0) return -1;
  var formation = G.player.formation || ['front','mid','back'];
  return formation[idx] || 'mid';
}

// 阵法活动：阵法修炼，每天1次，获得随机阵法书
function startFormationActivity() {
  var today = new Date().toDateString();
  if (G.formationActivityUsed && G.formationActivityUsed[today]) {
    showToast('今日已挑战阵法修炼', 'error');
    return;
  }
  if (G.player.level < 15) {
    showToast('需要 Lv.15 解锁阵法修炼', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  // 50% 概率获得1本随机阵法书，30%获得2本，15%获得3本，5%获得5本
  var r = Math.random();
  var bookCount = 1;
  if (r < 0.05) bookCount = 5;
  else if (r < 0.20) bookCount = 3;
  else if (r < 0.50) bookCount = 2;
  else bookCount = 1;
  // 随机选择阵法书
  for (var i = 0; i < bookCount; i++) {
    var formDef = pickRandom(FORMATIONS);
    addFormationBook(formDef.id, 1);
  }
  if (!G.formationActivityUsed) G.formationActivityUsed = {};
  G.formationActivityUsed[today] = true;
  saveGame();
  showToast('🎴 阵法修炼完成！获得 ' + bookCount + ' 本阵法书', 'success');
  if (typeof render === 'function') render();
}

// ==================== 阵法押镖活动（需求2）====================

// 阵法碎片：分解阵法
function decomposeFormation(formId) {
  if (!formId || !G.formations[formId]) {
    showToast('该阵法未学习，无法分解', 'error');
    return;
  }
  if (G.activeFormation === formId) {
    showToast('已激活的阵法无法分解，请先切换', 'error');
    return;
  }
  var formDef = FORMATIONS.find(function(f) { return f.id === formId; });
  if (!formDef) { showToast('阵法数据异常', 'error'); return; }
  var learned = G.formations[formId];
  // 分解获得碎片数：基础1个 + 等级×1个
  var fragments = 1 + (learned.level || 1);
  G.formationFragments = (G.formationFragments || 0) + fragments;
  // 退还部分阵法书（已投入的）
  var refundBooks = Math.floor((learned.level || 1) / 2);
  if (refundBooks > 0) addFormationBook(formId, refundBooks);
  delete G.formations[formId];
  saveGame();
  showToast('🔄 分解《' + formDef.name + '》获得 ' + fragments + ' 个阵法碎片' + (refundBooks > 0 ? '，退还 ' + refundBooks + ' 本阵法书' : ''), 'success');
  if (typeof render === 'function') render();
}

// 阵法碎片：合成随机阵法书（5个碎片合成1本）
function synthesizeFormation() {
  if ((G.formationFragments || 0) < 5) {
    showToast('阵法碎片不足，需要5个（当前' + (G.formationFragments || 0) + '个）', 'error');
    return;
  }
  G.formationFragments -= 5;
  var formDef = pickRandom(FORMATIONS);
  addFormationBook(formDef.id, 1);
  saveGame();
  showToast('🎴 合成成功！获得《' + formDef.name + '》阵法书×1', 'success');
  if (typeof render === 'function') render();
}

// 开始押镖
function startFormationEscort() {
  var today = new Date().toDateString();
  if (!G.formationEscortUsed) G.formationEscortUsed = {};
  var usedCount = G.formationEscortUsed[today] || 0;
  if (usedCount >= FORMATION_ESCORT.dailyLimit) {
    showToast('今日押镖次数已用完', 'error');
    return;
  }
  if (G.player.level < FORMATION_ESCORT.minLevel) {
    showToast('需要 Lv.' + FORMATION_ESCORT.minLevel + ' 解锁押镖', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  G.formationEscortProgress = { stage: 1, rewardsEarned: [], failCount: 0 };
  saveGame();
  showToast('🛡️ 押镖开始！护送镖车前进', 'success');
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('formation_escort', 1);
  if (typeof render === 'function') render();
}

// 押镖战斗：通过活动战斗窗口展示，不影响主线挂机
// 需求5：失败3次本次活动完全失败（消耗次数重来），失败不奖励阵法书
// 需求7：战斗画面独立窗口展示，结算保留在当前页面
function startFormationEscortBattle() {
  if (!G.formationEscortProgress || G.formationEscortProgress.stage <= 0) {
    showToast('请先开始押镖', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  var stage = G.formationEscortProgress.stage;
  var playerLv = G.player.level;
  // 模拟战斗：基于队伍战力 vs 怪物强度
  var cp = Math.floor(getPlayerCombatPower());
  var monsterLv = playerLv + stage * 3;
  var monsterPower = monsterLv * 800 * (1 + stage * 0.3);
  // 70% 基础胜率 + 战力差调整
  var winChance = 0.70 + (cp - monsterPower) / Math.max(monsterPower, 1) * 0.5;
  winChance = Math.max(0.20, Math.min(0.95, winChance));
  // 需求7：通过活动战斗窗口展示
  startActivityBattleModal({
    type: 'formation_escort',
    stage: stage,
    enemyName: '第' + stage + '关 · 拦路劫匪',
    enemyIcon: '🗡️',
    enemyLv: monsterLv,
    monsterPower: monsterPower,
    playerCp: cp,
    winChance: winChance,
    onComplete: function(success) { _finishFormationEscortBattle(success, stage); }
  });
}

// 押镖战斗结算（在活动战斗窗口回调中调用）
function _finishFormationEscortBattle(success, stage) {
  var today = new Date().toDateString();
  var playerLv = G.player.level;
  if (!success) {
    // 需求5：失败不奖励阵法书（修复卡 bug 无限失败刷阵法）
    G.formationEscortProgress.failCount = (G.formationEscortProgress.failCount || 0) + 1;
    G.formationEscortProgress.rewardsEarned.push({ stage: stage, type: 'fail' });
    var failsLeft = 3 - G.formationEscortProgress.failCount;
    if (G.formationEscortProgress.failCount >= 3) {
      // 需求5：失败3次，活动完全失败，消耗次数
      showToast('💥 第' + stage + '关战斗失败！累计失败3次，押镖失败！', 'error');
      // 需求7：押镖失败赠送1个阵法碎片
      G.formationFragments = (G.formationFragments || 0) + 1;
      addActivityLog('formation', '第' + stage + '关战斗失败，押镖彻底失败（消耗1次活动次数），获得1个阵法碎片', 'fail');
      if (!G.formationEscortUsed) G.formationEscortUsed = {};
      G.formationEscortUsed[today] = (G.formationEscortUsed[today] || 0) + 1;
      G.formationEscortProgress = null;
      saveGame();
      if (typeof render === 'function') render();
      return;
    }
    showToast('💥 第' + stage + '关战斗失败！剩余失败次数 ' + failsLeft + ' 次', 'error');
    addActivityLog('formation', '第' + stage + '关战斗失败（剩余失败次数 ' + failsLeft + '）', 'fail');
  } else {
    showToast('⚔️ 第' + stage + '关战斗胜利！', 'success');
    var formDef2 = pickRandom(FORMATIONS);
    addFormationBook(formDef2.id, 1);
    G.formationEscortProgress.rewardsEarned.push({ stage: stage, type: 'win', book: formDef2.name });
    addActivityLog('formation', '第' + stage + '关胜利，获得阵法书《' + formDef2.name + '》x1', 'win');
    // 全部完成额外奖励
    if (stage >= FORMATION_ESCORT.stages) {
      var bonusGold = playerLv * 50;
      addGold(bonusGold);
      showToast('🎊 押镖全部完成！额外获得 ' + bonusGold + ' 金币', 'success');
      addActivityLog('formation', '押镖全部完成！额外获得金币 ' + bonusGold + '', 'win');
      // 完成次数+1
      if (!G.formationEscortUsed) G.formationEscortUsed = {};
      G.formationEscortUsed[today] = (G.formationEscortUsed[today] || 0) + 1;
      G.formationEscortProgress = null;
      saveGame();
      if (typeof render === 'function') render();
      return;
    }
    G.formationEscortProgress.stage = stage + 1;
  }
  saveGame();
  if (typeof render === 'function') render();
}

// ==================== 技能秘境挑战活动（需求6）====================
function startSkillBookHunt() {
  var today = new Date().toDateString();
  if (!G.skillBookHuntUsed) G.skillBookHuntUsed = {};
  var usedCount = G.skillBookHuntUsed[today] || 0;
  if (usedCount >= SKILL_BOOK_HUNT.dailyLimit) {
    showToast('今日技能秘境挑战次数已用完', 'error');
    return;
  }
  if (G.player.level < SKILL_BOOK_HUNT.minLevel) {
    showToast('需要 Lv.' + SKILL_BOOK_HUNT.minLevel + ' 解锁', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  G.skillBookHuntProgress = { stage: 1, rewardsEarned: [] };
  saveGame();
  showToast('📚 技能秘境挑战开始！', 'success');
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('skillbook_hunt', 1);
  if (typeof render === 'function') render();
}

// 需求7：技能秘境战斗通过活动战斗窗口展示，不影响主线挂机
function startSkillBookHuntBattle() {
  if (!G.skillBookHuntProgress || G.skillBookHuntProgress.stage <= 0) {
    showToast('请先开始挑战', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  var stage = G.skillBookHuntProgress.stage;
  var cfg = SKILL_BOOK_HUNT.stageConfig[stage - 1];
  var playerLv = G.player.level;
  var cp = Math.floor(getPlayerCombatPower());
  var monsterLv = playerLv + stage * 5;
  var monsterPower = monsterLv * 1200 * cfg.hpMult * (1 + stage * 0.2);
  var winChance = 0.65 + (cp - monsterPower) / Math.max(monsterPower, 1) * 0.5;
  winChance = Math.max(0.15, Math.min(0.95, winChance));
  // 需求7：通过活动战斗窗口展示
  startActivityBattleModal({
    type: 'skill_book_hunt',
    stage: stage,
    enemyName: cfg.name + ' · 秘境守卫',
    enemyIcon: '📚',
    enemyLv: monsterLv,
    monsterPower: monsterPower,
    playerCp: cp,
    winChance: winChance,
    onComplete: function(success) { _finishSkillBookHuntBattle(success, stage, cfg); }
  });
}

// 技能秘境战斗结算（在活动战斗窗口回调中调用）
function _finishSkillBookHuntBattle(success, stage, cfg) {
  if (!success) {
    // 需求5：失败后自动结算退出，消耗当日次数（避免无限重试刷奖励）
    var earnedSoFar = (G.skillBookHuntProgress.rewardsEarned || []).slice();
    var today = new Date().toDateString();
    if (!G.skillBookHuntUsed) G.skillBookHuntUsed = {};
    G.skillBookHuntUsed[today] = (G.skillBookHuntUsed[today] || 0) + 1;
    G.skillBookHuntProgress = null;
    saveGame();
    showToast('💥 第' + stage + '关挑战失败！已自动结算退出（本次活动次数已消耗）' + (earnedSoFar.length ? '，本场共获得 ' + earnedSoFar.length + ' 本技能书' : ''), 'error');
    addActivityLog('skillbook', '第' + stage + '关失败，自动结算退出（消耗1次活动次数）' + (earnedSoFar.length ? '，本场共获得 ' + earnedSoFar.length + ' 本技能书' : ''), 'fail');
    if (typeof render === 'function') render();
    return;
  }
  // 胜利：获得技能书
  var bookPool = [];
  if (stage <= 2) bookPool = ACTIVE_SKILLS.filter(function(s){ return !s.tier || s.tier <= 1; }).concat(PASSIVE_SKILLS.filter(function(s){ return s.tier === 1; }));
  else if (stage <= 4) bookPool = ACTIVE_SKILLS.filter(function(s){ return !s.tier || s.tier <= 2; }).concat(PASSIVE_SKILLS.filter(function(s){ return s.tier <= 2; }));
  else bookPool = PASSIVE_SKILLS.filter(function(s){ return s.tier === 3; }).concat(AURA_SKILLS.filter(function(s){ return s.tier === 3; }));
  if (bookPool.length === 0) bookPool = ACTIVE_SKILLS.concat(PASSIVE_SKILLS);
  var book = pickRandom(bookPool);
  // 多本奖励：阶段越高奖励越多
  var bookCount = Math.floor(cfg.rewardMult);
  for (var i = 0; i < bookCount; i++) {
    var existing = G.skillBooks.find(function(b){ return b.id === book.id; });
    if (existing) existing.count += 1;
    else G.skillBooks.push({ id: book.id, count: 1 });
  }
  G.skillBookHuntProgress.rewardsEarned.push({ stage: stage, book: book.name, count: bookCount });
  showToast('📖 第' + stage + '关胜利！获得 ' + book.name + ' x' + bookCount, 'success');
  addActivityLog('skillbook', '第' + stage + '关胜利，获得技能书《' + book.name + '》x' + bookCount, 'win');
  if (stage >= SKILL_BOOK_HUNT.maxStages) {
    showToast('🎊 全部 5 关挑战完成！', 'success');
    addActivityLog('skillbook', '全部 5 关挑战完成！', 'win');
    var today = new Date().toDateString();
    if (!G.skillBookHuntUsed) G.skillBookHuntUsed = {};
    G.skillBookHuntUsed[today] = (G.skillBookHuntUsed[today] || 0) + 1;
    G.skillBookHuntProgress = null;
  } else {
    G.skillBookHuntProgress.stage = stage + 1;
  }
  saveGame();
  if (typeof render === 'function') render();
}

function endSkillBookHunt() {
  if (!G.skillBookHuntProgress) return;
  var today = new Date().toDateString();
  if (!G.skillBookHuntUsed) G.skillBookHuntUsed = {};
  G.skillBookHuntUsed[today] = (G.skillBookHuntUsed[today] || 0) + 1;
  G.skillBookHuntProgress = null;
  saveGame();
  showToast('📚 已结算退出，今日剩余次数 -1', 'info');
  if (typeof render === 'function') render();
}

// ==================== 宠物秘境活动（需求12）====================
// 需求12：宠物秘境从 DUNGEONS 移到活动页面，每日20次，无需门票
// 复用 enterSpecialDungeon('pet_equip_cave') 进入战斗（该函数已针对 pet_equip_cave 做特殊处理）
function startPetCaveBattle() {
  var today = new Date().toDateString();
  if (!G.petCaveUsed) G.petCaveUsed = {};
  var usedCount = G.petCaveUsed[today] || 0;
  if (usedCount >= 20) {
    showToast('今日宠物秘境次数已用完', 'error');
    return;
  }
  if (G.player.level < 20) {
    showToast('需要 Lv.20 解锁', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  // 先记录次数，再进入战斗（enterSpecialDungeon 已针对 pet_equip_cave 跳过门票和副本次数检查）
  G.petCaveUsed[today] = (G.petCaveUsed[today] || 0) + 1;
  saveGame();
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('petcave_1', 1);
  if (typeof enterSpecialDungeon === 'function') {
    enterSpecialDungeon('pet_equip_cave');
  } else {
    // 回滚次数
    G.petCaveUsed[today] = Math.max(0, (G.petCaveUsed[today] || 0) - 1);
    saveGame();
    showToast('宠物秘境功能暂未实现', 'error');
  }
}

// ==================== 需求7：活动战斗窗口系统 ====================
// 活动战斗在独立窗口中展示，不占用主线 liveBattle，不影响主线挂机
// 通过 window._activityBattle 状态控制模态框显示和回合播放
window._activityBattle = null;
window._activityBattleTimer = null;

// 启动活动战斗模态框
// opts: { type, stage, enemyName, enemyIcon, enemyLv, monsterPower, playerCp, winChance, onComplete(success) }
function startActivityBattleModal(opts) {
  if (!opts) return;
  // 预先决定战斗结果（保留原 winChance 逻辑）
  var winChance = Math.max(0.05, Math.min(0.98, opts.winChance || 0.5));
  var success = Math.random() < winChance;
  // 生成可视化的战斗日志（基于战力推算 HP 和伤害）
  var cp = opts.playerCp || Math.floor(getPlayerCombatPower());
  var monsterPower = opts.monsterPower || (cp * 0.8);
  var team = getTeamPets();
  if (team.length === 0) { showToast('请先设置出战宠物', 'error'); return; }
  // 视觉 HP：宠物 HP = cp/8，敌人 HP = monsterPower/6
  var petMaxHp = Math.max(5000, Math.floor(cp / 8));
  var enemyMaxHp = Math.max(3000, Math.floor(monsterPower / 6));
  var petHp = petMaxHp;
  var enemyHp = enemyMaxHp;
  var logs = [];
  // 模拟回合：胜利5-7回合，失败3-5回合
  var maxTurns = success ? (5 + Math.floor(Math.random() * 3)) : (3 + Math.floor(Math.random() * 3));
  var petNames = team.map(function(p) { return getPetDisplayName(p); });
  for (var t = 0; t < maxTurns; t++) {
    var turn = t + 1;
    // 玩家攻击
    var petDmg = Math.floor(enemyMaxHp / (success ? 4 : 6) * (0.8 + Math.random() * 0.4));
    enemyHp -= petDmg;
    if (enemyHp <= 0) {
      logs.push({ turn: turn, actor: 'pet', target: petNames[t % petNames.length], dmg: petDmg, enemyHpLeft: 0, petHpLeft: petHp });
      break;
    }
    logs.push({ turn: turn, actor: 'pet', target: petNames[t % petNames.length], dmg: petDmg, enemyHpLeft: enemyHp, petHpLeft: petHp });
    // 敌人攻击
    var enemyDmg = Math.floor(petMaxHp / (success ? 9 : 5) * (0.8 + Math.random() * 0.4) * 0.8); // 需求14：活动怪物伤害下调20%
    petHp -= enemyDmg;
    if (petHp <= 0) {
      logs.push({ turn: turn, actor: 'enemy', target: '怪物', dmg: enemyDmg, enemyHpLeft: enemyHp, petHpLeft: 0 });
      break;
    }
    logs.push({ turn: turn, actor: 'enemy', target: '怪物', dmg: enemyDmg, enemyHpLeft: enemyHp, petHpLeft: petHp });
  }
  // 确保最后一回合的 HP 反映结果
  if (success) enemyHp = 0;
  else petHp = 0;
  // 设置活动战斗状态
  window._activityBattle = {
    type: opts.type || 'activity',
    stage: opts.stage || 1,
    enemyName: opts.enemyName || '拦路怪物',
    enemyIcon: opts.enemyIcon || '👹',
    enemyLv: opts.enemyLv || G.player.level,
    enemyMaxHp: enemyMaxHp,
    enemyHp: enemyMaxHp,
    petMaxHp: petMaxHp,
    petHp: petMaxHp,
    team: team,
    logs: logs,
    currentTurn: 0,
    result: null,
    pendingResult: success,
    onComplete: opts.onComplete || null,
    showResultDelay: 1500, // 显示结果后多久可以关闭
  };
  // 启动回合播放
  _scheduleActivityBattleTurn();
  if (typeof render === 'function') render();
}

// 内部：推进活动战斗回合
function _scheduleActivityBattleTurn() {
  if (window._activityBattleTimer) clearTimeout(window._activityBattleTimer);
  window._activityBattleTimer = setTimeout(_advanceActivityBattleTurn, 900);
}

function _advanceActivityBattleTurn() {
  if (!window._activityBattle) return;
  var ab = window._activityBattle;
  if (ab.currentTurn >= ab.logs.length) {
    // 所有回合播放完毕，进入结算
    ab.result = ab.pendingResult ? 'win' : 'lose';
    ab.enemyHp = ab.pendingResult ? 0 : ab.enemyHp;
    ab.petHp = ab.pendingResult ? ab.petHp : 0;
    // 调用完成回调（不立即关闭模态框，等用户点击关闭按钮）
    if (ab.onComplete && !ab._callbackFired) {
      ab._callbackFired = true;
      try { ab.onComplete(ab.pendingResult); } catch (e) { console.error('activity battle callback error:', e); }
    }
    if (typeof render === 'function') render();
    return;
  }
  var log = ab.logs[ab.currentTurn];
  ab.currentTurn++;
  if (log.actor === 'pet') ab.enemyHp = log.enemyHpLeft;
  else ab.petHp = log.petHpLeft;
  if (typeof render === 'function') render();
  _scheduleActivityBattleTurn();
}

// 关闭活动战斗模态框
function closeActivityBattleModal() {
  if (window._activityBattleTimer) { clearTimeout(window._activityBattleTimer); window._activityBattleTimer = null; }
  window._activityBattle = null;
  if (typeof render === 'function') render();
}

// ==================== 需求6：活动收获日志系统 ====================
// 记录当日活动收获：activityId → today → [entries]
// entry: { time, text, type }
function addActivityLog(activityId, text, type) {
  if (!G.activityLogs) G.activityLogs = {};
  var today = new Date().toDateString();
  if (!G.activityLogs[activityId]) G.activityLogs[activityId] = {};
  if (!G.activityLogs[activityId][today]) G.activityLogs[activityId][today] = [];
  var now = new Date();
  var time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  G.activityLogs[activityId][today].push({ time: time, text: text, type: type || 'info' });
  // 保留最近50条
  if (G.activityLogs[activityId][today].length > 50) {
    G.activityLogs[activityId][today] = G.activityLogs[activityId][today].slice(-50);
  }
}

// 获取当日活动收获日志
function getActivityLog(activityId) {
  if (!G.activityLogs || !G.activityLogs[activityId]) return [];
  var today = new Date().toDateString();
  return G.activityLogs[activityId][today] || [];
}

// ==================== 血统珠系统 ====================
// 道具ID前缀：extracted_blood_orb_<uniqueId>
const EXTRACTED_BLOOD_ORB_PREFIX = 'extracted_blood_orb_';
let extractedBloodOrbId = 0;

// 检查宠物T级（依赖 getPetTier 函数）
function getBloodOrbTierForPet(pet) {
  if (typeof getPetTier !== 'function') return 1;
  var tier = getPetTier(pet.name);
  return tier;
}

// 获取宠物可使用的血统珠等级
function getRequiredBloodOrbTier(pet) {
  var tier = getBloodOrbTierForPet(pet);
  if (tier <= 2) return 'blood_orb_low';
  if (tier <= 4) return 'blood_orb_mid';
  return 'blood_orb_high';
}

// 添加血统珠到背包
function addBloodOrb(tierId, count) {
  if (!count) count = 1;
  var existing = G.inventory.find(function(i) { return i.id === tierId; });
  if (existing) existing.count += count;
  else G.inventory.push({ id: tierId, count: count });
}

// 获取血统珠数量
function getBloodOrbCount(tierId) {
  var item = G.inventory.find(function(i) { return i.id === tierId; });
  return item ? item.count : 0;
}

// 抽取宠物血统：消耗1个对应等级的血统珠，获得一个 extracted_blood_orb 道具
// 需求1：抽取会消耗宠物本身；需求8：品质随机
function rollRandomBloodOrbQuality() {
  var r = Math.random();
  var cum = 0;
  var qualities = [['common', BLOOD_ORB_RANDOM_QUALITY.common], ['uncommon', BLOOD_ORB_RANDOM_QUALITY.uncommon], ['rare', BLOOD_ORB_RANDOM_QUALITY.rare], ['epic', BLOOD_ORB_RANDOM_QUALITY.epic], ['legendary', BLOOD_ORB_RANDOM_QUALITY.legendary]];
  for (var i = 0; i < qualities.length; i++) {
    cum += qualities[i][1];
    if (r < cum) return qualities[i][0];
  }
  return 'common';
}

function extractPetBloodline(petId, orbTierId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  // 安全检查：出战中的宠物无法抽取
  if (G.player.activeTeam && G.player.activeTeam.indexOf(petId) >= 0) {
    showToast('出战中的宠物无法抽取血统', 'error');
    return;
  }
  // 检查血统珠等级是否匹配
  var requiredTier = getRequiredBloodOrbTier(pet);
  if (orbTierId !== requiredTier) {
    var tierDef = BLOOD_ORB_TIERS.find(function(t) { return t.id === orbTierId; });
    var reqDef = BLOOD_ORB_TIERS.find(function(t) { return t.id === requiredTier; });
    showToast('该宠物需要 ' + reqDef.name + '（T' + reqDef.minTier + '-' + reqDef.maxTier + '），当前选择的是 ' + tierDef.name, 'error');
    return;
  }
  // 检查血统珠数量
  if (getBloodOrbCount(orbTierId) < 1) {
    var tierDef2 = BLOOD_ORB_TIERS.find(function(t) { return t.id === orbTierId; });
    showToast(tierDef2.name + ' 数量不足', 'error');
    return;
  }
  // 二次确认：抽取会消耗宠物
  var petName = getPetDisplayName(pet);
  if (!confirm('⚠️ 确定要抽取 ' + petName + ' 的血统吗？\n\n抽取会消耗宠物本身（宠物将永久消失），并获得随机品质的血统珠道具。此操作不可撤销！')) return;
  // 重新获取宠物（confirm 期间可能变化）
  pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  // 获取血统ID（融合限定宠物有专属血统）
  var bloodlineId;
  if (FUSION_PET_BLOODLINES[pet.name]) {
    bloodlineId = FUSION_PET_BLOODLINES[pet.name];
  } else {
    bloodlineId = getPetBloodlineId(pet.name);
  }
  // 决定品质：随机抽取（与宠物品质无关）
  var quality = rollRandomBloodOrbQuality();
  // 消耗血统珠
  var item = G.inventory.find(function(i) { return i.id === orbTierId; });
  item.count -= 1;
  if (item.count <= 0) {
    var idx = G.inventory.indexOf(item);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  // 创建提取的血统珠道具
  extractedBloodOrbId++;
  var orbId = EXTRACTED_BLOOD_ORB_PREFIX + Date.now() + '_' + extractedBloodOrbId;
  var orbItem = {
    id: orbId,
    isExtractedBloodOrb: true,
    sourcePetName: pet.name,
    sourcePetRace: pet.race,
    bloodlineId: bloodlineId,
    quality: quality,
    count: 1,
  };
  G.inventory.push(orbItem);
  // 需求1：消耗宠物本身
  var petIdx = G.pets.indexOf(pet);
  if (petIdx >= 0) G.pets.splice(petIdx, 1);
  // 清理出战队伍中可能的残留引用
  if (G.player.activeTeam) {
    G.player.activeTeam = G.player.activeTeam.filter(function(id) { return id !== petId; });
  }
  saveGame();
  // 需求2：修复抽取血统时文本提示与实际不一致的Bug
  // 使用 getPetBloodlineSkill 获取宠物实际显示的血统名称（含PET_BLOODLINE_DEX专属名），而非BLOODLINE_SKILLS通用名
  var bDef = BLOODLINE_SKILLS.find(function(b) { return b.id === bloodlineId; });
  var actualBl = (typeof getPetBloodlineSkill === 'function') ? getPetBloodlineSkill(pet) : null;
  var blDisplayName = actualBl ? actualBl.name : (bDef ? bDef.name : '血统');
  var qName = BLOOD_ORB_QUALITY_NAMES[quality] || quality;
  showToast('🔮 成功抽取 ' + petName + ' 的血统！宠物已消耗，获得 ' + qName + '品质「' + blDisplayName + '」', 'success');
  // 需求3：每日任务追踪
  if (typeof updateDailyTask === 'function') updateDailyTask('bloodline_extract', 1);
  // 清理血统抽取页面选中的宠物引用（已被消耗）
  if (window._bloodlinePetId === petId) window._bloodlinePetId = '';
  if (typeof render === 'function') render();
}

// 应用血统珠到宠物：替换宠物的血统（消耗血统珠道具）
function applyBloodOrbToPet(petId, orbItemId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  var orbIdx = G.inventory.findIndex(function(i) { return i.id === orbItemId && i.isExtractedBloodOrb; });
  if (orbIdx < 0) { showToast('血统珠不存在', 'error'); return; }
  var orb = G.inventory[orbIdx];
  // 检查是否已是同一血统珠
  if (pet.bloodlineOrb && pet.bloodlineOrb.orbItemId === orbItemId) {
    showToast('该宠物已使用此血统珠', 'error');
    return;
  }
  // 应用血统珠
  pet.bloodlineOrb = {
    orbItemId: orbItemId,
    sourcePetName: orb.sourcePetName,
    bloodlineId: orb.bloodlineId,
    quality: orb.quality,
  };
  // 消耗血统珠道具
  orb.count -= 1;
  if (orb.count <= 0) G.inventory.splice(orbIdx, 1);
  saveGame();
  var bDef = BLOODLINE_SKILLS.find(function(b) { return b.id === orb.bloodlineId; });
  showToast('🔮 ' + getPetDisplayName(pet) + ' 已植入「' + (bDef ? bDef.name : '血统') + '·' + BLOOD_ORB_QUALITY_NAMES[orb.quality] + '」', 'success');
  if (typeof render === 'function') render();
}

// 移除宠物血统珠
function removePetBloodlineOrb(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet || !pet.bloodlineOrb) return;
  // 将血统珠退还到背包
  var orbId = EXTRACTED_BLOOD_ORB_PREFIX + Date.now() + '_' + (++extractedBloodOrbId);
  G.inventory.push({
    id: orbId,
    isExtractedBloodOrb: true,
    sourcePetName: pet.bloodlineOrb.sourcePetName,
    sourcePetRace: '', // 旧版可能没有
    bloodlineId: pet.bloodlineOrb.bloodlineId,
    quality: pet.bloodlineOrb.quality,
    count: 1,
  });
  pet.bloodlineOrb = null;
  saveGame();
  showToast('🔮 已取出血统珠', 'info');
  if (typeof render === 'function') render();
}

// 分解已抽取的血统珠道具（需求8）：根据品质返还对应等级的血统珠道具
function decomposeExtractedBloodOrb(orbItemId) {
  var orbIdx = G.inventory.findIndex(function(i) { return i.id === orbItemId && i.isExtractedBloodOrb; });
  if (orbIdx < 0) { showToast('血统珠不存在', 'error'); return; }
  var orb = G.inventory[orbIdx];
  var quality = orb.quality || 'common';
  var returnTier = BLOOD_ORB_DECOMPOSE_RULES[quality];
  if (!returnTier) { showToast('无法分解此血统珠', 'error'); return; }
  var tierDef = BLOOD_ORB_TIERS.find(function(t) { return t.id === returnTier; });
  // 移除被分解的血统珠
  orb.count -= 1;
  if (orb.count <= 0) G.inventory.splice(orbIdx, 1);
  // 添加对应等级的血统珠道具
  addBloodOrb(returnTier, 1);
  saveGame();
  var qName = BLOOD_ORB_QUALITY_NAMES[quality] || quality;
  showToast('🔮 分解 ' + qName + '品质血统珠，获得 ' + tierDef.name + ' x1', 'success');
  if (typeof render === 'function') render();
}

// 血统试炼活动：每日1次，挑战获得血统珠
function startBloodlineTrial() {
  var today = new Date().toDateString();
  if (G.advanceTrialUsed && G.advanceTrialUsed[today]) {
    showToast('今日已完成血统试炼', 'error');
    return;
  }
  if (G.player.level < BLOODLINE_TRIAL.minLevel) {
    showToast('需要 Lv.' + BLOODLINE_TRIAL.minLevel + ' 解锁血统试炼', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  // 模拟战斗：根据队伍战力决定获得多少血统珠
  var cp = getPlayerCombatPower();
  // 基础获得1个，根据战力额外获得
  var orbCount = 1;
  if (cp > 50000) orbCount = 2;
  if (cp > 200000) orbCount = 3;
  if (cp > 500000) orbCount = 4;
  // 随机选择血统珠等级（高等级更稀有）
  for (var i = 0; i < orbCount; i++) {
    var r = Math.random();
    var tierId;
    if (r < 0.10) tierId = 'blood_orb_high';
    else if (r < 0.40) tierId = 'blood_orb_mid';
    else tierId = 'blood_orb_low';
    addBloodOrb(tierId, 1);
  }
  if (!G.advanceTrialUsed) G.advanceTrialUsed = {};
  G.advanceTrialUsed[today] = true;
  // 经验和金币奖励
  addExp(500 + G.player.level * 20);
  addGold(1000 + G.player.level * 50);
  saveGame();
  showToast('🔮 血统试炼完成！获得 ' + orbCount + ' 个血统珠', 'success');
  if (typeof render === 'function') render();
}

// ==================== DAILY & WEEKLY TASKS ====================

// 需求10：智能路由 —— 自动判断 taskId 属于日常还是周常，分别写入对应进度对象
// 不在任何列表中的 taskId（已移除的边缘任务）会被静默忽略
function updateDailyTask(taskId, amount) {
  // 先检查是否为周常任务
  if (typeof WEEKLY_TASKS !== 'undefined' && WEEKLY_TASKS.some(function(t) { return t.id === taskId; })) {
    if (!G.weeklyTasks) G.weeklyTasks = {};
    if (!G.weeklyTasks[taskId]) G.weeklyTasks[taskId] = 0;
    G.weeklyTasks[taskId] += amount;
    return;
  }
  // 再检查是否为日常任务
  if (typeof DAILY_TASKS !== 'undefined' && DAILY_TASKS.some(function(t) { return t.id === taskId; })) {
    if (!G.dailyTasks[taskId]) G.dailyTasks[taskId] = 0;
    G.dailyTasks[taskId] += amount;
  }
  // 不在任何列表中 → 静默忽略（已移除的边缘任务）
}

function claimDailyTask(taskId) {
  const task = DAILY_TASKS.find(t => t.id === taskId);
  if (!task) return false;
  const progress = G.dailyTasks[taskId] || 0;
  if (progress < task.target) return false;
  if (G.dailyTasks[taskId + '_claimed']) return false;
  G.dailyTasks[taskId + '_claimed'] = true;
  if (task.reward.diamond) addDiamond(task.reward.diamond);
  if (task.reward.gold) addGold(task.reward.gold);
  return true;
}

// 需求10：领取周常任务奖励
function claimWeeklyTask(taskId) {
  if (typeof WEEKLY_TASKS === 'undefined') return false;
  const task = WEEKLY_TASKS.find(function(t) { return t.id === taskId; });
  if (!task) return false;
  if (!G.weeklyTasks) G.weeklyTasks = {};
  const progress = G.weeklyTasks[taskId] || 0;
  if (progress < task.target) return false;
  if (G.weeklyTasks[taskId + '_claimed']) return false;
  G.weeklyTasks[taskId + '_claimed'] = true;
  if (task.reward.diamond) addDiamond(task.reward.diamond);
  if (task.reward.gold) addGold(task.reward.gold);
  return true;
}

// 需求10：一键领取所有已完成的日常任务奖励
function claimAllDailyTasks() {
  var count = 0;
  DAILY_TASKS.forEach(function(task) {
    var progress = G.dailyTasks[task.id] || 0;
    if (progress >= task.target && !G.dailyTasks[task.id + '_claimed']) {
      if (claimDailyTask(task.id)) count++;
    }
  });
  return count;
}

// 需求10：一键领取所有已完成的周常任务奖励
function claimAllWeeklyTasks() {
  if (typeof WEEKLY_TASKS === 'undefined') return 0;
  if (!G.weeklyTasks) G.weeklyTasks = {};
  var count = 0;
  WEEKLY_TASKS.forEach(function(task) {
    var progress = G.weeklyTasks[task.id] || 0;
    if (progress >= task.target && !G.weeklyTasks[task.id + '_claimed']) {
      if (claimWeeklyTask(task.id)) count++;
    }
  });
  return count;
}

function checkBattlePassLevelUp() {
  // 每1000经验升1级（原200太快）
  const newLevel = Math.floor(G.player.battlePassExp / 1000);
  if (newLevel > G.player.battlePassLevel) {
    G.player.battlePassLevel = newLevel;
    showToast(`战令升级！当前等级 ${newLevel}`, 'info');
  }
}

function claimBattlePassReward(level) {
  const reward = BATTLE_PASS_REWARDS.find(r => r.level === level);
  if (!reward) return false;
  if (G.player.battlePassLevel < level) return false;
  const claimedKey = 'bp_claimed_' + level;
  const premiumKey = 'bp_premium_claimed_' + level;
  if (G[claimedKey]) return false;
  G[claimedKey] = true;
  if (reward.free.type === 'gold') addGold(reward.free.amount);
  else if (reward.free.type === 'diamond') addDiamond(reward.free.amount);
  else if (reward.free.type === 'item') {
    const existing = G.inventory.find(i => i.id === reward.free.id);
    if (existing) existing.count += reward.free.amount;
    else G.inventory.push({ id: reward.free.id, count: reward.free.amount });
  } else if (reward.free.type === 'egg') {
    for (let i = 0; i < reward.free.amount; i++) G.eggs.push(generateEgg(reward.free.tier));
  }
  if (G.player.battlePassPremium && !G[premiumKey]) {
    G[premiumKey] = true;
    if (reward.premium.type === 'gold') addGold(reward.premium.amount);
    else if (reward.premium.type === 'diamond') addDiamond(reward.premium.amount);
    else if (reward.premium.type === 'item') {
      const existing = G.inventory.find(i => i.id === reward.premium.id);
      if (existing) existing.count += reward.premium.amount;
      else G.inventory.push({ id: reward.premium.id, count: reward.premium.amount });
    } else if (reward.premium.type === 'egg') {
      for (let i = 0; i < reward.premium.amount; i++) G.eggs.push(generateEgg(reward.premium.tier));
    }
  }
  return true;
}

// ==================== REBIRTH ====================

function canRebirth() { return G.player.level >= G.player.maxLevel; }

function doRebirth() {
  if (!canRebirth()) return false;
  // 转生前保留已获得天赋点的最高等级记录，避免转生后重复发放
  G.talentPointsEarned = Math.max(G.talentPointsEarned || 0, G.player.level);
  G.player.rebirth++;
  G.player.maxLevel += 10;
  G.player.level = 1;
  G.player.exp = 0;
  G.player.expToNext = getExpForLevel(1);
  G.pets.forEach(p => { p.level = 1; });
  // 转生后自动卸下所有装备（放回背包）+ 回收宝石 + 重置强化等级
  if (G.player.equipment) {
    Object.keys(G.player.equipment).forEach(function(slotId) {
      var item = G.player.equipment[slotId];
      if (item) {
        // 卸下装备前：检查装备宝石孔中的宝石，退还到宝石背包
        if (Array.isArray(item.gemSlots) && item.gemSlots.length > 0) {
          item.gemSlots.forEach(function(gslot) {
            if (gslot && gslot.gem && gslot.gem.level > 0) {
              if (typeof addGemToBag === 'function') {
                addGemToBag(gslot.gem.type, gslot.gem.level, 1);
              } else if (Array.isArray(G.gemBag)) {
                // 内联 addGemToBag 逻辑（防止函数未定义）
                var ex = G.gemBag.find(function(g) { return g.type === gslot.gem.type && g.level === gslot.gem.level; });
                if (ex) ex.count = (ex.count || 0) + 1;
                else G.gemBag.push({ type: gslot.gem.type, level: gslot.gem.level, count: 1 });
              }
              gslot.gem = null;
            }
          });
        }
        // 需求6：转生后卸下的装备自动上锁
        if (item && typeof item === 'object') item.locked = true;
        G.equipmentBag.push(item);
        G.player.equipment[slotId] = null;
      }
      // 兼容旧存档：清除 G.gems 残留数据
      if (G.gems && G.gems[slotId]) {
        var gem = G.gems[slotId];
        if (typeof addGemToBag === 'function') addGemToBag(gem.type, gem.level, 1);
        G.gems[slotId] = null;
      }
      // 需求5：转生后强化等级降低3级（而非清零），最低为0
      if (G.player.forgeLevels && G.player.forgeLevels[slotId]) {
        G.player.forgeLevels[slotId] = Math.max(0, G.player.forgeLevels[slotId] - 3);
      }
    });
  }
  // 需求5：转生后宠物装备加封印状态，按人物等级比例解封属性
  G.pets.forEach(function(p) {
    if (p.petEquipment) {
      ['attack', 'hp', 'defense'].forEach(function(slot) {
        var e = p.petEquipment[slot];
        if (e) {
          e.sealed = true;
          e.sealedLevel = e.level || 1; // 记录封印时的装备等级
        }
      });
    }
  });
  // 需求3：转生后地图自动切换成起源草地，并清空 mapProgress 防止敌人等级卡 bug
  G.player.currentMap = 1;
  G.player.currentRoute = 0;
  G.mapProgress = {};
  // 转生后清空活跃战斗状态，避免旧战斗残留
  if (typeof liveBattle !== 'undefined') liveBattle = null;
  if (typeof battleTurnTimer !== 'undefined' && battleTurnTimer) { clearTimeout(battleTurnTimer); battleTurnTimer = null; }
  if (typeof battleSpawnTimer !== 'undefined' && battleSpawnTimer) { clearTimeout(battleSpawnTimer); battleSpawnTimer = null; }
  setAchievement('rebirth', G.player.rebirth);
  showToast(`转生成功！当前转生次数：${G.player.rebirth}，等级上限：${G.player.maxLevel}（突破新等级上限可获得天赋点）`, 'success');
  saveGame();
  return true;
}

// ==================== TOWER ====================

function startTowerBattle() {
  const maxFloors = getMaxTowerFloors();
  if (G.towerProgress >= maxFloors) return null;
  const floor = getTowerFloorData(G.towerProgress);
  if (!floor) return null;
  const team = getTeamPets();
  if (team.length === 0) return null;
  // 模拟真实战斗：回合制
  var monsterHp = floor.hp;
  var monsterMaxHp = floor.hp;
  var monsterAtk = floor.atk;
  var monsterDef = floor.def || Math.floor(floor.floor * 1.5);
  var petStates = team.map(function(p) {
    var stats = getPetStats(p);
    return { id: p.id, name: p.name, hp: stats.气血, maxHp: stats.气血, atk: stats.力量 * 2 + 10, def: stats.体质, alive: true };
  });
  var round = 0;
  var maxRounds = 30;
  var log = [];
  while (round < maxRounds) {
    round++;
    // 宠物攻击
    for (var i = 0; i < petStates.length; i++) {
      var ps = petStates[i];
      if (!ps.alive) continue;
      var dmg = Math.max(1, Math.floor(ps.atk - monsterDef * 0.5));
      // 暴击
      var isCrit = Math.random() < 0.15;
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      monsterHp -= dmg;
      log.push('第' + round + '回合 ' + ps.name + (isCrit ? ' 暴击' : '') + '造成 ' + dmg + ' 伤害');
      if (monsterHp <= 0) break;
    }
    if (monsterHp <= 0) break;
    // 怪物反击攻击存活宠物
    var alivePets = petStates.filter(function(p) { return p.alive; });
    if (alivePets.length === 0) break;
    var target = alivePets[Math.floor(Math.random() * alivePets.length)];
    var monsterDmg = Math.max(1, Math.floor(monsterAtk - target.def * 0.5));
    target.hp -= monsterDmg;
    log.push('第' + round + '回合 首领造成 ' + monsterDmg + ' 伤害给 ' + target.name);
    if (target.hp <= 0) { target.alive = false; log.push(target.name + ' 阵亡'); }
  }
  var victory = monsterHp <= 0;
  if (victory) {
    G.towerProgress++;
    if (G.towerProgress > G.towerMaxFloor) G.towerMaxFloor = G.towerProgress;
    // 修复：仅使用 setAchievement 设置最高层数，避免 updateAchievement 累加导致计数虚高
    setAchievement('tower', G.towerProgress);
    updateDailyTask('tower_5', 1);
    if (floor.reward.gold) addGold(floor.reward.gold);
    if (floor.reward.diamond) addDiamond(floor.reward.diamond);
    if (floor.reward.exp) {
      addExp(floor.reward.exp);
    }
    return { victory: true, floor: floor.floor, isBoss: floor.isBoss, reward: floor.reward, rounds: round, log: log };
  }
  return { victory: false, floor: floor.floor, rounds: round, log: log };
}

// ==================== MARKET ====================

function listEggOnMarket(eggId, price) {
  const idx = G.eggs.findIndex(e => e.id === eggId);
  if (idx === -1) return false;
  const egg = G.eggs.splice(idx, 1)[0];
  G.marketListings.push({ egg, price, seller: 'player', id: 'listing_' + Date.now() });
  return true;
}

function buyMarketListing(listingId) {
  const idx = G.marketListings.findIndex(l => l.id === listingId);
  if (idx === -1) return false;
  const listing = G.marketListings[idx];
  if (G.player.gold < listing.price) return false;
  G.player.gold -= listing.price;
  G.eggs.push(listing.egg);
  G.marketListings.splice(idx, 1);
  updateDailyTask('market_trade', 1);
  return true;
}

// ==================== 宠物派遣奇遇系统（DISPATCH）====================
// 核心机制：闲置宠物派遣至已通关地图，3 只组队，总战力达标，1/4/8 小时时长
// 战力越高额外收益加成；基础产出金币/经验/材料，低概率稀有道具

function getDispatchMapConfig(mapId) {
  if (!DISPATCH_MAPS) return null;
  return DISPATCH_MAPS.find(function(m) { return m.mapId === mapId; }) || null;
}

// 判断地图是否已通关（解锁派遣）
function isMapUnlockedForDispatch(mapId) {
  var prog = G.mapProgress && G.mapProgress[mapId];
  return !!(prog && prog.phase === 'cleared');
}

// 获取可派遣宠物：不在出战阵容、未在其它派遣中、未在蛋中
function getAvailableDispatchPets() {
  if (!G.pets || !Array.isArray(G.pets)) return [];
  var activeTeam = (G.player && Array.isArray(G.player.activeTeam)) ? G.player.activeTeam : [];
  var dispatchedIds = [];
  if (Array.isArray(G.dispatches)) {
    G.dispatches.forEach(function(d) {
      if (d && Array.isArray(d.petIds)) dispatchedIds = dispatchedIds.concat(d.petIds);
    });
  }
  return G.pets.filter(function(p) {
    if (!p || !p.id) return false;
    if (activeTeam.indexOf(p.id) !== -1) return false;
    if (dispatchedIds.indexOf(p.id) !== -1) return false;
    return true;
  });
}

// 计算派遣宠物总战斗力
function getDispatchTotalPower(petIds) {
  if (!petIds || !Array.isArray(petIds) || petIds.length === 0) return 0;
  var total = 0;
  petIds.forEach(function(pid) {
    var pet = (G.pets || []).find(function(p) { return p.id === pid; });
    if (pet && typeof getPetCombatPower === 'function') {
      total += getPetCombatPower(pet);
    }
  });
  return Math.floor(total);
}

// 战力超额加成倍率：每超过最低战力 10% 额外 +5%（DISPATCH_POWER_BONUS_PER_10PCT）
function getDispatchPowerBonus(totalPower, minPower) {
  if (!minPower || totalPower <= minPower) return 1.0;
  var overRatio = (totalPower - minPower) / minPower; // 超出比例
  var tens = Math.floor(overRatio / 0.1); // 每 10% 一档
  var bonus = 1.0 + tens * DISPATCH_POWER_BONUS_PER_10PCT;
  // 封顶 3.0（避免过度膨胀）
  return Math.min(3.0, bonus);
}

// 派遣进度（0~1）
function getDispatchProgress(dispatch) {
  if (!dispatch || !dispatch.startTs || !dispatch.durationIdx) return 0;
  var dur = DISPATCH_DURATIONS[dispatch.durationIdx];
  if (!dur) return 0;
  var elapsedMs = Date.now() - dispatch.startTs;
  var totalMs = dur.hours * 3600 * 1000;
  if (totalMs <= 0) return 0;
  var p = elapsedMs / totalMs;
  if (p < 0) p = 0;
  if (p > 1) p = 1;
  return p;
}

// 预计奖励（用于 UI 展示）
function getDispatchExpectedReward(dispatch) {
  var map = getDispatchMapConfig(dispatch.mapId);
  if (!map) return null;
  var dur = DISPATCH_DURATIONS[dispatch.durationIdx];
  var powerBonus = getDispatchPowerBonus(dispatch.totalPower, map.minPower);
  var totalMult = dur.mult * map.rewardMult * powerBonus;
  var gold = Math.floor(DISPATCH_BASE_REWARD.gold * totalMult);
  var exp = Math.floor(DISPATCH_BASE_REWARD.exp * totalMult);
  var matCount = Math.max(1, Math.floor(DISPATCH_BASE_REWARD.materialCount * totalMult));
  var rareChance = Math.min(0.5, DISPATCH_BASE_REWARD.rareChance * powerBonus);
  return {
    gold: gold, exp: exp, materials: map.materials, materialCount: matCount,
    rarePool: map.rarePool, rareChance: rareChance,
    powerBonus: powerBonus, totalMult: totalMult
  };
}

// 开始派遣
function startDispatch(mapId, petIds, durationIdx) {
  if (typeof DISPATCH_MAPS === 'undefined') return { ok: false, msg: '派遣系统未启用' };
  if (!Array.isArray(G.dispatches)) G.dispatches = [];
  // 上限校验
  if (G.dispatches.length >= DISPATCH_MAX_SLOTS) {
    return { ok: false, msg: '已达到同时派遣上限(' + DISPATCH_MAX_SLOTS + ')' };
  }
  var map = getDispatchMapConfig(mapId);
  if (!map) return { ok: false, msg: '地图配置不存在' };
  if (!isMapUnlockedForDispatch(mapId)) {
    return { ok: false, msg: '需先通关该地图才能派遣：' + map.unlockDesc };
  }
  if (!DISPATCH_DURATIONS[durationIdx]) {
    return { ok: false, msg: '探索时长无效' };
  }
  if (!petIds || petIds.length === 0) {
    return { ok: false, msg: '请选择至少 1 只派遣宠物' };
  }
  if (petIds.length > 3) {
    return { ok: false, msg: '每次派遣最多 3 只宠物' };
  }
  // 校验宠物可用性
  var available = getAvailableDispatchPets().map(function(p) { return p.id; });
  for (var i = 0; i < petIds.length; i++) {
    if (available.indexOf(petIds[i]) === -1) {
      return { ok: false, msg: '存在不可用的宠物（已在出战阵容或其它派遣中）' };
    }
  }
  var totalPower = getDispatchTotalPower(petIds);
  if (totalPower < map.minPower) {
    return { ok: false, msg: '总战力不足！需要 ' + map.minPower + '，当前 ' + totalPower };
  }
  var dispatch = {
    id: 'dispatch_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    mapId: mapId,
    petIds: petIds.slice(),
    startTs: Date.now(),
    durationIdx: durationIdx,
    totalPower: totalPower
  };
  G.dispatches.push(dispatch);
  // 每日派遣计数（仅记录，不做硬性限制）
  var today = new Date().toDateString();
  if (!G.dispatchDailyUsed) G.dispatchDailyUsed = {};
  G.dispatchDailyUsed[today] = (G.dispatchDailyUsed[today] || 0) + 1;
  if (typeof addActivityLog === 'function') {
    var durLabel = DISPATCH_DURATIONS[durationIdx].label;
    addActivityLog('dispatch', '🐾 派遣 ' + petIds.length + ' 只宠物前往「' + map.name + '」，时长 ' + durLabel + '，总战力 ' + totalPower, 'info');
  }
  if (typeof updateDailyTask === 'function') updateDailyTask('dispatch_start', 1);
  saveGame();
  return { ok: true, dispatch: dispatch };
}

// 领取派遣奖励
function collectDispatch(dispatchId) {
  if (!Array.isArray(G.dispatches)) return { ok: false, msg: '无进行中的派遣' };
  var idx = G.dispatches.findIndex(function(d) { return d.id === dispatchId; });
  if (idx === -1) return { ok: false, msg: '派遣不存在或已领取' };
  var dispatch = G.dispatches[idx];
  var progress = getDispatchProgress(dispatch);
  if (progress < 1) {
    return { ok: false, msg: '探索尚未完成（' + Math.floor(progress * 100) + '%）' };
  }
  var map = getDispatchMapConfig(dispatch.mapId);
  if (!map) return { ok: false, msg: '地图配置缺失' };
  var reward = getDispatchExpectedReward(dispatch);
  if (!reward) return { ok: false, msg: '奖励计算失败' };

  // 发放金币与经验
  G.player.gold = (G.player.gold || 0) + reward.gold;
  if (typeof addExp === 'function') addExp(reward.exp);
  else G.player.exp = (G.player.exp || 0) + reward.exp;

  // 发放养成材料到 petEquipMaterials 背包
  if (reward.materials && reward.materialCount > 0) {
    for (var i = 0; i < reward.materialCount; i++) {
      var matId = reward.materials[Math.floor(Math.random() * reward.materials.length)];
      if (G.petEquipMaterials && G.petEquipMaterials.hasOwnProperty(matId)) {
        G.petEquipMaterials[matId] = (G.petEquipMaterials[matId] || 0) + 1;
      }
    }
  }

  // 稀有道具掉落
  var rareDrop = null;
  if (Math.random() < reward.rareChance && reward.rarePool && reward.rarePool.length > 0) {
    rareDrop = reward.rarePool[Math.floor(Math.random() * reward.rarePool.length)];
    applyDispatchRareDrop(rareDrop);
  }

  // 派遣宠物获得少量经验（按 1 小时为基础的 30% 经验）
  var petExp = Math.floor(reward.exp * 0.3);
  if (petExp > 0) {
    dispatch.petIds.forEach(function(pid) {
      var pet = (G.pets || []).find(function(p) { return p.id === pid; });
      if (pet && typeof addPetExp === 'function') addPetExp(pet, petExp);
    });
  }

  // 历史记录
  if (!Array.isArray(G.dispatchHistory)) G.dispatchHistory = [];
  G.dispatchHistory.unshift({
    id: dispatch.id,
    mapId: dispatch.mapId,
    mapName: map.name,
    petIds: dispatch.petIds.slice(),
    durationIdx: dispatch.durationIdx,
    totalPower: dispatch.totalPower,
    startTs: dispatch.startTs,
    collectTs: Date.now(),
    rewards: {
      gold: reward.gold,
      exp: reward.exp,
      materialCount: reward.materialCount,
      rareDrop: rareDrop
    }
  });
  if (G.dispatchHistory.length > 50) G.dispatchHistory.length = 50;

  G.dispatches.splice(idx, 1);
  if (typeof addActivityLog === 'function') {
    var logText = '📦 派遣归来「' + map.name + '」：金币 +' + reward.gold + '，经验 +' + reward.exp;
    if (rareDrop) logText += '，稀有掉落 ' + (typeof getItemName === 'function' ? getItemName(rareDrop) : rareDrop);
    addActivityLog('dispatch', logText, 'reward');
  }
  if (typeof updateDailyTask === 'function') updateDailyTask('dispatch_finish', 1);
  saveGame();
  return { ok: true, rewards: reward, rareDrop: rareDrop };
}

// 稀有掉落应用
function applyDispatchRareDrop(rareId) {
  if (!rareId) return;
  if (rareId === 'rare_egg') {
    // 随机生成一只 T3-T4 稀有蛋（tier 索引 2=T3, 3=T4）
    if (typeof generateEgg === 'function') {
      var tierIdx = Math.random() < 0.5 ? 2 : 3;
      var egg = generateEgg(tierIdx);
      if (egg) G.eggs.push(egg);
    }
  } else if (rareId === 'blood_orb_low' || rareId === 'blood_orb_mid' || rareId === 'blood_orb_high') {
    // 直接使用 blood_orb_* 作为 tierId（addBloodOrb 接受该格式）
    if (typeof addBloodOrb === 'function') {
      addBloodOrb(rareId, 1);
    }
  } else if (rareId === 'skill_random') {
    // 随机技能书
    if (typeof SKILL_LIBRARY !== 'undefined' && Array.isArray(SKILL_LIBRARY)) {
      var pool = SKILL_LIBRARY.filter(function(s) { return s && s.id; });
      if (pool.length > 0) {
        var sk = pool[Math.floor(Math.random() * pool.length)];
        if (!Array.isArray(G.skillBooks)) G.skillBooks = [];
        var existing = G.skillBooks.find(function(b) { return b.id === sk.id; });
        if (existing) existing.count = (existing.count || 0) + 1;
        else G.skillBooks.push({ id: sk.id, count: 1 });
      }
    }
  }
}

// 强制召回（提前结束，无奖励）
function recallDispatch(dispatchId) {
  if (!Array.isArray(G.dispatches)) return false;
  var idx = G.dispatches.findIndex(function(d) { return d.id === dispatchId; });
  if (idx === -1) return false;
  var dispatch = G.dispatches[idx];
  var map = getDispatchMapConfig(dispatch.mapId);
  G.dispatches.splice(idx, 1);
  if (typeof addActivityLog === 'function' && map) {
    addActivityLog('dispatch', '↩️ 召回「' + map.name + '」派遣（无奖励）', 'info');
  }
  saveGame();
  return true;
}

// ==================== 需求1：主线剧情任务链 ====================

// 初始化主线任务（新玩家或旧存档迁移时调用）
function initMainQuest() {
  if (G.mainQuest) return; // 已有主线任务，不重复初始化
  if (typeof MAIN_QUEST_CHAIN === 'undefined') return;
  // 从链的第一个任务开始
  var firstQuest = MAIN_QUEST_CHAIN[0];
  if (!firstQuest) return;
  G.mainQuest = {
    chainIdx: 0,
    progress: 0,
    questData: firstQuest,
    claimed: false,
  };
  saveGame();
}

// 获取当前主线任务
function getCurrentMainQuest() {
  if (!G.mainQuest) {
    initMainQuest();
  }
  return G.mainQuest;
}

// 生成随机主线任务（当没有新功能解锁时使用）
function generateRandomMainQuest() {
  if (typeof MAIN_QUEST_RANDOM_TEMPLATES === 'undefined') return null;
  var template = MAIN_QUEST_RANDOM_TEMPLATES[Math.floor(Math.random() * MAIN_QUEST_RANDOM_TEMPLATES.length)];
  var targetIdx = Math.floor(Math.random() * template.targets.length);
  var target = template.targets[targetIdx];
  var desc = template.desc.replace('{N}', target);
  // 计算奖励（基于目标数量）
  var reward = {};
  if (template.reward.type === 'exp') {
    reward.exp = template.reward.base + template.reward.perKill * target;
  } else if (template.reward.type === 'gold') {
    reward.gold = template.reward.base + template.reward.perKill * target;
  } else if (template.reward.type === 'diamond') {
    reward.diamond = template.reward.base + template.reward.perHatch * target;
  }
  return {
    type: 'random',
    taskType: template.taskType,
    name: template.name,
    desc: desc,
    target: target,
    reward: reward,
    level: G.player.level,
  };
}

// 更新主线任务进度
function updateMainQuest(taskType, amount) {
  if (!G.mainQuest) return;
  if (G.mainQuest.claimed) return; // 已完成待领取，不再更新
  var quest = G.mainQuest.questData;
  if (!quest) return;
  // 判断任务类型是否匹配
  var questTaskType = quest.taskType || 'battle'; // 默认为战斗类
  if (questTaskType !== taskType) return;
  G.mainQuest.progress += amount;
  if (G.mainQuest.progress > quest.target) G.mainQuest.progress = quest.target;
}

// 领取主线任务奖励并激活下一个任务
function claimMainQuest() {
  if (!G.mainQuest) return false;
  var quest = G.mainQuest.questData;
  if (!quest) return false;
  if (G.mainQuest.progress < quest.target) return false;
  if (G.mainQuest.claimed) return false;
  // 发放奖励
  var r = quest.reward || {};
  if (r.exp) addExp(r.exp);
  if (r.gold) addGold(r.gold);
  if (r.diamond) addDiamond(r.diamond);
  G.mainQuest.claimed = true;
  showToast('✅ 主线任务「' + quest.name + '」完成！', 'success');
  // 激活下一个任务
  activateNextMainQuest();
  saveGame();
  return true;
}

// 激活下一个主线任务
function activateNextMainQuest() {
  if (typeof MAIN_QUEST_CHAIN === 'undefined') return;
  var nextIdx = (G.mainQuest ? G.mainQuest.chainIdx + 1 : 0);
  // 检查链中是否有下一个任务
  if (nextIdx < MAIN_QUEST_CHAIN.length) {
    var nextQuest = MAIN_QUEST_CHAIN[nextIdx];
    // 检查等级要求
    if (G.player.level >= nextQuest.level) {
      G.mainQuest = {
        chainIdx: nextIdx,
        progress: 0,
        questData: nextQuest,
        claimed: false,
      };
      return;
    }
  }
  // 链已走完或等级不够 → 生成随机任务
  var randomQuest = generateRandomMainQuest();
  if (randomQuest) {
    G.mainQuest = {
      chainIdx: nextIdx, // 记录位置（随机任务不影响链进度）
      progress: 0,
      questData: randomQuest,
      claimed: false,
    };
  } else {
    G.mainQuest = null; // 无任务可做
  }
}

// 检查并升级主线任务（当玩家升级后，可能有新的链任务可用）
function checkMainQuestUpgrade() {
  if (!G.mainQuest) {
    initMainQuest();
    return;
  }
  // 如果当前是随机任务，检查是否有新的链任务可用
  if (G.mainQuest.questData && G.mainQuest.questData.type === 'random') {
    var nextIdx = G.mainQuest.chainIdx;
    if (nextIdx < MAIN_QUEST_CHAIN.length) {
      var nextQuest = MAIN_QUEST_CHAIN[nextIdx];
      if (G.player.level >= nextQuest.level && !G.mainQuest.claimed) {
        // 有新的链任务可接，但当前随机任务未完成时不替换
        // 只有当当前随机任务也完成时才切换到链任务
        return;
      }
    }
  }
}

// ==================== 需求5：血色要塞活动 ====================

// 开始血色要塞
function startCrimsonFortress(difficultyId) {
  if (typeof CRIMSON_FORTRESS_DIFFICULTIES === 'undefined') return { ok: false, msg: '配置缺失' };
  var diff = CRIMSON_FORTRESS_DIFFICULTIES.find(function(d) { return d.id === difficultyId; });
  if (!diff) return { ok: false, msg: '难度不存在' };
  // 检查每日次数
  var today = new Date().toDateString();
  if (!G.crimsonFortressUsed) G.crimsonFortressUsed = {};
  var used = G.crimsonFortressUsed[today] || 0;
  if (typeof CRIMSON_FORTRESS_DAILY_MAX !== 'undefined' && used >= CRIMSON_FORTRESS_DAILY_MAX) {
    return { ok: false, msg: '今日挑战次数已用完' };
  }
  G.crimsonFortressUsed[today] = used + 1;
  // 初始化活动战斗状态
  G.crimsonFortress = {
    difficulty: difficultyId,
    round: 0,
    kills: 0,
    buffs: [],        // 已选增益列表
    active: true,
    startTime: Date.now(),
  };
  saveGame();
  return { ok: true };
}

// 生成血色要塞怪物
function generateCrimsonFortressMonster() {
  if (!G.crimsonFortress || !G.crimsonFortress.active) return null;
  var diff = CRIMSON_FORTRESS_DIFFICULTIES.find(function(d) { return d.id === G.crimsonFortress.difficulty; });
  if (!diff) return null;
  var round = G.crimsonFortress.round;
  var playerLv = G.player.level;
  // 怪物基础等级 = 玩家等级
  var monsterLv = playerLv;
  // 每5关怪物整体强化5%
  var powerMult = diff.powerMult * (1 + Math.floor(round / 5) * 0.05);
  // 怪物属性
  var lvScale = 1 + monsterLv * 0.012;
  var baseHp = Math.floor((40 + monsterLv * 20) * 5 * lvScale * powerMult);
  var baseAtk = Math.floor((4 + monsterLv * 3.8) * 5 * lvScale * powerMult * 0.8); // 需求14：活动怪物伤害下调20%
  var finalHp = baseHp + randomInt(-Math.floor(baseHp * 0.05), Math.floor(baseHp * 0.05));
  // 随机种族
  var races = ['史莱姆', '哥布林', '精灵', '野兽', '龙族', '亡灵'];
  var race = races[Math.floor(Math.random() * races.length)];
  var monsterNames = {
    '史莱姆': ['血色史莱姆', '腐蚀凝胶', '暗红泡泡'],
    '哥布林': ['血色哥布林', '狂暴战士', '猩红刺客'],
    '精灵': ['血色精灵', '暗影弓手', '堕落法师'],
    '野兽': ['血色野兽', '猩红巨狼', '暗影猛虎'],
    '龙族': ['血色幼龙', '猩红龙裔', '暗影龙兽'],
    '亡灵': ['血色亡灵', '猩红骷髅', '暗影幽灵'],
  };
  var namePool = monsterNames[race] || ['血色怪物'];
  var name = namePool[Math.floor(Math.random() * namePool.length)];
  // Boss波（每5关出一个Boss）
  var isBoss = round > 0 && round % 5 === 4;
  if (isBoss) {
    name = '血色领主·' + name;
    finalHp = Math.floor(finalHp * 3);
    baseAtk = Math.floor(baseAtk * 2.5);
  }
  return {
    name: name,
    level: monsterLv,
    enemyType: isBoss ? 'boss' : 'mob',
    race: race,
    skills: [],
    passives: [],
    bossConfig: null,
    hp: finalHp,
    maxHp: finalHp,
    atk: baseAtk + randomInt(-Math.floor(baseAtk * 0.1), Math.floor(baseAtk * 0.1)),
    def: Math.floor(monsterLv * 2.0 * (isBoss ? 2.0 : 1.2) * powerMult),
    speed: Math.floor(monsterLv * 2 + 10 + (isBoss ? 5 : 0)),
  };
}

// 获取血色要塞增益buff选择（每5关弹出3选1）
function rollCrimsonFortressBuffs() {
  if (typeof CRIMSON_FORTRESS_BUFF_POOL === 'undefined') return [];
  // 按品质权重随机选3个不重复的buff
  var pool = CRIMSON_FORTRESS_BUFF_POOL.slice();
  var selected = [];
  var weightMap = { common: 50, uncommon: 30, rare: 15, epic: 5 };
  while (selected.length < 3 && pool.length > 0) {
    var totalWeight = pool.reduce(function(sum, b) { return sum + (weightMap[b.quality] || 10); }, 0);
    var r = Math.random() * totalWeight;
    var acc = 0;
    for (var i = 0; i < pool.length; i++) {
      acc += (weightMap[pool[i].quality] || 10);
      if (r <= acc) {
        selected.push(pool[i]);
        pool.splice(i, 1);
        break;
      }
    }
  }
  return selected;
}

// 选择血色要塞增益buff
function selectCrimsonFortressBuff(buffId) {
  if (!G.crimsonFortress || !G.crimsonFortress.active) return false;
  if (!G.crimsonFortress.pendingBuffs) return false;
  var buff = G.crimsonFortress.pendingBuffs.find(function(b) { return b.id === buffId; });
  if (!buff) return false;
  // 累加buff效果
  G.crimsonFortress.buffs.push(buff);
  G.crimsonFortress.pendingBuffs = null;
  saveGame();
  return true;
}

// 获取血色要塞buff总效果
function getCrimsonFortressBuffEffects() {
  if (!G.crimsonFortress || !G.crimsonFortress.buffs) return {};
  var total = {};
  G.crimsonFortress.buffs.forEach(function(b) {
    if (b.effect) {
      Object.keys(b.effect).forEach(function(key) {
        total[key] = (total[key] || 0) + b.effect[key];
      });
    }
  });
  return total;
}

// 结束血色要塞（战斗失败时调用）
function endCrimsonFortress() {
  if (!G.crimsonFortress || !G.crimsonFortress.active) return null;
  G.crimsonFortress.active = false;
  var diff = CRIMSON_FORTRESS_DIFFICULTIES.find(function(d) { return d.id === G.crimsonFortress.difficulty; });
  var expMult = diff ? diff.expMult : 3.0;
  var kills = G.crimsonFortress.kills;
  // 经验奖励 = 正常经验 × 3倍
  var baseExp = kills * (G.player.level * 8 + 40);
  var totalExp = Math.floor(baseExp * expMult);
  // 金币奖励
  var totalGold = kills * (G.player.level * 5 + 20);
  if (totalExp > 0) addExp(totalExp);
  if (totalGold > 0) addGold(totalGold);
  var result = {
    kills: kills,
    exp: totalExp,
    gold: totalGold,
    buffs: G.crimsonFortress.buffs.slice(),
  };
  G.crimsonFortress = null;
  if (typeof updateDailyTask === 'function') updateDailyTask('fortress', 1);
  if (typeof addActivityLog === 'function') {
    addActivityLog('fortress', '🏰 血色要塞结束：击杀 ' + kills + ' 怪，经验 +' + totalExp + '，金币 +' + totalGold, 'reward');
  }
  saveGame();
  return result;
}

// 获取今日血色要塞剩余次数
function getCrimsonFortressRemaining() {
  var today = new Date().toDateString();
  if (!G.crimsonFortressUsed) G.crimsonFortressUsed = {};
  var used = G.crimsonFortressUsed[today] || 0;
  var max = (typeof CRIMSON_FORTRESS_DAILY_MAX !== 'undefined') ? CRIMSON_FORTRESS_DAILY_MAX : 2;
  return Math.max(0, max - used);
}

// 需求5：开始血色要塞战斗（一轮）
function beginCrimsonFortressBattle() {
  if (!G.crimsonFortress || !G.crimsonFortress.active) return;
  var monster = generateCrimsonFortressMonster();
  if (!monster) return;
  var cp = Math.floor(getPlayerCombatPower());
  // 计算buff效果加成
  var buffEffects = getCrimsonFortressBuffEffects();
  var buffAtkPct = buffEffects.atkPct || 0;
  var buffDefPct = buffEffects.defPct || 0;
  var buffHpPct = buffEffects.hpPct || 0;
  var buffCritRate = buffEffects.critRate || 0;
  var buffDmgReduce = buffEffects.dmgReduce || 0;
  var buffExpMult = buffEffects.expMult || 0;
  // 应用buff到玩家战力
  var effectiveCp = cp * (1 + buffAtkPct + buffDefPct + buffHpPct) * (1 + buffCritRate * 2) * (1 + buffExpMult);
  // 怪物战力 = atk * hp / 100（粗略估算）
  var monsterPower = Math.floor(monster.atk * monster.hp / 100 * (1 - buffDmgReduce));
  // 胜率计算
  var winChance = effectiveCp / (effectiveCp + monsterPower * 0.8);
  winChance = Math.max(0.1, Math.min(0.95, winChance));
  // 活动战斗
  startActivityBattleModal({
    type: 'fortress',
    stage: G.crimsonFortress.round + 1,
    enemyName: monster.name,
    enemyIcon: monster.enemyType === 'boss' ? '👑' : '👹',
    enemyLv: monster.level,
    monsterPower: monsterPower,
    playerCp: Math.floor(effectiveCp),
    winChance: winChance,
    onComplete: function(success) {
      if (success) {
        // 胜利：击杀数+1，轮次+1
        G.crimsonFortress.kills++;
        G.crimsonFortress.round++;
        // 每5关弹出buff选择
        if (G.crimsonFortress.round % 5 === 0) {
          G.crimsonFortress.pendingBuffs = rollCrimsonFortressBuffs();
        }
        saveGame();
        if (typeof render === 'function') render();
      } else {
        // 失败：结算奖励
        var result = endCrimsonFortress();
        if (result && typeof showToast === 'function') {
          showToast('💀 战斗失败！击杀 ' + result.kills + ' 怪，经验 +' + result.exp + '，金币 +' + result.gold, 'info');
        }
        if (typeof render === 'function') render();
      }
    },
  });
}

// ==================== 挖密藏系统（v2.2.0 需求9）====================
// 九宫格挖宝玩法：3x3网格，初始4次挖掘机会，可使用道具增加机会/透视/开锁

var DIG_DAILY_LIMIT = 10;
var DIG_INITIAL_DIGS = 4;

// 格子类型概率分布
var DIG_CELL_TYPES = [
  { type: 'empty',        weight: 25, icon: '⬜', name: '空地',   color: '#6b7280' },
  { type: 'gold',         weight: 20, icon: '🪙', name: '金币',   color: '#fbbf24' },
  { type: 'gem',          weight: 12, icon: '💎', name: '宝石',   color: '#a855f7' },
  { type: 'item',         weight: 15, icon: '📦', name: '道具',   color: '#3b82f6' },
  { type: 'trap',         weight: 10, icon: '💥', name: '陷阱',   color: '#ef4444' },
  { type: 'silver_chest', weight: 10, icon: '🥈', name: '银宝箱', color: '#9ca3af' },
  { type: 'locked_chest', weight: 5,  icon: '🔒', name: '锁宝箱', color: '#f59e0b' },
  { type: 'golden',       weight: 3,  icon: '🌟', name: '黄金宝藏',color: '#fde047' },
];

// 生成一个3x3网格
function generateDigGrid() {
  var grid = [];
  var totalWeight = DIG_CELL_TYPES.reduce(function(s, t) { return s + t.weight; }, 0);
  for (var i = 0; i < 9; i++) {
    var roll = Math.random() * totalWeight;
    var acc = 0;
    var cellType = 'empty';
    for (var j = 0; j < DIG_CELL_TYPES.length; j++) {
      acc += DIG_CELL_TYPES[j].weight;
      if (roll < acc) { cellType = DIG_CELL_TYPES[j].type; break; }
    }
    grid.push({
      type: cellType,
      revealed: false,     // 是否已挖掘
      peeked: false,       // 是否已透视
      reward: null,        // 挖掘后填入奖励信息
    });
  }
  // 确保至少有1个非空格子（避免全空）
  var hasReward = grid.some(function(c) { return c.type !== 'empty' && c.type !== 'trap'; });
  if (!hasReward) {
    grid[randomInt(0, 8)].type = 'gold';
  }
  return grid;
}

// 开始挖密藏会话
function startDigSession() {
  // 功能等级检查
  if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('dig')) {
    showToast('🔒 需要 ' + getFeatureUnlockLevel('dig') + ' 级才能解锁挖密藏功能', 'error');
    return;
  }
  var today = new Date().toDateString();
  if (!G.digDailyUsed) G.digDailyUsed = {};
  var used = G.digDailyUsed[today] || 0;
  if (used >= DIG_DAILY_LIMIT) {
    showToast('今日挖密藏次数已用完（' + DIG_DAILY_LIMIT + '次/天）', 'error');
    return;
  }
  // 消耗密藏图
  var mapItem = G.inventory.find(function(i) { return i.id === 'dig_map'; });
  if (!mapItem || mapItem.count <= 0) {
    showToast('需要密藏图才能挖宝！', 'error');
    return;
  }
  mapItem.count--;
  if (mapItem.count <= 0) {
    var idx = G.inventory.indexOf(mapItem);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  // 记录每日次数
  G.digDailyUsed[today] = used + 1;
  // 创建会话
  G.digSession = {
    grid: generateDigGrid(),
    digsLeft: DIG_INITIAL_DIGS,
    maxDigs: DIG_INITIAL_DIGS,
    lensUsed: [],
    keyUsed: false,
    totalFound: { gold: 0, gem: 0, item: 0, diamond: 0, egg: 0 },
    startTime: Date.now(),
  };
  saveGame();
  showToast('🗺️ 挖密藏开始！你有 ' + DIG_INITIAL_DIGS + ' 次挖掘机会', 'success');
  // 自动切换到挖密藏页面
  if (typeof currentScreen !== 'undefined' && currentScreen !== 'dig') {
    currentScreen = 'dig';
  }
  if (typeof render === 'function') render();
}

// 挖掘一个格子
function digCell(idx) {
  if (!G.digSession) return;
  if (idx < 0 || idx >= 9) return;
  var cell = G.digSession.grid[idx];
  if (cell.revealed) {
    showToast('该格子已挖掘过', 'error');
    return;
  }
  if (G.digSession.digsLeft <= 0) {
    showToast('挖掘次数已用完！可使用探宝铲增加次数或结束挖宝', 'error');
    return;
  }
  // 锁宝箱需要钥匙
  if (cell.type === 'locked_chest' && !G.digSession.keyUsed) {
    var keyItem = G.inventory.find(function(i) { return i.id === 'dig_key'; });
    if (!keyItem || keyItem.count <= 0) {
      showToast('🔒 发现锁宝箱！需要密藏钥匙才能开启', 'error');
      // 不消耗挖掘次数，不揭示
      return;
    }
    // 消耗钥匙
    keyItem.count--;
    if (keyItem.count <= 0) {
      var kidx = G.inventory.indexOf(keyItem);
      if (kidx >= 0) G.inventory.splice(kidx, 1);
    }
    G.digSession.keyUsed = true;
  }
  // 消耗挖掘次数
  G.digSession.digsLeft--;
  cell.revealed = true;
  // 处理奖励
  var reward = processDigReward(cell.type);
  cell.reward = reward;
  // 陷阱：额外消耗1次挖掘
  if (cell.type === 'trap') {
    G.digSession.digsLeft = Math.max(0, G.digSession.digsLeft - 1);
    if (reward) reward.extraMsg = '陷阱！额外损失1次挖掘机会';
  }
  saveGame();
  if (typeof render === 'function') render();
}

// 处理挖掘奖励
function processDigReward(cellType) {
  var pl = G.player.level || 1;
  var reward = null;
  if (cellType === 'empty') {
    reward = { icon: '⬜', name: '空空如也', amount: 0, color: '#6b7280' };
  } else if (cellType === 'gold') {
    var gold = Math.floor(pl * randomInt(50, 200));
    addGold(gold);
    G.digSession.totalFound.gold += gold;
    reward = { icon: '🪙', name: '金币', amount: gold, color: '#fbbf24' };
  } else if (cellType === 'gem') {
    var gemDef = GEM_TYPES[randomInt(0, GEM_TYPES.length - 1)];
    var gemLv = Math.random() < 0.15 ? 2 : 1;
    addGemToBag(gemDef.id, gemLv, 1);
    G.digSession.totalFound.gem++;
    reward = { icon: gemDef.icon, name: gemDef.name + '+' + gemLv, amount: 1, color: gemDef.color };
  } else if (cellType === 'item') {
    var itemPool = ['forge_stone_low', 'hatch_stone', 'socket_nail', 'yuanxiao_str', 'yuanxiao_con', 'yuanxiao_agi', 'yuanxiao_int'];
    var itemId = itemPool[randomInt(0, itemPool.length - 1)];
    var existing = G.inventory.find(function(i) { return i.id === itemId; });
    if (existing) existing.count += 1;
    else G.inventory.push({ id: itemId, count: 1 });
    if (itemId === 'hatch_stone') G.hatchStones = (G.hatchStones || 0) + 1;
    G.digSession.totalFound.item++;
    var itemName = getItemName(itemId);
    reward = { icon: '📦', name: itemName, amount: 1, color: '#3b82f6' };
  } else if (cellType === 'trap') {
    reward = { icon: '💥', name: '陷阱', amount: 0, color: '#ef4444' };
  } else if (cellType === 'silver_chest') {
    var dia = randomInt(1, 3);
    var sGold = Math.floor(pl * randomInt(100, 300));
    addDiamond(dia);
    addGold(sGold);
    G.digSession.totalFound.diamond += dia;
    G.digSession.totalFound.gold += sGold;
    reward = { icon: '🥈', name: '银宝箱：钻石×' + dia + ' + 金币×' + sGold, amount: dia, color: '#9ca3af' };
  } else if (cellType === 'locked_chest') {
    var lDia = randomInt(5, 10);
    addDiamond(lDia);
    G.digSession.totalFound.diamond += lDia;
    // 锁宝箱额外掉落T3-T4蛋
    var eggTier = randomInt(2, 3);
    var egg = generateEgg(eggTier);
    G.eggs.push(egg);
    G.digSession.totalFound.egg++;
    reward = { icon: '🔒', name: '锁宝箱：钻石×' + lDia + ' + T' + (eggTier + 1) + '宠物蛋', amount: lDia, color: '#f59e0b' };
  } else if (cellType === 'golden') {
    // 黄金宝藏：彩蛋级奖励
    var gDia = randomInt(10, 20);
    addDiamond(gDia);
    G.digSession.totalFound.diamond += gDia;
    var gEggTier = randomInt(3, 4);
    var gEgg = generateEgg(gEggTier);
    G.eggs.push(gEgg);
    G.digSession.totalFound.egg++;
    // 额外掉落月华露
    var moonItem = G.inventory.find(function(i) { return i.id === 'moon_dew'; });
    if (moonItem) moonItem.count += 2;
    else G.inventory.push({ id: 'moon_dew', count: 2 });
    G.digSession.totalFound.item += 2;
    reward = { icon: '🌟', name: '黄金宝藏！钻石×' + gDia + ' + T' + (gEggTier + 1) + '蛋 + 月华露×2', amount: gDia, color: '#fde047' };
  }
  return reward;
}

// 使用透视镜
function useDigLens(idx) {
  if (!G.digSession) return;
  if (idx < 0 || idx >= 9) return;
  var cell = G.digSession.grid[idx];
  if (cell.revealed) {
    showToast('该格子已挖掘，无需透视', 'error');
    return;
  }
  if (cell.peeked) {
    showToast('该格子已透视过了', 'error');
    return;
  }
  var lensItem = G.inventory.find(function(i) { return i.id === 'dig_lens'; });
  if (!lensItem || lensItem.count <= 0) {
    showToast('没有透视镜！', 'error');
    return;
  }
  lensItem.count--;
  if (lensItem.count <= 0) {
    var idx2 = G.inventory.indexOf(lensItem);
    if (idx2 >= 0) G.inventory.splice(idx2, 1);
  }
  cell.peeked = true;
  G.digSession.lensUsed.push(idx);
  saveGame();
  var typeInfo = DIG_CELL_TYPES.find(function(t) { return t.type === cell.type; });
  showToast('🔍 透视发现：' + (typeInfo ? typeInfo.icon + ' ' + typeInfo.name : '未知'), 'info');
  if (typeof render === 'function') render();
}

// 使用探宝铲增加挖掘次数
function useDigShovel() {
  if (!G.digSession) return;
  if (G.digSession.digsLeft >= 9) {
    showToast('挖掘次数已达上限！', 'error');
    return;
  }
  var shovelItem = G.inventory.find(function(i) { return i.id === 'dig_shovel'; });
  if (!shovelItem || shovelItem.count <= 0) {
    showToast('没有探宝铲！', 'error');
    return;
  }
  shovelItem.count--;
  if (shovelItem.count <= 0) {
    var idx = G.inventory.indexOf(shovelItem);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  G.digSession.digsLeft++;
  G.digSession.maxDigs = Math.max(G.digSession.maxDigs, G.digSession.digsLeft);
  saveGame();
  showToast('⛏️ 探宝铲使用成功！挖掘次数 +1（剩余 ' + G.digSession.digsLeft + ' 次）', 'success');
  if (typeof render === 'function') render();
}

// 结束挖密藏会话
function endDigSession() {
  if (!G.digSession) return;
  var s = G.digSession;
  var summary = '挖宝结束！';
  var parts = [];
  if (s.totalFound.gold > 0) parts.push('金币 ' + s.totalFound.gold.toLocaleString());
  if (s.totalFound.gem > 0) parts.push('宝石 ×' + s.totalFound.gem);
  if (s.totalFound.item > 0) parts.push('道具 ×' + s.totalFound.item);
  if (s.totalFound.diamond > 0) parts.push('钻石 ×' + s.totalFound.diamond);
  if (s.totalFound.egg > 0) parts.push('宠物蛋 ×' + s.totalFound.egg);
  if (parts.length > 0) summary += '获得：' + parts.join('、');
  else summary += '本次没有找到宝藏';
  G.digSession = null;
  saveGame();
  showToast(summary, 'info');
  if (typeof render === 'function') render();
}