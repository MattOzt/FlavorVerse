--flavorverse database setup
--tables, RLS policies and default tags

drop table if exists public.shopping_list_items cascade;
drop table if exists public.saved_recipes cascade;
drop table if exists public.comments cascade;
drop table if exists public.ratings cascade;
drop table if exists public.recipe_tags cascade;
drop table if exists public.dietary_tags cascade;
drop table if exists public.recipe_ingredients cascade;
drop table if exists public.ingredients cascade;
drop table if exists public.recipes cascade;
drop table if exists public.users cascade;

--users table links to supabase auth
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  profile_image_url text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  steps text,
  cuisine_type text,
  meal_type text,
  image_url text,
  video_url text,
  created_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  quantity text
);

create table public.dietary_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.recipe_tags (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  tag_id uuid not null references public.dietary_tags(id) on delete cascade
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  score int not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ingredient_name text not null,
  quantity text,
  checked boolean not null default false,
  recipe_id uuid references public.recipes(id) on delete set null,
  created_at timestamptz not null default now()
);

--indexes to make common queries faster
create index idx_recipes_user_id on public.recipes(user_id);
create index idx_ratings_recipe_id on public.ratings(recipe_id);
create index idx_comments_recipe_id on public.comments(recipe_id);
create index idx_saved_recipes_user_id on public.saved_recipes(user_id);
create index idx_shopping_list_items_user_id on public.shopping_list_items(user_id);
create index idx_recipe_tags_recipe_id on public.recipe_tags(recipe_id);
create index idx_recipe_tags_tag_id on public.recipe_tags(tag_id);

-- RLS enabled for al ltables 
alter table public.users enable row level security;
alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.dietary_tags enable row level security;
alter table public.recipe_tags enable row level security;
alter table public.ratings enable row level security;
alter table public.comments enable row level security;
alter table public.saved_recipes enable row level security;
alter table public.shopping_list_items enable row level security;

--user policies
create policy "users_read_all" on public.users for select using (true);
create policy "users_insert_own" on public.users for insert to authenticated with check (auth.uid() = id);
create policy "users_update_own" on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

--recipe policies
create policy "recipes_read_all" on public.recipes for select using (true);
create policy "recipes_insert_own" on public.recipes for insert to authenticated with check (auth.uid() = user_id);
create policy "recipes_update_own" on public.recipes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_delete_own" on public.recipes for delete to authenticated using (auth.uid() = user_id);

--ingredient policies
create policy "ingredients_read_all" on public.ingredients for select using (true);
create policy "ingredients_insert_authenticated" on public.ingredients for insert to authenticated with check (true);

--recipe ingredient policies
create policy "recipe_ingredients_read_all" on public.recipe_ingredients for select using (true);
create policy "recipe_ingredients_insert_recipe_author" on public.recipe_ingredients for insert to authenticated
with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

--dietary tags
create policy "dietary_tags_read_all" on public.dietary_tags for select using (true);

--recipe tags
create policy "recipe_tags_read_all" on public.recipe_tags for select using (true);
create policy "recipe_tags_insert_recipe_author" on public.recipe_tags for insert to authenticated
with check (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

--comments
create policy "comments_read_all" on public.comments for select using (true);
create policy "comments_insert_authenticated" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments for delete to authenticated using (auth.uid() = user_id);

--ratings
create policy "ratings_read_all" on public.ratings for select using (true);
create policy "ratings_insert_own" on public.ratings for insert to authenticated with check (auth.uid() = user_id);
create policy "ratings_update_own" on public.ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

--saved recipes
create policy "saved_recipes_select_own" on public.saved_recipes for select to authenticated using (auth.uid() = user_id);
create policy "saved_recipes_insert_own" on public.saved_recipes for insert to authenticated with check (auth.uid() = user_id);
create policy "saved_recipes_delete_own" on public.saved_recipes for delete to authenticated using (auth.uid() = user_id);

--shopping list
create policy "shopping_items_select_own" on public.shopping_list_items for select to authenticated using (auth.uid() = user_id);
create policy "shopping_items_insert_own" on public.shopping_list_items for insert to authenticated with check (auth.uid() = user_id);
create policy "shopping_items_update_own" on public.shopping_list_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "shopping_items_delete_own" on public.shopping_list_items for delete to authenticated using (auth.uid() = user_id);

--dietary tags
insert into public.dietary_tags (name)
values ('Halal'), ('Vegan'), ('Keto'), ('Gluten-Free')
on conflict (name) do nothing;