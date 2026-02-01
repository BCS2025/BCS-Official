-- ALIGN RECIPES WITH STANDARD FRONTEND CODES (FIXED)
-- Updates recipes to accept abbreviated frontend codes (e.g. 'round' vs 'keychain_round')

-- 1. Keychain: 'keychain_round' -> 'round', etc.
-- Using product_id 'prod_keychain_custom' directly.

update product_recipes set match_condition = '{"shape": "round"}'
where product_id = 'prod_keychain_custom' and match_condition::text like '%keychain_round%';

update product_recipes set match_condition = '{"shape": "heart"}'
where product_id = 'prod_keychain_custom' and match_condition::text like '%keychain_heart%';

update product_recipes set match_condition = '{"shape": "rect"}'
where product_id = 'prod_keychain_custom' and match_condition::text like '%keychain_rect%';

update product_recipes set match_condition = '{"shape": "shield"}'
where product_id = 'prod_keychain_custom' and match_condition::text like '%keychain_shield%';

update product_recipes set match_condition = '{"shape": "square"}'
where product_id = 'prod_keychain_custom' and match_condition::text like '%keychain_square%';


-- 2. Coaster: 'coaster_beech' -> 'beech'
update product_recipes set match_condition = '{"material": "beech"}'
where product_id = 'prod_coaster_custom' and match_condition::text like '%coaster_beech%';

update product_recipes set match_condition = '{"material": "walnut"}'
where product_id = 'prod_coaster_custom' and match_condition::text like '%coaster_walnut%';


-- 3. Night Lights: 'light_base_warm' -> 'warm'
-- Targets both Night Light products
update product_recipes set match_condition = '{"lightBase": "warm"}'
where product_id in ('prod_nightlight_custom', 'prod_nightlight_tile') 
and match_condition::text like '%light_base_warm%';

update product_recipes set match_condition = '{"lightBase": "white"}'
where product_id in ('prod_nightlight_custom', 'prod_nightlight_tile') 
and match_condition::text like '%light_base_white%';
