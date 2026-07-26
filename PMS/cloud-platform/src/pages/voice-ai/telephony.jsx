import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  IconButton,
  Checkbox,
  Tooltip,
  SegmentGroup,
  Spinner,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
import { Phone, X, Plus, Info, Minus } from "lucide-react";
import { Slider } from "../../components/ui/slider";
import CustomButton from "@/components/button/button";
import { toaster } from "@/components/ui/toaster";

import VoiceAiHeader from "./components/voice-ai-header";
import { useGetAgentVersions } from "../../hooks/query/useGetAgentVersions";
import { useGetTelephonySettings } from "../../hooks/query/voiceai/useGetTelephonySettings";
import { useUpdateTelephonySettings } from "../../hooks/mutation/voiceai/useUpdateTelephonySettings";
import { useCreateAgentVersion } from "../../hooks/mutation/useCreateAgentVersion";
import { useCreateTelephonySettings } from "../../hooks/mutation/voiceai/useCreateTelephonySettings";
import { useUpdateAgentVersion } from "../../hooks/mutation/useUpdateAgentVersion";
import { useCloneAgentVersion } from "@/hooks/mutation/useCloneAgentVersion";
import { atobAgentId } from "@/utils/helper";
import { color } from "highcharts";
import {
  useBuyNumbers,
  useGetNumbers,
} from "@/hooks/query/voiceai/useGetBuyNumbers";

/* -------------------------------
   Initial Form State
-------------------------------- */
const initialFormData = {
  phone_number: [],
  inbound_enabled: true,
  outbound_enabled: true,
  primary_phone_number: null,
  transport_type: "PSTN",
  max_concurrent_calls: 50,
  call_timeout: 30,
  max_inbound_ring_duration: 30,
};

