import CustomSelect from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import EstimationChartCard from "@/features/droid-metrix/estimation-card";
import { useCreateROIProcess } from "@/hooks/mutation/roi/useCreateROIProcess";
import { useUpdateROIProcess } from "@/hooks/mutation/roi/useUpdateROIProcess";
import { useGetProcessData } from "@/hooks/query/roi/useGetProcessData";
import { useGetAgents } from "@/hooks/query/useGetAgents";
import { useGetDepartments } from "@/hooks/query/useGetDepartments";
import { Button, Card, HStack, Slider, Text, VStack } from "@chakra-ui/react";
import { Loader, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import UnauthorizedPage from "../unauthorized";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";

const initialProcessData = {
  department: null,
  agent: null,
  head_count: null,
  hours_spent: null,
  hourly_rate: null,
  avg_time: null,
  invoice_value: null,
  operational_model: "ONSITE ONLY",
  additional_load_cost: 0,
  onsite_head_count: null,
  onsite_hours_spent: null,
  onsite_hourly_rate: null,
  onsite_additional_load_cost: null,
  offshore_head_count: null,
  offshore_hours_spent: null,
  offshore_hourly_rate: null,
  offshore_additional_load_cost: null,
};

const ROIPage = () => {
  const { hasPermission } = usePermissions();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: initialProcessData,
  });
  const selectedDepartments = watch("department");
  const selectedAgent = watch("agent");
  const { data: departments = [] } = useGetDepartments();
  const { data: agents = [] } = useGetAgents({
    module_id: selectedDepartments,
  });

  const { mutate, isPending } = useCreateROIProcess();
  const { mutate: updateSettings, isPending: updatePending } =
    useUpdateROIProcess();
  const {
    data: processDetails,
    isLoading,
    isPlaceholderData,
  } = useGetProcessData({
    module_id: selectedDepartments,
    app_id: selectedAgent,
  });

  console.log("data12333", processDetails);

  const saveRoiData = async (payload) => {
    if (!hasPermission("roi_modify_calculation_settings", "create")) return;
    try {
      if (processDetails.id) {
        updateSettings(
          {
            ...payload,
            id: processDetails.id,
          },
          {
            onSuccess: () => {
              toaster.success({
                title: "Success",
                description: "ROI Data saved successfully",
              });
            },
            onError: (error) => {
              console.log("error", error);
              toaster.error({
                title: "Error",
                description: error.message || "Error creating agent",
              });
            },
          }
        );
        return;
      }
      mutate(
        {
          ...payload,
        },
        {
          onSuccess: () => {
            toaster.success({
              title: "Success",
              description: "ROI Data saved successfully",
            });
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error creating agent",
            });
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const onSubmit = (v) => {
    console.log("Form Values:", v);
    saveRoiData(v);
  };

  useEffect(() => {
    reset({
      ...processDetails,
      agent: selectedAgent,
      department: selectedDepartments,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processDetails, selectedAgent, selectedDepartments]);

  const operationalModelValue = watch("operational_model");

  if (!hasPermission("roi_estimated", "view")) return <UnauthorizedPage />;

  return (
    <VStack gap={6} align="stretch">
      <Card.Root bg="droidalBlack.300" color="white" border="none">
        <Card.Header
          letterSpacing={"widest"}
          fontSize={"lg"}
          fontWeight="normal"
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          flexDirection={"row"}
        >
          Estimated cost savings{" "}
          {isLoading && <Loader size={"16"} className="animate-spin" />}
        </Card.Header>
        <Card.Body>
          <EstimationChartCard processDetails={processDetails} />
        </Card.Body>
      </Card.Root>
      <Card.Root bg="droidalBlack.300" color="white" border="none">
        <Card.Header
          letterSpacing={"widest"}
          fontSize={"lg"}
          fontWeight="normal"
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          flexDirection={"row"}
        >
          Calculate estimated ROI{" "}
          {isLoading && <Loader size={"16"} className="animate-spin" />}
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Process */}
              <div>
                <label
                  htmlFor="process"
                  className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                >
                  Department
                </label>
                <Controller
                  name="department"
                  render={({ field }) => (
                    <CustomSelect
                      value={[field.value]}
                      placeholder="Select Department"
                      options={departments.map((app) => ({
                        label: app.module_name,
                        value: app.id,
                      }))}
                      onValueChange={(v) => field.onChange(v[0])}
                      bg="#fff"
                      color="#000"
                      borderRadius="5px"
                      w="full"
                      css={{
                        "& button": {
                          height: "30px !important",
                          minHeight: "30px !important",
                          borderRadius: "5px !important",
                        },
                      }}
                      on
                    />
                  )}
                  rules={{ required: "Department is required" }}
                  control={control}
                />
              </div>

              <div>
                <label
                  htmlFor="process"
                  className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                >
                  Agent
                </label>
                <Controller
                  name="agent"
                  render={({ field }) => (
                    <CustomSelect
                      value={[field.value]}
                      placeholder="Select Agent"
                      options={agents.map((app) => ({
                        label: app.app_name,
                        value: app.id,
                      }))}
                      onValueChange={(v) => field.onChange(v[0])}
                      bg="#fff"
                      color="#000"
                      borderRadius="5px"
                      w="full"
                      css={{
                        "& button": {
                          height: "30px !important",
                          minHeight: "30px !important",
                          borderRadius: "5px !important",
                        },
                      }}
                      on
                    />
                  )}
                  rules={{ required: "Process is required" }}
                  control={control}
                />
              </div>

              {/* Operational Model */}
              <div>
                <label
                  htmlFor="operational_model"
                  className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                >
                  Operational Model:
                </label>
                <select
                  id="operational_model"
                  {...register("operational_model")}
                  disabled={isLoading || isPlaceholderData}
                  className="w-full bg-white border-white  border text-black rounded-sm px-3 py-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="OFFSHORE ONLY">Offshore only</option>
                  <option value="ONSITE ONLY">Onsite only</option>
                  <option value="ONSITE AND OFFSHORE">
                    Onsite and offshore
                  </option>
                </select>
              </div>

              {/* Hourly Rate */}
              {operationalModelValue !== "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="hourly_rate"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Hourly Rate{" "}
                    <span className="text-gray-500">(per person):</span>
                  </label>
                  <input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    {...register("hourly_rate", { required: true })}
                    disabled={isLoading || isPlaceholderData}
                    className="w-full bg-white border-white  border  rounded-sm px-3 py-1 text-black text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              )}

              {/* Avg Time */}
              <div>
                <label
                  htmlFor="avg_time"
                  className="text-md font-light whitespace-nowrap tracking-widest text-gray-300 mb-2 block"
                >
                  Avg. Time per Txn with Manual Efforts{" "}
                  <span className="text-gray-500"></span>
                </label>
                <input
                  id="avg_time"
                  type="number"
                  step="0.01"
                  placeholder="Avg. Time (mins/txn)"
                  disabled={isLoading || isPlaceholderData}
                  {...register("avg_time", { required: true })}
                  className="w-full bg-white border-white placeholder:text-gray-400 text-black  border  rounded-sm px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                {errors.avg_time && (
                  <span className="text-red-500 text-xs">
                    This field is required
                  </span>
                )}
              </div>

              {operationalModelValue !== "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="head_count"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Head Count:
                  </label>
                  <Controller
                    name="head_count"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    rules={{
                      required: "Head Count is required",
                      validate: (v) => {
                        //cannot be zero
                        if (v === 0) {
                          return "Head Count cannot be zero";
                        }
                      },
                    }}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                            {/* <Slider.MarkerGroup>
                      <Slider.Marker />
                    </Slider.MarkerGroup> */}
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}

              {/* Additional Load */}
              {operationalModelValue !== "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="additionalLoad"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Additional load/cost in %:
                  </label>
                  <Controller
                    name="additional_load_cost"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}

              {/* Invoice Value */}
              {/* <div>
                <label
                  htmlFor="invoice_value"
                  className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                >
                  Monthly Invoice Value for AI Agent:
                </label>
                <input
                  id="invoice_value"
                  type="number"
                  disabled={isLoading || isPlaceholderData}
                  {...register("invoice_value", { required: true })}
                  className="w-full bg-white border-white text-black border rounded-sm px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div> */}

              {/* Hours Spent */}
              {operationalModelValue !== "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="hours_spent"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Hours Spent{" "}
                    <span className="text-gray-500">
                      (per person, per day):
                    </span>
                  </label>
                  <Controller
                    name="hours_spent"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    rules={{
                      required: "Hours Spent is required",
                      validate: (v) => {
                        //cannot be zero
                        if (v === 0) {
                          return "Head Count cannot be zero";
                        }
                      },
                    }}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                            {/* <Slider.MarkerGroup>
                      <Slider.Marker />
                    </Slider.MarkerGroup> */}
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}

              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="onsite_head_count"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Onsite Head Count:
                  </label>
                  <Controller
                    name="onsite_head_count"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    rules={{
                      required: "Onsite Head Count is required",
                      validate: (v) => {
                        //cannot be zero
                        if (v === 0) {
                          return "Head Count cannot be zero";
                        }
                      },
                    }}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}
              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="onsite_hours_spent"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Onsite Hours Spent{" "}
                    <span className="text-gray-500">
                      (per person, per day):
                    </span>
                  </label>
                  <Controller
                    name="onsite_hours_spent"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    rules={{
                      required: "Hours Spent is required",
                      validate: (v) => {
                        //cannot be zero
                        if (v === 0) {
                          return "Head Count cannot be zero";
                        }
                      },
                    }}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}
              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="onsite_hourly_rate"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Onsite Hourly Rate{" "}
                    <span className="text-gray-500">(per person):</span>
                  </label>
                  <input
                    id="onsite_hourly_rate"
                    type="number"
                    step="0.01"
                    {...register("onsite_hourly_rate", { required: true })}
                    disabled={isLoading || isPlaceholderData}
                    className="w-full bg-white border-white  border  rounded-sm px-3 py-1 text-black text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              )}

              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="onsite_additional_load_cost"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Onsite Additional load/cost in %:
                  </label>
                  <Controller
                    name="additional_load_cost"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}

              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="offshore_head_count"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    OffShore Head Count:
                  </label>
                  <Controller
                    name="offshore_head_count"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    rules={{
                      required: "OffShore Head Count is required",
                      validate: (v) => {
                        //cannot be zero
                        if (v === 0) {
                          return "Head Count cannot be zero";
                        }
                      },
                    }}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}
              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="offshore_hours_spent"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    OffShore Hours Spent{" "}
                    <span className="text-gray-500">
                      (per person, per day):
                    </span>
                  </label>
                  <Controller
                    name="offshore_hours_spent"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    rules={{
                      required: "Hours Spent is required",
                      validate: (v) => {
                        //cannot be zero
                        if (v === 0) {
                          return "Head Count cannot be zero";
                        }
                      },
                    }}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}
              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="offshore_hourly_rate"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    OffShore Hourly Rate{" "}
                    <span className="text-gray-500">(per person):</span>
                  </label>
                  <input
                    id="offshore_hourly_rate"
                    type="number"
                    step="0.01"
                    {...register("offshore_hourly_rate", { required: true })}
                    disabled={isLoading || isPlaceholderData}
                    className="w-full bg-white border-white  border  rounded-sm px-3 py-1 text-black text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              )}

              {operationalModelValue === "ONSITE AND OFFSHORE" && (
                <div>
                  <label
                    htmlFor="offshore_additional_load_cost"
                    className="text-md font-light tracking-widest text-gray-300 mb-2 block"
                  >
                    Offshore Additional load/cost in %:
                  </label>
                  <Controller
                    name="offshore_additional_load_cost"
                    control={control}
                    disabled={isLoading || isPlaceholderData}
                    render={({ field }) => (
                      <Slider.Root
                        value={[field.value || 0]}
                        onValueChange={(v) => {
                          field.onChange(v.value?.[0] || 0);
                        }}
                        size="lg"
                        w="full"
                      >
                        <Slider.Label />
                        <HStack>
                          <Slider.Control>
                            <Slider.Track height={"5"} bg="droidalBlack.500">
                              <Slider.Range bg="#14ABE3" />
                            </Slider.Track>
                            <Slider.Thumb>
                              <Slider.DraggingIndicator />
                              <Slider.HiddenInput />
                            </Slider.Thumb>
                          </Slider.Control>
                          <Slider.ValueText />
                        </HStack>
                      </Slider.Root>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                rounded="10px"
                bgImage={
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)"
                }
                border={"none"}
                _hover={{
                  bgImage:
                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                }}
                disabled={isLoading || isPending || updatePending}
                size={"xs"}
              >
                <Text
                  fontSize={"md"}
                  fontWeight={"semibold"}
                  letterSpacing={"2px"}
                  as={"span"}
                >
                  SAVE
                </Text>
                <RefreshCw color="white" />
              </Button>{" "}
            </div>
          </form>{" "}
        </Card.Body>
      </Card.Root>
    </VStack>
  );
};

export default ROIPage;
