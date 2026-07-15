﻿// ===== ui_activity.js : 符文/竞技场/活动/派遣/藏宝图等UI（从ui.js拆分） =====

// ==================== 符文系统 UI ====================
// 选择符文操作宠物
function selectRunePet(petId) {
  window._runePetId = petId;
  window._runeSelectedSlot = null;
  render();
}

// 选择符文槽位（查看可装备的符文）
function selectRuneSlot(slot) {
  window._runeSelectedSlot = (window._runeSelectedSlot === slot) ? null : slot;
  render();
}

// 渲染符文系统主界面
function renderRuneSheet() {
  var selectedPetId = window._runePetId || '';
  var selectedPet = selectedPetId ? G.pets.find(function(p) { return p.id === selectedPetId; }) : null;
  var selectedSlot = window._runeSelectedSlot || null;

  var html = '<div class="bg-card border border-game rounded-xl p-4 mb-4">' +
    '<h2 class="font-bold text-lg mb-2">📜 符文系统</h2>' +
    '<p class="text-xs text-secondary mb-3">每只宠物可装备6枚符文（位置1-6），符文拥有主属性、副属性和套装效果。装备同套装2件/4件可激活套装加成。符文可通过消耗远古符文材料强化升级。</p>' +
    '<div class="bg-blue-900/20 border border-blue-700/50 rounded-lg p-2 mb-3">' +
      '<p class="text-xs text-blue-400">📜 <span class="font-bold">符文说明：</span></p>' +
      '<p class="text-xs text-blue-300/80 mt-1">· 主属性按位置固定（1号位攻击/2号位速度/3号位防御/4号位气血%/5号位气血/6号位暴击）<br>· 副属性随机生成，每3级强化随机提升1条副属性<br>· 同套装2件激活初级效果，4件激活高级效果<br>· 符文可通过分解获得远古符文材料</p>' +
    '</div>';

  // ===== 套装速查 =====
  html += '<div class="mb-4">' +
    '<p class="text-sm font-bold mb-2">📋 符文套装速查</p>' +
    '<div class="grid grid-cols-2 gap-2">';
  (typeof RUNE_SETS !== 'undefined' && RUNE_SETS ? RUNE_SETS : []).forEach(function(set) {
    html += '<div class="bg-panel border rounded-lg p-2" style="border-color:' + set.color + '44">' +
      '<div class="flex items-center gap-1 mb-1">' +
        '<span style="color:' + set.color + '">' + set.icon + '</span>' +
        '<span class="text-xs font-bold" style="color:' + set.color + '">' + set.name + '</span>' +
      '</div>' +
      '<p class="text-[10px] text-green-400">2件: ' + set.desc2 + '</p>' +
      '<p class="text-[10px] text-yellow-400">4件: ' + set.desc4 + '</p>' +
    '</div>';
  });
  html += '</div></div>';

  // ===== 宠物选择 =====
  html += '<div class="mb-4">' +
    '<p class="text-sm font-bold mb-2">选择宠物</p>' +
    '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">' +
    (G.pets || []).map(function(p) {
      var isSelected = selectedPetId === p.id;
      var borderCls = isSelected ? 'border-yellow-500 bg-yellow-900/30' : 'border-game bg-panel cursor-pointer hover:bg-panel/80';
      var runeCount = 0;
      if (p.runes) { for (var s = 1; s <= 6; s++) { if (p.runes[s]) runeCount++; } }
      return '<div class="border rounded-lg p-2 ' + borderCls + '" onclick="selectRunePet(\'' + p.id + '\')">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-xs font-bold" style="color:' + (RARITY_COLORS[RARITIES.indexOf(p.rarity)] || '#9ca3af') + '">' + getPetDisplayName(p) + '</span>' +
          '<span class="text-[10px] text-yellow-400">📜' + runeCount + '/6</span>' +
        '</div>' +
        '<div class="text-[10px] text-secondary">Lv.' + p.level + ' · ' + p.race + '</div>' +
      '</div>';
    }).join('') +
    '</div></div>';

  if (selectedPet) {
    if (!selectedPet.runes) selectedPet.runes = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };

    // ===== 6个符文槽位展示 =====
    html += '<div class="mb-4">' +
      '<p class="text-sm font-bold mb-2">符文槽位（点击槽位查看可装备的符文）</p>' +
      '<div class="grid grid-cols-3 gap-2">';
    for (var slot = 1; slot <= 6; slot++) {
      var rune = selectedPet.runes[slot];
      var slotDef = RUNE_SLOTS.find(function(s) { return s.id === slot; });
      var isSlotSelected = selectedSlot === slot;
      if (rune) {
        var gradeIdx = RUNE_GRADES.indexOf(rune.grade);
        var gradeColor = RUNE_GRADE_COLORS[gradeIdx] || '#9ca3af';
        var setDef = getRuneSet(rune.setId);
        var mainStatName = getRuneStatName(rune.mainStat.type);
        var mainStatVal = formatRuneStatValue(rune.mainStat.type, rune.mainStat.value);
        html += '<div class="border-2 rounded-lg p-2 cursor-pointer ' + (isSlotSelected ? 'border-yellow-500 bg-yellow-900/20' : '') + '" style="border-color:' + gradeColor + '" onclick="selectRuneSlot(' + slot + ')">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<span class="text-[10px] text-secondary">' + slotDef.icon + slotDef.name + '</span>' +
            '<span class="text-[10px] font-bold" style="color:' + gradeColor + '">' + RUNE_GRADE_ICONS[gradeIdx] + '+' + rune.level + '</span>' +
          '</div>' +
          '<div class="text-xs font-bold" style="color:' + (setDef ? setDef.color : '#9ca3af') + '">' + (setDef ? setDef.name : '未知') + '</div>' +
          '<div class="text-[10px] text-green-400">' + mainStatName + ' ' + mainStatVal + '</div>' +
          (rune.subStats.length > 0 ? '<div class="text-[9px] text-secondary mt-1">' +
            rune.subStats.map(function(sub) {
              return getRuneStatName(sub.type) + ' ' + formatRuneStatValue(sub.type, sub.value);
            }).join(' / ') +
          '</div>' : '') +
          '<div class="flex gap-1 mt-1">' +
            '<button class="text-[9px] px-1 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700" onclick="event.stopPropagation();upgradeRune(\'' + rune.id + '\')">🔮强化</button>' +
            '<button class="text-[9px] px-1 py-0.5 rounded bg-red-900 text-red-300 border border-red-700" onclick="event.stopPropagation();unequipRune(\'' + selectedPet.id + '\',' + slot + ')">卸下</button>' +
          '</div>' +
        '</div>';
      } else {
        html += '<div class="border-2 border-dashed border-game rounded-lg p-2 cursor-pointer ' + (isSlotSelected ? 'bg-yellow-900/20' : '') + '" onclick="selectRuneSlot(' + slot + ')">' +
          '<div class="text-center">' +
            '<div class="text-2xl opacity-30">' + slotDef.icon + '</div>' +
            '<div class="text-[10px] text-secondary mt-1">' + slotDef.name + '</div>' +
            '<div class="text-[9px] text-gray-500">空槽位</div>' +
            (isSlotSelected ? '<div class="text-[9px] text-yellow-400 mt-1">↓查看背包</div>' : '') +
          '</div>' +
        '</div>';
      }
    }
    html += '</div></div>';

    // ===== 套装效果展示 =====
    var runeBonus = (typeof getRuneBonus === 'function') ? getRuneBonus(selectedPet) : null;
    if (runeBonus && Object.keys(runeBonus.setProgress).length > 0) {
      html += '<div class="mb-4">' +
        '<p class="text-sm font-bold mb-2">套装效果</p>' +
        '<div class="space-y-1">';
      Object.keys(runeBonus.setProgress).forEach(function(setId) {
        var prog = runeBonus.setProgress[setId];
        var setDef = getRuneSet(setId);
        var has2 = prog.count >= 2;
        var has4 = prog.count >= 4;
        html += '<div class="bg-panel border rounded-lg p-2" style="border-color:' + prog.color + '44">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span style="color:' + prog.color + '">' + (setDef ? setDef.icon : '') + '</span>' +
            '<span class="text-xs font-bold" style="color:' + prog.color + '">' + prog.name + '</span>' +
            '<span class="text-xs ' + (has4 ? 'text-green-400' : has2 ? 'text-yellow-400' : 'text-secondary') + '">' + prog.count + '/4</span>' +
          '</div>' +
          '<p class="text-[10px] ' + (has2 ? 'text-green-400' : 'text-gray-500') + '">' + (has2 ? '✅' : '⬜') + ' 2件: ' + (setDef ? setDef.desc2 : '') + '</p>' +
          '<p class="text-[10px] ' + (has4 ? 'text-green-400' : 'text-gray-500') + '">' + (has4 ? '✅' : '⬜') + ' 4件: ' + (setDef ? setDef.desc4 : '') + '</p>' +
        '</div>';
      });
      html += '</div></div>';
    }

    // ===== 符文背包（按选中槽位过滤） =====
    if (selectedSlot) {
      var slotDef2 = RUNE_SLOTS.find(function(s) { return s.id === selectedSlot; });
      var bagRunes = (G.runeBag || []).filter(function(r) { return r.slot === selectedSlot; });
      html += '<div class="mb-4">' +
        '<p class="text-sm font-bold mb-2">' + slotDef2.icon + ' ' + slotDef2.name + ' 符文背包（' + bagRunes.length + '枚）</p>';
      if (bagRunes.length === 0) {
        html += '<div class="bg-panel border border-dashed border-game rounded-lg p-4 text-center">' +
          '<p class="text-xs text-secondary">背包中没有' + slotDef2.name + '的符文</p>' +
          '<p class="text-xs text-secondary mt-1">可通过副本、藏宝图、挖秘藏等途径获取符文</p>' +
        '</div>';
      } else {
        html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">';
        bagRunes.forEach(function(rune) {
          var gradeIdx2 = RUNE_GRADES.indexOf(rune.grade);
          var gradeColor2 = RUNE_GRADE_COLORS[gradeIdx2] || '#9ca3af';
          var setDef2 = getRuneSet(rune.setId);
          var mainName = getRuneStatName(rune.mainStat.type);
          var mainVal = formatRuneStatValue(rune.mainStat.type, rune.mainStat.value);
          html += '<div class="border rounded-lg p-2" style="border-color:' + gradeColor2 + '66">' +
            '<div class="flex items-center justify-between mb-1">' +
              '<span class="text-xs font-bold" style="color:' + (setDef2 ? setDef2.color : '#9ca3af') + '">' + (setDef2 ? setDef2.icon + setDef2.name : '未知') + '</span>' +
              '<span class="text-[10px] font-bold" style="color:' + gradeColor2 + '">' + RUNE_GRADE_NAMES[gradeIdx2] + ' +' + rune.level + '</span>' +
            '</div>' +
            '<div class="text-xs text-green-400">主: ' + mainName + ' ' + mainVal + '</div>' +
            (rune.subStats.length > 0 ? '<div class="text-[10px] text-secondary mt-1">' +
              rune.subStats.map(function(sub) {
                return getRuneStatName(sub.type) + ' ' + formatRuneStatValue(sub.type, sub.value);
              }).join(' / ') +
            '</div>' : '') +
            '<div class="flex gap-1 mt-2">' +
              '<button class="text-[10px] px-2 py-0.5 rounded bg-yellow-900 text-yellow-300 border border-yellow-700" onclick="equipRune(\'' + selectedPet.id + '\',\'' + rune.id + '\')">装备</button>' +
              '<button class="text-[10px] px-2 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700" onclick="upgradeRune(\'' + rune.id + '\')">🔮强化</button>' +
              '<button class="text-[10px] px-2 py-0.5 rounded bg-red-900 text-red-300 border border-red-700" onclick="decomposeRune(\'' + rune.id + '\')">♻️分解</button>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    }

    // ===== 全部符文背包（不按槽位过滤） =====
    if (!selectedSlot && G.runeBag && G.runeBag.length > 0) {
      html += '<div class="mb-4">' +
        '<p class="text-sm font-bold mb-2">📦 符文背包（共' + G.runeBag.length + '枚）</p>' +
        '<p class="text-xs text-secondary mb-2">点击上方空槽位可选择对应位置的符文装备</p>' +
        '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">';
      G.runeBag.slice(0, 12).forEach(function(rune) {
        var gradeIdx3 = RUNE_GRADES.indexOf(rune.grade);
        var gradeColor3 = RUNE_GRADE_COLORS[gradeIdx3] || '#9ca3af';
        var setDef3 = getRuneSet(rune.setId);
        var slotDef3 = RUNE_SLOTS.find(function(s) { return s.id === rune.slot; });
        html += '<div class="border rounded-lg p-1 text-center" style="border-color:' + gradeColor3 + '44">' +
          '<div class="text-[10px] font-bold" style="color:' + (setDef3 ? setDef3.color : '#9ca3af') + '">' + (setDef3 ? setDef3.name : '') + '</div>' +
          '<div class="text-[9px] text-secondary">' + (slotDef3 ? slotDef3.name : rune.slot + '号') + ' · ' + RUNE_GRADE_NAMES[gradeIdx3] + ' +' + rune.level + '</div>' +
        '</div>';
      });
      if (G.runeBag.length > 12) {
        html += '<div class="border border-dashed border-game rounded-lg p-1 text-center flex items-center justify-center">' +
          '<span class="text-[10px] text-secondary">还有' + (G.runeBag.length - 12) + '枚...</span>' +
        '</div>';
      }
      html += '</div></div>';
    }
  } else {
    html += '<div class="bg-panel border border-dashed border-game rounded-lg p-4 text-center">' +
      '<p class="text-xs text-secondary">👆 请选择一只宠物进行符文管理</p>' +
    '</div>';
  }

  // ===== 远古符文材料库存 =====
  // v2.11.0 需求2.1：符文材料从 runeMaterials 读取（与宠装材料战兵图册彻底拆分）
  var _runeMats = G.runeMaterials || { ancient_rune_low: 0, ancient_rune_mid: 0, ancient_rune_high: 0 };
  html += '<div class="bg-card border border-game rounded-xl p-4 mt-3">' +
    '<h3 class="font-bold text-sm mb-2">📜 远古符文材料库存</h3>' +
    '<div class="grid grid-cols-3 gap-2 text-xs">' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-gray-400">低级远古符文</p><p class="text-yellow-400 font-bold">×' + (_runeMats.ancient_rune_low || 0) + '</p><p class="text-secondary">强化1-5级</p></div>' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-blue-400">中级远古符文</p><p class="text-yellow-400 font-bold">×' + (_runeMats.ancient_rune_mid || 0) + '</p><p class="text-secondary">强化6-10级</p></div>' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-orange-400">高级远古符文</p><p class="text-yellow-400 font-bold">×' + (_runeMats.ancient_rune_high || 0) + '</p><p class="text-secondary">强化11-15级</p></div>' +
    '</div>' +
    '<p class="text-xs text-secondary mt-2">📌 符文强化消耗远古符文材料+金币，分解符文可回收材料</p>' +
  '</div>';

  html += '</div>';
return html;
}


// 选择血统抽取宠物
function selectBloodlinePet(petId) {
  window._bloodlinePetId = petId;
  render();
}

// 内部函数：生成重生预览数据（不消耗道具）
function _generateRebirthPreview(pet) {
  var dex = getPetDex(pet.name);
  var previewGrowth = Math.round(randomFloat(dex.growthRange[0], dex.growthRange[1]) * 100) / 100;
  var previewApt = {};
  APTITUDE_KEYS.forEach(function(k) {
    var range = dex.aptRange[k] || [1200, 1800];
    previewApt[k] = randomInt(range[0], range[1]);
  });
  // 预览技能
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
  var maxSkills = getPetMaxSkills(pet.name);
  var minTotal = Math.max(1, innateSkills.length);
  var totalSkills = randomInt(minTotal, maxSkills);
  var extraCount = totalSkills - innateSkills.length;
  for (var i = 0; i < extraCount && availableLib.length > 0; i++) {
    var idx = randomInt(0, availableLib.length - 1);
    var sk = availableLib.splice(idx, 1)[0];
    innateSkills.push({ ...sk, isInnate: true });
    usedBaseIds.add(getSkillBaseId(sk.id));
  }
  var skillNames = innateSkills.map(function(s) { return s.name; }).join('、') || '无';
  // 预览新品质：根据新成长/资质重新计算
  var previewPet = { name: pet.name, growth: previewGrowth, aptitude: previewApt, rarity: pet.rarity };
  var previewRarity = recalcRarity(previewPet);
  return {
    growth: previewGrowth,
    aptitude: previewApt,
    skillNames: skillNames,
    innateSkills: innateSkills,
    rarity: previewRarity,
  };
}

// 预览重生结果（消耗归元丹/归虚丹，防止无限刷）
function previewRebirth(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var tier = getPetTier(pet.name);
  var needItem = tier >= 4 ? 'guixu_pill' : 'guiyuan_pill';
  var needName = tier >= 4 ? '归虚丹' : '归元丹';
  var inv = G.inventory.find(function(i) { return i.id === needItem; });
  if (!inv || inv.count <= 0) { showToast('需要' + needName + '才能预览重生结果', 'error'); return; }
  // 消耗道具（预览即消耗，防止无限刷）
  inv.count--;
  if (inv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== needItem; });
  // 生成预览
  window._rebirthPreview = _generateRebirthPreview(pet);
  saveGame();
  render();
  showToast('🔮 已消耗 ' + needName + ' x1 预览重生结果', 'info');
}

// 重新预览（消耗新道具）
function rePreviewRebirth(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var tier = getPetTier(pet.name);
  var needItem = tier >= 4 ? 'guixu_pill' : 'guiyuan_pill';
  var needName = tier >= 4 ? '归虚丹' : '归元丹';
  var inv = G.inventory.find(function(i) { return i.id === needItem; });
  if (!inv || inv.count <= 0) { showToast(needName + '不足，无法重新预览', 'error'); return; }
  inv.count--;
  if (inv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== needItem; });
  window._rebirthPreview = _generateRebirthPreview(pet);
  saveGame();
  render();
  showToast('🔄 已消耗 ' + needName + ' x1 重新预览', 'info');
}

// 确认重生（应用预览结果，不再消耗道具——预览时已消耗）
function confirmRebirth(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var preview = window._rebirthPreview;
  if (!preview) { showToast('请先预览重生结果', 'error'); return; }
  // 应用预览结果
  pet.growth = preview.growth;
  pet.aptitude = preview.aptitude;
  pet.innateSkills = preview.innateSkills;
  pet.learnedSkills = [];
  pet.moonDewUsed = 0;
  // 应用预览的新品质
  if (preview.rarity) pet.rarity = preview.rarity;
  // 清除预览，但保留选中的宠物以便查看新属性
  window._rebirthPreview = null;
  saveGame();
  render();
  showToast('🔄 ' + pet.name + ' 已重生！成长/资质/技能/品质已刷新', 'success');
}

// ==================== EVENT HANDLERS ====================

function changeFormation(slotIdx, newPos) {
  const formation = G.player.formation || ['front','mid','back'];
  const oldPos = formation[slotIdx];
  const swapIdx = formation.indexOf(newPos);
  if (swapIdx >= 0 && swapIdx !== slotIdx) {
    formation[swapIdx] = oldPos;
  }
  formation[slotIdx] = newPos;
  G.player.formation = formation;
  saveGame();
  render();
}

// ==================== ARENA SYSTEM ====================

function getArenaRank() {
  const score = G.arenaScore || 0;
  for (let i = ARENA_RANKS.length - 1; i >= 0; i--) {
    if (score >= ARENA_RANKS[i].minScore) return ARENA_RANKS[i];
  }
  return ARENA_RANKS[0];
}

function generateArenaOpponents() {
  const playerCp = getPlayerCombatPower();
  const opponents = [];
  const names = ['暗影骑士', '烈焰法师', '冰霜射手', '圣光牧师', '暗黑术士', '风暴战士', '大地守卫', '星辰贤者', '深渊领主', '黎明剑圣'];
  for (let i = 0; i < 5; i++) {
    const cpMult = 0.7 + Math.random() * 0.6;
    const cp = Math.floor(playerCp * cpMult);
    const rankIdx = Math.min(ARENA_RANKS.length - 1, Math.floor(Math.random() * (getArenaRankIdx() + 2)));
    opponents.push({
      id: 'opp_' + i,
      name: names[i % names.length] + (i > 0 ? '·' + ['I','II','III','IV','V'][i-1] : ''),
      cp,
      rank: ARENA_RANKS[Math.max(0, rankIdx - 1)].id,
      pets: generateOpponentPets(cp),
    });
  }
  G.arenaOpponents = opponents;
  saveGame();
}

function getArenaRankIdx() {
  const rank = getArenaRank();
  return ARENA_RANKS.indexOf(rank);
}

// v2.8.0 需求5.1：竞技场对手宠物生成，使用完整五维属性结构
// 确保getPetStats能正确计算对手宠物的全部属性（含二级属性）
function generateOpponentPets(cp) {
  const pets = [];
  const races = ['史莱姆', '龙', '恶魔', '天使', '哥布林', '精灵'];
  const rarities = ['common', 'uncommon', 'rare', 'epic'];
  for (let i = 0; i < 3; i++) {
    const race = races[randomInt(0, races.length - 1)];
    const rarity = rarities[randomInt(0, Math.min(3, rarities.length - 1))];
    const lv = Math.max(1, G.player.level + randomInt(-3, 3));
    const growth = 1.5 + Math.random() * 1.5;
    var oppApt = {};
    APTITUDE_KEYS.forEach(function(k) { oppApt[k] = randomInt(1200, 2000); });
    // v2.8.0 需求5.1：使用标准 attrPoints 结构，确保 getPetStats 正确计算
    var attrPoints = {};
    ATTRIBUTES.forEach(function(attr) { attrPoints[attr] = lv; });
    pets.push({
      id: 'opp_pet_' + Date.now() + '_' + i + '_' + randomInt(100, 999),
      name: race + '·' + ['战士','法师','守卫'][i],
      race, rarity, level: lv, growth,
      aptitude: oppApt,
      attrPoints: attrPoints,
      freeAttrPoints: 0,
      innateSkills: [], learnedSkills: [], moonDewUsed: 0,
      petEquipment: { attack: null, hp: null, defense: null },
    });
  }
  return pets;
}

function checkArenaWeeklyReset() {
  const today = new Date().toDateString();
  const dayOfWeek = new Date().getDay();
  if (G.arenaWeeklyDate !== today && dayOfWeek === 1) {
    const rank = getArenaRank();
    const rankIdx = ARENA_RANKS.indexOf(rank);
    const diamondReward = [50, 100, 200, 400, 800, 1500][rankIdx] || 50;
    const goldReward = [1000, 3000, 6000, 12000, 25000, 50000][rankIdx] || 1000;
    addDiamond(diamondReward);
    addGold(goldReward);
    G.arenaWeeklyDate = today;
    showToast(`🏆 竞技场周结算：${rank.icon} ${rank.name} 获得 💎${diamondReward} 🪙${goldReward}`, 'success');
  }
  if (G.arenaDailyUsed === undefined) G.arenaDailyUsed = 0;
  const lastDate = G.dailyTaskDate || '';
  if (lastDate !== today) {
    G.arenaDailyUsed = 0;
    G.arenaChallengedOpps = {};
  }
}

function renderArenaScreen() {
  const rank = getArenaRank();
  const rankIdx = ARENA_RANKS.indexOf(rank);
  const nextRank = rankIdx < ARENA_RANKS.length - 1 ? ARENA_RANKS[rankIdx + 1] : null;
  const dailyLeft = Math.max(0, 5 - (G.arenaDailyUsed || 0));
  if (G.arenaOpponents.length === 0) generateArenaOpponents();
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">⚔️ 竞技场</h1>
      <span class="text-sm text-secondary">今日剩余 ${dailyLeft}/5 次</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="font-bold text-lg" style="color:${rank.color}">${rank.icon} ${rank.name}</h2>
            <p class="text-xs text-secondary">积分：${G.arenaScore || 0} ${nextRank ? '→ 下一段位需 ' + nextRank.minScore + ' 分' : '· 已达最高段位'}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-secondary">战力 ${Math.floor(getPlayerCombatPower()).toLocaleString()}</p>
          </div>
        </div>
        ${nextRank ? `<div class="progress-bar mb-3"><div class="progress-fill bg-gradient-to-r from-yellow-500 to-orange-500" style="width:${Math.min(100, Math.floor((G.arenaScore||0)/nextRank.minScore*100))}%"></div></div>` : ''}
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🎯 挑战对手</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${G.arenaOpponents.map((opp, i) => {
            const oppRank = ARENA_RANKS.find(r => r.id === opp.rank) || ARENA_RANKS[0];
            const challenged = G.arenaChallengedOpps && G.arenaChallengedOpps[opp.id];
            const canChallenge = dailyLeft > 0 && !challenged;
            return `
            <div class="bg-panel border border-game rounded-xl p-4 ${challenged ? 'opacity-50' : ''}">
              <div class="flex items-center justify-between mb-2">
                <span class="font-bold">${opp.name}</span>
                <span class="text-xs" style="color:${oppRank.color}">${oppRank.icon} ${oppRank.name}</span>
              </div>
              <p class="text-xs text-secondary mb-2">战力 ${opp.cp.toLocaleString()}</p>
              <div class="flex gap-1 mb-2 text-xs text-secondary">
                ${opp.pets.map(p => `<span>${p.race}</span>`).join(' · ')}
              </div>
              <button class="btn-primary btn-sm w-full" ${!canChallenge ? 'disabled style="opacity:0.5"' : ''}
                onclick="startArenaBattle(${i})">${challenged ? '✅ 已挑战' : dailyLeft <= 0 ? '次数已用完' : '⚔️ 挑战'}</button>
            </div>`;
          }).join('')}
        </div>
        ${dailyLeft <= 0 ? '<p class="text-xs text-secondary mt-2 text-center">今日挑战次数已用完，明天再来吧！</p>' : ''}
        <button class="btn-gold btn-sm mt-3 w-full" onclick="generateArenaOpponents();render()">🔄 刷新对手</button>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🏆 段位奖励</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          ${ARENA_RANKS.map((r, i) => `
            <div class="bg-panel rounded-lg p-2 text-center ${rankIdx >= i ? 'border border-yellow-600/50' : ''}">
              <p style="color:${r.color}">${r.icon} ${r.name}</p>
              <p class="text-secondary">${r.minScore}+ 分</p>
              <p class="text-gold">💎${[50,100,200,400,800,1500][i]}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </main>
  </div>`;
}

let arenaBattle = null;
let arenaBattleTimer = null;

function startArenaBattle(oppIdx) {
  if ((G.arenaDailyUsed || 0) >= 5) { showToast('今日挑战次数已用完！', 'error'); return; }
  const opp = G.arenaOpponents[oppIdx];
  if (!opp) return;
  if (G.arenaChallengedOpps && G.arenaChallengedOpps[opp.id]) { showToast('今天已经挑战过这个对手了！', 'error'); return; }
  if (!G.arenaChallengedOpps) G.arenaChallengedOpps = {};
  G.arenaChallengedOpps[opp.id] = true;
  G.arenaDailyUsed = (G.arenaDailyUsed || 0) + 1;
  updateDailyTask('arena_3', 1);
  const team = getTeamPets();
  if (team.length === 0) { showToast('请先设置出战宠物！', 'error'); return; }
  stopLiveBattle();
  if (autoBattleInterval) { clearInterval(autoBattleInterval); autoBattleInterval = null; }
  arenaBattle = {
    opp,
    team: team.map(p => ({ ...p })),
    oppPets: opp.pets.map(p => ({ ...p })),
    petHp: {},
    oppHp: {},
    round: 0,
    phase: 'player_turn',
    currentPetIdx: 0,
    currentOppIdx: 0,
    logs: [],
    finished: false,
    playerWon: false,
  };
  team.forEach(p => { const s = getPetStats(p); arenaBattle.petHp[p.id] = { current: s.气血, max: s.气血 }; });
  opp.pets.forEach(p => { const s = getPetStats(p); arenaBattle.oppHp[p.id] = { current: s.气血, max: s.气血 }; });
  currentScreen = 'arena_battle';
  render();
  arenaBattleTimer = setInterval(() => executeArenaTurn(), 800);
}

function executeArenaTurn() {
  if (!arenaBattle || arenaBattle.finished) { clearInterval(arenaBattleTimer); return; }
  if (arenaBattle.phase === 'player_turn') {
    const alive = arenaBattle.team.findIndex((p) => {
      const hp = arenaBattle.petHp[p.id]; return hp && hp.current > 0;
    });
    if (alive < 0) { arenaBattle.finished = true; arenaBattle.playerWon = false; finishArenaBattle(); return; }
    const pet = arenaBattle.team[alive];
    const stats = getPetStats(pet);
    const oppAlive = arenaBattle.oppPets.findIndex((p) => {
      const hp = arenaBattle.oppHp[p.id]; return hp && hp.current > 0;
    });
    if (oppAlive < 0) { arenaBattle.finished = true; arenaBattle.playerWon = true; finishArenaBattle(); return; }
    const target = arenaBattle.oppPets[oppAlive];
    const oppStats = getPetStats(target);
    // 闪避判定
    if (Math.random() < (oppStats.dodgeRate || 0)) {
      arenaBattle.logs.unshift(`💨 ${getPetDisplayName(target)} 闪避了 ${getPetDisplayName(pet)} 的攻击`);
    } else {
      // 真实伤害公式
      var atk = stats.攻击力;
      var def = oppStats.防御力 || 0;
      var baseDmg = atk * randomFloat(0.90, 1.10);
      var ignoreDef = (stats.passives && stats.passives.ignore_def) || 0;
      var effectiveDef = Math.max(0, def * (1 - ignoreDef));
      var dmg = Math.max(1, Math.floor(baseDmg - effectiveDef * 0.5));
      // 暴击判定
      var critRate = 0.10 + (stats.critRate || 0);
      var isCrit = Math.random() < critRate;
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      // 宠物伤害加成
      dmg = Math.floor(dmg * (1 + (stats.petDmgBonus || 0)));
      // 格挡特效
      if (oppStats.equipSpecials && oppStats.equipSpecials.indexOf('block') >= 0 && Math.random() < 0.10) {
        dmg = Math.floor(dmg * 0.5);
        arenaBattle.logs.unshift(`🛡️ ${getPetDisplayName(target)} 格挡了50%伤害`);
      }
      arenaBattle.oppHp[target.id].current = Math.max(0, arenaBattle.oppHp[target.id].current - dmg);
      arenaBattle.logs.unshift(`⚔️ ${getPetDisplayName(pet)}${isCrit ? ' 暴击' : ''}攻击 ${getPetDisplayName(target)} 造成 ${dmg} 伤害`);
    }
    arenaBattle.phase = 'opp_turn';
  } else {
    const alive = arenaBattle.oppPets.findIndex((p) => {
      const hp = arenaBattle.oppHp[p.id]; return hp && hp.current > 0;
    });
    if (alive < 0) { arenaBattle.finished = true; arenaBattle.playerWon = true; finishArenaBattle(); return; }
    const oppPet = arenaBattle.oppPets[alive];
    const stats = getPetStats(oppPet);
    const teamAlive = arenaBattle.team.findIndex((p) => {
      const hp = arenaBattle.petHp[p.id]; return hp && hp.current > 0;
    });
    if (teamAlive < 0) { arenaBattle.finished = true; arenaBattle.playerWon = false; finishArenaBattle(); return; }
    const target = arenaBattle.team[teamAlive];
    const targetStats = getPetStats(target);
    // 闪避判定
    if (Math.random() < (targetStats.dodgeRate || 0)) {
      arenaBattle.logs.unshift(`💨 ${target.name} 闪避了 ${oppPet.name} 的攻击`);
    } else {
      // 真实伤害公式
      var atk = stats.攻击力;
      var def = targetStats.防御力 || 0;
      var baseDmg = atk * randomFloat(0.90, 1.10);
      var dmg = Math.max(1, Math.floor(baseDmg - def * 0.5));
      // 暴击判定
      var critRate = 0.10 + (stats.critRate || 0);
      var isCrit = Math.random() < critRate;
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      // 格挡特效
      if (targetStats.equipSpecials && targetStats.equipSpecials.indexOf('block') >= 0 && Math.random() < 0.10) {
        dmg = Math.floor(dmg * 0.5);
        arenaBattle.logs.unshift(`🛡️ ${target.name} 格挡了50%伤害`);
      }
      arenaBattle.petHp[target.id].current = Math.max(0, arenaBattle.petHp[target.id].current - dmg);
      arenaBattle.logs.unshift(`👹 ${oppPet.name}${isCrit ? ' 暴击' : ''}攻击 ${target.name} 造成 ${dmg} 伤害`);
    }
    arenaBattle.phase = 'player_turn';
  }
  arenaBattle.round++;
  if (arenaBattle.round > 50) { arenaBattle.finished = true; arenaBattle.playerWon = false; finishArenaBattle(); return; }
  if (currentScreen === 'arena_battle') render();
}

function finishArenaBattle() {
  clearInterval(arenaBattleTimer);
  var oppName = arenaBattle.opp ? arenaBattle.opp.name : '对手';
  if (arenaBattle.playerWon) {
    const scoreGain = randomInt(20, 50);
    const goldGain = randomInt(200, 500);
    G.arenaScore = (G.arenaScore || 0) + scoreGain;
    addGold(goldGain);
    updateAchievement('arena', 1);
    const newRank = getArenaRank();
    var promoted = false;
    if (newRank.id !== G.arenaRank) {
      G.arenaRank = newRank.id;
      promoted = true;
      showToast(`🎉 晋升 ${newRank.icon} ${newRank.name}！`, 'success');
    }
    var diamondGain = 0;
    if ((G.arenaDailyUsed || 0) === 1) {
      addDiamond(30);
      diamondGain = 30;
      showToast(`🏆 竞技场胜利！+${scoreGain}分 +${goldGain}金币 💎首胜+30钻石`, 'success');
    } else {
      showToast(`🏆 竞技场胜利！+${scoreGain}分 +${goldGain}金币`, 'success');
    }
    // 需求6：竞技场收获日志
    if (typeof addActivityLog === 'function') {
      var logText = '竞技场胜利 vs ' + oppName + '：+' + scoreGain + '分 +' + goldGain + '金币';
      if (diamondGain > 0) logText += ' 💎+' + diamondGain;
      if (promoted) logText += '（晋升' + newRank.name + '）';
      addActivityLog('arena', logText, 'win');
    }
  } else {
    const scoreLoss = randomInt(10, 30);
    G.arenaScore = Math.max(0, (G.arenaScore || 0) - scoreLoss);
    showToast(`😞 竞技场失败，-${scoreLoss}分`, 'error');
    // 需求6：竞技场收获日志
    if (typeof addActivityLog === 'function') {
      addActivityLog('arena', '竞技场失败 vs ' + oppName + '：-' + scoreLoss + '分', 'fail');
    }
  }
  saveGame();
  arenaBattle = null;
  currentScreen = 'arena';
  render();
}

function renderArenaBattleScreen() {
  if (!arenaBattle) { currentScreen = 'arena'; render(); return ''; }
  const ab = arenaBattle;
  return `
  <div class="min-h-screen flex flex-col bg-bg">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">⚔️ 竞技场战斗</h1>
      <span class="text-sm text-secondary">回合 ${ab.round}</span>
    </header>
    <main class="flex-1 p-4 max-w-3xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-2">👹 ${ab.opp.name}</h2>
        <div class="grid grid-cols-3 gap-2 mb-3">
          ${ab.oppPets.map(p => {
            const hp = ab.oppHp[p.id];
            const hpPct = hp ? Math.max(0, Math.floor(hp.current/hp.max*100)) : 100;
            const dead = hp && hp.current <= 0;
            return `<div class="bg-panel rounded-lg p-2 text-center ${dead ? 'opacity-40' : ''}">
              <p class="text-xs font-bold">${p.name}</p>
              <p class="text-xs text-secondary">${p.race} Lv.${p.level}</p>
              <div class="progress-bar mt-1"><div class="progress-fill ${dead ? 'bg-red-600' : 'bg-red-500'}" style="width:${hpPct}%"></div></div>
              <p class="text-xs text-secondary">${hp ? Math.floor(hp.current) : 0}/${hp ? hp.max : 0}</p>
              ${dead ? '<p class="text-xs text-red-400">🪦</p>' : ''}
            </div>`;
          }).join('')}
        </div>
        <div class="text-center text-2xl font-bold text-red-400 my-2">VS</div>
        <h2 class="font-bold text-lg mb-2">🐾 我方</h2>
        <div class="grid grid-cols-3 gap-2">
          ${ab.team.map(p => {
            const hp = ab.petHp[p.id];
            const hpPct = hp ? Math.max(0, Math.floor(hp.current/hp.max*100)) : 100;
            const dead = hp && hp.current <= 0;
            return `<div class="bg-panel rounded-lg p-2 text-center ${dead ? 'opacity-40' : ''}">
              <p class="text-xs font-bold" style="color:${RARITY_COLORS[RARITIES.indexOf(p.rarity)]}">${p.name}</p>
              <p class="text-xs text-secondary">${p.race} Lv.${p.level}</p>
              <div class="progress-bar mt-1"><div class="progress-fill ${dead ? 'bg-red-600' : 'bg-green-500'}" style="width:${hpPct}%"></div></div>
              <p class="text-xs text-secondary">${hp ? Math.floor(hp.current) : 0}/${hp ? hp.max : 0}</p>
              ${dead ? '<p class="text-xs text-red-400">🪦</p>' : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4 max-h-[200px] overflow-y-auto">
        <h3 class="font-bold text-sm mb-2">📜 战斗日志</h3>
        ${ab.logs.slice(0, 20).map(l => `<p class="text-xs text-secondary mb-1">${l}</p>`).join('')}
      </div>
      ${ab.finished ? `<button class="btn-gold w-full" onclick="finishArenaBattle()">${ab.playerWon ? '🏆 胜利！点击继续' : '😞 失败，点击继续'}</button>` : ''}
    </main>
  </div>`;
}

// ==================== ACTIVITY SYSTEM ====================

var treasureHuntResult = null; // 打宝图结果

// 需求2：活动上阵阵容预览栏 —— 显示当前出战队伍真实属性，每个独立战斗活动页面顶部展示
function renderActivityTeamBar() {
  var team = getTeamPets();
  var totalCp = 0;
  var totalHp = 0;
  var totalAtk = 0;

  // 计算队伍总战力、总HP、总攻击
  team.forEach(function(p) {
    var cp = (typeof getPetCombatPower === 'function') ? getPetCombatPower(p) : 0;
    var stats = (typeof getPetStats === 'function') ? getPetStats(p) : null;
    totalCp += (cp || 0);
    totalHp += (stats ? Math.max(0, Math.floor(stats.气血 || 0)) : 0);
    totalAtk += (stats ? Math.max(0, Math.floor(stats.攻击力 || 0)) : 0);
  });
  totalCp = Math.floor(totalCp) || 0;
  totalHp = Math.max(0, totalHp);
  totalAtk = Math.max(0, totalAtk);

  // 3个槽位展示
  var slotsHtml = '';
  for (var i = 0; i < 3; i++) {
    var petId = G.player.activeTeam[i];
    var pet = petId ? G.pets.find(function(p) { return p.id === petId; }) : null;
    if (pet) {
      var stats = (typeof getPetStats === 'function') ? getPetStats(pet) : null;
      var hp = stats ? Math.max(0, Math.floor(stats.气血 || 0)) : 0;
      var atk = stats ? Math.max(0, Math.floor(stats.攻击力 || 0)) : 0;
      var rarityIdx = RARITIES.indexOf(pet.rarity);
      var color = RARITY_COLORS[rarityIdx] || '#9ca3af';
      slotsHtml += '<div class="flex-1 bg-panel rounded-lg p-2 border" style="border-color:' + color + '33">' +
        '<div class="flex items-center gap-1 mb-1">' +
          '<span class="text-xs font-bold truncate" style="color:' + color + '">' + getPetDisplayName(pet) + '</span>' +
        '</div>' +
        '<div class="text-[10px] text-secondary">' + pet.race + ' Lv.' + (pet.level || 1) + '</div>' +
        '<div class="text-[10px] mt-1">' +
          '<span class="text-red-400">❤' + hp.toLocaleString() + '</span> ' +
          '<span class="text-orange-400">⚔' + atk.toLocaleString() + '</span>' +
        '</div>' +
      '</div>';
    } else {
      slotsHtml += '<div class="flex-1 bg-panel rounded-lg p-2 border border-dashed border-game flex items-center justify-center">' +
        '<span class="text-xs text-gray-500">空位 ' + (i + 1) + '</span>' +
      '</div>';
    }
  }

  // 阵容为空时的警告
  var emptyWarning = team.length === 0
    ? '<div class="text-xs text-red-400 mt-2 text-center">⚠️ 未设置出战宠物，无法进行活动战斗</div>'
    : '';

  return '<div class="bg-card border-2 border-yellow-700 rounded-xl p-3 mb-3">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<div class="flex items-center gap-2">' +
        '<span class="text-sm font-bold text-yellow-400">🐾 上阵阵容</span>' +
        '<span class="text-xs text-secondary">出战 ' + team.length + '/3</span>' +
      '</div>' +
      '<div class="flex items-center gap-2">' +
        '<div class="text-xs text-right">' +
          '<span class="text-secondary">总战力 </span>' +
          '<span class="font-bold text-yellow-400">' + totalCp.toLocaleString() + '</span>' +
          '<span class="text-secondary ml-2">总HP </span>' +
          '<span class="font-bold text-red-400">' + totalHp.toLocaleString() + '</span>' +
        '</div>' +
        '<button class="btn-primary btn-sm text-xs whitespace-nowrap" onclick="currentScreen=\'pets\';render()">⚙️ 调整阵容</button>' +
      '</div>' +
    '</div>' +
    '<div class="flex gap-2">' + slotsHtml + '</div>' +
    emptyWarning +
  '</div>';
}

function renderActivityScreen() {
  // 需求3.2：默认活动改为派遣（1级解锁，首个可用活动）
  var sheet = window._activitySheet || 'dispatch';
  // 需求3.2：活动列表按解锁等级正序排列
  var sheetTabs = [
    { id: 'dispatch', label: '派遣', icon: '🎒' },         // 1级解锁
    { id: 'arena', label: '竞技场', icon: '⚔️' },           // 10级解锁
    { id: 'tower', label: '爬塔', icon: '🗼' },             // 15级解锁
    { id: 'petcave', label: '宠物秘境', icon: '🐾' },       // 20级解锁
    { id: 'evoforest', label: '符文洞窟', icon: '🔮' },     // 20级解锁
    { id: 'skillbook', label: '技能秘境', icon: '📚' },     // 25级解锁
    { id: 'formation', label: '押镖', icon: '🛡️' },         // 30级解锁
    { id: 'fortress', label: '血色要塞', icon: '🏰' },       // 35级解锁
    { id: 'treasure', label: '打宝图', icon: '🗺️' },         // 50级解锁
    { id: 'runecycle', label: '进化之梯', icon: '🌟' },      // 50级解锁
    { id: 'samsara', label: '六道轮回', icon: '🌀' },        // 70级解锁
];
  var tabsHtml = sheetTabs.map(function(t) {
    var active = sheet === t.id;
    // 需求5：活动页功能等级限制
    var isLocked = false;
    var lockLv = 0;
    if (typeof ACTIVITY_TAB_FEATURE_MAP !== 'undefined' && ACTIVITY_TAB_FEATURE_MAP[t.id]) {
      var featId = ACTIVITY_TAB_FEATURE_MAP[t.id];
      if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked(featId)) {
        isLocked = true;
        lockLv = getFeatureUnlockLevel(featId);
      }
    }
    var lockSuffix = isLocked ? ' 🔒' + lockLv : '';
    var lockCls = isLocked ? ' opacity-50 cursor-not-allowed' : '';
    // 需求3.2：六道轮回 tab 点击后跳转到独立页面
    var onclickStr;
    if (isLocked) {
      onclickStr = '';
    } else if (t.id === 'samsara') {
      onclickStr = 'onclick="currentScreen=\'samsara\';render()"';
    } else {
      onclickStr = 'onclick="window._activitySheet=\'' + t.id + '\';render()"';
    }
    return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + lockCls + '"' + (onclickStr ? ' ' + onclickStr : '') + ' title="' + (isLocked ? '需要' + lockLv + '级解锁' : '') + '">' + t.icon + ' ' + t.label + lockSuffix + '</button>';
  }).join('');

  // 需求3.2：如果当前选中的活动被锁定，自动切回第一个解锁的（派遣默认解锁）
  var currentTabLocked = false;
  if (typeof ACTIVITY_TAB_FEATURE_MAP !== 'undefined' && ACTIVITY_TAB_FEATURE_MAP[sheet]) {
    var curFeatId = ACTIVITY_TAB_FEATURE_MAP[sheet];
    if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked(curFeatId)) {
      currentTabLocked = true;
    }
  }
  if (currentTabLocked) {
    sheet = 'dispatch'; // 默认切换到派遣（1级解锁）
    window._activitySheet = 'dispatch';
  }

  var contentHtml = '';
  if (sheet === 'treasure') {
    contentHtml = renderActivityTreasure();
  } else if (sheet === 'tower') {
    contentHtml = renderActivityTower();
  } else if (sheet === 'arena') {
contentHtml = renderActivityArena();
} else if (sheet === 'formation') {
    contentHtml = renderActivityFormationEscort();
  } else if (sheet === 'skillbook') {
    contentHtml = renderActivitySkillBookHunt();
  } else if (sheet === 'petcave') {
    contentHtml = renderActivityPetCave();
  } else if (sheet === 'dispatch') {
    contentHtml = renderActivityDispatch();
  } else if (sheet === 'fortress') {
    contentHtml = renderActivityCrimsonFortress();
  } else if (sheet === 'runecycle') {
    // v2.8.0 需求4.1：进化之梯展示进化之梯规则与奖励（原符文循环）
    contentHtml = renderActivityRuneCycle();
  } else if (sheet === 'evoforest') {
    // v2.8.0 需求4.1：符文洞窟展示符文洞窟规则与奖励（原进化森林）
    contentHtml = renderActivityEvolutionForest();
  }

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🎯 活动</h1>
      <div class="flex gap-3 text-sm">
        <span class="text-yellow-400">🪙 ${G.player.gold.toLocaleString()}</span>
        <span class="text-blue-400">💎 ${G.player.diamond.toLocaleString()}</span>
      </div>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-3">
        <div class="flex flex-wrap gap-1">${tabsHtml}</div>
      </div>
      ${contentHtml}
    </main>
  </div>`;
}

// 需求7：活动战斗模态框 - 独立窗口展示活动战斗，不影响主线挂机
// 需求5：血色要塞活动页面
function renderActivityCrimsonFortress() {
  var remaining = (typeof getCrimsonFortressRemaining === 'function') ? getCrimsonFortressRemaining() : 2;
  var cf = G.crimsonFortress;
  
  // 如果活动正在进行中，显示战斗界面
  if (cf && cf.active) {
    var diff = (typeof CRIMSON_FORTRESS_DIFFICULTIES !== 'undefined') ? CRIMSON_FORTRESS_DIFFICULTIES.find(function(d) { return d.id === cf.difficulty; }) : null;
    var diffName = diff ? diff.name : '未知';
    // Buff选择界面（pendingBuffs 存在时显示3选1）
    if (cf.pendingBuffs && cf.pendingBuffs.length > 0) {
      var buffCards = cf.pendingBuffs.map(function(buff) {
        var qualityColors = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7' };
        var qualityNames = { common: '普通', uncommon: '精良', rare: '稀有', epic: '史诗' };
        var color = qualityColors[buff.quality] || '#9ca3af';
        var qName = qualityNames[buff.quality] || '普通';
        return '<div class="bg-panel rounded-xl p-3 border-2 cursor-pointer hover:bg-opacity-80 transition-all" style="border-color:' + color + '44" onclick="selectCrimsonFortressBuffUI(\'' + buff.id + '\')">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<span class="font-bold text-sm" style="color:' + color + '">' + buff.name + '</span>' +
            '<span class="text-xs px-1.5 py-0.5 rounded" style="background:' + color + '22;color:' + color + '">' + qName + '</span>' +
          '</div>' +
          '<p class="text-xs text-secondary">' + buff.desc + '</p>' +
        '</div>';
      }).join('');
      return '<div class="bg-card border border-game rounded-xl p-4">' +
        '<h2 class="font-bold text-lg text-yellow-400 mb-2">🏰 血色要塞 · 第' + (cf.round + 1) + '关</h2>' +
        '<p class="text-xs text-secondary mb-3">⚔️ 选择一个增益强化你的队伍！（效果可累加）</p>' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' + buffCards + '</div>' +
      '</div>';
    }
    
    // 已选buff列表
    var buffsHtml = (cf.buffs && cf.buffs.length > 0) ? cf.buffs.map(function(b) {
      return '<span class="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-600/30">' + b.name + '</span>';
    }).join('') : '<span class="text-xs text-secondary">暂无增益</span>';
    
    return '<div class="bg-card border border-game rounded-xl p-4">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<h2 class="font-bold text-lg text-red-400">🏰 血色要塞 · ' + diffName + '</h2>' +
        '<button class="btn-sm border border-red-700 text-red-400" onclick="abandonCrimsonFortressUI()">🏳️ 放弃</button>' +
      '</div>' +
      '<div class="grid grid-cols-3 gap-2 mb-3 text-center">' +
        '<div class="bg-panel rounded p-2"><p class="text-xs text-secondary">当前关卡</p><p class="text-lg font-bold text-gold">' + (cf.round + 1) + '</p></div>' +
        '<div class="bg-panel rounded p-2"><p class="text-xs text-secondary">击杀数</p><p class="text-lg font-bold text-red-400">' + cf.kills + '</p></div>' +
        '<div class="bg-panel rounded p-2"><p class="text-xs text-secondary">已选增益</p><p class="text-lg font-bold text-purple-400">' + (cf.buffs ? cf.buffs.length : 0) + '</p></div>' +
      '</div>' +
      '<div class="bg-panel rounded-lg p-2 mb-3"><p class="text-xs text-secondary mb-1">已选增益：</p><div class="flex flex-wrap gap-1">' + buffsHtml + '</div></div>' +
      '<div class="text-center">' +
        '<p class="text-xs text-secondary mb-2">💡 每5关可选择一次增益buff，怪物每5关强化5%</p>' +
        '<button class="btn-primary" onclick="beginCrimsonFortressBattle()">⚔️ 挑战第' + (cf.round + 1) + '关</button>' +
      '</div>' +
    '</div>';
  }
  
  // 活动未进行中，显示难度选择界面
  var diffHtml = '';
  if (typeof CRIMSON_FORTRESS_DIFFICULTIES !== 'undefined') {
    diffHtml = CRIMSON_FORTRESS_DIFFICULTIES.map(function(d) {
      return '<div class="bg-panel rounded-xl p-4 border border-game">' +
        '<div class="flex items-center justify-between mb-2">' +
          '<h3 class="font-bold text-base" style="color:' + (d.id === 'easy' ? '#22c55e' : d.id === 'normal' ? '#f59e0b' : '#ef4444') + '">' + d.name + '</h3>' +
          '<button class="btn-primary btn-sm" ' + (remaining <= 0 ? 'disabled style="opacity:0.4"' : '') + ' onclick="startCrimsonFortressUI(\'' + d.id + '\')">挑战</button>' +
        '</div>' +
        '<p class="text-xs text-secondary">' + d.desc + '</p>' +
        '<p class="text-xs text-yellow-400/70 mt-1">经验倍率：' + d.expMult + '倍</p>' +
      '</div>';
    }).join('');
  }
  
  return renderActivityTeamBar() + '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
      '<h2 class="font-bold text-lg text-red-400">🏰 血色要塞</h2>' +
      '<span class="text-xs text-secondary">今日剩余：' + remaining + ' 次</span>' +
    '</div>' +
    '<p class="text-sm text-secondary mb-3">血色要塞是一个无限轮次的Roguelike战斗活动。每5关可选择一次增益buff，非领主怪五维属性提升30%，每5轮怪物属性永久递增10%。战斗失败时按击杀数结算奖励，经验为正常的3倍。</p>' +
    '<div class="space-y-3">' + diffHtml + '</div>' +
  '</div>' +
  (typeof renderActivityHarvestLog === 'function' ? renderActivityHarvestLog('fortress', '血色要塞收获日志') : '');
}

// ==================== 进化之梯活动页面（原符文循环，v2.8.0重构） ====================
// v2.8.0 需求4.1：奖励池替换为进化晶石
function renderActivityRuneCycle() {
  var today = new Date().toDateString();
  if (!G.runeCycleUsed) G.runeCycleUsed = {};
  var usedCount = G.runeCycleUsed[today] || 0;
  var remaining = RUNE_CYCLE_CONFIG.dailyLimit - usedCount;
  var cp = Math.floor(getPlayerCombatPower());
  var activityName = (RUNE_CYCLE_CONFIG.name || '进化之梯');

  // 确定当前档位
  var currentTier = RUNE_CYCLE_CONFIG.tiers[0];
  var currentTierIdx = 0;
  for (var i = 0; i < RUNE_CYCLE_CONFIG.tiers.length; i++) {
    if (cp >= RUNE_CYCLE_CONFIG.tiers[i].cpMin) {
      currentTier = RUNE_CYCLE_CONFIG.tiers[i];
      currentTierIdx = i;
    }
  }

  var tierNames = ['入门', '初级', '中级', '高级', '精英', '大师'];
  var tierColors = ['#9ca3af', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'];

  // v2.8.0 需求4.1：档位奖励表（进化晶石）
  var tierHtml = RUNE_CYCLE_CONFIG.tiers.map(function(t, i) {
    var isActive = i === currentTierIdx;
    var name = tierNames[i] || ('第' + (i + 1) + '档');
    var color = tierColors[i] || '#9ca3af';
    var rewardParts = [];
    if (t.crystalLow > 0) rewardParts.push('💠低级晶石×' + t.crystalLow);
    if (t.crystalMid > 0) rewardParts.push('💠中级晶石×' + t.crystalMid);
    if (t.crystalHigh > 0) rewardParts.push('💠高级晶石×' + t.crystalHigh);
    return '<div class="bg-panel rounded-lg p-2 border ' + (isActive ? 'border-yellow-500 bg-yellow-900/10' : 'border-game') + '">' +
      '<div class="flex items-center justify-between mb-1">' +
        '<span class="text-sm font-bold" style="color:' + color + '">' + name + (isActive ? ' ← 当前' : '') + '</span>' +
        '<span class="text-xs text-secondary">战力≥' + t.cpMin.toLocaleString() + '</span>' +
      '</div>' +
      '<p class="text-xs text-secondary">' + rewardParts.join(' · ') + '</p>' +
    '</div>';
  }).join('');

  // 进化晶石库存
  var invLow = 0, invMid = 0, invHigh = 0;
  if (G.inventory) {
    var lowItem = G.inventory.find(function(i) { return i.id === 'evolution_crystal_low'; });
    var midItem = G.inventory.find(function(i) { return i.id === 'evolution_crystal_mid'; });
    var highItem = G.inventory.find(function(i) { return i.id === 'evolution_crystal_high'; });
    invLow = lowItem ? lowItem.count : 0;
    invMid = midItem ? midItem.count : 0;
    invHigh = highItem ? highItem.count : 0;
  }

  var html = renderActivityTeamBar() + '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
      '<h2 class="font-bold text-lg text-purple-400">🌟 ' + activityName + '</h2>' +
      '<span class="text-xs ' + (remaining > 0 ? 'text-green-400' : 'text-red-400') + '">今日剩余：' + remaining + '/' + RUNE_CYCLE_CONFIG.dailyLimit + ' 次</span>' +
    '</div>' +
    '<p class="text-sm text-secondary mb-3">进化之梯蕴含远古进化能量，每日可挑战 ' + RUNE_CYCLE_CONFIG.dailyLimit + ' 次。系统根据当前战力自动匹配奖励档位，战力越高，进化晶石越丰厚，用于宠物进阶提升。</p>' +

    // 当前战力 & 档位
    '<div class="bg-panel rounded-lg p-3 mb-3 border border-purple-700/30">' +
      '<div class="flex items-center justify-between">' +
        '<div><p class="text-xs text-secondary">当前战力</p><p class="text-2xl font-bold text-purple-400">' + cp.toLocaleString() + '</p></div>' +
        '<div class="text-right"><p class="text-xs text-secondary">奖励档位</p><p class="text-lg font-bold" style="color:' + (tierColors[currentTierIdx] || '#9ca3af') + '">' + (tierNames[currentTierIdx] || '第' + (currentTierIdx + 1) + '档') + '</p></div>' +
      '</div>' +
    '</div>' +

    // 进化晶石库存
    '<div class="grid grid-cols-3 gap-2 mb-3 text-center">' +
      '<div class="bg-panel rounded p-2 border border-game"><p class="font-bold text-gray-400 text-sm">💠 低级晶石</p><p class="text-yellow-400 font-bold">×' + invLow + '</p></div>' +
      '<div class="bg-panel rounded p-2 border border-game"><p class="font-bold text-blue-400 text-sm">💠 中级晶石</p><p class="text-yellow-400 font-bold">×' + invMid + '</p></div>' +
      '<div class="bg-panel rounded p-2 border border-game"><p class="font-bold text-orange-400 text-sm">💠 高级晶石</p><p class="text-yellow-400 font-bold">×' + invHigh + '</p></div>' +
    '</div>' +

    // 档位奖励表
    '<h3 class="text-sm font-bold text-gold mb-2">📋 战力档位奖励一览</h3>' +
    '<div class="space-y-2 mb-3">' + tierHtml + '</div>' +

    // 挑战按钮
    '<div class="text-center">' +
      '<button class="btn-primary ' + (remaining <= 0 ? 'opacity-40 cursor-not-allowed' : '') + '" ' + (remaining <= 0 ? 'disabled' : 'onclick="startRuneCycleChallenge()"') + '>🌟 发起挑战（剩余 ' + remaining + ' 次）</button>' +
      '<p class="text-xs text-secondary mt-2">💡 进化晶石可用于宠物进阶，提升宠物战斗力</p>' +
    '</div>' +
  '</div>' +
  (typeof renderActivityHarvestLog === 'function' ? renderActivityHarvestLog('runecycle', activityName + '收获日志') : '');

  return html;
}

function renderActivityBattleModal() {
  var ab = window._activityBattle;
  if (!ab) return '';
  var enemyHpPct = Math.max(0, Math.min(100, (ab.enemyHp / ab.enemyMaxHp) * 100));
  var petHpPct = Math.max(0, Math.min(100, (ab.petHp / ab.petMaxHp) * 100));
  var enemyHpColor = enemyHpPct > 50 ? '#22c55e' : enemyHpPct > 25 ? '#f59e0b' : '#ef4444';
  var petHpColor = petHpPct > 50 ? '#22c55e' : petHpPct > 25 ? '#f59e0b' : '#ef4444';
  // 当前回合日志（最近5条）
  var visibleLogs = ab.logs.slice(0, ab.currentTurn).slice(-5);
  var logsHtml = visibleLogs.map(function(l) {
    var color = l.actor === 'pet' ? '#22c55e' : '#ef4444';
    var side = l.actor === 'pet' ? '⚔️' : '💢';
    var target = l.actor === 'pet' ? ('对怪物造成') : ('怪物对队伍造成');
    return '<p class="text-xs" style="color:' + color + '">回合' + l.turn + ' · ' + side + ' ' + (l.target || '') + ' ' + target + ' <span class="font-bold">' + l.dmg + '</span> 伤害</p>';
  }).join('');
  // 队伍宠物展示
  var teamHtml = (ab.team || []).slice(0, 3).map(function(p) {
    var stats = (typeof getPetStats === 'function') ? getPetStats(p) : null;
    var icon = (stats && stats.气血 > 0) ? '🐾' : '🪦';
    return '<div class="text-center"><div class="text-2xl">' + icon + '</div><p class="text-[10px] text-secondary mt-1 truncate max-w-[60px]">' + (getPetDisplayName(p) || '') + '</p></div>';
  }).join('');
  // 结果展示
  var resultHtml = '';
  if (ab.result) {
    var win = ab.result === 'win';
    resultHtml = '<div class="text-center py-4">' +
      '<div class="text-4xl mb-2">' + (win ? '🏆' : '💀') + '</div>' +
      '<p class="text-xl font-bold ' + (win ? 'text-green-400' : 'text-red-400') + '">' + (win ? '战斗胜利！' : '战斗失败...') + '</p>' +
      '</div>';
  }
  return '<div id="activityBattleModal" class="fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(0,0,0,0.85);">' +
    '<div class="bg-card border-2 border-yellow-600 rounded-xl p-4 max-w-md w-full mx-4" style="box-shadow:0 0 30px rgba(245,158,11,0.3);">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<h2 class="font-bold text-lg text-yellow-400">⚔️ 活动战斗 · 第' + ab.stage + '关</h2>' +
        '<button class="text-secondary hover:text-white text-sm" onclick="closeActivityBattleModal()" ' + (ab.result ? '' : 'disabled style="opacity:0.3"') + '>✕</button>' +
      '</div>' +
      // 敌人区域
      '<div class="bg-panel rounded-lg p-3 mb-3 border border-red-900">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-sm font-bold text-red-400">' + (ab.enemyIcon || '👹') + ' ' + (ab.enemyName || '敌人') + '</span>' +
          '<span class="text-xs text-secondary">Lv.' + (ab.enemyLv || 1) + '</span>' +
        '</div>' +
        '<div class="w-full bg-gray-800 rounded-full h-3 mb-1 overflow-hidden">' +
          '<div class="h-3 transition-all duration-500" style="width:' + enemyHpPct + '%;background:' + enemyHpColor + '"></div>' +
        '</div>' +
        '<div class="text-xs text-secondary text-right">HP: ' + Math.max(0, ab.enemyHp).toLocaleString() + ' / ' + ab.enemyMaxHp.toLocaleString() + '</div>' +
      '</div>' +
      // 队伍区域
      '<div class="bg-panel rounded-lg p-3 mb-3 border border-green-900">' +
        '<div class="grid grid-cols-3 gap-2 mb-2">' + teamHtml + '</div>' +
        '<div class="w-full bg-gray-800 rounded-full h-3 mb-1 overflow-hidden">' +
          '<div class="h-3 transition-all duration-500" style="width:' + petHpPct + '%;background:' + petHpColor + '"></div>' +
        '</div>' +
        '<div class="text-xs text-secondary text-right">队伍总HP: ' + Math.max(0, ab.petHp).toLocaleString() + ' / ' + ab.petMaxHp.toLocaleString() + '</div>' +
      '</div>' +
      // 战斗日志
      '<div class="bg-panel rounded-lg p-2 mb-3 min-h-[80px] max-h-[120px] overflow-y-auto">' +
        (logsHtml || '<p class="text-xs text-secondary text-center py-4">⚔️ 战斗开始...</p>') +
      '</div>' +
      // 结果或回合提示
      (ab.result ? resultHtml : '<div class="text-center text-xs text-secondary">⚔️ 战斗进行中... 回合 ' + ab.currentTurn + '/' + ab.logs.length + '</div>') +
      // 关闭按钮（仅战斗结束后显示）
      (ab.result ? '<button class="btn-primary w-full mt-2" onclick="closeActivityBattleModal()">确认</button>' : '') +
    '</div>' +
  '</div>';
}

// 需求6：活动收获日志组件（每个活动页面底部展示当日收获）
function renderActivityHarvestLog(activityId, title) {
  if (typeof getActivityLog !== 'function') return '';
  var logs = getActivityLog(activityId) || [];
  var logsHtml = logs.length === 0 ? '<p class="text-xs text-secondary text-center py-3">今日暂无收获记录</p>' :
    logs.slice().reverse().map(function(l) {
      var color = l.type === 'win' ? 'text-green-400' : (l.type === 'fail' ? 'text-red-400' : 'text-secondary');
      var icon = l.type === 'win' ? '✅' : (l.type === 'fail' ? '❌' : '•');
      return '<div class="flex items-start gap-2 text-xs py-1 border-b border-game/30">' +
        '<span class="text-secondary text-[10px] flex-shrink-0">' + l.time + '</span>' +
        '<span class="' + color + '">' + icon + ' ' + l.text + '</span>' +
        '</div>';
    }).join('');
  return '<div class="bg-card border border-game rounded-xl p-3 mt-3">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<h3 class="text-sm font-bold text-yellow-400">📋 ' + (title || '当日收获日志') + '</h3>' +
      '<span class="text-xs text-secondary">今日 ' + logs.length + ' 条</span>' +
    '</div>' +
    '<div class="max-h-40 overflow-y-auto">' + logsHtml + '</div>' +
    '</div>';
}

// 活动页 - 打宝图
function renderActivityTreasure() {
  var today = new Date().toDateString();
  var doneToday = G.lastTreasureHuntDate === today;
  var resultHtml = '';
  if (treasureHuntResult) {
    var r = treasureHuntResult;
    resultHtml = '<div class="bg-card border-2 rounded-xl p-4 mb-4" style="border-color:' + (r.victory ? '#22c55e' : '#ef4444') + '">' +
      '<h2 class="font-bold text-lg mb-2">' + (r.victory ? '🏆 打宝图完成！' : '😞 打宝图失败') + '</h2>' +
      '<div class="grid grid-cols-2 gap-2 text-xs mb-3">' +
        '<div class="bg-panel rounded p-2"><span class="text-secondary">击败怪物：</span><span class="font-bold text-gold">' + r.killed + '/10</span></div>' +
        '<div class="bg-panel rounded p-2"><span class="text-secondary">获得藏宝图：</span><span class="font-bold text-yellow-400">🗺️ ×' + r.mapsDropped + '</span></div>' +
        '<div class="bg-panel rounded p-2"><span class="text-secondary">获得金币：</span><span class="font-bold text-gold">🪙 ' + r.goldGain + '</span></div>' +
        '<div class="bg-panel rounded p-2"><span class="text-secondary">获得经验：</span><span class="font-bold text-cyan-400">✨ ' + r.expGain + '</span></div>' +
      '</div>';
    if (r.droppedMaps && r.droppedMaps.length > 0) {
      resultHtml += '<div class="text-xs space-y-1">' + r.droppedMaps.map(function(m) {
        var color = '#9ca3af';
        if (m.rarity === 'orange') color = '#f59e0b';
        else if (m.rarity === 'purple') color = '#a855f7';
        else if (m.rarity === 'blue') color = '#3b82f6';
        else if (m.rarity === 'green') color = '#22c55e';
        return '<span style="color:' + color + ';">🗺️ ' + m.name + '</span>';
      }).join('、') + '</div>';
    }
    resultHtml += '<div class="bg-panel rounded p-2 mt-2 max-h-32 overflow-y-auto">' +
      r.logs.map(function(l) { return '<p class="text-xs text-secondary">' + l + '</p>'; }).join('') +
      '</div>' +
      '<button class="btn-primary w-full mt-3" onclick="treasureHuntResult=null;render()">关闭</button>' +
      '</div>';
  }

  var statusBadge = doneToday
    ? '<span class="text-xs px-2 py-0.5 rounded bg-green-900 text-green-400 border border-green-700">今日已完成</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-400 border border-yellow-700">今日可挑战</span>';

  return renderActivityTeamBar() + resultHtml +
    '<div class="bg-card border border-game rounded-xl p-4">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<h2 class="font-bold text-lg">🗺️ 打宝图</h2>' + statusBadge +
      '</div>' +
      '<p class="text-xs text-secondary mb-3">进入宝图战斗，击败10只怪物，每只怪物有20%概率掉落藏宝图。怪物强度参考当前等级。每天限1轮。</p>' +
      '<div class="bg-panel rounded-lg p-3 mb-3 text-xs">' +
        '<p class="text-secondary mb-1">📋 活动规则：</p>' +
        '<p>· 共10只怪物，按当前等级生成怪物强度</p>' +
        '<p>· 每击败1只怪物，20%概率掉落藏宝图</p>' +
        '<p>· 全部击败后获得额外金币和经验奖励</p>' +
        '<p>· 使用当前出战宠物队伍进行战斗</p>' +
        '<p>· ⏰ 每天只能挑战1轮（日常任务「寻宝猎人」）</p>' +
      '</div>' +
      '<button class="btn-gold w-full" ' + (doneToday ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="startTreasureHunt()">' + (doneToday ? '✅ 今日已完成' : '⚔️ 开始打宝图') + '</button>' +
    '</div>' +
    renderActivityHarvestLog('treasure', '打宝图收获日志');
}

// 活动页 - 爬塔
function renderActivityTower() {
  const maxFloors = getMaxTowerFloors();
  const maxStaticFloor = (typeof TOWER_FLOORS !== 'undefined') ? TOWER_FLOORS.length : 100;
  const isCleared = G.towerProgress >= maxFloors;
  const currentFloor = isCleared ? null : getTowerFloorData(G.towerProgress);
  var weekStart = getWeekStartString();
  var weeklyResetUsed = G.towerWeeklyResetDate === weekStart;
  const previewCount = Math.min(50, maxFloors);
  var previewStart = Math.max(0, G.towerProgress - 5);
  if (previewStart + previewCount > maxFloors) previewStart = Math.max(0, maxFloors - previewCount);
  var previewCells = [];
  for (var i = 0; i < previewCount; i++) {
    var fNum = previewStart + i;
    var fd = getTowerFloorData(fNum);
    var cleared = fNum < G.towerProgress;
    var isCurrent = fNum === G.towerProgress;
    var cls = isCurrent ? 'bg-blue-900 text-blue-300 ring-1 ring-blue-500' : cleared ? 'bg-green-900 text-green-400' : fd.isBoss ? 'bg-yellow-900 text-yellow-400' : 'bg-gray-800 text-gray-500';
    previewCells.push('<div class="text-center p-1 rounded text-xs ' + cls + '" title="' + fd.name + '">' + (fNum + 1) + (fd.isBoss ? '👑' : '') + '</div>');
  }
  var resetBadge = weeklyResetUsed
    ? '<span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-600">本周已重置</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-cyan-900 text-cyan-400 border border-cyan-700">本周可重置</span>';

  return renderActivityTeamBar() + '<div class="bg-card border border-game rounded-xl p-4 text-center">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<h2 class="font-bold text-lg">🗼 试炼之塔</h2>' + resetBadge +
      '</div>' +
      '<p class="text-sm font-bold mb-2">当前进度：第 ' + (G.towerProgress + 1) + ' 层 / 共 ' + maxFloors + ' 层</p>' +
      '<p class="text-sm text-secondary mb-2">最高记录：第 ' + (G.towerMaxFloor + 1) + ' 层 · 转生次数：' + (G.player.rebirth || 0) + '（每转生+50层）</p>' +
      (currentFloor ?
        '<p class="text-sm mb-1">' + (currentFloor.isBoss ? '👑' : '⚔️') + ' ' + currentFloor.name + '</p>' +
        '<p class="text-xs text-secondary mb-1">气血 ' + currentFloor.hp.toLocaleString() + ' · 攻击 ' + currentFloor.atk.toLocaleString() + ' · 防御 ' + currentFloor.def.toLocaleString() + '</p>' +
        '<p class="text-xs text-secondary mb-3">战力需求约 ' + (currentFloor.hp + currentFloor.atk * 10).toLocaleString() + '</p>' +
        '<button class="btn-primary" onclick="challengeTower()">挑战当前层</button>'
        : '<p class="text-gold">🎉 已通关全部 ' + maxFloors + ' 层！转生后可解锁更多层数。</p>') +
      '<div class="mt-3 pt-3 border-t border-game">' +
        '<p class="text-xs text-secondary mb-2">⏰ 每周可重置一次进度（重新挑战获取奖励）</p>' +
        '<button class="btn-primary btn-sm" ' + (weeklyResetUsed || G.towerProgress === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="resetTowerWeekly()">' + (weeklyResetUsed ? '本周已重置' : '🔄 每周重置爬塔') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">层数预览（第 ' + (previewStart + 1) + ' ~ ' + (previewStart + previewCount) + ' 层）</h2>' +
      '<div class="grid grid-cols-10 gap-1">' + previewCells.join('') + '</div>' +
      (maxFloors > maxStaticFloor ? '<p class="text-xs text-secondary mt-2">💡 ' + maxStaticFloor + ' 层之后为动态生成层，难度与奖励随层数递增。</p>' : '') +
    '</div>' +
    renderActivityHarvestLog('tower', '爬塔收获日志');
}

// 活动页 - 竞技场
function renderActivityArena() {
  const rank = getArenaRank();
  const rankIdx = ARENA_RANKS.indexOf(rank);
  const nextRank = rankIdx < ARENA_RANKS.length - 1 ? ARENA_RANKS[rankIdx + 1] : null;
  const dailyLeft = Math.max(0, 5 - (G.arenaDailyUsed || 0));
  if (G.arenaOpponents.length === 0) generateArenaOpponents();
  var today = new Date().toDateString();
  var dailyRewardClaimed = G.arenaDailyRewardDate === today;
  var dailyRewardBadge = dailyRewardClaimed
    ? '<span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-600">今日已领</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-400 border border-yellow-700">可领取</span>';

  return renderActivityTeamBar() + '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
      '<div>' +
        '<h2 class="font-bold text-lg" style="color:' + rank.color + '">' + rank.icon + ' ' + rank.name + '</h2>' +
        '<p class="text-xs text-secondary">积分：' + (G.arenaScore || 0) + (nextRank ? ' → 下一段位需 ' + nextRank.minScore + ' 分' : ' · 已达最高段位') + '</p>' +
      '</div>' +
      '<div class="text-right">' +
        '<p class="text-xs text-secondary">战力 ' + Math.floor(getPlayerCombatPower()).toLocaleString() + '</p>' +
        '<p class="text-xs text-secondary">今日剩余 ' + dailyLeft + '/5 次</p>' +
      '</div>' +
    '</div>' +
    (nextRank ? '<div class="progress-bar mb-3"><div class="progress-fill bg-gradient-to-r from-yellow-500 to-orange-500" style="width:' + Math.min(100, Math.floor((G.arenaScore||0)/nextRank.minScore*100)) + '%"></div></div>' : '') +
    '</div>' +
    '<div class="bg-card border border-game rounded-xl p-4">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<h2 class="font-bold text-lg">🎁 每日奖励</h2>' + dailyRewardBadge +
      '</div>' +
      '<p class="text-xs text-secondary mb-3">每日登录即可领取奖励，钻石和金币数量随段位提升：💎' + (5 + rankIdx * 3) + ' · 🪙' + (200 + rankIdx * 200) + '</p>' +
      '<button class="btn-gold w-full" ' + (dailyRewardClaimed ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="claimArenaDailyReward()">' + (dailyRewardClaimed ? '✅ 今日已领取' : '🎁 领取每日奖励') + '</button>' +
    '</div>' +
    '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">🎯 挑战对手</h2>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">' +
        G.arenaOpponents.map(function(opp, i) {
          var oppRank = ARENA_RANKS.find(function(r) { return r.id === opp.rank; }) || ARENA_RANKS[0];
          var challenged = G.arenaChallengedOpps && G.arenaChallengedOpps[opp.id];
          var canChallenge = dailyLeft > 0 && !challenged;
          return '<div class="bg-panel border border-game rounded-xl p-4 ' + (challenged ? 'opacity-50' : '') + '">' +
            '<div class="flex items-center justify-between mb-2">' +
              '<span class="font-bold">' + opp.name + '</span>' +
              '<span class="text-xs" style="color:' + oppRank.color + '">' + oppRank.icon + ' ' + oppRank.name + '</span>' +
            '</div>' +
            '<p class="text-xs text-secondary mb-2">战力 ' + opp.cp.toLocaleString() + '</p>' +
            '<div class="flex gap-1 mb-2 text-xs text-secondary">' +
              opp.pets.map(function(p) { return '<span>' + p.race + '</span>'; }).join(' · ') +
            '</div>' +
            '<button class="btn-primary btn-sm w-full" ' + (!canChallenge ? 'disabled style="opacity:0.5"' : '') +
              ' onclick="startArenaBattle(' + i + ')">' + (challenged ? '✅ 已挑战' : (dailyLeft <= 0 ? '次数已用完' : '⚔️ 挑战')) + '</button>' +
          '</div>';
        }).join('') +
      '</div>' +
      (dailyLeft <= 0 ? '<p class="text-xs text-secondary mt-2 text-center">今日挑战次数已用完，明天再来吧！</p>' : '') +
      '<button class="btn-gold btn-sm mt-3 w-full" onclick="generateArenaOpponents();render()">🔄 刷新对手</button>' +
    '</div>' +
    '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">🏆 段位奖励（每周一结算）</h2>' +
      '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">' +
        ARENA_RANKS.map(function(r, i) {
          return '<div class="bg-panel rounded-lg p-2 text-center ' + (rankIdx >= i ? 'border border-yellow-600/50' : '') + '">' +
            '<p style="color:' + r.color + '">' + r.icon + ' ' + r.name + '</p>' +
            '<p class="text-secondary">' + r.minScore + '+ 分</p>' +
            '<p class="text-gold">💎' + [50,100,200,400,800,1500][i] + '</p>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>' +
    renderActivityHarvestLog('arena', '竞技场收获日志');
}

// 活动页 - 阵法押镖（需求2）
function renderActivityFormationEscort() {
  var today = new Date().toDateString();
  var usedCount = (G.formationEscortUsed && G.formationEscortUsed[today]) || 0;
  var remaining = FORMATION_ESCORT.dailyLimit - usedCount;
  var unlocked = G.player.level >= FORMATION_ESCORT.minLevel;
  var inProgress = G.formationEscortProgress && G.formationEscortProgress.stage > 0;

  var statusBadge = remaining > 0
    ? '<span class="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-400 border border-yellow-700">今日剩余 ' + remaining + ' 次</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-green-900 text-green-400 border border-green-700">今日已完成</span>';

  var html = renderActivityTeamBar() + '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<h2 class="font-bold text-lg">🛡️ 押镖运送</h2>' + statusBadge +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">' + FORMATION_ESCORT.desc + '</p>' +
    '<div class="bg-panel rounded-lg p-3 mb-3 text-xs">' +
      '<p class="text-secondary mb-1">📋 活动规则：</p>' +
      '<p>· 需要 Lv.' + FORMATION_ESCORT.minLevel + ' 解锁</p>' +
      '<p>· 每日 ' + FORMATION_ESCORT.dailyLimit + ' 次挑战机会，共 ' + FORMATION_ESCORT.stages + ' 个阶段</p>' +
      '<p>· 每阶段击败拦路怪物获得1本阵法书</p>' +
      '<p>· 完成全部阶段额外获得金币奖励（按人物等级 × 50）</p>' +
      '<p>· 中途失败可继续挑战下一阶段（不强制重头开始）</p>' +
    '</div>';

  if (inProgress) {
    var stage = G.formationEscortProgress.stage;
    var stageDef = FORMATION_ESCORT.stages;
    html += '<div class="bg-panel rounded-lg p-3 mb-3 border border-yellow-600">' +
      '<p class="text-sm font-bold mb-2">📍 当前阶段：第 ' + stage + '/' + stageDef + ' 关</p>' +
      '<button class="btn-gold w-full" onclick="startFormationEscortBattle()">⚔️ 挑战第' + stage + '关</button>' +
    '</div>';
  } else {
    html += '<button class="btn-gold w-full" ' + (!unlocked || remaining <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="startFormationEscort()">' +
      (!unlocked ? '🔒 需要 Lv.' + FORMATION_ESCORT.minLevel + ' 解锁' : remaining <= 0 ? '✅ 今日次数已用完' : '🚀 开始押镖') +
    '</button>';
  }

  // 需求6：收获日志
  html += renderActivityHarvestLog('formation', '押镖收获日志');
  html += '</div>';
  return html;
}

// 活动页 - 技能秘境挑战（需求6）
function renderActivitySkillBookHunt() {
  var today = new Date().toDateString();
  var usedCount = (G.skillBookHuntUsed && G.skillBookHuntUsed[today]) || 0;
  var remaining = SKILL_BOOK_HUNT.dailyLimit - usedCount;
  var unlocked = G.player.level >= SKILL_BOOK_HUNT.minLevel;
  var inProgress = G.skillBookHuntProgress && G.skillBookHuntProgress.stage > 0;
  var currentStage = inProgress ? G.skillBookHuntProgress.stage : 0;

  var statusBadge = remaining > 0
    ? '<span class="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-400 border border-yellow-700">今日剩余 ' + remaining + ' 次</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-green-900 text-green-400 border border-green-700">今日已完成</span>';

  var html = renderActivityTeamBar() + '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<h2 class="font-bold text-lg">📚 技能秘境挑战</h2>' + statusBadge +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">' + SKILL_BOOK_HUNT.desc + '</p>' +
    '<div class="bg-panel rounded-lg p-3 mb-3 text-xs">' +
      '<p class="text-secondary mb-1">📋 活动规则：</p>' +
      '<p>· 需要 Lv.' + SKILL_BOOK_HUNT.minLevel + ' 解锁</p>' +
      '<p>· 每日 ' + SKILL_BOOK_HUNT.dailyLimit + ' 次挑战机会</p>' +
      '<p>· 最多 ' + SKILL_BOOK_HUNT.maxStages + ' 个阶段，越高阶越难但奖励越丰厚</p>' +
      '<p>· 每阶段击败怪物获得技能书奖励</p>' +
      '<p>· 中途失败可以保留已获得的奖励</p>' +
    '</div>';

  // 阶段预览
  html += '<div class="grid grid-cols-5 gap-1 mb-3 text-xs">';
  for (var i = 0; i < SKILL_BOOK_HUNT.maxStages; i++) {
    var cfg = SKILL_BOOK_HUNT.stageConfig[i];
    var stageCleared = inProgress && i < currentStage - 1;
    var stageCurrent = inProgress && i === currentStage - 1;
    var bg = stageCleared ? 'bg-green-900 text-green-400 border-green-700' :
             stageCurrent ? 'bg-yellow-900 text-yellow-400 border-yellow-700' :
             'bg-panel text-secondary border-game';
    html += '<div class="border rounded p-1 text-center ' + bg + '">' +
      '<p class="font-bold">' + cfg.name + '</p>' +
      '<p class="text-[9px]">×' + cfg.rewardMult + '</p>' +
    '</div>';
  }
  html += '</div>';

  if (inProgress) {
    var cfg = SKILL_BOOK_HUNT.stageConfig[currentStage - 1];
    html += '<div class="bg-panel rounded-lg p-3 mb-3 border border-yellow-600">' +
      '<p class="text-sm font-bold mb-2">📍 当前阶段：' + cfg.name + '（第' + currentStage + '/' + SKILL_BOOK_HUNT.maxStages + '关）</p>' +
      '<p class="text-xs text-secondary mb-2">怪物强度：HP×' + cfg.hpMult + ' 攻击×' + cfg.atkMult + ' 奖励×' + cfg.rewardMult + '</p>' +
      '<div class="flex gap-2">' +
        '<button class="btn-gold flex-1" onclick="startSkillBookHuntBattle()">⚔️ 挑战</button>' +
        '<button class="btn-danger" onclick="endSkillBookHunt()">📦 结算退出</button>' +
      '</div>' +
    '</div>';
  } else {
    html += '<button class="btn-gold w-full" ' + (!unlocked || remaining <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="startSkillBookHunt()">' +
      (!unlocked ? '🔒 需要 Lv.' + SKILL_BOOK_HUNT.minLevel + ' 解锁' : remaining <= 0 ? '✅ 今日次数已用完' : '🚀 开始挑战') +
    '</button>';
  }

  // 需求6：收获日志
  html += renderActivityHarvestLog('skillbook', '技能秘境收获日志');
  html += '</div>';
  return html;
}

// 活动页 - 宠物秘境（需求12）
function renderActivityPetCave() {
  var today = new Date().toDateString();
  var usedCount = (G.petCaveUsed && G.petCaveUsed[today]) || 0;
  var dailyLimit = 20;
  var remaining = dailyLimit - usedCount;
  var unlocked = G.player.level >= 20;
  // 当前可获取的套装（按周分布）
  var weeklySets = (typeof getWeeklyPetEquipSets === 'function') ? getWeeklyPetEquipSets() : [];

  var statusBadge = remaining > 0
    ? '<span class="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-400 border border-yellow-700">今日剩余 ' + remaining + ' 次</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-green-900 text-green-400 border border-green-700">今日已完成</span>';

  var html = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<h2 class="font-bold text-lg">🐾 宠物秘境</h2>' + statusBadge +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">挑战神秘秘境，获取宠物装备。每日 ' + dailyLimit + ' 次，每周开放不同套装。</p>' +
    '<div class="bg-panel rounded-lg p-3 mb-3 text-xs">' +
      '<p class="text-secondary mb-1">📋 活动规则：</p>' +
      '<p>· 需要 Lv.20 解锁</p>' +
      '<p>· 每日 ' + dailyLimit + ' 次挑战机会</p>' +
      '<p>· 每次挑战5波怪物，击败全部怪物获得宠物装备</p>' +
      '<p>· 套装按周分布，周末全部套装开放</p>' +
      '<p>· 今日开放套装：' + (weeklySets.length > 0 ? weeklySets.map(function(sid){ var s = PET_EQUIP_SETS.find(function(x){return x.id===sid;}); return s ? s.name : sid; }).join('、') : '无') + '</p>' +
    '</div>' +
    '<button class="btn-gold w-full" ' + (!unlocked || remaining <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="startPetCaveBattle()">' +
      (!unlocked ? '🔒 需要 Lv.20 解锁' : remaining <= 0 ? '✅ 今日次数已用完' : '⚔️ 开始挑战') +
    '</button>' +
    renderActivityHarvestLog('petcave', '宠物秘境收获日志') +
  '</div>';
  return html;
}

// ==================== 宠物派遣奇遇系统（DISPATCH）UI ====================
// 派遣 UI 临时选择状态
window._dispatchSel = window._dispatchSel || { mapId: null, petIds: [], durationIdx: 0 };

function renderActivityDispatch() {
  if (typeof DISPATCH_MAPS === 'undefined') {
    return '<div class="bg-card border border-game rounded-xl p-4"><p class="text-secondary">派遣系统未启用</p></div>';
  }
  // 初始化选择（默认选第一个已解锁的地图）
  if (!window._dispatchSel.mapId) {
    var firstUnlocked = null;
    for (var i = 0; i < DISPATCH_MAPS.length; i++) {
      if (isMapUnlockedForDispatch(DISPATCH_MAPS[i].mapId)) { firstUnlocked = DISPATCH_MAPS[i].mapId; break; }
    }
    window._dispatchSel.mapId = firstUnlocked;
  }
  var sel = window._dispatchSel;
  // 清理已失效的宠物选择
  var availablePets = getAvailableDispatchPets();
  var availableIds = availablePets.map(function(p) { return p.id; });
  sel.petIds = (sel.petIds || []).filter(function(pid) { return availableIds.indexOf(pid) !== -1; });

  var dispatches = Array.isArray(G.dispatches) ? G.dispatches : [];
  var slotsUsed = dispatches.length;
  var slotsTotal = DISPATCH_MAX_SLOTS;
  var slotsBadge = slotsUsed >= slotsTotal
    ? '<span class="text-xs px-2 py-0.5 rounded bg-red-900 text-red-400 border border-red-700">已满 ' + slotsUsed + '/' + slotsTotal + '</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-400 border border-yellow-700">进行中 ' + slotsUsed + '/' + slotsTotal + '</span>';

  var html = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<h2 class="font-bold text-lg">🎒 派遣奇遇</h2>' + slotsBadge +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">将闲置宠物派遣至已通关的地图探索，最多3只组队。战力达标即可出发，战力越高奖励越丰厚！</p>';

  // === 进行中的派遣 ===
  html += '<div class="mb-4">' +
    '<h3 class="text-sm font-bold text-gold mb-2">⏳ 进行中的派遣</h3>';
  if (dispatches.length === 0) {
    html += '<p class="text-xs text-secondary">暂无进行中的派遣</p>';
  } else {
    html += '<div class="space-y-2">';
    dispatches.forEach(function(d) {
      var map = getDispatchMapConfig(d.mapId);
      var dur = DISPATCH_DURATIONS[d.durationIdx];
      var prog = getDispatchProgress(d);
      var pct = Math.floor(prog * 100);
      var done = prog >= 1;
      // 预计完成时间
      var endTs = d.startTs + dur.hours * 3600 * 1000;
      var endDate = new Date(endTs);
      var endTimeStr = endDate.getHours().toString().padStart(2, '0') + ':' + endDate.getMinutes().toString().padStart(2, '0');
      // 宠物名
      var petNames = (d.petIds || []).map(function(pid) {
        var p = (G.pets || []).find(function(x) { return x.id === pid; });
        return p ? p.name : '?';
      }).join('、');
      html += '<div class="bg-panel rounded-lg p-2 border ' + (done ? 'border-green-600' : 'border-game') + '">' +
        '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-sm font-bold">' + (map ? map.name : '未知') + '</span>' +
          '<span class="text-xs text-secondary">时长 ' + dur.label + ' · 战力 ' + (d.totalPower || 0) + '</span>' +
        '</div>' +
        '<div class="text-xs text-secondary mb-1">🐾 ' + petNames + '</div>' +
        '<div class="bg-black/30 rounded h-2 mb-1">' +
          '<div class="h-2 rounded ' + (done ? 'bg-green-500' : 'bg-yellow-500') + '" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<div class="flex items-center justify-between text-xs">' +
          '<span class="' + (done ? 'text-green-400 font-bold' : 'text-secondary') + '">' + (done ? '✅ 已完成（可领取）' : pct + '% · 预计 ' + endTimeStr + ' 完成') + '</span>' +
          '<div class="flex gap-1">' +
            (done
              ? '<button class="btn-gold text-xs px-2 py-0.5" onclick="window._collectDispatch(\'' + d.id + '\')">📦 领取</button>'
              : '') +
            '<button class="text-xs px-2 py-0.5 border border-red-700 text-red-400 rounded" onclick="window._recallDispatch(\'' + d.id + '\')">↩️ 召回</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  // === 新建派遣 ===
  var canNew = slotsUsed < slotsTotal;
  html += '<div class="bg-panel rounded-lg p-3">' +
    '<h3 class="text-sm font-bold text-gold mb-2">' + (canNew ? '✨ 新建派遣' : '🔒 派遣槽位已满') + '</h3>';

  if (canNew) {
    // 地图选择
    html += '<div class="mb-3">' +
      '<p class="text-xs text-secondary mb-1">📍 选择探索区域（仅显示已通关）：</p>' +
      '<div class="grid grid-cols-2 gap-1">';
    DISPATCH_MAPS.forEach(function(m) {
      var unlocked = isMapUnlockedForDispatch(m.mapId);
      var active = sel.mapId === m.mapId;
      html += '<button class="text-xs px-2 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : unlocked ? 'border-game text-secondary' : 'border-game text-gray-600 opacity-50') + '" ' + (unlocked ? '' : 'disabled') + ' onclick="window._dispatchPickMap(' + m.mapId + ')">' +
        (unlocked ? '' : '🔒 ') + m.name + '<br><span class="text-[10px]">需战力 ' + m.minPower.toLocaleString() + '</span>' +
      '</button>';
    });
    html += '</div></div>';

    // 宠物选择
    var selMap = sel.mapId ? getDispatchMapConfig(sel.mapId) : null;
    html += '<div class="mb-3">' +
      '<p class="text-xs text-secondary mb-1">🐾 选择派遣宠物（已选 ' + sel.petIds.length + '/3）：' + (selMap ? '需要战力 ' + selMap.minPower.toLocaleString() : '') + '</p>';
    if (availablePets.length === 0) {
      html += '<p class="text-xs text-gray-500">没有可派遣的闲置宠物（所有宠物已在出战阵容或其它派遣中）</p>';
    } else {
      html += '<div class="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">';
      availablePets.forEach(function(p) {
        var power = (typeof getPetCombatPower === 'function') ? Math.floor(getPetCombatPower(p)) : 0;
        var checked = sel.petIds.indexOf(p.id) !== -1;
        var rarityIdx = RARITIES.indexOf(p.rarity);
        var color = RARITY_COLORS[rarityIdx] || '#9ca3af';
        var canCheck = checked || sel.petIds.length < 3;
        html += '<button class="text-xs px-2 py-1 rounded border text-left ' + (checked ? 'bg-green-900 text-green-300 border-green-600 font-bold' : canCheck ? 'border-game text-secondary' : 'border-game text-gray-600 opacity-50') + '" ' + (canCheck ? '' : 'disabled') + ' onclick="window._dispatchTogglePet(\'' + p.id + '\')">' +
          '<span style="color:' + color + '">' + p.name + '</span> <span class="text-[10px]">Lv' + (p.level || 1) + '</span><br>' +
          '<span class="text-[10px] text-yellow-500">⚔️ ' + power + '</span>' +
        '</button>';
      });
      html += '</div>';
    }
    html += '</div>';

    // 当前总战力
    var totalPower = getDispatchTotalPower(sel.petIds);
    var powerOk = selMap && totalPower >= selMap.minPower;
    html += '<div class="text-xs mb-3">总战力：<span class="' + (powerOk ? 'text-green-400 font-bold' : 'text-red-400') + '">' + totalPower + '</span>';
    if (selMap) {
      html += ' / <span class="text-secondary">' + selMap.minPower + '</span>';
      if (powerOk) {
        var bonus = getDispatchPowerBonus(totalPower, selMap.minPower);
        html += ' · 加成倍率 <span class="text-yellow-400">×' + bonus.toFixed(2) + '</span>';
      }
    }
    html += '</div>';

    // 时长选择
    html += '<div class="mb-3">' +
      '<p class="text-xs text-secondary mb-1">⏰ 探索时长：</p>' +
      '<div class="flex gap-1">';
    DISPATCH_DURATIONS.forEach(function(d, idx) {
      var active = sel.durationIdx === idx;
      html += '<button class="text-xs px-2 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + '" onclick="window._dispatchPickDuration(' + idx + ')">' + d.label + '<br><span class="text-[10px]">×' + d.mult + '</span></button>';
    });
    html += '</div></div>';

    // 奖励预览
    if (selMap && sel.petIds.length > 0 && powerOk) {
      var dur = DISPATCH_DURATIONS[sel.durationIdx];
      var bonus = getDispatchPowerBonus(totalPower, selMap.minPower);
      var totalMult = dur.mult * selMap.rewardMult * bonus;
      var gold = Math.floor(DISPATCH_BASE_REWARD.gold * totalMult);
      var exp = Math.floor(DISPATCH_BASE_REWARD.exp * totalMult);
      var matCount = Math.max(1, Math.floor(DISPATCH_BASE_REWARD.materialCount * totalMult));
      var rareChance = Math.min(0.5, DISPATCH_BASE_REWARD.rareChance * bonus);
      // 需求13：将材料ID替换为具体道具图标与名称展示
      var matIcons = { forge_stone_low: '⚒️', forge_stone_mid: '⚒️', forge_stone_high: '⚒️',
        mystic_crystal_low: '💠', mystic_crystal_mid: '💠', mystic_crystal_high: '💠',
        war_book_low: '📖', war_book_mid: '📖', war_book_high: '📖' };
      var matNames = (typeof getItemName === 'function') ? null : PET_EQUIP_MATERIAL_NAMES;
      function getMatDisplay(matId) {
        var icon = matIcons[matId] || (PET_EQUIP_MATERIAL_ICONS && PET_EQUIP_MATERIAL_ICONS[matId]) || '📦';
        var name = (typeof getItemName === 'function') ? getItemName(matId) : (PET_EQUIP_MATERIAL_NAMES && PET_EQUIP_MATERIAL_NAMES[matId]) || matId;
        return icon + ' ' + name;
      }
      function getRareDisplay(rareId) {
        var rareIcons = { rare_egg: '🥚', blood_orb_low: '🔴', blood_orb_mid: '🔴', blood_orb_high: '🔴', skill_random: '📖' };
        var icon = rareIcons[rareId] || '🎁';
        var name = (typeof getItemName === 'function') ? getItemName(rareId) : rareId;
        if (rareId === 'skill_random') name = '随机技能书';
        return icon + ' ' + name;
      }
      var matsDisplay = selMap.materials.map(getMatDisplay).join('、');
      var rareDisplay = selMap.rarePool.map(getRareDisplay).join('、');
      html += '<div class="bg-black/30 rounded p-2 mb-3 text-xs">' +
        '<p class="text-yellow-400 font-bold mb-1">📦 预计收益：</p>' +
        '<p>· 🪙 金币 <span class="text-yellow-400">+' + gold.toLocaleString() + '</span></p>' +
        '<p>· 📗 经验 <span class="text-blue-400">+' + exp.toLocaleString() + '</span></p>' +
        '<p>· 📦 养成材料 <span class="text-purple-400">×' + matCount + '</span>（' + matsDisplay + '）</p>' +
        '<p>· 🎁 稀有掉落概率 <span class="text-pink-400">' + (rareChance * 100).toFixed(1) + '%</span>（' + rareDisplay + '）</p>' +
        '<p class="text-secondary mt-1">倍率：基础×' + DISPATCH_BASE_REWARD.gold + ' · 时长×' + dur.mult + ' · 地图×' + selMap.rewardMult + ' · 战力×' + bonus.toFixed(2) + '</p>' +
      '</div>';
    }

    // 开始按钮
    var canStart = selMap && sel.petIds.length > 0 && powerOk;
    html += '<button class="btn-gold w-full" ' + (canStart ? '' : 'disabled style="opacity:0.4;cursor:not-allowed"') + ' onclick="window._dispatchStart()">' +
      (!selMap ? '请选择地图' : sel.petIds.length === 0 ? '请选择宠物' : !powerOk ? '战力不足' : '🚀 开始派遣') +
    '</button>';
  }
  html += '</div>';

  // === 历史 ===
  var history = Array.isArray(G.dispatchHistory) ? G.dispatchHistory : [];
  html += '<div class="mt-4">' +
    '<h3 class="text-sm font-bold text-gold mb-2">📜 派遣历史（近 10 条）</h3>';
  if (history.length === 0) {
    html += '<p class="text-xs text-secondary">暂无派遣记录</p>';
  } else {
    html += '<div class="space-y-1 max-h-64 overflow-y-auto">';
    history.slice(0, 10).forEach(function(h) {
      var dur = DISPATCH_DURATIONS[h.durationIdx];
      var r = h.rewards || {};
      var rareTxt = r.rareDrop ? ' · <span class="text-pink-400">稀有:' + ((typeof getItemName === 'function') ? getItemName(r.rareDrop) : r.rareDrop) + '</span>' : '';
      html += '<div class="bg-panel rounded p-2 text-xs">' +
        '<div class="flex justify-between">' +
          '<span class="font-bold">' + (h.mapName || '未知') + '</span>' +
          '<span class="text-secondary">' + (dur ? dur.label : '?') + ' · 战力 ' + (h.totalPower || 0) + '</span>' +
        '</div>' +
        '<p class="text-yellow-400">🪙 +' + (r.gold || 0) + ' · ⭐ +' + (r.exp || 0) + ' · 📦 ×' + (r.materialCount || 0) + rareTxt + '</p>' +
      '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  // 收获日志
  html += renderActivityHarvestLog('dispatch', '派遣收获日志');
  html += '</div>';
  return html;
}

// 派遣 UI 交互函数
window._dispatchPickMap = function(mapId) {
  window._dispatchSel.mapId = mapId;
  render();
};
window._dispatchPickDuration = function(idx) {
  window._dispatchSel.durationIdx = idx;
  render();
};
window._dispatchTogglePet = function(petId) {
  var sel = window._dispatchSel;
  var i = sel.petIds.indexOf(petId);
  if (i === -1) {
    if (sel.petIds.length >= 3) return;
    sel.petIds.push(petId);
  } else {
    sel.petIds.splice(i, 1);
  }
  render();
};
window._dispatchStart = function() {
  var sel = window._dispatchSel;
  var result = startDispatch(sel.mapId, sel.petIds.slice(), sel.durationIdx);
  if (result && result.ok) {
    showToast('🚀 派遣已出发！', 'success');
    sel.petIds = [];
    render();
  } else {
    showToast(result && result.msg ? result.msg : '派遣失败', 'error');
  }
};
window._collectDispatch = function(dispatchId) {
  var result = collectDispatch(dispatchId);
  if (result && result.ok) {
    var r = result.rewards;
    var msg = '📦 派遣归来！金币 +' + r.gold + '，经验 +' + r.exp + '，材料 ×' + r.materialCount;
    if (result.rareDrop) msg += '，稀有掉落 ' + result.rareDrop + '！';
    showToast(msg, 'success');
    render();
  } else {
    showToast(result && result.msg ? result.msg : '领取失败', 'error');
  }
};
window._recallDispatch = function(dispatchId) {
  if (confirm('确认召回该派遣？将不会获得任何奖励。')) {
    if (recallDispatch(dispatchId)) {
      showToast('↩️ 已召回派遣', 'info');
      render();
    }
  }
};

// 打宝图战斗：10只怪物，20%掉落藏宝图（每天限一轮）
function startTreasureHunt() {
  // 每天只能打一轮
  var today = new Date().toDateString();
  if (G.lastTreasureHuntDate === today) {
    showToast('今日已参与打宝图活动，明天再来吧！', 'error');
    return;
  }
  const team = getTeamPets();
  if (team.length === 0) { showToast('请先设置出战宠物！', 'error'); return; }
  var playerLv = G.player.level;
  var killed = 0;
  var mapsDropped = 0;
  var droppedMaps = [];
  var goldGain = 0;
  var expGain = 0;
  var logs = [];
  var mapDropBonus = getTalentBonus('map_drop');

  // 模拟10场战斗
  for (var i = 0; i < 10; i++) {
    var monsterLv = playerLv + randomInt(-3, 3);
    if (monsterLv < 1) monsterLv = 1;
    // 怪物属性
    var monsterHp = Math.floor(monsterLv * 80 + 200);
    var monsterAtk = Math.floor(monsterLv * 12 + 30);
    var monsterDef = Math.floor(monsterLv * 3 + 5);
    var monsterName = '宝图守卫·第' + (i + 1) + '波';

    // 宠物战斗
    var petStates = team.map(function(p) {
      var stats = getPetStats(p);
      return { id: p.id, name: p.name, hp: stats.气血, maxHp: stats.气血, atk: stats.攻击力, def: stats.防御力, critRate: (stats.critRate || 0) + 0.10, petDmgBonus: stats.petDmgBonus || 0, alive: true };
    });

    var round = 0;
    var maxRounds = 20;
    var monsterCurHp = monsterHp;
    var victory = false;
    while (round < maxRounds) {
      round++;
      // 宠物攻击
      for (var j = 0; j < petStates.length; j++) {
        var ps = petStates[j];
        if (!ps.alive) continue;
        var dmg = Math.max(1, Math.floor(ps.atk * randomFloat(0.90, 1.10) - monsterDef * 0.5));
        dmg = Math.floor(dmg * (1 + (ps.petDmgBonus || 0)));
        var isCrit = Math.random() < (ps.critRate || 0.10);
        if (isCrit) dmg = Math.floor(dmg * 1.5);
        monsterCurHp -= dmg;
        if (monsterCurHp <= 0) { victory = true; break; }
      }
      if (victory) break;
      // 怪物反击
      var alivePets = petStates.filter(function(p) { return p.alive; });
      if (alivePets.length === 0) break;
      var target = alivePets[Math.floor(Math.random() * alivePets.length)];
      var monsterDmg = Math.max(1, Math.floor(monsterAtk * randomFloat(0.90, 1.10) - target.def * 0.5));
      target.hp -= monsterDmg;
      if (target.hp <= 0) { target.alive = false; }
    }

    if (victory) {
      killed++;
      // 需求12：提升藏宝图掉落率至50%（受天赋影响），确保每日至少掉落4~6个
      var dropChance = 0.50 + mapDropBonus;
      if (Math.random() < dropChance) {
        var rarityRoll = Math.random();
        var tmRarity = rarityRoll < 0.50 ? 'green' : rarityRoll < 0.80 ? 'blue' : rarityRoll < 0.95 ? 'purple' : 'orange';
        var tmap = generateTreasureMap(tmRarity);
        G.treasureMaps.push(tmap);
        droppedMaps.push({ name: tmap.name, rarity: tmRarity });
        mapsDropped++;
        logs.push('第' + (i + 1) + '波击败！🗺️ 掉落 ' + tmap.name);
      } else {
        logs.push('第' + (i + 1) + '波击败！');
      }
      // 金币和经验
      var goldReward = Math.floor(monsterLv * 15 + 50);
      var expReward = Math.floor(monsterLv * 8 + 20);
      goldGain += goldReward;
      expGain += expReward;
    } else {
      logs.push('❌ 第' + (i + 1) + '波战斗失败，打宝图结束');
      break;
    }
  }

  // 发放奖励
  if (goldGain > 0) addGold(goldGain);
  if (expGain > 0) addExp(expGain);
  // 全部击败额外奖励
  if (killed === 10) {
    var bonusGold = playerLv * 100;
    var bonusExp = playerLv * 50;
    addGold(bonusGold);
    addExp(bonusExp);
    goldGain += bonusGold;
    expGain += bonusExp;
    logs.push('🎉 全部击败！额外奖励 🪙' + bonusGold + ' ✨' + bonusExp);
  }

  treasureHuntResult = {
    victory: killed === 10,
    killed: killed,
    mapsDropped: mapsDropped,
    droppedMaps: droppedMaps,
    goldGain: goldGain,
    expGain: expGain,
    logs: logs,
  };
  // 需求6：打宝图收获日志
  if (typeof addActivityLog === 'function') {
    addActivityLog('treasure', '打宝图完成：击败 ' + killed + '/10 怪物，获得 🗺️' + mapsDropped + ' 张藏宝图，🪙' + goldGain + ' 金币', killed === 10 ? 'win' : 'info');
  }
  // 记录今日打宝图日期
  G.lastTreasureHuntDate = today;
  // 日常任务：完成1次打宝图
  updateDailyTask('treasure_hunt', 1);
  saveGame();
  render();
  showToast('打宝图完成！击败' + killed + '/10，获得藏宝图×' + mapsDropped, 'success');
}

// 获取本周一的日期字符串
function getWeekStartString() {
  var now = new Date();
  var day = now.getDay();
  var diff = (day === 0 ? 6 : day - 1); // 周日=6，周一=0
  var monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toDateString();
}

// 爬塔每周重置：每周可手动重置一次
function resetTowerWeekly() {
  var weekStart = getWeekStartString();
  if (G.towerWeeklyResetDate === weekStart) {
    showToast('本周已重置过爬塔，下周一刷新！', 'error');
    return;
  }
  if (G.towerProgress === 0) {
    showToast('当前进度为第1层，无需重置', 'error');
    return;
  }
  G.towerProgress = 0;
  G.towerWeeklyResetDate = weekStart;
  saveGame();
  render();
  showToast('🔄 爬塔已重置！可重新挑战并获得奖励', 'success');
}

// 竞技场每日奖励：每天可领取少量奖励
function claimArenaDailyReward() {
  var today = new Date().toDateString();
  if (G.arenaDailyRewardDate === today) {
    showToast('今日已领取竞技场每日奖励，明天再来！', 'error');
    return;
  }
  var rank = getArenaRank();
  var rankIdx = ARENA_RANKS.indexOf(rank);
  // 每日少量奖励：钻石+金币，按段位提升
  var diamondReward = 5 + rankIdx * 3; // 5~20
  var goldReward = 200 + rankIdx * 200; // 200~1200
  addDiamond(diamondReward);
  addGold(goldReward);
  G.arenaDailyRewardDate = today;
  saveGame();
  render();
  showToast('🎁 领取竞技场每日奖励：💎' + diamondReward + ' 🪙' + goldReward, 'success');
  // 需求6：竞技场收获日志
  if (typeof addActivityLog === 'function') {
    addActivityLog('arena', '领取每日奖励：💎' + diamondReward + ' 🪙' + goldReward + '（段位：' + rank.name + '）', 'win');
  }
}

// ==================== TREASURE MAP SYSTEM ====================

function generateTreasureMap(rarity) {
  const rarityInfo = TREASURE_MAP_RARITIES.find(r => r.id === rarity);
  const affixCount = rarityInfo ? rarityInfo.affixCount : 1;
  const usedIds = new Set();
  const affixes = [];
  for (let i = 0; i < affixCount; i++) {
    let affix;
    let attempts = 0;
    do {
      affix = TREASURE_AFFIXES[randomInt(0, TREASURE_AFFIXES.length - 1)];
      attempts++;
    } while (usedIds.has(affix.id) && attempts < 20);
    usedIds.add(affix.id);
    affixes.push({ id: affix.id, name: affix.name, value: affix.genVal(), format: affix.format });
  }
  let special = null;
  if (rarity === 'orange') {
    // 橙色藏宝图：100%获得特殊词缀（含三倍奖励）
    special = TREASURE_SPECIAL_AFFIXES[randomInt(0, TREASURE_SPECIAL_AFFIXES.length - 1)];
  } else if (rarity === 'purple') {
    // v2.2.0 需求10：紫色藏宝图30%概率获得特殊词缀（不含三倍奖励）
    if (Math.random() < 0.30) {
      var purpleSpecials = TREASURE_SPECIAL_AFFIXES.filter(function(a) { return a.id !== 'triple_reward'; });
      special = purpleSpecials[randomInt(0, purpleSpecials.length - 1)];
    }
  }
  // 需求5：随机分配地图类型（1-11），决定宠物蛋掉落池
  var mapType = randomInt(1, 11);
  var mapTypeInfo = getTreasureMapType(mapType);
  var mapTypeName = mapTypeInfo ? mapTypeInfo.name : '未知地图';
  // v3.0 负面词条：数量与正面词条相等，强度随品质提升
  var qualityIdx = TREASURE_MAP_RARITIES.findIndex(function(r) { return r.id === rarity; });
  var negativeAffixes = (typeof generateNegativeAffixes === 'function') ? generateNegativeAffixes(affixCount, qualityIdx) : [];
  return {
    id: 'tmap_' + Date.now() + '_' + randomInt(1000, 9999),
    rarity, name: rarityInfo ? rarityInfo.name : '藏宝图', icon: rarityInfo ? rarityInfo.icon : '🗺️',
    affixes, special, negativeAffixes,
    mapType: mapType,         // 需求5：地图类型ID（1-11）
    mapTypeName: mapTypeName, // 地图类型名
    playerLevel: G.player.level || 1,
  };
}

function renderTreasureScreen() {
  const maps = G.treasureMaps || [];
  const tmRarityFilter = window._tmRarityFilter || 'all';
  const filteredMaps = maps.map((m, idx) => ({ m, idx })).filter(function(entry) {
    if (tmRarityFilter === 'all') return true;
    return entry.m.rarity === tmRarityFilter;
  });
  // 统计各品质数量
  var rarityCounts = {};
  TREASURE_MAP_RARITIES.forEach(function(r) { rarityCounts[r.id] = 0; });
  maps.forEach(function(m) { if (rarityCounts[m.rarity] !== undefined) rarityCounts[m.rarity]++; });
  // 合成功能：找出每种品质数量>=5的
  var canSynth = TREASURE_MAP_RARITIES.filter(function(r, i) { return rarityCounts[r.id] >= 5 && i < TREASURE_MAP_RARITIES.length - 1; });
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🗺️ 藏宝图</h1>
      <span class="text-sm text-secondary">共 ${maps.length} 张</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">📜 藏宝图背包</h2>
          <div class="flex flex-wrap gap-1">
            <button class="btn-sm ${tmRarityFilter === 'all' ? 'btn-primary' : 'text-xs px-2 py-1 rounded border border-game text-secondary'}" onclick="setTmRarityFilter('all')">全部</button>
            ${TREASURE_MAP_RARITIES.map(r => `<button class="btn-sm ${tmRarityFilter === r.id ? 'btn-primary' : 'text-xs px-2 py-1 rounded border border-game'}" style="${tmRarityFilter === r.id ? '' : 'color:'+r.color}" onclick="setTmRarityFilter('${r.id}')">${r.icon}${rarityCounts[r.id] || 0}</button>`).join('')}
          </div>
        </div>
        ${filteredMaps.length === 0 ? '<p class="text-secondary text-center py-8">还没有符合条件的藏宝图</p>' : ''}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${(() => {
            var pg = paginateList('tmaps', filteredMaps.length, 12);
            var start = (pg.page - 1) * pg.pageSize;
            var slice = filteredMaps.slice(start, start + pg.pageSize);
            return slice.map(function(entry) {
            var m = entry.m;
            var idx = entry.idx;
            var rInfo = TREASURE_MAP_RARITIES.find(function(r) { return r.id === m.rarity; });
            var plv = m.playerLevel || G.player.level || 1;
            return '<div class="bg-panel border border-game rounded-xl p-4" style="border-color:' + (rInfo ? rInfo.color : '#666') + '">' +
              '<div class="flex items-center gap-2 mb-2">' +
              '<span class="text-2xl">' + m.icon + '</span>' +
              '<span class="font-bold" style="color:' + (rInfo ? rInfo.color : '#fff') + '">' + m.name + '</span>' +
              '<span class="text-xs text-yellow-400 ml-auto">Lv.' + plv + '</span>' +
              '</div>' +
              // 需求5：显示地图类型
              '<div class="mb-2 px-2 py-1 bg-card rounded border border-game">' +
              '<span class="text-xs text-cyan-300">📍 地图：' + (m.mapTypeName || '未知地图') + '</span>' +
              '</div>' +
              '<div class="space-y-1 mb-3">' +
              m.affixes.map(function(a) { return '<p class="text-xs text-green-400">📌 ' + (typeof a.format === 'function' ? a.format(a.value) : ('+' + a.value)) + '</p>'; }).join('') +
              (m.special ? '<p class="text-xs text-orange-400 font-bold">⭐ ' + (typeof m.special.format === 'function' ? m.special.format() : m.special.name) + '</p>' : '') +
              (m.negativeAffixes && m.negativeAffixes.length > 0 ? m.negativeAffixes.map(function(a) { return '<p class="text-xs text-red-400">🔻 ' + (typeof a.format === 'function' ? a.format(a.value) : ('-' + a.value)) + '</p>'; }).join('') : '') +
              '</div>' +
              '<button class="btn-primary btn-sm w-full" onclick="useTreasureMap(' + idx + ')">🗺️ 使用藏宝图</button>' +
              '</div>';
            }).join('') + pg.controlsHtml;
          })()}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-2">⚗️ 自动合成</h2>
        <p class="text-xs text-secondary mb-3">5张同品质藏宝图自动合成1张更高品质。合成时相同词条会提升或保留，剩余词条从材料中随机保留，凑满目标品质的词条数。</p>
        ${canSynth.length === 0 ? '<p class="text-xs text-secondary text-center py-2">需要5张同品质藏宝图才能合成</p>' : ''}
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          ${canSynth.map(function(r) {
            var nextIdx = TREASURE_MAP_RARITIES.findIndex(function(rr) { return rr.id === r.id; }) + 1;
            var nextR = TREASURE_MAP_RARITIES[nextIdx];
            if (!nextR) return '';
            return '<div class="bg-panel border border-game rounded-lg p-3 text-center">' +
              '<p class="text-xs font-bold mb-1" style="color:' + r.color + '">' + r.icon + ' ' + r.name + '</p>' +
              '<p class="text-xs text-green-400 mb-1">→ ' + nextR.icon + ' ' + nextR.name + '</p>' +
              '<p class="text-xs text-secondary mb-2">拥有 ' + rarityCounts[r.id] + ' 张</p>' +
              '<button class="btn-gold btn-sm w-full text-xs" onclick="synthTreasureMap(\'' + r.id + '\')">自动合成 (消耗5张)</button>' +
              '</div>';
          }).join('')}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-2">🔧 手动合成</h2>
        <p class="text-xs text-secondary mb-3">选择2张藏宝图进行针对性合成，词条从两张中选取融合。需要至少2张藏宝图。</p>
        ${maps.length < 2 ? '<p class="text-xs text-secondary text-center py-2">需要至少2张藏宝图才能手动合成</p>' :
          '<button class="btn-primary btn-sm" onclick="openManualSynthModal()">🔧 打开手动合成界面</button>'}
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🛒 购买藏宝图</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          ${TREASURE_MAP_RARITIES.map((r, i) => `
            <div class="bg-panel border border-game rounded-lg p-3 text-center">
              <div class="text-2xl mb-1">${r.icon}</div>
              <p class="text-xs font-bold" style="color:${r.color}">${r.name}</p>
              <p class="text-xs text-secondary">${r.affixCount}词条</p>
              <p class="text-gold text-sm">🪙${(i+1)*500}</p>
              <button class="btn-gold btn-sm mt-1 w-full" onclick="buyTreasureMap('${r.id}')">购买</button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-2">🗺️ 宠物蛋掉落图鉴</h2>
        <p class="text-xs text-secondary mb-3">每张藏宝图随机分配1张地图，掉落的宠物蛋来自该地图的宠物池。下方展示11张地图可能掉落的宠物类型。</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${(typeof TREASURE_MAP_TYPES !== 'undefined' ? TREASURE_MAP_TYPES : []).map(function(mt) {
            var pool = mt.petPool || [];
            var poolHtml = pool.map(function(name) {
              var tier = (typeof getPetTier === 'function') ? getPetTier(name) : 1;
              var tColor = ['#9ca3af', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'][Math.min(tier - 1, 5)] || '#9ca3af';
              return '<span class="text-xs px-2 py-0.5 rounded bg-panel border border-game" style="color:' + tColor + '">T' + tier + ' ' + name + '</span>';
            }).join(' ');
            return '<div class="bg-panel border border-game rounded-lg p-3">' +
              '<div class="flex items-center gap-2 mb-2">' +
              '<span class="text-2xl">' + mt.icon + '</span>' +
              '<div>' +
              '<p class="font-bold text-sm text-cyan-300">' + mt.name + '</p>' +
              '<p class="text-xs text-secondary">' + mt.desc + '</p>' +
              '</div>' +
              '</div>' +
              '<div class="flex flex-wrap gap-1">' + poolHtml + '</div>' +
              '</div>';
          }).join('')}
        </div>
      </div>
    </main>
  </div>`;
}

// ==================== 挖密藏系统（v2.2.0 需求9）====================
function renderDigScreen() {
  var today = new Date().toDateString();
  var used = (G.digDailyUsed && G.digDailyUsed[today]) || 0;
  var digMapItem = G.inventory.find(function(i) { return i.id === 'dig_map'; });
  var digMapCount = digMapItem ? digMapItem.count : 0;
  var digShovelItem = G.inventory.find(function(i) { return i.id === 'dig_shovel'; });
  var digShovelCount = digShovelItem ? digShovelItem.count : 0;

  // 道具栏HTML（仅密藏图和探宝铲）
  var toolsHtml = '<div class="grid grid-cols-2 gap-2 mb-4">' +
    '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
      '<div class="text-2xl">🗺️</div><p class="text-xs mt-1 text-yellow-400">密藏图</p><p class="text-gold text-sm font-bold">×' + digMapCount + '</p>' +
    '</div>' +
    '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
      '<div class="text-2xl">⛏️</div><p class="text-xs mt-1 text-cyan-300">探宝铲</p><p class="text-gold text-sm font-bold">×' + digShovelCount + '</p>' +
    '</div>' +
  '</div>';

  var content = '';

  if (G.digSession) {
    // ===== 挖掘进行中 =====
    var s = G.digSession;

    // 渲染九宫格
    var gridHtml = '<div class="dig-grid">';
    for (var i = 0; i < 9; i++) {
      var cell = s.grid[i];
      var cellClass = 'dig-cell ';
      var cellContent = '';
      if (cell.revealed) {
        cellClass += 'dig-cell-revealed';
        var typeInfo = DIG_REWARD_POOL.find(function(t) { return t.type === cell.type; });
        var bgColor = typeInfo ? typeInfo.color : '#333';
        if (cell.reward) {
          cellContent = '<div class="dig-cell-icon">' + cell.reward.icon + '</div>';
          cellContent += '<div class="dig-cell-label" style="color:' + (cell.reward.color || '#fff') + '">' + cell.reward.name + '</div>';
          // v2.7.0 需求3.2：彩蛋标识
          if (cell.easterEgg) {
            cellContent += '<div class="text-[9px] mt-1 px-1 rounded bg-yellow-900/80 text-yellow-300 font-bold">🎉 ' + cell.easterEgg.name + '</div>';
          }
        } else if (cell.missed) {
          // 未选中的格子（结束后展示）
          cellContent = '<div class="dig-cell-icon" style="opacity:0.4">' + (typeInfo ? typeInfo.icon : '❓') + '</div>';
          cellContent += '<div class="dig-cell-label" style="color:' + bgColor + ';opacity:0.5;font-size:10px">' + (typeInfo ? typeInfo.name : '') + '</div>';
        }
        cellContent = '<div style="background:linear-gradient(135deg,' + bgColor + '22,' + bgColor + '11);width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">' + cellContent + '</div>';
      } else {
        cellClass += 'dig-cell-hidden';
        cellContent = '<div class="dig-cell-icon">🎁</div>';
        cellContent += '<div class="text-[9px] text-yellow-400 mt-1">点击翻开</div>';
        cellContent = '<div onclick="digCell(' + i + ')" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;">' + cellContent + '</div>';
      }
      gridHtml += '<div class="' + cellClass + '" ' + (!cell.revealed ? 'onclick="digCell(' + i + ')"' : '') + '>' + cellContent + '</div>';
    }
    gridHtml += '</div>';

    // 统计已获得
    var foundParts = [];
    if (s.totalFound.gold > 0) foundParts.push('<span class="text-yellow-400">🪙 ' + s.totalFound.gold.toLocaleString() + '</span>');
    if (s.totalFound.gem > 0) foundParts.push('<span class="text-purple-400">💎 ×' + s.totalFound.gem + '</span>');
    if (s.totalFound.item > 0) foundParts.push('<span class="text-blue-400">📦 ×' + s.totalFound.item + '</span>');
    if (s.totalFound.diamond > 0) foundParts.push('<span class="text-cyan-400">🔷 ×' + s.totalFound.diamond + '</span>');
    if (s.totalFound.egg > 0) foundParts.push('<span class="text-orange-400">🥚 ×' + s.totalFound.egg + '</span>');
    if (s.totalFound.essence > 0) foundParts.push('<span class="text-pink-400">✨ ×' + s.totalFound.essence + '</span>');
    var foundHtml = foundParts.length > 0 ? foundParts.join('　') : '<span class="text-secondary">暂无收获</span>';

    // 工具操作区
    var toolBarHtml = '<div class="bg-panel border border-game rounded-xl p-3 mb-3">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<span class="text-sm font-bold text-yellow-400">🎁 剩余选择次数：' + s.picksLeft + '</span>' +
        '<span class="text-xs text-secondary">已选 ' + s.grid.filter(function(c) { return c.reward; }).length + ' 格</span>' +
      '</div>' +
      (s.finished ? '' : '<div class="flex gap-2">' +
        '<button class="btn-sm ' + (digShovelCount > 0 && s.picksLeft < 3 ? 'btn-primary' : 'border border-game text-secondary') + '" ' +
          'style="' + (digShovelCount <= 0 || s.picksLeft >= 3 ? 'opacity:0.5;cursor:not-allowed;' : '') + '" ' +
          (digShovelCount > 0 && s.picksLeft < 3 ? 'onclick="useDigShovel()"' : '') + '>' +
          '⛏️ 探宝铲 (×' + digShovelCount + ')</button>' +
        '<button class="btn-sm btn-danger" onclick="endDigSession()">结束挖宝</button>' +
      '</div>') +
    '</div>';

    content = `
    <div class="bg-card border border-game rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-lg text-yellow-400">⛏️ 挖密藏进行中</h2>
        ${s.finished ? '<span class="text-xs text-green-400 font-bold">✅ 已完成</span>' : '<button class="btn-danger btn-sm" onclick="endDigSession()">结束挖宝</button>'}
      </div>
      ${toolBarHtml}
      ${gridHtml}
      <div class="mt-4 text-center">
        <p class="text-xs text-secondary mb-1">本期收获</p>
        <p class="text-sm">${foundHtml}</p>
      </div>
      ${s.finished ? '<div class="mt-3 text-center"><button class="btn-gold btn-sm" onclick="endDigSession()">收下奖励并关闭</button></div>' : ''}
      <div class="mt-3 text-center">
        <p class="text-xs text-cyan-300">提示：所有格子都有奖励，选择你心仪的格子翻开！探宝铲可额外增加1次选择机会</p>
      </div>
    </div>`;
  } else {
    // ===== 无进行中的会话：展示入口 =====
    content = `
    <div class="bg-card border border-game rounded-xl p-4">
      <div class="text-center mb-4">
        <div class="text-5xl mb-2">⛏️🗺️</div>
        <h2 class="font-bold text-xl text-yellow-400 mb-1">挖密藏</h2>
        <p class="text-xs text-secondary">消耗密藏图开启九宫格挖宝，自主选择1格领取奖励</p>
      </div>
      ${toolsHtml}
      <div class="bg-panel border border-game rounded-lg p-3 mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-bold">📊 今日次数</span>
          <span class="text-sm ${used >= DIG_DAILY_LIMIT ? 'text-red-400' : 'text-green-400'}">${used} / ${DIG_DAILY_LIMIT}</span>
        </div>
        <div class="w-full bg-card rounded-full h-2 overflow-hidden">
          <div class="bg-gradient-to-r from-yellow-600 to-yellow-400 h-full rounded-full transition-all" style="width:${Math.min(100, used / DIG_DAILY_LIMIT * 100)}%"></div>
        </div>
      </div>
      <button class="btn-gold w-full py-3 text-lg font-bold mb-4" 
        ${digMapCount <= 0 || used >= DIG_DAILY_LIMIT ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : 'onclick="startDigSession()"'}
      >🗺️ 开始挖宝 ${digMapCount > 0 ? '(消耗1张密藏图)' : '(需要密藏图)'}</button>
      <div class="bg-panel border border-game rounded-lg p-3 space-y-1">
        <p class="text-xs text-yellow-400 font-bold mb-1">📜 玩法说明</p>
        <p class="text-xs text-secondary">• 消耗1张密藏图开启一局，3×3九宫格全部暗藏宝物</p>
        <p class="text-xs text-secondary">• 默认可选择1格领取奖励，所有格子均有奖励</p>
        <p class="text-xs text-secondary">• ⛏️ 探宝铲：开宝时自动消耗1把，额外+1次选择机会（上限3次）</p>
        <p class="text-xs text-secondary">• 奖励池：全部为高价值道具（元宵、保底石、月华露、蛋、密藏碎片、大金币箱、钻石、归元丹/归墟丹、炼化晶石、高级强化石、神兽精华、黄金宝藏）</p>
        <p class="text-xs text-pink-400">• ✨ 神兽精华：极低概率出现，黄金宝藏必出1个</p>
        <p class="text-xs text-orange-400">• 🌟 黄金宝藏：顶级奖励，含钻石+高阶宠物蛋+月华露+神兽精华</p>
        <p class="text-xs text-yellow-400">• 🎉 彩蛋机制：每格1%概率触发彩蛋（重挖一次/横排全得/纵排全得/9倍全奖）</p>
        <p class="text-xs text-cyan-300">• 🔮 密藏碎片：集齐5种碎片（青龙/白虎/朱雀/玄武/麒麟）可合成密藏图</p>
      </div>
    </div>`;
  }

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">⛏️ 挖密藏</h1>
      <span class="text-sm text-secondary">每日 ${DIG_DAILY_LIMIT} 次</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      ${content}
    </main>
  </div>`;
}

// 选中格子（用于透视功能）
function selectDigCell(idx) {
  if (!G.digSession) return;
  var cell = G.digSession.grid[idx];
  if (!cell || cell.revealed) return;
  window._digSelectedCell = (window._digSelectedCell === idx) ? undefined : idx;
  render();
}

function buyTreasureMap(rarity) {
  const idx = TREASURE_MAP_RARITIES.findIndex(r => r.id === rarity);
  const price = (idx + 1) * 500;
  if (G.player.gold < price) { showToast('金币不足！', 'error'); return; }
  G.player.gold -= price;
  if (!G.treasureMaps) G.treasureMaps = [];
  G.treasureMaps.push(generateTreasureMap(rarity));
  saveGame();
  render();
  showToast('购买成功！', 'success');
}

function setTmRarityFilter(rarity) {
  window._tmRarityFilter = rarity;
  render();
}

// 藏宝图合成：5张同品质 → 1张高品质，词条融合
function synthTreasureMap(rarity) {
  if (!G.treasureMaps || !Array.isArray(G.treasureMaps)) return;
  var curIdx = TREASURE_MAP_RARITIES.findIndex(function(r) { return r.id === rarity; });
  if (curIdx < 0 || curIdx >= TREASURE_MAP_RARITIES.length - 1) return;
  var nextR = TREASURE_MAP_RARITIES[curIdx + 1];
  // 找出该品质的所有藏宝图索引
  var matching = [];
  G.treasureMaps.forEach(function(m, i) {
    if (m.rarity === rarity) matching.push(i);
  });
  if (matching.length < 5) { showToast('需要5张同品质藏宝图！', 'error'); return; }
  // 取前5张作为材料
  var materials = matching.slice(0, 5).map(function(i) { return G.treasureMaps[i]; });
  // 从大到小删除索引
  matching.slice(0, 5).sort(function(a, b) { return b - a; }).forEach(function(i) {
    G.treasureMaps.splice(i, 1);
  });
  // 词条融合逻辑
  var targetAffixCount = nextR.affixCount;
  // 收集所有词条，按id统计
  var affixPool = {};
  materials.forEach(function(m) {
    (m.affixes || []).forEach(function(a) {
      if (!affixPool[a.id]) affixPool[a.id] = { id: a.id, name: a.name, format: a.format, values: [] };
      affixPool[a.id].values.push(a.value);
    });
  });
  var resultAffixes = [];
  // 相同词条：提升或保留（取最大值，有概率提升）
  Object.keys(affixPool).forEach(function(aid) {
    var pool = affixPool[aid];
    if (pool.values.length >= 2) {
      // 相同词条：取最大值并可能提升
      var maxVal = Math.max.apply(null, pool.values);
      var avgVal = pool.values.reduce(function(s, v) { return s + v; }, 0) / pool.values.length;
      // 50%概率取最大值提升10%，50%取平均值
      var finalVal = Math.random() < 0.5 ? maxVal * 1.1 : avgVal;
      resultAffixes.push({ id: pool.id, name: pool.name, value: Math.round(finalVal * 100) / 100, format: pool.format });
    }
  });
  // 如果还没凑满，从剩余的不同词条中随机保留
  var remainingAffixes = Object.keys(affixPool).filter(function(aid) {
    return affixPool[aid].values.length < 2;
  }).map(function(aid) { return affixPool[aid]; });
  // 打乱
  remainingAffixes.sort(function() { return Math.random() - 0.5; });
  for (var i = 0; i < remainingAffixes.length && resultAffixes.length < targetAffixCount; i++) {
    var pool = remainingAffixes[i];
    var val = pool.values[0];
    // 30%概率提升
    if (Math.random() < 0.3) val *= 1.1;
    resultAffixes.push({ id: pool.id, name: pool.name, value: Math.round(val * 100) / 100, format: pool.format });
  }
  // 如果还不够，随机生成新词条凑满
  var usedIds = new Set(resultAffixes.map(function(a) { return a.id; }));
  while (resultAffixes.length < targetAffixCount) {
    var affix;
    var attempts = 0;
    do {
      affix = TREASURE_AFFIXES[randomInt(0, TREASURE_AFFIXES.length - 1)];
      attempts++;
    } while (usedIds.has(affix.id) && attempts < 20);
    usedIds.add(affix.id);
    resultAffixes.push({ id: affix.id, name: affix.name, value: affix.genVal(), format: affix.format });
  }
  // 截取目标数量
  resultAffixes = resultAffixes.slice(0, targetAffixCount);
  // 特殊词条：orange品质有
  var special = null;
  if (nextR.id === 'orange') {
    special = TREASURE_SPECIAL_AFFIXES[randomInt(0, TREASURE_SPECIAL_AFFIXES.length - 1)];
  }
  // 新藏宝图等级取材料中的最高等级
  var maxLevel = 1;
  materials.forEach(function(m) { if (m.playerLevel && m.playerLevel > maxLevel) maxLevel = m.playerLevel; });
  // v3.0 负面词条合成
  var nextQualityIdx = curIdx + 1;
  var resultNegAffixes = (typeof synthesizeNegativeAffixes === 'function') ? synthesizeNegativeAffixes(materials, targetAffixCount, nextQualityIdx) : [];
  var newMap = {
    id: 'tmap_' + Date.now() + '_' + randomInt(1000, 9999),
    rarity: nextR.id, name: nextR.name, icon: nextR.icon,
    affixes: resultAffixes, special: special, negativeAffixes: resultNegAffixes,
    playerLevel: maxLevel,
  };
  G.treasureMaps.push(newMap);
  saveGame();
  render();
  showToast('合成成功！获得 ' + nextR.name, 'success');
}

// 手动合成：选2张藏宝图进行针对性合成
function openManualSynthModal() {
  var maps = G.treasureMaps || [];
  if (maps.length < 2) { showToast('需要至少2张藏宝图！', 'error'); return; }
  window._manualSynthSel = window._manualSynthSel || [null, null];
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'manualSynthModal';
  overlay.innerHTML = '<div class="modal-content scrollbar-thin" style="max-width:600px;max-height:85vh;">' +
    '<div class="flex items-center justify-between mb-4">' +
    '<h2 class="font-bold text-lg text-gold">🔧 手动合成藏宝图</h2>' +
    '<button class="text-secondary hover:text-white text-xl" onclick="closeManualSynthModal()">✕</button>' +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">选择2张藏宝图进行合成。结果品质取两者较高品质，词条从两张中融合选取。</p>' +
    '<div class="grid grid-cols-2 gap-3 mb-3">' +
    [0, 1].map(function(slot) {
      var selIdx = window._manualSynthSel[slot];
      var selMap = selIdx !== null ? maps[selIdx] : null;
      var rInfo = selMap ? TREASURE_MAP_RARITIES.find(function(r){return r.id===selMap.rarity;}) : null;
      return '<div class="bg-panel border border-game rounded-lg p-3 text-center min-h-[100px]">' +
        '<p class="text-xs text-secondary mb-1">位置 ' + (slot+1) + '</p>' +
        (selMap ? '<p class="text-sm font-bold" style="color:' + (rInfo ? rInfo.color : '#fff') + '">' + selMap.icon + ' ' + selMap.name + '</p>' +
          '<p class="text-xs text-yellow-400">Lv.' + (selMap.playerLevel || 1) + '</p>' +
          (selMap.affixes || []).map(function(a) { return '<p class="text-xs text-green-400">📌 ' + (typeof a.format === 'function' ? a.format(a.value) : '+' + a.value) + '</p>'; }).join('') : '<p class="text-xs text-secondary">未选择</p>') +
        '</div>';
    }).join('') +
    '</div>' +
    '<div class="max-h-[30vh] overflow-y-auto mb-3 space-y-1">' +
    maps.map(function(m, idx) {
      var rInfo = TREASURE_MAP_RARITIES.find(function(r){return r.id===m.rarity;});
      var selected = window._manualSynthSel.indexOf(idx) >= 0;
      return '<div class="bg-panel border rounded-lg p-2 cursor-pointer ' + (selected ? 'border-purple-500 opacity-50' : 'border-game hover:border-purple-500') + '" onclick="selectManualSynth(' + idx + ')">' +
        '<div class="flex items-center gap-2">' +
        '<span class="text-lg">' + m.icon + '</span>' +
        '<span class="text-xs font-bold" style="color:' + (rInfo ? rInfo.color : '#fff') + '">' + m.name + '</span>' +
        '<span class="text-xs text-yellow-400 ml-auto">Lv.' + (m.playerLevel || 1) + '</span>' +
        (selected ? '<span class="text-xs text-purple-400">已选</span>' : '') +
        '</div>' +
        '</div>';
    }).join('') +
    '</div>' +
    '<button class="btn-gold w-full" id="btnManualSynth" onclick="doManualSynth()">🔧 合成</button>' +
    '</div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', overlay.outerHTML);
}

function closeManualSynthModal() {
  var modal = document.getElementById('manualSynthModal');
  if (modal) modal.remove();
}

function selectManualSynth(idx) {
  if (!window._manualSynthSel) window._manualSynthSel = [null, null];
  // 如果已选中，取消选择
  var existing = window._manualSynthSel.indexOf(idx);
  if (existing >= 0) {
    window._manualSynthSel[existing] = null;
  } else {
    // 找空位放入
    if (window._manualSynthSel[0] === null) window._manualSynthSel[0] = idx;
    else if (window._manualSynthSel[1] === null) window._manualSynthSel[1] = idx;
    else { window._manualSynthSel[1] = idx; } // 替换第二个
  }
  closeManualSynthModal();
  openManualSynthModal();
}

function doManualSynth() {
  var maps = G.treasureMaps || [];
  var s0 = window._manualSynthSel[0];
  var s1 = window._manualSynthSel[1];
  if (s0 === null || s1 === null) { showToast('请选择2张藏宝图！', 'error'); return; }
  if (s0 === s1) { showToast('不能选择同一张藏宝图！', 'error'); return; }
  var m1 = maps[s0], m2 = maps[s1];
  if (!m1 || !m2) return;
  // 结果品质取较高者
  var r1Idx = TREASURE_MAP_RARITIES.findIndex(function(r){return r.id===m1.rarity;});
  var r2Idx = TREASURE_MAP_RARITIES.findIndex(function(r){return r.id===m2.rarity;});
  var resultIdx = Math.max(r1Idx, r2Idx);
  var nextR = TREASURE_MAP_RARITIES[resultIdx];
  var targetAffixCount = nextR.affixCount;
  // 收集所有词条
  var affixPool = {};
  [m1, m2].forEach(function(m) {
    (m.affixes || []).forEach(function(a) {
      if (!affixPool[a.id]) affixPool[a.id] = { id: a.id, name: a.name, format: a.format, values: [] };
      affixPool[a.id].values.push(a.value);
    });
  });
  var resultAffixes = [];
  // 相同词条提升
  Object.keys(affixPool).forEach(function(aid) {
    var pool = affixPool[aid];
    if (pool.values.length >= 2) {
      var maxVal = Math.max.apply(null, pool.values);
      var finalVal = maxVal * 1.1;
      resultAffixes.push({ id: pool.id, name: pool.name, value: Math.round(finalVal * 100) / 100, format: pool.format });
    }
  });
  // 剩余词条随机保留
  var remaining = Object.keys(affixPool).filter(function(aid) { return affixPool[aid].values.length < 2; }).map(function(aid) { return affixPool[aid]; });
  remaining.sort(function() { return Math.random() - 0.5; });
  for (var i = 0; i < remaining.length && resultAffixes.length < targetAffixCount; i++) {
    var pool = remaining[i];
    var val = pool.values[0];
    if (Math.random() < 0.3) val *= 1.1;
    resultAffixes.push({ id: pool.id, name: pool.name, value: Math.round(val * 100) / 100, format: pool.format });
  }
  // 不够则随机生成
  var usedIds = new Set(resultAffixes.map(function(a) { return a.id; }));
  while (resultAffixes.length < targetAffixCount) {
    var affix;
    var attempts = 0;
    do {
      affix = TREASURE_AFFIXES[randomInt(0, TREASURE_AFFIXES.length - 1)];
      attempts++;
    } while (usedIds.has(affix.id) && attempts < 20);
    usedIds.add(affix.id);
    resultAffixes.push({ id: affix.id, name: affix.name, value: affix.genVal(), format: affix.format });
  }
  resultAffixes = resultAffixes.slice(0, targetAffixCount);
  // 特殊词条
  var special = null;
  if (nextR.id === 'orange') {
    special = TREASURE_SPECIAL_AFFIXES[randomInt(0, TREASURE_SPECIAL_AFFIXES.length - 1)];
  }
  var maxLevel = Math.max(m1.playerLevel || 1, m2.playerLevel || 1);
  // v3.0 负面词条合成
  var manualQualityIdx = resultIdx;
  var resultNegAffixes2 = (typeof synthesizeNegativeAffixes === 'function') ? synthesizeNegativeAffixes([m1, m2], targetAffixCount, manualQualityIdx) : [];
  // 删除两张原图（从大到小索引）
  var toDelete = [s0, s1].sort(function(a, b) { return b - a; });
  toDelete.forEach(function(idx) { G.treasureMaps.splice(idx, 1); });
  var newMap = {
    id: 'tmap_' + Date.now() + '_' + randomInt(1000, 9999),
    rarity: nextR.id, name: nextR.name, icon: nextR.icon,
    affixes: resultAffixes, special: special, negativeAffixes: resultNegAffixes2,
    playerLevel: maxLevel,
  };
  G.treasureMaps.push(newMap);
  window._manualSynthSel = [null, null];
  closeManualSynthModal();
  saveGame();
  render();
  showToast('手动合成成功！获得 ' + nextR.name, 'success');
}

function useTreasureMap(idx) {
  const maps = G.treasureMaps || [];
  if (idx < 0 || idx >= maps.length) return;
  const tmap = maps[idx];
  maps.splice(idx, 1);
  stopLiveBattle();
  if (autoBattleInterval) { clearInterval(autoBattleInterval); autoBattleInterval = null; }
  const team = getTeamPets();
  if (team.length === 0) { showToast('请先设置出战宠物！', 'error'); G.treasureMaps.push(tmap); return; }
  const monsterPower = 1 + (tmap.affixes.filter(a => a.id === 'monster_power').reduce((s, a) => s + a.value, 0));
  const lv = Math.floor(G.player.level * monsterPower);
  var hpMult, atkMult, defMult;
  switch (tmap.rarity) {
    case 'white': hpMult = 1; atkMult = 1; defMult = 1; break;
    case 'green': hpMult = 2.4; atkMult = 1.6; defMult = 1.2; break;
    case 'blue': hpMult = 3.6; atkMult = 2.4; defMult = 1.5; break;
    case 'purple': hpMult = 5.4; atkMult = 3.6; defMult = 2; break;
    case 'orange': hpMult = 9.6; atkMult = 4.8; defMult = 2.5; break;
    default: hpMult = 3; atkMult = 2; defMult = 1.5;
  }
  // 同步主地图：连续成长曲线 + 提升后的基础属性 + 藏宝图难度强化（boss×3）
  var lvScale = 1 + lv * 0.012;
  var baseHp = Math.floor((40 + lv * 20) * hpMult * 3 * lvScale * monsterPower);
  var baseAtk = Math.floor((4 + lv * 3.8) * atkMult * 3 * lvScale * monsterPower * 0.8); // 需求14：活动怪物伤害下调20%
  const monster = {
    name: '藏宝图守卫', level: lv, enemyType: 'boss',
    hp: baseHp, maxHp: baseHp,
    atk: baseAtk,
    def: Math.floor(lv * 2.0 * defMult * 1.5),
    speed: Math.floor(lv * 2 + 10),
  };
  const petHp = {};
  const petMp = {};
  const petBuffs = {};
  const petStatus = {};
  const skillCooldowns = {};
  team.forEach(p => {
    const stats = getPetStats(p);
    petHp[p.id] = { current: stats.气血, max: stats.气血 };
    petMp[p.id] = { current: stats.魔法值, max: stats.魔法值 };
    petBuffs[p.id] = { atk: 0, def: 0, spd: 0, all: 0, shield: 0, hotTurns: 0, hotPct: 0, buffTurns: {} };
    petStatus[p.id] = { frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, burning: 0, burnPct: 0 };
    skillCooldowns[p.id] = {};
  });
  liveBattle = {
    monsters: [monster],
    monsterHpArray: [monster.hp],
    monsterMaxHpArray: [monster.maxHp || monster.hp],
    monsterStatusArray: [{ frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, poisonStacks: 0, burning: 0, burnPct: 0, defReduced: 0, defReduceTurns: 0 }],
    monsterBuffsArray: [{ atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0 }],
    team, petHp, petMp, petBuffs, petStatus, skillCooldowns,
    turnQueue: [], round: 0, animating: false,
    totalDamage: 0, logs: [], droppedChests: [],
    isDungeon: false, dungeonId: null, dungeonWave: 0, dungeonMaxWaves: 0,
    isArena: false, isTreasure: true, treasureMap: tmap,
  };
  autoBattleInterval = setInterval(() => {}, 999999);
  currentScreen = 'main';
  render();
  setTimeout(() => renderBattleArena(), 50);
  buildTurnQueue();
  scheduleNextTurn();
  showToast(`🗺️ 使用${tmap.name}，挑战藏宝图守卫！`, 'info');
}

