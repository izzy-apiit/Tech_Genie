import "leaflet/dist/leaflet.css";
import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useParams,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";
import "./styles/theme.css";
import "./components/Navbar.css";
import "./Auth.css";
import "./styles/personalized.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import AdminProducts from "./components/AdminProducts";
import AdminUsers from "./components/AdminUsers";
import AdminBookings from "./components/AdminBookings";
import ProductCard from "./ProductCard";
import BookingForm from "./components/BookingForm";
import BookingStatus from "./components/BookingStatus";
import RepairShops from "./components/RepairShops";
import ChatBox from "./components/ChatBox";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Products from "./pages/Products";
import Customer from "./pages/Customer";
import ProductHistory from "./pages/ProductHistory";
import Wishlist from "./pages/Wishlist";
import Compare from "./pages/Compare";
import RepairServices from "./pages/RepairServices";
import ProductDetail from "./pages/ProductDetail";
import VendorDashboard from "./pages/VendorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Marketplace from "./pages/Marketplace";
import ManageBids from "./pages/ManageBids";
import ManageAuction from "./pages/ManageAuction";
import PostAd from "./pages/Postad";
import UProductView from "./pages/UProductView";
import Dashboard from "./pages/Dashboard";

// ---------------- Wrappers for dynamic routes ----------------
function AdminBookingsWrapper() {
  const { shopId } = useParams();
  return <AdminBookings shopId={shopId} />;
}

function ChatBoxWrapper() {
  const { userId, shopId } = useParams();
  return <ChatBox userId={userId} shopId={shopId} />;
}

// ---------------- Main App Component ----------------
function AppContent() {
  const location = useLocation();
  const userId = "test_user"; // Replace with dynamic ID if using auth

  // Hide navbar only on login/register pages
  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/404";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Default Home Route */}
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route path="/marketplace" element={<Marketplace />} />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminBookings />
            </ProtectedRoute>
          }
        />

        {/* Vendor Dashboard */}
        <Route
          path="/vendor-dashboard"
          element={
            <ProtectedRoute allow={["vendor"]}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />

        {/* App Routes */}
        <Route path="/booking" element={<BookingForm userId={userId} />} />
        <Route path="/status" element={<BookingStatus userId={userId} />} />
        <Route path="/repair-shops" element={<RepairShops />} />
        <Route
          path="/admin-bookings/:shopId"
          element={<AdminBookingsWrapper />}
        />
        <Route path="/chat/:userId/:shopId" element={<ChatBoxWrapper />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/history" element={<ProductHistory />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/repair" element={<RepairServices />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/product" element={<ProductCard />} />
        <Route path="/manage-bids" element={<ManageBids />} />
        <Route path="/manage-auction" element={<ManageAuction />} />
        <Route path="/post-ad" element={<PostAd />} />
        <Route path="/used-product/:id" element={<UProductView />} />

        {/* ✅ Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

// ---------------- Export App with Router ----------------
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
