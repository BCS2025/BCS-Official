import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ChevronRight, GraduationCap } from 'lucide-react';
import { fetchCourses } from '../lib/courseService';

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
                {/* 狀態 badge */}
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
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCourses()
            .then(setCourses)
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const upcoming = courses.filter(c => c.status !== 'closed');
    const past = courses.filter(c => c.status === 'closed');

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

            <div className="max-w-7xl mx-auto px-6 py-16">

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card animate-pulse">
                                <div className="aspect-[16/9] bg-gray-100" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                                    <div className="h-5 bg-gray-100 rounded w-3/4" />
                                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && upcoming.length === 0 && past.length === 0 && (
                    <div className="text-center py-20">
                        <GraduationCap size={48} className="text-maker-200 mx-auto mb-4" />
                        <h2 className="text-2xl font-black text-bcs-black mb-2">課程籌備中</h2>
                        <p className="text-bcs-muted">敬請期待即將推出的 STEAM 課程，歡迎追蹤我們的 Instagram 掌握最新消息！</p>
                    </div>
                )}

                {/* 即將開始 */}
                {!isLoading && upcoming.length > 0 && (
                    <div className="mb-16">
                        <h2 className="text-2xl font-black text-bcs-black mb-6">即將開班</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcoming.map(c => <CourseCard key={c.id} course={c} />)}
                        </div>
                    </div>
                )}

                {/* 已結束 */}
                {!isLoading && past.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-black text-bcs-black mb-6 text-gray-400">過往課程</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {past.map(c => <CourseCard key={c.id} course={c} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
