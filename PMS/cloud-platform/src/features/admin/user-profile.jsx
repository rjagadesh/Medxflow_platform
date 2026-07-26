// UserProfile.jsx
import React, { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import { apiRoutes } from "@/services/api"; // ✅ central API routes

const styles = {
  formGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px", fontWeight: "bold" },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box",
    color: "#fff",
    borderColor: "#495057",
  },
  btn: {
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    border: "none",
    color: "white",
    fontSize: "16px",
    marginTop: "15px",
  },
  btnAdd: { backgroundColor: "#007bff" },
  profileSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  profileImageContainer: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #007bff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#555",
    flexShrink: 0,
    marginLeft: "15px",
  },
  profileImage: { width: "100%", height: "100%", objectFit: "cover" },
  defaultProfileIcon: { fontSize: "30px", color: "#bbb" },
  fileInputLabel: {
    display: "inline-block",
    backgroundColor: "#495057",
    color: "white",
    padding: "8px 15px",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "5px",
    fontSize: "14px",
    border: "1px solid #6c757d",
    transition: "background-color 0.2s ease",
  },
  fileInputLabelHover: { backgroundColor: "#6c757d" },
  fileInput: { display: "none" },
  fileName: { marginLeft: "10px", fontSize: "14px", color: "#bbb" },
};

function UserProfile() {
  const [profilePic, setProfilePic] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          setError("Authentication token not found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get(apiRoutes.me.get.url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = response.data;
        setUserId(userData.id);
        setFirstName(userData.first_name || "");
        setLastName(userData.last_name || "");
        setEmail(userData.mail || "");
        setMobile(userData.mobile || "");
        if (userData.logo) {
          setProfilePic(userData.logo);
          setFileName(userData.logo.split("/").pop());
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        if (err.response?.status === 401) {
          setError("Session expired or unauthorized. Please log in again.");
        } else {
          setError("Failed to fetch user details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleProfilePicUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFileName("No file chosen");
      setProfilePic(null);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError("");
    setSaving(true);

    if (!userId) {
      setError("User ID not found. Cannot update profile.");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("mail", email);
      formData.append("mobile", mobile);

      const fileInput = document.getElementById("profilePicUpload");
      if (fileInput.files?.[0]) {
        formData.append("logo", fileInput.files[0]);
      }

      await axios.post(apiRoutes.user.update.url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating user profile:", err);
      setError(
        err.response?.data
          ? `Failed to update profile: ${JSON.stringify(err.response.data)}`
          : "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (!currentPassword || !newPassword) {
      setError("Current password and new password are required.");
      return;
    }

    try {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        return;
      }

      await axios.post(
        `${apiRoutes.me.get.url.replace(/me\/$/, "me/change_password/")}`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      setError(
        err.response?.data
          ? `Failed to change password: ${JSON.stringify(err.response.data)}`
          : "Failed to change password. Please try again."
      );
    }
  };

  if (loading)
    return <div style={{ color: "#fff" }}>Loading user profile...</div>;

  return (
    <div>
      {/* Toast Popups */}
      {successMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#28a745",
            color: "#fff",
            padding: "15px 20px",
            borderRadius: "5px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 9999,
          }}
        >
          {successMessage}
        </div>
      )}

      {error && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#dc3545",
            color: "#fff",
            padding: "15px 20px",
            borderRadius: "5px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 9999,
          }}
        >
          {error}
        </div>
      )}

      <div style={styles.profileSectionHeader}>
        <h3>User Profile</h3>
        <div style={styles.profileImageContainer}>
          {profilePic ? (
            <img src={profilePic} alt="Profile" style={styles.profileImage} />
          ) : (
            <FaUserCircle style={styles.defaultProfileIcon} />
          )}
        </div>
      </div>

      <form onSubmit={handleUpdateProfile}>
        <div style={styles.formGroup}>
          <label style={styles.label}>First Name</label>
          <input
            type="text"
            style={styles.input}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Last Name</label>
          <input
            type="text"
            style={styles.input}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Mobile</label>
          <input
            type="text"
            style={styles.input}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Profile</label>
          <input
            type="file"
            id="profilePicUpload"
            style={styles.fileInput}
            accept="image/*"
            onChange={handleProfilePicUpload}
          />
          <label
            htmlFor="profilePicUpload"
            style={styles.fileInputLabel}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor =
                styles.fileInputLabelHover.backgroundColor)
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor =
                styles.fileInputLabel.backgroundColor)
            }
          >
            Upload Profile
          </label>
        </div>

        <button
          type="submit"
          style={{ ...styles.btn, ...styles.btnAdd }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

export default UserProfile;
