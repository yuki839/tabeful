"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
import ViewToggle from "./ViewToggle";
import type { ShioriView } from "./types";
import BookmarkCoverUploader from "@/components/bookmark-cover-uploader";

interface ShellProps {
  view: ShioriView;
  onViewChange: (value: ShioriView) => void;
  bookmarkId: string;
  title: string;
  area: string | null;
  travelDate: string | null;
  spotCount: number;
  coverImageUrl: string | null;
  mapLinkUrl: string;
}

const formatDate = (value: string | null) => {
  if (!value) return "未定";
  const [date] = value.split("T");
  return date.replaceAll("-", ".");
};

export default function Shell({
  view,
  onViewChange,
  bookmarkId,
  title,
  area,
  travelDate,
  spotCount,
  coverImageUrl,
  mapLinkUrl,
}: ShellProps) {
  return (
    <div className="w-full bg-gray-50 font-moc text-slate-900">
      <div className="relative h-[45vh] min-h-[360px]">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt="しおりカバー"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute right-6 top-6 flex gap-3">
          <BookmarkCoverUploader bookmarkId={bookmarkId} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white/80">
              <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                {formatDate(travelDate)}
              </span>
              <span>・</span>
              <span className="flex items-center gap-2">
                <MapPin size={14} />
                {area || "未定"}
              </span>
              <span>・</span>
              <span>{spotCount} スポット</span>
            </div>
            <h1 className="mt-4 text-4xl font-black text-white md:text-6xl">
              {title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="-mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                Summary
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {title}
              </p>
              <p className="text-xs font-semibold text-gray-400">
                {area || "未定"} ・ {formatDate(travelDate)} ・ {spotCount} スポット
              </p>
            </div>

            <ViewToggle value={view} onChange={onViewChange} />

            <div className="flex flex-wrap gap-3">
              <a
                href={mapLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Google Mapsで開く
                <ArrowUpRight size={14} />
              </a>
              <a
                href="#route-expand"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 transition hover:border-orange-300 hover:text-orange-600"
              >
                ルートを拡張
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
