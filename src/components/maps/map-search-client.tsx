"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Search,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";
import InteractiveGoogleMap, { type MapMarker } from "@/components/maps/interactive-google-map";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  addBookmarkItemAction,
  createBookmarkAndAddItemAction,
} from "@/app/(private)/actions/bookmarkActions";
import type { AddressSuggestion, Restaurant, RestaurantSuggestion } from "@/types";
import { cn } from "@/lib/utils";

const DEFAULT_RADIUS = 1200;
const DEFAULT_TYPES = ["restaurant", "cafe", "bar"];

type LatLng = { lat: number; lng: number };

type BookmarkSummary = {
  id: string;
  title: string;
  area: string | null;
  travel_date: string | null;
  created_at: string;
};

type PlaceDetailsPayload = {
  placeId: string;
  displayName: string | null;
  primaryType: string | null;
  formattedAddress: string | null;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: string | null;
  phoneNumber: string | null;
  weekdayDescriptions: string[] | null;
  photoUrls: string[];
  location: LatLng | null;
};

interface MapSearchClientProps {
  apiKey?: string | null;
  defaultCenter: LatLng;
  defaultRadius?: number;
  bookmarks?: BookmarkSummary[];
  isLoggedIn?: boolean;
  loginHref?: string;
}

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceKm = (from: LatLng, to: LatLng) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number) => {
  if (!Number.isFinite(km)) return null;
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

const formatLatLng = (center: LatLng) =>
  `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;

const formatPrimaryType = (value: string | null | undefined) => {
  if (!value) return null;
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatPriceLevel = (priceLevel: string | null | undefined) => {
  if (!priceLevel) return null;
  const normalized = priceLevel.toUpperCase();
  const levelMap: Record<string, number> = {
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  const numeric =
    Number.isFinite(Number(priceLevel)) && Number(priceLevel) > 0
      ? Number(priceLevel)
      : levelMap[normalized];
  if (!numeric || numeric < 1) return null;
  return "¥".repeat(Math.min(numeric, 4));
};

const formatWeekdayDescriptions = (values: string[] | null | undefined) => {
  if (!values || values.length === 0) return null;
  return values.join(" / ");
};

export default function MapSearchClient({
  apiKey,
  defaultCenter,
  defaultRadius = DEFAULT_RADIUS,
  bookmarks = [],
  isLoggedIn = false,
  loginHref = "/login",
}: MapSearchClientProps) {
  const [mapCenter, setMapCenter] = useState<LatLng>(defaultCenter);
  const [searchCenter, setSearchCenter] = useState<LatLng>(defaultCenter);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [toast, setToast] = useState<{ message: string; href?: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [centerLabel, setCenterLabel] = useState<string>(formatLatLng(defaultCenter));
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<AddressSuggestion[]>(
    []
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [sessionToken, setSessionToken] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [detailsByPlaceId, setDetailsByPlaceId] = useState<
    Record<string, PlaceDetailsPayload>
  >({});
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [bookmarkQuery, setBookmarkQuery] = useState("");
  const [bookmarkOptions, setBookmarkOptions] = useState<BookmarkSummary[]>(bookmarks);
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    area: "",
    travelDate: "",
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [savedBookmarkMap, setSavedBookmarkMap] = useState<Record<string, string[]>>(
    {}
  );
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const centerUpdateSourceRef = useRef<"program" | null>(null);

  const ensureSessionToken = useCallback(() => {
    if (sessionToken) return sessionToken;
    const next = uuidv4();
    setSessionToken(next);
    return next;
  }, [sessionToken]);

  const updateMapCenter = useCallback((nextCenter: LatLng, label?: string | null) => {
    centerUpdateSourceRef.current = "program";
    setMapCenter(nextCenter);
    setCenterLabel(label ?? formatLatLng(nextCenter));
  }, []);

  const markers = useMemo<MapMarker[]>(
    () =>
      restaurants
        .map((restaurant) =>
          restaurant.location
            ? {
                id: restaurant.id,
                lat: restaurant.location.lat,
                lng: restaurant.location.lng,
                title: restaurant.restaurantName ?? null,
                placeId: restaurant.id,
              }
            : null
        )
        .filter(Boolean) as MapMarker[],
    [restaurants]
  );

  const results = useMemo(() => {
    return restaurants.map((restaurant) => {
      const details = detailsByPlaceId[restaurant.id];
      const distance =
        restaurant.location && searchCenter
          ? distanceKm(searchCenter, restaurant.location)
          : null;
      return {
        ...restaurant,
        displayName: details?.displayName ?? restaurant.restaurantName ?? "スポット",
        primaryType: details?.primaryType ?? restaurant.primaryType,
        rating: details?.rating ?? restaurant.rating,
        photoUrl: details?.photoUrls?.[0] ?? restaurant.photoUrl,
        distanceLabel: distance != null ? formatDistance(distance) : null,
      };
    });
  }, [restaurants, searchCenter, detailsByPlaceId]);

  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    return restaurants.find((restaurant) => restaurant.id === selectedPlaceId) ?? null;
  }, [restaurants, selectedPlaceId]);

  const selectedDetails = selectedPlaceId ? detailsByPlaceId[selectedPlaceId] : null;

  const selectedPlaceName =
    selectedDetails?.displayName ??
    selectedPlace?.restaurantName ??
    selectedPlaceId ??
    "スポット";

  const selectedPlaceAddress = selectedDetails?.formattedAddress ?? "";

  const selectedPrimaryType =
    selectedDetails?.primaryType ?? selectedPlace?.primaryType ?? null;

  const selectedRating = selectedDetails?.rating ?? selectedPlace?.rating ?? null;

  const selectedPhotoUrls =
    selectedDetails?.photoUrls?.length
      ? selectedDetails.photoUrls
      : selectedPlace?.photoUrl
        ? [selectedPlace.photoUrl]
        : [];

  const selectedWeekdayDescriptions = formatWeekdayDescriptions(
    selectedDetails?.weekdayDescriptions ?? null
  );

  const selectedPriceLevel = formatPriceLevel(selectedDetails?.priceLevel);

  const savedBookmarkIdsForPlace = useMemo(() => {
    if (!selectedPlaceId) return new Set<string>();
    return new Set(savedBookmarkMap[selectedPlaceId] ?? []);
  }, [savedBookmarkMap, selectedPlaceId]);

  const filteredBookmarks = useMemo(() => {
    const query = bookmarkQuery.trim().toLowerCase();
    if (!query) return bookmarkOptions;
    return bookmarkOptions.filter((bookmark) =>
      bookmark.title.toLowerCase().includes(query)
    );
  }, [bookmarkOptions, bookmarkQuery]);

  const markSaved = useCallback((placeId: string, bookmarkId: string) => {
    setSavedBookmarkMap((current) => {
      const nextSet = new Set(current[placeId] ?? []);
      nextSet.add(bookmarkId);
      return { ...current, [placeId]: Array.from(nextSet) };
    });
  }, []);
  const performSearch = useCallback(
    async (center: LatLng) => {
      setIsSearching(true);
      setError(null);
      setSearchCenter(center);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          lat: center.lat.toString(),
          lng: center.lng.toString(),
          radius: defaultRadius.toString(),
          types: DEFAULT_TYPES.join(","),
        });
        const response = await fetch(`/api/restaurant/nearby?${params.toString()}`);
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Search failed");
        }
        setRestaurants(payload?.data ?? []);
      } catch {
        setError("検索に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setIsSearching(false);
      }
    },
    [defaultRadius]
  );

  const handleSearch = useCallback(() => {
    void performSearch(mapCenter);
  }, [mapCenter, performSearch]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoMessage("位置情報を取得できません。既定の地点に戻しました。");
      setToast({ message: "現在地を取得できませんでした。" });
      updateMapCenter(defaultCenter);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        updateMapCenter(nextCenter, "現在地");
        setGeoMessage(null);
        setToast({ message: "現在地を取得しました。" });
        setIsLocating(false);
      },
      () => {
        setGeoMessage("位置情報が許可されていません。手動で場所を変更できます。");
        setToast({ message: "現在地を取得できませんでした。" });
        updateMapCenter(defaultCenter);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [defaultCenter, updateMapCenter]);

  const handleCenterChanged = useCallback((nextCenter: LatLng) => {
    setMapCenter((prev) => {
      const delta =
        Math.abs(prev.lat - nextCenter.lat) + Math.abs(prev.lng - nextCenter.lng);
      return delta > 0.00001 ? nextCenter : prev;
    });

    if (centerUpdateSourceRef.current === "program") {
      centerUpdateSourceRef.current = null;
      return;
    }
    setCenterLabel(formatLatLng(nextCenter));
  }, []);

  const fetchLocationSuggestions = useDebouncedCallback(
    async (input: string) => {
      if (!input.trim()) {
        setLocationSuggestions([]);
        return;
      }

      setLocationError(null);
      try {
        const token = ensureSessionToken();
        const response = await fetch(
          `/api/address/autocomplete?input=${encodeURIComponent(
            input
          )}&sessionToken=${token}`
        );
        if (!response.ok) {
          const payload = await response.json();
          setLocationError(payload?.error ?? "検索に失敗しました。");
          return;
        }
        const data: AddressSuggestion[] = await response.json();
        setLocationSuggestions(data);
      } catch {
        setLocationError("場所の検索に失敗しました。");
      } finally {
        setLocationLoading(false);
      }
    },
    500
  );

  const handleSelectLocation = useCallback(
    async (suggestion: AddressSuggestion) => {
      const placeId = suggestion.placeId?.trim();
      if (!placeId) {
        setLocationError("場所が見つかりませんでした。");
        return;
      }

      setLocationLoading(true);
      setLocationError(null);

      try {
        const token = ensureSessionToken();
        const response = await fetch(
          `/api/restaurant/details?placeId=${placeId}&sessionToken=${token}`
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Location fetch failed");
        }
        const details = payload?.data as PlaceDetailsPayload | undefined;
        const location = details?.location;
        if (!location) {
          setLocationError("場所の座標を取得できませんでした。");
          return;
        }
        if (details) {
          setDetailsByPlaceId((current) => ({ ...current, [placeId]: details }));
        }
        updateMapCenter(location, suggestion.placeName ?? details?.displayName ?? null);
        setLocationModalOpen(false);
        setLocationInput("");
        setLocationSuggestions([]);
        await performSearch(location);
      } catch {
        setLocationError("場所の取得に失敗しました。");
      } finally {
        setLocationLoading(false);
      }
    },
    [ensureSessionToken, performSearch, updateMapCenter]
  );

  const ensurePlaceDetails = useCallback(
    async (placeId: string) => {
      if (detailsByPlaceId[placeId]) {
        return;
      }
      setDetailsError(null);
      setDetailsLoadingId(placeId);
      try {
        const token = ensureSessionToken();
        const response = await fetch(
          `/api/restaurant/details?placeId=${placeId}&sessionToken=${token}`
        );
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Details fetch failed");
        }
        const details = payload?.data as PlaceDetailsPayload | undefined;
        if (details) {
          setDetailsByPlaceId((current) => ({ ...current, [placeId]: details }));
          setRestaurants((current) =>
            current.map((restaurant) => {
              if (restaurant.id !== placeId) return restaurant;
              const nextRating =
                details.rating != null ? details.rating : restaurant.rating;
              return {
                ...restaurant,
                restaurantName: details.displayName ?? restaurant.restaurantName,
                primaryType: details.primaryType ?? restaurant.primaryType,
                rating: nextRating,
                location: details.location ?? restaurant.location,
                photoUrl:
                  details.photoUrls?.[0] ?? restaurant.photoUrl ?? "/no_image.png",
              };
            })
          );
        }
      } catch {
        setDetailsError("詳細情報の取得に失敗しました。");
      } finally {
        setDetailsLoadingId(null);
      }
    },
    [detailsByPlaceId, ensureSessionToken]
  );

  const openPlaceSheet = useCallback(
    (placeId: string) => {
      setSelectedPlaceId(placeId);
      setQuickSheetOpen(true);
      void ensurePlaceDetails(placeId);
    },
    [ensurePlaceDetails]
  );

  const openBookmarkModal = useCallback(
    (placeId: string) => {
      setSelectedPlaceId(placeId);
      if (!isLoggedIn) {
        setLoginPromptOpen(true);
        return;
      }
      setModalError(null);
      setBookmarkModalOpen(true);
    },
    [isLoggedIn]
  );

  const addPlaceToBookmark = useCallback(
    async (bookmark: BookmarkSummary) => {
      if (!selectedPlaceId || activeSaveId) return;
      setModalError(null);
      setActiveSaveId(bookmark.id);

      try {
        const suggestion: RestaurantSuggestion = {
          type: "placePrediction",
          placeId: selectedPlaceId,
          placeName: selectedPlaceName,
        };
        const token = ensureSessionToken();
        const result = await addBookmarkItemAction(bookmark.id, suggestion, token);
        markSaved(selectedPlaceId, bookmark.id);
        const message =
          result.status === "existing"
            ? `${bookmark.title} は追加済みです`
            : `${bookmark.title} に追加しました`;
        setToast({ message, href: `/bookmarks/${bookmark.id}` });
      } catch {
        console.error("Failed to add bookmark item.", error);
        setModalError("しおりに追加できませんでした。");
      } finally {
        setActiveSaveId(null);
      }
    },
    [activeSaveId, ensureSessionToken, markSaved, selectedPlaceId, selectedPlaceName]
  );

  const createBookmarkAndAdd = useCallback(async () => {
    if (!selectedPlaceId || isCreatingBookmark) return;
    const title = createForm.title.trim();
    if (!title) {
      setModalError("タイトルを入力してください。");
      return;
    }

    setIsCreatingBookmark(true);
    setModalError(null);

    try {
      const token = ensureSessionToken();
      const result = await createBookmarkAndAddItemAction({
        title,
        area: createForm.area,
        travelDate: createForm.travelDate,
        placeId: selectedPlaceId,
        placeName: selectedPlaceName,
        sessionToken: token,
      });

      setBookmarkOptions((current) => [result.bookmark, ...current]);
      markSaved(selectedPlaceId, result.bookmark.id);
      setCreateForm({ title: "", area: "", travelDate: "" });
      setBookmarkQuery("");
      const message =
        result.status === "existing"
          ? `${result.bookmark.title} は追加済みです`
          : `${result.bookmark.title} に追加しました`;
      setToast({ message, href: `/bookmarks/${result.bookmark.id}` });
    } catch {
      console.error("Failed to create bookmark.", error);
      setModalError("しおりを作成できませんでした。");
    } finally {
      setIsCreatingBookmark(false);
    }
  }, [
    createForm.area,
    createForm.title,
    createForm.travelDate,
    ensureSessionToken,
    isCreatingBookmark,
    markSaved,
    selectedPlaceId,
    selectedPlaceName,
  ]);

  useEffect(() => {
    setBookmarkOptions(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    if (!locationInput.trim()) {
      setLocationSuggestions([]);
      setLocationError(null);
      setLocationLoading(false);
      return;
    }
    setLocationLoading(true);
    fetchLocationSuggestions(locationInput);
  }, [fetchLocationSuggestions, locationInput]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mapHeightClass =
    "h-[60vh] min-h-[340px] md:h-[calc(100vh-4rem-8rem)]";

  return (
    <section className="flex flex-col gap-4 md:flex-row md:gap-6">
      <div className="relative flex-1">
        <div
          className={cn(
            "relative overflow-hidden border border-[var(--noir-border)]",
            mapHeightClass
          )}
        >
          <InteractiveGoogleMap
            apiKey={apiKey}
            center={mapCenter}
            markers={markers}
            className="h-full w-full rounded-none border-0"
            onCenterChanged={handleCenterChanged}
            onMarkerClick={(marker) => marker.placeId && openPlaceSheet(marker.placeId)}
            onPlaceClick={(placeId) => openPlaceSheet(placeId)}
          />

          <div className="pointer-events-none absolute left-4 top-4 z-10 w-[min(320px,90%)] space-y-2">
            <div className="pointer-events-auto border border-[var(--noir-border)] bg-white p-3 shadow-sm">
              <div className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                中心: {centerLabel || formatLatLng(mapCenter)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={isLocating}
                  className={cn(
                    "inline-flex items-center gap-2 border border-[var(--noir-border)] bg-white px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black disabled:opacity-60",
                    isLocating && "cursor-wait"
                  )}
                >
                  <LocateFixed size={14} />
                  現在地に戻る
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching}
                  className={cn(
                    "inline-flex items-center gap-2 border border-black bg-black px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black disabled:opacity-70",
                    isSearching && "cursor-wait"
                  )}
                >
                  <Search size={14} />
                  この位置で探す
                </button>
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="inline-flex items-center gap-2 border border-[var(--noir-border)] bg-[var(--noir-surface)] px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black"
                >
                  <MapPin size={14} />
                  場所を変更
                </button>
              </div>
              {geoMessage ? (
                <p className="mt-2 text-[11px] font-ui text-[var(--noir-muted)]">
                  {geoMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 md:hidden">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className={cn(
                "pointer-events-auto",
                "flex items-center gap-2 border border-black bg-black px-6 py-3 text-[11px] font-ui uppercase tracking-[0.3em] text-white shadow-[0_18px_40px_rgba(15,15,15,0.25)] transition hover:bg-white hover:text-black disabled:opacity-70",
                isSearching && "cursor-wait"
              )}
            >
              <Search size={14} />
              {isSearching ? "検索中..." : "この位置で探す"}
            </button>
          </div>

          {toast && !toast.href ? (
            <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-[var(--noir-border)] bg-white px-4 py-2 text-[11px] font-ui text-[var(--noir-muted)] shadow-sm">
              {toast.message}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col border border-[var(--noir-border)] bg-white md:w-[360px]",
          mapHeightClass
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--noir-border)] px-4 py-3">
          <div className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
            Results
          </div>
          <span className="text-xs font-ui text-[var(--noir-muted)]">
            {restaurants.length} items
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error ? (
            <div className="border border-[var(--noir-border)] bg-[var(--noir-surface)] p-4 text-sm font-ui text-[var(--noir-muted)]">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="border border-[var(--noir-border)] bg-[var(--noir-surface)] p-4 text-sm font-ui text-[var(--noir-muted)]">
              {hasSearched ? "近くのお店が見つかりませんでした。" : "地図を動かして検索してください。"}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => openPlaceSheet(restaurant.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openPlaceSheet(restaurant.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group flex w-full cursor-pointer items-center gap-3 border border-[var(--noir-border)] bg-white p-3 text-left transition hover:shadow-[0_18px_40px_rgba(15,15,15,0.12)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)]">
                    {restaurant.photoUrl ? (
                      <img
                        src={restaurant.photoUrl}
                        alt={restaurant.displayName ?? "store"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <MapPin size={18} className="text-[var(--noir-muted)]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-display text-[var(--noir-ink)]">
                      {restaurant.displayName ?? "Store"}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-ui uppercase tracking-[0.2em] text-[var(--noir-muted)]">
                      {restaurant.primaryType ? (
                        <span>{formatPrimaryType(restaurant.primaryType)}</span>
                      ) : null}
                      {restaurant.rating ? <span>★ {restaurant.rating.toFixed(1)}</span> : null}
                      {restaurant.distanceLabel ? <span>{restaurant.distanceLabel}</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openBookmarkModal(restaurant.id);
                    }}
                    className="flex h-9 w-9 items-center justify-center border border-[var(--noir-border)] text-[var(--noir-muted)] transition hover:text-black"
                    aria-label="しおりに保存"
                  >
                    <Bookmark size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={quickSheetOpen} onOpenChange={setQuickSheetOpen}>
        <SheetContent
          side="right"
          className="w-[92vw] max-w-[420px] border-l border-[var(--noir-border)] bg-white p-0"
        >
          <SheetHeader className="border-b border-[var(--noir-border)] px-5 py-4">
            <SheetTitle className="text-lg font-display text-[var(--noir-ink)]">
              {selectedPlaceName}
            </SheetTitle>
            <div className="text-xs font-ui uppercase tracking-[0.25em] text-[var(--noir-muted)]">
              {selectedPrimaryType ? formatPrimaryType(selectedPrimaryType) : "スポット"}
            </div>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-5 py-4">
            {detailsLoadingId === selectedPlaceId ? (
              <div className="flex items-center gap-2 text-sm font-ui text-[var(--noir-muted)]">
                <LoaderCircle size={16} className="animate-spin" />
                詳細を取得中...
              </div>
            ) : null}
            {detailsError ? (
              <div className="rounded border border-[var(--noir-border)] bg-[var(--noir-surface)] p-3 text-xs font-ui text-[var(--noir-muted)]">
                {detailsError}
              </div>
            ) : null}

            {selectedPhotoUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {selectedPhotoUrls.slice(0, 3).map((url) => (
                  <div
                    key={url}
                    className="aspect-square overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)]"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center border border-dashed border-[var(--noir-border)] text-xs font-ui text-[var(--noir-muted)]">
                画像がありません
              </div>
            )}

            <div className="space-y-3 text-sm font-ui text-[var(--noir-ink)]">
              {selectedPlaceAddress ? (
                <div className="text-xs text-[var(--noir-muted)]">
                  {selectedPlaceAddress}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.25em] text-[var(--noir-muted)]">
                {selectedRating != null ? <span>★ {selectedRating.toFixed(1)}</span> : null}
                {selectedPriceLevel ? <span>{selectedPriceLevel}</span> : null}
                {selectedDetails?.userRatingCount ? (
                  <span>{selectedDetails.userRatingCount} reviews</span>
                ) : null}
              </div>
              {selectedWeekdayDescriptions ? (
                <div className="text-xs text-[var(--noir-muted)]">
                  {selectedWeekdayDescriptions}
                </div>
              ) : null}
              {selectedDetails?.phoneNumber ? (
                <div className="text-xs text-[var(--noir-muted)]">
                  {selectedDetails.phoneNumber}
                </div>
              ) : null}
            </div>
          </div>

          <SheetFooter className="border-t border-[var(--noir-border)] px-5 py-4">
            <div className="flex w-full flex-col gap-2">
              {selectedPlaceId ? (
                <Link
                  href={
                    sessionToken
                      ? `/restaurant/${selectedPlaceId}?sessionToken=${encodeURIComponent(
                          sessionToken
                        )}`
                      : `/restaurant/${selectedPlaceId}`
                  }
                  className="inline-flex w-full items-center justify-center gap-2 border border-black bg-black px-4 py-3 text-[11px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
                >
                  詳細を見る
                  <ArrowUpRight size={14} />
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => selectedPlaceId && openBookmarkModal(selectedPlaceId)}
                className="inline-flex w-full items-center justify-center gap-2 border border-[var(--noir-border)] bg-white px-4 py-3 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black"
              >
                <Bookmark size={14} />
                しおりに保存
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="text-left">
            <DialogTitle>場所を変更</DialogTitle>
            <DialogDescription className="text-xs text-[var(--noir-muted)]">
              エリア名を入力して地図の中心を変更します。
            </DialogDescription>
          </DialogHeader>

          <Command shouldFilter={false} className="overflow-visible">
            <div className="mb-3 border border-[var(--noir-border)] bg-white">
              <CommandInput
                value={locationInput}
                onValueChange={setLocationInput}
                placeholder="エリア・駅名など"
                className="text-sm placeholder:text-[var(--noir-muted)]"
              />
            </div>
            <CommandList className="max-h-60 overflow-y-auto border border-[var(--noir-border)]">
              <CommandEmpty>
                <div className="flex items-center justify-center gap-2 p-4 text-xs text-[var(--noir-muted)]">
                  {locationLoading ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      検索中...
                    </>
                  ) : locationError ? (
                    locationError
                  ) : (
                    "該当する場所がありません"
                  )}
                </div>
              </CommandEmpty>
              {locationSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.placeId}
                  value={suggestion.placeName}
                  onSelect={() => handleSelectLocation(suggestion)}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <MapPin size={14} className="mt-1 text-[var(--noir-muted)]" />
                  <div>
                    <div className="text-sm font-semibold text-[var(--noir-ink)]">
                      {suggestion.placeName}
                    </div>
                    <div className="text-xs text-[var(--noir-muted)]">
                      {suggestion.address_text}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <Dialog open={bookmarkModalOpen} onOpenChange={setBookmarkModalOpen}>
        <DialogContent className="max-w-xl rounded-none border border-[var(--noir-border)] bg-white p-6 shadow-[var(--noir-shadow)]">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-lg font-display text-[var(--noir-ink)]">
              しおりに保存
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--noir-muted)]">
              保存先のしおりを選択してください。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 border border-[var(--noir-border)] bg-white px-3 py-2">
              <Search size={14} className="text-[var(--noir-muted)]" />
              <input
                value={bookmarkQuery}
                onChange={(event) => setBookmarkQuery(event.target.value)}
                placeholder="しおりを検索"
                className="w-full bg-transparent text-sm text-[var(--noir-ink)] outline-none placeholder:text-[var(--noir-muted)]"
              />
            </div>

            <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {filteredBookmarks.length > 0 ? (
                filteredBookmarks.map((bookmark) => {
                  const isSaved = savedBookmarkIdsForPlace.has(bookmark.id);
                  const isBusy = activeSaveId !== null;
                  const isSaving = activeSaveId === bookmark.id;
                  return (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between gap-4 border border-[var(--noir-border)] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--noir-ink)]">
                          {bookmark.title}
                        </p>
                        <p className="text-xs text-[var(--noir-muted)]">
                          {bookmark.area ?? "未設定"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isSaved || isBusy}
                        onClick={() => addPlaceToBookmark(bookmark)}
                        className="flex items-center gap-2 border border-black px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white disabled:border-[var(--noir-border)] disabled:text-[var(--noir-muted)]"
                      >
                        {isSaving ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : null}
                        <span>{isSaved ? "追加済み" : "追加"}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="border border-dashed border-[var(--noir-border)] p-4 text-sm text-[var(--noir-muted)]">
                  保存できるしおりがありません。
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-[var(--noir-border)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--noir-ink)]">
                新規しおり
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="タイトル"
                  className="border border-[var(--noir-border)] px-3 py-2 text-sm outline-none"
                />
                <input
                  value={createForm.area}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      area: event.target.value,
                    }))
                  }
                  placeholder="エリア"
                  className="border border-[var(--noir-border)] px-3 py-2 text-sm outline-none"
                />
                <input
                  type="date"
                  value={createForm.travelDate}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      travelDate: event.target.value,
                    }))
                  }
                  className="border border-[var(--noir-border)] px-3 py-2 text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={createBookmarkAndAdd}
                disabled={isCreatingBookmark || !createForm.title.trim()}
                className="flex w-full items-center justify-center gap-2 border border-black bg-black px-4 py-2 text-[11px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black disabled:border-[var(--noir-border)] disabled:bg-[var(--noir-surface)] disabled:text-[var(--noir-muted)]"
              >
                {isCreatingBookmark ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Bookmark size={14} />
                )}
                作成して追加
              </button>
              {modalError ? (
                <p className="text-sm text-rose-600">{modalError}</p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="rounded-none border border-[var(--noir-border)] bg-white p-6 shadow-[var(--noir-shadow)]">
          <DialogHeader className="text-left">
            <DialogTitle>保存にはログインが必要です</DialogTitle>
            <DialogDescription className="text-sm text-[var(--noir-muted)]">
              しおりに保存するにはログインしてください。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setLoginPromptOpen(false)}
              className="border border-[var(--noir-border)] px-4 py-2 text-sm text-[var(--noir-muted)] transition hover:text-black"
            >
              とじる
            </button>
            <Link
              href={loginHref}
              className="border border-black bg-black px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black"
            >
              ログイン
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {toast?.href ? (
        <div className="fixed bottom-6 right-6 z-50 flex max-w-sm items-center justify-between gap-4 rounded-2xl bg-black px-5 py-4 text-white shadow-2xl">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{toast.message}</p>
            <Link
              href={toast.href}
              className="text-xs font-semibold text-white/80 underline underline-offset-4 hover:text-white"
            >
              しおりを開く
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs font-semibold text-white/70 hover:text-white"
            aria-label="とじる"
          >
            X
          </button>
        </div>
      ) : null}
    </section>
  );
}
