"use client";

import { motion } from "framer-motion";
import { Sticker } from "./Sticker";
import { ProvenanceTag } from "./ProvenanceTag";
import { FEATURE_IMPORTANCE } from "@/data/model";

const barColors = [
  "bg-orange",
  "bg-royal",
  "bg-ink",
  "bg-mint",
  "bg-pink",
  "bg-court",
  "bg-royal-deep",
];

export function FeatureImportance() {
  const { data, src } = FEATURE_IMPORTANCE;
  return (
    <section
      id="features"
      className="grain relative bg-cream px-5 py-16 md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Sticker color="ink" rotate={-3}>
              Section 03
            </Sticker>
            <h2 className="mt-4 font-display text-6xl leading-[0.85] tracking-tight md:text-8xl">
              WHAT THE MODEL
              <br />
              <span className="text-orange">CARES ABOUT</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ProvenanceTag src={src} />
          </div>
        </div>

        <div className="border-[3px] border-ink bg-cream-dark/40 p-5 shadow-hard md:p-8">
          <div className="space-y-5">
            {data.map((f, i) => (
              <div key={f.feature} className="group">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-2xl tracking-tight text-ink/40">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-grotesk text-lg font-extrabold uppercase tracking-tight">
                      {f.metaphor}
                    </span>
                    <span className="font-hand text-xl text-royal">
                      ({f.feature})
                    </span>
                  </div>
                  <span className="font-display text-2xl text-ink">
                    {f.weight}
                  </span>
                </div>
                <div className="relative h-9 overflow-hidden border-[3px] border-ink bg-cream">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${f.weight}%` }}
                    viewport={{ once: true, margin: "-12%" }}
                    transition={{
                      duration: 1,
                      delay: i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`halftone h-full ${barColors[i % barColors.length]}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 font-body text-xs uppercase tracking-widest text-ink/50">
            Standardized logistic coefficients, scaled 0–100. Era-normalized
            win% difference carries the loudest signal: being the better team
            still matters most.
          </p>
        </div>
      </div>
    </section>
  );
}
