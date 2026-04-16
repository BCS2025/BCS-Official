import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getImageUrl } from '../../lib/imageUtils';
import { cn } from './Button';
import { X, Check, ChevronRight } from 'lucide-react';

export function VisualOptionSelector({ label, options, value, onChange, id, error, className }) {
    const [isOpen, setIsOpen] = useState(false);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Find selected option object
    const selectedOption = options.find(opt => opt.value === value) || options[0];

    const handleSelect = (optionValue) => {
        onChange({ target: { id, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="block text-sm font-medium text-bcs-black">{label}</label>}

            {/* Selected View (Preview) */}
            <div
                className={cn(
                    "relative flex items-center gap-4 p-3 rounded-lg border border-bcs-border bg-white shadow-sm cursor-pointer hover:border-bcs-border transition-colors",
                    error && "border-red-500"
                )}
                onClick={() => setIsOpen(true)}
            >
                {/* Thumbnail */}
                <div className="w-16 h-16 flex-shrink-0 bg-store-50 rounded-md overflow-hidden border border-bcs-border">
                    {selectedOption?.image ? (
                        <img
                            src={getImageUrl(selectedOption.image)}
                            alt={selectedOption.label}
                            className="w-full h-full object-contain p-1"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-bcs-muted text-xs">無圖片</div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-bcs-black truncate">
                        {selectedOption?.label || "請選擇"}
                    </p>
                    <p className="text-xs text-bcs-muted mt-0.5">點擊更換款式</p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-bcs-muted" />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {/* Modal / Drawer Overlay - Using Portal to escape z-index hell */}
            {isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-bcs-border bg-white shrink-0">
                            <h3 className="font-serif font-bold text-lg text-bcs-black">選擇{label}</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-store-100 rounded-full text-bcs-muted transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="flex-1 overflow-y-auto p-4 bg-store-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {options.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "relative group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md bg-white",
                                            option.value === value
                                                ? "border-store-500 bg-store-50 ring-1 ring-store-500"
                                                : "border-transparent hover:border-bcs-border"
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
                                                <span className="text-xs text-bcs-muted">無圖片</span>
                                            )}
                                        </div>

                                        {/* Label */}
                                        <div className="text-sm font-medium text-bcs-black text-center w-full px-1">
                                            <span className="line-clamp-2">{option.label}</span>
                                        </div>

                                        {/* Checkmark Badge */}
                                        {option.value === value && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-store-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
