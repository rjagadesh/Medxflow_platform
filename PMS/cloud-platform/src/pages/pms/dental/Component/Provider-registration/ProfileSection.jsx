import {
  Box,
  Flex,
  Grid,
  Text,
  Checkbox,
  Separator,
  Tag,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";

import ProfileUploader from "@/features/pms/dashboard/form/Component/profilepicture";
import ProviderSpecialty from "../../speciality";
import ServicesSelect from "../../service-select";

export default function ProfileSection({
  imageUrl,
  errors,
  resetSignal,
  providerType,
  setProviderType,
  specialty,
  setSpecialty,
  subSpecialty,
  setSubSpecialty,
  savedServices,
  setSavedServices,
  providesTelehealth,
  setProvidesTelehealth,
  handleProfilePicUpload,
  SERVICES,
  DAYS,
  selecteddays,
  setSelectedDays,
}) {
  const { control, reset, watch } = useForm({
    defaultValues: {
      profilePicture: null,
    },
  });

  const profileFile = watch("profilePicture");
  const parsedData =
    typeof selecteddays === "string" ? JSON.parse(selecteddays) : selecteddays;

  const enabledDays = Object.values(parsedData || {}).flatMap((locationDays) =>
    Object.entries(locationDays)
      .filter(([_, day]) => day.enabled)
      .map(([dayName]) => dayName),
  );

  useEffect(() => {
    reset({ profilePicture: null });
  }, [resetSignal, reset]);

  return (
    <Box gridColumn="1 / -1">
      <Text fontWeight="300" color="white" fontSize="18px">
        Provider Profile
      </Text>

      <Flex
        w="100%"
        direction={{ base: "column", lg: "row" }}
        gap={6}
        divideX={{ base: "0", lg: "1px" }}
        divideColor="whiteAlpha.300"
      >
        {/* PROFILE IMAGE */}
        <Box px={{ base: 0, lg: 4 }} textAlign="center">
          <Separator borderColor="gray.600" mb={3} />
          <Controller
            name="profilePicture"
            control={control}
            render={({ field }) => (
              <ProfileUploader
                imageUrl={imageUrl}
                value={field.value}
                onChange={field.onChange}
                upload={handleProfilePicUpload}
              />
            )}
          />
        </Box>
        {/* PROVIDER DETAILS */}
        <Grid
          pl={6}
          w="100%"
          templateColumns={{ base: "1fr", lg: "1fr 1fr auto" }}
          gap={1}
        >
          {/* ROW 1 */}

          <Box maxW="40vw" w="100%" textAlign={"center"}>
            <ProviderSpecialty
              setProviderType={setProviderType}
              providerType={providerType}
              specialty={specialty}
              setSpecialty={setSpecialty}
              subSpecialty={subSpecialty}
              setSubSpecialty={setSubSpecialty}
              errors={errors}
            />
          </Box>

          {/* TELEHEALTH (ROW 1, COL 3) */}
          <Flex align="center" ml={"20px"}>
            <Checkbox.Root
              checked={providesTelehealth === "True"}
              onCheckedChange={(e) =>
                setProvidesTelehealth(e.checked ? "True" : "False")
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label color="white" fontSize={"16px"}>
                Are You Providing Telehealth ?
              </Checkbox.Label>
            </Checkbox.Root>
          </Flex>

          <Box gridColumn="1 / -1">
            {/* LABEL */}
            <Text fontWeight="500" color="white" fontSize="13px">
              Services Offered{" "}
              <Text as="span" color="red">
                *
              </Text>
            </Text>

            {/* SELECT + TAGS INLINE */}
            <Flex align="center" gap={1} wrap="wrap">
              {/* SELECT */}
              <Box minW="180px">
                <ServicesSelect
                  title="Services"
                  services={SERVICES}
                  value={savedServices}
                  onChange={setSavedServices}
                />
                {errors.service && (
                  <Text fontSize="12px" color="#ef4444" textAlign={"center"}>
                    {errors.service}
                  </Text>
                )}
              </Box>

              {/* TAGS */}
              {savedServices?.map((service) => (
                <Tag.Root
                  key={service}
                  colorPalette="cyan"
                  variant="solid"
                  bg=" rgba(48, 161, 236, 0.49)"
                  borderRadius="md"
                  p={1}
                  pl={3}
                  ml="5px"
                >
                  <Tag.Label fontWeight="500" fontSize="13px" color="white">
                    {service}
                  </Tag.Label>

                  <Tag.EndElement>
                    <Tag.CloseTrigger
                      color={"black"}
                      onClick={() =>
                        setSavedServices(
                          savedServices.filter((v) => v !== service),
                        )
                      }
                    />
                  </Tag.EndElement>
                </Tag.Root>
              ))}
            </Flex>
          </Box>

          <Box gridColumn="1 / -1">
            {/* LABEL */}
            <Text fontWeight="300" color="white" fontSize="14px">
              Working Location{" "}
              <Text as="span" color="red">
                *
              </Text>
            </Text>

            {/* SELECT + TAGS INLINE */}
            <Flex align="center" gap={3} wrap="wrap">
              {/* SELECT */}
              <Box minW="180px">
                <ServicesSelect
                  title="Location"
                  services={DAYS}
                  value={selecteddays}
                  onChange={setSelectedDays}
                />
                {errors.location && (
                  <Text fontSize="12px" color="#ef4444" textAlign={"center"}>
                    {errors.location}
                  </Text>
                )}
              </Box>

              {/* TAGS */}
              {selecteddays.map((service) => (
                <Tag.Root
                  key={service}
                  colorPalette="cyan"
                  variant="solid"
                  bg="rgba(48, 161, 236, 0.49)"
                  borderRadius="md"
                  p={1}
                  pl={3}
                >
                  <Tag.Label fontSize="13px" color="white">
                    {service}
                  </Tag.Label>

                  <Tag.EndElement>
                    <Tag.CloseTrigger
                      color="black"
                      onClick={() =>
                        setSelectedDays((prev) =>
                          prev.filter((v) => v !== service),
                        )
                      }
                    />
                  </Tag.EndElement>
                </Tag.Root>
              ))}
            </Flex>
          </Box>
        </Grid>
      </Flex>
    </Box>
  );
}
