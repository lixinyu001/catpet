﻿// ===== ui_action.js : 导航/战斗控制/宠物操作/锻造/副本/任务等交互函数（从ui.js拆分） =====

function navigateTo(screen) {
// 需求5：功能等级限制检查
if (typeof SCREEN_FEATURE_MAP !== 'undefined' && SCREEN_FEATURE_MAP[screen]) {
var featureId = SCREEN_FEATURE_MAP[screen];
if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked(featureId)) {
var reqLv = getFeatureUnlockLevel(featureId);
showToast('🔒 需要 ' + reqLv + ' 级才能解锁此功能', 'error');
return;
}
}
currentScreen = screen;
render();
if (screen === 'main' && liveBattle) {
setTimeout(() => renderBattleArena(), 50);
}
}

function setEggTierFilter(tier) {
  window._eggTierFilter = tier;
  render();
}

function changeMap(mapId) {
  G.player.currentMap = parseInt(mapId);
  if (autoBattleInterval && (liveBattle || walkPhase)) {
    stopLiveBattle();
    spawnMonster();
    if (currentScreen === 'main') { render(); setTimeout(() => renderBattleArena(), 50); }
  }
  saveGame();
}

function setBattleSpeed(speed) {
  G.battleSpeed = speed;
  saveGame();
  if (autoBattleInterval && liveBattle) {
    clearTimeout(battleTurnTimer);
    scheduleNextTurn();
  }
  render();
}

function toggleAutoBattle() {
  if (autoBattleInterval) {
    clearInterval(autoBattleInterval);
    autoBattleInterval = null;
    stopLiveBattle();
    showToast('挂机已停止', 'info');
  } else {
    const team = getTeamPets();
    if (team.length === 0) {
      showToast('请先设置出战宠物！', 'error');
      return;
    }
    autoBattleInterval = setInterval(() => {}, 999999);
    startLiveBattle();
    showToast('开始自动挂机战斗！', 'success');
  }
  render();
  if (liveBattle || walkPhase) setTimeout(() => renderBattleArena(), 50);
}

function manualBattle() {
  showToast('请使用"开始挂机"进行自动战斗', 'info');
}

function selectTeamSlot(slot) {
  if (selectingTeamSlot === slot) { selectingTeamSlot = -1; }
  else { selectingTeamSlot = slot; }
  render();
}

function assignPetToSlot(petId) {
if (selectingTeamSlot < 0) return;
// 参战限制：寿命<50不可出战（神兽除外）
const pet = G.pets.find(p => p.id === petId);
if (pet && !pet.isDivineBeast && pet.lifespan !== undefined && pet.lifespan < 50) {
showToast('该宠物寿命不足50，无法参与战斗', 'error');
return;
}
const slot = selectingTeamSlot;
  const alreadyInSlot = G.player.activeTeam.indexOf(petId);
  if (alreadyInSlot >= 0 && alreadyInSlot !== slot) {
    G.player.activeTeam[alreadyInSlot] = G.player.activeTeam[slot];
  }
  G.player.activeTeam[slot] = petId;
  selectingTeamSlot = -1;
  if (autoBattleInterval) { stopLiveBattle(); spawnMonster(); }
  saveGame();
  render();
  if (liveBattle || walkPhase) setTimeout(() => renderBattleArena(), 50);
}

function removeFromTeam(slot) {
  G.player.activeTeam[slot] = null;
  selectingTeamSlot = -1;
  if (autoBattleInterval) { stopLiveBattle(); if (getTeamPets().length > 0) spawnMonster(); }
  saveGame();
  render();
  if (liveBattle || walkPhase) setTimeout(() => renderBattleArena(), 50);
  showToast('宠物已卸下', 'info');
}

// v2.9.0 需求2.2：刷新上阵宠物战力 —— 以当前数据为基准重新完整计算全部属性与战斗力
function refreshDeployedPetStats() {
  var teamIds = G.player.activeTeam || [null, null, null];
  var refreshed = 0;
  teamIds.forEach(function(id) {
    if (!id) return;
    var pet = G.pets.find(function(p) { return p.id === id; });
    if (!pet) return;
    // 调用 recalcPetOnDeploy 完整重算：等级/成长/资质/已分配属性点/技能/血统/符文/宝石等所有生效养成项
    if (typeof recalcPetOnDeploy === 'function') {
      recalcPetOnDeploy(pet);
    }
    // 同步重算 rarity（基于当前成长与资质）
    if (typeof recalcRarity === 'function') {
      pet.rarity = recalcRarity(pet);
    }
    // 强制刷新 stats 缓存（getPetStats 内部会重新计算）
    if (pet._statsCache) delete pet._statsCache;
    refreshed++;
  });
  saveGame();
  render();
  if (refreshed > 0) {
    showToast('已刷新 ' + refreshed + ' 只上阵宠物的属性与战力', 'success');
  } else {
    showToast('当前没有上阵宠物', 'info');
  }
}

function useRenameCard(petId) {
  var card = G.inventory.find(function(i) { return i.id === 'rename_card'; });
  if (!card || card.count <= 0) { showToast('没有改名卡！可在商城购买', 'error'); return; }
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var newName = prompt('请输入新的宠物名称（留空恢复真名）：', getPetDisplayName(pet).replace(/^★|·异$/g, ''));
  if (newName === null) return;
  newName = newName.trim();
  if (newName.length > 12) { showToast('名称过长（最多12字符）', 'error'); return; }
  renamePet(petId, newName);
  card.count--;
  if (card.count <= 0) {
    var idx = G.inventory.indexOf(card);
    if (idx >= 0) G.inventory.splice(idx, 1);
  }
  saveGame();
  showToast(newName ? '改名成功！新名称：' + newName : '已恢复真名：' + pet.name, 'success');
  render();
}

function showPetDetail(petId) {
  viewingPetId = petId;
  render();
}

function closePetDetail() {
  viewingPetId = null;
  render();
}

// 需求16：五维属性点分配 —— 玩家手动将自由属性点加到指定五维属性
function _allocateAttrPoint(petId, attrName) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (typeof allocateAttrPoint !== 'function') { showToast('属性点分配功能未加载', 'error'); return; }
  var result = allocateAttrPoint(pet, attrName);
  if (result) {
    showToast('✨ ' + attrName + ' +1', 'success');
    saveGame();
    render();
  } else {
    showToast('自由属性点不足', 'error');
  }
}

// v2.7.0 需求1.1：批量加点 —— 一次性将输入框中的数值加到对应属性
function _batchAllocateAttrPoints(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (typeof batchAllocateAttrPoints !== 'function') { showToast('批量加点功能未加载', 'error'); return; }
  if ((pet.freeAttrPoints || 0) <= 0) { showToast('剩余自由属性点为0', 'error'); return; }
  var allocations = {};
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(k) {
    var el = document.getElementById('batch_pt_' + k + '_' + petId);
    allocations[k] = el ? parseInt(el.value) || 0 : 0;
  });
  var result = batchAllocateAttrPoints(pet, allocations);
  if (result.ok) {
    showToast('✨ 批量加点成功，共分配 ' + result.allocated + ' 点', 'success');
    render();
  } else {
    showToast(result.msg || '批量加点失败', 'error');
  }
}

// v3.0 预览加点——读取输入框数值后调用预览，不实际消耗属性点
function _previewAttrAllocation(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (typeof previewAttrAllocation !== 'function') { showToast('预览功能未加载', 'error'); return; }
  if ((pet.freeAttrPoints || 0) <= 0) { showToast('剩余自由属性点为0', 'error'); return; }
  var allocations = {};
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(k) {
    var el = document.getElementById('batch_pt_' + k + '_' + petId);
    allocations[k] = el ? parseInt(el.value) || 0 : 0;
  });
  previewAttrAllocation(petId, allocations);
}

// v2.7.0 需求1.1：自动比例加点 —— 按设定比例分配剩余自由属性点
function _autoAllocateAttrPoints(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (typeof autoAllocateAttrPoints !== 'function') { showToast('自动加点功能未加载', 'error'); return; }
  if ((pet.freeAttrPoints || 0) <= 0) { showToast('剩余自由属性点为0', 'error'); return; }
  var ratios = {};
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(k) {
    var el = document.getElementById('ratio_pt_' + k + '_' + petId);
    ratios[k] = el ? parseInt(el.value) || 0 : 0;
  });
  var result = autoAllocateAttrPoints(pet, ratios);
  if (result.ok) {
    showToast('✨ 自动加点成功，共分配 ' + result.allocated + ' 点，剩余 ' + result.remaining + ' 点', 'success');
    render();
  } else {
    showToast(result.msg || '自动加点失败', 'error');
  }
}

// v2.11.0 需求3.2：保存自动加点方案（升级时自动按此比例分配自由点）
function _saveAutoAllocateScheme(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  var ratios = {};
  var total = 0;
  ['力量','敏捷','体质','耐力','魔力'].forEach(function(k) {
    var el = document.getElementById('ratio_pt_' + k + '_' + petId);
    ratios[k] = el ? Math.max(0, parseInt(el.value) || 0) : 0;
    total += ratios[k];
  });
  if (total === 0) { showToast('比例全为0，无法保存方案', 'error'); return; }
  // 归一化为百分比（总和=100）
  if (total !== 100) {
    ['力量','敏捷','体质','耐力','魔力'].forEach(function(k) {
      ratios[k] = Math.round(ratios[k] * 100 / total);
    });
  }
  pet.autoAllocateRatios = ratios;
  saveGame();
  showToast('✓ 自动加点方案已保存，宠物升级时将自动按此比例分配自由属性点', 'success');
  render();
}

// v2.11.0 需求3.2：重置自动加点方案（取消自动加点配置）
function _resetAutoAllocateScheme(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (!pet.autoAllocateRatios) { showToast('未设置自动加点方案', 'info'); return; }
  if (!confirm('确定要重置自动加点方案吗？重置后升级时不再自动分配属性点。')) return;
  pet.autoAllocateRatios = null;
  saveGame();
  showToast('✓ 自动加点方案已重置', 'success');
  render();
}

// v2.11.0 需求4.1：装备同步 —— 批量同步宠物所有穿戴装备至人物当前等级档位
function _syncPetEquip(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) { showToast('宠物不存在', 'error'); return; }
  if (!pet.petEquipment) { showToast('该宠物无装备', 'error'); return; }
  var slots = ['attack', 'hp', 'defense'];
  var synced = 0;
  var failed = 0;
  slots.forEach(function(slot) {
    if (pet.petEquipment[slot]) {
      // 临时保存材料状态，失败时回滚
      var result = syncPetEquip(petId, slot);
      if (result) synced++;
      else failed++;
    }
  });
  if (synced > 0) {
    showToast('🔄 装备同步完成：成功 ' + synced + ' 件' + (failed > 0 ? '，' + failed + '件已达标无需同步' : ''), 'success');
  } else {
    showToast('所有装备已达到当前人物档位，无需同步', 'info');
  }
}

// 需求7：在宠物详情页植入血统珠的弹窗
function showBloodOrbImplantModal(petId) {
  // v2.2.0 需求2：血统植入功能等级锁定（安全检查）
  if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('bloodline')) {
    showToast('🔒 需要 Lv.' + getFeatureUnlockLevel('bloodline') + ' 解锁血统植入功能', 'error');
    return;
  }
  window._bloodOrbImplantPetId = petId;
  render();
}

function closeBloodOrbImplantModal() {
  window._bloodOrbImplantPetId = null;
  render();
}

function renderBloodOrbImplantModal() {
  var petId = window._bloodOrbImplantPetId;
  var pet = petId ? G.pets.find(function(p) { return p.id === petId; }) : null;
  if (!pet) { window._bloodOrbImplantPetId = null; return ''; }
  // 仅显示可植入到此宠物的血统珠（已抽取的）
  var orbs = G.inventory.filter(function(i) { return i.isExtractedBloodOrb && i.count > 0; });
  var listHtml = '';
  if (orbs.length === 0) {
    listHtml = '<p class="text-xs text-secondary">暂无已抽取的血统珠，请先在「进化 → 血统」页面抽取</p>';
  } else {
    listHtml = '<div class="space-y-2">';
    orbs.forEach(function(orb) {
      var ob = BLOODLINE_SKILLS.find(function(b) { return b.id === orb.bloodlineId; });
      // 优先显示来源宠物的专属血统名称与描述（PET_BLOODLINE_DEX 已清理，使用 PET_BLOOD_ALL）
      var petBloodEntry = (typeof PET_BLOOD_ALL !== 'undefined' && orb.sourcePetName && PET_BLOOD_ALL[orb.sourcePetName]) ? PET_BLOOD_ALL[orb.sourcePetName] : null;
      var blName = petBloodEntry ? petBloodEntry.name : (ob ? ob.name : '未知血统');
      var blDesc = petBloodEntry ? petBloodEntry.desc : (ob ? ob.desc : '');
      var qColor = (typeof BLOOD_ORB_QUALITY_COLORS !== 'undefined') ? (BLOOD_ORB_QUALITY_COLORS[orb.quality] || '#9ca3af') : '#9ca3af';
      var qName = (typeof BLOOD_ORB_QUALITY_NAMES !== 'undefined') ? (BLOOD_ORB_QUALITY_NAMES[orb.quality] || orb.quality) : orb.quality;
      var canApply = !pet.bloodlineOrb || pet.bloodlineOrb.orbItemId !== orb.id;
      listHtml += '<div class="bg-panel rounded-lg p-2 border border-game flex items-center justify-between gap-2">' +
        '<div class="flex-1 text-xs">' +
          '<p class="font-bold" style="color:' + qColor + ';">' + blName + '·' + qName + '</p>' +
          '<p class="text-secondary">来源：' + (orb.sourcePetName || '?') + '（' + (orb.sourcePetRace || '?') + '）</p>' +
          '<p class="text-secondary">' + blDesc + '</p>' +
        '</div>' +
        '<button class="btn-primary text-xs px-2 py-1" ' + (!canApply ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="applyBloodOrbToPet(\'' + pet.id + '\',\'' + orb.id + '\')">植入</button>' +
      '</div>';
    });
    listHtml += '</div>';
  }
  var html = '<div class="modal-overlay" onclick="if(event.target===this)closeBloodOrbImplantModal()">' +
    '<div class="modal-content scrollbar-thin" onclick="event.stopPropagation()" style="max-width:520px;max-height:80vh;">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<h2 class="font-bold text-lg text-purple-300">💎 植入血统珠</h2>' +
        '<button class="text-secondary hover:text-white text-xl" onclick="closeBloodOrbImplantModal()">✕</button>' +
      '</div>' +
      '<p class="text-xs text-secondary mb-3">为目标宠物 <span class="font-bold text-white">' + getPetDisplayName(pet) + '</span> 选择一颗已抽取的血统珠进行植入。植入会消耗该血统珠道具。</p>' +
      listHtml +
      '<div class="flex gap-2 mt-3">' +
        '<button class="flex-1 bg-panel border border-game text-secondary hover:text-white text-sm py-2 rounded-lg" onclick="closeBloodOrbImplantModal()">关闭</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  return html;
}

// 显示重命名输入框（转盘式弹窗）
function showRenamePrompt(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var currentName = pet.customName || pet.name;
  var html = '<div class="modal-overlay" id="rename-modal" onclick="if(event.target===this)closeRenameModal()">' +
    '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:380px;">' +
      '<h3 class="font-bold text-lg mb-3 text-yellow-400">✏️ 宠物重命名</h3>' +
      '<p class="text-xs text-secondary mb-2">真名：<span class="text-white">' + pet.name + '</span></p>' +
      '<p class="text-xs text-secondary mb-3">自定义名称仅在当前账号显示，不影响宠物真名。</p>' +
      '<input id="rename-input" type="text" value="' + (pet.customName || '') + '" placeholder="输入新名称（最多12字，留空恢复原名）" ' +
        'maxlength="12" class="w-full bg-panel border border-game rounded-lg px-3 py-2 text-white text-sm mb-3 focus:border-yellow-500 outline-none" ' +
        'onkeydown="if(event.key===\'Enter\')confirmRename(\'' + petId + '\')">' +
      '<div class="flex gap-2">' +
        '<button class="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm py-2 rounded-lg" onclick="confirmRename(\'' + petId + '\')">确认</button>' +
        '<button class="flex-1 bg-panel border border-game text-secondary hover:text-white text-sm py-2 rounded-lg" onclick="closeRenameModal()">取消</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  var existing = document.getElementById('rename-modal');
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
  setTimeout(function() {
    var input = document.getElementById('rename-input');
    if (input) input.focus();
  }, 100);
}

function closeRenameModal() {
  var modal = document.getElementById('rename-modal');
  if (modal) modal.remove();
}

function confirmRename(petId) {
  var input = document.getElementById('rename-input');
  if (!input) return;
  var newName = input.value;
  closeRenameModal();
  renamePet(petId, newName);
}

// ==================== 宝箱转盘系统 ====================

// 获取宝箱内容的展示标签
function getChestContentLabel(c) {
  if (c.type === 'gold') return '💰 ' + (c.amount >= 1000 ? (c.amount / 1000).toFixed(1) + 'k' : c.amount) + '金币';
  if (c.type === 'diamond') return '💎 ' + c.amount + '钻石';
  if (c.type === 'egg') return '🥚 T' + (c.tier + 1) + '蛋';
  if (c.type === 'equipment') {
    // 修复：优先显示装备具体名称，附带稀有度前缀（如"白色·白铁剑"），让玩家明确所得装备
    var rarityName = EQUIP_RARITY_NAMES ? EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(c.equip.rarity)] : '';
    var equipName = c.equip.name || '装备';
    return '⚔️ ' + (rarityName ? rarityName + '·' : '') + equipName;
  }
  if (c.type === 'skill_book') return '📖 ' + (c.book.name || '技能书');
  if (c.type === 'item') return '📦 ' + (c.name || getItemName(c.id)) + 'x' + c.amount;
  if (c.type === 'talent_point') return '🌟 ' + c.amount + '天赋点';
  return '🎁 奖励';
}

