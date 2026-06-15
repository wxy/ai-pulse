import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock chrome API for testing
const chromeStorage: Record<string, any> = {};

(globalThis as any).chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[] | null) => {
        const result: Record<string, any> = {};
        if (typeof keys === 'string') {
          result[keys] = chromeStorage[keys] ?? null;
        } else if (Array.isArray(keys)) {
          for (const key of keys) result[key] = chromeStorage[key] ?? null;
        } else {
          Object.assign(result, chromeStorage);
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.assign(chromeStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[]) => {
        const keyList = typeof keys === 'string' ? [keys] : keys;
        for (const key of keyList) delete chromeStorage[key];
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    openOptionsPage: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    setTitle: vi.fn(),
  },
  i18n: {
    getUILanguage: vi.fn().mockReturnValue('zh-CN'),
  },
};

// Reset storage between tests
beforeEach(() => {
  Object.keys(chromeStorage).forEach(k => delete chromeStorage[k]);
  vi.clearAllMocks();
});

// Reset chromeStorage reference for clean tests
export function getChromeStorage(): Record<string, any> {
  return chromeStorage;
}
