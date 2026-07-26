import {
  RiFlashlightLine,
  RiFolder2Fill,
  RiListCheck2,
  RiSettings2Fill,
} from "react-icons/ri";
import { MdOutlineComputer, MdOutlineTask } from "react-icons/md";
import {
  Download,
  FilesIcon,
  LaptopMinimalIcon,
  ListTodoIcon,
  Rows3Icon,
  Sparkles,
  ZapIcon,
} from "lucide-react";
import {
  Box,
  Center,
  Text,
  HStack,
  VStack,
  Button,
  Image,
} from "@chakra-ui/react";
import DroidStudioImg from "@/assets/img/DroidStudio-download.jpg";

export default function DashboardStats({ metrics = {} }) {
  const stats = [
    {
      title: "Pods",
      value: metrics?.projects_count || 0,
      icon: (
        <Sparkles className="h-[30px] w-[30px] 2xl:h-[38px] 2xl:w-[38px] 3xl:w-[50px] 3xl:h-[50px] text-[#808080]" />
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Tasks",
      value: metrics?.tasks_count || 0,
      icon: (
        <FilesIcon className="h-[30px] w-[30px] 2xl:h-[38px] 2xl:w-[38px] 3xl:w-[50px] 3xl:h-[50px] text-[#808080]" />
      ),
      color: "text-green-600",
      bgColor: "bg-green-50",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "TRIGGERS",
      value: metrics?.triggers_count || 0,
      icon: (
        <ZapIcon className="h-[30px] w-[30px] 2xl:h-[38px] 2xl:w-[38px] 3xl:w-[50px] 3xl:h-[50px] text-[#808080]" />
      ),
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      gradient: "from-cyan-500 to-cyan-600",
    },
    {
      title: "MACHINES",
      value: metrics?.machines_count || 0,
      icon: (
        <LaptopMinimalIcon className="h-[30px] w-[30px] 2xl:h-[38px] 2xl:w-[38px] 3xl:w-[50px] 3xl:h-[50px] text-[#808080]" />
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      gradient: "from-purple-500 to-purple-600",
    },
    // {
    //   title: "TASKS",
    //   value: metrics?.tasks_count || 0,
    //   icon: <ListTodoIcon size={50} className="text-2xl text-[#808080]" />,
    //   color: "text-indigo-600",
    //   bgColor: "bg-indigo-50",
    //   gradient: "from-indigo-500 to-indigo-600",
    // },
  ];
  console.log("metrics1212444", metrics);

  const downloadInstaller = () => {
    let link = document.createElement("a");
    link.href = `https://dev-cloud.droidal.com/media/forms/Agent-Flow.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDownloadInstaller = () => {
    let link = document.createElement("a");
    // const protocol = window.location.protocol;
    link.href = `https://dev-cloud.droidal.com/media/forms/AgentFlowInstaller.exe`;

    link.download = "Agent_Flow_installer.zip"; // Set the filename you want
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateInstaller = () => {
    var extensionId = "jdehhckfjldgkgmbeealligfdfoljkhk";
    // Send a message to the extension
    window.postMessage(
      {
        action: "messageToExtension",
        data: {
          type: "Updateinstaller2.0",
          url: "pip install --index-url https://test.pypi.org/simple/ droid-activities==3.90",
          domain: "dev-cloud.droidal.com",
        },
      },
      "*",
    );
  };

  return (
    <HStack justify={"space-between"}>
      <div className="flex my-6 gap-[20px]">
        {stats.map((stat) => {
          return (
            <Box
              key={stat.title}
              w={{
                base: "110px",
                "2xl": "125px",
                "3xl": "138px",
              }}
              className="group w-[138px] rounded-[20px] bg-droidal-black-300 p-4 2xl:p-5 3xl:p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden relative"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icon}
                  </div>
                </div>

                <div className="space-y-2">
                  <Text
                    style={{
                      backgroundImage: "var(--bg-blue-gradient) !important",
                    }}
                    lineHeight={"64px"}
                    mt="3.5"
                    mb="2"
                    className="text-5xl font-extralight text-transparent bg-clip-text group-hover:text-gray-800 transition-colors"
                  >
                    {stat.value}
                  </Text>
                  <Text
                    letterSpacing={"widest"}
                    className="text-sm font-medium text-white"
                  >
                    {stat.title}
                  </Text>
                </div>
              </div>
            </Box>
          );
        })}
      </div>
      <HStack>
        <VStack
          w={{
            base: "110px",
            "2xl": "125px",
            "3xl": "138px",
          }}
        >
          <Box
            bgImage={"var(--bg-blue-gradient)"}
            w="full"
            px={5}
            borderRadius={"20px"}
            py="8px"
            display={"flex"}
            gap="5"
            justifyContent={"space-between"}
            alignItems={"flex-start"}
            className="hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={handleUpdateInstaller}
          >
            <VStack spacing={2} alignItems={"flex-start"}>
              <Download size={24} color="#000" />

              <Text fontSize={"sm"} fontWeight={"bold"} color={"#000"}>
                Update Installer
              </Text>
            </VStack>
          </Box>
          <Box
            bgImage={"var(--bg-blue-gradient)"}
            w="full"
            px={5}
            borderRadius={"20px"}
            py="8px"
            display={"flex"}
            gap="5"
            justifyContent={"space-between"}
            alignItems={"flex-start"}
            className="hover:scale-105 transition-all duration-300 cursor-pointer"
            onClick={handleDownloadInstaller}
          >
            <VStack spacing={2} alignItems={"flex-start"}>
              <Download size={24} color="#000" />
              <Text fontSize={"sm"} fontWeight={"bold"} color={"#000"}>
                Download Installer
              </Text>
            </VStack>
          </Box>
        </VStack>
        <Box
          bgImage={"var(--bg-blue-gradient)"}
          w="full"
          px={5}
          borderRadius={"20px"}
          py="21px"
          display={"flex"}
          gap="5"
          justifyContent={"space-between"}
          alignItems={"flex-start"}
          maxW={{
            base: "330px",
            "2xl": "340px",
            "3xl": "450px",
          }}
          onClick={() => downloadInstaller()}
          className="hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <VStack spacing={2} alignItems={"flex-start"}>
            <Center
              px="2"
              w="58px"
              h="58px"
              bg="transparent"
              borderRadius="full"
              borderColor={"#000"}
              borderWidth={3}
              borderStyle={"solid"}
            >
              <Download size={28} color="#000" />
            </Center>
            <Text fontSize={"lg"} fontWeight={"bold"} color={"#000"} mb={2}>
              Download AgentFlow application
            </Text>
          </VStack>
          <Image
            src={DroidStudioImg}
            w={{
              base: "150px",
              "2xl": "150px",
              "3xl": "220px",
            }}
            className="object-contain"
          />
        </Box>
      </HStack>
    </HStack>
  );
}
