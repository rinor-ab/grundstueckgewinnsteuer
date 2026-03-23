const gains = [10000, 50000, 100000, 200000];
const k_taxes = [732.55, 6670.95, 16162.70, 36347.50];
const K_MULT = 2.975;

// old be.json simple taxes:
function calcOldTax(taxableGain) {
    const brackets = [
        { limit: 2700, rate: 0.0144 },
        { limit: 5400, rate: 0.024 },
        { limit: 13300, rate: 0.0408 },
        { limit: 26300, rate: 0.0492 },
        { limit: 52600, rate: 0.057 },
        { limit: 105200, rate: 0.0648 },
        { limit: 263100, rate: 0.0744 }
    ];
    let simpleTax = 0;
    let prev = 0;
    for (const b of brackets) {
        if (taxableGain > prev) {
            const t = Math.min(taxableGain - prev, b.limit - prev);
            simpleTax += t * b.rate;
            prev = b.limit;
        }
    }
    if (taxableGain > prev) {
        simpleTax += (taxableGain - prev) * 0.081;
    }
    return simpleTax;
}

console.log("Difference between official BE calc and our old BE calc:");
for (let i = 0; i < 4; i++) {
    const targetSimpleTax = k_taxes[i] / K_MULT;
    const oldTax = calcOldTax(gains[i]);
    console.log(`Gain: ${gains[i]}, Target K_Tax: ${k_taxes[i]}, Target SimpleTax: ${targetSimpleTax.toFixed(3)}, Old SimpleTax: ${oldTax.toFixed(3)}`);
}
