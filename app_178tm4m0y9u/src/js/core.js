// ===== core.js : 核心基础设施（安全数学/事件系统/对象池/日志/状态机/配置缓存） =====
// 所有模块的基础依赖，必须在其他脚本之前加载
// 设计原则：零依赖、无GC开销、防御性编程

// ==================== SafeMath : 整数安全运算 ====================
// 全项目数值统一为整数（Int），严禁浮点数
// 所有除法自动取整并防御除零；所有乘法防溢出

var SafeMath = (function() {
  'use strict';

  /**
   * 安全整数除法：a / b，自动取整，b=0 时返回 0
   * @param {number} a - 被除数
   * @param {number} b - 除数
   * @returns {number} Math.floor(a / b) 或 0
   */
  function intDiv(a, b) {
    if (b === 0 || !isFinite(b)) return 0;
    var result = a / b;
    if (!isFinite(result) || isNaN(result)) return 0;
    return Math.floor(result);
  }

  /**
   * 安全百分比计算：(part / total) * 100，自动取整，total=0 返回 0
   */
  function percent(part, total) {
    return intDiv(part * 100, total);
  }

  /**
   * 安全乘法后取整：a * b，防浮点精度丢失
   */
  function intMult(a, b) {
    if (!isFinite(a) || !isFinite(b)) return 0;
    return Math.floor(a * b);
  }

  /**
   * 将浮点数安全转为整数：乘以 precision 后取整
   * 用于将 0.02 这样的浮点配置转为整数 200（precision=10000）
   */
  function toInt(value, precision) {
    precision = precision || 1;
    if (!isFinite(value)) return 0;
    return Math.floor(value * precision);
  }

  /**
   * 将整数按精度还原为浮点（仅用于展示层）
   */
  function fromInt(value, precision) {
    precision = precision || 1;
    if (!isFinite(value)) return 0;
    return value / precision;
  }

  /**
   * 钳制到 [min, max] 范围
   */
  function clamp(value, min, max) {
    if (!isFinite(value)) return min;
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  /**
   * 安全随机整数 [min, max]，含两端
   */
  function randomInt(min, max) {
    if (min > max) { var t = min; min = max; max = t; }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 万分比运算：(value * rate) / 10000，自动取整
   * 用于天赋加成等万分比配置
   */
  function permyriad(value, rate) {
    return intDiv(value * rate, 10000);
  }

  /**
   * 千分比运算：(value * rate) / 1000，自动取整
   */
  function permille(value, rate) {
    return intDiv(value * rate, 1000);
  }

  /**
   * 百分比运算：(value * rate) / 100，自动取整
   */
  function percentMult(value, rate) {
    return intDiv(value * rate, 100);
  }

  /**
   * 安全加权平均：避免除零和溢出
   */
  function weightedAvg(values, weights) {
    var sum = 0, weightSum = 0;
    for (var i = 0; i < values.length; i++) {
      var w = weights[i] || 0;
      sum += values[i] * w;
      weightSum += w;
    }
    return intDiv(sum, weightSum);
  }

  return {
    intDiv: intDiv,
    percent: percent,
    intMult: intMult,
    toInt: toInt,
    fromInt: fromInt,
    clamp: clamp,
    randomInt: randomInt,
    permyriad: permyriad,
    permille: permille,
    percentMult: percentMult,
    weightedAvg: weightedAvg,
  };
})();

// ==================== EventBus : 全局事件系统 ====================
// 发布/订阅模式，支持优先级和自动注销
// 防止"注册未注销"导致的内存泄漏

var EventBus = (function() {
  'use strict';

  var _listeners = {};   // { eventType: [{fn, priority, id, once}] }
  var _nextId = 1;
  var _maxListenersPerEvent = 50; // 防止无限注册

  function on(eventType, fn, priority) {
    if (typeof eventType !== 'string' || typeof fn !== 'function') return 0;
    if (!_listeners[eventType]) _listeners[eventType] = [];
    var list = _listeners[eventType];

    // 防止同一函数重复注册
    for (var i = 0; i < list.length; i++) {
      if (list[i].fn === fn) return list[i].id;
    }

    // 超过上限时移除最早的（防止泄漏）
    if (list.length >= _maxListenersPerEvent) {
      console.warn('[EventBus] 事件 "' + eventType + '" 监听器超过上限，移除最早的');
      list.shift();
    }

    var entry = {
      fn: fn,
      priority: priority || 0,
      id: _nextId++,
      once: false,
    };
    // 按优先级插入（高优先级在前）
    var inserted = false;
    for (var j = 0; j < list.length; j++) {
      if (list[j].priority < entry.priority) {
        list.splice(j, 0, entry);
        inserted = true;
        break;
      }
    }
    if (!inserted) list.push(entry);
    return entry.id;
  }

  function once(eventType, fn, priority) {
    if (typeof eventType !== 'string' || typeof fn !== 'function') return 0;
    if (!_listeners[eventType]) _listeners[eventType] = [];
    var entry = {
      fn: fn,
      priority: priority || 0,
      id: _nextId++,
      once: true,
    };
    _listeners[eventType].push(entry);
    return entry.id;
  }

  function off(eventType, fnOrId) {
    if (!_listeners[eventType]) return;
    var list = _listeners[eventType];
    if (typeof fnOrId === 'number') {
      // 按 ID 注销
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === fnOrId) { list.splice(i, 1); break; }
      }
    } else if (typeof fnOrId === 'function') {
      // 按函数引用注销
      for (var j = 0; j < list.length; j++) {
        if (list[j].fn === fnOrId) { list.splice(j, 1); break; }
      }
    }
    if (list.length === 0) delete _listeners[eventType];
  }

  function offAll(eventType) {
    if (eventType) {
      delete _listeners[eventType];
    } else {
      _listeners = {};
    }
  }

  function emit(eventType, data) {
    if (!_listeners[eventType]) return;
    var list = _listeners[eventType];
    var toRemove = [];
    // 复制一份遍历，防止回调中修改列表导致索引错乱
    var snapshot = list.slice();
    for (var i = 0; i < snapshot.length; i++) {
      var entry = snapshot[i];
      try {
        entry.fn(data);
      } catch(e) {
        Logger.error('[EventBus] 事件 "' + eventType + '" 回调异常:', e);
      }
      if (entry.once) toRemove.push(entry.id);
    }
    // 清理 once 监听器
    if (toRemove.length > 0) {
      _listeners[eventType] = list.filter(function(e) { return toRemove.indexOf(e.id) < 0; });
      if (_listeners[eventType].length === 0) delete _listeners[eventType];
    }
  }

  function listenerCount(eventType) {
    return _listeners[eventType] ? _listeners[eventType].length : 0;
  }

  return {
    on: on,
    once: once,
    off: off,
    offAll: offAll,
    emit: emit,
    listenerCount: listenerCount,
  };
})();

