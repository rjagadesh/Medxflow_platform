let mode = import.meta.env.VITE_MODE;

mode = mode ?? "development";
const config = {
  development: {
    // Local MedXFlow-embedded backend (Django on 127.0.0.1:8002). CORS_ALLOW_ALL_ORIGINS
    // is enabled on that backend, so the browser can call it cross-origin from the
    // PMS dev server. Route urls in api.js are absolute (${BASE_URL}/app/...), so they
    // hit the backend directly without the vite proxy.
    BASE_URL: "http://127.0.0.1:8002",
    DROID_METRIX_BASE_URL: "http://127.0.0.1:8002/app/roi/",
    STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  },
  beta: {
    BASE_URL: "https://droidal.ai/",
    DROID_METRIX_BASE_URL: "https://droidal.ai/roi/",
    STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  },
  local: {
    // Absolute same-origin URL (no trailing slash). Route urls in api.js must stay
    // absolute so axios uses them directly instead of prepending its own /app baseURL
    // (a relative BASE_URL caused doubled /app/app/ paths). nginx proxies /app + /media
    // on this host to the local Django backend (127.0.0.1:8002).
    BASE_URL: "https://pms.droidal.ai",
    DROID_METRIX_BASE_URL: "https://pms.droidal.ai/app/roi/",
    STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  },
  production: {
    BASE_URL: "https://dev-cloud.droidal.com/",
    DROID_METRIX_BASE_URL: "https://dev-cloud.droidal.com/roi/",
    STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
  },
};

console.log("mode999", mode, config[mode]);

export default {
  config: config[mode],
};
