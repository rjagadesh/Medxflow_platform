import { Link, Outlet, useNavigate } from "react-router-dom";

import {
  Avatar,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Image,
  Input,
  useDisclosure,
} from "@chakra-ui/react";

import { FaBell, FaClipboardCheck, FaRss } from "react-icons/fa";
import { AiFillGift } from "react-icons/ai";
import { BsGearFill } from "react-icons/bs";
import { FiDownload, FiMenu, FiSearch } from "react-icons/fi";
import { HiCode, HiCollection } from "react-icons/hi";
import { MdHome, MdKeyboardArrowRight, MdSpaceDashboard } from "react-icons/md";
import React from "react";
import Logo from "../../assets/logo/droidal-logo-white.svg";
// import "./layout.css";
import { ChevronRight } from "lucide-react";
import { useLocation, NavLink } from "react-router-dom";
import "../../styles/aba.css";
import DroidalLogo from "@/assets/logo/droidal-logo-white.svg";
import BlueLogo from "@/assets/logo/logo4.svg";
import {
  RiAppsLine,
  RiHeartPulseLine,
  RiHomeLine,
  RiLogoutBoxLine,
} from "react-icons/ri";
import CustomNavLink from "@/components/navLink/navlink";
import UserMenu from "@/components/user-popover/user-popover";

export const Test = () => {
  return (
    <>
      Test <Outlet />
    </>
  );
};

const DroidStudioDownloader = () => {
  const location = useLocation();
  const isAbaRoute = location.pathname.includes("/aba");
  const downloadInstaller = () => {
    let link = document.createElement("a");
    const protocol = window.location.protocol;
    link.href = `${protocol}//${window.location.host}/media/aba/Droidal-ABA.zip`;

    link.download = "Droid_Studio_installer.zip"; // Set the filename you want
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <>
      {isAbaRoute && (
        <Button
          onClick={() => downloadInstaller()}
          leftIcon={<FiDownload />}
          borderColor={"secondary.400"}
          // _hover={{
          //   bg: "secondary.500",
          // }}
          variant={"outline"}
        >
          <FiDownload />
          Droid Studio
        </Button>
      )}
    </>
  );
};

const sideBarItems = [
  {
    name: "Workspace",
    icon: <MdSpaceDashboard />,
    to: "/aba",
  },
  {
    name: "Hub",
    icon: <RiHeartPulseLine />,
    to: "/aba/hub",
  },
];

export default function ABALayout() {
  const SidebarContent = (props) => (
    <Box
      pos={"fixed"}
      zIndex={"sticky"}
      top={"0"}
      left={"0"}
      h={"full"}
      className="w-64 bg-droidal-black-400 text-white flex flex-col"
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
          {sideBarItems.map((item, index) => (
            <li key={index}>
              <CustomNavLink to={item.to} icon={item.icon}>
                {item.name}
              </CustomNavLink>
            </li>
          ))}
        </ul>
      </nav>
    </Box>
  );
  return (
    <Box as="section" bg="gray.50" _dark={{ bg: "gray.700" }} minH="100vh">
      <SidebarContent display={{ base: "none", md: "unset" }} />
      {/* <Drawer
        isOpen={sidebar.isOpen}
        onClose={sidebar.onClose}
        placement="left"
      >
        <DrawerOverlay />
        <DrawerContent>
          <SidebarContent w="full" borderRight="none" />
        </DrawerContent>
      </Drawer> */}
      <Box ml={{ base: 0, md: 64 }} transition=".3s ease">
        <Flex
          as="header"
          align="center"
          justify="space-between"
          w="full"
          px="4"
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
          color="inherit"
          h="14"
        >
          <Input width={"400px"} placeholder="Search your projects..." />

          {/* <IconButton
            aria-label="Menu"
            display={{ base: "inline-flex", md: "none" }}
            onClick={sidebar.onOpen}
            icon={<FiMenu />}
            size="sm"
          /> */}

          <Flex align="center" width={"full"} justify={"flex-end"} gap={"4"}>
            <DroidStudioDownloader />
            <Icon color="gray.500" as={FaBell} cursor="pointer" />
            <UserMenu />
          </Flex>
        </Flex>

        <Box as="main" p="4" overflowY={"auto"}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
