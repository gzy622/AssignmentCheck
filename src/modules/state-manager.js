/**
 * 状态管理模块
 * 提供全局状态管理和变更监听机制
 *
 * 功能：
 * 1. 全局状态容器
 * 2. 状态变更 getState()、setState(updates)
 * 3. 状态变更监听机制
 * 4. 自动持久化状态变更
 *
 * 依赖：
 * - StorageService: 数据持久化
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const StateManagerModule = (function(storageService) {
    const STATE_KEY = 'homework_app_state';
    const DEFAULT_STATE = {
        nameVisibility: false,
        immersiveMode: false,
        gradingMode: false,
        footerHidden: false,
        statsImmersive: false,
        statsSelectedTasks: [],
        modalStack: []
    };

    let _state = null;
    let _listeners = new Map();

    function _loadFromStorage() {
        try {
            const stored = storageService.get(STATE_KEY);
            if (stored && typeof stored === 'object') {
                _state = { ...DEFAULT_STATE, ...stored };
            } else {
                _state = { ...DEFAULT_STATE };
            }
        } catch (e) {
            console.error('StateManagerModule load error:', e);
            _state = { ...DEFAULT_STATE };
        }
    }

    function _saveToStorage() {
        if (_state) {
            storageService.set(STATE_KEY, _state);
        }
    }

    function init() {
        _loadFromStorage();
        return true;
    }

    function getState() {
        if (!_state) _loadFromStorage();
        return { ..._state };
    }

    function get(key) {
        if (!_state) _loadFromStorage();
        return key ? _state[key] : _state;
    }

    function setState(updates) {
        if (!_state) _loadFromStorage();

        const oldState = { ..._state };
        _state = { ..._state, ...updates };
        _saveToStorage();

        _notifyListeners(updates, oldState);
        return true;
    }

    function set(key, value) {
        return setState({ [key]: value });
    }

    function addListener(key, callback) {
        if (typeof callback !== 'function') return null;
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);

        if (!_listeners.has(key)) {
            _listeners.set(key, new Map());
        }
        _listeners.get(key).set(id, callback);

        return id;
    }

    function removeListener(id) {
        for (const [key, listeners] of _listeners) {
            if (listeners.has(id)) {
                listeners.delete(id);
                if (listeners.size === 0) {
                    _listeners.delete(key);
                }
                return true;
            }
        }
        return false;
    }

    function _notifyListeners(updates, oldState) {
        for (const key in updates) {
            if (_listeners.has(key)) {
                const newValue = _state[key];
                const oldValue = oldState[key];
                for (const callback of _listeners.get(key).values()) {
                    try {
                        callback(newValue, oldValue);
                    } catch (e) {
                        console.error('StateManagerModule listener error:', e);
                    }
                }
            }
        }

        if (_listeners.has('*')) {
            for (const callback of _listeners.get('*').values()) {
                try {
                    callback(_state, oldState);
                } catch (e) {
                    console.error('StateManagerModule wildcard listener error:', e);
                }
            }
        }
    }

    function reset() {
        _state = { ...DEFAULT_STATE };
        _saveToStorage();
        _notifyListeners(_state, {});
        return true;
    }

    function exportData() {
        return JSON.stringify(_state, null, 2);
    }

    function importData(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            if (parsed && typeof parsed === 'object') {
                _state = { ...DEFAULT_STATE, ...parsed };
                _saveToStorage();
                _notifyListeners(_state, {});
                return true;
            }
        } catch (e) {
            console.error('StateManagerModule import error:', e);
        }
        return false;
    }

    return {
        init: init,
        getState: getState,
        get: get,
        setState: setState,
        set: set,
        addListener: addListener,
        removeListener: removeListener,
        reset: reset,
        export: exportData,
        import: importData
    };
})(StorageService);

ModuleLoader.register('state-manager', function() {
    return StateManagerModule;
}, ['storage']);
