import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className = "", size = 32, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#00695c] via-[#0d9488] to-[#14b8a6] p-1.5 shadow-md shadow-teal-900/15 ring-1 ring-teal-500/30"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full text-white"
        >
          {/* Globe grid */}
          <circle cx="12" cy="12" r="9" className="stroke-white/60" strokeWidth="1.5" />
          <path
            d="M3.6 9h16.8M3.6 15h16.8"
            className="stroke-white/40"
            strokeWidth="1.2"
          />
          <path
            d="M11.5 3a15.3 15.3 0 0 0 0 18M12.5 3a15.3 15.3 0 0 1 0 18"
            className="stroke-white/40"
            strokeWidth="1.2"
          />
          {/* Vibrant Location Pin */}
          <path
            d="M12 21.7C17.3 17 20 13 20 9.5a8 8 0 1 0-16 0c0 3.5 2.7 7.5 8 12.2z"
            className="fill-teal-300 stroke-teal-950/20 drop-shadow-sm"
            strokeWidth="1"
          />
          <circle cx="12" cy="9.5" r="2.8" className="fill-teal-950" />
          <circle cx="12" cy="9.5" r="1.2" className="fill-white" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-lg font-bold tracking-tight text-ink-950">
              Global Address
            </span>
            <span className="font-display text-lg font-bold text-teal-700">
              Platform
            </span>
            <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-800">
              Live
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wide text-ink-400">
            Enterprise Intelligence & Geocoding
          </span>
        </div>
      )}
    </div>
  );
}
