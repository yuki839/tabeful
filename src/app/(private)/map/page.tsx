import MapSearchClient from "@/components/maps/map-search-client";
import { fetchLocation } from "@/lib/restaurants/api";
import { createClient } from "@/utils/supabase/server";

export default async function MapPage() {
  const { lat, lng } = await fetchLocation({ allowAnonymous: true });
  const mapApiKey = process.env.GOOGLE_API_KEY ?? "";
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user) && !userError;
  const bookmarks = isLoggedIn
    ? (await supabase
        .from("bookmarks")
        .select("id, title, area, travel_date, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })).data ?? []
    : [];
  const loginHref = `/login?next=${encodeURIComponent("/map")}`;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
            地図検索
          </p>
          <h1 className="font-display text-3xl text-[var(--noir-ink)] md:text-4xl">
            周辺を探索
          </h1>
        </div>
        <span className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
          TABEful
        </span>
      </div>

      <MapSearchClient
        apiKey={mapApiKey}
        defaultCenter={{ lat, lng }}
        bookmarks={bookmarks}
        isLoggedIn={isLoggedIn}
        loginHref={loginHref}
      />
    </div>
  );
}
