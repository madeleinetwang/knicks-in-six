"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const palette: Record<string, string> = {
  royal: "bg-royal text-cream",
  orange: "bg-orange text-ink",
  ink: "bg-ink text-cream",
  mint: "bg-mint text-ink",
  pink: "bg-pink text-cream",
  cream: "bg-cream text-ink",
};

export function Sticker({
  children,
  color = "orange",
  rotate = -4,
  className = "",
  pop = true,
}: {
  children: ReactNode;
  color?: keyof typeof palette | string;
  rotate?: number;
  className?: string;
  pop?: boolean;
}) {
  const cls = palette[color] ?? palette.orange;
  return (
    <motion.span
      initial={pop ? { scale: 0, rotate: rotate - 12 } : false}
      whileInView={pop ? { scale: 1, rotate } : undefined}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ type: "spring", stiffness: 380, damping: 14 }}
      style={{ rotate: `${rotate}deg` }}
      className={`inline-block border-[3px] border-ink px-3 py-1 font-grotesk text-xs font-extrabold uppercase tracking-wide shadow-hard ${cls} ${className}`}
    >
      {children}
    </motion.span>
  );
}
