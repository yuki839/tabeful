"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import BookmarkSpotThumbnail from "@/components/bookmark-spot-thumbnail";
import type { ShioriSpot } from "./types";
import {
  deleteBookmarkItemAction,
  moveBookmarkItemAction,
} from "@/app/(private)/actions/bookmarkActions";

type SpotCardVariant = "horizontal" | "vertical";

interface SpotCardProps {
  spot: ShioriSpot;
  index: number;
  bookmarkId: string;
  detailHref?: string | null;
  isFirst?: boolean;
  isLast?: boolean;
  showActions?: boolean;
  showIndex?: boolean;
  variant?: SpotCardVariant;
  footer?: ReactNode;
  className?: string;
  imageClassName?: string;
}

const stopPropagation = (event: MouseEvent<HTMLButtonElement>) => {
  event.stopPropagation();
};

export default function SpotCard({
  spot,
  index,
  bookmarkId,
  detailHref,
  isFirst,
  isLast,
  showActions = true,
  showIndex = true,
  variant = "horizontal",
  footer,
  className,
  imageClassName,
}: SpotCardProps) {
  const isVertical = variant === "vertical";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-orange-300",
        className
      )}
    >
      {detailHref ? (
        <Link href={detailHref} className="absolute inset-0 z-10" />
      ) : null}

      <div
        className={cn(
          "relative z-20 flex gap-4 p-4",
          isVertical ? "flex-col" : "items-start"
        )}
      >
        <div className="flex items-start gap-3">
          {showIndex ? (
            <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">
              {index + 1}
            </div>
          ) : null}
          {isVertical ? null : (
            <BookmarkSpotThumbnail
              placeId={spot.placeId}
              placeName={spot.title}
              className={cn("h-16 w-16 rounded-lg", imageClassName)}
            />
          )}
        </div>

        {isVertical ? (
          <BookmarkSpotThumbnail
            placeId={spot.placeId}
            placeName={spot.title}
            className={cn("h-40 w-full rounded-xl", imageClassName)}
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-orange-600">
                {spot.typeLabel}
              </p>
              <h3 className="mt-1 truncate text-base font-bold text-slate-800">
                {spot.title}
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              {spot.ratingLabel}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs text-gray-500">
            {spot.address}
          </p>
          {footer ? <div className="mt-3">{footer}</div> : null}
        </div>

        {showActions ? (
          <div className="absolute right-3 top-3 z-20 flex gap-2 opacity-0 transition group-hover:opacity-100">
            <form
              action={moveBookmarkItemAction.bind(
                null,
                spot.id,
                "up",
                bookmarkId
              )}
            >
              <button
                type="submit"
                onClick={stopPropagation}
                disabled={isFirst}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="上へ移動"
              >
                <ArrowUp size={14} />
              </button>
            </form>
            <form
              action={moveBookmarkItemAction.bind(
                null,
                spot.id,
                "down",
                bookmarkId
              )}
            >
              <button
                type="submit"
                onClick={stopPropagation}
                disabled={isLast}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="下へ移動"
              >
                <ArrowDown size={14} />
              </button>
            </form>
            <form
              action={deleteBookmarkItemAction.bind(null, spot.id, bookmarkId)}
            >
              <button
                type="submit"
                onClick={stopPropagation}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-orange-300 hover:text-orange-600"
                aria-label="スポットを削除"
              >
                <Trash2 size={14} />
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
