import { GooglePlacesDetailsApiResponse, GooglePlacesSearchApiResponse, placeDetailsAll } from "@/types";
import { transformPlaceResults } from "./utils";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const DEFAULT_NEARBY_TYPES = ["restaurant", "cafe", "bar"];

//　近くのレストランを取得する関数
export async function fetchRestaurants(lat:number, lng:number) {

    const url = "https://places.googleapis.com/v1/places:searchNearby";

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos,places.location,places.rating,places.userRatingCount"
    };

    const desiredTypes = [
    "japanese_restaurant",
    "cafe",
    "cafeteria",
    "coffee_shop",
    "chinese_restaurant",
    "fast_food_restaurant",
    "hamburger_restaurant",
    "french_restaurant",
    "italian_restaurant",
    "pizza_restaurant",
    "ramen_restaurant",
    "sushi_restaurant",
    "korean_restaurant",
    "indian_restaurant",
  ];

  //以下のURLから実際のtypeを確認可能。
  //https://developers.google.com/maps/documentation/places/web-service/place-types?hl=ja&_gl=1*45jf39*_up*MQ..*_ga*MTgxMzkwODI2LjE3NDMzMTU4NDQ.*_ga_NRWSTWS78N*MTc0MzMxNTg0NC4xLjEuMTc0MzMxNTg0NC4wLjAuMA..#:~:text=accounting%0Aatm%0Abank-,%E3%83%95%E3%83%BC%E3%83%89%E3%80%81%E3%83%89%E3%83%AA%E3%83%B3%E3%82%AF,-acai_shop
    
    const requestBody = {
        includedTypes: desiredTypes,
        maxResultCount: 10,
        locationRestriction: {
            circle: {
            center: {
                latitude: lat,
                longitude: lng,
            },
            radius: 500.0
        }
    },
    languageCode: "ja",

};

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: Header,
        next: { revalidate: 86400 },// 24時間
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `NearbySearchリクエスト失敗：$${response.status}` };
    }

    const data:GooglePlacesSearchApiResponse = await response.json();
    console.log(data);

        if(!data.places) {
        return { data: [] };
    }

    const nearbyPlaces = data.places;

    const matchingPlaces = nearbyPlaces.filter((place) =>
        place.primaryType && desiredTypes.includes(place.primaryType)
    );
    console.log("Matching Places:", matchingPlaces);

    const Restaurants = await transformPlaceResults(matchingPlaces);
    console.log("Restaurants", Restaurants);

    return { data: Restaurants };
}

export async function fetchNearbyRestaurants(
    lat: number,
    lng: number,
    options?: { radius?: number; types?: string[]; maxResultCount?: number }
) {
    const url = "https://places.googleapis.com/v1/places:searchNearby";
    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos,places.location,places.rating,places.userRatingCount"
    };

    const radius = options?.radius ?? 1200;
    const desiredTypes = options?.types && options.types.length > 0 ? options.types : DEFAULT_NEARBY_TYPES;

    const requestBody = {
        includedTypes: desiredTypes,
        maxResultCount: options?.maxResultCount ?? 20,
        locationRestriction: {
            circle: {
            center: {
                latitude: lat,
                longitude: lng,
            },
            radius: radius
        }
    },
    languageCode: "ja",

};

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: Header,
        next: { revalidate: 86400 },// 24時間
    })

    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `NearbySearch failed: ${response.status}` };
    }

    const data:GooglePlacesSearchApiResponse = await response.json();

    if(!data.places) {
        return { data: [] };
    }

    const nearbyPlaces = data.places;

    const restaurants = await transformPlaceResults(nearbyPlaces);

    return { data: restaurants };
}


//　近くのラーメン店を取得する関数
export async function fetchRamenRestaurants(lat:number, lng:number) {
    const url = "https://places.googleapis.com/v1/places:searchNearby";

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos,places.location,places.rating,places.userRatingCount"
    };
    
    const requestBody = {
        includedPrimaryTypes: ["ramen_restaurant"],
        maxResultCount: 10,
        locationRestriction: {
            circle: {
            center: {
                latitude: lat,
                longitude: lng,
            },
            radius: 1000.0
        }
    },
    languageCode: "ja",

};

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: Header,
        next: { revalidate: 86400 },// 24時間
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `NearbySearchリクエスト失敗：$${response.status}` };
    }

    const data:GooglePlacesSearchApiResponse = await response.json();
    console.log(data);

        if(!data.places) {
        return { data: [] };
    }

    const nearbyRamenPlaces = data.places;

    const RamenRestaurants = await transformPlaceResults(nearbyRamenPlaces);
    console.log(RamenRestaurants);

    return { data: RamenRestaurants };
}

