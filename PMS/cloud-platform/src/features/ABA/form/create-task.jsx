import { useForm } from "react-hook-form";
import {
  Container,
  Box,
  Text,
  Card,
  Button,
  Field,
  Input,
  Stack,
} from "@chakra-ui/react";
import { useCreateTask } from "@/hooks/mutation/useCreateTask";
import { useNavigate, useParams } from "react-router-dom";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { DropzoneUploader } from "@/components/dropzone-uploader/uploader";

const CreateTask = () => {
  const { id } = useParams();
  const [files, setFiles] = useState([]);

  const navigate = useNavigate();
  const { mutate, isPending } = useCreateTask();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      task_name: "",
      description: "",
    },
  });

  const handleFileChange = (files) => {
    setFiles(files);
  };

  const onSubmit = async (data) => {
    console.log("filesdata", files, data);

    if (files && files.length > 0) {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target.result);
            data["task_data"] = parsed;
            console.log("JSON parsed:", parsed);
            resolve(parsed);
          } catch (error) {
            console.error("Invalid JSON file", error);
            reject(error);
          }
        };
        reader.readAsText(files[0]);
      });
      data["task_data"] = await promise;
    }

    mutate(
      {
        ...data,
        project: id,
      },
      {
        onSuccess: (v) => {
          console.log("Task Created");
          toaster.success({
            title: "Task Created",
            description: "Task created successfully",
          });
          navigate("/aba/" + id + "/task/" + v.id);
        },
        onError: (error) => {
          console.log("error", error);
          toaster.error({
            title: "Error",
            description: error.message || "Error creating task",
          });
        },
      }
    );
  };

  return (
    <Container maxWidth={"2xl"} py={8}>
      <Box mb="8">
        <Text color="white" fontWeight={"semibold"} as="h1" fontSize="xl">
          Create Task
        </Text>
        <Text as="p" color="#fff" fontSize="md">
          Add task details below.
        </Text>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card.Root bg="droidalBlack.300" border="none">
          <Card.Body>
            <Stack gap="4" w="full">
              {/* Task Name */}
              <Field.Root>
                <Field.Label color="white">Task Name</Field.Label>
                <Input
                  {...register("task_name", {
                    required: "Task name is required",
                  })}
                  color="white"
                />
                {errors.task_name && (
                  <Text color="red.400" fontSize="sm">
                    {errors.task_name.message}
                  </Text>
                )}
              </Field.Root>

              {/* Task Description */}
              <Field.Root>
                <Field.Label color="white">Task Description</Field.Label>
                <Input
                  color="white"
                  {...register("description", {
                    required: "Task description is required",
                  })}
                />
                {errors.description && (
                  <Text color="red.400" fontSize="sm">
                    {errors.description.message}
                  </Text>
                )}
              </Field.Root>
              <div className="w-full mb-4">
                <Field.Root>
                  <Field.Label className="text-white">Task Upload</Field.Label>

                  <DropzoneUploader
                    value={files}
                    maxFiles={1}
                    onChange={handleFileChange}
                    accept={["application/json"]}
                  >
                    <Box>
                      <Text color={"gray.300"} fontWeight={"semibold"}>
                        Upload the existing Code Builder JSON
                      </Text>
                      <Text color={"gray.400"} fontWeight={"normal"}>
                        Drag & drop or click to upload JSON
                      </Text>
                    </Box>
                  </DropzoneUploader>
                </Field.Root>
              </div>
            </Stack>
          </Card.Body>

          <Card.Footer justifyContent="flex-end">
            <Button
              variant="outline"
              _hover={{
                bg: "transparent",
                color: "white",
              }}
              color="white"
              type="button"
              onClick={() => {
                reset();
                navigate(-1);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="subtle"
              colorPalette={"gray"}
              loading={isPending}
              type="submit"
            >
              Submit
            </Button>
          </Card.Footer>
        </Card.Root>
      </form>
    </Container>
  );
};

export default CreateTask;
