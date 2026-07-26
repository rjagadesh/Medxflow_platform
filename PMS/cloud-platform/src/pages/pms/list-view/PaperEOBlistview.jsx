import { Button, Flex, Badge, Box, Select } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import ListLayout from "./Components/ListLayout";
import { useNavigate } from "react-router-dom";
import { useQueryStates, parseAsString } from "nuqs";
import PaperEobUpload from "../encounter/papereob-upload";
import EobNotificationBanner from "./Components/today-eob-collected";
import CustomSelect from "@/components/ui/select";

const title = "PAPER EOB SCANNING & 835 CONVERSION";

/* -------------------- Tabs -------------------- */
const EOB_TABS = [
  { key: "INCOMING", label: "Incoming" },
  { key: "PROCESSING", label: "Processing" },
  { key: "READY_TO_SUBMIT", label: "Read To Submit" },
  { key: "RECON_MATCHED", label: "Recon Matched" },
  { key: "ATTENTION_NEEDED", label: "Attention Needed" },
];

const TAB_STATUS_MAP = {
  INCOMING: ["Incoming"],
  PROCESSING: ["Converting...", "Processing"],
  READY_TO_SUBMIT: ["Converted", "Ready to Submit"],
  RECON_MATCHED: ["Recon Matched"],
  ATTENTION_NEEDED: ["Failed", "Attention Needed"],
};

/* -------------------- Filters -------------------- */
const filters = [
  { accessor_key: "payer", title: "Payer", inputProps: { type: "text" } },
  { accessor_key: "patient", title: "Patient", inputProps: { type: "text" } },
  {
    accessor_key: "date_received",
    title: "Date Received",
    type: "date",
    inputProps: { type: "date" },
  },
];

/* -------------------- Profile -------------------- */
const profile = [
  { key: "payer", label: "Payer" },
  { key: "patient", label: "Patient" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "835 Status" },
];

