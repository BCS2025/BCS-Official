import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

const SECTIONS = [
    { id: 'intro', title: '一、契約成立與適用範圍' },
    { id: 'operator', title: '二、經營者資訊' },
    { id: 'service', title: '三、服務範圍' },
    { id: 'product', title: '四、商品資訊、價格與稅費' },
    { id: 'order', title: '五、訂單成立與審核' },
    { id: 'payment', title: '六、付款方式' },
    { id: 'shipping', title: '七、配送與取貨' },
    { id: 'returns', title: '八、退換貨' },
    { id: 'makerworld', title: '九、創客世界課程報名' },
    { id: 'forge', title: '十、鍛造工坊代工服務' },
    { id: 'privacy', title: '十一、會員資料與隱私' },
    { id: 'ip', title: '十二、智慧財產權' },
    { id: 'liability', title: '十三、免責聲明' },
    { id: 'law', title: '十四、準據法與管轄' },
    { id: 'update', title: '十五、條款修訂' },
];

export default function Terms() {
    usePageMeta('服務條款', '比創空間服務條款——販創所、鍛造工坊、創客世界使用規範、訂單成立、付款、配送、退換貨、隱私與客製化服務之契約說明。');

    return (
        <div className="min-h-screen bg-white text-bcs-black font-sans pb-24">

            {/* Hero */}
            <section className="w-full bg-bcs-gray border-b border-bcs-border">
                <div className="max-w-4xl mx-auto px-6 py-16 lg:py-20">
                    <div className="inline-block px-4 py-1.5 bg-white text-bcs-muted rounded-full text-xs font-semibold tracking-widest uppercase border border-bcs-border mb-6">
                        Terms of Service
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">服務條款</h1>
                    <p className="text-bcs-muted leading-relaxed">
                        歡迎使用比創空間（bcs.tw）所提供之服務。請您於使用本網站前詳細閱讀以下條款。當您完成訂購、報名或使用本網站任何功能時，即視為已閱讀、瞭解並同意接受本條款全部內容之拘束。
                    </p>
                    <p className="text-xs text-bcs-muted mt-4">
                        最後更新日期：2026-04-21
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="max-w-4xl mx-auto px-6 py-12 lg:py-16">

                {/* TOC */}
                <nav aria-label="目錄" className="mb-12 p-6 rounded-2xl border border-bcs-border bg-white">
                    <h2 className="text-sm font-bold text-bcs-muted uppercase tracking-widest mb-4">目錄</h2>
                    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {SECTIONS.map(s => (
                            <li key={s.id}>
                                <a href={`#${s.id}`} className="text-bcs-black hover:text-store-500 transition-colors">
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="prose-legal space-y-12">

                    <Block id="intro" title="一、契約成立與適用範圍">
                        <p>本條款為使用者（下稱「您」或「買方」）與比創空間（下稱「本站」或「本公司」）之間，關於使用本網站 bcs.tw 及其旗下三品牌（販創所、鍛造工坊、創客世界）所提供之商品、服務、課程、代工製作之法律契約。</p>
                        <p>若您不同意本條款之任一內容，請勿使用本網站之任何服務。</p>
                    </Block>

                    <Block id="operator" title="二、經營者資訊">
                        <ul>
                            <li>營業名稱：<strong>比創空間</strong>（獨資）</li>
                            <li>統一編號：<strong>94320625</strong></li>
                            <li>營業地址：<strong>臺南市永康區六合里新興街 34 巷 2 之 2 號</strong></li>
                            <li>設立日期：2024-01-22</li>
                            <li>聯絡方式：
                                <ul>
                                    <li>官方 LINE：<a href="https://lin.ee/NlEipWt" target="_blank" rel="noopener noreferrer">加入好友</a></li>
                                    <li>Instagram：<a href="https://www.instagram.com/sr2026space/" target="_blank" rel="noopener noreferrer">@sr2026space</a></li>
                                    <li>客服信箱：bc2024space@gmail.com</li>
                                </ul>
                            </li>
                        </ul>
                    </Block>

                    <Block id="service" title="三、服務範圍">
                        <p>本站提供以下三大類服務：</p>
                        <ol>
                            <li><strong>販創所（電商）</strong>：銷售本站自行開發之文創商品、壓克力燈、雷切雷雕製品、3D 列印商品、創客材料等。</li>
                            <li><strong>鍛造工坊（代工）</strong>：提供雷射切割、雷射雕刻、FDM 3D 列印之客製化代工與打樣顧問服務，採「填寫需求 → 報價確認 → 製作 → 取貨 / 寄送」流程。</li>
                            <li><strong>創客世界（STEAM 教育）</strong>：針對兒童與親子之 Arduino、3D 列印、雷射切割等動手實作課程。</li>
                        </ol>
                    </Block>

                    <Block id="product" title="四、商品資訊、價格與稅費">
                        <ul>
                            <li>本站所有商品之名稱、規格、材質、尺寸、售價均揭示於商品頁。商品圖片會盡力還原實物色彩，但因電腦螢幕顯示差異與材料批次不同，實物可能存在合理之色差。</li>
                            <li>商品售價以新台幣（TWD）計價，並已含應納稅費，本站於下單後提供電子收據；如需統一發票或三聯式發票，請於訂購時告知統編抬頭。</li>
                            <li>本站得不經事前通知隨時調整商品售價與供應狀態；已成立之訂單以下單時確認之價格為準。</li>
                            <li>若商品頁之價格或描述因系統錯誤、人為疏失等原因顯著異常（例如明顯低於成本），本站保留取消該筆訂單之權利，並全額退款，不另行負擔其他賠償責任。</li>
                        </ul>
                    </Block>

                    <Block id="order" title="五、訂單成立與審核">
                        <ol>
                            <li>您於結帳頁完成商品選購、填寫收件資訊並按下「確認送出訂單」後，訂單即進入本站系統並寄出訂單通知。</li>
                            <li><strong>訂單成立之時點：本站收到您的付款（銀行轉帳到帳、LINE Pay / ECPay 金流扣款成功）並經本站確認後，契約始告成立。</strong>在付款確認前，本站保留接受或拒絕訂單之權利。</li>
                            <li>若下列情形之一發生，本站得取消訂單：
                                <ul>
                                    <li>庫存不足、供應商無法供貨</li>
                                    <li>收件資訊不完整或經聯繫無回應</li>
                                    <li>訂單疑似詐欺、濫用優惠碼或違反善良風俗</li>
                                    <li>商品資訊或售價有顯著錯誤</li>
                                </ul>
                            </li>
                            <li>訂單成立後，如需修改收件資訊或取消，請於本站尚未出貨前透過官方 LINE 或客服信箱聯繫，本站將協助處理。</li>
                        </ol>
                    </Block>

                    <Block id="payment" title="六、付款方式">
                        <p>本站目前提供以下付款方式，您可於結帳時擇一使用：</p>
                        <ul>
                            <li><strong>ATM／銀行轉帳</strong>：訂單送出後，本站將提供轉帳帳號（含銀行代碼、帳號、金額）；請您於 <strong>3 個工作天內</strong>完成匯款，並回覆匯款後 5 碼帳號以利對帳，逾期未付款之訂單將自動取消。</li>
                            <li><strong>LINE Pay</strong>：結帳時選擇 LINE Pay，系統將導引您前往 LINE Pay 完成付款；付款成功並由 LINE Pay 回傳授權後，本站將立即確認訂單。</li>
                        </ul>
                        <p className="text-sm bg-bcs-gray border border-bcs-border rounded-lg p-4">
                            本站目前<strong>尚未提供信用卡直接刷卡、ECPay、NewebPay 等其他第三方金流</strong>服務；若未來開通，將另行於付款頁面與本條款公告。LINE Pay 交易之金流處理、授權、退款皆由 LINE Pay 官方執行，本站不儲存您的信用卡或支付帳戶資料。
                        </p>
                    </Block>

                    <Block id="shipping" title="七、配送與取貨">
                        <ul>
                            <li>配送方式：超商取貨、郵寄、本店自取、指定親友代收。</li>
                            <li>運費：依配送方式與重量計算，結帳時顯示；消費滿 NT$599 享免運（部分促銷活動規則以活動頁面為準）。</li>
                            <li>配送區域以台灣本島為限，離島地區請先透過客服確認可否配送。</li>
                            <li>出貨時程：一般商品於付款確認後 1–3 個工作天內出貨；客製化商品依商品頁載明之製作工期。</li>
                            <li>配送期間如遇天候、疫情、物流業者作業延誤等不可抗力因素，本站將盡速通知並協助追蹤，但不負擔逾期之額外補償責任。</li>
                        </ul>
                    </Block>

                    <Block id="returns" title="八、退換貨">
                        <p>關於退換貨之完整條件、流程、運費負擔與不適用範圍（尤其是客製化商品），請參閱 <Link to="/returns" className="text-store-500 font-semibold hover:text-store-700 underline">退換貨政策</Link>。該政策為本條款不可分割之一部分。</p>
                        <p>依消費者保護法第 19 條規定，您享有商品到貨次日起 7 日之猶豫期（鑑賞期）退貨權利；但依同法第 19 條之 1 及其施行細則第 17 條，<strong>依消費者要求所為之客製化給付</strong>（例如雕刻姓名、指定尺寸或圖樣之雷切、3D 列印代工等）<strong>不適用該猶豫期</strong>。</p>
                    </Block>

                    <Block id="makerworld" title="九、創客世界課程報名">
                        <ul>
                            <li>課程報名以本站填寫之表單並完成繳費為準；名額有限，額滿為止。</li>
                            <li>報名取消政策：
                                <ul>
                                    <li>課程開始前 7 日（含）以前取消：退還全額。</li>
                                    <li>課程開始前 3–6 日內取消：退還 70%。</li>
                                    <li>課程開始前 48 小時內取消或無故未出席：不予退費。</li>
                                </ul>
                            </li>
                            <li>因本站原因取消或延期課程（不可抗力、師資異動等），將主動聯繫並全額退費或改期。</li>
                            <li>課程中所拍攝之照片、影片，本站得作為教學紀錄與對外宣傳用途；如不同意者請於報名時主動告知。</li>
                        </ul>
                    </Block>

                    <Block id="forge" title="十、鍛造工坊代工服務">
                        <ul>
                            <li>您透過報價表單提出需求，本站將於 3 個工作天內回覆報價；報價有效期為回覆日起 14 日。</li>
                            <li>確認報價並完成款項後（視金額可要求訂金或全額），本站依約定規格進行製作。</li>
                            <li>因代工皆屬依您的要求所為之客製化給付，<strong>一旦開工即不得取消或退款</strong>；若因本站製作瑕疵導致品項與報價規格不符，本站將依情節補做、修繕或退費。</li>
                            <li>您應確保提供之圖檔、文字不違反他人智慧財產權、商標權或公序良俗，否則本站得拒絕承製；因檔案內容引發之一切法律責任由您自行承擔。</li>
                        </ul>
                    </Block>

                    <Block id="privacy" title="十一、會員資料與隱私">
                        <ul>
                            <li>本站蒐集您的姓名、電話、電子郵件、配送地址、購買紀錄之目的，為訂單處理、配送、客服聯繫與售後服務，並依《個人資料保護法》善盡保管義務。</li>
                            <li>本站不會將您的個資提供予無關之第三方；但為履行訂單，將依必要範圍提供予物流業者、金流機構、發票開立系統。</li>
                            <li>您得隨時透過客服信箱請求查閱、更正、刪除您的個人資料；行使權利前，本站將核對身分以確保安全。</li>
                        </ul>
                    </Block>

                    <Block id="ip" title="十二、智慧財產權">
                        <ul>
                            <li>本網站上之 LOGO、商品圖片、文案、設計圖稿、課程教材，其著作權、商標權與其他智慧財產權均為本站或原權利人所有，未經書面同意不得重製、散布、改作。</li>
                            <li>您上傳至本站之代工檔案，僅授權本站為履行該筆訂單之必要使用，本站不會將其作為其他商業用途。</li>
                        </ul>
                    </Block>

                    <Block id="liability" title="十三、免責聲明">
                        <ul>
                            <li>本站所提供之資訊、商品、課程，係以「現狀」為基礎提供；本站不保證商品絕對適合您的特定用途。</li>
                            <li>因不可抗力（天災、戰爭、疫情、停電、網路中斷、第三方服務中斷等）導致之服務中斷或延誤，本站不負賠償責任。</li>
                            <li>於法律允許之最大範圍內，本站對任何間接損害、利潤損失、商譽損失不負賠償責任。</li>
                        </ul>
                    </Block>

                    <Block id="law" title="十四、準據法與管轄">
                        <p>本條款之解釋與適用，以及您與本站間因本條款所生之爭議，均應依中華民國法律為準據法；如因此發生訴訟者，雙方合意以臺灣臺南地方法院為第一審管轄法院，但不排除消費者保護法關於管轄法院之適用。</p>
                    </Block>

                    <Block id="update" title="十五、條款修訂">
                        <p>本站得隨時修改本條款，修改後之內容將公告於本網站，不另行個別通知。您於修改後仍繼續使用本網站，即視為同意修改後之條款。</p>
                    </Block>

                </div>

                {/* CTA */}
                <div className="mt-16 p-6 rounded-2xl border border-bcs-border bg-bcs-gray">
                    <h3 className="text-lg font-black mb-2">對條款有任何疑問？</h3>
                    <p className="text-sm text-bcs-muted mb-4">歡迎透過官方 LINE 或客服信箱與我們聯繫，我們會儘速回覆。</p>
                    <div className="flex flex-wrap gap-3">
                        <a href="https://lin.ee/NlEipWt" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#06C755' }}>
                            加入 LINE 好友
                        </a>
                        <Link to="/returns" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-bcs-border hover:bg-white transition-colors">
                            查看退換貨政策
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Block({ id, title, children }) {
    return (
        <section id={id} className="scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-black mb-4 leading-tight">{title}</h2>
            <div className="text-bcs-muted leading-loose space-y-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_ul_ul]:list-[circle] [&_ul_ul]:mt-1 [&_li]:mt-1 [&_strong]:text-bcs-black [&_a]:text-store-500 [&_a:hover]:text-store-700 [&_a]:underline">
                {children}
            </div>
        </section>
    );
}
