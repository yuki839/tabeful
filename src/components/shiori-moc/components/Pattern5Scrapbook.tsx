import React from 'react';
import { ShioriData } from '../types';
import { Star, Heart, Scissors } from 'lucide-react';

interface Props {
  data: ShioriData;
}

const Pattern5Scrapbook: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-[#F0E6D2] min-h-full font-handwritten overflow-hidden relative">
      {/* 背景テクスチャ */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      <div className="max-w-7xl mx-auto p-8 md:p-16 relative z-10">
        
        {/* ヘッダーエリア */}
        <div className="flex justify-center mb-16 relative">
            <div className="bg-white p-6 md:p-8 rotate-1 shadow-xl border-4 border-dashed border-red-300 rounded-lg max-w-2xl w-full text-center relative transform hover:scale-105 transition-transform duration-300">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-red-200/50 transform -rotate-1 z-20"></div>
                <div className="absolute -top-6 -right-6 text-gray-400 transform rotate-45">
                    <Scissors size={32} />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-2">{data.title}</h1>
                <div className="inline-block border-b-2 border-amber-900/20 pb-1 px-4">
                    <p className="text-xl text-amber-700 font-bold">{data.date}</p>
                </div>
            </div>
        </div>

        {/* マソングリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 px-4">
            {data.items.map((item, idx) => {
                // 各カードの回転を少しランダム化
                const rotation = (idx % 3 === 0) ? 'rotate-2' : (idx % 3 === 1) ? '-rotate-1' : 'rotate-1';
                const tapeColor = (idx % 2 === 0) ? 'bg-yellow-200/80' : 'bg-green-200/80';
                
                return (
                    <div key={item.id} className={`relative group transform hover:z-20 hover:scale-105 transition-all duration-300 ${rotation}`}>
                        {/* テープ */}
                        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 ${tapeColor} transform rotate-3 z-20 shadow-sm opacity-90 backdrop-blur-sm`}></div>

                        {/* ポラロイド風カード */}
                        <div className="bg-white p-4 pb-8 shadow-[6px_6px_0px_rgba(0,0,0,0.1)] rounded-sm border border-gray-200 h-full flex flex-col">
                            <div className="aspect-[4/3] bg-gray-100 mb-4 overflow-hidden rounded-sm border-2 border-gray-100 relative">
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover sepia-[.2] group-hover:sepia-0 transition-all duration-500" />
                                {item.category === 'food' && (
                                    <div className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded-full text-pink-500 animate-pulse">
                                        <Heart size={16} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="px-2 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-amber-200 transform -rotate-2">
                                        {item.time}
                                    </span>
                                    <div className="flex gap-1 text-yellow-400 drop-shadow-sm">
                                        {[...Array(Math.floor(item.rating || 3))].map((_, i) => (
                                            <Star key={i} size={16} fill="currentColor" />
                                        ))}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2 leading-tight">{item.title}</h2>
                                <p className="text-base text-gray-600 leading-snug font-medium flex-1">{item.description}</p>
                                
                                <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200 text-right">
                                    <span className="text-sm font-bold text-gray-400 transform inline-block rotate-1">
                                        Budget: {item.priceRange || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        
        <div className="mt-20 text-center pb-8 opacity-60">
            <p className="font-handwritten text-xl text-amber-900">~ End of Journey ~</p>
        </div>
      </div>
    </div>
  );
};

export default Pattern5Scrapbook;
