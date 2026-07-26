import React, { useState } from "react";
import { Box } from "@chakra-ui/react";
import FreeTextNote from "./free-form-text";
import VitalsDialog from "@/pages/pms/patient-view/vitals-dialog";
import CustomButton from "@/components/button/button";

const VitalsNotes = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box w="full">
      <FreeTextNote
        title={"Vitals"}
        extraActions={
          <CustomButton
            variant="outline"
            size="xs"
            onClick={() => setIsOpen(true)}
          >
            Vitals
          </CustomButton>
        }
      />
      <VitalsDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </Box>
  );
};

export default VitalsNotes;
