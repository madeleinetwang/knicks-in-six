"use client";

import { motion } from "framer-motion";
import { Sticker } from "./Sticker";
import { SCOUTING_NOTES } from "@/data/model";

const panels = [
  { ...SCOUTING_NOTES.inputs, tag: "INPUTS", color: "royal", check: "✓" },
  { ...SCOUTING_NOTES.how, tag: "METHOD", color: "orange", check: "→" },
  { ...SCOUTING_NOTES.good, tag: "STRENGTHS", color: "mint", check: "✓" },
  { ...SCOUTING_NOTES.wrong, tag: "BLIND SPOTS", color: "pink", check: "✗" },
];

export function ScoutingNotes() {
  return (
    <section
      id="model"
      className="grain relative bg-ink px-5 py-16 text-cream md:px-10 md:py-24"
    >
      <div className="halftone pointer-events-none absolute right-0 top-10 h-48 w-48 text-cream/10" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Sticker color="mint" rotate={-4}>
              Section 04
            </Sticker>
            <h2 className="mt-4 font-display text-6xl leading-[0.85] tracking-tight md:text-8xl">
              SCOUTING
              <br />
              <span className="text-orange">NOTES</span>
            </h2>
          </div>
          <p className="max-w-sm font-body text-sm leading-relaxed text-cream/70">
            The model, in plain English — straight off the coach&rsquo;s
            clipboard. No academic jargon, just what it does and where it
            slips.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {panels.map((p, i) => (
            <motion.div
              key={p.tag}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative border-[3px] border-cream/80 bg-cream p-6 text-ink shadow-hard-lg"
            >
              {/* clipboard clip */}
              <div className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rounded-md border-[3px] border-ink bg-court" />
              <div className="mb-4 flex items-center justify-between">
                <Sticker color={p.color} rotate={-3}>
                  {p.tag}
                </Sticker>
              </div>
              <h3 className="font-grotesk text-xl font-extrabold uppercase tracking-tight">
                {p.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {p.items.map((item, j) => (
                  <li key={j} className="flex gap-3 font-body text-sm leading-snug">
                    <span className="mt-0.5 font-display text-lg text-orange">
                      {p.check}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
