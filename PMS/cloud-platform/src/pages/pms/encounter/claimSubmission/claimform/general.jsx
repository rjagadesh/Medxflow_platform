import { Box, Flex } from "@chakra-ui/react";

import ClaimDetailsBox from "./claimdetailbox";
import ClaimSummary from "./claimSummary";
import ClaimTransactionsSteps from "./claimTransaction";
import { useGetClaimById } from "./getClaimForm";

export default function ClaimOverview(id) {
  // const data = {
  //   claim: {
  //     id: "7188",
  //     title: "Edit Claim (7188)",
  //     patient: {
  //       name: "Tiffany DeWitt",
  //       dob: "1978-08-19",
  //       patient_id: "3523",
  //     },

  //     general: {
  //       encounter_id: "6940",
  //       case: {
  //         payer: "Blue Cross and Blue Shield of Kansas",
  //         payer_code: "BCBS-KS",
  //       },
  //       provider: {
  //         name: "Michael Patrick Herriges, ARNP-C",
  //         npi: "1225325558",
  //       },
  //       location: {
  //         name: "Michael Patrick Herriges",
  //       },
  //     },

  //     service_details: {
  //       date_of_service: "2025-12-18",
  //       procedure: {
  //         code: "99213",
  //         description: "Office or other outpatient visit, established patient",
  //       },
  //       modifiers: [
  //         {
  //           code: "GT",
  //           description:
  //             "Via interactive audio and video telecommunication systems",
  //         },
  //       ],
  //       type_of_service: {
  //         code: "1",
  //         label: "Medical Care",
  //       },
  //     },

  //     diagnosis: [
  //       {
  //         slot: 1,
  //         icd10: "F90.2",
  //         description: "ADHD, combined type",
  //       },
  //       {
  //         slot: 2,
  //         icd10: "F41.1",
  //         description: "Generalized anxiety disorder",
  //       },
  //       {
  //         slot: 3,
  //         icd10: null,
  //       },
  //       {
  //         slot: 4,
  //         icd10: null,
  //       },
  //     ],

  //     financial_summary: {
  //       units: 1.0,
  //       unit_charge: 150.0,
  //       total_charges: 150.0,
  //       adjustments: 0.0,
  //       adjusted_charges: 150.0,
  //       patient_payments: 0.0,
  //       insurance_payments: 0.0,
  //       total_payments: 0.0,
  //       patient_balance: 0.0,
  //       insurance_balance: 150.0,
  //       total_balance: 150.0,
  //     },

  //     clearinghouse: {
  //       tracking_id: "251221562675",
  //       vendor: "GatewayEDI",
  //     },

  //     transactions: [
  //       {
  //         date: "2025-12-18",
  //         status: "Created",
  //         description: "Service line created from encounter #6940 with ICD-10",
  //         amount: 150.0,
  //         patient_responsibility: 150.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-18",
  //         status: "Transferred",
  //         description:
  //           "Transferred $150.00 to primary insurance: Blue Cross and Blue Shield of Kansas",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-21",
  //         status: "Claim Processed",
  //         description: "GatewayEDI ACK received – claim accepted",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-22",
  //         status: "Billed",
  //         description: "Submitted electronic claim to primary insurance",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },

  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },

  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },

  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //       {
  //         date: "2025-12-22",
  //         status: "Claim Sent",
  //         description:
  //           "Sent to GatewayEDI batch #107165682, transaction ID #216233694",
  //         amount: 0.0,
  //         patient_responsibility: 0.0,
  //         balance: 150.0,
  //       },
  //     ],
  //   },
  // };

  const normalizeEncounterRow = (raw) => {
    const safeJSON = (value) => {
      if (!value || typeof value !== "string") return {};
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    };

    const num = (v) =>
      v === null || v === "" || v === undefined ? 0 : Number(v);

    return {
      // ------------------
      // Core Identifiers
      // ------------------
      id: raw.id,
      encounter_number: raw.encounter?.encounter_number,
      status: raw.encounter?.status,

      // ------------------
      // Location / POS
      // ------------------
      location: raw.encounter?.location,
      place_of_service_code: raw.encounter?.place_of_service_code,

      // ------------------
      // Dates
      // ------------------
      service_date: {
        from: raw.date_from ?? raw.service_date_from ?? null,
        to: raw.date_from ?? raw.service_date_to ?? null,
      },

      hospitalization: {
        from: raw.hospitalized_from ?? null,
        to: raw.hospitalized_to ?? null,
      },

      timestamps: {
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        started_at: raw.started_at,
        ended_at: raw.ended_at,
      },

      // ------------------
      // Patient
      // ------------------
      patient: raw.encounter?.patient
        ? {
            id: raw.encounter?.patient.id,
            first_name: raw.encounter?.patient.first_name,
            last_name: raw.encounter?.patient.last_name,
            phone: raw.encounter?.patient.mobile_phone ?? null,
            insurance_name: raw.encounter?.patient.insurance_name ?? null,
          }
        : null,

      // ------------------
      // Billing Summary
      // ------------------
      billing: {
        total_charges: num(raw.total_charges),
        payment_amount: num(raw.payment_amount),
        balance_due: num(raw.total_charges) - num(raw.payment_amount),
      },

      // ------------------
      // Service Line
      // ------------------
      service_line: {
        line_id: raw.id ?? null,
        procedure_code: raw.procedure_code,
        description: raw.description,
        units: num(raw.units),
        unit_charge: num(raw.unit_charge),
        total_charge: num(raw.total_charge),
        modifiers: safeJSON(raw.modifiers),
        diag_pointers: safeJSON(raw.diag_pointers),
        ndc_code: raw.ndc_code ?? "",
        tos_code: raw.tos_code ?? "",
        reference_code: raw.reference_code ?? "",
        is_concurrent: raw.is_concurrent ?? false,
        minutes: num(raw.minutes),
        start_time: raw.start_time,
        end_time: raw.end_time,
        line_note: raw.line_note ?? "",
      },

      // ------------------
      // Providers
      // ------------------
      providers: {
        rendering_provider: raw.encounter?.rendering_provider ?? null,
        supervising_provider: raw.encounter?.supervising_provider ?? null,
        referring_provider: raw.encounter?.referring_provider ?? null,
      },

      // ------------------
      // Claim / Submission
      // ------------------
      claim: {
        batch_number: raw.encounter?.batch_number ?? "",
        payer_doc_control: raw.encounter?.payer_doc_control ?? "",
        submit_reason: raw.encounter?.submit_reason ?? "",
        do_not_bill: raw.encounter?.do_not_bill ?? false,
        do_not_send_electronically:
          raw.encounter?.do_not_send_electronically ?? false,
        prior_authorization: raw.encounter?.prior_authorization ?? "",
      },

      // ------------------
      // Notes
      // ------------------
      notes: {
        chief_complaint: raw.encounter?.chief_complaint ?? "",
        clinical_notes: raw.encounter?.clinical_notes ?? "",
        eclaim_note: raw.encounter?.eclaim_note ?? "",
        eclaim_note_type: raw.encounter?.eclaim_note_type ?? "",
        reason_for_visit: raw.encounter?.reason_for_visit ?? "",
      },
    };
  };

  const { data: patientData } = useGetClaimById(id ? id.id : null);
  const claim = normalizeEncounterRow(patientData);

  if (!claim?.id) return null;

  return (
    <Box bg="#121212" minH="80vh" p={4} borderRadius="md">
      <Box flex="1">
        <ClaimDetailsBox claim={claim} />
      </Box>

      <Flex mt={8} gap={6} align="flex-start">
        <ClaimSummary summary={claim.service_line} />
        <Box>
          <ClaimTransactionsSteps claim={claim} />
        </Box>
      </Flex>
    </Box>
  );
}
