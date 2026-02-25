import { Restaurant } from "@/types";
import RestaurantCard from "./restaurant-card";

interface RestaurantListProps {
  restaurants: Restaurant[];
}

export default function RestaurantList({ restaurants }: RestaurantListProps) {
  return (
    <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-7 xl:grid-cols-4">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </ul>
  );
}
