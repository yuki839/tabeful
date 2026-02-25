import { NextResponse } from "next/server";
import { fetchPlaceDetailsExtended } from "@/lib/restaurants/details";
import { resolvePhotoUrls } from "@/lib/restaurants/utils";

const DEFAULT_COUNT = 10;
const MAX_COUNT = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");
  const sessionToken = searchParams.get("sessionToken") ?? undefined;
  const countParam = Number(searchParams.get("count"));
  const count = Number.isFinite(countParam)
    ? Math.min(Math.max(Math.floor(countParam), 1), MAX_COUNT)
    : DEFAULT_COUNT;

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const { data, error } = await fetchPlaceDetailsExtended(placeId, sessionToken);
  if (error || !data) {
    return NextResponse.json({ images: [] }, { status: 200 });
  }

  const resolvedImages = await resolvePhotoUrls(data.photoNames ?? [], count);
  const seenImages = new Set<string>();
  const images = resolvedImages
    .filter((url) => url !== "/no_image.png")
    .filter((url) => {
      if (seenImages.has(url)) {
        return false;
      }
      seenImages.add(url);
      return true;
    });

  return NextResponse.json({ images }, { status: 200 });
}
