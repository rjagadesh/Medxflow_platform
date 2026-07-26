import { useState } from "react";
import { useProviderList } from "../utils/get-provider";
import ListLayout from "./Components/ListLayout";
import { parseAsString } from "nuqs";
import { useQueryStates } from "nuqs";
import { Button, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useGetProviders } from "@/hooks/query/pms/pms_appointments/useGetProviders";

const title = "PROVIDER";

const profile = [
  { key: "email", label: "Email" },
  { key: "zipcode", label: "Zipode" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
];

const filtersConfig = [
  { accessor_key: "name", title: "Name" },
  { accessor_key: "practice_name", title: "Practice" },
];

export default function ProviderListView() {
  const [selectedItem, setSelectedItem] = useState(null);

  const [queryParams, setQueryParams] = useQueryStates({
    name: parseAsString.withDefault(""),
    practice_name: parseAsString.withDefault(""),
    clicked: parseAsString.withDefault("0"),
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
  });

  const navigate = useNavigate();

  const columns = [
    { accessor_key: "first_name", title: "First Name" },
    { accessor_key: "last_name", title: "Last Name" },
    { accessor_key: "practice_name", title: "Practice" },
    {
      accessor_key: "action",
      title: "Actions",
      tableProps: { display: "flex", justifyContent: "center" },

      render: (_, row) => (
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
              navigate("/pms/platform/provider-profile", {
                state: {
                  SelectedProvider: row,
                  from: "Provider",
                },
              });
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
              navigate(`/pms/home/provider/edit/${row.id}`);
            }}
          >
            Edit
          </Button>
        </Flex>
      ),
    },
  ];

  const { data, isLoading, isPlaceholderData } = useGetProviders(queryParams);

  return (
    <ListLayout
      selectedItem={selectedItem}
      setSelectedItem={setSelectedItem}
      title="PROVIDER"
      columns={columns}
      data={data?.results ?? []}
      filters={filtersConfig}
      controlledFilters={queryParams}
      onFiltersChange={setQueryParams}
      loading={isLoading || isPlaceholderData}
      pagination={{
        count: data?.count ?? 0,
        page: queryParams.page,
        page_size: queryParams.page_size,
        onPageChange: (page) => setQueryParams((prev) => ({ ...prev, page })),
      }}
    />
  );
}
