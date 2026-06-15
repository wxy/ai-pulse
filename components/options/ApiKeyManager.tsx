import React, { useState } from 'react';
import type { Provider } from '@/types';
import { t } from '@/utils/i18n';

interface ApiKeyManagerProps { providerId: string; currentKey: string; provider: Provider; onSave: (key: string) => void; }

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ providerId, currentKey, provider, onSave }) => {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (key && provider.validateApiKey && !provider.validateApiKey(key)) {
      setError(t('apikey.invalid')); return;
    }
    setSaving(true);
    try { await onSave(key); } catch (err) {
      setError(err instanceof Error ? err.message : t('apikey.save_failed'));
    } finally { setSaving(false); }
  };

  return (
    <div className="api-key-manager">
      <label className="field-label">API Key</label>
      <div className="api-key-input-group">
        <input id={`apikey-${providerId}`} type={showKey ? 'text' : 'password'} value={key}
          onChange={e => setKey(e.target.value)} placeholder={currentKey ? '••••••••' : t('apikey.placeholder')} className="api-key-input" />
        <button className="toggle-visibility" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
          {showKey ? '🙈' : '👁️'}
        </button>
      </div>
      <div className="api-key-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || key === currentKey}>
          {saving ? t('apikey.saving') : t('apikey.save')}
        </button>
        {currentKey && <button className="btn btn-danger" onClick={() => { setKey(''); setError(null); }}>{t('apikey.remove')}</button>}
      </div>
      {error && <p className="field-error">{error}</p>}
      <p className="field-hint">{t('apikey.format_hint')}：{provider.id === 'deepseek' ? 'sk-xxxxxxxxxxxxxxxx' : t('apikey.check_docs')}</p>
    </div>
  );
};

export default ApiKeyManager;
