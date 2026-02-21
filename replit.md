# FitSupp - Protein & Supplement E-Commerce Platform

## Overview
A professional protein and supplement e-commerce platform for the Turkish market with a dark theme and neon green accents. All content is dynamic and manageable through an admin panel.

## Recent Changes
- 2026-02-21: Initial build - complete e-commerce platform with dark theme, product catalog, cart, admin panel

## User Preferences
- Dark theme: #0a0a0a background, #1a1a1a cards, #39FF14 neon green accents
- 100% dynamic architecture - no hardcoded content
- Full Turkish (Turkce) language interface
- Real-time admin-to-frontend sync via cache invalidation

## Project Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Shadcn UI
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **State Management**: TanStack React Query

### Database Schema (13 tables)
- users, categories, brands, products, reviews
- cartItems, orders, banners, siteSettings
- coupons, favorites, newsletters, pages

### Key Files
- `shared/schema.ts` - Database schema and types
- `server/storage.ts` - Data access layer
- `server/routes.ts` - API endpoints
- `server/seed.ts` - Initial seed data
- `client/src/components/layout.tsx` - Header, footer, WhatsApp button
- `client/src/pages/home.tsx` - Home page with hero slider, product sections
- `client/src/pages/products.tsx` - Product listing with filters
- `client/src/pages/product-detail.tsx` - Product detail page
- `client/src/pages/cart.tsx` - Shopping cart
- `client/src/pages/admin.tsx` - Admin panel

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

### Theme
- Dark mode always on (class="dark" on HTML element)
- CSS variables in `client/src/index.css`
- Primary color (neon green #39FF14) stored in database settings
- Background: hsl(0 0% 4%) = ~#0a0a0a
- Card: hsl(0 0% 7%) = ~#121212
