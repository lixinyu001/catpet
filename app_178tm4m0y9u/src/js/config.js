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
// 需求16：五维属性体系 —— 力量、敏捷、体质、耐力、魔力（移除原"魔力"，新增"耐力"）
const ATTRIBUTES = ['力量', '敏捷', '体质', '耐力', '魔力'];
const DERIVED_ATTRS = ['气血', '法力'];
// 资质系统：每项属性对应一个资质值(1000-3000)，影响属性成长
// 需求16：魔力资质→魔力资质，新增耐力资质
const APTITUDE_KEYS = ['力量资质', '敏捷资质', '体质资质', '耐力资质', '魔力资质'];

// ==================== 游戏全局常量（集中管理，禁止硬编码） ====================
// 所有散落在代码中的数值统一抽离至此，便于策划调整和版本管理
var GAME_CONSTANTS = {
  // 经验曲线
  EXP_CURVE_BASE: 100,          // 经验公式基数
  EXP_CURVE_EXPONENT: 16,       // 经验公式指数（实际1.6，存储为16/10以避免浮点）
  EXP_CURVE_EXPONENT_DIVISOR: 10,

  // 离线奖励
  OFFLINE_MIN_MINUTES: 5,       // 最少离线5分钟才计算奖励
  OFFLINE_MAX_HOURS: 8,         // 最多累计8小时
  OFFLINE_EXP_PER_MIN_BASE: 8,  // 每分钟经验基数
  OFFLINE_GOLD_PER_MIN_BASE: 5, // 每分钟金币基数
  OFFLINE_PET_EXP_PER_MIN: 4,   // 每分钟宠物经验基数
  OFFLINE_EGG_CHANCE_PER_MIN: 10, // 每分钟蛋掉落概率（万分比）
  OFFLINE_MAX_EGGS: 10,         // 离线最多掉落蛋数

  // 自动保存
  AUTOSAVE_INTERVAL_MS: 30000,  // 自动保存间隔（30秒）
  SAVE_DEBOUNCE_MS: 2000,      // 保存防抖间隔
  SAVE_MAX_SIZE_BYTES: 5242880, // 存档最大5MB

  // 战斗系统
  BATTLE_SPEED_DEFAULT: 1,     // 默认战斗速度
  BATTLE_SPEED_MAX: 4,         // 最大战斗速度
  BATTLE_TURN_BASE_MS: 2000,   // 基础回合时间（毫秒）
  BATTLE_WATCHDOG_INTERVAL_MS: 5000, // 战斗看门狗检查间隔
  CRIT_RATE_BASE: 5,           // 基础暴击率（万分比）
  CRIT_DMG_MULT: 150,          // 暴击伤害倍率（百分比，150%=1.5倍）
  DODGE_RATE_BASE: 5,          // 基础闪避率（万分比）
  PHYSICAL_CRIT_BASE: 8,       // 物理暴击基础（万分比）
  PHYSICAL_CRIT_MAX: 15,       // 物理暴击上限（万分比）

  // 怪物生成
  MONSTER_LV_SCALE_DIVISOR: 1000, // 等级缩放除数（1 + lv * 0.012 → 1 + lv * 12 / 1000）
  MONSTER_LV_SCALE_NUMERATOR: 12,
  MONSTER_HP_VARIANCE: 5,      // 怪物HP浮动（百分比）
  MONSTER_BOSS_DEF_MULT: 180,  // Boss防御倍率（180%=1.8倍）

  // 宠物系统
  PET_MAX_SKILL_SLOTS: 6,      // 宠物最大技能格数
  PET_SPECIAL_CHANCE: 15,      // 异化概率（千分比，15‰=1.5%）
  PET_FUSION_SPECIAL_CHANCE: 30, // 融合异化概率（千分比，30‰=3%）
  PET_FUSION_ONLY_CHANCE: 15,  // 融合限定宠物概率（千分比）
  PET_APTITUDE_MAX: 3000,      // 资质上限
  PET_GROWTH_MAX: 350,         // 成长上限（实际3.5，存储为350/100）

  // 蛋系统
  EGG_HATCH_TIME_BASE_MIN: 30, // 基础孵化时间下限（秒）
  EGG_HATCH_TIME_BASE_MAX: 120,// 基础孵化时间上限（秒）
  EGG_HATCH_TIME_MULTIPLIERS: [1, 15, 50, 210, 405], // T1-T5孵化时间倍率

  // 新手礼包
  NEW_PLAYER_DIAMOND: 10,      // 新手钻石
  NEW_PLAYER_EGGS: 5,          // 新手蛋数
  NEW_PLAYER_HATCH_STONES: 5,  // 新手孵化石
  NEW_PLAYER_BUFF_DURATION: 120, // 新手buff时长（分钟）
  NEW_PLAYER_BUFF_ALL_STAT: 200, // 全属性加成
  NEW_PLAYER_BUFF_EXP_MULT: 2,   // 经验倍率
  NEW_PLAYER_BUFF_GOLD_MULT: 2,  // 金币倍率
  NEW_PLAYER_BUFF_HATCH_MULT: 10,// 孵化速度倍率
  NEW_PLAYER_BUFF_EGG_DROP: 2,   // 蛋掉落倍率

  // 稀有度索引
  RARITY_SPECIAL: 'special',
  RARITY_MYTHIC: 'mythic',

  // 战力权重（千分比）
  CP_WEIGHT_HP: 300,           // 气血权重 0.3
  CP_WEIGHT_ATK: 3000,         // 攻击力权重 3.0
  CP_WEIGHT_DEF: 2000,         // 防御力权重 2.0
  CP_WEIGHT_INT: 2500,         // 灵力权重 2.5
  CP_WEIGHT_SPD: 1500,         // 速度权重 1.5

  // 时间系统
  TIME_PHASE_DURATION_MS: 300000, // 时间阶段持续5分钟

  // 兑换码
  REDEEM_CODE_666_DIAMOND: 100000,
  REDEEM_CODE_888_GOLD: 100000,
  REDEEM_CODE_444_ESSENCE: 99,

  // 融合概率
  FUSION_SKILL_UPGRADE_CHANCE: 50,   // 相同技能升级概率（百分比）
  FUSION_SKILL_KEEP_CHANCE: 60,      // 不同技能保留概率（百分比）
  FUSION_APTITUDE_BOOST: 120,        // 融合限定资质提升（百分比，120%=1.2倍）
  FUSION_GROWTH_BOOST: 115,          // 融合限定成长提升（百分比，115%=1.15倍）
  FUSION_SPECIAL_GROWTH_MULT: 130,   // 融合异化成长倍率（百分比）
  FUSION_SPECIAL_APT_MULT: 120,      // 融合异化资质倍率（百分比）

  // 神兽
  DIVINE_BEAST_GROWTH: 300,    // 神兽固定成长（3.0 = 300/100）
  DIVINE_BEAST_APTITUDE: 3000, // 神兽固定资质
  DIVINE_BEAST_ESSENCE_COST: 99, // 神兽精华兑换需求
};

// 便捷访问器
function GC(key) { return GAME_CONSTANTS[key]; }

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
  '永夜主宰', '圣渊天马', '混沌麒麟', '乾坤龙尊',
  // ===== 进阶系统新宠物（20只：12只T1可进阶 + 8只T3可进阶） =====
  '星光雏', '烈焰幼龙', '寒冰幼龟', '暗影幼狐', '雷霆幼豹', '圣光幼灵',
  '翠叶幼精', '铁甲幼蟹', '噬魂幼蝠', '赤焰幼狮', '冰晶幼鹿', '玄铁幼犀',
  '烈焰战虎', '冰霜法师', '暗影潜行者', '圣盾守卫', '雷电游侠',
  '翡翠术士', '深渊猎手', '苍穹武僧'
];

