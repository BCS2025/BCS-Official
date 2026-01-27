import { useState } from 'react';
import { getImageUrl } from '../../lib/imageUtils';
import { cn } from './Button';
import { X, Check, ChevronRight } from 'lucide-react';

export function VisualOptionSelector({ label, options, value, onChange, id, error, className }) {
    const [isOpen, setIsOpen] = useState(false);

    // Find selected option object
    const selectedOption = options.find(opt => opt.value === value) || options[0];

    const handleSelect = (optionValue) => {
        onChange({ target: { id, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="block text-sm font-medium text-wood-800">{label}</label>}

            {/* Selected View (Preview) */}
            <div
                className={cn(
                    "relative flex items-center gap-4 p-3 rounded-lg border border-wood-200 bg-white shadow-sm cursor-pointer hover:border-wood-300 transition-colors",
                    error && "border-red-500"
                )}
                onClick={() => setIsOpen(true)}
            >
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 bg-wood-50 rounded-md overflow-hidden border border-wood-100">
                    {selectedOption?.image ? (
                        <img
                            src={getImageUrl(selectedOption.image)}
                            alt={selectedOption.label}
                            className="w-full h-full object-contain p-1"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-wood-300 text-xs">無圖片</div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-wood-900 truncate">
                        {selectedOption?.label || "請選擇"}
                    </p>
                    <p className="text-xs text-wood-500 mt-0.5">點擊更換款式</p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-wood-400" />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {/* Modal / Drawer Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-wood-100">
                            <h3 className="font-serif font-bold text-lg text-wood-900">選擇{label}</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-wood-100 rounded-full text-wood-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="flex-1 overflow-y-auto p-4 bg-wood-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {options.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "relative group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md bg-white",
                                            option.value === value
                                                ? "border-wood-600 bg-wood-50 ring-1 ring-wood-600"
                                                : "border-transparent hover:border-wood-200"
                                        )}
                                    >
                                        {/* Image Container */}
                                        <div className="w-full aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center mb-1">
                                            {option.image ? (
                                                <img
                                                    src={getImageUrl(option.image)}
                                                    alt={option.label}
                                                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <span className="text-xs text-wood-300">無圖片</span>
                                            )}
                                        </div>

                                        {/* Label */}
                                        <div className="text-sm font-medium text-wood-900 text-center w-full px-1">
                                            <span className="line-clamp-2">{option.label}</span>
                                        </div>

                                        {/* Checkmark Badge */}
                                        {option.value === value && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-wood-600 text-white rounded-full flex items-center justify-center shadow-sm">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
