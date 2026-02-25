"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapPreviewProps {
  imageUrl: string | null;
  spotCount: number;
  className?: string;
}

export default function MapPreview({
  imageUrl,
  spotCount,
  className,
}: MapPreviewProps) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-slate-100",
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Map preview"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-gray-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <MapPin size={28} />
          </div>
          <p className="text-sm font-semibold">マップがありません</p>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800">
        <MapPin size={12} />
        {spotCount} スポット
      </div>
    </div>
  );
}