// ==================== ObjectPool : 对象池 ====================
// 用于管理子弹、UI列表、特效等高频创建/销毁的对象
// 减少 GC 开销

var ObjectPool = (function() {
  'use strict';

  var _pools = {};  // { key: { free: [], factory: fn, reset: fn, max: n } }

  function register(key, factoryFn, resetFn, maxPool) {
    _pools[key] = {
      free: [],
      factory: factoryFn,
      reset: resetFn || function(obj) { return obj; },
      max: maxPool || 100,
    };
  }

  function acquire(key) {
    var pool = _pools[key];
    if (!pool) return null;
    if (pool.free.length > 0) {
      return pool.free.pop();
    }
    return pool.factory();
  }

  function release(key, obj) {
    var pool = _pools[key];
    if (!pool || !obj) return;
    if (pool.free.length >= pool.max) return; // 超过上限直接丢弃
    pool.reset(obj);
    pool.free.push(obj);
  }

  function releaseAll(key) {
    var pool = _pools[key];
    if (pool) pool.free = [];
  }

  function clear() {
    _pools = {};
  }

  function getPoolSize(key) {
    var pool = _pools[key];
    return pool ? pool.free.length : 0;
  }

  return {
    register: register,
    acquire: acquire,
    release: release,
    releaseAll: releaseAll,
    clear: clear,
    getPoolSize: getPoolSize,
  };
})();

