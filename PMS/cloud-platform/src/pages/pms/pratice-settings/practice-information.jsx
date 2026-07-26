import React, { useEffect, useState } from "react";
import { Edit2, Upload } from "lucide-react";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import CustomButton from "@/components/button/button";

const PracticeInformation = () => {
  const [practiceData, setPracticeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchPractice();
  }, []);

  const fetchPractice = async () => {
    try {
      const response = await apiRequest(apiRoutes.practiceInformation.get);
      const data = response?.data ?? response;

      if (data?.practices?.length) {
        setPracticeData(data.practices[0]);
      }
    } catch {
      setError("Unable to load practice information");
    } finally {
      setLoading(false);
    }
  };

  const savePractice = async () => {
  try {
    const formData = new FormData();
    formData.append("name", editData.name || "");
    formData.append("address", editData.address || "");
    formData.append("phone", editData.phone || "");
    formData.append("fax", editData.fax || "");
    formData.append(
      "practice_preference",
      editData.practice_preference ? "1" : "0"
    );
    formData.append(
      "practice_notification",
      editData.practice_notification ? "1" : "0"
    );

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    // 🔹 UPDATE
    if (practiceData?.id) {
      await apiRequest(
        apiRoutes.practiceInformation.update,
        {
          payload: formData,
          metadata: { id: practiceData.id }
        }
      );
    }
    // 🔹 CREATE
    else {
      await apiRequest(
        apiRoutes.practiceInformation.create,
        {
          payload: formData
        }
      );
    }

    setIsEditOpen(false);
    setLogoFile(null);
    fetchPractice();
  } catch (e) {
    console.error(e);
    alert("Failed to save practice information");
  }
};


  if (loading) return <CenterText text="Loading practice information..." />;
  if (error) return <CenterText text={error} error />;

  return (
    <div className="min-h-screen p-4 bg-[#1a1a1a]">
      <div className="max-w-6xl mx-auto bg-[#2d2d2d] rounded-lg shadow-lg relative">
        {/* HEADER */}
        <div className="px-6 pt-6 pb-3 flex justify-between items-start">
          <h1 className="text-sm tracking-widest text-white uppercase">
            Practice Information
          </h1>

          {practiceData && (
            <CustomButton
              onClick={() => {
                setEditData({ ...practiceData });
                setLogoFile(null);
                setIsEditOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
            >
            
              Edit
            </CustomButton>
          )}
        </div>

        {/* MAIN INFO - Logo moved a little further left */}
        {practiceData && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left: Practice Details - wider */}
              <div className="md:col-span-7 space-y-3">
                <Detail label="Name" value={practiceData.name} />
                <Detail
                  label="Address"
                  value={practiceData.address}
                  multiline
                />
                <Detail label="Phone" value={practiceData.phone} />
                <Detail label="Fax" value={practiceData.fax} />
              </div>

              {/* Reduced empty space - pushes logo further left */}
              <div className="md:col-span-2 hidden md:block"></div>

              {/* Logo - now around 60% from the left, reduced size */}
              <div className="md:col-span-3 flex justify-center">
                {practiceData.logo_url ? (
                  <img
                    src={practiceData.logo_url + "/"}
                    alt="Practice Logo"
                    className="w-32 h-32 object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                    No Logo
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRACTICE PREFERENCES */}
        <SectionCompact title="Practice Preferences">
          <StatusRow
            label="Allow providers or clinical assistants to see financial details"
            enabled={practiceData.practice_preference}
          />
        </SectionCompact>

        {/* PRACTICE NOTIFICATIONS */}
        <SectionCompact title="Practice Notifications">
          <StatusRow
            label="Send birthday messages to patients"
            enabled={practiceData.practice_notification}
          />
        </SectionCompact>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <Modal>
          <h2 className="text-white text-xl font-semibold mb-6">
            Edit Practice Information
          </h2>

          <div className="space-y-4">
            <Input
              label="Name"
              value={editData.name || ""}
              onChange={(v) => setEditData({ ...editData, name: v })}
            />
            <Textarea
              label="Address"
              value={editData.address || ""}
              onChange={(v) => setEditData({ ...editData, address: v })}
            />
            <Input
              label="Phone"
              value={editData.phone || ""}
              onChange={(v) => setEditData({ ...editData, phone: v })}
            />
            <Input
              label="Fax"
              value={editData.fax || ""}
              onChange={(v) => setEditData({ ...editData, fax: v })}
            />
            <div>
              <label className="flex mt-3 items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={!!editData.practice_preference}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      practice_preference: e.target.checked,
                    })
                  }
                />
                Practice Preference
              </label>
            </div>
           <div>
          <label className="flex mt-3 items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={!!editData.practice_notification}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  practice_notification: e.target.checked,
                })
              }
            />
            Practice Notification
          </label>
        </div>


            
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-3 text-white cursor-pointer py-3">
              <Upload size={18} />
              <span>{logoFile ? logoFile.name : "Upload New Logo"}</span>
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <CustomButton
              onClick={() => {
                setIsEditOpen(false);
                setLogoFile(null);
              }}
              className="px-5 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={savePractice}
              className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Save Changes
            </CustomButton>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PracticeInformation;

/* ================= HELPERS ================= */

const SectionCompact = ({ title, children }) => (
  <div className="px-6 py-4 border-t border-[#404040]">
    <h2 className="text-xs tracking-widest text-white uppercase mb-3">
      {title}
    </h2>
    {children}
  </div>
);

const StatusRow = ({ label, enabled }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-400 text-sm">{label}</span>
    <span
      className={`text-sm font-medium ${
        enabled ? "text-green-400" : "text-red-400"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  </div>
);

const Detail = ({ label, value, multiline }) => (
  <div className="flex gap-4">
    <span className="w-24 text-gray-400 text-sm flex-shrink-0">{label}</span>
    <span
      className={`text-white text-sm ${multiline ? "whitespace-pre-line" : ""}`}
    >
      {value || "-"}
    </span>
  </div>
);

const CenterText = ({ text, error }) => (
  <div className="py-20 text-center">
    <div className={`${error ? "text-red-400" : "text-gray-400"} text-lg`}>
      {text}
    </div>
  </div>
);

const Modal = ({ children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div className="bg-[#2d2d2d] p-8 rounded-xl w-full max-w-2xl shadow-2xl">
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="block text-gray-300 text-sm mb-1">{label}</label>
    <input
      className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 outline-none transition"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Textarea = ({ label, value, onChange }) => (
  <div>
    <label className="block text-gray-300 text-sm mb-1">{label}</label>
    <textarea
      rows={4}
      className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 outline-none transition resize-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
