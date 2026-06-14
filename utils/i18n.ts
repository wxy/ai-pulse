/**
 * Simple i18n — detects browser language, defaults to zh-CN.
 */

const ZH: Record<string, string> = {
  // Popup
  'popup.title': 'AI Pulse',
  'popup.refresh': '刷新全部服务商',
  'popup.settings': '设置',
  'popup.empty': '未配置服务商，请进入设置页面添加。',
  'popup.no_key': '添加 API Key 以监控余额',
  'popup.no_data': '暂无余额数据',
  'popup.granted': '赠送',
  'popup.topped_up': '充值',
  'popup.updated': '更新于',
  'popup.never': '从未更新',
  'popup.just_now': '刚刚',
  'popup.min_ago': '分钟前',
  'popup.hour_ago': '小时前',
  'popup.day_ago': '天前',

  // Status
  'status.running': '运行中',
  'status.error': '服务异常',
  'status.unknown': '未知',
  'status.unreachable': '无法访问',
  'status.connection_failed': '连接失败',

  // Options nav
  'nav.providers': '服务商',
  'nav.settings': '设置',
  'nav.about': '关于',

  // Options providers
  'providers.title': '服务商',
  'providers.desc': '管理您的 AI 服务商连接',
  'providers.configured': '已配置',
  'providers.not_configured': '未配置',
  'providers.configure': '配置',
  'providers.back': '返回服务商列表',

  // Options provider config
  'config.display_name': '显示名称',
  'config.api_key': 'API Key 配置',
  'config.api_key_desc': '输入 API Key 以启用余额和用量监控。Key 仅存储在本地。',
  'config.key_placeholder': '请输入 API Key（sk- 开头）',
  'config.key_format': 'Key 格式',
  'config.key_format_hint': '请参考服务商文档',
  'config.save': '保存',
  'config.saving': '保存中...',
  'config.remove_key': '移除 Key',
  'config.invalid_format': 'API Key 格式不正确',
  'config.save_failed': '保存失败',
  'config.status_only_title': '仅状态监控',
  'config.status_only_desc': '未开放公开的余额 API，仅监控服务状态。',
  'config.status_only_badge': '仅状态',
  'config.links': '链接',
  'config.console': '控制台',
  'config.status_page': '状态页',

  // Settings
  'settings.title': '设置',
  'settings.desc': '配置监控行为',
  'settings.refresh_interval': '刷新间隔',
  'settings.refresh_desc': '自动拉取余额和状态的时间间隔',
  'settings.history_retention': '历史保留',
  'settings.history_desc': '余额历史快照保留多长时间？',
  'settings.theme': '主题',
  'settings.theme_dark': '深色',
  'settings.theme_light': '浅色',
  'settings.saving': '保存中...',

  // Intervals
  'interval.15min': '每 15 分钟',
  'interval.30min': '每 30 分钟',
  'interval.1hour': '每小时',
  'interval.2hours': '每 2 小时',
  'interval.6hours': '每 6 小时',
  'interval.12hours': '每 12 小时',
  'interval.24hours': '每 24 小时',

  // Retention
  'retention.7days': '7 天',
  'retention.30days': '30 天',
  'retention.60days': '60 天',
  'retention.90days': '90 天',
  'retention.180days': '180 天',
  'retention.1year': '1 年',

  // Chart
  'chart.loading': '加载历史数据...',
  'chart.empty': '暂无余额历史数据。首次自动拉取完成后数据将出现在这里。',
  'chart.title': '余额历史',

  // About
  'about.title': '关于 AI Pulse',
  'about.desc': '监控您的 AI 服务商用量、余额和服务状态。',
  'about.version': '版本',
  'about.supported': '已支持：DeepSeek · Kimi · ChatGLM · 百川智能 · 通义千问 · 文心一言',

  // Errors
  'error.page': '页面出现错误',
  'error.load_providers': '加载服务商失败',
  'error.refresh_failed': '刷新失败',
};

