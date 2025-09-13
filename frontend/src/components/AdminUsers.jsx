import React, { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditChange = (e) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    await axios.put(`/api/admin/users/${editingUser._id}`, editingUser);
    setEditingUser(null);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await axios.delete(`/api/admin/users/${id}`);
      fetchUsers();
    }
  };

  return (
    <div className="admin-users-container">
      <h2 className="page-title">Manage Users</h2>

      {/* Edit Modal */}
      {editingUser && (
        <div className="edit-modal">
          <div className="edit-card">
            <h3>Edit User</h3>
            <input
              name="name"
              value={editingUser.name}
              onChange={handleEditChange}
              placeholder="Name"
            />
            <input
              name="email"
              value={editingUser.email}
              onChange={handleEditChange}
              placeholder="Email"
            />
            <select
              name="role"
              value={editingUser.role}
              onChange={handleEditChange}
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
            <div className="edit-actions">
              <button className="save-btn" onClick={handleUpdate}>
                Save
              </button>
              <button
                className="cancel-btn"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="users-grid">
        {users.length === 0 && <p className="no-users">No users available</p>}
        {users.map((u) => (
          <div className="user-card" key={u._id}>
            <h4 className="user-name">{u.name}</h4>
            <p className={`user-role ${u.role}`}>{u.role.toUpperCase()}</p>
            <p className="user-email">{u.email}</p>
            <div className="user-actions">
              <button className="edit-btn" onClick={() => setEditingUser(u)}>
                Edit
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(u._id)}
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
