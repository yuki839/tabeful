"use client";
import Image from "next/image";
import { CategoryType } from "./categories";
import { cn } from "@/lib/utils";

interface CategoryProps {
  category: CategoryType;
  onClick: (categoryType: string) => void;
  select: boolean;
}

export default function Category({ category, onClick, select }: CategoryProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(category.type)}
      aria-pressed={select}
      className={cn(
        "group flex min-w-[140px] items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black focus-visible:ring-0 active:translate-y-0.5 sm:min-w-[170px] sm:px-4 sm:py-3",
        select
          ? "border-black bg-black text-white shadow-[0_16px_35px_rgba(0,0,0,0.25)]"
          : "border-[var(--noir-border)] bg-white text-[var(--noir-ink)] hover:border-black hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
      )}
    >
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--noir-border)] bg-[var(--noir-surface)] transition duration-200 group-hover:scale-[1.05] sm:h-11 sm:w-11">
        <Image
          className="object-cover scale-75 transition-transform duration-300"
          src={category.imageUrl}
          fill
          alt={category.categoryName}
          sizes="(max-width: 1280px) 10vw, 97px"
        />
      </div>
      <p className="text-[10px] font-ui uppercase tracking-[0.28em] text-current leading-tight whitespace-normal sm:text-[11px] sm:tracking-[0.3em]">
        {category.categoryName}
      </p>
    </button>
  );
}
