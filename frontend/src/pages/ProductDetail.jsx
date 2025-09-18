import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

export default function ProductDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;

  if (!product) {
    return (
      <div className="product-detail__error">
        <h2>Could not fetch the product details.</h2>
        <button onClick={() => navigate("/")}>Go Back Home</button>
      </div>
    );
  }

  return (
    <div className="product-detail-container wide">
      <button className="btn-secondary" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="product-hero">
        <div className="hero-media">
          <img
            src={product.thumbnail || "/fallback.jpg"}
            alt={product.title}
            onError={(e) => (e.currentTarget.src = "/fallback.jpg")}
          />
        </div>
        <div className="hero-info">
          <h2 className="hero-title">{product.title}</h2>
          <p className="hero-price">
            {product.priceFormatted !== "N/A" ? product.priceFormatted : "Price Not Available"}
          </p>
          {product.rating && <p className="hero-rating">Rated {product.rating} out of 5</p>}
          {product.link && (
            <a href={product.link} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Buy Now
            </a>
          )}
          <div className="hero-specs">
            {product?.specs?.cpu && (
              <span className="spec-chip">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M6 3v-2M10 3v-2M14 3v-2M18 3v-2M6 17v2M10 17v2M14 17v2M18 17v2"/></svg>
                {product.specs.cpu}
              </span>
            )}
            {product?.specs?.ram && (
              <span className="spec-chip">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6 7v-2M10 7v-2M14 7v-2M18 7v-2"/></svg>
                {product.specs.ram}
              </span>
            )}
            {product?.specs?.storage && (
              <span className="spec-chip">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/></svg>
                {product.specs.storage}
              </span>
            )}
            {product?.specs?.displaySize && (
              <span className="spec-chip">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M7 21h10"/></svg>
                {product.specs.displaySize}"
              </span>
            )}
            {product?.specs?.battery && (
              <span className="spec-chip">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-4"/></svg>
                {product.specs.battery}
              </span>
            )}
          </div>

          {/* Full spec list with icons (right-side), minimal style */}
          {product.specs && (
            <div className="spec-lines">
              {Object.entries(product.specs).map(([key, value]) => {
                if (value == null || value === "") return null;
                const k = String(key).toLowerCase();
                const icon = (name) => (
                  name === "cpu" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>
                  ) : name === "gpu" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6 7v-2M10 7v-2M14 7v-2M18 7v-2"/></svg>
                  ) : name === "ram" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6 7v-2M10 7v-2M14 7v-2M18 7v-2"/></svg>
                  ) : name === "storage" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/></svg>
                  ) : name.includes("display") || name === "size" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M7 21h10"/></svg>
                  ) : name === "battery" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-4"/></svg>
                  ) : name === "wifi" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12a8.5 8.5 0 0 1 14 0"/><path d="M8.5 15.5a4.5 4.5 0 0 1 7 0"/><path d="M12 19h.01"/></svg>
                  ) : name === "bluetooth" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l10 10-5 5V2l5 5L7 17"/></svg>
                  ) : name === "ports" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="10" rx="2"/></svg>
                  ) : name === "camera" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  ) : name === "os" ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2v20"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                  )
                );
                return (
                  <div className="spec-line" key={key}>
                    {icon(k)}
                    <span className="spec-line-key">{key}</span>
                    <span className="spec-line-val">{String(value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Specs are already on the right side next to the image now */}

      {/* Pros & Cons */}
      {(product.pros || product.cons) && (
        <div className="product-section pros-cons">
          {product.pros && (
            <div>
              <h3>Pros</h3>
              <ul>
                {product.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {product.cons && (
            <div>
              <h3>Cons</h3>
              <ul>
                {product.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI Summary */}
      {product.summary && (
        <div className="product-section">
          <h3>Summary</h3>
          <p>{product.summary}</p>
        </div>
      )}
    </div>
  );
}