export default function TelephonySettings() {
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [showAvailablePicker, setShowAvailablePicker] = useState(true);
  const [buyableNumbers, setBuyableNumbers] = useState([]);
  const [showBuyPicker, setShowBuyPicker] = useState(false);

  const { agent_app } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = atobAgentId(agent_app);
  // Fetch Agent Versions to find the correct Telephony Settings ID
  const { data: versionsResponse } = useGetAgentVersions(agentId);
  const versions = versionsResponse;

  const versionParam = searchParams.get("version");

  // Prefer param version, then "Draft", otherwise take the first available version
  const activeVersion = useMemo(() => {
    if (!versions?.length) return null;
    if (versionParam) {
      const found = versions.find((v) => v.version_number === versionParam);
      if (found) return found;
    }
    return null;
  }, [versions, versionParam]);

  console.log("activeVersion", activeVersion, versions);

  const telephonyId = activeVersion?.Telephony_Settings_id;

  // Fetch Telephony Settings
  const { data: telephonyResponse, isLoading } =
    useGetTelephonySettings(telephonyId);
  const telephonyData = telephonyResponse;

  console.log(
    "telephonyData99888",
    activeVersion,
    telephonyId,
    telephonyResponse,
    telephonyData,
  );

  // Mutation for updating
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateTelephonySettings();

  const { mutateAsync: createAgentVersionAsync, isPending: isCreatingVersion } =
    useCreateAgentVersion();
  const { mutateAsync: createTelephony } = useCreateTelephonySettings();
  const { mutateAsync: updateAgentVersion } = useUpdateAgentVersion();
  const { mutateAsync: cloneVersion, isPending: isCloning } =
    useCloneAgentVersion();

  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: initialFormData,
  });

  const { data, isGetting } = useGetNumbers();
  const { mutateAsync: buyNumbers } = useBuyNumbers();

  console.log("data1212", data);

  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [showPhones, setShowPhones] = useState(false);

  useEffect(() => {
    setAvailableNumbers(data);
  }, [buyNumbers]);

  // Watch all fields to keep UI in sync
  const formData = watch();

  // Update form when data is fetched
  useEffect(() => {
    if (telephonyData) {
      reset(telephonyData);
    }
  }, [telephonyData, reset]);

  const getNextVersion = (versionsList) => {
    if (!versionsList || versionsList.length === 0) return "1.0";

    const versionNumbers = versionsList
      .map((v) => v.version_number)
      .filter((v) => v && v)
      .map((v) => parseFloat(v.replace("v", "")))
      .filter((v) => !isNaN(v));

    if (versionNumbers.length === 0) return "1.0";

    const maxVersion = Math.max(...versionNumbers);
    const nextVersion = (maxVersion + 0.1).toFixed(1);
    return `${nextVersion}`;
  };

  const handleSaveAsNewVersion = async (data) => {
    if (!versions || versions.length === 0) {
      toaster.error({
        title: "Error",
        description:
          "Please save the initial version first before creating a new version.",
      });
      return;
    }

    if (!data.phone_number || data.phone_number.length === 0) {
      toaster.error({
        title: "Validation Error",
        description: "At least one phone number is required.",
      });
      return;
    }

    try {
      const nextVersion = getNextVersion(versions);
      const sourceVersion =
        activeVersion || (versions && versions.length > 0 ? versions[0] : null);

      await cloneVersion({
        app: agentId,
        version_number: nextVersion,
        source_version_id: sourceVersion?.id,
        telephony_updates: data,
      });

      toaster.success({
        title: "Success",
        description: `Version ${nextVersion} created successfully!`,
      });

      // 4. Update URL
      setSearchParams({ version: nextVersion });
    } catch (error) {
      console.error("Save as new version error:", error);
      toaster.error({
        title: "Error",
        description: "Failed to save as new version.",
      });
    }
  };

  const handleSave = async (data) => {
    if (!data.phone_number || data.phone_number.length === 0) {
      toaster.error({
        title: "Validation Error",
        description: "At least one phone number is required.",
      });
      return;
    }

    if (!data.inbound_enabled && !data.outbound_enabled) {
      toaster.error({
        title: "Validation Error",
        description:
          "At least one call direction (Inbound or Outbound) must be enabled.",
      });
      return;
    }

    console.log("activeVersion1212", activeVersion);

    if (telephonyId) {
      updateSettings(
        { id: telephonyId, ...data },
        {
          onSuccess: () => {
            toaster.success({
              title: "Success",
              description: "Telephony settings updated successfully.",
            });
          },
          onError: (error) => {
            console.error(error);
            toaster.error({
              title: "Error",
              description: "Failed to update telephony settings.",
            });
          },
        },
      );
    } else if (activeVersion) {
      // Create Telephony Settings
      try {
        const res = await createTelephony(data);
        const newTelephonyId = res?.data?.id;
        if (newTelephonyId) {
          await updateAgentVersion({
            id: activeVersion.id,
            data: { Telephony_Settings_id: newTelephonyId },
          });
          toaster.success({
            title: "Success",
            description: "Telephony settings created and linked.",
          });
        }
      } catch (error) {
        console.error(error);
        toaster.error({
          title: "Error",
          description: "Failed to create telephony settings.",
        });
      }
    } else {
      // Handle case where no version exists
      if (versionsResponse && versions?.length === 0) {
        try {
          const versionRes = await createAgentVersionAsync({
            app: agentId,
            version_number: "1.0",
            status: "Draft",
          });

          const newVersionId = versionRes?.data?.id;

          if (newVersionId) {
            const telephonyRes = await createTelephony(data);
            const newTelephonyId = telephonyRes?.data?.id;

            if (newTelephonyId) {
              await updateAgentVersion({
                id: newVersionId,
                data: { Telephony_Settings_id: newTelephonyId },
              });

              setSearchParams({ version: "1.0" });
              toaster.success({
                title: "Success",
                description: "Agent version created and settings saved.",
              });
            }
          }
        } catch (error) {
          console.error(error);
          toaster.error({
            title: "Error",
            description: "Failed to create agent version or settings.",
          });
        }
      } else {
        console.error("No Telephony ID found to update");
      }
    }
  };

  const resetForm = () => {
    if (telephonyData) {
      reset(telephonyData);
    } else {
      reset(initialFormData);
    }
    setNewPhoneNumber("");
  };

  if ((isLoading || isCreatingVersion) && !telephonyData) {
    return (
      <Box p={6} display="flex" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  return (
    <>
      <VoiceAiHeader
        onSaveAsNewVersion={handleSubmit(handleSaveAsNewVersion)}
        isSaveLoading={isCloning}
      />
      <Box p={6} rounded="2xl" bg="#1e1e1e" color="white">
        <VStack spacing={8} align="stretch">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom="1px solid"
            borderColor="gray.700"
            pb={4}
          >
            <Text fontSize="xl">Phone Settings</Text>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={8}>
            {/* Buy Phone Numbers */}
            <Box
              border="1px solid"
              borderColor="whiteAlpha.200"
              rounded="lg"
              p={4}
              maxWidth="2xl"
              maxH={"40vh"}
              overflow={"auto"}
            >
              <HStack>
                <button
                  type="button"
                  onClick={() => {
                    // Simulate provider inventory

                    setShowBuyPicker((s) => !s);
                    setBuyableNumbers(getnumbers);
                  }}
                  className="flex items-center justify-between w-full text-sm text-neutral-300"
                >
                  <span>Buy Phone Numbers</span>
                  <span className="text-xs">
                    {showPhones ? "Hide" : "Show"}
                  </span>
                </button>
              </HStack>

              {/* BUYABLE NUMBERS LIST */}
              {showBuyPicker && (
                <VStack spacing={2} mt={4} align="stretch">
                  {buyableNumbers.map((number) => (
                    <HStack key={number}>
                      <Box
                        flex={1}
                        px={3}
                        py={2}
                        rounded="md"
                        border="1px dashed"
                        borderColor="whiteAlpha.300"
                      >
                        <Text fontSize="sm">{number}</Text>
                      </Box>

                      <IconButton
                        size="sm"
                        aria-label="Buy number"
                        onClick={() => {
                          // Move → Available

                          buyNumbers({ phone_number: number });

                          toaster.success({
                            title: "Number Purchased",
                            description: `${number} added to available numbers`,
                          });
                        }}
                      >
                        <Plus size={14} />
                      </IconButton>
                    </HStack>
                  ))}

                  {buyableNumbers.length === 0 && (
                    <Text fontSize="sm" color="gray.500">
                      No more numbers available to buy.
                    </Text>
                  )}
                </VStack>
              )}
            </Box>

            {/* Phone Numbers */}
            <Box
              border="1px solid"
              borderColor="whiteAlpha.200"
              maxWidth="2xl"
              rounded="lg"
              p={3}
              maxH={"40vh"}
              overflow={"auto"}
            >
              <button
                type="button"
                onClick={() => setShowPhones((s) => !s)}
                className="flex items-center justify-between w-full text-sm text-neutral-300"
              >
                <span>
                  Phone Numbers ({formData.phone_number?.length || 0})
                </span>
                <span className="text-xs">{showPhones ? "Hide" : "Show"}</span>
              </button>

              {showPhones && (
                <VStack spacing={4} align="stretch" mt={4}>
                  {/* OWNED NUMBERS */}
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={2}>
                      Assigned Numbers (click to select)
                    </Text>

                    {formData.phone_number?.map((number, index) => {
                      const selected = formData.primary_phone_number === number;

                      return (
                        <HStack key={index}>
                          <HStack
                            flex={1}
                            px={3}
                            py={2}
                            rounded="md"
                            cursor="pointer"
                            border="2px solid"
                            borderColor={"whiteAlpha.200"}
                            bg={"whiteAlpha.100"}
                            onClick={() =>
                              setValue("primary_phone_number", number)
                            }
                          >
                            <Phone size={14} />
                            <Text fontSize="sm">{number}</Text>
                            {/* {selected && (
                          <Text fontSize="xs" color="blue.300">
                            (Primary)
                          </Text>
                        )} */}
                          </HStack>

                          <IconButton
                            size="sm"
                            aria-label="Remove phone"
                            onClick={() => {
                              const updatedOwned = formData.phone_number.filter(
                                (_, i) => i !== index,
                              );

                              // 1️⃣ Remove from owned
                              setValue("phone_number", updatedOwned);

                              // 2️⃣ Add back to available (if not already there)
                              // setAvailableNumbers((prev) =>
                              //   prev.includes(number)
                              //     ? prev
                              //     : [...prev, number],
                              // );

                              // 3️⃣ Fix primary selection if needed
                              if (formData.primary_phone_number === number) {
                                setValue(
                                  "primary_phone_number",
                                  updatedOwned[0] || null,
                                );
                              }
                            }}
                          >
                            <X size={14} />
                          </IconButton>
                        </HStack>
                      );
                    })}
                  </Box>

                  {/* AVAILABLE NUMBERS PICKER */}
                  {showAvailablePicker && (
                    <Box>
                      <Text fontSize="sm" color="gray.400" mb={2}>
                        Available Numbers
                      </Text>

                      {availableNumbers.length === 0 && (
                        <Text fontSize="sm" color="gray.500">
                          No available numbers. Buy one first.
                        </Text>
                      )}

                      {availableNumbers.map((number) => (
                        <HStack key={number}>
                          <Box
                            flex={1}
                            px={3}
                            py={2}
                            rounded="md"
                            border="1px dashed"
                            borderColor="whiteAlpha.300"
                          >
                            <Text fontSize="sm">{number}</Text>
                          </Box>

                          <IconButton
                            size="sm"
                            aria-label="Add phone"
                            onClick={() => {
                              const current = formData.phone_number || [];

                              if (current.includes(number)) return;

                              setValue("phone_number", [...current, number]);

                              if (!formData.primary_phone_number) {
                                setValue("primary_phone_number", number);
                              }

                              // setAvailableNumbers((prev) =>
                              //   prev.filter((n) => n !== number),
                              // );
                            }}
                          >
                            <Plus size={14} />
                          </IconButton>
                        </HStack>
                      ))}
                    </Box>
                  )}
                </VStack>
              )}
            </Box>
          </Box>

          {/* Main Settings Grid */}
          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={8}>
            {/* LEFT COLUMN */}
            <VStack align="stretch" spacing={6}>
              {/* Call Direction */}
              <Box>
                <Text mb={2} color="gray.300">
                  Call Direction{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>
                <HStack spacing={6}>
                  <Controller
                    control={control}
                    name="inbound_enabled"
                    render={({ field }) => (
                      <Checkbox.Root
                        variant="subtle"
                        colorPalette="white"
                        checked={field.value}
                        onCheckedChange={({ checked }) =>
                          field.onChange(checked)
                        }
                      >
                        <Checkbox.HiddenInput
                          ref={field.ref}
                          onBlur={field.onBlur}
                        />
                        <Checkbox.Control
                          _checked={{
                            bgImage:
                              "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                          }}
                          borderColor="#2f4d78"
                          bgColor={"black"}
                        />
                        <Checkbox.Label>Inbound</Checkbox.Label>
                      </Checkbox.Root>
                    )}
                  />

                  <Controller
                    control={control}
                    name="outbound_enabled"
                    render={({ field }) => (
                      <Checkbox.Root
                        variant="subtle"
                        colorPalette="white"
                        checked={field.value}
                        onCheckedChange={({ checked }) =>
                          field.onChange(checked)
                        }
                      >
                        <Checkbox.HiddenInput
                          ref={field.ref}
                          onBlur={field.onBlur}
                        />
                        <Checkbox.Control
                          _checked={{
                            bgImage:
                              "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                          }}
                          borderColor="#2f4d78"
                          bgColor={"black"}
                        />
                        <Checkbox.Label>Outbound</Checkbox.Label>
                      </Checkbox.Root>
                    )}
                  />
                </HStack>
              </Box>

              {/* Transport Type */}
              <Box>
                <Text mb={2} color="gray.300">
                  Transport Type
                </Text>

                <Controller
                  name="transport_type"
                  control={control}
                  render={({ field }) => (
                    <SegmentGroup.Root
                      size={{ base: "sm" }}
                      position="relative"
                      top="3px"
                      bgColor="#000"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v.value)}
                      css={{
                        '& [data-state="checked"]': {
                          bgImage: "var(--bg-blue-gradient)",
                          color: "#fff",
                          borderRadius: "14px",
                        },
                      }}
                    >
                      <SegmentGroup.Indicator />
                      <SegmentGroup.Items
                        cursor="pointer"
                        color="#fff"
                        items={[
                          { label: "PSTN", value: "PSTN" },
                          { label: "WebRTC", value: "WebRTC" },
                        ]}
                        css={{
                          borderRadius: "14px",
                        }}
                      />
                    </SegmentGroup.Root>
                  )}
                />
              </Box>
            </VStack>

            {/* RIGHT COLUMN */}
            <VStack align="stretch" spacing={6}>
              {/* Max Concurrent Calls */}
              <Box>
                <Text mb={2} color="gray.300">
                  Max Concurrent Calls
                </Text>

                <HStack spacing={4}>
                  <Controller
                    name="max_concurrent_calls"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        value={[field.value]}
                        min={0}
                        max={100}
                        w="150px"
                        onValueChange={(e) => field.onChange(e.value[0])}
                      />
                    )}
                  />
                  <Input
                    w="60px"
                    textAlign="center"
                    value={formData.max_concurrent_calls}
                    onChange={(e) =>
                      setValue("max_concurrent_calls", Number(e.target.value))
                    }
                  />
                </HStack>
              </Box>

              {/* Call Timeout */}
              <Box>
                <Text mb={2} color="gray.300">
                  Call Timeout (seconds)
                </Text>

                <HStack spacing={3}>
                  <IconButton
                    size="sm"
                    onClick={() =>
                      setValue(
                        "call_timeout",
                        Math.max(0, formData.call_timeout - 1),
                      )
                    }
                  >
                    <Minus size={14} />
                  </IconButton>

                  <Input
                    w="60px"
                    textAlign="center"
                    value={formData.call_timeout}
                    onChange={(e) =>
                      setValue("call_timeout", Number(e.target.value))
                    }
                  />

                  <IconButton
                    size="sm"
                    onClick={() =>
                      setValue("call_timeout", formData.call_timeout + 1)
                    }
                  >
                    <Plus size={14} />
                  </IconButton>
                </HStack>
              </Box>
            </VStack>

            {/* FULL WIDTH ROW */}
            <Box>
              <Text mb={2} color="gray.300">
                Max Inbound Ring Duration
              </Text>

              <HStack spacing={4}>
                <Controller
                  name="max_inbound_ring_duration"
                  control={control}
                  render={({ field }) => (
                    <Slider
                      value={[field.value]}
                      min={0}
                      max={60}
                      w="150px"
                      onValueChange={(e) => field.onChange(e.value[0])}
                    />
                  )}
                />
                <Input
                  w="60px"
                  textAlign="center"
                  value={formData.max_inbound_ring_duration}
                  onChange={(e) =>
                    setValue(
                      "max_inbound_ring_duration",
                      Number(e.target.value),
                    )
                  }
                />
              </HStack>
            </Box>
          </Box>

          {/* Footer */}
          <HStack justify="flex-end" spacing={3} pt={8}>
            <CustomButton variant="outline" onClick={resetForm}>
              Reset
            </CustomButton>
            <CustomButton onClick={handleSubmit(handleSave)} loading={isSaving}>
              Save
            </CustomButton>
          </HStack>
        </VStack>
      </Box>
    </>
  );
}
