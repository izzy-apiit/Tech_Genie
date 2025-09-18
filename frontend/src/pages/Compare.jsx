import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import curatedProducts from "../data/curatedProducts";
const API_URL = import.meta.env.VITE_API_URL ;

export default function Compare() {
  const navigate = useNavigate();
  const tipsRef = useRef(null);
  const [showTop, setShowTop] = useState(false);
  const [compareList, setCompareList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("compare")) || [];
    } catch {
      return [];
    }
  });
  const [compareAI, setCompareAI] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("compare_ai")) || [];
    } catch {
      return [];
    }
  });
  const [products, setProducts] = useState([]);

  // Prefer local images from /pics when a matching product title is detected
  const localPic = (name) => new URL(`../../pics/${name}`, import.meta.url).href;
  const localImageFor = (title = "", category = "") => {
    const t = String(title).toLowerCase();
    const c = String(category).toLowerCase();
    if (/iphone\s*15/.test(t)) return localPic("iphone15.jpg");
    if (/galaxy\s*s23/.test(t)) return localPic("s23.jpg");
    if (/pixel\s*8/.test(t)) return localPic("pixel8.jpg");
    if (/one\s*plus\s*12|oneplus\s*12/.test(t)) return localPic("oneplus12.avif");
    if (/redmi\s*note\s*13\s*pro/.test(t)) return localPic("redmi13pro.png");
    if (/macbook\s*air\s*13|m2/.test(t)) return localPic("macbookair13.jpg");
    if (/legion\s*5/i.test(t)) return localPic("legion5i.jpeg");
    if (/pavilion\s*15/i.test(t)) return localPic("pavillion15.jpg");
    if (/swift\s*go\s*14/i.test(t)) return localPic("swift14.jpg");
    if (/mx\s*master|logitech/i.test(t)) return localPic("logitechmxmaster3x.png");
    if (/keychron\s*k2/i.test(t)) return localPic("KeychronK2.webp");
    if (/wh[-\s]?1000xm5|xm5|sony\s*headphones/i.test(t)) return localPic("wh100xm5.png");
    if (/sandisk|extreme\s*1tb/i.test(t)) return localPic("sandisk1tb.jpg");
    if (/anker\s*120w|737/i.test(t)) return localPic("anker120W.jpg");
    // fallbacks by category if desired later
    return null;
  };

  // ---------- Spec helpers ----------
  const toNumber = (v) => {
    if (v == null) return null;
    if (typeof v === "number" && !isNaN(v)) return v;
    const s = String(v);
    const m = s.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  };

  const extractGB = (v) => {
    if (!v) return null;
    const s = String(v).toLowerCase();
    const mb = s.match(/(\d+(?:\.\d+)?)\s*mb/);
    if (mb) return Number(mb[1]) / 1024;
    const gb = s.match(/(\d+(?:\.\d+)?)\s*gb/);
    if (gb) return Number(gb[1]);
    const tb = s.match(/(\d+(?:\.\d+)?)\s*tb/);
    if (tb) return Number(tb[1]) * 1024;
    return toNumber(v);
  };

  const resolutionScore = (v) => {
    if (!v) return null;
    const s = String(v).toLowerCase();
    if (/(\d{3,4})\s*[x×]\s*(\d{3,4})/.test(s)) {
      const m = s.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/);
      return Math.max(Number(m[1]), Number(m[2]));
    }
    if (/4k|uhd|2160p/.test(s)) return 2160;
    if (/qhd|1440p/.test(s)) return 1440;
    if (/fhd|1080p/.test(s)) return 1080;
    if (/720p|\bhd\b/.test(s)) return 720;
    return toNumber(v);
  };

  const wifiRank = (v) => {
    if (!v) return null;
    const s = String(v).toLowerCase();
    if (/wi-?fi\s*7|802\.11be/.test(s)) return 7;
    if (/wi-?fi\s*6e/.test(s)) return 6.5;
    if (/wi-?fi\s*6|802\.11ax/.test(s)) return 6;
    if (/wi-?fi\s*5|802\.11ac/.test(s)) return 5;
    if (/802\.11n/.test(s)) return 4;
    return toNumber(v);
  };

  const bluetoothRank = (v) => {
    const n = toNumber(v);
    return n == null ? null : n;
  };

  const gpuRank = (v) => {
    if (!v) return null;
    const s = String(v).toLowerCase();
    const rtx = s.match(/rtx\s*(\d{3,4})/);
    if (rtx) return 3000 + Number(rtx[1]);
    const gtx = s.match(/gtx\s*(\d{3,4})/);
    if (gtx) return 2000 + Number(gtx[1]);
    const rx = s.match(/\brx\s*(\d{3,4,5,6})/);
    if (rx) return 2500 + Number(rx[1]);
    return toNumber(v);
  };

  const cpuRank = (v) => {
    if (!v) return null;
    const s = String(v).toLowerCase();
    const intel = s.match(/i([3579])-?(\d{4,5})?\w*/);
    if (intel) return 1000 * Number(intel[1]) + (Number(intel[2]) || 0);
    const ryzen = s.match(/ryzen\s*(\d)\s*(\d{3,4})?/);
    if (ryzen) return 1000 * (Number(ryzen[1]) + 3) + (Number(ryzen[2]) || 0);
    const apple = s.match(/\bm(1|2|3|4)\b/);
    if (apple) return 5000 + Number(apple[1]);
    return toNumber(v);
  };

  const weightScore = (v) => {
    if (!v) return null;
    const s = String(v).toLowerCase();
    if (/kg/.test(s)) return -Number(s.replace(/[^\d.]/g, ""));
    if (/g/.test(s)) return -Number(s.replace(/[^\d.]/g, "")) / 1000;
    return -toNumber(v);
  };

  const boolRank = (v) => (v ? 1 : 0);

  const parseFromTitle = (title = "") => {
    const s = String(title);
    const ram = s.match(/(\d+\s*gb)\s*ram/i)?.[1] || s.match(/(\d+\.?\d*)\s*gb/i)?.[1];
    const storage = s.match(/(\d+\s*(?:tb|gb))\s*(ssd|hdd|ufs)?/i)?.[0];
    const size = s.match(/(\d{1,2}(?:\.\d)?)"?/i)?.[1];
    const hz = s.match(/(\d{2,3})\s*hz/i)?.[1];
    const res = /\b(4k|qhd|1440p|fhd|1080p|720p|\d{3,4}\s*[x×]\s*\d{3,4})\b/i.exec(s)?.[0];
    const cpu = s.match(/(i[3579]-?\d{4,5}\w*|ryzen\s*\d\s*\d{3,4}|m[1-4])/i)?.[0];
    const gpu = s.match(/(rtx\s*\d{3,4}|gtx\s*\d{3,4}|rx\s*\d{3,4})/i)?.[0];
    return {
      ram,
      storage,
      displaySize: size,
      refreshRate: hz ? `${hz} Hz` : undefined,
      displayResolution: res,
      cpu,
      gpu,
    };
  };

  const readSpec = (p, key) => {
    const s = p?.specs || {};
    const title = p?.title || "";
    const fallback = parseFromTitle(title);
    const keys = {
      brand: ["brand"],
      cpu: ["cpu", "processor", "chipset"],
      gpu: ["gpu", "graphics"],
      ram: ["ram", "memory"],
      storage: ["storage"],
      displaySize: ["display_size", "screen_size", "size"],
      displayResolution: ["display_resolution", "resolution"],
      refreshRate: ["refresh_rate", "hz"],
      brightness: ["brightness"],
      battery: ["battery", "battery_capacity"],
      charging: ["charging", "charging_speed"],
      ports: ["ports", "connectivity"],
      os: ["os", "operating_system"],
      build: ["build", "material"],
      weight: ["weight"],
      camera: ["camera"],
      speakers: ["speakers", "audio"],
      wifi: ["wifi", "wi_fi"],
      bluetooth: ["bluetooth"],
      fingerprint: ["fingerprint", "face_unlock", "biometrics"],
      ip: ["ip_rating", "waterproof", "dustproof"],
    }[key];

    if (!keys) return undefined;
    for (const k of keys) {
      if (s[k] != null) return s[k];
    }
    if (key === "brand" && (p.brand || p.category)) return p.brand || p.category;
    if (key === "ram") return fallback.ram;
    if (key === "storage") return fallback.storage;
    if (key === "displaySize") return fallback.displaySize;
    if (key === "displayResolution") return fallback.displayResolution;
    if (key === "refreshRate") return fallback.refreshRate;
    if (key === "cpu") return fallback.cpu;
    if (key === "gpu") return fallback.gpu;
    return undefined;
  };

  const betterTick = (leftScore, rightScore, neutral = false) => {
    if (neutral || leftScore == null || rightScore == null) return [false, false];
    if (leftScore === rightScore) return [false, false];
    return [leftScore > rightScore, rightScore > leftScore];
  };

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to load products:", err));
  }, []);

  const product1 = products.find((p) => p._id === compareList[0]);
  const product2 = products.find((p) => p._id === compareList[1]);

  const resetComparison = () => {
    localStorage.removeItem("compare");
    localStorage.removeItem("compare_ai");
    setCompareList([]);
    setCompareAI([]);
    navigate("/products");
  };

  const saveComparison = async () => {
    try {
      const username = localStorage.getItem("username");
      if (!username) return navigate("/login");
      let title = "Comparison";
      let items = [];
      if (compareList.length >= 2 && product1 && product2) {
        title = `${product1.title} vs ${product2.title}`;
        items = [
          { id: product1._id, title: product1.title, thumbnail: product1.thumbnail },
          { id: product2._id, title: product2.title, thumbnail: product2.thumbnail },
        ];
      } else if (compareAI.length >= 2) {
        title = `${compareAI[0]?.title || "Device 1"} vs ${compareAI[1]?.title || "Device 2"}`;
        items = [
          { title: compareAI[0]?.title, thumbnail: compareAI[0]?.thumbnail },
          { title: compareAI[1]?.title, thumbnail: compareAI[1]?.thumbnail },
        ];
      } else {
        return;
      }
      await fetch(`${API_URL}/api/personalization/save-comparison`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, title, items }),
      });
      // lightweight feedback
      alert("Comparison saved to your dashboard.");
    } catch {}
  };

  const scrollToTips = () => {
    try {
      tipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  };

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="compare-page">
      <main className="compare-main">
        {/* Thinking robot helper */}
        <button className="robot-fab" onClick={scrollToTips} aria-label="Show spec tips">
          <div className="robot-icon">
            <div className="antenna" />
            <div className="eyes" />
          </div>
          <div className="robot-bubble">Not familiar with specs? Click me</div>
        </button>
        <h2 className="page-title">Device Comparison</h2>

        <div className="table-container">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="specs-header">Specs</th>
                {/* Header cells render for either DB or AI mode */}
                <th className="product-header">
                  {compareList.length >= 2 && product1 ? (
                    <div className="product-info">
                      <img
                        src={product1.thumbnail || localImageFor(product1.title, product1.category) || "/fallback.jpg"}
                        alt={product1.title}
                        className="product-image"
                      />
                      <span className="product-name">{product1.title}</span>
                    </div>
                  ) : compareAI.length >= 2 ? (
                    <div className="product-info">
                      <img
                        src={compareAI[0]?.thumbnail || localImageFor(compareAI[0]?.title, compareAI[0]?.category) || "/fallback.jpg"}
                        alt={compareAI[0]?.title}
                        className="product-image"
                      />
                      <span className="product-name">{compareAI[0]?.title}</span>
                    </div>
                  ) : (
                    "Device 1"
                  )}
                </th>
                <th className="product-header">
                  {compareList.length >= 2 && product2 ? (
                    <div className="product-info">
                      <img
                        src={product2.thumbnail || localImageFor(product2.title, product2.category) || "/fallback.jpg"}
                        alt={product2.title}
                        className="product-image"
                      />
                      <span className="product-name">{product2.title}</span>
                    </div>
                  ) : compareAI.length >= 2 ? (
                    <div className="product-info">
                      <img
                        src={compareAI[1]?.thumbnail || localImageFor(compareAI[1]?.title, compareAI[1]?.category) || "/fallback.jpg"}
                        alt={compareAI[1]?.title}
                        className="product-image"
                      />
                      <span className="product-name">{compareAI[1]?.title}</span>
                    </div>
                  ) : (
                    "Device 2"
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="compare-tbody">
              {/* Render modes: DB compare (ids) has priority; else AI compare */}
              {compareList.length >= 2 ? (
                !product1 || !product2 ? (
                  <tr>
                    <td colSpan={3} className="message-cell">
                      Products not found in database.
                    </td>
                  </tr>
                ) : (
                  <>
                    {(() => {
                      const L = product1;
                      const R = product2;
                      const findCurated = (title = "") =>
                        curatedProducts.find((x) => String(x.title).toLowerCase() === String(title).toLowerCase());
                      const specFrom = (p, key) => {
                        const c = findCurated(p?.title);
                        const map = {
                          cpu: ["cpu", "processor"],
                          gpu: ["gpu", "graphics"],
                          ram: ["ram"],
                          storage: ["storage"],
                          displaySize: ["displaySize", "size"],
                          displayResolution: ["displayResolution", "resolution"],
                          refreshRate: ["refreshRate", "hz"],
                          brightness: ["brightness"],
                          battery: ["battery"],
                          charging: ["charging"],
                          ports: ["ports"],
                          os: ["os"],
                          build: ["build"],
                          weight: ["weight"],
                          camera: ["camera"],
                          speakers: ["speakers"],
                          wifi: ["wifi"],
                          bluetooth: ["bluetooth"],
                          fingerprint: ["fingerprint"],
                          ip: ["ip"],
                        }[key] || [key];
                        for (const k of map) {
                          if (c?.specs?.[k] != null) return c.specs[k];
                        }
                        return null;
                      };
                      const rows = [];
                      const row = (label, lVal, rVal, lScore, rScore, neutral = false) => {
                        const [lt, rt] = betterTick(lScore, rScore, neutral);
                        rows.push(
                          <tr key={label}>
                            <td className="spec-name">{label}</td>
                            <td className="spec-value">
                              {lVal ?? "N/A"}
                              {lt && (
                                <span style={{ color: "#10b981", marginLeft: 6 }}>✔</span>
                              )}
                            </td>
                            <td className="spec-value">
                              {rVal ?? "N/A"}
                              {rt && (
                                <span style={{ color: "#10b981", marginLeft: 6 }}>✔</span>
                              )}
                            </td>
                          </tr>,
                        );
                      };

                      // Price (lower better)
                      row(
                        "Price",
                        L.price ? `LKR ${Number(L.price).toLocaleString()}` : "N/A",
                        R.price ? `LKR ${Number(R.price).toLocaleString()}` : "N/A",
                        L.price != null ? -Number(L.price) : null,
                        R.price != null ? -Number(R.price) : null,
                      );
                      // Brand (neutral)
                      row("Brand", L.brand || L.category, R.brand || R.category, null, null, true);
                      // CPU / GPU
                      const lCPU = readSpec(L, "cpu") ?? specFrom(L, "cpu");
                      const rCPU = readSpec(R, "cpu") ?? specFrom(R, "cpu");
                      row("Processor (CPU / Chipset)", lCPU, rCPU, cpuRank(lCPU), cpuRank(rCPU));
                      const lGPU = readSpec(L, "gpu") ?? specFrom(L, "gpu");
                      const rGPU = readSpec(R, "gpu") ?? specFrom(R, "gpu");
                      row("GPU / Graphics", lGPU, rGPU, gpuRank(lGPU), gpuRank(rGPU));
                      // RAM
                      const lRAM = readSpec(L, "ram") ?? specFrom(L, "ram");
                      const rRAM = readSpec(R, "ram") ?? specFrom(R, "ram");
                      row("RAM", lRAM, rRAM, extractGB(lRAM), extractGB(rRAM));
                      // Storage
                      const lST = readSpec(L, "storage") ?? specFrom(L, "storage");
                      const rST = readSpec(R, "storage") ?? specFrom(R, "storage");
                      row("Storage (SSD / HDD / UFS)", lST, rST, extractGB(lST), extractGB(rST));
                      // Display size / res / refresh
                      const lDS = readSpec(L, "displaySize") ?? specFrom(L, "displaySize");
                      const rDS = readSpec(R, "displaySize") ?? specFrom(R, "displaySize");
                      row("Display size", lDS, rDS, toNumber(lDS), toNumber(rDS));
                      const lDR = readSpec(L, "displayResolution") ?? specFrom(L, "displayResolution");
                      const rDR = readSpec(R, "displayResolution") ?? specFrom(R, "displayResolution");
                      row("Display resolution", lDR, rDR, resolutionScore(lDR), resolutionScore(rDR));
                      const lRR = readSpec(L, "refreshRate") ?? specFrom(L, "refreshRate");
                      const rRR = readSpec(R, "refreshRate") ?? specFrom(R, "refreshRate");
                      row("Refresh rate", lRR, rRR, toNumber(lRR), toNumber(rRR));
                      // Brightness
                      const lBR = readSpec(L, "brightness") ?? specFrom(L, "brightness");
                      const rBR = readSpec(R, "brightness") ?? specFrom(R, "brightness");
                      row("Brightness (nits)", lBR, rBR, toNumber(lBR), toNumber(rBR));
                      // Battery
                      const lBA = readSpec(L, "battery") ?? specFrom(L, "battery");
                      const rBA = readSpec(R, "battery") ?? specFrom(R, "battery");
                      row("Battery capacity (mAh / Wh)", lBA, rBA, toNumber(lBA), toNumber(rBA));
                      // Charging
                      const lCH = readSpec(L, "charging") ?? specFrom(L, "charging");
                      const rCH = readSpec(R, "charging") ?? specFrom(R, "charging");
                      row("Charging speed (W)", lCH, rCH, toNumber(lCH), toNumber(rCH));
                      // Ports/OS/Build
                      row("Ports / Connectivity", readSpec(L, "ports"), readSpec(R, "ports"), null, null, true);
                      row("Operating system", readSpec(L, "os"), readSpec(R, "os"), null, null, true);
                      row("Build material", readSpec(L, "build"), readSpec(R, "build"), null, null, true);
                      // Weight (lower better)
                      const lWT = readSpec(L, "weight");
                      const rWT = readSpec(R, "weight");
                      row("Weight", lWT, rWT, weightScore(lWT), weightScore(rWT));
                      // Camera and speakers
                      row("Camera", readSpec(L, "camera"), readSpec(R, "camera"), null, null, true);
                      const lSP = readSpec(L, "speakers");
                      const rSP = readSpec(R, "speakers");
                      const sRank = (x) => (x ? (/stereo|dolby|dtsx/i.test(String(x)) ? 2 : 1) : 0);
                      row("Speaker quality", lSP, rSP, sRank(lSP), sRank(rSP));
                      // Wi-Fi, Bluetooth
                      const lWF = readSpec(L, "wifi");
                      const rWF = readSpec(R, "wifi");
                      row("Wi‑Fi standard", lWF, rWF, wifiRank(lWF), wifiRank(rWF));
                      const lBT = readSpec(L, "bluetooth");
                      const rBT = readSpec(R, "bluetooth");
                      row("Bluetooth version", lBT, rBT, bluetoothRank(lBT), bluetoothRank(rBT));
                      // Biometrics
                      const lFP = readSpec(L, "fingerprint");
                      const rFP = readSpec(R, "fingerprint");
                      row("Fingerprint / Face unlock", lFP ?? "N/A", rFP ?? "N/A", boolRank(lFP), boolRank(rFP));
                      // IP rating
                      const lIP = readSpec(L, "ip");
                      const rIP = readSpec(R, "ip");
                      const ipRank = (x) => {
                        if (!x) return 0;
                        const m = String(x).match(/ip(\d{2})/i);
                        return m ? Number(m[1]) : 0;
                      };
                      row("Waterproof / Dustproof (IP)", lIP, rIP, ipRank(lIP), ipRank(rIP));

                      return rows;
                    })()}
                  </>
                )
              ) : compareAI.length >= 2 ? (
                <>
                  {(() => {
                    const A = compareAI[0] || {};
                    const B = compareAI[1] || {};
                    // Enforce same-category comparison; if mismatch, show guidance
                    const ca = String(A.category || "").toLowerCase();
                    const cb = String(B.category || "").toLowerCase();
                    if (ca && cb && ca !== cb) {
                      return [
                        <tr key="mismatch">
                          <td className="message-cell" colSpan={3}>
                            Please compare similar types only (e.g., phones vs phones).
                          </td>
                        </tr>,
                      ];
                    }
                    // Prefer structured specs when available; fall back to parsing title text
                    const a = { ...(A.specs || {}), ...parseFromTitle(A.title) };
                    const b = { ...(B.specs || {}), ...parseFromTitle(B.title) };

                    const rows = [];
                    const row = (label, av, bv, as, bs, neutral = false) => {
                      const [at, bt] = betterTick(as, bs, neutral);
                      rows.push(
                        <tr key={label}>
                          <td className="spec-name">{label}</td>
                          <td className="spec-value">
                            {av ?? "N/A"}
                            {at && (
                              <span style={{ color: "#10b981", marginLeft: 6 }}>✔</span>
                            )}
                          </td>
                          <td className="spec-value">
                            {bv ?? "N/A"}
                            {bt && (
                              <span style={{ color: "#10b981", marginLeft: 6 }}>✔</span>
                            )}
                          </td>
                        </tr>,
                      );
                    };

                    row(
                      "Price",
                      A.price ? `LKR ${Number(A.price).toLocaleString()}` : A.priceFormatted || "N/A",
                      B.price ? `LKR ${Number(B.price).toLocaleString()}` : B.priceFormatted || "N/A",
                      A.price != null ? -Number(A.price) : null,
                      B.price != null ? -Number(B.price) : null,
                    );
                    row("Brand", A.category || A.brand, B.category || B.brand, null, null, true);
                    row("Processor (CPU / Chipset)", a.cpu, b.cpu, cpuRank(a.cpu), cpuRank(b.cpu));
                    row("GPU / Graphics", a.gpu, b.gpu, gpuRank(a.gpu), gpuRank(b.gpu));
                    row("RAM", a.ram, b.ram, extractGB(a.ram), extractGB(b.ram));
                    row("Storage (SSD / HDD / UFS)", a.storage, b.storage, extractGB(a.storage), extractGB(b.storage));
                    row("Display size", a.displaySize, b.displaySize, toNumber(a.displaySize), toNumber(b.displaySize));
                    row(
                      "Display resolution",
                      a.displayResolution,
                      b.displayResolution,
                      resolutionScore(a.displayResolution),
                      resolutionScore(b.displayResolution),
                    );
                    row("Refresh rate", a.refreshRate, b.refreshRate, toNumber(a.refreshRate), toNumber(b.refreshRate));
                    rows.push(
                      <tr key="note">
                        <td className="message-cell" colSpan={3}>
                          Detailed specs may be unavailable for AI suggestions. View product pages for full details.
                        </td>
                      </tr>,
                    );
                    return rows;
                  })()}
                </>
              ) : (
                <tr>
                  <td colSpan={3} className="message-cell">
                    Please select 2 products to compare from the Products page
                    or with the Compare button in the AI chat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="button-group">
          <button
            onClick={() => navigate("/products")}
            className="btn btn-back"
          >
            Back to Products
          </button>
          <button onClick={saveComparison} className="btn btn-primary">
            Save Comparison
          </button>
          <button onClick={resetComparison} className="btn btn-reset">
            Reset Comparison
          </button>
        </div>

        {/* Friendly specs explanations */}
        <section ref={tipsRef} className="compare-tips-section">
          <h3 className="tips-title">Understand The Specs — Super Simple</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-emoji">🖥️</div>
              <h4>Core Specs</h4>
              <ul>
                <li><b>Processor (CPU)</b> — The processor is like the brain of your device. It thinks, makes decisions, and runs all the tasks. More cores and higher speed mean it can do things faster and handle more work at once.</li>
                <li><b>Graphics (GPU)</b> — It's like your eyes. Makes games/videos smooth.</li>
                <li><b>RAM</b> — It's a short‑term memory . More RAM = many apps open comfortably.</li>
                <li><b>Storage</b> — It's like your backpack . Bigger = more stuff. <b>SSD</b> = super fast, <b>HDD</b> = slower.</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-emoji">🔋</div>
              <h4>Power & Battery</h4>
              <ul>
                <li><b>Battery (mAh/Wh)</b> — It's like your stomach. Bigger = lasts longer.</li>
                <li><b>Charging (W)</b> — It's like eating speed . Higher W = fills faster.</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-emoji">📱</div>
              <h4>Display & Design</h4>
              <ul>
                <li><b>Screen size</b> — It's like window size. Big = more view; small = easier to carry.</li>
                <li><b>Resolution</b> — It's like your eye sharpness. HD &lt; Full HD &lt; 4K.</li>
                <li><b>Refresh rate (Hz)</b> — it's like blinking smoothness. Higher = smoother scroll/games.</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-emoji">📷</div>
              <h4>Camera & Sound</h4>
              <ul>
                <li><b>Megapixels</b> — It's like camera clarity (not the only factor).</li>
                <li><b>Speakers</b> — stereo/Dolby, sound is nicer than mono .</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-emoji">🌐</div>
              <h4>Connectivity & Ports</h4>
              <ul>
                <li><b>Wi‑Fi / 5G</b> — chat speed. Newer = faster.</li>
                <li><b>Bluetooth</b> — It's like a wireless handshake to headphones/watches.</li>
                <li><b>Ports</b> — Ports are like doors (USB/HDMI). More Ports = more gadgets you can connect.</li>
              </ul>
            </div>

            <div className="tip-card">
              <div className="tip-emoji">🔒</div>
              <h4>Extra Features</h4>
              <ul>
                <li><b>Operating System</b> — User interfac (Windows/macOS/Android).</li>
                <li><b>Security</b> — fingerprint/face = your key .</li>
                <li><b>IP rating</b> — raincoat vs water/dust.</li>
              </ul>
            </div>
          </div>
        </section>

        {showTop && (
          <button
            className="back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            title="Back to top"
          >
            ↑ Top
          </button>
        )}
      </main>

      <footer className="footer">
        &copy; 2025 Tech Genie | AI-powered Assistance
      </footer>
    </div>
  );
}
