"use client";

import SpotCard from "./SpotCard";
import type { ShioriSpot } from "./types";

interface MagazineViewProps {
  spots: ShioriSpot[];
  bookmarkId: string;
}

export default function MagazineView({ spots, bookmarkId }: MagazineViewProps) {
  const [featured, ...rest] = spots;
  const firstSpotId = spots[0]?.id;
  const lastSpotId = spots[spots.length - 1]?.id;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
            Magazine
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-800 md:text-4xl">
            旅のハイライト
          </h2>
        </div>
        <p className="text-xs font-semibold text-gray-400">
          {spots.length} スポット
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {featured ? (
          <SpotCard
            spot={featured}
            index={0}
            bookmarkId={bookmarkId}
            detailHref={featured.placeId ? `/restaurant/${featured.placeId}` : null}
            isFirst
            isLast={featured.id === lastSpotId}
            showIndex={false}
            variant="vertical"
            imageClassName="h-64"
            className="shadow-lg"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
            まだスポットがありません。
          </div>
        )}

        {rest.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((spot, index) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                index={index + 1}
                bookmarkId={bookmarkId}
                detailHref={spot.placeId ? `/restaurant/${spot.placeId}` : null}
                isFirst={spot.id === firstSpotId}
                isLast={spot.id === lastSpotId}
                showIndex={false}
                variant="vertical"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
