# Chrome Web Store 商店文案（0.4.3）

> 短描述会从 `public/_locales/*/messages.json` 的 `extDescription` 自动同步；
> 长描述与发布说明需要手动粘贴到 Chrome Web Store 开发者后台。

> 桌面版相关链接（Related Links 建议填写）：
> https://apps.apple.com/us/app/ai-pulse/id6786290416?mt=12

## 短描述（Short description）

**中文**

一站式监控 AI 服务商的用量、余额与服务状态，支持花费告警与自定义服务商。

**English**

Monitor usage, balance, and service status of your AI service providers, with spend alerts and custom providers.

## 长描述（Full description）

**中文**

AI Pulse 在弹窗内一站式监控你的 AI 服务商——无需切换窗口。

📡 多服务商支持
13 家内置服务商，覆盖国内外主流 AI 平台。支持自定义添加 API 端点——不受限于预置列表。

🔑 双模式监控
• 配置 API Key — 实时余额追踪、日均消费估算、历史图表、花费预测
• 不配 Key — 仅监控服务在线状态

💰 智能花费提醒
• 花费超过日均时徽章动画提醒
• 余额旁显示“剩余 X 天”预测
• 趋势指示器显示余额变化方向
• 可选的桌面通知，列明各服务商花费明细

📐 多计费模式
• 预付余额 — “剩余 ¥50”
• 后付用量 — “本期已用 ¥12.50”
• 配额制 — “剩余 800K tokens”
• 告警自动适配各服务商的计费模式

🎨 功能特性
• 深色/浅色主题（跟随系统）
• 中文/English（自动检测浏览器语言）
• 每个服务商独立启用/禁用 + 自定义显示名
• 点击卡片直达完整配置
• 官方 favicon 图标
• 支持自定义添加服务商

🔄 后台自动监控
• 可配置刷新间隔（15 分钟至 24 小时）
• 状态时间线展示近期运行历史

🛡️ 隐私
• 所有 API Key 存储在 chrome.storage.local
• 无外部分析或追踪
• 开源项目（GitHub）

产品家族：
AI Pulse 还提供 macOS 桌面版与 iOS/watchOS 版本。桌面版与移动版数据互通，支持本地代码级成本统计；浏览器扩展为独立工具，数据仅保存在本地，不与桌面版同步。

**English**

AI Pulse monitors your AI service providers in one popup — no separate windows, no switching tabs.

📡 Multi-Provider Support
13 built-in providers covering major AI platforms worldwide. Custom providers supported via user-defined API URLs — you're never locked in.

🔑 Dual-Mode Monitoring
• With API Key — real-time balance tracking, daily consumption estimates, history charts, and spend prediction
• Without API Key — service uptime and health monitoring only

💰 Smart Spend Alerts
• Badge animation when spending exceeds daily average
• "X days remaining" prediction next to balance
• Trend indicator showing balance direction
• Optional desktop notification with provider breakdown

📐 Multi-Billing Support
• Prepaid balance — "remaining $50"
• Post-paid usage — "spent $12.50 this period"
• Token quota — "800K tokens remaining"
• Alerts automatically adapt to each provider's billing model

🎨 Features
• Dark/Light theme (follows system preference)
• Chinese/English (auto-detects browser language)
• Per-provider enable/disable + custom display names
• Click any card for full inline configuration
• Official favicon icons
• Custom provider support — add any API endpoint

🔄 Background Monitoring
• Configurable refresh interval (15 min – 24 h)
• Status timeline showing recent uptime history

🛡️ Privacy
• All API keys stored locally in chrome.storage.local
• No external analytics or tracking
• Open source (GitHub)

Product family:
AI Pulse also offers a macOS desktop app and iOS/watchOS apps. The desktop and mobile apps share the same data and provide local code-aware cost tracking; the browser extension is an independent tool whose data stays local and is not synced with the desktop app.

## 发布说明（What's new — 0.4.3）

**中文**

- 修复：弹窗偶尔被内容撑宽
- 新增：三态服务状态检测，结合官方状态页辅助判断
- 修复：弹窗唤醒导致的频繁抓取，请求并发受限
- 改进：自定义服务商更健壮（HTTPS 校验、重名处理、解析容错）
- 改进：关于区域新增桌面版链接

**English**

- Fix: popup could be stretched wider than designed
- New: three-state service status with official status page support
- Fix: fetch cadence on popup wake; bounded request concurrency
- Improved: custom providers (HTTPS validation, duplicate names, parse error handling)
- Improved: desktop version link in the About section
