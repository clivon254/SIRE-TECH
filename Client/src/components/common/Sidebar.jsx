import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../../context/store";
import { MdDashboard, MdWork, MdPeople, MdPerson, MdDescription, MdReceipt } from "react-icons/md";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { FiLogOut } from "react-icons/fi";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard className="h-5 w-5" /> },
  { to: "/project", label: "Project", icon: <MdWork className="h-5 w-5" /> },
  { to: "/client", label: "Client", icon: <MdPeople className="h-5 w-5" /> },
  { to: "/user", label: "User", icon: <MdPerson className="h-5 w-5" /> },
  { to: "/quatation", label: "Quatation", icon: <MdDescription className="h-5 w-5" /> },
  { to: "/invoice", label: "Invoice", icon: <MdReceipt className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, setToken } = useContext(StoreContext);
  const location = useLocation();

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    // Optionally, you can redirect here if you want
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/10 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-screen w-64 bg-white shadow-lg border-r
          transform transition-transform duration-300
          flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:w-[30%] md:max-w-xs md:h-full md:shadow-none md:border-none
          overflow-y-auto
        `}
        style={{ minWidth: "200px", maxWidth: "350px" }}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-end md:hidden p-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-red-600 hover:bg-red-50 rounded-lg p-1 transition"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
        </div>
        {/* Friendly heading */}
        <div className="px-6 pt-2 pb-4">
          <h2 className="text-lg font-bold text-red-600 mb-1">Welcome to SIRE TECH</h2>
          <p className="text-xs text-gray-500">Your business, powered by innovation.</p>
        </div>
        <nav className="flex flex-col gap-1 px-4 pb-4 flex-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-small text-xs transition ${
                location.pathname === link.to
                  ? "bg-red-50 text-red-600"
                  : "text-red-600 hover:bg-red-50 hover:text-red-500"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-3 mb-4 rounded-lg font-medium text-sm text-red-600 hover:bg-red-50 transition"
        >
          <FiLogOut className="h-5 w-5" />
          Logout
        </button>
      </aside>
    </>
  );
}