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

## Model conventions

The initial model intentionally stays simple and uses a fixed 24-month post-launch projection. Development costs continue throughout that projection, pre-launch G&A includes the previously omitted $100 miscellaneous expense, and investment needed means the total cost required to reach launch. Refunds, discounts, regional pricing, and VAT are reserved for a future version.

Several spreadsheet behaviors still need confirmation from Cam. Until then, the engine treats marketing as a one-month-lagged percentage of gross profit, prevents immediate tax benefits from operating losses, includes DLC and cosmetics in total revenue, and groups pre-launch costs at launch.
