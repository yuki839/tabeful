"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Book,
  FolderOpen,
  Grid,
  Image as ImageIcon,
  LoaderCircle,
  MapPin as MapPinIcon,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createAlbumPostAction,
  deleteAlbumPostAction,
} from "@/app/(private)/actions/albumActions";

type GlobalViewMode = "albums" | "all_photos";
type DetailViewMode = "gallery" | "journal";

export interface AlbumCollection {
  id: string;
  albumId: string;
  title: string;
  date: string;
  cover: string;
  photoCount: number;
  area: string;
  tags: string[];
  bookmarkId: string;
}

export interface AlbumPhoto {
  id: string;
  src: string;
  date: string;
  area: string;
  caption?: string | null;
  bookmarkId: string;
  bookmarkTitle: string;
  location?: { lat: number; lng: number };
}

export interface AlbumBookmarkOption {
  id: string;
  title: string;
  area: string | null;
  date: string | null;
}

interface AlbumScreenProps {
  collections?: AlbumCollection[];
  allPhotos?: AlbumPhoto[];
  bookmarkOptions?: AlbumBookmarkOption[];
  onExposePostOpener?: (fn: (bookmarkId: string) => void) => void;
}

type AlbumsViewProps = {
  collections: AlbumCollection[];
  postsByAlbum: Map<string, AlbumPhoto[]>;
  onSelectAlbum: (albumId: string) => void;
};

