# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kruakoonpim Manager** is a restaurant order management application built with Next.js. It enables order creation, tracking, and bulk order import via image upload powered by Google Gemini/Vertex AI for intelligent order extraction.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4
- **Backend:** Next.js API routes (serverless)
- **Database:** PostgreSQL with Prisma 6 ORM
- **State Management:** SWR 2 for server state, Zustand 5 for client state
- **Forms:** react-hook-form with Zod schema validation
- **UI Components:** Radix UI, Tabler Icons, Lucide, react-hot-toast, Sonner
- **External APIs:** Google Gemini/Vertex AI (@google/genai) for image processing
- **Authentication:** Session-based (passcode + internal API key validation)

## Directory Structure

```
app/
├── (protected)/           # Auth-required routes, redirects to /login if no session
│   ├── add-customer/      # Customer management UI
│   ├── preview/           # Order preview and confirmation
│   └── settings/          # App configuration
├── api/                   # API endpoints
│   ├── order/             # Order CRUD, payment, swap operations
│   ├── menu/              # Menu items management
│   ├── customers/         # Customer CRUD
│   ├── dashboard/         # Financial dashboard data
│   ├── gemini-upload/     # Image upload & AI extraction
│   ├── login/logout       # Auth endpoints
│   └── settings/          # App settings (Gemini config, cache management)
├── login/                 # Login page (public)
├── types/                 # TypeScript interfaces (dashboard, menu, order, customer, gemini)
└── layout.tsx             # Root layout with SiteHeader & Toaster

components/               # Reusable React components
├── modals/               # Modal dialogs (change-sum, customer, date)
├── order-form.tsx        # Order creation/editing
├── menu-form.tsx         # Menu item management
├── image-upload-dialog.tsx # Image bulk upload UI
├── data-table.tsx        # Main orders/menu data table
├── dashboard-content.tsx  # Financial summary display
├── customer-actions.tsx   # Customer card actions
└── ... (other components)

hooks/                    # Custom React hooks
├── use-gemini-stream.ts  # AI image extraction streaming
├── use-customer-modal.ts # Customer selection modal state
├── use-change-calculator-modal.ts
└── use-date.ts

lib/                      # Utility functions
├── swr-keys.ts           # SWR cache key factory (orders, menu, dashboard, customers)
├── gemini/               # Google AI integration
│   ├── provider.ts       # Gemini/Vertex AI API client
│   └── settings.ts       # AI model configuration
├── prisma.ts             # Prisma client singleton
├── utils.ts              # Common utilities
├── customerNames.ts      # Customer alias matching
├── fuzzy-match.ts        # Fuzzy string matching for customer names
└── gemini-response-type.ts # Type definitions for AI responses

prisma/
├── schema.prisma         # Database schema (Customer, Menu, Order, OrderItem, AppSetting)
└── seed.ts               # Database seeding script
```

## Database Schema

**Key Models:**
- **Customer:** name (unique), aliases[], orders
- **Menu:** date, name, price, amount, sortOrder (for display order)
- **Order:** customerId, orderItems, payment (CASH/ONLINE/UNKNOWN), status (PENDING/COMPLETED), date
- **OrderItem:** orderId + menuId (composite unique), amount
- **AppSetting:** Gemini provider config (model, subModel, options)

## Development Workflow

### Starting Development
```bash
npm run dev
# Starts on http://localhost:3000 with Turbopack (faster rebuilds)
```

### Building & Production
```bash
npm run build    # Creates optimized Next.js build
npm start        # Runs production server
```

### Code Quality
```bash
npm run lint     # Run ESLint (checks ts/tsx/js/jsx)
```

### Database
```bash
npx prisma generate      # Generate Prisma client in app/generated/
npx prisma migrate dev   # Create & run migrations
npx prisma studio       # Open Prisma GUI for data inspection
npx prisma db seed      # Run seed script
```

**Note:** `postinstall` hook auto-runs `prisma generate` after `npm install`

## Authentication & Security

- **Middleware (middleware.ts):** Validates session cookie or x-api-key header
  - Public routes: /login, /api/login, /api/logout
  - Protected routes: Redirect to /login if no session
  - API routes: Return 401 if neither session nor valid API key
- **Login:** Passcode-based with session cookie
- **Internal APIs:** Use x-api-key header (INTERNAL_API_KEY env var)
- **Environment Variables:** DATABASE_URL, LOGIN_PASSCODE, INTERNAL_API_KEY, Google Cloud credentials

## Key Architectural Patterns

### Data Fetching (SWR)
- Centralized cache keys in `lib/swr-keys.ts`
- Auto-refresh on window focus (SWR default)
- Keys include date param for date-scoped filtering
- Example: `useSWR(swrKeys.orders(date), fetch)`

### Gemini/Vertex AI Integration (lib/gemini/)
- `provider.ts`: Abstract provider interface (Google, Vertex, mock)
- `settings.ts`: Model configuration stored in AppSetting
- `use-gemini-stream.ts`: Streaming hook for image processing
- Prompt caching enabled for better performance
- Cache management endpoint: `/api/settings/gemini/caches`

### Form Handling
- react-hook-form + Zod schema validation
- Components like MenuForm, OrderForm manage their own validation
- Toast notifications (react-hot-toast) for user feedback

### State Management
- **Server state (SWR):** Orders, menu, customers, dashboard data
- **Client state (Zustand):** Modal visibility, form state, selected items
- **No prop drilling:** Modals/stores manage their own state

### Fuzzy Matching
- `lib/customerNames.ts`: Fuzzy-matches user input to existing customer aliases
- Helps with typos and alternative names

## Component Design Notes

- Data tables use TanStack React Table (@tanstack/react-table)
- Modals use Radix UI Dialog primitives
- Forms use Radix UI Select, Checkbox, etc.
- Icons: Tabler Icons (filled) + Lucide React (outlines)
- Responsive design via Tailwind breakpoints (mobile-first)

## Environment & Deployment

- **Local:** .env file with DATABASE_URL, API keys, etc.
- **Vercel/Docker:** Use environment variables in deployment platform
- **Database:** PostgreSQL required; Prisma Accelerate for serverless optimization
- **Docker:** Dockerfile & docker-compose.yml provided for local setup

## Common Tasks

### Adding a new API endpoint
1. Create file in `app/api/<resource>/route.ts`
2. Use Prisma client from `lib/prisma.ts`
3. Validate request with Zod
4. Return JSON response
5. Add SWR key if it's a GET endpoint

### Adding a new form
1. Create component using react-hook-form
2. Add Zod schema for validation
3. Call API endpoint and handle response
4. Show toast on success/error
5. Trigger SWR revalidation on success

### Modifying database schema
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Prisma client auto-generates in `app/generated/`

### Debugging
- Use browser DevTools for frontend (React tree, network requests)
- Check server logs for API errors
- Use Prisma Studio: `npx prisma studio` for database inspection
- SWR DevTools: Browser ext for cache inspection

## Performance Considerations

- Turbopack for fast dev server rebuilds
- Prisma Accelerate for serverless query optimization
- SWR: Client-side caching with auto-revalidation
- Prompt caching in Gemini API (see /api/settings/gemini/caches)
- Image compression via browser-image-compression before upload

## Testing Notes

- No built-in test suite yet (consider adding Jest/Vitest)
- Manual testing via dev server is current workflow
- Try local data with docker-compose before deploying

