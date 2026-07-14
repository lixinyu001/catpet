﻿// ===== ui_pet.js : 宠物/商店/抽奖/练功房/图鉴/天赋等UI（从ui.js拆分） =====

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
        <div class="flex items-center justify-between mb-2 gap-2">
          <h2 class="font-bold">${selSlot >= 0 ? '点击下方宠物放入槽位 ' + (selSlot+1) + '（点击此处取消）' : '点击上阵槽位选择要替换的位置'}</h2>
          <button class="btn-primary btn-sm whitespace-nowrap" onclick="refreshDeployedPetStats()" title="重新计算所有上阵宠物的属性与战力">🔄 刷新战力</button>
        </div>
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
          // v2.10.0 需求3.1：上阵宠物固定置顶，未上阵宠物维持原有顺序
          var sortedPets = G.pets.slice().sort(function(a, b) {
            var aInTeam = G.player.activeTeam.includes(a.id) ? 0 : 1;
            var bInTeam = G.player.activeTeam.includes(b.id) ? 0 : 1;
            return aInTeam - bInTeam;
          });
          var slice = sortedPets.slice(start, start + pg.pageSize);
          return slice.map(pet => {
          const stats = getPetStats(pet);
          const normalSkills = getNormalSkills(pet);
          const bloodline = getBloodlineSkill(pet);
          const isInTeam = G.player.activeTeam.includes(pet.id);
          return `
          <div class="pet-card rarity-${pet.rarity} ${isInTeam ? 'border-green-500 border-2' : ''} cursor-pointer relative" onclick="${selSlot >= 0 ? `assignPetToSlot('${pet.id}')` : `showPetDetail('${pet.id}')`}">
            ${isInTeam ? '<div class="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg">已上阵</div>' : ''}
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold" style="color:${RARITY_COLORS[RARITIES.indexOf(pet.rarity)]}">${RARITY_NAMES[RARITIES.indexOf(pet.rarity)]}</span>
              <div class="flex gap-1"></div>
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
        <div class="bg-panel rounded-lg p-2" style="${(pet.lifespan !== undefined && pet.lifespan < 99999 && pet.lifespan < 50) ? 'border:1px solid #ef4444;' : ''}">
          <span class="text-secondary">寿命：</span>
          ${pet.isDivineBeast ? '<span class="text-purple-400 font-bold">永生</span>' :
            (pet.lifespan !== undefined ?
              '<span class="' + (pet.lifespan < 50 ? 'text-red-400 font-bold' : pet.lifespan < 500 ? 'text-yellow-400' : 'text-green-400') + '">' + pet.lifespan + '</span>' +
              (pet.lifespan < 50 ? ' <span class="text-xs text-red-400">(无法参战)</span>' : '')
              : '<span class="text-secondary">未知</span>')
          }
        </div>
        <div class="bg-panel rounded-lg p-2"><span class="text-secondary">${pet.isDivineBeast ? '类型：神兽' : '类型：普通'}</span></div>
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
      ${(() => {
        // v2.7.0 需求4.1：二级战斗属性展示（暴击率/暴击伤害/闪避值/命中值等）
        var fmtPct = function(v) { return (v * 100).toFixed(1) + '%'; };
        var fmtNum = function(v) { return Math.floor(v || 0); };
        var critRate = stats.critRate || 0;
        var critDmg = stats.critDmg || 0;
        var dodgeRate = stats.dodgeRate || 0;
        var hitRate = stats.hitRate || 0;
        var vampPct = stats.vampPct || 0;
        var dmgReduce = stats.dmgReduce || 0;
        var skillTrigger = stats.skillTrigger || 0;
        var skillDmg = stats.skillDmg || 0;
        var regenPct = stats.regenPct || 0;
        var magicDmgPct = stats.magicDmgPct || 0;
        return '<h3 class="font-bold text-sm mb-2 mt-2">🎯 二级战斗属性</h3>' +
          '<div class="grid grid-cols-4 gap-2 mb-4 text-xs">' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">暴击率</p><p class="font-bold text-red-400">' + fmtPct(critRate) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">暴击伤害</p><p class="font-bold text-orange-400">' + fmtPct(critDmg) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">闪避率</p><p class="font-bold text-green-400">' + fmtPct(dodgeRate) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">命中率</p><p class="font-bold text-blue-400">' + fmtPct(hitRate) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">吸血</p><p class="font-bold text-pink-400">' + fmtPct(vampPct) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">减伤</p><p class="font-bold text-gray-300">' + fmtPct(dmgReduce) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">技能触发</p><p class="font-bold text-yellow-400">' + fmtPct(skillTrigger) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">技能增伤</p><p class="font-bold text-purple-400">' + fmtPct(skillDmg) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">回血</p><p class="font-bold text-red-300">' + fmtPct(regenPct) + '</p></div>' +
          '<div class="bg-panel rounded-lg p-1.5 text-center"><p class="text-secondary text-[10px]">法术增伤</p><p class="font-bold text-blue-300">' + fmtPct(magicDmgPct) + '</p></div>' +
          '</div>';
      })()}
      <h3 class="font-bold text-sm mb-2 mt-3">📋 基础五维${stats.charBonus ? '<span class="text-xs text-yellow-400 ml-2">（+号为人物属性20%加成）</span>' : ''}</h3>
      <div class="grid grid-cols-5 gap-2 mb-4 text-xs">
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
          <p class="text-secondary">耐力</p>
          <p class="font-bold">${stats.耐力 - (stats.charBonus ? stats.charBonus.耐力 : 0)}${stats.charBonus && stats.charBonus.耐力 > 0 ? '<span class="text-green-400">+' + stats.charBonus.耐力 + '</span>' : ''}</p>
        </div>
        <div class="bg-panel rounded-lg p-2 text-center">
          <p class="text-secondary">魔力</p>
          <p class="font-bold">${stats.魔力 - (stats.charBonus ? stats.charBonus.魔力 : 0)}${stats.charBonus && stats.charBonus.魔力 > 0 ? '<span class="text-green-400">+' + stats.charBonus.魔力 + '</span>' : ''}</p>
        </div>
      </div>
      ${(() => {
        // v2.7.0 需求1.1：批量加点与自动加点界面
        var freePts = (typeof getPetAttrPoints === 'function') ? (pet.freeAttrPoints || 0) : 0;
        var attrPts = (typeof getPetAttrPoints === 'function') ? getPetAttrPoints(pet) : {};
        var disabled = freePts <= 0 ? ' disabled style="opacity:0.5;cursor:not-allowed;"' : '';
        var btnClass = freePts <= 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-game border border-game-highlight hover:bg-game-highlight';
        // 批量加点输入框
        var batchHtml = ['力量','敏捷','体质','耐力','魔力'].map(function(k) {
          return '<div class="bg-panel rounded-lg p-2 text-center flex flex-col items-center gap-1">' +
            '<p class="text-secondary text-xs">' + k + '</p>' +
            '<p class="font-bold text-sm">' + (attrPts[k] || 0) + '</p>' +
            '<input type="number" min="0" max="' + freePts + '" value="0" id="batch_pt_' + k + '_' + pet.id + '" class="w-12 text-center bg-game-dark border border-game rounded px-1 py-0.5 text-xs" ' + disabled + '>' +
            '<button onclick="_allocateAttrPoint(\'' + pet.id + '\',\'' + k + '\')" class="' + btnClass + ' rounded px-2 py-0.5 text-xs"' + disabled + '>+1</button>' +
            '</div>';
        }).join('');
        // 自动加点比例设置
        var ratioHtml = ['力量','敏捷','体质','耐力','魔力'].map(function(k) {
          return '<div class="flex items-center gap-1">' +
            '<span class="text-xs text-secondary w-8">' + k + '</span>' +
            '<input type="number" min="0" max="100" value="20" id="ratio_pt_' + k + '_' + pet.id + '" class="w-12 text-center bg-game-dark border border-game rounded px-1 py-0.5 text-xs" ' + disabled + '>' +
            '<span class="text-xs text-secondary">%</span>' +
            '</div>';
        }).join('');
        return '<div class="mb-4 bg-game-dark rounded-lg p-3 border border-yellow-600/30">' +
          '<h4 class="font-bold text-sm mb-2 text-yellow-400">✨ 自由属性点: ' + freePts + '</h4>' +
          '<div class="grid grid-cols-5 gap-2 mb-3">' + batchHtml + '</div>' +
          '<div class="flex gap-2 mb-3">' +
            '<button onclick="_batchAllocateAttrPoints(\'' + pet.id + '\')" class="' + btnClass + ' rounded px-3 py-1 text-xs flex-1"' + disabled + '>批量加点</button>' +
            '<button onclick="_previewAttrAllocation(\'' + pet.id + '\')" class="' + btnClass + ' rounded px-3 py-1 text-xs flex-1"' + disabled + '>📊 预览加点</button>' +
          '</div>' +
          '<div class="border-t border-game pt-2 mt-2">' +
          '<p class="text-xs text-secondary mb-1">自动比例加点（总占比需=100%）</p>' +
          '<div class="grid grid-cols-5 gap-1 mb-2">' + ratioHtml + '</div>' +
          '<div class="flex gap-1 mb-1">' +
            '<button onclick="_autoAllocateAttrPoints(\'' + pet.id + '\')" class="' + btnClass + ' rounded px-2 py-1 text-xs flex-1"' + disabled + '>自动加点</button>' +
            '<button onclick="_saveAutoAllocateScheme(\'' + pet.id + '\')" class="bg-blue-700 hover:bg-blue-600 border border-blue-500 rounded px-2 py-1 text-xs flex-1">保存方案</button>' +
            '<button onclick="_resetAutoAllocateScheme(\'' + pet.id + '\')" class="bg-red-800 hover:bg-red-700 border border-red-600 rounded px-2 py-1 text-xs flex-1"' + (pet.autoAllocateRatios ? '' : ' disabled style="opacity:0.5;cursor:not-allowed;"') + '>重置方案</button>' +
          '</div>' +
          (pet.autoAllocateRatios ? '<p class="text-xs text-green-400">✓ 已启用自动加点方案（升级时自动分配）</p>' : '<p class="text-xs text-secondary">未设置自动加点方案</p>') +
          '</div>' +
          '<p class="text-xs text-secondary mt-2">每升1级获得10点属性点（5固定+5自由）</p>' +
          '</div>';
      })()}
      ${(typeof renderAttrPreviewPanel === 'function' ? renderAttrPreviewPanel(pet.id) : '')}
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
          '<div class="flex gap-2 mb-3">' +
            '<button class="btn-gold btn-sm flex-1 text-xs" onclick="closePetDetail();showPetEquipManageModal(\'' + pet.id + '\')">🎽 管理装备</button>' +
          '</div>' +
          setHtml;
      })()}
      ${(() => {
        // 需求：宠物详情页单独展示装备带来的资质、成长提升数值
        var peBonus = (typeof getPetEquipBonus === 'function') ? getPetEquipBonus(pet) : null;
        if (!peBonus) return '';
        var hasGrowth = peBonus.growthAddition && peBonus.growthAddition > 0;
        var hasApt = peBonus.aptAdditions && Object.values(peBonus.aptAdditions).some(function(v) { return v > 0; });
        if (!hasGrowth && !hasApt) return '';
        var html = '<div class="bg-panel rounded-lg p-3 border border-purple-600/50 mb-4">' +
          '<p class="text-xs text-purple-300 font-bold mb-2">✨ 装备加成（资质/成长）</p>';
        if (hasGrowth) {
          html += '<div class="text-xs mb-1"><span class="text-secondary">成长：</span><span class="text-gold">' + pet.growth.toFixed(2) + '</span><span class="text-green-400"> +' + peBonus.growthAddition.toFixed(2) + '</span><span class="text-secondary"> = </span><span class="text-gold font-bold">' + (pet.growth + peBonus.growthAddition).toFixed(2) + '</span></div>';
        }
        if (hasApt) {
          html += '<div class="grid grid-cols-2 gap-1 text-xs">';
          APTITUDE_KEYS.forEach(function(k) {
            var add = peBonus.aptAdditions[k] || 0;
            if (add > 0) {
              var base = pet.aptitude[k] || 1500;
              html += '<div><span class="text-secondary">' + k.replace('资质','') + '：</span><span class="text-blue-300">' + base + '</span><span class="text-green-400"> +' + add + '</span><span class="text-secondary"> = </span><span class="text-blue-300 font-bold">' + (base + add) + '</span></div>';
            }
          });
          html += '</div>';
        }
        html += '</div>';
        return html;
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
          var pct = (hi > 0) ? Math.max(0, Math.min(100, Math.floor((val / hi) * 100))) : 0;
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
          ${Object.entries(cb).filter(([k]) => ['力量','体质','敏捷','耐力','魔力','气血'].includes(k)).map(([k,v]) => `<span class="text-green-400">${k} +${v}</span>`).join('')}
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
      ${(() => {
        // 需求8：附加技能栏——展示宠物装备附带的技能，不占6格上限
        var equipSkills = (typeof getEquipSkills === 'function') ? getEquipSkills(pet) : [];
        if (equipSkills.length === 0) return '';
        var skillHtml = equipSkills.map(function(skill) {
          var typeIcon = getSkillTypeIcon(skill.type);
          var tierLabel = skill.tier ? getSkillTierLabel(skill.tier) : '';
          var tierColor = skill.tier ? getSkillTierColor(skill.tier) : '#94a3b8';
          var typeBg = skill.type === 'active' ? 'bg-red-900 text-red-300' : skill.type === 'aura' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300';
          return '<div class="bg-panel rounded-lg p-2 border border-emerald-600/50" style="background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02))">' +
            '<div class="flex items-center gap-1 mb-1 flex-wrap">' +
              '<span class="text-xs px-1 py-0.5 rounded ' + typeBg + '">' + typeIcon + '</span>' +
              (tierLabel ? '<span class="text-xs px-1 py-0.5 rounded font-bold" style="background:' + tierColor + '22;color:' + tierColor + '">' + tierLabel + '</span>' : '') +
              '<span class="text-xs px-1 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold">🎽装备</span>' +
            '</div>' +
            '<p class="font-bold text-xs text-emerald-300">' + skill.name + '</p>' +
            '<p class="text-xs text-secondary mt-0.5">' + (skill.desc || '') + '</p>' +
          '</div>';
        }).join('');
        return '<div class="mb-4">' +
          '<h3 class="font-bold text-sm mb-2">🎽 附加技能 <span class="text-xs text-emerald-400">（装备附带，不占技能格）</span></h3>' +
          '<div class="grid grid-cols-2 gap-2">' + skillHtml + '</div>' +
        '</div>';
      })()}
      ${/* v2.9.0 需求5.1：打书功能已迁移至进化页面，此处不再展示 */''}
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
            var petIds = ['hatch_boost','hatch_crystal','hatch_stone','fusion_stone','moon_dew','rare_egg','yuanxiao_str','yuanxiao_con','yuanxiao_agi','yuanxiao_int','guiyuan_pill','guixu_pill','refine_essence','refine_crystal','divine_essence','lifespan_low','lifespan_mid','lifespan_high'];
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
  // 需求：抽蛋成本在现有基础上提高5倍
  normal: { name: '普通池', desc: '品质和种族完全随机', price: 10000, icon: '🎲', currency: 'gold' },
  slime: { name: '史莱姆池', desc: '只出史莱姆种族', price: 15000, icon: '🟦', currency: 'gold', race: '史莱姆' },
  dragon: { name: '龙池', desc: '只出龙种族', price: 20000, icon: '🐲', currency: 'gold', race: '龙' },
  demon: { name: '恶魔池', desc: '只出恶魔种族', price: 17500, icon: '😈', currency: 'gold', race: '恶魔' },
  angel: { name: '天使池', desc: '只出天使种族', price: 17500, icon: '😇', currency: 'gold', race: '天使' },
  goblin: { name: '哥布林池', desc: '只出哥布林种族', price: 15000, icon: '👺', currency: 'gold', race: '哥布林' },
  elf: { name: '精灵池', desc: '只出精灵种族', price: 17500, icon: '🧝', currency: 'gold', race: '精灵' },
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
  // 需求14：抽蛋池资质/成长额外加成由原20%下调至10%
  // v2.9.0 需求2.1：抽蛋池不产出普通品质，仅优秀及以上5档
  var pet = generatePetBase(chosenName, 0.10, true);
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
  // v3.0 抽蛋保底检查
  if (typeof checkEggPity === 'function') {
    var pityEgg = checkEggPity(egg);
    if (pityEgg) {
      showToast('🎊 100抽保底触发！获得 T5 宠物蛋！', 'success');
    }
  }
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
  var pityTriggered = false;
  for (var i = 0; i < 10; i++) {
    var egg = generateEggFromPool(poolType);
    G.eggs.push(egg);
    results.push(egg);
    // v3.0 抽蛋保底检查（逐抽检查）
    if (typeof checkEggPity === 'function') {
      var pityEgg = checkEggPity(egg);
      if (pityEgg) { pityTriggered = true; results.push(pityEgg); }
    }
  }
  if (pityTriggered) {
    showToast('🎊 100抽保底触发！获得 T5 宠物蛋！', 'success');
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
  // 需求：技能池抽取价格全面上调
  skill_normal: { name: '普通技能池', desc: '随机技能类型，普通85%/高级10%/超级5%', price: 150, icon: '🎲', currency: 'diamond', type: 'all' },
  skill_active: { name: '主动技能池', desc: '只出主动技能，普通85%/高级10%/超级5%', price: 135, icon: '⚔️', currency: 'diamond', type: 'active' },
  skill_passive: { name: '被动技能池', desc: '只出被动技能，普通85%/高级10%/超级5%', price: 105, icon: '🛡️', currency: 'diamond', type: 'passive' },
  skill_aura: { name: '光环技能池', desc: '只出光环技能，普通85%/高级10%/超级5%', price: 165, icon: '✨', currency: 'diamond', type: 'aura' },
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

      // 需求7：被动技能触发日志——记录对伤害有影响的被动效果
      var _passiveTriggers = [];
      if (ps.passives.critRate && isCrit) {
        _passiveTriggers.push({ name: '暴击精通', cond: '暴击触发', value: '+' + (ps.passives.critRate * 100).toFixed(0) + '%暴击率' });
      }
      if (ps.passives.critMult && isCrit) {
        _passiveTriggers.push({ name: '暴击增幅', cond: '暴击触发', value: '暴击倍率+' + (ps.passives.critMult).toFixed(2) });
      }
      if (ps.passives.ignoreDef) {
        _passiveTriggers.push({ name: '破甲穿透', cond: '攻击时', value: '无视防御' + (ps.passives.ignoreDef * 100).toFixed(0) + '%' });
      }
      if (ps.passives.dmgBonus) {
        _passiveTriggers.push({ name: '伤害增幅', cond: '攻击时', value: '伤害+' + (ps.passives.dmgBonus * 100).toFixed(0) + '%' });
      }

      let rawDmg;
      if (usedSkill) {
        let dmgPct = usedSkill.dmgPct || 1;
        let ignoreDefPct = usedSkill.ignoreDefPct || 0;
        // 同步战斗系统：防御削减系数0.7→0.6
        rawDmg = atkPower * dmgPct - monster.def * (0.6 - ignoreDefPct);
        pr.skills++;
        // 需求7：被动加成对主动技能同样生效
        if (ps.passives.dmgBonus) rawDmg *= (1 + ps.passives.dmgBonus);
      } else {
        let ignoreDef = ps.passives.ignoreDef || 0;
        rawDmg = atkPower - monster.def * (0.6 - ignoreDef);
        if (ps.passives.dmgBonus) rawDmg *= (1 + ps.passives.dmgBonus);
      }
      rawDmg = Math.round(rawDmg * randomFloat(0.90, 1.10));
      if (isCrit) rawDmg = Math.round(rawDmg * critMult);
      let damage = Math.max(1, rawDmg);

      // 需求7：辅助技能效果日志
      var _buffLog = null;
      if (usedSkill && (usedSkill.category === 'single_buff' || usedSkill.category === 'aoe_buff' || usedSkill.category === 'single_heal' || usedSkill.category === 'aoe_heal')) {
        var _buffTarget = (usedSkill.category.indexOf('aoe') >= 0) ? '己方全体' : '自身';
        var _buffEffect = usedSkill.desc || (usedSkill.dmgPct ? '伤害' + (usedSkill.dmgPct * 100) + '%' : '辅助效果');
        _buffLog = { target: _buffTarget, effect: _buffEffect, duration: usedSkill.duration || 3 };
      }

      pr.damage += damage;
      pr.attacks++;
      if (isCrit) pr.crits++;
      if (damage > pr.maxHit) pr.maxHit = damage;
      results.totalDamage += damage;
      // 需求：练功房战斗日志重构 - 回合+时序格式
      var logEntry = {
        round: round,
        seq: i + 1,
        petName: getPetDisplayName(pet),
        petPos: i + 1,
        action: usedSkill ? '技能' : '普攻',
        skillName: usedSkill ? usedSkill.name : null,
        damage: damage,
        isCrit: isCrit,
        bloodlineTrigger: (ps.bloodline && ps.bloodline.id === 'dragon_might' && isCrit) ? ps.bloodline.name : null,
        isMagicSkill: usedSkill ? !isPhysicalSkill(usedSkill) : false,
        buffLog: _buffLog,
        passiveTriggers: _passiveTriggers,
      };
      results.logs.push(logEntry);

      // 需求7：DOT持续伤害日志——血统/技能附带的灼烧/中毒效果
      if (ps.bloodline && ps.bloodline.effects) {
        var _be = ps.bloodline.effects;
        if (_be.burnPct || _be.poisonPct) {
          var _dotDmg = Math.floor(damage * (_be.burnPct || _be.poisonPct || 0.15));
          if (_dotDmg > 0) {
            results.totalDamage += _dotDmg;
            pr.damage += _dotDmg;
            results.logs.push({
              round: round, seq: i + 1 + 0.5, petName: getPetDisplayName(pet), petPos: i + 1,
              action: 'DOT', dotSource: ps.bloodline.name, dotTarget: '训练木桩', dotDmg: _dotDmg,
              dotType: _be.burnPct ? '灼烧' : '中毒',
            });
          }
        }
      }
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
  // v2.9.0 需求6.1：练功房战斗日志优化 —— 完整回合制战斗记录
  var logsHtml = '';
  var currentRound = 0;
  var seqInRound = 0;
  var activeBuffs = {}; // {petName: [{name, effect, remaining, total}]}
  r.logs.forEach(function(l) {
    var c = petColorMap[l.petName] || '#fff';
    if (l.round !== currentRound) {
      // 回合切换时递减buff持续时间
      Object.keys(activeBuffs).forEach(function(pn) {
        activeBuffs[pn] = activeBuffs[pn].filter(function(b) {
          b.remaining--;
          if (b.remaining <= 0) {
            logsHtml += '<div class="text-xs py-0.5 pl-4 text-orange-400">　🔄 ' + pn + ' 的「' + b.name + '」效果已消散</div>';
            return false;
          }
          return true;
        });
      });
      currentRound = l.round;
      seqInRound = 0;
      logsHtml += '<div class="font-bold text-gold text-sm mt-2 mb-1 border-b border-yellow-600/30 pb-1">── 第 ' + l.round + ' 回合 ──</div>';
    }
    seqInRound++;
    // DOT日志单独渲染
    if (l.action === 'DOT') {
      var dotDesc = '<span class="text-secondary">　└ </span>';
      dotDesc += '<span class="text-orange-300">' + l.dotType + '效果</span>';
      dotDesc += '<span class="text-secondary"> → </span><span class="text-red-300">' + l.dotTarget + '</span>';
      dotDesc += '<span class="text-gold">，造成' + l.dotDmg.toLocaleString() + '点伤害</span>';
      dotDesc += '<span class="text-secondary">（来源：' + l.dotSource + '）</span>';
      logsHtml += '<div class="text-xs py-0.5 pl-6">' + dotDesc + '</div>';
      return;
    }
    // 构建完整时序描述（含释放方→目标）
    var desc = '<span class="text-secondary text-xs">[' + seqInRound + ']</span> ';
    desc += '<span class="font-bold" style="color:' + c + '">' + l.petName + '</span>';
    if (l.action === '技能' && l.skillName) {
      desc += '<span class="' + (l.isMagicSkill ? 'text-blue-300' : 'text-purple-300') + '"> 🗡️释放「' + l.skillName + '」</span>';
    } else {
      desc += '<span class="text-secondary"> ⚔️普攻</span>';
    }
    desc += '<span class="text-secondary"> → </span><span class="text-red-300">训练木桩</span>';
    desc += '<span class="text-gold">，造成' + l.damage.toLocaleString() + '点伤害</span>';
    if (l.isCrit) {
      desc += '<span class="text-yellow-400 font-bold"> ⚡暴击</span>';
    }
    if (l.bloodlineTrigger) {
      desc += '<span class="text-cyan-300"> | 🩸血统「' + l.bloodlineTrigger + '」触发</span>';
    }
    // 辅助效果日志（新增/叠加）
    if (l.buffLog) {
      desc += '<span class="text-green-300"> | ✨为' + l.buffLog.target + '施加「' + l.buffLog.effect + '」(' + l.buffLog.duration + '回合)</span>';
      // 记录buff到activeBuffs
      if (!activeBuffs[l.petName]) activeBuffs[l.petName] = [];
      var existing = activeBuffs[l.petName].find(function(b) { return b.name === l.buffLog.effect; });
      if (existing) {
        existing.remaining = l.buffLog.duration; // 刷新持续时间
        logsHtml += '<div class="text-xs py-0.5 pl-4 text-green-400">　📈 ' + l.petName + ' 的「' + l.buffLog.effect + '」效果叠加刷新</div>';
      } else {
        activeBuffs[l.petName].push({ name: l.buffLog.effect, remaining: l.buffLog.duration, total: l.buffLog.duration });
      }
    }
    logsHtml += '<div class="text-xs py-0.5 pl-2">' + desc + '</div>';
    // 被动技能触发日志
    if (l.passiveTriggers && l.passiveTriggers.length > 0) {
      l.passiveTriggers.forEach(function(pt) {
        logsHtml += '<div class="text-xs py-0.5 pl-6"><span class="text-secondary">　└ 🛡️被动「</span><span class="text-yellow-300">' + pt.name + '</span><span class="text-secondary">」' + pt.cond + ' → ' + pt.value + '</span></div>';
      });
    }
  });
  // 战斗结束：剩余buff消散
  if (currentRound > 0) {
    Object.keys(activeBuffs).forEach(function(pn) {
      activeBuffs[pn].forEach(function(b) {
        logsHtml += '<div class="text-xs py-0.5 pl-4 text-orange-400">　🔄 战斗结束：' + pn + ' 的「' + b.name + '」效果消散</div>';
      });
    });
    logsHtml += '<div class="font-bold text-green-400 text-sm mt-2 mb-1 border-b border-green-600/30 pb-1">✅ 战斗结束 — 共' + r.rounds + '回合，总伤害' + r.totalDamage.toLocaleString() + '</div>';
  }
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
    '<h3 class="font-bold text-sm mb-2 text-gold-light">📜 完整战斗日志 <span class="text-xs text-secondary">（v2.9.0 回合制格式 · 共' + r.logs.length + '条）</span></h3>' +
    '<div class="bg-panel rounded-lg p-2 scrollbar-thin" style="max-height:400px;overflow-y:auto;">' +
      logsHtml +
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
  // BUG修复：神兽未加入展示列表，导致图鉴中神兽分类为空
  if (typeof DIVINE_BEASTS !== 'undefined') {
    allDisplayNames = allDisplayNames.concat(DIVINE_BEASTS);
  }
  // 顶部Tab切换
  var tabsHtml = (function() {
    var tabs = [
      { id: 'pets', label: '🐾 宠物图鉴' },
      { id: 'races', label: '💠 种族值' },
      { id: 'evolve', label: '🔄 进阶图鉴' },
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
      var total = (rv.力量 + rv.体质 + rv.敏捷 + rv.耐力 + rv.魔力).toFixed(1);
      // 血统重构：不再使用种族通用血统，显示提示即可
      var bsName = '专属血统';
      var bsDesc = '每只宠物拥有独立专属血统，详见宠物详情';
      var raceColor = RARITY_COLORS[RACES.indexOf(race)] || '#fff';
      // 各属性条：以最大值2.5为满格
      var maxRv = 2.5;
      var attrsHtml = ['力量', '体质', '敏捷', '耐力', '魔力'].map(function(k) {
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

  // ===== 进阶图鉴 Tab =====
  if (dexTab === 'evolve') {
    // 收集所有可进阶宠物（PET_DEX 中 evolvable=true 的条目）
    var evolvablePets = [];
    Object.keys(PET_DEX).forEach(function(name) {
      var d = PET_DEX[name];
      if (d && d.evolvable && d.evolveChain && d.evolveChain.length >= 2) {
        evolvablePets.push(name);
      }
    });
    // 按 evolveType 分组（T1 / T3）
    var t1Chains = evolvablePets.filter(function(n) { return PET_DEX[n].evolveType === 'T1'; });
    var t3Chains = evolvablePets.filter(function(n) { return PET_DEX[n].evolveType === 'T3'; });
    // 排序
    t1Chains.sort(function(a, b) { return a.localeCompare(b, 'zh'); });
    t3Chains.sort(function(a, b) { return a.localeCompare(b, 'zh'); });

    // 渲染单条进阶链
    function renderEvolveChain(baseName) {
      var baseDex = PET_DEX[baseName];
      var chain = baseDex.evolveChain;
      var stageDivs = [];
      // 遍历进阶链各阶段，构建展示卡片
      for (var k = 0; k < chain.length; k++) {
        var dex2 = getPetDex(chain[k]);
        var tier2 = getPetTier(chain[k]);
        var tierLabel2 = (typeof getPetTierLabel === 'function') ? getPetTierLabel(chain[k]) : 'T' + tier2;
        var tierColor2 = tier2 === 5 ? '#ef4444' : tier2 === 4 ? '#fb923c' : tier2 === 3 ? '#a855f7' : tier2 === 2 ? '#3b82f6' : '#22c55e';
        var raceColor2 = RARITY_COLORS[RACES.indexOf(dex2.race)] || '#94a3b8';
        var specIcon2 = (typeof SPECIALTY_ICONS !== 'undefined' && SPECIALTY_ICONS[dex2.specialty]) || '⚖️';
        var specName2 = (typeof SPECIALTY_NAMES !== 'undefined' && SPECIALTY_NAMES[dex2.specialty]) || '均衡型';
        var maxSkills2 = getPetMaxSkills(chain[k]);
        var aptSummary2 = APTITUDE_KEYS.map(function(key) {
          var r = dex2.aptRange[key] || [1200, 1800];
          var sn = key.replace('资质', '');
          return '<span class="text-xs text-secondary">' + sn + ' ' + r[0] + '-' + r[1] + '</span>';
        }).join(' <span class="text-secondary">|</span> ');
        var innateHtml2 = '';
        if (dex2.innateSkills && dex2.innateSkills.length > 0) {
          innateHtml2 = dex2.innateSkills.map(function(sid) {
            var sk = (typeof ALL_SKILLS !== 'undefined') ? ALL_SKILLS.find(function(s) { return s.id === sid; }) : null;
            return sk ? '<span class="text-xs text-yellow-400 mr-1">★' + sk.name + '</span>' : '<span class="text-xs text-yellow-400 mr-1">★' + sid + '</span>';
          }).join('');
        } else {
          innateHtml2 = '<span class="text-xs text-secondary">随机</span>';
        }
        var stageLabel2 = k === 0 ? '基础形态' : (k === 1 ? '一阶进化' : '二阶进化');
        var stageColor2 = k === 0 ? '#22c55e' : k === 1 ? '#a855f7' : '#ef4444';
        stageDivs.push('<div class="bg-card border rounded-xl p-3" style="border-color:' + stageColor2 + '44;flex:1;min-width:180px;">' +
          '<div class="flex items-center justify-between mb-1">' +
          '<div>' +
          '<p class="font-bold text-sm" style="color:' + stageColor2 + '">' + chain[k] + '</p>' +
          '<p class="text-xs" style="color:' + raceColor2 + '">' + dex2.race + ' · ' + specIcon2 + ' ' + specName2 + '</p>' +
          '</div>' +
          '<div class="text-right">' +
          '<span class="text-xs font-black px-2 py-1 rounded" style="background:' + tierColor2 + '22;color:' + tierColor2 + ';border:1px solid ' + tierColor2 + '">' + tierLabel2 + '</span>' +
          '<p class="text-xs mt-0.5" style="color:' + stageColor2 + '">' + stageLabel2 + '</p>' +
          '</div>' +
          '</div>' +
          '<div class="text-xs mb-1"><span class="text-secondary">成长：</span><span class="text-gold">' + dex2.growthRange[0].toFixed(2) + ' ~ ' + dex2.growthRange[1].toFixed(2) + '</span></div>' +
          '<div class="text-xs mb-1"><span class="text-secondary">满技能：</span><span class="text-blue-400 font-bold">' + maxSkills2 + '</span> ' + innateHtml2 + '</div>' +
          '<div class="text-xs"><span class="text-secondary">资质：</span>' + aptSummary2 + '</div>' +
          '</div>');
      }
      // 插入箭头
      var finalHtml = '';
      for (var m = 0; m < stageDivs.length; m++) {
        finalHtml += stageDivs[m];
        if (m < stageDivs.length - 1) {
          var avMax = (m === 0) ? EVOLVE_SYSTEM_CONFIG.ADVANCE_VALUE_MAX_T1_TO_T3 : EVOLVE_SYSTEM_CONFIG.ADVANCE_VALUE_MAX_T3_TO_T5;
          finalHtml += '<div class="flex flex-col items-center justify-center px-1"><span class="text-lg">⬇️</span><span class="text-xs text-secondary mt-0.5">进阶值 ' + avMax + '</span></div>';
        }
      }
      return '<div class="bg-panel border border-game rounded-xl p-3">' +
        '<div class="flex flex-wrap items-stretch gap-1">' + finalHtml + '</div>' +
        '<div class="mt-2 pt-2 border-t border-game/40 text-xs text-secondary">' +
        '<span>📦 进阶道具：</span>' +
        '<span class="text-green-400">低级进化晶石(15点)</span> | ' +
        '<span class="text-blue-400">中级进化晶石(50点)</span> | ' +
        '<span class="text-purple-400">高级进化晶石(150点)</span>' +
        '<span class="ml-2 text-yellow-400">（使用时有概率触发2~9倍暴击）</span>' +
        '</div>' +
        '</div>';
    }

    var t1Html = t1Chains.map(renderEvolveChain).join('');
    var t3Html = t3Chains.map(renderEvolveChain).join('');

    return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">📖 图鉴</h1>
      <span class="text-sm text-secondary">进阶图鉴</span>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-3">
      ${tabsHtml}
      <div class="bg-card border border-game rounded-xl p-3 text-xs text-secondary">
        <p>💡 可进阶宠物通过使用进化晶石积累进阶值，满值后自动进阶。每次进阶成长和资质提升30%，T5级解锁6技能格。</p>
        <p class="mt-1">T1可进阶宠物可进阶2次（T1→T3→T5），T3可进阶宠物可进阶1次（T3→T5）。</p>
      </div>
      <div class="bg-card border border-game rounded-xl p-3">
        <h2 class="font-bold text-sm text-green-400 mb-2">🌱 T1可进阶宠物（${t1Chains.length}只 · 可进阶2次 T1→T3→T5）</h2>
        <div class="space-y-3">${t1Html}</div>
      </div>
      <div class="bg-card border border-game rounded-xl p-3">
        <h2 class="font-bold text-sm text-purple-400 mb-2">⚡ T3可进阶宠物（${t3Chains.length}只 · 可进阶1次 T3→T5）</h2>
        <div class="space-y-3">${t3Html}</div>
      </div>
    </main>
  </div>`;
  }

  // ===== 宠物图鉴 Tab（原有逻辑） =====
  var dexFilter = window._dexFilter || 'all';
  // 按种族分类筛选 + 融合限定分类
  var races = ['all'].concat(RACES, ['fusion', 'divine']);
  var filteredNames;
  if (dexFilter === 'fusion') {
    filteredNames = (typeof FUSION_ONLY_PETS !== 'undefined') ? FUSION_ONLY_PETS.slice() : [];
  } else if (dexFilter === 'divine') {
    filteredNames = allDisplayNames.filter(function(name) {
      var dex = getPetDex(name);
      return !!(dex && dex.isDivineBeast);
    });
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
            var icon = r === 'all' ? '📋' : r === 'fusion' ? '✨' : r === 'divine' ? '🐲' : '';
            var name = r === 'all' ? '全部' : r === 'fusion' ? '融合限定' : r === 'divine' ? '神兽' : r;
            var extraStyle = r === 'fusion' ? 'border-pink-500 text-pink-300' : r === 'divine' ? 'border-amber-500 text-amber-300' : '';
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
          var divineBadge = dex.isDivineBeast ? '<span class="text-xs font-black px-2 py-0.5 rounded ml-1" style="background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b">🐲神兽</span>' : '';
          var cardBorder = dex.fusionOnly ? 'border-pink-500' : dex.isDivineBeast ? 'border-amber-500' : 'border-game';
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
            '<div><p class="font-bold text-sm">' + name + fusionBadge + divineBadge + '</p>' +
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
              var synthPet = { name: name };
              var bSkill = null;
              if (typeof generatePetBloodlineSkill === 'function') {
                bSkill = generatePetBloodlineSkill(synthPet);
              }
              if (!bSkill) {
                // 兜底：PET_BLOODLINE_DEX 已在 config.js 中清理为 null，改用 PET_BLOOD_ALL 统一数据源
                var bloodData = (typeof PET_BLOOD_ALL !== 'undefined') ? PET_BLOOD_ALL[name] : null;
                if (bloodData) {
                  bSkill = { name: bloodData.name, desc: bloodData.desc, type: 'bloodline', effects: bloodData.effects || {} };
                }
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
      var typeLabel = sn.type === 'core' ? '核心天赋' : sn.type === 'medium' ? '大天赋' : sn.type === 'origin' ? '星图中心' : '普通天赋';
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

  // v2.11.0 需求6.1：天赋双方案UI
  var activeBuild = G.activeTalentBuild || 1;
  var build2Unlocked = G.talentBuild2Unlocked;
  var alloc1 = getAllocatedTalentPoints(1);
  var alloc2 = getAllocatedTalentPoints(2);
  var totalEarned = G.totalTalentPointsEarned || 0;
  var buildSwitchHtml = '';
  if (build2Unlocked) {
    // 已解锁双方案：显示切换按钮
buildSwitchHtml = '<div class="flex items-center gap-2">' +
'<button class="btn-sm ' + (activeBuild === 1 ? 'btn-gold' : 'btn-primary') + '" onclick="switchTalentBuild(1)">' +
'📋 方案一' + (activeBuild === 1 ? ' ✓' : '') + '<span class="text-xs ml-1">(' + alloc1 + '点)</span></button>' +
'<button class="btn-sm ' + (activeBuild === 2 ? 'btn-gold' : 'btn-primary') + '" onclick="switchTalentBuild(2)">' +
'📋 方案二' + (activeBuild === 2 ? ' ✓' : '') + '<span class="text-xs ml-1">(' + alloc2 + '点)</span></button>' +
'<button class="btn-sm bg-red-800 hover:bg-red-700 border border-red-600 text-red-200 rounded px-2 py-1" onclick="confirmResetTalentBuild(' + activeBuild + ')">🔄 重置方案' + activeBuild + '</button>' +
'</div>';
  } else {
    // 未解锁：显示解锁按钮
buildSwitchHtml = '<div class="flex items-center gap-2">' +
'<span class="text-xs text-secondary">当前：方案一（' + alloc1 + '点）</span>' +
'<button class="btn-sm btn-primary" onclick="unlockTalentBuild2()">💎 解锁方案二（500钻石）</button>' +
'<button class="btn-sm bg-red-800 hover:bg-red-700 border border-red-600 text-red-200 rounded px-2 py-1" onclick="confirmResetTalentBuild(1)">🔄 重置方案1</button>' +
'</div>';
  }

  return `
  <div class="min-h-screen flex flex-col">
    <header class="bg-panel border-b border-game px-4 py-3 flex items-center justify-between">
      <h1 class="font-fantasy text-gold text-lg">🌟 天赋星图</h1>
      <div class="flex gap-3 text-sm items-center flex-wrap">
        <span class="text-yellow-400">⭐ 天赋点 <span class="font-bold text-lg">${tp}</span></span>
        <span class="text-secondary">| 总获得 ${totalEarned}/160</span>
        <span class="text-secondary">| 等级 ${G.player.level}/${G.player.maxLevel}</span>
        <span class="text-secondary">| 转生 ${G.player.rebirth}</span>
      </div>
    </header>
    <nav class="bg-panel border-b border-game px-2 py-2 flex flex-wrap gap-1 overflow-x-auto">${renderNav()}</nav>
    <main class="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
      <div class="bg-card border border-purple-700 rounded-xl p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-secondary">v2.11.0 天赋双方案：七大专精分支（输出/防御/常规资源/装备养成/宠物养成/藏宝图/副本活动），全树共320点，玩家最多获得160点，无法点满全树。可解锁第二套方案自由切换Build。核心天赋需一路点亮前置才能解锁。</p>
          <div class="flex flex-wrap gap-1">${legendHtml}</div>
        </div>
      </div>
      <div class="bg-card border border-game rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        ${buildSwitchHtml}
        <span class="text-xs text-secondary">💡 切换方案不影响已分配的天赋点，两套方案独立加点，共用天赋点池</span>
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
            <p class="font-bold text-secondary">📌 天赋规则（v2.11.0 双方案）</p>
            <p>· 全树320点，玩家最多获得160点，无法点满</p>
            <p>· 七大分支：输出/防御/资源系/装备/宠物/藏宝图/副本</p>
            <p>· v2.11.0：解锁第二套方案（500钻石）可自由切换</p>
            <p>· 两套方案独立加点，共用天赋点池</p>
            <p>· 战斗中无法切换方案</p>
            <p>· 普通天赋：基础加成</p>
            <p>· 大天赋：较强加成，需前置</p>
            <p>· 核心天赋：最强加成，需所有前置点亮</p>
            <p>· 6次转生达160级即可获得全部160点</p>
            <p>· 黄色圆点表示已点亮等级</p>
          </div>
        </div>
      </div>
    </main>
  </div>`;
}

