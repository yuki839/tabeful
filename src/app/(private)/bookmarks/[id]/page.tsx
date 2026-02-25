import { createClient } from "@/utils/supabase/server";
import { fetchLocation, getPlaceDetails } from "@/lib/restaurants/api";
import { notFound, redirect } from "next/navigation";
import MocBookmarkApp, {
  type ShioriExportPayload,
} from "@/components/shiori/MocBookmarkApp";
import type {
  ItineraryItem,
  ShioriData,
} from "@/components/shiori-moc/types";

const MAX_MAP_MARKERS = 10;
const COVER_FALLBACK = "/no_image.png";
const ITEM_FALLBACK = "/no_image.png";

type PlaceRow = {
  google_place_id: string | null;
  cached_name: string | null;
  cached_address_text: string | null;
  primary_type: string | null;
  latitude: number | null;
  longitude: number | null;
};

type BookmarkItemRow = {
  id: string;
  sort_order: number | null;
  place_id: string | null;
  visit_time?: string | null;
  places: PlaceRow | null;
};

const formatDate = (value?: string | null, fallback?: string | null) => {
  const dateValue = value ?? fallback ?? "";
  if (!dateValue) {
    return "--.--.--";
  }
  const iso = dateValue.split("T")[0];
  return iso.replace(/-/g, ".");
};

