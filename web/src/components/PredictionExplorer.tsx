"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { BrowserFrame } from "./BrowserFrame";
import { Sticker } from "./Sticker";
import { ProvenanceTag } from "./ProvenanceTag";
import { WIN_PROB_SERIES, SERIES_OUTCOME } from "@/data/model";

const SCENARIOS = {
  base: { label: "Base Case", shift: 0, note: "model's central estimate" },
  hot: { label: "Shooting Upswing", shift: 9, note: "above-average shooting efficiency" },
  grind: { label: "Defensive Slowdown", shift: -7, note: "below-average pace and scoring" },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const prob = payload.find((p) => p.dataKey === "prob")?.value;
  return (
    <div className="border-[3px] border-ink bg-orange px-3 py-2 font-grotesk shadow-hard">
      <div className="text-xs font-extrabold uppercase tracking-widest text-ink/70">
        {label}
      </div>
      <div className="font-display text-3xl leading-none text-ink">
        {prob}% <span className="text-sm">win</span>
      </div>
    </div>
  );
}

export function PredictionExplorer() {
  const [scenario, setScenario] = useState<ScenarioKey>("base");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const shift = SCENARIOS[scenario].shift;
    return WIN_PROB_SERIES.data.map((d) => {
      const clamp = (n: number) => Math.max(2, Math.min(98, n));
      return {
        ...d,
        prob: clamp(d.prob + shift),
        low: clamp(d.low + shift),
        high: clamp(d.high + shift),
        band: [clamp(d.low + shift), clamp(d.high + shift)] as [number, number],
      };
    });
  }, [scenario]);

  return (
    <section
      id="predict"
      className="grain relative bg-royal px-5 py-16 text-cream md:px-10 md:py-24"
    >
      <div className="halftone pointer-events-none absolute left-0 bottom-0 h-56 w-56 text-orange/20" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Sticker color="orange" rotate={-4}>
              Section 02
            </Sticker>
            <h2 className="mt-4 font-display text-6xl leading-[0.85] tracking-tight md:text-8xl">
              ADJUST THE
              <br />
              <span className="text-orange">SCENARIO</span>
            </h2>
          </div>
          <p className="max-w-sm font-body text-sm leading-relaxed text-cream/75">
            The model&rsquo;s win probability for each remaining 2026 Finals game
            (NYK lead 3&ndash;1). Pick a scenario to see how the read shifts. Shaded
            band = confidence range.
          </p>
        </div>

        {/* scenario controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
            const active = key === scenario;
            return (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`border-[3px] border-ink px-5 py-2 font-grotesk text-sm font-extrabold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${
                  active
                    ? "bg-orange text-ink shadow-hard"
                    : "bg-cream/10 text-cream"
                }`}
              >
                {SCENARIOS[key].label}
              </button>
            );
          })}
          <span className="ml-1 font-hand text-xl text-cream/80">
            ↞ {SCENARIOS[scenario].note}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
          <BrowserFrame title={`win-probability-${SCENARIOS[scenario].label.toLowerCase().replace(/\s+/g, "-")}.chart`}>
            <div className="relative p-4 pt-6 md:p-6">
              <div className="absolute right-5 top-5 z-10">
                <ProvenanceTag src={WIN_PROB_SERIES.src} />
              </div>
              <div className="h-[320px] w-full md:h-[380px]">
                {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 12, bottom: 4, left: -18 }}
                  >
                    <defs>
                      <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0a3b8c" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#0a3b8c" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="game"
                      tick={{
                        fontFamily: "var(--font-grotesk)",
                        fontWeight: 800,
                        fill: "#14110f",
                        fontSize: 13,
                      }}
                      axisLine={{ stroke: "#14110f", strokeWidth: 3 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{
                        fontFamily: "var(--font-grotesk)",
                        fontWeight: 700,
                        fill: "#14110f",
                        fontSize: 12,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine
                      y={50}
                      stroke="#14110f"
                      strokeDasharray="6 5"
                      strokeWidth={2}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#f4631e", strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="band"
                      stroke="none"
                      fill="url(#bandFill)"
                      isAnimationActive
                    />
                    <Line
                      type="monotone"
                      dataKey="prob"
                      stroke="#f4631e"
                      strokeWidth={5}
                      dot={{
                        r: 6,
                        fill: "#f4631e",
                        stroke: "#14110f",
                        strokeWidth: 3,
                      }}
                      activeDot={{
                        r: 9,
                        fill: "#fff",
                        stroke: "#14110f",
                        strokeWidth: 3,
                      }}
                      isAnimationActive
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                )}
              </div>
              <div className="mt-1 flex items-center justify-between font-grotesk text-[11px] font-bold uppercase tracking-widest text-ink/55">
                <span>↑ knicks win probability</span>
                <span>remaining finals games →</span>
              </div>
            </div>
          </BrowserFrame>

          {/* side readout */}
          <div className="flex flex-col gap-5">
            <motion.div
              key={scenario}
              initial={{ scale: 0.92, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="relative border-[3px] border-ink bg-orange p-6 text-ink shadow-hard"
            >
              <span className="font-grotesk text-xs font-extrabold uppercase tracking-[0.18em]">
                Title odds (NYK up 3–1)
              </span>
              <div className="mt-2 font-display text-7xl leading-none">
                {SERIES_OUTCOME.pTitle}%
              </div>
            </motion.div>

            <div className="border-[3px] border-ink bg-cream p-6 text-ink shadow-hard">
              <p className="font-grotesk text-xs font-extrabold uppercase tracking-[0.18em] text-ink/60">
                Read the room
              </p>
              <ul className="mt-3 space-y-3 font-body text-sm leading-snug">
                <li className="flex gap-2">
                  <span className="font-display text-royal">G6</span>
                  back at MSG: the model&rsquo;s clear edge (67%).
                </li>
                <li className="flex gap-2">
                  <span className="font-display text-orange">G5/G7</span>
                  road games at SAS: home court flips it.
                </li>
                <li className="flex gap-2">
                  <span className="font-display text-ink">50%</span>
                  dashed line = coin-flip threshold.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
