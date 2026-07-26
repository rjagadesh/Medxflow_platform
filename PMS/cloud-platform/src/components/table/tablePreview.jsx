import { Dialog } from "@chakra-ui/react";
import GenericTable from "./table";
import { useMemo } from "react";

const dummy_data = [
  {
    full_name: "John Doe",
    date_of_birth: "1985-02-15",
    gender: "Male",
    patient_id_or_account_number: "A123456",
    rendering_provider_name_npi: "Dr. Alice Smith, NPI: 1234567890",
    facility_name_address: "Sunrise Clinic, 123 Main St, Springfield, IL 62704",
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
];
const TablePreviewDialog = ({ open, onClose, getActiveColumns = () => {} }) => {
  const columns = useMemo(() => {
    const activeColumns = getActiveColumns();
    return (
      activeColumns?.map((col) => ({
        title: col.name,
        accessor_key: col.id,
      })) || []
    );
  }, [getActiveColumns]);

  console.log("column98787s", columns, getActiveColumns());

  return (
    <Dialog.Root size={"cover"} open={open} onOpenChange={onClose}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title m={0}>Table Preview</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <GenericTable
              title="Requests"
              columns={columns}
              // columnSettings={data?.[0]}
              data={dummy_data}
            />
          </Dialog.Body>
          <Dialog.Footer />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default TablePreviewDialog;
