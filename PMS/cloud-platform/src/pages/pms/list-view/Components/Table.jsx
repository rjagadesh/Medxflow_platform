import {
  Flex,
  Box,
  Text,
  Button,
  // Modal,
  // ModalOverlay,
  // ModalContent,
  // ModalHeader,
  // ModalCloseButton,
  // ModalBody,
  useDisclosure,
} from "@chakra-ui/react";
import { Badge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Table({ columns, data, onSelect, title }) {
  const navigate = useNavigate();

  const statusNotNeeded = [
    "PATIENT COLLECTIONS",
    "INSURANCE COLLECTIONS",
    "ALL APPOINTMENTS",
    "Payouts",
    "MISSED CHARGES",
    "ALL ENCOUNTERS",
    "UNSIGNED NOTES",
    "BILLING INSURANCE COLLECTIONS",
    "ALL PATIENT",
  ];

  // ----------------------------
  // MODAL + TRUNCATION HANDLING
  // ----------------------------
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalContent, setModalContent] = useState("");

  function showFull(value) {
    setModalContent(value);
    onOpen();
  }

  function TruncatedCell({ value }) {
    if (!value) return <Text fontSize="lg">N/A</Text>;

    const MAX = 25;
    const isLong = value.length > MAX;
    const displayed = isLong ? value.substring(0, MAX) + "..." : value;

    return (
      <Text
        fontSize="lg"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        title={value} // tooltip on hover
      >
        {displayed}

        {isLong && (
          <Text
            as="span"
            ml={1}
            color="#00AEEF"
            cursor="pointer"
            onClick={(e) => {
              e.stopPropagation();
              showFull(value);
            }}
          >
            (view)
          </Text>
        )}
      </Text>
    );
  }

  // ----------------------------------
  // SPECIAL RENDERING FOR INSURANCE
  // ----------------------------------
  if (title === "INSURANCE COLLECTIONS") {
    return (
      <>
        <Box mt={4}>
          {data.map((item, idx) => (
            <Flex
              key={idx}
              p={4}
              borderBottom="1px solid rgba(255,255,255,0.1)"
              align="center"
              justify="space-between"
              _hover={{ bg: "rgba(255,255,255,0.05)", cursor: "pointer" }}
              onClick={() => onSelect(item)}
            >
              <Box w="140px">
                <Text fontSize="md">{item.date}</Text>
                <Text fontSize="sm" opacity={0.7}>
                  {item.id}
                </Text>
              </Box>

              <Box flex="1" ml={4}>
                <Text fontSize="lg" textTransform="uppercase">
                  {item.patient}
                </Text>
                <Text fontSize="sm" opacity={0.7}>
                  {item.provider}
                </Text>
              </Box>

              <Box w="160px">
                <Text color="#00AEEF">{item.amount} charged</Text>
                <Text fontSize="sm" opacity={0.7}>
                  {item.procedures} Procedure
                  {item.procedures > 1 ? "s" : ""}
                </Text>
              </Box>

              <Box flex="1" ml={4}>
                <Text fontSize="sm" opacity={0.9}>
                  {item.payer}
                </Text>
              </Box>

              <Box>
                <Badge borderRadius="50%" w="12px" h="12px" bg={item.status} />
              </Box>
            </Flex>
          ))}
        </Box>

        {/* MODAL FOR FULL TEXT */}
        {/* <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent bg="#1a1a1a" color="white">
            <ModalHeader>Full Value</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text fontSize="lg" whiteSpace="pre-wrap">
                {modalContent}
              </Text>
            </ModalBody>
          </ModalContent>
        </Modal> */}
      </>
    );
  }

  // ----------------------------------
  // DEFAULT TABLE (ALL OTHER TITLES)
  // ----------------------------------
  return (
    <>
      {/* HEADER */}
      <Flex
        px={2}
        pb={2}
        mb={2}
        borderBottom="1px solid rgba(255,255,255,0.15)"
        fontSize="xl"
        textTransform="uppercase"
        opacity={0.7}
        bg="#0f0f0f"
      >
        {columns.map((col) => (
          <Box key={col.key} flex="1">
            {col.label}
          </Box>
        ))}

        {!statusNotNeeded.includes(title) && (
          <Box w="200px" textAlign="center">
            Status
          </Box>
        )}
      </Flex>

      {/* ROWS */}
      {data.map((item, idx) => (
        <Flex
          key={idx}
          px={2}
          py={2}
          borderBottom="1px solid rgba(255,255,255,0.08)"
          align="center"
          _hover={{ background: "rgba(255,255,255,0.06)", cursor: "pointer" }}
          onClick={() => onSelect(item)}
        >
          {/* TABLE CELLS WITH TRUNCATION */}
          {columns.map((col) => (
            <Box key={col.key} flex="1">
              <TruncatedCell value={item[col.key]} />
            </Box>
          ))}

          {/* STATUS BUTTONS */}
          {!statusNotNeeded.includes(title) && (
            <Flex w="200px" justify="center" gap={3}>
              <Button
                size="xs"
                bg="#00afef88"
                color="white"
                borderRadius="20px"
                px={4}
                _hover={{ opacity: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (title === "PROVIDER") {
                    navigate(`/pms/home/provider-profile`);
                  } else {
                    navigate(`/pms/home/patients/1`);
                  }
                }}
              >
                View Profile
              </Button>

              {title !== "PROVIDER" && (
                <Button
                  size="xs"
                  bg="#00afef88"
                  color="white"
                  borderRadius="20px"
                  px={4}
                  _hover={{ opacity: 0.8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Check Eligibility
                </Button>
              )}
            </Flex>
          )}

          {/* TASK LIST SPECIAL BUTTON */}
          {["TASK LIST"].includes(title) && (
            <Flex w="200px" justify="center" gap={3}>
              <Button
                size="xs"
                bg="#00afef88"
                color="white"
                borderRadius="20px"
                px={4}
                _hover={{ opacity: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/pms/clinical/tasks`);
                }}
              >
                View Task
              </Button>
            </Flex>
          )}
        </Flex>
      ))}

      {/* MODAL FOR FULL TEXT */}
      {/* <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="#1a1a1a" color="white">
          <ModalHeader>Full Value</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="lg" whiteSpace="pre-wrap">
              {modalContent}
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal> */}
    </>
  );
}
