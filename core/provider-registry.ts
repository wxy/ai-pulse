import type { Provider } from '@/types';
import { deepseekProvider } from '@/providers/deepseek';
import { moonshotProvider } from '@/providers/moonshot';
import { zhipuProvider } from '@/providers/zhipu';
import { baichuanProvider } from '@/providers/baichuan';
import { qwenProvider } from '@/providers/qwen';
import { ernieProvider } from '@/providers/ernie';

const registry = new Map<string, Provider>();

// Register all providers here — add one line to register a new provider
const providers: Provider[] = [
  deepseekProvider,
  moonshotProvider,
  zhipuProvider,
  baichuanProvider,
  qwenProvider,
  ernieProvider,
];

for (const provider of providers) {
  registry.set(provider.id, provider);
}

export function getProvider(id: string): Provider | undefined {
  return registry.get(id);
}

export function getAllProviders(): Provider[] {
  return Array.from(registry.values());
}

export function getProvidersByIds(ids: string[]): Provider[] {
  return ids.map(id => registry.get(id)).filter(Boolean) as Provider[];
}
