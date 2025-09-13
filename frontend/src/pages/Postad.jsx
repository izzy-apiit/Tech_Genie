import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/postAd.css";

const DEVICE_TYPES = {
  "Laptops and Computers": ["Laptops", "Desktops", "All-in-Ones"],
  "Smartphones and Tablets": ["Smartphones", "Tablets", "Phablets"],
  "Computer Parts": [
    "RAM",
    "Motherboard",
    "Graphics Card",
    "Processor",
    "Storage",
    "Power Supply",
  ],
  "Other Items": ["Printers", "Monitors", "Accessories"],
};

const BRANDS = [
  "Apple",
  "Samsung",
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Acer",
  "MSI",
  "Gigabyte",
  "Intel",
  "AMD",
  "Nvidia",
  "Huawei",
  "OnePlus",
  "Google",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Realme",
  "Sony",
  "Canon",
  "Nikon",
  "Logitech",
  "Razer",
  "Microsoft",
];

const DURATIONS = [
  { label: "12 hours", value: "12h" },
  { label: "1 day", value: "1d" },
  { label: "2 days", value: "2d" },
  { label: "5 days", value: "5d" },
  { label: "10 days", value: "10d" },
];

export default function PostAd() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    deviceType: "",
    subcategory: "",
    brand: "",
    title: "",
    condition: "Used",
    mobile: "",
    description: "",
    price: "",
    duration: "1d",
    createdBy: localStorage.getItem("username") || "",
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "deviceType") {
      setForm((prev) => ({ ...prev, subcategory: "" }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(form.mobile))
      return alert("Enter a valid 10-digit number");
    if (images.length === 0)
      return alert("Please upload at least one image (max 5)");

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));
    images.forEach((img) => formData.append("images", img));

    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        alert("Ad posted successfully!");
        nav("/manage-auction");
      } else {
        alert("Failed to post ad");
      }
    } catch (err) {
      console.error("Error posting ad:", err);
      alert("Server error while posting ad");
    }
  };

  return (
    <div className="postad-wrapper">
      <h1>Post an Ad</h1>
      <form onSubmit={handleSubmit} className="postad-form">
        <div className="form-grid">
          <select
            name="deviceType"
            value={form.deviceType}
            onChange={handleChange}
            required
          >
            <option value="">Select Device Type</option>
            {Object.keys(DEVICE_TYPES).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            required
            disabled={!form.deviceType}
          >
            <option value="">Select Subcategory</option>
            {(DEVICE_TYPES[form.deviceType] || []).map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <select
            name="brand"
            value={form.brand}
            onChange={handleChange}
            required
          >
            <option value="">Select Brand</option>
            {BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <input
            name="title"
            placeholder="Title (short)"
            value={form.title}
            onChange={handleChange}
            required
          />

          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            required
          >
            <option value="Used">Used</option>
            <option value="Partially Working">Partially Working</option>
            <option value="Not Working">Not Working</option>
          </select>

          <input
            name="mobile"
            placeholder="Contact Number (10-digit)"
            value={form.mobile}
            onChange={handleChange}
            required
            maxLength="10"
            pattern="[0-9]{10}"
          />

          <textarea
            name="description"
            placeholder="Product Description (max 5000 chars)"
            value={form.description}
            onChange={handleChange}
            maxLength={5000}
            rows={5}
            required
          ></textarea>

          <input
            name="price"
            type="number"
            placeholder="Minimum Auction Price (LKR)"
            value={form.price}
            onChange={handleChange}
            required
          />

          <select
            name="duration"
            value={form.duration}
            onChange={handleChange}
            required
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file-input"
          />

          {previews.length > 0 && (
            <div className="image-preview-box">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="preview"
                  className="preview-thumb"
                />
              ))}
            </div>
          )}

          <button type="submit" className="btn-submit">
            Submit Ad
          </button>
        </div>
      </form>
    </div>
  );
}
