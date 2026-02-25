"use client";

import { CheckCircle2, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import SpotCard from "./SpotCard";
import type { ShioriSpot } from "./types";

type KanbanColumnId = "ideas" | "planned" | "visited";

const KANBAN_COLUMNS: Array<{
  id: KanbanColumnId;
  label: string;
  icon: ReactNode;
}> = [
  { id: "ideas", label: "アイデア", icon: <Sparkles size={16} /> },
  { id: "planned", label: "計画中", icon: <Target size={16} /> },
  { id: "visited", label: "訪問済", icon: <CheckCircle2 size={16} /> },
];

interface KanbanViewProps {
  spots: ShioriSpot[];
  bookmarkId: string;
  userId: string;
}

export default function KanbanView({
  spots,
  bookmarkId,
  userId,
}: KanbanViewProps) {
  const storageKey = `shiori:kanban:${userId}:${bookmarkId}`;
  const [columnMap, setColumnMap] = useState<Record<string, KanbanColumnId>>(
    () => {
      if (typeof window === "undefined") {
        return {};
      }
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return {};
      }
      try {
        return (JSON.parse(raw) as Record<string, KanbanColumnId>) ?? {};
      } catch {
        return {};
      }
    }
  );

  const normalizedColumnMap = useMemo(() => {
    const next = { ...columnMap };
    for (const spot of spots) {
      if (!next[spot.id]) {
        next[spot.id] = "planned";
      }
    }
    return next;
  }, [columnMap, spots]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(normalizedColumnMap));
  }, [normalizedColumnMap, storageKey]);

  const sortedSpots = useMemo(() => {
    return [...spots].sort((a, b) => a.order - b.order);
  }, [spots]);
  const firstSpotId = sortedSpots[0]?.id;
  const lastSpotId = sortedSpots[sortedSpots.length - 1]?.id;

  const getColumn = (spotId: string) => normalizedColumnMap[spotId] ?? "planned";

  const handleMove = (
    event: MouseEvent<HTMLButtonElement>,
    spotId: string,
    columnId: KanbanColumnId
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setColumnMap((current) => ({ ...current, [spotId]: columnId }));
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">ボードビュー</h2>
        <p className="text-xs font-semibold text-gray-400">
          UIは後で磨き込み予定（ドラッグ＆ドロップなど）
        </p>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((column) => {
          const columnItems = sortedSpots.filter(
            (spot) => getColumn(spot.id) === column.id
          );
          return (
            <div
              key={column.id}
              className="flex w-80 flex-shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <span className="text-orange-500">{column.icon}</span>
                  {column.label}
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                    {columnItems.length}
                  </span>
                </div>
              </div>
              <div className="book-scroll flex-1 space-y-3 overflow-y-auto p-4">
                {columnItems.length > 0 ? (
                  columnItems.map((spot, index) => (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      index={index}
                      bookmarkId={bookmarkId}
                      detailHref={spot.placeId ? `/restaurant/${spot.placeId}` : null}
                      isFirst={spot.id === firstSpotId}
                      isLast={spot.id === lastSpotId}
                      showIndex={false}
                      className="shadow-none"
                      footer={
                        <div className="flex flex-wrap gap-2">
                          {KANBAN_COLUMNS.map((target) => (
                            <button
                              key={target.id}
                              type="button"
                              onClick={(event) =>
                                handleMove(event, spot.id, target.id)
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                getColumn(spot.id) === target.id
                                  ? "border-orange-200 bg-orange-50 text-orange-600"
                                  : "border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600"
                              }`}
                            >
                              {target.label}
                            </button>
                          ))}
                        </div>
                      }
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                    まだカードがありません。
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
