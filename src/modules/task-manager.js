/**
 * 作业管理模块
 * 封装作业数据的增删改查操作
 *
 * 功能：
 * 1. 作业的增删改查
 * 2. 作业切换
 * 3. 学生提交记录管理
 * 4. 评分功能
 *
 * 依赖：
 * - StorageService: 数据持久化
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const TaskManagerModule = (function(storageService) {
    const TASKS_KEY = 'homework_tasks';
    const CURRENT_TASK_KEY = 'homework_current_task';

    let _tasks = [];
    let _currentTaskId = null;

    function _loadFromStorage() {
        try {
            const tasks = storageService.get(TASKS_KEY);
            const currentId = storageService.get(CURRENT_TASK_KEY);

            if (tasks && Array.isArray(tasks) && tasks.length > 0) {
                _tasks = tasks.filter(t => t && typeof t === 'object' && typeof t.id === 'number' && typeof t.title === 'string');
            }

            if (currentId && typeof currentId === 'number') {
                _currentTaskId = currentId;
            }

            if (_tasks.length === 0) {
                const initialTask = { id: Date.now(), title: '作业 1', records: {} };
                _tasks = [initialTask];
                _currentTaskId = initialTask.id;
                _saveToStorage();
            } else if (!_currentTaskId || !_tasks.find(t => t.id === _currentTaskId)) {
                _currentTaskId = _tasks[0]?.id;
                _saveToStorage();
            }
        } catch (e) {
            console.error('TaskManagerModule load error:', e);
            _tasks = [{ id: Date.now(), title: '作业 1', records: {} }];
            _currentTaskId = _tasks[0].id;
        }
    }

    function _saveToStorage() {
        storageService.set(TASKS_KEY, _tasks);
        storageService.set(CURRENT_TASK_KEY, _currentTaskId);
    }

    function init() {
        _loadFromStorage();
        return true;
    }

    function save() {
        _saveToStorage();
        return true;
    }

    function getAll() {
        return _tasks;
    }

    function getCount() {
        return _tasks.length;
    }

    function getCurrentId() {
        return _currentTaskId;
    }

    function getCurrent() {
        return _tasks.find(t => t.id === _currentTaskId) || _tasks[0];
    }

    function getTask(id) {
        return _tasks.find(t => t.id === id);
    }

    function createTask(title) {
        if (!title || typeof title !== 'string' || title.trim() === '') return null;
        const newTask = { id: Date.now(), title: title.trim(), records: {} };
        _tasks.push(newTask);
        _saveToStorage();
        return newTask;
    }

    function deleteTask(id) {
        const idx = _tasks.findIndex(t => t.id === id);
        if (idx > -1) {
            _tasks.splice(idx, 1);
            if (_currentTaskId === id) {
                _currentTaskId = _tasks[0]?.id;
            }
            _saveToStorage();
            return true;
        }
        return false;
    }

    function renameTask(id, newTitle) {
        if (!newTitle || typeof newTitle !== 'string' || newTitle.trim() === '') return false;
        const task = _tasks.find(t => t.id === id);
        if (task) {
            task.title = newTitle.trim();
            _saveToStorage();
            return true;
        }
        return false;
    }

    function switchTask(id) {
        if (_currentTaskId === id) return false;
        if (_tasks.find(t => t.id === id)) {
            _currentTaskId = id;
            _saveToStorage();
            return true;
        }
        return false;
    }

    function submitTask(taskId, studentId, submitted = true) {
        const task = _tasks.find(t => t.id === taskId);
        if (!task) return false;

        if (!task.records) task.records = {};
        if (!task.records[studentId]) task.records[studentId] = {};
        task.records[studentId].submitted = submitted;

        if (!submitted && (task.records[studentId].score === null || task.records[studentId].score === '')) {
            delete task.records[studentId];
        }

        _saveToStorage();
        return true;
    }

    function scoreTask(taskId, studentId, score) {
        const task = _tasks.find(t => t.id === taskId);
        if (!task) return false;

        if (!task.records) task.records = {};
        if (!task.records[studentId]) task.records[studentId] = {};

        if (score === null || score === '' || score === undefined) {
            task.records[studentId].score = null;
            if (!task.records[studentId].submitted) {
                delete task.records[studentId];
            }
        } else {
            task.records[studentId].score = score;
            task.records[studentId].submitted = true;
        }

        _saveToStorage();
        return true;
    }

    function getStudentRecord(taskId, studentId) {
        const task = _tasks.find(t => t.id === taskId);
        if (!task || !task.records) return null;
        return task.records[studentId] || null;
    }

    function getSubmittedCount(taskId) {
        const task = _tasks.find(t => t.id === taskId);
        if (!task || !task.records) return 0;
        return Object.values(task.records).filter(r => r && r.submitted).length;
    }

    function getAllTasksData() {
        return _tasks.map(task => ({
            id: task.id,
            title: task.title,
            submittedCount: Object.values(task.records || {}).filter(r => r && r.submitted).length
        }));
    }

    function exportData() {
        return JSON.stringify({
            tasks: _tasks,
            currentTaskId: _currentTaskId
        }, null, 2);
    }

    function importData(jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            if (parsed && typeof parsed === 'object') {
                if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
                    _tasks = parsed.tasks.filter(t => t && typeof t === 'object' && typeof t.id === 'number');
                    if (typeof parsed.currentTaskId === 'number') {
                        _currentTaskId = parsed.currentTaskId;
                    } else {
                        _currentTaskId = _tasks[0]?.id;
                    }
                    _saveToStorage();
                    return true;
                }
            }
        } catch (e) {
            console.error('TaskManagerModule import error:', e);
        }
        return false;
    }

    return {
        init: init,
        save: save,
        getAll: getAll,
        getCount: getCount,
        getCurrentId: getCurrentId,
        getCurrent: getCurrent,
        getTask: getTask,
        create: createTask,
        delete: deleteTask,
        rename: renameTask,
        switch: switchTask,
        submit: submitTask,
        score: scoreTask,
        getRecord: getStudentRecord,
        getSubmittedCount: getSubmittedCount,
        getAllData: getAllTasksData,
        export: exportData,
        import: importData
    };
})(StorageService);

ModuleLoader.register('task-manager', function() {
    return TaskManagerModule;
}, ['storage']);
