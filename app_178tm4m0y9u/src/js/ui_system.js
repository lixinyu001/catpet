﻿// ===== ui_system.js : 角色/阵法/宠物装备/六道轮回/融合等UI（从ui.js拆分） =====

function renderCharacterScreen() {
  const eq = G.player.equipment;
  const forge = G.player.forgeLevels || {};
  const bonus = getEquipStatBonus();
  const charBonus = getCharacterBonusForPet();
  const lv = G.player.level;
  const totalForgeLv = Object.values(forge).reduce((s, v) => s + v, 0);
  var sheet = window._charSheet || 'equipment';
  var sheetTabs = [
    { id: 'equipment', label: '装备', icon: '⚔️' },
    { id: 'forge', label: '锻造强化', icon: '🔨' },
    { id: 'socket', label: '打孔镶嵌', icon: '🔩' },
    { id: 'refine', label: '装备洗练', icon: '🔮' },
    { id: 'cultivation', label: '人物修炼', icon: '🌀' },
  ];
  var tabsHtml = sheetTabs.map(function(t) {
    var active = sheet === t.id;
    return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + '" onclick="window._charSheet=\'' + t.id + '\';render()">' + t.icon + ' ' + t.label + '</button>';
  }).join('');
  const slotsHtml = EQUIPMENT_SLOTS.map(slot => {
    const item = eq[slot.id];
    const rarityIdx = item ? EQUIP_RARITIES.indexOf(item.rarity) : -1;
    const fLv = forge[slot.id] || 0;
    const clickAction = item ? ("unequipItem('" + slot.id + "')") : ("showEquipBag('" + slot.id + "')");
    let itemHtml = '';
    if (item) {
      const mult = 1 + fLv * 0.1;
      const baseStatStr = getEquipBaseStatText(item, mult);
      const affixStr = (item.affixes || []).map(function(a) {
        var cls = a.special ? 'text-orange-400' : 'text-green-400';
        var val = Math.floor(a.value * mult * 100) / 100;
        var label = typeof a.format === 'function' ? a.format(val) : ('+' + val);
        return '<p class="text-xs ' + cls + '">' + label + '</p>';
      }).join('');
      itemHtml = '<p class="text-xs font-bold" style="color:' + EQUIP_RARITY_COLORS[rarityIdx] + '">' + item.name + '</p>' +
        '<p class="text-xs text-secondary">Lv.' + item.level + ' ' + EQUIP_RARITY_NAMES[rarityIdx] + '</p>' +
        '<div class="text-xs text-secondary mt-1">' + baseStatStr + '</div>' +
        affixStr +
        (item.special ? (function(){ var sp = EQUIP_SPECIALS.find(s=>s.id===item.special); return sp ? '<p class="text-xs font-bold mt-1" style="color:'+sp.color+'">★'+sp.name+'('+sp.desc+')</p>' : ''; })() : '') +
        '<button class="btn-danger btn-sm mt-1 text-xs" onclick="event.stopPropagation();unequipItem(\'' + slot.id + '\')">卸下</button>';
    } else {
      itemHtml = '<p class="text-xs text-secondary">空</p>';
    }
    var forgeBadge = fLv > 0 ? ' <span class="text-orange-400 font-bold">+' + fLv + '</span>' : '';
    // 宝石孔显示：基于装备自身的 gemSlots 字段
    var gemHtml = '';
    if (item && Array.isArray(item.gemSlots) && item.gemSlots.length > 0) {
      var slotBadges = item.gemSlots.map(function(gs, gidx) {
        var gdef = getGemType(gs.type);
        if (!gdef) return '';
        if (gs.gem && gs.gem.level > 0) {
          return '<div class="text-xs flex items-center justify-center gap-1" style="color:' + gdef.color + '">' +
            '<span>' + gdef.icon + '</span>' +
            '<span>' + gdef.name.replace('宝石','') + '+' + gs.gem.level + '</span>' +
            '<button class="btn-danger btn-sm text-xs ml-1 px-1" onclick="event.stopPropagation();unequipGemFromSlot(\'' + slot.id + '\',' + gidx + ')">✕</button>' +
            '</div>';
        } else {
          return '<div class="text-xs text-secondary flex items-center justify-center gap-1">' +
            '<span style="opacity:0.6">' + gdef.icon + '</span>' +
            '<span>空孔(' + gdef.name.replace('宝石','') + ')</span></div>';
        }
      }).join('');
      gemHtml = '<div class="mt-2 pt-2 border-t border-game/40">' +
        '<p class="text-xs text-secondary mb-1">宝石孔(' + item.gemSlots.length + ')</p>' +
        slotBadges +
        '<button class="btn-sm mt-1 text-xs" style="background:#7c3aed;color:#fff" onclick="event.stopPropagation();showGemBagForSlot(\'' + slot.id + '\')">管理宝石</button>' +
        '</div>';
    } else if (item) {
      gemHtml = '<div class="mt-2 pt-2 border-t border-game/40">' +
        '<p class="text-xs text-secondary">该装备无宝石孔</p>' +
        '</div>';
    }
    return '<div class="bg-panel border ' + (item ? 'border-game' : 'border-dashed border-game') + ' rounded-xl p-3 text-center cursor-pointer" onclick="' + clickAction + '">' +
      '<div class="text-2xl mb-1">' + slot.icon + '</div>' +
      '<p class="text-xs text-secondary mb-1">' + slot.name + forgeBadge + '</p>' +
      itemHtml +
      gemHtml +
      '</div>';
  }).join('');

  var bagHtml = '';
  if (G.equipmentBag.length > 0) {
    // 分页：装备背包每页显示12件
    var eqPg = paginateList('eqbag', G.equipmentBag.length, 12);
    var eqStart = (eqPg.page - 1) * eqPg.pageSize;
    var bagSlice = G.equipmentBag.slice(eqStart, eqStart + eqPg.pageSize);
    var bagItems = bagSlice.map(function(item) {
      var rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
      var slotInfo = EQUIPMENT_SLOTS.find(function(s) { return s.id === item.slot; });
      var affixStr = (item.affixes || []).map(function(a) {
        var cls = a.special ? 'text-orange-400' : 'text-green-400';
        return '<span class="' + cls + ' ml-1">' + (typeof a.format === 'function' ? a.format(a.value) : ('+' + a.value)) + '</span>';
      }).join('');
      var compareHtml = getEquipCompareHtml(item);
      var checked = batchSelected[item.id] ? 'checked' : '';
      var batchCheckHtml = batchMode ? '<input type="checkbox" ' + checked + ' class="w-4 h-4 accent-purple-500" onclick="event.stopPropagation();toggleBatchSelect(\'' + item.id + '\')">' : '';
      // 需求6：装备介绍增加孔洞信息
      var socketCount = Array.isArray(item.gemSlots) ? item.gemSlots.length : 0;
      var socketInfoHtml = '<div class="text-xs mt-1"><span class="' + (socketCount > 0 ? 'text-cyan-400' : 'text-secondary') + '">🔩 孔洞 ' + socketCount + '/' + MAX_GEM_SLOTS + '</span></div>';
      return '<div class="bg-panel border border-game rounded-lg p-3">' +
        '<div class="flex items-center justify-between">' +
        '<div class="flex items-center gap-2">' + batchCheckHtml +
        '<div>' +
        '<div class="flex items-center gap-1 mb-1">' +
        '<span class="text-sm">' + (slotInfo ? slotInfo.icon : '📦') + '</span>' +
        '<span class="text-xs font-bold" style="color:' + EQUIP_RARITY_COLORS[rarityIdx] + '">' + item.name + '</span>' +
        '<span class="text-xs text-secondary">Lv.' + item.level + '</span>' +
        (item.locked ? '<span class="text-xs text-yellow-400">🔒</span>' : '') +
        '</div>' +
        '<div class="text-xs text-secondary">' + getEquipBaseStatText(item) + ' ' + affixStr + '</div>' +
        (item.special ? (function(){ var sp = EQUIP_SPECIALS.find(s=>s.id===item.special); return sp ? '<div class="text-xs font-bold mt-1" style="color:'+sp.color+'">★'+sp.name+'('+sp.desc+')</div>' : ''; })() : '') +
        socketInfoHtml +
        compareHtml +
        '</div>' +
        '</div>' +
        (batchMode ? '' : '<div class="flex gap-1 mt-2">' +
        '<button class="btn-primary btn-sm text-xs" onclick="equipItemById(\'' + item.id + '\')">穿戴</button>' +
        '<button class="btn-gold btn-sm text-xs" onclick="decomposeEquipById(\'' + item.id + '\')">分解</button>' +
        '<button class="btn-sm text-xs ' + (item.locked ? 'text-yellow-400' : 'text-secondary') + ' border border-game rounded px-2" onclick="toggleEquipLock(\'' + item.id + '\')">' + (item.locked ? '解锁' : '上锁') + '</button>' +
        '</div>') +
        '</div>' +
        '</div>';
    }).join('');
    var batchBarHtml = '';
    if (batchMode) {
      var selectedCount = Object.keys(batchSelected).length;
      batchBarHtml = '<div class="bg-panel border border-game rounded-xl p-3 mb-3">' +
        '<div class="flex flex-wrap gap-1 mb-2">' +
        '<button class="text-xs px-2 py-1 rounded border border-game ' + (batchFilter === 'all' ? 'bg-purple-900 text-purple-300' : 'text-secondary') + '" onclick="batchSelectByRarity(\'all\')">全部</button>' +
        EQUIP_RARITIES.map(function(r) {
          return '<button class="text-xs px-2 py-1 rounded border border-game ' + (batchFilter === r ? 'bg-purple-900 text-purple-300' : 'text-secondary') + '" style="' + (batchFilter === r ? '' : 'border-color:' + EQUIP_RARITY_COLORS[EQUIP_RARITIES.indexOf(r)]) + '" onclick="batchSelectByRarity(\'' + r + '\')">' + EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(r)] + '</button>';
        }).join('') +
        '</div>' +
        '<div class="flex gap-2">' +
        '<button class="btn-gold flex-1" onclick="batchSellSelected()" ' + (selectedCount === 0 ? 'disabled style="opacity:0.4"' : '') + '>💰 一键出售 (' + selectedCount + ')</button>' +
        '<button class="btn-primary flex-1" onclick="batchDecomposeSelected()" ' + (selectedCount === 0 ? 'disabled style="opacity:0.4"' : '') + '>🔨 一键分解 (' + selectedCount + ')</button>' +
        '</div>' +
        '</div>';
    }
    bagHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<h2 class="font-bold text-lg">🎒 装备背包 (' + G.equipmentBag.length + ')</h2>' +
      '<button class="btn-gold btn-sm text-xs" onclick="toggleBatchMode()">' + (batchMode ? '退出批量' : '📋 批量处理') + '</button>' +
      '</div>' +
      '<div class="bg-panel border border-game rounded-xl p-3 mb-3">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<span class="text-sm font-bold">♻️ 自动分解</span>' +
      '<label class="flex items-center gap-1 text-xs cursor-pointer">' +
      '<input type="checkbox" ' + (G.autoDecompose.enabled ? 'checked' : '') + ' onchange="G.autoDecompose.enabled=this.checked;saveGame();" class="mr-1" /> 启用' +
      '</label>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-2 text-xs">' +
      '<div><span class="text-secondary">分解品质 ≤</span> ' +
      '<select onchange="G.autoDecompose.maxRarity=this.value;saveGame();" class="bg-card border border-game rounded px-1 py-0.5 text-xs">' +
      ['white','green','blue','purple','orange'].map(function(r) {
        var rn = EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(r)] || r;
        return '<option value="' + r + '" ' + (G.autoDecompose.maxRarity === r ? 'selected' : '') + '>' + rn + '</option>';
      }).join('') +
      '</select></div>' +
      '<div><span class="text-secondary">装备等级 ≤</span> ' +
      '<input type="number" min="1" max="200" value="' + G.autoDecompose.maxLevel + '" onchange="G.autoDecompose.maxLevel=parseInt(this.value)||10;saveGame();" class="bg-card border border-game rounded px-1 py-0.5 text-xs w-16" /></div>' +
      '</div>' +
      '<p class="text-xs text-secondary mt-2">💡 启用后，获得的新装备若品质和等级不超过设定值，将自动分解为强化石</p>' +
      '</div>' +
      batchBarHtml +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">' + bagItems + '</div>' +
      eqPg.controlsHtml +
      '</div>';
  }

  var attrHtml = ['力量','体质','敏捷','耐力','魔力','气血'].map(function(a) {
    var baseVal = a === '气血' ? 50 + lv * 10 : 10 + lv * (a === '力量' ? 3 : 2);
    var eqVal = bonus[a] || 0;
// 需求7：全属性buff加成显示
var buffVal = getFlatBuff('all_stat');
    var total = baseVal + eqVal + buffVal;
    var bonusStr = (eqVal + buffVal) > 0 ? '<p class="text-xs text-green-400">+' + (eqVal + buffVal) + '</p>' : '';
    return '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-secondary">' + a + '</p><p class="font-bold">' + total + '</p>' + bonusStr + '</div>';
  }).join('');

  var petBonusHtml = Object.entries(charBonus).filter(function(e) { return ['力量','体质','敏捷','耐力','魔力','气血'].indexOf(e[0]) !== -1; }).map(function(e) {
    return '<span class="text-secondary">' + e[0] + ' +' + e[1] + '</span>';
  }).join('');

  // 锻造强化相关变量（移自 renderForgeScreen，需求13）
  var protInv = G.inventory.find(function(i){return i.id==='protection_stone';});
  var protCount = protInv ? protInv.count : 0;
  var useProtChecked = window._forgeUseProt ? 'checked' : '';
  var autoForgeRunning = autoForgeInterval ? true : false;

  // 强化石合成区块（移自 renderInventoryScreen，需求14）
  var forgeStoneComposeHtml = (function() {
    var low = (G.inventory.find(function(i){return i.id==='forge_stone_low';}) || {count:0}).count;
    var mid = (G.inventory.find(function(i){return i.id==='forge_stone_mid';}) || {count:0}).count;
    var high = (G.inventory.find(function(i){return i.id==='forge_stone_high';}) || {count:0}).count;
    return '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
      '<div class="bg-panel border border-game rounded-xl p-3">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<span class="text-sm font-bold">🪨 低级→中级</span>' +
      '<span class="text-xs text-secondary">持有：低级×' + low + ' / 中级×' + mid + '</span>' +
      '</div>' +
      '<div class="flex items-center gap-2">' +
      '<input type="number" id="composeLowCount" value="1" min="1" max="' + Math.floor(low/10) + '" class="bg-card border border-game rounded px-2 py-1 text-sm w-20" />' +
      '<button class="btn-primary btn-sm flex-1" onclick="composeForgeStone(\'low\', Math.max(1, parseInt(document.getElementById(\'composeLowCount\').value) || 1))" ' + (low < 10 ? 'disabled style="opacity:0.5"' : '') + '>合成 (×10→×1)</button>' +
      '<button class="btn-gold btn-sm" onclick="(function(){var m=Math.floor(' + low + '/10); if(m>0) composeForgeStone(\'low\', m); else showToast(\'低级强化石不足10个\',\'error\');})()" ' + (low < 10 ? 'disabled style="opacity:0.5"' : '') + '>最大</button>' +
      '</div>' +
      '</div>' +
      '<div class="bg-panel border border-game rounded-xl p-3">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<span class="text-sm font-bold">🔶 中级→高级</span>' +
      '<span class="text-xs text-secondary">持有：中级×' + mid + ' / 高级×' + high + '</span>' +
      '</div>' +
      '<div class="flex items-center gap-2">' +
      '<input type="number" id="composeMidCount" value="1" min="1" max="' + Math.floor(mid/10) + '" class="bg-card border border-game rounded px-2 py-1 text-sm w-20" />' +
      '<button class="btn-primary btn-sm flex-1" onclick="composeForgeStone(\'mid\', Math.max(1, parseInt(document.getElementById(\'composeMidCount\').value) || 1))" ' + (mid < 10 ? 'disabled style="opacity:0.5"' : '') + '>合成 (×10→×1)</button>' +
      '<button class="btn-gold btn-sm" onclick="(function(){var m=Math.floor(' + mid + '/10); if(m>0) composeForgeStone(\'mid\', m); else showToast(\'中级强化石不足10个\',\'error\');})()" ' + (mid < 10 ? 'disabled style="opacity:0.5"' : '') + '>最大</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<p class="text-xs text-secondary mt-2">💡 提示：可在输入框设置批量合成数量，点击"最大"按钮自动合成全部可用数量。</p>';
  })();

  // 装备强化槽位（移自 renderForgeScreen，需求13）
  var forgeSlotsHtml = EQUIPMENT_SLOTS.map(function(slot) {
    var fLv = forge[slot.id] || 0;
    var item = eq[slot.id];
    var maxLv = getMaxForgeLevel();
    var isMax = fLv >= maxLv;
    var nextRate = isMax ? 0 : getForgeSuccessRate(fLv);
    var stoneNeeded = isMax ? '' : getForgeStoneName(fLv);
    var penalty = isMax ? '' : getForgeFailPenalty(fLv);
    return '<div class="bg-panel border border-game rounded-xl p-4 text-center">' +
      '<div class="text-3xl mb-2">' + slot.icon + '</div>' +
      '<p class="font-bold text-sm mb-1">' + slot.name + '</p>' +
      '<p class="text-2xl font-bold ' + (fLv >= 10 ? 'text-orange-400' : fLv >= 7 ? 'text-purple-400' : fLv >= 4 ? 'text-blue-400' : 'text-secondary') + '">+' + fLv + '</p>' +
      (item ? '<p class="text-xs text-secondary mt-1">' + item.name + '</p>' : '<p class="text-xs text-secondary mt-1">未装备</p>') +
      (!isMax ?
        '<div class="mt-2 text-xs">' +
        '<p class="text-green-400">→ +' + (fLv+1) + ' 成功率 ' + Math.floor(nextRate*100) + '%</p>' +
        '<p class="text-secondary">需要：' + stoneNeeded + '</p>' +
        (penalty ? '<p class="text-red-400">失败：' + (penalty === 'reset' ? '等级清零' : '等级-1') + '</p>' : '') +
        '</div>'
        : '<p class="text-xs text-gold mt-2">✨ 已满级</p>') +
      '<button class="btn-gold btn-sm mt-2 w-full" ' + (isMax ? 'disabled style="opacity:0.5"' : '') + ' onclick="doForge(\'' + slot.id + '\', window._forgeUseProt)">' +
      (isMax ? '已满级' : '🔨 强化') +
      '</button>' +
      (!isMax ?
        '<div class="mt-2 flex gap-1">' +
        '<input type="number" id="autoForgeTarget_' + slot.id + '" min="' + (fLv+1) + '" max="' + maxLv + '" value="' + Math.min(fLv+3,maxLv) + '" class="w-12 text-xs text-center bg-panel border border-game rounded px-1" placeholder="目标">' +
        '<button class="btn-primary btn-sm flex-1 text-xs" ' + (autoForgeRunning ? 'disabled style="opacity:0.4"' : '') + ' onclick="var t=parseInt(document.getElementById(\'autoForgeTarget_' + slot.id + '\').value)||' + maxLv + ';startAutoForge(\'' + slot.id + '\',t)">🤖 自动强化</button>' +
        '</div>'
        : '') +
      '</div>';
  }).join('');

  // 强化石库存（移自 renderForgeScreen，需求13）
  var forgeInvHtml = ['forge_stone_low','forge_stone_mid','forge_stone_high','protection_stone'].map(function(sid, i) {
    var inv = G.inventory.find(function(it) { return it.id === sid; });
    var count = inv ? inv.count : 0;
    var names = ['低级强化石','中级强化石','高级强化石','保底石'];
    var icons = ['🔩','⚙️','💠','🛡️'];
    var colors = ['text-gray-300','text-blue-400','text-purple-400','text-yellow-400'];
    return '<div class="bg-panel rounded-lg p-3">' +
      '<div class="text-2xl">' + icons[i] + '</div>' +
      '<p class="text-xs ' + colors[i] + ' font-bold">' + names[i] + '</p>' +
      '<p class="text-gold text-lg">x' + count + '</p>' +
      '</div>';
  }).join('');

  // 强化规则（移自 renderForgeScreen，需求13）
  var rulesHtml = '' +
    '<p>· 每级强化提升该位置装备 <span class="text-green-400">全部属性 10%</span>（含基础属性和词条）</p>' +
    '<p>· +1 ~ +6：<span class="text-green-400">100% 成功</span>，消耗低级强化石</p>' +
    '<p>· +7 ~ +9：消耗中级强化石，失败等级-1</p>' +
    '<p>· +10 ~ +12：消耗高级强化石，<span class="text-red-400">失败等级清零</span></p>' +
    '<p>· <span class="text-yellow-400">+12 以上</span>：转生突破上限，成功率持续递减（+12 15%, +13 10%, +14 6%, +15 3%）</p>' +
    '<p>· <span class="text-gold">当前强化上限：+' + getMaxForgeLevel() + '</span>（基础+12，转生' + G.player.rebirth + '次加成+' + (getMaxForgeLevel() - 12) + '）</p>' +
    '<p>· <span class="text-yellow-400">保底石</span>：强化时消耗1个，失败时等级不变</p>' +
    '<p>· <span class="text-purple-400">自动强化</span>：设置目标等级，自动强化至目标/手动关闭/强化石不足</p>' +
    '<p>· 强化针对装备位置，<span class="text-yellow-400">更换装备不影响强化等级</span></p>';

  // 人物属性区（始终展示）
  var attrSectionHtml = '<h2 class="font-bold text-lg mb-3">📊 人物属性</h2>' +
    '<div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4 text-xs">' + attrHtml + '</div>' +
    '<div class="text-xs text-secondary mb-2">' +
    '<p>攻击力：' + bonus.atk + ' | 防御力：' + bonus.def + ' | 暴击率：' + Math.floor(bonus.critRate*100) + '% | 闪避率：' + Math.floor(bonus.dodgeRate*100) + '%</p>' +
    '<p class="mt-1">宠物伤害：' + Math.floor(bonus.petDmg*100) + '% | 宠物防御：' + Math.floor(bonus.petDef*100) + '% | 宠物气血：' + Math.floor(bonus.petHp*100) + '%</p>' +
    '</div>' +
    '<div class="bg-panel rounded-lg p-3 border border-yellow-600/50">' +
    '<p class="text-xs text-yellow-400 font-bold mb-1">✨ 宠物加成（人物属性20%）</p>' +
    '<div class="grid grid-cols-3 sm:grid-cols-5 gap-1 text-xs">' + petBonusHtml + '</div>' +
    '</div>';

  // 装备 sheet 内容（移除原锻造强化按钮，需求13）
  var equipmentContent = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
    '<h2 class="font-bold text-lg">⚔️ 装备栏</h2>' +
    '</div>' +
    '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">' + slotsHtml + '</div>' +
    '</div>' +
    renderGemSection() +
    bagHtml;

  // 锻造强化 sheet 内容（需求13 + 需求14）
  var forgeContent = '' +
    // 强化石合成（移自背包，需求14）
    '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-3">🔨 强化石合成<span class="text-xs text-secondary font-normal ml-2">（10低级→1中级 / 10中级→1高级）</span></h2>' +
    forgeStoneComposeHtml +
    '</div>' +
    // 装备强化
    '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
    '<h2 class="font-bold text-lg">⚒️ 装备强化</h2>' +
    '<label class="flex items-center gap-2 text-xs cursor-pointer">' +
    '<input type="checkbox" id="forgeUseProt" ' + useProtChecked + ' class="w-4 h-4 accent-purple-500" onclick="window._forgeUseProt=this.checked">' +
    '<span class="text-secondary">使用保底石 (🛡️' + protCount + ')</span>' +
    '</label>' +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">强化针对装备位置，更换装备不影响强化等级。每级强化提升该位置装备属性 10%。勾选保底石后强化失败不降级。</p>' +
    '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">' + forgeSlotsHtml + '</div>' +
    (autoForgeRunning ? '<div class="mt-3 text-center"><button class="btn-danger btn-sm" onclick="stopAutoForge();render();">⏹️ 停止自动强化</button></div>' : '') +
    '</div>' +
    // 强化石库存
    '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-3">📦 强化石库存</h2>' +
    '<div class="grid grid-cols-4 gap-3 text-center">' + forgeInvHtml + '</div>' +
    '</div>' +
    // 强化规则
    '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-3">📋 强化规则</h2>' +
    '<div class="text-xs text-secondary space-y-1">' + rulesHtml + '</div>' +
    '</div>';

  return '<div class="min-h-screen flex flex-col">' +
    '<header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">' +
    '<h1 class="font-fantasy text-gold text-lg">🧑 角色</h1>' +
    '<span class="text-sm text-secondary">Lv.' + lv + (totalForgeLv > 0 ? ' · 总强化 +' + totalForgeLv : '') + '</span>' +
    '</header>' +
    '<nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">' + renderNav() + '</nav>' +
    '<main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">' +
    '<div class="bg-card border border-game rounded-xl p-3">' +
    '<div class="flex flex-wrap gap-1">' + tabsHtml + '</div>' +
    '</div>' +
    // 人物属性 always shown
    '<div class="bg-card border border-game rounded-xl p-4">' + attrSectionHtml + '</div>' +
    (sheet === 'equipment' ? equipmentContent : '') +
    (sheet === 'forge' ? forgeContent : '') +
    (sheet === 'socket' ? renderSocketSheet() : '') +
    (sheet === 'refine' ? renderRefineSheet() : '') +
    (sheet === 'cultivation' ? renderCultivationSheet() : '') +
    '</main>' +
    '</div>';
}

