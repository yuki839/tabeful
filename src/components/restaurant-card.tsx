import { Restaurant } from "@/types";
import { Camera, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <div className="group relative">
      <Link
        href={`/restaurant/${restaurant.id}`}
        className="absolute inset-0 z-10"
      />
      <div className="bg-white p-3 pb-4 rounded-[4px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#EBEBEB] transition-all duration-300 ease-out group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 group-hover:rotate-[0.5deg]">
        <div className="aspect-[4/5] w-full overflow-hidden bg-[#F5F5F5] relative mb-3 rounded-[2px]">
          <Image
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            src={restaurant.photoUrl}
            fill
            alt="レストラン画像"
            sizes="(max-width: 1280px) 25vw, 280px"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white/90 text-[#2D2A26] flex items-center justify-center hover:bg-[#2D2A26] hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
              <Heart size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/90 text-[#2D2A26] flex items-center justify-center hover:bg-[#2D2A26] hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-100">
              <Camera size={18} />
            </button>
          </div>
        </div>
        <div className="px-1 text-center">
          <h3 className="text-sm font-bold text-[#1A1A1A] truncate tracking-wide font-sans mb-1 group-hover:text-[#8C7B6C] transition-colors">
            {restaurant.restaurantName}
          </h3>
          {restaurant.primaryType && (
            <span className="inline-block text-[10px] text-[#8C8474] font-sans uppercase tracking-wider px-2 py-0.5 bg-[#F5F5F5] rounded-sm">
              {restaurant.primaryType.replaceAll("_", " ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
