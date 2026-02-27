"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
    /** The tooltip explanation text */
    text: string;
    /** Optional className for the trigger icon */
    className?: string;
}

/**
 * Contextual help tooltip — a small (?) icon that shows an explanation
 * on hover (desktop) or tap (mobile). Click-outside dismisses on mobile.
 */
export function InfoTooltip({ text, className }: InfoTooltipProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside (mobile)
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("pointerdown", handleClick);
        return () => document.removeEventListener("pointerdown", handleClick);
    }, [open]);

    const toggle = useCallback(() => setOpen((p) => !p), []);

    return (
        <div ref={ref} className={`relative inline-flex ${className ?? ""}`}>
            <button
                type="button"
                onClick={toggle}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Info"
            >
                <HelpCircle size={14} />
            </button>

            {open && (
                <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-200 shadow-xl"
                >
                    {text}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
            )}
        </div>
    );
}
