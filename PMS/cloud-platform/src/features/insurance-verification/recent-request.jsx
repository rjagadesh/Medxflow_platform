import CustomAvatar from "@/components/avatar/avatar";
import GenericTable from "@/components/table/table";
import { useGetColumnSettingsByTableName } from "@/hooks/query/admin/useGetColumnSettingsByTableName";
import { Tag } from "@chakra-ui/react";

export default function RecentRequestsInsuranceVerification() {
  const { data = {} } = useGetColumnSettingsByTableName({
    table_name: "patient_requests",
  });

  const columns = [
    {
      title: "Name",
      accessor_key: "name",
      render: (name, row) => {
        console.log("row1212", row);
        return (
          <div className="flex items-center gap-x-4">
            <CustomAvatar name={row.name} />
            <div>
              <div className="font-medium text-gray-300">{row.name}</div>
              <div className="text-xs text-gray-400">{row.phone_number}</div>
            </div>
          </div>
        );
      },
    },
    { title: "DOB", accessor_key: "date_of_birth" },
    {
      title: "Address",
      accessor_key: "postal_address",
      render: (address, row) => (
        <div>
          <div className="text-xs">{row.postal_address}</div>
          <div className="text-xs">{row.postal_code}</div>
        </div>
      ),
    },
    { title: "Insurance Provider", accessor_key: "ins_provider" },
    { title: "Member Id", accessor_key: "member_id" },
    {
      title: "Provider",
      accessor_key: "provider_npi",
      render: (npi, row) => {
        return (
          <div>
            <div className="text-xs">{row.provider_name}</div>
            <div className="text-xs">{row.provider_npi}</div>
            <div className="text-xs">{row.provider_tax_id}</div>
            <div className="text-xs">{row.provider_address}</div>
          </div>
        );
      },
    },
    { title: "Fax No", accessor_key: "fax_no" },
    { title: "Call duration", accessor_key: "call_duration" },
    {
      title: "Status",
      accessor_key: "status",
      render: (status) => (
        <Tag.Root size="sm" rounded={"full"} colorPalette={"blue"}>
          <Tag.Label>New</Tag.Label>
        </Tag.Root>
      ),
    },
  ];

  const sampleData = [
    {
      name: "John Doe",
      date_of_birth: "1990-01-01",
      postal_address: "123 Main St",
      postal_code: "A1A 1A1",
      phone_number: "123-456-7890",
      ins_provider: "Blue Cross Blue Shield",
      member_id: "1234567890",
      provider_npi: "1234567890",
      provider_tax_id: "1234567890",
      provider_address: "123 Main St",
      provider_name: "John Doe",
      provider: "-",
      fax_no: "123-456-7890",
      call_duration: "00:04:00",
    },
    {
      name: "John Doe",
      date_of_birth: "1990-01-01",
      postal_address: "123 Main St",
      postal_code: "A1A 1A1",
      phone_number: "123-456-7890",
      ins_provider: "Blue Cross Blue Shield",
      member_id: "1234567890",
      provider_npi: "1234567890",
      provider_tax_id: "1234567890",
      provider_address: "123 Main St",
      provider_name: "John Doe",
      provider: "-",
      fax_no: "123-456-7890",
      call_duration: "00:04:10",
    },
    {
      name: "John Doe",
      date_of_birth: "1990-01-01",
      postal_address: "123 Main St",
      postal_code: "A1A 1A1",
      phone_number: "123-456-7890",
      ins_provider: "Blue Cross Blue Shield",
      member_id: "1234567890",
      provider_npi: "1234567890",
      provider_tax_id: "1234567890",
      provider_address: "123 Main St",
      provider_name: "John Doe",
      provider: "-",
      fax_no: "123-456-7890",
      call_duration: "00:14:08",
    },
    {
      name: "John Doe",
      date_of_birth: "1990-01-01",
      postal_address: "123 Main St",
      postal_code: "A1A 1A1",
      phone_number: "123-456-7890",
      ins_provider: "Blue Cross Blue Shield",
      member_id: "1234567890",
      provider_npi: "1234567890",
      provider_tax_id: "1234567890",
      provider_address: "123 Main St",
      provider_name: "John Doe",
      provider: "-",
      fax_no: "123-456-7890",
      call_duration: "00:14:08",
    },
  ];

  return (
    <GenericTable
      title="Recent Requests"
      columns={columns}
      // columnSettings={data?.[0]}
      data={sampleData}
    />
  );
}
