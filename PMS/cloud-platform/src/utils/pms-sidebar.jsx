const settingsSideBar = [
  {
    name: "User Profile",
    icon: <RiChatPollLine className="text-xl text-current" />,
    to: "/settings/profile",
  },
  {
    name: "Notifications",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/notifications",
  },
  {
    name: "Data Settings",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/data-settings",
  },
  {
    name: "Agent Secret Keys",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/agent-secret-keys",
  },
  {
    name: "API Secret Keys",
    icon: <DiGoogleAnalytics className="text-xl text-current" />,
    to: "/settings/api-secret-keys",
  },
];

const getSideBarItems = (app_name, isInsuranceApp) => {
  switch (app_name) {
    case "PMS":
      return abaSidebar;

    default:
      if (isInsuranceApp) {
        return [
          ...sidebar,
          {
            name: "Instructions",
            icon: <DiGoogleAnalytics className="text-xl text-current" />,
            to: (suffix) => suffix + "/instructions",
          },
        ];
      }
      return sidebar;
  }
};

export default getSideBarItems;
