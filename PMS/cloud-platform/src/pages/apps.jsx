import {
  ChevronLeft,
  ChevronRight,
  Settings2,
  SettingsIcon,
} from "lucide-react";
import Logo from "../assets/logo/logo4.svg";
import BgLogo from "../assets/img/bg.webp";
import AppCard from "@/features/apps/AppCard";
import { agentApps, agentCategories } from "@/_data/apps.js";
import { BsGearFill } from "react-icons/bs";
import { FaClipboardCheck, FaRss } from "react-icons/fa";
import { HiCollection } from "react-icons/hi";
import { MdHome } from "react-icons/md";
import { Box, Flex, Icon, Image, Input, LinkOverlay } from "@chakra-ui/react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import BlueBgImage from "../assets/img/bg-card.svg?react";
import { Text } from "@chakra-ui/react";
import {
  RiAddLine,
  RiAdminLine,
  RiAppsLine,
  RiBarChart2Fill,
  RiCalendarLine,
  RiEyeLine,
  RiFileTextLine,
  RiFolderLine,
  RiHeartPulseLine,
  RiLogoutBoxLine,
  RiMessageLine,
  RiMic2AiFill,
  RiMoneyDollarCircleLine,
  RiServiceLine,
  RiSettings2Line,
  RiUserAddLine,
  RiVoiceRecognitionLine,
} from "react-icons/ri";
import DroidalLogo from "../assets/logo/droidal-logo-white.svg";
import BlueLogo from "../assets/logo/logo4.svg";
import { FeatureCard } from "@/features/home/home-card";
import UserMenu from "@/components/user-popover/user-popover";
import { BellIcon } from "lucide-react";
import { BotIcon } from "lucide-react";

const Apps = () => {
  const { app_name } = useParams();

  const apps = agentApps[app_name] || agentCategories[0].agents.slice(0, 8);

  console.log("apps1212", apps);

  return (
    <div className="bg-gray-50 min-h-screen relative">
      <div className="flex min-h-screen">
        <Box
          pos={"fixed"}
          zIndex={"sticky"}
          top={"0"}
          left={"0"}
          h={"full"}
          className="w-64 bg-secondary-700 text-white flex flex-col"
        >
          <Link to={"/"}>
            <div className="p-6 border-b border-secondary-600">
              <img
                src={DroidalLogo}
                alt="MedXFlow Logo"
                className="h-8 w-72 scale-90"
              />
            </div>
          </Link>
          <nav className="flex-1 py-6">
            <ul className="space-y-2 px-4">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-50 bg-secondary-400 hover:bg-secondary-300  hover:text-white transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <img src={BlueLogo} alt="MedXFlow AI" className="" />
                  </div>
                  <span>MedXFlow AI</span>
                </a>
              </li>
              <li>
                <Link
                  to="/aba"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:bg-secondary-600 hover:text-white transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <BotIcon />
                  </div>
                  <span>Droid Studio</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/droid-metrix"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:bg-secondary-600 hover:text-white transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <RiBarChart2Fill />
                  </div>
                  <span>DroidMetrix</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:bg-secondary-600 hover:text-white transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <RiAdminLine />
                  </div>
                  <span>Admin</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary-300 hover:bg-secondary-600 hover:text-white transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <RiSettings2Line />
                  </div>
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
        </Box>

        <div className="flex-1 ml-[260px]">
          <div className="top-4 p-4 right-4 z-50 flex items-center justify-between gap-4">
            <Input
              variant={"outline"}
              size="xl"
              maxW="2/5"
              placeholder="Search..."
            />
            <div className="flex items-center gap-4">
              <BellIcon className="text-gray-400" />
              <UserMenu />
            </div>
          </div>
          <div className="p-8 mt-0">
            {apps.length === 0 && (
              <Text className="text-center text-gray-500">
                No apps available for this category.
              </Text>
            )}
            <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-12">
              {apps.map((app) => (
                <AppCard key={app.id} agent={app} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apps;
const NavItem = (props) => {
  const location = useLocation();
  const { icon, children, to, ...rest } = props;
  const active = location.pathname === to;
  // || location.pathname.startsWith(to);

  console.log("active1212", active);

  return (
    <Flex
      as={NavLink}
      to={to}
      align="center"
      px="4"
      pl="4"
      py="3"
      cursor="pointer"
      _dark={{ color: "gray.400" }}
      _hover={{
        bg: "gray.400",
        _dark: { bg: "gray.900" },
        color: "gray.900",
      }}
      color={active ? "gray.900" : "gray.400"}
      bg={active ? "gray.300" : "transparent"}
      role="group"
      fontWeight="semibold"
      transition=".15s ease"
      {...rest}
    >
      {icon && (
        <Icon
          mx="2"
          boxSize="4"
          // _groupHover={{
          //   color: color,
          // }}
          as={icon}
        />
      )}
      {children}
    </Flex>
  );
};
const SidebarContent = (props) => (
  <Box
    as="nav"
    pos="fixed"
    zIndex="sticky"
    top="0"
    left="0"
    h="full"
    pb="10"
    overflowX="hidden"
    overflowY="auto"
    bg="#0d2b52"
    // _dark={{ bg: "gray.800" }}
    border
    color="gray.100"
    borderRightWidth="1px"
    w="60"
    {...props}
    display={"flex"}
    justifyContent={"center"}
    flexDirection="column"
  >
    <Flex px="4" py="5" align="center">
      {/* <Logo /> */}
      <Image
        src={Logo}
        w="200px"
        h="70px"
        alt="logo"
        objectFit={"contain"}
      />{" "}
    </Flex>
    <Flex
      direction="column"
      as="nav"
      fontSize="sm"
      color="gray.600"
      aria-label="Main Navigation"
    >
      <NavItem to="/aba" active="true" icon={MdHome}>
        Home
      </NavItem>
      <NavItem to="/aba/hub" icon={FaRss}>
        Hub
      </NavItem>
      <NavItem to="/aba/dashboard" icon={HiCollection}>
        Dashboard
      </NavItem>
    </Flex>
  </Box>
);
