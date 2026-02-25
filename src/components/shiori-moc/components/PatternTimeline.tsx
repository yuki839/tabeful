import React from "react";
import { ItineraryItem, ShioriData } from "../types";
import { Navigation } from "lucide-react";
import ItemActionMenu from "./ItemActionMenu";

const PatternTimeline: React.FC<{
  data: ShioriData;
  onItemClick?: (item: ItineraryItem) => void;
  onOpenNavigation?: () => void;
  onTimeChange?: (itemId: string, nextTime: string) => void;
  onMoveItem?: (itemId: string, direction: "up" | "down") => void;
  isReordering?: boolean;
  onReplaceItem?: (item: ItineraryItem) => void;
  bookmarkId?: string;
}> = ({
  data,
  onItemClick,
  onOpenNavigation,
  onTimeChange,
  onMoveItem,
  isReordering = false,
  onReplaceItem,
  bookmarkId,
}) => {
  return (
    <div className="h-full overflow-y-auto bg-slate-50">
        
        {/* 固定ヘッダー */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                    <img src={data.coverImage} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-slate-900">{data.title}</h1>
                    <p className="text-xs text-slate-500">{data.date}</p>
                </div>
            </div>
            <div />
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
            <div className="relative pl-8 md:pl-0">
                {/* 中央ライン */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2 md:translate-x-0" />

                {data.items.map((item, idx) => (
                    <div key={item.id} className={`relative flex flex-col md:flex-row items-center mb-12 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                        
                        {/* 中央ノード */}
                        <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-orange-500 shadow-sm z-10 top-6" />

                        {/* スペーサー */}
                        <div className="hidden md:block w-1/2" />

                        {/* カード内容 */}
                        <div className={`w-full md:w-1/2 pl-8 md:pl-0 ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                            <div
                                onClick={() => onItemClick?.(item)}
                                className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                                {bookmarkId ? (
                                  <ItemActionMenu
                                    item={item}
                                    bookmarkId={bookmarkId}
                                    index={idx}
                                    total={data.items.length}
                                    className="absolute right-3 top-3"
                                    onMove={onMoveItem}
                                    isBusy={isReordering}
                                    onReplace={onReplaceItem}
                                  />
                                ) : null}
                                {/* 時間バッジ */}
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
                                    className="absolute -top-3 left-4 rounded-full border border-slate-700 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 shadow-sm"
                                  />
                                ) : (
                                  <div className="absolute -top-3 left-4 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                    {item.time}
                                  </div>
                                )}

                                <div className="mt-2 flex gap-4">
                                     <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                                     </div>
                                     <div className="flex-1">
                                         <div className="text-xs font-bold text-orange-500 uppercase">
                                           {item.categoryLabel ?? item.category}
                                         </div>
                                         <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                                         <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                                     </div>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

             <div className="text-center mt-12">
                <button onClick={onOpenNavigation} className="bg-slate-900 text-white rounded-full px-6 py-3 font-bold text-sm shadow-xl inline-flex items-center gap-2 hover:-translate-y-1 transition-transform">
                    <Navigation size={16} />
                    ナビを開始
                </button>
             </div>
        </div>
    </div>
  );
};

export default PatternTimeline;
