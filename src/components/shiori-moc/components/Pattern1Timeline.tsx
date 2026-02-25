import React from 'react';
import { ShioriData } from '../types';
import { Clock, Utensils, Camera } from 'lucide-react';

interface Props {
  data: ShioriData;
}

const Pattern1Timeline: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white min-h-full shadow-sm">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-12 px-8 md:px-16 shadow-lg relative z-10">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-base font-medium opacity-80 mb-2 tracking-wide uppercase">{data.date}</h2>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{data.title}</h1>
            <div className="inline-flex items-center space-x-2 text-sm bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <Clock size={16} />
            <span>Total: {data.items.length} spots</span>
            </div>
        </div>
      </div>

      {/* タイムライン全体 */}
      <div className="max-w-4xl mx-auto p-8 md:p-16 relative">
        {/* 縦ライン */}
        <div className="absolute left-12 md:left-1/2 top-16 bottom-16 w-0.5 bg-gray-200" />

        <div className="space-y-12 relative z-0">
          {data.items.map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
                <div key={item.id} className={`relative flex flex-col md:flex-row ${isEven ? 'md:flex-row-reverse' : ''} items-center md:items-start group`}>
                
                {/* ドット（PC:中央/モバイル:左） */}
                <div className={`absolute left-0 md:left-1/2 top-0 w-9 h-9 md:-ml-[1.15rem] -ml-[0.15rem] z-20 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                    item.category === 'food' ? 'bg-orange-400 text-white' : 'bg-teal-500 text-white'
                }`}>
                    {item.category === 'food' ? <Utensils size={14} /> : <Camera size={14} />}
                </div>

                {/* PC用のスペーサー */}
                <div className="hidden md:block w-1/2" />

                {/* コンテンツカード */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-md">
                        {item.time}
                        </span>
                        {item.rating && (
                        <div className="flex text-yellow-400 text-sm">
                            {"★".repeat(Math.floor(item.rating))}
                        </div>
                        )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 leading-relaxed">{item.description}</p>
                    
                    {item.imageUrl && (
                        <div className="rounded-xl overflow-hidden h-48 w-full mb-4">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center border-t pt-3 mt-2">
                        <span className="text-xs text-gray-400 truncate max-w-[70%]">{item.address}</span>
                        {item.priceRange && (
                            <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {item.priceRange}
                            </div>
                        )}
                    </div>
                    </div>
                </div>
                </div>
            );
          })}
        </div>
        
        {/* 終点ドット */}
        <div className="absolute left-12 md:left-1/2 bottom-0 w-4 h-4 md:-ml-2 -ml-1 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
};

export default Pattern1Timeline;
