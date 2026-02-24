import React from 'react';

export default function AboutUs() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-wood-100">
                <h1 className="text-3xl md:text-4xl font-bold text-wood-900 mb-6 text-center">關於比創</h1>

                <div className="prose max-w-none text-wood-700 space-y-6">
                    <p className="text-lg leading-relaxed">
                        比創空間 (BCS) 致力於將創意轉化為實體，透過精密的製造工藝與客製化服務，為每位創作者、設計師與企業提供最優質的解決方案。我們專注於數位製造技術，打破傳統生產的限制。
                    </p>

                    <h2 className="text-2xl font-bold text-wood-800 mt-8 mb-4 border-b pb-2">我們的理念</h2>
                    <p className="leading-relaxed">
                        我們相信，每個人都能成為創造者。"Make it Real" 不僅是我們的口號，更是我們日復一日的實踐。透過數位製造技術，我們降低了生產的門檻，讓好的設計得以被完美實現。
                    </p>

                    <h2 className="text-2xl font-bold text-wood-800 mt-8 mb-4 border-b pb-2">核心服務</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>客製化商品製造：</strong> 從生活小物到商業禮贈品，提供少量多樣的全面客製化。</li>
                        <li><strong>雷射切割與雕刻：</strong> 支援木板、壓克力、皮革等多種常見材質的精密佈局加工。</li>
                        <li><strong>3D 列印與機構原型：</strong> 提供多樣線材的 FDM 3D 列印選項，協助工程師快速打樣驗證。</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-wood-800 mt-8 mb-4 border-b pb-2">聯絡我們</h2>
                    <p className="leading-relaxed">
                        若有任何專案需求或專業的模具技術諮詢，歡迎透過首頁的 "鍛造工坊" 多階段表單提出詢價評估，或是透過官方 LINE 與我們的工程專員聯繫。
                    </p>
                </div>
            </div>
        </div>
    );
}
