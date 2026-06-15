import React, { useState } from 'react';
import { t } from '@/utils/i18n';
import type { Provider } from '@/types';
import { useProviderConfigs } from '@/hooks/useProviderStatus';
import { getCustomProviders, removeCustomProvider } from '@/core/provider-registry';
import ProviderIcon from '@/components/shared/ProviderIcon';
import CustomProviderForm from './CustomProviderForm';

interface ProviderListProps {
  onSelect: (provider: Provider) => void;
}

const ProviderList: React.FC<ProviderListProps> = ({ onSelect }) => {
  const { configs, loading, providers, saveConfig, reload } = useProviderConfigs();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProviders, setCustomProviders] = useState<Provider[]>(getCustomProviders());
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="provider-list-page">
        <h2>服务商</h2>
        <div className="skeleton-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="provider-list-page">
      <h2>服务商</h2>
      <p className="section-desc">管理您的 AI 服务商连接</p>

      <div className="provider-config-list">
        {providers.map(provider => {
          const config = configs.find(c => c.providerId === provider.id);
          const isEnabled = config?.enabled !== false;
          const hasKey = Boolean(config?.apiKey);

          return (
            <div
              key={provider.id}
              className={`provider-config-row ${isEnabled ? '' : 'provider-row-disabled'}`}
            >
              <div className="provider-row-main">
                <div className="provider-row-info">
                  <ProviderIcon provider={provider} size={32} />
                  <div>
                    <h3>{config?.displayName || provider.name}</h3>
                    <p className="row-desc">{provider.company}</p>
                  </div>
                </div>
                <div className="provider-row-actions">
                  {provider.capabilities.canFetchBalance && (
                    <span className={`key-status ${hasKey ? 'key-configured' : 'key-missing'}`}>
                      {hasKey ? '🔑 已配置' : '🔓 未配置'}
                    </span>
                  )}
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {
                        saveConfig({
                          providerId: provider.id,
                          enabled: !isEnabled,
                          apiKey: config?.apiKey ?? '',
                          displayName: config?.displayName ?? '',
                        });
                      }}
                    />
                    <span className="toggle-slider" />
                  </label>
                  <button
                    className="btn btn-small"
                    onClick={() => onSelect(provider)}
                  >
                    配置 →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Custom providers */}
        {customProviders.map(provider => (
          <div key={provider.id} className="provider-config-row">
            <div className="provider-row-main">
              <div className="provider-row-info">
                <ProviderIcon provider={provider} size={32} />
                <div>
                  <h3>{provider.name}</h3>
                  <p className="row-desc">{provider.company} · 自定义</p>
                </div>
              </div>
              <div className="provider-row-actions">
                <button className="btn btn-small" onClick={() => onSelect(provider)}>配置 →</button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    removeCustomProvider(provider.id);
                    setCustomProviders(getCustomProviders());
                    setRefreshKey(k => k + 1);
                    reload();
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCustomForm ? (
        <CustomProviderForm
          onDone={() => {
            setShowCustomForm(false);
            setCustomProviders(getCustomProviders());
            setRefreshKey(k => k + 1);
            reload();
          }}
        />
      ) : (
        <button
          className="btn btn-small"
          style={{ marginTop: 12 }}
          onClick={() => setShowCustomForm(true)}
        >
          + 添加自定义服务商
        </button>
      )}
    </div>
  );
};

export default ProviderList;
