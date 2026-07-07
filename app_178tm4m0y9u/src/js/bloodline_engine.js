// ===== bloodline_engine.js : 血统技能机制引擎 =====
// 依据 docs/10-血统技能逻辑定义.md，将血统技能的触发型特殊效果接入真实战斗系统
// 数据定义 PET_BLOODLINE_MECHANICS + 引擎函数 triggerBloodlineMechanics 等

// ==================== 血统机制数据定义 ====================
// 每个宠物的 mechanics 数组，结构与文档定义一致
var PET_BLOODLINE_MECHANICS = {
  // ===== 宠物专属血统技能（56个）— 第1批 =====
  '小火焰': [
    { id:'burn_stack', trigger:'onPhysicalAttackHit', target:'target', action:'applyStatus', params:{ status:'burn', stack:1, maxStack:3, dotPct:0.10, dotSource:'lastHitDmg' } },
    { id:'low_hp_double_burn', trigger:'onPhysicalAttackHit', condition:{ selfHpBelow:0.30 }, target:'target', action:'applyStatus', params:{ status:'burn', stack:1, maxStack:3, dotPct:0.20, dotSource:'lastHitDmg' } }
  ],
  '冰晶兽': [
    { id:'frostbite_on_hit', trigger:'onPhysicalHit', chance:0.30, target:'attacker', action:'applyStatus', params:{ status:'frostbite', stack:1, duration:2, spdPct:-0.10 } },
    { id:'frostbite_dmg_reduce', trigger:'passive', target:'self', action:'dynamicBonus', params:{ stat:'dmgReduce', formula:'0.05*frostbiteLikeDebuffCount', max:0.25 } }
  ],
  '暗影狼': [
    { id:'backstab', trigger:'onFirstAttack', target:'self', action:'modifyNextAttack', params:{ stat:'dmgPct', value:0.25, mode:'add', extraStats:{ ignoreDef:0.15 }, consume:true } },
    { id:'low_hp_crit', trigger:'onAttackHit', condition:{ targetHpBelow:0.50 }, target:'self', action:'modifyStat', params:{ stat:'critRate', value:0.30, duration:0, mode:'add', applyTo:'currentAttack' } }
  ],
  '雷霆鹰': [
    { id:'thunder_strike', trigger:'onAttackHit', chance:0.40, condition:{ isFirstAttack:true, resetPerTurn:true }, target:'target', action:'extraAttack', params:{ dmgPct:0.20, dmgType:'lightning', powerAttr:'atk' } },
    { id:'thunder_delay', trigger:'onAttackHit', chance:0.40, condition:{ isFirstAttack:true, resetPerTurn:true }, target:'target', action:'delayTurnOrder', params:{ positions:1 } }
  ],
  '翡翠蛇': [
    { id:'poison_paralyze', trigger:'onStatusTick', condition:{ statusType:'poison' }, chance:0.20, target:'target', action:'applyStatus', params:{ status:'paralyze', duration:1 } },
    { id:'poison_stack_paralyze_chance', trigger:'passive', target:'self', action:'dynamicBonus', params:{ stat:'paralyzeChanceBonus', formula:'0.10*targetPoisonStack', max:1.0 } }
  ],
  '岩石巨人': [
    { id:'rock_shell_stack', trigger:'onHit', target:'self', action:'applyStatus', params:{ status:'rockShell', stack:1, maxStack:10, defPctPerStack:0.03 } },
    { id:'rock_shell_full', trigger:'onHit', condition:{ statusStackGTE:{ status:'rockShell', count:10 } }, target:'self', action:'forceBlock', params:{} },
    { id:'rock_shell_reflect', trigger:'onHit', condition:{ statusStackGTE:{ status:'rockShell', count:10 } }, target:'attacker', action:'reflect', params:{ reflectPct:0.30, consumeStatus:'rockShell', consumeAll:true } }
  ],
  '风暴龙': [
    { id:'wind_slash', trigger:'onPhysicalAttackHit', chance:0.25, target:'enemyAdjacent', action:'dealDamage', params:{ dmgPct:0.40, powerAttr:'lastHitDmg' } },
    { id:'wind_slash_def_reduce', trigger:'onPhysicalAttackHit', chance:0.25, target:'enemyAdjacent', action:'applyStatus', params:{ status:'defReduce', defPct:-0.10, duration:2 } }
  ],
  '月光狐': [
    { id:'moon_shield', trigger:'onHealCast', target:'target', action:'addShield', params:{ shieldType:'moonShield', absorbPct:0.30, base:'healAmount', duration:2 } },
    { id:'night_heal_boost', trigger:'passive', condition:{ isNight:true }, target:'self', action:'modifyStat', params:{ stat:'healBoost', value:0.20, mode:'add' } }
  ],
  '深渊鱼': [
    { id:'corrode_apply', trigger:'onMagicAttackHit', target:'target', action:'applyStatus', params:{ status:'corrode', duration:3, magicDmgTaken:0.15 } },
    { id:'corrode_damage_boost', trigger:'onMagicAttackHit', condition:{ targetHasStatus:'corrode' }, target:'self', action:'modifyStat', params:{ stat:'magicDmgPct', value:0.20, mode:'add', applyTo:'currentAttack' } }
  ],
  '烈焰凤凰': [
    { id:'nirvana_revive', trigger:'onDeath', condition:{ isFirstDeath:true }, target:'self', action:'revive', params:{ hpPct:0.50, clearDebuff:true } },
    { id:'nirvana_burn_soul', trigger:'onDeath', condition:{ isFirstDeath:true }, target:'self', action:'applyStatus', params:{ status:'nirvana', duration:3, attackApplySoulBurn:true } },
    { id:'soul_burn_on_attack', trigger:'onAttackHit', condition:{ hasStatus:'nirvana' }, target:'target', action:'applyStatus', params:{ status:'soulBurn', duration:2, noHeal:true, undispellable:true } }
  ],
  '霜冻巨人': [
    { id:'frozen_field', trigger:'onTurnStart', target:'self', action:'fieldEffect', params:{ fieldType:'field_frozen', duration:0, effects:{ enemyChancePerTurn:0.20, enemyStatus:'freeze', enemyStatusDuration:1, selfStatBonus:{ magicDmgTaken:-0.20 } } } }
  ],
  '幽灵猫': [
    { id:'ghost_form', trigger:'onDodge', cooldown:3, target:'self', action:'applyStatus', params:{ status:'ghost', duration:1, immunePhysical:true, nextAttackCrit:true } }
  ],
  '黄金甲虫': [
    { id:'first_hit_reduce', trigger:'onHit', condition:{ isFirstHit:true }, target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.70, mode:'add', applyTo:'currentHit', consume:true } },
    { id:'gold_armor_shield', trigger:'onTurnStart', target:'self', action:'addShield', params:{ shieldType:'goldArmor', absorbPct:0.05, base:'maxHp', duration:1, noStack:true } }
  ],
  '星辰鹿': [
    { id:'star_light', trigger:'onSkillCast', chance:0.30, target:'allyAll', action:'heal', params:{ healPct:0.50, base:'int' } },
    { id:'star_light_counter', trigger:'onSkillCast', chance:0.30, target:'self', action:'counterIncrement', params:{ counterKey:'starLightCount', maxCount:3, onMaxTrigger:{ action:'modifyStat', params:{ stat:'nextSpellCrit', value:1.0, mode:'set' } } } }
  ],
  '毒液蜘蛛': [
    { id:'poison_stat_reduce', trigger:'onStatusTick', condition:{ statusType:'poison' }, target:'target', action:'applyStatus', params:{ status:'atkReduce', atkPct:-0.10, duration:1 } },
    { id:'poison_int_reduce', trigger:'onStatusTick', condition:{ statusType:'poison' }, target:'target', action:'applyStatus', params:{ status:'intReduce', intPct:-0.10, duration:1 } },
    { id:'poison_burst', trigger:'onStatusApply', condition:{ statusType:'poison', statusStackGTE:{ status:'poison', count:5 } }, target:'target', action:'dealDamagePct', params:{ pct:0.15, base:'currentHp', asTrue:true } }
  ],
  '钢铁犀牛': [
    { id:'iron_charge', trigger:'onTurnStart', condition:{ notControlled:true, isFirstAttack:true, resetPerTurn:true }, target:'target', action:'displace', params:{ distance:1 } },
    { id:'iron_charge_def_reduce', trigger:'onTurnStart', condition:{ notControlled:true, isFirstAttack:true, resetPerTurn:true }, target:'target', action:'applyStatus', params:{ status:'defReduce', defPct:-0.20, duration:1 } }
  ],
  '幻影蝶': [
    { id:'phantom_summon', trigger:'onBattleStart', target:'self', action:'summon', params:{ summonType:'phantom', inheritPct:0.30, syncAttack:true, count:1, onDeathTrigger:{ action:'applyStatus', params:{ status:'dodgeBonus', dodgeRate:0.30, duration:2 }, target:'self' } } }
  ],
  '熔岩龟': [
    { id:'lava_reflect', trigger:'onHit', target:'attacker', action:'reflect', params:{ reflectPct:0.15, dmgType:'fire', dynamicBonus:{ formula:'0.05*floor((1-hpPct)/0.10)', max:0.25 } } }
  ],
  '飓风雕': [
    { id:'hurricane', trigger:'onNormalAttackHit', chance:0.20, target:'target', action:'extraAttack', params:{ dmgPct:1.50, powerAttr:'atk' } },
    { id:'wind_spin', trigger:'onNormalAttackHit', chance:0.20, target:'target', action:'applyStatus', params:{ status:'windSpin', duration:1, noNormalAttack:true } }
  ],
  '水晶龙': [
    { id:'crystal_refract', trigger:'onSkillCast', chance:0.25, target:'target', action:'splitAttack', params:{ hits:2, dmgPctPerHit:0.60, independentCrit:true } }
  ],
  '暗夜蝙蝠': [
    { id:'anti_stealth_dmg', trigger:'onAttackHit', condition:{ targetHasStatus:'invisible' }, target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.30, mode:'add', applyTo:'currentAttack' } },
    { id:'hit_stack', trigger:'onAttackHit', target:'self', action:'applyStatus', params:{ status:'hitStack', hitRatePerStack:0.03, critRatePerStack:0.03, maxStack:5, permanent:true } }
  ],
  '森林守护者': [
    { id:'life_resonance', trigger:'onTurnEnd', target:'allyAll', action:'healPct', params:{ pct:0.02, base:'maxHp' } },
    { id:'life_resonance_boost', trigger:'onTurnEnd', condition:{ targetHpBelow:0.30 }, target:'allyAll', action:'healPct', params:{ pct:0.04, base:'maxHp' } },
    { id:'life_resonance_purify', trigger:'onTurnEnd', condition:{ targetHpBelow:0.30 }, target:'allyAll', action:'purify', params:{ count:1, debuffType:'all' } }
  ],
  '雷电麒麟': [
    { id:'lightning_chain', trigger:'onAttackHit', condition:{ dmgType:'lightning' }, target:'enemyRandom2', action:'chainBounce', params:{ targets:2, dmgPct:0.50, dmgType:'lightning' } },
    { id:'chain_atk_stack', trigger:'onAttackHit', condition:{ dmgType:'lightning' }, target:'self', action:'applyStatus', params:{ status:'atkBonus', atkPctPerStack:0.05, maxStack:3, duration:1 } }
  ],
  '冰霜女巫': [
    { id:'freeze_duration_boost', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'freezeDurationBonus', value:1, mode:'add' } },
    { id:'freeze_damage_boost', trigger:'onMagicAttackHit', condition:{ targetHasStatus:'freeze' }, target:'self', action:'modifyStat', params:{ stat:'magicDmgPct', value:0.50, mode:'add', applyTo:'currentAttack' } },
    { id:'freeze_shatter', trigger:'onMagicAttackHit', condition:{ targetHasStatus:'freeze' }, chance:0.30, target:'target', action:'dealDamagePct', params:{ pct:0.10, base:'maxHp', dmgType:'ice' } }
  ],
  '火焰魔像': [
    { id:'fire_absorb', trigger:'onMagicHit', condition:{ dmgType:'fire' }, target:'self', action:'convertDamage', params:{ toType:'status', statusName:'fireEnergy', stack:1, maxStack:10, atkPctPerStack:0.05 } },
    { id:'fire_energy_explode', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'fireEnergy', count:10 } }, target:'enemyAll', action:'dealDamage', params:{ dmgPct:1.50, dmgType:'fire', powerAttr:'atk', aoe:true } },
    { id:'fire_energy_consume', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'fireEnergy', count:10 } }, target:'self', action:'removeStatus', params:{ status:'fireEnergy', removeAll:true } }
  ],
  '深海巨兽': [
    { id:'pressure_damage', trigger:'onAttackHit', condition:{ targetHpHigherThanSelf:true }, target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.20, mode:'add', applyTo:'currentAttack' } },
    { id:'pressure_diff_bonus', trigger:'onAttackHit', condition:{ targetHpHigherThanSelf:true }, target:'self', action:'dynamicBonus', params:{ stat:'dmgPct', formula:'0.05*floor((targetHpPct-selfHpPct)/0.10)', max:0.30, applyTo:'currentAttack' } }
  ],
  '天空之翼': [
    { id:'high_altitude', trigger:'onBattleStart', target:'self', action:'applyStatus', params:{ status:'fly', duration:3, dodgeRate:0.40, dmgPct:0.25 } },
    { id:'dive_land', trigger:'onTurnStart', condition:{ turnGTE:4 }, target:'self', action:'modifyStat', params:{ stat:'atkPct', value:0.15, mode:'add', permanent:true } },
    { id:'dive_land_remove_fly', trigger:'onTurnStart', condition:{ turnGTE:4 }, target:'self', action:'removeStatus', params:{ status:'fly' } }
  ],
  '大地之灵': [
    { id:'earth_regen', trigger:'onTurnEnd', target:'self', action:'healPct', params:{ pct:0.05, base:'maxHp' } },
    { id:'earth_regen_boost', trigger:'onTurnEnd', condition:{ wasControlledThisTurn:true }, target:'self', action:'healPct', params:{ pct:0.10, base:'maxHp' } },
    { id:'earth_purify', trigger:'onTurnEnd', condition:{ wasControlledThisTurn:true }, target:'self', action:'purify', params:{ count:1, debuffType:'control' } }
  ],
  // ===== 宠物专属血统技能 — 第2批 =====
  '时空行者': [
    { id:'time_acceleration', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'self', action:'modifyStat', params:{ stat:'spdPct', value:0.50, mode:'add', duration:1 } },
    { id:'time_dodge', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'self', action:'applyStatus', params:{ status:'dodgeBonus', dodgeRate:0.30, duration:1 } },
    { id:'time_heal', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'self', action:'healPct', params:{ pct:0.10, base:'maxHp' } }
  ],
  '混沌之眼': [
    { id:'gaze', trigger:'onTurnStart', target:'enemyRandom1', action:'applyStatus', params:{ status:'gaze', duration:1, dmgTaken:0.30 } },
    { id:'gaze_kill_heal', trigger:'onKill', condition:{ targetHasStatus:'gaze' }, target:'self', action:'healPct', params:{ pct:0.10, base:'maxHp' } },
    { id:'gaze_kill_mp', trigger:'onKill', condition:{ targetHasStatus:'gaze' }, target:'self', action:'restoreMp', params:{ mpPct:1.00 } }
  ],
  '圣光天使': [
    { id:'heal_purify', trigger:'onHealCast', target:'target', action:'purify', params:{ count:2, debuffType:'all' } },
    { id:'buff_duration_boost', trigger:'onBuffCast', target:'target', action:'modifyStat', params:{ stat:'buffDurationBonus', value:1, mode:'add' } }
  ],
  '暗黑恶魔': [
    { id:'devour', trigger:'onKill', target:'self', action:'applyStatus', params:{ status:'devour', atkPctPerStack:0.05, hpPctPerStack:0.05, maxStack:5, stack:1 } },
    { id:'devour_lifesteal', trigger:'passive', condition:{ statusStackGTE:{ status:'devour', count:5 } }, target:'self', action:'modifyStat', params:{ stat:'lifestealPct', value:0.20, mode:'add' } }
  ],
  '翡翠巨龙': [
    { id:'dragon_might', trigger:'onBattleStart', target:'enemyAll', action:'applyStatus', params:{ status:'atkReduce', atkPct:-0.10, duration:2 } },
    { id:'level_dmg_bonus', trigger:'onAttackHit', target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.15, mode:'add', applyTo:'currentAttack' } }
  ],
  '紫电貂': [
    { id:'instant_dodge', trigger:'onHit', maxTrigger:1, target:'self', action:'forceDodge', params:{} },
    { id:'dodge_counter', trigger:'onDodge', maxTrigger:1, target:'attacker', action:'counter', params:{ counterPct:0.80, dmgType:'lightning' } }
  ],
  '金刚猿': [
    { id:'earthquake_strike', trigger:'onAttackHit', chance:0.15, target:'target', action:'extraAttack', params:{ dmgPct:2.00, powerAttr:'atk' } },
    { id:'earthquake_stun', trigger:'onAttackHit', chance:0.15, target:'target', action:'applyStatus', params:{ status:'stun', duration:1 } },
    { id:'low_hp_chance_boost', trigger:'onAttackHit', target:'self', action:'dynamicBonus', params:{ stat:'earthquakeStrikeChance', formula:'0.15+0.20*(1-hpPct)', max:0.35 } }
  ],
  '九尾灵狐': [
    { id:'tail_unlock', trigger:'onSkillCast', target:'self', action:'applyStatus', params:{ status:'tailUnlock', stack:1, maxStack:9 } },
    { id:'fox_fire', trigger:'onMagicAttackHit', condition:{ hasStatus:'tailUnlock' }, target:'target', action:'extraAttack', params:{ dmgPct:0.20, dmgType:'fire', powerAttr:'int' } }
  ],
  '三头地狱犬': [
    { id:'triple_bite', trigger:'onNormalAttackHit', target:'target', action:'splitAttack', params:{ hits:3, dmgPctPerHit:0.45, independentCrit:true, hitEffects:[
      { action:'applyStatus', params:{ status:'burn', duration:2, dotPct:0.05 } },
      { action:'modifyStat', params:{ stat:'lifestealPct', value:0.30, mode:'set', applyTo:'currentHit' } },
      { action:'applyStatus', params:{ status:'defReduce', defPct:-0.20, duration:2 } }
    ] } }
  ],
  '独角天马': [
    { id:'move_buff_double', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'moveBuffMultiplier', value:2.0, mode:'set' } },
    { id:'action_purify', trigger:'onTurnStart', target:'self', action:'purify', params:{ count:1, debuffType:'all' } },
    { id:'holy_stun', trigger:'onAttackHit', chance:0.30, target:'target', action:'applyStatus', params:{ status:'stun', duration:1, ignoreImmunity:true } }
  ],
  '美杜莎': [
    { id:'petrify_gaze', trigger:'onAttackHit', chance:0.20, condition:{ isFirstAttack:true }, target:'target', action:'applyStatus', params:{ status:'petrify', duration:2 } },
    { id:'petrify_damage', trigger:'onAttackHit', condition:{ targetHasStatus:'petrify' }, target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.40, mode:'add', applyTo:'currentAttack' } },
    { id:'petrify_crit', trigger:'onAttackHit', condition:{ targetHasStatus:'petrify' }, target:'self', action:'forceCrit', params:{} }
  ],
  '牛头人酋长': [
    { id:'war_totem', trigger:'onBattleStart', target:'self', action:'summon', params:{ summonType:'totem', duration:0, allyBuff:{ critRate:0.10 } } },
    { id:'totem_stack', trigger:'onCritReceived', chance:0.50, target:'self', action:'counterIncrement', params:{ counterKey:'totemStack', maxCount:99, onMaxTrigger:{ action:'modifyStat', params:{ stat:'critRate', value:0.02, mode:'add' } } } }
  ],
  '鹰身女妖': [
    { id:'shriek_hit_reduce', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'hitRateReduce', hitRate:-0.10, duration:2, stack:1, maxStack:3 } },
    { id:'shriek_confuse', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'hitRateReduce', count:3 } }, chance:0.30, target:'target', action:'applyStatus', params:{ status:'confuse', duration:1 } }
  ],
  '石像鬼': [
    { id:'stone_dormant', trigger:'onHit', condition:{ selfHpBelow:0.20 }, maxTrigger:1, target:'self', action:'applyStatus', params:{ status:'dormant', duration:2, dmgReduce:0.80, regenPct:0.20 } },
    { id:'dormant_berserk', trigger:'onHit', condition:{ selfHpBelow:0.20 }, maxTrigger:1, target:'self', action:'applyStatus', params:{ status:'berserk', atkPct:0.30, dmgTaken:0.15, duration:3 } }
  ],
  '吸血鬼伯爵': [
    { id:'blood_pact_lifesteal', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'lifestealPct', value:0.30, mode:'set' } },
    { id:'blood_shield', trigger:'onHealCast', condition:{ overheal:true }, target:'self', action:'addShield', params:{ shieldType:'bloodShield', absorbPct:0.30, base:'maxHp', duration:2, immuneControl:true } }
  ],
  '狼人战士': [
    { id:'werewolf_berserk', trigger:'onHit', condition:{ selfHpBelow:0.50 }, target:'self', action:'applyStatus', params:{ status:'berserk', atkPct:0.30, dmgTaken:0.15 } },
    { id:'berserk_kill_heal', trigger:'onKill', condition:{ hasStatus:'berserk' }, target:'self', action:'healPct', params:{ pct:0.20, base:'maxHp' } }
  ],
  '精灵射手': [
    { id:'armor_pierce', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'ignoreDef', value:0.20, mode:'add' } },
    { id:'snipe_crit', trigger:'onAttackHit', condition:{ targetHpAbove:0.80 }, target:'self', action:'forceCrit', params:{} },
    { id:'snipe_pierce', trigger:'onAttackHit', condition:{ targetHpAbove:0.80 }, target:'self', action:'modifyStat', params:{ stat:'ignoreDef', value:0.50, mode:'add', applyTo:'currentAttack' } },
    { id:'snipe_stack', trigger:'onKill', target:'self', action:'applyStatus', params:{ status:'snipeStack', dmgPctPerStack:0.10, maxStack:99, stack:1 } }
  ],
  '矮人铁匠': [
    { id:'equip_def_boost', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'defPct', value:0.50, mode:'add' } },
    { id:'team_def_stack', trigger:'onTurnStart', target:'allyAll', action:'applyStatus', params:{ status:'defBonus', defPct:0.02, maxStack:5, stack:1 } }
  ],
  '哥布林盗贼': [
    { id:'steal_buff', trigger:'onAttackHit', chance:0.15, target:'target', action:'stealBuff', params:{ count:1 } },
    { id:'steal_speed', trigger:'onAttackHit', chance:0.15, target:'self', action:'applyStatus', params:{ status:'spdBonus', spdPct:0.05, duration:2 } }
  ],
  '史莱姆王': [
    { id:'split', trigger:'onDeath', condition:{ isFirstDeath:true }, target:'self', action:'summon', params:{ summonType:'miniSlime', inheritPct:0.40, count:2 } },
    { id:'reform', trigger:'onTurnStart', chance:0.20, target:'self', action:'revive', params:{ hpPct:0.30 } }
  ],
  '冰霜巨龙': [
    { id:'frost_breath', trigger:'onAttackHit', chance:0.30, target:'target', action:'applyStatus', params:{ status:'freeze', duration:2 } },
    { id:'ice_crack', trigger:'onAttackHit', condition:{ targetHasStatus:'freeze' }, chance:0.50, target:'target', action:'dealDamagePct', params:{ pct:0.20, base:'lostHp', dmgType:'ice' } }
  ],
  '火焰领主': [
    { id:'fire_domain', trigger:'onBattleStart', target:'self', action:'fieldEffect', params:{ fieldType:'field_fire', duration:0, effects:{ dotToEnemy:{ pct:0.05, base:'maxHp', dmgType:'fire' }, selfStatBonus:{ atkPct:0.20 } } } }
  ],
  '风暴之神': [
    { id:'storm_slow', trigger:'onTurnStart', target:'enemyRandom2', action:'applyStatus', params:{ status:'spdReduce', spdPct:-0.20, duration:1 } },
    { id:'storm_combo', trigger:'onAttackHit', chance:0.25, target:'target', action:'extraAttack', params:{ dmgPct:0.50, powerAttr:'atk' } }
  ],
  '大地泰坦': [
    { id:'titan_hp', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'hpPct', value:0.20, mode:'add' } },
    { id:'titan_def_reset', trigger:'onTurnStart', target:'self', action:'modifyStat', params:{ stat:'defPct', value:0.05, mode:'add', duration:1 } }
  ],
  '海洋霸主': [
    { id:'tide_high', trigger:'onTurnStart', condition:{ everyNTurns:2 }, target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.20, mode:'add', duration:1 } },
    { id:'tide_low', trigger:'onTurnStart', condition:{ everyNTurns:2 }, target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.20, mode:'add', duration:1 } },
    { id:'tide_heal', trigger:'onTurnStart', target:'self', action:'healPct', params:{ pct:0.08, base:'maxHp' } }
  ],
  '天空霸主': [
    { id:'permanent_fly', trigger:'onBattleStart', target:'self', action:'applyStatus', params:{ status:'fly', duration:999, dodgeRate:0.10 } },
    { id:'air_superiority', trigger:'onAttackHit', target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.25, mode:'add', applyTo:'currentAttack' } },
    { id:'ground_kill_speed', trigger:'onKill', target:'self', action:'modifyStat', params:{ stat:'spdPct', value:0.05, mode:'add' } }
  ],
  '混沌魔龙': [
    { id:'chaos_effect', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'chaosEffect', duration:2 } },
    { id:'chaos_damage', trigger:'onAttackHit', target:'self', action:'dynamicBonus', params:{ stat:'dmgPct', formula:'0.10*targetChaosEffectCount', max:0.50, applyTo:'currentAttack' } }
  ],
  '创世神龙': [
    { id:'genesis_mark', trigger:'onBattleStart', target:'allyAll', action:'applyStatus', params:{ status:'auspiciousAura', duration:999, reviveOnDeath:true, reviveHpPct:0.30 } }
  ],
  // ===== 初级野生宠物（55个）— 第1批 =====
  '小史莱姆': [
    { id:'bounce_off', trigger:'onPhysicalHit', chance:0.10, target:'self', action:'forceDodge', params:{} },
    { id:'bounce_stiff', trigger:'onPhysicalHit', chance:0.10, target:'attacker', action:'delayTurnOrder', params:{ positions:1 } }
  ],
  '绿毛虫': [
    { id:'armor_eat', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'defReduce', defPct:-0.02, maxStack:10, stack:1, duration:3 } },
    { id:'molt', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'defReduce', count:10 } }, target:'self', action:'healPct', params:{ pct:0.10, base:'maxHp' } },
    { id:'molt_purify', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'defReduce', count:10 } }, target:'self', action:'purify', params:{ count:99, debuffType:'all' } }
  ],
  '野鼠': [
    { id:'burrow_dodge', trigger:'onHit', condition:{ selfHpBelow:0.30 }, chance:0.30, target:'self', action:'forceDodge', params:{} },
    { id:'burrow_ambush', trigger:'onDodge', condition:{ selfHpBelow:0.30 }, target:'target', action:'extraAttack', params:{ dmgPct:1.00, powerAttr:'atk' } }
  ],
  '小精灵': [
    { id:'extra_heal', trigger:'onHealCast', chance:0.20, target:'allyRandom1', action:'heal', params:{ healPct:0.50, base:'lastHealAmount' } }
  ],
  '雏鹰': [
    { id:'glide_save', trigger:'onFatalDamage', maxTrigger:1, target:'self', action:'setHp', params:{ value:'1' } },
    { id:'glide_dodge', trigger:'onFatalDamage', maxTrigger:1, target:'self', action:'modifyStat', params:{ stat:'dodgeRate', value:0.10, mode:'add' } }
  ],
  '小恶魔': [
    { id:'mischief', trigger:'onAttackHit', chance:0.10, target:'target', action:'applyStatus', params:{ status:'mischief', duration:1, missChance:0.50 } }
  ],
  '幼龙': [
    { id:'fire_boost', trigger:'onAttackHit', condition:{ selfHpBelow:0.50 }, target:'self', action:'modifyNextAttack', params:{ stat:'dmgPct', value:0.30, mode:'add', consume:true } },
    { id:'fire_stack', trigger:'onAttackHit', condition:{ selfHpBelow:0.50 }, target:'self', action:'applyStatus', params:{ status:'fireDmgBonus', dmgPctPerStack:0.02, maxStack:5, stack:1 } }
  ],
  '蘑菇人': [
    { id:'spore_shield', trigger:'onTurnStart', target:'self', action:'addShield', params:{ shieldType:'sporeShield', absorbPct:0.03, base:'maxHp', duration:2 } }
  ],
  '麻雀': [
    { id:'flock_peck', trigger:'onNormalAttackHit', chance:0.15, target:'target', action:'extraAttack', params:{ dmgPct:0.30, powerAttr:'atk' } }
  ],
  '青蛙': [
    { id:'frog_jump', trigger:'onAttackHit', condition:{ everyNTurns:2 }, target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.20, mode:'add', applyTo:'currentAttack' } }
  ],
  '蝙蝠崽': [
    { id:'anti_invisible', trigger:'onAttackHit', condition:{ targetHasStatus:'invisible' }, target:'self', action:'forceCrit', params:{} },
    { id:'sonic_mark', trigger:'onAttackHit', condition:{ isFirstAttack:true }, target:'target', action:'applyStatus', params:{ status:'dodgeReduce', dodgeRate:-0.10, duration:2 } }
  ],
  '小地精': [
    { id:'small_dodge', trigger:'onHit', condition:{ isAoeHit:true }, chance:0.20, target:'self', action:'modifyStat', params:{ stat:'dmgTaken', value:0.50, mode:'multiply', applyTo:'currentHit' } }
  ],
  '萤火虫': [
    { id:'firefly_light', trigger:'onSkillCast', target:'allyHighestAtk', action:'applyStatus', params:{ status:'fireflyLight', hitRate:0.15, duration:1 } }
  ],
  '刺猬': [
    { id:'spike_reflect', trigger:'onHit', target:'attacker', action:'reflect', params:{ reflectPct:0.10, asTrue:true } }
  ],
  '蜗牛': [
    { id:'late_bloom', trigger:'onTurnStart', target:'self', action:'dynamicBonus', params:{ stat:'dmgPct', formula:'0.03*turnOrderDelay', max:0.30 } }
  ],
  '小树精': [
    { id:'root', trigger:'onTurnStart', target:'self', action:'applyStatus', params:{ status:'rooted', regenPct:0.03, dmgReduce:0.10 } }
  ],
  '蝌蚪': [
    { id:'water_adapt', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'allPct', value:0.10, mode:'add' } }
  ],
  '小龙崽': [
    { id:'dragon_growth', trigger:'onTurnStart', target:'self', action:'applyStatus', params:{ status:'atkBonus', atkPctPerStack:0.01, maxStack:10, stack:1 } }
  ],
  '小骷髅': [
    { id:'bone_tough', trigger:'passive', condition:{ selfHpBelow:0.10 }, target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.20, mode:'add' } },
    { id:'bone_revive', trigger:'onDeath', chance:0.05, target:'self', action:'revive', params:{ hpPct:0.10 } }
  ],
  '灰尘怪': [
    { id:'dust_stealth', trigger:'onTurnStart', chance:0.10, target:'self', action:'applyStatus', params:{ status:'stealth', duration:1 } }
  ],
  '花仙子': [
    { id:'female_heal_boost', trigger:'onHealCast', condition:{ targetFemale:true }, target:'self', action:'modifyStat', params:{ stat:'healPct', value:0.15, mode:'add', applyTo:'currentHeal' } },
    { id:'flower_dew', trigger:'onHealCast', target:'target', action:'applyStatus', params:{ status:'flowerDew', hotPct:0.03, duration:1 } }
  ],
  '小石怪': [
    { id:'rock_reduce', trigger:'onPhysicalHit', condition:{ isFirstHit:true }, target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.30, mode:'add', applyTo:'currentHit', consume:true } },
    { id:'rock_store', trigger:'onPhysicalHit', condition:{ isFirstHit:true }, target:'self', action:'storeDamage', params:{ storeKey:'rockDebris', storePct:0.30 } },
    { id:'rock_release', trigger:'onAttackHit', target:'target', action:'releaseStoredDamage', params:{ storeKey:'rockDebris', asDmgType:'physical' } }
  ],
  '风精灵': [
    { id:'wind_speed', trigger:'onDodge', target:'self', action:'applyStatus', params:{ status:'spdBonus', spdPct:0.05, maxStack:3, duration:2, stack:1 } }
  ],
  '小幽灵': [
    { id:'ghost_pierce', trigger:'onMagicAttackHit', chance:0.10, target:'target', action:'ignoreShield', params:{ dmgBonusPct:0.15 } }
  ],
  '青苔蛇': [
    { id:'slip_free', trigger:'onHit', chance:0.30, target:'self', action:'removeStatus', params:{ status:'root' } },
    { id:'slip_speed', trigger:'onHit', chance:0.30, target:'self', action:'applyStatus', params:{ status:'spdBonus', spdPct:0.10, duration:1 } }
  ],
  '野猪': [
    { id:'boar_charge', trigger:'onFirstAttack', target:'self', action:'modifyNextAttack', params:{ stat:'dmgPct', value:0.20, mode:'add', consume:true } },
    { id:'boar_displace', trigger:'onFirstAttack', target:'target', action:'displace', params:{ distance:1 } },
    { id:'boar_def_drop', trigger:'onFirstAttack', target:'self', action:'applyStatus', params:{ status:'defReduce', defPct:-0.10, duration:1 } }
  ],
  '泥潭怪': [
    { id:'mud_slow', trigger:'onHit', target:'attacker', action:'applyStatus', params:{ status:'spdReduce', spdPct:-0.10, maxStack:2, duration:1, stack:1 } }
  ],
  '铜甲蟹': [
    { id:'perfect_block', trigger:'onHit', chance:0.15, target:'self', action:'forceBlock', params:{} }
  ],
  // ===== 初级野生宠物 — 第2批 =====
  '霜精灵': [
    { id:'frost_flower', trigger:'onMagicAttackHit', target:'target', action:'applyStatus', params:{ status:'frostFlower', stack:1, maxStack:3 } },
    { id:'frost_bloom', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'frostFlower', count:3 } }, target:'target', action:'applyStatus', params:{ status:'spdReduce', spdPct:-0.15, duration:2 } }
  ],
  '幼狼': [
    { id:'bloodlust', trigger:'onAttackHit', condition:{ targetHpBelow:0.30 }, target:'self', action:'modifyStat', params:{ stat:'atkPct', value:0.15, mode:'add', duration:1 } },
    { id:'kill_heal', trigger:'onKill', target:'self', action:'healPct', params:{ pct:0.05, base:'maxHp' } }
  ],
  '火蜥蜴': [
    { id:'fire_absorb', trigger:'onHit', target:'self', action:'convertDamage', params:{ toType:'heal', maxHealPct:0.10 } }
  ],
  '黑鸦': [
    { id:'omen', trigger:'onAttackHit', chance:0.10, target:'target', action:'applyStatus', params:{ status:'omen', duration:1, noCrit:true } }
  ],
  '小恶魔犬': [
    { id:'hell_bark', trigger:'onBattleStart', target:'enemyAll', action:'applyStatus', params:{ status:'hitRateReduce', hitRate:-0.05, duration:1 } }
  ],
  '苔藓巨人': [
    { id:'moss_regen', trigger:'onTurnEnd', condition:{ selfHpBelow:0.50 }, target:'self', action:'healPct', params:{ pct:0.02, base:'maxHp' } }
  ],
  '夜光蛾': [
    { id:'dazzle', trigger:'onMagicAttackHit', chance:0.15, target:'target', action:'applyStatus', params:{ status:'confuse', duration:1 } }
  ],
  '铁甲蚁': [
    { id:'colony_def', trigger:'passive', target:'self', action:'dynamicBonus', params:{ stat:'defPct', formula:'0.05*allyAntCount', max:0.25 } }
  ],
  '影狐': [
    { id:'shadow_ambush', trigger:'onFirstAttack', target:'self', action:'modifyNextAttack', params:{ stat:'dmgPct', value:0.20, mode:'add', consume:true } },
    { id:'shadow_no_counter', trigger:'onFirstAttack', target:'target', action:'applyStatus', params:{ status:'noCounter', duration:1 } }
  ],
  '岩蜥蜴': [
    { id:'rock_stealth', trigger:'onTurnStart', chance:0.15, target:'self', action:'applyStatus', params:{ status:'stealth', duration:1 } }
  ],
  '霜狼': [
    { id:'frost_bite', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'spdReduce', spdPct:-0.08, maxStack:3, duration:1, stack:1 } },
    { id:'frost_freeze', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'spdReduce', count:3 } }, chance:0.30, target:'target', action:'applyStatus', params:{ status:'freeze', duration:1 } }
  ],
  '光之子': [
    { id:'holy_protection', trigger:'onFatalDamage', chance:0.10, maxTrigger:1, target:'self', action:'revive', params:{ hpPct:0.15 } }
  ],
  '腐尸虫': [
    { id:'corpse_poison', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'corpsePoison', duration:3, dotPct:0.05 } }
  ],
  '碧眼猫': [
    { id:'night_vision', trigger:'passive', condition:{ isNight:true }, target:'self', action:'modifyStat', params:{ stat:'critRate', value:0.10, mode:'add' } }
  ],
  '沙蝎': [
    { id:'poison_charge', trigger:'onHit', target:'self', action:'applyStatus', params:{ status:'poisonCharge', stack:1, maxStack:5 } },
    { id:'poison_release', trigger:'onAttackHit', condition:{ hasStatus:'poisonCharge' }, target:'target', action:'dealDamage', params:{ dmgPct:0.10, dmgType:'poison', powerAttr:'atk' } },
    { id:'poison_consume', trigger:'onAttackHit', condition:{ hasStatus:'poisonCharge' }, target:'self', action:'removeStatus', params:{ status:'poisonCharge', removeAll:true } }
  ],
  '烈风雕': [
    { id:'wind_speed_stack', trigger:'onTurnEnd', target:'self', action:'applyStatus', params:{ status:'spdBonus', spdPct:0.03, maxStack:5, stack:1 } }
  ],
  '寒冰蝶': [
    { id:'ice_scale', trigger:'onSkillCast', target:'target', action:'applyStatus', params:{ status:'intReduce', intPct:-0.10, duration:2 } }
  ],
  '雷豹': [
    { id:'speed_lightning', trigger:'onAttackHit', target:'self', action:'dynamicBonus', params:{ stat:'dmgPct', formula:'0.05*selfSpdPct', max:0.50, applyTo:'currentAttack' } }
  ],
  '玄冰麒麟': [
    { id:'ice_domain', trigger:'onSkillCast', target:'self', action:'fieldEffect', params:{ fieldType:'field_ice', duration:3, effects:{ enemyChancePerTurn:0.15, enemyStatus:'freeze', enemyStatusDuration:1 } } }
  ],
  '魔神之影': [
    { id:'remnant', trigger:'onDeath', target:'self', action:'summon', params:{ summonType:'remnant', duration:3 } }
  ],
  '圣光龙神': [
    { id:'dragon_edict', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'allyAll', action:'purify', params:{ count:99, debuffType:'all' } },
    { id:'dragon_edict_heal', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'allyAll', action:'healPct', params:{ pct:0.10, base:'maxHp' } }
  ],
  '永恒天使': [
    { id:'eternal_revive', trigger:'onAllyDeath', maxTrigger:2, condition:{ selfHpAbove:0.20 }, target:'allyDead', action:'revive', params:{ hpPct:0.30 } }
  ],
  '虚空主宰': [
    { id:'void_devour', trigger:'onKill', condition:{ killByMagic:true }, target:'self', action:'applyStatus', params:{ status:'atkBonus', atkPctPerStack:0.02, maxStack:99, stack:1 } }
  ],
  '万物之母': [
    { id:'life_seed', trigger:'onTurnStart', condition:{ everyNTurns:5 }, target:'self', action:'counterIncrement', params:{ counterKey:'lifeSeedCount', maxCount:3 } },
    { id:'life_seed_revive', trigger:'onAllyDeath', target:'allyDead', action:'revive', params:{ hpPct:0.50 } }
  ],
  '混元圣兽': [
    { id:'unity_damage', trigger:'onAttackHit', target:'self', action:'dynamicBonus', params:{ stat:'dmgPct', formula:'0.08*statDiffOverPct', max:0.50, applyTo:'currentAttack' } }
  ],
  '灭世魔神': [
    { id:'doom_explode', trigger:'onKill', target:'enemyAll', action:'dealDamage', params:{ dmgPct:0.50, powerAttr:'lastKillDmg', dmgType:'fire', aoe:true } }
  ],
  '时空龙神': [
    { id:'time_rift', trigger:'onTurnStart', chance:0.20, target:'enemyRandom1', action:'applyStatus', params:{ status:'timeRift', duration:1, missChance:0.50 } }
  ],
  // ===== T1 弱阶宠物（20个）=====
  '草蜢': [
    { id:'hop_dodge', trigger:'onHit', chance:0.12, target:'self', action:'forceDodge', params:{} },
    { id:'hop_range_bonus', trigger:'onDodge', target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.10, mode:'add', duration:1 } }
  ],
  '泥巴怪': [
    { id:'mud_stick', trigger:'onHit', target:'attacker', action:'applyStatus', params:{ status:'atkReduce', atkPct:-0.08, duration:1 } }
  ],
  '小蜥蜴': [
    { id:'tail_drop', trigger:'onFatalDamage', maxTrigger:1, target:'self', action:'setHp', params:{ value:'1' } },
    { id:'tail_speed', trigger:'onFatalDamage', maxTrigger:1, target:'self', action:'applyStatus', params:{ status:'spdBonus', spdPct:0.15, duration:2 } }
  ],
  '落叶虫': [
    { id:'leaf_camouflage', trigger:'onTurnStart', condition:{ turnLTE:2 }, chance:0.20, target:'self', action:'applyStatus', params:{ status:'stealth', duration:1 } }
  ],
  '微光蝶': [
    { id:'mp_regen', trigger:'onSkillCast', target:'self', action:'restoreMp', params:{ mpPct:0.05 } },
    { id:'mp_regen_boost', trigger:'onSkillCast', condition:{ selfMpBelow:0.30 }, target:'self', action:'restoreMp', params:{ mpPct:0.10 } }
  ],
  '小田鼠': [
    { id:'burrow_hide', trigger:'onHit', condition:{ selfHpBelow:0.20 }, chance:0.15, target:'self', action:'applyStatus', params:{ status:'invisible', duration:1 } }
  ],
  '嫩芽精': [
    { id:'sprout_revive', trigger:'onHealCast', condition:{ healBelowThreshold:true }, chance:0.20, maxTrigger:2, target:'self', action:'modifyStat', params:{ stat:'healPct', value:2.0, mode:'multiply', applyTo:'currentHeal' } }
  ],
  '水母崽': [
    { id:'tentacle_paralyze', trigger:'onMagicAttackHit', chance:0.08, target:'target', action:'applyStatus', params:{ status:'paralyze', duration:1 } },
    { id:'tentacle_delay', trigger:'onMagicAttackHit', chance:0.08, target:'target', action:'delayTurnOrder', params:{ positions:1 } }
  ],
  '灰羽雀': [
    { id:'wing_interfere', trigger:'onAttackHit', maxTrigger:1, target:'target', action:'applyStatus', params:{ status:'hitRateReduce', hitRate:-0.05, duration:1 } }
  ],
  '小跳蛛': [
    { id:'jump_ambush', trigger:'onAttackHit', condition:{ everyNTurns:3 }, target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.15, mode:'add', applyTo:'currentAttack' } }
  ],
  '苔藓鼠': [
    { id:'moss_camouflage_reduce', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.10, mode:'add' } },
    { id:'moss_camouflage_stealth', trigger:'onTurnStart', chance:0.15, target:'self', action:'applyStatus', params:{ status:'stealth', duration:1 } }
  ],
  '小孢子': [
    { id:'spore_bloom', trigger:'onHealCast', chance:0.10, target:'target', action:'applyStatus', params:{ status:'spore', hotPct:0.03, duration:1 } }
  ],
  '风信子': [
    { id:'wind_teleport', trigger:'onHit', condition:{ everyNTurns:4 }, target:'self', action:'forceDodge', params:{} }
  ],
  '小石子': [
    { id:'rock_splash', trigger:'onHit', target:'attacker', action:'dealDamage', params:{ dmgPct:0.20, powerAttr:'def', asTrue:true } }
  ],
  '露珠精': [
    { id:'dew_purify', trigger:'onHealCast', chance:0.15, target:'target', action:'purify', params:{ count:1, debuffType:'poison' } }
  ],
  '萌新史莱姆': [
    { id:'cute_reduce', trigger:'onHit', condition:{ isFirstHit:true }, target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.20, mode:'add', applyTo:'currentHit', consume:true } }
  ],
  '稻草人': [
    { id:'straw_substitute', trigger:'onFatalDamage', maxTrigger:1, target:'self', action:'setHp', params:{ value:'1' } },
    { id:'straw_purify', trigger:'onFatalDamage', maxTrigger:1, target:'self', action:'purify', params:{ count:99, debuffType:'all' } }
  ],
  '小野鸭': [
    { id:'dive_evade', trigger:'onHit', chance:0.20, target:'self', action:'forceDodge', params:{} }
  ],
  '飘浮气泡': [
    { id:'bubble_buffer', trigger:'passive', target:'self', action:'addShield', params:{ shieldType:'bubble', absorbPct:0.10, base:'maxHp', duration:2 } }
  ],
  '弱小龙': [
    { id:'adversity', trigger:'passive', target:'self', action:'dynamicBonus', params:{ stat:'atkPct', formula:'0.03*floor((1-hpPct)/0.10)', max:0.15 } }
  ],
  // ===== T2 普通宠物（25个）=====
  '林间鹿': [
    { id:'forest_guide', trigger:'passive', target:'allyAll', action:'modifyStat', params:{ stat:'dodgeRate', value:0.08, mode:'add' } }
  ],
  '花斑豹': [
    { id:'ambush', trigger:'onFirstAttack', target:'self', action:'modifyNextAttack', params:{ stat:'dmgPct', value:0.25, mode:'add', consume:true } },
    { id:'ambush_crit', trigger:'onFirstAttack', target:'self', action:'forceCrit', params:{} }
  ],
  '赤尾狐': [
    { id:'tail_dazzle', trigger:'onAttackHit', chance:0.10, target:'target', action:'applyStatus', params:{ status:'confuse', duration:1 } }
  ],
  '青铜蟹': [
    { id:'bronze_shell', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.18, mode:'add' } }
  ],
  '丛林狼': [
    { id:'pack_atk', trigger:'passive', target:'self', action:'dynamicBonus', params:{ stat:'atkPct', formula:'0.04*allyWolfCount', max:0.16 } },
    { id:'pack_berserk', trigger:'onAllyDeath', target:'self', action:'applyStatus', params:{ status:'berserk', atkPct:0.20, duration:1 } }
  ],
  '月牙兔': [
    { id:'night_heal', trigger:'passive', condition:{ isNight:true }, target:'self', action:'modifyStat', params:{ stat:'healBoost', value:0.20, mode:'add' } }
  ],
  '锈甲虫': [
    { id:'rust', trigger:'onHit', target:'attacker', action:'applyStatus', params:{ status:'rust', atkPct:-0.03, maxStack:3, duration:3, stack:1 } }
  ],
  '雪雏': [
    { id:'cold_immune', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.15, mode:'add' } }
  ],
  '岩鸽': [
    { id:'rock_flight', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'spdPct', value:0.15, mode:'add' } },
    { id:'rock_cover', trigger:'onHit', chance:0.15, target:'self', action:'forceDodge', params:{} }
  ],
  '暮色鸦': [
    { id:'dusk_stealth', trigger:'onBattleStart', target:'self', action:'applyStatus', params:{ status:'stealth', duration:1 } }
  ],
  '苔甲蜥': [
    { id:'moss_regen', trigger:'onTurnEnd', target:'self', action:'healPct', params:{ pct:0.015, base:'maxHp' } }
  ],
  '幼麒麟': [
    { id:'auspicious_aura', trigger:'onBattleStart', target:'allyAll', action:'applyStatus', params:{ status:'critResist', antiCrit:0.10, duration:2 } }
  ],
  '翡翠蛙': [
    { id:'poison_absorb', trigger:'onHit', target:'self', action:'convertDamage', params:{ toType:'heal', convertPct:0.30 } }
  ],
  '流火蜥': [
    { id:'fire_tail', trigger:'onNormalAttackHit', chance:0.15, target:'target', action:'extraAttack', params:{ dmgPct:0.30, dmgType:'fire', powerAttr:'atk' } }
  ],
  '寒霜鼠': [
    { id:'ice_speed', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'spdPct', value:0.20, mode:'add' } }
  ],
  '晨曦鹿': [
    { id:'dawn_blessing', trigger:'passive', condition:{ isDay:true }, target:'allyAll', action:'modifyStat', params:{ stat:'healBoost', value:0.12, mode:'add' } }
  ],
  '巨角羊': [
    { id:'horn_toss', trigger:'onHit', chance:0.20, target:'attacker', action:'applyStatus', params:{ status:'stun', duration:1 } }
  ],
  '紫羽鸽': [
    { id:'warning_dodge', trigger:'onTurnStart', target:'allyAll', action:'applyStatus', params:{ status:'dodgeBonus', dodgeRate:0.10, duration:1 } }
  ],
  '暗影貂': [
    { id:'shadow_stealth', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'self', action:'applyStatus', params:{ status:'stealth', duration:1 } },
    { id:'shadow_crit', trigger:'onAttackHit', condition:{ hasStatus:'stealth' }, target:'self', action:'forceCrit', params:{} }
  ],
  '银背猿': [
    { id:'power_strike', trigger:'onAttackHit', target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.30, mode:'add', applyTo:'currentAttack' } },
    { id:'charge_def', trigger:'onTurnStart', target:'self', action:'applyStatus', params:{ status:'defBonus', defPct:0.15, duration:1 } }
  ],
  '烈日甲虫': [
    { id:'sun_harden', trigger:'passive', condition:{ isDay:true }, target:'self', action:'modifyStat', params:{ stat:'defPct', value:0.12, mode:'add' } }
  ],
  '蓝鳉鱼': [
    { id:'water_all', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'allPct', value:0.08, mode:'add' } }
  ],
  '灰岩龟': [
    { id:'shell_retract', trigger:'onHit', condition:{ selfHpBelow:0.25 }, target:'self', action:'applyStatus', params:{ status:'shellRetract', dmgReduce:0.30, duration:1 } }
  ],
  '啼鸣鸟': [
    { id:'cry_warning', trigger:'onBattleStart', target:'allyAll', action:'applyStatus', params:{ status:'dodgeBonus', dodgeRate:0.08, duration:1 } }
  ],
  '朱砂蝶': [
    { id:'cinnabar_daze', trigger:'onMagicAttackHit', chance:0.12, target:'target', action:'applyStatus', params:{ status:'confuse', duration:1 } }
  ],
  // ===== T3 中阶宠物（25个）=====
  '银鳞龙': [
    { id:'spell_reflect', trigger:'onHit', chance:0.15, target:'attacker', action:'reflect', params:{ reflectPct:0.50, dmgType:'magic' } }
  ],
  '烬羽鸟': [
    { id:'ember_burn', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'burn', duration:2, dotPct:0.05 } }
  ],
  '玄铁犀': [
    { id:'crit_reduce', trigger:'onHit', target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.20, mode:'add', applyTo:'currentHit' } },
    { id:'crit_charge', trigger:'onHit', target:'self', action:'applyStatus', params:{ status:'chargeBonus', dmgPct:0.10, duration:2 } }
  ],
  '翠风狼': [
    { id:'wind_trail', trigger:'onTurnStart', target:'allyAll', action:'applyStatus', params:{ status:'spdBonus', spdPct:0.15, duration:2 } }
  ],
  '紫电隼': [
    { id:'dive_lightning', trigger:'onAttackHit', target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:2.0, mode:'multiply', applyTo:'currentAttack' } },
    { id:'dive_slow', trigger:'onAttackHit', target:'self', action:'applyStatus', params:{ status:'spdReduce', spdPct:-0.10, duration:1 } }
  ],
  '落日虎': [
    { id:'dusk_atk', trigger:'passive', condition:{ isDusk:true }, target:'self', action:'modifyStat', params:{ stat:'atkPct', value:0.20, mode:'add' } },
    { id:'roar_fear', trigger:'onAttackHit', condition:{ isDusk:true }, chance:0.25, target:'target', action:'applyStatus', params:{ status:'fear', duration:1 } }
  ],
  '蓝月狐': [
    { id:'moon_confuse', trigger:'onAttackHit', chance:0.20, target:'target', action:'applyStatus', params:{ status:'confuse', duration:1 } }
  ],
  '烈焰犬': [
    { id:'fire_wound', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'fireWound', healReduce:0.50, duration:3 } }
  ],
  '碎石龟': [
    { id:'rock_barrier', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'allyAll', action:'addShield', params:{ shieldType:'rockShield', absorbPct:0.10, base:'maxHp', duration:2 } }
  ],
  '寒林鹿': [
    { id:'frost_heal', trigger:'onHealCast', target:'target', action:'addShield', params:{ shieldType:'iceShield', absorbPct:0.10, base:'healAmount', duration:2 } }
  ],
  '翔云马': [
    { id:'cloud_walk', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.10, mode:'add' } }
  ],
  '雷羽雀': [
    { id:'lightning_conduct', trigger:'onAttackHit', target:'enemyRandom1', action:'chainBounce', params:{ targets:1, dmgPct:0.40, dmgType:'lightning' } }
  ],
  '血藤蛇': [
    { id:'blood_vine', trigger:'onStatusTick', condition:{ statusType:'poison' }, target:'self', action:'heal', params:{ healPct:1.0, base:'lastPoisonDamage' } }
  ],
  '沙暴蝎': [
    { id:'sandstorm', trigger:'onHit', condition:{ selfHpBelow:0.30 }, target:'self', action:'applyStatus', params:{ status:'dodgeBonus', dodgeRate:0.25, duration:3 } },
    { id:'sandstorm_hit', trigger:'onHit', condition:{ selfHpBelow:0.30 }, target:'attacker', action:'applyStatus', params:{ status:'hitRateReduce', hitRate:-0.20, duration:2 } }
  ],
  '星纹豹': [
    { id:'star_blink', trigger:'onHit', condition:{ isNight:true }, maxTrigger:1, target:'self', action:'forceDodge', params:{} }
  ],
  '月华蝶': [
    { id:'moon_amplify', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'intPct', value:0.25, mode:'add' } }
  ],
  '赤焰马': [
    { id:'charge_distance', trigger:'onAttackHit', target:'self', action:'dynamicBonus', params:{ stat:'dmgPct', formula:'0.05*selfSpdPct', max:0.30, applyTo:'currentAttack' } }
  ],
  '青木猿': [
    { id:'boulder_throw', trigger:'onTurnStart', condition:{ everyNTurns:4 }, target:'enemyAll', action:'dealDamage', params:{ dmgPct:0.80, dmgType:'physical', powerAttr:'atk', aoe:true } }
  ],
  '玄冰蛇': [
    { id:'ice_slow', trigger:'onMagicAttackHit', target:'target', action:'applyStatus', params:{ status:'spdReduce', spdPct:-0.10, maxStack:3, duration:2, stack:1 } },
    { id:'ice_freeze', trigger:'onAttackHit', condition:{ statusStackGTE:{ status:'spdReduce', count:3 } }, target:'target', action:'applyStatus', params:{ status:'freeze', duration:1 } }
  ],
  '幻影鸦': [
    { id:'phantom', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'self', action:'summon', params:{ summonType:'phantom', duration:3 } },
    { id:'phantom_dodge', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'dodgeRate', value:0.15, mode:'add' } }
  ],
  '黄昏狮': [
    { id:'dusk_might', trigger:'passive', condition:{ isDusk:true }, target:'self', action:'modifyStat', params:{ stat:'atkPct', value:0.18, mode:'add' } },
    { id:'dusk_crit', trigger:'passive', condition:{ isDusk:true }, target:'self', action:'modifyStat', params:{ stat:'critRate', value:0.18, mode:'add' } }
  ],
  '焦土龟': [
    { id:'scorched_earth', trigger:'onBattleStart', target:'self', action:'fieldEffect', params:{ fieldType:'field_scorched', duration:0, effects:{ dotToEnemy:{ pct:0.03, base:'maxHp', dmgType:'fire' } } } }
  ],
  '银光鹿': [
    { id:'silver_purify', trigger:'onHealCast', target:'target', action:'purify', params:{ count:1, debuffType:'all' } },
    { id:'silver_heal_boost', trigger:'onHealCast', condition:{ purifySuccess:true }, target:'self', action:'modifyStat', params:{ stat:'healPct', value:0.10, mode:'add', applyTo:'currentHeal' } }
  ],
  '霜羽雕': [
    { id:'wing_freeze', trigger:'onAttackHit', chance:0.25, target:'target', action:'applyStatus', params:{ status:'wingFreeze', spdPct:-0.40, duration:2 } }
  ],
  '紫晶蝶': [
    { id:'crystal_refract', trigger:'onMagicAttackHit', chance:0.20, target:'enemyRandom1', action:'dealDamage', params:{ dmgPct:0.50, powerAttr:'lastHitDmg' } }
  ],
  // ===== T4 强阶宠物（20个）=====
  '烈焰龙骑': [
    { id:'fire_trail', trigger:'onAttackHit', target:'enemyAll', action:'applyStatus', params:{ status:'burn', duration:3, dotPct:0.05 } }
  ],
  '寒冰女王': [
    { id:'freeze_crit', trigger:'onAttackHit', condition:{ targetHasStatus:'freeze' }, target:'self', action:'forceCrit', params:{} }
  ],
  '雷霆战狼': [
    { id:'lightning_combo', trigger:'onAttackHit', condition:{ targetHpBelow:0.30 }, target:'target', action:'extraAttack', params:{ dmgPct:0.50, dmgType:'lightning', powerAttr:'atk' } }
  ],
  '圣光审判': [
    { id:'holy_damage', trigger:'onAttackHit', target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:0.30, mode:'add', applyTo:'currentAttack' } },
    { id:'holy_seal', trigger:'onKill', target:'allyAll', action:'addShield', params:{ shieldType:'sacredSeal', absorbPct:0.15, base:'maxHp', duration:2 } }
  ],
  '暗影刺客': [
    { id:'execute', trigger:'onAttackHit', condition:{ targetHpBelow:0.20 }, target:'target', action:'dealDamage', params:{ dmgPct:99.0, powerAttr:'atk', asTrue:true } },
    { id:'execute_reset', trigger:'onKill', condition:{ killByExecute:true }, target:'self', action:'resetCooldown', params:{ scope:'all' } }
  ],
  '翡翠守护': [
    { id:'jade_barrier', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'allyAll', action:'applyStatus', params:{ status:'dmgReduce', dmgReduce:0.20, duration:1 } }
  ],
  '风暴巨雕': [
    { id:'vortex_slow', trigger:'onTurnStart', target:'enemyAdjacent', action:'applyStatus', params:{ status:'spdReduce', spdPct:-0.15, duration:1 } },
    { id:'vortex_stun', trigger:'onTurnStart', chance:0.15, target:'enemyAdjacent', action:'applyStatus', params:{ status:'stun', duration:1 } }
  ],
  '玄铁巨兽': [
    { id:'iron_body', trigger:'onTurnStart', maxTrigger:1, target:'self', action:'applyStatus', params:{ status:'ironBody', duration:3, dmgReduce:0.40 } }
  ],
  '烈日战神': [
    { id:'sun_immune', trigger:'passive', condition:{ isDay:true }, target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.15, mode:'add' } },
    { id:'sun_atk', trigger:'passive', condition:{ isDay:true }, target:'self', action:'modifyStat', params:{ stat:'atkPct', value:0.25, mode:'add' } }
  ],
  '幽冥蛇君': [
    { id:'poison_magic_boost', trigger:'onMagicAttackHit', condition:{ targetHasStatus:'poison' }, target:'self', action:'dynamicBonus', params:{ stat:'magicDmgPct', formula:'0.03*targetPoisonStack', max:1.0, applyTo:'currentAttack' } }
  ],
  '紫电战虎': [
    { id:'thunder_paralyze', trigger:'onAttackHit', chance:0.25, target:'target', action:'applyStatus', params:{ status:'paralyze', duration:2 } },
    { id:'paralyze_lightning_double', trigger:'onAttackHit', condition:{ targetHasStatus:'paralyze' }, target:'self', action:'modifyStat', params:{ stat:'dmgPct', value:2.0, mode:'multiply', applyTo:'currentAttack' } }
  ],
  '苍穹龙': [
    { id:'dragon_aura_ally', trigger:'onBattleStart', target:'allyAll', action:'applyStatus', params:{ status:'atkBonus', atkPct:0.10, duration:999 } },
    { id:'dragon_aura_enemy', trigger:'onBattleStart', target:'enemyAll', action:'applyStatus', params:{ status:'atkReduce', atkPct:-0.05, duration:999 } }
  ],
  '焚天魔': [
    { id:'demon_flame', trigger:'onAttackHit', target:'target', action:'applyStatus', params:{ status:'soulBurn', duration:2, noHeal:true, undispellable:true } }
  ],
  '冰封王': [
    { id:'ice_domain_dmg', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'magicDmgPct', value:0.20, mode:'add' } }
  ],
  '圣辉麒麟': [
    { id:'auspicious_shield', trigger:'onTurnStart', target:'allyLowestHp', action:'addShield', params:{ shieldType:'auspiciousShield', absorbPct:0.10, base:'maxHp', duration:2, hotPct:0.03 } }
  ],
  '暗夜君王': [
    { id:'night_cc_immune', trigger:'passive', condition:{ isNight:true }, target:'self', action:'modifyStat', params:{ stat:'dmgReduce', value:0.15, mode:'add' } }
  ],
  '千年古树': [
    { id:'root_share', trigger:'passive', target:'allyAll', action:'damageShare', params:{ sharePct:0.10 } },
    { id:'root_regen', trigger:'onTurnEnd', target:'allyAll', action:'healPct', params:{ pct:0.03, base:'maxHp' } }
  ],
  '雷陨巨猿': [
    { id:'meteor_strike', trigger:'onTurnStart', condition:{ everyNTurns:3 }, target:'enemyAll', action:'dealDamage', params:{ dmgPct:3.0, dmgType:'lightning', powerAttr:'atk', aoe:true } }
  ],
  '烈风隼王': [
    { id:'hunt_domain', trigger:'onBattleStart', target:'self', action:'fieldEffect', params:{ fieldType:'field_hunt', duration:0, effects:{ selfStatBonus:{ spdPct:0.30 } } } }
  ],
  '玄冥蛟': [
    { id:'water_armor', trigger:'passive', target:'self', action:'addShield', params:{ shieldType:'waterArmor', absorbPct:0.30, base:'maxHp', duration:999 } }
  ],
  // ===== T5 顶阶宠物（10个）=====
  '远古龙神': [
    { id:'ancient_edict_buff', trigger:'onTurnStart', condition:{ everyNTurns:5 }, target:'allyAll', action:'applyStatus', params:{ status:'atkBonus', atkPct:0.20, duration:3 } },
    { id:'ancient_edict_stun', trigger:'onTurnStart', condition:{ everyNTurns:5 }, target:'enemyAll', action:'applyStatus', params:{ status:'stun', duration:1 } }
  ],
  '创世天使': [
    { id:'genesis_light', trigger:'onAllyDeath', condition:{ aliveAllyLTE:1 }, maxTrigger:1, target:'allyAll', action:'revive', params:{ hpPct:0.40 } }
  ],
  '虚空魔神': [
    { id:'void_rift', trigger:'onTurnStart', chance:0.20, target:'enemyRandom1', action:'applyStatus', params:{ status:'spellBackfire', duration:1, skillDmgToSelf:0.50 } }
  ],
  '太初神兽': [
    { id:'origin_multiplier', trigger:'passive', target:'self', action:'modifyStat', params:{ stat:'allPct', value:0.50, mode:'add' } }
  ],
  '万古灵尊': [
    { id:'spirit_regen_hp', trigger:'onTurnEnd', target:'allyAll', action:'healPct', params:{ pct:0.05, base:'maxHp' } },
    { id:'spirit_regen_mp', trigger:'onTurnEnd', target:'allyAll', action:'restoreMp', params:{ mpPct:0.05 } },
    { id:'spirit_body', trigger:'onAllyDeath', chance:0.20, target:'allyDead', action:'applyStatus', params:{ status:'spiritBody', duration:3 } }
  ],
  '灭世魔龙': [
    { id:'destroy_breath', trigger:'onAttackHit', target:'target', action:'dispel', params:{ dispelType:'all' } }
  ],
  '永夜主宰': [
    { id:'eternal_night', trigger:'onTurnStart', condition:{ turnGTE:3 }, target:'self', action:'fieldEffect', params:{ fieldType:'field_eternal_night', duration:0, effects:{ enemyStatBonus:{ hitRate:-0.20 } } } }
  ],
  '圣渊天马': [
    { id:'speed_damage', trigger:'onAttackHit', target:'self', action:'dynamicBonus', params:{ stat:'dmgPct', formula:'0.08*selfSpdPct', max:2.0, applyTo:'currentAttack' } }
  ],
  '混沌麒麟': [
    { id:'chaos_aura', trigger:'onTurnStart', target:'allyAll', action:'applyStatus', params:{ status:'auspiciousAura', duration:1 } }
  ],
  '乾坤龙尊': [
    { id:'reverse', trigger:'onTurnStart', maxTrigger:1, target:'allyAll', action:'convertDebuffToBuff', params:{ duration:2 } }
  ]
};

