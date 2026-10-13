import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { LocationProvider, useLocation } from "./context/LocationContext";
import { SocketProvider } from "./context/SocketContext";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/common/ErrorBoundary";
import SplashScreen from "./components/common/SplashScreen";
import InstallPrompt from "./components/common/InstallPrompt";
import LocationModal from "./components/common/LocationModal";

// 🌍 Location Auto-Detect (Splash ke baad)
const LocationAutoDetect = ({ children }) => {
  const { autoDetectLocation, location, showLocationModal } = useLocation();

  useEffect(() => {
    // Agar location already saved hai — skip
    const saved = localStorage.getItem("asali_location");
    if (saved || location) return;

    // 🎯 3 second baad browser ka NATIVE popup trigger karo
    const timer = setTimeout(async () => {
      try {
        await autoDetectLocation();
        console.log("✅ Auto location detected");
      } catch (err) {
        console.log("⚠️ Auto location failed:", err.message);
        // LocationModal khud khul jayega agar fail hua
      }
    }, 3000); // 3 sec — splash ke baad

    return () => clearTimeout(timer);
  }, [location]);

  return children;
};

// 🆕 Global Location Modal Renderer
const GlobalLocationModal = () => {
  const {
    showLocationModal,
    closeLocationModal,
    location,
    setManualLocation,
  } = useLocation();

  return (
    <LocationModal
      isOpen={showLocationModal}
      onClose={closeLocationModal}
      onSelect={(loc) => {
        setManualLocation(loc.lat, loc.lng, loc.name);
        closeLocationModal();
      }}
      currentLocation={location}
    />
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Check if splash already shown in this session
  useEffect(() => {
    const hasShown = sessionStorage.getItem("splashShown");
    if (hasShown) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {/* 🎨 Splash Screen */}
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

        <LocationProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <LocationAutoDetect>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: "#fff",
                        color: "#111827",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        fontSize: "14px",
                        maxWidth: "380px",
                      },
                      success: {
                        iconTheme: {
                          primary: "#00C853",
                          secondary: "#fff",
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: "#E53935",
                          secondary: "#fff",
                        },
                      },
                    }}
                  />
                  <AppRoutes />
                </LocationAutoDetect>
                {/* 🆕 Global Location Modal — Sabse bahar */}
                <GlobalLocationModal />
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </LocationProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;