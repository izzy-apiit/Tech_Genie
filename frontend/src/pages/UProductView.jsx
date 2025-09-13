import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/UProductview.css";
import axios from "axios";
import { io } from "socket.io-client";
import AdChatWidget from "../components/AdChatWidget";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

const UProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [newBid, setNewBid] = useState("");
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [socketRef, setSocketRef] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

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

  return (
    <div className="uproduct-container">
      <h2 className="uproduct-header">{ad.title}</h2>

      <div className="image-grid">
        <div className="image-preview">
          {mainImgSrc ? (
            <img className="main-image" src={mainImgSrc} alt="Main" />
          ) : (
            <div>No Image</div>
          )}
        </div>

        <div className="thumbnails">
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 14,
              minHeight: 140,
            }}
          >
            <h4 style={{ margin: 0, marginBottom: 8 }}>Description</h4>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {ad.description}
            </p>
          </div>
          {localStorage.getItem("username") !== ad.createdBy && (
            <button className="chat-btn" onClick={() => setChatOpen(true)}>
              Chat with seller
            </button>
          )}
        </div>
      </div>

      <div className="bid-section">
        <h3>Bid this item</h3>
        <div className="bid-info">
          <div>
            <strong>Current Bid:</strong> Rs {currentBid}
          </div>
          <div>
            <strong>Base Price:</strong> Rs {ad.price}
          </div>
          <div>
            <strong>Time Left:</strong> {timeLeft}{" "}
            {ad.isClosed ? "(Closed)" : ""}
          </div>
        </div>
        <div className="bid-actions">
          <input
            type="number"
            className="place-bid-input"
            placeholder={`Enter more than Rs ${currentBid}`}
            value={newBid}
            onChange={(e) => setNewBid(e.target.value)}
            disabled={
              localStorage.getItem("username") === ad.createdBy || ad.isClosed
            }
          />
          <button
            className="place-bid-btn"
            onClick={handleBid}
            disabled={
              localStorage.getItem("username") === ad.createdBy || ad.isClosed
            }
          >
            Place Bid
          </button>
        </div>
        {localStorage.getItem("username") === ad.createdBy && (
          <p className="error-text">You cannot bid on your own product.</p>
        )}
        {ad.isClosed && <p className="error-text">Auction is closed.</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="details-section">
        <h3>Product Details</h3>
        <div className="product-detail-item">
          <strong>Brand</strong>
          <span>{ad.brand}</span>
        </div>
        <div className="product-detail-item">
          <strong>Condition</strong>
          <span>{ad.condition}</span>
        </div>
        <div className="product-detail-item">
          <strong>Contact</strong>
          <span>{ad.mobile}</span>
        </div>
        <div className="product-detail-item">
          <strong>Description</strong>
          <span>{ad.description}</span>
        </div>
      </div>
      {localStorage.getItem("username") !== ad.createdBy && (
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
