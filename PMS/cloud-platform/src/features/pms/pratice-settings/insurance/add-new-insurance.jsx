import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  VStack,
  HStack,
  Portal,
  Avatar,
} from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react/dialog";
import { X, Plus, AlertCircle } from "lucide-react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import { useSearchPayers } from "@/hooks/query/pms/patient/useSearchPayer";
import { useDebounce } from "@/hooks/useDebounce";
import { useCreateInsuranceCompany } from "@/hooks/mutation/pms/insurance-company/useCreateInsuranceCompany";
import { toaster } from "@/components/ui/toaster";

const AddNewInsurance = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("common");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch commonly requested payers (empty query)
  const { data: commonPayersData } = useSearchPayers("");
  const commonPayers = commonPayersData?.items || [];

  // Fetch payers based on search query
  const { data: searchPayersData } = useSearchPayers(debouncedSearchQuery);
  const searchPayers = searchPayersData?.items || [];

  const [selectedInsurances, setSelectedInsurances] = useState([]);
  const { mutate: createInsuranceCompany, isPending } =
    useCreateInsuranceCompany();

  const handleAdd = (insurance) => {
    if (!selectedInsurances.find((i) => i.id === insurance.id)) {
      setSelectedInsurances([...selectedInsurances, insurance]);
    }
  };

  const handleRemove = (id) => {
    setSelectedInsurances(selectedInsurances.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    const payload = selectedInsurances.map((item) => ({
      payer_id: item.id,
      name: item.name,
      stedi_id: item.stedi_id,
      coverage_type: item.coverage_type || [],
      stedi_response: item.stedi_response,
    }));

    createInsuranceCompany(payload, {
      onSuccess: () => {
        onClose();
        toaster.success({ title: "Success", description: "Insurance added" });
      },
      onError: (response) => {
        toaster.error({
          title: "Error",
          description:
            response.message || response.detail || "Failed to add insurance",
        });
      },
    });
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => !details.open && onClose()}
      size="xl"
      placement="center"
      scrollBehavior={"inside"}
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="droidalBlack.300"
            color="white"
            borderRadius="xl"
            maxW="900px"
            w="full"
            boxShadow="xl"
          >
            {/* Header */}
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderBottom="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Text fontSize="lg" lettergap={"widest"} fontWeight="light">
                Add Insurance
              </Text>
            </Flex>

            {/* Tabs */}
            <Flex
              borderBottom="1px solid"
              borderColor="whiteAlpha.200"
              px={4}
              pt={4}
            >
              <Box
                px={4}
                py={2}
                cursor="pointer"
                bg={activeTab === "common" ? "droidalBlack.400" : "transparent"}
                borderTopRadius="md"
                borderBottom="none"
                fontWeight="light"
                letterSpacing={"widest"}
                color={
                  activeTab === "common" ? "primary.400" : "droidalGray.400"
                }
                onClick={() => setActiveTab("common")}
              >
                Most Commonly Requested
              </Box>
              <Box
                px={4}
                py={2}
                cursor="pointer"
                bg={activeTab === "search" ? "droidalBlack.400" : "transparent"}
                borderTopRadius="md"
                borderBottom="none"
                letterSpacing={"widest"}
                color={
                  activeTab === "search" ? "primary.400" : "droidalGray.400"
                }
                fontWeight={activeTab === "search" ? "semibold" : "medium"}
                onClick={() => setActiveTab("search")}
              >
                Search Other
              </Box>
            </Flex>

            {/* Content Area */}
            <Box p={6} bg="droidalBlack.300" minH="200px">
              {activeTab === "common" && (
                <VStack
                  gap={0}
                  align="stretch"
                  bg="droidalBlack.400"
                  borderRadius="md"
                  overflow="hidden"
                >
                  <Flex
                    justify="space-between"
                    align="center"
                    p={3}
                    borderBottom="1px solid"
                    borderColor="whiteAlpha.100"
                  >
                    <Box flex={1}>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="droidalGray.400"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Insurance Name
                      </Text>
                    </Box>
                    <Box w="100px">
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="droidalGray.400"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Payer ID
                      </Text>
                    </Box>
                    <Box w="150px">
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="droidalGray.400"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Clearinghouse
                      </Text>
                    </Box>
                    <Box w="18px" />
                  </Flex>
                  <Box overflowY="auto" maxH="250px">
                    {commonPayers.map((item, index) => (
                      <Flex
                        key={item.payer.primaryPayerId}
                        justify="space-between"
                        align="center"
                        p={3}
                        borderBottom={
                          index !== commonPayers.length - 1
                            ? "1px solid"
                            : "none"
                        }
                        borderColor="whiteAlpha.100"
                      >
                        <HStack flex={1} gap={2}>
                          <Avatar.Root shape="rounded" size="2xs">
                            <Avatar.Image
                              src={item.payer.avatarUrl}
                              alt={
                                item.matches?.displayName ||
                                item.payer.displayName
                              }
                            />
                            <Avatar.Fallback
                              name={
                                item.matches?.displayName ||
                                item.payer.displayName
                              }
                            />
                          </Avatar.Root>
                          <Text fontSize="sm">{item.payer.displayName}</Text>
                        </HStack>
                        <Box w="100px">
                          <Text fontSize="sm" color="droidalGray.400">
                            #{item.payer.primaryPayerId}
                          </Text>
                        </Box>
                        <Box w="150px">
                          <Text fontSize="sm" color="droidalGray.400">
                            Stedi
                          </Text>
                        </Box>
                        <Box
                          cursor="pointer"
                          onClick={() =>
                            handleAdd({
                              id: item.payer.primaryPayerId,
                              name: item.payer.displayName,
                              type: "TriZetto",
                              stedi_id: item.payer.stediId,
                              coverage_type: item.payer.coverageTypes,
                              stedi_response: item,
                            })
                          }
                          color="droidalGray.400"
                          _hover={{ color: "white" }}
                        >
                          <Plus size={18} />
                        </Box>
                      </Flex>
                    ))}
                  </Box>
                </VStack>
              )}

              {activeTab === "search" && (
                <VStack
                  gap={2}
                  align="stretch"
                  bg="droidalBlack.300"
                  borderRadius="md"
                >
                  <Flex gap={2} align="center">
                    <Text
                      minW="80px"
                      fontSize="sm"
                      fontWeight={"light"}
                      color="white"
                    >
                      Insurance
                    </Text>
                    <CustomInput
                      placeholder="Type Insurance Name or ID"
                      size="sm"
                      value={searchQuery}
                      bgColor="blackAlpha.400"
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <CustomButton
                      size="sm"
                      variant="outline"
                      color="white"
                      borderColor="whiteAlpha.300"
                    >
                      Add
                    </CustomButton>
                  </Flex>
                  <Flex gap={2} align="center">
                    <Flex gap={2} align="center" flex={1}>
                      <Text
                        minW="40px"
                        fontWeight={"light"}
                        fontSize="sm"
                        color="white"
                      >
                        Type
                      </Text>
                      {/* Mock Select using Button style for now or Input */}
                      <CustomInput
                        value="Professional CMS-1500"
                        readOnly
                        size="sm"
                        bg="blackAlpha.400"
                        borderColor="whiteAlpha.300"
                      />
                    </Flex>
                    <Flex gap={2} align="center" flex={1}>
                      <Text
                        minW="80px"
                        fontWeight={"light"}
                        fontSize="sm"
                        color="white"
                        flexShrink={0}
                      >
                        Clearinghouse
                      </Text>
                      <CustomInput
                        value="Stedi"
                        readOnly
                        size="sm"
                        bg="blackAlpha.400"
                        borderColor="whiteAlpha.300"
                      />
                    </Flex>
                    <Flex gap={2} align="center" w="120px">
                      <Text
                        minW="40px"
                        fontSize="sm"
                        color="white"
                        fontWeight={"light"}
                      >
                        State
                      </Text>
                      <Input
                        value="ALL"
                        readOnly
                        size="sm"
                        bg="blackAlpha.400"
                        borderColor="whiteAlpha.300"
                      />
                    </Flex>
                  </Flex>

                  {/* Search Results */}
                  {searchPayers.length > 0 && (
                    <VStack
                      gap={0}
                      align="stretch"
                      bg="droidalBlack.400"
                      borderRadius="md"
                      overflow="hidden"
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        p={3}
                        borderBottom="1px solid"
                        borderColor="whiteAlpha.100"
                      >
                        <Box flex={1}>
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="droidalGray.400"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Insurance Name
                          </Text>
                        </Box>
                        <Box w="100px">
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="droidalGray.400"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Payer ID
                          </Text>
                        </Box>
                        <Box w="150px">
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="droidalGray.400"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Clearinghouse
                          </Text>
                        </Box>
                        <Box w="18px" />
                      </Flex>
                      <Box height={"200px"} overflowY={"auto"}>
                        {searchPayers.map((item, index) => (
                          <Flex
                            key={item.payer.primaryPayerId}
                            justify="space-between"
                            align="center"
                            p={3}
                            borderBottom={
                              index !== searchPayers.length - 1
                                ? "1px solid"
                                : "none"
                            }
                            borderColor="whiteAlpha.100"
                          >
                            <HStack flex={1} gap={2}>
                              <Avatar.Root shape="rounded" size="2xs">
                                <Avatar.Image
                                  src={item.payer.avatarUrl}
                                  alt={
                                    item.matches?.displayName ||
                                    item.payer.displayName
                                  }
                                />
                                <Avatar.Fallback
                                  name={
                                    item.matches?.displayName ||
                                    item.payer.displayName
                                  }
                                />
                              </Avatar.Root>
                              <Text fontSize="sm">
                                {item.payer.displayName}
                              </Text>
                            </HStack>
                            <Box w="100px">
                              <Text fontSize="sm" color="droidalGray.400">
                                #{item.payer.primaryPayerId}
                              </Text>
                            </Box>
                            <Box w="150px">
                              <Text fontSize="sm" color="droidalGray.400">
                                Stedi
                              </Text>
                            </Box>
                            <Box
                              cursor="pointer"
                              onClick={() =>
                                handleAdd({
                                  id: item.payer.primaryPayerId,
                                  name: item.payer.displayName,
                                  type: "TriZetto",
                                  stedi_id: item.payer.stediId,
                                  coverage_type: item.payer.coverageTypes,
                                  stedi_response: item.payer,
                                })
                              }
                              color="droidalGray.400"
                              _hover={{ color: "white" }}
                            >
                              <Plus size={18} />
                            </Box>
                          </Flex>
                        ))}
                      </Box>
                    </VStack>
                  )}
                </VStack>
              )}
            </Box>

            {/* Selected Insurances */}
            <Box p={6} pt={0} borderRadius="xl" bg="droidalBlack.300">
              <Text fontSize="md" fontWeight="semibold" mb={3}>
                Selected Insurances ({selectedInsurances.length})
              </Text>
              {selectedInsurances.length > 0 && (
                <Flex justify="space-between" align="center" px={2} mb={2}>
                  <Box flex={1}>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="droidalGray.400"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Insurance Name
                    </Text>
                  </Box>
                  <Box w="100px">
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="droidalGray.400"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Payer ID
                    </Text>
                  </Box>
                  <Box w="150px">
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="droidalGray.400"
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Clearinghouse
                    </Text>
                  </Box>
                  <Box w="16px" />
                </Flex>
              )}

              <VStack gap={2} align="stretch">
                {selectedInsurances.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    py={8}
                    bg="droidalBlack.400"
                    borderRadius="md"
                    border="1px dashed"
                    borderColor="whiteAlpha.200"
                  >
                    <Text color="droidalGray.400" fontSize="sm">
                      No insurance selected
                    </Text>
                  </Flex>
                ) : (
                  selectedInsurances.map((item) => (
                    <Flex
                      key={item.id}
                      justify="space-between"
                      align="center"
                      p={2}
                      bg="droidalBlack.300"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                    >
                      <HStack gap={3} flex={1}>
                        {item.warning && (
                          <AlertCircle size={16} color="#ECC94B" />
                        )}{" "}
                        {/* Yellow warning */}
                        <Text
                          fontSize="sm"
                          color={item.warning ? "droidalBlack.300" : "white"}
                        >
                          {item.name}
                        </Text>
                      </HStack>
                      <Box w="100px">
                        <Text fontSize="sm" color="droidalGray.400">
                          #{item.id}
                        </Text>
                      </Box>
                      <Box w="150px">
                        <Text fontSize="sm" color="droidalGray.400">
                          Stedi
                        </Text>
                      </Box>
                      <Box
                        cursor="pointer"
                        onClick={() => handleRemove(item.id)}
                        color="droidalGray.400"
                        _hover={{ color: "red.400" }}
                      >
                        <X size={16} />
                      </Box>
                    </Flex>
                  ))
                )}
              </VStack>

              <Text
                fontSize="sm"
                color="blue.400"
                mt={4}
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
              >
                Learn more about enrollments
              </Text>

              {/* Footer Buttons */}
              <HStack mt={6} justify="flex-end" gap={4}>
                <CustomButton
                  bg="#FF7F50" // Orange-ish color from screenshot
                  _hover={{ bg: "#E06A40" }}
                  color="white"
                  px={8}
                  onClick={handleSave}
                  isLoading={isPending}
                >
                  Save
                </CustomButton>
                <CustomButton
                  cursor="pointer"
                  variant="plain"
                  onClick={onClose}
                >
                  Cancel
                </CustomButton>
              </HStack>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddNewInsurance;
