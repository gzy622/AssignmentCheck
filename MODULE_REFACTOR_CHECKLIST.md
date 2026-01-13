# 模块化解耦合优化检查清单

## 项目：作业极速登记

**目标**：将单文件HTML项目重构为模块化架构  
**原则**：渐进式重构，稳定性优先

---

## 第一阶段：文件结构搭建

### 1.1 创建目录结构
```
AssignmentCheck/
├── src/
│   ├── modules/
│   │   ├── storage.js          # 数据持久化模块
│   │   ├── student-manager.js  # 学生管理模块
│   │   ├── task-manager.js     # 作业管理模块
│   │   ├── stats-service.js    # 统计服务模块
│   │   └── ui-components.js    # UI组件模块
│   ├── core/
│   │   ├── state-manager.js    # 状态管理
│   │   └── event-bus.js        # 事件总线
│   └── app.js                  # 应用入口
├── css/
│   ├── base.css                # 基础样式
│   └── components.css          # 组件样式
├── index.html                  # 主页面
└── module-loader.js            # 模块加载器
```

### 1.2 创建模块加载器
- [x] 建立 `module-loader.js`
- [x] 实现模块加载和初始化逻辑
- [x] 确保原有功能兼容

---

## 第二阶段：核心模块开发

### 2.1 数据持久化模块 (storage.js)
- [x] 封装 localStorage 读写操作
- [x] 实现数据版本管理
- [x] 添加数据校验机制（校验和验证）
- [x] 提供 `save(key, data)` 接口
- [x] 提供 `load(key)` 接口
- [x] 保持 `exportData()` 和 `importData()` 原有格式兼容

### 2.2 学生管理模块 (student-manager.js)
- [x] 提取 `StudentManager` 相关逻辑
- [x] 封装 `add(name)`、`delete(id)`、`edit(id, name)`、`getName(id)`、`getAll()` 方法
- [x] 提供导出导入接口
- [x] 依赖 storage 模块

### 2.3 作业管理模块 (task-manager.js)
- [x] 提取作业 CRUD 操作
- [x] 实现 `createTask(title)`、`deleteTask(id)`、`renameTask(id, title)`、`switchTask(id)` 方法
- [x] 封装提交记录操作 `submitTask(taskId, studentId)`、`scoreTask(taskId, studentId, score)`
- [x] 依赖 storage 模块

### 2.4 状态管理模块 (state-manager.js)
- [x] 创建全局状态容器
- [x] 实现 `getState()`、`setState(updates)` 方法
- [x] 添加状态变更监听机制
- [x] 自动持久化状态变更

---

## 第三阶段：UI层改造

### 3.1 UI组件模块 (ui-components.js)
- [x] 提取 `renderGrid()` 为 `renderStudentGrid(students)`
- [x] 提取 `renderCellContent()` 为 `createStudentCard(student)`
- [x] 提取弹窗相关函数为 `ModalService`
- [x] 提取 Toast 提示为 `ToastService`
- [x] 提取统计报表渲染为 `renderStatsReport()`
- [x] 在 index.html 中集成新模块
- [x] 更新版本号和检查清单

### 3.2 事件处理分离
- [x] 建立事件命名规范（如 `student:toggle`、`task:switch`）
- [x] 创建 `EventBus` 实现事件发布订阅
- [x] 分离触摸/点击事件处理与业务逻辑

---

## 第四阶段：应用入口整合

### 4.1 主应用入口 (app.js)
- [x] 整合各模块初始化
- [x] 设置模块加载顺序
- [x] 建立模块间依赖注入
- [x] 实现新旧代码兼容桥接

### 4.2 HTML页面更新
- [x] 引入模块加载器
- [x] 更新 script 标签加载顺序
- [x] 保持原有 DOM 结构不变

---

## 版本与发布

### 每次提交要求
- [ ] 更新版本号（在 HTML title 附近或独立 VERSION 文件）
- [ ] 记录变更内容
- [ ] 验证核心功能可用

### 核心功能验证清单
- [ ] 学生登记（单击切换状态）
- [ ] 作业切换
- [ ] 评分功能（长按打开）
- [ ] 数据导出
- [ ] 数据导入恢复
- [ ] 统计报表生成

---

## 模块接口规范

### 标准模块模板
```javascript
// 模块名：xxx-manager.js
const ModuleName = (function(storage, eventBus) {
    // 私有状态
    let privateState = {};

    // 公共接口
    return {
        init: function() {},
        method1: function() {},
        method2: function() {}
    };
})(StorageService, EventBus);
```

### 模块依赖声明
- 每个模块文件顶部注明依赖的其他模块
- 使用 IIFE 模式实现依赖注入

---

## 回滚预案

### 问题处理流程
1. 发现问题 → 2. 定位问题模块 → 3. 回退到上一稳定版本 → 4. 修复问题 → 5. 重新提交

### 稳定版本标记
- 每次阶段完成打标签：`v1.0-monolith`（原始版）、`v1.1-modular-phase1` 等

---

## 进度跟踪

- [ ] 阶段一完成：____
- [ ] 阶段二完成：____
- [ ] 阶段三完成：____
- [ ] 阶段四完成：____
- [ ] 全量测试通过：____
- [ ] 版本发布：____

---

## 注意事项

1. **单次只改一处**：每次只修改一个功能点，验证后再继续
2. **保持导出功能**：任何时候数据导出必须可用
3. **渐进式提交**：频繁提交小步变更，便于定位问题
4. **不删旧代码**：过渡期保留旧函数作为桥接，逐步移除
5. **注释关键逻辑**：复杂逻辑必须添加注释说明

---

最后更新：2026-01-13
当前版本：v1.0（单文件架构）
