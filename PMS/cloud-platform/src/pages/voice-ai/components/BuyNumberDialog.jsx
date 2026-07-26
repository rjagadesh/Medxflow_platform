import React, { useState } from "react";
import {
  Dialog,
  Portal,
  Button,
  CloseButton,
  Field,
  VStack,
  InputGroup,
  Image,
} from "@chakra-ui/react";
import CustomSelect from "@/components/ui/select";
import {
  useBuyNumbers,
  useGetNumbers,
} from "@/hooks/query/voiceai/useGetBuyNumbers";
import ConfirmationDialog from "../../../components/confirmation-dialog/confirmation-dialog";
import { toaster } from "@/components/ui/toaster";
import CustomButton from "@/components/button/button";
import { useAuth } from "@/store/providers/auth-provider";

const BuyNumberDialog = ({ open, onClose }) => {
  const [selectedValue, setSelectedValue] = useState("");
  const { user } = useAuth();
  const { data: availableNumbers } = useGetNumbers();
  const { mutateAsync, isPending } = useBuyNumbers();
  const availableNumbersList = availableNumbers?.result || [];

  console.log("availableNumbers", user, availableNumbers);
  console.log("selectedValue1212", selectedValue);

  // Get options for the select dropdown
  const getOptions = () => {
    return availableNumbersList.map((number) => ({
      label: `+1${number.friendly_name}`,
      value: number.phone_number,
      avatar: "https://flagcdn.com/w40/us.png",
    }));
  };

  const handleConfirm = async () => {
    try {
      const value = selectedValue;
      if (!value || value.trim() === "") {
        toaster.error({
          title: "Error",
          description: "Please select a phone number",
        });
        return;
      }

      await mutateAsync(
        { phone_number: value },
        {
          onSuccess: () => {
            toaster.success({
              title: "Success",
              description: "Successfully bought phone number",
            });
          },
          onError: (e) => {
            toaster.error({
              title: "Error",
              description: e.error || "Error buying phone number",
            });
          },
        },
      );
      onClose(false);
      return true;
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onClose(e.open)}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bgColor={"droidalBlack.300"}>
            <Dialog.Header m={0} borderBottom={"1px solid #2f4d78"}>
              <Dialog.Title m={0} className="!text-white">
                Buy Phone Number
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  _hover={{
                    bgColor: "transparent",
                  }}
                  color="white"
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={8}>
              <Field.Root>
                <Field.Label
                  color={"white"}
                  letterSpacing={"wider"}
                  fontWeight={"light"}
                >
                  Available Phone Numbers
                </Field.Label>
                <VStack spacing={3} w="full">
                  <CustomSelect
                    value={selectedValue ? [selectedValue] : []}
                    onValueChange={(val) => setSelectedValue(val[0] || "")}
                    options={getOptions()}
                    placeholder="Select Phone Number"
                    w="100%"
                    color="white"
                    css={{
                      "& button": {
                        borderRadius: "4px !important",
                        borderColor: "#2f4d78",
                      },
                    }}
                  />
                </VStack>
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <CustomButton
                variant="outline"
                onClick={() => onClose(false)}
                className="!text-white !border-gray-600"
                _hover={{
                  bg: "transparent",
                }}
                size="sm"
              >
                Cancel
              </CustomButton>
              <ConfirmationDialog
                buttonName={"Buy"}
                title="Buy Phone Number"
                description="Are you sure you want to buy this number?"
                onConfirm={handleConfirm}
                loading={isPending}
                buttonProps={{
                  disabled: !selectedValue,
                  size: "sm",
                }}
              />
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default BuyNumberDialog;
