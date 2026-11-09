-- Schéma minimal pour la connexion (à exécuter dans Supabase : SQL Editor → New query).
-- Chaque compte (auth.users) a un profil applicatif : nom affiché et rôle (mj / joueur).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'joueur' check (role in ('mj', 'joueur')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Tout membre connecté voit les profils (noms des joueurs affichés par le MJ).
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

-- Chacun peut modifier son nom, mais pas son rôle (le rôle se change depuis le tableau de bord).
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- Profil créé automatiquement à l'inscription ("display_name" lu dans les métadonnées, sinon l'e-mail).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pour donner le rôle de MJ à un compte :
-- update public.profiles set role = 'mj' where id = '<uuid de l''utilisateur>';
