"use server";

import { getPlaceDetails } from "@/lib/restaurants/api";
import type { RestaurantSuggestion } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type AddBookmarkItemStatus = "added" | "existing";

type ShioriExportPayload = {
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

const requireUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
};

const resolvePlaceRowId = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  placeId: string
) => {
  const { data: placeRow, error } = await supabase
    .from("places")
    .select("*")
    .eq("google_place_id", placeId)
    .maybeSingle();

  if (error || !placeRow) {
    if (error) {
      console.error("Failed to resolve place row id.", error);
    }
    return placeId;
  }

  const row = placeRow as Record<string, unknown>;
  const idValue = row.id;
  if (typeof idValue === "string" && idValue.length > 0) {
    return idValue;
  }
  if (typeof idValue === "number" && Number.isFinite(idValue)) {
    return String(idValue);
  }

  return placeId;
};

const addBookmarkItemToBookmark = async ({
  supabase,
  userId,
  bookmarkId,
  suggestion,
  sessionToken,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  bookmarkId: string;
  suggestion: RestaurantSuggestion;
  sessionToken?: string;
}): Promise<{ status: AddBookmarkItemStatus }> => {
  const placeId = suggestion.placeId?.trim();
  if (!placeId) {
    throw new Error("Place is required.");
  }
  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", bookmarkId)
    .eq("user_id", userId)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    console.error("Bookmark not found.", bookmarkError);
    throw new Error("Bookmark not found.");
  }

  const sessionTokenValue = sessionToken?.trim() ? sessionToken : undefined;
  const { data: placeDetails, error: placeError } = await getPlaceDetails(
    placeId,
    ["location", "displayName", "primaryType", "formattedAddress"],
    sessionTokenValue
  );

  const latitude = placeDetails?.location?.latitude;
  const longitude = placeDetails?.location?.longitude;

  if (placeError || latitude == null || longitude == null) {
    console.error("Failed to fetch place details.", placeError);
    throw new Error("Failed to fetch place details.");
  }

  const { error: upsertError } = await supabase.from("places").upsert(
    {
      google_place_id: placeId,
      latitude,
      longitude,
      primary_type: placeDetails?.primaryType ?? null,
      cached_name: placeDetails?.displayName ?? suggestion.placeName ?? null,
      cached_address_text: placeDetails?.formattedAddress ?? null,
    },
    { onConflict: "google_place_id" }
  );

  if (upsertError) {
    console.error("Failed to upsert place.", upsertError);
    throw new Error("Failed to save place.");
  }

  const placeRowId = await resolvePlaceRowId(supabase, placeId);

  const { data: existingItems, error: existingError } = await supabase
    .from("bookmark_items")
    .select("id")
    .eq("bookmark_id", bookmarkId)
    .eq("place_id", placeRowId)
    .limit(1);

  if (existingError) {
    console.error("Failed to check existing bookmark item.", existingError);
    throw new Error("Failed to update bookmark.");
  }

  if (existingItems && existingItems.length > 0) {
    return { status: "existing" };
  }

  const { data: lastItem, error: lastItemError } = await supabase
    .from("bookmark_items")
    .select("sort_order")
    .eq("bookmark_id", bookmarkId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastItemError) {
    console.error("Failed to get last bookmark item.", lastItemError);
    throw new Error("Failed to update bookmark.");
  }

  const nextSortOrder = (lastItem?.sort_order ?? 0) + 1;

  const { error: insertError } = await supabase.from("bookmark_items").insert({
    bookmark_id: bookmarkId,
    place_id: placeRowId,
    sort_order: nextSortOrder,
  });

  if (insertError) {
    console.error("Failed to add bookmark item.", insertError);
    throw new Error("Failed to add bookmark item.");
  }

  return { status: "added" };
};

