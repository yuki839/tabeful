"use client";

import PatternMagazine from "@/components/shiori-moc/components/PatternMagazine";
import type { ShioriData } from "@/components/shiori-moc/types";

interface PublicBookmarkClientProps {
  data: ShioriData;
  mapLinkUrl: string;
}

export default function PublicBookmarkClient({
  data,
  mapLinkUrl,
}: PublicBookmarkClientProps) {
  const handleOpenNavigation = () => {
    if (!mapLinkUrl) return;
    window.open(mapLinkUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <PatternMagazine data={data} onOpenNavigation={handleOpenNavigation} />
  );
}
