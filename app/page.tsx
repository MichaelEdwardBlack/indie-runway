'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  CloudCheck,
  CloudUpload,
  Gamepad2,
  Gauge,
  HelpCircle,
  Info,
  LayoutDashboard,
  Lightbulb,
  Lock,
  LockOpen,
  Palette,
  Play,
  Rocket,
  Settings2,
  Sparkles,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { MotionButton } from '@/components/motion-button';
import { Slider } from '@/components/ui/slider';
import {
  calculateModel,
  DEFAULT_ASSUMPTIONS,
  MODEL_CONVENTIONS,
  type ModelAssumptions,
  type ModelResult,
  type PlatformAssumption,
  type TeamMemberAssumption,
} from '@/lib/financial-model';

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const sliderValue = (value: number | readonly number[]) =>
  typeof value === 'number' ? value : value[0];
type ViewId =
  | 'overview'
  | 'timeline'
  | 'team'
  | 'game'
  | 'revenue'
  | 'settings';
type VisualTheme = 'runway' | 'going-indie';
type Drivers = {
  price: number;
  launchUnits: number;
  decline: number;
  setPrice: (n: number) => void;
  setLaunchUnits: (n: number) => void;
  setDecline: (n: number) => void;
};
type NumericSettingKey =
  | 'startingCapital'
  | 'incomeTaxPct'
  | 'marketingPct'
  | 'prelaunchDevelopment'
  | 'prelaunchMarketing'
  | 'prelaunchGA'
  | 'monthlyDevelopment'
  | 'monthlyGA'
  | 'payrollTaxPct';
type ScenarioSettings = Pick<
  ModelAssumptions,
  NumericSettingKey | 'platforms' | 'team'
>;

const numericSettingParams: Array<[NumericSettingKey, string]> = [
  ['startingCapital', 'capital'],
  ['incomeTaxPct', 'tax'],
  ['marketingPct', 'marketing'],
  ['prelaunchDevelopment', 'preDev'],
  ['prelaunchMarketing', 'preMarketing'],
  ['prelaunchGA', 'preGA'],
  ['monthlyDevelopment', 'monthlyDev'],
  ['monthlyGA', 'monthlyGA'],
  ['payrollTaxPct', 'payrollTax'],
];
const defaultScenarioSettings = (): ScenarioSettings => ({
  startingCapital: DEFAULT_ASSUMPTIONS.startingCapital,
  incomeTaxPct: DEFAULT_ASSUMPTIONS.incomeTaxPct,
  marketingPct: DEFAULT_ASSUMPTIONS.marketingPct,
  prelaunchDevelopment: DEFAULT_ASSUMPTIONS.prelaunchDevelopment,
  prelaunchMarketing: DEFAULT_ASSUMPTIONS.prelaunchMarketing,
  prelaunchGA: DEFAULT_ASSUMPTIONS.prelaunchGA,
  monthlyDevelopment: DEFAULT_ASSUMPTIONS.monthlyDevelopment,
  monthlyGA: DEFAULT_ASSUMPTIONS.monthlyGA,
  payrollTaxPct: DEFAULT_ASSUMPTIONS.payrollTaxPct,
  team: DEFAULT_ASSUMPTIONS.team.map((member) => ({ ...member })),
  platforms: DEFAULT_ASSUMPTIONS.platforms.map((platform) => ({ ...platform })),
});

const views = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'team', label: 'Team', icon: UsersRound },
  { id: 'game', label: 'Game plan', icon: Gamepad2 },
  { id: 'revenue', label: 'Revenue', icon: CircleDollarSign },
  { id: 'settings', label: 'Settings', icon: Settings2 },
] as const;
const viewCopy: Record<
  ViewId,
  { eyebrow: string; title: string; body: string }
> = {
  overview: {
    eyebrow: 'Illustrative baseline',
    title: 'Will your studio make the runway?',
    body: 'Tune the launch plan and see cash, break-even, and risk move together.',
  },
  timeline: {
    eyebrow: '24-month projection',
    title: 'See the whole journey at a glance.',
    body: 'Launch, content beats, hiring, and cash milestones in one clear timeline.',
  },
  team: {
    eyebrow: 'People plan',
    title: 'Build the team without losing the runway.',
    body: 'Understand when payroll changes and what the studio can support.',
  },
  game: {
    eyebrow: 'Production plan',
    title: 'Turn scope into a launchable plan.',
    body: 'Keep development, launch, and live support costs visible together.',
  },
  revenue: {
    eyebrow: 'Sales engine',
    title: 'Make every sale assumption visible.',
    body: 'Explore price, launch volume, decay, and storefront economics.',
  },
  settings: {
    eyebrow: 'Scenario settings',
    title: 'Make the model match your studio.',
    body: 'Edit the assumptions that drive cash, costs, and revenue. Every field explains what it changes.',
  },
};

