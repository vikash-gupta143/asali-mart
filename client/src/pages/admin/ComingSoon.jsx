const ComingSoon = ({ title, emoji = "🚧" }) => (
  <div className="bg-white rounded-xl shadow-card p-12 text-center">
    <div className="text-6xl mb-4">{emoji}</div>
    <h1 className="font-heading font-bold text-2xl mb-2">{title}</h1>
    <p className="text-sm text-muted">This section will come in a later phase 🔜</p>
  </div>
);

export default ComingSoon;