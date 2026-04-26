-- FlavorVerse sample data: 5 recipes with ingredients + dietary tags
-- Uses the first user in public.users as author for all recipes.
-- Run AFTER schema.sql.

with first_user as (
  select id
  from public.users
  order by created_at asc
  limit 1
),
inserted_recipes as (
  insert into public.recipes (user_id, title, description, steps, cuisine_type, meal_type, image_url, video_url)
  select
    fu.id,
    r.title,
    r.description,
    r.steps,
    r.cuisine_type,
    r.meal_type,
    r.image_url,
    r.video_url
  from first_user fu
  cross join (
    values
      (
        'Creamy Tuscan Chicken Pasta',
        'A rich Italian-inspired pasta with garlic, cream, sun-dried tomatoes, and spinach. Perfect for a cozy dinner.',
        '1. Bring a large pot of salted water to a boil and cook fettuccine until al dente.
2. Season chicken with salt, pepper, and Italian herbs, then sear in olive oil until golden and cooked through.
3. In the same pan, saute garlic and chopped sun-dried tomatoes for 1 minute.
4. Stir in heavy cream and parmesan; simmer until slightly thickened.
5. Add spinach and cooked chicken, then toss in drained pasta.
6. Finish with lemon zest and extra parmesan before serving.',
        'Italian',
        'Dinner',
        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1400&q=80',
        null
      ),
      (
        'Chicken Tinga Tacos',
        'Smoky and slightly spicy shredded chicken tacos simmered with tomatoes, chipotle, and onions.',
        '1. Poach chicken breasts in salted water until cooked, then shred.
2. Saute sliced onions in oil until soft and lightly caramelized.
3. Blend tomatoes, garlic, chipotle peppers, and a splash of stock.
4. Pour sauce into pan, simmer, then fold in shredded chicken for 10 minutes.
5. Warm corn tortillas and fill with chicken tinga.
6. Top with avocado, cilantro, and lime wedges.',
        'Mexican',
        'Lunch',
        'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1400&q=80',
        null
      ),
      (
        'Teriyaki Salmon Rice Bowl',
        'A balanced Japanese-style bowl with glazed salmon, steamed rice, and crisp vegetables.',
        '1. Whisk soy sauce, mirin, honey, ginger, and garlic to make teriyaki sauce.
2. Pan-sear salmon fillets skin-side down until crisp; flip and cook through.
3. Pour sauce into pan and glaze salmon for 1 to 2 minutes.
4. Steam broccoli and slice cucumber and carrots thinly.
5. Assemble bowls with rice, vegetables, and salmon.
6. Garnish with sesame seeds and spring onions.',
        'Asian',
        'Dinner',
        'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1400&q=80',
        null
      ),
      (
        'Classic Shepherd''s Pie',
        'A hearty British comfort dish layered with savory minced lamb and buttery mashed potatoes.',
        '1. Boil peeled potatoes until tender, then mash with butter and milk.
2. Saute onions, carrots, and celery until softened.
3. Add minced lamb and cook until browned.
4. Stir in tomato paste, Worcestershire sauce, thyme, and peas, then simmer.
5. Transfer filling to a baking dish and spread mashed potato on top.
6. Bake at 200C until golden and bubbling.',
        'British',
        'Dinner',
        'https://images.unsplash.com/photo-1604908176997-4316d0f5fef1?auto=format&fit=crop&w=1400&q=80',
        null
      ),
      (
        'Mediterranean Chickpea Salad',
        'A fresh no-cook salad with chickpeas, cucumber, tomatoes, herbs, and lemon-olive oil dressing.',
        '1. Rinse chickpeas and drain well.
2. Dice cucumber, cherry tomatoes, and red onion.
3. Whisk olive oil, lemon juice, garlic, salt, and pepper.
4. Combine vegetables, chickpeas, chopped parsley, and mint in a bowl.
5. Toss with dressing and rest for 10 minutes.
6. Serve chilled, topped with toasted seeds if desired.',
        'Mediterranean',
        'Snack',
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80',
        null
      )
  ) as r(title, description, steps, cuisine_type, meal_type, image_url, video_url)
  returning id, title
)
select count(*) as recipes_inserted
from inserted_recipes;

insert into public.ingredients (name, unit) values
  ('Fettuccine Pasta', 'g'),
  ('Chicken Breast', 'g'),
  ('Heavy Cream', 'ml'),
  ('Parmesan Cheese', 'g'),
  ('Spinach', 'g'),
  ('Sun-Dried Tomatoes', 'g'),
  ('Corn Tortillas', 'pieces'),
  ('Chipotle Peppers in Adobo', 'tbsp'),
  ('White Onion', 'g'),
  ('Tomatoes', 'g'),
  ('Avocado', 'pieces'),
  ('Salmon Fillet', 'g'),
  ('Soy Sauce', 'ml'),
  ('Mirin', 'ml'),
  ('Honey', 'tbsp'),
  ('Jasmine Rice', 'g'),
  ('Broccoli', 'g'),
  ('Carrot', 'g'),
  ('Potatoes', 'g'),
  ('Ground Lamb', 'g'),
  ('Carrots', 'g'),
  ('Frozen Peas', 'g'),
  ('Worcestershire Sauce', 'tbsp'),
  ('Chickpeas', 'g'),
  ('Cucumber', 'g'),
  ('Cherry Tomatoes', 'g'),
  ('Red Onion', 'g'),
  ('Lemon Juice', 'tbsp'),
  ('Olive Oil', 'tbsp'),
  ('Fresh Parsley', 'g')
