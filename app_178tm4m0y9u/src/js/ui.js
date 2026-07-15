﻿// ===== ui.js : UI 娓叉煋涓庝簨浠跺鐞?=====

// ==================== UI RENDERING ====================

let currentScreen = 'main';
let viewingPetId = null;
let selectingTeamSlot = -1;
let shopQuantities = {};
function getShopQty(id) { return shopQuantities[id] || 1; }
function setShopQty(id, v) { shopQuantities[id] = Math.max(1, Math.min(9999, v)); }
function resetShopQty(id) { shopQuantities[id] = 1; }
// v3.x 需求2.1：计算当前货币可购买的最大数量
function getMaxShopQty(price, currency) {
  if (currency === 'diamond') return Math.floor(G.player.diamond / price);
  return Math.floor(G.player.gold / price);
}
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
// onChangeFn: 可选，自定义翻页回调函数名（用于弹窗内分页，避免调用全局 render() 导致弹窗消失）
// 返回 { page, totalPages, controlsHtml }
function paginateList(key, total, pageSize, onChangeFn) {
  pageSize = pageSize || PAGE_SIZE;
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  var page = getPage(key);
  if (page > totalPages) { page = totalPages; setPage(key, page); }
  if (page < 1) { page = 1; setPage(key, 1); }
  var fn = onChangeFn || 'changePage';
  var controls = '';
  if (totalPages > 1) {
    controls = '<div class="flex items-center justify-center gap-2 mt-3 text-xs">' +
      '<button class="btn-sm ' + (page <= 1 ? 'btn-disabled' : 'btn-primary') + '" ' + (page <= 1 ? 'disabled style="opacity:0.4"' : 'onclick="' + fn + '(\'' + key + '\',' + (page - 1) + ')"') + '>上一页</button>' +
      '<span class="text-secondary">第 <span class="text-gold font-bold">' + page + '</span> / ' + totalPages + ' 页</span>' +
      '<button class="btn-sm ' + (page >= totalPages ? 'btn-disabled' : 'btn-primary') + '" ' + (page >= totalPages ? 'disabled style="opacity:0.4"' : 'onclick="' + fn + '(\'' + key + '\',' + (page + 1) + ')"') + '>下一页</button>' +
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

// v2.11.0 需求4.4：弹窗内分页切换函数（避免调用 render() 导致弹窗消失）
// 使用 window._modalRenderCtx 存储当前弹窗的渲染上下文
function changeModalPage(key, page) {
  setPage(key, page);
  var ctx = window._modalRenderCtx;
  if (!ctx) return;
  if (ctx.type === 'petEquipSlot' && ctx.petId && ctx.slot) {
    showPetEquipBagForSlot(ctx.petId, ctx.slot);
  } else if (ctx.type === 'petEquipPetList' && ctx.equipId) {
    showPetEquipBagForPet(ctx.equipId);
  } else if (ctx.type === 'petEquipManage' && ctx.petId) {
    showPetEquipManageModal(ctx.petId);
  } else {
    render();
  }
}

const SHOP_ITEMS = [
  { id: 'hatch_boost', name: '孵化加速器', desc: '孵化中点击加速，减少30分钟孵化时间', price: 250, icon: '⚡', action: 'item', quality: 'mid' },
  // 需求7：孵化结晶-钻石道具，瞬间完成孵化
  { id: 'hatch_crystal', name: '孵化结晶', desc: '瞬间完成孵化，无需等待（仅孵化中蛋可用）', price: 30, icon: '🔮', action: 'item', currency: 'diamond', quality: 'high' },
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
  { id: 'forge_stone_low', name: '低级强化石', desc: '用于装备 +1~+6 强化', price: 400, icon: '🔩', action: 'item', quality: 'low' },
  { id: 'forge_stone_mid', name: '中级强化石', desc: '用于装备 +7~+9 强化', price: 1800, icon: '⚙️', action: 'item', quality: 'mid' },
  { id: 'forge_stone_high', name: '高级强化石', desc: '用于装备 +10~+12 强化', price: 7000, icon: '💠', action: 'item', quality: 'high' },
  { id: 'protection_stone', name: '保底石', desc: '强化时消耗可防止失败降级', price: 4500, icon: '🛡️', action: 'item', quality: 'high' },
  { id: 'yuanxiao_str', name: '力量元宵', desc: '提升宠物力量资质10~30', price: 2500, icon: '🍡', action: 'yuanxiao', aptKey: '力量资质', quality: 'mid' },
  { id: 'yuanxiao_con', name: '体质元宵', desc: '提升宠物质质资质10~30', price: 2500, icon: '🍡', action: 'yuanxiao', aptKey: '体质资质', quality: 'mid' },
  { id: 'yuanxiao_agi', name: '敏捷元宵', desc: '提升宠物敏捷资质10~30', price: 2500, icon: '🍡', action: 'yuanxiao', aptKey: '敏捷资质', quality: 'mid' },
  { id: 'yuanxiao_mag', name: '魔力元宵', desc: '提升宠物魔力资质10~30', price: 2500, icon: '🔮', action: 'yuanxiao', aptKey: '魔力资质', quality: 'mid' },
  { id: 'yuanxiao_end', name: '耐力元宵', desc: '提升宠物耐力资质10~30', price: 2500, icon: '🛡️', action: 'yuanxiao', aptKey: '耐力资质', quality: 'mid' },
  { id: 'exp_card_2x', name: '双倍经验卡', desc: '30分钟内获得经验双倍', price: 5, icon: '🎴', action: 'buff', buffType: 'exp_mult', buffMult: 2, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'gold_card_2x', name: '双倍金币卡', desc: '30分钟内获得金币双倍', price: 5, icon: '💰', action: 'buff', buffType: 'gold_mult', buffMult: 2, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'exp_card_5x', name: '五倍经验卡', desc: '30分钟内获得经验五倍', price: 20, icon: '🎴', action: 'buff', buffType: 'exp_mult', buffMult: 5, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'gold_card_5x', name: '五倍金币卡', desc: '30分钟内获得金币五倍', price: 20, icon: '💰', action: 'buff', buffType: 'gold_mult', buffMult: 5, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'exp_card_10x', name: '十倍经验卡', desc: '30分钟内获得经验十倍', price: 50, icon: '🎴', action: 'buff', buffType: 'exp_mult', buffMult: 10, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'gold_card_10x', name: '十倍金币卡', desc: '30分钟内获得金币十倍', price: 50, icon: '💰', action: 'buff', buffType: 'gold_mult', buffMult: 10, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  // 宠物重置道具
  { id: 'guiyuan_pill', name: '归元丹', desc: '重置T1-T3宠物的成长、资质、技能', price: 5000, icon: '💊', action: 'item', quality: 'mid' },
  { id: 'guixu_pill', name: '归虚丹', desc: '重置T4-T5宠物的成长、资质、技能', price: 20, icon: '🌟', action: 'item', currency: 'diamond', quality: 'high' },
  { id: 'pet_reset_pill', name: '宠物洗点丹', desc: '重置宠物全部自由属性点，全额返还', price: 15, icon: '🧪', action: 'item', currency: 'diamond', quality: 'high' },
  // 金币箱（钻石购买）
  { id: 'gold_chest_s', name: '小金币箱', desc: '开启获得10万金币', price: 5, icon: '📦', action: 'gold_chest', goldAmount: 100000, currency: 'diamond', quality: 'mid' },
  { id: 'gold_chest_m', name: '中金币箱', desc: '开启获得100万金币', price: 40, icon: '📦', action: 'gold_chest', goldAmount: 1000000, currency: 'diamond', quality: 'mid' },
  { id: 'gold_chest_l', name: '大金币箱', desc: '开启获得1000万金币', price: 300, icon: '📦', action: 'gold_chest', goldAmount: 10000000, currency: 'diamond', quality: 'mid' },
  // 宝石（1级）钻石购买
  // v2.9.0 需求1.1：移除 hp/mp 宝石，仅保留五维宝石；每级+2%属性
  { id: 'gem_vit_1', name: '体质宝石+1', desc: '体质+2%，可镶嵌于衣服/裤子', price: 8, icon: '🌿', action: 'gem', gemType: 'vit', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_str_1', name: '力量宝石+1', desc: '力量+2%，可镶嵌于武器/手套', price: 8, icon: '🔥', action: 'gem', gemType: 'str', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_agi_1', name: '敏捷宝石+1', desc: '敏捷+2%，可镶嵌于鞋子/手套', price: 8, icon: '⚡', action: 'gem', gemType: 'agi', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_end_1', name: '耐力宝石+1', desc: '耐力+2%，可镶嵌于衣服/裤子', price: 8, icon: '🛡️', action: 'gem', gemType: 'end', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  { id: 'gem_mag_1', name: '魔力宝石+1', desc: '魔力+2%，可镶嵌于头盔/武器', price: 8, icon: '🔮', action: 'gem', gemType: 'mag', gemLevel: 1, currency: 'diamond', quality: 'mid' },
  // 新增道具
  { id: 'lucky_charm', name: '幸运符', desc: '30分钟内掉宝率提升50%', price: 15, icon: '🍀', action: 'buff', buffType: 'drop_mult', buffMult: 1.5, buffDuration: 30, currency: 'diamond', quality: 'mid' },
  { id: 'rename_card', name: '改名卡', desc: '重命名一只宠物的显示名称', price: 5, icon: '✏️', action: 'rename_card', currency: 'diamond', quality: 'mid' },
  // 需求7：打孔系统道具
  { id: 'socket_nail', name: '打孔钉', desc: '为装备打孔，成功率随孔数递减（80%/50%/20%）', price: 2500, icon: '🔨', action: 'item', quality: 'mid' },
  { id: 'repair_glue', name: '修补胶', desc: '重置装备孔洞为0（已镶嵌宝石返还背包）', price: 15, icon: '🩹', action: 'item', currency: 'diamond', quality: 'high' },
  // 装备洗练道具
  { id: 'refine_stone', name: '洗练石', desc: '重新随机装备词条，追求完美属性（45级开启）', price: 3000, icon: '🔮', action: 'item', quality: 'high' },
  // [已移除] 宠物进阶丸相关商品已下架
// 需求10：宠物炼化道具
{ id: 'refine_essence', name: '炼化精魄', desc: '低品质炼化材料，成功率50%（40级开启）', price: 3000, icon: '🔥', action: 'item', quality: 'mid' },
{ id: 'refine_crystal', name: '炼化晶石', desc: '高品质炼化材料，成功率85%，推荐使用（40级开启）', price: 35, icon: '💎', action: 'item', currency: 'diamond', quality: 'high' },
  // v2.2.0 需求9：挖密藏系统道具（探宝铲/透视镜/密藏钥匙已下架）
  { id: 'dig_map', name: '密藏图', desc: '使用后开启挖密藏九宫格玩法', price: 1500, icon: '🗺️', action: 'item', quality: 'mid' },
  // 神兽精华（钻石购买，200钻石/个）
  { id: 'divine_essence', name: '神兽精华', desc: '蕴含神兽之力的精华，集齐99个可随机兑换1只神兽', price: 200, icon: '✨', action: 'divine_essence', currency: 'diamond', quality: 'high' },
  // 延寿道具（金币购买）
  { id: 'lifespan_low', name: '低级延寿丹', desc: '为宠物增加500点寿命，10%概率降低某项资质或成长', price: 3000, icon: '💊', action: 'lifespan_item', lifespanAmount: 500, currency: 'gold', quality: 'low' },
  { id: 'lifespan_mid', name: '中级延寿丹', desc: '为宠物增加1000点寿命，10%概率降低某项资质或成长', price: 12000, icon: '🏺', action: 'lifespan_item', lifespanAmount: 1000, currency: 'gold', quality: 'mid' },
  { id: 'lifespan_high', name: '高级延寿丹', desc: '为宠物增加2000点寿命，10%概率降低某项资质或成长', price: 45000, icon: '🧪', action: 'lifespan_item', lifespanAmount: 2000, currency: 'gold', quality: 'high' },
  // 需求：商城新增道具 —— 进化晶石、血统珠、竞技场挑战券
  { id: 'evolution_crystal_low', name: '低级进化晶石', desc: '宠物进阶材料，提供15点进阶值', price: 500, icon: '🔮', action: 'item', quality: 'low' },
  { id: 'evolution_crystal_mid', name: '中级进化晶石', desc: '宠物进阶材料，提供50点进阶值', price: 3000, icon: '🔮', action: 'item', quality: 'mid' },
  { id: 'evolution_crystal_high', name: '高级进化晶石', desc: '宠物进阶材料，提供150点进阶值', price: 20, icon: '💎', action: 'item', currency: 'diamond', quality: 'high' },
  { id: 'blood_orb_low', name: '低级血统珠', desc: '用于宠物血统技能升级', price: 1000, icon: '🔴', action: 'item', quality: 'low' },
  { id: 'blood_orb_mid', name: '中级血统珠', desc: '用于宠物血统技能升级', price: 10, icon: '🔴', action: 'item', currency: 'diamond', quality: 'mid' },
  { id: 'blood_orb_high', name: '高级血统珠', desc: '用于宠物血统技能升级', price: 50, icon: '🔴', action: 'item', currency: 'diamond', quality: 'high' },
  { id: 'arena_ticket', name: '竞技场挑战券', desc: '使用后增加当日竞技场挑战次数+1', price: 10, icon: '🏟️', action: 'arena_ticket', currency: 'diamond', quality: 'mid' },
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
// 需求16：五维体系宝石 —— 7种宝石，每种可镶嵌的装备栏不同，最高+15级
// v2.9.0 需求1.1：宝石类型严格对齐人物五维基础属性，移除 hp/mp 类型
// 加成方式：百分比加成（1级=2%，每级+2%线性递增）
const GEM_TYPES = [
  { id: 'vit', name: '体质宝石', icon: '🌿', stat: '体质', perLevel: 0.02, color: '#22c55e', slots: ['armor','pants'] },
  { id: 'str', name: '力量宝石', icon: '🔥', stat: '力量', perLevel: 0.02, color: '#f59e0b', slots: ['weapon','gloves'] },
  { id: 'agi', name: '敏捷宝石', icon: '⚡', stat: '敏捷', perLevel: 0.02, color: '#eab308', slots: ['shoes','gloves'] },
  { id: 'end', name: '耐力宝石', icon: '🛡️', stat: '耐力', perLevel: 0.02, color: '#6366f1', slots: ['armor','pants'] },
  { id: 'mag', name: '魔力宝石', icon: '🔮', stat: '魔力', perLevel: 0.02, color: '#a855f7', slots: ['helmet','weapon'] },
];
// 兼容旧存档：旧 'int'→'mag'，v2.9.0 移除的 'hp'→'vit'、'mp'→'mag'
function _migrateOldGemType(type) {
  if (type === 'int') return 'mag';
  if (type === 'hp') return 'vit';
  if (type === 'mp') return 'mag';
  return type;
}
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
// v2.9.0 需求1.1：返回百分比加成（小数形式，0.02=2%），仅五维属性
function getGemStatBonus() {
  var bonus = { 体质: 0, 力量: 0, 敏捷: 0, 耐力: 0, 魔力: 0 };
  if (!G.player || !G.player.equipment) return bonus;
  Object.keys(G.player.equipment).forEach(function(slotId) {
    var item = G.player.equipment[slotId];
    if (!item || !Array.isArray(item.gemSlots)) return;
    // 遍历该装备的所有宝石孔，累加已镶嵌宝石的百分比加成
    item.gemSlots.forEach(function(slot) {
      var gem = slot && slot.gem;
      if (gem && gem.level > 0) {
        var gType = _migrateOldGemType(gem.type);
        var def = getGemType(gType);
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
// v2.8.0 需求2.2：兼容旧存档 'int'→'mag' 类型映射，修复镶嵌失败Bug
function equipGem(slotId, gemType, gemLevel) {
  gemType = _migrateOldGemType(gemType);
  var item = G.player && G.player.equipment && G.player.equipment[slotId];
  if (!item) { showToast('该槽位未装备任何物品', 'error'); return; }
  if (!Array.isArray(item.gemSlots) || item.gemSlots.length === 0) {
    showToast('该装备没有宝石孔，无法镶嵌', 'error'); return;
  }
  // 找到第一个空闲的、类型匹配的孔（兼容旧 'int' 类型）
  var targetIdx = -1;
  for (var i = 0; i < item.gemSlots.length; i++) {
    var slotType = _migrateOldGemType(item.gemSlots[i].type);
    if (slotType === gemType && !item.gemSlots[i].gem) {
      targetIdx = i;
      // 同步将旧类型迁移为新类型
      item.gemSlots[i].type = gemType;
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
  if (existing) addGemToBag(_migrateOldGemType(existing.type), existing.level, 1);
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
// v2.9.0 需求1.1：宝石显示百分比加成（1级=2%，每级+2%）
function renderGemSection() {
  if (!G.gemBag) G.gemBag = [];
  var bonus = getGemStatBonus();
  // v2.9.0 需求1.1：百分比展示（bonus 值为小数，乘100显示）
  var bonusHtml = Object.keys(bonus).filter(function(k) { return bonus[k] > 0; }).map(function(k) {
    return '<span class="text-xs px-2 py-1 rounded bg-panel border border-game" style="color:#fbbf24">' + k + ' +' + (bonus[k] * 100).toFixed(0) + '%</span>';
  }).join('');
  if (!bonusHtml) bonusHtml = '<span class="text-xs text-secondary">未镶嵌任何宝石</span>';
  // 格式化单颗宝石的加成百分比
  function _gemPctStr(def, level) { return (def.perLevel * level * 100).toFixed(0) + '%'; }
  // 已镶嵌宝石一览：遍历已装备装备的宝石孔
  var equippedHtml = EQUIPMENT_SLOTS.map(function(slot) {
    var item = G.player && G.player.equipment && G.player.equipment[slot.id];
    if (!item || !Array.isArray(item.gemSlots)) return '';
    var html = '';
    item.gemSlots.forEach(function(gslot, idx) {
      var def = getGemType(_migrateOldGemType(gslot.type));
      if (!def) return;
      var gem = gslot.gem;
      if (gem && gem.level > 0) {
        html += '<div class="bg-panel border rounded-lg p-2 text-center" style="border-color:' + def.color + '">' +
          '<div class="text-lg">' + def.icon + '</div>' +
          '<p class="text-xs" style="color:' + def.color + '">' + def.name + ' +' + gem.level + '</p>' +
          '<p class="text-xs text-secondary">' + slot.name + '孔' + (idx + 1) + ' | ' + def.stat + '+' + _gemPctStr(def, gem.level) + '</p>' +
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
      var ta = _migrateOldGemType(a.type), tb = _migrateOldGemType(b.type);
      if (ta !== tb) return ta < tb ? -1 : 1;
      return a.level - b.level;
    });
    bagHtml = sortedBag.map(function(g) {
      var def = getGemType(_migrateOldGemType(g.type));
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
        '<p class="text-xs text-secondary">' + def.stat + '+' + _gemPctStr(def, g.level) + '</p>' +
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
    '<div class="mb-2"><p class="text-xs text-secondary mb-1">已镶嵌宝石属性加成（百分比作用于人物基础五维）：</p>' +
    '<div class="flex flex-wrap gap-1">' + bonusHtml + '</div></div>' +
    '<p class="text-xs text-blue-300 mb-3">💡 每颗宝石1级提供对应属性2%加成，每级+2%线性递增</p>' +
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
    var def = getGemType(_migrateOldGemType(gslot.type));
    if (!def) return '';
    var gem = gslot.gem;
    var isActive = (slotIndex === idx);
    var activeCls = isActive ? 'border-purple-500 bg-purple-900/30' : 'border-game';
    var content;
    if (gem && gem.level > 0) {
      content = '<p class="text-xs" style="color:' + def.color + '">' + def.name + ' +' + gem.level + '</p>' +
        '<p class="text-xs text-secondary">' + def.stat + '+' + (def.perLevel * gem.level * 100).toFixed(0) + '%</p>' +
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
  // v2.8.0 需求2.2：兼容旧 'int' 类型，迁移为 'mag'
  var targetSlotType = _migrateOldGemType(targetSlot.type);
  targetSlot.type = targetSlotType; // 同步迁移
  var targetDef = getGemType(targetSlotType);
  if (!targetDef) { showToast('宝石孔类型异常', 'error'); return; }
  // 列出背包中类型匹配的宝石
  var gemListHtml = '';
  var availableGems = [];
  G.gemBag.forEach(function(g) {
    if (_migrateOldGemType(g.type) === targetSlotType && g.count > 0) {
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
        '<p class="text-xs text-secondary">' + g.def.stat + '+' + (g.def.perLevel * g.level * 100).toFixed(0) + '%</p>' +
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
    '<p class="text-xs text-secondary mb-2">该孔类型：' + targetDef.icon + ' ' + targetDef.name + '（' + targetDef.stat + '+' + (targetDef.perLevel * 100).toFixed(0) + '%/级）</p>' +
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
  { id: 'mag_flat', name: '魔力', format: v => `魔力 +${v}` },
  { id: 'mag_pct', name: '魔力%', format: v => `魔力 +${Math.floor(v*100)}%` },
  { id: 'end_flat', name: '耐力', format: v => `耐力 +${v}` },
  { id: 'end_pct', name: '耐力%', format: v => `耐力 +${Math.floor(v*100)}%` },
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
      // 头盔：高血 + 魔力（法系）
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
  // v2.8.0 需求2.2：修复宝石孔类型，与 GEM_TYPES 保持一致（'int'→'mag'，新增'end'）
  // v2.9.0 需求1.1：移除 hp/mp，仅五维类型
  var availableGemTypes = ['vit', 'str', 'agi', 'end', 'mag'];
  // 按装备槽位筛选可镶嵌的宝石类型（参考 GEM_TYPES.slots）
  var slotGemTypes = GEM_TYPES.filter(function(g) {
    return g.slots.indexOf(slot.id) >= 0;
  }).map(function(g) { return g.id; });
  var poolGemTypes = slotGemTypes.length > 0 ? slotGemTypes : availableGemTypes;
  for (var gi = 0; gi < gemSlotCount; gi++) {
    gemSlots.push({ type: pickRandom(poolGemTypes), gem: null });
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
  if (item.baseInt > 0) parts.push('魔+' + Math.floor(item.baseInt * mult)); // v2.8.0 评审修复：智→魔（v2.6.0 重命名）
  return parts.join(' ');
}

function getEquipStatBonus() {
  const eq = G.player.equipment;
  const forge = G.player.forgeLevels || {};
  let bonus = { 力量: 0, 体质: 0, 敏捷: 0, 耐力: 0, 魔力: 0, 气血: 0, atk: 0, def: 0, critRate: 0, dodgeRate: 0, petDmg: 0, petDef: 0, petHp: 0, specials: [] };
  // 先收集百分比词条，最后统一应用（避免顺序依赖）
  var pctBonus = { 力量: 0, 体质: 0, 敏捷: 0, 耐力: 0, 魔力: 0, 气血: 0, atk: 0, def: 0 };
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
    bonus.魔力 += Math.floor((item.baseInt || item.baseMag || 0) * forgeMult);
    (item.affixes || []).forEach(a => {
      const val = Math.floor(a.value * forgeMult * 100) / 100;
      if (a.id === 'str_flat') bonus.力量 += val;
      else if (a.id === 'str_pct') pctBonus.力量 += val;
      else if (a.id === 'con_flat') bonus.体质 += val;
      else if (a.id === 'con_pct') pctBonus.体质 += val;
      else if (a.id === 'agi_flat') bonus.敏捷 += val;
      else if (a.id === 'agi_pct') pctBonus.敏捷 += val;
      else if (a.id === 'mag_flat' || a.id === 'int_flat') bonus.魔力 += val;
      else if (a.id === 'mag_pct' || a.id === 'int_pct') pctBonus.魔力 += val;
      else if (a.id === 'end_flat') bonus.耐力 += val;
      else if (a.id === 'end_pct') pctBonus.耐力 += val;
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
  if (pctBonus.魔力) bonus.魔力 += Math.floor(bonus.魔力 * pctBonus.魔力);
  if (pctBonus.耐力) bonus.耐力 += Math.floor(bonus.耐力 * pctBonus.耐力);
  if (pctBonus.气血) bonus.气血 += Math.floor(bonus.气血 * pctBonus.气血);
  if (pctBonus.atk) bonus.atk += Math.floor(bonus.atk * pctBonus.atk);
  if (pctBonus.def) bonus.def += Math.floor(bonus.def * pctBonus.def);
  return bonus;
}

function getCharacterBonusForPet() {
  const eq = getEquipStatBonus();
  const lv = G.player.level || 1;
  // 需求7：全属性buff（flat值，all_stat buff的mult值作为固定加成）
  const allStatBuff = getFlatBuff('all_stat') || 0;
  // 需求6-BUG修复：getCultivationBonus()返回{dmgBonus,dmgReduce,healBonus}，不再返回四维属性
  // 旧代码错误访问cultBonus.力量等不存在字段导致NaN，现已修正
  const cultBonus = (typeof getCultivationBonus === 'function') ? getCultivationBonus() : { dmgBonus: 0, dmgReduce: 0, healBonus: 0 };
  // 需求：神通系统属性加成（修复升星后神通属性未生效的问题）
  var dpEffects = (typeof getAllDivinePowerEffects === 'function') ? getAllDivinePowerEffects() : [];
  var dpAtkPct = 0, dpDefPct = 0, dpHpPct = 0, dpSpdPct = 0, dpAllPct = 0;
  var dpCritRate = 0, dpDodgeRate = 0, dpDmgReduce = 0, dpVampPct = 0, dpSkillDmg = 0;
  dpEffects.forEach(function(eff) {
    var v = eff.effect.value;
    switch (eff.effect.type) {
      case 'atkPct': dpAtkPct += v; break;
      case 'defPct': dpDefPct += v; break;
      case 'hpPct': dpHpPct += v; break;
      case 'spdPct': dpSpdPct += v; break;
      case 'allPct': dpAllPct += v; break;
      case 'critRate': dpCritRate += v; break;
      case 'dodgeRate': dpDodgeRate += v; break;
      case 'dmgReduce': dpDmgReduce += v; break;
      case 'vampPct': dpVampPct += v; break;
      case 'skillDmg': dpSkillDmg += v; break;
    }
  });
  // 需求6-BUG修复：所有字段使用|| 0兜底，防止undefined/NaN传导
  const baseStats = {
    力量: (10 + lv * 3 + (eq.力量 || 0) + allStatBuff),
    体质: (10 + lv * 2 + (eq.体质 || 0) + allStatBuff),
    敏捷: (10 + lv * 2 + (eq.敏捷 || 0) + allStatBuff),
    魔力: (10 + lv * 2 + (eq.魔力 || eq.智力 || 0) + allStatBuff),
    耐力: (10 + lv * 2 + (eq.耐力 || 0) + allStatBuff),
    气血: (50 + lv * 10 + (eq.气血 || 0) + allStatBuff),
  };
  // v2.9.0 需求1.1：宝石百分比加成，作用于人物基础五维属性
  var gemPct = (typeof getGemStatBonus === 'function') ? getGemStatBonus() : null;
  if (gemPct) {
    baseStats.力量 = Math.floor(baseStats.力量 * (1 + (gemPct.力量 || 0)));
    baseStats.体质 = Math.floor(baseStats.体质 * (1 + (gemPct.体质 || 0)));
    baseStats.敏捷 = Math.floor(baseStats.敏捷 * (1 + (gemPct.敏捷 || 0)));
    baseStats.魔力 = Math.floor(baseStats.魔力 * (1 + (gemPct.魔力 || 0)));
    baseStats.耐力 = Math.floor(baseStats.耐力 * (1 + (gemPct.耐力 || 0)));
  }
  // 神通百分比加成应用到基础属性
  if (dpAllPct) {
    baseStats.力量 = Math.floor(baseStats.力量 * (1 + dpAllPct));
    baseStats.体质 = Math.floor(baseStats.体质 * (1 + dpAllPct));
    baseStats.敏捷 = Math.floor(baseStats.敏捷 * (1 + dpAllPct));
    baseStats.魔力 = Math.floor(baseStats.魔力 * (1 + dpAllPct));
    baseStats.耐力 = Math.floor(baseStats.耐力 * (1 + dpAllPct));
    baseStats.气血 = Math.floor(baseStats.气血 * (1 + dpAllPct));
  }
  if (dpAtkPct) baseStats.力量 = Math.floor(baseStats.力量 * (1 + dpAtkPct));
  if (dpHpPct) baseStats.气血 = Math.floor(baseStats.气血 * (1 + dpHpPct));
  // NaN安全检查：确保所有数值有效
  Object.keys(baseStats).forEach(function(k) {
    if (isNaN(baseStats[k]) || !isFinite(baseStats[k])) baseStats[k] = 0;
  });
  return {
    // 四维属性按20%附加给宠物
    力量: Math.floor(baseStats.力量 * 0.20),
    体质: Math.floor(baseStats.体质 * 0.20),
    敏捷: Math.floor(baseStats.敏捷 * 0.20),
    魔力: Math.floor(baseStats.魔力 * 0.20),
    耐力: Math.floor(baseStats.耐力 * 0.20),
    气血: Math.floor(baseStats.气血 * 0.20),
    // 攻击力/防御力/暴击率/闪避率按20%附加给宠物 + 天赋加成（pet_crit/pet_dodge等）
    atk: Math.floor((eq.atk || 0) * 0.20),
    def: Math.floor((eq.def || 0) * 0.20),
    critRate: (eq.critRate || 0) * 0.20 + getTalentBonus('pet_crit') + dpCritRate,
    dodgeRate: (eq.dodgeRate || 0) * 0.20 + getTalentBonus('pet_dodge') + dpDodgeRate,
    // 新增战斗天赋加成（来自战斗星轨）
    critDmg: getTalentBonus('pet_crit_dmg'),
    skillTrigger: getTalentBonus('pet_skill_trigger'),
    skillDmg: getTalentBonus('pet_skill_dmg') + dpSkillDmg,
    vampPct: getTalentBonus('pet_lifesteal') + dpVampPct,
    dmgReduce: getTalentBonus('pet_resolve') + dpDmgReduce,
    // 需求6-BUG修复：修炼伤害加成合并到petDmg中，修炼减伤加成合并到petDef中
    petDmg: (eq.petDmg || 0) + (cultBonus.dmgBonus || 0),
    petDef: (eq.petDef || 0) + (cultBonus.dmgReduce || 0),
    petHp: eq.petHp || 0,
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
  // 需求：按技能书强度梯度全面上调售价（约3倍）
  passive_t1: PASSIVE_SKILLS.filter(s => s.tier === 1).map(s => ({ ...s, currency: 'diamond', price: 45 })),
  passive_t2: PASSIVE_SKILLS.filter(s => s.tier === 2).map(s => ({ ...s, currency: 'diamond', price: 150 })),
  passive_t3: PASSIVE_SKILLS.filter(s => s.tier === 3).map(s => ({ ...s, currency: 'diamond', price: 600 })),
  aura_t1: AURA_SKILLS.filter(s => s.tier === 1).map(s => ({ ...s, currency: 'diamond', price: 120 })),
  aura_t2: AURA_SKILLS.filter(s => s.tier === 2).map(s => ({ ...s, currency: 'diamond', price: 240 })),
  aura_t3: AURA_SKILLS.filter(s => s.tier === 3).map(s => ({ ...s, currency: 'diamond', price: 450 })),
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
  // 需求：分解装备固定获得金币，并有小概率额外获得强化石
  var goldGain = (item.level * 10 + rarityIdx * 50) * (1 + rarityIdx);
  G.equipmentBag.splice(idx, 1);
  addGold(goldGain);
  var msgParts = ['💰 金币×' + goldGain];
  // 小概率额外获得强化石（20%概率）
  if (Math.random() < 0.20) {
    var stoneId, stoneName, count;
    switch (item.rarity) {
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
    msgParts.push(stoneName + '×' + count);
  }
  saveGame();
  render();
  showToast('♻️ 分解获得 ' + msgParts.join('、'), 'success');
  // 需求5：金币任务（分解装备）进度更新
  if (typeof updateMainQuest === 'function') updateMainQuest('decompose_gold', 1);
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

// 需求：取消装备出售功能，批量出售重定向到批量分解
function batchSellSelected() {
  batchDecomposeSelected();
}

function batchDecomposeSelected() {
  var ids = Object.keys(batchSelected);
  if (ids.length === 0) { showToast('请先选择装备', 'error'); return; }
  var stones = { forge_stone_low: 0, forge_stone_mid: 0, forge_stone_high: 0 };
  var totalGold = 0;
  var skippedLocked = 0;
  ids.forEach(function(id) {
    var idx = G.equipmentBag.findIndex(function(e) { return e.id === id; });
    if (idx >= 0) {
      var item = G.equipmentBag[idx];
      // 需求6：跳过已上锁的装备
      if (item.locked) { skippedLocked++; return; }
      // 需求：分解固定获得金币
      var rarityIdx = EQUIP_RARITIES.indexOf(item.rarity);
      totalGold += ((item.level || 1) * 10 + rarityIdx * 50) * (1 + rarityIdx);
      // 小概率额外获得强化石（20%）
      if (Math.random() < 0.20) {
        switch (item.rarity) {
          case 'white': stones.forge_stone_low += 1; break;
          case 'green': stones.forge_stone_low += 1; break;
          case 'blue': stones.forge_stone_mid += 1; break;
          case 'purple': stones.forge_stone_mid += 2; break;
          case 'orange': stones.forge_stone_high += 1; break;
        }
      }
      G.equipmentBag.splice(idx, 1);
    }
  });
  if (totalGold > 0) addGold(totalGold);
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
  var msgParts = ['💰 金币×' + totalGold.toLocaleString()];
  if (stones.forge_stone_low > 0) msgParts.push('低级强化石×' + stones.forge_stone_low);
  if (stones.forge_stone_mid > 0) msgParts.push('中级强化石×' + stones.forge_stone_mid);
  if (stones.forge_stone_high > 0) msgParts.push('高级强化石×' + stones.forge_stone_high);
  var msg = '批量分解装备，获得 ' + msgParts.join('、');
  if (skippedLocked > 0) msg += '（跳过 ' + skippedLocked + ' 件已上锁）';
  showToast(msg, 'success');
  // 需求5：金币任务（分解装备）进度更新——按实际分解数量计数
  var decomposedCount = ids.length - skippedLocked;
  if (decomposedCount > 0 && typeof updateMainQuest === 'function') {
    updateMainQuest('decompose_gold', decomposedCount);
  }
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

// Bug 1.1: 安全渲染包装器——单个页面渲染失败时显示兜底内容，不影响其他页面
function _safeRender(screenName, renderFn) {
  if (typeof renderFn !== 'function') {
    return '<div class="min-h-screen flex items-center justify-center"><div class="text-center"><p class="text-secondary text-sm">功能加载中...</p></div></div>';
  }
  try {
    var html = renderFn();
    if (typeof html !== 'string') return '';
    return html;
  } catch(e) {
    console.error('[Render] ' + screenName + ' 页面渲染失败:', e);
    var msg = (e && e.message) ? e.message : String(e || '未知错误');
    return '<div class="min-h-screen flex items-center justify-center"><div class="text-center p-4 max-w-md"><div class="text-4xl mb-3">⚠️</div><p class="text-red-400 text-sm font-bold mb-2">' + screenName + ' 页面加载失败</p><p class="text-secondary text-xs mb-4">' + msg + '</p><button onclick="currentScreen=\'main\';render()" class="px-4 py-2 rounded bg-purple-700 text-white text-sm">返回主页</button></div></div>';
  }
}

function render() {
  try {
    const app = document.getElementById('app');
    // Bug 1.1: 每个页面独立 try-catch 隔离，避免单一页面崩溃导致整体白屏
    switch (currentScreen) {
      case 'main': app.innerHTML = _safeRender('主页', renderMainScreen); break;
      case 'pets': app.innerHTML = _safeRender('宠物', renderPetScreen); break;
      case 'eggs': app.innerHTML = _safeRender('宠物蛋', renderEggScreen); break;
      case 'inventory': app.innerHTML = _safeRender('背包', renderInventoryScreen); break;
      case 'dungeon': app.innerHTML = _safeRender('副本', renderDungeonScreen); break;
      case 'market': app.innerHTML = _safeRender('市场', renderMarketScreen); break;
      case 'daily': app.innerHTML = _safeRender('任务', renderDailyScreen); break;
      case 'tower': window._activitySheet = 'tower'; app.innerHTML = _safeRender('爬塔', renderActivityScreen); break;
      case 'samsara': app.innerHTML = _safeRender('六道轮回', renderSamsaraScreen); break;
      case 'fusion': app.innerHTML = _safeRender('进化', renderFusionScreen); break;
      case 'petequip': app.innerHTML = _safeRender('宠物装备', renderPetEquipScreen); break;
      case 'formation': app.innerHTML = _safeRender('阵法', renderFormationScreen); break;
      case 'shop': app.innerHTML = _safeRender('商城', renderShopScreen); break;
      case 'character': app.innerHTML = _safeRender('角色', renderCharacterScreen); break;
      case 'arena': window._activitySheet = 'arena'; app.innerHTML = _safeRender('竞技场', renderActivityScreen); break;
      case 'arena_battle': app.innerHTML = _safeRender('竞技场战斗', renderArenaBattleScreen); break;
      case 'treasure': app.innerHTML = _safeRender('藏宝图', renderTreasureScreen); break;
      case 'dig': app.innerHTML = _safeRender('挖密藏', renderDigScreen); break;
      case 'activity': app.innerHTML = _safeRender('活动', renderActivityScreen); break;
      case 'raid': app.innerHTML = _safeRender('团本', (typeof renderRaidScreen === 'function') ? renderRaidScreen : null); break;
      case 'forge': app.innerHTML = _safeRender('锻造', renderForgeScreen); break;
      case 'pool': app.innerHTML = _safeRender('抽奖', renderPoolScreen); break;
      case 'achievement': app.innerHTML = _safeRender('成就', renderAchievementScreen); break;
      case 'dex': app.innerHTML = _safeRender('图鉴', renderDexScreen); break;
      case 'talent': app.innerHTML = _safeRender('天赋', renderTalentScreen); break;
      case 'lottery': app.innerHTML = _safeRender('抽奖', renderLotteryScreen); break;
      case 'training': app.innerHTML = _safeRender('练功房', renderTrainingScreen); break;
    }
    if (viewingPetId) app.innerHTML += renderPetDetailModal();
    if (window._bloodOrbImplantPetId) app.innerHTML += renderBloodOrbImplantModal();
    if (window._activityBattle) app.innerHTML += renderActivityBattleModal();
// v3.0 弹窗战斗 & 团本老虎机弹窗
if (window._popupBattle && typeof renderPopupBattleModal === 'function') app.innerHTML += renderPopupBattleModal();
if (window._raidSlotMachine && typeof renderRaidSlotMachineModal === 'function') app.innerHTML += renderRaidSlotMachineModal();
renderTimeBar();
renderBuffBar();
// 需求9：render() 重建 DOM 后需补绘战斗竞技场（含走路阶段），避免探索动画被默认占位覆盖
if (currentScreen === 'main' && (liveBattle || walkPhase)) setTimeout(function(){ if (typeof renderBattleArena === 'function') renderBattleArena(); }, 0);
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
// claimLimit: 领取次数上限（0或省略=可重复使用）
var REDEEM_CLAIM_LIMIT_444 = 1; // 444兑换码可领取次数（可配置）
const REDEEM_CODES = {
  '444': { reward: { divine_essence: 99 }, msg: '兑换成功！获得 ✨神兽精华 ×99', claimLimit: function() { return REDEEM_CLAIM_LIMIT_444; } },
  '666': { reward: { diamond: 100000 }, msg: '兑换成功！获得 💎100000 钻石' },
  '888': { reward: { gold: 100000 }, msg: '兑换成功！获得 🪙100000 金币' },
};
function openRedeemModal() {
  var html = '<div id="redeemOverlay" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="closeRedeemModal()">' +
    '<div class="bg-card border-2 border-gold rounded-2xl p-6 max-w-sm w-full" style="border-color:var(--gold);" onclick="event.stopPropagation()">' +
      '<h2 class="font-fantasy text-gold text-xl text-center mb-2">🎁 兑换码</h2>' +
      '<p class="text-xs text-secondary text-center mb-4">输入兑换码领取奖励（部分兑换码有次数限制）</p>' +
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
  // 检查领取次数限制
  if (!G.redeemCodesUsed) G.redeemCodesUsed = [];
  var usedCount = G.redeemCodesUsed.filter(function(r) { return r.code === code; }).length;
  var limit = (typeof def.claimLimit === 'function') ? def.claimLimit() : (def.claimLimit || 0);
  if (limit > 0 && usedCount >= limit) {
    if (msgEl) msgEl.innerHTML = '<span style="color:#ef4444;">该兑换码已达领取上限（' + limit + '次）</span>';
    return;
  }
  // 发放奖励
  if (def.reward.diamond) addDiamond(def.reward.diamond);
  if (def.reward.gold) G.player.gold += def.reward.gold;
  if (def.reward.hatchStones) G.hatchStones = (G.hatchStones || 0) + def.reward.hatchStones;
  if (def.reward.divine_essence) {
    var deItem = G.inventory.find(function(i) { return i.id === 'divine_essence'; });
    if (deItem) deItem.count += def.reward.divine_essence;
    else G.inventory.push({ id: 'divine_essence', count: def.reward.divine_essence });
  }
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
    var tooltip = info.name + ' x' + b.mult + ' | 剩余 ' + timeText;
    return '<div class="buff-chip" data-tooltip="' + tooltip + '"' +
      ' ontouchstart="this.classList.add(\'buff-tooltip-show\')"' +
      ' ontouchend="this.classList.remove(\'buff-tooltip-show\')"' +
      ' ontouchcancel="this.classList.remove(\'buff-tooltip-show\')">' +
      '<span class="buff-icon">' + info.icon + '</span>' +
      '<span class="buff-mult">x' + b.mult + '</span>' +
      '<span class="buff-tooltip-text">' + tooltip + '</span>' +
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

// ==================== v3.2 全局待办红点提示系统 ====================

/**
 * 统一红点角标判定入口
 * @param {string} tabId - 导航标签ID
 * @returns {string} 红点HTML（空字符串表示无红点）
 */
function getNavBadge(tabId) {
  var hasAlert = false;
  switch (tabId) {
    case 'daily':     hasAlert = checkDailyClaimable(); break;
    case 'character': hasAlert = checkEquipUpgradeable(); break;
    case 'talent':    hasAlert = checkTalentUnspent(); break;
    case 'achievement': hasAlert = checkAchievementClaimable(); break;
    case 'pets':      hasAlert = checkPetUnspentPoints(); break;
  }
  if (hasAlert) {
    return '<span class="inline-block w-2 h-2 bg-red-500 rounded-full ml-0.5 animate-pulse"></span>';
  }
  return '';
}

/**
 * 日常/主线任务可领取检查
 */
function checkDailyClaimable() {
  var claimable = 0;
  if (typeof getCurrentMainQuest === 'function') {
    var mq = getCurrentMainQuest();
    if (mq && mq.questData && mq.progress >= mq.questData.target && !mq.claimed) claimable++;
  }
  if (typeof DAILY_TASKS !== 'undefined') {
    DAILY_TASKS.forEach(function(task) {
      var p = G.dailyTasks[task.id] || 0;
      if (p >= task.target && !G.dailyTasks[task.id + '_claimed']) claimable++;
    });
  }
  return claimable > 0;
}

/**
 * 人物装备可提升检查：
 * 背包中存在对应部位的装备，其综合属性优于当前人物已穿戴的同部位装备
 */
function checkEquipUpgradeable() {
  if (!G || !G.equipmentBag || !G.player || !G.player.equipment) return false;
  if (typeof EQUIPMENT_SLOTS === 'undefined') return false;
  // 遍历背包装备，检查是否有优于当前穿戴的
  for (var i = 0; i < G.equipmentBag.length; i++) {
    var bagItem = G.equipmentBag[i];
    if (!bagItem || !bagItem.slot) continue;
    var currentEquip = G.player.equipment[bagItem.slot];
    if (!currentEquip) {
      // 当前槽位为空，背包有装备即可提升
      return true;
    }
    // 比较综合属性
    if (calcEquipTotalScore(bagItem) > calcEquipTotalScore(currentEquip)) {
      return true;
    }
  }
  return false;
}

/**
 * 计算装备综合属性总分（含基础属性+词条+宝石，不含强化等级——因强化绑定槽位）
 */
function calcEquipTotalScore(item) {
  if (!item) return 0;
  var score = 0;
  // 基础属性
  score += (item.baseAtk || 0) * 3;
  score += (item.baseDef || 0) * 2;
  score += (item.baseHp || 0) * 0.3;
  score += (item.baseStr || 0) * 2;
  score += (item.baseCon || 0) * 2;
  score += (item.baseAgi || 0) * 2;
  score += (item.baseInt || 0) * 2;
  // 词条属性
  if (item.affixes) {
    item.affixes.forEach(function(a) {
      var v = a.value || 0;
      if (a.id && a.id.indexOf('pct') >= 0) {
        score += v * 200; // 百分比词条加权
      } else if (a.id === 'crit_rate' || a.id === 'dodge_rate') {
        score += v * 500; // 战斗属性高权重
      } else if (a.id === 'pet_dmg' || a.id === 'pet_def' || a.id === 'pet_hp') {
        score += v * 300; // 宠物专属词条高权重
      } else {
        score += v * 2;
      }
    });
  }
  // 宝石属性
  if (item.gemSlots) {
    item.gemSlots.forEach(function(gs) {
      if (gs && gs.gem && gs.gem.level > 0) {
        score += gs.gem.level * 50;
      }
    });
  }
  return score;
}

/**
 * 检查指定槽位是否有可提升的装备（用于装备界面栏位角标）
 * @param {string} slotId - 装备槽位ID
 * @returns {boolean}
 */
function isEquipSlotUpgradeable(slotId) {
  if (!G || !G.equipmentBag || !G.player || !G.player.equipment) return false;
  var currentEquip = G.player.equipment[slotId];
  for (var i = 0; i < G.equipmentBag.length; i++) {
    var bagItem = G.equipmentBag[i];
    if (!bagItem || bagItem.slot !== slotId) continue;
    if (!currentEquip) return true;
    if (calcEquipTotalScore(bagItem) > calcEquipTotalScore(currentEquip)) return true;
  }
  return false;
}

/**
 * 天赋待加点检查：
 * 当前激活的天赋方案中存在剩余未分配的天赋点
 */
function checkTalentUnspent() {
  if (typeof getTalentPoints !== 'function') return false;
  return getTalentPoints() > 0;
}

/**
 * 成就可领取检查：
 * 存在已达成但未领取奖励的成就
 */
function checkAchievementClaimable() {
  if (typeof ACHIEVEMENT_DEFS === 'undefined' || !G.achievementRewardsClaimed) return false;
  for (var i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
    var def = ACHIEVEMENT_DEFS[i];
    var progress = getAchievementProgress(def.id);
    var currentTier = getCurrentAchievementTier(def, progress);
    // 遍历所有已达成的tier，检查是否有未领取的
    for (var j = 0; j <= currentTier; j++) {
      var ms = getAchievementMilestone(def, j);
      if (!G.achievementRewardsClaimed[def.id + '_' + ms]) return true;
    }
  }
  return false;
}

/**
 * 宠物待加点检查：
 * 当前已上阵的宠物中，任意一只存在剩余未分配自由属性点
 */
function checkPetUnspentPoints() {
  if (!G || !G.player || !G.player.activeTeam || !G.pets) return false;
  for (var i = 0; i < G.player.activeTeam.length; i++) {
    var petId = G.player.activeTeam[i];
    if (!petId) continue;
    var pet = G.pets.find(function(p) { return p.id === petId; });
    if (!pet) continue;
    if ((pet.freeAttrPoints || 0) > 0) return true;
  }
  return false;
}

// 将红点检查函数暴露到全局，供其他模块调用
window.checkEquipUpgradeable = checkEquipUpgradeable;
window.checkTalentUnspent = checkTalentUnspent;
window.checkAchievementClaimable = checkAchievementClaimable;
window.checkPetUnspentPoints = checkPetUnspentPoints;
window.isEquipSlotUpgradeable = isEquipSlotUpgradeable;
window.calcEquipTotalScore = calcEquipTotalScore;

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
    { id: 'daily', icon: '📋', label: '任务' },
    { id: 'shop', icon: '🛒', label: '商城' },
    { id: 'lottery', icon: '🎰', label: '抽奖' },
    { id: 'dex', icon: '📖', label: '图鉴' },
    { id: 'talent', icon: '🌟', label: '天赋' },
    { id: 'training', icon: '🥋', label: '练功房' },
    { id: 'achievement', icon: '🏆', label: '成就' },
    { id: 'activity', icon: '🎯', label: '活动' },
    { id: 'raid', icon: '⚔️', label: '团本' },
    { id: 'treasure', icon: '🗺️', label: '藏宝图' },
    { id: 'samsara', icon: '🌀', label: '六道轮回' },
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
    // 需求4.1：任务标签可领取红点角标
    // v3.2 全局待办红点提示系统：统一红点角标判定
    var badge = '';
    if (!isLocked) {
      badge = getNavBadge(t.id);
    }
    return `
    <button onclick="navigateTo('${t.id}')" class="tab-btn ${currentScreen === t.id ? 'active' : ''}"${lockStyle} title="${isLocked ? '需要' + lockLevel + '级解锁' : ''}">
      ${t.icon} ${t.label}${lockIcon}${badge}
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
  const expPct = (G.player.expToNext > 0) ? Math.floor((G.player.exp / G.player.expToNext) * 100) : 0;
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
        // v3.x 需求2.2：主页任务栏拆分为主线/支线双栏
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
        var isMainQuest = (q.type === 'tutorial' || q.type === 'feature');
        var typeLabel = q.type === 'tutorial' ? '📖 新手引导' : q.type === 'feature' ? '🔑 功能解锁' : '⚔️ 历练任务';
        var typeColor = q.type === 'tutorial' ? '#22c55e' : q.type === 'feature' ? '#f59e0b' : '#a855f7';
        var barTitle = isMainQuest ? '🗡️ 主线任务' : '📜 支线任务';
        var barStyle = isMainQuest
          ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-600/50'
          : 'bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-600/40';

        // 主线任务栏（上方）
        var mainBarHtml = isMainQuest ? `
        <div class="${barStyle} rounded-xl p-4">
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
        </div>` : `
        <div class="bg-card border border-game rounded-xl p-3">
          <h2 class="font-bold text-sm text-gold mb-1">🗡️ 主线任务</h2>
          <p class="text-xs text-secondary">主线引导任务已完成，当前无进行中的主线任务</p>
        </div>`;

        // 支线任务栏（下方）
        var sideBarHtml = !isMainQuest ? `
        <div class="${barStyle} rounded-xl p-4">
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
              <div class="progress-fill ${done ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}" style="width:${pct}%"></div>
            </div>
            <span class="text-xs ${done ? 'text-green-400' : 'text-secondary'}">${Math.min(mq.progress, q.target)}/${q.target}</span>
          </div>
          <p class="text-xs text-yellow-400/70 mt-1">奖励：${rewardParts.join(' ')}</p>
        </div>` : `
        <div class="bg-card border border-game rounded-xl p-3">
          <h2 class="font-bold text-sm text-gold mb-1">📜 支线任务</h2>
          <p class="text-xs text-secondary">完成主线引导任务后解锁支线历练任务</p>
        </div>`;

        return mainBarHtml + sideBarHtml;
      })()}

      <div class="bg-card border border-game rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-lg">⚔️ 战斗</h2>
          <div class="flex items-center gap-2">
            <span class="text-xs text-secondary">地图：${map ? map.name : '未知'}</span>
            <select id="mapSelect" class="text-xs py-1 px-2" onchange="changeMap(this.value)">
              ${MAPS.filter(m => isMapUnlocked(m.id)).map(m => {
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

