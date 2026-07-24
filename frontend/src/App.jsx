/**
 * Application routes.
 *   /login             – public login screen
 *   (everything else)  – wrapped in AppLayout (sidebar + topbar), auth-guarded
 *     /                – Dashboard
 *     /voice-ai        – Voice AI
 *     /licenses        – License management (super admin only)
 *     /settings        – Settings
 */
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AgentBuilder from "./pages/AgentBuilder.jsx";
import AgentConfig from "./pages/AgentConfig.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import Automations from "./pages/Automations.jsx";
import Connectors from "./pages/Connectors.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DecisionEngine from "./pages/DecisionEngine.jsx";
import EligibilityVerification from "./pages/EligibilityVerification.jsx";
import FileManager from "./pages/FileManager.jsx";
import KioskBuilder from "./pages/KioskBuilder.jsx";
import Licenses from "./pages/Licenses.jsx";
import Login from "./pages/Login.jsx";
import ModulePage from "./pages/ModulePage.jsx";
import Register from "./pages/Register.jsx";
import ReviewQueue from "./pages/ReviewQueue.jsx";
import ScheduledRuns from "./pages/ScheduledRuns.jsx";
import Settings from "./pages/Settings.jsx";
import SkillRunner from "./pages/SkillRunner.jsx";
import Vault from "./pages/Vault.jsx";
import VobPortal from "./pages/VobPortal.jsx";
import VoiceAI from "./pages/VoiceAI.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Full-screen VOB portal — authenticated but OUTSIDE the app layout
          (no sidebar / topbar); has its own back-to-home button. */}
      <Route
        path="/vob-portal"
        element={
          <ProtectedRoute>
            <VobPortal />
          </ProtectedRoute>
        }
      />

      {/* Authenticated area — the layout provides the sidebar + topbar. */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/decision-engine" element={<DecisionEngine />} />
        <Route path="/eligibility-verification" element={<EligibilityVerification />} />
        <Route path="/ai-front-desk-kiosk" element={<KioskBuilder />} />
        <Route path="/m/:slug" element={<ModulePage />} />
        <Route path="/review-queue" element={<ReviewQueue />} />
        <Route path="/skills/:slug" element={<SkillRunner />} />
        <Route path="/connectors" element={<Connectors />} />
        <Route path="/scheduled-runs" element={<ScheduledRuns />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/files" element={<FileManager />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/voice-ai" element={<VoiceAI />} />
        <Route path="/voice-ai/new" element={<AgentBuilder />} />
        <Route path="/voice-ai/:id" element={<AgentConfig />} />
        <Route
          path="/licenses"
          element={
            <ProtectedRoute roles={["SUPER_ADMIN"]}>
              <Licenses />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
