import { Box, Flex, HStack, Text, Button, IconButton } from "@chakra-ui/react";
import { X } from "lucide-react";
import { FileText } from "lucide-react";
const NoteSection = ({
  title,
  children,
  isActive,
  onShortcutClick,
  onTitleClick,
  options = {
    textShortcut: false,
    template: false,
  },
  extraActions,
  templateTrigger,
}) => (
  <Box mb={4}>
    <Flex justify="space-between" align="center" mb={2}>
      <Text
        fontSize="md"
        color={isActive ? "primary.400" : "primary.200"}
        onClick={onTitleClick}
        cursor={onTitleClick ? "pointer" : "default"}
      >
        {title}
      </Text>
      {isActive && (
        <HStack gap={1}>
          {options.textShortcut && (
            <Button
              size="xs"
              variant="outline"
              color="white"
              borderColor="droidalGray.300"
              fontWeight="normal"
              _hover={{ bg: "whiteAlpha.100" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onShortcutClick}
            >
              Text Shortcut
            </Button>
          )}
          {templateTrigger
            ? templateTrigger
            : options.template && (
                <Button
                  size="sm"
                  variant="outline"
                  color="white"
                  borderColor="droidalGray.300"
                  fontWeight="normal"
                  onClick={() => {}}
                  _hover={{ bg: "whiteAlpha.100" }}
                  _active={{ bg: "droidalGray.300" }}
                  _expanded={{
                    bg: "droidalGray.300",
                  }}
                >
                  Template
                </Button>
              )}
          {extraActions && extraActions}
          <IconButton
            size="xs"
            icon={<X size={12} />}
            variant="ghost"
            color="white"
            aria-label="Close"
          />
        </HStack>
      )}
    </Flex>
    {children}
  </Box>
);

export default NoteSection;
