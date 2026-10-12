import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🔔 Firebase Imports
import { initializeApp } from "firebase/app";
import { getMessaging, onMessage } from "firebase/messaging";

// 🔔 Firebase Config (Aapko yeh keys Firebase Console se leni hain)
const firebaseConfig = {
  apiKey: "AIzaSyD_dgQ_utYKixssNBNX-yjErPEDfTEJcJ0",
  authDomain: "asalimart-480e4.firebaseapp.com",
  projectId: "asalimart-480e4",
  storageBucket: "asalimart-480e4.firebasestorage.app",
  messagingSenderId: "148883867242",
  appId: "1:148883867242:web:db2a710ae632fb6a01ac13",
  measurementId: "G-XBTHLD7458"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Messaging (Sirf browser me chalega, SSR me nahi)
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
  
  // Foreground me notification aane par handle karein
  onMessage(messaging, (payload) => {
    console.log("Foreground Message received: ", payload);
    // Yahan aap toast ya alert dikha sakte hain
    alert(`${payload.notification.title}: ${payload.notification.body}`);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)