import React from 'react';
import { Box, Text, Image, Button, Grid, VStack, HStack, Accordion } from '@chakra-ui/react';
import { MapPin } from 'lucide-react';

const ProviderListing = () => {
  const providers = [
    {
      id: 1,
      name: "Mrs. LINDSAY ALVARADO",
      practice: "KSPEDIATRICS LLC",
      address: "6446 E Central Avenue, Suite 183",
      city: "Wichita, KS 67206",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80" // Female profile
    },
    {
      id: 2,
      name: "Dr. MOHAMMED ANSARI",
      practice: "KSPEDIATRICS LLC",
      address: "6446 E Central Avenue, Suite 183",
      city: "Wichita, KS 67206",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=64&h=64&q=80" // Male profile
    },
    {
      id: 3,
      name: "Dr. SONIA BARBOSA",
      practice: "KSP Health - International",
      address: "6446 E Central Ave, STE 183",
      city: "Wichita, KS 67206",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=64&h=64&q=80" // Female profile
    },
    {
      id: 4,
      name: "Dr. JILL BEAVERS-KIRBY",
      practice: "KSP Health - International",
      address: "6446 E Central Ave, STE 183",
      city: "Wichita, KS 67206",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=64&h=64&q=80" // Female profile
    },
    {
      id: 5,
      name: "VALERIE BELLARIO",
      practice: "KSPEDIATRICS LLC",
      address: "6446 E Central Avenue, Suite 183",
      city: "Wichita, KS 67206",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=facearea&facepad=2&w=64&h=64&q=80" // Female profile
    }
  ];

  const defaultImage = "https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Default";

  return (
    <Box minH="100vh" bg="droidalBlack.500">
      <Box maxW="full" mx="auto" px={8} py={8}>
        {/* Header section */}
        <Box mb={8}>
          <Text color="#9ca3af" fontSize="base" lineHeight="relaxed">
            <Text as="span" fontWeight="medium" color="white">
              Two out of every three patients search for a provider online before booking an appointment.
            </Text>{' '}
            We continuously monitor over 90 popular internet directories for errors so that the providers in your practice know how they appear online to patients.
          </Text>
        </Box>

        {/* Provider cards */}
        <Accordion.Root collapsible>
          {providers.map((provider, index) => (
            <Accordion.Item 
              key={provider.id} 
              value={`provider-${index}`}
              mb={4}
              bg="droidalBlack.300"
              border="1px"
              borderColor="#2f4d78"
              borderRadius="lg"
              shadow="sm"
              _hover={{ shadow: "md" }}
              transition="box-shadow 0.2s"
            >
              <Accordion.ItemTrigger p={6}>
                <HStack flex="1" align="start" spaceX={6}>
                  {/* Avatar */}
                  <Image
                    src={provider.image || defaultImage}
                    alt={provider.name}
                    boxSize="64px"
                    borderRadius="full"
                    bg="#2f4d78"
                    flexShrink={0}
                    fallbackSrc={defaultImage}
                  />

                  {/* Provider info */}
                  <VStack align="start" flex="1" spaceY={-1}>
                    <Text fontSize="md" fontWeight="light" color="white">
                      {provider.name}
                    </Text>
                    <Text fontSize="sm" color="#9ca3af">
                      {provider.practice}
                    </Text>
                    <Text fontSize="sm" color="#9ca3af">
                      {provider.address}
                    </Text>
                    <Text fontSize="sm" color="#9ca3af" mb={2}>
                      {provider.city}
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      color="#94F219"
                      _hover={{ color: "#5A9310" }}
                      leftIcon={<MapPin size={16} color="#94F219" />}
                      px={0}
                      fontWeight="medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Change Location
                    </Button>
                  </VStack>
                </HStack>
                <Accordion.ItemIndicator color="#9ca3af" />
              </Accordion.ItemTrigger>

              <Accordion.ItemContent>
                <Box px={6} pb={6} pt={4} borderTop="1px" borderColor="#2f4d78">
                  <Grid templateColumns="repeat(2, 1fr)" gap={4} fontSize="sm">
                    <Box>
                      <Text color="#9ca3af" mb={1}>Phone</Text>
                      <Text color="white">(316) 555-0123</Text>
                    </Box>
                    <Box>
                      <Text color="#9ca3af" mb={1}>Specialty</Text>
                      <Text color="white">Pediatrics</Text>
                    </Box>
                    <Box>
                      <Text color="#9ca3af" mb={1}>Website</Text>
                      <Text color="#94F219">www.kspediatrics.com</Text>
                    </Box>
                    <Box>
                      <Text color="#9ca3af" mb={1}>Accepting New Patients</Text>
                      <Text color="white">Yes</Text>
                    </Box>
                  </Grid>
                </Box>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Box>
    </Box>
  );
};

export default ProviderListing;