const AlbumsView = ({
  collections,
  postsByAlbum,
  onSelectAlbum,
}: AlbumsViewProps) => {
  if (collections.length === 0) {
    return (
      <div className="px-4 pb-24 text-sm font-ui text-[var(--noir-muted)] md:px-12">
        まだアルバムがありません。しおりから写真を投稿してみましょう。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 px-4 pb-24 md:grid-cols-2 md:px-12 lg:grid-cols-3">
      {collections.map((album) => {
        const albumPosts = postsByAlbum.get(album.id) ?? [];

        return (
          <div
            key={album.id}
            onClick={() => onSelectAlbum(album.id)}
            className="group cursor-pointer"
          >
            <div className="relative border border-[var(--noir-border)] bg-white shadow-[0_14px_32px_rgba(15,15,15,0.12)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_22px_50px_rgba(15,15,15,0.18)]">
              <div className="relative p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                      {album.date}
                    </p>
                    <h3 className="mt-2 font-display text-lg text-[var(--noir-ink)]">
                      {album.title}
                    </h3>
                    <p className="mt-2 text-xs font-ui text-[var(--noir-muted)]">
                      {album.area}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 border border-[var(--noir-border)] bg-[var(--noir-surface)] px-2 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                    <ImageIcon size={12} /> {album.photoCount}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="col-span-full overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)]">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={album.cover}
                        alt={album.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                        {album.date}
                      </p>
                      <p className="line-clamp-2 text-sm text-[var(--noir-ink)]">
                        {album.title}
                      </p>
                    </div>
                  </div>
                </div>

                {albumPosts.length > 0 ? (
                  <div className="mt-4 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                    写真 {albumPosts.length}枚
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

type AllPhotosViewProps = {
  allPhotos: AlbumPhoto[];
  onOpenPhoto: (photo: AlbumPhoto) => void;
};

const AllPhotosView = ({ allPhotos, onOpenPhoto }: AllPhotosViewProps) => {
  if (allPhotos.length === 0) {
    return (
      <div className="px-4 pb-24 text-sm font-ui text-[var(--noir-muted)] md:px-12">
        まだ写真がありません。しおりから写真をアップロードしてください。
      </div>
    );
  }

  return (
    <div className="columns-2 gap-4 space-y-4 px-4 pb-24 md:columns-4 md:px-12">
      {allPhotos.map((photo) => (
        <button
          type="button"
          key={photo.id}
          className="group relative w-full break-inside-avoid overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)] text-left"
          onClick={() => onOpenPhoto(photo)}
        >
          <img src={photo.src} alt={photo.caption ?? "アルバムの写真"} />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="space-y-2 p-4 text-white">
              <p className="text-[10px] font-ui uppercase tracking-[0.3em]">
                {photo.bookmarkTitle}
              </p>
              {photo.caption ? <p className="text-sm">{photo.caption}</p> : null}
              <p className="text-[11px] text-white/70">
                {photo.area} / {photo.date}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

type DetailViewProps = {
  detailTitle: string;
  detailDate: string;
  detailArea: string;
  detailCover: string;
  detailPosts: AlbumPhoto[];
  detailTags: string[];
  detailViewMode: DetailViewMode;
  onBack: () => void;
  onOpenPost: () => void;
  onChangeViewMode: (mode: DetailViewMode) => void;
  onOpenPhoto: (photo: AlbumPhoto) => void;
};

const DetailView = ({
  detailTitle,
  detailDate,
  detailArea,
  detailCover,
  detailPosts,
  detailTags,
  detailViewMode,
  onBack,
  onOpenPost,
  onChangeViewMode,
  onOpenPhoto,
}: DetailViewProps) => (
  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--noir-border)] bg-white/90 px-4 py-4 backdrop-blur-md md:px-12">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBack();
        }}
        className="flex items-center gap-2 text-sm font-ui uppercase tracking-[0.2em] text-[var(--noir-muted)] transition hover:text-black"
      >
        ライブラリに戻る
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenPost();
          }}
          className="flex items-center gap-2 border border-black bg-black px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
        >
          <Plus size={14} /> 投稿
        </button>

        <div className="flex gap-2 border border-[var(--noir-border)] bg-[var(--noir-surface)] p-1">
          <button
            type="button"
            onClick={() => onChangeViewMode("gallery")}
            className={`p-1.5 transition-all ${
              detailViewMode === "gallery"
                ? "bg-white text-black shadow-sm"
                : "text-[var(--noir-muted)]"
            }`}
            aria-label="gallery"
          >
            <Grid size={16} />
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode("journal")}
            className={`p-1.5 transition-all ${
              detailViewMode === "journal"
                ? "bg-white text-black shadow-sm"
                : "text-[var(--noir-muted)]"
            }`}
            aria-label="journal"
          >
            <Book size={16} />
          </button>
        </div>
      </div>
    </div>

    <div className="px-4 pb-12 pt-8 md:px-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-end">
        <div className="aspect-video w-full overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)] md:w-1/3 md:aspect-[4/3]">
          <img src={detailCover} alt="アルバムカバー" />
        </div>

        <div className="flex-1 pb-2">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
            <MapPinIcon size={14} /> {detailArea}
          </div>

          <h1 className="font-display text-3xl tracking-[0.08em] text-[var(--noir-ink)] md:text-5xl">
            {detailTitle}
          </h1>

          <p className="mt-3 text-sm font-ui text-[var(--noir-muted)]">
            {detailDate} / {detailPosts.length} 枚
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {detailTags.map((tag) => (
              <span
                key={tag}
                className="border border-[var(--noir-border)] bg-white px-3 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="px-4 pb-24 md:px-12">
      {detailViewMode === "gallery" ? (
        detailPosts.length > 0 ? (
          <div className="columns-2 gap-6 space-y-6 md:columns-3 lg:columns-4">
            {detailPosts.map((post) => (
              <div key={post.id} className="group relative mb-6 break-inside-avoid">
                <button
                  type="button"
                  className="relative w-full overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)] text-left shadow-[0_18px_40px_rgba(15,15,15,0.12)] transition-all duration-500 group-hover:shadow-[0_28px_60px_rgba(15,15,15,0.2)]"
                  onClick={() => onOpenPhoto(post)}
                >
                  <img
                    src={post.src}
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={post.caption ?? post.bookmarkTitle}
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="p-4 text-white">
                      <h3 className="font-display text-lg">{post.bookmarkTitle}</h3>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-ui uppercase tracking-[0.2em] text-white/70">
                        <span>{post.date}</span>
                        {post.caption ? (
                          <span className="line-clamp-1 max-w-[140px] text-right text-white/80">
                            {post.caption}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-[var(--noir-border)] bg-[var(--noir-surface)] p-6 text-sm font-ui text-[var(--noir-muted)]">
            まだ写真がありません。
          </div>
        )
      ) : detailPosts.length > 0 ? (
        <div className="relative mx-auto max-w-3xl space-y-12">
          <div className="absolute left-4 top-0 h-full w-px bg-[var(--noir-border)]" />
          {detailPosts.map((post) => (
            <div key={post.id} className="relative pl-12">
              <div className="absolute left-4 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--noir-border)]" />
              <span className="block text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                {post.date}
              </span>

              <div className="mt-4 flex flex-col gap-4">
                <button
                  type="button"
                  className="aspect-video w-full overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)] text-left"
                  onClick={() => onOpenPhoto(post)}
                >
                  <img
                    src={post.src}
                    className="h-full w-full object-cover"
                    alt={post.caption ?? post.bookmarkTitle}
                  />
                </button>

                <div>
                  <h3 className="font-display text-xl text-[var(--noir-ink)]">{post.bookmarkTitle}</h3>
                  <p className="mt-2 text-sm font-ui text-[var(--noir-muted)]">
                    {post.caption ? post.caption : "キャプションなし"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-[var(--noir-border)] bg-[var(--noir-surface)] p-6 text-sm font-ui text-[var(--noir-muted)]">
          まだ写真がありません。
        </div>
      )}
    </div>
  </div>
);

export default function AlbumScreen(props: AlbumScreenProps) {
  const router = useRouter();

  const collections = useMemo(() => props.collections ?? [], [props.collections]);
  const allPhotos = useMemo(() => props.allPhotos ?? [], [props.allPhotos]);
  const bookmarkOptions = useMemo(
    () => props.bookmarkOptions ?? [],
    [props.bookmarkOptions]
  );
  const onExposePostOpener = props.onExposePostOpener;

  const [globalView, setGlobalView] = useState<GlobalViewMode>("albums");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("gallery");

  const [postOpen, setPostOpen] = useState(false);
  const [postBookmarkId, setPostBookmarkId] = useState<string>("");
  const [postCaption, setPostCaption] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [isPosting, startPosting] = useTransition();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null);
  const [isDeletingPhoto, startDeletingPhoto] = useTransition();

  const resolvedPostBookmarkId =
    postBookmarkId || bookmarkOptions[0]?.id || "";

  const postsByAlbum = useMemo(() => {
    const map = new Map<string, AlbumPhoto[]>();
    for (const photo of allPhotos) {
      const list = map.get(photo.bookmarkId) ?? [];
      list.push(photo);
      map.set(photo.bookmarkId, list);
    }
    return map;
  }, [allPhotos]);

  const activeAlbum = useMemo(() => {
    if (collections.length === 0) return null;
    if (!selectedAlbumId) return collections[0];
    return collections.find((a) => a.id === selectedAlbumId) ?? collections[0];
  }, [collections, selectedAlbumId]);

  const activePosts = useMemo(() => {
    if (!activeAlbum) return [];
    return postsByAlbum.get(activeAlbum.id) ?? [];
  }, [activeAlbum, postsByAlbum]);

  const handleOpenPost = useCallback(
    (opts?: { bookmarkId?: string }) => {
      if (bookmarkOptions.length === 0) {
        setPostError("しおりがありません。先にしおりを作成してください。");
        setPostOpen(true);
        return;
      }

      const fallbackId = bookmarkOptions[0]?.id ?? "";
      const targetBookmarkId = opts?.bookmarkId ?? resolvedPostBookmarkId ?? fallbackId;

      if (targetBookmarkId) setPostBookmarkId(targetBookmarkId);

      setPostError(null);
      setPostOpen(true);
    },
    [bookmarkOptions, resolvedPostBookmarkId]
  );

  useEffect(() => {
    if (!onExposePostOpener) return;
    onExposePostOpener((bookmarkId: string) => handleOpenPost({ bookmarkId }));
  }, [onExposePostOpener, handleOpenPost]);

  const handleCreatePost = useCallback(() => {
    if (!postFile) {
      setPostError("写真を選択してください。");
      return;
    }
    if (!resolvedPostBookmarkId) {
      setPostError("しおりを選択してください。");
      return;
    }

    setPostError(null);

    const formData = new FormData();
    formData.append("photo", postFile);
    formData.append("caption", postCaption.trim());
    formData.append("bookmarkId", resolvedPostBookmarkId);

    startPosting(async () => {
      try {
        await createAlbumPostAction(formData);
        setPostCaption("");
        setPostFile(null);
        setPostOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to create album post.", error);
        setPostError("写真の投稿に失敗しました。");
      }
    });
  }, [postFile, resolvedPostBookmarkId, postCaption, router]);

  const handleOpenPhoto = useCallback((photo: AlbumPhoto) => {
    setSelectedPhoto(photo);
    setPhotoModalOpen(true);
  }, []);

  const handleDeletePhoto = useCallback(() => {
    if (!selectedPhoto) return;
    startDeletingPhoto(async () => {
      try {
        await deleteAlbumPostAction(selectedPhoto.id);
        setPhotoModalOpen(false);
        setSelectedPhoto(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete album post.", error);
      }
    });
  }, [router, selectedPhoto]);

  const detailTitle = activeAlbum?.title ?? "アルバム";
  const detailDate = activeAlbum?.date ?? "";
  const detailArea = activeAlbum?.area ?? "未設定";
  const detailCover = activeAlbum?.cover ?? "/no_image.png";
  const detailPosts = activeAlbum ? activePosts : [];
  const detailTags = activeAlbum?.tags ?? [];

  const handleOpenPostForDetail = useCallback(() => {
    handleOpenPost({ bookmarkId: activeAlbum?.bookmarkId ?? activeAlbum?.id });
  }, [activeAlbum, handleOpenPost]);

  return (
    <div className="h-full overflow-y-auto bg-[var(--noir-bg)] text-[var(--noir-ink)]">
      {selectedAlbumId ? (
        <DetailView
          detailTitle={detailTitle}
          detailDate={detailDate}
          detailArea={detailArea}
          detailCover={detailCover}
          detailPosts={detailPosts}
          detailTags={detailTags}
          detailViewMode={detailViewMode}
          onBack={() => setSelectedAlbumId(null)}
          onOpenPost={handleOpenPostForDetail}
          onChangeViewMode={setDetailViewMode}
          onOpenPhoto={handleOpenPhoto}
        />
      ) : (
        <>
          <div className="px-4 pb-6 pt-12 md:px-12">
            <div className="flex flex-col gap-6 border-b border-[var(--noir-border)] pb-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                  マイコレクション
                </p>
                <h1 className="mt-2 font-display text-3xl tracking-[0.08em] text-[var(--noir-ink)] md:text-5xl">
                  アルバム
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex border border-[var(--noir-border)] bg-[var(--noir-surface)] p-1">
                  <button
                    type="button"
                    onClick={() => setGlobalView("albums")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-ui uppercase tracking-[0.2em] transition-all ${
                      globalView === "albums"
                        ? "bg-white text-black shadow-sm"
                        : "text-[var(--noir-muted)] hover:text-black"
                    }`}
                  >
                    <FolderOpen size={16} /> アルバム
                  </button>

                  <button
                    type="button"
                    onClick={() => setGlobalView("all_photos")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-ui uppercase tracking-[0.2em] transition-all ${
                      globalView === "all_photos"
                        ? "bg-white text-black shadow-sm"
                        : "text-[var(--noir-muted)] hover:text-black"
                    }`}
                  >
                    <ImageIcon size={16} /> 写真
                  </button>

                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenPost();
                  }}
                  className="flex items-center gap-2 border border-black bg-black px-3 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black"
                >
                  <Plus size={14} /> 投稿
                </button>
              </div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {globalView === "albums" && (
              <AlbumsView
                collections={collections}
                postsByAlbum={postsByAlbum}
                onSelectAlbum={setSelectedAlbumId}
              />
            )}
            {globalView === "all_photos" && (
              <AllPhotosView allPhotos={allPhotos} onOpenPhoto={handleOpenPhoto} />
            )}
          </div>
        </>
      )}

      <Dialog
        open={postOpen}
        onOpenChange={(open) => {
          setPostOpen(open);
          if (!open) setPostError(null);
        }}
      >
        <DialogContent className="z-[9999] max-w-2xl rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="text-left">
            <DialogTitle>写真を投稿</DialogTitle>
            <DialogDescription className="text-xs text-[var(--noir-muted)]">
              写真とキャプションを選んで投稿できます。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="album-post-photo"
                className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
              >
                写真
              </label>
              <input
                id="album-post-photo"
                type="file"
                accept="image/*"
                onChange={(event) => setPostFile(event.target.files?.[0] ?? null)}
                className="w-full border border-[var(--noir-border)] bg-white px-3 py-2 text-sm outline-none"
              />
              {postFile ? (
                <p className="text-xs text-[var(--noir-muted)]">{postFile.name}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="album-post-caption"
                className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
              >
                キャプション
              </label>
              <textarea
                id="album-post-caption"
                value={postCaption}
                onChange={(event) => setPostCaption(event.target.value)}
                rows={3}
                placeholder="思い出やメモを書き残せます"
                className="w-full border border-[var(--noir-border)] bg-white px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="album-post-bookmark"
                className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
              >
                しおり
              </label>
              <select
                id="album-post-bookmark"
                value={resolvedPostBookmarkId}
                onChange={(event) => setPostBookmarkId(event.target.value)}
                className="w-full border border-[var(--noir-border)] bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">しおりを選択</option>
                {bookmarkOptions.map((bookmark) => (
                  <option key={bookmark.id} value={bookmark.id}>
                    {bookmark.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--noir-muted)]">
                1つの投稿は1つのしおりに紐づきます。
              </p>
            </div>

            {postError ? <p className="text-sm text-rose-600">{postError}</p> : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPostOpen(false)}
                className="border border-[var(--noir-border)] px-4 py-2 text-sm text-[var(--noir-muted)] transition hover:text-black"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={isPosting}
                className="flex items-center gap-2 border border-black bg-black px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black disabled:border-[var(--noir-border)] disabled:bg-[var(--noir-surface)] disabled:text-[var(--noir-muted)]"
              >
                {isPosting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                投稿する
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={photoModalOpen}
        onOpenChange={(open) => {
          setPhotoModalOpen(open);
          if (!open) setSelectedPhoto(null);
        }}
      >
        <DialogContent className="max-w-4xl rounded-none border border-[var(--noir-border)] bg-white p-0 font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader className="sr-only">
            <DialogTitle>アルバム投稿の詳細</DialogTitle>
            <DialogDescription>写真とキャプションを確認します。</DialogDescription>
          </DialogHeader>
          {selectedPhoto ? (
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 bg-black">
                <img
                  src={selectedPhoto.src}
                  alt={selectedPhoto.caption ?? selectedPhoto.bookmarkTitle}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="w-full border-t border-[var(--noir-border)] bg-white p-6 md:w-[320px] md:border-l md:border-t-0">
                <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                  {selectedPhoto.date}
                </p>
                <h3 className="mt-2 font-display text-xl text-[var(--noir-ink)]">
                  {selectedPhoto.bookmarkTitle}
                </h3>
                <p className="mt-2 text-sm font-ui text-[var(--noir-muted)]">
                  {selectedPhoto.area}
                </p>
                <div className="mt-4 border-t border-[var(--noir-border)] pt-4">
                  <p className="text-sm text-[var(--noir-ink)]">
                    {selectedPhoto.caption?.trim().length
                      ? selectedPhoto.caption
                      : "キャプションなし"}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPhotoModalOpen(false)}
                    className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={isDeletingPhoto}
                    className="border border-black bg-black px-4 py-2 text-[10px] font-ui uppercase tracking-[0.3em] text-white transition hover:bg-white hover:text-black disabled:border-[var(--noir-border)] disabled:bg-[var(--noir-surface)] disabled:text-[var(--noir-muted)]"
                  >
                    {isDeletingPhoto ? "削除中..." : "削除"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
