import React, { useState } from 'react';
import type { Provider } from '@/types';
import { registerCustomProvider } from '@/core/provider-registry';
import { t } from '@/utils/i18n';

interface CustomProviderFormProps { onDone: () => void; }

const CustomProviderForm: React.FC<CustomProviderFormProps> = ({ onDone }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [balanceUrl, setBalanceUrl] = useState('');
  const [statusUrl, setStatusUrl] = useState('');
  const [icon, setIcon] = useState('🔧');
  const [balanceType, setBalanceType] = useState<'prepaid' | 'usage' | 'quota'>('prepaid');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) { setError(t('custom.error_name')); return; }
    if (!statusUrl.trim()) { setError(t('custom.error_url')); return; }
    setSaving(true);
    try {
      const id = 'custom-' + name.trim().toLowerCase().replace(/\s+/g, '-');
      const provider: Provider = {
        id, name: name.trim(), company: company.trim() || name.trim(), description: t('custom.custom_label'), icon,
        baseUrl: '',
        capabilities: { canFetchBalance: Boolean(balanceUrl.trim()), canFetchStatus: Boolean(statusUrl.trim()) },
        balanceType,
      };
      if (balanceUrl.trim()) {
        provider.fetchBalance = async (apiKey: string) => {
          const res = await fetch(balanceUrl.trim(), { headers: { Authorization: `Bearer ${apiKey}` } });
          if (!res.ok) return { success: false, balances: [], rawTimestamp: Date.now(), error: `HTTP ${res.status}` };
          const json = await res.json();
          const amount = json?.balance ?? json?.total_balance ?? json?.data?.balance ?? 0;
          return { success: true, balances: [{ currency: 'CNY', totalBalance: parseFloat(amount), grantedBalance: 0, toppedUpBalance: 0 }], rawTimestamp: Date.now() };
        };
      }
      if (statusUrl.trim()) {
        provider.fetchStatus = async () => {
          try {
            const res = await fetch(statusUrl.trim());
            const isAvailable = res.status < 500;
            return { success: true, isAvailable, statusMessage: isAvailable ? t('status.running') : `${t('status.error')} (HTTP ${res.status})`, rawTimestamp: Date.now() };
          } catch {
            return { success: false, isAvailable: false, statusMessage: t('status.unreachable'), rawTimestamp: Date.now() };
          }
        };
        provider.validateApiKey = (key: string) => key.length >= 10;
      }
      registerCustomProvider(provider);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('custom.error_save'));
    } finally { setSaving(false); }
  };

  return (
    <div className="custom-provider-form">
      <h3>{t('custom.title')}</h3>
      <p className="section-desc">{t('custom.desc')}</p>
      <div className="form-group"><label className="field-label">{t('custom.name')}</label><input className="text-input" value={name} onChange={e => setName(e.target.value)} placeholder="My AI Service" /></div>
      <div className="form-group"><label className="field-label">{t('custom.company')}</label><input className="text-input" value={company} onChange={e => setCompany(e.target.value)} /></div>
      <div className="form-group"><label className="field-label">{t('custom.icon')}</label><input className="text-input" value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} style={{ width: 80 }} /></div>
      <div className="form-group"><label className="field-label">{t('custom.balance_url')}</label><input className="text-input" value={balanceUrl} onChange={e => setBalanceUrl(e.target.value)} placeholder="https://api.example.com/v1/balance" style={{ maxWidth: '100%' }} /><p className="field-hint">{t('custom.balance_hint')}</p></div>
      {balanceUrl.trim() && (
        <div className="form-group"><label className="field-label">{t('custom.balance_type')}</label>
          <select className="text-input" value={balanceType} onChange={e => setBalanceType(e.target.value as any)}>
            <option value="prepaid">{t('custom.type_prepaid')}</option>
            <option value="usage">{t('custom.type_usage')}</option>
            <option value="quota">{t('custom.type_quota')}</option>
          </select>
        </div>
      )}
      <div className="form-group"><label className="field-label">{t('custom.status_url')}</label><input className="text-input" value={statusUrl} onChange={e => setStatusUrl(e.target.value)} placeholder="https://api.example.com/v1/models" style={{ maxWidth: '100%' }} /></div>
      {error && <p className="field-error">{error}</p>}
      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('custom.saving') : t('custom.save')}</button>
        <button className="btn btn-small" onClick={onDone}>{t('custom.cancel')}</button>
      </div>
    </div>
  );
};

export default CustomProviderForm;
