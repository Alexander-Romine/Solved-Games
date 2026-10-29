import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-neutral-900/95 border border-neutral-700/80 px-3.5 py-2 text-xs font-medium text-neutral-200 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <WifiOff className="w-3.5 h-3.5 text-neutral-400" />
      <span>Offline Mode — All games run 100% locally</span>
    </div>
  );
};