// ==================== 宠物图鉴 (PET_DEX) ====================
// 每种宠物的资质上下限、成长范围、特色、天生技能池、随机技能池
// 参考《梦幻西游》的宠物种类特色：擅长物理/法术/防御/敏捷等
// aptRange: [下限, 上限] 资质范围(1000-3000)
// growthRange: [成长下限, 成长上限]
// specialty: 'physical'(物理) / 'magic'(法术) / 'defense'(防御) / 'speed'(敏捷) / 'balanced'(均衡)
const PET_DEX = {
  '小火焰': { race:'龙', aptRange:{力量资质:[1400,2000],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1200,1600]}, growthRange:[1.0,2.0], specialty:'physical', innateSkills:['flame_strike','power_up'], desc:'擅长物理攻击的火系幼龙' },
  '冰晶兽': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1600,2200],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[0.8,1.6], specialty:'defense', innateSkills:['iron_wall','def_up'], desc:'防御出色的冰系生物' },
  '暗影狼': { race:'哥布林', aptRange:{力量资质:[1300,1800],体质资质:[900,1300],敏捷资质:[1600,2200],魔力资质:[1000,1400]}, growthRange:[1.2,2.2], specialty:'speed', innateSkills:['sneak_atk','speed_up'], desc:'敏捷极高的暗影猎手' },
  '雷霆鹰': { race:'天使', aptRange:{力量资质:[1200,1700],体质资质:[900,1300],敏捷资质:[1500,2000],魔力资质:[1100,1500]}, growthRange:[1.1,2.0], specialty:'speed', innateSkills:['thunder_strike','stun_strike'], desc:'速度飞快的雷霆猛禽' },
  '翡翠蛇': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1400,1900],魔力资质:[1200,1600]}, growthRange:[1.0,1.8], specialty:'speed', innateSkills:['poison_fang','dodge'], desc:'灵活的毒系蛇类' },
  '岩石巨人': { race:'史莱姆', aptRange:{力量资质:[1400,1900],体质资质:[1800,2400],敏捷资质:[600,1000],魔力资质:[800,1200]}, growthRange:[0.9,1.7], specialty:'defense', innateSkills:['iron_wall','parry'], desc:'坚不可摧的岩石守卫' },
  '风暴龙': { race:'龙', aptRange:{力量资质:[1500,2100],体质资质:[1200,1600],敏捷资质:[1300,1700],魔力资质:[1400,1800]}, growthRange:[1.3,2.3], specialty:'physical', innateSkills:['thunder_strike','armor_break'], desc:'掌控风暴的巨龙' },
  '月光狐': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1500,2000],魔力资质:[1400,1900]}, growthRange:[1.2,2.1], specialty:'magic', innateSkills:['cure','magic_heart'], desc:'擅长治疗的月光精灵' },
  '深渊鱼': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1000,1400],魔力资质:[1500,2000]}, growthRange:[1.0,1.9], specialty:'magic', innateSkills:['shadow_strike','magic_double'], desc:'深渊中的法术使者' },
  '烈焰凤凰': { race:'龙', aptRange:{力量资质:[1600,2200],体质资质:[1300,1700],敏捷资质:[1400,1800],魔力资质:[1500,2000]}, growthRange:[1.5,2.5], specialty:'physical', innateSkills:['flame_strike','fatal_blow','revive'], desc:'浴火重生的神鸟' },
  '霜冻巨人': { race:'史莱姆', aptRange:{力量资质:[1500,2000],体质资质:[2000,2600],敏捷资质:[700,1100],魔力资质:[1000,1400]}, growthRange:[1.2,2.0], specialty:'defense', innateSkills:['iron_wall','freeze'], desc:'冰封万里的巨人' },
  '幽灵猫': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1800,2400],魔力资质:[1300,1700]}, growthRange:[1.3,2.3], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'来去无踪的幽灵' },
  '黄金甲虫': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1700,2300],敏捷资质:[900,1300],魔力资质:[1000,1400]}, growthRange:[1.0,1.8], specialty:'defense', innateSkills:['guard_shield','def_up'], desc:'金甲护身的甲虫' },
  '星辰鹿': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1100,1500],敏捷资质:[1300,1700],魔力资质:[1600,2200]}, growthRange:[1.3,2.3], specialty:'magic', innateSkills:['holy_light','magic_heart'], desc:'蕴含星辰之力的神鹿' },
  '毒液蜘蛛': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1500,2000],魔力资质:[1300,1700]}, growthRange:[1.1,2.0], specialty:'speed', innateSkills:['poison_fang','poison_mist'], desc:'剧毒的织网者' },
  '钢铁犀牛': { race:'史莱姆', aptRange:{力量资质:[1700,2300],体质资质:[1900,2500],敏捷资质:[600,1000],魔力资质:[800,1200]}, growthRange:[1.0,1.8], specialty:'defense', innateSkills:['iron_wall','armor_break'], desc:'冲锋陷阵的铁甲兽' },
  '幻影蝶': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[800,1200],敏捷资质:[1600,2200],魔力资质:[1500,2000]}, growthRange:[1.2,2.2], specialty:'magic', innateSkills:['poison_mist','magic_double'], desc:'制造幻象的法术蝶' },
  '熔岩龟': { race:'史莱姆', aptRange:{力量资质:[1300,1800],体质资质:[2000,2600],敏捷资质:[700,1100],魔力资质:[1100,1500]}, growthRange:[1.0,1.9], specialty:'defense', innateSkills:['iron_wall','flame_strike'], desc:'熔岩护体的巨龟' },
  '飓风雕': { race:'天使', aptRange:{力量资质:[1200,1600],体质资质:[900,1300],敏捷资质:[1800,2400],魔力资质:[1100,1500]}, growthRange:[1.3,2.3], specialty:'speed', innateSkills:['haste','stun_strike'], desc:'驾驭飓风的猛禽' },
  '水晶龙': { race:'龙', aptRange:{力量资质:[1400,1900],体质资质:[1300,1700],敏捷资质:[1200,1600],魔力资质:[1500,2100]}, growthRange:[1.3,2.3], specialty:'magic', innateSkills:['ice_arrow','magic_heart'], desc:'水晶之力的法术龙' },
  '暗夜蝙蝠': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1700,2300],魔力资质:[1300,1700]}, growthRange:[1.1,2.0], specialty:'speed', innateSkills:['sneak_atk','blood_drain'], desc:'黑夜中的声波猎手' },
  '森林守护者': { race:'精灵', aptRange:{力量资质:[1200,1600],体质资质:[1500,2000],敏捷资质:[1100,1500],魔力资质:[1600,2200]}, growthRange:[1.4,2.4], specialty:'magic', innateSkills:['life_bloom','heal_wind','aura_hp'], desc:'森林的守护神灵' },
  '雷电麒麟': { race:'龙', aptRange:{力量资质:[1600,2200],体质资质:[1400,1800],敏捷资质:[1500,2000],魔力资质:[1400,1800]}, growthRange:[1.5,2.5], specialty:'physical', innateSkills:['thunder_strike','fatal_blow','aura_atk'], desc:'雷电缠绕的神兽' },
  '冰霜女巫': { race:'恶魔', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1200,1600],魔力资质:[1900,2500]}, growthRange:[1.4,2.4], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'掌控冰霜的法术大师' },
  '火焰魔像': { race:'史莱姆', aptRange:{力量资质:[1700,2300],体质资质:[1800,2400],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[1.2,2.0], specialty:'defense', innateSkills:['iron_wall','flame_strike'], desc:'烈焰铸就的魔像' },
  '深海巨兽': { race:'史莱姆', aptRange:{力量资质:[1800,2400],体质资质:[2000,2600],敏捷资质:[700,1100],魔力资质:[1000,1400]}, growthRange:[1.3,2.1], specialty:'defense', innateSkills:['iron_wall','guard_shield'], desc:'深海的恐怖巨兽' },
  '天空之翼': { race:'天使', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1900,2500],魔力资质:[1200,1600]}, growthRange:[1.4,2.4], specialty:'speed', innateSkills:['haste','stun_strike','aura_spd'], desc:'天空的霸主' },
  '大地之灵': { race:'史莱姆', aptRange:{力量资质:[1400,1900],体质资质:[1800,2400],敏捷资质:[1000,1400],魔力资质:[1300,1700]}, growthRange:[1.3,2.2], specialty:'defense', innateSkills:['iron_wall','guard_shield'], desc:'大地之力的化身' },
  '时空行者': { race:'天使', aptRange:{力量资质:[1200,1600],体质资质:[1100,1500],敏捷资质:[1600,2200],魔力资质:[1700,2300]}, growthRange:[1.5,2.5], specialty:'magic', innateSkills:['freeze','magic_double_2','aura_spd'], desc:'操控时空的旅者' },
  '混沌之眼': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1300,1700],魔力资质:[2000,2600]}, growthRange:[1.6,2.6], specialty:'magic', innateSkills:['doom_judge','meteor','magic_heart_2'], desc:'混沌本源的注视' },
  '圣光天使': { race:'天使', aptRange:{力量资质:[1300,1700],体质资质:[1400,1800],敏捷资质:[1300,1700],魔力资质:[1800,2400]}, growthRange:[1.6,2.6], specialty:'magic', innateSkills:['holy_radiance','holy_light','blessing'], desc:'圣光降临的天使' },
  '暗黑恶魔': { race:'恶魔', aptRange:{力量资质:[1800,2400],体质资质:[1500,1900],敏捷资质:[1400,1800],魔力资质:[1500,1900]}, growthRange:[1.6,2.6], specialty:'physical', innateSkills:['shadow_strike','fatal_blow','vampire_2'], desc:'黑暗深渊的恶魔' },
  '翡翠巨龙': { race:'龙', aptRange:{力量资质:[1700,2300],体质资质:[1500,1900],敏捷资质:[1400,1800],魔力资质:[1600,2100]}, growthRange:[1.7,2.7], specialty:'physical', innateSkills:['double_slash','fatal_blow','aura_atk_2'], desc:'翡翠之力的远古巨龙' },
  '紫电貂': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1900,2500],魔力资质:[1400,1800]}, growthRange:[1.5,2.5], specialty:'speed', innateSkills:['thunder_strike','dodge_2','aura_spd'], desc:'迅如闪电的紫貂' },
  '金刚猿': { race:'哥布林', aptRange:{力量资质:[2000,2600],体质资质:[1700,2200],敏捷资质:[1000,1400],魔力资质:[900,1300]}, growthRange:[1.5,2.4], specialty:'physical', innateSkills:['double_slash','armor_break','power_up_2'], desc:'力大无穷的巨猿' },
  '九尾灵狐': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[1100,1500],敏捷资质:[1500,2000],魔力资质:[1900,2500]}, growthRange:[1.7,2.7], specialty:'magic', innateSkills:['flame_storm','magic_double_2','aura_crit'], desc:'九尾天狐的法术化身' },
  '三头地狱犬': { race:'恶魔', aptRange:{力量资质:[1900,2500],体质资质:[1600,2100],敏捷资质:[1300,1700],魔力资质:[1200,1600]}, growthRange:[1.6,2.6], specialty:'physical', innateSkills:['flame_strike','blood_drain','berserk'], desc:'地狱的三头猛犬' },
  '独角天马': { race:'天使', aptRange:{力量资质:[1500,2000],体质资质:[1300,1700],敏捷资质:[1700,2300],魔力资质:[1500,1900]}, growthRange:[1.7,2.7], specialty:'speed', innateSkills:['haste','holy_light','aura_spd_2'], desc:'圣洁的独角天马' },
  '美杜莎': { race:'恶魔', aptRange:{力量资质:[1200,1600],体质资质:[1100,1500],敏捷资质:[1400,1800],魔力资质:[1800,2400]}, growthRange:[1.6,2.6], specialty:'magic', innateSkills:['freeze','poison_mist','magic_heart_2'], desc:'石化之眼的诅咒者' },
  '牛头人酋长': { race:'哥布林', aptRange:{力量资质:[2100,2700],体质资质:[1900,2400],敏捷资质:[800,1200],魔力资质:[900,1300]}, growthRange:[1.5,2.4], specialty:'physical', innateSkills:['armor_break','double_slash','power_up_2'], desc:'蛮力无双的牛头人' },
  '鹰身女妖': { race:'天使', aptRange:{力量资质:[1300,1700],体质资质:[900,1300],敏捷资质:[1800,2400],魔力资质:[1200,1600]}, growthRange:[1.4,2.4], specialty:'speed', innateSkills:['stun_strike','dodge_2','aura_spd'], desc:'疾风的鹰身女妖' },
  '石像鬼': { race:'史莱姆', aptRange:{力量资质:[1500,2000],体质资质:[2100,2700],敏捷资质:[600,1000],魔力资质:[900,1300]}, growthRange:[1.2,2.0], specialty:'defense', innateSkills:['iron_wall','parry'], desc:'石化之躯的守卫' },
  '吸血鬼伯爵': { race:'恶魔', aptRange:{力量资质:[1600,2100],体质资质:[1300,1700],敏捷资质:[1500,2000],魔力资质:[1500,1900]}, growthRange:[1.6,2.6], specialty:'physical', innateSkills:['blood_drain','vampire_2','fatal_blow'], desc:'吸血的暗夜贵族' },
  '狼人战士': { race:'哥布林', aptRange:{力量资质:[1800,2400],体质资质:[1500,1900],敏捷资质:[1400,1800],魔力资质:[1000,1400]}, growthRange:[1.5,2.4], specialty:'physical', innateSkills:['berserk','double_slash','crit_strike_2'], desc:'月圆之夜的狂战士' },
  '精灵射手': { race:'精灵', aptRange:{力量资质:[1400,1800],体质资质:[1000,1400],敏捷资质:[1800,2400],魔力资质:[1300,1700]}, growthRange:[1.5,2.5], specialty:'speed', innateSkills:['fatal_blow','sneak_atk_2','dodge_2'], desc:'百步穿杨的射手' },
  '矮人铁匠': { race:'哥布林', aptRange:{力量资质:[1700,2200],体质资质:[1800,2300],敏捷资质:[900,1300],魔力资质:[1200,1600]}, growthRange:[1.3,2.2], specialty:'defense', innateSkills:['iron_wall','guard_shield','def_up'], desc:'锻造大师矮人' },
  '哥布林盗贼': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1900,2500],魔力资质:[1200,1600]}, growthRange:[1.4,2.4], specialty:'speed', innateSkills:['sneak_atk_2','dodge_2','speed_up_2'], desc:'神出鬼没的盗贼' },
  '史莱姆王': { race:'史莱姆', aptRange:{力量资质:[1600,2100],体质资质:[2200,2800],敏捷资质:[800,1200],魔力资质:[1200,1600]}, growthRange:[1.5,2.4], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp_2'], desc:'史莱姆的王者' },
  '冰霜巨龙': { race:'龙', aptRange:{力量资质:[1800,2400],体质资质:[1600,2000],敏捷资质:[1400,1800],魔力资质:[1700,2200]}, growthRange:[1.8,2.8], specialty:'physical', innateSkills:['ice_arrow','fatal_blow','freeze'], desc:'冰封万里的远古巨龙' },
  '火焰领主': { race:'恶魔', aptRange:{力量资质:[1900,2500],体质资质:[1700,2100],敏捷资质:[1300,1700],魔力资质:[1800,2300]}, growthRange:[1.8,2.8], specialty:'physical', innateSkills:['meteor','flame_strike','berserk'], desc:'烈焰的统治者' },
  '风暴之神': { race:'天使', aptRange:{力量资质:[1600,2100],体质资质:[1400,1800],敏捷资质:[1900,2500],魔力资质:[1700,2200]}, growthRange:[1.9,2.9], specialty:'speed', innateSkills:['thunder_strike','stun_strike','aura_spd_3'], desc:'掌管风暴的神祇' },
  '大地泰坦': { race:'史莱姆', aptRange:{力量资质:[2000,2600],体质资质:[2400,3000],敏捷资质:[700,1100],魔力资质:[1100,1500]}, growthRange:[1.7,2.6], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp_2'], desc:'大地的终极化身' },
  '海洋霸主': { race:'史莱姆', aptRange:{力量资质:[2000,2600],体质资质:[2200,2800],敏捷资质:[1000,1400],魔力资质:[1400,1800]}, growthRange:[1.8,2.7], specialty:'physical', innateSkills:['double_slash','armor_break','power_up_2'], desc:'深海的无上霸主' },
  '天空霸主': { race:'天使', aptRange:{力量资质:[1800,2400],体质资质:[1500,1900],敏捷资质:[2000,2600],魔力资质:[1600,2000]}, growthRange:[1.9,2.9], specialty:'speed', innateSkills:['haste','stun_strike','aura_spd_3'], desc:'天空的至高存在' },
  '混沌魔龙': { race:'龙', aptRange:{力量资质:[2100,2700],体质资质:[1900,2300],敏捷资质:[1700,2100],魔力资质:[2000,2600]}, growthRange:[2.0,3.0], specialty:'physical', innateSkills:['doom_judge','fatal_blow','aura_atk_3'], desc:'混沌本源的魔龙' },
  '创世神龙': { race:'龙', aptRange:{力量资质:[2300,2900],体质资质:[2200,2800],敏捷资质:[2000,2600],魔力资质:[2200,2800]}, growthRange:[2.2,3.2], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'创世之力的神龙' },
  '小史莱姆': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:['blessing'], desc:'最普通的初级史莱姆' },
  '绿毛虫': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'physical', innateSkills:['double_slash'], desc:'啃食树叶的毛毛虫' },
  '野鼠': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],魔力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'speed', innateSkills:[], desc:'四处流窜的野鼠' },
  '小精灵': { race:'精灵', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['cure'], desc:'初出茅庐的小精灵' },
  '雏鹰': { race:'天使', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],魔力资质:[1000,1400]}, growthRange:[0.6,1.3], specialty:'speed', innateSkills:['dodge'], desc:'羽翼未丰的雏鹰' },
  '小恶魔': { race:'恶魔', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['shadow_strike'], desc:'调皮捣蛋的小恶魔' },
  '幼龙': { race:'龙', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[900,1300]}, growthRange:[0.8,1.3], specialty:'physical', innateSkills:['flame_strike'], desc:'刚破壳的幼龙' },
  '蘑菇人': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1400,1800],敏捷资质:[700,1100],魔力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'defense', innateSkills:['def_up'], desc:'潮湿处的蘑菇小人' },
  '麻雀': { race:'天使', aptRange:{力量资质:[900,1300],体质资质:[800,1200],敏捷资质:[1300,1700],魔力资质:[900,1300]}, growthRange:[0.6,1.2], specialty:'speed', innateSkills:[], desc:'成群结队的小鸟' },
  '青蛙': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:[], desc:'池塘边的青蛙' },
  '蝙蝠崽': { race:'恶魔', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],魔力资质:[1000,1400]}, growthRange:[0.7,1.3], specialty:'speed', innateSkills:['sneak_atk'], desc:'洞穴中的小蝙蝠' },
  '小地精': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:[], desc:'矮小机灵的地精' },
  '萤火虫': { race:'精灵', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['magic_heart'], desc:'夜空中闪烁的精灵' },
  '刺猬': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[1400,1800],敏捷资质:[700,1100],魔力资质:[900,1300]}, growthRange:[0.6,1.2], specialty:'defense', innateSkills:['parry'], desc:'浑身尖刺的小兽' },
  '蜗牛': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[1400,1800],敏捷资质:[600,1000],魔力资质:[900,1300]}, growthRange:[0.5,1.1], specialty:'defense', innateSkills:[], desc:'缓慢爬行的蜗牛' },
  '小树精': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.7,1.3], specialty:'balanced', innateSkills:['regen'], desc:'林间的小树精' },
  '蝌蚪': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.5,1.1], specialty:'balanced', innateSkills:[], desc:'水中的小蝌蚪' },
  '小龙崽': { race:'龙', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[900,1300]}, growthRange:[0.8,1.3], specialty:'physical', innateSkills:['power_up'], desc:'蹒跚学步的龙崽' },
  '小骷髅': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[800,1200],敏捷资质:[1000,1400],魔力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'physical', innateSkills:['armor_break'], desc:'墓地游荡的小骷髅' },
  '灰尘怪': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'balanced', innateSkills:[], desc:'角落里的灰尘怪' },
  '花仙子': { race:'精灵', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['life_bloom'], desc:'花丛中的小仙子' },
  '小石怪': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1400,1800],敏捷资质:[700,1100],魔力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'defense', innateSkills:['guard_shield'], desc:'碎石堆成的小怪' },
  '风精灵': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[800,1200],敏捷资质:[1400,1800],魔力资质:[1000,1400]}, growthRange:[0.7,1.3], specialty:'speed', innateSkills:['haste'], desc:'随风飘荡的精灵' },
  '小幽灵': { race:'恶魔', aptRange:{力量资质:[800,1200],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[1200,1600]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['shadow_strike'], desc:'飘忽不定的小幽灵' },
  '青苔蛇': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],魔力资质:[1100,1500]}, growthRange:[1.0,1.5], specialty:'speed', innateSkills:['poison_fang','dodge'], desc:'潮湿处的青苔蛇' },
  '野猪': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'physical', innateSkills:[], desc:'横冲直撞的野猪' },
  '泥潭怪': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:[], desc:'沼泽中的泥潭怪' },
  '铜甲蟹': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'defense', innateSkills:[], desc:'铜壳护身的螃蟹' },
  '霜精灵': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1400,1800]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['ice_arrow','magic_heart'], desc:'寒霜凝聚的精灵' },
  '幼狼': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk','speed_up'], desc:'初露獠牙的幼狼' },
  '火蜥蜴': { race:'龙', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['flame_strike','blood_drain'], desc:'岩浆旁的火蜥蜴' },
  '黑鸦': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:[], desc:'不祥的黑鸦' },
  '小恶魔犬': { race:'恶魔', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1000,1400]}, growthRange:[1.1,1.7], specialty:'physical', innateSkills:['shadow_strike','berserk'], desc:'地狱犬的幼崽' },
  '苔藓巨人': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1700,2100],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'defense', innateSkills:['iron_wall','regen'], desc:'苔藓覆盖的巨人' },
  '夜光蛾': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[1100,1500],魔力资质:[1400,1800]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['poison_mist','magic_double'], desc:'夜光闪烁的飞蛾' },
  '铁甲蚁': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'defense', innateSkills:[], desc:'铁甲护身的蚂蚁' },
  '影狐': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],魔力资质:[1100,1500]}, growthRange:[1.1,1.7], specialty:'speed', innateSkills:['sneak_atk','crit_strike'], desc:'林间穿梭的影狐' },
  '岩蜥蜴': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'defense', innateSkills:[], desc:'岩石间穿行的蜥蜴' },
  '霜狼': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1000,1400]}, growthRange:[1.1,1.7], specialty:'physical', innateSkills:['ice_arrow','power_up'], desc:'冰原上的霜狼' },
  '光之子': { race:'天使', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1400,1800]}, growthRange:[1.0,1.7], specialty:'magic', innateSkills:['holy_light','cure'], desc:'圣光眷顾的孩子' },
  '腐尸虫': { race:'恶魔', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'physical', innateSkills:[], desc:'腐肉滋生的毒虫' },
  '碧眼猫': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1600,2000],魔力资质:[1100,1500]}, growthRange:[1.1,1.7], specialty:'speed', innateSkills:['dodge','speed_up'], desc:'碧绿双眸的灵猫' },
  '沙蝎': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1600,2000],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'defense', innateSkills:[], desc:'沙漠中的毒蝎' },
  '烈风雕': { race:'天使', aptRange:{力量资质:[1200,1600],体质资质:[900,1300],敏捷资质:[1800,2300],魔力资质:[1100,1500]}, growthRange:[1.3,2.0], specialty:'speed', innateSkills:['haste','stun_strike','dodge'], desc:'烈风中的猛雕' },
  '寒冰蝶': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[800,1200],敏捷资质:[1600,2100],魔力资质:[1500,2000]}, growthRange:[1.2,2.0], specialty:'magic', innateSkills:['ice_arrow','freeze','magic_heart'], desc:'寒冰凝聚的灵蝶' },
  '雷豹': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1000,1400],敏捷资质:[1800,2300],魔力资质:[1200,1600]}, growthRange:[1.3,2.1], specialty:'speed', innateSkills:['thunder_strike','crit_strike','speed_up'], desc:'雷电缠绕的猎豹' },
  '玄冰麒麟': { race:'龙', aptRange:{力量资质:[1500,2000],体质资质:[1400,1800],敏捷资质:[1300,1700],魔力资质:[1700,2300]}, growthRange:[1.7,2.5], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'玄冰之力的神兽' },
  '魔神之影': { race:'恶魔', aptRange:{力量资质:[2200,2800],体质资质:[1900,2300],敏捷资质:[1700,2100],魔力资质:[1800,2200]}, growthRange:[2.0,2.9], specialty:'physical', innateSkills:['doom_judge','fatal_blow','aura_atk_3'], desc:'灭世魔神的残影，仍具备强大的力量' },
  '圣光龙神': { race:'龙', aptRange:{力量资质:[2000,2600],体质资质:[2000,2600],敏捷资质:[1900,2400],魔力资质:[2200,2800]}, growthRange:[2.1,3.0], specialty:'magic', innateSkills:['holy_radiance','meteor','aura_hp_3'], desc:'圣光龙族之神' },
  '永恒天使': { race:'天使', aptRange:{力量资质:[1900,2500],体质资质:[2000,2600],敏捷资质:[1900,2400],魔力资质:[2100,2700]}, growthRange:[2.0,2.9], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_def_3'], desc:'永恒不灭的天使' },
  '虚空主宰': { race:'恶魔', aptRange:{力量资质:[1800,2300],体质资质:[1900,2400],敏捷资质:[1800,2300],魔力资质:[2300,2900]}, growthRange:[2.1,3.0], specialty:'magic', innateSkills:['doom_judge','meteor','magic_double_3'], desc:'虚空的主宰者' },
  '万物之母': { race:'精灵', aptRange:{力量资质:[1900,2400],体质资质:[2100,2700],敏捷资质:[1900,2400],魔力资质:[2200,2800]}, growthRange:[2.1,3.0], specialty:'magic', innateSkills:['life_bloom','heal_wind','aura_regen_3'], desc:'孕育万物的母神' },
  // ===== 融合限定特殊宠物（仅融合极低概率出现，不在普通宠物名表中） =====
  '混元圣兽': { race:'龙', aptRange:{力量资质:[2500,3000],体质资质:[2500,3000],敏捷资质:[2200,2800],魔力资质:[2300,2900]}, growthRange:[2.5,3.5], specialty:'balanced', innateSkills:['chaos_strike','holy_radiance','blessing'], desc:'【融合限定】混元本源的圣兽，掌握混元一击之力', fusionOnly: true },
  '灭世魔神': { race:'恶魔', aptRange:{力量资质:[2600,3000],体质资质:[2300,2900],敏捷资质:[2200,2800],魔力资质:[2400,3000]}, growthRange:[2.6,3.5], specialty:'physical', innateSkills:['doom_inferno','meteor','berserk'], desc:'【融合限定】灭世之炎的魔神，掌控毁灭性火焰', fusionOnly: true },
  '时空龙神': { race:'龙', aptRange:{力量资质:[2300,2900],体质资质:[2200,2800],敏捷资质:[2500,3000],魔力资质:[2600,3000]}, growthRange:[2.6,3.5], specialty:'magic', innateSkills:['time_rift','freeze','magic_double_3'], desc:'【融合限定】掌控时空的龙神，能撕裂时空', fusionOnly: true },
  // ===== 神兽（各族独有，固定3.0成长/3000全资质，仅可通过神兽精华兑换获得） =====
  '龙渊帝君': { race:'龙', aptRange:{力量资质:[3000,3000],体质资质:[3000,3000],敏捷资质:[3000,3000],魔力资质:[3000,3000]}, growthRange:[3.0,3.0], specialty:'balanced', innateSkills:['holy_radiance','fatal_blow','aura_atk_3'], desc:'【神兽】龙族至高帝君，掌控龙渊之力，万龙之主', isDivineBeast: true, forceTier: 6 },
  '太古原核': { race:'史莱姆', aptRange:{力量资质:[3000,3000],体质资质:[3000,3000],敏捷资质:[3000,3000],魔力资质:[3000,3000]}, growthRange:[3.0,3.0], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp_3'], desc:'【神兽】史莱姆始祖，万物原初之核，不灭不朽', isDivineBeast: true, forceTier: 6 },
  '万影至尊': { race:'哥布林', aptRange:{力量资质:[3000,3000],体质资质:[3000,3000],敏捷资质:[3000,3000],魔力资质:[3000,3000]}, growthRange:[3.0,3.0], specialty:'speed', innateSkills:['sneak_atk_2','dodge_2','aura_spd_3'], desc:'【神兽】哥布林至高影王，统御万影，来去无踪', isDivineBeast: true, forceTier: 6 },
  '炽天神将': { race:'天使', aptRange:{力量资质:[3000,3000],体质资质:[3000,3000],敏捷资质:[3000,3000],魔力资质:[3000,3000]}, growthRange:[3.0,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_def_3'], desc:'【神兽】天使至高神将，炽天之光，守护苍生', isDivineBeast: true, forceTier: 6 },
  '万木灵尊': { race:'精灵', aptRange:{力量资质:[3000,3000],体质资质:[3000,3000],敏捷资质:[3000,3000],魔力资质:[3000,3000]}, growthRange:[3.0,3.0], specialty:'magic', innateSkills:['life_bloom','heal_wind','aura_regen_3'], desc:'【神兽】精灵万木之灵，生命与自然之主', isDivineBeast: true, forceTier: 6 },
  '深渊魔神': { race:'恶魔', aptRange:{力量资质:[3000,3000],体质资质:[3000,3000],敏捷资质:[3000,3000],魔力资质:[3000,3000]}, growthRange:[3.0,3.0], specialty:'physical', innateSkills:['doom_judge','meteor','berserk'], desc:'【神兽】恶魔深渊之主，吞噬万物的魔神', isDivineBeast: true, forceTier: 6 },
  // ===== 扩展宠物（T1~T5 共 100 种） =====
  // ---------- T1（弱）20 个：成长0.5~1.2，资质800~1500，1个天生技能 ----------
  '草蜢': { race:'哥布林', aptRange:{力量资质:[800,1200],体质资质:[800,1200],敏捷资质:[1000,1400],魔力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'speed', innateSkills:['dodge'], desc:'草丛中蹦跳的小虫' },
  '泥巴怪': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[1100,1500],敏捷资质:[800,1100],魔力资质:[800,1100]}, growthRange:[0.5,1.1], specialty:'defense', innateSkills:['def_up'], desc:'泥巴堆成的小怪' },
  '小蜥蜴': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[800,1100],敏捷资质:[1100,1500],魔力资质:[800,1100]}, growthRange:[0.6,1.1], specialty:'speed', innateSkills:['speed_up'], desc:'灵活的小蜥蜴' },
  '落叶虫': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[900,1300],魔力资质:[800,1200]}, growthRange:[0.5,1.0], specialty:'balanced', innateSkills:['blessing'], desc:'落叶下的青虫' },
  '微光蝶': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[1000,1400],魔力资质:[1000,1500]}, growthRange:[0.6,1.2], specialty:'magic', innateSkills:['magic_heart'], desc:'微光闪烁的蝴蝶' },
  '小田鼠': { race:'哥布林', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'balanced', innateSkills:['blessing'], desc:'田埂上的小田鼠' },
  '嫩芽精': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[800,1200],魔力资质:[1000,1400]}, growthRange:[0.6,1.1], specialty:'magic', innateSkills:['cure'], desc:'嫩芽孕育的小精灵' },
  '水母崽': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[900,1300],魔力资质:[1000,1400]}, growthRange:[0.5,1.0], specialty:'magic', innateSkills:['magic_heart'], desc:'漂浮的小水母' },
  '灰羽雀': { race:'天使', aptRange:{力量资质:[900,1300],体质资质:[800,1100],敏捷资质:[1100,1500],魔力资质:[800,1100]}, growthRange:[0.6,1.2], specialty:'speed', innateSkills:['dodge'], desc:'灰羽毛的小雀' },
  '小跳蛛': { race:'哥布林', aptRange:{力量资质:[1000,1400],体质资质:[800,1100],敏捷资质:[1100,1500],魔力资质:[800,1200]}, growthRange:[0.5,1.1], specialty:'speed', innateSkills:['sneak_atk'], desc:'会跳跃的小蜘蛛' },
  '苔藓鼠': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[1000,1400],敏捷资质:[800,1100],魔力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'defense', innateSkills:['parry'], desc:'苔藓掩护的小鼠' },
  '小孢子': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[900,1300],魔力资质:[1000,1400]}, growthRange:[0.6,1.1], specialty:'magic', innateSkills:['cure'], desc:'飘散的孢子精灵' },
  '风信子': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.6,1.2], specialty:'magic', innateSkills:['magic_heart'], desc:'风中摇曳的花信子' },
  '小石子': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1100,1500],敏捷资质:[800,1100],魔力资质:[800,1100]}, growthRange:[0.5,1.0], specialty:'defense', innateSkills:['guard_shield'], desc:'路边的小石子' },
  '露珠精': { race:'精灵', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[900,1300],魔力资质:[1000,1400]}, growthRange:[0.6,1.1], specialty:'magic', innateSkills:['cure'], desc:'晨露凝成的精灵' },
  '萌新史莱姆': { race:'史莱姆', aptRange:{力量资质:[900,1300],体质资质:[900,1300],敏捷资质:[900,1300],魔力资质:[900,1300]}, growthRange:[0.5,1.0], specialty:'balanced', innateSkills:['blessing'], desc:'初出茅庐的史莱姆' },
  '稻草人': { race:'哥布林', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[800,1100],魔力资质:[800,1100]}, growthRange:[0.5,1.1], specialty:'defense', innateSkills:['parry'], desc:'田野里的稻草人' },
  '小野鸭': { race:'天使', aptRange:{力量资质:[800,1100],体质资质:[900,1300],敏捷资质:[1100,1500],魔力资质:[800,1100]}, growthRange:[0.6,1.1], specialty:'speed', innateSkills:['dodge'], desc:'池塘中的野鸭' },
  '飘浮气泡': { race:'史莱姆', aptRange:{力量资质:[800,1100],体质资质:[800,1100],敏捷资质:[1000,1400],魔力资质:[1000,1400]}, growthRange:[0.5,1.0], specialty:'magic', innateSkills:['magic_heart'], desc:'飘浮的魔法气泡' },
  '弱小龙': { race:'龙', aptRange:{力量资质:[1000,1400],体质资质:[900,1300],敏捷资质:[900,1300],魔力资质:[800,1100]}, growthRange:[0.6,1.2], specialty:'physical', innateSkills:['power_up'], desc:'体弱多病的幼龙' },
  // ---------- T2（普通）25 个：成长0.8~1.8，资质1000~1700，1个天生技能 ----------
  '林间鹿': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[1100,1500],敏捷资质:[1200,1600],魔力资质:[1200,1600]}, growthRange:[0.9,1.5], specialty:'balanced', innateSkills:['blessing'], desc:'林间的灵鹿' },
  '花斑豹': { race:'哥布林', aptRange:{力量资质:[1200,1600],体质资质:[1000,1400],敏捷资质:[1300,1700],魔力资质:[1000,1400]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk'], desc:'花斑迅捷的豹' },
  '赤尾狐': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1400,1700],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['dodge'], desc:'赤尾的灵狐' },
  '青铜蟹': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1300,1700],敏捷资质:[1000,1300],魔力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['iron_wall'], desc:'青铜壳的螃蟹' },
  '丛林狼': { race:'哥布林', aptRange:{力量资质:[1200,1600],体质资质:[1100,1500],敏捷资质:[1300,1700],魔力资质:[1000,1300]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['speed_up'], desc:'丛林中的野狼' },
  '月牙兔': { race:'精灵', aptRange:{力量资质:[1000,1300],体质资质:[1100,1500],敏捷资质:[1200,1600],魔力资质:[1200,1600]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['cure'], desc:'月牙耳的兔' },
  '锈甲虫': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1400,1700],敏捷资质:[1000,1300],魔力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['guard_shield'], desc:'锈甲护身的甲虫' },
  '雪雏': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1300,1700],魔力资质:[1200,1600]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['ice_arrow'], desc:'雪白的雏鸟' },
  '岩鸽': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1300,1700],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['dodge'], desc:'岩间的飞鸽' },
  '暮色鸦': { race:'恶魔', aptRange:{力量资质:[1200,1600],体质资质:[1000,1400],敏捷资质:[1300,1700],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk'], desc:'暮色中的乌鸦' },
  '苔甲蜥': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1400,1700],敏捷资质:[1000,1300],魔力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['def_up'], desc:'苔甲护身的蜥蜴' },
  '幼麒麟': { race:'龙', aptRange:{力量资质:[1300,1700],体质资质:[1100,1500],敏捷资质:[1200,1600],魔力资质:[1100,1500]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['power_up'], desc:'幼年的麒麟' },
  '翡翠蛙': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1100,1500],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'balanced', innateSkills:['blessing'], desc:'翡翠色的蛙' },
  '流火蜥': { race:'龙', aptRange:{力量资质:[1300,1700],体质资质:[1100,1500],敏捷资质:[1200,1600],魔力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['flame_strike'], desc:'流火般的蜥蜴' },
  '寒霜鼠': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[1000,1400],敏捷资质:[1300,1700],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['dodge'], desc:'寒霜中的小鼠' },
  '晨曦鹿': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[1100,1500],敏捷资质:[1200,1600],魔力资质:[1300,1700]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['cure'], desc:'晨曦中的灵鹿' },
  '巨角羊': { race:'哥布林', aptRange:{力量资质:[1300,1700],体质资质:[1400,1700],敏捷资质:[1000,1300],魔力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['guard_shield'], desc:'巨角盘旋的羊' },
  '紫羽鸽': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1400,1700],魔力资质:[1100,1500]}, growthRange:[1.0,1.7], specialty:'speed', innateSkills:['speed_up'], desc:'紫羽的飞鸽' },
  '暗影貂': { race:'哥布林', aptRange:{力量资质:[1200,1600],体质资质:[1000,1300],敏捷资质:[1400,1700],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'speed', innateSkills:['sneak_atk'], desc:'暗影中的紫貂' },
  '银背猿': { race:'哥布林', aptRange:{力量资质:[1400,1700],体质资质:[1300,1700],敏捷资质:[1100,1500],魔力资质:[1000,1400]}, growthRange:[1.0,1.7], specialty:'physical', innateSkills:['power_up'], desc:'银背的巨猿' },
  '烈日甲虫': { race:'史莱姆', aptRange:{力量资质:[1300,1700],体质资质:[1400,1700],敏捷资质:[1000,1300],魔力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['iron_wall'], desc:'烈日下的甲虫' },
  '蓝鳉鱼': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1100,1500],敏捷资质:[1200,1600],魔力资质:[1100,1500]}, growthRange:[1.0,1.6], specialty:'balanced', innateSkills:['blessing'], desc:'蓝色的小鳉鱼' },
  '灰岩龟': { race:'史莱姆', aptRange:{力量资质:[1200,1600],体质资质:[1500,1700],敏捷资质:[1000,1300],魔力资质:[1000,1400]}, growthRange:[0.9,1.5], specialty:'defense', innateSkills:['def_up'], desc:'灰岩壳的龟' },
  '啼鸣鸟': { race:'天使', aptRange:{力量资质:[1100,1500],体质资质:[1000,1300],敏捷资质:[1300,1700],魔力资质:[1100,1500]}, growthRange:[1.0,1.7], specialty:'speed', innateSkills:['dodge'], desc:'啼声悦耳的鸟' },
  '朱砂蝶': { race:'精灵', aptRange:{力量资质:[1000,1300],体质资质:[1000,1400],敏捷资质:[1200,1600],魔力资质:[1300,1700]}, growthRange:[1.0,1.6], specialty:'magic', innateSkills:['magic_double'], desc:'朱砂色的蝶' },
  // ---------- T3（中等）25 个：成长1.2~2.2，资质1300~2000，1~2个天生技能 ----------
  '银鳞龙': { race:'龙', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1400,1800],魔力资质:[1400,1800]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['flame_strike','armor_break'], desc:'银鳞闪耀的龙' },
  '烬羽鸟': { race:'天使', aptRange:{力量资质:[1400,1800],体质资质:[1300,1600],敏捷资质:[1600,2000],魔力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['thunder_strike','stun_strike'], desc:'余烬羽毛的鸟' },
  '玄铁犀': { race:'史莱姆', aptRange:{力量资质:[1600,2000],体质资质:[1800,2000],敏捷资质:[1300,1600],魔力资质:[1300,1600]}, growthRange:[1.3,1.9], specialty:'defense', innateSkills:['iron_wall','parry'], desc:'玄铁甲的犀牛' },
  '翠风狼': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1600,2000],魔力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'翠风的迅狼' },
  '紫电隼': { race:'天使', aptRange:{力量资质:[1400,1800],体质资质:[1300,1600],敏捷资质:[1700,2000],魔力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['thunder_strike'], desc:'紫电之隼' },
  '落日虎': { race:'哥布林', aptRange:{力量资质:[1700,2000],体质资质:[1500,1900],敏捷资质:[1400,1800],魔力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['fatal_blow','berserk'], desc:'落日之虎' },
  '蓝月狐': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1500,1900],魔力资质:[1600,2000]}, growthRange:[1.5,2.1], specialty:'magic', innateSkills:['ice_arrow','magic_double'], desc:'蓝月光下的狐' },
  '烈焰犬': { race:'恶魔', aptRange:{力量资质:[1600,2000],体质资质:[1400,1800],敏捷资质:[1500,1900],魔力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['flame_strike','blood_drain'], desc:'烈焰中的猎犬' },
  '碎石龟': { race:'史莱姆', aptRange:{力量资质:[1500,1900],体质资质:[1800,2000],敏捷资质:[1300,1600],魔力资质:[1300,1600]}, growthRange:[1.3,1.9], specialty:'defense', innateSkills:['iron_wall','guard_shield'], desc:'碎石壳的龟' },
  '寒林鹿': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1400,1800],敏捷资质:[1500,1900],魔力资质:[1600,2000]}, growthRange:[1.5,2.1], specialty:'magic', innateSkills:['ice_arrow','magic_heart'], desc:'寒林中的鹿' },
  '翔云马': { race:'天使', aptRange:{力量资质:[1500,1900],体质资质:[1400,1800],敏捷资质:[1700,2000],魔力资质:[1400,1800]}, growthRange:[1.6,2.2], specialty:'speed', innateSkills:['haste','dodge'], desc:'踏云而行的马' },
  '雷羽雀': { race:'天使', aptRange:{力量资质:[1400,1800],体质资质:[1300,1700],敏捷资质:[1600,2000],魔力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['thunder_strike','stun_strike'], desc:'雷羽之雀' },
  '血藤蛇': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1600,2000],魔力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['poison_fang','sneak_atk'], desc:'血藤色的蛇' },
  '沙暴蝎': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1700,2000],敏捷资质:[1300,1700],魔力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'defense', innateSkills:['iron_wall','poison_fang'], desc:'沙暴中的毒蝎' },
  '星纹豹': { race:'哥布林', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1700,2000],魔力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'星纹的豹' },
  '月华蝶': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1500,1900],魔力资质:[1700,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['magic_double','magic_heart'], desc:'月华之蝶' },
  '赤焰马': { race:'龙', aptRange:{力量资质:[1600,2000],体质资质:[1400,1800],敏捷资质:[1500,1900],魔力资质:[1400,1800]}, growthRange:[1.5,2.1], specialty:'physical', innateSkills:['flame_strike','fatal_blow'], desc:'赤焰奔马' },
  '青木猿': { race:'哥布林', aptRange:{力量资质:[1700,2000],体质资质:[1500,1900],敏捷资质:[1400,1800],魔力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'physical', innateSkills:['double_slash','power_up'], desc:'青木之猿' },
  '玄冰蛇': { race:'龙', aptRange:{力量资质:[1400,1800],体质资质:[1400,1800],敏捷资质:[1500,1900],魔力资质:[1600,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['ice_arrow','freeze'], desc:'玄冰之蛇' },
  '幻影鸦': { race:'恶魔', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1600,2000],魔力资质:[1500,1900]}, growthRange:[1.5,2.1], specialty:'speed', innateSkills:['sneak_atk','dodge'], desc:'幻影之鸦' },
  '黄昏狮': { race:'哥布林', aptRange:{力量资质:[1700,2000],体质资质:[1600,2000],敏捷资质:[1400,1800],魔力资质:[1300,1700]}, growthRange:[1.5,2.1], specialty:'physical', innateSkills:['fatal_blow','berserk'], desc:'黄昏之狮' },
  '焦土龟': { race:'史莱姆', aptRange:{力量资质:[1500,1900],体质资质:[1800,2000],敏捷资质:[1300,1700],魔力资质:[1300,1700]}, growthRange:[1.4,2.0], specialty:'defense', innateSkills:['iron_wall','flame_strike'], desc:'焦土中的龟' },
  '银光鹿': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1400,1800],敏捷资质:[1500,1900],魔力资质:[1600,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['holy_light','magic_heart'], desc:'银光闪耀的鹿' },
  '霜羽雕': { race:'天使', aptRange:{力量资质:[1500,1900],体质资质:[1300,1700],敏捷资质:[1700,2000],魔力资质:[1500,1900]}, growthRange:[1.6,2.2], specialty:'speed', innateSkills:['ice_arrow','stun_strike'], desc:'霜羽之雕' },
  '紫晶蝶': { race:'精灵', aptRange:{力量资质:[1300,1700],体质资质:[1300,1700],敏捷资质:[1500,1900],魔力资质:[1700,2000]}, growthRange:[1.6,2.2], specialty:'magic', innateSkills:['magic_double','magic_heart'], desc:'紫晶之蝶' },
  // ---------- T4（强）20 个：成长1.6~2.6，资质1600~2400，2~3个天生技能 ----------
  '烈焰龙骑': { race:'龙', aptRange:{力量资质:[2000,2400],体质资质:[1700,2100],敏捷资质:[1800,2200],魔力资质:[1700,2100]}, growthRange:[1.8,2.4], specialty:'physical', innateSkills:['flame_strike','fatal_blow','aura_atk'], desc:'烈焰龙骑' },
  '寒冰女王': { race:'恶魔', aptRange:{力量资质:[1600,2000],体质资质:[1700,2100],敏捷资质:[1800,2200],魔力资质:[2000,2400]}, growthRange:[1.9,2.5], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'寒冰的女王' },
  '雷霆战狼': { race:'哥布林', aptRange:{力量资质:[1900,2300],体质资质:[1700,2100],敏捷资质:[1800,2200],魔力资质:[1600,2000]}, growthRange:[1.8,2.4], specialty:'physical', innateSkills:['thunder_strike','fatal_blow','crit_strike_2'], desc:'雷霆战狼' },
  '圣光审判': { race:'天使', aptRange:{力量资质:[1700,2100],体质资质:[1800,2200],敏捷资质:[1700,2100],魔力资质:[2000,2400]}, growthRange:[1.9,2.5], specialty:'magic', innateSkills:['holy_radiance','holy_light','blessing'], desc:'圣光的审判' },
  '暗影刺客': { race:'恶魔', aptRange:{力量资质:[1900,2300],体质资质:[1600,2000],敏捷资质:[2100,2400],魔力资质:[1700,2100]}, growthRange:[1.9,2.5], specialty:'speed', innateSkills:['sneak_atk_2','dodge_2','crit_strike_2'], desc:'暗影的刺客' },
  '翡翠守护': { race:'史莱姆', aptRange:{力量资质:[1800,2200],体质资质:[2200,2400],敏捷资质:[1600,2000],魔力资质:[1700,2100]}, growthRange:[1.8,2.4], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp'], desc:'翡翠守护者' },
  '风暴巨雕': { race:'天使', aptRange:{力量资质:[1800,2200],体质资质:[1600,2000],敏捷资质:[2100,2400],魔力资质:[1700,2100]}, growthRange:[1.9,2.5], specialty:'speed', innateSkills:['thunder_strike','stun_strike','aura_spd'], desc:'风暴的巨雕' },
  '玄铁巨兽': { race:'史莱姆', aptRange:{力量资质:[2000,2400],体质资质:[2200,2400],敏捷资质:[1600,2000],魔力资质:[1600,2000]}, growthRange:[1.8,2.4], specialty:'defense', innateSkills:['iron_wall','guard_shield','aura_hp'], desc:'玄铁巨兽' },
  '烈日战神': { race:'天使', aptRange:{力量资质:[2100,2400],体质资质:[1800,2200],敏捷资质:[1900,2300],魔力资质:[1700,2100]}, growthRange:[1.9,2.5], specialty:'physical', innateSkills:['fatal_blow','berserk','aura_atk'], desc:'烈日战神' },
  '幽冥蛇君': { race:'恶魔', aptRange:{力量资质:[1800,2200],体质资质:[1700,2100],敏捷资质:[1900,2300],魔力资质:[1900,2300]}, growthRange:[1.9,2.5], specialty:'magic', innateSkills:['poison_mist','magic_double_2','magic_heart_2'], desc:'幽冥蛇君' },
  '紫电战虎': { race:'哥布林', aptRange:{力量资质:[2100,2400],体质资质:[1900,2300],敏捷资质:[1800,2200],魔力资质:[1600,2000]}, growthRange:[1.9,2.5], specialty:'physical', innateSkills:['thunder_strike','fatal_blow','power_up_2'], desc:'紫电战虎' },
  '苍穹龙': { race:'龙', aptRange:{力量资质:[1900,2300],体质资质:[1800,2200],敏捷资质:[1900,2300],魔力资质:[1900,2300]}, growthRange:[1.9,2.5], specialty:'balanced', innateSkills:['holy_light','magic_heart_2','aura_hp_2'], desc:'苍穹之龙' },
  '焚天魔': { race:'恶魔', aptRange:{力量资质:[2100,2400],体质资质:[1900,2300],敏捷资质:[1800,2200],魔力资质:[1900,2300]}, growthRange:[2.0,2.6], specialty:'physical', innateSkills:['meteor','flame_strike','berserk'], desc:'焚天之魔' },
  '冰封王': { race:'龙', aptRange:{力量资质:[1900,2300],体质资质:[1900,2300],敏捷资质:[1800,2200],魔力资质:[2100,2400]}, growthRange:[2.0,2.6], specialty:'magic', innateSkills:['blizzard','freeze','magic_double_2'], desc:'冰封之王' },
  '圣辉麒麟': { race:'龙', aptRange:{力量资质:[2000,2400],体质资质:[1900,2300],敏捷资质:[1900,2300],魔力资质:[2000,2400]}, growthRange:[2.0,2.6], specialty:'magic', innateSkills:['holy_radiance','magic_heart_2','aura_crit'], desc:'圣辉之麒麟' },
  '暗夜君王': { race:'恶魔', aptRange:{力量资质:[2000,2400],体质资质:[2000,2400],敏捷资质:[1900,2300],魔力资质:[2000,2300]}, growthRange:[2.0,2.6], specialty:'balanced', innateSkills:['vampire_2','fatal_blow','aura_atk_2'], desc:'暗夜君王' },
  '千年古树': { race:'精灵', aptRange:{力量资质:[1800,2200],体质资质:[2200,2400],敏捷资质:[1600,2000],魔力资质:[2000,2400]}, growthRange:[1.9,2.5], specialty:'defense', innateSkills:['regen_2','heal_wind','aura_hp_2'], desc:'千年古树' },
  '雷陨巨猿': { race:'哥布林', aptRange:{力量资质:[2200,2400],体质资质:[2100,2400],敏捷资质:[1700,2100],魔力资质:[1600,2000]}, growthRange:[1.9,2.5], specialty:'physical', innateSkills:['thunder_strike','double_slash','power_up_2'], desc:'雷陨巨猿' },
  '烈风隼王': { race:'天使', aptRange:{力量资质:[1900,2300],体质资质:[1700,2100],敏捷资质:[2100,2400],魔力资质:[1800,2200]}, growthRange:[2.0,2.6], specialty:'speed', innateSkills:['haste','stun_strike','aura_spd_2'], desc:'烈风之隼王' },
  '玄冥蛟': { race:'龙', aptRange:{力量资质:[2000,2400],体质资质:[2200,2400],敏捷资质:[1700,2100],魔力资质:[1900,2300]}, growthRange:[2.0,2.6], specialty:'defense', innateSkills:['iron_wall','regen_2','aura_hp_2'], desc:'玄冥之蛟' },
  // ---------- T5（极强）10 个：成长2.0~3.0，资质1900~2800，2~3个天生技能 ----------
  '远古龙神': { race:'龙', aptRange:{力量资质:[2400,2800],体质资质:[2300,2700],敏捷资质:[2300,2700],魔力资质:[2400,2800]}, growthRange:[2.4,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'远古的龙神' },
  '创世天使': { race:'天使', aptRange:{力量资质:[2200,2600],体质资质:[2300,2700],敏捷资质:[2200,2600],魔力资质:[2500,2800]}, growthRange:[2.3,2.9], specialty:'magic', innateSkills:['holy_radiance','meteor','aura_crit'], desc:'创世的天使' },
  '虚空魔神': { race:'恶魔', aptRange:{力量资质:[2300,2700],体质资质:[2200,2600],敏捷资质:[2200,2600],魔力资质:[2500,2800]}, growthRange:[2.4,3.0], specialty:'magic', innateSkills:['doom_judge','meteor','magic_heart_2'], desc:'虚空的魔神' },
  '太初神兽': { race:'龙', aptRange:{力量资质:[2400,2800],体质资质:[2400,2800],敏捷资质:[2300,2700],魔力资质:[2300,2700]}, growthRange:[2.5,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'太初的神兽' },
  '万古灵尊': { race:'精灵', aptRange:{力量资质:[2100,2500],体质资质:[2200,2600],敏捷资质:[2300,2700],魔力资质:[2500,2800]}, growthRange:[2.3,2.9], specialty:'magic', innateSkills:['life_bloom','heal_wind','aura_crit'], desc:'万古的灵尊' },
  '灭世魔龙': { race:'龙', aptRange:{力量资质:[2500,2800],体质资质:[2300,2700],敏捷资质:[2200,2600],魔力资质:[2300,2700]}, growthRange:[2.4,3.0], specialty:'physical', innateSkills:['doom_judge','fatal_blow','aura_atk_3'], desc:'灭世的魔龙' },
  '永夜主宰': { race:'恶魔', aptRange:{力量资质:[2300,2700],体质资质:[2400,2800],敏捷资质:[2200,2600],魔力资质:[2500,2800]}, growthRange:[2.4,3.0], specialty:'magic', innateSkills:['doom_judge','meteor','magic_double_2'], desc:'永夜的主宰' },
  '圣渊天马': { race:'天使', aptRange:{力量资质:[2300,2700],体质资质:[2200,2600],敏捷资质:[2500,2800],魔力资质:[2300,2700]}, growthRange:[2.4,3.0], specialty:'speed', innateSkills:['haste','thunder_strike','aura_spd_3'], desc:'圣渊的天马' },
  '混沌麒麟': { race:'龙', aptRange:{力量资质:[2400,2800],体质资质:[2400,2800],敏捷资质:[2300,2700],魔力资质:[2400,2800]}, growthRange:[2.5,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_atk_3'], desc:'混沌的麒麟' },
  '乾坤龙尊': { race:'龙', aptRange:{力量资质:[2500,2800],体质资质:[2400,2800],敏捷资质:[2400,2800],魔力资质:[2500,2800]}, growthRange:[2.5,3.0], specialty:'balanced', innateSkills:['holy_radiance','blessing','aura_hp_3'], desc:'乾坤的龙尊' },

  // ===== 进阶系统新宠物（20只可进阶宠物） =====
  // ---- T1可进阶宠物（12只）：资质上限1800，成长同普通T1，可进阶两次 T1→T3→T5 ----
  '星光雏': { race:'天使', aptRange:{力量资质:[1000,1400],体质资质:[1000,1400],敏捷资质:[1200,1800],魔力资质:[1100,1500]}, growthRange:[0.7,1.3], specialty:'speed', innateSkills:['dodge'], desc:'星光孕育的幼鸟，可进阶为星光战鹰', evolvable: true, evolveType: 'T1', evolveChain: ['星光雏','星光战鹰','星光神鹰'] },
  '烈焰幼龙': { race:'龙', aptRange:{力量资质:[1200,1800],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[900,1300]}, growthRange:[0.8,1.3], specialty:'physical', innateSkills:['flame_strike'], desc:'烈焰中诞生的幼龙，可进阶为烈焰飞龙', evolvable: true, evolveType: 'T1', evolveChain: ['烈焰幼龙','烈焰飞龙','烈焰龙王'] },
  '寒冰幼龟': { race:'史莱姆', aptRange:{力量资质:[1000,1400],体质资质:[1400,1800],敏捷资质:[600,1000],魔力资质:[1000,1400]}, growthRange:[0.7,1.3], specialty:'defense', innateSkills:['def_up'], desc:'寒冰覆盖的幼龟，可进阶为寒冰玄龟', evolvable: true, evolveType: 'T1', evolveChain: ['寒冰幼龟','寒冰玄龟','寒冰龙龟'] },
  '暗影幼狐': { race:'精灵', aptRange:{力量资质:[1000,1400],体质资质:[900,1300],敏捷资质:[1300,1800],魔力资质:[1100,1500]}, growthRange:[0.8,1.3], specialty:'speed', innateSkills:['sneak_atk'], desc:'暗影中的幼狐，可进阶为暗影灵狐', evolvable: true, evolveType: 'T1', evolveChain: ['暗影幼狐','暗影灵狐','暗影九尾'] },
  '雷霆幼豹': { race:'哥布林', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1300,1800],魔力资质:[1000,1400]}, growthRange:[0.8,1.3], specialty:'speed', innateSkills:['speed_up'], desc:'雷霆缠绕的幼豹，可进阶为雷霆猎豹', evolvable: true, evolveType: 'T1', evolveChain: ['雷霆幼豹','雷霆猎豹','雷霆神豹'] },
  '圣光幼灵': { race:'天使', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[1300,1800]}, growthRange:[0.8,1.3], specialty:'magic', innateSkills:['cure'], desc:'圣光眷顾的幼灵，可进阶为圣光使者', evolvable: true, evolveType: 'T1', evolveChain: ['圣光幼灵','圣光使者','圣光大天使'] },
  '翠叶幼精': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[1300,1800]}, growthRange:[0.7,1.3], specialty:'magic', innateSkills:['life_bloom'], desc:'翠叶间的幼小精灵，可进阶为翠叶花灵', evolvable: true, evolveType: 'T1', evolveChain: ['翠叶幼精','翠叶花灵','翠叶树神'] },
  '铁甲幼蟹': { race:'史莱姆', aptRange:{力量资质:[1100,1500],体质资质:[1400,1800],敏捷资质:[700,1100],魔力资质:[900,1300]}, growthRange:[0.7,1.3], specialty:'defense', innateSkills:['guard_shield'], desc:'铁甲护身的幼蟹，可进阶为铁甲巨蟹', evolvable: true, evolveType: 'T1', evolveChain: ['铁甲幼蟹','铁甲巨蟹','铁甲蟹皇'] },
  '噬魂幼蝠': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[900,1300],敏捷资质:[1300,1800],魔力资质:[1100,1500]}, growthRange:[0.8,1.3], specialty:'speed', innateSkills:['shadow_strike'], desc:'噬魂的幼蝠，可进阶为噬魂夜蝠', evolvable: true, evolveType: 'T1', evolveChain: ['噬魂幼蝠','噬魂夜蝠','噬魂魔王'] },
  '赤焰幼狮': { race:'哥布林', aptRange:{力量资质:[1300,1800],体质资质:[1000,1400],敏捷资质:[1000,1400],魔力资质:[900,1300]}, growthRange:[0.8,1.3], specialty:'physical', innateSkills:['power_up'], desc:'赤焰中的幼狮，可进阶为赤焰战狮', evolvable: true, evolveType: 'T1', evolveChain: ['赤焰幼狮','赤焰战狮','赤焰狮王'] },
  '冰晶幼鹿': { race:'精灵', aptRange:{力量资质:[900,1300],体质资质:[1000,1400],敏捷资质:[1100,1500],魔力资质:[1300,1800]}, growthRange:[0.8,1.3], specialty:'magic', innateSkills:['ice_arrow'], desc:'冰晶凝聚的幼鹿，可进阶为冰晶灵鹿', evolvable: true, evolveType: 'T1', evolveChain: ['冰晶幼鹿','冰晶灵鹿','冰晶神鹿'] },
  '玄铁幼犀': { race:'史莱姆', aptRange:{力量资质:[1300,1800],体质资质:[1500,1800],敏捷资质:[600,1000],魔力资质:[800,1200]}, growthRange:[0.7,1.3], specialty:'defense', innateSkills:['parry'], desc:'玄铁般的幼犀，可进阶为玄铁甲犀', evolvable: true, evolveType: 'T1', evolveChain: ['玄铁幼犀','玄铁甲犀','玄铁巨犀'] },
  // ---- T3可进阶宠物（8只）：资质上限2300，成长同普通T3，可进阶一次 T3→T5 ----
  '烈焰战虎': { race:'哥布林', aptRange:{力量资质:[1800,2300],体质资质:[1500,1900],敏捷资质:[1400,1800],魔力资质:[1100,1500]}, growthRange:[1.5,2.2], specialty:'physical', innateSkills:['flame_strike','fatal_blow'], desc:'烈焰环绕的战虎，可进阶为烈焰虎神', evolvable: true, evolveType: 'T3', evolveChain: ['烈焰战虎','烈焰虎神'] },
  '冰霜法师': { race:'恶魔', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1200,1600],魔力资质:[1800,2300]}, growthRange:[1.5,2.2], specialty:'magic', innateSkills:['blizzard','freeze'], desc:'掌控冰霜的法师，可进阶为冰霜大法师', evolvable: true, evolveType: 'T3', evolveChain: ['冰霜法师','冰霜大法师'] },
  '暗影潜行者': { race:'精灵', aptRange:{力量资质:[1500,1900],体质资质:[1000,1400],敏捷资质:[1800,2300],魔力资质:[1300,1700]}, growthRange:[1.5,2.2], specialty:'speed', innateSkills:['sneak_atk_2','dodge_2'], desc:'暗影中的潜行者，可进阶为暗影影王', evolvable: true, evolveType: 'T3', evolveChain: ['暗影潜行者','暗影影王'] },
  '圣盾守卫': { race:'史莱姆', aptRange:{力量资质:[1500,1900],体质资质:[2000,2300],敏捷资质:[800,1200],魔力资质:[1100,1500]}, growthRange:[1.4,2.2], specialty:'defense', innateSkills:['iron_wall','guard_shield'], desc:'持圣盾的守卫，可进阶为圣盾骑士', evolvable: true, evolveType: 'T3', evolveChain: ['圣盾守卫','圣盾骑士'] },
  '雷电游侠': { race:'天使', aptRange:{力量资质:[1400,1800],体质资质:[1000,1400],敏捷资质:[1800,2300],魔力资质:[1300,1700]}, growthRange:[1.5,2.2], specialty:'speed', innateSkills:['thunder_strike','stun_strike'], desc:'雷电缠绕的游侠，可进阶为雷电神射手', evolvable: true, evolveType: 'T3', evolveChain: ['雷电游侠','雷电神射手'] },
  '翡翠术士': { race:'精灵', aptRange:{力量资质:[1100,1500],体质资质:[1200,1600],敏捷资质:[1400,1800],魔力资质:[1900,2300]}, growthRange:[1.5,2.2], specialty:'magic', innateSkills:['magic_double_2','aura_hp'], desc:'翡翠之力的术士，可进阶为翡翠大术士', evolvable: true, evolveType: 'T3', evolveChain: ['翡翠术士','翡翠大术士'] },
  '深渊猎手': { race:'恶魔', aptRange:{力量资质:[1900,2300],体质资质:[1500,1900],敏捷资质:[1500,1900],魔力资质:[1200,1600]}, growthRange:[1.5,2.2], specialty:'physical', innateSkills:['blood_drain','fatal_blow'], desc:'深渊中的猎手，可进阶为深渊猎神', evolvable: true, evolveType: 'T3', evolveChain: ['深渊猎手','深渊猎神'] },
  '苍穹武僧': { race:'天使', aptRange:{力量资质:[1700,2100],体质资质:[1600,2000],敏捷资质:[1500,1900],魔力资质:[1500,1900]}, growthRange:[1.5,2.2], specialty:'balanced', innateSkills:['double_slash','def_up_2'], desc:'苍穹下的武僧，可进阶为苍穹武神', evolvable: true, evolveType: 'T3', evolveChain: ['苍穹武僧','苍穹武神'] },
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

