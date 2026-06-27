import React, { useState } from 'react';
import type { ProviderSummary } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { getProviderConfigs } from '@/core/storage';
import { getLanguage, setLanguage } from '@/utils/i18n';
import { t } from '@/utils/i18n';
import { sendMessage } from '@/core/message-bus';
import CustomProviderForm from '@/components/options/CustomProviderForm';

interface PopupSettingsProps { providers: ProviderSummary[]; onRefresh: () => void; onSync: () => void; onReEnable: () => void; }

const PopupSettings: React.FC<PopupSettingsProps> = ({ providers, onRefresh, onSync, onReEnable }) => {
  const { settings, saving, updateSetting } = useSettings();
  const [showDisabled, setShowDisabled] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [enablingIds, setEnablingIds] = useState<Set<string>>(new Set());
  const disabledProviders = providers.filter(p =>
    p.config?.enabled === false && !enablingIds.has(p.provider.id)
  );

  const handleToggleProvider = async (providerId: string) => {
    setEnablingIds(prev => new Set(prev).add(providerId)); // Optimistic remove
    const configs = await getProviderConfigs();
    const config = configs.find(c => c.providerId === providerId);
    // Create config if it doesn't exist yet (e.g. first install for non-popular providers)
    await sendMessage('UPDATE_PROVIDER_CONFIG', config
      ? { ...config, enabled: true }
      : { providerId, enabled: true, apiKey: '', displayName: '', alertEnabled: false });
    onReEnable();
    onSync();
  };

  return (
    <div className="popup-settings">
      <section className="settings-group">
        <label className="settings-label">{t('settings.refresh_interval')}</label>
        <select className="settings-select" value={settings.refreshIntervalMinutes}
          onChange={e => updateSetting('refreshIntervalMinutes', parseInt(e.target.value))} disabled={saving}>
          <option value={15}>{t('interval.15min')}</option>
          <option value={30}>{t('interval.30min')}</option>
          <option value={60}>{t('interval.1hour')}</option>
          <option value={120}>{t('interval.2hours')}</option>
          <option value={360}>{t('interval.6hours')}</option>
          <option value={720}>{t('interval.12hours')}</option>
          <option value={1440}>{t('interval.24hours')}</option>
        </select>
      </section>

      <section className="settings-group">
        <label className="settings-label">🔔 {t('settings.sound')}</label>
        <select className="settings-select" value={settings.soundEnabled !== false ? 'on' : 'off'}
          onChange={e => updateSetting('soundEnabled', e.target.value === 'on')} disabled={saving}>
          <option value="on">{t('settings.sound_on')}</option>
          <option value="off">{t('settings.sound_off')}</option>
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

      <section className="settings-group">
        <button className="settings-toggle" onClick={() => setShowDisabled(!showDisabled)}>
          {showDisabled ? '▾' : '▸'} {t('settings.disabled_providers')} ({disabledProviders.length})
        </button>
        {showDisabled && (
          <div className="disabled-list">
            {disabledProviders.length === 0 ? (
              <p className="field-hint">{t('settings.none')}</p>
            ) : (
              disabledProviders.map(p => (
                <div key={p.provider.id} className="disabled-row">
                  <span>{p.provider.icon} {p.config?.displayName || p.provider.name}</span>
                  <span className="capability-icons">
                    {p.provider.capabilities.canFetchBalance && <span title={t('config.api_key')}>🔑</span>}
                    {p.provider.capabilities.canFetchStatus && <span title={t('config.status_page')}>💡</span>}
                  </span>
                  <button className="btn-small-enable" onClick={() => handleToggleProvider(p.provider.id)}>
                    {t('settings.enable')}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {showCustomForm ? (
        <CustomProviderForm onDone={() => { setShowCustomForm(false); onRefresh(); }} />
      ) : (
        <button className="btn btn-small" style={{ marginTop: 8, width: '100%' }}
          onClick={() => setShowCustomForm(true)}>
          + {t('providers.add_custom')}
        </button>
      )}

      <div className="about-note">
        <p>{t('about.title')} v0.4.1</p>
        <p>{t('about.desc')}</p>
        <p>{t('about.supported')}</p>
      </div>
    </div>
  );
};

export default PopupSettings;
