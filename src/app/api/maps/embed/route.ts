import { NextResponse } from "next/server";

const DEFAULT_LAT = 35.31;
const DEFAULT_LNG = 139.54;
const DEFAULT_ZOOM = 16;
const DEFAULT_MAPTYPE = "roadmap";

export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GOOGLE_API_KEY" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat")) || DEFAULT_LAT;
  const lng = Number(searchParams.get("lng")) || DEFAULT_LNG;
  const zoom = Number(searchParams.get("zoom")) || DEFAULT_ZOOM;
  const maptype = searchParams.get("maptype") || DEFAULT_MAPTYPE;
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const waypoints = searchParams.get("waypoints");
  const mode = searchParams.get("mode");

  const url =
    origin && destination
      ? new URL("https://www.google.com/maps/embed/v1/directions")
      : new URL("https://www.google.com/maps/embed/v1/place");
  url.searchParams.set("key", apiKey);
  if (origin && destination) {
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    if (waypoints) {
      url.searchParams.set("waypoints", waypoints);
    }
    if (mode) {
      url.searchParams.set("mode", mode);
    }
  } else {
    url.searchParams.set("q", `${lat},${lng}`);
    url.searchParams.set("zoom", `${zoom}`);
  }
  url.searchParams.set("maptype", maptype);
  url.searchParams.set("language", "ja");

  return NextResponse.redirect(url.toString(), {
    status: 302,
  });
}