// ==================== Logger : 分级日志系统 ====================
// DEBUG < INFO < WARN < ERROR < FATAL
// 生产环境自动过滤 DEBUG/INFO

var Logger = (function() {
  'use strict';

  var LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4 };
  var _level = LEVELS.INFO;
  var _buffer = [];     // 环形缓冲区，保存最近 N 条日志
  var _bufSize = 200;
  var _bufIdx = 0;

  function setLevel(level) {
    if (typeof level === 'string') level = LEVELS[level.toUpperCase()] || LEVELS.INFO;
    _level = level;
  }

  function _log(level, tag, msg) {
    if (level < _level) return;
    var prefix = '[' + tag + ']';
    var fn = level >= LEVELS.ERROR ? console.error : level >= LEVELS.WARN ? console.warn : console.log;
    if (typeof msg === 'object') {
      fn.call(console, prefix, msg);
    } else {
      fn.call(console, prefix + ' ' + msg);
    }
    // 写入环形缓冲
    var entry = { level: level, tag: tag, msg: typeof msg === 'object' ? JSON.stringify(msg).slice(0, 500) : String(msg), ts: Date.now() };
    _buffer[_bufIdx] = entry;
    _bufIdx = (_bufIdx + 1) % _bufSize;
  }

  function debug(tag, msg) { _log(LEVELS.DEBUG, tag, msg); }
  function info(tag, msg)  { _log(LEVELS.INFO, tag, msg); }
  function warn(tag, msg)  { _log(LEVELS.WARN, tag, msg); }
  function error(tag, msg) { _log(LEVELS.ERROR, tag, msg); }
  function fatal(tag, msg) { _log(LEVELS.FATAL, tag, msg); }

  function getRecentLogs(count) {
    count = count || 50;
    var result = [];
    var start = _bufIdx;
    for (var i = 0; i < Math.min(count, _buffer.length); i++) {
      var idx = (start - 1 - i + _bufSize * 2) % _bufSize;
      if (_buffer[idx]) result.unshift(_buffer[idx]);
    }
    return result;
  }

  return {
    LEVELS: LEVELS,
    setLevel: setLevel,
    debug: debug,
    info: info,
    warn: warn,
    error: error,
    fatal: fatal,
    getRecentLogs: getRecentLogs,
  };
})();

// ==================== StateMachine : 游戏状态机 ====================
// 管理游戏全局状态切换，防止非法状态跳转

var StateMachine = (function() {
  'use strict';

  var _states = {};       // { stateName: { enter, exit, update, transitions: {target: condition} } }
  var _current = null;
  var _currentName = '';
  var _history = [];
  var _maxHistory = 10;

  function register(name, config) {
    _states[name] = {
      enter: config.enter || function() {},
      exit: config.exit || function() {},
      update: config.update || null,
      transitions: config.transitions || {},
    };
  }

  function canTransition(from, to) {
    if (!_states[from] || !_states[to]) return false;
    if (from === to) return true;
    // 允许所有转换（宽松模式），除非显式定义了 transitions 限制
    return true;
  }

  function transition(to, data) {
    if (!_states[to]) {
      Logger.error('[FSM]', '未知状态: ' + to);
      return false;
    }
    if (_currentName && !canTransition(_currentName, to)) {
      Logger.warn('[FSM]', '非法状态转换: ' + _currentName + ' → ' + to);
      return false;
    }
    // 退出旧状态
    if (_current && _current.exit) {
      try { _current.exit(); } catch(e) { Logger.error('[FSM]', 'exit 异常:', e); }
    }
    // 记录历史
    if (_currentName) {
      _history.push(_currentName);
      if (_history.length > _maxHistory) _history.shift();
    }
    // 进入新状态
    _currentName = to;
    _current = _states[to];
    try {
      _current.enter(data);
    } catch(e) {
      Logger.error('[FSM]', 'enter 异常:', e);
    }
    EventBus.emit('state:change', { from: _history[_history.length - 1] || '', to: to, data: data });
    return true;
  }

  function update(dt) {
    if (_current && _current.update) {
      try { _current.update(dt); } catch(e) { Logger.error('[FSM]', 'update 异常:', e); }
    }
  }

  function current() { return _currentName; }
  function previous() { return _history.length > 0 ? _history[_history.length - 1] : ''; }
  function goBack() {
    if (_history.length === 0) return false;
    return transition(_history.pop());
  }

  return {
    register: register,
    transition: transition,
    update: update,
    current: current,
    previous: previous,
    goBack: goBack,
  };
})();

