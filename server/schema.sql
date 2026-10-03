create extension if not exists "pgcrypto";

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  occasion text not null check (char_length(trim(occasion)) > 0),
  season text not null check (char_length(trim(season)) > 0),
  "imageUrl" text,
  "createdAt" timestamptz not null default now()
);
