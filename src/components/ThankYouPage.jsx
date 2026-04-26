
import { CheckCircle, Home, FileText, Calendar, Mail, Smartphone, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../lib/pricing';
import { getBankTransferInfo, PAYMENT_METHODS } from '../lib/paymentService';

export default function ThankYouPage({ orderId, needProof, onHome, estimatedDate, totalAmount, paymentMethod, hasLateUpload = false }) {
    const isLinePay = paymentMethod === PAYMENT_METHODS.LINE_PAY;
    const bankInfo = getBankTransferInfo();

    return (
        <div className="min-h-screen bg-store-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 space-y-8 animate-in zoom-in-95 duration-300">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-bcs-black">
                        感謝您的訂購！
                    </h2>

                    {/* Email Notice */}
                    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2">
                        <Mail size={16} />
                        <span>訂單詳細資訊已發送至您的 Email</span>
                    </div>

                    {/* Information Grid */}
                    <div className="mt-4 grid grid-cols-1 gap-2 text-bcs-black bg-store-50 p-4 rounded-lg">
                        <div className="flex justify-between border-b border-bcs-border pb-2">
                            <span className="text-sm">訂單編號</span>
                            <span className="font-bold font-mono text-bcs-black">{orderId}</span>
                        </div>
                        {estimatedDate && (
                            <div className="flex justify-between border-b border-bcs-border pb-2">
                                <span className="text-sm">預計出貨/取貨</span>
                                <span className="font-bold">{estimatedDate}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b border-bcs-border pb-2">
                            <span className="text-sm">付款方式</span>
                            <span className="font-bold inline-flex items-center gap-1">
                                {isLinePay ? <><Smartphone size={14} className="text-green-600" /> LINE Pay</> : '銀行轉帳'}
                            </span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-sm font-bold text-bcs-black">應付金額</span>
                            <span className="font-bold text-xl text-red-600">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* 稍後上傳檔案 — 強提示 */}
                {hasLateUpload && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle size={22} className="text-red-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                            <p className="font-bold mb-1">您有商品選擇「稍後上傳檔案」</p>
                            <p>請務必透過下方 <span className="font-bold">官方 LINE</span> 補上客製化檔案，否則無法開始製作。</p>
                        </div>
                    </div>
                )}

                {/* Dynamic Process Content */}
                <div className="space-y-4 border-t border-b border-bcs-border py-6">
                    <h3 className="font-bold text-bcs-black flex items-center gap-2">
                        <FileText size={20} className="text-bcs-muted" />
                        下一步該怎麼做？
                    </h3>

                    {isLinePay ? (
                        <div className="space-y-3 text-sm text-bcs-black">
                            <p className="flex gap-2">
                                <span className="bg-green-100 text-green-800 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">✓</span>
                                <span>您已完成 <span className="font-bold text-green-600">LINE Pay</span> 付款，我們已收到款項。</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                                <span>
                                    {needProof === 'yes'
                                        ? '設計師將盡快製作示意圖與您確認，確認無誤即開始製作。'
                                        : '我們將立即安排製作與出貨。'}
                                </span>
                            </p>
                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                                <span>若有任何疑問，請點擊下方<span className="font-bold text-green-600">「加入官方 LINE」</span>與我們聯繫。</span>
                            </p>
                        </div>
                    ) : needProof === 'yes' ? (
                        <div className="space-y-4 text-sm text-bcs-black">
                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                                <span>由於您選擇<span className="font-bold text-bcs-black">「需要對稿」</span>，因為客製化商品需先付款才會開始設計，請先完成匯款。</span>
                            </p>

                            {/* Bank Info Block */}
                            <div className="bg-store-50 p-4 rounded-lg border border-bcs-border ml-7 space-y-1">
                                <p className="font-bold text-bcs-black border-b border-bcs-border pb-1 mb-1">匯款資訊</p>
                                <p>銀行：<span className="font-mono font-bold">{bankInfo.bank}</span></p>
                                <p>銀行帳號：<span className="font-mono font-bold">{bankInfo.account}</span></p>
                                <p>戶名：<span className="font-bold">{bankInfo.accountName}</span></p>
                            </div>

                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                                <span>請點擊下方<span className="font-bold text-green-600">「加入官方 LINE」</span>，告知「訂單編號」與「匯款後五碼」。</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
                                <span>確認款項後，設計師將製作示意圖與您確認，確認無誤即開始製作！</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 text-sm text-bcs-black">
                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                                <span>請依下方資訊完成匯款。</span>
                            </p>

                            {/* Bank Info Block */}
                            <div className="bg-store-50 p-4 rounded-lg border border-bcs-border ml-7 space-y-1">
                                <p className="font-bold text-bcs-black border-b border-bcs-border pb-1 mb-1">匯款資訊</p>
                                <p>銀行：<span className="font-mono font-bold">{bankInfo.bank}</span></p>
                                <p>銀行帳號：<span className="font-mono font-bold">{bankInfo.account}</span></p>
                                <p>戶名：<span className="font-bold">{bankInfo.accountName}</span></p>
                            </div>

                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                                <span>請點擊下方<span className="font-bold text-green-600">「加入官方 LINE」</span>，告知「訂單編號」與「匯款後五碼」。</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="bg-store-100 text-bcs-black w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
                                <span>確認款項後，我們將立即安排製作出貨！</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Call to Action: LINE */}
                <div className="text-center space-y-4">
                    <p className="text-sm font-medium text-bcs-muted">
                        請點擊下方綠色按鈕或掃描 QR Code 加入好友
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        {/* QR Code */}
                        <div className="w-32 h-32 bg-white p-2 border border-bcs-border rounded-xl shadow-sm">
                            <img
                                src={`${import.meta.env.BASE_URL}LineAddFriendsQRcode.png`}
                                alt="LINE QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Official Button */}
                        <a href="https://lin.ee/ax9WURy" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
                            <img
                                src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png"
                                alt="加入好友"
                                height="36"
                                border="0"
                                className="h-10 w-auto" // Adjusted height via CSS
                            />
                        </a>
                    </div>
                </div>

                <Button onClick={onHome} variant="outline" className="w-full">
                    <Home size={18} className="mr-2" />
                    返回首頁
                </Button>
            </div>
        </div>
    );
}
