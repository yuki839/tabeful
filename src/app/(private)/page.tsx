import AddressModal from "@/components/ui/address-modal";
import CarouselContainer from "@/components/carousel-container";
import RestaurantCard from "@/components/restaurant-card";
import RestaurantList from "@/components/restaurant-list";
import Section from "@/components/section";
import Categories from "@/components/ui/categories";
import PlaceSearchBar from "@/components/ui/place-search-bar";
import ActiveBookmarkCard from "@/components/bookmark-active-card";
import InteractiveGoogleMap from "@/components/maps/interactive-google-map";
import {
  fetchLocation,
  fetchRamenRestaurants,
  fetchRestaurants,
} from "@/lib/restaurants/api";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Compass, Map, MapPin, Plus, Search, Ticket } from "lucide-react";

const formatTag = (value: string) =>
  `#${value.replaceAll("_", "").toLowerCase()}`;

const SIGNED_URL_TTL_SECONDS = 60 * 60;
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

export default async function Home() {
  const { lat, lng } = await fetchLocation({ allowAnonymous: true });

  const { data: nearbyRamenRestaurants, error: nearbyRamenRestaurantsError } =
    await fetchRamenRestaurants(lat, lng);
  const { data: nearbyRestaurants, error: nearbyRestaurantsError } =
    await fetchRestaurants(lat, lng);

  const fallbackImage = "/no_image.png";
  const combinedRestaurants = [
    ...(nearbyRestaurants ?? []),
    ...(nearbyRamenRestaurants ?? []),
  ];
  const heroImage =
    combinedRestaurants.find((restaurant) => restaurant.photoUrl)?.photoUrl ??
    fallbackImage;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user) && !userError;

  const profileData = isLoggedIn
    ? (await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle()).data
    : null;
  const profile = profileData as
    | { avatar_url?: string | null; display_name?: string | null }
    | null;
  const profileAvatarUrl =
    profile?.avatar_url && profile.avatar_url.trim().length > 0
      ? profile.avatar_url
      : null;
  const avatarInitialSource = profile?.display_name ?? user?.email ?? "";
  const avatarInitial =
    avatarInitialSource.trim().charAt(0).toUpperCase() || "U";

  const bookmarkRows = isLoggedIn
    ? (await supabase
        .from("bookmarks")
        .select("id, title, area, travel_date, created_at, cover_image_path")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })).data ?? []
    : [];

  const bookmarkIds = (bookmarkRows ?? []).map((bookmark) => String(bookmark.id));
  const bookmarkItemRows =
    isLoggedIn && bookmarkIds.length > 0
      ? (await supabase
          .from("bookmark_items")
          .select("bookmark_id")
          .in("bookmark_id", bookmarkIds)).data ?? []
      : [];

  const bookmarkItemCounts = (bookmarkItemRows ?? []).reduce<Record<string, number>>(
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

  const bookmarksWithCounts = (bookmarkRows ?? []).map((bookmark, index) => {
    const id = String(bookmark.id);
    return {
      id,
      title: bookmark.title,
      area: bookmark.area,
      travel_date: bookmark.travel_date,
      created_at: bookmark.created_at,
      spotCount: bookmarkItemCounts[id] ?? 0,
      coverUrl: coverUrls[index] ?? null,
    };
  });

  const latestBookmarkId = bookmarksWithCounts[0]?.id ?? null;
  const fallbackCoverImage = "/no_image.png";
  const mapApiKey = process.env.GOOGLE_API_KEY ?? "";
  const mapMarkers = combinedRestaurants
    .map((restaurant) =>
      restaurant.location
        ? {
            id: restaurant.id,
            lat: restaurant.location.lat,
            lng: restaurant.location.lng,
            title: restaurant.restaurantName ?? null,
            href: `/restaurant/${restaurant.id}`,
          }
        : null
    )
    .filter(Boolean)
    .slice(0, 12) as Array<{
    id: string;
    lat: number;
    lng: number;
    title: string | null;
    href: string;
  }>;

  const curatedRoutes = combinedRestaurants.slice(0, 3).map((restaurant) => ({
    id: restaurant.id,
    title: restaurant.restaurantName ?? "無題のルート",
    area: restaurant.primaryType?.replaceAll("_", " ") ?? "未設定",
    image: restaurant.photoUrl ?? fallbackImage,
    tags: restaurant.primaryType ? [formatTag(restaurant.primaryType)] : ["#未分類"],
  }));

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1400px] pb-16">
        <section className="relative min-h-[clamp(65vh,75vh,92vh)] w-full overflow-hidden">
          <img
            src={heroImage}
            className="absolute inset-0 h-full w-full object-cover brightness-[0.75]"
            alt="街のフードシーン"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-6xl px-5 py-12 text-white sm:px-8 lg:px-12">
              <div className="space-y-8 md:space-y-10">
                <span className="inline-flex border border-white/40 bg-black/40 px-3 py-1 text-[10px] font-ui uppercase tracking-[0.4em] text-white/80">
                  食旅サポート
                </span>
                <div className="space-y-4">
                  <h1 className="font-display text-4xl leading-tight md:text-6xl">
                    お店を探す
                  </h1>
                  <p className="max-w-2xl text-lg font-medium text-white/85">

                  </p>
                </div>
                <div className="grid gap-4 rounded-[28px] border border-white/30 bg-white/95 p-5 text-[var(--noir-ink)] shadow-[0_30px_70px_rgba(15,15,15,0.35)] md:grid-cols-[minmax(0,1fr),auto]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                      <MapPin size={18} />
                      <AddressModal
                        triggerClassName="text-[11px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)] transition hover:text-black"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--noir-border)] bg-white px-4 py-3 shadow-sm text-[var(--noir-muted)]">
                        <MapPin size={18} />
                        <span className="text-[11px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                          場所
                        </span>
                        <AddressModal
                          triggerClassName="text-[11px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)] transition hover:text-black"
                        />
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-[var(--noir-border)] bg-white px-4 py-3 shadow-sm text-[var(--noir-muted)]">
                        <Search size={18} />
                        <span className="text-[11px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                          お店                        </span>
                        <div className="flex-1 min-w-0">
                          <PlaceSearchBar
                            lat={lat}
                            lng={lng}
                            className="border-0 bg-transparent px-0 py-0 shadow-none focus-within:ring-0"
                            inputClassName="text-sm font-ui placeholder:text-[var(--noir-muted)]"
                            listClassName="w-[calc(100%+2rem)] -ml-4"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/search"
                    className="flex items-center justify-center rounded-2xl border border-black bg-black px-6 py-3 text-[11px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black hover:border-black/80"
                  >
                    検索
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-[1400px] flex-col gap-16 px-6 pb-20 pt-16">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display uppercase tracking-[0.35em] text-[var(--noir-ink)]">
                カテゴリー
              </h2>
              <span className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                スワイプ
              </span>
            </div>
            <Categories />
          </section>

          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: "新規プラン",
                icon: Plus,
                href: "/bookmarks#create",
              },
              {
                label: "地図で探す",
                icon: Map,
                href: "/map",
              },
              { label: "近く", icon: Compass, href: "#nearby" },
              { label: "保存済み", icon: Ticket, href: "/bookmarks" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-3 border border-[var(--noir-border)] bg-white px-4 py-6 text-center transition hover:shadow-[0_18px_40px_rgba(15,15,15,0.12)]"
              >
                <div className="flex h-12 w-12 items-center justify-center border border-[var(--noir-border)] bg-[var(--noir-surface)] text-black">
                  <action.icon size={22} />
                </div>
                <span className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                  {action.label}
                </span>
              </Link>
            ))}
          </section>

          <section>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="flex items-center gap-2 font-display text-2xl">
                <Ticket size={18} />
                アクティブなしおり
              </h2>
            </div>

            {isLoggedIn ? (
              <ActiveBookmarkCard
                userId={user!.id}
                bookmarks={bookmarksWithCounts}
                latestBookmarkId={latestBookmarkId}
                fallbackCoverImage={fallbackCoverImage}
                profileAvatarUrl={profileAvatarUrl}
                avatarInitial={avatarInitial}
              />
            ) : (
              <div className="border border-[var(--noir-border)] bg-white p-6 text-sm font-ui text-[var(--noir-muted)]">
                ログインして、アクティブなしおりを作りましょう。              </div>
            )}
          </section>

          <section>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="flex items-center gap-2 font-display text-2xl">
                <Compass size={18} />
                おすすめルート
              </h2>
              <Link
                href="/search"
                className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black"
              >
                すべて見る
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {curatedRoutes.map((route) => (
                <Link key={route.id} href={`/restaurant/${route.id}`} className="group flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)]">
                    <img
                      src={route.image}
                      alt={route.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <span className="border border-white/30 bg-black/50 px-2 py-1 text-[10px] font-ui uppercase tracking-[0.3em]">
                        {route.area}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-lg">{route.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {route.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-[var(--noir-border)] bg-white px-2 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section
            id="map-search"
            className="relative h-[360px] overflow-hidden border border-[var(--noir-border)] md:h-[480px]"
          >
            <InteractiveGoogleMap
              apiKey={mapApiKey}
              center={{ lat, lng }}
              markers={mapMarkers}
              className="h-full w-full rounded-none border-0"
            />
            <div className="pointer-events-none absolute inset-0 flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center border border-[var(--noir-border)] bg-white text-black">
                <MapPin size={22} />
              </div>
              <h3 className="font-display text-2xl text-[var(--noir-ink)]">
                地図で探す
              </h3>
              <p className="mt-2 text-sm font-ui text-[var(--noir-muted)]">
                周辺のスポットを地図で探索しよう。
              </p>
            </div>
            <div className="absolute bottom-4 right-4">
              <Link
                href="/map"
                className="pointer-events-auto inline-flex items-center gap-2 border border-black bg-white px-4 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
              >
                地図で探す
              </Link>
            </div>
          </section>
        </div>

        <div className="mx-auto flex max-w-[1400px] flex-col gap-16 px-4 md:px-8">
          <div id="nearby">
          {!nearbyRestaurants ? (
            <p className="text-sm font-ui text-[var(--noir-muted)]">
              {nearbyRestaurantsError}
            </p>
          ) : nearbyRestaurants.length > 0 ? (
            <Section
              title="近くのレストラン"
              expandedContent={
                <RestaurantList restaurants={nearbyRestaurants} />
              }
            >
              <CarouselContainer slideToShow={4}>
                {nearbyRestaurants.map((restaurant, index) => [
                  <RestaurantCard key={index} restaurant={restaurant} />,
                ])}
              </CarouselContainer>
            </Section>
          ) : (
            <p className="text-sm font-ui text-[var(--noir-muted)]">
              近くのレストランが見つかりませんでした。
            </p>
          )}

          </div>

          {!nearbyRamenRestaurants ? (
            <p className="text-sm font-ui text-[var(--noir-muted)]">
              {nearbyRamenRestaurantsError}
            </p>
          ) : nearbyRamenRestaurants.length > 0 ? (
            <Section
              title="近くのラーメン"
              expandedContent={
                <RestaurantList restaurants={nearbyRamenRestaurants} />
              }
            >
              <CarouselContainer slideToShow={4}>
                {nearbyRamenRestaurants.map((restaurant, index) => [
                  <RestaurantCard key={index} restaurant={restaurant} />,
                ])}
              </CarouselContainer>
            </Section>
          ) : (
            <p className="text-sm font-ui text-[var(--noir-muted)]">
              近くのラーメン店が見つかりませんでした。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
