import { Grid, Button, Heading, Flex } from "@chakra-ui/react";

export default function ProviderHeader({
  isPending,
  isSubmitting,
  onBack,
  onSubmit,
  editId,
}) {
  return (
    <Grid gap={4}>
      <Flex justify="space-between" align="center">
        {/* Heading */}
        {editId ? (
          <Heading
            textAlign="start"
            color="white"
            fontSize="20px"
            fontWeight="500"
          >
            Edit Provider
          </Heading>
        ) : (
          <Heading
            textAlign="start"
            color="white"
            fontSize="20px"
            fontWeight="500"
          >
            Provider Registration
          </Heading>
        )}

        {/* Top action bar */}
        <Flex>
          <Button
            onClick={onSubmit}
            isDisabled={isPending}
            fontSize="14px"
            borderRadius="lg"
            letterSpacing="1px"
            backgroundImage="var(--bg-blue-gradient2)"
            bg="rgba(85, 165, 220, 0.3)"
            color="white"
            opacity={isSubmitting ? 0.7 : 1}
            _hover={{ bg: "var(--bg-blue-gradient)" }}
          >
            {isPending ? "Registering..." : "Register Provider"}
          </Button>

          <Button
            className="ml-2"
            onClick={onBack}
            variant="outline"
            colorScheme="gray"
            borderRadius="lg"
            color="white"
            _hover={{ bg: "white", color: "black" }}
          >
            Back
          </Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
