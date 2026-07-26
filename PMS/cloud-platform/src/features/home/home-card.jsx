import { Box, HStack, Skeleton, VStack } from "@chakra-ui/react";
import { ChevronDownIcon } from "lucide-react";
import { Link } from "react-router-dom";
import EyeIcon from "@/assets/icons/eye.svg?react";
import { CirclePower } from "lucide-react";
import { Text } from "@chakra-ui/react";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { useState } from "react";
import OnlineEye from "../../assets/gif/online.gif";
import OfflineEyeIcon from "../../assets/icons/offline-eye.svg?react";
import AgentForm from "../apps/models/new-agent";
import { btoaAgentId } from "@/utils/helper";
import { format } from "date-fns";
import ReadyIcon from "../../assets/gif/offline.gif";
import AgentProgressBar from "./agent-progress-bar";

export function LucideGradientIcon({
  IconComponent,
  size = "44",
  stroke = "gradientStroke",
}) {
  return (
    <svg
      id="home-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <defs xmlns="http://www.w3.org/2000/svg">
        <linearGradient
          id="gradientStroke"
          x1="24.9165"
          y1="0"
          x2="24.9165"
          y2="41.9587"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#5A9310" />
          <stop offset="1" stop-color="#94F219" />
        </linearGradient>
        <linearGradient
          id="blueGradient"
          x1="12.5931"
          y1="22.0699"
          x2="12.5931"
          y2="2.14031"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#5FCCF5" />
          <stop offset="0.29" stop-color="#00BBF2" />
          <stop offset="1" stop-color="#005B7F" />
        </linearGradient>
      </defs>

      <IconComponent stroke={`url(#${stroke})`} fill="none" strokeWidth={1.5} />
    </svg>
  );
}

export function LucideBlueGradientIcon({ IconComponent, size = "44" }) {
  return (
    <svg
      id="home-icon-blue"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <defs xmlns="http://www.w3.org/2000/svg">
        <linearGradient
          id="gradientStrokeBlue"
          x1="24.9165"
          y1="0"
          x2="24.9165"
          y2="41.9587"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="rgba(0, 91, 127, 1)" />
          <stop offset="1" stopColor="rgba(0, 187, 242, 1)" />
        </linearGradient>
      </defs>

      <IconComponent
        stroke="url(#gradientStrokeBlue)"
        fill="none"
        strokeWidth={1.5}
      />
    </svg>
  );
}

export const FeatureCard = ({ icon, title, id, appName, to }) => {
  const IconComponent = icon;
  return (
    <Link
      to={to}
      // onClick={() => {
      //   onClick(id);
      // }}
      className="relative"
    >
      <Box
        height={{
          base: "150px",
          "2xl": "160px",
          "3xl": "180px",
        }}
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "inherit",
          padding: "1.5px",
          background: "linear-gradient(90deg, transparent, transparent)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "xor",
          transition: "background 0.3s ease",
          ...(appName === id && {
            background: "linear-gradient(180deg, #5A9310, #94F219)",
          }),
        }}
        _hover={{
          _before: {
            background: "linear-gradient(180deg, #5A9310, #94F219)",
          },
        }}
        className="bg-[#292929] rounded-2xl p-4 py-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
      >
        <div className="relative flex gap-2">
          {/* <IconComponent size={36} className="text-white" /> */}
          <LucideGradientIcon IconComponent={IconComponent} />
          <Text
            as={"h3"}
            fontSize={{
              base: "md",
              "2xl": "18px",
              "3xl": "20px",
            }}
            className=" font-semibold text-white mb-2"
          >
            {title}
          </Text>
          {/* <p className="text-gray-600 text-sm">{description}</p> */}
        </div>
        <Box className="absolute left-4 flex gap-3 items-center bottom-4">
          {/* <EyeIcon width={40} height={40} className="scale-200" /> */}
          <img
            src={OfflineEyeIcon}
            width={40}
            height={40}
            className="scale-200"
          />
          <CirclePower color="#94F219" />
          <Text letterSpacing={"widest"} color="#94F219">
            LIVE
          </Text>
        </Box>
      </Box>
    </Link>
  );
};

const renderText = {
  running: "LIVE",
  ready: "READY",
  pending: "OFFLINE",
};

