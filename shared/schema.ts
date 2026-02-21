import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, decimal, timestamp, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").notNull(),
  brandId: integer("brand_id"),
  images: text("images").array(),
  flavors: text("flavors").array(),
  weights: text("weights").array(),
  stock: integer("stock").default(0),
  sku: text("sku"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  isNewArrival: boolean("is_new_arrival").default(false),
  isBestSeller: boolean("is_best_seller").default(false),
  tags: text("tags").array(),
  nutritionFacts: jsonb("nutrition_facts"),
  usageInstructions: text("usage_instructions"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isLactoseFree: boolean("is_lactose_free").default(false),
  isSugarFree: boolean("is_sugar_free").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  flavor: text("flavor"),
  weight: text("weight"),
  sku: text("sku").notNull(),
  barcode: text("barcode"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: decimal("compare_price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  image: text("image"),
  isActive: boolean("is_active").default(true),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id"),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  quantity: integer("quantity").notNull().default(1),
  selectedFlavor: text("selected_flavor"),
  selectedWeight: text("selected_weight"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: jsonb("shipping_address"),
  couponCode: text("coupon_code"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"),
  paymentId: text("payment_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  image: text("image"),
  link: text("link"),
  buttonText: text("button_text"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  type: text("type").notNull().default("hero"),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type").default("text"),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  expiresAt: timestamp("expires_at"),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull(),
});

export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  isActive: boolean("is_active").default(true),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const consentRecords = pgTable("consent_records", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id"),
  userId: integer("user_id"),
  consentType: text("consent_type").notNull(),
  granted: boolean("granted").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  policyVersion: text("policy_version"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const pageLayouts = pgTable("page_layouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  blocks: jsonb("blocks").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLoginAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertProductVariantSchema = createInsertSchema(productVariants).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertBannerSchema = createInsertSchema(banners).omit({ id: true });
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true });
export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true });
export const insertNewsletterSchema = createInsertSchema(newsletters).omit({ id: true, createdAt: true });
export const insertPageSchema = createInsertSchema(pages).omit({ id: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({ id: true, createdAt: true });
export const insertPageLayoutSchema = createInsertSchema(pageLayouts).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type PageLayout = typeof pageLayouts.$inferSelect;
export type InsertPageLayout = z.infer<typeof insertPageLayoutSchema>;
