import { useAuth } from "@/store/providers/auth-provider";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show loading spinner or component
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  console.log("user1212", user, Object.keys(user).length > 0);
  if (Object.keys(user).length > 0) {
    return <Outlet />;
  }
};

export default ProtectedRoute;
