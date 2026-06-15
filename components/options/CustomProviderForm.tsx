import React, { useState } from 'react';
import type { Provider } from '@/types';
import { registerCustomProvider } from '@/core/provider-registry';
import { t } from '@/utils/i18n';

interface CustomProviderFormProps {
  onDone: () => void;
}

const CustomProviderForm: React.FC<CustomProviderFormProps> = ({ onDone }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [balanceUrl, setBalanceUrl] = useState('');
  const [statusUrl, setStatusUrl] = useState('');
  const [icon, setIcon] = useState('🔧');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError('请输入服务名称'); return; }
    if (!statusUrl.trim()) { setError('请输入状态检查 URL'); return; }

    setSaving(true);
    try {
      const id = 'custom-' + name.trim().toLowerCase().replace(/\s+/g, '-');
      const provider: Provider = {
        id,
        name: name.trim(),
        company: company.trim() || name.trim(),
        description: '自定义服务商',
        icon,
        baseUrl: '',
        capabilities: {
          canFetchBalance: Boolean(balanceUrl.trim()),
          canFetchStatus: Boolean(statusUrl.trim()),
        },
      };

      if (balanceUrl.trim()) {
        provider.fetchBalance = async (apiKey: string) => {
          const res = await fetch(balanceUrl.trim(), {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          if (!res.ok) {
            return { success: false, balances: [], rawTimestamp: Date.now(), error: `HTTP ${res.status}` };
          }
          const json = await res.json();
          // Try common balance response patterns
          const amount = json?.balance ?? json?.total_balance ?? json?.data?.balance ?? 0;
          return {
            success: true,
            balances: [{ currency: 'CNY', totalBalance: parseFloat(amount), grantedBalance: 0, toppedUpBalance: 0 }],
            rawTimestamp: Date.now(),
          };
        };
      }

      if (statusUrl.trim()) {
        provider.fetchStatus = async () => {
          try {
            const res = await fetch(statusUrl.trim());
            const isAvailable = res.status < 500;
            return {
              success: true,
              isAvailable,
              statusMessage: isAvailable ? t('status.running') : `${t('status.error')} (HTTP ${res.status})`,
              rawTimestamp: Date.now(),
            };
          } catch {
            return {
              success: false,
              isAvailable: false,
              statusMessage: t('status.unreachable'),
              rawTimestamp: Date.now(),
            };
          }
        };
        provider.validateApiKey = (key: string) => key.length >= 10;
      }

      registerCustomProvider(provider);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="custom-provider-form">
      <h3>添加自定义服务商</h3>
      <p className="section-desc">输入服务商信息，可自定义余额和状态检查 API</p>

      <div className="form-group">
        <label className="field-label">服务名称 *</label>
        <input className="text-input" value={name} onChange={e => setName(e.target.value)} placeholder="例如：My AI Service" />
      </div>

      <div className="form-group">
        <label className="field-label">公司名称</label>
        <input className="text-input" value={company} onChange={e => setCompany(e.target.value)} placeholder="可选" />
      </div>

      <div className="form-group">
        <label className="field-label">图标 Emoji</label>
        <input className="text-input" value={icon} onChange={e => setIcon(e.target.value)} placeholder="🔧" maxLength={4} style={{ width: 80 }} />
      </div>

      <div className="form-group">
        <label className="field-label">余额 API URL</label>
        <input className="text-input" value={balanceUrl} onChange={e => setBalanceUrl(e.target.value)} placeholder="https://api.example.com/v1/balance" style={{ maxWidth: '100%' }} />
        <p className="field-hint">返回 JSON 中包含 balance 或 total_balance 字段</p>
      </div>

      <div className="form-group">
        <label className="field-label">状态检查 URL *</label>
        <input className="text-input" value={statusUrl} onChange={e => setStatusUrl(e.target.value)} placeholder="https://api.example.com/v1/models" style={{ maxWidth: '100%' }} />
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '添加服务商'}
        </button>
        <button className="btn btn-small" onClick={onDone}>取消</button>
      </div>
    </div>
  );
};

export default CustomProviderForm;
