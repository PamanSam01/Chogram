import type { SVGProps } from "react";

/** CHOGRAM brand mark — a Chog face whose mouth is a play triangle. */
export function MarkChog({ size = 22, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <rect
        className="brand-mark"
        x="1.25"
        y="1.25"
        width="21.5"
        height="21.5"
        rx="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="8.2" cy="9" r="1.45" fill="currentColor" />
      <circle cx="15.8" cy="9" r="1.45" fill="currentColor" />
      <path d="M8.6 13.6 L16.4 16.4 L8.6 19.2 Z" fill="#b6ff3c" />
    </svg>
  );
}

export function IconPlay({ size = 18, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M7 4.5 L19 12 L7 19.5 Z" fill="currentColor" />
    </svg>
  );
}

export function IconArrow({ size = 16, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d="M3 12 H20 M14 6 L20 12 L14 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function IconUpRight({ size = 14, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d="M7 17 L17 7 M9 7 H17 V15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function IconLock({ size = 13, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10.5 V7.6 a4 4 0 0 1 8 0 v2.9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconClose({ size = 17, ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        d="M6 6 L18 18 M18 6 L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Solid caret — direction carried by rotation, so one path covers up/down. */
export function IconCaret({
  size = 11,
  up = true,
  style,
  ...rest
}: { size?: number; up?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ transform: up ? "none" : "rotate(180deg)", ...style }}
      {...rest}
    >
      <path d="M6 2 L10.5 9 L1.5 9 Z" fill="currentColor" />
    </svg>
  );
}
