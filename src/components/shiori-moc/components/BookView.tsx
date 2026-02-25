import React, { useState } from 'react';
import { ShioriData, ThemeConfig } from '../types';
import { Map as MapIcon, Star, Camera, Utensils, ShoppingBag, Flag } from 'lucide-react';

interface Props {
  data: ShioriData;
  theme: ThemeConfig;
}

const BookView: React.FC<Props> = ({ data, theme }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const getCategoryIcon = (category: string) => {
    switch(category) {
        case 'food': return <Utensils size={14} />;
        case 'sightseeing': return <Camera size={14} />;
        case 'shop': return <ShoppingBag size={14} />;
        default: return <Flag size={14} />;
    }
  };

  const scrollToItem = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(`item-${id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-12 transition-colors duration-700 ${theme.bgTexture} overflow-hidden`}>
      
      {/* 
         本のコンテナ
         - aspect-[3/2] で「開いた本」の比率を維持
         - 最大高さ/幅でビューポートに収める
      */}
      <div className={`
        relative w-full max-w-[1400px] aspect-[3/2] max-h-[calc(100vh-6rem)] 
        flex transition-all duration-500 transform
        ${theme.bookClass}
      `}>
        
        {/* === 左ページ: 空間マップ（軸） === */}
        <div className={`
            flex-1 relative overflow-hidden 
            ${theme.pageLeftClass} 
            ${theme.id === 'pop' ? 'rounded-l-2xl' : ''}
            /* 背表紙の湾曲を表現する内側シャドウ */
            after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-16 after:bg-gradient-to-l after:from-black/10 after:to-transparent after:pointer-events-none after:z-30
        `}>
            
            {/* マップの質感/オーバーレイ */}
            <div className={`absolute inset-0 z-0 opacity-20 pointer-events-none 
                ${theme.mapStyle === 'sepia' ? 'bg-[#5D4037] mix-blend-overlay' : ''}
            `} 
            style={{
                // さりげないマップのグリッドパターン
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                color: theme.mapStyle === 'pop' ? '#DB2777' : theme.mapStyle === 'grayscale' ? '#000' : 'currentColor'
            }}
            />

            {/* 模擬ピン */}
            {data.items.map((item, idx) => {
                const top = 20 + (idx * 17) % 55; 
                const left = 20 + (idx * 23) % 60;
                const isActive = activeId === item.id;
                
                return (
                    <button 
                        key={item.id}
                        onClick={() => scrollToItem(item.id)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group z-10 transition-all duration-300 ${isActive ? 'scale-125 z-50' : 'hover:scale-110'}`}
                        style={{ top: `${top}%`, left: `${left}%` }}
                    >
                        {/* ツールチップラベル（付箋/タグ風） */}
                        <div className={`
                            mb-2 px-2 py-1 text-[10px] md:text-xs whitespace-nowrap shadow-md transition-all duration-300 font-bold
                            ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
                            ${theme.id === 'antique' ? 'bg-[#EFEBE9] text-[#3E2723] border border-[#3E2723] font-serif-jp' : 'bg-white rounded'}
                            ${theme.id === 'magazine' ? 'bg-black text-white font-condensed tracking-wider uppercase rounded-none' : ''}
                            ${theme.id === 'pop' ? 'bg-yellow-300 text-pink-600 -rotate-2 border-2 border-white' : ''}
                            ${theme.id === 'sketch' ? 'bg-blue-100 text-blue-900 border border-blue-900' : ''}
                        `}>
                            {item.title}
                        </div>

                        {/* ピンマーカー */}
                        <div className={`
                            w-6 h-6 md:w-8 md:h-8 flex items-center justify-center shadow-lg transition-all
                            ${theme.id === 'pop' ? 'rounded-xl rotate-3 group-hover:rotate-12' : 'rounded-full'}
                            ${theme.id === 'sketch' ? 'rounded-none border-2 border-blue-900 bg-white text-blue-900' : theme.accentColor}
                            ${isActive ? 'ring-2 ring-offset-1 ring-current' : ''}
                        `}>
                            <span className="font-bold text-xs md:text-sm">{idx + 1}</span>
                        </div>
                        
                        {/* 3Dピンの影 */}
                        <div className="w-5 h-1 bg-black/20 rounded-full blur-[2px] mt-0.5" />
                    </button>
                );
            })}

            {/* ページヘッダー（左） */}
            <div className="absolute top-6 left-6 right-6 z-20 pointer-events-none">
                <div className={`inline-block px-3 py-1.5 backdrop-blur-sm 
                    ${theme.id === 'magazine' ? 'bg-black text-white' : 'bg-white/80 rounded shadow-sm border border-gray-100'}
                `}>
                    <h2 className={`${theme.fontHeading} text-sm md:text-base flex items-center gap-2`}>
                        <MapIcon size={14} />
                        MAP AREA
                    </h2>
                </div>
            </div>
            
            {/* アンティークな羅針盤装飾 */}
            {theme.id === 'antique' && (
                <div className="absolute bottom-10 right-10 opacity-30 pointer-events-none">
                   <div className="w-24 h-24 border-2 border-[#3E2723] rounded-full flex items-center justify-center">
                      <div className="w-20 h-20 border border-[#3E2723] rounded-full flex items-center justify-center rotate-45">
                          <span className="font-serif font-bold text-[#3E2723]">N</span>
                      </div>
                   </div>
                </div>
            )}
        </div>

        {/* === 背表紙/綴じ === */}
        {theme.spineClass !== 'hidden' && (
            <div className={`flex-shrink-0 relative z-40 ${theme.spineClass} flex flex-col justify-center`}>
                {theme.id === 'sketch' && (
                    /* リング綴じ風の表現 */
                    <div className="absolute inset-0 flex flex-col justify-evenly items-center py-4 w-full">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="w-[140%] h-4 bg-gray-300 rounded-full shadow-md transform -rotate-6 border border-gray-400" />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* === 右ページ: 行程リスト === */}
        <div className={`
            flex-1 relative overflow-hidden flex flex-col
            ${theme.pageRightClass}
            ${theme.id === 'pop' ? 'rounded-r-2xl' : ''}
            /* 背表紙の湾曲を表現する内側シャドウ */
            after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-0 after:w-16 after:bg-gradient-to-r after:from-black/10 after:to-transparent after:pointer-events-none after:z-30
        `}>
            {/* スクロール可能なコンテンツ領域 */}
            <div className="flex-1 overflow-y-auto book-scroll p-6 md:p-10 lg:p-12 relative z-20">
                
                {/* 本のヘッダー */}
                <div className={`mb-8 border-b-2 pb-4 ${theme.id === 'pop' ? 'border-dashed border-pink-300' : 'border-gray-200'} `}>
                    <p className={`opacity-60 text-xs mb-1 uppercase tracking-widest ${theme.fontBody}`}>{data.date}</p>
                    <h1 className={`text-3xl md:text-4xl leading-tight ${theme.fontHeading}`}>{data.title}</h1>
                </div>

                {/* アイテム一覧 */}
                <div className="space-y-8 md:space-y-12 pb-12">
                    {data.items.map((item, idx) => (
                        <div 
                            key={item.id} 
                            id={`item-${item.id}`}
                            className={`group flex gap-4 md:gap-6 cursor-pointer transition-all duration-300 ${activeId && activeId !== item.id ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}
                            onMouseEnter={() => setActiveId(item.id)}
                            onMouseLeave={() => setActiveId(null)}
                        >
                            {/* 番号列 */}
                            <div className="flex flex-col items-center pt-1">
                                <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-bold text-xs md:text-sm mb-2 shadow-sm transition-transform group-hover:scale-110 
                                    ${theme.id === 'pop' ? 'rounded-lg rotate-2' : 'rounded-full'} 
                                    ${theme.id === 'sketch' ? 'rounded-none border border-current bg-transparent text-current' : theme.accentColor}
                                `}>
                                    {idx + 1}
                                </div>
                                {/* 接続ライン */}
                                <div className={`w-px flex-1 ${theme.id === 'magazine' ? 'bg-black' : 'bg-current opacity-20'} ${theme.id === 'pop' ? 'border-l border-dashed border-pink-300 bg-transparent w-0' : ''}`} />
                            </div>

                            {/* コンテンツ列 */}
                            <div className="flex-1">
                                <div className="flex justify-between items-baseline mb-2">
                                    <h3 className={`text-lg md:text-xl ${theme.fontHeading} group-hover:underline decoration-2 underline-offset-4`}>
                                        {item.title}
                                    </h3>
                                    <span className={`text-xs md:text-sm font-bold opacity-60 ${theme.fontBody} bg-white/50 px-1 rounded`}>{item.time}</span>
                                </div>

                                {/* テーマ別スタイルの画像 */}
                                <div className={`relative mb-3 overflow-hidden shadow-sm transition-transform duration-500 group-hover:shadow-md h-32 md:h-40 w-full
                                    ${theme.id === 'antique' ? 'rounded-sm sepia-[.3] border-4 border-white shadow-lg -rotate-1' : 'rounded-md'}
                                    ${theme.id === 'pop' ? 'rounded-xl border-4 border-white rotate-1 group-hover:rotate-0 shadow-lg' : ''}
                                    ${theme.id === 'sketch' ? 'grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 border-2 border-gray-800' : ''}
                                    ${theme.id === 'magazine' ? 'rounded-none' : ''}
                                `}>
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    
                                    {/* カテゴリーバッジ */}
                                    <div className="absolute top-2 right-2">
                                        <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 shadow-sm backdrop-blur-md
                                            ${theme.id === 'pop' ? 'bg-cyan-300 text-black border-2 border-white rounded-full' : 'bg-white/90 text-black rounded'}
                                            ${theme.id === 'magazine' ? 'bg-black text-white rounded-none' : ''}
                                        `}>
                                            {getCategoryIcon(item.category)}
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                <p className={`mb-2 text-sm md:text-base leading-relaxed ${theme.fontBody}`}>
                                    {item.description}
                                </p>

                                <div className={`flex gap-3 text-xs font-bold opacity-70 ${theme.fontBody}`}>
                                    {item.priceRange && <span className="bg-black/5 px-1.5 py-0.5 rounded">¥ {item.priceRange}</span>}
                                    {item.rating && (
                                        <span className="flex items-center gap-1 text-yellow-500">
                                            <Star size={10} fill="currentColor" /> {item.rating}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            
            </div>
            
            {/* ページフッター（右） */}
            <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-30 ${theme.id === 'magazine' ? 'from-white' : 'from-transparent'}`} />
            
            {theme.id === 'pop' && (
                /* ポップテーマ用のマスキングテープ装飾 */
                <div className="absolute top-0 right-10 w-8 h-12 bg-pink-400/50 -rotate-3 z-30" />
            )}
        </div>

      </div>
    </div>
  );
};

export default BookView;
