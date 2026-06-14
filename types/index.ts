// ============================================================
// Provider Identity & Capability
// ============================================================

/** Each currency entry within a balance response */
export interface BalanceEntry {
  currency: string;          // "CNY", "tokens", "USD"
  totalBalance: number;      // Total available balance in that currency
  grantedBalance: number;    // Free/granted amount (0 if N/A)
  toppedUpBalance: number;   // User top-up amount (0 if N/A)
}

/** Result of a balance fetch operation */
export interface BalanceResult {
  success: boolean;
  balances: BalanceEntry[];
  rawTimestamp: number;      // epoch ms of when the fetch completed
  error?: string;            // Error message if success=false
}

/** Result of a status/health check operation */
export interface StatusResult {
  success: boolean;
  isAvailable: boolean;      // Is the service operational?
  statusMessage: string;     // Human-readable status line
  rawTimestamp: number;
  error?: string;
}

/** What capabilities a provider has */
export interface ProviderCapabilities {
  canFetchBalance: boolean;  // Has a public balance API
  canFetchStatus: boolean;   // Has a publicly-accessible health endpoint
}

// ============================================================
// Provider Interface (the plugin contract)
// ============================================================

export interface Provider {
  // Identity
  id: string;                    // Unique slug: "deepseek", "moonshot", "zhipu"
  name: string;                  // Display name
  company: string;               // Company name: "深度求索 DeepSeek"
  description: string;           // Short description for the options page
  icon: string;                  // Fallback emoji
  faviconUrl?: string;           // Official favicon URL
  baseUrl: string;               // Homepage or console URL for the provider
  statusPageUrl?: string;        // Public status page URL

  // Capability declaration
  capabilities: ProviderCapabilities;

  // API Methods (optional — guarded by capabilities)
  fetchBalance?(apiKey: string): Promise<BalanceResult>;
  fetchStatus?(): Promise<StatusResult>;
  validateApiKey?(apiKey: string): boolean;
}

// ============================================================
// User Configuration (stored per provider)
// ============================================================

export interface ProviderConfig {
  providerId: string;        // References Provider.id
  enabled: boolean;          // User can disable a provider
  apiKey: string;            // Empty string = no key configured
  displayName: string;       // User-customizable display name override
}

// ============================================================
// Balance & Status Cache (stored in chrome.storage)
// ============================================================

export interface BalanceCacheEntry {
  providerId: string;
  lastFetchTimestamp: number;    // epoch ms
  lastSuccessTimestamp: number;  // epoch ms of last successful fetch (0 if never)
  result: BalanceResult | null;  // null if never fetched
}

export interface StatusCacheEntry {
  providerId: string;
  lastFetchTimestamp: number;
  lastSuccessTimestamp: number;
  result: StatusResult | null;
}

// ============================================================
// Balance History (time-series data for charts)
// ============================================================

export interface BalanceSnapshot {
  timestamp: number;         // epoch ms
  balances: BalanceEntry[];  // Snapshot of balances at this point in time
}

export interface BalanceHistory {
  providerId: string;
  snapshots: BalanceSnapshot[];  // Ordered oldest-first
}

// ============================================================
// Global Settings
// ============================================================

export interface GlobalSettings {
  refreshIntervalMinutes: number; // How often background fetches (default 60)
  theme: 'light' | 'dark';       // UI theme
  historyRetentionDays: number;  // How long to keep balance snapshots (default 90)
}

// ============================================================
// Message Bus Protocol
// ============================================================

export type MessageAction =
  | 'FETCH_BALANCE'
  | 'FETCH_STATUS'
  | 'GET_PROVIDER_STATE'
  | 'UPDATE_PROVIDER_CONFIG'
  | 'DELETE_PROVIDER_CONFIG'
  | 'UPDATE_SETTINGS'
  | 'GET_BALANCE_HISTORY'
  | 'GET_STATUS_HISTORY';

export interface MessageRequest {
  action: MessageAction;
  payload?: unknown;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// Popup UI Aggregate State
// ============================================================

export interface ProviderSummary {
  provider: Provider;                  // Static provider definition
  config: ProviderConfig | null;       // User config (null if never configured)
  balanceCache: BalanceCacheEntry | null;
  statusCache: StatusCacheEntry | null;
  trend: 'up' | 'down' | 'flat' | 'unknown';
}
