import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { courseDayKey } from '../../lib/courseDateTime';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// Grid dates are civil-date placeholders at UTC midnight, not course instants.
function startOfMonth(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d, n) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function dateKey(d) {
    return d.toISOString().slice(0, 10);
}

function isSameDay(a, b) {
    return a.getTime() === b.getTime();
}

/** 回傳 6×7 格月曆 Date 陣列（含前後月補齊） */
function buildGrid(monthStart) {
    const firstWeekday = monthStart.getUTCDay();
    const gridStart = new Date(monthStart);
    gridStart.setUTCDate(monthStart.getUTCDate() - firstWeekday);
    return Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setUTCDate(gridStart.getUTCDate() + i);
        return d;
    });
}

function statusOf(course) {
    if (course.status === 'closed') return 'closed';
    if (course.status === 'full') return 'paused';
    return 'open';
}

const STATUS_STYLES = {
    open:   'bg-maker-500 text-white hover:bg-maker-700',
    paused: 'bg-gray-500 text-white hover:bg-gray-600',
    closed: 'bg-gray-300 text-gray-700 hover:bg-gray-400',
};

/**
 * 月曆視圖：顯示當月課程 chip，點擊跳至 /makerworld/:id
 * 若該月無任何課程，會顯示下一個有課程的月份引導。
 */
export default function CourseCalendar({ courses }) {
    const todayKey = useMemo(() => courseDayKey(new Date()), []);
    const today = useMemo(() => new Date(todayKey), [todayKey]);

    // Start in the month of the next course on or after today's Taiwan date.
    const initialMonth = useMemo(() => {
        const upcoming = courses
            .map(c => courseDayKey(c.date))
            .filter(key => key >= todayKey)
            .sort()[0];
        return startOfMonth(upcoming ? new Date(upcoming) : today);
    }, [courses, today, todayKey]);

    const [viewMonth, setViewMonth] = useState(initialMonth);
    const grid = useMemo(() => buildGrid(viewMonth), [viewMonth]);

    const coursesByDay = useMemo(() => {
        const map = {};
        for (const c of courses) {
            const key = courseDayKey(c.date);
            (map[key] ||= []).push(c);
        }
        for (const list of Object.values(map)) list.sort((a, b) => new Date(a.date) - new Date(b.date));
        return map;
    }, [courses]);

    const monthLabel = viewMonth.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', timeZone: 'UTC' });

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-bcs-border">
                <button
                    onClick={() => setViewMonth(m => addMonths(m, -1))}
                    className="w-9 h-9 rounded-full hover:bg-maker-50 flex items-center justify-center text-bcs-muted hover:text-maker-600 transition-colors"
                    aria-label="上個月"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-bcs-black">{monthLabel}</h3>
                    {!isSameDay(viewMonth, startOfMonth(today)) && (
                        <button
                            onClick={() => setViewMonth(startOfMonth(today))}
                            className="text-xs text-maker-500 hover:underline font-semibold"
                        >
                            回到本月
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setViewMonth(m => addMonths(m, 1))}
                    className="w-9 h-9 rounded-full hover:bg-maker-50 flex items-center justify-center text-bcs-muted hover:text-maker-600 transition-colors"
                    aria-label="下個月"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* 星期 */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-bcs-muted bg-bcs-gray/50 border-b border-bcs-border">
                {WEEK_LABELS.map((w, i) => (
                    <div key={w} className={`py-2 ${i === 0 ? 'text-red-400' : ''} ${i === 6 ? 'text-sky-500' : ''}`}>
                        {w}
                    </div>
                ))}
            </div>

            {/* 日期格 */}
            <div className="grid grid-cols-7">
                {grid.map((day, i) => {
                    const inMonth = day.getUTCMonth() === viewMonth.getUTCMonth();
                    const isToday = isSameDay(day, today);
                    const dayCourses = coursesByDay[dateKey(day)] || [];
                    return (
                        <div
                            key={i}
                            data-course-day={dateKey(day)}
                            className={`min-h-[72px] sm:min-h-[96px] border-r border-b border-bcs-border/60 last:border-r-0 p-1.5 sm:p-2 flex flex-col gap-1 ${
                                inMonth ? 'bg-white' : 'bg-bcs-gray/30'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                                        isToday
                                            ? 'bg-maker-500 text-white'
                                            : inMonth
                                            ? 'text-bcs-black'
                                            : 'text-bcs-muted/50'
                                    }`}
                                >
                                    {day.getUTCDate()}
                                </span>
                            </div>
                            {dayCourses.slice(0, 2).map(c => {
                                const s = statusOf(c);
                                return (
                                    <Link
                                        key={c.id}
                                        to={`/makerworld/${c.id}`}
                                        className={`block text-[10px] sm:text-xs font-semibold px-1.5 py-1 rounded leading-tight truncate transition-colors ${STATUS_STYLES[s]}`}
                                        title={c.title}
                                    >
                                        {c.title}
                                    </Link>
                                );
                            })}
                            {dayCourses.length > 2 && (
                                <div className="text-[10px] text-bcs-muted px-1">+{dayCourses.length - 2}</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 圖例 */}
            <div className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-3 border-t border-bcs-border text-xs text-bcs-muted">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-maker-500"></span>
                    可報名
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-gray-500"></span>
                    報名截止
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded bg-gray-300"></span>
                    已結束
                </span>
            </div>
        </div>
    );
}
