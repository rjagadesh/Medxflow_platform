import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import FormField from "../../form-fields";
import PasswordField from "../../password-field";

export default function BasicInfoFields({
  formData,
  errors,
  handleInputChange,
  providerData,
}) {
  return (
    <Box w="100%">
      {/* HEADER */}

      <Box
        w="100%"
        borderColor="#465063ff" // dark panel
        // border="1px solid #f2efefff"
        borderRadius="12px"
        pr="0"
        mt="5px"
      >
        {" "}
        <Text
          fontSize="18px"
          fontWeight="400"
          mb="1px"
          color="white"
          pl={"10px"}
        >
          Basic Info
        </Text>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3, xl: "3", "2xl": "3", "3xl": "4" }} // 🔥 4 IN A ROW
          spacingX="40px"
          spacingY="22px"
          w="100%"
          pl="15px"
          pb="15px"
          pt="15px"
          pr="25px"
        >
          <FormField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            error={errors.firstName}
            required={true}
          />
          <FormField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            error={errors.lastName}
            required={true}
          />
          <FormField
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            error={errors.dateOfBirth}
            required={true}
          />
          <FormField
            label="NPI"
            name="npi"
            value={formData.npi}
            onChange={handleInputChange}
            error={errors.npi}
            required={true}
          />

          <FormField
            label="Taxonomy Code"
            name="taxonomy"
            value={formData.taxonomy}
            onChange={handleInputChange}
            error={errors.taxonomy}
            required={true}
          />
          <FormField
            label="Practice Name"
            name="practiceName"
            value={formData.practiceName}
            onChange={handleInputChange}
            error={errors.practiceName}
            required={true}
          />
          <FormField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            error={errors.address}
            required={true}
          />
          <FormField
            label="City"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            error={errors.city}
            required={true}
          />

          <FormField
            label="State"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            error={errors.state}
            required={true}
          />
          <FormField
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            error={errors.country}
            required={true}
          />
          <FormField
            label="Zip Code"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            error={errors.zipCode}
            required={true}
          />
          <FormField
            label="Medicare PTAN"
            name="medicare_ptan"
            value={formData.medicare_ptan}
            onChange={handleInputChange}
            error={errors.medicare_ptan}
          />
          <FormField
            label="Medicaid Id"
            name="medicaid_id"
            value={formData.medicaid_id}
            onChange={handleInputChange}
            error={errors.medicaid_id}
          />
          <FormField
            label="Medical License No"
            name="medical_license_number"
            value={formData.medical_license_number}
            onChange={handleInputChange}
            error={errors.medical_license_number}
            required={true}
          />

          <FormField
            label="Organization Name"
            name="organization_name"
            value={formData.organization_name}
            onChange={handleInputChange}
            error={errors.organization_name}
            required={true}
          />
          <FormField
            label="Tax ID / EIN"
            name="taxid_ein"
            value={formData.taxid_ein}
            onChange={handleInputChange}
            error={errors.taxid_ein}
            required={true}
          />
          <FormField
            label="Social Security No"
            name="taxid_ssn"
            value={formData.taxid_ssn}
            onChange={handleInputChange}
            error={errors.taxid_ssn}
            required={true}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required={providerData?.id ? false : true}
          />

          {/* <FormField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            required={providerData ? false : true}
          />
          <FormField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            required={providerData ? false : true}
          /> */}
        </SimpleGrid>
      </Box>
    </Box>
  );
}
