-- Add visit time to bookmark items
alter table public.bookmark_items
  add column if not exists visit_time text;
