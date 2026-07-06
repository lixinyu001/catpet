// ===== config.js : 常量、地图、副本、技能库等数据定义 =====

// ==================== GAME DATA ====================
// 需求12：图鉴库系统架构说明
// 本文件是游戏的核心数据图鉴库，所有宠物/怪物/技能数据均集中管理于此：
//   1. PET_DEX (宠物图鉴)：所有宠物的种族/资质/成长/专长/天生技能，getPetDex(name) 统一查询
//   2. SKILL_LIBRARY (技能库)：所有主动/被动/光环/血统技能，getSkillById(id) 统一查询
//   3. MONSTER_RACE_SKILLS (怪物技能池)：按种族配置怪物技能 id，引用技能库
//   4. MAP_BOSSES (地图Boss配置)：Boss技能/被动/buff，技能 id 引用技能库
// 修改数据只需改这里，其他文件（battle.js/pet.js/ui.js/economy.js）会自动同步

const RACES = ['史莱姆', '龙', '恶魔', '天使', '哥布林', '精灵'];
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'special'];
const RARITY_NAMES = ['普通', '优秀', '稀有', '史诗', '传说', '神话', '异化'];
const RARITY_COLORS = ['#9ca3af', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899'];
const ATTRIBUTES = ['力量', '体质', '敏捷', '智力'];
const DERIVED_ATTRS = ['气血', '法力'];
// 资质系统：每项属性对应一个资质值(1000-3000)，影响属性成长
const APTITUDE_KEYS = ['力量资质', '体质资质', '敏捷资质', '智力资质'];

const PET_NAMES = [
  '小火焰', '冰晶兽', '暗影狼', '雷霆鹰', '翡翠蛇', '岩石巨人', '风暴龙', '月光狐',
  '深渊鱼', '烈焰凤凰', '霜冻巨人', '幽灵猫', '黄金甲虫', '星辰鹿', '毒液蜘蛛', '钢铁犀牛',
  '幻影蝶', '熔岩龟', '飓风雕', '水晶龙', '暗夜蝙蝠', '森林守护者', '雷电麒麟', '冰霜女巫',
  '火焰魔像', '深海巨兽', '天空之翼', '大地之灵', '时空行者', '混沌之眼', '圣光天使', '暗黑恶魔',
  '翡翠巨龙', '紫电貂', '金刚猿', '九尾灵狐', '三头地狱犬', '独角天马', '美杜莎', '牛头人酋长',
  '鹰身女妖', '石像鬼', '吸血鬼伯爵', '狼人战士', '精灵射手', '矮人铁匠', '哥布林盗贼', '史莱姆王',
  '冰霜巨龙', '火焰领主', '风暴之神', '大地泰坦', '海洋霸主', '天空霸主', '混沌魔龙', '创世神龙',
  '小史莱姆', '绿毛虫', '野鼠', '小精灵', '雏鹰', '小恶魔', '幼龙', '蘑菇人',
  '麻雀', '青蛙', '蝙蝠崽', '小地精', '萤火虫', '刺猬', '蜗牛', '小树精',
  '蝌蚪', '小龙崽', '小骷髅', '灰尘怪', '花仙子', '小石怪', '风精灵', '小幽灵',
  '青苔蛇', '野猪', '泥潭怪', '铜甲蟹', '霜精灵', '幼狼', '火蜥蜴', '黑鸦',
  '小恶魔犬', '苔藓巨人', '夜光蛾', '铁甲蚁', '影狐', '岩蜥蜴', '霜狼', '光之子',
  '腐尸虫', '碧眼猫', '沙蝎', '烈风雕', '寒冰蝶', '雷豹', '玄冰麒麟', '魔神之影',
  '圣光龙神', '永恒天使', '虚空主宰', '万物之母',
  // ===== 扩展宠物名（100 个，T1~T5） =====
  '草蜢', '泥巴怪', '小蜥蜴', '落叶虫', '微光蝶', '小田鼠', '嫩芽精', '水母崽',
  '灰羽雀', '小跳蛛', '苔藓鼠', '小孢子', '风信子', '小石子', '露珠精', '萌新史莱姆',
  '稻草人', '小野鸭', '飘浮气泡', '弱小龙', '林间鹿', '花斑豹', '赤尾狐', '青铜蟹',
  '丛林狼', '月牙兔', '锈甲虫', '雪雏', '岩鸽', '暮色鸦', '苔甲蜥', '幼麒麟',
  '翡翠蛙', '流火蜥', '寒霜鼠', '晨曦鹿', '巨角羊', '紫羽鸽', '暗影貂', '银背猿',
  '烈日甲虫', '蓝鳉鱼', '灰岩龟', '啼鸣鸟', '朱砂蝶', '银鳞龙', '烬羽鸟', '玄铁犀',
  '翠风狼', '紫电隼', '落日虎', '蓝月狐', '烈焰犬', '碎石龟', '寒林鹿', '翔云马',
  '雷羽雀', '血藤蛇', '沙暴蝎', '星纹豹', '月华蝶', '赤焰马', '青木猿', '玄冰蛇',
  '幻影鸦', '黄昏狮', '焦土龟', '银光鹿', '霜羽雕', '紫晶蝶', '烈焰龙骑', '寒冰女王',
  '雷霆战狼', '圣光审判', '暗影刺客', '翡翠守护', '风暴巨雕', '玄铁巨兽', '烈日战神', '幽冥蛇君',
  '紫电战虎', '苍穹龙', '焚天魔', '冰封王', '圣辉麒麟', '暗夜君王', '千年古树', '雷陨巨猿',
  '烈风隼王', '玄冥蛟', '远古龙神', '创世天使', '虚空魔神', '太初神兽', '万古灵尊', '灭世魔龙',
  '永夜主宰', '圣渊天马', '混沌麒麟', '乾坤龙尊'
];

// ==================== 宠物图鉴 (PET_DEX) ====================
// 每种宠物的资质上下限、成长范围、特色、天生技能池、随机技能池
// 参考《梦幻西游》的宠物种类特色：擅长物理/法术/防御/敏捷等
// aptRange: [下限, 上限] 资质范围(1000-3000)
// growthRange: [成长下限, 成长上限]
// specialty: 'physical'(物理) / 'magic'(法术) / 'defense'(防御) / 'speed'(敏捷) / 'balanced'(均衡)
const PET_DEX = {
  '小火焰': { race:'龙', aptRange:{力量资质:[1400,2000],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1200,1600]}, growthRange:[1.0,2.0], specialty:'physical', innateSkills:['flame_strike','power_up'], desc:'擅长物理攻击的火系幼龙' },
  '冰晶兽': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1600,2200],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[0.8,1.6], specialty:'defense', innateSkills:['iron_wall','def_up'], desc:'防御出色的冰系生物' },
  '暗影狼': { race:'哥布林', aptRange:{力量资质:[1300,1800],体质资质:[900,1300],敏捷资质:[1600,2200],智力资质:[1000,1400]}, growthRange:[1.2,2.2], specialty:'speed', innateSkills:['sneak_atk','speed_up'], desc:'敏捷极高的暗影猎手' },
  '雷霆鹰': { race:'天使', aptRange:{力量资质:[1200,1700],体质资质:[900,1300],敏捷资质:[1500,2000],智力资质:[1100,1500]}, growthRange:[1.1,2.0], specialty:'speed', innateSkills:['thunder_strike','stun_strike'], desc:'速度飞快的雷霆猛禽' },
  '翡翠蛇': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1400,1900],智力资质:[1200,1600]}, growthRange:[1.0,1.8], specialty:'speed', innateSkills:['poison_fang','dodge'], desc:'灵活的毒系蛇类' },
  '岩石巨人': { race:'史莱姆', aptRange:{力量资质:[1400,1900],体质资质:[1800,2400],敏捷资质:[600,1000],智力资质:[800,1200]}, growthRange:[0.9,1.7], specialty:'defense', innateSkills:['iron_wall','parry'], desc:'坚不可摧的岩石守卫' },
  '风暴龙': { race:'龙', aptRange:{力量资质:[1500,2100],体质资质:[1200,1600],敏捷资质:[1300,1700],智力资质:[1400,1800]}, growthRange:[1.3,2.3], specialty:'physical', innateSkills:['thunder_strike','armor_break'], desc:'掌控风暴的巨龙' },
  '月光狐': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1500,2000],智力资质:[1400,1900]}, growthRange:[1.2,2.1], specialty:'magic', innateSkills:['cure','magic_heart'], desc:'擅长治疗的月光精灵' },
  '深渊鱼': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1000,1400],智力资质:[1500,2000]}, growthRange:[1.0,1.9], specialty:'magic', innateSkills:['shadow_strike','magic_double'], desc:'深渊中的法术使者' },
  '烈焰凤凰': { race:'龙', aptRange:{力量资质:[1600,2200],体质资质:[1300,1700],敏捷资质:[1400,1800],智力资质:[1500,2000]}, growthRange:[1.5,2.5], specialty:'physical', innateSkills:['flame_strike','fatal_blow','revive'], desc:'浴火重生的神鸟' },
  '霜冻巨人': { race:'史莱姆', aptRange:{力量资质:[1500,2000],体质资质:[2000,2600],敏捷资质:[700,1100],智力资质:[1000,1400]}, growthRange:[1.2,2.0], specialty:'defense', innateSkills:['iron_wall','freeze'], desc:'冰封万里的巨人' },
  '幽灵猫': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1800,2400],智力资质:[1300,1700]}, growthRange:[1.3,2.3], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'来去无踪的幽灵' },
  '黄金甲虫': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1700,2300],敏捷资质:[900,1300],智力资质:[1000,1400]}, growthRange:[1.0,1.8], specialty:'defense', innateSkills:['guard_shield','def_up'], desc:'金甲护身的甲虫' },
  '星辰鹿': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1100,1500],敏捷资质:[1300,1700],智力资质:[1600,2200]}, growthRange:[1.3,2.3], specialty:'magic', innateSkills:['holy_light','magic_heart'], desc:'蕴含星辰之力的神鹿' },
  '毒液蜘蛛': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1500,2000],智力资质:[1300,1700]}, growthRange:[1.1,2.0], specialty:'speed', innateSkills:['poison_fang','poison_mist'], desc:'剧毒的织网者' },
  '钢铁犀牛': { race:'史莱姆', aptRange:{力量资质:[1700,2300],体质资质:[1900,2500],敏捷资质:[600,1000],智力资质:[800,1200]}, growthRange:[1.0,1.8], specialty:'defense', innateSkills:['iron_wall','armor_break'], desc:'冲锋陷阵的铁甲兽' },
  '幻影蝶': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[800,1200],敏捷资质:[1600,2200],智力资质:[1500,2000]}, growthRange:[1.2,2.2], specialty:'magic', innateSkills:['poison_mist','magic_double'], desc:'制造幻象的法术蝶' },
  '熔岩龟': { race:'史莱姆', aptRange:{力量资质:[1300,1800],体质资质:[2000,2600],敏捷资质:[700,1100],智力资质:[1100,1500]}, growthRange:[1.0,1.9], specialty:'defense', innateSkills:['iron_wall','flame_strike'], desc:'熔岩护体的巨龟' },
  '飓风雕': { race:'天使', aptRange:{力量资质:[1200,1600],体质资质:[900,1300],敏捷资质:[1800,2400],智力资质:[1100,1500]}, growthRange:[1.3,2.3], specialty:'speed', innateSkills:['haste','stun_strike'], desc:'驾驭飓风的猛禽' },
  '水晶龙': { race:'龙', aptRange:{力量资质:[1400,1900],体质资质:[1300,1700],敏捷资质:[1200,1600],智力资质:[1500,2100]}, growthRange:[1.3,2.3], specialty:'magic', innateSkills:['ice_arrow','magic_heart'], desc:'水晶之力的法术龙' },
  '暗夜蝙蝠': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1700,2300],智力资质:[1300,1700]}, growthRange:[1.1,2.0], specialty:'speed', innateSkills:['sneak_atk','blood_drain'], desc:'黑夜中的声波猎手' },
  '森林守护者': { race:'精灵', aptRange:{力量资质:[1200,1600],体质资质:[1500,2000],敏捷资质:[1100,1500],智力资质:[1600,2200]}, growthRange:[1.4,2.4], specialty:'magic', innateSkills:['life_bloom','heal_wind','aura_hp'], desc:'森林的守护神灵' },
  '雷电麒麟': { race:'龙', aptRange:{力量资质:[1600,2200],体质资质:[1400,1800],敏捷资质:[1500,2000],智力资质:[1400,1800]}, growthRange:[1.5,2.5], specialty:'physical', innateSkills:['thunder_strike','fatal_blow','aura_atk'], desc:'雷电缠绕的神兽' },
  '冰霜女巫': { race:'恶魔', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1200,1600],智力资质:[1900,2500]}, growthRange:[1.4,2.4], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'掌控冰霜的法术大师' },
  '火焰魔像': { race:'史莱姆', aptRange:{力量资质:[1700,2300],体质资质:[1800,2400],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[1.2,2.0], specialty:'defense', innateSkills:['iron_wall','flame_strike'], desc:'烈焰铸就的魔像' },
  '深海巨兽': { race:'史莱姆', aptRange:{力量资质:[1800,2400],体质资质:[2000,2600],敏捷资质:[700,1100],智力资质:[1000,1400]}, growthRange:[1.3,2.1], specialty:'defense', innateSkills:['iron_wall','guard_shield'], desc:'深海的恐怖巨兽' },
  '天空之翼': { race:'天使', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1900,2500],智力资质:[1200,1600]}, growthRange:[1.4,2.4], specialty:'speed', innateSkills:['haste','stun_strike','aura_spd'], desc:'天空的霸主' },
  '大地之灵': { race:'史莱姆', aptRange:{力量资质:[1400,1900],体质资质:[1800,2400],敏捷资质:[1000,1400],智力资质:[1300,1700]}, growthRange:[1.3,2.2], specialty:'defense', innateSkills:['iron_wall','guard_shield'], desc:'大地之力的化身' },
  '时空行者': { race:'天使', aptRange:{力量资质:[1200,1600],体质资质:[1100,1500],敏捷资质:[1600,2200],智力资质:[1700,2300]}, growthRange:[1.5,2.5], specialty:'magic', innateSkills:['freeze','magic_double_2','aura_spd'], desc:'操控时空的旅者' },
  '混沌之眼': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1300,1700],智力资质:[2000,2600]}, growthRange:[1.6,2.6], specialty:'magic', innateSkills:['doom_judge','meteor','magic_heart_2'], desc:'混沌本源的注视' },
  '圣光天使': { race:'天使', aptRange:{力量资质:[1300,1700],体质资质:[1400,1800],敏捷资质:[1300,1700],智力资质:[1800,2400]}, growthRange:[1.6,2.6], specialty:'magic', innateSkills:['holy_radiance','holy_light','blessing'], desc:'圣光降临的天使' },
  '暗黑恶魔': { race:'恶魔', aptRange:{力量资质:[1800,2400],体质资质:[1500,1900],敏捷资质:[1400,1800],智力资质:[1500,1900]}, growthRange:[1.6,2.6], specialty:'physical', innateSkills:['shadow_strike','fatal_blow','vampire_2'], desc:'黑暗深渊的恶魔' },
  '翡翠巨龙': { race:'龙', aptRange:{力量资质:[1700,2300],体质资质:[1500,1900],敏捷资质:[1400,1800],智力资质:[1600,2100]}, growthRange:[1.7,2.7], specialty:'physical', innateSkills:['double_slash','fatal_blow','aura_atk_2'], desc:'翡翠之力的远古巨龙' },
  '紫电貂': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1900,2500],智力资质:[1400,1800]}, growthRange:[1.5,2.5], specialty:'speed', innateSkills:['thunder_strike','dodge_2','aura_spd'], desc:'迅如闪电的紫貂' },
  '金刚猿': { race:'哥布林', aptRange:{力量资质:[2000,2600],体质资质:[1700,2200],敏捷资质:[1000,1400],智力资质:[900,1300]}, growthRange:[1.5,2.4], specialty:'physical', innateSkills:['double_slash','armor_break','power_up_2'], desc:'力大无穷的巨猿' },
  '九尾灵狐': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[1100,1500],敏捷资质:[1500,2000],智力资质:[1900,2500]}, growthRange:[1.7,2.7], specialty:'magic', innateSkills:['flame_storm','magic_double_2','aura_crit'], desc:'九尾天狐的法术化身' },
  '三头地狱犬': { race:'恶魔', aptRange:{力量资质:[1900,2500],体质资质:[1600,2100],敏捷资质:[1300,1700],智力资质:[1200,1600]}, growthRange:[1.6,2.6], specialty:'physical', innateSkills:['flame_strike','blood_drain','berserk'], desc:'地狱的三头猛犬' },
  '独角天马': { race:'天使', aptRange:{力量资质:[1500,2000],体质资质:[1300,1700],敏捷资质:[1700,2300],智力资质:[1500,1900]}, growthRange:[1.7,2.7], specialty:'speed', innateSkills:['haste','holy_light','aura_spd_2'], desc:'圣洁的独角天马' },
  '美杜莎': { race:'恶魔', aptRange:{力量资质:[1200,1600],体质资质:[1100,1500],敏捷资质:[1400,1800],智力资质:[1800,2400]}, growthRange:[1.6,2.6], specialty:'magic', innateSkills:['freeze','poison_mist','magic_heart_2'], desc:'石化之眼的诅咒者' },
  '牛头人酋长': { race:'哥布林', aptRange:{力量资质:[2100,2700],体质资质:[1900,2400],敏捷资质:[800,1200],智力资质:[900,1300]}, growthRange:[1.5,2.4], specialty:'physical', innateSkills:['armor_break','double_slash','power_up_2'], desc:'蛮力无双的牛头人' },
  '鹰身女妖': { race:'天使', aptRange:{力量资质:[1300,1700],体质资质:[900,1300],敏捷资质:[1800,2400],智力资质:[1200,1600]}, growthRange:[1.4,2.4], specialty:'speed', innateSkills:['stun_strike','dodge_2','aura_spd'], desc:'疾风的鹰身女妖' },
  '石像鬼': { race:'史莱姆', aptRange:{力量资质:[1500,2000],体质资质:[2100,2700],敏捷资质:[600,1000],智力资质:[900,1300]}, growthRange:[1.2,2.0], specialty:'defense', innateSkills:['iron_wall','parry'], desc:'石化之躯的守卫' },
  '吸血鬼伯爵': { race:'恶魔', aptRange:{力量资质:[1600,2100],体质资质:[1300,1700],敏捷资质:[1500,2000],智力资质:[1500,1900]}, growthRange:[1.6,2.6], specialty:'physical', innateSkills:['blood_drain','vampire_2','fatal_blow'], desc:'吸血的暗夜贵族' },
  '狼人战士': { race:'哥布林', aptRange:{力量资质:[1800,2400],体质资质:[1500,1900],敏捷资质:[1400,1800],智力资质:[1000,1400]}, growthRange:[1.5,2.4], specialty:'physical', innateSkills:['berserk','double_slash','crit_strike_2'], desc:'月圆之夜的狂战士' },
  '精灵射手': { race:'精灵', aptRange:{力量资质:[1400,1800],体质资质:[1000,1400],敏捷资质:[1800,2400],智力资质:[1300,1700]}, growthRange:[1.5,2.5], specialty:'speed', innateSkills:['fatal_blow','sneak_atk_2','dodge_2'], desc:'百步穿杨的射手' },
  '矮人铁匠': { race:'哥布林', aptRange:{力量资质:[1700,2200],体质资质:[1800,2300],敏捷资质:[900,1300],智力资质:[1200,1600]}, growthRange:[1.3,2.2], specialty:'defense', innateSkills:['iron_wall','guard_shield','def_up'], desc:'锻造大师矮人' },
  '哥布林盗贼': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1900,2500],智力资质:[1200,1600]}, growthRange:[1.4,2.4], specialty:'speed', innateSkills:['sneak_atk_2','dodge_2','speed_up_2'], desc:'神出鬼没的盗贼' },
  '史莱姆王': { race:'史莱姆', aptRange:{力量资质:[1600,2100],体质资质:[2200,2800],敏捷资质:[800,1200],智力资质:[1200,1600]}, growthRange:[1.5,2.4], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp_2'], desc:'史莱姆的王者' },
  '冰霜巨龙': { race:'龙', aptRange:{力量资质:[1800,2400],体质资质:[1600,2000],敏捷资质:[1400,1800],智力资质:[1700,2200]}, growthRange:[1.8,2.8], specialty:'physical', innateSkills:['ice_arrow','fatal_blow','freeze'], desc:'冰封万里的远古巨龙' },
  '火焰领主': { race:'恶魔', aptRange:{力量资质:[1900,2500],体质资质:[1700,2100],敏捷资质:[1300,1700],智力资质:[1800,2300]}, growthRange:[1.8,2.8], specialty:'physical', innateSkills:['meteor','flame_strike','berserk'], desc:'烈焰的统治者' },
  '风暴之神': { race:'天使', aptRange:{力量资质:[1600,2100],体质资质:[1400,1800],敏捷资质:[1900,2500],智力资质:[1700,2200]}, growthRange:[1.9,2.9], specialty:'speed', innateSkills:['thunder_strike','stun_strike','aura_spd_3'], desc:'掌管风暴的神祇' },
  '大地泰坦': { race:'史莱姆', aptRange:{力量资质:[2000,2600],体质资质:[2400,3000],敏捷资质:[700,1100],智力资质:[1100,1500]}, growthRange:[1.7,2.6], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp_2'], desc:'大地的终极化身' },
  '海洋霸主': { race:'史莱姆', aptRange:{力量资质:[2000,2600],体质资质:[2200,2800],敏捷资质:[1000,1400],智力资质:[1400,1800]}, growthRange:[1.8,2.7], specialty:'physical', innateSkills:['double_slash','armor_break','power_up_2'], desc:'深海的无上霸主' },
  '天空霸主': { race:'天使', aptRange:{力量资质:[1800,2400],体质资质:[1500,1900],敏捷资质:[2000,2600],智力资质:[1600,2000]}, growthRange:[1.9,2.9], specialty:'speed', innateSkills:['haste','stun_strike','aura_spd_3'], desc:'天空的至高存在' },
  '混沌魔龙': { race:'龙', aptRange:{力量资质:[2100,2700],体质资质:[1900,2300],敏捷资质:[1700,2100],智力资质:[2000,2600]}, growthRange:[2.0,3.0], specialty:'physical', innateSkills:['doom_judge','fatal_blow','aura_atk_3'], desc:'混沌本源的魔龙' },
  '创世神龙': { race:'龙', aptRange:{力量资质:[2300,2900],体质资质:[2200,2800],敏捷资质:[2000,2600],智力资质:[2200,2800]}, growthRange:[2.2,3.2], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'创世之力的神龙' },
  '小史莱姆': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:['blessing'], desc:'最普通的初级史莱姆' },
  '绿毛虫': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'physical', innateSkills:['double_slash'], desc:'啃食树叶的毛毛虫' },
  '野鼠': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],智力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'speed', innateSkills:[], desc:'四处流窜的野鼠' },
  '小精灵': { race:'精灵', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['cure'], desc:'初出茅庐的小精灵' },
  '雏鹰': { race:'天使', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],智力资质:[1000,1400]}, growthRange:[0.6,1.3], specialty:'speed', innateSkills:['dodge'], desc:'羽翼未丰的雏鹰' },
  '小恶魔': { race:'恶魔', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['shadow_strike'], desc:'调皮捣蛋的小恶魔' },
  '幼龙': { race:'龙', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[900,1300]}, growthRange:[0.8,1.3], specialty:'physical', innateSkills:['flame_strike'], desc:'刚破壳的幼龙' },
  '蘑菇人': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1400,1800],敏捷资质:[700,1100],智力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'defense', innateSkills:['def_up'], desc:'潮湿处的蘑菇小人' },
  '麻雀': { race:'天使', aptRange:{力量资质:[900,1300],体质资质:[800,1200],敏捷资质:[1300,1700],智力资质:[900,1300]}, growthRange:[0.6,1.2], specialty:'speed', innateSkills:[], desc:'成群结队的小鸟' },
  '青蛙': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:[], desc:'池塘边的青蛙' },
  '蝙蝠崽': { race:'恶魔', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],智力资质:[1000,1400]}, growthRange:[0.7,1.3], specialty:'speed', innateSkills:['sneak_atk'], desc:'洞穴中的小蝙蝠' },
  '小地精': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:[], desc:'矮小机灵的地精' },
  '萤火虫': { race:'精灵', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['magic_heart'], desc:'夜空中闪烁的精灵' },
  '刺猬': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[1400,1800],敏捷资质:[700,1100],智力资质:[900,1300]}, growthRange:[0.6,1.2], specialty:'defense', innateSkills:['parry'], desc:'浑身尖刺的小兽' },
  '蜗牛': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[1400,1800],敏捷资质:[600,1000],智力资质:[900,1300]}, growthRange:[0.5,1.1], specialty:'defense', innateSkills:[], desc:'缓慢爬行的蜗牛' },
  '小树精': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.7,1.3], specialty:'balanced', innateSkills:['regen'], desc:'林间的小树精' },
  '蝌蚪': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.5,1.1], specialty:'balanced', innateSkills:[], desc:'水中的小蝌蚪' },
  '小龙崽': { race:'龙', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[900,1300]}, growthRange:[0.8,1.3], specialty:'physical', innateSkills:['power_up'], desc:'蹒跚学步的龙崽' },
  '小骷髅': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[800,1200],敏捷资质:[1000,1400],智力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'physical', innateSkills:['armor_break'], desc:'墓地游荡的小骷髅' },
  '灰尘怪': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:[], desc:'角落里的灰尘怪' },
  '花仙子': { race:'精灵', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['life_bloom'], desc:'花丛中的小仙子' },
  '小石怪': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1400,1800],敏捷资质:[700,1100],智力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'defense', innateSkills:['guard_shield'], desc:'碎石堆成的小怪' },
  '风精灵': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],智力资质:[1000,1400]}, growthRange:[0.7,1.3], specialty:'speed', innateSkills:['haste'], desc:'随风飘荡的精灵' },
  '小幽灵': { race:'恶魔', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['shadow_strike'], desc:'飘忽不定的小幽灵' },
  '青苔蛇': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],智力资质:[1100,1500]}, growthRange:[1.0,1.5], specialty:'speed', innateSkills:['poison_fang','dodge'], desc:'潮湿处的青苔蛇' },
  '野猪': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'physical', innateSkills:[], desc:'横冲直撞的野猪' },
  '泥潭怪': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:[], desc:'沼泽中的泥潭怪' },
  '铜甲蟹': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'defense', innateSkills:[], desc:'铜壳护身的螃蟹' },
  '霜精灵': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1400,1800]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['ice_arrow','magic_heart'], desc:'寒霜凝聚的精灵' },
  '幼狼': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk','speed_up'], desc:'初露獠牙的幼狼' },
  '火蜥蜴': { race:'龙', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['flame_strike','blood_drain'], desc:'岩浆旁的火蜥蜴' },
  '黑鸦': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:[], desc:'不祥的黑鸦' },
  '小恶魔犬': { race:'恶魔', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1000,1400]}, growthRange:[1.1,1.7], specialty:'physical', innateSkills:['shadow_strike','berserk'], desc:'地狱犬的幼崽' },
  '苔藓巨人': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1700,2100],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'defense', innateSkills:['iron_wall','regen'], desc:'苔藓覆盖的巨人' },
  '夜光蛾': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[1100,1500],智力资质:[1400,1800]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['poison_mist','magic_double'], desc:'夜光闪烁的飞蛾' },
  '铁甲蚁': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'defense', innateSkills:[], desc:'铁甲护身的蚂蚁' },
  '影狐': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],智力资质:[1100,1500]}, growthRange:[1.1,1.7], specialty:'speed', innateSkills:['sneak_atk','crit_strike'], desc:'林间穿梭的影狐' },
  '岩蜥蜴': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'defense', innateSkills:[], desc:'岩石间穿行的蜥蜴' },
  '霜狼': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1000,1400]}, growthRange:[1.1,1.7], specialty:'physical', innateSkills:['ice_arrow','power_up'], desc:'冰原上的霜狼' },
  '光之子': { race:'天使', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1400,1800]}, growthRange:[1.0,1.7], specialty:'magic', innateSkills:['holy_light','cure'], desc:'圣光眷顾的孩子' },
  '腐尸虫': { race:'恶魔', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],智力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'physical', innateSkills:[], desc:'腐肉滋生的毒虫' },
  '碧眼猫': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],智力资质:[1100,1500]}, growthRange:[1.1,1.7], specialty:'speed', innateSkills:['dodge','speed_up'], desc:'碧绿双眸的灵猫' },
  '沙蝎': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'defense', innateSkills:[], desc:'沙漠中的毒蝎' },
  '烈风雕': { race:'天使', aptRange:{力量资质:[1200,1600],体质资质:[900,1300],敏捷资质:[1800,2300],智力资质:[1100,1500]}, growthRange:[1.3,2.0], specialty:'speed', innateSkills:['haste','stun_strike','dodge'], desc:'烈风中的猛雕' },
  '寒冰蝶': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[800,1200],敏捷资质:[1600,2100],智力资质:[1500,2000]}, growthRange:[1.2,2.0], specialty:'magic', innateSkills:['ice_arrow','freeze','magic_heart'], desc:'寒冰凝聚的灵蝶' },
  '雷豹': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1800,2300],智力资质:[1200,1600]}, growthRange:[1.3,2.1], specialty:'speed', innateSkills:['thunder_strike','crit_strike','speed_up'], desc:'雷电缠绕的猎豹' },
  '玄冰麒麟': { race:'龙', aptRange:{力量资质:[1500,2000],体质资质:[1400,1800],敏捷资质:[1300,1700],智力资质:[1700,2300]}, growthRange:[1.7,2.5], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'玄冰之力的神兽' },
  '魔神之影': { race:'恶魔', aptRange:{力量资质:[2200,2800],体质资质:[1900,2300],敏捷资质:[1700,2100],智力资质:[1800,2200]}, growthRange:[2.0,2.9], specialty:'physical', innateSkills:['doom_judge','fatal_blow','aura_atk_3'], desc:'灭世魔神的残影，仍具备强大的力量' },
  '圣光龙神': { race:'龙', aptRange:{力量资质:[2000,2600],体质资质:[2000,2600],敏捷资质:[1900,2400],智力资质:[2200,2800]}, growthRange:[2.1,3.0], specialty:'magic', innateSkills:['holy_radiance','meteor','aura_hp_3'], desc:'圣光龙族之神' },
  '永恒天使': { race:'天使', aptRange:{力量资质:[1900,2500],体质资质:[2000,2600],敏捷资质:[1900,2400],智力资质:[2100,2700]}, growthRange:[2.0,2.9], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_def_3'], desc:'永恒不灭的天使' },
  '虚空主宰': { race:'恶魔', aptRange:{力量资质:[1800,2300],体质资质:[1900,2400],敏捷资质:[1800,2300],智力资质:[2300,2900]}, growthRange:[2.1,3.0], specialty:'magic', innateSkills:['doom_judge','meteor','magic_double_3'], desc:'虚空的主宰者' },
  '万物之母': { race:'精灵', aptRange:{力量资质:[1900,2400],体质资质:[2100,2700],敏捷资质:[1900,2400],智力资质:[2200,2800]}, growthRange:[2.1,3.0], specialty:'magic', innateSkills:['life_bloom','heal_wind','aura_regen_3'], desc:'孕育万物的母神' },
  // ===== 融合限定特殊宠物（仅融合极低概率出现，不在普通宠物名表中） =====
  '混元圣兽': { race:'龙', aptRange:{力量资质:[2500,3000],体质资质:[2500,3000],敏捷资质:[2200,2800],智力资质:[2300,2900]}, growthRange:[2.5,3.5], specialty:'balanced', innateSkills:['chaos_strike','holy_radiance','blessing'], desc:'【融合限定】混元本源的圣兽，掌握混元一击之力', fusionOnly: true },
  '灭世魔神': { race:'恶魔', aptRange:{力量资质:[2600,3000],体质资质:[2300,2900],敏捷资质:[2200,2800],智力资质:[2400,3000]}, growthRange:[2.6,3.5], specialty:'physical', innateSkills:['doom_inferno','meteor','berserk'], desc:'【融合限定】灭世之炎的魔神，掌控毁灭性火焰', fusionOnly: true },
  '时空龙神': { race:'龙', aptRange:{力量资质:[2300,2900],体质资质:[2200,2800],敏捷资质:[2500,3000],智力资质:[2600,3000]}, growthRange:[2.6,3.5], specialty:'magic', innateSkills:['time_rift','freeze','magic_double_3'], desc:'【融合限定】掌控时空的龙神，能撕裂时空', fusionOnly: true },
  // ===== 扩展宠物（T1~T5 共 100 种） =====
  // ---------- T1（弱）20 个：成长0.5~1.2，资质800~1500，1个天生技能 ----------
  '草蜢': { race:'哥布林', aptRange:{力量资质:[800,1200],体质资质:[800,1200],敏捷资质:[1000,1400],智力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'speed', innateSkills:['dodge'], desc:'草丛中蹦跳的小虫' },
  '泥巴怪': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[1100,1500],敏捷资质:[800,1100],智力资质:[800,1100]}, growthRange:[0.5,1.1], specialty:'defense', innateSkills:['def_up'], desc:'泥巴堆成的小怪' },
  '小蜥蜴': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[800,1100],敏捷资质:[1100,1500],智力资质:[800,1100]}, growthRange:[0.6,1.1], specialty:'speed', innateSkills:['speed_up'], desc:'灵活的小蜥蜴' },
  '落叶虫': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[900,1300],智力资质:[800,1200]}, growthRange:[0.5,1.0], specialty:'balanced', innateSkills:['blessing'], desc:'落叶下的青虫' },
  '微光蝶': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[1000,1400],智力资质:[1000,1500]}, growthRange:[0.6,1.2], specialty:'magic', innateSkills:['magic_heart'], desc:'微光闪烁的蝴蝶' },
  '小田鼠': { race:'哥布林', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'balanced', innateSkills:['blessing'], desc:'田埂上的小田鼠' },
  '嫩芽精': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[800,1200],智力资质:[1000,1400]}, growthRange:[0.6,1.1], specialty:'magic', innateSkills:['cure'], desc:'嫩芽孕育的小精灵' },
  '水母崽': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[900,1300],智力资质:[1000,1400]}, growthRange:[0.5,1.0], specialty:'magic', innateSkills:['magic_heart'], desc:'漂浮的小水母' },
  '灰羽雀': { race:'天使', aptRange:{力量资质:[900,1300],体质资质:[800,1100],敏捷资质:[1100,1500],智力资质:[800,1100]}, growthRange:[0.6,1.2], specialty:'speed', innateSkills:['dodge'], desc:'灰羽毛的小雀' },
  '小跳蛛': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[800,1100],敏捷资质:[1100,1500],智力资质:[800,1200]}, growthRange:[0.5,1.1], specialty:'speed', innateSkills:['sneak_atk'], desc:'会跳跃的小蜘蛛' },
  '苔藓鼠': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[1000,1400],敏捷资质:[800,1100],智力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'defense', innateSkills:['parry'], desc:'苔藓掩护的小鼠' },
  '小孢子': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[900,1300],智力资质:[1000,1400]}, growthRange:[0.6,1.1], specialty:'magic', innateSkills:['cure'], desc:'飘散的孢子精灵' },
  '风信子': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'magic', innateSkills:['magic_heart'], desc:'风中摇曳的花信子' },
  '小石子': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1100,1500],敏捷资质:[800,1100],智力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'defense', innateSkills:['guard_shield'], desc:'路边的小石子' },
  '露珠精': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[900,1300],智力资质:[1000,1400]}, growthRange:[0.6,1.1], specialty:'magic', innateSkills:['cure'], desc:'晨露凝成的精灵' },
  '萌新史莱姆': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[900,1300],智力资质:[900,1300]}, growthRange:[0.5,1.0], specialty:'balanced', innateSkills:['blessing'], desc:'初出茅庐的史莱姆' },
  '稻草人': { race:'哥布林', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[800,1100],智力资质:[800,1100]}, growthRange:[0.5,1.1], specialty:'defense', innateSkills:['parry'], desc:'田野里的稻草人' },
  '小野鸭': { race:'天使', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[1100,1500],智力资质:[800,1100]}, growthRange:[0.6,1.1], specialty:'speed', innateSkills:['dodge'], desc:'池塘中的野鸭' },
  '飘浮气泡': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[1000,1400],智力资质:[1000,1400]}, growthRange:[0.5,1.0], specialty:'magic', innateSkills:['magic_heart'], desc:'飘浮的魔法气泡' },
  '弱小龙': { race:'龙', aptRange:{力量资质:[1000,1400],体质资质:[900,1300],敏捷资质:[900,1300],智力资质:[800,1100]}, growthRange:[0.6,1.2], specialty:'physical', innateSkills:['power_up'], desc:'体弱多病的幼龙' },
  // ---------- T2（普通）25 个：成长0.8~1.8，资质1000~1700，1个天生技能 ----------
  '林间鹿': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[1100,1500],敏捷资质:[1200,1600],智力资质:[1200,1600]}, growthRange:[0.9,1.5], specialty:'balanced', innateSkills:['blessing'], desc:'林间的灵鹿' },
  '花斑豹': { race:'哥布林', aptRange:{力量资质:[1200,1600],体质资质:[1000,1400],敏捷资质:[1300,1700],智力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk'], desc:'花斑迅捷的豹' },
  '赤尾狐': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1400,1700],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['dodge'], desc:'赤尾的灵狐' },
  '青铜蟹': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1300,1700],敏捷资质:[1000,1300],智力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['iron_wall'], desc:'青铜壳的螃蟹' },
  '丛林狼': { race:'哥布林', aptRange:{力量资质:[1200,1600],体质资质:[1100,1500],敏捷资质:[1300,1700],智力资质:[1000,1300]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['speed_up'], desc:'丛林中的野狼' },
  '月牙兔': { race:'精灵', aptRange:{力量资质:[1000,1300],体质资质:[1100,1500],敏捷资质:[1200,1600],智力资质:[1200,1600]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['cure'], desc:'月牙耳的兔' },
  '锈甲虫': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1400,1700],敏捷资质:[1000,1300],智力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['guard_shield'], desc:'锈甲护身的甲虫' },
  '雪雏': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1300,1700],智力资质:[1200,1600]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['ice_arrow'], desc:'雪白的雏鸟' },
  '岩鸽': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1300,1700],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['dodge'], desc:'岩间的飞鸽' },
  '暮色鸦': { race:'恶魔', aptRange:{力量资质:[1200,1600],体质资质:[1000,1400],敏捷资质:[1300,1700],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk'], desc:'暮色中的乌鸦' },
  '苔甲蜥': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1400,1700],敏捷资质:[1000,1300],智力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['def_up'], desc:'苔甲护身的蜥蜴' },
  '幼麒麟': { race:'龙', aptRange:{力量资质:[1300,1700],体质资质:[1100,1500],敏捷资质:[1200,1600],智力资质:[1100,1500]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['power_up'], desc:'幼年的麒麟' },
  '翡翠蛙': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1100,1500],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'balanced', innateSkills:['blessing'], desc:'翡翠色的蛙' },
  '流火蜥': { race:'龙', aptRange:{力量资质:[1300,1700],体质资质:[1100,1500],敏捷资质:[1200,1600],智力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['flame_strike'], desc:'流火般的蜥蜴' },
  '寒霜鼠': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1300,1700],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['dodge'], desc:'寒霜中的小鼠' },
  '晨曦鹿': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1100,1500],敏捷资质:[1200,1600],智力资质:[1300,1700]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['cure'], desc:'晨曦中的灵鹿' },
  '巨角羊': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1400,1700],敏捷资质:[1000,1300],智力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['guard_shield'], desc:'巨角盘旋的羊' },
  '紫羽鸽': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1400,1700],智力资质:[1100,1500]}, growthRange:[1.0,1.7], specialty:'speed', innateSkills:['speed_up'], desc:'紫羽的飞鸽' },
  '暗影貂': { race:'哥布林', aptRange:{力量资质:[1200,1600],体质资质:[1000,1300],敏捷资质:[1400,1700],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk'], desc:'暗影中的紫貂' },
  '银背猿': { race:'哥布林', aptRange:{力量资质:[1400,1700],体质资质:[1300,1700],敏捷资质:[1100,1500],智力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['power_up'], desc:'银背的巨猿' },
  '烈日甲虫': { race:'史莱姆', aptRange:{力量资质:[1300,1700],体质资质:[1400,1700],敏捷资质:[1000,1300],智力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['iron_wall'], desc:'烈日下的甲虫' },
  '蓝鳉鱼': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1100,1500],敏捷资质:[1200,1600],智力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'balanced', innateSkills:['blessing'], desc:'蓝色的小鳉鱼' },
  '灰岩龟': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1500,1700],敏捷资质:[1000,1300],智力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['def_up'], desc:'灰岩壳的龟' },
  '啼鸣鸟': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1300,1700],智力资质:[1100,1500]}, growthRange:[1.0,1.7], specialty:'speed', innateSkills:['dodge'], desc:'啼声悦耳的鸟' },
  '朱砂蝶': { race:'精灵', aptRange:{力量资质:[1000,1300],体质资质:[1000,1400],敏捷资质:[1200,1600],智力资质:[1300,1700]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['magic_double'], desc:'朱砂色的蝶' },
  // ---------- T3（中等）25 个：成长1.2~2.2，资质1300~2000，1~2个天生技能 ----------
  '银鳞龙': { race:'龙', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1400,1800],智力资质:[1400,1800]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['flame_strike','armor_break'], desc:'银鳞闪耀的龙' },
  '烬羽鸟': { race:'天使', aptRange:{力量资质:[1400,1800],体质资质:[1300,1600],敏捷资质:[1600,2000],智力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['thunder_strike','stun_strike'], desc:'余烬羽毛的鸟' },
  '玄铁犀': { race:'史莱姆', aptRange:{力量资质:[1600,2000],体质资质:[1800,2000],敏捷资质:[1300,1600],智力资质:[1300,1600]}, growthRange:[1.3,1.9], specialty:'defense', innateSkills:['iron_wall','parry'], desc:'玄铁甲的犀牛' },
  '翠风狼': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1600,2000],智力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'翠风的迅狼' },
  '紫电隼': { race:'天使', aptRange:{力量资质:[1400,1800],体质资质:[1300,1600],敏捷资质:[1700,2000],智力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['thunder_strike'], desc:'紫电之隼' },
  '落日虎': { race:'哥布林', aptRange:{力量资质:[1700,2000],体质资质:[1500,1900],敏捷资质:[1400,1800],智力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['fatal_blow','berserk'], desc:'落日之虎' },
  '蓝月狐': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1500,1900],智力资质:[1600,2000]}, growthRange:[1.5,2.1], specialty:'magic', innateSkills:['ice_arrow','magic_double'], desc:'蓝月光下的狐' },
  '烈焰犬': { race:'恶魔', aptRange:{力量资质:[1600,2000],体质资质:[1400,1800],敏捷资质:[1500,1900],智力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['flame_strike','blood_drain'], desc:'烈焰中的猎犬' },
  '碎石龟': { race:'史莱姆', aptRange:{力量资质:[1500,1900],体质资质:[1800,2000],敏捷资质:[1300,1600],智力资质:[1300,1600]}, growthRange:[1.3,1.9], specialty:'defense', innateSkills:['iron_wall','guard_shield'], desc:'碎石壳的龟' },
  '寒林鹿': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1400,1800],敏捷资质:[1500,1900],智力资质:[1600,2000]}, growthRange:[1.5,2.1], specialty:'magic', innateSkills:['ice_arrow','magic_heart'], desc:'寒林中的鹿' },
  '翔云马': { race:'天使', aptRange:{力量资质:[1500,1900],体质资质:[1400,1800],敏捷资质:[1700,2000],智力资质:[1400,1800]}, growthRange:[1.6,2.2], specialty:'speed', innateSkills:['haste','dodge'], desc:'踏云而行的马' },
  '雷羽雀': { race:'天使', aptRange:{力量资质:[1400,1800],体质资质:[1300,1700],敏捷资质:[1600,2000],智力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['thunder_strike','stun_strike'], desc:'雷羽之雀' },
  '血藤蛇': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1600,2000],智力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['poison_fang','sneak_atk'], desc:'血藤色的蛇' },
  '沙暴蝎': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1700,2000],敏捷资质:[1300,1700],智力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'defense', innateSkills:['iron_wall','poison_fang'], desc:'沙暴中的毒蝎' },
  '星纹豹': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1700,2000],智力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'星纹的豹' },
  '月华蝶': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1500,1900],智力资质:[1700,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['magic_double','magic_heart'], desc:'月华之蝶' },
  '赤焰马': { race:'龙', aptRange:{力量资质:[1600,2000],体质资质:[1400,1800],敏捷资质:[1500,1900],智力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'physical', innateSkills:['flame_strike','fatal_blow'], desc:'赤焰奔马' },
  '青木猿': { race:'哥布林', aptRange:{力量资质:[1700,2000],体质资质:[1500,1900],敏捷资质:[1400,1800],智力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['double_slash','power_up'], desc:'青木之猿' },
  '玄冰蛇': { race:'龙', aptRange:{力量资质:[1400,1800],体质资质:[1400,1800],敏捷资质:[1500,1900],智力资质:[1600,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['ice_arrow','freeze'], desc:'玄冰之蛇' },
  '幻影鸦': { race:'恶魔', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1600,2000],智力资质:[1500,1900]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'幻影之鸦' },
  '黄昏狮': { race:'哥布林', aptRange:{力量资质:[1700,2000],体质资质:[1600,2000],敏捷资质:[1400,1800],智力资质:[1300,1700]}, growthRange:[1.5,2.1], specialty:'physical', innateSkills:['fatal_blow','berserk'], desc:'黄昏之狮' },
  '焦土龟': { race:'史莱姆', aptRange:{力量资质:[1500,1900],体质资质:[1800,2000],敏捷资质:[1300,1700],智力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'defense', innateSkills:['iron_wall','flame_strike'], desc:'焦土中的龟' },
  '银光鹿': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1400,1800],敏捷资质:[1500,1900],智力资质:[1600,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['holy_light','magic_heart'], desc:'银光闪耀的鹿' },
  '霜羽雕': { race:'天使', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1700,2000],智力资质:[1500,1900]}, growthRange:[1.6,2.2], specialty:'speed', innateSkills:['ice_arrow','stun_strike'], desc:'霜羽之雕' },
  '紫晶蝶': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1500,1900],智力资质:[1700,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['magic_double','magic_heart'], desc:'紫晶之蝶' },
  // ---------- T4（强）20 个：成长1.6~2.6，资质1600~2400，2~3个天生技能 ----------
  '烈焰龙骑': { race:'龙', aptRange:{力量资质:[2000,2400],体质资质:[1700,2100],敏捷资质:[1800,2200],智力资质:[1700,2100]}, growthRange:[1.8,2.4], specialty:'physical', innateSkills:['flame_strike','fatal_blow','aura_atk'], desc:'烈焰龙骑' },
  '寒冰女王': { race:'恶魔', aptRange:{力量资质:[1600,2000],体质资质:[1700,2100],敏捷资质:[1800,2200],智力资质:[2000,2400]}, growthRange:[1.9,2.5], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'寒冰的女王' },
  '雷霆战狼': { race:'哥布林', aptRange:{力量资质:[1900,2300],体质资质:[1700,2100],敏捷资质:[1800,2200],智力资质:[1600,2000]}, growthRange:[1.8,2.4], specialty:'physical', innateSkills:['thunder_strike','fatal_blow','crit_strike_2'], desc:'雷霆战狼' },
  '圣光审判': { race:'天使', aptRange:{力量资质:[1700,2100],体质资质:[1800,2200],敏捷资质:[1700,2100],智力资质:[2000,2400]}, growthRange:[1.9,2.5], specialty:'magic', innateSkills:['holy_radiance','holy_light','blessing'], desc:'圣光的审判' },
  '暗影刺客': { race:'恶魔', aptRange:{力量资质:[1900,2300],体质资质:[1600,2000],敏捷资质:[2100,2400],智力资质:[1700,2100]}, growthRange:[1.9,2.5], specialty:'speed', innateSkills:['sneak_atk_2','dodge_2','crit_strike_2'], desc:'暗影的刺客' },
  '翡翠守护': { race:'史莱姆', aptRange:{力量资质:[1800,2200],体质资质:[2200,2400],敏捷资质:[1600,2000],智力资质:[1700,2100]}, growthRange:[1.8,2.4], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp'], desc:'翡翠守护者' },
  '风暴巨雕': { race:'天使', aptRange:{力量资质:[1800,2200],体质资质:[1600,2000],敏捷资质:[2100,2400],智力资质:[1700,2100]}, growthRange:[1.9,2.5], specialty:'speed', innateSkills:['thunder_strike','stun_strike','aura_spd'], desc:'风暴的巨雕' },
  '玄铁巨兽': { race:'史莱姆', aptRange:{力量资质:[2000,2400],体质资质:[2200,2400],敏捷资质:[1600,2000],智力资质:[1600,2000]}, growthRange:[1.8,2.4], specialty:'defense', innateSkills:['iron_wall','guard_shield','aura_hp'], desc:'玄铁巨兽' },
  '烈日战神': { race:'天使', aptRange:{力量资质:[2100,2400],体质资质:[1800,2200],敏捷资质:[1900,2300],智力资质:[1700,2100]}, growthRange:[1.9,2.5], specialty:'physical', innateSkills:['fatal_blow','berserk','aura_atk'], desc:'烈日战神' },
  '幽冥蛇君': { race:'恶魔', aptRange:{力量资质:[1800,2200],体质资质:[1700,2100],敏捷资质:[1900,2300],智力资质:[1900,2300]}, growthRange:[1.9,2.5], specialty:'magic', innateSkills:['poison_mist','magic_double_2','magic_heart_2'], desc:'幽冥蛇君' },
  '紫电战虎': { race:'哥布林', aptRange:{力量资质:[2100,2400],体质资质:[1900,2300],敏捷资质:[1800,2200],智力资质:[1600,2000]}, growthRange:[1.9,2.5], specialty:'physical', innateSkills:['thunder_strike','fatal_blow','power_up_2'], desc:'紫电战虎' },
  '苍穹龙': { race:'龙', aptRange:{力量资质:[1900,2300],体质资质:[1800,2200],敏捷资质:[1900,2300],智力资质:[1900,2300]}, growthRange:[1.9,2.5], specialty:'balanced', innateSkills:['holy_light','magic_heart_2','aura_hp_2'], desc:'苍穹之龙' },
  '焚天魔': { race:'恶魔', aptRange:{力量资质:[2100,2400],体质资质:[1900,2300],敏捷资质:[1800,2200],智力资质:[1900,2300]}, growthRange:[2.0,2.6], specialty:'physical', innateSkills:['meteor','flame_strike','berserk'], desc:'焚天之魔' },
  '冰封王': { race:'龙', aptRange:{力量资质:[1900,2300],体质资质:[1900,2300],敏捷资质:[1800,2200],智力资质:[2100,2400]}, growthRange:[2.0,2.6], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'冰封之王' },
  '圣辉麒麟': { race:'龙', aptRange:{力量资质:[2000,2400],体质资质:[1900,2300],敏捷资质:[1900,2300],智力资质:[2000,2400]}, growthRange:[2.0,2.6], specialty:'magic', innateSkills:['holy_radiance','magic_heart_2','aura_crit'], desc:'圣辉之麒麟' },
  '暗夜君王': { race:'恶魔', aptRange:{力量资质:[2000,2400],体质资质:[2000,2400],敏捷资质:[1900,2300],智力资质:[2000,2300]}, growthRange:[2.0,2.6], specialty:'balanced', innateSkills:['vampire_2','fatal_blow','aura_atk_2'], desc:'暗夜君王' },
  '千年古树': { race:'精灵', aptRange:{力量资质:[1800,2200],体质资质:[2200,2400],敏捷资质:[1600,2000],智力资质:[2000,2400]}, growthRange:[1.9,2.5], specialty:'defense', innateSkills:['regen_2','heal_wind','aura_hp_2'], desc:'千年古树' },
  '雷陨巨猿': { race:'哥布林', aptRange:{力量资质:[2200,2400],体质资质:[2100,2400],敏捷资质:[1700,2100],智力资质:[1600,2000]}, growthRange:[1.9,2.5], specialty:'physical', innateSkills:['thunder_strike','double_slash','power_up_2'], desc:'雷陨巨猿' },
  '烈风隼王': { race:'天使', aptRange:{力量资质:[1900,2300],体质资质:[1700,2100],敏捷资质:[2100,2400],智力资质:[1800,2200]}, growthRange:[2.0,2.6], specialty:'speed', innateSkills:['haste','stun_strike','aura_spd_2'], desc:'烈风之隼王' },
  '玄冥蛟': { race:'龙', aptRange:{力量资质:[2000,2400],体质资质:[2200,2400],敏捷资质:[1700,2100],智力资质:[1900,2300]}, growthRange:[2.0,2.6], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp_2'], desc:'玄冥之蛟' },
  // ---------- T5（极强）10 个：成长2.0~3.0，资质1900~2800，2~3个天生技能 ----------
  '远古龙神': { race:'龙', aptRange:{力量资质:[2400,2800],体质资质:[2300,2700],敏捷资质:[2300,2700],智力资质:[2400,2800]}, growthRange:[2.4,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'远古的龙神' },
  '创世天使': { race:'天使', aptRange:{力量资质:[2200,2600],体质资质:[2300,2700],敏捷资质:[2200,2600],智力资质:[2500,2800]}, growthRange:[2.3,2.9], specialty:'magic', innateSkills:['holy_radiance','meteor','aura_crit'], desc:'创世的天使' },
  '虚空魔神': { race:'恶魔', aptRange:{力量资质:[2300,2700],体质资质:[2200,2600],敏捷资质:[2200,2600],智力资质:[2500,2800]}, growthRange:[2.4,3.0], specialty:'magic', innateSkills:['doom_judge','meteor','magic_heart_2'], desc:'虚空的魔神' },
  '太初神兽': { race:'龙', aptRange:{力量资质:[2400,2800],体质资质:[2400,2800],敏捷资质:[2300,2700],智力资质:[2300,2700]}, growthRange:[2.5,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'太初的神兽' },
  '万古灵尊': { race:'精灵', aptRange:{力量资质:[2100,2500],体质资质:[2200,2600],敏捷资质:[2300,2700],智力资质:[2500,2800]}, growthRange:[2.3,2.9], specialty:'magic', innateSkills:['life_bloom','heal_wind','aura_crit'], desc:'万古的灵尊' },
  '灭世魔龙': { race:'龙', aptRange:{力量资质:[2500,2800],体质资质:[2300,2700],敏捷资质:[2200,2600],智力资质:[2300,2700]}, growthRange:[2.4,3.0], specialty:'physical', innateSkills:['doom_judge','fatal_blow','aura_atk_3'], desc:'灭世的魔龙' },
  '永夜主宰': { race:'恶魔', aptRange:{力量资质:[2300,2700],体质资质:[2400,2800],敏捷资质:[2200,2600],智力资质:[2500,2800]}, growthRange:[2.4,3.0], specialty:'magic', innateSkills:['doom_judge','meteor','magic_double_2'], desc:'永夜的主宰' },
  '圣渊天马': { race:'天使', aptRange:{力量资质:[2300,2700],体质资质:[2200,2600],敏捷资质:[2500,2800],智力资质:[2300,2700]}, growthRange:[2.4,3.0], specialty:'speed', innateSkills:['haste','thunder_strike','aura_spd_3'], desc:'圣渊的天马' },
  '混沌麒麟': { race:'龙', aptRange:{力量资质:[2400,2800],体质资质:[2400,2800],敏捷资质:[2300,2700],智力资质:[2400,2800]}, growthRange:[2.5,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_atk_3'], desc:'混沌的麒麟' },
  '乾坤龙尊': { race:'龙', aptRange:{力量资质:[2500,2800],体质资质:[2400,2800],敏捷资质:[2400,2800],智力资质:[2500,2800]}, growthRange:[2.5,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'乾坤的龙尊' },
};

// ==================== 宠物进阶系统 ====================
// 50条进阶链：base(T1/T2基础名) → mid(T3进阶名) → top(T5进阶名)
// base 必须为 PET_DEX 中已存在的 T1/T2 宠物；mid/top 为新名（不与 PET_DEX 重复）
const PET_ADVANCE_CHAINS = [
  { base: '雏鹰', mid: '战鹰', top: '苍鹰' },
  { base: '幼狼', mid: '狼王', top: '天狼' },
  { base: '小史莱姆', mid: '史莱姆战士', top: '史莱姆霸主' },
  { base: '绿毛虫', mid: '铁甲蛹', top: '血翼蝶' },
  { base: '野鼠', mid: '巨鼠', top: '巨鼠王' },
  { base: '小精灵', mid: '精灵法师', top: '精灵女王' },
  { base: '小恶魔', mid: '恶魔勇士', top: '恶魔领主' },
  { base: '幼龙', mid: '飞龙', top: '龙王' },
  { base: '蘑菇人', mid: '毒菇怪', top: '噬魂菇' },
  { base: '麻雀', mid: '飞雀', top: '烈风雀' },
  { base: '青蛙', mid: '蛙斗士', top: '蛙皇' },
  { base: '蝙蝠崽', mid: '吸血蝠', top: '暗夜魔王' },
  { base: '小地精', mid: '地精战士', top: '地精首领' },
  { base: '萤火虫', mid: '烈光虫', top: '星辰虫' },
  { base: '刺猬', mid: '钢刺兽', top: '刺猬王' },
  { base: '蜗牛', mid: '巨蜗', top: '灵魂蜗' },
  { base: '小树精', mid: '树人', top: '古树之灵' },
  { base: '蝌蚪', mid: '怪蛙', top: '巨型蛙' },
  { base: '小龙崽', mid: '火龙', top: '炎龙' },
  { base: '小骷髅', mid: '骷髅战士', top: '死灵法师' },
  { base: '灰尘怪', mid: '尘魔', top: '沙暴魔' },
  { base: '花仙子', mid: '花神', top: '花之女王' },
  { base: '小石怪', mid: '石魔', top: '巨石魔' },
  { base: '风精灵', mid: '风之灵', top: '风暴精灵' },
  { base: '小幽灵', mid: '幽魂', top: '怨灵' },
  { base: '青苔蛇', mid: '苔蛇王', top: '蛇妖' },
  { base: '野猪', mid: '巨牙猪', top: '野猪王' },
  { base: '泥潭怪', mid: '泥魔', top: '泥潭巨兽' },
  { base: '铜甲蟹', mid: '铁甲蟹', top: '蟹皇' },
  { base: '霜精灵', mid: '雪精灵', top: '冰雪女王' },
  { base: '火蜥蜴', mid: '烈焰蜥', top: '火蜥之王' },
  { base: '黑鸦', mid: '暗鸦', top: '鸦王' },
  { base: '小恶魔犬', mid: '恶魔犬', top: '地狱犬' },
  { base: '苔藓巨人', mid: '藓巨人', top: '远古苔巨人' },
  { base: '夜光蛾', mid: '月光蛾', top: '幻光蛾' },
  { base: '铁甲蚁', mid: '巨蚁', top: '蚁后' },
  { base: '影狐', mid: '暗影狐', top: '九尾狐' },
  { base: '岩蜥蜴', mid: '岩龙蜥', top: '石化蜥蜴' },
  { base: '霜狼', mid: '冰狼', top: '雪狼王' },
  { base: '光之子', mid: '光之勇士', top: '光明神子' },
  { base: '腐尸虫', mid: '毒尸虫', top: '腐败之王' },
  { base: '碧眼猫', mid: '灵猫', top: '猫妖王' },
  { base: '沙蝎', mid: '毒蝎', top: '蝎王' },
  { base: '草蜢', mid: '巨型蚂蚱', top: '飞蝗王' },
  { base: '泥巴怪', mid: '泥怪', top: '泥沼巨怪' },
  { base: '小蜥蜴', mid: '火蜥怪', top: '龙蜥' },
  { base: '微光蝶', mid: '灵光蝶', top: '星光蝶' },
  { base: '水母崽', mid: '毒水母', top: '深海水母' },
  { base: '小田鼠', mid: '田鼠勇士', top: '田鼠王' },
  { base: '灰羽雀', mid: '灰羽鹰', top: '苍羽雀' },
];

// 根据基础宠物名和进阶阶段动态生成图鉴条目
// stage: 1 = T3(mid 进阶名，T2基础→T3成长体), 2 = T6(top 进阶名，T3→T6最终形态)
// 需求7/8：T3进阶宠无幼年体，孵化即为mid(T3)，单次进阶 mid→top(T6)
// T2进阶宠(mid)资质上限1800，成长按T3级
// T3进阶宠(top/T6)资质上限2400，成长按T6级
function getAdvancedPetDex(baseName, stage) {
  var chain = PET_ADVANCE_CHAINS.find(function(c) { return c.base === baseName; });
  if (!chain) return null;
  var advancedName = stage === 1 ? chain.mid : chain.top;
  // 若该进阶名已显式存在于 PET_DEX，则直接返回
  if (PET_DEX[advancedName]) return PET_DEX[advancedName];
  var baseDex = PET_DEX[baseName];
  if (!baseDex) return null;
  var baseTier = getPetTier(baseName);
  var aptRange = {};
  var gRange = baseDex.growthRange;
  var growthRange;
  if (stage === 1) {
    // T2→T3(mid): 资质上限1800，成长按T3级(+0.3)
    var aptCap1 = 1800;
    Object.keys(baseDex.aptRange).forEach(function(k) {
      var range = baseDex.aptRange[k];
      var lo = Math.min(1200, Math.floor(range[0] * 1.1));
      var hi = Math.min(aptCap1, Math.floor(range[1] * 1.15));
      aptRange[k] = [lo, hi];
    });
    growthRange = [gRange[0] + 0.3, gRange[1] + 0.3];
  } else {
    // T3→T6(top): 资质上限2400，成长按T6级(+0.8)
    var aptCap2 = 2400;
    Object.keys(baseDex.aptRange).forEach(function(k) {
      var range = baseDex.aptRange[k];
      var lo = Math.min(1500, Math.floor(range[0] * 1.3));
      var hi = Math.min(aptCap2, Math.floor(range[1] * 1.4));
      aptRange[k] = [lo, hi];
    });
    growthRange = [gRange[0] + 0.8, gRange[1] + 0.8];
  }
  return {
    race: baseDex.race,
    aptRange: aptRange,
    growthRange: growthRange,
    specialty: baseDex.specialty,
    innateSkills: baseDex.innateSkills.slice(),
    desc: '【进阶】' + baseDex.desc + '（进阶+' + stage + '）',
    advancedFrom: baseName,
    advanceStage: stage,
  };
}

// 获取宠物图鉴信息（不存在则用默认值）
function getPetDex(name) {
  var dex = PET_DEX[name];
  if (dex) return dex;
  // 检查是否为进阶宠物名
  for (var i = 0; i < PET_ADVANCE_CHAINS.length; i++) {
    var chain = PET_ADVANCE_CHAINS[i];
    if (chain.mid === name) return getAdvancedPetDex(chain.base, 1);
    if (chain.top === name) return getAdvancedPetDex(chain.base, 2);
  }
  // 默认值
  return {
    race: RACES[randomInt(0, RACES.length - 1)],
    aptRange: { 力量资质:[1200,1800],体质资质:[1200,1800],敏捷资质:[1200,1800],智力资质:[1200,1800] },
    growthRange: [1.0, 2.0],
    specialty: 'balanced',
    innateSkills: [],
    desc: '神秘宠物',
  };
}

// 特殊类型图标映射
const SPECIALTY_ICONS = { physical:'⚔️', magic:'✨', defense:'🛡️', speed:'💨', balanced:'⚖️' };
const SPECIALTY_NAMES = { physical:'物理型', magic:'法术型', defense:'防御型', speed:'敏捷型', balanced:'均衡型' };

// ==================== 宠物技能库（按特长和品阶分配） ====================
// 每个宠物有固定的技能库，孵化时从技能库随机获得技能（可能1个~满技能）
// 天生技能（dex.innateSkills）必带，其余从技能库随机

function getPetTier(name) {
var dex = getPetDex(name);
var g = dex.growthRange[1];
if (g >= 3.3) return 6;
if (g >= 2.8) return 5;
if (g >= 2.3) return 4;
if (g >= 1.8) return 3;
if (g >= 1.4) return 2;
return 1;
}

function getPetMaxSkills(name) {
// 按品阶决定满技能格：T1=4, T2=4, T3=5, T4=5, T5=6, T6=7
var tier = getPetTier(name);
if (tier >= 6) return 7;
if (tier >= 5) return 6;
if (tier >= 3) return 5;
return 4;
}

// 每个特长的基础技能候选池（T1-T2 可用）
var SPEC_SKILL_POOL = {
  physical: ['flame_strike','double_slash','fatal_blow','blood_drain','crit_strike','double_atk','sneak_atk','power_up','berserk','armor_break','penetration','precision','pursuit','charge','focus','momentum','brave','concentration','instant_strike','soul_slash','thousand_blades','execute_blade','true_blade'],
  magic: ['ice_arrow','meteor','blizzard','poison_mist','holy_light','cure','magic_heart','magic_double','blessing','flame_storm','life_bloom','precision','magic_fluctuation','meditation','thunder_spell','water_deluge','dream_butterfly','butterfly_tide','buddha_seal','buddha_quake','venom_coil','purify_light'],
  defense: ['guard_shield','iron_wall','def_up','parry','regen','reflect','revive','heal_wind','holy_light','sturdy','survival','solid_magic','magic_absorb','solid_shield','tenacity','miracle','longevity','self_heal','clear_mind','mountain_crush','counter_stance','thorn_shield'],
  speed: ['shadow_strike','haste','dodge','speed_up','double_atk','fatal_blow','stun_strike','freeze','crit_strike','sneak_atk','ice_arrow','pursuit','precision','charge','initiative','wind_chaser','blink','instant_strike','flame_charge','thousand_blades'],
  balanced: ['flame_strike','meteor','holy_light','guard_shield','crit_strike','def_up','magic_heart','double_atk','power_up','regen','berserk','heal_wind','sturdy','precision','survival','cooperation','unity','eternity','retaliation','soul_search','thunderous_might','berserker_fury'],
};
// T3+ 高阶技能候选池
var SPEC_SKILL_POOL_T3 = {
  physical: ['crit_strike_2','double_atk_2','sneak_atk_2','power_up_2','vampire_2','aura_atk','penetration_2','precision_2','pursuit_2','berserker_fury','execute_blade','blood_frenzy','undying_blood'],
  magic: ['magic_heart_2','magic_double_2','aura_hp','holy_radiance','life_bloom','precision_2','devour_will','thunderous_might','mana_burn','arcane_pierce'],
  defense: ['def_up_2','parry_2','regen_2','revive_2','aura_def','reflect_2','sturdy_2','survival_2','counter_stance','thorn_shield','purify_light','iron_bulwark','shield_bash'],
  speed: ['dodge_2','speed_up_2','sneak_atk_2','aura_spd','crit_strike_2','pursuit_2','precision_2','true_blade','swift_strike','gale_combo'],
  balanced: ['crit_strike_2','power_up_2','def_up_2','magic_heart_2','aura_atk','aura_def','sturdy_2','precision_2','survival_2','berserker_fury','thunderous_might','blood_surge','undying_blood','mana_burn'],
};
// T4+ 超高阶技能候选池
var SPEC_SKILL_POOL_T4 = {
  physical: ['crit_strike_3','double_atk_3','sneak_atk_3','power_up_3','vampire_3','aura_atk_2','penetration_3','precision_3','pursuit_3','tear_3','crit_dmg_3','blood_oath_slash','life_judgment'],
  magic: ['magic_heart_3','magic_double_3','aura_hp_2','aura_crit_2','precision_3','crit_dmg_3','devour_will','arcane_burst','arcane_resonance','arcane_pierce'],
  defense: ['def_up_3','parry_3','regen_3','revive_3','reflect_3','aura_def_2','sturdy_3','survival_3','counter_stance','thorn_shield','counter_storm','unshakable'],
  speed: ['dodge_3','speed_up_3','sneak_atk_3','aura_spd_2','crit_strike_3','pursuit_3','precision_3','true_blade','lightning_raid','wind_whisper'],
  balanced: ['crit_strike_3','power_up_3','def_up_3','magic_heart_3','aura_atk_2','aura_def_2','aura_hp_2','sturdy_3','precision_3','survival_3','tear_3','crit_dmg_3','thunderous_might','life_exchange','blood_pool_burst','arcane_burst'],
};
// T5 神级技能候选池
var SPEC_SKILL_POOL_T5 = {
  physical: ['aura_atk_3','aura_crit_3','vampire_3','doom_judge','tear_3','crit_dmg_3','berserker_fury','blood_curse','life_torrent'],
  magic: ['aura_hp_3','aura_regen_3','magic_double_3','meteor','crit_dmg_3','time_reverse','devour_will','arcane_barrage','mana_storm'],
  defense: ['aura_def_3','aura_hp_3','revive_3','regen_3','sturdy_3','survival_3','time_reverse','guardian_wrath','fortress_crush'],
  speed: ['aura_spd_3','dodge_3','aura_crit_3','stun_strike','pursuit_3','crit_dmg_3','storm_blade','shadow_clone'],
  balanced: ['aura_atk_3','aura_def_3','aura_hp_3','aura_spd_3','aura_regen_3','tear_3','crit_dmg_3','time_reverse','blood_curse','life_torrent','arcane_barrage','mana_storm','guardian_wrath','fortress_crush','storm_blade','shadow_clone'],
};

// 为每个宠物类型生成独特的技能库
// 规则：天生技能必带 + 根据宠物名确定性选取补充技能
// 同名宠物的技能库永远一致，不同宠物技能库不同
function getPetSkillLib(name) {
  var dex = getPetDex(name);
  // 1. 若显式定义了 skillLib，则直接使用
  if (dex.skillLib && dex.skillLib.length > 0) return dex.skillLib.slice();

  var tier = getPetTier(name);
  var spec = dex.specialty;
  var maxSkills = getPetMaxSkills(name);

  // 2. 必带：天生技能
  var lib = (dex.innateSkills || []).slice();

  // 3. 候选池：按特长+品阶累加
  var pool = (SPEC_SKILL_POOL[spec] || SPEC_SKILL_POOL.balanced).slice();
  if (tier >= 3) pool = pool.concat(SPEC_SKILL_POOL_T3[spec] || []);
  if (tier >= 4) pool = pool.concat(SPEC_SKILL_POOL_T4[spec] || []);
  if (tier >= 5) pool = pool.concat(SPEC_SKILL_POOL_T5[spec] || []);

  // 修复：按 baseId 去重候选池，避免跨 tier concat 后同 baseId 的多 tier 技能同时入池
  // （例如 execute_blade 在 T1 和 T3 池中都存在，会导致 avail 有重复项被选中浪费技能格）
  var seenBaseId = {};
  pool = pool.filter(function(sid) {
    var bid = getSkillBaseId(sid);
    if (seenBaseId[bid]) return false;
    seenBaseId[bid] = true;
    return true;
  });

  // 4. 用宠物名生成确定性种子（同名宠物技能库相同）
  var seed = 0;
  for (var i = 0; i < name.length; i++) {
    seed = ((seed << 5) - seed + name.charCodeAt(i)) | 0;
  }
  seed = Math.abs(seed) + 1;

  // 5. 从池中按种子确定性选取补充技能（按完整 id 去重）
  var used = {};
  lib.forEach(function(s){ used[s] = true; });
  var avail = pool.filter(function(s){ return !used[s]; });
  while (lib.length < maxSkills && avail.length > 0) {
    var idx = seed % avail.length;
    lib.push(avail.splice(idx, 1)[0]);
    seed = Math.floor(seed / (avail.length + 1)) + 7;
  }
  return lib;
}

// 获取宠物T级别标签
function getPetTierLabel(name) {
  var tier = getPetTier(name);
  return 'T' + tier;
}

// ==================== SKILL SYSTEM ====================
// 技能类型: bloodline(血统-不占格) / active(主动) / passive(被动) / aura(光环)

const BLOODLINE_SKILLS = [
  // ===== 史莱姆系（防御型）：4种变体 =====
  { id: 'slime_body', name: '史莱姆之躯', type: 'bloodline', race: '史莱姆', tier: 1,
    desc: '受到伤害降低15%，死亡时有20%概率复活（恢复30%血量，每场战斗1次）',
    effects: { dmgReduce: 0.15, reviveChance: 0.20, reviveHpPct: 0.30 } },
  { id: 'slime_guard', name: '凝胶护盾', type: 'bloodline', race: '史莱姆', tier: 1,
    desc: '防御力+25%，受到攻击时15%概率反弹30%伤害',
    effects: { defPct: 0.25, reflectChance: 0.15, reflectPct: 0.30 } },
  { id: 'slime_regen', name: '粘液再生', type: 'bloodline', race: '史莱姆', tier: 1,
    desc: '每回合恢复8%最大气血，气血+15%',
    effects: { regenPct: 0.08, hpPct: 0.15 } },
  { id: 'slime_iron', name: '钢铁史莱姆', type: 'bloodline', race: '史莱姆', tier: 1,
    desc: '受到伤害降低20%，气血+10%，防御力+15%',
    effects: { dmgReduce: 0.20, hpPct: 0.10, defPct: 0.15 } },
  // ===== 龙系（攻击型）：4种变体 =====
  { id: 'dragon_might', name: '龙族威压', type: 'bloodline', race: '龙', tier: 1,
    desc: '攻击力提升20%，对非龙族敌人额外造成10%伤害',
    effects: { atkPct: 0.20, extraDmgVsNonDragon: 0.10 } },
  { id: 'dragon_flame', name: '龙息烈焰', type: 'bloodline', race: '龙', tier: 1,
    desc: '攻击力+15%，暴击伤害+25%，攻击附带5%灼烧',
    effects: { atkPct: 0.15, critDmg: 0.25, burnChance: 0.05 } },
  { id: 'dragon_scale', name: '龙鳞护体', type: 'bloodline', race: '龙', tier: 1,
    desc: '攻击力+10%，防御力+20%，气血+10%',
    effects: { atkPct: 0.10, defPct: 0.20, hpPct: 0.10 } },
  { id: 'dragon_storm', name: '风暴龙怒', type: 'bloodline', race: '龙', tier: 1,
    desc: '攻击力+18%，速度+15%，技能触发+8%',
    effects: { atkPct: 0.18, spdPct: 0.15, skillTrigger: 0.08 } },
  // ===== 恶魔系（吸血型）：4种变体 =====
  { id: 'demon_pact', name: '恶魔契约', type: 'bloodline', race: '恶魔', tier: 1,
    desc: '攻击时吸取造成伤害的20%气血，血量越低攻击力越高（最多+30%）',
    effects: { lifestealPct: 0.20, lowHpAtkBoost: 0.30 } },
  { id: 'demon_shadow', name: '暗影之力', type: 'bloodline', race: '恶魔', tier: 1,
    desc: '攻击力+18%，暴击率+12%，闪避+8%',
    effects: { atkPct: 0.18, critRate: 0.12, dodgeRate: 0.08 } },
  { id: 'demon_curse', name: '诅咒之力', type: 'bloodline', race: '恶魔', tier: 1,
    desc: '攻击力+15%，攻击附带15%概率使目标受到伤害+10%（持续3回合）',
    effects: { atkPct: 0.15, curseChance: 0.15 } },
  { id: 'demon_blood', name: '嗜血狂化', type: 'bloodline', race: '恶魔', tier: 1,
    desc: '吸血25%，攻击力+12%，但受到伤害+10%',
    effects: { lifestealPct: 0.25, atkPct: 0.12, dmgTakenPct: 0.10 } },
  // ===== 天使系（治疗型）：4种变体 =====
  { id: 'angel_grace', name: '天使祝福', type: 'bloodline', race: '天使', tier: 1,
    desc: '每回合恢复10%最大气血，受到的治疗效果提升30%',
    effects: { regenPct: 0.10, healBoost: 0.30 } },
  { id: 'angel_light', name: '圣光庇护', type: 'bloodline', race: '天使', tier: 1,
    desc: '气血+20%，受到伤害降低10%，每回合恢复5%气血',
    effects: { hpPct: 0.20, dmgReduce: 0.10, regenPct: 0.05 } },
  { id: 'angel_judge', name: '审判之翼', type: 'bloodline', race: '天使', tier: 1,
    desc: '攻击力+15%，对恶魔系敌人额外造成20%伤害',
    effects: { atkPct: 0.15, extraDmgVsDemon: 0.20 } },
  { id: 'angel_haste', name: '神圣加速', type: 'bloodline', race: '天使', tier: 1,
    desc: '速度+25%，闪避+10%，暴击率+8%',
    effects: { spdPct: 0.25, dodgeRate: 0.10, critRate: 0.08 } },
  // ===== 哥布林系（敏捷型）：4种变体 =====
  { id: 'goblin_cunning', name: '哥布林狡诈', type: 'bloodline', race: '哥布林', tier: 1,
    desc: '闪避率提升20%，暴击率提升10%，掉落金币+25%',
    effects: { dodgeRate: 0.20, critRate: 0.10, goldFind: 0.25 } },
  { id: 'goblin_swift', name: '迅捷之力', type: 'bloodline', race: '哥布林', tier: 1,
    desc: '速度+30%，暴击率+15%',
    effects: { spdPct: 0.30, critRate: 0.15 } },
  { id: 'goblin_thief', name: '盗贼天赋', type: 'bloodline', race: '哥布林', tier: 1,
    desc: '闪避+15%，暴击伤害+30%，掉落金币+30%',
    effects: { dodgeRate: 0.15, critDmg: 0.30, goldFind: 0.30 } },
  { id: 'goblin_berserk', name: '狂暴哥布林', type: 'bloodline', race: '哥布林', tier: 1,
    desc: '攻击力+15%，暴击率+10%，速度+10%',
    effects: { atkPct: 0.15, critRate: 0.10, spdPct: 0.10 } },
  // ===== 精灵系（法术型）：4种变体 =====
  { id: 'elf_dance', name: '精灵之舞', type: 'bloodline', race: '精灵', tier: 1,
    desc: '攻击速度提升25%，技能触发概率提升15%',
    effects: { spdPct: 0.25, skillTrigger: 0.15 } },
  { id: 'elf_magic', name: '魔法之源', type: 'bloodline', race: '精灵', tier: 1,
    desc: '灵力+25%，法术伤害+15%',
    effects: { intPct: 0.25, magicDmgPct: 0.15 } },
  { id: 'elf_nature', name: '自然之力', type: 'bloodline', race: '精灵', tier: 1,
    desc: '每回合恢复8%气血，灵力+15%，受到治疗效果+25%',
    effects: { regenPct: 0.08, intPct: 0.15, healBoost: 0.25 } },
  { id: 'elf_mystic', name: '神秘之韵', type: 'bloodline', race: '精灵', tier: 1,
    desc: '技能触发+20%，灵力+15%，闪避+10%',
    effects: { skillTrigger: 0.20, intPct: 0.15, dodgeRate: 0.10 } },
  // ===== 特殊血统（融合限定宠物专属）=====
  { id: 'chaos_blood', name: '混元之血', type: 'bloodline', race: '龙', tier: 6,
    desc: '全属性+15%，技能触发+15%，受到伤害降低10%（融合限定）',
    effects: { allPct: 0.15, skillTrigger: 0.15, dmgReduce: 0.10 }, special: true },
  { id: 'inferno_blood', name: '灭世之炎', type: 'bloodline', race: '恶魔', tier: 6,
    desc: '攻击力+30%，吸血20%，暴击伤害+30%（融合限定）',
    effects: { atkPct: 0.30, lifestealPct: 0.20, critDmg: 0.30 }, special: true },
  { id: 'timewalker_blood', name: '时空之血', type: 'bloodline', race: '龙', tier: 6,
    desc: '速度+25%，技能触发+20%，闪避+15%（融合限定）',
    effects: { spdPct: 0.25, skillTrigger: 0.20, dodgeRate: 0.15 }, special: true },
];

// ==================== 独特血统技能系统（基于宠物名生成） ====================
// 需求4：每个宠物类型都有独特的血统技能，按专长预设效果模板
// 需求10：血统技能不能只是单纯的加属性，每个专长都附带一个"招牌特殊效果"
var BLOODLINE_EFFECT_PRESETS = {
  // 物理系：招牌效果 - 攻击吸血（8%）
  physical: { atkPct: 0.10, critRate: 0.05, critDmg: 0.10, lifestealPct: 0.08 },
  // 法术系：招牌效果 - 攻击附带15%概率灼烧（3回合，每回合5%最大气血）
  magic: { intPct: 0.10, magicDmgPct: 0.10, mpRegenPct: 0.05, burnChance: 0.15, burnTurns: 3, burnPct: 0.05 },
  // 防御系：招牌效果 - 受击时20%概率反弹25%伤害
  defense: { defPct: 0.10, hpPct: 0.10, dmgReduce: 0.05, reflectChance: 0.20, reflectPct: 0.25 },
  // 速度系：招牌效果 - 受击时15%概率反击（造成攻击力50%伤害）
  speed: { spdPct: 0.10, dodgeRate: 0.05, critRate: 0.05, counterChance: 0.15, counterPct: 0.50 },
  // 均衡系：招牌效果 - 每回合恢复5%最大气血
  balanced: { allPct: 0.05, hpPct: 0.05, atkPct: 0.05, regenPct: 0.05 },
};

// 血统效果 key → 中文名映射（统一用于血统技能展示）
var BLOODLINE_EFFECT_NAMES = {
  atkPct: '攻击力', hpPct: '气血', defPct: '防御力', spdPct: '速度', intPct: '灵力',
  allPct: '全属性', critRate: '暴击率', critDmg: '暴击伤害', dodgeRate: '闪避率',
  magicDmgPct: '法术伤害', mpRegenPct: '魔法回复', dmgReduce: '伤害减免', skillTrigger: '技能触发',
  // 需求10：特殊效果名称
  lifestealPct: '吸血', burnChance: '灼烧概率', burnTurns: '灼烧回合', burnPct: '灼烧伤害',
  reflectChance: '反弹概率', reflectPct: '反弹伤害', counterChance: '反击概率', counterPct: '反击伤害',
  regenPct: '每回合回血', reviveChance: '复活概率', reviveHpPct: '复活血量',
  extraDmgVsNonDragon: '对非龙族额外伤害', extraDmgVsDemon: '对恶魔系额外伤害',
  curseChance: '诅咒概率', lowHpAtkBoost: '低血量攻击加成', dmgTakenPct: '受到伤害增减',
  goldFind: '金币掉落', healBoost: '治疗效果',
};
// 非百分比型血统效果（数值为倍率/固定值，不显示为百分比）
var BLOODLINE_EFFECT_FLAT = {
  burnTurns: true, // 回合数
};

// ==================== 宠物专属血统技能图鉴（PET_BLOODLINE_DEX）====================
// 需求：每个宠物都有独特的血统技能（专属名称 + 专属描述）
// 战斗效果仍按专长预设 BLOODLINE_EFFECT_PRESETS 计算，此处仅覆盖 name 与 desc
// 修改血统技能名称/描述只需修改此对象
var PET_BLOODLINE_DEX = {
  // ==================== 宠物专属血统技能 ====================
  '小火焰': { name:'炎鳞迸发', desc:'每次物理攻击命中后，为目标附加1层「灼烧」（每回合损失本次伤害10%的生命值，最多叠3层）；自身生命值低于30%时，下一次攻击触发双倍灼烧伤害。' },
  '冰晶兽': { name:'寒晶反哺', desc:'受到物理攻击时，30%概率为攻击者附加1层「冻伤」（速度降10%，持续2回合）；自身每拥有1层冻伤类减益，受到的伤害降低5%，最多叠5层。' },
  '暗影狼': { name:'影步猎杀', desc:'进入战斗后首次攻击必定从背后发起，伤害提升25%且无视15%防御；若目标生命值低于50%，本次攻击暴击率额外提升30%。' },
  '雷霆鹰': { name:'雷翼俯冲', desc:'每回合首次攻击40%概率触发「雷击」，额外造成20%攻击力的雷电伤害，并使目标下回合行动顺位延迟1位。' },
  '翡翠蛇': { name:'翠毒缠骨', desc:'攻击附带的中毒每回合生效时，20%概率使目标「麻痹」（无法行动1回合）；中毒层数每+1，麻痹概率提升10%。' },
  '岩石巨人': { name:'岩壳蓄能', desc:'每受击1次获得1层「岩壳」（每层+3%防御，最多10层）；叠满时，下次受击必定格挡，且反弹本次伤害的30%。' },
  '风暴龙': { name:'风刃龙息', desc:'物理攻击25%概率触发「风刃裂甲」，对目标及左右相邻单位造成本次伤害40%的范围伤害，并降低其10%防御持续2回合。' },
  '月光狐': { name:'月辉愈疗', desc:'释放治疗技能时，额外为目标附加「月辉护盾」（吸收本次治疗量30%的伤害，持续2回合）；夜间战斗治疗效果整体+20%。' },
  '深渊鱼': { name:'深渊侵蚀', desc:'法术命中后，为目标附加「侵蚀」（受到的法术伤害+15%，持续3回合）；目标已处于侵蚀状态时，本次法术伤害+20%。' },
  '烈焰凤凰': { name:'涅槃炎魂', desc:'首次死亡必定触发涅槃，回复50%最大生命值并清除所有负面；涅槃后3回合内，所有攻击附带「焚魂」（目标无法被治疗，持续2回合）。' },
  '霜冻巨人': { name:'冻土领域', desc:'回合开始时展开冻土领域，敌方单位每回合20%概率被冻结1回合；自身在领域内受到的魔法伤害-20%。' },
  '幽灵猫': { name:'虚灵遁形', desc:'每次成功闪避后，进入「虚灵」状态1回合，期间免疫所有物理伤害，且下次攻击必定暴击；每3回合最多触发1次。' },
  '黄金甲虫': { name:'金甲虫壳', desc:'受到的首次伤害必定减免70%；每回合开始时获得1层「金甲」（吸收自身最大生命值5%的伤害，不可叠加，持续1回合）。' },
  '星辰鹿': { name:'星芒赐福', desc:'释放法术时30%概率触发「星芒」，为己方全体回复自身智力值50%的生命值；每触发3次星芒，下一个法术必定暴击。' },
  '毒液蜘蛛': { name:'噬神经毒', desc:'中毒生效时，额外降低目标10%攻击力与法术强度，持续1回合；中毒叠至5层时，触发毒素爆发，造成目标当前生命值15%的真实伤害。' },
  '钢铁犀牛': { name:'铁脊冲锋', desc:'每回合首次行动时，若未受控，本次攻击附带「冲撞」，击退目标1个行动顺位，并使其防御-20%持续1回合。' },
  '幻影蝶': { name:'幻镜分身', desc:'进场时生成1个幻象分身，继承自身30%属性并同步普攻；分身被击破时，自身闪避率+30%持续2回合。' },
  '熔岩龟': { name:'熔岩反哺', desc:'受击时反弹本次伤害15%的火焰伤害给攻击者；自身生命值每降10%，反弹比例+5%，最高至40%。' },
  '飓风雕': { name:'风卷残云', desc:'普攻20%概率触发「飓风」，造成1.5倍伤害并将目标卷入风旋，使其下回合无法普攻、只能释放技能。' },
  '水晶龙': { name:'晶折射', desc:'释放法术时25%概率触发水晶折射，伤害分裂为2段，每段造成原伤害60%；两段可独立触发暴击。' },
  '暗夜蝙蝠': { name:'超声定位', desc:'攻击隐身/闪避目标时必定命中且伤害+30%；每成功命中1次，命中与暴击率+3%，最多叠5层，持续至战斗结束。' },
  '森林守护者': { name:'生命共鸣', desc:'己方全体每回合回复最大生命值2%；若己方单位血量低于30%，回复量翻倍，并额外清除1个负面状态。' },
  '雷电麒麟': { name:'雷劫连锁', desc:'攻击触发雷电时，连锁弹射至周围2个敌方单位，弹射伤害为原伤害50%；每命中1个目标，下回合攻击力+5%，最多叠3层。' },
  '冰霜女巫': { name:'极寒掌控', desc:'冻结效果持续时间+1回合；对冻结目标法术伤害+50%，且30%概率击碎冻结，造成目标最大生命值10%的额外冰霜伤害。' },
  '火焰魔像': { name:'炎核蓄能', desc:'受到火焰伤害不扣血，反而转化为「炎能」（每层+5%攻击力，最多10层）；满层时下次攻击触发范围爆炸，对全体敌人造成伤害。' },
  '深海巨兽': { name:'水压碾轧', desc:'对生命值高于自身的目标，伤害+20%；目标血量每比自身高10%，伤害额外+5%，最高至50%。' },
  '天空之翼': { name:'高空制霸', desc:'前3回合处于「高空」状态，闪避率+40%，所有攻击附带25%俯冲加成；第4回合俯冲落地，攻击力永久+15%。' },
  '大地之灵': { name:'地脉愈合', desc:'每回合结束回复5%最大生命值；若本回合受过控制，回复量翻倍，并额外清除1个控制状态。' },
  '时空行者': { name:'时溯回溯', desc:'每战斗3回合触发1次时间回溯，将自身血量与增益回溯至3回合前；回溯后本回合速度+50%。' },
  '混沌之眼': { name:'混沌凝视', desc:'每回合开始随机凝视1名敌人，使其本回合受到的所有伤害+30%；若凝视目标本回合死亡，自身回复10%最大生命值与全部法力。' },
  '圣光天使': { name:'圣光涤罪', desc:'释放治疗时同时清除目标身上2个负面状态；对友方释放的增益技能持续时间+1回合。' },
  '暗黑恶魔': { name:'暗能吞噬', desc:'击杀目标后吞噬能量，永久+5%攻击力与5%最大生命值，最多叠5层；满层后攻击附带20%吸血。' },
  '翡翠巨龙': { name:'龙威震慑', desc:'进场释放龙威，使所有敌方攻击力-10%持续2回合；对低于自身等级的目标，伤害额外+15%。' },
  '紫电貂': { name:'疾电瞬闪', desc:'每回合有1次受击前瞬闪闪避的机会；成功闪避后立即反击，造成普攻80%的雷电伤害。' },
  '金刚猿': { name:'巨力撼地', desc:'攻击15%概率触发「撼地」，造成2倍伤害并眩晕目标1回合；自身血量越低，触发概率越高，最低血量时升至35%。' },
  '九尾灵狐': { name:'九尾焰魂', desc:'法术攻击触发狐火，每解锁1条尾巴额外追加1段狐火（共9段，每段为原伤害20%）；每次释放法术解锁1条尾巴，最多叠9层。' },
  '三头地狱犬': { name:'三头撕咬', desc:'普攻变为三段撕咬，每段45%伤害；三段分别附带灼烧、吸血、破甲效果，独立计算命中与暴击。' },
  '独角天马': { name:'圣洁奔袭', desc:'移动类增益效果翻倍；每次行动前清除自身1个负面；冲锋攻击30%概率触发「圣洁眩晕」（无视免疫，无法行动1回合）。' },
  '美杜莎': { name:'石化凝视', desc:'每回合首次攻击20%概率使目标石化2回合（无法行动，防御+30%）；对石化目标施法，伤害+40%且必定暴击。' },
  '牛头人酋长': { name:'狂战图腾', desc:'进场召唤狂战图腾，己方全体物理单位暴击率+10%；图腾存在期间，自身每次暴击50%概率使图腾层数+1，每层+2%暴击率。' },
  '鹰身女妖': { name:'音波尖啸', desc:'命中后尖啸降低目标10%命中率，持续2回合；叠至3层时，目标30%概率陷入「混乱」（随机攻击友方）。' },
  '石像鬼': { name:'石化蛰伏', desc:'血量低于20%时自动石化蛰伏，2回合无法行动但受击-80%，每回合回20%血量；2回合后解除并进入狂暴。' },
  '吸血鬼伯爵': { name:'血之契约', desc:'攻击吸血提升至30%；溢出吸血转化为「血盾」（最多叠至自身最大血量30%），血盾存在时免疫控制。' },
  '狼人战士': { name:'月圆狂暴', desc:'血量低于50%进入狂暴，攻击+30%、攻速+20%，但受击+15%；狂暴状态下击杀目标，回复20%最大生命值。' },
  '精灵射手': { name:'穿甲狙击', desc:'远程攻击无视20%防御；目标血量高于80%时，本次攻击必定暴击且无视50%防御；每击杀1个目标，下一发伤害+10%。' },
  '矮人铁匠': { name:'精锻护甲', desc:'自身装备防御属性效果+50%；每回合为己方全体临时+2%防御，最多叠5层，持续至战斗结束。' },
  '哥布林盗贼': { name:'妙手空空', desc:'攻击15%概率偷取目标1个增益状态，转化为自身同名增益；偷取成功额外+5%速度，持续2回合。' },
  '史莱姆王': { name:'分裂再生', desc:'首次血量归零时分裂为2个小史莱姆，各继承本体40%属性；两个小史莱姆同时存活时，本体每回合20%概率重组复活。' },
  '冰霜巨龙': { name:'龙息冰封', desc:'龙息攻击30%概率直接冻结目标2回合；对冻结目标攻击50%概率触发「冰裂」，额外造成目标已损失血量20%的伤害。' },
  '火焰领主': { name:'炎域领主', desc:'场地变为炎域，敌方每回合损失5%最大生命值的火焰伤害；自身在炎域内攻击+20%，且免疫所有灼烧。' },
  '风暴之神': { name:'风暴神权', desc:'每回合开始召唤风暴，随机使2名敌人速度-20%持续1回合；自身在风暴中固定第1位行动，且攻击概率触发风暴连击。' },
  '大地泰坦': { name:'泰坦之躯', desc:'最大生命值+20%；受到的所有伤害先扣除自身防御值，剩余部分再扣血；防御值每回合开始重置。' },
  '海洋霸主': { name:'潮汐掌控', desc:'每2回合触发潮汐：奇数回合涨潮（伤害+20%），偶数回合退潮（受击-20%）；潮汐切换时回复8%最大生命值。' },
  '天空霸主': { name:'空域统治', desc:'永久飞行，免疫地面技能与陷阱；对地面单位伤害+25%；每击杀1个地面单位，速度永久+5%。' },
  '混沌魔龙': { name:'混沌龙力', desc:'每次攻击随机附加混沌效果（吸血/眩晕/破甲/灼烧/减速五选一）；目标每有一种混沌效果，自身对其伤害+10%，最多+50%。' },
  '创世神龙': { name:'创世赐福', desc:'战斗开始为己方全体附加「创世印记」，印记存在期间首次死亡必定复活并回30%血量；每局仅生效1次。' },

  // ----- 初级野生宠物 -----
  '小史莱姆': { name:'软弹躯体', desc:'受物理攻击10%概率弹开伤害，自身不受损并使攻击者僵直，下回合行动顺位延后1位。' },
  '绿毛虫': { name:'啃食蜕甲', desc:'每次攻击啃食护甲，使目标防御-2%，最多叠10层；满层时自身蜕皮，回10%血量并清除所有负面。' },
  '野鼠': { name:'钻地闪避', desc:'血量低于30%时，30%概率钻地躲避本次攻击；成功后从地下突袭，追加一次普攻伤害。' },
  '小精灵': { name:'灵韵亲和', desc:'释放治疗时20%概率额外治疗1名随机友方，额外治疗量为原治疗50%。' },
  '雏鹰': { name:'振翅滑翔', desc:'首次受致命伤害时滑翔规避，剩余1点血量；本场战斗闪避率永久+10%。' },
  '小恶魔': { name:'恶作剧诅咒', desc:'攻击10%概率附加「恶作剧」，目标下回合技能50%概率歪到随机目标，持续1回合。' },
  '幼龙': { name:'幼龙怒焰', desc:'血量低于50%时，下次火焰攻击伤害+30%；每触发1次永久+2%火焰伤害，最多叠5层。' },
  '蘑菇人': { name:'孢子护盾', desc:'每回合开始释放孢子形成护盾，吸收最大生命值3%的伤害；护盾破时释放孢子云，使攻击者命中-10%持续2回合。' },
  '麻雀': { name:'群雀扰袭', desc:'普攻15%概率召唤同伴协同攻击，追加1次30%伤害的啄击；协同独立判定命中。' },
  '青蛙': { name:'蛙跳突袭', desc:'每2回合可蛙跳1次，跳过前排直接攻击后排；突袭伤害+20%。' },
  '蝙蝠崽': { name:'声波探测', desc:'攻击隐身单位不会落空；每回合首次攻击标记目标，使其闪避-10%持续2回合。' },
  '小地精': { name:'矮小规避', desc:'受范围攻击时20%概率因身材矮小规避，只受50%范围伤害。' },
  '萤火虫': { name:'萤光指引', desc:'施法后，为己方攻击最高单位附加「萤光」，使其下次攻击命中+15%，持续1回合。' },
  '刺猬': { name:'尖刺反伤', desc:'受近战物理攻击时，反弹本次伤害10%的真实伤害；自身防御越高，反伤比例越高。' },
  '蜗牛': { name:'厚壳蓄势', desc:'行动顺位越靠后，本回合伤害越高，每延后1位+3%，最高+30%。' },
  '小树精': { name:'根系扎根', desc:'连续2回合不移动则扎根，每回合回3%最大生命值；扎根状态受击-10%。' },
  '蝌蚪': { name:'水域适应', desc:'水域地形中全属性+10%；离开水域后增益保留2回合。' },
  '小龙崽': { name:'龙裔成长', desc:'战斗每持续1回合，攻击力+1%，最多叠10层，本场战斗内有效。' },
  '小骷髅': { name:'骸骨坚韧', desc:'血量低于10%时，所有受击-20%；被击杀后5%概率重组复活，回10%血量。' },
  '灰尘怪': { name:'尘雾隐匿', desc:'每回合开始10%概率进入隐匿，本回合首次攻击前不会被选为目标。' },
  '花仙子': { name:'花露滋养', desc:'治疗对女性单位效果+15%；治疗后目标获得「花露」，下回合开始时再回复少量血量。' },
  '小石怪': { name:'碎石护体', desc:'首次物理伤害减免30%；减免的伤害转化为碎石，下次攻击时附加碎石伤害。' },
  '风精灵': { name:'风之加速', desc:'每成功闪避1次，速度+5%持续2回合，最多叠3层。' },
  '小幽灵': { name:'幽灵穿透', desc:'法术攻击10%概率穿透护盾直接打血；穿透成功时伤害+15%。' },
  '青苔蛇': { name:'滑溜躯体', desc:'受束缚类控制时30%概率直接挣脱；挣脱后速度+10%持续1回合。' },
  '野猪': { name:'冲锋蛮撞', desc:'战斗首次攻击必定冲锋，伤害+20%并击退目标；冲锋后下回合防御-10%。' },
  '泥潭怪': { name:'泥潭减速', desc:'攻击过泥潭怪的目标，速度-10%持续1回合，最多叠2层。' },
  '铜甲蟹': { name:'横甲格挡', desc:'正面受击15%概率完美格挡，只受1点伤害；侧后方攻击无法触发。' },
  '霜精灵': { name:'霜花凝结', desc:'冰系法术命中后凝结霜花，叠3层后目标速度-15%持续2回合。' },
  '幼狼': { name:'狼性嗜血', desc:'目标血量低于30%时，自身攻速+15%；击杀目标后回5%最大生命值。' },
  '火蜥蜴': { name:'熔岩皮肤', desc:'免疫低级灼烧；受火焰伤害时反而回复等量血量（单次最多回最大血量10%）。' },
  '黑鸦': { name:'不祥预兆', desc:'攻击10%概率附加「不祥」，目标下次攻击必定不暴击。' },
  '小恶魔犬': { name:'地狱狂吠', desc:'进场狂吠，使所有敌方宠物命中-5%持续1回合。' },
  '苔藓巨人': { name:'苔藓再生', desc:'每回合结束时若血量低于50%，额外回2%最大生命值；苔藓存在期间免疫中毒。' },
  '夜光蛾': { name:'夜光迷乱', desc:'法术攻击15%概率使目标「迷乱」，下回合技能目标随机选取。' },
  '铁甲蚁': { name:'蚁群协作', desc:'己方每多1只蚁类宠物，自身防御+5%，最多叠5层；受击时概率召唤同伴分摊伤害。' },
  '影狐': { name:'影遁突袭', desc:'战斗首次攻击必定从阴影突袭，伤害+20%且目标无法反击。' },
  '岩蜥蜴': { name:'岩色伪装', desc:'岩石地形中，远程受击-15%；静止不动时隐匿概率提升。' },
  '霜狼': { name:'寒霜撕咬', desc:'攻击附带寒霜，目标下回合速度-8%；叠3层后概率短暂冻结。' },
  '光之子': { name:'圣光庇护', desc:'受致命伤害时10%概率触发庇护，回15%血量；每场战斗最多触发1次。' },
  '腐尸虫': { name:'尸毒蔓延', desc:'攻击附带尸毒，目标死亡时尸毒蔓延至周围单位，造成持续伤害。' },
  '碧眼猫': { name:'夜视洞察', desc:'夜间战斗命中与暴击+10%；可看破低级隐身。' },
  '沙蝎': { name:'沙壳蓄毒', desc:'防御时积蓄毒素，下次攻击附带额外毒素伤害；蓄毒越久伤害越高。' },
  '烈风雕': { name:'风翼加速', desc:'每飞行1回合速度叠3%，最多5层；俯冲攻击时，速度加成转化为伤害加成。' },
  '寒冰蝶': { name:'冰蝶鳞粉', desc:'释放冰系法术时散落冰鳞，目标法术强度-10%持续2回合。' },
  '雷豹': { name:'雷驰奔袭', desc:'速度越高雷电伤害越高；速度每超出目标10%，雷电附加伤害+5%。' },
  '玄冰麒麟': { name:'玄冰领域', desc:'释放冰系技能时展开领域，领域内敌人每回合概率冻结，冰系伤害+20%。' },
  '魔神之影': { name:'魔神残影', desc:'死亡后残留残影3回合，每回合对全体敌人造成自身攻击力30%的暗影伤害。' },
  '圣光龙神': { name:'圣光龙谕', desc:'每3回合释放一次龙谕，清除己方全体负面并回10%最大生命值。' },
  '永恒天使': { name:'永恒守护', desc:'己方全体首次死亡时，消耗自身20%最大血量将其复活并回30%血量；每局最多触发2次。' },
  '虚空主宰': { name:'虚空吞噬', desc:'法术击杀目标后吞噬灵魂，永久+2%法术强度与最大法力，无叠加上限。' },
  '万物之母': { name:'生命孕育', desc:'每5回合孕育1颗生命之种，友方死亡时种子自动孵化使其复活，回50%血量。' },
  '混元圣兽': { name:'混元归一', desc:'自身与目标的属性差值每有一项超过20%，伤害+8%；受到的伤害同理减免。' },
  '灭世魔神': { name:'灭世炎爆', desc:'击杀目标时触发炎爆，对全体敌人造成击杀伤害50%的范围火焰伤害；炎爆可连锁触发。' },
  '时空龙神': { name:'时空裂隙', desc:'每回合20%概率撕裂时空，随机1名敌人的技能/攻击50%概率落空，裂隙持续1回合。' },

  // ----- T1 弱阶宠物 -----
  '草蜢': { name:'弹跳闪避', desc:'受近战攻击12%概率后跳闪避；闪避后拉开距离，下次远程攻击伤害+10%。' },
  '泥巴怪': { name:'泥甲黏着', desc:'受击时泥巴黏住武器，攻击者下回合攻击力-8%，持续1回合。' },
  '小蜥蜴': { name:'断尾逃生', desc:'首次受致命伤害时断尾逃生，剩1点血量并+15%速度持续2回合；断尾后本场无法再生。' },
  '落叶虫': { name:'落叶伪装', desc:'前2回合20%概率被误认为落叶，不会被选为优先攻击目标。' },
  '微光蝶': { name:'微光回能', desc:'每次施法后回5%最大法力；法力低于30%时回复量翻倍。' },
  '小田鼠': { name:'打洞藏匿', desc:'血量低于20%时15%概率打洞藏匿，本回合无法被选中；结束后回10%血量。' },
  '嫩芽精': { name:'嫩芽复苏', desc:'低额治疗20%概率触发复苏，治疗效果翻倍；每场最多触发2次。' },
  '水母崽': { name:'触须麻痹', desc:'法术攻击8%概率使目标麻痹0.5回合，行动顺位延后1位。' },
  '灰羽雀': { name:'振翅干扰', desc:'飞掠目标时扇风干扰，目标命中-5%持续1回合；每回合最多触发1次。' },
  '小跳蛛': { name:'跳跃突袭', desc:'每3回合可跳跃突袭1次，跳过前排打后排，伤害+15%。' },
  '苔藓鼠': { name:'苔藓拟态', desc:'草地/沼泽地形中受击-10%，且概率隐匿身形。' },
  '小孢子': { name:'孢子增殖', desc:'治疗10%概率生成孢子，目标下回合开始时再回复少量血量。' },
  '风信子': { name:'风信传送', desc:'每4回合可短距传送1次，规避本次攻击并出现在随机位置。' },
  '小石子': { name:'碎石崩溅', desc:'受重击时碎石崩溅，对攻击者造成自身防御力20%的反伤。' },
  '露珠精': { name:'露珠净化', desc:'治疗目标时15%概率清除1个中毒类负面。' },
  '萌新史莱姆': { name:'软萌减伤', desc:'首次受击伤害-20%；面对可爱系宠物时，对方5%概率转攻其他目标。' },
  '稻草人': { name:'稻草替身', desc:'首次受致命伤害时替身受创，自身剩1点血量并清除所有负面。' },
  '小野鸭': { name:'潜水规避', desc:'水域地形中受击20%概率潜水规避，本回合剩余时间无法被选中。' },
  '飘浮气泡': { name:'气泡缓冲', desc:'所有伤害先被气泡缓冲10%；气泡破后下回合重新生成。' },
  '弱小龙': { name:'逆境龙心', desc:'每损失10%血量，攻击力+3%；最低血量时最高+15%。' },

  // ----- T2 普通宠物 -----
  '林间鹿': { name:'林间指引', desc:'森林地形中，己方全体闪避+8%；可为队友指引路径规避陷阱。' },
  '花斑豹': { name:'花斑伏击', desc:'首次攻击伏击目标，伤害+25%；若目标未察觉，伏击必定暴击。' },
  '赤尾狐': { name:'赤尾迷惑', desc:'攻击10%概率用尾巴迷惑目标，使其下回合攻击目标随机。' },
  '青铜蟹': { name:'青铜坚壳', desc:'正面防御时物理受击-18%；暴击无法击穿正面防御。' },
  '丛林狼': { name:'狼群呼应', desc:'己方每多1只狼类宠物，自身攻击+4%，最多叠4层；狼类同伴死亡时自身狂暴1回合。' },
  '月牙兔': { name:'月眠治愈', desc:'夜间战斗治疗效果+20%；目标睡眠状态下治疗量翻倍。' },
  '锈甲虫': { name:'锈甲腐蚀', desc:'攻击者攻击后武器锈蚀，攻击力每回合-3%，最多叠3层。' },
  '雪雏': { name:'雪羽御寒', desc:'免疫寒冷减速；冰系伤害对自身-15%。' },
  '岩鸽': { name:'岩间穿梭', desc:'山地地形中飞行速度+15%，且概率利用岩石遮挡规避远程攻击。' },
  '暮色鸦': { name:'暮色隐匿', desc:'黄昏/夜间战斗首回合进入隐匿，不会被优先攻击。' },
  '苔甲蜥': { name:'苔甲自愈', desc:'每回合回1.5%最大生命值；脱战时回复翻倍。' },
  '幼麒麟': { name:'麒麟瑞气', desc:'进场散发瑞气，己方全体暴击抵抗+10%持续2回合。' },
  '翡翠蛙': { name:'翠皮毒抗', desc:'免疫低级中毒；受毒素伤害时转化为少量回血。' },
  '流火蜥': { name:'流火尾击', desc:'普攻后15%概率甩尾追加一次30%伤害的火焰攻击。' },
  '寒霜鼠': { name:'寒霜滑行', desc:'冰面地形速度+20%；移动留下寒霜路径，路径上敌人减速。' },
  '晨曦鹿': { name:'晨曦祝福', desc:'清晨/白天战斗，己方全体治疗效果+12%。' },
  '巨角羊': { name:'巨角顶飞', desc:'受近战冲锋时20%概率顶飞对方，使其眩晕0.5回合。' },
  '紫羽鸽': { name:'紫羽传信', desc:'可提前1回合预知敌方体术攻击，己方全体闪避临时+10%。' },
  '暗影貂': { name:'暗影潜行', desc:'每3回合可潜行1回合，潜行状态下首次攻击必定暴击。' },
  '银背猿': { name:'银背重击', desc:'蓄力攻击伤害+30%；蓄力需1回合，期间防御+15%。' },
  '烈日甲虫': { name:'烈日硬化', desc:'白天战斗甲壳硬化，防御+12%。' },
  '蓝鳉鱼': { name:'蓝鳞水息', desc:'水中全属性+8%；离开水后加成保留3回合。' },
  '灰岩龟': { name:'灰岩缩壳', desc:'血量低于25%时自动缩壳，受击-30%但无法行动。' },
  '啼鸣鸟': { name:'啼鸣预警', desc:'进场啼鸣预警，己方全体首回合闪避+8%。' },
  '朱砂蝶': { name:'朱砂迷魂', desc:'法术攻击12%概率使目标迷魂，下回合优先攻击友方。' },

  // ----- T3 中阶宠物 -----
  '银鳞龙': { name:'银鳞反射', desc:'15%概率将受到的单体法术反弹50%给施法者。' },
  '烬羽鸟': { name:'烬羽灼烧', desc:'羽毛燃烧，每次攻击附带灼烧，每回合造成攻击力5%的火焰伤害，持续2回合。' },
  '玄铁犀': { name:'玄铁卸力', desc:'重击伤害-20%；每次受重击，下次冲撞伤害+10%。' },
  '翠风狼': { name:'翠风疾走', desc:'移动留下翠风轨迹，己方沿轨迹移动时速度+15%。' },
  '紫电隼': { name:'紫电俯冲', desc:'高空俯冲时雷电伤害翻倍；俯冲后1回合内速度-10%。' },
  '落日虎': { name:'落日虎啸', desc:'黄昏时攻击+20%；虎啸概率使小型宠物恐惧无法行动1回合。' },
  '蓝月狐': { name:'蓝月幻术', desc:'满月时幻术效果翻倍，20%概率使目标攻击幻象/错误目标。' },
  '烈焰犬': { name:'烈焰撕咬', desc:'撕咬留下火焰伤口，目标受治疗时伤口迸发，抵消50%治疗量。' },
  '碎石龟': { name:'碎石壁垒', desc:'可抛出碎石为友方吸收1次攻击；每3回合可使用1次。' },
  '寒林鹿': { name:'寒林霜愈', desc:'寒林地形中，治疗同时为目标附加一层冰霜护盾。' },
  '翔云马': { name:'踏云奔行', desc:'踏云而行，免疫地面陷阱与地形减速。' },
  '雷羽雀': { name:'雷羽传导', desc:'雷电攻击可在相邻敌人间传导1次，传导伤害为原伤害40%。' },
  '血藤蛇': { name:'血藤汲取', desc:'中毒目标掉血时，自身回复等量生命值。' },
  '沙暴蝎': { name:'沙暴护体', desc:'血量低于30%时卷起沙暴，自身闪避+25%，攻击者命中-20%。' },
  '星纹豹': { name:'星纹闪烁', desc:'夜晚星纹发光，每回合有1次闪烁机会，必定闪避一次单体攻击。' },
  '月华蝶': { name:'月华增幅', desc:'月夜下法术强度+25%；月华越盛增幅越高。' },
  '赤焰马': { name:'赤焰奔腾', desc:'冲锋距离越远伤害越高，每移动1格+5%，最高+30%。' },
  '青木猿': { name:'青木掷击', desc:'可投掷青木巨石造成范围伤害；每4回合可投掷1次。' },
  '玄冰蛇': { name:'玄冰缠绕', desc:'冰系法术持续减速，叠3层后冻结0.5回合。' },
  '幻影鸦': { name:'幻影分身', desc:'每3回合生成1个幻影，承受1次攻击后消失；幻影存在时自身闪避+15%。' },
  '黄昏狮': { name:'黄昏狮威', desc:'黄昏时分攻击与暴击各+18%。' },
  '焦土龟': { name:'焦土灼烧', desc:'周围形成焦土区域，靠近的敌人每回合受少量火焰伤害。' },
  '银光鹿': { name:'银光净化', desc:'治疗同时净化1个负面；净化成功时治疗量+10%。' },
  '霜羽雕': { name:'霜羽冰封', desc:'霜羽概率冻结飞行单位翅膀，使其速度大幅降低。' },
  '紫晶蝶': { name:'紫晶折射', desc:'法术概率通过紫晶折射，额外命中1名随机敌人，伤害为原伤害50%。' },

  // ----- T4 强阶宠物 -----
  '烈焰龙骑': { name:'龙骑炎阵', desc:'冲锋时布下炎阵，路径上敌人持续灼烧3回合。' },
  '寒冰女王': { name:'女王冰谕', desc:'冻结无视20%冻结抗性；对冻结目标施法必定暴击。' },
  '雷霆战狼': { name:'雷狼奔猎', desc:'攻击血量低于30%的目标时，必定触发雷电连击，追加1次雷电伤害。' },
  '圣光审判': { name:'审判圣印', desc:'对邪恶阵营目标伤害+30%；击杀邪恶目标后，为己方全体附加圣印护盾。' },
  '暗影刺客': { name:'暗影处决', desc:'对血量低于20%的目标必定触发处决斩杀；处决成功后重置所有攻击冷却。' },
  '翡翠守护': { name:'翡翠屏障', desc:'每3回合展开屏障，己方全体受击-20%，持续1回合。' },
  '风暴巨雕': { name:'风暴气旋', desc:'飞行形成气旋，周围敌人速度-15%，且概率被卷入无法行动。' },
  '玄铁巨兽': { name:'玄铁真身', desc:'开启真身后3回合内所有受击-40%，但速度-30%；每场战斗仅可开启1次。' },
  '烈日战神': { name:'烈日神躯', desc:'白天战斗免疫灼烧与中毒，且攻击力+25%。' },
  '幽冥蛇君': { name:'幽冥蛇毒', desc:'毒素可无限叠加；目标每有1层毒素，受到的法术伤害+3%。' },
  '紫电战虎': { name:'紫电虎啸', desc:'虎啸附带紫电，概率麻痹目标2回合；麻痹期间目标受雷电伤害翻倍。' },
  '苍穹龙': { name:'苍穹龙气', desc:'龙气覆盖全场，己方龙类全属性+10%；敌方受龙威压制，全属性-5%。' },
  '焚天魔': { name:'焚天魔焰', desc:'魔焰灼烧灵魂，目标无法通过任何方式回血，持续2回合；不可被驱散。' },
  '冰封王': { name:'冰封王权', desc:'全场冰系伤害+20%；敌人被冻结时，立即损失当前法力值20%。' },
  '圣辉麒麟': { name:'圣辉祥瑞', desc:'每回合为己方血量最低单位附加祥瑞护盾，吸收伤害并缓慢回血。' },
  '暗夜君王': { name:'暗夜王权', desc:'夜间战斗时，己方恶魔单位全属性+15%；自身夜间免疫所有控制。' },
  '千年古树': { name:'古树根系', desc:'根系连接全体友方，分摊10%伤害；根系存在时全体缓慢回血。' },
  '雷陨巨猿': { name:'雷陨重击', desc:'蓄力重击召唤雷电陨石，造成巨额范围伤害；蓄力需2回合。' },
  '烈风隼王': { name:'隼王猎域', desc:'划定猎域，猎域内自身速度与暴击+30%；敌方无法逃离猎域。' },
  '玄冥蛟': { name:'玄冥水铠', desc:'水铠吸收法术伤害，30%法术伤害由法力值承担；法力耗尽前水铠不破裂。' },

  // ----- T5 顶阶宠物 -----
  '远古龙神': { name:'远古龙谕', desc:'每5回合释放龙谕，己方龙类全属性+20%，敌方被龙威震慑无法行动1回合。' },
  '创世天使': { name:'创世圣光', desc:'己方濒临团灭时，释放圣光全体复活并回40%血量；每局仅触发1次。' },
  '虚空魔神': { name:'虚空裂隙', desc:'每回合开启裂隙，20%概率使敌方技能反噬，对施法者自身造成伤害。' },
  '太初神兽': { name:'太初本源', desc:'所有属性加成效果提升50%；免疫所有低级控制与负面。' },
  '万古灵尊': { name:'万古灵韵', desc:'己方全体每回合回5%血量与法力；死亡友方20%概率化作灵体继续战斗3回合。' },
  '灭世魔龙': { name:'灭世龙息', desc:'龙息可毁灭护盾与增益，攻击前先清除目标所有护盾与正面buff。' },
  '永夜主宰': { name:'永夜降临', desc:'第3回合后永夜降临，全场变为夜间，敌方命中-20%，己方恶魔全属性+20%。' },
  '圣渊天马': { name:'圣渊奔袭', desc:'奔袭速度无上限，速度每+10%，伤害+8%；奔袭无视地形与阻挡。' },
  '混沌麒麟': { name:'混沌瑞气', desc:'每回合随机为己方附加一种瑞气（攻击/防御/速度/治疗/暴击五选一），持续1回合。' },
  '乾坤龙尊': { name:'乾坤逆转', desc:'每局可触发1次，将己方全体的负面状态转化为同名正面增益，持续2回合。' },
};

// ===== 宠物专属血统技能效果表（PET_BLOODLINE_EFFECTS）=====
// 每个宠物的血统技能效果与其描述对应，战斗中按此效果计算
// 未在此表中的宠物回退到 BLOODLINE_EFFECT_PRESETS（按专长）
var PET_BLOODLINE_EFFECTS = {
  // ===== 专属/Boss 级宠物 =====
  '小火焰': { atkPct: 0.10, burnChance: 0.30, burnTurns: 3, burnPct: 0.10 },
  '冰晶兽': { defPct: 0.10, hpPct: 0.10, dmgReduce: 0.10, reflectChance: 0.30, reflectPct: 0.15 },
  '暗影狼': { atkPct: 0.15, critRate: 0.15, critDmg: 0.10 },
  '雷霆鹰': { atkPct: 0.10, critRate: 0.08, magicDmgPct: 0.10 },
  '翡翠蛇': { magicDmgPct: 0.10, burnChance: 0.20, burnTurns: 3, burnPct: 0.08 },
  '岩石巨人': { defPct: 0.15, hpPct: 0.12, dmgReduce: 0.08, reflectChance: 0.25, reflectPct: 0.30 },
  '风暴龙': { atkPct: 0.12, magicDmgPct: 0.10, spdPct: 0.05 },
  '月光狐': { intPct: 0.10, regenPct: 0.03, healBoost: 0.20 },
  '深渊鱼': { intPct: 0.10, magicDmgPct: 0.15 },
  '烈焰凤凰': { reviveChance: 1.0, reviveHpPct: 0.50, atkPct: 0.10, burnChance: 0.20, burnTurns: 2, burnPct: 0.05 },
  '霜冻巨人': { intPct: 0.10, magicDmgPct: 0.12, dmgReduce: 0.10 },
  '幽灵猫': { dodgeRate: 0.15, critRate: 0.10, spdPct: 0.10 },
  '黄金甲虫': { defPct: 0.12, hpPct: 0.10, dmgReduce: 0.12 },
  '星辰鹿': { intPct: 0.12, magicDmgPct: 0.10, critRate: 0.08, regenPct: 0.03 },
  '毒液蜘蛛': { magicDmgPct: 0.12, burnChance: 0.25, burnTurns: 3, burnPct: 0.08 },
  '钢铁犀牛': { atkPct: 0.12, defPct: 0.08, hpPct: 0.08 },
  '幻影蝶': { dodgeRate: 0.15, spdPct: 0.10, atkPct: 0.08 },
  '熔岩龟': { defPct: 0.10, hpPct: 0.10, reflectChance: 0.40, reflectPct: 0.15, lowHpAtkBoost: 0.10 },
  '飓风雕': { atkPct: 0.12, critRate: 0.08, spdPct: 0.10 },
  '水晶龙': { intPct: 0.12, magicDmgPct: 0.12, critRate: 0.08 },
  '暗夜蝙蝠': { atkPct: 0.10, critRate: 0.12, dodgeRate: 0.05 },
  '森林守护者': { regenPct: 0.05, hpPct: 0.10, healBoost: 0.15 },
  '雷电麒麟': { atkPct: 0.12, magicDmgPct: 0.12, critRate: 0.05 },
  '冰霜女巫': { intPct: 0.12, magicDmgPct: 0.15, critRate: 0.08 },
  '火焰魔像': { defPct: 0.10, hpPct: 0.10, atkPct: 0.10, dmgReduce: 0.05 },
  '深海巨兽': { atkPct: 0.12, hpPct: 0.10, lowHpAtkBoost: 0.15 },
  '天空之翼': { dodgeRate: 0.20, atkPct: 0.15, spdPct: 0.10 },
  '大地之灵': { regenPct: 0.08, defPct: 0.08, hpPct: 0.08 },
  '时空行者': { reviveChance: 0.30, reviveHpPct: 0.50, spdPct: 0.15 },
  '混沌之眼': { intPct: 0.12, magicDmgPct: 0.15, regenPct: 0.03 },
  '圣光天使': { healBoost: 0.20, regenPct: 0.03, intPct: 0.10 },
  '暗黑恶魔': { atkPct: 0.15, hpPct: 0.10, lifestealPct: 0.10 },
  '翡翠巨龙': { atkPct: 0.12, defPct: 0.08, extraDmgVsNonDragon: 0.10 },
  '紫电貂': { dodgeRate: 0.15, spdPct: 0.12, counterChance: 0.25, counterPct: 0.80 },
  '金刚猿': { atkPct: 0.15, critRate: 0.10, lowHpAtkBoost: 0.15 },
  '九尾灵狐': { intPct: 0.15, magicDmgPct: 0.15, burnChance: 0.20, burnTurns: 2, burnPct: 0.05 },
  '三头地狱犬': { atkPct: 0.12, lifestealPct: 0.10, burnChance: 0.20, burnTurns: 2, burnPct: 0.05 },
  '独角天马': { spdPct: 0.15, atkPct: 0.10, regenPct: 0.03 },
  '美杜莎': { intPct: 0.12, magicDmgPct: 0.15, critRate: 0.10 },
  '牛头人酋长': { atkPct: 0.12, critRate: 0.12, critDmg: 0.10 },
  '鹰身女妖': { atkPct: 0.10, spdPct: 0.10, dodgeRate: 0.08 },
  '石像鬼': { defPct: 0.15, hpPct: 0.12, dmgReduce: 0.10, regenPct: 0.05 },
  '吸血鬼伯爵': { lifestealPct: 0.30, atkPct: 0.10, hpPct: 0.10 },
  '狼人战士': { atkPct: 0.15, spdPct: 0.10, lowHpAtkBoost: 0.20, dmgTakenPct: 0.15 },
  '精灵射手': { atkPct: 0.12, critRate: 0.15, critDmg: 0.10 },
  '矮人铁匠': { defPct: 0.15, hpPct: 0.10, dmgReduce: 0.08 },
  '哥布林盗贼': { spdPct: 0.12, atkPct: 0.08, dodgeRate: 0.08 },
  '史莱姆王': { reviveChance: 0.50, reviveHpPct: 0.40, hpPct: 0.15, defPct: 0.08 },
  '冰霜巨龙': { intPct: 0.15, magicDmgPct: 0.18, dmgReduce: 0.05 },
  '火焰领主': { atkPct: 0.15, burnChance: 0.25, burnTurns: 3, burnPct: 0.05, dmgReduce: 0.05 },
  '风暴之神': { spdPct: 0.15, atkPct: 0.10, dodgeRate: 0.08 },
  '大地泰坦': { defPct: 0.15, hpPct: 0.20, dmgReduce: 0.10 },
  '海洋霸主': { atkPct: 0.10, hpPct: 0.10, regenPct: 0.05, dmgReduce: 0.05 },
  '天空霸主': { dodgeRate: 0.15, atkPct: 0.15, spdPct: 0.10 },
  '混沌魔龙': { atkPct: 0.15, magicDmgPct: 0.10, critRate: 0.08 },
  '创世神龙': { reviveChance: 0.50, reviveHpPct: 0.30, hpPct: 0.10, allPct: 0.05 },
  // ===== 融合/限定级宠物 =====
  '魔神之影': { atkPct: 0.15, magicDmgPct: 0.15 },
  '圣光龙神': { intPct: 0.15, regenPct: 0.05, healBoost: 0.20 },
  '永恒天使': { reviveChance: 0.30, reviveHpPct: 0.30, intPct: 0.12, healBoost: 0.15 },
  '虚空主宰': { intPct: 0.15, magicDmgPct: 0.15, mpRegenPct: 0.05 },
  '万物之母': { reviveChance: 0.30, reviveHpPct: 0.50, regenPct: 0.05, hpPct: 0.15 },
  // ===== T5 顶阶宠物 =====
  '远古龙神': { allPct: 0.10, atkPct: 0.10, hpPct: 0.10 },
  '创世天使': { reviveChance: 1.0, reviveHpPct: 0.40, intPct: 0.15, healBoost: 0.15 },
  '虚空魔神': { intPct: 0.15, magicDmgPct: 0.15, dodgeRate: 0.08 },
  '太初神兽': { allPct: 0.10, dmgReduce: 0.10, hpPct: 0.10 },
  '万古灵尊': { regenPct: 0.08, intPct: 0.12, hpPct: 0.10 },
  '灭世魔龙': { atkPct: 0.20, critRate: 0.10, magicDmgPct: 0.10 },
  '永夜主宰': { atkPct: 0.15, dodgeRate: 0.10, intPct: 0.10 },
  '圣渊天马': { spdPct: 0.20, atkPct: 0.12 },
  '混沌麒麟': { allPct: 0.08, atkPct: 0.08, regenPct: 0.03 },
  '乾坤龙尊': { allPct: 0.10, hpPct: 0.10, dmgReduce: 0.08 },
  // ===== 初级野生宠物 =====
  '小史莱姆': { dodgeRate: 0.08, defPct: 0.05, dmgReduce: 0.05 },
  '绿毛虫': { atkPct: 0.05, regenPct: 0.02 },
  '野鼠': { dodgeRate: 0.10, atkPct: 0.05, spdPct: 0.05 },
  '小精灵': { intPct: 0.05, healBoost: 0.10 },
  '雏鹰': { dodgeRate: 0.08, spdPct: 0.05 },
  '小恶魔': { magicDmgPct: 0.05, spdPct: 0.05 },
  '幼龙': { atkPct: 0.05, burnChance: 0.15, burnTurns: 2, burnPct: 0.05 },
  '蘑菇人': { defPct: 0.05, hpPct: 0.05, regenPct: 0.02 },
  '麻雀': { atkPct: 0.05, spdPct: 0.05 },
  '青蛙': { atkPct: 0.06, spdPct: 0.03 },
  '蝙蝠崽': { atkPct: 0.05, dodgeRate: 0.05 },
  '小地精': { dodgeRate: 0.08, defPct: 0.05 },
  '萤火虫': { intPct: 0.05, healBoost: 0.08 },
  '刺猬': { defPct: 0.05, reflectChance: 0.30, reflectPct: 0.10 },
  '蜗牛': { defPct: 0.08, hpPct: 0.05 },
  '小树精': { regenPct: 0.03, defPct: 0.05, dmgReduce: 0.05 },
  '蝌蚪': { allPct: 0.03, hpPct: 0.03 },
  '小龙崽': { atkPct: 0.05, allPct: 0.02 },
  '小骷髅': { dmgReduce: 0.08, reviveChance: 0.05, reviveHpPct: 0.10 },
  '灰尘怪': { dodgeRate: 0.08, spdPct: 0.03 },
  '花仙子': { healBoost: 0.12, intPct: 0.03 },
  '小石怪': { defPct: 0.08, reflectChance: 0.20, reflectPct: 0.20 },
  '风精灵': { spdPct: 0.08, dodgeRate: 0.05 },
  '小幽灵': { intPct: 0.05, magicDmgPct: 0.05 },
  '青苔蛇': { spdPct: 0.08, dodgeRate: 0.05 },
  '野猪': { atkPct: 0.08, hpPct: 0.05 },
  '泥潭怪': { defPct: 0.05, hpPct: 0.05 },
  '铜甲蟹': { defPct: 0.08, dmgReduce: 0.08 },
  '霜精灵': { intPct: 0.05, magicDmgPct: 0.05, dmgReduce: 0.03 },
  '幼狼': { atkPct: 0.06, spdPct: 0.05, lifestealPct: 0.03 },
  '火蜥蜴': { defPct: 0.05, dmgReduce: 0.05, regenPct: 0.02 },
  '黑鸦': { atkPct: 0.05, critRate: 0.05 },
  '小恶魔犬': { atkPct: 0.05, spdPct: 0.03 },
  '苔藓巨人': { regenPct: 0.04, defPct: 0.06, hpPct: 0.06 },
  '夜光蛾': { intPct: 0.05, magicDmgPct: 0.05 },
  '铁甲蚁': { defPct: 0.08, hpPct: 0.05, dmgReduce: 0.03 },
  '影狐': { atkPct: 0.08, critRate: 0.08, dodgeRate: 0.05 },
  '岩蜥蜴': { defPct: 0.08, dmgReduce: 0.05 },
  '霜狼': { atkPct: 0.06, spdPct: 0.05 },
  '光之子': { reviveChance: 0.10, reviveHpPct: 0.15, defPct: 0.05 },
  '腐尸虫': { magicDmgPct: 0.06, burnChance: 0.15, burnTurns: 2, burnPct: 0.05 },
  '碧眼猫': { critRate: 0.08, dodgeRate: 0.05 },
  '沙蝎': { atkPct: 0.06, defPct: 0.05 },
  '烈风雕': { spdPct: 0.08, atkPct: 0.06 },
  '寒冰蝶': { intPct: 0.06, magicDmgPct: 0.06 },
  '雷豹': { spdPct: 0.08, atkPct: 0.06, magicDmgPct: 0.05 },
  '玄冰麒麟': { intPct: 0.10, magicDmgPct: 0.12, dmgReduce: 0.05 },
  // ===== T1 弱阶宠物 =====
  '草蜢': { dodgeRate: 0.08, spdPct: 0.05 },
  '泥巴怪': { defPct: 0.06, hpPct: 0.05, dmgReduce: 0.03 },
  '小蜥蜴': { spdPct: 0.08, dodgeRate: 0.05, reviveChance: 0.10, reviveHpPct: 0.05 },
  '落叶虫': { dodgeRate: 0.06, defPct: 0.05 },
  '微光蝶': { intPct: 0.05, mpRegenPct: 0.05 },
  '小田鼠': { dodgeRate: 0.08, regenPct: 0.03 },
  '嫩芽精': { healBoost: 0.10, intPct: 0.04 },
  '水母崽': { intPct: 0.05, magicDmgPct: 0.04 },
  '灰羽雀': { spdPct: 0.05, dodgeRate: 0.04 },
  '小跳蛛': { atkPct: 0.06, spdPct: 0.05 },
  '苔藓鼠': { defPct: 0.05, dmgReduce: 0.05, dodgeRate: 0.04 },
  '小孢子': { healBoost: 0.08, regenPct: 0.02 },
  '风信子': { spdPct: 0.08, dodgeRate: 0.06 },
  '小石子': { defPct: 0.08, reflectChance: 0.20, reflectPct: 0.20 },
  '露珠精': { healBoost: 0.10, intPct: 0.04 },
  '萌新史莱姆': { dmgReduce: 0.10, dodgeRate: 0.05 },
  '稻草人': { reviveChance: 0.15, reviveHpPct: 0.05, defPct: 0.05 },
  '小野鸭': { dodgeRate: 0.10, spdPct: 0.05 },
  '飘浮气泡': { dmgReduce: 0.08, defPct: 0.05 },
  '弱小龙': { atkPct: 0.06, lowHpAtkBoost: 0.10 },
  // ===== T2 普通宠物 =====
  '林间鹿': { dodgeRate: 0.08, spdPct: 0.06 },
  '花斑豹': { atkPct: 0.10, critRate: 0.10 },
  '赤尾狐': { atkPct: 0.08, spdPct: 0.06 },
  '青铜蟹': { defPct: 0.10, dmgReduce: 0.08 },
  '丛林狼': { atkPct: 0.08, critRate: 0.05 },
  '月牙兔': { healBoost: 0.15, regenPct: 0.03 },
  '锈甲虫': { defPct: 0.08, dmgReduce: 0.05 },
  '雪雏': { dmgReduce: 0.08, defPct: 0.05 },
  '岩鸽': { spdPct: 0.08, dodgeRate: 0.06 },
  '暮色鸦': { dodgeRate: 0.08, spdPct: 0.05 },
  '苔甲蜥': { regenPct: 0.04, defPct: 0.06 },
  '幼麒麟': { allPct: 0.05, hpPct: 0.05 },
  '翡翠蛙': { dmgReduce: 0.06, regenPct: 0.02 },
  '流火蜥': { atkPct: 0.08, burnChance: 0.15, burnTurns: 2, burnPct: 0.05 },
  '寒霜鼠': { spdPct: 0.10, atkPct: 0.05 },
  '晨曦鹿': { healBoost: 0.12, intPct: 0.05 },
  '巨角羊': { defPct: 0.08, hpPct: 0.06, reflectChance: 0.20, reflectPct: 0.15 },
  '紫羽鸽': { dodgeRate: 0.08, spdPct: 0.05 },
  '暗影貂': { dodgeRate: 0.10, critRate: 0.08, spdPct: 0.06 },
  '银背猿': { atkPct: 0.10, defPct: 0.06 },
  '烈日甲虫': { defPct: 0.10, dmgReduce: 0.05 },
  '蓝鳉鱼': { allPct: 0.05, hpPct: 0.05 },
  '灰岩龟': { defPct: 0.10, dmgReduce: 0.10 },
  '啼鸣鸟': { dodgeRate: 0.06, spdPct: 0.05 },
  '朱砂蝶': { intPct: 0.06, magicDmgPct: 0.06 },
  // ===== T3 中阶宠物 =====
  '银鳞龙': { intPct: 0.08, magicDmgPct: 0.08, reflectChance: 0.15, reflectPct: 0.50 },
  '烬羽鸟': { atkPct: 0.08, burnChance: 0.20, burnTurns: 2, burnPct: 0.05 },
  '玄铁犀': { defPct: 0.10, hpPct: 0.08, dmgReduce: 0.06 },
  '翠风狼': { spdPct: 0.10, atkPct: 0.06 },
  '紫电隼': { atkPct: 0.10, magicDmgPct: 0.08, critRate: 0.05 },
  '落日虎': { atkPct: 0.12, critRate: 0.08 },
  '蓝月狐': { intPct: 0.10, magicDmgPct: 0.08, dodgeRate: 0.06 },
  '烈焰犬': { atkPct: 0.10, lifestealPct: 0.05 },
  '碎石龟': { defPct: 0.10, hpPct: 0.08, reflectChance: 0.15, reflectPct: 0.20 },
  '寒林鹿': { healBoost: 0.12, intPct: 0.06, dmgReduce: 0.05 },
  '翔云马': { spdPct: 0.12, dodgeRate: 0.06 },
  '雷羽雀': { magicDmgPct: 0.10, atkPct: 0.06 },
  '血藤蛇': { magicDmgPct: 0.08, lifestealPct: 0.08 },
  '沙暴蝎': { dodgeRate: 0.15, atkPct: 0.06 },
  '星纹豹': { dodgeRate: 0.12, critRate: 0.08, spdPct: 0.08 },
  '月华蝶': { intPct: 0.12, magicDmgPct: 0.10 },
  '赤焰马': { atkPct: 0.10, spdPct: 0.08 },
  '青木猿': { atkPct: 0.10, defPct: 0.05 },
  '玄冰蛇': { intPct: 0.10, magicDmgPct: 0.08, spdPct: 0.05 },
  '幻影鸦': { dodgeRate: 0.10, spdPct: 0.08 },
  '黄昏狮': { atkPct: 0.10, critRate: 0.10 },
  '焦土龟': { defPct: 0.08, burnChance: 0.15, burnTurns: 2, burnPct: 0.05 },
  '银光鹿': { healBoost: 0.12, intPct: 0.06, regenPct: 0.02 },
  '霜羽雕': { atkPct: 0.08, spdPct: 0.06, dmgReduce: 0.05 },
  '紫晶蝶': { intPct: 0.10, magicDmgPct: 0.08 },
  // ===== T4 强阶宠物 =====
  '烈焰龙骑': { atkPct: 0.12, burnChance: 0.25, burnTurns: 3, burnPct: 0.05 },
  '寒冰女王': { intPct: 0.12, magicDmgPct: 0.15, critRate: 0.10 },
  '雷霆战狼': { atkPct: 0.12, critRate: 0.08, magicDmgPct: 0.08 },
  '圣光审判': { atkPct: 0.12, extraDmgVsDemon: 0.30, defPct: 0.05 },
  '暗影刺客': { atkPct: 0.15, critRate: 0.12, critDmg: 0.10 },
  '翡翠守护': { defPct: 0.12, hpPct: 0.10, dmgReduce: 0.08 },
  '风暴巨雕': { atkPct: 0.10, spdPct: 0.10, dodgeRate: 0.08 },
  '玄铁巨兽': { defPct: 0.15, hpPct: 0.12, dmgReduce: 0.12 },
  '烈日战神': { atkPct: 0.15, dmgReduce: 0.08 },
  '幽冥蛇君': { intPct: 0.12, magicDmgPct: 0.12, burnChance: 0.20, burnTurns: 3, burnPct: 0.05 },
  '紫电战虎': { atkPct: 0.12, magicDmgPct: 0.10, critRate: 0.08 },
  '苍穹龙': { allPct: 0.08, atkPct: 0.08, extraDmgVsNonDragon: 0.05 },
  '焚天魔': { atkPct: 0.15, burnChance: 0.30, burnTurns: 2, burnPct: 0.08 },
  '冰封王': { intPct: 0.12, magicDmgPct: 0.15, dmgReduce: 0.05 },
  '圣辉麒麟': { defPct: 0.10, hpPct: 0.08, regenPct: 0.04, healBoost: 0.10 },
  '暗夜君王': { atkPct: 0.12, dodgeRate: 0.10, hpPct: 0.08 },
  '千年古树': { regenPct: 0.06, defPct: 0.10, hpPct: 0.12 },
  '雷陨巨猿': { atkPct: 0.15, critRate: 0.10 },
  '烈风隼王': { atkPct: 0.12, critRate: 0.12, spdPct: 0.10 },
  '玄冥蛟': { defPct: 0.10, hpPct: 0.10, intPct: 0.08, dmgReduce: 0.05 },
};

// 格式化血统效果为中文描述字符串
function formatBloodlineEffects(effects) {
  if (!effects) return '';
  return Object.keys(effects).map(function(k) {
    var label = BLOODLINE_EFFECT_NAMES[k] || k;
    var v = effects[k];
    if (BLOODLINE_EFFECT_FLAT[k]) return label + '+' + v;
    return label + '+' + (Math.round(v * 1000) / 10) + '%';
  }).join('，');
}

// 基于宠物名生成独特血统技能（融合限定与血统珠保持原逻辑）
function generatePetBloodlineSkill(pet) {
  if (!pet || !pet.name) return null;
  // 融合限定宠物保持原血统
  var fusionBlMap = FUSION_PET_BLOODLINES || {};
  if (fusionBlMap[pet.name]) {
    return BLOODLINE_SKILLS.find(function(b) { return b.id === fusionBlMap[pet.name]; });
  }
  // 已植入血统珠
  if (pet.bloodlineOrb && pet.bloodlineOrb.bloodlineId) {
    return BLOODLINE_SKILLS.find(function(b) { return b.id === pet.bloodlineOrb.bloodlineId; });
  }
// 需求4：基于宠物名生成独特血统
var dex = getPetDex(pet.name);
var specialty = dex.specialty || 'balanced';
var stage = pet.advanceStage || 0;
var mult = stage === 2 ? 2.0 : stage === 1 ? 1.5 : 1.0;
// 优先使用 PET_BLOODLINE_EFFECTS 中的专属效果（与描述对应）
var customEffects = (typeof PET_BLOODLINE_EFFECTS !== 'undefined' && PET_BLOODLINE_EFFECTS[pet.name]) || null;
var baseEffects = customEffects || BLOODLINE_EFFECT_PRESETS[specialty] || BLOODLINE_EFFECT_PRESETS.balanced;
var effects = {};
Object.keys(baseEffects).forEach(function(k) {
effects[k] = Math.round(baseEffects[k] * mult * 100) / 100;
});
  var blId = 'bl_' + pet.name;
  var tier = getPetTier(pet.name);
  // 优先使用 PET_BLOODLINE_DEX 中的专属名称与描述
  var dexEntry = PET_BLOODLINE_DEX ? PET_BLOODLINE_DEX[pet.name] : null;
  var blName = dexEntry ? dexEntry.name : (pet.name + '之血');
  // 需求1：desc 只保留一份描述，不再追加"当前效果：xxx"和"（进阶+N 强化×M）"黄色字样
  var specLabel = { physical: '物理', magic: '法术', defense: '防御', speed: '速度', balanced: '均衡' }[specialty] || '均衡';
  var desc;
  if (dexEntry) {
    // 仅使用 PET_BLOODLINE_DEX 的专属描述（前缀专长标签便于识别）
    desc = '【' + specLabel + '系】' + dexEntry.desc;
  } else {
    // 无专属描述时，使用效果数值作为描述
    var effectStr = formatBloodlineEffects(effects);
    desc = '【' + specLabel + '系血统】' + effectStr;
  }
  return { id: blId, name: blName, type: 'bloodline', race: dex.race, tier: tier, desc: desc, effects: effects, specialty: specialty };
}

// 根据宠物名获取其专属血统技能ID（基于名字哈希 + 种族 + 专长）
// 同一宠物名始终返回相同血统（确定性）
function getPetBloodlineId(petName) {
  var dex = getPetDex(petName);
  var race = dex.race;
  var specialty = dex.specialty || 'balanced';
  // 该种族的所有血统变体
  var variants = BLOODLINE_SKILLS.filter(function(b) { return b.race === race && !b.special; });
  if (variants.length === 0) return 'slime_body';
  // 按专长 + 名字哈希选择一个变体
  var specialtyMap = { physical: 0, defense: 1, magic: 2, speed: 3, balanced: 0 };
  var baseIdx = specialtyMap[specialty] || 0;
  if (baseIdx >= variants.length) baseIdx = 0;
  // 名字哈希：用于在4个变体中选择一个，让同种专长的宠物之间也有差异
  var hash = 0;
  for (var i = 0; i < petName.length; i++) {
    hash = (hash * 31 + petName.charCodeAt(i)) | 0;
  }
  var idx = (baseIdx + (hash % variants.length)) % variants.length;
  return variants[idx].id;
}

// 融合限定宠物的专属血统
const FUSION_PET_BLOODLINES = {
  '混元圣兽': 'chaos_blood',
  '灭世魔神': 'inferno_blood',
  '时空龙神': 'timewalker_blood',
};

// 获取宠物血统技能对象（含提取/移植的血统珠覆盖）
function getPetBloodlineSkill(pet) {
  return generatePetBloodlineSkill(pet);
}

const ACTIVE_SKILLS = [
  // ===== 单体攻击 =====
  // 伤害公式：rawDmg = power × dmgPct × skillDmgMult − def × (0.7 − ignoreDefPct)，±10%波动
  // power：物理技能=攻击力，法术技能=灵力；skillDmgMult = 1 + 被动技能加成
  // 暴击率 = 10% + 被动critRate + 技能bonusCrit + 玩家critRate；暴击伤害×1.5
  { id: 'flame_strike', name: '烈焰冲击', type: 'active', category: 'single_atk', desc: '【物理·单体】对单体造成 150% 攻击力的火焰伤害。\n伤害公式：攻击力×1.5×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%，暴击造成1.5倍伤害。', element: '火', dmgPct: 1.5, cd: 0, target: 'enemy_front' },
  { id: 'ice_arrow', name: '寒冰箭', type: 'active', category: 'single_atk', desc: '【法术·单体】对单体造成 130% 灵力的冰系伤害。\n伤害公式：灵力×1.3×技能加成 − 目标防御×0.7。\n30%概率冻结目标1回合（无法行动）。\n基础暴击率10%。', element: '冰', dmgPct: 1.3, cd: 0, target: 'enemy_front', freezeChance: 0.30, freezeTurns: 1 },
  { id: 'thunder_strike', name: '雷霆一击', type: 'active', category: 'single_atk', desc: '【法术·单体·必中】对单体造成 180% 灵力的雷系伤害，必定命中。\n伤害公式：灵力×1.8×技能加成 − 目标防御×0.7。\n基础暴击率10%。', element: '雷', dmgPct: 1.8, cd: 0, target: 'enemy_front', alwaysHit: true },
  { id: 'shadow_strike', name: '暗影突袭', type: 'active', category: 'single_atk', desc: '【法术·单体】对单体造成 140% 灵力的暗影伤害，无视30%防御。\n伤害公式：灵力×1.4×技能加成 − 目标防御×(0.7−0.3)=×0.4。\n基础暴击率10%。', element: '暗', dmgPct: 1.4, cd: 0, target: 'enemy_front', ignoreDefPct: 0.30 },
  { id: 'armor_break', name: '破甲击', type: 'active', category: 'single_atk', desc: '【物理·单体】对单体造成 120% 攻击力的伤害，并降低目标30%防御2回合。\n伤害公式：攻击力×1.2×技能加成 − 目标防御×0.7。\n基础暴击率10%。', element: '无', dmgPct: 1.2, cd: 0, target: 'enemy_front', defReduce: 0.30, defReduceTurns: 2 },
  { id: 'blood_drain', name: '吸血攻击', type: 'active', category: 'single_atk', desc: '【法术·单体】对单体造成 130% 灵力的暗影伤害，吸血50%。\n伤害公式：灵力×1.3×技能加成 − 目标防御×0.7。\n回复量 = 造成伤害×50%。基础暴击率10%。', element: '暗', dmgPct: 1.3, cd: 0, target: 'enemy_front', vampPct: 0.50 },
  { id: 'double_slash', name: '连续斩', type: 'active', category: 'single_atk', desc: '【物理·单体·双击】攻击2次，首击造成 80% 攻击力伤害，次击造成 64%（80%×0.8）伤害。\n总伤害 ≈ 攻击力×1.44×技能加成 − 目标防御×1.4。\n每击独立判定暴击（基础10%）。', element: '无', dmgPct: 0.8, cd: 0, target: 'enemy_front', hits: 2 },
  { id: 'fatal_blow', name: '致命一击', type: 'active', category: 'single_atk', desc: '【物理·单体·高暴击】对单体造成 250% 攻击力的伤害，额外+30%暴击率。\n伤害公式：攻击力×2.5×技能加成 − 目标防御×0.7。\n暴击率 = 10%+30%+被动加成（暴击×1.5）。', element: '无', dmgPct: 2.5, cd: 0, target: 'enemy_front', bonusCrit: 0.30 },
  { id: 'poison_fang', name: '毒牙撕咬', type: 'active', category: 'single_atk', desc: '【法术·单体·持续】对单体造成 100% 灵力的毒系伤害，附加中毒3回合。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。\n中毒效果：每回合损失目标5%最大气血。基础暴击率10%。', element: '毒', dmgPct: 1.0, cd: 0, target: 'enemy_front', poisonTurns: 3, poisonPct: 0.05 },
  { id: 'doom_judge', name: '末日审判', type: 'active', category: 'single_atk', desc: '【法术·单体·自损】对单体造成 300% 灵力的暗影伤害，自损10%最大气血。\n伤害公式：灵力×3.0×技能加成 − 目标防御×0.7。\n自损 = 自身最大气血×10%。基础暴击率10%。', element: '暗', dmgPct: 3.0, cd: 0, target: 'enemy_front', selfDmgPct: 0.10 },
  // ===== 群体攻击 =====
  { id: 'meteor', name: '陨石天降', type: 'active', category: 'aoe_atk', desc: '【物理·群体·秒3】对3个目标造成 80% 攻击力的火焰伤害。\n每目标伤害：攻击力×0.8×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%。', element: '火', dmgPct: 0.8, cd: 0, target: 'enemy_all', targetCount: 3 },
  { id: 'blizzard', name: '暴风雪', type: 'active', category: 'aoe_atk', desc: '【法术·群体·秒4·控制】对4个目标造成 60% 灵力的冰系伤害，20%概率冻结1回合。\n伤害公式：灵力×0.6×技能加成 − 目标防御×0.7。\n冻结：无法行动。', element: '冰', dmgPct: 0.6, cd: 0, target: 'enemy_all', targetCount: 4, freezeChance: 0.20, freezeTurns: 1 },
  { id: 'lightning_chain', name: '闪电链', type: 'active', category: 'aoe_atk', desc: '【法术·全体】对全体敌人造成 110% 灵力的雷系伤害。\n伤害公式：灵力×1.1×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%。', element: '雷', dmgPct: 1.1, cd: 0, target: 'enemy_all' },
  { id: 'shadow_burst', name: '暗影爆发', type: 'active', category: 'aoe_atk', desc: '【法术·全体·吸血】对全体敌人造成 100% 灵力的暗影伤害，吸血10%。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。\n回复量 = 总伤害×10%。', element: '暗', dmgPct: 1.0, cd: 0, target: 'enemy_all', vampPct: 0.10 },
  { id: 'flame_storm', name: '烈焰风暴', type: 'active', category: 'aoe_atk', desc: '【物理·群体·秒3·持续】对3个目标造成 85% 攻击力的火焰伤害，附加燃烧2回合。\n伤害公式：攻击力×0.85×技能加成 − 目标防御×0.7。\n燃烧：每回合损失5%最大气血。', element: '火', dmgPct: 0.85, cd: 0, target: 'enemy_all', targetCount: 3, burnTurns: 2, burnPct: 0.05 },
  { id: 'poison_mist', name: '毒雾', type: 'active', category: 'aoe_atk', desc: '【法术·群体·秒4·持续】对4个目标造成 50% 灵力的毒系伤害，全体中毒3回合。\n伤害公式：灵力×0.5×技能加成 − 目标防御×0.7。\n中毒：每回合损失5%最大气血。', element: '毒', dmgPct: 0.5, cd: 0, target: 'enemy_all', targetCount: 4, poisonTurns: 3, poisonPct: 0.05 },
  { id: 'earth_crack', name: '地裂术', type: 'active', category: 'aoe_atk', desc: '【物理·全体·控制】对全体敌人造成 150% 攻击力的伤害，30%概率眩晕1回合。\n伤害公式：攻击力×1.5×技能加成 − 目标防御×0.7。', element: '无', dmgPct: 1.5, cd: 0, target: 'enemy_all', stunChance: 0.30, stunTurns: 1 },
  // ===== 单体治疗 =====
  // 治疗公式：heal = 目标最大气血×healPct + 施法者灵力×0.5
  { id: 'holy_light', name: '圣光术', type: 'active', category: 'single_heal', desc: '【治疗·单体·秒3】恢复生命最低3个友方 25% 最大气血。\n治疗公式：目标最大气血×25% + 施法者灵力×50%。', element: '光', healPct: 0.25, dmgPct: 0.7, cd: 0, target: 'ally_lowest', targetCount: 3 },
  { id: 'cure', name: '治愈术', type: 'active', category: 'single_heal', desc: '【治疗·单体】恢复生命最低友方 40% 最大气血。\n治疗公式：目标最大气血×40% + 施法者灵力×50%。', element: '光', healPct: 0.40, cd: 0, target: 'ally_lowest' },
  { id: 'emergency_heal', name: '急救术', type: 'active', category: 'single_heal', desc: '【治疗·单体·冷却】恢复生命最低友方 60% 最大气血，冷却3回合。\n治疗公式：目标最大气血×60% + 施法者灵力×50%。', element: '光', healPct: 0.60, cd: 3, target: 'ally_lowest' },
  { id: 'life_bloom', name: '生命绽放', type: 'active', category: 'single_heal', desc: '【持续治疗·单体】生命最低友方每回合恢复 10% 最大气血，持续3回合。\n总治疗量 = 目标最大气血×30%。', element: '光', hotPct: 0.10, hotTurns: 3, cd: 0, target: 'ally_lowest' },
  // ===== 群体治疗 =====
  { id: 'heal_wind', name: '治愈之风', type: 'active', category: 'aoe_heal', desc: '【治疗·全体】全体友方恢复 15% 最大气血。\n治疗公式：各友方最大气血×15% + 施法者灵力×50%。', element: '光', healPct: 0.15, cd: 0, target: 'ally_all' },
  { id: 'holy_radiance', name: '神圣光辉', type: 'active', category: 'aoe_heal', desc: '【治疗·全体】全体友方恢复 25% 最大气血。\n治疗公式：各友方最大气血×25% + 施法者灵力×50%。', element: '光', healPct: 0.25, cd: 0, target: 'ally_all' },
  { id: 'life_spring', name: '生命之泉', type: 'active', category: 'aoe_heal', desc: '【持续治疗·全体】全体友方每回合恢复 8% 最大气血，持续3回合。\n总治疗量 = 各友方最大气血×24%。', element: '光', hotPct: 0.08, hotTurns: 3, cd: 0, target: 'ally_all' },
  // ===== 单体控制 =====
  { id: 'freeze', name: '冰冻术', type: 'active', category: 'single_cc', desc: '【法术·单体·控制】对单体造成 100% 灵力的冰系伤害，50%概率冻结2回合。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。\n冻结：无法行动2回合。', element: '冰', dmgPct: 1.0, cd: 0, target: 'enemy_front', freezeChance: 0.50, freezeTurns: 2 },
  { id: 'stun_strike', name: '眩晕击', type: 'active', category: 'single_cc', desc: '【物理·单体·控制】对单体造成 80% 攻击力的伤害，40%概率眩晕1回合。\n伤害公式：攻击力×0.8×技能加成 − 目标防御×0.7。\n眩晕：无法行动。', element: '无', dmgPct: 0.8, cd: 0, target: 'enemy_front', stunChance: 0.40, stunTurns: 1 },
  { id: 'silence', name: '沉默术', type: 'active', category: 'single_cc', desc: '【法术·单体·控制】对单体造成 60% 灵力的暗影伤害，35%概率沉默2回合。\n伤害公式：灵力×0.6×技能加成 − 目标防御×0.7。\n沉默：无法使用主动技能。', element: '暗', dmgPct: 0.6, cd: 0, target: 'enemy_front', silenceChance: 0.35, silenceTurns: 2 },
  { id: 'entangle', name: '缠绕', type: 'active', category: 'single_cc', desc: '【物理·单体·控制】对单体造成 70% 攻击力的伤害，45%概率定身2回合。\n伤害公式：攻击力×0.7×技能加成 − 目标防御×0.7。\n定身：无法行动。', element: '无', dmgPct: 0.7, cd: 0, target: 'enemy_front', rootChance: 0.45, rootTurns: 2 },
  // ===== 群体控制 =====
  { id: 'mass_freeze', name: '群体冰冻', type: 'active', category: 'aoe_cc', desc: '【法术·全体·控制】对全体敌人造成 60% 灵力的冰系伤害，30%概率冻结1回合。\n伤害公式：灵力×0.6×技能加成 − 目标防御×0.7。', element: '冰', dmgPct: 0.6, cd: 0, target: 'enemy_all', freezeChance: 0.30, freezeTurns: 1 },
  { id: 'earthquake', name: '地震术', type: 'active', category: 'aoe_cc', desc: '【物理·全体·控制】对全体敌人造成 70% 攻击力的伤害，25%概率眩晕1回合。\n伤害公式：攻击力×0.7×技能加成 − 目标防御×0.7。', element: '无', dmgPct: 0.7, cd: 0, target: 'enemy_all', stunChance: 0.25, stunTurns: 1 },
  { id: 'hypnosis', name: '催眠术', type: 'active', category: 'aoe_cc', desc: '【法术·全体·控制】对全体敌人造成 40% 灵力的暗影伤害，20%概率睡眠1回合。\n伤害公式：灵力×0.4×技能加成 − 目标防御×0.7。\n睡眠：无法行动，受到攻击会醒来。', element: '暗', dmgPct: 0.4, cd: 0, target: 'enemy_all', sleepChance: 0.20, sleepTurns: 1 },
  // ===== 单体辅助 =====
  { id: 'berserk', name: '狂暴', type: 'active', category: 'single_buff', desc: '【增益·自身·冷却】自身攻击力+50%，持续3回合，冷却5回合。\n攻击力提升 = 基础攻击力×50%。', element: '无', atkBuff: 0.50, buffTurns: 3, cd: 5, target: 'ally_self' },
  { id: 'iron_wall', name: '铁壁', type: 'active', category: 'single_buff', desc: '【增益·自身·冷却】自身防御力+50%，持续3回合，冷却5回合。\n防御力提升 = 基础防御力×50%。', element: '无', defBuff: 0.50, buffTurns: 3, cd: 5, target: 'ally_self' },
  { id: 'haste', name: '加速', type: 'active', category: 'single_buff', desc: '【增益·自身】自身速度+40%，持续3回合。\n速度提升 = 基础速度×40%。', element: '无', spdBuff: 0.40, buffTurns: 3, cd: 0, target: 'ally_self' },
  { id: 'guard_shield', name: '护盾', type: 'active', category: 'single_buff', desc: '【护盾·自身】自身获得 40% 最大气血的护盾，吸收伤害。\n护盾值 = 自身最大气血×40%。', element: '光', shieldPct: 0.40, cd: 0, target: 'ally_self' },
  { id: 'blessing', name: '祝福', type: 'active', category: 'single_buff', desc: '【增益·自身】自身全属性+15%，持续3回合。\n全属性 = 攻击/防御/速度/灵力 均提升15%。', element: '光', allBuff: 0.15, buffTurns: 3, cd: 0, target: 'ally_self' },
  // ===== 群体辅助 =====
  { id: 'power_aura_active', name: '力量光环（主动）', type: 'active', category: 'aoe_buff', desc: '【增益·全体】全体友方攻击力+20%，持续3回合。\n攻击力提升 = 各友方基础攻击力×20%。', element: '无', atkBuff: 0.20, buffTurns: 3, cd: 0, target: 'ally_all' },
  { id: 'guard_aura_active', name: '守护光环（主动）', type: 'active', category: 'aoe_buff', desc: '【增益·全体】全体友方防御力+20%，持续3回合。\n防御力提升 = 各友方基础防御力×20%。', element: '无', defBuff: 0.20, buffTurns: 3, cd: 0, target: 'ally_all' },
  { id: 'mass_haste', name: '群体加速', type: 'active', category: 'aoe_buff', desc: '【增益·全体】全体友方速度+25%，持续3回合。\n速度提升 = 各友方基础速度×25%。', element: '无', spdBuff: 0.25, buffTurns: 3, cd: 0, target: 'ally_all' },
  { id: 'mass_shield', name: '群体护盾', type: 'active', category: 'aoe_buff', desc: '【护盾·全体】全体友方获得 20% 最大气血的护盾，吸收伤害。\n护盾值 = 各友方最大气血×20%。', element: '光', shieldPct: 0.20, cd: 0, target: 'ally_all' },
  // ===== 参考长安幻想主动技能 =====
  { id: 'flame_charge', name: '烈焰冲撞', type: 'active', category: 'aoe_atk', desc: '【物理·群体】对2个目标造成 120% 攻击力的火焰伤害。\n每目标伤害：攻击力×1.2×技能加成 − 目标防御×0.7（±10%波动）。', element: '火', dmgPct: 1.2, cd: 0, target: 'enemy_all' },
  { id: 'thunder_spell', name: '奔雷咒', type: 'active', category: 'aoe_atk', desc: '【法术·全体】对全体敌人造成 125% 灵力的雷系伤害。\n伤害公式：灵力×1.25×技能加成 − 目标防御×0.7（±10%波动）。', element: '雷', dmgPct: 1.25, cd: 0, target: 'enemy_all' },
  { id: 'water_deluge', name: '碧水滔天', type: 'active', category: 'aoe_atk', desc: '【物理·群体·秒4】对4个目标造成 55% 攻击力的水系伤害，附带减速效果。\n伤害公式：攻击力×0.55×技能加成 − 目标防御×0.7。', element: '水', dmgPct: 0.55, cd: 0, target: 'enemy_all', targetCount: 4 },
  { id: 'mountain_crush', name: '泰山压顶', type: 'active', category: 'aoe_cc', desc: '【物理·全体·控制】对全体敌人造成 135% 攻击力的土系伤害，25%概率眩晕1回合。\n伤害公式：攻击力×1.35×技能加成 − 目标防御×0.7。', element: '土', dmgPct: 1.35, cd: 0, target: 'enemy_all', stunChance: 0.25, stunTurns: 1 },
  { id: 'soul_slash', name: '裂魂斩', type: 'active', category: 'single_atk', desc: '【物理·单体】对单体造成 200% 攻击力的伤害。\n伤害公式：攻击力×2.0×技能加成 − 目标防御×0.7（±10%波动）。\n基础暴击率10%。', element: '无', dmgPct: 2.0, cd: 0, target: 'enemy_front' },
  { id: 'soul_search', name: '搜魂斩', type: 'active', category: 'aoe_atk', desc: '【物理·群体】横扫3个目标，每个造成 90% 攻击力的物理伤害。\n每目标伤害：攻击力×0.9×技能加成 − 目标防御×0.7。', element: '无', dmgPct: 0.9, cd: 0, target: 'enemy_all' },
  { id: 'dream_butterfly', name: '梦蝶', type: 'active', category: 'single_cc', desc: '【法术·单体·控制】对单体造成 80% 灵力的暗影伤害，35%概率附加梦魇（沉默）2回合。\n伤害公式：灵力×0.8×技能加成 − 目标防御×0.7。', element: '暗', dmgPct: 0.8, cd: 0, target: 'enemy_front', silenceChance: 0.35, silenceTurns: 2 },
  { id: 'butterfly_tide', name: '蝶潮', type: 'active', category: 'aoe_cc', desc: '【法术·群体·秒5·控制】对5个目标造成 45% 灵力的暗影伤害，20%概率附加梦魇（睡眠）1回合。\n伤害公式：灵力×0.45×技能加成 − 目标防御×0.7。', element: '暗', dmgPct: 0.45, cd: 0, target: 'enemy_all', targetCount: 5, sleepChance: 0.20, sleepTurns: 1 },
  { id: 'buddha_seal', name: '佛佑圣印', type: 'active', category: 'single_atk', desc: '【法术·单体·治疗】对单体造成 160% 灵力的光系伤害，并为主人回复10%最大气血。\n伤害公式：灵力×1.6×技能加成 − 目标防御×0.7。', element: '光', dmgPct: 1.6, cd: 0, target: 'enemy_front', postHealPct: 0.10, postHealTarget: 'self' },
  { id: 'buddha_quake', name: '佛行震地', type: 'active', category: 'aoe_atk', desc: '【法术·群体·秒5·治疗】对5个目标造成 50% 灵力的光系伤害，并回复生命最低友方20%最大气血。\n伤害公式：灵力×0.5×技能加成 − 目标防御×0.7。', element: '光', dmgPct: 0.5, cd: 0, target: 'enemy_all', targetCount: 5, postHealPct: 0.20, postHealTarget: 'lowest' },
  // ===== 融合限定特殊宠物独有主动技能 =====
  { id: 'chaos_strike', name: '混元一击', type: 'active', category: 'aoe_atk', desc: '【物理·全体·融合限定】混元之力对全体敌人造成 200% 攻击力的伤害，并回复全队30%最大气血。\n伤害公式：攻击力×2.0×技能加成 − 目标防御×0.7。\n治疗量 = 各友方最大气血×30%。', element: '混沌', dmgPct: 2.0, cd: 0, target: 'enemy_all', postHealPct: 0.30, postHealTarget: 'team' },
  { id: 'doom_inferno', name: '灭世之炎', type: 'active', category: 'aoe_cc', desc: '【物理·全体·融合限定】对全体敌人造成 220% 攻击力的火焰伤害，50%概率附加灼烧3回合。\n伤害公式：攻击力×2.2×技能加成 − 目标防御×0.7。\n灼烧：每回合损失5%最大气血。', element: '火', dmgPct: 2.2, cd: 0, target: 'enemy_all', burnChance: 0.50, burnTurns: 3 },
  { id: 'time_rift', name: '时空断裂', type: 'active', category: 'single_atk', desc: '【物理·单体·必暴·融合限定】对单体造成 300% 攻击力的时空伤害，必定暴击，35%概率眩晕2回合。\n伤害公式：攻击力×3.0×技能加成×1.5（暴击）− 目标防御×0.7。', element: '时空', dmgPct: 3.0, cd: 0, target: 'enemy_front', stunChance: 0.35, stunTurns: 2 },
  // ===== 创新主动技能（参考长安幻想） =====
  // 多段伤害：5连击，单次低伤害但总伤可观
  { id: 'thousand_blades', name: '千刀斩', type: 'active', category: 'single_atk', desc: '【物理·单体·5连击】极速斩击5次，首击50%攻击力，后续每击递减20%。\n每击伤害：攻击力×0.5×(0.8^i)×技能加成 − 目标防御×0.7（每击独立判定暴击）。\n总伤害 ≈ 攻击力×1.6×技能加成 − 目标防御×3.5。', element: '无', dmgPct: 0.5, cd: 0, target: 'enemy_front', hits: 5, decayPerHit: 0.20 },
  // 叠加型持续伤害：每次施放增加毒层数
  { id: 'venom_coil', name: '毒蛇缠', type: 'active', category: 'single_atk', desc: '【法术·单体·叠加毒】对单体造成 90% 灵力的毒系伤害，附加可叠加的中毒。\n伤害公式：灵力×0.9×技能加成 − 目标防御×0.7。\n每次施放中毒层数+1，每层每回合损失3%最大气血（最高5层）。', element: '毒', dmgPct: 0.9, cd: 0, target: 'enemy_front', stackPoison: true, poisonTurns: 3, poisonPctPerStack: 0.03, maxPoisonStacks: 5 },
  // 斩杀型：目标血量低于阈值时伤害翻倍
  { id: 'execute_blade', name: '斩杀之刃', type: 'active', category: 'single_atk', desc: '【物理·单体·斩杀】对单体造成 130% 攻击力的伤害，目标血量低于30%时伤害×2.5。\n伤害公式：攻击力×1.3×技能加成×(目标血量<30%?2.5:1) − 目标防御×0.7。', element: '无', dmgPct: 1.3, cd: 0, target: 'enemy_front', executeThreshold: 0.30, executeMult: 2.5 },
  // 真实伤害：无视防御
  { id: 'true_blade', name: '真实之刃', type: 'active', category: 'single_atk', desc: '【物理·单体·真伤】对单体造成 110% 攻击力的真实伤害，无视目标防御。\n伤害公式：攻击力×1.1×技能加成（不减防御）。基础暴击率10%。', element: '无', dmgPct: 1.1, cd: 0, target: 'enemy_front', trueDmg: true },
  // 多段群体伤害
  { id: 'thunderous_might', name: '雷霆万钧', type: 'active', category: 'aoe_atk', desc: '【法术·群体·3连击】对全体敌人连续3次雷系伤害，每次55%灵力。\n每击伤害：灵力×0.55×技能加成 − 目标防御×0.7（每击独立判定暴击）。', element: '雷', dmgPct: 0.55, cd: 0, target: 'enemy_all', hits: 3 },
  // 反击状态：受击时反击
  { id: 'counter_stance', name: '反击姿态', type: 'active', category: 'single_buff', desc: '【增益·自身·反击·冷却】进入反击姿态3回合，受到攻击时反击造成60%攻击力伤害，冷却3回合。\n反击伤害 = 攻击力×60%。', element: '无', counterBuff: 0.60, buffTurns: 3, cd: 3, target: 'ally_self' },
  // 反射+护盾：反弹伤害并吸收
  { id: 'thorn_shield', name: '荆棘护盾', type: 'active', category: 'single_buff', desc: '【增益·自身·反射】获得20%最大气血护盾，并反弹50%受到的伤害，持续3回合。\n护盾值 = 自身最大气血×20%。反射伤害 = 受到伤害×50%。', element: '光', reflectBuff: 0.50, reflectTurns: 3, shieldPct: 0.20, cd: 0, target: 'ally_self' },
  // 净化治疗：清除debuff
  { id: 'purify_light', name: '净化之光', type: 'active', category: 'single_heal', desc: '【治疗·单体·净化】恢复生命最低友方30%最大气血，并清除所有负面状态（中毒/燃烧/眩晕/冻结/沉默/定身/睡眠）。\n治疗公式：目标最大气血×30% + 施法者灵力×50%。', element: '光', healPct: 0.30, cleanse: true, cd: 0, target: 'ally_lowest' },
  // 时光倒流：复活已阵亡队友
  { id: 'time_reverse', name: '时光倒流', type: 'active', category: 'aoe_heal', desc: '【治疗·全体·复活·冷却】复活已阵亡的友方（恢复30%气血），并全体恢复15%最大气血，冷却6回合。\n治疗公式：各友方最大气血×15% + 施法者灵力×50%。复活量 = 最大气血×30%。', element: '光', healPct: 0.15, revive: true, revivePct: 0.30, cd: 6, target: 'ally_all' },
  // ===== 需求3：复活类辅助技能 =====
  // 单体复活：复活已阵亡队友
  { id: 'resurrection', name: '复活术', type: 'active', category: 'single_heal', quality: 'rare',
    desc: '【复活·单体·冷却】复活已阵亡的友方，恢复40%最大气血，冷却4回合。\n复活量 = 目标最大气血×40% + 施法者灵力×30%。',
    element: '光', revive: true, revivePct: 0.40, cd: 4, target: 'ally_dead' },
  // 高级单体复活：复活+持续恢复
  { id: 'phoenix_revive', name: '凤凰涅槃', type: 'active', category: 'single_heal', quality: 'epic',
    desc: '【复活·单体·持续恢复·冷却】复活已阵亡的友方，恢复50%最大气血，并使其每回合恢复10%气血，持续3回合，冷却5回合。\n复活量 = 目标最大气血×50%。总恢复 = 50% + 30% = 80%。',
    element: '光', revive: true, revivePct: 0.50, hotPct: 0.10, hotTurns: 3, cd: 5, target: 'ally_dead' },
  // 群体复活：复活全体+攻击增益
  { id: 'mass_resurrection', name: '群体复活', type: 'active', category: 'aoe_heal', quality: 'legend',
    desc: '【复活·全体·增益·冷却】复活已阵亡的友方（恢复35%气血），并使全体友方攻击力+20%持续3回合，冷却8回合。\n复活量 = 各友方最大气血×35%。',
    element: '光', revive: true, revivePct: 0.35, atkBuff: 0.20, buffTurns: 3, cd: 8, target: 'ally_all' },
  // 狂战之怒：高攻击增益但降防
  { id: 'berserker_fury', name: '狂战之怒', type: 'active', category: 'single_buff', desc: '【增益·自身·狂暴·冷却】攻击力+80%，但防御力-30%，持续3回合，冷却4回合。\n攻击力提升 = 基础攻击力×80%。防御力降低 = 基础防御力×30%。', element: '无', atkBuff: 0.80, defDebuff: 0.30, buffTurns: 3, cd: 4, target: 'ally_self' },
  // 吞噬意志：偷取目标攻击力
  { id: 'devour_will', name: '吞噬意志', type: 'active', category: 'single_atk', desc: '【法术·单体·偷取】对单体造成 100% 灵力的暗影伤害，并偷取目标30%攻击力转化为自身攻击力加成，持续3回合。\n伤害公式：灵力×1.0×技能加成 − 目标防御×0.7。', element: '暗', dmgPct: 1.0, cd: 0, target: 'enemy_front', stealAtk: 0.30, stealTurns: 3 },
  // ===== 需求17：新伤害体系+嘲讽控制技能 =====
  // 血量决定伤害的技能
  // 需求1：调整dmgPct平衡气血/魔法/防御/速度四种新威力体系的伤害（属性数值远低于攻击力/灵力）
  { id: 'blood_surge', name: '血脉涌动', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【血量·单体】伤害 = 自身气血 × 50%。\n伤害公式：自身当前气血×0.50×技能加成 − 目标防御×0.7。\n气血越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 0.50, powerAttr: 'hp', cd: 0, target: 'enemy_front' },
  { id: 'life_exchange', name: '生命交换', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【血量差·单体】伤害 = (自身气血 − 目标气血) × 50%。\n伤害公式：(自身气血−目标气血)×0.50×技能加成 − 目标防御×0.7。\n气血差越大，伤害越高。基础暴击率10%。',
    element: '无', dmgPct: 0.50, powerAttr: 'hpDiff', cd: 0, target: 'enemy_front' },
  // 魔法决定伤害的技能
  { id: 'arcane_burst', name: '奥术爆发', type: 'active', category: 'aoe_atk', quality: 'epic',
    desc: '【魔法·群体·秒3】伤害 = 自身魔法值 × 80%，对3个目标造成奥术伤害。\n每目标伤害：自身魔法值×0.80×技能加成 − 目标防御×0.7。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 0.80, powerAttr: 'mp', cd: 0, target: 'enemy_all', targetCount: 3 },
  // 防御决定伤害的技能
  { id: 'shield_bash', name: '盾击', type: 'active', category: 'single_atk', quality: 'uncommon',
    desc: '【防御·单体】伤害 = 自身防御力 × 500%。\n伤害公式：自身防御力×5.00×技能加成 − 目标防御×0.7。\n防御越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 5.00, powerAttr: 'def', cd: 0, target: 'enemy_front' },
  // 速度决定伤害的技能
  { id: 'swift_strike', name: '迅捷打击', type: 'active', category: 'single_atk', quality: 'uncommon',
    desc: '【速度·单体】伤害 = 自身速度 × 300%。\n伤害公式：自身速度×3.00×技能加成 − 目标防御×0.7。\n速度越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 3.00, powerAttr: 'spd', cd: 0, target: 'enemy_front' },
  // ===== 需求1：扩展血量/魔法/防御/速度技能库 =====
  // 血量系进阶
  { id: 'blood_pool_burst', name: '血池爆裂', type: 'active', category: 'aoe_atk', quality: 'epic',
    desc: '【血量·群体·秒4】伤害 = 自身气血 × 30%，对4个目标造成血系伤害。\n每目标伤害：自身当前气血×0.30×技能加成 − 目标防御×0.7。\n气血越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 0.30, powerAttr: 'hp', cd: 0, target: 'enemy_all', targetCount: 4 },
  { id: 'blood_frenzy', name: '鲜血狂热', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【血量·单体·吸血】伤害 = 自身气血 × 70%，吸血20%。\n伤害公式：自身当前气血×0.70×技能加成 − 目标防御×0.7。\n回复量 = 造成伤害×20%。基础暴击率10%。',
    element: '无', dmgPct: 0.70, powerAttr: 'hp', cd: 0, target: 'enemy_front', vampPct: 0.20 },
  { id: 'blood_oath_slash', name: '血誓斩', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【血量·单体·自损】伤害 = 自身气血 × 100%，自损8%最大气血。\n伤害公式：自身当前气血×1.00×技能加成 − 目标防御×0.7。\n自损 = 自身最大气血×8%。基础暴击率15%。',
    element: '无', dmgPct: 1.00, powerAttr: 'hp', cd: 0, target: 'enemy_front', selfDmgPct: 0.08, bonusCrit: 0.05 },
  { id: 'undying_blood', name: '不死血战', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【血量·单体·自愈】伤害 = 自身气血 × 45%，并回复自身15%最大气血。\n伤害公式：自身当前气血×0.45×技能加成 − 目标防御×0.7。\n回复量 = 自身最大气血×15%。基础暴击率10%。',
    element: '无', dmgPct: 0.45, powerAttr: 'hp', cd: 0, target: 'enemy_front', selfHealPct: 0.15 },
  { id: 'blood_curse', name: '血之诅咒', type: 'active', category: 'single_atk', quality: 'legend',
    desc: '【血量·单体·持续】伤害 = 自身气血 × 35%，附加流血3回合。\n伤害公式：自身当前气血×0.35×技能加成 − 目标防御×0.7。\n流血：每回合损失目标6%最大气血。基础暴击率10%。',
    element: '无', dmgPct: 0.35, powerAttr: 'hp', cd: 0, target: 'enemy_front', poisonTurns: 3, poisonPct: 0.06 },
  // 血量差系进阶
  { id: 'life_torrent', name: '生命洪流', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【血量差·群体·秒3】伤害 = (自身气血 − 目标气血) × 35%，对3个目标造成伤害。\n每目标伤害：(自身气血−目标气血)×0.35×技能加成 − 目标防御×0.7。\n气血差越大，伤害越高。基础暴击率10%。',
    element: '无', dmgPct: 0.35, powerAttr: 'hpDiff', cd: 0, target: 'enemy_all', targetCount: 3 },
  { id: 'life_judgment', name: '生命裁决', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【血量差·单体·高暴击】伤害 = (自身气血 − 目标气血) × 65%，+25%暴击率。\n伤害公式：(自身气血−目标气血)×0.65×技能加成 − 目标防御×0.7。\n气血差越大，伤害越高。暴击率 = 10%+25%+被动加成。',
    element: '无', dmgPct: 0.65, powerAttr: 'hpDiff', cd: 0, target: 'enemy_front', bonusCrit: 0.25 },
  // 魔法系进阶
  { id: 'arcane_barrage', name: '魔能弹幕', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【魔法·群体·秒5】伤害 = 自身魔法值 × 60%，对5个目标造成奥术伤害。\n每目标伤害：自身魔法值×0.60×技能加成 − 目标防御×0.7。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 0.60, powerAttr: 'mp', cd: 0, target: 'enemy_all', targetCount: 5 },
  { id: 'arcane_pierce', name: '奥术穿透', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【魔法·单体·无视防御】伤害 = 自身魔法值 × 150%，无视50%防御。\n伤害公式：自身魔法值×1.50×技能加成 − 目标防御×(0.7−0.5)=×0.2。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 1.50, powerAttr: 'mp', cd: 0, target: 'enemy_front', ignoreDefPct: 0.50 },
  { id: 'mana_burn', name: '魔力灼烧', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【魔法·单体·灼魔】伤害 = 自身魔法值 × 70%，并灼烧目标魔法值10%转化为自身魔法。\n伤害公式：自身魔法值×0.70×技能加成 − 目标防御×0.7。\n灼魔：目标损失魔法值×10%，自身回复等量魔法。基础暴击率10%。',
    element: '奥术', dmgPct: 0.70, powerAttr: 'mp', cd: 0, target: 'enemy_front', mpBurnPct: 0.10 },
  { id: 'mana_storm', name: '法力风暴', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【魔法·全体】伤害 = 自身魔法值 × 50%，对全体敌人造成奥术伤害。\n伤害公式：自身魔法值×0.50×技能加成 − 目标防御×0.7。\n魔法越高，伤害越强。基础暴击率10%。',
    element: '奥术', dmgPct: 0.50, powerAttr: 'mp', cd: 0, target: 'enemy_all' },
  { id: 'arcane_resonance', name: '奥术共鸣', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【魔法·单体·双击】攻击2次，每击造成 50% 魔法值的奥术伤害。\n总伤害 ≈ 自身魔法值×1.00×技能加成 − 目标防御×1.4。\n每击独立判定暴击。基础暴击率10%。',
    element: '奥术', dmgPct: 0.50, powerAttr: 'mp', cd: 0, target: 'enemy_front', hits: 2 },
  // 防御系进阶
  { id: 'iron_bulwark', name: '钢铁壁垒', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【防御·单体·增益】伤害 = 自身防御力 × 300%，自身防御+20%持续3回合。\n伤害公式：自身防御力×3.00×技能加成 − 目标防御×0.7。\n防御越高，伤害越强。基础暴击率10%。',
    element: '无', dmgPct: 3.00, powerAttr: 'def', cd: 0, target: 'enemy_front', defBuff: 0.20, buffTurns: 3 },
  { id: 'counter_storm', name: '反击风暴', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【防御·单体·反击】伤害 = 自身防御力 × 400%，开启反击50%持续3回合。\n伤害公式：自身防御力×4.00×技能加成 − 目标防御×0.7。\n反击：受到攻击时反击50%伤害。基础暴击率10%。',
    element: '无', dmgPct: 4.00, powerAttr: 'def', cd: 0, target: 'enemy_front', counterBuff: 0.50, counterTurns: 3 },
  { id: 'guardian_wrath', name: '守护之怒', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【防御·群体·秒4·嘲讽】伤害 = 自身防御力 × 200%，对4个目标造成伤害并全体嘲讽1回合。\n每目标伤害：自身防御力×2.00×技能加成 − 目标防御×0.7。\n嘲讽：敌人只能攻击施法者。基础暴击率10%。',
    element: '无', dmgPct: 2.00, powerAttr: 'def', cd: 0, target: 'enemy_all', targetCount: 4, tauntTurns: 1 },
  { id: 'unshakable', name: '不可撼动', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【防御·单体·护盾】伤害 = 自身防御力 × 600%，并获得护盾（自身防御×300%）持续2回合。\n伤害公式：自身防御力×6.00×技能加成 − 目标防御×0.7。\n护盾：吸收自身防御力×300%的伤害。基础暴击率10%。',
    element: '无', dmgPct: 6.00, powerAttr: 'def', cd: 0, target: 'enemy_front', shieldPct: 3.00, shieldTurns: 2 },
  { id: 'fortress_crush', name: '要塞碾压', type: 'active', category: 'single_atk', quality: 'legend',
    desc: '【防御·单体·降防】伤害 = 自身防御力 × 450%，降低目标30%防御2回合。\n伤害公式：自身防御力×4.50×技能加成 − 目标防御×0.7。\n降防：目标防御-30%，持续2回合。基础暴击率10%。',
    element: '无', dmgPct: 4.50, powerAttr: 'def', cd: 0, target: 'enemy_front', defReduce: 0.30, defReduceTurns: 2 },
  // 速度系进阶
  { id: 'gale_combo', name: '疾风连击', type: 'active', category: 'single_atk', quality: 'rare',
    desc: '【速度·单体·三击】攻击3次，每击造成 100% 速度的伤害。\n总伤害 ≈ 自身速度×3.00×技能加成 − 目标防御×2.1。\n每击独立判定暴击。基础暴击率10%。',
    element: '无', dmgPct: 1.00, powerAttr: 'spd', cd: 0, target: 'enemy_front', hits: 3 },
  { id: 'lightning_raid', name: '闪电突袭', type: 'active', category: 'aoe_atk', quality: 'epic',
    desc: '【速度·群体·秒3】伤害 = 自身速度 × 200%，对3个目标造成雷电伤害，20%概率眩晕1回合。\n每目标伤害：自身速度×2.00×技能加成 − 目标防御×0.7。\n速度越高，伤害越强。基础暴击率10%。',
    element: '雷', dmgPct: 2.00, powerAttr: 'spd', cd: 0, target: 'enemy_all', targetCount: 3, stunChance: 0.20, stunTurns: 1 },
  { id: 'storm_blade', name: '风暴之刃', type: 'active', category: 'single_atk', quality: 'legend',
    desc: '【速度·单体·高暴击】伤害 = 自身速度 × 400%，+30%暴击率。\n伤害公式：自身速度×4.00×技能加成 − 目标防御×0.7。\n暴击率 = 10%+30%+被动加成（暴击×1.5）。',
    element: '无', dmgPct: 4.00, powerAttr: 'spd', cd: 0, target: 'enemy_front', bonusCrit: 0.30 },
  { id: 'shadow_clone', name: '影分身', type: 'active', category: 'aoe_atk', quality: 'legend',
    desc: '【速度·群体·秒4·必中】伤害 = 自身速度 × 250%，对4个目标造成伤害，必定命中。\n每目标伤害：自身速度×2.50×技能加成 − 目标防御×0.7。\n速度越高，伤害越强。基础暴击率10%。',
    element: '暗', dmgPct: 2.50, powerAttr: 'spd', cd: 0, target: 'enemy_all', targetCount: 4, alwaysHit: true },
  { id: 'wind_whisper', name: '风之低语', type: 'active', category: 'single_atk', quality: 'epic',
    desc: '【速度·单体·闪避增益】伤害 = 自身速度 × 250%，自身闪避+15%持续3回合。\n伤害公式：自身速度×2.50×技能加成 − 目标防御×0.7。\n闪避：被攻击时15%概率闪避。基础暴击率10%。',
    element: '无', dmgPct: 2.50, powerAttr: 'spd', cd: 0, target: 'enemy_front', dodgeBuff: 0.15, buffTurns: 3 },
  // 嘲嘲类技能
  { id: 'taunt', name: '嘲讽', type: 'active', category: 'single_cc', quality: 'uncommon',
    desc: '【控制·单体·嘲讽】强制目标攻击自己，持续2回合。\n被嘲讽的目标只能攻击施法者。',
    element: '无', cd: 0, target: 'enemy_front', tauntTurns: 2 },
  { id: 'provoke', name: '挑衅', type: 'active', category: 'aoe_cc', quality: 'rare',
    desc: '【控制·全体·嘲讽】全体嘲讽，强制所有敌人攻击自己，持续1回合。\n被嘲讽的敌人只能攻击施法者。',
    element: '无', cd: 0, target: 'enemy_all', tauntTurns: 1 },
  // 控制类技能
  { id: 'freeze_trap', name: '冰冻陷阱', type: 'active', category: 'single_cc', quality: 'rare',
    desc: '【控制·单体·冰冻】冰冻目标2回合，无法行动。\n冰冻：无法行动，受到攻击有概率破冰。',
    element: '冰', dmgPct: 0.5, cd: 0, target: 'enemy_front', freezeChance: 0.80, freezeTurns: 2 },
  { id: 'stun_wave', name: '震晕波', type: 'active', category: 'aoe_cc', quality: 'rare',
    desc: '【控制·全体·眩晕】震晕全体敌人1回合，无法行动。\n眩晕：无法行动。',
    element: '无', dmgPct: 0.3, cd: 0, target: 'enemy_all', stunChance: 0.60, stunTurns: 1 },
  { id: 'sleep_powder', name: '催眠粉', type: 'active', category: 'single_cc', quality: 'uncommon',
    desc: '【控制·单体·睡眠】催眠目标3回合，无法行动。\n睡眠：无法行动，受到攻击会醒来。',
    element: '无', dmgPct: 0.4, cd: 0, target: 'enemy_front', sleepChance: 0.70, sleepTurns: 3 },
  { id: 'silence_field', name: '沉默领域', type: 'active', category: 'aoe_cc', quality: 'rare',
    desc: '【控制·全体·沉默】沉默全体敌人2回合，无法使用主动技能。\n沉默：无法使用主动技能。',
    element: '暗', dmgPct: 0.3, cd: 0, target: 'enemy_all', silenceChance: 0.60, silenceTurns: 2 },
];

// ===== 主动技能品质系统 =====
// 品质分级：common（普通）、uncommon（优秀）、rare（稀有）、epic（史诗）、legend（传说）
const SKILL_QUALITY_NAMES = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legend: '传说',
};
const SKILL_QUALITY_COLORS = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legend: '#f59e0b',
};
// 按品质定义的主动技能书商城价格（钻石）- 需求26
const SKILL_QUALITY_PRICES = {
  common: 5,      // 普通品质
  uncommon: 20,   // 优秀品质
  rare: 80,       // 稀有品质
  epic: 300,      // 史诗品质
  legend: 1000,   // 传说品质
};
// 需求8：主动技能品质正序排序权重（用于技能书商店展示）
const SKILL_QUALITY_ORDER = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legend: 4,
};

// 判断技能是否为辅助类（与 battle.js 中 isPhysicalSkill 保持一致逻辑）
function isSkillSupport(s) {
  return s.category === 'single_heal' || s.category === 'aoe_heal' || s.category === 'single_buff' || s.category === 'aoe_buff';
}
// 判断技能是否为法术类（魔法元素：冰/雷/暗/光/毒；辅助技能归为法术类触发概率）
function isSkillMagic(s) {
  if (isSkillSupport(s)) return true;
  var magicElements = ['冰', '雷', '暗', '光', '毒'];
  return !!(s.element && magicElements.indexOf(s.element) >= 0);
}

// 特殊技能品质覆盖（融合限定、强力复活/狂暴等单独指定）
var SKILL_QUALITY_OVERRIDE = {
  chaos_strike: 'epic',     // 融合限定·全体+回血
  doom_inferno: 'epic',     // 融合限定·灼烧3回合
  time_rift: 'epic',        // 融合限定·必暴+眩晕
  time_reverse: 'epic',     // 复活技·冷却
  berserker_fury: 'epic',   // 攻击+80%/防御-30%
  emergency_heal: 'epic',   // 单体60%治疗+冷却
  resurrection: 'rare',      // 单体复活
  phoenix_revive: 'epic',   // 凤凰涅槃·复活+持续恢复
  mass_resurrection: 'legend', // 群体复活+攻击增益
};

// 按强度规则为每个主动技能分配 quality 字段
ACTIVE_SKILLS.forEach(function(s) {
  if (s.quality) return; // 已显式指定则保留
  if (SKILL_QUALITY_OVERRIDE[s.id]) { s.quality = SKILL_QUALITY_OVERRIDE[s.id]; return; }
  var dmgPct = s.dmgPct || 0;
  var hasExecute = !!(s.executeThreshold && s.executeMult);          // 斩杀
  var hasMultiHit = !!(s.hits && s.hits >= 3);                        // 多段（3+次）
  var strongCC = ((s.freezeChance || 0) >= 0.4 && (s.freezeTurns || 0) >= 2) ||
                 ((s.stunChance || 0) >= 0.4) ||
                 ((s.silenceChance || 0) >= 0.35 && (s.silenceTurns || 0) >= 2);
  var hasControl = !!(s.freezeChance || s.stunChance || s.silenceChance || s.rootChance || s.sleepChance);
  var hasExtraEffect = !!(s.vampPct || s.burnTurns || s.poisonTurns || s.ignoreDefPct || s.defReduce ||
                          s.trueDmg || s.stealAtk || s.counterBuff || s.reflectBuff || s.shieldPct ||
                          s.hotPct || s.healPct || s.revive || s.bonusCrit || s.atkBuff || s.defBuff ||
                          s.spdBuff || s.allBuff || s.stackPoison || s.selfDmgPct || s.hits);

  // 优先级从高到低判断
  if (hasExecute || hasMultiHit || dmgPct > 3.5) {
    s.quality = 'legend';
  } else if (dmgPct >= 2.5 || strongCC) {
    s.quality = 'epic';
  } else if (dmgPct >= 2.0 || hasControl) {
    s.quality = 'rare';
  } else if (dmgPct >= 1.5 || hasExtraEffect) {
    s.quality = 'uncommon';
  } else {
    s.quality = 'common';
  }
});

// 主动技能统一追加触发概率信息到描述中 + 前置品质标签
// 触发概率：物理 8%（上限15%）、法术 20%（上限40%）、辅助 25%（上限50%）
// 多技能独立判断，最多3个主动技能生效
ACTIVE_SKILLS.forEach(function(s) {
  var isSup = isSkillSupport(s);
  var isMag = isSkillMagic(s);
  var typeLabel, baseChance, capChance;
  if (isSup) {
    typeLabel = '辅助'; baseChance = 0.25; capChance = 0.50;
  } else if (isMag) {
    typeLabel = '法术'; baseChance = 0.20; capChance = 0.40;
  } else {
    typeLabel = '物理'; baseChance = 0.08; capChance = 0.15;
  }
  s.desc += '\n⏱ 触发概率：基础' + Math.floor(baseChance * 100) + '%（' + typeLabel + '上限' + Math.floor(capChance * 100) + '%，受技能触发加成提升，多技能独立判断，最多3个主动技能生效）';
  // 前置品质标签
  var qName = SKILL_QUALITY_NAMES[s.quality] || '普通';
  s.desc = '[' + qName + '] ' + s.desc;
});

// 站位系统
const FORMATION_POSITIONS = [
  { id: 'front', name: '前排', icon: '🛡️', order: 0 },
  { id: 'mid', name: '中排', icon: '⚔️', order: 1 },
  { id: 'back', name: '后排', icon: '🏹', order: 2 },
];

// ==================== 阵法系统 ====================
// 阵法：对不同位置的宠物产生不同增益，满级5级
// bonus: { front: {}, mid: {}, back: {} } per level (level 1-5, multiplier)
// baseLevelBonus 为1级时的加成，每升一级 +20% 加成 (lv5 = baseLevelBonus × 1.8)
const FORMATIONS = [
  // 需求10：阵法重做，参考梦幻西游，每个阵法有独特的站位效果和特色加成
  // 每个阵法包含5个位置（前/中/后/左/右），不同位置有不同属性加成
  // aura 字段为阵法全体效果（数据定义，供战斗系统扩展使用）
  {
    id: 'attack_formation',
    name: '天覆阵',
    icon: '⚔️',
    color: '#ef4444',
    desc: '【全体攻击型】全体伤害+10%，但速度-5%。前排主攻，中后排强化输出。',
    aura: { dmgBonus: 0.10, spdPct: -0.05 },
    bonus: {
      front: { atkPct: 0.15 },           // 前排：攻击+15%
      mid: { atkPct: 0.10, critRate: 0.05 },   // 中排：攻击+10%，暴击+5%
      back: { atkPct: 0.10, critDmg: 0.15 },  // 后排：攻击+10%，暴伤+15%
      left: { atkPct: 0.12, critRate: 0.03 },  // 左翼：攻击+12%，暴击+3%
      right: { atkPct: 0.12, critDmg: 0.10 }, // 右翼：攻击+12%，暴伤+10%
    },
  },
  {
    id: 'defense_formation',
    name: '地载阵',
    icon: '🛡️',
    color: '#3b82f6',
    desc: '【全体防御型】全体防御+15%，受到AOE伤害-10%。稳如磐石，适合持久战。',
    aura: { defPct: 0.15, aoeReduce: 0.10 },
    bonus: {
      front: { defPct: 0.20, hpPct: 0.10 },   // 前排：防御+20%，气血+10%
      mid: { defPct: 0.15, dmgReduce: 0.08 },  // 中排：防御+15%，减伤+8%
      back: { defPct: 0.15, hpPct: 0.12 },     // 后排：防御+15%，气血+12%
      left: { defPct: 0.15, dmgReduce: 0.05 }, // 左翼：防御+15%，减伤+5%
      right: { defPct: 0.15, dmgReduce: 0.05 },// 右翼：防御+15%，减伤+5%
    },
  },
  {
    id: 'speed_formation',
    name: '风扬阵',
    icon: '💨',
    color: '#06b6d4',
    desc: '【速度型】速度+15%，暴击率+5%。抢占先机，疾风骤雨。',
    aura: { spdPct: 0.15, critRate: 0.05 },
    bonus: {
      front: { spdPct: 0.15, dodgeRate: 0.05 }, // 前排：速度+15%，闪避+5%
      mid: { spdPct: 0.18, critRate: 0.08 },    // 中排：速度+18%，暴击+8%
      back: { spdPct: 0.15, hitRate: 0.10 },    // 后排：速度+15%，命中+10%
      left: { spdPct: 0.15, critRate: 0.05 },   // 左翼：速度+15%，暴击+5%
      right: { spdPct: 0.15, critRate: 0.05 },  // 右翼：速度+15%，暴击+5%
    },
  },
  {
    id: 'magic_formation',
    name: '云垂阵',
    icon: '🔮',
    color: '#a855f7',
    desc: '【法术型】法术伤害+15%，物理伤害-5%。强化法术输出，适合法系阵容。',
    aura: { magicDmgPct: 0.15, physDmgPct: -0.05 },
    bonus: {
      front: { intPct: 0.12, magicDmgPct: 0.10 }, // 前排：灵力+12%，法伤+10%
      mid: { magicDmgPct: 0.18, mpPct: 0.15 },    // 中排：法伤+18%，魔法+15%
      back: { intPct: 0.15, magicDmgPct: 0.12 },  // 后排：灵力+15%，法伤+12%
      left: { magicDmgPct: 0.15, mpPct: 0.10 },   // 左翼：法伤+15%，魔法+10%
      right: { magicDmgPct: 0.15, intPct: 0.08 }, // 右翼：法伤+15%，灵力+8%
    },
  },
  {
    id: 'snake_formation',
    name: '蛇蟠阵',
    icon: '🐍',
    color: '#10b981',
    desc: '【闪避型】闪避+10%，被攻击时有10%概率免疫。灵动如蛇，规避伤害。',
    aura: { dodgeRate: 0.10, immuneChance: 0.10 },
    bonus: {
      front: { dodgeRate: 0.12, hpPct: 0.08 },   // 前排：闪避+12%，气血+8%
      mid: { dodgeRate: 0.15, spdPct: 0.08 },    // 中排：闪避+15%，速度+8%
      back: { dodgeRate: 0.12, hitRate: 0.10 },   // 后排：闪避+12%，命中+10%
      left: { dodgeRate: 0.10, spdPct: 0.05 },   // 左翼：闪避+10%，速度+5%
      right: { dodgeRate: 0.10, spdPct: 0.05 },  // 右翼：闪避+10%，速度+5%
    },
  },
  {
    id: 'ambush_formation',
    name: '鸟翔阵',
    icon: '🦅',
    color: '#0ea5e9',
    desc: '【突击型】速度+10%，首回合额外行动一次。先发制人，迅猛突击。',
    aura: { spdPct: 0.10, firstTurnExtra: true },
    bonus: {
      front: { spdPct: 0.12, atkPct: 0.10 },     // 前排：速度+12%，攻击+10%
      mid: { spdPct: 0.15, critRate: 0.05 },     // 中排：速度+15%，暴击+5%
      back: { spdPct: 0.12, hitRate: 0.10 },     // 后排：速度+12%，命中+10%
      left: { spdPct: 0.10, atkPct: 0.08 },      // 左翼：速度+10%，攻击+8%
      right: { spdPct: 0.10, atkPct: 0.08 },     // 右翼：速度+10%，攻击+8%
    },
  },
  {
    id: 'balance_formation',
    name: '龙飞阵',
    icon: '🐉',
    color: '#f59e0b',
    desc: '【平衡型】全属性+5%，各位置均衡发展，万金油阵法。',
    aura: { allPct: 0.05 },
    bonus: {
      front: { allPct: 0.06, defPct: 0.05 },    // 前排：全属性+6%，防御+5%
      mid: { allPct: 0.06, atkPct: 0.05 },      // 中排：全属性+6%，攻击+5%
      back: { allPct: 0.06, intPct: 0.05 },     // 后排：全属性+6%，灵力+5%
      left: { allPct: 0.05, hpPct: 0.05 },      // 左翼：全属性+5%，气血+5%
      right: { allPct: 0.05, spdPct: 0.05 },    // 右翼：全属性+5%，速度+5%
    },
  },
];

// 阵法等级上限
const FORMATION_MAX_LEVEL = 5;
// 需求11：阵法升级经验优化
// 1级→2级需要5经验，2级→3级需要25经验，3级→4级需要125经验，4级→5级需要600经验
function getFormationExpForLevel(level) {
  var expTable = { 1: 5, 2: 25, 3: 125, 4: 600 };
  return expTable[level] || 999999; // 满级后返回超大值
}
// 需求11：阵法书提供经验值（初级/中级/高级阵法书对应不同经验）
const FORMATION_BOOK_EXP = {
  primary: 5,        // 初级阵法书 +5 经验
  intermediate: 25,  // 中级阵法书 +25 经验
  advanced: 125,     // 高级阵法书 +125 经验
};

// 计算阵法在某等级的加成倍率：1级×1.0, 每升一级+0.2, 5级×1.8
function getFormationLevelMult(level) {
  return 1 + (level - 1) * 0.2;
}

// 阵法书道具ID前缀
const FORMATION_BOOK_PREFIX = 'formation_book_';

// ==================== 血统珠系统 ====================
// 血统珠道具：3个等级（低/中/高），用于抽取不同T级宠物的血统
// 抽取后获得 "extracted_blood_orb" 道具，含来源宠物名、血统ID、品质
const BLOOD_ORB_TIERS = [
  { id: 'blood_orb_low', name: '低级血统珠', icon: '🔮', color: '#9ca3af',
    desc: '可抽取 T1-T2 宠物的血统，必出史诗品质血统珠',
    minTier: 1, maxTier: 2, qualityChance: { epic: 1.0, legendary: 0 } },
  { id: 'blood_orb_mid', name: '中级血统珠', icon: '🔮', color: '#3b82f6',
    desc: '可抽取 T3-T4 宠物的血统，按宠物品质决定血统珠品质',
    minTier: 3, maxTier: 4, qualityChance: { epic: 0.6, legendary: 0.4 } },
  { id: 'blood_orb_high', name: '高级血统珠', icon: '🔮', color: '#a855f7',
    desc: '可抽取 T5 宠物的血统，按宠物品质决定血统珠品质',
    minTier: 5, maxTier: 5, qualityChance: { epic: 0.3, legendary: 0.7 } },
];

// 血统抽取品质概率（随机，与宠物品质无关）- 需求8
// 普通30% / 优秀25% / 稀有20% / 史诗15% / 传说10%
const BLOOD_ORB_RANDOM_QUALITY = {
  common: 0.30, uncommon: 0.25, rare: 0.20, epic: 0.15, legendary: 0.10,
};

// 血统珠品质加成倍率
const BLOOD_ORB_QUALITY_MULT = {
  common: 0.6,      // 普通品质：60% 原血统能力
  uncommon: 0.8,    // 优秀品质：80% 原血统能力
  rare: 1.0,        // 稀有品质：100% 原血统能力
  epic: 1.2,        // 史诗品质：120% 原血统能力
  legendary: 1.5,   // 传说品质：150% 原血统能力
};

const BLOOD_ORB_QUALITY_NAMES = { common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' };
const BLOOD_ORB_QUALITY_COLORS = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };

// 血统珠分解规则（需求8）：不同品质分解成不同等级的血统珠道具
// 史诗/传说 → 高级血统珠；稀有 → 中级血统珠；普通/优秀 → 低级血统珠
const BLOOD_ORB_DECOMPOSE_RULES = {
  common: 'blood_orb_low',
  uncommon: 'blood_orb_low',
  rare: 'blood_orb_mid',
  epic: 'blood_orb_high',
  legendary: 'blood_orb_high',
};

// 血统试炼活动配置
const BLOODLINE_TRIAL = {
  id: 'bloodline_trial',
  name: '血统试炼',
  minLevel: 20,
  desc: '挑战血统试炼，击败血统守护者获得血统珠道具',
};

// 需求3：进阶试炼活动配置（替换血统试炼，10档奖励按战斗力）
const ADVANCE_TRIAL = {
  id: 'advance_trial',
  name: '进阶试炼',
  minLevel: 15,
  desc: '挑战进阶秘境，按队伍战力获得不同档次的进阶丸奖励',
  // 10档奖励：[战力下限, 进阶丸等级, 数量]
  tiers: [
    { cpMin: 0,      pill: 'advance_pill_low',  count: 2 },
    { cpMin: 5000,   pill: 'advance_pill_low',  count: 3 },
    { cpMin: 15000,  pill: 'advance_pill_low',  count: 4 },
    { cpMin: 30000,  pill: 'advance_pill_low',  count: 6 },
    { cpMin: 60000,  pill: 'advance_pill_mid',  count: 1 },
    { cpMin: 100000, pill: 'advance_pill_mid',  count: 2 },
    { cpMin: 180000, pill: 'advance_pill_mid',  count: 3 },
    { cpMin: 300000, pill: 'advance_pill_mid',  count: 4 },
    { cpMin: 500000, pill: 'advance_pill_high', count: 1 },
    { cpMin: 800000, pill: 'advance_pill_high', count: 2 },
  ],
};

// ==================== 宠物派遣奇遇系统（DISPATCH）====================
// 核心机制：闲置宠物可派遣至已通过地图探索，派遣3只宠物
// 总战斗力需达到标准才能开始，战斗力越高额外收益加成
// 探索时长可选 1/4/8 小时，基础产出金币、养成材料，低概率掉落稀有道具
var DISPATCH_DURATIONS = [
  { hours: 1, label: '1小时', mult: 1.0 },
  { hours: 4, label: '4小时', mult: 4.5 },
  { hours: 8, label: '8小时', mult: 10.0 },
];

// 派遣地图配置：地图通关后解锁对应派遣区域
var DISPATCH_MAPS = [
  { mapId: 1,  name: '起源草地',   minPower: 500,    rewardMult: 1.0, materials: ['forge_stone_low','mystic_crystal_low'],              rarePool: ['rare_egg'], unlockDesc: '通过起源草地' },
  { mapId: 2,  name: '新手森林',   minPower: 2000,   rewardMult: 1.5, materials: ['forge_stone_low','mystic_crystal_low','ancient_rune_low'], rarePool: ['rare_egg','blood_orb_low'], unlockDesc: '通过新手森林' },
  { mapId: 3,  name: '幽暗矿洞',   minPower: 5000,   rewardMult: 2.0, materials: ['forge_stone_mid','mystic_crystal_low','ancient_rune_low'], rarePool: ['rare_egg','blood_orb_low','skill_random'], unlockDesc: '通过幽暗矿洞' },
  { mapId: 4,  name: '亡灵墓地',   minPower: 10000,  rewardMult: 2.5, materials: ['forge_stone_mid','mystic_crystal_mid','ancient_rune_low'], rarePool: ['rare_egg','blood_orb_mid','skill_random'], unlockDesc: '通过亡灵墓地' },
  { mapId: 5,  name: '烈焰火山',   minPower: 20000,  rewardMult: 3.0, materials: ['forge_stone_mid','mystic_crystal_mid','ancient_rune_mid'], rarePool: ['rare_egg','blood_orb_mid','skill_random'], unlockDesc: '通过烈焰火山' },
  { mapId: 6,  name: '冰霜高原',   minPower: 35000,  rewardMult: 3.5, materials: ['forge_stone_high','mystic_crystal_mid','ancient_rune_mid'], rarePool: ['rare_egg','blood_orb_mid','skill_random'], unlockDesc: '通过冰霜高原' },
  { mapId: 7,  name: '暗影沼泽',   minPower: 50000,  rewardMult: 4.0, materials: ['forge_stone_high','mystic_crystal_high','ancient_rune_mid'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过暗影沼泽' },
  { mapId: 8,  name: '天空之城',   minPower: 80000,  rewardMult: 4.5, materials: ['forge_stone_high','mystic_crystal_high','ancient_rune_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过天空之城' },
  { mapId: 9,  name: '深渊裂隙',   minPower: 120000, rewardMult: 5.0, materials: ['forge_stone_high','mystic_crystal_high','ancient_rune_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过深渊裂隙' },
  { mapId: 10, name: '龙之巢穴',   minPower: 180000, rewardMult: 5.5, materials: ['forge_stone_high','mystic_crystal_high','ancient_rune_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过龙之巢穴' },
  { mapId: 11, name: '终焉神殿',   minPower: 250000, rewardMult: 6.0, materials: ['forge_stone_high','mystic_crystal_high','ancient_rune_high'], rarePool: ['rare_egg','blood_orb_high','skill_random'], unlockDesc: '通过终焉神殿' },
];

// 派遣奖励基础值（1小时基础）
var DISPATCH_BASE_REWARD = {
  gold: 1000,      // 基础金币
  exp: 500,         // 基础经验
  materialCount: 2, // 基础材料数量
  rareChance: 0.05, // 稀有道具掉落概率（5%）
};

// 战斗力额外加成：超过最低战力每10%额外+5%奖励
var DISPATCH_POWER_BONUS_PER_10PCT = 0.05;

// 同时派遣上限
var DISPATCH_MAX_SLOTS = 3;

// 需求2：阵法押镖活动配置（参考梦幻西游押镖）
const FORMATION_ESCORT = {
  id: 'formation_escort',
  name: '押镖运送',
  minLevel: 15,
  dailyLimit: 3,
  stages: 4, // 共4个阶段（路线上的关卡）
  desc: '护送镖车安全抵达目的地，每阶段击败拦路怪物获得阵法书奖励，全部完成额外金币奖励',
};

// 需求6：赚取技能书活动配置
const SKILL_BOOK_HUNT = {
  id: 'skill_book_hunt',
  name: '技能秘境挑战',
  minLevel: 25,
  dailyLimit: 3,
  maxStages: 5,
  desc: '挑战技能秘境多层关卡，越高阶越难但奖励越丰厚',
  // 各阶段怪物强度倍率和奖励倍率
  stageConfig: [
    { stage: 1, hpMult: 1.0, atkMult: 1.0, rewardMult: 1.0, name: '初级' },
    { stage: 2, hpMult: 1.5, atkMult: 1.3, rewardMult: 1.5, name: '中级' },
    { stage: 3, hpMult: 2.0, atkMult: 1.6, rewardMult: 2.2, name: '高级' },
    { stage: 4, hpMult: 2.8, atkMult: 2.0, rewardMult: 3.0, name: '精英' },
    { stage: 5, hpMult: 4.0, atkMult: 2.5, rewardMult: 4.5, name: '宗师' },
  ],
};

// 需求5：血统副本配置
const BLOODLINE_DUNGEON_CFG = {
  id: 'bloodline_dungeon',
  name: '血统副本',
  minLevel: 25,
  desc: '挑战血统守护者，掉落各级血统珠',
  // 副本配置：5波怪物，最后一波boss掉落血统珠
  waves: 5,
  // 血统珠掉落概率（每波）
  dropChance: [0, 0, 0.10, 0.20, 1.0], // 第1-2波不掉，第3波10%，第4波20%，第5波boss必掉
  // 血统珠等级分布
  orbTierChance: { low: 0.60, mid: 0.30, high: 0.10 },
};

// 竞技场段位
const ARENA_RANKS = [
  { id: 'bronze', name: '青铜', icon: '🥉', minScore: 0, color: '#cd7f32' },
  { id: 'silver', name: '白银', icon: '🥈', minScore: 1000, color: '#c0c0c0' },
  { id: 'gold', name: '黄金', icon: '🥇', minScore: 2000, color: '#ffd700' },
  { id: 'platinum', name: '铂金', icon: '💎', minScore: 3500, color: '#e5e4e2' },
  { id: 'diamond', name: '钻石', icon: '💠', minScore: 5500, color: '#b9f2ff' },
  { id: 'master', name: '大师', icon: '👑', minScore: 8000, color: '#ff4500' },
];

// 藏宝图品质
const TREASURE_MAP_RARITIES = [
  { id: 'white', name: '普通藏宝图', icon: '⚪', color: '#9ca3af', affixCount: 1 },
  { id: 'green', name: '精良藏宝图', icon: '🟢', color: '#22c55e', affixCount: 2 },
  { id: 'blue', name: '稀有藏宝图', icon: '🔵', color: '#3b82f6', affixCount: 3 },
  { id: 'purple', name: '史诗藏宝图', icon: '🟣', color: '#a855f7', affixCount: 4 },
  { id: 'orange', name: '传说藏宝图', icon: '🟠', color: '#f97316', affixCount: 5 },
];

// 藏宝图词条
const TREASURE_AFFIXES = [
  { id: 'gold_bonus', name: '金币奖励', format: v => `金币 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.8) },
  { id: 'exp_bonus', name: '经验奖励', format: v => `经验 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.8) },
  { id: 'equip_drop', name: '装备掉落率', format: v => `装备掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'egg_drop', name: '宠物蛋掉落率', format: v => `蛋掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'skill_drop', name: '技能书掉落率', format: v => `技能书掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'moon_dew', name: '月华露数量', format: v => `月华露 +${v}`, genVal: () => randomInt(1, 5) },
  { id: 'diamond_bonus', name: '钻石奖励', format: v => `钻石 +${v}`, genVal: () => randomInt(5, 30) },
  { id: 'monster_power', name: '怪物强度', format: v => `怪物强度 +${Math.floor(v*100)}%（奖励更多）`, genVal: () => randomFloat(0.2, 0.6) },
  // v2.2.0 需求10：新增词缀
  { id: 'gem_drop', name: '宝石掉落率', format: v => `宝石掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.8) },
  { id: 'pet_exp_bonus', name: '宠物经验加成', format: v => `宠物经验 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 1.0) },
  { id: 'forge_stone_drop', name: '强化石掉落率', format: v => `强化石掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.3, 0.8) },
  { id: 'dig_item_drop', name: '密藏道具掉落', format: v => `密藏道具掉落 +${Math.floor(v*100)}%`, genVal: () => randomFloat(0.2, 0.6) },
];

const TREASURE_SPECIAL_AFFIXES = [
  { id: 'double_reward', name: '双倍奖励', format: () => '所有奖励翻倍！' },
  { id: 'guaranteed_egg', name: '必出宠物蛋', format: () => '必定掉落一颗稀有蛋' },
  { id: 'guaranteed_equip', name: '必出装备', format: () => '必定掉落一件史诗以上装备' },
  // v2.2.0 需求10：新增特殊词缀
  { id: 'triple_reward', name: '三倍奖励', format: () => '所有奖励三倍！！' },
  { id: 'guaranteed_dig_map', name: '必出密藏图', format: () => '必定掉落一张密藏图' },
];

// 需求5：藏宝图地图类型 - 以主线的11张图为名字，按风格分配宠物类型
// 每张图对应一个宠物蛋掉落池（按图风格选宠物）
const TREASURE_MAP_TYPES = [
  { id: 1, name: '起源草地', icon: '🌿', mapId: 1, desc: '起源之地的温和宠物', petPool: ['小史莱姆','绿毛虫','野鼠','麻雀','青蛙','蜗牛','蝌蚪','小田鼠','泥巴怪','落叶虫','萌新史莱姆','小石子','飘浮气泡'] },
  { id: 2, name: '新手森林', icon: '🌲', mapId: 2, desc: '森林中的精灵与野兽', petPool: ['小精灵','小树精','花仙子','蘑菇人','萤火虫','风精灵','微光蝶','嫩芽精','小孢子','风信子','露珠精','林间鹿','月牙兔'] },
  { id: 3, name: '幽暗矿洞', icon: '⛏️', mapId: 3, desc: '矿洞中的岩石生物', petPool: ['小地精','刺猬','小石怪','铜甲蟹','铁甲蚁','岩蜥蜴','苔藓鼠','锈甲虫','小石子','灰岩龟','苔甲蜥','青铜蟹','巨角羊'] },
  { id: 4, name: '亡灵墓地', icon: '💀', mapId: 4, desc: '亡灵与暗影生物', petPool: ['小骷髅','小幽灵','蝙蝠崽','小恶魔犬','腐尸虫','暮色鸦','暗影貂','幻影鸦','稻草人','小跳蛛','暗影狼'] },
  { id: 5, name: '烈焰火山', icon: '🌋', mapId: 5, desc: '火焰与熔岩生物', petPool: ['幼龙','小龙崽','火蜥蜴','流火蜥','烈焰犬','赤焰马','焚天魔','烈焰龙骑','烈日战神','火焰领主','烈风隼王'] },
  { id: 6, name: '冰霜高原', icon: '❄️', mapId: 6, desc: '冰霜与寒风生物', petPool: ['霜精灵','霜狼','雪雏','寒霜鼠','寒冰蝶','霜羽雕','冰封王','寒冰女王','冰霜巨龙','玄冰蛇','玄冰麒麟'] },
  { id: 7, name: '暗影沼泽', icon: '🌫️', mapId: 7, desc: '沼泽中的毒物', petPool: ['青苔蛇','泥潭怪','沙蝎','沙暴蝎','毒液蜘蛛','血藤蛇','幽冥蛇君','玄冥蛟','暗影刺客','暗夜君王','泥巴怪'] },
  { id: 8, name: '天空之城', icon: '☁️', mapId: 8, desc: '天空的飞禽与天使', petPool: ['雏鹰','黑鸦','灰羽雀','岩鸽','紫羽鸽','啼鸣鸟','雷羽雀','烬羽鸟','紫电隼','翔云马','风暴巨雕','烈风雕','天空霸主'] },
  { id: 9, name: '深渊裂隙', icon: '🌌', mapId: 9, desc: '深渊的恶魔生物', petPool: ['小恶魔','影狐','碧眼猫','幻影鸦','暗影貂','幻影蝶','暗夜蝙蝠','虚空魔神','永夜主宰','虚空主宰','混沌之眼'] },
  { id: 10, name: '龙之巢穴', icon: '🐉', mapId: 10, desc: '远古龙族栖息地', petPool: ['幼龙','小龙崽','火蜥蜴','银鳞龙','苍穹龙','冰封王','圣辉麒麟','混沌麒麟','乾坤龙尊','远古龙神','混沌魔龙','创世神龙','灭世魔龙'] },
  { id: 11, name: '终焉神殿', icon: '⛪', mapId: 11, desc: '终焉的神圣生物', petPool: ['光之子','晨曦鹿','银光鹿','圣光天使','永恒天使','创世天使','圣渊天马','圣光审判','圣光龙神','万物之母','太初神兽','万古灵尊'] },
];

// 需求5：根据地图类型ID获取宠物蛋掉落池
function getTreasureMapPetPool(typeId) {
  var t = TREASURE_MAP_TYPES.find(function(x) { return x.id === typeId; });
  return t ? t.petPool : [];
}

// 需求5：根据地图类型ID获取地图类型信息
function getTreasureMapType(typeId) {
  return TREASURE_MAP_TYPES.find(function(x) { return x.id === typeId; }) || null;
}

const PASSIVE_SKILLS = [
  { id: 'crit_strike', name: '必杀', type: 'passive', tier: 1, desc: '暴击率+10%', effect: { critRate: 0.10 } },
  { id: 'crit_strike_2', name: '高级必杀', type: 'passive', tier: 2, desc: '暴击率+20%', effect: { critRate: 0.20 } },
  { id: 'crit_strike_3', name: '超级必杀', type: 'passive', tier: 3, desc: '暴击率+35%，暴击伤害+50%', effect: { critRate: 0.35, critDmg: 0.50 } },
  { id: 'double_atk', name: '连击', type: 'passive', tier: 1, desc: '20%概率追加一次攻击', effect: { doubleChance: 0.20 } },
  { id: 'double_atk_2', name: '高级连击', type: 'passive', tier: 2, desc: '35%概率追加一次攻击', effect: { doubleChance: 0.35 } },
  { id: 'double_atk_3', name: '超级连击', type: 'passive', tier: 3, desc: '45%概率追加一次攻击，10%概率追加两次', effect: { doubleChance: 0.45, tripleChance: 0.10 } },
  { id: 'sneak_atk', name: '偷袭', type: 'passive', tier: 1, desc: '攻击力+10%', effect: { atkBonus: 0.10 } },
  { id: 'sneak_atk_2', name: '高级偷袭', type: 'passive', tier: 2, desc: '攻击力+18%', effect: { atkBonus: 0.18 } },
  { id: 'sneak_atk_3', name: '超级偷袭', type: 'passive', tier: 3, desc: '攻击力+28%，无视10%防御', effect: { atkBonus: 0.28, ignoreDef: 0.10 } },
  { id: 'power_up', name: '强力', type: 'passive', tier: 1, desc: '力量属性+15%', effect: { strBonus: 0.15 } },
  { id: 'power_up_2', name: '高级强力', type: 'passive', tier: 2, desc: '力量属性+25%', effect: { strBonus: 0.25 } },
  { id: 'power_up_3', name: '超级强力', type: 'passive', tier: 3, desc: '力量属性+40%，攻击+10%', effect: { strBonus: 0.40, atkBonus: 0.10 } },
  { id: 'def_up', name: '防御', type: 'passive', tier: 1, desc: '防御力+15%', effect: { defBonus: 0.15 } },
  { id: 'def_up_2', name: '高级防御', type: 'passive', tier: 2, desc: '防御力+25%', effect: { defBonus: 0.25 } },
  { id: 'def_up_3', name: '超级防御', type: 'passive', tier: 3, desc: '防御力+40%，受到伤害-10%', effect: { defBonus: 0.40, dmgReduce: 0.10 } },
  { id: 'parry', name: '招架', type: 'passive', tier: 1, desc: '15%概率格挡减伤50%', effect: { parryChance: 0.15, parryReduce: 0.50 } },
  { id: 'parry_2', name: '高级招架', type: 'passive', tier: 2, desc: '25%概率格挡减伤60%', effect: { parryChance: 0.25, parryReduce: 0.60 } },
  { id: 'parry_3', name: '超级招架', type: 'passive', tier: 3, desc: '35%概率格挡减伤70%，格挡后反击', effect: { parryChance: 0.35, parryReduce: 0.70, parryCounter: true } },
  { id: 'dodge', name: '闪避', type: 'passive', tier: 1, desc: '闪避率+10%', effect: { dodgeBonus: 0.10 } },
  { id: 'dodge_2', name: '高级闪避', type: 'passive', tier: 2, desc: '闪避率+18%', effect: { dodgeBonus: 0.18 } },
  { id: 'dodge_3', name: '超级闪避', type: 'passive', tier: 3, desc: '闪避率+28%，闪避后反击', effect: { dodgeBonus: 0.28, dodgeCounter: true } },
  { id: 'regen', name: '再生', type: 'passive', tier: 1, desc: '每回合恢复5%气血', effect: { regenPct: 0.05 } },
  { id: 'regen_2', name: '高级再生', type: 'passive', tier: 2, desc: '每回合恢复8%气血', effect: { regenPct: 0.08 } },
  { id: 'regen_3', name: '超级再生', type: 'passive', tier: 3, desc: '每回合恢复12%气血，战斗开始时额外恢复20%', effect: { regenPct: 0.12, regenStart: 0.20 } },
  { id: 'vampire', name: '吸血', type: 'passive', tier: 1, desc: '攻击恢复伤害的10%气血', effect: { vampPct: 0.10 } },
  { id: 'vampire_2', name: '高级吸血', type: 'passive', tier: 2, desc: '攻击恢复伤害的18%气血', effect: { vampPct: 0.18 } },
  { id: 'vampire_3', name: '超级吸血', type: 'passive', tier: 3, desc: '攻击恢复伤害的28%气血，暴击时吸血翻倍', effect: { vampPct: 0.28, vampCritDouble: true } },
  { id: 'reflect', name: '反震', type: 'passive', tier: 1, desc: '受到攻击反弹15%伤害', effect: { reflectPct: 0.15 } },
  { id: 'reflect_2', name: '高级反震', type: 'passive', tier: 2, desc: '受到攻击反弹25%伤害', effect: { reflectPct: 0.25 } },
  { id: 'reflect_3', name: '超级反震', type: 'passive', tier: 3, desc: '受到攻击反弹35%伤害，10%概率眩晕攻击者', effect: { reflectPct: 0.35, stunChance: 0.10 } },
  { id: 'revive', name: '神佑', type: 'passive', tier: 1, desc: '死亡时15%概率复活恢复50%血', effect: { reviveChance: 0.15, revivePct: 0.50 } },
  { id: 'revive_2', name: '高级神佑', type: 'passive', tier: 2, desc: '死亡时25%概率复活恢复70%血', effect: { reviveChance: 0.25, revivePct: 0.70 } },
  { id: 'revive_3', name: '超级神佑', type: 'passive', tier: 3, desc: '死亡时35%概率复活恢复100%血并提升20%攻击', effect: { reviveChance: 0.35, revivePct: 1.00, reviveAtk: 0.20 } },
  { id: 'speed_up', name: '敏捷', type: 'passive', tier: 1, desc: '速度+15%', effect: { speedBonus: 0.15 } },
  { id: 'speed_up_2', name: '高级敏捷', type: 'passive', tier: 2, desc: '速度+25%', effect: { speedBonus: 0.25 } },
  { id: 'speed_up_3', name: '超级敏捷', type: 'passive', tier: 3, desc: '速度+40%，先手攻击概率+20%', effect: { speedBonus: 0.40, firstStrike: 0.20 } },
  { id: 'magic_heart', name: '魔心', type: 'passive', tier: 1, desc: '技能伤害+15%', effect: { skillDmg: 0.15 } },
  { id: 'magic_heart_2', name: '高级魔心', type: 'passive', tier: 2, desc: '技能伤害+25%', effect: { skillDmg: 0.25 } },
  { id: 'magic_heart_3', name: '超级魔心', type: 'passive', tier: 3, desc: '技能伤害+40%，技能触发率+10%', effect: { skillDmg: 0.40, skillTrigger: 0.10 } },
  { id: 'magic_double', name: '法连', type: 'passive', tier: 1, desc: '主动技能20%概率连放两次', effect: { skillDouble: 0.20 } },
  { id: 'magic_double_2', name: '高级法连', type: 'passive', tier: 2, desc: '主动技能30%概率连放两次', effect: { skillDouble: 0.30 } },
  { id: 'magic_double_3', name: '超级法连', type: 'passive', tier: 3, desc: '主动技能40%概率连放两次，第二次不衰减', effect: { skillDouble: 0.40, skillDoubleFull: true } },
  { id: 'lucky', name: '幸运', type: 'passive', tier: 1, desc: '受到暴击概率-20%', effect: { antiCrit: 0.20 } },
  { id: 'lucky_2', name: '高级幸运', type: 'passive', tier: 2, desc: '受到暴击概率-40%，闪避+5%', effect: { antiCrit: 0.40, dodgeBonus: 0.05 } },
  { id: 'lucky_3', name: '超级幸运', type: 'passive', tier: 3, desc: '不会被暴击，闪避+10%，受到伤害-5%', effect: { antiCrit: 1.00, dodgeBonus: 0.10, dmgReduce: 0.05 } },
  // ===== 参考2026长安幻想新增技能 =====
  // 强壮：减伤型生存技能（区别于防御的加防）
  { id: 'sturdy', name: '强壮', type: 'passive', tier: 1, desc: '受到伤害-5%，气血上限+8%', effect: { dmgReduce: 0.05 } },
  { id: 'sturdy_2', name: '高级强壮', type: 'passive', tier: 2, desc: '受到伤害-10%，气血上限+15%', effect: { dmgReduce: 0.10 } },
  { id: 'sturdy_3', name: '超级强壮', type: 'passive', tier: 3, desc: '受到伤害-18%，气血上限+25%，受到致命伤时减伤翻倍', effect: { dmgReduce: 0.18 } },
  // 穿透：无视防御型输出技能（区别于偷袭的加攻）
  { id: 'penetration', name: '穿透', type: 'passive', tier: 1, desc: '无视5%防御', effect: { ignoreDef: 0.05 } },
  { id: 'penetration_2', name: '高级穿透', type: 'passive', tier: 2, desc: '无视10%防御', effect: { ignoreDef: 0.10 } },
  { id: 'penetration_3', name: '超级穿透', type: 'passive', tier: 3, desc: '无视18%防御，攻击力+8%', effect: { ignoreDef: 0.18, atkBonus: 0.08 } },
  // 精准：暴击+攻击双加成（长安幻想热门技能）
  { id: 'precision', name: '精准', type: 'passive', tier: 1, desc: '暴击率+5%，攻击力+5%', effect: { critRate: 0.05, atkBonus: 0.05 } },
  { id: 'precision_2', name: '高级精准', type: 'passive', tier: 2, desc: '暴击率+10%，攻击力+10%', effect: { critRate: 0.10, atkBonus: 0.10 } },
  { id: 'precision_3', name: '超级精准', type: 'passive', tier: 3, desc: '暴击率+15%，攻击力+15%，暴击伤害+30%', effect: { critRate: 0.15, atkBonus: 0.15, critDmg: 0.30 } },
  // 追击：击倒后追击（长安幻想核心输出技能，区别于连击的随机双击）
  { id: 'pursuit', name: '追击', type: 'passive', tier: 1, desc: '15%概率追加一次攻击', effect: { doubleChance: 0.15 } },
  { id: 'pursuit_2', name: '高级追击', type: 'passive', tier: 2, desc: '25%概率追加一次攻击', effect: { doubleChance: 0.25 } },
  { id: 'pursuit_3', name: '超级追击', type: 'passive', tier: 3, desc: '35%概率追加一次攻击，10%概率追加两次', effect: { doubleChance: 0.35, tripleChance: 0.10 } },
  // 保命：濒死保命（长安幻想保命技能，区别于神佑的满血复活）
  { id: 'survival', name: '保命', type: 'passive', tier: 1, desc: '死亡时20%概率保留1点血', effect: { reviveChance: 0.20, revivePct: 0.01 } },
  { id: 'survival_2', name: '高级保命', type: 'passive', tier: 2, desc: '死亡时30%概率保留1点血并恢复20%血', effect: { reviveChance: 0.30, revivePct: 0.20 } },
  { id: 'survival_3', name: '超级保命', type: 'passive', tier: 3, desc: '死亡时40%概率保留1点血并恢复40%血，攻击+15%', effect: { reviveChance: 0.40, revivePct: 0.40, reviveAtk: 0.15 } },
  // 超级撕裂：2026长安幻想物理核心超级技能（保底伤害）
  { id: 'tear_3', name: '超级撕裂', type: 'passive', tier: 3, desc: '无视20%防御，攻击力+12%，造成保底伤害', effect: { ignoreDef: 0.20, atkBonus: 0.12 } },
  // 超级暴伤：2026长安幻想通用爆发技能
  { id: 'crit_dmg_3', name: '超级暴伤', type: 'passive', tier: 3, desc: '暴击伤害+60%，暴击率+8%', effect: { critDmg: 0.60, critRate: 0.08 } },
  // ===== 参考长安幻想普通被动技能 =====
  { id: 'charge', name: '突进', type: 'passive', tier: 1, desc: '攻击力+8%，先手概率+10%', effect: { atkBonus: 0.08, firstStrike: 0.10 } },
  { id: 'magic_fluctuation', name: '法术波动', type: 'passive', tier: 1, desc: '技能伤害在90%~140%间波动，平均+10%', effect: { skillDmg: 0.10 } },
  { id: 'focus', name: '会心', type: 'passive', tier: 1, desc: '暴击伤害+25%', effect: { critDmg: 0.25 } },
  { id: 'meditation', name: '冥思', type: 'passive', tier: 1, desc: '每回合恢复5%魔法值', effect: { mpRegenPct: 0.05 } },
  { id: 'miracle', name: '神迹', type: 'passive', tier: 1, desc: '回合末自动解除异常状态，受到暴击-15%', effect: { antiCrit: 0.15 } },
  { id: 'counter', name: '反击', type: 'passive', tier: 1, desc: '受到攻击时20%概率反击，反弹15%伤害', effect: { reflectPct: 0.15 } },
  { id: 'solid_magic', name: '固法', type: 'passive', tier: 1, desc: '法术防御+15%', effect: { defBonus: 0.15 } },
  { id: 'magic_absorb', name: '法术吸收', type: 'passive', tier: 1, desc: '受到伤害-8%，有概率吸收法术伤害', effect: { dmgReduce: 0.08 } },
  { id: 'perception', name: '感知', type: 'passive', tier: 1, desc: '暴击率+5%，攻击力+5%，无视隐身', effect: { critRate: 0.05, atkBonus: 0.05 } },
  { id: 'poison_atk', name: '毒', type: 'passive', tier: 1, desc: '攻击时20%概率使目标中毒', effect: { doubleChance: 0.20 } },
  { id: 'stealth', name: '隐身', type: 'passive', tier: 1, desc: '进入战斗隐身3回合，闪避+10%', effect: { dodgeBonus: 0.10 } },
  { id: 'cooperation', name: '协力', type: 'passive', tier: 1, desc: '全队存活时攻击力+12%', effect: { atkBonus: 0.12 } },
  { id: 'initiative', name: '先发', type: 'passive', tier: 1, desc: '速度+15%，先手概率+15%', effect: { speedBonus: 0.15, firstStrike: 0.15 } },
  { id: 'unity', name: '归一', type: 'passive', tier: 1, desc: '死亡时15%概率复活恢复30%血', effect: { reviveChance: 0.15, revivePct: 0.30 } },
  { id: 'solid_shield', name: '坚盾', type: 'passive', tier: 1, desc: '防御+10%，受到伤害-5%', effect: { defBonus: 0.10, dmgReduce: 0.05 } },
  { id: 'tenacity', name: '坚韧', type: 'passive', tier: 1, desc: '受到伤害-8%，15%概率格挡', effect: { dmgReduce: 0.08, parryChance: 0.15, parryReduce: 0.40 } },
  { id: 'brave', name: '英勇', type: 'passive', tier: 1, desc: '攻击力+8%，免疫恐惧和胁迫', effect: { atkBonus: 0.08, antiCrit: 0.10 } },
  { id: 'concentration', name: '专注', type: 'passive', tier: 1, desc: '暴击率+8%，攻击力+3%', effect: { critRate: 0.08, atkBonus: 0.03 } },
  { id: 'charge_up', name: '蓄势', type: 'passive', tier: 1, desc: '每回合攻击力+3%，最多+15%', effect: { atkBonus: 0.05 } },
  { id: 'momentum', name: '气势', type: 'passive', tier: 1, desc: '前两回合攻击力+15%', effect: { atkBonus: 0.10, skillDmg: 0.05 } },
  { id: 'longevity', name: '长生', type: 'passive', tier: 1, desc: '每回合恢复4%气血，气血上限+5%', effect: { regenPct: 0.04 } },
  { id: 'wind_chaser', name: '追风', type: 'passive', tier: 1, desc: '速度+20%，闪避+5%', effect: { speedBonus: 0.20, dodgeBonus: 0.05 } },
  { id: 'blink', name: '闪现', type: 'passive', tier: 1, desc: '首回合闪避+30%', effect: { dodgeBonus: 0.15 } },
  { id: 'instant_strike', name: '瞬击', type: 'passive', tier: 1, desc: '15%概率瞬发追加攻击', effect: { doubleChance: 0.15 } },
  { id: 'self_heal', name: '自愈', type: 'passive', tier: 1, desc: '每回合恢复6%气血，免疫封印', effect: { regenPct: 0.06 } },
  { id: 'clear_mind', name: '清心', type: 'passive', tier: 1, desc: '免疫沉默，受到暴击-20%', effect: { antiCrit: 0.20 } },
  { id: 'retaliation', name: '报复', type: 'passive', tier: 1, desc: '受到攻击时25%概率反弹20%伤害', effect: { reflectPct: 0.20 } },
  { id: 'counter_strike', name: '逆击', type: 'passive', tier: 1, desc: '受到攻击时20%概率反击造成50%攻击伤害', effect: { reflectPct: 0.15 } },
  { id: 'eternity', name: '永恒', type: 'passive', tier: 1, desc: '增益状态持续回合+1，技能伤害+8%', effect: { skillDmg: 0.08 } },
  // ===== 需求8：法术类被动技能（增加法术防御/法术辅助类被动，平衡物理/法术比例） =====
  // 法术护盾系：以法力抵伤
  { id: 'mana_shield', name: '法术护盾', type: 'passive', tier: 1, desc: '受到伤害的10%由法力承担', effect: { manaShield: 0.10 } },
  { id: 'mana_shield_2', name: '高级法术护盾', type: 'passive', tier: 2, desc: '受到伤害的20%由法力承担', effect: { manaShield: 0.20 } },
  { id: 'mana_shield_3', name: '超级法术护盾', type: 'passive', tier: 3, desc: '受到伤害的30%由法力承担，法力恢复+5%', effect: { manaShield: 0.30, mpRegenPct: 0.05 } },
  // 法术抵抗系：减少受到的法术伤害
  { id: 'spell_resist', name: '法术抵抗', type: 'passive', tier: 1, desc: '受到法术伤害-10%', effect: { magicDmgReduce: 0.10 } },
  { id: 'spell_resist_2', name: '高级法术抵抗', type: 'passive', tier: 2, desc: '受到法术伤害-18%', effect: { magicDmgReduce: 0.18 } },
  { id: 'spell_resist_3', name: '超级法术抵抗', type: 'passive', tier: 3, desc: '受到法术伤害-28%，免疫沉默', effect: { magicDmgReduce: 0.28 } },
  // 法术穿透系：无视法术防御
  { id: 'spell_pen', name: '法穿', type: 'passive', tier: 1, desc: '法术无视8%防御', effect: { spellPen: 0.08 } },
  { id: 'spell_pen_2', name: '高级法穿', type: 'passive', tier: 2, desc: '法术无视15%防御', effect: { spellPen: 0.15 } },
  { id: 'spell_pen_3', name: '超级法穿', type: 'passive', tier: 3, desc: '法术无视22%防御，技能伤害+10%', effect: { spellPen: 0.22, skillDmg: 0.10 } },
  // 法术暴击系：法术专属暴击
  { id: 'spell_crit', name: '法术暴击', type: 'passive', tier: 1, desc: '法术暴击率+10%', effect: { spellCritRate: 0.10 } },
  { id: 'spell_crit_2', name: '高级法术暴击', type: 'passive', tier: 2, desc: '法术暴击率+18%，法术暴击伤害+25%', effect: { spellCritRate: 0.18, spellCritDmg: 0.25 } },
  { id: 'spell_crit_3', name: '超级法术暴击', type: 'passive', tier: 3, desc: '法术暴击率+28%，法术暴击伤害+50%', effect: { spellCritRate: 0.28, spellCritDmg: 0.50 } },
  // 法力充能系：提升法力上限和恢复
  { id: 'mana_pool', name: '法力充沛', type: 'passive', tier: 1, desc: '法力上限+20%，每回合恢复3%法力', effect: { manaMaxPct: 0.20, mpRegenPct: 0.03 } },
  { id: 'mana_pool_2', name: '高级法力充沛', type: 'passive', tier: 2, desc: '法力上限+35%，每回合恢复5%法力', effect: { manaMaxPct: 0.35, mpRegenPct: 0.05 } },
  { id: 'mana_pool_3', name: '超级法力充沛', type: 'passive', tier: 3, desc: '法力上限+50%，每回合恢复8%法力，技能伤害+10%', effect: { manaMaxPct: 0.50, mpRegenPct: 0.08, skillDmg: 0.10 } },
  // 奥术系：综合法术增强
  { id: 'arcane_focus', name: '奥术聚焦', type: 'passive', tier: 1, desc: '法术伤害+12%，法力恢复3%', effect: { skillDmg: 0.12, mpRegenPct: 0.03 } },
  { id: 'arcane_focus_2', name: '高级奥术聚焦', type: 'passive', tier: 2, desc: '法术伤害+20%，法力恢复5%，法术穿透5%', effect: { skillDmg: 0.20, mpRegenPct: 0.05, spellPen: 0.05 } },
  { id: 'arcane_focus_3', name: '超级奥术聚焦', type: 'passive', tier: 3, desc: '法术伤害+30%，法力恢复8%，法术穿透10%，法术暴击+10%', effect: { skillDmg: 0.30, mpRegenPct: 0.08, spellPen: 0.10, spellCritRate: 0.10 } },
  // 元素亲和系：减少受到的元素伤害并增强对应法术
  { id: 'element_ward', name: '元素守护', type: 'passive', tier: 1, desc: '受到元素伤害-12%', effect: { magicDmgReduce: 0.12 } },
  { id: 'element_ward_2', name: '高级元素守护', type: 'passive', tier: 2, desc: '受到元素伤害-20%，法术伤害+8%', effect: { magicDmgReduce: 0.20, skillDmg: 0.08 } },
  { id: 'element_ward_3', name: '超级元素守护', type: 'passive', tier: 3, desc: '受到元素伤害-30%，法术伤害+15%，每回合恢复3%法力', effect: { magicDmgReduce: 0.30, skillDmg: 0.15, mpRegenPct: 0.03 } },
  // 法术反制系：被攻击时有概率反弹法术伤害
  { id: 'spell_reflect', name: '法术反制', type: 'passive', tier: 1, desc: '受到法术攻击时15%概率反弹30%伤害', effect: { spellReflectChance: 0.15, spellReflectPct: 0.30 } },
  { id: 'spell_reflect_2', name: '高级法术反制', type: 'passive', tier: 2, desc: '受到法术攻击时25%概率反弹40%伤害', effect: { spellReflectChance: 0.25, spellReflectPct: 0.40 } },
  { id: 'spell_reflect_3', name: '超级法术反制', type: 'passive', tier: 3, desc: '受到法术攻击时35%概率反弹50%伤害，反弹时恢复5%法力', effect: { spellReflectChance: 0.35, spellReflectPct: 0.50, mpRegenPct: 0.05 } },
  // 灵力系：提升智力属性
  { id: 'intellect_up', name: '灵力', type: 'passive', tier: 1, desc: '智力属性+15%', effect: { intBonus: 0.15 } },
  { id: 'intellect_up_2', name: '高级灵力', type: 'passive', tier: 2, desc: '智力属性+25%，法力上限+10%', effect: { intBonus: 0.25, manaMaxPct: 0.10 } },
  { id: 'intellect_up_3', name: '超级灵力', type: 'passive', tier: 3, desc: '智力属性+40%，法力上限+20%，法术伤害+10%', effect: { intBonus: 0.40, manaMaxPct: 0.20, skillDmg: 0.10 } },
];

const AURA_SKILLS = [
  { id: 'aura_atk', name: '力量光环', type: 'aura', tier: 1, desc: '全队攻击力+8%', effect: { teamAtk: 0.08 } },
  { id: 'aura_atk_2', name: '高级力量光环', type: 'aura', tier: 2, desc: '全队攻击力+15%', effect: { teamAtk: 0.15 } },
  { id: 'aura_atk_3', name: '超级力量光环', type: 'aura', tier: 3, desc: '全队攻击力+25%', effect: { teamAtk: 0.25 } },
  { id: 'aura_def', name: '防御光环', type: 'aura', tier: 1, desc: '全队防御力+8%', effect: { teamDef: 0.08 } },
  { id: 'aura_def_2', name: '高级防御光环', type: 'aura', tier: 2, desc: '全队防御力+15%', effect: { teamDef: 0.15 } },
  { id: 'aura_def_3', name: '超级防御光环', type: 'aura', tier: 3, desc: '全队防御力+25%', effect: { teamDef: 0.25 } },
  { id: 'aura_spd', name: '速度光环', type: 'aura', tier: 1, desc: '全队速度+8%', effect: { teamSpd: 0.08 } },
  { id: 'aura_spd_2', name: '高级速度光环', type: 'aura', tier: 2, desc: '全队速度+15%', effect: { teamSpd: 0.15 } },
  { id: 'aura_spd_3', name: '超级速度光环', type: 'aura', tier: 3, desc: '全队速度+25%', effect: { teamSpd: 0.25 } },
  { id: 'aura_hp', name: '生命光环', type: 'aura', tier: 1, desc: '全队气血上限+10%', effect: { teamHp: 0.10 } },
  { id: 'aura_hp_2', name: '高级生命光环', type: 'aura', tier: 2, desc: '全队气血上限+18%', effect: { teamHp: 0.18 } },
  { id: 'aura_hp_3', name: '超级生命光环', type: 'aura', tier: 3, desc: '全队气血上限+30%', effect: { teamHp: 0.30 } },
  { id: 'aura_crit', name: '暴击光环', type: 'aura', tier: 1, desc: '全队暴击率+5%', effect: { teamCrit: 0.05 } },
  { id: 'aura_crit_2', name: '高级暴击光环', type: 'aura', tier: 2, desc: '全队暴击率+10%', effect: { teamCrit: 0.10 } },
  { id: 'aura_crit_3', name: '超级暴击光环', type: 'aura', tier: 3, desc: '全队暴击率+18%', effect: { teamCrit: 0.18 } },
  { id: 'aura_regen', name: '回复光环', type: 'aura', tier: 1, desc: '全队每回合恢复3%气血', effect: { teamRegen: 0.03 } },
  { id: 'aura_regen_2', name: '高级回复光环', type: 'aura', tier: 2, desc: '全队每回合恢复5%气血', effect: { teamRegen: 0.05 } },
  { id: 'aura_regen_3', name: '超级回复光环', type: 'aura', tier: 3, desc: '全队每回合恢复8%气血', effect: { teamRegen: 0.08 } },
];

// 需求12：统一技能库（SKILL_LIBRARY）- 商城/宠物/怪物的技能信息均来自此库
// 包含所有主动/被动/光环/血统技能，修改技能只需改这里其他地方自动同步
const ALL_SKILLS = [...ACTIVE_SKILLS, ...PASSIVE_SKILLS, ...AURA_SKILLS];
// 技能库完整索引（含血统技能），统一查询入口
const SKILL_LIBRARY = [...ALL_SKILLS, ...BLOODLINE_SKILLS];

function getSkillById(id) {
  // 优先从完整技能库查询（包含血统技能）
  return SKILL_LIBRARY.find(s => s.id === id) || ALL_SKILLS.find(s => s.id === id);
}

function getSkillBaseId(id) {
  return id.replace(/_(2|3)$/, '');
}

function getSkillBaseName(name) {
  return name.replace(/^(超级|高级)/, '');
}

function getEffectiveSkills(pet) {
  const all = getAllSkills(pet);
  const bestByBase = {};
  all.forEach(s => {
    const baseId = getSkillBaseId(s.id);
    if (!bestByBase[baseId] || getSkillTier(s.id) > getSkillTier(bestByBase[baseId].id)) {
      bestByBase[baseId] = s;
    }
  });
  const effectiveIds = new Set(Object.values(bestByBase).map(s => s.id));
  return all.map(s => ({
    ...s,
    isEffective: effectiveIds.has(s.id),
  }));
}

function getSkillTier(id) {
  if (id.endsWith('_3')) return 3;
  if (id.endsWith('_2')) return 2;
  return 1;
}

function getSkillTierLabel(tier) {
  if (tier === 3) return '超级';
  if (tier === 2) return '高级';
  return '初级';
}

function getSkillTierColor(tier) {
  if (tier === 3) return '#f59e0b';
  if (tier === 2) return '#a855f7';
  return '#22c55e';
}

function getSkillTypeIcon(type) {
  if (type === 'bloodline') return '👑';
  if (type === 'active') return '⚔️';
  if (type === 'passive') return '🛡️';
  if (type === 'aura') return '✨';
  return '📖';
}

function getSkillTypeLabel(type) {
  if (type === 'bloodline') return '血统';
  if (type === 'active') return '主动';
  if (type === 'passive') return '被动';
  if (type === 'aura') return '光环';
  return '技能';
}

const MAPS = [
  { id: 1, name: '起源草地', minLv: 1, maxLv: 5, monsters: ['草地史莱姆', '小野兔', '蝴蝶妖'], eliteName: '巨角野兔', bossName: '草原因子', layers: 10 },
  { id: 2, name: '新手森林', minLv: 1, maxLv: 15, monsters: ['森林史莱姆', '野狼', '巨型蜘蛛'], eliteName: '森林巨狼', bossName: '树精之王', layers: 10 },
  { id: 3, name: '幽暗矿洞', minLv: 10, maxLv: 25, monsters: ['矿洞蝙蝠', '岩石傀儡', '暗影矿工'], eliteName: '矿洞巨魔', bossName: '暗影矿主', layers: 10 },
  { id: 4, name: '亡灵墓地', minLv: 20, maxLv: 35, monsters: ['骷髅战士', '幽灵', '亡灵法师'], eliteName: '死亡骑士', bossName: '巫妖之王', layers: 10 },
  { id: 5, name: '烈焰火山', minLv: 30, maxLv: 45, monsters: ['火焰蜥蜴', '熔岩元素', '火龙幼崽'], eliteName: '熔岩巨人', bossName: '炎魔领主', layers: 10 },
  { id: 6, name: '冰霜高原', minLv: 40, maxLv: 55, monsters: ['冰霜巨魔', '雪狼', '冰晶凤凰'], eliteName: '冰霜巨人', bossName: '冰龙女王', layers: 10 },
  { id: 7, name: '暗影沼泽', minLv: 50, maxLv: 65, monsters: ['沼泽巨鳄', '毒雾花', '暗影蛇'], eliteName: '沼泽九头蛇', bossName: '暗影之主', layers: 10 },
  { id: 8, name: '天空之城', minLv: 60, maxLv: 75, monsters: ['云中守卫', '风暴鹰', '天使哨兵'], eliteName: '大天使长', bossName: '天空之神', layers: 10 },
  { id: 9, name: '深渊裂隙', minLv: 70, maxLv: 85, monsters: ['深渊恶魔', '虚空行者', '混沌之眼'], eliteName: '深渊领主', bossName: '混沌魔王', layers: 10 },
  { id: 10, name: '龙之巢穴', minLv: 80, maxLv: 95, monsters: ['远古巨龙', '龙人守卫', '龙蛋守护者'], eliteName: '上古龙卫', bossName: '万龙之祖', layers: 10 },
  { id: 11, name: '终焉神殿', minLv: 90, maxLv: 110, monsters: ['堕落天使', '末日使者', '创世神卫'], eliteName: '终焉使者', bossName: '创世神', layers: 10 },
];

// ==================== 怪物种族技能组合 ====================
// 任务16：怪现在和宠物一样有种族，每种种族有标准"满技能状态"
// mob=3主动+2被动，elite=4主动+2被动，boss=5主动+3被动（在 MAP_BOSSES 中单独配置）
const MONSTER_RACE_SKILLS = {
  '龙': {
    mob:   { active: ['flame_strike', 'thunder_strike', 'fatal_blow'], passive: ['power_up', 'crit_strike'] },
    elite: { active: ['flame_strike', 'fatal_blow', 'meteor', 'double_slash'], passive: ['power_up_2', 'vampire'] },
  },
  '史莱姆': {
    mob:   { active: ['iron_wall', 'guard_shield', 'flame_strike'], passive: ['def_up', 'regen'] },
    elite: { active: ['iron_wall', 'guard_shield', 'counter_stance', 'thorn_shield'], passive: ['def_up_2', 'parry'] },
  },
  '哥布林': {
    mob:   { active: ['sneak_atk', 'poison_fang', 'poison_mist'], passive: ['sneak_atk', 'dodge'] },
    elite: { active: ['sneak_atk', 'poison_fang', 'poison_mist', 'entangle'], passive: ['sneak_atk_2', 'poison_atk'] },
  },
  '天使': {
    mob:   { active: ['thunder_strike', 'stun_strike', 'holy_light'], passive: ['speed_up', 'lucky'] },
    elite: { active: ['thunder_strike', 'stun_strike', 'holy_light', 'haste'], passive: ['speed_up_2', 'magic_heart'] },
  },
  '精灵': {
    mob:   { active: ['ice_arrow', 'freeze', 'cure'], passive: ['magic_heart', 'regen'] },
    elite: { active: ['ice_arrow', 'freeze', 'blizzard', 'cure'], passive: ['magic_heart_2', 'magic_double'] },
  },
  '恶魔': {
    mob:   { active: ['shadow_strike', 'blood_drain', 'silence'], passive: ['vampire', 'magic_heart'] },
    elite: { active: ['shadow_strike', 'doom_judge', 'blood_drain', 'silence'], passive: ['vampire_2', 'magic_heart_2'] },
  },
};

// 不同地图出现的怪物种族池（小怪/精英）
const MAP_MONSTER_RACES = {
  1:  ['史莱姆', '哥布林'],   // 起源草地
  2:  ['精灵', '哥布林'],     // 新手森林
  3:  ['史莱姆', '哥布林'],   // 幽暗矿洞
  4:  ['恶魔', '史莱姆'],     // 亡灵墓地
  5:  ['龙', '恶魔'],         // 烈焰火山
  6:  ['龙', '天使'],         // 冰霜高原
  7:  ['恶魔', '哥布林'],     // 暗影沼泽
  8:  ['天使', '龙'],         // 天空之城
  9:  ['恶魔', '精灵'],       // 深渊裂隙
  10: ['龙', '恶魔'],         // 龙之巢穴
  11: ['恶魔', '龙'],         // 终焉神殿
};

// ==================== 每个地图固定Boss设计（任务16） ====================
// 每个boss有：固定名称、race、5主动+3被动技能组合、buff列表、独特战利品
// buff 字段含义：atk=攻击力加成, def=防御力加成, spd=速度加成, all=全属性加成, reflect=反伤比例
const MAP_BOSSES = {
  1: { // 起源草地 - 草原因子（史莱姆王）：高防御+反伤buff
    name: '草原因子', race: '史莱姆',
    skills: ['iron_wall', 'guard_shield', 'counter_stance', 'poison_mist', 'thorn_shield'],
    passives: ['def_up_3', 'regen_2', 'parry_2'],
    buffs: { atk: 0.10, def: 0.50, all: 0.10, reflect: 0.30 },
    loot: [],
  },
  2: { // 新手森林 - 树精之王（精灵）：控制+治疗
    name: '树精之王', race: '精灵',
    skills: ['entangle', 'poison_mist', 'cure', 'life_bloom', 'heal_wind'],
    passives: ['regen_2', 'magic_heart_2', 'lucky'],
    buffs: { atk: 0.20, def: 0.30, all: 0.15 },
    loot: [],
  },
  3: { // 幽暗矿洞 - 暗影矿主（哥布林）：高速+毒控
    name: '暗影矿主', race: '哥布林',
    skills: ['sneak_atk', 'poison_fang', 'silence', 'entangle', 'earthquake'],
    passives: ['sneak_atk_2', 'dodge_2', 'poison_atk'],
    buffs: { atk: 0.40, spd: 0.30, all: 0.10 },
    loot: ['exp_ticket'],
  },
  4: { // 亡灵墓地 - 巫妖之王（恶魔）：法术爆发+控制
    name: '巫妖之王', race: '恶魔',
    skills: ['shadow_strike', 'doom_judge', 'silence', 'hypnosis', 'blizzard'],
    passives: ['magic_heart_2', 'vampire_2', 'lucky_2'],
    buffs: { atk: 0.50, def: 0.30, all: 0.20 },
    loot: ['gold_ticket'],
  },
  5: { // 烈焰火山 - 炎魔领主（火龙）：高攻击+燃烧buff
    name: '炎魔领主', race: '龙',
    skills: ['flame_strike', 'flame_storm', 'meteor', 'berserk', 'blood_drain'],
    passives: ['power_up_2', 'crit_strike_2', 'vampire_2'],
    buffs: { atk: 0.50, def: 0.20, all: 0.15 },
    loot: ['egg_ticket'],
  },
  6: { // 冰霜高原 - 冰龙女王（龙）：冰冻控制+防御
    name: '冰龙女王', race: '龙',
    skills: ['ice_arrow', 'freeze', 'blizzard', 'mass_freeze', 'iron_wall'],
    passives: ['magic_heart_2', 'def_up_2', 'regen_2'],
    buffs: { atk: 0.40, def: 0.40, all: 0.15 },
    loot: ['egg_ticket'],
  },
  7: { // 暗影沼泽 - 暗影之主（恶魔）：吸血+沉默
    name: '暗影之主', race: '恶魔',
    skills: ['shadow_strike', 'shadow_burst', 'silence', 'hypnosis', 'blood_drain'],
    passives: ['vampire_2', 'magic_heart_2', 'dodge_2'],
    buffs: { atk: 0.50, spd: 0.30, all: 0.20 },
    // v2.2.0 需求4：技能秘境门票已移除，改为掉落血统副本门票
    loot: ['blood_dungeon_ticket'],
  },
  8: { // 天空之城 - 天空之神（天使）：雷电+圣光
    name: '天空之神', race: '天使',
    skills: ['thunder_strike', 'lightning_chain', 'stun_strike', 'holy_radiance', 'blessing'],
    passives: ['speed_up_2', 'crit_strike_2', 'magic_heart_2'],
    buffs: { atk: 0.50, spd: 0.40, all: 0.25 },
    loot: ['forge_ticket'],
  },
  9: { // 深渊裂隙 - 混沌魔王（恶魔）：混沌法术+狂暴
    name: '混沌魔王', race: '恶魔',
    skills: ['doom_judge', 'meteor', 'shadow_burst', 'berserk', 'silence'],
    passives: ['magic_heart_3', 'vampire_2', 'crit_strike_2'],
    buffs: { atk: 0.60, def: 0.30, all: 0.30 },
    loot: ['map_ticket'],
  },
  10: { // 龙之巢穴 - 万龙之祖（龙）：物理爆发+穿透
    name: '万龙之祖', race: '龙',
    skills: ['fatal_blow', 'flame_storm', 'meteor', 'thunder_strike', 'berserk'],
    passives: ['power_up_3', 'crit_strike_2', 'penetration_2'],
    buffs: { atk: 0.70, def: 0.40, all: 0.30 },
    loot: ['gem_ticket'],
  },
  11: { // 终焉神殿 - 创世神（混沌恶魔）：全属性强化，终极boss
    name: '创世神', race: '恶魔',
    skills: ['doom_judge', 'meteor', 'freeze', 'holy_radiance', 'berserker_fury'],
    passives: ['magic_heart_3', 'vampire_3', 'crit_strike_3'],
    buffs: { atk: 0.80, def: 0.50, all: 0.40 },
    loot: ['guixu_pill'],
  },
};

const CHEST_RARITIES = [
  { id: 'white', name: '白色宝箱', color: '#c0c0c0', icon: '⬜', glow: 'chest-white' },
  { id: 'green', name: '绿色宝箱', color: '#22c55e', icon: '🟩', glow: 'chest-green' },
  { id: 'blue', name: '蓝色宝箱', color: '#3b82f6', icon: '🟦', glow: 'chest-blue' },
  { id: 'purple', name: '紫色宝箱', color: '#a855f7', icon: '🟪', glow: 'chest-purple' },
  { id: 'orange', name: '橙色宝箱', color: '#fb923c', icon: '🟧', glow: 'chest-orange' },
];

function getChestEmoji(rarity) {
  const map = { white: '📦', green: '🧰', blue: '🎁', purple: '💜', orange: '🧡' };
  return map[rarity] || '📦';
}

// ==================== 物品品质系统 ====================
// 低级：孵化石、低级强化石
// 中级：孵化加速器、融合石、所有门票、归元丹、宝石、中级强化石
// 高级：月华露、保底石、归虚丹、高级强化石
const ITEM_QUALITY = {
  low:  { name: '低级', weightMult: 1.0, color: '#9ca3af' },
  mid:  { name: '中级', weightMult: 0.6, color: '#3b82f6' },
  high: { name: '高级', weightMult: 0.3, color: '#a855f7' },
};

// 根据物品id获取品质
function getItemQualityById(id) {
  var lowItems = ['hatch_stone', 'forge_stone_low'];
  // v2.2.0 需求4：移除已废弃的 skill_ticket、pet_ticket，补充 blood_dungeon_ticket
  var midItems = ['hatch_boost', 'fusion_stone', 'exp_ticket', 'gold_ticket', 'egg_ticket', 'forge_ticket', 'map_ticket', 'gem_ticket', 'blood_dungeon_ticket', 'guiyuan_pill', 'forge_stone_mid'];
  var highItems = ['moon_dew', 'protection_stone', 'guixu_pill', 'forge_stone_high'];
  if (lowItems.indexOf(id) >= 0) return 'low';
  if (midItems.indexOf(id) >= 0) return 'mid';
  if (highItems.indexOf(id) >= 0) return 'high';
  if (id && id.indexOf('gem_') === 0) return 'mid';
  return 'mid';
}

// 获取宝箱内容的品质
function getChestContentQuality(content) {
  if (!content) return 'mid';
  if (content.type === 'gold') return 'low';
  if (content.type === 'diamond') return 'high';
  if (content.type === 'talent_point') return 'mid';
  if (content.type === 'egg') return content.tier >= 2 ? 'high' : 'mid';
  if (content.type === 'equipment') {
    if (content.equip && content.equip.rarity) {
      if (content.equip.rarity === 'white' || content.equip.rarity === 'green') return 'low';
      if (content.equip.rarity === 'blue' || content.equip.rarity === 'purple') return 'mid';
      return 'high';
    }
    return 'mid';
  }
  if (content.type === 'skill_book') {
    if (content.book && content.book.tier) {
      if (content.book.tier === 1) return 'low';
      if (content.book.tier === 2) return 'mid';
      return 'high';
    }
    return 'mid';
  }
  if (content.type === 'item') return getItemQualityById(content.id);
  return 'mid';
}

function generateChestContents(rarity) {
  const map = MAPS.find(m => m.id === G.player.currentMap);
  const lv = map ? randomInt(map.minLv, map.maxLv) : G.player.level;
  // 每个宝箱只掉落一个道具，高品质物品出现概率更低（品质权重越低，出现概率越低）
  // 需求4：主线掉落去除打孔钉/进阶丸/修补胶/宝石（这些只能通过活动/商城/打宝图获取）
  var pools = {
    white: [
      { w: 50, quality: 'low',  gen: function(){ return { type: 'gold', amount: randomInt(lv * 5, lv * 15), name: '金币' }; } },
      { w: 14, quality: 'mid',  gen: function(){ return { type: 'item', id: 'hatch_boost', amount: 1, name: '孵化加速器' }; } },
      { w: 12, quality: 'low',  gen: function(){ return { type: 'equipment', equip: generateEquipment('white', lv), name: '白色装备' }; } },
      { w: 10, quality: 'low',  gen: function(){ return { type: 'skill_book', book: pickRandom(PASSIVE_SKILLS.filter(function(s){ return s.tier === 1; })), name: '初级被动技能书' }; } },
      { w: 8,  quality: 'low',  gen: function(){ return { type: 'item', id: 'forge_stone_low', amount: 1, name: '低级强化石' }; } },
      { w: 6,  quality: 'low',  gen: function(){ return { type: 'item', id: 'exp_book', amount: 1, name: '经验书' }; } },
    ],
    green: [
      { w: 38, quality: 'low',  gen: function(){ return { type: 'gold', amount: randomInt(lv * 15, lv * 40), name: '金币' }; } },
      { w: 14, quality: 'low',  gen: function(){ return { type: 'equipment', equip: generateEquipment('green', lv), name: '绿色装备' }; } },
      { w: 12, quality: 'low',  gen: function(){ return { type: 'skill_book', book: pickRandom(PASSIVE_SKILLS.filter(function(s){ return s.tier === 1; })), name: '初级被动技能书' }; } },
      { w: 10, quality: 'mid',  gen: function(){ return { type: 'item', id: 'moon_dew', amount: 1, name: '月华露' }; } },
      { w: 9,  quality: 'low',  gen: function(){ return { type: 'item', id: 'forge_stone_low', amount: randomInt(1, 2), name: '低级强化石' }; } },
      { w: 9,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'exp_book', amount: 1, name: '经验书' }; } },
      { w: 8,  quality: 'mid',  gen: function(){ return { type: 'egg', tier: randomInt(0, 1), name: '宠物蛋' }; } },
    ],
    blue: [
      { w: 28, quality: 'low',  gen: function(){ return { type: 'gold', amount: randomInt(lv * 40, lv * 100), name: '金币' }; } },
      { w: 16, quality: 'mid',  gen: function(){ return { type: 'equipment', equip: generateEquipment('blue', lv), name: '蓝色装备' }; } },
      { w: 14, quality: 'mid',  gen: function(){ return { type: 'skill_book', book: pickRandom([...PASSIVE_SKILLS.filter(function(s){ return s.tier === 2; }), ...ACTIVE_SKILLS]), name: '技能书' }; } },
      { w: 12, quality: 'mid',  gen: function(){ return { type: 'egg', tier: randomInt(0, 1), name: '宠物蛋' }; } },
      { w: 10, quality: 'high', gen: function(){ return { type: 'item', id: 'moon_dew', amount: randomInt(1, 2), name: '月华露' }; } },
      { w: 8,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'exp_ticket', amount: 1, name: '经验副本门票' }; } },
      { w: 7,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'forge_stone_mid', amount: 1, name: '中级强化石' }; } },
      { w: 5,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'exp_book_mid', amount: 1, name: '中级经验书' }; } },
    ],
    purple: [
      { w: 24, quality: 'low',  gen: function(){ return { type: 'gold', amount: randomInt(lv * 100, lv * 300), name: '金币' }; } },
      { w: 18, quality: 'high', gen: function(){ return { type: 'egg', tier: Math.min(getEggTierByMapLevel(), 4), name: '宠物蛋' }; } },
      { w: 14, quality: 'mid',  gen: function(){ return { type: 'equipment', equip: generateEquipment('purple', lv), name: '紫色装备' }; } },
      { w: 12, quality: 'high', gen: function(){ return { type: 'skill_book', book: pickRandom([...PASSIVE_SKILLS.filter(function(s){ return s.tier === 2; }), ...AURA_SKILLS.filter(function(s){ return s.tier <= 2; })]), name: '高级技能书' }; } },
      { w: 9,  quality: 'high', gen: function(){ return { type: 'diamond', amount: randomInt(5, 20), name: '钻石' }; } },
      { w: 8,  quality: 'high', gen: function(){ return { type: 'item', id: 'moon_dew', amount: randomInt(1, 2), name: '月华露' }; } },
      { w: 7,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'egg_ticket', amount: 1, name: '蛋之森林门票' }; } },
      { w: 4,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'forge_stone_mid', amount: randomInt(1, 2), name: '中级强化石' }; } },
      { w: 4,  quality: 'high', gen: function(){ return { type: 'item', id: 'exp_book_mid', amount: 1, name: '中级经验书' }; } },
    ],
    orange: [
      { w: 22, quality: 'low',  gen: function(){ return { type: 'gold', amount: randomInt(lv * 300, lv * 800), name: '金币' }; } },
      { w: 18, quality: 'high', gen: function(){ return { type: 'egg', tier: Math.max(2, Math.min(getEggTierByMapLevel(), 4)), name: '高级宠物蛋' }; } },
      { w: 14, quality: 'high', gen: function(){ return { type: 'equipment', equip: generateEquipment('orange', lv), name: '橙色装备' }; } },
      { w: 12, quality: 'high', gen: function(){ return { type: 'skill_book', book: pickRandom([...PASSIVE_SKILLS.filter(function(s){ return s.tier === 3; }), ...AURA_SKILLS.filter(function(s){ return s.tier === 3; })]), name: '超级技能书' }; } },
      { w: 10, quality: 'high', gen: function(){ return { type: 'diamond', amount: randomInt(20, 50), name: '钻石' }; } },
      { w: 8,  quality: 'high', gen: function(){ return { type: 'item', id: 'moon_dew', amount: 5, name: '月华露' }; } },
      { w: 6,  quality: 'high', gen: function(){ return { type: 'item', id: 'forge_stone_high', amount: randomInt(1, 2), name: '高级强化石' }; } },
      { w: 5,  quality: 'mid',  gen: function(){ return { type: 'item', id: 'egg_ticket', amount: randomInt(1, 2), name: '蛋之森林门票' }; } },
      { w: 5,  quality: 'high', gen: function(){ return { type: 'item', id: 'exp_book_high', amount: 1, name: '高级经验书' }; } },
    ],
  };
  var pool = pools[rarity] || pools.white;
  // 计算有效权重：高品质物品权重更低（出现概率更低）
  var totalW = pool.reduce(function(s, p){
    var q = p.quality || 'mid';
    var mult = ITEM_QUALITY[q] ? ITEM_QUALITY[q].weightMult : 1.0;
    return s + p.w * mult;
  }, 0);
  var roll = Math.random() * totalW;
  var acc = 0;
  for (var i = 0; i < pool.length; i++) {
    var q = pool[i].quality || 'mid';
    var mult = ITEM_QUALITY[q] ? ITEM_QUALITY[q].weightMult : 1.0;
    acc += pool[i].w * mult;
    if (roll < acc) return [pool[i].gen()];
  }
  return [pool[pool.length - 1].gen()];
}

