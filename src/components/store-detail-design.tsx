"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addBookmarkItemAction,
  createBookmarkAndAddItemAction,
} from "@/app/(private)/actions/bookmarkActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Clock,
  Grid,
  LoaderCircle,
  MapPin,
  Plus,
  Phone,
  Search,
  Send,
  Star,
} from "lucide-react";

export interface StoreDetailReview {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date?: string;
  avatar: string;
}

export interface StoreDetailData {
  id: string;
  name: string;
  japaneseName: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string;
  address: string;
  hours: string;
  phone: string;
  description: string;
  images: string[];
  features: string[];
  location?: {
    lat: number;
    lng: number;
  } | null;
  reviews: StoreDetailReview[];
}

type BookmarkSummary = {
  id: string;
  title: string;
  area: string | null;
  travel_date: string | null;
  created_at: string;
};

interface Props {
  data: StoreDetailData;
  sessionToken?: string;
  isLoggedIn?: boolean;
  bookmarks?: BookmarkSummary[];
  savedBookmarkIds?: string[];
  autoOpenBookmarkModal?: boolean;
}

const MAX_GALLERY_IMAGES = 10;
const formatBookmarkDate = (value: string | null | undefined) => {
  if (!value) return "未定";
  const [date] = value.split("T");
  return date.replaceAll("-", ".");
};

