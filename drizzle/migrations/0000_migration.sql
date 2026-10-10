create type public.app_role as enum ('staff', 'admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- First account to sign up becomes staff
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role) values (new.id, 'staff');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.menu_items (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  price numeric(10,2) not null,
  veg boolean not null default true,
  spicy boolean not null default false,
  available boolean not null default true,
  sort int not null default 0
);
grant select on public.menu_items to anon, authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "Menu is public" on public.menu_items for select to anon, authenticated using (true);
create policy "Staff manage menu" on public.menu_items for update to authenticated using (public.has_role(auth.uid(),'staff'));

insert into public.menu_items (id,name,category,description,price,veg,spicy,sort) values
('ember-sandwich','Smoked Club Sandwich','Plates','Sourdough, smoked chicken, aged cheddar, chipotle aioli.',320,false,true,1),
('montadito','Montadito Trio','Plates','Toasted mini breads with tomato, manchego and roasted pepper.',280,true,false,2),
('wood-pizza','Wood-Fired Margherita','Plates','San Marzano tomato, fior di latte, basil, ember-blistered crust.',450,true,false,3),
('momos','Ember Momos','Plates','Steamed dumplings, spiced vegetables, smoky tomato chutney.',260,true,true,4),
('truffle-pasta','Truffle Cream Pasta','Plates','Fresh tagliatelle, wild mushroom, parmesan, truffle oil.',420,true,false,5),
('cappuccino','Cappuccino','Coffee','Double espresso, velvet microfoam, cocoa dust.',180,true,false,6),
('latte','Caramel Latte','Coffee','Espresso, steamed milk, house burnt caramel.',200,true,false,7);

create type public.order_status as enum ('received','accepted','cooking','ready','served');
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_number int not null check (table_number between 1 and 200),
  items jsonb not null,
  note text check (char_length(note) <= 300),
  total numeric(10,2) not null default 0,
  status order_status not null default 'received',
  created_at timestamptz not null default now()
);
grant select, insert on public.orders to anon, authenticated;
grant update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Anyone can place orders" on public.orders for insert to anon, authenticated with check (status = 'received');
create policy "Anyone can track orders" on public.orders for select to anon, authenticated using (true);
create policy "Staff update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'staff'));

-- Server-side price calculation (ignores client totals)
create or replace function public.compute_order_total()
returns trigger language plpgsql security definer set search_path = public
as $$
declare t numeric := 0; it jsonb; p numeric; q int;
begin
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 or jsonb_array_length(new.items) > 50 then
    raise exception 'Invalid items';
  end if;
  for it in select * from jsonb_array_elements(new.items) loop
    select price into p from public.menu_items where id = it->>'id' and available;
    if p is null then raise exception 'Unknown item'; end if;
    q := coalesce((it->>'qty')::int, 0);
    if q < 1 or q > 20 then raise exception 'Invalid quantity'; end if;
    t := t + p * q;
  end loop;
  new.total := round(t * 1.05, 2);
  return new;
end $$;
create trigger orders_total before insert on public.orders for each row execute function public.compute_order_total();

alter publication supabase_realtime add table public.orders;