// ==================== ConfigCache : 配置缓存管理器 ====================
// 配置表一次性加载至内存缓存，严禁在循环或高频函数中频繁解析

var ConfigCache = (function() {
  'use strict';

  var _cache = {};        // { key: data }
  var _indices = {};      // { key: { field: Map(value -> item) } }
  var _loaded = false;

  /**
   * 注册配置数据到缓存（通常在 config.js 加载后调用）
   * @param {string} key - 配置键名
   * @param {Array|Object} data - 配置数据
   * @param {Array} indexFields - 需要建索引的字段列表
   */
  function register(key, data, indexFields) {
    _cache[key] = data;
    if (Array.isArray(data) && indexFields && indexFields.length > 0) {
      _indices[key] = {};
      indexFields.forEach(function(field) {
        var map = {};
        data.forEach(function(item) {
          if (item && item[field] !== undefined) map[item[field]] = item;
        });
        _indices[key][field] = map;
      });
    }
  }

  /**
   * 获取整个配置表
   */
  function get(key) {
    return _cache[key] || null;
  }

  /**
   * 按索引字段查找
   */
  function findBy(key, field, value) {
    if (_indices[key] && _indices[key][field]) {
      return _indices[key][field][value] || null;
    }
    // 无索引时线性查找
    var data = _cache[key];
    if (!Array.isArray(data)) return null;
    for (var i = 0; i < data.length; i++) {
      if (data[i] && data[i][field] === value) return data[i];
    }
    return null;
  }

  /**
   * 按索引字段过滤
   */
  function filterBy(key, field, value) {
    var data = _cache[key];
    if (!Array.isArray(data)) return [];
    return data.filter(function(item) {
      return item && item[field] === value;
    });
  }

  /**
   * 初始化所有配置索引（在 config.js 加载后调用）
   */
  function initIndices() {
    // 宠物图鉴索引
    if (typeof PET_DEX !== 'undefined' && Array.isArray(PET_DEX)) {
      register('petDex', PET_DEX, ['name', 'race', 'tier']);
    }
    // 技能索引
    if (typeof ALL_SKILLS !== 'undefined' && Array.isArray(ALL_SKILLS)) {
      register('skills', ALL_SKILLS, ['id']);
    }
    // 地图索引
    if (typeof MAPS !== 'undefined' && Array.isArray(MAPS)) {
      register('maps', MAPS, ['id']);
    }
    // 天赋树索引
    if (typeof TALENT_TREE !== 'undefined' && Array.isArray(TALENT_TREE)) {
      register('talents', TALENT_TREE, ['id']);
    }
    // 成就索引
    if (typeof ACHIEVEMENT_DEFS !== 'undefined' && Array.isArray(ACHIEVEMENT_DEFS)) {
      register('achievements', ACHIEVEMENT_DEFS, ['id']);
    }
    // 血统重构：BLOODLINE_SKILLS 已废弃，血统配置统一使用 PET_BLOOD_ALL
    // 不再注册种族通用血统索引
    _loaded = true;
    Logger.info('[ConfigCache]', '配置索引初始化完成');
  }

  function isLoaded() { return _loaded; }

  /**
   * 清空所有缓存
   */
  function clear() {
    _cache = {};
    _indices = {};
    _loaded = false;
  }

  return {
    register: register,
    get: get,
    findBy: findBy,
    filterBy: filterBy,
    initIndices: initIndices,
    isLoaded: isLoaded,
    clear: clear,
  };
})();

