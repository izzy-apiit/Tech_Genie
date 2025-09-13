import React, { useState, useEffect } from "react";
import BookingForm from "../components/BookingForm";
import BookingStatus from "../components/BookingStatus";
import BookingList from "../components/BookingList";
import RepairShops from "../components/RepairShops";
import ChatBox from "../components/ChatBox";
import { io } from "socket.io-client";

export default function RepairServices() {
  const userId = localStorage.getItem("userId") || "test_user";
  const token = localStorage.getItem("token");

  const [selectedShop, setSelectedShop] = useState(null);
  const [activeTab, setActiveTab] = useState("shops");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [zoom, setZoom] = useState(13);

  // Booking/chat state
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [chatVendorId, setChatVendorId] = useState(null);
  const [chatVendorName, setChatVendorName] = useState(null);
  const [refreshBookings, setRefreshBookings] = useState(false); // force refresh BookingList

  // Initialize Socket.IO once
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";
    const newSocket = io(API_URL, { auth: { token } });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  // Fetch nearby shops
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setZoom(13);

          try {
            const res = await fetch(
              `/api/google-places/nearby?lat=${latitude}&lng=${longitude}`,
            );
            let data = await res.json();
            let fetchedShops = Array.isArray(data.results) ? data.results : [];
            if (fetchedShops.length === 0)
              fetchedShops = generateMockShops(latitude, longitude);
            setShops(fetchedShops);
          } catch (error) {
            console.error(error);
            setLocationError("Unable to fetch nearby repair shops.");
            setShops(generateMockShops(latitude, longitude));
          } finally {
            setLoading(false);
          }
        },
        () => {
          setLocationError("Location permission denied.");
          setShops(generateMockShops(6.9271, 79.8612));
          setLoading(false);
        },
      );
    } else {
      setLocationError("Geolocation not supported by this browser.");
      setShops(generateMockShops(6.9271, 79.8612));
      setLoading(false);
    }
  }, []);

  function generateMockShops(lat, lng) {
    const names = [
      "QuickFix",
      "Gadget Care",
      "Tech Repair",
      "Device Clinic",
      "SmartFix",
    ];
    return names.map((name, i) => ({
      _id: `mock-${i}`,
      vendorId: `vendor-${i}`,
      name,
      lat: lat + (Math.random() - 0.5) * 0.02,
      lng: lng + (Math.random() - 0.5) * 0.02,
      address: `Demo Address ${i + 1}`,
      phone: `071-000-000${i}`,
    }));
  }

  // Booking confirmed handler
  const handleBookingConfirmed = ({ bookingId, vendorId, vendorName }) => {
    setBookingId(bookingId);
    setChatVendorId(vendorId);
    setChatVendorName(vendorName);
    setBookingConfirmed(true);
    setActiveTab("chat");
    setRefreshBookings((prev) => !prev); // refresh BookingList
  };

  // Listen for chat open events from BookingList
  useEffect(() => {
    const handler = (e) => {
      const { bookingId, vendorId, vendorName } = e.detail;
      setBookingId(bookingId);
      setChatVendorId(vendorId);
      setChatVendorName(vendorName);
      setBookingConfirmed(true);
      setActiveTab("chat");
    };
    window.addEventListener("openChat", handler);
    return () => window.removeEventListener("openChat", handler);
  }, []);

  return (
    <div className="repair-services-container">
      <h1 className="page-title">Repair Services</h1>

      <div className="content-wrapper">
        <aside className="left-panel">
          <section className="bookings-section">
            <h2>Your Bookings</h2>
            <BookingList userId={userId} refreshTrigger={refreshBookings} />
          </section>

          <section className="progress-section">
            <h2>Repair Progress</h2>
            <BookingStatus userId={userId} />
          </section>
        </aside>

        <section className="right-panel">
          <nav className="tab-nav">
            <button
              className={`tab-btn ${activeTab === "shops" ? "active" : ""}`}
              onClick={() => setActiveTab("shops")}
            >
              Find Repair Shops
            </button>
            <button
              className={`tab-btn ${activeTab === "booking" ? "active" : ""}`}
              onClick={() => setActiveTab("booking")}
              disabled={!selectedShop}
            >
              Book Appointment
            </button>
            <button
              className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
              disabled={!bookingConfirmed}
            >
              Chat
            </button>
            <button
              className={`tab-btn ${activeTab === "status" ? "active" : ""}`}
              onClick={() => setActiveTab("status")}
            >
              Track Repair Progress
            </button>
          </nav>

          <div className="tab-content">
            {activeTab === "shops" && (
              <>
                {loading ? (
                  <p>Loading nearby repair shops...</p>
                ) : locationError ? (
                  <p className="error-msg">{locationError}</p>
                ) : (
                  <RepairShops
                    shops={shops}
                    userLocation={userLocation}
                    zoom={zoom}
                    onSelectShop={(shop) => {
                      setSelectedShop(shop);
                      setActiveTab("booking");
                    }}
                    selectedShopId={selectedShop?._id}
                  />
                )}
              </>
            )}

            {activeTab === "booking" && selectedShop && (
              <BookingForm
                userId={userId}
                preselectedShop={selectedShop}
                onBookingConfirmed={handleBookingConfirmed}
              />
            )}

            {activeTab === "chat" && bookingConfirmed && bookingId ? (
              <ChatBox
                meId={userId}
                otherId={chatVendorId}
                bookingId={bookingId}
                serviceName={chatVendorName}
                socket={socket}
              />
            ) : activeTab === "chat" ? (
              <p>Please book an appointment to chat with the vendor.</p>
            ) : null}

            {activeTab === "status" && <BookingStatus userId={userId} />}
          </div>
        </section>
      </div>
    </div>
  );
}
