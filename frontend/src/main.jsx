import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DevModeProvider } from "./context/DevModeContext.jsx";
import { PermissionsProvider } from "./context/PermissionsContext.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PermissionsProvider>
          <DevModeProvider>
            <App />
          </DevModeProvider>
        </PermissionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
