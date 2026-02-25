import React from "react";
import { ShioriData, ItineraryItem } from "../types";
import { Sun, Sunset, Moon } from "lucide-react";
import ItemActionMenu from "./ItemActionMenu";

type ColumnProps = {
  title: string;
  icon: React.ReactNode;
  items: ItineraryItem[];
  onItemClick?: (item: ItineraryItem) => void;
  onTimeChange?: (itemId: string, nextTime: string) => void;
  onReplaceItem?: (item: ItineraryItem) => void;
  bookmarkId?: string;
  orderLookup: Map<string, number>;
  total: number;
};

const Column: React.FC<ColumnProps> = ({
  title,
  icon,
  items,
  onItemClick,
  onTimeChange,
  onReplaceItem,
  bookmarkId,
  orderLookup,
  total,
}) => (
  <div className="flex-shrink-0 w-80 md:w-96 flex flex-col h-full bg-slate-50 border-r border-gray-200 last:border-r-0">
    <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-center">
      <div className="flex items-center gap-2 font-bold text-slate-700">
        {icon}
        <span>{title}</span>
        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div />
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="relative bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
        >
          {bookmarkId ? (
            <ItemActionMenu
              item={item}
              bookmarkId={bookmarkId}
              index={orderLookup.get(item.id) ?? 0}
              total={total}
              className="absolute right-2 top-2"
              onReplace={onReplaceItem}
            />
          ) : null}
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              {onTimeChange ? (
                <input
                  type="time"
                  value={item.time}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    event.stopPropagation();
                    onTimeChange(item.bookmarkItemId ?? item.id, event.target.value);
                  }}
                  className="mb-0.5 w-[72px] rounded border border-orange-200 bg-white px-1 text-[11px] font-bold text-orange-600"
                />
              ) : (
                <div className="text-xs font-bold text-orange-600 mb-0.5">
                  {item.time}
                </div>
              )}
              <h4 className="font-bold text-slate-800 text-sm truncate">{item.title}</h4>
              <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
          まだ項目がありません
        </div>
      )}
    </div>
  </div>
);

const PatternKanban: React.FC<{
  data: ShioriData;
  onItemClick?: (item: ItineraryItem) => void;
  onTimeChange?: (itemId: string, nextTime: string) => void;
  onReplaceItem?: (item: ItineraryItem) => void;
  bookmarkId?: string;
}> = ({ data, onItemClick, onTimeChange, onReplaceItem, bookmarkId }) => {
  const morning = data.items.filter((i) => parseInt(i.time) < 12);
  const afternoon = data.items.filter(
    (i) => parseInt(i.time) >= 12 && parseInt(i.time) < 17
  );
  const evening = data.items.filter((i) => parseInt(i.time) >= 17);
  const orderLookup = new Map(data.items.map((item, index) => [item.id, index]));

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-16 border-b border-gray-200 flex items-center px-6 justify-between flex-shrink-0">
        <h1 className="font-bold text-lg">{data.title}</h1>
        <div className="text-sm text-gray-500">ボードビュー</div>
      </div>
      <div className="flex-1 overflow-x-auto flex items-start">
        <Column
          title="午前"
          icon={<Sun size={18} className="text-orange-400" />}
          items={morning}
          onItemClick={onItemClick}
          onTimeChange={onTimeChange}
          onReplaceItem={onReplaceItem}
          bookmarkId={bookmarkId}
          orderLookup={orderLookup}
          total={data.items.length}
        />
        <Column
          title="午後"
          icon={<Sunset size={18} className="text-red-400" />}
          items={afternoon}
          onItemClick={onItemClick}
          onTimeChange={onTimeChange}
          onReplaceItem={onReplaceItem}
          bookmarkId={bookmarkId}
          orderLookup={orderLookup}
          total={data.items.length}
        />
        <Column
          title="夜"
          icon={<Moon size={18} className="text-indigo-400" />}
          items={evening}
          onItemClick={onItemClick}
          onTimeChange={onTimeChange}
          onReplaceItem={onReplaceItem}
          bookmarkId={bookmarkId}
          orderLookup={orderLookup}
          total={data.items.length}
        />
      </div>
    </div>
  );
};

export default PatternKanban;

