"use client";

import {
  ArrowRight,
  Calendar,
  ImageIcon,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  createBookmarkAction,
  deleteBookmarkAction,
} from "@/app/(private)/actions/bookmarkActions";
import ActiveBookmarkButton from "@/components/bookmark-active-button";
import BookmarkAreaPicker from "@/components/bookmarks/bookmark-area-picker";
import { readActiveBookmark } from "@/lib/bookmarks/activeBookmark";
import { cn } from "@/lib/utils";

export type BookmarkListItem = {
  id: string;
  title: string;
  area: string | null;
  travelDate: string | null;
  createdAt: string;
  coverUrl: string | null;
  spotCount: number;
};

interface BookmarksPageClientProps {
  userId: string;
  bookmarks: BookmarkListItem[];
  errorMessage?: string | null;
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "未定";
  const [date] = value.split("T");
  return date.replaceAll("-", ".");
};

const resolveActiveId = (
  userId: string,
  bookmarks: BookmarkListItem[],
  latestId: string | null
) => {
  if (typeof window === "undefined") {
    return latestId;
  }
  const stored = readActiveBookmark(userId);
  if (!stored) {
    return latestId;
  }
  return bookmarks.some((bookmark) => bookmark.id === stored.bookmarkId)
    ? stored.bookmarkId
    : latestId;
};

const stopCardClick = (event: MouseEvent) => {
  event.stopPropagation();
};

