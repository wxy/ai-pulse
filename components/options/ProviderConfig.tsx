import { useI18n } from '@/utils/i18n';
import React from 'react';
import type { Provider } from '@/types';
import { useProviderConfigs } from '@/hooks/useProviderStatus';
import ProviderIcon from '@/components/shared/ProviderIcon';
import ApiKeyManager from './ApiKeyManager';
import BalanceHistoryChart from './BalanceHistoryChart';

interface ProviderConfigProps {
  provider: Provider;
  onBack: () => void;
}

const ProviderConfig: React.FC<ProviderConfigProps> = ({ provider, onBack }) => {
  const { configs, saveConfig } = useProviderConfigs();
  const config = configs.find(c => c.providerId === provider.id);

  const handleSaveKey = async (key: string) => {
    await saveConfig({
      providerId: provider.id,
      enabled: config?.enabled !== false,
      apiKey: key,
      displayName: config?.displayName ?? '',
    });
    window.location.reload();
  };

  return (
    <div className="provider-config-page">
      <button className="back-button" onClick={onBack}>
        ← 返回服务商列表
      </button>

      <div className="provider-config-header">
        <ProviderIcon provider={provider} size={48} />
        <div>
          <h2>{provider.name}</h2>
          <p>{provider.company} · {provider.description}</p>
        </div>
      </div>

      <section className="config-section">
        <h3>显示名称</h3>
        <input
          type="text"
          className="text-input"
          value={config?.displayName ?? ''}
          placeholder={provider.name}
          onChange={e => {
            saveConfig({
              providerId: provider.id,
              enabled: config?.enabled !== false,
              apiKey: config?.apiKey ?? '',
              displayName: e.target.value,
            });
          }}
        />
      </section>

      {provider.capabilities.canFetchBalance && (
        <section className="config-section">
          <h3>API Key 配置</h3>
          <p className="section-desc">
            输入 API Key 以启用余额和用量监控。
            Key 仅存储在本地，不会发送到除 {provider.name} API 之外的任何地方。
          </p>
          <ApiKeyManager
            providerId={provider.id}
            currentKey={config?.apiKey ?? ''}
            provider={provider}
            onSave={handleSaveKey}
          />
        </section>
      )}

      {provider.capabilities.canFetchBalance && config?.apiKey && (
        <section className="config-section">
          <h3>余额预警</h3>
          <p className="section-desc">
            当余额低于预估日均消费时，扩展图标徽章变红并显示 ⚠ 标记。
            基于历史余额数据自动计算，无需手动设置阈值。
          </p>
          <label className="toggle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config?.alertEnabled !== false}
              onChange={() => {
                saveConfig({
                  providerId: provider.id,
                  enabled: config?.enabled !== false,
                  apiKey: config?.apiKey ?? '',
                  displayName: config?.displayName ?? '',
                  alertEnabled: !(config?.alertEnabled !== false),
                });
              }}
            />
            <span className="toggle-slider" />
            <span className="field-label" style={{ margin: 0, cursor: 'pointer' }}>
              {config?.alertEnabled !== false ? '已开启' : '已关闭'}
            </span>
          </label>
        </section>
      )}

      {!provider.capabilities.canFetchBalance && (
        <section className="config-section">
          <h3>仅状态监控</h3>
          <p className="section-desc">
            {provider.name} 未开放公开的余额 API，仅监控服务状态。
          </p>
          <span className="badge badge-info">仅状态</span>
        </section>
      )}

      <section className="config-section">
        <h3>链接</h3>
        <div className="provider-links">
          <a href={provider.baseUrl} target="_blank" rel="noopener noreferrer" className="btn btn-small">
            控制台 →
          </a>
          {provider.statusPageUrl && (
            <a href={provider.statusPageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-small">
              状态页 →
            </a>
          )}
        </div>
      </section>

      {provider.capabilities.canFetchBalance && config?.apiKey && (
        <section className="config-section">
          <BalanceHistoryChart providerId={provider.id} />
        </section>
      )}
    </div>
  );
};

export default ProviderConfig;
