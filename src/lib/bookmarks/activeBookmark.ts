export const ACTIVE_BOOKMARK_STORAGE_KEY = "tabeful-active-bookmark-id";

export type ActiveBookmarkStorage = {
  userId: string;
  bookmarkId: string;
};

export const parseActiveBookmarkValue = (
  value: string | null
): ActiveBookmarkStorage | null => {
  if (!value) return null;

  if (value.includes("::")) {
    const [userId, bookmarkId] = value.split("::");
    if (userId && bookmarkId) {
      return { userId, bookmarkId };
    }
  }

  try {
    const parsed = JSON.parse(value) as Partial<ActiveBookmarkStorage> & {
      user_id?: string;
      bookmark_id?: string;
      id?: string;
    };

    const userId = parsed.userId ?? parsed.user_id;
    const bookmarkId = parsed.bookmarkId ?? parsed.bookmark_id ?? parsed.id;

    if (typeof userId === "string" && typeof bookmarkId === "string") {
      return { userId, bookmarkId };
    }
  } catch {
    return null;
  }

  return null;
};

export const readActiveBookmark = (userId: string) => {
  if (typeof window === "undefined") return null;
  const parsed = parseActiveBookmarkValue(
    window.localStorage.getItem(ACTIVE_BOOKMARK_STORAGE_KEY)
  );
  if (!parsed || parsed.userId !== userId) {
    return null;
  }
  return parsed;
};

export const writeActiveBookmark = (userId: string, bookmarkId: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACTIVE_BOOKMARK_STORAGE_KEY,
    JSON.stringify({ userId, bookmarkId })
  );
  window.dispatchEvent(new Event("tabeful:active-bookmark-change"));
};
