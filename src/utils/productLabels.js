export const PRODUCT_LABELS = {
    // Wooden Keychain Styles
    "keychain_round": "款式 1 (圓形)",
    "keychain_heart": "款式 2 (心形)",
    "keychain_rect": "款式 3 (矩形)",
    "keychain_shield": "款式 4 (盾牌)",
    "keychain_square": "款式 5 (正方形)",

    // Wooden Keychain Sides
    "siding_single": "單面雕刻 ($99)",
    "siding_double": "雙面雕刻 ($150)",

    // Fonts
    "font_lishu": "隸書體",
    "font_kai": "楷體",
    "font_fangsong": "仿宋體",
    "font_yicai": "逸彩體",
    "font_xingcao": "行草",

    // Spring Couplets
    "spring_couplet_fu": "福氣滿滿滿 (福)",
    "spring_couplet_cai": "財源滾滾來 (財)",
    "spring_couplet_fa": "好運發發發 (發)",

    // Night Light
    "light_base_warm": "溫馨暖黃光",
    "light_base_white": "明亮白光",

    // Generic
    "single": "單面",
    "double": "雙面"
};

/**
 * Helper to get the human-readable label from a raw code.
 * Falls back to the code itself if no label is found.
 * @param {string} code The raw code value (e.g. "spring_couplet_fu")
 * @returns {string} The display label (e.g. "福氣滿滿滿 (福)")
 */
export const getLabel = (code) => {
    if (!code) return "";
    return PRODUCT_LABELS[code] || code;
};