// ==================== 新进阶系统配置 ====================
// 进阶系统常量：每次进阶成长和资质提升30%
var EVOLVE_SYSTEM_CONFIG = {
  ADVANCE_GROWTH_MULT: 1.3,       // 每次进阶成长提升倍率
  ADVANCE_APTITUDE_MULT: 1.3,     // 每次进阶资质提升倍率
  ADVANCE_VALUE_MAX_T1_TO_T3: 1000, // T1→T3 进阶值上限
  ADVANCE_VALUE_MAX_T3_TO_T5: 2000, // T3→T5 进阶值上限
  // 进阶道具配置
  ITEMS: {
    low:  { id: 'evolution_crystal_low',  name: '低级进化晶石', baseValue: 15,  critChance: 0.08 },
    mid:  { id: 'evolution_crystal_mid',  name: '中级进化晶石', baseValue: 50,  critChance: 0.08 },
    high: { id: 'evolution_crystal_high', name: '高级进化晶石', baseValue: 150, critChance: 0.08 },
  },
  // 暴击倍率范围：触发暴击时随机2~9倍
  CRIT_MIN: 2,
  CRIT_MAX: 9,
};

// 获取可进阶宠物的进阶信息
// 返回 { canEvolve, evolveType, currentStage, maxStage, nextName, chain }
function getPetEvolveInfo(pet) {
  if (!pet || !pet.name) return { canEvolve: false };
  // 需求Bug修复：使用 getPetDex 替代直接查 PET_DEX，支持进阶后动态生成的图鉴条目
  // 进阶后的宠物名（如"星光战鹰"）不在 PET_DEX 中直接存在，需通过 getPetDex 解析
  var dex = getPetDex(pet.name);
  if (!dex || !dex.evolvable) return { canEvolve: false };
  var chain = dex.evolveChain;
  if (!chain || chain.length < 2) return { canEvolve: false };
  // advanceStage: 0=初始, 1=第一次进阶后, 2=第二次进阶后
  var stage = pet.advanceStage || 0;
  var maxStage = chain.length - 1; // T1链有3个名字→maxStage=2; T3链有2个名字→maxStage=1
  if (stage >= maxStage) return { canEvolve: false, maxed: true };
  var nextName = chain[stage + 1];
  var evolveType = dex.evolveType;
  // 判断当前进阶的目标T级
  var currentTier = getPetTier(pet.name);
  var targetTier;
  if (evolveType === 'T1') {
    targetTier = stage === 0 ? 3 : 5; // T1→T3, T3→T5
  } else {
    targetTier = 5; // T3→T5
  }
  // 进阶值上限
  var advanceValueMax = (currentTier <= 1) ? EVOLVE_SYSTEM_CONFIG.ADVANCE_VALUE_MAX_T1_TO_T3 : EVOLVE_SYSTEM_CONFIG.ADVANCE_VALUE_MAX_T3_TO_T5;
  return {
    canEvolve: true,
    evolveType: evolveType,
    currentStage: stage,
    maxStage: maxStage,
    nextName: nextName,
    targetTier: targetTier,
    chain: chain,
    advanceValueMax: advanceValueMax,
  };
}

