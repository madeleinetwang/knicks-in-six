"use client";

export function Basketball({
  size = 160,
  className = "",
  spin = true,
}: {
  size?: number;
  className?: string;
  spin?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`${spin ? "animate-spin-slow" : ""} ${className}`}
      role="img"
      aria-label="Spinning basketball"
    >
      <defs>
        <clipPath id="ballClip">
          <circle cx="100" cy="100" r="92" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="92" fill="var(--color-orange)" />
      <g
        clipPath="url(#ballClip)"
        stroke="var(--color-ink)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      >
        <circle cx="100" cy="100" r="92" strokeWidth="7" />
        <line x1="100" y1="8" x2="100" y2="192" />
        <line x1="8" y1="100" x2="192" y2="100" />
        <path d="M30 25 C 70 80, 70 120, 30 175" />
        <path d="M170 25 C 130 80, 130 120, 170 175" />
      </g>
      {/* highlight */}
      <ellipse cx="68" cy="62" rx="22" ry="14" fill="#ffffff" opacity="0.18" />
    </svg>
  );
}
