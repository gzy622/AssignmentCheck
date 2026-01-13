/**
 * 数据持久化模块
 * 封装 localStorage 读写操作
 *
 * 功能：
 * 1. 封装 localStorage 读写操作
 * 2. 实现数据版本管理
 * 3. 添加数据校验机制
 * 4. 提供 save/load 接口
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const StorageService = (function() {
    const DATA_VERSION_KEY = 'homework_data_version';
    const CURRENT_DATA_VERSION = '2.0';

    function get(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('StorageService get error:', e);
            return defaultValue;
        }
    }

    function set(key, value) {
        try {
            const str = JSON.stringify(value);
            localStorage.setItem(key, str);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded');
                showToast('存储空间不足');
            } else {
                console.error('StorageService set error:', e);
            }
            return false;
        }
    }

    function remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('StorageService remove error:', e);
            return false;
        }
    }

    function clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('StorageService clear error:', e);
            return false;
        }
    }

    function getDataVersion() {
        return get(DATA_VERSION_KEY, '1.0');
    }

    function setDataVersion(version) {
        return set(DATA_VERSION_KEY, version);
    }

    function migrateDataIfNeeded() {
        const currentVersion = getDataVersion();

        if (currentVersion !== CURRENT_DATA_VERSION) {
            console.log('Data migration needed from version:', currentVersion);
            setDataVersion(CURRENT_DATA_VERSION);
            return true;
        }

        return false;
    }

    function validateData(data, schema) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Data is not an object' };
        }

        if (schema) {
            for (const key in schema) {
                const expectedType = schema[key];
                if (data[key] !== undefined && typeof data[key] !== expectedType) {
                    return { valid: false, error: `Key "${key}" expected ${expectedType}, got ${typeof data[key]}` };
                }
            }
        }

        return { valid: true };
    }

    function calculateChecksum(data) {
        const str = JSON.stringify(data);
        let checksum = 0;
        for (let i = 0; i < str.length; i++) {
            checksum = ((checksum << 5) - checksum) + str.charCodeAt(i);
            checksum = checksum & checksum;
        }
        return checksum;
    }

    return {
        init: function() {
            migrateDataIfNeeded();
            return true;
        },
        get: get,
        set: set,
        remove: remove,
        clear: clear,
        getDataVersion: getDataVersion,
        setDataVersion: setDataVersion,
        validateData: validateData,
        calculateChecksum: calculateChecksum
    };
})();

ModuleLoader.register('storage', function() {
    return StorageService;
}, []);
