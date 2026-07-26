import { Button, Popover } from "@chakra-ui/react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
import { format } from "date-fns";
import { Portal } from "@chakra-ui/react";
import { Calendar } from "lucide-react";

const CustomDateRangePicker = ({ onChange, value = {} }) => {
  const selectedDate = {
    startDate: value.startDate,
    endDate: value.endDate,
    key: "selection",
  };

  return (
    <Popover.Root placement="bottom-start" closeOnBlur={true}>
      <Popover.Trigger>
        <Button size="xs" colorScheme="gray" variant="outline">
          {format(selectedDate.startDate, "dd MMM yyyy")} -{" "}
          {format(selectedDate.endDate, "dd MMM yyyy")}
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content w="auto" border="none" boxShadow="lg">
            <Popover.Arrow />

            <Popover.Body p={0}>
              <DateRange
                editableDateInputs={true}
                onChange={(ranges) => {
                  onChange(ranges.selection);
                }}
                moveRangeOnFirstSelection={false}
                ranges={[selectedDate]}
              />
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default CustomDateRangePicker;
