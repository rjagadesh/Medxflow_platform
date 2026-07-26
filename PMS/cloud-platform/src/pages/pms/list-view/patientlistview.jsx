import { Button, Flex } from "@chakra-ui/react";
import ListLayout from "./Components/ListLayout";
import { useNavigate } from "react-router-dom";
import { useGetPatients } from "@/hooks/query/pms/pms_appointments/useGetPatients";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs";
import { formatDate } from "@/utils/helper";

const filters = [
  {
    accessor_key: "name",
    title: "Name",
    inputProps: {
      type: "text",
    },
  },

  {
    accessor_key: "dob",
    title: "Date of Birth",
    type: "date",
    inputProps: {
      type: "date",
    },
  },
];

const profile = [
  { key: "employment_status", label: "Status" },
  { key: "mobile_phone", label: "Phone" },
  { key: "address", label: "Address" },
];

const title = "Patients";

export default function PatientListView() {
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useQueryStates({
    name: parseAsString.withDefault(""),
    dob: parseAsString.withDefault(null),
    clicked: parseAsString.withDefault(0),
    page: parseAsString.withDefault(1),
    page_size: parseAsString.withDefault(10),
  });
  const { data, isLoading, isPlaceholderData } = useGetPatients({
    ...queryParams,
    dob: queryParams.dob
      ? formatDate(queryParams.dob, "yyyy-MM-dd")
      : undefined,
  });
  const columns = [
    { accessor_key: "first_name", title: "First Name" },
    { accessor_key: "last_name", title: "Last Name" },
    {
      accessor_key: "dob",
      title: "Date of Birth",
      render: (value) => formatDate(value, "MM/dd/yyyy"),
    },
    { accessor_key: "mrn", title: "MRN" },
    { accessor_key: "gender", title: "Gender" },
    { accessor_key: "mobile_phone", title: "Mobile Number" },
    {
      accessor_key: "action",
      title: "Actions",
      tableProps: { display: "flex", justifyContent: "center" },
      render: (_, row) => {
        return (
          <Flex justify="center" gap={3}>
            <Button
              size="xs"
              bg="#00afef88"
              color="white"
              borderRadius="20px"
              px={4}
              _hover={{ opacity: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                if (title === "PROVIDER") {
                  navigate(`/pms/home/provider-profile`);
                } else {
                  navigate(`/pms/home/patients/${row.id}`);
                }
              }}
            >
              View Profile
            </Button>

            <Button
              size="xs"
              bg="#00afef88"
              color="white"
              borderRadius="20px"
              px={4}
              _hover={{ opacity: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/pms/home/patients/edit/${row.id}`);
              }}
            >
              Edit
            </Button>

            <Button
              size="xs"
              bg="#00afef88"
              color="white"
              borderRadius="20px"
              px={4}
              _hover={{ opacity: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate("/pms/home/eligibility-check", {
                  state: row,
                });
              }}
            >
              Check Eligibility
            </Button>
          </Flex>
        );
      },
    },
  ];

  console.log("data12121", data);
  return (
    <ListLayout
      title={title}
      columns={columns}
      filters={filters}
      data={data.results}
      loading={isLoading || isPlaceholderData}
      profile={profile}
      controlledFilters={queryParams}
      onFiltersChange={setQueryParams}
      pagination={{
        count: data.count,
        page: queryParams.page,
        page_size: queryParams.page_size,
        onPageChange: (page) => {
          setQueryParams((prev) => ({
            ...prev,
            page: page,
          }));
        },
      }}
      selection={{
        selectable: false,
      }}
    />
  );
}
