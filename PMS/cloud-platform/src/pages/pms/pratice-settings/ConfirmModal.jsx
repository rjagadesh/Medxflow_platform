import { X } from "lucide-react";
import CustomButton from "@/components/button/button";

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] w-[380px] rounded-lg border border-[#2a2a2a] p-5">
        <div className="flex justify-between mb-3">
          <h3 className="text-white">{title}</h3>
          <button onClick={onCancel}>
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <p className="text-gray-300 text-sm mb-5">{message}</p>

        <div className="flex justify-end gap-3">
          <CustomButton
            onClick={onCancel}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded"
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            {loading ? "Deleting..." : "Delete"}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
