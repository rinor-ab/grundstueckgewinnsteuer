const K_MULT = 2.975;
const gains = [10, 50000, 100000, 200000]; // wait, 10k is 10000
const correctGains = [10000, 50000, 100000, 200000];
const targetK = [732.55, 6670.95, 16162.70, 36347.50];

const limits = [2800, 5600, 13800, 27300, 54600, 109200, 273000];
const rates = [0.0144, 0.024, 0.0408, 0.0492, 0.057, 0.0648, 0.0744, 0.081];

for (let j = 0; j < 4; j++) {
    const gain = correctGains[j];
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
    const k = tax * K_MULT;
    console.log(`Gain: ${gain}, Tax: ${tax.toFixed(3)}, K: ${k.toFixed(3)}, Target K: ${targetK[j]}, Diff: ${(Math.round(k * 20) / 20) - targetK[j]}`);
}
