import { GooglePlacesDetailsApiResponse, GooglePlacesSearchApiResponse, placeDetailsAll } from "@/types";
import { transformPlaceResults } from "./utils";
import { error } from "console";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

//　近くのレストランを取得する関数
export async function fetchRestaurants(lat:number, lng:number) {

    const url = "https://places.googleapis.com/v1/places:searchNearby";

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos"
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
        next: { revalidate: 86400 },// 24 hours
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `NearbySearchリクエスト失敗：${response.status}` };
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

//　近くのラーメン店を取得する関数
export async function fetchRamenRestaurants(lat:number, lng:number) {
    const url = "https://places.googleapis.com/v1/places:searchNearby";

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos"
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
        next: { revalidate: 86400 },// 24 hours
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `NearbySearchリクエスト失敗：${response.status}` };
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
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos"
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
        next: { revalidate: 86400 },// 24 hours
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `NearbySearchリクエスト失敗：${response.status}` };
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
        "X-Goog-FieldMask":"places.id,places.displayName.text,places.primaryType,places.photos"
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
        next: { revalidate: 86400 },// 24 hours
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `TextSearch失敗：${response.status}` };
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

export async function getPhotUrl(name: string, maxWidth = 400) {
    "use cache";
    console.log("getPhotoUrl 実行");
    const apikey = process.env.GOOGLE_API_KEY;
    const url = `https://places.googleapis.com/v1/${name}/media?key=${apikey}&maxWidthPx=${maxWidth}`;
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
        next: { revalidate: 86400 },// 24 hours
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return {error: `PlaceDetailsリクエスト失敗：${response.status}` };
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
    if (fields.includes("photos")
    ) {
        results.photoUrl = data.photos?.[0]?.name ? await getPhotUrl(data.photos[0].name) : "/no_image.png";
    }

    return {data: results}

    
}

export async function fetchLocation() {
    const DEFAULT_LOCATION = {lat: 35.6642955, lng:139.6684159};

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect("/login");
    }

    //選択中の住所の緯度と経度を取得
    
    const { data: selectedAddress, error: selectedAddressError } = await supabase
    .from('profiles')
    .select(`
        addresses (
        latitude,longitude
        )
    `).eq("id", user.id).single();   

    if(selectedAddressError){
        console.error("緯度と経度の取得に失敗しました。",selectedAddressError);
        throw new Error("緯度と経度の取得に失敗しました。");
    }

    const lat = selectedAddress.addresses?.latitude ?? DEFAULT_LOCATION.lat;
    const lng = selectedAddress.addresses?.longitude ?? DEFAULT_LOCATION.lng;

    return {lat, lng};
}