import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TAIWAN_DATA } from '../lib/taiwanData';
import { Truck, MapPin, Store, Users, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';
import { calculateLeadDays } from '../lib/utils';

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

export default function CustomerInfo({ data, onChange, onShippingCostChange, isFreeShipping, totalQuantity }) {
    const [city, setCity] = useState(data.city || '');
    const [district, setDistrict] = useState(data.district || '');

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

    const [errors, setErrors] = useState({});

    // Validation Logic
    const validateField = (id, value) => {
        let error = '';
        if (id === 'phone') {
            const phoneRegex = /^09\d{8}$/;
            if (!value) error = '請輸入電話號碼';
            else if (!phoneRegex.test(value)) error = '請輸入有效的台灣手機號碼 (09xxxxxxxx)';
        }
        if (id === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) error = '請輸入 Email';
            else if (!emailRegex.test(value)) error = '請輸入有效的 Email 格式';
        }
        return error;
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        onChange(id, value);

        // Real-time validation
        const error = validateField(id, value);
        setErrors(prev => ({ ...prev, [id]: error }));
    };

    const currentMethod = SHIPPING_METHODS.find(m => m.id === data.shippingMethod) || SHIPPING_METHODS[0];

    return (
        <Card>
            <CardHeader>
                <CardTitle>運送與訂購資訊</CardTitle>
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
                        required
                    />
                    <Input
                        id="phone"
                        label="聯絡電話"
                        type="tel"
                        placeholder="請輸入電話"
                        value={data.phone}
                        onChange={handleChange}
                        required
                    />
                    {/* Error Message for Phone */}
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}

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
                            />
                            <Select
                                id="district"
                                label="區域"
                                value={district}
                                onChange={handleDistrictChange}
                                options={city ? TAIWAN_DATA[city].map(d => ({ value: d, label: d })) : []}
                                disabled={!city}
                                required
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
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-wood-800 mb-1">
                                    預計取貨日期
                                </label>
                                <input
                                    type="date"
                                    id="pickupDate"
                                    value={data.pickupDate || ''}
                                    min={(() => {
                                        const today = new Date();
                                        const leadDays = calculateLeadDays(totalQuantity);
                                        const minDate = new Date(today);
                                        minDate.setDate(today.getDate() + leadDays);
                                        return minDate.toISOString().split('T')[0];
                                    })()}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-wood-200 bg-white px-3 py-2 text-sm placeholder:text-wood-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                />
                                <p className="text-xs text-wood-500 mt-1">
                                    {(typeof totalQuantity !== 'undefined' && totalQuantity > 50)
                                        ? '大量訂購需約 21 個工作天 (實際交期將主動聯繫確認)'
                                        : (
                                            (() => {
                                                const leadDays = calculateLeadDays(totalQuantity);
                                                return `預計備貨需 ${leadDays} 個工作天`;
                                            })()
                                        )}
                                </p>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-wood-800 mb-1">
                                    預計取貨時間
                                </label>
                                <select
                                    id="pickupTime"
                                    value={data.pickupTime || ''}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-wood-200 bg-white px-3 py-2 text-sm placeholder:text-wood-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                    disabled={!data.pickupDate}
                                >
                                    <option value="" disabled>請選擇時間</option>
                                    {(() => {
                                        if (!data.pickupDate) return null;
                                        const dayOfWeek = new Date(data.pickupDate).getDay(); // 0=Sun, 6=Sat
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                        // Time Slots
                                        // Weekday: 19:00 - 22:00
                                        // Weekend: 09:00 - 22:00
                                        const startHour = isWeekend ? 9 : 19;
                                        const endHour = 22;
                                        const slots = [];

                                        for (let h = startHour; h <= endHour; h++) {
                                            const time = `${h.toString().padStart(2, '0')}:00`;
                                            slots.push(<option key={time} value={time}>{time}</option>);
                                            // Optional: half-hour slots? User said "19:00~22:00", implies range or slots. 
                                            // Let's stick to hour slots for simplicity unless asked.
                                            if (h !== endHour) {
                                                const time30 = `${h.toString().padStart(2, '0')}:30`;
                                                slots.push(<option key={time30} value={time30}>{time30}</option>);
                                            }
                                        }
                                        return slots;
                                    })()}
                                </select>
                                <p className="text-xs text-wood-500 mt-1">
                                    平日 19:00-22:00 / 假日 09:00-22:00
                                </p>
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
                    />
                    {/* Error Message for Email */}
                    {errors.email && <p className="text-red-500 text-xs mt-1 md:col-span-2">{errors.email}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
