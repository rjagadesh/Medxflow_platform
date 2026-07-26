import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, User } from "lucide-react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import ConfirmModal from "./ConfirmModal";
import UserRegistration from "./user-registration";

export default function UserSettings() {
  const navigate = useNavigate();
  const userRegistrationRef = useRef(null); // Ref to control UserRegistration

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Delete popup states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(apiRoutes.userrolemanagement.getusers);
      const apiUsers = res?.results || [];

      setUsers(
        apiUsers.map((u) => ({
          id: u.id,
          name: u.username,
          email: u.mail,
          role: u.roles,
          // Add more fields if your API returns them
          username: u.username,
          first_name: u.first_name,
          last_name: u.last_name,
          mobile: u.mobile,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeletePopup = (id) => {
    setSelectedUserId(id);
    setConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;

    try {
      setDeleteLoading(true);
      await apiRequest({
        ...apiRoutes.userrolemanagement.deleteuser,
        url: apiRoutes.userrolemanagement.deleteuser.url(selectedUserId),
      });

      setUsers((prev) => prev.filter((u) => u.id !== selectedUserId));
      setConfirmOpen(false);
      setSelectedUserId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (user) => {
    if (userRegistrationRef.current) {
      userRegistrationRef.current.openEditForm(user);
    } else {
      console.warn("UserRegistration component is not mounted yet");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 bg-[#0d2b52]">
      <div className="flex justify-between mb-6">
        <h1 className="text-white text-xl">User Settings</h1>
        <UserRegistration ref={userRegistrationRef} onSuccess={fetchUsers} />
      </div>

      <input
        className="mb-4 px-3 py-2 rounded bg-gray-700 text-white w-full max-w-md"
        placeholder="Search user..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <User size={40} className="mx-auto mb-2" />
          No users found
        </div>
      ) : (
        <table className="w-full bg-[#2A2929] rounded overflow-hidden">
          <thead className="bg-[#353434]">
            <tr>
              <th className="p-4 text-left text-white">User</th>
              <th className="p-4 text-left text-white">Email</th>
              <th className="p-4 text-left text-white">Mobile</th>
              <th className="p-4 text-left text-white">Role</th>



              <th className="p-4 text-center text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-gray-600 hover:bg-[#353434]">
                <td className="p-4">
                  <p className="text-white font-medium">{u.name}</p>
                </td>
                <td>
                  <p className="text-gray-400 text-sm">{u.email}</p>
                  </td>
                  <td>
                  <p className="text-gray-400 text-sm">{u.mobile}</p>
                  </td>
                   <td>
                  <p className="text-gray-400 text-sm">{u.role}</p>
                  </td>
                <td className="p-4 flex justify-center gap-3">
                  <button
                    onClick={() => handleEditClick(u)}
                    className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors"
                    title="Edit user"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => openDeletePopup(u.id)}
                    className="bg-red-600 hover:bg-red-700 p-2 rounded transition-colors"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDeleteUser}
        loading={deleteLoading}
      />
    </div>
  );
}