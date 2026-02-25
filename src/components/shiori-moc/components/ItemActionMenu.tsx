"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  MoreHorizontal,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ItineraryItem } from "../types";
import {
  deleteBookmarkItemAction,
  moveBookmarkItemAction,
} from "@/app/(private)/actions/bookmarkActions";

interface ItemActionMenuProps {
  item: ItineraryItem;
  bookmarkId: string;
  index: number;
  total: number;
  className?: string;
  align?: "left" | "right";
  onMove?: (itemId: string, direction: "up" | "down") => void;
  isBusy?: boolean;
  onReplace?: (item: ItineraryItem) => void;
}

const stopEvent = (event: ReactMouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

export default function ItemActionMenu({
  item,
  bookmarkId,
  index,
  total,
  className,
  align = "right",
  onMove,
  isBusy = false,
  onReplace,
}: ItemActionMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMoving, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const bookmarkItemId = item.bookmarkItemId;
  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;

  useEffect(() => {
    const handleClick = (event: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleOpenDetail = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!item.placeId) return;
    setOpen(false);
    router.push(`/restaurant/${item.placeId}`);
  };

  const handleMove = (
    event: ReactMouseEvent<HTMLButtonElement>,
    direction: "up" | "down"
  ) => {
    stopEvent(event);
    if (!bookmarkItemId) return;
    if (onMove) {
      setOpen(false);
      onMove(bookmarkItemId, direction);
      return;
    }
    startTransition(async () => {
      try {
        await moveBookmarkItemAction(bookmarkItemId, direction, bookmarkId);
        router.refresh();
      } catch (error) {
        console.error("Failed to reorder bookmark items.", error);
      }
    });
  };

  const handleDelete = (event: ReactMouseEvent<HTMLButtonElement>) => {
    stopEvent(event);
    if (!bookmarkItemId) return;
    startTransition(async () => {
      try {
        await deleteBookmarkItemAction(bookmarkItemId, bookmarkId);
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete bookmark item.", error);
      }
    });
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-orange-300 hover:text-orange-600"
        aria-label="スポットメニュー"
      >
        <MoreHorizontal size={16} />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-30 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {item.placeId ? (
            <button
              type="button"
              onClick={handleOpenDetail}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
            >
              店舗詳細を開く
              <ExternalLink size={14} />
            </button>
          ) : null}
          {onReplace ? (
            <button
              type="button"
              onClick={(event) => {
                stopEvent(event);
                setOpen(false);
                onReplace(item);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
            >
              代替候補
              <RefreshCcw size={14} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(event) => handleMove(event, "up")}
            disabled={!bookmarkItemId || !canMoveUp || isMoving || isBusy}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            上へ移動
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => handleMove(event, "down")}
            disabled={!bookmarkItemId || !canMoveDown || isMoving || isBusy}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下へ移動
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!bookmarkItemId || isMoving || isBusy}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            しおりから削除
            <Trash2 size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
