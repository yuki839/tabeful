import BookmarksPageClient, {
  type BookmarkListItem,
} from "@/components/bookmarks/bookmarks-page-client";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const HERO_TITLE =
  "\u3057\u304a\u308a\u306e\u30ab\u30d0\u30fc\u3092\u9078\u3093\u3067\u3001\u6b21\u306e\u30eb\u30fc\u30c8\u3092\u59cb\u3081\u3088\u3046";
const HERO_BODY =
  "\u4f5c\u6210\u3057\u305f\u3057\u304a\u308a\u3092\u4e26\u3079\u3066\u7ba1\u7406\u3057\u3001\u30a2\u30af\u30c6\u30a3\u30d6\u306a\u3057\u304a\u308a\u304b\u3089\u3059\u3050\u306b\u65c5\u306e\u7d9a\u304d\u3092\u958b\u3051\u307e\u3059\u3002";

const buildSignedCoverUrl = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null
) => {
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage
      .from("album-photos")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error) {
      console.error("Failed to create cover signed URL.", error);
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (error) {
    console.error("Failed to create cover signed URL.", error);
    return null;
  }
};

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: bookmarkRows, error } = await supabase
    .from("bookmarks")
    .select("id, title, area, travel_date, created_at, cover_image_path")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const bookmarkIds = (bookmarkRows ?? []).map((bookmark) => String(bookmark.id));
  const { data: bookmarkItemRows } =
    bookmarkIds.length > 0
      ? await supabase
          .from("bookmark_items")
          .select("bookmark_id")
          .in("bookmark_id", bookmarkIds)
      : { data: [] as Array<{ bookmark_id: string | number }> };

  const spotCountByBookmark = (bookmarkItemRows ?? []).reduce<Record<string, number>>(
    (acc, item) => {
      const id = String(item.bookmark_id);
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const coverUrls = await Promise.all(
    (bookmarkRows ?? []).map((bookmark) =>
      buildSignedCoverUrl(supabase, bookmark.cover_image_path)
    )
  );

  const bookmarks: BookmarkListItem[] = (bookmarkRows ?? []).map(
    (bookmark, index) => {
      const id = String(bookmark.id);
      return {
        id,
        title: bookmark.title,
        area: bookmark.area,
        travelDate: bookmark.travel_date,
        createdAt: bookmark.created_at,
        coverUrl: coverUrls[index] ?? null,
        spotCount: spotCountByBookmark[id] ?? 0,
      };
    }
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 md:px-8">
      <section className="relative mt-8 overflow-hidden border border-[var(--noir-border)] bg-white p-6 shadow-[var(--noir-shadow)] md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-52 w-52 rounded-full bg-[var(--noir-accent-soft)]/40 blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                Shiori Library
              </p>
              <h1 className="font-display text-3xl tracking-[0.08em] text-[var(--noir-ink)] md:text-4xl">
                {HERO_TITLE}
              </h1>
              <p className="text-sm font-ui text-[var(--noir-muted)]">
                {HERO_BODY}
              </p>
            </div>
            <span className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
              Noir Luxe
            </span>
          </div>
        </div>
      </section>

      <BookmarksPageClient
        userId={user.id}
        bookmarks={bookmarks}
        errorMessage={error?.message ?? null}
      />
    </div>
  );
}
