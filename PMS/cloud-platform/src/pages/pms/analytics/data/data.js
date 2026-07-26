// =========================
// TOP METRICS (UPDATED)
// =========================

export const topMetrics = [
  {
    label: "Patient Visits",
    value: "823",
    delta: +200,
    deltaLabel: "vs Last Period",
  },
  {
    label: "Gross Charges",
    value: "$162,350",
    delta: +30145,
    deltaLabel: "vs Last Period",
  },
  {
    label: "Net Collections",
    value: "$91,420",
    delta: +30290,
    deltaLabel: "vs Last Period",
  },
  {
    label: "Accounts Receivable",
    value: "$142,500",
    delta: +12500,
    deltaLabel: "vs Last Period",
  },
];

// =========================
// CHARGES MIX (DONUT CHART)
// =========================

export const chargesMixData = [
  { name: "Office Visits", value: 32 },
  { name: "Procedures", value: 41 },
  { name: "Diagnostics", value: 9 },
  { name: "Surgery", value: 4 },
  { name: "Telehealth", value: 7 },
  { name: "Other", value: 7 },
];

// =========================
// PERFORMANCE DATA (BAR CHART)
// =========================

export const performanceData = [
  { name: "Office", value: 38 },
  { name: "Surgery", value: 6 },
  { name: "Lab", value: 12 },
  { name: "Telehealth", value: 9 },
  { name: "Diagnostics", value: 5 },
  { name: "Therapy", value: 14 },
  { name: "Other", value: 27 },
];

// =========================
// MONTHLY USAGE DATA (12-MO LINE/BAR)
// =========================

export const usageData = [
  { date: "Jan", charges: 31000, collections: 24000, ar: 12000 },
  { date: "Feb", charges: 33000, collections: 25000, ar: 11800 },
  { date: "Mar", charges: 36000, collections: 27000, ar: 11500 },
  { date: "Apr", charges: 39000, collections: 30000, ar: 11900 },
  { date: "May", charges: 42000, collections: 32000, ar: 12200 },
  { date: "Jun", charges: 45000, collections: 34000, ar: 12600 },
  { date: "Jul", charges: 47000, collections: 36000, ar: 13000 },
  { date: "Aug", charges: 46000, collections: 35000, ar: 12800 },
  { date: "Sep", charges: 49000, collections: 37000, ar: 13200 },
  { date: "Oct", charges: 52000, collections: 39000, ar: 14000 },
  { date: "Nov", charges: 50000, collections: 36500, ar: 13800 },
  { date: "Dec", charges: 54000, collections: 41000, ar: 14400 },
];

// =========================
// DAILY DATA (30 DAYS)
// =========================

export const dailyUsageData = [
  { date: "Day 1", charges: 1200, collections: 900, ar: 240 },
  { date: "Day 2", charges: 1320, collections: 1000, ar: 250 },
  { date: "Day 3", charges: 1180, collections: 870, ar: 260 },
  { date: "Day 4", charges: 1400, collections: 1100, ar: 300 },
  { date: "Day 5", charges: 1500, collections: 1200, ar: 320 },
  { date: "Day 6", charges: 1380, collections: 1050, ar: 310 },
  { date: "Day 7", charges: 1450, collections: 1130, ar: 330 },
  { date: "Day 8", charges: 1600, collections: 1250, ar: 350 },
  { date: "Day 9", charges: 1700, collections: 1320, ar: 380 },
  { date: "Day 10", charges: 1650, collections: 1280, ar: 370 },
  { date: "Day 11", charges: 1580, collections: 1220, ar: 360 },
  { date: "Day 12", charges: 1720, collections: 1350, ar: 390 },
  { date: "Day 13", charges: 1800, collections: 1400, ar: 400 },
  { date: "Day 14", charges: 1900, collections: 1500, ar: 420 },
  { date: "Day 15", charges: 2000, collections: 1580, ar: 430 },
  { date: "Day 16", charges: 1950, collections: 1540, ar: 420 },
  { date: "Day 17", charges: 1880, collections: 1480, ar: 410 },
  { date: "Day 18", charges: 2100, collections: 1650, ar: 450 },
  { date: "Day 19", charges: 2200, collections: 1700, ar: 460 },
  { date: "Day 20", charges: 2150, collections: 1680, ar: 455 },
  { date: "Day 21", charges: 2250, collections: 1750, ar: 480 },
  { date: "Day 22", charges: 2350, collections: 1820, ar: 500 },
  { date: "Day 23", charges: 2400, collections: 1880, ar: 510 },
  { date: "Day 24", charges: 2550, collections: 1970, ar: 530 },
  { date: "Day 25", charges: 2600, collections: 2000, ar: 540 },
  { date: "Day 26", charges: 2700, collections: 2100, ar: 560 },
  { date: "Day 27", charges: 2800, collections: 2180, ar: 580 },
  { date: "Day 28", charges: 2900, collections: 2250, ar: 600 },
  { date: "Day 29", charges: 3000, collections: 2350, ar: 620 },
  { date: "Day 30", charges: 3100, collections: 2400, ar: 640 },
];

// =========================
// WEEKLY DATA (52 WEEKS)
// =========================

