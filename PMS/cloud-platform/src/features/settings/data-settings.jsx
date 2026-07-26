import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import UnauthorizedPage from "@/pages/unauthorized";

import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  Switch,
  Select,
  Button,
  Separator,
  Badge,
  Flex,
  SimpleGrid,
  Alert,
  Dialog,
  Heading,
  Progress,
} from "@chakra-ui/react";
import {
  Database as LuDatabase,
  Clock as LuClock,
  Shield as LuShield,
  Trash2 as LuTrash2,
  Settings as LuSettings,
  SunMoon as LuMoon,
  CloudSun as LuSun,
  User as LuUser,
  Mail as LuMail,
  Activity as LuActivity,
  LucideAlertTriangle,
  LucideCheckCircle,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuDownload } from "react-icons/lu";

const DataSettings = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {},
  });
  const { hasPermission } = usePermissions();

  const [settings, setSettings] = useState([
    {
      id: "user-activity",
      name: "User Activity Logs",
      description: "Browser sessions, page views, and user interactions",
      enabled: true,
      period: "90",
      dataSize: "2.4 GB",
      lastCleaned: "2 days ago",
    },
    {
      id: "error-logs",
      name: "Error & Debug Logs",
      description: "Application errors, warnings, and debugging information",
      enabled: true,
      period: "30",
      dataSize: "456 MB",
      lastCleaned: "1 day ago",
    },
    {
      id: "analytics",
      name: "Analytics Data",
      description: "Performance metrics, user behavior, and usage statistics",
      enabled: false,
      period: "365",
      dataSize: "5.2 GB",
      lastCleaned: "7 days ago",
    },
    {
      id: "temporary-files",
      name: "Temporary Files",
      description: "Cache files, uploads, and processing artifacts",
      enabled: true,
      period: "7",
      dataSize: "1.8 GB",
      lastCleaned: "12 hours ago",
    },
  ]);

  const [autoCleanup, setAutoCleanup] = useState(true);
  const [exportBeforeDelete, setExportBeforeDelete] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(true);

  const updateSetting = (id, field, value) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, [field]: value } : setting
      )
    );
  };

  const getTotalDataSize = () => {
    return settings.reduce((total, setting) => {
      const size = parseFloat(setting.dataSize.replace(/[^\d.]/g, ""));
      const unit = setting.dataSize.includes("GB") ? 1024 : 1;
      return total + size * unit;
    }, 0);
  };

  const handleExportData = () => {
    toaster.create({
      title: "Export Started",
      description:
        "Your data export is being prepared. You'll receive an email when it's ready.",
      status: "info",
      duration: 4000,
    });
  };

  const handleCleanupNow = () => {
    toaster.create({
      title: "Cleanup Initiated",
      description:
        "Data cleanup is running in the background. This may take a few minutes.",
      status: "success",
      duration: 4000,
    });
  };

  if (!hasPermission("data_settings", "view")) return <UnauthorizedPage />;

  return (
    <>
      <Card.Root
        bgColor={"droidalBlack.300"}
        borderColor={"#2f4d78"}
        color="white"
        w={"full"}
        bg={"droidalBlack.300"}
        pb="4"
        border="none"
      >
        <Card.Header
          color="white"
          letterSpacing={"widest"}
          fontSize={"xl"}
          fontWeight={"semibold"}
        >
          Data Settings
        </Card.Header>
        <Card.Body>
          <Box maxW={"8xl"} mx={"auto"} w="full" p={6}>
            <VStack gap={8} align="stretch">
              {/* Header */}
              <Box>
                <Text color="white" letterSpacing={"wider"} fontSize="lg">
                  Configure how long different types of data are stored and
                  manage cleanup policies.
                </Text>
              </Box>

              {/* Overview Stats */}
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                <Card.Root
                  bgColor={"droidalBlack.300"}
                  borderColor={"#2f4d78"}
                  color="white"
                >
                  <Card.Body>
                    <VStack align="start" gap={1}>
                      <Text
                        fontSize={{
                          base: "sm",
                          "2xl": "md",
                          "3xl": "lg",
                        }}
                        letterSpacing="widest"
                        color="white"
                      >
                        Total Data Stored
                      </Text>
                      <Text
                        fontSize={{
                          base: "2xl",
                          "2xl": "3xl",
                          "3xl": "4xl",
                        }}
                        fontWeight="200"
                        className="text-transparent bg-clip-text transition-colors"
                        bgImage="var(--bg-blue-gradient)"
                      >
                        {getTotalDataSize().toFixed(1)} GB
                      </Text>
                      <Text fontSize="sm" color="#90a6c6">
                        Across all categories
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  bgColor={"droidalBlack.300"}
                  borderColor={"#2f4d78"}
                  color="white"
                >
                  <Card.Body>
                    <VStack align="start" gap={1}>
                      <Text
                        color="white"
                        fontSize={{
                          base: "sm",
                          "2xl": "md",
                          "3xl": "lg",
                        }}
                        letterSpacing="widest"
                      >
                        Active Policies
                      </Text>
                      <Text
                        fontSize={{
                          base: "2xl",
                          "2xl": "3xl",
                          "3xl": "4xl",
                        }}
                        fontWeight="200"
                        className="text-transparent bg-clip-text transition-colors"
                        bgImage="var(--bg-pending-gradient)"
                      >
                        {settings.filter((s) => s.enabled).length}
                      </Text>
                      <Text fontSize="sm" color="#90a6c6">
                        Out of {settings.length} total
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                <Card.Root
                  bgColor={"droidalBlack.300"}
                  borderColor={"#2f4d78"}
                  color="white"
                >
                  <Card.Body>
                    <VStack align="start" gap={1}>
                      <Text
                        fontSize={{
                          base: "sm",
                          "2xl": "md",
                          "3xl": "lg",
                        }}
                        letterSpacing="widest"
                        color={"white"}
                      >
                        Last Cleanup
                      </Text>
                      <Text
                        fontSize={{
                          base: "2xl",
                          "2xl": "3xl",
                          "3xl": "4xl",
                        }}
                        fontWeight="200"
                        className="text-transparent bg-clip-text transition-colors"
                        bgImage="var(--bg-green-gradient)"
                      >
                        2 hours ago
                      </Text>
                      <Text fontSize="sm" color="#90a6c6">
                        Next: Tomorrow at 2 AM
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </SimpleGrid>

              {/* Global Settings */}
              <Card.Root
                bgColor={"droidalBlack.300"}
                borderColor={"#2f4d78"}
                color="white"
              >
                <Card.Header>
                  <HStack gap={2}>
                    <Heading
                      size={{
                        base: "sm",
                        "2xl": "md",
                        "3xl": "lg",
                      }}
                      letterSpacing="widest"
                    >
                      Global Settings
                    </Heading>
                  </HStack>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4} align="stretch">
                    <HStack justify="space-between">
                      <Box>
                        <Text fontWeight="medium">Automatic Cleanup</Text>
                        <Text fontSize="sm" color="#90a6c6">
                          Automatically delete expired data based on retention
                          policies
                        </Text>
                      </Box>
                      <Switch.Root
                        checked={autoCleanup}
                        onCheckedChange={(e) => setAutoCleanup(e.checked)}
                      >
                        <Switch.HiddenInput />
                        <Switch.Control
                          bgColor={"#000 !important"}
                          _checked={{
                            bgImage:
                              "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%) !important",
                          }}
                        />
                      </Switch.Root>
                    </HStack>

                    <HStack justify="space-between">
                      <Box>
                        <Text fontWeight="medium">Export Before Delete</Text>
                        <Text fontSize="sm" color="#90a6c6">
                          Create backup exports before data is permanently
                          deleted
                        </Text>
                      </Box>

                      <Switch.Root
                        checked={exportBeforeDelete}
                        onCheckedChange={(e) =>
                          setExportBeforeDelete(e.checked)
                        }
                      >
                        <Switch.HiddenInput />
                        <Switch.Control
                          bgColor={"#000 !important"}
                          _checked={{
                            bgImage:
                              "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%) !important",
                          }}
                        />
                      </Switch.Root>
                    </HStack>

                    <HStack justify="space-between">
                      <Box>
                        <Text fontWeight="medium">Confirmation Required</Text>
                        <Text fontSize="sm" color="#90a6c6">
                          Require manual confirmation for bulk data deletions
                        </Text>
                      </Box>
                      <Switch.Root
                        checked={confirmationRequired}
                        onCheckedChange={(e) =>
                          setConfirmationRequired(e.checked)
                        }
                      >
                        <Switch.HiddenInput />
                        <Switch.Control
                          bgColor={"#000 !important"}
                          _checked={{
                            bgImage:
                              "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%) !important",
                          }}
                        />
                      </Switch.Root>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Data Categories */}
              <Card.Root
                bgColor={"droidalBlack.300"}
                borderColor={"#2f4d78"}
                color="white"
              >
                <Card.Header>
                  <HStack justify="space-between">
                    <HStack gap={2}>
                      <Heading
                        size={{
                          base: "sm",
                          "2xl": "md",
                          "3xl": "lg",
                        }}
                        letterSpacing="widest"
                      >
                        Retention Policies
                      </Heading>
                    </HStack>
                    <HStack gap={3}>
                      <Dialog.Root>
                        <Dialog.Trigger asChild>
                          <CustomButton
                            leftIcon={<LuTrash2 />}
                            colorPalette="red"
                            borderColor="none"
                            variant="outline"
                          >
                            Cleanup Now
                          </CustomButton>
                        </Dialog.Trigger>
                        <Dialog.Content>
                          <Dialog.Header>
                            <Dialog.Title>
                              <HStack gap={2}>
                                <LucideAlertTriangle color="var(--chakra-colors-orange-500)" />
                                <Text>Confirm Data Cleanup</Text>
                              </HStack>
                            </Dialog.Title>
                          </Dialog.Header>
                          <Dialog.Body>
                            <VStack gap={4} align="stretch">
                              <Alert status="warning">
                                <LucideAlertTriangle />
                                This action will permanently delete expired data
                                according to your retention policies.
                              </Alert>

                              <Box>
                                <Text fontWeight="medium" mb={2}>
                                  Data to be cleaned:
                                </Text>
                                <VStack align="stretch" gap={1}>
                                  {settings
                                    .filter((s) => s.enabled)
                                    .map((setting) => (
                                      <HStack
                                        key={setting.id}
                                        justify="space-between"
                                      >
                                        <Text fontSize="sm">
                                          {setting.name}
                                        </Text>
                                        <Text fontSize="sm" color="#90a6c6">
                                          ~{setting.dataSize}
                                        </Text>
                                      </HStack>
                                    ))}
                                </VStack>
                              </Box>

                              {exportBeforeDelete && (
                                <Alert status="info">
                                  <LucideCheckCircle />
                                  Data will be exported before deletion as per
                                  your settings.
                                </Alert>
                              )}
                            </VStack>
                          </Dialog.Body>
                          <Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </Dialog.CloseTrigger>
                            <Button
                              colorPalette="orange"
                              onClick={handleCleanupNow}
                            >
                              Start Cleanup
                            </Button>
                          </Dialog.Footer>
                          <Dialog.CloseTrigger />
                        </Dialog.Content>
                      </Dialog.Root>
                    </HStack>
                  </HStack>
                </Card.Header>
                <Card.Body>
                  <VStack gap={6} align="stretch">
                    {settings.map((setting, index) => (
                      <Box key={setting.id}>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" gap={1} flex={1}>
                            <HStack gap={2}>
                              <Text fontWeight="semibold" fontSize="lg">
                                {setting.name}
                              </Text>
                              <Badge
                                colorPalette={
                                  setting.enabled ? "green" : "gray"
                                }
                              >
                                {setting.enabled ? "Active" : "Disabled"}
                              </Badge>
                            </HStack>
                            <Text color="#90a6c6" fontSize="sm">
                              {setting.description}
                            </Text>
                            <HStack gap={4} fontSize="sm" color="#90a6c6">
                              <Text>Size: {setting.dataSize}</Text>
                              <Text>Last cleaned: {setting.lastCleaned}</Text>
                            </HStack>
                          </VStack>

                          <VStack align="end" gap={3}>
                            <Switch.Root
                              checked={setting.enabled}
                              onCheckedChange={(e) =>
                                updateSetting(setting.id, "enabled", e.checked)
                              }
                            >
                              <Switch.HiddenInput />
                              <Switch.Control
                                bgColor={"#000 !important"}
                                _checked={{
                                  bgImage:
                                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%) !important",
                                }}
                              />
                            </Switch.Root>

                            <HStack gap={2}>
                              <Text fontSize="sm" color="white">
                                Retain for:
                              </Text>

                              <CustomSelect
                                size="sm"
                                width="100px"
                                value={[setting.period]}
                                onValueChange={(e) =>
                                  updateSetting(
                                    setting.id,
                                    "period",
                                    e.value[0]
                                  )
                                }
                                options={[
                                  { value: "7", label: "7 days" },
                                  { value: "30", label: "30 days" },
                                  { value: "90", label: "90 days" },
                                  { value: "180", label: "6 months" },
                                  { value: "365", label: "1 year" },
                                  { value: "730", label: "2 years" },
                                ]}
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
                            </HStack>
                          </VStack>
                        </HStack>

                        {setting.enabled && (
                          <Box mt={3}>
                            <HStack
                              justify="space-between"
                              fontSize="xs"
                              color="#90a6c6"
                              mb={1}
                            >
                              <Text>Retention Progress</Text>
                              <Text>{setting.period} days remaining</Text>
                            </HStack>
                            {/* <Progress.Root
                              value={75}
                              size="sm"
                              colorPalette={
                                parseInt(setting.period) < 30
                                  ? "red"
                                  : parseInt(setting.period) < 90
                                  ? "yellow"
                                  : "green"
                              }
                            >
                              <Progress.Bar />
                            </Progress.Root> */}
                          </Box>
                        )}

                        {index < settings.length - 1 && (
                          <Separator borderColor="#2f4d78" mt={6} />
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Security Notice */}
              {/* <Alert status="info">
                <LuShield />
                <Box>
                  <Text fontWeight="bold">Data Security Notice</Text>
                  <Text>
                    All data deletions are permanent and cannot be undone.
                    Ensure you have proper backups before configuring aggressive
                    retention policies. Sensitive data is encrypted before
                    deletion.
                  </Text>
                </Box>
              </Alert> */}

              {/* Action Buttons */}
              <HStack justify="flex-end">
                <HStack gap={3}>
                  <CustomButton variant="outline">
                    Reset to Defaults
                  </CustomButton>
                  <CustomButton colorPalette="blue">Save Changes</CustomButton>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        </Card.Body>
        {/* <form onSubmit={handleSubmit(onSubmit)}>
          <Card.Body>
            <SimpleGrid columns={3} gap={4}>
              <CustomInput
                label={"Email for Alerts:"}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                invalid={!!errors.email}
                showError={!!errors.email}
                errorMessage="Enter a valid email"
              />
              <CustomInput
                label="Mobile Number"
                {...register("mobileNumber", {
                  required: "Mobile number is required",
                })}
                invalid={!!errors.mobileNumber}
                showError={!!errors.mobileNumber}
                errorMessage="Enter a valid mobile number"
              />
            </SimpleGrid>
          </Card.Body>
          <Card.Footer display={"flex"} justifyContent={"flex-end"}>
            <CustomButton type="submit">Save</CustomButton>
          </Card.Footer>
        </form> */}
      </Card.Root>
    </>
  );
};

export default DataSettings;
