import { useState, useEffect } from 'react';
import { fetchRegistrations, updateRegistrationStatus } from '../../lib/registrationService';
import { fetchCourses } from '../../lib/courseService';

const STATUS_OPTIONS = [
    { value: 'confirmed', label: '已確認', color: 'text-blue-700 bg-blue-50' },
    { value: 'attended', label: '已出席', color: 'text-green-700 bg-green-50' },
    { value: 'absent', label: '未出席', color: 'text-orange-700 bg-orange-50' },
    { value: 'cancelled', label: '已取消', color: 'text-gray-500 bg-gray-100' },
];

function statusStyle(status) {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

export const AdminRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCourses().then(setCourses).catch(console.error);
    }, []);

    useEffect(() => {
        load(selectedCourseId || null);
    }, [selectedCourseId]);

    async function load(courseId) {
        setIsLoading(true);
        try {
            setRegistrations(await fetchRegistrations(courseId));
        } catch (e) {
            alert('載入失敗：' + e.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleStatusChange(id, newStatus) {
        try {
            await updateRegistrationStatus(id, newStatus);
            setRegistrations(prev =>
                prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
            );
        } catch (e) {
            alert('更新失敗：' + e.message);
        }
    }

    // 匯出 CSV
    function handleExport() {
        const headers = ['課程', '日期', '家長姓名', '電話', 'Email', '孩童年齡', '備注', '狀態', '報名時間'];
        const rows = registrations.map(r => [
            r.courses?.title || '',
            r.courses?.date ? new Date(r.courses.date).toLocaleDateString('zh-TW') : '',
            r.parent_name,
            r.phone,
            r.email || '',
            r.child_age || '',
            r.note || '',
            statusStyle(r.status).label,
            new Date(r.created_at).toLocaleString('zh-TW'),
        ]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registrations_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <h1 className="text-2xl font-bold text-gray-800">報名管理 (Registrations)</h1>
                <div className="flex items-center gap-3">
                    {/* 課程篩選 */}
                    <select
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maker-500"
                    >
                        <option value="">全部課程</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.title} ({new Date(c.date).toLocaleDateString('zh-TW')})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        匯出 CSV
                    </button>
                </div>
            </div>

            {/* 統計列 */}
            {!isLoading && registrations.length > 0 && (
                <div className="flex gap-4 mb-4 flex-wrap">
                    {STATUS_OPTIONS.map(s => {
                        const count = registrations.filter(r => r.status === s.value).length;
                        if (count === 0) return null;
                        return (
                            <div key={s.value} className={`px-3 py-1 rounded-full text-xs font-bold ${s.color}`}>
                                {s.label} {count} 人
                            </div>
                        );
                    })}
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                        共 {registrations.length} 筆
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-20 text-gray-400">載入中...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="p-4">課程 / 日期</th>
                                    <th className="p-4">家長資訊</th>
                                    <th className="p-4">孩童年齡</th>
                                    <th className="p-4">備注</th>
                                    <th className="p-4">報名時間</th>
                                    <th className="p-4">狀態</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {registrations.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">目前沒有報名紀錄</td>
                                    </tr>
                                )}
                                {registrations.map(r => {
                                    const st = statusStyle(r.status);
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-900">{r.courses?.title || '（已刪除課程）'}</div>
                                                <div className="text-xs text-gray-400">
                                                    {r.courses?.date ? new Date(r.courses.date).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-900">{r.parent_name}</div>
                                                <div className="text-xs text-gray-500">{r.phone}</div>
                                                {r.email && <div className="text-xs text-gray-400">{r.email}</div>}
                                            </td>
                                            <td className="p-4 text-gray-700">
                                                {r.child_age ? `${r.child_age} 歲` : '—'}
                                            </td>
                                            <td className="p-4 text-gray-500 max-w-[200px]">
                                                <span className="truncate block" title={r.note}>{r.note || '—'}</span>
                                            </td>
                                            <td className="p-4 text-xs text-gray-400">
                                                {new Date(r.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={r.status}
                                                    onChange={e => handleStatusChange(r.id, e.target.value)}
                                                    className={`text-xs font-bold px-2 py-1 rounded border-0 outline-none cursor-pointer ${st.color}`}
                                                >
                                                    {STATUS_OPTIONS.map(s => (
                                                        <option key={s.value} value={s.value}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
