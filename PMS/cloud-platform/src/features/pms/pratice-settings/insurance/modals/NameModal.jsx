import React, { useState, useEffect } from "react";
import { Box, Flex, Text, VStack, HStack, Portal } from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react/dialog";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";

const NameModal = ({ isOpen, onClose, name, onSave }) => {
  const [localName, setLocalName] = useState(name);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLocalName(name);
    setErrors({});
  }, [name, isOpen]);

  const handleChange = (field, value) => {
    setLocalName({ ...localName, [field]: value });
    if (value) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSave = () => {
    const newErrors = {};
    if (!localName?.prefix) newErrors.prefix = true;
    if (!localName?.firstName) newErrors.firstName = true;
    if (!localName?.lastName) newErrors.lastName = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(localName);
    onClose();
  };

  return (
    <Dialog.Root
      placement={"center"}
      open={isOpen}
      size="md"
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="droidalBlack.300"
            color="white"
            borderRadius="md"
            boxShadow="xl"
            p={1}
          >
            {/* Title Bar */}
            <Dialog.Header bg="droidalBlack.300" my="0">
              <Text letterSpacing={"wider"} fontWeight={"light"} fontSize="md">
                Enter Full Name
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
                    Name details
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
                          minW="50px"
                        >
                          Title:{" "}
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <Box w="full">
                          <CustomSelect
                            options={[
                              { value: "Mr.", label: "Mr." },
                              { value: "Ms.", label: "Ms." },
                              { value: "Dr.", label: "Dr." },
                            ]}
                            value={[localName?.prefix || ""]}
                            onValueChange={(val) =>
                              handleChange("prefix", val[0])
                            }
                            placeholder=""
                            w="full"
                            size="sm"
                            invalid={errors.prefix}
                          />
                        </Box>
                      </HStack>
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="50px"
                        >
                          First:{" "}
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <CustomInput
                          value={localName?.firstName || ""}
                          onChange={(e) =>
                            handleChange("firstName", e.target.value)
                          }
                          size="sm"
                          invalid={errors.firstName}
                        />
                      </HStack>
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="50px"
                        >
                          Middle:
                        </Text>
                        <CustomInput
                          value={localName?.middleName || ""}
                          onChange={(e) =>
                            handleChange("middleName", e.target.value)
                          }
                          size="sm"
                        />
                      </HStack>
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="50px"
                        >
                          Last:{" "}
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Text>
                        <CustomInput
                          value={localName?.lastName || ""}
                          onChange={(e) =>
                            handleChange("lastName", e.target.value)
                          }
                          size="sm"
                          invalid={errors.lastName}
                        />
                      </HStack>
                      <HStack>
                        <Text
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          fontSize="xs"
                          minW="50px"
                        >
                          Suffix:
                        </Text>
                        <Box w="full">
                          <CustomSelect
                            options={[
                              { value: "Jr.", label: "Jr." },
                              { value: "Sr.", label: "Sr." },
                              { value: "III", label: "III" },
                            ]}
                            value={[localName?.suffix || ""]}
                            onValueChange={(val) =>
                              handleChange("suffix", val[0])
                            }
                            placeholder=""
                            w="full"
                            size="sm"
                          />
                        </Box>
                      </HStack>
                    </VStack>
                  </Box>
                </Box>
              </Flex>
            </Dialog.Body>

            {/* Buttons */}
            <Dialog.Footer>
              <HStack justifyContent={"flex-end"}>
                <CustomButton size="xs" variant="outline" onClick={handleSave}>
                  OK
                </CustomButton>
                <CustomButton size="xs" onClick={onClose}>
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

export default NameModal;
