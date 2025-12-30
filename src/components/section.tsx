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
    <section className="space-y-8">
      <div className="flex items-end justify-between border-b border-[#E0E0E0] pb-4">
        <h2 className="text-2xl font-serif text-[#2D2A26] tracking-wide">
          {title}
        </h2>
        <Button
          onClick={handleChange}
          variant="outline"
          className="border-[#2D2A26] text-[#2D2A26] bg-transparent text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#2D2A26] hover:text-white transition-all duration-300 shadow-sm"
        >
          {isExpanded ? "表示を戻す" : "すべて表示"}
        </Button>
      </div>
      {isExpanded ? expandedContent : children}
    </section>
  );
}
