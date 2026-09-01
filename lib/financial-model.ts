export type PlatformAssumption = {
  id: 'steam' | 'epic' | 'switch' | 'playstation' | 'xbox' | 'other';
  label: string;
  salesSharePct: number;
  feePct: number;
};

export type ModelAssumptions = {
  startingCapital: number;
  gamePrice: number;
  monthOneUnitSales: number;
  monthlySalesDeclinePct: number;
  incomeTaxPct: number;
  marketingPct: number;
  forecastMonths: number;
  prelaunchDevelopment: number;
  prelaunchMarketing: number;
  prelaunchSalaries: number;
  prelaunchGA: number;
  monthlyDevelopment: number;
  monthlyGA: number;
  platforms: PlatformAssumption[];
};

export type ModelMonth = {
  monthIndex: number;
  month: string;
  units: number;
  baseRevenue: number;
  dlcRevenue: number;
  cosmeticsRevenue: number;
  totalRevenue: number;
  storeFees: number;
  grossProfit: number;
  development: number;
  marketing: number;
  salaries: number;
  generalAndAdministrative: number;
  totalExpenses: number;
  operatingIncome: number;
  incomeTax: number;
  netIncome: number;
  cumulativeNetIncome: number;
  cash: number;
};

export type ModelResult = {
  assumptions: ModelAssumptions;
  months: ModelMonth[];
  initialInvestment: number;
  fundingNeeded: number;
  breakEvenMonth: number | null;
  endingCash: number;
  peakCash: number;
  lifetimeUnits: number;
  lifetimeRevenue: number;
};

export const DEFAULT_ASSUMPTIONS: ModelAssumptions = {
  startingCapital: 65000,
  gamePrice: 20,
  monthOneUnitSales: 3000,
  monthlySalesDeclinePct: 15,
  incomeTaxPct: 20,
  marketingPct: 10,
  forecastMonths: 24,
  prelaunchDevelopment: 17100,
  prelaunchMarketing: 10000,
  prelaunchSalaries: 17000,
  prelaunchGA: 399,
  monthlyDevelopment: 1240,
  monthlyGA: 110,
  platforms: [
    { id: 'steam', label: 'Steam', salesSharePct: 70, feePct: 30 },
    { id: 'epic', label: 'Epic Games', salesSharePct: 10, feePct: 15 },
    { id: 'switch', label: 'Nintendo Switch', salesSharePct: 10, feePct: 30 },
    { id: 'playstation', label: 'PlayStation', salesSharePct: 10, feePct: 30 },
    { id: 'xbox', label: 'Xbox', salesSharePct: 0, feePct: 30 },
    { id: 'other', label: 'Other', salesSharePct: 0, feePct: 30 },
  ],
};

const dlcDrops = [
  { month: 4, price: 5, attachRate: 0.65 },
  { month: 6, price: 5, attachRate: 0.5 },
  { month: 16, price: 5, attachRate: 0.4 },
  { month: 22, price: 5, attachRate: 0.35 },
  { month: 24, price: 5, attachRate: 0.3 },
];

const cosmeticDrops = [
  { month: 4, price: 1, attachRate: 0.3 },
  { month: 6, price: 1, attachRate: 0.25 },
  { month: 8, price: 1, attachRate: 0.25 },
  { month: 10, price: 1, attachRate: 0.2 },
  { month: 12, price: 1, attachRate: 0.15 },
  { month: 14, price: 1, attachRate: 0.15 },
];

const roundMoney = (value: number) => Math.round(value * 100) / 100;

function cohortRevenue(month: number, declineRate: number, unitsAtLaunch: (month: number) => number, drops: typeof dlcDrops) {
  return drops.reduce((total, drop) => {
    if (drop.month > month) return total;
    const launchRevenue = unitsAtLaunch(drop.month) * drop.attachRate * drop.price;
    return total + launchRevenue * Math.pow(1 - declineRate, month - drop.month);
  }, 0);
}

