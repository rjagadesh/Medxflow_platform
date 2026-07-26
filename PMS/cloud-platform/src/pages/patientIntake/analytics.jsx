import React from "react";
import { RequestTypeChart } from "@/features/patient-intake/request-type-chart";
import { DailyCaseDistribution } from "@/features/patient-intake/daily_case_distribution";
import { PayerAreaChart } from "@/features/patient-intake/payer-wise-outcome";
import { ApprovalVsDenied } from "@/features/patient-intake/aproval-vs-denied";
import { YearlyChart } from "@/features/patient-intake/yearly-trends";
import { MonthlyTrends } from "@/features/patient-intake/monthly-trends";
import { RequestByDay } from "@/features/patient-intake/request-by-day";
import { useParams } from "react-router-dom";
import { atobAgentId } from "@/utils/helper";
import { Grid } from "@chakra-ui/react/grid";
import { Flex } from "@chakra-ui/react/flex";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { Center } from "@chakra-ui/react";
import UnauthorizedPage from "../unauthorized";

function PatientAnalytics() {
  const { agent_app } = useParams();
  const agentId = atobAgentId(agent_app);
  const { hasPermission } = usePermissions();

  const canView = hasPermission("analytics", "view");

  if (!canView) {
    return <UnauthorizedPage />;
  }

  return (
    <Flex
      direction="column"
      px={{ base: "12px", "2xl": "20px" }}
      py={{ base: "12px", "2xl": "20px" }}
      mx="auto"
      maxW={"1250px"}
    >
      <Grid
        templateColumns={{ sm: "1fr", lg: "1fr 1fr" }}
        maxW={{ sm: "100%", md: "100%" }}
        gap="24px"
        mb="24px"
      >
        <RequestByDay agent_id={agentId} />
        <RequestTypeChart agentId={agentId} />
        <DailyCaseDistribution agent_id={agentId} />
        <MonthlyTrends agent_id={agentId} />
        <YearlyChart />
        <ApprovalVsDenied />
      </Grid>
      <PayerAreaChart />
    </Flex>
  );
}

export default PatientAnalytics;
