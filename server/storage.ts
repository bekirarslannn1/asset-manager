import {
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Brand, type InsertBrand,
  type Product, type InsertProduct,
  type Review, type InsertReview,
  type CartItem, type InsertCartItem,
  type Order, type InsertOrder,
  type Banner, type InsertBanner,
  type SiteSetting, type InsertSiteSetting,
  type Coupon, type InsertCoupon,
  type Favorite, type InsertFavorite,
  type Newsletter, type InsertNewsletter,
  type Page, type InsertPage,
  users, categories, brands, products, reviews, cartItems, orders, banners, siteSettings, coupons, favorites, newsletters, pages,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, desc, asc, gte, lte, inArray, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(cat: InsertCategory): Promise<Category>;
  updateCategory(id: number, cat: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;

  getBrands(): Promise<Brand[]>;
  getBrandBySlug(slug: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: number, brand: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: number): Promise<void>;

  getProducts(filters?: ProductFilters): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  getFeaturedProducts(): Promise<Product[]>;
  getBestSellers(): Promise<Product[]>;
  getNewArrivals(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  getReviewsByProduct(productId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  getBanners(type?: string): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: number): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  getSettings(): Promise<SiteSetting[]>;
  setSetting(key: string, value: string, type?: string): Promise<SiteSetting>;

  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;

  getFavorites(sessionId: string): Promise<(Favorite & { product: Product })[]>;
  toggleFavorite(sessionId: string, productId: number): Promise<boolean>;

  subscribeNewsletter(email: string): Promise<Newsletter>;

  getPages(): Promise<Page[]>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined>;
}

export interface ProductFilters {
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  isSugarFree?: boolean;
  sortBy?: string;
  search?: string;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  }
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
    return cat;
  }
  async createCategory(cat: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(cat).returning();
    return created;
  }
  async updateCategory(id: number, cat: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(cat).where(eq(categories.id, id)).returning();
    return updated;
  }
  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getBrands(): Promise<Brand[]> {
    return db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.sortOrder));
  }
  async getBrandBySlug(slug: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.slug, slug));
    return brand;
  }
  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [created] = await db.insert(brands).values(brand).returning();
    return created;
  }
  async updateBrand(id: number, brand: Partial<InsertBrand>): Promise<Brand | undefined> {
    const [updated] = await db.update(brands).set(brand).where(eq(brands.id, id)).returning();
    return updated;
  }
  async deleteBrand(id: number): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true)).$dynamic();
    const conditions: any[] = [eq(products.isActive, true)];

    if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
    if (filters?.brandId) conditions.push(eq(products.brandId, filters.brandId));
    if (filters?.minPrice) conditions.push(gte(products.price, String(filters.minPrice)));
    if (filters?.maxPrice) conditions.push(lte(products.price, String(filters.maxPrice)));
    if (filters?.isVegan) conditions.push(eq(products.isVegan, true));
    if (filters?.isGlutenFree) conditions.push(eq(products.isGlutenFree, true));
    if (filters?.isLactoseFree) conditions.push(eq(products.isLactoseFree, true));
    if (filters?.isSugarFree) conditions.push(eq(products.isSugarFree, true));
    if (filters?.search) conditions.push(ilike(products.name, `%${filters.search}%`));

    let orderClause;
    switch (filters?.sortBy) {
      case 'price_asc': orderClause = asc(products.price); break;
      case 'price_desc': orderClause = desc(products.price); break;
      case 'newest': orderClause = desc(products.createdAt); break;
      case 'rating': orderClause = desc(products.rating); break;
      case 'best_seller': orderClause = desc(products.isBestSeller); break;
      default: orderClause = desc(products.createdAt);
    }

    return db.select().from(products).where(and(...conditions)).orderBy(orderClause);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }
  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }
  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }
  async getFeaturedProducts(): Promise<Product[]> {
    return db.select().from(products).where(and(eq(products.isActive, true), eq(products.isFeatured, true))).limit(12);
  }
  async getBestSellers(): Promise<Product[]> {
    return db.select().from(products).where(and(eq(products.isActive, true), eq(products.isBestSeller, true))).limit(12);
  }
  async getNewArrivals(): Promise<Product[]> {
    return db.select().from(products).where(and(eq(products.isActive, true), eq(products.isNewArrival, true))).orderBy(desc(products.createdAt)).limit(12);
  }
  async searchProducts(query: string): Promise<Product[]> {
    return db.select().from(products).where(and(eq(products.isActive, true), ilike(products.name, `%${query}%`))).limit(20);
  }

  async getReviewsByProduct(productId: number): Promise<Review[]> {
    return db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true))).orderBy(desc(reviews.createdAt));
  }
  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]> {
    const items = await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    const result: (CartItem & { product: Product })[] = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) result.push({ ...item, product });
    }
    return result;
  }
  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const existing = await db.select().from(cartItems).where(
      and(eq(cartItems.sessionId, item.sessionId), eq(cartItems.productId, item.productId), eq(cartItems.selectedFlavor, item.selectedFlavor || ''), eq(cartItems.selectedWeight, item.selectedWeight || ''))
    );
    if (existing.length > 0) {
      const [updated] = await db.update(cartItems).set({ quantity: existing[0].quantity + (item.quantity || 1) }).where(eq(cartItems.id, existing[0].id)).returning();
      return updated;
    }
    const [created] = await db.insert(cartItems).values(item).returning();
    return created;
  }
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated;
  }
  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }
  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getBanners(type?: string): Promise<Banner[]> {
    if (type) {
      return db.select().from(banners).where(and(eq(banners.isActive, true), eq(banners.type, type))).orderBy(asc(banners.sortOrder));
    }
    return db.select().from(banners).where(eq(banners.isActive, true)).orderBy(asc(banners.sortOrder));
  }
  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [created] = await db.insert(banners).values(banner).returning();
    return created;
  }
  async updateBanner(id: number, banner: Partial<InsertBanner>): Promise<Banner | undefined> {
    const [updated] = await db.update(banners).set(banner).where(eq(banners.id, id)).returning();
    return updated;
  }
  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting?.value || null;
  }
  async getSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }
  async setSetting(key: string, value: string, type: string = "text"): Promise<SiteSetting> {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    if (existing.length > 0) {
      const [updated] = await db.update(siteSettings).set({ value, type }).where(eq(siteSettings.key, key)).returning();
      return updated;
    }
    const [created] = await db.insert(siteSettings).values({ key, value, type }).returning();
    return created;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(and(eq(coupons.code, code), eq(coupons.isActive, true)));
    return coupon;
  }
  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [created] = await db.insert(coupons).values(coupon).returning();
    return created;
  }

  async getFavorites(sessionId: string): Promise<(Favorite & { product: Product })[]> {
    const favs = await db.select().from(favorites).where(eq(favorites.sessionId, sessionId));
    const result: (Favorite & { product: Product })[] = [];
    for (const fav of favs) {
      const [product] = await db.select().from(products).where(eq(products.id, fav.productId));
      if (product) result.push({ ...fav, product });
    }
    return result;
  }
  async toggleFavorite(sessionId: string, productId: number): Promise<boolean> {
    const existing = await db.select().from(favorites).where(
      and(eq(favorites.sessionId, sessionId), eq(favorites.productId, productId))
    );
    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return false;
    }
    await db.insert(favorites).values({ sessionId, productId });
    return true;
  }

  async subscribeNewsletter(email: string): Promise<Newsletter> {
    const existing = await db.select().from(newsletters).where(eq(newsletters.email, email));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(newsletters).values({ email }).returning();
    return created;
  }

  async getPages(): Promise<Page[]> {
    return db.select().from(pages).where(eq(pages.isActive, true));
  }
  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
    return page;
  }
  async createPage(page: InsertPage): Promise<Page> {
    const [created] = await db.insert(pages).values(page).returning();
    return created;
  }
  async updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined> {
    const [updated] = await db.update(pages).set(page).where(eq(pages.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
