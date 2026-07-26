// src/components/nprogress-handler.jsx
import { useEffect } from "react";
import { useNavigation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.1,
  easing: "ease",
  speed: 500,
});

export const NProgressHandler = () => {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [navigation.state]);

  return null;
};

// Suspense fallback component with NProgress
export const SuspenseFallback = () => {
  useEffect(() => {
    // alert("Loading...");
    NProgress.start();
    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
};
