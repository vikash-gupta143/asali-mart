import { FiStar } from "react-icons/fi";

const RatingBreakdown = ({ avgRating, count, breakdown }) => {
  const total = count || 1;

  const bars = [5, 4, 3, 2, 1].map((star) => {
    const num = breakdown?.[star] || 0;
    const percent = (num / total) * 100;
    return { star, num, percent };
  });

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <div className="flex items-center gap-5 mb-5">
        {/* Big rating */}
        <div className="text-center">
          <p className="font-heading font-bold text-5xl text-dark">
            {avgRating?.toFixed(1) || "0.0"}
          </p>
          <div className="flex justify-center my-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <FiStar
                key={s}
                className={`text-sm ${
                  s <= Math.round(avgRating || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted">{count} reviews</p>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 space-y-1.5">
          {bars.map((b) => (
            <div key={b.star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted">{b.star}</span>
              <FiStar className="text-yellow-400 fill-yellow-400 text-[10px]" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${b.percent}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted">{b.num}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingBreakdown;