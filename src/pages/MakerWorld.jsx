import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar, Clock, ChevronRight, GraduationCap, Instagram,
    MessageCircle, MapPin, ExternalLink, List, CalendarDays, ChevronLeft,
} from 'lucide-react';
import { fetchCourses } from '../lib/courseService';
import { fetchLocations, LOCATION_TYPE_META } from '../lib/locationService';
import { usePageMeta } from '../hooks/usePageMeta';
import { SkeletonCourseCard } from '../components/ui/Skeleton';
import Reveal from '../components/ui/Reveal';
import CourseCalendar from '../components/makerworld/CourseCalendar';

const IG_URL = 'https://www.instagram.com/sr2026space/';
const LINE_URL = 'https://lin.ee/vt7kVvG';

/** 對外三態：open（可報名）| paused（報名截止）| closed（已結束）
 *  對外不透露「人數」，full 只當作「停止接受報名」處理。 */
function getStatus(course) {
    if (course.status === 'closed') return 'closed';
    if (course.status === 'full') return 'paused';
    return 'open';
}

function formatCourseDate(iso) {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
        time: d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    };
}

function CourseCard({ course }) {
    const { date, time } = formatCourseDate(course.date);
    const s = getStatus(course);
    const isClosed = s === 'closed';
    const isPaused = s === 'paused';

    return (
        <div className={`card card-hover flex flex-col overflow-hidden h-full ${isClosed ? 'opacity-75' : ''}`}>
            <div className="relative aspect-[16/9] bg-maker-50 overflow-hidden">
                {course.cover_url ? (
                    <img src={course.cover_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap size={48} className="text-maker-200" />
                    </div>
                )}
                {isPaused && (
                    <div className="absolute top-3 right-3 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full">報名截止</div>
                )}
                {isClosed && (
                    <div className="absolute top-3 right-3 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">已結束</div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <span className="badge-maker self-start mb-3">創客世界</span>
                <h3 className="text-lg font-black text-bcs-black mb-3 leading-snug">{course.title}</h3>

                <div className="space-y-2 text-sm text-bcs-muted mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-maker-500 flex-shrink-0" />
                        <span>{date}　{time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-maker-500 flex-shrink-0" />
                        <span>{course.duration_min} 分鐘</span>
                        {(course.min_age || course.max_age) && (
                            <span className="ml-2">· 適合 {course.min_age || 0}{course.max_age ? `–${course.max_age}` : '+'} 歲</span>
                        )}
                    </div>
                    {course.location && (
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-maker-500 flex-shrink-0" />
                            <span className="truncate">{course.location.name}</span>
                        </div>
                    )}
                </div>

                {course.description && (
                    <p className="text-sm text-bcs-muted leading-relaxed mb-4 line-clamp-2">{course.description}</p>
                )}

                <div className="mt-auto pt-4 border-t border-bcs-border">
                    <Link
                        to={`/makerworld/${course.id}`}
                        className={`${isClosed || isPaused ? 'btn-outline' : 'btn-maker'} w-full justify-center group text-sm`}
                    >
                        {isClosed ? '查看花絮' : isPaused ? '查看詳情' : '查看詳情 / 報名'}
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

/**
 * 精選照片牆：從已結束課程的 gallery_urls 聚合，最新的在前。
 * 每張圖含 hover 浮層顯示課程名稱與日期。
 */
function HighlightsGallery({ courses }) {
    const items = useMemo(() => {
        const out = [];
        const pastCourses = courses
            .filter(c => c.status === 'closed' || new Date(c.date) < new Date())
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        for (const c of pastCourses) {
            for (const url of c.gallery_urls || []) {
                out.push({
                    url,
                    courseId: c.id,
                    courseTitle: c.title,
                    courseDate: c.date,
                });
            }
        }
        return out;
    }, [courses]);

    const [expanded, setExpanded] = useState(false);
    const [lightbox, setLightbox] = useState(null); // index
    const visible = expanded ? items : items.slice(0, 8);

    if (items.length === 0) return null;

    const dateLabel = (iso) => new Date(iso).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });

    return (
        <section className="py-14 sm:py-20 bg-maker-50/40 border-y border-maker-100">
            <div className="max-w-7xl mx-auto px-6">
                <Reveal className="text-center mb-10">
                    <span className="badge-maker mb-3 inline-block">過去課堂精選</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-bcs-black mb-3">孩子專注的樣子最好看</h2>
                    <p className="text-bcs-muted max-w-xl mx-auto">每堂課的實作瞬間、成品展示，都留在這裡。</p>
                </Reveal>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {visible.map((item, idx) => (
                        <button
                            key={`${item.courseId}-${idx}`}
                            onClick={() => setLightbox(idx)}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all"
                        >
                            <img
                                src={item.url}
                                alt={item.courseTitle}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <div className="text-white text-left">
                                    <div className="text-xs opacity-80">{dateLabel(item.courseDate)}</div>
                                    <div className="text-sm font-bold leading-tight line-clamp-2">{item.courseTitle}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {items.length > 8 && (
                    <div className="text-center mt-8">
                        <button onClick={() => setExpanded(e => !e)} className="btn-outline text-sm">
                            {expanded ? '收起' : `看更多照片（共 ${items.length} 張）`}
                        </button>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox !== null && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setLightbox(i => (i - 1 + items.length) % items.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                        aria-label="上一張"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div
                        className="max-w-5xl max-h-[85vh] flex flex-col items-center gap-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <img src={items[lightbox].url} alt="" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
                        <div className="text-center text-white">
                            <div className="text-sm opacity-70">{dateLabel(items[lightbox].courseDate)}</div>
                            <div className="text-lg font-bold">{items[lightbox].courseTitle}</div>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setLightbox(i => (i + 1) % items.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                        aria-label="下一張"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}
        </section>
    );
}

/** 上課地點介紹區塊 */
function LocationsSection({ locations }) {
    if (locations.length === 0) return null;

    return (
        <section className="py-14 sm:py-20">
            <div className="max-w-7xl mx-auto px-6">
                <Reveal className="text-center mb-10">
                    <span className="badge-maker mb-3 inline-block">上課地點</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-bcs-black mb-3">多元上課場域，貼近你的生活</h2>
                    <p className="text-bcs-muted max-w-xl mx-auto">
                        除了比創空間工作室，也與多個合作單位開設課程，讓孩子在熟悉的環境中動手學習。
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {locations.map((loc, i) => {
                        const meta = LOCATION_TYPE_META[loc.type] || LOCATION_TYPE_META.other;
                        return (
                            <Reveal key={loc.id} delay={i * 60}>
                                <div className="card card-hover h-full flex flex-col overflow-hidden">
                                    <div className={`aspect-[16/10] ${meta.bg} overflow-hidden`}>
                                        {loc.cover_url ? (
                                            <img src={loc.cover_url} alt={loc.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <MapPin size={36} className={meta.text} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex flex-col flex-grow">
                                        <span className={`self-start text-xs font-bold px-2 py-1 rounded-full ${meta.bg} ${meta.text} mb-2`}>
                                            {meta.label}
                                        </span>
                                        <h3 className="text-lg font-black text-bcs-black mb-2">{loc.name}</h3>
                                        {loc.address && (
                                            <div className="flex items-start gap-1.5 text-sm text-bcs-muted mb-2">
                                                <MapPin size={13} className="mt-0.5 flex-shrink-0 text-maker-500" />
                                                <span>{loc.address}</span>
                                            </div>
                                        )}
                                        {loc.description && (
                                            <p className="text-sm text-bcs-muted leading-relaxed flex-grow">{loc.description}</p>
                                        )}
                                        {loc.map_url && (
                                            <a
                                                href={loc.map_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-maker-600 hover:text-maker-700"
                                            >
                                                在 Google Maps 開啟
                                                <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/** 詢問管道 CTA：IG + LINE */
function ContactCta() {
    return (
        <Reveal className="border-t border-maker-100 bg-gradient-to-br from-maker-50 to-white py-16 px-6">
            <div className="max-w-3xl mx-auto text-center">
                <div className="w-14 h-14 rounded-2xl bg-maker-500 flex items-center justify-center mx-auto mb-5">
                    <MessageCircle size={26} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-bcs-black mb-3">報名或詢問？直接聊聊最快</h2>
                <p className="text-bcs-muted mb-8 leading-relaxed">
                    課程內容、客製班、團體包班、或想了解下次開課——點擊下方管道，我們會親自回覆。
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <a
                        href={LINE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-colors shadow-sm hover:shadow"
                        style={{ backgroundColor: '#06C755' }}
                    >
                        <MessageCircle size={18} />
                        加入創客世界 LINE
                    </a>
                    <a
                        href={IG_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline inline-flex items-center justify-center gap-2 px-6 py-3"
                    >
                        <Instagram size={18} />
                        追蹤 IG @sr2026space
                    </a>
                </div>
            </div>
        </Reveal>
    );
}

const STATUS_TABS = ['全部', '可報名', '報名截止', '已結束'];

export default function MakerWorld() {
    usePageMeta('創客世界', '比創空間・創客世界——STEAM 教育工作坊、Arduino、3D 列印、雷射切割，週末兒童實作課程，台南永康。');
    const [courses, setCourses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('全部');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    useEffect(() => {
        Promise.all([
            fetchCourses().catch(err => { console.error(err); return []; }),
            fetchLocations({ onlyActive: true }).catch(err => { console.error(err); return []; }),
        ]).then(([c, l]) => {
            setCourses(c);
            setLocations(l);
        }).finally(() => setIsLoading(false));
    }, []);

    // 即將開課（未過期、仍開放報名）取前 3 筆
    const upcomingCourses = useMemo(() => {
        const now = new Date();
        return courses
            .filter(c => new Date(c.date) >= now && getStatus(c) === 'open')
            .slice(0, 3);
    }, [courses]);

    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            if (activeFilter === '全部') return true;
            const s = getStatus(c);
            if (activeFilter === '可報名') return s === 'open';
            if (activeFilter === '報名截止') return s === 'paused';
            if (activeFilter === '已結束') return s === 'closed';
            return true;
        });
    }, [courses, activeFilter]);

    const counts = STATUS_TABS.reduce((acc, tab) => {
        if (tab === '全部') { acc[tab] = courses.length; return acc; }
        const s = tab === '可報名' ? 'open' : tab === '報名截止' ? 'paused' : 'closed';
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
                    <p className="text-lg text-bcs-muted max-w-2xl mx-auto leading-relaxed mb-8">
                        結合 STEAM 教育理念，透過 Arduino、3D 列印、雷射切割等實作課程，
                        激發孩子的創造力與邏輯思維。週末帶小朋友一起玩！
                    </p>

                    {/* Hero 內嵌 CTA */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href={LINE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white shadow-sm hover:shadow transition-all"
                            style={{ backgroundColor: '#06C755' }}
                        >
                            <MessageCircle size={16} />
                            加入官方 LINE 詢問
                        </a>
                        {upcomingCourses.length > 0 && (
                            <a href="#upcoming" className="btn-maker">
                                看即將開課
                                <ChevronRight size={14} />
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ── 即將開課（重點首屏） ── */}
            {!isLoading && upcomingCourses.length > 0 && (
                <section id="upcoming" className="max-w-7xl mx-auto px-6 pt-14">
                    <Reveal className="flex items-end justify-between mb-6 flex-wrap gap-3">
                        <div>
                            <span className="badge-maker mb-2 inline-block">Upcoming</span>
                            <h2 className="text-2xl sm:text-3xl font-black text-bcs-black">即將開課</h2>
                        </div>
                        <p className="text-sm text-bcs-muted">手刀報名，每堂席次有限</p>
                    </Reveal>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingCourses.map((c, i) => (
                            <Reveal key={c.id} delay={i * 60}>
                                <CourseCard course={c} />
                            </Reveal>
                        ))}
                    </div>
                </section>
            )}

            {/* ── 全部課程（列表 / 月曆） ── */}
            <section className="max-w-7xl mx-auto px-6 py-14">
                <Reveal className="flex items-end justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <span className="badge-maker mb-2 inline-block">All Courses</span>
                        <h2 className="text-2xl sm:text-3xl font-black text-bcs-black">所有課程</h2>
                    </div>

                    {/* 視圖切換 */}
                    {!isLoading && courses.length > 0 && (
                        <div className="inline-flex p-1 bg-bcs-gray rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                                    viewMode === 'list' ? 'bg-white text-maker-600 shadow-sm' : 'text-bcs-muted hover:text-bcs-black'
                                }`}
                            >
                                <List size={14} /> 列表
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                                    viewMode === 'calendar' ? 'bg-white text-maker-600 shadow-sm' : 'text-bcs-muted hover:text-bcs-black'
                                }`}
                            >
                                <CalendarDays size={14} /> 月曆
                            </button>
                        </div>
                    )}
                </Reveal>

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <SkeletonCourseCard key={i} />)}
                    </div>
                )}

                {!isLoading && courses.length === 0 && (
                    <div className="text-center py-20">
                        <GraduationCap size={48} className="text-maker-200 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-bcs-black mb-2">課程籌備中</h3>
                        <p className="text-bcs-muted mb-6">敬請期待即將推出的 STEAM 課程！</p>
                        <a
                            href={IG_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-maker inline-flex items-center gap-2"
                        >
                            <Instagram size={16} />
                            追蹤 IG 掌握最新課程消息
                        </a>
                    </div>
                )}

                {/* 月曆視圖 */}
                {!isLoading && courses.length > 0 && viewMode === 'calendar' && (
                    <CourseCalendar courses={courses} />
                )}

                {/* 列表視圖 */}
                {!isLoading && courses.length > 0 && viewMode === 'list' && (
                    <>
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

                        {filteredCourses.length === 0 ? (
                            <div className="text-center py-16 text-bcs-muted">
                                <p className="font-semibold mb-1">此分類目前沒有課程</p>
                                <button onClick={() => setActiveFilter('全部')} className="text-maker-500 font-bold text-sm mt-2 hover:underline">
                                    查看全部課程
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCourses.map((c, i) => (
                                    <Reveal key={c.id} delay={i * 60}>
                                        <CourseCard course={c} />
                                    </Reveal>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* ── 精選照片牆 ── */}
            <HighlightsGallery courses={courses} />

            {/* ── 上課地點 ── */}
            <LocationsSection locations={locations} />

            {/* ── 詢問管道 CTA ── */}
            <ContactCta />
        </div>
    );
}
