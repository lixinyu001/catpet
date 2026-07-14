// ===== economy.js : 鐗╁搧銆佷换鍔°€佽浆鐢熴€佸銆佸競鍦?=====

// ==================== ITEMS ====================

function getItemName(id) {
  // v2.8.0 需求2.1：优先从 ITEM_CONFIG 查询中文名
  if (typeof ITEM_CONFIG !== 'undefined' && ITEM_CONFIG[id] && ITEM_CONFIG[id].name) {
    return ITEM_CONFIG[id].name;
  }
  // v2.8.0 需求2.2：宝石道具动态名称（gem_{type}_{level}）
  if (id && id.indexOf('gem_') === 0) {
    var parts = id.split('_');
    if (parts.length >= 3) {
      var gemType = parts[1];
      var gemLv = parts[2];
      var gemDef = (typeof GEM_TYPES !== 'undefined') ? GEM_TYPES.find(function(g) { return g.id === gemType; }) : null;
      if (gemDef) return gemDef.name + '+' + gemLv;
      // 兼容 ui.js 未加载时的 fallback（v2.9.0 需求1.1：移除 hp/mp）
      var gemNames = { vit:'体质宝石', str:'力量宝石', agi:'敏捷宝石', end:'耐力宝石', mag:'魔力宝石', int:'魔力宝石', hp:'体质宝石', mp:'魔力宝石' };
      if (gemNames[gemType]) return gemNames[gemType] + '+' + gemLv;
    }
  }
  const names = {
    exp_ticket: '经验副本门票', gold_ticket: '金币副本门票', egg_ticket: '蛋之森林门票',
    skill_ticket: '技能秘境门票', forge_ticket: '强化石矿脉门票', map_ticket: '藏宝遗迹门票', gem_ticket: '宝石秘洞门票', pet_ticket: '宠物秘境门票',
    blood_dungeon_ticket: '血统副本门票',
    hatch_boost: '孵化加速器', hatch_stone: '孵化石', fusion_stone: '融合石', rare_egg: '稀有宠物蛋',
    moon_dew: '月华露',
    forge_stone_low: '低级强化石', forge_stone_mid: '中级强化石', forge_stone_high: '高级强化石',
    protection_stone: '保底石',
    yuanxiao_str: '力量元宵', yuanxiao_con: '体质元宵', yuanxiao_agi: '敏捷元宵', yuanxiao_end: '耐力元宵', yuanxiao_mag: '魔力元宵',
    exp_book: '经验书', exp_book_mid: '中级经验书', exp_book_high: '高级经验书',
    dragon_scale: '龙鳞', dragon_tooth: '龙牙', dragon_crystal: '龙晶',
    demon_horn: '恶魔角', demon_heart: '恶魔之心', demon_contract: '恶魔契约',
    ancient_coin: '古代金币', magic_book: '魔法书', artifact_shard: '神器碎片',
    guiyuan_pill: '归元丹', guixu_pill: '归虚丹', pet_reset_pill: '宠物洗点丹',
    rename_card: '改名卡',
    blood_orb_low: '低级血统珠', blood_orb_mid: '中级血统珠', blood_orb_high: '高级血统珠',
    // 需求7：打孔系统道具
    socket_nail: '打孔钉', repair_glue: '修补胶',
    // 装备洗练系统道具
    refine_stone: '洗练石',
    // [已移除] 宠物进阶丸已下架
    // 需求7：孵化结晶
    hatch_crystal: '孵化结晶',
    // 需求10：宠物炼化道具
    refine_essence: '炼化精魄', refine_crystal: '炼化晶石',
    // 需求4：宠物装备材料中文名
    // v2.11.0 需求2.1：远古符文（宠装）→ 战兵图册
    mystic_crystal_low: '低级神秘水晶', mystic_crystal_mid: '中级神秘水晶', mystic_crystal_high: '高级神秘水晶',
    war_book_low: '低级战兵图册', war_book_mid: '中级战兵图册', war_book_high: '高级战兵图册',
    // v2.2.0 需求9：挖密藏系统道具（透视镜/钥匙已移除）
    dig_map: '密藏图', dig_shovel: '探宝铲',
    // 神兽精华
    divine_essence: '神兽精华',
    // 延寿道具
    lifespan_low: '低级延寿丹', lifespan_mid: '中级延寿丹', lifespan_high: '高级延寿丹',
    // 宠物进阶道具
    evolution_crystal_low: '低级进化晶石', evolution_crystal_mid: '中级进化晶石', evolution_crystal_high: '高级进化晶石',
    // 需求：竞技场挑战券
    arena_ticket: '竞技场挑战券',
    // v2.7.0：金币箱与密藏碎片（已在ITEM_CONFIG中定义，此处作为fallback）
    gold_chest_small: '小金币箱', gold_chest_mid: '中金币箱', gold_chest_large: '大金币箱',
    treasure_fragment_1: '密藏碎片·青龙', treasure_fragment_2: '密藏碎片·白虎',
    treasure_fragment_3: '密藏碎片·朱雀', treasure_fragment_4: '密藏碎片·玄武',
    treasure_fragment_5: '密藏碎片·麒麟',
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
      // 血统重构：从 PET_BLOOD_ALL 查询血统名称
      var _blData = (typeof PET_BLOOD_ALL !== 'undefined' && item.sourcePetName) ? PET_BLOOD_ALL[item.sourcePetName] : null;
      var blName = _blData ? _blData.name : '未知血统';
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
      // 需求：自动分解固定获得金币，小概率额外获得强化石
      var goldGain = ((equip.level || 1) * 10 + equipRarityIdx * 50) * (1 + equipRarityIdx);
      addGold(goldGain);
      var logMsg = '♻️ 自动分解 ' + (equip.name || '装备') + ' → 💰金币×' + goldGain;
      // 20%概率额外获得强化石
      if (Math.random() < 0.20) {
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
        logMsg += '，' + stoneName + '×' + count;
      }
      if (typeof addBattleLog === 'function') {
        addBattleLog('loot', logMsg);
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
// v2.11.0 需求4.1：掉落等级向下取最近的5级档位（lv89→85, lv91→90）
// v2.11.0 需求4.2：解锁等级下调至20级，每5级一档（20/25/30...），基础属性+20%，阶段增幅×1.1
//   stage = max(1, floor((level - 20) / 5) + 1)，stage1=lv20-24, stage2=lv25-29, ...
//   baseVal = STAGE1_BASE[slot] × 1.2(基础强化) × (1.1 ^ (stage - 1)) × (1 + rarityIdx × 0.3)
//   v3.1.0 需求1.1：阶段增幅由50%(×1.5)下调至10%(×1.1)
function generatePetEquip(rarity, slot, level) {
  if (!rarity) rarity = 'rare';
  if (!slot) slot = pickRandom(PET_EQUIP_SLOTS).id;
  if (!level) level = G.player.level || 1;
  // v2.11.0 需求4.1：掉落等级向下取最近的5级档位
  level = Math.floor(level / 5) * 5;
  if (level < 20) level = 20; // 最低20级
  var rarityIdx = PET_EQUIP_RARITIES.indexOf(rarity);
  if (rarityIdx < 0) { rarityIdx = 0; rarity = 'rare'; }
  var baseNames = PET_EQUIP_BASE_NAMES[slot] || PET_EQUIP_BASE_NAMES.attack;
  var name = pickRandom(baseNames);
  // v2.11.0 需求4.2：阶段制基础属性
  // stage1（lv20-24）基础值：attack=80×1.2=96, hp=240×1.2=288, defense=60×1.2=72
  // 每升一档（+5级）基础属性 ×1.1（阶段增幅10%）—— v3.1.0 需求1.1：由50%下调至10%
  var stage = Math.max(1, Math.floor((level - 20) / 5) + 1);
  var stageMult = Math.pow(1.1, stage - 1);
  var baseBoost = 1.2; // v2.11.0 需求4.2：基础属性整体提升20%
  var rarityMult = 1 + rarityIdx * 0.3;
  // 基础词条：1-攻击/灵力, 2-气血, 3-防御
  var baseStat = '';
  var baseVal = 0;
  switch (slot) {
    case 'attack':
      baseStat = '攻击力';
      baseVal = Math.floor(80 * baseBoost * stageMult * rarityMult);
      break;
    case 'hp':
      baseStat = '气血';
      baseVal = Math.floor(240 * baseBoost * stageMult * rarityMult);
      break;
    case 'defense':
      baseStat = '防御力';
      baseVal = Math.floor(60 * baseBoost * stageMult * rarityMult);
      break;
  }
  // 随机词条：优秀0, 稀有1, 史诗2, 传说3, 神话4
  var affixCount = PET_EQUIP_AFFIX_COUNT[rarityIdx];
  var affixes = [];
  var usedAffixIds = {};
  for (var i = 0; i < affixCount; i++) {
    // 需求5修复：过滤掉技能池为空的技能词条，避免生成无效空词条
    var available = PET_AFFIX_TYPES.filter(function(a) {
      if (usedAffixIds[a.id]) return false;
      if (a.kind === 'skill' && (!a.skillPool || a.skillPool.length === 0)) return false;
      return true;
    });
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
        // 力量/体质/敏捷/耐力/魔力
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
      // 需求5/8：技能词条类——从技能池随机选一个技能ID作为值
      // 需求5修复：技能池为空时跳过该词条，避免生成无效空词条
      if (affix.skillPool && affix.skillPool.length > 0) {
        value = pickRandom(affix.skillPool);
      } else {
        // 无技能池则跳过此词条，不占用词条位
        continue;
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

// v2.11.0 需求4.1：装备同步功能 —— 将当前穿戴的宠物装备提升至与人物当前等级匹配的档位等级
// 消耗：少量神秘水晶 + 战兵图册；保留强化等级、随机词条等养成进度，仅提升基础属性与等级档位
function syncPetEquip(petId, slot) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return false; }
  if (!pet.petEquipment) { showToast('该宠物无装备', 'error'); return false; }
  var equip = pet.petEquipment[slot];
  if (!equip) { showToast('该栏位无装备', 'error'); return false; }
  // 计算目标等级（向下取最近的5级档位）
  var targetLevel = Math.floor((G.player.level || 1) / 5) * 5;
  if (targetLevel < 20) targetLevel = 20;
  if ((equip.level || 1) >= targetLevel) {
    showToast('装备等级已达到当前人物档位（Lv.' + targetLevel + '），无需同步', 'info');
    return false;
  }
  // 计算消耗：按等级差档位数决定材料消耗
  var oldStage = Math.max(1, Math.floor((equip.level - 20) / 5) + 1);
  var newStage = Math.max(1, Math.floor((targetLevel - 20) / 5) + 1);
  var stageDiff = newStage - oldStage;
  if (stageDiff <= 0) { showToast('装备等级已达标，无需同步', 'info'); return false; }
  // 材料消耗：每档差消耗1低级材料×档位差；高档位消耗中级/高级
  var matGrade = 'low';
  if (targetLevel >= 50) matGrade = 'high';
  else if (targetLevel >= 35) matGrade = 'mid';
  var crystalKey = 'mystic_crystal_' + matGrade;
  var warBookKey = 'war_book_' + matGrade;
  var crystalCost = stageDiff * 2;
  var warBookCost = stageDiff * 1;
  var goldCost = stageDiff * 5000;
  // 检查材料
  if ((G.petEquipMaterials[crystalKey] || 0) < crystalCost) {
    showToast(PET_EQUIP_MATERIAL_NAMES[crystalKey] + ' 不足（需要 ' + crystalCost + '）', 'error');
    return false;
  }
  if ((G.petEquipMaterials[warBookKey] || 0) < warBookCost) {
    showToast(PET_EQUIP_MATERIAL_NAMES[warBookKey] + ' 不足（需要 ' + warBookCost + '）', 'error');
    return false;
  }
  if ((G.player.gold || 0) < goldCost) {
    showToast('金币不足（需要 ' + goldCost + '）', 'error');
    return false;
  }
  // 扣除消耗
  G.petEquipMaterials[crystalKey] -= crystalCost;
  G.petEquipMaterials[warBookKey] -= warBookCost;
  G.player.gold -= goldCost;
  // 重新计算基础属性（保留稀有度、词条、套装等）
  var rarityIdx = PET_EQUIP_RARITIES.indexOf(equip.rarity);
  if (rarityIdx < 0) rarityIdx = 0;
  var stageMult = Math.pow(1.1, newStage - 1); // v3.1.0 需求1.1：阶段增幅由50%下调至10%
  var baseBoost = 1.2;
  var rarityMult = 1 + rarityIdx * 0.3;
  switch (equip.slot) {
    case 'attack':
      equip.baseValue = Math.floor(80 * baseBoost * stageMult * rarityMult);
      break;
    case 'hp':
      equip.baseValue = Math.floor(240 * baseBoost * stageMult * rarityMult);
      break;
    case 'defense':
      equip.baseValue = Math.floor(60 * baseBoost * stageMult * rarityMult);
      break;
  }
  equip.level = targetLevel;
  // 清除封印状态（同步后装备为当前等级，无需封印）
  if (equip.sealed) {
    equip.sealed = false;
    delete equip.sealedLevel;
  }
  // 清除属性缓存
  if (pet._statsCache) delete pet._statsCache;
  saveGame();
  showToast('✓ 装备同步成功！' + equip.name + ' 已提升至 Lv.' + targetLevel, 'success');
  if (typeof render === 'function') render();
  return true;
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
    statAdditions: { 力量:0, 体质:0, 敏捷:0, 耐力:0, 魔力:0, 气血:0, 攻击力:0, 防御力:0, 速度:0 },
    aptAdditions: { 力量资质:0, 体质资质:0, 敏捷资质:0, 耐力资质:0, 魔力资质:0 },
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
        // 需求5/8：技能词条不受封印影响，装备时附加对应技能（不占6格上限）
        // 需求5修复：增加空值校验、去重检查、技能对象完整性校验
        var skillId = a.value;
        if (skillId && typeof ALL_SKILLS !== 'undefined') {
          // 去重：同一技能ID不重复挂载（多件装备可能掉落相同技能词条）
          var alreadyAdded = result.skillAdditions.some(function(s) { return s.id === skillId; });
          if (!alreadyAdded) {
            var skill = ALL_SKILLS.find(function(s) { return s.id === skillId; });
            if (skill && skill.name && skill.desc) {
              // 推送完整技能对象（含effect/tier等），并标记为装备技能
              result.skillAdditions.push(Object.assign({}, skill, { isEquipSkill: true }));
            }
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

// ==================== 符文系统（对标阴阳师御魂）====================
// 符文生成：按品质和位置生成一枚随机符文
// v2.8.0 需求6.1：主属性从号位池中随机选取（1/3/5固定值，2/4/6百分比/五维）
function generateRune(grade, slot, setId) {
  if (!grade) grade = rollRuneGrade('cave');
  var gradeIdx = RUNE_GRADES.indexOf(grade);
  if (gradeIdx < 0) { gradeIdx = 0; grade = 'common'; }
  if (!slot) slot = randomInt(1, 6);
  if (!setId) setId = pickRandom(RUNE_SETS).id;

  // 主属性：从号位池中随机选取
  var slotDef = RUNE_SLOTS.find(function(s) { return s.id === slot; });
  var pool = (slotDef && Array.isArray(slotDef.mainStatPool) && slotDef.mainStatPool.length > 0)
    ? slotDef.mainStatPool
    : ['atk_flat']; // 兼容旧数据
  var mainStatType = pickRandom(pool);
  var mainStatValue = calcRuneMainStat(mainStatType, gradeIdx, 0, slot);

  // 副属性：随机选取（不与主属性类型重复）
  var subCount = RUNE_GRADE_SUB_COUNT[gradeIdx] || 1;
  var availableSubs = RUNE_SUB_STAT_TYPES.filter(function(t) { return t.id !== mainStatType; });
  var subStats = [];
  for (var i = 0; i < subCount && availableSubs.length > 0; i++) {
    var idx = randomInt(0, availableSubs.length - 1);
    var subDef = availableSubs.splice(idx, 1)[0];
    var val = randomFloat(subDef.baseRange[0], subDef.baseRange[1]);
    // 品质加成
    val *= (1 + gradeIdx * 0.2);
    if (subDef.isPct) val = Math.round(val * 1000) / 1000;
    else val = Math.floor(val);
    subStats.push({ type: subDef.id, value: val });
  }

  return {
    id: 'rune_' + Date.now() + '_' + randomInt(1000, 9999) + '_' + Math.floor(Math.random() * 1000),
    setId: setId,
    slot: slot,
    grade: grade,
    level: 0,
    mainStat: { type: mainStatType, value: mainStatValue },
    subStats: subStats,
  };
}

// 添加符文到背包
function addRuneToBag(rune) {
  if (!rune) return;
  if (!G.runeBag) G.runeBag = [];
  G.runeBag.push(rune);
}

// 装备符文到宠物指定位置
function equipRune(petId, runeId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (!pet.runes) pet.runes = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
  var idx = G.runeBag.findIndex(function(r) { return r.id === runeId; });
  if (idx < 0) { showToast('符文不存在', 'error'); return; }
  var rune = G.runeBag[idx];
  var slot = rune.slot;
  // 卸下旧符文
  var old = pet.runes[slot];
  if (old) G.runeBag.push(old);
  // 装备新符文
  pet.runes[slot] = rune;
  G.runeBag.splice(idx, 1);
  saveGame();
  // v3.0 主线任务追踪：符文装备
  if (typeof _trackRuneEquip === 'function') _trackRuneEquip();
  showToast('已装备 ' + getRuneDisplayName(rune) + ' 到 ' + getPetDisplayName(pet), 'success');
  if (typeof render === 'function') render();
}

// 卸下符文
function unequipRune(petId, slot) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet || !pet.runes) return;
  var old = pet.runes[slot];
  if (!old) return;
  if (!G.runeBag) G.runeBag = [];
  G.runeBag.push(old);
  pet.runes[slot] = null;
  saveGame();
  showToast('已卸下 ' + getRuneDisplayName(old), 'info');
  if (typeof render === 'function') render();
}

// 符文强化升级
function upgradeRune(runeId) {
  if (!G.runeBag) G.runeBag = [];
  var rune = G.runeBag.find(function(r) { return r.id === runeId; });
  // 也可能在宠物身上
  if (!rune) {
    G.pets.forEach(function(pet) {
      if (pet.runes && !rune) {
        for (var s = 1; s <= 6; s++) {
          if (pet.runes[s] && pet.runes[s].id === runeId) { rune = pet.runes[s]; return; }
        }
      }
    });
  }
  if (!rune) { showToast('符文不存在', 'error'); return; }
  if (rune.level >= RUNE_MAX_LEVEL) { showToast('符文已达最高等级', 'error'); return; }
  // 检查材料
  // v2.11.0 需求2.1：符文强化消耗远古符文，从 runeMaterials 读取
  var cost = RUNE_UPGRADE_COST.getCost(rune.level);
  if (!G.runeMaterials) G.runeMaterials = { ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
  var matItem = G.runeMaterials[cost.material] || 0;
  if (matItem < cost.count) {
    var matName = getItemName(cost.material);
    showToast('材料不足！需要 ' + matName + ' ×' + cost.count + '（当前 ' + matItem + '）', 'error');
    return;
  }
  // 检查金币
  var gradeIdx = RUNE_GRADES.indexOf(rune.grade);
  var goldCost = Math.floor(RUNE_UPGRADE_COST.getGoldCost(rune.level, gradeIdx));
  if ((G.player.gold || 0) < goldCost) {
    showToast('金币不足！需要 ' + goldCost + ' 金币', 'error');
    return;
  }
  // 消耗材料和金币
  G.runeMaterials[cost.material] -= cost.count;
  G.player.gold -= goldCost;
  // v2.9.0 需求3.2：记录历史强化累计消耗的符文强化材料总量（用于分解时30%返还）
  if (!rune.totalEnhanceMats) rune.totalEnhanceMats = {};
  rune.totalEnhanceMats[cost.material] = (rune.totalEnhanceMats[cost.material] || 0) + cost.count;
  // 升级
  rune.level++;
  // 更新主属性
  rune.mainStat.value = calcRuneMainStat(rune.mainStat.type, gradeIdx, rune.level, rune.slot);
  // 需求：符文强化至+3/+6/+9/+12时，触发以下效果：要么新增1条副词条，要么随机强化1条已有副词条
  if (rune.level === 3 || rune.level === 6 || rune.level === 9 || rune.level === 12) {
    var MAX_SUB_STATS = 4; // 副词条上限
    var canAddNew = rune.subStats.length < MAX_SUB_STATS;
    var canEnhance = rune.subStats.length > 0;
    var action = null; // 'add' or 'enhance'
    if (canAddNew && canEnhance) {
      // 50%概率新增，50%概率强化
      action = Math.random() < 0.5 ? 'add' : 'enhance';
    } else if (canAddNew) {
      action = 'add';
    } else if (canEnhance) {
      action = 'enhance';
    }
    if (action === 'add') {
      // 新增1条副词条：选择不与主属性和已有副属性重复的类型
      var usedTypes = {};
      usedTypes[rune.mainStat.type] = true;
      rune.subStats.forEach(function(s) { usedTypes[s.type] = true; });
      var availableSubs = RUNE_SUB_STAT_TYPES.filter(function(t) { return !usedTypes[t.id]; });
      if (availableSubs.length > 0) {
        var subDef = availableSubs[randomInt(0, availableSubs.length - 1)];
        var val = randomFloat(subDef.baseRange[0], subDef.baseRange[1]);
        val *= (1 + gradeIdx * 0.2);
        if (subDef.isPct) val = Math.round(val * 1000) / 1000;
        else val = Math.floor(val);
        rune.subStats.push({ type: subDef.id, value: val });
        showToast('✨ 符文强化+' + rune.level + '：新增副词条「' + subDef.name + '」！', 'success');
      } else {
        // 无可新增类型，改为强化
        action = 'enhance';
      }
    }
    if (action === 'enhance' && rune.subStats.length > 0) {
      var subIdx = randomInt(0, rune.subStats.length - 1);
      // v2.9.0 需求3.3：符文强化时随机词条的成长幅度为当前词条增量的2倍
      var baseIncrement = RUNE_SUB_STAT_INCREMENT[rune.subStats[subIdx].type] || 1;
      var increment = baseIncrement * 2;
      rune.subStats[subIdx].value += increment;
      if (rune.subStats[subIdx].type.indexOf('pct') >= 0 || rune.subStats[subIdx].type === 'crit_rate' || rune.subStats[subIdx].type === 'crit_dmg') {
        rune.subStats[subIdx].value = Math.round(rune.subStats[subIdx].value * 1000) / 1000;
      }
      var subDef2 = RUNE_SUB_STAT_TYPES.find(function(t) { return t.id === rune.subStats[subIdx].type; });
      showToast('✨ 符文强化+' + rune.level + '：副词条「' + (subDef2 ? subDef2.name : rune.subStats[subIdx].type) + '」+ ' + increment + '（2倍强化）！', 'success');
    }
  }
  saveGame();
  if (typeof render === 'function') render();
}

// 分解符文获得材料
// v2.9.0 需求3.2：分解时统计该符文历史强化累计消耗的符文强化材料总量，按 30% 比例返还
function decomposeRune(runeId) {
  if (!G.runeBag) G.runeBag = [];
  var idx = G.runeBag.findIndex(function(r) { return r.id === runeId; });
  if (idx < 0) { showToast('符文不存在', 'error'); return; }
  var rune = G.runeBag[idx];
  var gradeIdx = RUNE_GRADES.indexOf(rune.grade);
  if (!G.petEquipMaterials) G.petEquipMaterials = {};
  var returnedMaterials = {}; // { materialId: count }
  var totalReturned = 0;
  // v2.9.0 需求3.2：按历史强化累计消耗的30%返还
  if (rune.totalEnhanceMats && typeof rune.totalEnhanceMats === 'object') {
    Object.keys(rune.totalEnhanceMats).forEach(function(matId) {
      var consumed = rune.totalEnhanceMats[matId] || 0;
      if (consumed <= 0) return;
      var refund = Math.floor(consumed * 0.30); // 30%返还，向下取整
      if (refund > 0) {
        returnedMaterials[matId] = (returnedMaterials[matId] || 0) + refund;
        totalReturned += refund;
      }
    });
  } else {
    // 向后兼容：旧符文无 totalEnhanceMats 记录，使用原估算逻辑（按品质+等级）
    var matId, matCount;
    if (gradeIdx <= 1) { matId = 'ancient_rune_low'; matCount = 1 + gradeIdx; }
    else if (gradeIdx <= 3) { matId = 'ancient_rune_mid'; matCount = 1 + (gradeIdx - 2); }
    else { matId = 'ancient_rune_high'; matCount = 2; }
    matCount += Math.floor(rune.level / 3);
    if (matCount > 0) {
      returnedMaterials[matId] = matCount;
      totalReturned = matCount;
    }
  }
  // 发放返还材料
  // v2.11.0 需求2.1：符文分解的远古符文材料应存入 runeMaterials，而非 petEquipMaterials
  if (totalReturned === 0) {
    showToast('该符文无强化历史，分解无材料返还', 'info');
  } else {
    var msgParts = [];
    Object.keys(returnedMaterials).forEach(function(matId) {
      var c = returnedMaterials[matId];
      if (!G.runeMaterials) G.runeMaterials = { ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
      G.runeMaterials[matId] = (G.runeMaterials[matId] || 0) + c;
      msgParts.push(getItemName(matId) + ' ×' + c);
    });
    showToast('♻️ 分解符文获得 ' + msgParts.join('，') + '（30%强化材料返还）', 'success');
  }
  G.runeBag.splice(idx, 1);
  saveGame();
  if (typeof render === 'function') render();
}

// ==================== 进化之梯活动（原符文循环，v2.8.0重构） ====================
// v2.8.0 需求4.1：符文循环 → 进化之梯，奖励池替换为进化晶石
// 每日3次挑战，按战力获得进化晶石奖励
function startRuneCycleChallenge() {
  var today = new Date().toDateString();
  if (!G.runeCycleUsed) G.runeCycleUsed = {};
  var usedCount = G.runeCycleUsed[today] || 0;
  var activityName = (RUNE_CYCLE_CONFIG.name || '进化之梯');
  if (usedCount >= RUNE_CYCLE_CONFIG.dailyLimit) {
    showToast('今日' + activityName + '挑战次数已用完', 'error');
    return;
  }
  if (G.player.level < RUNE_CYCLE_CONFIG.minLevel) {
    showToast('需要 Lv.' + RUNE_CYCLE_CONFIG.minLevel + ' 解锁' + activityName, 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  // 记录次数
  G.runeCycleUsed[today] = usedCount + 1;
  // 按战力确定档位
  var cp = Math.floor(getPlayerCombatPower());
  var tier = RUNE_CYCLE_CONFIG.tiers[0];
  for (var i = 0; i < RUNE_CYCLE_CONFIG.tiers.length; i++) {
    if (cp >= RUNE_CYCLE_CONFIG.tiers[i].cpMin) tier = RUNE_CYCLE_CONFIG.tiers[i];
  }
  var tierIdx = RUNE_CYCLE_CONFIG.tiers.indexOf(tier);
  // v2.8.0 需求4.1：发放进化晶石奖励（替换原符文材料）
  var gained = [];
  function _addCrystalItem(itemId, name, count) {
    var existing = G.inventory.find(function(i) { return i.id === itemId; });
    if (existing) existing.count += count;
    else G.inventory.push({ id: itemId, count: count });
    gained.push(name + ' ×' + count);
  }
  if (tier.crystalLow > 0) {
    _addCrystalItem('evolution_crystal_low', '低级进化晶石', tier.crystalLow);
  }
  if (tier.crystalMid > 0) {
    _addCrystalItem('evolution_crystal_mid', '中级进化晶石', tier.crystalMid);
  }
  if (tier.crystalHigh > 0) {
    _addCrystalItem('evolution_crystal_high', '高级进化晶石', tier.crystalHigh);
  }
  // 经验和金币
  var expGain = 500 + G.player.level * 20;
  var goldGain = 1000 + G.player.level * 50;
  addExp(expGain);
  addGold(goldGain);
  saveGame();
  var msg = '🌟 ' + activityName + '挑战完成！战力 ' + cp.toLocaleString() + '（第' + (tierIdx + 1) + '档），获得：' + gained.join('、');
  showToast(msg, 'success');
  if (typeof addActivityLog === 'function') {
    addActivityLog('runecycle', msg + '，经验 +' + expGain + '，金币 +' + goldGain, 'win');
  }
  if (typeof updateDailyTask === 'function') updateDailyTask('rune_cycle', 1);
  if (typeof render === 'function') render();
}

// 获取符文显示名称
function getRuneDisplayName(rune) {
  if (!rune) return '';
  var setDef = getRuneSet(rune.setId);
  var gradeIdx = RUNE_GRADES.indexOf(rune.grade);
  var gradeName = RUNE_GRADE_NAMES[gradeIdx] || rune.grade;
  var setName = setDef ? setDef.name : '未知';
  return '[' + gradeName + ']' + setName + '(' + rune.slot + '号)';
}

// 计算宠物符文加成（含套装效果）
// 返回 { statAdditions, setBonuses, setProgress }
// v2.8.0 需求6.1：新增 魔法值/dodgeRate 字段，支持五维/魔法/闪避率主属性
function getRuneBonus(pet) {
  var result = {
    statAdditions: { 力量: 0, 体质: 0, 敏捷: 0, 耐力: 0, 魔力: 0, 气血: 0, 攻击力: 0, 防御力: 0, 速度: 0, 灵力: 0, 魔法值: 0 },
    pctAdditions: { atkPct: 0, defPct: 0, hpPct: 0, spdPct: 0, intPct: 0, allPct: 0, critRate: 0, critDmg: 0, dmgReduce: 0, regenPct: 0, vampPct: 0, skillDmg: 0, dodgeRate: 0 },
    spdFlat: 0,
    setBonuses: {},
    setProgress: {},
  };
  if (!pet || !pet.runes) return result;
  // 收集套装计数
  var setCounts = {};
  // 遍历6个符文槽位
  for (var slot = 1; slot <= 6; slot++) {
    var rune = pet.runes[slot];
    if (!rune) continue;
    // 套装计数
    if (rune.setId) setCounts[rune.setId] = (setCounts[rune.setId] || 0) + 1;
    // 主属性加成
    applyRuneStatToResult(result, rune.mainStat.type, rune.mainStat.value);
    // 副属性加成
    (rune.subStats || []).forEach(function(sub) {
      applyRuneStatToResult(result, sub.type, sub.value);
    });
  }
  // 套装加成判定
  Object.keys(setCounts).forEach(function(setId) {
    var setDef = getRuneSet(setId);
    if (!setDef) return;
    var count = setCounts[setId];
    result.setProgress[setId] = { count: count, name: setDef.name, color: setDef.color };
    if (count >= 4) {
      result.setBonuses[setId] = { count: 4, bonus: setDef.bonus4, name: setDef.name, color: setDef.color };
      // 应用4件套加成
      applySetBonusToResult(result, setDef.bonus4);
    }
    if (count >= 2) {
      // 2件套加成（叠加在4件套之上）
      if (!result.setBonuses[setId]) {
        result.setBonuses[setId] = { count: 2, bonus: setDef.bonus2, name: setDef.name, color: setDef.color };
      } else {
        result.setBonuses[setId].count = 4; // 已有4件套
      }
      applySetBonusToResult(result, setDef.bonus2);
    }
  });
  return result;
}

// 将符文属性应用到结果对象
// v2.8.0 需求6.1：新增 五维/魔法/闪避率 属性映射
function applyRuneStatToResult(result, statType, value) {
  if (!value) return;
  switch (statType) {
    case 'atk_flat': result.statAdditions.攻击力 += value; break;
    case 'def_flat': result.statAdditions.防御力 += value; break;
    case 'hp_flat':  result.statAdditions.气血 += value; break;
    case 'spd_flat': result.spdFlat += value; break;
    case 'int_flat': result.statAdditions.灵力 += value; break;
    case 'mp_flat':  result.statAdditions.魔法值 += value; break;
    // 五维主属性
    case 'str_flat': result.statAdditions.力量 += value; break;
    case 'agi_flat': result.statAdditions.敏捷 += value; break;
    case 'vit_flat': result.statAdditions.体质 += value; break;
    case 'end_flat': result.statAdditions.耐力 += value; break;
    case 'mag_flat': result.statAdditions.魔力 += value; break;
    // 百分比类
    case 'atk_pct':  result.pctAdditions.atkPct += value; break;
    case 'def_pct':  result.pctAdditions.defPct += value; break;
    case 'hp_pct':   result.pctAdditions.hpPct += value; break;
    case 'crit_rate':result.pctAdditions.critRate += value; break;
    case 'crit_dmg': result.pctAdditions.critDmg += value; break;
    case 'dodge_rate': result.pctAdditions.dodgeRate += value; break;
  }
}

// 将套装加成应用到结果对象
function applySetBonusToResult(result, bonus) {
  if (!bonus) return;
  Object.keys(bonus).forEach(function(k) {
    if (k === 'spdFlat') { result.spdFlat += bonus[k]; return; }
    if (result.pctAdditions.hasOwnProperty(k)) {
      result.pctAdditions[k] += bonus[k];
    }
  });
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
      // 兜底：随机一种（v2.9.0 需求1.1：移除 hp/mp，仅五维类型）
      var allTypes = ['vit', 'str', 'agi', 'end', 'mag'];
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
  // 检测旧版四维/五维属性（兼容旧存档：智力已重命名为魔力，旧存档可能仍有智力字段）
  if (c.力量 !== undefined || c.体质 !== undefined || c.敏捷 !== undefined || c.智力 !== undefined || c.耐力 !== undefined || c.魔力 !== undefined) {
    var oldTotal = (c.力量 || 0) + (c.体质 || 0) + (c.敏捷 || 0) + (c.耐力 || 0) + (c.魔力 || c.智力 || 0);
    // 将旧总等级按比例转换为新系统
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


// ==================== 新进阶系统（进化晶石） ====================
// 旧进阶丸系统已移除，新系统使用进化晶石道具
// 进化晶石产出来源于进化之梯活动（v2.8.0：原符文循环→进化之梯）

/**
 * 获取宠物进阶信息（兼容旧接口，转发到 config.js getPetEvolveInfo）
 */
function getPetAdvanceInfo(pet) {
  if (!pet) return null;
  return getPetEvolveInfo(pet);
}

/**
 * 使用进化晶石增加宠物进阶值
 * @param {string} petId - 宠物ID
 * @param {string} itemTier - 道具品质: 'low' / 'mid' / 'high'
 * @returns {{ ok: boolean, msg: string, crit?: boolean, critMult?: number, gain?: number, advanced?: boolean }}
 */
function useEvolutionCrystal(petId, itemTier) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return { ok: false, msg: '宠物不存在' };

  var evolveInfo = getPetEvolveInfo(pet);
  if (!evolveInfo.canEvolve) {
    if (evolveInfo.maxed) return { ok: false, msg: '该宠物已达到最高进阶形态' };
    return { ok: false, msg: '该宠物不可进阶' };
  }

  var config = EVOLVE_SYSTEM_CONFIG.ITEMS[itemTier];
  if (!config) return { ok: false, msg: '无效的道具品质' };

  // 检查道具库存
  var invItem = G.inventory.find(function(i) { return i.id === config.id; });
  if (!invItem || invItem.count < 1) {
    return { ok: false, msg: '道具不足：' + config.name };
  }

  // 消耗道具
  invItem.count--;
  if (invItem.count <= 0) {
    var idx = G.inventory.indexOf(invItem);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }

  // 暴击计算
  var critResult = calculateEvolutionCrystalValue(itemTier);
  var gain = critResult.value;
  pet.advanceValue = (pet.advanceValue || 0) + gain;

  // 检查是否达到进阶上限
  var advanced = false;
  var advanceMsg = '';
  if (pet.advanceValue >= evolveInfo.advanceValueMax) {
    // 执行进阶
    var result = advancePetEvolve(petId);
    if (result.ok) {
      advanced = true;
      advanceMsg = result.msg;
    }
  }

  return {
    ok: true,
    msg: critResult.crit
      ? '✨ 暴击×' + critResult.critMult + '！获得 ' + gain + ' 点进阶值' + (advanced ? ' | ' + advanceMsg : '')
      : '获得 ' + gain + ' 点进阶值' + (advanced ? ' | ' + advanceMsg : ''),
    crit: critResult.crit,
    critMult: critResult.critMult,
    gain: gain,
    advanced: advanced,
  };
}

// ==================== 符文洞窟活动（原进化森林，v2.8.0重构） ====================
// v2.8.0 需求4.1：进化森林 → 符文洞窟，奖励池替换为符文材料 + 符文成品

/**
 * 获取今日符文洞窟挑战次数
 */
function getEvolutionForestUsedToday() {
  var today = new Date().toDateString();
  return (G.evolutionForestUsed && G.evolutionForestUsed[today]) || 0;
}

/**
 * 进入符文洞窟指定层数战斗（原进化森林，v2.8.0重构）
 * @param {number} layer - 层数 1~5
 * @returns {{ ok: boolean, msg?: string }}
 */
function enterEvolutionForest(layer) {
  if (!EVOLUTION_FOREST_CONFIG) return { ok: false, msg: '活动配置不存在' };
  if (layer < 1 || layer > EVOLUTION_FOREST_CONFIG.layers.length) {
    return { ok: false, msg: '无效的层数' };
  }
  var activityName = EVOLUTION_FOREST_CONFIG.name || '符文洞窟';
  // 等级检查
  if (G.player.level < EVOLUTION_FOREST_CONFIG.minLevel) {
    return { ok: false, msg: '需要 ' + EVOLUTION_FOREST_CONFIG.minLevel + ' 级才能进入' + activityName };
  }
  // 每日次数检查
  var used = getEvolutionForestUsedToday();
  if (used >= EVOLUTION_FOREST_CONFIG.dailyLimit) {
    return { ok: false, msg: '今日挑战次数已用完（' + EVOLUTION_FOREST_CONFIG.dailyLimit + '次/天）' };
  }
  // 检查是否有出战宠物
  var hasPet = false;
  if (G.player.activeTeam) {
    for (var i = 0; i < G.player.activeTeam.length; i++) {
      if (G.player.activeTeam[i]) { hasPet = true; break; }
    }
  }
  if (!hasPet) {
    return { ok: false, msg: '请先设置出战宠物' };
  }

  var layerConfig = EVOLUTION_FOREST_CONFIG.layers[layer - 1];
  var lv = layerConfig.level;
  var lvScale = 1 + lv * 0.012;

  // 生成怪物（参考主线怪物强度公式，使用 layerConfig 的 hpMult/atkMult）
  var monsterHp = Math.floor((40 + lv * 20) * layerConfig.hpMult * lvScale);
  var monsterAtk = Math.floor((4 + lv * 3.8) * layerConfig.atkMult * lvScale);
  var monsterDef = Math.floor(lv * 2.0 * 1.6);
  var monster = {
    id: 'ef_monster_' + Date.now(),
    name: layerConfig.monsterName,
    level: lv,
    hp: monsterHp,
    maxHp: monsterHp,
    atk: monsterAtk,
    def: monsterDef,
    expReward: 0,
    goldReward: 0,
  };

  // 设置战斗上下文：标记为进化森林战斗，存储怪物数据供 spawnMonsterDirect 使用
  G.battleContext = {
    type: 'evolution_forest',
    layer: layer,
    monsterName: layerConfig.monsterName,
    monster: monster,
    title: layerConfig.name + ' - ' + layerConfig.monsterName,
  };

  // 使用 spawnMonsterDirect 进入战斗（battle.js 会检查 G.battleContext）
  if (typeof spawnMonsterDirect === 'function') {
    spawnMonsterDirect();
  }

  return { ok: true };
}

/**
 * 符文洞窟战斗结算（战斗胜利时调用，原进化森林）
 * v2.8.0 需求4.1：奖励池替换为符文材料 + 符文成品
 * 挑战成功发放奖励，挑战失败不扣除挑战次数
 * @param {number} layer - 层数
 * @returns {{ ok: boolean, rewards?: object, msg?: string }}
 */
function settleEvolutionForest(layer) {
  if (!EVOLUTION_FOREST_CONFIG) return { ok: false, msg: '活动配置不存在' };
  if (layer < 1 || layer > EVOLUTION_FOREST_CONFIG.layers.length) {
    return { ok: false, msg: '无效的层数' };
  }

  // 扣除挑战次数（仅成功时扣除）
  var today = new Date().toDateString();
  if (!G.evolutionForestUsed) G.evolutionForestUsed = {};
  if (!G.evolutionForestUsed[today]) G.evolutionForestUsed[today] = 0;
  G.evolutionForestUsed[today]++;

  // 获取奖励配置
  var rewardConfig = EVOLUTION_FOREST_CONFIG.rewards[layer - 1];
  var rewards = { gold: 0, exp: 0, items: [] };

  // 金币奖励
  if (rewardConfig.gold) {
    rewards.gold = randomInt(rewardConfig.gold[0], rewardConfig.gold[1]);
    G.player.gold += rewards.gold;
  }
  // 经验奖励
  if (rewardConfig.exp) {
    rewards.exp = randomInt(rewardConfig.exp[0], rewardConfig.exp[1]);
    if (typeof addExp === 'function') {
      addExp(rewards.exp);
    } else {
      G.player.exp += rewards.exp;
    }
  }
  // v2.8.0 需求4.1：符文材料掉落（替换原进化晶石）
  // v2.11.0 需求2.1：远古符文材料存入 runeMaterials（符文系统独立存储）
  // 低级远古符文材料
  if (rewardConfig.runeLow) {
    var lowCount = randomInt(rewardConfig.runeLow[0], rewardConfig.runeLow[1]);
    if (lowCount > 0) {
      if (!G.runeMaterials) G.runeMaterials = { ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
      G.runeMaterials.ancient_rune_low = (G.runeMaterials.ancient_rune_low || 0) + lowCount;
      rewards.items.push({ id: 'ancient_rune_low', name: '低级远古符文', count: lowCount });
    }
  }
  // 中级远古符文材料
  if (rewardConfig.runeMid && Math.random() < rewardConfig.runeMid.chance) {
    var midCount = rewardConfig.runeMid.count;
    if (!G.runeMaterials) G.runeMaterials = { ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
    G.runeMaterials.ancient_rune_mid = (G.runeMaterials.ancient_rune_mid || 0) + midCount;
    rewards.items.push({ id: 'ancient_rune_mid', name: '中级远古符文', count: midCount });
  }
  // 高级远古符文材料
  if (rewardConfig.runeHigh && Math.random() < rewardConfig.runeHigh.chance) {
    var highCount = rewardConfig.runeHigh.count;
    if (!G.runeMaterials) G.runeMaterials = { ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
    G.runeMaterials.ancient_rune_high = (G.runeMaterials.ancient_rune_high || 0) + highCount;
    rewards.items.push({ id: 'ancient_rune_high', name: '高级远古符文', count: highCount });
  }
  // v2.8.0 需求4.1：成品符文掉落
  if (rewardConfig.runeDropRate && Math.random() < rewardConfig.runeDropRate) {
    if (typeof rollRuneGrade === 'function' && typeof generateRune === 'function' && typeof addRuneToBag === 'function') {
      var grade = rollRuneGrade('cave');
      var rune = generateRune(grade);
      addRuneToBag(rune);
      var runeName = (typeof getRuneDisplayName === 'function') ? getRuneDisplayName(rune) : '成品符文';
      rewards.items.push({ id: 'rune_item', name: runeName, count: 1 });
    }
  }

  // 记录活动日志
  if (typeof addActivityLog === 'function') {
    var logParts = [];
    if (rewards.gold) logParts.push('金币' + rewards.gold);
    if (rewards.exp) logParts.push('经验' + rewards.exp);
    rewards.items.forEach(function(it) { logParts.push(it.name + '×' + it.count); });
    addActivityLog('evolution_forest', '符文洞窟第' + layer + '层通关：' + logParts.join('、'), 'win');
  }

  return { ok: true, rewards: rewards };
}

// ==================== 需求10：宠物炼化系统 ====================

// 执行宠物炼化
// petId: 目标宠物ID
// itemId: 炼化道具ID（refine_essence 或 refine_crystal）
function refinePet(petId, itemId) {
  // 全局开关检查
  if (typeof PET_REFINE_CONFIG !== 'undefined' && PET_REFINE_CONFIG.enabled === false) {
    showToast('炼化功能暂时关闭', 'error');
    return;
  }
  // 功能解锁检查
  if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('pet_refine')) {
    showToast('🔒 需要' + getFeatureUnlockLevel('pet_refine') + '级解锁宠物炼化', 'error');
    return;
  }
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  // 限制1：禁止已上阵宠物（锁定宠物）执行炼化
  if (G.player.activeTeam && G.player.activeTeam.indexOf(petId) >= 0) {
    showToast('❌ 已上阵宠物无法炼化，请先卸下', 'error');
    return;
  }
  // [已移除] 进阶系统已移除，不再限制炼化
  // 检查炼化道具
  var itemConfig = (typeof PET_REFINE_CONFIG !== 'undefined' && PET_REFINE_CONFIG.items) ? PET_REFINE_CONFIG.items[itemId] : null;
  if (!itemConfig) { showToast('无效的炼化道具', 'error'); return; }
  var invItem = G.inventory.find(function(i) { return i.id === itemId; });
  if (!invItem || invItem.count < 1) {
    showToast('❌ 需要1个' + itemConfig.name, 'error');
    return;
  }
  // 收集可抽取的技能（天生技能 + 后天习得技能，排除血统技能和装备技能）
  var allSkills = [];
  if (pet.innateSkills) {
    pet.innateSkills.forEach(function(s) {
      if (s && s.id && s.type !== 'bloodline' && !s.isEquipSkill) allSkills.push(s);
    });
  }
  if (pet.learnedSkills) {
    pet.learnedSkills.forEach(function(s) {
      if (s && s.id && s.type !== 'bloodline' && !s.isEquipSkill) allSkills.push(s);
    });
  }
  if (allSkills.length === 0) {
    showToast('❌ 该宠物没有可抽取的技能', 'error');
    return;
  }
  // 二次确认
  if (!window._refineConfirmed) {
    window._refineConfirmed = true;
    showToast('⚠️ 再次点击确认炼化——宠物和道具将被销毁，不可找回！', 'info');
    if (typeof render === 'function') render();
    return;
  }
  window._refineConfirmed = false;

  // 扣除炼化道具
  invItem.count--;
  if (invItem.count <= 0) {
    var invIdx = G.inventory.indexOf(invItem);
    if (invIdx >= 0) G.inventory.splice(invIdx, 1);
  }

  // 记录宠物名（销毁前）
  var petName = (typeof getPetDisplayName === 'function') ? getPetDisplayName(pet) : pet.name;
  var petRarity = pet.rarity || 'uncommon';

  // 销毁宠物
  var petIdx = G.pets.indexOf(pet);
  if (petIdx >= 0) G.pets.splice(petIdx, 1);

  // 成功率判定
  var successRate = itemConfig.successRate || 0.5;
  var success = Math.random() < successRate;

  if (success) {
    // 随机抽取1个技能
    var extractedSkill = allSkills[Math.floor(Math.random() * allSkills.length)];
    // 转化为技能书
    var existingBook = G.skillBooks.find(function(b) { return b.id === extractedSkill.id; });
    if (existingBook) existingBook.count += 1;
    else G.skillBooks.push({ id: extractedSkill.id, count: 1 });
    var skillName = extractedSkill.name || '未知技能';
    showToast('🔥 炼化成功！' + petName + ' 转化为技能书《' + skillName + '》', 'success');
    addBattleLog('loot', '🔥 炼化成功：' + petName + ' → 技能书《' + skillName + '》（使用' + itemConfig.name + '，成功率' + Math.floor(successRate * 100) + '%）');
    if (typeof addActivityLog === 'function') {
      addActivityLog('refine', '炼化' + petName + '成功，获得技能书《' + skillName + '》', 'win');
    }
  } else {
    showToast('💥 炼化失败...' + petName + '已消散，未产出技能书', 'error');
    addBattleLog('info', '💥 炼化失败：' + petName + ' 已销毁，使用' + itemConfig.name + '（成功率' + Math.floor(successRate * 100) + '%）未成功');
    if (typeof addActivityLog === 'function') {
      addActivityLog('refine', '炼化' + petName + '失败，宠物已销毁', 'lose');
    }
  }
  saveGame();
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
  // 需求：押镖玩法整体战斗强度降低 20%
  var monsterPower = monsterLv * 800 * (1 + stage * 0.3) * 0.8;
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
  // 需求6.1：修正判定顺序，先检查等级和次数，成功进入战斗后才扣除次数
  if (G.player.level < 20) {
    showToast('需要 Lv.20 解锁', 'error');
    return;
  }
  if (usedCount >= 20) {
    showToast('今日宠物秘境次数已用完', 'error');
    return;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return;
  }
  // 需求6.1：仅当成功进入战斗后才扣除次数
  if (typeof enterSpecialDungeon === 'function') {
    var success = enterSpecialDungeon('pet_equip_cave');
    if (success) {
      G.petCaveUsed[today] = (G.petCaveUsed[today] || 0) + 1;
      saveGame();
      // 需求3：每日任务追踪
      if (typeof updateDailyTask === 'function') updateDailyTask('petcave_1', 1);
    }
  } else {
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
// 需求2重构：废除虚假战力，使用宠物真实属性进行战斗模拟
function startActivityBattleModal(opts) {
  if (!opts) return;
  // 需求2兜底：未选择上阵宠物时禁止开启战斗
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先选择上阵宠物', 'error');
    return;
  }
  // 需求：独立战斗胜负逻辑修复——废除预先随机判定，改为基于真实战斗模拟的HP结算
  // winChance 仅用于影响伤害波动倾向（偏向玩家或怪物），胜负由实际HP决定
  var winChance = Math.max(0.05, Math.min(0.98, opts.winChance || 0.5));
  var cp = opts.playerCp || Math.floor(getPlayerCombatPower());
  var monsterPower = opts.monsterPower || (cp * 0.8);

  // 需求2：使用宠物真实属性（HP、攻击力）替代虚假战力推算
  var realPetStats = team.map(function(p) {
    var stats = (typeof getPetStats === 'function') ? getPetStats(p) : null;
    var petCp = (typeof getPetCombatPower === 'function') ? getPetCombatPower(p) : 0;
    return {
      pet: p,
      name: getPetDisplayName(p),
      hp: stats ? Math.max(1, Math.floor(stats.气血 || 0)) : Math.max(1, Math.floor(petCp / 8)),
      atk: stats ? Math.max(1, Math.floor(stats.攻击力 || 0)) : Math.max(1, Math.floor(petCp / 20)),
      cp: petCp,
    };
  });
  // 需求2：真实总HP = 所有上阵宠物HP之和；真实总攻击力 = 所有宠物攻击力之和
  var petMaxHp = realPetStats.reduce(function(sum, s) { return sum + s.hp; }, 0);
  petMaxHp = Math.max(1000, petMaxHp); // 最低兜底
  var petTotalAtk = realPetStats.reduce(function(sum, s) { return sum + s.atk; }, 0);
  petTotalAtk = Math.max(100, petTotalAtk); // 最低兜底
  // 敌人HP基于怪物战力（保留原逻辑，合理推算）
  var enemyMaxHp = Math.max(3000, Math.floor(monsterPower / 6));
  // 敌人攻击力基于怪物战力
  var enemyAtk = Math.max(100, Math.floor(monsterPower / 20));
  var petHp = petMaxHp;
  var enemyHp = enemyMaxHp;
  var logs = [];
  // 需求：独立战斗胜负逻辑修复——胜负由实际HP决定，winChance仅影响伤害倾向
  // 伤害倾向：winChance越高，玩家伤害倍率越高、敌人伤害倍率越低
  var petDmgMult = 0.8 + winChance * 0.8;   // 0.84~1.584
  var enemyDmgMult = 0.8 + (1 - winChance) * 0.8; // 0.84~1.584
  // 模拟回合上限：足够决出胜负（最多30回合）
  var maxTurns = 30;
  for (var t = 0; t < maxTurns; t++) {
    var turn = t + 1;
    var actingPet = realPetStats[t % realPetStats.length];
    // 需求2：玩家伤害基于真实攻击力（含波动±20%）+ winChance倾向
    var petDmg = Math.floor(petTotalAtk * (0.8 + Math.random() * 0.4) * petDmgMult);
    petDmg = Math.max(1, petDmg); // 最低1点伤害
    enemyHp -= petDmg;
    if (enemyHp <= 0) {
      logs.push({ turn: turn, actor: 'pet', target: actingPet.name, dmg: petDmg, enemyHpLeft: 0, petHpLeft: petHp });
      break;
    }
    logs.push({ turn: turn, actor: 'pet', target: actingPet.name, dmg: petDmg, enemyHpLeft: enemyHp, petHpLeft: petHp });
    // 需求2：敌人伤害基于怪物攻击力（含波动±20%，活动怪物伤害下调20%）+ winChance倾向
    var enemyDmg = Math.floor(enemyAtk * (0.8 + Math.random() * 0.4) * 0.8 * enemyDmgMult);
    enemyDmg = Math.max(1, enemyDmg); // 最低1点伤害
    petHp -= enemyDmg;
    if (petHp <= 0) {
      logs.push({ turn: turn, actor: 'enemy', target: '怪物', dmg: enemyDmg, enemyHpLeft: enemyHp, petHpLeft: 0 });
      break;
    }
    logs.push({ turn: turn, actor: 'enemy', target: '怪物', dmg: enemyDmg, enemyHpLeft: enemyHp, petHpLeft: petHp });
  }
  // 需求：基于实际HP判定胜负（修复我方血量/伤害均高于敌方却误判失败的bug）
  // 敌方HP归零 → 胜利；我方HP归零 → 失败；回合耗尽按剩余HP比例判定
  var success;
  if (enemyHp <= 0) {
    success = true;
    enemyHp = 0;
  } else if (petHp <= 0) {
    success = false;
    petHp = 0;
  } else {
    // 回合耗尽：比较剩余HP比例，HP比例高者获胜
    var petRatio = petHp / petMaxHp;
    var enemyRatio = enemyHp / enemyMaxHp;
    success = petRatio >= enemyRatio;
    if (success) enemyHp = 0;
    else petHp = 0;
  }
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
    realPetStats: realPetStats, // 需求2：保存真实宠物属性供UI展示
    logs: logs,
    currentTurn: 0,
    result: null,
    pendingResult: success,
    onComplete: opts.onComplete || null,
    showResultDelay: 1500,
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
  // 血统重构：bloodlineId 不再需要，血统珠仅记录来源宠物名
  var bloodlineId = 'bl_' + pet.name;
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
  // 血统重构：使用 getPetBloodlineSkill 获取宠物实际显示的血统名称
  var actualBl = (typeof getPetBloodlineSkill === 'function') ? getPetBloodlineSkill(pet) : null;
  var blDisplayName = actualBl ? actualBl.name : '血统';
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
  // 血统重构：从 PET_BLOOD_ALL 查询血统名称
  var _blData2 = (typeof PET_BLOOD_ALL !== 'undefined' && pet.name) ? PET_BLOOD_ALL[pet.name] : null;
  // 需求13：植入后优先显示植入来源血统名称
  var _orbBlData = (typeof PET_BLOOD_ALL !== 'undefined' && orb.sourcePetName) ? PET_BLOOD_ALL[orb.sourcePetName] : null;
  var blDisplayName = _orbBlData ? _orbBlData.name : (_blData2 ? _blData2.name : (pet.name + '之血'));
  var qName = (typeof BLOOD_ORB_QUALITY_NAMES !== 'undefined') ? (BLOOD_ORB_QUALITY_NAMES[orb.quality] || orb.quality) : orb.quality;
  showToast('🔮 ' + getPetDisplayName(pet) + ' 已植入血统珠，专属血统「' + blDisplayName + '」获得' + qName + '品质强化', 'success');
  // 需求13：植入成功后关闭植入弹窗，刷新宠物详情页血统技能栏
  if (typeof window !== 'undefined' && window._bloodOrbImplantPetId) window._bloodOrbImplantPetId = null;
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

// ==================== REBIRTH（六道轮回前置） ====================
// 转生条件：1. 角色等级达到maxLevel  2. 六道轮回通关≥10层
function canRebirth() {
  if (G.player.level < G.player.maxLevel) return false;
  if (!G.samsara || G.samsara.maxFloorCleared < SAMSARA_REBIRTH_MIN_FLOOR) return false;
  return true;
}

// 检查六道轮回是否已解锁
function isSamsaraUnlocked() {
  return G.player.level >= SAMSARA_UNLOCK_LEVEL || G.player.rebirth > 0;
}

// 六道轮回：开始挑战
function startSamsaraChallenge() {
  if (!isSamsaraUnlocked()) {
    showToast('需要达到' + SAMSARA_UNLOCK_LEVEL + '级才能参与六道轮回', 'error');
    return false;
  }
  var team = getTeamPets();
  if (team.length === 0) {
    showToast('请先设置出战宠物', 'error');
    return false;
  }
  // 检查寿命限制
  for (var i = 0; i < team.length; i++) {
    if (!team[i].isDivineBeast && team[i].lifespan !== undefined && team[i].lifespan < 50) {
      showToast('宠物【' + getPetDisplayName(team[i]) + '】寿命不足50，无法参与战斗', 'error');
      return false;
    }
  }
  G.samsara.inChallenge = true;
  // v2.8.0 需求5.2：currentFloor 表示已通关层数（0=未通关任何层）
  // 新挑战时不重置 currentFloor，玩家从上次通关进度继续
  if (typeof G.samsara.currentFloor !== 'number' || G.samsara.currentFloor < 0) {
    G.samsara.currentFloor = 0;
  }
  saveGame();
  return true;
}

// 六道轮回：获取下一层数据（v2.8.0 需求5.2：修复挑战失败跳层Bug）
// 语义：currentFloor = 已通关层数，nextFloor = currentFloor + 1 = 即将挑战的层
// 原Bug：samsaraNextFloor 在战斗前就递增 currentFloor，导致失败后仍跳到下一层
// 修复：仅返回下一层数据，不递增；通关后在 samsaraClearFloor 中递增
function samsaraNextFloor() {
  if (!G.samsara || !G.samsara.inChallenge) return null;
  var nextFloorNum = G.samsara.currentFloor + 1;
  var floorData = getSamsaraFloorData(nextFloorNum);
  saveGame();
  return floorData;
}

// 六道轮回：通关当前层（v2.8.0 需求5.2：仅通关时递增层数）
function samsaraClearFloor() {
  if (!G.samsara || !G.samsara.inChallenge) return;
  G.samsara.currentFloor++; // 已通关层数+1
  if (G.samsara.currentFloor > G.samsara.maxFloorCleared) {
    G.samsara.maxFloorCleared = G.samsara.currentFloor;
  }
  saveGame();
}

// 六道轮回：挑战失败（v2.8.0 需求5.2：失败不递增层数，停留当前层）
function samsaraFailChallenge() {
  if (!G.samsara) return;
  G.samsara.inChallenge = false;
  // v2.8.0 需求5.2：失败时 currentFloor 保持不变，玩家可从当前层继续挑战
  saveGame();
}

// 六道轮回：主动退出挑战
function samsaraQuitChallenge() {
  if (!G.samsara) return;
  G.samsara.inChallenge = false;
  saveGame();
}

// 六道轮回：结算转生（通关≥10层时可选择结算）
function samsaraSettleRebirth() {
  if (!G.samsara || G.samsara.currentFloor < SAMSARA_REBIRTH_MIN_FLOOR) {
    showToast('需要通关至少' + SAMSARA_REBIRTH_MIN_FLOOR + '层才能结算转生', 'error');
    return false;
  }
  // 计算轮回积分
  var points = calcSamsaraPoints(G.samsara.currentFloor);
  G.samsara.reincarnationPoints = (G.samsara.reincarnationPoints || 0) + points;
  // 执行转生
  var result = doRebirth();
  if (result) {
    // 转生后重置挑战进度
    G.samsara.inChallenge = false;
    G.samsara.currentFloor = 0;
    showToast('六道轮回结算完成！获得 ' + points + ' 轮回积分', 'success');
    saveGame();
  }
  return result;
}

// 六道轮回：神通抽奖
// v2.11.0 需求7.1：满星（6星）神通从抽取池剔除
function samsaraDivinePowerGacha(times) {
  times = times || 1;
  var cost = SAMSARA_GACHA_COST * times;
  if (!G.samsara || (G.samsara.reincarnationPoints || 0) < cost) {
    showToast('轮回积分不足！需要' + cost + '积分', 'error');
    return null;
  }
  var maxStar = (typeof MAX_DIVINE_POWER_STAR !== 'undefined') ? MAX_DIVINE_POWER_STAR : 6;
  // v2.11.0 需求7.1：检查是否所有神通都已满星
  var allMaxed = DIVINE_POWERS.every(function(p) {
    var owned = G.samsara.divinePowers[p.id];
    return owned && (owned.star || 1) >= maxStar;
  });
  if (allMaxed) {
    showToast('所有神通均已满星！暂无可抽取的神通', 'info');
    return null;
  }
  G.samsara.reincarnationPoints -= cost;
  var results = [];
  for (var i = 0; i < times; i++) {
    // 按品质概率抽取
    var r = Math.random();
    var cum = 0;
    var chosenRarity = 'rare';
    for (var rarity in DIVINE_POWER_GACHA_RATES) {
      cum += DIVINE_POWER_GACHA_RATES[rarity];
      if (r < cum) { chosenRarity = rarity; break; }
    }
    // v2.11.0 需求7.1：从该品质的神通中筛选未满星的
    var pool = DIVINE_POWERS.filter(function(p) {
      if (p.rarity !== chosenRarity) return false;
      var owned = G.samsara.divinePowers[p.id];
      // 未拥有 或 未满星 才进入池
      return !owned || (owned.star || 1) < maxStar;
    });
    // 若该品质已全部满星，降级到其他品质
    if (pool.length === 0) {
      pool = DIVINE_POWERS.filter(function(p) {
        var owned = G.samsara.divinePowers[p.id];
        return !owned || (owned.star || 1) < maxStar;
      });
    }
    var chosen = pickRandom(pool);
    if (!chosen) continue;
    // 检查是否已拥有
    if (G.samsara.divinePowers[chosen.id]) {
      // 重复抽取：升星（上限maxStar）
      var newStar = Math.min(maxStar, (G.samsara.divinePowers[chosen.id].star || 1) + 1);
      G.samsara.divinePowers[chosen.id].star = newStar;
      results.push({ power: chosen, isDup: true, newStar: newStar, maxed: newStar >= maxStar });
    } else {
      // 新获得
      G.samsara.divinePowers[chosen.id] = { star: 1 };
      results.push({ power: chosen, isDup: false, newStar: 1, maxed: false });
    }
  }
  saveGame();
  return results;
}

function doRebirth() {
  if (!canRebirth()) return false;
  // 转生前保留已获得天赋点的最高等级记录，避免转生后重复发放
  G.talentPointsEarned = Math.max(G.talentPointsEarned || 0, G.player.level);
  G.player.rebirth++;
  G.player.maxLevel += 10;
  G.player.level = 1;
  G.player.exp = 0;
  G.player.expToNext = getExpForLevel(1);
  // v2.11.0 需求3.3：转生后宠物属性重置 —— 等级重置为1级，固定加成属性重置为1级初始值，自由属性点全额返还
  G.pets.forEach(function(p) {
    p.level = 1;
    p.exp = 0;
    // 重置属性点：固定加成=1级初始值（每维1点），自由属性点全额返还（5点）
    p.attrPoints = { 力量: 1, 敏捷: 1, 体质: 1, 耐力: 1, 魔力: 1 };
    p.freeAttrPoints = 5; // 1级 × 5点/级 = 5点自由属性点
    // 清除属性缓存
    if (p._statsCache) delete p._statsCache;
  });
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
  showToast('转生成功！当前转生次数：' + G.player.rebirth + '，等级上限：' + G.player.maxLevel, 'success');
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

// ==================== SAMSARA BATTLE ====================
// 六道轮回战斗模拟（简化回合制，应用神通加成）

function startSamsaraBattle() {
  if (!G.samsara || !G.samsara.inChallenge) return null;
  var floorData = samsaraNextFloor();
  if (!floorData) return null;
  var team = getTeamPets();
  if (team.length === 0) return null;
  
  // 获取神通效果
  var dpEffects = (typeof getAllDivinePowerEffects === 'function') ? getAllDivinePowerEffects() : [];
  
  var monsterHp = floorData.hp;
  var monsterMaxHp = floorData.hp;
  var monsterAtk = floorData.atk;
  var monsterDef = floorData.def;
  var monsterSpd = floorData.spd;
  
  var petStates = team.map(function(p) {
    var stats = getPetStats(p);
    var hp = stats.气血;
    var atk = stats.力量 * 2 + 10;
    var def = stats.体质;
    var spd = stats.速度 || 10;
    var critRate = 0.15;
    var critDmg = 1.5;
    var vampPct = 0;
    var dmgReduce = 0;
    var regenPct = 0;
    var defIgnore = 0;
    var dodgeRate = 0;
    
    // 应用神通加成
    dpEffects.forEach(function(eff) {
      var v = eff.effect.value;
      switch (eff.effect.type) {
        case 'atkPct': atk *= (1 + v); break;
        case 'defPct': def *= (1 + v); break;
        case 'spdPct': spd *= (1 + v); break;
        case 'intPct': break; // 灵力在简化战斗中不直接影响
        case 'hpPct': hp = Math.floor(hp * (1 + v)); break;
        case 'mpPct': break;
        case 'allPct': atk *= (1 + v); def *= (1 + v); hp = Math.floor(hp * (1 + v)); spd *= (1 + v); break;
        case 'skillDmg': atk *= (1 + v * 0.5); break; // 技能伤害转化为部分攻击力
        case 'regenPct': regenPct = v; break;
        case 'defIgnore': defIgnore = v; break;
        case 'critRate': critRate += v; break;
        case 'dodgeRate': dodgeRate += v; break;
        case 'dmgReduce': dmgReduce = v; break;
        case 'vampPct': vampPct = v; break;
        case 'critDmg': critDmg += v; break;
        case 'stunChance': break; // 简化战斗中暂不模拟
        case 'skillCDR': break;
        case 'extraAtk': break;
        case 'revive': break;
      }
    });
    
    return {
      id: p.id, name: getPetDisplayName(p),
      hp: Math.floor(hp), maxHp: Math.floor(hp),
      atk: Math.floor(atk), def: Math.floor(def), spd: Math.floor(spd),
      critRate: critRate, critDmg: critDmg, vampPct: vampPct,
      dmgReduce: dmgReduce, regenPct: regenPct, defIgnore: defIgnore,
      dodgeRate: dodgeRate, alive: true, revived: false,
    };
  });
  
  var round = 0;
  var maxRounds = 50;
  var log = [];
  
  while (round < maxRounds) {
    round++;
    // 宠物攻击（按速度排序）
    var alivePets = petStates.filter(function(p) { return p.alive; });
    if (alivePets.length === 0) break;
    alivePets.sort(function(a, b) { return b.spd - a.spd; });
    
    for (var i = 0; i < alivePets.length; i++) {
      var ps = alivePets[i];
      if (!ps.alive) continue;
      var effectiveDef = monsterDef * (1 - ps.defIgnore);
      var dmg = Math.max(1, Math.floor(ps.atk - effectiveDef * 0.5));
      var isCrit = Math.random() < ps.critRate;
      if (isCrit) dmg = Math.floor(dmg * ps.critDmg);
      monsterHp -= dmg;
      log.push('第' + round + '回合 ' + ps.name + (isCrit ? ' 暴击' : '') + '造成 ' + dmg + ' 伤害');
      // 吸血
      if (ps.vampPct > 0) {
        var heal = Math.floor(dmg * ps.vampPct);
        ps.hp = Math.min(ps.maxHp, ps.hp + heal);
      }
      if (monsterHp <= 0) break;
    }
    if (monsterHp <= 0) break;
    
    // 怪物反击
    alivePets = petStates.filter(function(p) { return p.alive; });
    if (alivePets.length === 0) break;
    var target = alivePets[Math.floor(Math.random() * alivePets.length)];
    // 闪避
    if (Math.random() < target.dodgeRate) {
      log.push('第' + round + '回合 ' + target.name + ' 闪避了攻击');
    } else {
      var monsterDmg = Math.max(1, Math.floor(monsterAtk - target.def * 0.5));
      monsterDmg = Math.floor(monsterDmg * (1 - target.dmgReduce));
      target.hp -= monsterDmg;
      log.push('第' + round + '回合 轮回守卫造成 ' + monsterDmg + ' 伤害给 ' + target.name);
      if (target.hp <= 0) {
        // 免死神通
        var revivePower = dpEffects.find(function(e) { return e.effect.type === 'revive'; });
        if (revivePower && !target.revived) {
          target.hp = Math.floor(target.maxHp * revivePower.effect.value);
          target.revived = true;
          target.alive = true;
          log.push(target.name + ' 触发【不灭金身】，恢复 ' + target.hp + ' 气血！');
        } else {
          target.alive = false;
          log.push(target.name + ' 阵亡');
        }
      }
    }
    
    // 回合末恢复
    petStates.forEach(function(p) {
      if (p.alive && p.regenPct > 0) {
        var regen = Math.floor(p.maxHp * p.regenPct);
        p.hp = Math.min(p.maxHp, p.hp + regen);
      }
    });
  }
  
  var victory = monsterHp <= 0;
  var result = {
    victory: victory,
    floor: floorData.floor,
    floorData: floorData,
    rounds: round,
    log: log.slice(-10), // 仅保留最后10条日志
  };
  
  if (victory) {
    samsaraClearFloor();
    // 奖励
    if (floorData.exp) addExp(floorData.exp);
    if (floorData.gold) addGold(floorData.gold);
    result.rewards = { exp: floorData.exp, gold: floorData.gold };
  } else {
    samsaraFailChallenge();
  }
  
  // 寿命消耗（活动战斗每次1点）
  var teamPetIds = team.map(function(p) { return p.id; });
  if (typeof consumePetLifespan === 'function') {
    consumePetLifespan('activity', teamPetIds);
  }
  // 阵亡宠物扣除50寿命
  petStates.forEach(function(ps) {
    if (!ps.alive) {
      if (typeof consumePetLifespan === 'function') {
        consumePetLifespan('death', ps.id);
      }
    }
  });
  
  saveGame();
  return result;
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
// 需求5：10次为一轮循环，第1-9次为经验/金币任务，第10次固定为钻石任务
function generateRandomMainQuest() {
  if (typeof MAIN_QUEST_RANDOM_TEMPLATES === 'undefined') return null;
  // 使用 mainQuestCycleCount 计数（0-9），第10次（count%10===9）固定为钻石任务
  if (!G.mainQuestCycleCount) G.mainQuestCycleCount = 0;
  var isDiamondTask = (G.mainQuestCycleCount % 10 === 9);
  var template;
  if (isDiamondTask) {
    // 第10次：固定为钻石任务（孵化蛋）
    template = MAIN_QUEST_RANDOM_TEMPLATES.find(function(t) { return t.taskType === 'hatch'; });
  } else {
    // 第1-9次：随机经验任务或金币任务（排除孵化任务）
    var normalTemplates = MAIN_QUEST_RANDOM_TEMPLATES.filter(function(t) { return t.taskType !== 'hatch'; });
    template = normalTemplates[Math.floor(Math.random() * normalTemplates.length)];
  }
  if (!template) return null;
  var targetIdx = Math.floor(Math.random() * template.targets.length);
  var target = template.targets[targetIdx];
  var desc = template.desc.replace('{N}', target);
  // 计算奖励（基于目标数量）
  var reward = {};
  // 需求：金币奖励与玩家等级挂钩，低等级阶段奖励数值下调
  // 等级系数：1级=0.3，10级=0.6，20级=1.0，50级=1.5，100级=2.0
  var levelFactor = Math.max(0.3, Math.min(2.0, 0.3 + G.player.level * 0.035));
  if (template.reward.type === 'exp') {
    reward.exp = Math.floor((template.reward.base + template.reward.perKill * target) * levelFactor);
  } else if (template.reward.type === 'gold') {
    reward.gold = Math.floor((template.reward.base + template.reward.perKill * target) * levelFactor);
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
  // 需求5：10次为一轮循环，完成任务后计数+1，完成第10次后重置
  G.mainQuestCycleCount = (G.mainQuestCycleCount || 0) + 1;
  if (G.mainQuestCycleCount >= 10) G.mainQuestCycleCount = 0;
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
  // 需求11：每通关5轮要塞，后续所有轮次怪物五维属性在上一轮基础上提升10%（永久叠加）
  var powerMult = diff.powerMult * (1 + Math.floor(round / 5) * 0.10);
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
  } else {
    // 需求11：非领主怪五维属性在原有基础上整体提升30%
    finalHp = Math.floor(finalHp * 1.30);
    baseAtk = Math.floor(baseAtk * 1.30);
  }
  // 需求11：回合buff生效校验 —— 每累计5回合怪物获得的增益buff实时计入属性
  var buffEffects = (typeof getCrimsonFortressBuffEffects === 'function') ? getCrimsonFortressBuffEffects() : {};
  var monsterAtkPct = buffEffects.atkPct || 0;
  var monsterDefPct = buffEffects.defPct || 0;
  var monsterHpPct = buffEffects.hpPct || 0;
  var monsterSpdPct = buffEffects.spdPct || 0;
  // 怪物也享受buff加成（每5关怪物获得增益，实时生效）
  finalHp = Math.floor(finalHp * (1 + monsterHpPct));
  baseAtk = Math.floor(baseAtk * (1 + monsterAtkPct));
  var baseDef = Math.floor(monsterLv * 2.0 * (isBoss ? 2.0 : 1.2) * powerMult * (1 + monsterDefPct));
  var baseSpd = Math.floor(monsterLv * 2 + 10 + (isBoss ? 5 : 0)) * (1 + monsterSpdPct);
  // 需求16：血色要塞怪物也生成五维属性（复用同一套五维属性计算体系）
  var monFiveDim = (typeof generateMonsterFiveDim === 'function') ? generateMonsterFiveDim(monsterLv, isBoss ? 'boss' : 'mob', race) : null;
  var fiveDim = monFiveDim ? monFiveDim.fiveDim : null;
  var fiveDimAttrPts = monFiveDim ? monFiveDim.attrPts : null;
  if (fiveDim) {
    // 需求11：非领主怪五维属性整体提升30%（已在属性值上体现）
    if (!isBoss) {
      Object.keys(fiveDim).forEach(function(k) { fiveDim[k] = Math.floor(fiveDim[k] * 1.30); });
    }
    // 需求11：轮次强度递增 —— 每通关5轮，五维属性提升10%（永久叠加）
    var roundBoost = 1 + Math.floor(round / 5) * 0.10;
    Object.keys(fiveDim).forEach(function(k) { fiveDim[k] = Math.floor(fiveDim[k] * roundBoost); });
    // 需求11：回合buff生效 —— buff实时计入五维属性
    if (monsterAtkPct) { fiveDim.力量 = Math.floor(fiveDim.力量 * (1 + monsterAtkPct)); fiveDim.魔力 = Math.floor(fiveDim.魔力 * (1 + monsterAtkPct)); }
    if (monsterDefPct) { fiveDim.耐力 = Math.floor(fiveDim.耐力 * (1 + monsterDefPct)); fiveDim.体质 = Math.floor(fiveDim.体质 * (1 + monsterDefPct)); }
    if (monsterHpPct) { fiveDim.体质 = Math.floor(fiveDim.体质 * (1 + monsterHpPct)); }
    if (monsterSpdPct) { fiveDim.敏捷 = Math.floor(fiveDim.敏捷 * (1 + monsterSpdPct)); }
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
    def: baseDef,
    speed: Math.floor(baseSpd),
    // 需求16：五维属性（与宠物同一套计算体系）
    fiveDim: fiveDim,
    fiveDimAttrPts: fiveDimAttrPts,
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
// 需求：血色要塞整体奖励提升10倍，普通难度×20，困难难度×100
function endCrimsonFortress() {
  if (!G.crimsonFortress || !G.crimsonFortress.active) return null;
  G.crimsonFortress.active = false;
  var diff = CRIMSON_FORTRESS_DIFFICULTIES.find(function(d) { return d.id === G.crimsonFortress.difficulty; });
  var expMult = diff ? diff.expMult : 3.0;
  var kills = G.crimsonFortress.kills;
  // 需求：按难度调整奖励倍率 —— 简单×10，普通×20，困难×100
  var rewardMult = 10;
  if (diff) {
    if (diff.id === 'normal') rewardMult = 20;
    else if (diff.id === 'hard') rewardMult = 100;
  }
  // 经验奖励 = 正常经验 × 3倍 × 难度倍率
  var baseExp = kills * (G.player.level * 8 + 40);
  var totalExp = Math.floor(baseExp * expMult * rewardMult);
  // 金币奖励 × 难度倍率
  var totalGold = kills * (G.player.level * 5 + 20) * rewardMult;
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

// ==================== 挖密藏系统（v2.7.0 重构·碎片合成模式+彩蛋机制）====================
// 九宫格自选模式：展示9格奖励面板，玩家自主选择一格领取奖励
// 所有格子必有奖励，无空地/陷阱/锁宝箱
// v2.7.0 需求3.1：密藏图改为碎片合成获取（5种碎片各1个→1张密藏图）
// v2.7.0 需求3.2：奖池升级为高价值道具 + 1%彩蛋机制（4种）

var DIG_DAILY_LIMIT = 10;
var DIG_PICK_COUNT = 1; // 默认可选择1格

// v2.7.0 需求3.2：奖池升级——全部选用高价值道具
// 专属产出：元宵、保底石、月华露仅通过密藏图挖宝产出
var DIG_REWARD_POOL = [
  // ===== 专属高价值道具（高权重） =====
  { type: 'yuanxiao',       weight: 15, icon: '🍡', name: '元宵',     color: '#22c55e', minTier: 0 },
  { type: 'protection_stone', weight: 10, icon: '🛡️', name: '保底石',   color: '#3b82f6', minTier: 0 },
  { type: 'moon_dew',       weight: 10, icon: '🌙', name: '月华露',   color: '#e0e0e0', minTier: 0 },
  // ===== 高价值道具（中权重） =====
  { type: 'egg',            weight: 12, icon: '🥚', name: '宠物蛋',   color: '#f59e0b', minTier: 0 },
  { type: 'fragment',       weight: 15, icon: '🔮', name: '密藏碎片', color: '#a855f7', minTier: 0 },
  { type: 'gold_chest',     weight: 10, icon: '💰', name: '大金币箱', color: '#fbbf24', minTier: 0 },
  { type: 'diamond',        weight: 8,  icon: '💎', name: '钻石',     color: '#a855f7', minTier: 0 },
  { type: 'guiyuan_pill',   weight: 5,  icon: '💊', name: '归元丹',   color: '#ef4444', minTier: 0 },
  { type: 'guixu_pill',     weight: 4,  icon: '💠', name: '归墟丹',   color: '#ec4899', minTier: 0 },
  // v2.9.0 需求2.3：密藏奖池新增宠物洗点丹
  { type: 'pet_reset_pill', weight: 4,  icon: '🧪', name: '宠物洗点丹', color: '#10b981', minTier: 0 },
  { type: 'refine_crystal', weight: 6,  icon: '🔮', name: '炼化晶石', color: '#9ca3af', minTier: 0 },
  { type: 'forge_stone_high', weight: 6, icon: '🔩', name: '高级强化石',color: '#3b82f6', minTier: 0 },
  // ===== 顶级奖励（极低权重） =====
  { type: 'divine_essence', weight: 3,  icon: '✨', name: '神兽精华', color: '#ec4899', minTier: 0 },
  { type: 'golden',         weight: 2,  icon: '🌟', name: '黄金宝藏', color: '#fde047', minTier: 0 },
];

// v2.7.0 需求3.1：密藏碎片合成——5种碎片各1个合成1张密藏图
var TREASURE_FRAGMENT_IDS = ['treasure_fragment_1','treasure_fragment_2','treasure_fragment_3','treasure_fragment_4','treasure_fragment_5'];

function hasAllTreasureFragments() {
  return TREASURE_FRAGMENT_IDS.every(function(fid) {
    var item = G.inventory.find(function(i) { return i.id === fid; });
    return item && item.count >= 1;
  });
}

function synthesizeTreasureMap() {
  if (!hasAllTreasureFragments()) {
    showToast('需要集齐5种密藏碎片才能合成密藏图', 'error');
    return false;
  }
  // 消耗5种碎片各1个
  TREASURE_FRAGMENT_IDS.forEach(function(fid) {
    var item = G.inventory.find(function(i) { return i.id === fid; });
    if (item) {
      item.count--;
      if (item.count <= 0) {
        var idx = G.inventory.indexOf(item);
        if (idx >= 0) G.inventory.splice(idx, 1);
      }
    }
  });
  // 产出1张密藏图
  var mapItem = G.inventory.find(function(i) { return i.id === 'dig_map'; });
  if (mapItem) mapItem.count++;
  else G.inventory.push({ id: 'dig_map', count: 1 });
  saveGame();
  showToast('🔮 5种密藏碎片合成成功！获得密藏图×1', 'success');
  if (typeof render === 'function') render();
  return true;
}

// v2.7.0 需求2.1：使用金币箱道具
function useGoldChest(chestId) {
  var amounts = { gold_chest_small: [500, 2000], gold_chest_mid: [3000, 8000], gold_chest_large: [10000, 30000] };
  var range = amounts[chestId];
  if (!range) { showToast('未知的金币箱', 'error'); return false; }
  var item = G.inventory.find(function(i) { return i.id === chestId; });
  if (!item || item.count <= 0) { showToast('没有该金币箱', 'error'); return false; }
  var gold = randomInt(range[0], range[1]);
  // 消耗1个金币箱
  item.count--;
  if (item.count <= 0) {
    var idx = G.inventory.indexOf(item);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  addGold(gold);
  saveGame();
  showToast('💰 打开' + getItemName(chestId) + '，获得 ' + gold.toLocaleString() + ' 金币！', 'success');
  if (typeof render === 'function') render();
  return true;
}

// 生成一个3x3网格（所有格子均有奖励）
function generateDigGrid() {
  var grid = [];
  var totalWeight = DIG_REWARD_POOL.reduce(function(s, t) { return s + t.weight; }, 0);
  for (var i = 0; i < 9; i++) {
    var roll = Math.random() * totalWeight;
    var acc = 0;
    var rewardType = 'gold';
    for (var j = 0; j < DIG_REWARD_POOL.length; j++) {
      acc += DIG_REWARD_POOL[j].weight;
      if (roll < acc) { rewardType = DIG_REWARD_POOL[j].type; break; }
    }
    grid.push({
      type: rewardType,
      revealed: false,     // 是否已翻开
      reward: null,        // 翻开后填入奖励信息
    });
  }
  // 确保至少有1个高价值奖励（黄金宝藏或神兽精华）
  var hasRare = grid.some(function(c) { return c.type === 'golden' || c.type === 'divine_essence'; });
  if (!hasRare && Math.random() < 0.3) {
    grid[randomInt(0, 8)].type = Math.random() < 0.5 ? 'golden' : 'divine_essence';
  }
  return grid;
}

// 开始挖密藏会话（重构版：九宫格自选1格）
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
  // 检查是否有探宝铲（额外选择机会）
  var shovelItem = G.inventory.find(function(i) { return i.id === 'dig_shovel'; });
  var picksLeft = DIG_PICK_COUNT;
  var shovelUsed = false;
  if (shovelItem && shovelItem.count > 0) {
    // 自动消耗1把探宝铲，额外+1次选择机会
    shovelItem.count--;
    if (shovelItem.count <= 0) {
      var sidx = G.inventory.indexOf(shovelItem);
      if (sidx >= 0) G.inventory.splice(sidx, 1);
    }
    picksLeft += 1;
    shovelUsed = true;
  }
  // 创建会话
  G.digSession = {
    grid: generateDigGrid(),
    picksLeft: picksLeft,
    maxPicks: picksLeft,
    totalFound: { gold: 0, gem: 0, item: 0, diamond: 0, egg: 0, essence: 0 },
    startTime: Date.now(),
    finished: false,
  };
  saveGame();
  showToast('🗺️ 挖密藏开始！选择 ' + picksLeft + ' 格领取奖励' + (shovelUsed ? '（探宝铲已自动使用）' : ''), 'success');
  // 自动切换到挖密藏页面
  if (typeof currentScreen !== 'undefined' && currentScreen !== 'dig') {
    currentScreen = 'dig';
  }
  if (typeof render === 'function') render();
}

// 选择一个格子领取奖励（重构版：九宫格自选）
function digCell(idx) {
  if (!G.digSession) return;
  if (G.digSession.finished) return;
  if (idx < 0 || idx >= 9) return;
  var cell = G.digSession.grid[idx];
  if (cell.revealed) {
    showToast('该格子已翻开', 'error');
    return;
  }
  if (G.digSession.picksLeft <= 0) {
    showToast('选择次数已用完！', 'error');
    return;
  }
  // 消耗选择次数
  G.digSession.picksLeft--;
  cell.revealed = true;
  // 处理奖励
  var reward = processDigReward(cell.type);
  cell.reward = reward;
  // v2.7.0 需求3.2：彩蛋机制——每格子独立判定1%概率触发彩蛋
  var egg = rollDigEasterEgg(idx);
  if (egg) {
    cell.easterEgg = egg;
    showToast('🎉 触发彩蛋【' + egg.name + '】！' + (egg.extraRewards.length > 0 ? '额外获得 ' + egg.extraRewards.length + ' 项奖励' : ''), 'success');
  }
  // 检查是否所有选择次数用完
  if (G.digSession.picksLeft <= 0) {
    G.digSession.finished = true;
    // 自动翻开剩余格子（展示但不给奖励）
    G.digSession.grid.forEach(function(c) { if (!c.revealed) c.revealed = true; c.missed = !c.reward; });
  }
  saveGame();
  if (typeof render === 'function') render();
}

// 处理挖掘奖励（v2.7.0 重构版：全部高价值道具）
function processDigReward(cellType) {
  var pl = G.player.level || 1;
  var reward = null;
  function _addItem(itemId, count) {
    var existing = G.inventory.find(function(i) { return i.id === itemId; });
    if (existing) existing.count += count;
    else G.inventory.push({ id: itemId, count: count });
  }
  if (cellType === 'yuanxiao') {
    var yxPool = ['yuanxiao_str', 'yuanxiao_con', 'yuanxiao_agi', 'yuanxiao_end', 'yuanxiao_mag'];
    var yxId = yxPool[randomInt(0, yxPool.length - 1)];
    var yxCount = randomInt(2, 5);
    _addItem(yxId, yxCount);
    G.digSession.totalFound.item += yxCount;
    reward = { icon: '🍡', name: getItemName(yxId) + ' ×' + yxCount, amount: yxCount, color: '#22c55e' };
  } else if (cellType === 'protection_stone') {
    var psCount = randomInt(1, 3);
    _addItem('protection_stone', psCount);
    G.digSession.totalFound.item += psCount;
    reward = { icon: '🛡️', name: '保底石 ×' + psCount, amount: psCount, color: '#3b82f6' };
  } else if (cellType === 'moon_dew') {
    var mdCount = randomInt(2, 5);
    _addItem('moon_dew', mdCount);
    G.digSession.totalFound.item += mdCount;
    reward = { icon: '🌙', name: '月华露 ×' + mdCount, amount: mdCount, color: '#e0e0e0' };
  } else if (cellType === 'egg') {
    var eggTier = randomInt(2, 4);
    var egg = generateEgg(eggTier);
    G.eggs.push(egg);
    G.digSession.totalFound.egg++;
    reward = { icon: '🥚', name: 'T' + (eggTier + 1) + '宠物蛋', amount: 1, color: '#f59e0b' };
  } else if (cellType === 'fragment') {
    var fragPool = ['treasure_fragment_1','treasure_fragment_2','treasure_fragment_3','treasure_fragment_4','treasure_fragment_5'];
    var fragId = fragPool[randomInt(0, fragPool.length - 1)];
    _addItem(fragId, 1);
    G.digSession.totalFound.item += 1;
    reward = { icon: '🔮', name: getItemName(fragId) + ' ×1', amount: 1, color: '#a855f7' };
  } else if (cellType === 'gold_chest') {
    _addItem('gold_chest_large', 1);
    G.digSession.totalFound.item += 1;
    reward = { icon: '💰', name: '大金币箱 ×1', amount: 1, color: '#fbbf24' };
  } else if (cellType === 'diamond') {
    var dia = randomInt(10, 30);
    addDiamond(dia);
    G.digSession.totalFound.diamond += dia;
    reward = { icon: '💎', name: '钻石 ×' + dia, amount: dia, color: '#a855f7' };
  } else if (cellType === 'guiyuan_pill') {
    _addItem('guiyuan_pill', randomInt(1, 2));
    G.digSession.totalFound.item += 1;
    reward = { icon: '💊', name: '归元丹 ×1', amount: 1, color: '#ef4444' };
  } else if (cellType === 'guixu_pill') {
    _addItem('guixu_pill', 1);
    G.digSession.totalFound.item += 1;
    reward = { icon: '💠', name: '归墟丹 ×1', amount: 1, color: '#ec4899' };
  } else if (cellType === 'pet_reset_pill') {
    // v2.9.0 需求2.3：密藏奖池宠物洗点丹
    _addItem('pet_reset_pill', 1);
    G.digSession.totalFound.item += 1;
    reward = { icon: '🧪', name: '宠物洗点丹 ×1', amount: 1, color: '#10b981' };
  } else if (cellType === 'refine_crystal') {
    var rcCount = randomInt(1, 3);
    _addItem('refine_crystal', rcCount);
    G.digSession.totalFound.item += rcCount;
    reward = { icon: '🔮', name: '炼化晶石 ×' + rcCount, amount: rcCount, color: '#9ca3af' };
  } else if (cellType === 'forge_stone_high') {
    var fshCount = randomInt(2, 4);
    _addItem('forge_stone_high', fshCount);
    G.digSession.totalFound.item += fshCount;
    reward = { icon: '🔩', name: '高级强化石 ×' + fshCount, amount: fshCount, color: '#3b82f6' };
  } else if (cellType === 'divine_essence') {
    var deCount = randomInt(1, 3);
    _addItem('divine_essence', deCount);
    G.digSession.totalFound.essence += deCount;
    reward = { icon: '✨', name: '神兽精华 ×' + deCount, amount: deCount, color: '#ec4899' };
  } else if (cellType === 'golden') {
    // 黄金宝藏：顶级奖励
    var gDia = randomInt(30, 80);
    addDiamond(gDia);
    G.digSession.totalFound.diamond += gDia;
    var gEggTier = randomInt(3, 4);
    var gEgg = generateEgg(gEggTier);
    G.eggs.push(gEgg);
    G.digSession.totalFound.egg++;
    _addItem('moon_dew', 5);
    G.digSession.totalFound.item += 5;
    _addItem('divine_essence', 2);
    G.digSession.totalFound.essence += 2;
    _addItem('protection_stone', 2);
    G.digSession.totalFound.item += 2;
    reward = { icon: '🌟', name: '黄金宝藏！钻石×' + gDia + ' + T' + (gEggTier + 1) + '蛋 + 月华露×5 + 神兽精华×2 + 保底石×2', amount: gDia, color: '#fde047' };
  } else {
    // 兜底：给大金币箱
    _addItem('gold_chest_mid', 1);
    G.digSession.totalFound.item += 1;
    reward = { icon: '💰', name: '中金币箱 ×1', amount: 1, color: '#fbbf24' };
  }
  return reward;
}

// v2.7.0 需求3.2：彩蛋机制——1%概率触发，4种彩蛋随机1种
// ① 重挖一次：本次奖励正常发放，额外赠送1次免费挖宝机会
// ② 横排全得：正常获得选中格子奖励，同时获取该格子所在整行的全部奖励
// ③ 纵排全得：正常获得选中格子奖励，同时获取该格子所在整列的全部奖励
// ④ 9倍全奖：直接获得挖宝界面所有格子的全部奖励，且所有奖励数量乘以9倍
function rollDigEasterEgg(cellIdx) {
  if (Math.random() > 0.01) return null; // 1%概率触发
  var eggType = randomInt(1, 4);
  var eggNames = { 1: '重挖一次', 2: '横排全得', 3: '纵排全得', 4: '9倍全奖' };
  var eggIcons = { 1: '🔄', 2: '↔️', 3: '↕️', 4: '9️⃣' };
  var extraRewards = [];
  if (eggType === 1) {
    // 重挖一次：额外+1次选择机会
    G.digSession.picksLeft++;
    G.digSession.maxPicks = Math.max(G.digSession.maxPicks, G.digSession.picksLeft);
    extraRewards.push({ icon: '🔄', name: '额外挖宝机会 ×1', color: '#fde047' });
  } else if (eggType === 2) {
    // 横排全得：获取同行3格奖励
    var row = Math.floor(cellIdx / 3);
    for (var c = 0; c < 3; c++) {
      var idx = row * 3 + c;
      if (idx === cellIdx) continue; // 跳过已选格子
      if (G.digSession.grid[idx] && !G.digSession.grid[idx].revealed) {
        var r = processDigReward(G.digSession.grid[idx].type);
        G.digSession.grid[idx].revealed = true;
        G.digSession.grid[idx].reward = r;
        if (r) extraRewards.push(r);
      }
    }
  } else if (eggType === 3) {
    // 纵排全得：获取同列3格奖励
    var col = cellIdx % 3;
    for (var r2 = 0; r2 < 3; r2++) {
      var idx2 = r2 * 3 + col;
      if (idx2 === cellIdx) continue;
      if (G.digSession.grid[idx2] && !G.digSession.grid[idx2].revealed) {
        var r2r = processDigReward(G.digSession.grid[idx2].type);
        G.digSession.grid[idx2].revealed = true;
        G.digSession.grid[idx2].reward = r2r;
        if (r2r) extraRewards.push(r2r);
      }
    }
  } else if (eggType === 4) {
    // 9倍全奖：获取所有9格奖励×9倍
    for (var i = 0; i < 9; i++) {
      if (i === cellIdx) continue; // 跳过已选格子（已正常发放）
      if (G.digSession.grid[i] && !G.digSession.grid[i].revealed) {
        // 每格奖励×9
        for (var mult = 0; mult < 9; mult++) {
          var r9 = processDigReward(G.digSession.grid[i].type);
          if (r9) extraRewards.push(r9);
        }
        G.digSession.grid[i].revealed = true;
        G.digSession.grid[i].reward = { icon: '9️⃣', name: '×9倍奖励已领取', color: '#fde047' };
      }
    }
  }
  return { type: eggType, name: eggNames[eggType], icon: eggIcons[eggType], extraRewards: extraRewards };
}

// 使用探宝铲增加选择次数（挖宝进行中手动使用）
function useDigShovel() {
  if (!G.digSession || G.digSession.finished) return;
  if (G.digSession.picksLeft >= 3) {
    showToast('选择次数已达上限！', 'error');
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
  G.digSession.picksLeft++;
  G.digSession.maxPicks = Math.max(G.digSession.maxPicks, G.digSession.picksLeft);
  saveGame();
  showToast('⛏️ 探宝铲使用成功！选择次数 +1（剩余 ' + G.digSession.picksLeft + ' 次）', 'success');
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
  if (s.totalFound.essence > 0) parts.push('神兽精华 ×' + s.totalFound.essence);
  if (parts.length > 0) summary += '获得：' + parts.join('、');
  else summary += '本次没有找到宝藏';
  G.digSession = null;
  saveGame();
  showToast(summary, 'info');
  if (typeof render === 'function') render();
}

// ==================== 神兽精华兑换 ====================
// 消耗99个神兽精华，随机获得1只神兽
function exchangeDivineEssence() {
  var need = 99;
  var inv = G.inventory.find(function(i) { return i.id === 'divine_essence'; });
  if (!inv || inv.count < need) {
    var have = inv ? inv.count : 0;
    showToast('神兽精华不足！需要 ' + need + ' 个，当前拥有 ' + have + ' 个', 'error');
    return { ok: false, msg: '神兽精华不足' };
  }
  // 先生成随机神兽，成功后再扣除精华（防吞道具）
  var result = generateDivineBeast();
  if (!result || !result.result) {
    showToast('神兽生成失败，请稍后重试', 'error');
    return { ok: false, msg: '生成失败' };
  }
  var beast = result.result;
  // 生成成功后才扣除神兽精华
  inv.count -= need;
  if (inv.count <= 0) {
    G.inventory = G.inventory.filter(function(i) { return i.id !== 'divine_essence'; });
  }
  G.pets.push(beast);
  saveGame();
  // v3.0 主线任务追踪：宠物获取（神兽）
  if (typeof _trackPetAcquire === 'function') _trackPetAcquire();
  showToast('🎉 恭喜获得神兽——' + beast.name + '！', 'success');
  return { ok: true, pet: beast };
}

// 获取神兽精华持有数量
function getDivineEssenceCount() {
  var inv = G.inventory.find(function(i) { return i.id === 'divine_essence'; });
  return inv ? inv.count : 0;
}

// 检查宠物是否为神兽
function isDivineBeastPet(pet) {
  if (!pet) return false;
  if (pet.isDivineBeast) return true;
  var dex = getPetDex(pet.name);
  return !!(dex && dex.isDivineBeast);
}