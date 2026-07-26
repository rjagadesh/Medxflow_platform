import React, { useEffect, useLayoutEffect } from "react";
import UserMenu from "@/components/user-popover/user-popover";
import { BellIcon } from "lucide-react";

import { useState } from "react";
import HomeBg from "@/assets/img/home-bg.webp";
import AppSideBar from "@/layouts/sidebar/sidebar";
import getSideBarItems from "@/utils/side-bar";
import { useMemo } from "react";
import { Box, HStack, VStack, Image, Icon } from "@chakra-ui/react";
import { Outlet, useParams, useLocation } from "react-router-dom";
import { Text } from "@chakra-ui/react";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";

import MonitoringIcon from "@/assets/icons/monitoring.svg?react";
import PmsIcon from "@/assets/icons/pms-icon.svg?react";

import DroidalStudioIcon from "@/assets/icons/droidal-studio.svg?react";
import DroidMetrixIcon from "@/assets/icons/droid-metrix.svg?react";
import SettingsIcon from "@/assets/icons/settings.svg?react";
import HelpIcon from "@/assets/icons/help.svg?react";
import AdminIcon from "@/assets/icons/admin.svg?react";
// import DroidStudioTextIcon from "@/assets/logo/droid-studio.svg?react";
import FileManagerIcon from "@/assets/icons/filemanagericon.svg?react";
import AgentFlowTextIcon from "@/assets/icons/agentFlow.svg?react";
import SecondarySidebar from "../sidebar/secondary-sidebar";
import { useGetDepartments } from "@/hooks/query/useGetDepartments";
import { atobAgentId, atobDepartmentId } from "@/utils/helper";
import { useGetAgents } from "@/hooks/query/useGetAgents";
import AgentComboBox from "@/features/apps/agent-combo-box";
import { MdHealthAndSafety } from "react-icons/md";
import { LucideGradientIcon } from "@/features/home/home-card";
import { TbBrandOnedrive } from "react-icons/tb";
import useSidebarStore from "@/components/globalvar/isshrink";
import { useAuth } from "@/store/providers/auth-provider";
import VoiceAILogo from "@/assets/icons/voice_ai.svg?react";
import VoiceAILogoImage from "@/assets/icons/voice_ai.png";
import { RiMicAiLine } from "react-icons/ri";
import { Mic } from "lucide-react";
import { LucideBlueGradientIcon } from "@/features/home/home-card";

const MicGradientIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient
        id="micBlueGradient"
        x1="0"
        y1="1"
        x2="0"
        y2="0"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="rgba(0, 91, 127, 1)" />
        <stop offset="72%" stopColor="rgba(0, 187, 242, 1)" />
      </linearGradient>
    </defs>
    <RiMicAiLine
      fill="url(#micBlueGradient)"
      size={24}
      style={{ width: "100%", height: "100%" }}
    />
  </svg>
);

const sideBarItems = [
  {
    name: "PMS/EHR",
    icon: <PmsIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/pms/home",
  },
  {
    name: "Monitoring",
    icon: <MonitoringIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/apps",
    hide_menu_id: "menu-monitoring-hide",
  },
  {
    name: (
      <AgentFlowTextIcon
        width="auto"
        height="auto"
        className="h-[14px] 2xl:h-[18px]"
      />
    ),
    // name: "Agent Flow",
    icon: <DroidalStudioIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/aba",
    hide_menu_id: "menu-agentFlow-hide",
  },
  {
    name: (
      <Image
        src={VoiceAILogoImage}
        w="auto"
        className="h-[14px] 2xl:h-[20px] relative -left-1"
      />
    ),
    icon: (
      <img
        src="/mic_on_logo.jpg"
        alt="Mic Icon"
        className="rounded-full h-[22px] 2xl:h-[26px] 3xl:h-[30px]"
      />
    ),
    to: "/voice-ai/voice-ai-MTA=",
    hide_menu_id: "menu-voice-ai-hide",
  },
  {
    name: "ROI",
    icon: <DroidMetrixIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/roi",
    hide_menu_id: "menu-roi-hide",
  },

  {
    name: "Admin",
    icon: <AdminIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/admin",
    hide_menu_id: "menu-admin-hide",
  },
  {
    name: "Settings",
    icon: <SettingsIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/settings",
    hide_menu_id: "menu-settings-hide",
  },
  {
    name: "Help",
    icon: <HelpIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/help",
    hide_menu_id: "menu-help-hide",
  },
  {
    name: "Smart Drive",
    icon: <FileManagerIcon className="h-[18px] 2xl:h-[24px] 3xl:h-[30px]" />,
    to: "/smart-drive",
  },
];

