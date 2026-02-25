"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calculator, AlertCircle, ChevronUp, Loader2 } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";

import { useWizard } from "@/hooks/use-wizard";
import { StepProgressBar } from "@/components/StepProgressBar";
import { SummaryPanel } from "@/components/SummaryPanel";

// Steps
import { LocationStep } from "@/components/steps/LocationStep";
import { DatesStep } from "@/components/steps/DatesStep";
import { PricesStep } from "@/components/steps/PricesStep";
import { DeductionsStep } from "@/components/steps/DeductionsStep";
import { ResultStep } from "@/components/steps/ResultStep";

// ---------------------------------------------------------------------------
// Step transition variants
// ---------------------------------------------------------------------------

const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 60 : -60,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -60 : 60,
        opacity: 0,
    }),
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalculatorPage() {
    const {
        state,
        next,
        back,
        goTo,
        setField,
        setConfessions,
        compute,
        reset,
        holdingMonths,
        rawGain,
        communes,
        years,
        cantonConfessions,
        isLastInputStep,
        isResultStep,
        totalSteps,
    } = useWizard();

    const [isComputing, setIsComputing] = useState(false);

    const handleNext = useCallback(() => {
        if (isLastInputStep) {
            setIsComputing(true);
            // Brief delay for satisfying animation
            setTimeout(() => {
                compute();
                next();
                setIsComputing(false);
            }, 400);
        } else {
            next();
        }
    }, [isLastInputStep, compute, next]);

    const handleReset = useCallback(() => {
        reset();
    }, [reset]);

    // Current step content
    const renderStep = () => {
        switch (state.step) {
            case 0:
                return (
                    <LocationStep
                        form={state.form}
                        communes={communes}
                        years={years}
                        setField={setField}
                    />
                );
            case 1:
                return (
                    <DatesStep
                        form={state.form}
                        holdingMonths={holdingMonths}
                        setField={setField}
                    />
                );
            case 2:
                return (
                    <PricesStep
                        form={state.form}
                        rawGain={rawGain}
                        setField={setField}
                    />
                );
            case 3:
                return (
                    <DeductionsStep
                        form={state.form}
                        cantonConfessions={cantonConfessions}
                        setField={setField}
                        setConfessions={setConfessions}
                    />
                );
            case 4:
                return (
                    <ResultStep
                        result={state.result!}
                        error={state.error}
                        canton={state.form.canton}
                        commune={state.form.commune}
                        taxYear={state.form.taxYear}
                        purchasePrice={parseFloat(state.form.purchasePrice || "0")}
                        salePrice={parseFloat(state.form.salePrice || "0")}
                        deductions={
                            parseFloat(state.form.acquisitionCosts || "0") +
                            parseFloat(state.form.sellingCosts || "0") +
                            parseFloat(state.form.investmentAmount || "0")
                        }
                        onReset={handleReset}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Progress Bar */}
            <StepProgressBar
                currentStep={state.step}
                maxStepReached={state.maxStepReached}
                totalSteps={totalSteps}
                onGoTo={goTo}
            />

            <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_340px]">
                {/* ====== Left: Step Content ====== */}
                <div className="min-h-[420px]">
                    <AnimatePresence mode="wait" custom={state.direction}>
                        <motion.div
                            key={state.step}
                            custom={state.direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm sm:p-8"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Error */}
                    <AnimatePresence>
                        {state.error && !isResultStep && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
                            >
                                <p className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle size={16} />
                                    {state.error}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    {!isResultStep && (
                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={back}
                                disabled={state.step === 0}
                                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-slate-100 hover:text-foreground disabled:invisible"
                            >
                                <ArrowLeft size={16} />
                                Zurück
                            </button>

                            <motion.button
                                onClick={handleNext}
                                disabled={isComputing}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-80"
                            >
                                {isLastInputStep ? (
                                    isComputing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Berechne…
                                        </>
                                    ) : (
                                        <>
                                            <Calculator size={16} />
                                            Berechnen
                                        </>
                                    )
                                ) : (
                                    <>
                                        Weiter
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* ====== Right: Live Summary ====== */}
                <SummaryPanel
                    canton={state.form.canton}
                    commune={state.form.commune}
                    holdingMonths={holdingMonths}
                    rawGain={rawGain}
                    result={state.result}
                    step={state.step}
                />
            </div>

            {/* ====== Mobile sticky summary bar ====== */}
            {!isResultStep && (
                <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border/40 bg-white/90 backdrop-blur-xl safe-bottom">
                    <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                            <ChevronUp size={14} className="text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Übersicht</span>
                        </div>
                        {state.result ? (
                            <div className="flex items-center gap-3">
                                <AnimatedNumber
                                    value={parseFloat(state.result.totalTax)}
                                    format="chf"
                                    className="text-sm font-bold text-foreground"
                                />
                                <span className="text-xs text-muted-foreground">
                                    ({parseFloat(state.result.effectiveTaxRatePercent).toFixed(1)}%)
                                </span>
                            </div>
                        ) : rawGain > 0 ? (
                            <span className="text-xs font-medium text-emerald-600">
                                Gewinn: CHF {rawGain.toLocaleString("de-CH")}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">Daten eingeben…</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
