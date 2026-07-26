import React, { useMemo, useState } from "react";
import { Tabs, VStack } from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Box, Flex, Icon, Image, Input } from "@chakra-ui/react";
import { Link, NavLink } from "react-router-dom";
import BlueBgImage from "../assets/img/bg-card.svg?react";
import { Text } from "@chakra-ui/react";
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
import { BotIcon } from "lucide-react";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";
import getSideBarItems from "@/utils/side-bar";
import UserProfile from "./settings/user-profile";
import APISecretKeyTab from "@/features/admin/api-secret-tab";
import IntegrationTab from "@/features/admin/integration-tab";

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
    to: "/droid-metrix",
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

const styles = {
  body: {
    margin: 0,
    fontFamily: "Arial, sans-serif",
    color: "#333",
  },
  sidebar: {
    width: "260px",
    background: "#1e1e2f",
    color: "#fff",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    padding: "20px",
    overflowY: "auto",
  },
  sidebarLink: {
    display: "block",
    color: "#bbb",
    textDecoration: "none",
    margin: "10px 0",
    padding: "10px",
    borderRadius: "6px",
    transition: "background 0.3s, color 0.3s",
    cursor: "pointer",
  },
  sidebarLinkActive: {
    background: "#2d2d44",
    color: "#fff",
  },
  content: {
    padding: "30px",
  },
  section: {
    background: "#16375e",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "15px",
    fontSize: "20px",
    color: "#fff",
  },
  options: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px 0",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  optionItem: {
    background: "#16375e",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "8px 0",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  btn: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  btnAdd: {
    background: "#1e4270",
    color: "white",
  },
  btnEdit: {
    background: "#1e4270",
    color: "white",
  },
  btnDelete: {
    background: "#f44336",
    color: "white",
  },
  formGroup: {
    marginBottom: "15px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  tableCell: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
  },
  tableHeader: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
    background: "#1e4270",
  },
  cardBox: {
    background: "#1e4270",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px",
  },
  flexBox: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
};

