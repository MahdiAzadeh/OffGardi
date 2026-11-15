-- OffGardi: schema + RLS + RPC
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text not null default '', phone text,
  role text not null default 'customer' check (role in ('customer','seller','admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now());

create table public.categories(
  id serial primary key, name text unique not null, icon text, sort int not null default 0);

create table public.stores(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  category text not null,
  neighborhood text not null check (neighborhood in ('امیرآباد','سعادتیه','تاج بخش','ناصریه','کوهکن')),
  address text not null check (char_length(address) between 3 and 200),
  phone text not null check (char_length(phone) between 5 and 20),
  description text check (char_length(description) <= 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected','blocked')),
  views int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now());
create unique index stores_one_per_owner on public.stores(owner_id) where owner_id is not null;

create table public.discounts(
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  emoji text not null default '🛍️' check (char_length(emoji) <= 8),
  description text check (char_length(description) <= 1000),
  category text not null,
  original_price int not null check (original_price > 0),
  discounted_price int not null check (discounted_price > 0),
  discount_percent int generated always as (round((1 - discounted_price::numeric / original_price) * 100)::int) stored,
  terms text check (char_length(terms) <= 1000),
  start_date date not null, end_date date not null,
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  uses int not null default 0,
  created_at timestamptz not null default now(),
  constraint price_ok check (discounted_price < original_price),
  constraint dates_ok check (end_date >= start_date));

create table public.favorites(
  user_id uuid not null references public.profiles(id) on delete cascade,
  discount_id uuid not null references public.discounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, discount_id));

create table public.redemptions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  discount_id uuid not null references public.discounts(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  code text unique not null,
  status text not null default 'active' check (status in ('active','used')),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now());
create index on public.redemptions(user_id);
create index on public.redemptions(store_id);
create index on public.discounts(store_id);

-- helpers
create function public.my_role() returns text language sql stable security definer set search_path=public as
$$ select role from public.profiles where id = auth.uid() $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from public.profiles where id = auth.uid() and role='admin' and not blocked) $$;
create function public.is_blocked() returns boolean language sql stable security definer set search_path=public as
$$ select coalesce((select blocked from public.profiles where id = auth.uid()), true) $$;

-- new user -> profile (admin role can never be self-assigned)
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,name,phone,role) values(
    new.id, new.email,
    coalesce(left(new.raw_user_meta_data->>'name',80),''),
    left(new.raw_user_meta_data->>'phone',20),
    case when new.raw_user_meta_data->>'role'='seller' then 'seller' else 'customer' end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- protect sensitive columns from non-admins
create function public.protect_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role; new.blocked := old.blocked; new.email := old.email;
  end if; return new; end $$;
create trigger protect_profile before update on public.profiles for each row execute function public.protect_profile();

create function public.protect_store() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and not public.is_admin() and coalesce(current_setting('app.bypass', true),'') <> '1' then
    new.status := old.status; new.owner_id := old.owner_id; new.views := old.views; new.is_demo := old.is_demo;
  end if; return new; end $$;
create trigger protect_store before update on public.stores for each row execute function public.protect_store();

create function public.protect_discount() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and not public.is_admin() and coalesce(current_setting('app.bypass', true),'') <> '1' then
    new.uses := old.uses; new.store_id := old.store_id;
  end if; return new; end $$;
create trigger protect_discount before update on public.discounts for each row execute function public.protect_discount();

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.stores enable row level security;
alter table public.discounts enable row level security;
alter table public.favorites enable row level security;
alter table public.redemptions enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy cats_select on public.categories for select to anon, authenticated using (true);
create policy cats_admin on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy stores_select on public.stores for select to anon, authenticated
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy stores_insert on public.stores for insert to authenticated
  with check (owner_id = auth.uid() and status = 'pending' and public.my_role() = 'seller' and not public.is_blocked());
create policy stores_update_own on public.stores for update to authenticated
  using (owner_id = auth.uid() and not public.is_blocked()) with check (owner_id = auth.uid());
create policy stores_admin on public.stores for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy disc_select_public on public.discounts for select to anon, authenticated
  using (is_active and exists(select 1 from public.stores s where s.id = store_id and s.status = 'approved'));
create policy disc_select_owner on public.discounts for select to authenticated
  using (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy disc_insert_owner on public.discounts for insert to authenticated
  with check (not public.is_blocked() and exists(select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid() and s.status = 'approved'));
create policy disc_update_owner on public.discounts for update to authenticated
  using (not public.is_blocked() and exists(select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy disc_delete_owner on public.discounts for delete to authenticated
  using (exists(select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
create policy disc_admin on public.discounts for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy fav_own on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy red_select on public.redemptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin()
    or exists(select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid()));
-- no insert/update/delete policies on redemptions: only RPCs below can change them

-- RPC: customer gets a one-time code (30 min)
create function public.create_redemption(p_discount uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare d public.discounts; s public.stores; r public.redemptions; c text; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'ابتدا وارد حساب شوید'; end if;
  if public.my_role() <> 'customer' then raise exception 'فقط مشتریان می‌توانند کد دریافت کنند'; end if;
  if public.is_blocked() then raise exception 'حساب شما مسدود است'; end if;
  select * into d from public.discounts where id = p_discount;
  select * into s from public.stores where id = d.store_id;
  if d.id is null or not d.is_active or s.status <> 'approved' or current_date < d.start_date or current_date > d.end_date then
    raise exception 'این تخفیف در دسترس نیست'; end if;
  if d.stock < 1 then raise exception 'موجودی تمام شده است'; end if;
  select * into r from public.redemptions where user_id = uid and discount_id = p_discount and status = 'active' and expires_at > now() limit 1;
  if r.id is null then
    loop
      c := upper(substr(md5(random()::text || clock_timestamp()::text || uid::text), 1, 6));
      exit when not exists(select 1 from public.redemptions where code = c);
    end loop;
    insert into public.redemptions(user_id, discount_id, store_id, code, expires_at)
      values (uid, p_discount, d.store_id, c, now() + interval '30 minutes') returning * into r;
  end if;
  return jsonb_build_object('code', r.code, 'expires_at', r.expires_at);
end $$;

-- RPC: seller verifies a code of his own approved store (single use)
create function public.verify_redemption(p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.redemptions; d public.discounts;
begin
  if auth.uid() is null or public.my_role() <> 'seller' or public.is_blocked() then raise exception 'دسترسی مجاز نیست'; end if;
  select * into r from public.redemptions where code = upper(trim(p_code)) for update;
  if r.id is null or not exists(select 1 from public.stores where id = r.store_id and owner_id = auth.uid() and status = 'approved') then
    raise exception 'کد نامعتبر است یا متعلق به فروشگاه دیگری است'; end if;
  if r.status = 'used' then raise exception 'این کد قبلاً استفاده شده است'; end if;
  if r.expires_at < now() then raise exception 'کد منقضی شده است'; end if;
  select * into d from public.discounts where id = r.discount_id for update;
  if d.stock < 1 then raise exception 'موجودی تمام شده است'; end if;
  perform set_config('app.bypass', '1', true);
  update public.redemptions set status = 'used', redeemed_at = now() where id = r.id;
  update public.discounts set stock = stock - 1, uses = uses + 1 where id = d.id;
  return jsonb_build_object('title', d.title);
end $$;

create function public.increment_store_view(p_store uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  perform set_config('app.bypass', '1', true);
  update public.stores set views = views + 1 where id = p_store and status = 'approved';
end $$;

revoke execute on function public.create_redemption(uuid), public.verify_redemption(text), public.increment_store_view(uuid) from public, anon;
grant execute on function public.create_redemption(uuid), public.verify_redemption(text) to authenticated;
grant execute on function public.increment_store_view(uuid) to anon, authenticated;
