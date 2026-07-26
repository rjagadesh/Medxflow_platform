// src/pages/MissedCharges.jsx

import { useCallback } from "react";
import ListLayout from "./Components/ListLayout";
// update path if needed

// TABLE COLUMNS
const columns = [
  { accessor_key: "appt_id", title: "Appt ID" },
  { accessor_key: "appt_date", title: "Appt Date" },
  { accessor_key: "time", title: "Time" },
  { accessor_key: "patient", title: "Patient" },
  { accessor_key: "dob", title: "DOB" },
  { accessor_key: "provider", title: "Provider" },
  { accessor_key: "service_location", title: "Service Location" },
  { accessor_key: "appt_reason", title: "Appt Reason" },
  { accessor_key: "appt_status", title: "Appt Status" },
];

// FILTER INPUTS AT TOP
const filterDefs = [
  { key: "search", label: "Search Patient" },
  { key: "provider", label: "Provider" },
  { key: "service_location", label: "Service Location" },
  { key: "appt_status", label: "Appt Status" },
];

// MOCK DATA (mirrors the screenshot)
const mockMissedCharges = [
  {
    appt_id: "8678",
    appt_date: "12/03/2025",
    time: "7:00 PM - 8:00 PM",
    patient: "CARLETON, MOLLY",
    dob: "10/22/2007",
    provider: "SETH BREMYER",
    service_location: "SETH BREMYER",
    appt_reason: "Psychotherapy",
    appt_status: "Confirmed",
  },
  {
    appt_id: "8647",
    appt_date: "12/03/2025",
    time: "6:00 PM - 7:00 PM",
    patient: "BISHOP, WESLEY ATLAS",
    dob: "04/11/2019",
    provider: "SETH BREMYER",
    service_location: "KSP Health - Kansas",
    appt_reason: "Psychotherapy",
    appt_status: "Confirmed",
  },
  {
    appt_id: "8595",
    appt_date: "12/03/2025",
    time: "5:00 PM - 5:30 PM",
    patient: "COOMES, ISAIAH",
    dob: "09/23/2010",
    provider: "MICHAEL HERRIGES",
    service_location: "KSPEDIATRICS LLC",
    appt_reason: "Behavioral Follow Up",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8771",
    appt_date: "12/03/2025",
    time: "5:00 PM - 6:00 PM",
    patient: "CRIBLEY, ROBIN OLIVER",
    dob: "02/12/2012",
    provider: "TIMOTHY POST",
    service_location: "KSP Health - Kansas",
    appt_reason: "Psychotherapy",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8753",
    appt_date: "12/03/2025",
    time: "4:30 PM - 5:00 PM",
    patient: "WOLSIFIER, BASTIEN GREY",
    dob: "06/27/2013",
    provider: "MICHAEL HERRIGES",
    service_location: "KSP Health - Kansas",
    appt_reason: "Behavioral Follow Up",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8714",
    appt_date: "12/03/2025",
    time: "3:30 PM - 4:30 PM",
    patient: "WOOD, LANEY JOAN",
    dob: "03/05/2006",
    provider: "MICHAEL HERRIGES",
    service_location: "KSP Health - Kansas",
    appt_reason: "Behavioral Consult",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8662",
    appt_date: "12/03/2025",
    time: "2:00 PM - 3:00 PM",
    patient: "SHINKLE, BRODY CLARK",
    dob: "04/04/2007",
    provider: "SETH BREMYER",
    service_location: "SETH BREMYER",
    appt_reason: "Psychotherapy",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8585",
    appt_date: "12/03/2025",
    time: "11:00 AM - 12:00 PM",
    patient: "BEERS, COURTNEY",
    dob: "02/28/1989",
    provider: "SETH BREMYER",
    service_location: "KSP Health - Kansas",
    appt_reason: "Psychotherapy",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8763",
    appt_date: "12/03/2025",
    time: "10:30 AM - 11:00 AM",
    patient: "WILSON, ROYCE",
    dob: "05/18/1966",
    provider: "KATHERINE WALDEN",
    service_location: "KSP Health - Kansas",
    appt_reason: "Follow Up",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8773",
    appt_date: "12/03/2025",
    time: "10:00 AM - 10:15 AM",
    patient: "LAURENZO, ALICIA M",
    dob: "04/08/1995",
    provider: "KATHERINE WALDEN",
    service_location: "KSP Health - Kansas",
    appt_reason: "Medication Refill",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8768",
    appt_date: "12/03/2025",
    time: "9:30 AM - 10:00 AM",
    patient: "HERRERA, ALHENDRA",
    dob: "01/18/1995",
    provider: "KATHERINE WALDEN",
    service_location: "KSP Health - Kansas",
    appt_reason: "Follow Up",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8762",
    appt_date: "12/03/2025",
    time: "9:00 AM - 10:00 AM",
    patient: "GETTIS ROBINSON, MONIQUE",
    dob: "08/26/1968",
    provider: "SETH BREMYER",
    service_location: "SETH BREMYER",
    appt_reason: "Psychotherapy Intake",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8767",
    appt_date: "12/03/2025",
    time: "9:00 AM - 9:15 AM",
    patient: "HOLT, NICK",
    dob: "08/19/1960",
    provider: "KATHERINE WALDEN",
    service_location: "KSP Health - Kansas",
    appt_reason: "Medication Refill",
    appt_status: "Scheduled",
  },
  {
    appt_id: "8777",
    appt_date: "12/02/2025",
    time: "6:30 PM - 7:00 PM",
    patient: "HOFFMAN, RACHEL",
    dob: "08/01/1983",
    provider: "SHELBY BROOKS",
    service_location: "KSP Health - Kansas",
    appt_reason: "Follow Up",
    appt_status: "Scheduled",
  },
];

// PAGE COMPONENT
export default function MissedCharges() {
  const fetchData = useCallback(async ({ filters }) => {
    let data = [...mockMissedCharges];

    // Free-text search on patient
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter((x) => x.patient.toLowerCase().includes(s));
    }

    // Provider filter
    if (filters.provider) {
      const p = filters.provider.toLowerCase();
      data = data.filter((x) => x.provider.toLowerCase().includes(p));
    }

    // Service Location filter
    if (filters.service_location) {
      const loc = filters.service_location.toLowerCase();
      data = data.filter((x) => x.service_location.toLowerCase().includes(loc));
    }

    // Appt Status filter
    if (filters.appt_status) {
      const st = filters.appt_status.toLowerCase();
      data = data.filter((x) => x.appt_status.toLowerCase().includes(st));
    }

    return data;
  }, []);

  return (
    <ListLayout
      title="MISSED CHARGES"
      data={fetchData}
      columns={columns}
      filters={filterDefs}
      profile={[]} // no side profile for this page
    />
  );
}
