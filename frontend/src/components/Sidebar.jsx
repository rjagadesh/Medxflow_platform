/**
 * Left navigation sidebar. Organised to match the MedXFlow product menu:
 * Platforms · RCM AI Agents (numbered 1-9) · Managed Billing Services ·
 * Hardware, plus a Workspace group for platform tools. Each group header is
 * collapsible (state persisted). Items are role-aware and gated by the role's
 * "View" permission where a `feature` is set.
 */
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import logo from "../assets/logo.webp";
import { useAuth } from "../context/AuthContext.jsx";
import { usePermissions } from "../context/PermissionsContext.jsx";
import Avatar from "./Avatar.jsx";
import {
  ChartIcon,
  ChevronLeftIcon,
  ClockIcon,
  CreditCardIcon,
  DashboardIcon,
  FolderIcon,
  InboxIcon,
  KeyIcon,
  LicenseIcon,
  LogoutIcon,
  MonitorIcon,
  PlugIcon,
  ScrollIcon,
  SettingsIcon,
  ShareIcon,
  ShieldCheckIcon,
  SwapIcon,
  TabletIcon,
  UsersIcon,
  VideoIcon,
  VoiceIcon,
  ZapIcon,
} from "./icons.jsx";

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Tenant Admin",
  MEMBER: "Member",
};

