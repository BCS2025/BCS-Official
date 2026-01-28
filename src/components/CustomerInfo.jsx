import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TAIWAN_DATA } from '../lib/taiwanData';
import { Truck, MapPin, Store, Users, Calendar, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';
import { getProcessingWorkingDays, addWorkingDays, formatDate } from '../lib/dates';

const SHIPPING_METHODS = [
    { id: 'store', name: '超商一般店到店', price: 60, icon: Store, description: '需提供超商門市' },
    { id: 'post', name: '郵局掛號 (小包)', price: 40, icon: Truck, description: '需提供詳細地址' },
    { id: 'pickup', name: '自取', price: 0, icon: MapPin, description: '全家永康勝華店 / 7-11 北園門市' },
    { id: 'friend', name: '親友代領', price: 0, icon: Users, description: '需填寫代領人姓名' },
];

const PICKUP_LOCATIONS = [
    { value: '全家永康勝華店', label: '全家便利商店 永康勝華店' },
    { value: '7-11北園門市', label: '7-ELEVEN 北園門市' },
];

// Time slots generation
const generateTimeSlots = (isWeekend) => {
    const slots = [];
    const startHour = isWeekend ? 8 : 19;
    const endHour = 22; // 22:00

    for (let h = startHour; h <= endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        if (h !== endHour) { // Don't add 22:30 if limit is 22:00, or maybe just hour slots? User asked for 19:00-22:00.
            slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
    }
    return slots.map(t => ({ value: t, label: t }));
};

export default function CustomerInfo({ data, onChange, onShippingCostChange, isFreeShipping, errors = {}, totalQuantity = 0 }) {
    const [city, setCity] = useState(data.city || '');
    const [district, setDistrict] = useState(data.district || '');

    // Calculate Estimated Shipping Date
    const processingDays = getProcessingWorkingDays(totalQuantity);
    const estimatedShipDateObj = addWorkingDays(new Date(), processingDays);
    const minDateStr = formatDate(estimatedShipDateObj);
    const formattedShipDate = `${estimatedShipDateObj.getFullYear()}/${estimatedShipDateObj.getMonth() + 1}/${estimatedShipDateObj.getDate()}`;

    // Initialize needProof if not present
    useEffect(() => {
        if (data.needProof === undefined) {
            onChange('needProof', 'yes'); // Default to yes
        }
    }, [data.needProof, onChange]);

    // Reset district when city changes
    useEffect(() => {
        if (data.city !== city) {
            setCity(data.city);
            setDistrict(data.district || '');
        }
    }, [data.city, data.district, city]);

    // Fix Default Pickup Location logic
    useEffect(() => {
        if (data.shippingMethod === 'pickup' && !data.pickupLocation) {
            onChange('pickupLocation', PICKUP_LOCATIONS[0].value);
        }
    }, [data.shippingMethod, data.pickupLocation, onChange]);

    const handleMethodChange = (methodId) => {
        const method = SHIPPING_METHODS.find(m => m.id === methodId);
        onChange('shippingMethod', methodId);
        if (onShippingCostChange) {
            onShippingCostChange(method.price);
        }
    };

    const handleCityChange = (e) => {
        const newCity = e.target.value;
        setCity(newCity);
        setDistrict(''); // Reset district
        onChange('city', newCity);
        onChange('district', '');
    };

    const handleDistrictChange = (e) => {
        const newDistrict = e.target.value;
        setDistrict(newDistrict);
        onChange('district', newDistrict);
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        onChange(id, value);
    };

    // Calculate time slots based on selected date
    const timeSlots = useMemo(() => {
        if (!data.pickupDate) return [];
        const date = new Date(data.pickupDate);
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6; // Sun or Sat
        return generateTimeSlots(isWeekend);
    }, [data.pickupDate]);

    // Fix Default Pickup Time logic
    useEffect(() => {
        // If we have slots, checking if current time is valid or empty
        if (timeSlots.length > 0) {
            const currentTimeIsValid = timeSlots.some(t => t.value === data.pickupTime);
            if (!data.pickupTime || !currentTimeIsValid) {
                onChange('pickupTime', timeSlots[0].value);
            }
        }
    }, [timeSlots, data.pickupTime, onChange]);

    // Update pickupTime if it becomes invalid for the new date? 
    // Maybe better to just let user re-select if needed, 
    // but if the range changes drastically (e.g. weekday to weekend) 
    // the previous time might still be valid (e.g. 19:00).
    // Use effect to clear time if invalid? For simplicity, we keep it, user can change.

    const currentMethod = SHIPPING_METHODS.find(m => m.id === data.shippingMethod) || SHIPPING_METHODS[0];

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

                {/* Shipping Method Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-wood-800">選擇運送方式</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {SHIPPING_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isSelected = data.shippingMethod === method.id;

                            // Determine display price
                            const originalPrice = method.price;
                            const isFree = isFreeShipping && originalPrice > 0;

                            return (
                                <div
                                    key={method.id}
                                    onClick={() => handleMethodChange(method.id)}
                                    className={`
                                        relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                        ${isSelected
                                            ? 'border-wood-600 bg-wood-50 ring-1 ring-wood-600'
                                            : 'border-wood-200 hover:border-wood-300 bg-white'}
                                    `}
                                >
                                    <div className={`p-2 rounded-full ${isSelected ? 'bg-wood-600 text-white' : 'bg-wood-100 text-wood-600'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-wood-900">{method.name}</span>
                                            <div className="text-right">
                                                {isFree ? (
                                                    <>
                                                        <span className="text-xs text-wood-400 line-through mr-1">${originalPrice}</span>
                                                        <span className="text-sm font-bold text-red-500">免運</span>
                                                    </>
                                                ) : (
                                                    <span className={`text-sm font-bold ${originalPrice > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                        {originalPrice > 0 ? `+${formatCurrency(originalPrice)}` : '免運'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-wood-500 mt-1">{method.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Design Proof Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-wood-800">製作前是否需要對稿 (確認排版圖片)</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div
                            onClick={() => onChange('needProof', 'yes')}
                            className={`
                                relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${data.needProof === 'yes'
                                    ? 'border-wood-600 bg-wood-50 ring-1 ring-wood-600'
                                    : 'border-wood-200 hover:border-wood-300 bg-white'}
                            `}
                        >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${data.needProof === 'yes' ? 'border-wood-600' : 'border-gray-400'}`}>
                                {data.needProof === 'yes' && <div className="w-2 h-2 rounded-full bg-wood-600" />}
                            </div>
                            <div>
                                <span className="font-bold text-wood-900 block text-sm">需要對稿</span>
                                <span className="text-xs text-wood-500">我們會先製作示意圖給您確認，安心有保障</span>
                            </div>
                        </div>

                        <div
                            onClick={() => onChange('needProof', 'no')}
                            className={`
                                relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${data.needProof === 'no'
                                    ? 'border-wood-600 bg-wood-50 ring-1 ring-wood-600'
                                    : 'border-wood-200 hover:border-wood-300 bg-white'}
                            `}
                        >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${data.needProof === 'no' ? 'border-wood-600' : 'border-gray-400'}`}>
                                {data.needProof === 'no' && <div className="w-2 h-2 rounded-full bg-wood-600" />}
                            </div>
                            <div>
                                <span className="font-bold text-wood-900 block text-sm">直接製作 (不需對稿)</span>
                                <span className="text-xs text-wood-500">相信專業，請先確認文字無誤，加快出貨速度</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-wood-100 pt-4 grid gap-4 md:grid-cols-2">
                    {/* Common Fields */}
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

                    {/* Dynamic Fields based on Shipping Method */}

                    {/* Store to Store */}
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

                            {/* Map Links */}
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
                                建議填寫完整「門市名稱」與「店號」以避免寄送錯誤。
                                <br />請點擊上方按鈕查詢門市資訊後複製貼上。
                            </p>
                        </div>
                    )}

                    {/* Post Office - Address */}
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
                                <label htmlFor="address" className="block text-sm font-medium text-wood-800">詳細地址</label>
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

                    {/* Pickup */}
                    {data.shippingMethod === 'pickup' && (
                        <>
                            <div className="md:col-span-2">
                                <Select
                                    id="pickupLocation"
                                    label="取貨地點"
                                    value={data.pickupLocation || ''}
                                    onChange={handleChange}
                                    options={PICKUP_LOCATIONS}
                                    required
                                    error={errors.pickupLocation}
                                />
                            </div>

                            {/* Pickup Date Picker */}
                            <div>
                                <Input
                                    id="pickupDate"
                                    label="預計取貨日期"
                                    type="date"
                                    min={minDateStr}
                                    value={data.pickupDate || ''}
                                    onChange={handleChange}
                                    required
                                    error={errors.pickupDate} // Make sure App.jsx validates this
                                />
                                <span className={cn("text-xs mt-1 block", data.pickupDate ? "text-wood-500" : "text-amber-600")}>
                                    {data.pickupDate ? `※ 請盡量於該日之後取貨` : `※ 最快可取貨日：${formattedShipDate}`}
                                </span>
                            </div>

                            {/* Pickup Time Select */}
                            <div>
                                <Select
                                    id="pickupTime"
                                    label="預計取貨時間"
                                    value={data.pickupTime || ''}
                                    onChange={(e) => onChange('pickupTime', e.target.value)}
                                    options={timeSlots}
                                    disabled={!data.pickupDate}
                                    placeholder={!data.pickupDate ? "請先選擇日期" : "請選擇時間"}
                                    required
                                    error={errors.pickupTime}
                                />
                                <div className="mt-1 text-xs text-wood-500">
                                    平日 19:00-22:00, 假日 08:00-22:00
                                </div>
                            </div>
                        </>
                    )}

                    {/* Friend Pickup */}
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

// Function to help construct cn for classnames if not imported, 
// but since we are replacing the whole file, we should import utility or define it.
// The original file didn't import 'cn'. But we used it in the snippet above.
// Checking previous file content, 'cn' was NOT used in CustomerInfo.
// I should remove 'cn' usage or duplicate it.
function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

