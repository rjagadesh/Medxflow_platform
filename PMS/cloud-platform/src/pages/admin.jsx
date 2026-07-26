import React, { useState } from "react";

import Logo from "../assets/logo/logo4.svg";
import BgLogo from "../assets/img/bg.webp";
import AppCard from "@/features/apps/AppCard";
import { apps_data } from "@/_data/apps.js";

import { Box, Flex, Icon, Image, Input, Tabs } from "@chakra-ui/react";
import { Link, NavLink } from "react-router-dom";
import BlueBgImage from "../assets/img/bg-card.svg?react";
import { Text } from "@chakra-ui/react";

// import IntegrationTab from "@/features/admin/integration-tab";
import ColumnSettings from "@/features/admin/column-settings";
import MonitoringIcon from "@/assets/icons/monitoring.svg?react";
import DroidalStudioIcon from "@/assets/icons/droidal-studio.svg?react";
import DroidMetrixIcon from "@/assets/icons/droid-metrix.svg?react";
import SettingsIcon from "@/assets/icons/settings.svg?react";
import HelpIcon from "@/assets/icons/help.svg?react";
import AdminIcon from "@/assets/icons/admin.svg?react";
import DroidMetrixTextIcon from "../assets/logo/droid-metrix.svg?react";
import DroidStudioTextIcon from "../assets/logo/droid-studio.svg?react";
import AppSideBar from "@/layouts/sidebar/sidebar";
import HomeBg from "@/assets/img/home-bg.webp";
import UserMenu from "@/components/user-popover/user-popover";
import { BellIcon } from "lucide-react";
import BillingView from "@/features/admin/billing-view.jsx";
import PaymentPreview from "@/features/admin/payment-preview";

const sideBarItems = [
  {
    name: "Monitoring",
    icon: <MonitoringIcon />,
    to: "/",
  },
  {
    name: <DroidStudioTextIcon />,
    icon: <DroidalStudioIcon />,
    to: "/aba",
  },
  {
    name: "ROI",
    icon: <DroidMetrixIcon />,
    to: "/roi",
  },
  {
    name: "Admin",
    icon: <AdminIcon />,
    to: "/admin",
  },
  {
    name: "Settings",
    icon: <SettingsIcon />,
    to: "/settings",
  },
  {
    name: "Help",
    icon: <HelpIcon />,
    to: "/help",
  },
];

