 import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    thumbnail: "",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchProducts = async () => {
    const res = await axios.get("/api/products");
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`/api/products/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post("/api/products", form);
    }
    setForm({ title: "", category: "", price: "", thumbnail: "" });
    fetchProducts();
  };

  const handleEdit = (p) => {
    setForm({ ...p });
    setEditingId(p._id);
  };
  const handleDelete = async (id) => {
    await axios.delete(`/api/products/${id}`);
    fetchProducts();
  };

  return (
    <div className="admin-products-container">
      <h2 className="page-title">
        {editingId ? "Edit Product" : "Add Product"}
      </h2>

      {/* Product Form */}
      <form className="product-form" onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />
        <input
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
        />
        <input
          name="thumbnail"
          placeholder="Image URL"
          value={form.thumbnail}
          onChange={handleChange}
        />
        <button type="submit">{editingId ? "Update" : "Add"} Product</button>
      </form>

      {/* Products Grid */}
      <h3 className="section-title">All Products</h3>
      <div className="products-grid">
        {products.length === 0 && (
          <p className="no-products">No products available</p>
        )}
        {products.map((p) => (
          <div className="product-card" key={p._id}>
            <img className="product-image" src={p.thumbnail} alt={p.title} />
            <div className="product-info">
              <h4 className="product-title">{p.title}</h4>
              <p className="product-category">{p.category}</p>
              <p className="product-price">${p.price}</p>
            </div>
            <div className="product-actions">
              <button className="edit-btn" onClick={() => handleEdit(p)}>
                Edit
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(p._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
