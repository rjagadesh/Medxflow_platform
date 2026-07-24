/**
 * Developer mode: a global on/off toggle (remembered across sessions). When on,
 * every page shows a section-aware chat dock so users can iterate on that screen.
 */
import { createContext, useContext, useMemo, useState } from "react";

const DevModeContext = createContext(null);

export function DevModeProvider({ children }) {
  const [devMode, setDevMode] = useState(
    () => localStorage.getItem("eirim_dev_mode") === "1"
  );

  function toggle() {
    setDevMode((v) => {
      const next = !v;
      localStorage.setItem("eirim_dev_mode", next ? "1" : "0");
      return next;
    });
  }

  const value = useMemo(() => ({ devMode, toggle }), [devMode]);
  return <DevModeContext.Provider value={value}>{children}</DevModeContext.Provider>;
}

export function useDevMode() {
  const ctx = useContext(DevModeContext);
  if (!ctx) throw new Error("useDevMode must be used within a DevModeProvider");
  return ctx;
}
