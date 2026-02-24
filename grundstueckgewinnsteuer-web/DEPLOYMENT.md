# Deployment Guide

## Vercel Deployment

### Prerequisites
- Node.js 18.17+
- npm or pnpm
- Vercel CLI (`npm i -g vercel`) or Vercel Dashboard

### Quick Deploy

```bash
# 1. Navigate to the web app directory
cd grundstueckgewinnsteuer-web

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Build
npm run build

# 5. Deploy to Vercel
npx vercel --prod
```

### Environment Variables

No environment variables are required — all computation runs client-side.

### Vercel Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Node.js Version | 18.x or 20.x |
| Root Directory | `grundstueckgewinnsteuer-web` |

### GitHub Integration

1. Push the repo to GitHub
2. Connect the repo in the [Vercel Dashboard](https://vercel.com/new)
3. Set the root directory to `grundstueckgewinnsteuer-web`
4. Deploy automatically on push to `main`

### Manual Verification After Deploy

1. Visit the deployed URL
2. Select a canton (e.g., SH – Schaffhausen)
3. Enter test values and click "Berechnen"
4. Verify the results match expected values
5. Check `/sources` and `/about` pages load correctly

## Local Development

```bash
npm install
npm run dev     # Start dev server on http://localhost:3000
npm test        # Run unit tests
npm run lint    # ESLint
npm run format  # Prettier
```

## Project Structure

```
grundstueckgewinnsteuer-web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Calculator page
│   │   ├── about/        # About page
│   │   └── sources/      # Sources page
│   ├── lib/tax/          # Pure tax engine library
│   │   ├── types.ts      # Core types
│   │   ├── compute.ts    # Entry point
│   │   ├── engines/      # 5 engine patterns
│   │   └── ...
│   ├── data/             # Canton tariff JSONs
│   └── schemas/          # Zod validation
├── tests/
│   ├── engine.test.ts    # Vitest unit tests
│   ├── fixtures/         # Parity test fixtures
│   └── e2e/              # Playwright tests
├── scripts/
│   └── parity.ts         # Parity validation script
└── DEPLOYMENT.md         # This file
```
