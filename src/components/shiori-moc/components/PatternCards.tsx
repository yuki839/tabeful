import React from "react";
import { ItineraryItem, ShioriData } from "../types";
import { Plus } from "lucide-react";
import ItemActionMenu from "./ItemActionMenu";

const PatternCards: React.FC<{
  data: ShioriData;
  onItemClick?: (item: ItineraryItem) => void;
  onTimeChange?: (itemId: string, nextTime: string) => void;
  onReplaceItem?: (item: ItineraryItem) => void;
  bookmarkId?: string;
}> = ({ data, onItemClick, onTimeChange, onReplaceItem, bookmarkId }) => {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
            {/* ヘッダー */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">{data.title}</h1>
                    <p className="text-gray-500 mt-1">{data.items.length} スポット • {data.date}</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white text-slate-700 border border-gray-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-50">フィルター</button>
                </div>
            </div>

            {/* グリッド */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* カバーカード */}
                <div className="col-span-1 sm:col-span-2 aspect-video relative rounded-2xl overflow-hidden shadow-md group">
                    <img src={data.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded w-fit mb-2">カバー</span>
                        <h2 className="text-white font-bold text-xl">旅の概要</h2>
                    </div>
                </div>

                {data.items.map((item, idx) => (
                    <div key={item.id} onClick={() => onItemClick?.(item)} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col hover:shadow-lg transition-all hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-3">
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
                                className="rounded border border-slate-200 bg-white px-1 text-[11px] font-bold text-slate-600"
                              />
                            ) : (
                              <div className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                                {item.time}
                              </div>
                            )}
                            {bookmarkId ? (
                              <ItemActionMenu
                                item={item}
                                bookmarkId={bookmarkId}
                                index={idx}
                                total={data.items.length}
                                onReplace={onReplaceItem}
                              />
                            ) : null}
                        </div>
                        
                        <div className="aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden mb-3 relative">
                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                {item.categoryLabel ?? item.category}
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 mb-1 leading-tight">{item.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                             <span className="font-bold text-slate-400">#{idx + 1}</span>
                             <span className="font-bold text-slate-700">{item.priceRange || '無料'}</span>
                        </div>
                    </div>
                ))}

                {/* 追加カードのプレースホルダー */}
                <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-sm">スポットを追加できます</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PatternCards;
