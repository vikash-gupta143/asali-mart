// client/src/components/common/InstallPrompt.jsx
import { useState, useEffect } from "react";
import { FiDownload, FiX } from "react-icons/fi";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-2xl p-4 z-50 border-2 border-primary/20">
      <button
        onClick={() => setShowBanner(false)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
      >
        <FiX className="text-xs" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <img
          src="/pwa-192x192.png"
          alt="AsaliMart"
          className="w-12 h-12 rounded-xl"
        />
        <div>
          <p className="font-bold text-sm">Install AsaliMart App</p>
          <p className="text-xs text-muted">Fast • Offline • Notifications</p>
        </div>
      </div>

      <button
        onClick={handleInstall}
        className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2"
      >
        <FiDownload /> Install App
      </button>
    </div>
  );
};

export default InstallPrompt;