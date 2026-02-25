import { NextResponse } from "next/server";
import { fetchPlaceDetailsExtended } from "@/lib/restaurants/details";
import { resolvePhotoUrls } from "@/lib/restaurants/utils";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId") ?? searchParams.get("place_id");
  const sessionToken = searchParams.get("sessionToken") ?? undefined;

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const { data, error } = await fetchPlaceDetailsExtended(placeId, sessionToken);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Place details unavailable" },
      { status: 500 }
    );
  }

  const resolvedImages = await resolvePhotoUrls(data.photoNames ?? [], 5);
  const photoUrls = resolvedImages.filter((url) => url !== "/no_image.png");
  const latitude = data.location?.latitude;
  const longitude = data.location?.longitude;

  const payload = {
    placeId,
    displayName: data.displayName ?? null,
    primaryType: data.primaryType ?? null,
    formattedAddress: data.formattedAddress ?? null,
    rating: data.rating ?? null,
    userRatingCount: data.userRatingCount ?? null,
    priceLevel: data.priceLevel ?? null,
    phoneNumber: data.phoneNumber ?? null,
    weekdayDescriptions: data.weekdayDescriptions ?? null,
    photoUrls,
    location:
      latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null,
  };

  if (latitude != null && longitude != null) {
    try {
      const supabase = await createClient();
      const { error: upsertError } = await supabase.from("places").upsert(
        {
          google_place_id: placeId,
          latitude,
          longitude,
          primary_type: data.primaryType ?? null,
          cached_name: data.displayName ?? null,
          cached_address_text: data.formattedAddress ?? null,
        },
        { onConflict: "google_place_id" }
      );

      if (upsertError) {
        console.error("Failed to upsert place.", upsertError);
      }
    } catch (upsertError) {
      console.error("Failed to upsert place.", upsertError);
    }
  }

  return NextResponse.json({ data: payload });
}
