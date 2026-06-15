import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { getLanguage, setLanguage } from '@/utils/i18n';
import { t } from '@/utils/i18n';

const SettingsPanel: React.FC = () => {
  const { settings, loading, saving, updateSetting } = useSettings();

  if (loading) {
    return <div className="settings-page"><h2>{t('settings.title')}</h2><div className="skeleton-list"><div className="skeleton-row" /></div></div>;
  }

  return (
    <div className="settings-page">
      <h2>{t('settings.title')}</h2>
      <p className="section-desc">{t('settings.desc')}</p>

      <section className="config-section">
        <h3>{t('settings.refresh_interval')}</h3>
        <p className="section-desc">{t('settings.refresh_desc')}</p>
        <select className="select-input" value={settings.refreshIntervalMinutes} onChange={e => updateSetting('refreshIntervalMinutes', parseInt(e.target.value))} disabled={saving}>
          <option value={15}>{t('interval.15min')}</option>
          <option value={30}>{t('interval.30min')}</option>
          <option value={60}>{t('interval.1hour')}</option>
          <option value={120}>{t('interval.2hours')}</option>
          <option value={360}>{t('interval.6hours')}</option>
          <option value={720}>{t('interval.12hours')}</option>
          <option value={1440}>{t('interval.24hours')}</option>
        </select>
      </section>

      <section className="config-section">
        <h3>{t('settings.history_retention_title')}</h3>
        <p className="section-desc">{t('settings.history_desc')}</p>
        <select className="select-input" value={settings.historyRetentionDays} onChange={e => updateSetting('historyRetentionDays', parseInt(e.target.value))} disabled={saving}>
          <option value={7}>{t('retention.7days')}</option>
          <option value={30}>{t('retention.30days')}</option>
          <option value={60}>{t('retention.60days')}</option>
          <option value={90}>{t('retention.90days')}</option>
          <option value={180}>{t('retention.180days')}</option>
          <option value={365}>{t('retention.1year')}</option>
        </select>
      </section>

      <section className="config-section">
        <h3>{t('settings.language')}</h3>
        <select className="select-input" value={getLanguage()} onChange={e => { setLanguage(e.target.value as 'zh' | 'en'); window.location.reload(); }}>
          <option value="zh">{t('settings.language_zh')}</option>
          <option value="en">{t('settings.language_en')}</option>
        </select>
      </section>

      <section className="config-section">
        <h3>{t('settings.theme')}</h3>
        <select className="select-input" value={settings.theme} onChange={e => updateSetting('theme', e.target.value as 'light' | 'dark')} disabled={saving}>
          <option value="dark">{t('settings.theme_dark')}</option>
          <option value="light">{t('settings.theme_light')}</option>
        </select>
      </section>

      {saving && <p className="saving-indicator">{t('settings.saving')}</p>}
    </div>
  );
};

export default SettingsPanel;
