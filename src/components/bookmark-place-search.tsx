"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type MouseEvent,
} from "react";
import Link from "next/link";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";
import { addBookmarkItemAction } from "@/app/(private)/actions/bookmarkActions";
import type { RestaurantSuggestion } from "@/types";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  LoaderCircle,
  MapPin,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { MapMarker } from "@/components/maps/interactive-google-map";

interface BookmarkPlaceSearchProps {
  bookmarkId: string;
  bookmarkTitle: string;
  lat: number;
  lng: number;
  className?: string;
  savedPlaceIds?: string[];
  onMapResults?: (markers: MapMarker[]) => void;
}

export default function BookmarkPlaceSearch({
  bookmarkId,
  bookmarkTitle,
  lat,
  lng,
  className,
  savedPlaceIds = [],
  onMapResults,
}: BookmarkPlaceSearchProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedPlaceIdSet, setSavedPlaceIdSet] = useState(
    () => new Set(savedPlaceIds)
  );
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; href: string } | null>(
    null
  );

  const clickedOnItem = useRef(false);
  const router = useRouter();

  useEffect(() => {
    setSavedPlaceIdSet(new Set(savedPlaceIds));
  }, [savedPlaceIds]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      onMapResults?.([]);
    };
  }, [onMapResults]);

  const ensureSessionToken = useCallback(() => {
    if (sessionToken) return sessionToken;
    const next = uuidv4();
    setSessionToken(next);
    return next;
  }, [sessionToken]);

  const fetchSuggestions = useDebouncedCallback(async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    setErrorMessage(null);

    try {
      const token = ensureSessionToken();
      const response = await fetch(
        `/api/restaurant/autocomplete?input=${input}&sessionToken=${token}&lat=${lat}&lng=${lng}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error);
        return;
      }

      const data: RestaurantSuggestion[] = await response.json();
      setSuggestions(data.filter((item) => item.type === "placePrediction"));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setErrorMessage("候補を読み込めませんでした");
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    if (!inputText.trim()) {
      setOpen(false);
      setSuggestions([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setOpen(true);
    fetchSuggestions(inputText);
  }, [inputText, fetchSuggestions]);

  useEffect(() => {
    if (!onMapResults) return;
    if (suggestions.length === 0) {
      onMapResults([]);
      return;
    }

    let cancelled = false;
    const token = ensureSessionToken();

    const fetchLocations = async () => {
      const results = await Promise.all(
        suggestions.slice(0, 6).map(async (suggestion) => {
          const placeId = suggestion.placeId?.trim();
          if (!placeId) return null;
          try {
            const response = await fetch(
              `/api/restaurant/details?placeId=${encodeURIComponent(placeId)}&sessionToken=${token}`
            );
            if (!response.ok) return null;
            const payload = await response.json();
            const location = payload?.data?.location;
            if (!location) return null;
            return {
              id: `search-${placeId}`,
              lat: location.lat,
              lng: location.lng,
              title: suggestion.placeName ?? null,
              placeId,
            } satisfies MapMarker;
          } catch (error) {
            console.error("Failed to load place location.", error);
            return null;
          }
        })
      );

      if (cancelled) return;
      onMapResults(results.filter(Boolean) as MapMarker[]);
    };

    void fetchLocations();
    return () => {
      cancelled = true;
    };
  }, [suggestions, onMapResults, ensureSessionToken]);

  const handleBlur = () => {
    if (clickedOnItem.current) {
      clickedOnItem.current = false;
      return;
    }
    setOpen(false);
  };

  const handleSelectSuggestion = (suggestion: RestaurantSuggestion) => {
    const placeId = suggestion.placeId?.trim();
    if (!placeId) {
      setErrorMessage("具体的な場所を選択してください");
      return;
    }
    if (savedPlaceIdSet.has(placeId)) {
      setErrorMessage("追加済みです");
      return;
    }

    setActivePlaceId(placeId);
    startTransition(async () => {
      try {
        const token = ensureSessionToken();
        const result = await addBookmarkItemAction(bookmarkId, suggestion, token);
        setSavedPlaceIdSet((current) => {
          const next = new Set(current);
          next.add(placeId);
          return next;
        });
        if (result.status === "added") {
          setToast({
            message: `${bookmarkTitle} に追加しました`,
            href: `/bookmarks/${bookmarkId}`,
          });
        } else {
          setErrorMessage("追加済みです");
        }
        setSessionToken(uuidv4());
        setInputText("");
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to add bookmark item.", error);
        setErrorMessage("スポットを追加できませんでした。");
      } finally {
        setActivePlaceId(null);
      }
    });
  };

  const handleViewDetails = (suggestion: RestaurantSuggestion) => {
    if (!suggestion.placeId) {
      setErrorMessage("詳細を表示できませんでした。");
      return;
    }
    const params = new URLSearchParams();
    const token = ensureSessionToken();
    if (token) {
      params.set("sessionToken", token);
    }
    const query = params.toString();
    const href = query
      ? `/restaurant/${suggestion.placeId}?${query}`
      : `/restaurant/${suggestion.placeId}`;
    setOpen(false);
    router.push(href);
  };

  const stopCommandSelect = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <Command
        className={cn(
          "overflow-visible rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm focus-within:border-orange-300 focus-within:ring-1 focus-within:ring-orange-200",
          className
        )}
        shouldFilter={false}
      >
        <CommandInput
          value={inputText}
          placeholder="追加するスポットを検索"
          onValueChange={setInputText}
          onBlur={handleBlur}
          onFocus={() => inputText && setOpen(true)}
          className="text-sm placeholder:text-gray-400"
        />
        {open && (
          <div className="relative">
            <CommandList className="absolute mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
              <CommandEmpty>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  {isPending || isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : errorMessage ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle />
                      {errorMessage}
                    </div>
                  ) : (
                    "該当するスポットがありません。"
                  )}
                </div>
              </CommandEmpty>
              {suggestions.map((suggestion) => {
                const placeId = suggestion.placeId ?? "";
                const isSaved = placeId ? savedPlaceIdSet.has(placeId) : false;
                const isSaving = Boolean(placeId) && activePlaceId === placeId;
                return (
                  <CommandItem
                    key={suggestion.placeId}
                    className="rounded-xl px-4 py-3 text-sm text-slate-900 data-[selected=true]:bg-gray-50"
                    value={suggestion.placeName}
                    onSelect={() => {
                      clickedOnItem.current = true;
                    }}
                    onMouseDown={() => (clickedOnItem.current = true)}
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="text-gray-400" />
                        <p className="truncate">{suggestion.placeName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onMouseDown={stopCommandSelect}
                          onClick={() => handleViewDetails(suggestion)}
                          className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 transition hover:border-orange-300 hover:text-orange-600 active:scale-95"
                        >
                          <ArrowUpRight size={12} />
                          詳細
                        </button>
                        <button
                          type="button"
                          disabled={isSaved || isSaving}
                          onMouseDown={stopCommandSelect}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="flex items-center gap-1 rounded-full border border-slate-900 bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white transition hover:bg-slate-800 active:scale-95 disabled:border-gray-200 disabled:bg-white disabled:text-gray-400"
                        >
                          {isSaving ? (
                            <LoaderCircle size={12} className="animate-spin" />
                          ) : isSaved ? (
                            <Check size={12} />
                          ) : (
                            <Plus size={12} />
                          )}
                          {isSaved ? "追加済み" : "追加"}
                        </button>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandList>
          </div>
        )}
      </Command>

      {toast ? (
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
            aria-label="通知を閉じる"
          >
            X
          </button>
        </div>
      ) : null}
    </>
  );
}
