import React from "react";
import { ItineraryItem, ShioriData } from "../types";
import { MapPin, GripVertical } from "lucide-react";
import ItemActionMenu from "./ItemActionMenu";

const PatternModern: React.FC<{
  data: ShioriData;
  onItemClick?: (item: ItineraryItem) => void;
  onOpenNavigation?: () => void;
  onSetCover?: () => void;
  onTimeChange?: (itemId: string, nextTime: string) => void;
  onMoveItem?: (itemId: string, direction: "up" | "down") => void;
  isReordering?: boolean;
  onReplaceItem?: (item: ItineraryItem) => void;
  bookmarkId?: string;
}> = ({
  data,
  onItemClick,
  onOpenNavigation,
  onSetCover,
  onTimeChange,
  onMoveItem,
  isReordering = false,
  onReplaceItem,
  bookmarkId,
}) => {
  return (
    <div className="h-full overflow-y-auto bg-white">
        {/* カバーヒーロー */}
        <div className="relative h-[50vh] min-h-[400px]">
            <img src={data.coverImage} className="w-full h-full object-cover" alt="カバー" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <div className="absolute top-6 right-6 flex gap-3">
                <button
                    onClick={onSetCover}
                    className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-white/30 transition-colors"
                >
                    カバーを変更
                </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 text-white/80 mb-3 text-sm font-medium">
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md">{data.date}</span>
                        <span>•</span>
                        <span>{data.items.length} スポット</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-2">{data.title}</h1>
                </div>
            </div>
        </div>

        {/* コンテンツエリア */}
        <div className="max-w-4xl mx-auto px-6 py-12">
            
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-800">旅程</h2>
            </div>

            <div className="space-y-6">
                {data.items.map((item, idx) => (
                    <div key={item.id} onClick={() => onItemClick?.(item)} className="flex gap-4 group">
                        {/* ドラッグハンドルと時間 */}
                        <div className="flex flex-col items-end pt-1 w-16 text-right flex-shrink-0">
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
                                className="w-[68px] rounded border border-gray-200 bg-white px-1 text-[11px] font-bold text-slate-700"
                              />
                            ) : (
                              <div className="text-sm font-bold text-slate-800">{item.time}</div>
                            )}
                            <div className="text-gray-300 mt-2 opacity-0 group-hover:opacity-100 cursor-grab">
                                <GripVertical size={16} />
                            </div>
                        </div>

                        {/* カード */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
                            {/* 画像 */}
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                            </div>

                            {/* 情報 */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-start">
                                    <div className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1">
                                      {item.categoryLabel ?? item.category}
                                    </div>
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
                                <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{item.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                                
                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-medium">
                                    {item.rating && <span className="text-yellow-500">★ {item.rating}</span>}
                                    {item.priceRange && <span>{item.priceRange}</span>}
                                    <a
                                        href="#"
                                        onClick={(event) => event.stopPropagation()}
                                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                                    >
                                        <MapPin size={12} /> 地図
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* マッププレビューへの導線 */}
            <div className="mt-16 bg-slate-50 rounded-3xl p-8 text-center border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-2xl mx-auto shadow-sm flex items-center justify-center mb-4 text-orange-500">
                    <MapPin size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">出発準備OK？</h3>
                <p className="text-gray-500 mb-6">Googleマップで全スポットを確認できます。</p>
                <button onClick={onOpenNavigation} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                    Googleマップで開く
                </button>
            </div>
        </div>
    </div>
  );
};

export default PatternModern;
