# 🤖 AI Pulse

Monitor AI service providers' usage, balance, and service status — all in one popup.

## Features

- **18+ Providers** — DeepSeek, Kimi, ChatGLM, OpenAI, Claude, Gemini, Grok, Perplexity, and more. Custom providers supported.
- **Dual Mode** — With API Key: real-time balance, history charts, daily consumption. Without: service uptime monitoring.
- **Multi-Billing** — Prepaid balance, post-paid usage, token quota. Alerts adapt to billing model.
- **Spend Alerts** — Badge animation + notification when spending exceeds daily average.
- **Spend Prediction** — "X days remaining" estimate based on consumption rate.
- **Balance History** — Time-series charts with per-day ticks.
- **Popup Tabs** — Monitor / Settings tabs. Click any card to configure API keys and alerts inline.
- **i18n** — Chinese / English, auto-detects browser language.
- **Theme** — Follows system light/dark mode via `prefers-color-scheme`.
- **Privacy** — API keys stored locally, only sent to provider APIs.

## Development

```bash
npm install
npm run dev          # dev mode with hot reload
npm run build        # production build
npm test             # run 72 unit tests
npm run typecheck    # TypeScript check
```

### Load in Chrome

1. `npm run build`
2. Open `chrome://extensions`, enable "Developer mode"
3. "Load unpacked" → select `dist/`

## Architecture

```
entrypoints/          # WXT entry points
  background.ts       # Service Worker — alarms, API orchestration, badge
  popup/              # Popup UI (React) — monitor + settings tabs
  options/            # Options page (legacy)

core/                 # Business logic
  storage.ts          # chrome.storage.local typed wrapper
  provider-registry.ts # Provider registry + custom provider CRUD
  balance-service.ts  # Balance fetch + cache + history snapshots
  status-service.ts   # Status check + history
  alarm-service.ts    # chrome.alarms periodic fetch
  badge-service.ts    # Extension badge + spend alerts
  spend-checker.ts    # Spending detection (multi-billing-model aware)

providers/            # One file per provider (16 built-in + custom)
components/           # React components (popup, options, shared)
hooks/                # React hooks (useProviders, useBalanceHistory, etc.)
utils/                # i18n, formatters, validators
```

## Tech Stack

- **Framework**: WXT (Web Extension Tools)
- **UI**: React 18 + TypeScript
- **Charts**: Recharts
- **Storage**: chrome.storage.local
- **Testing**: Vitest + React Testing Library
- **CI**: GitHub Actions (typecheck + tests + build)