// 宝箱基础掉落率（受天赋加成）
function getChestDropRate(enemyType) {
  var base = enemyType === 'boss' ? 0.20 : enemyType === 'elite' ? 0.10 : 0.05;
  return base * (1 + getTalentBonus('chest_drop') + getTalentBonus('loot_mastery'));
}

function dropChests(enemyType) {
  const chests = [];
  var dropRate = getChestDropRate(enemyType);
  if (Math.random() > dropRate) return chests; // 未掉落
  if (enemyType === 'mob') {
    const roll = Math.random();
    const rarity = roll < 0.8 ? 'white' : 'green';
    chests.push({ id: 'chest_' + Date.now() + '_' + randomInt(1000, 9999), rarity, contents: generateChestContents(rarity), opened: false });
  } else if (enemyType === 'elite') {
    const roll = Math.random();
    let rarity;
    if (roll < 0.5) rarity = 'green';
    else if (roll < 0.9) rarity = 'blue';
    else rarity = 'purple';
    const count = randomInt(1, 2);
    for (let i = 0; i < count; i++) {
      chests.push({ id: 'chest_' + Date.now() + '_' + i + '_' + randomInt(1000, 9999), rarity, contents: generateChestContents(rarity), opened: false });
    }
  } else if (enemyType === 'boss') {
    const roll = Math.random();
    const rarity = roll < 0.7 ? 'purple' : 'orange';
    // 修复：boss固定掉落1个宝箱（原来2~3个是bug）
    chests.push({ id: 'chest_' + Date.now() + '_' + randomInt(1000, 9999), rarity, contents: generateChestContents(rarity), opened: false });
  }
  return chests;
}