export const weeklyUsageData = Array.from({ length: 52 }).map((_, i) => ({
  date: `Week ${i + 1}`,
  charges: 20000 + Math.floor(Math.random() * 15000),
  collections: 15000 + Math.floor(Math.random() * 12000),
  ar: 8000 + Math.floor(Math.random() * 4000),
}));

// =========================
// PROVIDER PERFORMANCE
// =========================

export const providerPerformance = [
  { provider: "Dr. Smith", visits: 420, charges: 78000, collections: 56000 },
  { provider: "Dr. Patel", visits: 390, charges: 72000, collections: 51000 },
  { provider: "Dr. Lee", visits: 460, charges: 82000, collections: 60000 },
  { provider: "Dr. Gomez", visits: 310, charges: 58000, collections: 43000 },
];

export const yearlyUsageData = [
  { date: "2020", charges: 410000, collections: 330000, ar: 90000 },
  { date: "2021", charges: 455000, collections: 360000, ar: 95000 },
  { date: "2022", charges: 480000, collections: 378000, ar: 102000 },
  { date: "2023", charges: 520000, collections: 410000, ar: 110000 },
  { date: "2024", charges: 560000, collections: 440000, ar: 118000 },
  { date: "2025", charges: 590000, collections: 470000, ar: 120000 },
];

export const chargesMix_1w = [
  { name: "Office Visits", value: 36 },
  { name: "Procedures", value: 40 },
  { name: "Diagnostics", value: 8 },
  { name: "Surgery", value: 2 },
  { name: "Telehealth", value: 9 },
  { name: "Other", value: 5 },
];

export const chargesMix_1m = [
  { name: "Office Visits", value: 34 },
  { name: "Procedures", value: 42 },
  { name: "Diagnostics", value: 10 },
  { name: "Surgery", value: 3 },
  { name: "Telehealth", value: 6 },
  { name: "Other", value: 5 },
];

export const chargesMix_6m = [
  { name: "Office Visits", value: 32 },
  { name: "Procedures", value: 41 },
  { name: "Diagnostics", value: 9 },
  { name: "Surgery", value: 4 },
  { name: "Telehealth", value: 7 },
  { name: "Other", value: 7 },
];

export const chargesMix_1y = [
  { name: "Office Visits", value: 30 },
  { name: "Procedures", value: 39 },
  { name: "Diagnostics", value: 12 },
  { name: "Surgery", value: 5 },
  { name: "Telehealth", value: 8 },
  { name: "Other", value: 6 },
];

export const performance_1w = [
  { name: "Office", value: 45 },
  { name: "Surgery", value: 3 },
  { name: "Lab", value: 8 },
  { name: "Telehealth", value: 11 },
  { name: "Diagnostics", value: 4 },
  { name: "Therapy", value: 10 },
  { name: "Other", value: 19 },
];

export const performance_1m = [
  { name: "Office", value: 42 },
  { name: "Surgery", value: 5 },
  { name: "Lab", value: 10 },
  { name: "Telehealth", value: 9 },
  { name: "Diagnostics", value: 5 },
  { name: "Therapy", value: 12 },
  { name: "Other", value: 22 },
];

export const performance_6m = [
  { name: "Office", value: 38 },
  { name: "Surgery", value: 6 },
  { name: "Lab", value: 12 },
  { name: "Telehealth", value: 9 },
  { name: "Diagnostics", value: 5 },
  { name: "Therapy", value: 14 },
  { name: "Other", value: 27 },
];

export const performance_1y = [
  { name: "Office", value: 41 },
  { name: "Surgery", value: 8 },
  { name: "Lab", value: 15 },
  { name: "Telehealth", value: 10 },
  { name: "Diagnostics", value: 6 },
  { name: "Therapy", value: 16 },
  { name: "Other", value: 30 },
];

export const avgGrossChargesPerEncounter = [
  { month: "Jun", value: 320 },
  { month: "Jul", value: 335 },
  { month: "Aug", value: 310 },
  { month: "Sep", value: 345 },
  { month: "Oct", value: 360 },
  { month: "Nov", value: 355 },
];

export const topProcedures = [
  {
    code: "90837",
    description: "Psychotherapy, 60 minutes",
    amount: "$51.2K",
  },
  {
    code: "99214",
    description: "Office or other outpatient visit, est.",
    amount: "$28.7K",
  },
  {
    code: "01922",
    description: "Anesthesia for imaging / monitoring",
    amount: "$17.2K",
  },
  {
    code: "99213",
    description: "Office or other outpatient visit",
    amount: "$14.3K",
  },
  {
    code: "99204",
    description: "Office or other outpatient visit, new",
    amount: "$10.2K",
  },
  {
    code: "OTHER",
    description: "Other procedures",
    amount: "$10.4K",
  },
];

export const topPayers = [
  { name: "Patient", amount: "$13.1K" },
  { name: "Sunflower State Health", amount: "$10.9K" },
  { name: "Aetna", amount: "$9.4K" },
  { name: "Blue Cross Blue Shield", amount: "$8.7K" },
  { name: "UnitedHealthcare", amount: "$7.9K" },
  { name: "Other", amount: "$6.2K" },
];
