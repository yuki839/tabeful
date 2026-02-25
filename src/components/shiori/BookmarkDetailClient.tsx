"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "./Shell";
import MapSplitView from "./MapSplitView";
import KanbanView from "./KanbanView";
import MagazineView from "./MagazineView";
import type { ShioriSpot, ShioriView } from "./types";
import BookmarkPlaceSearch from "@/components/bookmark-place-search";

interface BookmarkDetailClientProps {
  bookmarkId: string;
  userId: string;
  title: string;
  area: string | null;
  travelDate: string | null;
  coverImageUrl: string | null;
  spots: ShioriSpot[];
  savedPlaceIds: string[];
  mapImageUrl: string | null;
  mapLinkUrl: string;
  searchLat: number;
  searchLng: number;
}

const parseViewParam = (value: string | null): ShioriView | null => {
  if (value === "mapsplit" || value === "kanban" || value === "magazine") {
    return value;
  }
  return null;
};

export default function BookmarkDetailClient({
  bookmarkId,
  userId,
  title,
  area,
  travelDate,
  coverImageUrl,
  spots,
  savedPlaceIds,
  mapImageUrl,
  mapLinkUrl,
  searchLat,
  searchLng,
}: BookmarkDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = parseViewParam(searchParams.get("view"));
  const storageKey = useMemo(
    () => `shiori:view:${userId}:${bookmarkId}`,
    [userId, bookmarkId]
  );
  const [localView, setLocalView] = useState<ShioriView>(() => {
    if (typeof window === "undefined") {
      return viewParam ?? "mapsplit";
    }
    const stored = window.localStorage.getItem(storageKey);
    const parsed = parseViewParam(stored);
    return viewParam ?? parsed ?? "mapsplit";
  });
  const view = viewParam ?? localView;

  useEffect(() => {
    window.localStorage.setItem(storageKey, view);
  }, [storageKey, view]);

  const handleViewChange = (nextView: ShioriView) => {
    setLocalView(nextView);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-moc text-slate-900">
      <Shell
        view={view}
        onViewChange={handleViewChange}
        bookmarkId={bookmarkId}
        title={title}
        area={area}
        travelDate={travelDate}
        spotCount={spots.length}
        coverImageUrl={coverImageUrl}
        mapLinkUrl={mapLinkUrl}
      />

      {view === "mapsplit" ? (
        <MapSplitView
          spots={spots}
          bookmarkId={bookmarkId}
          mapImageUrl={mapImageUrl}
        />
      ) : null}
      {view === "kanban" ? (
        <KanbanView spots={spots} bookmarkId={bookmarkId} userId={userId} />
      ) : null}
      {view === "magazine" ? (
        <MagazineView spots={spots} bookmarkId={bookmarkId} />
      ) : null}

      <section
        id="route-expand"
        className="mx-auto w-full max-w-6xl px-6 pb-16 pt-6"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
              ルート追加
            </p>
            <h2 className="text-2xl font-black text-slate-900">
              周辺を探す
            </h2>
            <p className="text-sm text-gray-500">
              近くのスポットを追加して、旅程のルートを作ろう。
            </p>
          </div>
          <div className="mt-4">
            <BookmarkPlaceSearch
              bookmarkId={bookmarkId}
              bookmarkTitle={title}
              lat={searchLat}
              lng={searchLng}
              savedPlaceIds={savedPlaceIds}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
