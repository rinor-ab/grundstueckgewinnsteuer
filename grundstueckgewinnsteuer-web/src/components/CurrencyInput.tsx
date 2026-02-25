"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ChangeEvent } from "react";

interface CurrencyInputProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    min?: number;
    className?: string;
}

/**
 * CHF currency input with live thousand-separator formatting.
 * Stores the raw numeric string; displays `CHF 500'000`.
 */
export function CurrencyInput({
    id,
    value,
    onChange,
    placeholder = "0",
    min = 0,
    className = "",
}: CurrencyInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = useState(() => formatDisplay(value));

    // Sync external value changes
    useEffect(() => {
        setDisplayValue(formatDisplay(value));
    }, [value]);

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            const num = parseInt(raw, 10);
            if (isNaN(num) || raw === "") {
                setDisplayValue("");
                onChange("");
            } else {
                const clamped = min !== undefined && num < min ? min : num;
                setDisplayValue(formatDisplay(String(clamped)));
                onChange(String(clamped));
            }
        },
        [onChange, min],
    );

    const handleBlur = useCallback(() => {
        setDisplayValue(formatDisplay(value));
    }, [value]);

    return (
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-muted-foreground">
                CHF
            </span>
            <input
                ref={inputRef}
                id={id}
                type="text"
                inputMode="numeric"
                className={`${className} pl-14`}
                value={displayValue}
                placeholder={placeholder}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="off"
            />
        </div>
    );
}

function formatDisplay(raw: string): string {
    const num = parseInt(raw, 10);
    if (isNaN(num) || raw === "") return "";
    return new Intl.NumberFormat("de-CH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}
