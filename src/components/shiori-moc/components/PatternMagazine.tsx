import React from "react";
import { ItineraryItem, ShioriData } from "../types";
import ItemActionMenu from "./ItemActionMenu";

const PatternMagazine: React.FC<{
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
    <div className="h-full overflow-y-auto bg-white">
        <div className="max-w-5xl mx-auto p-8 md:p-16">
            
            {/* エディトリアルヘッダー */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end mb-20">
                <div>
                    <span className="text-xs font-bold tracking-[0.3em] uppercase text-orange-600 block mb-4">旅ログ</span>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-6">{data.title}</h1>
                    <div className="flex gap-4 text-sm font-medium text-gray-500">
                        <span>作成者</span>
                        <span>•</span>
                        <span>{data.date}</span>
                    </div>
                </div>
                <div className="relative aspect-[4/5] md:aspect-square bg-gray-100 overflow-hidden">
                    <img src={data.coverImage} className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" />
                </div>
            </div>

            {/* コンテンツフロー */}
            <div className="border-t-4 border-black pt-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* 左レール（メタ情報） */}
                    <div className="hidden md:block col-span-3">
                        <div className="sticky top-12">
                            <h3 className="font-bold text-lg mb-4">ハイライト</h3>
                            <ul className="space-y-2 text-sm text-gray-500 mb-8">
                                {data.items.slice(0,3).map(i => <li key={i.id} className="truncate">• {i.title}</li>)}
                            </ul>
                        </div>
                    </div>

                    {/* メインストーリー */}
                    <div className="col-span-1 md:col-span-9 space-y-16">
                        {data.items.map((item, idx) => (
                            <div key={item.id} onClick={() => onItemClick?.(item)} className="group relative">
                                {bookmarkId ? (
                                  <ItemActionMenu
                                    item={item}
                                    bookmarkId={bookmarkId}
                                    index={idx}
                                    total={data.items.length}
                                    className="absolute right-0 top-2"
                                    onMove={onMoveItem}
                                    isBusy={isReordering}
                                    onReplace={onReplaceItem}
                                  />
                                ) : null}
                                <div className="flex items-baseline gap-4 mb-4 border-b border-gray-200 pb-2">
                                    <span className="text-4xl font-black text-gray-200 group-hover:text-orange-500 transition-colors">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </span>
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
                                        className="rounded bg-white px-1 text-[11px] font-bold text-black"
                                      />
                                    ) : (
                                      <span className="text-sm font-bold bg-black text-white px-2 py-0.5">{item.time}</span>
                                    )}
                                    <span className="text-sm font-bold uppercase tracking-wider text-gray-400">
                                        {item.categoryLabel ?? item.category}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className={`${idx % 2 === 1 ? 'md:order-2' : ''}`}>
                                        <h2 className="text-3xl font-bold mb-4 leading-tight">{item.title}</h2>
                                        <p className="text-gray-600 leading-relaxed text-lg mb-6">{item.description}</p>
                                        <div className="flex gap-4 text-sm font-bold text-gray-400">
                                            <span>{item.priceRange ?? "-"}</span>
                                            <span>評価: {item.rating ?? "評価なし"}</span>
                                        </div>
                                    </div>
                                    <div className={`aspect-[4/3] bg-gray-100 overflow-hidden ${idx % 2 === 1 ? 'md:order-1' : ''}`}>
                                        <img src={item.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            <div className="mt-24 bg-black text-white p-12 text-center">
                 <h2 className="text-2xl font-bold mb-4">旅程の終わり</h2>
                 <p className="text-gray-400 mb-8">出発しますか？</p>
                 <button onClick={onOpenNavigation} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-orange-400 transition-colors">
                     ナビを開く
                 </button>
            </div>
        </div>
    </div>
  );
};

export default PatternMagazine;
