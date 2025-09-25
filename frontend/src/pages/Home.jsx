import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import ProductCard from "../ProductCard";
import FloatingRobot from "../components/FloatingRobot";
import { buildApiUrl } from "../utils/api";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(
    localStorage.getItem("username") || "",
  );

  // Chat states with persistence
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("chatMessages") || "[]"),
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // time-based greeting for input placeholder
  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Core send routine that can be reused by featured picks
  const sendQuery = async (query) => {
    const q = (query ?? input).trim();
    if (!q) return;

    setMessages((msgs) => [...msgs, { sender: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch(buildApiUrl("/api/product-finder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();

      if (Array.isArray(data.reply)) {
        if (data.reply.length === 0) {
          setMessages((msgs) => [
            ...msgs,
            {
              sender: "bot",
              text: "I couldn’t find matching products right now. Try rephrasing or broadening your request.",
            },
          ]);
        } else {
          // limit to max 4 products for compact replies
          const productsWithView = data.reply.slice(0, 4).map((p) => ({
            ...p,
            onView: () =>
              navigate(`/product/${p.id}`, { state: { product: p } }),
          }));
          setMessages((msgs) => [
            ...msgs,
            { sender: "bot", products: productsWithView },
          ]);
        }
      } else {
        setMessages((msgs) => [...msgs, { sender: "bot", text: data.reply }]);
      }

      setInput("");
    } catch (error) {
      console.error(error);
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Error: Could not get response." },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const handleSend = () => sendQuery();

  // Scroll to bottom on new messages
  useEffect(() => {
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  }, [messages, loading]);

  return (
    <div className="home-container">
      {/* Chatbot Section */}
      <section className="chatbot-container card">
        <h3 className="chatbot-greeting">
          {messages.length === 0
            ? `Hey ${username || "there"}, ask me about tech products.`
            : "Let's continue chatting..."}
        </h3>

        {/* Start New Chat Button */}
        <button className="new-chat-btn" onClick={() => setMessages([])}>
          Start New Chat
        </button>

        <div className="chatbot-input-container">
          <input
            type="text"
            className="chatbot-input"
            placeholder={`${getTimeGreeting()}, enter your preferences ${username || "User"}!`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="chatbot-send-btn"
            aria-label="Send"
          >
            &#9658;
          </button>
        </div>

        <div className="chatbot-messages" id="chatMessages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.sender}`}>
              {m.text}
              {m.products && (
                <div className="products-container">
                  {m.products.map((p, idx) => (
                  <ProductCard
                      key={idx}
                      product={p}
                      enableCompare={true}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="typing">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </div>
          )}
        </div>
      </section>

      {/* Hero Banner */}
      <section className="hero-banner">
        <h2>Discover the Future of Tech</h2>
        <p>
          AI-powered shopping assistant helping you find the right products
          faster.
        </p>
        <button onClick={() => navigate("/products")} className="primary-btn">
          Explore Products
        </button>
      </section>

      {/* Quick Actions removed per request */}

      {/* Browse Categories */}
      <section className="category-section">
        <h3 className="category-title">Browse Categories</h3>
        <div className="category-grid">
          {[
            { name: "Smartphones", icon: "smartphone" },
            { name: "Laptops", icon: "laptop" },
            { name: "Headphones", icon: "headphones" },
            { name: "Gaming Consoles", icon: "controller" },
          ].map((cat) => (
            <button
              key={cat.name}
              onClick={() =>
                navigate(
                  `/products?category=${encodeURIComponent(
                    cat.name.toLowerCase().replace(" ", ""),
                  )}`,
                )
              }
              className="category-card"
            >
              <img
                src={`https://img.icons8.com/ios-filled/100/000000/${cat.icon}.png`}
                className="category-icon"
                alt={cat.name}
              />
              <h4>{cat.name}</h4>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      <section className="featured-section">
        <h3>Featured Picks</h3>
        <div className="featured-grid">
          <button
            className="featured-card"
            onClick={() => sendQuery("Best smartphone 2025 under LKR 250000")}
          >
            🔥 Best Smartphone 2025
          </button>
          <button
            className="featured-card"
            onClick={() => sendQuery("Top laptop for students under LKR 200000")}
          >
            💻 Top Laptop for Students
          </button>
          <button
            className="featured-card"
            onClick={() => sendQuery("Noise cancelling headphones under LKR 60000")}
          >
            🎧 Noise Cancelling Headphones
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        &copy; 2025 Tech Genie | AI-powered Assistance
      </footer>

      {/* Floating robot mascot bottom-right */}
      <FloatingRobot />
    </div>
  );
}
