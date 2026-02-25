"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, LoaderCircle } from "lucide-react";
import { setBookmarkCoverAction } from "@/app/(private)/actions/bookmarkActions";

interface BookmarkCoverUploaderProps {
  bookmarkId: string;
}

export default function BookmarkCoverUploader({
  bookmarkId,
}: BookmarkCoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }

    const formData = new FormData();
    formData.append("cover", file);

    setError(null);
    startTransition(async () => {
      try {
        await setBookmarkCoverAction(bookmarkId, formData);
        router.refresh();
      } catch (uploadError) {
        console.error("Failed to upload bookmark cover.", uploadError);
        setError("画像のアップロードに失敗しました。");
      } finally {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="カバー画像をアップロード"
        className="hidden"
        onChange={handleSelect}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white backdrop-blur-sm transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <UploadCloud size={14} />
        )}
        カバー画像を変更
      </button>
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}

