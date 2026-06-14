import { useState, useEffect, useCallback } from 'react';
import type { ProviderConfig } from '@/types';
import { sendMessage } from '@/core/message-bus';
import { getAllProviders } from '@/core/provider-registry';

interface ProviderConfigState {
  configs: ProviderConfig[];
  loading: boolean;
}

export function useProviderConfigs() {
  const [state, setState] = useState<ProviderConfigState>({ configs: [], loading: true });

  const loadConfigs = useCallback(async () => {
    const result = await chrome.storage.local.get('provider_configs');
    setState({ configs: result.provider_configs ?? [], loading: false });
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const saveConfig = useCallback(async (config: ProviderConfig) => {
    await sendMessage('UPDATE_PROVIDER_CONFIG', config);
    // Reload configs after save
    await loadConfigs();
  }, [loadConfigs]);

  const deleteConfig = useCallback(async (providerId: string) => {
    await sendMessage('DELETE_PROVIDER_CONFIG', providerId);
    await loadConfigs();
  }, [loadConfigs]);

  return {
    configs: state.configs,
    loading: state.loading,
    providers: getAllProviders(),
    saveConfig,
    deleteConfig,
    reload: loadConfigs,
  };
}
