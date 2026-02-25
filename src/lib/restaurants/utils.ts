import { PlaceSearchResult, Restaurant } from "@/types";
import { getPhotUrl } from "./api";

const PLACEHOLDER_PHOTO_URL = "/no_image.png";
// false ・ trueで管理
const ENABLE_PLACE_PHOTOS = true;

export async function resolvePhotoUrl(photoName?: string) {
    if (!photoName || !ENABLE_PLACE_PHOTOS) {
        return PLACEHOLDER_PHOTO_URL;
    }

    return getPhotUrl(photoName);
}

export async function resolvePhotoUrls(
    photoNames: Array<string | undefined>,
    count: number
) {
    const limitedNames = photoNames.filter(Boolean).slice(0, count) as string[];
    const urls = await Promise.all(limitedNames.map((name) => resolvePhotoUrl(name)));

    while (urls.length < count) {
        urls.push(PLACEHOLDER_PHOTO_URL);
    }

    return urls;
}

export async function transformPlaceResults(restaurants: PlaceSearchResult[]) {
    const promises = restaurants.map(async (restaurant): Promise<Restaurant> => {
        const photoUrl = await resolvePhotoUrl(restaurant.photos?.[0]?.name);
        const latitude = restaurant.location?.latitude;
        const longitude = restaurant.location?.longitude;
        const location =
            latitude != null && longitude != null
                ? { lat: latitude, lng: longitude }
                : undefined;

        return {
            id: restaurant.id,
            restaurantName: restaurant.displayName?.text,
            primaryType: restaurant.primaryType,
            rating: restaurant.rating,
            photoUrl: photoUrl,
            location,
        };
    });

    const data = await Promise.all(promises);
    return data;
}



// {
//     id: "1",
//     restaurantName: "レストラン名",
//     primaryType: "ramen_restaurant",
//     photoUrl: "https://abc",
// }
