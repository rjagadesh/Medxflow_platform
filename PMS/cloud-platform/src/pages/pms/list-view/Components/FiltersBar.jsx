import CustomButton from "@/components/button/button";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import CustomInput from "@/components/input/input";
import { Flex, Box } from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { Filter } from "lucide-react";

export default function FiltersBar({ filterDefs, filters, setFilters }) {
  return (
    <Flex flexWrap="wrap" align="center" justify="space-between">
      <Flex align="center" gap={3}>
        {filterDefs?.map((f) => (
          <Box key={f.accessor_key}>
            {f.type === "date" ? (
              <CustomDatePicker
                value={filters[f.accessor_key] || ""}
                onValueChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    [f.accessor_key]: e,
                  }));
                }}
                size={{
                  base: "sm",
                  "3xl": "md",
                }}
                {...f.inputProps}
              />
            ) : (
              <CustomInput
                placeholder={f.title}
                value={filters[f.accessor_key] || ""}
                onChange={(e) => {
                  console.log("filterBar111", e.target.value, f.inputProps);
                  setFilters((prev) => ({
                    ...prev,
                    [f.accessor_key]: e.target.value,
                  }));
                }}
                size={{
                  base: "sm",
                  "3xl": "md",
                }}
                {...f.inputProps}
              />
            )}
          </Box>
        ))}
        <CustomButton
          onClick={() => {
            setFilters((prev) => {
              const keys = Object.keys(prev);
              return keys.reduce((a, c) => {
                a[c] = "";
                return a;
              }, {});
            });
          }}
          variant="danger"
          leftIcon={<XIcon />}
        >
          Clear
        </CustomButton>
        <CustomButton
          onClick={() => {
            setFilters((prev) => ({
              ...prev,
              clicked: (prev.clicked || 0) + 1,
              page: 1,
            }));
          }}
          leftIcon={<Filter />}
        >
          Filter
        </CustomButton>
      </Flex>
    </Flex>
  );
}
