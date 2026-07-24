/**
 * ModulePage — a generic scaffold for MedXFlow modules that don't have a
 * dedicated screen yet (kiosks, hardware, and RCM agents still being built).
 * Routed at /m/:slug; the title/description come from MODULES below.
 */
import { useParams } from "react-router-dom";

import { usePageHeader } from "../context/PageHeaderContext.jsx";

export const MODULES = {
  // Platforms
  "ai-front-desk-kiosk": { title: "AI Front Desk Kiosk", desc: "Patient self-check-in kiosk with an AI front-desk agent." },
  "eob-to-era": { title: "EOB to ERA", desc: "Convert paper EOBs into 835 electronic remittance advice automatically." },
  // RCM AI Agents
  "pre-registration-scheduling": { title: "Pre-registration & Scheduling", desc: "AI agent that pre-registers patients and books appointments." },
  "registration-check-in": { title: "Registration & Check-in", desc: "Automated patient registration and check-in." },
  "charge-capture-coding": { title: "Charge Capture & Coding", desc: "AI-assisted charge capture and medical coding." },
  "payment-posting-remittance": { title: "Payment Posting & Remittance", desc: "Auto-post payments and reconcile remittance." },
  "patient-statements-collections": { title: "Patient Statements & Collections", desc: "Generate statements and run collections workflows." },
  // Managed billing
  "managed-billing-services": { title: "Managed Billing Services", desc: "A dedicated, human-led billing team runs your revenue cycle end to end." },
  // Hardware
  "self-service-kiosk": { title: "Self-service Kiosk", desc: "Lobby kiosk hardware for patient self-service." },
  "reception-tablet": { title: "Reception Tablet", desc: "Front-desk tablet for staff-assisted intake." },
  "card-payment-terminal": { title: "Card Payment Terminal", desc: "Integrated card terminal for on-site patient payments." },
  "voice-gateway": { title: "Voice Gateway", desc: "Telephony gateway powering inbound/outbound voice AI." },
};

function titleize(slug) {
  return (slug || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ModulePage() {
  const { slug } = useParams();
  const mod = MODULES[slug] || { title: titleize(slug), desc: "This MedXFlow module is being set up." };
  usePageHeader(mod.title, mod.desc);

  return (
    <div className="modstub">
      <div className="modstub__card">
        <span className="modstub__badge">MedXFlow · RCM Suite</span>
        <h2 className="modstub__title">{mod.title}</h2>
        <p className="modstub__desc">{mod.desc}</p>
        <p className="modstub__note">This module is part of your MedXFlow suite and is being set up. Wire it to a workflow or connector when ready.</p>
      </div>
    </div>
  );
}
