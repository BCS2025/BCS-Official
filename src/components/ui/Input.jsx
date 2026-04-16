import { cn } from './Button';

export function Input({ label, error, className, id, ...props }) {
    return (
        <div className="space-y-1">
            {label && <label htmlFor={id} className="block text-sm font-medium text-bcs-black">{label}</label>}
            <input
                id={id}
                className={cn(
                    "flex h-10 w-full rounded-md border border-bcs-border bg-white px-3 py-2 text-sm placeholder:text-bcs-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-300 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-500 focus-visible:ring-red-500",
                    className
                )}
                {...props}
            />
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}
