/**
 * 統一 Skeleton 樣式元件
 *
 * 使用方式：
 *   <Skeleton className="h-48 w-full rounded-card" />
 *   <SkeletonCard />
 *   <SkeletonPortfolioGrid count={8} />
 */

export function Skeleton({ className = '' }) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    );
}

/** 課程卡 Skeleton */
export function SkeletonCourseCard() {
    return (
        <div className="bg-white border border-bcs-border rounded-card overflow-hidden">
            <Skeleton className="aspect-[16/9] rounded-none" />
            <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-5 w-4/5 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-20 rounded" />
                    <Skeleton className="h-8 w-24 rounded-btn" />
                </div>
            </div>
        </div>
    );
}

/** 作品集格狀 Skeleton */
export function SkeletonPortfolioGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-card" />
            ))}
        </div>
    );
}

/** 商品卡 Skeleton */
export function SkeletonProductCard() {
    return (
        <div className="bg-white border border-bcs-border rounded-card overflow-hidden">
            <Skeleton className="aspect-square rounded-none" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-8 w-full rounded-btn mt-3" />
            </div>
        </div>
    );
}
