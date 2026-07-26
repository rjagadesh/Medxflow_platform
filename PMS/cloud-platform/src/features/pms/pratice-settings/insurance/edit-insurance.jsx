import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Box, Flex, Text, HStack } from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import GeneralTab from "./tabs/GeneralTab";
import PaperClaimsTab from "./tabs/PaperClaimsTab";
import ElectronicClaimsTab from "./tabs/ElectronicClaimsTab";
import PracticeSettingsTab from "./tabs/PracticeSettingsTab";

const EditInsurance = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("General");

  const { register, handleSubmit, control, watch, setValue } = useForm({
    defaultValues: {
      name: "Cigna",
      address: {
        street1: "900 Cottage Grove Road",
        street2: "",
        city: "Bloomfield",
        state: "CT",
        zip: "06002",
        country: "",
      },
      contactName: {
        prefix: "",
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
      },
      contactPhone: "",
      contactPhoneExt: "",
      contactFax: "",
      contactFaxExt: "",
      insuranceProgram: ["CI"],
      defaultAdjustment: [],
      autoBillSecondary: false,
      scope: ["practice"],
      notes: "",
      paperClaims: {
        insuredFormat: ["default"],
        cms1500Field24g: ["units"],
        cms1500Field32b: true,
        primaryBillingForm: ["cms1500_0212"],
        secondaryBillingForm: ["cms1500_0212"],
        institutionalPrimaryBillingForm: ["ub04"],
      },
      electronicClaims: {
        acceptsElectronicClaims: true,
        clearinghouse: ["gateway_edi"],
        electronicPayerConnection: "Aetna (4433)",
        clearinghousePayerID: "60054",
        requiresAuth: true,
        supportsEligibility: true,
      },
      practiceSettings: {
        enrollmentStatus: ["enrolled_live"],
        disableElectronicClaims: false,
        useElectronicBillingSecondary: true,
        sendCOB: true,
        acceptsAssignment: true,
        excludePatientPayments: true,
        allowZeroBalanceTransfers: true,
        icd10Date: new Date("2015-10-01"),
      },
    },
  });

  const onSubmit = (data) => {
    console.log("Submitted Data:", data);
    onClose();
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ height: "100%", width: "100%" }}
      >
        <Box
          bg="droidalBlack.300"
          color="white"
          borderRadius="xl"
          w="full"
          height={"calc(100vh - 100px)"}
          boxShadow="xl"
          overflow="hidden"
          display={"flex"}
          flexDirection={"column"}
        >
          {/* Header */}
          <Flex justify="space-between" align="center" p={2} px={4}>
            <Text letterSpacing={"wider"} fontWeight={"light"} fontSize="lg">
              Edit Insurance Company - {watch("name")} (44)
            </Text>
          </Flex>

          {/* Tabs */}
          <Flex borderBottom="1px solid" borderColor="whiteAlpha.200" px={4}>
            {[
              "General",
              "Paper Claims",
              "Electronic Claims",
              "Practice Settings",
            ].map((tab) => (
              <Box
                key={tab}
                px={4}
                py={2}
                cursor="pointer"
                color={activeTab === tab ? "primary.400" : "gray.500"}
                fontWeight={activeTab === tab ? "medium" : "normal"}
                onClick={() => setActiveTab(tab)}
                bg={activeTab === tab ? "droidalBlack.400" : "transparent"}
                mb="-1px"
                borderBottom={"1px solid"}
                borderColor={"droidalGray.300"}
                borderTopRadius="md"
                letterSpacing={"widest"}
              >
                {tab}
              </Box>
            ))}
          </Flex>

          {/* Content Area */}
          <Box flex={"1"} p={4} height={"full"}>
            <Box
              border="1px solid"
              height={"full"}
              borderColor="droidalGray.300"
              p={4}
              overflowY={"auto"}
            >
              {activeTab === "General" && (
                <GeneralTab
                  register={register}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {activeTab === "Paper Claims" && (
                <PaperClaimsTab control={control} />
              )}

              {activeTab === "Electronic Claims" && (
                <ElectronicClaimsTab
                  control={control}
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {activeTab === "Practice Settings" && (
                <PracticeSettingsTab control={control} />
              )}
            </Box>

            {/* Footer Buttons */}
          </Box>
          <HStack p={4} gap={4}>
            <CustomButton variant="outline" type="submit">
              Save
            </CustomButton>
            <CustomButton variant="outline" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="danger">Delete</CustomButton>
          </HStack>
        </Box>
      </form>
    </>
  );
};

export default EditInsurance;