function maybeDropTreasureMap() {
  if (G.player.level < 60) return;
  // 应用藏宝图掉落率天赋
  var mapBonus = getTalentBonus('map_drop') + getTalentBonus('loot_mastery');
  const roll = Math.random();
  let rarity = null;
  // 需求4：打宝图概率提高到40%（white 15% + green 10% + blue 15% = 40%）
  if (roll < 0.15 * (1 + mapBonus)) rarity = 'white';
  else if (roll < 0.25 * (1 + mapBonus)) rarity = 'green';
  else if (roll < 0.40 * (1 + mapBonus)) rarity = 'blue';
  if (rarity) {
    if (!G.treasureMaps) G.treasureMaps = [];
    G.treasureMaps.push(generateTreasureMap(rarity));
    addBattleLog('loot', `🗺️ 获得 ${TREASURE_MAP_RARITIES.find(r=>r.id===rarity).name}！`);
  }
}

// 战斗掉落：基于天赋的额外掉落（装备/宝石/进阶丸/打孔钉/修补胶）
// 需求1：主线掉落移除融合石和孵化石（融合石仅由融合页消耗、孵化石仅由商城/活动获取）
// 在 processBattleRewardsLive 中调用
function maybeDropTalentLoot(enemyType) {
  var isBoss = enemyType === 'boss';
  var isElite = enemyType === 'elite';
  var lootMastery = getTalentBonus('loot_mastery');
  // 装备掉落
  var equipChance = getTalentBonus('equip_drop') + lootMastery * 0.5;
  if (isBoss) equipChance += 0.30;
  else if (isElite) equipChance += 0.10;
  if (Math.random() < equipChance) {
    var pl = G.player.level;
    var rarity = Math.random() < 0.05 ? 'orange' : Math.random() < 0.2 ? 'purple' : Math.random() < 0.5 ? 'blue' : 'green';
    var equip = generateEquipment(rarity, pl);
    addEquipmentToBag(equip);
    addBattleLog('loot', `⚔️ 获得 ${EQUIP_RARITY_NAMES[EQUIP_RARITIES.indexOf(rarity)]} ${equip.name}`);
  }
  // 需求4：主线掉落去除打孔钉/修补胶/进阶丸/宝石
  // 这些道具改为只能通过活动/商城/打宝图/进阶试炼/宠物秘境等途径获取
}

