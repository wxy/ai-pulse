import type { MessageRequest, MessageResponse } from '@/types';

type MessageHandler = (action: string, payload: unknown) => Promise<unknown>;

let handler: MessageHandler | null = null;

export function registerMessageHandler(h: MessageHandler): void {
  handler = h;
}

export function startMessageListener(): void {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (!handler) {
      sendResponse({ success: false, error: 'No message handler registered' });
      return true;
    }

    const req = request as MessageRequest;
    handler(req.action, req.payload)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }));

    return true;
  });
}

/**
 * Send a message to the background service worker with retry.
 * MV3 SW can be terminated at any time — if the connection fails, wait for it to restart.
 */
export async function sendMessage<T = unknown>(
  action: string,
  payload?: unknown,
): Promise<T> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response: MessageResponse<T> = await chrome.runtime.sendMessage({
        action,
        payload,
      } as MessageRequest);

      if (!response.success) {
        throw new Error(response.error ?? 'Unknown error');
      }

      return response.data as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // "Could not establish connection" means SW is not running yet — wait and retry
      if (lastError.message.includes('Could not establish connection') ||
          lastError.message.includes('receiving end does not exist')) {
        // Exponential backoff: 200ms, 400ms, 800ms
        await new Promise(r => setTimeout(r, 200 * Math.pow(2, i)));
        continue;
      }
      // Other errors — don't retry
      throw lastError;
    }
  }

  throw lastError ?? new Error('sendMessage failed');
}
