import { CircleDashed } from "lucide-react";
import { CircleXIcon } from "lucide-react";
import { CircleCheck } from "lucide-react";
import { MailQuestionMarkIcon } from "lucide-react";
import RequestForm from "../insurance-verification/modal/request";
import { useGetStatusCount } from "@/hooks/query/agentsapp/useGetStatusCount";
import { Box } from "@chakra-ui/react/box";
import { Button } from "@chakra-ui/react/button";
import { Text } from "@chakra-ui/react/text";
import { VStack } from "@chakra-ui/react/stack";
import { Center } from "@chakra-ui/react";
import { convertNumberToShortHand } from "@/utils/helper";

import { Tooltip as ChakraTooltip, Portal } from "@chakra-ui/react";
import { forwardRef } from "react";

const Tooltip = forwardRef(function Tooltip(props, ref) {
  const {
    showArrow,
    children,
    disabled,
    portalled = true,
    content,
    contentProps,
    portalRef,
    ...rest
  } = props;

  if (disabled) return children;

  return (
    <ChakraTooltip.Root {...rest}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content ref={ref} {...contentProps}>
            {showArrow && (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            )}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
});

export default function PatientStatsCards({
  api_key,
  onChangeStatus = () => {},
  selectedAppData = {},
}) {
  const { data: status = {} } = useGetStatusCount(api_key);

  const stats = [
    {
      title: "Requests",
      value: convertNumberToShortHand(status["all"] || 0),
      originalValue: status["all"] || 0,
      icon: <MailQuestionMarkIcon size={50} className="text-[#808080]" />,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      style: { backgroundImage: "var(--bg-blue-gradient) !important" },
      status: null,
    },
    {
      title: "Success",
      value: convertNumberToShortHand(status["SUCCESS"] || 0),
      originalValue: status["SUCCESS"] || 0,
      icon: <CircleCheck size={50} className="text-[#808080]" />,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      style: { backgroundImage: "var(--bg-green-gradient) !important" },
      status: "SUCCESS",
    },
    {
      title: "Pending",
      value: convertNumberToShortHand(status["PENDING"] || 0),
      originalValue: status["PENDING"] || 0,
      icon: <CircleDashed size={50} className="text-[#808080]" />,
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
      style: { backgroundImage: "var(--bg-pending-gradient) !important" },
      status: "PENDING",
    },
    {
      title: "Failed",
      value: convertNumberToShortHand(status["FAILURE"] || 0),
      originalValue: status["FAILURE"] || 0,
      icon: <CircleXIcon size={50} className="text-[#808080]" />,
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      style: { backgroundImage: "var(--bg-red-gradient) !important" },
      status: "FAILURE",
    },
  ];

  return (
    <Box
      gap={{
        base: 4,
        "2xl": 6,
      }}
      className="grid grid-cols-1 md:grid-cols-5"
    >
      {stats.map((stat, index) => (
        <Tooltip content={stat.originalValue}>
          <Box
            key={index}
            h={{
              base: "120px",
              "2xl": "150px",
              "3xl": "150px",
            }}
            className="bg-droidal-black-300  rounded-3xl shadow-md px-5 py-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex justify-between h-full">
              <VStack justify={"space-between"} align={"start"}>
                <Text
                  fontSize={{
                    base: "sm",
                    "2xl": "xl",
                  }}
                  className="text-white font-medium mb-2"
                  letterSpacing={"widest"}
                >
                  {stat.title}
                </Text>
                <Text
                  as={"h3"}
                  fontSize={{
                    base: "4xl",
                    "2xl": "5xl",
                    "3xl": "7xl",
                  }}
                  fontWeight={"100"}
                  style={stat.style}
                  lineHeight={{
                    base: "36px",
                    "2xl": "48px",
                    "3xl": "64px",
                  }}
                  mt={{
                    base: 0,
                    "3xl": "3.5",
                  }}
                  mb={{
                    base: 0,
                    "3xl": "2",
                  }}
                  className="text-transparent bg-clip-text transition-colors"
                >
                  {stat.value}
                </Text>
              </VStack>
              <VStack justify={"space-between"} align={"end"} h="full">
                <Center
                  w={{
                    base: "35px",
                    "2xl": "40px",
                    "3xl": "50px",
                  }}
                  h={{
                    base: "35px",
                    "2xl": "40px",
                    "3xl": "50px",
                  }}
                >
                  {stat.icon}
                </Center>
                <Button
                  rounded="10px"
                  bgImage={
                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)"
                  }
                  border={"none"}
                  _hover={{
                    bgImage:
                      "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                  }}
                  size={{
                    base: "2xs",
                    "2xl": "xs",
                  }}
                  onClick={() => onChangeStatus(stat.status)}
                >
                  <Text
                    fontSize={{
                      base: "13px",
                      "2xl": "15px",
                    }}
                    fontWeight={"semibold"}
                    letterSpacing={"2px"}
                    as={"span"}
                  >
                    SHOW
                  </Text>
                </Button>
              </VStack>
            </div>
          </Box>
        </Tooltip>
      ))}
      <RequestForm inputs={selectedAppData.columns || []} />
    </Box>
  );
}

// Highcharts.chart('container', {
//     colors: ['#FFD700'],
//     chart: {
//         type: 'column',
//         inverted: true,
//         polar: true
//     },
//     title: {
//         text: 'Winter Olympic medals per existing country (TOP 5)'
//     },
//     subtitle: {
//         text: 'Source: ' +
//             '<a href="https://en.wikipedia.org/wiki/All-time_Olympic_Games_medal_table"' +
//             'target="_blank">Wikipedia</a>'
//     },
//     tooltip: {
//         outside: true
//     },
//     pane: {
//         size: '85%',
//         innerSize: '40%',
//         endAngle: 270
//     },
//     xAxis: {
//         tickInterval: 1,
//         labels: {
//             align: 'right',
//             allowOverlap: true,
//             step: 1,
//             y: 3,
//             style: {
//                 fontSize: '13px'
//             }
//         },
//         lineWidth: 0,
//         gridLineWidth: 1,
//         categories: [
//             'Norway <span class="f16"><span id="flag" class="flag no">' +
//             '</span></span>',
//             'United States <span class="f16"><span id="flag" class="flag us">' +
//             '</span></span>',
//             'Germany <span class="f16"><span id="flag" class="flag de">' +
//             '</span></span>',
//             'Austria <span class="f16"><span id="flag" class="flag at">' +
//             '</span></span>',
//             'Canada <span class="f16"><span id="flag" class="flag ca">' +
//             '</span></span>'
//         ]
//     },
//     yAxis: {
//         lineWidth: 0,
//         tickInterval: 25,
//         reversedStacks: false,
//         endOnTick: true,
//         showLastLabel: true,
//         gridLineWidth: 1
//     },
//     plotOptions: {
//         column: {
//             stacking: 'normal',
//             borderWidth: 0,
//             pointPadding: 0,
//             groupPadding: 0.15,
//             borderRadius: '0%'
//         }
//     },
//     series: [{
//         name: 'Gold medals',
//         data: [100, 100]
//     }, {
//         name: 'Silver medals',
//         data: [100, 100]
//     }, {
//         name: 'Bronze medals',
//         data: [100, 95]
//     }]
// });