// ==================== 打孔镶嵌 sheet（需求7） ====================
function renderSocketSheet() {
  // v2.2.0 需求2：打孔镶嵌功能等级锁定
  var gemUnlockLv = getFeatureUnlockLevel('gem');
  if (!isFeatureUnlocked('gem')) {
    return '<div class="bg-card border border-game rounded-xl p-6 text-center">' +
      '<div class="text-4xl mb-3">🔒</div>' +
      '<p class="text-secondary text-sm">打孔镶嵌功能将在 <span class="text-gold font-bold">Lv.' + gemUnlockLv + '</span> 解锁</p>' +
      '<p class="text-xs text-secondary mt-2">宝石工匠正在打磨他的工具：「给我一点时间，我马上就能为你镶嵌宝石了！」</p>' +
      '</div>';
  }
  var nailItem = G.inventory.find(function(i) { return i.id === 'socket_nail'; });
  var glueItem = G.inventory.find(function(i) { return i.id === 'repair_glue'; });
  var nailCount = nailItem ? nailItem.count : 0;
  var glueCount = glueItem ? glueItem.count : 0;
  var maxSlots = getMaxGemSlots();

  // 已装备列表
  var equippedList = [];
  if (G.player && G.player.equipment) {
    Object.keys(G.player.equipment).forEach(function(slotId) {
      var it = G.player.equipment[slotId];
      if (it) equippedList.push({ item: it, location: 'equipped', slotId: slotId });
    });
  }
  // 背包装备列表
  var bagList = G.equipmentBag.map(function(it, idx) {
    return { item: it, location: 'bag', idx: idx };
  });
  var allEquips = equippedList.concat(bagList);

  function getSocketInfoHtml(item) {
    if (!Array.isArray(item.gemSlots)) item.gemSlots = [];
    var count = item.gemSlots.length;
    var slotsDetail = item.gemSlots.map(function(gs, gidx) {
      var gdef = getGemType(gs.type);
      var gemName = gdef ? gdef.name : gs.type;
      var gemIcon = gdef ? gdef.icon : '❓';
      if (gs.gem && gs.gem.level > 0) {
        return '<span class="text-xs px-1.5 py-0.5 rounded ml-1" style="background:' + (gdef ? gdef.color : '#666') + '33;color:' + (gdef ? gdef.color : '#fff') + '">' + gemIcon + gemName.replace('宝石','') + '+' + gs.gem.level + '</span>';
      } else {
        return '<span class="text-xs px-1.5 py-0.5 rounded ml-1 text-secondary bg-panel">' + gemIcon + '空(' + gemName.replace('宝石','') + ')</span>';
      }
    }).join('');
    return '<div class="flex items-center gap-1 mt-1">' +
      '<span class="text-xs ' + (count >= maxSlots ? 'text-gold' : count > 0 ? 'text-cyan-400' : 'text-secondary') + '">孔洞 ' + count + '/' + maxSlots + '</span>' +
      slotsDetail +
      '</div>';
  }

  var equipsHtml = allEquips.map(function(entry) {
    var item = entry.item;
    var rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
    var slotInfo = EQUIPMENT_SLOTS.find(function(s) { return s.id === item.slot; });
    var isEquipped = entry.location === 'equipped';
    var count = Array.isArray(item.gemSlots) ? item.gemSlots.length : 0;
    var canSocket = count < maxSlots;
    var canReset = count > 0;
    var nextRate = canSocket ? Math.floor((SOCKET_SUCCESS_RATES[count] || 0) * 100) : 0;
    var baseStatStr = getEquipBaseStatText(item);
    var affixStr = (item.affixes || []).map(function(a) {
      var cls = a.special ? 'text-orange-400' : 'text-green-400';
      return '<span class="' + cls + ' ml-1">' + (typeof a.format === 'function' ? a.format(a.value) : ('+' + a.value)) + '</span>';
    }).join('');
    return '<div class="bg-panel border border-game rounded-lg p-3">' +
      '<div class="flex items-center justify-between">' +
      '<div class="flex-1">' +
      '<div class="flex items-center gap-1 mb-1">' +
      '<span class="text-sm">' + (slotInfo ? slotInfo.icon : '📦') + '</span>' +
      '<span class="text-xs font-bold" style="color:' + EQUIP_RARITY_COLORS[rarityIdx] + '">' + item.name + '</span>' +
      '<span class="text-xs text-secondary">Lv.' + item.level + (isEquipped ? ' · 已装备' : '') + '</span>' +
      '</div>' +
      '<div class="text-xs text-secondary">' + baseStatStr + ' ' + affixStr + '</div>' +
      getSocketInfoHtml(item) +
      (canSocket ? '<p class="text-xs text-green-400 mt-1">下一次打孔成功率：' + nextRate + '%</p>' : '<p class="text-xs text-gold mt-1">✨ 孔洞已满</p>') +
      '</div>' +
      '<div class="flex flex-col gap-1">' +
      (canSocket ? '<button class="btn-primary btn-sm text-xs" onclick="socketEquipment(\'' + item.id + '\')">🔨 打孔<br/><span class="text-xs opacity-75">(🔨×' + nailCount + ')</span></button>' : '') +
      (canReset ? '<button class="btn-danger btn-sm text-xs" onclick="resetSockets(\'' + item.id + '\')">🩹 重置<br/><span class="text-xs opacity-75">(🩹×' + glueCount + ')</span></button>' : '') +
      '</div>' +
      '</div>' +
      '</div>';
  }).join('');

  var rulesHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-3">🔩 打孔规则</h2>' +
    '<div class="text-xs text-secondary space-y-1">' +
    '<p>· 装备最多可拥有 <span class="text-gold">' + maxSlots + ' 个孔洞</span></p>' +
    '<p>· 打孔成功率随当前孔洞数递减：<span class="text-green-400">开第1孔 80%</span> / <span class="text-yellow-400">开第2孔 50%</span> / <span class="text-red-400">开第3孔 20%</span></p>' +
    '<p>· 打孔失败不消耗已有孔洞，仅消耗1个 <span class="text-cyan-400">🔨 打孔钉</span></p>' +
    '<p>· 新孔类型从该装备槽位可用宝石类型中随机</p>' +
    '<p>· <span class="text-yellow-400">🩹 修补胶</span> 可重置孔洞为0，已镶嵌宝石返还背包</p>' +
    '<p>· 已装备和背包中的装备均可打孔</p>' +
    '</div>' +
    '</div>';

  return '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
    '<h2 class="font-bold text-lg">🔩 打孔镶嵌</h2>' +
    '<div class="flex gap-3 text-xs">' +
    '<span>🔨 打孔钉 ×' + nailCount + '</span>' +
    '<span>🩹 修补胶 ×' + glueCount + '</span>' +
    '</div>' +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">为装备打孔以镶嵌宝石，提升属性。孔洞越多，可镶嵌的宝石越多。</p>' +
    (allEquips.length === 0 ? '<p class="text-center text-secondary py-8">暂无装备可打孔</p>' :
    '<div class="grid grid-cols-1 gap-2">' + equipsHtml + '</div>') +
    '</div>' +
    rulesHtml;
}

// ==================== 装备洗练 sheet（45级开启） ====================
function renderRefineSheet() {
  // 等级检查
  var unlockLv = getFeatureUnlockLevel('equip_refine');
  if (!isFeatureUnlocked('equip_refine')) {
    return '<div class="bg-card border border-game rounded-xl p-6 text-center">' +
      '<div class="text-4xl mb-3">🔒</div>' +
      '<p class="text-secondary text-sm">装备洗练功能将在 <span class="text-gold font-bold">Lv.' + unlockLv + '</span> 解锁</p>' +
      '<p class="text-xs text-secondary mt-2">洗练大师展示了神秘的洗练石：「重新洗练装备词条，追求完美属性，就在今日！」</p>' +
      '</div>';
  }

  var stoneItem = G.inventory.find(function(i) { return i.id === 'refine_stone'; });
  var stoneCount = stoneItem ? stoneItem.count : 0;

  // 收集可洗练装备（有词条的装备）
  var equippedList = [];
  if (G.player && G.player.equipment) {
    Object.keys(G.player.equipment).forEach(function(slotId) {
      var it = G.player.equipment[slotId];
      if (it && it.affixes && it.affixes.length > 0) {
        equippedList.push({ item: it, location: 'equipped', slotId: slotId });
      }
    });
  }
  var bagList = G.equipmentBag.filter(function(it) {
    return it && it.affixes && it.affixes.length > 0;
  }).map(function(it, idx) {
    return { item: it, location: 'bag', idx: idx };
  });
  var allEquips = equippedList.concat(bagList);

  function getAffixHtml(item) {
    return (item.affixes || []).map(function(a) {
      var cls = a.special ? 'text-orange-400' : 'text-green-400';
      var valStr = typeof a.format === 'function' ? a.format(a.value) : ('+' + a.value);
      return '<span class="' + cls + ' text-xs px-1.5 py-0.5 rounded bg-panel">' + valStr + '</span>';
    }).join(' ');
  }

  // 需求4：带定向刷新按钮的词条展示
  function getAffixHtmlWithRefine(item, canRefineSingle) {
    var singleGoldCost = Math.floor(getRefineGoldCost(item) * 0.6);
    return (item.affixes || []).map(function(a, idx) {
      var cls = a.special ? 'text-orange-400' : 'text-green-400';
      var valStr = typeof a.format === 'function' ? a.format(a.value) : ('+' + a.value);
      var refineBtn = canRefineSingle ?
        '<button class="btn-sm text-[10px] px-1 py-0.5 rounded bg-purple-800 text-purple-200 border border-purple-600 hover:bg-purple-700" onclick="refineEquipment(\'' + item.id + '\',' + idx + ')">🔄</button>' : '';
      return '<div class="flex items-center gap-1"><span class="' + cls + ' text-xs px-1.5 py-0.5 rounded bg-panel">' + valStr + '</span>' + refineBtn + '</div>';
    }).join(' ');
  }

  var equipsHtml = allEquips.map(function(entry) {
    var item = entry.item;
    var rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
    var slotInfo = EQUIPMENT_SLOTS.find(function(s) { return s.id === item.slot; });
    var isEquipped = entry.location === 'equipped';
    var affixCount = (item.affixes || []).length;
    var goldCost = getRefineGoldCost(item);
    var singleGoldCost = Math.floor(goldCost * 0.6);
    var canRefine = stoneCount > 0 && G.player.gold >= goldCost;
    var canRefineSingle = stoneCount > 0 && G.player.gold >= singleGoldCost;
    var baseStatStr = getEquipBaseStatText(item);
    var forgeLv = (G.player.forgeLevels && G.player.forgeLevels[item.slot]) || 0;

    return '<div class="bg-panel border border-game rounded-lg p-3">' +
      '<div class="flex items-center justify-between">' +
      '<div class="flex-1">' +
      '<div class="flex items-center gap-1 mb-1">' +
      '<span class="text-sm">' + (slotInfo ? slotInfo.icon : '📦') + '</span>' +
      '<span class="text-xs font-bold" style="color:' + EQUIP_RARITY_COLORS[rarityIdx] + '">' + item.name + '</span>' +
      '<span class="text-xs text-secondary">Lv.' + item.level + (isEquipped ? ' · 已装备' : '') + (forgeLv > 0 ? ' · +' + forgeLv : '') + '</span>' +
      '</div>' +
      '<div class="text-xs text-secondary mb-1">' + baseStatStr + '</div>' +
      // 需求4：每个词条旁显示定向刷新按钮
      '<div class="flex flex-wrap gap-1 mb-1">' + getAffixHtmlWithRefine(item, canRefineSingle) + '</div>' +
      '<div class="text-xs text-secondary">词条数：' + affixCount + '</div>' +
      '<div class="text-xs text-secondary">全部洗练：<span class="text-purple-400">🔮×1</span> + <span class="text-yellow-400">' + goldCost.toLocaleString() + '金币</span></div>' +
      '<div class="text-xs text-secondary">定向洗练：<span class="text-purple-400">🔮×1</span> + <span class="text-yellow-400">' + singleGoldCost.toLocaleString() + '金币</span></div>' +
      '</div>' +
      '<div class="flex flex-col gap-1">' +
      (canRefine ?
        '<button class="btn-primary btn-sm text-xs" onclick="refineEquipment(\'' + item.id + '\')">🔮 全部洗练</button>' :
        '<button class="btn-sm text-xs opacity-40" disabled>' + (stoneCount <= 0 ? '缺洗练石' : '金币不足') + '</button>') +
      '</div>' +
      '</div>' +
      '</div>';
  }).join('');

  var rulesHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-3">🔮 洗练规则</h2>' +
    '<div class="text-xs text-secondary space-y-1">' +
    '<p>· <span class="text-purple-400">全部洗练</span>：重新随机装备的<span class="text-green-400">所有词条</span>类型与数值</p>' +
    '<p>· 全部洗练消耗 <span class="text-purple-400">1个洗练石</span> + <span class="text-yellow-400">装备等级×200 金币</span></p>' +
    '<p>· <span class="text-cyan-400">定向洗练</span>：点击词条旁的🔄按钮，仅刷新该词条，其余保持不变</p>' +
    '<p>· 定向洗练消耗 <span class="text-purple-400">1个洗练石</span> + <span class="text-yellow-400">全额金币的60%</span></p>' +
    '<p>· 词条池包含21种词条：力量/体质/敏捷/耐力/魔力/气血/攻击/防御（数值&百分比）、暴击率、闪避率、宠物伤害/防御/气血</p>' +
    '<p>· <span class="text-orange-400">橙色装备</span>洗练后保证保留1个宠物专属词条（宠物伤害/防御/气血）</p>' +
    '<p>· 词条数值范围与装备生成时一致（数值类：level~level×3，百分比类：3%~12%）</p>' +
    '<p>· 洗练后词条立即生效，无法撤销，不满意可再次洗练</p>' +
    '<p>· 仅<span class="text-cyan-400">蓝色及以上</span>品质装备（有词条）可洗练</p>' +
    '</div>' +
    '</div>';

  return '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
    '<h2 class="font-bold text-lg">🔮 装备洗练</h2>' +
    '<div class="flex gap-3 text-xs">' +
    '<span>🔮 洗练石 ×' + stoneCount + '</span>' +
    '<span class="text-yellow-400">🪙 ' + G.player.gold.toLocaleString() + '</span>' +
    '</div>' +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">重新随机装备词条，追求完美属性搭配。高品质装备词条更多，洗练出极品属性的概率也更高。</p>' +
    (allEquips.length === 0 ? '<p class="text-center text-secondary py-8">暂无可洗练的装备<br/><span class="text-xs">需要蓝色及以上品质装备（含词条）</span></p>' :
    '<div class="grid grid-cols-1 gap-2">' + equipsHtml + '</div>') +
    '</div>' +
    rulesHtml;
}

// ==================== 人物修炼 sheet（20级开启） ====================
function renderCultivationSheet() {
  var unlockLv = getFeatureUnlockLevel('cultivation');
  if (!isFeatureUnlocked('cultivation')) {
    return '<div class="bg-card border border-game rounded-xl p-6 text-center">' +
      '<div class="text-4xl mb-3">🔒</div>' +
      '<p class="text-secondary text-sm">人物修炼功能将在 <span class="text-gold font-bold">Lv.' + unlockLv + '</span> 解锁</p>' +
      '<p class="text-xs text-secondary mt-2">修炼大师端坐在蒲团上：「内外兼修，方能突破极限。修炼你的伤害、抗性与辅助，让宠物也更加强大！」</p>' +
      '</div>';
  }

  if (!G.player.cultivation) G.player.cultivation = { 伤害: 0, 抗性: 0, 辅助: 0 };
  var cult = G.player.cultivation;
  var cultBonus = getCultivationBonus();

  var attrColors = { '伤害': '#ef4444', '抗性': '#3b82f6', '辅助': '#22c55e' };

  var cardsHtml = CULTIVATION_TYPES.map(function(attr) {
    var currentLv = cult[attr] || 0;
    var isMax = currentLv >= CULTIVATION_MAX_LEVEL;
    var goldCost = getCultivationGoldCost(currentLv);
    var canCultivate = !isMax && G.player.gold >= goldCost;
    var bonusPct = (currentLv * CULTIVATION_PER_LEVEL_BONUS * 100).toFixed(0);
    var pct = Math.floor((currentLv / CULTIVATION_MAX_LEVEL) * 100);
    var barColor = attrColors[attr] || '#888';
    var icon = CULTIVATION_TYPE_ICONS[attr] || '🌀';
    var typeName = CULTIVATION_TYPE_NAMES[attr] || attr;
    var typeDesc = CULTIVATION_TYPE_DESCS[attr] || '';

    var barHtml = '<div class="w-full bg-panel rounded-full h-2 mt-2 overflow-hidden">' +
      '<div class="h-full rounded-full transition-all" style="width:' + pct + '%;background:' + barColor + '"></div>' +
      '</div>';

    var stage = '初学';
    if (currentLv >= 40) stage = '宗师';
    else if (currentLv >= 30) stage = '大师';
    else if (currentLv >= 20) stage = '精通';
    else if (currentLv >= 10) stage = '熟练';

    return '<div class="bg-panel border border-game rounded-lg p-3">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<div class="flex items-center gap-2">' +
      '<span class="text-lg">' + icon + '</span>' +
      '<div>' +
      '<span class="text-sm font-bold" style="color:' + barColor + '">' + typeName + '</span>' +
      '<span class="text-xs text-secondary ml-1">· ' + stage + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="text-right">' +
      '<span class="text-sm font-bold text-gold">Lv.' + currentLv + '/' + CULTIVATION_MAX_LEVEL + '</span>' +
      '<span class="text-xs text-green-400 ml-1">(+' + bonusPct + '%)</span>' +
      '</div>' +
      '</div>' +
      '<p class="text-xs text-secondary">' + typeDesc + '</p>' +
      barHtml +
      '<div class="flex items-center justify-between mt-2">' +
      '<div class="text-xs">' +
      (isMax ? '<span class="text-gold">✅ 已满级</span>' :
      '<span class="text-yellow-400">下一级消耗：' + goldCost.toLocaleString() + ' 金币</span>') +
      '</div>' +
      '<div class="flex gap-1">' +
      (isMax ? '' :
        (canCultivate ?
          '<button class="btn-primary btn-sm text-xs" onclick="cultivateAttribute(\'' + attr + '\')">🌀 修炼</button>' :
          '<button class="btn-sm text-xs opacity-40" disabled>金币不足</button>') +
        '<button class="btn-gold btn-sm text-xs" onclick="cultivateMax(\'' + attr + '\')" ' + (G.player.gold < goldCost ? 'disabled style="opacity:0.4"' : '') + '>⚡ 一键</button>'
      ) +
      '</div>' +
      '</div>' +
      '</div>';
  }).join('');

  var totalLevels = (cult.伤害 || 0) + (cult.抗性 || 0) + (cult.辅助 || 0);

  var summaryHtml = '<div class="bg-card border border-game rounded-xl p-4 mb-3">' +
    '<div class="flex items-center justify-between mb-2">' +
    '<h2 class="font-bold text-lg">🌀 修炼总览</h2>' +
    '<span class="text-sm text-yellow-400">🪙 ' + G.player.gold.toLocaleString() + '</span>' +
    '</div>' +
    '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">' +
    '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-xs text-secondary">总修炼等级</p><p class="text-lg font-bold text-gold">' + totalLevels + '/' + (CULTIVATION_MAX_LEVEL * 3) + '</p></div>' +
    '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-xs text-secondary">伤害加成</p><p class="text-lg font-bold text-red-400">+' + (cultBonus.dmgBonus * 100).toFixed(0) + '%</p></div>' +
    '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-xs text-secondary">伤害减免</p><p class="text-lg font-bold text-blue-400">+' + (cultBonus.dmgReduce * 100).toFixed(0) + '%</p></div>' +
    '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-xs text-secondary">治疗加成</p><p class="text-lg font-bold text-green-400">+' + (cultBonus.healBonus * 100).toFixed(0) + '%</p></div>' +
    '</div>' +
    '</div>';

  var rulesHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-3">🌀 修炼规则</h2>' +
    '<div class="text-xs text-secondary space-y-1">' +
    '<p>· 需求5：修炼不再增加基础属性，而是提供<span class="text-green-400">最终伤害加成/减免</span></p>' +
    '<p>· <span class="text-red-400">⚔️ 伤害修炼</span>：增加宠物最终结算伤害加成（每级+2%）</p>' +
    '<p>· <span class="text-blue-400">🛡️ 抗性修炼</span>：提供最终伤害减免（每级+2%）</p>' +
    '<p>· <span class="text-green-400">💚 辅助修炼</span>：提升治疗效果加成（每级+2%）</p>' +
    '<p>· 计算公式：伤害 = 攻击力 × 技能系数 × (1 + 装备宠物伤害加成) × (1 + 修炼等级 × 0.02)</p>' +
    '<p>· 每条修炼轨道最高 <span class="text-gold">' + CULTIVATION_MAX_LEVEL + ' 级</span></p>' +
    '<p>· 修炼消耗金币，随等级递增：</p>' +
    '<p class="pl-4">· 1-10级：2,000~20,000 金币/级</p>' +
    '<p class="pl-4">· 11-20级：55,000~105,000 金币/级</p>' +
    '<p class="pl-4">· 21-30级：210,000~310,000 金币/级</p>' +
    '<p class="pl-4">· 31-40级：620,000~820,000 金币/级</p>' +
    '<p class="pl-4">· 41-50级：2,050,000~2,550,000 金币/级</p>' +
    '<p>· 修炼阶段：初学(0) → 熟练(10) → 精通(20) → 大师(30) → 宗师(40)</p>' +
    '<p>· <span class="text-yellow-400">⚡一键修炼</span>：连续修炼直到金币不足或满级（单次最多100级）</p>' +
    '<p>· 修炼加成<span class="text-purple-400">永久生效</span>，转生后保留</p>' +
    '</div>' +
    '</div>';

  return summaryHtml +
    '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h2 class="font-bold text-lg mb-3">🌀 三维修炼</h2>' +
    '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">' + cardsHtml + '</div>' +
    '</div>' +
    rulesHtml;
}

