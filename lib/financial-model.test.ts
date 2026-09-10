import { describe, expect, it } from 'vitest';
import { calculateModel, DEFAULT_ASSUMPTIONS } from './financial-model';

describe('financial model', () => {
  it('reconciles Cam baseline pre-launch investment', () => {
    const result = calculateModel();
    expect(result.initialInvestment).toBe(44599);
    expect(result.fundingNeeded).toBe(44599);
    expect(result.months[0].cash).toBe(
      DEFAULT_ASSUMPTIONS.startingCapital - 44599,
    );
  });

  it('keeps platform allocation and weighted fees auditable', () => {
    const result = calculateModel();
    const platformShare = result.assumptions.platforms.reduce(
      (sum, platform) => sum + platform.salesSharePct,
      0,
    );
    expect(platformShare).toBe(100);
    expect(result.months[1].storeFees).toBe(17100);
  });

  it('responds monotonically to stronger launch sales', () => {
    const baseline = calculateModel();
    const strongerLaunch = calculateModel({ monthOneUnitSales: 6000 });
    expect(strongerLaunch.endingCash).toBeGreaterThan(baseline.endingCash);
    expect(strongerLaunch.lifetimeRevenue).toBeGreaterThan(
      baseline.lifetimeRevenue,
    );
  });

  it('includes DLC and cosmetics in post-launch revenue', () => {
    const result = calculateModel();
    expect(result.months[4].dlcRevenue).toBeGreaterThan(0);
    expect(result.months[4].cosmeticsRevenue).toBeGreaterThan(0);
    expect(result.months[4].totalRevenue).toBeGreaterThan(
      result.months[4].baseRevenue,
    );
  });

  it('keeps the initial two-year horizon and development spend throughout it', () => {
    const result = calculateModel();
    expect(result.months).toHaveLength(25);
    expect(
      result.months
        .slice(1)
        .every(
          (month) =>
            month.development === DEFAULT_ASSUMPTIONS.monthlyDevelopment,
        ),
    ).toBe(true);
  });

  it('builds payroll from team pay and active months', () => {
    const result = calculateModel({
      payrollTaxPct: 20,
      team: [
        {
          id: 'early-hire',
          name: 'Early hire',
          role: 'Developer',
          annualSalary: 12000,
          startMonth: 1,
          endMonth: 5,
        },
        {
          id: 'later-hire',
          name: 'Later hire',
          role: 'Artist',
          annualSalary: 24000,
          startMonth: 6,
          endMonth: null,
        },
      ],
    });
    expect(result.months[1].salaries).toBe(1200);
    expect(result.months[5].salaries).toBe(1200);
    expect(result.months[6].salaries).toBe(2400);
    expect(result.months[24].salaries).toBe(2400);
  });

  it('includes development-period team pay in investment needed', () => {
    const result = calculateModel({
      team: [
        {
          id: 'founder',
          name: 'Founder',
          role: 'Founder',
          annualSalary: 12000,
          startMonth: 0,
          endMonth: null,
        },
      ],
      payrollTaxPct: 20,
    });
    expect(result.assumptions.prelaunchSalaries).toBe(20400);
    expect(result.initialInvestment).toBe(47999);
  });

  it('updates net revenue when an expert storefront fee is changed', () => {
    const baseline = calculateModel();
    const lowerSteamFee = calculateModel({
      platforms: DEFAULT_ASSUMPTIONS.platforms.map((platform) =>
        platform.id === 'steam' ? { ...platform, feePct: 20 } : platform,
      ),
    });
    expect(lowerSteamFee.months[1].storeFees).toBeLessThan(
      baseline.months[1].storeFees,
    );
    expect(lowerSteamFee.endingCash).toBeGreaterThan(baseline.endingCash);
  });
});
