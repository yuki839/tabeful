import RestaurantList from "@/components/restaurant-list";
import Categories from "@/components/ui/categories";
import {
  fetchCategoryRestaurants,
  fetchCRestaurantsByKeyword,
  fetchLocation,
} from "@/lib/restaurants/api";
import { redirect } from "next/navigation";
import React from "react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ category: string; restaurant: string }>;
}) {
  const { category, restaurant } = await searchParams;
  console.log("restaurant", restaurant);

  const { lat, lng } = await fetchLocation();

  if (category) {
    const { data: categoryRestaurants, error: fetchError } =
      await fetchCategoryRestaurants(category, lat, lng);
    return (
      <>
        <div className="mb-4">
          <Categories />
        </div>
        {!categoryRestaurants ? (
          <p className="text-destructive">{fetchError}</p>
        ) : categoryRestaurants.length > 0 ? (
          <RestaurantList restaurants={categoryRestaurants} />
        ) : (
          <p>
            カテゴリ<strong>{category}</strong>
            に一致するレストランが見つかりませんでした。
          </p>
        )}
      </>
    );
  } else if (restaurant) {
    const { data: restaurants, error: fetchError } =
      await fetchCRestaurantsByKeyword(restaurant, lat, lng);

    return (
      <>
        {!restaurants ? (
          <p className="text-destructive">{fetchError}</p>
        ) : restaurants.length > 0 ? (
          <>
            <div className="mb-4">
              {restaurant} の検索結果 {restaurants.length} 件の結果
            </div>
            <RestaurantList restaurants={restaurants} />
          </>
        ) : (
          <p>
            カテゴリ<strong>{restaurant}</strong>
            に一致するレストランが見つかりませんでした。
          </p>
        )}
      </>
    );
  } else {
    redirect("/");
  }

  return <div>SearchPage</div>;
}
