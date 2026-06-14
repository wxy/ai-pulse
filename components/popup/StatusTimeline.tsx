import React, { useState, useEffect } from 'react';
import { sendMessage } from '@/core/message-bus';
import type { StatusHistoryEntry } from '@/core/storage';

interface StatusTimelineProps {
  providerId: string;
}

const MAX_DOTS = 10;

const StatusTimeline: React.FC<StatusTimelineProps> = ({ providerId }) => {
  const [entries, setEntries] = useState<StatusHistoryEntry[]>([]);

  useEffect(() => {
    sendMessage<{ entries: StatusHistoryEntry[] }>('GET_STATUS_HISTORY', providerId)
      .then(data => setEntries(data.entries.slice(-MAX_DOTS)))
      .catch(() => setEntries([]));
  }, [providerId]);

  if (entries.length === 0) return null;

  return (
    <div className="status-timeline" title="最近状态变化">
      {entries.map((entry, i) => (
        <span
          key={i}
          className={`timeline-dot ${entry.isAvailable ? 'dot-ok' : 'dot-error'}`}
          title={`${new Date(entry.timestamp).toLocaleString('zh-CN')}  ${entry.statusMessage}`}
        />
      ))}
    </div>
  );
};

export default StatusTimeline;
