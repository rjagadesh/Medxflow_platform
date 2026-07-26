import CustomButton from "@/components/button/button";
import GenericTable from "@/components/table/table";
import CustomSelect from "@/components/ui/select";
import { Box, IconButton, Input, InputGroup, Text } from "@chakra-ui/react";
import {
  MessageSquare,
  MoreVertical,
  RotateCw,
  Search,
  Settings,
} from "lucide-react";
import { useMemo, useState } from "react";
import getStatusIcon from "@/utils/status-icon";
import UploadDocumentModal from "@/features/pms/documents/upload-document-modal";

const PmsDocuments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("");

  const mockData = [
    {
      id: "1",
      name: "12/1/2025 Visit",
      date: "12/3/2025",
      type: "PDF",
      size: "8.9 KB",
      label: "Other Office Note",
      patient: {
        name: "MEGAN ARGABRIGHT",
        dob: "3/14/1982",
        age: 43,
        gender: "Female",
      },
      provider: "WALDEN, KATHERINE",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "2",
      name: "Argabright approval Bu...",
      date: "12/2/2025",
      type: "PDF",
      size: "26.2 KB",
      label: "Insurance Corr...",
      patient: {
        name: "MEGAN ARGABRIGHT",
        dob: "3/14/1982",
        age: 43,
        gender: "Female",
      },
      provider: "WALDEN, KATHERINE",
      status: "NEW",
      shared: "No",
      notes: "Approval Bupreno...",
    },
    {
      id: "3",
      name: "Brewer work release",
      date: "12/2/2025",
      type: "PDF",
      size: "34.6 KB",
      label: "Release of Info...",
      patient: {
        name: "JERRED BREWER",
        dob: "11/11/1993",
        age: 32,
        gender: "Male",
      },
      provider: "HERRIGES, MICHAEL",
      status: "NEW",
      shared: "No",
      notes: "Work release pap...",
    },
    {
      id: "4",
      name: "C-SSRS",
      date: "12/2/2025",
      type: "HTML",
      size: "2.3 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "5",
      name: "MDQ",
      date: "12/2/2025",
      type: "HTML",
      size: "6.7 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "6",
      name: "AUDIT",
      date: "12/2/2025",
      type: "HTML",
      size: "7.1 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "7",
      name: "CAGE-AID",
      date: "12/2/2025",
      type: "HTML",
      size: "2.2 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "8",
      name: "ASRS",
      date: "12/2/2025",
      type: "HTML",
      size: "12.5 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "9",
      name: "PCL-5",
      date: "12/2/2025",
      type: "HTML",
      size: "13.2 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "10",
      name: "GAD-7",
      date: "12/2/2025",
      type: "HTML",
      size: "4.1 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
    {
      id: "11",
      name: "PHQ-9",
      date: "12/2/2025",
      type: "HTML",
      size: "6.1 KB",
      label: "Other",
      patient: {
        name: "ARON SLATER",
        dob: "3/07/2006",
        age: 19,
        gender: "Female",
      },
      provider: "",
      status: "NEW",
      shared: "No",
      notes: "",
    },
  ];

  const columns = useMemo(
    () => [
      {
        title: "Name",
        accessor_key: "name",
        render: (value) => <Text fontWeight="medium">{value}</Text>,
      },
      {
        title: "Document Date",
        accessor_key: "date",
      },
      {
        title: "File Type",
        accessor_key: "type",
      },
      {
        title: "File Size",
        accessor_key: "size",
      },
      {
        title: "Label",
        accessor_key: "label",
      },
      {
        title: "Patient",
        accessor_key: "patient",
        render: (patient) =>
          patient ? (
            <Box>
              <Text fontWeight="bold" color="blue.300">
                {patient.name}
              </Text>
              <Text fontSize="xs" color="gray.400">
                DOB: {patient.dob} ({patient.age} y/o {patient.gender})
              </Text>
            </Box>
          ) : null,
      },
      {
        title: "Provider",
        accessor_key: "provider",
      },
      {
        title: "Status",
        accessor_key: "status",
        render: (status) => getStatusIcon(status),
      },
      {
        title: "Shared with Patient",
        accessor_key: "shared",
      },
      {
        title: "Notes",
        accessor_key: "notes",
        render: (value) => (
          <Text isTruncated maxW="150px" title={value}>
            {value}
          </Text>
        ),
      },
      {
        title: "",
        accessor_key: "actions",
        render: () => (
          <IconButton
            variant="ghost"
            aria-label="Actions"
            icon={<MoreVertical size={16} />}
            size="sm"
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
          />
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    let data = [...mockData];
    if (searchTerm) {
      data = data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter && statusFilter !== "") {
      data = data.filter((item) => item.status === statusFilter);
    }
    return data;
  }, [searchTerm, statusFilter, mockData]);

  return (
    <div>
      <div className="bg-droidal-black-300 rounded-2xl shadow-sm">
        {/* Header */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
            <Text
              as="h2"
              fontSize={{
                base: "md",
                md: "lg",
              }}
              className="font-semibold text-white"
            >
              Documents
            </Text>

            <div className="flex items-center gap-x-4">
              <CustomButton
                variant="plain"
                leftIcon={<MessageSquare size={16} />}
              >
                Give Feedback
              </CustomButton>

              {/* <CustomButton variant="outline">Upload Document</CustomButton> */}
              <UploadDocumentModal />

              <InputGroup startElement={<Search size={16} />}>
                <Input
                  size={{
                    base: "xs",
                    "2xl": "md",
                    "3xl": "lg",
                  }}
                  borderRadius={{
                    base: "10px",
                    "2xl": "12px",
                    "3xl": "14px",
                  }}
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
                  { label: "New", value: "NEW" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Success", value: "SUCCESS" },
                  { label: "Failure", value: "FAILURE" },
                ]}
                placeholder="Select Status"
                borderRadius="4px !important"
                borderColor="#2f4d78"
                size={{
                  base: "xs",
                  "2xl": "md",
                  "3xl": "lg",
                }}
                color="white"
                value={[statusFilter]}
                onValueChange={(v) => {
                  setStatusFilter(v[0]);
                }}
                width="150px"
              />

              <IconButton
                variant="ghost"
                aria-label="Refresh"
                icon={<RotateCw size={18} />}
                color="gray.400"
                _hover={{ color: "white", bg: "transparent" }}
              />

              <IconButton
                variant="ghost"
                aria-label="Settings"
                icon={<Settings size={18} />}
                color="gray.400"
                _hover={{ color: "white", bg: "transparent" }}
              />
            </div>
          </div>
        </div>

        <GenericTable
          columns={columns}
          data={filteredData}
          count={filteredData.length}
          onPageChange={(v) => setPage(v)}
          page={page}
          sort={sort}
          onSortClick={(v) => setSort(v)}
          selection={{
            selectable: true,
            checkboxProps: {},
            onSelectAllChange: (allRows) => allRows.map((row) => row.id),
            checkPermission: () => true,
            onConfirm: async (selectedRows) => {
              console.log("Deleted", selectedRows);
              return true;
            },
          }}
          bodyHeight={"calc(100vh - 270px)"}
        />
      </div>
    </div>
  );
};

export default PmsDocuments;
