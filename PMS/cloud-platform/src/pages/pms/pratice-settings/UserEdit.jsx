import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Heading,
  Input,
  Button,
  Text,
  Flex,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import { toaster } from "@/components/ui/toaster";

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  /* ---------------- FETCH USER ---------------- */
  const fetchUser = async () => {
    try {
      const res = await apiRequest({
        ...apiRoutes.userrolemanagement.getuser,
        url: apiRoutes.userrolemanagement.getuser.url(id),
      });

      // 🔥 IMPORTANT: res is already response.data
      reset({
        username: res.username,
        mail: res.mail,
        first_name: res.first_name,
        last_name: res.last_name,
        mobile: res.mobile,
        address: res.address,
      });
    } catch (error) {
      console.error("FETCH USER ERROR 👉", error);
      toaster.error({ title: "Failed to load user details" });
    }
  };

  /* ---------------- UPDATE USER ---------------- */
  const onSubmit = async (data) => {
    const payload = {
      username: data.username,
      mail: data.mail,
      first_name: data.first_name,
      last_name: data.last_name,
      mobile: data.mobile,
      address: data.address,
    };

    if (data.password) {
      payload.password = data.password;
    }

    try {
      await apiRequest({
        ...apiRoutes.userrolemanagement.edituser,
        url: apiRoutes.userrolemanagement.edituser.url(id),
        data: payload,
      });

      toaster.success({ title: "User updated successfully" });
      navigate("/pms/user-settings");
    } catch (error) {
      console.error("UPDATE ERROR 👉", error);
      toaster.error({ title: "Update failed" });
    }
  };

  return (
    <Box p={8} bg="#0d2b52" borderRadius="lg">
      <Heading color="white" mb={6}>
        Edit User
      </Heading>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <InputField
            label="Username"
            error={errors.username}
            {...register("username", { required: "Username required" })}
          />

          <InputField
            label="Email"
            error={errors.mail}
            {...register("mail", { required: "Email required" })}
          />

          <InputField
            label="First Name"
            error={errors.first_name}
            {...register("first_name", { required: "First name required" })}
          />

          <InputField
            label="Last Name"
            error={errors.last_name}
            {...register("last_name", { required: "Last name required" })}
          />

          <InputField
            label="Mobile"
            error={errors.mobile}
            {...register("mobile", { required: "Mobile required" })}
          />

          <InputField
            label="New Password (optional)"
            type="password"
            {...register("password")}
          />

          <InputField
            label="Confirm Password"
            type="password"
            error={errors.confirm_password}
            {...register("confirm_password", {
              validate: (v) =>
                !password || v === password || "Passwords do not match",
            })}
          />

          <InputField
            label="Address"
            {...register("address")}
          />
        </Grid>

        <Flex justify="center" mt={8} gap={4}>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" bg="blue.600" color="white">
            Update User
          </Button>
        </Flex>
      </form>
    </Box>
  );
};

/* ---------------- INPUT ---------------- */

const InputField = ({ label, error, ...props }) => (
  <Box>
    <Text color="white" mb={2}>{label}</Text>
    <Input
      {...props}
      bg="white"
      color="black"
      borderColor={error ? "#ef4444" : "#CBD5E0"}
    />
    {error && (
      <Text color="#ef4444" fontSize="12px">
        {error.message}
      </Text>
    )}
  </Box>
);

export default UserEdit;