// ==================== 血统机制引擎核心 ====================

// 获取宠物的血统 mechanics（从 PET_BLOODLINE_MECHANICS 查表）
function getPetBloodlineMechanics(pet) {
  if (!pet || !pet.name) return [];
  var mech = PET_BLOODLINE_MECHANICS[pet.name];
  if (!mech) return [];
  // 返回深拷贝避免运行时修改原始数据
  return mech.map(function(m) { return JSON.parse(JSON.stringify(m)); });
}

// 确保宠物的血统运行时状态存在
function ensureBloodlineRuntime(pet) {
  if (!pet._bloodlineRT) {
    pet._bloodlineRT = {
      cooldowns: {},        // { mechanicId: remainingTurns }
      triggerCounts: {},    // { mechanicId: count }
      firstAttackDone: false,
      firstHitDone: false,
      firstDeathDone: false,
      perTurnFirstAttack: false,
      perTurnFirstHit: false,
      storedDamage: {},     // { storeKey: amount }
      counters: {},         // { counterKey: count }
    };
  }
  return pet._bloodlineRT;
}

// 每回合重置 per-turn 标记
function resetBloodlinePerTurn(pet) {
  var rt = ensureBloodlineRuntime(pet);
  rt.perTurnFirstAttack = false;
  rt.perTurnFirstHit = false;
  // 冷却减少
  Object.keys(rt.cooldowns).forEach(function(k) {
    if (rt.cooldowns[k] > 0) rt.cooldowns[k]--;
  });
}