const EN: Record<string, string> = {
  'popup.title': 'AI Pulse',
  'popup.refresh': 'Refresh all providers',
  'popup.settings': 'Settings',
  'popup.empty': 'No providers configured. Open Settings to add providers.',
  'popup.no_key': 'Add API Key to track balance',
  'popup.no_data': 'No balance data yet',
  'popup.granted': 'Granted',
  'popup.topped_up': 'Topped Up',
  'popup.updated': 'Updated',
  'popup.never': 'Never',
  'popup.just_now': 'Just now',
  'popup.min_ago': 'min ago',
  'popup.hour_ago': 'h ago',
  'popup.day_ago': 'd ago',

  'status.running': 'Operational',
  'status.error': 'Service Error',
  'status.unknown': 'Unknown',
  'status.unreachable': 'Unreachable',
  'status.connection_failed': 'Connection failed',

  'nav.providers': 'Providers',
  'nav.settings': 'Settings',
  'nav.about': 'About',

  'providers.title': 'Providers',
  'providers.desc': 'Manage your AI service provider connections',
  'providers.configured': 'Configured',
  'providers.not_configured': 'No Key',
  'providers.configure': 'Configure',
  'providers.back': 'Back to Providers',

  'config.display_name': 'Display Name',
  'config.api_key': 'API Key Configuration',
  'config.api_key_desc': 'Enter your API key to enable balance and usage monitoring. Key is stored locally.',
  'config.key_placeholder': 'Enter API key (sk-...)',
  'config.key_format': 'Key format',
  'config.key_format_hint': 'Check provider docs',
  'config.save': 'Save',
  'config.saving': 'Saving...',
  'config.remove_key': 'Remove Key',
  'config.invalid_format': 'Invalid API key format',
  'config.save_failed': 'Failed to save',
  'config.status_only_title': 'Status-Only Monitoring',
  'config.status_only_desc': 'No public balance API. Only service status will be monitored.',
  'config.status_only_badge': 'Status Only',
  'config.links': 'Links',
  'config.console': 'Console',
  'config.status_page': 'Status Page',

  'settings.title': 'Settings',
  'settings.desc': 'Configure monitoring behavior',
  'settings.refresh_interval': 'Refresh Interval',
  'settings.refresh_desc': 'How often to automatically fetch balances and status',
  'settings.history_retention': 'History Retention',
  'settings.history_desc': 'How long to keep balance history snapshots?',
  'settings.theme': 'Theme',
  'settings.theme_dark': 'Dark',
  'settings.theme_light': 'Light',
  'settings.saving': 'Saving...',

  'interval.15min': 'Every 15 min',
  'interval.30min': 'Every 30 min',
  'interval.1hour': 'Every hour',
  'interval.2hours': 'Every 2 hours',
  'interval.6hours': 'Every 6 hours',
  'interval.12hours': 'Every 12 hours',
  'interval.24hours': 'Every 24 hours',

  'retention.7days': '7 days',
  'retention.30days': '30 days',
  'retention.60days': '60 days',
  'retention.90days': '90 days',
  'retention.180days': '180 days',
  'retention.1year': '1 year',

  'chart.loading': 'Loading history...',
  'chart.empty': 'No balance history yet. Data will appear after the first automatic fetch cycle.',
  'chart.title': 'Balance History',

  'about.title': 'About AI Pulse',
  'about.desc': 'Monitor your AI service providers\' usage, balance, and service status.',
  'about.version': 'Version',
  'about.supported': 'Supported: DeepSeek · Kimi · ChatGLM · Baichuan · Tongyi (Qwen) · Wenxin (ERNIE)',

  'error.page': 'Something went wrong',
  'error.load_providers': 'Failed to load providers',
  'error.refresh_failed': 'Refresh failed',
};

const translations: Record<string, Record<string, string>> = { zh: ZH, en: EN };

let currentLang: 'zh' | 'en' = 'zh';

export function detectLanguage(): 'zh' | 'en' {
  let lang = 'zh';
  if (typeof navigator !== 'undefined' && navigator.language) {
    lang = navigator.language;
  } else if (typeof chrome !== 'undefined' && chrome.i18n) {
    lang = chrome.i18n.getUILanguage();
  }
  return lang.startsWith('zh') ? 'zh' : 'en';
}

export function setLanguage(lang: 'zh' | 'en'): void {
  currentLang = lang;
}

export function getLanguage(): 'zh' | 'en' {
  return currentLang;
}

export function t(key: string): string {
  return translations[currentLang]?.[key] ?? translations.en?.[key] ?? key;
}

/** React hook for i18n */
export function useI18n() {
  // Detect on first call
  if (typeof window !== 'undefined' && !(window as any).__i18n_initialized) {
    currentLang = detectLanguage();
    (window as any).__i18n_initialized = true;
  }
  return { t, lang: currentLang };
}
