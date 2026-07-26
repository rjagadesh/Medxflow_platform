import { useEffect } from "react";

export function useOnOutsideClick(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      const el = ref.current;
      if (!el || el.contains(event.target)) return;

      // If the clicked element is a navigation/link, let it work normally
      const target = event.target;
      if (target.closest("a")) {
        return; // don’t block navigation
      }

      // Ignore clicks inside dialogs, menus, and other overlays
      if (
        target.closest('[role="dialog"]') ||
        target.closest('[role="menu"]') ||
        target.closest('[role="alertdialog"]') ||
        target.closest('[role="listbox"]') ||
        target.closest(".chakra-portal")
      ) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}
