# Chrome 扩展图标更新 — 使用 Mac 应用新版图标

## 背景

- Mac 应用已完成 macOS 26 风格图标迁移：1024×1024 画布上，机器人图案居中于 824×824 白色圆角矩形（r=185.4px），四周 100px 透明边距。
- Chrome 扩展当前仍使用**旧版方形图标**（`public/icons/icon-{16,32,48,128}.png`），无圆角处理，视觉效果过时。
- 需要将 Chrome 扩展图标统一为新版设计，并打包 zip 用于 Chrome Web Store 更新。

## 设计决策

1. **仅机器人图案，无白色圆角底板。** Chrome 工具栏图标仅 16×16 / 32×32，白色底板会浪费宝贵像素。与 Mac Dock 图标不同，浏览器扩展图标不需要系统级蒙版，因此直接用机器人本体 + 透明背景即可。
2. **复用同一源文件。** 源图为 `mac-app/Resources/AIPulse.png`（1024×1024），与 Mac 应用图标同源，确保品牌一致。
3. **复用现有裁剪逻辑。** `generate-icons.py` 中的 `content_bbox()` 函数已能从白色边距中精准裁剪出机器人图案。
4. **输出 RGBA PNG，带透明通道。** 当前 Chrome 图标是 RGB（无 alpha），新版改为 RGBA，让图标在亮/暗色主题下都能自然融入。

## 目标尺寸

| 尺寸 | 用途 |
|------|------|
| 16×16 | 工具栏图标（工具栏按钮）、扩展菜单 |
| 32×32 | 工具栏图标（@2x 高分屏）、扩展管理页 |
| 48×48 | 扩展管理页面（chrome://extensions） |
| 128×128 | Chrome Web Store 列表、安装提示 |

## 实现方案

### 1. 扩展 `generate-icons.py` 增加 `--chrome` 模式

在现有脚本中添加 Chrome 扩展图标生成功能：

- 加载 `AIPulse.png`
- 调用 `content_bbox()` 裁剪出机器人本体
- 保持宽高比缩放到目标尺寸（16/32/48/128），取最长边适配
- 在方形画布中居中，输出 RGBA PNG
- 写入 `public/icons/icon-{16,32,48,128}.png`

### 2. 重建扩展并打包

```bash
npm run build          # 重建扩展 → dist/ + .output/
cd dist && zip -r ../ai-pulse-chrome-extension.zip .
```

## 涉及文件

| 文件 | 操作 |
|------|------|
| `mac-app/scripts/generate-icons.py` | **修改** — 增加 `--chrome` 选项 |
| `public/icons/icon-16.png` | **替换** — 新版机器人图标 |
| `public/icons/icon-32.png` | **替换** |
| `public/icons/icon-48.png` | **替换** |
| `public/icons/icon-128.png` | **替换** |
| `dist/icons/*` | **重建** — build 自动生成 |
| `.output/chrome-mv3/icons/*` | **重建** — build 自动生成 |

## 不变内容

- `manifest.json` — 文件名不变，无需修改
- `store-assets/` — 商店宣传图不在此次范围内
