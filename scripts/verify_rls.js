import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use ANON KEY to simulate Frontend User
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Env vars missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSubmission() {
    console.log('--- Testing Order Submission (Anon Role) ---');

    const dummyOrder = {
        order_id: `TEST-${Date.now()}`,
        user_info: { name: 'Test User', phone: '0900000000' },
        items: [{ product: 'Test Product', quantity: 1 }],
        total_amount: 100,
        status: 'pending'
    };

    const { data, error } = await supabase
        .from('orders')
        .insert([dummyOrder])
        .select();

    if (error) {
        console.error('❌ FAILED: RLS Blocking Insert');
        console.error('Error Details:', error.message);
        console.log('\n>>> ACTION REQUIRED: Please run "supabase/force_fix_rls.sql" in your Supabase Dashboard SQL Editor.');
    } else {
        console.log('✅ SUCCESS: Order submitted!');
        console.log('RLS Policy is correctly configured.');

        // Cleanup (Optional, using Service Key if available, but for now we just want to know if insert works)
        console.log('Inserted ID:', data[0].id);
    }
}

testSubmission();
