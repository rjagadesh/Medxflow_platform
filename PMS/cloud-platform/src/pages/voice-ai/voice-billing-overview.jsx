import React, { useMemo, useState } from "react";
import { MetricCard } from "@/features/voice-ai/MetricCard";

import { SpendChart } from "@/features/voice-ai/SpendChart";
import { ConsumptionTable } from "@/features/voice-ai/ConsumptionTable";
import { Flex, HStack } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { MdAccountBalanceWallet } from "react-icons/md";
import { TbTrendingUp3 } from "react-icons/tb";
import { FaCreditCard } from "react-icons/fa";
import PageTransition from "@/components/ui/PageTransition";
import CustomButton from "@/components/button/button";
import { useNavigate, useParams } from "react-router-dom";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";
import UserMenu from "@/components/user-popover/user-popover";
import { atobDepartmentId } from "@/utils/helper";
import { useGetTotalDuration } from "@/hooks/query/voiceai/useGetTotalDuration";
import { useGetHistoricalMonthlySpend } from "@/hooks/query/voiceai/useGetHistoricalMonthlySpend";
import DateRangeCalendar from "@/components/data-range-picker/date-range-picker";
import { format } from "date-fns";

const transactions = [
  {
    id: "tx-1",
    date: "Oct 24, 2023",
    resourceId: "#AI-99201",
    description: "Voice Agent Processing - Tier 3",
    amount: 124.5,
    status: "active",
  },
  {
    id: "tx-2",
    date: "Oct 22, 2023",
    resourceId: "#AI-99188",
    description: "API Endpoint Utilization (Global)",
    amount: 42.1,
    status: "completed",
  },
  {
    id: "tx-3",
    date: "Oct 20, 2023",
    resourceId: "#AI-98754",
    description: "Model Training - Custom Agent Beta",
    amount: 512.0,
    status: "completed",
  },
  {
    id: "tx-4",
    date: "Oct 18, 2023",
    resourceId: "#AI-98551",
    description: "Storage Expansion - Data Lake v2",
    amount: 15.0,
    status: "completed",
  },
];

const getCurrentMonthRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    startDate: start,
    endDate: today,
  };
};

const VoiceAIBilling = () => {
  const navigate = useNavigate();
  const { department_id } = useParams();
  const [dateRange, setDateRange] = useState(getCurrentMonthRange);

  const startDate = useMemo(
    () => format(dateRange.startDate, "yyyy-MM-dd"),
    [dateRange.startDate],
  );
  const endDate = useMemo(
    () => format(dateRange.endDate, "yyyy-MM-dd"),
    [dateRange.endDate],
  );

  const decodedDepartmentId = useMemo(() => {
    if (!department_id) return null;

    try {
      const parsedId = Number(atobDepartmentId(department_id));
      return Number.isFinite(parsedId) ? parsedId : null;
    } catch {
      return null;
    }
  }, [department_id]);

  const { data: totalDurationData, isLoading: isTotalDurationLoading } =
    useGetTotalDuration({
      departmentId: decodedDepartmentId,
      startDate,
      endDate,
      enabled: !!decodedDepartmentId,
    });

  const { data: historicalSpendData } = useGetHistoricalMonthlySpend({
    departmentId: decodedDepartmentId,
    enabled: !!decodedDepartmentId,
  });

  const totalDurationMinutes = Number(
    totalDurationData?.totalDurationMinutes || 0,
  );
  const totalDurationValue = isTotalDurationLoading
    ? "--"
    : `${totalDurationMinutes * 0.09}`;

  return (
    <PageTransition>
      <Flex height="full" flexDirection="column">
        <style>
          {`
          body {
        margin: 0;
        overflow: hidden; /* Prevent full page scroll, handle inside containers */
      }
      
      .neon-gradient-btn {
        background: linear-gradient(180deg, rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%);
        box-shadow: 0 0 15px rgba(0, 187, 242, 0.4);
        transition: all 0.3s ease;
      }
      .neon-gradient-btn:hover {
        box-shadow: 0 0 25px rgba(0, 187, 242, 0.6);
        transform: translateY(-1px);
      }

      .card-glow {
          border-width: 2px;
          border-color: #2f4d78;
          transition: all 0.3s ease;
      }
      
      .card-glow:hover {
        border-width: 2px;
        border-color: rgba(0, 187, 242, 0.3);
        box-shadow: 0 0 50px rgba(0, 187, 242, 0.05);
      }
      
      .sidebar-active {
        background: rgba(0, 187, 242, 0.1);
        color: #00bbf2;
        border-right: 3px solid #00bbf2;
      }
      
      /* Custom Scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #000000;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #1A1A1A;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #333;
      }
        `}
        </style>
        <HStack justify={"space-between"} py={3}>
          <CustomBreadcrumb
            sidebarItems={[
              {
                name: "Agents",
                to: `/voice-ai/${department_id}`,
                end: true,
              },
              {
                name: "Analytics",
                to: `/voice-ai/${department_id}/analytics`,
              },
              {
                name: "Billing",
                to: `/voice-ai/${department_id}/billing`,
              },
            ]}
            suffix={`/voice-ai/${department_id}/`}
            search={location.search}
            fontSize={{
              base: "sm",
            }}
          />

          <div className="flex items-center gap-4">
            <DateRangeCalendar
              date={dateRange}
              onChange={setDateRange}
              inputProps={{
                size: "xs",
                w: "230px",
              }}
            />
            <UserMenu />
          </div>
        </HStack>{" "}
        <Box
          bgColor="droidalBlack.400"
          borderRadius="xl"
          flex="0.99"
          p={6}
          className="relative flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col mx-auto gap-y-8">
              {/* Metrics Section */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <MetricCard
                  title="Available Funds"
                  value="$22.77"
                  change="+12.5%"
                  changeLabel="from last month"
                  icon={<MdAccountBalanceWallet size={32} />}
                  iconColorClass="text-[var(--chakra-colors-primary-400)]"
                  iconBgClass="bg-primary/10"
                  actionNode={
                    <CustomButton
                      size="xs"
                      onClick={() =>
                        navigate(`/voice-ai/${department_id}/billing/payment`)
                      }
                    >
                      Add Fund
                    </CustomButton>
                  }
                />
                {console.log("totalDurationValue121212999", totalDurationValue)}
                <MetricCard
                  title="Current Month Spending"
                  value={totalDurationValue ? `$${totalDurationValue}` : "--"}
                  change=""
                  changeLabel="Month to Date"
                  icon={<TbTrendingUp3 size={32} />}
                  iconColorClass="text-[var(--chakra-colors-primary-400)]"
                  iconBgClass="bg-neon-cyan/10"
                />
                <MetricCard
                  title="Billing Type"
                  value="Pay-as-you-go"
                  change=""
                  changeLabel=""
                  subtext="Standard Enterprise"
                  icon={<FaCreditCard size={32} />}
                  iconColorClass="text-[var(--chakra-colors-primary-400)]"
                  iconBgClass="bg-purple-500/10"
                />
              </div>

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
                <SpendChart data={historicalSpendData || []} />
                <ConsumptionTable transactions={transactions} />
              </div>
            </div>
            <div className="h-10"></div> {/* Bottom spacer */}
          </div>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default VoiceAIBilling;
