import RecentRequestsInsuranceVerification from "@/features/insurance-verification/recent-request";
import InsuranceStats from "@/features/insurance-verification/static";

const InsuranceDashboard = () => {
  return (
    <div className="pt-4">
      <InsuranceStats />
      <div className="w-full mt-7">
        <RecentRequestsInsuranceVerification />
      </div>
    </div>
  );
};

export default InsuranceDashboard;