const RenderTitle = ({ dashboardType, title, subTitle }) => {
  const location = useLocation();
  if (dashboardType === "Admin") return "Admin";
  if (dashboardType === "HELP") return "Help";
  if (dashboardType === "Settings") return "Settings";
  if (dashboardType === "ROI") return "RETURN ON INVESTMENT";
  if (dashboardType === "PMS") {
    if (location.pathname.includes("home")) {
      return "";
    }
    if (location.pathname.includes("billing")) {
      return "Billing";
    }
    if (location.pathname.includes("clinical")) {
      return "Clinical";
    }
    if (location.pathname.includes("engage")) {
      return "Engage";
    }
    if (location.pathname.includes("payments")) {
      return "Payments";
    }
    if (location.pathname.includes("analytics")) {
      return "Analytics";
    }
    if (location.pathname.includes("telehealth")) {
      return "Telehealth";
    }
    if (location.pathname.includes("platform-settings"))
      return "Patient Management System";
  }

  if (dashboardType === "VOICE_AI") {
    return null;
  }
  if (dashboardType === "ABA") {
    return (
      <span className="my-2 2xl:my-4 block">
        <AgentFlowTextIcon
          width="auto"
          className="h-[18px] 2xl:h-[24px] 3xl:h-[34px]"
        />
      </span>
    );
  }
  return (
    <HStack p>
      <span className="uppercase">{title}</span> :{" "}
      <span className="flex items-center gap-2">{subTitle}</span>
    </HStack>
  );
};

/**
 * AppLayout component
 *
 * This component serves as the main layout wrapper for the application.
 * It can optionally display a secondary sidebar and adjusts the layout
 * depending on the dashboard type.
 *
 * @param {Object} props - The component props
 * @param {boolean} [props.showSecondarySidebar=true] - Whether to show the secondary sidebar.
 * @param {boolean} [props.defaultSecondarySidebarShrinkOff=false] - Whether to shrink the secondary sidebar by default.
 * @param {"Agent"|"ROI"|"Admin"| "Settings"|"ABA"|"HOME"|"HELP"} [props.dashboardType="Agent"] - The type of dashboard to display.
 *        - "Agent": Displays the Agent dashboard layout.
 *        - "Roi": Displays the ROI dashboard layout.
 *        - "Admin": Displays the Admin dashboard layout.
 *        - "Settings": Displays the Settings dashboard layout.
 *        - "ABA": Displays the ABA dashboard layout.
 *        - "HELP": Displays the Help dashboard layout.
 *
 * @returns {JSX.Element} The rendered AppLayout component.
 */

