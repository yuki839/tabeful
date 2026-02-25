"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";
import { RestaurantSuggestion } from "@/types";
import { AlertCircle, LoaderCircle, MapPin, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PlaceSearchBarProps {
  lat: number;
  lng: number;
  className?: string;
  inputClassName?: string;
  listClassName?: string;
  initialQuery?: string;
}

export default function PlaceSearchBar({
  lat,
  lng,
  className,
  inputClassName,
  listClassName,
  initialQuery,
}: PlaceSearchBarProps) {
  const NO_SELECTION = "__none__";
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clickedOnItem = useRef(false);
  const suppressAutoOpenRef = useRef(false);
  const didInitFromQueryRef = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const initializedRef = useRef(false);
  const inputTextRef = useRef(inputText);
  const restaurantParam = searchParams.get("restaurant") ?? "";

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  useEffect(() => {
    const restaurant = initialQuery ?? restaurantParam;
    if (restaurant && restaurant !== inputTextRef.current) {
      suppressAutoOpenRef.current = true;
      didInitFromQueryRef.current = true;
      setInputText(restaurant);
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, [initialQuery, restaurantParam]);

  const ensureSessionToken = () => {
    if (sessionToken) return sessionToken;
    const next = uuidv4();
    setSessionToken(next);
    return next;
  };

  const fetchSuggestions = useDebouncedCallback(async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    console.log("Fetching suggestions for:", input);
    setErrorMessage(null);

    try {
      // APIを呼び出して候補を取得する処理をここに実装
      const token = ensureSessionToken();
      const response = await fetch(
        `/api/restaurant/autocomplete?input=${input}&sessionToken=${token}&lat=${lat}&lng=${lng}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error);
        return;
      }

      const data: RestaurantSuggestion[] = await response.json();
      console.log("suggestion_data", data);
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setErrorMessage("予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    if (!inputText.trim()) {
      if (didInitFromQueryRef.current && searchParams.get("restaurant")) {
        didInitFromQueryRef.current = false;
        return;
      }
      setOpen(false);
      setSuggestions([]);
      setIsLoading(false);
      if (searchParams.get("restaurant")) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("restaurant");
        const query = params.toString();
        router.replace(query ? `/search?${query}` : "/search");
      }
      return;
    }
    if (suppressAutoOpenRef.current) {
      suppressAutoOpenRef.current = false;
      setOpen(false);
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setOpen(true);
    fetchSuggestions(inputText);
  }, [fetchSuggestions, inputText, router, searchParams]);

  const handleBlur = () => {
    if (clickedOnItem.current) {
      clickedOnItem.current = false;
      return;
    }
    setOpen(false);
  };

  const handleFocus = () => {
    if (inputText) {
      setOpen(true);
    }
  };

  const handleSelectSuggestion = (suggestion: RestaurantSuggestion) => {
    console.log("suggestion", suggestion);

    if (suggestion.type === "placePrediction") {
      const token = ensureSessionToken();
      router.push(`/restaurant/${suggestion.placeId}?sessionToken=${token}`);
      setSessionToken(uuidv4());
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("restaurant", suggestion.placeName);
      const query = params.toString();
      router.push(query ? `/search?${query}` : "/search");
    }
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!inputText.trim()) return;
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const params = new URLSearchParams(searchParams.toString());
      if (inputText.trim()) {
        params.set("restaurant", inputText);
      } else {
        params.delete("restaurant");
      }
      const query = params.toString();
      router.push(query ? `/search?${query}` : "/search");
      setOpen(false);
    }
  };

  return (
    <Command
      id="quick-search"
      value={NO_SELECTION}
      onValueChange={() => {}}
      onKeyDown={handleKeyDown}
      className={cn(
        "overflow-visible rounded-none border border-[var(--noir-border)] bg-white/95 px-4 py-2 shadow-[0_18px_45px_rgba(15,15,15,0.12)] focus-within:border-black focus-within:ring-1 focus-within:ring-black",
        className
      )}
      shouldFilter={false}
    >
      <CommandInput
        value={inputText}
        placeholder="お店を検索..."
        onValueChange={setInputText}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn(
          "text-sm font-ui placeholder:text-[var(--noir-muted)]",
          inputClassName
        )}
      />
      {open && (
        <div className="relative">
          <CommandList
            className={cn(
              "absolute z-50 mt-2 w-full border border-[var(--noir-border)] bg-white shadow-[0_18px_40px_rgba(15,15,15,0.16)]",
              listClassName
            )}
          >
            <CommandEmpty>
              <div className="flex items-center justify-center text-sm font-ui text-[var(--noir-muted)]">
                {isLoading ? (
                  <LoaderCircle className="animate-spin" />
                ) : errorMessage ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle />
                    {errorMessage}
                  </div>
                ) : (
                  "レストランが見つかりません"
                )}
              </div>
            </CommandEmpty>
            {suggestions.map((suggestion, index) => (
              <CommandItem
                className="rounded-none px-4 py-3 text-sm font-ui text-[var(--noir-ink)] data-[selected=true]:bg-transparent data-[selected=true]:text-[var(--noir-ink)]"
                value={suggestion.placeName}
                key={suggestion.placeId ?? index}
                onSelect={() => handleSelectSuggestion(suggestion)}
                onMouseDown={() => (clickedOnItem.current = true)}
              >
                {suggestion.type === "queryPrediction" ? (
                  <Search className="text-[#B0AAA0]" />
                ) : (
                  <MapPin className="text-[#B0AAA0]" />
                )}
                <p className="truncate">{suggestion.placeName}</p>
              </CommandItem>
            ))}
          </CommandList>
        </div>
      )}
    </Command>
  );
}
