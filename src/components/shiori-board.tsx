import { Edit3, MapPin, MoreHorizontal } from "lucide-react";

export interface ShioriSpot {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  note?: string;
  time?: string;
  priceLevel?: string;
}

export interface ShioriTrip {
  title: string;
  date: string;
  coverImage: string;
  locationLabel: string;
  spots: ShioriSpot[];
}

interface ShioriBoardProps {
  trip: ShioriTrip;
}

export default function ShioriBoard({ trip }: ShioriBoardProps) {
  return (
    <div className="flex h-full flex-col bg-[var(--noir-bg)] text-[var(--noir-ink)] md:flex-row">
      <aside className="w-full flex-shrink-0 border-b border-[var(--noir-border)] bg-[var(--noir-surface)] p-8 md:w-[360px] md:border-b-0 md:border-r md:p-10">
        <div className="sticky top-6 space-y-6">
          <p className="text-[10px] font-ui uppercase tracking-[0.4em] text-[var(--noir-muted)]">
            {trip.date}
          </p>
          <h1 className="font-display text-3xl tracking-[0.08em] md:text-4xl">
            {trip.title}
          </h1>
          <div className="flex items-center gap-2 text-sm font-ui text-[var(--noir-muted)]">
            <MapPin size={16} />
            <span>{trip.locationLabel}</span>
          </div>
          <div className="aspect-[4/3] overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)]">
            <img
              src={trip.coverImage}
              alt="しおりのカバー"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 border border-[var(--noir-border)] bg-white py-3 text-sm font-ui uppercase tracking-[0.3em] text-[var(--noir-ink)] transition hover:bg-black hover:text-white"
            >
              <Edit3 size={16} />
              しおりを編集
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 border border-[var(--noir-border)] bg-white py-3 text-sm font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:bg-black hover:text-white"
            >
              <MoreHorizontal size={16} />
              その他
            </button>
          </div>
        </div>
      </aside>

      <section className="flex-1 p-8 md:p-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl tracking-[0.08em]">
              旅程
            </h2>
            <span className="border border-black bg-black px-4 py-1 text-[11px] font-ui uppercase tracking-[0.3em] text-white">
              {trip.spots.length} スポット
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-4 hidden h-full w-px bg-[var(--noir-border)] md:block" />
            <div className="space-y-12">
              {trip.spots.map((spot, index) => (
                <div
                  key={spot.id}
                  className="relative flex flex-col gap-6 md:flex-row md:gap-10"
                >
                  <div className="flex h-10 w-10 items-center justify-center border border-[var(--noir-border)] bg-white text-sm font-ui text-[var(--noir-muted)] md:h-12 md:w-12">
                    {index + 1}
                  </div>
                  <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                        {spot.time ?? "10:00"}
                      </div>
                      <h3 className="font-display text-xl text-[var(--noir-ink)] md:text-2xl">
                        {spot.name}
                      </h3>
                      {spot.note ? (
                        <p className="text-sm font-ui text-[var(--noir-muted)]">
                          {spot.note}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="border border-[var(--noir-border)] bg-white px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                          {spot.category}
                        </span>
                        {spot.priceLevel ? (
                          <span className="border border-[var(--noir-border)] bg-white px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                            {spot.priceLevel}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="w-full overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)] md:w-48">
                      <img
                        src={spot.imageUrl}
                        alt={spot.name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
