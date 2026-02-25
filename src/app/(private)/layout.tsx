import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function PrivatePageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatarUrl =
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    null;

  return (
    <div className="theme-noir min-h-screen font-noir text-[var(--noir-ink)]">
      <Sidebar
        isAuthenticated={Boolean(user)}
        userAvatarUrl={avatarUrl}
        userEmail={user?.email ?? null}
      />
      <div className="min-h-screen md:pl-20">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
