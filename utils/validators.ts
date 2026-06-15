/**
 * Validate a DeepSeek API key format.
 * DeepSeek keys: sk- followed by alphanumeric characters (min 20 chars after prefix).
 */
export function validateDeepSeekKey(key: string): boolean {
  return /^sk-[a-zA-Z0-9]{20,}$/.test(key);
}

/**
 * Validate a generic Bearer token format.
 */
export function validateBearerToken(key: string): boolean {
  return key.length >= 20 && /^[a-zA-Z0-9_.-]+$/.test(key);
}

/**
 * Check if a string is a non-empty API key.
 */
export function isNonEmptyKey(key: string): boolean {
  return key.trim().length > 0;
}
