import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchCourseById } from '../lib/courseService';
import { createRegistration } from '../lib/registrationService';
import { usePageMeta } from '../hooks/usePageMeta';

function GalleryViewer({ images }) {
    const [current, setCurrent] = useState(0);
    if (!images || images.length === 0) return null;
    return (
        <div className="space-y-3">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-maker-50">
                <img src={images[current]} alt="" className="w-full h-full object-cover" />
                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrent(i => (i - 1 + images.length) % images.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrent(i => (i + 1) % images.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-maker-500' : 'bg-white/60'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${i === current ? 'border-maker-500' : 'border-transparent'}`}
                        >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function RegistrationForm({ course, onSuccess }) {
    const [form, setForm] = useState({ parentName: '', phone: '', email: '', childAge: '', note: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.parentName.trim() || !form.phone.trim()) {
            alert('家長姓名與聯絡電話為必填');
            return;
        }
        setIsSubmitting(true);
        try {
            await createRegistration({
                courseId: course.id,
                courseTitle: course.title,
                courseDate: new Date(course.date).toLocaleDateString('zh-TW'),
                parentName: form.parentName.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || null,
                childAge: form.childAge ? parseInt(form.childAge) : null,
                note: form.note.trim() || null,
            });
            onSuccess();
        } catch (err) {
            // RLS 錯誤提示
            if (err.message?.includes('row-level security') || err.code === '42501') {
                alert('報名功能設定中，請直接聯繫比創空間完成報名，造成不便請見諒。\n\n聯絡電話：請洽 IG @bcs.tw');
            } else {
                alert('報名失敗：' + err.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-bcs-black">家長姓名 *</label>
                    <input
                        type="text"
                        value={form.parentName}
                        onChange={e => set('parentName', e.target.value)}
                        className="w-full border border-bcs-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-maker-500"
                        placeholder="王小明"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-bcs-black">聯絡電話 *</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={e => set('phone', e.target.value)}
                        className="w-full border border-bcs-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-maker-500"
                        placeholder="09XX-XXX-XXX"
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-bcs-black">Email（選填）</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        className="w-full border border-bcs-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-maker-500"
                        placeholder="example@mail.com"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-bcs-black">孩童年齡（選填）</label>
                    <input
                        type="number"
                        value={form.childAge}
                        onChange={e => set('childAge', e.target.value)}
                        className="w-full border border-bcs-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-maker-500"
                        placeholder="8"
                        min={1}
                        max={18}
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-bold text-bcs-black">備注（選填）</label>
                <textarea
                    value={form.note}
                    onChange={e => set('note', e.target.value)}
                    className="w-full border border-bcs-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-maker-500 resize-none h-20"
                    placeholder="過敏、特殊需求、或想詢問的事項..."
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-maker justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? '送出中...' : '確認報名'}
            </button>
            <p className="text-xs text-bcs-muted text-center">
                提交後將以 Line 及 Email 通知比創空間，我們會再次確認您的報名。
            </p>
        </form>
    );
}

function SuccessScreen({ course, onBack }) {
    return (
        <div className="text-center py-12">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-bcs-black mb-3">報名成功！</h2>
            <p className="text-bcs-muted mb-6 leading-relaxed">
                已收到您的報名申請，我們會盡快與您聯繫確認。<br />
                請保持電話暢通，謝謝！
            </p>
            <div className="inline-block bg-maker-50 border border-maker-100 rounded-2xl p-4 text-left mb-8">
                <div className="text-sm font-bold text-maker-700 mb-1">{course.title}</div>
                <div className="text-sm text-bcs-muted">
                    {new Date(course.date).toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={onBack} className="btn-outline">返回課程列表</button>
                <Link to="/" className="btn-maker">回到首頁</Link>
            </div>
        </div>
    );
}

export default function CourseDetail() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);

    usePageMeta(
        course ? course.title : '課程詳情',
        course ? `${course.title}——比創空間・創客世界課程報名，STEAM 兒童教育，台南永康。` : undefined
    );

    useEffect(() => {
        fetchCourseById(courseId)
            .then(setCourse)
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, [courseId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-bcs-muted">載入中...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <GraduationCap size={48} className="text-maker-200" />
                <h2 className="text-xl font-bold text-bcs-black">找不到此課程</h2>
                <Link to="/makerworld" className="btn-maker">回到課程列表</Link>
            </div>
        );
    }

    const date = new Date(course.date);
    const remaining = course.capacity - course.enrolled;
    const isFull = course.status === 'full' || remaining <= 0;
    const isClosed = course.status === 'closed';
    const canRegister = !isFull && !isClosed;

    // 組合圖片（封面 + gallery）
    const allImages = [
        ...(course.cover_url ? [course.cover_url] : []),
        ...(course.gallery_urls || []),
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* 返回 */}
            <div className="max-w-5xl mx-auto px-6 pt-6">
                <Link to="/makerworld" className="inline-flex items-center gap-1.5 text-maker-500 hover:text-maker-700 transition-colors text-sm font-semibold">
                    <ArrowLeft size={16} />
                    回到課程列表
                </Link>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

                    {/* 左欄：圖片 + 課程說明 */}
                    <div className="lg:col-span-3 space-y-8">
                        <GalleryViewer images={allImages} />

                        <div>
                            <span className="badge-maker mb-3 inline-block">創客世界</span>
                            <h1 className="text-3xl font-black text-bcs-black mt-3 mb-4 leading-snug">{course.title}</h1>

                            {course.description && (
                                <p className="text-bcs-muted leading-relaxed whitespace-pre-line">{course.description}</p>
                            )}
                        </div>
                    </div>

                    {/* 右欄：資訊卡 + 報名表 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 課程資訊卡 */}
                        <div className="card p-6 space-y-4">
                            <div className="text-2xl font-black text-bcs-black">
                                {course.price > 0 ? `NT$ ${course.price.toLocaleString()}` : '免費'}
                            </div>

                            <div className="space-y-3 text-sm text-bcs-muted border-t border-bcs-border pt-4">
                                <div className="flex items-start gap-3">
                                    <Calendar size={15} className="text-maker-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <div className="font-semibold text-bcs-black">
                                            {date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                                        </div>
                                        <div>{date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={15} className="text-maker-500 flex-shrink-0" />
                                    <span>{course.duration_min} 分鐘</span>
                                </div>
                                {(course.min_age || course.max_age) && (
                                    <div className="flex items-center gap-3">
                                        <GraduationCap size={15} className="text-maker-500 flex-shrink-0" />
                                        <span>適合 {course.min_age || 0}{course.max_age ? `–${course.max_age}` : '+'} 歲</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Users size={15} className="text-maker-500 flex-shrink-0" />
                                    <span>
                                        剩餘 <span className={`font-bold ${remaining <= 3 && canRegister ? 'text-red-500' : 'text-maker-600'}`}>{Math.max(0, remaining)}</span> / {course.capacity} 位名額
                                    </span>
                                </div>
                            </div>

                            {isClosed && (
                                <div className="bg-gray-100 text-gray-500 text-sm font-bold text-center py-2 rounded-lg">
                                    此課程已結束
                                </div>
                            )}
                            {!isClosed && isFull && (
                                <div className="bg-orange-50 text-orange-600 text-sm font-bold text-center py-2 rounded-lg">
                                    名額已滿，歡迎關注下次開班
                                </div>
                            )}
                        </div>

                        {/* 報名表單 */}
                        {canRegister && !isSuccess && (
                            <div className="card p-6">
                                <h2 className="text-lg font-black text-bcs-black mb-4">立即報名</h2>
                                <RegistrationForm course={course} onSuccess={() => setIsSuccess(true)} />
                            </div>
                        )}

                        {isSuccess && (
                            <div className="card p-6">
                                <SuccessScreen course={course} onBack={() => window.history.back()} />
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
