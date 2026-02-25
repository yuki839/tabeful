import { NextRequest, NextResponse } from "next/server";
import { fetchNearbyRestaurants } from "@/lib/restaurants/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius")) || 1200;
  const typesParam = searchParams.get("types");
  const types = typesParam
    ? typesParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
  }

  if (!Number.isFinite(radius) || radius <= 0) {
    return NextResponse.json({ error: "Invalid radius" }, { status: 400 });
  }

  const { data, error } = await fetchNearbyRestaurants(lat, lng, {
    radius,
    types,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ data });
}
