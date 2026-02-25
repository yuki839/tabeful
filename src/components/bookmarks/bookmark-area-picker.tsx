"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { v4 as uuidv4 } from "uuid";
import useSWR from "swr";
import {
  AlertCircle,
  LoaderCircle,
  MapPin,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteAddressAction,
  selectAddressAction,
  selectSuggestionAction,
} from "@/app/(private)/actions/addressActions";
import type { Address, AddressResponse, AddressSuggestion } from "@/types";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookmarkAreaPickerProps {
  value: string;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  className?: string;
  inputId?: string;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error ?? "Failed to fetch address data.");
  }
  return response.json();
};

export default function BookmarkAreaPicker({
  value,
  onChange,
  disabled,
  className,
  inputId = "bookmark-area-modal",
}: BookmarkAreaPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [selectedAddressText, setSelectedAddressText] = useState<string | null>(
    null
  );

  const { data, mutate, isLoading } = useSWR<AddressResponse>(
    "/api/address",
    fetcher
  );

  useEffect(() => {
    const nextText = data?.selectedAddress?.address_text ?? null;
    setSelectedAddressText(nextText);
    if (!value && data?.selectedAddress?.name) {
      onChange(data.selectedAddress.name);
    }
  }, [data?.selectedAddress?.address_text, data?.selectedAddress?.name, onChange, value]);

  const ensureSessionToken = () => {
    if (sessionToken) return sessionToken;
    const next = uuidv4();
    setSessionToken(next);
    return next;
  };

  const fetchSuggestions = useDebouncedCallback(async (nextInput: string) => {
    if (!nextInput.trim()) {
      setSuggestions([]);
      setIsSuggesting(false);
      setSuggestError(null);
      return;
    }

    setIsSuggesting(true);
    setSuggestError(null);
    try {
      const token = ensureSessionToken();
      const response = await fetch(
        `/api/address/autocomplete?input=${encodeURIComponent(
          nextInput
        )}&sessionToken=${token}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        setSuggestError(errorData.error ?? "候補の取得に失敗しました。");
        setSuggestions([]);
        return;
      }
      const result = (await response.json()) as AddressSuggestion[];
      setSuggestions(result);
    } catch (error) {
      console.error("Failed to fetch address suggestions.", error);
      setSuggestError("候補の取得に失敗しました。");
      setSuggestions([]);
    } finally {
      setIsSuggesting(false);
    }
  }, 400);

  useEffect(() => {
    if (!dialogOpen) return;
    fetchSuggestions(inputText);
  }, [dialogOpen, fetchSuggestions, inputText]);

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    if (disabled) return;
    try {
      const token = ensureSessionToken();
      await selectSuggestionAction(suggestion, token);
      setSessionToken(uuidv4());
      onChange(suggestion.placeName);
      setSelectedAddressText(suggestion.address_text);
      setInputText("");
      await mutate();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to select address suggestion.", error);
      window.alert("住所の登録に失敗しました。");
    }
  };

  const handleSelectAddress = async (address: Address) => {
    if (disabled) return;
    try {
      onChange(address.name);
      setSelectedAddressText(address.address_text);
      await selectAddressAction(address.id);
      await mutate();
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to select saved address.", error);
      window.alert("住所の選択に失敗しました。");
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (disabled) return;
    const ok = window.confirm("この住所を削除しますか？");
    if (!ok) return;
    try {
      await deleteAddressAction(addressId);
      await mutate();
    } catch (error) {
      console.error("Failed to delete address.", error);
      window.alert("住所の削除に失敗しました。");
    }
  };

  const emptyState = useMemo(() => {
    if (isSuggesting) {
      return (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-[var(--noir-muted)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          候補を読み込み中...
        </div>
      );
    }
    if (suggestError) {
      return (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-destructive">
          <AlertCircle className="h-4 w-4" />
          {suggestError}
        </div>
      );
    }
    return (
      <div className="py-6 text-center text-xs text-[var(--noir-muted)]">
        住所が見つかりません
      </div>
    );
  }, [isSuggesting, suggestError]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={inputId}
          className="text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]"
        >
          エリア
        </label>
      </div>

      <div className="flex gap-2">
        <input
          id={inputId}
          name="area"
          value={value}
          placeholder="例: 渋谷"
          disabled={disabled}
          readOnly
          onClick={() => setDialogOpen(true)}
          onFocus={() => setDialogOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={dialogOpen}
          className="w-full cursor-pointer border border-[var(--noir-border)] bg-white px-4 py-3 text-sm font-ui text-[var(--noir-ink)] shadow-inner focus:border-black focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        />
        {value ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onChange("");
              setSelectedAddressText(null);
            }}
            disabled={disabled}
            aria-label="エリアをクリア"
            className="flex h-12 w-12 items-center justify-center border border-[var(--noir-border)] bg-white text-[var(--noir-muted)] transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {selectedAddressText ? (
        <p className="text-xs font-ui text-[var(--noir-muted)]">
          {selectedAddressText}
        </p>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <span className="hidden" aria-hidden />
        </DialogTrigger>
        <DialogContent className="rounded-none border border-[var(--noir-border)] bg-white font-ui text-[var(--noir-ink)] shadow-[var(--noir-shadow)]">
          <DialogHeader>
            <DialogTitle>住所からエリアを選択</DialogTitle>
            <DialogDescription className="sr-only">
              住所検索と保存済み住所からエリアを選択
            </DialogDescription>
          </DialogHeader>

          <Command shouldFilter={false}>
            <div className="mb-4 border border-[var(--noir-border)]">
              <CommandInput
                value={inputText}
                onValueChange={setInputText}
                placeholder="住所を検索..."
                disabled={disabled}
              />
            </div>
            <CommandList className="max-h-[60vh]">
              {inputText ? (
                <>
                  <CommandEmpty>{emptyState}</CommandEmpty>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.placeId}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                      className="flex items-start gap-3 p-5"
                    >
                      <MapPin className="mt-1 h-4 w-4 text-[var(--noir-muted)]" />
                      <div>
                        <p className="font-ui text-sm font-semibold text-[var(--noir-ink)]">
                          {suggestion.placeName}
                        </p>
                        <p className="text-xs text-[var(--noir-muted)]">
                          {suggestion.address_text}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </>
              ) : (
                <>
                  <p className="px-1 pb-2 text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
                    保存済みの住所
                  </p>
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-[var(--noir-muted)]">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      読み込み中...
                    </div>
                  ) : data?.addressList?.length ? (
                    data.addressList.map((address) => (
                      <CommandItem
                        key={address.id}
                        onSelect={() => handleSelectAddress(address)}
                        className={cn(
                          "flex items-start justify-between gap-3 p-5",
                          address.id === data?.selectedAddress?.id &&
                            "bg-[var(--noir-surface)]"
                        )}
                      >
                        <div>
                          <p className="font-ui text-sm font-semibold text-[var(--noir-ink)]">
                            {address.name}
                          </p>
                          <p className="text-xs text-[var(--noir-muted)]">
                            {address.address_text}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleDeleteAddress(address.id);
                          }}
                          disabled={disabled}
                          className="text-[var(--noir-muted)] hover:text-black"
                          aria-label="住所を削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CommandItem>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[var(--noir-muted)]">
                      保存済みの住所がありません
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