// Each item: { to, label, icon?, num?, end?, roles?, feature? }.
//   num     — renders a numbered badge instead of an icon (RCM AI Agents)
//   roles   — restricts visibility to those roles
//   feature — gated by the role's "View" permission from the Roles matrix
const GROUPS = [
  {
    heading: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: DashboardIcon, end: true }],
  },
  {
    heading: "Platforms",
    items: [
      { to: "/ai-front-desk-kiosk", label: "AI Front Desk Kiosk", icon: MonitorIcon },
      { to: "/voice-ai", label: "Voice AI", icon: VoiceIcon, feature: "voice-ai" },
      { to: "/skills/telehealth", label: "Telehealth", icon: VideoIcon, feature: "telehealth" },
      { to: "/vob-portal", label: "Eligibility Verification", icon: ShieldCheckIcon, feature: "eligibility-verification" },
      { to: "/m/eob-to-era", label: "EOB to ERA", icon: SwapIcon },
      { to: "/skills/referrals", label: "Referral Workflow", icon: ShareIcon, feature: "referrals" },
      { to: "/decision-engine", label: "Decision Engine", icon: ChartIcon, feature: "decision-engine" },
    ],
  },
  {
    heading: "RCM AI Agents",
    items: [
      { to: "/m/pre-registration-scheduling", label: "Pre-registration & Scheduling", num: 1 },
      { to: "/vob-portal", label: "Eligibility Verification", num: 2 },
      { to: "/m/registration-check-in", label: "Registration & Check-in", num: 3 },
      { to: "/m/charge-capture-coding", label: "Charge Capture & Coding", num: 4 },
      { to: "/skills/claim-submission", label: "Claims Submission", num: 5 },
      { to: "/m/payment-posting-remittance", label: "Payment Posting & Remittance", num: 6 },
      { to: "/skills/denial-management", label: "Denial Management", num: 7 },
      { to: "/m/patient-statements-collections", label: "Patient Statements & Collections", num: 8 },
      { to: "/decision-engine", label: "Reporting & Analytics", num: 9 },
    ],
  },
  {
    heading: "Managed Billing Services",
    items: [
      { to: "/m/managed-billing-services", label: "Managed Billing Services", icon: UsersIcon },
    ],
  },
  {
    heading: "Hardware",
    items: [
      { to: "/m/self-service-kiosk", label: "Self-service Kiosk", icon: MonitorIcon },
      { to: "/m/reception-tablet", label: "Reception Tablet", icon: TabletIcon },
      { to: "/m/card-payment-terminal", label: "Card Payment Terminal", icon: CreditCardIcon },
      { to: "/m/voice-gateway", label: "Voice Gateway", icon: VoiceIcon },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { to: "/connectors", label: "Connectors", icon: PlugIcon, feature: "connectors" },
      { to: "/files", label: "File Manager", icon: FolderIcon, feature: "file-manager" },
      { to: "/vault", label: "Secret Vault", icon: KeyIcon, feature: "secret-vault" },
      { to: "/scheduled-runs", label: "Scheduled Runs", icon: ClockIcon, feature: "scheduled-runs" },
      { to: "/automations", label: "Automations", icon: ZapIcon, feature: "automations" },
      { to: "/audit-log", label: "Audit Log", icon: ScrollIcon, feature: "audit-log" },
      { to: "/review-queue", label: "Review Queue", icon: InboxIcon, feature: "review-queue" },
      { to: "/licenses", label: "Licenses", icon: LicenseIcon, roles: ["SUPER_ADMIN"], feature: "licenses" },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const STORE_KEY = "mxf_sidebar_groups";

function CaretIcon(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function Sidebar({ open, collapsed, onNavigate, onToggleCollapse, onLogout }) {
  const { user } = useAuth();
  const { can } = usePermissions();

  const [closedGroups, setClosedGroups] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || "[]")); }
    catch { return new Set(); }
  });

  function toggleGroup(heading) {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      next.has(heading) ? next.delete(heading) : next.add(heading);
      localStorage.setItem(STORE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  const visible = (item) => {
    if (item.roles && !item.roles.includes(user?.role)) return false;
    if (item.feature && !can(item.feature, "can_view")) return false;
    return true;
  };

  return (
    <aside
      className={`sidebar ${open ? "sidebar--open" : ""} ${
        collapsed ? "sidebar--collapsed" : ""
      }`}
    >
      <div className="sidebar__brand">
        {collapsed ? (
          <img src="/fav.png" alt="MedXFlow" className="sidebar__mark" />
        ) : (
          <img src={logo} alt="MedXFlow" className="sidebar__logo" />
        )}
        <button
          className="sidebar__collapse"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand menu" : "Collapse menu"}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        >
          <ChevronLeftIcon width={18} height={18} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {GROUPS.map((group) => {
          const items = group.items.filter(visible);
          if (!items.length) return null;
          // Per-group collapse only applies in the expanded sidebar.
          const isClosed = !collapsed && closedGroups.has(group.heading);
          return (
            <div key={group.heading} className="sidebar__group">
              <button
                type="button"
                className={`sidebar__heading ${isClosed ? "is-collapsed" : ""}`}
                onClick={() => toggleGroup(group.heading)}
                aria-expanded={!isClosed}
              >
                <span>{group.heading}</span>
                <CaretIcon className="sidebar__caret" />
              </button>
              {!isClosed && items.map(({ to, label, icon: Icon, num, end }) => (
                <NavLink
                  key={to + label}
                  to={to}
                  end={end}
                  className="sidebar__item"
                  onClick={onNavigate}
                  title={collapsed ? label : undefined}
                >
                  {num != null ? (
                    <span className="sidebar__num">{num}</span>
                  ) : (
                    <Icon className="sidebar__icon" />
                  )}
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        {user && (
          <div className="sidebar__user">
            <Link to="/settings" className="sidebar__user-id" onClick={onNavigate} title="Profile & settings">
              <Avatar user={user} size={36} />
              <span className="sidebar__user-meta">
                <span className="sidebar__user-name">{user.display_name}</span>
                <span className={`badge badge--${user.role.toLowerCase()}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </span>
            </Link>
            <button className="sidebar__logout" onClick={onLogout} title="Log out" aria-label="Log out">
              <LogoutIcon width={16} height={16} />
              <span>Log out</span>
            </button>
          </div>
        )}
        <span className="sidebar__version">MedXFlow · v1.0</span>
      </div>
    </aside>
  );
}
