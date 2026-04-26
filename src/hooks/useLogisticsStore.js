import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'bcs_cvs_store';
const URL_KEYS = ['cvs_store_id', 'cvs_store_name', 'cvs_store_address', 'cvs_store_brand', 'extra'];

function readStorage() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && parsed.cvsStoreId ? parsed : null;
    } catch {
        return null;
    }
}

function writeStorage(store) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { /* sessionStorage unavailable */ }
}

function clearStorage() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

/**
 * 處理「綠界 CVS Map 選店 callback → URL query → sessionStorage → React state」三段式同步。
 *
 * 行為：
 * - 偵測到 URL 帶 `cvs_store_id`：寫入 sessionStorage、設為 pendingStore、立刻把 query 從網址移除
 * - 沒有 URL query 時：從 sessionStorage 還原（pendingStore）
 * - 提供 `clearStore()` 讓使用者切換運送方式時清除選店記錄
 */
export function useLogisticsStore() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [pendingStore, setPendingStore] = useState(() => readStorage());
    const consumedRef = useRef(false);

    useEffect(() => {
        const cvsStoreId = searchParams.get('cvs_store_id');
        if (!cvsStoreId) return;
        const store = {
            cvsStoreId,
            cvsStoreName: searchParams.get('cvs_store_name') || '',
            cvsStoreAddress: searchParams.get('cvs_store_address') || '',
            cvsStoreBrand: searchParams.get('cvs_store_brand') || '',
        };
        writeStorage(store);
        setPendingStore(store);
        consumedRef.current = false;
        const next = new URLSearchParams(searchParams);
        URL_KEYS.forEach((k) => next.delete(k));
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    const consumePendingStore = () => {
        if (consumedRef.current) return null;
        consumedRef.current = true;
        return pendingStore;
    };

    const clearStore = () => {
        clearStorage();
        setPendingStore(null);
        consumedRef.current = true;
    };

    return { pendingStore, consumePendingStore, clearStore };
}
