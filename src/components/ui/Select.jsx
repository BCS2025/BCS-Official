import { cn } from './Button';

export function Select({ label, options, error, className, id, ...props }) {
    return (
        <div className="space-y-1">
            {label && <label htmlFor={id} className="block text-sm font-medium text-wood-800">{label}</label>}
            <div className="relative">
                <select
                    id={id}
                    className={cn(
                        "flex h-10 w-full appearance-none rounded-md border border-wood-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-500 focus-visible:ring-red-500",
                        className
                    )}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-wood-500">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
