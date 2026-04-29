--sample recipes for testing

insert into public.recipes (user_id, title, description, steps, cuisine_type, meal_type, image_url)
values (
  (select id from public.users limit 1),
  'Creamy Tuscan Chicken Pasta',
  'A rich pasta dish with garlic, cream, sun-dried tomatoes and spinach.',
  '1. Cook pasta until al dente
2. Sear seasoned chicken in olive oil until cooked through
3. Saute garlic and sun-dried tomatoes in same pan
4. Add heavy cream and parmesan, simmer until thick
5. Add spinach and chicken then toss with pasta
6. Finish with lemon zest and extra parmesan',
  'Italian', 'Dinner',
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1400&q=80'
),
(
  (select id from public.users limit 1),
  'Chicken Tinga Tacos',
  'Smoky shredded chicken tacos with chipotle and tomatoes.',
  '1. Poach chicken then shred it
2. Saute onions until soft
3. Blend tomatoes, garlic and chipotle peppers
4. Simmer chicken in sauce for 10 mins
5. Warm tortillas and fill with chicken
6. Top with avocado and lime',
  'Mexican', 'Lunch',
  'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1400&q=80'
),
(
  (select id from public.users limit 1),
  'Teriyaki Salmon Rice Bowl',
  'Japanese style glazed salmon with rice and vegetables.',
  '1. Mix soy sauce, mirin, honey and ginger for sauce
2. Pan sear salmon skin side down until crisp
3. Flip and glaze with teriyaki sauce
4. Steam broccoli and slice veg
5. Serve over rice with vegetables
6. Top with sesame seeds',
  'Asian', 'Dinner',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1400&q=80'
),
(
  (select id from public.users limit 1),
  'Classic Shepherds Pie',
  'Hearty British dish with minced lamb and mashed potato topping.',
  '1. Boil and mash potatoes with butter
2. Soften onions carrots and celery
3. Brown the lamb mince
4. Add tomato paste worcestershire sauce and peas
5. Top with mashed potato
6. Bake at 200C until golden',
  'British', 'Dinner',
  'https://images.unsplash.com/photo-1604908176997-4316d0f5fef1?auto=format&fit=crop&w=1400&q=80'
),
(
  (select id from public.users limit 1),
  'Mediterranean Chickpea Salad',
  'Fresh no cook salad with chickpeas, cucumber and lemon dressing.',
  '1. Rinse and drain chickpeas
2. Dice cucumber tomatoes and red onion
3. Mix olive oil lemon juice and garlic for dressing
4. Combine everything in a bowl
5. Toss with dressing
6. Rest for 10 mins then serve',
  'Mediterranean', 'Snack',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80'
);

--ingredients for the test recipes
insert into public.ingredients (name, unit) values
  ('Fettuccine Pasta', 'g'),
  ('Chicken Breast', 'g'),
  ('Heavy Cream', 'ml'),
  ('Parmesan Cheese', 'g'),
  ('Spinach', 'g'),
  ('Sun-Dried Tomatoes', 'g'),
  ('Corn Tortillas', 'pieces'),
  ('Chipotle Peppers', 'tbsp'),
  ('White Onion', 'g'),
  ('Tomatoes', 'g'),
  ('Avocado', 'pieces'),
  ('Salmon Fillet', 'g'),
  ('Soy Sauce', 'ml'),
  ('Mirin', 'ml'),
  ('Honey', 'tbsp'),
  ('Jasmine Rice', 'g'),
  ('Broccoli', 'g'),
  ('Potatoes', 'g'),
  ('Ground Lamb', 'g'),
  ('Frozen Peas', 'g'),
  ('Chickpeas', 'g'),
  ('Cucumber', 'g'),
  ('Cherry Tomatoes', 'g'),
  ('Red Onion', 'g'),
  ('Lemon Juice', 'tbsp'),
  ('Olive Oil', 'tbsp')
on conflict (name) do nothing;