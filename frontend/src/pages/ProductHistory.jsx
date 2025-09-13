import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProductHistory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      navigate("/login");
      return;
    }

    setUsername(storedUsername || "Guest");
    setUserId(storedUserId);

    fetch(`/api/user/history/${storedUserId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error loading history:", err));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col text-white bg-gradient-to-br from-purple-900 via-purple-800 to-black">
      {/* Navbar */}
      <nav className="bg-black text-white px-6 py-4 flex justify-between items-center shadow-md">
        {/* Left */}
        <div className="flex items-center space-x-4">
          <span className="text-lg font-bold">Tech Genie.lk</span>
          <a href="/home" className="px-4 py-1 rounded hover:bg-gray-700">
            Home
          </a>
          <a href="/products" className="px-4 py-1 rounded hover:bg-gray-700">
            Products
          </a>
          <a href="/compare" className="px-4 py-1 rounded hover:bg-gray-700">
            Compare
          </a>
        </div>

        {/* Right */}
        <div className="flex items-center space-x-3">
          {username !== "Guest" ? (
            <>
              <span className="font-bold">👤 {username}</span>
              <a
                href="/customer"
                className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
              >
                Profile
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="bg-gray-800 px-4 py-1 rounded hover:bg-gray-700"
              >
                Login
              </a>
              <a
                href="/register"
                className="bg-white text-black px-4 py-1 rounded hover:bg-gray-200"
              >
                Register
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <section className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Your Product History
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="historyGrid">
          {products.length === 0 ? (
            <p className="text-gray-400 text-center col-span-3">
              No product history found.
            </p>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="bg-white text-black p-4 rounded shadow hover:shadow-lg transition"
              >
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-40 object-cover mb-3 rounded"
                />
                <h3 className="font-semibold">{p.name}</h3>
                <p>{p.brand}</p>
                <p className="text-green-600 font-bold">${p.price}</p>
                <a
                  href={`/product-details/${p.id}`}
                  className="block mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
                >
                  View Details
                </a>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-200 text-gray-700 text-center py-4 mt-auto">
        &copy; 2025 Tech Genie
      </footer>
    </div>
  );
}
