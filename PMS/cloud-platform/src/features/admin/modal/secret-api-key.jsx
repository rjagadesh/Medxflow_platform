import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import { useCreateSubAgentsAPIkey } from "@/hooks/mutation/useCreateSubAgents";
import { useSubAgents } from "@/hooks/query/admin/useGetSubAgents";
import { useGetAgents } from "@/hooks/query/useGetAgents";
import { useGetDepartments } from "@/hooks/query/useGetDepartments";
import {
  Button,
  CloseButton,
  Dialog,
  For,
  HStack,
  Portal,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

const SecretAPIKeyModal = () => {
  const [selectedDepartments, setSelectedDepartments] = useState();
  const [selectedAgents, setSelectedAgents] = useState();
  const [subAgent, setSubAgent] = useState();
  const { mutate, isPending } = useCreateSubAgentsAPIkey();
  const { data = [], isLoading } = useGetDepartments();
  const { data: agents = [] } = useGetAgents({
    module_id: selectedDepartments?.[0],
  });
  const { data: subAgents = [] } = useSubAgents({
    app_id: selectedAgents?.[0],
    enabled: !!selectedAgents?.[0],
  });

  console.log("selectedAgents1212", selectedAgents);

  console.log("subAgents122", selectedAgents, subAgents);

  const handleGenerate = () => {
    if (!selectedDepartments?.[0]) {
      toaster.error({ title: "Error", description: "Please select an app" });
      return;
    }
    if (!selectedAgents?.[0]) {
      toaster.error({ title: "Error", description: "Please select an agent" });
      return;
    }
    mutate(
      { sub_app: subAgent?.[0] },
      {
        onSuccess: () => {
          setSelectedDepartments();
          toaster.success({ title: "Success", description: "API key created" });
        },
        onError: (error) => {
          console.log("error", error);
          toaster.error({
            title: "Error",
            description: error.message || "Error while creating API key",
          });
        },
      }
    );
  };

  return (
    <HStack>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <CustomButton>Generate</CustomButton>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="!bg-droidal-black-300 text-white">
              <Dialog.Header>
                <Dialog.Title>Generate Secret key</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack w={"full"}>
                  <CustomSelect
                    options={data.map((app) => ({
                      label: app.module_name,
                      value: app.id,
                    }))}
                    w={"full"}
                    placeholder="Select Module"
                    value={selectedDepartments}
                    onValueChange={setSelectedDepartments}
                  />
                  <CustomSelect
                    w={"full"}
                    options={agents.map((app) => ({
                      label: app.app_name,
                      value: app.id,
                    }))}
                    placeholder="Select App"
                    value={selectedAgents}
                    onValueChange={setSelectedAgents}
                  />
                  <CustomSelect
                    w={"full"}
                    options={subAgents.map((app) => ({
                      label: app.sub_app_name,
                      value: app.id,
                    }))}
                    placeholder="Select Sub Agent"
                    value={subAgent}
                    onValueChange={setSubAgent}
                  />
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant="outline"
                    colorScheme="gray"
                    color={"white"}
                    mr={3}
                    _hover={{ bg: "transparent" }}
                    onClick={() => {
                      () => {
                        alert("Cancel");
                        // setOpen(false);
                      };
                    }}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette={"gray"}
                  variant={"subtle"}
                  onClick={handleGenerate}
                  isLoading={isPending}
                >
                  Generate
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </HStack>
  );
};

export default SecretAPIKeyModal;
