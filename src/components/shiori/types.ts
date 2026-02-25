export type ShioriView = "mapsplit" | "kanban" | "magazine";

export type ShioriSpot = {
  id: string;
  placeId: string | null;
  title: string;
  address: string;
  typeLabel: string;
  ratingLabel: string;
  order: number;
};

export const SHIORI_VIEW_OPTIONS: Array<{
  id: ShioriView;
  label: string;
}> = [
  { id: "mapsplit", label: "Map Split" },
  { id: "kanban", label: "Kanban-lite" },
  { id: "magazine", label: "Magazine" },
];