export function calculateModel(overrides: Partial<ModelAssumptions> = {}): ModelResult {
  const assumptions: ModelAssumptions = {
    ...DEFAULT_ASSUMPTIONS,
    ...overrides,
    platforms: overrides.platforms ?? DEFAULT_ASSUMPTIONS.platforms,
  };
  const declineRate = assumptions.monthlySalesDeclinePct / 100;
  const weightedStoreFee = assumptions.platforms.reduce(
    (total, platform) => total + (platform.salesSharePct / 100) * (platform.feePct / 100),
    0,
  );
  const prelaunchCost = assumptions.prelaunchDevelopment + assumptions.prelaunchMarketing + assumptions.prelaunchSalaries + assumptions.prelaunchGA;
  let cumulativeNetIncome = -prelaunchCost;
  let previousGrossProfit = 0;
  const unitsForMonth = (month: number) => assumptions.monthOneUnitSales * Math.pow(1 - declineRate, month - 1);

  const months: ModelMonth[] = [];
  months.push({
    monthIndex: 0, month: 'Launch', units: 0, baseRevenue: 0, dlcRevenue: 0, cosmeticsRevenue: 0,
    totalRevenue: 0, storeFees: 0, grossProfit: 0, development: assumptions.prelaunchDevelopment,
    marketing: assumptions.prelaunchMarketing, salaries: assumptions.prelaunchSalaries,
    generalAndAdministrative: assumptions.prelaunchGA, totalExpenses: prelaunchCost,
    operatingIncome: -prelaunchCost, incomeTax: 0, netIncome: -prelaunchCost,
    cumulativeNetIncome, cash: assumptions.startingCapital + cumulativeNetIncome,
  });

  for (let month = 1; month <= assumptions.forecastMonths; month += 1) {
    const units = unitsForMonth(month);
    const baseRevenue = units * assumptions.gamePrice;
    const dlcRevenue = cohortRevenue(month, declineRate, unitsForMonth, dlcDrops);
    const cosmeticsRevenue = cohortRevenue(month, declineRate, unitsForMonth, cosmeticDrops);
    const totalRevenue = baseRevenue + dlcRevenue + cosmeticsRevenue;
    const storeFees = totalRevenue * weightedStoreFee;
    const grossProfit = totalRevenue - storeFees;
    const development = assumptions.monthlyDevelopment;
    const marketing = month === 1 ? 0 : previousGrossProfit * (assumptions.marketingPct / 100);
    const salaries = month <= 5 ? 2055 : 3109;
    const generalAndAdministrative = assumptions.monthlyGA;
    const totalExpenses = development + marketing + salaries + generalAndAdministrative;
    const operatingIncome = grossProfit - totalExpenses;
    const incomeTax = Math.max(0, operatingIncome) * (assumptions.incomeTaxPct / 100);
    const netIncome = operatingIncome - incomeTax;
    cumulativeNetIncome += netIncome;
    months.push({
      monthIndex: month,
      month: month <= 12 ? `M${month}` : `Y2 M${month - 12}`,
      units: Math.round(units),
      baseRevenue: roundMoney(baseRevenue),
      dlcRevenue: roundMoney(dlcRevenue),
      cosmeticsRevenue: roundMoney(cosmeticsRevenue),
      totalRevenue: roundMoney(totalRevenue),
      storeFees: roundMoney(storeFees),
      grossProfit: roundMoney(grossProfit),
      development,
      marketing: roundMoney(marketing),
      salaries,
      generalAndAdministrative,
      totalExpenses: roundMoney(totalExpenses),
      operatingIncome: roundMoney(operatingIncome),
      incomeTax: roundMoney(incomeTax),
      netIncome: roundMoney(netIncome),
      cumulativeNetIncome: roundMoney(cumulativeNetIncome),
      cash: roundMoney(assumptions.startingCapital + cumulativeNetIncome),
    });
    previousGrossProfit = grossProfit;
  }

  const minimumCumulativeIncome = Math.min(...months.map((month) => month.cumulativeNetIncome));
  const breakEven = months.find((month) => month.monthIndex > 0 && month.cumulativeNetIncome >= 0);
  return {
    assumptions,
    months,
    initialInvestment: prelaunchCost,
    fundingNeeded: Math.max(0, -minimumCumulativeIncome),
    breakEvenMonth: breakEven?.monthIndex ?? null,
    endingCash: months.at(-1)?.cash ?? assumptions.startingCapital,
    peakCash: Math.max(...months.map((month) => month.cash)),
    lifetimeUnits: months.reduce((total, month) => total + month.units, 0),
    lifetimeRevenue: roundMoney(months.reduce((total, month) => total + month.totalRevenue, 0)),
  };
}

export const MODEL_CONVENTIONS = {
  marketingTiming: 'Marketing spend is 10% of the prior month gross profit, matching the spreadsheet timing.',
  taxLosses: 'Operating losses do not create an immediate cash tax benefit.',
  addOns: 'DLC and cosmetics revenue are included in total revenue and storefront fees.',
  prelaunch: 'Pre-launch costs remain grouped at launch until the source timeline is clarified.',
} as const;
