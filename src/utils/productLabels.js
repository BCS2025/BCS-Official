// Single Source of Truth for Product UI Labels
// Maps English Snake_Case Codes -> Chinese Display Text

export const PRODUCT_LABELS = {
    // --- Products ---
    "prod_keychain_custom": "客製化櫸木鑰匙圈",
    "prod_coaster_custom": "客製化原木杯墊", // Updated to match likely ID
    "prod_nightlight_custom": "客製化小夜燈",
    "prod_calendar_tile": "花磚月曆",
    "prod_nightlight_tile": "花磚小夜燈",
    "prod_couplets_3d": "立體春聯",

    // --- Options: Siding (Keychain) ---
    "single": "單面雕刻",
    "double": "雙面雕刻",

    // --- Options: Shapes / Styles ---
    "round": "圓形",
    "heart": "心形",
    "rect": "矩形",
    "shield": "盾牌",
    "square": "正方形",

    "fu": "福氣滿滿滿 (福)",
    "cai": "財源滾滾來 (財)",
    "fa": "好運發發發 (發)",

    // --- Options: Materials ---
    "beech": "櫸木 (淺色)",
    "walnut": "胡桃木 (深色)",

    // --- Options: Light Base ---
    "warm": "溫馨暖黃光",
    "white": "明亮白光",

    // --- Options: Fonts ---
    "lishu": "隸書體",
    "kai": "楷體",
    "fangsong": "仿宋體",
    "yicai": "逸彩體",
    "xingcao": "行草"
};

// Helper to safely get label or fallback to code (for debug)
export const getLabel = (code) => {
    return PRODUCT_LABELS[code] || code;
};
