"use client";
import { ReactNode, useState } from "react";
import { Button } from "./ui/button";

interface SectionProps {
  children: ReactNode;
  title?: string;
  expandedContent?: ReactNode;
}

export default function Section({
  children,
  title,
  expandedContent,
}: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleChange = () => {
    setIsExpanded((prev) => !prev);
  };
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--noir-border)] pb-4">
        <h2 className="text-2xl font-display tracking-[0.08em] text-[var(--noir-ink)] md:text-3xl">
          {title}
        </h2>
        <Button
          onClick={handleChange}
          variant="outline"
          className="rounded-none border-black bg-white text-[10px] font-ui uppercase tracking-[0.35em] text-black transition-all duration-300 hover:bg-black hover:text-white"
        >
          {isExpanded ? "表示を戻す" : "すべて表示"}
        </Button>
      </div>
      {isExpanded ? expandedContent : children}
    </section>
  );
}
