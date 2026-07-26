import React from "react";
import { Plus, MoreHorizontal, ArrowRight } from "lucide-react";
import CustomButton from "@/components/button/button";
import { Span, Avatar, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { format, parse } from "date-fns";
import { useGetAppointments } from "@/hooks/query/pms/pms_appointments/useGetAppointments";
import getStatusIcon from "@/utils/status-icon";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/helper";
import { Text } from "@chakra-ui/react";

export const AppointmentTable = () => {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data, isLoading: isAppointmentsLoading } = useGetAppointments({
    fromDate: today,
    toDate: today,
  });
  const appointmentsData = data?.slice(0, 5) || [];
  return (
    <section className="kpi-card overflow-hidden flex flex-col h-full">
      <div className="p-6 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="relative top-1 flex justify-between items-center w-full">
          <h2 className="text-lg my-0 flex gap-2 items-center font-bold text-white">
            <span>Who's Next?</span> -
            <Text
              fontSize={"sm"}
              fontWeight={"light"}
              className="text-slate-label"
            >
              Managing clinical flow & patient priority
            </Text>
          </h2>
          <button
            onClick={() => {
              navigate(
                `/pms/home/appointment-view?view=list&tab=scheduled&date=${formatDate(
                  new Date(),
                  "yyyy-MM-dd",
                )}`,
              );
            }}
            className="text-xs text-primary font-normal tracking-wider hover:text-white flex items-center gap-1"
          >
            <span>Full View</span> <ArrowRight className="!w-3.5 !h-3.5" />
          </button>
        </div>
        <div className="flex gap-2">
          {/* <button className="px-5 py-2.5 bg-ice-blue text-obsidian text-xs font-bold rounded-lg hover:bg-white transition-all flex items-center gap-2 shadow-lg shadow-ice-blue/10">
            
          </button> */}
          {/* <CustomButton size="sm">
            <Span display={"flex"} alignItems={"center"} gap={2}>
              <Plus className="!w-3.5 !h-3.5" size={"16"} /> New Appointment
            </Span>
          </CustomButton> */}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-10 block">
            <tr className="bg-black/10 w-full table table-fixed">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-label uppercase tracking-widest">
                Patient Name
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-label uppercase tracking-widest">
                Provider
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-label uppercase tracking-widest text-center">
                Time
              </th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-label uppercase tracking-widest text-center">
                Reason
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-label uppercase tracking-widest text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 block max-h-[30vh] overflow-y-auto">
            {isAppointmentsLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/[0.02] transition-colors border-b-[2px] border-black table w-full table-fixed"
                >
                  <td className="px-8 py-2">
                    <Skeleton height="20px" width="120px" mb="1" />
                    <Skeleton height="15px" width="80px" />
                  </td>
                  <td className="px-6 py-2">
                    <div className="flex items-center gap-2">
                      <SkeletonCircle size="8" />
                      <Skeleton height="20px" width="100px" />
                    </div>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex flex-col items-center">
                      <Skeleton height="20px" width="60px" mb="1" />
                      <Skeleton height="15px" width="80px" />
                    </div>
                  </td>
                  <td className="px-8 py-2 text-center">
                    <Skeleton height="15px" width="100px" mx="auto" />
                  </td>
                  <td className="px-6 py-2 text-right">
                    <div className="flex justify-end">
                      <SkeletonCircle size="5" />
                    </div>
                  </td>
                </tr>
              ))
            ) : appointmentsData.length === 0 ? (
              <tr className="table w-full table-fixed">
                <td
                  colSpan={5}
                  className="py-10 text-center text-slate-label text-sm"
                >
                  No result found
                </td>
              </tr>
            ) : (
              appointmentsData.map((apt) => (
                <tr
                  key={apt.patient}
                  className="hover:bg-white/[0.02] transition-colors border-b-[2px] border-black table w-full table-fixed"
                >
                  <td className="px-8 py-2">
                    <div className="font-bold text-sm text-white">
                      {apt.patient_name}
                    </div>
                    <div className="text-[10px] text-slate-label font-medium">
                      ID: {apt.patient?.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-2">
                    <div className="flex items-center gap-2">
                      {/* <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                        apt.providerInitials === "KB"
                          ? "bg-ice-blue/10 text-ice-blue"
                          : "bg-soft-mint/10 text-soft-mint"
                      }`}
                    >
                      {apt.providerInitials}
                    </div> */}
                      <Avatar.Root shape="rounded" size="2xs">
                        <Avatar.Fallback name={apt?.provider_name} />
                      </Avatar.Root>
                      <span className="text-sm font-semibold text-slate-label">
                        {apt.provider_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="text-sm font-bold text-white">
                      {format(
                        parse(apt.time, "HH:mm:ss", new Date()),
                        "hh:mm a",
                      )}
                    </div>
                    <div className="text-[11px] text-slate-label">
                      {formatDate(apt.date)}
                    </div>
                  </td>
                  <td className="px-8 py-2 text-center">
                    <div className="text-[12px] text-slate-label">
                      {apt.reason}
                    </div>
                  </td>
                  <td className="px-6 py-2 text-right">
                    {getStatusIcon(apt.confirmationstatus, { size: "sm" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
