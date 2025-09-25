import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ;

const localPic = (name) => new URL(`../../pics/${name}`, import.meta.url).href;

const DEVICE_IMAGE_CATALOG = [
  { keywords: ["iphone 15", "iphone15", "iphone"], src: localPic("iphone15.jpg") },
  { keywords: ["galaxy s23", "s23", "samsung"], src: localPic("s23.jpg") },
  { keywords: ["pixel", "google"], src: localPic("pixel8.jpg") },
  { keywords: ["macbook", "apple laptop"], src: localPic("macbookair13.jpg") },
  { keywords: ["ipadair", "ipad", "tablet"], src: localPic("ipadairm2.jpg") },
  { keywords: ["oneplus"], src: localPic("oneplus12.avif") },
  { keywords: ["redmi", "xiaomi"], src: localPic("redmi13pro.png") },
  { keywords: ["pavilion", "hp"], src: localPic("pavillion15.jpg") },
  { keywords: ["sandisk", "ssd", "storage"], src: localPic("sandisk1tb.jpg") },
  { keywords: ["wh-1000", "sony", "headphone"], src: localPic("wh100xm5.png") },
  { keywords: ["keychron", "keyboard"], src: localPic("keychronK2.jpeg") },
  { keywords: ["legion", "gaming"], src: localPic("legion5i.jpeg") },
  { keywords: ["swift", "acer"], src: localPic("swift14.jpg") },
  { keywords: ["matepad", "huawei"], src: localPic("matepad11.jpeg") },
  { keywords: ["tab s9", "s9"], src: localPic("tabs9.png") },
  { keywords: ["logitech", "mouse"], src: localPic("logitechmxmaster3x.png") },
  { keywords: ["tuf", "asus"], src: localPic("tufa15.webp") },
  { keywords: ["keychron k2"], src: localPic("KeychronK2.webp") },
];

const DEFAULT_DEVICE_IMAGE = localPic("pixel8.jpg");

const getDeviceImage = (label) => {
  if (!label) return DEFAULT_DEVICE_IMAGE;
  const key = String(label).toLowerCase();
  const match = DEVICE_IMAGE_CATALOG.find((entry) =>
    entry.keywords.some((kw) => key.includes(kw)),
  );
  return match?.src || DEFAULT_DEVICE_IMAGE;
};

