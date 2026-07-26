import { useForm, Controller } from "react-hook-form";
import {
  Field,
  Input,
  Button,
  Stack,
  Heading,
  Textarea,
  SimpleGrid,
  Dialog,
  Portal,
  CloseButton,
  RadioCard,
  HStack,
  Text,
  Flex,
  useListCollection,
  Combobox,
  InputGroup,
  Span,
  useFilter,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { useCreateTrigger } from "@/hooks/mutation/useCreateTrigger";
import { useUpdateTrigger } from "@/hooks/mutation/useUpdateTrigger";
import CustomSelect from "@/components/ui/select";
import { useGetPodsQuery } from "@/hooks/query/projects/useGetPodsQuery";
import { useGetTasksByProjectId } from "@/hooks/query/task/useTasks";
import { useGetMachineQuery } from "@/hooks/query/machines/useGetMachineQuery";
import { FiClock } from "react-icons/fi";
import TimezoneSelect, { useTimezoneSelect } from "react-timezone-select";
import { useGetAgentsMinimal } from "@/hooks/query/useGetAgentMInimal";
import { useGetTriggerById } from "@/hooks/query/triggers/useGetTriggerById";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import { Edit, Loader2, SearchIcon } from "lucide-react";
import { fromZonedTime } from "date-fns-tz";

function convertToUtcTime(timeStr, sourceTz, date = null) {
  const [hour, minute] = timeStr.split(":").map(Number);

  // Determine the date to use
  const current = date ? new Date(date) : new Date(); // actual local date, but we'll reinterpret in source TZ

  // Build the date in the source timezone
  const localDate = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
    hour,
    minute
  );

  // Convert to UTC date
  const utcDate = fromZonedTime(localDate, sourceTz);

  return { hour: utcDate.getUTCHours(), minute: utcDate.getUTCMinutes() };
}

