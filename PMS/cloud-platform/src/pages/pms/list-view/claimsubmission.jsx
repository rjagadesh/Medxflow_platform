import { ActionBar, Button, HStack } from "@chakra-ui/react";
import ListLayout from "./Components/ListLayout";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CustomButton from "@/components/button/button";
import {
  useGetClaimSubmission,
  useGetClaimSubmissionById,
  useGetClaimSubmissionsByIds,
} from "../encounter/claimSubmission/apifiles/useGetClaimSubmission";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs";
import { ArrowBigDownDash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { filter } from "jszip";

/* ================================
   TABLE COLUMNS
================================ */

const columns = [
  { accessor_key: "encounter", title: "Enc" },
  { accessor_key: "claim_number", title: "Claim ID" },
  { accessor_key: "date_from", title: "Service Date" },
  { accessor_key: "procedure_code", title: "Procedure" },
  { accessor_key: "modifiers", title: "Mod" },
  { accessor_key: "patient_name", title: "Patient" },
  // { accessor_key: "billed_to", title: "Billed To" },
  // { accessor_key: "billed_as", title: "Billed As" },
  {
    accessor_key: "total_charge",
    title: "Charges",
    render: (v) => `$${Number(v || 0).toFixed(2)}`,
  },
  {
    accessor_key: "receipts",
    title: "Receipts",
    render: (v) => `$${Number(v || 0).toFixed(2)}`,
  },
  {
    accessor_key: "balance",
    title: "Balance",
    render: (v) => `$${Number(v || 0).toFixed(2)}`,
  },

  { accessor_key: "status", title: "Status" },
];

/* ================================
   PROFILE VIEW
================================ */

const profile = [
  { key: "id", label: "Claim Id" },
  { key: "patient_name", label: "Patient" },
  { key: "date_from", label: "Service Date" },
  { key: "insurance", label: "Billed To" },
  { key: "billed_as", label: "Billed As" },
  { key: "procedure_code", label: "Procedure" },
];

/* ================================
   SEARCH OPTIONS
================================ */

const searchOptions = [
  { label: "All fields", value: "all" },
  { label: "Patient", value: "patient_name" },
  { label: "Claim ID", value: "claim_number" },
  { label: "Procedure", value: "procedure" },
];

/* ================================
   PAGE
================================ */

function formatDate(yyyyMMdd) {
  if (!yyyyMMdd) return "";
  const [yyyy, mm, dd] = yyyyMMdd.split("-");
  return `${mm}/${dd}/${yyyy}`;
}

export default function ClaimSubmission() {
  const [queryParams, setQueryParams] = useQueryStates({
    clicked: parseAsString.withDefault("0"),
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
  });

  const { data, isLoading } = useGetClaimSubmission(queryParams);

  console.log("DATA", data.count);

  const parseModifiers = (modifiers) => {
    try {
      return Object.values(JSON.parse(modifiers || "{}"))
        .filter(Boolean)
        .join(",");
    } catch {
      return "";
    }
  };
  const flattenClaimsWithLines = (apiResponse) => {
    if (!apiResponse?.results?.length) return [];

    return apiResponse.results.map((e) => ({
      id: e.id,
      claim_number: e.claim_number,
      claim_type: e.claim_type,
      status: e.status,
      encounter: e.encounter_number,
      submitted_at: e.encounter?.submitted_at,
      created_at: e.encounter?.created_at,
      payer_claim_id: e.encounter?.payer_claim_id,
      total_charge: e.charge_amount,
      balance: e.balance_due,
      patient_name: `${e.patient_details?.first_name} ${e.patient_details?.last_name}`,
      date_from: formatDate(e.date_from),
      procedure_code: e.procedure_code,
      modifiers: parseModifiers(e.modifiers),
      billed_to: e.encounter?.primary_insurance,
      charge_amount: e.total_charge,
      encounter_id: e.encounter?.id,
    }));
  };

  const allData = flattenClaimsWithLines(data);
  console.log("ALL DATA", allData);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchIn, setSearchIn] = useState(["all"]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const statusOptions = [
    { label: "All Claims", value: "ALL" },
    { label: "Ready to Print Paper", value: "Ready to Print Paper" },
    {
      label: "Ready for Electronic Statements",
      value: "Ready for Electronic Statements",
    },
    { label: "Rejections", value: "Rejections" },
    { label: "Denials", value: "Denials" },
    { label: "No Response", value: "No Response" },
    { label: "Pending Insurance", value: "Pending Insurance" },
    { label: "Pending Patients", value: "Pending Patients" },
    { label: "Completed", value: "Completed" },
  ];

  /* ================================
     NORMALIZE + FILTER DATA
  ================================ */

  const filteredData = (allData ?? []).filter((item) => item.status !== null);

  console.log("FILTERED", filteredData);
  console.log("FILTERED", filteredData?.count);

  /* ================================
     RENDER
  ================================ */

  return (
    <ListLayout
      title="CLAIM SUBMISSION"
      columns={columns}
      data={filteredData}
      profile={profile}
      loading={isLoading}
      actionOption={{
        extraButton: (
          <>
            <ActionBar.Separator />
            <Button
              color="white"
              _hover={{
                bgColor: "droidalBlack.200",
              }}
              variant="outline"
              size="sm"
              borderRadius={"12px"}
              onClick={() =>
                claimSubmissionPost((encounterIds = { selectionData }))
              }
            >
              <ArrowBigDownDash />
              submit claim
            </Button>
          </>
        ),
      }}
      options={{
        searchTerm,
        setSearchTerm,
        searchIn,
        setSearchIn,
        options: searchOptions,

        statusFilter,
        setStatusFilter,
        statusOptions,

        onSearch: () => {},
        onClear: () => {
          setSearchTerm("");
          setSearchIn(["all"]);
          setStatusFilter("ALL");
        },
      }}
      selection={{
        selectable: true,
      }}
      pagination={{
        count: data?.count,
        page: Number(queryParams.page),
        page_size: Number(queryParams.page_size),
        onPageChange: (page) => setQueryParams((prev) => ({ ...prev, page })),
      }}
    />
  );
}