const DUNGEONS = [
  { id: 'exp_cave', name: '经验洞穴', type: 'special', minLv: 30, desc: '通关获得大量人物经验（3~5波）', ticketItem: 'exp_ticket' },
  { id: 'gold_mine', name: '黄金矿洞', type: 'special', minLv: 20, desc: '通关获得大量金币（3~5波）', ticketItem: 'gold_ticket' },
  { id: 'egg_forest', name: '蛋之森林', type: 'special', minLv: 15, desc: '通关掉落T2+宠物蛋（3~5波）', ticketItem: 'egg_ticket' },
  // 需求6：技能秘境已移到活动页面（赚取技能书）
  { id: 'forge_mine', name: '强化石矿脉', type: 'special', minLv: 35, desc: '通关掉落2~4颗强化石（按等级分级，3~5波）', ticketItem: 'forge_ticket' },
  { id: 'treasure_ruin', name: '藏宝遗迹', type: 'special', minLv: 40, desc: '通关掉落1~2张藏宝图（3~5波）', ticketItem: 'map_ticket' },
  { id: 'gem_cavern', name: '宝石秘洞', type: 'special', minLv: 30, desc: '通关掉落1~3颗宝石（含天赋额外掉落，3~5波）', ticketItem: 'gem_ticket' },
  // 需求5：血统副本
  { id: 'bloodline_dungeon', name: '血统副本', type: 'special', minLv: 25, desc: '每波概率掉落血统珠，通关额外金币（3波，每日3次）', ticketItem: 'blood_dungeon_ticket' },
  // 需求12：宠物秘境已移到活动页面
];

