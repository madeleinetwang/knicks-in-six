"use client";

import { motion } from "framer-motion";
import { Basketball } from "./Basketball";
import { Sticker } from "./Sticker";
import { Marquee } from "./Marquee";
import { TAKEAWAY, MARQUEE_PHRASES, META } from "@/data/model";

export function Takeaway() {
  return (
    <section className="grain relative overflow-hidden bg-orange text-ink">
      <div className="halftone pointer-events-none absolute inset-0 text-ink/10" />
      <div className="border-b-[3px] border-ink bg-ink py-2 text-cream">
        <Marquee items={MARQUEE_PHRASES} separator="●" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <div className="grid items-center gap-10 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Sticker color="royal" rotate={-5}>
              The Verdict
            </Sticker>
            <h2 className="mt-5 font-display text-6xl leading-[0.85] tracking-tight md:text-8xl">
              {TAKEAWAY.headline}
            </h2>
            <p className="mt-6 max-w-lg font-body text-lg leading-relaxed text-ink/85">
              {TAKEAWAY.body}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {TAKEAWAY.links.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 1 }}
                  className={`border-[3px] border-ink px-6 py-3 font-grotesk text-sm font-extrabold uppercase tracking-wide shadow-hard ${
                    i === 0 ? "bg-ink text-cream" : "bg-cream text-ink"
                  }`}
                >
                  {link.label} →
                </motion.a>
              ))}
            </div>
          </div>

          <div className="relative mx-auto">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Basketball size={260} />
            </motion.div>
            <div className="absolute -left-4 top-0">
              <Sticker color="cream" rotate={-10}>
                knicks in six?
              </Sticker>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative border-t-[3px] border-ink bg-royal px-5 py-8 text-cream md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <span className="font-display text-2xl tracking-tight">
            KNICKS MODEL REPORT
          </span>
          <span className="font-grotesk text-xs uppercase tracking-[0.18em] text-cream/70">
            {META.season} · {META.dataAsOf}
          </span>
          <span className="font-body text-xs text-cream/60">
            Not affiliated with the NBA or any team. Colors &amp; imagery are
            inspired placeholders.
          </span>
        </div>
      </footer>
    </section>
  );
}
