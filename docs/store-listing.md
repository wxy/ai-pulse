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

一站式监控您的 AI 服务商用量、余额与服务状态。

主要功能：
- 支持 DeepSeek、Kimi、ChatGLM、OpenAI、Anthropic、Gemini、Grok、Perplexity 等 13 家主流 AI 服务商，并支持自定义添加
- 余额监控：实时展示余额/用量、余额历史图表、日均消费与剩余天数预估
- 服务状态：三态检测（运行中 / 需注意 / 服务异常），结合官方状态页辅助判断，探测来源一目了然
- 花费告警：消费异常时徽章动画与系统通知提醒
- 隐私友好：API Key 仅保存在本地，只发送给您配置的服务商

产品家族：
AI Pulse 还提供 macOS 桌面版与 iOS/watchOS 版本。桌面版与移动版数据互通，支持本地代码级成本统计；浏览器扩展为独立工具，数据仅保存在本地，不与桌面版同步。

**English**

Monitor usage, balance, and service status of your AI service providers — all in one place.

Features:
- Support for 13 major AI providers: DeepSeek, Kimi, ChatGLM, OpenAI, Anthropic, Gemini, Grok, Perplexity, and more; custom providers supported
- Balance monitoring: real-time balance, history charts, daily average spend, and estimated days remaining
- Service status: three-state checks (operational / attention / down), augmented by official status pages, with the probe source shown at a glance
- Spend alerts: badge animation and system notifications when spending is unusual
- Privacy-friendly: API keys are stored locally and only sent to the providers you configure

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
