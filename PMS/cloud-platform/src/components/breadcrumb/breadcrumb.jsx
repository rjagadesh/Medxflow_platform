import { NavLink, useLocation } from "react-router-dom";
import { Text, Breadcrumb } from "@chakra-ui/react";
import { Menu } from "@chakra-ui/react/menu";
import { Portal } from "@chakra-ui/react/portal";
import { useMemo } from "react";
import getSideBarItems from "@/utils/side-bar";

const CustomBreadcrumb = ({
  suffix = "",
  agentId,
  dashboardType,
  sidebarItems,
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  // const sidebarItems = useMemo(() => {
  //   const isInsuranceApp = agentId === "8";
  //   return getSideBarItems(
  //     dashboardType === "Agent" ? agentId : dashboardType,
  //     isInsuranceApp,
  //     pathname,
  //   );
  // }, [agentId, dashboardType, pathname]);

  const renderLabel = (label) => (
    <Text
      letterSpacing="widest"
      fontSize={{ base: "sm", "2xl": "md", "3xl": "lg" }}
      className="text-inherit hover:text-white"
    >
      {label}
    </Text>
  );

  return (
    <>
      {sidebarItems.length > 0 && (
        <Breadcrumb.Root>
          <Breadcrumb.List gap={0}>
            {sidebarItems.map((value, index) => {
              const hasDropdown =
                Boolean(value.is_drop_down) &&
                Array.isArray(value.drop_down) &&
                value.drop_down.length > 0;

              const isFunction = typeof value.to === "function";
              const to = isFunction ? value.to(suffix) : value.to;
              const isEndProps = value.end ? true : false;

              const isLast = index === sidebarItems.length - 1;

              return (
                <Breadcrumb.Item key={index}>
                  <>
                    {/* NORMAL LINK */}
                    {!hasDropdown && (
                      <NavLink
                        to={to}
                        className={({ isActive }) =>
                          isActive
                            ? "!text-droid-primary-400 hover:text-droid-primary-400"
                            : "!bg-red"
                        }
                        end={isEndProps}
                      >
                        {renderLabel(value.name)}
                      </NavLink>
                    )}

                    {/* DROPDOWN (Chakra v3 Menu) */}
                    {hasDropdown && (
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          {renderLabel(value.name)}
                        </Menu.Trigger>

                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content bg="black">
                              {value.drop_down.map((item, idx) => {
                                const itemTo =
                                  typeof item.to === "function"
                                    ? item.to(suffix)
                                    : item.to;

                                return (
                                  <Menu.Item
                                    key={idx}
                                    value={itemTo}
                                    onSelect={() =>
                                      (window.location.href = itemTo)
                                    }
                                    bg="black"
                                    color="white"
                                    _hover={{ bg: "white", color: "black" }}
                                  >
                                    {item.name}
                                  </Menu.Item>
                                );
                              })}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    )}

                    {/* SEPARATOR */}
                    {!isLast && (
                      <Breadcrumb.Separator px={3} fontSize="md">
                        |
                      </Breadcrumb.Separator>
                    )}
                  </>
                </Breadcrumb.Item>
              );
            })}
          </Breadcrumb.List>
        </Breadcrumb.Root>
      )}
    </>
  );
};

export default CustomBreadcrumb;
