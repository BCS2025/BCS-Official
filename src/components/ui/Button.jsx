import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Button({ className, variant = 'primary', ...props }) {
    const baseStyles = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-300 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        primary: "bg-store-500 text-white hover:bg-store-700 shadow-sm",
        secondary: "bg-store-50 text-bcs-black border border-store-100",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        ghost: "hover:bg-store-50 text-bcs-black",
        outline: "border border-bcs-border bg-transparent hover:bg-store-50 text-bcs-black"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        />
    );
}
