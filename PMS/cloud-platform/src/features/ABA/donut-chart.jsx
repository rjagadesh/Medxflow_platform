import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Box } from "@chakra-ui/react";

const ResourceDistributionChart = ({ chartData }) => {
  const total =
    chartData.projects_count +
      chartData.tasks_count +
      chartData.triggers_count +
      chartData.queues_count +
      chartData.machines_count || 0;

  const data = [
    { name: "Projects", value: chartData.projects_count, color: "#144B79" },
    { name: "Tasks", value: chartData.tasks_count, color: "#3AE8FF" },
    { name: "Triggers", value: chartData.triggers_count, color: "#1A57B9" },
    { name: "Queues", value: chartData.queues_count, color: "#44ABEF" },
    { name: "Machines", value: chartData.machines_count, color: "#357CED" },
  ].map((item) => ({
    name: item.name,
    y: total > 0 ? (item.value / total) * 100 : 0, // convert to percentage
    color: item.color,
  }));

  const options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent", // Dark background like your example
    },
    title: { text: "" }, // Remove title
    subtitle: { text: "" }, // Remove subtitle
    tooltip: {
      pointFormat: "{point.name}: <b>{point.percentage:.0f}%</b>",
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        size: "75%",
        innerSize: "70%",
        borderWidth: 0,
        borderRadius: 0,
        dataLabels: {
          enabled: true,
          distance: 20, // ✅ pushes labels outside the chart
          connectorColor: "gray", // ✅ matches arc color
          connectorWidth: 2,
          style: {
            color: "#fff",
            fontSize: "14px",
            fontWeight: "normal",
          },
          formatter: function () {
            // ✅ Skip labels (and connectors) when value is 0
            if (this.y === 0) {
              return null;
            }
            return this.point.name + " " + this.percentage.toFixed(0) + "%";
          },
        },
      },
    },
    colors: ["#2280BA", "#21A3E3", "#6ACEF6", "#144B79"], // Custom palette like your image
    series: [
      {
        name: "Categories",
        colorByPoint: true,
        data: data,
      },
    ],
  };

  return (
    <div className="w-full h-[300px] relative flex items-center justify-between">
      <div>
        {data.map((item, index) => (
          <div key={index} className="flex items-center mb-8">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="text-white text-sm">{item.name}</div>
          </div>
        ))}
      </div>
      <Box width="80%" marginLeft={"auto"}>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </Box>

      {/* <div className="w-full h-[400px]"> */}

      {/* <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={110}
              outerRadius={150}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={hoveredIndex === index ? "#ffffff" : "transparent"}
                  strokeWidth={hoveredIndex === index ? 3 : 0}
                  style={{
                    filter: hoveredIndex === index ? "brightness(1.1)" : "none",
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer> */}
      {/* </div> */}
    </div>
  );
};

export default ResourceDistributionChart;
