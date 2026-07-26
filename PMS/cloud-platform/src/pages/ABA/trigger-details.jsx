import React, { startTransition } from "react";
import { Stack, Heading, Spinner, Text, Flex, Input } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import GenericTable from "@/components/table/table";
import CustomSelect from "@/components/ui/select";
import { useGetTriggerDetails } from "@/hooks/query/triggers/useGetTriggerDetails";
import { format } from "date-fns";
import getStatusIcon from "@/utils/status-icon";
import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";
import CustomButton from "@/components/button/button";

function TriggerDetails() {
  const { trigger_id } = useParams();

  const [searchParams, setSearchParams] = useQueryStates({
    status: parseAsString.withDefault(""),
    date: parseAsString.withDefault(""),
    filter: parseAsBoolean.withDefault(false),
  });
  const { data, isLoading, refetch } = useGetTriggerDetails(trigger_id, {
    status: searchParams.status,
    date: searchParams.date,
  });

  const triggerItems = Array.isArray(data) && data.length > 0 ? data : [];

  const columns = [
    { title: "ID", accessor_key: "id" },
    { title: "Trigger Name", accessor_key: "trigger_name" },

    {
      title: "Start Date",
      accessor_key: "start_date",
      render: (start_date) => format(start_date, "MMM dd yyyy"),
    },
    {
      title: "End Date",
      accessor_key: "end_date",
      render: (end_date) => format(end_date, "MMM dd yyyy"),
    },
    {
      title: "Exception",
      accessor_key: "exception",
      render: (ex) => ex || "—",
    },
    {
      title: "Created At",
      accessor_key: "created_at",
      render: (date) => format(date, "MMM dd yyyy"),
    },
    {
      title: "Status",
      accessor_key: "status",
      render: (status) => {
        return <>{getStatusIcon(status?.toUpperCase())}</>;
      },
    },
  ];

  // Toggle filters on button click: apply if different, clear if same
  const toggleFilters = () => {
    if (searchParams.filter) {
      setSearchParams({ filter: false, status: "", date: "" });
      setTimeout(() => {
        refetch();
      }, 100);
    } else {
      refetch();
      setSearchParams({ filter: true });
    }
  };

  return (
    <Stack width="full" gap="0">
      <GenericTable
        columns={columns}
        data={triggerItems}
        loader={isLoading}
        rightAction={
          <Flex align="center" ml={3} gap={3}>
            <CustomSelect
              options={[
                { value: "success", label: "Success" },
                { value: "failure", label: "Failure" },
              ]}
              placeholder="Select Status"
              width="180px"
              borderRadius="4px !important"
              borderColor="#2f4d78"
              css={{
                "& button": {
                  height: "44px !important",
                  minHeight: "44px !important",
                  borderRadius: "4px !important",
                  borderColor: "#2f4d78",
                },
              }}
              value={[searchParams.status]}
              onValueChange={(v) => setSearchParams({ status: v?.[0] })}
            />
            <Input
              type="date"
              value={searchParams.date}
              onChange={(e) => setSearchParams({ date: e.target.value })}
              placeholder="Filter by Date"
              width="180px"
              borderColor="#2f4d78"
            />
            <CustomButton onClick={toggleFilters}>
              {searchParams.filter ? "Clear Filter" : "Apply Filter"}
            </CustomButton>
          </Flex>
        }
        headerLoading={false}
        pagination={false}
        title={"Trigger Details"}
        count={triggerItems.length}
      />
    </Stack>
  );
}

export default TriggerDetails;
