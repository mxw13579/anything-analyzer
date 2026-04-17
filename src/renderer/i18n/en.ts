export const en = {
  // NavBar
  'nav.browser': 'Browser',
  'nav.inspector': 'Inspector',
  'nav.report': 'AI Report',

  // Titlebar
  'titlebar.switchToEn': 'Switch to English',
  'titlebar.switchToZh': '切换到中文',
  'titlebar.lightMode': 'Light Mode',
  'titlebar.darkMode': 'Dark Mode',

  // Sessions
  'session.title': 'Sessions',
  'session.newSession': '+ New Session',
  'session.createTitle': 'Create Session',
  'session.name': 'Session Name',
  'session.namePlaceholder': 'Enter session name',
  'session.targetUrl': 'Target URL',
  'session.targetUrlPlaceholder': 'https://example.com',
  'session.cancel': 'Cancel',
  'session.create': 'Create',
  'session.selectOrCreate': 'Select or create a session to get started',
  'session.selectForReport': 'Select a session to view reports',

  // ControlBar
  'capture.start': 'Start Capture',
  'capture.pause': 'Pause',
  'capture.resume': 'Resume',
  'capture.stop': 'Stop',
  'capture.analyze': 'Analyze',
  'capture.analyzeSelected': 'Analyze Selected ({count})',
  'capture.autoDetect': 'Auto Detect',
  'capture.custom': 'Custom...',
  'capture.customPurpose': 'Enter analysis purpose...',
  'capture.stopped': 'Stopped',
  'capture.running': 'Running',
  'capture.paused': 'Paused',

  // Data panel tabs
  'data.requests': 'Requests',
  'data.hooks': 'Hooks',
  'data.storage': 'Storage',
  'data.export': 'Export',
  'data.clearData': 'Clear Data',
  'data.clearEnv': 'Clear Env',
  'data.clearDataConfirm': 'Clear all capture data for this session? This cannot be undone.',
  'data.clearEnvConfirm': 'Clear all browser cookies, storage and cache? Login state will be lost.',
  'data.clear': 'Clear',
  'data.selected': 'Selected',
  'data.total': 'Total',

  // Browser view
  'browser.start': 'Start',
  'browser.pause': 'Pause',
  'browser.stop': 'Stop',
  'browser.resume': 'Resume',
  'browser.requests': '{count} requests',

  // StatusBar
  'status.session': 'Session',
  'status.requests': 'Requests',
  'status.hooks': 'Hooks',

  // Report
  'report.title': 'Protocol Analysis Report',
  'report.export': 'Export .md',
  'report.reanalyze': 'Re-analyze',
  'report.stopAnalysis': 'Stop Analysis',
  'report.startAnalysis': 'Start AI Analysis',
  'report.noReport': 'No analysis report yet',
  'report.analyzing': 'AI is analyzing captured data...',
  'report.preparing': 'Preparing analysis...',
  'report.thinking': 'Thinking...',
  'report.analysisFailed': 'Analysis failed',
  'report.followUpFailed': 'Follow-up failed',
  'report.askFollowUp': 'Ask a follow-up...',
  'report.genPython': 'Generate Python reproduction code',
  'report.explainCrypto': 'Explain encryption/signing flow',
  'report.securityRisks': 'Analyze potential security risks',
  'report.listApiParams': 'List all API params and response structures',

  // Settings
  'settings.title': 'Settings',

  // Common
  'common.cancel': 'Cancel',
  'common.ok': 'OK',
  'common.reset': 'Reset',
  'common.noData': 'No data',

  // Toast messages
  'toast.envCleared': 'Browser environment cleared',
  'toast.envClearFailed': 'Failed to clear browser environment',
  'toast.dataCleared': 'Capture data cleared',
  'toast.dataClearFailed': 'Failed to clear data',
} as const