// 特殊副本每日次数上限（默认3次）
// 需求5：血统副本每日3次；需求12：宠物秘境已移到活动页面（次数由活动管理）
const DUNGEON_DAILY_LIMITS = {
  bloodline_dungeon: 3,
};
function getDungeonDailyLimit(dungeonId) {
  if (DUNGEON_DAILY_LIMITS && DUNGEON_DAILY_LIMITS[dungeonId] != null) return DUNGEON_DAILY_LIMITS[dungeonId];
  return 3;
}

const TEAM_DUNGEONS = [
  { id: 'dragon_lair', name: '巨龙巢穴', bosses: ['火龙', '冰龙', '龙王'], rewards: ['dragon_scale', 'dragon_tooth', 'dragon_crystal'] },
  { id: 'demon_gate', name: '恶魔之门', bosses: ['小恶魔', '恶魔将军', '恶魔领主'], rewards: ['demon_horn', 'demon_heart', 'demon_contract'] },
  { id: 'ancient_ruins', name: '远古遗迹', bosses: ['石像守卫', '远古法师', '遗迹守护者'], rewards: ['ancient_coin', 'magic_book', 'artifact_shard'] },
];

// 需求10：精简核心日常任务到10项，移除边缘任务（宠物装备分解/打造、装备打孔、血统提取）
// 低频重时长玩法移入周常任务池，降低每日负担
const DAILY_TASKS = [
  { id: 'login', name: '每日登录', desc: '登录游戏', reward: { diamond: 10 }, target: 1 },
  { id: 'battle_10', name: '战斗达人', desc: '完成10场战斗', reward: { diamond: 20 }, target: 10 },
  { id: 'draw_10', name: '抽蛋爱好者', desc: '抽蛋10次', reward: { diamond: 15 }, target: 10 },
  { id: 'hatch_egg', name: '孵化师', desc: '孵化1个宠物蛋', reward: { diamond: 15 }, target: 1 },
  { id: 'forge_1', name: '锻造匠人', desc: '强化装备1次', reward: { diamond: 15 }, target: 1 },
  { id: 'gold_earn_5k', name: '财富日赚', desc: '当日累计获得5000金币', reward: { diamond: 10 }, target: 5000 },
  { id: 'skill_learn', name: '技能研习', desc: '学习1本技能书', reward: { diamond: 15 }, target: 1 },
  { id: 'dungeon_run', name: '副本勇士', desc: '完成1次副本', reward: { diamond: 30 }, target: 1 },
  { id: 'arena_3', name: '竞技斗士', desc: '竞技场挑战3次', reward: { diamond: 20 }, target: 3 },
  { id: 'market_trade', name: '商人', desc: '在市场进行1次交易', reward: { diamond: 10 }, target: 1 },
];

