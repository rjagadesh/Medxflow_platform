import UserMenu from "@/components/user-popover/user-popover";
import RequestForm from "@/features/insurance-verification/modal/request";
import { Avatar } from "@chakra-ui/react";
import { RiAddLine } from "react-icons/ri";

export default function PatientHeader() {
  return (
    <header className="bg-droidal-black-300 backdrop-blur-sm px-6 py-4 sticky top-0 z-5">
      <div className="flex items-center justify-between">
        <div>
          {/* <h1 className="text-2xl font-bold text-slate-900">Lorem ipsum</h1>
          <p className="text-slate-600 mt-1">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p> */}
        </div>

        <div className="flex items-center gap-x-4">
          <RequestForm />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
