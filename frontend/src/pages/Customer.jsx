import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Customer() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Guest User";

  useEffect(() => {
    const nameElem = document.getElementById("userName");
    if (nameElem) nameElem.textContent = username;
  }, [username]);

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
          {username && username !== "Guest User" ? (
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

      {/* ✅ Customer Info */}
      <section className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg max-w-4xl mx-auto mt-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 id="userName" className="text-2xl font-bold">
              {username}
            </h2>
            <p className="text-gray-500 dark:text-gray-300">Welcome back!</p>
          </div>
        </div>
      </section>

      {/* ✅ Options */}
      <section className="grid grid-cols-2 gap-6 mt-8 max-w-4xl mx-auto">
        {/* Wishlist */}
        <a
          href="/wishlist"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg cursor-pointer text-center block"
        >
          <img
            src="https://img.icons8.com/ios-filled/50/000000/like--v1.png"
            className="mx-auto mb-3 dark:invert"
          />
          <h3 className="text-lg font-semibold">Wishlist</h3>
          <p className="text-gray-500 text-sm">View your favorite products</p>
        </a>

        {/* History */}
        <a
          href="/history"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg cursor-pointer text-center block"
        >
          <img
            src="https://img.icons8.com/ios-filled/50/000000/activity-history.png"
            className="mx-auto mb-3 dark:invert"
          />
          <h3 className="text-lg font-semibold">Product History</h3>
          <p className="text-gray-500 text-sm">Check your past views</p>
        </a>
      </section>

      {/* ✅ Footer */}
      <footer className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-center py-4 mt-auto">
        &copy; 2025 Tech Genie | AI-powered Assistance
      </footer>
    </div>
  );
}
