import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import curatedProducts from "../data/curatedProducts";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  // Advanced filters
  const [ramOption, setRamOption] = useState("Any"); // Any, lt8, 8, 12, 16, 32, 32plus
  const [vgaOption, setVgaOption] = useState("Any"); // laptops only
  const [batteryMin, setBatteryMin] = useState("Any"); // phones/tablets only: Any, 4000, 5000, 6000, 8000
  const [coresMin, setCoresMin] = useState("Any"); // laptops only: Any, 4, 6, 8, 12, 16
  // DB compare ids (legacy)
  const [compareList, setCompareList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("compare")) || [];
    } catch {
      return [];
    }
  });
  // AI/curated compare entries
  const [compareAI, setCompareAI] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("compare_ai")) || [];
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();

  const location = useLocation();

  // Load curated catalog (replaces previous dynamic fetches for this UI)
  useEffect(() => {
    // keep as sync work; trivial
    setProducts(curatedProducts);
    setLoading(false);
  }, []);

  // Apply category from query string (e.g., /products?category=smartphones)
  const qsCategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("category") || "").toLowerCase();
  }, [location.search]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    if (!qsCategory) return;
    const categories = [
      "All",
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    // find case-insensitive match by stripping spaces
    const match = categories.find(
      (c) => c && c.toLowerCase().replace(/\s+/g, "") === qsCategory,
    );
    if (match) setCategoryFilter(match);
  }, [qsCategory, products]);

  // Filter helpers
  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products],
  );
  const brands = useMemo(
    () => [
      "All",
      ...new Set(
        products
          .map((p) => p?.specs?.brand)
          .filter(Boolean)
          .sort((a, b) => String(a).localeCompare(String(b))),
      ),
    ],
    [products],
  );

  // Helpers to parse specs
  const getRamGB = (s) => {
    if (!s) return null;
    const m = String(s).match(/(\d+)(?=\s*gb)/i);
    return m ? Number(m[1]) : null;
  };
  const getBatteryMah = (s) => {
    if (!s) return null;
    const m = String(s).replace(/[,\s]/g, " ").match(/(\d{3,5})(?=\s*m?ah)/i);
    return m ? Number(m[1]) : null;
  };
  const getGpu = (s) => (s ? String(s).toLowerCase() : "");
  const getCores = (cpu) => {
    const t = String(cpu || "").toLowerCase();
    // direct "8-core" style
    const m = t.match(/(\d+)\s*-?\s*core/);
    if (m) return Number(m[1]);
    // heuristics for common chips in curated data
    if (/13700h/.test(t)) return 14;
    if (/1240p/.test(t)) return 12;
    if (/7735hs/.test(t)) return 8;
    if (/m2/.test(t)) return 8;
    if (/ultra\s*5/.test(t)) return 12;
    return null;
  };

  const handleCompareToggle = (productId) => {
    setCompareList((prev) => {
      let updated;
      if (prev.includes(productId)) {
        updated = prev.filter((id) => id !== productId);
      } else {
        if (prev.length >= 2) {
          alert("You can only compare 2 products at a time.");
          return prev;
        }
        updated = [...prev, productId];
      }
      localStorage.setItem("compare", JSON.stringify(updated));
      return updated;
    });
  };

  const handleViewProduct = (product) => {
    if (product.link) {
      window.open(product.link, "_blank", "noopener,noreferrer");
    } else {
      navigate(`/product/${encodeURIComponent(product.title)}`, {
        state: { product },
      });
    }
  };

  const handleCompareAIToggle = (product) => {
    setCompareAI((prev) => {
      const list = Array.isArray(prev) ? prev.slice() : [];
      const id = product.id || product._id || product.title;
      const exists = list.find((p) => p.id === id);
      if (exists) {
        const updated = list.filter((p) => p.id !== id);
        localStorage.setItem("compare_ai", JSON.stringify(updated));
        return updated;
      }
      if (list.length >= 2) {
        alert("You can only compare 2 products at a time.");
        return list;
      }
      // Enforce same-category comparisons (e.g., phone vs phone)
      if (list.length === 1) {
        const c1 = String(list[0]?.category || "").toLowerCase();
        const c2 = String(product.category || "").toLowerCase();
        if (c1 && c2 && c1 !== c2) {
          alert("Please compare similar types only (e.g., phones with phones).");
          return list;
        }
      }
      const entry = {
        id,
        title: product.title,
        thumbnail: product.thumbnail,
        price: product.price || null,
        rating: product.rating || null,
        category: product.category,
        source: "curated",
        specs: product.specs || undefined,
      };
      const updated = [...list, entry];
      localStorage.setItem("compare_ai", JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) return <p className="loading">Loading products...</p>;
  if (products.length === 0)
    return <p className="no-products">No products available.</p>;

  const filteredProducts = (products || [])
    .filter((p) => (categoryFilter === "All" ? true : p.category === categoryFilter))
    .filter((p) => (brandFilter === "All" ? true : (p.specs?.brand || "") === brandFilter))
    .filter((p) => {
      // RAM filter
      if (ramOption === "Any") return true;
      const r = getRamGB(p.specs?.ram);
      if (r == null) return true;
      if (ramOption === "lt8") return r < 8;
      if (ramOption === "32plus") return r >= 32;
      const target = Number(ramOption);
      return r === target;
    })
    .filter((p) => {
      // VGA filter (laptops only)
      if (vgaOption === "Any") return true;
      if (p.category !== "Laptops") return true;
      const g = getGpu(p.specs?.gpu);
      return g.includes(vgaOption.toLowerCase());
    })
    .filter((p) => {
      // Battery min (phones/tablets only)
      if (batteryMin === "Any") return true;
      if (!(p.category === "Smartphones" || p.category === "Tablets")) return true;
      const b = getBatteryMah(p.specs?.battery);
      if (b == null) return true;
      return b >= Number(batteryMin);
    })
    .filter((p) => {
      // Cores (laptops only)
      if (coresMin === "Any") return true;
      if (p.category !== "Laptops") return true;
      const c = getCores(p.specs?.cpu);
      if (c == null) return true;
      return c >= Number(coresMin);
    });

  const onCardClick = (product) => handleViewProduct(product);

  // Personal preferences filter
  const applyPersonalPreferences = async () => {
    try {
      const username = localStorage.getItem("username") || "";
      if (!username) return alert("Login to use personal preferences.");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL }/api/personalization/dashboard?username=${encodeURIComponent(
          username,
        )}`,
      );
      const d = await res.json();
      const personaTags = d?.preferences?.personaTags || [];
      const deviceTags = d?.preferences?.deviceTags || [];
      const br = String(d?.preferences?.budgetRange || "");
      const nums = br.match(/\d+/g)?.map((n) => Number(n)) || [];
      const min = nums[0] || 0;
      const max = nums[1] || Infinity;
      const tags = [...personaTags, ...deviceTags].map((x) => String(x).toLowerCase());
      setCategoryFilter("All");
      setBrandFilter("All");
      setProducts(
        curatedProducts.filter((p) => {
          const text = `${p.title} ${p.category} ${p.specs?.brand || ""}`.toLowerCase();
          const matchTags = tags.length ? tags.some((t) => text.includes(t)) : true;
          const matchPrice = typeof p.price === "number" ? p.price >= min && p.price <= max : true;
          return matchTags && matchPrice;
        }),
      );
    } catch (e) {
      console.warn("preferences filter failed", e);
    }
  };

  return (
    <div className="products-page">
      <aside className="products-sidebar">
        <div className="filter-card">
          <div className="filter-title">Sort by</div>
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select className="filter-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Brand</label>
            <select className="filter-input" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">RAM</label>
            <select className="filter-input" value={ramOption} onChange={(e) => setRamOption(e.target.value)}>
              <option>Any</option>
              <option value="lt8">Less than 8 GB</option>
              <option value="8">8 GB</option>
              <option value="12">12 GB</option>
              <option value="16">16 GB</option>
              <option value="32">32 GB</option>
              <option value="32plus">32+ GB</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">GPU (Laptops)</label>
            <select className="filter-input" value={vgaOption} onChange={(e) => setVgaOption(e.target.value)} disabled={categoryFilter !== "Laptops" && categoryFilter !== "All"}>
              <option>Any</option>
              {"RTX 3050,RTX 3060,RTX 4050,RTX 4060,RTX 4070,RTX 4080,RTX 4090".split(",").map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Battery min (mAh)</label>
            <select className="filter-input" value={batteryMin} onChange={(e) => setBatteryMin(e.target.value)} disabled={!(categoryFilter === "All" || categoryFilter === "Smartphones" || categoryFilter === "Tablets") }>
              <option>Any</option>
              {['4000','5000','6000','8000'].map((n)=> (
                <option key={n} value={n}>{`≥ ${Number(n).toLocaleString()} mAh`}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">CPU cores (Laptops)</label>
            <select className="filter-input" value={coresMin} onChange={(e) => setCoresMin(e.target.value)} disabled={categoryFilter !== "Laptops" && categoryFilter !== "All"}>
              <option>Any</option>
              {['4','6','8','12','16'].map((n)=> (
                <option key={n} value={n}>{`${n}+ cores`}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={applyPersonalPreferences}>
            Sort by Personal Preferences
          </button>
        </div>
      </aside>

      <main className="products-main">
        <h2 className="page-title products-title">Explore Products</h2>
        <div className="products-grid vs-grid vs-two-col">
          {filteredProducts.map((p) => {
            const selected = !!compareAI.find((i) => (i.id || i._id) === (p.id || p._id));
            return (
              <div key={p._id} className="vs-card vs-long" onClick={() => onCardClick(p)}>
                <button
                  className={`vs-plus vs-plus-lg ${selected ? "selected" : ""}`}
                  title={selected ? "Remove from compare" : "Add to compare"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompareAIToggle(p);
                  }}
                >
                  {selected ? "✓" : "+"}
                </button>
                <div className="vs-img-wrap vs-long-img">
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    onError={(e) => {
                      // Hide broken image and display text fallback
                      e.currentTarget.style.display = 'none';
                      const F = e.currentTarget.parentNode.querySelector('.vs-noimg');
                      if (F) F.style.display = 'grid';
                    }}
                  />
                  <div className="vs-noimg" style={{ display: p.thumbnail ? 'none' : 'grid' }}>{p.title}</div>
                </div>
                <div className="vs-body vs-long-body">
                  <div className="vs-title vs-long-title">{p.title}</div>
                  <div className="vs-long-specrow">
                    {p.specs?.cpu && (
                      <span className="spec-chip">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>
                        <span className="spec-text">{p.specs.cpu}</span>
                      </span>
                    )}
                    {p.specs?.gpu && (
                      <span className="spec-chip">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3 6 4-12 3 6h4"/></svg>
                        <span className="spec-text">{p.specs.gpu}</span>
                      </span>
                    )}
                    {p.specs?.displaySize && (
                      <span className="spec-chip">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M7 21h10"/></svg>
                        <span className="spec-text">{p.specs.displaySize}"</span>
                      </span>
                    )}
                    {p.specs?.ram && (
                      <span className="spec-chip">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6 7v-2M10 7v-2M14 7v-2M18 7v-2"/></svg>
                        <span className="spec-text">{p.specs.ram}</span>
                      </span>
                    )}
                    {p.specs?.battery && (
                      <span className="spec-chip">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-4"/></svg>
                        <span className="spec-text">{p.specs.battery}</span>
                      </span>
                    )}
                    {p.specs?.storage && (
                      <span className="spec-chip">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/></svg>
                        <span className="spec-text">{p.specs.storage}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating comparison tray */}
      <div className={`vs-tray ${compareAI.length ? "open" : ""}`}>
        <div className="vs-tray-head">Comparison list</div>
        <div className="vs-tray-list">
          {compareAI.slice(0, 3).map((i) => (
            <div key={i.id || i._id} className="vs-tray-item">
              <img src={i.thumbnail || "/fallback.jpg"} alt={i.title} />
              <span className="vs-tray-title">{i.title}</span>
              <button className="vs-remove" onClick={() => handleCompareAIToggle(i)}>×</button>
            </div>
          ))}
        </div>
        <button className="btn-secondary" disabled={compareAI.length < 2} onClick={() => navigate("/compare")}>
          Compare
        </button>
      </div>
    </div>
  );
}
