-- Profil pengguna dashboard. auth.users (dikelola Supabase Auth) menyimpan email + hash kata sandi;
-- public.profiles menyimpan data tampilan (nama) dan terhubung 1:1 lewat id.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 80),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Setiap pengguna hanya bisa membaca & mengubah profilnya sendiri.
create policy "own profile: select" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "own profile: update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, update (full_name) on public.profiles to authenticated;

-- Trigger: buat baris profil otomatis saat akun baru terdaftar.
-- Fungsi SECURITY DEFINER diletakkan di schema privat (tidak terekspos ke Data API).
create schema if not exists private;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 80), ''));
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
