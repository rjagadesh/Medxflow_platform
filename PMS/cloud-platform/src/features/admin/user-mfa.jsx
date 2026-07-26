import React, { useState, useEffect } from "react";
import { useUserMFA } from "@/hooks/mutation/admin/useCreateMFA";
import {
  Dialog,
  Stack,
  Box,
  Text,
  HStack,
  Portal,
  Flex,
} from "@chakra-ui/react";
import CustomButton from "@/components/button/button";

const UserMFASection = ({
  initialEnabled = false,
  initialSecret = "",
  initialQr = "",
  onMFAEnabled, // Add callback for when MFA is enabled
  onMFARegenerated, // Add callback for when MFA is regenerated
}) => {
  const [mfaEnabled, setMfaEnabled] = useState(initialEnabled);
  const [secretKey, setSecretKey] = useState(initialSecret);
  const [qrCode, setQrCode] = useState(initialQr);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    enableMfa,
    disableMfa,
    regenerateMfa,
    isEnabling,
    isDisabling,
    isRegenerating,
  } = useUserMFA();

  useEffect(() => {
    setMfaEnabled(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    setSecretKey(initialSecret);
  }, [initialSecret]);

  useEffect(() => {
    setQrCode(initialQr);
  }, [initialQr]);

  const handleToggle = async (e) => {
    const checked = e.target.checked;
    if (checked) {
      try {
        const res = await enableMfa.mutateAsync();
        console.log("Enable MFA response:", res);
        // Access secret and qr_code safely - adjust if response wraps in data property
        const secret = res?.mfa_secret ?? res?.data?.mfa_secret ?? "";
        const qr = res?.qr_code ?? res?.data?.qr_code ?? "";
        setSecretKey(secret);
        setQrCode(qr);
        setMfaEnabled(true);

        // Notify parent about MFA enablement
        if (onMFAEnabled) {
          onMFAEnabled(secret, qr);
        }
      } catch (err) {
        console.error("Enable MFA error:", err);
      }
    } else {
      try {
        await disableMfa.mutateAsync();
        setSecretKey("");
        setQrCode("");
        setMfaEnabled(false);

        // Notify parent about MFA disablement
        if (onMFAEnabled) {
          onMFAEnabled("", "");
        }
      } catch (err) {
        console.error("Disable MFA error:", err);
      }
    }
  };

  const handleRegenerate = async () => {
    try {
      const res = await regenerateMfa.mutateAsync();
      console.log("Regenerate MFA response:", res);

      // Fix: Use the same property names as enableMfa response
      const secret =
        res?.mfa_secret ??
        res?.data?.mfa_secret ??
        res?.secret ??
        res?.data?.secret ??
        "";
      const qr = res?.qr_code ?? res?.data?.qr_code ?? "";

      console.log("Regenerated secret:", secret);
      console.log("Regenerated QR:", qr);

      setSecretKey(secret);
      setQrCode(qr);

      // Notify parent about regeneration
      if (onMFARegenerated) {
        onMFARegenerated(secret, qr);
      }
    } catch (err) {
      console.error("Regenerate MFA error:", err);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <Box
      mt="4px"
      p="16px"
      border="1px solid #495057"
      borderRadius="6px"
      backgroundColor="#1a1a1a"
    >
      <Flex alignItems="center" justifyContent="flex-start" gap="12px">
        {/* Enable MFA checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "white",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <input
            type="checkbox"
            checked={mfaEnabled}
            onChange={handleToggle}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          Enable MFA
        </label>

        {/* Buttons only if MFA enabled */}
        {mfaEnabled && (
          <>
            <CustomButton onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </CustomButton>
            <CustomButton onClick={() => setIsDialogOpen(true)}>
              View Details
            </CustomButton>
          </>
        )}
      </Flex>

      {/* Chakra UI Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              bg="#2a2a2a"
              color="white"
              p="6"
              borderRadius="8px"
              maxWidth="500px"
            >
              <Dialog.CloseTrigger onClick={handleCloseDialog} />
              <Dialog.Header fontWeight="bold">MFA Details</Dialog.Header>

              <Dialog.Body>
                <Stack spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Secret Key:
                    </Text>
                    <Box
                      backgroundColor="#1a1a1a"
                      padding="12px"
                      borderRadius="4px"
                      fontSize="14px"
                      fontFamily="monospace"
                      wordBreak="break-all"
                      color="#aaa"
                      fontWeight="500"
                    >
                      {secretKey || "No secret key available"}
                    </Box>
                  </Box>

                  {qrCode && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        QR Code:
                      </Text>
                      <Box display="flex" justifyContent="center">
                        <img
                          src={qrCode?.replace("http://", "https://") + "/"}
                          alt="MFA QR Code"
                          style={{
                            width: "200px",
                            height: "200px",
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <HStack justify="flex-end" spacing={3}>
                  <CustomButton variant="ghost" onClick={handleCloseDialog}>
                    Close
                  </CustomButton>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default UserMFASection;
