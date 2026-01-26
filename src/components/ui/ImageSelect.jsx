import { useState, useRef, useEffect } from 'react';
import { cn } from './Button';
import { ChevronDown, Check } from 'lucide-react';

export function ImageSelect({ label, options, value, onChange, id, error, className }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { id, value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className="space-y-1" ref={containerRef}>
            {label && <label htmlFor={id} className="block text-sm font-medium text-wood-800">{label}</label>}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-wood-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wood-400 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                >
                    <span className="block truncate">
                        {selectedOption ? selectedOption.label : "請選擇..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <ul className="max-h-60 overflow-auto py-1 text-base sm:text-sm">
                            {options.map((option) => (
                                <li
                                    key={option.value}
                                    className={cn(
                                        "relative cursor-default select-none py-2 pl-3 pr-9 text-wood-900 hover:bg-wood-100",
                                        option.value === value && "bg-wood-50 font-medium"
                                    )}
                                    onClick={() => handleSelect(option.value)}
                                    onMouseEnter={() => setHoveredOption(option)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    <span className="block truncate">{option.label}</span>
                                    {option.value === value && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-wood-600">
                                            <Check className="h-4 w-4" />
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* Hover Preview Image */}
                        {hoveredOption && hoveredOption.image && (
                            <div
                                className="absolute left-full top-0 ml-2 p-2 bg-white rounded-lg shadow-xl border border-wood-100 z-50 pointer-events-none w-48"
                                style={{ minWidth: '150px' }}
                            >
                                <div className="aspect-square w-full relative overflow-hidden rounded-md bg-wood-50">
                                    <img
                                        src={hoveredOption.image}
                                        alt={hoveredOption.label}
                                        className="object-contain w-full h-full"
                                    />
                                </div>
                                <p className="text-xs text-center mt-2 text-wood-600 font-medium">{hoveredOption.label}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
