import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-[#faf6ee] border border-[#d6c7b0] px-3.5 py-2 text-xs font-mono text-[#4a4237] shadow-[0_4px_16px_rgba(60,45,30,0.15)] animate-in fade-in slide-in-from-bottom-2 duration-200">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3d6b4f] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3d6b4f]" />
      </span>
      <WifiOff className="w-3.5 h-3.5 text-[#7a6f60]" />
      <span>Offline Mode • Archival games run 100% locally</span>
    </div>
  );
};
