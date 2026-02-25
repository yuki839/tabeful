import { NextResponse } from "next/server";

const DEFAULT_LAT = 35.31;
const DEFAULT_LNG = 139.54;
const DEFAULT_ZOOM = 14;
const DEFAULT_SIZE = "800x400";
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
  const size = searchParams.get("size") || DEFAULT_SIZE;
  const maptype = searchParams.get("maptype") || DEFAULT_MAPTYPE;
  const markers = searchParams.getAll("markers").filter(Boolean);

  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", `${lat},${lng}`);
  url.searchParams.set("zoom", `${zoom}`);
  url.searchParams.set("size", size);
  url.searchParams.set("maptype", maptype);
  url.searchParams.set("sensor", "false");
  if (markers.length > 0) {
    markers.forEach((marker) => url.searchParams.append("markers", marker));
  } else {
    url.searchParams.append("markers", `color:0xd9466e|${lat},${lng}`);
  }
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Static map fetch failed:", response.status, errorText);
    return NextResponse.json(
      { error: "Static map fetch failed" },
      { status: response.status }
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
    },
  });
}
