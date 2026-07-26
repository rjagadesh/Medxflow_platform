// src/pages/TaskList.jsx

import { useCallback, useState } from "react";
import ListLayout from "./Components/ListLayout";

export default function TaskList() {
  // Controlled filters for the page
  const [filters, setFilters] = useState({
    search: "",
    assigned_to: "",
    due_date: "",
    type: "",
    record: "",
  });

  // Filter input definitions -> used by FiltersBar
  const filterDefs = [
    { key: "search", label: "Search Task" },
    { key: "assigned_to", label: "Assigned To" },
    { key: "due_date", label: "Due Date" },
    { key: "type", label: "Type" },
    { key: "record", label: "Record" },
  ];

  // Table columns
  const columns = [
    { accessor_key: "due_date", title: "Due Date" },
    { accessor_key: "subject", title: "Subject" },
    { accessor_key: "priority", title: "Priority" },
    { accessor_key: "status", title: "Status" },
    { accessor_key: "type", title: "Type" },
    { accessor_key: "related_to", title: "Related To" },
    { accessor_key: "assigned_to", title: "Assigned To" },
  ];

  /**
   * Fetch tasks based on filters from backend
   */
  const fetchData = useCallback(async ({ filters }) => {
    console.log("Fetching tasks with filters:", filters);

    // TODO: Replace with real API call
    return [
      {
        due_date: "2025-01-10",
        subject: "Follow up with Provider",
        priority: "High",
        status: "Open",
        type: "Call",
        related_to: "Daniel Martinez",
        assigned_to: "Kaarthik",
      },
      {
        due_date: "2025-01-12",
        subject: "Email Insurance",
        priority: "Medium",
        status: "In Progress",
        type: "Email",
        related_to: "Claim #4423",
        assigned_to: "John Doe",
      },
      {
        due_date: "2025-01-14",
        subject: "Review Authorization Requirements",
        priority: "High",
        status: "Pending",
        type: "Review",
        related_to: "Auth Case #9921",
        assigned_to: "Sarah Lee",
      },
      {
        due_date: "2025-01-15",
        subject: "Update Patient Contact Details",
        priority: "Low",
        status: "Completed",
        type: "Admin",
        related_to: "Michael Adams",
        assigned_to: "Emily Clark",
      },
      {
        due_date: "2025-01-17",
        subject: "Rebill Corrected Claim",
        priority: "High",
        status: "Open",
        type: "Claim",
        related_to: "Claim #8832",
        assigned_to: "Kaarthik",
      },
      {
        due_date: "2025-01-18",
        subject: "Call Patient for Missing Documents",
        priority: "Medium",
        status: "Open",
        type: "Call",
        related_to: "Lisa Thompson",
        assigned_to: "John Doe",
      },
      {
        due_date: "2025-01-20",
        subject: "Verify Insurance Eligibility",
        priority: "High",
        status: "In Progress",
        type: "Verification",
        related_to: "Paul Johnson",
        assigned_to: "Sarah Lee",
      },
      {
        due_date: "2025-01-22",
        subject: "Send Appeal Letter",
        priority: "High",
        status: "Pending",
        type: "Appeal",
        related_to: "Claim #7754",
        assigned_to: "Emily Clark",
      },
      {
        due_date: "2025-01-25",
        subject: "Schedule Provider Meeting",
        priority: "Low",
        status: "Open",
        type: "Meeting",
        related_to: "Dr. Andrew Roberts",
        assigned_to: "Kaarthik",
      },
      {
        due_date: "2025-01-27",
        subject: "Upload Missing Clinical Notes",
        priority: "Medium",
        status: "In Progress",
        type: "Admin",
        related_to: "Claim #6632",
        assigned_to: "Sarah Lee",
      },
    ];
  }, []);

  return (
    <ListLayout
      title="TASK LIST"
      data={fetchData}
      columns={columns}
      filters={filterDefs}
      controlledFilters={filters}
      onFiltersChange={setFilters}
    />
  );
}
