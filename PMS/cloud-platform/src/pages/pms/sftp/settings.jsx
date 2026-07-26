import { toaster } from "@/components/ui/toaster";
import { useGetSftp } from "@/hooks/query/pms/sftp/useGetSftp";
import { usePatchSftp } from "@/hooks/query/pms/sftp/usePatchSftp";
import { usePostSftp } from "@/hooks/query/pms/sftp/usePostSftp";
import { useEffect, useState } from "react";

export default function SftpOnboardingForm() {
  const [form, setForm] = useState({
    id: "",
    environment: "production",
    host: "",
    port: 22,
    authType: "",
    username: "",
    password: "",
    sshKey: "",
    inboundDir: "",
    archiveDir: "",
    retentionDays: "",
    x12Version: "",
    compression: "",
    namingConvention: "",
    payerName: "",
    payerId: "",
    tradingPartnerId: "",
    frequency: "",
    deliveryWindow: "",
    avgFilesPerDay: "",
    fileFrequency: "",
    whitelistedIps: "",
    techContact: "",
    opsContact: "",
  });

  const { data, isloading, isregistering } = useGetSftp();
  const { mutate: createSftp, isPending } = usePostSftp({
    onSuccess: (res) => {
      toaster.success({
        title: "SFTP created successfully",
        description: res?.message || "The sftp has been created.",
        duration: 3000,
      });
    },
  });
  const { mutate: updateSftp, isPending: isUpdating } = usePatchSftp({
    onSuccess: (res) => {
      toaster.success({
        title: "SFTP updated successfully",
        description: res.message || "The sftp has been updated.",
        status: "success",
        duration: 3000,
      });
    },
  });

  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return;

    const backend = data[0];

    setForm((prev) => ({
      ...prev,
      id: backend.id,
      environment: backend.environment ?? prev.environment,
      host: backend.host ?? "",
      port: backend.port ?? 22,
      authType: backend.auth_type ?? "ssh",
      username: backend.username ?? "",
      password: "", // never prefill secrets
      sshKey: "", // never prefill secrets
      inboundDir: backend.inbound_dir ?? "",
      archiveDir: backend.archive_dir ?? "",
      retentionDays: backend.retention_days ?? "",
      x12Version: backend.x12_version ?? prev.x12Version,
      compression: backend.compression ?? "none",
      namingConvention: backend.naming_convention ?? "",
      payerName: backend.payer_name ?? "",
      payerId: backend.payer_id ?? "",
      tradingPartnerId: backend.trading_partner_id ?? "",
      frequency: backend.frequency ?? "daily",
      deliveryWindow: backend.delivery_window ?? "",
      avgFilesPerDay: backend.avg_files_per_day ?? "",
      fileFrequency: backend.file_frequency ?? "",
      whitelistedIps: backend.whitelisted_ips ?? "",
      techContact: backend.tech_contact ?? "",
      opsContact: backend.ops_contact ?? "",
    }));
  }, [data]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const mapFormToBackend = (form) => ({
    id: form.id,
    environment: form.environment,
    host: form.host,
    port: form.port,

    auth_type: form.authType,
    username: form.username,
    password: form.password,
    ssh_key: form.sshKey,

    inbound_dir: form.inboundDir,
    archive_dir: form.archiveDir,
    retention_days: form.retentionDays,

    x12_version: form.x12Version,
    compression: form.compression,
    naming_convention: form.namingConvention,

    payer_name: form.payerName,
    payer_id: form.payerId,
    trading_partner_id: form.tradingPartnerId,

    frequency: form.frequency,
    delivery_window: form.deliveryWindow,
    avg_files_per_day: form.avgFilesPerDay,
    file_frequency: form.fileFrequency,

    whitelisted_ips: form.whitelistedIps,
    tech_contact: form.techContact,
    ops_contact: form.opsContact,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    {
      data?.[0]
        ? updateSftp(mapFormToBackend(form))
        : createSftp(mapFormToBackend(form));
    }
  };

  return (
    <>
      {/* ================= THEME (ONE FILE) ================= */}
      <style>{`
        :root {
          --app: #0f0f10;
          --panel: #18181b;
          --input: #1f1f23;
          --border: #2f2f35;

          --text-primary: #e5e7eb;
          --text-muted: #dfdfdf;

          --primary: #3b82f6;
          --primary-hover: #2563eb;
        }
      `}</style>

      <div className="min-h-screen bg-[var(--app)] p-8 text-[var(--text-primary)]">
        <div className="mx-auto max-w-7xl rounded-lg bg-[var(--panel)] shadow-lg">
          {/* Header */}
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h1 className="text-lg font-semibold">SFTP 835 Onboarding</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Configure payer ERA (835) SFTP access
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Section title="Environment">
              <Select
                label="Environment"
                value={form.environment}
                onChange={(v) => update("environment", v)}
                options={["test", "production"]}
              />
            </Section>

            <Section title="Connection">
              <Input
                label="SFTP Host / IP"
                value={form.host}
                onChange={(v) => update("host", v)}
              />
              <Input
                label="Port"
                type="number"
                value={form.port}
                onChange={(v) => update("port", v)}
              />
            </Section>

            <Section title="Authentication">
              <Select
                label="Auth Method"
                value={form.authType}
                onChange={(v) => update("authType", v)}
                options={[
                  { label: "SSH Key", value: "ssh" },
                  { label: "Username & Password", value: "password" },
                ]}
              />

              <Input
                label="Username"
                value={form.username}
                onChange={(v) => update("username", v)}
              />

              {form.authType === "password" && (
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(v) => update("password", v)}
                />
              )}

              {form.authType === "ssh" && (
                <Textarea
                  span="col-span-3"
                  label="Public SSH Key"
                  value={form.sshKey}
                  onChange={(v) => update("sshKey", v)}
                />
              )}
            </Section>

            <Section title="Directories">
              <Input
                label="Inbound 835 Path"
                value={form.inboundDir}
                onChange={(v) => update("inboundDir", v)}
              />
              <Input
                label="Archive Path"
                value={form.archiveDir}
                onChange={(v) => update("archiveDir", v)}
              />
              <Input
                label="Retention (Days)"
                type="number"
                value={form.retentionDays}
                onChange={(v) => update("retentionDays", v)}
              />
            </Section>

            <Section title="File Format">
              <Input
                label="X12 Version"
                value={form.x12Version}
                onChange={(v) => update("x12Version", v)}
              />
              <Select
                label="Compression"
                value={form.compression}
                onChange={(v) => update("compression", v)}
                options={["none", "zip", "gz"]}
              />
              <Input
                label="File Naming Pattern"
                value={form.namingConvention}
                onChange={(v) => update("namingConvention", v)}
              />
            </Section>

            <Section title="Payer Identification">
              <Input
                label="Payer Name"
                value={form.payerName}
                onChange={(v) => update("payerName", v)}
              />
              <Input
                label="Payer ID"
                value={form.payerId}
                onChange={(v) => update("payerId", v)}
              />
              <Input
                label="Trading Partner ID"
                value={form.tradingPartnerId}
                onChange={(v) => update("tradingPartnerId", v)}
              />
            </Section>

            <Section title="Delivery Expectations">
              <Select
                label="Frequency"
                value={form.frequency}
                onChange={(v) => update("frequency", v)}
                options={["daily", "weekly", "ad-hoc", "hourly", "minutes"]}
              />
              <Input
                label="Delivery Window"
                value={form.deliveryWindow}
                onChange={(v) => update("deliveryWindow", v)}
              />
              <Input
                label="Avg Files / Day"
                type="number"
                value={form.avgFilesPerDay}
                onChange={(v) => update("avgFilesPerDay", v)}
              />
              {form?.frequency == "minutes" && (
                <Input
                  label="Frequency In Minutes"
                  type="number"
                  value={form.fileFrequency}
                  onChange={(v) => update("fileFrequency", v)}
                />
              )}
            </Section>

            <Section title="Network & Security">
              <Textarea
                span="col-span-3"
                label="Whitelisted IPs / CIDRs"
                value={form.whitelistedIps}
                onChange={(v) => update("whitelistedIps", v)}
              />
            </Section>

            <Section title="Support Contacts">
              <Input
                label="Technical Contact"
                value={form.techContact}
                onChange={(v) => update("techContact", v)}
              />
              <Input
                label="Operations Contact"
                value={form.opsContact}
                onChange={(v) => update("opsContact", v)}
              />
            </Section>

            {/* Footer */}
            <div className="flex justify-end border-t border-[var(--border)] px-6 py-4">
              <button
                type="submit"
                className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              >
                Save & Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/* ================= COMPONENTS ================= */

const baseField =
  "rounded-md bg-[var(--input)] border border-[var(--border)] px-2 py-1.5 text-sm " +
  "text-[var(--text-primary)] placeholder:text-[var(--text-muted)] " +
  "focus:border-[var(--primary)] focus:outline-none";

const Section = ({ title, children }) => (
  <section className="border-b border-[var(--border)] px-6 py-6">
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
      {title}
    </h2>
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  </section>
);

const Input = ({ label, value, onChange, ...props }) => (
  <label className="flex flex-col text-sm">
    <span className="mb-1 text-[var(--text-muted)]">{label}</span>
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={baseField}
    />
  </label>
);

const Textarea = ({ label, value, onChange, span = "", ...props }) => (
  <label className={`flex flex-col text-sm ${span}`}>
    <span className="mb-1 text-[var(--text-muted)]">{label}</span>
    <textarea
      {...props}
      rows={4}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={baseField}
    />
  </label>
);

const Select = ({ label, value, onChange, options }) => (
  <label className="flex flex-col text-sm">
    <span className="mb-1 text-[var(--text-muted)]">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={baseField}
    >
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  </label>
);
