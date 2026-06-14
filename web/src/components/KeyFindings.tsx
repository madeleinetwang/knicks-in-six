"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sticker } from "./Sticker";
import { ProvenanceTag } from "./ProvenanceTag";
import { FINDINGS } from "@/data/model";

const cardBg: Record<string, string> = {
  royal: "bg-royal text-cream",
  orange: "bg-orange text-ink",
  ink: "bg-ink text-cream",
  mint: "bg-mint text-ink",
  pink: "bg-pink text-cream",
};

const stickerColorFor: Record<string, string> = {
  royal: "orange",
  orange: "royal",
  ink: "orange",
  mint: "ink",
  pink: "ink",
};

export function KeyFindings() {
  return (
    <section
      id="findings"
      className="grain relative bg-cream px-5 py-16 md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Sticker color="royal" rotate={-4}>
              Section 01
            </Sticker>
            <h2 className="mt-4 font-display text-6xl leading-[0.85] tracking-tight md:text-8xl">
              KEY
              <br />
              <span className="text-orange">FINDINGS</span>
            </h2>
          </div>
          <p className="max-w-sm font-body text-sm leading-relaxed text-ink/70">
            Five takeaways from the model, served like trading cards. Numbers
            count up as you scroll, then flip through the season at a glance.
          </p>
        </div>

        {/* asymmetric grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {FINDINGS.map((f, i) => {
            const span =
              i === 0
                ? "lg:col-span-3"
                : i === 1
                ? "lg:col-span-3"
                : "lg:col-span-2";
            return (
              <motion.article
                key={f.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ rotate: i % 2 ? 1.5 : -1.5, y: -6 }}
                className={`relative flex min-h-52 flex-col justify-between overflow-hidden border-[3px] border-ink p-6 shadow-hard ${
                  cardBg[f.color] ?? cardBg.ink
                } ${span}`}
              >
                <div className="halftone pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-20" />
                <div className="flex items-start justify-between gap-3">
                  <span className="font-grotesk text-xs font-extrabold uppercase tracking-[0.18em] opacity-80">
                    {f.label}
                  </span>
                  <Sticker
                    color={stickerColorFor[f.color] ?? "orange"}
                    rotate={8}
                    className="!text-[10px]"
                  >
                    {f.sticker}
                  </Sticker>
                </div>

                <div className="relative mt-4">
                  {"isText" in f && f.isText ? (
                    <div className="font-display text-5xl leading-none tracking-tight md:text-6xl">
                      {f.value as string}
                    </div>
                  ) : (
                    <AnimatedNumber
                      value={f.value as number}
                      decimals={"decimals" in f ? (f.decimals as number) : 0}
                      suffix={"suffix" in f ? (f.suffix as string) : ""}
                      className="font-display text-6xl leading-none tracking-tight md:text-7xl"
                    />
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="font-hand text-xl leading-tight opacity-90">
                    {f.note}
                  </p>
                  <ProvenanceTag src={f.src} />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
