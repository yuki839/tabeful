"use client";

import { BookOpen, Columns, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShioriView } from "./types";

const VIEW_OPTIONS: Array<{
  id: ShioriView;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "kanban", label: "カンバン", icon: Columns },
  { id: "magazine", label: "マガジン", icon: BookOpen },
];

interface ViewToggleProps {
  value: ShioriView;
  onChange: (value: ShioriView) => void;
  className?: string;
}

export default function ViewToggle({
  value,
  onChange,
  className,
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm",
        className
      )}
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition",
              isActive
                ? "bg-orange-50 text-orange-600"
                : "text-gray-500 hover:text-slate-900"
            )}
            aria-pressed={isActive}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
