import { useEffect } from "react";
import { Box } from "@chakra-ui/react/box";
import { SimpleGrid } from "@chakra-ui/react";
import { Heading } from "@chakra-ui/react/heading";
import { PlusIcon, Trash2Icon } from "lucide-react";
import CustomTextArea from "@/components/textarea/textarea";
import CustomButton from "@/components/button/button";
import { useFieldArray, useForm } from "react-hook-form";
import { useGetInstruction } from "@/hooks/query/agentsapp/useGetInstruction";
import { useCreateInstruction } from "@/hooks/mutation/agentsapp/useCreateInstruction";
import { useUpdateInstruction } from "@/hooks/mutation/agentsapp/useUpdateInstruction";
import { toaster } from "@/components/ui/toaster";

const InstructionPage = () => {
  const { isLoading, data, isPlaceholderData } = useGetInstruction();

  const { mutate: createInstruction, isPending: isCreating } =
    useCreateInstruction();
  const { mutate: updateInstruction, isPending: isUpdating } =
    useUpdateInstruction();

  console.log("data", data);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const handleSave = async (v) => {
    console.log("Form Values:", v);
    const instruction = data?.[0] || {};

    if (instruction.id) {
      updateInstruction(
        {
          id: instruction.id,
          ...v,
        },
        {
          onSuccess: (v) => {
            toaster.success({
              title: "Success",
              description: v.message || "Instruction updated successfully",
            });
          },
          onError: (error) => {
            toaster.error({
              title: "Error",
              description: error.message || "Error updating instruction",
            });
          },
        }
      );
    } else {
      createInstruction(v),
        {
          onSuccess: (v) => {
            toaster.success({
              title: "Success",
              description: v.message || "Instruction created successfully",
            });
          },
          onError: (error) => {
            toaster.error({
              title: "Error",
              description: error.message || "Error creating instruction",
            });
          },
        };
    }
  };

  useEffect(() => {
    const instruction = data?.[0] || {};
    const questions = instruction.questions || [];
    const system_prompt = instruction.system_prompt;
    if(instruction.id){

      reset({
        system_prompt,
        questions,
      });
    }else{
      reset({
        system_prompt: "",
        questions: [
          {
            question: "",
          },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Box>
      <form onSubmit={handleSubmit(handleSave)}>
        <SimpleGrid columns={2} gap={4}>
          <Box flex="1" display="flex" flexDirection="column">
            <Heading color={"white"} size="lg" mb={4}>
              System Prompt
            </Heading>
            <CustomTextArea
              placeholder="Enter your System Prompt..."
              flex="1"
              bg="transparent"
              color="white"
              fontFamily="monospace"
              p={6}
              borderRadius="12px"
              borderColor="#2f4d78"
              minH="300px"
              overflowY="auto"
              _focus={{ boxShadow: "outline" }}
              width="100%"
              {...register("system_prompt", {
                required: "System Prompt is required",
              })}
              errorMessage={errors?.system_prompt?.message}
            />
          </Box>{" "}
          <Box
            flex="1"
            height={"75vh"}
            overflowY={"auto"}
            display="flex"
            flexDirection="column"
          >
            <Heading color={"white"} size="lg" mb={4}>
              Questions
            </Heading>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-3 mb-3 w-full">
                {/* Module Select */}
                <div className="w-full">
                  <CustomTextArea
                    flex="1"
                    bg="transparent"
                    color="white"
                    fontFamily="monospace"
                    p={6}
                    borderRadius="md"
                    borderColor="#2f4d78"
                    overflowY="auto"
                    _focus={{ boxShadow: "outline" }}
                    width="100%"
                    key={field.id}
                    label={`Question ${index + 1}`}
                    placeholder="Enter your question..."
                    errorMessage={errors?.questions?.[index]?.question?.message}
                    {...register(`questions.${index}.question`, {
                      required: `Question ${index + 1} is required`,
                    })}
                  />
                </div>
                <CustomButton
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2Icon size={16} />
                </CustomButton>
              </div>
            ))}

            <CustomButton
              variant="outline"
              onClick={() => append({ question: "" })}
              leftIcon={<PlusIcon size={16} />}
              w="full"
              borderRadius="4px !important"
            >
              Add Question
            </CustomButton>
          </Box>{" "}
        </SimpleGrid>
        <Box mt={6} display="flex" justifyContent="flex-end">
          <CustomButton
            type="submit"
            disabled={
              isCreating || isUpdating || isLoading || isPlaceholderData
            }
            loading={isCreating || isUpdating}
          >
            Save
          </CustomButton>
        </Box>
      </form>
    </Box>
  );
};

export default InstructionPage;
