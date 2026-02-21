import {
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Brand, type InsertBrand,
  type Product, type InsertProduct,
  type ProductVariant, type InsertProductVariant,
  type Review, type InsertReview,
  type CartItem, type InsertCartItem,
  type Order, type InsertOrder,
  type Banner, type InsertBanner,
  type SiteSetting, type InsertSiteSetting,
  type Coupon, type InsertCoupon,
  type Favorite, type InsertFavorite,
  type Newsletter, type InsertNewsletter,
  type Page, type InsertPage,
  type AuditLog, type InsertAuditLog,
  type ConsentRecord, type InsertConsentRecord,
  type PageLayout, type InsertPageLayout,
  type NavigationLink, type InsertNavigationLink,
  type Bundle, type InsertBundle,
  type Testimonial, type InsertTestimonial,
  type PaymentMethod, type InsertPaymentMethod,
  type BlogCategory, type InsertBlogCategory,
  type BlogPost, type InsertBlogPost,
  type BlogComment, type InsertBlogComment,
  users, categories, brands, products, productVariants, reviews, cartItems, orders, banners, siteSettings, coupons, favorites, newsletters, pages, auditLogs, consentRecords, pageLayouts, navigationLinks, bundles, testimonials, paymentMethods, blogCategories, blogPosts, blogComments,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, asc, gte, lte, sql, count, sum } from "drizzle-orm";

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

