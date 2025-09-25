import React, { useState, useEffect } from "react";
import { buildApiUrl } from "../utils/api";

// Hardcoded vendors in DB
const HARD_CODED_VENDORS = [
  { _id: "68a0bf9a2ef54cdce26a1c92", name: "Computer Repair" },
  { _id: "68a0bf9a2ef54cdce26a1c95", name: "Tech Fix" },
  { _id: "68a0bf9a2ef54cdce26a1c98", name: "Gadget Rescue" },
];

export default function BookingForm({
  userId,
  preselectedShop,
  onBookingConfirmed,
}) {
  const DEFAULT_VENDOR = HARD_CODED_VENDORS[0];

  const [form, setForm] = useState({
    shopId: DEFAULT_VENDOR._id,
    issue: "",
    date: "", // YYYY-MM-DD
    allocatedTime: "", // e.g., "09:00 AM-09:30 AM"
  });

  const [availability, setAvailability] = useState([]); // [{date, slots:[{label,available,bookedByMe}]}]
  const [loadingAvail, setLoadingAvail] = useState(false);

  useEffect(() => {
    if (preselectedShop) {
      const isObjectId = /^[a-f\d]{24}$/i.test(preselectedShop._id || "");
      setForm((prev) => ({
        ...prev,
        shopId: isObjectId ? preselectedShop._id : DEFAULT_VENDOR._id,
      }));
    }
  }, [preselectedShop]);

  // Load availability when shop changes
  useEffect(() => {
    async function loadAvail() {
      if (!form.shopId) return;
      setLoadingAvail(true);
      try {
        const res = await fetch(
          buildApiUrl(
            `/api/bookings/availability?shopId=${encodeURIComponent(form.shopId)}&days=7&userId=${encodeURIComponent(
              userId,
            )}`,
          ),
        );
        const data = await res.json();
        const days = Array.isArray(data.days) ? data.days : [];
        setAvailability(days);
        if (days.length) {
          setForm((prev) => ({ ...prev, date: days[0].date, allocatedTime: "" }));
        }
      } catch (e) {
        console.error("Failed to load availability", e);
        setAvailability([]);
      } finally {
        setLoadingAvail(false);
      }
    }
    loadAvail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.shopId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shopId || !form.issue || !form.date || !form.allocatedTime) {
      return alert("Please fill all fields");
    }

    try {
      const res = await fetch(buildApiUrl("/api/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Booking confirmed!");
        const vendor = HARD_CODED_VENDORS.find((v) => v._id === form.shopId);
        onBookingConfirmed?.({
          bookingId: data._id,
          vendorId: form.shopId, // <-- receiver for chat
          vendorName: vendor?.name || "Vendor", // <-- nice title
        });
      } else {
        alert("Booking failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Booking failed.");
    }

    setForm((prev) => ({ ...prev, issue: "", date: prev.date, allocatedTime: "" }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}
    >
      <h2>Book a Repair Appointment</h2>

      <label>
        Select Vendor:
        <select
          value={form.shopId}
          onChange={(e) => setForm({ ...form, shopId: e.target.value })}
          required
        >
          {HARD_CODED_VENDORS.map((v) => (
            <option key={v._id} value={v._id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Describe Issue:
        <textarea
          value={form.issue}
          onChange={(e) => setForm({ ...form, issue: e.target.value })}
          rows="3"
          required
        />
      </label>

      {/* Date selector (next 7 days) */}
      <div className="booking-section">
        <label className="booking-label">Select Date:</label>
        {loadingAvail ? (
          <div>Loading dates…</div>
        ) : (
          <div className="date-list">
            {availability.map((d) => {
              const dt = new Date(d.date + "T00:00:00");
              const label = dt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                weekday: "short",
              });
              const active = form.date === d.date;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, date: d.date, allocatedTime: "" }))}
                  className={`date-chip ${active ? "active" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeslots 09:00–12:00 30m */}
      <div className="booking-section">
        <label className="booking-label">Select Time:</label>
        <div className="time-list">
          {availability
            .find((d) => d.date === form.date)?.slots.map((s) => {
              const active = form.allocatedTime === s.label;
              const disabled = !s.available;
              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => !disabled && setForm((prev) => ({ ...prev, allocatedTime: s.label }))}
                  disabled={disabled}
                  title={s.bookedByMe ? "You already booked this slot" : disabled ? "Unavailable" : ""}
                  className={`time-chip ${active ? "active" : ""} ${disabled ? "disabled" : ""}`}
                >
                  {s.label}
                </button>
              );
            })}
        </div>
      </div>

      <button type="submit" className="book-btn">Book Appointment</button>
    </form>
  );
}
