import { useEffect } from "react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ComparisonChart = ({
  title,
  saving,
  unit,
  manualValue,
  automationValue,
  type,
}) => {
  const data = [
    {
      name: "Cost",
      Manual: manualValue,
      Automation: automationValue,
    },
  ];

  const formatTooltip = (value) => {
    return type === "cost" ? `${value} $` : `${value} Hours`;
  };

  const formatLabel = (value) => {
    return type === "cost" ? `${value} $` : `${value} Hours`;
  };

  return (
    <div className="bg-droidal-black-300 p-6 rounded-lg border">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white mb-6">SAVING: {saving}</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barCategoryGap="45%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D6DBDF" />
            <XAxis
              dataKey="name"
              axisLine={{ stroke: "#FF5733" }}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatLabel}
              tick={{ fill: "#666", fontSize: 12 }}
              label={{
                value: type === "cost" ? "Cost ($)" : "Hours",
                angle: -90,
                position: "insideLeft",
                style: {
                  textAnchor: "middle",
                  fill: "#666",
                  fontSize: 14,
                  fontWeight: "bold",
                },
              }}
            />
            <Tooltip
              formatter={(value) => [formatTooltip(value), ""]}
              labelStyle={{ color: "#333" }}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="Manual"
              name={`Manual ${type}`}
              fill="#F08080"
              radius={[4, 4, 0, 0]}
              label={{
                position: "top",
                formatter: formatLabel,
                fill: "#333",
                fontSize: 12,
              }}
              barSize={70}
            />
            <Bar
              dataKey="Automation"
              name={`Automation ${type}`}
              fill="#2E827C"
              radius={[4, 4, 0, 0]}
              label={{
                position: "top",
                formatter: formatLabel,
                fill: "#333",
                fontSize: 12,
              }}
              barSize={70}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

function formatNumber(numStr) {
  const num = Number(numStr);
  return num.toLocaleString("en-US");
}

function calculatecostbarchart(roiData, setCostComparison) {
  let operationalmodel = roiData.operationalModel;
  let manualCost = "";
  if (operationalmodel == "ONSITE AND OFFSHORE") {
    let onsite_headCount = parseInt(roiData.onsiteHeadCount);
    let onsite_hoursSpent = parseInt(roiData.onsiteHoursSpent);
    let onsite_hourlyRate = parseInt(roiData.onsiteHourlyRate);
    let onsite_manualCost =
      onsite_headCount * onsite_hoursSpent * onsite_hourlyRate * 20 * 12;

    let offshore_headCount = parseInt(roiData.offshoreHeadCount);
    let offshore_hoursSpent = parseInt(roiData.offshoreHoursSpent);
    let offshore_hourlyRate = parseInt(roiData.offshoreHourlyRate);
    let offshore_manualCost =
      offshore_headCount * offshore_hoursSpent * offshore_hourlyRate * 20 * 12;

    manualCost = parseInt(onsite_manualCost) + parseInt(offshore_manualCost);
  } else {
    let headCount = parseInt(roiData.headCount);
    let hoursSpent = parseInt(roiData.hoursSpent);
    let hourlyRate = parseInt(roiData.hourlyRate);

    manualCost = headCount * hoursSpent * hourlyRate * 20 * 12;
  }
  let automationCost = manualCost * 0.4;
  let costSavings = manualCost - automationCost;

  manualCost = formatNumber(manualCost);
  automationCost = formatNumber(automationCost);
  costSavings = formatNumber(costSavings);

  setCostComparison({ manualCost, automationCost, saving: costSavings });
}

function calculateeffortbarchart(roiData, setEffortComparison) {
  let operationalmodel = roiData.operationalModel;
  let manualEffort = "";

  if (operationalmodel == "ONSITE AND OFFSHORE") {
    let onsite_headCount = parseInt(roiData.onsiteHeadCount);
    let onsite_hoursSpent = parseInt(roiData.onsiteHoursSpent);
    let onsite_manualEffort = onsite_headCount * onsite_hoursSpent * 20 * 12;

    let offshore_headCount = parseInt(roiData.offshoreHeadCount);
    let offshore_hoursSpent = parseInt(roiData.offshoreHoursSpent);
    let offshore_manualEffort =
      offshore_headCount * offshore_hoursSpent * 20 * 12;

    manualEffort =
      parseInt(onsite_manualEffort) + parseInt(offshore_manualEffort);
  } else {
    let headCount = parseInt(roiData.headCount);
    let hoursSpent = parseInt(roiData.hoursSpent);

    manualEffort = headCount * hoursSpent * 20 * 12;
  }
  let automationEffort = manualEffort * 0.5;
  let effortSavings = manualEffort - automationEffort;

  manualEffort = formatNumber(manualEffort);
  automationEffort = formatNumber(automationEffort);
  effortSavings = automationEffort;

  setEffortComparison({
    manualEffort,
    automationValue: automationEffort,
    saving: effortSavings,
  });
}

const EstimationTab = ({ processData, processName, setProcessName }) => {
  const [processDetails, setProcessDetails] = useState({});
  const [costComparison, setCostComparison] = useState({
    manualCost: 0,
    automationValue: 0,
    saving: 0,
  });
  const [effortComparison, setEffortComparison] = useState({
    manualEffort: 0,
    automationValue: 0,
    saving: 0,
  });

  const fetchEstimationData = async (process_name) => {
    try {
      const response = await fetch(
        `https://dev-cloud.droidal.com/roi/get-roi-data-by-process/${process_name}/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Basic cXYwZmptNThmOTpibmQ4cmthbnNt",
          },
        }
      );
      const data = await response.json();
      console.log(data);
      if (data.success) {
        calculateeffortbarchart(data.data, setEffortComparison);
        calculatecostbarchart(data.data, setCostComparison);
        setProcessDetails(data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (processName) {
      fetchEstimationData(processName);
    }
  }, [processName]);

  return (
    <div className="space-y-8">
      {/* Process Dropdown */}
      <div className="max-w-md">
        <label
          htmlFor="estimations-process"
          className="text-sm font-medium text-gray-300 mb-2 block"
        >
          Process
        </label>
        <select
          id="estimations-process"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          className="w-full bg-transparent text-white border-white border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          {processData.map((process) => (
            <option key={process.queue_name} value={process.queue_name}>
              {process.label_name}
            </option>
          ))}
        </select>
      </div>

      {/* Warning Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Please enter the values in the ROI Calculator
          before switching to the Estimation tab
        </p>
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ComparisonChart
          title="Cost Comparison per annum"
          saving={`$${costComparison.saving}`}
          unit="$"
          manualValue={costComparison.manualCost}
          automationValue={costComparison.automationValue}
          type="cost"
        />
        <ComparisonChart
          title="Effort Comparison per annum"
          saving={`${effortComparison.saving} Manhours`}
          unit="hours"
          manualValue={effortComparison.manualEffort}
          automationValue={effortComparison.automationValue}
          type="effort"
        />
      </div>
    </div>
  );
};

export default EstimationTab;
