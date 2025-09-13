import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ;

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState([]); // {type,message,meta}
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    if (username && role) {
      setUser({ username, role });
    } else {
      setUser(null);
    }
  }, []);

  // Socket notifications: outbid, ad closed
  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io(API_URL, { auth: token ? { token } : {} });
    s.on("notify:outbid", ({ title, yourBid, newBid }) => {
      setNotifs((n) => [
        {
          type: "outbid",
          message: `You\'ve been outbid on ${title}. Your ${yourBid} < ${newBid}.`,
          ts: Date.now(),
        },
        ...n,
      ].slice(0, 10));
    });
    s.on("notify:adClosed", ({ title }) => {
      setNotifs((n) => [
        { type: "adClosed", message: `${title} has closed. See related items.`, ts: Date.now() },
        ...n,
      ].slice(0, 10));
    });
    return () => s.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  const handleRepairClick = (e) => {
    e.preventDefault();
    if (user && user.role === "customer") {
      navigate("/repair");
    } else {
      navigate("/login");
    }
  };

  {
    !user || user.role === "customer" ? (
      <>
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/compare">Compare</Link>
        <Link to="/marketplace">Marketplace</Link>
        <a href="/repair" onClick={handleRepairClick}>
          Repair Services
        </a>
      </>
    ) : null;
  }

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="logo-area">
          <img
            src="https://img.icons8.com/ios-filled/24/ffffff/search.png"
            alt="Logo"
          />
          <span className="site-title">Tech Genie.lk</span>
        </div>

        {/* Hamburger for mobile */}
        <div
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className={`nav-links ${menuOpen ? "active" : ""}`}>
          {/* Public links for non-admin/vendor */}
          {!user || user.role === "customer" ? (
            <>
              <Link to="/">Home</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/products">Products</Link>
              <Link to="/compare">Compare</Link>
              <Link to="/marketplace">Marketplace</Link>
              <a href="/repair" onClick={handleRepairClick}>
                Repair Services
              </a>
            </>
          ) : null}

          {/* Vendor links */}
          {user && user.role === "vendor" && (
            <>
              <Link to="/vendor-dashboard">Dashboard</Link>
              <Link to="/products">Products</Link>
              <Link to="/marketplace">Marketplace</Link>
            </>
          )}

          {/* Admin links */}
          {user && user.role === "admin" && (
            <>
              <Link to="/admin/products">Products</Link>
              <Link to="/admin/users">Users</Link>
              <Link to="/admin/bookings">Bookings</Link>
              <Link to="/marketplace">Marketplace</Link>

            </>
          )}
        </div>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            {/* Notifications */}
            <div style={{ position: "relative", marginRight: 10 }}>
              <button
                className="nav-btn"
                onClick={() => setShowNotifs((v) => !v)}
                title="Notifications"
              >
                🔔{notifs.length > 0 ? `(${notifs.length})` : ""}
              </button>
              {showNotifs && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    background: "#fff",
                    color: "#111",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    width: 300,
                    zIndex: 10,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    maxHeight: 360,
                    overflowY: "auto",
                  }}
                >
                  {notifs.length === 0 ? (
                    <div style={{ padding: 10 }}>No notifications</div>
                  ) : (
                    notifs.map((n, i) => (
                      <div key={i} style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontWeight: 600 }}>{n.type}</div>
                        <div style={{ fontSize: 13 }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <span className="welcome-msg">Hi, {user.username}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn">
              Login
            </Link>
            <Link to="/register" className="register-btn">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
