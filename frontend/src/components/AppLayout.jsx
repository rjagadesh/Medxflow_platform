/**
 * Authenticated app shell: fixed Sidebar + a slim top bar (user identity and
 * logout) + the routed page content via <Outlet>. On small screens the sidebar
 * collapses behind a hamburger toggle.
 */
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { useDevMode } from "../context/DevModeContext.jsx";
import {
  PageHeaderProvider,
  usePageHeaderValue,
} from "../context/PageHeaderContext.jsx";
import DevChat from "./DevChat.jsx";
import NotificationsBell from "./NotificationsBell.jsx";
import Sidebar from "./Sidebar.jsx";
import TenantSwitcher from "./TenantSwitcher.jsx";
import { MenuIcon } from "./icons.jsx";

// Renders the current page's title/subtitle in the top bar.
function TopbarHeader() {
  const ctx = usePageHeaderValue();
  const header = ctx?.header;
  if (!header?.title) return null;
  return (
    <div className="topbar__page">
      <span className="topbar__page-title">{header.title}</span>
      {header.subtitle && <span className="topbar__page-sub">{header.subtitle}</span>}
    </div>
  );
}

export default function AppLayout() {
  const { logout } = useAuth();
  const { devMode, toggle: toggleDevMode } = useDevMode();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false); // mobile slide-in
  // Desktop collapse-to-rail, remembered across sessions.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("eirim_sidebar_collapsed") === "1"
  );

  function toggleCollapse() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("eirim_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`layout ${collapsed ? "layout--collapsed" : ""}`}>
      <Sidebar
        open={menuOpen}
        collapsed={collapsed}
        onNavigate={() => setMenuOpen(false)}
        onToggleCollapse={toggleCollapse}
        onLogout={handleLogout}
      />

      {/* Dim overlay behind the sidebar on mobile */}
      {menuOpen && (
        <div className="layout__overlay" onClick={() => setMenuOpen(false)} />
      )}

      <PageHeaderProvider>
      <div className="layout__main">
        <header className="topbar">
          <button
            className="topbar__menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>

          <TopbarHeader />

          <div className="topbar__spacer" />

          {/* Developer mode toggle — enables the section chat on every page. */}
          <label className="devtoggle" title="Toggle developer mode">
            <span className="devtoggle__label">Developer</span>
            <input
              type="checkbox"
              className="devtoggle__input"
              checked={devMode}
              onChange={toggleDevMode}
            />
            <span className="devtoggle__track"><span className="devtoggle__thumb" /></span>
          </label>

          <NotificationsBell />
          <TenantSwitcher />
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
      </PageHeaderProvider>

      {/* Section-aware developer chat, shown only in developer mode. */}
      {devMode && <DevChat />}
    </div>
  );
}
