# FitSupp - Enterprise Protein & Supplement E-Commerce Platform

## Overview
A professional, enterprise-grade protein and supplement e-commerce platform for the Turkish market with a dark theme (#0a0a0a, #1a1a1a) and neon green accents (#39FF14). All content is 100% dynamic and manageable through admin panel. Features JWT auth, RBAC, audit logging, KVKK compliance, dynamic theme engine, SDUI page builder, and dynamic navigation.

## Recent Changes
- 2026-02-21: Admin panel modularized into 18 separate tab components in client/src/pages/admin/
- 2026-02-21: Dynamic theme engine - CSS variables applied from DB settings in real-time
- 2026-02-21: Dynamic header/footer navigation - renders links from navigation_links DB table
- 2026-02-21: SDUI homepage renderer - homepage sections rendered from DB layout blocks with fallback
- 2026-02-21: Added backend routes for navigation CRUD, reviews admin, coupons CRUD, KPI analytics
- 2026-02-21: Payment integration - iyzico payment gateway with server-side price validation
- 2026-02-21: Security hardening - JWT requires SESSION_SECRET, admin routes auth-gated
- 2026-02-21: Enterprise expansion - Product variants/SKU, RBAC, JWT auth, audit logging, KVKK consent

## User Preferences
- Dark theme: #0a0a0a background, #1a1a1a cards, #39FF14 neon green accents
- 100% dynamic architecture - no hardcoded content
- Full Turkish (Turkce) language interface
- Real-time admin-to-frontend sync via cache invalidation
- Enterprise-grade features: RBAC, audit logs, KVKK compliance
- "Kolaya kacmadan yap" - implement properly without shortcuts

## Project Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Shadcn UI + Recharts
- **Backend**: Express.js + TypeScript + JWT (jsonwebtoken) + bcryptjs
- **Database**: PostgreSQL via Drizzle ORM
- **State Management**: TanStack React Query

### Database Schema (18 tables)
- users (with roles: super_admin, admin, seller, support, logistics, customer)
- categories, brands, products, productVariants, reviews
- cartItems, orders, banners, siteSettings
- coupons, favorites, newsletters, pages
- auditLogs, consentRecords, pageLayouts, navigationLinks

### Authentication & Authorization
- JWT tokens with 7-day expiration
- RBAC with permission-based module access
- Roles: super_admin (all), admin (most), seller (products/orders), support (orders/users), logistics (orders)
- Admin login: username=admin, password=admin123

### Key Files
- `shared/schema.ts` - Database schema and types (18 tables)
- `server/storage.ts` - Data access layer with 50+ methods
- `server/routes.ts` - API endpoints with auth middleware, audit logging, iyzico payment, KPI analytics
- `server/seed.ts` - Initial seed data with admin user, variants, layouts
- `client/src/components/layout.tsx` - Header, footer, WhatsApp button, dynamic theme application, dynamic navigation
- `client/src/components/cookie-consent.tsx` - KVKK cookie consent banner
- `client/src/pages/admin.tsx` - Enterprise admin panel (18 tabs) with login gate
- `client/src/pages/admin/*.tsx` - 18 modular admin tab components
- `client/src/pages/checkout.tsx` - 2-step checkout with iyzico payment
- `client/src/pages/home.tsx` - SDUI-driven homepage with block renderer
- `client/src/lib/queryClient.ts` - API client with auth token injection

### Admin Panel Tabs (18 modular components)
1. KPI Dashboard (Recharts analytics, conversion rate, AOV, revenue trends)
2. Products management (CRUD with images, flavors, weights, nutrition facts)
3. Categories management (CRUD with images, sort order)
4. Orders management (status tracking, details view)
5. Reviews moderation (approve/reject/delete)
6. Coupons management (create/edit/delete, expiry, usage limits)
7. Brands management (CRUD with logos)
8. Banners management (hero slider, promotional banners)
9. Navigation management (header/footer dynamic menus)
10. Users & roles management (RBAC, anonymize for KVKK)
11. Product variants/SKU management
12. Newsletter subscribers list
13. Audit logs viewer (filterable by entity)
14. Theme engine (dynamic colors, fonts, live preview)
15. SDUI Page Builder (drag-and-drop homepage sections)
16. KVKK compliance module (consent records, CSV/JSON export, filters)
17. Pages editor (static content pages)
18. Site settings (logo, SEO, contact, favicon)

### Payment Integration
- iyzico (sandbox by default, configurable via IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_URI env vars)
- Server-side price validation (prices computed from DB, not trusted from client)
- 2-step checkout: address form -> card payment with KVKK/terms acceptance

### Dynamic Features
- **Theme Engine**: Admin sets colors/fonts via settings -> CSS variables applied in real-time via hexToHSL conversion in Layout component
- **Dynamic Navigation**: Admin creates header/footer links via navigation_links table -> rendered dynamically alongside static nav items
- **SDUI Homepage**: Admin creates page layouts with ordered blocks (hero_slider, categories_grid, featured_products, etc.) -> homepage renders from DB layout, falls back to default order

### URL Structure
- `/` - Home page (SDUI-driven)
- `/urunler` - All products
- `/urun/:slug` - Product detail
- `/kategori/:slug` - Category page
- `/sepet` - Cart
- `/odeme` - Checkout/payment
- `/favoriler` - Favorites
- `/markalar` - Brands
- `/sayfa/:slug` - Static pages
- `/supplement-sihirbazi` - Product recommendation wizard
- `/giris` - Login
- `/uye-ol` - Register
- `/admin` - Admin panel (login required)
