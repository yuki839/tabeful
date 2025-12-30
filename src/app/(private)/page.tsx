import CarouselContainer from "@/components/carousel-container";
import RestaurantCard from "@/components/restaurant-card";
import RestaurantList from "@/components/restaurant-list";
import Section from "@/components/section";
import Categories from "@/components/ui/categories";
import {
  fetchLocation,
  fetchRamenRestaurants,
  fetchRestaurants,
} from "@/lib/restaurants/api";

export default async function Home() {
  const { lat, lng } = await fetchLocation();

  const { data: nearbyRamenRestaurants, error: nearbyRamenRestaurantsError } =
    await fetchRamenRestaurants(lat, lng);
  const { data: nearbyRestaurants, error: nearbyRestaurantsError } =
    await fetchRestaurants(lat, lng);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2A26] font-serif selection:bg-[#D6C0B3] selection:text-white">
      <main className="w-full max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-16 space-y-16">
        <section className="pb-4 border-b border-[#E5E5E5]">
          <Categories />
        </section>

        {!nearbyRestaurants ? (
          <p className="text-sm text-[#8C8474] font-sans">
            {nearbyRestaurantsError}
          </p>
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
          <p className="text-sm text-[#8C8474] font-sans">
            近くにレストランが見つかりませんでした
          </p>
        )}

        {!nearbyRamenRestaurants ? (
          <p className="text-sm text-[#8C8474] font-sans">
            {nearbyRamenRestaurantsError}
          </p>
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
          <p className="text-sm text-[#8C8474] font-sans">
            近くにラーメン店が見つかりませんでした
          </p>
        )}
      </main>
    </div>
  );
}
