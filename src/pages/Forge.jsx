import { useState, useEffect } from 'react';
import {
    Hammer, Package, Blocks, ArrowRight, CheckCircle,
    ChevronLeft, ChevronRight, Upload, Loader2, Tag,
    ClipboardList, Wrench, Zap,
} from 'lucide-react';
import { fetchPortfolio } from '../lib/forgeService';
import { usePageMeta } from '../hooks/usePageMeta';
import { SkeletonPortfolioGrid } from '../components/ui/Skeleton';
import { uploadFile } from '../lib/storageService';
import { submitCustomQuote, getQuoteMaterials } from '../lib/quoteService';
import { notifyGAS } from '../lib/webhookService';

// ─── Service data ─────────────────────────────────────────────

const SERVICES = [
    {
        icon: <Blocks size={32} className="text-forge-500" />,
        title: '雷射切割 / 雕刻',
        desc: '精密切割木板、壓克力、不織布等材質，大面積表面雕刻，快速交件。',
        specs: ['最大幅面 600 × 400 mm', '厚度 ≤ 12 mm', '接受 AI / DXF / SVG / PDF'],
    },
    {
        icon: <Package size={32} className="text-forge-500" />,
        title: 'FDM 3D 列印',
        desc: '工業規格 FDM 印表機，支援 PLA / PETG / ABS / TPU，原型打樣一日出件。',
        specs: ['最大體積 250 × 250 × 300 mm', '最小層高 0.12 mm', '接受 STL / STEP / OBJ'],
    },
    {
        icon: <Wrench size={32} className="text-forge-500" />,
        title: '機構顧問打樣',
        desc: '黃詣工程師提供機構干涉檢查、公差建議，助你避免迭代成本。',
        specs: ['Solidworks / Fusion360', '公差分析', '組裝驗證建議'],
    },
];

const STEPS = [
    { step: '01', title: '填寫報價表單', desc: '選擇製程、上傳檔案、填寫尺寸與聯絡方式。' },
    { step: '02', title: '工程師評估報價', desc: '3 個工作天內，以 Email 或 LINE 回覆正式報價。' },
    { step: '03', title: '確認後開始製作', desc: '客戶確認報價 → 付款 → 安排生產，完成後通知取件或寄送。' },
];

const MATERIAL_TAGS = ['全部', '雷射切割', '3D列印', '複合'];

// ─── Portfolio Gallery ────────────────────────────────────────