export function CreateTriggerModal2({
  mode = "add",
  trigger_id,
  checkPermission = () => {},
}) {
  const { data: initialValues, isLoading } = useGetTriggerById(trigger_id, {
    enabled: mode === "edit",
  });
  const isEdit = mode === "edit";
  console.log("isEdit99877", initialValues, isEdit);
  const { mutate: createMutate, isPending: isCreatePending } =
    useCreateTrigger();
  const { mutate: updateMutate, isPending: isUpdatePending } =
    useUpdateTrigger();
  const { data: projectList } = useGetPodsQuery();
  const { data: machines, isLoading: isMachinesLoading } = useGetMachineQuery();
  const {
    data: agents = [],
    isLoading: isAgentLoading,
    isPlaceholderData: isAgentPlaceholderData,
  } = useGetAgentsMinimal();
  const formRef = useRef(null);

  const [showRpaBot, setShowRpaBot] = useState(false);
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      machine_id: [],
      scaling: [],
      cron_query: "",
      status: "Active",
      project: [],
      task: [],
      agentid: [],
    },
  });

  const projectId = watch("project")?.[0] || undefined;
  const { data: taskList = [], isLoading: isTasksLoading } =
    useGetTasksByProjectId(projectId, { enabled: !!projectId });

  const onSubmit = (formData) => {
    console.log("formData1212", formData, Array.isArray(formData.cron_query));
    const payload = {
      name: formData.name,
      description: formData.description,
      machine: formData.machine_id[0],
      scaling: formData.scaling?.[0],
      cron_query: Array.isArray(formData.cron_query)
        ? formData.cron_query[0]
        : formData.cron_query,
      status: formData.status,
      project: formData.project[0],
      task: formData.task[0],
      agentid: formData.agentid[0],
      code_env: formData.code_env,
    };

    if (isEdit) {
      updateMutate(
        {
          ...payload,
          id: initialValues.trigger_id,
        },
        {
          onSuccess: () => {
            toaster.success({
              title: "Trigger Updated",
              description: "Trigger updated successfully",
            });
            handleClose();
            setOpen(false);
          },
          onError: (error) => {
            toaster.error({
              title: "Update Failed",
              description: error.message || "Error updating trigger",
            });
          },
        }
      );
    } else {
      createMutate(
        { ...payload },
        {
          onSuccess: () => {
            toaster.success({
              title: "Trigger Created",
              description: "Trigger created successfully",
            });
            handleClose();
            setOpen(false);
          },
          onError: (error) => {
            toaster.error({
              title: "Creation Failed",
              description: error.message || "Error creating trigger",
            });
          },
        }
      );
    }
  };

  const handleClose = () => {
    reset({
      name: "",
      description: "",
      machine_id: [],
      scaling: [],
      cron_query: "",
      status: "Active",
      project: [],
      task: [],
    });
    setOpen(false);
  };

  useEffect(() => {
    if (
      isEdit &&
      initialValues &&
      projectList.length > 0 &&
      agents.length > 0 &&
      open
    ) {
      const projectValue = initialValues.project ? [initialValues.project] : [];
      const taskValue = initialValues.task ? [initialValues.task] : [];
      const machineValue = initialValues.machine ? [initialValues.machine] : [];
      console.log("initialValues888", initialValues);

      const formValues = {
        name: initialValues.name || "",
        description: initialValues.description || "",
        machine_id: machineValue,
        scaling: [initialValues.scaling],
        cron_query: Array.isArray(initialValues.cron_query)
          ? initialValues.cron_query[0]
          : initialValues.cron_query || "",
        status: initialValues.status || "Active",
        project: projectValue,
        task: taskValue,
        agentid: [initialValues.agentid],
        code_env: initialValues.code_env,
      };

      reset(formValues);
      // setCronQuery(initialValues.cron_query || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, initialValues, open, projectList.length, agents.length]);

  const items = [
    { value: "tasks-code", title: "Agent Flow" },
    { value: "tasks-json", title: "Code Builder" },
  ];

  return (
    <Dialog.Root
      scrollBehavior={"inside"}
      motionPreset="slide-in-bottom"
      placement={"center"}
      open={open}
      onOpenChange={(v) => {
        if (v.open) {
          if (checkPermission()) {
            setOpen(v.open);
          }
        } else {
          setOpen(v.open);
        }
      }}
    >
      <Dialog.Trigger asChild>
        {isEdit ? (
          <button className="flex items-center w-full cursor-pointer px-4 py-2 text-sm border-b border-droidal-black-100 text-white hover:droidal-black-200">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </button>
        ) : (
          <CustomButton size="sm">Create Trigger</CustomButton>
        )}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bgColor={"droidalBlack.300"} color="white" my="0">
            <Dialog.Header>
              <Dialog.Title letterSpacing={"wider"} fontWeight={"medium"}>
                {isEdit ? "Edit Trigger" : "Create New Trigger"}
                {isLoading && mode === "edit" && (
                  <Loader2
                    color="white"
                    className="ml-2 h-4 w-4 animate-spin"
                  />
                )}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="create-trigger-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                ref={formRef}
              >
                <Stack spacing={6}>
                  <Stack spacing={4}>
                    <CustomInput
                      label="Trigger Name"
                      placeholder={"Name"}
                      {...register("name", {
                        required: "Name is required",
                      })}
                      invalid={!!errors.name}
                      errorMessage={errors.name?.message}
                      showError={!!errors.name}
                    />

                    <CustomTextArea
                      label="Trigger Description"
                      placeholder={"Description"}
                      {...register("description", {
                        required: "Description is required",
                      })}
                      invalid={!!errors.description}
                      errorMessage={errors.description?.message}
                      showError={!!errors.description}
                    />
                  </Stack>

                  {/* Configuration */}
                  <Heading size="md" mb={2}>
                    Configuration
                  </Heading>

                  <Field.Root invalid={!!errors.type}>
                    <Field.Label
                      color="white"
                      fontWeight={"light"}
                      fontSize={"md"}
                      letterSpacing={"wider"}
                    >
                      Type
                    </Field.Label>
                    <Controller
                      name="code_env"
                      control={control}
                      rules={{ required: "Type is required" }}
                      render={({ field }) => {
                        console.log("field1223", field);
                        return (
                          <RadioCard.Root
                            value={field.value}
                            onValueChange={(v) => field.onChange(v.value)}
                            w="full"
                          >
                            <HStack w="full" align="stretch">
                              {items.map((item) => (
                                <RadioCard.Item
                                  key={item.value}
                                  value={item.value}
                                  borderColor="#2f4d78"
                                >
                                  <RadioCard.ItemHiddenInput />
                                  <RadioCard.ItemControl borderColor="#2f4d78">
                                    <RadioCard.ItemText>
                                      {item.title}
                                    </RadioCard.ItemText>
                                    <RadioCard.ItemIndicator
                                      _checked={{
                                        bgImage:
                                          "linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
                                      }}
                                    />
                                  </RadioCard.ItemControl>
                                </RadioCard.Item>
                              ))}
                            </HStack>
                          </RadioCard.Root>
                        );
                      }}
                    />
                    <Field.ErrorText>{errors.agentid?.message}</Field.ErrorText>
                  </Field.Root>
                  <SimpleGrid columns={2} gap={4}>
                    <Field.Root invalid={!!errors.agentid}>
                      <Field.Label
                        color="white"
                        fontWeight={"light"}
                        fontSize={"md"}
                        letterSpacing={"wider"}
                      >
                        Agent
                      </Field.Label>
                      <Controller
                        name="agentid"
                        control={control}
                        rules={{ required: "Agent selection is required" }}
                        render={({ field }) => {
                          console.log("field1212", field, agents);
                          return (
                            <CustomSelect
                              placeholder="Select Agent"
                              value={field.value}
                              options={agents.map((agent) => ({
                                value: String(agent.generated_api_id),
                                label: agent.app_name,
                              }))}
                              onValueChange={field.onChange}
                              isLoading={
                                isAgentLoading || isAgentPlaceholderData
                              }
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
                          );
                        }}
                      />
                      <Field.ErrorText>
                        {errors.agentid?.message}
                      </Field.ErrorText>
                    </Field.Root>
                    <Field.Root invalid={!!errors.machine_id}>
                      <Field.Label
                        color="white"
                        fontWeight={"light"}
                        fontSize={"md"}
                        letterSpacing={"wider"}
                      >
                        Machine
                      </Field.Label>
                      <Controller
                        name="machine_id"
                        control={control}
                        rules={{ required: "Machine selection is required" }}
                        render={({ field }) => (
                          <CustomSelect
                            placeholder="Select Machine"
                            value={field.value}
                            options={machines.map((machine) => ({
                              key: machine.id,
                              value: machine.id,
                              label: machine.machine_name,
                            }))}
                            onValueChange={field.onChange}
                            isLoading={isMachinesLoading}
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
                        )}
                      />
                      <Field.ErrorText>
                        {errors.machine_id?.message}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.project}>
                      <Field.Label
                        color="white"
                        fontWeight={"light"}
                        fontSize={"md"}
                        letterSpacing={"wider"}
                      >
                        Project
                      </Field.Label>
                      <Controller
                        name="project"
                        control={control}
                        rules={{ required: "Project selection is required" }}
                        render={({ field }) => (
                          <CustomSelect
                            placeholder="Select Project"
                            value={field.value}
                            options={projectList.map((project) => ({
                              key: project.id,
                              value: project.id,
                              label: project.project_name,
                            }))}
                            onValueChange={field.onChange}
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
                        )}
                      />
                      <Field.ErrorText>
                        {errors.project?.message}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.task}>
                      <Field.Label
                        color="white"
                        fontWeight={"light"}
                        fontSize={"md"}
                        letterSpacing={"wider"}
                      >
                        Task
                      </Field.Label>
                      <Controller
                        name="task"
                        control={control}
                        rules={{ required: "Task selection is required" }}
                        render={({ field }) => (
                          <CustomSelect
                            placeholder={
                              isTasksLoading
                                ? "Loading tasks..."
                                : "Select Task"
                            }
                            value={field.value}
                            options={taskList.map((task) => ({
                              key: task.id,
                              value: task.id,
                              label: task.task_name,
                            }))}
                            onValueChange={field.onChange}
                            isDisabled={!projectId || isTasksLoading}
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
                        )}
                      />
                      <Field.ErrorText>{errors.task?.message}</Field.ErrorText>
                      {!projectId && (
                        <Field.HelperText>
                          Please select a project first
                        </Field.HelperText>
                      )}
                    </Field.Root>

                    <Field.Root>
                      <Field.Label
                        color="white"
                        fontWeight={"light"}
                        fontSize={"md"}
                        letterSpacing={"wider"}
                      >
                        Scaling Type
                      </Field.Label>
                      <Controller
                        name="scaling"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            placeholder="Select Scaling"
                            value={field.value}
                            invalid={!!errors.scaling}
                            options={[
                              { key: "100", label: "100", value: "100" },
                              { key: "125", label: "125", value: "125" },
                              { key: "150", label: "150", value: "150" },
                              { key: "175", label: "175", value: "175" },
                              { key: "200", label: "200", value: "200" },
                              { key: "225", label: "225", value: "225" },
                              { key: "250", label: "250", value: "250" },
                              { key: "300", label: "300", value: "300" },
                              { key: "350", label: "350", value: "350" },
                              { key: "400", label: "400", value: "400" },
                            ]}
                            onValueChange={field.onChange}
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
                        )}
                        rules={{ required: "Scaling is required" }}
                      />
                      {!!errors.scaling && (
                        <Field.ErrorText>
                          {errors.scaling?.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  </SimpleGrid>

                  {/* Schedule Configuration */}
                  <Stack spacing={4}>
                    <Heading size="md" mb={2}>
                      Schedule Configuration
                    </Heading>
                    <CustomInput
                      label="Cron Expression"
                      placeholder="Enter cron expression"
                      {...register("cron_query", {
                        required: "Cron expression is required",
                      })}
                      errorMessage="Cron expression is required"
                      showError={!!errors.cron_query}
                      invalid={!!errors.cron_query}
                    />
                    <Field.Root>
                      <Field.Label>Cron Scheduler</Field.Label>
                      {/* <Button
                          variant={"subtle"}
                          colorPalette={"gray"}
                          onClick={handleOpenScheduler}
                        >
                          Open RPA Bot Scheduler
                        </Button> */}
                      <Dialog.Root
                        open={showRpaBot}
                        onOpenChange={(v) => setShowRpaBot(v.open)}
                        placement={"center"}
                        scrollBehavior={"inside"}
                      >
                        <Dialog.Trigger asChild>
                          <Button>Standard Scheduler</Button>
                        </Dialog.Trigger>
                        <Portal>
                          <Dialog.Backdrop />
                          <Dialog.Positioner>
                            <Dialog.Content
                              bgColor={"droidalBlack.300"}
                              color="white"
                              my="0"
                            >
                              <Dialog.Body>
                                <RpaBotSchedulerPanel
                                  triggerId={
                                    initialValues?.trigger_id || "defaultId"
                                  }
                                  setCronQuery={(expr) => {
                                    alert(expr);
                                    setValue("cron_query", expr, {
                                      shouldValidate: true,
                                    });
                                  }}
                                  onCloseScheduler={() => setShowRpaBot(false)}
                                />
                              </Dialog.Body>
                            </Dialog.Content>
                          </Dialog.Positioner>
                        </Portal>
                      </Dialog.Root>
                    </Field.Root>
                  </Stack>
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <CustomButton variant="outline">Cancel</CustomButton>
              </Dialog.ActionTrigger>
              <CustomButton
                onClick={() => {
                  formRef.current?.requestSubmit();
                }}
                disabled={isCreatePending || isUpdatePending}
                loading={isCreatePending || isUpdatePending}
              >
                Submit
              </CustomButton>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default CreateTriggerModal2;

const CustomComboBox = ({
  options = [],
  placeholder,
  value,
  onValueChange,
  ...rest
}) => {
  const { contains } = useFilter({ sensitivity: "base" });

  const { collection, filter } = useListCollection({
    initialItems: options,
    filter: contains,
    itemToString: (item) => {
      return item.label;
    },
    itemToValue: (item) => {
      return item.value;
    },
  });

  const handleValueChange = (details) => {
    console.log("details1212", details);
    onValueChange(details.value);
  };

  // useEffect(() => {
  //   // Avoid unnecessary re-setting if the items are the same
  //   set((prev) => {
  //     const prevStr = JSON.stringify(prev);
  //     const nextStr = JSON.stringify(options);
  //     return prevStr !== nextStr ? options : prev;
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [options]);

  return (
    <Combobox.Root
      collection={collection}
      multiple={false}
      value={value}
      onValueChange={handleValueChange}
      onInputValueChange={(e) => filter(e.inputValue)}
      positioning={{ sameWidth: false, placement: "bottom-start" }}
      openOnClick
      {...rest}
    >
      <Combobox.Control>
        <InputGroup>
          <Combobox.Input
            letterSpacing="widest"
            placeholder={placeholder}
            color="white"
            _placeholder={{ letterSpacing: "widest" }}
            borderColor="#2f4d78"
            transition="all .2s ease-in-out"
            borderRadius="10px"
            _hover={{
              outlineColor: "transparent",
              border: "1px solid transparent",
              bgClip: "padding-box, border-box",
              backgroundOrigin: "padding-box, border-box",
              backgroundImage:
                "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
            }}
          />
        </InputGroup>
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>

      <>
        <Combobox.Positioner>
          <Combobox.Content bgColor="droidalBlack.300" color="white" minW="sm">
            <Combobox.Empty>No items found</Combobox.Empty>

            {collection.items.map((option) => {
              return (
                <Combobox.Item key={option.id} item={option}>
                  <HStack justify="space-between" textStyle="sm">
                    <Span fontWeight="medium" truncate>
                      {option.label}
                    </Span>
                  </HStack>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              );
            })}
          </Combobox.Content>
        </Combobox.Positioner>
      </>
    </Combobox.Root>
  );
};

function TimezoneSelector({ value = [], onChange }) {
  const { options, parseTimezone } = useTimezoneSelect({
    labelStyle: "original",
  });

  console.log("options99999", value, options);

  return (
    <CustomComboBox
      placeholder="Select Timezone"
      value={value ? [value.value] : []}
      options={options.map((option) => ({
        value: option.value,
        label: option.label,
        id: option.value,
      }))}
      width="100%"
      onValueChange={(v) => {
        console.log("v1213123", v);
        const value = v[0];
        const timezone = parseTimezone(value);
        console.log("timezone", timezone);
        onChange(timezone);
      }}
    />
  );
}

const US_TIMEZONES = {
  AST: "America/Puerto_Rico",
  EST: "America/New_York",
  CST: "America/Chicago",
  MST: "America/Denver",
  PST: "America/Los_Angeles",
  AKST: "America/Anchorage",
  HST: "Pacific/Honolulu",
  SST: "Pacific/Pago_Pago",
  CHST: "Pacific/Guam",
};

function generateCronForWeekly(schedule, timezone) {
  // Convert the time to UTC
  const { hour, minute } = convertToUtcTime(schedule.time, timezone);

  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  // Convert selected days to cron format numbers
  const days = schedule.days
    .map((day) => dayMap[day])
    .filter((v) => v !== undefined)
    .map(String);

  if (days.length === 0) {
    throw new Error("No valid days selected");
  }

  const dayOfWeek = days.join(",");

  return [`${minute} ${hour} * * ${dayOfWeek}`];
}

function generateCronForMonthly(schedule, timezone) {
  // Convert local time → UTC
  const { hour, minute } = convertToUtcTime(schedule.time, timezone);

  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const dayOfWeek = dayMap[schedule.day];
  if (dayOfWeek === undefined) {
    throw new Error(`Invalid day: ${schedule.day}`);
  }

  const weekMap = {
    First: "1-7",
    Second: "8-14",
    Third: "15-21",
    Fourth: "22-28",
    Last: "22-31",
  };

  const dayOfMonth = weekMap[schedule.week];
  if (!dayOfMonth) {
    throw new Error(`Invalid week: ${schedule.week}`);
  }

  // CRON format: minute hour day-of-month month day-of-week
  return [`${minute} ${hour} ${dayOfMonth} * ${dayOfWeek}`];
}

function generateCronForDaily(schedule, timezone) {
  console.log("schedule1212", schedule, timezone);
  const crons = [];
  // const sourceTz = US_TIMEZONES[timezone];

  // if (!sourceTz) {
  //   throw new Error(`Invalid timezone: ${timezone}`);
  // }

  let dayOfWeek = "*";
  if (schedule.weekend === "weekdays") {
    dayOfWeek = "1-5";
  } else if (schedule.weekend === "weekends") {
    dayOfWeek = "0,6";
  }

  // ------- MODE: ONCE -------
  if (schedule.runType === "once") {
    const { hour, minute } = convertToUtcTime(schedule.time, timezone);
    const cron = `${minute} ${hour} * * ${dayOfWeek}`;
    crons.push(cron);
  }

  // ------- MODE: INTERVAL -------
  else if (schedule.runType === "interval") {
    const startTime = schedule.interval.startTime;
    const endTime = schedule.interval.endTime;
    const start = convertToUtcTime(startTime, timezone);
    const end = convertToUtcTime(endTime, timezone);
    let interval = parseInt(schedule.interval.interval, 10);
    const unit = schedule.interval.unit;

    // Convert hours → minutes
    if (unit === "hours") {
      interval *= 60;
    }

    let minuteStep = "*";
    let hourRange = "*";

    if (interval < 60) {
      // Minute-based interval
      minuteStep = `*/${interval}`;
      hourRange =
        start.hour !== end.hour ? `${start.hour}-${end.hour}` : `${start.hour}`;
    } else {
      // Hour-based interval
      const hoursInterval = interval / 60;
      minuteStep = `${start.minute}`;
      hourRange =
        start.hour !== end.hour
          ? `${start.hour}-${end.hour}/${hoursInterval}`
          : `${start.hour}/${hoursInterval}`;
    }

    const cron = `${minuteStep} ${hourRange} * * ${dayOfWeek}`;
    crons.push(cron);
  }

  return crons;
}

function RpaBotSchedulerPanel({
  triggerId = "defaultId",
  setCronQuery,
  onCloseScheduler,
}) {
  const [selectedTimezone, setSelectedTimezone] = useState();
  const [scheduleType, setScheduleType] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [monthlyWeek, setMonthlyWeek] = useState("First");
  const [monthlyDay, setMonthlyDay] = useState("Sunday");

  // Daily schedule states
  const [dailyRunType, setDailyRunType] = useState("once");
  const [dailyTime, setDailyTime] = useState("");
  const [dailyInterval, setDailyInterval] = useState({
    interval: "",
    unit: "minutes",
    startTime: "",
    endTime: "",
  });
  const [weekendSupport, setWeekendSupport] = useState("both");

  // Weekly schedule states
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [weeklyTime, setWeeklyTime] = useState("");

  // Monthly schedule states
  const daysShort = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const [monthlyTime, setMonthlyTime] = useState("");

  const toggleCheckbox = (value, list, setList) => {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  };

  const handleAddSchedule = (e) => {
    e.preventDefault();
    console.log("scheduleType", scheduleType);
    if (!scheduleType) return;

    if (scheduleType === "Daily") {
      if (dailyRunType === "once") {
        if (!dailyTime) {
          toaster.error({
            title: "Error",
            description: "Please select time",
          });
          return;
        }
      } else if (dailyRunType === "interval") {
        if (!dailyInterval.interval) {
          toaster.error({
            title: "Error",
            description: "Please select interval",
          });
          return;
        }
        if (!dailyInterval.startTime) {
          toaster.error({
            title: "Error",
            description: "Please select start time",
          });
          return;
        }
        if (!dailyInterval.endTime) {
          toaster.error({
            title: "Error",
            description: "Please select end time",
          });
          return;
        }
      }
      setSchedules((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "Daily",
          runType: dailyRunType,
          time: dailyTime,
          interval: dailyInterval,
          weekend: weekendSupport,
        },
      ]);
      setDailyRunType("once");
      setDailyTime("");
      setDailyInterval("");
      setWeekendSupport("both");
    } else if (scheduleType === "Weekly") {
      if (!weeklyDays.length) {
        toaster.error({
          title: "Error",
          description: "Please select days",
        });
        return;
      }
      if (!weeklyTime) {
        toaster.error({
          title: "Error",
          description: "Please select time",
        });
        return;
      }
      setSchedules((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "Weekly",
          days: weeklyDays,
          time: weeklyTime,
        },
      ]);
      setWeeklyDays([]);
      setWeeklyTime("");
    } else if (scheduleType === "Monthly") {
      if (!monthlyTime) {
        toaster.error({
          title: "Error",
          description: "Please select time",
        });
        return;
      }

      setSchedules((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "Monthly",
          time: monthlyTime,
          week: monthlyWeek,
          day: monthlyDay,
        },
      ]);
      setMonthlyTime("");
      setMonthlyWeek("First");
      setMonthlyDay("Sunday");
    }
  };

  const handleRemoveSchedule = (id) => {
    setSchedules(schedules.filter((sch) => sch.id !== id));
  };

  const generateCronExpression = () => {
    if (schedules.length === 0) return "";
    const sch = schedules[0];
    if (sch.type === "Daily") {
      const cron = generateCronForDaily(sch, selectedTimezone?.value);
      return cron;
    } else if (sch.type === "Weekly") {
      const cron = generateCronForWeekly(sch, selectedTimezone?.value);
      return cron;
    } else if (sch.type === "Monthly") {
      const cron = generateCronForMonthly(sch, selectedTimezone?.value);
      return cron;
    }
    return "";
  };

  const handleSubmit = (e) => {
    if (schedules.length === 0) {
      toaster.error({
        title: "Error",
        description:
          "Please select a timezone, set the schedule type, and add at least one schedule before saving.",
        duration: 5000,
      });
      return;
    }
    e.preventDefault();
    const cronExpr = generateCronExpression();
    console.log("cronExpr", cronExpr);
    setCronQuery(cronExpr);
    onCloseScheduler();
  };

  const handleClose = () => {
    onCloseScheduler();
  };

  return (
    <div className="bg-droidal-black-300 text-white rounded-xl h-full shadow p-6 w-full max-w-2xl mx-auto my-8 overflow-auto">
      <h2 className="text-2xl font-semibold mb-6">RPA Bot Scheduler</h2>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-white">Timezone</label>
        <TimezoneSelector
          value={selectedTimezone}
          onChange={setSelectedTimezone}
        />
      </div>
      <div className="mb-6 flex  items-end space-x-4">
        <div className="flex-1">
          <label className="block mb-2 font-medium text-white">
            Add Schedule Type
          </label>
          <CustomSelect
            placeholder="Select Schedule Type"
            options={[
              {
                value: "Daily",
                label: "Daily",
              },
              {
                value: "Weekly",
                label: "Weekly",
              },
              {
                value: "Monthly",
                label: "Monthly",
              },
            ]}
            value={[scheduleType]}
            onValueChange={(v) => setScheduleType(v[0])}
            borderRadius="4px"
            w="full"
          />
        </div>
      </div>

      {scheduleType && (
        <Flex justifyContent={"flex-end"} pos={"relative"} top={10} right={2}>
          <CustomButton
            size="xs"
            disabled={!scheduleType}
            onClick={handleAddSchedule}
          >
            Save
          </CustomButton>
        </Flex>
      )}

      {scheduleType === "Daily" && (
        <div className="border border-[#5e5e5e] rounded-xl p-6 mb-6 shadow-sm">
          <div className="font-semibold mb-2">Daily</div>
          <div className="flex items-center">
            <label className="flex items-center mr-8">
              <input
                type="radio"
                checked={dailyRunType === "once"}
                onChange={() => setDailyRunType("once")}
                className="mr-2"
              />
              Run once at this time
            </label>
            {dailyRunType === "once" && (
              <div className="flex items-center">
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  className="border accent-white rounded px-2 py-1 mr-2 custom-time-icon"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center mt-3 gap-2">
            <label className="flex items-center mr-8">
              <input
                type="radio"
                checked={dailyRunType === "interval"}
                onChange={() => setDailyRunType("interval")}
                className="mr-2"
              />
              Run at intervals
            </label>
            {dailyRunType === "interval" && (
              <>
                <div>
                  <input
                    type="number"
                    value={dailyInterval.interval}
                    onChange={(e) =>
                      setDailyInterval((prev) => ({
                        ...prev,
                        interval: e.target.value,
                      }))
                    }
                    placeholder="e.g. 30"
                    className="border rounded px-2 py-1 w-20"
                    disabled={dailyRunType !== "interval"}
                  />
                  <select
                    value={dailyInterval.unit}
                    onChange={(e) =>
                      setDailyInterval((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    className="border rounded px-2 py-1 ml-2"
                    disabled={dailyRunType !== "interval"}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
                within time window
                <input
                  type="time"
                  value={dailyInterval.startTime}
                  onChange={(e) =>
                    setDailyInterval((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="border rounded px-2 py-1 ml-2 custom-time-icon"
                  disabled={dailyRunType !== "interval"}
                />
                -
                <input
                  type="time"
                  value={dailyInterval.endTime}
                  onChange={(e) =>
                    setDailyInterval((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className="border rounded px-2 py-1 ml-2 custom-time-icon"
                  disabled={dailyRunType !== "interval"}
                />
              </>
            )}
          </div>

          <div className="mt-3">
            <label className="font-medium mr-2">Weekend Support:</label>
            <select
              value={weekendSupport}
              onChange={(e) => setWeekendSupport(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="both">Weekdays and Weekends</option>
              <option value="weekdays">Weekdays only</option>
              <option value="weekends">Weekends only</option>
            </select>
          </div>

          <p className="text-gray-500 text-sm mt-4">
            Select "Run once" for one-time daily run. Use "Run at intervals" to
            trigger at a fixed rate, e.g., every 30 min between 09:00 and 18:00.
          </p>
        </div>
      )}

      {scheduleType === "Weekly" && (
        <div className="border rounded-xl p-6 mb-6 shadow-sm">
          <div className="font-semibold mb-2">Weekly</div>
          <div className="mb-3">
            <span className="font-medium mr-2">Days:</span>
            {daysShort.map((day) => (
              <label key={day} className="flex items-center text-sm mr-4">
                <input
                  type="checkbox"
                  checked={weeklyDays.includes(day)}
                  onChange={() =>
                    toggleCheckbox(day, weeklyDays, setWeeklyDays)
                  }
                  className="mr-1"
                />
                {day}
              </label>
            ))}
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">Time:</span>
            <input
              type="time"
              value={weeklyTime}
              onChange={(e) => setWeeklyTime(e.target.value)}
              className="border rounded px-2 py-1 w-36 mr-2 custom-time-icon"
            />
          </div>
        </div>
      )}

      {scheduleType === "Monthly" && (
        <div className="border rounded-xl p-6 mb-6 shadow-sm">
          <div className="font-semibold mb-4">Monthly</div>

          <div className="mb-4 font-semibold">Weeks of the Month:</div>
          <div className="flex gap-6 mb-6 flex-wrap">
            <select
              onChange={(e) => setMonthlyWeek(e.target.value)}
              className="border rounded px-2 py-1"
              value={monthlyWeek}
            >
              <option value="First">First</option>
              <option value="Second">Second</option>
              <option value="Third">Third</option>
              <option value="Fourth">Fourth</option>
              <option value="Last">Last</option>
            </select>
            <select
              onChange={(e) => setMonthlyDay(e.target.value)}
              className="border rounded px-2 py-1"
              value={monthlyDay}
            >
              {daysShort.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
            <input
              type="time"
              value={monthlyTime}
              onChange={(e) => setMonthlyTime(e.target.value)}
              className="border rounded px-2 py-1 w-30 custom-time-icon"
            />
          </div>

          <Text fontSize={"sm"} className="text-gray-500">
            Run on the selected week and day of each month, e.g., First Monday
            at 09:00.
          </Text>
        </div>
      )}

      {schedules.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Added Schedules</h3>
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="border rounded-xl p-4 mb-4 shadow relative"
            >
              <button
                className="absolute right-4 top-4 text-gray-400 hover:text-red-700 text-xl"
                onClick={() => handleRemoveSchedule(sch.id)}
                aria-label="Remove schedule"
                type="button"
              >
                ×
              </button>
              <div className="font-semibold mb-2">{sch.type} Schedule</div>

              {sch.type === "Daily" && (
                <>
                  <div>
                    Run Type:{" "}
                    {sch.runType === "once"
                      ? "Run once at this time"
                      : "Run at intervals"}
                  </div>
                  {sch.runType === "once" ? (
                    <div>Time: {sch.time}</div>
                  ) : (
                    <div>
                      Interval: {sch.interval?.interval} {sch.interval?.unit}
                    </div>
                  )}
                  <div>Weekend Support: {sch.weekend}</div>
                </>
              )}

              {sch.type === "Weekly" && (
                <>
                  <div>Days: {sch.days.join(", ")}</div>
                  <div>Time: {sch.time}</div>
                </>
              )}

              {sch.type === "Monthly" && (
                <>
                  <div>
                    Selected Week and Day: {sch.week} {sch.day}
                  </div>
                  <div>Time: {sch.time}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-x-4 mt-8">
        <button
          type="button"
          className="bg-white border border-gray-300 px-6 py-2 rounded-lg"
          onClick={handleClose}
        >
          Close
        </button>
        <Button variant={"subtle"} colorPalette={"gray"} onClick={handleSubmit}>
          Save Schedule
        </Button>
      </div>
    </div>
  );
}
