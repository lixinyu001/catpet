// ===== ui.js : UI 娓叉煋涓庝簨浠跺鐞?=====

// ==================== UI RENDERING ====================

let currentScreen = 'main';
let viewingPetId = null;
let selectingTeamSlot = -1;
let shopQuantities = {};
function getShopQty(id) { return shopQuantities[id] || 1; }
function setShopQty(id, v) { shopQuantities[id] = Math.max(1, Math.min(99, v)); }
function resetShopQty(id) { shopQuantities[id] = 1; }
let autoBattleInterval = null;
let hatchIntervals = {};

// ==================== 通用分页系统 ====================
// 各列表的分页页码状态
let pageStates = {};
function getPage(key) { return pageStates[key] || 1; }
function setPage(key, p) { pageStates[key] = Math.max(1, p); }
function resetPage(key) { pageStates[key] = 1; }
const PAGE_SIZE = 12; // 每页默认显示12项

// 生成分页控件HTML
// key: 分页状态键名, total: 总条数, pageSize: 每页条数(默认12)
// 返回 { page, totalPages, controlsHtml }
function paginateList(key, total, pageSize) {
  pageSize = pageSize || PAGE_SIZE;
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  var page = getPage(key);
  if (page > totalPages) { page = totalPages; setPage(key, page); }
  if (page < 1) { page = 1; setPage(key, 1); }
  var controls = '';
  if (totalPages > 1) {
    controls = '<div class="flex items-center justify-center gap-2 mt-3 text-xs">' +
      '<button class="btn-sm ' + (page <= 1 ? 'btn-disabled' : 'btn-primary') + '" ' + (page <= 1 ? 'disabled style="opacity:0.4"' : 'onclick="changePage(\'' + key + '\',' + (page - 1) + ')"') + '>上一页</button>' +
      '<span class="text-secondary">第 <span class="text-gold font-bold">' + page + '</span> / ' + totalPages + ' 页</span>' +
      '<button class="btn-sm ' + (page >= totalPages ? 'btn-disabled' : 'btn-primary') + '" ' + (page >= totalPages ? 'disabled style="opacity:0.4"' : 'onclick="changePage(\'' + key + '\',' + (page + 1) + ')"') + '>下一页</button>' +
      '<span class="text-secondary ml-2">共 ' + total + ' 条</span>' +
      '</div>';
  }
  return { page: page, totalPages: totalPages, controlsHtml: controls, pageSize: pageSize };
}

// 页码切换函数
function changePage(key, page) {
  setPage(key, page);
  if (typeof render === 'function') render();
}