export async function createBookmarkAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const travelDate = String(formData.get("travel_date") ?? "").trim();
  const coverFile = formData.get("cover");

  if (!title) {
    throw new Error("Title is required.");
  }

  const { supabase, user } = await requireUser();

  const { data: bookmark, error } = await supabase
    .from("bookmarks")
    .insert({
      title,
      area: area || null,
      travel_date: travelDate || null,
      user_id: user.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !bookmark?.id) {
    console.error("Failed to create bookmark.", error);
    throw new Error("Failed to create bookmark.");
  }

  const bookmarkId = String(bookmark.id);

  if (coverFile instanceof File && coverFile.size > 0) {
    if (!coverFile.type.startsWith("image/")) {
      throw new Error("Cover image must be an image file.");
    }
    const coverPath = `${user.id}/bookmark_covers/${bookmarkId}/cover.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("album-photos")
      .upload(coverPath, coverFile, {
        upsert: true,
        contentType: coverFile.type,
      });

    if (uploadError) {
      console.error("Failed to upload bookmark cover during creation.", uploadError);
      throw new Error("Failed to upload bookmark cover.");
    }

    const { error: coverUpdateError } = await supabase
      .from("bookmarks")
      .update({ cover_image_path: coverPath })
      .eq("id", bookmarkId)
      .eq("user_id", user.id);

    if (coverUpdateError) {
      console.error("Failed to update bookmark cover during creation.", coverUpdateError);
      throw new Error("Failed to update bookmark cover.");
    }
  }

  revalidatePath("/bookmarks");
  revalidatePath("/");
  revalidatePath(`/bookmarks/${bookmarkId}`);
}

export async function deleteBookmarkAction(bookmarkId: string) {
  const { supabase, user } = await requireUser();

  const { error: itemsError } = await supabase
    .from("bookmark_items")
    .delete()
    .eq("bookmark_id", bookmarkId);

  if (itemsError) {
    console.error("Failed to delete bookmark items.", itemsError);
    throw new Error("Failed to delete bookmark items.");
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete bookmark.", error);
    throw new Error("Failed to delete bookmark.");
  }

  revalidatePath("/bookmarks");
  revalidatePath("/");
}

export async function addBookmarkItemAction(
  bookmarkId: string,
  suggestion: RestaurantSuggestion,
  sessionToken?: string
): Promise<{ status: AddBookmarkItemStatus }> {
  if (!suggestion.placeId) {
    throw new Error("Please select a place suggestion.");
  }

  const { supabase, user } = await requireUser();

  const result = await addBookmarkItemToBookmark({
    supabase,
    userId: user.id,
    bookmarkId,
    suggestion,
    sessionToken,
  });

  revalidatePath(`/bookmarks/${bookmarkId}`);
  return result;
}

export async function createBookmarkAndAddItemAction(input: {
  title: string;
  area?: string | null;
  travelDate?: string | null;
  placeId: string;
  placeName: string;
  sessionToken?: string;
}): Promise<{
  bookmark: {
    id: string;
    title: string;
    area: string | null;
    travel_date: string | null;
    created_at: string;
  };
  status: AddBookmarkItemStatus;
}> {
  const title = input.title.trim();
  const area = input.area?.trim() ?? "";
  const travelDate = input.travelDate?.trim() ?? "";

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!input.placeId) {
    throw new Error("Place is required.");
  }

  const { supabase, user } = await requireUser();
  const { data: newBookmark, error } = await supabase
    .from("bookmarks")
    .insert({
      title,
      area: area || null,
      travel_date: travelDate || null,
      user_id: user.id,
    })
    .select("id, title, area, travel_date, created_at")
    .maybeSingle();

  if (error || !newBookmark) {
    console.error("Failed to create bookmark.", error);
    throw new Error("Failed to create bookmark.");
  }

  const result = await addBookmarkItemToBookmark({
    supabase,
    userId: user.id,
    bookmarkId: String(newBookmark.id),
    suggestion: {
      type: "placePrediction",
      placeId: input.placeId,
      placeName: input.placeName,
    },
    sessionToken: input.sessionToken,
  });

  revalidatePath("/bookmarks");
  revalidatePath("/");
  revalidatePath(`/bookmarks/${newBookmark.id}`);

  return {
    bookmark: {
      id: String(newBookmark.id),
      title: newBookmark.title,
      area: newBookmark.area,
      travel_date: newBookmark.travel_date,
      created_at: newBookmark.created_at,
    },
    status: result.status,
  };
}

export async function importBookmarkFromJsonAction(
  payload: ShioriExportPayload
): Promise<{ bookmarkId: string; title: string }> {
  if (!payload || payload.version !== 1) {
    throw new Error("Invalid export payload.");
  }

  const title = payload.bookmark?.title?.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const cappedItems = rawItems.slice(0, 50);
  const seenPlaceIds = new Set<string>();
  const normalizedItems = cappedItems
    .map((item) => {
      const placeId = item?.place?.googlePlaceId?.trim();
      if (!placeId) {
        return null;
      }
      if (seenPlaceIds.has(placeId)) {
        return null;
      }
      seenPlaceIds.add(placeId);
      return {
        sortOrder: item.sortOrder,
        place: {
          googlePlaceId: placeId,
          name: item.place?.name ?? null,
          primaryType: item.place?.primaryType ?? null,
          address: item.place?.address ?? null,
          lat:
            typeof item.place?.lat === "number" && Number.isFinite(item.place.lat)
              ? item.place.lat
              : null,
          lng:
            typeof item.place?.lng === "number" && Number.isFinite(item.place.lng)
              ? item.place.lng
              : null,
        },
      };
    })
    .filter(Boolean) as ShioriExportPayload["items"];

  const { supabase, user } = await requireUser();

  const { data: existingTitles } = await supabase
    .from("bookmarks")
    .select("title")
    .eq("user_id", user.id);
  const existingTitleSet = new Set(
    (existingTitles ?? []).map((row) => row.title)
  );

  const baseTitle = title;
  let finalTitle = baseTitle;
  let suffix = 0;
  while (existingTitleSet.has(finalTitle)) {
    suffix += 1;
    finalTitle =
      suffix === 1 ? `${baseTitle} (import)` : `${baseTitle} (import ${suffix})`;
  }

  const { data: newBookmark, error: createError } = await supabase
    .from("bookmarks")
    .insert({
      title: finalTitle,
      area: payload.bookmark?.area ?? null,
      travel_date: payload.bookmark?.date ?? null,
      cover_image_path: payload.bookmark?.coverImagePath ?? null,
      user_id: user.id,
    })
    .select("id, title")
    .maybeSingle();

  if (createError || !newBookmark) {
    console.error("Failed to create bookmark during import.", createError);
    throw new Error("Failed to create bookmark.");
  }

  const bookmarkId = String(newBookmark.id);
  const insertRows: Array<{
    bookmark_id: string;
    place_id: string;
    sort_order: number;
  }> = [];
  let fallbackOrder = 1;

  for (const item of normalizedItems) {
    const placeId = item.place.googlePlaceId;
    if (!placeId) {
      continue;
    }

    const { data: existingPlace } = await supabase
      .from("places")
      .select("latitude, longitude")
      .eq("google_place_id", placeId)
      .maybeSingle();

    let lat = item.place.lat ?? existingPlace?.latitude ?? null;
    let lng = item.place.lng ?? existingPlace?.longitude ?? null;
    let name = item.place.name ?? null;
    let primaryType = item.place.primaryType ?? null;
    let address = item.place.address ?? null;

    if (lat == null || lng == null) {
      const detail = await getPlaceDetails(placeId, [
        "location",
        "displayName",
        "primaryType",
        "formattedAddress",
      ]);
      const latitude = detail?.data?.location?.latitude ?? null;
      const longitude = detail?.data?.location?.longitude ?? null;
      lat = lat ?? latitude;
      lng = lng ?? longitude;
      name = name ?? detail?.data?.displayName ?? null;
      primaryType = primaryType ?? detail?.data?.primaryType ?? null;
      address = address ?? detail?.data?.formattedAddress ?? null;
    }

    if (lat == null || lng == null) {
      continue;
    }

    const { error: upsertError } = await supabase.from("places").upsert(
      {
        google_place_id: placeId,
        latitude: lat,
        longitude: lng,
        primary_type: primaryType ?? null,
        cached_name: name ?? null,
        cached_address_text: address ?? null,
      },
      { onConflict: "google_place_id" }
    );

    if (upsertError) {
      console.error("Failed to upsert place during import.", upsertError);
      continue;
    }

    const placeRowId = await resolvePlaceRowId(supabase, placeId);

    const orderValue = Number.isFinite(item.sortOrder)
      ? Math.floor(item.sortOrder as number)
      : fallbackOrder;
    fallbackOrder += 1;

    insertRows.push({
      bookmark_id: bookmarkId,
      place_id: placeRowId,
      sort_order: orderValue,
    });
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase
      .from("bookmark_items")
      .insert(insertRows);
    if (insertError) {
      console.error("Failed to insert bookmark items during import.", insertError);
    }
  }

  revalidatePath("/bookmarks");
  revalidatePath(`/bookmarks/${bookmarkId}`);

  return { bookmarkId, title: newBookmark.title };
}

export async function deleteBookmarkItemAction(
  bookmarkItemId: string,
  bookmarkId: string
) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("bookmark_items")
    .delete()
    .eq("id", bookmarkItemId)
    .eq("bookmark_id", bookmarkId);

  if (error) {
    console.error("Failed to delete bookmark item.", error);
    throw new Error("Failed to delete bookmark item.");
  }

  revalidatePath(`/bookmarks/${bookmarkId}`);
}

export async function moveBookmarkItemAction(
  bookmarkItemId: string,
  direction: "up" | "down",
  bookmarkId: string
) {
  const { supabase } = await requireUser();

  const { data: currentItem, error: currentError } = await supabase
    .from("bookmark_items")
    .select("id, sort_order, visit_time")
    .eq("id", bookmarkItemId)
    .eq("bookmark_id", bookmarkId)
    .maybeSingle();

  if (currentError || !currentItem) {
    console.error("Bookmark item not found.", currentError);
    return;
  }

  const neighborQuery = supabase
    .from("bookmark_items")
    .select("id, sort_order, visit_time")
    .eq("bookmark_id", bookmarkId);

  const { data: neighborItem, error: neighborError } =
    direction === "up"
      ? await neighborQuery
          .lt("sort_order", currentItem.sort_order)
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await neighborQuery
          .gt("sort_order", currentItem.sort_order)
          .order("sort_order", { ascending: true })
          .limit(1)
          .maybeSingle();

  if (neighborError) {
    console.error("Failed to find neighbor item.", neighborError);
    return;
  }

  if (!neighborItem) {
    return;
  }

  const tempSortOrder = currentItem.sort_order + 1000000;

  // sort_order を入れ替える際の一時的なユニーク衝突を回避する。
  const { error: tempError } = await supabase
    .from("bookmark_items")
    .update({ sort_order: tempSortOrder })
    .eq("id", currentItem.id);

  if (tempError) {
    console.error("Failed to reorder bookmark items.", tempError);
    throw new Error("Failed to reorder bookmark items.");
  }

  const { error: swapNeighborError } = await supabase
    .from("bookmark_items")
    .update({ sort_order: currentItem.sort_order })
    .eq("id", neighborItem.id);

  if (swapNeighborError) {
    console.error("Failed to reorder bookmark items.", swapNeighborError);
    throw new Error("Failed to reorder bookmark items.");
  }

  const { error: swapCurrentError } = await supabase
    .from("bookmark_items")
    .update({ sort_order: neighborItem.sort_order })
    .eq("id", currentItem.id);

  if (swapCurrentError) {
    console.error("Failed to reorder bookmark items.", swapCurrentError);
    throw new Error("Failed to reorder bookmark items.");
  }

  const { error: swapCurrentTimeError } = await supabase
    .from("bookmark_items")
    .update({ visit_time: neighborItem.visit_time ?? null })
    .eq("id", currentItem.id);

  if (swapCurrentTimeError) {
    console.error("Failed to swap bookmark item time.", swapCurrentTimeError);
    throw new Error("Failed to reorder bookmark items.");
  }

  const { error: swapNeighborTimeError } = await supabase
    .from("bookmark_items")
    .update({ visit_time: currentItem.visit_time ?? null })
    .eq("id", neighborItem.id);

  if (swapNeighborTimeError) {
    console.error("Failed to swap bookmark item time.", swapNeighborTimeError);
    throw new Error("Failed to reorder bookmark items.");
  }

  revalidatePath(`/bookmarks/${bookmarkId}`);
}

export async function reorderBookmarkItemsAction(
  bookmarkId: string,
  orderedItemIds: string[]
) {
  const normalizedIds = Array.isArray(orderedItemIds)
    ? orderedItemIds.map((id) => id.trim()).filter(Boolean)
    : [];

  if (!bookmarkId || normalizedIds.length === 0) {
    throw new Error("Invalid reorder payload.");
  }

  const { supabase, user } = await requireUser();
  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", bookmarkId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    console.error("Bookmark not found for reorder.", bookmarkError);
    throw new Error("Bookmark not found.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("bookmark_items")
    .select("id")
    .eq("bookmark_id", bookmarkId);

  if (itemsError || !items) {
    console.error("Failed to load bookmark items for reorder.", itemsError);
    throw new Error("Failed to load bookmark items.");
  }

  const existingIds = new Set(items.map((item) => String(item.id)));
  const orderedIds = normalizedIds.filter((id) => existingIds.has(id));
  if (orderedIds.length === 0) {
    throw new Error("No matching items for reorder.");
  }

  const remainingIds = Array.from(existingIds).filter(
    (id) => !orderedIds.includes(id)
  );
  const finalOrder = [...orderedIds, ...remainingIds];

  const tempBase = 1000000;
  for (let index = 0; index < finalOrder.length; index += 1) {
    const { error } = await supabase
      .from("bookmark_items")
      .update({ sort_order: tempBase + index })
      .eq("id", finalOrder[index])
      .eq("bookmark_id", bookmarkId);
    if (error) {
      console.error("Failed to stage sort_order update.", error);
      throw new Error("Failed to update bookmark order.");
    }
  }

  for (let index = 0; index < finalOrder.length; index += 1) {
    const { error } = await supabase
      .from("bookmark_items")
      .update({ sort_order: index + 1 })
      .eq("id", finalOrder[index])
      .eq("bookmark_id", bookmarkId);
    if (error) {
      console.error("Failed to finalize sort_order update.", error);
      throw new Error("Failed to update bookmark order.");
    }
  }

  revalidatePath(`/bookmarks/${bookmarkId}`);
}

export async function setBookmarkCoverAction(
  bookmarkId: string,
  formData: FormData
) {
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please select a cover image.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Cover image must be an image file.");
  }

  const { supabase, user } = await requireUser();

  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", bookmarkId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    console.error("Bookmark not found.", bookmarkError);
    throw new Error("Bookmark not found.");
  }

  const coverPath = `${user.id}/bookmark_covers/${bookmarkId}/cover.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("album-photos")
    .upload(coverPath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Failed to upload bookmark cover.", uploadError);
    throw new Error("Failed to upload bookmark cover.");
  }

  const { error: updateError } = await supabase
    .from("bookmarks")
    .update({ cover_image_path: coverPath })
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Failed to update bookmark cover.", updateError);
    throw new Error("Failed to update bookmark cover.");
  }

  revalidatePath(`/bookmarks/${bookmarkId}`);
}

