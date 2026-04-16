import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TAIWAN_DATA } from '../lib/taiwanData';
import { Store, Truck, Calendar } from 'lucide-react';
import { calculateLeadDays, getEstimatedShipDate } from '../lib/utils';
import ShippingMethodSelector from './ShippingMethodSelector';
import ProofSelector from './ProofSelector';
import PickupScheduler from './PickupScheduler';
import { MESSAGES } from '../constants/messages';

export default function CustomerInfo({ data, onChange, onShippingCostChange, isFreeShipping, totalQuantity }) {
    const [city, setCity] = useState(data.city || '');
    const [district, setDistrict] = useState(data.district || '');
    const [errors, setErrors] = useState({});

    // Estimated ship date display
    const processingDays = calculateLeadDays(totalQuantity);
    const formattedShipDate = getEstimatedShipDate(processingDays).replace(/-/g, '/');

    // Default needProof if absent
    useEffect(() => {
        if (data.needProof === undefined) {
            onChange('needProof', 'yes');
        }
    }, [data.needProof, onChange]);

    // Sync city/district from parent
    useEffect(() => {
        if (data.city !== city) {
            setCity(data.city);
            setDistrict(data.district || '');
        }
    }, [data.city, data.district, city]);

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
        return '';
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        onChange(id, value);
        const error = validateField(id, value);
        setErrors(prev => ({ ...prev, [id]: error }));
    };

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
                    selectedMethod={data.shippingMethod}
                    onSelect={handleMethodChange}
                    isFreeShipping={isFreeShipping}
                />

                <ProofSelector
                    value={data.needProof}
                    onChange={(val) => onChange('needProof', val)}
                />

                <div className="border-t border-wood-100 pt-4 grid gap-4 md:grid-cols-2">

                    {/* Common contact fields */}
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

                    {/* Store-to-store */}
                    {data.shippingMethod === 'store' && (
                        <div className="md:col-span-2 space-y-2">
                            <Input
                                id="storeName"
                                label="超商門市名稱 / 代號"
                                placeholder="例如：7-11 北園門市 (店號 123456)"
                                value={data.storeName || ''}
                                onChange={handleChange}
                                required
                                error={errors.storeName}
                            />
                            <div className="flex flex-wrap gap-2">
                                <a
                                    href="https://emap.pcsc.com.tw/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-wood-700 bg-wood-50 border border-wood-300 rounded hover:bg-wood-100 transition-colors"
                                >
                                    <Store size={14} />
                                    查詢 7-11 門市
                                </a>
                                <a
                                    href="https://www.family.com.tw/marketing/inquiry.aspx"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-wood-700 bg-wood-50 border border-wood-300 rounded hover:bg-wood-100 transition-colors"
                                >
                                    <Store size={14} />
                                    查詢全家門市
                                </a>
                            </div>
                            <p className="text-xs text-wood-500 pl-1">
                                {MESSAGES.VALIDATION.STORE_NAME_HINT}
                                <br />請點擊上方按鈕查詢門市資訊後複製貼上。
                            </p>
                        </div>
                    )}

                    {/* Postal address */}
                    {data.shippingMethod === 'post' && (
                        <>
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
                                <label htmlFor="address" className="block text-sm font-medium text-wood-800">
                                    詳細地址
                                </label>
                                <textarea
                                    id="address"
                                    className="flex min-h-[80px] w-full rounded-md border border-wood-200 bg-white px-3 py-2 text-sm placeholder:text-wood-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="請輸入街道巷弄號樓..."
                                    value={data.address || ''}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.address && <span className="text-xs text-red-500">{errors.address}</span>}
                            </div>
                        </>
                    )}

                    {/* Pickup scheduling */}
                    {data.shippingMethod === 'pickup' && (
                        <PickupScheduler
                            pickupLocation={data.pickupLocation}
                            pickupDate={data.pickupDate}
                            pickupTime={data.pickupTime}
                            onChange={onChange}
                            totalQuantity={totalQuantity}
                        />
                    )}

                    {/* Friend pickup */}
                    {data.shippingMethod === 'friend' && (
                        <div className="md:col-span-2">
                            <Input
                                id="friendName"
                                label="代領人姓名"
                                placeholder="請輸入代領親友的真實姓名"
                                value={data.friendName || ''}
                                onChange={handleChange}
                                required
                                error={errors.friendName}
                            />
                        </div>
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
