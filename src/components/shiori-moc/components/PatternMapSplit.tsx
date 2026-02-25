import React, { useMemo, useState } from "react";
import { ItineraryItem, ShioriData } from "../types";
import InteractiveGoogleMap, {
  type MapMarker,
} from "@/components/maps/interactive-google-map";
import ItemActionMenu from "./ItemActionMenu";

const PatternMapSplit: React.FC<{
  data: ShioriData;
  mapImageUrl?: string | null;
  mapEmbedUrl?: string | null;
  onItemClick?: (item: ItineraryItem) => void;
  onOpenSearch?: () => void;
  onMapPlaceClick?: (placeId: string) => void;
  onTimeChange?: (itemId: string, nextTime: string) => void;
  onMoveItem?: (itemId: string, direction: "up" | "down") => void;
  onReorderItems?: (orderedItemIds: string[]) => void;
  isReordering?: boolean;
  onReplaceItem?: (item: ItineraryItem) => void;
  mapApiKey?: string | null;
  mapCenter?: { lat: number; lng: number };
  mapMarkers?: MapMarker[];
  bookmarkId?: string;
}> = ({
  data,
  mapImageUrl,
  mapEmbedUrl,
  onItemClick,
  onOpenSearch,
  onMapPlaceClick,
  onTimeChange,
  onMoveItem,
  onReorderItems,
  isReordering = false,
  onReplaceItem,
  mapApiKey,
  mapCenter,
  mapMarkers,
  bookmarkId,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [mapTypeId, setMapTypeId] = useState<"roadmap" | "hybrid">(
    "roadmap"
  );
  const hasEmbed = Boolean(mapEmbedUrl);
  const hasInteractiveMap = Boolean(mapApiKey && mapCenter);
  const mapStyle = !hasEmbed && mapImageUrl
    ? { backgroundImage: `url(${mapImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  const markerLookup = useMemo(() => {
    const lookup = new Map<string, ItineraryItem>();
    data.items.forEach((item) => {
      if (item.placeId) {
        lookup.set(item.placeId, item);
      }
    });
    return lookup;
  }, [data.items]);

  const combinedMarkers = useMemo(() => mapMarkers ?? [], [mapMarkers]);

  const handleMarkerClick = (marker: MapMarker) => {
    if (!marker.placeId) return;
    const match = markerLookup.get(marker.placeId);
    if (match) {
      onItemClick?.(match);
      return;
    }
    window.location.href = `/restaurant/${marker.placeId}`;
  };

  const getItemKey = (item: ItineraryItem) => item.bookmarkItemId ?? item.id;

  const parseTimeToMinutes = (value: string) => {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const currentOrder = data.items.map(getItemKey);
    const fromIndex = currentOrder.indexOf(draggingId);
    const toIndex = currentOrder.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const nextOrder = [...currentOrder];
    const [moved] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, moved);
    onReorderItems?.(nextOrder);
    if (onTimeChange) {
      const rangeStart = Math.min(fromIndex, toIndex);
      const rangeEnd = Math.max(fromIndex, toIndex);
      const rangeIds = currentOrder.slice(rangeStart, rangeEnd + 1);
      const timeSlots = rangeIds.map((id) => {
        const item = data.items.find((entry) => getItemKey(entry) === id);
        return item?.time ?? "";
      });
      const minutes = timeSlots.map(parseTimeToMinutes);
      const hasInvalid = minutes.some((value) => value === null);
      const isOrdered = minutes.every((value, index) => {
        if (value === null) return false;
        if (index === 0) return true;
        const previous = minutes[index - 1];
        return previous !== null && value >= previous;
      });

      if (hasInvalid || !isOrdered) {
        window.alert(
          "時間の形式が不正です。時間を整えてから並び替えてください。"
        );
      } else {
        const nextRangeIds = nextOrder.slice(rangeStart, rangeEnd + 1);
        nextRangeIds.forEach((id, index) => {
          onTimeChange(id, timeSlots[index]);
        });
      }
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className="min-h-0">
        <div className="grid h-[calc(100dvh-var(--shiori-top-offset,0px))] min-h-0 grid-cols-1 md:grid-cols-[1.4fr_1fr]">
        {/* マップ側（固定） */}
        <div
          className="relative h-full min-h-0 overflow-hidden bg-slate-100"
          style={mapStyle}
        >
            {hasInteractiveMap ? (
                <InteractiveGoogleMap
                    apiKey={mapApiKey}
                    center={mapCenter!}
                    markers={combinedMarkers}
                    mapTypeId={mapTypeId}
                    className="h-full w-full rounded-none border-0"
                    onMarkerClick={handleMarkerClick}
                    onPlaceClick={onMapPlaceClick}
                    allowPlaceInfoWindow={false}
                />
            ) : hasEmbed ? (
                <iframe
                    title="Google Maps"
                    src={mapEmbedUrl ?? undefined}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                />
            ) : (
                <>
                    {/* ダミーのマップ背景 */}
                    <div className="absolute inset-0 opacity-20" 
                         style={{backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', backgroundSize: '24px 24px'}}>
                    </div>
                    
                    {/* ピン */}
                    {data.items.map((item, idx) => {
                        const top = 30 + (idx * 10) % 50;
                        const left = 30 + (idx * 15) % 50;
                        const isHovered = hoveredId === item.id;
                        
                        return (
                            <div key={item.id} 
                                 className={`absolute transition-all duration-300 cursor-pointer flex flex-col items-center ${isHovered ? 'z-50 scale-110' : 'z-10'}`}
                                 style={{top: `${top}%`, left: `${left}%`}}>
                                <div className={`px-3 py-1 rounded shadow-md mb-2 text-xs font-bold whitespace-nowrap transition-all ${isHovered ? 'bg-orange-600 text-white translate-y-0' : 'bg-white text-slate-700 translate-y-2 opacity-0'}`}>
                                    {item.title}
                                </div>
                                <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg font-bold text-xs ${isHovered ? 'bg-orange-600 text-white' : 'bg-slate-800 text-white'}`}>
                                    {idx + 1}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            {hasInteractiveMap ? (
              <div className="pointer-events-none absolute right-4 top-4 z-30">
                <div className="pointer-events-auto inline-flex overflow-hidden rounded-lg border border-[var(--noir-border)] bg-white/95 text-[11px] font-ui uppercase tracking-[0.28em] text-[var(--noir-muted)] shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setMapTypeId("roadmap")}
                    className={
                      mapTypeId === "roadmap"
                        ? "border-r border-[var(--noir-border)] bg-black px-4 py-2 text-white"
                        : "border-r border-[var(--noir-border)] px-4 py-2 transition hover:text-black"
                    }
                  >
                    地図
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapTypeId("hybrid")}
                    className={
                      mapTypeId === "hybrid"
                        ? "bg-black px-4 py-2 text-white"
                        : "px-4 py-2 transition hover:text-black"
                    }
                  >
                    航空写真
                  </button>
                </div>
              </div>
            ) : null}
            {onOpenSearch ? (
              <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                <button
                  onClick={onOpenSearch}
                  className="pointer-events-auto w-full bg-white py-3 rounded-xl shadow-lg font-bold text-slate-800 border border-gray-200 hover:bg-gray-50"
                >
                  店を検索
                </button>
              </div>
            ) : null}
        </div>

        {/* リスト側（スクロール） */}
        <div className="min-h-0 bg-white flex flex-col overflow-hidden border-l border-gray-200 shadow-2xl z-20">
             <div className="p-6 border-b border-gray-100 bg-white z-10">
                 <div className="h-40 rounded-xl overflow-hidden relative mb-4">
                     <img src={data.coverImage} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                         <h1 className="text-2xl font-bold text-white text-center px-4">{data.title}</h1>
                     </div>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                     <span>{data.items.length} スポット</span>
                     {onOpenSearch ? (
                       <button
                         onClick={onOpenSearch}
                         className="text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-md transition-colors"
                       >
                         + 追加
                       </button>
                     ) : null}
                 </div>
             </div>

             <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                 {data.items.map((item, idx) => {
                     const itemKey = getItemKey(item);
                     const isDragging = draggingId === itemKey;
                     const isDragOver = dragOverId === itemKey;
                     return (
                     <div
                        key={item.id}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        draggable={Boolean(onReorderItems)}
                        onDragStart={(event) => {
                          if (!onReorderItems) return;
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", itemKey);
                          setDraggingId(itemKey);
                        }}
                        onDragOver={(event) => {
                          if (!onReorderItems || !draggingId) return;
                          event.preventDefault();
                          setDragOverId(itemKey);
                        }}
                        onDrop={(event) => {
                          if (!onReorderItems) return;
                          event.preventDefault();
                          handleDrop(itemKey);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverId(null);
                        }}
                        className={`relative flex gap-4 p-4 rounded-xl border transition-all ${
                          isDragOver ? 'border-orange-400 bg-orange-50' : hoveredId === item.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                        } ${isDragging ? 'opacity-60' : ''}`}
                     >
                         <div className="flex items-start gap-3">
                           <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-[11px] font-bold text-orange-600">
                             {idx + 1}
                           </div>
                           <div className="h-14 w-14 bg-gray-100 rounded-lg overflow-hidden">
                             <img src={item.imageUrl} className="h-full w-full object-cover" />
                           </div>
                         </div>
                         <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between gap-2">
                               <h3 className="font-bold text-slate-800 text-sm truncate">{item.title}</h3>
                               <div className="flex items-center gap-2">
                                 {onTimeChange ? (
                                   <input
                                     type="time"
                                     value={item.time}
                                     onClick={(event) => event.stopPropagation()}
                                     onChange={(event) => {
                                       event.stopPropagation();
                                       onTimeChange(
                                         item.bookmarkItemId ?? item.id,
                                         event.target.value
                                       );
                                     }}
                                     className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
                                   />
                                 ) : (
                                   <span className="text-[11px] text-gray-400">{item.time}</span>
                                 )}
                                  {bookmarkId ? (
                                  <ItemActionMenu
                                    item={item}
                                    bookmarkId={bookmarkId}
                                    index={idx}
                                    total={data.items.length}
                                    onMove={onMoveItem}
                                    isBusy={isReordering}
                                    onReplace={onReplaceItem}
                                  />
                                ) : null}
                               </div>
                         </div>
                             <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                             <div className="flex items-center gap-2 mt-3">
                                 <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                   {item.categoryLabel ?? item.category}
                                 </span>
                                 {item.placeId ? (
                                   <button
                                     type="button"
                                     onClick={() => onItemClick?.(item)}
                                     className="rounded border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500 transition hover:border-orange-300 hover:text-orange-600"
                                   >
                                     詳細
                                   </button>
                                 ) : null}
                             </div>
                         </div>
                         
                     </div>
                 )})}
             </div>
        </div>
        </div>
    </div>
  );
};

export default PatternMapSplit;
