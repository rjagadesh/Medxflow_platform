/**
 * Page header context. Each page declares its title + subtitle via
 * `usePageHeader(...)`; the top bar renders them. This keeps the heading out of
 * the scrolling content area so pages get more vertical space.
 */
import { createContext, useContext, useEffect, useState } from "react";

const PageHeaderContext = createContext(null);

export function PageHeaderProvider({ children }) {
  const [header, setHeader] = useState({ title: "", subtitle: "" });
  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeaderValue() {
  return useContext(PageHeaderContext);
}

/** Called by a page to publish its title/subtitle to the top bar. */
export function usePageHeader(title, subtitle = "") {
  const ctx = useContext(PageHeaderContext);
  const set = ctx?.setHeader;
  useEffect(() => {
    if (set) set({ title, subtitle });
  }, [title, subtitle, set]);
}
