export interface Restaurant {
    id: string;
    restaurantName?: string;
    primaryType?: string;
    photoUrl: string;
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
    photos?: PlacePhoto[],
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
        };
    };
    queryPrediction?:{
        text?:{
            text?: string,
        }
    }
};

export interface RestaurantSuggestion {
        type: string,
        placeId?: string,
        placeName: string,
    }