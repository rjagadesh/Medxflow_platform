// EncounterModal.jsx - FINAL FIXED VERSION (Provider ID Issue Resolved)

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Tabs, HStack, Spinner, Center, VStack, Text } from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import PatientSearch from "@/pages/pms/dental/platform-sub-components/patient-search";
import ProviderSearch from "../dental/platform-sub-components/provider-search";
import EncounterGeneral from "./encounter-general";
import EncounterLog from "./encounter-log";
import EncounterDocuments from "./encounter-documents";
import AppointmentSearch from "@/features/pms/encounter/encounter-appointment";
import PriorAuthSearch from "@/features/pms/encounter/encounter-prior-auth";
import {
  useCreateEncounter,
  useUpdateEncounter,
} from "@/hooks/mutation/pms/encounter/useCreateEncounter";
import { useGetEncounterById } from "@/hooks/query/pms/encounter/useGetEncounters";
import { useClaimSubmission } from "@/hooks/query/pms/claim_submission/submitClaim";
import { toaster } from "@/components/ui/toaster";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog-refactored";

const EncounterModal = ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState("general");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [searchMode, setSearchMode] = useState(null);
  const [providerSearchType, setProviderSearchType] = useState(null);

  const [serviceLines, setServiceLines] = useState(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPriorAuth, setSelectedPriorAuth] = useState(null);
  // selectedProvider is used for search context? No, providers state is used.
  // Actually, setSelectedProvider was passed to EncounterGeneral but seemingly unused in favor of providers state?
  // Let's check EncounterGeneral props. It takes setSelectedProvider and selectedProvider.
  // But handleFindProvider uses setProviderSearchType.
  // We'll keep it simple and preserve existing if needed, but it seems selectedProvider local state in Modal was unused in logic.
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const encounterGeneralRef = useRef();

  // We keep providers in state because it handles the search selection logic
  const [providers, setProviders] = useState({
    rendering: null,
    supervising: null,
    referring: null,
    scheduling: null,
  });

  const createEncounter = useCreateEncounter();
  const updateEncounter = useUpdateEncounter();
  const submitClaimMutation = useClaimSubmission();

  const { data: encounterData, isLoading: isLoadingEncounter } =
    useGetEncounterById(id);

  console.log("Fetched encounter data:", encounterData);

  const isEditMode = mode === "edit" && id;

  const isSaving = createEncounter.isPending || updateEncounter.isPending;

  // Safe provider ID extractor
  const getProviderId = (provider) => {
    if (!provider) return null;
    if (typeof provider === "object") return provider.id ?? null;
    return provider;
  };

  useEffect(() => {
    if (isEditMode && encounterData) {
      // Patient
      if (encounterData.patient) {
        setSelectedPatient({
          id: encounterData.patient.id,
          first_name: encounterData.patient.first_name,
          last_name: encounterData.patient.last_name,
          name: `${encounterData.patient.first_name || ""} ${
            encounterData.patient.last_name || ""
          }`.trim(),
        });
      }

      // Appointment
      if (encounterData.appointment) {
        const appt = encounterData.appointment;
        setSelectedAppointment({
          ...appt,
          patient_name: appt.patient
            ? `${appt.patient.first_name || ""} ${
                appt.patient.last_name || ""
              }`.trim()
            : "",
          provider_name: appt.provider
            ? `${appt.provider.first_name || ""} ${
                appt.provider.last_name || ""
              }`.trim()
            : "",
        });
      }

      // Providers - format for display only
      const formatProvider = (p) => {
        if (!p) return null;
        return {
          id: p.id,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim(),
        };
      };

      setProviders({
        rendering: formatProvider(encounterData.rendering_provider),
        supervising: formatProvider(encounterData.supervising_provider),
        referring: formatProvider(encounterData.referring_provider),
        scheduling: formatProvider(encounterData.rendering_provider),
      });

      // Note: Other fields are now passed directly to EncounterGeneral via props derived from encounterData during render
    }
  }, [isEditMode, encounterData]);

  // Derived initial values for EncounterGeneral
  const initialValues = useMemo(() => {
    if (!isEditMode || !encounterData) return {};
    return {
      placeOfService: encounterData.place_of_service_code || "11",
      encounterFromDate: encounterData.encounter_from_date
        ? new Date(encounterData.encounter_from_date)
        : null,
      encounterThroughDate: encounterData.encounter_through_date
        ? new Date(encounterData.encounter_through_date)
        : null,
      postDate: encounterData.post_date
        ? new Date(encounterData.post_date)
        : null,
      batchNumber: encounterData.batch_number || "",
      doNotSendElectronically:
        encounterData.do_not_send_electronically || false,
      paymentAmount: encounterData.payment_amount || "",
      ambulanceDetail: encounterData.ambulance_detail || null,
      hospitalizedFrom: encounterData.hospitalized_from
        ? new Date(encounterData.hospitalized_from)
        : null,
      hospitalizedTo: encounterData.hospitalized_to
        ? new Date(encounterData.hospitalized_to)
        : null,
      submitReason: encounterData.submit_reason || "",
      payerDocControl: encounterData.payer_doc_control || "",
      claimCode10d: encounterData.claim_code_10d || "",
      additionalClaimInfo: encounterData.additional_claim_info || "",
      eclaimNoteType: encounterData.eclaim_note_type || "",
      eclaimNote: encounterData.eclaim_note || "",
    };
  }, [isEditMode, encounterData]);

  const initialServiceLines = useMemo(() => {
    if (
      !isEditMode ||
      !encounterData ||
      !encounterData.service_lines ||
      encounterData.service_lines.length === 0
    ) {
      return [
        {
          from: null,
          to: null,
          procedure: "",
          mod1: "",
          mod2: "",
          mod3: "",
          mod4: "",
          units: 1,
          unitCharge: 0,
          totalCharge: 0,
          diag1: "",
          diag2: "",
          diag3: "",
          diag4: "",
          applyPayment: 0,
          ndc: "",
          minutes: 0,
          lineNote: "",
        },
      ];
    }

    return encounterData.service_lines.map((line) => {
      let mod1 = "",
        mod2 = "",
        mod3 = "",
        mod4 = "";
      if (line.modifiers) {
        try {
          const mods =
            typeof line.modifiers === "string"
              ? JSON.parse(line.modifiers)
              : line.modifiers;
          mod1 = mods.mod_1 || "";
          mod2 = mods.mod_2 || "";
          mod3 = mods.mod_3 || "";
          mod4 = mods.mod_4 || "";
        } catch (e) {
          console.warn("Failed to parse modifiers:", e);
          if (Array.isArray(line.modifiers)) {
            [mod1, mod2, mod3, mod4] = line.modifiers;
          }
        }
      }

      let diag1 = "",
        diag2 = "",
        diag3 = "",
        diag4 = "";
      if (line.diag_pointers) {
        try {
          const diags =
            typeof line.diag_pointers === "string"
              ? JSON.parse(line.diag_pointers)
              : line.diag_pointers;
          diag1 = diags.diag_1 || "";
          diag2 = diags.diag_2 || "";
          diag3 = diags.diag_3 || "";
          diag4 = diags.diag_4 || "";
        } catch (e) {
          console.warn("Failed to parse diag_pointers:", e);
          if (Array.isArray(line.diag_pointers)) {
            [diag1, diag2, diag3, diag4] = line.diag_pointers;
          }
        }
      }

      return {
        from: line.date_from ? new Date(line.date_from) : null,
        to: line.date_to ? new Date(line.date_to) : null,
        procedure: line.procedure_code
          ? `${line.procedure_code} - ${line.description || ""}`.trim()
          : "",
        mod1,
        mod2,
        mod3,
        mod4,
        units: line.units || 1,
        unitCharge: line.unit_charge || 0,
        totalCharge: line.total_charges
          ? parseFloat(line.total_charges).toFixed(2)
          : ((line.units || 1) * (line.unit_charge || 0)).toFixed(2),
        diag1,
        diag2,
        diag3,
        diag4,
        applyPayment: 0,
        ndc: line.ndc_code || "",
        minutes: line.minutes || 0,
        lineNote: line.line_note || "",
        isVoided: line.is_voided || false,
      };
    });
  }, [isEditMode, encounterData]);

  // Search handlers
  const openPatientSearch = () => {
    if (tabValue === "general" && encounterGeneralRef.current) {
      setServiceLines(encounterGeneralRef.current.getData().serviceLines);
    }
    setSearchMode("patient");
  };

  const openProviderSearch = (type) => {
    // Persist procedure data before switching to provider search
    if (tabValue === "general" && encounterGeneralRef.current) {
      setServiceLines(encounterGeneralRef.current.getData().serviceLines);
    }
    setProviderSearchType(type);
    setSearchMode("provider");
  };

  const openAppointmentSearch = () => {
    if (tabValue === "general" && encounterGeneralRef.current) {
      setServiceLines(encounterGeneralRef.current.getData().serviceLines);
    }
    setSearchMode("appointment");
  };

  const openPriorAuthSearch = () => {
    if (tabValue === "general" && encounterGeneralRef.current) {
      setServiceLines(encounterGeneralRef.current.getData().serviceLines);
    }
    setSearchMode("priorAuth");
  };

  const closeSearch = () => {
    setSearchMode(null);
    setProviderSearchType(null);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    closeSearch();
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);

    // Auto-fill patient if not selected
    if (!selectedPatient && appointment.patient_name) {
      const fullName = appointment.patient_name.trim();
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setSelectedPatient({
        id: appointment.patient || appointment.patient_id,
        first_name: firstName,
        last_name: lastName,
        name: fullName,
      });
    }

    // Auto-fill providers
    if (appointment.provider_name) {
      const pId = appointment.provider || appointment.provider_id || 0;
      const pName = appointment.provider_name;
      setProviders((prev) => ({
        ...prev,
        scheduling: { id: pId, name: pName },
        rendering: { id: pId, name: pName },
      }));
    }

    // Auto-fill date - Handled by EncounterGeneral now via useEffect on selectedAppointment

    closeSearch();
  };

  const handlePriorAuthSelect = (priorAuth) => {
    setSelectedPriorAuth(priorAuth);
    closeSearch();
  };

  const handleProviderSelect = (provider) => {
    if (providerSearchType) {
      setProviders((prev) => ({
        ...prev,
        [providerSearchType]: {
          id: provider.id,
          name: `${provider.first_name || ""} ${
            provider.last_name || ""
          }`.trim(),
        },
      }));
    }
    closeSearch();
  };

  const toYYYYMMDD = (dateInput) => {
    if (!dateInput) return null;
    let date;
    if (typeof dateInput === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return null;
    }
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  };

  const handleSubmitClaim = () => {
    if (encounterData?.status !== "accepted") {
      console.log("Encounter not approved, cannot submit claim." + encounterData?.status);
      toaster.create({
        title: "Submission Error",
        description: "This Encounter isnt Approved",
        type: "error",
      });
      return;
    }
    submitClaimMutation.mutate([id], {
      onSuccess: (res) => {
        const responseData = res;

        const text =
          typeof responseData === "string"
            ? responseData
            : JSON.stringify(responseData, null, 2);

        const blob = new Blob([text], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "response.txt";
        a.click();

        URL.revokeObjectURL(url);
      },
    });
  };

  const handleSaveEncounter = async (status) => {
    // Retrieve data from EncounterGeneral
    const generalData = encounterGeneralRef.current?.getData() || {};
    const {
      serviceLines,
      encounterFromDate,
      placeOfService,
      encounterThroughDate,
      postDate,
      batchNumber,
      doNotSendElectronically,
      ambulanceDetail,
      hospitalizedFrom,
      hospitalizedTo,
      submitReason,
      payerDocControl,
      claimCode10d,
      additionalClaimInfo,
      eclaimNoteType,
      eclaimNote,
      totalCharges,
    } = generalData;

    // Validation
    if (["ready", "accepted", "submitted"].includes(status)) {
      if (status === "accepted" && selectedAppointment?.confirmationstatus !== "checked_out") {
        toaster.error({
          title: "Check-out Required",
          description: "This appointment is still not checked out.",
        });
        return;
      }

      const errors = [];
      if (!selectedPatient) errors.push("Patient");
      if (!providers.rendering) errors.push("Rendering Provider");

      const hasValidLine = (serviceLines || []).some((line) => {
        const hasProcedure = !!line.procedure;
        const effectiveFrom =
          line.from || encounterFromDate || selectedAppointment?.date;
        const effectiveTo =
          line.to || encounterFromDate || selectedAppointment?.date;
        return hasProcedure && effectiveFrom && effectiveTo;
      });

      if (!hasValidLine) {
        errors.push(
          "At least one Service Line with Procedure, From Date, and To Date"
        );
      }

      if (errors.length > 0) {
        toaster.error({
          title: "Validation Error",
          description: `Please provide: ${errors.join(", ")}`,
        });
        return;
      }
    } else {
      if (!selectedPatient) {
        toaster.warning({
          title: "Patient Required",
          description: "Please select a patient before saving.",
        });
        return;
      }
    }

    setLoadingStatus(status);

    const apiServiceLines = (serviceLines || [])
      .filter((line) => line.procedure)
      .map((line) => ({
        date_from: toYYYYMMDD(
          line.from || encounterFromDate || selectedAppointment?.date
        ),
        date_to: toYYYYMMDD(
          line.to || encounterFromDate || selectedAppointment?.date
        ),
        procedure_code: line.procedure
          ? line.procedure.split(" - ")[0].trim()
          : "",
        description: line.procedure
          ? line.procedure.split(" - ").slice(1).join(" - ").trim()
          : "",
        modifiers: JSON.stringify({
          mod_1: line.mod1 || "",
          mod_2: line.mod2 || "",
          mod_3: line.mod3 || "",
          mod_4: line.mod4 || "",
        }),
        units: parseInt(line.units) || 1,
        unit_charge: line.unitCharge?.toString() || "0.00",
        total_charge: line.totalCharge?.toString() || "0.00",
        diag_pointers: JSON.stringify({
          diag_1: line.diag1 || "",
          diag_2: line.diag2 || "",
          diag_3: line.diag3 || "",
          diag_4: line.diag4 || "",
        }),
        ndc_code: line.ndc || "",
        minutes: parseInt(line.minutes) || 0,
        line_note: line.lineNote || "",
        is_voided: line.isVoided || false,
      }));

    // DEBUG: Log the providers state and extracted IDs
    console.log("Providers state:", providers);

    const renderingProviderId = getProviderId(providers.rendering);
    const supervisingProviderId = getProviderId(providers.supervising);
    const referringProviderId = getProviderId(providers.referring);
    // Use rendering provider as fallback for scheduling provider
    const schedulingProviderId =
      getProviderId(providers.scheduling) || renderingProviderId;

    console.log("Extracted provider IDs:", {
      rendering: renderingProviderId,
      supervising: supervisingProviderId,
      referring: referringProviderId,
      scheduling: schedulingProviderId,
    });

    const payload = {
      patient: selectedPatient.id,
      appointment: selectedAppointment?.id || null,
      rendering_provider: renderingProviderId,
      supervising_provider: supervisingProviderId,
      referring_provider: referringProviderId,
      scheduling_provider: schedulingProviderId,
      location: selectedAppointment?.location || "",
      payment_amount: generalData.paymentAmount?.toString(),
      place_of_service_code: placeOfService,
      encounter_from_date: toYYYYMMDD(
        encounterFromDate || selectedAppointment?.date
      ),
      encounter_through_date: toYYYYMMDD(
        encounterThroughDate || encounterFromDate || selectedAppointment?.date
      ),
      post_date: toYYYYMMDD(postDate),
      batch_number: batchNumber || "",
      status: status,
      service_lines: apiServiceLines,
      ambulance_detail: ambulanceDetail,
      hospitalized_from: toYYYYMMDD(hospitalizedFrom),
      hospitalized_to: toYYYYMMDD(hospitalizedTo),
      submit_reason: submitReason,
      payer_doc_control: payerDocControl,
      claim_code_10d: claimCode10d,
      additional_claim_info: additionalClaimInfo,
      eclaim_note_type: eclaimNoteType,
      eclaim_note: eclaimNote,
      chief_complaint: "",
      reason_for_visit: "",
      clinical_notes: "",
      primary_insurance: null,
      prior_authorization: "",
      do_not_bill: false,
      do_not_send_electronically: doNotSendElectronically,
      diagnoses: [],
      total_charges: totalCharges?.toString() || "0.00",
    };

    console.log("FINAL PAYLOAD SENT TO API:", JSON.stringify(payload, null, 2));

    const statusLabelMap = {
      draft: "Draft",
      ready: "Review",
      accepted: "Approved",
      submitted: "Submitted to Claim",
    };

    try {
      const statusLabel = statusLabelMap[status] || status;

      const handleDownloadResponse = (res) => {
        const responseData = res;
        const text =
          typeof responseData === "string"
            ? responseData
            : JSON.stringify(responseData, null, 2);

        const blob = new Blob([text], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "response.txt";
        a.click();

        URL.revokeObjectURL(url);
      };

      if (isEditMode) {
        await updateEncounter.mutateAsync(
          { id, encounterData: payload },
          {
            onSuccess: (res) => {
              if (status === "submitted") {
                submitClaimMutation.mutate([id], {
                  onSuccess: handleDownloadResponse,
                });
              }
            },
            onError: (error) => {
              const specificErrorMsg =
                "Cannot accept encounter: The associated clinical note is not signed.";
              const errorStatus =
                error?.status?.toString() ||
                error?.response?.data?.status?.toString();
              console.log("DEBUG ERROR CHECK 3:", { error, errorStatus });
              toaster.error({
                title: "Error",
                description:
                  errorStatus === specificErrorMsg
                    ? specificErrorMsg
                    : "Failed to save encounter.",
              });
            },
          }
        );
        toaster.success({
          title: "Success",
          description: `Encounter saved as "${statusLabel}" successfully!`,
        });
      } else {
        const response = await createEncounter.mutateAsync(payload, {
          onSuccess: (res) => {
            if (status === "submitted" && res?.id) {
              submitClaimMutation.mutate([res.id], {
                onSuccess: handleDownloadResponse,
              });
            }
          },
        });
        toaster.success({
          title: "Success",
          description: `Encounter saved as "${statusLabel}" successfully!`,
        });
        if (response?.id) {
          navigate(`/pms/encounter/edit/${response.id}`);
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoadingStatus(null);
    }
  };

  const handleCancel = () => {
    setIsCancelOpen(true);
  };

  const confirmCancel = () => {
    setResetKey((prev) => prev + 1);
    setIsCancelOpen(false);
    toaster.success({
      title: "Reset",
      description: "Changes have been discarded.",
    });
    return true;
  };

  // Render search overlays (unchanged)
  if (searchMode === "patient") {
    return (
      <Box h="full" w="full" position="relative" bg="#202020">
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <CustomButton className="absolute top-3 right-14 px-6 py-5 z-10" onClick={closeSearch} variant="outline">
            Close
          </CustomButton>
        </Box>
        <PatientSearch onSelect={handlePatientSelect} />
      </Box>
    );
  }

  if (searchMode === "provider") {
    return (
      <Box h="full" w="full" position="relative" bg="#202020">
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <CustomButton className="absolute top-3 right-14 px-6 py-5 z-10" onClick={closeSearch} variant="outline">
            Close
          </CustomButton>
        </Box>
        <ProviderSearch onSelect={handleProviderSelect} />
      </Box>
    );
  }

  if (searchMode === "appointment") {
    return (
      <Box h="full" w="full" position="relative" bg="#202020">
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <CustomButton className="absolute top-3 right-14 px-6 py-5 z-10" onClick={closeSearch} variant="outline">
            Back to Form
          </CustomButton>
        </Box>
        <AppointmentSearch onSelect={handleAppointmentSelect} />
      </Box>
    );
  }

  if (searchMode === "priorAuth") {
    return (
      <Box h="full" w="full" position="relative" bg="#202020">
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <CustomButton onClick={closeSearch} variant="outline" size="sm">
            Back to Form
          </CustomButton>
        </Box>
        <PriorAuthSearch onSelect={handlePriorAuthSelect} onClose={closeSearch} />
      </Box>
    );
  }

  // Main form
  return (
    <>
      <Box
        w="full"
        bg="gray.900"
        color="white"
        overflowY="auto"
        h="full"
        display="flex"
        flexDirection="column"
      >
        <Tabs.Root
          value={tabValue}
          onValueChange={(e) => setTabValue(e.value)}
          variant="line"
          flex="1"
        >
          <Tabs.List
            bg="droidalBlack.300"
            px={4}
            borderBottom="1px solid #2f4d78"
          >
            <Tabs.Trigger value="general" _selected={{ color: "#00BBF2" }}>
              General
            </Tabs.Trigger>
            <Tabs.Trigger value="log" _selected={{ color: "#00BBF2" }}>
              Log
            </Tabs.Trigger>
            <Tabs.Trigger value="documents" _selected={{ color: "#00BBF2" }}>
              Documents (New)
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="general" p={2} flex="1" overflowY="auto" position="relative">
            {isAutofilling && (
              <Box
                position="fixed"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="blackAlpha.600"
                zIndex={9999}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={4}>
                  <Spinner size="xl" color="#fff" thickness="4px" />
                  <Text color="white" fontSize={"2xl"} fontWeight="bold">Autofilling procedure...</Text>
                </VStack>
              </Box>
            )}
            <EncounterGeneral
              key={resetKey}
              ref={encounterGeneralRef}
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              selectedAppointment={selectedAppointment}
              selectedPriorAuth={selectedPriorAuth}
              setSelectedPriorAuth={setSelectedPriorAuth}
              setSelectedAppointment={(appt) => {
                if (appt === null) {
                  setSelectedAppointment(null);
                  setProviders((prev) => ({
                    ...prev,
                    scheduling: null,
                    rendering: null,
                  }));
                  // Date clearing handled by EncounterGeneral useEffect on selectedAppointment
                } else {
                  handleAppointmentSelect(appt);
                }
              }}
              setSelectedProvider={setSelectedProvider}
              selectedProvider={selectedProvider}
              handleFindPatient={openPatientSearch}
              handleFindAppointment={openAppointmentSearch}
              handleFindPriorAuth={openPriorAuthSearch}
              handleFindProvider={openProviderSearch}
              isEditMode={isEditMode}
              isLoadingEncounter={isLoadingEncounter}
              serviceLines={serviceLines || initialServiceLines}
              providers={providers}
              setIsAutofilling={setIsAutofilling}
              status={encounterData?.status}
              isAppt={encounterData?.is_appt}
              // Pass derived initial values
              {...initialValues}
            />
          </Tabs.Content>

          <Tabs.Content value="log" p={2} flex="1" overflowY="auto">
            <EncounterLog />
          </Tabs.Content>

          <Tabs.Content value="documents" p={2} flex="1" overflowY="auto">
            <EncounterDocuments />
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      <HStack
        justify="flex-start"
        p={4}
        spacing={4}
        bg="gray.900"
        borderTop="1px solid #2f4d78"
      >
        <CustomButton
          variant="outline"
          onClick={() => handleSaveEncounter("draft")}
          isLoading={loadingStatus === "draft"}
          isDisabled={loadingStatus !== null}
        >
          Save as Draft
        </CustomButton>
        <CustomButton
          variant="outline"
          onClick={() => handleSaveEncounter("ready")}
          isLoading={loadingStatus === "ready"}
          isDisabled={loadingStatus !== null}
        >
          Save for Review
        </CustomButton>
        <CustomButton
          variant="solid"
          colorScheme="green"
          onClick={() => handleSaveEncounter("accepted")}
          isLoading={loadingStatus === "accepted"}
          isDisabled={loadingStatus !== null}
        >
          Approve
        </CustomButton>
        <CustomButton
          variant="solid"
          colorScheme="green"
          onClick={() => handleSaveEncounter("submitted")}
          isLoading={loadingStatus === "submitted"}
          isDisabled={loadingStatus !== null || selectedAppointment?.self_pay}
        >
          Submit Claim
        </CustomButton>
        <CustomButton
          variant="outline"
          isDisabled={loadingStatus !== null}
          onClick={handleCancel}
        >
          Cancel
        </CustomButton>
        <CustomButton variant="outline" isDisabled={loadingStatus !== null}>
          Check Codes
        </CustomButton>
      </HStack>

      <ConfirmationDialog
        open={isCancelOpen}
        onClose={setIsCancelOpen}
        onConfirm={confirmCancel}
        title="Cancel Changes"
        description="Are you sure you want to cancel the changes? This action will reset all fields."
      />
    </>
  );
};

export default EncounterModal;
