import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import { useGetDepartments } from "@/hooks/query/useGetDepartments";
import { Card, Field, SimpleGrid } from "@chakra-ui/react";
import { useState } from "react";

const AppPreference = () => {
  const { data: departments = [] } = useGetDepartments();
  const [selectedDepartment, setSelectedDepartment] = useState([]);
  const [defaultLayoutView, setDefaultLayoutView] = useState([]);
  return (
    <Card.Root w={"full"} bg={"droidalBlack.300"} pb="4" border="none">
      <Card.Header
        color="white"
        letterSpacing={"widest"}
        fontSize={"xl"}
        fontWeight={"semibold"}
      >
        App Preference
      </Card.Header>
      <Card.Body>
        <SimpleGrid columns={3} gap={4}>
          <Field.Root>
            <Field.Label color="white">Default Landing App</Field.Label>
            <CustomSelect
              options={departments.map((app) => ({
                label: app.module_name,
                value: app.id,
              }))}
              placeholder="Select Department"
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
              width="full"
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
          </Field.Root>
          <Field.Root>
            <Field.Label color="white">Default Layout View</Field.Label>
            <CustomSelect
              options={[
                {
                  label: "Card",
                  value: "card",
                },
                {
                  label: "List",
                  value: "list",
                },
              ]}
              placeholder="Select Layout View"
              value={defaultLayoutView}
              onValueChange={setDefaultLayoutView}
              width="full"
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
          </Field.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
};

export default AppPreference;
