import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ;

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (!username) return nav("/login");
    fetch(`${API_URL}/api/personalization/dashboard?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({}));
  }, [username, nav]);

  const resumeLabel = useMemo(() => {
    const a = data?.lastActivity;
    if (!a || a.type === "none") return "Browse Marketplace";
    if (a.type === "search") return `Search: ${a.data?.query || "Marketplace"}`;
    if (a.type === "bid") return "Open last bid";
    if (a.type === "compare") return "Resume comparison";
    if (a.type === "view") return "Back to product";
    if (a.type === "chat") return "Open chat";
    return "Resume Last Activity";
  }, [data]);

  const onResume = () => {
    const a = data?.lastActivity;
    if (!a || a.type === "none") return nav("/marketplace");
    switch (a.type) {
      case "search":
        return nav(`/marketplace?q=${encodeURIComponent(a.data?.query || "")}`);
      case "bid":
      case "view":
        if (a.data?.adId) return nav(`/used-product/${a.data.adId}`);
        break;
      case "compare":
        return nav("/compare");
      case "chat":
        return nav("/manage-auction");
      default:
        return nav("/marketplace");
    }
  };

  return (
    <div className="dash" style={{ padding: 24 }}>
      <h1 className="dash-title">Welcome back{data?.welcomeName ? `, ${data.welcomeName}` : ""}!</h1>
      {/* Removed persona subtitle under welcome back */}

      {/* Floating Quick Actions (expands on hover) */}
      <div className="qa-fab">
        <div className="qa-fab-main">Quick Actions ▸</div>
        <div className="qa-fab-panel">
          <button className="qa-btn" onClick={() => nav("/")}>Open AI Assistant</button>
          <button className="qa-btn" onClick={() => nav("/marketplace")}>
            Browse Marketplace
          </button>
          <button className="qa-btn" onClick={() => nav("/compare")}>
            Compare Devices
          </button>
        </div>
      </div>

      {/* Stacked cards */}
      <div style={{ display: "grid", gap: 16 }}>
        <PreferencesCard data={data} onSaved={() => {
          // refetch
          fetch(`${API_URL}/api/personalization/dashboard?username=${encodeURIComponent(username)}`)
            .then((r) => r.json())
            .then((d) => setData(d))
            .catch(() => {});
        }} />
        <div className="market-card">
          <div className="dash-card-head">
            <h3>Recent Searches</h3>
            <button className="btn btn-secondary" onClick={onResume}>{resumeLabel}</button>
          </div>
          <ul style={{ marginTop: 8 }}>
            {(data?.recentSearches || []).length === 0 && <li>No searches yet.</li>}
            {(data?.recentSearches || []).map((q, i) => (
              <li key={i}>
                <a href={`/marketplace?q=${encodeURIComponent(q)}`}>{q}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="market-card">
          <div className="dash-card-head"><h3>Saved Comparisons</h3></div>
          <ul style={{ marginTop: 8 }}>
            {(data?.savedComparisons || []).length === 0 && <li>No saved comparisons.</li>}
            {(data?.savedComparisons || []).map((c, i) => (
              <li key={i}>{c.title || `Compare #${i + 1}`} ({(c.items || []).length} items)</li>
            ))}
          </ul>
        </div>

        <div className="market-card">
          <div className="dash-card-head"><h3>Your Recent Bids</h3></div>
          <ul style={{ marginTop: 8 }}>
            {(data?.recentBids || []).length === 0 && <li>No recent bids.</li>}
            {(data?.recentBids || []).map((b, i) => (
              <li key={i}>
                <a href={`/used-product/${b.adId}`}>{b.title || b.ad?.title || "Product"}</a>
                {b.amount ? ` – LKR ${Number(b.amount).toLocaleString()}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Recommendations username={username} />
    </div>
  );
}

function TagPicker({ tags, value = [], onChange, max = 5 }) {
  const toggle = (t) => {
    const has = value.includes(t);
    let next = has ? value.filter((x) => x !== t) : [...value, t];
    if (!has && next.length > max) return; // cap
    onChange && onChange(next);
  };
  return (
    <div className="tag-picker">
      {tags.map((t) => (
        <button
          key={t}
          type="button"
          className={`tag-chip ${value.includes(t) ? "selected" : ""}`}
          onClick={() => toggle(t)}
        >
          {t}
        </button>
      ))}
      <div className="tag-hint">Select up to {max}</div>
    </div>
  );
}

function PreferencesCard({ data, onSaved }) {
  const [persona, setPersona] = useState(data?.persona || "General");
  const [budgetRange, setBudgetRange] = useState(data?.preferences?.budgetRange || "");
  const parseBudget = (str) => {
    if (!str) return [0, 1000000];
    const nums = String(str).match(/\d+/g)?.map((x) => Number(x)) || [];
    if (nums.length >= 2) return [nums[0], nums[1]];
    if (nums.length === 1) return [0, nums[0]];
    return [0, 1000000];
  };
  const [minP, setMinP] = useState(parseBudget(budgetRange)[0]);
  const [maxP, setMaxP] = useState(parseBudget(budgetRange)[1]);
  // Tag pickers
  const PERSONA_TAGS = [
    "Gamer","Student","Creator","Professional","Casual","Power User","Photographer","Videographer","Developer","Office"
  ];
  const DEVICE_TAGS = [
    "Apple","Windows","Android","iPhone","MacBook","iPad","Gaming Laptop","Ultrabook","MSI","ASUS","Acer","Lenovo","Dell","Samsung","Sony","HP","NVIDIA RTX","AMD Ryzen","Console","Monitor"
  ];
  const [personaTags, setPersonaTags] = useState(data?.preferences?.personaTags || []);
  const [deviceTags, setDeviceTags] = useState(data?.preferences?.deviceTags || []);
  const username = localStorage.getItem("username");

  useEffect(() => {
    setPersona(data?.persona || "General");
    const br = data?.preferences?.budgetRange || "";
    setBudgetRange(br);
    const [mn, mx] = parseBudget(br);
    setMinP(mn);
    setMaxP(mx);
    setPersonaTags(Array.isArray(data?.preferences?.personaTags) ? data.preferences.personaTags : []);
    setDeviceTags(Array.isArray(data?.preferences?.deviceTags) ? data.preferences.deviceTags : []);
  }, [data]);

  const save = async () => {
    await fetch(`${API_URL}/api/personalization/preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        persona,
        preferences: { budgetRange: `LKR ${minP}-${maxP}`, personaTags, deviceTags },
      }),
    }).catch(() => {});
    onSaved && onSaved();
  };

  return (
    <div className="market-card">
      <div className="dash-card-head"><h3>Your Preferences</h3></div>
      <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
        <div className="dash-subtitle">Persona</div>
        <TagPicker tags={PERSONA_TAGS} value={personaTags} onChange={(v) => setPersonaTags(v)} max={5} />
        <div className="dash-subtitle" style={{ marginTop: 6 }}>Device Preferences</div>
        <TagPicker tags={DEVICE_TAGS} value={deviceTags} onChange={(v) => setDeviceTags(v)} max={5} />
        <div>
          <div className="dash-subtitle" style={{ marginBottom: 6 }}>Price</div>
          <div className="range-wrap">
            <div className="range-row">
              <input
                type="range"
                min={0}
                max={1000000}
                step={5000}
                value={minP}
                onChange={(e) => {
                  const v = Math.min(Number(e.target.value), maxP - 5000);
                  setMinP(v);
                  setBudgetRange(`LKR ${v}-${maxP}`);
                }}
              />
              <input
                type="range"
                min={0}
                max={1000000}
                step={5000}
                value={maxP}
                onChange={(e) => {
                  const v = Math.max(Number(e.target.value), minP + 5000);
                  setMaxP(v);
                  setBudgetRange(`LKR ${minP}-${v}`);
                }}
              />
            </div>
            <div className="range-label">Price: LKR {minP.toLocaleString()} — LKR {maxP.toLocaleString()}</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}

function Recommendations({ username }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
    fetch(`${API_URL}/api/personalization/recommendations?username=${encodeURIComponent(username || "")}&device=${device}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, [username]);

  if (!items.length) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <h2 style={{ fontSize: 24 }}>You might also like</h2>
      <div className="market-grid" style={{ marginTop: 8 }}>
        {items.map((ad) => (
          <a key={ad._id} className="market-card" href={`/used-product/${ad._id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ width: "100%", height: 140, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
              <img
                src={ad.images?.[0] ? `${API_URL}/uploads/${ad.images[0]}` : ad.thumbnail || "/fallback.jpg"}
                alt={ad.title}
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
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
