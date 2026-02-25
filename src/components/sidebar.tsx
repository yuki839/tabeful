"use client";

import Link from "next/link";
import { Bookmark, Home, Image, Search, UploadCloud } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/bookmarks", label: "しおり", icon: Bookmark },
  { href: "/bookmarks/import", label: "取り込み", icon: UploadCloud },
  { href: "/album", label: "アルバム", icon: Image },
  { href: "/search", label: "検索", icon: Search },
];

interface SidebarProps {
  isAuthenticated?: boolean;
  userAvatarUrl?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({
  isAuthenticated = false,
  userAvatarUrl = null,
  userEmail = null,
}: SidebarProps) {
  const pathname = usePathname();
  const avatarInitial =
    userEmail?.trim().charAt(0).toUpperCase() ?? "U";

  return (
    <aside className="hidden fixed left-0 top-0 z-30 h-screen w-20 flex-col items-center overflow-y-auto border-r border-[var(--noir-border)] bg-[var(--noir-surface)]/95 py-6 backdrop-blur md:flex">
      <nav className="mt-10 flex flex-1 flex-col items-center gap-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center border transition-all",
                isActive
                  ? "border-[var(--noir-border)] bg-white text-black shadow-sm"
                  : "border-transparent text-[var(--noir-muted)] hover:border-[var(--noir-border)] hover:bg-white"
              )}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 flex flex-col items-center gap-2 pb-2">
        {isAuthenticated ? (
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--noir-border)] bg-white text-[11px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] shadow-sm">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt="ユーザーアバター"
                className="h-full w-full object-cover"
              />
            ) : (
              avatarInitial
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--noir-border)] bg-white text-[10px] font-ui uppercase tracking-[0.3em] text-[var(--noir-muted)] shadow-sm transition hover:border-black hover:text-black"
            aria-label="Sign in"
          >
            IN
          </Link>
        )}
      </div>
    </aside>
  );
}
