import React, { useState, useEffect } from "react";
import DashboardCard from "@/features/droid-metrix/dashboard-card";
import { useGetDashboardTiles } from "@/hooks/query/droid-metrix/useGetDashboardTiles";
import { useAuth } from "@/store/providers/auth-provider";

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <div className="text-xl font-bold text-gray-600">
        Droid Metrics
        <span className="animate-pulse">...</span>
      </div>
    </div>
  </div>
);

const DroidMetrixDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user: userData } = useAuth();
  const { isLoading, data: dashboardTiles } = useGetDashboardTiles(
    userData?.mail
  );
  // Mock user data (replace with props or context)
  const user = {
    name: "Admin User",
    clientName: "Demo Client",
    userType: "admin",
    superadminUserType: null,
  };

  // Clock functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      //   clearTimeout(loadingTimer);
    };
  }, []);

  const formatDateTime = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="mb-6">
        <p className="text-white px-2 text-sm font-medium">
          Status for: {formatDateTime(currentTime)}
        </p>
      </div>

      {/* Dashboard Cards */}
      <DashboardCard clientname={user.clientName} data={dashboardTiles} />
    </>
  );
};

export default DroidMetrixDashboard;
