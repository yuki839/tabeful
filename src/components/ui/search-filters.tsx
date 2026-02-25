"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const RATING_FILTERS = [
  { value: "", label: "\u6307\u5b9a\u306a\u3057" },
  { value: "4.5", label: "\u26054.5+" },
  { value: "4.0", label: "\u26054.0+" },
  { value: "3.5", label: "\u26053.5+" },
];

interface SearchFiltersProps {
  className?: string;
}

export default function SearchFilters({ className }: SearchFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentRating = searchParams.get("rating") ?? "";

  const updateRating = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) {
      params.delete("rating");
    } else {
      params.set("rating", value);
    }
    const query = params.toString();
    router.replace(query ? `/search?${query}` : "/search");
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <span className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
        {"\u8a55\u4fa1"}
      </span>
      <div className="flex flex-wrap gap-2">
        {RATING_FILTERS.map((filter) => {
          const isActive = currentRating === filter.value;
          return (
            <button
              key={filter.value || "all"}
              type="button"
              onClick={() => updateRating(filter.value)}
              className={
                isActive
                  ? "border border-black bg-black px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-white"
                  : "border border-[var(--noir-border)] px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black"
              }
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
