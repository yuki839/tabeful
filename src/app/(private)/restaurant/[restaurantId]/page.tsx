import StoreDetailDesign, { type StoreDetailData } from "@/components/store-detail-design";
import {
  fetchPlaceDetailsExtended,
  type PlaceDetailsExtended,
  type PlaceDetailsReview,
} from "@/lib/restaurants/details";
import { resolvePhotoUrls } from "@/lib/restaurants/utils";
import { createClient } from "@/utils/supabase/server";

const formatReviews = (
  reviews: PlaceDetailsReview[] | undefined,
  placeId: string
) => {
  if (!reviews?.length) {
    return [];
  }

  return reviews
    .map((review, index) => ({
      id: review.publishTime ?? `${placeId}-${index}`,
      user: review.authorName ?? "",
      rating: review.rating ?? 0,
      comment: review.text ?? "",
      date: review.publishTime ?? "",
      avatar: review.authorPhotoUrl ?? "/no_image.png",
    }))
    .filter(
      (review) => review.user.trim().length > 0 && review.comment.trim().length > 0
    );
};

const formatOpeningHours = (weekdayDescriptions: string[] | undefined) => {
  if (!weekdayDescriptions?.length) {
    return "営業時間は未設定です。";
  }

  return weekdayDescriptions.join("\n");
};

const formatPriceRange = (priceLevel: string | undefined) => {
  if (!priceLevel) {
    return "-";
  }

  const normalized = priceLevel.toUpperCase();
  const levelMap: Record<string, number> = {
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  const mapped = levelMap[normalized];
  const numeric =
    Number.isFinite(Number(priceLevel)) && Number(priceLevel) > 0
      ? Number(priceLevel)
      : mapped;

  if (!numeric || numeric < 1) {
    return "-";
  }

  return "\u00a5".repeat(Math.min(numeric, 4));
};

const PRIMARY_TYPE_LABELS: Record<string, string> = {
  japanese_restaurant: "和食",
  cafe: "カフェ",
  cafeteria: "カフェテリア",
  coffee_shop: "コーヒーショップ",
  chinese_restaurant: "中華料理",
  fast_food_restaurant: "ファストフード",
  hamburger_restaurant: "ハンバーガー",
  french_restaurant: "フレンチ",
  italian_restaurant: "イタリアン",
  pizza_restaurant: "ピザ",
  ramen_restaurant: "ラーメン",
  sushi_restaurant: "寿司",
  korean_restaurant: "韓国料理",
  indian_restaurant: "インド料理",
  bar: "バー",
  bakery: "ベーカリー",
  steak_house: "ステーキ",
  barbecue_restaurant: "焼肉",
  izakaya: "居酒屋",
  yakitori_restaurant: "焼き鳥",
};

const formatPrimaryType = (value: string | undefined) => {
  if (!value) return "";
  const mapped = PRIMARY_TYPE_LABELS[value];
  if (mapped) return mapped;
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

type FeatureKey = keyof Pick<
  PlaceDetailsExtended,
  | "takeout"
  | "delivery"
  | "dineIn"
  | "reservable"
  | "servesBeer"
  | "servesWine"
  | "servesBreakfast"
  | "servesBrunch"
  | "servesLunch"
  | "servesDinner"
  | "servesVegetarianFood"
  | "outdoorSeating"
  | "liveMusic"
  | "goodForChildren"
  | "goodForGroups"
  | "wheelchairAccessibleEntrance"
>;

const FEATURE_LABELS: Array<{ key: FeatureKey; label: string }> = [
  { key: "takeout", label: "テイクアウト" },
  { key: "delivery", label: "デリバリー" },
  { key: "dineIn", label: "店内飲食" },
  { key: "reservable", label: "予約可" },
  { key: "servesBeer", label: "ビール提供" },
  { key: "servesWine", label: "ワイン提供" },
  { key: "servesBreakfast", label: "朝食" },
  { key: "servesBrunch", label: "ブランチ" },
  { key: "servesLunch", label: "ランチ" },
  { key: "servesDinner", label: "ディナー" },
  { key: "servesVegetarianFood", label: "ベジタリアン対応" },
  { key: "outdoorSeating", label: "テラス席" },
  { key: "liveMusic", label: "ライブ音楽" },
  { key: "goodForChildren", label: "子連れOK" },
  { key: "goodForGroups", label: "グループOK" },
  { key: "wheelchairAccessibleEntrance", label: "車椅子対応" },
];

const buildFeatureChips = (details: PlaceDetailsExtended | undefined) => {
  if (!details) return [];
  return FEATURE_LABELS.filter((item) => Boolean(details[item.key])).map(
    (item) => item.label
  );
};

export default async function RestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ restaurantId: string }>;
  searchParams: Promise<{ sessionToken?: string; save?: string }>;
}) {
  const { restaurantId } = await params;
  const { sessionToken, save } = await searchParams;
  const { data: placeDetails } = await fetchPlaceDetailsExtended(
    restaurantId,
    sessionToken
  );

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user) && !userError;
  const bookmarks = isLoggedIn
    ? await supabase
        .from("bookmarks")
        .select("id, title, area, travel_date, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
    : {
        data: [] as Array<{
          id: string;
          title: string;
          area: string | null;
          travel_date: string | null;
          created_at: string;
        }>,
      };
  const bookmarkRows = bookmarks.data ?? [];
  const bookmarkIds = bookmarkRows.map((bookmark) => String(bookmark.id));
  const placeRowId = isLoggedIn && bookmarkIds.length > 0 ? restaurantId : undefined;
  const savedBookmarkIds =
    isLoggedIn && bookmarkIds.length > 0 && placeRowId != null
      ? (
          await supabase
            .from("bookmark_items")
            .select("bookmark_id")
            .eq("place_id", placeRowId)
            .in("bookmark_id", bookmarkIds)
        ).data?.map((item) => String(item.bookmark_id)) ?? []
      : [];

  const resolvedImages = await resolvePhotoUrls(placeDetails?.photoNames ?? [], 5);
  const seenImages = new Set<string>();
  const realImages = resolvedImages
    .filter((url) => url !== "/no_image.png")
    .filter((url) => {
      if (seenImages.has(url)) {
        return false;
      }
      seenImages.add(url);
      return true;
    });
  const images = realImages.length > 0 ? realImages : resolvedImages;
  const latitude = placeDetails?.location?.latitude;
  const longitude = placeDetails?.location?.longitude;
  const location =
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;

  const storeData: StoreDetailData = {
    id: restaurantId,
    name: placeDetails?.displayName ?? "",
    japaneseName: placeDetails?.displayName ?? "",
    category: formatPrimaryType(placeDetails?.primaryType),
    rating: placeDetails?.rating ?? null,
    reviewCount: placeDetails?.userRatingCount ?? null,
    priceRange: formatPriceRange(placeDetails?.priceLevel),
    address: placeDetails?.formattedAddress ?? "",
    hours: formatOpeningHours(placeDetails?.weekdayDescriptions),
    phone: placeDetails?.phoneNumber ?? "",
    description: placeDetails?.editorialSummary ?? "",
    images,
    features: buildFeatureChips(placeDetails),
    location,
    reviews: formatReviews(placeDetails?.reviews, restaurantId),
  };

  return (
    <StoreDetailDesign
      data={storeData}
      sessionToken={sessionToken}
      isLoggedIn={isLoggedIn}
      bookmarks={bookmarkRows}
      savedBookmarkIds={savedBookmarkIds}
      autoOpenBookmarkModal={save === "1"}
    />
  );
}

