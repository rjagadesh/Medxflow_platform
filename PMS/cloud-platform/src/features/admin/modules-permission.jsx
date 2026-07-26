import CustomButton from "@/components/button/button";
import { Box } from "@chakra-ui/react";
import PermissionModal from "./modal/permission";
import { useState } from "react";
import GenericTable from "@/components/table/table";
import { useGetModulePermission } from "@/hooks/query/admin/useGetModulePermission";
import UnauthorizedPage from "@/pages/unauthorized";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";

const routesIds = {
  "settings-data-settings": "Data Settings",
  "settings-agent-secret-keys": "Agent secret keys",
  "settings-api-secret-key": "API secret keys",
  "admin-role": "Role Management",
  "admin-column-settings": "Column settings",
  "admin-license-management": "License management",
  "admin-audit-logs": "Audit Logs",
  "admin-billing-view": "Billing view",
  "roi-estimation": "Roi Estimation",
  "roi-actual": "ROI Actual",
  "aba-trigger": "Aba Trigger",
  "aba-workspace": "ABA Workspace",
  "aba-asset": "ABA Asset",
  "aba-machine": "ABA Machine",
  "menu-monitoring-hide": "Monitoring(hide)",
  "menu-agentFlow-hide": "AgentFlow(hide)",
  "menu-roi-hide": "ROI(hide)",
  "menu-settings-hide": "Settings(hide)",
  "menu-admin-hide": "Admin(hide)",
  "menu-help-hide": "Help(hide)",
};

const ModulesPermission = () => {
  const { hasPermission } = usePermissions();
  const {
    data: modules,
    isLoading,
    isPlaceholderData,
  } = useGetModulePermission();
  const [modalState, setModalState] = useState({
    open: false,
    mode: "add", // add or edit
    initialValues: {},
  });

  console.log("modules", modules);

  const columns = [
    {
      title: "User",
      accessor_key: "user_data",
      render: (user) => user?.first_name + " " + user?.last_name || "N/A",
    },
    {
      title: "Permissions",
      accessor_key: "module_permissions",
      render: (module_permissions) =>
        module_permissions?.map((p, index) => (
          <>
            {p.module_data?.module_name ? (
              <>
                <span>{p.module_data?.module_name} - </span>
                <span className="text-gray-400">{p.module_data?.app_name}</span>
              </>
            ) : (
              <>
                <span>{routesIds[p.module]}</span>
              </>
            )}

            {index !== module_permissions.length - 1 && ", "}
          </>
        )) || "N/A",
    },
    {
      title: "Action",
      render: (_, rowData) => (
        <>
          <CustomButton
            onClick={() => {
              setModalState({
                open: true,
                mode: "edit",
                initialValues: rowData,
              });
            }}
          >
            Edit
          </CustomButton>
        </>
      ),
      tableProps: { "data-sticky": "end" },
    },
  ];

  console.log("modalState1213", modalState);

  if (!hasPermission("module_permissions", "view")) {
    return <UnauthorizedPage />;
  }

  return (
    <Box pt="8">
      <GenericTable
        title={"Module Permissions"}
        columns={columns}
        rightAction={
          <>
            <CustomButton
              onClick={() => {
                setModalState({ open: true, mode: "add", initialValues: {} });
              }}
            >
              Add Permission
            </CustomButton>
          </>
        }
        data={modules}
        headerLoading={false}
        count={modules.length}
        loader={isLoading}
        isPlaceholderData={isPlaceholderData}
      />

      <PermissionModal
        open={modalState.open}
        onOpenChange={(v) => {
          if (v) {
            setModalState((prev) => ({ ...prev, open: v }));
          } else {
            setModalState({ open: false, mode: "add", initialValues: {} });
          }
        }}
        initialValues={modalState.initialValues}
        mode={modalState.mode}
      />
    </Box>
  );
};

export default ModulesPermission;
