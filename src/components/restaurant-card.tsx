import { Restaurant } from "@/types";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const label = restaurant.primaryType?.replaceAll("_", " ");
  const tag = restaurant.primaryType
    ? `#${restaurant.primaryType.replaceAll("_", "")}`
    : null;

  return (
    <div className="group relative flex h-full flex-col">
      <Link
        href={`/restaurant/${restaurant.id}`}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-[4/3] overflow-hidden border border-[var(--noir-border)] bg-[var(--noir-surface)] shadow-[0_18px_40px_rgba(15,15,15,0.12)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_rgba(15,15,15,0.2)]">
        {restaurant.photoUrl ? (
          <Image
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            src={restaurant.photoUrl}
            fill
            alt="レストラン写真"
            sizes="(max-width: 1280px) 45vw, 320px"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
        {label ? (
          <span className="absolute bottom-3 left-3 border border-white/30 bg-black/50 px-2 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-white">
            {label}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2 px-1">
        <h3 className="truncate font-display text-base tracking-[0.08em] text-[var(--noir-ink)]">
          {restaurant.restaurantName ?? "名称未設定"}
        </h3>
        {tag ? (
          <span className="inline-block border border-[var(--noir-border)] bg-white px-2 py-1 text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)]">
            {tag}
          </span>
        ) : null}
      </div>
    </div>
  );
}
