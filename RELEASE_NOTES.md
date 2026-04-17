# Anything Analyzer v3.2.2

## 新功能

- **MCP Server 鉴权** — 内置 MCP Server 新增 Bearer Token 鉴权机制，默认开启
  - 首次启用自动生成安全 Token
  - 设置面板可开关鉴权、查看/编辑/复制/重新生成 Token
  - 外部工具需在请求头中携带 `Authorization: Bearer <token>`
  - 可选关闭鉴权（不推荐）

## Bug Fixes

- **修复抓包控件配色** — 修复 Start/Pause/Stop 按钮在不同状态下颜色不变的问题
  - Stopped 状态：Start 绿色可点击，Pause/Stop 灰色禁用
  - Running 状态：Start 绿色指示，Pause 黄色、Stop 红色可点击
  - Paused 状态：Pause 黄色指示，Resume 绿色、Stop 红色可点击

## 下载

| 平台 | 文件 |
|------|------|
| Windows | `Anything-Analyzer-Setup-3.2.2.exe` |
| macOS (Apple Silicon) | `Anything-Analyzer-3.2.2-arm64.dmg` |
| macOS (Intel) | `Anything-Analyzer-3.2.2-x64.dmg` |
| Linux | `Anything-Analyzer-3.2.2.AppImage` |
