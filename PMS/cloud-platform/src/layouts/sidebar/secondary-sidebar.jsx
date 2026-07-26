import { departmentIcons, ehrIcons } from "@/_data/apps";
import DepartmentItem from "@/features/home/department-item";
import EhrDepartmentItem from "@/features/home/EHR";
import {
  Box,
  HStack,
  IconButton,
  Skeleton,
  SkeletonCircle,
  Text,
  VStack,
} from "@chakra-ui/react";
import { memo, useMemo, useState } from "react";
import { RiAddLine, RiAdminLine } from "react-icons/ri";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NewDepartment from "@/features/departments/models/new-department";
import Utilities from "@/features/departments/models/utilities";
import CustomSelect from "@/components/ui/select";
import { LucideGradientIcon } from "@/features/home/home-card";
import useSidebarStore from "@/components/globalvar/isshrink";
import frameworks from "@/components/globalvar/secondarypath";
import { useAuth } from "@/store/providers/auth-provider";
// import { isShrink } from "./sidebar";

const DepartmentItemSkeleton = () => {
  return (
    <HStack gap="4" className="flex flex-col gap-y-1 px-[15px] py-2">
      <VStack gap="3">
        <SkeletonCircle size="6" />
        <SkeletonCircle size="6" />
      </VStack>
      <VStack gap="3" justify={"flex-start"} align={"flex-start"}>
        <Skeleton height="5" width="150px" />
        <Skeleton height="5" width="100px" />
      </VStack>
    </HStack>
  );
};

