import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Input,
  Portal,
  RadioGroup,
  HStack,
  Fieldset,
  SimpleGrid,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCreateColumn } from "@/hooks/mutation/useCreateColumn";
import { useCreateColumnSettings } from "@/hooks/mutation/useCreateColumnSettings";
import { useState } from "react";
import CustomInput from "@/components/input/input";
import CustomButton from "@/components/button/button";

const fileTypes = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word Document" },
  { value: "xlsx", label: "Excel Spreadsheet" },
  { value: "txt", label: "Text File" },
  { value: "image", label: "Image" },
];

const CustomColumn = ({ initialValues, selectedAgent }) => {
  const { mutate, isPending } = useCreateColumn(selectedAgent);
  const { mutate: createColumnSettings, isLoading: createLoading } =
    useCreateColumnSettings();

  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      columnName: "",
      isFileType: false,
      value: "", // file type value
    },
  });

  const checkDuplicateColumnName = (newColumn, existingColumns) => {
    return existingColumns.some((column) => column.id === newColumn.id);
  };

  const onSubmit = (data) => {
    const newColumn = {
      name: data.columnName?.trim(),
      id: data.columnName.toLowerCase().replace(/\s+/g, "_"),
      required: true,
      active: true,
      is_custom: true,
      is_file_type: data.isFileType,
      value: data.value || undefined,
    };

    if (checkDuplicateColumnName(newColumn, initialValues.columns)) {
      return toaster.error({
        title: "Error",
        description: "Column name already exists",
      });
    }

    const existingCustomColumns = initialValues.columns.filter(
      (column) => column.is_custom,
    );

    const handleSuccess = () => {
      reset();
      setIsOpen(false);
      toaster.success({
        title: "Column Created",
        description: "Column created successfully",
      });
    };

    const handleError = (error) => {
      toaster.error({
        title: "Error",
        description: error.message || "Error creating column",
      });
    };

    if (initialValues.id) {
      // If settings already exist
      const payload = {
        column_names: [...existingCustomColumns, newColumn],
        app_column_settings: initialValues.id,
      };
      mutate(payload, {
        onSuccess: handleSuccess,
        onError: handleError,
      });
    } else {
      // Create column settings first
      createColumnSettings(
        {
          app_name: selectedAgent,
          columns: [],
        },
        {
          onSuccess: (data) => {
            const payload = {
              column_names: [...(data.columns || []), newColumn],
              app_column_settings: data.id,
            };
            mutate(payload, {
              onSuccess: handleSuccess,
              onError: handleError,
            });
          },
        },
      );
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
      placement={"center"}
      size={"md"}
    >
      <Dialog.Trigger asChild>
        <CustomButton size={"md"}>Create Column</CustomButton>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bgColor="droidalBlack.300" color={"white"}>
            <form id="column-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Header>
                <Dialog.Title>Create Column</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <CustomInput
                  label={"Column Name"}
                  placeholder="Column Name"
                  {...register("columnName", {
                    required: "Column name is required",
                    validate: (value) =>
                      value?.trim().toLowerCase() !== "status" ||
                      "You cannot use 'status' as a column name",
                  })}
                  showError={!!errors.columnName}
                  errorMessage={errors.columnName?.message || ""}
                  invalid={!!errors.columnName}
                />
              </Dialog.Body>

              <Dialog.Footer>
                <CustomButton
                  onClick={() => {
                    setIsOpen(false);
                    reset();
                  }}
                  mr={3}
                  variant="outline"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  type="submit"
                  loading={isPending || createLoading}
                >
                  Submit
                </CustomButton>
              </Dialog.Footer>
            </form>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default CustomColumn;
