
import { CheckCircle, Home, FileText, CreditCard } from 'lucide-react';
import { Button } from './ui/Button';

export default function ThankYouPage({ orderId, needProof, onHome }) {
    return (
        <div className="min-h-screen bg-wood-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 space-y-8 animate-in zoom-in-95 duration-300">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-wood-900">
                        感謝您的訂購！
                    </h2>
                    <p className="text-wood-600">
                        我們已收到您的訂製需求
                    </p>
                    <div className="bg-wood-50 py-3 px-6 rounded-lg inline-block border border-wood-200">
                        <span className="text-sm text-wood-500 block mb-1">訂單編號</span>
                        <span className="text-xl font-mono font-bold text-wood-800 tracking-wider">
                            {orderId}
                        </span>
                    </div>
                </div>

                {/* Dynamic Process Content */}
                <div className="space-y-4 border-t border-b border-wood-100 py-6">
                    <h3 className="font-bold text-wood-900 flex items-center gap-2">
                        <FileText size={20} className="text-wood-500" />
                        下一步該怎麼做？
                    </h3>

                    {needProof === 'yes' ? (
                        <div className="space-y-4 text-sm text-wood-700">
                            <p className="flex gap-2">
                                <span className="bg-wood-200 text-wood-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                                <span>由於您選擇<span className="font-bold text-wood-900">「需要對稿」</span>，因為客製化商品需先付款才會開始設計，請先完成匯款。</span>
                            </p>

                            {/* Bank Info Block */}
                            <div className="bg-wood-100 p-4 rounded-lg border border-wood-200 ml-7 space-y-1">
                                <p className="font-bold text-wood-800 border-b border-wood-300 pb-1 mb-1">匯款資訊</p>
                                <p>銀行代碼：<span className="font-mono font-bold">700 (中華郵政)</span></p>
                                <p>銀行帳號：<span className="font-mono font-bold">0031421-0318644</span></p>
                                <p>戶名：<span className="font-bold">黃詣</span></p>
                            </div>

                            <p className="flex gap-2">
                                <span className="bg-wood-200 text-wood-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                                <span>加入官方 LINE，告知「訂單編號」與「匯款後五碼」。</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="bg-wood-200 text-wood-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
                                <span>確認款項後，設計師將製作示意圖與您確認，確認無誤即開始製作！</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 text-sm text-wood-700">
                            <p className="flex gap-2">
                                <span className="bg-wood-200 text-wood-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">1</span>
                                <span>您選擇<span className="font-bold text-wood-900">「直接製作」</span>，請完成匯款。</span>
                            </p>

                            {/* Bank Info Block */}
                            <div className="bg-wood-100 p-4 rounded-lg border border-wood-200 ml-7 space-y-1">
                                <p className="font-bold text-wood-800 border-b border-wood-300 pb-1 mb-1">匯款資訊</p>
                                <p>銀行代碼：<span className="font-mono font-bold">700 (中華郵政)</span></p>
                                <p>銀行帳號：<span className="font-mono font-bold">0031421-0318644</span></p>
                                <p>戶名：<span className="font-bold">黃詣</span></p>
                            </div>

                            <p className="flex gap-2">
                                <span className="bg-wood-200 text-wood-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">2</span>
                                <span>加入官方 LINE，告知「訂單編號」與「匯款後五碼」。</span>
                            </p>
                            <p className="flex gap-2">
                                <span className="bg-wood-200 text-wood-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">3</span>
                                <span>確認款項後，我們將立即安排製作出貨！</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Call to Action: LINE */}
                <div className="text-center space-y-4">
                    <p className="text-sm font-medium text-wood-600">
                        請點擊下方按鈕或掃描 QR Code 加入好友
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        {/* QR Code */}
                        <div className="w-32 h-32 bg-white p-2 border border-wood-200 rounded-xl shadow-sm">
                            <img
                                src={`${import.meta.env.BASE_URL}LineAddFriendsQRcode.png`}
                                alt="LINE QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Official Button */}
                        <a href="https://lin.ee/05XoDu4" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
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
