import { get } from "react-hook-form";
import CONSTANT from "./constant";

const BASE_URL = `${CONSTANT.BASE_URL}/${CONSTANT.APP}`;

const DROID_METRIX_BASE_URL = `${CONSTANT.DROID_METRIX_BASE_URL}`;

console.log("DROID_METRIX_BASE_URL", DROID_METRIX_BASE_URL);

export const apiRoutes = {
  provider: {
    location: {
      url: `${BASE_URL}/encounter/service-locations/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/patient/provider/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/patient/provider/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    minimal_provider: {
      url: `${BASE_URL}/patient/minimal/providers/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getById: {
      url: (id) => `${BASE_URL}/patient/provider/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  auth: {
    login: {
      url: `${BASE_URL}/account/login/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
    signup: {
      url: `${BASE_URL}/account/register/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
    forgotPassword: {
      url: `${BASE_URL}/account/forgot-password/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
    resetPassword: {
      url: (uid, token) =>
        `${BASE_URL}/account/reset-password/${uid}/${token}/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
    mfa_verify: {
      url: `${BASE_URL}/account/mfa-verify/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
  },

  calendersettings: {
    create: {
      url: `${BASE_URL}/practicesettings/scheduling-settings/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/practicesettings/scheduling-settings/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/scheduling-settings/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/scheduling-settings/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },

  service: {
    list: {
      url: `${BASE_URL}/practicesettings/service-codes/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/service-codes/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: (id) => `${BASE_URL}/practicesettings/service-codes/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/service-codes/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/service-codes/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },

  visitreason: {
    list: {
      url: `${BASE_URL}/practicesettings/visit-reasons/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/visit-reasons/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: (id) => `${BASE_URL}/practicesettings/visit-reasons/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/visit-reasons/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/visit-reasons/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },

  feeScheduleEntry: {
    get: {
      url: `${BASE_URL}/practicesettings/fee-schedule-entries/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    create: {
      url: `${BASE_URL}/practicesettings/fee-schedule-entries/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    getById: (id) => ({
      url: `${BASE_URL}/practicesettings/fee-schedule-entries/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    }),

    update: (id) => ({
      url: `${BASE_URL}/practicesettings/fee-schedule-entries/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    }),

    patch: (id) => ({
      url: `${BASE_URL}/practicesettings/fee-schedule-entries/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    }),

    delete: (id) => ({
      url: `${BASE_URL}/practicesettings/fee-schedule-entries/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    }),

    bulkUpload: {
      url: `${BASE_URL}/practicesettings/fee-schedule-entries/bulk-upload/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
      isMultipart: true,
    },
  },
  staffscheduling: {
    get: {
      url: `${BASE_URL}/practicesettings/staff-schedules/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/staff-schedules/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/staff-schedules/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/staff-schedules/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  equipments: {
    get: {
      url: `${BASE_URL}/practicesettings/equipment/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/equipment/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/equipment/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/equipment/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  timeoff: {
    get: {
      url: `${BASE_URL}/practicesettings/staff-time-off/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/staff-time-off/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/staff-time-off/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/staff-time-off/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  holiday: {
    get: {
      url: `${BASE_URL}/practicesettings/practice-holidays/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/practice-holidays/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/practice-holidays/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/practice-holidays/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },

  room: {
    get: {
      url: `${BASE_URL}/practicesettings/rooms/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/rooms/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/rooms/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/rooms/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },

  provider_schedule: {
    get: {
      url: `${BASE_URL}/practicesettings/provider-schedule-blocks/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) =>
        `${BASE_URL}/practicesettings/provider-schedule-blocks/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/provider-schedule-blocks/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    delete: {
      url: (id) =>
        `${BASE_URL}/practicesettings/provider-schedule-blocks/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },

  serviceLocation: {
    list: {
      url: `${BASE_URL}/encounter/service-locations/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/encounter/service-locations/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: (id) => `${BASE_URL}/encounter/service-locations/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    update: {
      url: (id) => `${BASE_URL}/encounter/service-locations/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },

    delete: {
      url: (id) => `${BASE_URL}/encounter/service-locations/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  practiceInformation: {
    create: {
      url: `${BASE_URL}/practicesettings/practice-information/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/practicesettings/practice-information/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/practicesettings/practice-information/${id}/`,
      method: CONSTANT.PATCH, // ✅ FIX
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/practicesettings/practice-information/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  signup: {
    create: {
      url: `${BASE_URL}/account/register/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
  },
  login: {
    create: {
      url: `${BASE_URL}/account/login/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
    sendVerification: {
      url: `${BASE_URL}/account/mail-verification/`,
      method: CONSTANT.POST,
      isAuthenticated: false,
    },
  },
  me: {
    get: {
      url: `${BASE_URL}/account/me/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  project: {
    create: {
      url: `${BASE_URL}/project/projects/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/project/projects/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/project/projects/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/project/projects/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  task: {
    create: {
      url: `${BASE_URL}/project/tasks/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/project/tasks/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/project/tasks/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    files: {
      url: (taskId) => `${BASE_URL}/project/get-task-files/${taskId}`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    workspaceSave: {
      url: (id) => `${BASE_URL}/project/tasks-json/${id}/data/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    workspaceLoad: {
      url: (id) => `${BASE_URL}/project/tasks-json/${id}/data/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  hub: {
    metrics: {
      url: `${BASE_URL}/account/metrics/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  queue: {
    create: {
      url: `${BASE_URL}/queue/queues/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/queue/queues/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/queue/queues/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/queue/queues/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  apiKey: {
    create: {
      url: `${BASE_URL}/moduleapp/generated-apis/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/moduleapp/generated-apis/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/moduleapp/apps/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    appName: {
      url: `${BASE_URL}/moduleapp/get-api-key/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    user_app_minimal: {
      url: `${BASE_URL}/moduleapp/user-apps-minimal/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    retry: {
      url: (id) =>
        `${BASE_URL}/moduleapp/generated-api/${id}/update-max-retries/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  apps: {
    all: {
      url: `${BASE_URL}/moduleapp/apps/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: `${BASE_URL}/moduleapp/appsapi/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getById: {
      url: (id) => `${BASE_URL}/moduleapp/apps/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/moduleapp/apps/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/moduleapp/apps/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/moduleapp/apps/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    hidelist: {
      url: `${BASE_URL}/moduleapp/apps-hide-list/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    hide: {
      url: `${BASE_URL}/moduleapp/apps-hide/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    searchAgents: {
      url: `${BASE_URL}/moduleapp/search-app/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  column_settings: {
    all: {
      url: `${BASE_URL}/moduleapp/get_app_columns/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/moduleapp/column-settings/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/moduleapp/column-settings/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/moduleapp/get_app_columns/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  asset: {
    create: {
      url: `${BASE_URL}/project/assets/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/project/assets/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/project/assets/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/project/assets/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  machine: {
    create: {
      url: `${BASE_URL}/license/licenses/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/license/licenses/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/license/licenses/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/license/licenses/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  "queue-record": {
    create: {
      url: `${BASE_URL}/queue/queue-records/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/queue/queue-records/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/queue/queue-triggers/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/queue/queue-triggers/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  droidMetrix: {
    dashboard_tiles: {
      url: `${DROID_METRIX_BASE_URL}/queues/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    queues_details: {
      url: `${DROID_METRIX_BASE_URL}/charts/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    roi_process_detail: {
      url: (id) => `${DROID_METRIX_BASE_URL}/get-roi-data-by-process/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    departments: {
      url: `${DROID_METRIX_BASE_URL}/department-rest/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    actualSavings: {
      url: `${BASE_URL}/fetch-effort-data-rest/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  agentsRequest: {
    all: {
      url: `${BASE_URL}/agentsapp/tasks/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/agentsapp/tasks/create/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/insurance/insurances/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/insurance/insurances/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    files: {
      url: `${BASE_URL}/agentsapp/get-agent-files/`,
      method: CONSTANT.GET,
      isAuthenticated: false,
    },
    metric: {
      url: `${BASE_URL}/agentsapp/task-status-count/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    department_kpi: {
      url: (id) => `${BASE_URL}/agentsapp/department/${id}/task-status-count/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    requestByType: {
      url: `${BASE_URL}/agentsapp/overall-status/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    requestByDay: {
      url: `${BASE_URL}/agentsapp/request_by_day/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    requestStatusByDay: {
      url: `${BASE_URL}/agentsapp/request_status_by_day/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    requestStatusByMonth: {
      url: `${BASE_URL}/agentsapp/request_status_by_month/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    export: {
      url: `${BASE_URL}/agentsapp/tasks/export/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    bulkRequest: {
      url: `${BASE_URL}/agentsapp/bulk-upload/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    bulkDelete: {
      url: `${BASE_URL}/agentsapp/tasks-bulk-delete/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    editData: {
      url: `${BASE_URL}/agentsapp/edit-data/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
    updatePdf: {
      url: `${BASE_URL}/agentsapp/update-pdf/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  modules: {
    all: {
      url: `${BASE_URL}/moduleapp/modulesapi/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/moduleapp/modules/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  trigger: {
    create: {
      url: `${BASE_URL}/trigger/triggers/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    all: {
      url: `${BASE_URL}/trigger/triggers/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/trigger/triggers/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/trigger/triggers/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },

  triggerflags: {
    create: {
      url: `${BASE_URL}/trigger/triggerflag/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  secretkeys: {
    all: {
      url: `${BASE_URL}/moduleapp/secret-keys/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  sub_agents: {
    all: {
      url: `${BASE_URL}/moduleapp/sub-agent-list/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  sub_agents_key: {
    all: {
      url: `${BASE_URL}/moduleapp/sub-agent-apis/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/moduleapp/sub-agent-apis/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    id: {
      url: (id) => `${BASE_URL}/moduleapp/sub-agent-apis/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/moduleapp/sub-agent-apis/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  billing: {
    all: {
      url: `${BASE_URL}/billing/agent-tasks/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    invoice: {
      url: `${BASE_URL}/billing/generate-invoice/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getAgentNames: {
      url: `${BASE_URL}/billing/agents/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  "column-custom": {
    create: {
      url: `${BASE_URL}/moduleapp/column-custom/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  departmentStatus: {
    id: {
      url: (id) => `${BASE_URL}/moduleapp/department-status/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  user: {
    update: { url: `${BASE_URL}/account/user-profile/` },
  },
  license: {
    getlicensedetails: {
      url: `${BASE_URL}/account/client-license-overview/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  userrolemanagement: {
    create: {
      url: `${BASE_URL}/account/create-user/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    getusers: {
      url: `${BASE_URL}/account/client/users/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    deleteuser: {
      url: (id) => `${BASE_URL}/account/client/users/${id}/`, // Will append ID dynamically
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    edituser: {
      url: (id) => `${BASE_URL}/account/client/users/${id}/`, // Will append ID dynamically
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  roiProcces: {
    create: {
      url: `${BASE_URL}/roi/process-data/`, // Will append ID dynamically
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/roi/process-data/${id}/`, // Will append ID dynamically
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/roi/process-data/`, // Will append ID dynamically
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  triggerdetails: {
    create: {
      url: `${BASE_URL}/trigger/status/`, // Will append ID dynamically
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/trigger/status/${id}/`, // Will append ID dynamically
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    get: {
      url: (id) => `${BASE_URL}/trigger/status/${id}/`, // Will append ID dynamically
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  "module-permission": {
    all: {
      url: `${BASE_URL}/moduleapp/module-permission/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/moduleapp/module-permission/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/moduleapp/module-permission/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/moduleapp/module-permission/${id}/`,
      method: CONSTANT.DELETE,

      isAuthenticated: true,
    },
  },
  audit: {
    fetch: {
      url: `${BASE_URL}/moduleapp/logs`, // Will append ID dynamically
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  paymentpreview: {
    create: {
      url: `${BASE_URL}/billing/create-checkout-session/`, // Will append ID dynamically
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    hook: {
      url: `${BASE_URL}/billing/webhook/`, // Will append ID dynamically
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/billing/transactions/`, // Will append ID dynamically
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },

  mfa: {
    enable: {
      url: "/account/mfa/",
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    disable: {
      url: "/account/mfa/",
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    regenerate: {
      url: "/account/mfa/",
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },

  accesss_control: {
    create: {
      url: `${BASE_URL}/account/access-control/save-permissions/`, // Will append ID dynamically
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/account/access-control/save-permissions/`, // Will append ID dynamically
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  instructions: {
    create: {
      url: `${BASE_URL}/agentsapp/instruction/`, // Will append ID dynamically
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/agentsapp/instruction/${id}/`, // Will append ID dynamically
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/agentsapp/instruction/`, // Will append ID dynamically
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  faqs: {
    all: {
      url: `${BASE_URL}/adminapp/faqs/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  filemanager: {
    list: {
      url: `${BASE_URL}/filemanager/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    list_all: {
      url: `${BASE_URL}/filemanager/list_all`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    upload: {
      url: `${BASE_URL}/filemanager/upload/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    download: {
      url: `${BASE_URL}/filemanager/download/`, // single file
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    delete: {
      url: (id) => `${BASE_URL}/filemanager/${id}/`, // delete item
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    // download_zip: {
    //   url: `${BASE_URL}/filemanager/download-zip/`, // multiple files
    //   method: CONSTANT.POST,
    //   isAuthenticated: true,
    // },
    create_folder: {
      url: `${BASE_URL}/filemanager/create-folder/`, // multiple files
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  smartDrive: {
    list: {
      url: `${BASE_URL}/filemanager/smart-drivers-list`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  tokenUsage: {
    get: {
      url: `${BASE_URL}/api/ai-usage-summary/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  summaryReport: {
    send_now: {
      url: `${BASE_URL}/account/alerts/summary_send/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/account/user/alerts/summary/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/account/user/alerts/summary/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/account/user/alerts/summary/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/account/user/alerts/summary/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  voiceai: {
    getScaling: {
      url: `${BASE_URL}/voice-ai/agent-life-cycle`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    updateScaling: {
      url: (id) => `${BASE_URL}/voice-ai/agent-life-cycle/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    createScaling: {
      url: `${BASE_URL}/voice-ai/agent-life-cycle/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  invoiceReport: {
    get: {
      url: `${BASE_URL}/account/user/alerts/invoice/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/account/user/alerts/invoice/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/account/user/alerts/invoice/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/account/user/alerts/invoice/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  agentConfig: {
    get: {
      url: `${BASE_URL}/agents/list/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/agents/save/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    analyzeFiles: {
      url: `${BASE_URL}/voice-ai/analyze-files/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/agents/update`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/agents/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  minutesOfMeeting: {
    create: {
      url: `${BASE_URL}/minutes-of-meeting/minutes/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/minutes-of-meeting/minutes/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/minutes-of-meeting/minutes/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/minutes-of-meeting/minutes/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    getById: {
      url: (id) => `${BASE_URL}/minutes-of-meeting/minutes/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },

  providerForAppointments: {
    getById: {
      url: (id) => `${BASE_URL}/patient/provider/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    put: {
      url: (id) => `${BASE_URL}/patient/provider/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
  },
  paperEob: {
    create: {
      url: `${BASE_URL}/encounter/papereob/upload`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },

  paymentPosting: {
    createLedger: {
      url: `${BASE_URL}/payment/ledger/claim/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    createeob: {
      url: `${BASE_URL}/payment/payment-eobs/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    put: {
      url: (id) => `${BASE_URL}/payment/payments/${id}`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },

    create: {
      url: `${BASE_URL}/payment/payments/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    get: {
      url: `${BASE_URL}/payment/payments/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    get_claims: {
      url: `${BASE_URL}/payment/patient-search/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    get_payment_claims: {
      url: `${BASE_URL}/payment/Patient-EOB-details/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    get_payment: {
      url: (id) => `${BASE_URL}/payment/payments/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },

  patientForAppointments: {
    get: {
      url: `${BASE_URL}/patient/patient/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getminimalPatients: {
      url: `${BASE_URL}/patient/patients-list/minimal/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getById: {
      url: (id) => `${BASE_URL}/patient/patients/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/patient/patients/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    put: {
      url: (id) => `${BASE_URL}/patient/patients/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  userpms: {
    create: {
      url: `${BASE_URL}/account/create-user/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    getusers: {
      url: `${BASE_URL}/account/client/users/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    deleteuser: {
      url: (id) => `${BASE_URL}/account/client/users/${id}/`, // Will append ID dynamically
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    edituser: {
      url: (id) => `${BASE_URL}/account/client/users/${id}/`, // Will append ID dynamically
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  patientLedger: {
    ledger: {
      url: (id) => `${BASE_URL}/payment/patients/${id}/ledgers/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  providersForAppointments: {
    get: {
      url: `${BASE_URL}/patient/provider/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getminimalProviders: {
      url: `${BASE_URL}/patient/providers-list/minimal/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getProviderAvailability: {
      url: `${BASE_URL}/patient/providers-availability/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  appointments: {
    get: {
      url: `${BASE_URL}/patient/appointment/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/patient/appointment/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/patient/appointment/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    getById: {
      url: (id) => `${BASE_URL}/patient/appointment/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    delete: {
      url: (id) => `${BASE_URL}/patient/appointment/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
    runEligibilityCheck: {
      url: `${BASE_URL}/patient/appoinment-eligibility-check/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    getCheckIn: {
      url: `${BASE_URL}/patient/appointment_multi/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getByPatientId: {
      url: (patientId) =>
        `${BASE_URL}/patient/appointments/patient/${patientId}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  pmsDashboard: {
    analytics: {
      url: `${BASE_URL}/patient/dashboard-analytics/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  patient: {
    eligibilityCheck: {
      url: `${BASE_URL}/stedi/proxy/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    payers: {
      url: `${BASE_URL}/stedi/proxy/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    minimal_patients: {
      url: `${BASE_URL}/patient/minimal/patients`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    patientDocumentUpload: {
      url: `${BASE_URL}/patient/upload-documents/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    patientDocumentsUpload: {
      url: `${BASE_URL}/patient/documents-process/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    getPatientDocumentsById: {
      url: (id) => `${BASE_URL}/patient/documents-process/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    updatePatientDocuments: {
      url: (id) => `${BASE_URL}/patient/documents-process/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    deletePatientDocument: {
      url: (id) => `${BASE_URL}/patient/documents-process/${id}/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  claimsubmission: {
    getClaims: {
      url: `${BASE_URL}/claims/claims-api/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    postclaim: {
      url: `${BASE_URL}/claims/get-837-file/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    getById: {
      url: (id) => `${BASE_URL}/claims/encounter-service-lines/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  encounter: {
    getEncounters: {
      url: `${BASE_URL}/encounter/encounters/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    getEncounterById: {
      url: (id) => `${BASE_URL}/encounter/encounters/${id}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    fetchFeeSchedule: {
      url: `${BASE_URL}/encounter/fee-schedule-list/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    autoFillEncounter: {
      url: `${BASE_URL}/encounter/appointment-autofill/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    updateEncounterById: {
      url: (id) => `${BASE_URL}/encounter/encounters/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    createEncounter: {
      url: `${BASE_URL}/encounter/encounters/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    statusUpdate: {
      url: `${BASE_URL}/encounter/encounters-status-change/bulk-submit/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    billingAnalytics: {
      url: `${BASE_URL}/encounter/analytics/billing/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  meetingChat: {
    getMessages: {
      url: (meetingId) => `${BASE_URL}/meetings/chat/${meetingId}/messages/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    sendMessage: {
      url: `${BASE_URL}/meetings/chat/send/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    deleteMessage: {
      url: (messageId) =>
        `${BASE_URL}/meetings/chat/message/${messageId}/delete/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  meetingAudio: {
    start: {
      url: `${BASE_URL}/meetings/audio/start/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    join: {
      url: `${BASE_URL}/meetings/audio/join/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    mute: {
      url: `${BASE_URL}/meetings/audio/mute/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    end: {
      url: `${BASE_URL}/meetings/audio/end/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    getStatus: {
      url: (meetingId) => `${BASE_URL}/meetings/audio/${meetingId}/status/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    getHistory: {
      url: (meetingId) => `${BASE_URL}/meetings/audio/${meetingId}/history/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  meetingScreenShare: {
    start: {
      url: `${BASE_URL}/meetings/screenshare/start/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    stop: {
      url: `${BASE_URL}/meetings/screenshare/stop/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    getStatus: {
      url: (meetingId) =>
        `${BASE_URL}/meetings/screenshare/${meetingId}/status/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    getHistory: {
      url: (meetingId) =>
        `${BASE_URL}/meetings/screenshare/${meetingId}/history/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  meetingRecording: {
    start: {
      url: `${BASE_URL}/meetings/recording/start/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    stop: {
      url: `${BASE_URL}/meetings/recording/stop/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    pause: {
      url: `${BASE_URL}/meetings/recording/pause/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    resume: {
      url: `${BASE_URL}/meetings/recording/resume/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    status: {
      url: (recordingId) =>
        `${BASE_URL}/meetings/recording/${recordingId}/status/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    list: {
      url: (meetingId) => `${BASE_URL}/meetings/recording/${meetingId}/list/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    download: {
      url: (recordingId) =>
        `${BASE_URL}/meetings/recording/${recordingId}/download/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    delete: {
      url: (recordingId) =>
        `${BASE_URL}/meetings/recording/${recordingId}/delete/`,
      method: CONSTANT.DELETE,
      isAuthenticated: true,
    },
  },
  insuranceCompany: {
    get: {
      url: `${BASE_URL}/practicesettings/insurance-companies/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/insurance-companies/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  insurancePlan: {
    get: {
      url: `${BASE_URL}/practicesettings/insurance-plans/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/insurance-plans/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  insurancePolicy: {
    get: {
      url: `${BASE_URL}/practicesettings/insurance-policies/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/practicesettings/insurance-policies/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  scheduledMeetings: {
    list: {
      url: `${BASE_URL}/scheduled/list/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    start: {
      url: (meetingId) => `${BASE_URL}/scheduled/${meetingId}/start/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    end: {
      url: (meetingId) => `${BASE_URL}/scheduled/${meetingId}/end/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },

    cancel: {
      url: (meetingId) => `${BASE_URL}/scheduled/${meetingId}/cancel/`,
      method: CONSTANT.POST, // or DELETE if your backend uses it
      isAuthenticated: true,
    },
  },
  apiKeys: {
    list: {
      url: `${BASE_URL}/app/project/api-keys/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },

    generate: {
      url: `${BASE_URL}/app/project/api-keys/generate/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  allergies: {
    get: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/allergies/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/clinical-notes/allergies/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (allergyId) => `${BASE_URL}/clinical-notes/allergies/${allergyId}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    profileCreate: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/allergy-profile/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    profileUpdate: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/allergy-profile/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    profileGet: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/allergy-profile/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  sftp: {
    create: {
      url: `${BASE_URL}/claims/settings/sftp/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    get: {
      url: `${BASE_URL}/claims/settings/sftp/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    patch: {
      url: (id) => `${BASE_URL}/claims/settings/sftp/${id}/`,
      method: CONSTANT.PATCH,
      isAuthenticated: true,
    },
  },
  problems: {
    get: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/problems/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    put: {
      url: (problemId) => `${BASE_URL}/clinical-notes/problems/${problemId}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/clinical-notes/problems/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  medications: {
    get: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/medications/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/clinical-notes/medications/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/clinical-notes/medications/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
    markAsError: {
      url: (id) => `${BASE_URL}/clinical-notes/medications/${id}/mark-error/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  vitals: {
    get: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/vitals/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/clinical-notes/vitals/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/clinical-notes/vitals/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  labOrders: {
    getByPatient: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/lab-orders/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    create: {
      url: `${BASE_URL}/clinical-notes/lab-orders/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    update: {
      url: (id) => `${BASE_URL}/clinical-notes/lab-orders/${id}/`,
      method: CONSTANT.PUT,
      isAuthenticated: true,
    },
  },
  patientHistory: {
    getByPatient: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/history/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    save: {
      url: `${BASE_URL}/clinical-notes/history/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  clinicalNotes: {
    getAll: {
      url: `${BASE_URL}/clinical-notes/clinical-notes/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    signOff: {
      url: (id) => `${BASE_URL}/clinical-notes/clinical-notes/${id}/sign-off/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    getByAppointment: {
      url: ({ appointmentId, patientId }) =>
        `${BASE_URL}/clinical-notes/clinical-notes/appointment/${appointmentId}/patient/${patientId}/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    saveByAppointment: {
      url: ({ appointmentId, patientId }) =>
        `${BASE_URL}/clinical-notes/clinical-notes/appointment/${appointmentId}/patient/${patientId}/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
    getByPatient: {
      url: (patientId) =>
        `${BASE_URL}/clinical-notes/patients/${patientId}/clinical-notes/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
  },
  paymentsHub: {
    getPatientPayments: {
      url: `${BASE_URL}/payment-process/collect-payment/`,
      method: CONSTANT.GET,
      isAuthenticated: true,
    },
    makePatientPayment: {
      url: `${BASE_URL}/payment-process/collect-payment/`,
      method: CONSTANT.POST,
      isAuthenticated: true,
    },
  },
  voiceAI: {
    mobileNumbers: {
      all: {
        url: `${BASE_URL}/voice-ai/mobile-numbers/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      assign: {
        url: `${BASE_URL}/voice-ai/mobile-numbers/assign/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
      release: {
        url: `${BASE_URL}/voice-ai/mobile-numbers/release/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
    },
    checkout: {
      create: {
        url: `${BASE_URL}/voice-ai/create-checkout-session/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
    },
    agents: {
      create: {
        url: `${BASE_URL}/voice-ai/agents/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
      all: {
        url: `${BASE_URL}/voice-ai/agents/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      id: {
        url: (id) => `${BASE_URL}/voice-ai/agents/${id}/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      update: {
        url: (id) => `${BASE_URL}/voice-ai/agents/${id}/`,
        method: CONSTANT.PUT,
        isAuthenticated: true,
      },
    },
    versions: {
      create: {
        url: `${BASE_URL}/voice-ai/agent-versions/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
      all: {
        url: `${BASE_URL}/voice-ai/agent-versions/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      update: {
        url: (id) => `${BASE_URL}/voice-ai/agent-versions/${id}/`,
        method: CONSTANT.PUT,
        isAuthenticated: true,
      },
      updateStatus: {
        url: (id) => `${BASE_URL}/voice-ai/agent-versions/${id}/`,
        method: CONSTANT.PATCH,
        isAuthenticated: true,
      },
      clone: {
        url: `${BASE_URL}/voice-ai/agent-versions/clone_version/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
    },
    prompts: {
      create: {
        url: `${BASE_URL}/voice-ai/agent-prompts/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
      update: {
        url: (id) => `${BASE_URL}/voice-ai/agent-prompts/${id}/`,
        method: CONSTANT.PATCH,
        isAuthenticated: true,
      },
      id: {
        url: (id) => `${BASE_URL}/voice-ai/agent-prompts/${id}/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
    },
    scripts: {
      create: {
        url: `${BASE_URL}/voice-ai/agent-scripts/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
      update: {
        url: (id) => `${BASE_URL}/voice-ai/agent-scripts/${id}/`,
        method: CONSTANT.PATCH,
        isAuthenticated: true,
      },
      getByVersion: {
        url: `${BASE_URL}/voice-ai/agent-scripts/get_by_version/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      optimize: {
        url: `${BASE_URL}/voice-ai/optimize-script/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
    },
    telephony: {
      create: {
        url: `${BASE_URL}/voice-ai/telephony-settings/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
      all: {
        url: `${BASE_URL}/voice-ai/telephony-settings/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      update: {
        url: (id) => `${BASE_URL}/voice-ai/telephony-settings/${id}/`,
        method: CONSTANT.PUT,
        isAuthenticated: true,
      },
      id: {
        url: (id) => `${BASE_URL}/voice-ai/telephony-settings/${id}/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      getavailablenumbers: {
        url: `${BASE_URL}/voice-ai/contact-number/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      buynumbers: {
        url: `${BASE_URL}/voice-ai/contact-number/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },

      availableNumbers: {
        url: `${BASE_URL}/voice-ai/Retrive-Contant-Number/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      // updateavailableNumbers: {
      //   url: `${BASE_URL}/voice-ai/Retrive-Contant-Number/`,
      //   method: CONSTANT.POST,
      //   isAuthenticated: true,
      // },
    },
    jsonConfig: {
      get: {
        url: `${BASE_URL}/voice-ai/config-json/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      create: {
        url: `${BASE_URL}/voice-ai/config-json/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
      },
      update: {
        url: (id) => `${BASE_URL}/voice-ai/config-json/${id}/`,
        method: CONSTANT.PUT,
        isAuthenticated: true,
      },
    },
    testingOutput: {
      get: {
        url: (id) => `${BASE_URL}/voice-ai/conversation-process/${id}/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      create: {
        url: (id) => `${BASE_URL}/voice-ai/conversation-process/${id}/`,
        method: CONSTANT.POST,
        isAuthenticated: true,
        isMetadataId: true,
      },
    },
    callLogs: {
      all: {
        url: `${BASE_URL}/voice-ai/call-logs/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
    },
    analytics: {
      get: {
        url: (id) => `${BASE_URL}/voice-ai/analytics/${id}/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      totalDuration: {
        url: (id) => `${BASE_URL}/voice-ai/analytics/${id}/total-duration/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
      historicalSpend: {
        url: (id) => `${BASE_URL}/voice-ai/analytics/${id}/historical-spend/`,
        method: CONSTANT.GET,
        isAuthenticated: true,
      },
    },
  },
};
