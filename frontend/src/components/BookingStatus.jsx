import React, { useEffect, useState } from "react";
import "../App.css";
import { buildApiUrl } from "../utils/api";

export default function BookingStatus({ userId, socket }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings initially
  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(buildApiUrl(`/api/bookings/user/${userId}`));
        const data = await res.json();
        console.log("Bookings fetched:", data);
        setBookings(data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [userId]);

  // Listen for real-time progress updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleProgressUpdate = (updatedBooking) => {
      setBookings((prev) =>
        prev.map((b) => (b._id === updatedBooking._id ? updatedBooking : b)),
      );
    };

    socket.on("bookingProgressUpdated", handleProgressUpdate);

    return () => {
      socket.off("bookingProgressUpdated", handleProgressUpdate);
    };
  }, [socket]);

  // Normalize status values
  const normalizeStatus = (status) => {
    if (!status) return "";
    return status.toString().toLowerCase().replace(/\s|_/g, "-");
  };

  const getProgressPercent = (status) => {
    switch (status) {
      case "pending":
        return 25;
      case "accepted":
        return 50;
      case "in-progress":
        return 75;
      case "completed":
        return 100;
      case "declined":
        return 100;
      default:
        return 0;
    }
  };

  const getProgressLabel = (status) => {
    switch (status) {
      case "pending":
        return "Requested (Awaiting Response)";
      case "accepted":
        return "Accepted by Vendor";
      case "in-progress":
        return "Repair In Progress";
      case "completed":
        return "Completed";
      case "declined":
        return "Declined by Vendor";
      default:
        return "Unknown";
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case "pending":
        return "linear-gradient(90deg, #FFC107, #FFD54F)"; // yellow
      case "accepted":
        return "linear-gradient(90deg, #2196F3, #64B5F6)"; // blue
      case "in-progress":
        return "linear-gradient(90deg, #FF9800, #FFB74D)"; // orange
      case "completed":
        return "linear-gradient(90deg, #4CAF50, #81C784)"; // green
      case "declined":
        return "linear-gradient(90deg, #F44336, #E57373)"; // red
      default:
        return "linear-gradient(90deg, #9E9E9E, #BDBDBD)"; // gray fallback
    }
  };

  if (loading) return <p>Loading booking status...</p>;
  if (!bookings.length) return <p>No bookings found.</p>;

  return (
    <div className="booking-status-list">
      {bookings.map((b) => {
        const statusKey = normalizeStatus(b.status);
        const progress = getProgressPercent(statusKey);
        const label = getProgressLabel(statusKey);
        const color = getProgressColor(statusKey);

        return (
          <div key={b._id} className="booking-status-card">
            <h3>{b.vendorName || "Repair Shop"}</h3>
            <p>
              <strong>Status:</strong> {label}
            </p>

            {b.allocatedTime && (
              <p>
                <strong>Scheduled:</strong>{" "}
                {new Date(b.date).toLocaleDateString()} at {b.allocatedTime}
              </p>
            )}

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: color,
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
