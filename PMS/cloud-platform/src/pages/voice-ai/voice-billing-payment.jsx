import React, { useMemo, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, BadgeDollarSign } from "lucide-react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import VoiceAiHeader from "./components/voice-ai-header";
import CustomButton from "@/components/button/button";
import PageTransition from "@/components/ui/PageTransition";
import { apiRoutes } from "@/services/api";
import { toaster } from "@/components/ui/toaster";
import apiRequest from "@/services/api-request";
import UserMenu from "@/components/user-popover/user-popover";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";

const VoiceAIPayment = () => {
  const navigate = useNavigate();
  const { department_id, agent_app } = useParams();

  const [amount, setAmount] = useState("100");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeField, setActiveField] = useState("");

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  const goBackToBilling = () => {
    navigate(`/voice-ai/${department_id}/${agent_app}/billing`);
  };

  const handleContinueToStripe = async () => {
    if (!parsedAmount || parsedAmount <= 0) {
      toaster.error({
        title: "Invalid amount",
        description: "Please enter an amount greater than 0.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const billingReturnUrl = `${window.location.origin}/voice-ai/${department_id}/${agent_app}/billing`;
      const response = await apiRequest(apiRoutes.voiceAI.checkout.create, {
        payload: {
          amount: parsedAmount,
          customer_name: customerName || undefined,
          customer_email: customerEmail || undefined,
          business_name: "MedXFlow",
          stripe_theme: {
            mode: "dark",
            business_name: "MedXFlow",
            colors: {
              background: "#0d2b52",
              surface: "#16375e",
              border: "#2f4d78",
              text: "#FFFFFF",
              muted_text: "#90a6c6",
              accent: "#1a5dad",
            },
            gradients: {
              primary:
                "linear-gradient(180deg, rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
            },
          },
          source: "voice_ai_add_funds",
          success_url: `${billingReturnUrl}?status=success`,
          cancel_url: `${billingReturnUrl}?status=cancel`,
        },
      });

      console.log("response1212", response);

      if (response?.checkout_url) {
        window.location.href = response.checkout_url;
        return;
      }

      toaster.error({
        title: "Payment initialization failed",
        description: "Stripe checkout URL was not returned by the server.",
      });
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      toaster.error({
        title: "Unable to continue",
        description: "Failed to initiate Stripe payment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <Flex height="full" flexDirection="column">
        <style>
          {`
          body {
            margin: 0;
            overflow: hidden;
          }

          .card-glow {
            border-width: 2px;
            border-color: #2f4d78;
            transition: all 0.3s ease;
          }

          .card-glow:hover {
            border-width: 2px;
            border-color: rgba(0, 187, 242, 0.3);
            box-shadow: 0 0 50px rgba(0, 187, 242, 0.05);
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #000000;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #1A1A1A;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #333;
          }
        `}
        </style>

        <HStack justify={"space-between"} py={3}>
          <CustomBreadcrumb
            sidebarItems={[
              {
                name: "Agents",
                to: `/voice-ai/${department_id}`,
                end: true,
              },
              {
                name: "Analytics",
                to: `/voice-ai/${department_id}/analytics`,
              },
              {
                name: "Billing",
                to: `/voice-ai/${department_id}/billing`,
              },
            ]}
            suffix={`/voice-ai/${department_id}/`}
            search={location.search}
            fontSize={{
              base: "sm",
            }}
          />

          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </HStack>
        <Box
          bgColor="droidalBlack.400"
          borderRadius="xl"
          flex="0.99"
          p={6}
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="mx-auto flex flex-col gap-y-6 max-w-4xl">
              <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                <VStack align="start" gap={1}>
                  <Text
                    color="white"
                    fontSize={{ base: "xl", md: "2xl" }}
                    letterSpacing="widest"
                    fontWeight="bold"
                  >
                    Add Funds
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    Enter amount and billing details, then continue securely to
                    Stripe for MedXFlow.
                  </Text>
                </VStack>
                <CustomButton
                  size="xs"
                  variant="outline"
                  leftIcon={<ArrowLeft size={14} />}
                  onClick={goBackToBilling}
                >
                  Back to Billing
                </CustomButton>
              </Flex>

              <Grid templateColumns={{ base: "1fr", lg: "1.2fr 1fr" }} gap={6}>
                <GridItem>
                  <Box
                    className="card-glow"
                    bg="droidalBlack.300"
                    borderRadius="xl"
                    p={6}
                  >
                    <VStack align="stretch" gap={4}>
                      <Flex align="center" gap={2}>
                        <BadgeDollarSign size={18} color="#00bbf2" />
                        <Text
                          color="white"
                          letterSpacing="wider"
                          fontWeight="600"
                        >
                          Payment Details
                        </Text>
                      </Flex>

                      <Box>
                        <Text
                          mb={2}
                          color={
                            activeField === "amount"
                              ? "var(--color-droid-primary-400)"
                              : "#90a6c6"
                          }
                          fontSize="xs"
                          letterSpacing="wider"
                        >
                          Amount (USD)
                        </Text>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          onFocus={() => setActiveField("amount")}
                          onBlur={() => setActiveField("")}
                          placeholder="Enter amount"
                          borderColor="#2f4d78"
                          bg="var(--color-droidal-black-400)"
                          color="white"
                          _hover={{
                            borderColor: "var(--color-droid-primary-400)",
                          }}
                          _focusVisible={{
                            borderColor: "var(--color-droid-primary-400)",
                            boxShadow:
                              "0 0 0 1px var(--color-droid-primary-400)",
                          }}
                        />
                      </Box>

                      <Box>
                        <Text
                          mb={2}
                          color={
                            activeField === "name"
                              ? "var(--color-droid-primary-400)"
                              : "#90a6c6"
                          }
                          fontSize="xs"
                          letterSpacing="wider"
                        >
                          Cardholder Name (Optional)
                        </Text>
                        <Input
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          onFocus={() => setActiveField("name")}
                          onBlur={() => setActiveField("")}
                          placeholder="Name on card"
                          borderColor="#2f4d78"
                          bg="var(--color-droidal-black-400)"
                          color="white"
                          _hover={{
                            borderColor: "var(--color-droid-primary-400)",
                          }}
                          _focusVisible={{
                            borderColor: "var(--color-droid-primary-400)",
                            boxShadow:
                              "0 0 0 1px var(--color-droid-primary-400)",
                          }}
                        />
                      </Box>

                      <Box>
                        <Text
                          mb={2}
                          color={
                            activeField === "email"
                              ? "var(--color-droid-primary-400)"
                              : "#90a6c6"
                          }
                          fontSize="xs"
                          letterSpacing="wider"
                        >
                          Email (Optional)
                        </Text>
                        <Input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          onFocus={() => setActiveField("email")}
                          onBlur={() => setActiveField("")}
                          placeholder="you@company.com"
                          borderColor="#2f4d78"
                          bg="var(--color-droidal-black-400)"
                          color="white"
                          _hover={{
                            borderColor: "var(--color-droid-primary-400)",
                          }}
                          _focusVisible={{
                            borderColor: "var(--color-droid-primary-400)",
                            boxShadow:
                              "0 0 0 1px var(--color-droid-primary-400)",
                          }}
                        />
                      </Box>

                      <CustomButton
                        size="sm"
                        onClick={handleContinueToStripe}
                        loading={isSubmitting}
                      >
                        Continue to Payment
                      </CustomButton>
                    </VStack>
                  </Box>
                </GridItem>

                <GridItem>
                  <Box
                    className="card-glow"
                    bg="droidalBlack.300"
                    borderRadius="xl"
                    p={6}
                    h="full"
                  >
                    <VStack align="stretch" gap={4}>
                      <Text
                        color="white"
                        letterSpacing="wider"
                        fontWeight="600"
                      >
                        Summary
                      </Text>

                      <Box
                        bg="var(--color-droidal-black-300)"
                        border="1px solid"
                        borderColor="#2f4d78"
                        borderRadius="lg"
                        p={4}
                      >
                        <Text
                          color="gray.400"
                          fontSize="xs"
                          letterSpacing="widest"
                        >
                          TOP-UP AMOUNT
                        </Text>
                        <Text
                          color="white"
                          fontSize="3xl"
                          fontWeight="700"
                          mt={2}
                        >
                          $
                          {Number.isFinite(parsedAmount)
                            ? parsedAmount.toFixed(2)
                            : "0.00"}
                        </Text>
                      </Box>

                      <Box
                        borderRadius="md"
                        p={3}
                        bgImage="var(--bg-blue-gradient2)"
                        color="white"
                        fontSize="sm"
                        lineHeight="tall"
                      >
                        For security and PCI compliance, card entry and payment
                        confirmation are completed on Stripe hosted checkout.
                      </Box>

                      <Text color="#90a6c6" fontSize="xs">
                        After successful payment, Stripe redirects you back to
                        MedXFlow billing.
                      </Text>
                    </VStack>
                  </Box>
                </GridItem>
              </Grid>
            </div>
            <div className="h-10"></div>
          </div>
        </Box>
      </Flex>
    </PageTransition>
  );
};

export default VoiceAIPayment;
