"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Animates between numeric values using requestAnimationFrame.
 * Returns the current interpolated value for display.
 */
export function useAnimatedNumber(
    target: number,
    options?: { duration?: number; decimals?: number },
): number {
    const { duration = 600, decimals = 2 } = options ?? {};
    const [display, setDisplay] = useState(target);
    const prevRef = useRef(target);
    const frameRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        const from = prevRef.current;
        const to = target;

        if (Math.abs(from - to) < 0.01) {
            setDisplay(to);
            prevRef.current = to;
            return;
        }

        startTimeRef.current = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = from + (to - from) * eased;

            const factor = Math.pow(10, decimals);
            setDisplay(Math.round(current * factor) / factor);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setDisplay(to);
                prevRef.current = to;
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration, decimals]);

    // Keep ref in sync on unmount
    useEffect(() => {
        return () => {
            prevRef.current = target;
        };
    }, [target]);

    return display;
}
