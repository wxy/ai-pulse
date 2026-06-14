/**
 * Format a timestamp as a relative time string in Chinese.
 */
export function timeAgo(timestamp: number): string {
  if (timestamp === 0) return '从未更新';

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  return `${Math.floor(seconds / 86400)} 天前`;
}

/**
 * Format an epoch millisecond timestamp as a short Chinese date string.
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
