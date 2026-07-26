import { Printer } from "lucide-react";

export default function EobNotificationBanner({ count, faxNumber }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-grey.900 px-4 py-3 text-sm text-cyan-900">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-black.900">
        <Printer className="h-5 w-5 text-cyan-600" />
      </div>

      <span>
        <strong>Another {count} paper EOBs</strong> received today from fax{" "}
        <strong>{faxNumber}</strong>!
      </span>
    </div>
  );
}
