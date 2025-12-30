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
    <div
      onClick={() => onClick(category.type)}
      className="cursor-pointer group"
    >
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-3 rounded-full border transition-all duration-300",
          select
            ? "bg-[#2D2A26] text-white border-[#2D2A26] shadow-md"
            : "bg-white text-[#5C5448] border-[#E0E0E0] hover:border-[#2D2A26] hover:shadow-sm"
        )}
      >
        <div className="relative w-8 h-8 rounded-full bg-[#F5F5F5] overflow-hidden">
          <Image
            className="object-cover scale-75 transition-transform duration-300 group-hover:scale-90"
            src={category.imageUrl}
            fill
            alt={category.categoryName}
            sizes="(max-width: 1280px) 10vw, 97px"
          />
        </div>
        <p className="text-[11px] font-bold tracking-widest uppercase truncate">
          {category.categoryName}
        </p>
      </div>
    </div>
  );
}