// 主触发入口：在战斗各节点调用
function triggerBloodlineMechanics(pet, triggerType, context) {
  if (!liveBattle || !pet) return;
  var bloodline = getBloodlineSkill(pet);
  if (!bloodline || !bloodline.mechanics || bloodline.mechanics.length === 0) return;
  var rt = ensureBloodlineRuntime(pet);
  context = context || {};

  bloodline.mechanics.forEach(function(m) {
    if (m.trigger !== triggerType) return;
    // 冷却检查
    if (m.cooldown && rt.cooldowns[m.id] > 0) return;
    // 最大触发次数检查
    if (m.maxTrigger && (rt.triggerCounts[m.id] || 0) >= m.maxTrigger) return;
    // 概率检查
    if (m.chance != null && Math.random() >= m.chance) return;
    // 条件检查
    if (m.condition && !checkMechanicCondition(pet, m.condition, context, rt)) return;
    // 执行动作
    executeMechanicAction(pet, m, context, rt);
    // 记录冷却和触发次数
    if (m.cooldown) rt.cooldowns[m.id] = m.cooldown;
    if (m.maxTrigger) rt.triggerCounts[m.id] = (rt.triggerCounts[m.id] || 0) + 1;
    // 标记首次攻击/受击
    if (triggerType === 'onAttackHit' || triggerType === 'onNormalAttackHit' || triggerType === 'onPhysicalAttackHit' || triggerType === 'onMagicAttackHit') {
      if (!rt.firstAttackDone) rt.firstAttackDone = true;
      if (!rt.perTurnFirstAttack) rt.perTurnFirstAttack = true;
    }
    if (triggerType === 'onHit' || triggerType === 'onPhysicalHit' || triggerType === 'onMagicHit' || triggerType === 'onMeleeHit' || triggerType === 'onRangedHit') {
      if (!rt.firstHitDone) rt.firstHitDone = true;
      if (!rt.perTurnFirstHit) rt.perTurnFirstHit = true;
    }
  });
}

