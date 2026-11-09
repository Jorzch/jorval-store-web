# Jorval Store Web

A responsive storefront for the sibling `jorval-store-api` project.

## Run locally

Use Node.js 24 (see `.nvmrc`).

```sh
npm install
cp .env.example .env
npm run dev
```

Start the API separately on port **8000** with its database configured. Open the URL printed by Vite (normally http://localhost:5173). Vite proxies `/api` to `http://localhost:8000`, keeping authentication cookies on the same browser origin. Set `API_PROXY_TARGET` in the shell before starting Vite to target a different API server:

```sh
API_PROXY_TARGET=http://localhost:9000 npm run dev
```

`VITE_API_URL` defaults to `/api`. For production, route `/api` to the backend on the same origin, or configure an absolute API URL and the backend's credentialed CORS/cookie settings. Production hosting must rewrite frontend routes (such as `/products/example` and `/orders`) to `index.html`, while leaving `/api` routes to the backend. Never put secrets in `VITE_*` variables.

## Features

- API catalog with category filtering, submitted search, pagination, loading, empty, and retry states.
- Product details, image gallery, stock-aware quantity selection, and add to bag.
- Sign-up, sign-in, session restoration, and sign-out using HTTP-only cookies.
- Bag drawer with quantity changes, removal, order review, and order placement.
- Protected account and order history pages.
- Responsive layouts, keyboard-accessible Radix dialogs, form validation, and reduced-motion support.

Checkout uses the API's `/cart/checkout` endpoint to place an order. The current API does not handle payment, shipping addresses, or fulfillment tracking, so the frontend does not collect these details. Prices are displayed as USD; change `src/lib/utils.ts` if another currency is intended. Catalog content comes exclusively from the API; an unseeded database displays an empty collection.

## Stack and organization

React + Vite + TypeScript, React Hook Form with Zod, TanStack Query, Tailwind CSS v4, local shadcn-style UI components backed by Radix, and Zustand. Server state belongs to TanStack Query; Zustand manages the bag drawer. Credentials are never stored in browser storage.

- `src/lib/api.ts`: typed API client and error handling.
- `src/lib/types.ts`: types matched to API response entities.
- `src/lib/queries.ts`: session/cart queries and cart mutations.
- `src/components/ui/`: editable shadcn-compatible primitives, configured in `components.json`.
- `src/pages/`: catalog, product, authentication, account, and orders.
- `tests/`: browser integration tests with isolated API fixtures.

## Checks

```sh
npm run build
npm test
```

For the first browser test run, install Chromium using `npx playwright install chromium`. Tests run against an isolated Vite server on port 4173 with mocked API responses; they do not modify the real database. Run `npm run preview` to inspect the production build (the preview server needs a separately configured `/api` reverse proxy).
