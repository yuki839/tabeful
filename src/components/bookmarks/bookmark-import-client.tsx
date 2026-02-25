"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { importBookmarkFromJsonAction } from "@/app/(private)/actions/bookmarkActions";

type ImportPayload = {
  version: number;
  exportedAt?: string;
  bookmark: {
    title: string;
    area: string | null;
    date: string | null;
    coverImagePath: string | null;
  };
  items: Array<{
    sortOrder?: number;
    place: {
      googlePlaceId: string;
      name: string | null;
      primaryType: string | null;
      address: string | null;
      lat: number | null;
      lng: number | null;
    };
  }>;
};

interface BookmarkImportClientProps {
  isLoggedIn: boolean;
  loginHref: string;
}

const MAX_ITEMS = 50;

const normalizePayload = (raw: unknown) => {
  if (!raw || typeof raw !== "object") {
    return { error: "JSONの形式が正しくありません。" };
  }
  const data = raw as ImportPayload;
  if (data.version !== 1) {
    return { error: "対応していないバージョンです。" };
  }
  const title = data.bookmark?.title?.trim();
  if (!title) {
    return { error: "しおりタイトルがありません。" };
  }
  if (!Array.isArray(data.items)) {
    return { error: "items の形式が正しくありません。" };
  }

  const normalizedItems = data.items
    .map((item) => {
      const placeId = item?.place?.googlePlaceId?.trim();
      if (!placeId) {
        return null;
      }
      return {
        sortOrder: item.sortOrder,
        place: {
          googlePlaceId: placeId,
          name: item.place?.name ?? null,
          primaryType: item.place?.primaryType ?? null,
          address: item.place?.address ?? null,
          lat:
            typeof item.place?.lat === "number" && Number.isFinite(item.place.lat)
              ? item.place.lat
              : null,
          lng:
            typeof item.place?.lng === "number" && Number.isFinite(item.place.lng)
              ? item.place.lng
              : null,
        },
      };
    })
    .filter(Boolean) as ImportPayload["items"];

  return {
    payload: {
      version: 1,
      exportedAt: data.exportedAt,
      bookmark: {
        title,
        area: data.bookmark?.area ?? null,
        date: data.bookmark?.date ?? null,
        coverImagePath: data.bookmark?.coverImagePath ?? null,
      },
      items: normalizedItems.slice(0, MAX_ITEMS),
    } satisfies ImportPayload,
  };
};

export default function BookmarkImportClient({
  isLoggedIn,
  loginHref,
}: BookmarkImportClientProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; href: string } | null>(null);

  const previewItems = useMemo(() => {
    if (!payload) return [];
    return payload.items.slice(0, 5);
  }, [payload]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setToast(null);
    setFileName(file.name);
    const text = await file.text();

    try {
      const raw = JSON.parse(text);
      const normalized = normalizePayload(raw);
      if ("error" in normalized) {
        setPayload(null);
        setError(normalized.error);
        return;
      }
      setPayload(normalized.payload);
    } catch {
      setPayload(null);
      setError("JSONを読み取れませんでした。");
    }
  }, []);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void handleFile(file);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void handleFile(file);
  };

  const handleImport = async () => {
    if (!payload) return;
    setIsImporting(true);
    setError(null);
    try {
      const result = await importBookmarkFromJsonAction(payload);
      setToast({
        message: "取り込みが完了しました。",
        href: `/bookmarks/${result.bookmarkId}`,
      });
    } catch {
      setError("取り込みに失敗しました。");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="border border-[var(--noir-border)] bg-white p-6 text-sm font-ui text-[var(--noir-muted)]">
        取り込みにはログインが必要です。
        <div className="mt-3">
          <Link
            href={loginHref}
            className="inline-flex items-center border border-black bg-black px-4 py-2 text-[11px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
          >
            ログインへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="flex min-h-[200px] flex-col items-center justify-center gap-3 border border-dashed border-[var(--noir-border)] bg-[var(--noir-surface)] px-6 py-10 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <UploadCloud size={28} className="text-[var(--noir-muted)]" />
        <div className="space-y-2">
          <p className="text-sm font-ui text-[var(--noir-muted)]">
            JSONファイルをドラッグ&ドロップ
          </p>
          <label className="inline-flex cursor-pointer items-center border border-[var(--noir-border)] bg-white px-4 py-2 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black">
            ファイルを選択
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
        </div>
        {fileName ? (
          <p className="text-xs font-ui text-[var(--noir-muted)]">{fileName}</p>
        ) : null}
      </div>

      {error ? (
        <div className="border border-[var(--noir-border)] bg-white p-4 text-sm font-ui text-rose-600">
          {error}
        </div>
      ) : null}

      {payload ? (
        <div className="space-y-4 border border-[var(--noir-border)] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                プレビュー
              </p>
              <h2 className="mt-2 font-display text-2xl text-[var(--noir-ink)]">
                {payload.bookmark.title}
              </h2>
              <p className="mt-1 text-xs font-ui text-[var(--noir-muted)]">
                アイテム {payload.items.length} 件
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {previewItems.map((item, index) => (
              <div
                key={`${item.place.googlePlaceId}-${index}`}
                className="flex items-center justify-between border border-[var(--noir-border)] px-3 py-2 text-sm"
              >
                <span>{item.place.name ?? item.place.googlePlaceId}</span>
                <span className="text-xs text-[var(--noir-muted)]">
                  {item.place.primaryType ?? "--"}
                </span>
              </div>
            ))}
            {payload.items.length > previewItems.length ? (
              <p className="text-xs text-[var(--noir-muted)]">
                他 {payload.items.length - previewItems.length} 件
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setPayload(null);
                setFileName(null);
              }}
              className="border border-[var(--noir-border)] px-4 py-2 text-sm text-[var(--noir-muted)] transition hover:text-black"
            >
              クリア
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting}
              className="border border-black bg-black px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black disabled:border-[var(--noir-border)] disabled:bg-[var(--noir-surface)] disabled:text-[var(--noir-muted)]"
            >
              {isImporting ? "取り込み中..." : "このしおりとして取り込む"}
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center justify-between gap-4 rounded-2xl bg-black px-5 py-4 text-white shadow-2xl">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{toast.message}</p>
            <Link
              href={toast.href}
              className="text-xs font-semibold text-white/80 underline underline-offset-4 hover:text-white"
            >
              開く
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs font-semibold text-white/70 hover:text-white"
            aria-label="閉じる"
          >
            X
          </button>
        </div>
      ) : null}
    </div>
  );
}
