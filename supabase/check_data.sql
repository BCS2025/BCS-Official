select id, slug, name from products;
select id, name, current_stock, safety_stock from materials;
select p.name as product, m.name as material, pr.match_condition 
from product_recipes pr
join products p on p.id = pr.product_id
join materials m on m.id = pr.material_id;
