import React from "react";
import ReactDOM from "react-dom/client";
// HashRouter so the app works when embedded under a subpath (/referral/) with
// no server-side route rewriting.
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./lib/theme";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