/* -------------------- Mock Data -------------------- */
const MOCK_EOBS = [
  /* ---------------- Incoming ---------------- */
  {
    id: 1,
    date_received: "2024-03-01",
    payer: "UnitedHealthcare",
    payer_logo: "/image/ins/u full.png",
    patient: "Elizabeth Harris, 59F",
    amount: "$385.12",
    status: "Incoming",
    preview_image: "/image/download (1).png",
    view: "view",
  },
  {
    id: 2,
    date_received: "2024-03-01",
    payer: "Aetna",
    payer_logo: "/image/ins/a full.png",
    patient: "Ethan Reynolds, 42M",
    amount: "$248.90",
    status: "Incoming",
    preview_image: "/image/download (4).png",
    view: "view",
  },

  /* ---------------- Processing ---------------- */
  {
    id: 3,
    date_received: "2024-02-28",
    payer: "Medicare",
    payer_logo: "/image/ins/m full.png",
    patient: "Emma Anderson, 36F",
    amount: "$431.75",
    status: "Converting...",
    preview_image: "/image/download (1).jpg",
    view: "view",
  },
  {
    id: 4,
    date_received: "2024-02-28",
    payer: "Cigna",
    payer_logo: "/image/ins/c full.png",
    patient: "Michael Carter, 50M",
    amount: "$621.89",
    status: "Processing",
    preview_image: "/image/download (3).png",
    view: "view",
  },
  {
    id: 5,
    date_received: "2024-02-27",
    payer: "Anthem",
    payer_logo: "/image/ins/ant full.png",
    patient: "Emily Thompson (+ Emt. internal)",
    amount: "$13.45",
    status: "Converting...",
    preview_image: "/image/download (2).png",
    view: "view",
  },
  {
    id: 6,
    date_received: "2024-02-27",
    payer: "Blue Cross Blue Shield",
    payer_logo: "/image/ins/bcbs full.png",
    patient: "Jessica Miller (+ Emt. internal)",
    amount: "$577.20",
    status: "Processing",
    preview_image: "/image/download.jpg",
    view: "view",
  },

  /* ---------------- Ready to Submit ---------------- */
  {
    id: 7,
    date_received: "2024-02-26",
    payer: "Humana",
    payer_logo: "/image/ins/hu full.png",
    patient: "Daniel Martinez, 64M",
    amount: "$812.30",
    status: "Converted",
    preview_image: "/image/images (1).jpg",
    view: "view",
  },
  {
    id: 8,
    date_received: "2024-02-26",
    payer: "Kaiser Permanente",
    payer_logo: "/image/ins/kp full.png",
    patient: "Sophia Nguyen, 29F",
    amount: "$94.60",
    status: "Ready to Submit",
    preview_image: "/image/download (2).png",
    view: "view",
  },
  {
    id: 9,
    date_received: "2024-02-25",
    payer: "Molina Healthcare",
    payer_logo: "/image/ins/molina full.png",
    patient: "Alyssa Brown, 33F",
    amount: "$156.78",
    status: "Converted",
    preview_image: "/image/download.png",
    view: "view",
  },

  /* ---------------- Recon Matched ---------------- */
  {
    id: 10,
    date_received: "2024-02-24",
    payer: "Tricare",
    payer_logo: "/image/ins/tricare full.png",
    patient: "Robert Johnson, 71M",
    amount: "$1,204.18",
    status: "Recon Matched",
    preview_image: "/image/download.jpg",
    view: "view",
  },
  {
    id: 11,
    date_received: "2024-02-24",
    payer: "Medicare",
    payer_logo: "/image/ins/m full.png",
    patient: "Linda Perez, 68F",
    amount: "$934.22",
    status: "Recon Matched",
    preview_image: "/image/images (2).png",
    view: "view",
  },

  /* ---------------- Attention Needed ---------------- */
  {
    id: 12,
    date_received: "2024-02-23",
    payer: "UnitedHealthcare",
    payer_logo: "/image/ins/u full.png",
    patient: "Kevin Patel, 45M",
    amount: "$292.40",
    status: "Failed",
    preview_image: "/image/images (3).png",
    view: "view",
  },
  {
    id: 13,
    date_received: "2024-02-23",
    payer: "Aetna",
    payer_logo: "/image/ins/a full.png",
    patient: "Rachel Green, 38F",
    amount: "$510.65",
    status: "Attention Needed",
    preview_image: "/image/download (1).jpg",
    view: "view",
  },

  /* ---------------- More Mixed Data ---------------- */
  {
    id: 14,
    date_received: "2024-02-22",
    payer: "Cigna",
    payer_logo: "/image/ins/c full.png",
    patient: "Brian Collins, 56M",
    amount: "$89.10",
    status: "Incoming",
    preview_image: "/image/images (4).png",
    view: "view",
  },
  {
    id: 15,
    date_received: "2024-02-22",
    payer: "Humana",
    payer_logo: "/image/ins/hu full.png",
    patient: "Thomas Wright, 61M",
    amount: "$408.90",
    status: "Processing",
    preview_image: "/image/images (5).png",
    view: "view",
  },
  {
    id: 16,
    date_received: "2024-02-21",
    payer: "BlueCross BlueShield",
    payer_logo: "/image/ins/bcbs full.png",
    patient: "Natalie Brooks, 47F",
    amount: "$675.33",
    status: "Converted",
    preview_image: "/image/images.jpg",
    view: "view",
  },
  {
    id: 17,
    date_received: "2024-02-21",
    payer: "Anthem",
    payer_logo: "/image/ins/ant full.png",
    patient: "Jason Kim, 39M",
    amount: "$120.00",
    status: "Recon Matched",
    preview_image: "/image/download (3).png",
    view: "view",
  },
  {
    id: 18,
    date_received: "2024-02-20",
    payer: "Kaiser Permanente",
    payer_logo: "/image/ins/kp full.png",
    patient: "Priya Nair, 31F",
    amount: "$260.55",
    status: "Attention Needed",
    preview_image: "/image/download (1).png",
    view: "view",
  },
  {
    id: 19,
    date_received: "2024-02-20",
    payer: "Tricare",
    payer_logo: "/image/ins/tricare full.png",
    patient: "George Allen, 73M",
    amount: "$1,450.00",
    status: "Incoming",
    preview_image: "/image/images.jpg",
    view: "view",
  },
  {
    id: 20,
    date_received: "2024-02-19",
    payer: "Molina Healthcare",
    payer_logo: "/image/ins/molina full.png",
    patient: "Isabella Torres, 28F",
    amount: "$98.75",
    status: "Processing",
    preview_image: "/image/download (1).jpg",
    view: "view",
  },
];

