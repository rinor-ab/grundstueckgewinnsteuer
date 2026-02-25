"use client";

import { useReducer, useCallback, useMemo } from "react";
import { computeTax } from "@/lib/tax/compute";
import { getCommunes, getAvailableYears, getConfessions } from "@/lib/tax/registry";
import type { TaxInputs, TaxResult } from "@/lib/tax/types";

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

export interface FormState {
    canton: string;
    commune: string;
    taxYear: number;
    purchaseDate: string;
    saleDate: string;
    purchasePrice: string;
    salePrice: string;
    acquisitionCosts: string;
    sellingCosts: string;
    investmentAmount: string;
    confessions: Record<string, number>;
}

export interface WizardState {
    step: number;
    maxStepReached: number;
    direction: 1 | -1;
    form: FormState;
    result: TaxResult | null;
    error: string | null;
    isComputing: boolean;
}

const TOTAL_STEPS = 5; // 0-indexed: 0..4

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type Action =
    | { type: "NEXT" }
    | { type: "BACK" }
    | { type: "GO_TO"; step: number }
    | { type: "SET_FIELD"; field: keyof FormState; value: unknown }
    | { type: "SET_CONFESSIONS"; confessions: Record<string, number> }
    | { type: "COMPUTE_START" }
    | { type: "COMPUTE_SUCCESS"; result: TaxResult }
    | { type: "COMPUTE_ERROR"; error: string }
    | { type: "RESET" };

// ---------------------------------------------------------------------------
// Validation per step
// ---------------------------------------------------------------------------

function validateStep(step: number, form: FormState): string | null {
    switch (step) {
        case 0: // Location
            if (!form.canton) return "Bitte wählen Sie einen Kanton.";
            return null;
        case 1: // Dates
            if (!form.purchaseDate) return "Bitte geben Sie das Kaufdatum ein.";
            if (!form.saleDate) return "Bitte geben Sie das Verkaufsdatum ein.";
            if (form.saleDate <= form.purchaseDate) return "Das Verkaufsdatum muss nach dem Kaufdatum liegen.";
            return null;
        case 2: // Prices
            if (!form.purchasePrice || parseFloat(form.purchasePrice) <= 0)
                return "Bitte geben Sie einen gültigen Kaufpreis ein.";
            if (!form.salePrice || parseFloat(form.salePrice) <= 0)
                return "Bitte geben Sie einen gültigen Verkaufspreis ein.";
            return null;
        case 3: // Deductions — always valid (all optional)
            return null;
        default:
            return null;
    }
}

