// src/pages/AllAppointments.jsx

import { useCallback } from "react";
import ListLayout from "./Components/ListLayout";

// Columns for the Table component
const columns = [
  { accessor_key: "appt_id", title: "Appt ID" },
  { accessor_key: "appt_date", title: "Appt Date" },
  { accessor_key: "time", title: "Time" },
  { accessor_key: "patient", title: "Patient" },
  { accessor_key: "dob", title: "DOB" },
  { accessor_key: "home_phone", title: "Home Phone" },
  { accessor_key: "mobile_phone", title: "Mobile Number" },
  { accessor_key: "provider", title: "Provider" },
  { accessor_key: "service_location", title: "Service Location" },
  { accessor_key: "appt_reason", title: "Appt Reason" },
];

// Filters shown at the top
const filterDefs = [
  { key: "search", label: "Search Patient" },
  { key: "provider", label: "Provider" },
  { key: "location", label: "Location" },
  { key: "reason", label: "Appt Reason" },
];

// Simulated backend fetch (replace with API)
const mockAppointments = [
  {
    appt_id: "8678",
    appt_date: "12/03/2025",
    time: "7:00 PM - 8:00 PM",
    patient: "CARLETON, MOLLY",
    dob: "10/22/2007",
    home_phone: "8165826531",
    mobile_phone: "8166793933",
    provider: "SETH BREMYER",
    service_location: "SETH BREMYER",
    appt_reason: "Psychotherapy",
  },
  {
    appt_id: "8647",
    appt_date: "12/03/2025",
    time: "6:00 PM - 7:00 PM",
    patient: "BISHOP, WESLEY ATLAS",
    dob: "04/11/2019",
    home_phone: "6202058112",
    mobile_phone: "6202058112",
    provider: "SETH BREMYER",
    service_location: "KSP Health - Kansas",
    appt_reason: "Psychotherapy",
  },
  {
    appt_id: "8595",
    appt_date: "12/03/2025",
    time: "5:00 PM - 5:30 PM",
    patient: "COOMES, ISAIAH",
    dob: "09/23/2010",
    home_phone: "7854765528",
    mobile_phone: "7853020645",
    provider: "MICHAEL HERRIGES",
    service_location: "KSPEDIATRICS LLC",
    appt_reason: "Behavioral Health",
  },
  {
    appt_id: "8771",
    appt_date: "12/03/2025",
    time: "5:00 PM - 6:00 PM",
    patient: "CRIBLEY, ROBIN OLIVER",
    dob: "02/12/2012",
    home_phone: "9152529970",
    mobile_phone: "9152529970",
    provider: "TIMOTHY POST",
    service_location: "KSP Health - Kansas",
    appt_reason: "Psychotherapy",
  },
  {
    appt_id: "8753",
    appt_date: "12/03/2025",
    time: "4:30 PM - 5:00 PM",
    patient: "WOLSIFIER, BASTIEN GREY",
    dob: "06/27/2013",
    home_phone: "8162139453",
    mobile_phone: "8162139453",
    provider: "MICHAEL HERRIGES",
    service_location: "KSP Health - Kansas",
    appt_reason: "Behavioral Health",
  },
  {
    appt_id: "8639",
    appt_date: "12/03/2025",
    time: "3:30 PM - 4:30 PM",
    patient: "TEST, SYNC-DIAG",
    dob: "01/01/1980",
    home_phone: "8885555555",
    mobile_phone: "8885555555",
    provider: "LEAH SOMES",
    service_location: "KSP Health - Kansas",
    appt_reason: "Consultation",
  },
  {
    appt_id: "8714",
    appt_date: "12/03/2025",
    time: "3:30 PM - 4:30 PM",
    patient: "WOOD, LANEY JOAN",
    dob: "03/05/2006",
    home_phone: "6204912107",
    mobile_phone: "6204912107",
    provider: "MICHAEL HERRIGES",
    service_location: "KSP Health - Kansas",
    appt_reason: "Behavioral Health",
  },
  {
    appt_id: "8662",
    appt_date: "12/03/2025",
    time: "2:00 PM - 3:00 PM",
    patient: "SHINKLE, BRODY CLARK",
    dob: "04/04/2007",
    home_phone: "9137070924",
    mobile_phone: "9136260820",
    provider: "SETH BREMYER",
    service_location: "SETH BREMYER",
    appt_reason: "Psychotherapy",
  },
  {
    appt_id: "8653",
    appt_date: "12/03/2025",
    time: "1:00 PM - 1:30 PM",
    patient: "STARK, MIRANDA DAWN",
    dob: "03/21/1975",
    home_phone: "7852070583",
    mobile_phone: "7852070583",
    provider: "MICHAEL HERRIGES",
    service_location: "KSP Health - Kansas",
    appt_reason: "Behavioral Health",
  },
  {
    appt_id: "8585",
    appt_date: "12/03/2025",
    time: "11:00 AM - 12:00 PM",
    patient: "BEERS, COURTNEY",
    dob: "02/28/1989",
    home_phone: "6204300488",
    mobile_phone: "6204300488",
    provider: "SETH BREMYER",
    service_location: "KSP Health - Kansas",
    appt_reason: "Psychotherapy",
  },
  {
    appt_id: "8763",
    appt_date: "12/03/2025",
    time: "10:30 AM - 11:00 AM",
    patient: "WILSON, ROYCE",
    dob: "05/18/1966",
    home_phone: "3167199322",
    mobile_phone: "3167199322",
    provider: "KATHERINE WALDEN",
    service_location: "KSP Health - Kansas",
    appt_reason: "Follow Up",
  },
  {
    appt_id: "8773",
    appt_date: "12/03/2025",
    time: "10:00 AM - 10:15 AM",
    patient: "LAURENZO, ALICIA M",
    dob: "04/08/1995",
    home_phone: "9135302182",
    mobile_phone: "9135302182",
    provider: "KATHERINE WALDEN",
    service_location: "KSP Health - Kansas",
    appt_reason: "Medication Review",
  },
  {
    appt_id: "8768",
    appt_date: "12/03/2025",
    time: "9:30 AM - 10:00 AM",
    patient: "HERRERA, ALHENDRA",
    dob: "01/18/1995",
    home_phone: "3166702782",
    mobile_phone: "3163126190",
    provider: "KATHERINE WALDEN",
    service_location: "KSP Health - Kansas",
    appt_reason: "Follow Up",
  },
  {
    appt_id: "8762",
    appt_date: "12/03/2025",
    time: "9:00 AM - 10:00 AM",
    patient: "GETTIS, ROBINSON, MONIQUE",
    dob: "08/26/1968",
    home_phone: "6787995041",
    mobile_phone: "6787995041",
    provider: "SETH BREMYER",
    service_location: "SETH BREMYER",
    appt_reason: "Psychotherapy",
  },
];

export default function AllAppointments() {
  // fetchData handler used by ListLayout
  const fetchData = useCallback(async ({ filters }) => {
    let data = [...mockAppointments];

    // SEARCH filter
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter((x) => x.patient.toLowerCase().includes(s));
    }

    // Provider filter
    if (filters.provider) {
      data = data.filter((x) =>
        x.provider.toLowerCase().includes(filters.provider.toLowerCase())
      );
    }

    // Location filter
    if (filters.location) {
      data = data.filter((x) =>
        x.service_location
          ?.toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    // Reason filter
    if (filters.reason) {
      data = data.filter((x) =>
        x.appt_reason.toLowerCase().includes(filters.reason.toLowerCase())
      );
    }

    return data;
  }, []);

  return (
    <ListLayout
      title="ALL APPOINTMENTS"
      data={fetchData}
      columns={columns}
      filters={filterDefs}
      profile={[]} // appointments don't use profile preview
    />
  );
}
