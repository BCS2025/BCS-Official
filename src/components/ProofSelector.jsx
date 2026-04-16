export default function ProofSelector({ value, onChange }) {
    const options = [
        {
            id: 'yes',
            label: '需要對稿',
            desc: '我們會先製作示意圖給您確認，安心有保障',
        },
        {
            id: 'no',
            label: '直接製作 (不需對稿)',
            desc: '相信專業，請先確認文字無誤，加快出貨速度',
        },
    ];

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-bcs-black">
                製作前是否需要對稿 (確認排版圖片)
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
                {options.map((opt) => {
                    const isSelected = value === opt.id;
                    return (
                        <div
                            key={opt.id}
                            onClick={() => onChange(opt.id)}
                            className={`
                                relative flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                ${isSelected
                                    ? 'border-store-500 bg-store-50 ring-1 ring-store-500'
                                    : 'border-bcs-border hover:border-bcs-border bg-white'}
                            `}
                        >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-store-500' : 'border-gray-400'}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-store-500" />}
                            </div>
                            <div>
                                <span className="font-bold text-bcs-black block text-sm">{opt.label}</span>
                                <span className="text-xs text-bcs-muted">{opt.desc}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