// 生成进阶后宠物的图鉴条目
// stage: 1 = 第一次进阶(T1→T3 或 T3→T5), 2 = 第二次进阶(T3→T5, 仅T1链)
function getEvolvePetDex(baseName, stage) {
  var baseDex = PET_DEX[baseName];
  if (!baseDex || !baseDex.evolvable) return null;
  var chain = baseDex.evolveChain;
  if (!chain || stage < 1 || stage >= chain.length) return null;
  var evolvedName = chain[stage];
  // 若已显式存在于 PET_DEX，直接返回
  if (PET_DEX[evolvedName]) return PET_DEX[evolvedName];
  // 动态生成：成长和资质在原基础上×1.3^stage
  var mult = Math.pow(EVOLVE_SYSTEM_CONFIG.ADVANCE_APTITUDE_MULT, stage);
  var gMult = Math.pow(EVOLVE_SYSTEM_CONFIG.ADVANCE_GROWTH_MULT, stage);
  var aptRange = {};
  Object.keys(baseDex.aptRange).forEach(function(k) {
    var range = baseDex.aptRange[k];
    aptRange[k] = [Math.floor(range[0] * mult), Math.floor(range[1] * mult)];
  });
  var growthRange = [
    Math.round(baseDex.growthRange[0] * gMult * 100) / 100,
    Math.round(baseDex.growthRange[1] * gMult * 100) / 100,
  ];
  // 判断目标T级，决定技能数
  var evolvedTier;
  if (baseDex.evolveType === 'T1') {
    evolvedTier = stage === 1 ? 3 : 5;
  } else {
    evolvedTier = 5;
  }
  // 根据T级补充天生技能
  var innateSkills = baseDex.innateSkills.slice();
  if (evolvedTier >= 3 && innateSkills.length < 2) {
    var spec = baseDex.specialty;
    var t3Pool = (SPEC_SKILL_POOL_T3[spec] || SPEC_SKILL_POOL_T3.balanced).slice();
    innateSkills.push(t3Pool[0] || 'power_up_2');
  }
  if (evolvedTier >= 5 && innateSkills.length < 3) {
    var spec2 = baseDex.specialty;
    var t5Pool = (SPEC_SKILL_POOL_T5[spec2] || SPEC_SKILL_POOL_T5.balanced).slice();
    innateSkills.push(t5Pool[0] || 'aura_atk_3');
  }
  return {
    race: baseDex.race,
    aptRange: aptRange,
    growthRange: growthRange,
    specialty: baseDex.specialty,
    innateSkills: innateSkills,
    desc: '【进阶+' + stage + '】' + baseDex.desc,
    evolvedFrom: baseName,
    evolveStage: stage,
    evolvable: stage < chain.length - 1,
    evolveType: baseDex.evolveType,
    evolveChain: chain,
    forceTier: evolvedTier,
  };
}

