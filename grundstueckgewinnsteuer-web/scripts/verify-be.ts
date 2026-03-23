import * as fs from 'fs';
import path from 'path';

const beJsonPath = path.join(__dirname, '../src/data/cantons/be.json');
const beJson = JSON.parse(fs.readFileSync(beJsonPath, 'utf8'));

// The rule is: 2% for every full year of ownership above 5? No, the subagent said 2% per year of ownership if >= 5 years. So 7 years = 14%. 
console.log("Original BE discounts:", beJson.discounts_by_years.slice(0, 5));

// Compute Simple Tax for 129000
let taxableGain = 129000;
let simpleTax = 0;
let previousLimit = 0;

for (const bracket of beJson.brackets) {
    const limit = bracket.limit;
    const rate = bracket.rate;
    if (taxableGain > previousLimit) {
        const taxableInBracket = Math.min(taxableGain - previousLimit, limit - previousLimit);
        simpleTax += taxableInBracket * rate;
        previousLimit = limit;
    } else {
        break;
    }
}
if (taxableGain > previousLimit) {
    simpleTax += (taxableGain - previousLimit) * beJson.top_rate;
}

console.log("Simple Tax for 129000:", simpleTax);

// In Bern, canton multiplier = 3.06, commune = ?
// Let's check steuerfuesse for Bern 2025
const steuerfuessePath = path.join(__dirname, '../src/data/communes/be/steuerfuesse.json');
const steuerfuesse = JSON.parse(fs.readFileSync(steuerfuessePath, 'utf8'));
const bern2024 = steuerfuesse['2024']?.find((c: any) => c.Gemeinde === 'Bern') || steuerfuesse['2023']?.find((c: any) => c.Gemeinde === 'Bern');
console.log("Bern Steuerfuss:", bern2024);

const kantonssteuer = simpleTax * 3.06;
console.log("Kantonssteuer (3.06):", kantonssteuer);

const gemeindesteuer = simpleTax * (bern2024 ? parseFloat(bern2024.natPers) / 100 : 1.54);
console.log("Gemeindesteuer (" + (bern2024 ? bern2024.natPers : "1.54") + "):", gemeindesteuer);

console.log("Total Tax projected:", kantonssteuer + gemeindesteuer);
