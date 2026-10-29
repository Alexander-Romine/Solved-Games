import React, { useState } from 'react';
import { Download, Share2, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sounds } from '../utils/sound';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  // If running as an installed PWA, hide the button
  if (isInstalled && !installedNotice) {
    return null;
  }

  const handleInstallClick = async () => {
    sounds.playTap();
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General instructions modal if browser doesn't expose beforeinstallprompt directly
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install Solved Games App (Offline Play)"
        aria-label="Install App for Offline Play"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-all cursor-pointer group"
      >
        <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
        <span className="hidden sm:inline font-medium">Install App</span>
      </button>

      {/* Guided Install Modal for iOS or manual browsers */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-950 border border-neutral-800 p-5 shadow-2xl relative text-neutral-100">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Install Solved Games</h3>
                <p className="text-xs text-neutral-400">Play anywhere with zero internet</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-300 my-4 bg-neutral-900/50 p-3.5 rounded-xl border border-neutral-800/80">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-white" /> <strong>Share</strong> icon in the Safari toolbar.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Launch directly from your home screen for instant fullscreen play!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">1</span>
                    <span>In your browser's address bar or menu (⋮), click <strong>Install Solved Games</strong> or <strong>Add to Home Screen</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">2</span>
                    <span>The app runs fully offline, caching all logic and sounds locally.</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 px-3 rounded-xl bg-white text-black font-medium text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {installedNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-xs font-medium text-white shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>App installed successfully! Accessible offline.</span>
        </div>
      )}
    </>
  );
};