// 需求10：周常任务池 —— 低频、重时长的玩法，每周结算一次，奖励更丰厚
const WEEKLY_TASKS = [
  { id: 'tower_5', name: '爬塔先锋', desc: '本周爬塔15层', reward: { diamond: 100 }, target: 15 },
  { id: 'treasure_hunt', name: '寻宝猎人', desc: '本周完成3次打宝图', reward: { diamond: 80 }, target: 3 },
  { id: 'fuse_pet', name: '融合实验', desc: '本周进行3次宠物融合', reward: { diamond: 100 }, target: 3 },
  { id: 'formation_escort', name: '押镖勇士', desc: '本周参与3次押镖', reward: { diamond: 80 }, target: 3 },
  { id: 'skillbook_hunt', name: '技能秘境', desc: '本周参与3次技能秘境', reward: { diamond: 80 }, target: 3 },
  { id: 'petcave_1', name: '宠物秘境', desc: '本周参与3次宠物秘境', reward: { diamond: 100 }, target: 3 },
  { id: 'advance_trial', name: '进阶试炼', desc: '本周参与1次进阶试炼', reward: { diamond: 80 }, target: 1 },
  { id: 'pet_advance', name: '宠物进阶', desc: '本周完成1次宠物进阶', reward: { diamond: 100 }, target: 1 },
  { id: 'dispatch_finish', name: '派遣归来', desc: '本周完成3次派遣奇遇', reward: { diamond: 80 }, target: 3 },
  { id: 'fortress', name: '血色要塞', desc: '本周参与2次血色要塞', reward: { diamond: 100 }, target: 2 },
];