const extractLabel = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.title || value.name || value.model || value.label || "";
  }
  return String(value);
};

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

  const handleRemoveSearch = useCallback(
    async (index, query) => {
      if (!username) return;
      try {
        const res = await fetch(`${API_URL}/api/personalization/activity/search`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, index, query }),
        });
        const payload = await res.json().catch(() => ({}));
        setData((prev) => ({
          ...(prev || {}),
          recentSearches:
            payload?.recentSearches ?? (prev?.recentSearches || []).filter((_, i) => i !== index),
        }));
      } catch (e) {
        setData((prev) => ({
          ...(prev || {}),
          recentSearches: (prev?.recentSearches || []).filter((_, i) => i !== index),
        }));
      }
    },
    [username],
  );

  const handleRemoveComparison = useCallback(
    async (index, timestamp) => {
      if (!username) return;
      try {
        const res = await fetch(`${API_URL}/api/personalization/save-comparison`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, index, timestamp }),
        });
        const payload = await res.json().catch(() => ({}));
        setData((prev) => ({
          ...(prev || {}),
          savedComparisons:
            payload?.savedComparisons ?? (prev?.savedComparisons || []).filter((_, i) => i !== index),
        }));
      } catch (e) {
        setData((prev) => ({
          ...(prev || {}),
          savedComparisons: (prev?.savedComparisons || []).filter((_, i) => i !== index),
        }));
      }
    },
    [username],
  );

  const recentSearches = data?.recentSearches || [];
  const savedComparisons = data?.savedComparisons || [];
  const recentBids = data?.recentBids || [];

  return (
    <div className="dash" style={{ padding: 24 }}>
      <h1 className="dash-title">Welcome back{data?.welcomeName ? `, ${data.welcomeName}` : ""}!</h1>

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

      <div className="dash-content-stack">
        <PreferencesCard
          data={data}
          onSaved={() => {
            fetch(`${API_URL}/api/personalization/dashboard?username=${encodeURIComponent(username)}`)
              .then((r) => r.json())
              .then((d) => setData(d))
              .catch(() => {});
          }}
        />

        <section className="dash-column-grid">
          <div className="column-card column-card--searches" data-animate>
            <div className="column-card__head">
              <div>
                <h3>Recent Searches</h3>
                <p>Pick up where you left off</p>
              </div>
              <button className="column-card__cta" onClick={onResume}>{resumeLabel}</button>
            </div>
            <div className="column-card__items">
              {recentSearches.length === 0 && <div className="column-card__empty">No searches yet.</div>}
              {recentSearches.map((q, i) => {
                const goToSearch = () => nav(`/marketplace?q=${encodeURIComponent(q)}`);
                const onKey = (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    goToSearch();
                  }
                };
                return (
                  <div
                    key={`${q}-${i}`}
                    role="button"
                    tabIndex={0}
                    className="column-item column-item--search"
                    onClick={goToSearch}
                    onKeyDown={onKey}
                  >
                    <div className="column-item__body">
                      <span className="column-item__title">{q}</span>
                      <span className="column-item__meta">Open in marketplace</span>
                    </div>
                    <button
                      type="button"
                      className="column-item__close"
                      aria-label={`Clear search ${q}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSearch(i, q);
                      }}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="column-card column-card--comparisons" data-animate>
            <div className="column-card__head">
              <div>
                <h3>Saved Comparisons</h3>
                <p>Your curated matchups</p>
              </div>
              <button className="column-card__cta" onClick={() => nav("/compare")}>Compare</button>
            </div>
            <div className="column-card__items">
              {savedComparisons.length === 0 && <div className="column-card__empty">No saved comparisons.</div>}
              {savedComparisons.map((c, i) => {
                const items = Array.isArray(c.items) ? c.items : [];
                const labels = items.map(extractLabel).filter(Boolean);
                const primary = labels[0] || "Device A";
                const secondary = labels[1] || labels[0] || "Device B";
                const description = labels.length >= 2 ? `${primary} vs ${secondary}` : primary;
                const resolvePicture = (item, fallbackLabel) => {
                  if (item && typeof item === "object") {
                    const direct = item.thumbnail || item.image || item.imageUrl || item.image_url || item.photo;
                    if (direct) {
                      return /^https?:/i.test(direct) ? direct : `${API_URL}/uploads/${direct}`;
                    }
                  }
                  return getDeviceImage(fallbackLabel);
                };
                const primaryImg = resolvePicture(items[0], primary);
                const secondaryImg = resolvePicture(items[1], secondary);
                const openCompare = () => nav("/compare");
                const onKey = (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openCompare();
                  }
                };
                return (
                  <div
                    key={`${c.ts || i}-comparison`}
                    role="button"
                    tabIndex={0}
                    className="column-item column-item--comparison"
                    onClick={openCompare}
                    onKeyDown={onKey}
                  >
                    <div className="comparison-mini">
                      <img src={primaryImg} alt={primary} onError={(e) => (e.currentTarget.src = DEFAULT_DEVICE_IMAGE)} />
                      <img src={secondaryImg} alt={secondary} onError={(e) => (e.currentTarget.src = DEFAULT_DEVICE_IMAGE)} />
                    </div>
                    <div className="column-item__body">
                      <span className="column-item__title">{c.title || `Compare #${i + 1}`}</span>
                      <span className="column-item__meta">{description || "Saved comparison"}</span>
                    </div>
                    <button
                      type="button"
                      className="column-item__close"
                      aria-label={`Remove comparison ${c.title || i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveComparison(i, c.ts);
                      }}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="column-card column-card--bids" data-animate>
            <div className="column-card__head">
              <div>
                <h3>Your Recent Bids</h3>
                <p>Jump back into the action</p>
              </div>
            </div>
            <div className="column-card__items">
              {recentBids.length === 0 && <div className="column-card__empty">No recent bids.</div>}
              {recentBids.map((b, i) => {
                const title = b.title || b.ad?.title || "Product";
                const goToBid = () => {
                  if (b.adId) nav(`/used-product/${b.adId}`);
                };
                const onKey = (e) => {
                  if ((e.key === "Enter" || e.key === " ") && b.adId) {
                    e.preventDefault();
                    goToBid();
                  }
                };
                const remoteImg = b.ad?.images?.[0] ? `${API_URL}/uploads/${b.ad.images[0]}` : null;
                const thumb = b.ad?.thumbnail;
                const thumbSrc = thumb && /^https?:/i.test(thumb) ? thumb : thumb ? `${API_URL}/uploads/${thumb}` : null;
                const picture = remoteImg || thumbSrc || getDeviceImage(title);
                return (
                  <div
                    key={`${b.adId || i}-bid`}
                    role="button"
                    tabIndex={0}
                    className="column-item column-item--bid"
                    onClick={goToBid}
                    onKeyDown={onKey}
                  >
                    <div className="bid-mini">
                      <img
                        src={picture}
                        alt={title}
                        onError={(e) => {
                          e.currentTarget.src = getDeviceImage(title);
                        }}
                      />
                    </div>
                    <div className="column-item__body">
                      <span className="column-item__title">{title}</span>
                      <span className="column-item__meta">
                        {b.amount ? `LKR ${Number(b.amount).toLocaleString()}` : "Bid placed"}
                      </span>
                      <span className="column-item__meta subtle">
                        {b.ad?.brand || ""}
                        {b.ad?.brand && b.ts ? " • " : ""}
                        {b.ts ? new Date(b.ts).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
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
