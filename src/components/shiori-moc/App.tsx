import React, { useState } from "react";
import { DesignPattern, ItineraryItem, ShioriData } from "./types";
import { INITIAL_DATA } from "./constants";
import PatternModern from './components/PatternModern';
import PatternTimeline from './components/PatternTimeline';
import PatternMapSplit from './components/PatternMapSplit';
import PatternMagazine from './components/PatternMagazine';
import PatternCards from './components/PatternCards';
import PatternKanban from './components/PatternKanban';
import type { MapMarker } from "@/components/maps/interactive-google-map";

interface AppProps {
  data?: ShioriData;
  currentPattern?: DesignPattern;
  onPatternChange?: (pattern: DesignPattern) => void;
  onOpenSearch?: () => void;
  onOpenNavigation?: () => void;
  onItemClick?: (item: ItineraryItem) => void;
  onMapPlaceClick?: (placeId: string) => void;
  onTimeChange?: (itemId: string, nextTime: string) => void;
  onMoveItem?: (itemId: string, direction: "up" | "down") => void;
  onReplaceItem?: (item: ItineraryItem) => void;
  onReorderItems?: (orderedItemIds: string[]) => void;
  isReordering?: boolean;
  onSetCover?: () => void;
  mapImageUrl?: string | null;
  mapEmbedUrl?: string | null;
  mapApiKey?: string | null;
  mapCenter?: { lat: number; lng: number };
  mapMarkers?: MapMarker[];
  bookmarkId?: string;
}

const App: React.FC<AppProps> = ({
  data: dataProp,
  currentPattern,
  onOpenNavigation,
  onItemClick,
  onMapPlaceClick,
  onTimeChange,
  onMoveItem,
  onReplaceItem,
  onReorderItems,
  isReordering,
  onSetCover,
  onOpenSearch,
  mapImageUrl,
  mapEmbedUrl,
  mapApiKey,
  mapCenter,
  mapMarkers,
  bookmarkId,
}) => {
  const [currentPatternState] = useState<DesignPattern>(DesignPattern.Modern);
  const [dataState] = useState<ShioriData>(INITIAL_DATA);

  const activePattern = currentPattern ?? currentPatternState;
  const activeData = dataProp ?? dataState;

  const renderPattern = () => {
    switch (activePattern) {
      case DesignPattern.Modern:
        return (
          <PatternModern
            data={activeData}
            onItemClick={onItemClick}
            onOpenNavigation={onOpenNavigation}
            onSetCover={onSetCover}
            onTimeChange={onTimeChange}
            onMoveItem={onMoveItem}
            isReordering={isReordering}
            bookmarkId={bookmarkId}
            onReplaceItem={onReplaceItem}
          />
        );
      case DesignPattern.Timeline:
        return (
          <PatternTimeline
            data={activeData}
            onItemClick={onItemClick}
            onOpenNavigation={onOpenNavigation}
            onTimeChange={onTimeChange}
            onMoveItem={onMoveItem}
            isReordering={isReordering}
            bookmarkId={bookmarkId}
            onReplaceItem={onReplaceItem}
          />
        );
      case DesignPattern.MapSplit:
        return (
          <PatternMapSplit
            data={activeData}
            mapImageUrl={mapImageUrl}
            mapEmbedUrl={mapEmbedUrl}
            onItemClick={onItemClick}
            onMapPlaceClick={onMapPlaceClick}
            onOpenSearch={onOpenSearch}
            onTimeChange={onTimeChange}
            onMoveItem={onMoveItem}
            onReorderItems={onReorderItems}
            mapApiKey={mapApiKey}
            mapCenter={mapCenter}
            mapMarkers={mapMarkers}
            bookmarkId={bookmarkId}
            isReordering={isReordering}
            onReplaceItem={onReplaceItem}
          />
        );
      case DesignPattern.Magazine:
        return (
          <PatternMagazine
            data={activeData}
            onItemClick={onItemClick}
            onOpenNavigation={onOpenNavigation}
            onTimeChange={onTimeChange}
            onMoveItem={onMoveItem}
            bookmarkId={bookmarkId}
            isReordering={isReordering}
            onReplaceItem={onReplaceItem}
          />
        );
      case DesignPattern.Cards:
        return (
          <PatternCards
            data={activeData}
            onItemClick={onItemClick}
            onTimeChange={onTimeChange}
            bookmarkId={bookmarkId}
            onReplaceItem={onReplaceItem}
          />
        );
      case DesignPattern.Kanban:
        return (
          <PatternKanban
            data={activeData}
            onItemClick={onItemClick}
            onTimeChange={onTimeChange}
            bookmarkId={bookmarkId}
            onReplaceItem={onReplaceItem}
          />
        );
      default:
        return (
          <PatternModern
            data={activeData}
            onItemClick={onItemClick}
            onOpenNavigation={onOpenNavigation}
            onSetCover={onSetCover}
            onTimeChange={onTimeChange}
            bookmarkId={bookmarkId}
          />
        );
    }
  };

  const isMapSplit = activePattern === DesignPattern.MapSplit;

  return (
    <div
      className={
        isMapSplit
          ? "w-full min-h-0 bg-white text-slate-900"
          : "w-full min-h-screen bg-white text-slate-900"
      }
    >
      {renderPattern()}
    </div>
  );
};

export default App;
