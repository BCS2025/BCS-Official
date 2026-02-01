import { supabase } from './supabaseClient';
import { calculateKeychainPrice, calculateVariantPrice } from './pricing';

import { PRODUCTS } from '../data/products';

/**
 * Transforms a DB product row into the Frontend Product Object format
 */
function transformProduct(dbProduct) {
    if (!dbProduct) return null;

    // 1. DYNAMIC DB CONFIG (Preferred)
    if (dbProduct.config_schema && dbProduct.config_schema.length > 0) {
        // Restore functions in schema (e.g., conditions)
        const fields = dbProduct.config_schema.map(field => {
            if (field.condition_logic) {
                return {
                    ...field,
                    condition: (formData) => formData[field.condition_logic.field] === field.condition_logic.value
                };
            }
            return field;
        });

        // Determine Pricing Logic
        let calculatePrice = (config, qty) => (dbProduct.price * (qty || 0)); // Default simpl
        if (dbProduct.pricing_logic?.type === 'keychain') {
            calculatePrice = calculateKeychainPrice;
        } else if (dbProduct.pricing_logic?.type === 'variant') {
            calculatePrice = (config, qty) => calculateVariantPrice(dbProduct.price, config, qty, dbProduct.pricing_logic);
        } else if (staticConfig && staticConfig.calculatePrice) {
            calculatePrice = staticConfig.calculatePrice; // Fallback to static logic if not in DB yet
        }

        return {
            id: dbProduct.id,
            uuid: dbProduct.id,
            name: dbProduct.name,
            price: dbProduct.sale_price || dbProduct.price, // Use Sale Price if set
            isOnSale: dbProduct.is_on_sale || false,
            originalPrice: dbProduct.sale_price ? dbProduct.price : null,
            image: dbProduct.image_url || (staticConfig ? staticConfig.image : null),
            description: dbProduct.description,
            detailedDescription: dbProduct.detailed_description || (staticConfig ? staticConfig.detailedDescription : ''),
            priceDescription: dbProduct.price_description || (staticConfig ? staticConfig.priceDescription : ''),
            fields: fields,
            createdAt: dbProduct.created_at,
            sortOrder: dbProduct.sort_order,
            calculatePrice: calculatePrice
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
            createdAt: dbProduct.created_at,
            sortOrder: dbProduct.sort_order
        };
    }

    // 3. FALLBACK FOR INCOMPLETE DATA
    return {
        id: dbProduct.id,
        uuid: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.image_url,
        description: dbProduct.description,
        fields: [],
        createdAt: dbProduct.created_at,
        calculatePrice: (config, qty) => (dbProduct.price * (qty || 0))
    };
}

export async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: false }) // Primary Sort: High priority first
        .order('created_at', { ascending: false }); // Secondary Sort: Newest first

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data.map(transformProduct);
}

export async function fetchProductBySlug(slug) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', slug) // Use 'id' column instead of 'slug'
        .single();

    if (error) {
        console.error('Error fetching product by slug:', slug, error);
        return null;
    }

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
