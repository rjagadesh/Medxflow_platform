import CustomAvatar from "@/components/avatar/avatar";
import GenericTable from "@/components/table/table";
import { useGetColumnSettingsByTableName } from "@/hooks/query/admin/useGetColumnSettingsByTableName";
import { Tag } from "@chakra-ui/react";
import { useMemo } from "react";

export default function ClaimsProcessingRequests() {
  const { data = {} } = useGetColumnSettingsByTableName();
  const columnsData = data?.[0]?.columns;
  const activeColumns = columnsData?.filter((col) => col.active);
  console.log("data11", data);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "High":
        return "ri-arrow-up-line text-red-500";
      case "Medium":
        return "ri-subtract-line text-yellow-500";
      case "Low":
        return "ri-arrow-down-line text-green-500";
      default:
        return "ri-subtract-line text-gray-500";
    }
  };

  const dummy_data = [
    {
      full_name: "John Doe",
      date_of_birth: "1985-02-15",
      gender: "Male",
      patient_id_or_account_number: "A123456",
      rendering_provider_name_npi: "Dr. Alice Smith, NPI: 1234567890",
      facility_name_address:
        "Sunrise Clinic, 123 Main St, Springfield, IL 62704",
      primary_secondary_insurance: "Blue Cross / Aetna",
      policy_number: "BC123456789",
      group_number: "GRP987654",
      payer_id: "12345",
      dates_of_service: "2025-08-10",
      pos_code: "11",
      type_of_service: "Consultation",
      icd10_codes: "E11.9",
      cpt_hcpcs_codes: "99213",
      billed_amount: "$150.00",
      units_of_service: 1,
      revenue_codes: "0450",
    },
    {
      full_name: "Jane Smith",
      date_of_birth: "1990-11-30",
      gender: "Female",
      patient_id_or_account_number: "B654321",
      rendering_provider_name_npi: "Dr. Bob Johnson, NPI: 2345678901",
      facility_name_address:
        "HealthFirst Center, 789 Health Ln, Chicago, IL 60616",
      primary_secondary_insurance: "UnitedHealthcare / None",
      policy_number: "UH789654321",
      group_number: "GRP123456",
      payer_id: "54321",
      dates_of_service: "2025-08-11",
      pos_code: "22",
      type_of_service: "Follow-up Visit",
      icd10_codes: "I10",
      cpt_hcpcs_codes: "99214",
      billed_amount: "$200.00",
      units_of_service: 1,
      revenue_codes: "0510",
    },
    {
      full_name: "Michael Brown",
      date_of_birth: "1975-07-20",
      gender: "Male",
      patient_id_or_account_number: "C789012",
      rendering_provider_name_npi: "Dr. Emily Wang, NPI: 3456789012",
      facility_name_address:
        "Wellness Center, 456 Oak Dr, Naperville, IL 60540",
      primary_secondary_insurance: "Cigna / Medicare",
      policy_number: "CI456123789",
      group_number: "GRP567890",
      payer_id: "67890",
      dates_of_service: "2025-08-12",
      pos_code: "23",
      type_of_service: "Surgery",
      icd10_codes: "K35.80",
      cpt_hcpcs_codes: "44950",
      billed_amount: "$4,500.00",
      units_of_service: 1,
      revenue_codes: "0360",
    },
  ];

  const columns = useMemo(() => {
    return (
      activeColumns?.map((col) => ({
        title: col.name,
        accessor_key: col.id,
      })) || []
    );
  }, [activeColumns]);

  console.log("columns121", columns, activeColumns);

  return (
    <>
      <GenericTable
        title="Requests"
        columns={columns}
        // columnSettings={data?.[0]}
        data={dummy_data}
      />
    </>
  );
}
