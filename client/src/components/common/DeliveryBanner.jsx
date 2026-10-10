import { FiTruck, FiClock, FiMapPin } from "react-icons/fi";
import { useDeliveryInfo } from "../../hooks/useDeliveryInfo";

const DeliveryBanner = () => {
  const info = useDeliveryInfo();

  const bgColor = {
    day: "from-orange-50 to-amber-50 border-orange-200",
    evening: "from-purple-50 to-pink-50 border-purple-200",
    night: "from-blue-50 to-indigo-50 border-blue-200",
  }[info.window];

  const textColor = {
    day: "text-orange-700",
    evening: "text-purple-700",
    night: "text-blue-700",
  }[info.window];

  const iconColor = {
    day: "text-orange-500",
    evening: "text-purple-500",
    night: "text-blue-500",
  }[info.window];

  return (
    <div className={`bg-gradient-to-r ${bgColor} border-2 rounded-2xl p-4`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${iconColor}`}>
          <FiTruck className="text-xl" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className={`font-semibold text-sm ${textColor}`}>
            {info.label} • {info.radiusText} tak
          </p>
          <p className="text-xs text-muted mt-0.5">{info.message}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <FiClock className={iconColor} />
          <span>30-35 min delivery</span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBanner;