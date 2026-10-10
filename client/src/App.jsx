import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { LocationProvider, useLocation } from "./context/LocationContext";
import { SocketProvider } from "./context/SocketContext";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/common/ErrorBoundary";

// 🌍 First visit auto-detect
const LocationAutoDetect = ({ children }) => {
  const { autoDetectLocation } = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem("asali_location");
    if (!saved) {
      const timer = setTimeout(async () => {
        try {
          await autoDetectLocation();
          console.log("✅ First-visit location auto-detected");
        } catch (err) {
          console.log("⚠️ First-visit location skipped:", err);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </LocationProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}



export default App;