const gains = [9000, 45000, 90000, 180000];
const targetK = [732.55, 6670.95, 16162.70, 36347.50];
const rates = [0.0144, 0.024, 0.0408, 0.0492, 0.057, 0.0648, 0.0744, 0.081];
const KMULT = 2.975;

const L1 = 2800;
const L2 = 5600;

function calc(gain, limits) {
    let tax = 0;
    let prev = 0;
    for (let i = 0; i < 7; i++) {
        const lim = limits[i];
        if (gain > prev) {
            tax += Math.min(gain - prev, lim - prev) * rates[i];
            prev = lim;
        }
    }
    if (gain > prev) {
        tax += (gain - prev) * rates[7];
    }
    return tax;
}

let minErr = Infinity;
let bestLimits = [];

for (let l3 = 13500; l3 <= 14000; l3 += 100) {
    for (let l4 = 27000; l4 <= 28000; l4 += 100) {
        for (let l5 = 54000; l5 <= 55500; l5 += 100) {
            for (let l6 = 108000; l6 <= 110000; l6 += 100) {
                // Approximate L7 as l6 * 2.5 (usually 263100 when l6 was 105200)
                const l7 = Math.round(l6 * 2.5009); // roughly 272800
                const limits = [L1, L2, l3, l4, l5, l6, l7];

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
                    console.log("PERFECT MATCH:", limits);
                    process.exit(0);
                }
            }
        }
    }
}

console.log("Closest:", bestLimits, "Error:", minErr);
