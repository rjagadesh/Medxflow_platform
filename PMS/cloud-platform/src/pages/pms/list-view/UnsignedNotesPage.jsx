import { useMemo } from "react";
import { useGetClinicalNotes } from "@/hooks/query/pms/clinical-notes/useGetClinicalNotes";
import { formatDate } from "@/utils/helper";
import ListLayout from "./Components/ListLayout";

export default function UnsignedNotesPage() {
  const title = "UNSIGNED NOTES";

  // The list endpoint returns raw ids for patient/assigned_to (no names),
  // so those columns render the available identifier.
  const columns = [
    { accessor_key: "assigned_to", title: "Provider", render: (v) => v ?? "—" },
    { accessor_key: "patient", title: "Patient", render: (v) => v ?? "—" },
    {
      accessor_key: "created_at",
      title: "Visit Date",
      render: (v) => (v ? formatDate(v) : "—"),
    },
    { accessor_key: "status", title: "Status", render: () => "Unsigned" },
    { accessor_key: "notes_type", title: "Note Type", render: (v) => v || "—" },
    { accessor_key: "id", title: "Note ID", render: (v) => v ?? "—" },
  ];

  // Unsigned Notes has no filters in UI
  const filters = [];

  const { data, isLoading, isPlaceholderData } = useGetClinicalNotes();

  // Keep only notes that have not been signed off yet.
  const unsignedNotes = useMemo(
    () => (data?.notes ?? []).filter((note) => !note.is_signed),
    [data]
  );

  return (
    <ListLayout
      title={title}
      data={unsignedNotes}
      columns={columns}
      filters={filters}
      loading={isLoading || isPlaceholderData}
    />
  );
}
