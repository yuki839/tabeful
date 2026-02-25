"use client";

import { DesignPattern } from "./types";
import { PATTERN_INFO } from "./constants";
import { cn } from "@/lib/utils";

interface ViewSwitcherProps {
  value: DesignPattern;
  onChange: (value: DesignPattern) => void;
}

const MAIN_PATTERNS: DesignPattern[] = [
  DesignPattern.Modern,
  DesignPattern.Timeline,
  DesignPattern.MapSplit,
  DesignPattern.Magazine,
];

export default function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[var(--noir-border)] bg-white p-1 shadow-sm">
        {MAIN_PATTERNS.map((pattern) => (
          <button
            key={pattern}
            type="button"
            onClick={() => onChange(pattern)}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-ui uppercase tracking-[0.3em] transition",
              value === pattern
                ? "bg-black text-white"
                : "text-[var(--noir-muted)] hover:bg-[var(--noir-surface)]"
            )}
          >
            {PATTERN_INFO[pattern].name}
          </button>
        ))}
      </div>

    </div>
  );
}
