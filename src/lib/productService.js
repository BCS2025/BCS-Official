import { supabase } from './supabaseClient';
import { calculateKeychainPrice, calculateVariantPrice } from './pricing';

/**
 * Transforms a DB product row into the Frontend Product Object format
 */
function transformProduct(dbProduct) {
    if (!dbProduct) return null;

    // Restore calculatePrice function based on logic type
    let calculatePrice = (config, qty) => (dbProduct.price * (qty || 0)); // Default simple

    if (dbProduct.pricing_logic?.type === 'keychain') {
        calculatePrice = calculateKeychainPrice;
    } else if (dbProduct.pricing_logic?.type === 'variant') {
        calculatePrice = (config, qty) => calculateVariantPrice(dbProduct.price, config, qty, dbProduct.pricing_logic);
    }

    // Transform fields to restore functions (e.g. condition)
    const fields = (dbProduct.config_schema || []).map(field => {
        if (field.condition_logic) {
            return {
                ...field,
                condition: (formData) => formData[field.condition_logic.field] === field.condition_logic.value
            };
        }
        return field;
    });

    return {
        id: dbProduct.slug,      // Frontend uses slug as ID
        uuid: dbProduct.id,      // Keep real UUID
        name: dbProduct.name,
        price: dbProduct.price,
        image: dbProduct.image_url,
        description: dbProduct.description,
        detailedDescription: dbProduct.detailed_description,
        priceDescription: dbProduct.price_description,
        fields: fields,
        createdAt: dbProduct.created_at,
        calculatePrice: calculatePrice
    };
}

export async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

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
        .eq('slug', slug)
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
