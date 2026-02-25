create table if not exists public.album_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bookmark_id uuid not null references public.bookmarks(id) on delete cascade,
  image_path text not null,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists album_posts_user_id_idx on public.album_posts (user_id);
create index if not exists album_posts_bookmark_id_idx on public.album_posts (bookmark_id);

alter table public.album_posts enable row level security;

create policy "album_posts_select_own"
  on public.album_posts
  for select
  using (auth.uid() = user_id);

create policy "album_posts_insert_own"
  on public.album_posts
  for insert
  with check (auth.uid() = user_id);

create policy "album_posts_update_own"
  on public.album_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "album_posts_delete_own"
  on public.album_posts
  for delete
  using (auth.uid() = user_id);
