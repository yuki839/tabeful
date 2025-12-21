import CarouselContainer from "@/components/carousel-container";
import RestaurantCard from "@/components/restaurant-card";
import RestaurantList from "@/components/restaurant-list";
import Section from "@/components/section";
import Categories from "@/components/ui/categories";
import { fetchRamenRestaurants, fetchRestaurants } from "@/lib/restaurants/api";

export default async function Home() {
  const { data: nearbyRamenRestaurants, error: nearbyRamenRestaurantsError } =
    await fetchRamenRestaurants();
  const { data: nearbyRestaurants, error: nearbyRestaurantsError } =
    await fetchRestaurants();

  return (
    <>
      <Categories />

      {!nearbyRestaurants ? (
        <p>{nearbyRestaurantsError}</p>
      ) : nearbyRestaurants.length > 0 ? (
        <Section
          title="近くのレストラン"
          expandedContent={<RestaurantList restaurants={nearbyRestaurants} />}
        >
          <CarouselContainer slideToShow={4}>
            {nearbyRestaurants.map((restaurant, index) => [
              <RestaurantCard key={index} restaurant={restaurant} />,
            ])}
          </CarouselContainer>
        </Section>
      ) : (
        <p>近くにレストランが見つかりませんでした。</p>
      )}
      {!nearbyRamenRestaurants ? (
        <p>{nearbyRamenRestaurantsError}</p>
      ) : nearbyRamenRestaurants.length > 0 ? (
        <Section
          title="近くのラーメン店"
          expandedContent={
            <RestaurantList restaurants={nearbyRamenRestaurants} />
          }
        >
          <CarouselContainer slideToShow={4}>
            {nearbyRamenRestaurants.map((restaurant, index) => [
              <RestaurantCard key={index} restaurant={restaurant} />,
            ])}
          </CarouselContainer>
        </Section>
      ) : (
        <p>近くにラーメン店が見つかりませんでした。</p>
      )}
    </>
  );
}
