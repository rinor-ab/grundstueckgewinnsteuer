const K_MULT = 3.025; // 2024 multiplier
const rates = [0.0144, 0.024, 0.0408, 0.0492, 0.057, 0.0648, 0.0744, 0.081];
const limits = [2700, 5400, 13300, 26300, 52600, 105200, 263100];
const gains = [10000, 50000, 100000, 200000];

for (let g of gains) {
    let tax = 0;
    let prev = 0;
    for (let i = 0; i < 7; i++) {
        if (g > prev) {
            tax += Math.min(g - prev, limits[i] - prev) * rates[i];
            prev = limits[i];
        }
    }
    if (g > prev) tax += (g - prev) * rates[7];
    console.log(`Gain: ${g}, SimpleTax: ${tax.toFixed(2)}, K-Tax (3.025): ${(tax * K_MULT).toFixed(2)}`);
}
