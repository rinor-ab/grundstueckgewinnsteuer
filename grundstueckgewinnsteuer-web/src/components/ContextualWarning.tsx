"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Info, Sparkles } from "lucide-react";

type WarningVariant = "surcharge" | "discount" | "zero-gain" | "info";

interface ContextualWarningProps {
    variant: WarningVariant;
    message: string;
    show: boolean;
}

const variantConfig: Record<
    WarningVariant,
    { icon: React.ElementType; bg: string; border: string; text: string; iconColor: string }
> = {
    surcharge: {
        icon: AlertTriangle,
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        iconColor: "text-amber-500",
    },
    discount: {
        icon: TrendingDown,
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-800",
        iconColor: "text-emerald-500",
    },
    "zero-gain": {
        icon: Info,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        iconColor: "text-blue-500",
    },
    info: {
        icon: Sparkles,
        bg: "bg-violet-50",
        border: "border-violet-200",
        text: "text-violet-800",
        iconColor: "text-violet-500",
    },
};

export function ContextualWarning({ variant, message, show }: ContextualWarningProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                >
                    <div
                        className={`flex items-start gap-2.5 rounded-xl border ${config.border} ${config.bg} px-4 py-3`}
                    >
                        <Icon size={16} className={`mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                        <p className={`text-sm leading-relaxed ${config.text}`}>{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
