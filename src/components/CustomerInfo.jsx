import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';

export default function CustomerInfo({ data, onChange }) {
    const handleChange = (e) => {
        const { id, value } = e.target;
        onChange(id, value);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>訂購人資訊</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <Input
                    id="name"
                    label="姓名"
                    placeholder="請輸入姓名"
                    value={data.name}
                    onChange={handleChange}
                    required
                />
                <Input
                    id="phone"
                    label="電話"
                    type="tel"
                    placeholder="請輸入電話"
                    value={data.phone}
                    onChange={handleChange}
                    required
                />
                <Input
                    id="email"
                    label="Email (選填)"
                    type="email"
                    placeholder="接收訂單確認信"
                    value={data.email}
                    onChange={handleChange}
                    className="md:col-span-2"
                />
                <div className="md:col-span-2 space-y-1">
                    <label htmlFor="address" className="block text-sm font-medium text-wood-800">收件地址</label>
                    <textarea
                        id="address"
                        className="flex min-h-[80px] w-full rounded-md border border-wood-200 bg-white px-3 py-2 text-sm placeholder:text-wood-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="請輸入收件地址"
                        value={data.address}
                        onChange={handleChange}
                        required
                    />
                </div>
            </CardContent>
        </Card>
    );
}
