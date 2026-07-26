import React, { useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import AddServiceLocationModal from "./AddServiceLocationModal";
import CustomButton from "@/components/button/button";
import ConfirmModal from "./ConfirmModal";
import { toaster } from "@/components/ui/toaster";


const ServiceLocation = () => {
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ---------------- FETCH LIST ---------------- */

  const fetchLocations = async () => {
    try {
      const response = await apiRequest(apiRoutes.serviceLocation.list);
      const data = response?.data ?? response;
      console.log("service", data);
      if (Array.isArray(data)) setLocations(data);
      else if (Array.isArray(data?.results)) setLocations(data.results);
      else setLocations([]);
    } catch (err) {
      console.error("Failed to fetch locations", err);
      setLocations([]);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  /* ---------------- ACTIONS ---------------- */
  

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const openDeletePopup = (id) => {
    setSelectedDeleteId(id);
    setConfirmOpen(true);
    setOpenMenuId(null);
  };
  const handleDelete = async () => {
    if (!selectedDeleteId) return;

    try {
      setDeleteLoading(true);

      await apiRequest({
        ...apiRoutes.serviceLocation.delete,
        url: apiRoutes.serviceLocation.delete.url(selectedDeleteId),
      });
      toaster.success({
        title: "You have successfully deleted",
        description: ""
      })

      fetchLocations();
      setConfirmOpen(false);
      setSelectedDeleteId(null);
    } catch (err) {
      console.error("Failed to delete service location", err);
    } finally {
      setDeleteLoading(false);
    }
  };


  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-6 h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-medium">
          Service Locations
        </h2>

        <CustomButton
          onClick={() => {
            setSelectedLocation(null);
            setShowModal(true);
          }}
          
        >
          New service location
        </CustomButton>
      </div>

      {/* List */}
      <div className="flex-1 border border-[#2a2a2a] rounded-md overflow-hidden">

        {/* Header Row */}
        <div className="grid grid-cols-12 px-6 py-3 border-b border-[#2a2a2a] text-xs text-gray-400 uppercase">
          <div className="col-span-4">Name</div>
          <div className="col-span-6">Address</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {locations.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-12 px-6 py-4 border-b border-[#2a2a2a] hover:bg-[#2a2a2a] relative"
          >
            {/* Name */}
            <div className="col-span-4 text-gray-300 text-sm font-medium">
              {item.name}
            </div>

            {/* Address */}
            <div className="col-span-6 text-gray-400 text-sm">
              {item.address1}, {item.city}, {item.state} {item.zip_code},{item.fax}
            </div>

            {/* Actions */}
            <div className="col-span-2 flex justify-end relative">
              <button
                onClick={() =>
                  setOpenMenuId(openMenuId === item.id ? null : item.id)
                }
                className="text-gray-400 hover:text-white"
              >
                <MoreVertical size={18} />
              </button>

              {openMenuId === item.id && (
                <div className="absolute right-0 top-7 w-32 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md shadow-lg z-20">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-[#3a3a3a]"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeletePopup(item.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-[#3a3a3a]"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="py-10 text-center text-gray-500 text-sm">
            No service locations found
          </div>
        )}
      </div>

      {/* Pagination (static for now) */}
      <div className="flex justify-end items-center gap-3 mt-4">
        <button className="p-2 border border-[#2a2a2a] rounded-md text-gray-400">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-gray-400">Page 1 of 1</span>
        <button className="p-2 border border-[#2a2a2a] rounded-md text-gray-400">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <AddServiceLocationModal
          initialData={selectedLocation}   // 👈 edit support
          onClose={() => setShowModal(false)}
          onSuccess={fetchLocations}
        />
      )}
      <ConfirmModal
        open={confirmOpen}
        title="Delete Service Location"
        message="Are you sure you want to delete this service location?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ServiceLocation;
