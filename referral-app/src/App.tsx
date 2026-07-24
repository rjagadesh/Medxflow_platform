import { Routes, Route } from "react-router-dom";
import { StoreProvider } from "./lib/store";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Overview from "./pages/Overview";
import Referrals from "./pages/Referrals";
import ReferralDetail from "./pages/ReferralDetail";
import Board from "./pages/Board";
import ManualReview from "./pages/ManualReview";
import Upload from "./pages/Upload";
import Allocation from "./pages/Allocation";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <StoreProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/referrals/:id" element={<ReferralDetail />} />
              <Route path="/board" element={<Board />} />
              <Route path="/review" element={<ManualReview />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/allocation" element={<Allocation />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </StoreProvider>
  );
}
