export interface Restaurant {
    id: string;
    restaurantName?: string;
    primaryType?: string;
    rating?: number;
    photoUrl: string;
    location?: { lat: number; lng: number };
};

export interface GooglePlacesSearchApiResponse{
    places?: PlaceSearchResult[];
};

export interface PlaceSearchResult{
    id: string,
    displayName?: {
        languageCode?: string,
        text?: string
    }
    primaryType?: string,
    rating?: number,
    userRatingCount?: number,
    photos?: PlacePhoto[],
    location?: { latitude?: number; longitude?: number },
};

export interface PlacePhoto{
    name?: string
};

export interface GooglePlacesAutocompleteApiResponse{
    suggestions?: PlaceAutocompleteResult[]
};

export interface PlaceAutocompleteResult {
    placePrediction?: {
        place?: string,
        placeId?: string,
        structuredFormat?: {
            mainText?:{
                text: string
            };
            secondaryText?:{
                text?: string,
            }
        };
    };
    queryPrediction?:{
        text?:{
            text?: string,
        }
    }
};

export interface GooglePlacesDetailsApiResponse {
    location?: { latitude?: number, longitude?: number }
    displayName?: {
        languageCode?: string;
        text?: string;
    };
    primaryType?:string;
    photos?:PlacePhoto[];
    formattedAddress?: string;
}

export interface placeDetailsAll {
        location?:{ latitude?: number, longitude?: number }
        displayName?: string;
        primaryType?: string;
        photoUrl?:string;
        formattedAddress?: string;
    }

export interface RestaurantSuggestion {
        type: string,
        placeId?: string,
        placeName: string,
    }

export interface AddressSuggestion {
        placeId: string,
        placeName: string,
        address_text: string
    }

export interface Address {
    id: number,
    name: string,
    address_text: string,
    latitude: number,
    longitude: number
}

export interface AddressResponse {
    addressList: Address[],
    selectedAddress: Address | null;
}
