import { Box, Flex } from "@chakra-ui/react";
import { Badge, Text, VStack } from "@chakra-ui/react";

const PlatformSidebarItem = ({
  label,
  isActive,
  hasBadge,
  badge,
  onItemClick,
}) => (
  <Flex
    align="center"
    py={2}
    px={4}
    bg={isActive ? "droidalGray.500" : "transparent"}
    color={isActive ? "white" : "droidalGray.400"}
    _hover={{ bg: "droidalGray.500", cursor: "pointer", color: "white" }}
    cursor="pointer"
    letterSpacing={"wider"}
    justify="space-between"
    onClick={onItemClick}
  >
    <Text fontSize="sm">{label}</Text>
    {badge ? (
      badge
    ) : hasBadge ? (
      <Badge
        colorPalette="green"
        variant="solid"
        size="sm"
        px={2}
        borderRadius="md"
      >
        New
      </Badge>
    ) : null}
  </Flex>
);

const Sidebar = ({ children }) => {
  return (
    <Box
      w="210px"
      borderRight="1px solid"
      borderColor="droidalGray.300"
      bgColor={"droidalGray.600"}
      py={4}
      overflowY={"auto"}
      overflowX={"hidden"}
      display={{ base: "none", md: "block" }}
    >
      <VStack align="stretch" gap={0}>
        {children}
      </VStack>
    </Box>
  );
};

const PlatformSettingsSidebar = {
  Root: Sidebar,
  Item: PlatformSidebarItem,
};

export default PlatformSettingsSidebar;
