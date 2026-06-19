import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  publicDir: 'public',

  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    version: '0.3.0',
    default_locale: 'en',
    permissions: [
      'storage',
      'alarms',
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
