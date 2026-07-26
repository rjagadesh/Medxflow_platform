import React from "react";
import { useGetLicenseDetails } from "@/hooks/query/admin/useGetLicenseOverview";
import GenericTable from "@/components/table/table";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import UnauthorizedPage from "@/pages/unauthorized";

export default function LicenseManagement() {
  const { data, isLoading } = useGetLicenseDetails();

  const { hasPermission } = usePermissions();

  const columns = [
    {
      title: "Plan",
      accessor_key: "license_tier",
    },
    {
      title: "Dev Seats",
      accessor_key: "dev_count",
    },
    {
      title: "Prod Seats",
      accessor_key: "prod_count",
    },
    {
      title: "Generated On",
      accessor_key: "created_date",
      render: (created_date) => new Date(created_date).toLocaleDateString(),
    },
    {
      title: "Expiry",
      accessor_key: "end_date",
      render: (end_date) => (
        <div>{new Date(end_date).toLocaleDateString()}</div>
      ),
    },
    {
      title: "Client Name",
      accessor_key: "client_name",
    },
    {
      title: "Client Id",
      accessor_key: "client_id",
    },
    {
      title: "Status",
      render: (_, data) => (
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            color: "white",
            backgroundColor: data?.status === "active" ? "green" : "red",
          }}
        >
          {data?.status}
        </span>
      ),
    },
  ];

  if (!hasPermission("licensing_subscription", "view")) {
    return <UnauthorizedPage />;
  }

  console.log("data121212", data);

  return (
    <div className="pt-8">
      <GenericTable
        columns={columns || []}
        data={[data]}
        count={[data].length}
        loader={isLoading}
        headerLoading={false}
        pagination={false}
        title={"Subscription & Licensing"}
      />
    </div>
  );
}
