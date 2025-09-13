import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("username", data.name);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("role", data.role);
        localStorage.setItem("token", data.token);

        if (data.role === "admin") navigate("/admin");
        else if (data.role === "vendor") navigate("/vendor-dashboard");
        else navigate("/");
      } else {
        alert(data.error);
      }
    } catch {
      alert("Server error, please try again later");
    }
  };

  return (
    <div className="auth-page">
      <div className="login-wrapper">
        {/* LEFT SIDE IMAGE OR BACKGROUND */}
        <div className="login-left">
          <div className="welcome-text">
            <h1>
              Welcome Back to <span className="brand">Tech Genie</span>
            </h1>
            <p>Login to continue</p>
          </div>
        </div>

        {/* RIGHT SIDE LOGIN CARD */}
        <div className="login-right">
          <div className="login-box">
            <h2 className="login-title">Login to Your Account</h2>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
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

              <div className="form-group">
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

              <button type="submit" className="login-button">
                Login
              </button>
            </form>

            <p className="login-footer">
              Don't have an account?{" "}
              <Link to="/register" className="register-link">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
