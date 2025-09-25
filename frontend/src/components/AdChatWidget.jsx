import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "../styles/adChatWidget.css";

const API_URL = import.meta.env.VITE_API_URL ;

const messageSignature = (msg = {}) => {
  if (!msg) return "";
  const id = msg._id || msg.id;
  if (id) return `id:${id}`;
  const ts = msg.ts || msg.createdAt || msg.created_at || msg.time || "";
  return `${msg.from || ""}-${ts}-${msg.message || ""}`;
};

const appendUnique = (list, msg) => {
  if (!msg) return list;
  const sig = messageSignature(msg);
  if (!sig) return [...list, msg];
  if (list.some((item) => messageSignature(item) === sig)) return list;
  return [...list, msg];
};

export default function AdChatWidget({
  adId,
  sellerUsername,
  productTitle,
  mode = "floating",
  open: controlledOpen,
  onClose,
}) {
  const isModal = mode === "modal";
  const [open, setOpen] = useState(!isModal);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const me =
    typeof window !== "undefined" ? localStorage.getItem("username") || "" : "";
  const viewerRole = me && me === sellerUsername ? "seller" : "buyer";
  const [hasNewFromOther, setHasNewFromOther] = useState(false);

  // Connect socket (if logged in) for realtime updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // optional, chat still works via HTTP
    const s = io(API_URL, { auth: { token } });
    s.emit("joinRoom", `ad:${adId}`);
    s.on("adChat:message", (msg) => {
      if (msg?.adId === adId) {
        setMessages((m) => appendUnique(m, msg));
        if (msg.from && msg.from !== viewerRole) setHasNewFromOther(true);
      }
    });
    socketRef.current = s;
    return () => s.disconnect();
  }, [adId]);

  // Always load persisted thread once
  useEffect(() => {
    const buyer = localStorage.getItem("username");
    fetch(
      `${API_URL}/api/ad-chat/thread?adId=${encodeURIComponent(adId)}&seller=${encodeURIComponent(sellerUsername)}&buyer=${encodeURIComponent(buyer)}`,
    )
      .then((r) => r.json())
      .then((rows) => Array.isArray(rows) && setMessages(rows.reduce(appendUnique, [])))
      .catch(() => {});
  }, [adId, sellerUsername]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (isModal) return;
    if (typeof controlledOpen === "boolean") setOpen(controlledOpen);
  }, [controlledOpen, isModal]);

  const send = async () => {
    const buyerUsername = localStorage.getItem("username") || "User";
    const message = text.trim();
    if (!message) return;
    try {
      const body = {
        adId,
        productTitle,
        sellerUsername,
        buyerUsername,
        from: viewerRole === "seller" ? "seller" : "buyer",
        message,
      };
      const res = await fetch(`${API_URL}/api/ad-chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const doc = await res.json();
      if (res.ok) {
        setMessages((m) => appendUnique(m, doc));
        setText("");
        setHasNewFromOther(false);
      }
    } catch {}
  };

  const content = (
    <div className="adchat-panel">
      <div className="adchat-header">
        <div>
          <span className="adchat-title">Chat</span>
          <span className="adchat-subtitle">{productTitle}</span>
        </div>
        <div className="adchat-header-actions">
          {hasNewFromOther && <span className="adchat-pill">New</span>}
          {isModal ? (
            <button type="button" className="adchat-close" onClick={onClose}>
              Close
            </button>
          ) : (
            <button
              type="button"
              className="adchat-close"
              onClick={() => setOpen(false)}
            >
              −
            </button>
          )}
        </div>
      </div>
      <div className="adchat-body">
        {messages.map((m) => {
          const sig = messageSignature(m);
          const mine = m.from ? m.from === viewerRole : m.fromName === me;
          return (
            <div
              key={sig}
              className={`adchat-message ${mine ? "adchat-message--mine" : ""}`}
            >
              <div className="adchat-bubble">
                {!mine && (
                  <div className="adchat-meta">
                    {m.fromName || (m.from === "seller" ? sellerUsername : me)}
                  </div>
                )}
                <div className="adchat-text">{m.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="adchat-footer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
        />
        <button type="button" className="adchat-send" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );

  if (isModal) {
    if (!controlledOpen) return null;
    return (
      <div className="adchat-overlay">
        {content}
      </div>
    );
  }

  return (
    <div className={`adchat-floating ${open ? "open" : "closed"}`}>
      {!open ? (
        <button className="btn-primary" onClick={() => setOpen(true)}>
          Open Chat
        </button>
      ) : (
        content
      )}
    </div>
  );
}