function renderEggScreen() {
  const shardKeys = Object.keys(G.eggShards).filter(k => (G.eggShards[k] || 0) > 0);
  const eggTierFilter = window._eggTierFilter || 'all';
  const filteredEggs = G.eggs.filter(egg => {
    if (eggTierFilter === 'all') return true;
    return egg.tier === parseInt(eggTierFilter);
  });
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🥚 宠物蛋</h1>
      <div class="flex items-center gap-3">
        <span class="text-sm text-secondary">共 ${G.eggs.length} 颗蛋</span>
        <span class="text-sm">孵化石：<span class="text-cyan-400 font-bold">🪨 ${G.hatchStones || 0}</span></span>
      </div>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full">
      <div class="bg-card border border-game rounded-xl p-3 mb-4 text-xs text-secondary">
        <p>💡 <span class="text-gold">孵化规则</span>：孵化需消耗1颗<span class="text-cyan-400">孵化石</span>。蛋的品质默认隐藏，可花金币鉴定：</p>
        <p class="mt-1">鉴定技能（1000金币）→ 鉴定成长（5000金币）→ 鉴定资质（20000金币）</p>
      </div>
      ${shardKeys.length > 0 ? `
      <div class="bg-card border border-game rounded-xl p-4 mb-4">
        <h2 class="font-bold text-lg mb-3">💎 蛋碎片</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          ${shardKeys.map(k => {
            const count = G.eggShards[k] || 0;
            const tier = parseInt(k);
            const color = RARITY_COLORS[Math.min(tier, 5)];
            const canCraft = count >= 5;
            return `
            <div class="bg-panel border border-game rounded-lg p-3 text-center">
              <div class="text-2xl mb-1">💎</div>
              <p class="text-xs font-bold" style="color:${color}">T${tier+1} 碎片</p>
              <p class="text-gold text-sm">x${count}</p>
              <button class="btn-gold btn-sm mt-1 w-full text-xs" ${!canCraft ? 'disabled style="opacity:0.4"' : ''}
                onclick="craftEggFromShards(${tier})">${canCraft ? '合成蛋' : '需5个'}</button>
            </div>`;
          }).join('')}
        </div>
      </div>
      ` : ''}
      <div class="bg-card border border-game rounded-xl p-4 mb-4">
        <h2 class="font-bold text-sm mb-2">🔍 按等级筛选</h2>
        <div class="flex flex-wrap gap-2">
          <button class="btn-sm ${eggTierFilter === 'all' ? 'btn-primary' : 'text-xs px-3 py-1 rounded border border-game text-secondary'}" onclick="setEggTierFilter('all')">全部</button>
          ${[0,1,2,3,4].map(t => `<button class="btn-sm ${eggTierFilter === String(t) ? 'btn-primary' : 'text-xs px-3 py-1 rounded border border-game text-secondary'}" onclick="setEggTierFilter('${t}')" style="${eggTierFilter === String(t) ? '' : 'color:'+RARITY_COLORS[t]}">T${t+1}</button>`).join('')}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4 mb-4">
        <h2 class="font-bold text-sm mb-2">♻️ 批量分解</h2>
        <p class="text-xs text-secondary mb-2">分解选中T级的所有未孵化蛋（孵化中的蛋不会分解），获得对应T级碎片</p>
        <div class="flex flex-wrap gap-2">
          ${[0,1,2,3,4].map(t => {
            var count = G.eggs.filter(e => e.tier === t && !e.isHatching).length;
            return '<button class="btn-sm text-xs px-3 py-1 rounded border border-game ' + (count > 0 ? 'btn-danger' : 'text-secondary') + '" ' + (count > 0 ? '' : 'disabled style="opacity:0.4"') + ' onclick="batchDecomposeEggs(' + t + ')">分解T' + (t+1) + ' (' + count + '个)</button>';
          }).join('')}
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${filteredEggs.length === 0 ? '<p class="text-secondary col-span-full text-center py-8">没有符合条件的宠物蛋</p>' : ''}
        ${(() => {
          var pg = paginateList('eggs', filteredEggs.length, 12);
          var start = (pg.page - 1) * pg.pageSize;
          var slice = filteredEggs.slice(start, start + pg.pageSize);
          return slice.map(egg => {
          const pet = egg.petData;
          // 隐藏蛋的品质：未孵化前不显示T级别和稀有度颜色
          // 已鉴定信息按 revealed.skills / growth / aptitude 显示
          var reveal = egg.revealed || { skills:false, growth:false, aptitude:false };
          // 兼容旧存档：若有 attributes 而无新字段，将 attributes 视为 aptitude
          if (egg.revealed && egg.revealed.attributes && !reveal.aptitude) reveal.aptitude = true;
          return `
          <div class="bg-card border border-game rounded-xl p-4 ${egg.isHatching ? 'animate-pulse-glow' : ''}" style="border-color:#475569">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-secondary">T${egg.tier + 1} 神秘蛋</span>
              <span class="text-xs text-secondary">鉴定 Lv.${egg.appraisalLevel}/3</span>
            </div>
            <div class="text-center text-4xl my-3 ${egg.isHatching ? 'animate-egg-crack' : 'animate-float'}">🥚</div>
            ${reveal.skills ? `<p class="text-xs text-cyan-300 mb-1">技能：${pet.innateSkills.map(s=>s.name).join('、')}</p>` : '<p class="text-xs text-secondary mb-1">技能未鉴定</p>'}
            ${reveal.growth ? `<p class="text-xs text-gold mb-1">成长：${pet.growth.toFixed(2)}</p>` : '<p class="text-xs text-secondary mb-1">成长未鉴定</p>'}
            ${reveal.aptitude ? `
              <div class="text-xs space-y-1 mb-2">
                <p class="text-secondary">种族：${pet.race}</p>
                ${pet.aptitude ? Object.keys(pet.aptitude).map(k => `<span class="text-secondary mr-2">${k}:${pet.aptitude[k]}</span>`).join('') : ''}
              </div>` : '<p class="text-xs text-secondary mb-1">资质未鉴定</p>'}
            ${egg.isHatching ? `
              <div class="mb-2">
                <div class="progress-bar"><div class="progress-fill bg-gradient-to-r from-yellow-500 to-orange-500" style="width:${Math.floor(egg.hatchProgress/egg.hatchTime*100)}%"></div></div>
                <p class="text-xs text-secondary mt-1">孵化中 ${Math.floor(egg.hatchProgress)}/${egg.hatchTime}s</p>
              </div>
            ` : ''}
            <div class="flex flex-wrap gap-1 mt-2">
              ${!egg.isHatching ? `<button class="btn-primary btn-sm" onclick="startHatch('${egg.id}')">孵化(🪨1)</button>` : `<button class="btn-primary btn-sm" onclick="useHatchBoost('${egg.id}')">⚡加速(⚡1)</button>`}
              ${egg.isHatching ? `<button class="btn-gold btn-sm" onclick="useHatchCrystal('${egg.id}')">🔮结晶</button>` : ''}
              ${egg.appraisalLevel < 1 ? `<button class="btn-gold btn-sm" onclick="appraiseEggUI('${egg.id}',1)">鉴定技能(1k)</button>` : ''}
              ${egg.appraisalLevel < 2 ? `<button class="btn-gold btn-sm" onclick="appraiseEggUI('${egg.id}',2)">鉴定成长(5k)</button>` : ''}
              ${egg.appraisalLevel < 3 ? `<button class="btn-gold btn-sm" onclick="appraiseEggUI('${egg.id}',3)">鉴定资质(20k)</button>` : ''}
              <button class="btn-danger btn-sm" onclick="decomposeEgg('${egg.id}')">分解</button>
            </div>
          </div>`;
          }).join('') + pg.controlsHtml;
        })()}
      </div>
    </main>
  </div>`;
}

// 出售：根据商城价格80%返还（道具返还对应货币，技能书返还钻石）
function getItemSellPrice(itemId) {
  const shopItem = SHOP_ITEMS.find(s => s.id === itemId);
  if (!shopItem || !shopItem.price) return null;
  const currency = shopItem.currency === 'diamond' ? 'diamond' : 'gold';
  const amount = Math.floor(shopItem.price * 0.8);
  return { currency, amount };
}
function getSkillBookSellPrice(skillId) {
  // 在所有技能书分页中查找定价
  var found = null;
  ['active', 'passive_t1', 'passive_t2', 'passive_t3', 'aura_t1', 'aura_t2', 'aura_t3'].forEach(function(cat) {
    if (found) return;
    const list = SKILL_BOOK_SHOP[cat] || [];
    const m = list.find(s => s.id === skillId);
    if (m && m.price) found = m;
  });
  if (!found) return { currency: 'diamond', amount: 12 }; // 兜底价
  return { currency: 'diamond', amount: Math.floor(found.price * 0.8) };
}
function sellInventoryItem(itemId, qty) {
  qty = qty || 1;
  const item = G.inventory.find(i => i.id === itemId);
  if (!item || item.count < qty) { showToast('数量不足', 'error'); return; }
  const price = getItemSellPrice(itemId);
  if (!price) { showToast('该道具无法出售', 'error'); return; }
  item.count -= qty;
  if (item.count <= 0) G.inventory = G.inventory.filter(i => i.id !== itemId);
  if (price.currency === 'diamond') addDiamond(price.amount * qty);
  else addGold(price.amount * qty);
  saveGame();
  const curIcon = price.currency === 'diamond' ? '💎' : '🪙';
  showToast(`出售 ${getItemName(itemId)} ×${qty}，获得 ${price.amount * qty} ${curIcon}`, 'success');
  if (currentScreen === 'inventory') render();
}
function sellSkillBook(skillId, qty) {
  qty = qty || 1;
  const book = G.skillBooks.find(b => b.id === skillId);
  if (!book || book.count < qty) { showToast('数量不足', 'error'); return; }
  const price = getSkillBookSellPrice(skillId);
  book.count -= qty;
  if (book.count <= 0) G.skillBooks = G.skillBooks.filter(b => b.id !== skillId);
  addDiamond(price.amount * qty);
  saveGame();
  const skill = getSkillById(skillId);
  showToast(`出售 ${skill ? skill.name : skillId} ×${qty}，获得 ${price.amount * qty} 💎`, 'success');
  if (currentScreen === 'inventory') render();
}
function sellInventoryItemAll(itemId) {
  const item = G.inventory.find(i => i.id === itemId);
  if (!item) return;
  sellInventoryItem(itemId, item.count);
}
function sellSkillBookAll(skillId) {
  const book = G.skillBooks.find(b => b.id === skillId);
  if (!book) return;
  sellSkillBook(skillId, book.count);
}
// ==================== 阵法管理页 ====================
function renderFormationScreen() {
  var learnedCount = Object.keys(G.formations || {}).length;
  // 需求2：阵法修炼活动已移到活动页面（押镖），此处仅展示阵法图鉴

  // 当前激活阵法的详情
  var activeInfoHtml = '';
  if (G.activeFormation && G.formations[G.activeFormation]) {
    var f = FORMATIONS.find(x => x.id === G.activeFormation);
    var lf = G.formations[G.activeFormation];
    if (f) {
      var mult = getFormationLevelMult(lf.level);
      activeInfoHtml = '<div class="bg-card border rounded-xl p-3 mb-4" style="border-color:' + f.color + '">' +
        '<div class="flex items-center gap-2 mb-2">' +
          '<span class="text-2xl">' + f.icon + '</span>' +
          '<div>' +
            '<p class="font-bold" style="color:' + f.color + '">' + f.name + '（Lv.' + lf.level + '/' + FORMATION_MAX_LEVEL + '）</p>' +
            '<p class="text-xs text-secondary">' + f.desc + '</p>' +
          '</div>' +
          '<span class="ml-auto text-xs text-gold">效果倍率 ×' + mult.toFixed(1) + '</span>' +
        '</div>' +
        '<div class="grid grid-cols-3 gap-2 text-xs">' +
          ['front','mid','back'].map(function(pos) {
            var posInfo = FORMATION_POSITIONS.find(p => p.id === pos);
            var pb = f.bonus[pos] || {};
            var bonusStr = Object.keys(pb).map(function(k) {
              var labelMap = { atkPct:'攻击力', defPct:'防御力', hpPct:'气血', spdPct:'速度', intPct:'灵力', critRate:'暴击率', critDmg:'暴击伤害', dodgeRate:'闪避', hitRate:'命中', dmgReduce:'减伤', magicDmgPct:'法术伤害', mpPct:'魔法值', allPct:'全属性' };
              return (labelMap[k]||k) + ' +' + Math.round((pb[k]*mult)*100) + '%';
            }).join('、') || '无加成';
            return '<div class="bg-panel rounded p-2"><p class="font-bold" style="color:' + (pos==='front'?'#ef4444':pos==='mid'?'#f59e0b':'#3b82f6') + '">' + posInfo.icon + ' ' + posInfo.name + '</p><p class="text-secondary">' + bonusStr + '</p></div>';
          }).join('') +
        '</div>' +
        '<button class="btn-danger btn-sm mt-2" onclick="setActiveFormation(null)">取消激活</button>' +
      '</div>';
    }
  } else {
    activeInfoHtml = '<div class="bg-card border border-game rounded-xl p-3 mb-4"><p class="text-secondary text-sm text-center">当前未激活任何阵法，请学习阵法后在下方激活</p></div>';
  }

  // 阵法列表
  var formationsHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
      '<h2 class="font-bold text-lg">📜 阵法图鉴（' + learnedCount + '/' + FORMATIONS.length + '）</h2>' +
    '</div>' +
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
      FORMATIONS.map(function(f) {
        var learned = G.formations[f.id];
        var isActive = G.activeFormation === f.id;
        var bookCount = getFormationBookCount(f.id);
        var mult = learned ? getFormationLevelMult(learned.level) : 1;
        var bonusPreview = ['front','mid','back'].map(function(pos) {
          var pb = f.bonus[pos] || {};
          var posInfo = FORMATION_POSITIONS.find(p => p.id === pos);
          var labelMap = { atkPct:'攻', defPct:'防', hpPct:'血', spdPct:'速', intPct:'灵', critRate:'暴', critDmg:'暴伤', dodgeRate:'闪', hitRate:'命', dmgReduce:'减伤', magicDmgPct:'法伤', mpPct:'法力', allPct:'全' };
          var s = Object.keys(pb).map(function(k) { return (labelMap[k]||k) + '+' + Math.round(pb[k]*mult*100) + '%'; }).join(',');
          return posInfo.name + ':' + (s || '无');
        }).join(' | ');
        return '<div class="bg-panel border rounded-xl p-3" style="border-color:' + (isActive ? f.color : '#333') + (isActive ? ';box-shadow:0 0 12px ' + f.color + '44' : '') + '">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span class="text-2xl">' + f.icon + '</span>' +
            '<div class="flex-1">' +
              '<p class="font-bold" style="color:' + f.color + '">' + f.name + (learned ? ' Lv.' + learned.level + '/' + FORMATION_MAX_LEVEL : '（未学习）') + '</p>' +
              '<p class="text-xs text-secondary">' + f.desc + '</p>' +
            '</div>' +
            (isActive ? '<span class="text-xs text-gold font-bold">✓ 已激活</span>' : '') +
          '</div>' +
          '<p class="text-xs text-secondary mb-2">📍 ' + bonusPreview + '</p>' +
          (learned ?
            '<div class="bg-card rounded p-2 mb-2">' +
              '<p class="text-xs text-secondary">经验：' + (learned.exp || 0) + '/' + (learned.level >= FORMATION_MAX_LEVEL ? '★' : getFormationExpForLevel(learned.level)) + ' · 持有书：' + bookCount + '</p>' +
              '<div class="progress-bar mt-1"><div class="progress-fill" style="width:' + (learned.level >= FORMATION_MAX_LEVEL ? 100 : Math.floor((learned.exp||0)/getFormationExpForLevel(learned.level)*100)) + '%;background:' + f.color + '"></div></div>' +
            '</div>' +
            '<div class="flex gap-1">' +
              (learned.level < FORMATION_MAX_LEVEL ?
                '<button class="btn-primary btn-sm flex-1" ' + (bookCount < 1 ? 'disabled style="opacity:0.4"' : '') + ' onclick="upgradeFormation(\'' + f.id + '\')">📖 升级 (×1书)</button>' +
                '<button class="btn-gold btn-sm flex-1" ' + (bookCount < 1 ? 'disabled style="opacity:0.4"' : '') + ' onclick="upgradeFormationMax(\'' + f.id + '\')">⚡ 一键升级 (' + bookCount + '书)</button>'
                : '<p class="text-xs text-gold flex-1 text-center py-1">⭐ 已满级</p>'
              ) +
              (isActive ? '' : '<button class="btn-sm border border-game" style="color:' + f.color + '" onclick="setActiveFormation(\'' + f.id + '\')">激活</button>') +
              (isActive ? '' : '<button class="btn-sm border border-red-700 text-red-400" onclick="if(confirm(\'分解《' + f.name + '》？将获得' + (1 + (learned.level||1)) + '个阵法碎片\'))decomposeFormation(\'' + f.id + '\')">🔄 分解</button>') +
            '</div>'
          :
            '<button class="btn-primary btn-sm w-full" ' + (bookCount < 1 ? 'disabled style="opacity:0.4"' : '') + ' onclick="learnFormation(\'' + f.id + '\')">📖 学习（需1本阵法书，持有 ' + bookCount + '）</button>'
          ) +
        '</div>';
      }).join('') +
    '</div>' +
  '</div>';

  return '<div class="min-h-screen flex flex-col">' +
    '<header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">' +
      '<h1 class="font-fantasy text-gold text-lg">🎴 阵法</h1>' +
      '<div class="flex gap-3 text-sm">' +
        '<span class="text-yellow-400">🪙 ' + G.player.gold.toLocaleString() + '</span>' +
        '<span class="text-blue-400">💎 ' + G.player.diamond.toLocaleString() + '</span>' +
        '<span class="text-purple-400">🧩 ' + (G.formationFragments || 0) + '碎片</span>' +
      '</div>' +
    '</header>' +
    '<nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">' + renderNav() + '</nav>' +
    '<main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">' +
      activeInfoHtml +
      formationsHtml +
      '<div class="bg-card border border-game rounded-xl p-4">' +
        '<h2 class="font-bold text-lg mb-2">🧩 阵法碎片合成</h2>' +
        '<p class="text-xs text-secondary mb-3">分解不需要的阵法可获得碎片，5个碎片可合成1本随机阵法书</p>' +
        '<div class="flex items-center gap-3">' +
          '<span class="text-purple-400 font-bold">当前碎片：' + (G.formationFragments || 0) + '</span>' +
          '<button class="btn-primary btn-sm" ' + ((G.formationFragments || 0) < 5 ? 'disabled style="opacity:0.4"' : '') + ' onclick="synthesizeFormation()">🎴 合成随机阵法书（5碎片）</button>' +
        '</div>' +
      '</div>' +
    '</main>' +
  '</div>';
}

function renderInventoryScreen() {
  const items = G.inventory.filter(i => i.count > 0);
  const books = G.skillBooks.filter(b => b.count > 0);
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3">
      <h1 class="font-fantasy text-gold text-lg">🎒 背包</h1>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      ${books.length > 0 ? `
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">📖 技能书<span class="text-xs text-secondary font-normal ml-2">（点击出售可获商城价80%钻石）</span></h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          ${(() => {
            var pg = paginateList('skillbooks', books.length, 12);
            var start = (pg.page - 1) * pg.pageSize;
            var slice = books.slice(start, start + pg.pageSize);
            return slice.map(b => {
            const skill = getSkillById(b.id);
            const name = skill ? skill.name : b.id;
            const type = skill ? skill.type : 'passive';
            const desc = skill ? skill.desc : '';
            const sp = getSkillBookSellPrice(b.id);
            return `
            <div class="bg-panel border border-game rounded-xl p-3 text-center">
              <div class="text-3xl mb-1">📖</div>
              <p class="font-bold text-sm">${name}</p>
              <span class="text-xs px-1.5 py-0.5 rounded ${type === 'active' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'}">${type === 'active' ? '主动' : '被动'}</span>
              <p class="text-xs text-secondary mt-1">${desc}</p>
              <p class="text-gold text-sm mt-1">x${b.count}</p>
              <p class="text-xs text-cyan-300 mt-1">出售：${sp.amount}💎/本</p>
              <div class="flex gap-1 mt-2">
                <button class="btn-primary btn-sm flex-1 text-xs" onclick="sellSkillBook('${b.id}',1)">出售1</button>
                <button class="btn-gold btn-sm flex-1 text-xs" onclick="sellSkillBookAll('${b.id}')" ${b.count <= 1 ? 'disabled style="opacity:0.5"' : ''}>全部</button>
              </div>
            </div>`;
            }).join('') + pg.controlsHtml;
          })()}
        </div>
      </div>
      ` : ''}
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">📦 道具<span class="text-xs text-secondary font-normal ml-2">（出售可获商城价80%返还）</span></h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          ${items.length === 0 ? '<p class="text-secondary col-span-full text-center py-8">背包空空如也</p>' : ''}
          ${(() => {
            var pg = paginateList('items', items.length, 12);
            var start = (pg.page - 1) * pg.pageSize;
            var slice = items.slice(start, start + pg.pageSize);
            return slice.map(item => {
            const shopItem = SHOP_ITEMS.find(s => s.id === item.id);
            const icon = shopItem ? shopItem.icon : (item.id === 'moon_dew' ? '🌙' : item.id === 'divine_essence' ? '✨' : '📦');
            const sp = getItemSellPrice(item.id);
            const curIcon = sp && sp.currency === 'diamond' ? '💎' : '🪙';
            return `
            <div class="bg-panel border border-game rounded-xl p-3 text-center">
              <div class="text-3xl mb-1">${icon}</div>
              <p class="font-bold text-sm">${getItemName(item.id)}</p>
              <p class="text-gold text-sm">x${item.count}</p>
              ${sp ? `<p class="text-xs text-cyan-300 mt-1">出售：${sp.amount}${curIcon}/个</p>` : ''}
              ${item.id === 'hatch_boost' ? `<button class="btn-primary btn-sm mt-2 w-full" onclick="useHatchBoost()">使用</button>` : ''}
              ${item.id === 'moon_dew' ? `<button class="btn-gold btn-sm mt-2 w-full" onclick="useMoonDew()">🌙 使用</button>` : ''}
              ${item.id === 'dig_map' ? `<button class="btn-gold btn-sm mt-2 w-full" onclick="startDigSession()">🗺️ 开始挖宝</button>` : ''}
              ${item.id === 'divine_essence' ? `<button class="btn-gold btn-sm mt-2 w-full" onclick="useDivineEssenceExchange()">✨ 兑换神兽</button>` : ''}
              ${(item.id === 'lifespan_low' || item.id === 'lifespan_mid' || item.id === 'lifespan_high') ? `<button class="btn-gold btn-sm mt-2 w-full" onclick="showLifespanItemModal('${item.id}')">💊 使用</button>` : ''}
              ${item.id === 'pet_reset_pill' ? `<button class="btn-gold btn-sm mt-2 w-full" onclick="showPetResetPillModal()">🧪 使用</button>` : ''}
              ${(item.id === 'gold_chest_small' || item.id === 'gold_chest_mid' || item.id === 'gold_chest_large') ? `<button class="btn-gold btn-sm mt-2 w-full" onclick="useGoldChest('${item.id}')">💰 打开</button>` : ''}
              ${(item.id === 'treasure_fragment_1' || item.id === 'treasure_fragment_2' || item.id === 'treasure_fragment_3' || item.id === 'treasure_fragment_4' || item.id === 'treasure_fragment_5') ? `<button class="btn-gold btn-sm mt-2 w-full" onclick="synthesizeTreasureMap()">🔮 合成密藏图</button>` : ''}
              ${sp ? `<div class="flex gap-1 mt-2">
                <button class="btn-primary btn-sm flex-1 text-xs" onclick="sellInventoryItem('${item.id}',1)">出售1</button>
                <button class="btn-gold btn-sm flex-1 text-xs" onclick="sellInventoryItemAll('${item.id}')" ${item.count <= 1 ? 'disabled style="opacity:0.5"' : ''}>全部</button>
              </div>` : ''}
            </div>`;
            }).join('') + pg.controlsHtml;
          })()}
        </div>
      </div>
    </main>
  </div>`;
}