const AppCard = ({
  name,
  id,
  appName,
  url,
  taskStatus = {},
  total = 0,
  success = 0,
  failure = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const successPercentage = ((success || 0) / (total || 0)) * 100;
  const failedPercentage = ((failure || 0) / (total || 0)) * 100;

  const formatted = format(taskStatus.last_updated, "MMM dd yyyy");

  return (
    <Box
      asChild
      className={
        "relative transition-all px-[2px] pt-[2px] duration-500 ease-in-out rounded-md 2xl:rounded-[16px]" +
        (isExpanded ? " bg-[#343434]" : "")
      }
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: "inherit",
        padding: "1.5px",
        background: "linear-gradient(90deg, transparent, transparent)",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "xor",
        transition: "background 0.3s ease",
        ...(isExpanded && {
          background: "linear-gradient(180deg, #5A9310, #94F219)",
        }),
      }}
      _hover={
        isExpanded
          ? {
              _before: {
                background: "linear-gradient(180deg, #5A9310, #94F219)",
              },
            }
          : {}
      }
    >
      <Link to={url}>
        <Box
          height={{
            base: "140px",
            "2xl": "160px",
            "3xl": "180px",
          }}
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "inherit",
            padding: "1.5px",
            background: "linear-gradient(90deg, transparent, transparent)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            transition: "background 0.3s ease",
            ...(appName === id && {
              background: "linear-gradient(180deg, #5A9310, #94F219)",
            }),
          }}
          _hover={
            isExpanded
              ? {}
              : {
                  _before: {
                    background: "linear-gradient(180deg, #5A9310, #94F219)",
                  },
                }
          }
          className="bg-[#292929] rounded-2xl p-4 py-4 2xl:py-6 shadow-sm hover:shadow-md cursor-pointer group relative overflow-hidden transition-all duration-500 ease-in-out"
        >
          <div className="relative flex">
            <Text
              as={"h3"}
              fontSize={{
                base: "sm",
                "2xl": "17px",
                "3xl": "20px",
              }}
              letterSpacing={"widest"}
              className={` font-semibold ${
                taskStatus.status === "running"
                  ? "text-white"
                  : "text-[#575757]"
              } mb-2`}
            >
              {name}
            </Text>
            {/* <p className="text-gray-600 text-sm">{description}</p> */}
          </div>
          <HStack className="absolute w-full left-4 flex gap-3 items-center bottom-5">
            <VStack gap={2} className="absolute bottom-[-25px] right-4">
              <div className="relative top-2">
                {!!total && (
                  <AgentProgressBar
                    success={successPercentage}
                    failure={failedPercentage}
                  />
                )}
              </div>

              <button
                position={"relative"}
                zIndex={1}
                size={"sm"}
                color="#6A6A6A"
                _hover={{ bg: "droidalBlack.200 !important" }}
                aria-label="Expand"
                variant={"ghost"}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsExpanded(!isExpanded);
                }}
                className="pb-4 pt-0 !cursor-pointer px-2"
              >
                <ChevronDownIcon color="#6A6A6A" size="24" />
              </button>
            </VStack>

            <HStack>
              {taskStatus.status === "running" && (
                <img
                  src={OnlineEye}
                  className="rounded-full"
                  bg="transparent"
                  width={40}
                  height={40}
                />
              )}

              {taskStatus.status === "ready" && (
                <Box
                  asChild
                  width={{
                    base: "30px",
                    "2xl": "35px",
                    "3xl": "40px",
                  }}
                  height={{
                    base: "30px",
                    "2xl": "35px",
                    "3xl": "40px",
                  }}
                >
                  <img
                    src={ReadyIcon}
                    className="rounded-full"
                    bg="transparent"
                    width={"inherit"}
                    height={"inherit"}
                  />
                </Box>
              )}
              {taskStatus.status === "pending" && (
                <Box
                  asChild
                  width={{
                    base: "30px",
                    "2xl": "35px",
                    "3xl": "40px",
                  }}
                  height={{
                    base: "30px",
                    "2xl": "35px",
                    "3xl": "40px",
                  }}
                >
                  <OfflineEyeIcon />
                </Box>
              )}
              <Text
                letterSpacing={"widest"}
                fontSize={{
                  base: "sm",
                  "2xl": "md",
                }}
                color={taskStatus.status === "running" ? "#94F219" : "#575757"}
              >
                {renderText[taskStatus?.status]}
              </Text>
            </HStack>
            <Text
              ml="auto"
              as="span"
              position={"absolute"}
              right={{
                base: "50px",
                "2xl": "60px",
                "3xl": "70px",
              }}
              fontSize={{
                base: "30px",
                "2xl": "35px",
                "3xl": "40px",
              }}
              color="#6A6A6A"
            >
              {total || 0}
            </Text>
          </HStack>
        </Box>
        <div
          className={`
            transition-all duration-500 ease-in-out overflow-hidden
            ${isExpanded ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          {isExpanded && (
            <div className="space-y-3 py-4 border-t  px-[16px] border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex text-md items-center gap-2">
                    <Text
                      as={"span"}
                      fontSize={{
                        base: "13px",
                        "2xl": "15px",
                        "3xl": "17px",
                      }}
                      className="text-[#94F219]"
                    >
                      {success || 0}
                    </Text>
                    <Text
                      fontSize={{
                        base: "13px",
                        "2xl": "15px",
                        "3xl": "17px",
                      }}
                      as={"span"}
                      className=" text-white"
                    >
                      Successful
                    </Text>
                  </div>
                  <div className="flex  items-center gap-2">
                    <Text
                      as={"span"}
                      fontSize={{
                        base: "13px",
                        "2xl": "15px",
                        "3xl": "17px",
                      }}
                      className="text-[#D73C2C]"
                    >
                      {failure || 0}
                    </Text>
                    <Text
                      fontSize={{
                        base: "13px",
                        "2xl": "15px",
                        "3xl": "17px",
                      }}
                      as={"span"}
                      className=" text-white"
                    >
                      Exceptions
                    </Text>
                  </div>
                </div>
              </div>
              <div className="flex text-[15px] items-center justify-between text-[#838383]">
                <Text
                  as={"span"}
                  fontSize={{
                    base: "13px",
                    "2xl": "15px",
                    "3xl": "17px",
                  }}
                >
                  Last run:{" "}
                  {taskStatus?.last_updated ? formatted : "Not Started"}
                </Text>
                {/* <span className="font-medium">Monthly</span> */}
              </div>
            </div>
          )}
        </div>
      </Link>
    </Box>
  );
};

const AppCardSkeleton = () => {
  return (
    <Skeleton
      color={"gray"}
      className="dark"
      rounded="2xl"
      variant="shine"
      height={{
        base: "140px",
        "2xl": "160px",
        "3xl": "180px",
      }}
    />
  );
};

const FeatureGrid = ({
  agents = [],
  departmentId,
  appName,
  loading = false,
  customUrl = "",
  customButtonName = "",
}) => {
  const isLessThan3 = !loading && agents.length < 3;

  return (
    <Box
      className={`grid gap-4 pb-6 place-content-center ${
        isLessThan3 && "place-content-start"
      }`}
      gap={{ base: 4, "2xl": 6, "3xl": 6 }}
      gridTemplateColumns={{
        base: "repeat(auto-fit, 210px)",
        "2xl": "repeat(auto-fit, 260px)",
        "3xl": "repeat(auto-fit, 296px)",
      }}
    >
      {loading && (
        <>
          {[...Array(5)].map((_, idx) => (
            <AppCardSkeleton key={idx} />
          ))}
        </>
      )}
      {!loading && (
        <>
          {agents.map((app, idx) => {
            const url = customUrl
              ? `${btoaAgentId(app.id)}/${customUrl}`
              : `${btoaAgentId(app.id)}`;
            return (
              <AppCard
                name={app.app_name}
                id={app.id}
                key={idx}
                url={url}
                taskStatus={
                  app.task_status || {
                    status: "pending",
                    counts: {},
                    total: 0,
                    last_updated: null,
                  }
                }
                appName={appName}
                total={app.task_status?.total || 0}
                success={app.task_status?.counts?.["SUCCESS"] || 0}
                failure={app.task_status?.counts?.["FAILURE"] || 0}
              />
            );
          })}
        </>
      )}

      <AgentForm
        customButtonName={customButtonName}
        existingAgentNames={agents.map((agent) => agent?.app_name)}
      />
    </Box>
  );
};

export default FeatureGrid;

// Output | Action

// audio, transcript, files | chat

// context-page

// system -instruc - role, context, Question