//　カテゴリ検索機能
export async function fetchCategoryRestaurants(category: string,lat:number, lng:number) {
    const url = "https://places.googleapis.com/v1/places:searchNearby";

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos,places.location,places.rating,places.userRatingCount"
    };
    
    const requestBody = {
        includedPrimaryTypes: [category],
        maxResultCount: 10,
        locationRestriction: {
            circle: {
            center: {
                latitude: lat,
                longitude: lng,
            },
            radius: 1000.0
        }
    },
    languageCode: "ja",

};

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: Header,
        next: { revalidate: 86400 },// 24時間
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `NearbySearchリクエスト失敗：$${response.status}` };
    }

    const data:GooglePlacesSearchApiResponse = await response.json();
    console.log(data);

        if(!data.places) {
        return { data: [] };
    }

    const categoryPlaces = data.places;

    const categoryRestaurants = await transformPlaceResults(categoryPlaces);
    console.log(categoryRestaurants);

    return { data: categoryRestaurants };
}

//　キーワード検索機能
export async function fetchCRestaurantsByKeyword(query: string,lat:number, lng:number) {
    const url = "https://places.googleapis.com/v1/places:searchText";

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos,places.location,places.rating,places.userRatingCount"
    };
    
    const requestBody = {
        textQuery: query,
        pageSize: 10,
        locationBias: {
            circle: {
            center: {
                latitude: lat,
                longitude: lng,
            },
            radius: 1000.0
        }
    },
    languageCode: "ja",
    rankPreference: "DISTANCE"

};

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: Header,
        next: { revalidate: 86400 },// 24時間
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `TextSearch失敗：$${response.status}` };
    }

    const data:GooglePlacesSearchApiResponse = await response.json();
    //console.log(data);

        if(!data.places) {
        return { data: [] };
    }

    const TextSearchPlaces = data.places;

    const restaurants = await transformPlaceResults(TextSearchPlaces);
    //console.log(restaurants);

    return { data: restaurants };
}

const photoUrlCache = new Map<string, string>();

export async function getPhotUrl(name: string, maxWidth = 400) {
    const cacheKey = `${name}:${maxWidth}`;
    const cachedUrl = photoUrlCache.get(cacheKey);
    if (cachedUrl) {
        return cachedUrl;
    }
    const apikey = process.env.GOOGLE_API_KEY;
    const url = `https://places.googleapis.com/v1/${name}/media?key=${apikey}&maxWidthPx=${maxWidth}`;
    photoUrlCache.set(cacheKey, url);
    return url;
}

export async function getPlaceDetails(
    placeId:string,
    fields:string[],
    sessionToken?:string) {

    console.log("fields",fields)

    const fieldsParam = fields.join(",")

    let url:string;
    
    if (sessionToken) {
        url = `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}&languageCode=ja`
    } else {
        url = `https://places.googleapis.com/v1/places/${placeId}?languageCode=ja` 
    };

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask": fieldsParam,
    };
    
    const response = await fetch(url, {
        method: 'GET',
        headers: Header,
        next: { revalidate: 86400 },// 24時間
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `PlaceDetailsリクエスト失敗：$${response.status}` };
    }

    const data:GooglePlacesDetailsApiResponse = await response.json();
    console.log("placeDetailsData",data);

    const results:placeDetailsAll = {}

    if (fields.includes("location") && data.location) {
        results.location = data.location
    }

    if (fields.includes("displayName") && data.displayName?.text) {
        results.displayName = data.displayName.text;
    }
    if (fields.includes("primaryType") && data.primaryType) {
        results.primaryType = data.primaryType;
    }
    if (fields.includes("formattedAddress") && data.formattedAddress) {
        results.formattedAddress = data.formattedAddress;
    }
    if (fields.includes("photos")
    ) {
        results.photoUrl = data.photos?.[0]?.name ? await getPhotUrl(data.photos[0].name) : "/no_image.png";
    }

    return {data: results}

    
}

export async function fetchLocation(options?: { allowAnonymous?: boolean }) {
    const DEFAULT_LOCATION = {lat: 35.6642955, lng:139.6684159};

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        if (options?.allowAnonymous) {
            return DEFAULT_LOCATION;
        }
        redirect("/login");
    }

    //選択中の住所の緯度と経度を取得
    
    const { data: selectedAddress, error: selectedAddressError } = await supabase
    .from('profiles')
    .select("selected_address_id")
    .eq("id", user.id)
    .maybeSingle();

    if(selectedAddressError){
        return DEFAULT_LOCATION;
    }

    const selectedAddressId = selectedAddress?.selected_address_id;
    if (!selectedAddressId) {
        return DEFAULT_LOCATION;
    }

    const { data: addressData, error: addressError } = await supabase
    .from("addresses")
    .select("latitude,longitude")
    .eq("id", selectedAddressId)
    .eq("user_id", user.id)
    .maybeSingle();

    if (addressError || !addressData) {
        return DEFAULT_LOCATION;
    }

    return {lat: addressData.latitude, lng: addressData.longitude};
}





