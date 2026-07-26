import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import CustomButton from "@/components/button/button";
import { toaster } from "@/components/ui/toaster";

/* ---------------- VALIDATION ---------------- */

const validateField = (name, value) => {
  switch (name) {
    case "name":
      if (!value.trim()) return "Location name is required";
      if (value.length < 3) return "Minimum 3 characters required";
      return "";

    case "address1":
      if (!value.trim()) return "Address Line 1 is required";
      return "";

    case "city":
      if (!value.trim()) return "City is required";
      return "";

    case "state":
      if (!value.trim()) return "State is required";
      if (value.length > 2) return "State must be 2 characters";
      return "";

    case "zip_code":
      if (!/^\d{5}(-\d{4})?$/.test(value))
        return "Enter a valid ZIP code";
      return "";

    case "phone":
      if (value && !/^\d{10}$/.test(value.replace(/\D/g, "")))
        return "Enter a valid 10-digit phone number";
      return "";

    case "fax":
      if (value && !/^\d{10}$/.test(value.replace(/\D/g, "")))
        return "Enter a valid 10-digit fax number";
      return "";

    case "place_of_service_code":
      if (!value.trim()) return "Place of service code is required";
      if (value.length > 2) return "Must be 2 characters";
      return "";

    case "timezone":
      if (!value.trim()) return "Timezone is required";
      return "";

    default:
      return "";
  }
};

/* ---------------- COMPONENT ---------------- */

const AddServiceLocationModal = ({ initialData, onClose, onSuccess }) => {
  const isEdit = Boolean(initialData?.id);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [popupError, setPopupError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    phone: "",
    fax: "",
    place_of_service_code: "",
    timezone: "",
    google_place_id: "",
    allow_appointment_reminders: true,
    include_address_in_reminders: true,
    display_on_scheduling_page: true,
    is_active: true,
  });

  /* ---------------- PREFILL ---------------- */

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    // Validate ONLY this field (do not wipe backend errors)
    const error = validateField(name, finalValue);

    setErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[name] = [error];
      } else {
        delete updated[name];
      }
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = [error];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setPopupError("");

    if (!validateForm()) {
      setPopupError("Please fix the highlighted errors.");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(
          key,
          typeof value === "boolean" ? (value ? "1" : "0") : value || ""
        );
      });

      if (isEdit) {
        await apiRequest(
          {
            ...apiRoutes.serviceLocation.update,
            url: apiRoutes.serviceLocation.update.url(initialData.id),
          },
          { payload, isMultipart: true }
        );
        toaster.success({
            title: "You have successfully edited",
            description: ""
          })
      } else {
        await apiRequest(apiRoutes.serviceLocation.create, {
          payload,
          isMultipart: true,
        });
        onSuccess();
        toaster.success({
        title: "You have successfully Created",
        description: ""
    })
      }
         
      
      onClose();
    } catch (err) {
      if (err?.response?.data && typeof err.response.data === "object") {
        setErrors((prev) => ({
          ...prev,
          ...err.response.data, // ✅ backend errors preserved
        }));
        setPopupError("Please fix the highlighted errors.");
      } else {
        setPopupError("Failed to save service location.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] w-[720px] rounded-lg border border-[#2a2a2a] p-6">

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg">
            {isEdit ? "Edit Service Location" : "New Service Location"}
          </h3>
          <button onClick={onClose}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {popupError && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm">
            {popupError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Location Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
          <Input label="Address Line 1" name="address1" value={formData.address1} onChange={handleChange} error={errors.address1} />
          <Input label="Address Line 2" name="address2" value={formData.address2} onChange={handleChange} />
          <Input label="City" name="city" value={formData.city} onChange={handleChange} error={errors.city} />
          <Input label="State" name="state" value={formData.state} onChange={handleChange} error={errors.state} />
          <Input label="ZIP Code" name="zip_code" value={formData.zip_code} onChange={handleChange} error={errors.zip_code} />
          <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
          <Input label="Fax" name="fax" value={formData.fax} onChange={handleChange} error={errors.fax} />
          <Input label="Place of Service Code" name="place_of_service_code" value={formData.place_of_service_code} onChange={handleChange} error={errors.place_of_service_code} />
          <Input label="Timezone" name="timezone" value={formData.timezone} onChange={handleChange} error={errors.timezone} />
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <CustomButton onClick={onClose} className="px-4 py-2 border border-[#2a2a2a] text-gray-400 rounded">
            Cancel
          </CustomButton>
          <CustomButton onClick={handleSave} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded">
            {loading ? "Saving..." : isEdit ? "Update" : "Save"}
          </CustomButton>
        </div>

      </div>
    </div>
  );
};

export default AddServiceLocationModal;

/* ---------------- REUSABLE INPUT ---------------- */

const Input = ({ label, error, ...props }) => (
  <div>
    <label className="text-sm text-gray-400">{label}</label>
    <input
      {...props}
      className={`w-full px-3 py-2 rounded bg-[#121212] text-white border ${
        error ? "border-red-500" : "border-[#2a2a2a]"
      }`}
    />
    {error && <p className="text-red-400 text-xs mt-1">{error[0]}</p>}
  </div>
);
