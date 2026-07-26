import axios from "axios";
import { toaster } from "@/components/ui/toaster";
import ApiConstant from "./constant";
import { ensureSession } from "./auto-login";

const BASE_URL = `${ApiConstant.BASE_URL}/${ApiConstant.APP}/`;
const toastId = "logout";
// BASE_URL = PROD_BASE_URL;
// DOMAIN = PROD_DOMAIN;
const api = axios.create({
  baseURL: BASE_URL,
});

// Add Authorization header to every request
api.interceptors.request.use(
  ({
    metadata: {
      isAuthenticated = true,
      isDroidMetrix = false,
      isCustomAuth = false,
      api_key,
    } = {},
    ...config
  }) => {
    console.log("config1212", config);
    const accessToken = localStorage.getItem("access");
    console.log("accessToken", accessToken, config, isAuthenticated);
    if (isCustomAuth) {
      // config.headers["X-API-KEY"] = api_key;
    } else if (isDroidMetrix) {
      config.headers["Authorization"] = `Basic cXYwZmptNThmOTpibmQ4cmthbnNt`;
    } else if (isAuthenticated) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // config.headers["Pragma"] = "no-cache";
    // config.headers["Expires"] = "0";

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    console.log("error90909", error.response);
    const refreshToken = localStorage.getItem("refresh");

    if (
      error.response.status === 401 &&
      error.response.data.error !== "Invalid credentials" &&
      refreshToken
    ) {
      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem("refresh");
        const response = await axios.post(`${BASE_URL}token/refresh/`, {
          refresh: refreshToken,
        });

        // Update access token and retry the original request
        localStorage.setItem("access", response.data.access);
        error.config.headers["Authorization"] =
          `Bearer ${response.data.access}`;

        // Retry the failed request with the new token
        return api.request(error.config);
      } catch (refreshError) {
        // Login-less demo: refresh token expired — silently re-authenticate as
        // the demo user and retry the original request instead of showing /login.
        try {
          await ensureSession(true);
          error.config.headers["Authorization"] =
            `Bearer ${localStorage.getItem("access")}`;
          return api.request(error.config);
        } catch (reauthError) {
          return Promise.reject(reauthError);
        }
      }
    } else if (error.response.status === 401) {
      const code = error.response.data.code;

      if (code === "token_not_valid") {
        // No refresh token present — re-authenticate as the demo user and retry.
        try {
          await ensureSession(true);
          error.config.headers["Authorization"] =
            `Bearer ${localStorage.getItem("access")}`;
          return api.request(error.config);
        } catch (reauthError) {
          return Promise.reject(reauthError);
        }
      }
    }
    return Promise.reject(error.response.data);
  },
);

export default api;
