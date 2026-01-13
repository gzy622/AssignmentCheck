/**
 * 事件总线模块
 * 实现事件发布订阅模式
 *
 * 功能：
 * 1. 事件订阅 (on)
 * 2. 事件取消订阅 (off)
 * 3. 事件发布 (emit)
 * 4. 单次订阅 (once)
 *
 * 事件命名规范：
 * - student:* 学生相关事件 (student:add, student:delete, student:edit, student:toggle)
 * - task:* 任务相关事件 (task:create, task:delete, task:switch, task:submit, task:score)
 * - ui:* UI相关事件 (ui:modal:open, ui:modal:close, ui:toast, ui:render)
 * - state:* 状态相关事件 (state:change, state:reset)
 * - app:* 应用级事件 (app:init, app:destroy)
 *
 * 版本：1.0.0
 * 创建时间：2026-01-13
 */
const EventBusModule = (function() {
    const listeners = new Map();
    const onceListeners = new Map();
    let listenerIdCounter = 0;

    function on(event, callback, priority = 0) {
        if (typeof callback !== 'function') {
            console.warn('[EventBus] Callback must be a function');
            return null;
        }

        const id = `listener_${++listenerIdCounter}`;

        if (!listeners.has(event)) {
            listeners.set(event, []);
        }

        const listener = { id, callback, priority };
        listeners.get(event).push(listener);
        listeners.get(event).sort((a, b) => b.priority - a.priority);

        return id;
    }

    function once(event, callback, priority = 0) {
        if (typeof callback !== 'function') {
            console.warn('[EventBus] Callback must be a function');
            return null;
        }

        const id = `once_${++listenerIdCounter}`;

        if (!onceListeners.has(event)) {
            onceListeners.set(event, []);
        }

        const listener = { id, callback, priority };
        onceListeners.get(event).push(listener);
        onceListeners.get(event).sort((a, b) => b.priority - a.priority);

        return id;
    }

    function off(event, callbackOrId) {
        if (callbackOrId === undefined) {
            if (event) {
                listeners.delete(event);
                onceListeners.delete(event);
            } else {
                listeners.clear();
                onceListeners.clear();
            }
            return;
        }

        const eventListeners = listeners.get(event) || [];
        const onceEventListeners = onceListeners.get(event) || [];

        let removed = false;

        for (let i = eventListeners.length - 1; i >= 0; i--) {
            const listener = eventListeners[i];
            if (listener.id === callbackOrId || listener.callback === callbackOrId) {
                eventListeners.splice(i, 1);
                removed = true;
            }
        }

        for (let i = onceEventListeners.length - 1; i >= 0; i--) {
            const listener = onceEventListeners[i];
            if (listener.id === callbackOrId || listener.callback === callbackOrId) {
                onceEventListeners.splice(i, 1);
                removed = true;
            }
        }

        if (eventListeners.length === 0) {
            listeners.delete(event);
        }
        if (onceEventListeners.length === 0) {
            onceListeners.delete(event);
        }

        return removed;
    }

    function emit(event, data) {
        const eventListeners = listeners.get(event) || [];
        const onceEventListeners = onceListeners.get(event) || [];
        const wildcardListeners = listeners.get('*') || [];
        const wildcardOnceListeners = onceListeners.get('*') || [];

        const allListeners = [
            ...eventListeners.map(l => ({ ...l, isOnce: false })),
            ...onceEventListeners.map(l => ({ ...l, isOnce: true })),
            ...wildcardListeners.map(l => ({ ...l, isOnce: false, isWildcard: true })),
            ...wildcardOnceListeners.map(l => ({ ...l, isOnce: true, isWildcard: true }))
        ];

        const results = [];

        for (let i = allListeners.length - 1; i >= 0; i--) {
            const listener = allListeners[i];

            try {
                if (listener.isWildcard) {
                    results.push(listener.callback(event, data));
                } else {
                    results.push(listener.callback(data));
                }
            } catch (error) {
                console.error(`[EventBus] Error in event listener for "${event}":`, error);
            }

            if (listener.isOnce) {
                off(event, listener.id);
            }
        }

        return results;
    }

    function getListeners(event) {
        const result = [];
        const eventListeners = listeners.get(event) || [];
        const onceEventListeners = onceListeners.get(event) || [];

        result.push(...eventListeners.map(l => ({ ...l, isOnce: false })));
        result.push(...onceEventListeners.map(l => ({ ...l, isOnce: true })));

        return result;
    }

    function hasListeners(event) {
        const eventListeners = listeners.get(event) || [];
        const onceEventListeners = onceListeners.get(event) || [];
        return eventListeners.length > 0 || onceEventListeners.length > 0;
    }

    function getListenerCount(event) {
        const eventListeners = listeners.get(event) || [];
        const onceEventListeners = onceListeners.get(event) || [];
        return eventListeners.length + onceEventListeners.length;
    }

    return {
        on: on,
        once: once,
        off: off,
        emit: emit,
        getListeners: getListeners,
        hasListeners: hasListeners,
        getListenerCount: getListenerCount
    };
})();

ModuleLoader.register('event-bus', function() {
    return EventBusModule;
}, []);
