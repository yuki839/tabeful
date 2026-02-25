import { AddressSuggestion, GooglePlacesAutocompleteApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
      const searchParams = request.nextUrl.searchParams
  const input = searchParams.get('input');
  const sessionToken = searchParams.get('sessionToken');

  if(!input) {
    return NextResponse.json({ error: "文字を入力してください"},{ status: 400 });
  }

  if(!sessionToken) {
    return NextResponse.json({ error: "セッショントークンは必須です"},{ status: 400 });
  }

  try{

    const url = "https://places.googleapis.com/v1/places:autocomplete"

    const apikey = process.env.GOOGLE_API_KEY;

    const Header = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
    };
    
    const requestBody = {
        // includeQueryPredictions: true,
        input: input,
        sessionToken: sessionToken,
        //includedPrimaryTypes: ["restaurant"],
        locationBias: {
            circle: {
            center: {
                latitude: 35.6642955,
                longitude: 139.6684159,
            },
            radius: 1000.0
        }
    },
    languageCode: "ja",
    //includedRegionCodes:["jp"]
    regionCode: "jp",

};

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: Header,
    })
    
    if(!response.ok){
        const errorData = await response.json();
        console.error(errorData);
        return NextResponse.json(
            {error: `Autocompleteリクエスト失敗：$${response.status}` },
            {status : 500}
        );
    }

    const data:GooglePlacesAutocompleteApiResponse = await response.json();
    console.log("data",JSON.stringify(data,null,2));

    const suggestions = data.suggestions ?? [];

    const results = suggestions.map((suggestion) => {
        return {
            placeId: suggestion.placePrediction?.placeId,
            placeName: suggestion.placePrediction?.structuredFormat?.mainText?.text,
            address_text: suggestion.placePrediction?.structuredFormat?.secondaryText?.text
        }
    }).filter((suggestion): suggestion is AddressSuggestion => 
        !!suggestion.placeId && 
        !!suggestion.placeName && 
        !!suggestion.address_text
    );

    console.log("address_suggestion", results);

    //{
        //placeId: "djgsai",
        //placeName: "渋谷駅",
        //address_text: "日本 東京 渋谷区"
    //}

    
    return NextResponse.json(results);

  } catch(error) {
    console.log(error);
    return NextResponse.json({ error: "予期せぬエラーが発生しました" }, { status: 500 });
  }

  
}
