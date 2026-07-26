import { Box, Text } from "@chakra-ui/react";
import { CirclePlus, UtilityPole } from "lucide-react";
import { NavLink } from "react-router-dom";

const Utilities = ({ showSecondarySidebarShrink }) => {
  const url = "/smart-drive";

  return (
    <NavLink to={url} end>
      {({ isActive }) => (
        <Box
          cursor="pointer"
          role="button"
          className={
            showSecondarySidebarShrink
              ? `flex px-[15px] py-2 relative gap-3 items-center ${
                  isActive ? "bg-[#24406a]" : ""
                }`
              : `flex px-[15px] py-2 relative gap-3 items-center ${
                  isActive ? "bg-[#24406a]" : ""
                }`
          }
        >
          <UtilityPole color={isActive ? "#fff" : "#818181"} size={25} />
          {/* <CirclePlus color={isActive ? "#fff" : "#818181"} size={25} /> */}

          {!showSecondarySidebarShrink && (
            <Text
              letterSpacing="widest"
              className={`transition-colors duration-200 ${
                isActive ? "text-white" : "text-gray-400 "
              }`}
            >
              SmartDrive
            </Text>
          )}
        </Box>
      )}
    </NavLink>
  );
};

export default Utilities;
