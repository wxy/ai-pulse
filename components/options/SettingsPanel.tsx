import { useI18n } from '@/utils/i18n';
import React from 'react';
import { useSettings } from '@/hooks/useSettings';
import { getLanguage, setLanguage } from '@/utils/i18n';

const SettingsPanel: React.FC = () => {
  const { settings, loading, saving, updateSetting } = useSettings();

  if (loading) {
    return (
      <div className="settings-page">
        <h2>设置</h2>
        <div className="skeleton-list">
          <div className="skeleton-row" />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h2>设置</h2>
      <p className="section-desc">配置监控行为</p>

      <section className="config-section">
        <h3>刷新间隔</h3>
        <p className="section-desc">
          自动拉取余额和状态的时间间隔（需扩展保持运行）
        </p>
        <select
          className="select-input"
          value={settings.refreshIntervalMinutes}
          onChange={e => updateSetting('refreshIntervalMinutes', parseInt(e.target.value))}
          disabled={saving}
        >
          <option value={15}>每 15 分钟</option>
          <option value={30}>每 30 分钟</option>
          <option value={60}>每小时</option>
          <option value={120}>每 2 小时</option>
          <option value={360}>每 6 小时</option>
          <option value={720}>每 12 小时</option>
          <option value={1440}>每 24 小时</option>
        </select>
      </section>

      <section className="config-section">
        <h3>历史保留</h3>
        <p className="section-desc">
          余额历史快照保留多长时间？
        </p>
        <select
          className="select-input"
          value={settings.historyRetentionDays}
          onChange={e => updateSetting('historyRetentionDays', parseInt(e.target.value))}
          disabled={saving}
        >
          <option value={7}>7 天</option>
          <option value={30}>30 天</option>
          <option value={60}>60 天</option>
          <option value={90}>90 天</option>
          <option value={180}>180 天</option>
          <option value={365}>1 年</option>
        </select>
      </section>

      <section className="config-section">
        <h3>语言</h3>
        <select
          className="select-input"
          value={getLanguage()}
          onChange={e => {
            const lang = e.target.value as 'zh' | 'en';
            setLanguage(lang);
            window.location.reload();
          }}
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </section>

      <section className="config-section">
        <h3>主题</h3>
        <select
          className="select-input"
          value={settings.theme}
          onChange={e => updateSetting('theme', e.target.value as 'light' | 'dark')}
          disabled={saving}
        >
          <option value="dark">深色</option>
          <option value="light">浅色</option>
        </select>
      </section>

      {saving && <p className="saving-indicator">保存中...</p>}
    </div>
  );
};

export default SettingsPanel;
