export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { key: "myshop", label: "My Shop" },
    { key: "bookings", label: "Bookings" },
    { key: "repairs", label: "Repair Jobs" },
    { key: "profile", label: "Profile" },
    { key: "logout", label: "Logout" },
  ];

  const handleClick = (tab) => {
    if (tab === "logout") {
      localStorage.clear();
      window.location.href = "/login";
    } else setActiveTab(tab);
  };

  return (
    <aside className="w-64 bg-white shadow-md p-4">
      <h2 className="text-xl font-bold mb-6">Vendor Dashboard</h2>
      <ul>
        {tabs.map((tab) => (
          <li
            key={tab.key}
            className={`p-3 rounded cursor-pointer mb-2 ${
              activeTab === tab.key
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-200"
            }`}
            onClick={() => handleClick(tab.key)}
          >
            {tab.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
