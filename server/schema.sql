create extension if not exists "pgcrypto";

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  occasion text not null check (char_length(trim(occasion)) > 0),
  season text not null check (char_length(trim(season)) > 0),
  "imageUrl" text,
  "itemIds" uuid[] not null default '{}',
  slots jsonb,
  kind text not null default 'inspiration' check (kind in ('inspiration', 'my_outfit')),
  "createdAt" timestamptz not null default now()
);

-- Safe to run again when upgrading an existing Closet Log project.
alter table public.outfits add column if not exists "itemIds" uuid[] not null default '{}';
alter table public.outfits add column if not exists slots jsonb;
alter table public.outfits add column if not exists kind text not null default 'inspiration' check (kind in ('inspiration', 'my_outfit'));

create table if not exists public.closet_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  "imageUrl" text not null,
  "storagePath" text not null unique,
  "createdAt" timestamptz not null default now()
);

-- Images are uploaded only through the Express API. The public bucket makes
-- the returned image URLs usable in the gallery; do not store sensitive photos.
insert into storage.buckets (id, name, public)
values ('closet-images', 'closet-images', true)
on conflict (id) do update set public = true;