// ==================== 需求1：主线剧情任务链 ====================
// 按功能开启等级设置任务，引导新手了解各功能
// 当没有新功能开启时，任务为3种随机之一：击败敌人奖励经验/金币/孵化蛋奖励钻石
const MAIN_QUEST_CHAIN = [
  { level: 1,  type: 'tutorial', name: '初出茅庐', desc: '欢迎来到暗影纪元！击败5个敌人开始你的冒险', target: 5,  reward: { exp: 200, gold: 500 } },
  { level: 5,  type: 'feature',  name: '派遣奇遇', desc: '达到5级解锁派遣奇遇活动，击败10个敌人', target: 10, reward: { exp: 500, gold: 1000, diamond: 5 } },
  { level: 10, type: 'feature',  name: '金币矿洞', desc: '达到10级解锁金币副本，击败15个敌人', target: 15, reward: { exp: 800, gold: 2000, diamond: 5 } },
  { level: 15, type: 'feature',  name: '蛋之森林', desc: '达到15级解锁蛋副本，孵化1个宠物蛋', target: 1, reward: { exp: 1000, gold: 1500, diamond: 10 }, taskType: 'hatch' },
  { level: 20, type: 'feature',  name: '锻造强化', desc: '达到20级解锁锻造强化功能，击败20个敌人', target: 20, reward: { exp: 1500, gold: 3000, diamond: 10 } },
  { level: 25, type: 'feature',  name: '宝石秘洞', desc: '达到25级解锁宝石功能和技能秘境，击败25个敌人', target: 25, reward: { exp: 2000, gold: 4000, diamond: 15 } },
  { level: 30, type: 'feature',  name: '阵法押镖', desc: '达到30级解锁阵法功能和押镖活动，击败30个敌人', target: 30, reward: { exp: 3000, gold: 5000, diamond: 15 } },
  { level: 35, type: 'feature',  name: '血统觉醒', desc: '达到35级解锁血统功能和血统副本，击败35个敌人', target: 35, reward: { exp: 4000, gold: 6000, diamond: 20 } },
  { level: 40, type: 'feature',  name: '宠物进阶', desc: '达到40级解锁宠物进阶和进阶试炼，击败40个敌人', target: 40, reward: { exp: 5000, gold: 8000, diamond: 20 } },
  { level: 50, type: 'feature',  name: '藏宝探险', desc: '达到50级解锁藏宝图功能，击败50个敌人', target: 50, reward: { exp: 8000, gold: 12000, diamond: 25 } },
  { level: 60, type: 'feature',  name: '宠物装备', desc: '达到60级解锁宠物装备和宠物秘境，击败60个敌人', target: 60, reward: { exp: 12000, gold: 18000, diamond: 30 } },
  { level: 100,type: 'feature',  name: '转生之路', desc: '达到100级解锁转生功能，击败100个敌人', target: 100, reward: { exp: 50000, gold: 50000, diamond: 100 } },
];