export { validateStep };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function wizardReducer(state: WizardState, action: Action): WizardState {
    switch (action.type) {
        case "NEXT": {
            const err = validateStep(state.step, state.form);
            if (err) return { ...state, error: err };
            const next = Math.min(state.step + 1, TOTAL_STEPS - 1);
            return {
                ...state,
                step: next,
                maxStepReached: Math.max(state.maxStepReached, next),
                direction: 1,
                error: null,
            };
        }
        case "BACK": {
            const prev = Math.max(state.step - 1, 0);
            return { ...state, step: prev, direction: -1, error: null };
        }
        case "GO_TO": {
            if (action.step > state.maxStepReached) return state;
            if (action.step < 0 || action.step >= TOTAL_STEPS) return state;
            return {
                ...state,
                step: action.step,
                direction: action.step > state.step ? 1 : -1,
                error: null,
            };
        }
        case "SET_FIELD": {
            const newForm = { ...state.form, [action.field]: action.value };
            // Auto-select first commune when canton changes
            if (action.field === "canton") {
                const communes = getCommunes(action.value as string, state.form.taxYear);
                if (communes.length > 0) newForm.commune = communes[0];
            }
            if (action.field === "taxYear") {
                const communes = getCommunes(state.form.canton, action.value as number);
                if (communes.length > 0 && !communes.includes(newForm.commune)) {
                    newForm.commune = communes[0];
                }
            }
            return { ...state, form: newForm, error: null };
        }
        case "SET_CONFESSIONS":
            return { ...state, form: { ...state.form, confessions: action.confessions }, error: null };
        case "COMPUTE_START":
            return { ...state, isComputing: true, error: null };
        case "COMPUTE_SUCCESS":
            return { ...state, isComputing: false, result: action.result, error: null };
        case "COMPUTE_ERROR":
            return { ...state, isComputing: false, error: action.error };
        case "RESET":
            return createInitialState();
        default:
            return state;
    }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

function createInitialState(): WizardState {
    const canton = "SH";
    const taxYear = 2026;
    const communes = getCommunes(canton, taxYear);
    return {
        step: 0,
        maxStepReached: 0,
        direction: 1,
        form: {
            canton,
            commune: communes[0] || "",
            taxYear,
            purchaseDate: "2015-01-01",
            saleDate: "2025-06-15",
            purchasePrice: "500000",
            salePrice: "700000",
            acquisitionCosts: "0",
            sellingCosts: "0",
            investmentAmount: "0",
            confessions: {},
        },
        result: null,
        error: null,
        isComputing: false,
    };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizard() {
    const [state, dispatch] = useReducer(wizardReducer, undefined, createInitialState);

    const next = useCallback(() => dispatch({ type: "NEXT" }), []);
    const back = useCallback(() => dispatch({ type: "BACK" }), []);
    const goTo = useCallback((step: number) => dispatch({ type: "GO_TO", step }), []);

    const setField = useCallback(
        (field: keyof FormState, value: unknown) => dispatch({ type: "SET_FIELD", field, value }),
        [],
    );

    const setConfessions = useCallback(
        (confessions: Record<string, number>) => dispatch({ type: "SET_CONFESSIONS", confessions }),
        [],
    );

    const compute = useCallback(() => {
        dispatch({ type: "COMPUTE_START" });
        try {
            const f = state.form;
            const inputs: TaxInputs = {
                canton: f.canton,
                commune: f.commune || getCommunes(f.canton, f.taxYear)[0] || "",
                taxYear: f.taxYear,
                purchaseDate: f.purchaseDate,
                saleDate: f.saleDate,
                purchasePrice: f.purchasePrice,
                salePrice: f.salePrice,
                acquisitionCosts: f.acquisitionCosts,
                sellingCosts: f.sellingCosts,
                investments:
                    parseFloat(f.investmentAmount) > 0
                        ? [{ description: "Wertvermehrende Investitionen", amount: f.investmentAmount }]
                        : [],
                taxpayerType: "natural",
                confessions: f.confessions,
            };
            const result = computeTax(inputs);
            dispatch({ type: "COMPUTE_SUCCESS", result });
        } catch (e) {
            dispatch({
                type: "COMPUTE_ERROR",
                error: e instanceof Error ? e.message : "Berechnung fehlgeschlagen",
            });
        }
    }, [state.form]);

    const reset = useCallback(() => dispatch({ type: "RESET" }), []);

    // Derived values
    const { purchaseDate, saleDate, purchasePrice, salePrice, acquisitionCosts, sellingCosts, investmentAmount } = state.form;

    const holdingMonths = useMemo(() => {
        if (!purchaseDate || !saleDate) return 0;
        const p = new Date(purchaseDate);
        const s = new Date(saleDate);
        if (isNaN(p.getTime()) || isNaN(s.getTime())) return 0;
        return (s.getFullYear() - p.getFullYear()) * 12 + (s.getMonth() - p.getMonth());
    }, [purchaseDate, saleDate]);

    const rawGain = useMemo(() => {
        return Math.max(
            0,
            parseFloat(salePrice || "0") -
            parseFloat(purchasePrice || "0") -
            parseFloat(acquisitionCosts || "0") -
            parseFloat(sellingCosts || "0") -
            parseFloat(investmentAmount || "0"),
        );
    }, [purchasePrice, salePrice, acquisitionCosts, sellingCosts, investmentAmount]);

    const communes = useMemo(
        () => getCommunes(state.form.canton, state.form.taxYear),
        [state.form.canton, state.form.taxYear],
    );

    const years = useMemo(() => getAvailableYears(state.form.canton), [state.form.canton]);

    const cantonConfessions = useMemo(() => getConfessions(state.form.canton), [state.form.canton]);

    const isLastInputStep = state.step === 3;
    const isResultStep = state.step === 4;
    const totalSteps = TOTAL_STEPS;

    return {
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
    };
}
