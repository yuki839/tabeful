"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  ACTIVE_BOOKMARK_STORAGE_KEY,
  parseActiveBookmarkValue,
  writeActiveBookmark,
} from "@/lib/bookmarks/activeBookmark";
import { cn } from "@/lib/utils";

interface ActiveBookmarkButtonProps {
  userId: string;
  bookmarkId: string;
  className?: string;
}

const readIsActive = (userId: string, bookmarkId: string) => {
  if (typeof window === "undefined") return false;
  const parsed = parseActiveBookmarkValue(
    window.localStorage.getItem(ACTIVE_BOOKMARK_STORAGE_KEY)
  );
  return Boolean(parsed && parsed.userId === userId && parsed.bookmarkId === bookmarkId);
};

export default function ActiveBookmarkButton({
  userId,
  bookmarkId,
  className,
}: ActiveBookmarkButtonProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const refresh = () => setIsActive(readIsActive(userId, bookmarkId));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("tabeful:active-bookmark-change", refresh as EventListener);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(
        "tabeful:active-bookmark-change",
        refresh as EventListener
      );
    };
  }, [bookmarkId, userId]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    writeActiveBookmark(userId, bookmarkId);
    setIsActive(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 border border-[var(--noir-border)] bg-white px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black",
        isActive &&
          "border-black bg-[var(--noir-surface)] text-[var(--noir-ink)]",
        className
      )}
    >
      <CheckCircle2 size={14} />
      {isActive ? "アクティブ中" : "アクティブにする"}
    </button>
  );
}
