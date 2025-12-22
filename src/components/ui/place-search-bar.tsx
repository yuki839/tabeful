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
import { useRouter } from "next/navigation";

interface PlaceSearchBarProps {
  lat: number;
  lng: number;
}

export default function PlaceSearchBar({ lat, lng }: PlaceSearchBarProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sessionToken, setSessionToken] = useState(uuidv4());
  const [selectedValue, setSelectedValue] = useState("");
  const [pointerActive, setPointerActive] = useState(false);
  const [suggestions, setSuggestions] = useState<RestaurantSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clickedOnItem = useRef(false);
  const lastInteractionRef = useRef<"none" | "keyboard" | "pointer">("none");

  const router = useRouter();

  const fetchSuggestions = useDebouncedCallback(async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    console.log("Fetching suggestions for:", input);
    setErrorMessage(null);

    try {
      // APIを呼び出して候補を取得する処理をここに実装
      const response = await fetch(
        `/api/restaurant/autocomplete?input=${input}&sessionToken=${sessionToken}&lat=${lat}&lng=${lng}`
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
      setOpen(false);
      setSuggestions([]);
      setSelectedValue("");
      setPointerActive(false);
      lastInteractionRef.current = "none";
      return;
    }
    setIsLoading(true);
    setOpen(true);
    setSelectedValue("");
    setPointerActive(false);
    lastInteractionRef.current = "none";
    fetchSuggestions(inputText);
  }, [inputText]);

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
      router.push(
        `/restaurant/${suggestion.placeId}?sessionToken=${sessionToken}`
      );
      setSessionToken(uuidv4());
    } else {
      //検索結果ページ
      router.push(`/search?restaurant=${suggestion.placeName}`);
    }
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!inputText.trim()) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      lastInteractionRef.current = "keyboard";
    }
    if (e.key === "Enter") {
      router.push(`/search?restaurant=${inputText}`);
      setOpen(false);
    }
  };

  const handleValueChange = (value: string) => {
    if (pointerActive || lastInteractionRef.current === "keyboard") {
      setSelectedValue(value);
    }
  };

  return (
    <Command
      value={selectedValue}
      onValueChange={handleValueChange}
      onKeyDown={handleKeyDown}
      className="overflow-visible bg-muted"
      shouldFilter={false}
    >
      <CommandInput
        value={inputText}
        placeholder="Type a command or search..."
        onValueChange={setInputText}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
      {open && (
        <div
          className="relative"
          onMouseMove={() => {
            setPointerActive(true);
            lastInteractionRef.current = "pointer";
          }}
        >
          <CommandList className="absolute bg-background w-full shadow-md rounded-lg">
            <CommandEmpty>
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <LoaderCircle className=" animate-spin " />
                ) : errorMessage ? (
                  <div>
                    <AlertCircle className="flex items-center text-destructive gap-2" />
                    {errorMessage}
                  </div>
                ) : (
                  "レストランが見つかりません"
                )}
              </div>
            </CommandEmpty>
            {suggestions.map((suggestion, index) => (
              <CommandItem
                className="p-5"
                value={suggestion.placeName}
                key={suggestion.placeId ?? index}
                onSelect={() => handleSelectSuggestion(suggestion)}
                onMouseDown={() => (clickedOnItem.current = true)}
              >
                {suggestion.type === "queryPrediction" ? (
                  <Search />
                ) : (
                  <MapPin />
                )}
                <p>{suggestion.placeName}</p>
              </CommandItem>
            ))}
          </CommandList>
        </div>
      )}
    </Command>
  );
}
