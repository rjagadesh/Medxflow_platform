// UserProfile.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { apiRoutes } from "@/services/api"; // ✅ central API routes
import { Card, GridItem, HStack, Image, SimpleGrid } from "@chakra-ui/react";
import CustomInput from "@/components/input/input";
import UserMFASection from "@/features/admin/user-mfa";

const ChangePasswordDialogLazy = lazy(() =>
  import("@/features/admin/modal/change-password")
);

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

import {
  Button,
  FileUpload,
  Float,
  useFileUploadContext,
} from "@chakra-ui/react";
import { LuFileImage, LuX } from "react-icons/lu";
import CustomButton from "@/components/button/button";

const FileUploadList = ({ url }) => {
  const fileUpload = useFileUploadContext();
  console.log("fileUpload", fileUpload);
  const files = fileUpload.acceptedFiles;
  if (files.length > 0) {
    return (
      <FileUpload.ItemGroup className="basis-[120px] shrink-0">
        {files.map((file) => (
          <FileUpload.Item
            boxSize="20"
            file={file}
            key={file.name}
            width={"120px !important"}
            height={"120px !important"}
            borderRadius={"50%"}
            p="0px !important"
            className="upload-image-container"
          >
            <FileUpload.ItemPreviewImage
              borderRadius={"50%"}
              width={"120px !important"}
              height={"120px !important"}
              p="0px !important"
              objectPosition="center"
              objectFit="cover"
            />
            <Float placement="top-end">
              <FileUpload.ItemDeleteTrigger boxSize="4" layerStyle="fill.solid">
                <LuX />
              </FileUpload.ItemDeleteTrigger>
            </Float>
          </FileUpload.Item>
        ))}
      </FileUpload.ItemGroup>
    );
  }

  if (files.length === 0 && !url)
    return (
      <img
        width={120}
        src="/PersonPlaceholder.png"
        height={120}
        style={{
          borderRadius: "50%",
          objectPosition: "center",
          objectFit: "contain",
        }}
        className="border-[0.5px] border-gray-300"
      />
    );
  return (
    <Image
      width={120}
      src={url}
      fallbackSrc="/PersonPlaceholder.png"
      height={120}
      style={{
        borderRadius: "50%",
        objectPosition: "center",
        objectFit: "cover",
      }}
      className="border-[0.5px] border-gray-300"
    />
  );
};

function UserProfile() {
  const [profilePic, setProfilePic] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");
  const [files, setFiles] = useState([]);

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

  const [mfaQr, setMfaQr] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [initialData, setInitialData] = useState({});

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
        setMfaEnabled(userData.mfa_enabled || false);
        setMfaQr(userData.qr_code || "");
        setMfaSecret(userData.mfa_secret || "");

        setInitialData({
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          email: userData.mail || "",
          mobile: userData.mobile || "",
        });

        console.log("Fetched user data:", userData.mfa_secret);
        if (userData.logo) {
          setProfilePic(userData.logo + "/");
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

  const handleProfilePicUpload = (v) => {
    setFiles(v.acceptedFiles);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError("");
    setSaving(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      setSaving(false);
      return;
    }

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

      console.log("files2323", files);

      if (files?.[0]) {
        formData.append("logo", files?.[0]);
      }

      await axios.post(apiRoutes.user.update.url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setFiles([]);
      setInitialData({
        firstName,
        lastName,
        email,
        mobile,
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

  const isChanged =
    firstName !== initialData.firstName ||
    lastName !== initialData.lastName ||
    email !== initialData.email ||
    mobile !== initialData.mobile ||
    files.length > 0;

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

  return (
    <>
      <Card.Root w={"full"} bg={"droidalBlack.300"} border="none">
        <Card.Header
          color="white"
          letterSpacing={"widest"}
          fontSize={"xl"}
          fontWeight={"semibold"}
        >
          Profile Settings
        </Card.Header>
        <Card.Body>
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

            <form onSubmit={handleUpdateProfile}>
              <SimpleGrid columns={3} gap={8}>
                <GridItem colSpan={"3"}>
                  <div style={styles.formGroup}>
                    <FileUpload.Root
                      display={"flex"}
                      accept="image/*"
                      onFileChange={handleProfilePicUpload}
                      onFileReject={(v) => {
                        console.log("File rejected", v);
                      }}
                    >
                      <FileUpload.HiddenInput />
                      <HStack gap={"8"}>
                        <FileUploadList url={profilePic} />
                        <FileUpload.Trigger asChild>
                          <CustomButton leftIcon={<LuFileImage />}>
                            Upload Profile
                          </CustomButton>
                        </FileUpload.Trigger>
                      </HStack>
                    </FileUpload.Root>
                  </div>
                </GridItem>

                <CustomInput
                  label={"First Name"}
                  placeholder={"Enter your first name"}
                  value={firstName}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^a-zA-Z\s]/g, "")
                      .slice(0, 15);
                    setFirstName(val);
                  }}
                />
                <CustomInput
                  label={"Last Name"}
                  placeholder={"Enter your last name"}
                  value={lastName}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^a-zA-Z\s]/g, "")
                      .slice(0, 15);
                    setLastName(val);
                  }}
                />
                <CustomInput
                  label={"Email Id"}
                  placeholder={"Enter your email"}
                  value={email}
                  disabled={true}
                  // onChange={(e) => setEmail(e.target.value)}
                />
                <CustomInput
                  label={"Mobile"}
                  placeholder={"Enter your mobile number"}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </SimpleGrid>

              {/* ✅ Buttons on same line */}
              <HStack
                mt={"8"}
                justify={"space-between"}
                w="full"
                align="center"
              >
                {/* Left side: MFA Section */}
                <div
                  style={{
                    flexGrow: 1,
                    display: "flex",
                    justifyContent: "flex-start",
                  }}
                >
                  <UserMFASection
                    initialEnabled={mfaEnabled}
                    initialQr={mfaQr}
                    initialSecret={mfaSecret}
                    onMFAEnabled={(secret, qr) => {
                      setMfaSecret(secret);
                      setMfaQr(qr);
                      setMfaEnabled(true);
                    }}
                    onMFARegenerated={(secret, qr) => {
                      setMfaSecret(secret);
                      setMfaQr(qr);
                    }}
                  />
                </div>

                {/* Right side: Change Password and Save Button */}
                <HStack gap={3}>
                  <Suspense
                    fallback={
                      <CustomButton disabled loading={true}>
                        Change Password
                      </CustomButton>
                    }
                  >
                    <ChangePasswordDialogLazy />
                  </Suspense>
                  <CustomButton type="submit" disabled={saving || !isChanged}>
                    {saving ? "Saving..." : "Save"}
                  </CustomButton>
                </HStack>
              </HStack>
            </form>
          </div>
        </Card.Body>
      </Card.Root>
    </>
  );
}

export default UserProfile;
