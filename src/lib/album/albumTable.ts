import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";

export type AlbumTableName = "album_posts" | "album_photos";

const TABLE_CANDIDATES: AlbumTableName[] = ["album_posts", "album_photos"];
let cachedTable: AlbumTableName | null = null;

export const resolveAlbumTable = async (
  supabase: SupabaseClient<Database>
): Promise<AlbumTableName> => {
  if (cachedTable) {
    return cachedTable;
  }

  const envValue = process.env.ALBUM_POSTS_TABLE?.trim();
  if (envValue === "album_posts" || envValue === "album_photos") {
    cachedTable = envValue;
    return cachedTable;
  }

  for (const table of TABLE_CANDIDATES) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (!error) {
      cachedTable = table;
      return cachedTable;
    }
    if (error?.code && error.code !== "PGRST205") {
      cachedTable = table;
      return cachedTable;
    }
  }

  cachedTable = "album_posts";
  return cachedTable;
};

export const fromAlbumTable = (
  supabase: SupabaseClient<Database>,
  table: AlbumTableName
) => supabase.from(table);
