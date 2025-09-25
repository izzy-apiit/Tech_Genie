import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ;

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState([]); // {type,message,meta}
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    if (username && role) {
      setUser({ username, role });
    } else {
      setUser(null);
    }
  }, []);

  // Close mobile menu and scroll to top on route change
  useEffect(() => {
    setMenuOpen(false);
    setShowAuthMenu(false);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    // Prevent body from staying locked if it was
    document.body.style.overflow = "";
  }, [location.pathname]);

  // Lock body scroll while overlay menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest?.(".auth-icon-wrapper")) {
        setShowAuthMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
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

  const onNavClick = () => setMenuOpen(false);

  return (
    <nav className={`navbar ${menuOpen ? "menu-open" : ""}`}>
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
          {menuOpen && (
            <button aria-label="Close menu" className="close-btn" onClick={() => setMenuOpen(false)}>×</button>
          )}
          {/* Public links for non-admin/vendor */}
          {!user || user.role === "customer" ? (
            <>
              <Link to="/" onClick={onNavClick}>Home</Link>
              <Link to="/dashboard" onClick={onNavClick}>Dashboard</Link>
              <Link to="/products" onClick={onNavClick}>Products</Link>
              <Link to="/compare" onClick={onNavClick}>Compare</Link>
              <Link to="/marketplace" onClick={onNavClick}>Marketplace</Link>
              <a href="/repair" onClick={(e) => { handleRepairClick(e); onNavClick(); }}>
                Repair Services
              </a>
            </>
          ) : null}

          {/* Vendor links */}
          {user && user.role === "vendor" && (
            <>
              <Link to="/vendor-dashboard" onClick={onNavClick}>Dashboard</Link>
              <Link to="/products" onClick={onNavClick}>Products</Link>
              <Link to="/marketplace" onClick={onNavClick}>Marketplace</Link>
            </>
          )}

          {/* Admin links */}
          {user && user.role === "admin" && (
            <>
              <Link to="/admin/products" onClick={onNavClick}>Products</Link>
              <Link to="/admin/users" onClick={onNavClick}>Users</Link>
              <Link to="/admin/bookings" onClick={onNavClick}>Bookings</Link>
              <Link to="/marketplace" onClick={onNavClick}>Marketplace</Link>

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
          <div className="auth-actions">
            <Link to="/login" className="nav-btn hide-on-mobile">
              Login
            </Link>
            <Link to="/register" className="register-btn hide-on-mobile">
              Register
            </Link>
            <div className="auth-icon-wrapper show-on-mobile">
              <button
                type="button"
                className="auth-icon-btn"
                aria-label="Account options"
                onClick={() => setShowAuthMenu((v) => !v)}
              >
                <span role="img" aria-hidden="true">
                  👤
                </span>
              </button>
              {showAuthMenu && (
                <div className="auth-dropdown">
                  <button type="button" onClick={() => { setShowAuthMenu(false); navigate("/login"); }}>
                    Login
                  </button>
                  <button type="button" onClick={() => { setShowAuthMenu(false); navigate("/register"); }}>
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
