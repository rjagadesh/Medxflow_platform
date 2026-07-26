import { useState, useMemo } from "react";
import { Box, Heading, HStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";

import CustomButton from "@/components/button/button";

import ProfilePreviewCard from "./ProfilePreviewCard";
import FiltersBar from "./FiltersBar";
import GenericTable from "@/components/table/table";
import Searchbar from "./searchbar";
import { parseAsString, useQueryStates } from "nuqs";

export default function ListLayout({
  selectedItem: controlledSelectedItem,
  setSelectedItem: controlledSetSelectedItem,
  title,
  columns,
  filters: filterDefs,
  data,
  profile = [],
  controlledFilters = null,
  onFiltersChange = null,
  statusFilter,
  setStatusFilter,
  statusOptions,
  selection,
  pagination = {
    count: 0,
    page: 1,
    page_size: 10,
    onPageChange: () => {},
  },
  options = {},
  loading = false,
  actionOption,
}) {
  const [internalSelectedItem, setInternalSelectedItem] = useState(null);

  // Internal filter state fallback
  const [internalFilters, setInternalFilters] = useState({});
  const [query, setQuery] = useQueryStates({
    ordering: parseAsString.withDefault(""),
  });

  const selectedItem =
    controlledSelectedItem !== undefined
      ? controlledSelectedItem
      : internalSelectedItem;

  const setSelectedItem = controlledSetSelectedItem ?? setInternalSelectedItem;

  const profileNotNeeded = [
    "TASK LIST",
    "INSURANCE COLLECTIONS",
    "UNSIGNED NOTES",
    "BILLING INSURANCE COLLECTIONS",
    "ALL PATIENT",
    "PAYMENTS",
    "PAPER EOB SCANNING & 835 CONVERSION",
  ];

  /**
   * Decide which filters to use:
   * - If parent passed `controlledFilters`, use them.
   * - If not, use internal state.
   */
  const filters = controlledFilters ?? internalFilters;

  const setFilters = onFiltersChange ?? setInternalFilters;

  /**
   * Create Button Logic
   */
  const createButtons = useMemo(
    () => ({
      Patients: { "Create Patient": "/pms/home/patients/create" },
      PROVIDER: { "Create Provider": "/pms/home/providers/create" },
      "TASK LIST": { "Create Task": "/pms/home/providers/task" },
      "ALL APPOINTMENTS": {
        "Create Appointments": "/pms/analytics/appointments/create_appointment",
      },
      "ALL ENCOUNTERS": {
        "Create Encounters": "/pms/analytics/encounters/create_encounters",
      },
      Payouts: {
        "Create Payouts": "/pms/analytics/payments/create_payouts",
      },
    }),
    [],
  );

  // Some modules like "PATIENT COLLECTIONS" may not have a create button
  const currentButton = createButtons[title] || null;

  let btnLabel = null;
  let btnUrl = null;

  if (currentButton) {
    const entry = Object.entries(currentButton)[0];
    if (entry) {
      btnLabel = entry[0];
      btnUrl = entry[1];
    }
  }
  const onSortChange = (v) => {
    console.log("00000v", v);
    setQuery((prev) => ({
      ...prev,
      ordering: v,
    }));
  };

  return (
    <>
      <Box w="100%" p={3} borderRadius="8px" bg="#202020c2" color="white">
        {title === "CLAIM SUBMISSION" && options && <Searchbar {...options} />}

        {/* HEADER SECTION */}
        <HStack justify="space-between" mb={3}>
          {/* Create button only if we have a URL */}
          {filterDefs?.length > 0 && (
            <FiltersBar
              filterDefs={filterDefs}
              filters={filters}
              setFilters={setFilters}
            />
          )}
          {btnUrl && (
            <Link to={btnUrl}>
              <CustomButton>{btnLabel}</CustomButton>
            </Link>
          )}
          {/* <CustomButton>Create 837</CustomButton> */}
        </HStack>

        {/* PROFILE PREVIEW */}
        {selectedItem && !profileNotNeeded.includes(title) && (
          <ProfilePreviewCard
            title={title}
            item={selectedItem}
            profile={profile}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {/* MAIN TABLE */}
        <GenericTable
          columns={columns}
          data={data || []}
          count={pagination?.count || data?.length}
          onRowClick={(item) => {
            setSelectedItem(item);
            document.getElementById("profile-preview-card")?.scrollIntoView({
              behavior: "smooth",
            });
          }}
          title={title}
          loader={loading}
          page={pagination.page || 1}
          onPageChange={(v) => {
            pagination.onPageChange(v);
          }}
          sort={query.ordering}
          onSortClick={onSortChange}
          selection={selection}
          bodyHeight={{
            base: "calc(100vh - 350px)",
            "2xl": "calc(100vh - 350px)",
            "3xl": "calc(100vh - 370px)",
          }}
          actionOption={actionOption}
        />
      </Box>
      {title === "CLAIM SUBMISSION" && (
        <HStack spacing={4} mt="2">
          <Link to="/pms/encounter/create">
            <CustomButton variant="outline">Open</CustomButton>
          </Link>
          <CustomButton variant="outline">Action</CustomButton>
          <CustomButton variant="outline">Print Claims</CustomButton>
          <Link to="/pms/encounter/submit-claims">
            <CustomButton variant="outline">Submit E-Claims</CustomButton>
          </Link>
          <CustomButton variant="outline">Send Statements</CustomButton>
        </HStack>
      )}
    </>
  );
}
