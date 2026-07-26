import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import { useCreateAPIkey } from "@/hooks/mutation/useCreateAPIKey";
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

const IntegrationModal = () => {
  const [open, setOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState();
  const [selectedAgents, setSelectedAgents] = useState();
  const { mutate, isPending } = useCreateAPIkey();
  const { data = [], isLoading } = useGetDepartments();
  const { data: agents = [] } = useGetAgents({
    module_id: selectedDepartments?.[0],
  });

  console.log("agents", agents);

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
      { apps: selectedAgents[0] },
      {
        onSuccess: () => {
          setSelectedDepartments();
          setOpen(false);
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
      <Dialog.Root
        open={open}
        onOpenChange={(v) => setOpen(v.open)}
        placement={"center"}
        size={{
          base: "sm",
          "2xl": "md",
        }}
      >
        <Dialog.Trigger asChild>
          <CustomButton onClick={() => setOpen(true)}>Generate</CustomButton>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="!bg-droidal-black-300 text-white">
              <Dialog.Header>
                <Dialog.Title>Generate API key</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack w={"full"}>
                  <CustomSelect
                    options={data.map((app) => ({
                      label: app.module_name,
                      value: app.id,
                    }))}
                    isLoading={isLoading}
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
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <CustomButton variant="outline">Cancel</CustomButton>
                </Dialog.ActionTrigger>
                <CustomButton onClick={handleGenerate} loading={isPending}>
                  Generate
                </CustomButton>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </HStack>
  );
};

export default IntegrationModal;
