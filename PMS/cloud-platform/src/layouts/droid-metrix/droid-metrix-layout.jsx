import React, { useState } from "react";
import BgImage from "../../assets/img/droid-metrix-bg.png";
import { MenuIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import DroidMetrixLogo from "@/assets/logo/droid-metrix.png";
import { GaugeIcon } from "lucide-react";
import { UsersRoundIcon } from "lucide-react";
import { LogOutIcon } from "lucide-react";
import HomeBg from "@/assets/img/home-bg.webp";

const DroidMetrixLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Mock user data (replace with props or context)
  const user = {
    name: "Admin User",
    clientName: "Demo Client",
    userType: "admin",
    superadminUserType: null,
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log("Logout clicked");
  };

  const handleSidebarToggle = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  //   if (isLoading) {
  //     return (
  //       <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
  //         <div className="text-center">
  //           <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
  //           <div className="text-white text-xl font-bold">
  //             Droid Metrics<span className="animate-pulse">...</span>
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-droidal-black-300 text-white transition-all duration-300 z-40 ${
          sidebarExpanded ? "w-64" : "w-20"
        } hover:w-64 group`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-x-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src={DroidMetrixLogo} alt="MedXFlow Logo" />
            </div>
            <span
              className={`font-bold text-lg ${
                !sidebarExpanded ? "hidden" : "block"
              } group-hover:block`}
            >
              Droid<strong className="text-droid-primary-400">Metrix</strong>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          <ul className="flex flex-col gap-y-2 px-4">
            <li>
              <NavLink
                to="/droid-metrix"
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-x-3 p-3 rounded-lg bg-droid-primary-400 text-white"
                    : "flex items-center gap-x-3 p-3 rounded-lg"
                }
                end
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span
                  className={`${
                    !sidebarExpanded ? "hidden" : "block"
                  } group-hover:block`}
                >
                  Dashboard
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/droid-metrix/roi"
                className={({ isActive }) =>
                  isActive
                    ? "flex items-center gap-x-3 p-3 rounded-lg bg-droid-primary-400 text-white"
                    : "flex items-center gap-x-3 p-3 rounded-lg"
                }
                end
              >
                <GaugeIcon size={20} />
                <span
                  className={`${
                    !sidebarExpanded ? "hidden" : "block"
                  } group-hover:block`}
                >
                  ROI
                </span>
              </NavLink>
            </li>
            {user.userType === "admin" && (
              <li>
                <NavLink
                  to="/droid-metrix/admin"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center gap-x-3 p-3 rounded-lg bg-droid-primary-400 text-white"
                      : "flex items-center gap-x-3 p-3 rounded-lg"
                  }
                  end
                >
                  <UsersRoundIcon size={20} />
                  <span
                    className={`${
                      !sidebarExpanded ? "hidden" : "block"
                    } group-hover:block`}
                  >
                    Admin
                  </span>
                </NavLink>
              </li>
            )}
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-x-3 p-3 rounded-lg hover:bg-gray-700 text-gray-300 w-full text-left"
              >
                <LogOutIcon size={20} />
                <span
                  className={`${
                    !sidebarExpanded ? "hidden" : "block"
                  } group-hover:block`}
                >
                  Logout
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Navigation */}
        <div className="bg-droidal-black-300 shadow-sm  h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-x-4">
            <MenuIcon color="#fff" onClick={handleSidebarToggle} />

            <h1 className="text-xl font-semibold text-gray-100">Dashboard</h1>
          </div>

          <div className="flex items-center gap-x-4">
            <div className="flex items-center gap-x-3">
              <div className="w-8 h-8 bg-droid-primary-400 rounded-full flex items-center justify-center !text-white font-semibold">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-100">Hi, {user.name}</div>
                <div className="text-gray-300">{user.userType}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div
          className="min-h-screen bg-cover bg-center p-6"
          style={{
            backgroundColor: "#000",
            backgroundImage: `url(${HomeBg})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom left -300px",
            backgroundRepeat: "no-repeat",
          }}
        >
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <footer
        className={`bg-droidal-black-300 py-4 px-6 transition-all duration-300 ${
          sidebarExpanded ? "ml-64" : "ml-20"
        }`}
      >
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div className="flex gap-x-4">
            <a href="#" className="hover:text-droid-primary-400">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-droid-primary-400">
              Terms of Use
            </a>
          </div>
          <div className="flex items-center gap-x-2">
            <span className="text-gray-300">Powered By</span>
            <a
              href="https://droidal.com/"
              className="flex items-center gap-x-1 text-blue-600 hover:text-blue-800"
            >
              <span className="font-semibold">MedXFlow</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DroidMetrixLayout;
