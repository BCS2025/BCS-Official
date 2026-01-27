import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TAIWAN_DATA } from '../lib/taiwanData';
import { Truck, MapPin, Store, Users, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';

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

export default function CustomerInfo({ data, onChange, onShippingCostChange, isFreeShipping }) {
    const [city, setCity] = useState(data.city || '');
    const [district, setDistrict] = useState(data.district || '');

    // Initialize needProof if not present
    useEffect(() => {
        if (data.needProof === undefined) {
            onChange('needProof', 'yes'); // Default to yes
        }
    }, []);

    // Reset district when city changes
    useEffect(() => {
        if (data.city !== city) {
            setCity(data.city);
            setDistrict(data.district || '');
        }
    }, [data.city, data.district]);

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
                                            <span className={`text-sm font-bold ${method.price > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                {method.price > 0 ? `+${formatCurrency(method.price)}` : '免運'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-wood-500 mt-1">{method.description}</p>
                                    </div>
                                </div>
                            );
                        })}
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
                            <div className="md:col-span-2">
                                <Input
                                    id="pickupTime"
                                    label="預計取貨時間"
                                    placeholder="平日 19:00 - 22:00"
                                    value={data.pickupTime || ''}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="flex items-center gap-2 mt-1 text-xs text-wood-500">
                                    <Clock size={12} />
                                    <span>建議取貨時間為平日晚上 19:00 至 22:00</span>
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
                            />
                        </div>
                    )}

                    <Input
                        id="email"
                        label="Email (選填)"
                        type="email"
                        placeholder="接收訂單確認信"
                        value={data.email}
                        onChange={handleChange}
                        className="md:col-span-2"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
