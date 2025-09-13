import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/manageBids.css";
const API_URL = import.meta.env.VITE_API_URL ;

export default function ManageBids() {
  const [bids, setBids] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    const fetchBids = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;

      try {
        const res = await fetch(`${API_URL}/api/ads`);
        const data = await res.json();
        const all = Array.isArray(data) ? data : [];
        const mine = [];

        all.forEach((ad) => {
          const bids = Array.isArray(ad.bids) ? ad.bids : [];
          const myBid = bids.find((b) => b.user === username);
          if (myBid) {
            const highest = bids.length
              ? Math.max(...bids.map((b) => Number(b.amount) || 0))
              : 0;
            mine.push({
              ...ad,
              yourBid: Number(myBid.amount) || 0,
              isOutbid: highest > (Number(myBid.amount) || 0),
            });
          }
        });

        setBids(mine);
      } catch (err) {
        console.error("Failed to load bids", err);
        setBids([]);
      }
    };

    fetchBids();
  }, []);

  const formatTime = (createdAt) => {
    const closeInMs = 1000 * 60 * 60 * 24 * 2; // 2 days duration
    const expiry = new Date(createdAt).getTime() + closeInMs;
    const left = expiry - Date.now();
    if (left <= 0) return "Closed";
    const hrs = Math.floor(left / (1000 * 60 * 60));
    const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m left`;
  };

  return (
    <div className="manage-bids-page">
      <h2>Your Bids</h2>
      {bids.length === 0 ? (
        <p>No bids placed yet.</p>
      ) : (
        <div className="bids-list">
          {bids.map((ad) => (
            <div key={ad._id} className="bid-card">
              <div
                style={{
                  width: 160,
                  height: 120,
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
                      ? `${import.meta.env.VITE_API_URL }/uploads/${ad.images[0]}`
                      : ad.thumbnail || "/fallback.jpg"
                  }
                  alt=""
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                  onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
                />
              </div>
              <div className="bid-info">
                <h3>{ad.title}</h3>
                <p>
                  <strong>Your Bid:</strong> LKR {ad.yourBid}
                </p>
                <p>
                  <strong>Current Highest:</strong> LKR{" "}
                  {Math.max(...ad.bids.map((b) => b.amount))}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      ad.isClosed ? "status-inactive" : "status-active"
                    }
                  >
                    {ad.isClosed ? "Closed" : "Active"}
                  </span>
                </p>
                <p>
                  <strong>Time Left:</strong> {formatTime(ad.createdAt)}
                </p>
                {ad.isOutbid && (
                  <p className="outbid-msg">⚠️ You’ve been outbid!</p>
                )}
                <button onClick={() => nav(`/product/${ad._id}`)}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
