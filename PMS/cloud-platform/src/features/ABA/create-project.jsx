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
import { useCreatePods } from "@/hooks/mutation/useCreatePods";
import { toaster } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";

const CreateProject = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useCreatePods();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      project_name: "",
      description: "",
    },
  });

  const onSubmit = (data) => {
    console.log("Form Submitted:", data);
    mutate(
      {
        ...data,
      },
      {
        onSuccess: (response) => {
          console.log("response", response);
          const id = response.id;
          toaster.success({
            title: "Pods Created",
            description: "Pods created successfully",
          });
          navigate(`/aba/pods/${id}/create-task/`);
        },
        onError: (error) => {
          console.log("error", error);
          toaster.error({
            title: "Error",
            description: error.message || "Error creating pods",
          });
        },
      }
    );
  };

  return (
    <Container maxWidth={"2xl"}>
      <Box my="8">
        <Text color="white" fontWeight={"semibold"} as="h1" fontSize="xl">
          Create Pods
        </Text>
        {/* <Text as="p" color="secondary.400" fontSize="md">
          Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </Text> */}
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card.Root className="!bg-droidal-black-400 !border-none">
          <Card.Body>
            <Stack gap="4" w="full">
              {/* Project Name */}
              <Field.Root>
                <Field.Label color="white">Name</Field.Label>
                <Input
                  color="gray"
                  {...register("project_name", {
                    required: "Project name is required",
                  })}
                />
                {errors.project_name && (
                  <Text color="red.400" fontSize="sm">
                    {errors.project_name.message}
                  </Text>
                )}
              </Field.Root>

              {/* Project Description */}
              <Field.Root>
                <Field.Label color="white">Description</Field.Label>
                <Input
                  color="gray"
                  {...register("description", {
                    required: "Description is required",
                  })}
                />
                {errors.description && (
                  <Text color="red.400" fontSize="sm">
                    {errors.description.message}
                  </Text>
                )}
              </Field.Root>
            </Stack>
          </Card.Body>

          <Card.Footer justifyContent="flex-end">
            <Button
              variant="outline"
              colorPalette={"gray"}
              color={"white"}
              _hover={{
                bg: "transparent",
              }}
              type="button"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              loading={isPending}
              colorPalette={"gray"}
              variant="subtle"
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

export default CreateProject;