const SecondarySideBar = ({
  showSecondarySidebarShrink,
  departments,
  handleCloseSidebar,
  loading,
  pms,
  sidebar,
  setSidebar,
}) => {
  const { isShrink, setIsShrink } = useSidebarStore();
  const [selectValue, setSelectValue] = useState("Dental / DSO Practice");
  const { user } = useAuth();

  // console.log(sidebar);
  const selectedItem = frameworks.items.find(
    (item) => item.value === selectValue,
  );

  return pms ? (
    <>
      <Box
        transition="300ms ease"
        pos={"fixed"}
        zIndex={"modal"}
        top={"0"}
        // Primary module rail is hidden in the embedded PMS/EHR, so this menu
        // sits flush against the left edge.
        left={"0"}
        h={"full"}
        overflow={"auto"}
        w={
          showSecondarySidebarShrink
            ? {
                base: "50px",
                "2xl": "55px",
                "3xl": "60px",
              }
            : {
                base: "210px",
                "2xl": "240px",
                "3xl": "260px",
              }
        }
        className="bg-[#16375e] relative text-white flex flex-col border-r border-gray-600"
      >
        <ScrollArea.Root type="scroll" className="w-full h-full">
          <ScrollArea.Viewport className="w-full h-full pt-6">
            {!showSecondarySidebarShrink && (
              <CustomSelect
                options={frameworks.items.map((framework) => ({
                  label: framework.label,
                  value: framework.value,
                }))}
                placeholder="Select Alert Type"
                width="full"
                css={{
                  borderColor: "#2f4d78",
                }}
                borderColor="#2f4d78"
                value={[selectValue]}
                onValueChange={(v) => setSelectValue(v[0])}
              />
            )}
            <HStack
              justify={showSecondarySidebarShrink ? "center" : "space-between"}
              align={"center"}
              pl={
                showSecondarySidebarShrink
                  ? 0
                  : {
                      base: "20px",
                      "2xl": "20px",
                      "3xl": "25px",
                    }
              }
              pr={
                showSecondarySidebarShrink
                  ? 0
                  : {
                      base: "15px",
                      "2xl": "20px",
                      "3xl": "25px",
                    }
              }
              pb={
                showSecondarySidebarShrink
                  ? 0
                  : {
                      base: "15px",
                      "2xl": "20px",
                      "3xl": "25px",
                    }
              }
            >
              {!showSecondarySidebarShrink && (
                <Text
                  letterSpacing={"widest"}
                  className="text-md 2xl:text-lg 3xl:text-xl font-normal"
                >
                  DEPARTMENTS
                </Text>
              )}

              <IconButton variant={"plain"} onClick={handleCloseSidebar} p={0}>
                {showSecondarySidebarShrink ? (
                  <ChevronRight color="white" size={24} />
                ) : (
                  <ChevronLeft color="white" size={24} />
                )}
              </IconButton>
            </HStack>
            <div className="flex-1">
              {selectedItem.items.map((app, index) => {
                const Icon = ehrIcons[index] || RiAdminLine;
                return (
                  <EhrDepartmentItem
                    isShrink={isShrink}
                    showSecondarySidebarShrink={showSecondarySidebarShrink}
                    app={app}
                    pathName={selectedItem.url}
                    icon={Icon}
                    sidebar={sidebar}
                    setSidebar={setSidebar}
                    selectedItem={selectedItem}
                  />
                );
              })}

              {/* <Utilities
                showSecondarySidebarShrink={showSecondarySidebarShrink}
              /> */}
              {/* <NewDepartment
                showSecondarySidebarShrink={showSecondarySidebarShrink}
              /> */}
            </div>{" "}
          </ScrollArea.Viewport>

          <ScrollArea.Scrollbar
            orientation="vertical"
            className="flex select-none touch-none p-0.5 bg-black/20 w-2"
          >
            <ScrollArea.Thumb className="flex-1 bg-gray-500 rounded-full relative" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </Box>
    </>
  ) : (
    <Box
      transition="300ms ease"
      pos={"fixed"}
      zIndex={"modal"}
      top={"0"}
      left={{
        base: "190px",
        "2xl": "230px",
        "3xl": "260px",
      }}
      h={"full"}
      overflow={"auto"}
      w={
        showSecondarySidebarShrink
          ? {
              base: "50px",
              "2xl": "55px",
              "3xl": "60px",
            }
          : {
              base: "210px",
              "2xl": "240px",
              "3xl": "260px",
            }
      }
      className="bg-[#16375e] relative text-white flex flex-col border-r border-gray-600"
    >
      <ScrollArea.Root type="scroll" className="w-full h-full">
        <ScrollArea.Viewport className="w-full h-full pt-6">
          <HStack
            justify={showSecondarySidebarShrink ? "center" : "space-between"}
            align={"center"}
            pl={
              showSecondarySidebarShrink
                ? 0
                : {
                    base: "20px",
                    "2xl": "20px",
                    "3xl": "25px",
                  }
            }
            pr={
              showSecondarySidebarShrink
                ? 0
                : {
                    base: "15px",
                    "2xl": "20px",
                    "3xl": "25px",
                  }
            }
            pb={
              showSecondarySidebarShrink
                ? 0
                : {
                    base: "15px",
                    "2xl": "20px",
                    "3xl": "25px",
                  }
            }
          >
            {!showSecondarySidebarShrink && (
              <Text
                letterSpacing={"widest"}
                className="text-md 2xl:text-lg 3xl:text-xl font-normal"
              >
                DEPARTMENTS
              </Text>
            )}

            <IconButton variant={"plain"} onClick={handleCloseSidebar} p={0}>
              {showSecondarySidebarShrink ? (
                <ChevronRight color="white" size={24} />
              ) : (
                <ChevronLeft color="white" size={24} />
              )}
            </IconButton>
          </HStack>
          <div className="flex-1">
            {loading &&
              Array.from({ length: 8 }).map((_, index) => (
                <DepartmentItemSkeleton key={index} />
              ))}
            {console.log("departments9999", user?.client)}
            {!loading &&
              departments
                .filter(
                  (app) => app.module_name !== "Voice AI" || user?.client === 5,
                )
                .map((app, index) => {
                  const agentCount = app.agents_count || 0;
                  const Icon = departmentIcons[index] || RiAdminLine;
                  return (
                    <DepartmentItem
                      showSecondarySidebarShrink={showSecondarySidebarShrink}
                      app={app}
                      agentCount={agentCount}
                      icon={Icon}
                    />
                  );
                })}

            {/* <Utilities
              showSecondarySidebarShrink={showSecondarySidebarShrink}
            /> */}
            <NewDepartment
              showSecondarySidebarShrink={showSecondarySidebarShrink}
            />
          </div>{" "}
        </ScrollArea.Viewport>

        <ScrollArea.Scrollbar
          orientation="vertical"
          className="flex select-none touch-none p-0.5 bg-black/20 w-2"
        >
          <ScrollArea.Thumb className="flex-1 bg-gray-500 rounded-full relative" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </Box>
  );
};

export default memo(SecondarySideBar);