export class DatabaseStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }
  async updateUserLogin(id: number): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder));
  }
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.sortOrder));
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

  async getNavigationLinks(): Promise<NavigationLink[]> {
    return db.select().from(navigationLinks).where(eq(navigationLinks.isActive, true)).orderBy(asc(navigationLinks.sortOrder));
  }
  async getNavigationLinksByPosition(position: string): Promise<NavigationLink[]> {
    return db.select().from(navigationLinks).where(and(eq(navigationLinks.isActive, true), eq(navigationLinks.position, position))).orderBy(asc(navigationLinks.sortOrder));
  }
  async createNavigationLink(link: InsertNavigationLink): Promise<NavigationLink> {
    const [created] = await db.insert(navigationLinks).values(link).returning();
    return created;
  }
  async updateNavigationLink(id: number, data: Partial<InsertNavigationLink>): Promise<NavigationLink | undefined> {
    const [updated] = await db.update(navigationLinks).set(data).where(eq(navigationLinks.id, id)).returning();
    return updated;
  }
  async deleteNavigationLink(id: number): Promise<void> {
    await db.delete(navigationLinks).where(eq(navigationLinks.id, id));
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
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
  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
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
    const q = query.trim();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    const conditions = terms.map(term =>
      or(
        ilike(products.name, `%${term}%`),
        ilike(products.description, `%${term}%`),
        ilike(products.shortDescription, `%${term}%`),
        sql`EXISTS (SELECT 1 FROM unnest(${products.tags}) AS t WHERE t ILIKE ${'%' + term + '%'})`,
      )
    );
    return db.select().from(products).where(and(eq(products.isActive, true), ...conditions)).limit(20);
  }

  async searchProductsSuggestions(query: string): Promise<Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'comparePrice' | 'images'>[]> {
    const q = query.trim();
    if (!q) return [];
    return db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      comparePrice: products.comparePrice,
      images: products.images,
    }).from(products).where(and(
      eq(products.isActive, true),
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.shortDescription, `%${q}%`),
        sql`EXISTS (SELECT 1 FROM unnest(${products.tags}) AS t WHERE t ILIKE ${'%' + q + '%'})`,
      ),
    )).limit(8);
  }

  async getVariantsByProduct(productId: number): Promise<ProductVariant[]> {
    return db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(asc(productVariants.id));
  }
  async getVariantById(id: number): Promise<ProductVariant | undefined> {
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, id));
    return v;
  }
  async createVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [created] = await db.insert(productVariants).values(variant).returning();
    return created;
  }
  async updateVariant(id: number, data: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updated] = await db.update(productVariants).set(data).where(eq(productVariants.id, id)).returning();
    return updated;
  }
  async deleteVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  async getReviewsByProduct(productId: number): Promise<Review[]> {
    return db.select().from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true))).orderBy(desc(reviews.createdAt));
  }
  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }
  async getAllReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }
  async updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
    const [updated] = await db.update(reviews).set(data).where(eq(reviews.id, id)).returning();
    return updated;
  }
  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
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
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }
  async getOrderStats() {
    const allOrders = await db.select().from(orders);
    const totalRevenue = allOrders.reduce((s, o) => s + parseFloat(o.total), 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = allOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    const cancelledOrders = allOrders.filter(o => o.status === 'cancelled').length;

    const last30 = allOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    });
    const last30Revenue = last30.reduce((s, o) => s + parseFloat(o.total), 0);

    const revenueByDay: Record<string, number> = {};
    allOrders.forEach(o => {
      const day = new Date(o.createdAt).toISOString().split("T")[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + parseFloat(o.total);
    });

    const ordersByStatus: Record<string, number> = {};
    allOrders.forEach(o => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      last30Revenue,
      revenueByDay,
      ordersByStatus,
    };
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
  async getCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.id));
  }
  async updateCoupon(id: number, data: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [updated] = await db.update(coupons).set(data).where(eq(coupons.id, id)).returning();
    return updated;
  }
  async deleteCoupon(id: number): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
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
  async getNewsletters(): Promise<Newsletter[]> {
    return db.select().from(newsletters).orderBy(desc(newsletters.createdAt));
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

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  async getAuditLogsByEntity(entity: string): Promise<AuditLog[]> {
    return db.select().from(auditLogs).where(eq(auditLogs.entity, entity)).orderBy(desc(auditLogs.createdAt)).limit(50);
  }

  async createConsentRecord(record: InsertConsentRecord): Promise<ConsentRecord> {
    const [created] = await db.insert(consentRecords).values(record).returning();
    return created;
  }
  async getConsentsBySession(sessionId: string): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).where(eq(consentRecords.sessionId, sessionId)).orderBy(desc(consentRecords.createdAt));
  }
  async getConsentRecords(): Promise<ConsentRecord[]> {
    return db.select().from(consentRecords).orderBy(desc(consentRecords.createdAt)).limit(200);
  }

  async getPageLayouts(): Promise<PageLayout[]> {
    return db.select().from(pageLayouts).orderBy(desc(pageLayouts.createdAt));
  }
  async getPageLayoutBySlug(slug: string): Promise<PageLayout | undefined> {
    const [layout] = await db.select().from(pageLayouts).where(eq(pageLayouts.slug, slug));
    return layout;
  }
  async createPageLayout(layout: InsertPageLayout): Promise<PageLayout> {
    const [created] = await db.insert(pageLayouts).values(layout).returning();
    return created;
  }
  async updatePageLayout(id: number, data: Partial<InsertPageLayout>): Promise<PageLayout | undefined> {
    const [updated] = await db.update(pageLayouts).set(data).where(eq(pageLayouts.id, id)).returning();
    return updated;
  }
  async deletePageLayout(id: number): Promise<void> {
    await db.delete(pageLayouts).where(eq(pageLayouts.id, id));
  }

  async getTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials).where(eq(testimonials.isActive, true)).orderBy(asc(testimonials.sortOrder));
  }
  async getAllTestimonials(): Promise<Testimonial[]> {
    return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
  }
  async createTestimonial(data: InsertTestimonial): Promise<Testimonial> {
    const [created] = await db.insert(testimonials).values(data).returning();
    return created;
  }
  async updateTestimonial(id: number, data: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [updated] = await db.update(testimonials).set(data).where(eq(testimonials.id, id)).returning();
    return updated;
  }
  async deleteTestimonial(id: number): Promise<void> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true)).orderBy(asc(paymentMethods.sortOrder));
  }
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder));
  }
  async createPaymentMethod(data: InsertPaymentMethod): Promise<PaymentMethod> {
    const [created] = await db.insert(paymentMethods).values(data).returning();
    return created;
  }
  async updatePaymentMethod(id: number, data: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const [updated] = await db.update(paymentMethods).set(data).where(eq(paymentMethods.id, id)).returning();
    return updated;
  }
  async deletePaymentMethod(id: number): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  async getBundles(): Promise<Bundle[]> {
    return db.select().from(bundles).where(eq(bundles.isActive, true)).orderBy(asc(bundles.sortOrder));
  }
  async getAllBundles(): Promise<Bundle[]> {
    return db.select().from(bundles).orderBy(asc(bundles.sortOrder));
  }
  async getBundleBySlug(slug: string): Promise<Bundle | undefined> {
    const [bundle] = await db.select().from(bundles).where(eq(bundles.slug, slug));
    return bundle;
  }
  async getBundlesByGoal(goal: string): Promise<Bundle[]> {
    return db.select().from(bundles).where(eq(bundles.isActive, true)).orderBy(asc(bundles.sortOrder));
  }
  async createBundle(data: InsertBundle): Promise<Bundle> {
    const [created] = await db.insert(bundles).values(data).returning();
    return created;
  }
  async updateBundle(id: number, data: Partial<InsertBundle>): Promise<Bundle | undefined> {
    const [updated] = await db.update(bundles).set(data).where(eq(bundles.id, id)).returning();
    return updated;
  }
  async deleteBundle(id: number): Promise<void> {
    await db.delete(bundles).where(eq(bundles.id, id));
  }

  async getBlogCategories(): Promise<BlogCategory[]> {
    return db.select().from(blogCategories).where(eq(blogCategories.isActive, true)).orderBy(asc(blogCategories.sortOrder));
  }
  async getAllBlogCategories(): Promise<BlogCategory[]> {
    return db.select().from(blogCategories).orderBy(asc(blogCategories.sortOrder));
  }
  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    const [cat] = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug));
    return cat;
  }
  async createBlogCategory(data: InsertBlogCategory): Promise<BlogCategory> {
    const [created] = await db.insert(blogCategories).values(data).returning();
    return created;
  }
  async updateBlogCategory(id: number, data: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined> {
    const [updated] = await db.update(blogCategories).set(data).where(eq(blogCategories.id, id)).returning();
    return updated;
  }
  async deleteBlogCategory(id: number): Promise<void> {
    await db.delete(blogCategories).where(eq(blogCategories.id, id));
  }

  async getBlogPosts(filters?: { categoryId?: number; tag?: string; search?: string; published?: boolean }): Promise<BlogPost[]> {
    const conditions = [];
    if (filters?.published !== false) {
      conditions.push(eq(blogPosts.isPublished, true));
    }
    if (filters?.categoryId) {
      conditions.push(eq(blogPosts.categoryId, filters.categoryId));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(blogPosts.title, `%${filters.search}%`),
          ilike(blogPosts.content, `%${filters.search}%`)
        )!
      );
    }
    if (conditions.length > 0) {
      return db.select().from(blogPosts).where(and(...conditions)).orderBy(desc(blogPosts.publishedAt));
    }
    return db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  }
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }
  async createBlogPost(data: InsertBlogPost): Promise<BlogPost> {
    const readingTime = Math.max(1, Math.ceil((data.content || '').split(/\s+/).length / 200));
    const [created] = await db.insert(blogPosts).values({ ...data, readingTime }).returning();
    return created;
  }
  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.content) {
      updateData.readingTime = Math.max(1, Math.ceil(data.content.split(/\s+/).length / 200));
    }
    const [updated] = await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id)).returning();
    return updated;
  }
  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogComments).where(eq(blogComments.postId, id));
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }
  async incrementBlogPostView(id: number): Promise<void> {
    await db.update(blogPosts).set({ viewCount: sql`${blogPosts.viewCount} + 1` }).where(eq(blogPosts.id, id));
  }
  async getRelatedBlogPosts(postId: number, categoryId: number | null, tags: string[] | null, limit: number = 3): Promise<BlogPost[]> {
    const conditions = [eq(blogPosts.isPublished, true), sql`${blogPosts.id} != ${postId}`];
    if (categoryId) {
      conditions.push(eq(blogPosts.categoryId, categoryId));
    }
    return db.select().from(blogPosts).where(and(...conditions)).orderBy(desc(blogPosts.publishedAt)).limit(limit);
  }
  async getFeaturedBlogPosts(limit: number = 3): Promise<BlogPost[]> {
    return db.select().from(blogPosts).where(and(eq(blogPosts.isPublished, true), eq(blogPosts.isFeatured, true))).orderBy(desc(blogPosts.publishedAt)).limit(limit);
  }

  async getBlogComments(postId: number, approvedOnly: boolean = true): Promise<BlogComment[]> {
    const conditions = [eq(blogComments.postId, postId)];
    if (approvedOnly) {
      conditions.push(eq(blogComments.isApproved, true));
    }
    return db.select().from(blogComments).where(and(...conditions)).orderBy(desc(blogComments.createdAt));
  }
  async getAllBlogComments(): Promise<BlogComment[]> {
    return db.select().from(blogComments).orderBy(desc(blogComments.createdAt));
  }
  async createBlogComment(data: InsertBlogComment): Promise<BlogComment> {
    const [created] = await db.insert(blogComments).values(data).returning();
    return created;
  }
  async updateBlogComment(id: number, data: Partial<InsertBlogComment>): Promise<BlogComment | undefined> {
    const [updated] = await db.update(blogComments).set(data).where(eq(blogComments.id, id)).returning();
    return updated;
  }
  async deleteBlogComment(id: number): Promise<void> {
    await db.delete(blogComments).where(eq(blogComments.id, id));
  }

  async anonymizeUser(userId: number): Promise<void> {
    await db.update(users).set({
      username: `deleted_${userId}`,
      email: `deleted_${userId}@anonymized.local`,
      fullName: "Silinmiş Kullanıcı",
      phone: null,
      avatar: null,
      password: "ANONYMIZED",
      isActive: false,
    }).where(eq(users.id, userId));
    await db.delete(favorites).where(eq(favorites.sessionId, String(userId)));
    await db.delete(consentRecords).where(eq(consentRecords.userId, userId));
  }
}

export const storage = new DatabaseStorage();
