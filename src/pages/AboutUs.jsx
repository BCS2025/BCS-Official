import { Link } from 'react-router-dom';
import { Sparkles, Hammer, GraduationCap, ChevronRight } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AboutUs() {
    usePageMeta('關於我們', '比創空間——兩人一貓的創客工坊，台南在地，融合工程師視角與設計師美感，打造三個子品牌：販創所、鍛造工坊、創客世界。');
    return (
        <div className="min-h-screen bg-white text-bcs-black font-sans pb-24">

            {/* ── Hero ── */}
            <section className="relative w-full max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-20 lg:pb-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 z-10">
                    <div className="inline-block px-4 py-1.5 bg-bcs-gray text-bcs-muted rounded-full text-xs font-semibold tracking-widest uppercase">
                        About Be Creative Space
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] tracking-tight">
                        兩人一貓，<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-store-500 via-forge-500 to-maker-500">
                            與無盡的想像力。
                        </span>
                    </h1>
                    <p className="text-xl text-bcs-muted font-medium max-w-lg leading-relaxed">
                        不被定義的創客空間，我們只做真心喜歡的事。
                    </p>
                </div>

                <div className="lg:w-1/2 w-full relative">
                    <div className="absolute inset-0 bg-bcs-gray rounded-[2rem] blur-3xl -z-10 transform translate-x-4 translate-y-4" />
                    <img
                        src={`${import.meta.env.BASE_URL}ContactUs/ContactUs.png`}
                        alt="比創空間團隊"
                        className="w-full h-auto object-cover rounded-[2rem] shadow-xl border border-bcs-border aspect-[4/3] md:aspect-auto"
                        loading="lazy"
                    />
                </div>
            </section>

            {/* ── Brand Story (Z-Pattern) ── */}
            <section className="w-full bg-bcs-gray py-20 border-y border-bcs-border">
                <div className="max-w-6xl mx-auto px-6 flex flex-col gap-24">

                    {/* Block A: Story */}
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 order-2 md:order-1">
                            <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                                從愛好到具現化，<br />把好玩的東西做出來。
                            </h2>
                            <p className="text-lg leading-loose text-bcs-muted">
                                比創空間的誕生可愛且單純。我們是由一位腦洞大開的工程師、一位充滿巧思的設計師，以及一隻負責日常監工的橘貓所組成。
                            </p>
                            <p className="text-lg leading-loose text-bcs-muted mt-4">
                                我們沒有固定的人設，因為我們對世界的各種事物都充滿好奇。我們開發自己想用的文創小物，也動手解決生活中的難題，探索令人驚奇的 AI 科技。比創空間，就是我們向世界分享熱情與實驗精神的基地。
                            </p>
                        </div>
                        <div className="md:w-1/2 order-1 md:order-2 flex justify-center">
                            <div className="w-full aspect-square max-w-md bg-white rounded-[2rem] flex items-center justify-center relative overflow-hidden border border-bcs-border shadow-card">
                                <Sparkles className="w-28 h-28 text-store-300 drop-shadow-sm" strokeWidth={1} />
                            </div>
                        </div>
                    </div>

                    {/* Block B: Manifesto */}
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 flex justify-center">
                            <div className="w-full aspect-square max-w-md bg-white rounded-[2rem] flex items-center justify-center relative overflow-hidden border border-bcs-border shadow-card">
                                <Hammer className="w-28 h-28 text-forge-300 drop-shadow-sm" strokeWidth={1} />
                            </div>
                        </div>
                        <div className="md:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                                在 AI 橫行的世代，<br />我們捍衛實體的溫度。
                            </h2>
                            <p className="text-lg leading-loose text-bcs-muted">
                                人工智慧可以輕易生成華麗的圖像與程式碼，但它無法取代指尖觸摸的紋理，也無法讓人們感受物品的真實重量。
                            </p>
                            <p className="text-lg leading-loose text-bcs-muted mt-4">
                                我們擁抱 AI 作為工具，但我們更堅持透過雙手與機器，把冰冷的數據，轉化為有溫度的實體作品。這份堅持，是我們賦予每一個作品靈魂的儀式。
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* ── Three Business Pillars ── */}
            <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black mb-3 tracking-tight">我們的三大核心</h2>
                    <p className="text-bcs-muted">從概念到實踐，全面涵蓋創意的每個維度</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* 販創所 */}
                    <div className="card card-hover p-8 flex flex-col">
                        <div className="w-14 h-14 rounded-2xl bg-store-50 flex items-center justify-center mb-6">
                            <Sparkles size={28} className="text-store-500" strokeWidth={1.5} />
                        </div>
                        <span className="badge-store mb-3 self-start">販創所</span>
                        <h3 className="text-2xl font-black mt-3 mb-3 leading-snug">
                            販賣好點子
                        </h3>
                        <p className="text-bcs-muted leading-relaxed text-sm flex-grow">
                            從文創商品到創意教材，這裡展示了我們親自開發、設計並製造的專屬物件。每一個商品背後，都有一個有趣的故事。
                        </p>
                        <Link to="/store/products" className="mt-8 btn-store w-full justify-center group">
                            去逛逛
                            <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* 鍛造工坊 */}
                    <div className="card card-hover p-8 flex flex-col">
                        <div className="w-14 h-14 rounded-2xl bg-forge-50 flex items-center justify-center mb-6">
                            <Hammer size={28} className="text-forge-500" strokeWidth={1.5} />
                        </div>
                        <span className="badge-forge mb-3 self-start">鍛造工坊</span>
                        <h3 className="text-2xl font-black mt-3 mb-3 leading-snug">
                            讓創意落地
                        </h3>
                        <p className="text-bcs-muted leading-relaxed text-sm flex-grow">
                            結合專業與設備（雷射切割 / FDM 3D 列印），為您的專案提供專家級的代工與打樣顧問服務。讓我們做你堅強的後盾。
                        </p>
                        <Link to="/forge" className="mt-8 btn-forge w-full justify-center group">
                            申請專業報價
                            <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* 創客世界 */}
                    <div className="card card-hover p-8 flex flex-col">
                        <div className="w-14 h-14 rounded-2xl bg-maker-50 flex items-center justify-center mb-6">
                            <GraduationCap size={28} className="text-maker-500" strokeWidth={1.5} />
                        </div>
                        <span className="badge-maker mb-3 self-start">創客世界</span>
                        <h3 className="text-2xl font-black mt-3 mb-3 leading-snug">
                            動手做的力量
                        </h3>
                        <p className="text-bcs-muted leading-relaxed text-sm flex-grow">
                            結合 STEAM 教育理念，透過手作、科學、機械與程式課程，不僅激發大小朋友的創造力，更訓練日常邏輯思維能力。
                        </p>
                        <Link to="/makerworld" className="mt-8 btn-maker w-full justify-center group">
                            查看課程
                            <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                </div>
            </section>
        </div>
    );
}
