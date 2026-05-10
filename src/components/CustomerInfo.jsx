import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TAIWAN_DATA } from '../lib/taiwanData';
import { Store, Calendar, MapPin } from 'lucide-react';
import { calculateLeadDays, getEstimatedShipDate } from '../lib/utils';
import ShippingMethodSelector from './ShippingMethodSelector';
import ProofSelector from './ProofSelector';
import PickupScheduler from './PickupScheduler';
import { MESSAGES } from '../constants/messages';

const CVS_BRAND_OPTIONS = [
    { value: 'UNIMARTC2C', label: '7-11 賣貨便' },
    { value: 'FAMIC2C',    label: '全家店到店' },
    { value: 'HILIFEC2C',  label: '萊爾富店到店' },
    { value: 'OKMARTC2C',  label: 'OK 超商店到店' },
];

const CVS_BRAND_LABEL = Object.fromEntries(CVS_BRAND_OPTIONS.map(o => [o.value, o.label]));

export default function CustomerInfo({
    data,
    onChange,
    onShippingCostChange,
    isFreeShipping,
    totalQuantity,
    proofItems = [],
    products = [],
    pendingStore,
    onConsumePendingStore,
    onClearStore,
    shippingMethods = [],
    allowedShippingIds = null,
    itemsTotal = 0,
}) {
    const [city, setCity] = useState(data.city || '');
    const [district, setDistrict] = useState(data.district || '');
    const [errors, setErrors] = useState({});
    const [cvsBrand, setCvsBrand] = useState(data.cvsStoreBrand || 'UNIMARTC2C');
    const storeFormRef = useRef(null);

    const showProof = proofItems.length > 0;

    const processingDays = calculateLeadDays(totalQuantity);
    const formattedShipDate = getEstimatedShipDate(processingDays).replace(/-/g, '/');

    // 同步 needProof：購物車有客製商品時預設 'yes'，純現貨時強制 'no'
    useEffect(() => {
        if (showProof) {
            if (data.needProof !== 'yes' && data.needProof !== 'no') {
                onChange('needProof', 'yes');
            }
        } else if (data.needProof !== 'no') {
            onChange('needProof', 'no');
        }
    }, [showProof, data.needProof, onChange]);

    // 同步 city/district from parent
    useEffect(() => {
        if (data.city !== city) {
            setCity(data.city);
            setDistrict(data.district || '');
        }
    }, [data.city, data.district, city]);

    // 接收 useLogisticsStore 從 URL/sessionStorage 帶回的選店結果
    useEffect(() => {
        if (!pendingStore || !onConsumePendingStore) return;
        const store = onConsumePendingStore();
        if (!store) return;
        onChange('shippingMethod', 'store');
        // 依當前 DB 設定取 store 物流費用（找不到則 fallback 60）
        const storeMethod = shippingMethods.find(m => m.id === 'store');
        onShippingCostChange?.(storeMethod?.price ?? 60);
        onChange('cvsStoreId', store.cvsStoreId);
        onChange('cvsStoreName', store.cvsStoreName);
        onChange('cvsStoreAddress', store.cvsStoreAddress);
        onChange('cvsStoreBrand', store.cvsStoreBrand);
        if (store.cvsStoreBrand) setCvsBrand(store.cvsStoreBrand);
    }, [pendingStore, onConsumePendingStore, onChange, onShippingCostChange, shippingMethods]);

    const handleMethodChange = (methodId, methodPrice) => {
        onChange('shippingMethod', methodId);
        onShippingCostChange?.(methodPrice);
    };

    const handleCityChange = (e) => {
        const newCity = e.target.value;
        setCity(newCity);
        setDistrict('');
        onChange('city', newCity);
        onChange('district', '');
    };

    const handleDistrictChange = (e) => {
        const newDistrict = e.target.value;
        setDistrict(newDistrict);
        onChange('district', newDistrict);
    };

    const validateField = (id, value) => {
        if (id === 'phone') {
            if (!value) return MESSAGES.VALIDATION.PHONE_REQUIRED;
            if (!/^09\d{8}$/.test(value)) return MESSAGES.VALIDATION.PHONE_FORMAT;
        }
        if (id === 'email') {
            if (!value) return MESSAGES.VALIDATION.EMAIL_REQUIRED;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return MESSAGES.VALIDATION.EMAIL_FORMAT;
        }
        if (id === 'zipCode') {
            if (!value) return MESSAGES.VALIDATION.ZIPCODE_REQUIRED;
            if (!/^\d{3}(\d{2})?$/.test(String(value).trim())) return MESSAGES.VALIDATION.ZIPCODE_FORMAT;
        }
        return '';
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        onChange(id, value);
        const error = validateField(id, value);
        setErrors(prev => ({ ...prev, [id]: error }));
    };

    const handleClearStore = () => {
        onClearStore?.();
        onChange('cvsStoreId', '');
        onChange('cvsStoreName', '');
        onChange('cvsStoreAddress', '');
        onChange('cvsStoreBrand', '');
    };

    const isHomeMethod = data.shippingMethod === 'tcat' || data.shippingMethod === 'post';
    const hasPickedStore = Boolean(data.cvsStoreId);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle>運送與訂購資訊</CardTitle>
                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md mt-2 flex items-start gap-2">
                    <Calendar size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">預計出貨日期：{formattedShipDate} </span>
                        <span className="text-xs block text-blue-600 mt-1">
                            (匯款後約 {processingDays} 個工作天出貨，數量 {totalQuantity} 個)
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">

                <ShippingMethodSelector
                    methods={shippingMethods}
                    allowedIds={allowedShippingIds}
                    selectedMethod={data.shippingMethod}
                    onSelect={handleMethodChange}
                    itemsTotal={itemsTotal}
                />

                {showProof && (
                    <>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-bold text-orange-900">⚠️ 您的購物車中有以下客製化商品需要對稿確認：</p>
                            <ul className="text-sm text-orange-900 space-y-1 pl-4">
                                {proofItems.map(item => {
                                    const p = products.find(pp => pp.id === item.productId);
                                    const fileStatus = item.proofFileLater
                                        ? '稍後上傳'
                                        : (item.proofFile?.name ? `已上傳：${item.proofFile.name}` : '尚未提供檔案');
                                    return (
                                        <li key={item._id} className="list-disc">
                                            {p?.name || item.productName} ×{item.quantity}
                                            <span className="text-xs text-orange-700 ml-2">（{fileStatus}）</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <ProofSelector
                            value={data.needProof}
                            onChange={(val) => onChange('needProof', val)}
                        />
                    </>
                )}

                <div className="border-t border-bcs-border pt-4 grid gap-4 md:grid-cols-2">

                    {/* 共用聯絡欄位 */}
                    <Input
                        id="name"
                        label="訂購人姓名"
                        placeholder="請輸入姓名"
                        value={data.name}
                        onChange={handleChange}
                        error={errors.name}
                    />
                    <Input
                        id="phone"
                        label="聯絡電話"
                        type="tel"
                        placeholder="請輸入電話"
                        value={data.phone}
                        onChange={handleChange}
                        required
                        error={errors.phone}
                    />

                    {/* 超商店到店：綠界 CVS 賣貨便 */}
                    {data.shippingMethod === 'store' && (
                        <div className="md:col-span-2 space-y-3">
                            {hasPickedStore ? (
                                <div className="rounded-lg border border-store-200 bg-store-50 p-4 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Store size={18} className="text-store-500 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-bcs-black">
                                                {CVS_BRAND_LABEL[data.cvsStoreBrand] || '已選門市'}
                                                ：{data.cvsStoreName || '(未取得門市名稱)'}
                                            </div>
                                            <div className="text-xs text-bcs-muted mt-1">
                                                店號 {data.cvsStoreId}
                                                {data.cvsStoreAddress ? ` ・ ${data.cvsStoreAddress}` : ''}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleClearStore}
                                            className="text-xs text-store-500 hover:text-store-700 underline shrink-0"
                                        >
                                            重新選擇
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                                        <Select
                                            id="cvsBrand"
                                            label="選擇超商品牌"
                                            value={cvsBrand}
                                            onChange={(e) => setCvsBrand(e.target.value)}
                                            options={CVS_BRAND_OPTIONS}
                                        />
                                        <form
                                            ref={storeFormRef}
                                            method="POST"
                                            action="/api/logistics/select-store"
                                            target="_self"
                                            className="md:pb-0"
                                        >
                                            <input type="hidden" name="subType" value={cvsBrand} />
                                            <button
                                                type="submit"
                                                className="inline-flex items-center justify-center gap-2 rounded-md bg-store-500 hover:bg-store-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors w-full md:w-auto"
                                            >
                                                <MapPin size={16} />
                                                選擇超商門市
                                            </button>
                                        </form>
                                    </div>
                                    <p className="text-xs text-bcs-muted">
                                        點擊後跳轉至綠界選店頁，選好門市後會自動帶回此頁。
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* 黑貓 / 郵政：宅配地址 */}
                    {isHomeMethod && (
                        <>
                            <Input
                                id="zipCode"
                                label="郵遞區號"
                                placeholder="例如 710"
                                value={data.zipCode || ''}
                                onChange={handleChange}
                                required
                                error={errors.zipCode}
                            />
                            <div className="hidden md:block" aria-hidden />
                            <Select
                                id="city"
                                label="縣市"
                                value={city}
                                onChange={handleCityChange}
                                options={Object.keys(TAIWAN_DATA).map(c => ({ value: c, label: c }))}
                                required
                                error={errors.city}
                            />
                            <Select
                                id="district"
                                label="區域"
                                value={district}
                                onChange={handleDistrictChange}
                                options={city ? TAIWAN_DATA[city].map(d => ({ value: d, label: d })) : []}
                                disabled={!city}
                                required
                                error={errors.district}
                            />
                            <div className="md:col-span-2 space-y-1">
                                <label htmlFor="address" className="block text-sm font-medium text-bcs-black">
                                    詳細地址
                                </label>
                                <textarea
                                    id="address"
                                    className="flex min-h-[80px] w-full rounded-md border border-bcs-border bg-white px-3 py-2 text-sm placeholder:text-bcs-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-300 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="請輸入街道巷弄號樓..."
                                    value={data.address || ''}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.address && <span className="text-xs text-red-500">{errors.address}</span>}
                            </div>
                        </>
                    )}

                    {/* 自取 */}
                    {data.shippingMethod === 'pickup' && (
                        <PickupScheduler
                            pickupLocation={data.pickupLocation}
                            pickupDate={data.pickupDate}
                            pickupTime={data.pickupTime}
                            onChange={onChange}
                            totalQuantity={totalQuantity}
                        />
                    )}

                    <Input
                        id="email"
                        label="Email (必填)"
                        type="email"
                        placeholder="接收訂單確認信與匯款資訊"
                        value={data.email}
                        onChange={handleChange}
                        className="md:col-span-2"
                        required
                        error={errors.email}
                    />

                </div>
            </CardContent>
        </Card>
    );
}
