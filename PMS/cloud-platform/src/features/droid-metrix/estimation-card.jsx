import { Box, Button, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "highcharts/highcharts-more.js";

function calculatecostbarchart(roiData) {
  let operationalmodel = roiData.operational_model;
  let manualCost = "";
  if (operationalmodel == "ONSITE AND OFFSHORE") {
    let onsite_headCount = parseInt(roiData.onsite_head_count);
    let onsite_hoursSpent = parseInt(roiData.onsite_hours_spent);
    let onsite_hourlyRate = parseInt(roiData.onsite_hourly_rate);
    let onsite_manualCost =
      onsite_headCount * onsite_hoursSpent * onsite_hourlyRate * 20 * 12;

    let offshore_headCount = parseInt(roiData.offshore_head_count);
    let offshore_hoursSpent = parseInt(roiData.offshore_hours_spent);
    let offshore_hourlyRate = parseInt(roiData.offshore_hourly_rate);
    let offshore_manualCost =
      offshore_headCount * offshore_hoursSpent * offshore_hourlyRate * 20 * 12;

    manualCost = parseInt(onsite_manualCost) + parseInt(offshore_manualCost);
  } else {
    let head_count = parseInt(roiData.head_count);
    let hours_spent = parseInt(roiData.hours_spent);
    let hourly_rate = parseInt(roiData.hourly_rate);

    manualCost = head_count * hours_spent * hourly_rate * 20 * 12;
  }
  let automationCost = manualCost * 0.4;
  let costSavings = manualCost - automationCost;

  return {
    manualCost: manualCost || 0,
    automationCost: automationCost || 0,
    saving: costSavings || 0,
  };
}

function calculateeffortbarchart(roiData) {
  let operationalmodel = roiData.operational_model;
  let manualEffort = "";

  if (operationalmodel == "ONSITE AND OFFSHORE") {
    let onsite_headCount = parseInt(roiData.onsite_head_count);
    let onsite_hoursSpent = parseInt(roiData.onsite_hours_spent);
    let onsite_manualEffort = onsite_headCount * onsite_hoursSpent * 20 * 12;

    let offshore_headCount = parseInt(roiData.offshore_head_count);
    let offshore_hoursSpent = parseInt(roiData.offshore_hours_spent);
    let offshore_manualEffort =
      offshore_headCount * offshore_hoursSpent * 20 * 12;

    manualEffort =
      parseInt(onsite_manualEffort) + parseInt(offshore_manualEffort);
  } else {
    let head_count = parseInt(roiData.head_count);
    let hours_spent = parseInt(roiData.hours_spent);

    manualEffort = head_count * hours_spent * 20 * 12;
  }
  let automationEffort = manualEffort * 0.5;
  let effortSavings = manualEffort - automationEffort;

  return {
    manualEffort: manualEffort || 0,
    automationValue: automationEffort || 0,
    saving: effortSavings || 0,
  };
}

const numberFormatter = (value) => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const EstimationChartCard = ({ processDetails = {} }) => {
  const costComparison = useMemo(
    () => calculatecostbarchart(processDetails),
    [processDetails]
  );
  const effortComparison = useMemo(
    () => calculateeffortbarchart(processDetails),
    [processDetails]
  );

  console.log("costComparison", costComparison, effortComparison);

  const options = {
    colors: ["#FFFFFF", "green"],
    chart: {
      type: "column",
      inverted: true,
      polar: true,
      backgroundColor: "transparent",
      borderColor: "#ffffff1a",
      events: {
        render: function () {
          const chart = this;

          // Create gradients once
          if (!chart._gradientsCreated) {
            const defs = chart.renderer.defs;

            // Manual gradient
            const manualGrad = chart.renderer
              .createElement("linearGradient")
              .attr({ id: "manual-gradient", x1: 0, y1: 0, x2: 1, y2: 0 })
              .add(defs);

            chart.renderer
              .createElement("stop")
              .attr({ offset: "0%", "stop-color": "#F3D020" })
              .add(manualGrad);
            chart.renderer
              .createElement("stop")
              .attr({ offset: "30%", "stop-color": "#F07A2E" })
              .add(manualGrad);
            chart.renderer
              .createElement("stop")
              .attr({ offset: "100%", "stop-color": "#D73C2C" })
              .add(manualGrad);

            // Automated gradient
            const autoGrad = chart.renderer
              .createElement("linearGradient")
              .attr({ id: "auto-gradient", x1: 0, y1: 0, x2: 1, y2: 0 })
              .add(defs);

            chart.renderer
              .createElement("stop")
              .attr({ offset: "0%", "stop-color": "#94F219" })
              .add(autoGrad);
            chart.renderer
              .createElement("stop")
              .attr({ offset: "100%", "stop-color": "#5A9310" })
              .add(autoGrad);

            chart._gradientsCreated = true;
          }

          // Clean up previous custom labels
          if (chart.customLabels) {
            chart.customLabels.forEach((lbl) => lbl.destroy());
          }
          chart.customLabels = [];

          // helper to find first non-null y value in a series
          function firstNonNullY(series) {
            if (!series) return 0;
            if (Array.isArray(series.yData)) {
              for (let v of series.yData)
                if (v !== null && v !== undefined) return v;
            }
            if (Array.isArray(series.data)) {
              for (let d of series.data) {
                if (d && d.y !== null && d.y !== undefined) return d.y;
              }
            }
            return 0;
          }

          const centerX = chart.plotLeft + chart.plotWidth / 2;
          const centerY = chart.plotTop + chart.plotHeight / 2;

          const manualVal = firstNonNullY(chart.series[0]) || 0;
          const autoVal = firstNonNullY(chart.series[1]) || 0;

          // Manual value (gradient fill)
          const manualLabel = chart.renderer
            .text("$" + numberFormatter(manualVal), centerX, centerY - 18)
            .css({
              fontSize: "20px",
              fontWeight: "700",
            })
            .add();
          manualLabel.attr({
            "text-anchor": "middle",
            fill: "url(#manual-gradient)",
          });

          // Automated value (gradient fill)
          const autoLabel = chart.renderer
            .text("$" + numberFormatter(autoVal), centerX, centerY + 22)
            .css({
              fontSize: "20px",
              fontWeight: "700",
            })
            .add();
          autoLabel.attr({
            "text-anchor": "middle",
            fill: "url(#auto-gradient)",
          });

          chart.customLabels.push(manualLabel, autoLabel);
        },
      },
    },

    exporting: {
      enabled: false,
    },
    title: {
      text: "",
      align: "left",
      margin: 30,
      style: {
        color: "#FFFFFF",
        fontSize: "21px",
        lineHeight: "25px",
        paddingBottom: "10px",
        borderBottom: "1px solid #ffffff",
        marginBottom: "20px",
      },
    },
    subtitle: {
      text: "",
      align: "left",
      style: {
        color: "#FFFFFF",
      },
    },
    tooltip: {
      outside: true,
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    pane: {
      size: "79%",
      innerSize: "0%",
      endAngle: 270,
    },
    colorAxis: {
      gridLineColor: "#ffffff1a",
      maxColor: "#ffffff1a",
      minColor: "#ffffff1a",
    },
    xAxis: {
      tickInterval: 1,
      gridLineColor: "#ffffff1a",
      labels: {
        align: "right",
        useHTML: true,
        allowOverlap: true,
        step: 1,
        y: 2,
        style: {
          color: "#fff",
          fontSize: "11px",
          whiteSpace: "nowrap",
        },
      },
      lineWidth: 0,
      categories: [
        "Manual" + '<span class="arrow"></span>',
        "Automated" + '<span class="arrow"></span>',
        null,
        null,
      ],
    },
    yAxis: {
      min: 0,
      max: 12e6,
      gridLineColor: "#ffffff1a",
      crosshair: {
        enabled: true,
        color: "#ffffff",
      },
      labels: {
        overflow: "justify",
        style: {
          color: "#fff",
          fontSize: "11px",
          whiteSpace: "nowrap",
        },
      },
      lineWidth: 0,
      tickInterval: 2e6,
      reversedStacks: false,
      endOnTick: true,
      showLastLabel: true,
    },
    plotOptions: {
      column: {
        stacking: "normal",
        borderWidth: 0,
        pointPadding: 0,
        groupPadding: 0.4,
      },
      series: {
        stickyTracking: true,
      },
    },
    series: [
      {
        name: "Manual",
        data: [costComparison.manualCost, null, null, null], // value only for Manual
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
          stops: [
            [0, "#F3D020"], // yellow
            [0.3, "#F07A2E"], // orange-red
            [1, "#D73C2C"],
          ],
        },
      },
      {
        name: "Automated",
        data: [null, costComparison.automationCost, null, null], // value only for Automated
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
          stops: [
            [0, "#94F219"], // light green
            [1, "#5A9310"], // dark green
          ],
        },
      },
      {
        name: "Fake Series",
        data: [24e6, 24e6, null, null],
        grouping: false,
        stacking: false,
        showInLegend: false,
        enableMouseTracking: false,
        zIndex: -1,
        color: "#000000",
      },
    ],
  };
  const optionsEffort = {
    colors: ["#FFFFFF", "green"],
    chart: {
      type: "column",
      inverted: true,
      polar: true,
      backgroundColor: "transparent",
      borderColor: "#ffffff1a",
      events: {
        render: function () {
          const chart = this;

          // Create gradients once
          if (!chart._gradientsCreated) {
            const defs = chart.renderer.defs;

            // Manual gradient
            const manualGrad = chart.renderer
              .createElement("linearGradient")
              .attr({ id: "manual-gradient", x1: 0, y1: 0, x2: 1, y2: 0 })
              .add(defs);

            chart.renderer
              .createElement("stop")
              .attr({ offset: "0%", "stop-color": "#F3D020" })
              .add(manualGrad);
            chart.renderer
              .createElement("stop")
              .attr({ offset: "30%", "stop-color": "#F07A2E" })
              .add(manualGrad);
            chart.renderer
              .createElement("stop")
              .attr({ offset: "100%", "stop-color": "#D73C2C" })
              .add(manualGrad);

            // Automated gradient
            const autoGrad = chart.renderer
              .createElement("linearGradient")
              .attr({ id: "auto-gradient", x1: 0, y1: 0, x2: 1, y2: 0 })
              .add(defs);

            chart.renderer
              .createElement("stop")
              .attr({ offset: "0%", "stop-color": "#94F219" })
              .add(autoGrad);
            chart.renderer
              .createElement("stop")
              .attr({ offset: "100%", "stop-color": "#5A9310" })
              .add(autoGrad);

            chart._gradientsCreated = true;
          }

          // Clean up previous custom labels
          if (chart.customLabels) {
            chart.customLabels.forEach((lbl) => lbl.destroy());
          }
          chart.customLabels = [];

          // helper to find first non-null y value in a series
          function firstNonNullY(series) {
            if (!series) return 0;
            if (Array.isArray(series.yData)) {
              for (let v of series.yData)
                if (v !== null && v !== undefined) return v;
            }
            if (Array.isArray(series.data)) {
              for (let d of series.data) {
                if (d && d.y !== null && d.y !== undefined) return d.y;
              }
            }
            return 0;
          }

          const centerX = chart.plotLeft + chart.plotWidth / 2;
          const centerY = chart.plotTop + chart.plotHeight / 2;

          const manualVal = firstNonNullY(chart.series[0]) || 0;
          const autoVal = firstNonNullY(chart.series[1]) || 0;

          // Manual value (gradient fill)
          const manualLabel = chart.renderer
            .text(manualVal + "hrs", centerX, centerY - 18)
            .css({
              fontSize: "20px",
              fontWeight: "700",
            })
            .add();
          manualLabel.attr({
            "text-anchor": "middle",
            fill: "url(#manual-gradient)",
          });

          // Automated value (gradient fill)
          const autoLabel = chart.renderer
            .text(autoVal + "hrs", centerX, centerY + 22)
            .css({
              fontSize: "20px",
              fontWeight: "700",
            })
            .add();
          autoLabel.attr({
            "text-anchor": "middle",
            fill: "url(#auto-gradient)",
          });

          chart.customLabels.push(manualLabel, autoLabel);
        },
      },
    },

    exporting: {
      enabled: false,
    },
    title: {
      text: "",
      align: "left",
      margin: 30,
      style: {
        color: "#FFFFFF",
        fontSize: "21px",
        lineHeight: "25px",
        paddingBottom: "10px",
        borderBottom: "1px solid #ffffff",
        marginBottom: "20px",
      },
    },
    subtitle: {
      text: "",
      align: "left",
      style: {
        color: "#FFFFFF",
      },
    },
    tooltip: {
      outside: true,
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    pane: {
      size: "79%",
      innerSize: "0%",
      endAngle: 270,
    },
    colorAxis: {
      gridLineColor: "#ffffff1a",
      maxColor: "#ffffff1a",
      minColor: "#ffffff1a",
    },
    xAxis: {
      tickInterval: 1,
      gridLineColor: "#ffffff1a",
      labels: {
        align: "right",
        useHTML: true,
        allowOverlap: true,
        step: 1,
        y: 2,
        style: {
          color: "#fff",
          fontSize: "11px",
          whiteSpace: "nowrap",
        },
      },
      lineWidth: 0,
      categories: [
        "Manual" + '<span class="arrow"></span>',
        "Automated" + '<span class="arrow"></span>',
        null,
        null,
      ],
    },
    yAxis: {
      min: 0,
      max: 2000,
      gridLineColor: "#ffffff1a",
      crosshair: {
        enabled: true,
        color: "#ffffff",
      },
      labels: {
        overflow: "justify",
        style: {
          color: "#fff",
          fontSize: "11px",
          whiteSpace: "nowrap",
        },
      },
      lineWidth: 0,
      tickInterval: 500,
      reversedStacks: false,
      endOnTick: true,
      showLastLabel: true,
    },
    plotOptions: {
      column: {
        stacking: "normal",
        borderWidth: 0,
        pointPadding: 0,
        groupPadding: 0.4,
      },
      series: {
        stickyTracking: true,
      },
    },
    series: [
      {
        name: "Manual",
        data: [Number(effortComparison.manualEffort), null, null, null], // value only for Manual
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
          stops: [
            [0, "#F3D020"], // yellow
            [0.3, "#F07A2E"], // orange-red
            [1, "#D73C2C"],
          ],
        },
      },
      {
        name: "Automated",
        data: [null, Number(effortComparison.automationValue), null, null], // value only for Automated
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
          stops: [
            [0, "#94F219"], // light green
            [1, "#5A9310"], // dark green
          ],
        },
      },
      {
        name: "Fake Series",
        data: [24e6, 24e6, null, null],
        grouping: false,
        stacking: false,
        showInLegend: false,
        enableMouseTracking: false,
        zIndex: -1,
        color: "#000000",
      },
    ],
  };
  return (
    <HStack>
      <VStack align="start" gap={4} mr={4}>
        <Text fontWeight={"200"} fontSize="lg">
          Cost comparison{" "}
          <Text as="span" fontSize={"sm"}>
            per annum
          </Text>
        </Text>
        <Separator width="full" borderColor={"white"} />
        <Text fontSize="xl" letterSpacing="wider">
          SAVING{" "}
          <Text as="span" fontWeight="bolder">
            ${numberFormatter(costComparison.saving)}
          </Text>
        </Text>
      </VStack>
      <Box width="400px">
        <HighchartsReact highcharts={Highcharts} options={options} />
      </Box>
      <Box width="400px">
        <HighchartsReact highcharts={Highcharts} options={optionsEffort} />
      </Box>
      <VStack align="start" gap={4} mr={4}>
        <Text fontWeight={"200"} fontSize="lg">
          Effort comparison{" "}
          <Text as="span" fontSize={"sm"}>
            per annum
          </Text>
        </Text>
        <Separator width="full" borderColor={"white"} />
        <Text fontSize="xl" letterSpacing="wider">
          SAVING
          <Text as="span" fontWeight="bolder">
            {" "}
            {effortComparison.saving} Manhours{" "}
          </Text>
        </Text>
      </VStack>
    </HStack>
  );
};
const MemoEstimationChartCard = React.memo(EstimationChartCard);
export default MemoEstimationChartCard;
