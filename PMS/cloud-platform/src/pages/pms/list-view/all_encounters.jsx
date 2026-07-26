// src/pages/AllEncounters.jsx

import { parseAsString, useQueryStates } from "nuqs";
import { useGetEncounters } from "@/hooks/query/pms/encounter/useGetEncounters";
import { formatDate } from "@/utils/helper";
import ListLayout from "./Components/ListLayout";

// Map raw encounter status values to display labels
const getStatusLabel = (status) => {
  if (!status) return "—";
  const s = status.toLowerCase();
  if (s === "ready") return "Reviewed";
  if (s === "accepted") return "Approved";
  if (s === "draft") return "Draft";
  if (s === "unpayable") return "Un Payable";
  if (s === "not_started") return "Not Started";
  if (s === "submitted") return "Submitted";
  return status;
};

const fullName = (p) =>
  p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "—" : "—";

// Columns shown in the table (mapped to the real /encounter/encounters/ response)
const columns = [
  {
    accessor_key: "encounter_number",
    title: "Encounter ID",
    render: (v) => v || "—",
  },
  {
    accessor_key: "encounter_from_date",
    title: "Date of Service",
    render: (v) => (v ? formatDate(v) : "—"),
  },
  {
    accessor_key: "patient",
    title: "Patient Name",
    render: (patient) => fullName(patient),
  },
  {
    accessor_key: "rendering_provider",
    title: "Rendering Provider",
    render: (provider) => fullName(provider),
  },
  {
    accessor_key: "primary_insurance",
    title: "Primary Insurance",
    render: (ins) => ins?.name || "—",
  },
  {
    accessor_key: "total_charges",
    title: "Total Charges",
    render: (amount) => (amount ? `$${parseFloat(amount).toFixed(2)}` : "$0.00"),
  },
  {
    accessor_key: "status",
    title: "Encounter Status",
    render: (status) => getStatusLabel(status),
  },
];

// Filters row at the top
const filterDefs = [
  { accessor_key: "search", title: "Search Patient / Encounter" },
  { accessor_key: "status", title: "Status" },
];

// Page component
export default function AllEncounters() {
  const [queryParams, setQueryParams] = useQueryStates({
    search: parseAsString.withDefault(""),
    status: parseAsString.withDefault(""),
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
  });

  const { data, isLoading, isPlaceholderData } = useGetEncounters(queryParams);

  return (
    <ListLayout
      title="ALL ENCOUNTERS"
      columns={columns}
      data={data?.results ?? []}
      filters={filterDefs}
      controlledFilters={queryParams}
      onFiltersChange={setQueryParams}
      loading={isLoading || isPlaceholderData}
      profile={[]} // no side profile panel for encounters
      pagination={{
        count: data?.count ?? 0,
        page: queryParams.page,
        page_size: queryParams.page_size,
        onPageChange: (page) => setQueryParams((prev) => ({ ...prev, page })),
      }}
    />
  );
}
