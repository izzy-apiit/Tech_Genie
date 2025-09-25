import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import "../styles/UProductview.css";
import axios from "axios";
import { io } from "socket.io-client";
import AdChatWidget from "../components/AdChatWidget";

const API_URL = import.meta.env.VITE_API_URL ;

const UProductView = () => {
  const { id } = useParams();
  const [ad, setAd] = useState(null);
  const [newBid, setNewBid] = useState("");
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [socketRef, setSocketRef] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/ads/${id}`)
      .then((res) => setAd(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  // derive current highest bid
  const currentBid = useMemo(() => {
    if (!ad) return 0;
    const bids = Array.isArray(ad.bids) ? ad.bids : [];
    const maxBid = bids.length
      ? Math.max(...bids.map((b) => Number(b.amount) || 0))
      : 0;
    return Math.max(Number(ad.price) || 0, maxBid);
  }, [ad]);

  // Socket.IO: join room and listen to updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io(API_URL, { auth: token ? { token } : {} });
    s.emit("joinRoom", `ad:${id}`);
    s.on("bidUpdate", (updated) => {
      if (updated && updated._id === id) setAd(updated);
    });
    setSocketRef(s);
    return () => {
      s.disconnect();
    };
  }, [id]);

  const handleBid = async () => {
    if (!ad) return;
    if (ad.isClosed) {
      setError("Auction is closed");
      return;
    }
    const amount = Number(newBid);
    const username = localStorage.getItem("username");
    if (username && ad.createdBy && username === ad.createdBy) {
      setError("You cannot bid on your own product");
      return;
    }
    if (!Number.isFinite(amount) || amount <= currentBid) {
      setError(`Bid must be greater than current bid (Rs ${currentBid})`);
      return;
    }
    try {
      const user = username || "guest";
      const res = await axios.post(`${API_URL}/api/ads/${id}/bid`, {
        user,
        amount,
      });
      setAd(res.data);
      setNewBid("");
      setError("");
      // record bid activity
      if (username) {
        fetch(`${API_URL}/api/personalization/activity/bid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, adId: id, amount }),
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setError("Failed to place bid");
    }
  };

  if (!ad) return <div className="loader">Loading...</div>;

  const mainImgSrc =
    ad.images && ad.images.length
      ? `${API_URL}/uploads/${ad.images[activeImg]}`
      : "";

  const timeLeft = ad.endTime
    ? (() => {
        const diff = Math.max(0, new Date(ad.endTime).getTime() - Date.now());
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}h ${m}m`;
      })()
    : "—";

  const gallery = Array.isArray(ad.images) ? ad.images : [];
  const isOwner = localStorage.getItem("username") === ad.createdBy;
  const productMeta = {
    brand: ad.brand || "—",
    condition: ad.condition || "—",
    contact: ad.mobile || "—",
    description: ad.description || "—",
  };

  return (
    <div className="uproduct-container">
      <header className="uproduct-hero">
        <div className="hero-media">
          <div className="image-preview">
            {mainImgSrc ? (
              <img className="main-image" src={mainImgSrc} alt={ad.title} />
            ) : (
              <div className="no-image">No image uploaded</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="media-thumbs">
              {gallery.map((img, idx) => {
                const src = `${API_URL}/uploads/${img}`;
                return (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    className={`thumb ${activeImg === idx ? "active" : ""}`}
                    onClick={() => setActiveImg(idx)}
                  >
                    <img src={src} alt={`${ad.title} ${idx + 1}`} onError={(e) => (e.currentTarget.src = "/fallback.jpg")} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="hero-side">
          <p className="hero-eyebrow">Featured listing</p>
          <h1 className="uproduct-header">{ad.title}</h1>
          <p className="hero-description">{ad.description}</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="label">Current bid</span>
              <span className="value">{formatCurrency(currentBid)}</span>
            </div>
            <div className="hero-stat">
              <span className="label">Base price</span>
              <span className="value">{formatCurrency(ad.price)}</span>
            </div>
            <div className="hero-stat">
              <span className="label">Time left</span>
              <span className={`value ${ad.isClosed ? "text-closed" : ""}`}>
                {timeLeft}
              </span>
            </div>
          </div>
          {!isOwner && (
            <button className="chat-btn" onClick={() => setChatOpen(true)}>
              Chat with seller
            </button>
          )}
        </div>
      </header>

      <div className="bid-section">
        <div className="bid-section-head">
          <h3>Bid this item</h3>
          <span className={`auction-chip ${ad.isClosed ? "closed" : "live"}`}>
            {ad.isClosed ? "Auction closed" : "Auction live"}
          </span>
        </div>
        <div className="bid-info">
          <div className="stat-card">
            <span className="stat-label">Current Bid</span>
            <span className="stat-value">{formatCurrency(currentBid)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Base Price</span>
            <span className="stat-value">{formatCurrency(ad.price)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Time Left</span>
            <span className={`stat-value ${ad.isClosed ? "closed" : ""}`}>
              {timeLeft}
            </span>
          </div>
        </div>
        <div className="bid-actions">
          <input
            type="number"
            className="place-bid-input"
            placeholder={`Bid more than ${formatCurrency(currentBid)}`}
            value={newBid}
            onChange={(e) => setNewBid(e.target.value)}
            disabled={isOwner || ad.isClosed}
          />
          <button
            className="place-bid-btn"
            onClick={handleBid}
            disabled={isOwner || ad.isClosed}
          >
            Place Bid
          </button>
        </div>
        {isOwner && (
          <p className="error-text">You cannot bid on your own product.</p>
        )}
        {ad.isClosed && <p className="error-text">Auction is closed.</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="details-section">
        <h3>Product Details</h3>
        <div className="details-grid">
          {Object.entries(productMeta).map(([label, value]) => (
            <div key={label} className="product-detail-item">
              <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
      {!isOwner && (
        <AdChatWidget
          mode="modal"
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          adId={ad._id}
          sellerUsername={ad.createdBy}
          productTitle={ad.title}
        />
      )}
    </div>
  );
};

export default UProductView;