const formatDateMMDDYYYY = (dateStr) => {
  if (!dateStr) return "";
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${mm}-${dd}-${yyyy}`;
};
/* -------------------- Columns -------------------- */
const columns = [
  {
    accessor_key: "preview_image",
    title: "Preview",
    render: (value) =>
      value ? (
        <Box
          as="img"
          src={value}
          alt="EOB preview"
          height="70px"
          width="130px"
          objectFit="cover"
          cursor="pointer"
          onClick={() => window.open(value, "_blank")}
        />
      ) : (
        "-"
      ),
  },
  {
    accessor_key: "date_received",
    title: "Date Received",
    render: (value) => formatDateMMDDYYYY(value),
  },

  {
    accessor_key: "payer",
    title: "Payer",
    render: (_, row) => (
      <Flex align="center" gap={2}>
        {row.payer_logo && (
          <Box
            as="img"
            src={row.payer_logo}
            alt={row.payer}
            height="70px"
            width={"130px"}
            objectFit="contain"
          />
        )}
        {/* <Box>{row.payer}</Box> */}
      </Flex>
    ),
  },
  { accessor_key: "patient", title: "Patient" },
  { accessor_key: "amount", title: "Amount" },
  {
    accessor_key: "status",
    title: "835 Status",
    render: (value) => (
      <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
        {value}
      </Badge>
    ),
  },
  {
    accessor_key: "action",
    title: "Actions",
    render: (_, row) => (
      <CustomSelect
        size="sm"
        width="100px"
        placeholder="View"
        onValueChange={(e) => {
          const action = e.target.value;
          console.log(action, row);
        }}
        options={[
          { value: "view", label: "View" },
          { value: "print", label: "Print" },
          { value: "history", label: "History" },
          { value: "cancel", label: "Cancel" },
        ]}
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
      />
    ),
  },
];

export default function PaperEOBListView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("PROCESSING");

  const [queryParams, setQueryParams] = useQueryStates({
    payer: parseAsString.withDefault(""),
    patient: parseAsString.withDefault(""),
    date_received: parseAsString.withDefault(null),
    page: parseAsString.withDefault(1),
    page_size: parseAsString.withDefault(10),
  });
  const tabCounts = useMemo(() => {
    return EOB_TABS.reduce((acc, tab) => {
      const statuses = TAB_STATUS_MAP[tab.key] || [];
      acc[tab.key] = MOCK_EOBS.filter((eob) =>
        statuses.includes(eob.status)
      ).length;
      return acc;
    }, {});
  }, []);

  /* -------------------- Filter by Tab -------------------- */
  const filteredEobs = useMemo(() => {
    const allowedStatuses = TAB_STATUS_MAP[activeTab];
    if (!allowedStatuses) return MOCK_EOBS;

    return MOCK_EOBS.filter((eob) => allowedStatuses.includes(eob.status));
  }, [activeTab]);

  return (
    <>
      <EobNotificationBanner count={5} faxNumber="123-456-7890" />

      {/* -------- Tabs -------- */}
      <Flex gap={3} mb={3} mt={3}>
        {EOB_TABS.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <Button
              key={tab.key}
              size="sm"
              borderRadius="md"
              backgroundImage={isActive ? "var(--bg-blue-gradient)" : "none"}
              bg={isActive ? undefined : "gray.700"}
              colorScheme="blue"
              onClick={() => setActiveTab(tab.key)}
            >
              <Flex align="center" gap={2}>
                <Box>{tab.label}</Box>

                <Badge
                  bg={isActive ? "whiteAlpha.900" : "gray.500"}
                  color={isActive ? "blue.700" : "white"}
                  borderRadius="full"
                  fontSize="xs"
                >
                  {tabCounts[tab.key] ?? 0}
                </Badge>
              </Flex>
            </Button>
          );
        })}
      </Flex>

      <ListLayout
        title={title}
        columns={columns}
        filters={filters}
        data={filteredEobs}
        loading={false}
        profile={profile}
        controlledFilters={queryParams}
        onFiltersChange={setQueryParams}
        pagination={{
          count: filteredEobs.length,
          page: queryParams.page,
          page_size: queryParams.page_size,
          onPageChange: (page) => setQueryParams((prev) => ({ ...prev, page })),
        }}
      />

      <PaperEobUpload />
    </>
  );
}
