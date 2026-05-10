import { supabase } from './supabaseClient';
import { Truck, MapPin, Store, Mail } from 'lucide-react';

// 圖示對應：DB 存字串，前端在這層解析回 lucide component。
// 新增 icon 時要同步在 DB 種子裡填入字串、並在這裡映射。
const ICON_MAP = {
    Store,
    Truck,
    Mail,
    MapPin,
};

// DB 還沒種子或暫時讀取失敗時的後備清單（與初版 ShippingMethodSelector 寫死值一致）。
// 之所以保留：Supabase 冷啟動或網路斷線時，前台至少能渲染結帳流程。
export const FALLBACK_SHIPPING_METHODS = [
    { id: 'store',  name: '超商店到店', description: '7-11 / 全家 / 萊爾富 / OK，線上選店', icon: 'Store',  price: 60,  free_shipping_threshold: 599,  is_active: true, sort_order: 10 },
    { id: 'tcat',   name: '黑貓宅配',   description: '本島 1–2 天，常溫包裹',                icon: 'Truck',  price: 180, free_shipping_threshold: null, is_active: true, sort_order: 20 },
    { id: 'post',   name: '中華郵政',   description: '郵局包裹，本島 2–3 天',                icon: 'Mail',   price: 80,  free_shipping_threshold: null, is_active: true, sort_order: 30 },
    { id: 'pickup', name: '自取',       description: '全家永康勝華店 / 7-11 北園門市',        icon: 'MapPin', price: 0,   free_shipping_threshold: null, is_active: true, sort_order: 40 },
];

export const DEFAULT_ALLOWED_SHIPPING_METHODS = ['store', 'post', 'pickup'];

/**
 * 將 DB row 轉成前端使用格式（icon 字串 → component）
 */
function transformMethod(row) {
    return {
        ...row,
        iconComponent: ICON_MAP[row.icon] || Store,
    };
}

/**
 * 撈出全部物流（含未啟用，給後台用）
 */
export async function fetchAllShippingMethods() {
    const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(transformMethod);
}

/**
 * 撈出啟用中的物流（給前台結帳用）
 * 失敗時回傳 fallback，避免阻擋下單流程。
 */
export async function fetchActiveShippingMethods() {
    try {
        const { data, error } = await supabase
            .from('shipping_methods')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) return FALLBACK_SHIPPING_METHODS.map(transformMethod);
        return data.map(transformMethod);
    } catch (err) {
        console.error('[shippingService] fetchActiveShippingMethods failed, using fallback:', err);
        return FALLBACK_SHIPPING_METHODS.map(transformMethod);
    }
}

/**
 * 計算購物車內所有商品「允許物流」的交集。
 * - cart 為空 → 回傳所有 method id（無限制）
 * - 任一商品缺欄位 → 視為使用預設清單 DEFAULT_ALLOWED_SHIPPING_METHODS
 */
export function getAllowedShippingMethodIds(cart, products) {
    if (!Array.isArray(cart) || cart.length === 0) return null; // null = 無限制
    let intersection = null;
    for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        const list = Array.isArray(product?.allowedShippingMethods) && product.allowedShippingMethods.length > 0
            ? product.allowedShippingMethods
            : DEFAULT_ALLOWED_SHIPPING_METHODS;
        if (intersection === null) {
            intersection = new Set(list);
        } else {
            intersection = new Set(list.filter(id => intersection.has(id)));
        }
        if (intersection.size === 0) break;
    }
    return Array.from(intersection || []);
}

/**
 * 取得當前選擇物流的免運門檻（null = 此物流不適用免運活動）
 */
export function getFreeShippingThreshold(methodId, methods) {
    const m = methods.find(x => x.id === methodId);
    return m?.free_shipping_threshold ?? null;
}

/**
 * 判斷指定物流在當前消費金額下是否達到免運條件。
 * 自取（price === 0）視為「免運不適用」（因為本來就 0 元）。
 */
export function isMethodFreeShipping(method, itemsTotal) {
    if (!method) return false;
    if (method.price === 0) return false;
    if (method.free_shipping_threshold == null) return false;
    return itemsTotal >= method.free_shipping_threshold;
}
