import { VerticalProgressBar } from "@/components/progress-bar/vertical-progress-bar";
import { memo } from "react";

const AgentProgressBar = ({ success = 0, failure = 0 }) => {
  return (
    <>
      <VerticalProgressBar
        values={[
          {
            value: failure,
            color: "bg-red-500",
            className: "rounded-full",
            label:
              "bg-[linear-gradient(2deg,rgba(255,36,13,1)_0%,rgba(193,0,8,1)_100%)]",
          },
          {
            value: success,
            color:
              "bg-gradient-to-t from-[rgba(90,147,16,1)] to-[rgba(148,242,25,1)]",
            label: "Green",
          },
        ]}
        height="h-[70px] 2xl:h-[100px]"
        width="w-[6px] 2xl:w-2"
        showValue
        colors={{
          background: "bg-gray-300",
          fill: "bg-gradient-to-t from-blue-600 to-cyan-400",
          text: "text-blue-600",
        }}
        animated
      />
    </>
  );
};

export default memo(AgentProgressBar);
