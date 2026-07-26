import { Dialog, Stack, Box, Text, HStack, Portal } from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { apiRoutes } from "@/services/api";
import CustomButton from "@/components/button/button";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import zxcvbn from "zxcvbn";

function ChangePasswordDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // Use a ref to track the open state
  const isOpenRef = useRef(isOpen);

  // Update ref when state changes
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const handleNewPassword = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    // Uncomment if zxcvbn is available
    const result = zxcvbn(value);
    setStrength(result.score);
  };

  const handleChangePassword = async () => {
    setMessage("");
    setMessageType("");

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("All fields are required.");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access");
      if (!token) {
        setMessage("Authentication token not found. Please log in.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Use the same endpoint pattern as in UserProfile
      await axios.post(
        `${apiRoutes.me.get.url.replace(/me\/$/, "change-password/")}`,
        {
          current_password: oldPassword,
          new_password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("Password updated successfully!");
      setMessageType("success");

      // Reset fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStrength(0);

      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Error changing password:", err);
      if (err.response?.status === 400) {
        setMessage("Incorrect current password.");
      } else if (err.response?.status === 401) {
        setMessage("Session expired. Please log in again.");
      } else {
        setMessage(
          err.response?.data?.detail ||
            "Failed to change password. Please try again."
        );
      }
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    // Reset all fields when dialog closes
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStrength(0);
    setMessage("");
    setMessageType("");
  };

  return (
    <Dialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <CustomButton onClick={() => setIsOpen(true)}>
          Change Password
        </CustomButton>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="#2a2a2a" color="white" borderRadius="8px">
            <Dialog.CloseTrigger onClick={handleDialogClose} />
            <Dialog.Header m={0} fontWeight="light" fontSize={"lg"}>
              Change Password
            </Dialog.Header>
            <Dialog.Body>
              <Stack spacing={4}>
                <Box>
                  <Text mb={2}>Current Password</Text>
                  <PasswordInput
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    bg="white"
                    color="black"
                  />
                </Box>
                <Box>
                  <Text mb={2}>New Password</Text>
                  <PasswordInput
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={handleNewPassword}
                    bg="white"
                    color="black"
                  />
                  <PasswordStrengthMeter value={strength} mt={2} />
                </Box>
                <Box>
                  <Text mb={2}>Confirm New Password</Text>
                  <PasswordInput
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    bg="white"
                    color="black"
                  />
                </Box>
              </Stack>
              {message && (
                <Text
                  mt={4}
                  fontSize="sm"
                  color={messageType === "success" ? "green.300" : "red.300"}
                  fontWeight="medium"
                >
                  {message}
                </Text>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <HStack justify="flex-end" spacing={3}>
                <Dialog.ActionTrigger>
                  <CustomButton variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </CustomButton>
                </Dialog.ActionTrigger>
                <CustomButton onClick={handleChangePassword} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </CustomButton>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default ChangePasswordDialog;
