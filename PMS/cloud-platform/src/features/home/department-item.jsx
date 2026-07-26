import { useGetDepartmentsStatus } from "@/hooks/query/useGetDepartmentStatus";
import { btoaDepartmentId } from "@/utils/helper";
import { Box, Center, Skeleton, Text } from "@chakra-ui/react";
import { CirclePowerIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

const DepartmentItem = ({
  showSecondarySidebarShrink,
  app,
  agentCount,
  icon,
}) => {
  const { data, isLoading } = useGetDepartmentsStatus(app.id);
  const Icon = icon;
  const isLive = data?.[0]?.is_have_record;
  const pathName = btoaDepartmentId(app.id, app.module_name);
  const url = "/apps/" + pathName;
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? "department-nav  flex flex-col gap-y-1 px-[15px] py-2 bg-[#24406a]"
          : "flex flex-col gap-y-1 px-[15px] py-2"
      }
      to={url}
      end
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
              base: "20px",
              "2xl": "25px",
            }}
            height={{
              base: "20px",
              "2xl": "25px",
            }}
          >
            <Icon
              className="w-full h-full"
              color={isLive ? "#94F219" : "#818181"}
            />
          </Center>
          {showSecondarySidebarShrink && (
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
          )}
        </Box>
        {!showSecondarySidebarShrink && (
          <Text
            className="department-text"
            letterSpacing={"widest"}
            fontSize={{
              base: "12px",
              "2xl": "15px",
              "3xl": "17px",
            }}
            color={showSecondarySidebarShrink ? "#fff" : "#818181"}
          >
            {app.module_name}
          </Text>
        )}
        {!showSecondarySidebarShrink && (
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
        )}
      </Box>
      <Box
        className={
          showSecondarySidebarShrink
            ? "flex justify-center"
            : "flex gap-3 pl-[1px] items-center"
        }
      >
        {isLive ? (
          <Center
            width={{
              base: "20px",
              "2xl": "25px",
            }}
            height={{
              base: "20px",
              "2xl": "25px",
            }}
          >
            <CirclePowerIcon color="#94F219" />
          </Center>
        ) : (
          <Center
            width={{
              base: "22px",
              "2xl": "25px",
            }}
            height={{
              base: "22px",
              "2xl": "25px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 7V11"
                stroke="#818181"
                stroke-opacity="0.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7.99801 9.00299C7.44133 9.74618 7.10262 10.6297 7.0198 11.5546C6.93699 12.4794 7.11336 13.4091 7.52914 14.2393C7.94493 15.0696 8.5837 15.7677 9.37388 16.2554C10.1641 16.7431 11.0744 17.0011 12.003 17.0005C12.9316 16.9999 13.8416 16.7408 14.6312 16.2521C15.4208 15.7634 16.0587 15.0645 16.4734 14.2338C16.8882 13.403 17.0634 12.4731 16.9794 11.5483C16.8954 10.6236 16.5556 9.74049 15.998 8.99799"
                stroke="#818181"
                stroke-opacity="0.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#818181"
                stroke-width="2"
                stroke-linecap="round"
                stroke-dasharray="4 4"
              />
            </svg>
          </Center>
        )}
        {!showSecondarySidebarShrink && (
          <Box>
            {isLoading ? (
              <Skeleton className="dark" height={"15px"} width={"50px"} />
            ) : (
              <Text
                fontSize={{ base: "12px", "2xl": "15px", "3xl": "17px" }}
                letterSpacing={"widest"}
                color={isLive ? "#94F219" : "#818181"}
              >
                {data?.[0]?.is_have_record ? "LIVE" : "OFFLINE"}
              </Text>
            )}
          </Box>
        )}
      </Box>
    </NavLink>
  );
};

export default DepartmentItem;
