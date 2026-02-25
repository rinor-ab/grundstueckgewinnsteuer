"use client";

import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { motion } from "framer-motion";

interface AnimatedNumberProps {
    value: number;
    format?: "chf" | "percent" | "plain";
    duration?: number;
    className?: string;
}

function formatAsCHF(n: number): string {
    return new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

export function AnimatedNumber({ value, format = "chf", duration = 600, className }: AnimatedNumberProps) {
    const animated = useAnimatedNumber(value, { duration, decimals: format === "percent" ? 2 : 0 });

    let display: string;
    switch (format) {
        case "chf":
            display = formatAsCHF(animated);
            break;
        case "percent":
            display = `${animated.toFixed(2)}%`;
            break;
        default:
            display = animated.toLocaleString("de-CH");
    }

    return (
        <motion.span
            key={Math.round(value)} // re-trigger animation on new target
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`tabular-nums ${className ?? ""}`}
        >
            {display}
        </motion.span>
    );
}
