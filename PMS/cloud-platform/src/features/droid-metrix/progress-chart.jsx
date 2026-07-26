import React, { useEffect, useRef } from "react";

export default function ProgressChart({ chartId, success, fail }) {
  const canvasRef = useRef(null);
  const outerInputRef = useRef(null);
  const innerInputRef = useRef(null);

  useEffect(() => {
    const config = {
      outerProgress: success,
      innerProgress: fail,
      size: 106,
      segments: 30,
      gap: 5,
      inactiveColor: "#2C4A65",
      activeColor: "#00C950", // Green outer
      innerActiveColor: "#E6486A", // Red inner
      backgroundColor: "transparent",
      animationSpeed: 0.5,
    };

    let currentOuterProgress = 0;
    let currentInnerProgress = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function updateDisplay() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = config.size * dpr;
      canvas.height = config.size * dpr;
      canvas.style.width = `${config.size}px`;
      canvas.style.height = `${config.size}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      ctx.scale(dpr, dpr);

      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, config.size, config.size);

      const centerX = config.size / 2;
      const centerY = config.size / 2;
      const outerRadius = (config.size / 2) * 0.8;
      const innerRadius = (config.size / 2) * 0.6;
      const segmentAngle = (2 * Math.PI) / config.segments;
      const activeOuterSegments = Math.floor(
        (currentOuterProgress / 100) * config.segments
      );
      const activeInnerSegments = Math.floor(
        (currentInnerProgress / 100) * config.segments
      );

      // Outer Ring
      for (let i = 0; i < config.segments; i++) {
        const startAngle = i * segmentAngle - Math.PI / 2;
        const endAngle =
          startAngle + segmentAngle - (config.gap * Math.PI) / 180;

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.arc(
          centerX,
          centerY,
          outerRadius * 0.85,
          endAngle,
          startAngle,
          true
        );
        ctx.closePath();
        ctx.fillStyle =
          i < activeOuterSegments ? config.activeColor : config.inactiveColor;
        ctx.fill();
      }

      // Inner Ring
      for (let i = 0; i < config.segments; i++) {
        const startAngle = i * segmentAngle - Math.PI / 2;
        const endAngle =
          startAngle + segmentAngle - (config.gap * Math.PI) / 180;

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
        ctx.arc(
          centerX,
          centerY,
          innerRadius * 0.85,
          endAngle,
          startAngle,
          true
        );
        ctx.closePath();
        ctx.fillStyle =
          i < activeInnerSegments
            ? config.innerActiveColor
            : config.inactiveColor;
        ctx.fill();
      }
    }

    function animate() {
      let updated = false;

      if (currentOuterProgress < config.outerProgress) {
        currentOuterProgress = Math.min(
          currentOuterProgress + config.animationSpeed,
          config.outerProgress
        );
        updated = true;
      } else if (currentOuterProgress > config.outerProgress) {
        currentOuterProgress = Math.max(
          currentOuterProgress - config.animationSpeed,
          config.outerProgress
        );
        updated = true;
      }

      if (currentInnerProgress < config.innerProgress) {
        currentInnerProgress = Math.min(
          currentInnerProgress + config.animationSpeed,
          config.innerProgress
        );
        updated = true;
      } else if (currentInnerProgress > config.innerProgress) {
        currentInnerProgress = Math.max(
          currentInnerProgress - config.animationSpeed,
          config.innerProgress
        );
        updated = true;
      }

      if (updated) updateDisplay();
      requestAnimationFrame(animate);
    }

    // Bind range input updates
    if (outerInputRef.current) {
      outerInputRef.current.addEventListener("input", function (e) {
        config.outerProgress = parseInt(e.target.value);
      });
    }
    if (innerInputRef.current) {
      innerInputRef.current.addEventListener("input", function (e) {
        config.innerProgress = parseInt(e.target.value);
      });
    }

    updateDisplay();
    animate();
  }, [success, fail]);

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} id={`progressCanvas-${chartId}`} />
      {/* Hidden inputs (keep for manual adjustment/debugging) */}
      <input
        ref={outerInputRef}
        type="range"
        min="0"
        max="100"
        defaultValue={success}
        step="1"
        className="hidden"
      />
      <input
        ref={innerInputRef}
        type="range"
        min="0"
        max="100"
        defaultValue={fail}
        step="1"
        className="hidden"
      />
    </div>
  );
}
