import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Button({ className, variant = 'primary', ...props }) {
    const baseStyles = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        primary: "bg-wood-600 text-white hover:bg-wood-700 shadow-sm",
        secondary: "bg-wood-100 text-wood-900 per:bg-wood-200 border border-wood-200",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        ghost: "hover:bg-wood-100 text-wood-700",
        outline: "border border-wood-300 bg-transparent hover:bg-wood-50 text-wood-900"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        />
    );
}
