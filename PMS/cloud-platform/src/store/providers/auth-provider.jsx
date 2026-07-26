import { createContext, useState } from "react";
import { useGETMe } from "@/hooks/query/useMe";
import { useLogin } from "@/hooks/mutation/useLogin";
import { useNavigate } from "react-router-dom";
import { toaster } from "@/components/ui/toaster";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";

export const AuthContext = createContext(null);

const publicPaths = [
  "/login",
  "/sign-up",
  "/reset-password",
  "/forgot-password",
  "/mfa-verify",
  "/patient-telehealth",
];

export const AuthProvider = ({ children }) => {
  const { mutate, isPending } = useLogin();
  const { mutate: sendVerification, isPending: isSendingVerification } =
    useSendMailVerification();
  const pathname = window.location.pathname;
  const isPublicPath =
    pathname.startsWith("/reset-password") || publicPaths.includes(pathname);

  const { data, isLoading, refetch } = useGETMe({
    enabled: isPublicPath ? false : true,
  });
  const navigate = useNavigate();

  // Add MFA state
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaData, setMfaData] = useState(null);

  const login = async (credentials) => {
    mutate(credentials, {
      onSuccess: (res) => {
        // Check if MFA is required
        if (res.mfa_required) {
          // Set MFA state and navigate to MFA page
          setMfaPending(true);
          setMfaData({
            user_id: res.user_id,
            credentials: credentials,
          });

          startTransition(() => {
            navigate("/mfa-verify");
            toaster.info({
              title: "MFA Required",
              description: "Please enter your verification code",
            });
          });
        } else {
          // Regular login success
          localStorage.setItem("access", res.access);
          localStorage.setItem("refresh", res.refresh);
          refetch();
          startTransition(() => {
            const redirectUrl =
              localStorage.getItem("redirect_after_login") || "/";
            localStorage.removeItem("redirect_after_login");
            navigate(redirectUrl);
            toaster.success({
              title: "Welcome back!",
              description: "Login successful",
            });
          });
        }
      },
      onError: (error) => {
        if (
          error.detail ===
          "Your account is not verified. Please check your email for the verification link."
        ) {
          sendVerification(credentials, {
            onSuccess: () => {
              toaster.success({
                title: "Verification Email Sent",
                description:
                  "Please check your email for the verification link.",
              });
              navigate("/login");
            },
            onError: (error) => {
              toaster.error({
                title: "Error",
                description:
                  error.detail ||
                  "Failed to send verification email. Please try again.",
              });
            },
          });
        } else {
          toaster.error({
            title: "Error",
            description: error.detail || "Login failed",
          });
        }
      },
    });
  };

  // Add MFA verification function
  const verifyMfa = async (mfaCode) => {
    if (!mfaData) {
      toaster.error({
        title: "Error",
        description: "Session expired. Please login again.",
      });
      navigate("/login");
      return;
    }

    try {
      console.log("🔐 MFA Data context:", mfaData);

      const requestData = {
        user_id: mfaData.user_id,
        token: mfaCode,
        ...mfaData.credentials,
      };

      console.log("📦 Full request payload:", requestData);

      // Use apiRequest with correct format - data goes in payload
      const response = await apiRequest(apiRoutes.auth.mfa_verify, {
        payload: requestData, // This is the key change!
      });

      console.log("✅ MFA verification successful response:", response);

      // MFA verification successful
      localStorage.setItem("access", response.access);
      localStorage.setItem("refresh", response.refresh);
      // localStorage.setItem("user_role", response.user_role);
      // localStorage.setItem("user_name", response.user_name);
      // localStorage.setItem("user_id", response.user_id);

      setMfaPending(false);
      setMfaData(null);
      refetch();

      startTransition(() => {
        const redirectUrl = localStorage.getItem("redirect_after_login") || "/";
        localStorage.removeItem("redirect_after_login");
        navigate(redirectUrl);
        toaster.success({
          title: "Welcome back!",
          description: "Login successful",
        });
      });
    } catch (error) {
      console.error("❌ MFA verification error:", error);
      console.error("❌ Error response:", error.response?.data);

      toaster.error({
        title: "Error",
        description:
          error.response?.data?.detail ||
          error.message ||
          "MFA verification failed",
      });
      throw error;
    }
  };

  // Add function to cancel MFA and go back to login
  const cancelMfa = () => {
    setMfaPending(false);
    setMfaData(null);
    // navigate("/login");
  };

  const logout = () => {
    localStorage.clear();
    setMfaPending(false);
    setMfaData(null);
  };

  const permissions = data?.role_permission || [];

  return (
    <AuthContext.Provider
      value={{
        user: data,
        login,
        verifyMfa,
        cancelMfa,
        logout,
        permissions,
        loading: isLoading || isPending || isSendingVerification,
        mfaPending,
        mfaData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import { useContext } from "react";
import { startTransition } from "react";
import axios from "axios";
import { useSendMailVerification } from "@/hooks/mutation/useSendMailVerification";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
};

export const useAuthSetUser = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
};