const AppLayout = ({
  showSecondarySidebar = true,
  dashboardType = "Agent",
  showHeader = true,
  defaultSecondarySidebarShrinkOff = false,
  pms = false,
}) => {
  // agent app

  const { user } = useAuth();

  const { isShrink, setIsShrink } = useSidebarStore();

  useEffect(() => {
    if (pms) {
      setIsShrink(true);
    } else {
      setIsShrink(false);
    }
  }, []);

  const { department_id, agent_app } = useParams();
  dashboardType = agent_app ? "Agent" : dashboardType;
  const departmentId = [
    "ROI",
    "ABA",
    "Settings",
    "Admin",
    "HELP",
    "SmartDrive",
    "MinutesOfMeeting",
    "PMS",
  ].includes(dashboardType)
    ? null
    : department_id === "utilities"
      ? null
      : atobDepartmentId(department_id);
  const agentId = [
    "ROI",
    "HOME",
    "ABA",
    "Settings",
    "Admin",
    "HELP",
    "SmartDrive",
    "MinutesOfMeeting",
    "PMS",
    "VOICE_AI",
  ].includes(dashboardType)
    ? null
    : atobAgentId(agent_app);
  const location = useLocation();
  const pathname = location.pathname;

  let { data: departments = [], isLoading: isDepartmentLoading } =
    useGetDepartments();

  const { data: agents = [] } = useGetAgents({ module_id: departmentId });

  const dashboardNavigation = useMemo(() => {
    const isVoiceAi = departmentId === "10";
    console.log("isVoiceAi1212", departmentId, isVoiceAi);
    return getSideBarItems(
      dashboardType === "Agent" ? departmentId : dashboardType,
      isVoiceAi,
      pathname,
    );
  }, [departmentId, dashboardType, pathname]);

  const [showSecondarySidebarShrink, setShowSecondarySidebarShrink] = useState(
    defaultSecondarySidebarShrinkOff,
  );

  function handleCloseSidebar() {
    setShowSecondarySidebarShrink(!showSecondarySidebarShrink);
  }

  const currentApp = agents.find((app) => app.id === Number(agentId));

  const currentDepartment = departments.find((department) => {
    return department.id === Number(departmentId);
  });

  useLayoutEffect(() => {
    // shrink on for agent dashboard
    if (agent_app) {
      setShowSecondarySidebarShrink(!!agent_app);
    }
  }, [agent_app]);

  const extraShrink = isShrink ? -180 : 0;

  // In the embedded PMS/EHR we drop the primary module rail entirely (only one
  // module), so the PMS "DEPARTMENTS" menu sits flush left and the content only
  // needs to clear that single menu.
  const contentMarginLeft = pms
    ? showSecondarySidebarShrink
      ? { base: "60px", "2xl": "65px", "3xl": "70px" }
      : { base: "220px", "2xl": "250px", "3xl": "270px" }
    : {
        base:
          (!showSecondarySidebar
            ? 180
            : showSecondarySidebarShrink
              ? 230
              : 400) +
          extraShrink +
          "px",
        "2xl":
          (!showSecondarySidebar
            ? 220
            : showSecondarySidebarShrink
              ? 280
              : 470) +
          extraShrink +
          "px",
        "3xl":
          (!showSecondarySidebar
            ? 260
            : showSecondarySidebarShrink
              ? 310
              : 520) +
          extraShrink +
          "px",
      };

  return (
    <Box
      css={{
        bg: "linear-gradient(180deg, #0a1f3c 0%, #0d2b52 100%)",
      }}
      className="bg-gray-50 h-full"
    >
      <div className="h-full">
        {/* Primary Sidebar — hidden in the embedded PMS/EHR (single module),
            so only the PMS "DEPARTMENTS" menu is shown. */}

        {!pms && (
          <AppSideBar
            sideBarItems={sideBarItems.filter((i) => i.name === "PMS/EHR")}
            suffix={
              dashboardType === "ABA" ? "" : `/${department_id}/${agent_app}/`
            }
          />
        )}
        {/* secondary Sidebar */}

        {showSecondarySidebar && (
          <SecondarySidebar
            showSecondarySidebarShrink={showSecondarySidebarShrink}
            handleCloseSidebar={handleCloseSidebar}
            loading={isDepartmentLoading}
            departments={departments}
            pms={pms}
          />
        )}

        <Box
          id="layout-main-content"
          className="flex-1 h-screen transition-all duration-500"
          css={{
            backgroundImage: `url(${HomeBg})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom left -200px",
            backgroundRepeat: "no-repeat",
            marginLeft: contentMarginLeft,

            display: "flex",
            flexDirection: "column",
          }}
        >
          {dashboardType === "HOME" && department_id != "utilities" && (
            <Box
              px={{ base: 6, "2xl": 6 }}
              py={4}
              className="top-4 right-4 z-50 flex items-center justify-between w-full gap-4"
            >
              <Text
                color="#fff"
                fontSize={{ base: "lg", "2xl": "xl", "3xl": "2xl" }}
              >
                {currentDepartment?.module_name}: Agents
              </Text>

              <div className="flex items-center justify-end gap-4">
                <Text color="#fff" fontSize={{ base: "md", "3xl": "lg" }}>
                  Filter agents
                </Text>

                <AgentComboBox />

                <div className="flex items-center gap-4">
                  <UserMenu />
                  <BellIcon color="#fff" size={24} />
                </div>
              </div>
            </Box>
          )}
          {showHeader && (
            <>
              {dashboardType !== "HOME" &&
                dashboardType !== "HELP" &&
                dashboardType !== "SmartDrive" &&
                dashboardType !== "MinutesOfMeeting" && (
                  <Box
                    px={{ base: 6, "2xl": 6 }}
                    className="top-4 p-4 right-4 z-50 flex items-center justify-between w-full pl-8 gap-4"
                  >
                    <VStack
                      justify={"space-between"}
                      gap="2"
                      align={"flex-start"}
                    >
                      {console.log("dashboardType1212", dashboardType)}
                      <Text
                        color="#fff"
                        fontSize={{
                          base: "lg",
                          "2xl": "22px",
                          "3xl": "2xl",
                        }}
                        letterSpacing={"widest"}
                      >
                        <RenderTitle
                          dashboardType={dashboardType}
                          title={currentDepartment?.module_name}
                          subTitle={currentApp?.app_name}
                        />
                      </Text>
                      {dashboardType !== "HOME" && (
                        <CustomBreadcrumb
                          sidebarItems={dashboardNavigation}
                          dashboardType={dashboardType}
                          suffix={
                            dashboardType === "ABA"
                              ? ""
                              : `/apps/${department_id}/${agent_app}`
                          }
                          agentId={agentId}
                        />
                      )}
                    </VStack>

                    <div className="flex items-center justify-end gap-4">
                      <div className="flex items-center gap-4">
                        <Text
                          textTransform={"capitalize"}
                          color={"white"}
                          letterSpacing={"widest"}
                        >
                          Hi, {user?.first_name}
                        </Text>
                        <UserMenu />
                        <BellIcon color="#fff" size={24} />
                      </div>
                    </div>
                  </Box>
                )}
            </>
          )}

          <Box
            as="main"
            flex={1}
            px={{ base: 6, "2xl": 6 }}
            py={"0"}
            overflowY={"auto"}
            overflowX={"hidden"}
          >
            <Outlet />
          </Box>
        </Box>
      </div>
    </Box>
  );
};

export default AppLayout;
