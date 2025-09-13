import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

const API_URL = import.meta.env.VITE_API_URL ;

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in as admin.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please log in again as admin.");
      } else if (err.response?.status === 403) {
        setError("Forbidden. You are not an admin.");
      } else {
        setError("Failed to fetch bookings.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in as admin.");
        return;
      }

      await axios.put(
        `${API_URL}/api/admin/bookings/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      fetchBookings();
    } catch (err) {
      console.error("Error updating booking:", err);
      setError("Failed to update booking status.");
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) return <p className="no-bookings">Loading bookings...</p>;
  if (error) return <p className="no-bookings">{error}</p>;

  return (
    <div className="admin-bookings-container">
      <h2 className="page-title">All Bookings</h2>
      {bookings.length === 0 && (
        <p className="no-bookings">No bookings available.</p>
      )}

      <div className="bookings-grid">
        {bookings.map((b) => (
          <div className="booking-card" key={b._id}>
            <div className="booking-info">
              <p>
                <strong>Customer:</strong> {b.customerName}
              </p>
              <p>
                <strong>Vendor:</strong> {b.shopName}
              </p>
              <p>
                <strong>Date:</strong> {new Date(b.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Allocated:</strong> {b.allocatedTime || "—"}
              </p>
              <p>
                <strong>Status:</strong>
                <span
                  className={`status-badge ${b.status.replace(/\s/g, "").toLowerCase()}`}
                >
                  {b.status}
                </span>
              </p>
            </div>
            <div className="booking-actions">
              <select
                value={b.status}
                onChange={(e) => handleStatusChange(b._id, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
