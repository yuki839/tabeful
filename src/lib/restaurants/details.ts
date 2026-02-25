export interface PlaceDetailsReview {
  authorName?: string;
  authorPhotoUrl?: string;
  rating?: number;
  text?: string;
  publishTime?: string;
}

export interface PlaceDetailsExtended {
  displayName?: string;
  primaryType?: string;
  location?: { latitude?: number; longitude?: number };
  photoNames: string[];
  editorialSummary?: string;
  formattedAddress?: string;
  phoneNumber?: string;
  weekdayDescriptions?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  reviews?: PlaceDetailsReview[];
  takeout?: boolean;
  delivery?: boolean;
  dineIn?: boolean;
  reservable?: boolean;
  servesBeer?: boolean;
  servesWine?: boolean;
  servesBreakfast?: boolean;
  servesBrunch?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  servesVegetarianFood?: boolean;
  outdoorSeating?: boolean;
  liveMusic?: boolean;
  goodForChildren?: boolean;
  goodForGroups?: boolean;
  wheelchairAccessibleEntrance?: boolean;
}

interface GooglePlacesDetailsExtendedResponse {
  displayName?: { text?: string };
  primaryType?: string;
  location?: { latitude?: number; longitude?: number };
  photos?: Array<{ name?: string }>;
  editorialSummary?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { weekdayDescriptions?: string[] };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  takeout?: boolean;
  delivery?: boolean;
  dineIn?: boolean;
  reservable?: boolean;
  servesBeer?: boolean;
  servesWine?: boolean;
  servesBreakfast?: boolean;
  servesBrunch?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  servesVegetarianFood?: boolean;
  outdoorSeating?: boolean;
  liveMusic?: boolean;
  goodForChildren?: boolean;
  goodForGroups?: boolean;
  wheelchairAccessibleEntrance?: boolean;
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    publishTime?: string;
    authorAttribution?: { displayName?: string; photoUri?: string };
  }>;
}

export async function fetchPlaceDetailsExtended(
  placeId: string,
  sessionToken?: string
) {
  const baseFields = [
    "displayName",
    "primaryType",
    "location",
    "photos",
    "editorialSummary",
    "formattedAddress",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "regularOpeningHours",
    "currentOpeningHours",
    "rating",
    "userRatingCount",
    "priceLevel",
    "reviews",
    "reviews.rating",
    "reviews.publishTime",
    "reviews.text",
    "reviews.authorAttribution",
    "reviews.authorAttribution.displayName",
    "reviews.authorAttribution.photoUri",
  ];
  const featureFields = [
    "takeout",
    "delivery",
    "dineIn",
    "reservable",
    "servesBeer",
    "servesWine",
    "servesBreakfast",
    "servesLunch",
    "servesDinner",
    "servesVegetarianFood",
    "outdoorSeating",
  ];
  const coreFields = baseFields.filter((field) => field !== "reviews");
  const fields = [...baseFields, ...featureFields];
  const apikey = process.env.GOOGLE_API_KEY;
  const url = sessionToken
    ? `https://places.googleapis.com/v1/places/${placeId}?sessionToken=${sessionToken}&languageCode=ja`
    : `https://places.googleapis.com/v1/places/${placeId}?languageCode=ja`;

  type PlaceDetailsFetchError = {
    status: number;
    payload: unknown;
  };

  const readErrorPayload = async (response: Response) => {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const requestDetails = async (fieldMask: string[]) => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apikey!,
        "X-Goog-FieldMask": fieldMask.join(","),
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return {
        error: {
          status: response.status,
          payload: await readErrorPayload(response),
        } satisfies PlaceDetailsFetchError,
      };
    }

    const data: GooglePlacesDetailsExtendedResponse = await response.json();
    return { data };
  };

  const fieldMasks = [fields, baseFields, coreFields];
  const seenMasks = new Set<string>();
  let data: GooglePlacesDetailsExtendedResponse | undefined;
  let lastError: PlaceDetailsFetchError | undefined;

  for (const fieldMask of fieldMasks) {
    const key = fieldMask.join(",");
    if (seenMasks.has(key)) {
      continue;
    }
    seenMasks.add(key);
    const result = await requestDetails(fieldMask);
    if (result.data) {
      data = result.data;
      break;
    }
    lastError = result.error;
  }

  if (!data) {
    console.error("PlaceDetails request failed.", { error: lastError });
    const status = lastError?.status ?? "unknown";
    return { error: `PlaceDetails request failed: ${status}` };
  }

  const photoNames = (data.photos ?? [])
    .map((photo) => photo.name)
    .filter((name): name is string => Boolean(name));

  const reviews = data.reviews?.map((review) => ({
    authorName: review.authorAttribution?.displayName,
    authorPhotoUrl: review.authorAttribution?.photoUri,
    rating: review.rating,
    text: review.text?.text,
    publishTime: review.publishTime,
  }));
  const weekdayDescriptions =
    data.currentOpeningHours?.weekdayDescriptions ??
    data.regularOpeningHours?.weekdayDescriptions;

  return {
    data: {
      displayName: data.displayName?.text,
      primaryType: data.primaryType,
      location: data.location,
      photoNames,
      editorialSummary: data.editorialSummary?.text,
      formattedAddress: data.formattedAddress,
      phoneNumber: data.nationalPhoneNumber ?? data.internationalPhoneNumber,
      weekdayDescriptions,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      priceLevel: data.priceLevel,
      reviews,
      takeout: data.takeout,
      delivery: data.delivery,
      dineIn: data.dineIn,
      reservable: data.reservable,
      servesBeer: data.servesBeer,
      servesWine: data.servesWine,
      servesBreakfast: data.servesBreakfast,
      servesBrunch: data.servesBrunch,
      servesLunch: data.servesLunch,
      servesDinner: data.servesDinner,
      servesVegetarianFood: data.servesVegetarianFood,
      outdoorSeating: data.outdoorSeating,
      liveMusic: data.liveMusic,
      goodForChildren: data.goodForChildren,
      goodForGroups: data.goodForGroups,
      wheelchairAccessibleEntrance: data.wheelchairAccessibleEntrance,
    } satisfies PlaceDetailsExtended,
  };
}