const AdminPage = () => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [showIntegrationForm, setShowIntegrationForm] = useState(false);

  const openUserForm = () => {
    setShowUserForm(true);
  };

  const closeUserForm = () => {
    setShowUserForm(false);
  };

  const closeIntegrationForm = () => {
    setShowIntegrationForm(false);
  };

  const generateApiKey = () => {
    const app = document.getElementById("integrationApp")?.value;
    alert("New API Key generated for " + app);
    closeIntegrationForm();
  };

  const buttonStyle = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  };

  const thStyle = {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
    backgroundColor: "#16375e",
  };

  const tdStyle = {
    border: "1px solid #ddd",
    padding: "10px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    margin: "8px 0",
    border: "1px solid #ddd",
    borderRadius: "6px",
  };

  // const [isShrink, setIsShrink] = useState(false);
  // const handleCloseSidebar = () => setIsShrink(!isShrink);
  return (
    <>
      <Box
        css={{
          bg: "linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(47, 46, 46, 1) 100%)",
        }}
        className="bg-gray-50 min-h-screen"
      >
        <div className="flex min-h-screen">
          {/* Primary Sidebar */}

          <AppSideBar
            sideBarItems={sideBarItems}
            // isShrink={isShrink}
            // handleCloseSidebar={handleCloseSidebar}
          />
          <Box
            className="flex-1 transition-all duration-500"
            css={{
              backgroundImage: `url(${HomeBg})`,
              backgroundSize: "cover",
              backgroundPosition: "bottom left -200px",
              backgroundRepeat: "no-repeat",
            }}
            style={{
              marginLeft: "260px", // Just primary sidebar width
            }}
          >
            <div className="top-4 p-4 right-4 z-50 flex items-center justify-end gap-4">
              <Text color="#fff" fontSize={"lg"}>
                Filter agents
              </Text>

              <div className="flex items-center gap-4">
                <UserMenu />
                <BellIcon color="#fff" size={24} />
              </div>
            </div>
            <div className="p-8 mt-0 ">
              <div className="w-full bg-droidal-black-300 h-full p-6">
                <div>
                  <h3
                    className="text-white"
                    style={{
                      marginTop: 0,
                      marginBottom: "15px",
                      fontSize: "20px",
                    }}
                  >
                    Admin Dashboard
                  </h3>

                  {/* Tabs for Admin Sectons */}
                  <Tabs.Root
                    size={"lg"}
                    className="text-white"
                    css={{
                      "& button": {
                        fontSize: "14px !important",
                      },
                      "& button[aria-selected=true]": {
                        color: "#fff !important",
                      },
                      "& button[aria-selected=false]": {
                        color: "gray !important",
                      },
                    }}
                    defaultValue="role"
                  >
                    <Tabs.List>
                      <Tabs.Trigger value="role">
                        User & Role Management
                      </Tabs.Trigger>
                      <Tabs.Trigger value="columns-settings">
                        Columns Settings
                      </Tabs.Trigger>
                      <Tabs.Trigger value="app">
                        App & Module Management
                      </Tabs.Trigger>
                      <Tabs.Trigger value="subscription">
                        Subscription & Licensing
                      </Tabs.Trigger>
                      <Tabs.Trigger value="audit">Audit Trail</Tabs.Trigger>
                      <Tabs.Trigger value="billing">Billing View</Tabs.Trigger>
                      <Tabs.Trigger value="payment">
                        Payment Methods
                      </Tabs.Trigger>

                      <Tabs.Trigger value="organization">
                        Organization Settings
                      </Tabs.Trigger>
                      <Tabs.Trigger value="alerts">
                        Notifications & Alerts
                      </Tabs.Trigger>
                      <Tabs.Trigger value="performance">
                        Performance Monitoring
                      </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="role">
                      {/* User & Role Management */}
                      <div>
                        <h3>User & Role Management</h3>
                        <button
                          style={{
                            ...buttonStyle,
                            background: "#4CAF50",
                            color: "white",
                          }}
                          onClick={openUserForm}
                        >
                          + Add User
                        </button>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th style={thStyle}>Name</th>
                              <th style={thStyle}>Email</th>
                              <th style={thStyle}>Role</th>
                              <th style={thStyle}>Module Access</th>
                              <th style={thStyle}>Last Login</th>
                              <th style={thStyle}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={tdStyle}>John Doe</td>
                              <td style={tdStyle}>john@example.com</td>
                              <td style={tdStyle}>Admin</td>
                              <td style={tdStyle}>All</td>
                              <td style={tdStyle}>2025-08-05</td>
                              <td style={tdStyle}>
                                <button
                                  style={{
                                    ...buttonStyle,
                                    background: "#2196F3",
                                    color: "white",
                                    marginRight: "5px",
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  style={{
                                    ...buttonStyle,
                                    background: "#f44336",
                                    color: "white",
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td style={tdStyle}>Jane Smith</td>
                              <td style={tdStyle}>jane@example.com</td>
                              <td style={tdStyle}>Agent</td>
                              <td style={tdStyle}>Claims, Intake</td>
                              <td style={tdStyle}>2025-08-04</td>
                              <td style={tdStyle}>
                                <button
                                  style={{
                                    ...buttonStyle,
                                    background: "#2196F3",
                                    color: "white",
                                    marginRight: "5px",
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  style={{
                                    ...buttonStyle,
                                    background: "#f44336",
                                    color: "white",
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Tabs.Content>
                    <Tabs.Content value="columns-settings">
                      <ColumnSettings />
                    </Tabs.Content>
                    <Tabs.Content value="app">
                      {/* App & Module Management */}
                      <div>
                        <h3>App & Module Management</h3>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th style={thStyle}>User</th>
                              <th style={thStyle}>Droid ABA</th>
                              <th style={thStyle}>Transcribe</th>
                              <th style={thStyle}>Claims Processing</th>
                              <th style={thStyle}>Patient Intake</th>
                              <th style={thStyle}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={tdStyle}>John Doe (Admin)</td>
                              <td style={tdStyle}>
                                <input type="checkbox" defaultChecked />
                              </td>
                              <td style={tdStyle}>
                                <input type="checkbox" defaultChecked />
                              </td>
                              <td style={tdStyle}>
                                <input type="checkbox" defaultChecked />
                              </td>
                              <td style={tdStyle}>
                                <input type="checkbox" defaultChecked />
                              </td>
                              <td style={tdStyle}>
                                <button
                                  style={{
                                    ...buttonStyle,
                                    background: "#2196F3",
                                    color: "white",
                                  }}
                                >
                                  Save
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td style={tdStyle}>Jane Smith (Agent)</td>
                              <td style={tdStyle}>
                                <input type="checkbox" />
                              </td>
                              <td style={tdStyle}>
                                <input type="checkbox" defaultChecked />
                              </td>
                              <td style={tdStyle}>
                                <input type="checkbox" />
                              </td>
                              <td style={tdStyle}>
                                <input type="checkbox" defaultChecked />
                              </td>
                              <td style={tdStyle}>
                                <button
                                  style={{
                                    ...buttonStyle,
                                    background: "#2196F3",
                                    color: "white",
                                  }}
                                >
                                  Save
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Tabs.Content>
                    <Tabs.Content value="subscription">
                      {/* Subscription & Licensing */}
                      <div>
                        <h3>Subscription & Licensing</h3>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th style={thStyle}>Plan</th>
                              <th style={thStyle}>Modules</th>
                              <th style={thStyle}>Seats</th>
                              <th style={thStyle}>Expiry</th>
                              <th style={thStyle}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={tdStyle}>Enterprise</td>
                              <td style={tdStyle}>All</td>
                              <td style={tdStyle}>500</td>
                              <td style={tdStyle}>2026-01-01</td>
                              <td style={tdStyle}>
                                <button
                                  style={{
                                    ...buttonStyle,
                                    background: "#2196F3",
                                    color: "white",
                                  }}
                                >
                                  Manage
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Tabs.Content>
                    <Tabs.Content value="audit">
                      {/* Audit Trail */}
                      <div>
                        <h3>Audit Trail</h3>
                        <button
                          style={{
                            ...buttonStyle,
                            background: "#9C27B0",
                            color: "white",
                            marginBottom: "15px",
                          }}
                        >
                          Export Logs (CSV)
                        </button>
                        <table style={tableStyle}>
                          <thead>
                            <tr>
                              <th style={thStyle}>User</th>
                              <th style={thStyle}>Action</th>
                              <th style={thStyle}>App</th>
                              <th style={thStyle}>Date</th>
                              <th style={thStyle}>IP</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={tdStyle}>John Doe</td>
                              <td style={tdStyle}>Edited Claim</td>
                              <td style={tdStyle}>Claims Processing</td>
                              <td style={tdStyle}>2025-08-05</td>
                              <td style={tdStyle}>192.168.1.1</td>
                            </tr>
                            <tr>
                              <td style={tdStyle}>Jane Smith</td>
                              <td style={tdStyle}>Updated Schedule</td>
                              <td style={tdStyle}>Patient Intake</td>
                              <td style={tdStyle}>2025-08-04</td>
                              <td style={tdStyle}>192.168.1.5</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Tabs.Content>
                    <Tabs.Content value="billing">
                      <BillingView />
                    </Tabs.Content>
                    <Tabs.Content value="payment">
                      {/* Payment Methods */}
                    </Tabs.Content>

                    <Tabs.Content value="organization">
                      {/* Organization Settings */}
                      <div>
                        <h3>Organization Settings</h3>
                        <button
                          style={{
                            ...buttonStyle,
                            background: "#2196F3",
                            color: "white",
                            marginBottom: "15px",
                          }}
                        >
                          Upload Branding
                        </button>
                        <p>
                          Manage tenant configs, upload logo, custom colors, and
                          org-wide notifications.
                        </p>
                      </div>
                    </Tabs.Content>
                    <Tabs.Content value="alerts">
                      {/* Notifications & Alerts */}
                      <div>
                        <h3>Notifications & Alerts</h3>
                        <form>
                          <label
                            style={{ display: "block", marginBottom: "5px" }}
                          >
                            Email for Alerts:
                          </label>
                          <input
                            type="email"
                            placeholder="alerts@example.com"
                            style={inputStyle}
                          />

                          <label
                            style={{ display: "block", marginBottom: "5px" }}
                          >
                            Mobile Number:
                          </label>
                          <input
                            type="text"
                            placeholder="+1 555-123-4567"
                            style={inputStyle}
                          />

                          <label
                            style={{ display: "block", marginBottom: "5px" }}
                          >
                            Alert Types:
                          </label>
                          <select style={inputStyle}>
                            <option>Claim Rejections</option>
                            <option>Cash Reconciliation Errors</option>
                            <option>System Downtime</option>
                          </select>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "10px",
                              marginTop: "10px",
                            }}
                          >
                            <button
                              type="button"
                              style={{
                                ...buttonStyle,
                                background: "#4CAF50",
                                color: "white",
                              }}
                            >
                              Save Settings
                            </button>
                          </div>
                        </form>
                      </div>
                    </Tabs.Content>
                    <Tabs.Content value="performance">
                      {/* Performance Monitoring */}
                      <div>
                        <h3>Performance Monitoring</h3>
                        <label
                          style={{ display: "block", marginBottom: "5px" }}
                        >
                          Select Period:
                        </label>
                        <select style={{ ...inputStyle, width: "200px" }}>
                          <option>Last 24 Hours</option>
                          <option>Last 7 Days</option>
                          <option>Last 30 Days</option>
                        </select>

                        <div style={{ marginTop: "20px" }}>
                          <div
                            style={{
                              background: "#f9f9f9",
                              padding: "15px",
                              borderRadius: "8px",
                              marginBottom: "15px",
                            }}
                          >
                            <h4 style={{ marginTop: 0 }}>System Health</h4>
                            <p>✅ Uptime: 99.98% | ⚠️ Errors: 0.2%</p>
                          </div>
                          <div
                            style={{
                              background: "#f9f9f9",
                              padding: "15px",
                              borderRadius: "8px",
                              marginBottom: "15px",
                            }}
                          >
                            <h4 style={{ marginTop: 0 }}>
                              App Transactions Report
                            </h4>
                            <p>[Graph Placeholder: Transactions over time]</p>
                          </div>
                          <div
                            style={{
                              background: "#f9f9f9",
                              padding: "15px",
                              borderRadius: "8px",
                            }}
                          >
                            <h4 style={{ marginTop: 0 }}>Module Usage</h4>
                            <p>[Graph Placeholder: Usage per module]</p>
                          </div>
                        </div>
                      </div>
                    </Tabs.Content>
                  </Tabs.Root>
                </div>
              </div>{" "}
            </div>
          </Box>

          {/* Content */}

          {/* Overlay */}
          {(showUserForm || showIntegrationForm) && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.5)",
                zIndex: 999,
              }}
            />
          )}

          {/* Add User Form */}
          {showUserForm && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#fff",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
                zIndex: 1000,
                width: "400px",
                maxWidth: "90%",
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: "15px",
                  fontSize: "18px",
                  textAlign: "center",
                }}
              >
                Add New User
              </h4>
              <input type="text" placeholder="Full Name" style={inputStyle} />
              <input type="email" placeholder="Email" style={inputStyle} />
              <input
                type="password"
                placeholder="Password"
                style={inputStyle}
              />
              <select style={inputStyle}>
                <option value="admin">Admin</option>
                <option value="teamlead">Team Lead</option>
                <option value="agent">Agent</option>
                <option value="partner">Partner</option>
              </select>
              <select style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  style={{
                    ...buttonStyle,
                    background: "#f44336",
                    color: "white",
                  }}
                  onClick={closeUserForm}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: "#4CAF50",
                    color: "white",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Integration Form */}
          {showIntegrationForm && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#fff",
                padding: "25px",
                borderRadius: "10px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
                zIndex: 1000,
                width: "400px",
                maxWidth: "90%",
              }}
            >
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: "15px",
                  fontSize: "18px",
                  textAlign: "center",
                }}
              >
                Generate API Key
              </h4>
              <select id="integrationApp" style={inputStyle}>
                {apps_data.map((app) => (
                  <option value={app.header.toLowerCase().replace(/ /g, "_")}>
                    {app.header}
                  </option>
                ))}
              </select>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  style={{
                    ...buttonStyle,
                    background: "#f44336",
                    color: "white",
                  }}
                  onClick={closeIntegrationForm}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: "#4CAF50",
                    color: "white",
                  }}
                  onClick={generateApiKey}
                >
                  Generate
                </button>
              </div>
            </div>
          )}
        </div>
      </Box>
    </>
  );
};

export default AdminPage;