const formatTime = (index: number) => {
  const baseMinutes = 10 * 60;
  const stepMinutes = 90;
  const total = baseMinutes + index * stepMinutes;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const toCategory = (
  primaryType?: string | null
): ItineraryItem["category"] => {
  if (!primaryType) return "food";
  if (
    primaryType.includes("restaurant") ||
    primaryType.includes("cafe") ||
    primaryType.includes("bar") ||
    primaryType.includes("bakery") ||
    primaryType.includes("food")
  ) {
    return "food";
  }
  if (
    primaryType.includes("store") ||
    primaryType.includes("shopping") ||
    primaryType.includes("mall") ||
    primaryType.includes("supermarket")
  ) {
    return "shop";
  }
  if (
    primaryType.includes("station") ||
    primaryType.includes("subway") ||
    primaryType.includes("train") ||
    primaryType.includes("bus") ||
    primaryType.includes("airport") ||
    primaryType.includes("transport")
  ) {
    return "transport";
  }
  return "sightseeing";
};

export default async function BookmarkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id, title, area, travel_date, created_at, cover_image_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    notFound();
  }

  const coverImagePath = bookmark.cover_image_path;
  let coverImageUrl: string | null = null;
    if (typeof coverImagePath === "string" && coverImagePath.length > 0) {
      try {
        const { data, error } = await supabase.storage
          .from("album-photos")
          .createSignedUrl(coverImagePath, 60 * 60);
        if (error) {
          console.error("Failed to create cover signed URL.", error);
        } else {
          coverImageUrl = data?.signedUrl ?? null;
        }
      } catch (error) {
        console.error("Failed to create cover signed URL.", error);
      }
    }

  let itemsError: unknown | null = null;
  let items: BookmarkItemRow[] | null = null;

  const itemsResponse = await supabase
    .from("bookmark_items")
    .select(
      "id, sort_order, place_id, visit_time, places ( google_place_id, cached_name, cached_address_text, primary_type, latitude, longitude )"
    )
    .eq("bookmark_id", bookmark.id)
    .order("sort_order", { ascending: true });
  items = itemsResponse.data as BookmarkItemRow[] | null;
  itemsError = itemsResponse.error ?? null;

  if (itemsError) {
    const fallbackResponse = await supabase
      .from("bookmark_items")
      .select(
        "id, sort_order, place_id, places ( google_place_id, cached_name, cached_address_text, primary_type, latitude, longitude )"
      )
      .eq("bookmark_id", bookmark.id)
      .order("sort_order", { ascending: true });
    items = fallbackResponse.data as BookmarkItemRow[] | null;
  }

  const { lat, lng } = await fetchLocation();
  const bookmarkId = String(bookmark.id);
  const safeItems = items ?? [];

  const savedPlaceIds = safeItems
    .map((item) => {
      const place = item.places as { google_place_id: string | null } | null;
      return place?.google_place_id ?? null;
    })
    .filter((placeId): placeId is string => Boolean(placeId));

  const uniquePlaceIds = Array.from(new Set(savedPlaceIds));
  const placeDetailEntries = await Promise.all(
    uniquePlaceIds.map(async (placeId) => {
      try {
        const result = await getPlaceDetails(placeId, [
          "photos",
          "formattedAddress",
        ]);
        return [
          placeId,
          {
            photoUrl: result?.data?.photoUrl ?? ITEM_FALLBACK,
            formattedAddress: result?.data?.formattedAddress ?? null,
          },
        ] as const;
      } catch (error) {
        console.error("Failed to load place photo for shiori.", error);
        return [
          placeId,
          { photoUrl: ITEM_FALLBACK, formattedAddress: null },
        ] as const;
      }
    })
  );

  const photoUrlByPlaceId = placeDetailEntries.reduce<Record<string, string>>(
    (acc, [placeId, detail]) => {
      acc[placeId] = detail.photoUrl;
      return acc;
    },
    {}
  );

  const formattedAddressByPlaceId = placeDetailEntries.reduce<
    Record<string, string | null>
  >((acc, [placeId, detail]) => {
    acc[placeId] = detail.formattedAddress;
    return acc;
  }, {});

  const mapPoints = safeItems
    .map((item) => {
      const place = item.places as PlaceRow | null;
      return {
        placeId: place?.google_place_id ?? null,
        lat: place?.latitude ?? null,
        lng: place?.longitude ?? null,
      };
    })
    .filter(
      (point): point is { placeId: string | null; lat: number; lng: number } =>
        typeof point.lat === "number" && typeof point.lng === "number"
    );

  const mapMarkerPoints = mapPoints.slice(0, MAX_MAP_MARKERS);
  const mapCenter = mapMarkerPoints.length
    ? {
        lat:
          mapMarkerPoints.reduce((sum, point) => sum + point.lat, 0) /
          mapMarkerPoints.length,
        lng:
          mapMarkerPoints.reduce((sum, point) => sum + point.lng, 0) /
          mapMarkerPoints.length,
      }
    : { lat, lng };

  const mapImageUrl = mapMarkerPoints.length
    ? (() => {
        const params = new URLSearchParams({
          lat: mapCenter.lat.toString(),
          lng: mapCenter.lng.toString(),
          zoom: "13",
          size: "1200x800",
          maptype: "satellite",
        });
        mapMarkerPoints.forEach((marker, index) => {
          const label = String.fromCharCode(65 + index);
          params.append(
            "markers",
            `color:0x111111|label:${label}|${marker.lat},${marker.lng}`
          );
        });
        return `/api/maps/static?${params.toString()}`;
      })()
    : null;
  const mapMarkers = mapMarkerPoints.map((marker, index) => ({
    id: marker.placeId ?? `marker-${index}`,
    lat: marker.lat,
    lng: marker.lng,
    placeId: marker.placeId ?? null,
  }));

  const directionPoints = mapMarkerPoints;
  const mapLinkUrl =
    directionPoints.length >= 2
      ? (() => {
          const params = new URLSearchParams({
            api: "1",
            travelmode: "walking",
          });
          const origin = `${directionPoints[0].lat},${directionPoints[0].lng}`;
          const destination = `${directionPoints[directionPoints.length - 1].lat},${directionPoints[directionPoints.length - 1].lng}`;
          params.set("origin", origin);
          params.set("destination", destination);
          if (directionPoints.length > 2) {
            params.set(
              "waypoints",
              directionPoints
                .slice(1, -1)
                .map((point) => `${point.lat},${point.lng}`)
                .join("|")
            );
          }
          return `https://www.google.com/maps/dir/?${params.toString()}`;
        })()
      : `https://www.google.com/maps/@?api=1&map_action=map&center=${mapCenter.lat},${mapCenter.lng}&zoom=14`;

  const mapEmbedUrl =
    directionPoints.length >= 2
      ? (() => {
          const params = new URLSearchParams({
            origin: `${directionPoints[0].lat},${directionPoints[0].lng}`,
            destination: `${directionPoints[directionPoints.length - 1].lat},${directionPoints[directionPoints.length - 1].lng}`,
            mode: "walking",
            maptype: "satellite",
          });
          if (directionPoints.length > 2) {
            params.set(
              "waypoints",
              directionPoints
                .slice(1, -1)
                .map((point) => `${point.lat},${point.lng}`)
                .join("|")
            );
          }
          return `/api/maps/embed?${params.toString()}`;
        })()
      : (() => {
          const params = new URLSearchParams({
            lat: mapCenter.lat.toString(),
            lng: mapCenter.lng.toString(),
            zoom: "14",
            maptype: "satellite",
          });
          return `/api/maps/embed?${params.toString()}`;
        })();

  const itineraryItems: ItineraryItem[] = safeItems.map((item, index) => {
    const place = item.places as PlaceRow | null;
    const placeId = place?.google_place_id ?? undefined;
    const formattedAddress = placeId ? formattedAddressByPlaceId[placeId] : null;
    const address = place?.cached_address_text ?? formattedAddress ?? "住所未設定";
    const imageUrl =
      placeId && photoUrlByPlaceId[placeId]
        ? photoUrlByPlaceId[placeId]
        : ITEM_FALLBACK;
    const visitTime = item.visit_time ?? null;
    const resolvedTime = visitTime && visitTime.trim().length > 0
      ? visitTime
      : formatTime(index);

    return {
      id: String(item.id),
      bookmarkItemId: String(item.id),
      placeId,
      time: resolvedTime,
      title: place?.cached_name ?? "スポット未設定",
      description: address,
      category: toCategory(place?.primary_type),
      imageUrl,
      address,
      lat: place?.latitude ?? null,
      lng: place?.longitude ?? null,
      priceRange: "-",
    };
  });

  const shioriData: ShioriData = {
    title: bookmark.title,
    date: formatDate(bookmark.travel_date, bookmark.created_at),
    coverImage: coverImageUrl ?? COVER_FALLBACK,
    items: itineraryItems,
  };
  const exportItems = safeItems
    .map((item, index) => {
      const place = item.places as PlaceRow | null;
      const placeId = place?.google_place_id ?? null;
      if (!placeId) {
        return null;
      }
      const formattedAddress = formattedAddressByPlaceId[placeId] ?? null;
      return {
        sortOrder: item.sort_order ?? index + 1,
        place: {
          googlePlaceId: placeId,
          name: place?.cached_name ?? null,
          primaryType: place?.primary_type ?? null,
          address: place?.cached_address_text ?? formattedAddress ?? null,
          lat: place?.latitude ?? null,
          lng: place?.longitude ?? null,
        },
      };
    })
    .filter(Boolean) as ShioriExportPayload["items"];
  const exportPayload: ShioriExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmark: {
      title: bookmark.title,
      area: bookmark.area ?? null,
      date: bookmark.travel_date ?? null,
      coverImagePath: bookmark.cover_image_path ?? null,
    },
    items: exportItems,
  };
  const mapApiKey = process.env.GOOGLE_API_KEY ?? "";

  return (
    <MocBookmarkApp
      data={shioriData}
      bookmarkId={bookmarkId}
      userId={user.id}
      bookmarkTitle={bookmark.title}
      bookmarkArea={bookmark.area ?? null}
      bookmarkDate={bookmark.travel_date ?? null}
      savedPlaceIds={savedPlaceIds}
      searchLat={lat}
      searchLng={lng}
      mapImageUrl={mapImageUrl}
      mapEmbedUrl={mapEmbedUrl}
      mapLinkUrl={mapLinkUrl}
      mapApiKey={mapApiKey}
      mapCenter={mapCenter}
      mapMarkers={mapMarkers}
      exportPayload={exportPayload}
    />
  );
}

