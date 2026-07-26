import React, { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { toaster } from "@/components/ui/toaster";
import { useUserRoleManagement } from "@/hooks/mutation/admin/useCreateClientUser";
import {
  Box,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Portal,
  VStack,
} from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import { PasswordInput } from "@/components/ui/password-input";
import CustomSelect from "@/components/ui/select";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { color } from "highcharts";

const UserRegistration = forwardRef(({ onSuccess }, ref) => {
  const formRef = useRef(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    role: "client",
  });

  const { createUser, editUser, deleteUser } = useUserRoleManagement();

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openEditForm: (user) => {
      console.log("Opening edit form for:", user);
      setFormData({
        username: user.username || user.name || "",
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.mail || user.email || "",
        mobile: user.mobile || "",
        password: "", // Don't prefill password on edit
        role: Array.isArray(user.role) ? user.role[0] : user.role || "client",
      });
      setEditingUser(user);
      setFormErrors({});
      setShowUserForm(true);
    },
  }));
  
  const nameRegex = /^[A-Za-z]+$/;
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;
  
  const allowOnlyLetters = (value) => value.replace(/[^A-Za-z]/g, "");
  
  
  const resetForm = () => {
    setFormData({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
      role: "client",
    });
    setFormErrors({});
    setEditingUser(null);
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    resetForm();
  };

  const validateForm = () => {
  const errors = {};

  if (!formData.username?.trim())
    errors.username = "Username is required";

  if (!formData.firstName?.trim())
    errors.firstName = "First name is required";
  else if (!nameRegex.test(formData.firstName))
    errors.firstName = "First name should not contain special characters";

  if (!formData.lastName?.trim())
    errors.lastName = "Last name is required";
  else if (!nameRegex.test(formData.lastName))
    errors.lastName = "Last name should not contain special characters";

  if (!formData.email?.trim())
    errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
    errors.email = "Invalid email format";

  if (!formData.mobile?.trim())
    errors.mobile = "Mobile is required";

  if (!editingUser) {
    if (!formData.password?.trim())
      errors.password = "Password is required";
    else if (!strongPasswordRegex.test(formData.password))
      errors.password =
        "Password must be 8+ chars with uppercase, lowercase, number & special character";
  }

  if (!formData.role)
    errors.role = "Role is required";

  setFormErrors(errors);

  if (Object.keys(errors).length > 0) {
    toaster.error({
      title: "Validation Error",
      description: "Please correct the highlighted fields",
    });
  }

  return Object.keys(errors).length === 0;
};


  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) {
      toaster.error({ title: "Validation Error", description: "Please fix the errors" });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        username: formData.username.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        mail: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        roles: formData.role,
      };

      if (editingUser) {
        await editUser.mutateAsync({ id: editingUser.id, ...payload });
        toaster.success({ title: "Success", description: "User updated" });
      } else {
        await createUser.mutateAsync({ ...payload, password: formData.password });
        toaster.success({ title: "Success", description: "User created" });
      }

      closeUserForm();
      onSuccess?.(); // Refresh parent list
    } catch (error) {
      console.error("Save failed:", error);
      toaster.error({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    // Block special characters & numbers for names while typing
    if (name === "firstName" || name === "lastName") {
      updatedValue = allowOnlyLetters(value);
    }

    setFormData((prev) => ({ ...prev, [name]: updatedValue }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div>
      <CustomButton
        onClick={() => {
          resetForm();
          setShowUserForm(true);
        }}
        className="bg-blue-600 px-4 py-2 rounded text-white flex items-center gap-2"
      >
        Add User
      </CustomButton>

      <Dialog.Root
        open={showUserForm}
        onOpenChange={(details) => {
          if (!details.open) closeUserForm();
        }}
        // scrollBehavior={"inside"}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content 
              color="#fff"
              bgColor="droidalBlack.300"
              maxW="500px"
              p={5}
              borderRadius="md"
            >
              <Dialog.Header  mb={-7}>
                <Dialog.Title mt={-3}>
                  {editingUser ? "Edit User" : "Add New User"}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <form ref={formRef} onSubmit={handleSubmit}>
                  <VStack gap="2">
                    <CustomInput
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      errorMessage={formErrors.username}
                    />

                    <CustomInput
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      errorMessage={formErrors.firstName}
                    />

                    <CustomInput
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      errorMessage={formErrors.lastName}
                    />

                    <CustomInput
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      errorMessage={formErrors.email}
                    />

                    <CustomInput
                      label="Mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      errorMessage={formErrors.mobile}
                    />

                    {!editingUser && (
                      <Field.Root>
                        <Field.Label>Password</Field.Label>
                        <PasswordInput
                          style={{ backgroundColor: "transparent" }}
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter password"
                        />
                        {formErrors.password && (
                          <Field.ErrorText>{formErrors.password}</Field.ErrorText>
                        )}
                      </Field.Root>
                    )}

                    <Field.Root>
                      <Field.Label>Role</Field.Label>
                      <CustomSelect
                        value={[formData.role]}
                        onValueChange={(vals) =>
                          handleInputChange({ target: { name: "role", value: vals[0] } })
                        }
                        options={[
                          { value: "developer", label: "Developer" },
                          { value: "project_manager", label: "Project Manager" },
                          { value: "owner", label: "Owner" },
                          { value: "analyst", label: "Analyst" },
                          { value: "admin", label: "Admin" },
                          { value: "viewer", label: "Viewer" },
                          { value: "bot_operator", label: "Agent Operator" },
                        ]}
                      />
                      {formErrors.role && (
                        <Field.ErrorText>{formErrors.role}</Field.ErrorText>
                      )}
                    </Field.Root>
                  </VStack>
                </form>
              </Dialog.Body>

              <Dialog.Footer gap="3" mt={2}>
                <CustomButton variant="outline" onClick={closeUserForm}>
                  Cancel
                </CustomButton>
                <CustomButton
                  onClick={() => formRef.current?.requestSubmit()}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : editingUser ? "Update" : "Create"}
                </CustomButton>
              </Dialog.Footer>

              <Dialog.CloseTrigger asChild>
                <CloseButton color={"black"} backgroundColor={"white"} size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
});

export default UserRegistration;