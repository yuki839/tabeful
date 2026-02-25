"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ACTIVE_BOOKMARK_STORAGE_KEY,
  parseActiveBookmarkValue,
} from "@/lib/bookmarks/activeBookmark";

export type ActiveBookmarkSummary = {
  id: string;
  title: string;
  area: string | null;
  travel_date: string | null;
  created_at: string;
  spotCount: number;
  coverUrl?: string | null;
};

interface ActiveBookmarkCardProps {
  userId: string;
  bookmarks: ActiveBookmarkSummary[];
  latestBookmarkId: string | null;
  fallbackCoverImage: string;
  profileAvatarUrl: string | null;
  avatarInitial: string;
}

const formatDateString = (value: string | null) => {
  if (!value) return "未定";
  const [date] = value.split("T");
  return date.replaceAll("-", ".");
};

const resolveActiveId = (
  userId: string,
  bookmarks: ActiveBookmarkSummary[],
  latestBookmarkId: string | null
) => {
  if (typeof window === "undefined") {
    return latestBookmarkId;
  }

  const parsed = parseActiveBookmarkValue(
    window.localStorage.getItem(ACTIVE_BOOKMARK_STORAGE_KEY)
  );

  if (parsed && parsed.userId === userId) {
    const exists = bookmarks.some((bookmark) => bookmark.id === parsed.bookmarkId);
    if (exists) {
      return parsed.bookmarkId;
    }
  }

  return latestBookmarkId;
};

export default function ActiveBookmarkCard({
  userId,
  bookmarks,
  latestBookmarkId,
  fallbackCoverImage,
  profileAvatarUrl,
  avatarInitial,
}: ActiveBookmarkCardProps) {
  const [activeId, setActiveId] = useState<string | null>(latestBookmarkId);
  const coverCacheKey = "tabeful-bookmark-cover-cache";

  useEffect(() => {
    // ローカルストレージ更新やタブ間イベントでアクティブしおりを同期する。
    const refresh = () => {
      setActiveId(resolveActiveId(userId, bookmarks, latestBookmarkId));
    };

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
  }, [bookmarks, latestBookmarkId, userId]);

  const activeBookmark = useMemo(
    () => bookmarks.find((bookmark) => bookmark.id === activeId) ?? null,
    [activeId, bookmarks]
  );

  const activeTitle = activeBookmark?.title ?? "最新のしおりを作成";
  const activeArea = activeBookmark?.area ?? "エリア未定";
  const activeDate = activeBookmark
    ? formatDateString(activeBookmark.travel_date ?? activeBookmark.created_at)
    : "未定";
  const activeSpotCount = activeBookmark?.spotCount ?? 0;
  const activeLink = activeBookmark
    ? `/bookmarks/${activeBookmark.id}`
    : "/bookmarks";

  const cachedCover = useMemo(() => {
    if (typeof window === "undefined" || !activeBookmark?.id) {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(coverCacheKey);
      const parsed = raw
        ? (JSON.parse(raw) as { userId?: string; covers?: Record<string, string> })
        : null;
      if (!parsed || parsed.userId !== userId || !parsed.covers) {
        return null;
      }
      return parsed.covers[activeBookmark.id] ?? null;
    } catch {
      return null;
    }
  }, [activeBookmark?.id, userId]);

  const activeCoverImage =
    activeBookmark?.coverUrl && activeBookmark.coverUrl.trim().length > 0
      ? activeBookmark.coverUrl
      : cachedCover ?? fallbackCoverImage;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!activeBookmark?.id || !activeBookmark.coverUrl) {
      return;
    }
    try {
      const raw = window.localStorage.getItem(coverCacheKey);
      const parsed = raw ? (JSON.parse(raw) as { userId?: string; covers?: Record<string, string> }) : null;
      const covers =
        parsed && parsed.userId === userId && parsed.covers ? parsed.covers : {};
      covers[activeBookmark.id] = activeBookmark.coverUrl;
      window.localStorage.setItem(
        coverCacheKey,
        JSON.stringify({ userId, covers })
      );
    } catch {
      // キャッシュ保存の失敗は無視する
    }
  }, [activeBookmark?.coverUrl, activeBookmark?.id, userId]);

  return (
    <Link
      href={activeLink}
      className="group relative flex w-full flex-col overflow-hidden border border-[var(--noir-border)] bg-white shadow-[0_22px_50px_rgba(15,15,15,0.15)] transition hover:-translate-y-1"
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative h-48 w-full overflow-hidden md:h-auto md:w-1/3">
          <img
            src={activeCoverImage}
            className="h-full w-full object-cover"
            alt="しおりカバー"
          />
          <div className="absolute inset-0 bg-black/20 transition group-hover:bg-transparent" />
          <div className="absolute left-4 top-4 border border-white/30 bg-black/50 px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-white">
            {activeBookmark ? "アクティブ" : "未作成"}
          </div>
        </div>
        <div className="relative flex flex-1 flex-col justify-between bg-white p-6 md:p-8">
          <div>
            <div className="mb-2 flex justify-between text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
              <span>エリア</span>
              <span>日程</span>
            </div>
            <div className="mb-6 flex justify-between">
              <h3 className="font-display text-2xl">{activeArea}</h3>
              <span className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                {activeDate}
              </span>
            </div>
            <h4 className="font-display text-xl">{activeTitle}</h4>
            <div className="mt-2 flex items-center gap-4 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {activeSpotCount} スポット
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> 1 人
              </span>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-dashed border-[var(--noir-border)] pt-6">
            {activeBookmark ? (
              <div className="flex items-center gap-2">
                {profileAvatarUrl ? (
                  <img
                    className="h-8 w-8 border border-white object-cover"
                    src={profileAvatarUrl}
                    alt="プロフィール"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center border border-white bg-[var(--noir-surface)] text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                    {avatarInitial}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                まだしおりがありません
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition group-hover:translate-x-1">
              {activeBookmark ? "しおりを見る" : "しおりを作成"}{" "}
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
