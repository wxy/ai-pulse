# 🤖 AI Pulse

监控 AI 服务商用量、余额和服务状态的 Chrome 扩展。

## 功能

- **多服务商支持**：DeepSeek、Kimi (月之暗面)、ChatGLM (智谱)、百川智能、通义千问 (阿里云)、文心一言 (百度)
- **双模式运行**：有 API Key → 余额监控+历史图表；无 Key → 仅服务状态监控
- **余额历史图表**：折线图展示余额变化趋势
- **自动定时刷新**：后台定期拉取（可配置间隔）
- **安全存储**：API Key 仅存本地，只发往对应服务商 API

## 开发

```bash
npm install        # 安装依赖
npm run dev        # 开发模式
npm run build      # 构建生产版本
```

### 加载到 Chrome

1. `npm run build`
2. 打开 `chrome://extensions`，开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择 `dist/` 目录

## 架构

```
entrypoints/          # WXT 入口
  background.ts       # Service Worker
  popup/              # 弹窗 (React)
  options/            # 设置页 (React)

types/                # TypeScript 接口
core/                 # 核心逻辑
providers/            # 服务商实现（每个一个文件）
components/           # React UI 组件
hooks/                # React Hooks
utils/                # 工具函数
```

## 技术栈

- **框架**: WXT (Web Extension Tools)
- **UI**: React 18 + TypeScript
- **图表**: Recharts
- **构建**: Vite
- **存储**: chrome.storage.local
