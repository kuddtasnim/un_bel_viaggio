-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  username text unique,
  full_name text,
  avatar_url text,
  traveler_type text check (traveler_type in ('reflective', 'explorer', 'contemplative', 'adventurer')),
  travel_pace text check (travel_pace in ('slow', 'moderate', 'fast')),
  bio text
);

-- Trips table
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  destination text not null,
  country text,
  start_date date,
  end_date date,
  traveler_type text,
  summary text,
  is_public boolean default false not null
);

-- Reflections table
create table public.reflections (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  question text not null,
  answer text not null
);

-- Notes table
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete set null,
  title text,
  content text,
  image_url text,
  tags text[] default '{}',
  mood text,
  country text
);

-- Posts table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete set null,
  title text not null,
  content_ru text,
  content_en text,
  content_fr text,
  original_language text not null default 'ru',
  travel_type text,
  is_published boolean default false not null,
  cover_image_url text
);

-- Itinerary days
create table public.itinerary_days (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  day_number integer not null,
  title text,
  description text,
  locations jsonb default '[]'::jsonb
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.reflections enable row level security;
alter table public.notes enable row level security;
alter table public.posts enable row level security;
alter table public.itinerary_days enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can CRUD own trips" on public.trips for all using (auth.uid() = user_id);
create policy "Public trips visible to all" on public.trips for select using (is_public = true);

create policy "Users can CRUD own reflections" on public.reflections for all using (auth.uid() = user_id);
create policy "Users can CRUD own notes" on public.notes for all using (auth.uid() = user_id);

create policy "Users can CRUD own posts" on public.posts for all using (auth.uid() = user_id);
create policy "Published posts visible to all" on public.posts for select using (is_published = true);

create policy "Users can access own itinerary" on public.itinerary_days for all
  using (exists (select 1 from public.trips where trips.id = itinerary_days.trip_id and trips.user_id = auth.uid()));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.trips for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.notes for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.posts for each row execute procedure public.handle_updated_at();
