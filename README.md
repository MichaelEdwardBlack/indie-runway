# Indie Runway

Indie Runway is a modern financial planning workspace for indie game studios. It turns a studio pro forma into an interactive model for exploring launch assumptions, cash runway, break-even timing, and long-term outcomes.

## Current product slice

- Live game-price, month-one-sales, and sales-decay controls
- Twenty-four-month cash projection
- Break-even, required funding, lifetime units, revenue, and cash outputs
- Cam's development, marketing, salary, G&A, storefront, tax, DLC, and cosmetics assumptions represented in a typed calculation engine
- Responsive planner interface with chart and number transitions
- Automated checks for the baseline model and key financial relationships

## Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Verification

```bash
npm test
npm run build
```

## Provisional model conventions

Several source spreadsheet behaviors still need confirmation from Cam. Until then, the engine explicitly treats marketing as a one-month-lagged percentage of gross profit, prevents immediate tax benefits from operating losses, includes DLC and cosmetics in total revenue, and groups pre-launch costs at launch.
