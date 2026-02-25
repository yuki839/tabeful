"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Sparkles, X } from "lucide-react";
import App from "@/components/shiori-moc/App";
import {
  DesignPattern,
  ItineraryItem,
  ShioriData,
} from "@/components/shiori-moc/types";
import ViewSwitcher from "@/components/shiori-moc/ViewSwitcher";
import BookmarkPlaceSearch from "@/components/bookmark-place-search";
import {
  applyAiRouteToBookmarkAction,
  createBookmarkFromRouteAction,
  moveBookmarkItemAction,
  reorderBookmarkItemsAction,
  replaceBookmarkItemPlaceAction,
  setBookmarkCoverAction,
  updateBookmarkItemTimeAction,
  updateBookmarkTitleAction,
} from "@/app/(private)/actions/bookmarkActions";
import type { MapMarker } from "@/components/maps/interactive-google-map";
import type { Restaurant } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MocBookmarkAppProps {
  data: ShioriData;
  bookmarkId: string;
  userId: string;
  bookmarkTitle: string;
  bookmarkArea?: string | null;
  bookmarkDate?: string | null;
  savedPlaceIds: string[];
  searchLat: number;
  searchLng: number;
  mapImageUrl?: string | null;
  mapEmbedUrl?: string | null;
  mapLinkUrl: string;
  mapApiKey?: string | null;
  mapCenter?: { lat: number; lng: number };
  mapMarkers?: MapMarker[];
  exportPayload?: ShioriExportPayload | null;
}

const VIEW_VALUES = new Set(Object.values(DesignPattern));

const parseViewParam = (value: string | null): DesignPattern | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return VIEW_VALUES.has(normalized as DesignPattern)
    ? (normalized as DesignPattern)
    : null;
};

export type ShioriExportPayload = {
  version: number;
  exportedAt?: string;
  bookmark: {
    title: string;
    area: string | null;
    date: string | null;
    coverImagePath: string | null;
  };
  items: Array<{
    sortOrder?: number;
    place: {
      googlePlaceId: string;
      name: string | null;
      primaryType: string | null;
      address: string | null;
      lat: number | null;
      lng: number | null;
    };
  }>;
};

type AiRouteResult = {
  route_name: string;
  concept: string;
  ordered_spot_ids: string[];
  reasoning_bullets: string[];
  per_spot_notes: Record<string, string>;
};

type AiRouteNotes = {
  concept: string;
  reasoning: string[];
  perSpotNotes: Record<string, string>;
  sourceTitle: string;
};

const CATEGORY_LABELS: Record<ItineraryItem["category"], string> = {
  food: "食事",
  sightseeing: "観光",
  shop: "買い物",
  transport: "移動",
};

