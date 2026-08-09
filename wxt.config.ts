import { defineConfig } from 'wxt';
import pkg from './package.json';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  outDir: 'dist',
  publicDir: 'public',

  vite: () => ({
    build: {
      // 关闭 modulepreload：扩展页面里 Chrome 会因跨 world 缓存检查跳过预加载并刷警告，
      // 禁用后资源仍会按需加载，只是不再生成 <link rel="modulepreload">
      modulePreload: false,
    },
  }),

  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    version: pkg.version,
    default_locale: 'en',
    permissions: [
      'storage',
      'alarms',
      'notifications',
    ],
    host_permissions: [
      'https://*/*',
    ],
    action: {
      default_title: '__MSG_extActionTitle__',
      default_popup: 'popup/index.html',
    },
    options_ui: {
      page: 'options/index.html',
      open_in_tab: true,
    },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
});
