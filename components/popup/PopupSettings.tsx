import React, { useState } from 'react';
import type { ProviderSummary } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { getProviderConfigs } from '@/core/storage';
import { getLanguage, setLanguage } from '@/utils/i18n';
import { t } from '@/utils/i18n';
import { sendMessage } from '@/core/message-bus';

interface PopupSettingsProps { providers: ProviderSummary[]; }

const PopupSettings: React.FC<PopupSettingsProps> = ({ providers }) => {
  const { settings, saving, updateSetting } = useSettings();
  const [showDisabled, setShowDisabled] = useState(false);
  const disabledProviders = providers.filter(p => p.config?.enabled === false);

  const handleToggleProvider = async (providerId: string) => {
    const configs = await getProviderConfigs();
    const config = configs.find(c => c.providerId === providerId);
    if (config) {
      await sendMessage('UPDATE_PROVIDER_CONFIG', { ...config, enabled: true });
    }
  };

  return (
    <div className="popup-settings">
      <section className="settings-group">
        <label className="settings-label">{t('settings.refresh_interval')}</label>
        <select className="settings-select" value={settings.refreshIntervalMinutes}
          onChange={e => updateSetting('refreshIntervalMinutes', parseInt(e.target.value))} disabled={saving}>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={60}>1 h</option>
          <option value={120}>2 h</option>
          <option value={360}>6 h</option>
          <option value={720}>12 h</option>
          <option value={1440}>24 h</option>
        </select>
      </section>

      <section className="settings-group">
        <label className="settings-label">{t('settings.theme')}</label>
        <select className="settings-select" value={settings.theme}
          onChange={e => updateSetting('theme', e.target.value as 'light' | 'dark')} disabled={saving}>
          <option value="dark">{t('settings.theme_dark')}</option>
          <option value="light">{t('settings.theme_light')}</option>
        </select>
      </section>

      <section className="settings-group">
        <label className="settings-label">{t('settings.language')}</label>
        <select className="settings-select" value={getLanguage()}
          onChange={e => { setLanguage(e.target.value as 'zh' | 'en'); window.location.reload(); }}>
          <option value="zh">{t('settings.language_zh')}</option>
          <option value="en">{t('settings.language_en')}</option>
        </select>
      </section>

      {disabledProviders.length > 0 && (
        <section className="settings-group">
          <button className="settings-toggle" onClick={() => setShowDisabled(!showDisabled)}>
            {showDisabled ? '▾' : '▸'} {t('nav.providers')} ({disabledProviders.length})
          </button>
          {showDisabled && (
            <div className="disabled-list">
              {disabledProviders.map(p => (
                <div key={p.provider.id} className="disabled-row">
                  <span>{p.provider.icon} {p.config?.displayName || p.provider.name}</span>
                  <button className="btn-small-enable" onClick={() => handleToggleProvider(p.provider.id)}>
                    {t('providers.configured')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PopupSettings;
