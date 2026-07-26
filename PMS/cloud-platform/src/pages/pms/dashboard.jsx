import { HealthGauge, Sparkline } from "@/features/pms/dashboard/Charts";
import { GlassCard } from "@/features/pms/dashboard/GlassCard";
import React from "react";
import {
  ArrowRight,
  Calendar,
  Clipboard,
  FileText,
  MoreVertical,
  Plus,
  ScanBarcode,
  Search,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Zap,
  Activity,
  Bell,
  UserSearch,
  Receipt,
  Landmark,
} from "lucide-react";
import {
  CountUp,
  KPICard,
  MetricRow,
  ProgressMetric,
} from "@/features/pms/dashboard/KPICards.jsx";
import { SmallKPICards } from "@/features/pms/dashboard/SmallKPICards";
import { SidebarCards } from "@/features/pms/dashboard/SidebarCards";
import { useGetPmsKPI } from "@/hooks/query/pms/pms-dashboard/useGetPmsKPI";
import { AppointmentTable } from "@/features/pms/dashboard/AppointmentTable.jsx";
import WorkflowProgress from "@/features/pms/dashboard/work-flow-progress";
//import { SidebarCards } from "@/features/pms/dashboard/SidebarCards";
import { Center, Flex } from "@chakra-ui/react";
import AdzList from "@/features/pms/dashboard/adz-list";
const APPOINTMENTS_DATA = [
  {
    id: "1",
    patientName: "URSU LOLITA",
    patientId: "#88241",
    provider: "Dr. kabi B",
    providerInitials: "KB",
    providerColor: "cyan",
    time: "08:00 AM",
    reason: "Obesity management",
    status: "Pending",
  },
  {
    id: "2",
    patientName: "JAMES ANDERSON",
    patientId: "#88242",
    provider: "Dr. Sarah Smith",
    providerInitials: "SS",
    providerColor: "emerald",
    time: "09:30 AM",
    reason: "Annual Physical",
    status: "Confirmed",
  },
];

const PMSDashboard = () => {
  const { data } = useGetPmsKPI();

  console.log("data11212", data);

  return (
    <Flex flexDirection={"column"} height={"full"}>
      <div className="flex 4xl:mt-4 flex-col">
        <main className="w-full flex flex-col  mx-auto space-y-6 flex-grow">
          {/* Top KPI row */}
          <div className="kpi-cards-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
            <KPICard title="Patient Access" icon={UserSearch}>
              <MetricRow
                label="Total Patients"
                value={data?.total_patient_count || 0}
                delta={data?.this_year_patient_trends?.percentage + "%"}
                isPositive={data?.this_year_patient_trends?.direction === "up"}
              />
              <MetricRow
                label="New (This Month)"
                value={data?.this_month_patient_count || 0}
                delta={data?.this_month_patient_trends?.percentage + "%"}
                isPositive={data?.this_month_patient_trends?.direction === "up"}
              />
              <ProgressMetric label="Registration" percentage={94} />
            </KPICard>

            <KPICard title="Scheduling" icon={Calendar} isPriority>
              <MetricRow
                value={data?.this_month_appointment_count || 0}
                delta={data?.this_month_appointment_trends?.percentage + "%"}
                isPositive={
                  data?.this_month_appointment_trends?.direction === "up"
                }
                label="Appts"
              />
              <MetricRow
                label="Confirmation %"
                value={(data?.this_month_confirmed_percentage ?? 0) + "%"}
              />
              <ProgressMetric label="Utilization" percentage={72} />
            </KPICard>

            <KPICard title="Check-In & Visit" icon={UserCheck}>
              <MetricRow label="Check-In %" value="95%" delta="1%" isPositive />
              <MetricRow label="Visit Completion %" value="92%" />
              <MetricRow label="Avg. Wait Time" value="3 min" />
            </KPICard>

            <KPICard title="Charge Capture" icon={ScanBarcode}>
              <MetricRow label="Captured" value="$326.4k" />
              <MetricRow label="Charge Lag" value="1.4 Days" />
              <ProgressMetric
                label="Coding Accuracy"
                percentage={38}
                colorClass="bg-pending-gradient-horizontal"
              />
            </KPICard>

            <KPICard title="Claims Performance" icon={Receipt}>
              <MetricRow label="Submitted" value="842" delta="15%" isPositive />
              <MetricRow label="First-Pass" value="84%" />
              <MetricRow label="Denial Rate" value="4.2%" isNegative />
            </KPICard>
          </div>

          {/* Main Grid: Appointments + Sideboard */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4 items-stretch">
            <div className="lg:col-span-4">
              <AppointmentTable />
            </div>
            <div className="lg:col-span-1 flex gap-4 flex-col">
              <KPICard title="Payments" icon={Wallet}>
                <MetricRow label="Pay. Collected" value="$78,420" />
                <MetricRow label="Pat. vs Ins. %" value="30/70" />

                <ProgressMetric label="Collection Rate" percentage={72} />
              </KPICard>
              <KPICard title="Clinical Doc (EHR)" icon={FileText}>
                <MetricRow label="Encounters Comp." value="324" />
                <MetricRow label="Chart Comp %" value="88%" />
                <MetricRow label="Avg Close" value="4.2 hrs" />
              </KPICard>
              <KPICard title="Accounts KPI" icon={Activity}>
                <MetricRow label="Total AR ($)" value="$1,200,000" />
                <MetricRow label="AR &gt; 60 Days" value="14%" />
                <MetricRow label="Days in AR" value="32 Days" />
              </KPICard>
              <KPICard title="Executive KPI" icon={Activity}>
                <MetricRow label="Net Collection Rate(%)" value="88%" />
                <MetricRow label="Revenue per Visit($)" value="$1,200" />
                <MetricRow label="Payment Velocity" value="High" />
              </KPICard>
            </div>
          </div>
        </main>
      </div>
      <Center className="flex-1">
        <WorkflowProgress />
      </Center>
    </Flex>
  );
};

export default PMSDashboard;
