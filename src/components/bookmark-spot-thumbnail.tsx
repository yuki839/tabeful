"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const photoCache = new Map<string, string | null>();

type BookmarkSpotThumbnailProps = {
  placeId?: string | null;
  placeName?: string | null;
  className?: string;
};

export default function BookmarkSpotThumbnail({
  placeId,
  placeName,
  className,
}: BookmarkSpotThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (!placeId) return null;
    return photoCache.get(placeId) ?? null;
  });
  const [isLoading, setIsLoading] = useState(
    Boolean(placeId && !photoCache.has(placeId))
  );

  useEffect(() => {
    if (!placeId) {
      setImageUrl(null);
      setIsLoading(false);
      return;
    }

    const cached = photoCache.get(placeId);
    if (cached !== undefined) {
      setImageUrl(cached);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadPhoto = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/restaurant/photos?placeId=${encodeURIComponent(placeId)}&count=1`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("Failed to load photo");
        }
        const payload = (await response.json()) as { images?: string[] };
        const nextUrl = payload.images?.[0] ?? null;
        photoCache.set(placeId, nextUrl);
        if (isActive) {
          setImageUrl(nextUrl);
        }
      } catch {
        photoCache.set(placeId, null);
        if (isActive) {
          setImageUrl(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadPhoto();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [placeId]);

  return (
    <div
      className={cn(
        "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100",
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={placeName ?? "Spot image"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 text-gray-400">
          <MapPin size={20} />
        </div>
      )}
      {isLoading ? (
        <div className="absolute inset-0 animate-pulse bg-white/40" />
      ) : null}
    </div>
  );
}
