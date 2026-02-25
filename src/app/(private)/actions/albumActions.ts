"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { fromAlbumTable, resolveAlbumTable } from "@/lib/album/albumTable";
import type { Database } from "../../../../database.types";

const requireUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");
  return { supabase, user };
};

const normalizeImageExtension = (mime: string, fallbackName?: string) => {
  const m = (mime || "").toLowerCase();
  if (m.includes("jpeg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("heic")) return "heic";
  if (m.includes("heif")) return "heif";

  if (fallbackName) {
    const ext = fallbackName.split(".").pop()?.toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  return "jpg";
};

type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const isSupabaseErrorLike = (err: unknown): err is SupabaseErrorLike =>
  Boolean(err) && typeof err === "object";

const formatSupabaseError = (prefix: string, err: unknown) => {
  const safe = isSupabaseErrorLike(err) ? err : {};
  const message = safe.message ?? "Unknown error";
  const details = safe.details ? ` / details: ${safe.details}` : "";
  const hint = safe.hint ? ` / hint: ${safe.hint}` : "";
  const code = safe.code ? ` / code: ${safe.code}` : "";
  return `${prefix}: ${message}${details}${hint}${code}`;
};

export async function createAlbumPostAction(formData: FormData) {
  const caption = String(formData.get("caption") ?? "").trim();
  const bookmarkId = String(formData.get("bookmarkId") ?? "").trim();
  const file = formData.get("photo");

  if (!bookmarkId) throw new Error("しおり（bookmarkId）が未指定です。");
  if (!(file instanceof File) || file.size === 0)
    throw new Error("写真（photo）が未指定です。");
  if (!file.type?.startsWith("image/"))
    throw new Error(`登録可能な画像ではありません。type=${file.type ?? "unknown"}ですか？`);

  const { supabase, user } = await requireUser();
  const albumTable = await resolveAlbumTable(supabase);

  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id, title")
    .eq("id", bookmarkId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    console.error("Bookmark not found for album post.", bookmarkError);
    throw new Error("しおりが存在しないか、権限がありません。");
  }

  const postUuid = randomUUID();
  const extension = normalizeImageExtension(file.type, file.name);
  const filePath = `${user.id}/album_posts/${bookmarkId}/${postUuid}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("album-photos")
    .upload(filePath, bytes, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Failed to upload album photo.", uploadError);
    throw new Error(formatSupabaseError("写真のアップロードに失敗しました", uploadError));
  }

  type AlbumPostsInsert = Database["public"]["Tables"]["album_posts"]["Insert"];
  type AlbumPhotosInsert = Database["public"]["Tables"]["album_photos"]["Insert"];

  const insertPayloadBase: AlbumPhotosInsert = {
    bookmark_id: bookmarkId,
    image_path: filePath,
    caption: caption || null,
  };
  const withUserPayload: AlbumPostsInsert = { user_id: user.id, ...insertPayloadBase };

  let insertError = (
    await fromAlbumTable(supabase, albumTable).insert(withUserPayload)
  ).error;

  if (insertError?.code === "PGRST204") {
    insertError = (
      await fromAlbumTable(supabase, albumTable).insert(insertPayloadBase)
    ).error;
  }

  if (insertError) {
    console.error("Failed to insert album post.", insertError);
    await supabase.storage.from("album-photos").remove([filePath]);
    throw new Error(formatSupabaseError("写真の投稿に失敗しました", insertError));
  }

  revalidatePath("/album");

  return { ok: true };
}

export async function deleteAlbumPostAction(postId: string) {
  const { supabase, user } = await requireUser();
  const albumTable = await resolveAlbumTable(supabase);

  if (albumTable === "album_photos") {
    const { data: post, error: postError } = await supabase
      .from("album_photos")
      .select("id, image_path")
      .eq("id", postId)
      .maybeSingle();

    if (postError || !post) {
      console.error("Album post not found.", postError);
      throw new Error("投稿が見つかりません。");
    }

    const { error: deleteError } = await supabase
      .from("album_photos")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Failed to delete album post.", deleteError);
      throw new Error("投稿の削除に失敗しました。");
    }

    if (post.image_path) {
      await supabase.storage.from("album-photos").remove([post.image_path]);
    }

    revalidatePath("/album");
    return;
  }

  const { data: post, error: postError } = await supabase
    .from("album_posts")
    .select("id, user_id, image_path")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    console.error("Album post not found.", postError);
    throw new Error("投稿が見つかりません。");
  }

  if (post.user_id !== user.id) {
    throw new Error("権限がありません。");
  }

  const { error: deleteError } = await supabase
    .from("album_posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    console.error("Failed to delete album post.", deleteError);
    throw new Error("投稿の削除に失敗しました。");
  }

  if (post.image_path) {
    await supabase.storage.from("album-photos").remove([post.image_path]);
  }

  revalidatePath("/album");
}
