/**
 * UI组件模块
 * 封装学生卡片、网格渲染、弹窗和提示组件
 *
 * 功能：
 * 1. 学生卡片创建 (StudentCardService)
 * 2. 学生网格渲染 (StudentGridService)
 * 3. 弹窗管理 (ModalService)
 * 4. 提示服务 (ToastService)
 *
 * 依赖：
 * - StateManagerModule: 状态管理
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const UIComponentsModule = (function(stateManager) {
    const StudentCardService = (function() {
        function createCard(student, isNameVisible) {
            const isSub = student.submitted;
            const hasScore = student.score !== null && student.score !== '';

            const el = document.createElement('div');
            el.className = `student-btn relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${isSub ? 'status-submitted' : 'status-default'}`;

            let html = '';
            if (isNameVisible) {
                html += `<span class="absolute top-1 left-1 text-[10px] font-bold ${isSub ? 'text-green-100' : 'text-gray-400'}">${student.id}</span>`;
                html += `<span class="text-sm font-bold leading-tight ${isSub ? 'opacity-100' : 'opacity-80'}">${student.name.slice(-2)}</span>`;
            } else {
                html += `<span class="text-xl font-bold ${isSub ? 'opacity-100' : 'opacity-80'}">${student.id}</span>`;
            }
            if (hasScore) {
                html += `<span class="absolute top-1 right-1 text-[10px] font-bold ${isSub ? 'bg-white/20' : 'bg-gray-400/20 text-gray-500'} px-1 rounded text-white border border-white/20">${student.score}</span>`;
            }

            el.innerHTML = html;
            return el;
        }

        function updateCard(el, student, isNameVisible) {
            const isSub = student.submitted;
            const hasScore = student.score !== null && student.score !== '';

            el.className = `student-btn relative aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${isSub ? 'status-submitted' : 'status-default'}`;

            let html = '';
            if (isNameVisible) {
                html += `<span class="absolute top-1 left-1 text-[10px] font-bold ${isSub ? 'text-green-100' : 'text-gray-400'}">${student.id}</span>`;
                html += `<span class="text-sm font-bold leading-tight ${isSub ? 'opacity-100' : 'opacity-80'}">${student.name.slice(-2)}</span>`;
            } else {
                html += `<span class="text-xl font-bold ${isSub ? 'opacity-100' : 'opacity-80'}">${student.id}</span>`;
            }
            if (hasScore) {
                html += `<span class="absolute top-1 right-1 text-[10px] font-bold ${isSub ? 'bg-white/20' : 'bg-gray-400/20 text-gray-500'} px-1 rounded text-white border border-white/20">${student.score}</span>`;
            }

            el.innerHTML = html;
        }

        return {
            create: createCard,
            update: updateCard
        };
    })();

    const StudentGridService = (function() {
        let gridElement = null;

        function init(gridId) {
            gridElement = document.getElementById(gridId);
            return gridElement !== null;
        }

        function render(students, isNameVisible, touchCallback) {
            if (!gridElement) return;

            gridElement.classList.add('opacity-0');
            requestAnimationFrame(() => {
                const fragment = document.createDocumentFragment();
                students.forEach((s, i) => {
                    const el = StudentCardService.create(s, isNameVisible);
                    if (touchCallback) {
                        bindTouchEvents(el, s.id, touchCallback);
                    }
                    fragment.appendChild(el);
                });
                gridElement.innerHTML = '';
                gridElement.appendChild(fragment);
                requestAnimationFrame(() => {
                    gridElement.classList.remove('opacity-0');
                });
            });
        }

        function updateOne(index, student, isNameVisible) {
            if (!gridElement || !gridElement.children[index]) return;
            StudentCardService.update(gridElement.children[index], student, isNameVisible);
        }

        function bindTouchEvents(el, id, callback) {
            let timer, startX, startY, isScroll = false, isLong = false;

            el.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); return false; };

            const start = (x, y) => {
                startX = x; startY = y; isScroll = false; isLong = false;
                timer = setTimeout(() => {
                    if (!isScroll) {
                        isLong = true;
                        if (navigator.vibrate) navigator.vibrate(50);
                        callback(id, 'long');
                    }
                }, 500);
            };

            const move = (x, y) => {
                if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) {
                    isScroll = true; clearTimeout(timer);
                }
            };

            const end = () => {
                clearTimeout(timer);
                if (!isScroll && !isLong) {
                    callback(id, 'short');
                }
            };

            el.ontouchstart = e => start(e.touches[0].clientX, e.touches[0].clientY);
            el.ontouchmove = e => move(e.touches[0].clientX, e.touches[0].clientY);
            el.ontouchend = e => { if (e.cancelable) e.preventDefault(); end(); };
            el.onmousedown = e => start(e.clientX, e.clientY);
            el.onmousemove = e => { if (e.buttons === 1) move(e.clientX, e.clientY); };
            el.onmouseup = end;
            el.onmouseleave = () => clearTimeout(timer);
        }

        return {
            init: init,
            render: render,
            updateOne: updateOne,
            bindTouchEvents: bindTouchEvents
        };
    })();

    const ToastService = (function() {
        let toastElement = null;
        let timer = null;

        function init(toastId) {
            toastElement = document.getElementById(toastId);
            return toastElement !== null;
        }

        function show(message, duration = 2000) {
            if (!toastElement) return;

            toastElement.innerText = message;
            toastElement.classList.remove('opacity-0');

            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                toastElement.classList.add('opacity-0');
            }, duration);
        }

        function hide() {
            if (!toastElement) return;
            toastElement.classList.add('opacity-0');
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }

        return {
            init: init,
            show: show,
            hide: hide
        };
    })();

    const ModalService = (function() {
        const slideModals = ['task', 'data', 'stats', 'student'];
        const scaleModals = ['score', 'input', 'confirm'];

        function openSlide(backdropId, modalId) {
            const backdrop = document.getElementById(backdropId);
            const modal = document.getElementById(modalId);
            if (!backdrop || !modal || !backdrop.classList.contains('hidden')) return;

            backdrop.classList.remove('hidden');
            modal.classList.add('translate-y-full');
            modal.offsetHeight;
            modal.classList.remove('translate-y-full');

            pushModal(modalId);
        }

        function openScale(backdropId, modalId, callback) {
            const backdrop = document.getElementById(backdropId);
            const modal = document.getElementById(modalId);
            if (!backdrop || !modal || !backdrop.classList.contains('hidden')) return;

            backdrop.classList.remove('hidden');
            requestAnimationFrame(() => {
                modal.classList.remove('scale-95', 'opacity-0');
                modal.classList.add('scale-100', 'opacity-100');
            });

            pushModal(modalId);

            if (callback) {
                setTimeout(callback, 50);
            }
        }

        function close(modalId) {
            const backdrop = document.getElementById(`${modalId}-backdrop`);
            const modal = document.getElementById(modalId);
            if (!backdrop || !modal) return;

            const isSlide = slideModals.some(id => modalId.includes(id));
            const isScale = scaleModals.some(id => modalId.includes(id));

            if (isSlide) {
                modal.classList.add('translate-y-full');
            } else if (isScale) {
                modal.classList.remove('scale-100', 'opacity-100');
                modal.classList.add('scale-95', 'opacity-0');
            }

            if (modalId === 'input-modal') {
                const input = document.getElementById('common-input');
                if (input) input.blur();
            }

            popModal(modalId);
            setTimeout(() => backdrop.classList.add('hidden'), 200);
        }

        function closeAll() {
            const modals = document.querySelectorAll('[id$="-backdrop"]');
            modals.forEach(bg => {
                if (!bg.classList.contains('hidden')) {
                    const modalId = bg.id.replace('-backdrop', '');
                    close(modalId);
                }
            });
        }

        function pushModal(id) {
            const modalStack = window.modalStack || [];
            modalStack.push(id);
            window.modalStack = modalStack;
        }

        function popModal(id) {
            const modalStack = window.modalStack || [];
            const idx = modalStack.lastIndexOf(id);
            if (idx > -1) {
                modalStack.splice(idx, 1);
                window.modalStack = modalStack;
            }
        }

        function getTopModal() {
            const modalStack = window.modalStack || [];
            return modalStack[modalStack.length - 1] || null;
        }

        return {
            openSlide: openSlide,
            openScale: openScale,
            close: close,
            closeAll: closeAll,
            pushModal: pushModal,
            popModal: popModal,
            getTopModal: getTopModal
        };
    })();

    return {
        StudentCardService: StudentCardService,
        StudentGridService: StudentGridService,
        ToastService: ToastService,
        ModalService: ModalService
    };
})(StateManagerModule);

ModuleLoader.register('ui-components', function() {
    return UIComponentsModule;
}, ['state-manager']);
