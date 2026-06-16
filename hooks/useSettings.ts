import { useState, useEffect, useCallback } from 'react';
import type { GlobalSettings } from '@/types';
import { sendMessage } from '@/core/message-bus';

const DEFAULT_SETTINGS: GlobalSettings = {
  refreshIntervalMinutes: 60,
  theme: 'light',
  historyRetentionDays: 90,
};

export function useSettings() {
  const [settings, setSettingsState] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings on mount — read from storage directly
  useEffect(() => {
    chrome.storage.local.get('settings').then(result => {
      if (result.settings) {
        setSettingsState(result.settings);
      }
      setLoading(false);
    });
  }, []);

  const saveSettings = useCallback(async (updated: GlobalSettings) => {
    setSaving(true);
    try {
      await sendMessage('UPDATE_SETTINGS', updated);
      setSettingsState(updated);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
      const updated = { ...settings, [key]: value };
      saveSettings(updated);
    },
    [settings, saveSettings],
  );

  return { settings, loading, saving, saveSettings, updateSetting };
}
