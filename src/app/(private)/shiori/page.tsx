import ShioriBoard, { type ShioriTrip } from "@/components/shiori-board";
import { fetchLocation, fetchRestaurants } from "@/lib/restaurants/api";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

const formatTimeSlot = (index: number) => {
  const hour = 10 + index * 2;
  return `${String(hour).padStart(2, "0")}:00`;
};

export default async function ShioriPage() {
  const { lat, lng } = await fetchLocation();
  const { data: restaurants } = await fetchRestaurants(lat, lng);

  const fallbackImage = "/no_image.png";
  const list = restaurants ?? [];
  const coverImage =
    list.find((restaurant) => restaurant.photoUrl)?.photoUrl ?? fallbackImage;

  const trip: ShioriTrip = {
    title: "ノワール食べ歩き",
    date: formatDate(new Date()),
    coverImage,
    locationLabel: "現在地を中心に",
    spots: list.slice(0, 6).map((restaurant, index) => ({
      id: restaurant.id,
      name: restaurant.restaurantName ?? "名称未設定",
      category: restaurant.primaryType?.replaceAll("_", " ") ?? "スポット",
      imageUrl: restaurant.photoUrl ?? fallbackImage,
      note: "気分に合わせて次の一軒を計画しよう。",
      time: formatTimeSlot(index),
    })),
  };

  if (trip.spots.length === 0) {
    trip.spots = [
      {
        id: "fallback-spot",
        name: "最初の一軒を追加",
        category: "スポット",
        imageUrl: fallbackImage,
        note: "近くのレストランを検索してボードを埋めましょう。",
        time: "10:00",
      },
    ];
  }

  return <ShioriBoard trip={trip} />;
}
