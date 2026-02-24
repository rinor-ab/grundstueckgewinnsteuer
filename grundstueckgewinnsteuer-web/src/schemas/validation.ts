/**
 * Zod validation schemas for tax calculator inputs.
 */

import { z } from "zod";

export const investmentSchema = z.object({
    description: z.string().default(""),
    amount: z.string().regex(/^\d+(\.\d+)?$/, "Amount must be a positive number"),
    investmentDate: z.string().optional(),
});

export const taxInputsSchema = z.object({
    canton: z
        .string()
        .min(2)
        .max(2)
        .transform((v) => v.toUpperCase()),
    commune: z.string().min(1, "Commune is required"),
    taxYear: z.number().int().min(2000).max(2030),

    purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),

    purchasePrice: z.string().regex(/^\d+(\.\d+)?$/, "Price must be a positive number"),
    salePrice: z.string().regex(/^\d+(\.\d+)?$/, "Price must be a positive number"),

    acquisitionCosts: z.string().default("0"),
    sellingCosts: z.string().default("0"),

    investments: z.array(investmentSchema).default([]),

    taxpayerType: z.enum(["natural", "legal"]).default("natural"),

    confessions: z.record(z.string(), z.number().int().min(0)).default({}),
});

export type ValidatedTaxInputs = z.infer<typeof taxInputsSchema>;