export async function replaceBookmarkItemPlaceAction(
  bookmarkItemId: string,
  placeId: string,
  sessionToken?: string
): Promise<{ status: "updated" | "existing" }> {
  const trimmedPlaceId = placeId.trim();
  if (!trimmedPlaceId) {
    throw new Error("Place is required.");
  }

  const { supabase, user } = await requireUser();

  const { data: item, error: itemError } = await supabase
    .from("bookmark_items")
    .select("id, bookmark_id")
    .eq("id", bookmarkItemId)
    .maybeSingle();

  if (itemError || !item) {
    console.error("Bookmark item not found.", itemError);
    throw new Error("Bookmark item not found.");
  }

  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", item.bookmark_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    console.error("Bookmark not found.", bookmarkError);
    throw new Error("Bookmark not found.");
  }

  const sessionTokenValue = sessionToken?.trim() ? sessionToken : undefined;
  const { data: placeDetails, error: placeError } = await getPlaceDetails(
    trimmedPlaceId,
    ["location", "displayName", "primaryType", "formattedAddress"],
    sessionTokenValue
  );

  const latitude = placeDetails?.location?.latitude;
  const longitude = placeDetails?.location?.longitude;

  if (placeError || latitude == null || longitude == null) {
    console.error("Failed to fetch place details.", placeError);
    throw new Error("Failed to fetch place details.");
  }

  const { error: upsertError } = await supabase.from("places").upsert(
    {
      google_place_id: trimmedPlaceId,
      latitude,
      longitude,
      primary_type: placeDetails?.primaryType ?? null,
      cached_name: placeDetails?.displayName ?? null,
      cached_address_text: placeDetails?.formattedAddress ?? null,
    },
    { onConflict: "google_place_id" }
  );

  if (upsertError) {
    console.error("Failed to upsert place.", upsertError);
    throw new Error("Failed to save place.");
  }

  const placeRowId = await resolvePlaceRowId(supabase, trimmedPlaceId);

  const { data: existingItems, error: existingError } = await supabase
    .from("bookmark_items")
    .select("id")
    .eq("bookmark_id", item.bookmark_id)
    .eq("place_id", placeRowId)
    .limit(1);

  if (existingError) {
    console.error("Failed to check existing bookmark item.", existingError);
    throw new Error("Failed to update bookmark.");
  }

  if (
    existingItems &&
    existingItems.length > 0 &&
    String(existingItems[0].id) !== String(item.id)
  ) {
    return { status: "existing" };
  }

  const { error: updateError } = await supabase
    .from("bookmark_items")
    .update({ place_id: placeRowId })
    .eq("id", item.id);

  if (updateError) {
    console.error("Failed to update bookmark item place.", updateError);
    throw new Error("Failed to update bookmark item.");
  }

  revalidatePath(`/bookmarks/${item.bookmark_id}`);

  return { status: "updated" };
}

