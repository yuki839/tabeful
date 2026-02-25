"use client";

import MapPreview from "./MapPreview";
import SpotCard from "./SpotCard";
import type { ShioriSpot } from "./types";

interface MapSplitViewProps {
  spots: ShioriSpot[];
  bookmarkId: string;
  mapImageUrl: string | null;
}

export default function MapSplitView({
  spots,
  bookmarkId,
  mapImageUrl,
}: MapSplitViewProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="book-scroll order-2 flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:order-1 md:h-[560px] md:overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">スポット一覧</h2>
            <span className="text-xs font-semibold text-gray-400">
              {spots.length} スポット
            </span>
          </div>
          <div className="space-y-3">
            {spots.length > 0 ? (
              spots.map((spot, index) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  index={index}
                  bookmarkId={bookmarkId}
                  detailHref={spot.placeId ? `/restaurant/${spot.placeId}` : null}
                  isFirst={index === 0}
                  isLast={index === spots.length - 1}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                まだスポットがありません。
              </div>
            )}
          </div>
        </div>

        <div className="order-1 h-[40vh] md:order-2 md:h-[560px] md:w-1/2">
          <MapPreview imageUrl={mapImageUrl} spotCount={spots.length} />
        </div>
      </div>
    </section>
  );
}