// ==================== 宠物装备系统界面 ====================
function renderPetEquipScreen() {
  var peTab = window._peTab || 'bag';
  var tabsHtml = (function() {
    // 需求：合并「宠物装备背包」与「装备管理」为同一页面
    var tabs = [
      { id: 'bag', label: '🎒 装备背包与管理' },
      { id: 'craft', label: '🔨 打造' },
      { id: 'rune', label: '📜 符文' },
    ];
    return '<div class="bg-card border border-game rounded-xl p-1 flex gap-1">' + tabs.map(function(t) {
      var active = peTab === t.id;
      return '<button class="flex-1 text-sm px-3 py-1.5 rounded ' + (active ? 'bg-purple-900 text-purple-300 border border-purple-500' : 'border border-transparent text-secondary hover:bg-panel') + '" onclick="window._peTab=\'' + t.id + '\';render()">' + t.label + '</button>';
    }).join('') + '</div>';
  })();
  // 需求：材料信息仅保留在「打造」页面中展示，其余入口不再显示
  var matHtml = (peTab === 'craft') ? (function() {
    // 需求4：已移除兽皮通用材料，仅保留水晶和符文按低/中/高级分组
    var crystalRow = [
      { id: 'mystic_crystal_low', name: '低级', color: '#9ca3af' },
      { id: 'mystic_crystal_mid', name: '中级', color: '#3b82f6' },
      { id: 'mystic_crystal_high', name: '高级', color: '#f59e0b' },
    ].map(function(t) {
      var cnt = G.petEquipMaterials[t.id] || 0;
      return '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
        '<div class="text-2xl">💠</div>' +
        '<p class="text-xs mt-1" style="color:' + t.color + '">' + t.name + '神秘水晶</p>' +
        '<p class="text-gold text-sm">x' + cnt + '</p>' +
        '</div>';
    }).join('');
    var runeRow = [
      { id: 'war_book_low', name: '低级', color: '#9ca3af' },
      { id: 'war_book_mid', name: '中级', color: '#3b82f6' },
      { id: 'war_book_high', name: '高级', color: '#f59e0b' },
    ].map(function(t) {
      var cnt = G.petEquipMaterials[t.id] || 0;
      return '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
        '<div class="text-2xl">📖</div>' +
        '<p class="text-xs mt-1" style="color:' + t.color + '">' + t.name + '战兵图册</p>' +
        '<p class="text-gold text-sm">x' + cnt + '</p>' +
        '</div>';
    }).join('');
    return '<div class="bg-card border border-game rounded-xl p-3">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<span class="text-sm font-bold">📦 宠物装备材料</span>' +
      '</div>' +
      '<p class="text-xs text-secondary mb-1">💠 神秘水晶（按品质分级）</p>' +
      '<div class="grid grid-cols-3 gap-2 mb-2">' + crystalRow + '</div>' +
      '<p class="text-xs text-secondary mb-1">📖 战兵图册（按品质分级）</p>' +
      '<div class="grid grid-cols-3 gap-2">' + runeRow + '</div>' +
      '</div>';
  })() : '';

  var contentHtml = '';
  if (peTab === 'bag') {
    // 宠物装备背包
    var bag = G.petEquipBag || [];
    var pg = paginateList('pebag', bag.length, 12);
    var start = (pg.page - 1) * pg.pageSize;
    var slice = bag.slice(start, start + pg.pageSize);
    contentHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">🎽 宠物装备背包 (' + bag.length + ')</h2>' +
      (bag.length === 0 ? '<p class="text-secondary text-center py-8">还没有宠物装备，去宠物秘境或打造获得！</p>' :
        '<div class="bg-panel rounded-lg p-2 mb-3 flex flex-wrap gap-2 items-center">' +
          '<span class="text-xs text-secondary">批量操作：</span>' +
'<button class="btn-gold btn-sm text-xs" onclick="if(confirm(\'分解所有史诗及以下装备？\'))batchDecomposePetEquip(\'epic\')">♻️ 批量分解(史诗及以下)</button>' +
'<button class="btn-gold btn-sm text-xs" onclick="if(confirm(\'分解所有稀有装备？\'))batchDecomposePetEquip(\'rare\')">♻️ 批量分解(稀有及以下)</button>' +
'<button class="btn-gold btn-sm text-xs" onclick="if(confirm(\'分解所有优秀装备？\'))batchDecomposePetEquip(\'uncommon\')">♻️ 批量分解(优秀)</button>' +
'<button class="btn-danger btn-sm text-xs" onclick="if(confirm(\'出售所有史诗及以下装备？\'))batchSellPetEquip(\'epic\')">💰 批量出售(史诗及以下)</button>' +
'<button class="btn-danger btn-sm text-xs" onclick="if(confirm(\'出售所有稀有装备？\'))batchSellPetEquip(\'rare\')">💰 批量出售(稀有及以下)</button>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">' +
        slice.map(function(e) {
          var rarityIdx = PET_EQUIP_RARITIES.indexOf(e.rarity);
          var slotInfo = PET_EQUIP_SLOTS.find(function(s) { return s.id === e.slot; });
          var affixStr = (e.affixes || []).map(function(a) {
            var def = PET_AFFIX_TYPES.find(function(t) { return t.id === a.id; });
            return def ? '<span class="text-green-400 ml-1">' + def.format(a.value) + '</span>' : '';
          }).join('');
          var setInfo = e.setId ? (function() {
            var set = PET_EQUIP_SETS.find(function(s) { return s.id === e.setId; });
            return set ? '<div class="text-xs font-bold mt-1" style="color:' + set.color + '">[' + set.name + '套装]</div><div class="text-[10px] text-secondary mt-0.5">2件：' + set.desc + '</div><div class="text-[10px] text-secondary">3件：' + set.desc3 + '</div>' : '';
          })() : '';
          return '<div class="bg-panel border border-game rounded-lg p-3">' +
            '<div class="flex items-center gap-1 mb-1">' +
            '<span class="text-sm">' + (slotInfo ? slotInfo.icon : '📦') + '</span>' +
            '<span class="text-xs font-bold" style="color:' + PET_EQUIP_RARITY_COLORS[rarityIdx] + '">' + e.name + '</span>' +
            '<span class="text-xs text-secondary">Lv.' + e.level + '</span>' +
            '</div>' +
            '<div class="text-xs text-secondary">基础：' + e.baseStat + ' +' + e.baseValue + '</div>' +
            '<div class="text-xs text-secondary">' + affixStr + '</div>' +
            setInfo +
            '<div class="flex gap-1 mt-2">' +
            '<button class="btn-primary btn-sm text-xs flex-1" onclick="showPetEquipBagForPet(\'' + e.id + '\')">装备</button>' +
            '<button class="btn-gold btn-sm text-xs" onclick="decomposePetEquip(\'' + e.id + '\')">分解</button>' +
            '<button class="btn-danger btn-sm text-xs" onclick="sellPetEquip(\'' + e.id + '\')">出售</button>' +
            '</div>' +
            '</div>';
        }).join('') + '</div>' + pg.controlsHtml) +
      '</div>';
    // 需求：合并装备管理到同一页面 - 在背包下方显示宠物装备管理
    var pets = G.pets || [];
    var pg2 = paginateList('pepets', pets.length, 6);
    var start2 = (pg2.page - 1) * pg2.pageSize;
    var slice2 = pets.slice(start2, start2 + pg2.pageSize);
    contentHtml += '<div class="bg-card border border-game rounded-xl p-4 mt-4">' +
      '<h2 class="font-bold text-lg mb-3">🎽 装备管理</h2>' +
      '<p class="text-xs text-secondary mb-3">点击宠物进行装备栏管理</p>' +
      (pets.length === 0 ? '<p class="text-secondary text-center py-8">还没有宠物</p>' :
        '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">' +
        slice2.map(function(pet) {
          var pe = pet.petEquipment || { attack: null, hp: null, defense: null };
          var slotsHtml2 = PET_EQUIP_SLOTS.map(function(slot) {
            var e = pe[slot.id];
            if (e) {
              var rarityIdx = PET_EQUIP_RARITIES.indexOf(e.rarity);
              return '<div class="text-xs" style="color:' + PET_EQUIP_RARITY_COLORS[rarityIdx] + '">' + slot.icon + ' ' + e.name + '</div>';
            }
            return '<div class="text-xs text-secondary">' + slot.icon + ' ' + slot.name + '：空</div>';
          }).join('');
          return '<div class="bg-panel border border-game rounded-lg p-3 cursor-pointer" onclick="showPetEquipManageModal(\'' + pet.id + '\')">' +
            '<p class="font-bold text-sm">' + getPetDisplayName(pet) + '</p>' +
            '<p class="text-xs text-secondary mb-2">Lv.' + pet.level + ' ' + pet.race + '</p>' +
            slotsHtml2 +
            '</div>';
        }).join('') + '</div>' + pg2.controlsHtml) +
      '</div>';
  } else if (peTab === 'craft') {
    // 打造界面（需求2：选择栏位 + 选择打造等级）
    if (!window._craftSlot) window._craftSlot = 'attack';
    if (!window._craftGrade) window._craftGrade = 'low';
    var selSlot = window._craftSlot;
    var selGrade = window._craftGrade;
    // 栏位选择
    var slotSelHtml = '<div class="flex gap-2">' + PET_EQUIP_SLOTS.map(function(s) {
      var active = s.id === selSlot;
      return '<button class="flex-1 text-xs px-3 py-2 rounded-lg border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary hover:bg-panel') + '" onclick="window._craftSlot=\'' + s.id + '\';render()">' +
        s.icon + ' ' + s.name + '<br><span class="text-[10px]">' + s.desc + '</span>' +
        '</button>';
    }).join('') + '</div>';
    // 等级选择
    var gradeSelHtml = '<div class="flex gap-2">' + PET_EQUIP_CRAFT_GRADES.map(function(g) {
      var active = g === selGrade;
      var gIdx = PET_EQUIP_CRAFT_GRADES.indexOf(g);
      return '<button class="flex-1 text-xs px-3 py-2 rounded-lg border ' + (active ? 'bg-yellow-900 text-yellow-300 border-yellow-500' : 'border-game text-secondary hover:bg-panel') + '" style="border-color:' + (active ? PET_EQUIP_CRAFT_GRADE_COLORS[g] : '') + '" onclick="window._craftGrade=\'' + g + '\';render()">' +
        PET_EQUIP_CRAFT_GRADE_NAMES[g] +
        '</button>';
    }).join('') + '</div>';
    // 当前选择的配方信息
    var recipe = PET_EQUIP_CRAFT_RECIPES[selGrade];
    var canCraft = true;
    var matsHtml = Object.keys(recipe).map(function(mat) {
      if (mat === 'gold') return '';
      var need = recipe[mat];
      if (need <= 0) return '';
      var have = G.petEquipMaterials[mat] || 0;
      var enough = have >= need;
      if (!enough) canCraft = false;
      var gradeColor = PET_EQUIP_MATERIAL_GRADE_COLORS[mat] || '#9ca3af';
      return '<div class="text-xs ' + (enough ? 'text-green-400' : 'text-red-400') + '">' +
        PET_EQUIP_MATERIAL_ICONS[mat] + ' <span style="color:' + gradeColor + '">' + PET_EQUIP_MATERIAL_NAMES[mat] + '</span>：' + have + '/' + need +
        '</div>';
    }).join('');
    var goldEnough = G.player.gold >= recipe.gold;
    if (!goldEnough) canCraft = false;
    // 产出概率
    var rates = PET_EQUIP_CRAFT_RATES[selGrade] || {};
    var ratesHtml = Object.keys(rates).map(function(outR) {
      var outIdx = PET_EQUIP_RARITIES.indexOf(outR);
      var pct = Math.round(rates[outR] * 100);
      return '<span class="text-xs mr-2" style="color:' + PET_EQUIP_RARITY_COLORS[outIdx] + '">' + PET_EQUIP_RARITY_NAMES[outIdx] + ' ' + pct + '%</span>';
    }).join('');
    var slotInfo = PET_EQUIP_SLOTS.find(function(s) { return s.id === selSlot; });
    contentHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">🔨 打造宠物装备</h2>' +
      '<p class="text-xs text-secondary mb-3">选择栏位和打造等级，材料品质越高、产出高品质装备概率越大</p>' +
      '<div class="space-y-3">' +
      '<div><p class="text-xs text-secondary mb-1">1️⃣ 选择打造栏位</p>' + slotSelHtml + '</div>' +
      '<div><p class="text-xs text-secondary mb-1">2️⃣ 选择打造等级</p>' + gradeSelHtml + '</div>' +
      '<div class="bg-panel border border-game rounded-xl p-3">' +
      '<div class="text-xs font-bold mb-2" style="color:' + PET_EQUIP_CRAFT_GRADE_COLORS[selGrade] + '">' +
      PET_EQUIP_CRAFT_GRADE_NAMES[selGrade] + ' - ' + (slotInfo ? slotInfo.icon + ' ' + slotInfo.name : '') + '</div>' +
      '<div class="space-y-1 mb-2">' + matsHtml +
      '<div class="text-xs ' + (goldEnough ? 'text-green-400' : 'text-red-400') + '">🪙 金币：' + G.player.gold.toLocaleString() + '/' + recipe.gold.toLocaleString() + '</div>' +
      '</div>' +
      '<div class="text-xs text-secondary mb-2">产出概率：' + ratesHtml + '</div>' +
      '<button class="btn-primary btn-sm w-full" onclick="craftPetEquip(\'' + selSlot + '\',\'' + selGrade + '\')" ' + (canCraft ? '' : 'disabled style="opacity:0.4"') + '>🔨 立即打造</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      // v3.1.0 需求1.2：装备同步功能迁移至打造页（从宠物详情页迁入）
      (function() {
        var petsWithEquip = G.pets.filter(function(p) {
          return p.petEquipment && (p.petEquipment.attack || p.petEquipment.hp || p.petEquipment.defense);
        });
        if (petsWithEquip.length === 0) {
          return '<div class="bg-card border border-game rounded-xl p-4">' +
            '<h2 class="font-bold text-lg mb-2">🔄 装备同步</h2>' +
            '<p class="text-xs text-secondary">暂无宠物穿戴装备，无法使用装备同步功能</p>' +
            '</div>';
        }
        if (!window._syncSelPet) window._syncSelPet = petsWithEquip[0].id;
        var selPet = G.pets.find(function(p) { return p.id === window._syncSelPet; });
        if (!selPet) { window._syncSelPet = petsWithEquip[0].id; selPet = petsWithEquip[0]; }
        var petSelHtml = '<select onchange="window._syncSelPet=this.value;render()" class="bg-card border border-game rounded px-2 py-1 text-sm w-full">' +
          petsWithEquip.map(function(p) {
            var rarityIdx = RARITIES.indexOf(p.rarity);
            var rarityName = RARITY_NAMES[rarityIdx] || p.rarity;
            return '<option value="' + p.id + '" ' + (p.id === window._syncSelPet ? 'selected' : '') + '>' + (getPetDisplayName(p) || p.name) + '（' + rarityName + ' Lv.' + (p.level || 1) + '）</option>';
          }).join('') +
          '</select>';
        var targetLevel = Math.floor((G.player.level || 1) / 5) * 5;
        if (targetLevel < 20) targetLevel = 20;
        var equipSlotsHtml = ['attack', 'hp', 'defense'].map(function(slot) {
          var e = selPet.petEquipment[slot];
          var slotInfo = PET_EQUIP_SLOTS.find(function(s) { return s.id === slot; });
          if (!e) return '<div class="bg-panel rounded p-2 text-center text-xs text-secondary border border-dashed border-game">' + (slotInfo ? slotInfo.icon : '') + ' 空</div>';
          var rarityIdx = PET_EQUIP_RARITIES.indexOf(e.rarity);
          var needsSync = (e.level || 1) < targetLevel;
          return '<div class="bg-panel rounded p-2 text-center text-xs border" style="border-color:' + PET_EQUIP_RARITY_COLORS[rarityIdx] + '33">' +
            '<p class="font-bold" style="color:' + PET_EQUIP_RARITY_COLORS[rarityIdx] + '">' + (slotInfo ? slotInfo.icon + ' ' : '') + e.name + '</p>' +
            '<p class="text-secondary">Lv.' + (e.level || 1) + (needsSync ? ' → Lv.' + targetLevel : ' ✓')</p>' +
            '</div>';
        }).join('');
        return '<div class="bg-card border border-game rounded-xl p-4">' +
          '<h2 class="font-bold text-lg mb-2">🔄 装备同步</h2>' +
          '<p class="text-xs text-secondary mb-3">将当前穿戴的宠物装备提升至与人物等级匹配的档位等级，消耗少量材料，保留强化等级与词条</p>' +
          '<p class="text-xs text-secondary mb-1">选择宠物：</p>' +
          petSelHtml +
          '<div class="grid grid-cols-3 gap-2 mt-3 mb-3">' + equipSlotsHtml + '</div>' +
          '<p class="text-xs text-secondary mb-2">目标等级档位：Lv.' + targetLevel + '（当前人物等级：Lv.' + (G.player.level || 1) + '）</p>' +
          '<button class="btn-gold btn-sm w-full" onclick="_syncPetEquip(\'' + selPet.id + '\')">🔄 一键同步该宠物装备</button>' +
          '</div>';
      })();
  } else if (peTab === 'rune') {
    // 符文系统（从进化页迁移至宠物装备页）
    contentHtml = renderRuneSheet();
  }

  return '<div class="min-h-screen flex flex-col">' +
    '<header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">' +
    '<h1 class="font-fantasy text-gold text-lg">🎽 宠物装备</h1>' +
    '<span class="text-sm text-secondary">背包：' + (G.petEquipBag || []).length + ' 件</span>' +
    '</header>' +
    '<nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">' + renderNav() + '</nav>' +
    '<main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">' +
    tabsHtml +
    matHtml +
    contentHtml +
    '</main>' +
    '</div>';
}

