-- ENFORCE POSITIVE STOCK
-- This constraint prevents race conditions. 
-- If two users try to buy the last item, the database will reject the second transaction.

alter table materials 
add constraint check_positive_stock 
check (current_stock >= 0);
