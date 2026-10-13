import { useEffect, useState } from "react";

const SplashScreen = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation (5 seconds)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2; // 100% in 5 seconds (2% every 100ms)
      });
    }, 100);

    // After 5 seconds, start fade out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    // After 5.5 seconds, finish splash
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#FF6B00] via-[#FF8C33] to-[#FF6B00] transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Icon Animation */}
        <div
          className="w-28 h-28 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6"
          style={{
            animation: "bounceIn 1s ease-out",
          }}
        >
          <span
            className="font-heading font-bold text-6xl text-[#FF6B00]"
            style={{
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            A
          </span>
        </div>

        {/* App Name */}
        <h1
          className="font-heading font-bold text-4xl text-white mb-2 tracking-wider"
          style={{
            animation: "slideUp 1s ease-out 0.3s both",
          }}
        >
          Asali<span className="text-yellow-300">Mart</span>
        </h1>

        {/* Tagline */}
        <p
          className="text-white/90 text-sm tracking-widest uppercase mb-12"
          style={{
            animation: "slideUp 1s ease-out 0.6s both",
          }}
        >
          Local Marketplace
        </p>

        {/* Loading Spinner */}
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-white border-t-transparent"
            style={{
              animation: "spin 1s linear infinite",
            }}
          ></div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress Text */}
        <p className="text-white/70 text-xs mt-3 font-medium">
          Loading... {progress}%
        </p>
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-8 text-center"
        style={{
          animation: "slideUp 1s ease-out 1s both",
        }}
      >
        <p className="text-white/60 text-xs">
          Made with ❤️ in India
        </p>
      </div>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes bounceIn {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;