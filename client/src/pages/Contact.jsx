import { useState } from "react";
import {
  FiMail, FiPhone, FiMapPin, FiSend,
  FiFacebook, FiInstagram, FiTwitter, FiYoutube,
} from "react-icons/fi";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="container-custom py-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-secondary to-[#2a2a4e] rounded-2xl p-8 text-white text-center mb-8">
        <h1 className="font-heading font-bold text-3xl mb-2">Get in Touch</h1>
        <p className="text-gray-300 text-sm max-w-lg mx-auto">
          Have questions? We're here to help. Reach out to us anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info Cards */}
        <div className="space-y-4">
          {[
            { icon: FiMail, title: "Email", value: "support@asalimart.com", color: "bg-blue-50 text-blue-600" },
            { icon: FiPhone, title: "Phone", value: "+91 98765 43210", color: "bg-green-50 text-green-600" },
            { icon: FiMapPin, title: "Address", value: "Mumbai, India", color: "bg-orange-50 text-orange-600" },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${c.color}`}>
                <c.icon />
              </div>
              <div>
                <p className="text-xs text-muted">{c.title}</p>
                <p className="font-semibold text-sm">{c.value}</p>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold text-sm mb-3">Follow Us</h3>
            <div className="flex gap-2">
              {[FiFacebook, FiInstagram, FiTwitter, FiYoutube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6">
          <h2 className="font-heading font-bold text-xl mb-5">Send us a message</h2>

          {sent && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">
              ✅ Message sent successfully! We'll get back soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                type="email"
                required
                placeholder="Your Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>
            <textarea
              required
              rows="6"
              placeholder="Your Message..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
            >
              <FiSend /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;