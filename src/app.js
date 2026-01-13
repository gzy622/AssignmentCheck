/**
 * 应用入口模块
 * 整合所有模块的初始化和依赖注入
 *
 * 功能：
 * 1. 模块初始化顺序管理
 * 2. 应用状态初始化
 * 3. 事件总线连接
 * 4. UI组件初始化
 * 5. 兼容性桥接
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const AppModule = (function() {
    let isInitialized = false;
    let initPromise = null;

    async function init() {
        if (isInitialized) {
            console.warn('[App] App already initialized');
            return;
        }

        if (initPromise) {
            return initPromise;
        }

        initPromise = (async () => {
            console.log('[App] Starting initialization...');

            try {
                await initModules();
                await initUI();
                await initEventConnections();
                setupGlobalErrorHandler();

                isInitialized = true;
                console.log('[App] Initialization complete');

                EventBus.emit('app:initialized', { version: APP_VERSION });

            } catch (error) {
                console.error('[App] Initialization failed:', error);
                throw error;
            }
        })();

        return initPromise;
    }

    async function initModules() {
        console.log('[App] Initializing modules...');

        const moduleInitOrder = [
            { name: 'Storage', module: StorageService, key: 'init' },
            { name: 'StudentManager', module: StudentManagerModule, key: 'init' },
            { name: 'TaskManager', module: TaskManagerModule, key: 'init' },
            { name: 'StateManager', module: StateManagerModule, key: 'init' },
            { name: 'UIComponents', module: UIComponentsModule, key: 'StudentGridService' }
        ];

        for (const { name, module, key } of moduleInitOrder) {
            if (module && typeof module[key === 'StudentGridService' ? 'init' : 'init'] === 'function') {
                try {
                    module[key === 'StudentGridService' ? 'init' : 'init']();
                    console.log(`[App] ${name} initialized`);
                } catch (error) {
                    console.warn(`[App] ${name} init warning:`, error.message);
                }
            }
        }
    }

    async function initUI() {
        console.log('[App] Initializing UI components...');

        const gridElement = document.getElementById('student-grid');
        if (gridElement) {
            UIComponents.initGrid('student-grid');
        }

        const toastElement = document.getElementById('toast');
        if (toastElement) {
            UIComponents.initToast('toast');
        }

        const currentState = StateManager.getState();
        isNameVisible = currentState.isNameVisible !== undefined ? currentState.isNameVisible : (localStorage.getItem(NAME_VISIBILITY_KEY) === 'true');

        const visibilityBtn = document.getElementById('visibility-toggle');
        if (visibilityBtn) {
            visibilityBtn.classList.toggle('text-gray-400', !isNameVisible);
            visibilityBtn.classList.toggle('text-green-500', isNameVisible);
            visibilityBtn.classList.toggle('opacity-50', !isNameVisible);
        }
    }

    async function initEventConnections() {
        console.log('[App] Setting up event connections...');

        EventBus.on('student:toggle', async (data) => {
            const { id, type } = data;

            if (type === 'long') {
                openScoreInput(id);
            } else {
                await handleStudentToggle(id);
            }
        });

        EventBus.on('task:switch', async (data) => {
            const { taskId } = data;
            await switchTask(taskId);
        });

        EventBus.on('state:change', (data) => {
            if (data.changes.isNameVisible !== undefined) {
                isNameVisible = data.changes.isNameVisible;
                updateGridVisibility();
            }
        });

        EventBus.on('app:destroy', () => {
            cleanup();
        });
    }

    async function handleStudentToggle(studentId) {
        if (!StudentManager.getAll().some(s => s.id === studentId)) {
            UIComponents.showToast('学生不存在', 1500);
            return;
        }

        const task = TaskManager.getCurrent();
        if (!task) {
            UIComponents.showToast('请先选择作业', 1500);
            return;
        }

        const currentRecord = TaskManager.getRecord(task.id, studentId);
        const newSubmitted = !currentRecord?.submitted;

        TaskManager.submit(task.id, studentId, newSubmitted);

        const students = StudentManager.getAll();
        const index = students.findIndex(s => s.id === studentId);
        const updatedStudent = TaskManager.getRecord(task.id, studentId);

        UIComponents.updateGridOne(index, updatedStudent, isNameVisible);
        updateStats();
        StudentManager.save();

        const toastMsg = newSubmitted ? '已登记' : '已取消';
        UIComponents.showToast(toastMsg, 1000);
    }

    function openScoreInput(studentId) {
        currentEditingId = studentId;
        const studentName = StudentManager.getName(studentId);
        const task = TaskManager.getCurrent();
        const record = task ? TaskManager.getRecord(task.id, studentId) : null;

        document.getElementById('score-input-title').textContent = `登记分数 - ${studentName}`;
        document.getElementById('score-input').value = record?.score || '';
        document.getElementById('score-input').focus();

        onInputConfirm = () => {
            const score = document.getElementById('score-input').value.trim();
            if (score === '') {
                if (record?.submitted) {
                    TaskManager.submit(task.id, studentId, false);
                    const students = StudentManager.getAll();
                    const index = students.findIndex(s => s.id === studentId);
                    UIComponents.updateGridOne(index, TaskManager.getRecord(task.id, studentId), isNameVisible);
                    updateStats();
                    UIComponents.showToast('已取消登记', 1000);
                }
            } else {
                TaskManager.score(task.id, studentId, score);
                if (!record?.submitted) {
                    TaskManager.submit(task.id, studentId, true);
                }
                const students = StudentManager.getAll();
                const index = students.findIndex(s => s.id === studentId);
                UIComponents.updateGridOne(index, TaskManager.getRecord(task.id, studentId), isNameVisible);
                updateStats();
                StudentManager.save();
                UIComponents.showToast(`已登记 ${studentName}: ${score}分`, 1000);
            }
        };

        UIComponents.openScaleModal('input-backdrop', 'input-modal');
    }

    async function switchTask(taskId) {
        const task = TaskManager.getTask(taskId);
        if (!task) {
            UIComponents.showToast('作业不存在', 1500);
            return;
        }

        TaskManager.switch(taskId);

        const students = StudentManager.getAll();
        const taskData = TaskManager.getAllData();
        const currentTask = TaskManager.getCurrent();

        currentStudents = students.map(s => {
            const record = currentTask ? TaskManager.getRecord(currentTask.id, s.id) : null;
            return { ...s, submitted: record?.submitted || false, score: record?.score || null };
        });

        UIComponents.renderGrid(currentStudents, isNameVisible, (id, type) => {
            EventBus.emit('student:toggle', { id, type });
        });

        updateTaskListUI();
        updateStats();

        const toastMsg = `已切换到「${task.title}」`;
        UIComponents.showToast(toastMsg, 1500);
    }

    function updateGridVisibility() {
        if (!currentStudents || currentStudents.length === 0) return;

        UIComponents.renderGrid(currentStudents, isNameVisible, (id, type) => {
            EventBus.emit('student:toggle', { id, type });
        });

        localStorage.setItem(NAME_VISIBILITY_KEY, isNameVisible);
    }

    function updateTaskListUI() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        const tasks = TaskManager.getAll();
        const currentId = TaskManager.getCurrentId();

        const currentTaskEl = taskList.querySelector('.bg-gray-100');
        if (currentTaskEl) {
            currentTaskEl.classList.remove('bg-gray-100', 'font-bold');
            currentTaskEl.classList.add('bg-white');
        }

        const newCurrentEl = taskList.querySelector(`[data-task-id="${currentId}"]`);
        if (newCurrentEl) {
            newCurrentEl.classList.remove('bg-white');
            newCurrentEl.classList.add('bg-gray-100', 'font-bold');
        }
    }

    function updateStats() {
        const task = TaskManager.getCurrent();
        if (!task) return;

        const total = StudentManager.getCount();
        const submitted = TaskManager.getSubmittedCount(task.id);
        const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0;

        const progressBar = document.getElementById('stats-progress-bar');
        const progressText = document.getElementById('stats-progress-text');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${submitted}/${total} (${percentage}%)`;
        }
    }

    function setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('[App] Global error:', event.error);
            UIComponents.showToast('发生错误，请刷新页面', 3000);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('[App] Unhandled promise rejection:', event.reason);
            UIComponents.showToast('发生错误，请刷新页面', 3000);
        });
    }

    function cleanup() {
        console.log('[App] Cleaning up...');

        EventBus.off(null, null);

        currentStudents = [];
        currentEditingId = null;

        isInitialized = false;
        initPromise = null;
    }

    async function render() {
        const students = StudentManager.getAll();
        const task = TaskManager.getCurrent();
        const taskData = TaskManager.getAllData();

        currentStudents = students.map(s => {
            const record = task ? TaskManager.getRecord(task.id, s.id) : null;
            return { ...s, submitted: record?.submitted || false, score: record?.score || null };
        });

        UIComponents.renderGrid(currentStudents, isNameVisible, (id, type) => {
            EventBus.emit('student:toggle', { id, type });
        });

        updateStats();
    }

    return {
        init: init,
        render: render,
        cleanup: cleanup,
        isInitialized: () => isInitialized
    };
})();

ModuleLoader.register('app', function() {
    return AppModule;
}, ['storage', 'student-manager', 'task-manager', 'state-manager', 'ui-components', 'event-bus']);
