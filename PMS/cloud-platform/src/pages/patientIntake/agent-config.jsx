import CustomButton from "@/components/button/button";
import GenericTable from "@/components/table/table";
import AgentConfigCard from "@/features/patient-intake/agent-config-card";
import { useGetAgentConfigs } from "@/hooks/query/agentsapp/useGetAgentConfigs";
import { useAuth } from "@/store/providers/auth-provider";
import { atobAgentId } from "@/utils/helper";
import { Box, Center, Flex, Skeleton, Text, VStack } from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const AppCardSkeleton = () => {
  return (
    <Skeleton
      color={"gray"}
      className="dark"
      rounded="2xl"
      variant="shine"
      height={{
        base: "140px",
        "2xl": "160px",
        "3xl": "180px",
      }}
    />
  );
};

const AgentConfiguration = () => {
  const { agent_app, department_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const app_id = atobAgentId(agent_app);
  const { data, isLoading, isPlaceholderData } = useGetAgentConfigs({
    app_id: app_id,
    client_id: user.client,
  });

  const agentConfigs = data?.response || [];

  const handleCreateConfig = () => {
    navigate(`/apps/${department_id}/${agent_app}/agent-config/create`);
  };
  if (agentConfigs?.length === 0 && !isPlaceholderData) {
    return (
      <Center height={"100%"}>
        <VStack align="center">
          <Text
            fontSize={{
              base: "md",
              "2xl": "lg",
              "3xl": "xl",
            }}
            margin={0}
            letterSpacing={"wider"}
            className="text-transparent bg-clip-text transition-colors"
            bgImage="var(--bg-blue-gradient)"
          >
            No Agent Configurations Found
          </Text>
          <Text color={"#90a6c6"}>
            Create a new agent configuration to get started.
          </Text>
          <CustomButton
            mt={4}
            leftIcon={<PlusIcon />}
            onClick={handleCreateConfig}
          >
            <Text
              fontSize={"md"}
              fontWeight={"semibold"}
              letterSpacing={"2px"}
              as={"span"}
            >
              Create Config
            </Text>
          </CustomButton>
        </VStack>
      </Center>
    );
  }
  const isLessThan3 = !isLoading && agentConfigs.length < 3;
  return (
    <>
      <Flex justifyContent="flex-end">
        <CustomButton
          mb={4}
          leftIcon={<PlusIcon />}
          onClick={handleCreateConfig}
        >
          Create Config
        </CustomButton>
      </Flex>
      <Box
        className={`grid gap-4 pb-6 place-content-center ${
          isLessThan3 && "place-content-start"
        }`}
        gap={{ base: 4, "2xl": 6, "3xl": 6 }}
        gridTemplateColumns={{
          base: "repeat(auto-fit, 210px)",
          "2xl": "repeat(auto-fit, 260px)",
          "3xl": "repeat(auto-fit, 296px)",
        }}
      >
        {(isLoading || isPlaceholderData) && (
          <>
            {[...Array(5)].map((_, idx) => (
              <AppCardSkeleton key={idx} />
            ))}
          </>
        )}
        {!isLoading && (
          <>
            {agentConfigs.map((app, idx) => {
              return (
                <AgentConfigCard
                  name={app.agent_name}
                  id={app.id}
                  key={idx}
                  handleClick={() => {
                    navigate(
                      `/apps/${department_id}/${agent_app}/agent-config/view`,
                      {
                        state: app,
                      }
                    );
                  }}
                />
              );
            })}
          </>
        )}
      </Box>
    </>
  );
};

export default AgentConfiguration;
