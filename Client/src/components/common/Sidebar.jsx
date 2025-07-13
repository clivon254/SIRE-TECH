import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../../context/store";
import { MdDashboard, MdWork, MdPeople, MdPerson, MdDescription, MdReceipt } from "react-icons/md";
import { XMarkIcon } from "@heroicons/react/24/solid";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard className="h-5 w-5" /> },
  { to: "/project", label: "Project", icon: <MdWork className="h-5 w-5" /> },
  { to: "/client", label: "Client", icon: <MdPeople className="h-5 w-5" /> },
  { to: "/user", label: "User", icon: <MdPerson className="h-5 w-5" /> },
  { to: "/quatation", label: "Quatation", icon: <MdDescription className="h-5 w-5" /> },
  { to: "/invoice", label: "Invoice", icon: <MdReceipt className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useContext(StoreContext);
  const location = useLocation();

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
          fixed z-50 top-0 left-0 h-full w-64 bg-white shadow-lg border-r
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0 md:w-1/3 md:max-w-xs md:h-auto md:shadow-none md:border-none
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
        <nav className="flex flex-col gap-2 p-6 pt-0 md:pt-0">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === link.to
                  ? "bg-red-600 text-white"
                  : "text-gray-700 hover:bg-red-50 hover:text-red-700"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}