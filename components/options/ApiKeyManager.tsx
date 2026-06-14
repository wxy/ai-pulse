import { useI18n } from '@/utils/i18n';
import React, { useState } from 'react';
import type { Provider } from '@/types';

interface ApiKeyManagerProps {
  providerId: string;
  currentKey: string;
  provider: Provider;
  onSave: (key: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ providerId, currentKey, provider, onSave }) => {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);

    if (key && provider.validateApiKey) {
      if (!provider.validateApiKey(key)) {
        setError('API Key 格式不正确');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(key);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setKey('');
    setError(null);
  };

  return (
    <div className="api-key-manager">
      <label className="field-label" htmlFor={`apikey-${providerId}`}>
        API Key
      </label>
      <div className="api-key-input-group">
        <input
          id={`apikey-${providerId}`}
          type={showKey ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder={currentKey ? '••••••••' : '请输入 API Key（sk- 开头）'}
          className="api-key-input"
        />
        <button
          className="toggle-visibility"
          onClick={() => setShowKey(!showKey)}
          title={showKey ? '隐藏' : '显示'}
        >
          {showKey ? '🙈' : '👁️'}
        </button>
      </div>
      <div className="api-key-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || key === currentKey}
        >
          {saving ? '保存中...' : '保存'}
        </button>
        {currentKey && (
          <button className="btn btn-danger" onClick={handleClear}>
            移除 Key
          </button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
      {provider && (
        <p className="field-hint">
          Key 格式：{provider.id === 'deepseek' ? 'sk-xxxxxxxxxxxxxxxx' : '请参考服务商文档'}
        </p>
      )}
    </div>
  );
};

export default ApiKeyManager;
