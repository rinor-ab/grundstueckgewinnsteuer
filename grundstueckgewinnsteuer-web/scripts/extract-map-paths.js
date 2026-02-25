const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', '..', 'images', 'Suisse_map_cantons.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

const cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'];

const result = {};
for (const c of cantons) {
    // Match path elements with this id - the d attribute might come before or after id
    const re1 = new RegExp('<path[^>]*?id="' + c + '"[^>]*?\\bd="([^"]+)"', 's');
    const re2 = new RegExp('<path[^>]*?\\bd="([^"]+)"[^>]*?id="' + c + '"', 's');
    const m = svg.match(re1) || svg.match(re2);
    if (m) {
        result[c] = m[1];
        console.log(c + ': ' + m[1].length + ' chars');
    } else {
        console.log(c + ': NOT FOUND');
    }
}

// Write output as TypeScript
let ts = 'export const CANTON_PATHS: Record<string, string> = {\n';
for (const [code, d] of Object.entries(result)) {
    ts += `    ${code}: "${d}",\n`;
}
ts += '};\n';

const outPath = path.join(__dirname, 'canton-map-paths.ts');
fs.writeFileSync(outPath, ts, 'utf8');
console.log('\nWrote ' + Object.keys(result).length + ' paths to ' + outPath);
