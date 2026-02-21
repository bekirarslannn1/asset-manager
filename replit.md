# FitSupp - Enterprise Protein & Supplement E-Commerce Platform

## Overview
A professional, enterprise-grade protein and supplement e-commerce platform for the Turkish market with a dark theme (#0a0a0a, #1a1a1a) and neon green accents (#39FF14). All content is 100% dynamic and manageable through admin panel. Features JWT auth, RBAC, audit logging, KVKK compliance, dynamic theme engine, and SDUI page builder.

## Recent Changes
- 2026-02-21: Enterprise expansion - Added product variants/SKU system, RBAC with 5 role types, JWT authentication, audit logging, KVKK consent module, dynamic theme engine, KPI analytics dashboard, SDUI page builder, cookie consent banner
- 2026-02-21: Initial build - complete e-commerce platform with dark theme, product catalog, cart, admin panel

## User Preferences
- Dark theme: #0a0a0a background, #1a1a1a cards, #39FF14 neon green accents
- 100% dynamic architecture - no hardcoded content
- Full Turkish (Turkce) language interface
- Real-time admin-to-frontend sync via cache invalidation
- Enterprise-grade features: RBAC, audit logs, KVKK compliance

## Project Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Shadcn UI + Recharts
- **Backend**: Express.js + TypeScript + JWT (jsonwebtoken) + bcryptjs
- **Database**: PostgreSQL via Drizzle ORM
- **State Management**: TanStack React Query

### Database Schema (17 tables)
- users (with roles: super_admin, admin, seller, support, logistics, customer)
- categories, brands, products, productVariants, reviews
- cartItems, orders, banners, siteSettings
- coupons, favorites, newsletters, pages
- auditLogs, consentRecords, pageLayouts

### Authentication & Authorization
- JWT tokens with 7-day expiration
- RBAC with permission-based module access
- Roles: super_admin (all), admin (most), seller (products/orders), support (orders/users), logistics (orders)
- Admin login: username=admin, password=admin123

### Key Files
- `shared/schema.ts` - Database schema and types (17 tables)
- `server/storage.ts` - Data access layer with 40+ methods
- `server/routes.ts` - API endpoints with auth middleware, audit logging
- `server/seed.ts` - Initial seed data with admin user, variants, layouts
- `client/src/components/layout.tsx` - Header, footer, WhatsApp button
- `client/src/components/cookie-consent.tsx` - KVKK cookie consent banner
- `client/src/components/theme-engine.tsx` - Dynamic CSS variable application
- `client/src/pages/admin.tsx` - Enterprise admin panel (12 tabs)
- `client/src/pages/product-detail.tsx` - Product detail with variant pricing
- `client/src/pages/home.tsx` - Home page with hero slider, product sections

### Admin Panel Tabs
1. KPI Dashboard (Recharts analytics)
2. Products management
3. Categories management
4. Banners management
5. Users & roles management (RBAC)
6. Product variants/SKU management
7. Audit logs viewer
8. Theme engine (dynamic colors, fonts)
9. SDUI Page Builder
10. KVKK compliance module
11. Pages editor
12. Site settings

### URL Structure
- `/` - Home page
- `/urunler` - All products
- `/urun/:slug` - Product detail
- `/kategori/:slug` - Category page
- `/sepet` - Cart
- `/favoriler` - Favorites
- `/markalar` - Brands
- `/sayfa/:slug` - Static pages
- `/admin` - Admin panel
