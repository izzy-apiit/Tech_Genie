import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../utils/api";

export default function BookingList({ userId, refreshTrigger }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(buildApiUrl(`/api/bookings/user/${userId}`));
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchBookings();
  }, [userId, refreshTrigger]);

  if (loading) return <p>Loading your bookings...</p>;
  if (!bookings.length) return <p>No bookings found.</p>;

  return (
    <div className="bookings-grid">
      {bookings.map((b) => (
        <div key={b._id} className="booking-card">
          <h4>{b.vendorName || "Repair Shop"}</h4>
          <p>
            <strong>Status:</strong> {b.status}
          </p>
          <p>
            <strong>Date:</strong> {new Date(b.date).toLocaleDateString()}
          </p>
          <p>
            <strong>Time:</strong> {b.allocatedTime || "Not scheduled"}
          </p>

          {/* Chat button */}
          {b.status !== "declined" && (
            <button
              onClick={() => {
                // trigger chat in parent
                window.dispatchEvent(
                  new CustomEvent("openChat", {
                    detail: {
                      bookingId: b._id,
                      vendorId: b.vendorId,
                      vendorName: b.vendorName,
                    },
                  }),
                );
              }}
            >
              Chat with Vendor
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
