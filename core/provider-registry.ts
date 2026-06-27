import type { Provider } from '@/types';
import { deepseekProvider } from '@/providers/deepseek';
import { moonshotProvider } from '@/providers/moonshot';
import { zhipuProvider } from '@/providers/zhipu';
import { baichuanProvider } from '@/providers/baichuan';
import { qwenProvider } from '@/providers/qwen';
import { ernieProvider } from '@/providers/ernie';
import { openaiProvider } from '@/providers/openai';
import { anthropicProvider } from '@/providers/anthropic';
import { googleProvider } from '@/providers/google';
import { mistralProvider } from '@/providers/mistral';
import { cohereProvider } from '@/providers/cohere';
import { xaiProvider } from '@/providers/xai';
import { perplexityProvider } from '@/providers/perplexity';

const registry = new Map<string, Provider>();

const builtinProviders: Provider[] = [
  deepseekProvider,
  moonshotProvider,
  zhipuProvider,
  baichuanProvider,
  qwenProvider,
  ernieProvider,
  openaiProvider,
  anthropicProvider,
  googleProvider,
  mistralProvider,
  cohereProvider,
  xaiProvider,
  perplexityProvider,
];

// Tag popular providers (shown by default, others hidden behind "Show more").
// Only providers with balance APIs are popular by default.
const popularIds = new Set(['deepseek', 'moonshot', 'openai', 'zhipu']);
for (const p of builtinProviders) {
  p.popular = popularIds.has(p.id) || p.popular === true;
}

for (const p of builtinProviders) {
  registry.set(p.id, p);
}

/** Load custom providers from storage — call once at startup */
export async function initCustomProviders(): Promise<void> {
  const result = await chrome.storage.local.get('custom_providers');
  const custom: Provider[] = result.custom_providers ?? [];
  for (const p of custom) {
    if (!registry.has(p.id)) {
      registry.set(p.id, p);
    }
  }
}

export function registerCustomProvider(provider: Provider): void {
  registry.set(provider.id, provider);
  saveCustomProviders();
}

export function removeCustomProvider(id: string): void {
  registry.delete(id);
  saveCustomProviders();
}

function saveCustomProviders(): void {
  const builtinIds = new Set(builtinProviders.map(p => p.id));
  const custom = Array.from(registry.values()).filter(p => !builtinIds.has(p.id));
  chrome.storage.local.set({ custom_providers: custom });
}

export function getCustomProviders(): Provider[] {
  const builtinIds = new Set(builtinProviders.map(p => p.id));
  return Array.from(registry.values()).filter(p => !builtinIds.has(p.id));
}

export function getProvider(id: string): Provider | undefined {
  return registry.get(id);
}

export function getAllProviders(): Provider[] {
  return Array.from(registry.values());
}

export function getBuiltinProviders(): Provider[] {
  return [...builtinProviders];
}