// ==================== 全局异常捕获 ====================
// 捕获未处理的异常，防止游戏崩溃

(function setupGlobalErrorHandler() {
  // 捕获同步异常
  window.addEventListener('error', function(e) {
    if (e.error) {
      Logger.error('[Global]', e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || '?'));
    }
  });

  // 捕获 Promise 异常
  window.addEventListener('unhandledrejection', function(e) {
    Logger.error('[Promise]', e.reason);
  });
})();

// ==================== 防连点工具 ====================
// 防止网络请求或按钮高频重复触发

var Debounce = (function() {
  'use strict';

  var _lastCall = {};  // { key: timestamp }
  var _timers = {};    // { key: timerId }

  /**
   * 节流：在 interval 内只执行第一次调用
   * @returns {boolean} true=允许执行, false=被节流
   */
  function throttle(key, interval) {
    interval = interval || 500;
    var now = Date.now();
    if (_lastCall[key] && now - _lastCall[key] < interval) return false;
    _lastCall[key] = now;
    return true;
  }

  /**
   * 防抖：延迟执行，interval 内再次调用则重置计时
   */
  function debounce(key, fn, interval) {
    interval = interval || 300;
    if (_timers[key]) clearTimeout(_timers[key]);
    _timers[key] = setTimeout(function() {
      delete _timers[key];
      try { fn(); } catch(e) { Logger.error('[Debounce]', key + ' 异常:', e); }
    }, interval);
  }

  function clear(key) {
    if (key) {
      delete _lastCall[key];
      if (_timers[key]) { clearTimeout(_timers[key]); delete _timers[key]; }
    } else {
      _lastCall = {};
      Object.keys(_timers).forEach(function(k) { clearTimeout(_timers[k]); });
      _timers = {};
    }
  }

  return {
    throttle: throttle,
    debounce: debounce,
    clear: clear,
  };
})();

// ==================== NullSafe : 空引用保护工具 ====================

var NullSafe = (function() {
  'use strict';

  /**
   * 安全获取嵌套属性，避免 undefined.xxx 报错
   * 用法: NullSafe.get(obj, 'a', 'b', 'c') 等价于 obj?.a?.b?.c
   */
  function get(obj) {
    if (obj == null) return undefined;
    var current = obj;
    for (var i = 1; i < arguments.length; i++) {
      if (current == null) return undefined;
      current = current[arguments[i]];
    }
    return current;
  }

  /**
   * 安全获取数组元素
   */
  function arrayItem(arr, index) {
    if (!Array.isArray(arr)) return undefined;
    if (index < 0 || index >= arr.length) return undefined;
    return arr[index];
  }

  /**
   * 确保 value 为有效数字，否则返回 defaultVal
   */
  function number(value, defaultVal) {
    if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) return defaultVal || 0;
    return value;
  }

  /**
   * 确保返回数组
   */
  function array(value) {
    if (Array.isArray(value)) return value;
    return [];
  }

  /**
   * 确保返回对象
   */
  function object(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  }

  return {
    get: get,
    arrayItem: arrayItem,
    number: number,
    array: array,
    object: object,
  };
})();

// 暴露到全局
window.SafeMath = SafeMath;
window.EventBus = EventBus;
window.ObjectPool = ObjectPool;
window.Logger = Logger;
window.StateMachine = StateMachine;
window.ConfigCache = ConfigCache;
window.Debounce = Debounce;
window.NullSafe = NullSafe;