const StoreDetailDesign: React.FC<Props> = ({
  data,
  sessionToken,
  isLoggedIn = false,
  bookmarks = [],
  savedBookmarkIds = [],
  autoOpenBookmarkModal = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const embedded = searchParams.get("embedded") === "1";
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [bookmarkQuery, setBookmarkQuery] = useState("");
  const [bookmarkOptions, setBookmarkOptions] =
    useState<BookmarkSummary[]>(bookmarks);
  const [savedBookmarkIdSet, setSavedBookmarkIdSet] = useState(
    () => new Set(savedBookmarkIds)
  );
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
  const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    area: "",
    travelDate: "",
  });
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; href: string } | null>(
    null
  );
  const [reviewSummary, setReviewSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const autoOpenRef = useRef(false);
  const hasSavedBookmark = savedBookmarkIdSet.size > 0;
  const saveButtonLabel = isLoggedIn
    ? hasSavedBookmark
      ? "保存済み"
      : "しおりに追加"
    : "ログインして保存";
  const loginHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("save", "1");
    const query = params.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }, [pathname, searchParams]);
  const resolvedPlaceName = useMemo(() => {
    const candidates = [data.japaneseName, data.name, data.id];
    return (
      candidates.map((value) => value.trim()).find((value) => value.length > 0) ??
      "選択した店舗"
    );
  }, [data.japaneseName, data.name, data.id]);
  const filteredBookmarks = useMemo(() => {
    const query = bookmarkQuery.trim().toLowerCase();
    if (!query) {
      return bookmarkOptions;
    }
    return bookmarkOptions.filter((bookmark) =>
      bookmark.title.toLowerCase().includes(query)
    );
  }, [bookmarkOptions, bookmarkQuery]);

  const reviewAvatarFallback = "/review-avatar.svg?v=1";

  const resolveAvatarSrc = (avatar: string) => {
    if (avatar && avatar.trim().length > 0) {
      return avatar;
    }
    return reviewAvatarFallback;
  };

  const notifyParentUpdated = (bookmarkId?: string) => {
    if (!embedded || typeof window === "undefined") {
      return;
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: "tabeful:bookmark-updated",
            bookmarkId: bookmarkId ?? null,
            placeId: data.id,
          },
          "*"
        );
      }
    } catch {
      // 別ウィンドウ由来の失敗は無視する
    }
  };

  useEffect(() => {
    setBookmarkOptions(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    setSavedBookmarkIdSet(new Set(savedBookmarkIds));
  }, [savedBookmarkIds]);

  useEffect(() => {
    if (autoOpenBookmarkModal && isLoggedIn && !autoOpenRef.current) {
      setIsBookmarkModalOpen(true);
      autoOpenRef.current = true;
    }
  }, [autoOpenBookmarkModal, isLoggedIn]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState(
    data.images.slice(0, MAX_GALLERY_IMAGES)
  );
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [hasLoadedMoreImages, setHasLoadedMoreImages] = useState(false);
  const totalImages = galleryImages.length;
  const heroImages = galleryImages.slice(0, 5);
  const hasHeroImages = heroImages.length > 0;
  const hasGalleryImages = totalImages > 0;
  const activeImage = hasGalleryImages
    ? galleryImages[activeImageIndex]
    : "";
  const remainingImageCount = Math.max(totalImages - heroImages.length, 0);
  const hasLocation = Boolean(data.location);
  const staticMapUrl = data.location
    ? `/api/maps/static?lat=${data.location.lat}&lng=${data.location.lng}&zoom=14&size=800x400`
    : "";
  const mapEmbedUrl = data.location
    ? `/api/maps/embed?lat=${data.location.lat}&lng=${data.location.lng}&zoom=16`
    : "";

  const loadMoreImages = async () => {
    if (!data.id) {
      return;
    }
    if (isGalleryLoading || hasLoadedMoreImages) {
      return;
    }
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      setHasLoadedMoreImages(true);
      return;
    }
    setIsGalleryLoading(true);
    try {
      const params = new URLSearchParams({
        placeId: data.id,
        count: "10",
      });
      if (sessionToken) {
        params.set("sessionToken", sessionToken);
      }
      const response = await fetch(`/api/restaurant/photos?${params.toString()}`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { images?: string[] };
      const nextImages = Array.isArray(payload.images) ? payload.images : [];
      if (nextImages.length === 0) {
        setHasLoadedMoreImages(true);
        return;
      }
      setGalleryImages((current) => {
        const seen = new Set(current);
        const merged = [...current];
        for (const url of nextImages) {
          if (merged.length >= MAX_GALLERY_IMAGES) {
            break;
          }
          if (seen.has(url)) {
            continue;
          }
          seen.add(url);
          merged.push(url);
        }
        return merged.slice(0, MAX_GALLERY_IMAGES);
      });
      setHasLoadedMoreImages(true);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const openBookmarkModal = () => {
    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }
    setModalError(null);
    setIsBookmarkModalOpen(true);
  };

  const addPlaceToBookmark = async (bookmark: BookmarkSummary) => {
    if (activeSaveId) {
      return;
    }
    setModalError(null);
    setActiveSaveId(bookmark.id);
    try {
      const result = await addBookmarkItemAction(
        bookmark.id,
        {
          type: "placePrediction",
          placeId: data.id,
          placeName: resolvedPlaceName,
        },
        sessionToken
      );
      setSavedBookmarkIdSet((current) => {
        const next = new Set(current);
        next.add(bookmark.id);
        return next;
      });
      const message =
        result.status === "existing"
          ? `「${bookmark.title}」は保存済みです`
          : `「${bookmark.title}」に追加しました`;
      setToast({ message, href: `/bookmarks/${bookmark.id}` });
      notifyParentUpdated(bookmark.id);
    } catch (error) {
      console.error("Failed to save bookmark item.", error);
      setModalError("しおりに追加できませんでした。");
    } finally {
      setActiveSaveId(null);
    }
  };

  const createBookmarkAndAdd = async () => {
    if (isCreatingBookmark) {
      return;
    }
    const title = createForm.title.trim();
    if (!title) {
      setModalError("タイトルを入力してください。");
      return;
    }
    setModalError(null);
    setIsCreatingBookmark(true);
    try {
      const result = await createBookmarkAndAddItemAction({
        title,
        area: createForm.area,
        travelDate: createForm.travelDate,
        placeId: data.id,
        placeName: resolvedPlaceName,
        sessionToken,
      });
      setBookmarkOptions((current) => [result.bookmark, ...current]);
      setSavedBookmarkIdSet((current) => {
        const next = new Set(current);
        next.add(result.bookmark.id);
        return next;
      });
      setCreateForm({ title: "", area: "", travelDate: "" });
      setBookmarkQuery("");
      const message =
        result.status === "existing"
          ? `「${result.bookmark.title}」は保存済みです`
          : `「${result.bookmark.title}」に追加しました`;
      setToast({ message, href: `/bookmarks/${result.bookmark.id}` });
      notifyParentUpdated(result.bookmark.id);
    } catch (error) {
      console.error("Failed to create bookmark.", error);
      setModalError("しおりを作成できませんでした。");
    } finally {
      setIsCreatingBookmark(false);
    }
  };

  const openGallery = (index: number) => {
    if (!hasGalleryImages) {
      return;
    }
    const safeIndex = Math.min(index, galleryImages.length - 1);
    setActiveImageIndex(safeIndex);
    setIsGalleryOpen(true);
    void loadMoreImages();
  };

  const showNextImage = () => {
    if (!hasGalleryImages) {
      return;
    }
    setActiveImageIndex((current) => (current + 1) % totalImages);
  };

  const showPrevImage = () => {
    if (!hasGalleryImages) {
      return;
    }
    setActiveImageIndex((current) => (current - 1 + totalImages) % totalImages);
  };

  const hasDescription = data.description.trim().length > 0;
  const hasFeatures = data.features.length > 0;
  const hasName = data.japaneseName.trim().length > 0;
  const hasCategory = data.category.trim().length > 0;
  const hasAddress = data.address.trim().length > 0;
  const hasRatingValue =
    typeof data.rating === "number" && Number.isFinite(data.rating) && data.rating > 0;
  const hasReviewCount =
    typeof data.reviewCount === "number" && data.reviewCount > 0;
  const showRatingBlock = data.rating == null || hasRatingValue || hasReviewCount;
  const hasReviews = data.reviews.length > 0;
  const hasHours = data.hours.trim().length > 0;
  const hasPhone = data.phone.trim().length > 0;
  const hasInfoPanel = hasHours || hasPhone;
  const leftColumnClassName = hasInfoPanel
    ? "lg:col-span-2 space-y-16"
    : "lg:col-span-3 space-y-16";

  const handleSummarizeReviews = async () => {
    if (summaryLoading || !hasReviews) {
      return;
    }
    const reviewTexts = data.reviews
      .map((review) => review.comment)
      .filter((text) => text.trim().length > 0)
      .slice(0, 8);
    if (reviewTexts.length === 0) {
      setSummaryError("要約できるレビューがありません。");
      return;
    }
    setSummaryError(null);
    setSummaryLoading(true);
    try {
      const response = await fetch("/api/ai/review-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: reviewTexts }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setSummaryError(payload?.error ?? "レビュー要約に失敗しました。");
        return;
      }
      setReviewSummary(payload?.summary ?? null);
    } catch (error) {
      console.error("Failed to summarize reviews.", error);
      setSummaryError("レビュー要約に失敗しました。");
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="bg-white text-[#262626] min-h-screen font-sans pb-20 selection:bg-rose-100 selection:text-rose-900">
      {/* UI忠実再現: ナビゲーション */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-600 transition group"
        >
          <ArrowLeft size={20} strokeWidth={2} />
          <span>BACK</span>
        </button>
      </div>

      {/* UI忠実再現: ヘッダー情報 */}
      <div className="max-w-7xl mx-auto px-6 pt-2 pb-10 animate-fade">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            {hasName ? (
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2 text-gray-900">
                {data.japaneseName}
              </h1>
            ) : null}
            {hasCategory || hasAddress ? (
              <div className="flex items-center gap-2 text-base mb-5">
                {hasCategory ? (
                  <span className="font-semibold text-gray-900">
                    {data.category}
                  </span>
                ) : null}
                {hasCategory && hasAddress ? (
                  <span className="text-gray-300">・</span>
                ) : null}
                {hasAddress ? (
                  <span className="text-gray-600 truncate">{data.address}</span>
                ) : null}
              </div>
            ) : null}

            {showRatingBlock ? (
              <div className="flex items-center gap-6 text-sm lg:text-base">
                {hasRatingValue ? (
                  <div className="flex items-center gap-1">
                    <Star size={18} className="fill-black text-black" />
                    <span className="font-bold">{data.rating}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">評価なし</span>
                )}
                {hasReviewCount ? (
                  <span className="text-gray-500">
                    <span className="font-bold text-black">
                      {data.reviewCount}
                    </span>
                    件のレビュー
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {!embedded ? (
            <div className="flex gap-3">
              <button
                type="button"
                className="p-3 hover:bg-gray-100 rounded-full transition"
                aria-label="共有"
              >
                <Send
                  size={24}
                  strokeWidth={1.5}
                  className="text-black -rotate-45 translate-y-1 -translate-x-1"
                />
              </button>
              <button
                type="button"
                onClick={openBookmarkModal}
                className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                aria-label="しおりに追加"
              >
                <Bookmark
                  size={18}
                  strokeWidth={1.5}
                  fill={hasSavedBookmark ? "white" : "none"}
                  className="text-white"
                />
                <span>{saveButtonLabel}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* UI忠実再現: ヒーローグリッド */}
      {hasHeroImages ? (
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-4 grid-rows-2 gap-1 h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <button
              type="button"
              onClick={() => openGallery(0)}
              className="col-span-2 row-span-2 relative group cursor-pointer bg-gray-100 p-0 text-left"
              aria-label="ギャラリーを開く"
            >
              <Image
                src={heroImages[0]}
                alt=""
                fill
                className="object-cover group-hover:opacity-95 transition duration-300"
              />
              <div className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition backdrop-blur-sm">
                <ArrowUpRight size={18} />
              </div>
            </button>

            {heroImages[1] ? (
              <button
                type="button"
                onClick={() => openGallery(1)}
                className="col-span-1 row-span-1 relative group cursor-pointer bg-gray-100 p-0 text-left"
                aria-label="ギャラリーを開く"
              >
                <Image
                  src={heroImages[1]}
                  alt=""
                  fill
                  className="object-cover group-hover:opacity-95 transition duration-300"
                />
              </button>
            ) : null}
            {heroImages[2] ? (
              <button
                type="button"
                onClick={() => openGallery(2)}
                className="col-span-1 row-span-1 relative group cursor-pointer bg-gray-100 p-0 text-left"
                aria-label="ギャラリーを開く"
              >
                <Image
                  src={heroImages[2]}
                  alt=""
                  fill
                  className="object-cover group-hover:opacity-95 transition duration-300"
                />
              </button>
            ) : null}
            {heroImages[3] ? (
              <button
                type="button"
                onClick={() => openGallery(3)}
                className="col-span-1 row-span-1 relative group cursor-pointer bg-gray-100 p-0 text-left"
                aria-label="ギャラリーを開く"
              >
                <Image
                  src={heroImages[3]}
                  alt=""
                  fill
                  className="object-cover group-hover:opacity-95 transition duration-300"
                />
              </button>
            ) : null}

            {heroImages[4] ? (
              <button
                type="button"
                onClick={() => openGallery(4)}
                className="col-span-1 row-span-1 relative group cursor-pointer bg-gray-100 p-0 text-left"
                aria-label="ギャラリーを開く"
              >
                <Image
                  src={heroImages[4]}
                  alt=""
                  fill
                  className="object-cover group-hover:opacity-95 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition">
                  <div className="text-white flex flex-col items-center">
                    <Grid size={24} />
                    {remainingImageCount > 0 ? (
                      <span className="text-sm font-bold mt-1">
                        +{remainingImageCount}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold mt-1">
                        ギャラリー
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* UI忠実再現: メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
        {/* UI忠実再現: 左カラム */}
        <div className={leftColumnClassName}>
          {/* UI忠実再現: 説明 */}
          {hasDescription || hasFeatures ? (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                お店について
              </h2>
              {hasDescription ? (
                <div className="prose prose-lg text-gray-700 leading-relaxed max-w-none">
                  <p>{data.description}</p>
                </div>
              ) : null}

              {hasFeatures ? (
                <div className="mt-8 w-full overflow-x-auto no-scrollbar pb-2">
                  <div className="flex w-max gap-3">
                    {data.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex-shrink-0 bg-gray-100 px-5 py-2 rounded-full border border-gray-200"
                      >
                        <span className="text-sm font-semibold text-gray-800">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* UI忠実再現: 場所 */}
          {hasLocation ? (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">地図</h2>
              <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl overflow-hidden border border-gray-200 h-[360px] lg:h-[460px] w-full relative group shadow-sm">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 opacity-90 group-hover:opacity-100"
                    style={{ backgroundImage: `url('${staticMapUrl}')` }}
                  ></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <MapPin
                        size={40}
                        className="text-rose-500 drop-shadow-lg fill-rose-500 relative z-10"
                      />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 w-4 h-1.5 bg-black/20 blur-sm rounded-full"></div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="absolute inset-0 z-10"
                    aria-label="Googleマップを開く"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 flex justify-between items-center z-20">
                    <div>
                      {hasAddress ? (
                        <p className="font-bold text-gray-900 text-sm">
                          {data.address}
                        </p>
                      ) : null}
                      <p className="text-xs text-gray-500">
                        クリックしてGoogleマップを開く
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition"
                    >
                      地図を見る
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* UI忠実再現: レビュー */}
          {hasReviews ? (
            <section>
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">レビュー</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSummarizeReviews}
                    disabled={summaryLoading}
                    className="text-xs font-semibold text-gray-500 hover:text-black transition disabled:opacity-50"
                  >
                    {summaryLoading ? "要約中..." : "AIで要約"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReviewsOpen(true)}
                    className="text-sm font-medium text-gray-500 hover:text-black transition"
                  >
                    もっと見る
                  </button>
                </div>
              </div>

              {reviewSummary ? (
                <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    AIレビュー要約
                  </p>
                  <p className="whitespace-pre-line">{reviewSummary}</p>
                </div>
              ) : null}
              {summaryError ? (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                  {summaryError}
                </div>
              ) : null}

              <div className="space-y-8">
                {data.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition duration-300"
                  >
                    <Image
                      src={resolveAvatarSrc(review.avatar)}
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (target.dataset.fallbackApplied) return;
                        target.dataset.fallbackApplied = "true";
                        target.src = reviewAvatarFallback;
                      }}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      alt=""
                      width={40}
                      height={40}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-base text-gray-900">
                          {review.user}
                        </span>
                        {review.date ? (
                          <span className="text-xs text-gray-500">
                            {review.date}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={12}
                            className={
                              index < review.rating
                                ? "fill-black text-black"
                                : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-base text-gray-800 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* UI忠実再現: 右カラム */}
        {hasInfoPanel ? (
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* UI忠実再現: 情報パネル */}
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6 text-lg">
                  店舗情報
                </h3>

                <div className="space-y-6">
                  {hasHours ? (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shrink-0">
                        <Clock size={16} className="text-black" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          営業時間
                        </p>
                        <p className="text-sm font-medium text-gray-900 whitespace-pre-line">
                          {data.hours}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {hasPhone ? (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200 shrink-0">
                        <Phone size={16} className="text-black" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                          電話番号
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {data.phone}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={isBookmarkModalOpen} onOpenChange={setIsBookmarkModalOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-xl font-bold text-gray-900">
              しおりに追加
            </DialogTitle>
            <p className="text-sm text-gray-500">
              保存先のしおりを選択してください。
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
              <Search size={16} className="text-gray-400" />
              <input
                value={bookmarkQuery}
                onChange={(event) => setBookmarkQuery(event.target.value)}
                placeholder="しおりを検索"
                aria-label="しおりを検索"
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {filteredBookmarks.length > 0 ? (
                filteredBookmarks.map((bookmark) => {
                  const isSaved = savedBookmarkIdSet.has(bookmark.id);
                  const isBusy = activeSaveId !== null;
                  const isSaving = activeSaveId === bookmark.id;
                  return (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {bookmark.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {bookmark.area || "未定"} ・{" "}
                          {formatBookmarkDate(bookmark.travel_date)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isSaved || isBusy}
                        onClick={() => addPlaceToBookmark(bookmark)}
                        className="flex items-center gap-2 rounded-full border border-gray-900 px-3 py-1 text-xs font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                      >
                        {isSaving ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : null}
                        <span>{isSaved ? "保存済み" : "追加"}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  該当するしおりが見つかりません。
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  新しいしおり
                </h3>
                <span className="text-xs text-gray-400">最小入力</span>
              </div>
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
                  aria-label="タイトル"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-900"
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
                  aria-label="エリア"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-900"
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
                  aria-label="日付"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-900"
                />
              </div>
              <button
                type="button"
                onClick={createBookmarkAndAdd}
                disabled={isCreatingBookmark || !createForm.title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-500"
              >
                {isCreatingBookmark ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
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

      {/* UI忠実再現: ギャラリーモーダル */}
      {isGalleryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsGalleryOpen(false)}
            className="absolute inset-0"
            aria-label="ギャラリーを閉じる"
          />
          <div className="relative z-10 w-[96vw] max-w-6xl px-2">
            <div className="relative w-full bg-black/80 rounded-xl overflow-hidden shadow-2xl">
              <div className="relative h-[84vh] bg-black flex items-center justify-center">
                {hasGalleryImages ? (
                  <Image
                    src={activeImage}
                    alt=""
                    fill
                    className="object-contain"
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={showPrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-gray-900 flex items-center justify-center hover:bg-white transition"
                aria-label="前の画像"
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-gray-900 flex items-center justify-center hover:bg-white transition"
                aria-label="次の画像"
              >
                {">"}
              </button>

              <div className="absolute top-4 right-4 flex items-center gap-3">
                <span className="text-xs font-sans tracking-widest text-white/70">
                  {hasGalleryImages
                    ? `${activeImageIndex + 1} / ${totalImages}`
                    : "0 / 0"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsGalleryOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/90 text-gray-900 flex items-center justify-center hover:bg-white transition"
                  aria-label="ギャラリーを閉じる"
                >
                  X
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* UI忠実再現: レビューモーダル */}
      {isReviewsOpen && hasReviews ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsReviewsOpen(false)}
            className="absolute inset-0"
            aria-label="レビューを閉じる"
          />
          <div className="relative z-10 w-[92vw] max-w-3xl px-4">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-white">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">レビュー</h3>
                <button
                  type="button"
                  onClick={() => setIsReviewsOpen(false)}
                  className="w-9 h-9 rounded-full bg-black/90 text-white flex items-center justify-center hover:bg-black transition"
                  aria-label="レビューを閉じる"
                >
                  X
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6 space-y-6">
                {data.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex gap-4 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0"
                  >
                    <Image
                      src={resolveAvatarSrc(review.avatar)}
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (target.dataset.fallbackApplied) return;
                        target.dataset.fallbackApplied = "true";
                        target.src = reviewAvatarFallback;
                      }}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      alt=""
                      width={40}
                      height={40}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-base text-gray-900">
                          {review.user}
                        </span>
                        {review.date ? (
                          <span className="text-xs text-gray-500">
                            {review.date}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={12}
                            className={
                              index < review.rating
                                ? "fill-black text-black"
                                : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-base text-gray-800 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* UI忠実再現: マップモーダル */}
      {isMapOpen && hasLocation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsMapOpen(false)}
            className="absolute inset-0"
            aria-label="地図を閉じる"
          />
          <div className="relative z-10 w-[96vw] max-w-6xl px-3">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-white">
              <div className="h-[85vh] min-h-[360px] bg-white">
                <iframe
                  title="Google Maps"
                  src={mapEmbedUrl}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapOpen(false)}
                  className="w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black transition"
                  aria-label="地図を閉じる"
                >
                  X
                </button>
              </div>
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
};

export default StoreDetailDesign;
