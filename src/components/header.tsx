import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import MenuSheet from "./menu-sheet";
import AddressModal from "./ui/address-modal";
import { logout } from "@/app/(auth)/login/actions";

const Header = () => {
  return (
    <header
      data-app-header
      className="sticky top-0 z-40 border-b border-[var(--noir-border)] bg-[var(--noir-surface)]/92 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 md:px-8">
        <div className="flex md:hidden">
          <MenuSheet />
        </div>
        <Link href="/" className="-ml-4 group flex items-center gap-3">
          <div className="relative h-14 w-52 overflow-hidden">
            <Image
              src="/tabeful-b.png"
              alt="TABEful"
              fill
              className="object-contain transition-transform duration-300 group-hover:-translate-y-0.5"
              priority
            />
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <AddressModal
            triggerClassName="rounded-none border border-[var(--noir-border)] bg-white px-3 py-2 text-[11px] font-ui uppercase tracking-[0.25em] text-[var(--noir-muted)] transition hover:text-black"
          />
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/bookmarks"
              className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black"
            >
              しおり
            </Link>
            <Link
              href="/album"
              className="text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] transition hover:text-black"
            >
              アルバム
            </Link>
          </nav>
          <form action={logout} className="hidden md:block">
            <button
              type="submit"
              aria-label="ログアウト"
              className="flex h-10 w-10 items-center justify-center rounded-none border border-[var(--noir-border)] bg-white text-[var(--noir-muted)] transition hover:border-black hover:text-black"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
