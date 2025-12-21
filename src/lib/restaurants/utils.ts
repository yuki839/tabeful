import { PlaceSearchResult, Restaurant } from "@/types";
import { getPhotUrl } from "./api";



export async  function transformPlaceResults(restaurants: PlaceSearchResult[]) {
    const promises = restaurants.map( async(restaurant):Promise<Restaurant> => (
        {
            id: restaurant.id,
            restaurantName: restaurant.displayName?.text,
            primaryType: restaurant.primaryType,
            // photoUrl: restaurant.photos?.[0]?.name
            // ? await getPhotUrl(restaurant.photos[0]?.name)
            // : "/no-image.png",
            photoUrl: "/no_image.png",
        }
    ));

        const data = await Promise.all(promises);
        return data;
}



// {
//     id: "1",
//     restaurantName: "レストラン名",
//     primaryType: "ramen_restaurant",
//     photoUrl: "https://abc",
// }