export async function updateBookmarkTitleAction(
  bookmarkId: string,
  title: string
) {
  const nextTitle = title.trim();
  if (!nextTitle) {
    throw new Error("Title is required.");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("bookmarks")
    .update({ title: nextTitle })
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to update bookmark title.", error);
    throw new Error("Failed to update bookmark title.");
  }

  revalidatePath("/bookmarks");
  revalidatePath(`/bookmarks/${bookmarkId}`);
}

export async function updateBookmarkItemTimeAction(
  bookmarkItemId: string,
  nextTime: string | null
) {
  const trimmed = (nextTime ?? "").trim();
  if (trimmed && !/^\d{2}:\d{2}$/.test(trimmed)) {
    throw new Error("Invalid time.");
  }

  const { supabase, user } = await requireUser();
  const { data: item, error: itemError } = await supabase
    .from("bookmark_items")
    .select("id, bookmark_id")
    .eq("id", bookmarkItemId)
    .maybeSingle();

  if (itemError || !item) {
    console.error("Bookmark item not found.", itemError);
    throw new Error("Bookmark item not found.");
  }

  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", item.bookmark_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    console.error("Bookmark not found.", bookmarkError);
    throw new Error("Bookmark not found.");
  }

  const { error: updateError } = await supabase
    .from("bookmark_items")
    .update({ visit_time: trimmed || null })
    .eq("id", bookmarkItemId);

  if (updateError) {
    const message = String(
      (updateError as { message?: string } | null)?.message ?? ""
    );
    if (message.includes("visit_time") && message.includes("does not exist")) {
      return;
    }
    console.error("Failed to update bookmark item time.", updateError);
    return;
  }

  revalidatePath(`/bookmarks/${item.bookmark_id}`);
}

