import AlbumScreen, {
  type AlbumBookmarkOption,
  type AlbumCollection,
  type AlbumPhoto,
} from "@/components/album-screen";
import { fromAlbumTable, resolveAlbumTable } from "@/lib/album/albumTable";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const FALLBACK_IMAGE = "/no_image.png";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type BookmarkRow = {
  id: string;
  title: string;
  area: string | null;
  travel_date: string | null;
  created_at: string;
  cover_image_path: string | null;
};

type AlbumPostRow = {
  id: string;
  bookmark_id: string;
  caption: string | null;
  image_path: string;
  created_at: string;
  bookmarks?: BookmarkRow | null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "--.--.--";
  }
  const iso = value.split("T")[0];
  return iso.replace(/-/g, ".");
};

const formatTag = (value: string) =>
  `#${value.replaceAll("_", "").replaceAll(" ", "").toLowerCase()}`;

const buildSignedUrl = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null
) => {
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage
      .from("album-photos")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error) {
      if (!String(error.message ?? "").includes("Object not found")) {
        console.error("Failed to create signed URL.", error);
      }
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (error) {
    if (!String((error as Error | null)?.message ?? "").includes("Object not found")) {
      console.error("Failed to create signed URL.", error);
    }
    return null;
  }
};

export default async function AlbumPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const albumTable = await resolveAlbumTable(supabase);

  const { data: bookmarkRows } = await supabase
    .from("bookmarks")
    .select("id, title, area, travel_date, created_at, cover_image_path")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: albumPostRows } = await fromAlbumTable(supabase, albumTable)
    .select(
      "id, bookmark_id, caption, image_path, created_at, bookmarks!inner ( id, title, area, travel_date, created_at, cover_image_path, user_id )"
    )
    .eq("bookmarks.user_id", user.id)
    .order("created_at", { ascending: false });

  const bookmarks = (bookmarkRows ?? []) as BookmarkRow[];
  const albumPosts = (albumPostRows ?? []) as AlbumPostRow[];

  const albumPhotoUrls = await Promise.all(
    albumPosts.map((post) => buildSignedUrl(supabase, post.image_path))
  );

  const allPhotos: AlbumPhoto[] = albumPosts
    .map((post, index) => {
      const signedUrl = albumPhotoUrls[index];
      if (!signedUrl) return null;
      const bookmark = post.bookmarks ?? null;
      return {
        id: post.id,
        src: signedUrl,
        date: formatDate(post.created_at),
        area: bookmark?.area ?? "\u672a\u8a2d\u5b9a",
        caption: post.caption ?? null,
        bookmarkId: post.bookmark_id,
        bookmarkTitle: bookmark?.title ?? "\u3057\u304a\u308a",
      };
    })
    .filter(Boolean) as AlbumPhoto[];

  const postsByBookmark = allPhotos.reduce<Record<string, AlbumPhoto[]>>(
    (acc, photo) => {
      const list = acc[photo.bookmarkId] ?? [];
      list.push(photo);
      acc[photo.bookmarkId] = list;
      return acc;
    },
    {}
  );

  const coverUrls = await Promise.all(
    bookmarks.map((bookmark) => buildSignedUrl(supabase, bookmark.cover_image_path))
  );

  const coverByBookmarkId = bookmarks.reduce<Record<string, string | null>>(
    (acc, bookmark, index) => {
      acc[bookmark.id] = coverUrls[index] ?? null;
      return acc;
    },
    {}
  );

  const collections: AlbumCollection[] = bookmarks.map((bookmark) => {
  const albumPosts = postsByBookmark[bookmark.id] ?? [];
  const cover =
    coverByBookmarkId[bookmark.id] ??
    albumPosts[0]?.src ??
    FALLBACK_IMAGE;
  const tags =
    bookmark.area && bookmark.area.trim().length > 0
      ? [formatTag(bookmark.area)]
      : ["#未設定"];
  return {
    id: bookmark.id,
    albumId: bookmark.id,
    bookmarkId: bookmark.id,
    title: bookmark.title,
    date: formatDate(bookmark.travel_date ?? bookmark.created_at),
    cover,
    photoCount: albumPosts.length,
    area: bookmark.area ?? "未設定",
    tags,
  };
});

  const bookmarkOptions: AlbumBookmarkOption[] = bookmarks.map((bookmark) => ({
    id: bookmark.id,
    title: bookmark.title,
    area: bookmark.area ?? null,
    date: bookmark.travel_date ?? null,
  }));

  return (
    <AlbumScreen
      collections={collections}
      allPhotos={allPhotos}
      bookmarkOptions={bookmarkOptions}
    />
  );
}
