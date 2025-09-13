import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";
import "../styles/marketplace.css";
import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

const CATEGORY_GROUPS = [
  {
    label: "Computer Parts",
    subs: [
      "RAM",
      "Motherboard",
      "Graphics Card",
      "Processor",
      "Storage",
      "Power Supply",
    ],
  },
  {
    label: "Smartphones and Tablets",
    subs: ["Smartphones", "Tablets", "Phablets"],
  },
  {
    label: "Laptops and Computers",
    subs: ["Laptops", "Desktops", "All-in-Ones"],
  },
  { label: "Other Items", subs: ["Printers", "Monitors", "Accessories"] },
];

function GridIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function ListIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="4" rx="2" />
      <rect x="3" y="10" width="18" height="4" rx="2" />
      <rect x="3" y="16" width="18" height="4" rx="2" />
    </svg>
  );
}

export default function Marketplace() {
  const nav = useNavigate();
  const location = useLocation();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const [sub, setSub] = useState("All");
  const [view, setView] = useState("grid");
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    // Seed q from URL (for resume search)
    const sp = new URLSearchParams(location.search);
    const qParam = sp.get("q");
    if (qParam) setQ(qParam);

    (async () => {
      try {
        const res = await fetch("/api/ads");
        const data = await res.json();
        const username = localStorage.getItem("username");
        const cleaned = (Array.isArray(data) ? data : [])
          .filter((a) => !/macbook\s*pro\s*m1/i.test(a.title || ""))
          .filter(
            (a) =>
              !a.isClosed ||
              (username && (a.bids || []).some((b) => b.user === username)),
          );
        setAds(cleaned);
      } catch (err) {
        console.error("Error fetching ads:", err);
      } finally {
        setLoading(false);
      }
    })();

    // live update: remove closed/deleted items on the fly
    const token = localStorage.getItem("token");
    const s = io(API_URL, { auth: token ? { token } : {} });
    s.on("ad:deleted", ({ id }) =>
      setAds((prev) => prev.filter((a) => a._id !== id)),
    );
    s.on("ad:closed", ({ id }) =>
      setAds((prev) => {
        const username = localStorage.getItem("username");
        return prev.filter(
          (a) =>
            a._id !== id || (a.bids || []).some((b) => b.user === username),
        );
      }),
    );
    return () => s.disconnect();
  }, [location.search]);

  // Recommendations (contextual)
  useEffect(() => {
    const username = localStorage.getItem("username") || "";
    const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
    fetch(`${API_URL}/api/personalization/recommendations?username=${encodeURIComponent(username)}&device=${device}`)
      .then((r) => r.json())
      .then((d) => setRecs(d.items || []))
      .catch(() => setRecs([]));
  }, []);

  // Record searches (debounced)
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username || !q) return;
    const t = setTimeout(() => {
      fetch(`${API_URL}/api/personalization/activity/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, query: q }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    const norm = (x) => (x || "").toLowerCase().trim();
    const gSel = norm(group);
    const sSel = norm(sub);
    const qSel = norm(q);
    return ads.filter((a) => {
      const titleMatch = !qSel || norm(a.title).includes(qSel);
      // Support both new fields (deviceType/subcategory) and legacy a.category like "Group:Sub"
      const fromCategory = (() => {
        const parts = String(a.category || "").split(":");
        return { g: norm(parts[0]), s: norm(parts[1]) };
      })();
      const aGroup = norm(a.deviceType) || fromCategory.g;
      const aSub = norm(a.subcategory) || fromCategory.s;

      const groupMatch = group === "All" || aGroup === gSel;
      const subMatch = sub === "All" || aSub === sSel;
      return titleMatch && groupMatch && subMatch;
    });
  }, [ads, q, group, sub]);

  if (loading) return <p className="loading">Loading Marketplace...</p>;

  return (
    <div className="marketplace-page">
      <div className="marketplace-header">
        <h1 className="market-title">Used Product Marketplace</h1>
        <div className="market-search">
          <input
            className="market-search-input"
            placeholder="Search by title..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="market-controls">
          <div className="left-controls">
            <button
              onClick={() => setView("grid")}
              className={`toggle-btn ${view === "grid" ? "active" : ""}`}
            >
              <GridIcon />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`toggle-btn ${view === "list" ? "active" : ""}`}
            >
              <ListIcon />
              <span>List</span>
            </button>
          </div>
          <div className="right-controls">
            <button onClick={() => nav("/manage-bids")} className="action-btn action-big">
              Manage Bids
            </button>
            <button
              onClick={() => nav("/manage-auction")}
              className="action-btn action-big"
            >
              Manage Auction
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="market-filters">
        <select
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setSub("All");
          }}
        >
          <option value="All">All Groups</option>
          {CATEGORY_GROUPS.map((g) => (
            <option key={g.label} value={g.label}>
              {g.label}
            </option>
          ))}
        </select>
        <select value={sub} onChange={(e) => setSub(e.target.value)}>
          <option value="All">All Subcategories</option>
          {(CATEGORY_GROUPS.find((g) => g.label === group)?.subs || []).map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>
      </div>

      {/* You might also like */}
      {recs.length > 0 && (
        <div style={{ margin: "12px 0" }}>
          <h2 style={{ marginBottom: 8 }}>You might also like</h2>
          <div className="market-grid">
            {recs.slice(0, 8).map((ad) => (
              <Card key={`r-${ad._id}`} ad={ad} onClick={() => nav(`/used-product/${ad._id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="market-results">
        {filtered.length === 0 ? (
          <p>No matching ads found.</p>
        ) : view === "grid" ? (
          <div className="market-grid">
            {filtered.map((ad) => (
              <Card
                key={ad._id}
                ad={ad}
                onClick={() => nav(`/used-product/${ad._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="market-list">
            {filtered.map((ad) => (
              <Row
                key={ad._id}
                ad={ad}
                onClick={() => nav(`/used-product/${ad._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function imgForAd(ad) {
  if (Array.isArray(ad.images) && ad.images.length) {
    return `${API_URL}/uploads/${ad.images[0]}`;
  }
  return ad.thumbnail || "/fallback.jpg";
}

function Card({ ad, onClick }) {
  return (
    <div onClick={onClick} className="market-card hover-scale fade-up">
      <div
        style={{
          width: "100%",
          height: 160,
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <img
          src={imgForAd(ad)}
          alt=""
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
        />
      </div>
      <h4>{ad.title}</h4>
      <p>
        <strong>Brand:</strong> {ad.brand || "—"}
        <br />
        <strong>Price:</strong> LKR {Number(ad.price).toLocaleString()}
        <br />
        <strong>Condition:</strong> {ad.condition || "—"}
      </p>
    </div>
  );
}

function Row({ ad, onClick }) {
  return (
    <div onClick={onClick} className="market-row hover-highlight fade-up">
      <div
        style={{
          width: 120,
          height: 90,
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
        }}
      >
        <img
          src={imgForAd(ad)}
          alt=""
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
        />
      </div>
      <div>
        <h4>{ad.title}</h4>
        <p>
          <strong>Brand:</strong> {ad.brand || "—"}
          <br />
          <strong>Price:</strong> LKR {Number(ad.price).toLocaleString()}
          <br />
          <strong>Condition:</strong> {ad.condition || "—"}
        </p>
      </div>
    </div>
  );
}
