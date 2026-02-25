"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";
import { Address, AddressResponse, AddressSuggestion } from "@/types";
import { AlertCircle, LoaderCircle, MapPin, Trash2 } from "lucide-react";
import {
  deleteAddressAction,
  selectAddressAction,
  selectSuggestionAction,
} from "@/app/(private)/actions/addressActions";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useRouter } from "next/navigation";

interface AddressModalProps {
  triggerClassName?: string;
}

export default function AddressModal({ triggerClassName }: AddressModalProps) {
  const [inputText, setInputText] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
        `/api/address/autocomplete?input=${input}&sessionToken=${token}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.error);
        return;
      }

      const data: AddressSuggestion[] = await response.json();
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
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    fetchSuggestions(inputText);
  }, [inputText, fetchSuggestions]);

  const fetcher = async (url: string) => {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        return { addressList: [], selectedAddress: null };
      }
      const errorData = await response.json();
      throw new Error(errorData.error);
    }

    const data = await response.json();
    return data;
  };

  const {
    data,
    error,
    isLoading: loading,
    mutate,
  } = useSWR<AddressResponse>(`/api/address`, fetcher);
  console.log("swr_data", data);
  if (error) {
    console.error(error);
    return <div>{error.message}</div>;
  }
  if (loading) return <div>loading...</div>;

  //serverActions呼び出し
  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    console.log(suggestion);

    try {
      const token = ensureSessionToken();
      await selectSuggestionAction(suggestion, token);
      setSessionToken(uuidv4());

      setInputText("");
      mutate();

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("予期せぬエラーが発生しました。");
    }
  };

  const handleSelectAddress = async (address: Address) => {
    //console.log("address", address);
    try {
      mutate(
        (current) =>
          current ? { ...current, selectedAddress: address } : current,
        { revalidate: false }
      );
      await selectAddressAction(address.id);
      await mutate();
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.log(error);
      alert("予期せぬエラーが発生しました。");
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    console.log("address", addressId);
    const ok = window.confirm("この住所を削除しますか？");
    if (!ok) return;
    try {
      const selectedAddressId = data?.selectedAddress?.id;
      await deleteAddressAction(addressId);
      mutate();

      if (selectedAddressId === addressId) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("予期せぬエラーが発生しました。");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "inline-flex items-center text-sm font-ui text-[var(--noir-muted)] transition hover:text-black",
          triggerClassName
        )}
      >
        {data?.selectedAddress ? data.selectedAddress.name : "住所を選択"}
      </DialogTrigger>
      <DialogContent className="rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
        <DialogHeader>
          <DialogTitle>住所</DialogTitle>
          <DialogDescription className="sr-only">
            住所登録と選択
          </DialogDescription>
        </DialogHeader>

        <Command shouldFilter={false}>
          <div className="bg-muted mb-4">
            <CommandInput
              value={inputText}
              onValueChange={setInputText}
              placeholder="Type a command or search..."
            />
          </div>
          <CommandList>
            {inputText ? (
              //サジェスチョンの表示
              <>
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
                      "住所が見つかりません"
                    )}
                  </div>
                </CommandEmpty>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    onSelect={() => handleSelectSuggestion(suggestion)}
                    className="p-5"
                    key={suggestion.placeId}
                  >
                    <MapPin />
                    <div>
                      <p className="font-bold">{suggestion.placeName}</p>
                      <p className="text-muted-foreground">
                        {suggestion.address_text}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </>
            ) : (
              //登録済み住所
              <>
                <h3 className="font-bold text-lg mb-2">保存済みの住所</h3>
                {data?.addressList.map((address) => (
                  <CommandItem
                    onSelect={() => handleSelectAddress(address)}
                    key={address.id}
                    className={cn(
                      "p-5 justify-between items-center",
                      address.id === data?.selectedAddress?.id && "bg-muted"
                    )}
                  >
                    <div>
                      <p className="font-bold">{address.name}</p>
                      <p>{address.address_text}</p>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAddress(address.id);
                      }}
                      size={"icon"}
                      variant={"ghost"}
                    >
                      <Trash2 />
                    </Button>
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
