import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function AdminPanel() {
  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>
      <div className="admin-cards">
        <Link to="/admin/products" className="admin-card">
          <h2>Manage Products</h2>
          <p>Add, update or remove products from the store.</p>
        </Link>

        <Link to="/admin/users" className="admin-card">
          <h2>Manage Users</h2>
          <p>View and manage registered users.</p>
        </Link>

        <Link to="/admin/bookings" className="admin-card">
          <h2>View Bookings</h2>
          <p>Check and manage all bookings made by users.</p>
        </Link>
      </div>
    </div>
  );
}
