/**
 * 模块加载器
 * 模块化架构核心组件
 *
 * 功能：
 * 1. 模块注册与加载
 * 2. 模块依赖管理
 * 3. 模块初始化顺序控制
 * 4. 旧代码兼容桥接
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const ModuleLoader = (function() {
    // 已注册的模块容器
    const modules = {};

    // 模块依赖关系映射
    const dependencies = {};

    // 初始化完成的模块列表
    const initializedModules = new Set();

    // 等待初始化的模块队列
    const initQueue = [];

    /**
     * 注册模块
     * @param {string} name - 模块名称
     * @param {Function} moduleFactory - 模块工厂函数
     * @param {string[]} deps - 依赖模块列表（可选）
     * @returns {Object} ModuleLoader 实例
     */
    function register(name, moduleFactory, deps) {
        if (typeof name !== 'string' || name.trim() === '') {
            console.error('模块名称不能为空');
            return ModuleLoader;
        }

        if (typeof moduleFactory !== 'function') {
            console.error('模块工厂函数必须是函数类型：', name);
            return ModuleLoader;
        }

        modules[name] = {
            factory: moduleFactory,
            deps: deps || [],
            instance: null
        };

        if (deps && deps.length > 0) {
            dependencies[name] = deps;
        }

        return ModuleLoader;
    }

    /**
     * 获取已注册的模块名称列表
     * @returns {string[]} 模块名称数组
     */
    function getRegisteredModules() {
        return Object.keys(modules);
    }

    /**
     * 检查模块是否已注册
     * @param {string} name - 模块名称
     * @returns {boolean}
     */
    function hasModule(name) {
        return name in modules;
    }

    /**
     * 解析模块依赖
     * @param {string} name - 模块名称
     * @param {Set} visited - 已访问模块集合（防止循环依赖）
     * @returns {string[]} 排序后的依赖列表
     */
    function resolveDependencies(name, visited) {
        visited = visited || new Set();

        if (visited.has(name)) {
            console.warn('检测到循环依赖：', name);
            return [];
        }

        if (!modules[name]) {
            console.warn('模块不存在：', name);
            return [];
        }

        visited.add(name);
        const deps = modules[name].deps || [];
        const resolved = [];

        deps.forEach(function(dep) {
            if (!visited.has(dep)) {
                const depDeps = resolveDependencies(dep, visited);
                resolved.push.apply(resolved, depDeps);
            }
            if (!resolved.includes(dep)) {
                resolved.push(dep);
            }
        });

        return resolved;
    }

    /**
     * 获取模块实例（延迟初始化）
     * @param {string} name - 模块名称
     * @returns {Object|null} 模块实例
     */
    function get(name) {
        if (!modules[name]) {
            console.warn('模块未注册：', name);
            return null;
        }

        if (!modules[name].instance) {
            console.warn('模块尚未初始化：', name);
            return null;
        }

        return modules[name].instance;
    }

    /**
     * 初始化单个模块
     * @param {string} name - 模块名称
     * @returns {boolean} 是否初始化成功
     */
    function initModule(name) {
        if (initializedModules.has(name)) {
            return true;
        }

        if (!modules[name]) {
            console.error('模块不存在，无法初始化：', name);
            return false;
        }

        // 初始化依赖模块
        const deps = modules[name].deps || [];
        deps.forEach(function(dep) {
            if (!initModule(dep)) {
                console.error('依赖模块初始化失败：', dep);
            }
        });

        // 创建模块实例
        try {
            const depInstances = deps.map(function(dep) {
                return modules[dep] && modules[dep].instance ? modules[dep].instance : null;
            });

            const instance = modules[name].factory.apply(null, depInstances);

            if (instance) {
                modules[name].instance = instance;
                initializedModules.add(name);

                // 调用模块的初始化方法
                if (typeof instance.init === 'function') {
                    instance.init();
                }

                return true;
            } else {
                console.error('模块实例创建失败：', name);
                return false;
            }
        } catch (e) {
            console.error('模块初始化异常：', name, e);
            return false;
        }
    }

    /**
     * 批量初始化所有已注册的模块
     * 按依赖顺序初始化
     * @returns {Object} 初始化结果统计
     */
    function initAll() {
        const results = {
            success: [],
            failed: []
        };

        Object.keys(modules).forEach(function(name) {
            const deps = resolveDependencies(name);

            deps.forEach(function(dep) {
                if (!initializedModules.has(dep)) {
                    if (initModule(dep)) {
                        results.success.push(dep);
                    } else {
                        results.failed.push(dep);
                    }
                }
            });

            if (initModule(name)) {
                results.success.push(name);
            } else {
                results.failed.push(name);
            }
        });

        return results;
    }

    /**
     * 重置所有模块状态（用于测试或重新加载）
     */
    function reset() {
        Object.keys(modules).forEach(function(name) {
            modules[name].instance = null;
        });
        initializedModules.clear();
    }

    /**
     * 获取模块加载器状态
     * @returns {Object} 状态信息
     */
    function getStatus() {
        return {
            totalModules: Object.keys(modules).length,
            initializedCount: initializedModules.size,
            initializedModules: Array.from(initializedModules),
            pendingModules: Object.keys(modules).filter(function(name) {
                return !initializedModules.has(name);
            })
        };
    }

    // 公开接口
    return {
        register: register,
        has: hasModule,
        get: get,
        getRegisteredModules: getRegisteredModules,
        init: initModule,
        initAll: initAll,
        reset: reset,
        getStatus: getStatus,
        resolveDependencies: resolveDependencies
    };
})();
