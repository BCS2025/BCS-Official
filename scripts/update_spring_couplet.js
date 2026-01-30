const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSpringCouplet() {
    console.log('Searching for Spring Couplet...');

    // 1. Find the product (fuzzy search)
    const { data: products, error: searchError } = await supabase
        .from('products')
        .select('*')
        .ilike('name', '%春聯%'); // Search for "春聯"

    if (searchError) {
        console.error('Search Error:', searchError);
        return;
    }

    if (!products || products.length === 0) {
        console.error('❌ Product not found!');
        return;
    }

    const product = products[0];
    console.log(`✅ Found Product: ${product.name} (Slug: ${product.slug})`);

    // 2. Define New Configuration
    // Filter out existing 'size' first to avoid duplicates
    const existingSchema = product.config_schema || [];
    const filteredSchema = existingSchema.filter(f => f.name !== 'size');

    const newConfigSchema = [
        {
            name: "size",
            label: "尺寸選購",
            type: "select",
            options: [
                { value: "9cm", label: "9cm x 9cm (標準)" },
                { value: "12cm", label: "12cm x 12cm (+NT$100)" }
            ]
        },
        ...filteredSchema
    ];

    // 3. Define Pricing Logic (Variant)
    const newPricingLogic = {
        type: "variant",
        modifiers: {
            size: {
                "12cm": 100 // Adds 100 to base. 9cm is base (0).
            }
        }
    };

    console.log(`Updating ${product.name} to Base Price 299...`);

    // 4. Update
    const { error: updateError } = await supabase
        .from('products')
        .update({
            price: 299, // Base Price for 9cm
            config_schema: newConfigSchema,
            pricing_logic: newPricingLogic
        })
        .eq('id', product.id);

    if (updateError) {
        console.error('❌ Update Failed:', updateError);
    } else {
        console.log('🎉 Update Success! Price set to 299, Logic set to Variant.');
    }
}

updateSpringCouplet();
