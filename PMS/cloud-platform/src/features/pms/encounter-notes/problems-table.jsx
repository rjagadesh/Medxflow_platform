import React from "react";
import { Text, Link } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";

export const PROBLEMS_COLUMNS = [
  {
    title: "Problem/Issue",
    accessor_key: "problem",
    render: (item) => <Text color="white">{item}</Text>,
  },
  {
    title: "Diagnosis description",
    accessor_key: "diagnosisDescription",
    render: (item) => <Text color="white">{item}</Text>,
  },
  {
    title: "ICD-10",
    accessor_key: "icd10",
    render: (item) => (
      <Link color="cyan.400" textDecoration="none">
        {item}
      </Link>
    ),
  },
  {
    title: "ICD-9",
    accessor_key: "icd9",
    render: (item) => <Text color="white">{item}</Text>,
  },
  {
    title: "Start Date",
    accessor_key: "startDate",
    render: (item) => <Text color="white">{item}</Text>,
  },
  {
    title: "Comments",
    accessor_key: "comments",
    render: (item) => <Text color="white">{item}</Text>,
  },
  {
    title: "Last Edited",
    accessor_key: "lastEdited",
    render: (item) => <Text color="white">{item}</Text>,
  },
];

const ProblemsTable = ({ data, selection, ...props }) => {
  return (
    <GenericTable
      columns={PROBLEMS_COLUMNS}
      data={data}
      selection={selection}
      pagination={false}
      {...props}
    />
  );
};

export default ProblemsTable;
