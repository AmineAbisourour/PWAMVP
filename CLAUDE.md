# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **mobile-first** Progressive Web App (PWA) for Homeowner Association (HOA) management with offline-first capabilities. The app is built with React + Vite and uses IndexedDB for local data storage.

**IMPORTANT**: This app is designed with a mobile-first approach. All UI components, layouts, and interactions are optimized for mobile devices first, then enhanced for larger screens. Always consider mobile viewports, touch interactions, and thumb-friendly button placement when making changes.

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
- **IndexedDB Database**: Modular database structure in `src/db/` directory
  - **`init.js`**: Database initialization and schema migrations
  - **`constants.js`**: All database constants, enums, and error messages
  - **`hoa.js`**: HOA CRUD operations
  - **`contributions.js`**: Contributions CRUD + rate history management + special assessments
  - **`expenses.js`**: Expenses CRUD operations
  - **`transactions.js`**: Unified transaction queries (contributions + expenses)
  - **`financials.js`**: Financial calculations and summaries
  - **`bulk.js`**: Bulk update operations
  - **`demo.js`**: Demo data loading and clearing
  - Three object stores: `hoas`, `contributions`, `expenses`
  - Database version: 4
  - All database operations are async and return promises
  - Indexes created on: `hoaId`, `unitNumber`, `startMonth`, `createdAt`, `type`
  - **Import directly from specific modules** (e.g., `import { createHOA } from './db/hoa'`)

### React Hooks Pattern
- **useTransactions** (`src/hooks/useTransactions.js`): **Unified hook for all transaction operations**
  - Single source of truth for contributions and expenses
  - Provides complete transaction data: `transactions`, `contributions`, `expenses`, `financialSummary`
  - CRUD operations with consistent naming:
    - `addContribution`, `addExpense` - Create new transactions
    - `updateContribution`, `updateExpense` - Update existing transactions with **optimistic updates**
    - `deleteContribution`, `deleteExpense` - Delete transactions
  - **Optimistic updates**: UI updates instantly, then syncs with database in background
  - Auto-calculates financial summary (totals, net balance, counts)
  - Data is automatically sorted by `createdAt` (newest first)
  - Provides `refresh()` method for manual reloads
  - Error handling with automatic rollback on optimistic update failures

- **useOnlineStatus**: Monitors network connectivity for offline features

**IMPORTANT**: Always use `useTransactions` hook for transaction operations. Never import database functions directly in components.

### Component Structure
- **App.jsx**: Main router that handles view state (`landing`, `create`, `dashboard`, `transactions`)
  - Checks for existing HOA on mount
  - Single-HOA system (uses first HOA found)
  - Mobile-first navigation and layout

- **Dashboard.jsx**: Main interface showing financial summary and recent activity
  - Uses `useTransactions` hook for unified transaction management
  - Displays prominent Net Balance card with surplus/deficit indicator
  - Shows 4 quick stats: Collection Rate (monthly/yearly/overall), Pending Contributions, Pending Expenses, Outstanding Receipts
  - Recent Activity section shows last 5 transactions with inline action buttons
  - **Mobile-first inline actions**: Toggle payment status, mark receipt delivered, delete - no modals
  - Quick action buttons for adding contributions, expenses, and special assessments
  - Special assessments summary with progress tracking

- **TransactionsPage.jsx**: Complete transaction history view with grouping
  - Uses `useTransactions` hook with optimistic updates
  - Three tabs: All, Contributions (grouped by month), Expenses (grouped by type)
  - Inline action buttons for quick updates (same pattern as Dashboard)
  - Expandable groups for organized viewing
  - Mobile-optimized with responsive grid layouts

- **AddContributionForm.jsx** & **AddExpenseForm.jsx**: Modal forms for creating transactions
  - Mobile-friendly full-screen modals on small screens
  - Touch-optimized inputs and buttons

