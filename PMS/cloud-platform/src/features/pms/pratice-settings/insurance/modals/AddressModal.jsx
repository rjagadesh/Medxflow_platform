import React, { useState, useEffect } from "react";
import { Box, Flex, Text, VStack, HStack, Portal } from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react/dialog";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";

const AddressModal = ({ isOpen, onClose, address, onSave }) => {
  const [localAddress, setLocalAddress] = useState(address);
  const [errors, setErrors] = useState({});

  // Sync local state when prop changes
  useEffect(() => {
    setLocalAddress(address);
    setErrors({});
  }, [address, isOpen]);

  const handleChange = (field, value) => {
    setLocalAddress({ ...localAddress, [field]: value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSave = () => {
    const newErrors = {};
    const requiredFields = ["street1", "city", "state", "zip", "country"];

    requiredFields.forEach((field) => {
      if (!localAddress?.[field] || localAddress[field].trim() === "") {
        newErrors[field] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(localAddress);
    onClose();
  };

  return (
    <Dialog.Root
      placement={"center"}
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="droidalBlack.300"
            color="white"
            borderRadius="md"
            maxW="500px"
            w="full"
            boxShadow="xl"
            p={1} // Small padding for outer frame
          >
            {/* Title Bar */}
            <Dialog.Header bg="droidalBlack.300" my="0">
              <Text letterSpacing={"wider"} fontWeight={"light"} fontSize="md">
                Enter Address
              </Text>
            </Dialog.Header>
            <Dialog.Body>
              <Flex gap={4} bg="droidalBlack.300">
                {/* Content */}
                <Box flex={1}>
                  <Text
                    letterSpacing={"wider"}
                    fontWeight={"light"}
                    fontSize="sm"
                    mb={1}
                  >
                    Address details
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Box
                    border="1px solid"
                    borderColor="droidalGray.300"
                    p={2}
                    pt={4}
                    position="relative"
                    mt={2}
                  >
                    <VStack gap={3} align="stretch">
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="90px"
                        >
                          Street:
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <CustomInput
                          value={localAddress?.street1 || ""}
                          onChange={(e) =>
                            handleChange("street1", e.target.value)
                          }
                          invalid={!!errors.street1}
                          borderColor={
                            errors.street1 ? "red.500" : "droidalGray.300"
                          }
                        />
                      </HStack>
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="90px"
                        >
                          City:
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <CustomInput
                          value={localAddress?.city || ""}
                          onChange={(e) => handleChange("city", e.target.value)}
                          invalid={!!errors.city}
                          borderColor={
                            errors.city ? "red.500" : "droidalGray.300"
                          }
                        />
                      </HStack>
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="90px"
                        >
                          State/Province:
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <CustomInput
                          value={localAddress?.state || ""}
                          onChange={(e) =>
                            handleChange("state", e.target.value)
                          }
                          invalid={!!errors.state}
                          borderColor={
                            errors.state ? "red.500" : "droidalGray.300"
                          }
                        />
                      </HStack>
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="90px"
                        >
                          Zip/Postal Code:
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <CustomInput
                          value={localAddress?.zip || ""}
                          onChange={(e) => handleChange("zip", e.target.value)}
                          invalid={!!errors.zip}
                          borderColor={
                            errors.zip ? "red.500" : "droidalGray.300"
                          }
                        />
                      </HStack>

                      <Text
                        fontSize="xs"
                        color="blue.300"
                        textDecoration="underline"
                        cursor="pointer"
                        ml="90px"
                      >
                        Go to the USPS Website to find the valid 9 digit zip
                        code if one is not suggested
                      </Text>

                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="90px"
                        >
                          Country/Region:
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <CustomInput
                          value={localAddress?.country || ""}
                          onChange={(e) =>
                            handleChange("country", e.target.value)
                          }
                          invalid={!!errors.country}
                          borderColor={
                            errors.country ? "red.500" : "droidalGray.300"
                          }
                        />
                      </HStack>
                    </VStack>
                  </Box>
                </Box>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack justify={"flex-end"}>
                <CustomButton size="xs" variant="outline" onClick={handleSave}>
                  OK
                </CustomButton>
                <CustomButton size="xs" variant="outline" onClick={onClose}>
                  Cancel
                </CustomButton>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddressModal;