export default function MocBookmarkApp({
  data,
  bookmarkId,
  userId,
  bookmarkTitle,
  bookmarkArea = null,
  bookmarkDate = null,
  savedPlaceIds,
  searchLat,
  searchLng,
  mapImageUrl,
  mapEmbedUrl,
  mapLinkUrl,
  mapApiKey,
  mapCenter,
  mapMarkers,
  exportPayload = null,
}: MocBookmarkAppProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shioriHeaderRef = useRef<HTMLDivElement>(null);
  const viewParam = parseViewParam(searchParams.get("view"));
  const storageKey = useMemo(
    () => `shiori:view:${userId}:${bookmarkId}`,
    [userId, bookmarkId]
  );

  const [view, setView] = useState<DesignPattern>(
    viewParam ?? DesignPattern.MapSplit
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const [topOffset, setTopOffset] = useState(0);

  const [exportOpen, setExportOpen] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(data.title);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const [timeOverrides, setTimeOverrides] = useState<Record<string, string>>({});
  const [itemOrder, setItemOrder] = useState<string[]>([]);

  const fallbackSearchLat =
    Number.isFinite(searchLat)
      ? searchLat
      : mapCenter?.lat ??
        data.items.find((item) => Number.isFinite(item.lat))?.lat ??
        Number.NaN;
  const fallbackSearchLng =
    Number.isFinite(searchLng)
      ? searchLng
      : mapCenter?.lng ??
        data.items.find((item) => Number.isFinite(item.lng))?.lng ??
        Number.NaN;
  const canSearchPlace =
    Number.isFinite(fallbackSearchLat) && Number.isFinite(fallbackSearchLng);

  const aiNotesKey = useMemo(
    () => `tabeful-ai-route-notes:${userId}:${bookmarkId}`,
    [userId, bookmarkId]
  );
  const aiNotesVisibilityKey = useMemo(
    () => `tabeful-ai-route-notes-visible:${userId}:${bookmarkId}`,
    [userId, bookmarkId]
  );
  const [aiNotes, setAiNotes] = useState<AiRouteNotes | null>(null);
  const [aiNotesVisible, setAiNotesVisible] = useState(false);

  const [aiOpen, setAiOpen] = useState(false);
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);
  const [aiMode, setAiMode] = useState<"fastest" | "diverse">("fastest");
  const [aiApplyMode, setAiApplyMode] = useState<"new" | "update">("new");
  const [aiResult, setAiResult] = useState<AiRouteResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiCreating, setIsAiCreating] = useState(false);
  const [spotQuery, setSpotQuery] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPlaceId, setDetailPlaceId] = useState<string | null>(null);
  const [detailSaveRequested, setDetailSaveRequested] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<ItineraryItem | null>(null);
  const [replaceOptions, setReplaceOptions] = useState<Restaurant[]>([]);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceBusy, setReplaceBusy] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const replaceRequestIdRef = useRef(0);

  const [toast, setToast] = useState<{ message: string; href: string } | null>(
    null
  );

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }
    hydratedRef.current = true;

    if (viewParam) {
      setView(viewParam);
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    const parsed = parseViewParam(stored);
    if (parsed) {
      setView(parsed);
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", parsed);
      router.replace(`?${params.toString()}`);
    }
  }, [router, searchParams, storageKey, viewParam]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(storageKey, view);
  }, [storageKey, view]);

  useEffect(() => {
    if (!viewParam) return;
    setView(viewParam);
  }, [viewParam]);

  useEffect(() => {
    const appHeader = document.querySelector(
      "[data-app-header]"
    ) as HTMLElement | null;
    const shioriHeader = shioriHeaderRef.current;

    const updateOffset = () => {
      const appHeight = appHeader?.offsetHeight ?? 0;
      const shioriHeight = shioriHeader?.offsetHeight ?? 0;
      setTopOffset(appHeight + shioriHeight);
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    if (appHeader) observer.observe(appHeader);
    if (shioriHeader) observer.observe(shioriHeader);
    window.addEventListener("resize", updateOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, []);

  useEffect(() => {
    setTitle(data.title);
    setRenameValue(data.title);
  }, [data.title]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(aiNotesKey);
      if (!raw) {
        setAiNotes(null);
        return;
      }
      const parsed = JSON.parse(raw) as AiRouteNotes;
      setAiNotes(parsed ?? null);
    } catch {
      setAiNotes(null);
    }
  }, [aiNotesKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(aiNotesVisibilityKey);
    if (stored === "show") {
      setAiNotesVisible(true);
      return;
    }
    if (stored === "hide") {
      setAiNotesVisible(false);
    }
  }, [aiNotesVisibilityKey]);

  const updateAiNotesVisibility = (visible: boolean) => {
    setAiNotesVisible(visible);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        aiNotesVisibilityKey,
        visible ? "show" : "hide"
      );
    } catch {
      // ストレージのエラーは無視する
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: MessageEvent) => {
      const payload = event?.data as { type?: string } | undefined;
      if (payload?.type !== "tabeful:bookmark-updated") {
        return;
      }
      setDetailSaveRequested(false);
      router.refresh();
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [router]);

  useEffect(() => {
    const nextOrder = data.items.map((item) => item.bookmarkItemId ?? item.id);
    setItemOrder((current) => {
      if (current.length === 0) return nextOrder;
      if (current.length !== nextOrder.length) return nextOrder;
      return current;
    });
  }, [data.items]);

  const dataWithTimes = useMemo<ShioriData>(() => {
    const itemsWithTimes = data.items.map((item) => {
      const key = item.bookmarkItemId ?? item.id;
      const override = timeOverrides[key];
      return {
        ...item,
        time: override ?? item.time,
        categoryLabel: CATEGORY_LABELS[item.category] ?? "食事",
      };
    });

    if (itemOrder.length === 0) {
      return { ...data, title, items: itemsWithTimes };
    }

    const itemMap = new Map(
      itemsWithTimes.map((item) => [item.bookmarkItemId ?? item.id, item])
    );
    const ordered = itemOrder
      .map((id) => itemMap.get(id))
      .filter(Boolean) as ItineraryItem[];
    const orderedSet = new Set(itemOrder);
    const remaining = itemsWithTimes.filter(
      (item) => !orderedSet.has(item.bookmarkItemId ?? item.id)
    );
    return { ...data, title, items: [...ordered, ...remaining] };
  }, [data, title, timeOverrides, itemOrder]);

  const filteredData = useMemo<ShioriData>(() => {
    const query = spotQuery.trim().toLowerCase();
    if (!query) return dataWithTimes;
    const items = dataWithTimes.items.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      const categoryMatch = item.categoryLabel?.toLowerCase().includes(query);
      return Boolean(titleMatch || descMatch || categoryMatch);
    });
    return { ...dataWithTimes, items };
  }, [dataWithTimes, spotQuery]);

  const selectableItems = useMemo(
    () => dataWithTimes.items.filter((item) => Boolean(item.placeId)),
    [dataWithTimes.items]
  );

  const itemByPlaceId = useMemo(() => {
    const map = new Map<string, ItineraryItem>();
    dataWithTimes.items.forEach((item) => {
      if (item.placeId) {
        map.set(item.placeId, item);
      }
    });
    return map;
  }, [dataWithTimes.items]);

  const parseTimeToMinutes = (value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };

  const formatMinutes = (minutes: number) => {
    const safe = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hours = Math.floor(safe / 60);
    const mins = safe % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const buildTimeSuggestions = useCallback((orderedIds: string[]) => {
    if (orderedIds.length === 0) return new Map<string, string>();
    const firstItem = itemByPlaceId.get(orderedIds[0]);
    const baseMinutes = firstItem ? parseTimeToMinutes(firstItem.time) : null;
    const startMinutes = baseMinutes ?? 10 * 60;
    const stepMinutes = 90;
    return new Map(
      orderedIds.map((id, index) => [
        id,
        formatMinutes(startMinutes + index * stepMinutes),
      ])
    );
  }, [itemByPlaceId]);

  const aiTimeSuggestions = useMemo(() => {
    if (!aiResult) return null;
    return buildTimeSuggestions(aiResult.ordered_spot_ids);
  }, [aiResult, buildTimeSuggestions]);

  const aiSpotSuggestions = useMemo(() => {
    if (!aiResult) return [];
    const orderedItems = aiResult.ordered_spot_ids
      .map((id) => itemByPlaceId.get(id))
      .filter(Boolean) as ItineraryItem[];
    const foodCount = orderedItems.filter((item) => item.category === "food").length;
    const sightseeingCount = orderedItems.filter((item) => item.category === "sightseeing").length;
    const shopCount = orderedItems.filter((item) => item.category === "shop").length;

    const suggestions: string[] = [];
    if (foodCount >= 2) {
      suggestions.push("口直しにカフェやスイーツを挟む");
    }
    if (sightseeingCount >= 2) {
      suggestions.push("移動の合間に休憩スポットを追加");
    }
    if (shopCount >= 2) {
      suggestions.push("公園や展望スポットで一息");
    }
    if (suggestions.length === 0) {
      suggestions.push("食事・観光・休憩をバランス良く配置");
    }
    return suggestions;
  }, [aiResult, itemByPlaceId]);

  const selectedItems = useMemo(
    () =>
      selectedSpotIds
        .map((id) => itemByPlaceId.get(id))
        .filter(Boolean) as ItineraryItem[],
    [itemByPlaceId, selectedSpotIds]
  );

  const handleViewChange = (nextView: DesignPattern) => {
    setView(nextView);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    router.replace(`?${params.toString()}`);
  };

  const handleItemClick = (item: ItineraryItem) => {
    if (!item.placeId) return;
    setDetailPlaceId(item.placeId);
    setDetailOpen(true);
  };

  const handlePlaceIdClick = (placeId: string) => {
    if (!placeId) return;
    setDetailPlaceId(placeId);
    setDetailOpen(true);
  };

  const handleTimeChange = (itemId: string, nextTime: string) => {
    const trimmed = nextTime.trim();
    if (trimmed && !/^\d{2}:\d{2}$/.test(trimmed)) return;

    setTimeOverrides((current) => {
      const next = { ...current };
      if (!trimmed) delete next[itemId];
      else next[itemId] = trimmed;
      return next;
    });

    startTransition(async () => {
      try {
        await updateBookmarkItemTimeAction(itemId, trimmed || null);
      } catch (error) {
        console.error("Failed to update bookmark item time.", error);
        setToast({ message: "時間の更新に失敗しました。", href: `/bookmarks/${bookmarkId}` });
      }
    });
  };

  const handleReorderItems = (orderedIds: string[]) => {
    if (orderedIds.length === 0) return;
    setItemOrder(orderedIds);
    setIsReordering(true);
    startTransition(async () => {
      try {
        await reorderBookmarkItemsAction(bookmarkId, orderedIds);
        router.refresh();
      } catch (error) {
        console.error("Failed to reorder bookmark items.", error);
        setToast({ message: "並び替えに失敗しました。", href: `/bookmarks/${bookmarkId}` });
      } finally {
        setIsReordering(false);
      }
    });
  };

  const handleMoveItem = (itemId: string, direction: "up" | "down") => {
    const currentOrder =
      itemOrder.length > 0
        ? itemOrder
        : data.items.map((item) => item.bookmarkItemId ?? item.id);
    const fromIndex = currentOrder.indexOf(itemId);
    if (fromIndex < 0) return;
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    const neighborId = nextOrder[toIndex];
    [nextOrder[fromIndex], nextOrder[toIndex]] = [
      nextOrder[toIndex],
      nextOrder[fromIndex],
    ];

    const itemMap = new Map(
      dataWithTimes.items.map((item) => [item.bookmarkItemId ?? item.id, item])
    );
    const fromItem = itemMap.get(itemId);
    const neighborItem = itemMap.get(neighborId);
    const prevOverrides = { ...timeOverrides };
    const prevOrder = [...currentOrder];

    setItemOrder(nextOrder);
    setIsReordering(true);
    if (fromItem && neighborItem) {
      setTimeOverrides((current) => ({
        ...current,
        [itemId]: neighborItem.time,
        [neighborId]: fromItem.time,
      }));
    }

    startTransition(async () => {
      try {
        await moveBookmarkItemAction(itemId, direction, bookmarkId);
        if (fromItem && neighborItem) {
          await Promise.all([
            updateBookmarkItemTimeAction(itemId, neighborItem.time),
            updateBookmarkItemTimeAction(neighborId, fromItem.time),
          ]);
        }
        router.refresh();
      } catch (error) {
        console.error("Failed to reorder bookmark items.", error);
        setItemOrder(prevOrder);
        setTimeOverrides(prevOverrides);
        setToast({
          message: "並び替えに失敗しました。元の順番に戻しました。",
          href: `/bookmarks/${bookmarkId}`,
        });
      } finally {
        setIsReordering(false);
      }
    });
  };

  const handleOpenReplace = (item: ItineraryItem) => {
    const lat = item.lat ?? null;
    const lng = item.lng ?? null;
    setReplaceTarget(item);
    setReplaceOpen(true);
    setReplaceOptions([]);
    setReplaceError(null);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setReplaceError("位置情報が取得できないため、代替候補を表示できません。");
      return;
    }

    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: "1200",
    });
    const typeGroups: Record<ItineraryItem["category"], string[]> = {
      food: ["restaurant", "cafe", "bar", "bakery", "coffee_shop"],
      shop: ["shopping_mall", "store", "department_store", "supermarket", "market"],
      sightseeing: ["tourist_attraction", "museum", "park", "art_gallery", "zoo"],
      transport: ["train_station", "subway_station", "bus_station", "airport"],
    };
    const types = typeGroups[item.category];
    if (types?.length) {
      params.set("types", types.join(","));
    }
    replaceRequestIdRef.current += 1;
    const requestId = replaceRequestIdRef.current;
    setReplaceLoading(true);
    fetch(`/api/restaurant/nearby?${params.toString()}`)
      .then((response) => response.json())
      .then((payload) => {
        if (requestId !== replaceRequestIdRef.current) {
          return;
        }
        if (payload?.error) {
          setReplaceError(payload.error);
          return;
        }
        const results = Array.isArray(payload?.data) ? payload.data : [];
        const filtered = results.filter((entry: Restaurant) => {
          if (!entry?.id) return false;
          if (item.placeId && entry.id === item.placeId) return false;
          if (savedPlaceIds.includes(entry.id)) return false;
          return true;
        });
        setReplaceOptions(filtered);
      })
      .catch((error) => {
        if (requestId !== replaceRequestIdRef.current) {
          return;
        }
        console.error("Failed to load replacement candidates.", error);
        setReplaceError("代替候補の読み込みに失敗しました。");
      })
      .finally(() => {
        if (requestId !== replaceRequestIdRef.current) {
          return;
        }
        setReplaceLoading(false);
      });
  };

  const handleReplace = (candidate: Restaurant) => {
    if (!replaceTarget || replaceBusy) return;
    const bookmarkItemId = replaceTarget.bookmarkItemId ?? replaceTarget.id;
    if (!bookmarkItemId) return;
    setReplaceBusy(true);
    setReplaceError(null);
    startTransition(async () => {
      try {
        const result = await replaceBookmarkItemPlaceAction(
          bookmarkItemId,
          candidate.id
        );
        if (result.status === "existing") {
          setReplaceError("すでにしおりに追加済みのため入れ替えできません。");
          return;
        }
        setReplaceOpen(false);
        setReplaceTarget(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to replace bookmark item.", error);
        setReplaceError("入れ替えに失敗しました。");
      } finally {
        setReplaceBusy(false);
      }
    });
  };

  const handleOpenNavigation = () => {
    if (!mapLinkUrl) return;
    window.open(mapLinkUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenCoverPicker = () => {
    fileInputRef.current?.click();
  };


  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/bookmarks");
  };

  const handleOpenRename = () => {
    setRenameValue(title);
    setRenameError(null);
    setRenameOpen(true);
  };

  const handleRenameSave = async () => {
    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setRenameError("タイトルを入力してください。");
      return;
    }
    setIsRenaming(true);
    setRenameError(null);
    try {
      await updateBookmarkTitleAction(bookmarkId, nextTitle);
      setTitle(nextTitle);
      setRenameOpen(false);
      router.refresh();
    } catch (error) {
      const digest = (error as { digest?: string } | null)?.digest;
      if (digest === "NEXT_REDIRECT") throw error;

      console.error("Failed to rename bookmark.", error);
      setRenameError("タイトルの更新に失敗しました。");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("cover", file);

    startTransition(async () => {
      try {
        await setBookmarkCoverAction(bookmarkId, formData);
        router.refresh();
      } catch (error) {
        const digest = (error as { digest?: string } | null)?.digest;
        if (digest === "NEXT_REDIRECT") throw error;
        console.error("Failed to upload bookmark cover.", error);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  const toggleSpotSelection = (placeId: string) => {
    setAiResult(null);
    setAiError(null);
    setSelectedSpotIds((current) => {
      if (current.includes(placeId)) return current.filter((id) => id !== placeId);
      if (current.length >= 5) {
        setAiError("最大5件まで選択できます。");
        return current;
      }
      return [...current, placeId];
    });
  };

  const handleRunAiRoute = async () => {
    if (selectedSpotIds.length === 0) {
      setAiError("スポットを選択してください。");
      return;
    }
    if (selectedSpotIds.length > 5) {
      setAiError("最大5件まで選択できます。");
      return;
    }

    setAiError(null);
    setIsAiLoading(true);
    setAiResult(null);

    try {
      const start = mapCenter
        ? { label: "map center", lat: mapCenter.lat, lng: mapCenter.lng }
        : bookmarkArea
          ? { label: bookmarkArea }
          : null;

      const payload = {
        spots: selectedItems.map((item) => ({
          id: item.placeId!,
          name: item.title,
          primaryType: item.category ?? null,
          lat: item.lat ?? null,
          lng: item.lng ?? null,
        })),
        mode: aiMode,
        start,
        extraContext: [],
      };

      const response = await fetch("/api/ai-routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson?.error ?? "AI routing failed");
      }
      setAiResult(resJson as AiRouteResult);
    } catch (error) {
      console.error("AI routing failed.", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "AIルーティングに失敗しました。";
      setAiError(message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateAiShiori = async () => {
    if (!aiResult) return;
    setIsAiCreating(true);

    try {
      const notes: AiRouteNotes = {
        concept: aiResult.concept,
        reasoning: aiResult.reasoning_bullets,
        perSpotNotes: aiResult.per_spot_notes,
        sourceTitle: title,
      };

      if (aiApplyMode === "update") {
        const confirmed = window.confirm(
          "現在のしおりの順番を更新します。よろしいですか？"
        );
        if (!confirmed) {
          setIsAiCreating(false);
          return;
        }

        await applyAiRouteToBookmarkAction({
          bookmarkId,
          orderedPlaceIds: aiResult.ordered_spot_ids,
        });

        if (aiTimeSuggestions) {
          const updates = aiResult.ordered_spot_ids
            .map((id) => {
              const item = itemByPlaceId.get(id);
              const time = aiTimeSuggestions.get(id);
              if (!item?.bookmarkItemId || !time) return null;
              return updateBookmarkItemTimeAction(item.bookmarkItemId, time);
            })
            .filter(Boolean) as Promise<void>[];
          if (updates.length > 0) {
            await Promise.all(updates);
            setTimeOverrides((current) => {
              const next = { ...current };
              aiResult.ordered_spot_ids.forEach((id) => {
                const item = itemByPlaceId.get(id);
                const time = aiTimeSuggestions.get(id);
                if (item?.bookmarkItemId && time) {
                  next[item.bookmarkItemId] = time;
                }
              });
              return next;
            });
          }
        }

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              `tabeful-ai-route-notes:${userId}:${bookmarkId}`,
              JSON.stringify(notes)
            );
            window.localStorage.setItem(
              `tabeful-ai-route-notes-visible:${userId}:${bookmarkId}`,
              "show"
            );
          } catch {
            // ストレージのエラーは無視する
          }
        }

        setAiNotes(notes);
        setAiNotesVisible(true);
        setToast({
          message: "しおりの順番を更新しました",
          href: `/bookmarks/${bookmarkId}`,
        });

        router.refresh();
        setAiOpen(false);
        setAiResult(null);
        setSelectedSpotIds([]);
        return;
      }

      const orderedPlaces = aiResult.ordered_spot_ids
        .map((id) => itemByPlaceId.get(id))
        .filter(Boolean)
        .map((item) => ({
          placeId: item!.placeId!,
          name: item!.title ?? null,
          primaryType: null,
          address: item!.address ?? null,
          lat: item!.lat ?? null,
          lng: item!.lng ?? null,
        }));

      const result = await createBookmarkFromRouteAction({
        title: `${title}（AI提案）`,
        area: bookmarkArea ?? null,
        travelDate: bookmarkDate ?? null,
        places: orderedPlaces,
      });

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            `tabeful-ai-route-notes:${userId}:${result.bookmarkId}`,
            JSON.stringify(notes)
          );
          window.localStorage.setItem(
            `tabeful-ai-route-notes-visible:${userId}:${result.bookmarkId}`,
            "show"
          );
        } catch {
          // ストレージのエラーは無視する
        }
      }

      setToast({
        message: "AI提案しおりを作成しました",
        href: `/bookmarks/${result.bookmarkId}`,
      });

      setAiOpen(false);
      setAiResult(null);
      setSelectedSpotIds([]);
    } catch (error) {
      const digest = (error as { digest?: string } | null)?.digest;
      if (digest === "NEXT_REDIRECT") throw error;
      console.error("Failed to create AI shiori.", error);
      setAiError("AI提案しおりの作成に失敗しました。");
    } finally {
      setIsAiCreating(false);
    }
  };

  const buildExportFileName = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rawTitle = title?.trim() || "shiori";
    const safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "-");
    return `shiori-${safeTitle}-${date}.json`;
  };

  const handleDownloadExport = () => {
    if (!exportPayload) return;

    const payload: ShioriExportPayload = {
      ...exportPayload,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = buildExportFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  return (
    <div
      className="w-full bg-transparent text-[var(--noir-ink)]"
      style={{ "--shiori-top-offset": `${topOffset}px` } as CSSProperties}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="カバー画像を選択"
        className="hidden"
        onChange={handleCoverChange}
        disabled={isPending}
      />

      <header
        ref={shioriHeaderRef}
        className="sticky top-0 z-20 border-b border-[var(--noir-border)] bg-[var(--noir-bg)]/90 backdrop-blur"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 border border-[var(--noir-border)] bg-white px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black"
            >
              <ArrowLeft size={14} />
              戻る
            </button>

            <span className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
              しおり
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-ui uppercase tracking-[0.35em] text-[var(--noir-muted)]">
                アクティブしおり
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl text-[var(--noir-ink)] md:text-3xl">
                  {title}
                </h1>
                <span className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                  {dataWithTimes.date}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={spotQuery}
                onChange={(event) => setSpotQuery(event.target.value)}
                placeholder="スポット検索"
                className="w-40 rounded-full border border-[var(--noir-border)] bg-white px-3 py-2 text-[11px] font-ui tracking-[0.2em] text-[var(--noir-ink)] placeholder:text-[var(--noir-muted)] focus:outline-none focus:ring-1 focus:ring-black/30"
                aria-label="スポット検索"
              />
              {isReordering ? (
                <span className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                  更新中...
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-2 border border-black bg-black px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
              >
                <Sparkles size={14} />
                AIでルート提案
              </button>

              <button
                type="button"
                onClick={handleOpenRename}
                className="inline-flex items-center gap-2 border border-[var(--noir-border)] bg-white px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black"
              >
                <Pencil size={14} />
                編集
              </button>

              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-2 border border-[var(--noir-border)] bg-white px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black"
              >
                エクスポート
              </button>
              <button
                type="button"
                onClick={handleOpenCoverPicker}
                className="inline-flex items-center gap-2 border border-[var(--noir-border)] bg-white px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black"
              >
                {"\u30ab\u30d0\u30fc\u5909\u66f4"}
              </button>

              <ViewSwitcher value={view} onChange={handleViewChange} />
            </div>
          </div>
        </div>
      </header>

      {aiNotes ? (
        <div className="mx-auto w-full max-w-[1400px] px-6 pt-4">
          {aiNotesVisible ? (
            <div className="border border-[var(--noir-border)] bg-white p-4 text-sm font-ui text-[var(--noir-ink)]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                  AI提案
                </p>
                <button
                  type="button"
                  onClick={() => updateAiNotesVisibility(false)}
                  className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black"
                >
                  非表示
                </button>
              </div>
              <p className="mt-2">{aiNotes.concept}</p>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-[var(--noir-muted)]">
                {aiNotes.reasoning.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => updateAiNotesVisibility(true)}
              className="border border-[var(--noir-border)] bg-white px-4 py-2 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:border-black hover:text-black"
            >
              AI提案を表示
            </button>
          )}
        </div>
      ) : null}

      <div
        className={
          view === DesignPattern.MapSplit ? "min-h-0 overflow-hidden" : "min-h-0"
        }
      >
        <App
          data={filteredData}
          currentPattern={view}
          onPatternChange={handleViewChange}
          onOpenNavigation={handleOpenNavigation}
          onItemClick={handleItemClick}
          onMapPlaceClick={handlePlaceIdClick}
          onTimeChange={handleTimeChange}
          onMoveItem={handleMoveItem}
          onReplaceItem={handleOpenReplace}
          onReorderItems={handleReorderItems}
          isReordering={isReordering}
          onSetCover={handleOpenCoverPicker}
          onOpenSearch={() => setSearchOpen(true)}
          mapImageUrl={mapImageUrl}
          mapEmbedUrl={mapEmbedUrl}
          mapApiKey={mapApiKey}
          mapCenter={mapCenter}
          mapMarkers={mapMarkers}
          bookmarkId={bookmarkId}
        />
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="text-left">
            <DialogTitle>しおり名を編集</DialogTitle>
            <DialogDescription className="text-xs text-[var(--noir-muted)]">
              タイトルを変更します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              aria-label="しおり名を編集"
              className="w-full border border-[var(--noir-border)] px-3 py-2 text-sm outline-none"
            />
            {renameError ? (
              <p className="text-sm text-rose-600">{renameError}</p>
            ) : null}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="border border-[var(--noir-border)] px-4 py-2 text-sm text-[var(--noir-muted)] transition hover:text-black"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleRenameSave}
                disabled={isRenaming}
                className="border border-black bg-black px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black disabled:border-[var(--noir-border)] disabled:bg-[var(--noir-surface)] disabled:text-[var(--noir-muted)]"
              >
                {isRenaming ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ ここがビルドエラーの原因だった「空の <Dialog」を削除済み */}
      <Dialog
        open={aiOpen}
        onOpenChange={(open) => {
          setAiOpen(open);
          if (!open) {
            setAiResult(null);
            setAiError(null);
            setSelectedSpotIds([]);
            setAiApplyMode("new");
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="text-left">
            <DialogTitle>AIルーティング</DialogTitle>
            <DialogDescription className="text-xs text-[var(--noir-muted)]">
              最大5スポットを選択してルート提案を生成します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--noir-muted)]">
              <span>選択済み {selectedSpotIds.length} / 5</span>
              <span>開始地点: {mapCenter ? "マップ中心" : "しおり中心"}</span>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto border border-[var(--noir-border)] p-3">
              {selectableItems.map((item) => {
                const placeId = item.placeId!;
                const checked = selectedSpotIds.includes(placeId);
                const disabled = !checked && selectedSpotIds.length >= 5;

                return (
                  <label
                    key={placeId}
                    className={`flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm ${
                      checked
                        ? "border-black bg-black/5"
                        : "border-[var(--noir-border)]"
                    } ${disabled ? "opacity-50" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleSpotSelection(placeId)}
                      />
                      <span className="font-semibold">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-[var(--noir-muted)]">
                      {item.category}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ai-mode"
                  checked={aiMode === "fastest"}
                  onChange={() => setAiMode("fastest")}
                />
                最短（移動効率）
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ai-mode"
                  checked={aiMode === "diverse"}
                  onChange={() => setAiMode("diverse")}
                />
                ジャンル散らし
              </label>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <p className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                作成方法
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ai-apply-mode"
                    checked={aiApplyMode === "new"}
                    onChange={() => setAiApplyMode("new")}
                  />
                  新規しおりを作成
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ai-apply-mode"
                    checked={aiApplyMode === "update"}
                    onChange={() => setAiApplyMode("update")}
                  />
                  このしおりを更新
                </label>
              </div>
              {aiApplyMode === "update" ? (
                <p className="text-xs text-[var(--noir-muted)]">
                  選択したスポットの順番を更新し、他のスポットは末尾に保持します。
                </p>
              ) : null}
            </div>

            {aiError ? (
              <p className="text-sm text-rose-600">{aiError}</p>
            ) : null}

            {aiResult ? (
              <div className="space-y-3 border-t border-[var(--noir-border)] pt-4">
                <div>
                  <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                    {aiResult.route_name}
                  </p>
                  <p className="mt-2 text-sm">{aiResult.concept}</p>
                </div>
                <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--noir-muted)]">
                  {aiResult.reasoning_bullets.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {aiSpotSuggestions.length > 0 ? (
                  <div className="space-y-1 text-xs text-[var(--noir-muted)]">
                    <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                      おすすめスポット
                    </p>
                    <ul className="list-disc space-y-1 pl-4">
                      {aiSpotSuggestions.map((suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="space-y-2">
                  {aiResult.ordered_spot_ids
                    .map((id) => itemByPlaceId.get(id))
                    .filter(Boolean)
                    .map((item, index) => (
                      <div
                        key={`${item!.placeId}-${index}`}
                        className="flex items-center justify-between border border-[var(--noir-border)] px-3 py-2 text-sm"
                      >
                        <span>
                          {index + 1}. {item!.title}
                        </span>
                        <span className="text-xs text-[var(--noir-muted)]">
                          {aiTimeSuggestions?.get(item!.placeId!) ?? item!.time}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="border border-[var(--noir-border)] px-4 py-2 text-sm text-[var(--noir-muted)] transition hover:text-black"
              >
                閉じる
              </button>

              {aiResult ? (
                <button
                  type="button"
                  onClick={handleCreateAiShiori}
                  disabled={isAiCreating}
                  className="border border-black bg-black px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black disabled:border-[var(--noir-border)] disabled:bg-[var(--noir-surface)] disabled:text-[var(--noir-muted)]"
                >
                  {isAiCreating
                    ? "作成中..."
                    : aiApplyMode === "update"
                      ? "このしおりを更新"
                      : "このしおりとして取り込む"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRunAiRoute}
                  disabled={isAiLoading}
                  className="border border-black bg-black px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black disabled:border-[var(--noir-border)] disabled:bg-[var(--noir-surface)] disabled:text-[var(--noir-muted)]"
                >
                  {isAiLoading ? "提案中..." : "提案する"}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="text-left">
            <DialogTitle>エクスポート</DialogTitle>
            <DialogDescription className="text-xs text-[var(--noir-muted)]">
              しおりをJSONとしてダウンロードします。
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setExportOpen(false)}
              className="border border-[var(--noir-border)] px-4 py-2 text-sm text-[var(--noir-muted)] transition hover:text-black"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDownloadExport}
              className="border border-black bg-black px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black"
            >
              JSONをダウンロード
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailPlaceId(null);
            setDetailSaveRequested(false);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col rounded-none border border-[var(--noir-border)] bg-white p-0 font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="sticky top-0 z-10 bg-white px-4 pb-3 pt-4 pr-12 text-left shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <DialogTitle>店舗詳細</DialogTitle>
                <DialogDescription className="text-xs text-[var(--noir-muted)]">
                  しおり詳細をモーダルで確認できます。
                </DialogDescription>
              </div>
              {detailPlaceId ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailSaveRequested(true)}
                    className="rounded-full border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
                  >
                    しおりに追加
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(`/restaurant/${detailPlaceId}`, "_blank")
                    }
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                  >
                    詳細を開く
                  </button>
                </div>
              ) : null}
            </div>
          </DialogHeader>
          {detailPlaceId ? (
            <iframe
              title="店舗詳細"
              src={
                detailSaveRequested
                  ? `/restaurant/${detailPlaceId}?save=1&embedded=1`
                  : `/restaurant/${detailPlaceId}?embedded=1`
              }
              className="min-h-[60vh] flex-1 w-full border-0"
            />
          ) : (
            <div className="p-6 text-sm text-[var(--noir-muted)]">
              表示できる店舗がありません。
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={replaceOpen}
        onOpenChange={(open) => {
          setReplaceOpen(open);
          if (!open) {
            setReplaceTarget(null);
            setReplaceOptions([]);
            setReplaceError(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="text-left">
            <DialogTitle>代替スポット</DialogTitle>
            <DialogDescription className="text-xs text-[var(--noir-muted)]">
              近くの候補から1つ選んで入れ替えできます。
            </DialogDescription>
          </DialogHeader>

          {replaceTarget ? (
            <div className="mb-4 rounded-lg border border-[var(--noir-border)] bg-[var(--noir-surface)]/60 px-3 py-2 text-xs">
              現在: {replaceTarget.title}
            </div>
          ) : null}

          {replaceLoading ? (
            <div className="py-6 text-center text-sm text-[var(--noir-muted)]">
              候補を読み込み中...
            </div>
          ) : null}

          {replaceError ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {replaceError}
            </div>
          ) : null}

          {!replaceLoading && replaceOptions.length === 0 && !replaceError ? (
            <div className="py-6 text-center text-sm text-[var(--noir-muted)]">
              近くに代替候補が見つかりませんでした。
            </div>
          ) : null}

          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {replaceOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center gap-4 rounded-lg border border-[var(--noir-border)] bg-white p-3"
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={option.photoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--noir-ink)]">
                    {option.restaurantName ?? "名称未設定"}
                  </p>
                  <p className="text-xs text-[var(--noir-muted)]">
                    {option.primaryType ?? "スポット"}
                    {typeof option.rating === "number"
                      ? ` ・ 評価 ${option.rating.toFixed(1)}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReplace(option)}
                  disabled={replaceBusy}
                  className="rounded-full border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
                >
                  入れ替え
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {searchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                  スポット追加
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  店を検索
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:text-gray-800"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4">
              {canSearchPlace ? (
                <BookmarkPlaceSearch
                  bookmarkId={bookmarkId}
                  bookmarkTitle={bookmarkTitle}
                  lat={fallbackSearchLat}
                  lng={fallbackSearchLng}
                  savedPlaceIds={savedPlaceIds}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                  検索位置が取得できないため、スポット検索を利用できません。
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

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
    </div>
  );
}
