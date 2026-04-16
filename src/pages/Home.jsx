import { Link } from 'react-router-dom';
import { Sparkles, Hammer, GraduationCap, ArrowRight, ChevronRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-white text-bcs-black font-sans">

            {/* ── Hero ── */}
            <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
                <div className="inline-block px-4 py-1.5 bg-bcs-gray text-bcs-muted rounded-full text-xs font-semibold tracking-widest uppercase mb-8">
                    比創空間 · Be Creative Space
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
                    創意的工坊，<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-store-500 via-forge-500 to-maker-500">
                        無限的可能。
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-bcs-muted max-w-2xl mx-auto mb-12 leading-relaxed">
                    一個由工程師與設計師共同打造的創客空間——文創商品、代工製作、STEAM 教育，一次滿足。
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/store/products" className="btn-store flex items-center gap-2 group">
                        逛逛販創所
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/forge" className="btn-forge flex items-center gap-2 group">
                        委託鍛造工坊
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/makerworld" className="btn-maker flex items-center gap-2 group">
                        探索創客世界
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* ── Three Brand Cards ── */}
            <section className="bg-bcs-gray py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black mb-3 tracking-tight">三個品牌，一個空間</h2>
                        <p className="text-bcs-muted">從概念到實踐，全面涵蓋創意的每個維度</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* 販創所 */}
                        <div className="card card-hover p-8 border-store-100 flex flex-col">
                            <div className="w-14 h-14 rounded-2xl bg-store-50 flex items-center justify-center mb-6 flex-shrink-0">
                                <Sparkles size={28} className="text-store-500" strokeWidth={1.5} />
                            </div>
                            <div className="flex-grow">
                                <span className="badge-store mb-3">販創所</span>
                                <h3 className="text-2xl font-black mt-3 mb-3 leading-snug">
                                    文創商品<br />創意教材
                                </h3>
                                <p className="text-bcs-muted leading-relaxed text-sm">
                                    親自開發、設計並製造的專屬物件，每件商品背後都有一個故事。涵蓋壓克力燈、雷切雷雕、3D 列印文創品，以及蝦皮獨家商品。
                                </p>
                            </div>
                            <Link to="/store/products" className="mt-8 btn-store w-full justify-center group">
                                去逛逛
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* 鍛造工坊 */}
                        <div className="card card-hover p-8 border-forge-100 flex flex-col">
                            <div className="w-14 h-14 rounded-2xl bg-forge-50 flex items-center justify-center mb-6 flex-shrink-0">
                                <Hammer size={28} className="text-forge-500" strokeWidth={1.5} />
                            </div>
                            <div className="flex-grow">
                                <span className="badge-forge mb-3">鍛造工坊</span>
                                <h3 className="text-2xl font-black mt-3 mb-3 leading-snug">
                                    雷射切割<br />3D 列印代工
                                </h3>
                                <p className="text-bcs-muted leading-relaxed text-sm">
                                    結合專業設備，提供雷切雷雕、FDM 3D 列印代工與打樣顧問服務。讓您的設計從圖面變成實體，我們做您堅強的後盾。
                                </p>
                            </div>
                            <Link to="/forge" className="mt-8 btn-forge w-full justify-center group">
                                申請報價
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {/* 創客世界 */}
                        <div className="card card-hover p-8 border-maker-100 flex flex-col">
                            <div className="w-14 h-14 rounded-2xl bg-maker-50 flex items-center justify-center mb-6 flex-shrink-0">
                                <GraduationCap size={28} className="text-maker-500" strokeWidth={1.5} />
                            </div>
                            <div className="flex-grow">
                                <span className="badge-maker mb-3">創客世界</span>
                                <h3 className="text-2xl font-black mt-3 mb-3 leading-snug">
                                    STEAM 課程<br />動手做體驗
                                </h3>
                                <p className="text-bcs-muted leading-relaxed text-sm">
                                    結合 STEAM 教育理念，透過 Arduino、3D 列印、雷切課程，激發大小朋友的創造力，訓練日常邏輯思維能力。
                                </p>
                            </div>
                            <Link to="/makerworld" className="mt-8 btn-maker w-full justify-center group">
                                查看課程
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── Brand Story Teaser ── */}
            <section className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                <div className="md:w-1/2">
                    <div className="text-xs font-bold tracking-widest text-bcs-muted uppercase mb-4">關於我們</div>
                    <h2 className="text-4xl font-black leading-tight mb-6">
                        兩人一貓，<br />與無盡的想像力。
                    </h2>
                    <p className="text-bcs-muted leading-relaxed mb-8 text-lg">
                        比創空間由一位工程師與一位設計師共同創立。我們只做真心喜歡的事，把腦海中的想法，透過雙手與機器，做成真實存在的東西。
                    </p>
                    <Link
                        to="/about"
                        className="inline-flex items-center gap-2 font-bold text-bcs-black border-b-2 border-bcs-black pb-0.5 hover:opacity-50 transition-opacity group"
                    >
                        了解我們的故事
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="md:w-1/2 w-full">
                    <img
                        src={`${import.meta.env.BASE_URL}ContactUs/ContactUs.png`}
                        alt="比創空間團隊"
                        className="w-full h-auto object-cover rounded-2xl shadow-lg aspect-[4/3]"
                        loading="lazy"
                    />
                </div>
            </section>

            {/* ── Simple Footer placeholder ── */}
            <footer className="border-t border-bcs-border bg-bcs-gray mt-8 py-10">
                <div className="max-w-7xl mx-auto px-6 text-center text-bcs-muted text-sm">
                    <p className="font-semibold text-bcs-black mb-1">比創空間 Be Creative Space</p>
                    <p>臺南市永康區六合里新興街34巷2之2號</p>
                    <p className="mt-4 text-xs">© {new Date().getFullYear()} 比創空間 · 統編 94320625</p>
                </div>
            </footer>

        </div>
    );
}