const SettingsPage = () => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [showIntegrationForm, setShowIntegrationForm] = useState(false);

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

  const inputStyle = {
    width: "100%",
    padding: "10px",
    margin: "8px 0",
    border: "1px solid #ddd",
    borderRadius: "6px",
  };

  const dashboardNavigation = useMemo(() => {
    return getSideBarItems("Settings");
  }, []);

  return (
    <>
      <Box
        css={{
          bg: "linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(47, 46, 46, 1) 100%)",
        }}
        className="min-h-screen"
      >
        <div className="flex min-h-screen">
          {/* Primary Sidebar */}

          <AppSideBar sideBarItems={sideBarItems} />
          <Box
            className="flex-1 transition-all duration-500"
            css={{
              backgroundImage: `url(${HomeBg})`,
              backgroundSize: "cover",
              backgroundPosition: "bottom left -200px",
              backgroundRepeat: "no-repeat",
            }}
            style={{
              marginLeft: "280px", // Just primary sidebar width
            }}
          >
            <div className="top-4 p-4 right-4 z-50 flex items-center gap-4">
              <VStack justify={"space-between"} gap="2" align={"flex-start"}>
                <Text
                  color="#fff"
                  fontSize={{
                    base: "lg",
                    "2xl": "22px",
                    "3xl": "2xl",
                  }}
                  letterSpacing={"widest"}
                >
                  Settings
                </Text>
                <CustomBreadcrumb sidebarItems={dashboardNavigation} />
              </VStack>

              <div className="flex items-center gap-4">
                <UserMenu />
                <BellIcon color="#fff" size={24} />
              </div>
            </div>
            <div className="p-8 mt-0 ">
              <div className="w-full">
                <div style={styles.body}>
                  {/* Content */}
                  <div style={styles.content}>
                    {/* Settings Section */}
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>
                        ⚙️ Settings Panel (Per User/Team)
                      </h3>

                      {/* Chakra UI Tabs for Settings Sections */}
                      <Tabs.Root
                        size={"lg"}
                        className="text-white"
                        css={{
                          "& button": {
                            fontSize: "11px !important",
                          },
                          "& button[aria-selected=true]": {
                            color: "#fff !important",
                          },
                          "& button[aria-selected=false]": {
                            color: "gray !important",
                          },
                        }}
                        defaultValue="profile"
                      >
                        <Tabs.List>
                          <Tabs.Trigger value="profile">
                            User Profile
                          </Tabs.Trigger>
                          <Tabs.Trigger value="preferences">
                            App Preferences
                          </Tabs.Trigger>
                          <Tabs.Trigger value="notifications">
                            Notification Settings
                          </Tabs.Trigger>
                          <Tabs.Trigger value="data">
                            Data Settings
                          </Tabs.Trigger>
                          <Tabs.Trigger value="developer">
                            Developer Tools
                          </Tabs.Trigger>
                          <Tabs.Trigger value="agent-secret">
                            Agent Secret Key
                          </Tabs.Trigger>
                          <Tabs.Trigger value="api-secret">
                            API Secret Key
                          </Tabs.Trigger>
                        </Tabs.List>
                        <Tabs.Content value="profile">
                          <UserProfile />
                        </Tabs.Content>
                        <Tabs.Content value="preferences">
                          {/* App Preferences */}
                          <div>
                            <h3>App Preferences</h3>
                            <div style={styles.formGroup}>
                              <label>Default Landing App</label>
                              <select style={styles.input}>
                                <option>Patient Intake</option>
                                <option>Claims Processing</option>
                                <option>Transcribe</option>
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label>Default Layout View</label>
                              <select style={styles.input}>
                                <option>Card</option>
                                <option>Grid</option>
                              </select>
                            </div>
                            <div style={styles.formGroup}>
                              <label>
                                <input type="checkbox" /> Enable Dark Mode
                              </label>
                            </div>
                            <button style={{ ...styles.btn, ...styles.btnAdd }}>
                              Save Preferences
                            </button>
                          </div>
                        </Tabs.Content>
                        <Tabs.Content value="notifications">
                          {/* Notification Settings */}
                          <div>
                            <h3>Notification Settings</h3>
                            <div style={styles.formGroup}>
                              <label>
                                <input type="checkbox" /> Mute Transcribe Alerts
                              </label>
                            </div>
                            <div style={styles.formGroup}>
                              <label>
                                <input type="checkbox" /> Escalate Failed Cash
                                Match Alerts
                              </label>
                            </div>
                            <button style={{ ...styles.btn, ...styles.btnAdd }}>
                              Save Notifications
                            </button>
                          </div>
                        </Tabs.Content>
                        <Tabs.Content value="data">
                          {/* Data Settings */}
                          <div>
                            <h3>Data Settings</h3>
                            <button
                              style={{
                                ...styles.btn,
                                ...styles.btnEdit,
                                marginBottom: "15px",
                              }}
                            >
                              Export Data & Activity Logs
                            </button>
                            <div style={styles.formGroup}>
                              <label>
                                <input type="checkbox" /> Consent to Data
                                Sharing
                              </label>
                            </div>
                            <div style={styles.formGroup}>
                              <label>
                                <input type="checkbox" /> Request Data Deletion
                              </label>
                            </div>
                          </div>
                        </Tabs.Content>
                        <Tabs.Content value="developer">
                          {/* Developer Tools */}
                          <div>
                            <h3>Developer Tools</h3>
                            <button
                              style={{
                                ...styles.btn,
                                ...styles.btnAdd,
                                marginBottom: "15px",
                              }}
                            >
                              Generate API Token
                            </button>
                            <div style={styles.formGroup}>
                              <label>Custom Endpoint</label>
                              <input
                                type="text"
                                placeholder="https://api.example.com/custom"
                                style={styles.input}
                              />
                            </div>
                            <div style={styles.formGroup}>
                              <label>
                                <input type="checkbox" /> Enable Developer Mode
                              </label>
                            </div>
                          </div>
                        </Tabs.Content>
                        <Tabs.Content value="agent-secret">
                          <IntegrationTab />
                        </Tabs.Content>
                        <Tabs.Content value="api-secret">
                          <APISecretKeyTab />
                        </Tabs.Content>
                      </Tabs.Root>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Box>

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
                <option value="droidaba">Droid ABA</option>
                <option value="voice">Transcribe</option>
                <option value="claims">Claims Processing</option>
                <option value="intake">Patient Intake</option>
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

export default SettingsPage;
