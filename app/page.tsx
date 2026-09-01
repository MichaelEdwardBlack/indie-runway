'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ArrowUpRight, CalendarDays, ChevronDown, CircleDollarSign, Gamepad2, Gauge, HelpCircle, LayoutDashboard, PanelLeftClose, Play, Rocket, Settings2, Sparkles, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Slider } from '@/components/ui/slider';
import { calculateModel } from '@/lib/financial-model';

const chartConfig = { cash: { label: 'Cash position', color: '#b9ff66' } } satisfies ChartConfig;
const compactMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact' });
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const sliderValue = (value: number | readonly number[]) => typeof value === 'number' ? value : value[0];

export default function Home() {
  const [price, setPrice] = useState(20);
  const [launchUnits, setLaunchUnits] = useState(3000);
  const [decline, setDecline] = useState(15);
  const model = useMemo(() => calculateModel({ gamePrice: price, monthOneUnitSales: launchUnits, monthlySalesDeclinePct: decline }), [price, launchUnits, decline]);
  const projection = model.months;
  const { peakCash, endingCash, lifetimeUnits, lifetimeRevenue } = model;
  const breakEvenIndex = model.breakEvenMonth ?? -1;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark"><Rocket size={17} strokeWidth={2.4} /></span><div><strong>Indie Runway</strong><small>Studio financial planner</small></div></div>
        <div className="scenario-switcher"><span className="status-dot" /><div><small>Working scenario</small><strong>Cam&apos;s baseline</strong></div><ChevronDown size={15} /></div>
        <div className="header-actions"><Button variant="ghost" size="icon" aria-label="Help"><HelpCircle /></Button><Button variant="outline" className="hidden sm:inline-flex">Save draft</Button><Button className="share-button">Share scenario <ArrowUpRight /></Button></div>
      </header>

      <div className="workspace-shell">
        <aside className="side-rail">
          <Button variant="ghost" size="icon" aria-label="Collapse navigation" className="rail-collapse"><PanelLeftClose /></Button>
          <nav aria-label="Planner sections">
            <button className="rail-item active"><LayoutDashboard /><span>Overview</span></button>
            <button className="rail-item"><CalendarDays /><span>Timeline</span></button>
            <button className="rail-item"><UsersRound /><span>Team</span></button>
            <button className="rail-item"><Gamepad2 /><span>Game plan</span></button>
            <button className="rail-item"><CircleDollarSign /><span>Revenue</span></button>
          </nav>
          <button className="rail-item rail-bottom"><Settings2 /><span>Model settings</span></button>
        </aside>

        <section className="planner">
          <div className="planner-heading">
            <div><div className="eyebrow"><span>Illustrative baseline</span><b>Live model</b></div><h1>Will your studio make the runway?</h1><p>Tune the launch plan and see cash, break-even, and risk move together.</p></div>
            <div className="confidence-pill"><Gauge size={15} /><span>Model confidence</span><strong>Good</strong></div>
          </div>

          <div className="metric-grid">
            <Metric label="Capital at launch" value="$65,000" note="$44.5k pre-launch spend" tone="neutral" />
            <Metric label="Break-even" value={breakEvenIndex > 0 ? `Month ${breakEvenIndex}` : 'Beyond plan'} note={`${money.format(lifetimeRevenue)} gross sales`} tone="green" />
            <Metric label="24-month cash" value={compactMoney.format(endingCash)} note={`${lifetimeUnits.toLocaleString()} lifetime units`} tone={endingCash > 65000 ? 'green' : 'amber'} />
            <Metric label="Peak cash" value={compactMoney.format(peakCash)} note="Expected scenario" tone="violet" />
          </div>

          <div className="model-grid">
            <aside className="assumptions-card">
              <div className="card-heading"><div><span className="icon-chip"><Settings2 /></span><h2>Launch assumptions</h2></div><span>3 drivers</span></div>
              <Control label="Game price" value={money.format(price)} hint="Base price before discounts"><Slider value={[price]} onValueChange={(value) => setPrice(sliderValue(value))} min={5} max={60} step={1} aria-label="Game price" /><div className="range-labels"><span>$5</span><span>$60</span></div></Control>
              <Control label="Month-one units" value={launchUnits.toLocaleString()} hint="Across all storefronts"><Slider value={[launchUnits]} onValueChange={(value) => setLaunchUnits(sliderValue(value))} min={500} max={15000} step={100} aria-label="Month-one units" /><div className="range-labels"><span>500</span><span>15,000</span></div></Control>
              <Control label="Monthly sales decline" value={`${decline}%`} hint="Compounds each month"><Slider value={[decline]} onValueChange={(value) => setDecline(sliderValue(value))} min={3} max={35} step={1} aria-label="Monthly sales decline" /><div className="range-labels"><span>3%</span><span>35%</span></div></Control>
              <button className="advanced-link"><Sparkles size={15} />Open advanced assumptions<span>18 more</span></button>
            </aside>

            <motion.article className="chart-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
              <div className="chart-heading"><div><span>Cash position</span><h2>{compactMoney.format(endingCash)}</h2><p>Projected balance after 24 months</p></div><div className="chart-legend"><span /><div><small>Expected cash</small><strong>+$65k starting capital</strong></div></div></div>
              <ChartContainer config={chartConfig} className="cash-chart" initialDimension={{ width: 760, height: 340 }}>
                <AreaChart data={projection} margin={{ left: 4, right: 12, top: 18, bottom: 0 }}>
                  <defs><linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cash)" stopOpacity={0.38} /><stop offset="100%" stopColor="var(--color-cash)" stopOpacity={0.01} /></linearGradient></defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 7" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} interval={5} tickMargin={12} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => compactMoney.format(value)} width={54} />
                  <ReferenceLine y={65000} stroke="#879c91" strokeDasharray="3 5" label={{ value: 'START', fill: '#879c91', fontSize: 9, position: 'insideTopLeft' }} />
                  <ReferenceLine y={0} stroke="#ff8a67" strokeDasharray="4 5" />
                  <ChartTooltip cursor={{ stroke: '#d8f5c5' }} content={<ChartTooltipContent indicator="line" formatter={(value) => <><span className="text-muted-foreground">Cash balance</span><span className="ml-auto font-mono font-semibold">{money.format(Number(value))}</span></>} />} />
                  <Area type="monotone" dataKey="cash" stroke="var(--color-cash)" strokeWidth={3} fill="url(#cashGradient)" animationDuration={500} />
                </AreaChart>
              </ChartContainer>
              <div className="runway-callout"><span className="callout-icon"><Play fill="currentColor" /></span><div><strong>{endingCash > 0 ? 'This plan keeps the studio funded.' : 'This plan runs out of cash.'}</strong><p>{endingCash > 0 ? 'Your launch curve covers operating costs through the full forecast.' : 'Try more starting capital, higher launch sales, or a leaner team.'}</p></div><Button variant="ghost">Explain this result</Button></div>
            </motion.article>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: 'neutral' | 'green' | 'amber' | 'violet' }) {
  return <motion.article className="metric-card" layout transition={{ type: 'spring', stiffness: 220, damping: 24 }}><div className={`metric-signal ${tone}`} /><span>{label}</span><motion.strong key={value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>{value}</motion.strong><small>{note}</small></motion.article>;
}

function Control({ label, value, hint, children }: { label: string; value: string; hint: string; children: React.ReactNode }) {
  return <div className="control"><div className="control-label"><div><strong>{label}</strong><small>{hint}</small></div><motion.output key={value} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}>{value}</motion.output></div>{children}</div>;
}
