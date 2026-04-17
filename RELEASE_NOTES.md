# Anything Analyzer v3.2.0

## UI 全面重构

- **全新设计系统** — 基于 CSS Design Tokens 重构，统一颜色、间距、圆角、字体等视觉变量，告别 Ant Design 依赖
- **自研 UI 组件库** — Button、Modal、Select、Input、Tag、Toast、VirtualTable、Tooltip、Popconfirm 等 20+ 组件全部自研，体积更小、风格统一
- **CSS Modules 化** — 所有组件样式迁移至 CSS Modules，杜绝样式污染
- **三视图架构** — Browser / Inspector / Report 三个独立视图，导航标签切换，信息密度更高
- **自定义标题栏** — 无边框窗口 + 自定义 Titlebar，集成导航、语言切换、主题切换、窗口控制
- **新增 StatusBar** — 底部状态栏实时显示会话状态、请求数、Hook 数、LLM 模型和 token 消耗
- **新增 AnalyzeBar** — Inspector 底部独立分析栏，集成模式选择、分析按钮、选中统计、导出
- **Report 视图优化** — 左右分栏（报告内容 + 上下文面板），显示 API 端点、Hook 统计、LLM 信息

## 中英文双语支持

- **完整 i18n** — 所有界面文本支持中文和 English 双语切换
- **一键切换** — 标题栏语言按钮即时切换，无需重启
- **持久化** — 语言偏好保存到 localStorage，下次启动自动恢复

## 深色 / 浅色主题

- **双主题** — 深色（默认）和浅色主题，通过 CSS 变量实现无缝切换
- **一键切换** — 标题栏主题按钮即时切换
- **持久化** — 主题偏好保存到 localStorage

## 新功能

- **请求序号列** — 请求列表新增 `#` 序号列，清晰标识请求捕获顺序，支持排序
- **Shift+Click 批量选中** — 先点击一条请求，按住 Shift 点击另一条，两条之间的所有请求自动选中，大幅提升批量分析效率
- **停止分析** — 分析过程中可随时点击「停止分析」中断，AbortSignal 全链路传播（UI → IPC → AiAnalyzer → LLMRouter → fetch），立即释放资源
- **追问上下文增强** — 报告追问时自动携带请求摘要上下文，AI 可通过内置 `get_request_detail` 工具按序号查看任意请求的完整详情（请求头/体、响应头/体）
- **Markdown 渲染优化** — 流式分析输出正确渲染 Markdown（代码高亮、表格、列表），告别纯文本

## 问题修复

- 修复重新分析按钮（Re-analyze）在已有报告时不生效的问题
- 修复流式分析输出无 Markdown 样式的问题
- 修复分析取消后仍显示错误信息的问题

## 详细使用说明

本版本新增 [USAGE.md](USAGE.md) 完整使用说明文档，涵盖界面概览、快速上手、各视图详解、MITM 代理配置、设置说明、快捷操作和常见问题。

## 下载

| 平台 | 文件 |
|------|------|
| Windows | `Anything-Analyzer-Setup-3.2.0.exe` |
| macOS (Apple Silicon) | `Anything-Analyzer-3.2.0-arm64.dmg` |
| macOS (Intel) | `Anything-Analyzer-3.2.0-x64.dmg` |
| Linux | `Anything-Analyzer-3.2.0.AppImage` |
