/**
 * 学生管理模块
 * 封装学生数据的增删改查操作
 *
 * 功能：
 * 1. 学生数据的增删改查
 * 2. 学生列表的导入导出
 * 3. 默认学生数据管理
 *
 * 依赖：
 * - StorageService: 数据持久化
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const StudentManagerModule = (function(storageService) {
    const STUDENTS_KEY = 'homework_students';

    const DEFAULT_STUDENTS = [
        "陈嘉乐", "廖婷", "徐伟浩", "刘嘉宝", "谢瑞宏", "练嘉铖", "崔鑫琪",
        "李梓龙", "古宏民", "刘秋娴", "刘银欣", "李嘉君", "周嘉琪", "曾婧玮",
        "丘欣芷", "吴玟怡", "杨欢", "吴学文", "罗雅茹", "凌浩天", "李佳",
        "刘卓莹", "彭嘉红", "谢瑞琳", "廖沁怡", "陈秉烨", "丘瑜诗", "郭银柳",
        "李欣", "周岷雍", "赖梅洁", "陈祖娴", "黄楚铭", "谢超宇", "熊飞凤",
        "吴嘉钰", "刘依婷", "吴苑婷", "曾誉宸", "刁瑜", "郭静", "刘诗琪",
        "黎伟平", "李敏锐", "杨鸿为", "熊晓逸", "梁黛秦", "谢蕊怡", "王杭州"
    ];

    let _students = null;

    function init() {
        try {
            const stored = storageService.get(STUDENTS_KEY);
            if (stored && Array.isArray(stored) && stored.length > 0) {
                _students = stored;
                return true;
            }
        } catch (e) {
            console.error('StudentManagerModule init error:', e);
        }
        _students = [...DEFAULT_STUDENTS];
        save();
        return true;
    }

    function save() {
        return storageService.set(STUDENTS_KEY, _students);
    }

    function getAll() {
        if (!_students) init();
        return _students;
    }

    function getCount() {
        return getAll().length;
    }

    function getName(id) {
        const students = getAll();
        const idx = id - 1;
        return (idx >= 0 && idx < students.length) ? students[idx] : `同学${id}`;
    }

    function add(name) {
        if (!name || typeof name !== 'string' || name.trim() === '') return false;
        _students.push(name.trim());
        return save();
    }

    function edit(id, newName) {
        if (!newName || typeof newName !== 'string' || newName.trim() === '') return false;
        const idx = id - 1;
        if (idx >= 0 && idx < _students.length) {
            _students[idx] = newName.trim();
            return save();
        }
        return false;
    }

    function deleteStudent(id) {
        const idx = id - 1;
        if (idx >= 0 && idx < _students.length) {
            _students.splice(idx, 1);
            return save();
        }
        return false;
    }

    function insert(id, name) {
        if (!name || typeof name !== 'string' || name.trim() === '') return false;
        const idx = id - 1;
        if (idx >= 0 && idx <= _students.length) {
            _students.splice(idx, 0, name.trim());
            return save();
        }
        return false;
    }

    function resetToDefault() {
        _students = [...DEFAULT_STUDENTS];
        return save();
    }

    function exportData() {
        return JSON.stringify(_students, null, 2);
    }

    function importData(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(s => typeof s === 'string')) {
                _students = parsed;
                return save();
            }
        } catch (e) {
            console.error('StudentManagerModule import error:', e);
        }
        return false;
    }

    function getDefaultStudents() {
        return [...DEFAULT_STUDENTS];
    }

    return {
        init: init,
        save: save,
        getAll: getAll,
        getCount: getCount,
        getName: getName,
        add: add,
        edit: edit,
        delete: deleteStudent,
        insert: insert,
        resetToDefault: resetToDefault,
        export: exportData,
        import: importData,
        getDefaultStudents: getDefaultStudents
    };
})(StorageService);

ModuleLoader.register('student-manager', function() {
    return StudentManagerModule;
}, ['storage']);