// ==================== 条件判定 ====================
function checkMechanicCondition(pet, condition, ctx, rt) {
  var key = Object.keys(condition)[0];
  var val = condition[key];
  var hp = liveBattle.petHp[pet.id];

  switch (key) {
    case 'selfHpBelow':
      return hp && hp.current / hp.max < val;
    case 'selfHpAbove':
      return hp && hp.current / hp.max > val;
    case 'targetHpBelow': {
      var tgt = ctx.target;
      if (!tgt) return false;
      var tgtHp = liveBattle.petHp[tgt.id] || liveBattle.monsterHpArray[ctx.targetIdx];
      var tgtMax = liveBattle.petHp[tgt.id] ? liveBattle.petHp[tgt.id].max : liveBattle.monsterMaxHpArray[ctx.targetIdx];
      return tgtHp != null && tgtMax > 0 && tgtHp / tgtMax < val;
    }
    case 'targetHpAbove': {
      var tgt2 = ctx.target;
      if (!tgt2) return false;
      var tgtHp2 = liveBattle.petHp[tgt2.id] || liveBattle.monsterHpArray[ctx.targetIdx];
      var tgtMax2 = liveBattle.petHp[tgt2.id] ? liveBattle.petHp[tgt2.id].max : liveBattle.monsterMaxHpArray[ctx.targetIdx];
      return tgtHp2 != null && tgtMax2 > 0 && tgtHp2 / tgtMax2 > val;
    }
    case 'targetHpHigherThanSelf': {
      var tgt3 = ctx.target;
      if (!tgt3 || !hp) return false;
      var tgtHp3 = liveBattle.petHp[tgt3.id] || (ctx.targetIdx != null ? liveBattle.monsterHpArray[ctx.targetIdx] : 0);
      return tgtHp3 != null && tgtHp3 > hp.current;
    }
    case 'hasStatus': {
      var st = liveBattle.petStatus[pet.id];
      return st && st[val] > 0;
    }
    case 'targetHasStatus': {
      var tgtSt = ctx.target ? liveBattle.petStatus[ctx.target.id] : (ctx.targetIdx != null ? liveBattle.monsterStatusArray[ctx.targetIdx] : null);
      if (!tgtSt) return false;
      var statusMap = { burn:'burning', poison:'poisoned', freeze:'frozen', stun:'stunned', paralyze:'stunned', corrode:'corroded', petrify:'petrified', soulBurn:'soulBurn', stealth:'stealth', invisible:'invisible', fly:'flying' };
      var fieldName = statusMap[val] || val;
      return tgtSt[fieldName] > 0;
    }
    case 'statusStackGTE': {
      var sName = val.status, sCount = val.count;
      var target = ctx.target || pet;
      var tSt = liveBattle.petStatus[target.id] || (ctx.targetIdx != null ? liveBattle.monsterStatusArray[ctx.targetIdx] : null);
      if (!tSt) return false;
      var stackMap = { poison:'poisonStacks', rockShell:'rockShellStacks', frostbite:'frostbiteStacks', hitRateReduce:'hitRateReduceStacks' };
      var field = stackMap[sName] || (sName + 'Stacks');
      return (tSt[field] || 0) >= sCount;
    }
    case 'notControlled': {
      var ps = liveBattle.petStatus[pet.id];
      return !ps || (!ps.stunned && !ps.frozen && !ps.silenced && !ps.sleeping && !ps.rooted);
    }
    case 'isFirstAttack':
      return !rt.firstAttackDone;
    case 'isFirstHit':
      return !rt.firstHitDone;
    case 'isFirstDeath':
      return !rt.firstDeathDone;
    case 'everyNTurns':
      return liveBattle.round > 0 && liveBattle.round % val === 0;
    case 'turnLTE':
      return liveBattle.round <= val;
    case 'turnGTE':
      return liveBattle.round >= val;
    case 'isNight':
      return liveBattle.battleTime === 'night';
    case 'isDay':
      return liveBattle.battleTime === 'day';
    case 'isDusk':
      return liveBattle.battleTime === 'dusk';
    case 'dmgType':
      return ctx.dmgType === val || ctx.element === val;
    case 'isMagic':
      return ctx.isMagic === true;
    case 'isSingleTarget':
      return !ctx.isAOE;
    case 'isAoeHit':
      return ctx.isAOE === true;
    case 'killByMagic':
      return ctx.killByMagic === true;
    case 'killByExecute':
      return ctx.killByExecute === true;
    case 'purifySuccess':
      return ctx.debuffsRemoved > 0;
    case 'overheal':
      return ctx.healAmount != null && ctx.hpMissing != null && ctx.healAmount > ctx.hpMissing;
    case 'isFlying':
      return pet._isFlying === true;
    case 'targetIsFlying':
      return ctx.target && ctx.target._isFlying === true;
    case 'targetAlignment':
      return ctx.target && ctx.target.alignment === val;
    case 'targetRace':
      return ctx.target && ctx.target.race === val;
    case 'targetSize':
      return ctx.target && ctx.target.size === val;
    case 'targetFemale':
      return ctx.target && ctx.target.gender === 'female';
    case 'aliveAllyLTE': {
      var alive = liveBattle.team.filter(function(p) { return liveBattle.petHp[p.id] && liveBattle.petHp[p.id].current > 0; });
      return alive.length <= val;
    }
    case 'selfMpBelow': {
      var mp = liveBattle.petMp[pet.id];
      return mp && mp.current / mp.max < val;
    }
    case 'healBelowThreshold':
      return ctx.healAmount != null && ctx.healAmount < (ctx.healerMaxHp || 999999) * 0.10;
    default:
      // 未知条件默认通过
      return true;
  }
}

