import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ChevronRight, GraduationCap, Instagram } from 'lucide-react';
import { fetchCourses } from '../lib/courseService';
import { usePageMeta } from '../hooks/usePageMeta';
import { SkeletonCourseCard } from '../components/ui/Skeleton';
import Reveal from '../components/ui/Reveal';

const STATUS_TABS = ['全部', '可報名', '名額已滿', '已結束'];

function getStatus(course) {
    if (course.status === 'closed') return 'closed';
    const remaining = course.capacity - course.enrolled;
    if (course.status === 'full' || remaining <= 0) return 'full';
    return 'open';
}

function CourseCard({ course }) {
    const date = new Date(course.date);
    const remaining = course.capacity - course.enrolled;
    const isFull = course.status === 'full' || remaining <= 0;
    const isClosed = course.status === 'closed';

    return (
        <div className={`card card-hover flex flex-col overflow-hidden ${isClosed ? 'opacity-60' : ''}`}>
            {/* 封面 */}
            <div className="relative aspect-[16/9] bg-maker-50 overflow-hidden">
                {course.cover_url ? (
                    <img src={course.cover_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap size={48} className="text-maker-200" />
                    </div>
                )}
                {isFull && !isClosed && (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        名額已滿
                    </div>
                )}
                {isClosed && (
                    <div className="absolute top-3 right-3 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        已結束
                    </div>
                )}
                {!isFull && !isClosed && remaining <= 3 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        僅剩 {remaining} 位
                    </div>
                )}
            </div>

            {/* 內容 */}
            <div className="p-5 flex flex-col flex-grow">
                <span className="badge-maker self-start mb-3">創客世界</span>
                <h3 className="text-lg font-black text-bcs-black mb-3 leading-snug">{course.title}</h3>

                <div className="space-y-2 text-sm text-bcs-muted mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-maker-500 flex-shrink-0" />
                        <span>
                            {date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                            {'　'}
                            {date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-maker-500 flex-shrink-0" />
                        <span>{course.duration_min} 分鐘</span>
                        {(course.min_age || course.max_age) && (
                            <span className="ml-2">
                                · 適合 {course.min_age || 0}{course.max_age ? `–${course.max_age}` : '+'} 歲
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-maker-500 flex-shrink-0" />
                        <span>
                            剩餘 <span className={`font-bold ${remaining <= 3 && !isFull ? 'text-red-500' : 'text-maker-600'}`}>{Math.max(0, remaining)}</span> / {course.capacity} 位
                        </span>
                    </div>
                </div>

                {course.description && (
                    <p className="text-sm text-bcs-muted leading-relaxed mb-4 line-clamp-2">{course.description}</p>
                )}

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-bcs-border">
                    <div className="text-xl font-black text-bcs-black">
                        {course.price > 0 ? `NT$ ${course.price.toLocaleString()}` : '免費'}
                    </div>
                    {!isClosed ? (
                        <Link
                            to={`/makerworld/${course.id}`}
                            className={`btn-maker flex items-center gap-1 group text-sm ${isFull ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {isFull ? '額滿' : '查看 / 報名'}
                            {!isFull && <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
                        </Link>
                    ) : (
                        <Link to={`/makerworld/${course.id}`} className="btn-outline text-sm">查看詳情</Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MakerWorld() {
    usePageMeta('創客世界', '比創空間・創客世界——STEAM 教育工作坊、Arduino、3D 列印、雷射切割，週末兒童實作課程，台南永康。');
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('全部');

    useEffect(() => {
        fetchCourses()
            .then(setCourses)
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const filteredCourses = courses.filter(c => {
        if (activeFilter === '全部') return true;
        const s = getStatus(c);
        if (activeFilter === '可報名') return s === 'open';
        if (activeFilter === '名額已滿') return s === 'full';
        if (activeFilter === '已結束') return s === 'closed';
        return true;
    });

    const counts = STATUS_TABS.reduce((acc, tab) => {
        if (tab === '全部') { acc[tab] = courses.length; return acc; }
        const s = tab === '可報名' ? 'open' : tab === '名額已滿' ? 'full' : 'closed';
        acc[tab] = courses.filter(c => getStatus(c) === s).length;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-white">

            {/* ── Hero ── */}
            <section className="bg-maker-50 border-b border-maker-100 py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 rounded-2xl bg-maker-500 flex items-center justify-center mx-auto mb-6">
                        <GraduationCap size={32} className="text-white" strokeWidth={1.5} />
                    </div>
                    <span className="badge-maker mb-4 inline-block">創客世界</span>
                    <h1 className="text-4xl md:text-5xl font-black mt-4 mb-4 text-bcs-black leading-tight">
                        動手做的力量
                    </h1>
                    <p className="text-lg text-bcs-muted max-w-2xl mx-auto leading-relaxed">
                        結合 STEAM 教育理念，透過 Arduino、3D 列印、雷射切割等實作課程，激發孩子的創造力與邏輯思維。週末帶小朋友一起玩！
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-12">

                {/* ── 篩選 Tabs ── */}
                {!isLoading && courses.length > 0 && (
                    <div className="flex gap-2 flex-wrap mb-8">
                        {STATUS_TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                    activeFilter === tab
                                        ? 'bg-maker-500 text-white'
                                        : 'bg-white border border-bcs-border text-bcs-muted hover:border-maker-300 hover:text-maker-600'
                                }`}
                            >
                                {tab}
                                {counts[tab] > 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        activeFilter === tab ? 'bg-white/20 text-white' : 'bg-bcs-gray text-bcs-muted'
                                    }`}>
                                        {counts[tab]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <SkeletonCourseCard key={i} />)}
                    </div>
                )}

                {!isLoading && courses.length === 0 && (
                    <div className="text-center py-20">
                        <GraduationCap size={48} className="text-maker-200 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-bcs-black mb-2">課程籌備中</h2>
                        <p className="text-bcs-muted mb-6">敬請期待即將推出的 STEAM 課程！</p>
                        <a
                            href="https://www.instagram.com/sr2026space/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-maker inline-flex items-center gap-2"
                        >
                            <Instagram size={16} />
                            追蹤 IG 掌握最新課程消息
                        </a>
                    </div>
                )}

                {!isLoading && courses.length > 0 && filteredCourses.length === 0 && (
                    <div className="text-center py-16 text-bcs-muted">
                        <p className="font-semibold mb-1">此分類目前沒有課程</p>
                        <button onClick={() => setActiveFilter('全部')} className="text-maker-500 font-bold text-sm mt-2 hover:underline">
                            查看全部課程
                        </button>
                    </div>
                )}

                {!isLoading && filteredCourses.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((c, i) => (
                            <Reveal key={c.id} delay={i * 60}>
                                <CourseCard course={c} />
                            </Reveal>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Instagram CTA ── */}
            <Reveal className="border-t border-maker-100 bg-maker-50 py-14 px-6 text-center">
                <div className="max-w-xl mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-maker-500 flex items-center justify-center mx-auto mb-4">
                        <Instagram size={22} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-bcs-black mb-2">追蹤 Instagram 掌握最新動態</h2>
                    <p className="text-bcs-muted mb-6 leading-relaxed">
                        課程花絮、學員作品、新課預告——都在 IG 第一手公布。
                    </p>
                    <a
                        href="https://www.instagram.com/sr2026space/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-maker inline-flex items-center gap-2"
                    >
                        <Instagram size={16} />
                        @sr2026space
                    </a>
                </div>
            </Reveal>

        </div>
    );
}
