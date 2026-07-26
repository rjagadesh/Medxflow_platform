import CustomButton from "@/components/button/button";
import GenericTable from "@/components/table/table";
import CustomSelect from "@/components/ui/select";
import getStatusIcon from "@/utils/status-icon";
import {
  Button,
  HStack,
  Input,
  InputGroup,
  Link,
  Text,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const mockData = [
  {
    id: 1,
    date: "12/02/2024",
    patient: "Drake Maples",
    provider: "SETH BREMYER",
    status: "Submitted to Biller",
    diagnosis_codes: ["F32.A"],
    procedure_codes: ["90837"],
  },
  {
    id: 2,
    date: "12/02/2024",
    patient: "Benjimin Speer",
    provider: "SETH BREMYER",
    status: "Submitted to Biller",
    diagnosis_codes: ["F91.9"],
    procedure_codes: ["90837"],
  },
  {
    id: 3,
    date: "12/02/2024",
    patient: "Khloei Miller",
    provider: "SETH BREMYER",
    status: "Submitted to Biller",
    diagnosis_codes: ["F41.9"],
    procedure_codes: ["90837"],
  },
  {
    id: 4,
    date: "12/02/2024",
    patient: "Aron Slater",
    provider: "MICHAEL HERRIGES",
    status: "Submitted to Biller",
    diagnosis_codes: ["F64.9", "F90.0", "F34.89"],
    procedure_codes: ["96127", "99214"],
  },
  {
    id: 5,
    date: "12/02/2024",
    patient: "Russell Guess",
    provider: "CHYANNE DIX",
    status: "Submitted to Biller",
    diagnosis_codes: ["F33.1", "Z76.0", "F41.1"],
    procedure_codes: ["99213", "96127"],
  },
  {
    id: 6,
    date: "12/02/2024",
    patient: "Miranda Stark",
    provider: "MICHAEL HERRIGES",
    status: "Submitted to Biller",
    diagnosis_codes: ["F43.12", "F40.01", "F33.0"],
    procedure_codes: ["96127", "99214"],
  },
  {
    id: 7,
    date: "12/01/2024",
    patient: "Jace Peppie",
    provider: "SHELBY BROOKS",
    status: "Submitted to Biller",
    diagnosis_codes: ["J45.30", "J31.0", "R09.82"],
    procedure_codes: ["99214"],
  },
  {
    id: 8,
    date: "12/01/2024",
    patient: "Amaya Mcfadden",
    provider: "CHYANNE DIX",
    status: "Approved by Biller",
    diagnosis_codes: ["Z02.79", "Z73.0", "R26.2"],
    procedure_codes: ["99213"],
  },
  {
    id: 9,
    date: "12/01/2024",
    patient: "Marshall Campbell",
    provider: "SETH BREMYER",
    status: "Approved by Biller",
    diagnosis_codes: ["F90.0"],
    procedure_codes: ["90837"],
  },
  {
    id: 10,
    date: "12/01/2024",
    patient: "Benjimin Speer",
    provider: "MICHAEL HERRIGES",
    status: "Approved by Biller",
    diagnosis_codes: ["F91.3", "F90.2"],
    procedure_codes: ["99213"],
  },
];

const Charges = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const columnsData = useMemo(
    () => [
      {
        title: "Date",
        accessor_key: "date",
      },
      {
        title: "Patient",
        accessor_key: "patient",
        render: (value) => (
          <Link color="#00C3FF" textDecoration="underline" href="#">
            {value}
          </Link>
        ),
      },
      {
        title: "Provider",
        accessor_key: "provider",
      },
      {
        title: "Status",
        accessor_key: "status",
        render: (value) => getStatusIcon(value),
      },
      {
        title: "Diagnosis Codes",
        accessor_key: "diagnosis_codes",
        render: (value) => (
          <HStack wrap="wrap">
            {value.map((code, idx) => (
              <Text key={idx} color="gray.400">
                {code}
              </Text>
            ))}
          </HStack>
        ),
      },
      {
        title: "Procedure Codes",
        accessor_key: "procedure_codes",
        // tableProps: { "data-sticky": "end0" },
        render: (value) => (
          <HStack justify="space-between" width="100%">
            <HStack wrap="wrap">
              {value.map((code, idx) => (
                <Text key={idx} color="gray.400">
                  {code}
                </Text>
              ))}
            </HStack>
            <Button size="xs" variant="ghost" color="#00C3FF">
              Open Note
            </Button>
          </HStack>
        ),
      },
      {
        title: "Actions",
        accessor_key: "actions",
        tableProps: { "data-sticky": "end" },
        render: () => {
          return (
            <CustomButton
              onClick={() => {
                navigate(`/pms/billing/charges/1`);
              }}
            >
              Details
            </CustomButton>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.diagnosis_codes.some((c) =>
          c.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        item.procedure_codes.some((c) =>
          c.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter === "" || item.status === statusFilter;
      const matchesProvider =
        providerFilter === "" || item.provider === providerFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [searchTerm, statusFilter, providerFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  return (
    <div>
      <div className="bg-droidal-black-300 rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
            <Text
              as="h2"
              fontSize={{ base: "md", md: "lg" }}
              className="font-semibold text-white"
            >
              Charges
            </Text>

            <div className="flex items-center gap-x-4">
              <InputGroup startElement={<Search size={16} />}>
                <Input
                  size={{ base: "xs", "2xl": "md", "3xl": "lg" }}
                  borderRadius={{ base: "10px", "2xl": "12px", "3xl": "14px" }}
                  borderColor="#2f4d78"
                  color="white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  _placeholder={{ pl: 6 }}
                  paddingLeft="24px"
                />
              </InputGroup>

              <CustomSelect
                options={[
                  { label: "All", value: "" },
                  {
                    label: "Submitted to Biller",
                    value: "Submitted to Biller",
                  },
                  { label: "Approved by Biller", value: "Approved by Biller" },
                ]}
                placeholder="Status"
                borderRadius="4px !important"
                borderColor="#2f4d78"
                size={{ base: "xs", "2xl": "md", "3xl": "lg" }}
                color="white"
                value={[statusFilter]}
                onValueChange={(v) => setStatusFilter(v[0])}
                width="150px"
              />

              <CustomSelect
                options={[
                  { label: "All", value: "" },
                  { label: "SETH BREMYER", value: "SETH BREMYER" },
                  { label: "MICHAEL HERRIGES", value: "MICHAEL HERRIGES" },
                  { label: "CHYANNE DIX", value: "CHYANNE DIX" },
                  { label: "SHELBY BROOKS", value: "SHELBY BROOKS" },
                ]}
                placeholder="Provider"
                borderRadius="4px !important"
                borderColor="#2f4d78"
                size={{ base: "xs", "2xl": "md", "3xl": "lg" }}
                color="white"
                value={[providerFilter]}
                onValueChange={(v) => setProviderFilter(v[0])}
                width="150px"
              />
              <Button
                variant="ghost"
                color="gray.400"
                size="sm"
                onClick={() => {
                  setStatusFilter("");
                  setProviderFilter("");
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </Button>
              <CustomButton
                onClick={() => {
                  navigate(`/pms/billing/new-charge`);
                }}
              >
                Create Charge
              </CustomButton>
            </div>
          </div>
        </div>

        <GenericTable
          columns={columnsData}
          data={paginatedData}
          count={filteredData.length}
          pagination={true}
          page={page}
          onPageChange={setPage}
          selection={{
            selectable: true,
            checkboxProps: {},
            onSelectAllChange: (allRows) => allRows.map((row) => row.id),
            checkPermission: () => true,
            onConfirm: async () => true,
          }}
          bodyHeight={"calc(100vh - 270px)"}
        />
      </div>
    </div>
  );
};

export default Charges;
