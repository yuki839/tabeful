import Link from "next/link";
import MenuSheet from "./menu-sheet";
import PlaceSearchBar from "./ui/place-search-bar";
import AddressModal from "./ui/address-modal";
import { fetchLocation } from "@/lib/restaurants/api";

const Header = async () => {
  const { lat, lng } = await fetchLocation();
  return (
    <header className="bg-background h-16 fixed top-0 left-0 w-full z-50">
      <div className="flex items-center h-full space-x-4 px-4 max-w-[1920px] mx-auto">
        <MenuSheet />
        <div className="font-bold">
          <Link href={"/"}>TABEful</Link>
        </div>
        <AddressModal />
        <div className="flex-1">
          <PlaceSearchBar lat={lat} lng={lng} />
        </div>
        <div>アルバム</div>
      </div>
    </header>
  );
};

export default Header;