export default function Home() {
  const [price, setPrice] = useState(20);
  const [launchUnits, setLaunchUnits] = useState(3000);
  const [decline, setDecline] = useState(15);
  const [settings, setSettings] = useState<ScenarioSettings>(
    defaultScenarioSettings,
  );
  const [view, setView] = useState<ViewId>('overview');
  const [helpOpen, setHelpOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [visualTheme, setVisualTheme] = useState<VisualTheme>('runway');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = window.localStorage.getItem('indie-runway-draft');
    let draft: {
      price?: number;
      launchUnits?: number;
      decline?: number;
      settings?: Partial<ScenarioSettings>;
    } = {};
    try {
      draft = raw ? JSON.parse(raw) : {};
    } catch {}
    const nextPrice = Number(params.get('price')) || draft.price || 20;
    const nextUnits = Number(params.get('units')) || draft.launchUnits || 3000;
    const nextDecline = Number(params.get('decline')) || draft.decline || 15;
    const savedTheme = window.localStorage.getItem('indie-runway-theme');
    const nextSettings = {
      ...defaultScenarioSettings(),
      ...draft.settings,
      team: draft.settings?.team ?? defaultScenarioSettings().team,
      platforms:
        draft.settings?.platforms ?? defaultScenarioSettings().platforms,
    };
    const sharedTeam = params.get('team');
    if (sharedTeam) {
      try {
        const parsed = JSON.parse(sharedTeam) as TeamMemberAssumption[];
        if (Array.isArray(parsed)) nextSettings.team = parsed;
      } catch {}
    }
    numericSettingParams.forEach(([key, param]) => {
      const value = Number(params.get(param));
      if (Number.isFinite(value) && params.has(param))
        nextSettings[key] = value;
    });
    nextSettings.platforms = nextSettings.platforms.map((platform) => {
      const share = Number(params.get(`${platform.id}Share`));
      const fee = Number(params.get(`${platform.id}Fee`));
      return {
        ...platform,
        salesSharePct:
          Number.isFinite(share) && params.has(`${platform.id}Share`)
            ? share
            : platform.salesSharePct,
        feePct:
          Number.isFinite(fee) && params.has(`${platform.id}Fee`)
            ? fee
            : platform.feePct,
      };
    });
    queueMicrotask(() => {
      setPrice(nextPrice);
      setLaunchUnits(nextUnits);
      setDecline(nextDecline);
      setSettings(nextSettings);
      if (savedTheme === 'going-indie' || savedTheme === 'runway') {
        setVisualTheme(savedTheme);
      }
    });
  }, []);
  const model = useMemo(
    () =>
      calculateModel({
        ...settings,
        gamePrice: price,
        monthOneUnitSales: launchUnits,
        monthlySalesDeclinePct: decline,
      }),
    [price, launchUnits, decline, settings],
  );
  const copy = viewCopy[view];
  function saveDraft() {
    window.localStorage.setItem(
      'indie-runway-draft',
      JSON.stringify({ price, launchUnits, decline, settings }),
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }
  async function shareScenario() {
    const url = new URL(window.location.href);
    url.searchParams.set('price', String(price));
    url.searchParams.set('units', String(launchUnits));
    url.searchParams.set('decline', String(decline));
    numericSettingParams.forEach(([key, param]) =>
      url.searchParams.set(param, String(settings[key])),
    );
    settings.platforms.forEach((platform) => {
      url.searchParams.set(
        `${platform.id}Share`,
        String(platform.salesSharePct),
      );
      url.searchParams.set(`${platform.id}Fee`, String(platform.feePct));
    });
    url.searchParams.set('team', JSON.stringify(settings.team));
    window.history.replaceState({}, '', url);
    await navigator.clipboard?.writeText(url.toString());
    setShared(true);
    window.setTimeout(() => setShared(false), 2200);
  }
  function toggleVisualTheme() {
    setVisualTheme((current) => {
      const next = current === 'runway' ? 'going-indie' : 'runway';
      window.localStorage.setItem('indie-runway-theme', next);
      return next;
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        className={`min-h-screen bg-background text-foreground theme-${visualTheme}`}
      >
        <header className="topbar">
          <div className="brand-lockup">
            <motion.span
              className="brand-mark"
              whileHover={{ rotate: -8, scale: 1.06 }}
            >
              <Rocket size={17} strokeWidth={2.4} />
            </motion.span>
            <div>
              <strong>Indie Runway</strong>
              <small>Studio financial planner</small>
            </div>
          </div>
          <div className="scenario-wrap">
            <MotionButton
              className="scenario-switcher"
              tone="soft"
              aria-expanded={scenarioOpen}
              onClick={() => setScenarioOpen((open) => !open)}
            >
              <span className="status-dot" />
              <span className="scenario-copy">
                <small>Working scenario</small>
                <strong>Cam&apos;s baseline</strong>
              </span>
              <motion.span animate={{ rotate: scenarioOpen ? 180 : 0 }}>
                <ChevronDown size={15} />
              </motion.span>
            </MotionButton>
            <AnimatePresence>
              {scenarioOpen && (
                <motion.div
                  className="scenario-popover"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                >
                  <small>ACTIVE SCENARIO</small>
                  <strong>Cam&apos;s baseline</strong>
                  <span>Autosaved locally on this device.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="header-actions">
            <MotionButton
              className="theme-toggle"
              tone="soft"
              aria-label={`Switch to ${visualTheme === 'runway' ? 'Going Indie' : 'current Runway'} colors`}
              aria-pressed={visualTheme === 'going-indie'}
              onClick={toggleVisualTheme}
            >
              <Palette className="theme-toggle-icon" />
              <span className="theme-toggle-track" aria-hidden="true">
                <motion.i
                  animate={{ x: visualTheme === 'going-indie' ? '100%' : '0%' }}
                  transition={{ type: 'spring', stiffness: 430, damping: 34 }}
                />
                <b className={visualTheme === 'runway' ? 'is-selected' : ''}>
                  Current
                </b>
                <b
                  className={visualTheme === 'going-indie' ? 'is-selected' : ''}
                >
                  Going Indie
                </b>
              </span>
            </MotionButton>
            <MotionButton
              className="icon-action"
              tone="soft"
              aria-label="Open help"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle />
            </MotionButton>
            <MotionButton
              className="save-action hidden sm:inline-flex"
              tone="soft"
              onClick={saveDraft}
            >
              {saved ? <CloudCheck /> : <CloudUpload />}
              <span>{saved ? 'Saved' : 'Save draft'}</span>
            </MotionButton>
            <MotionButton
              className="share-action"
              tone="primary"
              onClick={shareScenario}
            >
              {shared ? <Check /> : <Sparkles />}
              <span>{shared ? 'Link copied' : 'Share scenario'}</span>
              {!shared && <ArrowUpRight className="share-arrow" />}
            </MotionButton>
          </div>
        </header>
        <div className="workspace-shell">
          <aside className="side-rail">
            <nav aria-label="Planner sections">
              {views.map(({ id, label, icon: Icon }) => (
                <NavButton
                  key={id}
                  id={id}
                  label={label}
                  active={view === id}
                  onSelect={setView}
                >
                  <Icon />
                </NavButton>
              ))}
            </nav>
          </aside>
          <section className="planner">
            <div className="planner-heading">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="eyebrow">
                    <span>{copy.eyebrow}</span>
                    <b>Live model</b>
                  </div>
                  <h1>{copy.title}</h1>
                  <p>{copy.body}</p>
                </motion.div>
              </AnimatePresence>
              <div className="confidence-pill">
                <Gauge size={15} />
                <span>Model confidence</span>
                <strong>Good</strong>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                className="view-stage"
                key={view}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {view === 'overview' && (
                  <Overview
                    model={model}
                    price={price}
                    launchUnits={launchUnits}
                    decline={decline}
                    setPrice={setPrice}
                    setLaunchUnits={setLaunchUnits}
                    setDecline={setDecline}
                    openSettings={() => setView('settings')}
                  />
                )}
                {view === 'timeline' && <TimelineView model={model} />}
                {view === 'team' && (
                  <TeamView
                    model={model}
                    team={settings.team}
                    payrollTaxPct={settings.payrollTaxPct}
                    onAdd={() =>
                      setSettings((current) => ({
                        ...current,
                        team: [
                          ...current.team,
                          {
                            id:
                              globalThis.crypto?.randomUUID?.() ??
                              `team-${Date.now()}`,
                            name: 'New team member',
                            role: 'Role',
                            annualSalary: 0,
                            startMonth: 1,
                            endMonth: null,
                          },
                        ],
                      }))
                    }
                    onUpdate={(id, patch) =>
                      setSettings((current) => ({
                        ...current,
                        team: current.team.map((member) =>
                          member.id === id ? { ...member, ...patch } : member,
                        ),
                      }))
                    }
                    onRemove={(id) =>
                      setSettings((current) => ({
                        ...current,
                        team: current.team.filter((member) => member.id !== id),
                      }))
                    }
                  />
                )}
                {view === 'game' && <GameView model={model} />}
                {view === 'revenue' && (
                  <RevenueView
                    model={model}
                    price={price}
                    launchUnits={launchUnits}
                    decline={decline}
                    setPrice={setPrice}
                    setLaunchUnits={setLaunchUnits}
                    setDecline={setDecline}
                  />
                )}
                {view === 'settings' && (
                  <SettingsView
                    model={model}
                    settings={settings}
                    onChange={(key, value) =>
                      setSettings((current) => ({ ...current, [key]: value }))
                    }
                    onPlatformChange={(id, field, value) =>
                      setSettings((current) => ({
                        ...current,
                        platforms: current.platforms.map((platform) =>
                          platform.id === id
                            ? { ...platform, [field]: value }
                            : platform,
                        ),
                      }))
                    }
                    openTeam={() => setView('team')}
                    reset={() => {
                      setPrice(20);
                      setLaunchUnits(3000);
                      setDecline(15);
                      setSettings(defaultScenarioSettings());
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
        <AnimatePresence>
          {helpOpen && <HelpPanel close={() => setHelpOpen(false)} />}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}

function NavButton({
  id,
  label,
  active,
  onSelect,
  children,
}: {
  id: ViewId;
  label: string;
  active: boolean;
  onSelect: (id: ViewId) => void;
  children: React.ReactNode;
}) {
  return (
    <MotionButton
      className={`rail-item ${active ? 'active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect(id)}
    >
      {active && (
        <motion.span className="active-rail-glow" layoutId="active-rail" />
      )}
      {children}
      <span className="rail-label">{label}</span>
    </MotionButton>
  );
}
function Overview({
  model,
  openSettings,
  ...drivers
}: { model: ModelResult; openSettings: () => void } & Drivers) {
  const breakEven = model.breakEvenMonth;
  return (
    <>
      <div className="metric-grid">
        <Metric
          label="Capital at launch"
          value={money.format(model.assumptions.startingCapital)}
          note={`${compactMoney.format(model.initialInvestment)} pre-launch spend`}
          tone="neutral"
        />
        <Metric
          label="Break-even"
          value={breakEven ? `Month ${breakEven}` : 'Beyond plan'}
          note={`${money.format(model.lifetimeRevenue)} gross sales`}
          tone="green"
        />
        <Metric
          label="24-month cash"
          value={compactMoney.format(model.endingCash)}
          note={`${model.lifetimeUnits.toLocaleString()} lifetime units`}
          tone={model.endingCash > 65000 ? 'green' : 'amber'}
        />
        <Metric
          label="Peak cash"
          value={compactMoney.format(model.peakCash)}
          note="Expected scenario"
          tone="violet"
        />
      </div>
      <div className="model-grid">
        <DriversCard {...drivers} openSettings={openSettings} />
        <CashChart model={model} />
      </div>
    </>
  );
}
function DriversCard({
  price,
  launchUnits,
  decline,
  setPrice,
  setLaunchUnits,
  setDecline,
  openSettings,
}: Drivers & { openSettings?: () => void }) {
  return (
    <aside className="assumptions-card">
      <div className="card-heading">
        <div>
          <span className="icon-chip">
            <Settings2 />
          </span>
          <h2>Launch assumptions</h2>
        </div>
        <span>3 drivers</span>
      </div>
      <Control
        label="Game price"
        value={money.format(price)}
        hint="Base price before discounts"
      >
        <Slider
          value={[price]}
          onValueChange={(v) => setPrice(sliderValue(v))}
          min={5}
          max={60}
          step={1}
          aria-label="Game price"
        />
        <div className="range-labels">
          <span>$5</span>
          <span>$60</span>
        </div>
      </Control>
      <Control
        label="Month-one units"
        value={launchUnits.toLocaleString()}
        hint="Across all storefronts"
      >
        <Slider
          value={[launchUnits]}
          onValueChange={(v) => setLaunchUnits(sliderValue(v))}
          min={500}
          max={15000}
          step={100}
          aria-label="Month-one units"
        />
        <div className="range-labels">
          <span>500</span>
          <span>15,000</span>
        </div>
      </Control>
      <Control
        label="Monthly sales decline"
        value={`${decline}%`}
        hint="Compounds each month"
      >
        <Slider
          value={[decline]}
          onValueChange={(v) => setDecline(sliderValue(v))}
          min={3}
          max={35}
          step={1}
          aria-label="Monthly sales decline"
        />
        <div className="range-labels">
          <span>3%</span>
          <span>35%</span>
        </div>
      </Control>
      {openSettings && (
        <MotionButton
          className="advanced-link"
          tone="soft"
          onClick={openSettings}
        >
          <Sparkles />
          Open model assumptions<span>See all</span>
        </MotionButton>
      )}
    </aside>
  );
}
function CashChart({ model }: { model: ModelResult }) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const chart = useMemo(() => {
    const width = 820;
    const height = 310;
    const inset = { top: 18, right: 18, bottom: 28, left: 58 };
    const cashValues = model.months.map((month) => month.cash);
    const rawMin = Math.min(0, ...cashValues);
    const rawMax = Math.max(model.assumptions.startingCapital, ...cashValues);
    const spread = Math.max(rawMax - rawMin, 1000);
    const min = rawMin - spread * 0.08;
    const max = rawMax + spread * 0.08;
    const plotWidth = width - inset.left - inset.right;
    const plotHeight = height - inset.top - inset.bottom;
    const x = (index: number) =>
      inset.left + (index / Math.max(1, model.months.length - 1)) * plotWidth;
    const y = (value: number) =>
      inset.top + ((max - value) / Math.max(1, max - min)) * plotHeight;
    const points = model.months.map((month, index) => ({
      x: x(index),
      y: y(month.cash),
      month,
    }));
    const line = points.map((point) => `${point.x},${point.y}`).join(' ');
    const area = `${inset.left},${height - inset.bottom} ${line} ${width - inset.right},${height - inset.bottom}`;
    const ticks = Array.from({ length: 5 }, (_, index) => {
      const value = min + ((max - min) * index) / 4;
      return { value, y: y(value) };
    }).reverse();
    return { width, height, inset, points, line, area, ticks, y };
  }, [model]);
  const activePoint = hoveredMonth === null ? null : chart.points[hoveredMonth];

  return (
    <motion.article
      className="chart-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="chart-heading">
        <div>
          <span>Cash position</span>
          <h2>{compactMoney.format(model.endingCash)}</h2>
          <p>Projected balance after 24 months</p>
        </div>
        <div className="chart-legend">
          <span />
          <div>
            <small>Expected cash</small>
            <strong>
              +{compactMoney.format(model.assumptions.startingCapital)} starting
              capital
            </strong>
          </div>
        </div>
      </div>
      <div className="chart-viewport">
        <svg
          className="cash-chart"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const ratio = Math.min(
              1,
              Math.max(0, (event.clientX - bounds.left) / bounds.width),
            );
            setHoveredMonth(
              Math.round(ratio * Math.max(0, model.months.length - 1)),
            );
          }}
          onPointerLeave={() => setHoveredMonth(null)}
        >
          <title>Projected cash position over 24 months</title>
          <defs>
            <linearGradient id="nativeCashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-accent)"
                stopOpacity=".34"
              />
              <stop
                offset="100%"
                stopColor="var(--chart-accent)"
                stopOpacity=".01"
              />
            </linearGradient>
            <clipPath id="cashPlotClip">
              <rect
                x={chart.inset.left}
                y={chart.inset.top}
                width={chart.width - chart.inset.left - chart.inset.right}
                height={chart.height - chart.inset.top - chart.inset.bottom}
                rx="8"
              />
            </clipPath>
          </defs>
          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={chart.inset.left}
                x2={chart.width - chart.inset.right}
                y1={tick.y}
                y2={tick.y}
                className="plot-grid-line"
              />
              <text
                x={chart.inset.left - 10}
                y={tick.y + 3}
                textAnchor="end"
                className="plot-axis-label"
              >
                {compactMoney.format(tick.value)}
              </text>
            </g>
          ))}
          <line
            x1={chart.inset.left}
            x2={chart.width - chart.inset.right}
            y1={chart.y(model.assumptions.startingCapital)}
            y2={chart.y(model.assumptions.startingCapital)}
            className="plot-start-line"
          />
          <text
            x={chart.inset.left + 5}
            y={chart.y(model.assumptions.startingCapital) - 6}
            className="plot-start-label"
          >
            START
          </text>
          <line
            x1={chart.inset.left}
            x2={chart.width - chart.inset.right}
            y1={chart.y(0)}
            y2={chart.y(0)}
            className="plot-zero-line"
          />
          <g clipPath="url(#cashPlotClip)">
            <polygon points={chart.area} fill="url(#nativeCashGradient)" />
            <polyline points={chart.line} className="plot-cash-line" />
            {activePoint && (
              <>
                <line
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1={chart.inset.top}
                  y2={chart.height - chart.inset.bottom}
                  className="plot-hover-line"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="5"
                  className="plot-active-dot"
                />
              </>
            )}
          </g>
          {[0, 6, 12, 18, 24].map(
            (index) =>
              chart.points[index] && (
                <text
                  key={index}
                  x={chart.points[index].x}
                  y={chart.height - 7}
                  textAnchor={
                    index === 0 ? 'start' : index === 24 ? 'end' : 'middle'
                  }
                  className="plot-axis-label"
                >
                  {chart.points[index].month.month}
                </text>
              ),
          )}
        </svg>
        {activePoint && (
          <div
            className="plot-tooltip"
            style={{
              left: `${(activePoint.x / chart.width) * 100}%`,
              top: `${(activePoint.y / chart.height) * 100}%`,
            }}
          >
            <span>{activePoint.month.month}</span>
            <strong>{money.format(activePoint.month.cash)}</strong>
          </div>
        )}
      </div>
      <div className="runway-callout">
        <span className="callout-icon">
          <Play fill="currentColor" />
        </span>
        <div>
          <strong>
            {model.endingCash > 0
              ? 'This plan keeps the studio funded.'
              : 'This plan runs out of cash.'}
          </strong>
          <p>
            {model.endingCash > 0
              ? 'Your launch curve covers operating costs through the full forecast.'
              : 'Try more starting capital, higher launch sales, or a leaner team.'}
          </p>
        </div>
        <MotionButton
          tone="quiet"
          onClick={() =>
            document
              .querySelector('.chart-heading')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          Focus chart
        </MotionButton>
      </div>
    </motion.article>
  );
}

function TimelineView({ model }: { model: ModelResult }) {
  const events = [
    {
      month: 'Launch',
      title: 'Game launch',
      detail: `${model.assumptions.monthOneUnitSales.toLocaleString()} first-month units`,
    },
    { month: 'M4', title: 'First content beat', detail: 'DLC + cosmetic drop' },
    { month: 'M6', title: 'Team expands', detail: 'Monthly salaries step up' },
    { month: 'Y2 M4', title: 'Year-two DLC', detail: 'Long-tail revenue beat' },
    {
      month: 'Y2 M12',
      title: 'Forecast complete',
      detail: `${compactMoney.format(model.endingCash)} ending cash`,
    },
  ];
  return (
    <div className="surface-grid">
      <section className="surface-card span-two">
        <SurfaceHeading
          icon={<CalendarDays />}
          title="Studio runway"
          body="Five moments that materially change the plan."
        />
        <div className="timeline-track">
          {events.map((event, index) => (
            <motion.article
              key={event.month}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <i>{index + 1}</i>
              <span>{event.month}</span>
              <strong>{event.title}</strong>
              <small>{event.detail}</small>
            </motion.article>
          ))}
        </div>
      </section>
      <InsightCard
        icon={<TrendingUp />}
        label="Best month"
        value="Month 1"
        detail={`${money.format(model.months[1]?.totalRevenue ?? 0)} gross revenue`}
      />
      <InsightCard
        icon={<Target />}
        label="Break-even"
        value={
          model.breakEvenMonth ? `Month ${model.breakEvenMonth}` : 'Beyond plan'
        }
        detail="Cumulative profit crosses zero"
      />
    </div>
  );
}
function TeamView({
  model,
  team,
  payrollTaxPct,
  onAdd,
  onUpdate,
  onRemove,
}: {
  model: ModelResult;
  team: TeamMemberAssumption[];
  payrollTaxPct: number;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<TeamMemberAssumption>) => void;
  onRemove: (id: string) => void;
}) {
  const postLaunchMonths = model.months.slice(1);
  const peakPayroll = Math.max(
    0,
    ...postLaunchMonths.map((month) => month.salaries),
  );
  const totalPayroll = postLaunchMonths.reduce(
    (sum, month) => sum + month.salaries,
    0,
  );
  const monthOptions = Array.from(
    { length: DEFAULT_ASSUMPTIONS.forecastMonths + 1 },
    (_, index) => index,
  );
  return (
    <div className="team-workspace">
      <section className="team-summary-grid">
        <InsightCard
          icon={<UsersRound />}
          label="Month-one team"
          value={String(team.filter((member) => member.startMonth <= 1).length)}
          detail={`${team.length} people in the full plan`}
        />
        <InsightCard
          icon={<CircleDollarSign />}
          label="Peak monthly payroll"
          value={money.format(peakPayroll)}
          detail={`Includes ${payrollTaxPct}% payroll tax`}
        />
        <InsightCard
          icon={<TrendingUp />}
          label="24-month payroll"
          value={compactMoney.format(totalPayroll)}
          detail="Updates with every roster change"
        />
      </section>
      <section className="surface-card team-editor">
        <div className="surface-heading team-editor-heading">
          <span className="icon-chip">
            <UsersRound />
          </span>
          <div>
            <h2>Team plan</h2>
            <p>Edit who is on the team, what they earn, and when they start.</p>
          </div>
          <MotionButton tone="primary" onClick={onAdd}>
            <UserPlus /> Add team member
          </MotionButton>
        </div>
        <div className="team-roster">
          <AnimatePresence initial={false}>
            {team.map((member, index) => {
              const endMonth =
                member.endMonth ?? DEFAULT_ASSUMPTIONS.forecastMonths;
              const loadedMonthlyPay = Math.round(
                (member.annualSalary / 12) * (1 + payrollTaxPct / 100),
              );
              return (
                <motion.article
                  className="team-member-card"
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                >
                  <div className="team-member-topline">
                    <span className={`team-avatar team-avatar-${index % 3}`}>
                      {(member.name.trim()[0] || '?').toUpperCase()}
                    </span>
                    <div>
                      <strong>{member.name || 'Unnamed teammate'}</strong>
                      <small>
                        {money.format(loadedMonthlyPay)} monthly studio cost
                      </small>
                    </div>
                    <MotionButton
                      className="remove-team-member"
                      tone="soft"
                      aria-label={`Remove ${member.name || 'team member'}`}
                      onClick={() => onRemove(member.id)}
                    >
                      <Trash2 />
                      <span>Remove</span>
                    </MotionButton>
                  </div>
                  <div className="team-member-fields">
                    <label className="team-field team-field-wide">
                      <span>Name</span>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(event) =>
                          onUpdate(member.id, { name: event.target.value })
                        }
                      />
                    </label>
                    <label className="team-field team-field-wide">
                      <span>Role</span>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(event) =>
                          onUpdate(member.id, { role: event.target.value })
                        }
                      />
                    </label>
                    <div className="team-field">
                      <span>
                        Annual pay
                        <InfoTip text="The salary sheet stores annual pay. The model divides it by 12 and adds payroll tax for each active month." />
                      </span>
                      <NumberInput
                        value={member.annualSalary}
                        onChange={(annualSalary) =>
                          onUpdate(member.id, { annualSalary })
                        }
                        prefix="$"
                        step={500}
                      />
                    </div>
                    <label className="team-field">
                      <span>Starts</span>
                      <select
                        value={member.startMonth}
                        onChange={(event) => {
                          const startMonth = Number(event.target.value);
                          onUpdate(member.id, {
                            startMonth,
                            endMonth:
                              member.endMonth !== null &&
                              member.endMonth < startMonth
                                ? null
                                : member.endMonth,
                          });
                        }}
                      >
                        {monthOptions.map((month) => (
                          <option key={month} value={month}>
                            {month === 0
                              ? 'During development'
                              : `Month ${month}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="team-field">
                      <span>
                        Ends
                        <InfoTip text="Leave this set to Through forecast for an ongoing role." />
                      </span>
                      <select
                        value={member.endMonth ?? ''}
                        onChange={(event) =>
                          onUpdate(member.id, {
                            endMonth:
                              event.target.value === ''
                                ? null
                                : Number(event.target.value),
                          })
                        }
                      >
                        <option value="">Through forecast</option>
                        {monthOptions
                          .filter(
                            (month) => month >= Math.max(1, member.startMonth),
                          )
                          .map((month) => (
                            <option key={month} value={month}>
                              Month {month}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <div
                    className="team-timeline"
                    aria-label={`${member.name} active months`}
                  >
                    <span>Development</span>
                    <div>
                      <i
                        style={{
                          left: `${(Math.max(0, member.startMonth) / 24) * 100}%`,
                          width: `${Math.max(2, ((endMonth - Math.max(0, member.startMonth)) / 24) * 100)}%`,
                        }}
                      />
                    </div>
                    <span>M24</span>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
          {team.length === 0 && (
            <div className="empty-team">
              <span>
                <UsersRound />
              </span>
              <strong>Your roster is empty.</strong>
              <p>Add the first person to start modeling payroll.</p>
              <MotionButton tone="primary" onClick={onAdd}>
                <UserPlus /> Add team member
              </MotionButton>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function GameView({ model }: { model: ModelResult }) {
  const costs = [
    {
      label: 'Development to launch',
      value: model.assumptions.prelaunchDevelopment,
    },
    { label: 'Launch marketing', value: model.assumptions.prelaunchMarketing },
    { label: 'Pre-launch payroll', value: model.assumptions.prelaunchSalaries },
    { label: 'Admin to launch', value: model.assumptions.prelaunchGA },
  ];
  return (
    <div className="surface-grid">
      <section className="surface-card span-two">
        <SurfaceHeading
          icon={<Gamepad2 />}
          title="Cost to reach launch"
          body="The model keeps this separate from the post-launch runway."
        />
        <div className="cost-stack">
          {costs.map((cost) => (
            <div key={cost.label}>
              <span>{cost.label}</span>
              <strong>{money.format(cost.value)}</strong>
              <i
                style={{
                  width: `${Math.max(4, (cost.value / model.initialInvestment) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="total-strip">
          <span>Investment needed</span>
          <strong>{money.format(model.fundingNeeded)}</strong>
        </div>
      </section>
      <InsightCard
        icon={<Rocket />}
        label="Live development"
        value={money.format(model.assumptions.monthlyDevelopment)}
        detail="Continues every projected month"
      />
      <InsightCard
        icon={<Sparkles />}
        label="Content plan"
        value="5 DLC drops"
        detail="Plus 6 cosmetic releases"
      />
    </div>
  );
}
function RevenueView({ model, ...drivers }: { model: ModelResult } & Drivers) {
  return (
    <div className="revenue-grid">
      <DriversCard {...drivers} />
      <section className="surface-card revenue-surface">
        <SurfaceHeading
          icon={<CircleDollarSign />}
          title="Revenue mix"
          body="Lifetime gross revenue by product type."
        />
        <div className="revenue-hero">
          <span>24-month gross revenue</span>
          <strong>{compactMoney.format(model.lifetimeRevenue)}</strong>
          <small>{model.lifetimeUnits.toLocaleString()} base-game units</small>
        </div>
        {(['baseRevenue', 'dlcRevenue', 'cosmeticsRevenue'] as const).map(
          (key, index) => {
            const value = model.months.reduce(
              (sum, month) => sum + month[key],
              0,
            );
            return (
              <div className="mix-row" key={key}>
                <span>
                  <i className={`mix-dot mix-${index}`} />
                  {['Base game', 'DLC', 'Cosmetics'][index]}
                </span>
                <strong>{money.format(value)}</strong>
                <em>{Math.round((value / model.lifetimeRevenue) * 100)}%</em>
              </div>
            );
          },
        )}
        <div className="platform-row">
          {model.assumptions.platforms
            .filter((p) => p.salesSharePct > 0)
            .map((platform) => (
              <span key={platform.id}>
                <strong>{platform.salesSharePct}%</strong>
                {platform.label}
              </span>
            ))}
        </div>
      </section>
    </div>
  );
}
function SettingsView({
  model,
  settings,
  onChange,
  onPlatformChange,
  openTeam,
  reset,
}: {
  model: ModelResult;
  settings: ScenarioSettings;
  onChange: (key: NumericSettingKey, value: number) => void;
  onPlatformChange: (
    id: PlatformAssumption['id'],
    field: 'salesSharePct' | 'feePct',
    value: number,
  ) => void;
  openTeam: () => void;
  reset: () => void;
}) {
  const [unlockedFees, setUnlockedFees] = useState<PlatformAssumption['id'][]>(
    [],
  );
  const [feeUnlockTarget, setFeeUnlockTarget] = useState<
    PlatformAssumption['id'] | null
  >(null);
  const prelaunchTotal = model.initialInvestment;
  const platformTotal = settings.platforms.reduce(
    (total, platform) => total + platform.salesSharePct,
    0,
  );
  const weightedFee = settings.platforms.reduce(
    (total, platform) =>
      total + (platform.salesSharePct / 100) * platform.feePct,
    0,
  );
  const pendingPlatform = settings.platforms.find(
    (platform) => platform.id === feeUnlockTarget,
  );

  return (
    <div className="settings-workspace">
      <section className="surface-card settings-editor">
        <div className="surface-heading settings-heading">
          <span className="icon-chip">
            <Settings2 />
          </span>
          <div>
            <h2>Editable assumptions</h2>
            <p>Changes update every view and chart immediately.</p>
          </div>
          <MotionButton
            tone="soft"
            onClick={() => {
              setUnlockedFees([]);
              setFeeUnlockTarget(null);
              reset();
            }}
          >
            Reset baseline
          </MotionButton>
        </div>

        <div className="settings-summary">
          <span>
            <small>Investment needed</small>
            <strong>{money.format(prelaunchTotal)}</strong>
          </span>
          <span>
            <small>Starting capital</small>
            <strong>{money.format(settings.startingCapital)}</strong>
          </span>
          <span>
            <small>Weighted store fee</small>
            <strong>{weightedFee.toFixed(1)}%</strong>
          </span>
          <span>
            <small>Forecast</small>
            <strong>{DEFAULT_ASSUMPTIONS.forecastMonths} months</strong>
          </span>
        </div>

        <SettingGroup
          title="Cash and model rules"
          description="The top-level financial assumptions for this scenario."
        >
          <SettingField
            label="Starting capital"
            help="Cash available at launch. Pre-launch costs are deducted from this balance before post-launch sales begin."
            value={settings.startingCapital}
            onChange={(value) => onChange('startingCapital', value)}
            prefix="$"
            step={1000}
          />
          <SettingField
            label="Income tax"
            help={MODEL_CONVENTIONS.taxLosses}
            value={settings.incomeTaxPct}
            onChange={(value) => onChange('incomeTaxPct', value)}
            suffix="%"
            max={100}
          />
          <SettingField
            label="Marketing reinvestment"
            help={MODEL_CONVENTIONS.marketingTiming}
            value={settings.marketingPct}
            onChange={(value) => onChange('marketingPct', value)}
            suffix="%"
            max={100}
          />
          <div className="fixed-setting">
            <span>
              Forecast length
              <InfoTip text={MODEL_CONVENTIONS.projection} />
            </span>
            <strong>{DEFAULT_ASSUMPTIONS.forecastMonths} months</strong>
            <small>Fixed in this version</small>
          </div>
        </SettingGroup>

        <SettingGroup
          title="Cost to reach launch"
          description="These four inputs make up the investment-needed figure."
        >
          <SettingField
            label="Development"
            help="Production, software, contractors, and other development spending before launch."
            value={settings.prelaunchDevelopment}
            onChange={(value) => onChange('prelaunchDevelopment', value)}
            prefix="$"
            step={100}
          />
          <SettingField
            label="Marketing"
            help="Pre-launch campaigns, trailers, events, creators, and other launch marketing."
            value={settings.prelaunchMarketing}
            onChange={(value) => onChange('prelaunchMarketing', value)}
            prefix="$"
            step={100}
          />
          <div className="fixed-setting team-setting-link">
            <span>
              Salaries
              <InfoTip text="Calculated from team members who start during development, across the full 17-month development period." />
            </span>
            <strong>{money.format(model.assumptions.prelaunchSalaries)}</strong>
            <MotionButton tone="soft" onClick={openTeam}>
              Edit team <ArrowUpRight />
            </MotionButton>
          </div>
          <SettingField
            label="General and admin"
            help="Legal, accounting, insurance, and administrative costs before launch. This is included in the total."
            value={settings.prelaunchGA}
            onChange={(value) => onChange('prelaunchGA', value)}
            prefix="$"
            step={10}
          />
        </SettingGroup>

        <SettingGroup
          title="Monthly studio costs"
          description="Ongoing costs applied during the 24-month projection."
        >
          <SettingField
            label="Development"
            help={MODEL_CONVENTIONS.development}
            value={settings.monthlyDevelopment}
            onChange={(value) => onChange('monthlyDevelopment', value)}
            prefix="$"
            step={50}
          />
          <SettingField
            label="General and admin"
            help="Recurring monthly legal, accounting, insurance, software, and administrative spending."
            value={settings.monthlyGA}
            onChange={(value) => onChange('monthlyGA', value)}
            prefix="$"
            step={10}
          />
          <SettingField
            label="Payroll tax"
            help="Taxes and employer-side payroll costs added to monthly salaries. Cam's sheet uses 20%."
            value={settings.payrollTaxPct}
            onChange={(value) => onChange('payrollTaxPct', value)}
            suffix="%"
            max={100}
          />
          <div className="fixed-setting team-setting-link">
            <span>
              Team payroll
              <InfoTip text={MODEL_CONVENTIONS.payroll} />
            </span>
            <strong>{settings.team.length} team members</strong>
            <MotionButton tone="soft" onClick={openTeam}>
              Edit team <ArrowUpRight />
            </MotionButton>
          </div>
        </SettingGroup>

        <div className="setting-group storefront-settings">
          <div className="setting-group-heading">
            <div>
              <h3>Storefront mix</h3>
              <p>
                Sales mix is yours to edit. Store fees are protected expert
                assumptions from the spreadsheet.
              </p>
            </div>
            <span
              className={platformTotal === 100 ? 'mix-valid' : 'mix-warning'}
            >
              {platformTotal}% allocated
            </span>
          </div>
          <div className="storefront-head">
            <span>Store</span>
            <span>
              Your sales mix{' '}
              <InfoTip text="Sales share should add up to 100% across every storefront." />
            </span>
            <span>
              Store fee · locked{' '}
              <InfoTip text="Cam's spreadsheet marks every storefront Sales Cost as 'Dont touch.' Unlock only if you are modeling a confirmed different platform agreement." />
            </span>
          </div>
          {settings.platforms.map((platform) => (
            <div className="storefront-setting" key={platform.id}>
              <strong>{platform.label}</strong>
              <NumberInput
                value={platform.salesSharePct}
                onChange={(value) =>
                  onPlatformChange(platform.id, 'salesSharePct', value)
                }
                suffix="%"
                max={100}
              />
              <span className="locked-number-wrap">
                <NumberInput
                  value={platform.feePct}
                  onChange={(value) =>
                    onPlatformChange(platform.id, 'feePct', value)
                  }
                  suffix="%"
                  max={100}
                  disabled={!unlockedFees.includes(platform.id)}
                />
                <MotionButton
                  className={`lock-control ${unlockedFees.includes(platform.id) ? 'is-unlocked' : ''}`}
                  tone="soft"
                  aria-label={
                    unlockedFees.includes(platform.id)
                      ? `Lock ${platform.label} store fee`
                      : `Review warning before unlocking ${platform.label} store fee`
                  }
                  onClick={() => {
                    if (unlockedFees.includes(platform.id)) {
                      setUnlockedFees((current) =>
                        current.filter((id) => id !== platform.id),
                      );
                    } else {
                      setFeeUnlockTarget(platform.id);
                    }
                  }}
                >
                  {unlockedFees.includes(platform.id) ? <LockOpen /> : <Lock />}
                </MotionButton>
              </span>
              <AnimatePresence>
                {feeUnlockTarget === platform.id && (
                  <motion.div
                    className="unlock-warning"
                    initial={{ opacity: 0, height: 0, y: -5 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                  >
                    <span className="unlock-warning-icon">
                      <ShieldAlert />
                    </span>
                    <div>
                      <strong>Advanced assumption</strong>
                      <p>
                        The source spreadsheet marks {pendingPlatform?.label}{' '}
                        Sales Cost as “Dont touch.” Changing this assumes a
                        different storefront agreement and changes net revenue
                        in every projected month.
                      </p>
                    </div>
                    <div className="unlock-actions">
                      <MotionButton
                        tone="soft"
                        onClick={() => setFeeUnlockTarget(null)}
                      >
                        Keep locked
                      </MotionButton>
                      <MotionButton
                        tone="primary"
                        onClick={() => {
                          setUnlockedFees((current) => [
                            ...current,
                            platform.id,
                          ]);
                          setFeeUnlockTarget(null);
                        }}
                      >
                        I understand — unlock
                      </MotionButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <details className="surface-card model-reference">
        <summary>
          <span className="icon-chip">
            <Lightbulb />
          </span>
          <span>
            <strong>How the model works</strong>
            <small>The reference notes that used to fill this page.</small>
          </span>
          <ChevronDown />
        </summary>
        <div className="rules-grid">
          {Object.entries(MODEL_CONVENTIONS).map(([key, value], index) => (
            <article key={key}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{key.replace(/([A-Z])/g, ' $1')}</strong>
                <p>{value}</p>
              </div>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}

function SettingGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-group">
      <div className="setting-group-heading">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      <div className="setting-grid">{children}</div>
    </div>
  );
}

function SettingField({
  label,
  help,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  max,
  disabled = false,
}: {
  label: string;
  help: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <label className="setting-field">
      <span className="setting-label">
        {label}
        <InfoTip text={help} />
      </span>
      <NumberInput
        value={value}
        onChange={onChange}
        prefix={prefix}
        suffix={suffix}
        step={step}
        max={max}
        disabled={disabled}
      />
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  max,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <span className="number-input">
      {prefix && <span>{prefix}</span>}
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next))
            onChange(
              Math.max(0, max === undefined ? next : Math.min(max, next)),
            );
        }}
      />
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <motion.button
      type="button"
      className="info-tip"
      aria-label={text}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
    >
      <Info />
      <span role="tooltip">{text}</span>
    </motion.button>
  );
}

function SurfaceHeading({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="surface-heading">
      <span className="icon-chip">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </div>
  );
}
function InsightCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <motion.article className="insight-card" whileHover={{ y: -4 }}>
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <p>{detail}</p>
    </motion.article>
  );
}
function HelpPanel({ close }: { close: () => void }) {
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={close}
    >
      <motion.aside
        className="help-panel"
        initial={{ opacity: 0, x: 30, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="help-top">
          <span className="brand-mark">
            <Rocket />
          </span>
          <MotionButton
            className="icon-action"
            tone="soft"
            aria-label="Close help"
            onClick={close}
          >
            <X />
          </MotionButton>
        </div>
        <div>
          <span className="eyebrow">QUICK START</span>
          <h2>Make the runway yours.</h2>
          <p>
            Start with the three launch drivers. Then use the sidebar to see how
            the same scenario affects timing, team, production, and revenue.
          </p>
        </div>
        <ol>
          <li>
            <span>1</span>
            <div>
              <strong>Tune your launch</strong>
              <p>Adjust price, units, and sales decline.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Check the runway</strong>
              <p>Look for positive cash and a reachable break-even month.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Save or share</strong>
              <p>Save locally, or copy a link with the scenario included.</p>
            </div>
          </li>
        </ol>
      </motion.aside>
    </motion.div>
  );
}
function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: 'neutral' | 'green' | 'amber' | 'violet';
}) {
  return (
    <motion.article className="metric-card" layout>
      <div className={`metric-signal ${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </motion.article>
  );
}
function Control({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="control">
      <div className="control-label">
        <div>
          <strong>{label}</strong>
          <small>{hint}</small>
        </div>
        <output>{value}</output>
      </div>
      {children}
    </div>
  );
}
