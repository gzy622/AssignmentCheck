# 作业极速登记

一个轻量级的作业登记与管理系统，专为教师设计，支持快速记录学生作业提交情况。

## 功能特性

- **作业管理**：创建、切换多个作业任务
- **快速登记**：支持 A/B/C/D 评分或自定义分数
- **进度追踪**：实时显示提交人数统计与进度条
- **一键反选**：快速反转所有学生提交状态
- **数据备份**：支持导出/导入 JSON 数据
- **统计汇总**：多作业统计分析与筛选
- **灵活显示**：可切换姓名/学号显示模式

## 技术栈

- HTML5
- Tailwind CSS（本地化）
- Font Awesome 图标库（本地化）
- Vanilla JavaScript

## 文件结构

```
AssignmentCheck/
├── index.html           # 主应用文件
├── README.md            # 说明文档
├── css/
│   ├── fontawesome.min.css   # Font Awesome 样式
│   └── tailwind.min.css      # Tailwind CSS
└── webfonts/            # Font Awesome 字体文件
    ├── fa-solid-900.woff2
    ├── fa-regular-400.woff2
    └── fa-brands-400.woff2
```

## 本地化资源

所有外部资源已本地化：
- Font Awesome 图标库至 `css/` 和 `webfonts/` 目录
- Tailwind CSS 至 `css/tailwind.min.css`
