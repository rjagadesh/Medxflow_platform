import { Button, HStack, IconButton, Popover, Portal } from "@chakra-ui/react";
import React, { useState } from "react";
import { DateRange } from "react-date-range";

import "../../utils/DatePickerDark.css"; // theme css file
import CustomInput from "../input/input";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useEffect } from "react";

export default function DateRangeCalendar({
  date = {
    startDate: new Date(),
    endDate: new Date(),
  },
  onChange,
  inputProps = {},
}) {
  const [tempDate, setTempDate] = useState(date);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTempDate(date);
  }, [date]);

  const range = {
    startDate: tempDate.startDate,
    endDate: tempDate.endDate,
    key: "selection",
  };
  const displayDateValue = `${format(
    range.startDate,
    "MM/dd/yyyy",
  )} - ${format(range.endDate, "MM/dd/yyyy")}`;
  return (
    <Popover.Root
      open={open}
      onOpenChange={(v) => {
        if (v.open) {
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
        <HStack gap={0} width={"100%"}>
          <CustomInput
            w="240px"
            value={displayDateValue}
            size={{
              base: "xs",
              "2xl": "sm",
              "3xl": "md",
            }}
            placeholder="Select Date Range"
            {...inputProps}
            readOnly
            shrink={0}
            borderRadius={"4px 0px 0px 4px"}
          />
          <IconButton
            aria-label="calendar"
            size="sm"
            variant="ghost"
            color="#2f4d78"
            borderRadius={"0px 4px 4px 0px"}
            border="1px solid #2f4d78"
            borderLeft={"none"}
            _hover={{ bg: "transparent", color: "white" }}
          >
            <Calendar />
          </IconButton>
        </HStack>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Arrow />
            <DateRange
              editableDateInputs={true}
              onChange={(item) => setTempDate(item.selection)}
              moveRangeOnFirstSelection={false}
              ranges={[range]}
            />
            <Popover.Footer
              bgColor={"#2a2a2d"}
              borderBottomRadius={"sm"}
              py={2}
            >
              <Popover.CloseTrigger ml="auto">
                <Button
                  aria-label="ok"
                  size="2xs"
                  variant="ghost"
                  color="#90a6c6"
                  borderRadius={"4px"}
                  border="1px solid #2f4d78"
                  _hover={{ bg: "transparent", color: "white" }}
                  onClick={() => {
                    onChange(tempDate);
                  }}
                >
                  OK
                </Button>
              </Popover.CloseTrigger>
            </Popover.Footer>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
