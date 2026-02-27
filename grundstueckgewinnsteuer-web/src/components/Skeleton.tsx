"use client";

/**
 * Pulsing skeleton placeholder for loading states.
 * Uses pure CSS animation — no Framer Motion overhead.
 */
export function Skeleton({
    className = "",
    width,
    height,
}: {
    className?: string;
    width?: string | number;
    height?: string | number;
}) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-muted/60 ${className}`}
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}

/** Skeleton for a full step card — mimics the heading + subtitle + 2 inputs layout */
export function StepSkeleton() {
    return (
        <div className="space-y-6 p-1">
            {/* Badge */}
            <div className="space-y-3">
                <Skeleton width={80} height={24} className="rounded-full" />
                {/* Title */}
                <Skeleton width="60%" height={28} />
                {/* Subtitle */}
                <Skeleton width="85%" height={16} />
            </div>

            {/* Input fields */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Skeleton width={100} height={14} />
                    <Skeleton height={44} className="w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton width={120} height={14} />
                    <Skeleton height={44} className="w-full" />
                </div>
            </div>
        </div>
    );
}
