import CustomNavLink from "@/components/navLink/navlink";
import {
  Avatar,
  Box,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import NewLogo from "@/assets/logo/logo4.svg?react";
import DroidalAILogo from "@/assets/logo/DroidalAI-logo.svg?react";
import { useAuth } from "@/store/providers/auth-provider";
import CustomButton from "@/components/button/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSidebarStore from "@/components/globalvar/isshrink";
import { useMemo } from "react";

const AppSideBar = ({ sideBarItems = [], suffix = "" }) => {
  const { user = {} } = useAuth();
  const { isShrink, setIsShrink } = useSidebarStore();
  const handleCloseSidebar = () => setIsShrink(!isShrink);

  const filterSideBarItems = useMemo(() => {
    const modulePermissions = user?.permission || [];
    console.log("modulePermissions1212", modulePermissions, user);
    return sideBarItems.filter((i) => {
      const find = modulePermissions.find(
        (item) => item.module === i.hide_menu_id,
      );
      return find ? false : true;
    });
  }, [sideBarItems, user]);
  return (
    <Box
      pos="fixed"
      zIndex="sticky"
      top="0"
      left="0"
      h="full"
      w={{
        base: isShrink ? "80px" : "190px",
        "2xl": isShrink ? "90px" : "230px",
        "3xl": isShrink ? "100px" : "260px",
      }}
      className="bg-droidal-black-400 text-white flex flex-col"
      transition="300ms ease"
    >
      {/* HEADER */}
      <div className="p-6 flex items-center justify-between">
        {/* Logo */}
        <Box
          asChild
          h={{
            base: "25px",
            "2xl": "28px",
            "3xl": "35px",
          }}
          textAlign="left"
          style={{ transition: "opacity 0.2s" }}
        >
          <Link to="/">
            {isShrink ? (
              <NewLogo height="100%" width="30px" />
            ) : (
              <DroidalAILogo height="100%" width="auto" />
            )}
          </Link>
        </Box>

        {/* Chevron on the RIGHT in expanded mode */}
        {!isShrink && (
          <IconButton variant="plain" onClick={handleCloseSidebar} p={0}>
            <ChevronLeft color="white" size={24} />
          </IconButton>
        )}
      </div>

      {/* Chevron CENTERED in collapsed mode */}
      {isShrink && (
        <div className="flex justify-center pr-4">
          <IconButton variant="plain" onClick={handleCloseSidebar} p={0}>
            <ChevronRight color="white" size={24} />
          </IconButton>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="flex-1 py-6">
        <ul className="flex flex-col gap-y-2">
          {filterSideBarItems.map((item, index) => {
            const isFunction = typeof item.to === "function";
            return (
              <li key={index}>
                <CustomNavLink
                  to={isFunction ? item.to(suffix) : item.to}
                  icon={item.icon}
                >
                  {!isShrink && item.name}
                </CustomNavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* FOOTER USER INFO */}
      <HStack
        gap={{ base: 2, "2xl": 3, "3xl": 4 }}
        className="px-6 2xl:px-7 py-4"
      >
        <Avatar.Root size={{ base: "2xs", "2xl": "sm" }}>
          <Avatar.Image src={user.logo?.replace("http://", "https://") + "/"} />
          <Avatar.Fallback name={user.first_name} />
        </Avatar.Root>

        {!isShrink && (
          <VStack
            gap={{ base: 0.5, "2xl": 1 }}
            align="flex-start"
            className="text-left"
          >
            <Text
              color="#fff"
              letterSpacing="wider"
              fontSize={{ base: "12px", "2xl": "15px", "3xl": "17px" }}
              className="capitalize"
            >
              {user.first_name} {user.last_name}
            </Text>

            <Text
              color="#818181"
              fontSize={{ base: "12px", "2xl": "15px", "3xl": "17px" }}
            >
              {user.license_tier === "free trail"
                ? "Free Trial"
                : user.license_tier}
            </Text>
          </VStack>
        )}
      </HStack>

      {/* LICENSE BUTTON */}
      {user.license_tier === "free trail" && !isShrink && (
        <div className="pb-4 px-8">
          <CustomButton
            variant="outline"
            size={{ base: "2xs", "2xl": "xs", "3xl": "sm" }}
            letterSpacing="widest"
            borderRadius={{ base: "4px", "2xl": "6px", "3xl": "8px" }}
          >
            <Text fontSize={{ base: "10px", "2xl": "12px", "3xl": "15px" }}>
              Request a License
            </Text>
          </CustomButton>
        </div>
      )}
    </Box>
  );
};

export default AppSideBar;
