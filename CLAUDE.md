# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web App (PWA) for Homeowner Association (HOA) management with offline-first capabilities. The app is built with React + Vite and uses IndexedDB for local data storage.

## Development Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
node generate-icons.js  # Regenerate PWA icons from SVG templates
```

## Architecture

### Data Storage Layer
- **IndexedDB Database**: `src/db/database.js` contains all database operations
  - Three object stores: `hoas`, `contributions`, `expenses`
  - Database version: 2
  - All database operations are async and return promises
  - Indexes created on: `hoaId`, `unitNumber`, `startMonth`, `createdAt`, `type`

### React Hooks Pattern
- **useFinancials**: Primary hook for financial data management (contributions & expenses)
  - Fetches and manages contributions and expenses for a specific HOA
  - Provides CRUD operations: `createContribution`, `createExpense`, `removeContribution`, `removeExpense`
  - Auto-calculates financial summary (totals, net balance, counts)
  - Data is automatically sorted by `createdAt` (newest first)

- **useOnlineStatus**: Monitors network connectivity for offline features
- **useIndexedDB**: Legacy/generic hook (not actively used in current implementation)

### Component Structure
- **App.jsx**: Main router that handles view state (`landing`, `create`, `dashboard`)
  - Checks for existing HOA on mount
  - Single-HOA system (uses first HOA found)

- **Dashboard.jsx**: Main interface showing financial summary and recent activity
  - Displays 3 summary cards: Total Contributions, Total Expenses, Net Balance
  - Shows recent contributions and expenses (limited to 10 items each)
  - Contains add/delete functionality for both contributions and expenses

- **AddContributionForm.jsx** & **AddExpenseForm.jsx**: Modal forms for creating transactions
- **CreateHOAForm.jsx**: Initial setup form for HOA details
- **LandingPage.jsx**: Entry screen when no HOA exists
- **OfflineIndicator.jsx**: Shows connection status

### PWA Configuration
- **Service Worker**: Configured via `vite-plugin-pwa` in `vite.config.js`
  - Auto-update strategy with skipWaiting enabled
  - Workbox caching for static assets, fonts, and images
  - Offline fallback to `offline.html`
  - Runtime caching strategies: CacheFirst for fonts/images, StaleWhileRevalidate for JS/CSS

- **Icons**: Complete icon set generated from SVG templates (`public/icon-base.svg`)
  - PWA icons: 192x192, 512x512, maskable 512x512
  - Apple Touch icons: 120, 152, 167, 180 (all sizes)
  - Favicon: 16x16, 32x32, 48x48, .ico
  - Safari mask icon: monochrome SVG
  - Theme color: #2563eb (blue-600)

- **Manifest**: Configured for standalone app with blue theme
- **Offline Support**: Full offline functionality with IndexedDB persistence

## Data Models

### HOA
- `id`, `name`, `address`, `numberOfUnits`, `monthlyContribution`, `createdAt`

### Contribution
- `id`, `hoaId`, `unitNumber`, `startMonth`, `endMonth` (nullable), `amount`, `createdAt`
- `paymentStatus`: 'paid' | 'pending' (default: 'pending')
- `receiptDelivered`: boolean (default: false)
- Supports both single-month and multi-month contributions

### Expense
- `id`, `hoaId`, `type`, `description`, `amount`, `createdAt`
- `paymentStatus`: 'paid' | 'pending' (default: 'pending')

## Key Implementation Details

1. **Financial Calculations**: Performed in `database.js` via helper functions (`getTotalContributions`, `getTotalExpenses`, `getNetBalance`, `getFinancialSummary`)

2. **Multi-month Contributions**: The `AddContributionForm` can calculate amounts for multiple months automatically based on the HOA's `monthlyContribution` rate

3. **Date Handling**: Uses ISO strings for storage, formatted for display using `toLocaleDateString()`

4. **Styling**: Tailwind CSS with custom utilities (including `safe-area-inset` for mobile devices)

5. **State Management**: Local component state + custom hooks pattern (no Redux/Context)

## PWA Deployment

The app is production-ready with complete PWA configuration:

1. **Icons**: All required icons generated (use `node generate-icons.js` to regenerate)
2. **Service Worker**: Auto-configured with Workbox caching strategies
3. **Offline Mode**: Full offline support with IndexedDB and offline fallback page
4. **iOS Support**: Complete with all apple-touch-icon sizes and proper meta tags
5. **Android Support**: Maskable icon and proper theme colors

See `DEPLOYMENT-CHECKLIST.md` for complete pre-deployment testing and deployment instructions.

### Quick Deploy:
```bash
npm run build     # Build for production
npm run preview   # Test locally
# Then deploy dist/ folder to your hosting platform
```
