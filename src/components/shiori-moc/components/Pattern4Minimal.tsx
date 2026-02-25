import React from 'react';
import { ShioriData } from '../types';

interface Props {
  data: ShioriData;
}

const Pattern4Minimal: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-[#FDFBF7] min-h-full font-serif-jp text-[#2C2C2C]">
      <div className="max-w-5xl mx-auto p-12 md:p-20 border-x border-[#EAEAEA] min-h-screen bg-white shadow-sm">
        
        {/* ヘッダーセクション */}
        <div className="border-b border-black pb-8 mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
                <p className="text-xs tracking-[0.3em] text-gray-500 mb-6 uppercase">旅程</p>
                <h1 className="text-5xl md:text-7xl font-light leading-[1.1] mb-4 tracking-tight">{data.title}</h1>
            </div>
            <div className="text-right">
                <p className="text-lg text-gray-900 font-medium font-sans border-b-2 border-gray-900 inline-block pb-1">{data.date}</p>
            </div>
        </div>

        {/* コンテンツグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
            {data.items.map((item, idx) => (
                <div key={item.id} className="group flex flex-col h-full">
                    {/* 番号と時間 */}
                    <div className="flex items-baseline justify-between mb-6 border-b border-gray-200 pb-2">
                        <span className="font-sans text-xs font-bold tracking-widest text-gray-400">
                            番号 {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <span className="font-sans text-sm font-medium bg-gray-100 px-2 py-0.5">{item.time}</span>
                    </div>

                    {/* 画像 */}
                    {item.imageUrl && (
                        <div className="w-full aspect-[4/3] mb-6 overflow-hidden bg-gray-100">
                            <img 
                                src={item.imageUrl} 
                                alt="" 
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out scale-100 group-hover:scale-105" 
                            />
                        </div>
                    )}

                    {/* テキストコンテンツ */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                             <span className="text-[10px] border border-gray-800 px-2 py-0.5 rounded-full font-sans text-gray-800 uppercase tracking-wider">
                                {item.categoryLabel ?? item.category}
                            </span>
                            {item.rating && <span className="font-sans text-xs text-gray-400">評価: {item.rating}</span>}
                        </div>
                        <h2 className="text-2xl font-medium mb-4 group-hover:underline decoration-1 underline-offset-4 leading-snug">
                            {item.title}
                        </h2>
                        <p className="text-sm text-gray-500 leading-loose font-sans">
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>

        {/* フッター */}
        <div className="mt-32 border-t border-black pt-12 flex justify-center">
            <div className="text-center">
                <p className="font-sans text-xs text-gray-400 tracking-[0.4em] mb-2">タベアルキシオリ</p>
                <div className="w-1 h-8 bg-black mx-auto"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pattern4Minimal;
