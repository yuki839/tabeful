import Link from "next/link";
import BookmarkImportClient from "@/components/bookmarks/bookmark-import-client";
import { createClient } from "@/utils/supabase/server";

export default async function BookmarkImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user) && !userError;
  const loginHref = `/login?next=${encodeURIComponent("/bookmarks/import")}`;

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 pb-16 pt-8 md:px-8">
      <div className="mb-6 space-y-2">
        <p className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
          Shiori Import
        </p>
        <h1 className="font-display text-3xl text-[var(--noir-ink)] md:text-4xl">
          しおりを取り込む
        </h1>
        <p className="text-sm font-ui text-[var(--noir-muted)]">
          共有されたJSONをアップロードして、自分のしおりとして保存します。
        </p>
      </div>

      {isLoggedIn ? (
        <BookmarkImportClient isLoggedIn={isLoggedIn} loginHref={loginHref} />
      ) : (
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
      )}
    </div>
  );
}