export async function createBookmarkFromRouteAction(input: {
  title: string;
  area?: string | null;
  travelDate?: string | null;
  places: Array<{
    placeId: string;
    name?: string | null;
    primaryType?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
  }>;
}): Promise<{ bookmarkId: string; title: string }> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }
  const places = Array.isArray(input.places) ? input.places : [];
  if (places.length === 0) {
    throw new Error("Places are required.");
  }

  const { supabase, user } = await requireUser();
  const { data: newBookmark, error: createError } = await supabase
    .from("bookmarks")
    .insert({
      title,
      area: input.area ?? null,
      travel_date: input.travelDate ?? null,
      user_id: user.id,
    })
    .select("id, title")
    .maybeSingle();

  if (createError || !newBookmark) {
    console.error("Failed to create bookmark for route.", createError);
    throw new Error("Failed to create bookmark.");
  }

  const bookmarkId = String(newBookmark.id);
  const seenPlaceIds = new Set<string>();
  let sortOrder = 1;

  for (const place of places) {
    const placeId = place.placeId?.trim();
    if (!placeId || seenPlaceIds.has(placeId)) {
      continue;
    }
    seenPlaceIds.add(placeId);

    let lat = place.lat ?? null;
    let lng = place.lng ?? null;
    let name = place.name ?? null;
    let primaryType = place.primaryType ?? null;
    let address = place.address ?? null;

    if (lat == null || lng == null) {
      const detail = await getPlaceDetails(placeId, [
        "location",
        "displayName",
        "primaryType",
        "formattedAddress",
      ]);
      const latitude = detail?.data?.location?.latitude ?? null;
      const longitude = detail?.data?.location?.longitude ?? null;
      lat = lat ?? latitude;
      lng = lng ?? longitude;
      name = name ?? detail?.data?.displayName ?? null;
      primaryType = primaryType ?? detail?.data?.primaryType ?? null;
      address = address ?? detail?.data?.formattedAddress ?? null;
    }

    if (lat == null || lng == null) {
      continue;
    }

    const { error: upsertError } = await supabase.from("places").upsert(
      {
        google_place_id: placeId,
        latitude: lat,
        longitude: lng,
        primary_type: primaryType ?? null,
        cached_name: name ?? null,
        cached_address_text: address ?? null,
      },
      { onConflict: "google_place_id" }
    );

    if (upsertError) {
      console.error("Failed to upsert place for route.", upsertError);
      continue;
    }

    const placeRowId = await resolvePlaceRowId(supabase, placeId);

    const { error: insertError } = await supabase.from("bookmark_items").insert({
      bookmark_id: bookmarkId,
      place_id: placeRowId,
      sort_order: sortOrder,
    });

    if (insertError) {
      console.error("Failed to insert bookmark item for route.", insertError);
      continue;
    }

    sortOrder += 1;
  }

  revalidatePath("/bookmarks");
  revalidatePath(`/bookmarks/${bookmarkId}`);

  return { bookmarkId, title: newBookmark.title };
}