export default function BookmarksPageClient({
  userId,
  bookmarks,
  errorMessage,
}: BookmarksPageClientProps) {
  const router = useRouter();
  const latestId = bookmarks[0]?.id ?? null;
  const [activeId, setActiveId] = useState<string | null>(latestId);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [areaValue, setAreaValue] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [, setCoverPreviewUrl] = useState<string | null>(null);
  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return null;
    return URL.createObjectURL(coverFile);
  }, [coverFile]);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!coverPreviewUrl) return;
    return () => {
      URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const syncCreateHash = (nextOpen: boolean) => {
    if (typeof window === "undefined") return;
    const baseUrl = `${window.location.pathname}${window.location.search}`;
    if (nextOpen) {
      window.history.replaceState(null, "", `${baseUrl}#create`);
      return;
    }
    if (window.location.hash === "#create") {
      window.history.replaceState(null, "", baseUrl);
    }
  };

  const openCreate = () => {
    setCreateError(null);
    setAreaValue("");
    setCoverFile(null);
    setCoverPreviewUrl(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
    setCreateOpen(true);
    syncCreateHash(true);
  };

  const closeCreate = () => {
    setCreateError(null);
    setAreaValue("");
    setCoverFile(null);
    setCoverPreviewUrl(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
    setCreateOpen(false);
    syncCreateHash(false);
  };

  useEffect(() => {
    const refresh = () => {
      setActiveId(resolveActiveId(userId, bookmarks, latestId));
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(
      "tabeful:active-bookmark-change",
      refresh as EventListener
    );
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(
        "tabeful:active-bookmark-change",
        refresh as EventListener
      );
    };
  }, [bookmarks, latestId, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromHash = () => {
      const shouldOpen = window.location.hash === "#create";
      setCreateOpen(shouldOpen);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  useEffect(() => {
    if (!createOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [createOpen]);

  const activeBookmark = useMemo(() => {
    if (bookmarks.length === 0) return null;
    const found = bookmarks.find((bookmark) => bookmark.id === activeId);
    return found ?? bookmarks[0];
  }, [activeId, bookmarks]);

  const openBookmark = (bookmarkId: string) => {
    router.push(`/bookmarks/${bookmarkId}`);
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    bookmarkId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openBookmark(bookmarkId);
    }
  };

  const handleCreate = (formData: FormData) => {
    setCreateError(null);
    startTransition(async () => {
      try {
        await createBookmarkAction(formData);
        closeCreate();
        router.refresh();
      } catch (error) {
        console.error("Failed to create bookmark.", error);
        setCreateError("しおりの作成に失敗しました。もう一度お試しください。");
      }
    });
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      window.alert("画像ファイルを選択してください。");
      event.currentTarget.value = "";
      setCoverFile(null);
      return;
    }
    setCoverFile(file);
  };

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <button
          type="button"
          onClick={openCreate}
          className="group relative w-full overflow-hidden border border-[var(--noir-border)] bg-white p-6 text-left shadow-[0_18px_40px_rgba(15,15,15,0.12)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,15,15,0.16)]"
        >
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[var(--noir-accent-soft)]/40 blur-3xl transition group-hover:scale-110" />
          <div className="relative space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                新規しおり
              </span>
              <div className="flex h-12 w-12 items-center justify-center border border-[var(--noir-border)] bg-[var(--noir-surface)] text-black transition group-hover:border-black">
                <Plus size={22} />
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl tracking-[0.08em] text-[var(--noir-ink)]">
                + 新規しおり
              </h2>
              <p className="mt-3 text-sm font-ui leading-relaxed text-[var(--noir-muted)]">
                しおりのカバーを選んで、次の食べ歩きルートを始めよう。
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition group-hover:translate-x-1 group-hover:text-black">
              作成をはじめる
              <ArrowRight size={14} />
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-display uppercase tracking-[0.35em] text-[var(--noir-ink)]">
            アクティブしおり
          </h2>
          <span className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
            一覧
          </span>
        </div>

        {errorMessage ? (
          <div className="border border-[var(--noir-border)] bg-white p-6 text-sm font-ui text-destructive">
            しおりの読み込みに失敗しました。
          </div>
        ) : activeBookmark ? (
          <div
            role="link"
            tabIndex={0}
            aria-label="アクティブなしおりを開く"
            onClick={() => openBookmark(activeBookmark.id)}
            onKeyDown={(event) =>
              handleCardKeyDown(event, activeBookmark.id)
            }
            className="group relative overflow-hidden border border-black bg-white shadow-[0_28px_70px_rgba(15,15,15,0.18)] transition hover:-translate-y-1"
          >
            <div
              className={cn(
                "relative h-64 w-full overflow-hidden border-b border-[var(--noir-border)]",
                !activeBookmark.coverUrl &&
                  "bg-[radial-gradient(circle_at_20%_20%,rgba(15,15,15,0.06),transparent_55%),linear-gradient(135deg,#f7f4ee,#ece6dc)]"
              )}
            >
              {activeBookmark.coverUrl ? (
                <img
                  src={activeBookmark.coverUrl}
                  alt="しおりカバー"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.05)_60%)]" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute left-6 top-6 z-20 flex flex-wrap items-center gap-2 text-white">
                <span className="border border-white/30 bg-black/50 px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em]">
                  アクティブ
                </span>
                {activeBookmark.area ? (
                  <span className="border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em]">
                    {activeBookmark.area}
                  </span>
                ) : null}
                <span className="border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em]">
                  {formatDate(activeBookmark.travelDate ?? activeBookmark.createdAt)}
                </span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                <p className="text-[10px] font-ui uppercase tracking-[0.4em] text-white/80">
                  アクティブルート
                </p>
                <h3 className="mt-3 font-display text-4xl leading-tight">
                  {activeBookmark.title}
                </h3>
                <p className="mt-3 text-sm font-ui text-white/85">
                  {activeBookmark.spotCount} スポット
                </p>
              </div>
            </div>
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-6">
              <div className="flex items-center gap-4 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {activeBookmark.area || "エリア未定"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />{" "}
                  {formatDate(activeBookmark.travelDate ?? activeBookmark.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div onClick={stopCardClick} className="relative z-20">
                  <ActiveBookmarkButton
                    userId={userId}
                    bookmarkId={activeBookmark.id}
                    className="relative z-20"
                  />
                </div>
                <span className="inline-flex items-center gap-2 border border-black bg-black px-4 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-white transition group-hover:translate-x-1 group-hover:bg-white group-hover:text-black">
                  しおりを開く
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-[var(--noir-border)] bg-white p-8 text-center shadow-[0_18px_40px_rgba(15,15,15,0.12)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[var(--noir-border)] bg-[var(--noir-surface)] text-black">
              <Sparkles size={22} />
            </div>
            <h3 className="mt-5 font-display text-2xl text-[var(--noir-ink)]">
              まずは最初のしおりを作成
            </h3>
            <p className="mt-2 text-sm font-ui text-[var(--noir-muted)]">
              カバーを作って、行きたいスポットを追加していきましょう。
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 border border-black bg-black px-6 py-3 text-[11px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
            >
              <Plus size={14} />
              新規しおりを作成
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-display uppercase tracking-[0.35em] text-[var(--noir-ink)]">
            しおりカバー
          </h3>
          <span className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
            {bookmarks.length} Plans
          </span>
        </div>

        {errorMessage ? null : bookmarks.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {bookmarks.map((bookmark) => {
              const isActive = bookmark.id === activeBookmark?.id;
              return (
                <article
                  key={bookmark.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`${bookmark.title} を開く`}
                  onClick={() => openBookmark(bookmark.id)}
                  onKeyDown={(event) => handleCardKeyDown(event, bookmark.id)}
                  className={cn(
                    "group relative overflow-hidden border bg-white transition",
                    isActive
                      ? "border-black shadow-[0_26px_70px_rgba(15,15,15,0.2)]"
                      : "border-[var(--noir-border)] shadow-[0_18px_40px_rgba(15,15,15,0.12)] hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(15,15,15,0.16)]"
                  )}
                >
                  <div
                    className={cn(
                      "relative h-56 w-full overflow-hidden border-b border-[var(--noir-border)]",
                      !bookmark.coverUrl &&
                        "bg-[radial-gradient(circle_at_15%_20%,rgba(15,15,15,0.05),transparent_60%),linear-gradient(135deg,#f6f1e8,#e8dfd2)]"
                    )}
                  >
                    {bookmark.coverUrl ? (
                      <img
                        src={bookmark.coverUrl}
                        alt="しおりカバー"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.05)_65%)]" />
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2 text-white">
                      {isActive ? (
                        <span className="border border-white/30 bg-black/60 px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em]">
                          ACTIVE
                        </span>
                      ) : null}
                      {bookmark.area ? (
                        <span className="border border-white/20 bg-white/15 px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em]">
                          {bookmark.area}
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                      <h4 className="font-display text-2xl leading-tight">
                        {bookmark.title}
                      </h4>
                      <p className="mt-1 text-xs font-ui uppercase tracking-[0.3em] text-white/80">
                        {formatDate(bookmark.travelDate ?? bookmark.createdAt)}
                      </p>
                    </div>

                    <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
                      <form action={deleteBookmarkAction.bind(null, bookmark.id)}>
                        <button
                          type="submit"
                          onClick={stopCardClick}
                          aria-label="しおりを削除"
                          className="flex h-9 w-9 items-center justify-center border border-white/30 bg-black/45 text-white transition hover:border-white hover:bg-black/70"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="relative z-20 space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {bookmark.area || "エリア未定"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />{" "}
                          {formatDate(bookmark.travelDate ?? bookmark.createdAt)}
                        </span>
                      </div>
                      <span className="text-[10px] tracking-[0.35em]">
                        {bookmark.spotCount} スポット
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div onClick={stopCardClick} className="relative z-20">
                        <ActiveBookmarkButton
                          userId={userId}
                          bookmarkId={bookmark.id}
                          className="relative z-20"
                        />
                      </div>
                      <span className="inline-flex items-center gap-2 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition group-hover:translate-x-1 group-hover:text-black">
                        しおりを開く
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border border-[var(--noir-border)] bg-white p-8 text-center shadow-[0_18px_40px_rgba(15,15,15,0.12)]">
            <h3 className="font-display text-2xl text-[var(--noir-ink)]">
              しおりがまだありません
            </h3>
            <p className="mt-2 text-sm font-ui text-[var(--noir-muted)]">
              新規しおりを作成して、行きたいスポットを追加しましょう。
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex items-center gap-2 border border-black bg-black px-6 py-3 text-[11px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
            >
              <Plus size={14} />
              新規しおりを作成
            </button>
          </div>
        )}
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 animate-fade">
          <div className="w-full max-w-xl overflow-hidden border border-[var(--noir-border)] bg-white shadow-[0_40px_120px_rgba(15,15,15,0.35)] animate-rise">
            <div className="flex items-center justify-between border-b border-[var(--noir-border)] bg-[var(--noir-surface)] px-6 py-4">
              <div>
                  <p className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                    新規しおり
                  </p>
                <h3 className="mt-1 font-display text-2xl text-[var(--noir-ink)]">
                  しおりを作成
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreate}
                className="flex h-10 w-10 items-center justify-center border border-[var(--noir-border)] bg-white text-[var(--noir-muted)] transition hover:border-black hover:text-black"
                aria-label="モーダルを閉じる"
              >
                <X size={16} />
              </button>
            </div>

            <form
              action={handleCreate}
              className="space-y-6 px-6 py-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                    サムネイル
                  </p>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 border border-[var(--noir-border)] bg-white px-4 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UploadCloud size={14} />
                    選択
                  </button>
                </div>
                <input
                  ref={coverInputRef}
                  id="bookmark-cover-modal"
                  name="cover"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
                <div className="relative h-44 w-full overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)]">
                  {coverPreviewUrl ? (
                    <img
                      src={coverPreviewUrl}
                      alt="サムネイルプレビュー"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--noir-muted)]">
                      <div className="flex h-12 w-12 items-center justify-center border border-[var(--noir-border)] bg-white text-black">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-xs font-ui uppercase tracking-[0.3em]">
                        カバーを選択
                      </p>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                </div>
                {coverFile ? (
                  <p className="text-xs font-ui text-[var(--noir-muted)]">
                    {coverFile.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bookmark-title-modal"
                  className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
                >
                  タイトル
                </label>
                <input
                  id="bookmark-title-modal"
                  name="title"
                  required
                  placeholder="例: 週末の渋谷カフェ巡り"
                  className="w-full border border-[var(--noir-border)] bg-white px-4 py-3 text-sm font-ui text-[var(--noir-ink)] shadow-inner focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <BookmarkAreaPicker
                  value={areaValue}
                  onChange={setAreaValue}
                  disabled={isPending}
                  inputId="bookmark-area-modal"
                />
                <div className="space-y-2">
                  <label
                    htmlFor="bookmark-date-modal"
                    className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
                  >
                    日付
                  </label>
                  <input
                    id="bookmark-date-modal"
                    name="travel_date"
                    type="date"
                    className="w-full border border-[var(--noir-border)] bg-white px-4 py-3 text-sm font-ui text-[var(--noir-ink)] shadow-inner focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              {createError ? (
                <p className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-ui text-destructive">
                  {createError}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[var(--noir-border)] pt-5">
                <p className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                  すぐにスポットを追加できます
                </p>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 border border-black bg-black px-6 py-3 text-[11px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={14} />
                  {isPending ? "作成中..." : "しおりを作成"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
