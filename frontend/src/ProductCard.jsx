import { useNavigate } from "react-router-dom";

export default function ProductCard({
  product,
  enableCompare = false,
  compact = false, // when true, fills parent grid cell (used in chatbot)
}) {
  const navigate = useNavigate();

  const handleViewProduct = () => {
    const link = product.link || product.url;
    if (typeof link === "string" && /^https?:\/\//i.test(link)) {
      window.open(link, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(`/product/${encodeURIComponent(product.title)}`, {
      state: { product },
    });
  };

  const handleCompare = () => {
    // Build a minimal comparable entry from AI/rapidapi product
    const entry = {
      id:
        product.id ||
        product.product_id ||
        product.asin ||
        product.url ||
        product.title,
      title: product.title || "Untitled Product",
      thumbnail: product.thumbnail || product.image_url || "/fallback.jpg",
      // Prefer a numeric LKR price if provided by backend; fallback to raw price
      price: Number(product.price ?? product.priceLKR) || null,
      rating: product.rating || null,
      category: product.category || product.brand || "",
      source: "ai",
      // Pass through any structured specs provided by backend
      specs: product.specs || undefined,
    };

    try {
      const raw = JSON.parse(localStorage.getItem("compare_ai") || "[]");
      let list = Array.isArray(raw) ? raw : [];
      // toggle behavior
      const exists = list.find((i) => i.id === entry.id);
      if (exists) {
        list = list.filter((i) => i.id !== entry.id);
      } else {
        if (list.length >= 2) {
          alert("You can only compare 2 products at a time.");
          return;
        }
        // Enforce same-category comparisons
        if (list.length === 1) {
          const c1 = String(list[0]?.category || "").toLowerCase();
          const c2 = String(entry.category || "").toLowerCase();
          if (c1 && c2 && c1 !== c2) {
            alert("Please compare similar types only (e.g., phones with phones).");
            return;
          }
        }
        list = [...list, entry];
      }
      localStorage.setItem("compare_ai", JSON.stringify(list));
      // small UX feedback
      const msg = exists ? "Removed from compare" : "Added to compare";
      console.log(`[CompareAI] ${msg}:`, entry.title);
    } catch (e) {
      console.error("Failed to update compare list:", e);
    }
  };

  const cardStyle = {
    width: compact ? "100%" : 250,
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: compact ? 0 : 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    boxShadow: "0 2px 6px rgba(139, 89, 89, 0.1)",
    backgroundColor: "white",
  };

  return (
    <div style={cardStyle}>
      <img
        src={product.thumbnail || product.image_url || "/fallback.jpg"}
        alt={product.title || "Product"}
        style={{
          width: compact ? "100%" : 150,
          height: compact ? 180 : 150,
          objectFit: "contain",
          borderRadius: 8,
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/fallback.jpg";
        }}
      />
      <div style={{ textAlign: "center" }}>
        <h4 style={{ margin: 0, fontSize: 16 }}>
          {product.title || "Untitled Product"}
        </h4>
        <p style={{ margin: "6px 0", fontSize: 14 }}>
          <strong>Price:</strong>{" "}
          {product.price
            ? `LKR ${Number(product.price).toLocaleString()}`
            : "Price Not Available"}
          <br />
          <strong>Rating:</strong> {product.rating || "No rating"}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            onClick={handleViewProduct}
            style={{
              padding: "6px 12px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            View
          </button>
          {enableCompare && (
            <button
              onClick={handleCompare}
              style={{
                padding: "6px 12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Compare
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
