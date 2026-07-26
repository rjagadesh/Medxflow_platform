import getStatusIcon from "@/utils/status-icon";
import { Box } from "@chakra-ui/react";
import { Span, VStack } from "@chakra-ui/react";
import { Heading } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";

export const CountUp = ({ value, duration = 1.5 }) => {
  const [displayValue, setDisplayValue] = useState(value || "0");

  useEffect(() => {
    const strValue = String(value);
    const numericPart = strValue.replace(/[^0-9.]/g, "");
    const prefix = strValue.match(/^[^0-9.]+/)?.[0] || "";
    const suffix = strValue.match(/[^0-9.]+$/)?.[0] || "";

    const target = parseFloat(numericPart);
    if (isNaN(target)) {
      setDisplayValue(strValue);
      return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min(
        (timestamp - startTimestamp) / (duration * 1000),
        1,
      );

      // Easing function: easeOutExpo
      const easedProgress =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = easedProgress * target;

      // Formatting
      let formatted;
      if (numericPart.includes(".")) {
        formatted = current.toFixed(numericPart.split(".")[1].length);
      } else {
        formatted = Math.floor(current).toLocaleString();
      }

      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

export const KPICard = ({ title, icon: Icon, children, isPriority }) => {
  return (
    <Box
      p={{
        base: 3,
        "3xl": 3,
        "4xl": 5,
      }}
      className="kpi-card rounded-xl flex flex-col relative"
    >
      <svg
        width="0"
        height="0"
        className="absolute pointer-events-none opacity-0"
      >
        <defs>
          <linearGradient
            id="kpi-blue-gradient"
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#005b7f" />
            <stop offset="100%" stopColor="#00bbf2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={30} stroke="url(#kpi-blue-gradient)" />}
          <Heading
            fontSize={{
              base: "xs",
              "3xl": "sm",
              "4xl": "lg",
            }}
            textTransform={"uppercase"}
            letterSpacing={"wider"}
            fontWeight={"normal"}
            whiteSpace={"nowrap"}
            color={"white"}
            m={0}
          >
            {title}
          </Heading>
        </div>
        {isPriority &&
          getStatusIcon("Priority", {
            size: "xs",
            px: 2,
            rounded: "md",
            py: 1,
          })}
      </div>
      <VStack
        gap="0"
        gapY={{
          base: "-1",
          "3xl": "-0.5",
          "4xl": "0.5",
        }}
        className="flex-grow"
      >
        {children}
      </VStack>
    </Box>
  );
};

export const MetricRow = ({ label, value, delta, isPositive, isNegative }) => (
  <div className="flex w-full justify-between items-end">
    <Span
      fontSize={{
        base: "2xs",
        "3xl": "12px",
      }}
      className="font-normal uppercase text-slate-label"
    >
      {label}
    </Span>
    <div className="flex items-baseline gap-1.5">
      <span
        className={`font-bold text-base ${
          isNegative ? "text-red-gradient" : "text-white"
        }`}
      >
        <CountUp value={value} />
      </span>
      {delta && (
        <span
          className={`text-[9px] font-bold ${
            isPositive ? "text-soft-mint" : "text-red-500"
          }`}
        >
          {isPositive ? "▲" : "▼"} {delta}
        </span>
      )}
    </div>
  </div>
);

export const ProgressMetric = ({
  label,
  percentage,
  colorClass = "bg-blue-gradient-horizontal",
}) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="space-y-1 pt-1 w-full">
      <div className="flex justify-between text-[10px] font-normal uppercase tracking-wider">
        <span className="text-slate-label">{label}</span>
        <span className="text-primary">
          <CountUp value={`${percentage}%`} />
        </span>
      </div>
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-[1500ms] ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};
