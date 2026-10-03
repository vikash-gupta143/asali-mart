const Placeholder = ({ title, emoji = "🚧" }) => (
  <div className="container-custom py-20 text-center">
    <div className="text-6xl mb-4">{emoji}</div>
    <h1 className="font-heading font-bold text-2xl mb-2">{title}</h1>
    <p className="text-sm text-muted">
      Ye page next phase me banega. 🔜
    </p>
  </div>
);

export default Placeholder;