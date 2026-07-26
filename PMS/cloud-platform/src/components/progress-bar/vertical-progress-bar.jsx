"use client";

import { useEffect, useState } from "react";

export function VerticalProgressBar({
  value,
  values,
  height = "h-64",
  width = "w-6",
  className,
  animated = true,
  colors = {
    background: "bg-gray-700",
    fill: "bg-gradient-to-t from-red-500 via-yellow-500 to-green-500",
    text: "text-foreground",
  },
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [displayValues, setDisplayValues] = useState([]);

  useEffect(() => {
    if (values) {
      if (animated) {
        // Reset all to 0 first
        setDisplayValues(values.map((v) => ({ ...v, value: 0 })));

        values.forEach((v, index) => {
          setTimeout(() => {
            setDisplayValues((prev) =>
              prev.map((seg, i) =>
                i === index
                  ? { ...seg, value: Math.min(Math.max(v.value, 0), 100) }
                  : seg
              )
            );
          }, index * 1000); // delay each segment by 1s
        });
      } else {
        setDisplayValues(
          values.map((v) => ({
            ...v,
            value: Math.min(Math.max(v.value, 0), 100),
          }))
        );
      }
    } else if (value !== undefined) {
      // single value mode
      if (animated) {
        setDisplayValue(0);
        const timer = setTimeout(() => {
          setDisplayValue(Math.min(Math.max(value, 0), 100));
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setDisplayValue(Math.min(Math.max(value, 0), 100));
      }
    }
  }, [value, values, animated]);

  console.log("values", values);

  return (
    <div className={["flex flex-col items-center gap-2", className].join(" ")}>
      <div
        className={[
          "relative rounded-full overflow-hidden",
          height,
          width,
          colors.background,
        ].join(" ")}
      >
        {values ? (
          displayValues.map((segment, index) => {
            const previousHeight = displayValues
              .slice(0, index)
              .reduce((sum, v) => sum + v.value, 0);

            // Determine if this is the first or last filled segment
            const isFirst = index === displayValues.length - 1; // top-most
            const isLast = index === 0; // bottom-most

            return (
              <div
                key={index}
                className={[
                  "absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out",
                  segment.color || colors.fill,
                  isFirst ? "rounded-t-full" : "",
                  isLast ? "rounded-b-full" : "",
                ].join(" ")}
                style={{
                  height: `${segment.value}%`,
                  bottom: `${previousHeight}%`,
                  transitionProperty: animated ? "height, bottom" : "none",
                }}
              />
            );
          })
        ) : (
          // single segment mode
          <div
            className={[
              "absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000 ease-out",
              colors.fill,
            ].join(" ")}
            style={{
              height: `${displayValue}%`,
              transitionProperty: animated ? "height" : "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
