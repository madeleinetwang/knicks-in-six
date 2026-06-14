"use client";

import { motion } from "framer-motion";
import { Basketball } from "./Basketball";
import { Sticker } from "./Sticker";
import { Marquee } from "./Marquee";
import { MARQUEE_PHRASES, META } from "@/data/model";

export function Hero() {
  return (
    <section className="grain relative overflow-hidden bg-royal text-cream">
      {/* oversized cropped background word */}
      <div className="pointer-events-none absolute -right-10 top-24 select-none md:top-16">
        <span className="font-display text-[28vw] leading-none text-cream/5">
          KNICKS
        </span>
      </div>

      {/* halftone corner */}
      <div className="halftone pointer-events-none absolute right-0 top-0 h-64 w-64 text-orange/30" />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-10 md:pb-24 md:pt-12">
        {/* top bar */}
        <div className="flex items-center justify-between border-b-[3px] border-cream/30 pb-4">
          <span className="font-grotesk text-sm font-extrabold uppercase tracking-[0.2em]">
            knicks-in-six
          </span>
          <span className="hidden font-grotesk text-xs uppercase tracking-[0.2em] text-cream/70 sm:block">
            {META.season} · model report
          </span>
        </div>

        <div className="grid items-center gap-8 pt-10 md:grid-cols-[1.4fr_1fr] md:pt-16">
          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Sticker color="orange" rotate={-5}>
                Predictive Model
              </Sticker>
            </div>

            <h1 className="font-display text-[18vw] leading-[0.82] tracking-tight md:text-[10.5rem]">
              <motion.span
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                WHAT THE
              </motion.span>
              <motion.span
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="block text-orange"
              >
                MODEL
              </motion.span>
              <motion.span
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                THINKS
              </motion.span>
            </h1>

            <div className="mt-6 max-w-md">
              <p className="font-body text-base leading-relaxed text-cream/85 md:text-lg">
                A predictive model analyzing the {META.teamShort}&rsquo; performance —
                win probability, player impact, and where the season is headed.
                Half analytics report, half sports zine.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <motion.a
                href="#findings"
                whileHover={{ y: -3 }}
                whileTap={{ y: 1 }}
                className="inline-block border-[3px] border-ink bg-orange px-7 py-3 font-grotesk text-lg font-extrabold uppercase tracking-wide text-ink shadow-hard"
              >
                See the Findings →
              </motion.a>
              <a
                href="#predict"
                className="font-grotesk text-sm font-bold uppercase tracking-widest text-cream/80 underline-offset-4 hover:underline"
              >
                Spin the model
              </a>
            </div>
          </div>

          {/* basketball + annotation */}
          <div className="relative mx-auto flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Basketball size={300} className="drop-shadow-[8px_10px_0_rgba(0,0,0,0.35)]" />
            </motion.div>
            <div className="absolute -bottom-2 right-0">
              <Sticker color="ink" rotate={6}>
                +6.4 net rtg
              </Sticker>
            </div>
          </div>
        </div>
      </div>

      {/* bottom marquee */}
      <div className="border-y-[3px] border-cream/30 bg-ink py-2 text-cream">
        <Marquee items={MARQUEE_PHRASES} />
      </div>
    </section>
  );
}
