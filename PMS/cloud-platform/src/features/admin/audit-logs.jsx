import CustomButton from "@/components/button/button";
import GenericTable from "@/components/table/table";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { useGetAudit } from "@/hooks/query/admin/useGetAudit";
import UnauthorizedPage from "@/pages/unauthorized";
import { Badge, Text } from "@chakra-ui/react";
import { formatDate } from "date-fns";
import { Download } from "lucide-react";

const AuditLogs = () => {
  const { hasPermission } = usePermissions();

  // const {data, isError} = useGetAudit();
  const { data, isLoading, isError } = useGetAudit();
  // const { data, isLoading, isError } = useGetAudit();

  console.log(data);

  const columns = [
    {
      title: "Date",
      accessor_key: "created_at",
      render: (date) => formatDate(date, "MMM dd, yyyy hh:mm:ss a"),
    },
    { title: "User", accessor_key: "user" },
    { title: "Action", accessor_key: "log_type" },
    {
      title: "Status",
      accessor_key: "log_status",
      render: (status) => {
        return (
          <Badge
            className="dark"
            size={{
              base: "md",
              "2xl": "lg",
              "3xl": "lg",
            }}
            variant={"surface"}
            colorPalette={
              status === "failed"
                ? "red"
                : status === "success"
                ? "green"
                : "blue"
            }
            borderRadius={"full"}
            textAlign={"center"}
            textTransform={"capitalize"}
            color={status === "success" ? "green" : "red"}
          >
            {status}
          </Badge>
        );
      },
    },
    { title: "Description", accessor_key: "description" },
  ];

  // ✅ Correct CSV Export
  const handleDownload = () => {
    if (!hasPermission("audit_logs_export_delete", "create")) {
      return;
    }
    const csvRows = [];

    // Headers from columns
    const headers = columns.map((col) => col.title);
    csvRows.push(headers.join(","));

    // Rows from data
    data.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col.accessor_key];
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    });

    // Create CSV Blob
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasPermission("audit_logs_view", "view")) {
    return <UnauthorizedPage />;
  }

  return (
    <div className="pt-8">
      <GenericTable
        columns={columns}
        rightAction={
          <CustomButton leftIcon={<Download />} onClick={handleDownload}>
            Export Logs
          </CustomButton>
        }
        data={data}
        loader={isLoading || isError}
        headerLoading={false}
        pagination={false}
        title="Audit Trail"
        count={data.length}
      />
    </div>
  );
};

export default AuditLogs;
