import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/manageBids.css";

const API_URL = import.meta.env.VITE_API_URL;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const computeTimeMeta = (createdAt) => {
  const closeInMs = 1000 * 60 * 60 * 24 * 2; // 48h bidding window
  const expiry = new Date(createdAt).getTime() + closeInMs;
  const left = expiry - Date.now();
  if (left <= 0) return { label: "Closed", status: "closed" };
  const hrs = Math.floor(left / (1000 * 60 * 60));
  const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
  return { label: `${hrs}h ${mins}m`, status: hrs < 2 ? "urgent" : "open" };
};

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
          const adBids = Array.isArray(ad.bids) ? ad.bids : [];
          const myBid = adBids.find((b) => b.user === username);
          if (!myBid) return;

          const highest = adBids.length
            ? Math.max(...adBids.map((b) => Number(b.amount) || 0))
            : 0;

          mine.push({
            ...ad,
            yourBid: Number(myBid.amount) || 0,
            highestBid: highest,
            isOutbid: highest > (Number(myBid.amount) || 0),
          });
        });

        setBids(mine);
      } catch (err) {
        console.error("Failed to load bids", err);
        setBids([]);
      }
    };

    fetchBids();
  }, []);

  return (
    <div className="manage-bids-page">
      <header className="bids-hero">
        <div className="bids-hero__title">
          <p className="eyebrow">Auction Tracker</p>
          <h1>Your Bids</h1>
        </div>
        <div className="bids-hero__meta">
          <span className="meta-pill">Total bids: {bids.length}</span>
          <span className="meta-pill meta-pill--alert">
            {bids.filter((b) => b.isOutbid && !b.isClosed).length} need attention
          </span>
        </div>
      </header>

      {bids.length === 0 ? (
        <div className="bids-empty">
          <h3>No bids yet</h3>
          <p>
            Place a bid in the marketplace to see it appear here with live
            updates.
          </p>
          <button className="cta" onClick={() => nav("/marketplace")}>
            Browse marketplace
          </button>
        </div>
      ) : (
        <div className="bids-list">
          {bids.map((ad) => {
            const timeMeta = computeTimeMeta(ad.createdAt);
            const thumb = ad.images?.[0]
              ? `${API_URL}/uploads/${ad.images[0]}`
              : ad.thumbnail || "/fallback.jpg";
            return (
              <article key={ad._id} className="bid-card" data-status={ad.isClosed ? "closed" : "active"}>
                <div className="bid-card__media">
                  <img
                    src={thumb}
                    alt={ad.title}
                    onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
                  />
                  {ad.isClosed ? (
                    <span className="badge badge--closed">Closed</span>
                  ) : (
                    <span className="badge badge--open">Live</span>
                  )}
                </div>
                <div className="bid-card__body">
                  <div className="bid-card__head">
                    <h2>{ad.title}</h2>
                    <div className="price-meta">
                      <span className="price-meta__label">Your bid</span>
                      <span className="price-meta__value">
                        {formatCurrency(ad.yourBid)}
                      </span>
                    </div>
                  </div>
                  <div className="bid-card__grid">
                    <div className="info-block">
                      <p className="info-title">Highest offer</p>
                      <p className="info-value">{formatCurrency(ad.highestBid)}</p>
                    </div>
                    <div className="info-block">
                      <p className="info-title">Time left</p>
                      <p className={`info-value time-${timeMeta.status}`}>
                        {timeMeta.label}
                      </p>
                    </div>
                    <div className="info-block">
                      <p className="info-title">Category</p>
                      <p className="info-value subtle">
                        {ad.subcategory || ad.deviceType || "—"}
                      </p>
                    </div>
                    <div className="info-block">
                      <p className="info-title">Condition</p>
                      <p className="info-value subtle">
                        {ad.condition || "Not provided"}
                      </p>
                    </div>
                  </div>
                  {ad.isOutbid && !ad.isClosed && (
                    <div className="alert-chip">
                      <span role="img" aria-label="alert">
                        ⚠️
                      </span>{" "}
                      You’ve been outbid. Raise your offer to get back on top.
                    </div>
                  )}
                </div>
                <div className="bid-card__actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() =>
                      nav(`/marketplace?q=${encodeURIComponent(ad.title || "")}`)
                    }
                  >
                    Browse similar
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => nav(`/used-product/${ad._id}`)}
                  >
                    View details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
