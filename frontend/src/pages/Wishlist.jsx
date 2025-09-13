import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      navigate("/login");
      return;
    }
    setUserId(storedUserId);

    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "Guest");

    fetch(`/api/user/wishlist/${storedUserId}`)
      .then((res) => res.json())
      .then((data) => setWishlist(data))
      .catch((err) => console.error("Failed to fetch wishlist:", err));
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

      {/* Wishlist Content */}
      <section className="p-6 max-w-6xl mx-auto flex-grow">
        <h2 className="text-2xl font-bold mb-4">Your Wishlist</h2>
        {wishlist.length === 0 ? (
          <p className="text-gray-400">Your wishlist is empty.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white text-black p-4 rounded shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/product-details/${product.id}`)}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-40 object-cover mb-3 rounded"
                />
                <h3 className="font-semibold">{product.name}</h3>
                <p>{product.brand}</p>
                <p className="text-lg font-bold">${product.price}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-200 text-gray-700 text-center py-4 mt-auto">
        &copy; 2025 Tech Genie
      </footer>
    </div>
  );
}
