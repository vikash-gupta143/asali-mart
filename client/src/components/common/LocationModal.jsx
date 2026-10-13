import { useState } from "react";
import { FiMapPin, FiX, FiCrosshair, FiAlertCircle, FiCheck } from "react-icons/fi";
import { useLocation } from "../../context/LocationContext";
import toast from "react-hot-toast";

const LocationModal = ({ isOpen, onClose, onSelect, currentLocation }) => {
  const { detectLocation, setLocationByPincode, permissionStatus, error: locationError } = useLocation();
  const [detecting, setDetecting] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [showPincodeInput, setShowPincodeInput] = useState(false);

  if (!isOpen) return null;

  // 🌍 GPS Detect
  const handleDetect = async () => {
    setDetecting(true);
    setPincodeError("");

    try {
      const loc = await detectLocation();

      toast.success(`Location set: ${loc.name}`, { icon: "📍" });
      onSelect(loc);
      onClose();
    } catch (err) {
      // GPS fail — pincode input dikhayein
      setShowPincodeInput(true);
      toast.error(err.message || "Location nahi mili. Pincode daalein.", {
        duration: 4000,
      });
    } finally {
      setDetecting(false);
    }
  };

  // 📍 Pincode Se Location
  const handlePincodeSubmit = async () => {
    if (!pincode || pincode.length !== 6) {
      setPincodeError("Valid 6-digit pincode daalein");
      return;
    }

    try {
      setPincodeLoading(true);
      setPincodeError("");

      const loc = await setLocationByPincode(pincode);

      toast.success(`Location set: ${loc.name}`, { icon: "📍" });
      onSelect(loc);
      onClose();
    } catch (err) {
      setPincodeError(err.message || "Pincode verify nahi ho paya");
    } finally {
      setPincodeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-bg z-10"
        >
          <FiX />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <FiMapPin className="text-2xl" />
          </div>
          <h2 className="font-heading font-bold text-xl">Select Location</h2>
          <p className="text-sm text-muted mt-1">
            Nearby shops dekhne ke liye location chunein
          </p>
        </div>

        {/* Permission Warning */}
        {permissionStatus === "denied" && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
            <FiAlertCircle className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-xs text-red-700">
              <p className="font-semibold mb-1">Location blocked hai</p>
              <p>
                Browser settings me 🔒 icon → "Location" → <b>Allow</b> karein.
                Ya niche pincode daalein.
              </p>
            </div>
          </div>
        )}

        {/* GPS Detect Button */}
        <button
          onClick={handleDetect}
          disabled={detecting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60 mb-4"
        >
          <FiCrosshair className={detecting ? "animate-spin" : ""} />
          {detecting ? "Detecting..." : "📍 Use My Current Location"}
        </button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-muted font-medium">
              OR
            </span>
          </div>
        </div>

        {/* 🆕 Pincode Input (Always Visible) */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-muted mb-2 block">
            📮 Pincode Se Location Chunein
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, ""));
                setPincodeError("");
              }}
              maxLength={6}
              placeholder="462001"
              className={`flex-1 p-3 rounded-xl border-2 outline-none text-center font-semibold tracking-wider transition ${
                pincodeError
                  ? "border-red-300 bg-red-50"
                  : pincode.length === 6
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 focus:border-primary"
              }`}
            />
            <button
              onClick={handlePincodeSubmit}
              disabled={pincodeLoading || pincode.length !== 6}
              className="px-4 py-3 rounded-xl bg-secondary text-white font-semibold disabled:opacity-50 hover:bg-secondary/90 transition flex items-center gap-1"
            >
              {pincodeLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCheck />
              )}
            </button>
          </div>
          {pincodeError && (
            <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
              <FiAlertCircle /> {pincodeError}
            </p>
          )}
          <p className="text-[10px] text-muted mt-1">
            💡 GPS kaam nahi kar raha? Pincode daalein — 100% kaam karega
          </p>
        </div>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-muted font-medium">
              POPULAR CITIES
            </span>
          </div>
        </div>

        {/* City Quick Select */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Bhopal", pincode: "462001" },
            { name: "Indore", pincode: "452001" },
            { name: "Gwalior", pincode: "474001" },
            { name: "Jabalpur", pincode: "482001" },
            { name: "Ujjain", pincode: "456001" },
            { name: "Sagar", pincode: "470001" },
          ].map((c) => {
            const isActive =
              currentLocation?.name?.includes(c.name) ||
              currentLocation?.pincode === c.pincode;

            return (
              <button
                key={c.name}
                onClick={async () => {
                  setPincode(c.pincode);
                  try {
                    setPincodeLoading(true);
                    const loc = await setLocationByPincode(c.pincode);
                    toast.success(`Location set: ${loc.name}`, { icon: "📍" });
                    onSelect(loc);
                    onClose();
                  } catch (err) {
                    setPincodeError(err.message);
                  } finally {
                    setPincodeLoading(false);
                  }
                }}
                disabled={pincodeLoading}
                className={`p-3 rounded-xl text-sm font-medium border-2 transition flex items-center gap-2 justify-center ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                📍 {c.name}
              </button>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-5 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-[10px] text-blue-700 text-center leading-relaxed">
            🔒 Aapki location **sirf nearby shops** dikhane ke liye use hoti hai.
            Yeh **save nahi** ki jaati.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;