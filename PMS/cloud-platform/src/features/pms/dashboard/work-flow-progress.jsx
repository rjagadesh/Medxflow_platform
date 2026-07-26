import { useEffect, useRef } from "react";

const steps = [
  "Onboarding ",
  "Eligibility",
  "Visit",
  "Billing",
  "Claim",
  "Payment",
];

const TOTAL_DURATION = 15000;
const SNAKE_LENGTH = 10;

export default function WorkflowProgress() {
  const containerRef = useRef(null);
  const segmentRefs = useRef([]);
  const labelRefs = useRef([]);
  const startLineRef = useRef(null);
  const endLineRef = useRef(null);
  const pointerRef = useRef(null);
  const trackRef = useRef(null);
  const startLineContainerRef = useRef(null);
  const endLineContainerRef = useRef(null);
  const segmentContainerRefs = useRef([]);

  useEffect(() => {
    const totalProgress = 100 + SNAKE_LENGTH;

    // Use linear timing for constant speed
    const cycleDuration = TOTAL_DURATION;

    let animationId;
    let startTime = null;

    const updateDOM = (headProgress) => {
      if (!trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackWidth = trackRect.width;

      // Calculate global pixel positions based on progress
      // Map 0-100 to 0-trackWidth
      const pxPerProgress = trackWidth / 100;
      const headPx = headProgress * pxPerProgress;
      const tailPx = (headProgress - SNAKE_LENGTH) * pxPerProgress;

      // Helper to update line styles
      const updateLine = (container, inner) => {
        if (!container || !inner) return;
        const rect = container.getBoundingClientRect();
        const start = rect.left - trackRect.left;
        const width = rect.width;

        // Calculate overlap in local pixels
        const headLocal = Math.max(0, Math.min(headPx - start, width));
        const tailLocal = Math.max(0, Math.min(tailPx - start, width));

        const headPercent = (headLocal / width) * 100;
        const tailPercent = (tailLocal / width) * 100;

        const fillAmount = headPercent - tailPercent;

        inner.style.width = `${headPercent}%`;
        inner.style.clipPath = `inset(0 0 0 ${tailPercent}%)`;
        inner.style.boxShadow =
          fillAmount > 0.1 ? "0 0 8px rgba(0, 187, 242, 0.5)" : "none";
      };

      // Helper to update label styles
      const updateLabel = (label) => {
        if (!label) return;
        const rect = label.getBoundingClientRect();
        const start = rect.left - trackRect.left;
        const width = rect.width;

        // Calculate overlap in local pixels
        const headLocal = Math.max(0, Math.min(headPx - start, width));
        const tailLocal = Math.max(0, Math.min(tailPx - start, width));

        const headPercent = (headLocal / width) * 100;
        const tailPercent = (tailLocal / width) * 100;

        // Apply gradient text fill
        // Gradient stops: Gray | Blue | Blue | Gray
        // 0% -> Tail% : Gray
        // Tail% -> Head% : Blue
        // Head% -> 100% : Gray

        label.style.backgroundImage = `linear-gradient(to right, #fff ${tailPercent}%, #00bbf2 ${tailPercent}%, #00bbf2 ${headPercent}%, #fff ${headPercent}%)`;
        label.style.backgroundClip = "text";
        label.style.webkitBackgroundClip = "text";
        label.style.color = "transparent";
      };

      // Update Lines
      updateLine(startLineContainerRef.current, startLineRef.current);
      segmentContainerRefs.current.forEach((container, i) => {
        updateLine(container, segmentRefs.current[i]);
      });
      updateLine(endLineContainerRef.current, endLineRef.current);

      // Update Labels
      labelRefs.current.forEach((label) => updateLabel(label));

      // Update Pointer
      if (pointerRef.current) {
        pointerRef.current.style.transform = `translate(${headPx}px, -50%)`;
        pointerRef.current.style.opacity =
          headProgress > 0 && headProgress <= 100 ? "1" : "0";
      }
    };

    const animate = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const t = Math.min(elapsed / cycleDuration, 1);

      // Linear movement
      const headProgress = t * totalProgress;

      updateDOM(headProgress);

      if (t >= 1) {
        setTimeout(() => {
          startTime = null;
          animationId = requestAnimationFrame(animate);
        }, 1000);
      } else {
        animationId = requestAnimationFrame(animate);
      }
    };

    updateDOM(0);
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full max-w-5xl px-8" ref={containerRef}>
      <div className="relative">
        <div className="relative flex items-center gap-1" ref={trackRef}>
          <div
            ref={pointerRef}
            className="absolute top-1/2 left-0 z-20 pointer-events-none"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "linear-gradient(90deg, #005b7f 0%, #00bbf2 100%)",
              boxShadow:
                "0 0 6px rgba(0, 187, 242, 0.8), 0 0 10px rgba(0, 187, 242, 0.4)",
              opacity: 0,
              transform: "translate(0px, -50%)",
              marginLeft: "-3px", // Half of width to center on the line edge
            }}
          />

          <div
            ref={startLineContainerRef}
            className="flex-1 relative h-[1.5px] mr-0"
          >
            <div className="absolute inset-0 bg-gray-400 rounded-full" />
            <div
              ref={startLineRef}
              className="absolute inset-y-0 left-0 bg-blue-gradient-horizontal rounded-full"
              style={{ width: "0%", transition: "box-shadow 0.3s ease-out" }}
            />
          </div>

          {steps.map((step, index) => (
            <div key={step} className="contents">
              <div className="relative z-10 flex-none flex justify-center">
                <span
                  ref={(el) => {
                    labelRefs.current[index] = el;
                  }}
                  className="relative text-[11px]  font-medium tracking-wider uppercase whitespace-nowrap"
                  style={{
                    color: "#52525b",
                    // removed transition as we control it via background
                  }}
                >
                  {step}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  ref={(el) => {
                    segmentContainerRefs.current[index] = el;
                  }}
                  className="flex-1 relative h-[1.5px]"
                >
                  <div className="absolute inset-0 bg-gray-400 rounded-full" />
                  <div
                    ref={(el) => {
                      segmentRefs.current[index] = el;
                    }}
                    className="absolute inset-y-0 left-0 bg-blue-gradient-horizontal rounded-full"
                    style={{
                      width: "0%",
                      transition: "box-shadow 0.3s ease-out",
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          <div
            ref={endLineContainerRef}
            className="flex-1 relative h-[1.5px] ml-0"
          >
            <div className="absolute inset-0 bg-gray-400 rounded-full" />
            <div
              ref={endLineRef}
              className="absolute inset-y-0 left-0 bg-blue-gradient-horizontal rounded-full"
              style={{ width: "0%", transition: "box-shadow 0.3s ease-out" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
