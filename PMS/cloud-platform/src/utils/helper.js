import { format, isValid } from "date-fns";

const formatDate = (date, stringFormat = "MM/dd/yyyy") => {
  if (!date) return "-";
  const d = new Date(date);
  if (!isValid(d)) return "-";
  return format(d, stringFormat);
};

const btoaAgentId = (id) => btoa("agent-" + id);

const btoaDepartmentId = (id, departmentName) =>
  departmentName.toLowerCase()?.replace(" ", "-") + "-" + btoa(id);

const atobDepartmentId = (id) => atob(id.split("-").at(-1));

const atobAgentId = (id) => {
  const agentId = atob(id);
  return agentId.replace("agent-", "");
};

const convertNumberToShortHand = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num;
};

const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  return Number(num).toLocaleString("en-US");
};

export {
  btoaAgentId,
  atobAgentId,
  btoaDepartmentId,
  atobDepartmentId,
  convertNumberToShortHand,
  formatNumber,
  formatDate,
};
