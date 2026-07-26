import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  GridItem,
  HStack,
  VStack,
  Text,
  Button,
  Table,
  Dialog,
} from "@chakra-ui/react";
import { Download, ChevronDown, CheckCircle, X } from "lucide-react";
import axios from "axios";
import { apiRoutes } from "@/services/api";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import UnauthorizedPage from "@/pages/unauthorized";

const PaymentPreview = () => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // "success" | "cancel" | null
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const { hasPermission } = usePermissions();

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const response = await axios({
          method: apiRoutes.paymentpreview.get.method,
          url: apiRoutes.paymentpreview.get.url,
          withCredentials: apiRoutes.paymentpreview.get.isAuthenticated,
        });

        setTransactions(response.data.transactions || []); // <-- fix here
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, []);

  // Check URL for status query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status"); // "success" or "cancel"
    if (status) {
      setPaymentStatus(status);
      setIsPaymentOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const recentTransactions = transactions.slice(0, 3);

  // --- Stripe Checkout ---
  const handlePayment = async () => {
    const amount = 1000; // USD
    try {
      const response = await axios({
        method: apiRoutes.paymentpreview.create.method,
        url: apiRoutes.paymentpreview.create.url,
        data: { amount },
        withCredentials: apiRoutes.paymentpreview.create.isAuthenticated,
      });

      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  if (!hasPermission("payment_overview", "view")) return <UnauthorizedPage />;

  return (
    <Box w="full" color="white">
      <Text
        letterSpacing="widest"
        fontSize={{ base: "md", "2xl": "lg", "3xl": "xl" }}
        fontWeight="semibold"
        mb="20px"
        bg="droidalBlack.300"
        p="20px"
        borderRadius="8px"
      >
        Payment Overview
      </Text>

      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap="20px">
        {/* Balance Card */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <Box bg="#1e4270" p="20px" borderRadius="8px">
            <VStack align="flex-start" spacing="15px">
              <Text fontSize="xl" fontWeight="semibold">
                Your Balance
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="white">
                $8,292.82
              </Text>

              <VStack align="flex-start" spacing="8px" w="full">
                <HStack>
                  <Text fontWeight="bold" color="gray.300">
                    Automatic payments:
                  </Text>
                  <Text>Next charge on</Text>
                  <Text fontWeight="bold">1 Sept</Text>
                  <Text>(or earlier if $15,000 threshold is hit)</Text>
                </HStack>

                <HStack>
                  <Text fontWeight="bold" color="gray.300">
                    Last payment:
                  </Text>
                  <Text>30 Jul for</Text>
                  <Text fontWeight="bold">$1,000.00</Text>
                  <Text color="gray.400">(manual)</Text>
                </HStack>
              </VStack>

              {/* Stripe Checkout Button */}
              <Button
                bg="#2196f3"
                color="white"
                _hover={{ bg: "#1976d2" }}
                size="md"
                mt="10px"
                onClick={handlePayment}
              >
                Make a Payment
              </Button>
            </VStack>
          </Box>
        </GridItem>

        {/* Transactions Card */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <Box bg="#1e4270" p="20px" borderRadius="8px" h="full">
            <VStack align="flex-start" spacing="15px" h="full">
              <Text fontSize="xl" fontWeight="semibold">
                Transactions
              </Text>

              <Table.Root
                variant="simple"
                size="sm"
                bg="#2a2a2a"
                borderRadius="6px"
                overflow="hidden"
              >
                <Table.Header bg="#1a1a1a">
                  <Table.Row>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Date Range
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Status
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Card Number
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Card Type
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Amount
                    </Table.ColumnHeader>
                    {/* <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Actions
                    </Table.ColumnHeader> */}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {loadingTransactions ? (
                    <Table.Row>
                      <Table.Cell colSpan={6} textAlign="center">
                        <Text>Loading transactions...</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    recentTransactions.map((transaction, index) => (
                      <Table.Row key={index}>
                        <Table.Cell borderColor="#555">
                          {transaction.created}
                        </Table.Cell>
                        <Table.Cell borderColor="#555" fontWeight="semibold">
                          {transaction.status}
                        </Table.Cell>
                        <Table.Cell borderColor="#555" fontWeight="semibold">
                          {transaction.card_number}
                        </Table.Cell>

                        <Table.Cell borderColor="#555" fontWeight="semibold">
                          {transaction.card_type}
                        </Table.Cell>
                        <Table.Cell borderColor="#555" fontWeight="semibold">
                          {transaction.amount}
                        </Table.Cell>
                        {/* <Table.Cell borderColor="#555">
                          <Button size="xs" bg="#2196f3" color="white" _hover={{ bg: "#1976d2" }}>
                              Download
                          </Button>
                        </Table.Cell> */}
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>

              <Button
                rightIcon={<ChevronDown size={16} />}
                variant="outline"
                borderColor="#2196f3"
                color="#2196f3"
                _hover={{ bg: "#2196f3", color: "white" }}
                size="sm"
                onClick={() => setIsTransactionsOpen(true)}
                w="full"
              >
                Show More
              </Button>
            </VStack>
          </Box>
        </GridItem>
      </Grid>

      {/* Payment Status Dialog */}
      <Dialog.Root
        open={isPaymentOpen}
        onOpenChange={(details) => {
          setIsPaymentOpen(details.open);
          if (!details.open && paymentStatus) {
            setPaymentStatus(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="#1e4270"
            color="white"
            maxW="md"
            textAlign="center"
            py="140px"
            px="30px"
            borderRadius="12px"
          >
            {paymentStatus === "success" && (
              <VStack spacing="20px">
                <Box
                  animation="scaleIn 0.5s ease-out, pulse 2s ease-in-out infinite"
                  sx={{
                    "@keyframes scaleIn": {
                      "0%": { transform: "scale(0)", opacity: 0 },
                      "50%": { transform: "scale(1.1)" },
                      "100%": { transform: "scale(1)", opacity: 1 },
                    },
                    "@keyframes pulse": {
                      "0%, 100%": { transform: "scale(1)" },
                      "50%": { transform: "scale(1.05)" },
                    },
                  }}
                >
                  <Box
                    position="relative"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box
                      position="absolute"
                      w="100px"
                      h="100px"
                      bg="#4BB543"
                      opacity="0.2"
                      borderRadius="full"
                      animation="ripple 1.5s ease-out infinite"
                      sx={{
                        "@keyframes ripple": {
                          "0%": { transform: "scale(0.8)", opacity: 0.3 },
                          "100%": { transform: "scale(1.5)", opacity: 0 },
                        },
                      }}
                    />
                    <CheckCircle size={70} color="#4BB543" strokeWidth={2.5} />
                  </Box>
                </Box>
                <VStack spacing="30px">
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    animation="fadeInUp 0.6s ease-out 0.3s backwards"
                    marginTop={"50px"}
                    sx={{
                      "@keyframes fadeInUp": {
                        "0%": { transform: "translateY(20px)", opacity: 0 },
                        "100%": { transform: "translateY(0)", opacity: 1 },
                      },
                    }}
                  >
                    Payment Successful!
                  </Text>
                  <Text
                    color="gray.400"
                    animation="fadeInUp 0.6s ease-out 0.5s backwards"
                    sx={{
                      "@keyframes fadeInUp": {
                        "0%": { transform: "translateY(20px)", opacity: 0 },
                        "100%": { transform: "translateY(0)", opacity: 1 },
                      },
                    }}
                  >
                    Your transaction has been completed
                  </Text>
                </VStack>
              </VStack>
            )}
            {paymentStatus === "cancel" && (
              <VStack spacing="20px">
                <Box
                  animation="shakeIn 0.6s ease-out"
                  sx={{
                    "@keyframes shakeIn": {
                      "0%": {
                        transform: "scale(0) rotate(-180deg)",
                        opacity: 0,
                      },
                      "50%": { transform: "scale(1.1) rotate(10deg)" },
                      "70%": { transform: "scale(0.9) rotate(-10deg)" },
                      "100%": {
                        transform: "scale(1) rotate(0deg)",
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <Box
                    position="relative"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box
                      position="absolute"
                      w="100px"
                      h="100px"
                      bg="#FF4D4F"
                      opacity="0.2"
                      borderRadius="full"
                      animation="warningPulse 2s ease-in-out infinite"
                      sx={{
                        "@keyframes warningPulse": {
                          "0%, 100%": { transform: "scale(1)", opacity: 0.2 },
                          "50%": { transform: "scale(1.2)", opacity: 0.1 },
                        },
                      }}
                    />
                    <X size={70} color="#FF4D4F" strokeWidth={2.5} />
                  </Box>
                </Box>
                <VStack spacing="10px">
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    animation="fadeInUp 0.6s ease-out 0.3s backwards"
                    marginTop={"50px"}
                    sx={{
                      "@keyframes fadeInUp": {
                        "0%": { transform: "translateY(20px)", opacity: 0 },
                        "100%": { transform: "translateY(0)", opacity: 1 },
                      },
                    }}
                  >
                    Payment Cancelled
                  </Text>
                  <Text
                    color="gray.400"
                    animation="fadeInUp 0.6s ease-out 0.5s backwards"
                    sx={{
                      "@keyframes fadeInUp": {
                        "0%": { transform: "translateY(20px)", opacity: 0 },
                        "100%": { transform: "translateY(0)", opacity: 1 },
                      },
                    }}
                  >
                    Your transaction was not completed
                  </Text>
                </VStack>
              </VStack>
            )}
            <Button
              mt="30px"
              bg="#2196f3"
              color="white"
              _hover={{ bg: "#1976d2", transform: "translateY(-2px)" }}
              onClick={() => setIsPaymentOpen(false)}
              w="full"
              size="lg"
              transition="all 0.2s"
              animation="fadeInUp 0.6s ease-out 0.7s backwards"
              sx={{
                "@keyframes fadeInUp": {
                  "0%": { transform: "translateY(20px)", opacity: 0 },
                  "100%": { transform: "translateY(0)", opacity: 1 },
                },
              }}
            >
              Close
            </Button>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Transactions History Dialog */}
      <Dialog.Root
        open={isTransactionsOpen}
        onOpenChange={(details) => setIsTransactionsOpen(details.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="#1e4270"
            color="white"
            maxW="4xl"
            textAlign="left"
            py="20px"
            px="20px"
            borderRadius="12px"
          >
            <VStack align="flex-start" spacing="15px">
              <Text fontSize="xl" fontWeight="semibold">
                All Transactions
              </Text>
              <Table.Root
                variant="simple"
                size="sm"
                bg="#2a2a2a"
                borderRadius="6px"
                overflow="hidden"
                w="full"
              >
                <Table.Header bg="#1a1a1a">
                  <Table.Row>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Date Range
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Status
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Card Number
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Card Type
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.300" borderColor="#555">
                      Amount
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {transactions.map((transaction, index) => (
                    <Table.Row key={index}>
                      <Table.Cell borderColor="#555">
                        {transaction.created}
                      </Table.Cell>
                      <Table.Cell borderColor="#555" fontWeight="semibold">
                        {transaction.status}
                      </Table.Cell>
                      <Table.Cell borderColor="#555" fontWeight="semibold">
                        {transaction.card_number}
                      </Table.Cell>
                      <Table.Cell borderColor="#555" fontWeight="semibold">
                        {transaction.card_type}
                      </Table.Cell>
                      <Table.Cell borderColor="#555" fontWeight="semibold">
                        {transaction.amount}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
              <Button
                mt="10px"
                bg="#2196f3"
                color="white"
                _hover={{ bg: "#1976d2" }}
                onClick={() => setIsTransactionsOpen(false)}
                w="full"
              >
                Close
              </Button>
            </VStack>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default PaymentPreview;