// 获取宝箱内容的颜色
function getChestContentColor(c) {
  if (c.type === 'gold') return '#f59e0b';
  if (c.type === 'diamond') return '#3b82f6';
  if (c.type === 'egg') return '#22c55e';
  if (c.type === 'equipment') return '#a855f7';
  if (c.type === 'skill_book') return '#ef4444';
  if (c.type === 'item') return '#6366f1';
  if (c.type === 'talent_point') return '#fbbf24';
  return '#666';
}

// 显示宝箱转盘弹窗
function showChestRoulette(chest) {
  var rarity = chest.rarity || 'white';
  var rarityInfo = CHEST_RARITIES.find(function(r) { return r.id === rarity; }) || CHEST_RARITIES[0];
  // 生成6个可能的奖励（从同一品质池中随机生成）
  var segmentCount = 6;
  var segments = [];
  for (var i = 0; i < segmentCount; i++) {
    var contents = generateChestContents(rarity);
    if (contents && contents.length > 0) {
      segments.push({ content: contents[0], label: getChestContentLabel(contents[0]), color: getChestContentColor(contents[0]) });
    }
  }
  if (segments.length === 0) {
    // 回退：直接打开
    openChestDirect(chest);
    var idx0 = G.chests.findIndex(function(c) { return c.id === chest.id; });
    if (idx0 >= 0) G.chests.splice(idx0, 1);
    saveGame(); render();
    return;
  }
  var segCount = segments.length;
  // 按品质计算扇区大小：高品质物品占更小区域
  // 扇区权重 = 1 / qualityWeightMult（高品质weightMult小，则扇区权重小，区域更小）
  var segWeights = segments.map(function(s) {
    var q = getChestContentQuality(s.content);
    var mult = ITEM_QUALITY[q] ? ITEM_QUALITY[q].weightMult : 0.6;
    return 1 / mult;
  });
  var totalSegW = segWeights.reduce(function(a, b) { return a + b; }, 0);
  // 计算每个扇区的起止角度
  var segAngles = [];
  var accAngle = 0;
  for (var k = 0; k < segCount; k++) {
    var angleSize = (segWeights[k] / totalSegW) * 360;
    segAngles.push({ start: accAngle, end: accAngle + angleSize, size: angleSize });
    accAngle += angleSize;
  }
  // 构建 conic-gradient
  var gradientParts = [];
  for (var j = 0; j < segCount; j++) {
    gradientParts.push(segments[j].color + ' ' + segAngles[j].start + 'deg ' + segAngles[j].end + 'deg');
  }
  var gradient = 'conic-gradient(' + gradientParts.join(', ') + ')';
  // 构建标签（位于各扇区中心）
  var labelsHtml = segments.map(function(s, i) {
    var angle = (segAngles[i].start + segAngles[i].end) / 2;
    return '<div class="absolute inset-0" style="transform:rotate(' + angle + 'deg)">' +
      '<div class="absolute left-1/2 -translate-x-1/2 text-center" style="top:12px;font-size:10px;font-weight:bold;color:#fff;text-shadow:1px 1px 2px #000,-1px -1px 2px #000;white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis;">' + s.label + '</div>' +
    '</div>';
  }).join('');
  var html = '<div class="modal-overlay" id="chest-roulette-modal" onclick="if(event.target===this)closeChestRoulette()">' +
    // 转动期间禁止通过点击遮罩关闭（防止刷奖励：转盘结果未结算就关闭会让宝箱留在背包）
    // 优化：固定窗口大小，避免抖动和滚轴出现
    '<div class="modal-content" onclick="event.stopPropagation()" style="width:380px;max-width:90vw;min-height:480px;text-align:center;overflow:hidden;">' +
      '<h3 class="font-bold text-lg mb-1" style="color:' + rarityInfo.color + '">' + rarityInfo.icon + ' ' + rarityInfo.name + '转盘</h3>' +
      '<p class="text-xs text-secondary mb-4">转盘展示可能的奖励，高品质物品区域更小</p>' +
      '<div class="relative mx-auto mb-4" style="width:300px;height:300px;flex-shrink:0;">' +
        '<div id="chest-wheel" class="absolute inset-0 rounded-full" style="background:' + gradient + ';transition:transform 3s cubic-bezier(0.17,0.67,0.12,0.99);box-shadow:0 0 30px ' + rarityInfo.color + '88,inset 0 0 0 4px #fff3;">' + labelsHtml + '</div>' +
        '<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-3xl z-10" style="filter:drop-shadow(0 2px 4px #000);">🔽</div>' +
        '<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-yellow-500 border-4 border-yellow-200 z-10 flex items-center justify-center text-sm font-bold shadow-lg">🎯</div>' +
      '</div>' +
      '<button id="spin-btn" class="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-8 rounded-lg transition-colors" onclick="spinChestRoulette()">🔄 开始转盘</button>' +
      '<div id="roulette-result" class="mt-4" style="min-height:60px;"></div>' +
    '</div>' +
  '</div>';
  window._chestRouletteSegments = segments;
  window._chestRouletteChest = chest;
  window._chestRouletteSegAngles = segAngles;
  window._chestRouletteSegWeights = segWeights;
  window._chestRouletteTotalSegW = totalSegW;
  window._chestRouletteSpun = false;
  var existing = document.getElementById('chest-roulette-modal');
  if (existing) existing.remove();
  var div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}

// 转动转盘
function spinChestRoulette() {
  if (window._chestRouletteSpun) return;
  window._chestRouletteSpun = true;
  window._chestRouletteSpinning = true; // 转动期间禁止关闭
  var segments = window._chestRouletteSegments;
  var segAngles = window._chestRouletteSegAngles;
  var segWeights = window._chestRouletteSegWeights;
  var totalSegW = window._chestRouletteTotalSegW;
  var segCount = segments.length;
  // 按扇区权重随机选中（高品质物品区域小，被选中概率低）
  var luckyIndex = 0;
  var roll = Math.random() * totalSegW;
  var accW = 0;
  for (var i = 0; i < segCount; i++) {
    accW += segWeights[i];
    if (roll < accW) { luckyIndex = i; break; }
  }
  // 计算 rotation：5圈 + 落到 luckyIndex 中心
  var centerAngle = (segAngles[luckyIndex].start + segAngles[luckyIndex].end) / 2;
  var randomOffset = (Math.random() - 0.5) * segAngles[luckyIndex].size * 0.6;
  var targetRotation = 360 * 5 + (360 - centerAngle) + randomOffset;
  var wheel = document.getElementById('chest-wheel');
  if (wheel) wheel.style.transform = 'rotate(' + targetRotation + 'deg)';
  var btn = document.getElementById('spin-btn');
  if (btn) { btn.disabled = true; btn.textContent = '🎯 转盘转动中...'; btn.classList.add('opacity-50', 'cursor-not-allowed'); }
  setTimeout(function() {
    var chest = window._chestRouletteChest;
    var luckySegment = segments[luckyIndex];
    // 修复：chest 可能因外部强制关闭而为 null，需判空避免 TypeError
    if (!chest) { window._chestRouletteSpinning = false; return; }
    // 用转盘结果作为宝箱内容
    var resultChest = { contents: [luckySegment.content], opened: false };
    openChestDirect(resultChest);
    // 从背包移除原宝箱
    var idx = G.chests.findIndex(function(c) { return c.id === chest.id; });
    if (idx >= 0) G.chests.splice(idx, 1);
    saveGame();
    window._chestRouletteSpinning = false; // 转动结束，允许关闭
    var resultDiv = document.getElementById('roulette-result');
    if (resultDiv) {
      resultDiv.innerHTML = '<div class="bg-yellow-900/40 border border-yellow-500 rounded-lg p-3 animate-pulse">' +
        '<p class="text-yellow-400 font-bold mb-1">🎉 转盘结果</p>' +
        '<p class="text-sm text-white">' + luckySegment.label + '</p>' +
        '<button class="mt-3 bg-green-600 hover:bg-green-500 text-white text-sm py-1 px-4 rounded-lg" onclick="closeChestRoulette()">确认</button>' +
      '</div>';
    }
    render();
    showToast('🎁 获得：' + luckySegment.label, 'success');
  }, 3100);
}

function closeChestRoulette() {
  // 修复：转动期间禁止关闭（防止 setTimeout 已发奖但宝箱未移除的刷奖励漏洞）
  if (window._chestRouletteSpinning) {
    showToast('🎯 转盘正在转动中，请等待结果', 'info');
    return;
  }
  var modal = document.getElementById('chest-roulette-modal');
  if (modal) modal.remove();
  window._chestRouletteSegments = null;
  window._chestRouletteChest = null;
  window._chestRouletteSegAngles = null;
  window._chestRouletteSegWeights = null;
  window._chestRouletteTotalSegW = null;
  window._chestRouletteSpun = false;
}

function buyShopItem(itemId, price, action, tier, currency) {
  const qty = getShopQty(itemId);
  if (!qty || qty <= 0) return;
  const totalPrice = price * qty;
  if (currency === 'diamond') {
    if (G.player.diamond < totalPrice) { showToast('钻石不足！', 'error'); return; }
    G.player.diamond -= totalPrice;
  } else {
    if (G.player.gold < totalPrice) { showToast('金币不足！', 'error'); return; }
    G.player.gold -= totalPrice;
  }
  if (action === 'egg') {
    for (let i = 0; i < qty; i++) { const egg = generateEgg(tier); G.eggs.push(egg); }
    showToast(`购买了 ${qty} 个宠物蛋！`, 'success');
  } else if (action === 'item') {
    if (itemId === 'hatch_stone') {
      G.hatchStones = (G.hatchStones || 0) + qty;
      showToast(`购买了 ${qty} 颗孵化石！`, 'success');
    } else if (itemId === 'exp_book') {
      const gained = addExp(10000 * qty);
      showToast(`使用 ${qty} 本经验书，获得 ${gained.toLocaleString()} 经验！`, 'success');
    } else if (itemId === 'exp_book_mid') {
      const gained = addExp(100000 * qty);
      showToast(`使用 ${qty} 本中级经验书，获得 ${gained.toLocaleString()} 经验！`, 'success');
    } else if (itemId === 'exp_book_high') {
      const gained = addExp(1000000 * qty);
      showToast(`使用 ${qty} 本高级经验书，获得 ${gained.toLocaleString()} 经验！`, 'success');
    } else {
      const existing = G.inventory.find(i => i.id === itemId);
      if (existing) existing.count += qty;
      else G.inventory.push({ id: itemId, count: qty });
      showToast(`购买了 ${getItemName(itemId)} x${qty}！`, 'success');
    }
  } else if (action === 'skill_random') {
    for (let i = 0; i < qty; i++) {
      const skill = pickRandom(ALL_SKILLS);
      const existing = G.skillBooks.find(b => b.id === skill.id);
      if (existing) existing.count++;
      else G.skillBooks.push({ id: skill.id, count: 1 });
    }
    showToast(`获得了 ${qty} 本随机技能书！`, 'success');
  } else if (action === 'yuanxiao') {
    const existing = G.inventory.find(i => i.id === itemId);
    if (existing) existing.count += qty;
    else G.inventory.push({ id: itemId, count: qty });
    showToast(`购买了 ${getItemName(itemId)} x${qty}！`, 'success');
  } else if (action === 'buff') {
    const itemDef = SHOP_ITEMS.find(i => i.id === itemId);
    if (itemDef && itemDef.buffType) {
      var activated = 0;
      var rejected = 0;
      for (let i = 0; i < qty; i++) {
        var ok = activateBuff(itemDef.buffType, itemDef.buffMult, itemDef.buffDuration);
        if (ok) activated++;
        else rejected++;
      }
      if (activated > 0 && rejected === 0) {
        showToast(`激活 ${itemDef.name} x${activated}！${itemDef.buffMult}倍效果持续${itemDef.buffDuration}分钟`, 'success');
      } else if (activated > 0 && rejected > 0) {
        showToast(`激活 ${activated} 张，${rejected} 张因已有更高倍率buff被拒绝`, 'info');
      } else {
        showToast(`已有更高倍率的${BUFF_DISPLAY[itemDef.buffType] ? BUFF_DISPLAY[itemDef.buffType].name : ''}buff生效中，无法使用低倍率buff`, 'error');
      }
    }
  } else if (action === 'gold_chest') {
    const itemDef = SHOP_ITEMS.find(i => i.id === itemId);
    const goldGain = itemDef && itemDef.goldAmount ? itemDef.goldAmount * qty : 0;
    if (goldGain > 0) {
      G.player.gold += goldGain;
      showToast(`开启 ${itemDef.name} x${qty}，获得 ${goldGain.toLocaleString()} 金币！`, 'success');
    }
  } else if (action === 'gem') {
    const itemDef = SHOP_ITEMS.find(i => i.id === itemId);
    if (itemDef && itemDef.gemType) {
      addGemToBag(itemDef.gemType, itemDef.gemLevel || 1, qty);
      const def = getGemType(itemDef.gemType);
      showToast(`获得 ${def ? def.name : '宝石'} +${itemDef.gemLevel || 1} x${qty}！`, 'success');
    }
  } else if (action === 'rare_egg') {
    for (let i = 0; i < qty; i++) {
      const tier = randomInt(2, 4);
      const egg = generateEgg(tier - 1);
      G.eggs.push(egg);
    }
    showToast(`购买了 ${qty} 个稀有宠物蛋！`, 'success');
  } else if (action === 'rename_card') {
    const existing = G.inventory.find(i => i.id === 'rename_card');
    if (existing) existing.count += qty;
    else G.inventory.push({ id: 'rename_card', count: qty });
    showToast(`购买了 ${qty} 张改名卡！前往宠物详情使用`, 'success');
  } else if (action === 'exp_book_bulk') {
    const gained = addExp(10000 * 5 * qty);
    showToast(`使用 ${qty} 组经验书包，获得 ${gained.toLocaleString()} 经验！`, 'success');
  } else if (action === 'divine_essence') {
    // 神兽精华：直接加入背包
    var deItem = G.inventory.find(function(i) { return i.id === 'divine_essence'; });
    if (deItem) deItem.count += qty;
    else G.inventory.push({ id: 'divine_essence', count: qty });
    showToast(`购买了 ${qty} 个神兽精华！`, 'success');
  } else if (action === 'lifespan_item') {
    // 延寿丹：加入背包，需在宠物详情中使用
    var lsItem = G.inventory.find(function(i) { return i.id === itemId; });
    if (lsItem) lsItem.count += qty;
    else G.inventory.push({ id: itemId, count: qty });
    showToast(`购买了 ${getItemName(itemId)} x${qty}！前往宠物详情使用`, 'success');
  } else if (action === 'arena_ticket') {
    // 竞技场挑战券：使用后增加当日竞技场挑战次数（减少已用次数）
    G.arenaDailyUsed = Math.max(0, (G.arenaDailyUsed || 0) - qty);
    showToast(`使用 ${qty} 张竞技场挑战券，今日挑战次数 +${qty}！`, 'success');
  }
  resetShopQty(itemId);
  saveGame();
  render();
}