// 随机日常任务模板（无新功能时使用）
const MAIN_QUEST_RANDOM_TEMPLATES = [
  { taskType: 'battle_exp',  name: '战斗历练', desc: '击败{N}个敌人，获得经验奖励', targets: [20, 30, 50], reward: { type: 'exp', base: 500, perKill: 50 } },
  { taskType: 'battle_gold', name: '金币猎人', desc: '击败{N}个敌人，获得金币奖励', targets: [20, 30, 50], reward: { type: 'gold', base: 1000, perKill: 100 } },
  { taskType: 'hatch',       name: '孵化专家', desc: '孵化{N}个宠物蛋，获得钻石奖励', targets: [1, 2, 3], reward: { type: 'diamond', base: 3, perHatch: 2 } },
];

// 需求3：战令奖励按目前游戏设定重做（覆盖新材料/进阶丸/打孔钉/血统珠/活动门票等）
// 战令总50级，每级都有奖励；每5级为奖励大关
const BATTLE_PASS_REWARDS = [
  // 1-10级：基础起步
  { level: 1, free: { type: 'gold', amount: 1000 }, premium: { type: 'diamond', amount: 50 } },
  { level: 2, free: { type: 'item', id: 'forge_stone_low', amount: 3 }, premium: { type: 'item', id: 'mystic_crystal_low', amount: 2 } },
  { level: 3, free: { type: 'item', id: 'exp_ticket', amount: 2 }, premium: { type: 'item', id: 'egg_ticket', amount: 3 } },
  { level: 4, free: { type: 'gold', amount: 2000 }, premium: { type: 'item', id: 'advance_pill_low', amount: 2 } },
  { level: 5, free: { type: 'item', id: 'forge_stone_low', amount: 5 }, premium: { type: 'item', id: 'mystic_crystal_mid', amount: 2 } },
  { level: 6, free: { type: 'gold', amount: 3000 }, premium: { type: 'item', id: 'forge_stone_mid', amount: 2 } },
  { level: 7, free: { type: 'item', id: 'exp_book', amount: 1 }, premium: { type: 'item', id: 'protection_stone', amount: 1 } },
  { level: 8, free: { type: 'gold', amount: 4000 }, premium: { type: 'item', id: 'socket_nail', amount: 2 } },
  { level: 9, free: { type: 'item', id: 'hatch_stone', amount: 1 }, premium: { type: 'item', id: 'advance_pill_low', amount: 3 } },
  { level: 10, free: { type: 'gold', amount: 5000 }, premium: { type: 'diamond', amount: 100 } },
  // 11-20级：宠物装备&材料
  { level: 11, free: { type: 'item', id: 'forge_stone_low', amount: 5 }, premium: { type: 'item', id: 'ancient_rune_low', amount: 3 } },
  { level: 12, free: { type: 'gold', amount: 6000 }, premium: { type: 'item', id: 'mystic_crystal_mid', amount: 3 } },
  { level: 13, free: { type: 'item', id: 'exp_book_mid', amount: 1 }, premium: { type: 'item', id: 'yuanxiao_str', amount: 1 } },
  { level: 14, free: { type: 'item', id: 'forge_stone_mid', amount: 4 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 1 } },
  { level: 15, free: { type: 'item', id: 'hatch_boost', amount: 3 }, premium: { type: 'item', id: 'hatch_boost', amount: 5 } },
  { level: 16, free: { type: 'gold', amount: 7000 }, premium: { type: 'item', id: 'socket_nail', amount: 3 } },
  { level: 17, free: { type: 'item', id: 'forge_stone_mid', amount: 2 }, premium: { type: 'item', id: 'forge_stone_high', amount: 2 } },
  { level: 18, free: { type: 'gold', amount: 8000 }, premium: { type: 'item', id: 'yuanxiao_con', amount: 1 } },
  { level: 19, free: { type: 'item', id: 'advance_pill_low', amount: 2 }, premium: { type: 'item', id: 'advance_pill_mid', amount: 2 } },
  { level: 20, free: { type: 'gold', amount: 10000 }, premium: { type: 'diamond', amount: 200 } },
  // 21-30级：进阶&技能
  { level: 21, free: { type: 'item', id: 'mystic_crystal_low', amount: 6 }, premium: { type: 'item', id: 'ancient_rune_mid', amount: 3 } },
  { level: 22, free: { type: 'gold', amount: 12000 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 2 } },
  { level: 23, free: { type: 'item', id: 'forge_stone_mid', amount: 3 }, premium: { type: 'item', id: 'forge_stone_high', amount: 3 } },
  { level: 24, free: { type: 'item', id: 'exp_book_mid', amount: 2 }, premium: { type: 'item', id: 'advance_pill_mid', amount: 3 } },
  { level: 25, free: { type: 'item', id: 'egg_ticket', amount: 2 }, premium: { type: 'egg', tier: 3, amount: 1 } },
  { level: 26, free: { type: 'gold', amount: 14000 }, premium: { type: 'item', id: 'socket_nail', amount: 5 } },
  { level: 27, free: { type: 'item', id: 'blood_orb_low', amount: 2 }, premium: { type: 'item', id: 'blood_orb_mid', amount: 2 } },
  { level: 28, free: { type: 'gold', amount: 15000 }, premium: { type: 'item', id: 'protection_stone', amount: 2 } },
  { level: 29, free: { type: 'item', id: 'repair_glue', amount: 1 }, premium: { type: 'item', id: 'repair_glue', amount: 3 } },
  { level: 30, free: { type: 'gold', amount: 20000 }, premium: { type: 'diamond', amount: 500 } },
  // 31-40级：高级材料
  { level: 31, free: { type: 'item', id: 'forge_stone_high', amount: 1 }, premium: { type: 'item', id: 'forge_stone_high', amount: 3 } },
  { level: 32, free: { type: 'gold', amount: 22000 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 3 } },
  { level: 33, free: { type: 'item', id: 'moon_dew', amount: 2 }, premium: { type: 'item', id: 'yuanxiao_agi', amount: 1 } },
  { level: 34, free: { type: 'item', id: 'mystic_crystal_mid', amount: 8 }, premium: { type: 'item', id: 'ancient_rune_high', amount: 2 } },
  { level: 35, free: { type: 'gold', amount: 25000 }, premium: { type: 'egg', tier: 4, amount: 1 } },
  { level: 36, free: { type: 'item', id: 'advance_pill_mid', amount: 2 }, premium: { type: 'item', id: 'advance_pill_high', amount: 2 } },
  { level: 37, free: { type: 'item', id: 'forge_stone_mid', amount: 5 }, premium: { type: 'item', id: 'forge_stone_high', amount: 5 } },
  { level: 38, free: { type: 'gold', amount: 28000 }, premium: { type: 'item', id: 'yuanxiao_int', amount: 1 } },
  { level: 39, free: { type: 'item', id: 'socket_nail', amount: 3 }, premium: { type: 'item', id: 'repair_glue', amount: 2 } },
  { level: 40, free: { type: 'diamond', amount: 50 }, premium: { type: 'diamond', amount: 800 } },
  // 41-50级：巅峰奖励
  { level: 41, free: { type: 'gold', amount: 30000 }, premium: { type: 'item', id: 'mystic_crystal_high', amount: 5 } },
  { level: 42, free: { type: 'item', id: 'forge_stone_high', amount: 3 }, premium: { type: 'item', id: 'ancient_rune_high', amount: 5 } },
  { level: 43, free: { type: 'item', id: 'blood_orb_mid', amount: 2 }, premium: { type: 'item', id: 'blood_orb_high', amount: 2 } },
  { level: 44, free: { type: 'gold', amount: 32000 }, premium: { type: 'item', id: 'advance_pill_high', amount: 3 } },
  { level: 45, free: { type: 'gold', amount: 35000 }, premium: { type: 'egg', tier: 4, amount: 1 } },
  { level: 46, free: { type: 'item', id: 'exp_book_high', amount: 1 }, premium: { type: 'item', id: 'exp_book_high', amount: 3 } },
  { level: 47, free: { type: 'item', id: 'socket_nail', amount: 5 }, premium: { type: 'item', id: 'repair_glue', amount: 3 } },
  { level: 48, free: { type: 'gold', amount: 38000 }, premium: { type: 'item', id: 'protection_stone', amount: 3 } },
  { level: 49, free: { type: 'item', id: 'advance_pill_high', amount: 2 }, premium: { type: 'item', id: 'advance_pill_high', amount: 5 } },
  { level: 50, free: { type: 'gold', amount: 50000 }, premium: { type: 'diamond', amount: 1500 } },
];

const TOWER_FLOORS = [];
for (let i = 1; i <= 100; i++) {
  const isBoss = i % 10 === 0;
  // 爬塔难度强化：小怪×5, Boss×3
  const powerMult = isBoss ? 3 : 5;
  TOWER_FLOORS.push({
    floor: i, isBoss,
    hp: (100 + i * 50 + (isBoss ? i * 200 : 0)) * powerMult,
    atk: (10 + i * 3 + (isBoss ? i * 10 : 0)) * powerMult,
    def: Math.floor(i * 1.5 * 1.5),
    reward: isBoss ? { diamond: Math.floor(i * 3), gold: i * 200, exp: i * 50 } : { gold: i * 50, diamond: Math.floor(i * 0.5), exp: i * 20 },
    name: isBoss ? `第${i}层首领` : `第${i}层守卫`
  });
}

// 爬塔最大层数：每转生一次增加50层
function getMaxTowerFloors() {
  return 100 + (G.player.rebirth || 0) * 50;
}

// 获取指定层数的塔数据（支持超过100层的动态生成）
function getTowerFloorData(floorNum) {
  if (floorNum < TOWER_FLOORS.length) return TOWER_FLOORS[floorNum];
  // 动态生成超过100层的楼层
  const i = floorNum + 1; // 1-based
  const isBoss = i % 10 === 0;
  // 爬塔难度强化：小怪×5, Boss×3
  const powerMult = isBoss ? 3 : 5;
  return {
    floor: i, isBoss,
    hp: (100 + i * 50 + (isBoss ? i * 200 : 0)) * powerMult,
    atk: (10 + i * 3 + (isBoss ? i * 10 : 0)) * powerMult,
    def: Math.floor(i * 1.5 * 1.5),
    reward: isBoss ? { diamond: Math.floor(i * 3), gold: i * 200, exp: i * 50 } : { gold: i * 50, diamond: Math.floor(i * 0.5), exp: i * 20 },
    name: isBoss ? `第${i}层首领` : `第${i}层守卫`
  };
}

// ==================== 宠物装备系统 ====================
// 宠物装备3栏：1-攻击/灵力, 2-气血, 3-防御
const PET_EQUIP_SLOTS = [
  { id: 'attack', name: '攻击栏', icon: '⚔️', desc: '攻击/灵力加成' },
  { id: 'hp', name: '气血栏', icon: '❤️', desc: '气血加成' },
  { id: 'defense', name: '防御栏', icon: '🛡️', desc: '防御加成' },
];

// 宠物装备品质：优秀(0词条) / 稀有1词条 / 史诗2词条 / 传说3词条 / 神话4词条
const PET_EQUIP_RARITIES = ['uncommon', 'rare', 'epic', 'legend', 'mythic'];
const PET_EQUIP_RARITY_NAMES = ['优秀', '稀有', '史诗', '传说', '神话'];
const PET_EQUIP_RARITY_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#fb923c', '#ef4444'];
const PET_EQUIP_AFFIX_COUNT = [0, 1, 2, 3, 4];

// 宠物装备基础名（按栏位）
const PET_EQUIP_BASE_NAMES = {
  attack: ['爪牙', '利齿', '锋角', '尖刺', '战爪', '尖牙项圈'],
  hp: ['护心镜', '生命符', '气血玉', '魂魄链', '生机护符', '生命项圈'],
  defense: ['护甲壳', '硬皮甲', '鳞片护', '玄铁甲', '护体符', '防御项圈'],
};

// 随机词条类型：增加属性 / 增加资质 / 增加成长 / 宠物技能
const PET_AFFIX_TYPES = [
  // 属性类
  { id: 'p_str', kind: 'stat', stat: '力量', format: v => '力量 +' + v },
  { id: 'p_con', kind: 'stat', stat: '体质', format: v => '体质 +' + v },
  { id: 'p_agi', kind: 'stat', stat: '敏捷', format: v => '敏捷 +' + v },
  { id: 'p_int', kind: 'stat', stat: '智力', format: v => '智力 +' + v },
  { id: 'p_hp', kind: 'stat', stat: '气血', format: v => '气血 +' + v },
  { id: 'p_atk', kind: 'stat', stat: '攻击力', format: v => '攻击力 +' + v },
  { id: 'p_def', kind: 'stat', stat: '防御力', format: v => '防御力 +' + v },
  { id: 'p_spd', kind: 'stat', stat: '速度', format: v => '速度 +' + v },
  // 资质类
  { id: 'p_apt_str', kind: 'aptitude', stat: '力量资质', format: v => '力量资质 +' + v },
  { id: 'p_apt_con', kind: 'aptitude', stat: '体质资质', format: v => '体质资质 +' + v },
  { id: 'p_apt_agi', kind: 'aptitude', stat: '敏捷资质', format: v => '敏捷资质 +' + v },
  { id: 'p_apt_int', kind: 'aptitude', stat: '智力资质', format: v => '智力资质 +' + v },
  // 成长类
  { id: 'p_growth', kind: 'growth', stat: '成长', format: v => '成长 +' + v.toFixed(2) },
  // 需求10：技能词条类 —— 宠物装备随机出现技能词条，装备时附加对应被动技能
  { id: 'p_skill_atk', kind: 'skill', skillPool: ['sneak_atk','power_up','crit_strike','double_atk','precision','charge','pursuit'], format: function(v) { return '技能词条：' + v; } },
  { id: 'p_skill_def', kind: 'skill', skillPool: ['def_up','parry','regen','sturdy','solid_shield','tenacity','solid_magic'], format: function(v) { return '技能词条：' + v; } },
  { id: 'p_skill_spd', kind: 'skill', skillPool: ['dodge','speed_up','wind_chaser','initiative','blink'], format: function(v) { return '技能词条：' + v; } },
  { id: 'p_skill_magic', kind: 'skill', skillPool: ['magic_heart','magic_double','arcane_focus','spell_resist','mana_shield','mana_pool','intellect_up','element_ward'], format: function(v) { return '技能词条：' + v; } },
  { id: 'p_skill_survival', kind: 'skill', skillPool: ['revive','survival','vampire','reflect','lucky','self_heal','clear_mind'], format: function(v) { return '技能词条：' + v; } },
];

// 宠物装备套装系统：1件/3件加成
// weeklyGroup：该套装出现的日期分组（1=周一 2=周二 3=周三 4=周四 5=周五；周六周日全部出现）
const PET_EQUIP_SETS = [
  // 需求18：套装3件套效果独特化，bonus3 中新增效果标识
  {
    id: 'beast', name: '野兽之力', color: '#ef4444',
    desc: '攻击力+5%', desc3: '攻击力+15%, 暴击率+10%, 攻击时30%概率追加一次普攻',
    bonus: { atkPct: 0.05 }, bonus3: { atkPct: 0.15, critRate: 0.10, extraAttack: 0.30 },
    weeklyGroup: [1, 3, 5],
  },
  {
    id: 'guardian', name: '守护之魂', color: '#3b82f6',
    desc: '防御力+10%', desc3: '防御力+25%, 气血+10%, 受到致命伤害免死一次（保留30%气血，每场1次）',
    bonus: { defPct: 0.10 }, bonus3: { defPct: 0.25, hpPct: 0.10, deathImmune: true },
    weeklyGroup: [1, 4],
  },
  {
    id: 'vitality', name: '生机之息', color: '#22c55e',
    desc: '气血+8%', desc3: '气血+20%, 每回合回血5%, 回合结束恢复10%气血',
    bonus: { hpPct: 0.08 }, bonus3: { hpPct: 0.20, regenPct: 0.05, endRegen: 0.10 },
    weeklyGroup: [1, 4],
  },
  {
    id: 'swift', name: '疾风之翼', color: '#06b6d4',
    desc: '速度+8%', desc3: '速度+20%, 闪避率+10%, 攻击目标数+1（普攻可打2个目标）',
    bonus: { spdPct: 0.08 }, bonus3: { spdPct: 0.20, dodgeRate: 0.10, extraTarget: 1 },
    weeklyGroup: [2, 3],
  },
  {
    id: 'wisdom', name: '智慧之源', color: '#a855f7',
    desc: '智力+10%', desc3: '智力+25%, 法术伤害+15%, 法术技能目标数+1（秒3变秒4）',
    bonus: { intPct: 0.10 }, bonus3: { intPct: 0.25, magicDmgPct: 0.15, magicExtraTarget: 1 },
    weeklyGroup: [2, 3, 5],
  },
  {
    id: 'ancient', name: '远古之印', color: '#f59e0b',
    desc: '全属性+3%', desc3: '全属性+8%, 暴击伤害+30%',
    bonus: { allPct: 0.03 }, bonus3: { allPct: 0.08, critDmg: 0.30 },
    weeklyGroup: [2, 4, 5],
  },
];

// 任务14：获取当天可出现的宠物装备套装ID数组
// 周一~周五每天固定3种套装，周六周日全部6种套装都出现
function getWeeklyPetEquipSets() {
  var day = new Date().getDay(); // 0=周日, 1=周一, ..., 6=周六
  // 周六(6)或周日(0)：全部套装 
  if (day === 0 || day === 6) {
    return PET_EQUIP_SETS.map(function(s) { return s.id; });
  }
  // 周一~周五：按 weeklyGroup 过滤
  return PET_EQUIP_SETS.filter(function(s) {
    return s.weeklyGroup && s.weeklyGroup.indexOf(day) >= 0;
  }).map(function(s) { return s.id; });
}

// 宠物装备副本：通关奖励为宠物装备
const PET_EQUIP_DUNGEON = {
  id: 'pet_equip_cave',
  name: '宠物秘境',
  icon: '🐾',
  desc: '挑战神秘秘境，获取宠物装备',
  minLv: 20,
  maxWaves: 5,
  waves: [
    { name: '秘境入口', hpMult: 4, atkMult: 4, reward: '低概率宠物装备' },
    { name: '秘境深处', hpMult: 5, atkMult: 5, reward: '中概率宠物装备' },
    { name: '秘境核心', hpMult: 6, atkMult: 6, reward: '高概率宠物装备' },
    { name: '秘境BOSS', hpMult: 8, atkMult: 8, reward: '稀有宠物装备' },
    { name: '远古守护者', hpMult: 12, atkMult: 10, reward: '传说宠物装备' },
  ],
};

// 需求2：宠物装备材料分级
// 神秘水晶和远古符文按低级/中级/高级分级（需求4：已移除兽皮通用材料）
const PET_EQUIP_MATERIALS = [
  'mystic_crystal_low', 'mystic_crystal_mid', 'mystic_crystal_high',
  'ancient_rune_low', 'ancient_rune_mid', 'ancient_rune_high',
];
const PET_EQUIP_MATERIAL_NAMES = {
  mystic_crystal_low: '低级神秘水晶', mystic_crystal_mid: '中级神秘水晶', mystic_crystal_high: '高级神秘水晶',
  ancient_rune_low: '低级远古符文', ancient_rune_mid: '中级远古符文', ancient_rune_high: '高级远古符文',
};
const PET_EQUIP_MATERIAL_ICONS = {
  mystic_crystal_low: '💠', mystic_crystal_mid: '💠', mystic_crystal_high: '💠',
  ancient_rune_low: '📜', ancient_rune_mid: '📜', ancient_rune_high: '📜',
};
// 材料等级颜色（用于UI展示品质区分）
const PET_EQUIP_MATERIAL_GRADE_COLORS = {
  mystic_crystal_low: '#9ca3af', ancient_rune_low: '#9ca3af',
  mystic_crystal_mid: '#3b82f6', ancient_rune_mid: '#3b82f6',
  mystic_crystal_high: '#f59e0b', ancient_rune_high: '#f59e0b',
};
// 旧材料ID到新低级材料的映射（用于存档迁移）
const PET_EQUIP_LEGACY_MATS = {
  mystic_crystal: 'mystic_crystal_low',
  ancient_rune: 'ancient_rune_low',
};
// 不同品质分解产出的材料数量（产出对应等级的水晶/符文；需求4：已移除兽皮）
const PET_EQUIP_DECOMP_YIELD = {
uncommon: { mystic_crystal_low: [1, 2] },
rare:   { mystic_crystal_low: [2, 3], ancient_rune_low: [1, 2] },
epic:   { mystic_crystal_mid: [3, 4], ancient_rune_mid: [1, 2] },
legend: { mystic_crystal_high: [3, 5], ancient_rune_high: [1, 2] },
  mythic: { mystic_crystal_high: [5, 8], ancient_rune_high: [2, 4] },
};

// 需求2：重做打造系统——按打造等级（low/mid/high）消耗不同品质材料
// 打造等级越高，消耗越高，但产出高品质概率越大
const PET_EQUIP_CRAFT_GRADES = ['low', 'mid', 'high'];
const PET_EQUIP_CRAFT_GRADE_NAMES = { low: '低级打造', mid: '中级打造', high: '高级打造' };
const PET_EQUIP_CRAFT_GRADE_COLORS = { low: '#9ca3af', mid: '#3b82f6', high: '#f59e0b' };
const PET_EQUIP_CRAFT_RECIPES = {
  low:  { mystic_crystal_low: 2, ancient_rune_low: 1, gold: 5000 },
  mid:  { mystic_crystal_mid: 3, ancient_rune_mid: 2, gold: 30000 },
  high: { mystic_crystal_high: 5, ancient_rune_high: 4, gold: 150000 },
};
// 产出品质概率（按打造等级）
// 低级打造：60%优秀(只有基础属性没有词条) + 40%稀有
// 中级打造：50%稀有 + 40%史诗 + 10%传说
// 高级打造：20%稀有 + 40%史诗 + 40%传说
const PET_EQUIP_CRAFT_RATES = {
low:  { uncommon: 0.60, rare: 0.40 },
mid:  { rare: 0.50, epic: 0.40, legend: 0.10 },
high: { rare: 0.20, epic: 0.40, legend: 0.40 },
};

// 宠物技能池（用作随机词条时附加到宠物）
const PET_EQUIP_SKILL_POOL = [
  'skill_p_atk_up', 'skill_p_def_up', 'skill_p_spd_up', 'skill_p_hp_up',
  'skill_p_crit_up', 'skill_p_dodge_up',
];

// ==================== 需求9：功能解锁等级路线 ====================
// 按成长路线规划功能开启等级，未在此表中的功能默认不限制
// 已转生玩家不受等级限制（所有功能自动解锁）
const FEATURE_UNLOCK_LEVELS = {
  // 副本类型
  dungeon_exp:     5,    // 经验副本
  dungeon_gold:    10,   // 金币副本
  dungeon_egg:     15,   // 蛋副本
  dungeon_forge:   20,   // 强化石副本
  dungeon_gem:     25,   // 宝石副本
  dungeon_blood:   35,   // 血统副本
  // 功能模块
  dispatch:        5,    // 派遣奇遇
  forge:           20,   // 锻造强化
  cultivation:     20,   // 人物修炼
  gem:             25,   // 宝石功能
  skill_book_hunt: 25,   // 技能秘境
  formation:       30,   // 阵法功能
  formation_escort:30,   // 押镖活动
  bloodline:       35,   // 血统功能
  pet_advance:     40,   // 宠物进阶
  advance_trial:   40,   // 进阶试炼
  equip_refine:    45,   // 装备洗练
treasure:        50,   // 藏宝图功能
treasure_hunt:   50,   // 打宝图活动
dig:             55,   // 挖密藏
pet_equip:       60,   // 宠物装备
  pet_cave:        60,   // 宠物秘境
  rebirth:         100,  // 转生
};

// 检查功能是否已解锁
function isFeatureUnlocked(featureId) {
  if (G.player.rebirth > 0) return true; // 已转生不受限制
  var level = FEATURE_UNLOCK_LEVELS[featureId];
  if (level === undefined) return true; // 未在表中的功能不限制
  return G.player.level >= level;
}

// 获取功能解锁等级（用于UI提示）
function getFeatureUnlockLevel(featureId) {
  return FEATURE_UNLOCK_LEVELS[featureId] || 0;
}

// 需求5：页面/活动到功能ID的映射（用于导航栏等级限制）
const SCREEN_FEATURE_MAP = {
  formation: 'formation',        // 阵法页 → 阵法功能
  petequip: 'pet_equip',         // 宠物装备页 → 宠物装备
treasure: 'treasure',          // 藏宝图页 → 藏宝图功能
dig: 'dig',                    // 挖密藏页 → 挖密藏功能
rebirth: 'rebirth',            // 转生页 → 转生功能
};

// 活动页签到功能ID的映射
const ACTIVITY_TAB_FEATURE_MAP = {
  treasure: 'treasure',          // 打宝图
  advance: 'pet_advance',        // 进阶试炼
  formation: 'formation_escort', // 押镖
  skillbook: 'skill_book_hunt',  // 技能秘境
  petcave: 'pet_cave',           // 宠物秘境
  dispatch: 'dispatch',          // 派遣奇遇
};

// 功能解锁时显示的剧情文案
const FEATURE_UNLOCK_STORY = {
  dispatch:        '【派遣奇遇】酒馆老板向你招手：「听说附近的森林里藏着不少宝贝，派你的宠物去探索吧！」',
  forge:           '【锻造强化】铁匠铺的锤声响起：「你的装备还不够强！来，让我教你锻造的奥秘。」',
  gem:             '【宝石镶嵌】宝石商人神秘一笑：「这些闪亮的石头能赋予装备新的力量……」',
  skill_book_hunt: '【技能秘境】神秘学者低语：「技能秘境中藏着失传的技能书，你有勇气去探索吗？」',
  formation:       '【阵法系统】老将军展开一幅阵图：「排兵布阵，方能百战百胜！学会阵法，你的队伍将如虎添翼。」',
  formation_escort:'【押镖活动】镖局掌柜拍着你的肩膀：「护送镖车穿越险地，报酬丰厚！敢来吗？」',
  bloodline:       '【血统觉醒】血脉深处的力量在涌动……「你的宠物体内沉睡着远古的血统之力，是时候觉醒了！」',
  pet_advance:     '【宠物进阶】进阶大师审视着你的宠物：「它还有更大的潜力，进阶后将脱胎换骨！」',
  advance_trial:   '【进阶试炼】进阶试炼场已开启，通过试炼获取进阶材料！',
  treasure:        '【藏宝图】一张泛黄的藏宝图在风中展开……「传说中埋藏着无尽宝藏，去寻找吧！」',
dig:             '【挖密藏】神秘老人递给你一张密藏图：「九宫格下暗藏玄机，运气与策略并存，敢来挖宝吗？」',
  treasure_hunt:   '【打宝图活动】藏宝图碎片散落在各处，击败怪物就能收集到它们！',
  pet_equip:       '【宠物装备】装备匠人展示了精致的宠物护甲：「给你的宠物穿上装备，战斗力将大幅提升！」',
  pet_cave:        '【宠物秘境】神秘的宠物秘境入口若隐若现……「深处藏着稀有宠物，带上你的队伍去探索吧！」',
  rebirth:         '【转生之路】天空中光芒大盛……「你已达到凡人的极限，转生后将获得新生，所有功能自动解锁！」',
  cultivation:     '【人物修炼】修炼大师端坐在蒲团上：「内外兼修，方能突破极限。修炼你的四维属性，让宠物也更加强大！」',
  equip_refine:    '【装备洗练】洗练大师展示了神秘的洗练石：「重新洗练装备词条，追求完美属性，就在今日！」',
};

// 获取功能解锁时的剧情文案
function getFeatureUnlockStory(featureId) {
  return FEATURE_UNLOCK_STORY[featureId] || '';
}

// 检查升级后是否有新功能解锁，返回解锁的功能列表
function checkNewlyUnlockedFeatures(newLevel) {
  var unlocked = [];
  for (var featureId in FEATURE_UNLOCK_LEVELS) {
    var reqLevel = FEATURE_UNLOCK_LEVELS[featureId];
    if (reqLevel === newLevel) {
      unlocked.push(featureId);
    }
  }
  return unlocked;
}

// ==================== 需求5：血色要塞活动配置 ====================
// Roguelike无限轮战斗，每5关选增益buff，失败结算奖励
// 怪物强度按等级判断，3个难度，每5关整体强化5%

// 难度配置
const CRIMSON_FORTRESS_DIFFICULTIES = [
  { id: 'easy',   name: '简单', desc: '怪物整体强度下降30%', powerMult: 0.7,  expMult: 3.0 },
  { id: 'normal', name: '普通', desc: '怪物强度与主线一致',   powerMult: 1.0,  expMult: 3.0 },
  { id: 'hard',   name: '困难', desc: '怪物整体强度为1.5倍',   powerMult: 1.5,  expMult: 3.0 },
];

// 增益buff池（按品质决定刷出概率）
const CRIMSON_FORTRESS_BUFF_POOL = [
  // 普通（白色）- 50%权重
  { id: 'cf_atk_up',     name: '攻击强化',   desc: '攻击力+10%',      quality: 'common',   weight: 50, effect: { atkPct: 0.10 } },
  { id: 'cf_def_up',     name: '防御强化',   desc: '防御力+10%',      quality: 'common',   weight: 50, effect: { defPct: 0.10 } },
  { id: 'cf_hp_up',      name: '生命强化',   desc: '气血+15%',        quality: 'common',   weight: 50, effect: { hpPct: 0.15 } },
  { id: 'cf_spd_up',     name: '速度强化',   desc: '速度+10%',        quality: 'common',   weight: 50, effect: { spdPct: 0.10 } },
  { id: 'cf_regen',      name: '持续恢复',   desc: '每回合恢复3%气血', quality: 'common',   weight: 50, effect: { regenPct: 0.03 } },
  // 优秀（绿色）- 30%权重
  { id: 'cf_crit_up',    name: '暴击强化',   desc: '暴击率+10%',      quality: 'uncommon', weight: 30, effect: { critRate: 0.10 } },
  { id: 'cf_vamp_up',    name: '吸血强化',   desc: '攻击吸血10%',     quality: 'uncommon', weight: 30, effect: { vampPct: 0.10 } },
  { id: 'cf_skill_dmg',  name: '法术强化',   desc: '技能伤害+15%',    quality: 'uncommon', weight: 30, effect: { skillDmg: 0.15 } },
  { id: 'cf_dmg_reduce', name: '减伤强化',   desc: '受到伤害-8%',     quality: 'uncommon', weight: 30, effect: { dmgReduce: 0.08 } },
  { id: 'cf_dodge_up',   name: '闪避强化',   desc: '闪避率+8%',       quality: 'uncommon', weight: 30, effect: { dodgeBonus: 0.08 } },
  // 稀有（蓝色）- 15%权重
  { id: 'cf_atk_up2',    name: '攻击精通',   desc: '攻击力+20%',      quality: 'rare',     weight: 15, effect: { atkPct: 0.20 } },
  { id: 'cf_double_atk', name: '连击精通',   desc: '20%概率追加攻击', quality: 'rare',     weight: 15, effect: { doubleChance: 0.20 } },
  { id: 'cf_ignore_def', name: '穿透精通',   desc: '无视15%防御',     quality: 'rare',     weight: 15, effect: { ignoreDef: 0.15 } },
  { id: 'cf_crit_dmg',   name: '暴伤精通',   desc: '暴击伤害+40%',    quality: 'rare',     weight: 15, effect: { critDmg: 0.40 } },
  // 史诗（紫色）- 4%权重
  { id: 'cf_atk_up3',    name: '攻击大师',   desc: '攻击力+30%',      quality: 'epic',     weight: 4,  effect: { atkPct: 0.30 } },
  { id: 'cf_skill_double',name: '法术连发',  desc: '主动技能25%概率连放', quality: 'epic',  weight: 4,  effect: { skillDouble: 0.25 } },
  { id: 'cf_revive',     name: '不屈意志',   desc: '死亡时30%概率复活', quality: 'epic',    weight: 4,  effect: { reviveChance: 0.30, revivePct: 0.50 } },
  // 传说（金色）- 1%权重
  { id: 'cf_all_stat',   name: '全属性强化', desc: '全属性+15%',      quality: 'legendary',weight: 1,  effect: { atkPct: 0.15, defPct: 0.15, hpPct: 0.15, spdPct: 0.15 } },
  { id: 'cf_god_mode',   name: '战神降临',   desc: '攻击力+25%，暴击率+15%，暴击伤害+50%', quality: 'legendary', weight: 1, effect: { atkPct: 0.25, critRate: 0.15, critDmg: 0.50 } },
];

// 每日可开启次数
const CRIMSON_FORTRESS_DAILY_MAX = 2;

// 从buff池中随机3个不同效果的buff
function rollCrimsonFortressBuffs() {
  var pool = CRIMSON_FORTRESS_BUFF_POOL.slice();
  var result = [];
  for (var i = 0; i < 3 && pool.length > 0; i++) {
    var totalWeight = pool.reduce(function(sum, b) { return sum + b.weight; }, 0);
    var r = Math.random() * totalWeight;
    var cum = 0;
    for (var j = 0; j < pool.length; j++) {
      cum += pool[j].weight;
      if (r < cum) {
        result.push(pool[j]);
        pool.splice(j, 1);
        break;
      }
    }
  }
  return result;
}

