import { useGetDepartmentsStatus } from "@/hooks/query/useGetDepartmentStatus";
import { btoaDepartmentId } from "@/utils/helper";
import { Box, Center, Skeleton, Text } from "@chakra-ui/react";
import { CirclePowerIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { LucideGradientIcon } from "./home-card";

const EhrDepartmentItem = ({
  isShrink,
  showSecondarySidebarShrink,
  app,
  pathName,
  icon,
}) => {
  const Icon = icon;
  //   const isLive = data?.[0]?.is_have_record;
  //   const pathName = btoaDepartmentId(app.id, app.module_name);
  //  + pathName
  const url = "/pms" + pathName + "/" + app.url;
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? "department-nav  flex flex-col gap-y-1 px-[15px] py-2 bg-[#24406a]"
          : "flex flex-col gap-y-1 px-[15px] py-2"
      }
      to={url}
      end={false}
    >
      <Box
        className={
          showSecondarySidebarShrink
            ? "flex relative justify-center"
            : "flex relative gap-3 items-center"
        }
      >
        <Box className="relative">
          <Center
            width={{
              base: "30px",
              "2xl": "25px",
            }}
            height={{
              base: "30px",
              "2xl": "25px",
            }}
          >
            <LucideGradientIcon
              IconComponent={Icon}
              className="w-full h-full"
            />
          </Center>
          {/* {showSecondarySidebarShrink && (
            <Center
              className="department-badge absolute"
              hidden
              bg="#FF3B3B"
              right={"-2px"}
              top={"-2px"}
              width={3}
              height={3}
              borderRadius={"full"}
              zIndex={1}
            >
              <Text fontSize={"8px"} color="#fff">
                {agentCount}
              </Text>
            </Center>
          )} */}
        </Box>
        {!showSecondarySidebarShrink && (
          <Text
            className="department-text"
            letterSpacing="widest"
            fontSize={{
              base: "12px",
              "2xl": "15px",
              "3xl": "17px",
            }}
            color={showSecondarySidebarShrink ? "#fff" : "#818181"}
            // <-- This is the correct event
          >
            {app.name}
          </Text>
        )}
        {/* {!showSecondarySidebarShrink && (
          <>
            <Center
              hidden
              className="department-badge absolute"
              bg="#FF3B3B"
              right={0}
              top={2}
              width={5}
              height={5}
              borderRadius={"full"}
              zIndex={1}
            >
              <Text fontSize={"sm"} color="#fff">
                {agentCount}
              </Text>
            </Center>
          </>
        )} */}
      </Box>
      <Box
        className={
          showSecondarySidebarShrink
            ? "flex justify-center"
            : "flex gap-3 pl-[1px] items-center"
        }
      >
        {/* {!showSecondarySidebarShrink && (
          <Box>
            {
              <Text
                fontSize={{ base: "12px", "2xl": "15px", "3xl": "17px" }}
                letterSpacing={"widest"}
                // color={isLive ? "#94F219" : "#818181"}
              >
                {data?.[0]?.is_have_record ? "LIVE" : "OFFLINE"}
              </Text>
            }
          </Box>
        )} */}
      </Box>
    </NavLink>
  );
};

export default EhrDepartmentItem;
