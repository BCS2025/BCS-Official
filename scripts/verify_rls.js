import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// 用 ANON KEY 模擬前端訪客，驗證 orders 的 RLS 是否正確：
//   ✅ 應「可新增」訂單（公開結帳）
//   ✅ 應「不可讀取」訂單（個資保護）
// 對應 migration：supabase/migrations/20260531_orders_rls.sql
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Env vars missing（需要 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    console.log('--- Test 1：訪客新增訂單（anon insert，應成功）---');

    const dummyOrder = {
        order_id: `TEST-${Date.now()}`,
        user_info: { name: 'Test User', phone: '0900000000' },
        items: [{ product: 'Test Product', quantity: 1 }],
        total_amount: 100,
        status: 'pending',
    };

    // 注意：不加 .select()，與正式 orderService.submitOrder 一致。
    // RLS 修好後 anon 可寫不可讀，若加 .select() 取回會被 RLS 擋而誤報失敗。
    const { error } = await supabase.from('orders').insert([dummyOrder]);

    if (error) {
        console.error('❌ FAILED：anon 無法新增訂單（結帳會壞）');
        console.error('Error:', error.message);
        console.log('\n>>> 請執行 supabase/migrations/20260531_orders_rls.sql（確認有 "Public Insert Only" policy）');
        return false;
    }
    console.log('✅ PASS：訂單可新增（order_id =', dummyOrder.order_id, '）');
    console.log('   （此測試列需稍後於後台手動刪除）');
    return true;
}

async function testReadBlocked() {
    console.log('\n--- Test 2：訪客讀取訂單（anon select，應被擋）---');

    const { data, error } = await supabase.from('orders').select('order_id, user_info').limit(5);

    // 正確狀態：RLS 無 anon select policy → 回傳 0 列（或權限錯誤）。
    if (error) {
        console.log('✅ PASS：anon 讀取被 RLS 拒絕（', error.message, '）');
        return true;
    }
    if (!data || data.length === 0) {
        console.log('✅ PASS：anon 讀取回傳 0 列（個資未外洩）');
        return true;
    }
    console.error('❌ DANGER：anon 竟讀到', data.length, '筆訂單個資！RLS 未正確設定。');
    console.error('   →', JSON.stringify(data[0]));
    console.log('\n>>> 請執行 supabase/migrations/20260531_orders_rls.sql 並確認 anon 無 select 權限');
    return false;
}

async function run() {
    const insertOk = await testInsert();
    const readBlocked = await testReadBlocked();
    console.log('\n=== 結果 ===');
    console.log(insertOk && readBlocked
        ? '✅ orders RLS 設定正確：可寫、不可讀。'
        : '⚠️ orders RLS 設定有問題，請依上方提示處理。');
    process.exit(insertOk && readBlocked ? 0 : 1);
}

run();
