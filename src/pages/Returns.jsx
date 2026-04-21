import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Truck, CreditCard, AlertTriangle, MessageCircle, Mail } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Returns() {
    usePageMeta('退換貨政策', '比創空間退換貨政策——7 日猶豫期說明、退貨條件、客製化商品例外、退換貨申請流程與退款時程。');

    return (
        <div className="min-h-screen bg-white text-bcs-black font-sans pb-24">

            {/* Hero */}
            <section className="w-full bg-bcs-gray border-b border-bcs-border">
                <div className="max-w-4xl mx-auto px-6 py-16 lg:py-20">
                    <div className="inline-block px-4 py-1.5 bg-white text-bcs-muted rounded-full text-xs font-semibold tracking-widest uppercase border border-bcs-border mb-6">
                        Return &amp; Exchange Policy
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">退換貨政策</h1>
                    <p className="text-bcs-muted leading-relaxed">
                        為保障您的消費權益，比創空間依《消費者保護法》及相關法規制定以下退換貨規範。請於申請退換貨前詳閱本政策。
                    </p>
                    <p className="text-xs text-bcs-muted mt-4">
                        最後更新日期：2026-04-21
                    </p>
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-6 py-12 lg:py-16 space-y-14">

                {/* 一、猶豫期 */}
                <Block title="一、7 日猶豫期（鑑賞期）" icon={<Clock className="text-store-500" size={28} strokeWidth={1.8} />}>
                    <p>依《消費者保護法》第 19 條規定，您自商品收到次日起享有 <strong>7 日猶豫期</strong>，於此期間內得以原包裝、未使用之狀態退回商品，無需說明理由，亦無須負擔任何費用（本站負擔退貨運費）。</p>
                    <p className="text-sm bg-store-50 border border-store-100 text-store-700 rounded-lg p-4">
                        <strong>注意：</strong>「猶豫期」是「鑑賞期」而非「試用期」。商品如經拆封使用、安裝、毀損、遺失配件或有汙漏痕跡，將影響退貨成立或扣除折損金額。
                    </p>
                </Block>

                {/* 二、不適用 7 日猶豫期的商品 */}
                <Block title="二、不適用 7 日猶豫期之商品" icon={<AlertTriangle className="text-red-500" size={28} strokeWidth={1.8} />}>
                    <p>依《消費者保護法》第 19 條之 1 及施行細則第 17 條，下列商品 <strong>不適用</strong> 7 日猶豫期，訂單一經成立即 <strong>不接受無故退換</strong>：</p>
                    <ul>
                        <li><strong>客製化商品</strong>：依您指定之姓名、文字、尺寸、圖樣、材質所製作之商品（例如客製雷雕姓名、客製壓克力燈、個人化 3D 列印作品）。</li>
                        <li><strong>鍛造工坊代工品項</strong>：雷射切割、雷射雕刻、3D 列印代工服務，皆屬客製化給付。</li>
                        <li><strong>易於腐敗之食品、飲品、有時效性之生鮮品</strong>（本站目前不販售，但為完整性列出）。</li>
                        <li><strong>報紙、期刊、雜誌</strong>。</li>
                        <li><strong>經您拆封之個人衛生用品、已啟動之數位內容</strong>。</li>
                        <li>其他依經濟部公告得排除之商品類別。</li>
                    </ul>
                    <p className="text-sm bg-red-50 border border-red-100 text-red-700 rounded-lg p-4">
                        <strong>重點：</strong>販創所所售之「標準庫存商品」（例如現成文創小物）適用 7 日猶豫期；「客製化商品」與「鍛造工坊代工」則 <strong>不適用</strong>。商品頁將明確標示是否為客製品。
                    </p>
                </Block>

                {/* 三、可申請退換貨的情況 */}
                <Block title="三、可申請退換貨之情況" icon={<CheckCircle2 className="text-maker-500" size={28} strokeWidth={1.8} />}>
                    <p>除上述不適用之商品外，遇下列情況您得申請退貨或換貨：</p>
                    <ol>
                        <li><strong>猶豫期內退貨</strong>：標準商品於 7 日內退回，商品未使用、包裝完整。</li>
                        <li><strong>商品瑕疵</strong>：收到商品時發現有製造瑕疵、功能異常、規格與頁面不符等問題。</li>
                        <li><strong>寄送錯誤</strong>：本站寄錯型號、顏色、數量。</li>
                        <li><strong>運送毀損</strong>：外箱或商品因運送過程明顯毀損（請保留外箱並於 48 小時內拍照聯繫）。</li>
                        <li><strong>客製品製作錯誤</strong>：僅限因本站製作上之瑕疵（例如規格不符、雕刻字樣錯誤、列印失敗），導致品項與您確認之規格明顯不符者，本站負責補做、修繕或退費。</li>
                    </ol>
                </Block>

                {/* 四、不成立退換貨的情況 */}
                <Block title="四、不成立退換貨之情況" icon={<XCircle className="text-red-500" size={28} strokeWidth={1.8} />}>
                    <ul>
                        <li>超過 7 日猶豫期始提出申請者。</li>
                        <li>商品經使用、組裝、洗滌、改造、毀損、刮傷或有明顯汙漬。</li>
                        <li>商品原包裝、吊牌、贈品、發票、配件不齊全。</li>
                        <li>屬於第二條所列「不適用猶豫期」之客製品或代工項目，且非可歸責於本站之瑕疵。</li>
                        <li>您於下單時確認之客製規格（尺寸、文字、檔案）有誤而導致之製作結果差異。</li>
                    </ul>
                </Block>

                {/* 五、退換貨流程 */}
                <Block title="五、退換貨申請流程" icon={<Truck className="text-forge-500" size={28} strokeWidth={1.8} />}>
                    <ol>
                        <li>
                            <strong>提出申請</strong>：於可退換之期間內，透過下列任一方式聯絡本站客服：
                            <ul>
                                <li>官方 LINE：<a href="https://lin.ee/NlEipWt" target="_blank" rel="noopener noreferrer">加入好友後私訊</a></li>
                                <li>客服信箱：bc2024space@gmail.com</li>
                            </ul>
                            請提供：訂單編號、退換原因、商品照片（瑕疵品請含整體及瑕疵特寫）。
                        </li>
                        <li>
                            <strong>客服審核</strong>：本站將於 2 個工作天內回覆審核結果，並告知後續退貨方式與寄回地址。
                        </li>
                        <li>
                            <strong>寄回商品</strong>：請以可追蹤之物流方式寄回。商品須包裝完整（建議使用原外箱），附上訂單編號備註。
                        </li>
                        <li>
                            <strong>驗收確認</strong>：本站收到商品後 3 個工作天內完成驗收。
                        </li>
                        <li>
                            <strong>完成退款／換貨</strong>：驗收通過後，退款將於 7 個工作天內完成；換貨則安排重新出貨。
                        </li>
                    </ol>
                </Block>

                {/* 六、運費負擔 */}
                <Block title="六、運費負擔" icon={<Truck className="text-forge-500" size={28} strokeWidth={1.8} />}>
                    <ul>
                        <li><strong>7 日猶豫期內退貨</strong>：依《通訊交易解除權合理例外情事適用準則》，退貨運費由本站負擔。</li>
                        <li><strong>商品瑕疵、寄錯、運送毀損</strong>：來回運費由本站負擔。</li>
                        <li><strong>買方主觀因素換貨</strong>（例如更換顏色、款式，且商品未拆封）：單次來回運費由買方負擔。</li>
                    </ul>
                </Block>

                {/* 七、退款 */}
                <Block title="七、退款方式與時程" icon={<CreditCard className="text-store-500" size={28} strokeWidth={1.8} />}>
                    <ul>
                        <li><strong>ATM／銀行轉帳訂單</strong>：退款將匯回原付款帳戶或您指定之帳戶，於驗收通過後 <strong>7 個工作天內</strong>完成；申請時請提供戶名、銀行、帳號以利匯款。</li>
                        <li><strong>LINE Pay 訂單</strong>：透過 LINE Pay 原管道辦理退款，由 LINE Pay 將款項退回您原支付之連結信用卡或 LINE Pay Money 餘額；實際入帳時程依 LINE Pay 及發卡銀行作業而定，一般為 <strong>3–14 個工作天</strong>。</li>
                        <li>退款金額為您實際支付之金額，扣除已使用之優惠折扣；如因退貨使訂單不再符合免運門檻，將按比例調整應退金額。</li>
                        <li>發票處理：本站將於退款時同步辦理發票作廢或開立折讓單，請勿自行銷毀原發票。</li>
                    </ul>
                </Block>

                {/* 八、特殊情況 */}
                <Block title="八、特殊情況處理" icon={<AlertTriangle className="text-store-500" size={28} strokeWidth={1.8} />}>
                    <ul>
                        <li><strong>部分退貨</strong>：多品項訂單可退其中部分商品；若因此不再符合免運門檻，將自退款金額中扣除原應負擔之運費差額。</li>
                        <li><strong>贈品</strong>：退貨時請一併退回隨單贈品；未退回者將按市價自退款金額中扣除。</li>
                        <li><strong>優惠券</strong>：使用後退貨，優惠券恕不回補；如為百分比折扣，退款金額將按比例計算。</li>
                        <li><strong>創客世界課程退費</strong>：請參閱 <Link to="/terms#makerworld" className="text-store-500 font-semibold hover:text-store-700 underline">服務條款第九條</Link>。</li>
                    </ul>
                </Block>

                {/* 聯絡 */}
                <div className="rounded-2xl border border-bcs-border overflow-hidden">
                    <div className="bg-bcs-black text-white p-6">
                        <h3 className="text-xl font-black mb-1">需要協助？</h3>
                        <p className="text-sm text-white/70">我們將於 2 個工作天內回覆您的申請。</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-bcs-border">
                        <a href="https://lin.ee/NlEipWt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-5 hover:bg-bcs-gray transition-colors">
                            <MessageCircle className="text-maker-500" size={22} />
                            <div>
                                <div className="text-xs text-bcs-muted">官方 LINE</div>
                                <div className="font-bold text-bcs-black">加入好友私訊</div>
                            </div>
                        </a>
                        <a href="mailto:bc2024space@gmail.com" className="flex items-center gap-3 p-5 hover:bg-bcs-gray transition-colors">
                            <Mail className="text-forge-500" size={22} />
                            <div>
                                <div className="text-xs text-bcs-muted">客服信箱</div>
                                <div className="font-bold text-bcs-black">bc2024space@gmail.com</div>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="text-center text-xs text-bcs-muted pt-4">
                    本政策為 <Link to="/terms" className="underline hover:text-bcs-black">服務條款</Link> 之一部分，最終解釋權歸比創空間所有；本政策修改後即時生效，並公告於本網站。
                </div>
            </section>
        </div>
    );
}

function Block({ title, icon, children }) {
    return (
        <section className="scroll-mt-24">
            <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-bcs-gray flex items-center justify-center border border-bcs-border">
                    {icon}
                </div>
                <h2 className="text-2xl md:text-3xl font-black leading-tight pt-1">{title}</h2>
            </div>
            <div className="text-bcs-muted leading-loose space-y-3 pl-0 sm:pl-16 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mt-1 [&_strong]:text-bcs-black [&_a]:text-store-500 [&_a:hover]:text-store-700 [&_a]:underline">
                {children}
            </div>
        </section>
    );
}
