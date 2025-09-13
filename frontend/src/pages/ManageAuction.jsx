import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/manageAuction.css";
import "../styles/marketplace.css"; // reuse premium card/grid styles
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";
import { io } from "socket.io-client";

export default function ManageAuction() {
  const nav = useNavigate();
  const [ads, setAds] = useState([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [inbox, setInbox] = useState([]);
  const [selected, setSelected] = useState(null); // {adId,buyerUsername,productTitle}
  const [thread, setThread] = useState([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    const username = localStorage.getItem("username");
    //const role = localStorage.getItem("role");
    //if (!username || role !== "customer") return nav("/login");

    fetch(`${API_URL}/api/ads/user/${username}`)
      .then((res) => res.json())
      .then((data) => setAds(data))
      .catch((err) => console.error("Error fetching user ads:", err));

    // load inbox for this seller
    fetch(`${API_URL}/api/ad-chat/inbox?seller=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then(setInbox)
      .catch(() => setInbox([]));
  }, [nav]);

  // realtime: update inbox/thread when new messages arrive
  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io(API_URL, { auth: token ? { token } : {} });
    s.on("adChat:message", (msg) => {
      const me = localStorage.getItem("username");
      if (!msg || msg.sellerUsername !== me) return;
      setInbox((ib) => [
        {
          adId: msg.adId,
          buyerUsername: msg.buyerUsername,
          productTitle: msg.productTitle,
          lastMessage: msg.message,
          lastFrom: msg.from,
          ts: msg.ts,
        },
        ...ib.filter(
          (i) =>
            !(i.adId === msg.adId && i.buyerUsername === msg.buyerUsername),
        ),
      ]);
      setThread((t) =>
        selected &&
        selected.adId === msg.adId &&
        selected.buyerUsername === msg.buyerUsername
          ? // avoid duplicates if we already appended after our own POST
            msg && msg._id && t.some((x) => x._id === msg._id)
            ? t
            : [...t, msg]
          : t,
      );
    });
    return () => s.disconnect();
  }, [selected]);

  useEffect(() => {
    if (!selected) return setThread([]);
    const { adId } = selected;
    const seller = localStorage.getItem("username");
    const buyer = selected.buyerUsername;
    fetch(
      `${API_URL}/api/ad-chat/thread?adId=${encodeURIComponent(adId)}&seller=${encodeURIComponent(seller)}&buyer=${encodeURIComponent(buyer)}`,
    )
      .then((r) => r.json())
      .then(setThread)
      .catch(() => setThread([]));
  }, [selected]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const seller = localStorage.getItem("username");
    const body = {
      adId: selected.adId,
      productTitle: selected.productTitle,
      sellerUsername: seller,
      buyerUsername: selected.buyerUsername,
      from: "seller",
      message: reply.trim(),
    };
    const res = await fetch(`${API_URL}/api/ad-chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const msg = await res.json();
    if (res.ok) {
      setThread((t) => [...t, msg]);
      setReply("");
      // refresh inbox ordering
      setInbox((ib) => [
        {
          adId: selected.adId,
          buyerUsername: selected.buyerUsername,
          productTitle: selected.productTitle,
          lastMessage: msg.message,
          lastFrom: "seller",
          ts: msg.ts,
        },
        ...ib.filter(
          (i) =>
            !(
              i.adId === selected.adId &&
              i.buyerUsername === selected.buyerUsername
            ),
        ),
      ]);
    }
  };

  const handleCloseBid = async (adId) => {
    try {
      const res = await fetch(`${API_URL}/api/ads/${adId}/close`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success) {
        setAds((prev) =>
          prev.map((ad) => (ad._id === adId ? { ...ad, isClosed: true } : ad)),
        );
        alert("Auction closed successfully!");
      }
    } catch (err) {
      console.error("Failed to close auction:", err);
    }
  };

  const getTimeRemaining = (endDate) => {
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return "Ended";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ${hrs % 24}h ${mins % 60}m`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const visibleAds = ads.filter((ad) => (activeOnly ? !ad.isClosed : true));

  const handleDelete = async (adId) => {
    if (!confirm("Delete this listing?")) return;
    try {
      const res = await fetch(`${API_URL}/api/ads/${adId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setAds((prev) => prev.filter((a) => a._id !== adId));
      } else {
        alert(`Failed to delete: ${data.error || res.status}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting ad");
    }
  };

  return (
    <div className="auction-container">
      <div className="auction-header">
        <h1>Manage Your Auctions</h1>
        <div className="auction-actions-top">
          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className="btn-toggle"
          >
            {activeOnly ? "Show All" : "Show Active Only"}
          </button>
          <button onClick={() => nav("/post-ad")} className="btn-primary">
            Post an Ad
          </button>
        </div>
      </div>

      {visibleAds.length === 0 ? (
        <p style={{ marginTop: 20 }}>No listings to show.</p>
      ) : (
        <div
          className="market-results"
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}
        >
          <div className="market-grid">
            {visibleAds.map((ad) => (
              <div className={`market-card ${ad.isClosed ? 'ad-closed' : 'ad-active'}`} key={ad._id}>
                <div
                  style={{
                    width: "100%",
                    height: 140,
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                >
                  <img
                    src={
                      ad.images && ad.images[0]
                        ? `${API_URL}/uploads/${ad.images[0]}`
                        : ad.thumbnail || "/fallback.jpg"
                    }
                    alt={ad.title}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
                  />
                </div>
                <div>
                  <h3>{ad.title}</h3>
                  <p>
                    <strong>Condition:</strong> {ad.condition}
                  </p>
                  <p>
                    <strong>Current Bid:</strong>{" "}
                    {ad.bids?.[0]?.amount
                      ? `LKR ${Number(ad.bids[0].amount).toLocaleString()}`
                      : "No bids yet"}
                  </p>
                  <p>
                    <strong>Time Remaining:</strong>{" "}
                    {getTimeRemaining(ad.endTime)}
                  </p>
                  <div
                    className="auction-actions"
                    style={{
                      display: "flex",
                      gap: 10,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => nav(`/used-product/${ad._id}`)}
                      className="btn btn-primary"
                    >
                      View
                    </button>
                    {!ad.isClosed && (
                      <button
                        onClick={() => handleCloseBid(ad._id)}
                        className="btn btn-secondary"
                      >
                        Close Bid
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(ad._id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                    {ad.isClosed && (
                      <span className="closed-label">Closed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Inbox panel */}
          <div style={{ position: "sticky", top: 100, alignSelf: "start" }}>
            <div className="market-card" style={{ padding: 0 }}>
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid #e5e7eb",
                  fontWeight: 700,
                }}
              >
                Inbox
              </div>
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {inbox.length === 0 && (
                  <div style={{ padding: 12, color: "#6b7280" }}>
                    No messages yet.
                  </div>
                )}
                {inbox.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelected(c)}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid #eef2f7",
                      cursor: "pointer",
                      background:
                        selected &&
                        selected.adId === c.adId &&
                        selected.buyerUsername === c.buyerUsername
                          ? "#f7f7fb"
                          : "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{c.buyerUsername}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {c.productTitle || "Ad"}
                    </div>
                    <div
                      style={{ fontSize: 13, marginTop: 4, color: "#374151" }}
                    >
                      {c.lastFrom === "seller" ? "You: " : ""}
                      {c.lastMessage}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thread */}
            <div
              className="market-card"
              style={{ marginTop: 12, display: selected ? "block" : "none" }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                {selected?.buyerUsername} · {selected?.productTitle}
              </div>
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  border: "1px solid #eef2f7",
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                {thread.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: m.from === "seller" ? "right" : "left",
                      margin: "6px 0",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        background: m.from === "seller" ? "#E6FFE8" : "#eef3ff",
                        border: "1px solid #e3e8ef",
                        borderRadius: 12,
                        padding: "6px 10px",
                      }}
                    >
                      {m.message}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply"
                  style={{
                    flex: 1,
                    padding: 10,
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                  }}
                />
                <button className="btn btn-primary" onClick={sendReply}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