const SHOP_ITEMS = [
  { id: 'hatch_boost', name: '孵化加速器', desc: '孵化中点击加速，减少30分钟孵化时间', price: 250, icon: '⚡', action: 'item', quality: 'mid' },
  { id: 'hatch_stone', name: '孵化石', desc: '孵化宠物蛋必需的神秘石头', price: 800, icon: '🪨', action: 'item', quality: 'low' },
  { id: 'fusion_stone', name: '融合石', desc: '宠物融合必需材料', price: 500, icon: '💎', action: 'item', quality: 'mid' },
  { id: 'moon_dew', name: '月华露', desc: '提升宠物成长值0.02~0.05（每只限50次）', price: 1200, icon: '🌙', action: 'item', quality: 'high' },
  { id: 'exp_ticket', name: '经验副本门票', desc: '进入经验洞穴的凭证', price: 1000, icon: '🎫', action: 'item', quality: 'mid' },
  { id: 'exp_book', name: '经验书', desc: '使用后获得10000人物经验', price: 1, icon: '📕', action: 'item', currency: 'diamond', quality: 'mid' },
  { id: 'exp_book_mid', name: '中级经验书', desc: '使用后获得100000人物经验', price: 5, icon: '📗', action: 'item', currency: 'diamond', quality: 'mid' },
  { id: 'exp_book_high', name: '高级经验书', desc: '使用后获得1000000人物经验', price: 20, icon: '📘', action: 'item', currency: 'diamond', quality: 'mid' },
  { id: 'gold_ticket', name: '金币副本门票', desc: '进入黄金矿洞的凭证', price: 800, icon: '🎫', action: 'item', quality: 'mid' },
  { id: 'egg_ticket', name: '蛋之森林门票', desc: '进入蛋之森林的凭证', price: 1500, icon: '🎫', action: 'item', quality: 'mid' },
  // v2.2.0 需求4：技能秘境/宠物秘境已移至活动页面，移除对应门票；补充缺失的血统副本门票
  { id: 'forge_ticket', name: '强化石矿脉门票', desc: '进入强化石矿脉的凭证', price: 2000, icon: '🎫', action: 'item', quality: 'mid' },
  { id: 'map_ticket', name: '藏宝遗迹门票', desc: '进入藏宝遗迹的凭证', price: 2500, icon: '🎫', action: 'item', quality: 'mid' },
  { id: 'gem_ticket', name: '宝石秘洞门票', desc: '进入宝石秘洞的凭证', price: 2200, icon: '🎫', action: 'item', quality: 'mid' },
  { id: 'blood_dungeon_ticket', name: '血统副本门票', desc: '进入血统副本的凭证（35级开启血统功能）', price: 2000, icon: '🩸', action: 'item', quality: 'mid' },
  { id: 'skill_random', name: '随机技能书', desc: '随机获得一本技能书', price: 2500, icon: '📖', action: 'skill_random', quality: 'mid' },
  { id: 'forge_stone_low', name: '低级强化石', desc: '用于装备 +1~+6 强化', price: 400, icon: '🔩', action: 'item', quality: 'low' },
  { id: 'forge_stone_mid', name: '中级强化石', desc: '用于装备 +7~+9 强化', price: 1800, icon: '⚙️', action: 'item', quality: 'mid' },
  { id: 'forge_stone_high', name: '高级强化石', desc: '用于装备 +10~+12 强化', price: 7000, icon: '💠', action: 'item', quality: 'high' },
  { id: 'protection_stone', name: '保底石', desc: '强化时消耗可防止失败降级', price: 4500, icon: '🛡️', action: 'item', quality: 'high' },
  { id: 'yuanxiao_str', name: '力量元宵', desc: '提升宠物力量资质10~30', price: 2500, icon: '🍡', action: 'yuanxiao', aptKey: '力量资质', quality: 'mid' },
  { id: 'yuanxiao_con', name: '体质元宵', desc: '提升宠物质质资质10~30', price: 2500, icon: '🍡', action: 'yuanxiao', aptKey: '体质资质', quality: 'mid' },
  { id: 'yuanxiao_agi', name: '敏捷元宵', desc: '提升宠物敏捷资质10~30', price: 2500, icon: '🍡', action: 'yuanxiao', aptKey: '敏捷资质', quality: 'mid' },
  { id: 'yuanxiao_int', name: '智力元宵', desc: '提升宠物智力资质10~30', price: 2500, icon: '🍡', action: 'yuanxiao', aptKey: '智力资质', quality: 'mid' },
  { id: 'exp_card_2x', name: '双倍经验卡', desc: '30分钟内获得经验双倍', price: 5, icon: '🎴', action: 'buff', buffType: 'exp_mult', buffMult: 2, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'gold_card_2x', name: '双倍金币卡', desc: '30分钟内获得金币双倍', price: 5, icon: '💰', action: 'buff', buffType: 'gold_mult', buffMult: 2, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'exp_card_5x', name: '五倍经验卡', desc: '30分钟内获得经验五倍', price: 20, icon: '🎴', action: 'buff', buffType: 'exp_mult', buffMult: 5, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'gold_card_5x', name: '五倍金币卡', desc: '30分钟内获得金币五倍', price: 20, icon: '💰', action: 'buff', buffType: 'gold_mult', buffMult: 5, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'exp_card_10x', name: '十倍经验卡', desc: '30分钟内获得经验十倍', price: 50, icon: '🎴', action: 'buff', buffType: 'exp_mult', buffMult: 10, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'gold_card_10x', name: '十倍金币卡', desc: '30分钟内获得金币十倍', price: 50, icon: '💰', action: 'buff', buffType: 'gold_mult', buffMult: 10, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  // 宠物重置道具
  { id: 'guiyuan_pill', name: '归元丹', desc: '重置T1-T3宠物的成长、资质、技能', price: 5000, icon: '💊', action: 'item', quality: 'mid' },
  { id: 'guixu_pill', name: '归虚丹', desc: '重置T4-T5宠物的成长、资质、技能', price: 20, icon: '🌟', action: 'item', currency: 'diamond', quality: 'high' },
  // 金币箱（钻石购买）
  { id: 'gold_chest_s', name: '小金币箱', desc: '开启获得10万金币', price: 5, icon: '📦', action: 'gold_chest', goldAmount: 100000, currency: 'diamond', quality: 'mid' },
  { id: 'gold_chest_m', name: '中金币箱', desc: '开启获得100万金币', price: 40, icon: '📦', action: 'gold_chest', goldAmount: 1000000, currency: 'diamond', quality: 'mid' },
  { id: 'gold_chest_l', name: '大金币箱', desc: '开启获得1000万金币', price: 300, icon: '📦', action: 'gold_chest', goldAmount: 10000000, currency: 'diamond', quality: 'mid' },
  // 宝石（1级）钻石购买
  { id: 'gem_hp_1', name: '气血宝石+1', desc: '气血+80，可镶嵌于衣服/裤子/头盔', price: 8, icon: '❤️', action: 'gem', gemType: 'hp', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_mp_1', name: '魔法宝石+1', desc: '魔法值+30，可镶嵌于头盔/衣服/裤子', price: 8, icon: '💠', action: 'gem', gemType: 'mp', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_vit_1', name: '体质宝石+1', desc: '体质+4，可镶嵌于衣服/裤子', price: 8, icon: '🌿', action: 'gem', gemType: 'vit', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_str_1', name: '力量宝石+1', desc: '力量+4，可镶嵌于武器/手套', price: 8, icon: '🔥', action: 'gem', gemType: 'str', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_agi_1', name: '敏捷宝石+1', desc: '敏捷+4，可镶嵌于鞋子/手套', price: 8, icon: '⚡', action: 'gem', gemType: 'agi', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_int_1', name: '智慧宝石+1', desc: '智慧+4，可镶嵌于头盔/武器', price: 8, icon: '🔮', action: 'gem', gemType: 'int', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  // 新增道具
  { id: 'rare_egg', name: '稀有宠物蛋', desc: '随机获得T2-T4宠物蛋', price: 30, icon: '🥚', action: 'rare_egg', currency: 'diamond', quality: 'high' },
  { id: 'lucky_charm', name: '幸运符', desc: '30分钟内掉宝率提升50%', price: 15, icon: '🍀', action: 'buff', buffType: 'drop_mult', buffMult: 1.5, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'rename_card', name: '改名卡', desc: '重命名一只宠物的显示名称', price: 5, icon: '✏️', action: 'rename_card', currency: 'diamond', quality: 'mid' },
  { id: 'exp_book_bulk', name: '经验书包×5', desc: '5本经验书打包（节省20%）', price: 4, icon: '📚', action: 'exp_book_bulk', currency: 'diamond', quality: 'mid' },
  // 需求7：打孔系统道具
  { id: 'socket_nail', name: '打孔钉', desc: '为装备打孔，成功率随孔数递减（80%/50%/20%）', price: 2500, icon: '🔨', action: 'item', quality: 'mid' },
  { id: 'repair_glue', name: '修补胶', desc: '重置装备孔洞为0（已镶嵌宝石返还背包）', price: 15, icon: '🩹', action: 'item', currency: 'diamond', quality: 'high' },
  // 装备洗练道具
  { id: 'refine_stone', name: '洗练石', desc: '重新随机装备词条，追求完美属性（45级开启）', price: 3000, icon: '🔮', action: 'item', quality: 'high' },
  // 需求3：宠物进阶丸
  { id: 'advance_pill_low', name: '低级进阶丸', desc: '增加10-30点宠物进阶值', price: 1500, icon: '💊', action: 'item', quality: 'low' },
  { id: 'advance_pill_mid', name: '中级进阶丸', desc: '增加50-100点宠物进阶值', price: 12, icon: '💉', action: 'item', currency: 'diamond', quality: 'mid' },
  { id: 'advance_pill_high', name: '高级进阶丸', desc: '增加200-500点宠物进阶值', price: 50, icon: '🌟', action: 'item', currency: 'diamond', quality: 'high' },
  // v2.2.0 需求9：挖密藏系统道具
  { id: 'dig_map', name: '密藏图', desc: '使用后开启挖密藏九宫格玩法', price: 1500, icon: '🗺️', action: 'item', quality: 'mid' },
  { id: 'dig_shovel', name: '探宝铲', desc: '挖密藏中增加1次挖掘机会', price: 5, icon: '⛏️', action: 'item', currency: 'diamond', quality: 'mid' },
  { id: 'dig_lens', name: '透视镜', desc: '挖密藏中透视1个格子内容（不消耗挖掘次数）', price: 8, icon: '🔍', action: 'item', currency: 'diamond', quality: 'mid' },
  { id: 'dig_key', name: '密藏钥匙', desc: '挖密藏中开启锁住的宝箱格', price: 10, icon: '🗝️', action: 'item', currency: 'diamond', quality: 'high' },
];

const EQUIPMENT_SLOTS = [
  { id: 'weapon', name: '武器', icon: '⚔️' },
  { id: 'helmet', name: '头盔', icon: '🪖' },
  { id: 'armor', name: '衣服', icon: '👕' },
  { id: 'pants', name: '裤子', icon: '👖' },
  { id: 'gloves', name: '手套', icon: '🧤' },
  { id: 'shoes', name: '鞋子', icon: '👟' },
];

// ==================== 宝石系统 ====================
// 6种宝石，每种可镶嵌的装备栏不同，最高+15级
const GEM_TYPES = [
  { id: 'hp', name: '气血宝石', icon: '❤️', stat: '气血', perLevel: 80, color: '#ef4444', slots: ['armor','pants','helmet'] },
  { id: 'mp', name: '魔法宝石', icon: '💠', stat: '魔法值', perLevel: 30, color: '#3b82f6', slots: ['helmet','armor','pants'] },
  { id: 'vit', name: '体质宝石', icon: '🌿', stat: '体质', perLevel: 4, color: '#22c55e', slots: ['armor','pants'] },
  { id: 'str', name: '力量宝石', icon: '🔥', stat: '力量', perLevel: 4, color: '#f59e0b', slots: ['weapon','gloves'] },
  { id: 'agi', name: '敏捷宝石', icon: '⚡', stat: '敏捷', perLevel: 4, color: '#eab308', slots: ['shoes','gloves'] },
  { id: 'int', name: '智慧宝石', icon: '🔮', stat: '智慧', perLevel: 4, color: '#a855f7', slots: ['helmet','weapon'] },
];
const GEM_MAX_LEVEL = 15;
// 宝石升级：消耗同类型同等级宝石3颗 + 金币，合成1颗下一级
const GEM_UPGRADE_COST = 3; // 消耗3颗同级宝石
const GEM_UPGRADE_GOLD = 2000; // 基础金币消耗，按等级递增

function getGemType(id) { return GEM_TYPES.find(function(g) { return g.id === id; }); }
// 获取某槽位可镶嵌的宝石类型
function getGemsForSlot(slotId) {
  return GEM_TYPES.filter(function(g) { return g.slots.indexOf(slotId) >= 0; });
}
// 计算宝石属性加成（汇总所有已装备装备宝石孔中的宝石）
function getGemStatBonus() {
  var bonus = { 气血: 0, 魔法值: 0, 体质: 0, 力量: 0, 敏捷: 0, 智慧: 0 };
  if (!G.player || !G.player.equipment) return bonus;
  Object.keys(G.player.equipment).forEach(function(slotId) {
    var item = G.player.equipment[slotId];
    if (!item || !Array.isArray(item.gemSlots)) return;
    // 遍历该装备的所有宝石孔，累加已镶嵌宝石的属性
    item.gemSlots.forEach(function(slot) {
      var gem = slot && slot.gem;
      if (gem && gem.level > 0) {
        var def = getGemType(gem.type);
        if (def) bonus[def.stat] += def.perLevel * gem.level;
      }
    });
  });
  return bonus;
}
// 添加宝石到背包
function addGemToBag(type, level, count) {
  count = count || 1;
  var existing = G.gemBag.find(function(g) { return g.type === type && g.level === level; });
  if (existing) existing.count += count;
  else G.gemBag.push({ type: type, level: level, count: count });
}
// 查找背包中指定类型和等级的宝石数量
function countGemInBag(type, level) {
  var g = G.gemBag.find(function(g) { return g.type === type && g.level === level; });
  return g ? g.count : 0;
}
// 从背包消耗宝石
function removeGemFromBag(type, level, count) {
  count = count || 1;
  var g = G.gemBag.find(function(g) { return g.type === type && g.level === level; });
  if (!g || g.count < count) return false;
  g.count -= count;
  if (g.count <= 0) G.gemBag = G.gemBag.filter(function(x) { return !(x.type === type && x.level === level); });
  return true;
}
// 镶嵌宝石到装备的宝石孔（绑在装备上，而非槽位）
function equipGem(slotId, gemType, gemLevel) {
  var item = G.player && G.player.equipment && G.player.equipment[slotId];
  if (!item) { showToast('该槽位未装备任何物品', 'error'); return; }
  if (!Array.isArray(item.gemSlots) || item.gemSlots.length === 0) {
    showToast('该装备没有宝石孔，无法镶嵌', 'error'); return;
  }
  // 找到第一个空闲的、类型匹配的孔
  var targetIdx = -1;
  for (var i = 0; i < item.gemSlots.length; i++) {
    if (item.gemSlots[i].type === gemType && !item.gemSlots[i].gem) {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx < 0) {
    showToast('没有匹配该宝石类型的空闲孔', 'error'); return;
  }
  if (!removeGemFromBag(gemType, gemLevel, 1)) {
    showToast('宝石不存在', 'error'); return;
  }
  // 如果该孔已有宝石（理论不会，因上面只选空闲孔），保险起见放回背包
  var existing = item.gemSlots[targetIdx].gem;
  if (existing) addGemToBag(existing.type, existing.level, 1);
  item.gemSlots[targetIdx].gem = { type: gemType, level: gemLevel };
  saveGame();
  render();
  var def = getGemType(gemType);
  showToast('已镶嵌 ' + (def ? def.name : '宝石') + ' +' + gemLevel, 'success');
}
// 从指定孔卸下宝石
function unequipGemFromSlot(slotId, slotIndex) {
  var item = G.player && G.player.equipment && G.player.equipment[slotId];
  if (!item || !Array.isArray(item.gemSlots)) { showToast('该槽位没有宝石孔', 'error'); return; }
  var slot = item.gemSlots[slotIndex];
  if (!slot || !slot.gem) { showToast('该孔没有宝石', 'error'); return; }
  var gem = slot.gem;
  addGemToBag(gem.type, gem.level, 1);
  slot.gem = null;
  saveGame();
  render();
  var def = getGemType(gem.type);
  showToast('已卸下 ' + (def ? def.name : '宝石') + ' +' + gem.level, 'success');
}
// 兼容旧调用：卸下该槽位第一个有宝石的孔
function unequipGem(slotId) {
  var item = G.player && G.player.equipment && G.player.equipment[slotId];
  if (!item || !Array.isArray(item.gemSlots)) { showToast('该槽位没有宝石孔', 'error'); return; }
  for (var i = 0; i < item.gemSlots.length; i++) {
    if (item.gemSlots[i].gem) {
      unequipGemFromSlot(slotId, i);
      return;
    }
  }
  showToast('该槽位没有已镶嵌的宝石', 'error');
}
// 宝石升级：消耗3颗同级同类型宝石 + 金币，合成1颗下一级
function upgradeGem(gemType, gemLevel) {
  if (gemLevel >= GEM_MAX_LEVEL) { showToast('宝石已达到最高等级', 'error'); return; }
  if (countGemInBag(gemType, gemLevel) < GEM_UPGRADE_COST) {
    showToast('需要 ' + GEM_UPGRADE_COST + ' 颗同级宝石才能升级', 'error'); return;
  }
  var goldCost = GEM_UPGRADE_GOLD * gemLevel * gemLevel;
  if (G.player.gold < goldCost) {
    showToast('金币不足，需要 ' + goldCost.toLocaleString() + ' 金币', 'error'); return;
  }
  G.player.gold -= goldCost;
  removeGemFromBag(gemType, gemLevel, GEM_UPGRADE_COST);
  addGemToBag(gemType, gemLevel + 1, 1);
  saveGame();
  render();
  var def = getGemType(gemType);
  showToast('升级成功！获得 ' + (def ? def.name : '宝石') + ' +' + (gemLevel + 1), 'success');
}

// ==================== 宝石系统 UI ====================
// 渲染宝石背包 + 升级界面（角色页内嵌）
function renderGemSection() {
  if (!G.gemBag) G.gemBag = [];
  var bonus = getGemStatBonus();
  var bonusHtml = Object.keys(bonus).filter(function(k) { return bonus[k] > 0; }).map(function(k) {
    return '<span class="text-xs px-2 py-1 rounded bg-panel border border-game" style="color:#fbbf24">' + k + ' +' + bonus[k] + '</span>';
  }).join('');
  if (!bonusHtml) bonusHtml = '<span class="text-xs text-secondary">未镶嵌任何宝石</span>';
  // 已镶嵌宝石一览：遍历已装备装备的宝石孔
  var equippedHtml = EQUIPMENT_SLOTS.map(function(slot) {
    var item = G.player && G.player.equipment && G.player.equipment[slot.id];
    if (!item || !Array.isArray(item.gemSlots)) return '';
    var html = '';
    item.gemSlots.forEach(function(gslot, idx) {
      var def = getGemType(gslot.type);
      if (!def) return;
      var gem = gslot.gem;
      if (gem && gem.level > 0) {
        var statVal = def.perLevel * gem.level;
        html += '<div class="bg-panel border rounded-lg p-2 text-center" style="border-color:' + def.color + '">' +
          '<div class="text-lg">' + def.icon + '</div>' +
          '<p class="text-xs" style="color:' + def.color + '">' + def.name + ' +' + gem.level + '</p>' +
          '<p class="text-xs text-secondary">' + slot.name + '孔' + (idx + 1) + ' | ' + def.stat + '+' + statVal + '</p>' +
          '<button class="btn-danger btn-sm text-xs mt-1" onclick="unequipGemFromSlot(\'' + slot.id + '\',' + idx + ')">卸下</button>' +
          '</div>';
      } else {
        html += '<div class="bg-panel border border-dashed border-game rounded-lg p-2 text-center" style="border-color:' + def.color + '">' +
          '<div class="text-lg" style="opacity:0.6">' + def.icon + '</div>' +
          '<p class="text-xs text-secondary">空孔(' + def.name + ')</p>' +
          '<p class="text-xs text-secondary">' + slot.name + '孔' + (idx + 1) + '</p>' +
          '<button class="btn-sm text-xs mt-1" style="background:#7c3aed;color:#fff" onclick="showGemBagForSlot(\'' + slot.id + '\',' + idx + ')">镶嵌</button>' +
          '</div>';
      }
    });
    return html;
  }).join('');
  // 宝石背包（按类型+等级分组）
  var bagHtml = '';
  if (G.gemBag.length > 0) {
    var sortedBag = G.gemBag.slice().sort(function(a, b) {
      if (a.type !== b.type) return a.type < b.type ? -1 : 1;
      return a.level - b.level;
    });
    bagHtml = sortedBag.map(function(g) {
      var def = getGemType(g.type);
      if (!def) return '';
      var canUpgrade = g.level < GEM_MAX_LEVEL && g.count >= GEM_UPGRADE_COST;
      var upgradeCost = GEM_UPGRADE_GOLD * g.level * g.level;
      var upgradeBtn = canUpgrade ?
        '<button class="btn-sm text-xs mt-1" style="background:#7c3aed;color:#fff" onclick="upgradeGem(\'' + g.type + '\',' + g.level + ')">升级(' + GEM_UPGRADE_COST + '颗+' + upgradeCost.toLocaleString() + '金)</button>' :
        (g.level >= GEM_MAX_LEVEL ? '<span class="text-xs text-gold mt-1 inline-block">已满级</span>' :
        '<span class="text-xs text-secondary mt-1 inline-block">需' + GEM_UPGRADE_COST + '颗才能升级</span>');
      return '<div class="bg-panel border rounded-lg p-2 text-center" style="border-color:' + def.color + '">' +
        '<div class="text-lg">' + def.icon + '</div>' +
        '<p class="text-xs" style="color:' + def.color + '">' + def.name + ' +' + g.level + '</p>' +
        '<p class="text-xs text-secondary">' + def.stat + '+' + (def.perLevel * g.level) + '</p>' +
        '<p class="text-xs text-gold">x' + g.count + '</p>' +
        upgradeBtn +
        '</div>';
    }).join('');
  } else {
    bagHtml = '<p class="text-xs text-secondary col-span-full text-center py-4">宝石背包为空，请前往商城购买宝石</p>';
  }
  return '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
    '<h2 class="font-bold text-lg">💎 宝石系统</h2>' +
    '<button class="btn-gold btn-sm" onclick="navigateTo(\'shop\')">前往商城</button>' +
    '</div>' +
    '<div class="mb-3"><p class="text-xs text-secondary mb-1">已镶嵌宝石属性加成：</p>' +
    '<div class="flex flex-wrap gap-1">' + bonusHtml + '</div></div>' +
    (equippedHtml ? '<div class="mb-3"><p class="text-xs text-secondary mb-1">装备宝石孔（按装备展示）：</p>' +
    '<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">' + equippedHtml + '</div></div>' : '<p class="text-xs text-secondary mb-3">当前已装备物品没有宝石孔</p>') +
    '<div><p class="text-xs text-secondary mb-1">宝石背包（消耗' + GEM_UPGRADE_COST + '颗同级宝石+金币可升级，最高+' + GEM_MAX_LEVEL + '）：</p>' +
    '<div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">' + bagHtml + '</div></div>' +
    '</div>';
}

// 显示某装备栏的宝石选择弹窗（slotIndex 可选：指定孔则只显示该孔类型匹配的宝石）
function showGemBagForSlot(slotId, slotIndex) {
  closeGemModal();
  var item = G.player && G.player.equipment && G.player.equipment[slotId];
  var slotInfo = EQUIPMENT_SLOTS.find(function(s) { return s.id === slotId; });
  var slotName = slotInfo ? slotInfo.name : slotId;
  if (!item || !Array.isArray(item.gemSlots) || item.gemSlots.length === 0) {
    showToast('该装备没有宝石孔', 'error');
    return;
  }
  // 展示该装备所有宝石孔的状态
  var slotsOverviewHtml = item.gemSlots.map(function(gslot, idx) {
    var def = getGemType(gslot.type);
    if (!def) return '';
    var gem = gslot.gem;
    var isActive = (slotIndex === idx);
    var activeCls = isActive ? 'border-purple-500 bg-purple-900/30' : 'border-game';
    var content;
    if (gem && gem.level > 0) {
      content = '<p class="text-xs" style="color:' + def.color + '">' + def.name + ' +' + gem.level + '</p>' +
        '<p class="text-xs text-secondary">' + def.stat + '+' + (def.perLevel * gem.level) + '</p>' +
        '<button class="btn-danger btn-sm text-xs mt-1" onclick="unequipGemFromSlot(\'' + slotId + '\',' + idx + ');closeGemModal()">卸下</button>';
    } else {
      content = '<p class="text-xs text-secondary">空孔(' + def.name + ')</p>' +
        '<button class="btn-sm text-xs mt-1" style="background:#7c3aed;color:#fff" onclick="showGemBagForSlot(\'' + slotId + '\',' + idx + ')">' + (isActive ? '当前孔' : '选此孔') + '</button>';
    }
    return '<div class="bg-panel border rounded-lg p-2 text-center ' + activeCls + '" style="border-color:' + def.color + '">' +
      '<div class="text-lg">' + def.icon + '</div>' +
      '<p class="text-xs text-secondary">孔' + (idx + 1) + '</p>' +
      content +
      '</div>';
  }).join('');
  // 确定目标孔：传了 slotIndex 就用该孔；否则默认选第一个空闲孔
  var targetIdx = (typeof slotIndex === 'number') ? slotIndex : -1;
  if (targetIdx < 0) {
    for (var i = 0; i < item.gemSlots.length; i++) {
      if (!item.gemSlots[i].gem) { targetIdx = i; break; }
    }
  }
  // 如果所有孔都满，提示并允许选择卸下
  if (targetIdx < 0) {
    var fullOverlay = document.createElement('div');
    fullOverlay.className = 'modal-overlay';
    fullOverlay.id = 'gem-modal';
    fullOverlay.innerHTML =
      '<div class="modal-content scrollbar-thin" style="max-width:480px;max-height:80vh;">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<h3 class="font-bold text-gold">💎 ' + slotName + ' - 所有宝石孔已满</h3>' +
      '<button class="text-secondary hover:text-white text-xl" onclick="closeGemModal()">✕</button>' +
      '</div>' +
      '<div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">' + slotsOverviewHtml + '</div>' +
      '<button class="btn-gold btn-sm mt-3 w-full" onclick="closeGemModal()">关闭</button>' +
      '</div>';
    document.body.appendChild(fullOverlay);
    fullOverlay.addEventListener('click', function(e) { if (e.target === fullOverlay) closeGemModal(); });
    return;
  }
  var targetSlot = item.gemSlots[targetIdx];
  var targetDef = getGemType(targetSlot.type);
  if (!targetDef) { showToast('宝石孔类型异常', 'error'); return; }
  // 列出背包中类型匹配的宝石
  var gemListHtml = '';
  var availableGems = [];
  G.gemBag.forEach(function(g) {
    if (g.type === targetSlot.type && g.count > 0) {
      availableGems.push({ def: targetDef, level: g.level, count: g.count });
    }
  });
  if (availableGems.length === 0) {
    gemListHtml = '<p class="text-xs text-secondary text-center py-4">背包中没有匹配该孔类型(' + targetDef.name + ')的宝石<br>请前往商城购买</p>';
  } else {
    availableGems.sort(function(a, b) { return a.level - b.level; });
    gemListHtml = availableGems.map(function(g) {
      return '<div class="bg-panel border rounded-lg p-2 text-center" style="border-color:' + g.def.color + '">' +
        '<div class="text-lg">' + g.def.icon + '</div>' +
        '<p class="text-xs" style="color:' + g.def.color + '">' + g.def.name + ' +' + g.level + '</p>' +
        '<p class="text-xs text-secondary">' + g.def.stat + '+' + (g.def.perLevel * g.level) + '</p>' +
        '<p class="text-xs text-gold">x' + g.count + '</p>' +
        '<button class="btn-primary btn-sm text-xs mt-1" onclick="equipGem(\'' + slotId + '\',\'' + g.def.id + '\',' + g.level + ');closeGemModal()">镶嵌</button>' +
        '</div>';
    }).join('');
  }
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'gem-modal';
  overlay.innerHTML =
    '<div class="modal-content scrollbar-thin" style="max-width:480px;max-height:80vh;">' +
    '<div class="flex items-center justify-between mb-3">' +
    '<h3 class="font-bold text-gold">💎 ' + slotName + ' 孔' + (targetIdx + 1) + ' - 镶嵌宝石</h3>' +
    '<button class="text-secondary hover:text-white text-xl" onclick="closeGemModal()">✕</button>' +
    '</div>' +
    '<p class="text-xs text-secondary mb-2">该孔类型：' + targetDef.icon + ' ' + targetDef.name + '（' + targetDef.stat + '+' + targetDef.perLevel + '/级）</p>' +
    '<div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">' + slotsOverviewHtml + '</div>' +
    '<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">' + gemListHtml + '</div>' +
    '<button class="btn-gold btn-sm mt-3 w-full" onclick="closeGemModal()">关闭</button>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeGemModal(); });
}

function closeGemModal() {
  var m = document.getElementById('gem-modal');
  if (m) m.remove();
}


const EQUIP_RARITIES = ['white', 'green', 'blue', 'purple', 'orange'];
const EQUIP_RARITY_NAMES = ['白色', '绿色', '蓝色', '紫色', '橙色'];
const EQUIP_RARITY_COLORS = ['#c0c0c0', '#22c55e', '#3b82f6', '#a855f7', '#fb923c'];
const EQUIP_RARITY_AFFIX_COUNT = [0, 1, 2, 3, 4];

const EQUIP_BASE_NAMES = {
  weapon: ['短剑', '长剑', '战斧', '法杖', '匕首', '巨锤', '长弓', '魔杖'],
  helmet: ['布帽', '皮盔', '铁盔', '秘银盔', '龙鳞盔'],
  armor: ['布衣', '皮甲', '锁子甲', '板甲', '龙鳞甲'],
  pants: ['布裤', '皮裤', '锁链裤', '板甲裤', '龙鳞裤'],
  gloves: ['布手套', '皮手套', '铁手套', '秘银手套', '龙鳞手套'],
  shoes: ['布鞋', '皮靴', '铁靴', '秘银靴', '龙鳞靴'],
};

const AFFIX_TYPES = [
  { id: 'str_flat', name: '力量', format: v => `力量 +${v}` },
  { id: 'str_pct', name: '力量%', format: v => `力量 +${Math.floor(v*100)}%` },
  { id: 'con_flat', name: '体质', format: v => `体质 +${v}` },
  { id: 'con_pct', name: '体质%', format: v => `体质 +${Math.floor(v*100)}%` },
  { id: 'agi_flat', name: '敏捷', format: v => `敏捷 +${v}` },
  { id: 'agi_pct', name: '敏捷%', format: v => `敏捷 +${Math.floor(v*100)}%` },
  { id: 'int_flat', name: '智力', format: v => `智力 +${v}` },
  { id: 'int_pct', name: '智力%', format: v => `智力 +${Math.floor(v*100)}%` },
  { id: 'hp_flat', name: '气血', format: v => `气血 +${v}` },
  { id: 'hp_pct', name: '气血%', format: v => `气血 +${Math.floor(v*100)}%` },
  { id: 'atk_flat', name: '攻击力', format: v => `攻击力 +${v}` },
  { id: 'atk_pct', name: '攻击力%', format: v => `攻击力 +${Math.floor(v*100)}%` },
  { id: 'def_flat', name: '防御力', format: v => `防御力 +${v}` },
  { id: 'def_pct', name: '防御力%', format: v => `防御力 +${Math.floor(v*100)}%` },
  { id: 'crit_rate', name: '暴击率', format: v => `暴击率 +${Math.floor(v*100)}%` },
  { id: 'dodge_rate', name: '闪避率', format: v => `闪避率 +${Math.floor(v*100)}%` },
  { id: 'pet_dmg', name: '宠物伤害', format: v => `宠物伤害 +${Math.floor(v*100)}%`, special: true },
  { id: 'pet_def', name: '宠物防御力', format: v => `宠物防御力 +${Math.floor(v*100)}%`, special: true },
  { id: 'pet_hp', name: '宠物气血', format: v => `宠物气血 +${Math.floor(v*100)}%`, special: true },
];

// ==================== 装备特效系统 ====================
// 装备生成时低概率出现1个特效（仅蓝色及以上）
const EQUIP_SPECIALS = [
  { id: 'no_level_req', name: '无级别限制', desc: '装备无等级限制，任何等级可穿戴', color: '#f59e0b' },
  { id: 'simple', name: '简易', desc: '强化消耗减少50%', color: '#22c55e' },
  { id: 'gem_boost', name: '宝石强化', desc: '宝石效果+50%', color: '#a855f7' },
  { id: 'shennong', name: '神农', desc: '气血回复+20%', color: '#22c55e' },
  { id: 'treasure', name: '珍宝', desc: '售价+100%', color: '#f59e0b' },
  { id: 'sure_hit', name: '必中', desc: '攻击必定命中', color: '#ef4444' },
  { id: 'execute', name: '绝杀', desc: '5%概率秒杀小怪', color: '#ef4444' },
  { id: 'block', name: '格挡', desc: '10%概率格挡50%伤害', color: '#3b82f6' },
];
// 特效出现概率：蓝色3%, 紫色6%, 橙色12%
const EQUIP_SPECIAL_CHANCE = { white: 0, green: 0, blue: 0.03, purple: 0.06, orange: 0.12 };

function generateEquipment(rarity, level) {
  const slot = pickRandom(EQUIPMENT_SLOTS);
  const baseNames = EQUIP_BASE_NAMES[slot.id];
  const name = pickRandom(baseNames);
  const rarityIdx = EQUIP_RARITIES.indexOf(rarity);
  // 按装备类型重新设计基础属性（不再除武器外只有血防）
  var baseAtk = 0, baseDef = 0, baseHp = 0;
  var baseStr = 0, baseCon = 0, baseAgi = 0, baseInt = 0;
  switch (slot.id) {
    case 'weapon':
      // 武器：高攻击 + 少量血（平衡提升：让装备占玩家攻击力的30-40%）
      baseAtk = randomInt(level * 3, level * 5);
      baseHp = randomInt(level * 1, level * 2);
      break;
    case 'helmet':
      // 头盔：高血 + 智力（法系）
      baseHp = randomInt(level * 4, level * 6);
      baseInt = randomInt(level * 2, level * 3);
      break;
    case 'armor':
      // 衣服：高血 + 高防（坦克装）
      baseHp = randomInt(level * 4, level * 7);
      baseDef = randomInt(level * 3, level * 5);
      break;
    case 'pants':
      // 裤子：中血 + 中防 + 体质（生存装）
      baseHp = randomInt(level * 3, level * 5);
      baseDef = randomInt(level * 2, level * 4);
      baseCon = randomInt(level * 2, level * 3);
      break;
    case 'gloves':
      // 手套：少量攻击 + 敏捷（输出/暴击装）
      baseAtk = randomInt(level * 2, level * 3);
      baseAgi = randomInt(level * 2, level * 4);
      break;
    case 'shoes':
      // 鞋子：高敏捷 + 少量血（速度装）
      baseAgi = randomInt(level * 3, level * 5);
      baseHp = randomInt(level * 1, level * 2);
      break;
  }

  const affixCount = EQUIP_RARITY_AFFIX_COUNT[rarityIdx];
  const affixes = [];
  const usedAffixIds = new Set();
  for (let i = 0; i < affixCount; i++) {
    let affix;
    let attempts = 0;
    do {
      affix = pickRandom(AFFIX_TYPES);
      attempts++;
    } while (usedAffixIds.has(affix.id) && attempts < 30);
    usedAffixIds.add(affix.id);
    const val = affix.id.endsWith('_pct') ? randomFloat(0.03, 0.12) :
                affix.id === 'crit_rate' || affix.id === 'dodge_rate' ? randomFloat(0.02, 0.08) :
                affix.id === 'pet_dmg' || affix.id === 'pet_def' || affix.id === 'pet_hp' ? randomFloat(0.05, 0.15) :
                randomInt(level, level * 3);
    affixes.push({ ...affix, value: Math.round(val * 100) / 100 });
  }
  if (rarity === 'orange') {
    // 橙色装备额外带一个特殊词条（宠物伤害/宠物防御力/宠物气血）
    const specialAffixes = AFFIX_TYPES.filter(a => a.special && !usedAffixIds.has(a.id));
    if (specialAffixes.length > 0) {
      const specialAffix = pickRandom(specialAffixes);
      affixes.push({ ...specialAffix, value: randomFloat(0.05, 0.15) });
    }
  }

  // 装备特效：低概率随机出现1个（仅蓝色及以上）
  var equipSpecial = null;
  var specialChance = EQUIP_SPECIAL_CHANCE[rarity] || 0;
  if (specialChance > 0 && Math.random() < specialChance) {
    equipSpecial = pickRandom(EQUIP_SPECIALS);
  }

  // 宝石孔系统：随机0-3个宝石孔，每个孔有随机属性类型（仅蓝色及以上才可能有孔）
  var gemSlotCount = 0;
  if (rarityIdx >= 2) {
    var slotRoll = Math.random();
    if (slotRoll < 0.3) gemSlotCount = 0;
    else if (slotRoll < 0.6) gemSlotCount = 1;
    else if (slotRoll < 0.85) gemSlotCount = 2;
    else gemSlotCount = 3;
  }
  var gemSlots = [];
  var availableGemTypes = ['hp', 'mp', 'vit', 'str', 'agi', 'int'];
  for (var gi = 0; gi < gemSlotCount; gi++) {
    gemSlots.push({ type: pickRandom(availableGemTypes), gem: null });
  }

  return {
    id: 'equip_' + Date.now() + '_' + randomInt(1000, 9999),
    slot: slot.id, name, rarity, level,
    baseAtk, baseDef, baseHp, baseStr, baseCon, baseAgi, baseInt,
    affixes,
    special: equipSpecial ? equipSpecial.id : null,
    gemSlots: gemSlots,
  };
}

// 生成装备基础属性摘要文本（用于显示）
function getEquipBaseStatText(item, mult) {
  mult = mult || 1;
  var parts = [];
  if (item.baseAtk > 0) parts.push('攻+' + Math.floor(item.baseAtk * mult));
  if (item.baseDef > 0) parts.push('防+' + Math.floor(item.baseDef * mult));
  if (item.baseHp > 0) parts.push('血+' + Math.floor(item.baseHp * mult));
  if (item.baseStr > 0) parts.push('力+' + Math.floor(item.baseStr * mult));
  if (item.baseCon > 0) parts.push('体+' + Math.floor(item.baseCon * mult));
  if (item.baseAgi > 0) parts.push('敏+' + Math.floor(item.baseAgi * mult));
  if (item.baseInt > 0) parts.push('智+' + Math.floor(item.baseInt * mult));
  return parts.join(' ');
}

function getEquipStatBonus() {
  const eq = G.player.equipment;
  const forge = G.player.forgeLevels || {};
  let bonus = { 力量: 0, 体质: 0, 敏捷: 0, 智力: 0, 气血: 0, atk: 0, def: 0, critRate: 0, dodgeRate: 0, petDmg: 0, petDef: 0, petHp: 0, specials: [] };
  // 先收集百分比词条，最后统一应用（避免顺序依赖）
  var pctBonus = { 力量: 0, 体质: 0, 敏捷: 0, 智力: 0, 气血: 0, atk: 0, def: 0 };
  Object.entries(eq).forEach(([slotId, item]) => {
    if (!item) return;
    const forgeLv = forge[slotId] || 0;
    const forgeMult = 1 + forgeLv * 0.10;
    bonus.atk += Math.floor((item.baseAtk || 0) * forgeMult);
    bonus.def += Math.floor((item.baseDef || 0) * forgeMult);
    bonus.气血 += Math.floor((item.baseHp || 0) * forgeMult);
    // 基础属性（按装备类型）
    bonus.力量 += Math.floor((item.baseStr || 0) * forgeMult);
    bonus.体质 += Math.floor((item.baseCon || 0) * forgeMult);
    bonus.敏捷 += Math.floor((item.baseAgi || 0) * forgeMult);
    bonus.智力 += Math.floor((item.baseInt || 0) * forgeMult);
    (item.affixes || []).forEach(a => {
      const val = Math.floor(a.value * forgeMult * 100) / 100;
      if (a.id === 'str_flat') bonus.力量 += val;
      else if (a.id === 'str_pct') pctBonus.力量 += val;
      else if (a.id === 'con_flat') bonus.体质 += val;
      else if (a.id === 'con_pct') pctBonus.体质 += val;
      else if (a.id === 'agi_flat') bonus.敏捷 += val;
      else if (a.id === 'agi_pct') pctBonus.敏捷 += val;
      else if (a.id === 'int_flat') bonus.智力 += val;
      else if (a.id === 'int_pct') pctBonus.智力 += val;
      else if (a.id === 'hp_flat') bonus.气血 += val;
      else if (a.id === 'hp_pct') pctBonus.气血 += val;
      else if (a.id === 'atk_flat') bonus.atk += val;
      else if (a.id === 'atk_pct') pctBonus.atk += val;
      else if (a.id === 'def_flat') bonus.def += val;
      else if (a.id === 'def_pct') pctBonus.def += val;
      else if (a.id === 'crit_rate') bonus.critRate += val;
      else if (a.id === 'dodge_rate') bonus.dodgeRate += val;
      else if (a.id === 'pet_dmg') bonus.petDmg += val;
      else if (a.id === 'pet_def') bonus.petDef += val;
      else if (a.id === 'pet_hp') bonus.petHp += val;
    });
    // 收集装备特效
    if (item.special) bonus.specials.push(item.special);
  });
  // 统一应用百分比词条（基于已累积的flat总值）
  if (pctBonus.力量) bonus.力量 += Math.floor(bonus.力量 * pctBonus.力量);
  if (pctBonus.体质) bonus.体质 += Math.floor(bonus.体质 * pctBonus.体质);
  if (pctBonus.敏捷) bonus.敏捷 += Math.floor(bonus.敏捷 * pctBonus.敏捷);
  if (pctBonus.智力) bonus.智力 += Math.floor(bonus.智力 * pctBonus.智力);
  if (pctBonus.气血) bonus.气血 += Math.floor(bonus.气血 * pctBonus.气血);
  if (pctBonus.atk) bonus.atk += Math.floor(bonus.atk * pctBonus.atk);
  if (pctBonus.def) bonus.def += Math.floor(bonus.def * pctBonus.def);
  return bonus;
}

function getCharacterBonusForPet() {
  const eq = getEquipStatBonus();
  const lv = G.player.level;
// 需求7：全属性buff（flat值，all_stat buff的mult值作为固定加成）
const allStatBuff = getFlatBuff('all_stat');
// 人物修炼加成
const cultBonus = (typeof getCultivationBonus === 'function') ? getCultivationBonus() : { 力量: 0, 体质: 0, 敏捷: 0, 智力: 0 };
  const baseStats = {
    力量: 10 + lv * 3 + eq.力量 + allStatBuff + cultBonus.力量,
    体质: 10 + lv * 2 + eq.体质 + allStatBuff + cultBonus.体质,
    敏捷: 10 + lv * 2 + eq.敏捷 + allStatBuff + cultBonus.敏捷,
    智力: 10 + lv * 2 + eq.智力 + allStatBuff + cultBonus.智力,
    气血: 50 + lv * 10 + eq.气血 + allStatBuff,
  };
  return {
    // 四维属性按20%附加给宠物
    力量: Math.floor(baseStats.力量 * 0.20),
    体质: Math.floor(baseStats.体质 * 0.20),
    敏捷: Math.floor(baseStats.敏捷 * 0.20),
    智力: Math.floor(baseStats.智力 * 0.20),
    气血: Math.floor(baseStats.气血 * 0.20),
    // 攻击力/防御力/暴击率/闪避率按20%附加给宠物 + 天赋加成（pet_crit/pet_dodge等）
    atk: Math.floor(eq.atk * 0.20),
    def: Math.floor(eq.def * 0.20),
    critRate: eq.critRate * 0.20 + getTalentBonus('pet_crit'),
    dodgeRate: eq.dodgeRate * 0.20 + getTalentBonus('pet_dodge'),
    // 新增战斗天赋加成（来自战斗星轨）
    critDmg: getTalentBonus('pet_crit_dmg'),
    skillTrigger: getTalentBonus('pet_skill_trigger'),
    skillDmg: getTalentBonus('pet_skill_dmg'),
    vampPct: getTalentBonus('pet_lifesteal'),
    dmgReduce: getTalentBonus('pet_resolve'),
    // 宠物伤害/宠物防御力/宠物气血为额外值，全额加成（所有宠物生效）
    petDmg: eq.petDmg,
    petDef: eq.petDef,
    petHp: eq.petHp,
    // 装备特效列表
    specials: eq.specials || [],
  };
}

// 技能书商店价格（需求26：主动技能改为钻石定价；被动/光环同样钻石定价）
// 需求4：确保商城覆盖所有可学习技能书（主动/被动/光环），融合限定技能除外
const FUSION_EXCLUSIVE_SKILL_IDS = ['chaos_strike', 'doom_inferno', 'time_rift'];
const SKILL_BOOK_SHOP = {
  // 需求8：主动技能按品质正序展示（普通→优秀→稀有→史诗→传说），同品质按名称排序
  // 排除融合限定技能（仅融合宠物专属，不可通过商店获取）
  active: ACTIVE_SKILLS.filter(s => FUSION_EXCLUSIVE_SKILL_IDS.indexOf(s.id) < 0).sort(function(a, b) {
    var qa = SKILL_QUALITY_ORDER[a.quality] || 0;
    var qb = SKILL_QUALITY_ORDER[b.quality] || 0;
    if (qa !== qb) return qa - qb;
    return (a.name || '').localeCompare(b.name || '', 'zh');
  }).map(s => ({ ...s, currency: 'diamond', price: (typeof SKILL_QUALITY_PRICES !== 'undefined' && SKILL_QUALITY_PRICES[s.quality]) || 5 })),
  passive_t1: PASSIVE_SKILLS.filter(s => s.tier === 1).map(s => ({ ...s, currency: 'diamond', price: 15 })),
  passive_t2: PASSIVE_SKILLS.filter(s => s.tier === 2).map(s => ({ ...s, currency: 'diamond', price: 50 })),
  passive_t3: PASSIVE_SKILLS.filter(s => s.tier === 3).map(s => ({ ...s, currency: 'diamond', price: 200 })),
  aura_t1: AURA_SKILLS.filter(s => s.tier === 1).map(s => ({ ...s, currency: 'diamond', price: 40 })),
  aura_t2: AURA_SKILLS.filter(s => s.tier === 2).map(s => ({ ...s, currency: 'diamond', price: 80 })),
  aura_t3: AURA_SKILLS.filter(s => s.tier === 3).map(s => ({ ...s, currency: 'diamond', price: 150 })),
};

function showTreasureRewardModal(rewards) {
  if (!rewards || rewards.length === 0) { showToast('🗺️ 藏宝图挑战成功！', 'success'); return; }
  var html = '<div id="treasureRewardOverlay" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onclick="closeTreasureRewardModal()">' +
    '<div class="bg-card border-2 border-yellow-600 rounded-2xl p-6 max-w-md w-full animate-fadeIn" onclick="event.stopPropagation()">' +
    '<div class="text-center mb-4">' +
    '<div class="text-5xl mb-2">🎉</div>' +
    '<h2 class="font-fantasy text-gold text-xl">藏宝图奖励</h2>' +
    '<p class="text-xs text-secondary">挑战成功！获得以下奖励</p>' +
    '</div>' +
    '<div class="grid grid-cols-2 gap-2 mb-4">' +
    rewards.map(function(r) {
      var subHtml = r.sub ? '<p class="text-xs" style="color:' + r.color + '">' + r.sub + '</p>' : '';
      return '<div class="bg-panel border border-game rounded-xl p-3 text-center">' +
        '<div class="text-2xl mb-1">' + r.icon + '</div>' +
        '<p class="text-xs font-bold" style="color:' + r.color + '">' + r.name + '</p>' +
        '<p class="text-lg font-bold" style="color:' + r.color + '">x' + r.amount + '</p>' +
        subHtml +
        '</div>';
    }).join('') +
    '</div>' +
    '<button class="btn-gold w-full" onclick="closeTreasureRewardModal()">确定</button>' +
    '</div></div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
}

function closeTreasureRewardModal() {
  var overlay = document.getElementById('treasureRewardOverlay');
  if (overlay) overlay.remove();
}

// 抽奖结果展示弹窗（高价值物品特效）
// tierIdx: 0-5 对应 common~mythic；type: 'pet' | 'skill'
function showDrawResultModal(opts) {
  var icon = opts.icon || '🎁';
  var name = opts.name || '未知';
  var sub = opts.sub || '';
  var tierIdx = opts.tierIdx || 0;
  var type = opts.type || 'pet';
  var color = RARITY_COLORS[tierIdx] || '#9ca3af';
  var rarityName = RARITY_NAMES[tierIdx] || '普通';
  var isHighValue = tierIdx >= 3; // 史诗及以上为高价值
  var isTopValue = tierIdx >= 4;  // 传说及以上为顶级
  var isMythic = tierIdx >= 5;    // 神话

  // 闪光层（顶级才有）- opacity:0 确保动画结束后不残留
  var flashHtml = isTopValue ? '<div style="position:absolute;inset:0;background:' + color + ';opacity:0;animation:screenFlash 0.8s ease-out forwards;pointer-events:none;z-index:60;"></div>' : '';

  // 光线层（传说+）
  var raysHtml = '';
  if (isTopValue) {
    raysHtml = '<div style="position:absolute;inset:-50%;background:conic-gradient(from 0deg, transparent 0deg, ' + color + ' 20deg, transparent 40deg, transparent 60deg, ' + color + ' 80deg, transparent 100deg, transparent 120deg, ' + color + ' 140deg, transparent 160deg, transparent 180deg, ' + color + ' 200deg, transparent 220deg, transparent 240deg, ' + color + ' 260deg, transparent 280deg, transparent 300deg, ' + color + ' 320deg, transparent 340deg);animation:lightRays 2s linear infinite;opacity:0.5;border-radius:50%;"></div>';
  }

  // 火花粒子（史诗+）
  var sparklesHtml = '';
  if (isHighValue) {
    var sparks = [];
    var sparkCount = isMythic ? 12 : isTopValue ? 8 : 5;
    for (var i = 0; i < sparkCount; i++) {
      var left = 15 + Math.random() * 70;
      var delay = (Math.random() * 1.2).toFixed(2);
      sparks.push('<div style="position:absolute;left:' + left + '%;bottom:30%;font-size:18px;animation:sparkleFloat 1.8s ease-out ' + delay + 's infinite;">✨</div>');
    }
    sparklesHtml = sparks.join('');
  }

  // 标题文字（神话用彩虹动画）
  var titleStyle = isMythic ? 'animation:rainbowText 1.5s linear infinite;' : 'color:' + color + ';';
  var titleText = isMythic ? '🌟 神话降临 🌟' : isTopValue ? '✨ 传说现世 ✨' : isHighValue ? '💎 史诗获得 💎' : '获得奖励';

  // 卡片光晕样式
  var cardStyle = isHighValue ? 'animation:drawGlow 1.5s ease-in-out infinite;--draw-color:' + color + ';' : '';

  var html = '<div id="drawResultOverlay" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="closeDrawResultModal()">' +
    flashHtml +
    '<div class="relative" onclick="event.stopPropagation()">' +
      raysHtml +
      '<div class="bg-card border-2 rounded-2xl p-6 max-w-xs w-full relative overflow-hidden" style="border-color:' + color + ';' + cardStyle + '">' +
        sparklesHtml +
        '<div class="text-center mb-3">' +
          '<h2 class="font-fantasy text-xl font-bold" style="' + titleStyle + '">' + titleText + '</h2>' +
        '</div>' +
        '<div class="flex justify-center mb-3">' +
          '<div class="text-7xl" style="animation:drawReveal 0.8s cubic-bezier(0.34,1.56,0.64,1);' + (isHighValue ? 'filter:drop-shadow(0 0 12px ' + color + ');' : '') + '">' + icon + '</div>' +
        '</div>' +
        '<div class="text-center mb-1">' +
          '<p class="text-lg font-bold" style="color:' + color + ';">' + name + '</p>' +
          (sub ? '<p class="text-xs text-secondary mt-1">' + sub + '</p>' : '') +
        '</div>' +
        '<div class="text-center mb-4">' +
          '<span class="inline-block px-3 py-1 rounded-full text-xs font-bold" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '66;">' + (type === 'pet' ? 'T' + (tierIdx + 1) + ' ' : '') + rarityName + '</span>' +
        '</div>' +
        '<button class="btn-gold w-full" onclick="closeDrawResultModal()">确定</button>' +
      '</div>' +
    '</div>' +
    '</div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);

  // 神话级播放震动（如果支持）
  if (isMythic && navigator.vibrate) { try { navigator.vibrate([100, 50, 100, 50, 200]); } catch(e){} }
  // 传说及以上特效自动消失：普通3秒，史诗4秒，传说5秒，神话6秒
  var autoCloseMs = isMythic ? 6000 : isTopValue ? 5000 : isHighValue ? 4000 : 3000;
  clearTimeout(window._drawResultTimer);
  window._drawResultTimer = setTimeout(function() { closeDrawResultModal(); }, autoCloseMs);
}
function closeDrawResultModal() {
  clearTimeout(window._drawResultTimer);
  var overlay = document.getElementById('drawResultOverlay');
  if (overlay) overlay.remove();
}

function decomposeEquipById(equipId) {
  var idx = G.equipmentBag.findIndex(function(e) { return e.id === equipId; });
  if (idx < 0) return;
  var item = G.equipmentBag[idx];
  // 需求6：上锁的装备不能分解
  if (item.locked) { showToast('🔒 该装备已上锁，无法分解', 'error'); return; }
  var rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
  var stoneId, stoneName, count;
  // 调整：减少锻造石产出，避免泛滥
  switch (item.rarity) {
    case 'white': stoneId = 'forge_stone_low'; stoneName = '低级强化石'; count = 1; break;
    case 'green': stoneId = 'forge_stone_low'; stoneName = '低级强化石'; count = 1; break;
    case 'blue': stoneId = 'forge_stone_mid'; stoneName = '中级强化石'; count = 1; break;
    case 'purple': stoneId = 'forge_stone_mid'; stoneName = '中级强化石'; count = 2; break;
    case 'orange': stoneId = 'forge_stone_high'; stoneName = '高级强化石'; count = 1; break;
    default: stoneId = 'forge_stone_low'; stoneName = '低级强化石'; count = 1;
  }
  G.equipmentBag.splice(idx, 1);
  var existing = G.inventory.find(function(i) { return i.id === stoneId; });
  if (existing) existing.count += count;
  else G.inventory.push({ id: stoneId, count: count });
  saveGame();
  render();
  showToast('分解获得 ' + stoneName + ' x' + count, 'success');
}

// 需求6：切换装备上锁状态
function toggleEquipLock(equipId) {
  var found = (typeof findEquipmentById === 'function') ? findEquipmentById(equipId) : null;
  if (!found || !found.item) {
    // 在背包中查找
    var idx = G.equipmentBag.findIndex(function(e) { return e.id === equipId; });
    if (idx < 0) { showToast('装备不存在', 'error'); return; }
    var item = G.equipmentBag[idx];
    item.locked = !item.locked;
    showToast(item.locked ? '🔒 已上锁' : '🔓 已解锁', 'info');
  } else {
    found.item.locked = !found.item.locked;
    showToast(found.item.locked ? '🔒 已上锁' : '🔓 已解锁', 'info');
  }
  saveGame();
  render();
}

var batchMode = false;
var batchSelected = {};
var batchFilter = 'all';

function toggleBatchMode() {
  batchMode = !batchMode;
  batchSelected = {};
  batchFilter = 'all';
  render();
}

function toggleBatchSelect(equipId) {
  if (batchSelected[equipId]) delete batchSelected[equipId];
  else batchSelected[equipId] = true;
  render();
}

function batchSelectByRarity(rarity) {
  batchFilter = rarity;
  batchSelected = {};
  G.equipmentBag.forEach(function(item) {
    if (rarity === 'all' || item.rarity === rarity) batchSelected[item.id] = true;
  });
  render();
}

function batchSellSelected() {
  var ids = Object.keys(batchSelected);
  if (ids.length === 0) { showToast('请先选择装备', 'error'); return; }
  var totalGold = 0;
  ids.forEach(function(id) {
    var idx = G.equipmentBag.findIndex(function(e) { return e.id === id; });
    if (idx >= 0) {
      var item = G.equipmentBag[idx];
      var rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
      var price = [10, 30, 80, 200, 500][rarityIdx] || 10;
      totalGold += price;
      G.equipmentBag.splice(idx, 1);
    }
  });
  addGold(totalGold);
  batchMode = false;
  batchSelected = {};
  saveGame();
  render();
  showToast('批量出售 ' + ids.length + ' 件装备，获得 🪙' + totalGold.toLocaleString(), 'success');
}

function batchDecomposeSelected() {
  var ids = Object.keys(batchSelected);
  if (ids.length === 0) { showToast('请先选择装备', 'error'); return; }
  var stones = { forge_stone_low: 0, forge_stone_mid: 0, forge_stone_high: 0 };
  var skippedLocked = 0;
  ids.forEach(function(id) {
    var idx = G.equipmentBag.findIndex(function(e) { return e.id === id; });
    if (idx >= 0) {
      var item = G.equipmentBag[idx];
      // 需求6：跳过已上锁的装备
      if (item.locked) { skippedLocked++; return; }
      // 调整：与单件分解保持一致，减少锻造石产出
      switch (item.rarity) {
        case 'white': stones.forge_stone_low += 1; break;
        case 'green': stones.forge_stone_low += 1; break;
        case 'blue': stones.forge_stone_mid += 1; break;
        case 'purple': stones.forge_stone_mid += 2; break;
        case 'orange': stones.forge_stone_high += 1; break;
      }
      G.equipmentBag.splice(idx, 1);
    }
  });
  Object.keys(stones).forEach(function(sid) {
    if (stones[sid] > 0) {
      var existing = G.inventory.find(function(i) { return i.id === sid; });
      if (existing) existing.count += stones[sid];
      else G.inventory.push({ id: sid, count: stones[sid] });
    }
  });
  batchMode = false;
  batchSelected = {};
  saveGame();
  render();
  var msgParts = [];
  if (stones.forge_stone_low > 0) msgParts.push('低级强化石 x' + stones.forge_stone_low);
  if (stones.forge_stone_mid > 0) msgParts.push('中级强化石 x' + stones.forge_stone_mid);
  if (stones.forge_stone_high > 0) msgParts.push('高级强化石 x' + stones.forge_stone_high);
  var msg = '批量分解装备，获得 ' + msgParts.join('、');
  if (skippedLocked > 0) msg += '（跳过 ' + skippedLocked + ' 件已上锁）';
  showToast(msg, 'success');
}

function getEquipCompareHtml(bagItem) {
  var currentEquip = G.player.equipment[bagItem.slot];
  if (!currentEquip) return '';
  // 强化等级归零后比较：只比较基础属性和词条，不含强化加成
  function diffStr(cur, nw) {
    var d = nw - cur;
    if (d > 0) return '<span class="text-green-400">+' + d + '</span>';
    if (d < 0) return '<span class="text-red-400">' + d + '</span>';
    return '<span class="text-secondary">0</span>';
  }
  // 收集两件装备的所有词条id
  var curAffixes = currentEquip.affixes || [];
  var newAffixes = bagItem.affixes || [];
  var allAffixIds = [];
  curAffixes.forEach(function(a) { if (allAffixIds.indexOf(a.id) < 0) allAffixIds.push(a.id); });
  newAffixes.forEach(function(a) { if (allAffixIds.indexOf(a.id) < 0) allAffixIds.push(a.id); });
  // 构建词条对比HTML
  var affixCompareHtml = '';
  if (allAffixIds.length > 0) {
    affixCompareHtml = '<p class="text-secondary mt-1 mb-1">词条对比（不含强化）：</p>';
    allAffixIds.forEach(function(aid) {
      var curA = curAffixes.find(function(a) { return a.id === aid; });
      var newA = newAffixes.find(function(a) { return a.id === aid; });
      var affixDef = curA || newA;
      var curVal = curA ? curA.value : 0;
      var newVal = newA ? newA.value : 0;
      var name = affixDef.name || aid;
      var d = newVal - curVal;
      var dStr;
      if (!curA) dStr = '<span class="text-green-400">新增</span>';
      else if (!newA) dStr = '<span class="text-red-400">失去</span>';
      else if (d > 0) dStr = '<span class="text-green-400">+' + (Math.round(d * 100) / 100) + '</span>';
      else if (d < 0) dStr = '<span class="text-red-400">' + (Math.round(d * 100) / 100) + '</span>';
      else dStr = '<span class="text-secondary">=</span>';
      var curStr = curA ? (Math.round(curVal * 100) / 100) : '—';
      var newStr = newA ? (Math.round(newVal * 100) / 100) : '—';
      affixCompareHtml += '<p>' + name + ' ' + curStr + ' → ' + newStr + ' ' + dStr + '</p>';
    });
  }
  // 基础属性对比（只显示当前装备或新装备中存在的属性）
  var baseStatsHtml = '';
  var statFields = [
    { key: 'baseAtk', label: '攻' },
    { key: 'baseDef', label: '防' },
    { key: 'baseHp', label: '血' },
    { key: 'baseStr', label: '力' },
    { key: 'baseCon', label: '体' },
    { key: 'baseAgi', label: '敏' },
    { key: 'baseInt', label: '智' },
  ];
  statFields.forEach(function(f) {
    var curV = currentEquip[f.key] || 0;
    var newV = bagItem[f.key] || 0;
    if (curV > 0 || newV > 0) {
      baseStatsHtml += '<p>' + f.label + ' ' + curV + ' → ' + newV + ' ' + diffStr(curV, newV) + '</p>';
    }
  });
  return '<div class="mt-2 pt-2 border-t border-game text-xs">' +
    '<p class="text-secondary mb-1">对比当前装备（强化归零）：</p>' +
    baseStatsHtml +
    affixCompareHtml +
    '</div>';
}

function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2500);
}

function showOfflineRewardsModal(rewards) {
  if (!rewards) return;
  var hours = Math.floor(rewards.minutes / 60);
  var mins = rewards.minutes % 60;
  var timeStr = hours > 0 ? hours + '小时' + mins + '分钟' : mins + '分钟';
  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = '<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #f59e0b;border-radius:12px;padding:2rem;max-width:380px;width:90%;text-align:center;box-shadow:0 0 30px rgba(245,158,11,0.3);">' +
    '<div style="font-size:2.5rem;margin-bottom:0.5rem;">🌙</div>' +
    '<h2 style="color:#f59e0b;font-size:1.25rem;font-weight:bold;margin-bottom:0.5rem;">离线挂机收益</h2>' +
    '<p style="color:#94a3b8;font-size:0.875rem;margin-bottom:1rem;">您离开了 ' + timeStr + '，宠物们继续为您战斗！</p>' +
    '<div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:1rem;margin-bottom:1rem;text-align:left;">' +
    (rewards.exp > 0 ? '<p style="color:#60a5fa;margin:0.25rem 0;">⭐ 经验 +' + rewards.exp.toLocaleString() + '</p>' : '') +
    (rewards.gold > 0 ? '<p style="color:#fbbf24;margin:0.25rem 0;">🪙 金币 +' + rewards.gold.toLocaleString() + '</p>' : '') +
    (rewards.petExp > 0 ? '<p style="color:#34d399;margin:0.25rem 0;">🐉 宠物经验 +' + rewards.petExp.toLocaleString() + '</p>' : '') +
    (rewards.eggs > 0 ? '<p style="color:#a78bfa;margin:0.25rem 0;">🥚 宠物蛋 ×' + rewards.eggs + '</p>' : '') +
    '</div>' +
    '<button onclick="this.parentElement.parentElement.remove();" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;padding:0.625rem 2rem;border-radius:0.5rem;cursor:pointer;font-size:0.95rem;font-weight:bold;width:100%;">领取奖励</button>' +
    '</div>';
  document.body.appendChild(modal);
}

function render() {
  try {
    const app = document.getElementById('app');
    switch (currentScreen) {
      case 'main': app.innerHTML = renderMainScreen(); break;
      case 'pets': app.innerHTML = renderPetScreen(); break;
      case 'eggs': app.innerHTML = renderEggScreen(); break;
      case 'inventory': app.innerHTML = renderInventoryScreen(); break;
      case 'dungeon': app.innerHTML = renderDungeonScreen(); break;
      case 'market': app.innerHTML = renderMarketScreen(); break;
      case 'daily': app.innerHTML = renderDailyScreen(); break;
      case 'tower': window._activitySheet = 'tower'; app.innerHTML = renderActivityScreen(); break;
      case 'rebirth': app.innerHTML = renderRebirthScreen(); break;
      case 'fusion': app.innerHTML = renderFusionScreen(); break;
      case 'petequip': app.innerHTML = renderPetEquipScreen(); break;
      case 'formation': app.innerHTML = renderFormationScreen(); break;
      case 'shop': app.innerHTML = renderShopScreen(); break;
      case 'character': app.innerHTML = renderCharacterScreen(); break;
      case 'arena': window._activitySheet = 'arena'; app.innerHTML = renderActivityScreen(); break;
      case 'arena_battle': app.innerHTML = renderArenaBattleScreen(); break;
      case 'treasure': app.innerHTML = renderTreasureScreen(); break;
      case 'dig': app.innerHTML = renderDigScreen(); break;
      case 'activity': app.innerHTML = renderActivityScreen(); break;
      case 'forge': app.innerHTML = renderForgeScreen(); break;
      case 'pool': app.innerHTML = renderPoolScreen(); break;
      case 'achievement': app.innerHTML = renderAchievementScreen(); break;
      case 'dex': app.innerHTML = renderDexScreen(); break;
      case 'talent': app.innerHTML = renderTalentScreen(); break;
      case 'lottery': app.innerHTML = renderLotteryScreen(); break;
      case 'training': app.innerHTML = renderTrainingScreen(); break;
    }
    if (viewingPetId) app.innerHTML += renderPetDetailModal();
    if (window._bloodOrbImplantPetId) app.innerHTML += renderBloodOrbImplantModal();
    if (window._activityBattle) app.innerHTML += renderActivityBattleModal();
bindEvents();
renderTimeBar();
renderBuffBar();
  } catch(e) {
    console.error('Render error:', e);
    const errMsg = (e && e.message) ? e.message : String(e || '未知错误');
    document.getElementById('app').innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#e2e8f0;font-family:-apple-system,sans-serif;"><div style="text-align:center;padding:2rem;"><p style="color:#ef4444;font-size:1.125rem;margin-bottom:0.5rem;">页面渲染出错</p><p style="color:#94a3b8;font-size:0.875rem;margin-bottom:1rem;">' + errMsg + '</p><button onclick="currentScreen=\'main\';render()" style="background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:1px solid #8b5cf6;padding:0.5rem 1.5rem;border-radius:0.5rem;cursor:pointer;font-size:0.875rem;">返回主页</button></div></div>';
  }
}

// ===== Buff显示栏（右上角） =====
const BUFF_DISPLAY = {
  exp_mult: { icon: '🎴', name: '经验' },
  gold_mult: { icon: '💰', name: '金币' },
  drop_mult: { icon: '🍀', name: '掉宝' },
  // 需求7：新手礼包新增buff类型
  all_stat: { icon: '💪', name: '全属性' },
  hatch_mult: { icon: '⚡', name: '孵化速度' },
  egg_drop_mult: { icon: '🥚', name: '蛋掉落' },
};

// ===== 兑换码系统 =====
const REDEEM_CODES = {
  '666': { reward: { diamond: 10000 }, msg: '兑换成功！获得 💎10000 钻石' },
  '888': { reward: { gold: 100000 }, msg: '兑换成功！获得 🪙100000 金币' },
};
function openRedeemModal() {
  var html = '<div id="redeemOverlay" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="closeRedeemModal()">' +
    '<div class="bg-card border-2 border-gold rounded-2xl p-6 max-w-sm w-full" style="border-color:var(--gold);" onclick="event.stopPropagation()">' +
      '<h2 class="font-fantasy text-gold text-xl text-center mb-2">🎁 兑换码</h2>' +
      '<p class="text-xs text-secondary text-center mb-4">输入兑换码领取奖励（可重复使用）</p>' +
      '<input id="redeemInput" class="redeem-input mb-3" placeholder="请输入兑换码" maxlength="20" />' +
      '<p id="redeemMsg" class="text-xs text-center mb-3" style="min-height:18px;"></p>' +
      '<div class="flex gap-2">' +
        '<button class="btn-primary flex-1" onclick="closeRedeemModal()">取消</button>' +
        '<button class="btn-gold flex-1" onclick="submitRedeemCode()">兑换</button>' +
      '</div>' +
    '</div>' +
    '</div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
  setTimeout(function(){ var inp = document.getElementById('redeemInput'); if (inp) inp.focus(); }, 50);
}
function closeRedeemModal() {
  var ov = document.getElementById('redeemOverlay');
  if (ov) ov.remove();
}
function submitRedeemCode() {
  var inp = document.getElementById('redeemInput');
  if (!inp) return;
  var code = (inp.value || '').trim();
  var msgEl = document.getElementById('redeemMsg');
  if (!code) { if (msgEl) msgEl.innerHTML = '<span style="color:#ef4444;">请输入兑换码</span>'; return; }
  var def = REDEEM_CODES[code];
  if (!def) { if (msgEl) msgEl.innerHTML = '<span style="color:#ef4444;">兑换码无效</span>'; return; }
  // 发放奖励
  if (def.reward.diamond) addDiamond(def.reward.diamond);
  if (def.reward.gold) G.player.gold += def.reward.gold;
  if (def.reward.hatchStones) G.hatchStones = (G.hatchStones || 0) + def.reward.hatchStones;
  if (!G.redeemCodesUsed) G.redeemCodesUsed = [];
  G.redeemCodesUsed.push({ code: code, time: Date.now() });
  saveGame();
  render();
  showToast(def.msg, 'success');
  closeRedeemModal();
}
// 需求15：渲染游戏内时间栏
function renderTimeBar() {
var bar = document.getElementById('timeBar');
if (!bar) return;
if (typeof getCurrentTimePhase !== 'function') return;
var phase = getCurrentTimePhase();
var remaining = (typeof getTimePhaseRemainingText === 'function') ? getTimePhaseRemainingText() : '';
var nextPhase = (typeof getNextTimePhase === 'function') ? getNextTimePhase() : null;
var effects = phase.effects || {};
var effectParts = [];
if (effects.expMult && effects.expMult !== 1) effectParts.push('经验' + (effects.expMult > 1 ? '+' : '') + Math.round((effects.expMult - 1) * 100) + '%');
if (effects.goldMult && effects.goldMult !== 1) effectParts.push('金币' + (effects.goldMult > 1 ? '+' : '') + Math.round((effects.goldMult - 1) * 100) + '%');
if (effects.eggDropMult && effects.eggDropMult !== 1) effectParts.push('掉蛋' + (effects.eggDropMult > 1 ? '+' : '') + Math.round((effects.eggDropMult - 1) * 100) + '%');
if (effects.itemDropMult && effects.itemDropMult !== 1) effectParts.push('道具' + (effects.itemDropMult > 1 ? '+' : '') + Math.round((effects.itemDropMult - 1) * 100) + '%');
if (effects.monsterAtkMult && effects.monsterAtkMult !== 1) effectParts.push('怪物攻击+' + Math.round((effects.monsterAtkMult - 1) * 100) + '%');
var effectText = effectParts.length > 0 ? effectParts.join('，') : '无加成';
var html = '<div class="time-bar-chip" style="background:linear-gradient(135deg,' + phase.color + '22,' + phase.color + '11);border:1px solid ' + phase.color + '66;color:' + phase.color + ';" title="' + phase.desc + ' | 效果：' + effectText + '">' +
'<span style="font-size:1rem;">' + phase.icon + '</span>' +
'<span style="font-weight:bold;font-size:0.75rem;">' + phase.name + '</span>' +
'<span style="font-size:0.7rem;opacity:0.8;">' + remaining + '</span>' +
(nextPhase ? '<span style="font-size:0.65rem;opacity:0.6;">→' + nextPhase.icon + '</span>' : '') +
'</div>';
bar.innerHTML = html;
}
function renderBuffBar() {
  var bar = document.getElementById('buffBar');
  if (!bar) return;
  var buffs = getActiveBuffs();
  if (buffs.length === 0) { bar.innerHTML = ''; return; }
  var html = buffs.map(function(b) {
    var info = BUFF_DISPLAY[b.type] || { icon: '✨', name: b.type };
    var min = Math.floor(b.remaining / 60000);
    var sec = Math.floor((b.remaining % 60000) / 1000);
    var timeText = min > 0 ? min + '分' + sec + '秒' : sec + '秒';
    var title = info.name + 'x' + b.mult + ' 剩余' + timeText;
    return '<div class="buff-chip" title="' + title + '">' +
      '<span class="buff-icon">' + info.icon + '</span>' +
      '<span>x' + b.mult + '</span>' +
      '<span class="buff-time">' + timeText + '</span>' +
      '</div>';
  }).join('');
  bar.innerHTML = html;
}

// 删除存档：二次确认后清除存档并刷新页面
function confirmDeleteSave() {
  if (!confirm('⚠️ 确定要删除存档吗？\n\n所有宠物、装备、进度将永久丢失，无法恢复！')) return;
  if (!confirm('⚠️ 最后确认：真的要删除所有进度从零开始吗？\n\n此操作不可撤销！')) return;
  // 设置标志位，防止 beforeunload 事件重新保存
  window.__DELETING_SAVE__ = true;
  try {
    localStorage.removeItem('shadow_era_save');
  } catch(e) {}
  showToast('存档已删除，正在重新开始...', 'success');
  setTimeout(function() { location.reload(); }, 800);
}

function renderNav() {
  const tabs = [
    { id: 'main', icon: '🏠', label: '主页' },
    { id: 'pets', icon: '🐾', label: '宠物' },
    { id: 'character', icon: '🧑', label: '角色' },
    { id: 'eggs', icon: '🥚', label: '蛋' },
    { id: 'fusion', icon: '🧬', label: '进化' },
    { id: 'petequip', icon: '🎽', label: '宠物装备' },
    { id: 'formation', icon: '🎴', label: '阵法' },
    { id: 'inventory', icon: '🎒', label: '背包' },
    { id: 'dungeon', icon: '🏰', label: '副本' },
    { id: 'market', icon: '💱', label: '市场' },
    { id: 'daily', icon: '📋', label: '日常' },
    { id: 'shop', icon: '🛒', label: '商城' },
    { id: 'lottery', icon: '🎰', label: '抽奖' },
    { id: 'dex', icon: '📖', label: '图鉴' },
    { id: 'talent', icon: '🌟', label: '天赋' },
    { id: 'training', icon: '🥋', label: '练功房' },
    { id: 'achievement', icon: '🏆', label: '成就' },
    { id: 'activity', icon: '🎯', label: '活动' },
    { id: 'treasure', icon: '🗺️', label: '藏宝图' },
    { id: 'dig', icon: '⛏️', label: '挖密藏' },
    { id: 'rebirth', icon: '🔄', label: '转生' },
  ];
  return tabs.map(t => {
    // 需求5：显示锁定状态
    var isLocked = false;
    var lockLevel = 0;
    if (typeof SCREEN_FEATURE_MAP !== 'undefined' && SCREEN_FEATURE_MAP[t.id]) {
      var featureId = SCREEN_FEATURE_MAP[t.id];
      if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked(featureId)) {
        isLocked = true;
        lockLevel = getFeatureUnlockLevel(featureId);
      }
    }
    var lockIcon = isLocked ? ' 🔒<span class="text-xs text-red-400">' + lockLevel + '</span>' : '';
    var lockStyle = isLocked ? ' style="opacity:0.5;"' : '';
    return `
    <button onclick="navigateTo('${t.id}')" class="tab-btn ${currentScreen === t.id ? 'active' : ''}"${lockStyle} title="${isLocked ? '需要' + lockLevel + '级解锁' : ''}">
      ${t.icon} ${t.label}${lockIcon}
    </button>`;
  }).join('');
}

