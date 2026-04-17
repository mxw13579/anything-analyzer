export const zh = {
  // NavBar
  'nav.browser': '浏览器',
  'nav.inspector': '检查器',
  'nav.report': 'AI 报告',

  // Titlebar
  'titlebar.switchToEn': 'Switch to English',
  'titlebar.switchToZh': '切换到中文',
  'titlebar.lightMode': '浅色模式',
  'titlebar.darkMode': '深色模式',

  // Sessions
  'session.title': '会话列表',
  'session.newSession': '+ 新建会话',
  'session.createTitle': '创建新会话',
  'session.name': '会话名称',
  'session.namePlaceholder': '输入会话名称',
  'session.targetUrl': '目标 URL',
  'session.targetUrlPlaceholder': 'https://example.com',
  'session.cancel': '取消',
  'session.create': '创建',
  'session.selectOrCreate': '选择或创建一个会话开始',
  'session.selectForReport': '选择一个会话查看报告',

  // ControlBar
  'capture.start': '开始抓包',
  'capture.pause': '暂停',
  'capture.resume': '恢复',
  'capture.stop': '停止',
  'capture.analyze': '分析',
  'capture.analyzeSelected': '分析选中 ({count})',
  'capture.autoDetect': '自动识别',
  'capture.custom': '自定义...',
  'capture.customPurpose': '输入分析目的...',
  'capture.stopped': '已停止',
  'capture.running': '运行中',
  'capture.paused': '已暂停',

  // Data panel tabs
  'data.requests': '请求',
  'data.hooks': 'Hooks',
  'data.storage': '存储',
  'data.export': '导出',
  'data.clearData': '清除数据',
  'data.clearEnv': '清除环境',
  'data.clearDataConfirm': '清除此会话的所有抓包数据？此操作不可撤销。',
  'data.clearEnvConfirm': '清除所有浏览器 Cookie、存储和缓存？登录状态将丢失。',
  'data.clear': '清除',
  'data.selected': '已选',
  'data.total': '共',

  // Browser view
  'browser.start': '开始',
  'browser.pause': '暂停',
  'browser.stop': '停止',
  'browser.resume': '恢复',
  'browser.requests': '{count} 个请求',

  // StatusBar
  'status.session': '会话',
  'status.requests': '请求',
  'status.hooks': 'Hooks',

  // Report
  'report.title': '协议分析报告',
  'report.export': '导出 .md',
  'report.reanalyze': '重新分析',
  'report.stopAnalysis': '停止分析',
  'report.startAnalysis': '开始 AI 分析',
  'report.noReport': '暂无分析报告',
  'report.analyzing': 'AI 正在分析捕获的数据...',
  'report.preparing': '准备分析中...',
  'report.thinking': '思考中...',
  'report.analysisFailed': '分析失败',
  'report.followUpFailed': '追问失败',
  'report.askFollowUp': '输入追问...',
  'report.genPython': '生成 Python 复现代码',
  'report.explainCrypto': '详解加密/签名流程',
  'report.securityRisks': '分析潜在安全风险',
  'report.listApiParams': '列出所有 API 参数和响应结构',

  // Settings
  'settings.title': '设置',

  // Common
  'common.cancel': '取消',
  'common.ok': '确定',
  'common.reset': '重置',
  'common.noData': '暂无数据',

  // Toast messages
  'toast.envCleared': '浏览器环境已清除',
  'toast.envClearFailed': '清除浏览器环境失败',
  'toast.dataCleared': '抓包数据已清除',
  'toast.dataClearFailed': '清除数据失败',
} as const

export type LocaleKey = keyof typeof zh
