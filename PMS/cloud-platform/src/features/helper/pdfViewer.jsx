import CustomButton from "@/components/button/button";
import PdfTrimmer from "@/components/pdf-trimmer/pdf-trimmer";
import {
  Box,
  Dialog,
  Heading,
  HStack,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { EditIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const PdfViewer = ({
  isOpen,
  onClose,
  title,
  pdfUrl,
  formRender,
  renderFooter,
  subtitle,
}) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setLeftWidth(50);
      setIsDragging(false);
    }
  }, [isOpen]);

  return (
    <Dialog.Root
      size={formRender ? "full" : "xl"}
      placement={"center"}
      open={isOpen}
      onOpenChange={(v) => onClose(v.open)}
      scrollBehavior={"inside"}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor={"droidalBlack.300"}
            color={"white"}
            className="max-w-4xl"
          >
            <Dialog.Header>
              {formRender && (
                <>
                  <Dialog.Title className="relative" w="full" as="div" m={0}>
                    <>
                      <VStack alignItems={"flex-start"} gap={"0"}>
                        <Heading p={0} m={0} color="primary.400">
                          {title}
                        </Heading>
                        <Text fontSize={"sm"} fontWeight={"300"}>
                          {subtitle}
                        </Text>
                      </VStack>
                    </>
                  </Dialog.Title>
                </>
              )}
              {!formRender && (
                <>
                  <Dialog.Title>{title}</Dialog.Title>
                </>
              )}
            </Dialog.Header>
            <Dialog.Body minH={"60vh"} overflow={"unset"}>
              {formRender && (
                <HStack
                  gap={0}
                  alignItems={"flex-start"}
                  ref={containerRef}
                  position="relative"
                >
                  <Box
                    width={`${leftWidth}%`}
                    flexShrink={0}
                    pointerEvents={isDragging ? "none" : "auto"}
                    position="relative"
                  >
                    {openEdit && (
                      <PdfTrimmer
                        onClose={() => setOpenEdit(false)}
                        initialPdfUrl={pdfUrl}
                      />
                    )}
                    {!openEdit && (
                      <iframe
                        src={pdfUrl}
                        className="w-full h-[75vh] border-0"
                        title={title}
                      />
                    )}
                    {!openEdit && (
                      <CustomButton
                        onClick={() => {
                          setOpenEdit(true);
                        }}
                        position="absolute"
                        top="10px"
                        right="10px"
                        leftIcon={<EditIcon />}
                      >
                        Edit PDF
                      </CustomButton>
                    )}
                  </Box>

                  {/* Draggable Divider */}
                  <Box
                    width="8px"
                    height="75vh"
                    bg={isDragging ? "primary.300" : "gray.600"}
                    cursor="col-resize"
                    position="relative"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    _hover={{ bg: "primary.300" }}
                    transition="background-color 0.2s"
                    flexShrink={0}
                  >
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      width="20px"
                      height="40px"
                      bg={isDragging ? "primary.600" : "gray.700"}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      pointerEvents="none"
                    >
                      <Box as="span" fontSize="xs" color="white">
                        ⋮
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    width={`${100 - leftWidth}%`}
                    flexShrink={0}
                    pl={4}
                    overflowY="auto"
                    height="75vh"
                    pointerEvents={isDragging ? "none" : "auto"}
                  >
                    {formRender && formRender}
                  </Box>
                </HStack>
              )}
              {!formRender && (
                <iframe
                  src={pdfUrl}
                  className="w-full h-[60vh] border-0"
                  title={title}
                />
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <HStack>
                {renderFooter && renderFooter}
                <CustomButton variant="outline" onClick={() => onClose(false)}>
                  Close
                </CustomButton>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default PdfViewer;
