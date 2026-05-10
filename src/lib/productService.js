import { supabase } from './supabaseClient';
import { calculateKeychainPrice, calculateVariantPrice } from './pricing';
import { DEFAULT_ALLOWED_SHIPPING_METHODS } from './shippingService';

// TODO: Legacy fallback — 當 Supabase 內所有商品的 config_schema 與 pricing_logic 均已填妥後，
// 可移除此 import 及 transformProduct 中的 staticConfig 相關邏輯，並刪除 src/data/products.js。
import { PRODUCTS } from '../data/products';

function pickAllowedShippingMethods(dbProduct) {
    const raw = dbProduct?.allowed_shipping_methods;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return DEFAULT_ALLOWED_SHIPPING_METHODS;
}

/**
 * Transforms a DB product row into the Frontend Product Object format
 */
function transformProduct(dbProduct) {
    if (!dbProduct) return null;

    // FIND STATIC CONFIG (Single Source of Truth for UI Config - or fallback now)
    const staticConfig = PRODUCTS.find(p => p.id === dbProduct.id);

    // 1. DYNAMIC DB CONFIG (Preferred)
    if (dbProduct.config_schema && dbProduct.config_schema.length > 0) {
        // ... (schema restoration) ...
        const fields = dbProduct.config_schema.map(field => {
            if (field.condition_logic) {
                return {
                    ...field,
                    condition: (formData) => formData[field.condition_logic.field] === field.condition_logic.value
                };
            }
            return field;
        });

        const safeBasePrice = parseInt(dbProduct.sale_price || dbProduct.price || 0, 10);

        // Determine Pricing Logic
        let calculatePrice = (config, qty) => (safeBasePrice * (qty || 0)); // Default simple
        if (dbProduct.pricing_logic?.type === 'keychain') {
            calculatePrice = calculateKeychainPrice;
        } else if (dbProduct.pricing_logic?.type === 'variant') {
            // Ensure we pass the safe numeric base price
            calculatePrice = (config, qty) => calculateVariantPrice(safeBasePrice, config, qty, dbProduct.pricing_logic);
        } else if (staticConfig && staticConfig.calculatePrice) {
            calculatePrice = staticConfig.calculatePrice; // Fallback to static logic if not in DB yet
        }

        return {
            id: dbProduct.id,
            uuid: dbProduct.id,
            name: dbProduct.name,
            price: safeBasePrice,
            isOnSale: dbProduct.is_on_sale || false,
            originalPrice: dbProduct.sale_price ? parseInt(dbProduct.price || 0, 10) : null,
            // ... (rest of object) ...
            images: (dbProduct.images && dbProduct.images.length > 0)
                ? dbProduct.images
                : (dbProduct.image_url ? [dbProduct.image_url] : (staticConfig?.images || [])),
            image: dbProduct.image_url || (staticConfig ? staticConfig.image : null),
            slogan: dbProduct.slogan || '',
            description: dbProduct.description || '',
            detailedDescription: dbProduct.detailed_description || (staticConfig ? staticConfig.detailedDescription : ''),
            priceDescription: dbProduct.price_description || (staticConfig ? staticConfig.priceDescription : ''),
            fields: fields,
            category: dbProduct.category || 'creative',
            createdAt: dbProduct.created_at,
            sortOrder: dbProduct.sort_order,
            calculatePrice: calculatePrice,
            needsProof: dbProduct.needs_proof === true,
            requiresFileUpload: dbProduct.requires_file_upload === true,
            allowedShippingMethods: pickAllowedShippingMethods(dbProduct)
        };
    }

    // 2. STATIC CONFIG MERGE (Legacy / Fallback)
    // If static config exists, MERGE DB data on top of it
    if (staticConfig) {
        return {
            ...staticConfig,
            price: dbProduct.sale_price || dbProduct.price, // Use Sale Price if set
            isOnSale: dbProduct.is_on_sale || false,
            originalPrice: dbProduct.sale_price ? dbProduct.price : null,
            name: dbProduct.name,
            uuid: dbProduct.id,
            category: dbProduct.category || 'creative',
            createdAt: dbProduct.created_at,
            sortOrder: dbProduct.sort_order,
            needsProof: dbProduct.needs_proof === true,
            requiresFileUpload: dbProduct.requires_file_upload === true,
            allowedShippingMethods: pickAllowedShippingMethods(dbProduct)
        };
    }

    // 3. FALLBACK FOR INCOMPLETE DATA
    const safeBasePrice = parseInt(dbProduct.sale_price || dbProduct.price || 0, 10);
    return {
        id: dbProduct.id,
        uuid: dbProduct.id,
        name: dbProduct.name,
        price: safeBasePrice,
        isOnSale: dbProduct.is_on_sale || false,
        originalPrice: dbProduct.sale_price ? parseInt(dbProduct.price || 0, 10) : null,
        image: dbProduct.image_url,
        images: dbProduct.images || (dbProduct.image_url ? [dbProduct.image_url] : []),
        slogan: dbProduct.slogan || '',
        description: dbProduct.description,
        detailedDescription: dbProduct.detailed_description || '',
        priceDescription: dbProduct.price_description || '',
        category: dbProduct.category || 'creative',
        fields: [],
        createdAt: dbProduct.created_at,
        sortOrder: dbProduct.sort_order,
        calculatePrice: (config, qty) => (safeBasePrice * (qty || 0)),
        needsProof: dbProduct.needs_proof === true,
        requiresFileUpload: dbProduct.requires_file_upload === true,
        allowedShippingMethods: pickAllowedShippingMethods(dbProduct)
    };
}

// Supabase 免費方案閒置後會 auto-pause，首次請求可能需要 spin-up。
// 提供 timeout 避免無限等待、retry 吸收冷啟動與偶發網路抖動。
const FETCH_TIMEOUT_MS = 8000;
const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_BASE_MS = 800;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runWithRetry(label, run) {
    let lastError;
    for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const { data, error } = await run(controller.signal);
            clearTimeout(timeoutId);
            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err;
            if (attempt < FETCH_MAX_ATTEMPTS) {
                const delay = FETCH_RETRY_BASE_MS * attempt;
                console.warn(`[${label}] attempt ${attempt} failed, retrying in ${delay}ms`, err?.message || err);
                await sleep(delay);
            }
        }
    }
    console.error(`[${label}] all ${FETCH_MAX_ATTEMPTS} attempts failed`, lastError);
    return { data: null, error: lastError };
}

export async function fetchProducts() {
    const { data, error } = await runWithRetry('fetchProducts', (signal) =>
        supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: false }) // Primary Sort: High priority first
            .order('created_at', { ascending: false }) // Secondary Sort: Newest first
            .abortSignal(signal)
    );

    if (error || !data) return [];
    return data.map(transformProduct);
}

export async function fetchProductBySlug(slug) {
    const { data, error } = await runWithRetry('fetchProductBySlug', (signal) =>
        supabase
            .from('products')
            .select('*')
            .eq('id', slug) // Use 'id' column instead of 'slug'
            .abortSignal(signal)
            .single()
    );

    if (error || !data) return null;
    return transformProduct(data);
}

// Helper to replace the old getProductLabel
export function getProductLabel(products, productId, fieldName, value) {
    const product = products.find(p => p.id === productId);
    if (!product) return value;

    const field = product.fields?.find(f => f.name === fieldName);
    const option = field?.options?.find(o => o.value === value);
    return option ? option.label : value;
}