// 宠物装备管理弹窗（查看宠物装备栏详情）
function showPetEquipManageModal(petId) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  if (!pet.petEquipment) pet.petEquipment = { attack: null, hp: null, defense: null };
  var slotsHtml = PET_EQUIP_SLOTS.map(function(slot) {
    var e = pet.petEquipment[slot.id];
    if (e) {
      var rarityIdx = PET_EQUIP_RARITIES.indexOf(e.rarity);
      var affixStr = (e.affixes || []).map(function(a) {
        var def = PET_AFFIX_TYPES.find(function(t) { return t.id === a.id; });
        return def ? '<div class="text-xs text-green-400">' + def.format(a.value) + '</div>' : '';
      }).join('');
      var setInfo = e.setId ? (function() {
        var set = PET_EQUIP_SETS.find(function(s) { return s.id === e.setId; });
        return set ? '<div class="text-xs font-bold mt-1" style="color:' + set.color + '">[' + set.name + ']</div><div class="text-[10px] text-secondary mt-0.5">2件：' + set.desc + '</div><div class="text-[10px] text-secondary">3件：' + set.desc3 + '</div>' : '';
      })() : '';
      return '<div class="bg-panel border rounded-lg p-3" style="border-color:' + PET_EQUIP_RARITY_COLORS[rarityIdx] + '">' +
        '<div class="flex items-center justify-between mb-1">' +
        '<span class="text-xs text-secondary">' + slot.icon + ' ' + slot.name + '</span>' +
        '<button class="btn-danger btn-sm text-xs" onclick="unequipPetEquipment(\'' + pet.id + '\',\'' + slot.id + '\')">卸下</button>' +
        '</div>' +
        '<p class="text-sm font-bold" style="color:' + PET_EQUIP_RARITY_COLORS[rarityIdx] + '">' + e.name + '</p>' +
        '<p class="text-xs text-secondary">基础：' + e.baseStat + ' +' + e.baseValue + '</p>' +
        affixStr + setInfo +
        '</div>';
    }
    return '<div class="bg-panel border border-dashed border-game rounded-lg p-3">' +
      '<div class="flex items-center justify-between mb-1">' +
      '<span class="text-xs text-secondary">' + slot.icon + ' ' + slot.name + '：空</span>' +
      '</div>' +
      '<button class="btn-primary btn-sm w-full text-xs" onclick="showPetEquipBagForSlot(\'' + pet.id + '\',\'' + slot.id + '\')">选择装备</button>' +
      '</div>';
  }).join('');
  // 套装激活情况（需求9：右侧展示生效中套装效果）
  var peBonus = getPetEquipBonus(pet);
  var setHtml = '';
  var hasActiveSet = peBonus && Object.keys(peBonus.setBonuses).length > 0;
  if (hasActiveSet) {
    var SET_BONUS_NAMES_M = {
      allPct: '全属性', atkPct: '攻击力', hpPct: '气血', defPct: '防御力',
      spdPct: '速度', intPct: '灵力', critRate: '暴击率', critDmg: '暴击伤害',
      skillDmg: '技能伤害', dodgeRate: '闪避', vampPct: '吸血',
    };
    var SET_BONUS_FLAT_M = {
      extraAttack: '追加普攻', deathImmune: '免死', endRegen: '回合回血',
      extraTarget: '普攻目标+1', magicExtraTarget: '法术目标+1',
    };
    setHtml = '<div class="bg-panel border-2 border-yellow-600/50 rounded-lg p-3">' +
      '<p class="text-xs font-bold mb-2 text-yellow-400">🎯 生效中套装效果</p>' +
      Object.keys(peBonus.setBonuses).map(function(setId) {
        var sb = peBonus.setBonuses[setId];
        var bonusStr = Object.keys(sb.bonus).map(function(k) {
          var label = SET_BONUS_NAMES_M[k] || SET_BONUS_FLAT_M[k] || k;
          if (SET_BONUS_FLAT_M[k]) return label + (sb.bonus[k] > 1 ? ' ×' + sb.bonus[k] : '');
          return label + ' +' + (sb.bonus[k] * 100).toFixed(0) + '%';
        }).join('，');
        return '<div class="mb-2 p-2 bg-black/20 rounded" style="border-left:3px solid ' + sb.color + '">' +
          '<div class="text-xs font-bold" style="color:' + sb.color + '">[' + sb.name + '] ' + sb.count + '件套</div>' +
          '<div class="text-xs text-secondary mt-1">' + bonusStr + '</div>' +
          '</div>';
      }).join('') +
      '</div>';
  } else {
    setHtml = '<div class="bg-panel border border-dashed border-game rounded-lg p-3 text-center">' +
      '<p class="text-xs text-secondary">暂无生效套装</p>' +
      '<p class="text-xs text-secondary mt-1">装备同套装多件可激活套装效果</p>' +
      '</div>';
  }
  // 套装预览（未激活的套装进度）
  var previewHtml = '';
  if (peBonus && peBonus.setProgress) {
    var activeSets = Object.keys(peBonus.setBonuses);
    var inactiveSets = Object.keys(peBonus.setProgress).filter(function(sid) { return activeSets.indexOf(sid) < 0; });
    if (inactiveSets.length > 0) {
      previewHtml = '<div class="bg-panel border border-game rounded-lg p-3 mt-2">' +
        '<p class="text-xs font-bold mb-1 text-secondary">📋 套装进度</p>' +
        inactiveSets.map(function(sid) {
          var sp = peBonus.setProgress[sid];
          return '<div class="text-xs text-secondary">' + sp.name + '：' + sp.count + '/' + sp.threshold + '件</div>';
        }).join('') +
        '</div>';
    }
  }
  var overlay = document.createElement('div');
  overlay.id = 'pet-equip-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-content scrollbar-thin" onclick="event.stopPropagation()" style="max-width:760px;max-height:85vh;">' +
    '<div class="flex items-center justify-between mb-4">' +
    '<h2 class="font-bold text-lg">🎽 ' + getPetDisplayName(pet) + ' 装备栏</h2>' +
    '<button class="text-secondary hover:text-white text-xl" onclick="closePetEquipModal()">✕</button>' +
    '</div>' +
    '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' +
    // 左侧：装备栏（占2列）
    '<div class="sm:col-span-2 space-y-2">' +
    '<p class="text-xs text-secondary mb-1">装备栏位</p>' +
    slotsHtml +
    '</div>' +
    // 右侧：生效中套装效果（占1列）
    '<div class="space-y-2">' +
    setHtml +
    previewHtml +
    '</div>' +
    '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closePetEquipModal(); });
}

function closePetEquipModal() {
  var m = document.getElementById('pet-equip-modal');
  if (m) m.remove();
  // v2.11.0 需求4.4：清除弹窗渲染上下文
  if (window._modalRenderCtx && window._modalRenderCtx.type === 'petEquipManage') {
    window._modalRenderCtx = null;
  }
}

// 显示可装备到指定栏位的宠物装备列表
function showPetEquipBagForSlot(petId, slot) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  closePetEquipModal();
  // v2.11.0 需求4.4：存储弹窗渲染上下文，支持弹窗内分页切换
  window._modalRenderCtx = { type: 'petEquipSlot', petId: petId, slot: slot };
  var bag = (G.petEquipBag || []).filter(function(e) { return e.slot === slot; });
  var pg = paginateList('peslot_' + slot, bag.length, 8, 'changeModalPage');
  var start = (pg.page - 1) * pg.pageSize;
  var slice = bag.slice(start, start + pg.pageSize);
  var slotInfo = PET_EQUIP_SLOTS.find(function(s) { return s.id === slot; });
  var listHtml = bag.length === 0 ? '<p class="text-secondary text-center py-4">没有可装备的' + slotInfo.name + '装备</p>' :
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' +
    slice.map(function(e) {
      var rarityIdx = PET_EQUIP_RARITIES.indexOf(e.rarity);
      var affixStr = (e.affixes || []).map(function(a) {
        var def = PET_AFFIX_TYPES.find(function(t) { return t.id === a.id; });
        return def ? '<span class="text-green-400 ml-1">' + def.format(a.value) + '</span>' : '';
      }).join('');
      return '<div class="bg-panel border border-game rounded-lg p-2">' +
        '<div class="flex items-center justify-between mb-1">' +
        '<span class="text-xs font-bold" style="color:' + PET_EQUIP_RARITY_COLORS[rarityIdx] + '">' + e.name + '</span>' +
        '<span class="text-xs text-secondary">Lv.' + e.level + '</span>' +
        '</div>' +
        '<div class="text-xs text-secondary">基础：' + e.baseStat + ' +' + e.baseValue + ' ' + affixStr + '</div>' +
        '<button class="btn-primary btn-sm w-full mt-1 text-xs" onclick="equipPetEquipment(\'' + pet.id + '\',\'' + e.id + '\')">装备</button>' +
        '</div>';
    }).join('') + '</div>' + pg.controlsHtml;
  var overlay = document.createElement('div');
  overlay.id = 'pet-equip-bag-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-content scrollbar-thin" onclick="event.stopPropagation()" style="max-width:560px;max-height:85vh;">' +
    '<div class="flex items-center justify-between mb-4">' +
    '<h2 class="font-bold text-lg">📦 ' + slotInfo.icon + ' ' + slotInfo.name + ' - 选择装备</h2>' +
    '<button class="text-secondary hover:text-white text-xl" onclick="closePetEquipBagModal()">✕</button>' +
    '</div>' +
    listHtml +
    '<button class="btn-sm text-xs text-secondary mt-3" onclick="closePetEquipBagModal();showPetEquipManageModal(\'' + pet.id + '\')">返回</button>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closePetEquipBagModal(); });
}

function closePetEquipBagModal() {
  var m = document.getElementById('pet-equip-bag-modal');
  if (m) m.remove();
  // v2.11.0 需求4.4：清除弹窗渲染上下文
  if (window._modalRenderCtx && (window._modalRenderCtx.type === 'petEquipSlot' || window._modalRenderCtx.type === 'petEquipPetList')) {
    window._modalRenderCtx = null;
  }
}

// 从背包点击"装备"时，让用户选择目标宠物
function showPetEquipBagForPet(equipId) {
  var equip = (G.petEquipBag || []).find(function(e) { return e.id === equipId; });
  if (!equip) return;
  closePetEquipBagModal();
  // v2.11.0 需求4.4：存储弹窗渲染上下文，支持弹窗内分页切换
  window._modalRenderCtx = { type: 'petEquipPetList', equipId: equipId };
  var slotInfo = PET_EQUIP_SLOTS.find(function(s) { return s.id === equip.slot; });
  var pets = G.pets || [];
  var pg = paginateList('pepetlist', pets.length, 6, 'changeModalPage');
  var start = (pg.page - 1) * pg.pageSize;
  var slice = pets.slice(start, start + pg.pageSize);
  var listHtml = pets.length === 0 ? '<p class="text-secondary text-center py-4">还没有宠物</p>' :
    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' +
    slice.map(function(pet) {
      var pe = pet.petEquipment || { attack: null, hp: null, defense: null };
      var cur = pe[equip.slot];
      var curStr = cur ? '<span class="text-xs text-secondary">当前：' + cur.name + '</span>' : '<span class="text-xs text-secondary">当前：空</span>';
      return '<div class="bg-panel border border-game rounded-lg p-2 cursor-pointer" onclick="equipPetEquipment(\'' + pet.id + '\',\'' + equipId + '\')">' +
        '<p class="font-bold text-sm">' + getPetDisplayName(pet) + '</p>' +
        '<p class="text-xs text-secondary">Lv.' + pet.level + ' ' + pet.race + '</p>' +
        curStr +
        '</div>';
    }).join('') + '</div>' + pg.controlsHtml;
  var overlay = document.createElement('div');
  overlay.id = 'pet-equip-pet-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-content scrollbar-thin" onclick="event.stopPropagation()" style="max-width:560px;max-height:85vh;">' +
    '<div class="flex items-center justify-between mb-4">' +
    '<h2 class="font-bold text-lg">选择装备 ' + slotInfo.icon + ' ' + equip.name + ' 的目标宠物</h2>' +
    '<button class="text-secondary hover:text-white text-xl" onclick="closePetEquipPetModal()">✕</button>' +
    '</div>' +
    listHtml +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closePetEquipPetModal(); });
}

function closePetEquipPetModal() {
  var m = document.getElementById('pet-equip-pet-modal');
  if (m) m.remove();
  // v2.11.0 需求4.4：清除弹窗渲染上下文
  if (window._modalRenderCtx && window._modalRenderCtx.type === 'petEquipPetList') {
    window._modalRenderCtx = null;
  }
}

function renderDungeonScreen() {
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3">
      <h1 class="font-fantasy text-gold text-lg">🏰 副本</h1>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🎫 特殊副本</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${DUNGEONS.map(d => {
            const ticket = G.inventory.find(i => i.id === d.ticketItem);
            const hasTicket = ticket && ticket.count > 0;
            const canEnter = G.player.level >= d.minLv;
            const dailyLimit = getDungeonDailyLimit(d.id);
            const usedToday = G.dungeonDailyUsed['dungeon_'+d.id] || 0;
            const reachedLimit = usedToday >= dailyLimit;
            const iconMap = { exp_cave: '💎', gold_mine: '🪙', egg_forest: '🥚', forge_mine: '⚒️', treasure_ruin: '🗺️', gem_cavern: '💠', bloodline_dungeon: '🩸' };
            return `
            <div class="bg-panel border border-game rounded-xl p-4 text-center">
              <div class="text-3xl mb-2">${iconMap[d.id] || '🏰'}</div>
              <p class="font-bold">${d.name}</p>
              <p class="text-xs text-secondary mb-2">${d.desc}</p>
              <p class="text-xs text-secondary">需求等级：${d.minLv}</p>
              <p class="text-xs ${hasTicket ? 'text-green-400' : 'text-red-400'}">门票：${hasTicket ? ticket.count : 0}张</p>
              <p class="text-xs text-secondary">今日：${usedToday}/${dailyLimit}次</p>
              <button class="btn-primary btn-sm mt-2 w-full" ${!canEnter || !hasTicket || reachedLimit ? 'disabled' : ''}
                onclick="enterSpecialDungeon('${d.id}')" ${!canEnter || !hasTicket || reachedLimit ? 'style="opacity:0.5;cursor:not-allowed"' : ''}>
                ${!canEnter ? '等级不足' : !hasTicket ? '缺少门票' : reachedLimit ? '今日已满' : '进入'}
              </button>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">👥 团队副本（每日1次）</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${TEAM_DUNGEONS.map(td => {
            const used = G.teamDungeonUsed[td.id];
            return `
            <div class="bg-panel border border-game rounded-xl p-4">
              <p class="font-bold mb-1">${td.name}</p>
              <p class="text-xs text-secondary mb-2">Boss：${td.bosses.join(' → ')}</p>
              <p class="text-xs text-secondary mb-2">奖励：${td.rewards.map(r => getItemName(r)).join('、')}</p>
              <button class="btn-primary btn-sm w-full" ${used ? 'disabled style="opacity:0.5"' : ''}
                onclick="enterTeamDungeon('${td.id}')">${used ? '已完成' : '挑战'}</button>
            </div>`;
          }).join('')}
        </div>
      </div>
    </main>
  </div>`;
}

function renderMarketScreen() {
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3">
      <h1 class="font-fantasy text-gold text-lg">💱 交易市场</h1>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">📤 上架宠物蛋</h2>
        ${G.eggs.filter(e => !e.isHatching).length === 0 ? '<p class="text-secondary col-span-full">没有可上架的蛋</p>' : (function() {
          var sellableEggs = G.eggs.filter(e => !e.isHatching);
          var eggPager = paginateList('selleggs', sellableEggs.length, 8);
          var eggStart = (eggPager.page - 1) * eggPager.pageSize;
          var eggSlice = sellableEggs.slice(eggStart, eggStart + eggPager.pageSize);
          return '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + eggSlice.map(egg => {
            const pet = egg.petData;
            return `
            <div class="bg-panel border border-game rounded-xl p-3 flex items-center justify-between">
              <div>
                <p class="text-sm font-bold">T${egg.tier+1} 蛋 - ${pet.race}</p>
                <p class="text-xs text-secondary">鉴定 Lv.${egg.appraisalLevel}/3</p>
              </div>
              <div class="flex items-center gap-2">
                <input type="number" id="price_${egg.id}" placeholder="价格" class="w-20 text-xs py-1" min="100">
                <button class="btn-gold btn-sm" onclick="listEgg('${egg.id}')">上架</button>
              </div>
            </div>`;
          }).join('') + '</div>' + eggPager.controlsHtml;
        })()}
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🛒 市场列表</h2>
        ${G.marketListings.length === 0 ? '<p class="text-secondary text-center py-4">市场暂无商品</p>' : ''}
        ${G.marketListings.length > 0 ? (function() {
          var pager = paginateList('market', G.marketListings.length, 10);
          var start = (pager.page - 1) * pager.pageSize;
          var pageItems = G.marketListings.slice(start, start + pager.pageSize);
          return '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + pageItems.map(listing => {
            const pet = listing.egg.petData;
            return `
            <div class="bg-panel border border-game rounded-xl p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">T${listing.egg.tier+1} · ${pet.race}</span>
                <span class="text-gold font-bold">${listing.price} 🪙</span>
              </div>
              ${listing.egg.revealed.attributes ? `<p class="text-xs text-secondary">属性已鉴定</p>` : ''}
              ${listing.egg.revealed.growth ? `<p class="text-xs text-gold">成长 ${pet.growth.toFixed(2)}</p>` : ''}
              ${listing.egg.revealed.skills ? `<p class="text-xs text-secondary">技能已鉴定</p>` : ''}
              <button class="btn-primary btn-sm mt-2 w-full" onclick="buyListing('${listing.id}')">购买</button>
            </div>`;
          }).join('') + '</div>' + pager.controlsHtml;
        })() : ''}
      </div>
    </main>
  </div>`;
}

function renderDailyScreen() {
  const bpLevel = G.player.battlePassLevel;
  const bpExp = G.player.battlePassExp % 200;
  // 需求10：计算日常/周常可领取数量
  var dailyClaimable = 0;
  DAILY_TASKS.forEach(function(task) {
    var p = G.dailyTasks[task.id] || 0;
    if (p >= task.target && !G.dailyTasks[task.id + '_claimed']) dailyClaimable++;
  });
  var weeklyClaimable = 0;
  if (typeof WEEKLY_TASKS !== 'undefined') {
    if (!G.weeklyTasks) G.weeklyTasks = {};
    WEEKLY_TASKS.forEach(function(task) {
      var p = G.weeklyTasks[task.id] || 0;
      if (p >= task.target && !G.weeklyTasks[task.id + '_claimed']) weeklyClaimable++;
    });
  }
  // 需求4.1：主线任务分栏——计算可领取数量与任务链进度
  var mainQuestClaimable = 0;
  var mainQuestHtml = '';
  if (typeof getCurrentMainQuest === 'function') {
    var mq = getCurrentMainQuest();
    if (mq && mq.questData) {
      var q = mq.questData;
      var mqDone = mq.progress >= q.target;
      if (mqDone && !mq.claimed) mainQuestClaimable = 1;
      var mqPct = Math.min(100, Math.floor((mq.progress / q.target) * 100));
      var mqRewardParts = [];
      if (q.reward.exp) mqRewardParts.push('⭐' + q.reward.exp);
      if (q.reward.gold) mqRewardParts.push('🪙' + q.reward.gold);
      if (q.reward.diamond) mqRewardParts.push('💎' + q.reward.diamond);
      // 需求4.1：修正类型标签——随机任务不应显示为"支线任务"
      var mqTypeLabel = q.type === 'tutorial' ? '📖 新手引导' : q.type === 'feature' ? '🔑 功能解锁' : '⚔️ 历练任务';
      var mqTypeColor = q.type === 'tutorial' ? '#22c55e' : q.type === 'feature' ? '#f59e0b' : '#a855f7';
      // 任务链进度
      var chainTotal = (typeof MAIN_QUEST_CHAIN !== 'undefined') ? MAIN_QUEST_CHAIN.length : 0;
      var chainIdx = mq.chainIdx || 0;
      var chainProgressText = chainTotal > 0 ? ('主线进度 ' + Math.min(chainIdx + 1, chainTotal) + '/' + chainTotal) : '';
      mainQuestHtml = `
      <div class="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-600/50 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <h2 class="font-bold text-lg text-gold">🗡️ 主线任务</h2>
            ${chainProgressText ? '<span class="text-xs text-purple-300/70">' + chainProgressText + '</span>' : ''}
          </div>
          ${mqDone && !mq.claimed ? '<button class="btn-gold btn-sm" onclick="claimMainQuestUI()">🎁 领取奖励</button>' : ''}
        </div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs px-2 py-0.5 rounded" style="background:${mqTypeColor}22;color:${mqTypeColor};border:1px solid ${mqTypeColor}">${mqTypeLabel}</span>
          <span class="text-sm font-bold text-gold">${q.name}</span>
        </div>
        <p class="text-sm text-secondary mb-2">${q.desc}</p>
        <div class="flex items-center gap-2">
          <div class="progress-bar flex-1">
            <div class="progress-fill ${mqDone ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'}" style="width:${mqPct}%"></div>
          </div>
          <span class="text-xs ${mqDone ? 'text-green-400' : 'text-secondary'}">${Math.min(mq.progress, q.target)}/${q.target}</span>
        </div>
        <p class="text-xs text-yellow-400/70 mt-1">奖励：${mqRewardParts.join(' ')}</p>
      </div>`;
    }
  }
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3">
      <h1 class="font-fantasy text-gold text-lg">📋 任务中心</h1>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      ${mainQuestHtml}
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">📜 支线任务</h2>
          ${dailyClaimable > 0 ? `<button class="btn-gold btn-sm" onclick="claimAllDailyUI()">🎁 一键领取 (${dailyClaimable})</button>` : ''}
        </div>
        ${DAILY_TASKS.map(task => {
          const progress = G.dailyTasks[task.id] || 0;
          const claimed = G.dailyTasks[task.id + '_claimed'];
          const done = progress >= task.target;
          return `
          <div class="flex items-center justify-between py-2 border-b border-game last:border-0">
            <div>
              <p class="text-sm font-bold">${task.name}</p>
              <p class="text-xs text-secondary">${task.desc}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs ${done ? 'text-green-400' : 'text-secondary'}">${Math.min(progress, task.target)}/${task.target}</span>
              ${claimed ? '<span class="text-xs text-green-400">已领取</span>' :
                done ? `<button class="btn-gold btn-sm" onclick="claimTask('${task.id}')">领取 💎${task.reward.diamond}</button>` :
                '<span class="text-xs text-secondary">进行中</span>'}
            </div>
          </div>`;
        }).join('')}
      </div>
      ${typeof WEEKLY_TASKS !== 'undefined' ? `
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">🗓️ 周常任务</h2>
          ${weeklyClaimable > 0 ? `<button class="btn-gold btn-sm" onclick="claimAllWeeklyUI()">🎁 一键领取 (${weeklyClaimable})</button>` : ''}
        </div>
        ${WEEKLY_TASKS.map(task => {
          if (!G.weeklyTasks) G.weeklyTasks = {};
          const progress = G.weeklyTasks[task.id] || 0;
          const claimed = G.weeklyTasks[task.id + '_claimed'];
          const done = progress >= task.target;
          return `
          <div class="flex items-center justify-between py-2 border-b border-game last:border-0">
            <div>
              <p class="text-sm font-bold">${task.name}</p>
              <p class="text-xs text-secondary">${task.desc}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs ${done ? 'text-green-400' : 'text-secondary'}">${Math.min(progress, task.target)}/${task.target}</span>
              ${claimed ? '<span class="text-xs text-green-400">已领取</span>' :
                done ? `<button class="btn-gold btn-sm" onclick="claimWeeklyTaskUI('${task.id}')">领取 💎${task.reward.diamond}</button>` :
                '<span class="text-xs text-secondary">进行中</span>'}
            </div>
          </div>`;
        }).join('')}
      </div>
      ` : ''}
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">📜 战令 Lv.${bpLevel}</h2>
          ${!G.player.battlePassPremium ? `<button class="btn-gold btn-sm" onclick="buyBattlePass()">💎50 激活高级战令</button>` : '<span class="text-xs text-gold">高级战令已激活</span>'}
        </div>
        <div class="progress-bar mb-3"><div class="progress-fill bg-gradient-to-r from-yellow-500 to-orange-500" style="width:${Math.floor(bpExp/200*100)}%"></div></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${BATTLE_PASS_REWARDS.map(r => {
            const claimed = G['bp_claimed_' + r.level];
            const canClaim = bpLevel >= r.level && !claimed;
            return `
            <div class="bg-panel border border-game rounded-lg p-2 flex items-center justify-between">
              <div>
                <p class="text-xs font-bold">Lv.${r.level}</p>
                <p class="text-xs text-secondary">免费：${r.free.type === 'gold' ? r.free.amount+'🪙' : r.free.type === 'diamond' ? r.free.amount+'💎' : r.free.type === 'egg' ? 'T'+(r.free.tier+1)+'蛋x'+r.free.amount : getItemName(r.free.id)+'x'+r.free.amount}</p>
                ${G.player.battlePassPremium ? `<p class="text-xs text-gold">高级：${r.premium.type === 'gold' ? r.premium.amount+'🪙' : r.premium.type === 'diamond' ? r.premium.amount+'💎' : r.premium.type === 'egg' ? 'T'+(r.premium.tier+1)+'蛋x'+r.premium.amount : getItemName(r.premium.id)+'x'+r.premium.amount}</p>` : ''}
              </div>
              ${claimed ? '<span class="text-xs text-green-400">已领</span>' :
                canClaim ? `<button class="btn-primary btn-sm" onclick="claimBP('${r.level}')">领取</button>` :
                '<span class="text-xs text-secondary">锁定</span>'}
            </div>`;
          }).join('')}
        </div>
      </div>
    </main>
  </div>`;
}