function renderBattleArena() {
  const arena = document.getElementById('battleArenaContent');
  if (!arena) return;
  // v2.2.0 需求1：走路动画阶段渲染
  if (walkPhase && walkPhase.active) {
    var wMap = MAPS.find(function(m) { return m.id === walkPhase.mapId; });
    var wTeam = walkPhase.team || [];
    var petWalkHtml = wTeam.map(function(pet, i) {
      var delay = i * 0.3;
      return '<div class="walk-pet" style="animation-delay:' + delay + 's">' +
        '<div class="text-2xl sm:text-3xl drop-shadow-lg animate-walk-bounce">' + getRaceEmoji(pet.race) + '</div>' +
        '<span class="text-[10px] font-bold truncate max-w-[60px] text-center" style="color:' + RARITY_COLORS[RARITIES.indexOf(pet.rarity)] + '">' + getPetDisplayName(pet) + '</span>' +
      '</div>';
    }).join('');
    arena.innerHTML = '<div class="battle-scene relative w-full h-full flex flex-col overflow-hidden" style="background:linear-gradient(180deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%);min-height:440px;">' +
      '<div class="absolute inset-0 opacity-10 animate-battle-bg" style="background-image:radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px);background-size:20px 20px;"></div>' +
      '<div class="flex-1 flex flex-col items-center justify-center relative z-10">' +
        '<div class="text-center mb-4">' +
          '<p class="text-sm text-secondary mb-1">🗺️ ' + (wMap ? wMap.name : '未知地图') + '</p>' +
          '<p class="text-xs text-cyan-400 animate-pulse">探索中...</p>' +
        '</div>' +
        '<div class="walk-path relative w-full max-w-md h-32 flex items-end justify-center gap-3 px-4">' +
          '<div class="walk-ground absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-600/40 to-transparent"></div>' +
          '<div class="walk-scenery absolute top-2 left-4 text-2xl opacity-40 animate-walk-tree">🌲</div>' +
          '<div class="walk-scenery absolute top-4 right-8 text-2xl opacity-40 animate-walk-tree" style="animation-delay:0.5s">⛰️</div>' +
          '<div class="walk-scenery absolute top-3 left-1/2 text-xl opacity-30 animate-walk-tree" style="animation-delay:1s">🌿</div>' +
          petWalkHtml +
        '</div>' +
        '<div class="mt-4 text-center">' +
          '<p class="text-xs text-yellow-400/60">🐾 正在寻找敌人...</p>' +
        '</div>' +
      '</div>' +
    '</div>';
    return;
  }
  if (!liveBattle) {
    arena.innerHTML = `<div class="flex items-center justify-center h-full text-secondary text-sm">点击"开始挂机"进入战斗</div>`;
    return;
  }
  const lb = liveBattle;
  const prog = getMapProgress();
  const map = MAPS.find(m => m.id === G.player.currentMap);
  // 所有怪物同时显示
  const monsters = lb.monsters || [];
  const aliveCount = monsters.filter((m, i) => lb.monsterHpArray[i] > 0).length;

  // 渲染每个怪物卡片
  const monsterCards = monsters.map((m, i) => {
    const hp = lb.monsterHpArray[i];
    const maxHp = lb.monsterMaxHpArray[i];
    const hpPct = maxHp > 0 ? Math.max(0, Math.floor(hp / maxHp * 100)) : 0;
    const isDead = hp <= 0;
    const enemyType = m.enemyType || 'mob';
    const typeLabel = enemyType === 'boss' ? 'BOSS' : enemyType === 'elite' ? '精英' : '';
    const typeColor = enemyType === 'boss' ? '#ef4444' : enemyType === 'elite' ? '#f59e0b' : '#94a3b8';
    const ms = lb.monsterStatusArray[i] || {};
    const monsterStatusClass = ms.poisoned > 0 ? 'animate-status-poison' : ms.burning > 0 ? 'animate-status-burn' : ms.frozen > 0 ? 'animate-status-freeze' : ms.stunned > 0 ? 'animate-status-stun' : ms.silenced > 0 ? 'animate-status-stun' : '';
    const monsterStatusIcon = ms.poisoned > 0 ? '☠️' : ms.burning > 0 ? '🔥' : ms.frozen > 0 ? '❄️' : ms.stunned > 0 ? '💫' : ms.sleeping > 0 ? '😴' : ms.rooted > 0 ? '🌿' : ms.silenced > 0 ? '🔇' : (ms.tauntedBy !== null && ms.tauntedBy !== undefined) ? '🎯' : '';
    const icon = enemyType === 'boss' ? '👑' : enemyType === 'elite' ? '⭐' : '👹';
    // 任务16：怪物种族显示 + boss buff 状态显示
    const raceEmoji = getRaceEmoji(m.race);
    const mb = (lb.monsterBuffsArray && lb.monsterBuffsArray[i]) || {};
    const buffBadges = [];
    if (mb.atk > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-red-900/70 text-red-300" title="攻击+${Math.floor(mb.atk*100)}%">攻+${Math.floor(mb.atk*100)}%</span>`);
    if (mb.def > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-blue-900/70 text-blue-300" title="防御+${Math.floor(mb.def*100)}%">防+${Math.floor(mb.def*100)}%</span>`);
    if (mb.spd > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-green-900/70 text-green-300" title="速度+${Math.floor(mb.spd*100)}%">速+${Math.floor(mb.spd*100)}%</span>`);
    if (mb.all > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-purple-900/70 text-purple-300" title="全属性+${Math.floor(mb.all*100)}%">全+${Math.floor(mb.all*100)}%</span>`);
    if (mb.reflectBuff > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-yellow-900/70 text-yellow-300" title="反伤${Math.floor(mb.reflectBuff*100)}%">反${Math.floor(mb.reflectBuff*100)}%</span>`);
    if (mb.shield > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-cyan-900/70 text-cyan-300" title="护盾${mb.shield}">盾${mb.shield}</span>`);
    if (mb.counterBuff > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-orange-900/70 text-orange-300" title="反击${Math.floor(mb.counterBuff*100)}%">反击</span>`);
    if (mb.dodgeBuff > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-teal-900/70 text-teal-300" title="闪避+${Math.floor(mb.dodgeBuff*100)}%">闪+${Math.floor(mb.dodgeBuff*100)}%</span>`);
    if (mb.defDebuff > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-gray-900/70 text-gray-300" title="防御-${Math.floor(mb.defDebuff*100)}%">防-${Math.floor(mb.defDebuff*100)}%</span>`);
    if (mb.stolenAtk > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-pink-900/70 text-pink-300" title="偷取攻击力${mb.stolenAtk}">偷${mb.stolenAtk}</span>`);
    // 怪物 Debuff：防御降低（armor_break 效果）
    if (ms.defReduced > 0) buffBadges.push(`<span class="px-1 rounded text-[9px] bg-gray-800/70 text-gray-400" title="防御降低${Math.floor(ms.defReduced*100)}%（剩余${ms.defReduceTurns}回合）">破甲</span>`);
    const buffBadgesHtml = buffBadges.length > 0 ? `<div class="flex flex-wrap gap-0.5 justify-center mt-0.5">${buffBadges.join('')}</div>` : '';
    // 需求24：仅在首次渲染时播放生成/死亡动画，避免每次重绘都重新播放
    var spawnClass;
    if (isDead) {
      spawnClass = m._deadRendered ? 'opacity-30' : 'animate-monster-die opacity-30';
      m._deadRendered = true;
    } else {
      spawnClass = m._rendered ? '' : 'animate-monster-spawn';
      m._rendered = true;
    }
    return `
      <div id="battle-monster-${i}" class="flex flex-col items-center relative ${spawnClass} ${monsterStatusClass}">
        <div class="relative">
          <div class="text-2xl sm:text-3xl mb-0.5 drop-shadow-lg">${isDead ? '🪦' : icon}</div>
          ${(!isDead && monsterStatusIcon) ? `<div class="absolute -top-1 -right-1 text-sm animate-bounce">${monsterStatusIcon}</div>` : ''}
        </div>
        <span class="text-xs font-bold truncate max-w-[80px] text-center" style="color:${typeColor}">${m.name}</span>
        <span class="text-[10px] text-secondary">${raceEmoji}Lv.${m.level} ${typeLabel ? `<span style="color:${typeColor}">${typeLabel}</span>` : ''}</span>
        <div class="w-full max-w-[100px] mt-0.5">
          <div class="flex justify-between text-[10px] mb-0.5">
            <span class="text-red-400 font-bold">HP</span>
            <span class="text-secondary">${Math.floor(Math.max(0, hp))}/${maxHp}</span>
          </div>
          <div class="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div class="h-full rounded-full transition-all duration-500 ${hpPct > 50 ? 'bg-gradient-to-r from-red-500 to-red-400' : hpPct > 25 ? 'bg-gradient-to-r from-orange-500 to-yellow-400' : 'bg-gradient-to-r from-red-700 to-red-500 animate-pulse'}" style="width:${hpPct}%"></div>
          </div>
        </div>
        ${buffBadgesHtml}
      </div>`;
  }).join('');

  arena.innerHTML = `
    <div class="battle-scene relative w-full h-full flex flex-col overflow-hidden" style="background:linear-gradient(180deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%);min-height:440px;">
      <div class="absolute inset-0 opacity-10 animate-battle-bg" style="background-image:radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px);background-size:20px 20px;"></div>
      <div id="skillCastAnnouncement" class="absolute inset-0 flex items-center justify-center pointer-events-none z-20"></div>

      <div class="flex-1 flex flex-col relative z-10">
        <div class="flex justify-between items-center px-3 pt-3">
          <div id="battleAuraBar" class="flex flex-wrap gap-1"></div>
          <span class="text-xs text-secondary bg-black/40 px-2 py-0.5 rounded-full">回合 R${lb.round} · 敌人 ${aliveCount}/${monsters.length}</span>
        </div>
        <div class="flex-1 flex items-start justify-end px-3 sm:px-6 pt-2">
          <div class="flex flex-col items-end gap-1 w-[55%]">
            <div class="flex flex-wrap gap-2 justify-end">
              ${monsterCards}
            </div>
          </div>
        </div>

        <div class="flex items-end px-3 sm:px-6 pb-2">
          <div class="flex flex-wrap gap-2 w-[50%]">
            ${lb.team.map((pet, i) => {
              const isActive = i === lb.currentPetIdx && lb.phase === 'player_turn';
              const hp = lb.petHp[pet.id];
              const hpPct = hp ? Math.max(0, Math.floor(hp.current / hp.max * 100)) : 100;
              const isDead = hp && hp.current <= 0;
              const pos = (G.player.formation || ['front','mid','back'])[i];
              const posInfo = FORMATION_POSITIONS.find(p => p.id === pos);
              const pBuffs = lb.petBuffs[pet.id] || {};
              const hasShield = pBuffs.shield > 0;
              const pStatus = lb.petStatus[pet.id] || {};
              const pStatusClass = pStatus.poisoned > 0 ? 'animate-status-poison' : pStatus.burning > 0 ? 'animate-status-burn' : pStatus.frozen > 0 ? 'animate-status-freeze' : pStatus.stunned > 0 ? 'animate-status-stun' : pStatus.silenced > 0 ? 'animate-status-stun' : '';
              const pStatusIcon = pStatus.poisoned > 0 ? '☠️' : pStatus.burning > 0 ? '🔥' : pStatus.frozen > 0 ? '❄️' : pStatus.stunned > 0 ? '💫' : pStatus.sleeping > 0 ? '😴' : pStatus.rooted > 0 ? '🌿' : pStatus.silenced > 0 ? '🔇' : '';
              const rarityColor = RARITY_COLORS[RARITIES.indexOf(pet.rarity)];
              const posColor = posInfo ? (posInfo.id === 'front' ? '#ef4444' : posInfo.id === 'mid' ? '#f59e0b' : '#3b82f6') : '#94a3b8';
              // 需求24：玩家宠物 buff/debuff 徽章（与怪物一致），鼠标悬停显示效果说明
              const pBuffBadges = [];
              if (pBuffs.atk > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-red-900/70 text-red-300" title="攻击+${Math.floor(pBuffs.atk*100)}%">攻+${Math.floor(pBuffs.atk*100)}%</span>`);
              if (pBuffs.def > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-blue-900/70 text-blue-300" title="防御+${Math.floor(pBuffs.def*100)}%">防+${Math.floor(pBuffs.def*100)}%</span>`);
              if (pBuffs.spd > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-green-900/70 text-green-300" title="速度+${Math.floor(pBuffs.spd*100)}%">速+${Math.floor(pBuffs.spd*100)}%</span>`);
              if (pBuffs.all > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-purple-900/70 text-purple-300" title="全属性+${Math.floor(pBuffs.all*100)}%">全+${Math.floor(pBuffs.all*100)}%</span>`);
              if (pBuffs.reflectBuff > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-yellow-900/70 text-yellow-300" title="反伤${Math.floor(pBuffs.reflectBuff*100)}%">反${Math.floor(pBuffs.reflectBuff*100)}%</span>`);
              if (pBuffs.shield > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-cyan-900/70 text-cyan-300" title="护盾${pBuffs.shield}">盾${pBuffs.shield}</span>`);
              if (pBuffs.counterBuff > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-orange-900/70 text-orange-300" title="反击${Math.floor(pBuffs.counterBuff*100)}%">反</span>`);
              if (pBuffs.defDebuff > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-gray-900/70 text-gray-300" title="防御-${Math.floor(pBuffs.defDebuff*100)}%">防-${Math.floor(pBuffs.defDebuff*100)}%</span>`);
              if (pBuffs.stolenAtk > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-pink-900/70 text-pink-300" title="偷取攻击力${pBuffs.stolenAtk}">偷${pBuffs.stolenAtk}</span>`);
              if (pBuffs.dodgeBuff > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-teal-900/70 text-teal-300" title="闪避+${Math.floor(pBuffs.dodgeBuff*100)}%">闪+${Math.floor(pBuffs.dodgeBuff*100)}%</span>`);
              if (pBuffs.hotTurns > 0 && pBuffs.hotPct > 0) pBuffBadges.push(`<span class="px-1 rounded text-[9px] bg-green-900/70 text-green-300" title="每回合恢复${Math.floor(pBuffs.hotPct*100)}%气血（剩余${pBuffs.hotTurns}回合）">回${Math.floor(pBuffs.hotPct*100)}%</span>`);
              const pBuffBadgesHtml = pBuffBadges.length > 0 ? `<div class="flex flex-wrap gap-0.5 justify-center mt-0.5">${pBuffBadges.join('')}</div>` : '';
              return `
              <div id="battle-pet-${pet.id}" class="flex flex-col items-center relative transition-all duration-300 ${isActive ? 'scale-105' : ''} ${isDead ? 'opacity-30 grayscale' : ''} ${hasShield ? 'animate-shield rounded-lg p-1' : ''} ${pStatusClass}">
                <div class="relative">
                  <div class="text-2xl sm:text-3xl mb-0.5 drop-shadow-lg">${isDead ? '🪦' : getRaceEmoji(pet.race)}</div>
                  ${(!isDead && pStatusIcon) ? `<div class="absolute -top-1 -right-1 text-sm animate-bounce">${pStatusIcon}</div>` : ''}
                  ${(!isDead && isActive) ? '<div class="absolute -top-1 -left-1 text-sm animate-bounce">⚔️</div>' : ''}
                </div>
                <span class="text-xs font-bold truncate max-w-[80px] text-center" style="color:${rarityColor}">${getPetDisplayName(pet)}</span>
                <span class="text-[10px] text-secondary">${getRaceEmoji(pet.race)}Lv.${pet.level} ${posInfo ? `<span style="color:${posColor}">${posInfo.name}</span>` : ''}</span>
                <div class="w-full max-w-[100px] mt-0.5">
                  <div class="flex justify-between text-[10px] mb-0.5">
                    <span class="${isDead ? 'text-red-400' : 'text-green-400'} font-bold">HP</span>
                    <span class="text-secondary">${hp ? Math.floor(Math.max(0, hp.current)) : '?'}/${hp ? hp.max : '?'}</span>
                  </div>
                  <div class="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <div class="h-full rounded-full transition-all duration-500 ${isDead ? 'bg-red-600' : hpPct > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' : hpPct > 25 ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'}" style="width:${hpPct}%"></div>
                  </div>
                </div>
                ${pBuffBadgesHtml}
                ${isDead ? '<span class="text-[10px] text-red-400">💀</span>' : ''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="px-4 pb-2 relative z-10">
        <div class="flex justify-between items-center text-xs text-secondary bg-black/30 rounded-lg px-3 py-1">
          <span>${map ? map.name : ''} · ${prog.currentLayer}/${map ? map.layers : 10}层</span>
          <span>${prog.phase === 'mobs' ? `小怪 ${prog.mobsKilled}/${prog.mobsNeeded}` : prog.phase === 'elite' ? '精英战' : prog.phase === 'boss' ? 'BOSS战' : ''}</span>
        </div>
      </div>
    </div>
  `;
  // 需求7：渲染光环效果到战斗界面
  var auraBar = document.getElementById('battleAuraBar');
  if (auraBar && lb.team && lb.team.length > 0) {
    var auraEffects = {};
    lb.team.forEach(function(pet) {
      var skills = getAllSkills(pet);
      skills.filter(function(s) { return s.type === 'aura'; }).forEach(function(s) {
        if (!s.effect) return;
        Object.keys(s.effect).forEach(function(k) {
          if (!auraEffects[k] || s.effect[k] > auraEffects[k]) auraEffects[k] = s.effect[k];
        });
      });
    });
    var auraLabels = {
      teamAtk: { icon: '⚔️', name: '攻击', fmt: function(v) { return '+' + Math.floor(v*100) + '%'; }, color: 'text-red-300 bg-red-900/70' },
      teamDef: { icon: '🛡️', name: '防御', fmt: function(v) { return '+' + Math.floor(v*100) + '%'; }, color: 'text-blue-300 bg-blue-900/70' },
      teamSpd: { icon: '💨', name: '速度', fmt: function(v) { return '+' + Math.floor(v*100) + '%'; }, color: 'text-green-300 bg-green-900/70' },
      teamHp: { icon: '❤️', name: '气血', fmt: function(v) { return '+' + Math.floor(v*100) + '%'; }, color: 'text-pink-300 bg-pink-900/70' },
      teamCrit: { icon: '🎯', name: '暴击', fmt: function(v) { return '+' + Math.floor(v*100) + '%'; }, color: 'text-yellow-300 bg-yellow-900/70' },
      teamRegen: { icon: '💚', name: '回复', fmt: function(v) { return Math.floor(v*100) + '%/回合'; }, color: 'text-emerald-300 bg-emerald-900/70' },
    };
    var auraHtml = '';
    Object.keys(auraEffects).forEach(function(k) {
      var info = auraLabels[k];
      if (info) {
        auraHtml += '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold ' + info.color + '" title="光环：全队' + info.name + info.fmt(auraEffects[k]) + '">' + info.icon + info.fmt(auraEffects[k]) + '</span>';
      }
    });
    auraBar.innerHTML = auraHtml;
  }
}

// 需求24：技能释放时在战场中央显示技能名与施法者
function showSkillCastAnnouncement(casterName, skillName, skillType) {
  var el = document.getElementById('skillCastAnnouncement');
  if (!el) return;
  var color = skillType === 'aura' ? '#a855f7' : skillType === 'active' ? '#f59e0b' : '#3b82f6';
  el.innerHTML = '<div class="text-center animate-skillCast">' +
    '<p class="text-xl font-black" style="color:' + color + ';text-shadow:0 0 8px ' + color + ',0 2px 4px #000;">' + skillName + '</p>' +
    '<p class="text-sm text-white mt-1" style="text-shadow:0 1px 2px #000;">— ' + casterName + ' —</p>' +
    '</div>';
  setTimeout(function() { if (el) el.innerHTML = ''; }, 1500);
}

function getRaceEmoji(race) {
  const map = { '史莱姆': '🟢', '龙': '🐉', '恶魔': '😈', '天使': '👼', '哥布林': '👺', '精灵': '🧝' };
  return map[race] || '🐾';
}

function renderMainScreen() {
  const team = getTeamPets();
  const cp = Math.floor(getPlayerCombatPower());
  const map = MAPS.find(m => m.id === G.player.currentMap);
  const expPct = Math.floor((G.player.exp / G.player.expToNext) * 100);
  const showGift = team.length === 0 && !G.newPlayerGiftClaimed;

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-3">
        <button class="text-xs px-2 py-1 rounded border border-red-700 text-red-400 hover:bg-red-900/40" title="删除存档重新开始" onclick="confirmDeleteSave()">🗑️ 删除存档</button>
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl font-bold">⚔️</div>
        <div>
          <h1 class="font-fantasy text-gold text-lg">暗影纪元</h1>
          <p class="text-xs text-secondary">Lv.${G.player.level} ${G.player.rebirth > 0 ? '★'.repeat(G.player.rebirth) : ''}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 text-sm">
        <span class="text-gold">💎 ${G.player.diamond}</span>
        <span class="text-yellow-400">🪙 ${G.player.gold.toLocaleString()}</span>
        <span class="text-secondary">战力 ${cp.toLocaleString()}</span>
        <button class="btn-gold btn-sm text-xs" onclick="openRedeemModal()">🎁 兑换码</button>
      </div>
    </header>

    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">
      ${renderNav()}
    </nav>

    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      ${showGift ? `
      <div class="bg-gradient-to-r from-yellow-900/40 via-amber-800/30 to-yellow-900/40 border-2 border-yellow-600 rounded-xl p-5 animate-gift-glow cursor-pointer" onclick="claimNewPlayerGift()">
        <div class="flex items-center gap-4 flex-wrap">
          <div class="text-5xl">🎁</div>
          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-xl text-gold mb-1">🎉 新手礼包</h2>
            <p class="text-sm text-yellow-300/80 mb-1">欢迎来到暗影纪元！点击领取你的初始宠物开始冒险</p>
            <p class="text-xs text-yellow-400/60">内含：<span class="text-white font-bold">3只T1初始宠物</span>（防御+伤害+辅助各1只）+ <span class="text-white font-bold">10钻石</span> + <span class="text-white font-bold">5颗宠物蛋</span> + <span class="text-white font-bold">5个孵化石</span></p>
            <p class="text-xs text-yellow-400/60 mt-1">附赠120分钟5项增益（全属性+200、双倍经验/金币、孵化10倍速、双倍蛋掉落），宠物自动出战！</p>
          </div>
          <div class="text-center">
            <div class="btn-gold text-lg px-6 py-3 font-bold">🎁 点击领取</div>
            <p class="text-xs text-yellow-400/60 mt-1">点击任意位置领取</p>
          </div>
        </div>
      </div>
      ` : ''}

      ${(() => {
        // 需求1：主线剧情任务显示
        if (typeof getCurrentMainQuest !== 'function') return '';
        var mq = getCurrentMainQuest();
        if (!mq || !mq.questData) return '';
        var q = mq.questData;
        var pct = Math.min(100, Math.floor((mq.progress / q.target) * 100));
        var done = mq.progress >= q.target;
        var rewardParts = [];
        if (q.reward.exp) rewardParts.push('⭐' + q.reward.exp);
        if (q.reward.gold) rewardParts.push('🪙' + q.reward.gold);
        if (q.reward.diamond) rewardParts.push('💎' + q.reward.diamond);
        var typeLabel = q.type === 'tutorial' ? '📖 新手引导' : q.type === 'feature' ? '🔑 功能解锁' : '⚔️ 日常历练';
        var typeColor = q.type === 'tutorial' ? '#22c55e' : q.type === 'feature' ? '#f59e0b' : '#3b82f6';
        return `
        <div class="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-600/50 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded" style="background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}">${typeLabel}</span>
              <h2 class="font-bold text-base text-gold">${q.name}</h2>
            </div>
            ${done ? '<button class="btn-gold btn-sm" onclick="claimMainQuestUI()">🎁 领取奖励</button>' : ''}
          </div>
          <p class="text-sm text-secondary mb-2">${q.desc}</p>
          <div class="flex items-center gap-2">
            <div class="progress-bar flex-1">
              <div class="progress-fill ${done ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'}" style="width:${pct}%"></div>
            </div>
            <span class="text-xs ${done ? 'text-green-400' : 'text-secondary'}">${Math.min(mq.progress, q.target)}/${q.target}</span>
          </div>
          <p class="text-xs text-yellow-400/70 mt-1">奖励：${rewardParts.join(' ')}</p>
        </div>`;
      })()}

      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">⚔️ 战斗</h2>
          <div class="flex items-center gap-2">
            <span class="text-xs text-secondary">地图：${map ? map.name : '未知'}</span>
            <select id="mapSelect" class="text-xs py-1 px-2" onchange="changeMap(this.value)">
              ${MAPS.filter(m => G.player.level >= m.minLv - 5).map(m => {
                const mp = G.mapProgress[m.id];
                const layerInfo = mp ? ` ${mp.currentLayer}/${m.layers}层` : '';
                return `<option value="${m.id}" ${G.player.currentMap === m.id ? 'selected' : ''}>${m.name}${layerInfo} (Lv.${m.minLv}-${m.maxLv})</option>`;
              }).join('')}
            </select>
          </div>
        </div>
        ${(() => { const prog = getMapProgress(); return `
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs text-secondary">第${prog.currentLayer}/${map ? map.layers : 10}层</span>
          ${prog.phase === 'mobs' ? `<span class="text-xs text-secondary">小怪 ${prog.mobsKilled}/${prog.mobsNeeded}</span>` : ''}
          ${prog.phase === 'elite' ? '<span class="text-xs text-yellow-400 font-bold">⭐ 精英怪</span>' : ''}
          ${prog.phase === 'boss' ? '<span class="text-xs text-red-400 font-bold">👑 BOSS</span>' : ''}
          ${prog.phase === 'cleared' ? '<span class="text-xs text-green-400 font-bold">✅ 已通关</span>' : ''}
        </div>
        ${prog.phase === 'mobs' ? `<div class="flex items-center gap-2 mb-2"><div class="progress-bar flex-1"><div class="progress-fill bg-gradient-to-r from-cyan-500 to-blue-500" style="width:${Math.floor(prog.mobsKilled/prog.mobsNeeded*100)}%"></div></div></div>` : ''}
        `; })()}
        <div class="flex items-center gap-3 mb-3 flex-wrap">
          <button id="btnAutoBattle" class="btn-primary" onclick="toggleAutoBattle()">
            ${autoBattleInterval ? '⏸ 停止挂机' : '▶ 开始挂机'}
          </button>
          <div class="flex items-center gap-1 bg-panel rounded-lg p-1">
${[1,2,4,8,16,32].map(s => {
const unlocked = s <= 4 || (s === 8 && G.player.rebirth >= 1) || (s === 16 && G.player.rebirth >= 3) || (s === 32 && G.player.rebirth >= 5);
if (!unlocked) {
const req = s === 8 ? '转生1' : s === 16 ? '转生3' : '转生5';
return `<button class="speed-btn opacity-30 cursor-not-allowed text-xs" disabled title="需要${req}次解锁">${(s*1.5)}x</button>`;
}
return `<button class="speed-btn ${G.battleSpeed === s ? 'active' : ''}" onclick="setBattleSpeed(${s})">${(s*1.5)}x</button>`;
}).join('')}
          </div>
          <span class="text-xs text-secondary">${autoBattleInterval ? (walkPhase ? '🐾 探索中...' : '挂机中...') : '已停止'}</span>
          <button class="text-xs px-2 py-1 rounded border border-game ${G.autoOpenChests ? 'text-green-400' : 'text-secondary'}" onclick="toggleAutoChests()">
            ${G.autoOpenChests ? '📦 自动开箱' : '🎒 手动开箱'}
          </button>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs text-secondary">经验：</span>
          <div class="progress-bar flex-1">
            <div class="progress-fill bg-gradient-to-r from-purple-500 to-blue-500" style="width:${expPct}%"></div>
          </div>
          <span class="text-xs text-secondary">${Math.floor(G.player.exp)}/${G.player.expToNext}</span>
        </div>
      </div>

      <div class="battle-arena border border-game" id="battleArena">
        <div id="battleArenaContent" class="h-full flex items-center justify-center min-h-[380px]">
          ${liveBattle ? '' : `<div class="text-secondary text-sm">${team.length === 0 ? '请先设置出战宠物或领取新手礼包' : '点击"开始挂机"进入战斗'}</div>`}
        </div>
      </div>

      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🐾 出战宠物</h2>
        <div class="grid grid-cols-3 gap-3">
          ${[0,1,2].map(i => {
            const pet = team[i];
            if (!pet) return `<div class="pet-card flex items-center justify-center text-secondary text-sm min-h-[80px]">空位 ${i+1}</div>`;
            const pos = (G.player.formation || ['front','mid','back'])[i];
            const posInfo = FORMATION_POSITIONS.find(p => p.id === pos);
            return `
            <div class="pet-card rarity-${pet.rarity}">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">${RARITY_NAMES[RARITIES.indexOf(pet.rarity)]}</span>
                <span class="text-xs px-1 rounded" style="background:#333;color:${posInfo && posInfo.id === 'front' ? '#ef4444' : posInfo && posInfo.id === 'mid' ? '#f59e0b' : '#3b82f6'}">${posInfo ? posInfo.name : ''}</span>
              </div>
              <p class="font-bold text-sm">${getPetDisplayName(pet)}</p>
              <p class="text-xs text-secondary">${pet.race} · Lv.${pet.level}</p>
              <p class="text-xs text-secondary">成长 ${pet.growth.toFixed(2)}</p>
              <p class="text-xs" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">战力 ${Math.floor(getPetCombatPower(pet))}</p>
            </div>`;
          }).join('')}
        </div>
        <div class="mt-3 pt-3 border-t border-game">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-secondary">🎴 当前阵法：</span>
            <select class="text-xs py-1 px-2 bg-panel border border-game rounded" onchange="setActiveFormation(this.value)">
              <option value="">不使用阵法</option>
              ${FORMATIONS.map(f => {
                const learned = G.formations[f.id];
                const isActive = G.activeFormation === f.id;
                const levelText = learned ? 'Lv.' + learned.level : '未学习';
                return `<option value="${f.id}" ${isActive ? 'selected' : ''} ${!learned ? 'disabled' : ''} style="${learned ? '' : 'color:#666'}">${f.icon} ${f.name}（${levelText}）${isActive ? '✓' : ''}</option>`;
              }).join('')}
            </select>
            ${(() => {
              if (!G.activeFormation) return '<span class="text-xs text-secondary">未激活阵法</span>';
              const f = FORMATIONS.find(x => x.id === G.activeFormation);
              if (!f) return '';
              const learned = G.formations[G.activeFormation];
              const mult = getFormationLevelMult(learned.level);
              return '<span class="text-xs" style="color:' + f.color + '">📜 ' + f.name + ' Lv.' + learned.level + '（×' + mult.toFixed(1) + '）· ' + f.desc + '</span>';
            })()}
            <button class="btn-primary btn-sm text-xs" onclick="navigateTo('formation')">📜 阵法管理</button>
          </div>
        </div>
      </div>

      ${G.chests.length > 0 ? `
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-bold text-lg">🎁 未开宝箱 (${G.chests.length})</h2>
          <button class="btn-gold btn-sm" onclick="openAllChests()">一键开启</button>
        </div>
        <div class="flex flex-wrap gap-2">
          ${G.chests.map(c => {
            const cr = CHEST_RARITIES.find(r => r.id === c.rarity);
            return `<div class="chest-item ${cr.glow} text-center p-2 rounded-lg" style="background:${cr.color}22;border:1px solid ${cr.color}44" onclick="openChestFromBag('${c.id}')">
              <div class="text-2xl">${getChestEmoji(c.rarity)}</div>
              <span class="text-xs" style="color:${cr.color}">${cr.name}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      ` : ''}
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-2">📦 掉落日志</h2>
        <div class="battle-log scrollbar-thin" id="battleLog" style="display:flex;flex-direction:column-reverse;">
          ${(() => { var lootLogs = G.battleLog.filter(function(l) { return l.type === 'loot'; }); return lootLogs.slice(-40).reverse().map(l => `<div class="${l.type}">${l.msg}</div>`).join('') || '<div class="text-secondary text-sm">等待掉落...</div>'; })()}
        </div>
      </div>
    </main>
  </div>`;
}

function renderPetScreen() {
  const selSlot = selectingTeamSlot;
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🐾 宠物管理</h1>
      <span class="text-sm text-secondary">共 ${G.pets.length} 只宠物</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full">
      <div class="mb-4">
        <h2 class="font-bold mb-2">${selSlot >= 0 ? '点击下方宠物放入槽位 ' + (selSlot+1) + '（点击此处取消）' : '点击上阵槽位选择要替换的位置'}</h2>
        <div class="grid grid-cols-3 gap-3 mb-4">
          ${[0,1,2].map(i => {
            const pet = G.pets.find(p => p.id === G.player.activeTeam[i]);
            const isSelected = selSlot === i;
            const pos = (G.player.formation || ['front','mid','back'])[i];
            const posInfo = FORMATION_POSITIONS.find(p => p.id === pos);
            return `
            <div class="pet-card ${pet ? 'rarity-'+pet.rarity : ''} ${isSelected ? 'border-purple-500 border-2' : ''} min-h-[80px] flex flex-col items-center justify-center cursor-pointer relative" onclick="selectTeamSlot(${i})">
              ${pet ? `
                <span class="text-xs font-bold" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">${getPetDisplayName(pet)}</span>
                <span class="text-xs text-secondary">${pet.race} · Lv.${pet.level}</span>
                <span class="text-xs px-1.5 py-0.5 rounded mt-1" style="background:${posInfo ? '#333' : '#333'};color:${posInfo && posInfo.id === 'front' ? '#ef4444' : posInfo && posInfo.id === 'mid' ? '#f59e0b' : '#3b82f6'}">${posInfo ? posInfo.icon + ' ' + posInfo.name : '未知'}</span>
                <button class="btn-danger btn-sm mt-1" onclick="event.stopPropagation();removeFromTeam(${i})">卸下</button>
              ` : `
                <span class="text-secondary text-sm">空位 ${i+1}</span>
                <span class="text-xs text-secondary mt-1">${isSelected ? '选择中...' : '点击选择'}</span>
                <span class="text-xs px-1.5 py-0.5 rounded mt-1" style="background:#333;color:${posInfo && posInfo.id === 'front' ? '#ef4444' : posInfo && posInfo.id === 'mid' ? '#f59e0b' : '#3b82f6'}">${posInfo ? posInfo.icon + ' ' + posInfo.name : '未知'}</span>
              `}
            </div>`;
          }).join('')}
        </div>
        <div class="flex gap-2 mb-2 flex-wrap">
          <span class="text-xs text-secondary">站位调整：</span>
          ${[0,1,2].map(i => {
            const pos = (G.player.formation || ['front','mid','back'])[i];
            return `
            <select class="text-xs py-1 px-2 bg-panel border border-game rounded" onchange="changeFormation(${i}, this.value)">
              ${FORMATION_POSITIONS.map(fp => `<option value="${fp.id}" ${pos === fp.id ? 'selected' : ''}>${fp.icon} ${fp.name}</option>`).join('')}
            </select>`;
          }).join('')}
        </div>
        ${selSlot >= 0 ? `<p class="text-xs text-yellow-400 mb-2">正在为上阵槽位 ${selSlot+1} 选择宠物，点击下方宠物即可放入</p>` : ''}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${G.pets.length === 0 ? '<p class="text-secondary col-span-full text-center py-8">还没有宠物，去战斗获取宠物蛋吧！</p>' : ''}
        ${(() => {
          var pg = paginateList('pets', G.pets.length, 12);
          var start = (pg.page - 1) * pg.pageSize;
          var slice = G.pets.slice(start, start + pg.pageSize);
          return slice.map(pet => {
          const stats = getPetStats(pet);
          const normalSkills = getNormalSkills(pet);
          const bloodline = getBloodlineSkill(pet);
          const isInTeam = G.player.activeTeam.includes(pet.id);
          return `
          <div class="pet-card rarity-${pet.rarity} ${isInTeam ? 'border-green-500 border-2' : ''} cursor-pointer" onclick="${selSlot >= 0 ? `assignPetToSlot('${pet.id}')` : `showPetDetail('${pet.id}')`}">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">${RARITY_NAMES[RARITIES.indexOf(pet.rarity)]}</span>
              <div class="flex gap-1">${pet.advanceable ? '<span class="text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-900 text-yellow-300 border border-yellow-500" title="可进阶宠物">进</span>' : ''}${isInTeam ? '<span class="text-xs text-green-400 font-bold">✓ 已出战</span>' : ''}</div>
            </div>
            <p class="font-bold">${getPetDisplayName(pet)}</p>
            <p class="text-xs text-secondary">${pet.race} · Lv.${pet.level} · 成长 ${pet.growth.toFixed(2)}</p>
            <div class="grid grid-cols-3 gap-1 my-2 text-xs">
              <span class="text-red-400">❤气血: ${stats.气血}</span>
              <span class="text-blue-400">✨魔法: ${stats.魔法值}</span>
              <span class="text-orange-400">⚔攻击: ${stats.攻击力}</span>
              <span class="text-gray-300">🛡防御: ${stats.防御力}</span>
              <span class="text-purple-400">🔮灵力: ${stats.灵力}</span>
              <span class="text-green-400">💨速度: ${stats.速度}</span>
            </div>
            ${bloodline ? `<p class="text-xs text-yellow-400 mb-1">👑 ${bloodline.name}</p>` : ''}
            <p class="text-xs text-secondary mb-1">技能 (${normalSkills.length})：${normalSkills.map(s => s.name).join('、') || '无'}</p>
            <p class="text-xs font-bold" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">战力 ${Math.floor(getPetCombatPower(pet))}</p>
            <div class="flex gap-2 mt-2">
              <button class="btn-primary btn-sm flex-1" onclick="event.stopPropagation();showPetDetail('${pet.id}')">详情</button>
              <button class="btn-danger btn-sm" onclick="event.stopPropagation();releasePet('${pet.id}')">放生</button>
            </div>
          </div>`;
          }).join('') + pg.controlsHtml;
        })()}
      </div>
    </main>
  </div>`;
}

function renderPetDetailModal() {
  if (!viewingPetId) return '';
  const pet = G.pets.find(p => p.id === viewingPetId);
  if (!pet) { viewingPetId = null; return ''; }
  const stats = getPetStats(pet);
  const normalSkills = getNormalSkills(pet);
  const bloodline = getBloodlineSkill(pet);
  const isInTeam = G.player.activeTeam.includes(pet.id);
  const maxSlots = getMaxSkillSlots(pet);
  const books = G.skillBooks.filter(b => b.count > 0);
  return `
  <div class="modal-overlay" onclick="closePetDetail()">
    <div class="modal-content scrollbar-thin" onclick="event.stopPropagation()" style="max-width:560px;max-height:85vh;">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="font-bold text-lg" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">${getPetDisplayName(pet)}</h2>
          ${pet.customName ? '<span class="text-xs text-secondary">(' + pet.name + ')</span>' : ''}
          <button class="text-xs px-2 py-1 rounded bg-panel border border-game text-secondary hover:text-white hover:border-yellow-500" onclick="showRenamePrompt('${pet.id}')">✏️改名</button>
        </div>
        <button class="text-secondary hover:text-white text-xl" onclick="closePetDetail()">✕</button>
      </div>
      <div class="text-center mb-4">
        <div class="text-5xl mb-2">${getRaceEmoji(pet.race)}</div>
        <span class="text-xs font-bold px-2 py-1 rounded" style="background:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}22;color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">${RARITY_NAMES[RARITIES.indexOf(pet.rarity)]}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div class="bg-panel rounded-lg p-2"><span class="text-secondary">种族：</span>${pet.race}</div>
        <div class="bg-panel rounded-lg p-2"><span class="text-secondary">等级：</span>Lv.${pet.level}</div>
        <div class="bg-panel rounded-lg p-2"><span class="text-secondary">成长：</span><span class="text-gold">${pet.growth.toFixed(2)}</span></div>
        <div class="bg-panel rounded-lg p-2"><span class="text-secondary">战力：</span><span style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">${Math.floor(getPetCombatPower(pet))}</span></div>
      </div>
      ${(() => {
        var cp = getCombatPowerBreakdown(pet);
        var rowCls = 'flex items-center justify-between text-xs py-0.5';
        var labelCls = 'text-secondary';
        var valCls = 'font-bold text-blue-300';
        function fmt(n) { return Math.round(n).toLocaleString(); }
        function pct(n, total) { return total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0.0%'; }
        return '<div class="bg-panel rounded-lg p-3 border border-blue-600/40 mb-4">' +
          '<div class="flex items-center justify-between mb-2">' +
            '<p class="text-xs text-blue-300 font-bold">📊 战斗力组成</p>' +
            '<p class="text-xs text-secondary">技能倍率 <span class="text-yellow-400 font-bold">×' + cp.skillMult.toFixed(3) + '</span></p>' +
          '</div>' +
          '<div class="' + rowCls + '"><span class="' + labelCls + '">基础属性战力</span><span class="' + valCls + '">' + fmt(cp.baseCp) + ' <span class="text-secondary">(' + pct(cp.baseCp, cp.total) + ')</span></span></div>' +
          '<div class="' + rowCls + '"><span class="' + labelCls + '">宝石加成战力</span><span class="' + valCls + '">' + fmt(cp.gemCp) + ' <span class="text-secondary">(' + pct(cp.gemCp, cp.total) + ')</span></span></div>' +
          '<div class="' + rowCls + '"><span class="' + labelCls + '">人物属性加成</span><span class="' + valCls + '">' + fmt(cp.charCp) + ' <span class="text-secondary">(' + pct(cp.charCp, cp.total) + ')</span></span></div>' +
          '<div class="' + rowCls + '"><span class="' + labelCls + '">天赋倍率战力</span><span class="' + valCls + '">' + fmt(cp.talentCp) + ' <span class="text-secondary">(' + pct(cp.talentCp, cp.total) + ')</span></span></div>' +
          '<div class="' + rowCls + '"><span class="' + labelCls + '">装备特效战力</span><span class="' + valCls + '">' + fmt(cp.petBonusCp) + ' <span class="text-secondary">(' + pct(cp.petBonusCp, cp.total) + ')</span></span></div>' +
          '<div class="' + rowCls + '"><span class="' + labelCls + '">属性战力小计</span><span class="text-gold font-bold">' + fmt(cp.statCp) + '</span></div>' +
          '<div class="border-t border-game my-1"></div>' +
          '<div class="' + rowCls + '"><span class="' + labelCls + '">技能额外加成</span><span class="text-yellow-400 font-bold">+' + fmt(cp.skillCp) + ' <span class="text-secondary">(' + pct(cp.skillCp, cp.total) + ')</span></span></div>' +
          '<div class="border-t border-game my-1"></div>' +
          '<div class="' + rowCls + '"><span class="text-gold font-bold">总战力</span><span class="text-gold font-bold text-base">' + fmt(cp.total) + '</span></div>' +
        '</div>';
      })()}
      <h3 class="font-bold text-sm mb-2">📊 战斗属性</h3>
      <div class="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">❤气血</p>
          <p class="font-bold text-red-400">${stats.气血}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">✨魔法</p>
          <p class="font-bold text-blue-400">${stats.魔法值}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">⚔攻击力</p>
          <p class="font-bold text-orange-400">${stats.攻击力}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">🛡防御力</p>
          <p class="font-bold text-gray-300">${stats.防御力}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">🔮灵力</p>
          <p class="font-bold text-purple-400">${stats.灵力}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">💨速度</p>
          <p class="font-bold text-green-400">${stats.速度}</p>
        </div>
      </div>
      <h3 class="font-bold text-sm mb-2 mt-3">📋 基础四维${stats.charBonus ? '<span class="text-xs text-yellow-400 ml-2">（+号为人物属性20%加成）</span>' : ''}</h3>
      <div class="grid grid-cols-4 gap-2 mb-4 text-xs">
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">体质</p>
          <p class="font-bold">${stats.体质 - (stats.charBonus ? stats.charBonus.体质 : 0)}${stats.charBonus && stats.charBonus.体质 > 0 ? '<span class="text-green-400">+' + stats.charBonus.体质 + '</span>' : ''}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">力量</p>
          <p class="font-bold">${stats.力量 - (stats.charBonus ? stats.charBonus.力量 : 0)}${stats.charBonus && stats.charBonus.力量 > 0 ? '<span class="text-green-400">+' + stats.charBonus.力量 + '</span>' : ''}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">敏捷</p>
          <p class="font-bold">${stats.敏捷 - (stats.charBonus ? stats.charBonus.敏捷 : 0)}${stats.charBonus && stats.charBonus.敏捷 > 0 ? '<span class="text-green-400">+' + stats.charBonus.敏捷 + '</span>' : ''}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">智慧</p>
          <p class="font-bold">${stats.智慧 - (stats.charBonus ? stats.charBonus.智力 : 0)}${stats.charBonus && stats.charBonus.智力 > 0 ? '<span class="text-green-400">+' + stats.charBonus.智力 + '</span>' : ''}</p>
        </div>
      </div>
      ${(() => {
        // 宠物装备栏显示
        // v2.2.0 需求2：宠物装备功能等级锁定
        if (!pet.petEquipment) return '';
        if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('pet_equip')) {
          var peUnlockLv = getFeatureUnlockLevel('pet_equip');
          return '<div class="mb-4"><h3 class="font-bold text-sm mb-2">🎒 宠物装备</h3>' +
            '<div class="bg-panel rounded-lg p-4 text-center border border-game">' +
            '<div class="text-3xl mb-2">🔒</div>' +
            '<p class="text-xs text-secondary">宠物装备功能将在 <span class="text-gold font-bold">Lv.' + peUnlockLv + '</span> 解锁</p>' +
            '</div></div>';
        }
        var pe = pet.petEquipment;
        var slotsHtml = PET_EQUIP_SLOTS.map(function(slot) {
          var e = pe[slot.id];
          if (e) {
            var rIdx = PET_EQUIP_RARITIES.indexOf(e.rarity);
            // 需求5：封印状态显示
            var sealInfo = '';
            if (e.sealed) {
              var ratio = (typeof getPetEquipUnsealRatio === 'function') ? getPetEquipUnsealRatio(e) : 1;
              var pct = Math.floor(ratio * 100);
              sealInfo = '<div class="text-xs text-yellow-400 font-bold">🔒 封印中（解封' + pct + '%）</div>';
            }
            return '<div class="bg-panel border rounded p-2" style="border-color:' + PET_EQUIP_RARITY_COLORS[rIdx] + '">' +
              '<div class="text-xs text-secondary mb-1">' + slot.icon + ' ' + slot.name + '</div>' +
              '<div class="text-xs font-bold" style="color:' + PET_EQUIP_RARITY_COLORS[rIdx] + '">' + e.name + '</div>' +
              '<div class="text-xs text-secondary">' + e.baseStat + ' +' + e.baseValue + '</div>' +
              (e.affixes||[]).map(function(a) {
                var d = PET_AFFIX_TYPES.find(function(t){return t.id===a.id;});
                return d ? '<div class="text-xs text-green-400">' + d.format(a.value) + '</div>' : '';
              }).join('') +
              (e.setId ? (function(){var s = PET_EQUIP_SETS.find(function(x){return x.id===e.setId;}); return s?'<div class="text-xs font-bold" style="color:'+s.color+'">['+s.name+']</div><div class="text-[10px] text-secondary mt-0.5">2件：'+s.desc+'</div><div class="text-[10px] text-secondary">3件：'+s.desc3+'</div>':'';})() : '') +
              sealInfo +
              '</div>';
          }
          return '<div class="bg-panel border border-dashed border-game rounded p-2 text-center">' +
            '<div class="text-xs text-secondary mb-1">' + slot.icon + ' ' + slot.name + '</div>' +
            '<div class="text-xs text-secondary">空</div>' +
            '</div>';
        }).join('');
        // 已激活的套装
        var peBonus = (typeof getPetEquipBonus === 'function') ? getPetEquipBonus(pet) : null;
        var setHtml = '';
        if (peBonus && Object.keys(peBonus.setBonuses).length > 0) {
          var SET_BONUS_NAMES = {
            allPct: '全属性', atkPct: '攻击力', hpPct: '气血', defPct: '防御力',
            spdPct: '速度', intPct: '灵力', critRate: '暴击率', critDmg: '暴击伤害',
            skillDmg: '技能伤害', dodgeRate: '闪避', vampPct: '吸血',
          };
          var SET_BONUS_FLAT = {
            extraAttack: '追加普攻', deathImmune: '免死', endRegen: '回合回血',
            extraTarget: '普攻目标+1', magicExtraTarget: '法术目标+1',
          };
          setHtml = '<div class="mt-2">' +
            '<p class="text-xs font-bold mb-1">🎯 已激活套装</p>' +
            Object.keys(peBonus.setBonuses).map(function(setId) {
              var sb = peBonus.setBonuses[setId];
              var bonusStr = Object.keys(sb.bonus).map(function(k) {
                var label = SET_BONUS_NAMES[k] || SET_BONUS_FLAT[k] || k;
                if (SET_BONUS_FLAT[k]) return label + (sb.bonus[k] > 1 ? ' ×' + sb.bonus[k] : '');
                return label + ' +' + (sb.bonus[k] * 100).toFixed(0) + '%';
              }).join('，');
              return '<div class="text-xs" style="color:' + sb.color + '">[' + sb.name + '] ' + sb.count + '件：' + bonusStr + '</div>';
            }).join('') +
            '</div>';
        }
        return '<h3 class="font-bold text-sm mb-2 mt-3">🎽 宠物装备</h3>' +
          '<div class="grid grid-cols-3 gap-2 mb-3">' + slotsHtml + '</div>' +
          '<button class="btn-gold btn-sm w-full text-xs mb-3" onclick="closePetDetail();showPetEquipManageModal(\'' + pet.id + '\')">🎽 管理装备</button>' +
          setHtml;
      })()}
      ${pet.aptitude ? `
      <h3 class="font-bold text-sm mb-2">📊 资质</h3>
      <div class="grid grid-cols-2 gap-2 mb-4 text-xs">
        ${APTITUDE_KEYS.map(k => {
          var val = pet.aptitude[k] || 1500;
          var dex = getPetDex(pet.name);
          var range = (dex.aptRange && dex.aptRange[k]) || [1000, 3000];
          var lo = range[0], hi = range[1];
          // 梦幻西游风格：以图鉴上限为基准，当前资质按百分比填充一根条
          // 满资质=100%；异化突破上限时显示满条+溢出标记
          var pct = Math.max(0, Math.min(100, Math.floor((val / hi) * 100)));
          var overflow = val > hi;
          var color = overflow ? '#ec4899' : pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : pct >= 40 ? '#3b82f6' : '#9ca3af';
          return '<div class="bg-panel rounded-lg p-2">' +
            '<div class="flex items-center justify-between mb-1">' +
              '<span class="text-secondary">' + k.replace('资质','') + '</span>' +
              '<span class="font-bold" style="color:' + color + '">' + val + (overflow ? ' ★' : '') + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-1">' +
              '<div class="flex-1 bg-gray-800 rounded h-2.5 overflow-hidden relative">' +
                '<div class="h-full rounded transition-all" style="width:' + pct + '%;background:linear-gradient(90deg,#3b82f6,' + color + ');"></div>' +
              '</div>' +
              '<span class="text-xs w-10 text-right" style="color:' + color + '">' + pct + '%</span>' +
            '</div>' +
            '<p class="text-secondary text-xs mt-0.5">图鉴 ' + lo + '-' + hi + '</p>' +
            '</div>';
        }).join('')}
      </div>
      ` : ''}
      ${(() => { const cb = getCharacterBonusForPet(); const hasBonus = Object.values(cb).some(v => v > 0); return hasBonus ? `
      <div class="bg-panel rounded-lg p-3 border border-yellow-600/50 mb-4">
        <p class="text-xs text-yellow-400 font-bold mb-1">✨ 人物加成（属性20%）</p>
        <div class="grid grid-cols-3 gap-1 text-xs">
          ${Object.entries(cb).filter(([k]) => ['力量','体质','敏捷','智力','气血'].includes(k)).map(([k,v]) => `<span class="text-green-400">${k} +${v}</span>`).join('')}
        </div>
      </div>
      ` : ''; })()}
      ${bloodline ? `
      <h3 class="font-bold text-sm mb-2">👑 血统技能</h3>
      <div class="mb-4">
        <div class="bg-panel rounded-lg p-3 border-2 ${bloodline.fromBloodlineOrb ? 'border-purple-500' : 'border-yellow-600'}" style="background:linear-gradient(135deg,${bloodline.fromBloodlineOrb ? 'rgba(168,85,247,0.08)' : 'rgba(234,179,8,0.08)'},${bloodline.fromBloodlineOrb ? 'rgba(168,85,247,0.02)' : 'rgba(234,179,8,0.02)'})">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="text-xs px-1.5 py-0.5 rounded ${bloodline.fromBloodlineOrb ? 'bg-purple-900 text-purple-300' : 'bg-yellow-900 text-yellow-300'} font-bold">${bloodline.fromBloodlineOrb ? '💎 植入' : '👑 血统'}</span>
            <span class="font-bold text-sm ${bloodline.fromBloodlineOrb ? 'text-purple-300' : 'text-yellow-400'}">${bloodline.name}</span>
            ${bloodline.fromBloodlineOrb && bloodline.quality ? (function() {
              var qc = (typeof BLOOD_ORB_QUALITY_COLORS !== 'undefined') ? (BLOOD_ORB_QUALITY_COLORS[bloodline.quality] || '#9ca3af') : '#9ca3af';
              var qn = (typeof BLOOD_ORB_QUALITY_NAMES !== 'undefined') ? (BLOOD_ORB_QUALITY_NAMES[bloodline.quality] || bloodline.quality) : bloodline.quality;
              return '<span class="text-xs px-1.5 py-0.5 rounded font-bold" style="background:' + qc + '22;color:' + qc + ';border:1px solid ' + qc + '66">' + qn + '</span>';
            })() : ''}
          </div>
          <p class="text-xs text-secondary">${bloodline.desc}</p>
          ${bloodline.fromBloodlineOrb && bloodline.sourcePetName ? '<p class="text-xs text-purple-400 mt-1">📦 来源：' + bloodline.sourcePetName + '</p>' : ''}
          ${(() => {
            // v2.2.0 需求2：血统植入功能等级锁定
            if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked('bloodline') && !bloodline.fromBloodlineOrb) {
              var blUnlockLv = getFeatureUnlockLevel('bloodline');
              return '<p class="text-xs text-red-400 mt-2">🔒 血统植入功能需 Lv.' + blUnlockLv + ' 解锁</p>';
            }
            return bloodline.fromBloodlineOrb ? '<button class="btn-danger text-xs mt-2" onclick="removePetBloodlineOrb(\'' + pet.id + '\')">取出血统珠</button>' : '<button class="btn-primary text-xs mt-2" onclick="showBloodOrbImplantModal(\'' + pet.id + '\')">💎 植入血统珠</button>';
          })()}
        </div>
      </div>
      ` : ''}
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold text-sm">📖 技能格 (${normalSkills.length}${normalSkills.length > maxSlots ? '/共' + normalSkills.length : '/' + maxSlots})</h3>
        ${(() => { const dew = G.inventory.find(i => i.id === 'moon_dew'); return dew && dew.count > 0 ? `<button class="btn-gold btn-sm text-xs" onclick="closePetDetail();showMoonDewModal('${pet.id}')">🌙 月华露</button>` : ''; })()}
      </div>
      ${(() => {
        // 技能分页：超过6个技能时分页展示（每页6个）
        const PER_PAGE = 6;
        const total = normalSkills.length;
        const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        if (!window._skillPage) window._skillPage = {};
        var page = window._skillPage[pet.id] || 0;
        if (page >= totalPages) page = totalPages - 1;
        if (page < 0) page = 0;
        const startIdx = page * PER_PAGE;
        const displayCount = Math.min(PER_PAGE, total);
        const slots = Math.max(displayCount, Math.min(maxSlots, PER_PAGE));
        const effSkills = getEffectiveSkills(pet);
        var cells = '';
        for (var i = 0; i < slots; i++) {
          var skillIdx = startIdx + i;
          var skill = normalSkills[skillIdx];
          if (skill) {
            const typeIcon = getSkillTypeIcon(skill.type);
            const tierLabel = skill.tier ? getSkillTierLabel(skill.tier) : '';
            const tierColor = skill.tier ? getSkillTierColor(skill.tier) : '#94a3b8';
            const typeBg = skill.type === 'active' ? 'bg-red-900 text-red-300' : skill.type === 'aura' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300';
            const isEff = effSkills.some(es => es.id === skill.id && es.isEffective);
            cells += `
            <div class="bg-panel rounded-lg p-2 border border-game ${!isEff ? 'opacity-50' : ''}">
              <div class="flex items-center gap-1 mb-1">
                <span class="text-xs px-1 py-0.5 rounded ${typeBg}">${typeIcon}</span>
                ${tierLabel ? `<span class="text-xs px-1 py-0.5 rounded font-bold" style="background:${tierColor}22;color:${tierColor}">${tierLabel}</span>` : ''}
                ${!isEff ? '<span class="text-xs px-1 py-0.5 rounded bg-gray-700 text-gray-400">未生效</span>' : ''}
              </div>
              <p class="font-bold text-xs">${skill.name}</p>
              <p class="text-xs text-secondary mt-0.5">${skill.desc}</p>
              <span class="text-xs ${skill.isInnate ? 'text-purple-400' : 'text-green-400'}">${skill.isInnate ? '天生' : '后天'}</span>
            </div>`;
          } else {
            cells += `
            <div class="bg-panel rounded-lg p-2 border border-dashed border-game flex flex-col items-center justify-center min-h-[80px] opacity-50">
              <span class="text-2xl text-secondary">+</span>
              <span class="text-xs text-secondary">未开启</span>
            </div>`;
          }
        }
        var pager = '';
        if (totalPages > 1) {
          pager = '<div class="flex items-center justify-between mt-2 mb-4">' +
            '<button class="btn-primary btn-sm text-xs" ' + (page > 0 ? '' : 'disabled style="opacity:0.4;cursor:not-allowed"') + ' onclick="window._skillPage[\'' + pet.id + '\']=' + Math.max(0, page - 1) + ';render()">◀ 上一页</button>' +
            '<span class="text-xs text-secondary">第 ' + (page + 1) + '/' + totalPages + ' 页</span>' +
            '<button class="btn-primary btn-sm text-xs" ' + (page < totalPages - 1 ? '' : 'disabled style="opacity:0.4;cursor:not-allowed"') + ' onclick="window._skillPage[\'' + pet.id + '\']=' + Math.min(totalPages - 1, page + 1) + ';render()">下一页 ▶</button>' +
          '</div>';
        } else {
          pager = '';
        }
        return '<div class="grid grid-cols-2 gap-2 mb-2">' + cells + '</div>' + pager;
      })()}
      ${books.length > 0 ? `
      <div class="mb-4">
        <h3 class="font-bold text-sm mb-2">📖 打书（选择技能书使用）</h3>
        <div class="flex flex-wrap gap-1 mb-2">
          <button class="text-xs px-2 py-1 rounded border ${(!window._skillBookFilter || window._skillBookFilter === 'all') ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='all';render()">全部</button>
          <button class="text-xs px-2 py-1 rounded border ${window._skillBookFilter === 'active' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='active';render()">⚔️ 主动</button>
          <button class="text-xs px-2 py-1 rounded border ${window._skillBookFilter === 'passive_t1' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='passive_t1';render()">🛡️ 初级被动</button>
          <button class="text-xs px-2 py-1 rounded border ${window._skillBookFilter === 'passive_t2' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='passive_t2';render()">🛡️ 高级被动</button>
          <button class="text-xs px-2 py-1 rounded border ${window._skillBookFilter === 'passive_t3' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='passive_t3';render()">🛡️ 超级被动</button>
          <button class="text-xs px-2 py-1 rounded border ${window._skillBookFilter === 'aura_t1' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='aura_t1';render()">✨ 初级光环</button>
          <button class="text-xs px-2 py-1 rounded border ${window._skillBookFilter === 'aura_t2' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='aura_t2';render()">✨ 高级光环</button>
          <button class="text-xs px-2 py-1 rounded border ${window._skillBookFilter === 'aura_t3' ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary'}" onclick="window._skillBookFilter='aura_t3';render()">✨ 超级光环</button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${books.filter(b => {
            if (!window._skillBookFilter || window._skillBookFilter === 'all') return true;
            const skill = getSkillById(b.id);
            if (!skill) return false;
            const f = window._skillBookFilter;
            if (f === 'active') return skill.type === 'active';
            if (f === 'passive_t1') return skill.type === 'passive' && skill.tier === 1;
            if (f === 'passive_t2') return skill.type === 'passive' && skill.tier === 2;
            if (f === 'passive_t3') return skill.type === 'passive' && skill.tier === 3;
            if (f === 'aura_t1') return skill.type === 'aura' && skill.tier === 1;
            if (f === 'aura_t2') return skill.type === 'aura' && skill.tier === 2;
            if (f === 'aura_t3') return skill.type === 'aura' && skill.tier === 3;
            return true;
          }).map(b => {
            const skill = getSkillById(b.id);
            const name = skill ? skill.name : b.id;
            const typeIcon = skill ? getSkillTypeIcon(skill.type) : '📖';
            const allSkills = getAllSkills(pet);
            const baseId = getSkillBaseId(b.id);
            const hasSame = allSkills.some(s => getSkillBaseId(s.id) === baseId);
            return `
            <button class="bg-panel border border-game rounded-lg p-2 text-left ${hasSame ? 'opacity-40 cursor-not-allowed' : 'hover:border-purple-500'}" ${hasSame ? 'disabled' : ''} onclick="useSkillBook('${pet.id}','${b.id}')">
              <span class="text-xs font-bold">${typeIcon} ${name}</span>
              <span class="text-xs text-secondary block">x${b.count} ${hasSame ? '(已有同名技能)' : ''}</span>
            </button>`;
          }).join('')}
        </div>
        <p class="text-xs text-secondary mt-1">打书消耗100金币手续费，可能开新格或顶掉已有技能</p>
      </div>
      ` : ''}
      ${(() => {
        var yuanxiaos = G.inventory.filter(function(i) { return i.id && i.id.indexOf('yuanxiao_') === 0 && i.count > 0; });
        if (yuanxiaos.length === 0) return '';
        return '<div class="mb-3"><h4 class="text-xs font-bold text-secondary mb-2">🍡 使用元宵提升资质</h4>' +
          '<div class="flex flex-wrap gap-1">' +
          yuanxiaos.map(function(y) {
            var def = SHOP_ITEMS.find(function(s) { return s.id === y.id; });
            var name = def ? def.name : y.id;
            return '<button class="btn-gold btn-sm text-xs" onclick="useYuanxiao(\'' + pet.id + '\',\'' + y.id + '\')">' + name + ' x' + y.count + '</button>';
          }).join('') +
          '</div></div>';
      })()}
      <div class="flex gap-2 flex-wrap">
        ${isInTeam ? `<button class="btn-danger flex-1" onclick="removeFromTeam(${G.player.activeTeam.indexOf(pet.id)});closePetDetail()">卸下</button>` : `<button class="btn-primary flex-1" onclick="quickAddToTeam('${pet.id}');closePetDetail()">上阵</button>`}
        <button class="btn-sm" style="background:#7c3aed;color:#fff" onclick="closePetDetail();window._evoSheet='rebirth';window._rebirthPetId='${pet.id}';window._rebirthPreview=null;navigateTo('fusion')">重置</button>
        <button class="btn-sm" style="background:#3b82f6;color:#fff" onclick="useRenameCard('${pet.id}')">✏️ 改名</button>
        <button class="btn-danger btn-sm" onclick="releasePet('${pet.id}');closePetDetail()">放生</button>
        <button class="btn-gold btn-sm" onclick="closePetDetail()">关闭</button>
      </div>
    </div>
  </div>`;
}

function renderShopScreen() {
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🛒 商城</h1>
      <div class="flex gap-3 text-sm">
        <span class="text-yellow-400">🪙 ${G.player.gold.toLocaleString()}</span>
        <span class="text-blue-400">💎 ${G.player.diamond.toLocaleString()}</span>
      </div>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">📦 道具与宠物蛋</h2>
        </div>
        ${(function() {
          // v2.2.0 需求5：商城分类重新梳理——8大分类，覆盖全部道具
          if (!window._shopItemFilter) window._shopItemFilter = 'all';
          var filters = [
            { id: 'all', label: '全部', icon: '📋' },
            { id: 'ticket', label: '副本门票', icon: '🎫' },
            { id: 'forge', label: '强化锻造', icon: '🔩' },
            { id: 'pet', label: '宠物培养', icon: '🐾' },
            { id: 'exp', label: '经验增益', icon: '📕' },
            { id: 'gem', label: '宝石', icon: '💎' },
            { id: 'gold', label: '金币箱', icon: '📦' },
            { id: 'other', label: '其他', icon: '🧰' },
          ];
          return '<div class="flex flex-wrap gap-1 mb-3">' + filters.map(function(f) {
            var active = (window._shopItemFilter || 'all') === f.id;
            return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + '" onclick="window._shopItemFilter=\'' + f.id + '\';resetPage(\'shop\');renderShopOnly()">' + f.icon + ' ' + f.label + '</button>';
          }).join('') + '</div>';
        })()}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          ${(function() {
            // v2.2.0 需求5：按新分类筛选道具
            var filter = window._shopItemFilter || 'all';
            // 定义各分类的道具ID集合
            var ticketIds = ['exp_ticket','gold_ticket','egg_ticket','forge_ticket','map_ticket','gem_ticket','blood_dungeon_ticket'];
            var forgeIds = ['forge_stone_low','forge_stone_mid','forge_stone_high','protection_stone','socket_nail','repair_glue','refine_stone'];
            var petIds = ['hatch_boost','hatch_stone','fusion_stone','moon_dew','rare_egg','yuanxiao_str','yuanxiao_con','yuanxiao_agi','yuanxiao_int','guiyuan_pill','guixu_pill','advance_pill_low','advance_pill_mid','advance_pill_high'];
            var expIds = ['exp_book','exp_book_mid','exp_book_high','exp_book_bulk','exp_card_2x','exp_card_5x','exp_card_10x','gold_card_2x','gold_card_5x','gold_card_10x','lucky_charm'];
            var goldIds = ['gold_chest_s','gold_chest_m','gold_chest_l'];
            var filteredItems = SHOP_ITEMS.filter(function(item) {
              if (filter === 'all') return true;
              if (filter === 'ticket') return ticketIds.indexOf(item.id) >= 0;
              if (filter === 'forge') return forgeIds.indexOf(item.id) >= 0;
              if (filter === 'pet') return petIds.indexOf(item.id) >= 0;
              if (filter === 'exp') return expIds.indexOf(item.id) >= 0;
              if (filter === 'gem') return item.action === 'gem' || item.id.indexOf('gem_') === 0;
              if (filter === 'gold') return goldIds.indexOf(item.id) >= 0;
              if (filter === 'other') {
                // 其他：不属于以上任何分类的道具
                return ticketIds.indexOf(item.id) < 0 && forgeIds.indexOf(item.id) < 0 && petIds.indexOf(item.id) < 0 && expIds.indexOf(item.id) < 0 && goldIds.indexOf(item.id) < 0 && !(item.action === 'gem' || item.id.indexOf('gem_') === 0);
              }
              return true;
            });
            var pager = paginateList('shop', filteredItems.length, 12);
            var start = (pager.page - 1) * pager.pageSize;
            var pageItems = filteredItems.slice(start, start + pager.pageSize);
            if (pageItems.length === 0) return '<p class="text-secondary col-span-full text-center py-8">该分类下暂无道具</p>';
            return pageItems.map(item => {
              const qty = getShopQty(item.id);
              const totalPrice = item.price * qty;
              const isDiamond = item.currency === 'diamond';
              const canAfford = isDiamond ? G.player.diamond >= totalPrice : G.player.gold >= totalPrice;
              const currencyIcon = isDiamond ? '💎' : '🪙';
              return `
              <div class="bg-panel border border-game rounded-xl p-4 text-center flex flex-col">
                <div class="text-4xl mb-2">${item.icon}</div>
                <p class="font-bold text-sm mb-1">${item.name}</p>
                <p class="text-xs text-secondary mb-2 flex-1">${item.desc}</p>
                <p class="text-xs ${isDiamond ? 'text-blue-400' : 'text-secondary'}">单价 ${currencyIcon} ${item.price.toLocaleString()}</p>
                <div class="flex items-center justify-center gap-2 my-2">
                  <button class="w-7 h-7 rounded border border-game text-sm flex items-center justify-center hover:border-purple-500" onclick="event.stopPropagation();setShopQty('${item.id}',getShopQty('${item.id}')-1);renderShopOnly()">−</button>
                  <span class="w-10 text-center font-bold text-sm">${qty}</span>
                  <button class="w-7 h-7 rounded border border-game text-sm flex items-center justify-center hover:border-purple-500" onclick="event.stopPropagation();setShopQty('${item.id}',getShopQty('${item.id}')+1);renderShopOnly()">+</button>
                </div>
                <p class="${isDiamond ? 'text-blue-400' : 'text-gold'} font-bold text-sm mb-2">总价 ${currencyIcon} ${totalPrice.toLocaleString()}</p>
                <button class="${canAfford ? (isDiamond ? 'btn-primary' : 'btn-gold') : 'btn-primary'} btn-sm w-full" ${!canAfford ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}
                  onclick="buyShopItem('${item.id}', ${item.price}, '${item.action}', ${item.tier || 0}, '${item.currency || 'gold'}')">
                  ${canAfford ? '购买' : (isDiamond ? '钻石不足' : '金币不足')}
                </button>
              </div>`;
            }).join('') + pager.controlsHtml;
          })()}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">📖 技能书商店</h2>
        <div class="flex gap-2 mb-3 flex-wrap" id="skillBookTabs">
          <button class="text-xs px-3 py-1 rounded border border-game bg-purple-900 text-purple-300 font-bold" onclick="switchSkillBookTab('active')">⚔️ 主动技能</button>
          <button class="text-xs px-3 py-1 rounded border border-game text-secondary" onclick="switchSkillBookTab('passive_t1')">🛡️ 初级被动</button>
          <button class="text-xs px-3 py-1 rounded border border-game text-secondary" onclick="switchSkillBookTab('passive_t2')">🛡️ 高级被动</button>
          <button class="text-xs px-3 py-1 rounded border border-game text-secondary" onclick="switchSkillBookTab('passive_t3')">🛡️ 超级被动</button>
          <button class="text-xs px-3 py-1 rounded border border-game text-secondary" onclick="switchSkillBookTab('aura_t1')">✨ 初级光环</button>
          <button class="text-xs px-3 py-1 rounded border border-game text-secondary" onclick="switchSkillBookTab('aura_t2')">✨ 高级光环</button>
          <button class="text-xs px-3 py-1 rounded border border-game text-secondary" onclick="switchSkillBookTab('aura_t3')">✨ 超级光环</button>
        </div>
        <div id="skillBookGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          ${renderSkillBookCards('active')}
        </div>
      </div>
    </main>
  </div>`;
}

// ==================== PET POOL SYSTEM ====================

const PET_POOL_CONFIG = {
  normal: { name: '普通池', desc: '品质和种族完全随机', price: 2000, icon: '🎲', currency: 'gold' },
  slime: { name: '史莱姆池', desc: '只出史莱姆种族', price: 3000, icon: '🟦', currency: 'gold', race: '史莱姆' },
  dragon: { name: '龙池', desc: '只出龙种族', price: 4000, icon: '🐲', currency: 'gold', race: '龙' },
  demon: { name: '恶魔池', desc: '只出恶魔种族', price: 3500, icon: '😈', currency: 'gold', race: '恶魔' },
  angel: { name: '天使池', desc: '只出天使种族', price: 3500, icon: '😇', currency: 'gold', race: '天使' },
  goblin: { name: '哥布林池', desc: '只出哥布林种族', price: 3000, icon: '👺', currency: 'gold', race: '哥布林' },
  elf: { name: '精灵池', desc: '只出精灵种族', price: 3500, icon: '🧝', currency: 'gold', race: '精灵' },
};

// 记录抽奖历史（最多保留200条）
function recordLotteryHistory(poolName, isTen, eggs) {
  if (!G.lotteryHistory) G.lotteryHistory = [];
  var items = eggs.map(function(egg) {
    return {
      tier: egg.tier,
      rarityIdx: RARITIES.indexOf(egg.petData.rarity),
      race: egg.petData.race || '未知',
    };
  });
  G.lotteryHistory.unshift({
    time: Date.now(),
    poolName: poolName,
    isTen: isTen,
    items: items,
  });
  // 超过200条删除最早的
  if (G.lotteryHistory.length > 200) G.lotteryHistory = G.lotteryHistory.slice(0, 200);
}

function generateEggFromPool(poolType) {
  var config = PET_POOL_CONFIG[poolType];
  if (!config) return null;
  // T级按概率抽取：T越高越稀有（最高T5，无T6）
  // T1=45%, T2=28%, T3=15%, T4=8%, T5=4%
  var tierRoll = Math.random();
  var targetTier; // 1-5 (getPetTier 返回值)
  if (tierRoll < 0.45) targetTier = 1;       // T1 45%
  else if (tierRoll < 0.73) targetTier = 2;  // T2 28%
  else if (tierRoll < 0.88) targetTier = 3;  // T3 15%
  else if (tierRoll < 0.96) targetTier = 4;  // T4 8%
  else targetTier = 5;                        // T5 4%
  // 从对应T级别的宠物名字中筛选
  var candidates = PET_NAMES.filter(function(name) {
    return getPetTier(name) === targetTier;
  });
  // 种族池筛选
  if (config.race && candidates.length > 0) {
    var raceFiltered = candidates.filter(function(name) {
      return getPetDex(name).race === config.race;
    });
    if (raceFiltered.length > 0) candidates = raceFiltered;
  }
  if (candidates.length === 0) candidates = PET_NAMES.slice();
  var chosenName = pickRandom(candidates);
  // 生成宠物基础数据，使用选定的名字，抽蛋池品质下限统一提高15%
  var pet = generatePetBase(chosenName, 0.15);
  // 品质随机：由 generatePetBase 基于成长/资质正常生成，不强制覆盖
  return {
    id: 'egg_' + Date.now() + '_' + randomInt(1000, 9999),
    petData: pet, tier: targetTier - 1, appraisalLevel: 0,
    revealed: { skills: false, growth: false, aptitude: false },
    // 孵化时间按T级递增：T1=30-120s, T2=×15, T3=×50, T4=×210, T5=×405
    hatchTime: randomInt(30, 120) * ([1, 15, 50, 210, 405][targetTier - 1] || 1), hatchProgress: 0,
    isHatching: false, hatchInterval: null,
    poolType: poolType,
  };
}

function drawFromPool(poolType) {
  var config = PET_POOL_CONFIG[poolType];
  if (!config) return;
  if (config.currency === 'diamond') {
    if (G.player.diamond < config.price) { showToast('钻石不足！', 'error'); return; }
    G.player.diamond -= config.price;
  } else {
    if (G.player.gold < config.price) { showToast('金币不足！', 'error'); return; }
    G.player.gold -= config.price;
  }
  var egg = generateEggFromPool(poolType);
  G.eggs.push(egg);
  updateAchievement('pool_draw', 1);
  updateDailyTask('draw_10', 1);
  // 记录抽奖历史
  recordLotteryHistory(config.name, false, [egg]);
  saveGame();
  render();
  var rarityIdx = RARITIES.indexOf(egg.petData.rarity);
  var raceName = egg.petData.race || '未知种族';
  showDrawResultModal({
    icon: '🥚',
    name: 'T' + (egg.tier + 1) + ' ' + raceName + ' 蛋',
    sub: config.name + ' · ' + RARITY_NAMES[rarityIdx],
    tierIdx: rarityIdx,
    type: 'pet',
  });
  // 高价值物品额外提示（按品质判断，非T级）
  if (rarityIdx >= 4) addBattleLog('loot', '🎉 ' + config.name + '抽到 ' + RARITY_NAMES[rarityIdx] + ' T' + (egg.tier+1) + ' ' + raceName + ' 蛋！');
}

// ===== 十连抽（9折） =====
function drawFromPoolTen(poolType) {
  var config = PET_POOL_CONFIG[poolType];
  if (!config) return;
  var totalCost = Math.floor(config.price * 10 * 0.9); // 十连9折
  if (config.currency === 'diamond') {
    if (G.player.diamond < totalCost) { showToast('钻石不足！十连需 💎' + totalCost, 'error'); return; }
    G.player.diamond -= totalCost;
  } else {
    if (G.player.gold < totalCost) { showToast('金币不足！十连需 🪙' + totalCost, 'error'); return; }
    G.player.gold -= totalCost;
  }
  var results = [];
  for (var i = 0; i < 10; i++) {
    var egg = generateEggFromPool(poolType);
    G.eggs.push(egg);
    results.push(egg);
  }
  updateAchievement('pool_draw', 10);
  updateDailyTask('draw_10', 10);
  // 记录抽奖历史
  recordLotteryHistory(config.name, true, results);
  saveGame();
  render();
  // 开卡包式展示
  showDrawResultModalTen(results, config);
  // 高价值日志（按品质判断，非T级）
  results.forEach(function(egg) {
    var rarityIdx = RARITIES.indexOf(egg.petData.rarity);
    if (rarityIdx >= 4) {
      addBattleLog('loot', '🎉 十连抽到 ' + RARITY_NAMES[rarityIdx] + ' T' + (egg.tier+1) + ' ' + (egg.petData.race || '未知') + ' 蛋！');
    }
  });
}

// 十连抽开卡包式展示
function showDrawResultModalTen(results, config) {
  var cellsHtml = results.map(function(egg, idx) {
    var rarityIdx = RARITIES.indexOf(egg.petData.rarity);
    var color = RARITY_COLORS[rarityIdx] || '#9ca3af';
    var rarityName = RARITY_NAMES[rarityIdx] || '普通';
    var raceName = egg.petData.race || '未知';
    var delay = (idx * 0.08).toFixed(2);
    return '<div class="ten-pack-cell" style="border-color:' + color + ';background:' + color + '1a;animation-delay:' + delay + 's;">' +
      '<span class="tp-icon">🥚</span>' +
      '<span class="tp-name" style="color:' + color + ';">T' + (egg.tier+1) + ' ' + raceName + '</span>' +
      '<span class="tp-tag" style="background:' + color + '33;color:' + color + ';">' + rarityName + '</span>' +
      '</div>';
  }).join('');
  // 统计最高品质（稀有度），用于决定特效
  var maxRarity = 0;
  results.forEach(function(e){ var r = RARITIES.indexOf(e.petData.rarity); if (r > maxRarity) maxRarity = r; });
  var isTopValue = maxRarity >= 4;
  var titleColor = RARITY_COLORS[maxRarity] || '#9ca3af';
  var titleText = maxRarity >= 6 ? '🌈 十连特殊降世 🌈' : maxRarity >= 5 ? '🌟 十连神话降世 🌟' : maxRarity >= 4 ? '✨ 十连传说现世 ✨' : maxRarity >= 3 ? '💎 十连史诗 💎' : '🎲 十连抽蛋结果';
  var flashHtml = isTopValue ? '<div style="position:absolute;inset:0;background:' + titleColor + ';opacity:0;animation:screenFlash 0.8s ease-out forwards;pointer-events:none;z-index:60;"></div>' : '';

  // 结果汇总统计：各品质数量 + 各T级数量
  var rarityCounts = {};
  var tierCounts = {};
  results.forEach(function(egg) {
    var rIdx = RARITIES.indexOf(egg.petData.rarity);
    rarityCounts[rIdx] = (rarityCounts[rIdx] || 0) + 1;
    var tIdx = egg.tier;
    tierCounts[tIdx] = (tierCounts[tIdx] || 0) + 1;
  });
  var rarityStatHtml = RARITIES.map(function(r, i) {
    if (!rarityCounts[i]) return '';
    var color = RARITY_COLORS[i] || '#9ca3af';
    return '<span style="color:' + color + ';">' + RARITY_NAMES[i] + '×' + rarityCounts[i] + '</span>';
  }).filter(Boolean).join(' · ');
  var tierStatHtml = [0,1,2,3,4,5].map(function(t) {
    if (!tierCounts[t]) return '';
    return '<span class="text-secondary">T' + (t+1) + '×' + tierCounts[t] + '</span>';
  }).filter(Boolean).join(' · ');

  var html = '<div id="drawResultOverlay" class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onclick="closeDrawResultModal()">' +
    flashHtml +
    '<div class="bg-card border-2 rounded-2xl p-5 max-w-lg w-full relative" style="border-color:' + titleColor + ';" onclick="event.stopPropagation()">' +
      '<div class="text-center mb-3">' +
        '<h2 class="font-fantasy text-xl font-bold" style="color:' + titleColor + ';">' + titleText + '</h2>' +
        '<p class="text-xs text-secondary mt-1">' + (config ? config.name : '') + ' · 十连抽（9折）</p>' +
      '</div>' +
      '<div class="ten-pack-grid">' + cellsHtml + '</div>' +
      '<div class="mt-3 pt-3 border-t border-game space-y-1 text-xs">' +
        '<div class="flex flex-wrap gap-1 items-center"><span class="text-secondary">品质：</span>' + rarityStatHtml + '</div>' +
        '<div class="flex flex-wrap gap-1 items-center"><span class="text-secondary">T级：</span>' + tierStatHtml + '</div>' +
      '</div>' +
      '<button class="btn-gold w-full mt-4" onclick="closeDrawResultModal()">确定</button>' +
    '</div>' +
    '</div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
  // 自动消失
  var autoCloseMs = maxRarity >= 5 ? 8000 : maxRarity >= 4 ? 7000 : 6000;
  clearTimeout(window._drawResultTimer);
  window._drawResultTimer = setTimeout(function() { closeDrawResultModal(); }, autoCloseMs);
}

function renderPoolScreen() {
  // 抽奖历史统计
  var history = G.lotteryHistory || [];
  var totalDraws = history.length;
  var totalPets = 0;
  var rarityTotal = [0,0,0,0,0,0,0];
  history.forEach(function(rec) {
    rec.items.forEach(function(it) {
      totalPets++;
      if (it.rarityIdx >= 0 && it.rarityIdx < 7) rarityTotal[it.rarityIdx]++;
    });
  });
  var rarityStatHtml = RARITIES.map(function(r, i) {
    if (rarityTotal[i] === 0) return '';
    var color = RARITY_COLORS[i] || '#9ca3af';
    return '<span style="color:' + color + ';">' + RARITY_NAMES[i] + '×' + rarityTotal[i] + '</span>';
  }).filter(Boolean).join(' · ');
  // 最近20条记录
  var recent = history.slice(0, 20);
  var recentHtml = recent.map(function(rec) {
    var date = new Date(rec.time);
    var timeStr = (date.getMonth()+1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0');
    var itemsHtml = rec.items.map(function(it) {
      var color = RARITY_COLORS[it.rarityIdx] || '#9ca3af';
      return '<span style="color:' + color + ';">T' + (it.tier+1) + ' ' + RARITY_NAMES[it.rarityIdx] + ' ' + it.race + '</span>';
    }).join(' · ');
    return '<div class="flex items-start gap-2 py-1 border-b border-game/50 text-xs">' +
      '<span class="text-secondary whitespace-nowrap">' + timeStr + '</span>' +
      '<span class="text-secondary whitespace-nowrap">[' + (rec.isTen ? '十连' : '单抽') + ']</span>' +
      '<span class="text-secondary whitespace-nowrap">' + rec.poolName + '</span>' +
      '<span class="flex-1 break-all">' + itemsHtml + '</span>' +
      '</div>';
  }).join('');
  if (recent.length === 0) recentHtml = '<p class="text-xs text-secondary text-center py-4">暂无抽奖记录</p>';

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🎰 宠物池</h1>
      <div class="flex gap-3 text-sm">
        <span class="text-yellow-400">🪙 ${G.player.gold.toLocaleString()}</span>
        <span class="text-blue-400">💎 ${G.player.diamond.toLocaleString()}</span>
      </div>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🎲 抽蛋池</h2>
        <p class="text-xs text-secondary mb-3">选择池子抽取宠物蛋，种族池只会产出对应种族的宠物蛋</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${Object.entries(PET_POOL_CONFIG).map(([key, cfg]) => {
            var canAfford = cfg.currency === 'diamond' ? G.player.diamond >= cfg.price : G.player.gold >= cfg.price;
            var currencyIcon = cfg.currency === 'diamond' ? '💎' : '🪙';
            var tenCost = Math.floor(cfg.price * 10 * 0.9);
            var canAffordTen = cfg.currency === 'diamond' ? G.player.diamond >= tenCost : G.player.gold >= tenCost;
            return '<div class="bg-panel border border-game rounded-xl p-4 text-center flex flex-col">' +
              '<div class="text-4xl mb-2">' + cfg.icon + '</div>' +
              '<p class="font-bold text-sm mb-1">' + cfg.name + '</p>' +
              '<p class="text-xs text-secondary mb-2 flex-1">' + cfg.desc + '</p>' +
              '<p class="' + (cfg.currency === 'diamond' ? 'text-blue-400' : 'text-gold') + ' font-bold text-sm mb-2">' + currencyIcon + ' ' + cfg.price.toLocaleString() + '</p>' +
              '<div class="flex gap-1 mb-1">' +
              '<button class="' + (canAfford ? 'btn-gold' : 'btn-primary') + ' btn-sm flex-1 text-xs" ' + (!canAfford ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') +
              ' onclick="drawFromPool(\'' + key + '\')">单抽</button>' +
              '<button class="' + (canAffordTen ? 'btn-gold' : 'btn-primary') + ' btn-sm flex-1 text-xs" ' + (!canAffordTen ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') +
              ' onclick="drawFromPoolTen(\'' + key + '\')">十连(' + currencyIcon + tenCost.toLocaleString() + ')</button>' +
              '</div>' +
              '</div>';
          }).join('')}
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-sm mb-2">📊 抽蛋概率</h2>
        <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          <div class="bg-panel rounded p-2"><p class="text-gray-300">T1</p><p class="font-bold">45%</p></div>
          <div class="bg-panel rounded p-2"><p class="text-green-400">T2</p><p class="font-bold">28%</p></div>
          <div class="bg-panel rounded p-2"><p class="text-blue-400">T3</p><p class="font-bold">15%</p></div>
          <div class="bg-panel rounded p-2"><p class="text-purple-400">T4</p><p class="font-bold">8%</p></div>
          <div class="bg-panel rounded p-2"><p class="text-orange-400">T5</p><p class="font-bold">4%</p></div>
        </div>
        <p class="text-xs text-secondary mt-2">T级越高越稀有，品质随机由成长/资质决定（异化概率1.5%）。种族池只会影响产出的宠物种族</p>
      </div>
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-sm mb-2">📋 抽奖记录 <span class="text-xs text-secondary font-normal">（共 ${totalDraws} 次抽奖，${totalPets} 只宠物）</span></h2>
        ${totalPets > 0 ? '<div class="flex flex-wrap gap-1 mb-3 text-xs"><span class="text-secondary">品质总计：</span>' + rarityStatHtml + '</div>' : ''}
        <div class="max-h-64 overflow-y-auto">
          ${recentHtml}
        </div>
      </div>
    </main>
  </div>`;
}

// ==================== 统一抽奖系统（宠物池+技能池合并） ====================

const SKILL_POOL_CONFIG = {
  skill_normal: { name: '普通技能池', desc: '随机技能类型，普通85%/高级10%/超级5%', price: 50, icon: '🎲', currency: 'diamond', type: 'all' },
  skill_active: { name: '主动技能池', desc: '只出主动技能，普通85%/高级10%/超级5%', price: 45, icon: '⚔️', currency: 'diamond', type: 'active' },
  skill_passive: { name: '被动技能池', desc: '只出被动技能，普通85%/高级10%/超级5%', price: 35, icon: '🛡️', currency: 'diamond', type: 'passive' },
  skill_aura: { name: '光环技能池', desc: '只出光环技能，普通85%/高级10%/超级5%', price: 55, icon: '✨', currency: 'diamond', type: 'aura' },
};

function drawFromSkillPool(poolType) {
  var cfg = SKILL_POOL_CONFIG[poolType];
  if (!cfg) return;
  if (G.player.diamond < cfg.price) { showToast('钻石不足！', 'error'); return; }
  G.player.diamond -= cfg.price;
  // 按类型筛选技能（不含血统）
  var pool = ALL_SKILLS.filter(function(s){ return s.type !== 'bloodline'; });
  if (cfg.type !== 'all') pool = pool.filter(function(s){ return s.type === cfg.type; });
  if (pool.length === 0) { showToast('池中暂无技能！', 'error'); return; }
  // 按tier分组：普通(t1)/高级(t2)/超级(t3)
  var tier1 = pool.filter(function(s){ return getSkillTier(s.id) === 1; });
  var tier2 = pool.filter(function(s){ return getSkillTier(s.id) === 2; });
  var tier3 = pool.filter(function(s){ return getSkillTier(s.id) === 3; });
  // 概率：普通技能85%，高级技能10%，超级技能5%
  var roll = Math.random();
  var chosenTier = roll < 0.85 ? 1 : (roll < 0.95 ? 2 : 3);
  var pickFrom = chosenTier === 3 ? tier3 : (chosenTier === 2 ? tier2 : tier1);
  // 若所选tier无技能，降级回退到非空tier
  if (pickFrom.length === 0) {
    pickFrom = tier1.length > 0 ? tier1 : (tier2.length > 0 ? tier2 : tier3);
  }
  var skill = pickRandom(pickFrom);
  var existing = G.skillBooks.find(function(b){ return b.id === skill.id; });
  if (existing) existing.count++;
  else G.skillBooks.push({ id: skill.id, count: 1 });
  saveGame();
  render();
  var skillTier = getSkillTier(skill.id);
  var tierLabel = getSkillTierLabel(skillTier);
  // 技能tier映射到稀有度展示：t1→优秀(1) t2→史诗(3) t3→传说(4)
  var skillTierIdx = skillTier === 3 ? 4 : skillTier === 2 ? 3 : 1;
  showDrawResultModal({
    icon: getSkillTypeIcon(skill.type),
    name: skill.name,
    sub: cfg.name + ' · ' + getSkillTypeLabel(skill.type) + ' · ' + tierLabel,
    tierIdx: skillTierIdx,
    type: 'skill',
  });
  // 高级技能额外记录日志
  if (skillTier >= 2) addBattleLog('loot', '📖 ' + cfg.name + '抽到 ' + tierLabel + getSkillTypeLabel(skill.type) + '「' + skill.name + '」！');
}

// 技能池十连抽（9折）
function drawFromSkillPoolTen(poolType) {
  var cfg = SKILL_POOL_CONFIG[poolType];
  if (!cfg) return;
  var totalCost = Math.floor(cfg.price * 10 * 0.9);
  if (G.player.diamond < totalCost) { showToast('钻石不足！十连需 💎' + totalCost, 'error'); return; }
  G.player.diamond -= totalCost;
  // 筛选技能池
  var pool = ALL_SKILLS.filter(function(s){ return s.type !== 'bloodline'; });
  if (cfg.type !== 'all') pool = pool.filter(function(s){ return s.type === cfg.type; });
  if (pool.length === 0) { showToast('池中暂无技能！', 'error'); return; }
  var tier1 = pool.filter(function(s){ return getSkillTier(s.id) === 1; });
  var tier2 = pool.filter(function(s){ return getSkillTier(s.id) === 2; });
  var tier3 = pool.filter(function(s){ return getSkillTier(s.id) === 3; });
  var results = [];
  for (var i = 0; i < 10; i++) {
    var roll = Math.random();
    var chosenTier = roll < 0.85 ? 1 : (roll < 0.95 ? 2 : 3);
    var pickFrom = chosenTier === 3 ? tier3 : (chosenTier === 2 ? tier2 : tier1);
    if (pickFrom.length === 0) pickFrom = tier1.length > 0 ? tier1 : (tier2.length > 0 ? tier2 : tier3);
    var skill = pickRandom(pickFrom);
    var existing = G.skillBooks.find(function(b){ return b.id === skill.id; });
    if (existing) existing.count++;
    else G.skillBooks.push({ id: skill.id, count: 1 });
    results.push(skill);
  }
  saveGame();
  render();
  showSkillDrawResultModalTen(results, cfg);
  // 高价值日志
  results.forEach(function(sk) {
    var t = getSkillTier(sk.id);
    if (t >= 2) addBattleLog('loot', '📖 ' + cfg.name + '十连抽到 ' + getSkillTierLabel(t) + getSkillTypeLabel(sk.type) + '「' + sk.name + '」！');
  });
}

// 技能书十连抽开卡包式展示
function showSkillDrawResultModalTen(results, config) {
  var cellsHtml = results.map(function(sk, idx) {
    var t = getSkillTier(sk.id);
    var color = getSkillTierColor(t);
    var tierLabel = getSkillTierLabel(t);
    var typeLabel = getSkillTypeLabel(sk.type);
    var delay = (idx * 0.08).toFixed(2);
    var icon = getSkillTypeIcon(sk.type);
    return '<div class="ten-pack-cell" style="border-color:' + color + ';background:' + color + '1a;animation-delay:' + delay + 's;">' +
      '<span class="tp-icon">' + icon + '</span>' +
      '<span class="tp-name" style="color:' + color + ';">' + sk.name + '</span>' +
      '<span class="tp-tag" style="background:' + color + '33;color:' + color + ';">' + tierLabel + ' ' + typeLabel + '</span>' +
      '</div>';
  }).join('');
  // 统计最高tier
  var maxTier = 1;
  var tierCounts = { 1: 0, 2: 0, 3: 0 };
  results.forEach(function(sk) {
    var t = getSkillTier(sk.id);
    if (t > maxTier) maxTier = t;
    tierCounts[t] = (tierCounts[t] || 0) + 1;
  });
  var titleColor = getSkillTierColor(maxTier);
  var titleText = maxTier >= 3 ? '🌟 十连超级技能降世 🌟' : maxTier >= 2 ? '✨ 十连高级技能现世 ✨' : '📖 十连抽技能结果';
  var tierStatHtml = [1,2,3].map(function(t) {
    if (!tierCounts[t]) return '';
    return '<span style="color:' + getSkillTierColor(t) + ';">' + getSkillTierLabel(t) + '×' + tierCounts[t] + '</span>';
  }).filter(Boolean).join(' · ');

  var html = '<div id="drawResultOverlay" class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onclick="closeDrawResultModal()">' +
    '<div class="bg-card border-2 rounded-2xl p-5 max-w-lg w-full relative" style="border-color:' + titleColor + ';" onclick="event.stopPropagation()">' +
      '<div class="text-center mb-3">' +
        '<h2 class="font-fantasy text-xl font-bold" style="color:' + titleColor + ';">' + titleText + '</h2>' +
        '<p class="text-xs text-secondary mt-1">' + (config ? config.name : '') + ' · 十连抽（9折）</p>' +
      '</div>' +
      '<div class="ten-pack-grid">' + cellsHtml + '</div>' +
      '<div class="mt-3 pt-3 border-t border-game space-y-1 text-xs">' +
        '<div class="flex flex-wrap gap-1 items-center"><span class="text-secondary">品阶：</span>' + tierStatHtml + '</div>' +
      '</div>' +
      '<button class="btn-gold w-full mt-4" onclick="closeDrawResultModal()">确定</button>' +
    '</div>' +
    '</div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
  clearTimeout(window._drawResultTimer);
  window._drawResultTimer = setTimeout(function() { closeDrawResultModal(); }, 6000);
}

function renderLotteryScreen() {
  var sheet = window._lotterySheet || 'pet';
  var sheetTabs = [
    { id: 'pet', label: '宠物池', icon: '🥚' },
    { id: 'skill', label: '技能池', icon: '📖' },
  ];
  var tabsHtml = sheetTabs.map(function(t) {
    var active = sheet === t.id;
    return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + '" onclick="window._lotterySheet=\'' + t.id + '\';render()">' + t.icon + ' ' + t.label + '</button>';
  }).join('');

  var contentHtml = '';
  if (sheet === 'pet') {
    // 抽奖历史统计
    var history = G.lotteryHistory || [];
    var totalDraws = history.length;
    var totalPets = 0;
    var rarityTotal = [0,0,0,0,0,0,0];
    history.forEach(function(rec) {
      rec.items.forEach(function(it) {
        totalPets++;
        if (it.rarityIdx >= 0 && it.rarityIdx < 7) rarityTotal[it.rarityIdx]++;
      });
    });
    var rarityStatHtml = RARITIES.map(function(r, i) {
      if (rarityTotal[i] === 0) return '';
      var color = RARITY_COLORS[i] || '#9ca3af';
      return '<span style="color:' + color + ';">' + RARITY_NAMES[i] + '×' + rarityTotal[i] + '</span>';
    }).filter(Boolean).join(' · ');
    var recent = history.slice(0, 20);
    var recentHtml = recent.map(function(rec) {
      var date = new Date(rec.time);
      var timeStr = (date.getMonth()+1) + '/' + date.getDate() + ' ' + String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0');
      var itemsHtml = rec.items.map(function(it) {
        var color = RARITY_COLORS[it.rarityIdx] || '#9ca3af';
        return '<span style="color:' + color + ';">T' + (it.tier+1) + ' ' + RARITY_NAMES[it.rarityIdx] + ' ' + it.race + '</span>';
      }).join(' · ');
      return '<div class="flex items-start gap-2 py-1 border-b border-game/50 text-xs">' +
        '<span class="text-secondary whitespace-nowrap">' + timeStr + '</span>' +
        '<span class="text-secondary whitespace-nowrap">[' + (rec.isTen ? '十连' : '单抽') + ']</span>' +
        '<span class="text-secondary whitespace-nowrap">' + rec.poolName + '</span>' +
        '<span class="flex-1 break-all">' + itemsHtml + '</span>' +
        '</div>';
    }).join('');
    if (recent.length === 0) recentHtml = '<p class="text-xs text-secondary text-center py-4">暂无抽奖记录</p>';

    contentHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">🎲 抽蛋池</h2>' +
      '<p class="text-xs text-secondary mb-3">选择池子抽取宠物蛋，种族池只会产出对应种族的宠物蛋</p>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">' +
      Object.entries(PET_POOL_CONFIG).map(function(entry) {
        var key = entry[0], cfg = entry[1];
        var canAfford = cfg.currency === 'diamond' ? G.player.diamond >= cfg.price : G.player.gold >= cfg.price;
        var currencyIcon = cfg.currency === 'diamond' ? '💎' : '🪙';
        var tenCost = Math.floor(cfg.price * 10 * 0.9);
        var canAffordTen = cfg.currency === 'diamond' ? G.player.diamond >= tenCost : G.player.gold >= tenCost;
        return '<div class="bg-panel border border-game rounded-xl p-4 text-center flex flex-col">' +
          '<div class="text-4xl mb-2">' + cfg.icon + '</div>' +
          '<p class="font-bold text-sm mb-1">' + cfg.name + '</p>' +
          '<p class="text-xs text-secondary mb-2 flex-1">' + cfg.desc + '</p>' +
          '<p class="' + (cfg.currency === 'diamond' ? 'text-blue-400' : 'text-gold') + ' font-bold text-sm mb-2">' + currencyIcon + ' ' + cfg.price.toLocaleString() + '</p>' +
          '<div class="flex gap-1 mb-1">' +
          '<button class="' + (canAfford ? 'btn-gold' : 'btn-primary') + ' btn-sm flex-1 text-xs" ' + (!canAfford ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') +
          ' onclick="drawFromPool(\'' + key + '\')">单抽</button>' +
          '<button class="' + (canAffordTen ? 'btn-gold' : 'btn-primary') + ' btn-sm flex-1 text-xs" ' + (!canAffordTen ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') +
          ' onclick="drawFromPoolTen(\'' + key + '\')">十连(' + currencyIcon + tenCost.toLocaleString() + ')</button>' +
          '</div>' +
          '</div>';
      }).join('') +
      '</div></div>' +
      '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-sm mb-2">📊 抽蛋概率</h2>' +
      '<div class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">' +
      '<div class="bg-panel rounded p-2"><p class="text-gray-300">T1</p><p class="font-bold">45%</p></div>' +
      '<div class="bg-panel rounded p-2"><p class="text-green-400">T2</p><p class="font-bold">28%</p></div>' +
      '<div class="bg-panel rounded p-2"><p class="text-blue-400">T3</p><p class="font-bold">15%</p></div>' +
      '<div class="bg-panel rounded p-2"><p class="text-purple-400">T4</p><p class="font-bold">8%</p></div>' +
      '<div class="bg-panel rounded p-2"><p class="text-orange-400">T5</p><p class="font-bold">4%</p></div>' +
      '</div>' +
      '<p class="text-xs text-secondary mt-2">T级越高越稀有，品质随机由成长/资质决定（异化概率1.5%）。种族池只会影响产出的宠物种族 · 十连抽享9折优惠</p>' +
      '</div>' +
      '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-sm mb-2">📋 抽奖记录 <span class="text-xs text-secondary font-normal">（共 ' + totalDraws + ' 次抽奖，' + totalPets + ' 只宠物）</span></h2>' +
      (totalPets > 0 ? '<div class="flex flex-wrap gap-1 mb-3 text-xs"><span class="text-secondary">品质总计：</span>' + rarityStatHtml + '</div>' : '') +
      '<div class="max-h-64 overflow-y-auto">' + recentHtml + '</div>' +
      '</div>';
  } else {
    contentHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">📖 技能抽奖池</h2>' +
      '<p class="text-xs text-secondary mb-3">使用钻石抽取技能书，品阶越高概率越低（普通85% / 高级10% / 超级5%），十连抽享9折优惠</p>' +
      '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">' +
      Object.entries(SKILL_POOL_CONFIG).map(function(entry) {
        var key = entry[0], cfg = entry[1];
        var tenCost = Math.floor(cfg.price * 10 * 0.9);
        var canAfford = G.player.diamond >= cfg.price;
        var canAffordTen = G.player.diamond >= tenCost;
        return '<div class="bg-panel border border-game rounded-xl p-4 text-center flex flex-col">' +
          '<div class="text-4xl mb-2">' + cfg.icon + '</div>' +
          '<p class="font-bold text-sm mb-1">' + cfg.name + '</p>' +
          '<p class="text-xs text-secondary mb-2 flex-1">' + cfg.desc + '</p>' +
          '<p class="text-blue-400 font-bold text-sm mb-1">单抽 💎 ' + cfg.price + '</p>' +
          '<p class="text-purple-400 text-xs mb-2">十连 💎 ' + tenCost + '（9折）</p>' +
          '<div class="flex gap-1">' +
          '<button class="btn-primary btn-sm flex-1" ' + (!canAfford ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') +
          ' onclick="drawFromSkillPool(\'' + key + '\')">' + (canAfford ? '单抽' : '不足') + '</button>' +
          '<button class="btn-gold btn-sm flex-1" ' + (!canAffordTen ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') +
          ' onclick="drawFromSkillPoolTen(\'' + key + '\')">' + (canAffordTen ? '十连' : '不足') + '</button>' +
          '</div>' +
          '</div>';
      }).join('') +
      '</div></div>';
  }

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🎰 抽奖</h1>
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

// ==================== 练功房（木桩模拟战斗） ====================

let trainingResults = null; // { level, rounds, totalDamage, pets:[...], logs:[...] }
let trainingConfig = { level: 60, rounds: 10 };

function simulateTrainingBattle(level, rounds) {
  const team = getTeamPets();
  if (team.length === 0) return null;
  // 木桩：高血量、不攻击（atk=0）
  const defMult = 1.8; // boss级防御倍率
  const monster = {
    name: '训练木桩',
    level: level,
    enemyType: 'boss',
    hp: 999999999,
    maxHp: 999999999,
    atk: 0,
    def: Math.floor(level * 1.5 * defMult),
  };
  const auraEffects = getAuraEffects(team);
  const charBonus = getCharacterBonusForPet();
  const rebirthBonus = 1 + G.player.rebirth * 0.1;
  const petAtkTalent = 1 + getTalentBonus('pet_atk') + getTalentBonus('combat_mastery');

  const petStats = {};
  team.forEach(pet => {
    const stats = getPetStats(pet);
    const passives = getPassiveEffects(pet);
    const bloodline = getBloodlineSkill(pet);
    petStats[pet.id] = {
      pet: pet, stats: stats, passives: passives, bloodline: bloodline,
      activeSkills: getActiveSkills(pet),
    };
  });

  const results = {
    level: level, rounds: rounds, timestamp: Date.now(),
    monsterDef: monster.def,
    totalDamage: 0,
    pets: team.map(p => ({
      petId: p.id, name: getPetDisplayName(p), trueName: p.name, race: p.race, rarity: p.rarity, level: p.level,
      damage: 0, attacks: 0, crits: 0, skills: 0, maxHit: 0,
      bloodlineTrigger: 0, skillTriggerAttempts: 0, bloodlineName: petStats[p.id].bloodline ? petStats[p.id].bloodline.name : null,
    })),
    logs: [],
  };
  const petResultMap = {};
  results.pets.forEach(r => petResultMap[r.petId] = r);

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < team.length; i++) {
      const pet = team[i];
      const ps = petStats[pet.id];
      const pr = petResultMap[pet.id];
      let atkPower = ps.stats.力量 * rebirthBonus * petAtkTalent;
      // 光环加成
      if (auraEffects.atk) atkPower *= (1 + auraEffects.atk);
      if (auraEffects.all) atkPower *= (1 + auraEffects.all);
      // 角色装备加成
      if (charBonus.atkPct) atkPower *= (1 + charBonus.atkPct);
      if (charBonus.petDmg) atkPower *= (1 + charBonus.petDmg);
      // 血统加成
      if (ps.bloodline && ps.bloodline.id === 'dragon_might') atkPower *= 1.2;
      // 暴击（同步战斗系统：暴击倍率1.5→1.8）
      let critChance = 0.10 + (ps.passives.critRate || 0) + (auraEffects.critRate || 0);
      let critMult = 1.8 + (ps.passives.critMult || 0);
      let isCrit = Math.random() < critChance;

      // 技能触发（同步战斗系统重做：物理≤15%, 法术≤40%, 辅助≤50%）
      // 先选择一个候选技能，再按类型计算触发概率
      let usedSkill = null;
      if (ps.activeSkills.length > 0) {
        pr.skillTriggerAttempts++;
        // 限制最多3个技能生效（取前3个）
        var checkSkills = ps.activeSkills.slice(0, Math.min(3, ps.activeSkills.length));
        // 独立判断每个技能是否触发
        for (var si = 0; si < checkSkills.length; si++) {
          var candidateSkill = checkSkills[si];
          var isMagicSkill = !isPhysicalSkill(candidateSkill);
          var isSupportSkill = (candidateSkill.category === 'single_heal' || candidateSkill.category === 'aoe_heal' || candidateSkill.category === 'single_buff' || candidateSkill.category === 'aoe_buff');
          var baseTriggerChance = isSupportSkill ? 0.25 : isMagicSkill ? 0.20 : 0.08;
          var triggerChance = baseTriggerChance + (ps.passives.skillTrigger || 0) * 0.5;
          if (isSupportSkill) triggerChance = Math.min(triggerChance, 0.50);
          else if (isMagicSkill) triggerChance = Math.min(triggerChance, 0.40);
          else triggerChance = Math.min(triggerChance, 0.15);
          if (ps.bloodline && ps.bloodline.id === 'elf_dance') triggerChance += 0.15;
          if (Math.random() < triggerChance) {
            usedSkill = candidateSkill;
            break; // 只生效第一个触发的技能
          }
        }
      }
      // 血统触发统计
      if (ps.bloodline && ps.bloodline.id === 'dragon_might' && isCrit) pr.bloodlineTrigger++;
      if (ps.bloodline && ps.bloodline.id === 'elf_dance' && usedSkill) pr.bloodlineTrigger++;

      let rawDmg;
      if (usedSkill) {
        let dmgPct = usedSkill.dmgPct || 1;
        let ignoreDefPct = usedSkill.ignoreDefPct || 0;
        // 同步战斗系统：防御削减系数0.7→0.6
        rawDmg = atkPower * dmgPct - monster.def * (0.6 - ignoreDefPct);
        pr.skills++;
      } else {
        let ignoreDef = ps.passives.ignoreDef || 0;
        rawDmg = atkPower - monster.def * (0.6 - ignoreDef);
      }
      rawDmg = Math.round(rawDmg * randomFloat(0.90, 1.10));
      if (isCrit) rawDmg = Math.round(rawDmg * critMult);
      let damage = Math.max(1, rawDmg);

      pr.damage += damage;
      pr.attacks++;
      if (isCrit) pr.crits++;
      if (damage > pr.maxHit) pr.maxHit = damage;
      results.totalDamage += damage;
      results.logs.push({
        round: round,
        petName: getPetDisplayName(pet),
        action: usedSkill ? '技能:' + usedSkill.name : '普攻',
        damage: damage,
        isCrit: isCrit,
      });
    }
  }
  // 按伤害排序
  results.pets.sort((a, b) => b.damage - a.damage);
  return results;
}

function startTrainingBattle() {
  const level = Math.max(1, Math.min(120, parseInt(trainingConfig.level) || 60));
  const rounds = Math.max(1, Math.min(100, parseInt(trainingConfig.rounds) || 10));
  trainingConfig.level = level;
  trainingConfig.rounds = rounds;
  const team = getTeamPets();
  if (team.length === 0) { showToast('请先设置出战宠物！', 'error'); return; }
  trainingResults = simulateTrainingBattle(level, rounds);
  if (!trainingResults) { showToast('模拟失败！', 'error'); return; }
  showToast('训练完成！总伤害 ' + trainingResults.totalDamage.toLocaleString(), 'success');
  render();
}

function showTrainingDetail() {
  if (!trainingResults) return;
  const r = trainingResults;
  // 构建宠物颜色映射（通过trueName查找rarity）
  var petColorMap = {};
  r.pets.forEach(function(pr) { petColorMap[pr.name] = RARITY_COLORS[RARITIES.indexOf(pr.race)] || '#fff'; });
  // 汇总统计卡片
  var totalAttacks = r.pets.reduce(function(s, p) { return s + p.attacks; }, 0);
  var totalCrits = r.pets.reduce(function(s, p) { return s + p.crits; }, 0);
  var totalSkills = r.pets.reduce(function(s, p) { return s + p.skills; }, 0);
  var overallCritRate = totalAttacks > 0 ? (totalCrits / totalAttacks * 100).toFixed(1) : '0.0';
  var overallDps = r.rounds > 0 ? Math.floor(r.totalDamage / r.rounds) : 0;
  var logsHtml = r.logs.map(function(l) {
    var c = petColorMap[l.petName] || '#fff';
    return '<tr class="border-b border-game hover:bg-panel">' +
      '<td class="px-2 py-1 text-xs text-secondary">' + l.round + '</td>' +
      '<td class="px-2 py-1 text-xs font-bold" style="color:' + c + '">' + l.petName + '</td>' +
      '<td class="px-2 py-1 text-xs ' + (l.action.indexOf('技能') === 0 ? 'text-purple-300' : 'text-secondary') + '">' + l.action + '</td>' +
      '<td class="px-2 py-1 text-xs ' + (l.isCrit ? 'text-yellow-400 font-bold' : 'text-gold') + '">' + (l.isCrit ? '⚡ ' : '') + l.damage.toLocaleString() + '</td>' +
      '</tr>';
  }).join('');
  // 宠物汇总详情
  var petsSummaryHtml = r.pets.map(function(pr, idx) {
    var c = petColorMap[pr.name] || '#fff';
    var avgDmg = pr.attacks > 0 ? Math.floor(pr.damage / pr.attacks) : 0;
    var critRate = pr.attacks > 0 ? (pr.crits / pr.attacks * 100).toFixed(1) : '0.0';
    var skillRate = pr.skillTriggerAttempts > 0 ? (pr.skills / pr.skillTriggerAttempts * 100).toFixed(1) : '0.0';
    var dps = r.rounds > 0 ? Math.floor(pr.damage / r.rounds) : 0;
    return '<div class="bg-panel border border-game rounded-lg p-3">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<span class="text-sm font-bold" style="color:' + c + '">' + (idx + 1) + '. ' + pr.name + ' <span class="text-secondary text-xs">Lv.' + pr.level + '</span></span>' +
      '<span class="text-xs text-gold">DPS: ' + dps.toLocaleString() + '</span>' +
      '</div>' +
      '<div class="grid grid-cols-4 gap-2 text-xs">' +
      '<div class="text-center"><div class="text-secondary">总伤害</div><div class="text-gold font-bold">' + pr.damage.toLocaleString() + '</div></div>' +
      '<div class="text-center"><div class="text-secondary">平均</div><div class="text-green-400">' + avgDmg.toLocaleString() + '</div></div>' +
      '<div class="text-center"><div class="text-secondary">最高</div><div class="text-red-400 font-bold">' + pr.maxHit.toLocaleString() + '</div></div>' +
      '<div class="text-center"><div class="text-secondary">暴击率</div><div class="text-yellow-400">' + critRate + '%</div></div>' +
      '</div>' +
      '<div class="grid grid-cols-3 gap-2 text-xs mt-2 pt-2 border-t border-game">' +
      '<div class="text-center"><div class="text-secondary">攻击</div><div class="text-white">' + pr.attacks + '</div></div>' +
      '<div class="text-center"><div class="text-secondary">技能次数</div><div class="text-purple-300">' + pr.skills + ' / 触发率 ' + skillRate + '%</div></div>' +
      '<div class="text-center"><div class="text-secondary">血统</div><div class="text-cyan-300">' + (pr.bloodlineName || '无') + (pr.bloodlineTrigger > 0 ? ' (×' + pr.bloodlineTrigger + ')' : '') + '</div></div>' +
      '</div>' +
      '</div>';
  }).join('');
  var html = '<div id="trainingDetailOverlay" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="closeTrainingDetail()">' +
    '<div class="bg-card border-2 border-purple-600 rounded-2xl p-5 max-w-3xl w-full max-h-[90vh] overflow-auto animate-fadeIn" onclick="event.stopPropagation()">' +
    '<div class="flex items-center justify-between mb-3">' +
    '<h2 class="font-fantasy text-gold text-lg">📜 训练战斗详细数据</h2>' +
    '<button class="text-secondary hover:text-white text-xl" onclick="closeTrainingDetail()">✕</button>' +
    '</div>' +
    '<div class="bg-panel rounded-lg p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">' +
    '<div class="text-center"><div class="text-secondary">目标</div><div class="text-gold font-bold">Lv.' + r.level + ' 木桩</div></div>' +
    '<div class="text-center"><div class="text-secondary">防御</div><div class="text-white">' + r.monsterDef + '</div></div>' +
    '<div class="text-center"><div class="text-secondary">回合数</div><div class="text-white">' + r.rounds + '</div></div>' +
    '<div class="text-center"><div class="text-secondary">总DPS</div><div class="text-green-400 font-bold">' + overallDps.toLocaleString() + '</div></div>' +
    '<div class="text-center"><div class="text-secondary">总伤害</div><div class="text-gold font-bold">' + r.totalDamage.toLocaleString() + '</div></div>' +
    '<div class="text-center"><div class="text-secondary">总攻击</div><div class="text-white">' + totalAttacks + '</div></div>' +
    '<div class="text-center"><div class="text-secondary">总暴击</div><div class="text-yellow-400">' + totalCrits + ' (' + overallCritRate + '%)</div></div>' +
    '<div class="text-center"><div class="text-secondary">总技能</div><div class="text-purple-300">' + totalSkills + '</div></div>' +
    '</div>' +
    '<h3 class="font-bold text-sm mb-2 text-gold-light">🎯 宠物表现</h3>' +
    '<div class="space-y-2 mb-4">' + petsSummaryHtml + '</div>' +
    '<h3 class="font-bold text-sm mb-2 text-gold-light">📜 战斗日志 <span class="text-xs text-secondary">（共' + r.logs.length + '条）</span></h3>' +
    '<div class="bg-panel rounded-lg p-2" style="max-height:240px;overflow-y:auto;">' +
      '<table class="w-full text-xs">' +
      '<thead class="sticky top-0 bg-panel"><tr class="border-b border-game">' +
      '<th class="px-2 py-1 text-secondary text-left">回合</th>' +
      '<th class="px-2 py-1 text-secondary text-left">宠物</th>' +
      '<th class="px-2 py-1 text-secondary text-left">行动</th>' +
      '<th class="px-2 py-1 text-secondary text-right">伤害</th>' +
      '</tr></thead><tbody>' + logsHtml + '</tbody></table>' +
    '</div>' +
    '<button class="btn-primary w-full mt-2" onclick="closeTrainingDetail()">关闭</button>' +
    '</div></div>';
  document.getElementById('app').insertAdjacentHTML('beforeend', html);
}

function closeTrainingDetail() {
  var ov = document.getElementById('trainingDetailOverlay');
  if (ov) ov.remove();
}

function findPetRarityByName(name) {
  var pet = G.pets.find(function(p){ return p.name === name; });
  return pet ? pet.rarity : '普通';
}

function renderTrainingScreen() {
  const r = trainingResults;
  let resultsHtml = '';
  if (r) {
    const petRowsHtml = r.pets.map(function(pr, idx) {
      var raceColor = RARITY_COLORS[RARITIES.indexOf(pr.race)] || '#fff';
      var avgDmg = pr.attacks > 0 ? Math.floor(pr.damage / pr.attacks) : 0;
      var critRate = pr.attacks > 0 ? (pr.crits / pr.attacks * 100).toFixed(1) : '0.0';
      var skillRate = pr.skillTriggerAttempts > 0 ? (pr.skills / pr.skillTriggerAttempts * 100).toFixed(1) : '0.0';
      var dps = r.rounds > 0 ? Math.floor(pr.damage / r.rounds) : 0;
      return '<tr class="border-b border-game">' +
        '<td class="px-2 py-2 text-xs">' + (idx + 1) + '</td>' +
        '<td class="px-2 py-2 text-xs font-bold" style="color:' + raceColor + '">' + pr.name + ' <span class="text-secondary">Lv.' + pr.level + '</span></td>' +
        '<td class="px-2 py-2 text-xs text-gold font-bold">' + pr.damage.toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-xs text-green-400 font-bold">' + dps.toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-xs text-secondary">' + pr.attacks + '</td>' +
        '<td class="px-2 py-2 text-xs text-purple-300">' + pr.skills + ' <span class="text-secondary">(' + skillRate + '%)</span></td>' +
        '<td class="px-2 py-2 text-xs text-yellow-400">' + critRate + '%</td>' +
        '<td class="px-2 py-2 text-xs text-green-400">' + avgDmg.toLocaleString() + '</td>' +
        '<td class="px-2 py-2 text-xs text-red-400 font-bold">' + pr.maxHit.toLocaleString() + '</td>' +
        '</tr>';
    }).join('');
    resultsHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<div class="flex items-center justify-between mb-3">' +
      '<h2 class="font-bold text-lg">📊 训练结果</h2>' +
      '<button class="btn-primary btn-sm" onclick="showTrainingDetail()">📋 查看详细数据</button>' +
      '</div>' +
      '<p class="text-xs text-secondary mb-3">目标：Lv.' + r.level + ' 训练木桩（boss级，防御 ' + r.monsterDef + '） | 回合数：' + r.rounds + ' | 总伤害：<span class="text-gold font-bold text-base">' + r.totalDamage.toLocaleString() + '</span> | 总DPS：<span class="text-green-400 font-bold text-base">' + (r.rounds > 0 ? Math.floor(r.totalDamage / r.rounds).toLocaleString() : 0) + '</span></p>' +
      '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-xs text-secondary border-b border-game">' +
      '<th class="px-2 py-1 text-left">#</th><th class="px-2 py-1 text-left">宠物</th><th class="px-2 py-1 text-left">总伤害</th><th class="px-2 py-1 text-left">DPS</th><th class="px-2 py-1 text-left">攻击</th><th class="px-2 py-1 text-left">技能(触发率)</th><th class="px-2 py-1 text-left">暴击率</th><th class="px-2 py-1 text-left">平均</th><th class="px-2 py-1 text-left">最高</th>' +
      '</tr></thead><tbody>' + petRowsHtml + '</tbody></table></div>' +
      '</div>';
  } else {
    resultsHtml = '<div class="bg-card border border-dashed border-game rounded-xl p-6 text-center">' +
      '<div class="text-4xl mb-2">🥋</div>' +
      '<p class="text-sm text-secondary">设置参数后点击"开始训练"查看战斗数据</p>' +
      '</div>';
  }
  const team = getTeamPets();
  const teamHtml = team.length > 0 ? team.map(function(p) {
    var raceColor = RARITY_COLORS[RARITIES.indexOf(p.rarity)] || '#fff';
    return '<span class="text-xs px-2 py-1 rounded bg-panel border border-game" style="color:' + raceColor + '">' + getPetDisplayName(p) + ' Lv.' + p.level + '</span>';
  }).join('') : '<span class="text-xs text-red-400">未设置出战宠物</span>';
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🥋 练功房</h1>
      <div class="flex gap-3 text-sm">
        <span class="text-yellow-400">🪙 ${G.player.gold.toLocaleString()}</span>
        <span class="text-blue-400">💎 ${G.player.diamond.toLocaleString()}</span>
      </div>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <h2 class="font-bold text-lg mb-3">🪵 训练木桩</h2>
        <p class="text-xs text-secondary mb-3">木桩为boss级敌人，不会攻击。设置等级和回合数后开始训练，查看队伍在固定回合内造成的伤害。</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label class="text-xs text-secondary block mb-1">木桩等级 (1-120)</label>
            <input type="number" min="1" max="120" value="${trainingConfig.level}" onchange="trainingConfig.level=parseInt(this.value)||60"
              class="w-full bg-panel border border-game rounded px-3 py-2 text-sm text-white">
          </div>
          <div>
            <label class="text-xs text-secondary block mb-1">战斗回合数 (1-100)</label>
            <input type="number" min="1" max="100" value="${trainingConfig.rounds}" onchange="trainingConfig.rounds=parseInt(this.value)||10"
              class="w-full bg-panel border border-game rounded px-3 py-2 text-sm text-white">
          </div>
          <div class="flex items-end">
            <button class="btn-gold w-full py-2" onclick="startTrainingBattle()">⚔️ 开始训练</button>
          </div>
        </div>
        <div class="text-xs"><span class="text-secondary">出战队伍：</span>${teamHtml}</div>
      </div>
      ${resultsHtml}
    </main>
  </div>`;
}

function renderDexScreen() {
  var dexTab = window._dexTab || 'pets';
  var allDisplayNames = PET_NAMES.slice();
  if (typeof FUSION_ONLY_PETS !== 'undefined') {
    allDisplayNames = allDisplayNames.concat(FUSION_ONLY_PETS);
  }
  // 顶部Tab切换
  var tabsHtml = (function() {
    var tabs = [
      { id: 'pets', label: '🐾 宠物图鉴' },
      { id: 'races', label: '💠 种族值' },
      { id: 'advance', label: '⭐ 进阶图' }, // 需求4：进阶图sheet
    ];
    return '<div class="bg-card border border-game rounded-xl p-1 flex gap-1">' + tabs.map(function(t) {
      var active = dexTab === t.id;
      return '<button class="flex-1 text-sm px-3 py-1.5 rounded ' + (active ? 'bg-purple-900 text-purple-300 border border-purple-500' : 'border border-transparent text-secondary hover:bg-panel') + '" onclick="window._dexTab=\'' + t.id + '\';render()">' + t.label + '</button>';
    }).join('') + '</div>';
  })();

  // ===== 种族值 Tab =====
  if (dexTab === 'races') {
    var raceRowsHtml = RACES.map(function(race) {
      var rv = getRaceValues(race);
      var total = (rv.力量 + rv.体质 + rv.敏捷 + rv.智力).toFixed(1);
      var bloodline = BLOODLINE_SKILLS.find(function(b) { return b.race === race; });
      var bsName = bloodline ? bloodline.name : '—';
      var bsDesc = bloodline ? (bloodline.desc || '') : '';
      var raceColor = RARITY_COLORS[RACES.indexOf(race)] || '#fff';
      // 各属性条：以最大值2.5为满格
      var maxRv = 2.5;
      var attrsHtml = ['力量', '体质', '敏捷', '智力'].map(function(k) {
        var v = rv[k] || 0;
        var pct = Math.floor((v / maxRv) * 100);
        var color = v >= 2.0 ? '#ef4444' : v >= 1.5 ? '#f59e0b' : v >= 1.0 ? '#3b82f6' : '#9ca3af';
        return '<div class="flex items-center gap-1 text-xs">' +
          '<span class="text-secondary w-7">' + k + '</span>' +
          '<div class="flex-1 bg-gray-800 rounded h-2 overflow-hidden">' +
          '<div class="h-full rounded" style="width:' + pct + '%;background:' + color + ';"></div>' +
          '</div>' +
          '<span class="text-xs w-8 text-right font-bold" style="color:' + color + '">' + v.toFixed(1) + '</span>' +
          '</div>';
      }).join('');
      return '<div class="bg-card border border-game rounded-xl p-3">' +
        '<div class="flex items-center justify-between mb-2">' +
        '<p class="font-bold text-sm" style="color:' + raceColor + '">' + race + '</p>' +
        '<span class="text-xs text-gold font-bold">总和 ' + total + ' / 5.0</span>' +
        '</div>' +
        '<div class="space-y-1 mb-2">' + attrsHtml + '</div>' +
        '</div>';
    }).join('');
    return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">📖 图鉴</h1>
      <span class="text-sm text-secondary">种族值系统</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-3">
      ${tabsHtml}
      <div class="bg-card border border-game rounded-xl p-3 text-xs text-secondary">
        <p>💡 种族值总合为5.0，决定该种族在不同属性上的天赋倾向。种族值影响宠物属性公式的种族贡献部分（<span class="text-blue-400">等级×成长×种族值</span>）。</p>
        <p class="mt-1">例如：力量种族值越高，该种族宠物在力量属性上每级获得的加成越多。</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${raceRowsHtml}</div>
    </main>
  </div>`;
  }

  // ===== 进阶图 Tab（需求4：展示所有进阶宠，同一进阶链T1→T3→T5分组） =====
  if (dexTab === 'advance') {
    var advChains = (typeof PET_ADVANCE_CHAINS !== 'undefined') ? PET_ADVANCE_CHAINS : [];
    // 渲染单条进阶链
    function renderAdvanceChainCard(chain) {
      var stages = [
        { name: chain.base, stage: 0, tier: getPetTier(chain.base) },
        { name: chain.mid,  stage: 1, tier: Math.min(5, getPetTier(chain.base) + 2) },
        { name: chain.top,  stage: 2, tier: Math.min(5, getPetTier(chain.base) + 4) },
      ];
      var stageCards = stages.map(function(s) {
        var dex = getPetDex(s.name);
        if (!dex) return '<div class="bg-panel rounded p-2 text-xs text-secondary">未知</div>';
        var specIcon = SPECIALTY_ICONS[dex.specialty] || '⚖️';
        var specName = SPECIALTY_NAMES[dex.specialty] || '均衡型';
        var raceColor = RARITY_COLORS[RACES.indexOf(dex.race)] || '#fff';
        if (RACES.indexOf(dex.race) < 0) raceColor = '#94a3b8';
        var tierColor = s.tier >= 5 ? '#ef4444' : s.tier >= 4 ? '#fb923c' : s.tier >= 3 ? '#a855f7' : s.tier >= 2 ? '#3b82f6' : '#22c55e';
        var tierLabel = 'T' + (s.tier + 1);
        var stageLabel = s.stage === 0 ? '基础' : s.stage === 1 ? '进阶+1' : '进阶+2';
        var blMult = s.stage === 2 ? 2.0 : s.stage === 1 ? 1.5 : 1.0;
        // 资质范围
        var aptHtml = APTITUDE_KEYS.map(function(k) {
          var range = dex.aptRange[k] || [1200, 1800];
          var shortName = k.replace('资质', '');
          return '<span class="text-xs text-secondary">' + shortName + ' ' + range[0] + '-' + range[1] + '</span>';
        }).join(' · ');
        // 成长范围
        var growthHtml = dex.growthRange[0].toFixed(1) + ' ~ ' + dex.growthRange[1].toFixed(1);
        // 天生技能
        var innateHtml = (dex.innateSkills || []).map(function(sid) {
          var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
          return sk ? '<span class="text-xs text-yellow-400 mr-1">★' + sk.name + '</span>' : '';
        }).join('') || '<span class="text-xs text-secondary">无</span>';
        return '<div class="bg-panel rounded-lg p-3 border ' + (s.stage > 0 ? 'border-yellow-600/50' : 'border-game') + '">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<p class="font-bold text-sm" style="color:' + (s.stage > 0 ? '#fbbf24' : '#e5e7eb') + '">' + s.name + '</p>' +
            '<span class="text-xs font-black px-1.5 py-0.5 rounded" style="background:' + tierColor + '22;color:' + tierColor + ';border:1px solid ' + tierColor + '">' + tierLabel + '</span>' +
          '</div>' +
          '<p class="text-xs mb-1" style="color:' + raceColor + '">' + dex.race + ' · ' + specIcon + ' ' + specName + ' · <span class="text-yellow-400">' + stageLabel + '</span></p>' +
          '<p class="text-xs text-secondary mb-1">成长：<span class="text-gold">' + growthHtml + '</span></p>' +
          '<p class="text-xs text-secondary mb-1">' + aptHtml + '</p>' +
          '<p class="text-xs"><span class="text-secondary">天生技能：</span>' + innateHtml + '</p>' +
          (s.stage > 0 ? '<p class="text-xs text-yellow-400 mt-1">血统强化×' + blMult + '</p>' : '') +
        '</div>';
      }).join('');
      // 箭头
      return '<div class="bg-card border border-game rounded-xl p-3">' +
        '<div class="flex items-center gap-1 mb-2">' +
          stageCards.split('</div>').join('</div>→').slice(0, -1) + // 在每个卡片后加箭头
        '</div>' +
      '</div>';
    }
    // 简化版：直接生成3个卡片横排+箭头
    function renderChainRow(chain) {
      var stages = [
        { name: chain.base, stage: 0 },
        { name: chain.mid,  stage: 1 },
        { name: chain.top,  stage: 2 },
      ];
      var cardsArr = stages.map(function(s) {
        var dex = getPetDex(s.name);
        if (!dex) return '<div class="bg-panel rounded p-2 text-xs text-secondary">未知</div>';
        var specIcon = SPECIALTY_ICONS[dex.specialty] || '⚖️';
        var raceColor = RARITY_COLORS[RACES.indexOf(dex.race)] || '#fff';
        if (RACES.indexOf(dex.race) < 0) raceColor = '#94a3b8';
        var baseTier = getPetTier(chain.base);
        var sTier = Math.min(5, baseTier + s.stage * 2);
        var tierColor = sTier >= 5 ? '#ef4444' : sTier >= 4 ? '#fb923c' : sTier >= 3 ? '#a855f7' : sTier >= 2 ? '#3b82f6' : '#22c55e';
        var tierLabel = 'T' + (sTier + 1);
        var stageLabel = s.stage === 0 ? '基础' : s.stage === 1 ? '进阶+1' : '进阶+2';
        var blMult = s.stage === 2 ? 2.0 : s.stage === 1 ? 1.5 : 1.0;
        var growthHtml = dex.growthRange[0].toFixed(1) + '~' + dex.growthRange[1].toFixed(1);
        var aptHtml = APTITUDE_KEYS.map(function(k) {
          var range = dex.aptRange[k] || [1200, 1800];
          return range[0] + '-' + range[1];
        }).join('/');
        var innateHtml = (dex.innateSkills || []).map(function(sid) {
          var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
          return sk ? '<span class="text-xs text-yellow-400">★' + sk.name + '</span>' : '';
        }).join(' ') || '<span class="text-xs text-secondary">无</span>';
        return '<div class="flex-1 bg-panel rounded-lg p-2 border ' + (s.stage > 0 ? 'border-yellow-600/50' : 'border-game') + '">' +
          '<div class="flex items-center justify-between mb-1">' +
            '<p class="font-bold text-xs" style="color:' + (s.stage > 0 ? '#fbbf24' : '#e5e7eb') + '">' + s.name + '</p>' +
            '<span class="text-xs font-black px-1 py-0.5 rounded" style="background:' + tierColor + '22;color:' + tierColor + ';border:1px solid ' + tierColor + '">' + tierLabel + '</span>' +
          '</div>' +
          '<p class="text-xs mb-1" style="color:' + raceColor + '">' + specIcon + ' ' + stageLabel + '</p>' +
          '<p class="text-xs text-secondary">成长 <span class="text-gold">' + growthHtml + '</span></p>' +
          '<p class="text-xs text-secondary">资质 ' + aptHtml + '</p>' +
          '<p class="text-xs">' + innateHtml + '</p>' +
          (s.stage > 0 ? '<p class="text-xs text-yellow-400">血统×' + blMult + '</p>' : '') +
        '</div>';
      });
      var cardsWithArrows = cardsArr.map(function(cardHtml, idx) {
        var arrow = idx < cardsArr.length - 1 ? '<span class="text-yellow-400 text-lg px-1">→</span>' : '';
        return cardHtml + arrow;
      }).join('');
      return '<div class="bg-card border border-game rounded-xl p-3">' +
        '<div class="flex items-center gap-1">' + cardsWithArrows + '</div>' +
      '</div>';
    }
    var chainRowsHtml = advChains.map(renderChainRow).join('');
    return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">📖 图鉴</h1>
      <span class="text-sm text-secondary">进阶图 · 共 ${advChains.length} 条进阶链</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-3">
      ${tabsHtml}
      <div class="bg-card border border-game rounded-xl p-3 text-xs text-secondary">
        <p>💡 进阶图展示所有可进阶宠物的进化链：基础(T1/T2) → 进阶+1(T3) → 进阶+2(T5)。同一进阶链放在一起，从T1→T3→T5依次展示。进阶后成长、资质、技能和血统技能都会强化。</p>
      </div>
      <div class="space-y-2">${chainRowsHtml}</div>
    </main>
  </div>`;
  }

  // ===== 宠物图鉴 Tab（原有逻辑） =====
  var dexFilter = window._dexFilter || 'all';
  // 按种族分类筛选 + 融合限定分类
  var races = ['all'].concat(RACES, ['fusion']);
  var filteredNames;
  if (dexFilter === 'fusion') {
    filteredNames = (typeof FUSION_ONLY_PETS !== 'undefined') ? FUSION_ONLY_PETS.slice() : [];
  } else if (dexFilter === 'all') {
    filteredNames = allDisplayNames.slice();
  } else {
    filteredNames = allDisplayNames.filter(function(name) {
      var dex = getPetDex(name);
      return dex.race === dexFilter;
    });
  }
  // 图鉴按T级正序展示（T1在前，T5在后；融合限定放最后）
  filteredNames.sort(function(a, b) {
    var ta = getPetTier(a);
    var tb = getPetTier(b);
    if (ta !== tb) return ta - tb;
    return a.localeCompare(b, 'zh');
  });
  // 翻页：每页12个
  var perPage = 12;
  var totalPages = Math.max(1, Math.ceil(filteredNames.length / perPage));
  var dexPage = window._dexPage || 0;
  if (dexPage < 0) dexPage = 0;
  if (dexPage >= totalPages) dexPage = totalPages - 1;
  window._dexPage = dexPage;
  var pageStart = dexPage * perPage;
  var pageNames = filteredNames.slice(pageStart, pageStart + perPage);
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">📖 图鉴</h1>
      <span class="text-sm text-secondary">共 ${allDisplayNames.length} 种</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-3">
      ${tabsHtml}
      <div class="bg-card border border-game rounded-xl p-3">
        <div class="flex flex-wrap gap-1">
          ${races.map(function(r) {
            var active = dexFilter === r;
            var icon = r === 'all' ? '📋' : r === 'fusion' ? '✨' : '';
            var name = r === 'all' ? '全部' : r === 'fusion' ? '融合限定' : r;
            var extraStyle = r === 'fusion' ? 'border-pink-500 text-pink-300' : '';
            return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500' : 'border-game text-secondary ' + extraStyle) + '" onclick="window._dexFilter=\'' + r + '\';window._dexPage=0;render()">' + icon + ' ' + name + '</button>';
          }).join('')}
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${pageNames.map(function(name) {
          var dex = getPetDex(name);
          var specIcon = SPECIALTY_ICONS[dex.specialty] || '⚖️';
          var specName = SPECIALTY_NAMES[dex.specialty] || '均衡型';
          var raceColor = RARITY_COLORS[RACES.indexOf(dex.race)] || '#fff';
          if (RACES.indexOf(dex.race) < 0) raceColor = '#94a3b8';
          // 天生技能
          var innateHtml = '';
          if (dex.innateSkills && dex.innateSkills.length > 0) {
            innateHtml = dex.innateSkills.map(function(sid) {
              var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
              return sk ? '<span class="text-xs text-yellow-400 mr-1">★' + sk.name + '</span>' : '';
            }).join('');
          } else {
            innateHtml = '<span class="text-xs text-secondary">随机</span>';
          }
          // 资质条：梦幻西游风格，单根填充条，按上限占3000的百分比填充，下限位置标记
          var aptHtml = APTITUDE_KEYS.map(function(k) {
            var range = dex.aptRange[k] || [1200, 1800];
            var lo = range[0], hi = range[1];
            // 以3000为绝对上限，填充到上限位置，下限用刻度标记
            var pctLo = Math.floor((lo / 3000) * 100);
            var pctHi = Math.floor((hi / 3000) * 100);
            var avgPct = Math.floor(((lo + hi) / 2 / 3000) * 100);
            var potentialColor = pctHi >= 80 ? '#ef4444' : pctHi >= 60 ? '#f59e0b' : pctHi >= 40 ? '#3b82f6' : '#9ca3af';
            var shortName = k.replace('资质', '');
            return '<div class="flex items-center gap-1 text-xs">' +
              '<span class="text-secondary w-6">' + shortName + '</span>' +
              '<div class="flex-1 bg-gray-800 rounded h-2 overflow-hidden relative">' +
                '<div class="h-full rounded" style="width:' + pctHi + '%;background:linear-gradient(90deg,#3b82f6,' + potentialColor + ');"></div>' +
                '<div class="absolute top-0 h-full w-px bg-gray-400" style="left:' + pctLo + '%;" title="下限"></div>' +
              '</div>' +
              '<span class="text-xs w-14 text-right" style="color:' + potentialColor + '">' + lo + '-' + hi + '</span>' +
              '</div>';
          }).join('');
          // T级别
          var tier = getPetTier(name);
          var tierLabel = getPetTierLabel(name);
          var tierColor = tier === 5 ? '#ef4444' : tier === 4 ? '#fb923c' : tier === 3 ? '#a855f7' : tier === 2 ? '#3b82f6' : '#22c55e';
          // 融合限定宠物特殊标识
          var fusionBadge = dex.fusionOnly ? '<span class="text-xs font-black px-2 py-0.5 rounded ml-1" style="background:#ec489922;color:#ec4899;border:1px solid #ec4899">✨融合限定</span>' : '';
          // 可进阶宠物标识
          var isAdvanceable = (typeof PET_ADVANCE_CHAINS !== 'undefined') && PET_ADVANCE_CHAINS.some(function(c) { return c.mid === name; });
          var advanceBadge = isAdvanceable ? '<span class="text-xs font-bold px-1.5 py-0.5 rounded ml-1" style="background:#ca8a0422;color:#fbbf24;border:1px solid #fbbf24" title="可进阶宠物">进</span>' : '';
          var cardBorder = dex.fusionOnly ? 'border-pink-500' : isAdvanceable ? 'border-yellow-600/50' : 'border-game';
          var maxSkills = getPetMaxSkills(name);
          // 天生技能（仅显示真实存在的）
          var innateHtml = '';
          var realInnate = (dex.innateSkills || []).map(function(sid) {
            return ALL_SKILLS.find(function(s) { return s.id === sid; });
          }).filter(function(sk){ return sk; });
          if (realInnate.length > 0) {
            innateHtml = realInnate.map(function(sk) {
              var typeLabel = sk.type === 'active' ? '主动' : sk.type === 'aura' ? '光环' : sk.type === 'passive' ? '被动' : '天生';
              var catLabel = '';
              if (sk.category) {
                var catMap = { single_atk:'单体攻', aoe_atk:'群攻', single_heal:'单治', aoe_heal:'群治', single_buff:'单增益', aoe_buff:'群增益', single_cc:'单控', aoe_cc:'群控' };
                catLabel = catMap[sk.category] || '';
              }
              var elemLabel = sk.element && sk.element !== '无' ? sk.element : '';
              var title = '【天生·' + typeLabel + (catLabel ? '·' + catLabel : '') + (elemLabel ? '·' + elemLabel : '') + '】' + (sk.desc || '');
              return '<span class="text-xs text-yellow-400 mr-1 cursor-help" title="' + title.replace(/"/g, '&quot;') + '">★' + sk.name + '</span>';
            }).join('');
          } else {
            innateHtml = '<span class="text-xs text-secondary">无（纯随机）</span>';
          }
          // 技能库
          var skillLib = getPetSkillLib(name);
          var libHtml = skillLib.map(function(sid) {
            var sk = ALL_SKILLS.find(function(s) { return s.id === sid; });
            if (!sk) return '';
            var typeIcon = sk.type === 'active' ? '⚔️' : sk.type === 'aura' ? '✨' : sk.type === 'passive' ? '🛡️' : '★';
            var typeLabel = sk.type === 'active' ? '主动' : sk.type === 'aura' ? '光环' : sk.type === 'passive' ? '被动' : '天生';
            var catLabel = '';
            if (sk.category) {
              var catMap = { single_atk:'单体攻', aoe_atk:'群攻', single_heal:'单治', aoe_heal:'群治', single_buff:'单增益', aoe_buff:'群增益', single_cc:'单控', aoe_cc:'群控' };
              catLabel = catMap[sk.category] || '';
            }
            var elemLabel = sk.element && sk.element !== '无' ? sk.element : '';
            var title = '【技能库·' + typeLabel + (catLabel ? '·' + catLabel : '') + (elemLabel ? '·' + elemLabel : '') + '】' + (sk.desc || '') + (sk.dmgPct ? '（伤害系数' + Math.round(sk.dmgPct*100) + '%）' : '') + (sk.targetCount ? '（目标数' + sk.targetCount + '）' : '');
            var borderColor = sk.type === 'active' ? '#f59e0b' : sk.type === 'aura' ? '#a855f7' : '#22c55e';
            return '<span class="text-xs px-1.5 py-0.5 rounded mr-1 mb-0.5 inline-block" style="background:#1e293b;color:#cbd5e1;border:1px solid ' + borderColor + '55;" title="' + title.replace(/"/g, '&quot;') + '">' + typeIcon + ' ' + sk.name + '</span>';
          }).join('');
          return '<div class="bg-card border ' + cardBorder + ' rounded-xl p-3">' +
            '<div class="flex items-center justify-between mb-2">' +
            '<div><p class="font-bold text-sm">' + name + fusionBadge + advanceBadge + '</p>' +
            '<p class="text-xs" style="color:' + raceColor + '">' + dex.race + ' · ' + specIcon + ' ' + specName + '</p></div>' +
            '<span class="text-xs font-black px-2 py-1 rounded" style="background:' + tierColor + '22;color:' + tierColor + ';border:1px solid ' + tierColor + '">' + tierLabel + '</span>' +
            '</div>' +
            '<p class="text-xs text-secondary mb-2">' + (dex.desc || '') + '</p>' +
            '<div class="space-y-1 mb-2">' + aptHtml + '</div>' +
            '<div class="flex items-center justify-between text-xs mb-1">' +
            '<span class="text-secondary">成长范围</span>' +
            '<span class="text-gold">' + dex.growthRange[0].toFixed(1) + ' ~ ' + dex.growthRange[1].toFixed(1) + '</span>' +
            '</div>' +
            '<div class="text-xs mb-1"><span class="text-secondary">满技能数：</span><span class="text-blue-400 font-bold">' + maxSkills + '</span> <span class="text-secondary">| 天生技能：</span>' + innateHtml + '</div>' +
            '<div class="text-xs"><span class="text-secondary">技能库（孵化时随机获得1~' + maxSkills + '个）：</span></div>' +
            '<div class="mt-1">' + libHtml + '</div>' +
            // 需求3：血统技能展示（需求12：使用 generatePetBloodlineSkill 获取最新血统）
            (function() {
              // 合成虚拟 pet 调用 generatePetBloodlineSkill 获取最新血统技能
              var synthPet = { name: name, advanceStage: 0 };
              var bSkill = null;
              if (typeof generatePetBloodlineSkill === 'function') {
                bSkill = generatePetBloodlineSkill(synthPet);
              }
              if (!bSkill) {
                // 兜底：旧的 getPetBloodlineId + BLOODLINE_SKILLS 查找
                var bId = null;
                if (typeof FUSION_PET_BLOODLINES !== 'undefined' && FUSION_PET_BLOODLINES[name]) {
                  bId = FUSION_PET_BLOODLINES[name];
                } else if (typeof getPetBloodlineId === 'function') {
                  bId = getPetBloodlineId(name);
                }
                bSkill = bId ? BLOODLINE_SKILLS.find(function(b) { return b.id === bId; }) : null;
              }
              if (!bSkill) return '';
              var bTitle = '【血统·' + (bSkill.type || 'bloodline') + '】' + (bSkill.desc || '');
              // 需求12：附带效果详情
              var effectDetail = '';
              if (bSkill.effects && typeof formatBloodlineEffects === 'function') {
                effectDetail = formatBloodlineEffects(bSkill.effects);
              }
              return '<div class="mt-2 pt-2 border-t border-game/40">' +
                '<div class="text-xs"><span class="text-secondary">血统技能：</span></div>' +
                '<div class="mt-1"><span class="text-xs px-1.5 py-0.5 rounded mr-1 inline-block" style="background:#1e293b;color:#fbbf24;border:1px solid #fbbf2455;" title="' + bTitle.replace(/"/g, '&quot;') + '">🩸 ' + bSkill.name + '</span></div>' +
                '<p class="text-xs text-secondary mt-0.5" style="font-size:10px;line-height:1.3;">' + (bSkill.desc || '') + '</p>' +
                '</div>';
            })() +
            '</div>';
        }).join('')}
      </div>
      <div class="bg-card border border-game rounded-xl p-3 flex items-center justify-between gap-2">
        <button class="btn-primary btn-sm" ${dexPage <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''} onclick="window._dexPage=${dexPage - 1};render()">← 上一页</button>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-secondary">第</span>
          <input type="number" min="1" max="${totalPages}" value="${dexPage + 1}" class="w-14 text-center bg-panel border border-game rounded px-1 py-0.5 text-sm" onchange="var p=parseInt(this.value)-1;if(p>=0&&p<${totalPages}){window._dexPage=p;render();}">
          <span class="text-secondary">/ ${totalPages} 页</span>
          <span class="text-xs text-secondary ml-2">（${filteredNames.length} 种）</span>
        </div>
        <button class="btn-primary btn-sm" ${dexPage >= totalPages - 1 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''} onclick="window._dexPage=${dexPage + 1};render()">下一页 →</button>
      </div>
    </main>
  </div>`;
}

function renderTalentScreen() {
  const tp = getTalentPoints();
  const sel = window._talentSel || null;
  // 节点尺寸：small 22 / medium 28 / core 36 / origin 30
  function nodeRadius(type) { return type === 'core' ? 30 : type === 'medium' ? 24 : type === 'origin' ? 26 : 20; }
  // 连接线：从每个节点到其 requires
  var linesHtml = '';
  TALENT_TREE.forEach(function(node) {
    (node.requires || []).forEach(function(reqId) {
      var req = TALENT_TREE.find(function(t){ return t.id === reqId; });
      if (!req) return;
      var reqLv = getTalentLevel(reqId);
      var nodeLv = getTalentLevel(node.id);
      var active = reqLv >= 1 && nodeLv >= 1;
      var branch = TALENT_BRANCHES[node.branch] || { color: '#666' };
      var color = active ? branch.color : '#374151';
      var width = active ? 3 : 1.5;
      var dash = active ? '' : 'stroke-dasharray="4 4"';
      linesHtml += '<line x1="' + req.x + '" y1="' + req.y + '" x2="' + node.x + '" y2="' + node.y + '" stroke="' + color + '" stroke-width="' + width + '" ' + dash + ' opacity="0.7"/>';
    });
  });
  // 节点
  var nodesHtml = TALENT_TREE.map(function(node) {
    var lv = getTalentLevel(node.id);
    var maxed = lv >= node.maxLevel;
    var unlocked = canUnlockTalent(node.id);
    var active = lv >= 1;
    var branch = TALENT_BRANCHES[node.branch] || { color: '#9ca3af' };
    var r = nodeRadius(node.type);
    var fill, stroke, strokeWidth;
    if (node.type === 'origin') {
      fill = active ? '#1f2937' : '#111827'; stroke = '#e5e7eb'; strokeWidth = 3;
    } else if (node.type === 'core') {
      fill = active ? branch.color : '#1f2937'; stroke = active ? '#fde047' : '#374151'; strokeWidth = active ? 4 : 2;
    } else {
      fill = active ? branch.color : '#1f2937'; stroke = active ? branch.color : (unlocked ? '#6b7280' : '#374151'); strokeWidth = active ? 3 : 2;
    }
    var pulseCls = (!active && unlocked && tp > 0 && node.type !== 'origin') ? ' animate-pulse' : '';
    var locked = !active && !unlocked;
    var opacity = locked ? '0.45' : '1';
    // 节点光晕（激活的核心/中天赋）
    var glow = '';
    if (active && (node.type === 'core' || node.type === 'medium')) {
      glow = '<circle cx="' + node.x + '" cy="' + node.y + '" r="' + (r + 6) + '" fill="none" stroke="' + branch.color + '" stroke-width="1.5" opacity="0.4"/>';
    }
    // 等级指示（小圆点环绕）
    var lvlDots = '';
    if (node.type !== 'origin' && node.maxLevel > 1) {
      var dots = Math.min(node.maxLevel, 10);
      for (var d = 0; d < dots; d++) {
        var ang = (Math.PI * 2 * d / dots) - Math.PI / 2;
        var dx = node.x + Math.cos(ang) * (r + 5);
        var dy = node.y + Math.sin(ang) * (r + 5);
        var dotOn = d < lv;
        lvlDots += '<circle cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" r="2.2" fill="' + (dotOn ? '#fde047' : '#374151') + '"/>';
      }
    }
    var cursor = node.type === 'origin' ? 'default' : 'pointer';
    var titleText = node.name + (node.type === 'origin' ? '' : ' Lv.' + lv + '/' + node.maxLevel);
    var clickHandler = node.type === 'origin' ? '' : 'onclick="window._talentSel=\'' + node.id + '\';render()"';
    return '<g' + pulseCls + ' style="cursor:' + cursor + ';opacity:' + opacity + '" ' + clickHandler + '>' +
      glow +
      '<circle cx="' + node.x + '" cy="' + node.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>' +
      '<text x="' + node.x + '" y="' + (node.y + 1) + '" text-anchor="middle" dominant-baseline="middle" font-size="' + (r * 0.9) + '">' + node.icon + '</text>' +
      lvlDots +
      '<title>' + titleText + '</title>' +
      '</g>';
  }).join('');

  // 选中节点详情面板
  var detailHtml = '';
  if (sel) {
    var sn = TALENT_TREE.find(function(t){ return t.id === sel; });
    if (sn) {
      var slv = getTalentLevel(sn.id);
      var smaxed = slv >= sn.maxLevel;
      var scanUp = !smaxed && canUnlockTalent(sn.id) && tp > 0 && sn.type !== 'origin';
      var sbranch = TALENT_BRANCHES[sn.branch] || { color: '#9ca3af', name: '' };
      var typeLabel = sn.type === 'core' ? '核心天赋' : sn.type === 'medium' ? '中天赋' : sn.type === 'origin' ? '星图中心' : '小天赋';
      var starHtml = Array.from({length: sn.maxLevel}, function(_, i) {
        return '<span class="' + (i < slv ? 'text-yellow-400' : 'text-gray-700') + '">★</span>';
      }).join('');
      var reqHtml = (sn.requires || []).map(function(rid) {
        var rdef = TALENT_TREE.find(function(t){ return t.id === rid; });
        var rlv = getTalentLevel(rid);
        return '<span class="text-xs ' + (rlv >= 1 ? 'text-green-400' : 'text-red-400') + '">' + (rdef ? rdef.icon + rdef.name : rid) + (rlv >= 1 ? ' ✓' : ' ✗') + '</span>';
      }).join(' ');
      detailHtml = '<div class="bg-card border-2 rounded-xl p-4" style="border-color:' + sbranch.color + '">' +
        '<div class="flex items-center gap-3 mb-2">' +
        '<div class="text-4xl">' + sn.icon + '</div>' +
        '<div class="flex-1"><div class="flex items-center gap-2"><p class="font-bold text-lg">' + sn.name + '</p>' +
        '<span class="text-xs px-2 py-0.5 rounded" style="background:' + sbranch.color + '22;color:' + sbranch.color + '">' + typeLabel + '</span></div>' +
        '<p class="text-xs" style="color:' + sbranch.color + '">' + sbranch.icon + ' ' + sbranch.name + '</p></div>' +
        '<span class="text-sm ' + (smaxed ? 'text-yellow-400' : 'text-secondary') + '">Lv.' + slv + '/' + sn.maxLevel + '</span>' +
        '</div>' +
        '<div class="text-base mb-2">' + starHtml + '</div>' +
        '<p class="text-xs text-green-400 mb-1">当前：' + sn.desc(slv) + '</p>' +
        (smaxed ? '<p class="text-xs text-yellow-400 mb-2">已满级</p>' : '<p class="text-xs text-secondary mb-2">下级：' + sn.desc(slv + 1) + '</p>') +
        (sn.requires && sn.requires.length ? '<div class="mb-2"><p class="text-xs text-secondary mb-1">前置天赋：</p><div class="flex flex-wrap gap-2">' + reqHtml + '</div></div>' : '') +
        (sn.type === 'origin' ? '<p class="text-xs text-secondary">星图中心已激活，无需升级</p>' :
          '<button class="' + (scanUp ? 'btn-gold' : 'btn-primary') + ' btn-sm w-full" ' + (!scanUp ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') +
          ' onclick="upgradeTalent(\'' + sn.id + '\')">' + (smaxed ? '已满级' : !canUnlockTalent(sn.id) ? '前置未点亮' : tp <= 0 ? '天赋点不足' : '点亮 / 升级 (消耗1点)') + '</button>') +
        '</div>';
  }
  } else {
    detailHtml = '<div class="bg-card border border-game rounded-xl p-4 text-center text-secondary text-sm">点击星图中的节点查看详情并点亮天赋</div>';
  }

  // 星轨图例
  var legendHtml = Object.keys(TALENT_BRANCHES).filter(function(b){ return b !== 'center'; }).map(function(bid) {
    var b = TALENT_BRANCHES[bid];
    return '<span class="text-xs px-2 py-1 rounded" style="background:' + b.color + '22;color:' + b.color + '">' + b.icon + ' ' + b.name + '</span>';
  }).join('');

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🌟 天赋星图</h1>
      <div class="flex gap-3 text-sm items-center">
        <span class="text-yellow-400">⭐ 天赋点 <span class="font-bold text-lg">${tp}</span></span>
        <span class="text-secondary">| 等级 ${G.player.level}/${G.player.maxLevel}</span>
        <span class="text-secondary">| 转生 ${G.player.rebirth}</span>
      </div>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-purple-700 rounded-xl p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-secondary">从中心向外点亮星轨。小天赋→中天赋→核心天赋，核心天赋需一路点亮前置才能解锁。转生后只有突破新等级上限才获得天赋点。</p>
          <div class="flex flex-wrap gap-1">${legendHtml}</div>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-card border border-game rounded-xl p-2 overflow-hidden">
          <svg viewBox="0 0 1000 820" class="w-full h-auto" style="background:radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 70%);">
            ${linesHtml}
            ${nodesHtml}
          </svg>
        </div>
        <div class="space-y-3">
          ${detailHtml}
          <div class="bg-panel border border-game rounded-xl p-3 text-xs text-secondary space-y-1">
            <p class="font-bold text-secondary">📌 天赋规则</p>
            <p>· 升级获得天赋点（转生后仅突破等级给点）</p>
            <p>· 小天赋：基础加成，多点可叠</p>
            <p>· 中天赋：较强加成，需前置小天赋</p>
            <p>· 核心天赋：最强加成，需所有前置点亮</p>
            <p>· 黄色圆点表示已点亮等级</p>
          </div>
        </div>
      </div>
    </main>
  </div>`;
}

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
        '<button class="btn-danger btn-sm text-xs" onclick="sellEquipById(\'' + item.id + '\')">出售</button>' +
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

  var attrHtml = ['力量','体质','敏捷','智力','气血'].map(function(a) {
    var baseVal = a === '气血' ? 50 + lv * 10 : 10 + lv * (a === '力量' ? 3 : 2);
    var eqVal = bonus[a] || 0;
// 需求7：全属性buff加成显示
var buffVal = getFlatBuff('all_stat');
    var total = baseVal + eqVal + buffVal;
    var bonusStr = (eqVal + buffVal) > 0 ? '<p class="text-xs text-green-400">+' + (eqVal + buffVal) + '</p>' : '';
    return '<div class="bg-panel rounded-lg p-2 text-center"><p class="text-secondary">' + a + '</p><p class="font-bold">' + total + '</p>' + bonusStr + '</div>';
  }).join('');

  var petBonusHtml = Object.entries(charBonus).filter(function(e) { return ['力量','体质','敏捷','智力','气血'].indexOf(e[0]) !== -1; }).map(function(e) {
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
    '<p>· 词条池包含19种词条：力量/体质/敏捷/智力/气血/攻击/防御（数值&百分比）、暴击率、闪避率、宠物伤害/防御/气血</p>' +
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
            const icon = shopItem ? shopItem.icon : (item.id === 'moon_dew' ? '🌙' : '📦');
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
    var tabs = [
      { id: 'bag', label: '🎒 宠物装备背包' },
      { id: 'craft', label: '🔨 打造' },
      { id: 'equip', label: '🎽 装备管理' },
    ];
    return '<div class="bg-card border border-game rounded-xl p-1 flex gap-1">' + tabs.map(function(t) {
      var active = peTab === t.id;
      return '<button class="flex-1 text-sm px-3 py-1.5 rounded ' + (active ? 'bg-purple-900 text-purple-300 border border-purple-500' : 'border border-transparent text-secondary hover:bg-panel') + '" onclick="window._peTab=\'' + t.id + '\';render()">' + t.label + '</button>';
    }).join('') + '</div>';
  })();
  // 材料栏：常驻顶部（需求2：按等级分组展示）
  var matHtml = (function() {
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
      { id: 'ancient_rune_low', name: '低级', color: '#9ca3af' },
      { id: 'ancient_rune_mid', name: '中级', color: '#3b82f6' },
      { id: 'ancient_rune_high', name: '高级', color: '#f59e0b' },
    ].map(function(t) {
      var cnt = G.petEquipMaterials[t.id] || 0;
      return '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
        '<div class="text-2xl">📜</div>' +
        '<p class="text-xs mt-1" style="color:' + t.color + '">' + t.name + '远古符文</p>' +
        '<p class="text-gold text-sm">x' + cnt + '</p>' +
        '</div>';
    }).join('');
    return '<div class="bg-card border border-game rounded-xl p-3">' +
      '<div class="flex items-center justify-between mb-2">' +
      '<span class="text-sm font-bold">📦 宠物装备材料</span>' +
      '</div>' +
      '<p class="text-xs text-secondary mb-1">💠 神秘水晶（按品质分级）</p>' +
      '<div class="grid grid-cols-3 gap-2 mb-2">' + crystalRow + '</div>' +
      '<p class="text-xs text-secondary mb-1">📜 远古符文（按品质分级）</p>' +
      '<div class="grid grid-cols-3 gap-2">' + runeRow + '</div>' +
      '</div>';
  })();

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
      '</div>';
  } else if (peTab === 'equip') {
    // 选择宠物的装备管理
    var pets = G.pets || [];
    var pg2 = paginateList('pepets', pets.length, 6);
    var start2 = (pg2.page - 1) * pg2.pageSize;
    var slice2 = pets.slice(start2, start2 + pg2.pageSize);
    contentHtml = '<div class="bg-card border border-game rounded-xl p-4">' +
      '<h2 class="font-bold text-lg mb-3">🎽 宠物装备管理</h2>' +
      '<p class="text-xs text-secondary mb-3">点击宠物进行装备栏管理</p>' +
      (pets.length === 0 ? '<p class="text-secondary text-center py-8">还没有宠物</p>' :
        '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">' +
        slice2.map(function(pet) {
          var pe = pet.petEquipment || { attack: null, hp: null, defense: null };
          var slotsHtml = PET_EQUIP_SLOTS.map(function(slot) {
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
            slotsHtml +
            '</div>';
        }).join('') + '</div>' + pg2.controlsHtml) +
      '</div>';
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
}

// 显示可装备到指定栏位的宠物装备列表
function showPetEquipBagForSlot(petId, slot) {
  var pet = G.pets.find(function(p) { return p.id === petId; });
  if (!pet) return;
  closePetEquipModal();
  var bag = (G.petEquipBag || []).filter(function(e) { return e.slot === slot; });
  var pg = paginateList('peslot_' + slot, bag.length, 8);
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
}

// 从背包点击"装备"时，让用户选择目标宠物
function showPetEquipBagForPet(equipId) {
  var equip = (G.petEquipBag || []).find(function(e) { return e.id === equipId; });
  if (!equip) return;
  var slotInfo = PET_EQUIP_SLOTS.find(function(s) { return s.id === equip.slot; });
  var pets = G.pets || [];
  var pg = paginateList('pepetlist', pets.length, 6);
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
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3">
      <h1 class="font-fantasy text-gold text-lg">📋 日常任务</h1>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">📋 每日任务</h2>
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

function renderRebirthScreen() {
  const canRB = canRebirth();
  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3">
      <h1 class="font-fantasy text-gold text-lg">🔄 转生</h1>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full">
      <div class="bg-card border border-game rounded-xl p-6 text-center max-w-md mx-auto">
        <div class="text-6xl mb-4">🔄</div>
        <h2 class="font-bold text-xl mb-2">转生系统</h2>
        <p class="text-secondary mb-1">当前转生次数：<span class="text-gold font-bold">${G.player.rebirth}</span></p>
        <p class="text-secondary mb-1">等级上限：<span class="text-gold font-bold">${G.player.maxLevel}</span></p>
        <p class="text-secondary mb-1">当前等级：<span class="font-bold">${G.player.level}</span></p>
        <p class="text-secondary mb-3">战力加成：<span class="text-green-400">+${G.player.rebirth * 15}%</span></p>
        ${canRB ? `
          <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-3">
            <p class="text-sm text-yellow-400">⚠️ 转生后等级重置为1，宠物等级也重置为1</p>
            <p class="text-sm text-yellow-400">等级上限提升至 ${G.player.maxLevel + 10}</p>
            <p class="text-sm text-yellow-400">战力永久提升 15%</p>
            <p class="text-sm text-cyan-400">🌟 转生后已获得天赋点的等级不重复发放，只有突破新等级上限（${G.player.maxLevel + 1}~${G.player.maxLevel + 10}级）才获得新天赋点</p>
          </div>
          <button class="btn-gold text-lg px-8 py-3" onclick="doRebirthUI()">✨ 转生</button>
        ` : `
          <p class="text-secondary">需要达到 ${G.player.maxLevel} 级才能转生</p>
          <div class="progress-bar mt-2"><div class="progress-fill bg-gradient-to-r from-purple-500 to-blue-500" style="width:${Math.floor(G.player.level/G.player.maxLevel*100)}%"></div></div>
          <p class="text-xs text-secondary mt-1">${G.player.level}/${G.player.maxLevel}</p>
        `}
        <div class="mt-4 p-3 bg-panel rounded-lg text-left text-xs text-secondary space-y-1">
          <p>📌 转生规则：</p>
          <p>· 满级后可转生，等级上限+10</p>
          <p>· 每次转生战力永久提升15%</p>
          <p>· 宠物等级跟随人物重置为1</p>
          <p>· 出战宠物保留，无需重新获取</p>
          <p>· 转生后升级速度更快</p>
          <p>· 🌟 已获得天赋点的等级转生后不重复发放，仅突破新等级上限才给天赋点</p>
        </div>
      </div>
    </main>
  </div>`;
}

function renderFusionScreen() {
  var sheet = window._evoSheet || 'fusion';
  var sheetTabs = [
    { id: 'fusion', label: '融合', icon: '⚗️' },
    { id: 'rebirth', label: '重生', icon: '🔄' },
    { id: 'bloodline', label: '血统', icon: '🔮' },
    { id: 'advance', label: '进阶', icon: '⭐' },
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
                    var ob = BLOODLINE_SKILLS.find(function(b) { return b.id === blPet.bloodlineOrb.bloodlineId; });
                    return ob ? ob.name : '未知';
                  })() + '·' + BLOOD_ORB_QUALITY_NAMES[blPet.bloodlineOrb.quality] +
                  '（来源：' + blPet.bloodlineOrb.sourcePetName + '）</p>' +
                '<button class="btn-danger text-xs mt-2" onclick="removePetBloodlineOrb(\'' + blPet.id + '\')">取出当前血统珠</button>'
              ) : '<p class="text-secondary mt-2">未植入血统珠（使用种族原生血统）</p>') +
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
        var qColor = BLOOD_ORB_QUALITY_COLORS[orb.quality] || '#9ca3af';
        var qName = BLOOD_ORB_QUALITY_NAMES[orb.quality] || orb.quality;
        var decompTier = BLOOD_ORB_DECOMPOSE_RULES[orb.quality];
        var decompDef = decompTier ? BLOOD_ORB_TIERS.find(function(t) { return t.id === decompTier; }) : null;
        contentHtml += '<div class="bg-panel rounded-lg p-2 border border-game flex items-center justify-between gap-2">' +
          '<div class="flex-1 text-xs">' +
            '<p class="font-bold" style="color:' + qColor + ';">' + (ob ? ob.name : '未知血统') + '·' + qName + '</p>' +
            '<p class="text-secondary">来源：' + orb.sourcePetName + '（' + (orb.sourcePetRace || '?') + '）</p>' +
            '<p class="text-secondary">' + (ob ? ob.desc : '') + '</p>' +
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
  } else if (sheet === 'advance') {
    // ===== 宠物进阶 sheet（需求3） =====
    contentHtml = renderAdvanceSheet();
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

// 需求3：进阶 sheet 渲染
function renderAdvanceSheet() {
  // v2.2.0 需求2：宠物进阶功能等级锁定
  var advanceUnlockLv = getFeatureUnlockLevel('pet_advance');
  if (!isFeatureUnlocked('pet_advance')) {
    return '<div class="bg-card border border-game rounded-xl p-6 text-center">' +
      '<div class="text-4xl mb-3">🔒</div>' +
      '<p class="text-secondary text-sm">宠物进阶功能将在 <span class="text-gold font-bold">Lv.' + advanceUnlockLv + '</span> 解锁</p>' +
      '<p class="text-xs text-secondary mt-2">进阶导师微笑着说：「当你足够强大时，再来找我学习进阶之道吧。」</p>' +
      '</div>';
  }
  var selectedPetId = window._advancePetId || '';
  var selectedPet = selectedPetId ? G.pets.find(function(p) { return p.id === selectedPetId; }) : null;
  var advInfo = selectedPet ? getPetAdvanceInfo(selectedPet) : null;
  // 进阶丸库存
  var pillLow = (G.inventory.find(function(i) { return i.id === 'advance_pill_low'; }) || { count: 0 }).count;
  var pillMid = (G.inventory.find(function(i) { return i.id === 'advance_pill_mid'; }) || { count: 0 }).count;
  var pillHigh = (G.inventory.find(function(i) { return i.id === 'advance_pill_high'; }) || { count: 0 }).count;

  var html = '<div class="bg-card border border-game rounded-xl p-4 mb-4">' +
    '<h2 class="font-bold text-lg mb-2">⭐ 宠物进阶</h2>' +
    '<p class="text-xs text-secondary mb-3">选择一只可进阶的宠物，使用进阶丸累积进阶值。T3→T6 需要 2000 进阶值。进阶后宠物的成长、资质、技能和血统技能都会大幅强化。</p>' +
    '<div class="mb-4">' +
      '<p class="text-sm font-bold mb-2">选择宠物（可进阶宠物高亮显示，点击选择）</p>' +
      // 需求6：用宠物卡片网格替代下拉列表，修复点击无法选中的交互问题
      '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">' +
      G.pets.map(function(p) {
        var stage = p.advanceStage || 0;
        var adv = getPetAdvanceInfo(p);
        var canAdv = !!adv;
        var stageLabel = stage === 0 ? '基础' : stage === 1 ? '进阶+1' : '进阶+2';
        var isSelected = selectedPetId === p.id;
        // 需求6：可进阶宠物绿色高亮边框，不可进阶灰色半透明
        var borderCls = isSelected ? 'border-yellow-500 bg-yellow-900/30' :
                        canAdv ? 'border-green-600 bg-green-900/20 cursor-pointer hover:bg-green-900/40' :
                        'border-game bg-panel opacity-40 cursor-not-allowed';
        var badge = canAdv ? '<span class="text-[10px] text-green-400 font-bold">✅ 可进阶</span>' : '<span class="text-[10px] text-secondary">不可进阶</span>';
        var advText = adv ? ' → ' + adv.nextName : '';
        var clickHandler = canAdv ? ('onclick="selectAdvancePet(\'' + p.id + '\')"') : '';
        return '<div class="border rounded-lg p-2 ' + borderCls + '" ' + clickHandler + '>' +
          '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-xs font-bold">' + getPetDisplayName(p) + '</span>' +
          badge +
          '</div>' +
          '<div class="text-[10px] text-secondary">' + stageLabel + advText + '</div>' +
          (adv ? '<div class="text-[10px] text-yellow-400">进阶值 ' + (p.advanceValue||0) + '/' + adv.threshold + '</div>' : '<div class="text-[10px] text-secondary">—</div>') +
        '</div>';
      }).join('') +
      '</div>' +
    '</div>';

  if (selectedPet && advInfo) {
    var curDex = getPetDex(selectedPet.name);
    var nextDex = getPetDex(advInfo.nextName);
    var curStage = selectedPet.advanceStage || 0;
    var nextStage = advInfo.nextStage;
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">' +
      // 当前形态
      '<div class="bg-panel rounded-lg p-3 border border-game">' +
        '<h3 class="font-bold text-sm mb-2 text-cyan-400">📋 当前形态</h3>' +
        '<div class="text-xs space-y-1">' +
          '<p><span class="text-secondary">名称：</span>' + selectedPet.name + (curStage > 0 ? ' (进阶+' + curStage + ')' : ' (基础)') + '</p>' +
          '<p><span class="text-secondary">成长：</span><span class="text-gold font-bold">' + (selectedPet.growth || 0).toFixed(2) + '</span></p>' +
          APTITUDE_KEYS.map(function(k) {
            return '<p><span class="text-secondary">' + k.replace('资质','') + '：</span>' + (selectedPet.aptitude[k] || 0) + '</p>';
          }).join('') +
          '<p><span class="text-secondary">进阶值：</span><span class="text-yellow-400 font-bold">' + (selectedPet.advanceValue||0) + '/' + advInfo.threshold + '</span></p>' +
        '</div>' +
      '</div>' +
      // 进化后预览
      '<div class="bg-panel rounded-lg p-3 border-2 border-yellow-500/50">' +
        '<h3 class="font-bold text-sm mb-2 text-yellow-400">✨ 进化预览 → ' + advInfo.nextName + '</h3>' +
        '<div class="text-xs space-y-1">' +
          '<p><span class="text-secondary">名称：</span>' + advInfo.nextName + ' (进阶+' + nextStage + ')</p>' +
          '<p><span class="text-secondary">成长范围：</span><span class="text-gold font-bold">' + (nextDex.growthRange[0]).toFixed(1) + ' ~ ' + (nextDex.growthRange[1]).toFixed(1) + '</span></p>' +
          APTITUDE_KEYS.map(function(k) {
            var range = nextDex.aptRange[k] || [1200, 1800];
            return '<p><span class="text-secondary">' + k.replace('资质','') + '：</span>' + range[0] + '~' + range[1] + '</p>';
          }).join('') +
          '<p><span class="text-secondary">种族：</span>' + nextDex.race + '</p>' +
          '<p class="text-yellow-400 mt-1">血统技能强化 ' + (nextStage === 1 ? '1.5' : '2.0') + '倍</p>' +
        '</div>' +
      '</div>' +
    '</div>';

    // 进阶进度条
    var pct = Math.min(100, Math.floor((selectedPet.advanceValue||0) / advInfo.threshold * 100));
    html += '<div class="bg-panel rounded-lg p-3 mb-3">' +
      '<div class="flex items-center justify-between text-xs mb-1">' +
        '<span class="text-secondary">进阶进度</span>' +
        '<span class="text-yellow-400 font-bold">' + (selectedPet.advanceValue||0) + ' / ' + advInfo.threshold + ' (' + pct + '%)</span>' +
      '</div>' +
      '<div class="bg-gray-800 rounded h-3 overflow-hidden"><div class="h-full rounded bg-gradient-to-r from-yellow-600 to-orange-500" style="width:' + pct + '%"></div></div>' +
    '</div>';

    // 使用进阶丸按钮
    html += '<div class="grid grid-cols-3 gap-2 mb-3">' +
      '<button class="btn-primary" ' + (pillLow <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="useAdvancePill(\'' + selectedPet.id + '\',\'low\')">💊 低级进阶丸 (x' + pillLow + ')<br><span class="text-xs text-secondary">+10~30</span></button>' +
      '<button class="btn-primary" ' + (pillMid <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="useAdvancePill(\'' + selectedPet.id + '\',\'mid\')">💉 中级进阶丸 (x' + pillMid + ')<br><span class="text-xs text-secondary">+50~100</span></button>' +
      '<button class="btn-gold" ' + (pillHigh <= 0 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="useAdvancePill(\'' + selectedPet.id + '\',\'high\')">🌟 高级进阶丸 (x' + pillHigh + ')<br><span class="text-xs text-secondary">+200~500</span></button>' +
    '</div>';
  } else if (selectedPet && !advInfo) {
    html += '<p class="text-xs text-yellow-400 text-center py-4">该宠物已达到最高进阶阶段或不可进阶</p>';
  }

  // 进阶丸库存
  html += '<div class="bg-card border border-game rounded-xl p-4">' +
    '<h3 class="font-bold text-sm mb-2">📦 进阶丸库存</h3>' +
    '<div class="grid grid-cols-3 gap-2 text-xs">' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-green-400">低级</p><p class="text-yellow-400 font-bold">x' + pillLow + '</p><p class="text-secondary">+10~30</p></div>' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-blue-400">中级</p><p class="text-yellow-400 font-bold">x' + pillMid + '</p><p class="text-secondary">+50~100</p></div>' +
      '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-orange-400">高级</p><p class="text-yellow-400 font-bold">x' + pillHigh + '</p><p class="text-secondary">+200~500</p></div>' +
    '</div>' +
    '<p class="text-xs text-secondary mt-2">📌 通过「活动 → 进阶试炼」获取进阶丸，也可在商城购买</p>' +
  '</div>';

  html += '</div>';
  return html;
}

// 需求3：选择进阶宠物
function selectAdvancePet(petId) {
  window._advancePetId = petId;
  render();
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

function generateOpponentPets(cp) {
  const pets = [];
  const races = ['史莱姆', '龙', '恶魔', '天使', '哥布林', '精灵'];
  const rarities = ['common', 'uncommon', 'rare', 'epic'];
  for (let i = 0; i < 3; i++) {
    const race = races[randomInt(0, races.length - 1)];
    const rarity = rarities[randomInt(0, Math.min(3, rarities.length - 1))];
    const lv = G.player.level + randomInt(-3, 3);
    const growth = 1.5 + Math.random() * 1.5;
    const attrs = {};
    ATTRIBUTES.forEach(a => { attrs[a] = randomInt(10, 25); });
    attrs.气血 = attrs.体质 * 5 + randomInt(20, 40);
    attrs.法力 = attrs.智力 * 3 + randomInt(10, 25);
    var oppApt = {};
    APTITUDE_KEYS.forEach(function(k) { oppApt[k] = randomInt(1200, 2000); });
    pets.push({
      id: 'opp_pet_' + Date.now() + '_' + i + '_' + randomInt(100, 999),
      name: race + '·' + ['战士','法师','守卫'][i],
      race, rarity, level: Math.max(1, lv), growth,
      attributes: attrs, aptitude: oppApt, innateSkills: [], learnedSkills: [], moonDewUsed: 0,
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

function renderActivityScreen() {
  var sheet = window._activitySheet || 'treasure';
  var sheetTabs = [
    { id: 'treasure', label: '打宝图', icon: '🗺️' },
    { id: 'tower', label: '爬塔', icon: '🗼' },
    { id: 'arena', label: '竞技场', icon: '⚔️' },
    { id: 'advance', label: '进阶试炼', icon: '⭐' },
    { id: 'formation', label: '押镖', icon: '🛡️' },       // 需求2
    { id: 'skillbook', label: '技能秘境', icon: '📚' },   // 需求6
    { id: 'petcave', label: '宠物秘境', icon: '🐾' },     // 需求12
{ id: 'dispatch', label: '派遣奇遇', icon: '🎒' },     // 派遣系统
{ id: 'fortress', label: '血色要塞', icon: '🏰' },     // 需求5：血色要塞
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
    var onclickStr = isLocked ? '' : 'onclick="window._activitySheet=\'' + t.id + '\';render()"';
    return '<button class="text-xs px-3 py-1 rounded border ' + (active ? 'bg-purple-900 text-purple-300 border-purple-500 font-bold' : 'border-game text-secondary') + lockCls + '"' + (onclickStr ? ' ' + onclickStr : '') + ' title="' + (isLocked ? '需要' + lockLv + '级解锁' : '') + '">' + t.icon + ' ' + t.label + lockSuffix + '</button>';
  }).join('');

  // 需求5：如果当前选中的活动被锁定，自动切回第一个解锁的
  var currentTabLocked = false;
  if (typeof ACTIVITY_TAB_FEATURE_MAP !== 'undefined' && ACTIVITY_TAB_FEATURE_MAP[sheet]) {
    var curFeatId = ACTIVITY_TAB_FEATURE_MAP[sheet];
    if (typeof isFeatureUnlocked === 'function' && !isFeatureUnlocked(curFeatId)) {
      currentTabLocked = true;
    }
  }
  if (currentTabLocked) {
    sheet = 'tower'; // 默认切换到爬塔（无等级限制）
    window._activitySheet = 'tower';
  }

  var contentHtml = '';
  if (sheet === 'treasure') {
    contentHtml = renderActivityTreasure();
  } else if (sheet === 'tower') {
    contentHtml = renderActivityTower();
  } else if (sheet === 'arena') {
    contentHtml = renderActivityArena();
  } else if (sheet === 'advance') {
    contentHtml = renderActivityAdvance();
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
  
  return '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-3">' +
      '<h2 class="font-bold text-lg text-red-400">🏰 血色要塞</h2>' +
      '<span class="text-xs text-secondary">今日剩余：' + remaining + ' 次</span>' +
    '</div>' +
    '<p class="text-sm text-secondary mb-3">血色要塞是一个无限轮次的Roguelike战斗活动。每5关可选择一次增益buff，怪物每5关整体强化5%。战斗失败时按击杀数结算奖励，经验为正常的3倍。</p>' +
    '<div class="space-y-3">' + diffHtml + '</div>' +
  '</div>' +
  (typeof renderActivityHarvestLog === 'function' ? renderActivityHarvestLog('fortress', '血色要塞收获日志') : '');
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

  return resultHtml +
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

  return '<div class="bg-card border border-game rounded-xl p-4 text-center">' +
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

  return '<div class="bg-card border border-game rounded-xl p-4">' +
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
      '<p class="text-xs text-secondary mb-3">每天可领取少量奖励，奖励随段位提升：💎' + (5 + rankIdx * 3) + ' 🪙' + (200 + rankIdx * 200) + '</p>' +
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

// 活动页 - 进阶试炼（需求3：替换血统试炼）
function renderActivityAdvance() {
  var today = new Date().toDateString();
  var doneToday = G.advanceTrialUsed && G.advanceTrialUsed[today];
  var unlocked = G.player.level >= ADVANCE_TRIAL.minLevel;
  var cp = Math.floor(getPlayerCombatPower());
  // 找到当前战力所属档位
  var currentTier = ADVANCE_TRIAL.tiers[0];
  var currentTierIdx = 0;
  for (var i = 0; i < ADVANCE_TRIAL.tiers.length; i++) {
    if (cp >= ADVANCE_TRIAL.tiers[i].cpMin) { currentTier = ADVANCE_TRIAL.tiers[i]; currentTierIdx = i; }
  }
  var pillNameMap = { advance_pill_low: '低级进阶丸', advance_pill_mid: '中级进阶丸', advance_pill_high: '高级进阶丸' };

  var statusBadge = doneToday
    ? '<span class="text-xs px-2 py-0.5 rounded bg-green-900 text-green-400 border border-green-700">今日已完成</span>'
    : '<span class="text-xs px-2 py-0.5 rounded bg-yellow-900 text-yellow-400 border border-yellow-700">今日可挑战</span>';

  // 10档奖励展示
  var tiersHtml = ADVANCE_TRIAL.tiers.map(function(t, i) {
    var pillName = pillNameMap[t.pill] || t.pill;
    var pillColor = t.pill === 'advance_pill_high' ? '#f97316' : t.pill === 'advance_pill_mid' ? '#3b82f6' : '#22c55e';
    var isCurrent = i === currentTierIdx;
    var isUnlocked = cp >= t.cpMin;
    return '<div class="bg-panel rounded p-2 text-center ' + (isCurrent ? 'border-2 border-yellow-500' : 'border border-game') + '" style="' + (isUnlocked ? '' : 'opacity:0.5;') + '">' +
      '<p class="text-xs text-secondary">第' + (i+1) + '档</p>' +
      '<p class="text-xs font-bold" style="color:' + pillColor + '">' + pillName + '</p>' +
      '<p class="text-yellow-400 font-bold">×' + t.count + '</p>' +
      '<p class="text-xs text-secondary">战力≥' + t.cpMin.toLocaleString() + '</p>' +
      (isCurrent ? '<p class="text-xs text-yellow-400 font-bold mt-1">← 当前</p>' : '') +
    '</div>';
  }).join('');

  // 进阶丸库存
  var pillLowCnt = (G.inventory.find(function(i) { return i.id === 'advance_pill_low'; }) || { count: 0 }).count;
  var pillMidCnt = (G.inventory.find(function(i) { return i.id === 'advance_pill_mid'; }) || { count: 0 }).count;
  var pillHighCnt = (G.inventory.find(function(i) { return i.id === 'advance_pill_high'; }) || { count: 0 }).count;

  return '<div class="bg-card border border-game rounded-xl p-4">' +
    '<div class="flex items-center justify-between mb-2">' +
      '<h2 class="font-bold text-lg">⭐ 进阶试炼</h2>' + statusBadge +
    '</div>' +
    '<p class="text-xs text-secondary mb-3">' + ADVANCE_TRIAL.desc + '。挑战后按当前战力获得对应档位的进阶丸奖励。</p>' +
    '<div class="bg-panel rounded-lg p-3 mb-3 text-xs">' +
      '<p class="text-secondary mb-1">📋 活动规则：</p>' +
      '<p>· 需要 Lv.' + ADVANCE_TRIAL.minLevel + ' 解锁</p>' +
      '<p>· 每日限1次挑战，使用当前出战队伍</p>' +
      '<p>· 共10档奖励，战力越高奖励越丰厚</p>' +
      '<p>· 当前战力：<span class="text-cyan-400 font-bold">' + cp.toLocaleString() + '</span> → 第 <span class="text-yellow-400 font-bold">' + (currentTierIdx + 1) + '</span> 档</p>' +
      '<p>· 预计获得：<span class="text-yellow-400 font-bold">' + pillNameMap[currentTier.pill] + ' ×' + currentTier.count + '</span></p>' +
    '</div>' +
    '<div class="mb-3">' +
      '<p class="text-sm font-bold mb-2">🏆 奖励档次（共10档）</p>' +
      '<div class="grid grid-cols-2 sm:grid-cols-5 gap-2">' + tiersHtml + '</div>' +
    '</div>' +
    '<button class="btn-gold w-full" ' + (!unlocked || doneToday ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + ' onclick="startAdvanceTrial()">' +
      (!unlocked ? '🔒 需要 Lv.' + ADVANCE_TRIAL.minLevel + ' 解锁' : doneToday ? '✅ 今日已完成' : '⚔️ 开始进阶试炼') +
    '</button>' +
    '<div class="mt-4">' +
      '<p class="text-sm font-bold mb-2">📦 当前进阶丸库存</p>' +
      '<div class="grid grid-cols-3 gap-2">' +
        '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-green-400 text-sm">低级</p><p class="text-yellow-400 font-bold">x' + pillLowCnt + '</p><p class="text-xs text-secondary">+10~30</p></div>' +
        '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-blue-400 text-sm">中级</p><p class="text-yellow-400 font-bold">x' + pillMidCnt + '</p><p class="text-xs text-secondary">+50~100</p></div>' +
        '<div class="bg-panel rounded p-2 text-center border border-game"><p class="font-bold text-orange-400 text-sm">高级</p><p class="text-yellow-400 font-bold">x' + pillHighCnt + '</p><p class="text-xs text-secondary">+200~500</p></div>' +
      '</div>' +
    '</div>' +
    '<p class="text-xs text-yellow-400 mt-3">💡 提示：进阶丸用于在「进化 → 进阶」页面提升宠物进阶值，达到阈值后宠物进化为更高T级的加强版。</p>' +
  '</div>' +
  renderActivityHarvestLog('advance', '进阶试炼收获日志');
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

  var html = '<div class="bg-card border border-game rounded-xl p-4">' +
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

  var html = '<div class="bg-card border border-game rounded-xl p-4">' +
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
    '<p class="text-xs text-secondary mb-3">闲置宠物派遣至已通关地图探索，最多 3 只组队，总战力达标即可出发；战力越高，奖励越丰厚。</p>';

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
        ancient_rune_low: '📜', ancient_rune_mid: '📜', ancient_rune_high: '📜' };
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
  return {
    id: 'tmap_' + Date.now() + '_' + randomInt(1000, 9999),
    rarity, name: rarityInfo ? rarityInfo.name : '藏宝图', icon: rarityInfo ? rarityInfo.icon : '🗺️',
    affixes, special,
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
  var digLensItem = G.inventory.find(function(i) { return i.id === 'dig_lens'; });
  var digLensCount = digLensItem ? digLensItem.count : 0;
  var digKeyItem = G.inventory.find(function(i) { return i.id === 'dig_key'; });
  var digKeyCount = digKeyItem ? digKeyItem.count : 0;

  // 道具栏HTML（共用）
  var toolsHtml = '<div class="grid grid-cols-4 gap-2 mb-4">' +
    '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
      '<div class="text-2xl">🗺️</div><p class="text-xs mt-1 text-yellow-400">密藏图</p><p class="text-gold text-sm font-bold">×' + digMapCount + '</p>' +
    '</div>' +
    '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
      '<div class="text-2xl">⛏️</div><p class="text-xs mt-1 text-cyan-300">探宝铲</p><p class="text-gold text-sm font-bold">×' + digShovelCount + '</p>' +
    '</div>' +
    '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
      '<div class="text-2xl">🔍</div><p class="text-xs mt-1 text-purple-300">透视镜</p><p class="text-gold text-sm font-bold">×' + digLensCount + '</p>' +
    '</div>' +
    '<div class="bg-panel border border-game rounded-lg p-2 text-center">' +
      '<div class="text-2xl">🗝️</div><p class="text-xs mt-1 text-orange-300">密藏钥匙</p><p class="text-gold text-sm font-bold">×' + digKeyCount + '</p>' +
    '</div>' +
  '</div>';

  // 格子类型图例
  var legendHtml = '<div class="flex flex-wrap gap-2 justify-center mb-4">' +
    DIG_CELL_TYPES.map(function(t) {
      return '<span class="text-xs px-2 py-1 rounded bg-panel border border-game" style="color:' + t.color + '">' + t.icon + ' ' + t.name + '</span>';
    }).join('') +
  '</div>';

  var content = '';

  if (G.digSession) {
    // ===== 挖掘进行中 =====
    var s = G.digSession;
    var selectedCell = window._digSelectedCell;

    // 渲染九宫格
    var gridHtml = '<div class="dig-grid">';
    for (var i = 0; i < 9; i++) {
      var cell = s.grid[i];
      var cellClass = 'dig-cell ';
      var cellContent = '';
      if (cell.revealed) {
        cellClass += 'dig-cell-revealed';
        var typeInfo = DIG_CELL_TYPES.find(function(t) { return t.type === cell.type; });
        var bgColor = typeInfo ? typeInfo.color : '#333';
        cellContent = '<div class="dig-cell-icon">' + (cell.reward ? cell.reward.icon : (typeInfo ? typeInfo.icon : '⬜')) + '</div>';
        if (cell.reward) {
          cellContent += '<div class="dig-cell-label" style="color:' + (cell.reward.color || '#fff') + '">' + cell.reward.name + '</div>';
        } else {
          cellContent += '<div class="dig-cell-label" style="color:' + bgColor + '">' + (typeInfo ? typeInfo.name : '') + '</div>';
        }
        cellContent = '<div style="background:linear-gradient(135deg,' + bgColor + '22,' + bgColor + '11);width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">' + cellContent + '</div>';
      } else if (cell.peeked) {
        cellClass += 'dig-cell-peeked';
        if (selectedCell === i) cellClass += ' dig-cell-selected';
        var peekTypeInfo = DIG_CELL_TYPES.find(function(t) { return t.type === cell.type; });
        cellContent = '<div class="dig-cell-icon" style="opacity:0.5">' + (peekTypeInfo ? peekTypeInfo.icon : '❓') + '</div>';
        cellContent += '<div class="text-[9px] text-purple-300 mt-1">已透视</div>';
        cellContent = '<div onclick="selectDigCell(' + i + ')" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">' + cellContent + '</div>';
      } else {
        cellClass += 'dig-cell-hidden';
        if (selectedCell === i) cellClass += ' dig-cell-selected';
        cellContent = '<div class="dig-cell-icon">❓</div>';
        cellContent = '<div onclick="selectDigCell(' + i + ')" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;">' + cellContent + '</div>';
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
    var foundHtml = foundParts.length > 0 ? foundParts.join('　') : '<span class="text-secondary">暂无收获</span>';

    // 工具操作区
    var toolBarHtml = '<div class="bg-panel border border-game rounded-xl p-3 mb-3">' +
      '<div class="flex items-center justify-between mb-2">' +
        '<span class="text-sm font-bold text-yellow-400">⛏️ 剩余挖掘次数：' + s.digsLeft + '</span>' +
        '<span class="text-xs text-secondary">已挖 ' + s.grid.filter(function(c) { return c.revealed; }).length + '/9 格</span>' +
      '</div>' +
      '<div class="grid grid-cols-3 gap-2">' +
        '<button class="btn-sm ' + (digLensCount > 0 && selectedCell !== undefined ? 'btn-primary' : 'border border-game text-secondary') + '" ' +
          'style="' + (digLensCount <= 0 || selectedCell === undefined ? 'opacity:0.5;cursor:not-allowed;' : '') + '" ' +
          (digLensCount > 0 && selectedCell !== undefined ? 'onclick="useDigLens(' + selectedCell + ')"' : '') + '>' +
          '🔍 透视 (×' + digLensCount + ')</button>' +
        '<button class="btn-sm ' + (digShovelCount > 0 && s.digsLeft < 9 ? 'btn-primary' : 'border border-game text-secondary') + '" ' +
          'style="' + (digShovelCount <= 0 || s.digsLeft >= 9 ? 'opacity:0.5;cursor:not-allowed;' : '') + '" ' +
          (digShovelCount > 0 && s.digsLeft < 9 ? 'onclick="useDigShovel()"' : '') + '>' +
          '⛏️ 探宝铲 (×' + digShovelCount + ')</button>' +
        '<button class="btn-sm ' + (digKeyCount > 0 && !s.keyUsed ? 'btn-gold' : 'border border-game text-secondary') + '" ' +
          'style="' + (digKeyCount <= 0 || s.keyUsed ? 'opacity:0.5;cursor:not-allowed;' : '') + '" ' +
          (digKeyCount > 0 && !s.keyUsed ? 'onclick="showToast(\'🗝️ 钥匙会在挖到锁宝箱时自动使用\', \'info\')"' : '') + '>' +
          '🗝️ 钥匙' + (s.keyUsed ? '(已用)' : ' (×' + digKeyCount + ')') + '</button>' +
      '</div>' +
      (selectedCell !== undefined ? '<p class="text-xs text-center text-yellow-400 mt-2">已选中第 ' + (selectedCell + 1) + ' 格，点击「透视」查看内容</p>' : '<p class="text-xs text-center text-secondary mt-2">点击未挖掘的格子可挖掘，先选中再点透视可预览</p>') +
    '</div>';

    content = `
    <div class="bg-card border border-game rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-lg text-yellow-400">⛏️ 挖密藏进行中</h2>
        <button class="btn-danger btn-sm" onclick="endDigSession()">结束挖宝</button>
      </div>
      ${toolBarHtml}
      ${gridHtml}
      <div class="mt-4 text-center">
        <p class="text-xs text-secondary mb-1">本期收获</p>
        <p class="text-sm">${foundHtml}</p>
      </div>
      <div class="mt-3 text-center">
        <p class="text-xs text-cyan-300">提示：锁宝箱🔒需要钥匙才能开启，陷阱💥会额外消耗1次挖掘机会</p>
      </div>
    </div>`;
  } else {
    // ===== 无进行中的会话：展示入口 =====
    content = `
    <div class="bg-card border border-game rounded-xl p-4">
      <div class="text-center mb-4">
        <div class="text-5xl mb-2">⛏️🗺️</div>
        <h2 class="font-bold text-xl text-yellow-400 mb-1">挖密藏</h2>
        <p class="text-xs text-secondary">消耗密藏图开启九宫格挖宝，初始4次挖掘机会</p>
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
      ${legendHtml}
      <div class="bg-panel border border-game rounded-lg p-3 space-y-1">
        <p class="text-xs text-yellow-400 font-bold mb-1">📜 玩法说明</p>
        <p class="text-xs text-secondary">• 消耗1张密藏图开启一局，3×3九宫格中暗藏宝物与陷阱</p>
        <p class="text-xs text-secondary">• 初始4次挖掘机会，点击格子进行挖掘</p>
        <p class="text-xs text-secondary">• 🔍 透视镜：选中格子后透视，不消耗挖掘次数</p>
        <p class="text-xs text-secondary">• ⛏️ 探宝铲：增加1次挖掘机会（上限9次）</p>
        <p class="text-xs text-secondary">• 🗝️ 密藏钥匙：开启锁宝箱格（挖到时自动消耗）</p>
        <p class="text-xs text-secondary">• 💥 陷阱：额外损失1次挖掘机会</p>
        <p class="text-xs text-orange-400">• 🌟 黄金宝藏：彩蛋级奖励，含钻石+高阶宠物蛋+月华露</p>
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
  var newMap = {
    id: 'tmap_' + Date.now() + '_' + randomInt(1000, 9999),
    rarity: nextR.id, name: nextR.name, icon: nextR.icon,
    affixes: resultAffixes, special: special,
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
  // 删除两张原图（从大到小索引）
  var toDelete = [s0, s1].sort(function(a, b) { return b - a; });
  toDelete.forEach(function(idx) { G.treasureMaps.splice(idx, 1); });
  var newMap = {
    id: 'tmap_' + Date.now() + '_' + randomInt(1000, 9999),
    rarity: nextR.id, name: nextR.name, icon: nextR.icon,
    affixes: resultAffixes, special: special,
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
    if (currentScreen === 'main') render();
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
  if (liveBattle) setTimeout(() => renderBattleArena(), 50);
}

function removeFromTeam(slot) {
  G.player.activeTeam[slot] = null;
  selectingTeamSlot = -1;
  if (autoBattleInterval) { stopLiveBattle(); if (getTeamPets().length > 0) spawnMonster(); }
  saveGame();
  render();
  if (liveBattle) setTimeout(() => renderBattleArena(), 50);
  showToast('宠物已卸下', 'info');
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
      var qColor = (typeof BLOOD_ORB_QUALITY_COLORS !== 'undefined') ? (BLOOD_ORB_QUALITY_COLORS[orb.quality] || '#9ca3af') : '#9ca3af';
      var qName = (typeof BLOOD_ORB_QUALITY_NAMES !== 'undefined') ? (BLOOD_ORB_QUALITY_NAMES[orb.quality] || orb.quality) : orb.quality;
      var canApply = !pet.bloodlineOrb || pet.bloodlineOrb.orbItemId !== orb.id;
      listHtml += '<div class="bg-panel rounded-lg p-2 border border-game flex items-center justify-between gap-2">' +
        '<div class="flex-1 text-xs">' +
          '<p class="font-bold" style="color:' + qColor + ';">' + (ob ? ob.name : '未知血统') + '·' + qName + '</p>' +
          '<p class="text-secondary">来源：' + (orb.sourcePetName || '?') + '（' + (orb.sourcePetRace || '?') + '）</p>' +
          '<p class="text-secondary">' + (ob ? ob.desc : '') + '</p>' +
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
  if (!pet.aptitude) pet.aptitude = { 力量资质:1500, 体质资质:1500, 敏捷资质:1500, 智力资质:1500 };
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
  if (liveBattle) setTimeout(() => renderBattleArena(), 50);
}

function releasePet(petId) {
  G.pets = G.pets.filter(p => p.id !== petId);
  G.player.activeTeam = G.player.activeTeam.map(id => id === petId ? null : id);
  if (autoBattleInterval) {
    stopLiveBattle();
    if (getTeamPets().length > 0) spawnMonster();
  }
  saveGame();
  render();
  if (liveBattle) setTimeout(() => renderBattleArena(), 50);
  showToast('宠物已放生', 'info');
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

function sellEquip(bagIdx) {
  const item = G.equipmentBag[bagIdx];
  if (!item) return;
  const rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
  const sellPrice = (item.level * 10 + rarityIdx * 50) * (1 + rarityIdx);
  addGold(sellPrice);
  G.equipmentBag.splice(bagIdx, 1);
  showToast(`出售 ${item.name} 获得 ${sellPrice} 金币`, 'success');
  saveGame();
  render();
}

function equipItemById(itemId) {
  const idx = G.equipmentBag.findIndex(e => e.id === itemId);
  if (idx === -1) return;
  equipItem(idx);
}

function sellEquipById(id) {
  const idx = G.equipmentBag.findIndex(e => e.id === id);
  if (idx === -1) return;
  const item = G.equipmentBag[idx];
  const rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
  const price = (item.level * 10 + (rarityIdx + 1) * 50);
  addGold(price);
  G.equipmentBag.splice(idx, 1);
  saveGame();
  render();
  showToast(`出售 ${item.name} 获得 ${price} 金币`, 'success');
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
const PET_EQUIP_CAVE_FALLBACK = { id: 'pet_equip_cave', name: '宠物秘境', type: 'special', minLv: 20, desc: '挑战神秘秘境，获取宠物装备', ticketItem: 'pet_ticket' };

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
  const rewardItem = pickRandom(dungeon.rewards);
  const existing = G.inventory.find(it => it.id === rewardItem);
  if (existing) existing.count++;
  else G.inventory.push({ id: rewardItem, count: 1 });
  addBattleLog('loot', `📦 获得 ${getItemName(rewardItem)}`);
  liveBattle.dungeonWave++;
  if (liveBattle.dungeonWave >= 3) {
    addBattleLog('info', `🎉 团本${dungeon.name}通关！`);
    saveGame();
    liveBattle = null;
    if (currentScreen === 'main') render();
    showToast(`团本完成！`, 'success');
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

function bindEvents() {}

