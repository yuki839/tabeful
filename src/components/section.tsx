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
    <section>
      <div className="flex items-center justify-between py-3">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button onClick={handleChange}>
          {isExpanded ? "表示を戻す" : "すべて表示"}
        </Button>
      </div>
      {isExpanded ? expandedContent : children}
    </section>
  );
}
