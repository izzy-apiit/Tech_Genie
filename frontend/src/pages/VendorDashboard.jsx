// frontend/pages/VendorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ChatBox from "../components/ChatBox";
import Modal from "../components/Modal";
import { io } from "socket.io-client";

export default function VendorDashboard() {
  const [bookings, setBookings] = useState([]);
  // Allocation is now fixed by the customer's requested time
  const [tempAlloc, setTempAlloc] = useState({});
  const [tempStage, setTempStage] = useState({});
  const [chatBooking, setChatBooking] = useState(null);
  const [socket, setSocket] = useState(null);

  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const meId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Redirect non-vendors
  useEffect(() => {
    if (role !== "vendor") navigate("/");
  }, [role, navigate]);

  // Initialize Socket.IO
  useEffect(() => {
    if (!token) return;
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";
    const newSocket = io(API_URL, { auth: { token } });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Vendor connected to Socket.IO:", newSocket.id);
      newSocket.emit("joinRoom", `user:${meId}`);
    });

    return () => newSocket.disconnect();
  }, [token, meId]);

  // Fetch bookings initially
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get("/api/bookings/vendor/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bookings");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `/api/bookings/vendor/bookings/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Booking status updated!");
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // Allocation editing removed; vendors cannot change customer's selected slot.

  const stageMap = {
    pending: { label: "Pending", percent: 0 },
    diagnosing: { label: "Diagnosing", percent: 25 },
    repairing: { label: "Repairing", percent: 50 },
    quality: { label: "Quality Check", percent: 75 },
    ready: { label: "Ready for Pickup", percent: 90 },
    completed: { label: "Completed", percent: 100 },
  };

  const updateProgress = async (id) => {
    const key = tempStage[id];
    if (!key) return toast.warn("Select a progress stage first");
    const { label, percent } = stageMap[key];

    try {
      await axios.put(
        `/api/bookings/vendor/bookings/${id}/status`,
        {
          progress: { label, percent },
          status: key === "completed" ? "Completed" : "In Progress",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("Progress updated");
      setTempStage({ ...tempStage, [id]: "" });
      fetchBookings();

      if (socket) {
        const booking = bookings.find((b) => b._id === id);
        if (booking) {
          socket.emit("progressUpdated", {
            bookingId: id,
            userId: booking.userId?._id || booking.userId,
            progress: { label, percent },
            status: key === "completed" ? "Completed" : "In Progress",
          });
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.error || "Failed to update progress";
      toast.error(msg);
    }
  };

  return (
    <div className="vdash">
      <h2 className="vdash__title">Vendor Dashboard</h2>

      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="vdash__tableWrapper">
          <table className="vdash__table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Issue</th>
                <th>Requested Date</th>
                <th>Allocated Time</th>
                <th>Status</th>
                <th>Set Status</th>
                <th>Progress</th>
                <th>Chat</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const customer =
                  b.userId?.name || b.userId?.email || b.userId || "Customer";
                const currentProgress = b.progress?.label
                  ? `${b.progress.label} (${b.progress.percent || 0}%)`
                  : "—";

                return (
                  <tr key={b._id}>
                    <td data-label="Booking ID">{b._id}</td>
                    <td data-label="Customer">{customer}</td>
                    <td data-label="Issue">{b.issue}</td>
                    <td data-label="Requested Date">
                      {new Date(b.date).toLocaleString()}
                    </td>
                    <td data-label="Allocated Time">
                      <div className="vdash__allocCurrent" style={{fontWeight:700}}>
                        {b.allocatedTime
                          ? `${new Date(b.date).toLocaleDateString()} · ${b.allocatedTime}`
                          : "—"}
                      </div>
                    </td>
                    <td data-label="Status">{b.status || "—"}</td>
                    <td data-label="Set Status">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b._id, e.target.value)}
                        className="vdash__select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td data-label="Progress">
                      <div className="vdash__progressCell">
                        <div className="vdash__progressCurrent">
                          {currentProgress}
                        </div>
                        <div className="vdash__progressControls">
                          <select
                            value={tempStage[b._id] || ""}
                            onChange={(e) =>
                              setTempStage({
                                ...tempStage,
                                [b._id]: e.target.value,
                              })
                            }
                            className="vdash__select"
                          >
                            <option value="">Select stage…</option>
                            <option value="pending">Pending (0%)</option>
                            <option value="diagnosing">Diagnosing (25%)</option>
                            <option value="repairing">Repairing (50%)</option>
                            <option value="quality">Quality Check (75%)</option>
                            <option value="ready">
                              Ready for Pickup (90%)
                            </option>
                            <option value="completed">Completed (100%)</option>
                          </select>
                          <button
                            onClick={() => updateProgress(b._id)}
                            className="vdash__btn"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </td>
                    <td data-label="Chat">
                      <button
                        className="vdash__btn"
                        onClick={() => setChatBooking(b)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Chat modal */}
      <Modal
        open={!!chatBooking}
        title={`Chat • ${chatBooking?.userId?.name || "Customer"}`}
        onClose={() => setChatBooking(null)}
      >
        {chatBooking && socket && (
          <ChatBox
            meId={meId}
            otherId={chatBooking.userId?._id || chatBooking.userId}
            bookingId={chatBooking._id}
            serviceName={chatBooking.userId?.name || "Customer"}
            socket={socket}
          />
        )}
      </Modal>
    </div>
  );
}
