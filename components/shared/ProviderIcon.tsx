import React, { useState } from 'react';
import type { Provider } from '@/types';

interface ProviderIconProps {
  provider: Pick<Provider, 'icon' | 'faviconUrl' | 'name'>;
  size?: number;
}

const ProviderIcon: React.FC<ProviderIconProps> = ({ provider, size = 24 }) => {
  const [useFallback, setUseFallback] = useState(false);

  if (provider.faviconUrl && !useFallback) {
    return (
      <img
        src={provider.faviconUrl}
        alt={provider.name}
        width={size}
        height={size}
        className="provider-icon-img"
        onError={() => setUseFallback(true)}
        style={{ width: size, height: size, borderRadius: 4, flexShrink: 0 }}
      />
    );
  }

  return (
    <span className="provider-icon-emoji" style={{ fontSize: size * 0.8 }}>
      {provider.icon}
    </span>
  );
};

export default ProviderIcon;
