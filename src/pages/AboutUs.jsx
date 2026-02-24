import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Hammer, GraduationCap, ChevronRight } from 'lucide-react';

export default function AboutUs() {
    return (
        <div className="min-h-screen bg-[#FAFAF8] text-wood-900 font-sans selection:bg-amber-100 pb-24">
            {/* Section 1: Hero Section */}
            <section className="relative w-full max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-24 lg:pb-32 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 z-10">
                    <div className="inline-block px-4 py-1.5 bg-amber-50 text-amber-800 rounded-full text-sm font-medium tracking-wider mb-2 border border-amber-100">
                        ABOUT BE CREATIVE SPACE
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] tracking-tight">
                        兩人一貓，<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-wood-800">
                            與無盡的想像力。
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-wood-600 font-medium max-w-lg leading-relaxed">
                        不被定義的創客空間，我們只做真心喜歡的事。
                    </p>
                </div>

                <div className="lg:w-1/2 w-full relative">
                    <div className="absolute inset-0 bg-amber-200/20 rounded-[2rem] blur-3xl -z-10 transform translate-x-4 translate-y-4"></div>
                    <img
                        src={`${import.meta.env.BASE_URL}ContactUs/ContactUs.png`}
                        alt="比創空間團隊"
                        className="w-full h-auto object-cover rounded-[2rem] shadow-2xl border border-wood-100 aspect-[4/3] md:aspect-auto"
                        loading="lazy"
                    />
                </div>
            </section>

            {/* Section 2: Brand Story (Z-Pattern Layout) */}
            <section className="w-full bg-white py-24 border-y border-wood-100">
                <div className="max-w-6xl mx-auto px-6 flex flex-col gap-32">

                    {/* Block A: Story */}
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 order-2 md:order-1">
                            <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
                                從愛好到具現化，<br />把好玩的東西做出來。
                            </h2>
                            <p className="text-lg leading-loose text-wood-700">
                                比創空間的誕生可愛且單純。我們是由一位腦洞大開的工程師、一位充滿巧思的設計師，以及一隻負責日常監工的橘貓所組成。
                            </p>
                            <p className="text-lg leading-loose text-wood-700 mt-4">
                                我們沒有固定的人設，因為我們對世界的各種事物都充滿好奇。我們開發自己想用的文創小物，也動手解決生活中的難題，探索令人驚奇的AI科技。比創空間，就是我們向世界分享熱情與實驗精神的基地。
                            </p>
                        </div>
                        <div className="md:w-1/2 order-1 md:order-2 flex justify-center">
                            {/* Decorative element or whitespace placeholder as requested by Z-pattern */}
                            <div className="w-full aspect-square max-w-md bg-wood-50 rounded-full flex items-center justify-center relative overflow-hidden border border-wood-100">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #8B5A2B 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                                <Sparkles className="w-32 h-32 text-amber-300 drop-shadow-sm" strokeWidth={1} />
                            </div>
                        </div>
                    </div>

                    {/* Block B: Manifesto */}
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 flex justify-center">
                            <div className="w-full aspect-square max-w-md bg-stone-50 rounded-3xl flex items-center justify-center relative overflow-hidden border border-stone-200">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100 rounded-bl-full opacity-50 blur-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-stone-200 rounded-tr-full opacity-50 blur-2xl"></div>
                                <Hammer className="w-32 h-32 text-wood-400 drop-shadow-sm z-10" strokeWidth={1} />
                            </div>
                        </div>
                        <div className="md:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
                                在 AI 橫行的世代，<br />我們捍衛實體的溫度。
                            </h2>
                            <p className="text-lg leading-loose text-wood-700">
                                人工智慧可以輕易生成華麗的圖像與程式碼，但它無法取代指尖觸摸原木的紋理，也無法讓人們感受物品的真實重量。
                            </p>
                            <p className="text-lg leading-loose text-wood-700 mt-4">
                                我們擁抱 AI 作為工具，但我們更堅持透過雙手與機器，把冰冷的數據，轉化為有溫度的實體作品。這份堅持，是我們賦予每一個作品靈魂的儀式。
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* Section 3: Three Business Pillars */}
            <section className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black mb-4 tracking-tight">我們的三大核心</h2>
                    <p className="text-xl text-wood-500 font-medium">從概念到實踐，全面涵蓋創意的每個維度</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Card 1: 販創所 */}
                    <div className="bg-white rounded-3xl p-8 border border-wood-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-8 text-orange-600">
                            <Sparkles size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">販賣好點子<br /><span className="text-wood-500 text-lg font-medium mt-1 block">販創所</span></h3>
                        <p className="text-wood-600 leading-relaxed mb-10 flex-grow">
                            從文創商品到創意教材，這裡展示了我們親自開發、設計並製造的專屬物件。每一個商品背後，都有一個有趣的故事。
                        </p>
                        <Link to="/" className="inline-flex items-center justify-center w-full py-4 px-6 bg-wood-900 text-white rounded-xl font-bold hover:bg-black transition-colors group">
                            去逛逛
                            <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Card 2: 鍛造工坊 */}
                    <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <div className="text-[10px] font-bold tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase border border-amber-100">Popular</div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-8 text-amber-700">
                            <Hammer size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">讓創意落地<br /><span className="text-wood-500 text-lg font-medium mt-1 block">鍛造工坊</span></h3>
                        <p className="text-wood-600 leading-relaxed mb-10 flex-grow">
                            結合專業與設備（雷射切割 / FDM 3D列印），為您的專案提供專家級的代工與打樣顧問服務。讓我們做你堅強的後盾。
                        </p>
                        <Link to="/quote" className="inline-flex items-center justify-center w-full py-4 px-6 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20 group">
                            申請專業報價
                            <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Card 3: 創客世界 */}
                    <div className="bg-white rounded-3xl p-8 border border-wood-100 shadow-sm flex flex-col relative opacity-80">
                        <div className="absolute top-0 right-0 p-4">
                            <div className="text-[10px] font-bold tracking-widest text-stone-500 bg-stone-100 px-2 py-1 rounded-md border border-stone-200">即將推出</div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-8 text-stone-600 grayscale">
                            <GraduationCap size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-stone-800">動手做的力量<br /><span className="text-stone-400 text-lg font-medium mt-1 block">創客世界</span></h3>
                        <p className="text-stone-500 leading-relaxed flex-grow">
                            結合 STEAM 教育理念，透過手作、科學、機械與程式課程，不僅僅是激發大小朋友的創造力，更是訓練日常邏輯思維能力。
                        </p>
                        <div className="mt-10 inline-flex items-center justify-center w-full py-4 px-6 bg-stone-100 text-stone-400 rounded-xl font-bold cursor-not-allowed border border-stone-200">
                            即將推出 (Coming Soon)
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}
