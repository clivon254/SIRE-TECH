import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/LOGO.png";
import { useSelector } from "react-redux";
import { Menu } from "@headlessui/react";
import { UserCircleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import { useContext } from "react";
import { StoreContext } from "../../context/store";
import { FiLogOut } from "react-icons/fi";

export default function Header() {

  const {User} = useSelector((state) => state.user);

  const { sidebarOpen, setSidebarOpen, setToken } = useContext(StoreContext);

  const navigate = useNavigate()

  // Logout handler
  const handleLogout = () => {

    setToken("");

    localStorage.removeItem("token");

    sessionStorage.removeItem("token");

    // Optionally, redirect to login or landing page here
    navigate('/landing-page')

  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src={logo}
              alt="SIRE TECH Logo"
              className="h-10 w-auto object-contain"
              style={{ maxHeight: 40 }}
            />
          </Link>

          <div className="flex items-center gap-x-2">
            {/* Mobile Menu Icon */}
            <button
              className="md:hidden p-1 rounded-lg text-red-600 hover:bg-red-50 transition"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* Avatar and Menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center focus:outline-none">
                {User?.avatar ? (
                  <img
                    src={User.avatar}
                    alt={User.username}
                    className="h-10 w-10 rounded-full object-cover border-2 border-red-500"
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                )}
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-50">
                <div className="p-4 border-b">
                  <div className="font-semibold text-lg text-gray-900">{User?.username || "User"}</div>
                  <div className="text-sm text-gray-500">{User?.email || "user@example.com"}</div>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`block px-4 py-2 text-sm ${
                          active ? "bg-red-50 text-red-700" : "text-gray-700"
                        }`}
                      >
                        Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                          active ? "bg-red-50 text-red-700" : "text-gray-700"
                        }`}
                      >
                        <FiLogOut className="h-4 w-4" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
}
