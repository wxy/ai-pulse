import type { MessageRequest, MessageResponse } from '@/types';

type MessageHandler = (
  action: string,
  payload: unknown,
) => Promise<unknown>;

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

    // Return true to indicate async response
    return true;
  });
}

export async function sendMessage<T = unknown>(
  action: string,
  payload?: unknown,
): Promise<T> {
  const response: MessageResponse<T> = await chrome.runtime.sendMessage({
    action,
    payload,
  } as MessageRequest);

  if (!response.success) {
    throw new Error(response.error ?? 'Unknown error');
  }

  return response.data as T;
}
