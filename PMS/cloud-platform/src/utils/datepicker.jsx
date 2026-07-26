import { Button, Input, Popover, Portal, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { DateRange } from "react-date-range";

import "./DatePickerDark.css"; // theme css file
import { useExportAgentTasks } from "./ExportAgentsTasks";

export default function DateRangeCalendar({ agent_id, checkPermission }) {
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [open, setOpen] = useState(false);
  const { refetch, isLoading, isError, error } = useExportAgentTasks(
    agent_id,
    range
  );

  const handleDownload = async () => {
    try {
      await refetch({ agent_id, range });
    } catch (err) {
      if (err === "Please provide start and end date") {
        console.error("Please provide start and end date");
      }
      console.error("Error downloading CSV:", err);
    }
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(v) => {
        if (v.open) {
          if (!checkPermission()) {
            return false;
          }
          setOpen(v.open);
        } else {
          setOpen(v.open);
        }
      }}
      onFocusOutside={() => setOpen(false)}
      onInteractOutside={() => setOpen(false)}
      backgroundColor="black"
    >
      <Popover.Trigger asChild>
        <Button
          _hover={{
            backgroundColor: "#000000ff",
            color: "white",
            borderColor: "#979797ff",
          }}
          _active={{
            backgroundColor: "#aaaaaaff",
            transform: "scale(0.98)",
          }}
        >
          Export
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <DateRange
              editableDateInputs={true}
              onChange={(item) => setRange([item.selection])}
              moveRangeOnFirstSelection={false}
              ranges={range}
            />

            <Button onClick={() => handleDownload()}>Download CSV</Button>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