function renderTowerScreen() {
  const maxFloors = getMaxTowerFloors();
  const maxStaticFloor = TOWER_FLOORS.length;
  const isCleared = G.towerProgress >= maxFloors;
  const currentFloor = isCleared ? null : getTowerFloorData(G.towerProgress);
  // 预览：优先展示当前进度附近的层，分页展示
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
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3">
      <h1 class="font-fantasy text-gold text-lg">🗼 试炼之塔</h1>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4 text-center">
        <p class="text-lg font-bold mb-2">当前进度：第 ${G.towerProgress + 1} 层 / 共 ${maxFloors} 层</p>
        <p class="text-sm text-secondary mb-2">最高记录：第 ${G.towerMaxFloor + 1} 层 · 转生次数：${G.player.rebirth || 0}（每转生+50层）</p>
        ${currentFloor ? `
          <p class="text-sm mb-1">${currentFloor.isBoss ? '👑' : '⚔️'} ${currentFloor.name}</p>
          <p class="text-xs text-secondary mb-1">气血 ${currentFloor.hp.toLocaleString()} · 攻击 ${currentFloor.atk.toLocaleString()} · 防御 ${currentFloor.def.toLocaleString()}</p>
          <p class="text-xs text-secondary mb-3">战力需求约 ${(currentFloor.hp + currentFloor.atk * 10).toLocaleString()}</p>
          <button class="btn-primary" onclick="challengeTower()">挑战当前层</button>
        ` : '<p class="text-gold">🎉 已通关全部 ' + maxFloors + ' 层！转生后可解锁更多层数。</p>'}
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">层数预览（第 ${previewStart + 1} ~ ${previewStart + previewCount} 层）</h2>
        <div class="grid grid-cols-10 gap-1">${previewCells.join('')}</div>
        ${maxFloors > maxStaticFloor ? '<p class="text-xs text-secondary mt-2">💡 ' + maxStaticFloor + ' 层之后为动态生成层，难度与奖励随层数递增。</p>' : ''}
      </div>
    </main>
  </div>`;
}

function renderSamsaraScreen() {
  var samsara = G.samsara || { currentFloor: 0, maxFloorCleared: 0, reincarnationPoints: 0, inChallenge: false, divinePowers: {} };
  var unlocked = (typeof isSamsaraUnlocked === 'function') ? isSamsaraUnlocked() : (G.player.level >= 70 || G.player.rebirth > 0);
  var canRB = (typeof canRebirth === 'function') ? canRebirth() : false;
  var samsaraTab = window._samsaraTab || 'tower';
  
  var tabs = [
    { id: 'tower', label: '轮回之塔', icon: '🗼' },
    { id: 'gacha', label: '神通抽奖', icon: '🎰' },
    { id: 'powers', label: '我的神通', icon: '✨' },
  ];
  var tabsHtml = tabs.map(function(t) {
    var active = samsaraTab === t.id;
    return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + '" onclick="window._samsaraTab=\'' + t.id + '\';render()">' + t.icon + ' ' + t.label + '</button>';
  }).join('');

  var contentHtml = '';
  
  if (!unlocked) {
    contentHtml = '<div class="bg-card border border-game rounded-xl p-6 text-center max-w-md mx-auto">' +
      '<div class="text-6xl mb-4">🔒</div>' +
      '<h2 class="font-bold text-xl mb-2 text-yellow-400">六道轮回</h2>' +
      '<p class="text-secondary mb-4">需要达到 <span class="text-gold font-bold">' + SAMSARA_UNLOCK_LEVEL + '级</span> 才能参与六道轮回活动</p>' +
      '<div class="progress-bar mt-2"><div class="progress-fill bg-gradient-to-r from-purple-500 to-blue-500" style="width:' + Math.floor(G.player.level / SAMSARA_UNLOCK_LEVEL * 100) + '%"></div></div>' +
      '<p class="text-xs text-secondary mt-1">' + G.player.level + '/' + SAMSARA_UNLOCK_LEVEL + '</p>' +
    '</div>';
  } else if (samsaraTab === 'tower') {
    // ===== 轮回之塔 =====
    var nextFloor = samsara.currentFloor + 1;
    var nextFloorData = (typeof getSamsaraFloorData === 'function') ? getSamsaraFloorData(nextFloor) : null;
    var potentialPoints = (typeof calcSamsaraPoints === 'function') ? calcSamsaraPoints(nextFloor) : 0;
    var canSettle = samsara.currentFloor >= SAMSARA_REBIRTH_MIN_FLOOR && G.player.level >= G.player.maxLevel;
    var canSettleMsg = '';
    if (samsara.currentFloor < SAMSARA_REBIRTH_MIN_FLOOR) {
      canSettleMsg = '需通关至少' + SAMSARA_REBIRTH_MIN_FLOOR + '层（当前' + samsara.currentFloor + '层）';
    } else if (G.player.level < G.player.maxLevel) {
      canSettleMsg = '需达到等级上限' + G.player.maxLevel + '级（当前' + G.player.level + '级）';
    }
    
    contentHtml = '<div class="space-y-4">' +
      // 状态面板
      '<div class="bg-card border border-purple-700 rounded-xl p-4">' +
        '<div class="grid grid-cols-2 gap-3 text-sm">' +
          '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-secondary text-xs">当前层数</p><p class="text-gold font-bold text-lg">' + samsara.currentFloor + '</p></div>' +
          '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-secondary text-xs">最高通关</p><p class="text-purple-400 font-bold text-lg">' + samsara.maxFloorCleared + '层</p></div>' +
          '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-secondary text-xs">轮回积分</p><p class="text-cyan-400 font-bold text-lg">' + (samsara.reincarnationPoints || 0) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-secondary text-xs">转生次数</p><p class="text-gold font-bold text-lg">' + G.player.rebirth + '</p></div>' +
        '</div>' +
      '</div>' +
      
      // 挑战面板
      '<div class="bg-card border border-game rounded-xl p-4">' +
        (samsara.inChallenge ?
          // 挑战中
          // v2.9.0 需求4.1：挑战进行过程中不展示转生按钮，避免无效交互
          '<h3 class="font-bold text-lg mb-2 text-purple-400">🌀 挑战进行中</h3>' +
          '<p class="text-sm text-secondary mb-3">当前层数：<span class="text-gold font-bold">' + samsara.currentFloor + '</span> · 下一层：<span class="text-purple-400 font-bold">第' + nextFloor + '层</span></p>' +
          (nextFloorData ? '<div class="bg-panel rounded-lg p-3 mb-3 text-xs space-y-1">' +
            '<p><span class="text-secondary">守卫名称：</span>' + nextFloorData.name + '</p>' +
            '<p><span class="text-secondary">气血：</span><span class="text-red-400">' + nextFloorData.hp.toLocaleString() + '</span></p>' +
            '<p><span class="text-secondary">攻击：</span><span class="text-orange-400">' + nextFloorData.atk.toLocaleString() + '</span></p>' +
            '<p><span class="text-secondary">防御：</span><span class="text-gray-300">' + nextFloorData.def.toLocaleString() + '</span></p>' +
            '<p><span class="text-secondary">奖励：</span><span class="text-yellow-400">🪙' + nextFloorData.gold.toLocaleString() + '</span> <span class="text-green-400">⭐' + nextFloorData.exp.toLocaleString() + '经验</span></p>' +
            (potentialPoints > 0 ? '<p><span class="text-secondary">若结算可获：</span><span class="text-cyan-400 font-bold">' + potentialPoints + ' 轮回积分</span></p>' : '') +
          '</div>' : '') +
          '<div class="flex gap-2 flex-wrap">' +
            '<button class="btn-primary px-4 py-2" onclick="doSamsaraBattle()">⚔️ 挑战第' + nextFloor + '层</button>' +
            '<button class="btn-sm px-4 py-2 border border-game text-secondary" onclick="quitSamsaraChallenge()">🚪 退出挑战</button>' +
          '</div>' +
          '<p class="text-xs text-secondary mt-2">💡 挑战过程中无法转生，请退出挑战后于主界面进行结算转生</p>'
        :
          // 未在挑战中
          '<h3 class="font-bold text-lg mb-2 text-purple-400">🗼 轮回之塔</h3>' +
          '<p class="text-sm text-secondary mb-3">无限波次爬塔挑战，每层怪物属性逐层递增。通关' + SAMSARA_REBIRTH_MIN_FLOOR + '层后可结算转生并获得轮回积分。</p>' +
          '<div class="bg-panel rounded-lg p-3 mb-3 text-xs text-secondary space-y-1">' +
            '<p>📌 挑战规则：</p>' +
            '<p>· 无限层数，无次数限制，可随时进入挑战</p>' +
            '<p>· 中途可主动退出，战斗失败自动终止当前挑战</p>' +
            '<p>· 通关≥' + SAMSARA_REBIRTH_MIN_FLOOR + '层且达到满级后可结算转生</p>' +
            '<p>· 结算转生后按基础规则重置成长线，并获得轮回积分</p>' +
            '<p>· 轮回积分可在「神通抽奖」中消耗，抽取宠物神通</p>' +
          '</div>' +
          '<div class="flex gap-2 flex-wrap">' +
            '<button class="btn-primary px-6 py-3" onclick="startSamsaraUI()">🌀 开始挑战</button>' +
            // v2.9.0 需求4.1：转生按钮迁移至挑战前主界面，挑战过程中不展示
            // v2.10.0 需求5.1：转生按钮始终保持可点击状态，条件校验由 confirmSamsaraSettle 内部处理
            '<button class="' + (canSettle ? 'btn-gold' : 'btn-primary opacity-70') + ' px-6 py-3" onclick="confirmSamsaraSettle()" title="' + (canSettleMsg ? '提示：' + canSettleMsg : '点击进行结算转生') + '">✨ 结算转生</button>' +
          '</div>' +
          (samsara.maxFloorCleared > 0 ? '<p class="text-xs text-secondary mt-2">上次最高通关：' + samsara.maxFloorCleared + '层</p>' : '') +
          (canSettle ? '<p class="text-xs text-yellow-400 mt-2">✅ 当前可结算转生！将获得 <span class="font-bold">' + (typeof calcSamsaraPoints === 'function' ? calcSamsaraPoints(samsara.currentFloor) : 0) + ' 轮回积分</span></p>' :
            (samsara.currentFloor >= SAMSARA_REBIRTH_MIN_FLOOR ? '<p class="text-xs text-green-400 mt-2">✅ 已通关' + SAMSARA_REBIRTH_MIN_FLOOR + '层，达到转生最低门槛。继续挑战可获得更多积分，或达到满级后结算转生。</p>' : '<p class="text-xs text-secondary mt-2">💡 通关' + SAMSARA_REBIRTH_MIN_FLOOR + '层后可结算转生</p>'))
        ) +
      '</div>' +
      
      // 战斗日志区域
      (window._samsaraBattleLog ? '<div class="bg-card border border-game rounded-xl p-4"><h3 class="font-bold text-sm mb-2 text-secondary">📜 战斗日志</h3><div class="bg-panel rounded p-2 text-xs space-y-1 max-h-40 overflow-y-auto">' + window._samsaraBattleLog + '</div></div>' : '') +
    '</div>';
    
  } else if (samsaraTab === 'gacha') {
    // ===== 神通抽奖 =====
    var ownedCount = Object.keys(samsara.divinePowers || {}).length;
    var totalCount = (typeof DIVINE_POWERS !== 'undefined') ? DIVINE_POWERS.length : 20;
    
    contentHtml = '<div class="space-y-4">' +
      '<div class="bg-card border border-purple-700 rounded-xl p-4 text-center">' +
        '<div class="text-5xl mb-2">🎰</div>' +
        '<h3 class="font-bold text-lg mb-1 text-purple-400">神通抽奖</h3>' +
        '<p class="text-sm text-secondary mb-3">消耗轮回积分抽取神通，重复获得自动升星</p>' +
        '<p class="text-lg mb-3">轮回积分：<span class="text-cyan-400 font-bold text-xl">' + (samsara.reincarnationPoints || 0) + '</span></p>' +
        '<div class="flex gap-2 justify-center">' +
          '<button class="btn-primary px-4 py-2" onclick="doSamsaraGacha(1)" ' + ((samsara.reincarnationPoints || 0) < SAMSARA_GACHA_COST ? 'disabled style="opacity:0.5;cursor:not-allowed"' : '') + '>单抽 (' + SAMSARA_GACHA_COST + '积分)</button>' +
          '<button class="btn-gold px-4 py-2" onclick="doSamsaraGacha(10)" ' + ((samsara.reincarnationPoints || 0) < SAMSARA_GACHA_COST * 10 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : '') + '>十连 (' + (SAMSARA_GACHA_COST * 10) + '积分)</button>' +
        '</div>' +
        '<p class="text-xs text-secondary mt-2">已收集：' + ownedCount + '/' + totalCount + '</p>' +
      '</div>' +
      
      // 概率展示
      '<div class="bg-card border border-game rounded-xl p-4">' +
        '<h3 class="font-bold text-sm mb-2 text-secondary">📊 抽奖概率</h3>' +
        '<div class="grid grid-cols-4 gap-2 text-xs">' +
          '<div class="bg-panel rounded p-2 text-center"><p class="text-blue-400 font-bold">稀有</p><p class="text-secondary">50%</p></div>' +
          '<div class="bg-panel rounded p-2 text-center"><p class="text-purple-400 font-bold">史诗</p><p class="text-secondary">30%</p></div>' +
          '<div class="bg-panel rounded p-2 text-center"><p class="text-yellow-400 font-bold">传说</p><p class="text-secondary">15%</p></div>' +
          '<div class="bg-panel rounded p-2 text-center"><p class="text-red-400 font-bold">神话</p><p class="text-secondary">5%</p></div>' +
        '</div>' +
      '</div>' +
      
      // 神通图鉴
      '<div class="bg-card border border-game rounded-xl p-4">' +
        '<h3 class="font-bold text-sm mb-2 text-secondary">📖 全部神通 (' + totalCount + '种)</h3>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' +
          ((typeof DIVINE_POWERS !== 'undefined') ? DIVINE_POWERS.map(function(p) {
            var owned = samsara.divinePowers && samsara.divinePowers[p.id];
            var star = owned ? (owned.star || 1) : 0;
            var maxStar = (typeof MAX_DIVINE_POWER_STAR !== 'undefined') ? MAX_DIVINE_POWER_STAR : 6;
            var isMaxed = owned && star >= maxStar;
            var rarityColor = { rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444' }[p.rarity] || '#9ca3af';
            var rarityName = { rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话' }[p.rarity] || p.rarity;
            var starHtml = '';
            for (var s = 0; s < star; s++) starHtml += '⭐';
            // v2.11.0 需求7.1：满星标识
            var maxedBadge = isMaxed ? '<span class="text-xs px-1 rounded ml-1" style="background:#fde04722;color:#fde047">满星</span>' : '';
            return '<div class="bg-panel rounded-lg p-2 border ' + (owned ? '' : 'opacity-40') + '" style="border-color:' + rarityColor + '33">' +
              '<div class="flex items-center justify-between">' +
                '<span class="text-sm font-bold" style="color:' + rarityColor + '">' + p.icon + ' ' + p.name + '</span>' +
                '<span class="text-xs px-1 rounded" style="background:' + rarityColor + '22;color:' + rarityColor + '">' + rarityName + '</span>' +
              '</div>' +
              '<p class="text-xs text-secondary mt-1">' + p.desc + '</p>' +
              (owned ? '<p class="text-xs text-yellow-400 mt-1">' + starHtml + ' (' + star + '/' + maxStar + '星)' + maxedBadge + '</p>' : '<p class="text-xs text-secondary mt-1">未拥有</p>') +
            '</div>';
          }).join('') : '') +
        '</div>' +
      '</div>' +
    '</div>';
    
  } else if (samsaraTab === 'powers') {
    // ===== 我的神通 =====
    var ownedPowers = [];
    if (samsara.divinePowers) {
      for (var pid in samsara.divinePowers) {
        var eff = (typeof getDivinePowerEffect === 'function') ? getDivinePowerEffect(pid) : null;
        if (eff) ownedPowers.push(eff);
      }
    }
    
    contentHtml = '<div class="space-y-4">' +
      '<div class="bg-card border border-purple-700 rounded-xl p-4">' +
        '<h3 class="font-bold text-lg mb-2 text-purple-400">✨ 已拥有神通</h3>' +
        '<p class="text-sm text-secondary mb-3">共 ' + ownedPowers.length + ' 种神通，所有神通效果自动应用于出战宠物</p>' +
        (ownedPowers.length === 0 ?
          '<div class="text-center py-8"><div class="text-4xl mb-2 opacity-40">🎲</div><p class="text-secondary text-sm">暂无神通，前往「神通抽奖」抽取</p></div>' :
          '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' +
            ownedPowers.map(function(eff) {
              var rarityColor = { rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444' }[eff.rarity] || '#9ca3af';
              var rarityName = { rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话' }[eff.rarity] || eff.rarity;
              var maxStar = (typeof MAX_DIVINE_POWER_STAR !== 'undefined') ? MAX_DIVINE_POWER_STAR : 6;
              var starHtml = '';
              for (var s = 0; s < eff.star; s++) starHtml += '⭐';
              // v2.11.0 需求7.1：满星标识
              var maxedBadge = eff.maxed ? '<span class="text-xs px-1 rounded ml-1" style="background:#fde04722;color:#fde047">满星</span>' : '';
              var currentValue = (eff.effect.value * 100).toFixed(0);
              var isPercent = ['atkPct','defPct','spdPct','intPct','hpPct','mpPct','allPct','skillDmg','regenPct','defIgnore','critRate','dodgeRate','dmgReduce','vampPct','critDmg','stunChance','extraAtk'].indexOf(eff.effect.type) >= 0;
              var effectStr = isPercent ? '+' + currentValue + '%' : '+' + eff.effect.value;
              return '<div class="bg-panel rounded-lg p-3 border" style="border-color:' + rarityColor + '55">' +
                '<div class="flex items-center justify-between mb-1">' +
                  '<span class="font-bold" style="color:' + rarityColor + '">' + eff.icon + ' ' + eff.name + '</span>' +
                  '<span class="text-xs px-1 rounded" style="background:' + rarityColor + '22;color:' + rarityColor + '">' + rarityName + '</span>' +
                '</div>' +
                '<p class="text-xs text-secondary">' + eff.desc + '</p>' +
                '<div class="flex items-center justify-between mt-1">' +
                  '<span class="text-xs text-yellow-400">' + starHtml + ' (' + eff.star + '/' + maxStar + '星)' + maxedBadge + '</span>' +
                  '<span class="text-xs text-green-400 font-bold">当前效果：' + effectStr + '</span>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>'
        ) +
      '</div>' +
      '<div class="bg-panel border border-game rounded-xl p-3 text-xs text-secondary space-y-1">' +
        '<p class="font-bold text-secondary">📌 神通规则（v2.11.0 更新）</p>' +
        '<p>· 神通效果自动应用于所有出战宠物</p>' +
        '<p>· 重复抽取到已拥有的神通时，自动提升星级</p>' +
        '<p>· 星级提升后基础效果翻倍增长（1星→2星×2，2星→3星×4...6星×32）</p>' +
        '<p>· v2.11.0：神通最高6星，满星后从抽取池剔除，不再重复抽取</p>' +
        '<p>· 神通品质越高基础效果越强</p>' +
      '</div>' +
    '</div>';
  }
  
  return '\n  <div class="min-h-screen flex flex-col">\n    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">\n      <h1 class="font-fantasy text-gold text-lg">🌀 六道轮回</h1>\n      <div class="flex gap-3 text-sm items-center">\n        <span class="text-cyan-400">🔄 轮回积分 <span class="font-bold text-lg">' + (samsara.reincarnationPoints || 0) + '</span></span>\n        <span class="text-secondary">| 转生 ' + G.player.rebirth + '</span>\n      </div>\n    </header>\n    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">' + renderNav() + '</nav>\n    <div class="bg-panel border-b border-game px-2 py-2 flex gap-1">' + tabsHtml + '</div>\n    <main class="flex-1 p-4 max-w-5xl mx-auto w-full">\n      ' + contentHtml + '\n    </main>\n  </div>';
}

// ==================== 六道轮回 UI 事件处理 ====================

function startSamsaraUI() {
  if (typeof startSamsaraChallenge !== 'function') {
    showToast('功能未定义', 'error');
    return;
  }
  var result = startSamsaraChallenge();
  if (result) {
    showToast('🌀 六道轮回挑战开始！', 'success');
    render();
  }
}

function doSamsaraBattle() {
  if (typeof startSamsaraBattle !== 'function') {
    showToast('功能未定义', 'error');
    return;
  }
  var result = startSamsaraBattle();
  if (!result) {
    showToast('挑战失败，请重试', 'error');
    return;
  }
  // 构建战斗日志HTML
  var logHtml = result.log.map(function(l) { return '<p class="' + (l.indexOf('阵亡') >= 0 ? 'text-red-400' : l.indexOf('暴击') >= 0 ? 'text-yellow-400' : 'text-secondary') + '">' + l + '</p>'; }).join('');
  window._samsaraBattleLog = logHtml;
  
  if (result.victory) {
    showToast('✅ 通关第' + result.floor + '层！获得 🪙' + (result.rewards ? result.rewards.gold : 0) + ' ⭐' + (result.rewards ? result.rewards.exp : 0) + '经验', 'success');
  } else {
    showToast('❌ 第' + result.floor + '层挑战失败！挑战终止', 'error');
    window._samsaraBattleLog = '<p class="text-red-400 font-bold">挑战失败！第' + result.floor + '层 轮回守卫过于强大</p>' + logHtml;
  }
  render();
}

function quitSamsaraChallenge() {
  if (!confirm('确定退出当前挑战？退出后可重新开始。')) return;
  if (typeof samsaraQuitChallenge === 'function') samsaraQuitChallenge();
  window._samsaraBattleLog = null;
  showToast('已退出六道轮回挑战', 'info');
  render();
}

function confirmSamsaraSettle() {
  // v2.10.0 需求5.1：转生按钮始终可点击，条件校验在此处统一处理，给出明确提示
  if (!G.samsara || G.samsara.currentFloor < SAMSARA_REBIRTH_MIN_FLOOR) {
    showToast('需要通关至少' + SAMSARA_REBIRTH_MIN_FLOOR + '层才能结算转生（当前' + (G.samsara ? G.samsara.currentFloor : 0) + '层）', 'error');
    return;
  }
  if (G.player.level < G.player.maxLevel) {
    showToast('需达到等级上限' + G.player.maxLevel + '级才能结算转生（当前' + G.player.level + '级）', 'error');
    return;
  }
  var points = (typeof calcSamsaraPoints === 'function') ? calcSamsaraPoints(G.samsara.currentFloor) : 0;
  if (!confirm('结算转生将执行以下操作：\n\n' +
    '· 获得轮回积分：' + points + '\n' +
    '· 角色等级重置为1\n' +
    '· 宠物等级重置为1\n' +
    '· 等级上限+10\n' +
    '· 挑战进度重置\n\n' +
    '确定结算转生吗？')) return;
  if (typeof samsaraSettleRebirth === 'function') {
    var result = samsaraSettleRebirth();
    if (result) {
      window._samsaraBattleLog = null;
      render();
    }
  }
}

function doSamsaraGacha(times) {
  if (typeof samsaraDivinePowerGacha !== 'function') {
    showToast('功能未定义', 'error');
    return;
  }
  var results = samsaraDivinePowerGacha(times);
  if (!results || results.length === 0) return;
  
  // 构建抽奖结果弹窗
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'samsara-gacha-modal';
  var html = '<div class="modal-content scrollbar-thin" style="max-width:520px;max-height:85vh;">' +
    '<div class="flex items-center justify-between mb-4">' +
      '<h2 class="font-bold text-lg text-gold">🎰 神通抽奖结果</h2>' +
      '<button class="text-secondary hover:text-white text-xl" onclick="closeSamsaraGachaModal()">✕</button>' +
    '</div>' +
    '<div class="space-y-2 max-h-[60vh] overflow-y-auto">';
  
  results.forEach(function(r) {
    var rarityColor = { rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b', mythic: '#ef4444' }[r.power.rarity] || '#9ca3af';
    var rarityName = { rare: '稀有', epic: '史诗', legendary: '传说', mythic: '神话' }[r.power.rarity] || r.power.rarity;
    var starHtml = '';
    for (var s = 0; s < r.newStar; s++) starHtml += '⭐';
    // v2.11.0 需求7.1：满星标识
    var maxedTag = r.maxed ? '<span class="text-xs px-1 rounded ml-1" style="background:#fde04722;color:#fde047">满星</span>' : '';
    html += '<div class="bg-panel rounded-lg p-3 border" style="border-color:' + rarityColor + '55">' +
      '<div class="flex items-center justify-between">' +
        '<span class="font-bold text-lg" style="color:' + rarityColor + '">' + r.power.icon + ' ' + r.power.name + '</span>' +
        '<span class="text-xs px-2 py-1 rounded" style="background:' + rarityColor + '22;color:' + rarityColor + '">' + rarityName + '</span>' +
      '</div>' +
      '<p class="text-xs text-secondary mt-1">' + r.power.desc + '</p>' +
      '<p class="text-xs mt-1">' + (r.isDup ? '<span class="text-yellow-400">🎉 重复获得！升星至 ' + r.newStar + ' 星 ' + starHtml + maxedTag + '</span>' : '<span class="text-green-400">✨ 新获得神通！ ' + starHtml + '</span>') + '</p>' +
    '</div>';
  });
  
  html += '</div>' +
    '<button class="btn-gold btn-sm mt-3 w-full" onclick="closeSamsaraGachaModal()">确定</button>' +
  '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeSamsaraGachaModal(); });
  
  render();
}

function closeSamsaraGachaModal() {
  var modal = document.getElementById('samsara-gacha-modal');
  if (modal) modal.remove();
}

function renderFusionScreen() {
  var sheet = window._evoSheet || 'fusion';
var sheetTabs = [
{ id: 'fusion', label: '融合', icon: '⚗️' },
{ id: 'rebirth', label: '重生', icon: '🔄' },
{ id: 'bloodline', label: '血统', icon: '🔮' },
{ id: 'refine', label: '炼化', icon: '🔥' },
{ id: 'advance', label: '进阶', icon: '⭐' },
// v2.9.0 需求5.1：打书功能迁移至进化页面
{ id: 'skillbook', label: '打书', icon: '📖' },
];
  var tabsHtml = sheetTabs.map(function(t) {
    var active = sheet === t.id;
    return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + '" onclick="window._evoSheet=\'' + t.id + '\';window._rebirthPreview=null;render()">' + t.icon + ' ' + t.label + '</button>';
  }).join('');

  var contentHtml = '';
  if (sheet === 'rebirth') {
    // ===== 重生（宠物重置）sheet =====
    var selectedPetId = window._rebirthPetId || '';
    var preview = window._rebirthPreview || null;
    var selectedPet = selectedPetId ? G.pets.find(function(p) { return p.id === selectedPetId; }) : null;
    var tier = selectedPet ? getPetTier(selectedPet.name) : 0;
    var needItem = tier >= 4 ? 'guixu_pill' : 'guiyuan_pill';
    var needName = tier >= 4 ? '归虚丹' : '归元丹';
    var inv = G.inventory.find(function(i) { return i.id === needItem; });
    var hasItem = inv && inv.count > 0;

    contentHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-2">🔄 宠物重生</h2>' +
      '<p class="text-xs text-secondary mb-3">重置宠物的成长、资质、技能（保留等级/种族/血统）。T1-T3需要归元丹，T4-T5需要归虚丹。</p>' +
      '<div class="mb-4">' +
        '<p class="text-sm font-bold mb-2">选择宠物</p>' +
        '<select id="rebirthPetSelect" class="w-full" onchange="selectRebirthPet(this.value)">' +
          '<option value="">-- 选择宠物 --</option>' +
          G.pets.filter(function(p) { return !G.player.activeTeam.includes(p.id); }).map(function(p) {
            var t = getPetTier(p.name);
            var ni = t >= 4 ? 'guixu_pill' : 'guiyuan_pill';
            var iv = G.inventory.find(function(i) { return i.id === ni; });
            var has = iv && iv.count > 0;
            return '<option value="' + p.id + '"' + (selectedPetId === p.id ? ' selected' : '') + '>' + p.name + ' (T' + (t+1) + ' · ' + RARITY_NAMES[RARITIES.indexOf(p.rarity)] + ' · Lv.' + p.level + ')' + (has ? '' : ' [缺' + (t>=4?'归虚丹':'归元丹') + ']') + '</option>';
          }).join('') +
        '</select>' +
      '</div>';

    if (selectedPet) {
      // 显示当前属性
      var curGrowth = selectedPet.growth || 1.0;
      var curApt = selectedPet.aptitude || {};
      var curSkills = getAllSkills(selectedPet).map(function(s) { return s.name; }).join('、') || '无';
      var dex = getPetDex(selectedPet.name);

      contentHtml += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">' +
        // 当前属性
        '<div class="bg-panel rounded-lg p-3 border border-game">' +
          '<h3 class="font-bold text-sm mb-2 text-cyan-400">📋 当前属性</h3>' +
          '<div class="text-xs space-y-1">' +
            '<p><span class="text-secondary">品质：</span><span style="color:' + (RARITY_COLORS[RARITIES.indexOf(selectedPet.rarity)] || '#9ca3af') + ';" class="font-bold">' + RARITY_NAMES[RARITIES.indexOf(selectedPet.rarity)] + '</span></p>' +
            '<p><span class="text-secondary">成长：</span><span class="text-gold font-bold">' + curGrowth.toFixed(2) + '</span></p>' +
            APTITUDE_KEYS.map(function(k) {
              var v = curApt[k] || 1500;
              var range = (dex.aptRange && dex.aptRange[k]) || [1000, 2000];
              var pct = Math.max(0, Math.min(100, Math.floor((v - range[0]) / Math.max(1, range[1] - range[0]) * 100)));
              return '<p><span class="text-secondary">' + k.replace('资质','') + '：</span><span class="font-bold">' + v + '</span> <span class="text-secondary text-xs">(' + pct + '%)</span></p>';
            }).join('') +
            '<p><span class="text-secondary">技能：</span><span class="text-xs">' + curSkills + '</span></p>' +
          '</div>' +
        '</div>';

      if (preview) {
        // 显示预览属性
        var newGrowth = preview.growth;
        var newApt = preview.aptitude;
        var newSkills = preview.skillNames;
        contentHtml +=
          '<div class="bg-panel rounded-lg p-3 border-2 border-yellow-500/50">' +
            '<h3 class="font-bold text-sm mb-2 text-yellow-400">✨ 重生预览</h3>' +
            '<div class="text-xs space-y-1">' +
              '<p><span class="text-secondary">品质：</span><span style="color:' + (RARITY_COLORS[RARITIES.indexOf(preview.rarity)] || '#9ca3af') + ';" class="font-bold">' + RARITY_NAMES[RARITIES.indexOf(preview.rarity)] + '</span>' + (RARITIES.indexOf(preview.rarity) > RARITIES.indexOf(selectedPet.rarity) ? ' <span class="text-green-400">↑</span>' : RARITIES.indexOf(preview.rarity) < RARITIES.indexOf(selectedPet.rarity) ? ' <span class="text-red-400">↓</span>' : ' =') + '</p>' +
              '<p><span class="text-secondary">成长：</span><span class="text-gold font-bold">' + newGrowth.toFixed(2) + '</span>' + (newGrowth > curGrowth ? ' <span class="text-green-400">↑</span>' : newGrowth < curGrowth ? ' <span class="text-red-400">↓</span>' : ' =') + '</p>' +
              APTITUDE_KEYS.map(function(k, i) {
                var v = newApt[k] || 1500;
                var oldV = curApt[k] || 1500;
                var range = (dex.aptRange && dex.aptRange[k]) || [1000, 2000];
                var pct = Math.max(0, Math.min(100, Math.floor((v - range[0]) / Math.max(1, range[1] - range[0]) * 100)));
                var diff = v > oldV ? ' <span class="text-green-400">↑</span>' : v < oldV ? ' <span class="text-red-400">↓</span>' : ' =';
                return '<p><span class="text-secondary">' + k.replace('资质','') + '：</span><span class="font-bold">' + v + '</span> <span class="text-secondary text-xs">(' + pct + '%)</span>' + diff + '</p>';
              }).join('') +
              '<p><span class="text-secondary">技能：</span><span class="text-xs">' + newSkills + '</span></p>' +
            '</div>' +
          '</div>' +
        '</div>';

        // 按钮区域
        contentHtml += '<div class="flex gap-2">' +
          '<button class="btn-gold flex-1" onclick="confirmRebirth(\'' + selectedPetId + '\')">✅ 保留新生</button>' +
          '<button class="btn-primary flex-1" onclick="rePreviewRebirth(\'' + selectedPetId + '\')">🔄 重新预览（再消耗1丹）</button>' +
          '<button class="btn-danger flex-1" onclick="window._rebirthPreview=null;window._rebirthPetId=null;render()">❌ 放弃（已消耗丹药不返还）</button>' +
        '</div>';
      } else {
        contentHtml += '</div>' +
          '<div class="bg-panel rounded-lg p-3 mb-3 text-xs">' +
            '<p class="text-secondary mb-1">📌 重生说明：</p>' +
            '<p>· 成长、资质、技能将重新随机生成</p>' +
            '<p>· 保留等级、种族、血统不变</p>' +
            '<p>· <span class="text-yellow-400">⚠️ 预览即消耗 ' + needName + ' x1</span>，请慎重选择' + (hasItem ? '（当前拥有 ' + inv.count + '）' : '（未拥有，请前往商城购买）') + '</p>' +
            '<p>· 重新预览或放弃均不返还已消耗的丹药</p>' +
          '</div>' +
          '<button class="btn-gold w-full" ' + (!hasItem ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="previewRebirth(\'' + selectedPetId + '\')">🔮 预览重生结果（消耗' + needName + ' x1）</button>';
      }
    }

    contentHtml += '</div>';
  } else if (sheet === 'bloodline') {
    // ===== 血统抽取与植入 sheet =====
    var blPetId = window._bloodlinePetId || '';
    var blPet = blPetId ? G.pets.find(function(p) { return p.id === blPetId; }) : null;

    contentHtml = '<div class="bg-card border border-game rounded-xl p-4 mb-4">' +
      '<h2 class="font-bold text-lg mb-2">🔮 血统抽取</h2>' +
      '<p class="text-xs text-secondary mb-3">选择一只宠物，消耗对应等级的血统珠抽取其血统。⚠️ 抽取会消耗宠物本身，并获得随机品质的血统珠道具。普通60% / 优秀80% / 稀有100% / 史诗120% / 传说150% 原血统能力。</p>' +
      '<div class="mb-4">' +
        '<p class="text-sm font-bold mb-2">选择宠物</p>' +
        '<select id="bloodlinePetSelect" class="w-full" onchange="selectBloodlinePet(this.value)">' +
          '<option value="">-- 选择宠物 --</option>' +
          G.pets.map(function(p) {
            var t = getPetTier(p.name);
            var reqTier = (typeof getRequiredBloodOrbTier === 'function') ? getRequiredBloodOrbTier(p) : 'blood_orb_low';
            var tierDef = BLOOD_ORB_TIERS.find(function(x) { return x.id === reqTier; });
            var tierName = tierDef ? tierDef.name : '血统珠';
            var orbCount = (typeof getBloodOrbCount === 'function') ? getBloodOrbCount(reqTier) : 0;
            return '<option value="' + p.id + '"' + (blPetId === p.id ? ' selected' : '') + '>' + p.name + ' (T' + (t+1) + ' · ' + p.race + ' · ' + RARITY_NAMES[RARITIES.indexOf(p.rarity)] + ' · 需' + tierName + ' x' + orbCount + ')</option>';
          }).join('') +
        '</select>' +
      '</div>';

    if (blPet) {
      // 显示当前宠物的血统信息
      var curBlSkill = (typeof getPetBloodlineSkill === 'function') ? getPetBloodlineSkill(blPet) : null;
      var curReqTier = (typeof getRequiredBloodOrbTier === 'function') ? getRequiredBloodOrbTier(blPet) : 'blood_orb_low';
      var curTierDef = BLOOD_ORB_TIERS.find(function(x) { return x.id === curReqTier; });
      var curOrbCount = (typeof getBloodOrbCount === 'function') ? getBloodOrbCount(curReqTier) : 0;
      var curTier = getPetTier(blPet.name);
      var curRarity = blPet.rarity;

      contentHtml += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">' +
        // 当前血统信息
        '<div class="bg-panel rounded-lg p-3 border border-game">' +
          '<h3 class="font-bold text-sm mb-2 text-purple-400">🩸 当前血统</h3>' +
          (curBlSkill ? (
            '<div class="text-xs space-y-1">' +
              '<p><span class="text-secondary">血统名：</span><span class="font-bold text-purple-300">' + curBlSkill.name + '</span></p>' +
              '<p><span class="text-secondary">种族：</span>' + blPet.race + '</p>' +
              '<p><span class="text-secondary">效果：</span>' + (curBlSkill.desc || '无描述') + '</p>' +
              (blPet.bloodlineOrb ? (
                '<p class="text-yellow-400 mt-2">💎 已植入血统珠：' +
                  (function() {
                    // 显示宠物自身专属血统名称（PET_BLOODLINE_DEX 已清理，使用 PET_BLOOD_ALL）
                    var petBlood = (typeof PET_BLOOD_ALL !== 'undefined' && blPet.name && PET_BLOOD_ALL[blPet.name]) ? PET_BLOOD_ALL[blPet.name] : null;
                    return petBlood ? petBlood.name : (blPet.name + '之血');
                  })() + '·' + BLOOD_ORB_QUALITY_NAMES[blPet.bloodlineOrb.quality] +
                  '（来源：' + blPet.bloodlineOrb.sourcePetName + '）</p>' +
                '<button class="btn-danger text-xs mt-2" onclick="removePetBloodlineOrb(\'' + blPet.id + '\')">取出当前血统珠</button>'
              ) : '<p class="text-secondary mt-2">未植入血统珠（使用专属血统）</p>') +
            '</div>'
          ) : '<p class="text-xs text-secondary">无血统信息</p>') +
        '</div>' +
        // 抽取信息
        '<div class="bg-panel rounded-lg p-3 border-2 border-purple-500/50">' +
          '<h3 class="font-bold text-sm mb-2 text-purple-400">🔮 抽取预览</h3>' +
          '<div class="text-xs space-y-1">' +
            '<p><span class="text-secondary">目标宠物：</span>' + getPetDisplayName(blPet) + '</p>' +
            '<p><span class="text-secondary">宠物T级：</span>T' + (curTier+1) + '</p>' +
            '<p><span class="text-secondary">所需血统珠：</span>' + (curTierDef ? curTierDef.name : '未知') + '（持有 x' + curOrbCount + '）</p>' +
            '<p><span class="text-secondary">宠物品质：</span>' + RARITY_NAMES[RARITIES.indexOf(curRarity)] + '</p>' +
            '<p><span class="text-secondary">抽取品质（随机）：</span></p>' +
            '<p class="text-secondary pl-2">普通30% / 优秀25% / 稀有20% / 史诗15% / 传说10%</p>' +
            '<p class="text-yellow-400 mt-2">⚠️ 抽取会消耗宠物，请谨慎操作</p>' +
          '</div>' +
        '</div>' +
      '</div>';

      // 抽取按钮
      var canExtract = curOrbCount > 0;
      contentHtml += '<button class="btn-gold w-full mb-3" ' + (!canExtract ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="extractPetBloodline(\'' + blPet.id + '\',\'' + curReqTier + '\')">🔮 抽取血统（消耗' + (curTierDef ? curTierDef.name : '血统珠') + ' x1）</button>';
    }

    // 已抽取的血统珠列表（支持分解）
    var extractedOrbs = G.inventory.filter(function(i) { return i.isExtractedBloodOrb; });
    contentHtml += '<div class="bg-card border border-game rounded-xl p-4 mb-4">' +
      '<h3 class="font-bold text-sm mb-2">💎 已抽取的血统珠（可分解）</h3>';
    if (extractedOrbs.length === 0) {
      contentHtml += '<p class="text-xs text-secondary">暂无已抽取的血统珠</p>';
    } else {
      contentHtml += '<div class="space-y-2">';
      extractedOrbs.forEach(function(orb) {
        var ob = BLOODLINE_SKILLS.find(function(b) { return b.id === orb.bloodlineId; });
        // 优先显示来源宠物的专属血统名称与描述（PET_BLOODLINE_DEX 已清理，使用 PET_BLOOD_ALL）
        var petBloodEntry = (typeof PET_BLOOD_ALL !== 'undefined' && orb.sourcePetName && PET_BLOOD_ALL[orb.sourcePetName]) ? PET_BLOOD_ALL[orb.sourcePetName] : null;
        var blName = petBloodEntry ? petBloodEntry.name : (ob ? ob.name : '未知血统');
        var blDesc = petBloodEntry ? petBloodEntry.desc : (ob ? ob.desc : '');
        var qColor = BLOOD_ORB_QUALITY_COLORS[orb.quality] || '#9ca3af';
        var qName = BLOOD_ORB_QUALITY_NAMES[orb.quality] || orb.quality;
        var decompTier = BLOOD_ORB_DECOMPOSE_RULES[orb.quality];
        var decompDef = decompTier ? BLOOD_ORB_TIERS.find(function(t) { return t.id === decompTier; }) : null;
        contentHtml += '<div class="bg-panel rounded-lg p-2 border border-game flex items-center justify-between gap-2">' +
          '<div class="flex-1 text-xs">' +
            '<p class="font-bold" style="color:' + qColor + ';">' + blName + '·' + qName + '</p>' +
            '<p class="text-secondary">来源：' + orb.sourcePetName + '（' + (orb.sourcePetRace || '?') + '）</p>' +
            '<p class="text-secondary">' + blDesc + '</p>' +
            (decompDef ? '<p class="text-yellow-400 mt-1">分解可得：' + decompDef.name + ' x1</p>' : '') +
          '</div>' +
          '<button class="btn-danger text-xs px-2 py-1" onclick="decomposeExtractedBloodOrb(\'' + orb.id + '\')">🔥 分解</button>' +
        '</div>';
      });
      contentHtml += '</div>';
    }
    contentHtml += '</div>' +
      // 血统珠库存
      '<div class="bg-card border border-game rounded-xl p-4">' +
        '<h3 class="font-bold text-sm mb-2">📦 血统珠库存</h3>' +
        '<div class="grid grid-cols-3 gap-2 text-xs">' +
          BLOOD_ORB_TIERS.map(function(t) {
            var cnt = (typeof getBloodOrbCount === 'function') ? getBloodOrbCount(t.id) : 0;
            return '<div class="bg-panel rounded p-2 border border-game text-center">' +
              '<p class="font-bold text-purple-300">' + t.name + '</p>' +
              '<p class="text-yellow-400 font-bold">x' + cnt + '</p>' +
              '<p class="text-secondary">T' + t.minTier + '-' + t.maxTier + '</p>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<p class="text-xs text-secondary mt-2">📌 通过「活动 → 血统试炼」获取血统珠</p>' +
'</div>';
} else if (sheet === 'refine') {
// ===== 需求10：宠物炼化 sheet =====
contentHtml = renderRefineSheet();
  } else if (sheet === 'advance') {
    // ===== 新进阶系统 sheet =====
    contentHtml = renderAdvanceSheet();
  } else if (sheet === 'skillbook') {
    // v2.9.0 需求5.1：打书功能迁移至进化页面
    contentHtml = renderSkillBookSheet();
  } else {
    contentHtml = '<div class="bg-card border border-game rounded-xl p-4 mb-4">' +
      '<h2 class="font-bold text-lg mb-3">选择两只宠物进行融合</h2>' +
      '<p class="text-xs text-secondary mb-3">⚠️ 融合后两只宠物将消失，产生一只新宠物。有极低概率出现特殊宠物！</p>' +
      '<p class="text-xs text-yellow-400 mb-3">📌 已上阵的宠物无法作为融合材料，请先卸下再融合。</p>' +
      '<div class="grid grid-cols-2 gap-4 mb-4">' +
        '<div>' +
          '<p class="text-sm font-bold mb-2">宠物 A</p>' +
          '<select id="fusionPet1" class="w-full" onchange="updateFusionPreview()">' +
            '<option value="">-- 选择宠物 --</option>' +
            G.pets.filter(function(p) { return !G.player.activeTeam.includes(p.id); }).map(function(p) { return '<option value="' + p.id + '">' + p.name + ' (' + p.race + ' · ' + RARITY_NAMES[RARITIES.indexOf(p.rarity)] + ' · Lv.' + p.level + ')</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div>' +
          '<p class="text-sm font-bold mb-2">宠物 B</p>' +
          '<select id="fusionPet2" class="w-full" onchange="updateFusionPreview()">' +
            '<option value="">-- 选择宠物 --</option>' +
            G.pets.filter(function(p) { return !G.player.activeTeam.includes(p.id); }).map(function(p) { return '<option value="' + p.id + '">' + p.name + ' (' + p.race + ' · ' + RARITY_NAMES[RARITIES.indexOf(p.rarity)] + ' · Lv.' + p.level + ')</option>'; }).join('') +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div id="fusionPreview" class="text-center text-secondary text-sm mb-3">请选择两只宠物</div>' +
      '<button class="btn-gold w-full" id="btnFuse" onclick="doFusion()" disabled>⚗️ 融合</button>' +
      '</div>' +
      '<div class="bg-card border border-game rounded-xl p-4">' +
        '<h2 class="font-bold text-lg mb-3">融合规则说明</h2>' +
        '<div class="text-xs text-secondary space-y-1">' +
          '<p>· 两只宠物融合产生一只新宠物</p>' +
          '<p>· 稀有度取两者平均，有小概率提升</p>' +
          '<p>· 相同技能可能升级（如 连击+连击=高级连击）</p>' +
          '<p>· 不同技能组合可能产生多技能宠物</p>' +
          '<p>· 极低概率(1.5%)出现融合限定特殊宠物</p>' +
          '<p>· 血统技能（被动）有概率继承</p>' +
          '<p>· 成长值从两只宠物的较低值和较高值之间随机取值</p>' +
        '</div>' +
      '</div>';
  }

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🧬 进化</h1>
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

// 选择重生宠物
function selectRebirthPet(petId) {
  window._rebirthPetId = petId;
  window._rebirthPreview = null;
  render();
}

// v2.9.0 需求5.1：打书功能迁移至进化页面 —— 打书 sheet 渲染
// v2.11.0 需求1.1：打书界面技能信息块——展示技能类型/品级/效果描述/触发概率
// 与宠物详情页技能展示完全一致
function _renderSkillBookInfoBlock(skill) {
  if (!skill) return '';
  var typeIcon = getSkillTypeIcon(skill.type);
  var typeLabel = getSkillTypeLabel(skill.type);
  var tier = skill.tier || getSkillTier(skill.id);
  var tierLabel = getSkillTierLabel(tier);
  var tierColor = getSkillTierColor(tier);
  var typeBg = skill.type === 'active' ? 'bg-red-900 text-red-300' : skill.type === 'aura' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300';
  // 触发概率提示（仅主动技能显示，与 battle.js tryUseActiveSkill 一致）
  var triggerInfo = '';
  if (skill.type === 'active') {
    var isSupport = (skill.category === 'single_heal' || skill.category === 'aoe_heal' || skill.category === 'single_buff' || skill.category === 'aoe_buff');
    var isMagic = !isPhysicalSkill(skill);
    var baseChance, maxChance, chanceLabel;
    if (isSupport) { baseChance = 0.25; maxChance = 0.50; chanceLabel = '辅助'; }
    else if (isMagic) { baseChance = 0.20; maxChance = 0.40; chanceLabel = '法术'; }
    else { baseChance = 0.08; maxChance = 0.15; chanceLabel = '物理'; }
    triggerInfo = '<span class="text-[10px] text-yellow-500">触发' + chanceLabel + (baseChance * 100).toFixed(0) + '%~' + (maxChance * 100).toFixed(0) + '%</span>';
  } else if (skill.type === 'passive' || skill.type === 'aura') {
    triggerInfo = '<span class="text-[10px] text-secondary">被动生效</span>';
  }
  return '<div class="bg-panel rounded-lg p-2 border border-game">' +
    '<div class="flex items-center gap-1 mb-1 flex-wrap">' +
      '<span class="text-xs px-1 py-0.5 rounded ' + typeBg + '">' + typeIcon + ' ' + typeLabel + '</span>' +
      '<span class="text-xs px-1 py-0.5 rounded font-bold" style="background:' + tierColor + '22;color:' + tierColor + '">' + tierLabel + '</span>' +
      triggerInfo +
    '</div>' +
    '<p class="font-bold text-xs">' + skill.name + '</p>' +
    '<p class="text-xs text-secondary mt-0.5">' + (skill.desc || '') + '</p>' +
  '</div>';
}

function renderSkillBookSheet() {
  var selectedPetId = window._skillBookPetId || '';
  var selectedPet = selectedPetId ? G.pets.find(function(p) { return p.id === selectedPetId; }) : null;
  var books = G.skillBooks.filter(function(b) { return b.count > 0; });

  var html = '<div class="bg-card border border-game rounded-xl p-4 mb-4">' +
    '<h2 class="font-bold text-lg mb-2">📖 宠物打书</h2>' +
    '<p class="text-xs text-secondary mb-3">选择目标宠物，消耗技能书为其打书。打书消耗100金币手续费，可能开新格或顶掉已有技能。</p>' +
    '<div class="mb-4">' +
      '<p class="text-sm font-bold mb-2">选择目标宠物</p>' +
      '<select id="skillBookPetSelect" class="w-full" onchange="window._skillBookPetId=this.value;render()">' +
        '<option value="">-- 选择宠物 --</option>' +
        G.pets.map(function(p) {
          return '<option value="' + p.id + '"' + (selectedPetId === p.id ? ' selected' : '') + '>' + p.name + ' (' + p.race + ' · ' + RARITY_NAMES[RARITIES.indexOf(p.rarity)] + ' · Lv.' + p.level + ')</option>';
        }).join('') +
      '</select>' +
    '</div>';

  if (selectedPet) {
    // v2.10.0 需求3.2：打书界面仅展示原生技能与打书获得的技能，排除装备附加技能
    var normalSkills = getNormalSkills(selectedPet);
    var maxSlots = getMaxSkillSlots(selectedPet);
    // v2.11.0 需求1.1：当前技能栏展示完整技能信息（类型/品级/效果描述/触发概率）
    html += '<div class="mb-4 bg-panel rounded-lg p-3 border border-game">' +
      '<h3 class="font-bold text-sm mb-2">📋 当前技能 (' + normalSkills.length + '/' + maxSlots + ')</h3>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' +
        normalSkills.map(function(s) {
          var isInnate = s.isInnate;
          var tag = isInnate ? '<span class="text-[10px] text-blue-400">[天生]</span>' : '<span class="text-[10px] text-green-400">[学习]</span>';
          return '<div class="relative">' + _renderSkillBookInfoBlock(s) + '<div class="absolute top-1 right-1">' + tag + '</div></div>';
        }).join('') +
      '</div>' +
    '</div>';

    // 技能书列表
    if (books.length === 0) {
      html += '<div class="text-center text-secondary text-sm py-4">背包中没有技能书，请先获取技能书</div>';
    } else {
      html += '<div class="mb-4">' +
        '<h3 class="font-bold text-sm mb-2">📖 打书（选择技能书使用）</h3>' +
        '<div class="flex flex-wrap gap-1 mb-2">' +
          '<button class="text-xs px-2 py-1 rounded border ' + (!window._skillBookFilter || window._skillBookFilter === 'all' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'all\';render()">全部</button>' +
          '<button class="text-xs px-2 py-1 rounded border ' + (window._skillBookFilter === 'active' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'active\';render()">⚔️ 主动</button>' +
          '<button class="text-xs px-2 py-1 rounded border ' + (window._skillBookFilter === 'passive_t1' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'passive_t1\';render()">🛡️ 初级被动</button>' +
          '<button class="text-xs px-2 py-1 rounded border ' + (window._skillBookFilter === 'passive_t2' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'passive_t2\';render()">🛡️ 高级被动</button>' +
          '<button class="text-xs px-2 py-1 rounded border ' + (window._skillBookFilter === 'passive_t3' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'passive_t3\';render()">🛡️ 超级被动</button>' +
          '<button class="text-xs px-2 py-1 rounded border ' + (window._skillBookFilter === 'aura_t1' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'aura_t1\';render()">✨ 初级光环</button>' +
          '<button class="text-xs px-2 py-1 rounded border ' + (window._skillBookFilter === 'aura_t2' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'aura_t2\';render()">✨ 高级光环</button>' +
          '<button class="text-xs px-2 py-1 rounded border ' + (window._skillBookFilter === 'aura_t3' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary') + '" onclick="window._skillBookFilter=\'aura_t3\';render()">✨ 超级光环</button>' +
        '</div>' +
        // v2.11.0 需求1.1：技能书栏展示完整技能信息（类型/品级/效果描述/触发概率）
        '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">' +
          books.filter(function(b) {
            if (!window._skillBookFilter || window._skillBookFilter === 'all') return true;
            var skill = getSkillById(b.id);
            if (!skill) return false;
            var f = window._skillBookFilter;
            if (f === 'active') return skill.type === 'active';
            if (f === 'passive_t1') return skill.type === 'passive' && skill.tier === 1;
            if (f === 'passive_t2') return skill.type === 'passive' && skill.tier === 2;
            if (f === 'passive_t3') return skill.type === 'passive' && skill.tier === 3;
            if (f === 'aura_t1') return skill.type === 'aura' && skill.tier === 1;
            if (f === 'aura_t2') return skill.type === 'aura' && skill.tier === 2;
            if (f === 'aura_t3') return skill.type === 'aura' && skill.tier === 3;
            return true;
          }).map(function(b) {
            var skill = getSkillById(b.id);
            var baseId = getSkillBaseId(b.id);
            // v2.10.0 需求3.2：hasSame 检查排除装备附加技能，避免装备技能干扰打书顶替判定
            var hasSame = normalSkills.some(function(s) { return getSkillBaseId(s.id) === baseId; });
            var infoBlock = _renderSkillBookInfoBlock(skill);
            return '<div class="relative ' + (hasSame ? 'opacity-40' : 'cursor-pointer hover:border-purple-500') + '" ' + (hasSame ? '' : 'onclick="useSkillBook(\'' + selectedPet.id + '\',\'' + b.id + '\')"') + '>' +
              infoBlock +
              '<div class="flex items-center justify-between mt-1">' +
                '<span class="text-xs text-yellow-400">持有 ×' + b.count + '</span>' +
                (hasSame ? '<span class="text-[10px] text-red-400">已有同名</span>' : '<span class="text-[10px] text-green-400">点击打书</span>') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<p class="text-xs text-secondary mt-2">📌 打书消耗100金币手续费，可能开新格或顶掉已有技能（含天生技能）</p>' +
      '</div>';
    }
  } else {
    html += '<div class="text-center text-secondary text-sm py-4">请先选择目标宠物</div>';
  }

  html += '</div>';
  return html;
}

// 需求10：宠物炼化 sheet 渲染
function renderRefineSheet() {
  // 功能解锁检查
  var refineUnlockLv = getFeatureUnlockLevel('pet_refine');
  if (!isFeatureUnlocked('pet_refine')) {
    return '<div class="bg-card border border-game rounded-xl p-6 text-center">' +
      '<div class="text-4xl mb-3">🔒</div>' +
      '<p class="text-secondary text-sm">宠物炼化功能将在 <span class="text-gold font-bold">Lv.' + refineUnlockLv + '</span> 解锁</p>' +
      '<p class="text-xs text-secondary mt-2">炼化大师低语：「宠物的灵魂之中，沉睡着无穷的技能之力...」</p>' +
      '</div>';
  }
  // 全局开关检查
  if (typeof PET_REFINE_CONFIG !== 'undefined' && PET_REFINE_CONFIG.enabled === false) {
    return '<div class="bg-card border border-game rounded-xl p-6 text-center">' +
      '<div class="text-4xl mb-3">🚫</div>' +
      '<p class="text-secondary text-sm">炼化功能暂时关闭</p>' +
      '</div>';
  }

  var selectedPetId = window._refinePetId || '';
  var selectedItemId = window._refineItemId || 'refine_essence';
  var selectedPet = selectedPetId ? G.pets.find(function(p) { return p.id === selectedPetId; }) : null;
  var isConfirmed = window._refineConfirmed || false;

  // 炼化道具库存
  var essenceItem = G.inventory.find(function(i) { return i.id === 'refine_essence'; });
  var essenceCount = essenceItem ? essenceItem.count : 0;
  var crystalItem = G.inventory.find(function(i) { return i.id === 'refine_crystal'; });
  var crystalCount = crystalItem ? crystalItem.count : 0;

  var html = '<div class="bg-card border border-game rounded-xl p-4 mb-4">' +
    '<h2 class="font-bold text-lg mb-2">🔥 宠物炼化</h2>' +
    '<p class="text-xs text-secondary mb-3">消耗1只宠物 + 1个炼化道具，随机抽取宠物技能转化为技能书。无论成功或失败，宠物和道具都会销毁。</p>' +
    '<div class="bg-red-900/20 border border-red-700/50 rounded-lg p-2 mb-3">' +
      '<p class="text-xs text-red-400">⚠️ <span class="font-bold">炼化规则：</span></p>' +
      '<p class="text-xs text-red-300/80 mt-1">· 已上阵宠物无法炼化<br>· 成功：随机获得1本技能书<br>· 失败：仅消耗材料，不产出技能书</p>' +
    '</div>';

  // 宠物选择网格
  html += '<div class="mb-4">' +
    '<p class="text-sm font-bold mb-2">选择宠物（可炼化宠物高亮显示）</p>' +
    '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">' +
    G.pets.map(function(p) {
var inTeam = G.player.activeTeam && G.player.activeTeam.indexOf(p.id) >= 0;
var canRefine = !inTeam;
var isSelected = selectedPetId === p.id;
var borderCls = isSelected ? 'border-yellow-500 bg-yellow-900/30' :
canRefine ? 'border-orange-600 bg-orange-900/20 cursor-pointer hover:bg-orange-900/40' :
'border-game bg-panel opacity-40 cursor-not-allowed';
var badge = canRefine ? '<span class="text-[10px] text-orange-400 font-bold">✅ 可炼化</span>' :
inTeam ? '<span class="text-[10px] text-blue-400">上阵中</span>' :
'<span class="text-[10px] text-secondary">不可炼化</span>';
      var clickHandler = canRefine ? ('onclick="selectRefinePet(\'' + p.id + '\')"') : '';
      // 收集可抽取技能数量
      var skillCount = 0;
      if (p.innateSkills) skillCount += p.innateSkills.filter(function(s) { return s && s.id && s.type !== 'bloodline' && !s.isEquipSkill; }).length;
      if (p.learnedSkills) skillCount += p.learnedSkills.filter(function(s) { return s && s.id && s.type !== 'bloodline' && !s.isEquipSkill; }).length;
      return '<div class="border rounded-lg p-2 ' + borderCls + '" ' + clickHandler + '>' +
        '<div class="flex items-center justify-between mb-1">' +
        '<span class="text-xs font-bold" style="color:' + (RARITY_COLORS[RARITIES.indexOf(p.rarity)] || '#9ca3af') + '">' + getPetDisplayName(p) + '</span>' +
        badge +
        '</div>' +
        '<div class="text-[10px] text-secondary">Lv.' + p.level + ' · ' + RARITY_NAMES[RARITIES.indexOf(p.rarity)] + '</div>' +
        '<div class="text-[10px] text-yellow-400">可抽技能 ×' + skillCount + '</div>' +
      '</div>';
    }).join('') +
    '</div>' +
    '</div>';

  // 炼化道具选择
  html += '<div class="mb-4">' +
    '<p class="text-sm font-bold mb-2">选择炼化道具</p>' +
    '<div class="grid grid-cols-2 gap-2">' +
      '<div class="border rounded-lg p-3 cursor-pointer ' + (selectedItemId === 'refine_essence' ? 'border-yellow-500 bg-yellow-900/30' : 'border-game bg-panel hover:bg-panel/80') + '" onclick="selectRefineItem(\'refine_essence\')">' +
        '<div class="flex items-center justify-between mb-1">' +
        '<span class="text-sm font-bold">🔥 炼化精魄</span>' +
        '<span class="text-xs text-yellow-400">×' + essenceCount + '</span>' +
        '</div>' +
        '<p class="text-xs text-secondary">成功率 50%</p>' +
        '<p class="text-[10px] text-secondary mt-1">金币购买，低品质材料</p>' +
      '</div>' +
      '<div class="border rounded-lg p-3 cursor-pointer ' + (selectedItemId === 'refine_crystal' ? 'border-yellow-500 bg-yellow-900/30' : 'border-game bg-panel hover:bg-panel/80') + '" onclick="selectRefineItem(\'refine_crystal\')">' +
        '<div class="flex items-center justify-between mb-1">' +
        '<span class="text-sm font-bold">💎 炼化晶石</span>' +
        '<span class="text-xs text-yellow-400">×' + crystalCount + '</span>' +
        '</div>' +
        '<p class="text-xs text-green-400">成功率 85%</p>' +
        '<p class="text-[10px] text-secondary mt-1">钻石购买，高品质推荐</p>' +
      '</div>' +
    '</div>' +
  '</div>';

  if (selectedPet) {
    // 显示选中宠物的可抽取技能列表
    var extractableSkills = [];
    if (selectedPet.innateSkills) {
      selectedPet.innateSkills.forEach(function(s) {
        if (s && s.id && s.type !== 'bloodline' && !s.isEquipSkill) extractableSkills.push(s);
      });
    }
    if (selectedPet.learnedSkills) {
      selectedPet.learnedSkills.forEach(function(s) {
        if (s && s.id && s.type !== 'bloodline' && !s.isEquipSkill) extractableSkills.push(s);
      });
    }

    var itemConfig = (typeof PET_REFINE_CONFIG !== 'undefined' && PET_REFINE_CONFIG.items) ? PET_REFINE_CONFIG.items[selectedItemId] : null;
    var hasItem = (selectedItemId === 'refine_essence' ? essenceCount : crystalCount) > 0;
    var successRate = itemConfig ? Math.floor((itemConfig.successRate || 0.5) * 100) : 50;

    html += '<div class="bg-panel rounded-lg p-3 border-2 border-orange-500/50 mb-3">' +
      '<h3 class="font-bold text-sm mb-2 text-orange-400">🔥 炼化预览</h3>' +
      '<div class="text-xs space-y-1 mb-2">' +
        '<p><span class="text-secondary">目标宠物：</span><span class="font-bold" style="color:' + (RARITY_COLORS[RARITIES.indexOf(selectedPet.rarity)] || '#9ca3af') + '">' + getPetDisplayName(selectedPet) + '</span></p>' +
        '<p><span class="text-secondary">炼化道具：</span>' + (itemConfig ? itemConfig.name : '未知') + ' ×1</p>' +
        '<p><span class="text-secondary">成功率：</span><span class="font-bold ' + (successRate >= 70 ? 'text-green-400' : 'text-yellow-400') + '">' + successRate + '%</span></p>' +
        '<p><span class="text-secondary">可抽取技能（随机1个）：</span></p>' +
      '</div>' +
      '<div class="flex flex-wrap gap-1 mb-2">' +
        extractableSkills.map(function(s) {
          return '<span class="text-xs px-2 py-1 rounded bg-gray-800 text-yellow-400 border border-game">' + (s.name || s.id) + '</span>';
        }).join('') +
      '</div>';

    // 炼化按钮
    var btnText = isConfirmed ? '🔥 确认炼化（宠物将销毁！）' : '🔥 开始炼化';
    var btnCls = isConfirmed ? 'btn-danger' : 'btn-gold';
    html += '<button class="' + btnCls + ' w-full ' + (!hasItem ? 'opacity-40 cursor-not-allowed' : '') + '" ' + (hasItem ? ('onclick="refinePet(\'' + selectedPet.id + '\',\'' + selectedItemId + '\')"') : 'disabled') + '>' +
      btnText +
    '</button>';

    if (!hasItem) {
      html += '<p class="text-xs text-red-400 text-center mt-2">❌ 炼化道具不足，请前往商城购买</p>';
    }
    if (isConfirmed) {
      html += '<p class="text-xs text-red-400 text-center mt-2 animate-pulse">⚠️ 再次点击确认——此操作不可撤销！</p>';
    }
  } else {
    html += '<div class="bg-panel rounded-lg p-4 text-center border border-dashed border-game">' +
      '<p class="text-xs text-secondary">👆 请选择一只宠物进行炼化</p>' +
    '</div>';
  }

  // 道具库存与获取途径
  html += '<div class="bg-card border border-game rounded-xl p-4 mt-3">' +
    '<h3 class="font-bold text-sm mb-2">📦 炼化道具库存</h3>' +
    '<div class="grid grid-cols-2 gap-2 text-xs">' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-orange-400">🔥 炼化精魄</p><p class="text-yellow-400 font-bold">×' + essenceCount + '</p><p class="text-secondary">成功率50%</p></div>' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-cyan-400">💎 炼化晶石</p><p class="text-yellow-400 font-bold">×' + crystalCount + '</p><p class="text-secondary">成功率85%</p></div>' +
    '</div>' +
    '<p class="text-xs text-secondary mt-2">📌 炼化道具可在商城购买，也可通过活动、藏宝图等途径获取</p>' +
  '</div>';

  html += '</div>';
  return html;
}

// 需求10：选择炼化宠物
function selectRefinePet(petId) {
  window._refinePetId = petId;
  window._refineConfirmed = false;
  render();
}

// 需求10：选择炼化道具
function selectRefineItem(itemId) {
  window._refineItemId = itemId;
  window._refineConfirmed = false;
  render();
}

