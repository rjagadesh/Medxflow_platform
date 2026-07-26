import { Popover, Portal, InputGroup, Icon } from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "react-date-range";
import { isValid, parse } from "date-fns";
import "../../utils/DatePickerDark.css";
import CustomInput from "../input/input";
import { formatDate } from "@/utils/helper";
import { toaster } from "@/components/ui/toaster";
import { CalendarIcon } from "lucide-react";

const CustomDatePicker = ({
  value = null,
  onValueChange,
  minDate = undefined,
  maxDate = undefined,
  inputProps = {},
  endElement = null,
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputGroupRef = useRef(null);

  useEffect(() => {
    if (value) {
      setInputValue(formatDate(new Date(value), "MM-dd-yyyy"));
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleSelect = (date) => {
    onValueChange(date);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    if (!inputValue) {
      if (value) onValueChange(null);
      return;
    }

    if (value && inputValue === formatDate(new Date(value), "MM-dd-yyyy")) {
      return;
    }

    const formats = ["MM.dd.yyyy", "MM-dd-yyyy", "MM/dd/yyyy"];
    let parsedDate = null;

    for (const fmt of formats) {
      const d = parse(inputValue, fmt, new Date());
      if (isValid(d)) {
        if (d.getFullYear() > 1000) {
          parsedDate = d;
          break;
        }
      }
    }

    if (parsedDate) {
      onValueChange(parsedDate);
    } else {
      setInputValue("");
      if (value) onValueChange(null);
      toaster.error({
        title: "Invalid Date",
        description: "Supported formats: MM-DD-YYYY, MM.DD.YYYY, MM/DD/YYYY",
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputBlur();
      setOpen(false);
    }
  };

  console.log("Rendered CustomDatePicker", { value, inputValue });

  return (
    <Popover.Root
      open={open}
      onOpenChange={(v) => setOpen(v.open)}
      onInteractOutside={(e) => {
        const target = e.detail?.originalEvent?.target || e.target;
        if (inputGroupRef.current && inputGroupRef.current.contains(target)) {
          e.preventDefault();
          return;
        }
        setOpen(false);
      }}
    >
      <Popover.Anchor>
        <InputGroup
          ref={inputGroupRef}
          endElement={
            endElement === false ? null : endElement ? (
              endElement
            ) : (
              <Icon
                color={"droidalGray.300"}
                _hover={{
                  color: "white",
                }}
                size={"md"}
              >
                <CalendarIcon />
              </Icon>
            )
          }
          onClick={() => setOpen(true)}
        >
          <CustomInput
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            size={{
              base: "xs",
              "2xl": "sm",
              "3xl": "md",
            }}
            placeholder={"MM-DD-YYYY"}
            {...inputProps}
          />
        </InputGroup>
      </Popover.Anchor>
      <Portal>
        <Popover.Positioner>
          <Popover.Content onOpenAutoFocus={(e) => e.preventDefault()}>
            <Popover.Arrow />
            <Calendar
              date={value ? new Date(value) : new Date()}
              minDate={minDate || new Date("1900-01-01")}
              maxDate={maxDate}
              onChange={handleSelect}
            />
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default CustomDatePicker;