- **AddSpecialAssessmentForm.jsx**: Bulk special assessment creation
- **CreateHOAForm.jsx**: Initial setup form for HOA details with country/currency support
- **LandingPage.jsx**: Entry screen when no HOA exists with demo mode option
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

1. **Unified Transaction Management**:
   - All transaction operations go through `useTransactions` hook
   - Optimistic updates provide instant UI feedback
   - Single source of truth eliminates state inconsistencies
   - Never import database functions directly in components

2. **Financial Calculations**: Performed in `src/db/financials.js` via dedicated functions (`getTotalContributions`, `getTotalExpenses`, `getNetBalance`, `getFinancialSummary`)

3. **Multi-month Contributions**: The `AddContributionForm` can calculate amounts for multiple months automatically based on the HOA's `monthlyContribution` rate

4. **Special Assessments**: Bulk creation system for one-time charges across multiple units with purpose tracking and collection rate monitoring

5. **Date Handling**: Uses ISO strings for storage, formatted for display using `toLocaleDateString()`

6. **Internationalization**:
   - Currency support for multiple countries (USD, EUR, GBP, etc.)
   - Locale-aware number and date formatting
   - Country selection in HOA setup

7. **Mobile-First Styling**:
   - Tailwind CSS with mobile-first breakpoints (default → sm → md → lg → xl)
   - Custom utilities including `safe-area-inset` for notched devices
   - Touch-optimized button sizes (min 44x44px touch targets)
   - Responsive grid layouts with mobile-first column counts
   - Full-screen modals on mobile, centered dialogs on desktop

8. **State Management**: Local component state + custom hooks pattern (no Redux/Context)

9. **Transaction UI Pattern**:
   - Inline action buttons (not modals) for quick updates
   - Color-coded transactions: green for contributions, red for expenses
   - Status badges: payment status and receipt delivery
   - Consistent interaction across Dashboard and TransactionsPage

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

## Development Guidelines

### 1. Mobile-First Approach
- **Always design for mobile screens first** (320px-768px)
- Test on small viewports before desktop
- Use responsive breakpoints to enhance for larger screens
- Touch targets must be at least 44x44px
- Consider one-handed mobile usage patterns
- Optimize for thumb-reach zones on mobile devices

### 2. Transaction Operations
- **ALWAYS use `useTransactions` hook** for CRUD operations
- **NEVER import database functions directly** in components
- Leverage optimistic updates for instant UI feedback
- Handle errors gracefully with user-friendly messages
- Avoid manual `refresh()` calls - hook handles updates automatically

### 3. Component Patterns
- Keep components focused and single-purpose
- **Use inline actions instead of modals** when possible for better mobile UX
- Maintain consistent styling across similar components
- Follow existing color coding:
  - Green = contributions/income
  - Red = expenses
  - Blue = informational/receipts
  - Purple = special assessments
- Use consistent spacing and padding with Tailwind utilities

### 4. State Management
- Use custom hooks for shared logic
- Keep local state in components when possible
- Avoid prop drilling - consider hook composition
- Never mix database calls with component logic

### 5. Database Operations
- Database functions are organized into modular files by domain
- **Always import directly from specific modules** (not from a central file)
  - HOA operations: `import { createHOA, updateHOA } from './db/hoa'`
  - Contributions: `import { addContribution } from './db/contributions'`
  - Expenses: `import { addExpense } from './db/expenses'`
  - Transactions: `import { getAllTransactions } from './db/transactions'`
  - Financials: `import { getFinancialSummary } from './db/financials'`
  - Bulk operations: `import { bulkUpdatePaymentStatus } from './db/bulk'`
  - Demo data: `import { loadDemoData } from './db/demo'`
- Constants and enums are defined in `src/db/constants.js`:
  - `PAYMENT_STATUS`, `CONTRIBUTION_TYPE`, `RECEIPT_STATUS`, `TRANSACTION_TYPE`
- All database functions include JSDoc type annotations
- Error messages are standardized in `constants.js`
