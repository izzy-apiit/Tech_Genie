import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ;

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
        setMessages((m) => {
          // avoid duplicates when we already appended our own POST response
          if (msg && msg._id && m.some((x) => x._id === msg._id)) return m;
          return [...m, msg];
        });
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
      .then((rows) => Array.isArray(rows) && setMessages(rows))
      .catch(() => {});
  }, [adId, sellerUsername]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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
        setMessages((m) => [...m, doc]);
        setText("");
        setHasNewFromOther(false);
      }
    } catch {}
  };

  const content = (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        height: 420,
        width: 360,
        boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(90deg,#0f2027,#203a43 60%,#2c5364)",
          color: "#fff",
          padding: "12px 14px",
          borderRadius: "10px 10px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>Chat · {productTitle}</strong>
        {hasNewFromOther && (
          <span
            style={{
              marginLeft: 8,
              background: "#ff6b6b",
              color: "#fff",
              borderRadius: 12,
              padding: "2px 8px",
              fontSize: 12,
            }}
          >
            New
          </span>
        )}
        {isModal ? (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        ) : (
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            −
          </button>
        )}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 10,
          background: "#fafafa",
        }}
      >
        {messages.map((m, i) => {
          const mine = m.from ? m.from === viewerRole : m.fromName === me;
          return (
            <div
              key={i}
              style={{ marginBottom: 8, textAlign: mine ? "right" : "left" }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 14,
                  background: mine ? "#E6FFE8" : "#eef3ff",
                  border: "1px solid #e3e8ef",
                }}
              >
                {!mine && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {m.fromName || (m.from === "seller" ? sellerUsername : me)}{" "}
                    · {m.productTitle || ""}
                  </div>
                )}
                <div>{m.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: 8,
          borderTop: "1px solid #eee",
          background: "#fff",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #cbd5e1",
            borderRadius: 8,
          }}
        />
        <button onClick={send} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  );

  if (isModal) {
    if (!controlledOpen) return null;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 90,
        right: 24,
        width: open ? 360 : 180,
        zIndex: 20,
      }}
    >
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
