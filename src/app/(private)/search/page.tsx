import RestaurantList from "@/components/restaurant-list";
import Categories from "@/components/ui/categories";
import PlaceSearchBar from "@/components/ui/place-search-bar";
import SearchFilters from "@/components/ui/search-filters";
import {
  fetchCategoryRestaurants,
  fetchCRestaurantsByKeyword,
  fetchLocation,
} from "@/lib/restaurants/api";
import type { Restaurant } from "@/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; restaurant?: string; rating?: string }>;
}) {
  const { category, restaurant, rating } = await searchParams;
  const { lat, lng } = await fetchLocation({ allowAnonymous: true });
  const parsedRating = Number(rating);
  const minRating =
    Number.isFinite(parsedRating) && parsedRating > 0 ? parsedRating : null;
  const applyFilters = <T extends Restaurant>(items: T[]) => {
    let filtered = items;
    if (category) {
      filtered = filtered.filter((item) => item.primaryType === category);
    }
    if (minRating != null) {
      filtered = filtered.filter((item) => (item.rating ?? 0) >= minRating);
    }
    return filtered;
  };

  let resultsContent = (
    <div className="border border-[var(--noir-border)] bg-white p-6 text-sm font-ui text-[var(--noir-muted)]">
      {"\u30ab\u30c6\u30b4\u30ea\u30fc\u3092\u9078\u3076\u304b\u3001\u4e0a\u306e\u691c\u7d22\u304b\u3089\u6b21\u306e\u4e00\u8ed2\u3092\u898b\u3064\u3051\u307e\u3057\u3087\u3046\u3002"}
    </div>
  );

  if (restaurant) {
    const { data: restaurants, error: fetchError } =
      await fetchCRestaurantsByKeyword(restaurant, lat, lng);
    const filteredRestaurants = restaurants ? applyFilters(restaurants) : null;
    resultsContent = (
      <div className="space-y-4">
        {!filteredRestaurants ? (
          <p className="text-destructive font-ui">{fetchError}</p>
        ) : filteredRestaurants.length > 0 ? (
          <>
            <div className="text-sm font-ui text-[var(--noir-muted)]">
              {`\u300c${restaurant}\u300d\u306e\u691c\u7d22\u7d50\u679c\uff1a${filteredRestaurants.length} \u4ef6`}
            </div>
            <RestaurantList restaurants={filteredRestaurants} />
          </>
        ) : (
          <p className="font-ui">{"\u8a72\u5f53\u3059\u308b\u5e97\u8217\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002"}</p>
        )}
      </div>
    );
  } else if (category) {
    const { data: categoryRestaurants, error: fetchError } =
      await fetchCategoryRestaurants(category, lat, lng);
    const filteredRestaurants = categoryRestaurants
      ? applyFilters(categoryRestaurants)
      : null;
    resultsContent = (
      <div className="space-y-4">
        <div className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
          {"\u30ab\u30c6\u30b4\u30ea\u30fc"}
        </div>
        {!filteredRestaurants ? (
          <p className="text-destructive font-ui">{fetchError}</p>
        ) : filteredRestaurants.length > 0 ? (
          <RestaurantList restaurants={filteredRestaurants} />
        ) : (
          <p className="font-ui">{"\u8a72\u5f53\u3059\u308b\u5e97\u8217\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3067\u3057\u305f\u3002"}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 pb-16 pt-6 md:pt-8">
      <section className="relative overflow-visible border border-[var(--noir-border)] bg-white p-6 shadow-[0_24px_60px_rgba(15,15,15,0.16)] md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-[var(--noir-accent-soft)]/40 blur-3xl" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                {"\u691c\u7d22"}
              </p>
              <h1 className="mt-2 font-display text-3xl tracking-[0.08em] text-[var(--noir-ink)] md:text-4xl">
                {"\u76ee\u7684\u306b\u5408\u3046\u304a\u5e97\u3092\u63a2\u305d\u3046"}
              </h1>
            </div>
          </div>
          <PlaceSearchBar
            lat={lat}
            lng={lng}
            className="border border-[var(--noir-border)] bg-white px-4 py-2 shadow-none"
            initialQuery={restaurant ?? ""}
          />
          <p className="text-[11px] font-ui text-[var(--noir-muted)]">
            Enterでキーワード検索、サジェストはクリックで詳細へ移動します。
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-display uppercase tracking-[0.35em] text-[var(--noir-ink)]">
            {"\u30ab\u30c6\u30b4\u30ea\u30fc"}
          </h2>
          <span className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
            {"\u30bf\u30c3\u30d7\u3067\u7d5e\u308a\u8fbc\u307f"}
          </span>
        </div>
        <Categories />
        <SearchFilters />
      </section>

      <section>{resultsContent}</section>
    </div>
  );
}
