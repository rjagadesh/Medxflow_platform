import { useState } from "react";
import ListLayout from "./Components/ListLayout";
import { parseAsString } from "nuqs";
import { useQueryStates } from "nuqs";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import CustomButton from "@/components/button/button";
import { useGetPayments } from "@/hooks/mutation/pms/payment/useGetPayement";

const title = "PAYMENTS";

export default function PaymentListView() {
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  const [queryParams, setQueryParams] = useQueryStates({
    insurance: parseAsString.withDefault(""),
    payment_type: parseAsString.withDefault(""),
    reference_number: parseAsString.withDefault(""),
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
  });

  function formatDateToMMDDYYYY(value) {
    if (!value || typeof value !== "string") return "";

    const parts = value.split("-");
    if (parts.length !== 3) return "";

    const [yyyy, mm, dd] = parts;
    return `${mm}-${dd}-${yyyy}`;
  }

  const { data, isLoading, isPlaceholderData } = useGetPayments(queryParams);

  const PAYMENT_DATA = data?.results;
  console.log("THSIS IS THE DATA", PAYMENT_DATA);

  /**
   * Filters
   */
  const filtersConfig = [
    { accessor_key: "insurance", title: "insurance" },
    { accessor_key: "payment_type", title: "Payer Type" },
    { accessor_key: "reference_number", title: "Ref #" },
  ];
  /**
   * Columns
   */
  const columns = [
    // { accessor_key: "id", title: "ID #" },
    { accessor_key: "reference_number", title: "Ref #" },
    { accessor_key: "batch_number", title: "Batch #" },
    { accessor_key: "created_at", title: "Post Date" },
    { accessor_key: "payer_name", title: "Payer Name" },
    // { accessor_key: "insurance", title: "insurance" },
    { accessor_key: "notes", title: "notes" },
    {
      accessor_key: "total_amount",
      title: "Payment",
      render: (value) =>
        value != null && (
          <Text color={"green.400"}>${Number(value).toFixed(2)}</Text>
        ),
    },
    // {
    //   accessor_key: "unapplied",
    //   title: "Unapplied",
    //   render: (value) =>
    //     value != null && (
    //       <Text color={value > 0 ? "orange.400" : "gray.400"}>
    //         ${Number(value).toFixed(2)}
    //       </Text>
    //     ),
    // },

    {
      accessor_key: "action",
      title: "Actions",
      render: (_, row) => (
        <Flex justify="left" gap={2}>
          <Button
            size="xs"
            bg="#00afef88"
            color="white"
            borderRadius="20px"
            px={4}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/pms/encounter/payments/create/", {
                state: { row: row },
              });
            }}
          >
            View
          </Button>
        </Flex>
      ),
    },
  ];

  return (
    <>
      <ListLayout
        title={title}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        columns={columns}
        data={PAYMENT_DATA}
        filters={filtersConfig}
        controlledFilters={queryParams}
        onFiltersChange={setQueryParams}
        loading={false}
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
      />
      <Box mt="10px">
        <Link to="/pms/encounter/payments/create/">
          <CustomButton variant="outline">Create Payment</CustomButton>
        </Link>
      </Box>
    </>
  );
}