// 使用元宵道具提升宠物资质
function useYuanxiao(petId, itemId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var inv = G.inventory.find(function(i) { return i.id === itemId; });
  if (!inv || inv.count <= 0) { showToast('没有该元宵！', 'error'); return; }
  var itemDef = SHOP_ITEMS.find(function(s) { return s.id === itemId; });
  if (!itemDef || !itemDef.aptKey) { showToast('无效道具！', 'error'); return; }
  if ((pet.yuanxiaoUsed || 0) >= 20) { showToast('该宠物元宵使用已达上限20次！', 'error'); return; }
  if (!pet.aptitude) pet.aptitude = { 力量资质:1500, 体质资质:1500, 敏捷资质:1500, 耐力资质:1500, 魔力资质:1500 };
  var aptKey = itemDef.aptKey;
  var curVal = pet.aptitude[aptKey] || 1500;
  if (curVal >= 3000) { showToast('该资质已满！', 'error'); return; }
  var gain = randomInt(10, 30);
  pet.aptitude[aptKey] = Math.min(3000, curVal + gain);
  pet.yuanxiaoUsed = (pet.yuanxiaoUsed || 0) + 1;
  // 资质变更后重新计算品质（资质提升可能使品质升级）
  var oldRarity = pet.rarity;
  pet.rarity = recalcRarity(pet);
  var rarityMsg = '';
  if (oldRarity !== pet.rarity) {
    var oldIdx = RARITIES.indexOf(oldRarity);
    var newIdx = RARITIES.indexOf(pet.rarity);
    rarityMsg = '，品质 ' + RARITY_NAMES[oldIdx] + ' → ' + RARITY_NAMES[newIdx];
  }
  inv.count--;
  if (inv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== itemId; });
  saveGame();
  render();
  showToast(itemDef.name + ' 使用成功！' + aptKey + ' +' + gain + rarityMsg, 'success');
}

function renderSkillBookCards(category) {
  var allList = SKILL_BOOK_SHOP[category] || [];
  // 需求15：技能书分页展示
  var PER_PAGE = 8;
  if (!window._skillBookPage) window._skillBookPage = {};
  if (!window._skillBookPage[category]) window._skillBookPage[category] = 1;
  var totalPages = Math.max(1, Math.ceil(allList.length / PER_PAGE));
  if (window._skillBookPage[category] > totalPages) window._skillBookPage[category] = totalPages;
  if (window._skillBookPage[category] < 1) window._skillBookPage[category] = 1;
  var page = window._skillBookPage[category];
  var start = (page - 1) * PER_PAGE;
  var pageItems = allList.slice(start, start + PER_PAGE);
  var cardsHtml = pageItems.map(sb => {
    const qty = getShopQty(sb.id);
    const totalPrice = sb.price * qty;
    const isDiamond = sb.currency === 'diamond';
    const canAfford = isDiamond ? G.player.diamond >= totalPrice : G.player.gold >= totalPrice;
    const currencyIcon = isDiamond ? '💎' : '🪙';
    const typeIcon = getSkillTypeIcon(sb.type);
    const typeLabel = getSkillTypeLabel(sb.type);
    const tierLabel = sb.tier ? getSkillTierLabel(sb.tier) : '';
    const tierColor = sb.tier ? getSkillTierColor(sb.tier) : '#94a3b8';
    // 主动技能显示品质徽章
    var qualityBadge = '';
    if (sb.type === 'active' && sb.quality && typeof SKILL_QUALITY_NAMES !== 'undefined') {
      var qName = SKILL_QUALITY_NAMES[sb.quality] || '普通';
      var qColor = (typeof SKILL_QUALITY_COLORS !== 'undefined' && SKILL_QUALITY_COLORS[sb.quality]) || '#9ca3af';
      qualityBadge = '<span class="text-xs px-1.5 py-0.5 rounded font-bold" style="background:' + qColor + '22;color:' + qColor + '">[' + qName + ']</span>';
    }
    return `
    <div class="bg-panel border border-game rounded-xl p-4 text-center flex flex-col">
      <div class="text-3xl mb-2">📖</div>
      <p class="font-bold text-sm mb-1">${typeIcon} ${sb.name}</p>
      <div class="flex items-center justify-center gap-1 mb-1">
        <span class="text-xs px-1.5 py-0.5 rounded ${sb.type === 'active' ? 'bg-red-900 text-red-300' : sb.type === 'aura' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'}">${typeLabel}</span>
        ${tierLabel ? `<span class="text-xs px-1.5 py-0.5 rounded font-bold" style="background:${tierColor}22;color:${tierColor}">${tierLabel}</span>` : ''}
        ${qualityBadge}
      </div>
      <p class="text-xs text-secondary mb-2 flex-1">${sb.desc}</p>
      <p class="text-xs ${isDiamond ? 'text-blue-400' : 'text-gold'}">单价 ${currencyIcon} ${sb.price.toLocaleString()}</p>
      <div class="flex items-center justify-center gap-2 my-2">
        <button class="w-7 h-7 rounded border border-game text-sm flex items-center justify-center hover:border-purple-500" onclick="event.stopPropagation();setShopQty('${sb.id}',getShopQty('${sb.id}')-1);renderSkillBookGrid()">−</button>
        <span class="w-10 text-center font-bold text-sm">${qty}</span>
        <button class="w-7 h-7 rounded border border-game text-sm flex items-center justify-center hover:border-purple-500" onclick="event.stopPropagation();setShopQty('${sb.id}',getShopQty('${sb.id}')+1);renderSkillBookGrid()">+</button>
      </div>
      <p class="${isDiamond ? 'text-blue-400' : 'text-gold'} font-bold text-sm mb-2">总价 ${currencyIcon} ${totalPrice.toLocaleString()}</p>
      <button class="${canAfford ? (isDiamond ? 'btn-primary' : 'btn-gold') : 'btn-primary'} btn-sm w-full" ${!canAfford ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}
        onclick="buySkillBook('${sb.id}')">
        ${canAfford ? '购买' : (isDiamond ? '钻石不足' : '金币不足')}
      </button>
    </div>`;
  }).join('');
  // 需求15：分页控件
  var pagerHtml = '';
  if (totalPages > 1) {
    pagerHtml = '<div class="col-span-full flex items-center justify-between mt-3">' +
      '<button class="btn-primary btn-sm text-xs" ' + (page > 1 ? 'onclick="window._skillBookPage[\'' + category + '\']=' + Math.max(1, page - 1) + ';renderSkillBookGrid()"' : 'disabled style="opacity:0.4;cursor:not-allowed"') + '>◀ 上一页</button>' +
      '<span class="text-xs text-secondary">第 ' + page + '/' + totalPages + ' 页（共 ' + allList.length + ' 个技能）</span>' +
      '<button class="btn-primary btn-sm text-xs" ' + (page < totalPages ? 'onclick="window._skillBookPage[\'' + category + '\']=' + Math.min(totalPages, page + 1) + ';renderSkillBookGrid()"' : 'disabled style="opacity:0.4;cursor:not-allowed"') + '>下一页 ▶</button>' +
    '</div>';
  }
  return cardsHtml + pagerHtml;
}

let currentSkillBookTab = 'active';

function switchSkillBookTab(category) {
  currentSkillBookTab = category;
  // 需求15：切换分类时重置页码
  if (!window._skillBookPage) window._skillBookPage = {};
  window._skillBookPage[category] = 1;
  const grid = document.getElementById('skillBookGrid');
  const tabs = document.getElementById('skillBookTabs');
  if (grid) grid.innerHTML = renderSkillBookCards(category);
  if (tabs) {
    tabs.querySelectorAll('button').forEach(b => {
      b.className = 'text-xs px-3 py-1 rounded border border-game text-secondary';
    });
    const activeBtn = tabs.querySelector(`button[onclick*="${category}"]`);
    if (activeBtn) activeBtn.className = 'text-xs px-3 py-1 rounded border border-game bg-purple-900 text-purple-300 font-bold';
  }
}

function renderSkillBookGrid() {
  const grid = document.getElementById('skillBookGrid');
  if (grid) grid.innerHTML = renderSkillBookCards(currentSkillBookTab);
}

function renderShopOnly() {
  const main = document.querySelector('#app main');
  if (!main) return;
  const shopHTML = renderShopScreen();
  const temp = document.createElement('div');
  temp.innerHTML = shopHTML;
  const newMain = temp.querySelector('main');
  if (newMain) main.innerHTML = newMain.innerHTML;
}

function buySkillBook(skillId) {
  let sb = null;
  for (const cat of Object.values(SKILL_BOOK_SHOP)) {
    sb = cat.find(s => s.id === skillId);
    if (sb) break;
  }
  if (!sb) return;
  const qty = getShopQty(skillId);
  const totalPrice = sb.price * qty;
  const isDiamond = sb.currency === 'diamond';
  if (isDiamond) {
    if (G.player.diamond < totalPrice) { showToast('钻石不足！', 'error'); return; }
    G.player.diamond -= totalPrice;
  } else {
    if (G.player.gold < totalPrice) { showToast('金币不足！', 'error'); return; }
    G.player.gold -= totalPrice;
  }
  const existing = G.skillBooks.find(b => b.id === skillId);
  if (existing) existing.count += qty;
  else G.skillBooks.push({ id: skillId, count: qty });
  showToast(`购买成功！获得 ${sb.name} x${qty}`, 'success');
  resetShopQty(skillId);
  saveGame();
  render();
}

function useSkillBook(petId, bookId) {
  const pet = G.pets.find(p => p.id === petId);
  if (!pet) return;
  const bookIdx = G.skillBooks.findIndex(b => b.id === bookId);
  if (bookIdx === -1) { showToast('没有该技能书！', 'error'); return; }
  if (G.player.gold < 100) { showToast('打书需要100金币手续费！', 'error'); return; }
  const skillData = getSkillById(bookId);
  if (!skillData) return;
  if (skillData.type === 'bloodline') { showToast('血统技能无法通过打书获得！', 'error'); return; }
  const allSkills = getAllSkills(pet);
  const baseId = getSkillBaseId(bookId);
  const hasSameBase = allSkills.some(s => getSkillBaseId(s.id) === baseId);
  if (hasSameBase) { showToast(`宠物已有同名技能（${getSkillBaseName(skillData.name)}），无法重复学习！`, 'error'); return; }
  const normalSkills = getNormalSkills(pet);
  const maxSlots = getMaxSkillSlots(pet);
  // 天生技能也可以被打书顶掉
  G.player.gold -= 100;
  G.skillBooks[bookIdx].count--;
  if (G.skillBooks[bookIdx].count <= 0) G.skillBooks.splice(bookIdx, 1);
  const newSkill = { ...skillData, isInnate: false };
  if (normalSkills.length < maxSlots) {
    const openChance = 0.5 - (normalSkills.length / maxSlots) * 0.4;
    if (Math.random() < openChance) {
      pet.learnedSkills.push(newSkill);
      showToast(`🎉 开格子成功！学会了 ${skillData.name}`, 'success');
      updateAchievement('skill_learn', 1);
      updateDailyTask('skill_learn', 1);
      saveGame(); render(); return;
    }
  }
  // 所有非血统技能都可被顶掉（含天生技能）
  const replaceable = [];
  pet.learnedSkills.forEach((s, i) => { replaceable.push({ skill: s, idx: i, pool: 'learned' }); });
  pet.innateSkills.forEach((s, i) => { replaceable.push({ skill: s, idx: i, pool: 'innate' }); });
  if (replaceable.length === 0) { showToast('没有可被顶掉的技能！', 'error'); return; }
  const target = pickRandom(replaceable);
  const oldName = target.skill.name;
  if (target.pool === 'learned') pet.learnedSkills[target.idx] = newSkill;
  else pet.innateSkills[target.idx] = newSkill;
  showToast(`📖 技能替换：${oldName} → ${skillData.name}`, 'info');
  updateAchievement('skill_learn', 1);
  updateDailyTask('skill_learn', 1);
  saveGame();
  render();
}

function decomposeEgg(eggId) {
  const idx = G.eggs.findIndex(e => e.id === eggId);
  if (idx === -1) return;
  const egg = G.eggs[idx];
  if (egg.isHatching) { showToast('孵化中的蛋不能分解！', 'error'); return; }
  G.eggs.splice(idx, 1);
  const tier = egg.tier;
  if (!G.eggShards[tier]) G.eggShards[tier] = 0;
  G.eggShards[tier]++;
  showToast(`分解成功！获得T${tier+1}碎片`, 'info');
  saveGame();
  render();
}

// 批量分解指定T级的所有未孵化蛋
function batchDecomposeEggs(tier) {
  var toDecompose = G.eggs.filter(function(e) { return e.tier === tier && !e.isHatching; });
  if (toDecompose.length === 0) { showToast('没有可分解的蛋！', 'error'); return; }
  if (!confirm('确定批量分解 ' + toDecompose.length + ' 个T' + (tier+1) + ' 蛋？\n将获得 ' + toDecompose.length + ' 个T' + (tier+1) + ' 碎片。')) return;
  var eggIds = new Set(toDecompose.map(function(e) { return e.id; }));
  G.eggs = G.eggs.filter(function(e) { return !eggIds.has(e.id); });
  if (!G.eggShards[tier]) G.eggShards[tier] = 0;
  G.eggShards[tier] += toDecompose.length;
  showToast('批量分解成功！获得T' + (tier+1) + '碎片×' + toDecompose.length, 'success');
  saveGame();
  render();
}

function craftEggFromShards(tier) {
  if (!G.eggShards[tier] || G.eggShards[tier] < 5) { showToast('碎片不足5个！', 'error'); return; }
  G.eggShards[tier] -= 5;
  if (G.eggShards[tier] <= 0) delete G.eggShards[tier];
  const egg = generateEgg(tier);
  G.eggs.push(egg);
  showToast(`合成成功！获得T${tier+1}宠物蛋`, 'success');
  saveGame();
  render();
}

function quickAddToTeam(petId) {
  for (let i = 0; i < 3; i++) {
    if (!G.player.activeTeam[i] || G.player.activeTeam[i] === petId) {
      G.player.activeTeam[i] = G.player.activeTeam[i] === petId ? null : petId;
      break;
    }
  }
  if (autoBattleInterval) {
    stopLiveBattle();
    spawnMonster();
  }
  saveGame();
  render();
  if (liveBattle || walkPhase) setTimeout(() => renderBattleArena(), 50);
}

function releasePet(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  // 神兽放生返还50个神兽精华
  var isDivine = (typeof isDivineBeastPet === 'function') ? isDivineBeastPet(pet) : pet.isDivineBeast;
  if (isDivine) {
    if (!confirm('确定放生神兽【' + getPetDisplayName(pet) + '】？\n放生神兽将返还 50 个神兽精华！')) return;
    var deItem = G.inventory.find(function(i) { return i.id === 'divine_essence'; });
    if (deItem) deItem.count += 50;
    else G.inventory.push({ id: 'divine_essence', count: 50 });
    showToast('🐉 放生神兽，返还 50 个神兽精华', 'success');
  } else {
    // 需求：普通宠物放生奖励 —— 固定1个对应T级蛋碎片 + 随机15分钟增益Buff
    var tier = (typeof getPetTier === 'function') ? getPetTier(pet.name) : 0;
    if (!G.eggShards) G.eggShards = {};
    var shardKey = String(tier);
    G.eggShards[shardKey] = (G.eggShards[shardKey] || 0) + 1;
    // 随机Buff：多倍经验/金币/钻石/蛋掉落/装备掉落
    var releaseBuffs = [
      { type: 'exp_mult', mult: 2, name: '双倍经验', icon: '🎴' },
      { type: 'gold_mult', mult: 2, name: '双倍金币', icon: '💰' },
      { type: 'diamond_mult', mult: 2, name: '双倍钻石', icon: '💎' },
      { type: 'egg_drop_mult', mult: 2, name: '双倍蛋掉落', icon: '🥚' },
      { type: 'drop_mult', mult: 2, name: '双倍装备掉落', icon: '⚔️' },
    ];
    var chosenBuff = releaseBuffs[randomInt(0, releaseBuffs.length - 1)];
    if (typeof activateBuff === 'function') {
      activateBuff(chosenBuff.type, chosenBuff.mult, 15);
    }
    showToast('🐾 放生成功！获得 T' + (tier + 1) + ' 蛋碎片×1，' + chosenBuff.icon + ' ' + chosenBuff.name + '（15分钟）', 'success');
  }
  G.pets = G.pets.filter(p => p.id !== petId);
  G.player.activeTeam = G.player.activeTeam.map(id => id === petId ? null : id);
  if (autoBattleInterval) {
    stopLiveBattle();
    if (getTeamPets().length > 0) spawnMonster();
  }
  saveGame();
  render();
  if (liveBattle || walkPhase) setTimeout(() => renderBattleArena(), 50);
}

