import React, { useState } from 'react';
import { Upload, ChevronRight, ChevronLeft, CheckCircle, Package, Blocks } from 'lucide-react';

export default function CustomQuote() {
    const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        method: '', // 'laser' | '3dprint'
        material: '',
        infill: '',
        layerHeight: '',
        needVectorService: false,
        file: null,
        dimX: '',
        dimY: '',
        dimZ: '',
        needOptimization: false,
        name: '',
        email: '',
        lineId: '',
        notes: ''
    });

    const [fileError, setFileError] = useState('');

    const handleMethodSelect = (method) => {
        setFormData(prev => ({
            ...prev,
            method,
            material: '',
            infill: '',
            layerHeight: '',
            needVectorService: false,
            file: null,
            dimX: '', dimY: '', dimZ: ''
        }));
        setFileError('');
        setStep(2);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFileError('');
        if (!file) {
            setFormData(prev => ({ ...prev, file: null }));
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setFileError('檔案大小不能超過 50MB。');
            e.target.value = null;
            return;
        }

        const ext = file.name.split('.').pop().toLowerCase();
        if (formData.method === 'laser') {
            if (!['ai', 'dxf', 'svg', 'pdf'].includes(ext)) {
                setFileError('雷射切割僅支援 .ai, .dxf, .svg, .pdf 格式。');
                e.target.value = null;
                return;
            }
        } else if (formData.method === '3dprint') {
            if (!['stl', 'step', 'stp', 'obj'].includes(ext)) {
                setFileError('3D 列印僅支援 .stl, .step, .stp, .obj 格式。');
                e.target.value = null;
                return;
            }
        }

        setFormData(prev => ({ ...prev, file }));
    };

    const isStep2Valid = () => {
        if (!formData.material) return false;
        if (formData.method === '3dprint') {
            if (!formData.infill || !formData.layerHeight) return false;
        }
        return true;
    };

    const isStep3Valid = () => {
        if (!formData.file) return false;
        if (!formData.dimX || !formData.dimY || !formData.dimZ) return false;
        return true;
    };

    const isStep4Valid = () => {
        if (!formData.name || !formData.email) return false;
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isStep4Valid()) return;
        // Logic for handling submission, potentially uploading file to Supabase Storage
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-wood-100 text-center">
                    <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
                    <h2 className="text-3xl font-bold text-wood-900 mb-4">我們已收到您的需求！</h2>
                    <p className="text-lg text-wood-700">我們的工程師將評估您的檔案與設計需求，並於 3 個工作天內為您提供正式報價與建議。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-wood-100 relative overflow-hidden">
                <h1 className="text-3xl font-bold text-wood-900 mb-8 text-center">鍛造工坊 - 專屬客製化評估</h1>

                {/* Progress Indicators */}
                <div className="flex items-center justify-between mb-10 px-2 relative border-b border-gray-100 pb-8">
                    <div className="absolute left-12 right-12 h-0.5 bg-gray-200 top-4 -z-10"></div>
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === s ? 'bg-amber-600 text-white shadow-md ring-4 ring-amber-50' :
                                    step > s ? 'bg-wood-200 text-wood-700' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {step > s ? '✓' : s}
                            </div>
                            <span className={`text-xs mt-3 hidden sm:block font-medium ${step === s ? 'text-amber-800' : 'text-wood-500'}`}>
                                {s === 1 && '工程製造方式'}
                                {s === 2 && '結構材質規格'}
                                {s === 3 && '精密圖檔尺寸'}
                                {s === 4 && '聯絡顧問資訊'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-wood-800 text-center mb-6">請選擇製造方式</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => handleMethodSelect('laser')}
                                className="border-2 border-wood-200 hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center text-center transition-all hover:shadow-lg bg-wood-50 hover:bg-white min-h-[220px] justify-center"
                            >
                                <Blocks className="w-16 h-16 text-amber-700 mb-4" />
                                <h3 className="text-xl font-bold text-wood-900">雷射切割 / 雕刻</h3>
                                <p className="text-wood-600 mt-2 text-sm leading-relaxed">Laser Cutting & Engraving<br />適用大面積木板、壓克力、不織布切割與快速表面打樣雕刻。</p>
                            </button>
                            <button
                                onClick={() => handleMethodSelect('3dprint')}
                                className="border-2 border-wood-200 hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center text-center transition-all hover:shadow-lg bg-wood-50 hover:bg-white min-h-[220px] justify-center"
                            >
                                <Package className="w-16 h-16 text-amber-700 mb-4" />
                                <h3 className="text-xl font-bold text-wood-900">FDM 3D 列印</h3>
                                <p className="text-wood-600 mt-2 text-sm leading-relaxed">3D Printing<br />適用於實心機構成型、工業產品原型開發設計與立體零件製造。</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-wood-800 mb-6 pb-2 border-b">材質與規格選擇</h2>

                        {formData.method === 'laser' && (
                            <div className="space-y-6 bg-wood-50 p-6 rounded-xl border border-wood-100">
                                <div>
                                    <label className="block text-sm font-bold text-wood-800 mb-2">加工材質 (Material) *</label>
                                    <select
                                        className="w-full xl:w-2/3 p-3 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                        value={formData.material}
                                        onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                    >
                                        <option value="">請選擇材質</option>
                                        <option value="Plywood 3mm">夾板 (Plywood) 3mm</option>
                                        <option value="Plywood 5mm">夾板 (Plywood) 5mm</option>
                                        <option value="MDF 3mm">密集板 (MDF) 3mm</option>
                                        <option value="MDF 5mm">密集板 (MDF) 5mm</option>
                                        <option value="Acrylic Clear">壓克力 (Acrylic) 透明</option>
                                        <option value="Acrylic Black">壓克力 (Acrylic) 黑</option>
                                        <option value="Acrylic White">壓克力 (Acrylic) 白</option>
                                        <option value="Leather">皮革合成材 (Leather)</option>
                                    </select>
                                </div>
                                <div className="flex items-start gap-3 mt-4">
                                    <input
                                        type="checkbox"
                                        id="vectorService"
                                        className="w-5 h-5 mt-0.5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                                        checked={formData.needVectorService}
                                        onChange={(e) => setFormData({ ...formData, needVectorService: e.target.checked })}
                                    />
                                    <label htmlFor="vectorService" className="text-wood-700 leading-relaxed max-w-xl">
                                        <span className="font-semibold text-wood-800">需要向量繪圖/線條調整服務 (Requires vector line drawing/adjustment service)</span>
                                        <br />如果您提供的圖檔非向量格式或需要專人將細節轉換為可雷射切斷的圖形，請勾選此項。我們將由設計師協助處理。(圖檔前置處理會產生額外費用)
                                    </label>
                                </div>
                            </div>
                        )}

                        {formData.method === '3dprint' && (
                            <div className="space-y-6 bg-wood-50 p-6 rounded-xl border border-wood-100">
                                <div>
                                    <label className="block text-sm font-bold text-wood-800 mb-2">工業線材 (Material) *</label>
                                    <select
                                        className="w-full xl:w-2/3 p-3 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                        value={formData.material}
                                        onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                    >
                                        <option value="">請選擇材質</option>
                                        <option value="PLA">PLA (一般環境使用，標準列印)</option>
                                        <option value="PETG">PETG (耐溫性較佳，具有韌性)</option>
                                        <option value="TPU">TPU (彈性材質，防滑避震用)</option>
                                        <option value="ABS">ABS (高硬度高耐溫，需封閉成型)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-wood-800 mb-2">內部填充率 (Infill Density) *</label>
                                    <select
                                        className="w-full xl:w-2/3 p-3 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                        value={formData.infill}
                                        onChange={(e) => setFormData({ ...formData, infill: e.target.value })}
                                    >
                                        <option value="">請選擇填充率</option>
                                        <option value="Standard">標準強度 Standard (15-20%)</option>
                                        <option value="HighStrength">高強度 High Strength (40-60%)</option>
                                        <option value="Solid">純實心 Solid (100%) - 最堅固但耗時且重</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-wood-800 mb-2">表面層高 (Layer Height) *</label>
                                    <select
                                        className="w-full xl:w-2/3 p-3 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                                        value={formData.layerHeight}
                                        onChange={(e) => setFormData({ ...formData, layerHeight: e.target.value })}
                                    >
                                        <option value="">請選擇層高</option>
                                        <option value="Fine">精細 0.12mm (表面最平滑，加工時間長)</option>
                                        <option value="Standard">標準 0.20mm (CP值高且通用)</option>
                                        <option value="Draft">草稿 0.28mm (驗證最快速，表面紋路明顯)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-10">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-2.5 border border-wood-300 text-wood-700 font-medium rounded-full hover:bg-wood-50 transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft size={18} /> 返回上一步
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!isStep2Valid()}
                                className="px-6 py-2.5 bg-amber-600 font-bold text-white rounded-full hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                確認規格並繼續 <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-wood-800 mb-6 pb-2 border-b">圖檔上傳與機具設定尺寸</h2>

                        <div>
                            <label className="block text-sm font-bold text-wood-800 mb-3">上傳檔案 (File Upload) *</label>
                            <div className="border-2 border-dashed border-wood-300 bg-wood-50 rounded-xl p-10 text-center hover:bg-wood-100 transition-colors relative">
                                <Upload className="mx-auto h-12 w-12 text-amber-600/70 mb-4" />
                                <div className="text-sm text-wood-700 font-medium mb-2">
                                    {formData.method === 'laser'
                                        ? '為確保切割順利，請提供 .ai, .dxf, .svg, 或 .pdf 格式'
                                        : '為確保順利轉檔切片，請提供 .stl, .step, .stp, 或 .obj 格式'}
                                </div>
                                <div className="text-xs text-wood-500 mb-6 bg-wood-200/50 inline-block px-3 py-1 rounded-full">最大檔案限制為 50MB</div>
                                <br />
                                <input
                                    type="file"
                                    id="fileUpload"
                                    className="hidden"
                                    accept={formData.method === 'laser' ? '.ai,.dxf,.svg,.pdf' : '.stl,.step,.stp,.obj'}
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="fileUpload"
                                    className="cursor-pointer bg-white border border-wood-300 shadow-sm text-wood-900 font-bold px-6 py-2.5 rounded-lg hover:bg-amber-50 transition-colors inline-block"
                                >
                                    從本機選擇檔案
                                </label>
                                {formData.file && (
                                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium text-sm inline-block mx-auto">
                                        ✅ 檔案就緒: {formData.file.name} / {((formData.file.size || 0) / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                )}
                                {fileError && (
                                    <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm inline-block border border-red-200">{fileError}</div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="block text-sm font-bold text-wood-800 mb-2">成品最大包絡尺寸 (Dimensions in millimeters) *</label>
                            <p className="text-xs text-amber-700 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                ⚠️ 請務必提供匯出模型/圖檔時使用的絕對長寬高尺寸。因軟體轉檔格式容易造成比例失真(公制/英制轉換異常)，若無此尺寸校對，將依工程師判斷直接加工，後果需自行吸收。
                            </p>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-wood-600 mb-2 uppercase tracking-wide">X 軸 (Length)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="例如: 150"
                                            className="w-full p-3 pr-10 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            value={formData.dimX}
                                            onChange={(e) => setFormData({ ...formData, dimX: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-3 text-wood-400 font-medium text-sm">mm</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-wood-600 mb-2 uppercase tracking-wide">Y 軸 (Width)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="例如: 80"
                                            className="w-full p-3 pr-10 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            value={formData.dimY}
                                            onChange={(e) => setFormData({ ...formData, dimY: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-3 text-wood-400 font-medium text-sm">mm</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-wood-600 mb-2 uppercase tracking-wide">Z 軸 (Height/Thickness)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            placeholder="例如: 5"
                                            className="w-full p-3 pr-10 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                            value={formData.dimZ}
                                            onChange={(e) => setFormData({ ...formData, dimZ: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-3 text-wood-400 font-medium text-sm">mm</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-10">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-2.5 border border-wood-300 text-wood-700 font-medium rounded-full hover:bg-wood-50 transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft size={18} /> 重新確認材質
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={!isStep3Valid()}
                                className="px-6 py-2.5 bg-amber-600 font-bold text-white rounded-full hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                填寫聯絡方式 <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-xl font-bold text-wood-800 mb-6 pb-2 border-b">聯絡人與最後設定</h2>

                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 mb-8 shadow-sm">
                            <h3 className="font-bold text-amber-900 mb-3 text-base flex items-center gap-2">
                                🌟 專業進階診斷 (Premium Service)
                            </h3>
                            <div className="flex items-start gap-4 bg-white p-4 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="optimization"
                                    className="w-5 h-5 mt-1 text-amber-600 rounded border-amber-300 focus:ring-amber-500 transition-all cursor-pointer"
                                    checked={formData.needOptimization}
                                    onChange={(e) => setFormData({ ...formData, needOptimization: e.target.checked })}
                                />
                                <label htmlFor="optimization" className="text-sm text-wood-800 cursor-pointer">
                                    <span className="font-bold text-base block mb-2 text-wood-900">Require Mechanical Engineering Optimization? (需要專業機構優化建議)</span>
                                    <span className="text-wood-600 leading-relaxed block">
                                        對於具備組裝性或承受應力之設計，我們的工程師將協助執行: <strong className="text-amber-800">干涉檢查 (Interference check)、公差調整 (Tolerance adjustment)、結構強度初步評估 (Structural evaluation)</strong>。此服務可能有助於避免後續修改圖面的重工成本。(可能會產生額外的工程顧問費用)。
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label className="block text-sm font-bold text-wood-800 mb-2">真實姓名 (Name) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="以利我們稱呼您"
                                    className="w-full p-3 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-wood-800 mb-2">電子郵件 (Email Address) *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="your@email.com"
                                    className="w-full p-3 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-wood-800 mb-2">LINE ID (選填)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="強烈建議提供能搜尋到的 LINE ID，由專人直接一對一訊息溝通速度最快"
                                    value={formData.lineId}
                                    onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-sm font-bold text-wood-800 mb-2">客製細節備註 (Project specifics / Notes)</label>
                            <textarea
                                className="w-full p-4 border border-wood-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-32 resize-none"
                                placeholder="如有指定顏色、後處理要求（如上漆研磨）、公差指定...或是對設計上有疑慮的地方，請在此處說明敘述。"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row justify-between mt-10 pt-6 border-t border-wood-200 gap-4">
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="w-full sm:w-auto px-6 py-3 border border-wood-300 text-wood-700 font-medium rounded-full hover:bg-wood-50 transition-colors flex justify-center items-center gap-2"
                            >
                                <ChevronLeft size={18} /> 檢查尺寸與檔案
                            </button>
                            <button
                                type="submit"
                                disabled={!isStep4Valid()}
                                className="w-full sm:w-auto px-8 py-3 bg-wood-900 text-white font-bold text-lg rounded-full hover:bg-black transition-all flex justify-center items-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-wood-400 group"
                            >
                                送出評估 (Submit for Professional Evaluation)
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
