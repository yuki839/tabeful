import React from 'react';
import { ShioriData } from '../types';
import { MapPin } from 'lucide-react';

interface Props {
  data: ShioriData;
}

const Pattern2Cards: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-gray-900 min-h-full text-white pb-20">
      {/* ヒーロー */}
      <div className="relative h-[40vh] min-h-[400px] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
        <img 
          src={data.items[0]?.imageUrl || "https://picsum.photos/1200/800"} 
          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000" 
          alt="ヒーロー"
        />
        <div className="absolute bottom-10 left-8 md:left-16 z-20 max-w-4xl">
          <p className="text-orange-400 font-bold tracking-[0.2em] text-sm uppercase mb-3">食べ歩き旅程</p>
          <h1 className="text-4xl md:text-6xl font-black leading-none mb-4">{data.title}</h1>
          <p className="text-gray-300 text-lg">{data.date}</p>
        </div>
      </div>

      {/* カードグリッド */}
      <div className="px-6 md:px-16 -mt-16 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {data.items.map((item) => (
            <div key={item.id} className="relative group">
                <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 h-full flex flex-col transition-transform hover:-translate-y-2 hover:shadow-orange-500/10">
                <div className="relative h-56 flex-shrink-0 overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold border border-white/10 shadow-lg">
                       {item.time}
                    </div>
                    {item.category === 'food' && (
                    <div className="absolute bottom-4 right-4 bg-orange-500 text-white p-2 rounded-full shadow-lg">
                        <span className="text-xs font-bold px-1">おすすめ</span>
                    </div>
                    )}
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-400 bg-gray-700/50 px-2 py-1 rounded border border-gray-600/50 uppercase tracking-wide">
                          {item.categoryLabel ?? item.category}
                        </span>
                        {item.rating && <span className="text-yellow-400 text-xs font-bold">★ {item.rating}</span>}
                    </div>
                    <h3 className="text-xl font-bold mb-3 leading-tight">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{item.description}</p>
                    
                    <div className="flex items-center text-xs text-gray-500 border-t border-gray-700 pt-4">
                        <MapPin size={14} className="mr-2 text-gray-400" />
                        <span className="truncate">{item.address || "場所の詳細"}</span>
                    </div>
                </div>
                </div>
            </div>
            ))}
        </div>
        
        <div className="text-center text-gray-600 text-sm pt-16">
          <p>Tabearuki Shioriで作成</p>
        </div>
      </div>
    </div>
  );
};

export default Pattern2Cards;
