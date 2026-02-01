-- PHASE 2: ADMIN DASHBOARD SCHEMA UPDATE
-- Enables dynamic product configuration and promotion management in the DB.

-- 1. ADD COLUMNS TO PRODUCTS
alter table products 
add column if not exists config_schema jsonb default '[]'::jsonb,
add column if not exists is_on_sale boolean default false,
add column if not exists sale_price int;

-- 2. MIGRATE DATA (Move Static Config to DB)
-- We populate 'config_schema' with the JSON content from src/data/products.js

-- Keychain
update products 
set config_schema = '[
  {
    "name": "siding",
    "type": "select",
    "label": "雕刻面數",
    "options": [
      {"label": "單面雕刻 ($99)", "value": "single"},
      {"label": "雙面雕刻 ($150)", "value": "double"}
    ],
    "defaultValue": "single"
  },
  {
    "name": "shape",
    "type": "select",
    "label": "款式選擇",
    "options": [
      {"image": "/wood-keychain-thumbnails/鑰匙圈版型_圓形.png", "label": "款式 1 (圓形)", "value": "round"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈版型_心形.png", "label": "款式 2 (心形)", "value": "heart"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈版型_矩形.png", "label": "款式 3 (矩形)", "value": "rect"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈版型_盾牌形.png", "label": "款式 4 (盾牌)", "value": "shield"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈版型_正方形.png", "label": "款式 5 (正方形)", "value": "square"}
    ],
    "defaultValue": "round"
  },
  {
    "name": "font",
    "type": "select",
    "label": "字體選擇",
    "options": [
      {"image": "/wood-keychain-thumbnails/鑰匙圈字體_隸書體.png", "label": "隸書體", "value": "lishu"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈字體_楷體.png", "label": "楷體", "value": "kai"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈字體_仿宋體.png", "label": "仿宋體", "value": "fangsong"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈字體_逸彩體.png", "label": "逸彩體", "value": "yicai"},
      {"image": "/wood-keychain-thumbnails/鑰匙圈字體_行草.png", "label": "行草", "value": "xingcao"}
    ],
    "defaultValue": "lishu"
  },
  {
    "name": "textFront",
    "type": "text",
    "label": "正面文字 (10字內)",
    "required": true,
    "maxLength": 10,
    "placeholder": "請輸入正面文字"
  },
  {
    "name": "textBack",
    "type": "text",
    "label": "背面文字 (10字內)",
    "maxLength": 10,
    "placeholder": "請輸入背面文字",
    "condition_logic": {"field": "siding", "value": "double"} 
  }
]'::jsonb
where id = 'prod_keychain_custom';

-- Night Light (Custom)
update products 
set config_schema = '[
  {
    "name": "lightBase",
    "type": "select",
    "label": "燈座燈光",
    "options": [
      {"label": "溫馨暖黃光", "value": "warm"},
      {"label": "明亮白光", "value": "white"}
    ],
    "defaultValue": "warm"
  }
]'::jsonb
where id = 'prod_nightlight_custom';

-- Night Light (Tile)
update products 
set config_schema = '[
  {
    "name": "lightBase",
    "type": "select",
    "label": "燈座燈光",
    "options": [
      {"label": "溫馨暖黃光", "value": "warm"},
      {"label": "明亮白光", "value": "white"}
    ],
    "defaultValue": "warm"
  }
]'::jsonb
where id = 'prod_nightlight_tile';

-- Coaster
update products 
set config_schema = '[
  {
    "name": "material",
    "type": "select",
    "label": "材質選擇",
    "options": [
      {"label": "櫸木 (淺色)", "value": "beech"},
      {"label": "胡桃木 (深色)", "value": "walnut"}
    ],
    "defaultValue": "beech"
  }
]'::jsonb
where id = 'prod_coaster_custom';

-- 3D Couplets
update products 
set config_schema = '[
  {
    "name": "shape",
    "type": "select",
    "label": "款式選擇",
    "options": [
      {"image": "/3D_Spring_Couplets_thumbnails/image%20thumbnail_福.png", "label": "福氣滿滿滿 (福)", "value": "fu"},
      {"image": "/3D_Spring_Couplets_thumbnails/image%20thumbnail_財.png", "label": "財源滾滾來 (財)", "value": "cai"},
      {"image": "/3D_Spring_Couplets_thumbnails/image%20thumbnail_發.png", "label": "好運發發發 (發)", "value": "fa"}
    ],
    "defaultValue": "fu"
  }
]'::jsonb
where id = 'prod_couplets_3d';
