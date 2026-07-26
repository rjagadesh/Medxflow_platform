import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Dialog } from "@chakra-ui/react";

export function CreateConfigModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    autoRetry: false,
    noOfRetry: 0,
    taskName: "",
    status: "active",
    enforceUniqueReference: false,
    storeEncryptedFormat: false,
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: "",
      description: "",
      autoRetry: false,
      noOfRetry: 0,
      taskName: "",
      status: "active",
      enforceUniqueReference: false,
      storeEncryptedFormat: false,
    });
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Title className="text-xl font-semibold text-gray-900">
          Create Config
        </Dialog.Title>

        <Dialog.Content>
          <Dialog.Body>
            <form onSubmit={handleSubmit} className="p-6 gap-y-6">
              {/* General Details Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  General Details
                </h3>

                <div className="gap-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Asset Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        if (errors.name)
                          setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        errors.name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Asset Type
                    </label>
                    <input
                      type="text"
                      id="description"
                      placeholder="Enter Description"
                      value={formData.description}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                        if (errors.description)
                          setErrors((prev) => ({
                            ...prev,
                            description: undefined,
                          }));
                      }}
                      rows={3}
                      className={`mt-2 w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 transition-colors ${
                        errors.description
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                      }`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Options Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Asset Value
                </h3>

                <div className="gap-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Text
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        if (errors.name)
                          setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        errors.name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>
                </div>
                <div className="gap-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Labels
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        if (errors.name)
                          setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        errors.name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>
                </div>
                <div className="gap-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        if (errors.name)
                          setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      className={`mt-2 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        errors.name
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-md">
                  Create Queue
                </button>
              </div>
            </form>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
