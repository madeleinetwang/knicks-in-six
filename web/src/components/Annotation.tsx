"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Handwritten-style callout that fades/slides in on scroll. */
export function Annotation({
  children,
  className = "",
  rotate = -3,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10, rotate: rotate - 4 }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      style={{ rotate: `${rotate}deg` }}
      className={`font-hand text-2xl leading-none text-royal ${className}`}
    >
      {children}
    </motion.span>
  );
}
