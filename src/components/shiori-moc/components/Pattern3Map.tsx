import React from 'react';
import { ShioriData } from '../types';
import { Map as MapIcon, Navigation2, ExternalLink } from 'lucide-react';

interface Props {
  data: ShioriData;
}

const Pattern3Map: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white h-screen flex flex-col md:flex-row overflow-hidden">
      
      {/* マップ領域（PC:左/モバイル:上） */}
      <div className="relative md:w-2/3 h-[40vh] md:h-full bg-slate-200 overflow-hidden">
        {/* ダミーのマップグリッド */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', 
               backgroundSize: '30px 30px' 
             }}>
        </div>
        
        {/* 模擬ピン */}
        {data.items.map((item, idx) => {
           // デモ用のランダム配置
           const top = 20 + (idx * 15) % 60; 
           const left = 20 + (idx * 25) % 60;
           return (
             <div key={item.id} 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer hover:z-50"
                  style={{ top: `${top}%`, left: `${left}%` }}>
               <div className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl mb-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                 {item.title}
               </div>
               <div className="w-8 h-8 bg-indigo-600 rounded-full border-4 border-white shadow-lg ring-4 ring-indigo-600/20 flex items-center justify-center text-white text-[10px] font-bold">
                  {idx + 1}
               </div>
             </div>
           )
        })}

        {/* マップヘッダーのオーバーレイ */}
        <div className="absolute top-6 left-6 right-6 md:w-96 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 z-10">
           <div className="flex justify-between items-center">
             <div>
                <h1 className="font-bold text-slate-800 text-lg">{data.title}</h1>
                <p className="text-sm text-slate-500">{data.date}</p>
             </div>
             <div className="bg-indigo-100 p-2.5 rounded-full text-indigo-600">
               <MapIcon size={20} />
             </div>
           </div>
        </div>
      </div>

      {/* リスト領域（PC:右/モバイル:下） */}
      <div className="flex-1 md:w-1/3 bg-white relative z-20 flex flex-col shadow-2xl md:shadow-none border-l border-slate-100">
        <div className="p-6 border-b border-slate-100 bg-white">
            <h2 className="font-bold text-slate-800">旅程リスト</h2>
            <p className="text-xs text-slate-500">{data.items.length} スポット</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {data.items.map((item, idx) => (
            <div key={item.id} className="flex gap-4 group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="flex flex-col items-center pt-1">
                 <div className="text-xs font-bold text-indigo-500 w-12 text-center">{item.time}</div>
                 <div className="w-0.5 h-full bg-slate-100 mt-2 group-hover:bg-indigo-200 transition-colors"></div>
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex gap-4 items-start">
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 relative">
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                        <div className="absolute top-0 left-0 bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-br-lg">
                            {idx + 1}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{item.title}</h3>
                            <ExternalLink size={12} className="text-slate-300 opacity-0 group-hover:opacity-100" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {item.categoryLabel ?? item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                {item.priceRange}
                            </span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
                <Navigation2 size={18} />
                ナビを開始
            </button>
        </div>
      </div>
    </div>
  );
};

export default Pattern3Map;