// ==================== 目标解析 ====================
function resolveMechanicTargets(pet, mechanic, ctx) {
  var target = mechanic.target;
  var result = [];
  switch (target) {
    case 'self':
      result.push(pet);
      break;
    case 'target':
    case 'attacker':
    case 'caster':
      if (ctx.target) result.push(ctx.target);
      else if (ctx.attacker) result.push(ctx.attacker);
      break;
    case 'allyAll':
      liveBattle.team.forEach(function(p) {
        if (liveBattle.petHp[p.id] && liveBattle.petHp[p.id].current > 0) result.push(p);
      });
      break;
    case 'allyLowestHp':
      var lowest = null, lowestHp = Infinity;
      liveBattle.team.forEach(function(p) {
        var h = liveBattle.petHp[p.id];
        if (h && h.current > 0 && h.current < lowestHp) { lowest = p; lowestHp = h.current; }
      });
      if (lowest) result.push(lowest);
      break;
    case 'allyHighestAtk':
      var highest = null, highestAtk = 0;
      liveBattle.team.forEach(function(p) {
        if (liveBattle.petHp[p.id] && liveBattle.petHp[p.id].current > 0) {
          var s = getPetStats(p);
          if (s.攻击力 > highestAtk) { highest = p; highestAtk = s.攻击力; }
        }
      });
      if (highest) result.push(highest);
      break;
    case 'allyRandom1':
      var aliveAllies = liveBattle.team.filter(function(p) { return liveBattle.petHp[p.id] && liveBattle.petHp[p.id].current > 0; });
      if (aliveAllies.length > 0) result.push(aliveAllies[Math.floor(Math.random() * aliveAllies.length)]);
      break;
    case 'enemyAll':
      getAliveMonsterIndices().forEach(function(idx) { result.push({ _monsterIdx: idx }); });
      break;
    case 'enemyRandom1': {
      var idx = getRandomAliveMonsterIdx();
      if (idx >= 0) result.push({ _monsterIdx: idx });
      break;
    }
    case 'enemyRandom2': {
      var alive = getAliveMonsterIndices();
      var shuffled = alive.slice();
      for (var i = shuffled.length - 1; i > 0; i--) { var j = Math.floor(Math.random()*(i+1)); var t = shuffled[i]; shuffled[i]=shuffled[j]; shuffled[j]=t; }
      shuffled.slice(0, 2).forEach(function(idx) { result.push({ _monsterIdx: idx }); });
      break;
    }
    case 'enemyAdjacent':
      if (ctx.targetIdx != null) {
        result.push({ _monsterIdx: ctx.targetIdx });
        if (ctx.targetIdx > 0 && liveBattle.monsterHpArray[ctx.targetIdx-1] > 0) result.push({ _monsterIdx: ctx.targetIdx-1 });
        if (ctx.targetIdx < liveBattle.monsters.length-1 && liveBattle.monsterHpArray[ctx.targetIdx+1] > 0) result.push({ _monsterIdx: ctx.targetIdx+1 });
      }
      break;
    case 'allyDead':
      liveBattle.team.forEach(function(p) {
        var h = liveBattle.petHp[p.id];
        if (!h || h.current <= 0) result.push(p);
      });
      break;
    default:
      if (ctx.target) result.push(ctx.target);
      break;
  }
  return result;
}

// 对怪物目标造成伤害的辅助函数
function dealDamageToMonsterTarget(idx, dmg, dmgType) {
  if (idx < 0 || idx >= liveBattle.monsters.length) return;
  if (liveBattle.monsterHpArray[idx] <= 0) return;
  liveBattle.monsterHpArray[idx] -= dmg;
  liveBattle.totalDamage += dmg;
  if (liveBattle.monsterHpArray[idx] <= 0) {
    liveBattle.monsterHpArray[idx] = 0;
    logMonsterKill(idx);
    if (currentScreen === 'main') animateMonsterDeath(idx);
  }
}

// 对宠物目标造成伤害
function dealDamageToPetTarget(pet, dmg) {
  var hp = liveBattle.petHp[pet.id];
  if (!hp || hp.current <= 0) return;
  hp.current = Math.max(0, hp.current - dmg);
}

