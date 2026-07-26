import { useGetPodsQuery } from "@/hooks/query/projects/useGetPodsQuery";
import { useGetTasksByProjectId } from "@/hooks/query/task/useTasks";
import {
  Box,
  Card,
  CardHeader,
  Center,
  Heading,
  HStack,
  Input,
  InputGroup,
  Menu,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { parseAsString, useQueryState } from "nuqs";
import CustomButton from "@/components/button/button";
import { FiMoreHorizontal } from "react-icons/fi";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/modules/treemap.js";
import "highcharts/modules/treegraph.js";
import "highcharts/modules/accessibility.js";
import { formatDistanceToNow } from "date-fns";
import TaskEmptyStateIcon from "@/assets/icons/task-empty-state.svg?react";
import { LuSearch } from "react-icons/lu";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import PodsModal from "@/features/ABA/modal/pods-modal";
import UnauthorizedPage from "../unauthorized";

const PodsMoreIcon = ({ onOpenModal }) => (
  <Menu.Root>
    <Menu.Trigger
      onClick={(e) => {
        e.stopPropagation();
      }}
      rounded="full"
      cursor={"pointer"}
      focusRing="outside"
    >
      <FiMoreHorizontal />
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content color={"#fff"} bgColor={"droidalBlack.200"}>
          <Menu.Item
            _hover={{ bgColor: "droidalBlack.100" }}
            cursor={"pointer"}
            value="edit"
            color={"#fff"}
            onClick={() => {
              onOpenModal();
            }}
          >
            Edit
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu.Root>
);

const ABAHome = () => {
  const { data: pods, isLoading, isPlaceholderData } = useGetPodsQuery();
  const [search, setSearch] = useQueryState("search", parseAsString);
  const deferredSearch = useDeferredValue(search);
  const [openState, setOpenState] = useState({
    show: false,
    initialValues: {},
    mode: "add",
  });
  const highchartRef = useRef();
  const { hasPermission } = usePermissions();
  console.log("search112", search, deferredSearch);
  const [selectedPod, setSelectedPod] = useQueryState(
    "pod",
    parseAsString.withDefault("")
  );

  console.log("pods1212", pods);
  const navigate = useNavigate();
  const handleCreateProject = () => {
    if (!hasPermission("create_edit_pods", "create")) return;
    navigate("/aba/create-project");
  };

  const { data: fetchedTasks, isLoading: tasksLoading } =
    useGetTasksByProjectId(selectedPod);

  const podFiltered = useMemo(() => {
    return deferredSearch
      ? pods.filter((pod) => pod.project_name.includes(deferredSearch))
      : pods;
  }, [deferredSearch, pods]);

  const selectedPodData = pods.find((pod) => pod.id === Number(selectedPod));

  if (!hasPermission("droidstudio_dashboard_view", "view")) {
    return <UnauthorizedPage />;
  }

  return (
    <Box>
      <div className="flex-1  py-4 pt-2 overflow-y-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3"></div>
        <HStack gap={4}>
          <Card.Root
            height={"82vh"}
            bg={"droidalBlack.300"}
            pb="4"
            w="380px"
            border="none"
            flexShrink={0}
            overflowY={"auto"}
          >
            <Card.Header
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              flexDirection={"row"}
              w={"full"}
            >
              <CustomButton onClick={handleCreateProject}>
                Create Pods
              </CustomButton>
              <Box w="150px">
                <InputGroup flex="1" startElement={<LuSearch />}>
                  <Input
                    color="white"
                    letterSpacing="widest"
                    borderColor={"#2f4d78"}
                    transition={"all .2s ease-in-out"}
                    _hover={{
                      outlineColor: "transparent",
                      border: "1px solid transparent",
                      bgClip: "padding-box, border-box",
                      backgroundOrigin: "padding-box, border-box",
                      backgroundImage:
                        "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
                    }}
                    _placeholder={{
                      color: "#2f4d78",
                      letterSpacing: "widest",
                    }}
                    size={"xs"}
                    placeholder="Search..."
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    value={search}
                  />
                </InputGroup>
              </Box>
            </Card.Header>
            <Card.Body>
              {isLoading || isPlaceholderData ? (
                <Center h="full">
                  <Spinner />
                </Center>
              ) : (
                <>
                  {podFiltered.length > 0 ? (
                    <VStack
                      justify={"flex-start"}
                      align={"flex-start"}
                      gap={"4"}
                    >
                      {podFiltered.map((pod) => (
                        <div
                          onClick={() => {
                            setSelectedPod(pod.id);
                          }}
                          className="w-full p-4 rounded-lg cursor-pointer transition-all duration-200 bg-transparent hover:bg-gray-750 border border-[#2f4d78] hover:border-gray-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium tracking-widest capitalize text-white">
                              {pod?.project_name}
                            </span>
                            <div className="cursor-pointer flex items-center justify-center text-gray-400 hover:text-white">
                              <PodsMoreIcon
                                onOpenModal={() => {
                                  if (
                                    !hasPermission("create_edit_pods", "edit")
                                  ) {
                                    return;
                                  }
                                  setOpenState({
                                    show: true,
                                    initialValues: pod,
                                    mode: "edit",
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {"Updated " +
                              formatDistanceToNow(new Date(pod?.updated_at), {
                                addSuffix: true,
                              })}
                          </p>
                        </div>
                      ))}
                    </VStack>
                  ) : (
                    <Center h="full">
                      <Text color="white">No pods found</Text>
                    </Center>
                  )}
                </>
              )}
            </Card.Body>
          </Card.Root>
          <Card.Root
            height={"82vh"}
            bg={"droidalBlack.300"}
            pb="4"
            w="full"
            border="none"
            css={{
              background: "rgba(62, 56, 56, 0.2)",
              borderRadius: "16px",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(5px)",
            }}
          >
            <Card.Body
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
              overflowY={"auto"}
            >
              {tasksLoading && (
                <Center h="full">
                  <Spinner />
                </Center>
              )}
              {!tasksLoading && (
                <Box
                  w={{
                    base: "400px",
                    "2xl": "500px",
                    "3xl": "700px",
                  }}
                  // h={{
                  //   base: "500px",
                  //   "2xl": "600px",
                  //   "3xl": "800px",
                  // }}
                  mx={"auto"}
                  display={"flex"}
                  justifyContent={"center"}
                  alignItems={"center"}
                >
                  {selectedPod && (
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={{
                        chart: {
                          backgroundColor: "transparent",
                          zoomType: "xy", // Enable zoom and pan
                          // height: 600,
                        },
                        title: {
                          text: selectedPodData?.project_name,
                          color: "#fff",
                          fill: "#fff",
                          style: {
                            fontSize: "24px",
                            fontWeight: "bold",
                            textTransform: "capitalize",
                            color: "#fff",
                          },
                        },
                        plotOptions: {
                          series: {
                            point: {
                              events: {
                                click: function () {
                                  if (this.name === "+ Add New") {
                                    navigate(
                                      `/aba/pods/${selectedPodData.id}/create-task`
                                    );
                                  } else {
                                    ///aba/${task.project}/task/${task.id}
                                    navigate(
                                      `/aba/${selectedPodData.id}/task/${this.id}`
                                    );
                                  }
                                },
                              },
                            },
                          },
                        },
                        series: [
                          {
                            type: "treegraph",
                            data: [
                              {
                                id: "0.0",
                                parent: "",
                                name: selectedPodData?.project_name,
                                color: "#fff",
                              },
                              ...fetchedTasks,
                              {
                                id: "1.10000",
                                parent: "0.0",
                                name: "+ Add New",
                                color: "#1a5dad",
                                fill: "#fff",
                              },
                            ],
                            tooltip: {
                              pointFormat: "{point.name}",
                            },
                            marker: {
                              symbol: "rect",
                              width: "20%",
                              height: "30px",
                            },
                            borderRadius: 10,
                            dataLabels: {
                              pointFormat: "{point.name}",
                              style: {
                                whiteSpace: "nowrap",
                                fontSize: "12px", // Adjust font size to handle a large number of nodes
                              },
                            },
                            levels: [
                              {
                                level: 1,
                                levelIsConstant: false,
                                layoutAlgorithm: "polar", // Use a different layout for better space distribution
                              },
                              {
                                level: 2,
                                colorByPoint: true,
                                layoutAlgorithm: "default",
                              },
                              {
                                level: 3,
                                colorVariation: {
                                  key: "brightness",
                                  to: -0.5,
                                },
                              },
                              {
                                level: 4,
                                colorVariation: {
                                  key: "brightness",
                                  to: 0.5,
                                },
                              },
                            ],
                          },
                        ],
                      }}
                      key={selectedPodData?.id}
                    />
                  )}
                  {!selectedPod && (
                    <Center
                      flexDir={"column"}
                      justifyContent={"center"}
                      alignItems={"center"}
                      h={"100%"}
                      w={"100%"}
                      color="#90a6c6"
                    >
                      <TaskEmptyStateIcon />
                      <Heading>No pod selected</Heading>
                      <Text>Select a pod to get started</Text>
                    </Center>
                  )}
                </Box>
              )}
            </Card.Body>

            {/* <HighchartsReact highcharts={Highcharts} options={options} />; */}
          </Card.Root>
        </HStack>
      </div>
      <PodsModal
        open={openState.show}
        onClose={() => {
          setOpenState({ show: false, initialValues: {}, mode: "add" });
        }}
        mode={openState.mode}
        initialValues={openState.initialValues}
      />
    </Box>
  );
};

export default ABAHome;
