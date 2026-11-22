import { useEffect, useState } from 'react';
import { getBankTransferInfo } from '../lib/paymentService';

export default function BankTransferDetails({ orderId, receipt }) {
    const [result, setResult] = useState(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        getBankTransferInfo(orderId, receipt, controller.signal)
            .then(info => { if (!controller.signal.aborted) setResult(info); })
            .catch(() => { if (!controller.signal.aborted) setResult({ failed: true }); });
        return () => controller.abort();
    }, [orderId, receipt, attempt]);
    return (
        <div className="bg-store-50 p-4 rounded-lg border border-bcs-border ml-7 space-y-1" aria-live="polite">
            <p className="font-bold text-bcs-black border-b border-bcs-border pb-1 mb-1">匯款資訊</p>
            {!result ? <p>正在讀取匯款資訊…</p> : result.failed ? <>
                <p>請重新讀取，或透過下方官方 LINE 提供訂單編號取得匯款資訊。</p>
                <button type="button" className="underline" onClick={() => { setResult(null); setAttempt(n => n + 1); }}>重新讀取</button>
            </> : <>
                <p>銀行：<strong>{result.bank}</strong></p>
                <p>銀行帳號：<strong className="font-mono">{result.account}</strong></p>
            </>}
        </div>
    );
}