// ==================== 动作执行 ====================
function executeMechanicAction(pet, mechanic, ctx, rt) {
  var action = mechanic.action;
  var params = mechanic.params || {};
  var targets = resolveMechanicTargets(pet, mechanic, ctx);

  switch (action) {
    case 'applyStatus':
      targets.forEach(function(tgt) { applyBloodlineStatus(pet, tgt, params, ctx); });
      break;
    case 'removeStatus':
      targets.forEach(function(tgt) { removeBloodlineStatus(tgt, params); });
      break;
    case 'modifyStat':
      targets.forEach(function(tgt) { modifyBloodlineStat(pet, tgt, params, ctx); });
      break;
    case 'modifyNextAttack':
      // 存储到运行时，下次攻击时消费
      if (!pet._nextAttackMods) pet._nextAttackMods = [];
      pet._nextAttackMods.push(params);
      break;
    case 'dealDamage':
      targets.forEach(function(tgt) {
        var dmg = calcBloodlineDamage(pet, tgt, params, ctx);
        if (tgt._monsterIdx != null) dealDamageToMonsterTarget(tgt._monsterIdx, dmg, params.dmgType);
        else dealDamageToPetTarget(tgt, dmg);
        addBattleLog('skill', '🔥 ' + getPetDisplayName(pet) + ' 的血统技能对目标造成 ' + dmg + ' 点' + (params.dmgType || '') + '伤害');
      });
      break;
    case 'dealDamagePct':
      targets.forEach(function(tgt) {
        var baseVal = getBaseValueForTarget(tgt, params.base, ctx);
        var pct = typeof params.pct === 'number' ? params.pct : 0;
        var dmg = Math.floor(baseVal * pct);
        if (params.asTrue) { /* 真实伤害不减防 */ }
        if (tgt._monsterIdx != null) dealDamageToMonsterTarget(tgt._monsterIdx, dmg, params.dmgType);
        else dealDamageToPetTarget(tgt, dmg);
        addBattleLog('skill', '💥 ' + getPetDisplayName(pet) + ' 的血统技能造成 ' + dmg + ' 点百分比伤害');
      });
      break;
    case 'heal':
    case 'healPct':
      targets.forEach(function(tgt) {
        var healAmt = calcBloodlineHeal(pet, tgt, params, ctx);
        var hp = liveBattle.petHp[tgt.id];
        if (hp) {
          var before = hp.current;
          hp.current = Math.min(hp.max, hp.current + healAmt);
          var actual = hp.current - before;
          if (actual > 0) addBattleLog('heal', '💚 ' + getPetDisplayName(pet) + ' 的血统技能治疗 ' + (tgt.id ? getPetDisplayName(tgt) : '目标') + ' ' + actual + ' 气血');
        }
      });
      break;
    case 'addShield':
      targets.forEach(function(tgt) { addBloodlineShield(pet, tgt, params, ctx); });
      break;
    case 'revive':
      targets.forEach(function(tgt) {
        var hp = liveBattle.petHp[tgt.id];
        if (hp && hp.current <= 0) {
          hp.current = Math.floor(hp.max * (params.hpPct || 0.30));
          if (params.clearDebuff) { clearAllPetDebuffs(tgt); }
          addBattleLog('heal', '✨ ' + getPetDisplayName(tgt) + ' 的血统技能复活！恢复 ' + Math.floor((params.hpPct||0.30)*100) + '% 气血');
        }
      });
      break;
    case 'reflect':
      targets.forEach(function(tgt) {
        var reflectDmg = Math.floor((ctx.damage || 0) * (params.reflectPct || 0.20));
        // 动态加成
        if (params.dynamicBonus) {
          var hpRatio = liveBattle.petHp[pet.id] ? liveBattle.petHp[pet.id].current / liveBattle.petHp[pet.id].max : 1;
          var bonus = evalDynamicFormula(params.dynamicBonus.formula, { hpPct: hpRatio });
          reflectDmg += Math.floor((ctx.damage || 0) * Math.min(bonus, params.dynamicBonus.max || 0.25));
        }
        if (tgt._monsterIdx != null) dealDamageToMonsterTarget(tgt._monsterIdx, reflectDmg, params.dmgType);
        else dealDamageToPetTarget(tgt, reflectDmg);
        addBattleLog('skill', '💢 ' + getPetDisplayName(pet) + ' 的血统反弹对目标造成 ' + reflectDmg + ' 伤害');
      });
      break;
    case 'counter':
      targets.forEach(function(tgt) {
        var atkPower = getPetAtkPower(pet, getPetStats(pet), getPassiveEffects(pet), getAuraEffects(liveBattle.team), liveBattle.petBuffs[pet.id], getBloodlineSkill(pet));
        var counterDmg = Math.max(1, Math.floor(atkPower * (params.counterPct || 0.50)));
        if (tgt._monsterIdx != null) dealDamageToMonsterTarget(tgt._monsterIdx, counterDmg, params.dmgType);
        addBattleLog('skill', '⚔️ ' + getPetDisplayName(pet) + ' 的血统反击造成 ' + counterDmg + ' 伤害');
      });
      break;
    case 'forceDodge':
      ctx.forceDodge = true;
      addBattleLog('skill', '🌀 ' + getPetDisplayName(pet) + ' 的血统技能触发闪避！');
      break;
    case 'forceCrit':
      ctx.forceCrit = true;
      break;
    case 'forceBlock':
      ctx.forceBlock = true;
      addBattleLog('skill', '🛡️ ' + getPetDisplayName(pet) + ' 的血统技能触发格挡！');
      break;
    case 'extraAttack':
      targets.forEach(function(tgt) {
        var atkPower = getPetAtkPower(pet, getPetStats(pet), getPassiveEffects(pet), getAuraEffects(liveBattle.team), liveBattle.petBuffs[pet.id], getBloodlineSkill(pet));
        var extraDmg = Math.max(1, Math.floor(atkPower * (params.dmgPct || 0.30)));
        if (tgt._monsterIdx != null) dealDamageToMonsterTarget(tgt._monsterIdx, extraDmg, params.dmgType);
        else dealDamageToPetTarget(tgt, extraDmg);
        addBattleLog('skill', '⚡ ' + getPetDisplayName(pet) + ' 的血统追加攻击造成 ' + extraDmg + ' 伤害');
      });
      break;
    case 'delayTurnOrder':
      // 简化：将目标的行动顺位延后（通过降低速度临时值实现）
      targets.forEach(function(tgt) {
        if (tgt._monsterIdx != null) {
          var m = liveBattle.monsters[tgt._monsterIdx];
          if (m) m.speed = Math.max(1, (m.speed || 10) - 5);
        }
        addBattleLog('skill', '⏳ ' + getPetDisplayName(pet) + ' 的血统技能延迟了目标行动');
      });
      break;
    case 'purify':
      targets.forEach(function(tgt) {
        var removed = clearPetDebuffs(tgt, params.debuffType || 'all', params.count || 99);
        if (removed > 0) {
          ctx.debuffsRemoved = (ctx.debuffsRemoved || 0) + removed;
          addBattleLog('skill', '✨ ' + getPetDisplayName(pet) + ' 的血统净化清除了 ' + removed + ' 个负面状态');
        }
      });
      break;
    case 'restoreMp':
      targets.forEach(function(tgt) {
        var mp = liveBattle.petMp[tgt.id];
        if (mp) {
          var recover = Math.floor(mp.max * (params.mpPct || 0.05));
          mp.current = Math.min(mp.max, mp.current + recover);
          if (recover > 0) addBattleLog('skill', '🔵 ' + getPetDisplayName(pet) + ' 的血统技能恢复 ' + recover + ' 法力');
        }
      });
      break;
    case 'dynamicBonus':
      // 计算动态加成并存入 context 供当前攻击使用
      var bonus = evalDynamicBonus(pet, params, ctx);
      if (params.applyTo === 'currentAttack') {
        if (!pet._currentAttackBonuses) pet._currentAttackBonuses = {};
        pet._currentAttackBonuses[params.stat] = (pet._currentAttackBonuses[params.stat] || 0) + bonus;
      } else if (params.applyTo === 'currentHit') {
        ctx.dmgReduceBonus = (ctx.dmgReduceBonus || 0) + bonus;
      } else {
        // 永久加成 - 存入运行时
        if (!pet._permanentBonuses) pet._permanentBonuses = {};
        pet._permanentBonuses[params.stat] = (pet._permanentBonuses[params.stat] || 0) + bonus;
      }
      break;
    case 'counterIncrement':
      var cKey = params.counterKey;
      var increment = params.increment != null ? params.increment : 1;
      rt.counters[cKey] = (rt.counters[cKey] || 0) + increment;
      if (rt.counters[cKey] < 0) rt.counters[cKey] = 0;
      // 达到最大值时触发 onMaxTrigger
      if (params.maxCount && rt.counters[cKey] >= params.maxCount && params.onMaxTrigger) {
        var maxT = params.onMaxTrigger;
        executeMechanicAction(pet, { action: maxT.action, params: maxT.params, target: mechanic.target }, ctx, rt);
        if (maxT.consume !== false) rt.counters[cKey] = 0;
      }
      break;
    case 'storeDamage':
      if (ctx.damage) {
        var storePct = params.storePct || 0.30;
        rt.storedDamage[params.storeKey] = (rt.storedDamage[params.storeKey] || 0) + Math.floor(ctx.damage * storePct);
      }
      break;
    case 'releaseStoredDamage':
      var stored = rt.storedDamage[params.storeKey] || 0;
      if (stored > 0) {
        targets.forEach(function(tgt) {
          if (tgt._monsterIdx != null) dealDamageToMonsterTarget(tgt._monsterIdx, stored, params.asDmgType);
          else dealDamageToPetTarget(tgt, stored);
        });
        addBattleLog('skill', '💥 ' + getPetDisplayName(pet) + ' 释放存储伤害 ' + stored);
        rt.storedDamage[params.storeKey] = 0;
      }
      break;
    case 'setHp':
      targets.forEach(function(tgt) {
        var hp = liveBattle.petHp[tgt.id];
        if (hp) {
          if (params.value === '1') hp.current = 1;
          else if (typeof params.value === 'number') hp.current = Math.floor(hp.max * params.value);
          addBattleLog('skill', '🛡️ ' + getPetDisplayName(tgt) + ' 的血统技能保命！剩余 ' + hp.current + ' 气血');
        }
      });
      break;
    case 'stealBuff':
      // 简化：偷取目标的增益（从 buff 中移除一个加到自身）
      targets.forEach(function(tgt) {
        if (tgt._monsterIdx != null) {
          var mb = liveBattle.monsterBuffsArray[tgt._monsterIdx];
          var pb = liveBattle.petBuffs[pet.id];
          if (mb && pb) {
            if (mb.atk > 0) { pb.atk = mb.atk; pb.buffTurns.atk = 3; mb.atk = 0; addBattleLog('skill', '🩸 ' + getPetDisplayName(pet) + ' 偷取了攻击增益'); }
            else if (mb.def > 0) { pb.def = mb.def; pb.buffTurns.def = 3; mb.def = 0; addBattleLog('skill', '🩸 ' + getPetDisplayName(pet) + ' 偷取了防御增益'); }
          }
        }
      });
      break;
    case 'displace':
      addBattleLog('skill', '💨 ' + getPetDisplayName(pet) + ' 的血统技能击退了目标');
      break;
    case 'fieldEffect':
      applyBloodlineFieldEffect(pet, params);
      break;
    case 'summon':
      // 简化召唤：记录幻影数量，影响闪避等
      if (params.summonType === 'phantom') {
        pet._phantomHp = (pet._phantomHp || 0) + 1;
        addBattleLog('skill', '👤 ' + getPetDisplayName(pet) + ' 生成了幻影分身');
      } else if (params.summonType === 'totem') {
        pet._totemHp = (pet._totemHp || 0) + 1;
        addBattleLog('skill', '🗿 ' + getPetDisplayName(pet) + ' 召唤了图腾');
      } else if (params.summonType === 'miniSlime') {
        pet._minion1Hp = 1; pet._minion2Hp = 1;
        addBattleLog('skill', '🟢 ' + getPetDisplayName(pet) + ' 分裂出小史莱姆');
      } else if (params.summonType === 'remnant') {
        pet._remnantTurns = params.duration || 3;
        addBattleLog('skill', '👁️ ' + getPetDisplayName(pet) + ' 化为残影');
      }
      break;
    case 'ignoreShield':
      ctx.ignoreShield = true;
      ctx.dmgBonusPct = (ctx.dmgBonusPct || 0) + (params.dmgBonusPct || 0);
      break;
    case 'resetCooldown':
      if (liveBattle.skillCooldowns[pet.id]) {
        Object.keys(liveBattle.skillCooldowns[pet.id]).forEach(function(sid) {
          liveBattle.skillCooldowns[pet.id][sid] = 0;
        });
        addBattleLog('skill', '🔄 ' + getPetDisplayName(pet) + ' 的血统技能重置了冷却');
      }
      break;
    case 'convertDamage':
      // 将伤害转化为治疗或状态
      if (ctx.damage && params.toType === 'heal') {
        var healAmt2 = Math.floor(ctx.damage * (params.convertPct || 0.30));
        var hp2 = liveBattle.petHp[pet.id];
        if (hp2) {
          var maxHeal = Math.floor(hp2.max * (params.maxHealPct || 0.10));
          hp2.current = Math.min(hp2.max, hp2.current + Math.min(healAmt2, maxHeal));
          ctx.damage = 0; // 伤害被转化
          addBattleLog('heal', '💚 ' + getPetDisplayName(pet) + ' 转化了伤害为治疗');
        }
      } else if (ctx.damage && params.toType === 'status' && params.statusName) {
        applyBloodlineStatus(pet, pet, { status: params.statusName, stack: params.stack || 1, maxStack: params.maxStack || 10, atkPctPerStack: params.atkPctPerStack || 0.05 }, ctx);
        ctx.damage = 0;
        addBattleLog('skill', '🔥 ' + getPetDisplayName(pet) + ' 转化了伤害为状态');
      }
      break;
    case 'damageShare':
      // 简化：分摊伤害给友方
      ctx.damageSharePct = params.sharePct || 0.10;
      break;
    case 'convertDebuffToBuff':
      targets.forEach(function(tgt) {
        var st = liveBattle.petStatus[tgt.id];
        if (st) {
          // 将负面状态转为增益
          if (st.poisoned > 0) { st.poisoned = 0; var b = liveBattle.petBuffs[tgt.id]; if (b) { b.all = (b.all||0) + 0.10; b.buffTurns.all = 2; } }
          if (st.burning > 0) { st.burning = 0; var b2 = liveBattle.petBuffs[tgt.id]; if (b2) { b2.atk = (b2.atk||0) + 0.10; b2.buffTurns.atk = 2; } }
          if (st.frozen > 0) st.frozen = 0;
          if (st.stunned > 0) st.stunned = 0;
          addBattleLog('skill', '🔄 ' + getPetDisplayName(pet) + ' 将负面状态转化为正面增益');
        }
      });
      break;
    case 'splitAttack':
      // 多段攻击：在当前攻击基础上追加伤害
      var hits = typeof params.hits === 'number' ? params.hits : 1;
      var dmgPerHit = params.dmgPctPerHit || 0.50;
      targets.forEach(function(tgt) {
        var atkPower2 = getPetAtkPower(pet, getPetStats(pet), getPassiveEffects(pet), getAuraEffects(liveBattle.team), liveBattle.petBuffs[pet.id], getBloodlineSkill(pet));
        for (var h = 0; h < hits; h++) {
          var hitDmg = Math.max(1, Math.floor(atkPower2 * dmgPerHit));
          if (tgt._monsterIdx != null) dealDamageToMonsterTarget(tgt._monsterIdx, hitDmg, params.dmgType);
          // 每段附带 hitEffects
          if (params.hitEffects && params.hitEffects[h]) {
            var he = params.hitEffects[h];
            executeMechanicAction(pet, { action: he.action, params: he.params, target: 'target' }, Object.assign({}, ctx, { target: tgt, targetIdx: tgt._monsterIdx }), rt);
          }
        }
        addBattleLog('skill', '⚡ ' + getPetDisplayName(pet) + ' 的血统多段攻击造成 ' + (Math.floor(atkPower2 * dmgPerHit * hits)) + ' 总伤害');
      });
      break;
    case 'chainBounce':
      var chainTargets = typeof params.targets === 'number' ? params.targets : 2;
      var chainDmgPct = params.dmgPct || 0.50;
      var atkPower3 = getPetAtkPower(pet, getPetStats(pet), getPassiveEffects(pet), getAuraEffects(liveBattle.team), liveBattle.petBuffs[pet.id], getBloodlineSkill(pet));
      var alive3 = getAliveMonsterIndices();
      var shuffled3 = alive3.slice();
      for (var ci = shuffled3.length - 1; ci > 0; ci--) { var cj = Math.floor(Math.random()*(ci+1)); var ct = shuffled3[ci]; shuffled3[ci]=shuffled3[cj]; shuffled3[cj]=ct; }
      shuffled3.slice(0, chainTargets).forEach(function(idx) {
        var chainDmg = Math.max(1, Math.floor(atkPower3 * chainDmgPct));
        dealDamageToMonsterTarget(idx, chainDmg, params.dmgType);
      });
      addBattleLog('skill', '⚡ ' + getPetDisplayName(pet) + ' 的血统连锁弹射命中 ' + chainTargets + ' 个目标');
      break;
    case 'dispel':
      targets.forEach(function(tgt) {
        if (tgt._monsterIdx != null) {
          var mb2 = liveBattle.monsterBuffsArray[tgt._monsterIdx];
          if (mb2) {
            if (params.dispelType === 'all' || params.dispelType === 'shield') { mb2.shield = 0; mb2.shieldTurns = 0; }
            if (params.dispelType === 'all' || params.dispelType === 'buff') { mb2.atk = 0; mb2.def = 0; mb2.spd = 0; mb2.all = 0; }
          }
          addBattleLog('skill', '💨 ' + getPetDisplayName(pet) + ' 驱散了目标的增益');
        }
      });
      break;
    case 'leaveTrail':
      // 简化：对相邻敌人施加 trailEffects
      if (params.trailEffects) {
        getAliveMonsterIndices().forEach(function(idx) {
          applyBloodlineStatus(pet, { _monsterIdx: idx }, params.trailEffects, ctx);
        });
      }
      break;
    case 'retarget':
      ctx.retargetChance = params.chance || 0;
      break;
    default:
      // 未知动作，忽略
      break;
  }
}

