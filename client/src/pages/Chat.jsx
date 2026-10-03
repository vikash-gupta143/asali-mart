import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft, FiSend, FiMessageCircle, FiTag,
  FiCheck, FiX, FiDollarSign,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyChats,
  fetchMessages,
  sendMessageApi,
  respondToOfferApi,
} from "../services/chatService";

const Chat = () => {
  const { id: chatIdFromUrl } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState("");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [counterFor, setCounterFor] = useState(null);

  const messagesEndRef = useRef(null);

  // Load chats
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyChats();
        setChats(data.chats || []);
        if (chatIdFromUrl) {
          const found = (data.chats || []).find((c) => c._id === chatIdFromUrl);
          if (found) setActiveChat(found);
        } else if ((data.chats || []).length > 0) {
          setActiveChat(data.chats[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChats(false);
      }
    };
    load();
  }, [chatIdFromUrl]);

  // Load messages
  useEffect(() => {
    if (!activeChat) return;
    const load = async () => {
      try {
        setLoadingMsgs(true);
        const data = await fetchMessages(activeChat._id);
        setMessages(data.messages || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMsgs(false);
      }
    };
    load();
  }, [activeChat]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling — every 5 seconds
  useEffect(() => {
    if (!activeChat) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchMessages(activeChat._id);
        setMessages(data.messages || []);
      } catch (err) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChat]);

  const getOtherUser = (chat) =>
    chat.participants.find((p) => p._id !== user._id);

  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;
    try {
      const data = await sendMessageApi(activeChat._id, {
        text: text.trim(),
        type: "text",
      });
      setMessages((prev) => [...prev, data.message]);
      setText("");
    } catch (err) {
      alert("Failed to send");
    }
  };

  const handleSendOffer = async () => {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      if (counterFor) {
        // counter
        await respondToOfferApi(counterFor, "counter", amount);
      } else {
        // new offer
        await sendMessageApi(activeChat._id, {
          type: "offer",
          offerAmount: amount,
          text: `₹${amount} final?`,
        });
      }
      const data = await fetchMessages(activeChat._id);
      setMessages(data.messages || []);
      setShowOfferModal(false);
      setOfferAmount("");
      setCounterFor(null);
    } catch (err) {
      alert("Failed");
    }
  };

  const handleOfferAction = async (messageId, action) => {
    try {
      if (action === "counter") {
        setCounterFor(messageId);
        setShowOfferModal(true);
        return;
      }
      await respondToOfferApi(messageId, action);
      const data = await fetchMessages(activeChat._id);
      setMessages(data.messages || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  // ——— RENDER ———
  if (loadingChats) {
    return <div className="container-custom py-10 text-center text-muted">Loading chats...</div>;
  }

  if (chats.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <FiMessageCircle className="text-5xl text-muted mx-auto mb-4" />
        <h1 className="font-heading font-bold text-2xl mb-2">No chats yet</h1>
        <p className="text-sm text-muted mb-4">
          Start chatting with sellers from product pages
        </p>
        <Link to="/products" className="text-primary font-semibold hover:underline">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-6">
      <div className="bg-white rounded-2xl shadow-card overflow-hidden h-[75vh] flex">
        {/* Sidebar — Chat List */}
        <aside
          className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${
            activeChat ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b">
            <h2 className="font-heading font-bold text-lg">Messages</h2>
            <p className="text-xs text-muted">{chats.length} chats</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => {
              const other = getOtherUser(chat);
              const isActive = activeChat?._id === chat._id;
              return (
                <button
                  key={chat._id}
                  onClick={() => {
                    setActiveChat(chat);
                    navigate(`/chat/${chat._id}`);
                  }}
                  className={`w-full flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-bg text-left transition ${
                    isActive ? "bg-primary/5 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                    {other?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{other?.name}</p>
                    <p className="text-xs text-muted truncate">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Window */}
        {activeChat ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-3 border-b flex items-center gap-3 bg-white">
              <button
                onClick={() => {
                  setActiveChat(null);
                  navigate("/chat");
                }}
                className="md:hidden p-2 rounded-lg hover:bg-bg"
              >
                <FiArrowLeft />
              </button>

              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {getOtherUser(activeChat)?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {getOtherUser(activeChat)?.name}
                </p>
                <p className="text-xs text-muted">
                  {getOtherUser(activeChat)?.role === "SELLER" ? "Seller" : "Customer"}
                </p>
              </div>

              {/* Product info */}
              {activeChat.product && (
                <Link
                  to={`/product/${activeChat.product._id}`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg hover:bg-gray-200 transition"
                >
                  <FiTag className="text-primary text-xs" />
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {activeChat.product.name}
                  </span>
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fb]">
              {loadingMsgs ? (
                <p className="text-center text-muted text-sm">Loading...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted text-sm py-10">
                  Start the conversation 👋
                </p>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={msg.sender._id === user._id}
                    onOfferAction={handleOfferAction}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCounterFor(null);
                    setOfferAmount("");
                    setShowOfferModal(true);
                  }}
                  className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition"
                  title="Send offer"
                >
                  <FiDollarSign />
                </button>

                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />

                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition disabled:opacity-50"
                >
                  <FiSend />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted">
            Select a chat to start
          </div>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <OfferModal
          counterFor={counterFor}
          offerAmount={offerAmount}
          setOfferAmount={setOfferAmount}
          onClose={() => {
            setShowOfferModal(false);
            setOfferAmount("");
            setCounterFor(null);
          }}
          onSubmit={handleSendOffer}
        />
      )}
    </div>
  );
};

// ——— Message Bubble ———
const MessageBubble = ({ message, isOwn, onOfferAction }) => {
  if (message.type === "offer") {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-card ${
            isOwn
              ? "bg-primary text-white rounded-br-md"
              : "bg-white rounded-bl-md"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <FiDollarSign className="text-xs" />
            <span className="text-[10px] font-bold uppercase opacity-80">
              Offer
            </span>
          </div>
          <p className="font-heading font-bold text-2xl mb-1">
            ₹{message.offerAmount}
          </p>
          {message.text && message.text !== `₹${message.offerAmount} final?` && (
            <p className="text-xs opacity-90 mb-2">{message.text}</p>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase mb-2">
            {message.offerStatus === "PENDING" && (
              <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-700">
                ⏳ Pending
              </span>
            )}
            {message.offerStatus === "ACCEPTED" && (
              <span className="px-2 py-0.5 rounded bg-green-400/20 text-green-700">
                ✓ Accepted
              </span>
            )}
            {message.offerStatus === "REJECTED" && (
              <span className="px-2 py-0.5 rounded bg-red-400/20 text-red-700">
                ✗ Rejected
              </span>
            )}
            {message.offerStatus === "COUNTERED" && (
              <span className="px-2 py-0.5 rounded bg-blue-400/20 text-blue-700">
                ↔ Countered
              </span>
            )}
          </div>

          {/* Actions — only if PENDING and NOT own */}
          {message.offerStatus === "PENDING" && !isOwn && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onOfferAction(message._id, "accept")}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600"
              >
                <FiCheck /> Accept
              </button>
              <button
                onClick={() => onOfferAction(message._id, "counter")}
                className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600"
              >
                Counter
              </button>
              <button
                onClick={() => onOfferAction(message._id, "reject")}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600"
              >
                <FiX />
              </button>
            </div>
          )}

          <p className={`text-[10px] mt-1 ${isOwn ? "text-white/70" : "text-muted"}`}>
            {new Date(message.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  }

  // Text message
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isOwn
            ? "bg-primary text-white rounded-br-md"
            : "bg-white shadow-card rounded-bl-md"
        }`}
      >
        <p className="text-sm break-words">{message.text}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? "text-white/70" : "text-muted"}`}>
          {new Date(message.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

// ——— Offer Modal ———
const OfferModal = ({ counterFor, offerAmount, setOfferAmount, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-card w-full max-w-sm p-5">
      <h3 className="font-heading font-bold text-lg mb-1">
        {counterFor ? "Counter Offer" : "Make an Offer"}
      </h3>
      <p className="text-xs text-muted mb-4">
        {counterFor ? "Propose your price" : "Negotiate the price with seller"}
      </p>

      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold">
          ₹
        </span>
        <input
          type="number"
          autoFocus
          value={offerAmount}
          onChange={(e) => setOfferAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary font-heading font-bold text-xl"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark"
        >
          {counterFor ? "Send Counter" : "Send Offer"}
        </button>
      </div>
    </div>
  </div>
);

export default Chat;