function PortfolioGallery() {
    const [items, setItems] = useState([]);
    const [activeTag, setActiveTag] = useState('全部');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPortfolio()
            .then(setItems)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = activeTag === '全部'
        ? items
        : items.filter(i => i.material === activeTag);

    return (
        <section id="portfolio" className="max-w-6xl mx-auto px-4 py-20">
            <div className="text-center mb-12">
                <span className="inline-flex items-center gap-2 bg-forge-100 text-forge-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
                    <Zap size={14} /> 作品集
                </span>
                <h2 className="text-3xl font-black text-bcs-black">過去製作實績</h2>
            </div>

            {/* Tag filter */}
            <div className="flex gap-3 flex-wrap justify-center mb-10">
                {MATERIAL_TAGS.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeTag === tag
                            ? 'bg-forge-500 text-white'
                            : 'bg-white border border-bcs-border text-bcs-muted hover:border-forge-300 hover:text-forge-600'}`}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {loading && <SkeletonPortfolioGrid count={8} />}

            {!loading && filtered.length === 0 && (
                <p className="text-center text-bcs-muted py-16">尚無作品，敬請期待。</p>
            )}

            {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filtered.map(item => (
                        <div key={item.id} className="group relative overflow-hidden rounded-card bg-forge-50 aspect-square">
                            <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                                <p className="text-white font-bold text-sm leading-snug">{item.title}</p>
                                {item.material && (
                                    <span className="inline-block mt-1 bg-forge-500/80 text-white text-xs px-2 py-0.5 rounded-full">
                                        {item.material}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

// ─── Quote Form (ported from CustomQuote.jsx) ─────────────────

function QuoteForm() {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [materialsOptions, setMaterialsOptions] = useState([]);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
    const [fileError, setFileError] = useState('');

    const [formData, setFormData] = useState({
        method: '',
        material: '',
        infill: '',
        layerHeight: '',
        needVectorService: false,
        file: null,
        dimX: '', dimY: '', dimZ: '',
        needOptimization: false,
        name: '', email: '', lineId: '', notes: '',
    });

    useEffect(() => {
        setIsLoadingMaterials(true);
        getQuoteMaterials()
            .then(data => setMaterialsOptions(data.filter(m => m.is_active)))
            .catch(console.error)
            .finally(() => setIsLoadingMaterials(false));
    }, []);

    const handleMethodSelect = (method) => {
        setFormData(prev => ({
            ...prev, method, material: '', infill: '', layerHeight: '',
            needVectorService: false, file: null, dimX: '', dimY: '', dimZ: '',
        }));
        setFileError('');
        setStep(2);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFileError('');
        if (!file) { setFormData(prev => ({ ...prev, file: null })); return; }
        if (file.size > 50 * 1024 * 1024) {
            setFileError('檔案大小不能超過 50MB。');
            e.target.value = null;
            return;
        }
        const ext = file.name.split('.').pop().toLowerCase();
        if (formData.method === 'laser' && !['ai', 'dxf', 'svg', 'pdf'].includes(ext)) {
            setFileError('雷射切割僅支援 .ai, .dxf, .svg, .pdf 格式。');
            e.target.value = null;
            return;
        }
        if (formData.method === '3dprint' && !['stl', 'step', 'stp', 'obj'].includes(ext)) {
            setFileError('3D 列印僅支援 .stl, .step, .stp, .obj 格式。');
            e.target.value = null;
            return;
        }
        setFormData(prev => ({ ...prev, file }));
    };

    const isStep2Valid = () => {
        if (!formData.material) return false;
        if (formData.method === '3dprint' && (!formData.infill || !formData.layerHeight)) return false;
        return true;
    };

    const isStep3Valid = () => formData.file && formData.dimX && formData.dimY && formData.dimZ;
    const isStep4Valid = () => formData.name && formData.email;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isStep4Valid()) return;
        setIsSubmitting(true);
        try {
            let fileUrl = null;
            let fileName = null;
            if (formData.file) {
                fileUrl = await uploadFile(formData.file);
                fileName = formData.file.name;
            }
            const quoteId = `QT-${Date.now().toString().slice(-6)}`;
            const specifications = formData.method === 'laser'
                ? { needVectorService: formData.needVectorService }
                : { infill: formData.infill, layerHeight: formData.layerHeight };
            const quoteData = {
                quote_id: quoteId,
                method: formData.method,
                material: formData.material,
                specifications,
                dimensions: { dimX: Number(formData.dimX), dimY: Number(formData.dimY), dimZ: Number(formData.dimZ) },
                file_url: fileUrl,
                file_name: fileName,
                customer: { name: formData.name, email: formData.email, lineId: formData.lineId || '' },
                need_optimization: formData.needOptimization,
                notes: formData.notes,
                status: 'pending',
            };
            await submitCustomQuote(quoteData);
            notifyGAS({ type: 'custom_quote', ...quoteData }, 'custom_quote');
            setIsSubmitted(true);
        } catch (err) {
            console.error(err);
            alert(err.message || '送出失敗，請稍後再試或直接聯繫我們。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const STEP_LABELS = ['製造方式', '材質規格', '圖檔尺寸', '聯絡資訊'];

    if (isSubmitted) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <CheckCircle size={64} className="mx-auto text-forge-500 mb-6" />
                <h3 className="text-2xl font-bold text-bcs-black mb-3">已收到您的需求！</h3>
                <p className="text-bcs-muted">工程師將於 3 個工作天內以 Email 或 LINE 回覆正式報價。</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto bg-white border border-bcs-border rounded-card p-6 md:p-10 shadow-sm">
            {/* Progress */}
            <div className="flex items-center justify-between mb-10 relative">
                <div className="absolute left-10 right-10 h-0.5 bg-bcs-border top-4 -z-10" />
                {STEP_LABELS.map((label, i) => {
                    const s = i + 1;
                    return (
                        <div key={s} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === s
                                ? 'bg-forge-500 text-white ring-4 ring-forge-100'
                                : step > s
                                    ? 'bg-forge-200 text-forge-700'
                                    : 'bg-gray-100 text-gray-400'}`}>
                                {step > s ? '✓' : s}
                            </div>
                            <span className={`text-xs hidden sm:block font-medium ${step === s ? 'text-forge-700' : 'text-bcs-muted'}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Step 1 */}
            {step === 1 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-bcs-black text-center mb-6">請選擇製造方式</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { method: 'laser', icon: <Blocks size={48} className="text-forge-500 mb-4" />, title: '雷射切割 / 雕刻', desc: '適合平面切割、表面雕刻，木板、壓克力、不織布均可。' },
                            { method: '3dprint', icon: <Package size={48} className="text-forge-500 mb-4" />, title: 'FDM 3D 列印', desc: '適合立體機構成型、工業原型開發、客製零件製造。' },
                        ].map(opt => (
                            <button
                                key={opt.method}
                                onClick={() => handleMethodSelect(opt.method)}
                                className="border-2 border-bcs-border hover:border-forge-500 rounded-card p-8 flex flex-col items-center text-center transition-all hover:shadow-card-hover hover:-translate-y-1 bg-forge-50 hover:bg-white"
                            >
                                {opt.icon}
                                <h4 className="text-lg font-bold text-bcs-black">{opt.title}</h4>
                                <p className="text-bcs-muted text-sm mt-2 leading-relaxed">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-bcs-black mb-6 pb-2 border-b border-bcs-border">材質與規格選擇</h3>

                    {isLoadingMaterials ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-forge-500" /></div>
                    ) : (
                        <div className="bg-forge-50 p-6 rounded-xl border border-forge-100 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-bcs-black mb-2">
                                    {formData.method === 'laser' ? '加工材質' : '工業線材'} *
                                </label>
                                <select
                                    className="w-full p-3 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500 focus:border-forge-500 bg-white"
                                    value={formData.material}
                                    onChange={e => setFormData(p => ({ ...p, material: e.target.value }))}
                                >
                                    <option value="">請選擇材質</option>
                                    {materialsOptions
                                        .filter(m => m.method === formData.method)
                                        .map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                </select>
                            </div>

                            {formData.method === 'laser' && (
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 mt-0.5 text-forge-500 rounded"
                                        checked={formData.needVectorService}
                                        onChange={e => setFormData(p => ({ ...p, needVectorService: e.target.checked }))}
                                    />
                                    <span className="text-sm text-bcs-muted">
                                        <span className="font-bold text-bcs-black block mb-1">需要向量繪圖 / 線條調整服務</span>
                                        圖檔非向量格式或需要轉換為可切割路徑，請勾選。設計師協助處理，可能產生額外費用。
                                    </span>
                                </label>
                            )}

                            {formData.method === '3dprint' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-bcs-black mb-2">內部填充率 *</label>
                                        <select
                                            className="w-full p-3 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500 bg-white"
                                            value={formData.infill}
                                            onChange={e => setFormData(p => ({ ...p, infill: e.target.value }))}
                                        >
                                            <option value="">請選擇填充率</option>
                                            <option value="Standard">標準強度 Standard (15–20%)</option>
                                            <option value="HighStrength">高強度 High Strength (40–60%)</option>
                                            <option value="Solid">純實心 Solid (100%)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-bcs-black mb-2">表面層高 *</label>
                                        <select
                                            className="w-full p-3 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500 bg-white"
                                            value={formData.layerHeight}
                                            onChange={e => setFormData(p => ({ ...p, layerHeight: e.target.value }))}
                                        >
                                            <option value="">請選擇層高</option>
                                            <option value="Fine">精細 0.12 mm（最平滑，耗時較長）</option>
                                            <option value="Standard">標準 0.20 mm（CP值高）</option>
                                            <option value="Draft">草稿 0.28 mm（快速驗證）</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setStep(1)} className="btn-outline flex items-center gap-2">
                            <ChevronLeft size={16} /> 返回
                        </button>
                        <button onClick={() => setStep(3)} disabled={!isStep2Valid()} className="btn-forge flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            確認規格 <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-bcs-black mb-6 pb-2 border-b border-bcs-border">圖檔上傳與尺寸</h3>

                    <div className="border-2 border-dashed border-bcs-border bg-forge-50 rounded-xl p-10 text-center hover:bg-forge-50/80 transition-colors">
                        <Upload size={40} className="mx-auto text-forge-400 mb-4" />
                        <p className="text-sm font-medium text-bcs-muted mb-1">
                            {formData.method === 'laser'
                                ? '接受格式：.ai, .dxf, .svg, .pdf'
                                : '接受格式：.stl, .step, .stp, .obj'}
                        </p>
                        <p className="text-xs text-bcs-muted/70 mb-5">最大 50MB</p>
                        <input
                            type="file"
                            id="quoteFile"
                            className="hidden"
                            accept={formData.method === 'laser' ? '.ai,.dxf,.svg,.pdf' : '.stl,.step,.stp,.obj'}
                            onChange={handleFileChange}
                        />
                        <label htmlFor="quoteFile" className="btn-outline cursor-pointer inline-block">
                            選擇檔案
                        </label>
                        {formData.file && (
                            <p className="mt-4 text-sm text-forge-700 font-medium">
                                ✅ {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        )}
                        {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-bcs-black mb-2">成品最大包絡尺寸（mm）*</label>
                        <p className="text-xs text-bcs-muted bg-forge-50 border border-forge-100 rounded-lg px-3 py-2 mb-4">
                            ⚠️ 請提供匯出檔案的絕對尺寸，以避免公制/英制轉換異常造成加工錯誤。
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[['dimX', 'X 軸（長）'], ['dimY', 'Y 軸（寬）'], ['dimZ', 'Z 軸（高/厚）']].map(([key, label]) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-bcs-muted mb-1 uppercase tracking-wide">{label}</label>
                                    <div className="relative">
                                        <input
                                            type="number" min="0" step="0.1" placeholder="0"
                                            className="w-full p-3 pr-10 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500"
                                            value={formData[key]}
                                            onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                                        />
                                        <span className="absolute right-3 top-3 text-xs text-bcs-muted">mm</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button onClick={() => setStep(2)} className="btn-outline flex items-center gap-2">
                            <ChevronLeft size={16} /> 返回
                        </button>
                        <button onClick={() => setStep(4)} disabled={!isStep3Valid()} className="btn-forge flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            填寫聯絡方式 <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-xl font-bold text-bcs-black mb-6 pb-2 border-b border-bcs-border">聯絡資訊</h3>

                    <div className="bg-forge-50 border border-forge-100 rounded-xl p-5">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 mt-0.5 text-forge-500 rounded"
                                checked={formData.needOptimization}
                                onChange={e => setFormData(p => ({ ...p, needOptimization: e.target.checked }))}
                            />
                            <span className="text-sm">
                                <span className="font-bold text-bcs-black block mb-1">需要機構工程優化建議（選填）</span>
                                <span className="text-bcs-muted">干涉檢查、公差調整、結構強度初步評估。可能產生額外工程顧問費用。</span>
                            </span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-bcs-black mb-2">姓名 *</label>
                            <input
                                type="text" required placeholder="以利我們稱呼您"
                                className="w-full p-3 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500"
                                value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-bcs-black mb-2">Email *</label>
                            <input
                                type="email" required placeholder="your@email.com"
                                className="w-full p-3 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500"
                                value={formData.email}
                                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-bcs-black mb-2">LINE ID（選填，溝通最快）</label>
                            <input
                                type="text" placeholder="可供搜尋的 LINE ID"
                                className="w-full p-3 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500"
                                value={formData.lineId}
                                onChange={e => setFormData(p => ({ ...p, lineId: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-bcs-black mb-2">備注（顏色、後處理、公差、特殊要求）</label>
                        <textarea
                            className="w-full p-4 border border-bcs-border rounded-lg focus:ring-2 focus:ring-forge-500 h-28 resize-none"
                            placeholder="如有特殊要求請在此說明..."
                            value={formData.notes}
                            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t border-bcs-border">
                        <button type="button" onClick={() => setStep(3)} className="btn-outline flex items-center justify-center gap-2">
                            <ChevronLeft size={16} /> 返回
                        </button>
                        <button
                            type="submit"
                            disabled={!isStep4Valid() || isSubmitting}
                            className="btn-forge flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
                            {isSubmitting ? '送出中...' : '送出評估需求'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────

export default function Forge() {
    usePageMeta('鍛造工坊', '比創空間・鍛造工坊——雷射切割、FDM 3D 列印、機構顧問打樣，台南快速接單，3 工作天報價。');
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="bg-forge-50 border-b border-forge-100">
                <div className="max-w-5xl mx-auto px-4 py-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-forge-500/10 text-forge-700 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                        <Hammer size={14} /> 鍛造工坊
                    </div>
                    <h1 className="text-5xl font-black text-bcs-black mb-4 leading-tight">
                        想法交給我們，<br className="hidden sm:block" />你專注在設計
                    </h1>
                    <p className="text-bcs-muted text-lg max-w-xl mx-auto mb-8">
                        雷射切割、FDM 3D 列印、機構顧問一站整合。從 CAD 檔到成品，快速、精確、有工程師陪跑。
                    </p>
                    <a
                        href="#quote"
                        className="inline-flex items-center gap-2 bg-forge-500 hover:bg-forge-700 text-white font-bold px-8 py-3.5 rounded-btn transition-colors text-base"
                    >
                        立即申請報價 <ArrowRight size={18} />
                    </a>
                </div>
            </section>

            {/* Services */}
            <section className="max-w-5xl mx-auto px-4 py-20">
                <h2 className="text-2xl font-black text-bcs-black text-center mb-12">提供服務</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {SERVICES.map(svc => (
                        <div key={svc.title} className="bg-white border border-bcs-border rounded-card p-7 hover:border-forge-300 hover:shadow-card-hover transition-all">
                            <div className="w-14 h-14 bg-forge-50 rounded-xl flex items-center justify-center mb-5">
                                {svc.icon}
                            </div>
                            <h3 className="text-lg font-bold text-bcs-black mb-2">{svc.title}</h3>
                            <p className="text-bcs-muted text-sm leading-relaxed mb-4">{svc.desc}</p>
                            <ul className="space-y-1">
                                {svc.specs.map(s => (
                                    <li key={s} className="flex items-center gap-2 text-xs text-bcs-muted">
                                        <span className="w-1.5 h-1.5 rounded-full bg-forge-400 flex-shrink-0" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* Process Steps */}
            <section className="bg-forge-50 border-y border-forge-100">
                <div className="max-w-5xl mx-auto px-4 py-16">
                    <h2 className="text-2xl font-black text-bcs-black text-center mb-12">服務流程</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {STEPS.map((s, i) => (
                            <div key={s.step} className="flex gap-5 items-start">
                                <div className="text-4xl font-black text-forge-200 leading-none flex-shrink-0 select-none">
                                    {s.step}
                                </div>
                                <div>
                                    <h3 className="font-bold text-bcs-black mb-1">{s.title}</h3>
                                    <p className="text-bcs-muted text-sm leading-relaxed">{s.desc}</p>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:flex items-start pt-3 flex-shrink-0">
                                        <ChevronRight size={20} className="text-forge-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Portfolio Gallery */}
            <PortfolioGallery />

            {/* Quote Form */}
            <section id="quote" className="bg-bcs-gray border-t border-bcs-border">
                <div className="max-w-5xl mx-auto px-4 py-20">
                    <div className="text-center mb-12">
                        <span className="inline-flex items-center gap-2 bg-forge-100 text-forge-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
                            <ClipboardList size={14} /> 申請報價
                        </span>
                        <h2 className="text-3xl font-black text-bcs-black mb-3">填寫客製化評估表單</h2>
                        <p className="text-bcs-muted max-w-md mx-auto">3 個工作天內由工程師回覆報價，填表約 3 分鐘。</p>
                    </div>
                    <QuoteForm />
                </div>
            </section>
        </div>
    );
}