export async function applyAiRouteToBookmarkAction(input: {
  bookmarkId: string;
  orderedPlaceIds: string[];
}) {
  const bookmarkId = input.bookmarkId;
  const orderedPlaceIds = Array.isArray(input.orderedPlaceIds)
    ? input.orderedPlaceIds.map((id) => id.trim()).filter(Boolean)
    : [];

  if (!bookmarkId || orderedPlaceIds.length === 0) {
    throw new Error("Invalid route update payload.");
  }

  const { supabase, user } = await requireUser();
  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("id", bookmarkId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (bookmarkError || !bookmark) {
    console.error("Bookmark not found for AI route update.", bookmarkError);
    throw new Error("Bookmark not found.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("bookmark_items")
    .select("id, sort_order, places ( google_place_id )")
    .eq("bookmark_id", bookmarkId)
    .order("sort_order", { ascending: true });

  if (itemsError || !items) {
    console.error("Failed to load bookmark items for AI update.", itemsError);
    throw new Error("Failed to load bookmark items.");
  }

  const orderedSet = new Set(orderedPlaceIds);
  const selectedMap = new Map<string, { id: string }>();
  const otherItems: Array<{ id: string }> = [];

  for (const item of items) {
    const place = item.places as { google_place_id?: string | null } | null;
    const placeId = place?.google_place_id ?? null;
    if (placeId && orderedSet.has(placeId)) {
      selectedMap.set(placeId, { id: String(item.id) });
    } else {
      otherItems.push({ id: String(item.id) });
    }
  }

  const orderedItems = orderedPlaceIds
    .map((placeId) => selectedMap.get(placeId))
    .filter(Boolean) as Array<{ id: string }>;

  if (orderedItems.length !== orderedPlaceIds.length) {
    throw new Error("Selected spots do not match current bookmark.");
  }

  const finalOrder = [...orderedItems, ...otherItems];

  const tempBase = 1000000;
  for (let index = 0; index < finalOrder.length; index += 1) {
    const item = finalOrder[index];
    const { error } = await supabase
      .from("bookmark_items")
      .update({ sort_order: tempBase + index })
      .eq("id", item.id)
      .eq("bookmark_id", bookmarkId);
    if (error) {
      console.error("Failed to stage sort_order update.", error);
      throw new Error("Failed to update bookmark order.");
    }
  }

  for (let index = 0; index < finalOrder.length; index += 1) {
    const item = finalOrder[index];
    const { error } = await supabase
      .from("bookmark_items")
      .update({ sort_order: index + 1 })
      .eq("id", item.id)
      .eq("bookmark_id", bookmarkId);
    if (error) {
      console.error("Failed to finalize sort_order update.", error);
      throw new Error("Failed to update bookmark order.");
    }
  }

  revalidatePath(`/bookmarks/${bookmarkId}`);
}
