const gains = [10000, 50000, 100000, 200000];
const targetK = [732.55, 6670.95, 16162.70, 36347.50];
const rates = [0.0144, 0.024, 0.0408, 0.0492, 0.057, 0.0648, 0.0744, 0.081];
const KMULT = 2.975;

function calc(gain, limits) {
    let tax = 0;
    let prev = 0;
    for (let i = 0; i < 7; i++) {
        if (gain > prev) {
            tax += Math.min(gain - prev, limits[i] - prev) * rates[i];
            prev = limits[i];
        }
    }
    if (gain > prev) {
        tax += (gain - prev) * rates[7];
    }
    return tax;
}

let minErr = Infinity;
let bestLimits = [];

for (let L = 2700; L <= 4000; L += 100) {
    const l1 = L;
    const l2 = L * 2;
    for (let s3 = 7000; s3 <= 14000; s3 += 100) {
        const l3 = l2 + s3;
        for (let s4 = 12000; s4 <= 18000; s4 += 100) {
            const l4 = l3 + s4;
            for (let s5 = 26000; s5 <= 30000; s5 += 100) {
                const l5 = l4 + s5;
                for (let s6 = 52000; s6 <= 55000; s6 += 100) {
                    const l6 = l5 + s6;
                    const l7 = Math.round(l6 * 2.5);
                    const limits = [l1, l2, l3, l4, l5, l6, l7];

                    let err = 0;
                    for (let i = 0; i < 4; i++) {
                        const sim = calc(gains[i], limits);
                        const k = Math.round(sim * KMULT / 0.05) * 0.05;
                        err += Math.abs(k - targetK[i]);
                    }
                    if (err < minErr) {
                        minErr = err;
                        bestLimits = limits;
                    }
                    if (err < 0.01) {
                        console.log("PERFECT MATCH!");
                        console.log("Limits:", limits);
                        process.exit(0);
                    }
                }
            }
        }
    }
}
console.log("Closest match:", bestLimits, "Error:", minErr);
