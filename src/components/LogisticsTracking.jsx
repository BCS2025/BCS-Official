import { useEffect, useRef, useState, useCallback } from 'react';
import { Truck, Package, Store, MapPin, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

const POLL_INTERVAL_MS = 30_000;

// 三種物流的時間軸定義（簡化為 4 個關鍵節點）
const TIMELINES = {
    cvs: [
        { key: 'created',  label: '訂單建立',     icon: Package },
        { key: 'shipped',  label: '已寄件',       icon: Truck },
        { key: 'arrived',  label: '已到取件門市', icon: Store },
        { key: 'received', label: '已取貨',       icon: MapPin },
    ],
    tcat: [
        { key: 'created',  label: '訂單建立', icon: Package },
        { key: 'shipped',  label: '已取件',   icon: Truck },
        { key: 'inTransit',label: '配送中',   icon: Truck },
        { key: 'received', label: '已送達',   icon: MapPin },
    ],
    post: [
        { key: 'created',  label: '訂單建立', icon: Package },
        { key: 'shipped',  label: '已交寄',   icon: Truck },
        { key: 'inTransit',label: '投遞中',   icon: Truck },
        { key: 'received', label: '已投遞',   icon: MapPin },
    ],
};

const C2C_BRANDS = new Set(['UNIMARTC2C', 'FAMIC2C', 'HILIFEC2C', 'OKMARTC2C']);

function familyOf(subType) {
    if (!subType) return null;
    if (C2C_BRANDS.has(subType)) return 'cvs';
    if (subType === 'TCAT') return 'tcat';
    if (subType === 'POST') return 'post';
    return null;
}

// 對應綠界 RtnCode → 時間軸節點 index（取最大可達值）
function statusToStep(family, code) {
    const c = String(code || '');
    if (!c) return 0;
    if (family === 'cvs') {
        if (c === '300' || c === '2030') return 0;
        if (c === '310' || c === '311') return 1;
        if (c === '2063' || c === '325' || c === '2067') return 2; // 到店待取
        if (c === '320' || c === '322') return 3; // 已取貨
        return 0;
    }
    if (family === 'tcat') {
        if (c === '300') return 0;
        if (c === '901' || c === '902') return 1;
        if (c === '906' || c === '907') return 2;
        if (c === '908' || c === '5008') return 3;
        return 0;
    }
    if (family === 'post') {
        if (c === '300') return 0;
        if (c === '30001') return 1;
        if (c === '30002') return 2;
        if (c === '30003') return 3;
        return 0;
    }
    return 0;
}

function trackingUrl(brand, shipmentNo, paymentNo) {
    if (brand === 'UNIMARTC2C') return 'https://eservice.7-11.com.tw/E-Tracking/search.aspx';
    if (brand === 'FAMIC2C')    return 'https://family.map.com.tw/famiport/';
    if (brand === 'HILIFEC2C')  return 'https://www.hilife.com.tw/serviceInfo_search.aspx';
    if (brand === 'OKMARTC2C')  return 'https://www.okmart.com.tw/convenient_shopping/Coupon';
    if (brand === 'TCAT')       return 'https://www.t-cat.com.tw/Inquire/Trace.aspx';
    if (brand === 'POST')       return 'https://trackings.post.gov.tw/?id=' + encodeURIComponent(shipmentNo || '');
    return null;
}

function brandLabel(subType) {
    return ({
        UNIMARTC2C: '7-11 賣貨便',
        FAMIC2C: '全家店到店',
        HILIFEC2C: '萊爾富店到店',
        OKMARTC2C: 'OK 超商店到店',
        TCAT: '黑貓宅急便',
        POST: '中華郵政',
    })[subType] || subType || '';
}

export default function LogisticsTracking({ orderId }) {
    const [state, setState] = useState({ loading: true, order: null, hasOrder: false, error: null });
    const timerRef = useRef(null);

    const fetchStatus = useCallback(async (refresh) => {
        try {
            const url = `/api/logistics/query-status?orderId=${encodeURIComponent(orderId)}${refresh ? '&refresh=true' : ''}`;
            const res = await fetch(url);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `查詢失敗 (${res.status})`);
            setState({ loading: false, order: json.order || null, hasOrder: !!json.hasLogisticsOrder, error: null });
        } catch (err) {
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    }, [orderId]);

    useEffect(() => {
        if (!orderId) return;
        fetchStatus(false);
        timerRef.current = setInterval(() => fetchStatus(true), POLL_INTERVAL_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [orderId, fetchStatus]);

    if (state.loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-bcs-muted py-3">
                <Loader2 size={16} className="animate-spin" />
                查詢物流狀態…
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                    無法查詢物流狀態：{state.error}
                    <button
                        type="button"
                        onClick={() => fetchStatus(true)}
                        className="ml-2 underline hover:text-amber-900"
                    >
                        重試
                    </button>
                </div>
            </div>
        );
    }

    const order = state.order || {};
    const subType = order.logistics_sub_type;
    const family = familyOf(subType);

    if (!state.hasOrder) {
        return (
            <div className="text-sm text-bcs-muted bg-store-50 border border-bcs-border rounded-md p-3">
                <Package size={16} className="inline mr-1.5 -mt-0.5" />
                物流單尚未建立——完成付款後將自動建立綠界託運單。
            </div>
        );
    }

    if (!family) {
        // 自取或無對應 subType，僅顯示基本資訊
        return (
            <div className="text-sm text-bcs-muted bg-store-50 border border-bcs-border rounded-md p-3">
                此訂單無需綠界物流追蹤（自取或其他配送方式）。
            </div>
        );
    }

    const steps = TIMELINES[family];
    const currentStep = statusToStep(family, order.logistics_status);
    const link = trackingUrl(subType, order.shipment_no, order.payment_no);

    return (
        <div className="space-y-4">
            <div className="text-sm text-bcs-black bg-store-50 border border-bcs-border rounded-md p-3 space-y-1">
                <div className="font-bold">{brandLabel(subType)}</div>
                <div className="text-xs text-bcs-muted">
                    託運編號：<span className="font-mono">{order.shipment_no || order.logistics_id || '—'}</span>
                </div>
                {family === 'cvs' && order.payment_no && (
                    <div className="text-xs text-bcs-muted">
                        繳款代碼：<span className="font-mono">{order.payment_no}</span>
                    </div>
                )}
                {family === 'cvs' && order.cvs_store_name && (
                    <div className="text-xs text-bcs-muted">
                        取件門市：{order.cvs_store_name}
                        {order.cvs_store_address ? `（${order.cvs_store_address}）` : ''}
                    </div>
                )}
                {order.logistics_message && (
                    <div className="text-xs text-bcs-muted">
                        最新狀態：{order.logistics_message}
                        {order.logistics_status_at && (
                            <span className="ml-2 opacity-70">
                                {new Date(order.logistics_status_at).toLocaleString('zh-TW')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Timeline */}
            <ol className="grid grid-cols-4 gap-2">
                {steps.map((step, i) => {
                    const Icon = step.icon;
                    const reached = i <= currentStep;
                    return (
                        <li key={step.key} className="flex flex-col items-center text-center">
                            <div className={`
                                w-9 h-9 flex items-center justify-center rounded-full border-2
                                ${reached
                                    ? 'bg-store-500 text-white border-store-500'
                                    : 'bg-white text-bcs-muted border-bcs-border'}
                            `}>
                                <Icon size={16} />
                            </div>
                            <div className={`text-xs mt-1.5 ${reached ? 'text-bcs-black font-medium' : 'text-bcs-muted'}`}>
                                {step.label}
                            </div>
                        </li>
                    );
                })}
            </ol>

            {link && (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-store-500 hover:text-store-700 underline"
                >
                    <ExternalLink size={12} />
                    前往 {brandLabel(subType)} 官方查詢
                </a>
            )}

            <div className="text-[11px] text-bcs-muted">
                狀態每 30 秒自動更新。
            </div>
        </div>
    );
}