// ===== 宠物重置（归元丹/归虚丹） =====
function confirmResetPet(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  var tier = getPetTier(pet.name);
  var needItem = tier >= 4 ? 'guixu_pill' : 'guiyuan_pill';
  var needName = tier >= 4 ? '归虚丹' : '归元丹';
  var inv = G.inventory.find(function(i) { return i.id === needItem; });
  var has = inv && inv.count > 0;
  var msg = '将重置【' + getPetDisplayName(pet) + '】(T' + (tier+1) + ')的成长、资质、技能（保留等级/种族/血统）。\n\n';
  if (has) {
    msg += '消耗：' + needName + ' x1（当前拥有 ' + inv.count + '）\n确定重置？';
    if (confirm(msg)) doResetPet(petId);
  } else {
    msg += '需要：' + needName + '（当前没有，请前往商城购买）';
    alert(msg);
  }
}

function doResetPet(petId) {
  var result = resetPet(petId);
  if (result.ok) {
    saveGame();
    render();
    showToast('宠物已重置！成长、资质、技能已刷新', 'success');
  } else {
    showToast(result.msg, 'error');
  }
}

function startHatch(eggId) {
  const egg = G.eggs.find(e => e.id === eggId);
  if (!egg || egg.isHatching) return;
  // 孵化必须消耗1颗孵化石
  if (!G.hatchStones || G.hatchStones < 1) {
    showToast('孵化需要1颗孵化石！可在商城购买或通过天赋/副本获得', 'error');
    return;
  }
  G.hatchStones -= 1;
  egg.isHatching = true;
  egg.hatchProgress = 0;
  // 需求3：记录孵化开始时间戳，确保页面关闭后重新打开时孵化进程在后台持续计算
  egg.hatchStartTime = Date.now();
  egg.hatchBaseProgress = 0;
  startHatchTimer(eggId);
  showToast('开始孵化宠物蛋！消耗1颗孵化石', 'info');
  saveGame();
  render();
}

// 需求3：孵化定时器核心逻辑（基于时间戳计算进度，支持后台持续计算）
function startHatchTimer(eggId) {
  const egg = G.eggs.find(e => e.id === eggId);
  if (!egg || !egg.isHatching) return;
  // 基于时间戳计算当前应有进度
  var hatchMult = (typeof getBuffMult === 'function') ? getBuffMult('hatch_mult') : 1;
  var elapsedSec = Math.floor((Date.now() - (egg.hatchStartTime || Date.now())) / 1000);
  egg.hatchProgress = (egg.hatchBaseProgress || 0) + elapsedSec * hatchMult;
  if (egg.hatchProgress >= egg.hatchTime) {
    completeHatch(eggId);
    return;
  }
  if (currentScreen === 'eggs') render();
  hatchIntervals[eggId] = setTimeout(function() { startHatchTimer(eggId); }, 1000);
}

// 需求3：页面加载时恢复所有孵化中的蛋（基于时间戳计算离线期间进度）
function resumeHatching() {
  if (!G.eggs || !Array.isArray(G.eggs)) return;
  G.eggs.forEach(function(egg) {
    if (egg.isHatching && !hatchIntervals[egg.id]) {
      // 计算离线期间进度推进
      var hatchMult = (typeof getBuffMult === 'function') ? getBuffMult('hatch_mult') : 1;
      if (egg.hatchStartTime) {
        var elapsedSec = Math.floor((Date.now() - egg.hatchStartTime) / 1000);
        var newProgress = (egg.hatchBaseProgress || 0) + elapsedSec * hatchMult;
        if (newProgress >= egg.hatchTime) {
          // 离线期间已孵化完成
          egg.hatchProgress = egg.hatchTime;
          completeHatch(egg.id);
        } else {
          // 更新进度并重启定时器
          egg.hatchProgress = newProgress;
          startHatchTimer(egg.id);
        }
      } else {
        // 旧存档没有 hatchStartTime，以当前进度为基准重新开始计时
        egg.hatchStartTime = Date.now();
        egg.hatchBaseProgress = egg.hatchProgress || 0;
        startHatchTimer(egg.id);
      }
    }
  });
}

// 使用孵化加速器：消耗1个，减少30分钟（1800秒）孵化时间
function useHatchBoost(eggId) {
  var egg = G.eggs.find(e => e.id === eggId);
  if (!egg || !egg.isHatching) return;
  var boostItem = G.inventory.find(i => i.id === 'hatch_boost');
  if (!boostItem || boostItem.count <= 0) { showToast('没有孵化加速器！', 'error'); return; }
  boostItem.count--;
  if (boostItem.count <= 0) G.inventory = G.inventory.filter(i => i.id !== 'hatch_boost');
  var remaining = egg.hatchTime - egg.hatchProgress;
  if (remaining <= 1800) {
    // 少于30分钟，直接完成
    egg.hatchProgress = egg.hatchTime;
    completeHatch(eggId);
  } else {
    // 需求3：同步更新时间戳基准，确保后台计算一致
    egg.hatchBaseProgress = (egg.hatchBaseProgress || 0) + 1800;
    egg.hatchStartTime = Date.now();
    egg.hatchProgress = egg.hatchBaseProgress;
    showToast('⚡ 加速30分钟！剩余 ' + Math.ceil((egg.hatchTime - egg.hatchProgress) / 60) + ' 分钟', 'info');
    render();
  }
  saveGame();
}

// 需求7：使用孵化结晶 - 消耗1个孵化结晶，瞬间完成孵化
// 使用限制：仅可对孵化中宠物蛋使用
// 功能效果：瞬间清空孵化倒计时，直接生成成品宠物，保留原蛋全部随机资质、技能、血统
function useHatchCrystal(eggId) {
  var egg = G.eggs.find(function(e) { return e.id === eggId; });
  if (!egg) { showToast('未找到该宠物蛋', 'error'); return; }
  if (!egg.isHatching) { showToast('仅可对孵化中的宠物蛋使用孵化结晶', 'error'); return; }
  // 检查孵化结晶库存
  var crystal = G.inventory.find(function(i) { return i.id === 'hatch_crystal'; });
  if (!crystal || crystal.count <= 0) { showToast('没有孵化结晶！可在商城购买', 'error'); return; }
  // 消耗1个孵化结晶
  crystal.count--;
  if (crystal.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== 'hatch_crystal'; });
  // 瞬间完成孵化 - 直接设置进度为满，调用 completeHatch
  egg.hatchProgress = egg.hatchTime;
  showToast('🔮 孵化结晶生效！瞬间完成孵化！', 'success');
  saveGame();
  completeHatch(eggId);
}

function completeHatch(eggId) {
  const idx = G.eggs.findIndex(e => e.id === eggId);
  if (idx === -1) return;
  const egg = G.eggs.splice(idx, 1)[0];
  const pet = egg.petData;
  pet.level = G.player.level;
  G.pets.push(pet);
  G.statistics.totalHatches++;
  updateAchievement('hatch', 1);
  updateDailyTask('hatch_egg', 1);
  // 需求1：主线任务进度更新（孵化类）
  if (typeof updateMainQuest === 'function') updateMainQuest('hatch', 1);
  // v3.0 主线任务追踪：宠物获取（孵化）
  if (typeof _trackPetAcquire === 'function') _trackPetAcquire();
  // 宠物收藏家：统计唯一宠物种类数
  var uniqueNames = {};
  G.pets.forEach(function(p){ uniqueNames[p.name] = true; });
  setAchievement('pet_collect', Object.keys(uniqueNames).length);
  clearTimeout(hatchIntervals[eggId]);
  delete hatchIntervals[eggId];
  showToast(`🎉 孵化成功！获得 ${getPetDisplayName(pet)}（${RARITY_NAMES[RARITIES.indexOf(pet.rarity)]}）`, 'success');
  saveGame();
  render();
}

function appraiseEggUI(eggId, level) {
  const egg = G.eggs.find(e => e.id === eggId);
  if (!egg) return;
  if (appraiseEgg(egg, level)) {
    showToast('鉴定成功！', 'success');
    saveGame();
    render();
  } else {
    showToast('鉴定失败，材料不足或已鉴定', 'error');
  }
}

function discardEgg(eggId) {
  G.eggs = G.eggs.filter(e => e.id !== eggId);
  saveGame();
  render();
  showToast('蛋已丢弃', 'info');
}

function useMoonDew() {
if (G.pets.length === 0) { showToast('没有宠物！', 'error'); return; }
const dew = G.inventory.find(i => i.id === 'moon_dew');
if (!dew || dew.count <= 0) { showToast('没有月华露！', 'error'); return; }
showMoonDewModal(null);
}

// 神兽精华兑换：消耗99个神兽精华随机获得1只神兽
function useDivineEssenceExchange() {
var have = getDivineEssenceCount();
if (have < 99) {
showToast('神兽精华不足！需要 99 个，当前拥有 ' + have + ' 个', 'error');
return;
}
if (!confirm('确认消耗 99 个神兽精华随机兑换1只神兽？')) return;
var result = exchangeDivineEssence();
if (result && result.ok) {
if (typeof addActivityLog === 'function') {
addActivityLog('divine', '神兽精华兑换：消耗 99 个神兽精华，获得神兽 ' + result.pet.name, 'win');
}
render();
}
}

function showMoonDewModal(petId) {
  const dew = G.inventory.find(i => i.id === 'moon_dew');
  if (!dew || dew.count <= 0) { showToast('没有月华露！', 'error'); return; }
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'moon-dew-modal';
  overlay.innerHTML = `
    <div class="modal-content scrollbar-thin" style="max-width:480px;max-height:80vh;">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg text-gold">🌙 使用月华露</h2>
        <button class="text-secondary hover:text-white text-xl" onclick="closeMoonDewModal()">✕</button>
      </div>
      <p class="text-xs text-secondary mb-3">当前拥有：<span class="text-gold font-bold">${dew.count}</span> 个月华露</p>
      <div class="space-y-2 max-h-[50vh] overflow-y-auto">
        ${G.pets.map(p => {
          const used = p.moonDewUsed || 0;
          const capped = used >= 10 || p.growth >= 3.5;
          const reason = p.growth >= 3.5 ? '成长已满' : used >= 10 ? '已达上限' : '';
          return `
          <div class="bg-panel border border-game rounded-lg p-3 flex items-center justify-between ${capped ? 'opacity-40' : 'cursor-pointer hover:border-purple-500'}"
            ${!capped ? `onclick="applyMoonDew('${p.id}')"` : ''}>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm">${getRaceEmoji(p.race)}</span>
                <span class="font-bold text-sm" style="color:${RARITY_COLORS[RARITIES.indexOf(p.rarity)]}">${p.name}</span>
                <span class="text-xs text-secondary">Lv.${p.level}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-xs">
                <span class="text-gold">成长 ${p.growth.toFixed(2)}</span>
                <span class="text-secondary">月华露 ${used}/10</span>
              </div>
            </div>
            ${capped ? `<span class="text-xs text-red-400">${reason}</span>` : `<span class="text-xs text-green-400">可使用 →</span>`}
          </div>`;
        }).join('')}
      </div>
      <button class="btn-gold btn-sm mt-3 w-full" onclick="closeMoonDewModal()">关闭</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeMoonDewModal(); });
}

function applyMoonDew(petId) {
  const pet = G.pets.find(p => p.id === petId);
  if (!pet) return;
  const dew = G.inventory.find(i => i.id === 'moon_dew');
  if (!dew || dew.count <= 0) { showToast('没有月华露！', 'error'); return; }
  if ((pet.moonDewUsed || 0) >= 10) { showToast('该宠物月华露已达上限10次！', 'error'); return; }
  if (pet.growth >= 3.5) { showToast('该宠物成长已达上限3.5！', 'error'); return; }
  const oldGrowth = pet.growth;
  dew.count--;
  if (dew.count <= 0) G.inventory = G.inventory.filter(i => i.id !== 'moon_dew');
  const boost = randomFloat(0.02, 0.05);
  pet.growth = Math.min(3.5, Math.round((pet.growth + boost) * 100) / 100);
  pet.moonDewUsed = (pet.moonDewUsed || 0) + 1;
  // 成长变化后刷新品质
  var oldRarity = pet.rarity;
  pet.rarity = recalcRarity(pet);
  var rarityMsg = '';
  if (RARITIES.indexOf(pet.rarity) > RARITIES.indexOf(oldRarity)) {
    rarityMsg = '，品质提升为' + RARITY_NAMES[RARITIES.indexOf(pet.rarity)];
  }
  showToast(`🌙 ${getPetDisplayName(pet)} 成长 ${oldGrowth.toFixed(2)} → ${pet.growth.toFixed(2)} (+${boost.toFixed(2)})${rarityMsg}`, 'success');
  saveGame();
  closeMoonDewModal();
  showMoonDewModal(null);
}

function closeMoonDewModal() {
  const modal = document.getElementById('moon-dew-modal');
  if (modal) modal.remove();
}

// ==================== 宠物寿命系统 ====================

function showLifespanItemModal(itemId) {
  const itemDef = SHOP_ITEMS.find(i => i.id === itemId);
  if (!itemDef) return;
  const inv = G.inventory.find(i => i.id === itemId);
  if (!inv || inv.count <= 0) { showToast('道具不足！', 'error'); return; }
  const amounts = { lifespan_low: 500, lifespan_mid: 1000, lifespan_high: 2000 };
  const amount = amounts[itemId];
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'lifespan-item-modal';
  overlay.innerHTML = `
    <div class="modal-content scrollbar-thin" style="max-width:480px;max-height:80vh;">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg text-gold">${itemDef.icon} 使用${itemDef.name}</h2>
        <button class="text-secondary hover:text-white text-xl" onclick="closeLifespanItemModal()">✕</button>
      </div>
      <p class="text-xs text-secondary mb-3">当前拥有：<span class="text-gold font-bold">${inv.count}</span> 个${itemDef.name}</p>
      <p class="text-xs text-secondary mb-3">效果：为宠物增加 <span class="text-green-400 font-bold">+${amount}</span> 点寿命</p>
      <p class="text-xs text-red-400 mb-3">⚠️ 10%概率触发副作用：随机降低某项资质或成长</p>
      <div class="space-y-2 max-h-[50vh] overflow-y-auto">
        ${G.pets.map(p => {
          const isDivine = p.isDivineBeast || (p.lifespan !== undefined && p.lifespan >= 99999);
          const reason = isDivine ? '神兽寿命无限' : '可使用';
          const currentLifespan = p.lifespan || 10000;
          return `
          <div class="bg-panel border border-game rounded-lg p-3 flex items-center justify-between ${isDivine ? 'opacity-40' : 'cursor-pointer hover:border-purple-500'}"
            ${!isDivine ? `onclick="applyLifespanItem('${itemId}', '${p.id}')"` : ''}>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm">${getRaceEmoji(p.race)}</span>
                <span class="font-bold text-sm" style="color:${RARITY_COLORS[RARITIES.indexOf(p.rarity)]}">${p.name}</span>
                <span class="text-xs text-secondary">Lv.${p.level}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-xs">
                <span class="text-green-400">寿命 ${currentLifespan}</span>
              </div>
            </div>
            ${isDivine ? `<span class="text-xs text-red-400">${reason}</span>` : `<span class="text-xs text-green-400">可使用 →</span>`}
          </div>`;
        }).join('')}
      </div>
      <button class="btn-gold btn-sm mt-3 w-full" onclick="closeLifespanItemModal()">关闭</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeLifespanItemModal(); });
}

