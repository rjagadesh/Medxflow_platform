import { create } from "zustand";

const pms = window.location.pathname.includes("/pms");
const initialShrink = pms ? true : false;

const useShrinkStore = create((set) => ({
  isShrink: initialShrink,
  setIsShrink: (val) => set({ isShrink: val }),
}));

export default useShrinkStore;
