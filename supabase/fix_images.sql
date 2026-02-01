-- FIX IMAGES
-- Update image URLs to match the frontend assets

update products 
set image_url = '/product-thumbnails/image%20thumbnail_客製化鑰匙圈.png'
where id = 'prod_keychain_custom';

update products 
set image_url = '/product-thumbnails/image%20thumbnail_客製化原木杯墊.png'
where id = 'prod_coaster_custom';

update products 
set image_url = '/product-thumbnails/image%20thumbnail_客製化小夜燈.png'
where id = 'prod_nightlight_custom';

update products 
set image_url = '/product-thumbnails/image%20thumbnail_花磚小夜燈.png'
where id = 'prod_nightlight_tile';

update products 
set image_url = '/product-thumbnails/image%20thumbnail_花磚月曆.png'
where id = 'prod_calendar_tile';

update products 
set image_url = '/product-thumbnails/image%20thumbnail_立體春聯.png'
where id = 'prod_couplets_3d';