// 获取宠物图鉴信息（不存在则用默认值）
function getPetDex(name) {
  var dex = PET_DEX[name];
  if (dex) return dex;
  // 检查是否为旧进阶系统宠物名
  for (var i = 0; i < PET_ADVANCE_CHAINS.length; i++) {
    var chain = PET_ADVANCE_CHAINS[i];
    if (chain.mid === name) return getAdvancedPetDex(chain.base, 1);
    if (chain.top === name) return getAdvancedPetDex(chain.base, 2);
  }
  // 检查是否为新进阶系统宠物名
  for (var key in PET_DEX) {
    var d = PET_DEX[key];
    if (d && d.evolvable && d.evolveChain) {
      var idx = d.evolveChain.indexOf(name);
      if (idx > 0) return getEvolvePetDex(key, idx);
    }
  }
  // 默认值
  return {
    race: RACES[randomInt(0, RACES.length - 1)],
    aptRange: { 力量资质:[1200,1800],体质资质:[1200,1800],敏捷资质:[1200,1800],魔力资质:[1200,1800] },
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
if (dex.forceTier) return dex.forceTier;
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
  // ===== 神兽专属血统（各族神兽独有，tier 7）=====
  { id: 'dragon_emperor_blood', name: '龙渊帝威', type: 'bloodline', race: '龙', tier: 7,
    desc: '全属性+20%，攻击力+15%，受到伤害降低10%；攻击附带龙威压制（敌方全属性-10%）',
    effects: { allPct: 0.20, atkPct: 0.15, dmgReduce: 0.10 }, special: true, isDivineBeast: true },
  { id: 'ancient_nucleus_blood', name: '太古原核', type: 'bloodline', race: '史莱姆', tier: 7,
    desc: '受到伤害降低25%，每回合恢复15%气血，死亡时100%复活（恢复50%血量，每场1次）',
    effects: { dmgReduce: 0.25, regenPct: 0.15, reviveChance: 1.0, reviveHpPct: 0.50 }, special: true, isDivineBeast: true },
  { id: 'shadow_lord_blood', name: '万影至尊', type: 'bloodline', race: '哥布林', tier: 7,
    desc: '闪避+30%，暴击率+25%，速度+30%；闪避成功后必定反击（造成150%攻击伤害）',
    effects: { dodgeRate: 0.30, critRate: 0.25, spdPct: 0.30 }, special: true, isDivineBeast: true },
  { id: 'seraph_general_blood', name: '炽天神威', type: 'bloodline', race: '天使', tier: 7,
    desc: '每回合恢复10%气血，受到治疗效果+50%；濒死时100%复活（恢复40%血量，每场1次）',
    effects: { regenPct: 0.10, healBoost: 0.50, reviveChance: 1.0, reviveHpPct: 0.40, dmgReduce: 0.10 }, special: true, isDivineBeast: true },
  { id: 'spirit_lord_blood', name: '万木灵韵', type: 'bloodline', race: '精灵', tier: 7,
    desc: '灵力+30%，法术伤害+25%，技能触发+20%；每回合为己方全体恢复5%气血',
    effects: { intPct: 0.30, magicDmgPct: 0.25, skillTrigger: 0.20, regenPct: 0.05 }, special: true, isDivineBeast: true },
  { id: 'abyss_demon_blood', name: '深渊魔威', type: 'bloodline', race: '恶魔', tier: 7,
    desc: '攻击力+25%，吸血25%，暴击伤害+30%；攻击附带深渊侵蚀（目标防御-15%，持续2回合）',
    effects: { atkPct: 0.25, lifestealPct: 0.25, critDmg: 0.30 }, special: true, isDivineBeast: true },
];

// ===== 神兽列表（6种族各1只，仅可通过99神兽精华随机兑换） =====
const DIVINE_BEASTS = ['龙渊帝君', '太古原核', '万影至尊', '炽天神将', '万木灵尊', '深渊魔神'];

// ===== 六道轮回：神通定义（20种，全部与宠物相关） =====
// 品质：rare(稀有) / epic(史诗) / legendary(传说) / mythic(神话)
// 星级养成：重复抽取自动升星，每星基础效果翻倍（star=1为基础值，star=2为×2，star=3为×4...）
// effect.type 对应 getPetStats 中的加成字段
var DIVINE_POWERS = [
  // --- 稀有（6种）---
  { id: 'dp_atk',    name: '神兽之怒', icon: '⚔️', rarity: 'rare',     desc: '出战宠物攻击力+5%',     effect: { type: 'atkPct',     value: 0.05 } },
  { id: 'dp_def',    name: '神兽之盾', icon: '🛡️', rarity: 'rare',     desc: '出战宠物防御力+5%',     effect: { type: 'defPct',     value: 0.05 } },
  { id: 'dp_spd',    name: '神兽之速', icon: '💨', rarity: 'rare',     desc: '出战宠物速度+5%',       effect: { type: 'spdPct',     value: 0.05 } },
  { id: 'dp_int',    name: '神兽之智', icon: '🔮', rarity: 'rare',     desc: '出战宠物灵力+5%',       effect: { type: 'intPct',     value: 0.05 } },
  { id: 'dp_hp',     name: '神兽之体', icon: '❤️', rarity: 'rare',     desc: '出战宠物气血+5%',       effect: { type: 'hpPct',      value: 0.05 } },
  { id: 'dp_mp',     name: '神兽之魂', icon: '✨', rarity: 'rare',     desc: '出战宠物魔法值+10%',    effect: { type: 'mpPct',      value: 0.10 } },
  // --- 史诗（6种）---
  { id: 'dp_all',    name: '万兽之力', icon: '🌟', rarity: 'epic',     desc: '出战宠物全属性+3%',     effect: { type: 'allPct',     value: 0.03 } },
  { id: 'dp_skdmg',  name: '灵魂共鸣', icon: '🎵', rarity: 'epic',     desc: '出战宠物技能伤害+10%',  effect: { type: 'skillDmg',   value: 0.10 } },
  { id: 'dp_regen',  name: '生命之泉', icon: '💧', rarity: 'epic',     desc: '出战宠物每回合恢复2%气血', effect: { type: 'regenPct',  value: 0.02 } },
  { id: 'dp_ignore', name: '破甲之刃', icon: '🗡️', rarity: 'epic',     desc: '出战宠物无视防御5%',    effect: { type: 'defIgnore',  value: 0.05 } },
  { id: 'dp_crit',   name: '暴击之心', icon: '🎯', rarity: 'epic',     desc: '出战宠物暴击率+5%',     effect: { type: 'critRate',   value: 0.05 } },
  { id: 'dp_dodge',  name: '幻影步法', icon: '👋', rarity: 'epic',     desc: '出战宠物闪避率+5%',     effect: { type: 'dodgeRate',  value: 0.05 } },
  // --- 传说（4种）---
  { id: 'dp_dmgred', name: '天命之护', icon: '🔰', rarity: 'legendary', desc: '出战宠物受到伤害-10%',  effect: { type: 'dmgReduce',  value: 0.10 } },
  { id: 'dp_stun',   name: '神威震慑', icon: '⚡', rarity: 'legendary', desc: '出战宠物攻击5%概率眩晕', effect: { type: 'stunChance', value: 0.05 } },
  { id: 'dp_cdr',    name: '万法归一', icon: '🔄', rarity: 'legendary', desc: '出战宠物技能冷却-15%',  effect: { type: 'skillCDR',   value: 0.15 } },
  { id: 'dp_vamp',   name: '无尽生机', icon: '🩸', rarity: 'legendary', desc: '出战宠物吸血+8%',      effect: { type: 'vampPct',    value: 0.08 } },
  // --- 神话（4种）---
  { id: 'dp_extratk',name: '时空裂隙', icon: '🌌', rarity: 'mythic',   desc: '出战宠物5%概率额外攻击一次', effect: { type: 'extraAtk', value: 0.05 } },
  { id: 'dp_allbig', name: '创世之力', icon: '💠', rarity: 'mythic',   desc: '出战宠物全属性+8%',     effect: { type: 'allPct',     value: 0.08 } },
  { id: 'dp_critdmg',name: '轮回之眼', icon: '👁️', rarity: 'mythic',   desc: '出战宠物暴击伤害+30%',  effect: { type: 'critDmg',    value: 0.30 } },
  { id: 'dp_revive', name: '不灭金身', icon: '∞',  rarity: 'mythic',   desc: '出战宠物每场战斗免死1次(恢复30%气血)', effect: { type: 'revive', value: 0.30 } },
];

// 神通抽奖品质概率
var DIVINE_POWER_GACHA_RATES = {
  rare:      0.50,  // 50%
  epic:      0.30,  // 30%
  legendary: 0.15,  // 15%
  mythic:    0.05,  // 5%
};

// 神通抽奖单次消耗轮回积分
var SAMSARA_GACHA_COST = 100;

// v2.11.0 需求7.1：神通最大星级（满星后从抽取池剔除）
var MAX_DIVINE_POWER_STAR = 6;

// 六道轮回：层数→轮回积分换算公式（floor * baseRate * growth^floor）
var SAMSARA_POINT_BASE = 50;   // 基础积分
var SAMSARA_POINT_GROWTH = 1.1; // 每层增长系数

// 六道轮回：转生最低通关层数
var SAMSARA_REBIRTH_MIN_FLOOR = 10;

// 六道轮回：解锁等级
var SAMSARA_UNLOCK_LEVEL = 70;

// 计算指定层数的轮回积分
// 需求：第十层及之后的积分奖励降低80%（×0.2），修正梯度过高问题
function calcSamsaraPoints(floor) {
  if (floor < SAMSARA_REBIRTH_MIN_FLOOR) return 0;
  var basePoints = Math.floor(SAMSARA_POINT_BASE * Math.pow(SAMSARA_POINT_GROWTH, floor - SAMSARA_REBIRTH_MIN_FLOOR) * (floor - SAMSARA_REBIRTH_MIN_FLOOR + 1));
  // 第10层及之后（floor >= SAMSARA_REBIRTH_MIN_FLOOR）积分降低80%
  return Math.floor(basePoints * 0.2);
}

// 计算指定层数的怪物属性
function getSamsaraFloorData(floor) {
  var playerLv = G.player.level || 1;
  var baseHp = 500 + floor * 200 + playerLv * 50;
  var baseAtk = 50 + floor * 20 + playerLv * 5;
  var baseDef = 20 + floor * 8 + playerLv * 2;
  var baseSpd = 30 + floor * 3;
  return {
    floor: floor,
    name: '第' + floor + '层·轮回守卫',
    hp: Math.floor(baseHp * (1 + G.player.rebirth * 0.3)),
    atk: Math.floor(baseAtk * (1 + G.player.rebirth * 0.3)),
    def: Math.floor(baseDef * (1 + G.player.rebirth * 0.3)),
    spd: Math.floor(baseSpd),
    exp: Math.floor(100 * floor * (1 + G.player.rebirth * 0.2)),
    gold: Math.floor(50 * floor * (1 + G.player.rebirth * 0.1)),
  };
}

// 获取神通效果（考虑星级加成）
function getDivinePowerEffect(powerId) {
  if (!G.samsara || !G.samsara.divinePowers) return null;
  var owned = G.samsara.divinePowers[powerId];
  if (!owned) return null;
  var def = DIVINE_POWERS.find(function(p) { return p.id === powerId; });
  if (!def) return null;
  var star = owned.star || 1;
  // v2.11.0 需求7.1：星级上限6，满星后不再升星
  var maxStar = (typeof MAX_DIVINE_POWER_STAR !== 'undefined') ? MAX_DIVINE_POWER_STAR : 6;
  if (star > maxStar) star = maxStar;
  var multiplier = Math.pow(2, star - 1); // 1星=×1, 2星=×2, 3星=×4...6星=×32
  return {
    id: def.id,
    name: def.name,
    icon: def.icon,
    rarity: def.rarity,
    desc: def.desc,
    star: star,
    maxed: star >= maxStar, // v2.11.0 需求7.1：满星标记
    effect: { type: def.effect.type, value: def.effect.value * multiplier },
  };
}

// 获取所有已拥有神通的效果列表（用于战斗属性加成）
function getAllDivinePowerEffects() {
  if (!G.samsara || !G.samsara.divinePowers) return [];
  var effects = [];
  for (var pid in G.samsara.divinePowers) {
    var eff = getDivinePowerEffect(pid);
    if (eff) effects.push(eff);
  }
  return effects;
}

// 【已删除】DIVINE_BEAST_BLOODLINES 神兽映射表 — 全量重构后不再需要
// 神兽血统已直接配置在 PET_BLOOD_ALL 中，按 pet.name 查表即可

// 【已删除】BLOODLINE_EFFECT_PRESETS 种族专长预设表 — 全量重构后不再需要
// 所有宠物的 effects 已直接配置在 PET_BLOOD_ALL 中，无种族复用、无通用继承

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
  '星辰鹿': { name:'星芒赐福', desc:'释放法术时30%概率触发「星芒」，为己方全体回复自身魔力值50%的生命值；每触发3次星芒，下一个法术必定暴击。' },
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
  // ----- 神兽 -----
  '龙渊帝君': { name:'龙渊帝威', desc:'全属性+20%，攻击力+15%，受到伤害降低10%；攻击附带龙威压制（敌方全属性-10%）。' },
  '太古原核': { name:'太古原核', desc:'受到伤害降低25%，每回合恢复15%气血，死亡时100%复活（恢复50%血量，每场1次）。' },
  '万影至尊': { name:'万影至尊', desc:'闪避+30%，暴击率+25%，速度+30%；闪避成功后必定反击（造成150%攻击伤害）。' },
  '炽天神将': { name:'炽天神威', desc:'每回合恢复10%气血，受到治疗效果+50%；濒死时100%复活（恢复40%血量，每场1次）。' },
  '万木灵尊': { name:'万木灵韵', desc:'灵力+30%，法术伤害+25%，技能触发+20%；每回合为己方全体恢复5%气血。' },
  '深渊魔神': { name:'深渊魔威', desc:'攻击力+25%，吸血25%，暴击伤害+30%；攻击附带深渊侵蚀（目标防御-15%，持续2回合）。' },
  // ----- 可进阶宠物（T1，12只）-----
  '星光雏': { name:'星辉庇护', desc:'首次受致命伤害时，星辉庇护使其剩余1点血量；本场战斗闪避率永久+15%。' },
  '烈焰幼龙': { name:'焰心觉醒', desc:'血量低于50%时，下次攻击伤害+30%；每触发1次永久+2%火焰伤害，最多叠5层。' },
  '寒冰幼龟': { name:'寒甲凝结', desc:'受击时10%概率为攻击者附加冻伤（速度-10%，持续2回合）；每回合获得1层寒甲（防御+3%，最多5层）。' },
  '暗影幼狐': { name:'影袭本能', desc:'首次攻击从阴影突袭，伤害+20%且目标无法反击；闪避成功后下次攻击必定暴击。' },
  '雷霆幼豹': { name:'雷冲加速', desc:'每回合首次攻击30%概率触发雷冲，额外造成15%攻击力的雷电伤害并使自身速度+10%持续1回合。' },
  '圣光幼灵': { name:'圣光眷顾', desc:'释放治疗时20%概率额外治疗1名随机友方，额外治疗量为原治疗50%。' },
  '翠叶幼精': { name:'翠叶复苏', desc:'每回合结束时回复3%最大生命值；释放法术时15%概率为己方血量最低单位附加花露（每回合回3%血量，持续2回合）。' },
  '铁甲幼蟹': { name:'坚甲破击', desc:'受击时15%概率完美格挡，只受1点伤害；格挡成功后下次攻击附带破甲效果（无视20%防御）。' },
  '噬魂幼蝠': { name:'噬魂夜袭', desc:'夜间战斗攻击+15%，闪避+10%；攻击10%概率附加恶作剧（目标下回合技能50%概率歪到随机目标）。' },
  '赤焰幼狮': { name:'炎鬃威吓', desc:'进场释放炎鬃，使敌方全体攻击力-5%持续2回合；攻击附带灼烧（5%最大生命值，持续2回合）。' },
  '冰晶幼鹿': { name:'冰晶折射', desc:'法术命中后15%概率折射冰晶至随机敌方，造成本次伤害30%的冰霜伤害。' },
  '玄铁幼犀': { name:'铁角冲撞', desc:'首次攻击附带冲撞，伤害+15%并使目标防御-10%持续1回合。' },
  // ----- 可进阶宠物（T3，8只）-----
  '烈焰战虎': { name:'烈焰战吼', desc:'进场释放战吼，己方全体攻击力+10%持续2回合；击杀目标后回复5%最大生命值。' },
  '冰霜法师': { name:'冰霜精通', desc:'冰系法术伤害+20%；对冻结目标法术伤害+30%。' },
  '暗影潜行者': { name:'影刃斩杀', desc:'对血量低于25%的目标攻击必定暴击；击杀目标后速度+10%持续2回合。' },
  '圣盾守卫': { name:'圣盾守护', desc:'每回合为己方血量最低单位附加护盾（吸收自身最大生命值8%的伤害，持续2回合）。' },
  '雷电游侠': { name:'雷霆连射', desc:'攻击15%概率触发连射，额外造成1次40%攻击力的雷电伤害；对麻痹目标必定暴击。' },
  '翡翠术士': { name:'翡翠共鸣', desc:'释放法术时20%概率为己方全体回复自身魔力值30%的生命值。' },
  '深渊猎手': { name:'深渊追猎', desc:'对生命值低于40%的目标伤害+25%；击杀目标后攻击力+5%持续至战斗结束，最多叠5层。' },
  '苍穹武僧': { name:'苍穹气功', desc:'每3回合释放气功波，对敌方全体造成80%攻击力的伤害；释放后自身防御+15%持续2回合。' },
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
  // ===== 神兽 =====
  '龙渊帝君': { allPct: 0.20, atkPct: 0.15, dmgReduce: 0.10 },
  '太古原核': { dmgReduce: 0.25, regenPct: 0.15, reviveChance: 1.0, reviveHpPct: 0.50 },
  '万影至尊': { dodgeRate: 0.30, critRate: 0.25, spdPct: 0.30 },
  '炽天神将': { regenPct: 0.10, healBoost: 0.50, reviveChance: 1.0, reviveHpPct: 0.40, dmgReduce: 0.10 },
  '万木灵尊': { intPct: 0.30, magicDmgPct: 0.25, skillTrigger: 0.20, regenPct: 0.05 },
  '深渊魔神': { atkPct: 0.25, lifestealPct: 0.25, critDmg: 0.30 },
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
  // ===== 可进阶宠物（T1，12只）=====
  '星光雏': { dodgeRate: 0.10, spdPct: 0.08 },
  '烈焰幼龙': { atkPct: 0.08, burnChance: 0.15, burnTurns: 2, burnPct: 0.05 },
  '寒冰幼龟': { defPct: 0.10, hpPct: 0.10, dmgReduce: 0.05 },
  '暗影幼狐': { atkPct: 0.10, critRate: 0.08, dodgeRate: 0.10 },
  '雷霆幼豹': { spdPct: 0.12, atkPct: 0.08, critRate: 0.05 },
  '圣光幼灵': { intPct: 0.10, healBoost: 0.12, regenPct: 0.03 },
  '翠叶幼精': { intPct: 0.10, regenPct: 0.04, healBoost: 0.10 },
  '铁甲幼蟹': { defPct: 0.12, hpPct: 0.10, dmgReduce: 0.08 },
  '噬魂幼蝠': { atkPct: 0.10, dodgeRate: 0.08, lifestealPct: 0.05 },
  '赤焰幼狮': { atkPct: 0.12, burnChance: 0.20, burnTurns: 2, burnPct: 0.05 },
  '冰晶幼鹿': { intPct: 0.12, magicDmgPct: 0.10, critRate: 0.05 },
  '玄铁幼犀': { defPct: 0.12, hpPct: 0.12, atkPct: 0.06 },
  // ===== 可进阶宠物（T3，8只）=====
  '烈焰战虎': { atkPct: 0.12, critRate: 0.08, hpPct: 0.08 },
  '冰霜法师': { intPct: 0.12, magicDmgPct: 0.15, critRate: 0.05 },
  '暗影潜行者': { atkPct: 0.12, critRate: 0.12, critDmg: 0.10, spdPct: 0.08 },
  '圣盾守卫': { defPct: 0.15, hpPct: 0.12, dmgReduce: 0.08 },
  '雷电游侠': { atkPct: 0.10, spdPct: 0.12, critRate: 0.10 },
  '翡翠术士': { intPct: 0.15, magicDmgPct: 0.12, regenPct: 0.03 },
  '深渊猎手': { atkPct: 0.15, critRate: 0.08, lifestealPct: 0.08 },
  '苍穹武僧': { allPct: 0.08, atkPct: 0.08, defPct: 0.08 },
};