// ==================== 状态附加 ====================
function applyBloodlineStatus(caster, target, params, ctx) {
  var statusName = params.status;
  if (!statusName) return;

  // 目标是怪物
  if (target._monsterIdx != null) {
    var idx = target._monsterIdx;
    var ms = liveBattle.monsterStatusArray[idx];
    if (!ms) return;
    applyStatusToStatusObj(ms, params, caster, ctx, idx);
    addBattleLog('skill', '🔴 ' + getPetDisplayName(caster) + ' 的血统技能为敌人附加「' + statusName + '」');
    return;
  }

  // 目标是宠物
  if (target.id) {
    var ps = liveBattle.petStatus[target.id];
    if (!ps) return;
    applyStatusToStatusObj(ps, params, caster, ctx, null);
    addBattleLog('skill', '🔵 ' + getPetDisplayName(caster) + ' 的血统技能为友方附加「' + statusName + '」');
  }
}

// 将状态效果应用到状态对象上
function applyStatusToStatusObj(st, params, caster, ctx, monsterIdx) {
  var s = params.status;
  var duration = params.duration || 1;
  var stack = params.stack || 1;
  var maxStack = params.maxStack || 1;

  // DOT 类状态
  if (s === 'burn' || s === 'soulBurn') {
    if (st.burning == null || st.burning <= 0 || st.burning < duration) st.burning = duration;
    st.burnPct = Math.max(st.burnPct || 0, params.dotPct || 0.05);
    if (params.dotSource === 'lastHitDmg' && ctx.damage) st.burnPct = Math.max(st.burnPct, ctx.damage * 0.10 / (liveBattle.monsterMaxHpArray[monsterIdx] || 1000));
    if (s === 'soulBurn') { st.soulBurn = duration; st.noHeal = true; st.undispellable = true; }
  } else if (s === 'poison' || s === 'corpsePoison') {
    if (st.poisoned == null || st.poisoned <= 0 || st.poisoned < duration) st.poisoned = duration;
    st.poisonPct = Math.max(st.poisonPct || 0, params.dotPct || 0.05);
    if (stack > 1) { st.poisonStacks = Math.min(maxStack, (st.poisonStacks || 0) + stack); st.poisonPct = (params.dotPct || 0.03) * st.poisonStacks; }
  }
  // 控制类状态
  else if (s === 'freeze') { st.frozen = Math.max(st.frozen || 0, duration); }
  else if (s === 'stun' || s === 'holyStun' || s === 'paralyze' || s === 'fear') { st.stunned = Math.max(st.stunned || 0, duration); }
  else if (s === 'sleep') { st.sleeping = Math.max(st.sleeping || 0, duration); }
  else if (s === 'root') { st.rooted = Math.max(st.rooted || 0, duration); }
  else if (s === 'silence') { st.silenced = Math.max(st.silenced || 0, duration); }
  else if (s === 'confuse' || s === 'daze' || s === 'mischief') { st.confused = Math.max(st.confused || 0, duration); }
  // 减益类状态
  else if (s === 'frostbite') { st.frostbite = Math.max(st.frostbite || 0, duration); st.frostbiteStacks = Math.min(maxStack || 3, (st.frostbiteStacks || 0) + stack); if (params.spdPct) st.spdReduced = (st.spdReduced || 0) + Math.abs(params.spdPct); }
  else if (s === 'spdReduce') { st.spdReduced = Math.max(st.spdReduced || 0, Math.abs(params.spdPct || 0.10)); st.spdReduceTurns = Math.max(st.spdReduceTurns || 0, duration); }
  else if (s === 'atkReduce') { st.atkReduced = Math.max(st.atkReduced || 0, Math.abs(params.atkPct || 0.10)); st.atkReduceTurns = Math.max(st.atkReduceTurns || 0, duration); }
  else if (s === 'defReduce') { st.defReduced = Math.max(st.defReduced || 0, Math.abs(params.defPct || 0.10)); st.defReduceTurns = Math.max(st.defReduceTurns || 0, duration); }
  else if (s === 'intReduce') { st.intReduced = Math.max(st.intReduced || 0, Math.abs(params.intPct || 0.10)); st.intReduceTurns = Math.max(st.intReduceTurns || 0, duration); }
  else if (s === 'hitRateReduce') { st.hitRateReduced = Math.max(st.hitRateReduced || 0, Math.abs(params.hitRate || 0.10)); st.hitRateReduceTurns = Math.max(st.hitRateReduceTurns || 0, duration); st.hitRateReduceStacks = Math.min(maxStack || 3, (st.hitRateReduceStacks || 0) + stack); }
  else if (s === 'dodgeReduce') { st.dodgeReduced = Math.max(st.dodgeReduced || 0, Math.abs(params.dodgeRate || 0.10)); st.dodgeReduceTurns = Math.max(st.dodgeReduceTurns || 0, duration); }
  else if (s === 'corrode') { st.corroded = Math.max(st.corroded || 0, duration); st.magicDmgTaken = Math.max(st.magicDmgTaken || 0, params.magicDmgTaken || 0.15); }
  else if (s === 'fireWound') { st.fireWound = Math.max(st.fireWound || 0, duration); st.healReduce = Math.max(st.healReduce || 0, params.healReduce || 0.50); }
  else if (s === 'omen') { st.omen = Math.max(st.omen || 0, duration); st.noCrit = true; }
  else if (s === 'windSpin') { st.windSpin = Math.max(st.windSpin || 0, duration); }
  else if (s === 'petrify') { st.petrified = Math.max(st.petrified || 0, duration); }
  else if (s === 'wingFreeze') { st.wingFreeze = Math.max(st.wingFreeze || 0, duration); st.spdReduced = Math.max(st.spdReduced || 0, Math.abs(params.spdPct || 0.40)); }
  else if (s === 'timeRift') { st.timeRift = Math.max(st.timeRift || 0, duration); st.missChance = Math.max(st.missChance || 0, params.missChance || 0.50); }
  else if (s === 'spellBackfire') { st.spellBackfire = Math.max(st.spellBackfire || 0, duration); st.skillDmgToSelf = Math.max(st.skillDmgToSelf || 0, params.skillDmgToSelf || 0.50); }
  else if (s === 'rust') { st.rust = Math.max(st.rust || 0, duration); st.atkReduced = (st.atkReduced || 0) + Math.abs(params.atkPct || 0.03); }
  else if (s === 'gaze') { st.gazed = Math.max(st.gazed || 0, duration); st.dmgTaken = Math.max(st.dmgTaken || 0, params.dmgTaken || 0.30); }
  // 增益类状态
  else if (s === 'rockShell') { st.rockShell = Math.max(st.rockShell || 0, 999); st.rockShellStacks = Math.min(maxStack || 10, (st.rockShellStacks || 0) + stack); st.rockShellDefPerStack = params.defPctPerStack || 0.03; }
  else if (s === 'fireEnergy') { st.fireEnergy = Math.max(st.fireEnergy || 0, 999); st.fireEnergyStacks = Math.min(maxStack || 10, (st.fireEnergyStacks || 0) + stack); }
  else if (s === 'devour') { st.devour = Math.max(st.devour || 0, 999); st.devourStacks = Math.min(maxStack || 5, (st.devourStacks || 0) + stack); }
  else if (s === 'tailUnlock') { st.tailUnlock = Math.max(st.tailUnlock || 0, 999); st.tailUnlockStacks = Math.min(maxStack || 9, (st.tailUnlockStacks || 0) + stack); }
  else if (s === 'hitStack') { st.hitStack = Math.max(st.hitStack || 0, 999); st.hitStacks = Math.min(maxStack || 5, (st.hitStacks || 0) + stack); }
  else if (s === 'snipeStack') { st.snipeStack = Math.max(st.snipeStack || 0, 999); st.snipeStacks = (st.snipeStacks || 0) + stack; }
  else if (s === 'fireDmgBonus') { st.fireDmgBonus = Math.max(st.fireDmgBonus || 0, 999); st.fireDmgBonusStacks = Math.min(maxStack || 5, (st.fireDmgBonusStacks || 0) + stack); }
  else if (s === 'ghost') { st.ghost = Math.max(st.ghost || 0, duration); st.immunePhysical = true; st.nextAttackCrit = true; }
  else if (s === 'stealth') { st.stealth = Math.max(st.stealth || 0, duration); }
  else if (s === 'invisible') { st.invisible = Math.max(st.invisible || 0, duration); }
  else if (s === 'fly') { st.flying = Math.max(st.flying || 0, duration); }
  else if (s === 'berserk') { st.berserk = Math.max(st.berserk || 0, duration); }
  else if (s === 'dormant') { st.dormant = Math.max(st.dormant || 0, duration); }
  else if (s === 'nirvana') { st.nirvana = Math.max(st.nirvana || 0, duration); }
  else if (s === 'ironBody') { st.ironBody = Math.max(st.ironBody || 0, duration); }
  else if (s === 'shellRetract') { st.shellRetract = Math.max(st.shellRetract || 0, duration); }
  else if (s === 'dodgeBonus') { var b = liveBattle.petBuffs[caster.id]; if (b) { b.dodgeBuff = (b.dodgeBuff || 0) + (params.dodgeRate || 0.10); b.dodgeTurns = Math.max(b.dodgeTurns || 0, duration); } }
  else if (s === 'spdBonus') { var b2 = liveBattle.petBuffs[caster.id]; if (b2) { b2.spd = (b2.spd || 0) + (params.spdPct || 0.05); b2.buffTurns.spd = Math.max(b2.buffTurns.spd || 0, duration); } }
  else if (s === 'atkBonus') { var b3 = liveBattle.petBuffs[caster.id]; if (b3) { b3.atk = (b3.atk || 0) + (params.atkPct || 0.05); b3.buffTurns.atk = duration || 1; } }
  else if (s === 'defBonus') { var b4 = liveBattle.petBuffs[caster.id]; if (b4) { b4.def = (b4.def || 0) + (params.defPct || 0.05); b4.buffTurns.def = duration || 1; } }
  else if (s === 'critResist') { st.critResist = Math.max(st.critResist || 0, duration); st.antiCrit = (st.antiCrit || 0) + (params.antiCrit || 0.10); }
  else if (s === 'dmgReduce') { var b5 = liveBattle.petBuffs[target_id(caster)]; if (b5) { b5.dmgReduceBuff = (b5.dmgReduceBuff || 0) + (params.dmgReduce || 0.20); } }
  else if (s === 'fireflyLight') { st.fireflyLight = Math.max(st.fireflyLight || 0, duration); }
  else if (s === 'flowerDew' || s === 'spore') { var b6 = liveBattle.petBuffs[caster.id]; if (b6) { b6.hotTurns = Math.max(b6.hotTurns || 0, duration); b6.hotPct = params.hotPct || 0.03; } }
  else if (s === 'auspiciousAura') { st.auspiciousAura = Math.max(st.auspiciousAura || 0, duration); }
  else if (s === 'chaosEffect') { st.chaosEffect = Math.max(st.chaosEffect || 0, duration); }
  else if (s === 'chargeBonus') { st.chargeBonus = Math.max(st.chargeBonus || 0, duration); }
  else if (s === 'spiritBody') { st.spiritBody = Math.max(st.spiritBody || 0, duration); }
  else if (s === 'noCounter') { st.noCounter = Math.max(st.noCounter || 0, duration); }
  else if (s === 'noRegen') { st.noRegen = true; }
  else if (s === 'poisonCharge') { st.poisonCharge = Math.max(st.poisonCharge || 0, 999); st.poisonChargeStacks = Math.min(maxStack || 5, (st.poisonChargeStacks || 0) + stack); }
  else if (s === 'frostFlower') { st.frostFlower = Math.max(st.frostFlower || 0, 999); st.frostFlowerStacks = Math.min(maxStack || 3, (st.frostFlowerStacks || 0) + stack); }
  // 通用兜底
  else {
    // 未识别状态名，尝试通用设置
    st[s] = Math.max(st[s] || 0, duration);
  }
}

function target_id(pet) { return pet.id; }

// ==================== 状态移除 ====================
function removeBloodlineStatus(target, params) {
  var statusName = params.status;
  if (target._monsterIdx != null) {
    var ms = liveBattle.monsterStatusArray[target._monsterIdx];
    if (!ms) return;
    removeStatusFromObj(ms, statusName, params.removeAll);
  } else if (target.id) {
    var ps = liveBattle.petStatus[target.id];
    if (!ps) return;
    removeStatusFromObj(ps, statusName, params.removeAll);
  }
}

function removeStatusFromObj(st, name, removeAll) {
  var map = { burn:'burning', poison:'poisoned', freeze:'frozen', stun:'stunned', sleep:'sleeping', root:'rooted', silence:'silenced', corrode:'corroded', soulBurn:'soulBurn', petrify:'petrified', fireWound:'fireWound' };
  var field = map[name] || name;
  if (removeAll) {
    st[field] = 0;
    st[field + 'Stacks'] = 0;
  } else {
    st[field] = Math.max(0, (st[field] || 0) - 1);
  }
}

