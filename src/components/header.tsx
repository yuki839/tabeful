import Link from "next/link";
import MenuSheet from "./menu-sheet";
import PlaceSearchBar from "./ui/place-search-bar";
import AddressModal from "./ui/address-modal";
import { fetchLocation } from "@/lib/restaurants/api";

const Header = async () => {
  const { lat, lng } = await fetchLocation();
  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E5E5E5] shadow-sm">
      <div className="flex items-center h-20 gap-4 px-4 md:px-8 max-w-[1400px] mx-auto">
        <MenuSheet />
        <Link href={"/"} className="group flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2D2A26] text-white flex items-center justify-center font-serif text-xl italic font-bold rounded-sm shadow-md transition-transform duration-300 group-hover:rotate-6">
            T
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-[0.2em] uppercase text-[#1A1A1A]">
              TABEful
            </div>
            <div className="text-[10px] text-[#8C8474] tracking-widest uppercase">
              Journey & Taste
            </div>
          </div>
        </Link>
        <AddressModal />
        <div className="flex-1 hidden lg:block">
          <PlaceSearchBar lat={lat} lng={lng} />
        </div>
        <div className="ml-auto text-xs font-bold tracking-widest text-[#8C8474] hover:text-[#2D2A26] transition-colors">
          アルバム
        </div>
      </div>
    </header>
  );
};

export default Header;
