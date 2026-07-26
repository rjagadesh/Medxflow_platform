import { Box, Button } from "@chakra-ui/react";
import FreeTextNote from "./free-form-text";
import ProblemsModal from "./problems-modal";
import { useState } from "react";

const AssessmentsNotes = () => {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <FreeTextNote
        title={"Assessment"}
        extraActions={
          <>
            <Button
              size="xs"
              variant="outline"
              color="white"
              borderColor="droidalGray.300"
              fontWeight="normal"
              _hover={{ bg: "whiteAlpha.100" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(true);
              }}
            >
              Problems
            </Button>
          </>
        }
      />
      <ProblemsModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </Box>
  );
};

export default AssessmentsNotes;
