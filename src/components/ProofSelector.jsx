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
            <label className="block text-sm font-medium text-wood-800">
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
                                    ? 'border-wood-600 bg-wood-50 ring-1 ring-wood-600'
                                    : 'border-wood-200 hover:border-wood-300 bg-white'}
                            `}
                        >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-wood-600' : 'border-gray-400'}`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-wood-600" />}
                            </div>
                            <div>
                                <span className="font-bold text-wood-900 block text-sm">{opt.label}</span>
                                <span className="text-xs text-wood-500">{opt.desc}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
