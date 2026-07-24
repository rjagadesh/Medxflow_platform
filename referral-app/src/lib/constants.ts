import type { Status } from "../types";

// Full pipeline order (board columns).
export const STATUSES: Status[] = [
  "Received", "Extracting", "Manual Review", "Extracted", "Duplicate",
  "Pending Review", "Eligibility Verified", "Auto Approved", "Assigned",
  "Scheduled", "Awaiting Authorization", "Authorized", "Completed",
  "No Show", "Cancelled", "Redirected", "Extraction Failed", "Expired",
];

// The linear "funnel" the Overview + Analytics summarise.
export const FUNNEL: Status[] = [
  "Received", "Extracted", "Eligibility Verified", "Assigned", "Scheduled", "Completed",
];

// Column top-border + pill colour per status (tailwind classes).
export const STATUS_COLOR: Record<Status, string> = {
  "Received": "#64748b",
  "Extracting": "#0ea5e9",
  "Manual Review": "#f59e0b",
  "Extracted": "#6366f1",
  "Duplicate": "#a855f7",
  "Pending Review": "#eab308",
  "Eligibility Verified": "#14b8a6",
  "Auto Approved": "#22c55e",
  "Assigned": "#3b82f6",
  "Scheduled": "#8b5cf6",
  "Awaiting Authorization": "#f97316",
  "Authorized": "#10b981",
  "Completed": "#16a34a",
  "No Show": "#ef4444",
  "Cancelled": "#94a3b8",
  "Redirected": "#0891b2",
  "Extraction Failed": "#dc2626",
  "Expired": "#6b7280",
};

// Pill tailwind classes (light/dark) keyed loosely by tone.
export function pillClasses(status: Status): string {
  const good = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  const info = "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  const warn = "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  const bad = "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
  const neutral = "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300";
  const map: Partial<Record<Status, string>> = {
    "Completed": good, "Authorized": good, "Auto Approved": good, "Eligibility Verified": good,
    "Assigned": info, "Scheduled": info, "Extracted": info, "Extracting": info, "Redirected": info,
    "Manual Review": warn, "Pending Review": warn, "Awaiting Authorization": warn,
    "No Show": bad, "Extraction Failed": bad, "Expired": bad, "Cancelled": neutral,
    "Duplicate": bad, "Received": neutral,
  };
  return map[status] ?? neutral;
}

// State machine — allowed transitions when dragging a card on the board.
export const TRANSITIONS: Record<Status, Status[]> = {
  "Received": ["Extracting", "Duplicate", "Extraction Failed"],
  "Extracting": ["Extracted", "Manual Review", "Extraction Failed"],
  "Manual Review": ["Extracted", "Pending Review", "Duplicate", "Redirected"],
  "Extracted": ["Pending Review", "Eligibility Verified", "Duplicate"],
  "Duplicate": ["Cancelled", "Redirected"],
  "Pending Review": ["Eligibility Verified", "Auto Approved", "Redirected"],
  "Eligibility Verified": ["Auto Approved", "Assigned", "Awaiting Authorization"],
  "Auto Approved": ["Assigned", "Scheduled"],
  "Assigned": ["Scheduled", "Awaiting Authorization", "Redirected"],
  "Scheduled": ["Completed", "No Show", "Cancelled", "Awaiting Authorization"],
  "Awaiting Authorization": ["Authorized", "Cancelled", "Expired"],
  "Authorized": ["Scheduled", "Assigned"],
  "Completed": [],
  "No Show": ["Scheduled", "Cancelled"],
  "Cancelled": [],
  "Redirected": ["Received"],
  "Extraction Failed": ["Received", "Manual Review", "Cancelled"],
  "Expired": ["Received"],
};

export function canTransition(from: Status, to: Status): boolean {
  if (from === to) return true;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export const PRIORITY_COLOR: Record<string, string> = {
  Urgent: "text-rose-600 dark:text-rose-400",
  High: "text-orange-600 dark:text-orange-400",
  Medium: "text-amber-600 dark:text-amber-400",
  Low: "text-slate-500 dark:text-slate-400",
};

export const CONFIDENCE_THRESHOLD = 0.75;