// ==================== 属性修改 ====================
function modifyBloodlineStat(caster, target, params, ctx) {
  var stat = params.stat;
  var value = params.value;
  var mode = params.mode || 'add';
  var duration = params.duration || 0;
  var applyTo = params.applyTo;

  // applyTo=currentAttack: 临时加成存入 _currentAttackBonuses
  if (applyTo === 'currentAttack') {
    if (target.id) {
      if (!target._currentAttackBonuses) target._currentAttackBonuses = {};
      if (mode === 'multiply') target._currentAttackBonuses[stat] = (target._currentAttackBonuses[stat] || 1) * value;
      else target._currentAttackBonuses[stat] = (target._currentAttackBonuses[stat] || 0) + value;
    }
    return;
  }
  // applyTo=currentHit: 存入 ctx
  if (applyTo === 'currentHit') {
    if (mode === 'multiply') ctx.dmgTakenMult = (ctx.dmgTakenMult || 1) * value;
    else ctx.dmgReduceBonus = (ctx.dmgReduceBonus || 0) + value;
    return;
  }
  // applyTo=currentHeal: 存入 ctx
  if (applyTo === 'currentHeal') {
    if (mode === 'multiply') ctx.healMult = (ctx.healMult || 1) * value;
    else ctx.healBonus = (ctx.healBonus || 0) + value;
    return;
  }

  // 永久/持续加成
  if (target.id) {
    var buffs = liveBattle.petBuffs[target.id];
    if (!buffs) return;
    var turns = duration > 0 ? duration : 9999;
    if (stat === 'atkPct') { buffs.atk = (buffs.atk || 0) + value; buffs.buffTurns.atk = turns; }
    else if (stat === 'defPct') { buffs.def = (buffs.def || 0) + value; buffs.buffTurns.def = turns; }
    else if (stat === 'spdPct') { buffs.spd = (buffs.spd || 0) + value; buffs.buffTurns.spd = turns; }
    else if (stat === 'allPct') { buffs.all = (buffs.all || 0) + value; buffs.buffTurns.all = turns; }
    else if (stat === 'healBoost') { buffs.healBoost = (buffs.healBoost || 0) + value; buffs.buffTurns.healBoost = turns; }
    else if (stat === 'dmgReduce') { buffs.dmgReduceBuff = (buffs.dmgReduceBuff || 0) + value; buffs.buffTurns.dmgReduceBuff = turns; }
    else if (stat === 'critRate') { buffs.critRateBuff = (buffs.critRateBuff || 0) + value; }
    else if (stat === 'dodgeRate') { buffs.dodgeBuff = (buffs.dodgeBuff || 0) + value; buffs.dodgeTurns = turns; }
    else if (stat === 'lifestealPct') { buffs.lifestealBuff = (buffs.lifestealBuff || 0) + value; }
    else if (stat === 'hpPct') {
      // 直接增加最大血量
      var hp = liveBattle.petHp[target.id];
      if (hp) { var add = Math.floor(hp.max * value); hp.max += add; hp.current += add; }
    }
    else {
      // 通用：存入 buffTurns 自定义键
      buffs.buffTurns[stat] = turns;
      buffs[stat] = value;
    }
  }
}

// ==================== 护盾系统 ====================
function addBloodlineShield(caster, target, params, ctx) {
  var shieldType = params.shieldType;
  var absorbPct = params.absorbPct || 0.10;
  var base = params.base || 'maxHp';
  var baseVal = getBaseValueForTarget(target, base, ctx);
  var absorb = Math.floor(baseVal * absorbPct);

  if (target.id) {
    var buffs = liveBattle.petBuffs[target.id];
    if (!buffs) return;
    if (params.noStack && buffs.shield > 0) return; // 不可叠加
    buffs.shield = (buffs.shield || 0) + absorb;
    buffs.shieldTurns = params.duration || 2;
    buffs.shieldType = shieldType;
    if (params.immuneControl) buffs.shieldImmuneControl = true;
    if (params.hotPct) { buffs.hotTurns = params.duration || 2; buffs.hotPct = params.hotPct; }
    addBattleLog('skill', '🛡️ ' + getPetDisplayName(caster) + ' 的血统技能附加护盾（吸收 ' + absorb + ' 伤害）');
  }
}

// ==================== 场地效果 ====================
function applyBloodlineFieldEffect(pet, params) {
  if (!liveBattle.fieldEffects) liveBattle.fieldEffects = [];
  var existing = liveBattle.fieldEffects.find(function(f) { return f.fieldType === params.fieldType && f.petId === pet.id; });
  if (existing) return; // 已存在不重复
  liveBattle.fieldEffects.push({
    fieldType: params.fieldType,
    petId: pet.id,
    duration: params.duration || 0,
    effects: params.effects || {},
  });
  addBattleLog('skill', '🌐 ' + getPetDisplayName(pet) + ' 的血统技能展开场地效果：' + params.fieldType);
}

// 每回合处理场地效果
function processFieldEffects() {
  if (!liveBattle || !liveBattle.fieldEffects || liveBattle.fieldEffects.length === 0) return;
  liveBattle.fieldEffects.forEach(function(field) {
    var eff = field.effects || {};
    // 对敌方触发状态
    if (eff.enemyChancePerTurn && eff.enemyStatus) {
      getAliveMonsterIndices().forEach(function(idx) {
        if (Math.random() < eff.enemyChancePerTurn) {
          var ms = liveBattle.monsterStatusArray[idx];
          if (ms) {
            var sMap = { freeze:'frozen', stun:'stunned', burn:'burning' };
            var fn = sMap[eff.enemyStatus] || eff.enemyStatus;
            ms[fn] = Math.max(ms[fn] || 0, eff.enemyStatusDuration || 1);
            addBattleLog('skill', '🌐 场地效果对敌人附加' + eff.enemyStatus);
          }
        }
      });
    }
    // 对敌方 DOT
    if (eff.dotToEnemy) {
      getAliveMonsterIndices().forEach(function(idx) {
        var dotDmg = Math.floor((liveBattle.monsterMaxHpArray[idx] || 0) * (eff.dotToEnemy.pct || 0.05));
        dealDamageToMonsterTarget(idx, dotDmg, eff.dotToEnemy.dmgType);
      });
    }
    // 持续时间递减
    if (field.duration > 0) {
      field.duration--;
    }
  });
  // 清理过期场地
  liveBattle.fieldEffects = liveBattle.fieldEffects.filter(function(f) { return f.duration !== 0; });
}

// ==================== 辅助计算函数 ====================
function calcBloodlineDamage(caster, target, params, ctx) {
  var powerAttr = params.powerAttr || 'atk';
  var dmgPct = params.dmgPct || 0.20;
  var power = 0;
  var stats = getPetStats(caster);

  if (powerAttr === 'atk') power = getPetAtkPower(caster, stats, getPassiveEffects(caster), getAuraEffects(liveBattle.team), liveBattle.petBuffs[caster.id], getBloodlineSkill(caster));
  else if (powerAttr === 'int') power = getPetSpiritPower(caster, stats, getPassiveEffects(caster), getAuraEffects(liveBattle.team), liveBattle.petBuffs[caster.id]);
  else if (powerAttr === 'def') power = stats.防御力;
  else if (powerAttr === 'spd') power = stats.速度;
  else if (powerAttr === 'lastHitDmg') power = ctx.damage || 0;
  else if (powerAttr === 'lastKillDmg') power = ctx.damage || 0;
  else power = stats.攻击力;

  var dmg = Math.floor(power * dmgPct);
  if (params.asTrue) return Math.max(1, dmg);
  // 减防
  if (target._monsterIdx != null) {
    var def = liveBattle.monsters[target._monsterIdx].def;
    dmg = Math.max(1, dmg - def * 0.3);
  }
  return Math.max(1, dmg);
}

function calcBloodlineHeal(caster, target, params, ctx) {
  var healPct = params.healPct || params.pct || 0.10;
  var base = params.base || 'maxHp';
  var baseVal = getBaseValueForTarget(target, base, ctx);
  var heal = Math.floor(baseVal * healPct);
  // 灵力加成
  if (base === 'int') {
    var spirit = getPetSpiritPower(caster, getPetStats(caster), getPassiveEffects(caster), getAuraEffects(liveBattle.team), liveBattle.petBuffs[caster.id]);
    heal += Math.floor(spirit * 0.5);
  }
  // 治疗加成
  var healBoostMult = 1;
  var blEff = getBloodlineSkill(caster);
  if (blEff && blEff.effects && blEff.effects.healBoost) healBoostMult += blEff.effects.healBoost;
  heal = Math.floor(heal * healBoostMult);
  // ctx 加成
  if (ctx.healMult) heal = Math.floor(heal * ctx.healMult);
  if (ctx.healBonus) heal += Math.floor(baseVal * ctx.healBonus);
  return heal;
}

function getBaseValueForTarget(target, base, ctx) {
  if (target._monsterIdx != null) {
    var idx = target._monsterIdx;
    if (base === 'maxHp') return liveBattle.monsterMaxHpArray[idx] || 0;
    if (base === 'currentHp') return liveBattle.monsterHpArray[idx] || 0;
    if (base === 'lostHp') return (liveBattle.monsterMaxHpArray[idx] || 0) - (liveBattle.monsterHpArray[idx] || 0);
    return liveBattle.monsterMaxHpArray[idx] || 0;
  }
  if (target.id) {
    var hp = liveBattle.petHp[target.id];
    if (!hp) return 0;
    if (base === 'maxHp') return hp.max;
    if (base === 'currentHp') return hp.current;
    if (base === 'lostHp') return hp.max - hp.current;
    if (base === 'atk') return getPetStats(target).攻击力;
    if (base === 'int') return getPetStats(target).灵力;
    if (base === 'healAmount') return ctx.healAmount || 0;
    if (base === 'lastHealAmount') return ctx.healAmount || 0;
    if (base === 'lastPoisonDamage') return ctx.poisonDamage || 0;
    return hp.max;
  }
  return 0;
}

function evalDynamicBonus(pet, params, ctx) {
  var formula = params.formula;
  var max = params.max || 1.0;
  var result = 0;

  // 简化公式解析
  if (formula.indexOf('hpPct') >= 0 || formula.indexOf('1-hpPct') >= 0) {
    var hp = liveBattle.petHp[pet.id];
    var hpPct = hp ? hp.current / hp.max : 1;
    if (formula.indexOf('floor') >= 0) {
      result = evalDynamicFormula(formula, { hpPct: hpPct });
    } else {
      result = (1 - hpPct) * 0.15;
    }
  } else if (formula.indexOf('targetPoisonStack') >= 0) {
    var tgtSt = ctx.target ? liveBattle.petStatus[ctx.target.id] : (ctx.targetIdx != null ? liveBattle.monsterStatusArray[ctx.targetIdx] : null);
    result = (tgtSt && tgtSt.poisonStacks || 0) * 0.10;
  } else if (formula.indexOf('frostbiteLikeDebuffCount') >= 0) {
    var st2 = liveBattle.petStatus[pet.id];
    var count = 0;
    if (st2) { if (st2.frostbite > 0) count++; if (st2.spdReduced > 0) count++; if (st2.frozen > 0) count++; if (st2.wingFreeze > 0) count++; }
    result = count * 0.05;
  } else if (formula.indexOf('allyAntCount') >= 0 || formula.indexOf('allyWolfCount') >= 0) {
    result = Math.max(0, liveBattle.team.length - 1) * 0.05;
  } else if (formula.indexOf('turnOrderDelay') >= 0) {
    result = 0.03 * (liveBattle.turnQueue ? liveBattle.turnQueue.length : 0);
  } else if (formula.indexOf('statDiffOverPct') >= 0) {
    result = 0; // 简化
  } else if (formula.indexOf('spdPct') >= 0) {
    var stats = getPetStats(pet);
    result = (stats.速度 || 10) * 0.001;
  } else if (formula.indexOf('selfSpdPct') >= 0) {
    result = 0.05;
  }

  return Math.min(result, max);
}

function evalDynamicFormula(formula, vars) {
  // 安全的简化公式求值
  try {
    if (formula.indexOf('floor((1-hpPct)/0.10)') >= 0) {
      var hpPct = vars.hpPct != null ? vars.hpPct : 1;
      return Math.floor((1 - hpPct) / 0.10);
    }
    if (formula.indexOf('0.05*floor((1-hpPct)/0.10)') >= 0) {
      var hpPct2 = vars.hpPct != null ? vars.hpPct : 1;
      return 0.05 * Math.floor((1 - hpPct2) / 0.10);
    }
    if (formula.indexOf('0.15+0.20*(1-hpPct)') >= 0) {
      var hpPct3 = vars.hpPct != null ? vars.hpPct : 1;
      return 0.15 + 0.20 * (1 - hpPct3);
    }
    if (formula.indexOf('0.03*floor((1-hpPct)/0.10)') >= 0) {
      var hpPct4 = vars.hpPct != null ? vars.hpPct : 1;
      return 0.03 * Math.floor((1 - hpPct4) / 0.10);
    }
    return 0;
  } catch (e) { return 0; }
}

// ==================== 清除负面状态辅助 ====================
function clearAllPetDebuffs(pet) {
  var st = liveBattle.petStatus[pet.id];
  if (!st) return;
  st.frozen = 0; st.stunned = 0; st.silenced = 0; st.rooted = 0; st.sleeping = 0;
  st.poisoned = 0; st.poisonPct = 0; st.burning = 0; st.burnPct = 0;
  st.confused = 0; st.corroded = 0; st.petrified = 0; st.soulBurn = 0;
}

function clearPetDebuffs(pet, type, maxCount) {
  var st = liveBattle.petStatus[pet.id];
  if (!st) return 0;
  var removed = 0;
  if (type === 'all' || type === 'control') {
    if (st.frozen > 0) { st.frozen = 0; removed++; if (removed >= maxCount) return removed; }
    if (st.stunned > 0) { st.stunned = 0; removed++; if (removed >= maxCount) return removed; }
    if (st.silenced > 0) { st.silenced = 0; removed++; if (removed >= maxCount) return removed; }
    if (st.rooted > 0) { st.rooted = 0; removed++; if (removed >= maxCount) return removed; }
    if (st.sleeping > 0) { st.sleeping = 0; removed++; if (removed >= maxCount) return removed; }
    if (st.confused > 0) { st.confused = 0; removed++; if (removed >= maxCount) return removed; }
  }
  if (type === 'all' || type === 'poison') {
    if (st.poisoned > 0) { st.poisoned = 0; st.poisonPct = 0; removed++; if (removed >= maxCount) return removed; }
  }
  if (type === 'all') {
    if (st.burning > 0) { st.burning = 0; st.burnPct = 0; removed++; if (removed >= maxCount) return removed; }
    if (st.corroded > 0) { st.corroded = 0; removed++; if (removed >= maxCount) return removed; }
  }
  return removed;
}

// ==================== 获取下次攻击修改器（在攻击前消费） ====================
function consumeNextAttackMods(pet) {
  if (!pet._nextAttackMods || pet._nextAttackMods.length === 0) return null;
  var mods = pet._nextAttackMods;
  pet._nextAttackMods = [];
  var result = { dmgPct: 0, ignoreDef: 0, critRate: 0, forceCrit: false };
  mods.forEach(function(m) {
    if (m.stat === 'dmgPct') result.dmgPct += m.value;
    if (m.extraStats && m.extraStats.ignoreDef) result.ignoreDef += m.extraStats.ignoreDef;
    if (m.stat === 'critRate') result.critRate += m.value;
  });
  return result;
}

// 消费当前攻击临时加成
function consumeCurrentAttackBonuses(pet) {
  if (!pet._currentAttackBonuses) return null;
  var bonuses = pet._currentAttackBonuses;
  pet._currentAttackBonuses = null;
  return bonuses;
}

// ==================== 战斗结束清理 ====================
// 清理所有宠物的血统运行时数据（冷却、触发次数、存储伤害等）
function cleanupBloodlineRT() {
  if (!liveBattle || !liveBattle.team) return;
  liveBattle.team.forEach(function(pet) {
    if (!pet) return;
    delete pet._bloodlineRT;
    delete pet._currentAttackBonuses;
    delete pet._nextAttackMods;
    delete pet._permanentBonuses;
  });
}
