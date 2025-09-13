import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Auth.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Registration successful! Please login.");
        navigate("/login");
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      alert("Server error, please try again later");
    }
  };

  return (
    // 🔹 NEW WRAPPER ADDED HERE
    <div className="auth-page">
      <div className="register-wrapper">
        {/* Left side - image */}
        <div className="register-left">
          <div className="register-welcome">
            <h1>
              Join <span className="brand">Tech Genie</span> Today!
            </h1>
            <p>Register now and unlock smarter tech solutions for your life.</p>
          </div>
        </div>

        {/* Right side - form */}
        <div className="register-right">
          <div className="register-box">
            <h2 className="register-title">Create an Account</h2>

            <form onSubmit={handleRegister} className="register-form">
              <div>
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <small style={{ color: "#6b7280" }}>
                  We’ll use this to send booking updates by SMS.
                </small>
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">
                    Vendor (requires admin approval)
                  </option>
                </select>
              </div>

              <button type="submit" className="form-button">
                Register
              </button>
            </form>

            <p className="form-footer">
              Already have an account?{" "}
              <a href="/login" className="register-link">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
