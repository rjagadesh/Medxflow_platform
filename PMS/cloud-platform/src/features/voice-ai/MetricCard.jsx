import { Span } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
const CountUp = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale = "en-IN", // change to "en-US" if needed
}) => {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "-10px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  console.log("isInView", isInView, value);

  useEffect(() => {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = prefix + formatter.format(latest) + suffix;
      }
    });

    return () => unsubscribe();
  }, [springValue, decimals, prefix, suffix, locale]);

  return <span ref={ref} />;
};

export const MetricCard = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColorClass,
  iconBgClass,
  subtext,
  actionNode,
}) => {
  const parseValue = (val) => {
    if (typeof val !== "string") return null;
    const cleanVal = val.replace(/,/g, "");
    const match = cleanVal.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(\D*)$/);
    if (match) {
      return {
        prefix: match[1],
        num: parseFloat(match[2]),
        suffix: match[3],
        decimals: (match[2].split(".")[1] || []).length,
      };
    }
    return null;
  };

  const parsed = parseValue(value);
  console.log("parsed1212", parsed);
  return (
    <div className="relative bg-card-dark border border-border-dark p-6 rounded-xl card-glow border-[#2f4d78] transition-all">
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-400 text-sm font-medium tracking-widest">
          {title}
        </span>
        <Span className={`${iconColorClass} ${iconBgClass} rounded-lg`}>
          {icon}
        </Span>
      </div>
      <h3 className="text-3xl font-bold tracking-wider text-white mb-2">
        {parsed ? (
          <CountUp
            value={parsed.num}
            prefix={parsed.prefix}
            suffix={parsed.suffix}
            decimals={parsed.decimals}
          />
        ) : (
          value
        )}
      </h3>
      {/* <div className="flex items-center gap-2">
        {change && (
          <span
            className={`${change.startsWith("+") ? "text-[var(--chakra-colors-primary-400)]" : "text-gray-400"} text-xs font-bold`}
          >
            {change}
          </span>
        )}
        {subtext ? (
          <span className="text-gray-400 text-xs font-medium italic">
            {subtext}
          </span>
        ) : (
          <span className="text-gray-600 text-[10px] uppercase font-semibold">
            {changeLabel}
          </span>
        )}
      </div> */}
      <div className="absolute right-4 bottom-6">
        {actionNode ? <div className="mt-4">{actionNode}</div> : null}
      </div>
    </div>
  );
};
