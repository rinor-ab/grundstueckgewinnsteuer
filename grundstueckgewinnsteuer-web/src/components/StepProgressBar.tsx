"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface StepProgressBarProps {
    currentStep: number;
    maxStepReached: number;
    totalSteps: number;
    onGoTo: (step: number) => void;
}

const STEP_LABELS = ["Standort", "Besitzdauer", "Preise", "Abzüge", "Ergebnis"];

export function StepProgressBar({ currentStep, maxStepReached, totalSteps, onGoTo }: StepProgressBarProps) {
    const pct = ((currentStep) / (totalSteps - 1)) * 100;

    return (
        <div className="mb-8">
            {/* ── Mobile compact pill ── */}
            <div className="flex sm:hidden items-center gap-3">
                <span className="shrink-0 text-xs font-semibold text-primary tabular-nums">
                    {currentStep + 1}/{totalSteps}
                </span>
                <div className="relative flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    />
                </div>
                <span className="shrink-0 text-xs font-medium text-foreground">
                    {STEP_LABELS[currentStep]}
                </span>
            </div>

            {/* ── Desktop circle steps ── */}
            <div className="hidden sm:flex items-center justify-between">
                {Array.from({ length: totalSteps }, (_, i) => {
                    const isCompleted = i < currentStep;
                    const isActive = i === currentStep;
                    const isReachable = i <= maxStepReached;

                    return (
                        <div key={i} className="flex flex-1 items-center">
                            {/* Step circle */}
                            <button
                                onClick={() => isReachable && onGoTo(i)}
                                disabled={!isReachable}
                                className={`
                  group relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full
                  text-sm font-semibold transition-all duration-300
                  ${isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                                        : isCompleted
                                            ? "bg-primary text-primary-foreground cursor-pointer hover:shadow-md hover:shadow-primary/20"
                                            : isReachable
                                                ? "bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80"
                                                : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
                                    }
                `}
                            >
                                {isCompleted ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <Check size={16} strokeWidth={3} />
                                    </motion.div>
                                ) : (
                                    <span>{i + 1}</span>
                                )}

                                {/* Pulse ring for active step */}
                                {isActive && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-primary"
                                        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}

                                {/* Label tooltip */}
                                <span
                                    className={`
                    absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium
                    ${isActive ? "text-primary" : isCompleted ? "text-foreground/70" : "text-muted-foreground/50"}
                  `}
                                >
                                    {STEP_LABELS[i]}
                                </span>
                            </button>

                            {/* Connector line */}
                            {i < totalSteps - 1 && (
                                <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-primary"
                                        initial={{ width: "0%" }}
                                        animate={{ width: i < currentStep ? "100%" : "0%" }}
                                        transition={{ duration: 0.4, ease: "easeInOut" }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