function applyLifespanItem(itemId, petId) {
  if (typeof useLifespanItem !== 'function') {
    showToast('功能未定义', 'error');
    return;
  }
  const result = useLifespanItem(itemId, petId);
  if (result.ok) {
    showToast(result.msg, 'success');
    if (result.sideEffect) showToast(result.sideEffect, 'warning');
    saveGame();
    render();
    closeLifespanItemModal();
    // 如果还有剩余道具，重新显示选择界面
    const inv = G.inventory.find(i => i.id === itemId);
    if (inv && inv.count > 0) showLifespanItemModal(itemId);
  } else {
    showToast(result.msg, 'error');
  }
}

function closeLifespanItemModal() {
  const modal = document.getElementById('lifespan-item-modal');
  if (modal) modal.remove();
}

// v2.9.0 需求2.3：宠物洗点丹使用界面 —— 选择目标宠物 + 二次确认
function showPetResetPillModal() {
  const inv = G.inventory.find(i => i.id === 'pet_reset_pill');
  if (!inv || inv.count <= 0) { showToast('道具不足！', 'error'); return; }
  if (G.pets.length === 0) { showToast('暂无宠物可用', 'error'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'pet-reset-pill-modal';
  overlay.innerHTML = `
    <div class="modal-content scrollbar-thin" style="max-width:480px;max-height:80vh;">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg text-gold">🧪 使用宠物洗点丹</h2>
        <button class="text-secondary hover:text-white text-xl" onclick="closePetResetPillModal()">✕</button>
      </div>
      <p class="text-xs text-secondary mb-3">当前拥有：<span class="text-gold font-bold">${inv.count}</span> 个宠物洗点丹</p>
      <p class="text-xs text-secondary mb-2">效果：重置指定宠物的全部<span class="text-yellow-400">自由属性点</span>，全额返还为未分配状态。</p>
      <p class="text-xs text-red-400 mb-3">⚠️ 仅重置自由分配点数，不影响等级/成长/资质/技能/血统/符文等</p>
      <div class="space-y-2 max-h-[50vh] overflow-y-auto">
        ${G.pets.map(p => {
          var attrPts = (typeof getPetAttrPoints === 'function') ? getPetAttrPoints(p) : (p.attrPoints || {});
          var allocated = 0;
          ATTRIBUTES.forEach(function(a) { allocated += (attrPts[a] || 0); });
          var fixedPt = (p.level || 1) * 5; // 5维×lv为固定点
          var freeAllocated = Math.max(0, allocated - fixedPt);
          return `
          <div class="bg-panel border border-game rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-purple-500" onclick="applyPetResetPill('${p.id}')">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm">${getRaceEmoji(p.race)}</span>
                <span class="font-bold text-sm" style="color:${RARITY_COLORS[RARITIES.indexOf(p.rarity)]}">${getPetDisplayName(p)}</span>
                <span class="text-xs text-secondary">Lv.${p.level}</span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-xs">
                <span class="text-green-400">已分配自由点 ${freeAllocated}</span>
                <span class="text-cyan-400">剩余 ${(p.freeAttrPoints || 0)}</span>
              </div>
            </div>
            <span class="text-xs text-green-400">洗点 →</span>
          </div>`;
        }).join('')}
      </div>
      <button class="btn-gold btn-sm mt-3 w-full" onclick="closePetResetPillModal()">关闭</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closePetResetPillModal(); });
}

function applyPetResetPill(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  // 二次确认
  if (!confirm('确认为「' + getPetDisplayName(pet) + '」洗点？\n该操作将重置全部自由属性点，全额返还为未分配状态。')) {
    return;
  }
  var result = resetPetAttrPoints(petId);
  if (result.ok) {
    showToast('🧪 洗点成功！返还 ' + result.refunded + ' 点自由属性点', 'success');
    saveGame();
    render();
    closePetResetPillModal();
    // 如果还有剩余道具，重新显示选择界面
    var inv = G.inventory.find(function(i) { return i.id === 'pet_reset_pill'; });
    if (inv && inv.count > 0) showPetResetPillModal();
  } else {
    showToast(result.msg, 'error');
  }
}

function closePetResetPillModal() {
  var modal = document.getElementById('pet-reset-pill-modal');
  if (modal) modal.remove();
}

// ==================== 战斗结算Modal ====================

// 需求1：战斗结算自动关闭与新旧覆盖机制
// 2秒倒计时自动关闭；新结算触发时强制销毁旧结算面板
var _battleSettlementTimer = null;
function showBattleSettlementModal(rewards, map) {
  if (!rewards) rewards = { gold: 0, exp: 0, items: [] };
  if (!map) map = MAPS.find(m => m.id === G.player.currentMap);
  // 新结算触发时，强制销毁上一个结算面板并清除旧倒计时
  var existing = document.getElementById('battle-settlement-modal');
  if (existing) existing.remove();
  if (_battleSettlementTimer) { clearTimeout(_battleSettlementTimer); _battleSettlementTimer = null; }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'battle-settlement-modal';
  overlay.innerHTML = `
    <div class="modal-content scrollbar-thin" style="max-width:520px;max-height:85vh;">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-xl text-gold">🏆 战斗胜利结算</h2>
        <button class="text-secondary hover:text-white text-xl" onclick="closeBattleSettlementModal()">✕</button>
      </div>
      ${map ? `<p class="text-center text-lg mb-4" style="color:${RARITY_COLORS[RARITIES.indexOf(map.rarity)]}">${map.name} · 通关！</p>` : ''}

      <div class="bg-panel border border-game rounded-lg p-4 mb-4">
        <h3 class="font-bold text-sm text-secondary mb-3">本次奖励</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm">⭐ 经验</span>
            <span class="text-sm text-yellow-400 font-bold">+${rewards.exp.toLocaleString()}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm">🪙 金币</span>
            <span class="text-sm text-yellow-400 font-bold">+${rewards.gold.toLocaleString()}</span>
          </div>
          ${rewards.items && rewards.items.length > 0 ? `
          <div class="mt-3 pt-3 border-t border-game">
            <span class="text-sm text-secondary mb-2 block">掉落道具</span>
            <div class="flex flex-wrap gap-2">
              ${rewards.items.map(it => `
                <span class="bg-purple-900 bg-opacity-30 text-purple-300 px-2 py-1 rounded text-xs">${it.icon} ${it.name} ×${it.count}</span>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="bg-panel border border-game rounded-lg p-4 mb-4">
        <h3 class="font-bold text-sm text-secondary mb-2">当前状态</h3>
        <div class="space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-secondary">经验</span>
            <span>${G.player.exp.toLocaleString()}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-secondary">金币</span>
            <span class="text-yellow-400">${G.player.gold.toLocaleString()}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-secondary">钻石</span>
            <span class="text-purple-400">${G.player.diamond.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="text-center text-xs text-secondary mb-2" id="settlement-countdown">⏱️ 2秒后自动关闭</div>
      <button class="btn-gold btn-sm mt-1 w-full" onclick="closeBattleSettlementModal()">确定</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBattleSettlementModal(); });
  // 启动2秒自动关闭倒计时
  _battleSettlementTimer = setTimeout(function() {
    closeBattleSettlementModal();
  }, 2000);
}

function closeBattleSettlementModal() {
  if (_battleSettlementTimer) { clearTimeout(_battleSettlementTimer); _battleSettlementTimer = null; }
  const modal = document.getElementById('battle-settlement-modal');
  if (modal) modal.remove();
}

// v2.8.0 需求3.1：副本结算弹窗（展示暴击标识与奖励明细）
function showDungeonSettlementModal(rewardInfo, rewardText) {
  if (!rewardInfo) rewardInfo = { dropMult: 1 };
  // 新结算触发时，强制销毁上一个结算面板并清除旧倒计时
  var existing = document.getElementById('battle-settlement-modal');
  if (existing) existing.remove();
  if (_battleSettlementTimer) { clearTimeout(_battleSettlementTimer); _battleSettlementTimer = null; }

  var critBanner = '';
  if (rewardInfo.dropMult > 1) {
    critBanner = '<div class="bg-gradient-to-r from-yellow-600 to-orange-600 border border-yellow-400 rounded-lg p-3 mb-4 text-center">' +
      '<span class="text-2xl font-bold text-white">✨ 奖励暴击 ×' + rewardInfo.dropMult + '！</span>' +
      '</div>';
  }
  var dungeonName = rewardInfo.dungeonName || '副本';
  // v2.8.0 评审修复（一般问题5）：结构化奖励明细展示
  var rewardDetailHtml = '';
  if (rewardInfo.gold > 0) {
    rewardDetailHtml += '<div class="flex items-center gap-2"><span class="text-yellow-400">💰 金币</span><span class="font-bold text-yellow-300">+' + rewardInfo.gold.toLocaleString() + '</span></div>';
  }
  if (rewardInfo.exp > 0) {
    rewardDetailHtml += '<div class="flex items-center gap-2"><span class="text-blue-400">✨ 经验</span><span class="font-bold text-blue-300">+' + rewardInfo.exp.toLocaleString() + '</span></div>';
  }
  if (rewardInfo.items && rewardInfo.items.length > 0) {
    rewardInfo.items.forEach(function(item) {
      rewardDetailHtml += '<div class="flex items-center gap-2"><span class="text-green-400">📦 ' + item.name + '</span><span class="font-bold text-green-300">×' + item.count + '</span></div>';
    });
  }
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'battle-settlement-modal';
  overlay.innerHTML =
    '<div class="modal-content scrollbar-thin" style="max-width:520px;max-height:85vh;">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<h2 class="font-bold text-xl text-gold">🏰 ' + dungeonName + ' 通关</h2>' +
        '<button class="text-secondary hover:text-white text-xl" onclick="closeBattleSettlementModal()">✕</button>' +
      '</div>' +
      critBanner +
      '<div class="bg-panel border border-game rounded-lg p-4 mb-4">' +
        '<h3 class="font-bold text-sm text-secondary mb-3">本次奖励</h3>' +
        '<div class="space-y-2">' +
          (rewardDetailHtml || ('<p class="text-sm text-yellow-400">' + (rewardText || '已完成副本挑战') + '</p>')) +
        '</div>' +
      '</div>' +
      '<div class="text-center text-xs text-secondary mb-2" id="settlement-countdown">⏱️ 2秒后自动关闭</div>' +
      '<button class="btn-gold btn-sm mt-1 w-full" onclick="closeBattleSettlementModal()">确定</button>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeBattleSettlementModal(); });
  _battleSettlementTimer = setTimeout(function() {
    closeBattleSettlementModal();
  }, 2000);
}

function equipItem(bagIdx) {
  const item = G.equipmentBag[bagIdx];
  if (!item) return;
  if (G.player.level < item.level) { showToast(`需要等级 ${item.level} 才能穿戴！`, 'error'); return; }
  const old = G.player.equipment[item.slot];
  // 需求1：装备被替换时，旧装备的宝石一起卸下到宝石背包
  if (old && Array.isArray(old.gemSlots)) {
    var removedGems = [];
    for (var i = 0; i < old.gemSlots.length; i++) {
      var slot = old.gemSlots[i];
      if (slot && slot.gem) {
        if (typeof addGemToBag === 'function') {
          addGemToBag(slot.gem.type, slot.gem.level, 1);
        }
        removedGems.push(slot.gem);
        slot.gem = null;
      }
    }
    if (removedGems.length > 0) {
      showToast('已卸下 ' + removedGems.length + ' 颗宝石到宝石背包', 'info');
    }
  }
  G.player.equipment[item.slot] = item;
  G.equipmentBag.splice(bagIdx, 1);
  if (old) G.equipmentBag.push(old);
  showToast(`穿戴了 ${item.name}！`, 'success');
  saveGame();
  // v3.0 主线任务追踪：装备穿戴
  if (typeof _trackEquipWeapon === 'function') _trackEquipWeapon();
  render();
}

function unequipItem(slotId) {
  const item = G.player.equipment[slotId];
  if (!item) return;
  // 需求1：装备卸下时，宝石一起卸下到宝石背包
  if (Array.isArray(item.gemSlots)) {
    var removedGems = [];
    for (var i = 0; i < item.gemSlots.length; i++) {
      var slot = item.gemSlots[i];
      if (slot && slot.gem) {
        if (typeof addGemToBag === 'function') {
          addGemToBag(slot.gem.type, slot.gem.level, 1);
        }
        removedGems.push(slot.gem);
        slot.gem = null;
      }
    }
    if (removedGems.length > 0) {
      showToast('已卸下 ' + removedGems.length + ' 颗宝石到宝石背包', 'info');
    }
  }
  G.equipmentBag.push(item);
  G.player.equipment[slotId] = null;
  showToast(`卸下了 ${item.name}`, 'info');
  saveGame();
  render();
}

// 需求：取消装备直接出售功能，sellEquip 重定向到分解
function sellEquip(bagIdx) {
  const item = G.equipmentBag[bagIdx];
  if (!item) return;
  decomposeEquipById(item.id);
}

function equipItemById(itemId) {
  const idx = G.equipmentBag.findIndex(e => e.id === itemId);
  if (idx === -1) return;
  equipItem(idx);
}

// 需求：取消装备直接出售功能，sellEquipById 重定向到分解
function sellEquipById(id) {
  decomposeEquipById(id);
}

// ==================== FORGE SYSTEM ====================

// 装备强化等级上限：基础12 + 转生加成
// 第一次转生 +1，之后每多转生5次再 +1
function getMaxForgeLevel() {
  var r = (G && G.player && G.player.rebirth) || 0;
  var bonus = r >= 1 ? 1 + Math.floor((r - 1) / 5) : 0;
  return 12 + bonus;
}

function getForgeSuccessRate(lv) {
  if (lv < 6) return 1.0;
  if (lv === 6) return 0.80;
  if (lv === 7) return 0.70;
  if (lv === 8) return 0.60;
  if (lv === 9) return 0.40;
  if (lv === 10) return 0.30;
  if (lv === 11) return 0.20;
  // 转生后突破上限的等级：成功率持续递减
  if (lv === 12) return 0.15;
  if (lv === 13) return 0.10;
  if (lv === 14) return 0.06;
  if (lv === 15) return 0.03;
  return 0;
}

function getForgeStoneNeeded(lv) {
  if (lv < 6) return 'forge_stone_low';
  if (lv < 9) return 'forge_stone_mid';
  return 'forge_stone_high';
}

function getForgeStoneName(lv) {
  if (lv < 6) return '低级强化石';
  if (lv < 9) return '中级强化石';
  return '高级强化石';
}

function getForgeFailPenalty(lv) {
  if (lv < 6) return 0;
  if (lv < 9) return -1;
  return 'reset';
}

function renderForgeScreen() {
  const forge = G.player.forgeLevels || {};
  const eq = G.player.equipment;
  const totalForgeLv = Object.values(forge).reduce((s, v) => s + v, 0);
  var protInv = G.inventory.find(function(i){return i.id==='protection_stone';});
  var protCount = protInv ? protInv.count : 0;
  var useProtChecked = window._forgeUseProt ? 'checked' : '';
  var autoForgeRunning = autoForgeInterval ? true : false;
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🔨 锻造强化</h1>
      <span class="text-sm text-secondary">总强化等级 +${totalForgeLv}</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">⚒️ 装备强化</h2>
          <label class="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" id="forgeUseProt" ${useProtChecked} class="w-4 h-4 accent-purple-500" onclick="window._forgeUseProt=this.checked">
            <span class="text-secondary">使用保底石 (🛡️${protCount})</span>
          </label>
        </div>
        <p class="text-xs text-secondary mb-3">强化针对装备位置，更换装备不影响强化等级。每级强化提升该位置装备属性 10%。勾选保底石后强化失败不降级。</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${EQUIPMENT_SLOTS.map(slot => {
            const fLv = forge[slot.id] || 0;
            const item = eq[slot.id];
            const maxLv = getMaxForgeLevel();
            const isMax = fLv >= maxLv;
            const nextRate = isMax ? 0 : getForgeSuccessRate(fLv);
            const stoneNeeded = isMax ? '' : getForgeStoneName(fLv);
            const penalty = isMax ? '' : getForgeFailPenalty(fLv);
            return `
            <div class="bg-panel border border-game rounded-xl p-4 text-center">
              <div class="text-3xl mb-2">${slot.icon}</div>
              <p class="font-bold text-sm mb-1">${slot.name}</p>
              <p class="text-2xl font-bold ${fLv >= 10 ? 'text-orange-400' : fLv >= 7 ? 'text-purple-400' : fLv >= 4 ? 'text-blue-400' : 'text-secondary'}">+${fLv}</p>
              ${item ? `<p class="text-xs text-secondary mt-1">${item.name}</p>` : '<p class="text-xs text-secondary mt-1">未装备</p>'}
              ${!isMax ? `
                <div class="mt-2 text-xs">
                  <p class="text-green-400">→ +${fLv+1} 成功率 ${Math.floor(nextRate*100)}%</p>
                  <p class="text-secondary">需要：${stoneNeeded}</p>
                  ${penalty ? `<p class="text-red-400">失败：${penalty === 'reset' ? '等级清零' : '等级-1'}</p>` : ''}
                </div>
              ` : '<p class="text-xs text-gold mt-2">✨ 已满级</p>'}
              <button class="btn-gold btn-sm mt-2 w-full" ${isMax ? 'disabled style="opacity:0.5"' : ''} onclick="doForge('${slot.id}', window._forgeUseProt)">
                ${isMax ? '已满级' : '🔨 强化'}
              </button>
              ${!isMax ? `
              <div class="mt-2 flex gap-1">
                <input type="number" id="autoForgeTarget_${slot.id}" min="${fLv+1}" max="${maxLv}" value="${Math.min(fLv+3,maxLv)}" class="w-12 text-xs text-center bg-panel border border-game rounded px-1" placeholder="目标">
                <button class="btn-primary btn-sm flex-1 text-xs" ${autoForgeRunning ? 'disabled style="opacity:0.4"' : ''} onclick="var t=parseInt(document.getElementById('autoForgeTarget_${slot.id}').value)||${maxLv};startAutoForge('${slot.id}',t)">🤖 自动强化</button>
              </div>
              ` : ''}
            </div>`;
          }).join('')}
        </div>
        ${autoForgeRunning ? '<div class="mt-3 text-center"><button class="btn-danger btn-sm" onclick="stopAutoForge();render();">⏹️ 停止自动强化</button></div>' : ''}
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">📦 强化石库存</h2>
        <div class="grid grid-cols-4 gap-3 text-center">
          ${['forge_stone_low','forge_stone_mid','forge_stone_high','protection_stone'].map((sid, i) => {
            const inv = G.inventory.find(it => it.id === sid);
            const count = inv ? inv.count : 0;
            const names = ['低级强化石','中级强化石','高级强化石','保底石'];
            const icons = ['🔩','⚙️','💠','🛡️'];
            const colors = ['text-gray-300','text-blue-400','text-purple-400','text-yellow-400'];
            return `<div class="bg-panel rounded-lg p-3">
              <div class="text-2xl">${icons[i]}</div>
              <p class="text-xs ${colors[i]} font-bold">${names[i]}</p>
              <p class="text-gold text-lg">x${count}</p>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">📋 强化规则</h2>
        <div class="text-xs text-secondary space-y-1">
          <p>· 每级强化提升该位置装备 <span class="text-green-400">全部属性 10%</span>（含基础属性和词条）</p>
          <p>· +1 ~ +6：<span class="text-green-400">100% 成功</span>，消耗低级强化石</p>
          <p>· +7 ~ +9：消耗中级强化石，失败等级-1</p>
          <p>· +10 ~ +12：消耗高级强化石，<span class="text-red-400">失败等级清零</span></p>
          <p>· <span class="text-yellow-400">+12 以上</span>：转生突破上限，成功率持续递减（+12 15%, +13 10%, +14 6%, +15 3%）</p>
          <p>· <span class="text-gold">当前强化上限：+${getMaxForgeLevel()}</span>（基础+12，转生${G.player.rebirth}次加成+${getMaxForgeLevel() - 12}）</p>
          <p>· <span class="text-yellow-400">保底石</span>：强化时消耗1个，失败时等级不变</p>
          <p>· <span class="text-purple-400">自动强化</span>：设置目标等级，自动强化至目标/手动关闭/强化石不足</p>
          <p>· 强化针对装备位置，<span class="text-yellow-400">更换装备不影响强化等级</span></p>
        </div>
      </div>
    </main>
  </div>`;
}

function doForge(slotId, useProtection, isAuto) {
  var forge = G.player.forgeLevels || {};
  if (!forge[slotId] && forge[slotId] !== 0) forge[slotId] = 0;
  var currentLv = forge[slotId];
  var maxLv = getMaxForgeLevel();
  if (currentLv >= maxLv) { if (!isAuto) showToast('已达到最高强化等级！', 'info'); return false; }
  var stoneId = getForgeStoneNeeded(currentLv);
  var inv = G.inventory.find(function(i) { return i.id === stoneId; });
  if (!inv || inv.count <= 0) {
    if (!isAuto) showToast(getForgeStoneName(currentLv) + '不足！', 'error');
    return false;
  }
  // 检查保底石
  var protInv = G.inventory.find(function(i) { return i.id === 'protection_stone'; });
  var hasProtection = useProtection && protInv && protInv.count > 0;
  if (useProtection && !hasProtection) {
    if (!isAuto) showToast('保底石不足！', 'error');
    return false;
  }
  // 消耗强化石
  inv.count--;
  if (inv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== stoneId; });
  // 消耗保底石
  if (hasProtection) {
    protInv.count--;
    if (protInv.count <= 0) G.inventory = G.inventory.filter(function(i) { return i.id !== 'protection_stone'; });
  }
  var rate = getForgeSuccessRate(currentLv);
  var success = Math.random() < rate;
  var slotName = EQUIPMENT_SLOTS.find(function(s) { return s.id === slotId; }).name;
  if (success) {
    forge[slotId] = currentLv + 1;
    G.player.forgeLevels = forge;
    saveGame();
    if (!isAuto) render();
    if (!isAuto) showToast('🔨 ' + slotName + ' 强化成功！+' + currentLv + ' → +' + (currentLv + 1), 'success');
    updateAchievement('forge', 1);
    updateDailyTask('forge_1', 1);
    return true;
  } else {
    var penalty = getForgeFailPenalty(currentLv);
    if (hasProtection) {
      // 保底石：失败不降级
      G.player.forgeLevels = forge;
      saveGame();
      if (!isAuto) render();
      if (!isAuto) showToast('🛡️ 保底石生效！' + slotName + ' 强化失败但等级不变 (+' + currentLv + ')', 'info');
      updateAchievement('forge', 1);
      return false;
    }
    if (penalty === 'reset') {
      forge[slotId] = 0;
      G.player.forgeLevels = forge;
      saveGame();
      if (!isAuto) render();
      if (!isAuto) showToast('💔 强化失败！' + slotName + ' 等级清零...', 'error');
      updateAchievement('forge', 1);
      return false;
    } else {
      forge[slotId] = Math.max(0, currentLv + penalty);
      G.player.forgeLevels = forge;
      saveGame();
      if (!isAuto) render();
      if (!isAuto) showToast('💔 强化失败！' + slotName + ' +' + currentLv + ' → +' + forge[slotId], 'error');
      updateAchievement('forge', 1);
      return false;
    }
  }
}

// 自动强化：设置目标等级，自动强化直到达到目标、手动关闭或强化石不足
var autoForgeInterval = null;

function startAutoForge(slotId, targetLv) {
  if (autoForgeInterval) { showToast('自动强化已在运行中！', 'error'); return; }
  var forge = G.player.forgeLevels || {};
  var currentLv = forge[slotId] || 0;
  if (currentLv >= targetLv) { showToast('已达到目标等级！', 'info'); return; }
  var useProt = document.getElementById('autoForgeProtection') && document.getElementById('autoForgeProtection').checked;
  showToast('开始自动强化 ' + EQUIPMENT_SLOTS.find(function(s){return s.id===slotId;}).name + ' 至 +' + targetLv + (useProt ? '（使用保底石）' : ''), 'info');
  var count = 0;
  autoForgeInterval = setInterval(function() {
    var f = G.player.forgeLevels || {};
    var lv = f[slotId] || 0;
    if (lv >= targetLv) {
      stopAutoForge();
      showToast('自动强化完成！达到 +' + lv + '，共强化 ' + count + ' 次', 'success');
      saveGame(); render();
      return;
    }
    // 检查保底石是否可用
    var canUseProt = useProt && (G.inventory.find(function(i){return i.id==='protection_stone';}) || {}).count > 0;
    var result = doForge(slotId, canUseProt, true);
    count++;
    if (result === false && count > 200) {
      // 安全阀
      stopAutoForge();
      showToast('自动强化已停止（达到最大次数）', 'info');
      saveGame(); render();
      return;
    }
    // 检查强化石是否耗尽
    var stoneId = getForgeStoneNeeded(lv);
    var stoneInv = G.inventory.find(function(i){return i.id===stoneId;});
    if (!stoneInv || stoneInv.count <= 0) {
      stopAutoForge();
      showToast('自动强化已停止：强化石不足！共强化 ' + count + ' 次，当前 +' + (G.player.forgeLevels[slotId]||0), 'info');
      saveGame(); render();
      return;
    }
    // 如果设置了用保底石但没有了，继续不用保底石
    saveGame();
    render();
  }, 500);
}

function stopAutoForge() {
  if (autoForgeInterval) { clearInterval(autoForgeInterval); autoForgeInterval = null; }
}

function showEquipBag(slotId) {
  const valid = G.equipmentBag.filter(e => e.slot === slotId);
  if (valid.length === 0) { showToast('背包中没有该部位的装备！', 'info'); return; }
  const slotInfo = EQUIPMENT_SLOTS.find(s => s.id === slotId);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'equip-bag-modal';
  overlay.innerHTML = `
    <div class="modal-content scrollbar-thin" style="max-width:480px;max-height:80vh;">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-lg text-gold">${slotInfo ? slotInfo.icon : ''} 选择${slotInfo ? slotInfo.name : '装备'}</h2>
        <button class="text-secondary hover:text-white text-xl" onclick="closeEquipBagModal()">✕</button>
      </div>
      <div class="space-y-2 max-h-[50vh] overflow-y-auto">
        ${valid.map(item => {
          const rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
          return `
          <div class="bg-panel border border-game rounded-lg p-3 cursor-pointer hover:border-purple-500" onclick="equipItemById('${item.id}');closeEquipBagModal()">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold" style="color:${EQUIP_RARITY_COLORS[rarityIdx]}">${item.name}</span>
              <span class="text-xs text-secondary">Lv.${item.level} ${EQUIP_RARITY_NAMES[rarityIdx]}</span>
            </div>
            <div class="text-xs text-secondary">
              ${getEquipBaseStatText(item)}
              ${(item.affixes || []).map(a => `<span class="${a.special ? 'text-orange-400' : 'text-green-400'} ml-1">${typeof a.format === 'function' ? a.format(a.value) : ('+' + a.value)}</span>`).join('')}
              ${item.special ? (function(){ var sp = EQUIP_SPECIALS.find(s=>s.id===item.special); return sp ? '<span class="ml-1 font-bold" style="color:'+sp.color+'">★'+sp.name+'</span>' : ''; })() : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
      <button class="btn-gold btn-sm mt-3 w-full" onclick="closeEquipBagModal()">关闭</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeEquipBagModal(); });
}

function closeEquipBagModal() {
  const modal = document.getElementById('equip-bag-modal');
  if (modal) modal.remove();
}

// 任务14：宠物秘境已整合到特殊副本系统，通过 enterSpecialDungeon('pet_equip_cave') 进入
// 旧的 enterPetEquipDungeon 已移除，petEquipDungeonUsed 字段已在 checkDailyReset 中清理
// 需求12：宠物秘境已从 DUNGEONS 移到活动页面，但仍复用 enterSpecialDungeon 进入战斗
// 由于 pet_equip_cave 不再在 DUNGEONS 中，这里使用一个兜底配置保证函数仍可工作
const PET_EQUIP_CAVE_FALLBACK = { id: 'pet_equip_cave', name: '宠物秘境', type: 'special', minLv: 40, desc: '挑战神秘秘境，获取宠物装备', ticketItem: 'pet_ticket' }; // v2.10.0 需求2.1：minLv 20→40

function enterSpecialDungeon(dungeonId) {
  let dungeon = DUNGEONS.find(d => d.id === dungeonId);
  // 需求12：pet_equip_cave 已从 DUNGEONS 移除，但活动页面仍通过此函数进入
  if (!dungeon && dungeonId === 'pet_equip_cave') {
    dungeon = PET_EQUIP_CAVE_FALLBACK;
  }
  if (!dungeon) return;
  if (G.player.level < dungeon.minLv) { showToast('等级不足！', 'error'); return; }
  // 修复：在扣门票前检查队伍，避免无队伍时仍扣门票和记录次数导致卡住
  const team = getTeamPets();
  if (team.length === 0) { showToast('请先设置出战宠物！', 'error'); return; }
  // 需求12：pet_equip_cave 由活动页面管理次数和门票（无需门票，每日20次由 petCaveUsed 管理）
  // 其他副本仍需门票和每日次数限制
  let ticket = null;
  const isPetCaveDungeon = dungeonId === 'pet_equip_cave';
  if (!isPetCaveDungeon) {
    ticket = G.inventory.find(i => i.id === dungeon.ticketItem);
    if (!ticket || ticket.count <= 0) { showToast('缺少门票！', 'error'); return; }
    const dailyKey = 'dungeon_' + dungeonId;
    const dailyUsed = G.dungeonDailyUsed[dailyKey] || 0;
    const dailyLimit = getDungeonDailyLimit(dungeonId);
    if (dailyUsed >= dailyLimit) { showToast('今日该副本次数已用完（每日' + dailyLimit + '次）', 'error'); return; }
    ticket.count--;
    if (ticket.count <= 0) G.inventory = G.inventory.filter(i => i.id !== dungeon.ticketItem);
    G.dungeonDailyUsed[dailyKey] = dailyUsed + 1;
  }
  saveGame();
  stopLiveBattle();
  // 任务14：liveBattle 结构与 spawnMonster 完全一致（补全 petMp 与 petBuffs 全部字段，避免战斗卡住）
  const petHp = {};
  const petMp = {};
  const petBuffs = {};
  const petStatus = {};
  const skillCooldowns = {};
  team.forEach(p => {
    const stats = getPetStats(p);
    petHp[p.id] = { current: stats.气血, max: stats.气血 };
    petMp[p.id] = { current: stats.魔法值, max: stats.魔法值 };
    petBuffs[p.id] = { atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0 };
    petStatus[p.id] = { frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, burning: 0, burnPct: 0 };
    skillCooldowns[p.id] = {};
  });
  const map = MAPS.find(m => m.id === G.player.currentMap);
  const lv = map ? randomInt(map.minLv, map.maxLv) : G.player.level;
  // 同步主地图：连续成长曲线 + 提升后的基础属性 + 副本难度强化（小怪×5）
  var lvScale = 1 + lv * 0.012;
  const baseHp = Math.floor((40 + lv * 20) * 5 * lvScale);
  const baseAtk = Math.floor((4 + lv * 3.8) * 5 * lvScale * 0.8); // 需求14：活动怪物伤害下调20%
  // 任务14：宠物秘境固定5波，怪物名为"秘境守卫"；其他副本随机3~5波
  var isPetCave = dungeonId === 'pet_equip_cave';
  var monsterName = isPetCave ? '秘境守卫' : pickRandom(map ? map.monsters : ['怪物']);
  var maxWaves = isPetCave ? 5 : randomInt(3, 5);
  var dungeonMonster = { name: monsterName, level: lv, enemyType: 'mob', hp: baseHp, maxHp: baseHp, atk: baseAtk, def: Math.floor(lv * 2.0 * 1.2 * 1.5) };
  if (!dungeonMonster.speed) dungeonMonster.speed = Math.floor((dungeonMonster.level || 1) * 2 + 10);
  liveBattle = {
    monsters: [dungeonMonster],
    monsterHpArray: [dungeonMonster.hp],
    monsterMaxHpArray: [dungeonMonster.maxHp || dungeonMonster.hp],
    monsterStatusArray: [{ frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, poisonStacks: 0, burning: 0, burnPct: 0, defReduced: 0, defReduceTurns: 0 }],
    monsterBuffsArray: [{ atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0 }],
    team, petHp, petMp, petBuffs, petStatus, skillCooldowns,
    currentPetIdx: 0, round: 0, phase: 'player_turn', animating: false, totalDamage: 0, logs: [], droppedChests: [],
    isDungeon: true, dungeonId, dungeonWave: 0, dungeonMaxWaves: maxWaves,
  };
  addBattleLog('info', `🏰 进入${dungeon.name}！共${liveBattle.dungeonMaxWaves}波怪物`);
  if (!autoBattleInterval) { autoBattleInterval = setInterval(() => {}, 999999); }
  navigateTo('main');
  buildTurnQueue();
  scheduleNextTurn();
  showToast(`进入${dungeon.name}！`, 'info');
}

function enterTeamDungeon(dungeonId) {
  const dungeon = TEAM_DUNGEONS.find(d => d.id === dungeonId);
  if (!dungeon) return;
  if (G.teamDungeonUsed[dungeonId]) { showToast('今日已完成该团本！', 'error'); return; }
  const team = getTeamPets();
  if (team.length === 0) { showToast('请先设置出战宠物！', 'error'); return; }
  G.teamDungeonUsed[dungeonId] = true;
  saveGame();
  stopLiveBattle();
  const petHp = {};
  const petMp = {};
  const petBuffs = {};
  const petStatus = {};
  const skillCooldowns = {};
  team.forEach(p => {
    const stats = getPetStats(p);
    petHp[p.id] = { current: stats.气血, max: stats.气血 };
    petMp[p.id] = { current: stats.魔法值, max: stats.魔法值 };
    petBuffs[p.id] = { atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0 };
    petStatus[p.id] = { frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, burning: 0, burnPct: 0 };
    skillCooldowns[p.id] = {};
  });
  const lv = G.player.level;
  // 同步主地图：连续成长曲线 + 提升后的基础属性 + 团本难度强化（精英×4）
  var lvScale = 1 + lv * 0.012;
  const bossHp = Math.floor((40 + lv * 20) * 3 * 4 * lvScale);
  const bossAtk = Math.floor((4 + lv * 3.8) * 2 * 4 * lvScale * 0.8); // 需求14：活动怪物伤害下调20%
  var teamBoss = { name: dungeon.bosses[0], level: lv, enemyType: 'elite', hp: bossHp, maxHp: bossHp, atk: bossAtk, def: Math.floor(lv * 2.0 * 1.6 * 1.5) };
  if (!teamBoss.speed) teamBoss.speed = Math.floor((teamBoss.level || 1) * 2 + 10);
  liveBattle = {
    monsters: [teamBoss],
    monsterHpArray: [teamBoss.hp],
    monsterMaxHpArray: [teamBoss.maxHp || teamBoss.hp],
    monsterStatusArray: [{ frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, poisonStacks: 0, burning: 0, burnPct: 0, defReduced: 0, defReduceTurns: 0 }],
    monsterBuffsArray: [{ atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0 }],
    team, petHp, petMp, petBuffs, petStatus, skillCooldowns,
    currentPetIdx: 0, round: 0, phase: 'player_turn', animating: false, totalDamage: 0, logs: [], droppedChests: [],
    isDungeon: true, dungeonId: 'team_' + dungeonId, dungeonWave: 0, dungeonMaxWaves: 3,
    teamDungeonData: dungeon,
  };
  addBattleLog('info', `👥 进入${dungeon.name}！第1个BOSS：${dungeon.bosses[0]}`);
  if (!autoBattleInterval) { autoBattleInterval = setInterval(() => {}, 999999); }
  navigateTo('main');
  buildTurnQueue();
  scheduleNextTurn();
  showToast(`进入${dungeon.name}！`, 'info');
}

function processTeamDungeonWave() {
  if (!liveBattle || !liveBattle.teamDungeonData) return;
  const dungeon = liveBattle.teamDungeonData;
  // v2.8.0 需求3.1：团本也触发副本奖励暴击机制
  var dropMult = (typeof rollDungeonDropMultiplier === 'function') ? rollDungeonDropMultiplier() : 1;
  var multTag = dropMult > 1 ? ` ✨×${dropMult}倍率！` : '';
  if (dropMult > 1) {
    addBattleLog('loot', `✨ 触发副本倍率掉落 ×${dropMult}！`);
  }
  var droppedItems = [];
  for (var di = 0; di < dropMult; di++) {
    const rewardItem = pickRandom(dungeon.rewards);
    const existing = G.inventory.find(it => it.id === rewardItem);
    if (existing) existing.count++;
    else G.inventory.push({ id: rewardItem, count: 1 });
    var itemName = (typeof getItemName === 'function') ? getItemName(rewardItem) : rewardItem;
    if (droppedItems.indexOf(itemName) === -1) droppedItems.push(itemName);
  }
  addBattleLog('loot', `📦 获得 ${droppedItems.join('、')}${dropMult > 1 ? ' ×' + dropMult : ''}${multTag}`);
  liveBattle.dungeonWave++;
  if (liveBattle.dungeonWave >= 3) {
    addBattleLog('info', `🎉 团本${dungeon.name}通关！${multTag}`);
    saveGame();
    liveBattle = null;
    if (currentScreen === 'main') render();
    showToast(`团本完成！${multTag}`, 'success');
  } else {
    const lv = G.player.level;
    // 同步主地图：连续成长曲线 + 提升后的基础属性 + 团本难度强化（精英×4）
    var lvScale = 1 + lv * 0.012;
    const bossHp = Math.floor((40 + lv * 20) * 3 * 4 * lvScale + liveBattle.dungeonWave * lv * 20);
    const bossAtk = Math.floor((4 + lv * 3.8) * 2 * 4 * lvScale + liveBattle.dungeonWave * lv * 2);
    var newBoss = { name: dungeon.bosses[liveBattle.dungeonWave], level: lv, enemyType: 'elite', hp: bossHp, maxHp: bossHp, atk: bossAtk, def: Math.floor(lv * 2.0 * 1.6 * 1.5) };
    if (!newBoss.speed) newBoss.speed = Math.floor((newBoss.level || 1) * 2 + 10);
    liveBattle.monsters = [newBoss];
    liveBattle.monsterHpArray = [newBoss.hp];
    liveBattle.monsterMaxHpArray = [newBoss.maxHp || newBoss.hp];
    liveBattle.monsterStatusArray = [{ frozen: 0, stunned: 0, silenced: 0, rooted: 0, sleeping: 0, poisoned: 0, poisonPct: 0, poisonStacks: 0, burning: 0, burnPct: 0, defReduced: 0, defReduceTurns: 0 }];
    // 任务16：同步重置怪物 buff 数组（保持数组一致性）
    liveBattle.monsterBuffsArray = [{ atk: 0, def: 0, spd: 0, all: 0, shield: 0, shieldTurns: 0, hotTurns: 0, hotPct: 0, buffTurns: {}, counterBuff: 0, counterTurns: 0, reflectBuff: 0, reflectTurns: 0, defDebuff: 0, stolenAtk: 0, stolenAtkTurns: 0 }];
    liveBattle.round = 0;
    liveBattle.phase = 'player_turn';
    liveBattle.animating = false;
    liveBattle.turnQueue = [];
    addBattleLog('info', `⚔️ 第${liveBattle.dungeonWave + 1}个BOSS：${dungeon.bosses[liveBattle.dungeonWave]}`);
    saveGame();
    if (currentScreen === 'main') render();
    buildTurnQueue();
    scheduleNextTurn();
  }
}

function listEgg(eggId) {
  const priceInput = document.getElementById('price_' + eggId);
  const price = parseInt(priceInput && priceInput.value || 0);
  if (!price || price < 100) { showToast('价格至少100金币', 'error'); return; }
  if (listEggOnMarket(eggId, price)) {
    showToast('上架成功！', 'success');
    saveGame();
    render();
  }
}

function buyListing(listingId) {
  if (buyMarketListing(listingId)) {
    showToast('购买成功！', 'success');
    saveGame();
    render();
  } else {
    showToast('金币不足！', 'error');
  }
}

function claimTask(taskId) {
  if (claimDailyTask(taskId)) {
    showToast('领取成功！', 'success');
    saveGame();
    render();
  }
}

// 需求10：领取周常任务奖励
function claimWeeklyTaskUI(taskId) {
  if (claimWeeklyTask(taskId)) {
    showToast('领取成功！', 'success');
    saveGame();
    render();
  }
}

// 需求10：一键领取所有日常任务
function claimAllDailyUI() {
  var count = claimAllDailyTasks();
  if (count > 0) {
    showToast('🎁 一键领取 ' + count + ' 个日常任务奖励！', 'success');
    saveGame();
    render();
  } else {
    showToast('没有可领取的日常任务', 'info');
  }
}

// 需求10：一键领取所有周常任务
function claimAllWeeklyUI() {
  var count = claimAllWeeklyTasks();
  if (count > 0) {
    showToast('🎁 一键领取 ' + count + ' 个周常任务奖励！', 'success');
    saveGame();
    render();
  } else {
    showToast('没有可领取的周常任务', 'info');
  }
}

// 需求1：领取主线任务奖励
function claimMainQuestUI() {
  if (typeof claimMainQuest !== 'function') return;
  if (claimMainQuest()) {
    showToast('🎉 主线任务奖励已领取！', 'success');
    saveGame();
    render();
  } else {
    showToast('任务尚未完成', 'error');
  }
}

// 需求5：血色要塞 - 开始活动
function startCrimsonFortressUI(difficultyId) {
  if (typeof startCrimsonFortress !== 'function') return;
  var result = startCrimsonFortress(difficultyId);
  if (!result.ok) {
    showToast(result.msg, 'error');
    return;
  }
  // 生成第一轮怪物并开始战斗
  if (typeof beginCrimsonFortressBattle === 'function') {
    beginCrimsonFortressBattle();
  }
}

// 需求5：血色要塞 - 选择增益buff
function selectCrimsonFortressBuffUI(buffId) {
  if (typeof selectCrimsonFortressBuff !== 'function') return;
  if (selectCrimsonFortressBuff(buffId)) {
    saveGame();
    render();
  }
}

// 需求5：血色要塞 - 放弃活动
function abandonCrimsonFortressUI() {
  if (!G.crimsonFortress || !G.crimsonFortress.active) return;
  if (!confirm('确定放弃血色要塞？将按当前击杀数结算奖励')) return;
  var result = endCrimsonFortress();
  if (result) {
    showToast('🏰 血色要塞结束！击杀 ' + result.kills + ' 怪，经验 +' + result.exp + '，金币 +' + result.gold, 'success');
    saveGame();
    render();
  }
}

function buyBattlePass() {
  if (G.player.diamond < 50) { showToast('钻石不足！', 'error'); return; }
  G.player.diamond -= 50;
  G.player.battlePassPremium = true;
  showToast('高级战令已激活！', 'success');
  saveGame();
  render();
}

function claimBP(level) {
  if (claimBattlePassReward(parseInt(level))) {
    showToast('战令奖励已领取！', 'success');
    saveGame();
    render();
  }
}

function challengeTower() {
  const result = startTowerBattle();
  if (!result) { showToast('请先设置出战宠物！', 'error'); return; }
  if (result.victory) {
    var msg = '通过第' + result.floor + '层！';
    if (result.isBoss) msg += ' 击败首领！';
    if (result.reward) {
      msg += ' 获得';
      if (result.reward.gold) msg += ' 🪙' + result.reward.gold;
      if (result.reward.diamond) msg += ' 💎' + result.reward.diamond;
      if (result.reward.exp) msg += ' ⭐' + result.reward.exp;
    }
    showToast(msg, 'success');
    // 需求6：爬塔收获日志
    if (typeof addActivityLog === 'function') {
      var logMsg = '通过第' + result.floor + '层' + (result.isBoss ? '（首领）' : '');
      if (result.reward) {
        var parts = [];
        if (result.reward.gold) parts.push('🪙' + result.reward.gold);
        if (result.reward.diamond) parts.push('💎' + result.reward.diamond);
        if (result.reward.exp) parts.push('⭐' + result.reward.exp);
        if (parts.length) logMsg += '，获得 ' + parts.join(' ');
      }
      addActivityLog('tower', logMsg, 'win');
    }
  } else {
    showToast('挑战第' + result.floor + '层失败... (' + result.rounds + '回合)', 'error');
    if (typeof addActivityLog === 'function') {
      addActivityLog('tower', '挑战第' + result.floor + '层失败（' + result.rounds + '回合）', 'fail');
    }
  }
  saveGame();
  render();
}

function doRebirthUI() {
  if (doRebirth()) {
    saveGame();
    showToast('转生成功！页面刷新中...', 'success');
    setTimeout(function() { location.reload(); }, 500);
  }
}

function updateFusionPreview() {
  const el1 = document.getElementById('fusionPet1');
  const el2 = document.getElementById('fusionPet2');
  const id1 = el1 && el1.value;
  const id2 = el2 && el2.value;
  const preview = document.getElementById('fusionPreview');
  const btn = document.getElementById('btnFuse');
  if (!id1 || !id2) {
    if (preview) preview.innerHTML = '请选择两只宠物';
    if (btn) btn.disabled = true;
    return;
  }
  if (id1 === id2) {
    if (preview) preview.innerHTML = '<span class="text-red-400">不能选择同一只宠物</span>';
    if (btn) btn.disabled = true;
    return;
  }
  const pet1 = G.pets.find(p => p.id === id1);
  const pet2 = G.pets.find(p => p.id === id2);
  if (!pet1 || !pet2) return;
  // 计算成长范围：取两只较高值×0.8~1.15
  var gHigher = Math.max(pet1.growth, pet2.growth);
  var gMin = (gHigher * 0.8).toFixed(2);
  var gMax = Math.min(3.5, gHigher * 1.15).toFixed(2);
  // 资质范围：取两只较高值×0.85~1.15
  var aptPreviewHtml = APTITUDE_KEYS.map(function(k) {
    var v1 = (pet1.aptitude && pet1.aptitude[k]) || 1500;
    var v2 = (pet2.aptitude && pet2.aptitude[k]) || 1500;
    var higher = Math.max(v1, v2);
    var aMin = Math.floor(higher * 0.85);
    var aMax = Math.min(3000, Math.floor(higher * 1.15));
    var shortName = k.replace('资质', '');
    return '<div class="flex items-center gap-1 text-xs">' +
      '<span class="text-secondary w-6">' + shortName + '</span>' +
      '<span class="text-blue-400">' + aMin + ' ~ ' + aMax + '</span>' +
      '</div>';
  }).join('');
  // 技能预览：列出两只宠物所有技能，相同技能标注可能升级
  var allSkills1 = getNormalSkills(pet1);
  var allSkills2 = getNormalSkills(pet2);
  var skillMap = {};
  allSkills1.forEach(function(s) {
    var baseId = getSkillBaseId(s.id);
    if (!skillMap[baseId]) skillMap[baseId] = { name: s.name, count: 0, tier: getSkillTier(s.id) };
    skillMap[baseId].count++;
  });
  allSkills2.forEach(function(s) {
    var baseId = getSkillBaseId(s.id);
    if (!skillMap[baseId]) skillMap[baseId] = { name: s.name, count: 0, tier: getSkillTier(s.id) };
    skillMap[baseId].count++;
  });
  var skillPreviewHtml = Object.values(skillMap).map(function(entry) {
    var upgradeNote = entry.count >= 2 ? ' <span class="text-yellow-400">(可能升级)</span>' : '';
    var keepNote = entry.count >= 2 ? ' <span class="text-green-400">高概率保留</span>' : ' <span class="text-secondary">60%保留</span>';
    return '<p class="text-xs">📖 ' + entry.name + upgradeNote + keepNote + '</p>';
  }).join('');
  if (Object.keys(skillMap).length === 0) skillPreviewHtml = '<p class="text-xs text-secondary">无技能</p>';
  if (preview) preview.innerHTML =
    '<div class="bg-panel rounded-xl p-3 text-left">' +
    '<p class="text-xs text-secondary mb-2">融合 <span style="color:' + RARITY_COLORS[RARITIES.indexOf(pet1.rarity)] + '">' + pet1.name + '</span> + <span style="color:' + RARITY_COLORS[RARITIES.indexOf(pet2.rarity)] + '">' + pet2.name + '</span></p>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
    '<div>' +
    '<p class="text-xs font-bold text-gold mb-1">📈 成长范围</p>' +
    '<p class="text-xs text-blue-400">' + gMin + ' ~ ' + gMax + '</p>' +
    '<p class="text-xs font-bold text-gold mt-2 mb-1">📊 资质范围</p>' +
    aptPreviewHtml +
    '</div>' +
    '<div>' +
    '<p class="text-xs font-bold text-gold mb-1">📖 技能预览</p>' +
    skillPreviewHtml +
    '</div>' +
    '</div>' +
    '<p class="text-xs text-yellow-400 mt-2">融合规则：结果为两只宠物之一，成长/资质从两只上下限随机取值，相同技能有概率升级，不同技能有概率保留。1.5%概率出现融合限定特殊宠物，3%概率异化。</p>' +
    '</div>';
  if (btn) btn.disabled = false;
}

function doFusion() {
  const el1 = document.getElementById('fusionPet1');
  const el2 = document.getElementById('fusionPet2');
  const id1 = el1 && el1.value;
  const id2 = el2 && el2.value;
  if (!id1 || !id2 || id1 === id2) return;
  const pet1 = G.pets.find(p => p.id === id1);
  const pet2 = G.pets.find(p => p.id === id2);
  if (!pet1 || !pet2) return;
  const fusionStone = G.inventory.find(i => i.id === 'fusion_stone');
  if (!fusionStone || fusionStone.count < 1) {
    showToast('需要融合石！战斗有概率掉落。', 'error');
    return;
  }
  fusionStone.count--;
  if (fusionStone.count <= 0) G.inventory = G.inventory.filter(i => i.id !== 'fusion_stone');
  const fusionResult = fusePets(pet1, pet2);
  const result = fusionResult.result;
  const isSpecial = fusionResult.isSpecial;
  const isFusionOnly = fusionResult.isFusionOnly;
  G.pets = G.pets.filter(p => p.id !== id1 && p.id !== id2);
  G.player.activeTeam = G.player.activeTeam.map(id => (id === id1 || id === id2) ? null : id);
  result.level = G.player.level;
  G.pets.push(result);
  G.statistics.totalFusions++;
  updateAchievement('fuse', 1);
  updateDailyTask('fuse_pet', 1);
  // v3.0 主线任务追踪：宠物获取（融合）
  if (typeof _trackPetAcquire === 'function') _trackPetAcquire();
  if (isFusionOnly) {
    showToast(`✨🔥 融合奇迹！获得融合限定特殊宠物：${result.name}！`, 'success');
  } else if (isSpecial) {
    showToast(`🌟 融合出现异化宠物：${result.name}！`, 'success');
  } else {
    showToast(`融合成功！获得 ${result.name}（${RARITY_NAMES[RARITIES.indexOf(result.rarity)]}）`, 'success');
  }
  saveGame();
  render();
}

// ==================== 新进阶系统 UI ====================

/**
 * 渲染进阶页面（进化页 advance sheet）
 */
function renderAdvanceSheet() {
  var selectedPetId = window._advanceSelectedPet || '';
  var selectedPet = selectedPetId ? G.pets.find(function(p) { return p.id === selectedPetId; }) : null;

  // 筛选可进阶宠物
  var advanceablePets = G.pets.filter(function(p) { return p.advanceable; });

  var html = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-2">⭐ 宠物进阶</h2>' +
    '<p class="text-xs text-secondary mb-3">使用进化晶石积满进阶值后可进阶，每次进阶成长和资质提升30%。T5拥有6技能格。</p>' +
    '<p class="text-xs text-yellow-400 mb-3">📌 进化晶石可通过「活动 → 进化之梯」获取。</p>';

  if (advanceablePets.length === 0) {
    html += '<p class="text-center text-secondary py-4">暂无可进阶的宠物。可进阶宠物图鉴中标有"可进阶"标记。</p>';
    html += '</div>';
    return html;
  }

  // 宠物选择列表
  html += '<div class="mb-4"><p class="text-sm font-bold mb-2">选择可进阶宠物：</p>';
  html += '<select id="advancePetSelect" class="w-full mb-3" onchange="selectAdvancePet(this.value)">';
  html += '<option value="">-- 选择宠物 --</option>';
  advanceablePets.forEach(function(p) {
    var tier = getPetTier(p.name);
    var rarityName = RARITY_NAMES[RARITIES.indexOf(p.rarity)] || p.rarity;
    var selected = (p.id === selectedPetId) ? ' selected' : '';
    html += '<option value="' + p.id + '"' + selected + '>' + p.name + ' (T' + tier + ' · ' + rarityName + ' · Lv.' + p.level + ')</option>';
  });
  html += '</select></div>';

  if (selectedPet) {
    var evolveInfo = getPetEvolveInfo(selectedPet);
    if (evolveInfo.canEvolve) {
      var currentTier = getPetTier(selectedPet.name);
      var nextDex = getPetDex(evolveInfo.nextName);
      var nextTier = evolveInfo.targetTier;
      var advanceValue = selectedPet.advanceValue || 0;
      var progressPct = Math.min(100, Math.floor(advanceValue / evolveInfo.advanceValueMax * 100));

      // 当前形态 vs 进阶预览
      html += '<div class="grid grid-cols-2 gap-4 mb-4">';
      // 当前形态
      html += '<div class="bg-panel border border-game rounded-lg p-3">';
      html += '<p class="text-sm font-bold text-center mb-2">当前形态</p>';
      html += '<p class="text-center text-lg font-bold">' + selectedPet.name + '</p>';
      html += '<p class="text-center text-xs text-secondary">T' + currentTier + ' · ' + (selectedPet.race) + '</p>';
      html += '<p class="text-center text-xs mt-1">成长: ' + (selectedPet.growth || 0).toFixed(2) + '</p>';
      html += '<p class="text-center text-xs">资质总和: ' + APTITUDE_KEYS.reduce(function(s, k) { return s + (selectedPet.aptitude && selectedPet.aptitude[k] || 0); }, 0) + '</p>';
      html += '<p class="text-center text-xs">技能格: ' + (selectedPet.innateSkills ? selectedPet.innateSkills.length : 0) + '/' + getPetMaxSkills(selectedPet.name) + '</p>';
      html += '</div>';
      // 进阶预览
      html += '<div class="bg-panel border-2 border-yellow-500 rounded-lg p-3">';
      html += '<p class="text-sm font-bold text-center mb-2 text-yellow-400">进阶预览</p>';
      html += '<p class="text-center text-lg font-bold text-yellow-400">' + evolveInfo.nextName + '</p>';
      html += '<p class="text-center text-xs text-secondary">T' + nextTier + ' · ' + (nextDex ? nextDex.race : '?') + '</p>';
      html += '<p class="text-center text-xs mt-1">成长: ×1.3 → ' + ((selectedPet.growth || 0) * 1.3).toFixed(2) + '</p>';
      html += '<p class="text-center text-xs">资质: ×1.3</p>';
      html += '<p class="text-center text-xs">技能格: ' + getPetMaxSkills(evolveInfo.nextName) + '</p>';
      html += '</div>';
      html += '</div>';

      // 进阶进度条
      html += '<div class="mb-4">';
      html += '<div class="flex justify-between text-xs mb-1"><span>进阶值</span><span>' + advanceValue + ' / ' + evolveInfo.advanceValueMax + '</span></div>';
      html += '<div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">';
      html += '<div class="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all" style="width:' + progressPct + '%"></div>';
      html += '</div></div>';

      // 进阶链展示
      html += '<div class="text-center text-xs text-secondary mb-4">';
      html += '进阶链: ' + evolveInfo.chain.map(function(name, i) {
        var cls = i === (selectedPet.advanceStage || 0) ? 'text-yellow-400 font-bold' : (i < (selectedPet.advanceStage || 0) ? 'text-green-400' : '');
        return '<span class="' + cls + '">' + name + '</span>';
      }).join(' → ');
      html += '</div>';

      // 进化晶石使用按钮
      html += '<div class="grid grid-cols-3 gap-3">';
      var tiers = ['low', 'mid', 'high'];
      tiers.forEach(function(tier) {
        var config = EVOLVE_SYSTEM_CONFIG.ITEMS[tier];
        var invItem = G.inventory.find(function(i) { return i.id === config.id; });
        var count = invItem ? invItem.count : 0;
        var disabled = count <= 0;
        var btnCls = disabled ? 'opacity-50 cursor-not-allowed' : '';
        html += '<div class="bg-panel border border-game rounded-lg p-3 text-center ' + btnCls + '">';
        html += '<p class="text-sm font-bold">' + config.name + '</p>';
        html += '<p class="text-xs text-secondary mt-1">基础+' + config.baseValue + '进阶值</p>';
        html += '<p class="text-xs text-yellow-400">持有: ' + count + '</p>';
        html += '<button class="mt-2 px-3 py-1 rounded text-xs ' + (disabled ? 'bg-gray-600' : 'bg-purple-700 hover:bg-purple-600') + ' text-white"' +
          (disabled ? '' : ' onclick="useEvolutionCrystalUI(\'' + selectedPet.id + '\', \'' + tier + '\')"') + '>使用</button>';
        html += '</div>';
      });
      html += '</div>';

      // 一键进阶按钮（当进阶值满时）
      if (advanceValue >= evolveInfo.advanceValueMax) {
        html += '<div class="mt-4 text-center">';
        html += '<button class="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold hover:opacity-90" onclick="advancePetEvolveUI(\'' + selectedPet.id + '\')">⭐ 立即进阶</button>';
        html += '</div>';
      }
    } else if (evolveInfo.maxed) {
      html += '<div class="text-center py-4"><p class="text-yellow-400 font-bold">该宠物已达到最高进阶形态！</p></div>';
    } else {
      html += '<div class="text-center py-4"><p class="text-secondary">该宠物不可进阶。</p></div>';
    }
  } else {
    html += '<p class="text-center text-secondary py-4">请选择一只可进阶的宠物。</p>';
  }

  html += '</div>';
  return html;
}

/**
 * 选择进阶宠物
 */
function selectAdvancePet(petId) {
  window._advanceSelectedPet = petId;
  render();
}

/**
 * 使用进化晶石（UI入口）
 */
function useEvolutionCrystalUI(petId, itemTier) {
  var result = useEvolutionCrystal(petId, itemTier);
  if (result.ok) {
    showToast(result.msg, result.crit ? 'success' : 'info');
  } else {
    showToast(result.msg, 'error');
  }
  saveGame();
  render();
}

/**
 * 执行宠物进阶（UI入口）
 */
function advancePetEvolveUI(petId) {
  var result = advancePetEvolve(petId);
  if (result.ok) {
    showToast(result.msg, 'success');
  } else {
    showToast(result.msg, 'error');
  }
  saveGame();
  render();
}

// ==================== 符文洞窟活动 UI（原进化森林，v2.8.0重构） ====================
// v2.8.0 需求4.1：奖励池替换为符文材料 + 符文成品

/**
 * 渲染符文洞窟活动页面
 */
function renderActivityEvolutionForest() {
  if (!EVOLUTION_FOREST_CONFIG) return '<div class="bg-card border border-game rounded-xl p-4"><p class="text-center text-secondary">活动配置不存在</p></div>';

  var usedToday = getEvolutionForestUsedToday();
  var remaining = EVOLUTION_FOREST_CONFIG.dailyLimit - usedToday;
  var minLevel = EVOLUTION_FOREST_CONFIG.minLevel;
  var isLocked = G.player.level < minLevel;

  var html = renderActivityTeamBar();
  html += '<div class="bg-card border border-game rounded-xl p-4">';
  html += '<h2 class="font-bold text-lg mb-2">🔮 ' + EVOLUTION_FOREST_CONFIG.name + '</h2>';
  html += '<p class="text-xs text-secondary mb-2">' + EVOLUTION_FOREST_CONFIG.desc + '</p>';
  html += '<div class="flex justify-between text-xs mb-4">';
  html += '<span class="text-yellow-400">今日剩余次数: ' + remaining + '/' + EVOLUTION_FOREST_CONFIG.dailyLimit + '</span>';
  if (isLocked) {
    html += '<span class="text-red-400">🔒 需要等级 ' + minLevel + '</span>';
  }
  html += '</div>';

  if (isLocked) {
    html += '<p class="text-center text-secondary py-4">需要角色等级达到 ' + minLevel + ' 级才能进入符文洞窟。</p>';
    html += '</div>';
    return html;
  }

  // 层数选择
  html += '<div class="grid grid-cols-1 gap-3">';
  EVOLUTION_FOREST_CONFIG.layers.forEach(function(layer) {
    var rewardConfig = EVOLUTION_FOREST_CONFIG.rewards[layer.layer - 1];
    // v2.8.0 需求4.1：奖励描述改为符文材料 + 成品符文
    var rewardDesc = [];
    if (rewardConfig.runeLow) rewardDesc.push('低级符文×' + rewardConfig.runeLow[0] + '~' + rewardConfig.runeLow[1]);
    if (rewardConfig.runeMid) {
      if (rewardConfig.runeMid.chance >= 1) rewardDesc.push('中级符文×' + rewardConfig.runeMid.count);
      else rewardDesc.push(Math.floor(rewardConfig.runeMid.chance * 100) + '%概率中级符文');
    }
    if (rewardConfig.runeHigh) {
      if (rewardConfig.runeHigh.chance >= 1) rewardDesc.push('高级符文×' + rewardConfig.runeHigh.count);
      else rewardDesc.push(Math.floor(rewardConfig.runeHigh.chance * 100) + '%概率高级符文');
    }
    if (rewardConfig.runeDropRate) {
      rewardDesc.push(Math.floor(rewardConfig.runeDropRate * 100) + '%掉成品符文');
    }

    var canChallenge = remaining > 0;
    var btnDisabled = !canChallenge;

    html += '<div class="bg-panel border border-game rounded-lg p-3 flex items-center justify-between">';
    html += '<div class="flex-1">';
    html += '<p class="font-bold text-sm">' + layer.icon + ' 第' + layer.layer + '层 · ' + layer.name + '</p>';
    html += '<p class="text-xs text-secondary mt-1">' + layer.desc + '</p>';
    html += '<p class="text-xs text-orange-400 mt-1">怪物: ' + layer.monsterName + ' (Lv.' + layer.level + ')</p>';
    html += '<p class="text-xs text-yellow-400">奖励: ' + rewardDesc.join(' / ') + ' / 金币' + rewardConfig.gold[0] + '~' + rewardConfig.gold[1] + ' / 经验' + rewardConfig.exp[0] + '~' + rewardConfig.exp[1] + '</p>';
    html += '</div>';
    html += '<button class="ml-4 px-4 py-2 rounded text-sm ' + (btnDisabled ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-700 hover:bg-green-600') + ' text-white"' +
      (btnDisabled ? '' : ' onclick="enterEvolutionForestUI(' + layer.layer + ')"') + '>' + (btnDisabled ? '次数用完' : '挑战') + '</button>';
    html += '</div>';
  });
  html += '</div>';

  html += '<p class="text-xs text-secondary mt-3">💡 挑战失败不扣除次数，可反复尝试。符文材料可用于宠物装备符文强化，成品符文可直接装备！</p>';
  html += '</div>';

  // 收获日志
  html += (typeof renderActivityHarvestLog === 'function' ? renderActivityHarvestLog('evolution_forest', '符文洞窟收获日志') : '');

  return html;
}

/**
 * 进入符文洞窟战斗（UI入口）
 */
function enterEvolutionForestUI(layer) {
var result = enterEvolutionForest(layer);
if (!result.ok) {
showToast(result.msg, 'error');
return;
}
// 需求3.1：弹窗战斗系统以模态框显示，无需切换到主界面
}
