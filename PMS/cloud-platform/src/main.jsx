import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "./components/ui/provider";
import { BrowserRouter } from "react-router-dom";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { NuqsAdapter } from "nuqs/adapters/react";
import { ensureSession } from "./services/auto-login";

// Login-less demo: silently sign in as the demo user before the first render so
// the embedded PMS opens straight to the workspace (no login screen).
function renderApp() {
  createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <NuqsAdapter>
    <ScrollArea.Root type="scroll" className="w-full h-full">
      <ScrollArea.Viewport className="w-full h-full scrollArea-viewport">
        <Provider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </ScrollArea.Viewport>

      <ScrollArea.Scrollbar
        orientation="vertical"
        className="flex select-none touch-none p-0.5 bg-black/20 w-2"
      >
        <ScrollArea.Thumb className="flex-1 bg-gray-500 rounded-full relative" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
    </NuqsAdapter>
    // </StrictMode>
  );
}

// Ensure a session exists first, then render regardless of the outcome.
ensureSession().finally(renderApp);
