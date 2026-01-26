import { cn } from './Button';

export function Card({ className, children, ...props }) {
    return (
        <div className={cn("rounded-lg border border-wood-100 bg-white shadow-sm text-wood-950", className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, ...props }) {
    return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
    return <h3 className={cn("font-serif text-2xl font-semibold leading-none tracking-tight text-wood-900", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
    return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
    return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
