import { useRoutes } from "react-router-dom";
import mainRouter from "./routes/main-router.jsx";
import "./styles/apps.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./store/providers/auth-provider.jsx";
import { Suspense, useEffect } from "react";
import { SuspenseFallback } from "./components/nprogress/nprogress.jsx";

const queryClient = new QueryClient();

function App() {
  const routes = useRoutes(mainRouter);
  useEffect(() => {
    let timeout;
    const show = () => document.body.classList.add("show-scrollbar");
    const hide = () => document.body.classList.remove("show-scrollbar");

    const onScroll = () => {
      show();
      clearTimeout(timeout);
      timeout = setTimeout(hide, 700); // hide after 700ms idle
    };

    window.addEventListener("scroll", onScroll);
    document.body.addEventListener("mouseenter", show);
    document.body.addEventListener("mouseleave", hide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.removeEventListener("mouseenter", show);
      document.body.removeEventListener("mouseleave", hide);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={<SuspenseFallback />}>{routes}</Suspense>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