on conflict (name) do update set unit = excluded.unit;

with recipe_lookup as (
  select id, title
  from public.recipes
  where title in (
    'Creamy Tuscan Chicken Pasta',
    'Chicken Tinga Tacos',
    'Teriyaki Salmon Rice Bowl',
    'Classic Shepherd''s Pie',
    'Mediterranean Chickpea Salad'
  )
),
ingredient_lookup as (
  select id, name
  from public.ingredients
)
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity)
select rl.id, il.id, x.quantity
from (
  values
    ('Creamy Tuscan Chicken Pasta', 'Fettuccine Pasta', '320'),
    ('Creamy Tuscan Chicken Pasta', 'Chicken Breast', '450'),
    ('Creamy Tuscan Chicken Pasta', 'Heavy Cream', '240'),
    ('Creamy Tuscan Chicken Pasta', 'Parmesan Cheese', '80'),
    ('Creamy Tuscan Chicken Pasta', 'Spinach', '120'),
    ('Creamy Tuscan Chicken Pasta', 'Sun-Dried Tomatoes', '60'),

    ('Chicken Tinga Tacos', 'Chicken Breast', '500'),
    ('Chicken Tinga Tacos', 'Corn Tortillas', '8'),
    ('Chicken Tinga Tacos', 'Chipotle Peppers in Adobo', '2'),
    ('Chicken Tinga Tacos', 'White Onion', '180'),
    ('Chicken Tinga Tacos', 'Tomatoes', '300'),
    ('Chicken Tinga Tacos', 'Avocado', '1'),

    ('Teriyaki Salmon Rice Bowl', 'Salmon Fillet', '500'),
    ('Teriyaki Salmon Rice Bowl', 'Soy Sauce', '80'),
    ('Teriyaki Salmon Rice Bowl', 'Mirin', '60'),
    ('Teriyaki Salmon Rice Bowl', 'Honey', '1'),
    ('Teriyaki Salmon Rice Bowl', 'Jasmine Rice', '300'),
    ('Teriyaki Salmon Rice Bowl', 'Broccoli', '200'),
    ('Teriyaki Salmon Rice Bowl', 'Carrot', '120'),

    ('Classic Shepherd''s Pie', 'Potatoes', '900'),
    ('Classic Shepherd''s Pie', 'Ground Lamb', '600'),
    ('Classic Shepherd''s Pie', 'White Onion', '180'),
    ('Classic Shepherd''s Pie', 'Carrots', '200'),
    ('Classic Shepherd''s Pie', 'Frozen Peas', '150'),
    ('Classic Shepherd''s Pie', 'Worcestershire Sauce', '1'),

    ('Mediterranean Chickpea Salad', 'Chickpeas', '400'),
    ('Mediterranean Chickpea Salad', 'Cucumber', '200'),
    ('Mediterranean Chickpea Salad', 'Cherry Tomatoes', '250'),
    ('Mediterranean Chickpea Salad', 'Red Onion', '80'),
    ('Mediterranean Chickpea Salad', 'Lemon Juice', '2'),
    ('Mediterranean Chickpea Salad', 'Olive Oil', '3'),
    ('Mediterranean Chickpea Salad', 'Fresh Parsley', '30')
) as x(recipe_title, ingredient_name, quantity)
join recipe_lookup rl on rl.title = x.recipe_title
join ingredient_lookup il on il.name = x.ingredient_name;

with recipe_lookup as (
  select id, title
  from public.recipes
  where title in (
    'Creamy Tuscan Chicken Pasta',
    'Chicken Tinga Tacos',
    'Teriyaki Salmon Rice Bowl',
    'Classic Shepherd''s Pie',
    'Mediterranean Chickpea Salad'
  )
),
tag_lookup as (
  select id, name
  from public.dietary_tags
)
insert into public.recipe_tags (recipe_id, tag_id)
select rl.id, tl.id
from (
  values
    ('Creamy Tuscan Chicken Pasta', 'Halal'),
    ('Chicken Tinga Tacos', 'Halal'),
    ('Teriyaki Salmon Rice Bowl', 'Gluten-Free'),
    ('Classic Shepherd''s Pie', 'Gluten-Free'),
    ('Mediterranean Chickpea Salad', 'Vegan'),
    ('Mediterranean Chickpea Salad', 'Gluten-Free')
) as rt(recipe_title, tag_name)
join recipe_lookup rl on rl.title = rt.recipe_title
join tag_lookup tl on tl.name = rt.tag_name;