// ==================== 全局唯一血统配置 PET_BLOOD_ALL ====================
// 核心重构：每只宠物对应一套独立血统，无种族复用、无通用继承
// 合并 PET_BLOODLINE_DEX（name/desc）+ PET_BLOODLINE_EFFECTS（effects）
// mechanics 将在 bloodline_engine.js 中从 PET_BLOODLINE_MECHANICS 合并填充
// desc 仅作 UI 展示，不参与任何战斗计算；战斗结算 100% 依赖 effects + mechanics
var PET_BLOOD_ALL = {};
(function _buildPetBloodAll() {
  var _dex = (typeof PET_BLOODLINE_DEX !== 'undefined') ? PET_BLOODLINE_DEX : {};
  var _eff = (typeof PET_BLOODLINE_EFFECTS !== 'undefined') ? PET_BLOODLINE_EFFECTS : {};
  var _allNames = {};
  Object.keys(_dex).forEach(function(n) { _allNames[n] = true; });
  Object.keys(_eff).forEach(function(n) { _allNames[n] = true; });
  Object.keys(_allNames).forEach(function(name) {
    var d = _dex[name], e = _eff[name];
    PET_BLOOD_ALL[name] = {
      name: d ? d.name : (name + '之血'),      // 血统名称，仅UI展示
      desc: d ? d.desc : '',                     // 血统描述，仅UI展示，禁止参与战斗逻辑
      effects: e ? e : {},                       // 常驻属性加成，直接参与属性面板计算
      mechanics: []                              // 触发型特殊效果，bloodline_engine.js 中填充
    };
  });
  // 清理旧配置引用，实现零残留
  PET_BLOODLINE_DEX = null;
  PET_BLOODLINE_EFFECTS = null;
})();
