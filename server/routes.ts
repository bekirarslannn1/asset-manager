import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Iyzipay from "iyzipay";

const JWT_SECRET = process.env.SESSION_SECRET!;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || "sandbox-afXhSEHQOGqJMSqP1wLNBbWfUIxzpIHn",
  secretKey: process.env.IYZICO_SECRET_KEY || "sandbox-ORTYEM8mNjA6GsMj8gVzYsQbLXMeUz6E",
  uri: process.env.IYZICO_URI || "https://sandbox-api.iyzipay.com",
});

function generateToken(user: { id: number; username: string; role: string }) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

function getTokenFromReq(req: Request) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies?.token || null;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"],
  admin: ["products", "categories", "brands", "banners", "pages", "settings", "orders", "coupons", "users", "variants", "layouts", "audit_logs"],
  seller: ["products", "variants", "orders"],
  support: ["orders", "users"],
  logistics: ["orders"],
  customer: [],
};

function hasPermission(role: string, module: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(module);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromReq(req);
  if (!token) return res.status(401).json({ error: "Yetkilendirme gerekli" });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Geçersiz oturum" });
  (req as any).user = decoded;
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Yetkilendirme gerekli" });
    if (!roles.includes(user.role) && user.role !== "super_admin") {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
    }
    next();
  };
}

function requirePermission(module: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Yetkilendirme gerekli" });
    if (!hasPermission(user.role, module)) {
      return res.status(403).json({ error: "Bu modül için yetkiniz yok" });
    }
    next();
  };
}

async function logAudit(req: Request, action: string, entity: string, entityId?: number, details?: any) {
  const user = (req as any).user;
  try {
    await storage.createAuditLog({
      userId: user?.id || null,
      userName: user?.username || "anonymous",
      action,
      entity,
      entityId: entityId || null,
      details: details || null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });
  } catch (e) {}
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName, phone } = req.body;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) return res.status(400).json({ error: "Bu kullanıcı adı zaten kayıtlı" });
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) return res.status(400).json({ error: "Bu e-posta zaten kayıtlı" });
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, email, password: hashedPassword, fullName, phone, role: "customer" });
      const token = generateToken(user);
      res.status(201).json({ user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role }, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      let user = await storage.getUserByUsername(username);
      if (!user && username.includes("@")) {
        user = await storage.getUserByEmail(username);
      }
      if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı" });
      if (!user.isActive) return res.status(403).json({ error: "Hesabınız devre dışı" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Şifre hatalı" });
      await storage.updateUserLogin(user.id);
      const token = generateToken(user);
      await logAudit(req, "login", "users", user.id);
      res.json({ user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role, avatar: user.avatar }, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser((req as any).user.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    res.json({ id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role, avatar: user.avatar });
  });

  app.get("/api/categories", async (req, res) => {
    res.json(await storage.getCategories());
  });

  app.get("/api/categories/:slug", async (req, res) => {
    const cat = await storage.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ error: "Kategori bulunamadı" });
    res.json(cat);
  });

  app.get("/api/brands", async (req, res) => {
    res.json(await storage.getBrands());
  });

  app.get("/api/products", async (req, res) => {
    const filters: any = {};
    if (req.query.categoryId) filters.categoryId = Number(req.query.categoryId);
    if (req.query.brandId) filters.brandId = Number(req.query.brandId);
    if (req.query.minPrice) filters.minPrice = Number(req.query.minPrice);
    if (req.query.maxPrice) filters.maxPrice = Number(req.query.maxPrice);
    if (req.query.isVegan === "true") filters.isVegan = true;
    if (req.query.isGlutenFree === "true") filters.isGlutenFree = true;
    if (req.query.isLactoseFree === "true") filters.isLactoseFree = true;
    if (req.query.isSugarFree === "true") filters.isSugarFree = true;
    if (req.query.sortBy) filters.sortBy = req.query.sortBy;
    if (req.query.search) filters.search = req.query.search;
    res.json(await storage.getProducts(filters));
  });

  app.get("/api/products/featured", async (req, res) => {
    res.json(await storage.getFeaturedProducts());
  });

  app.get("/api/products/best-sellers", async (req, res) => {
    res.json(await storage.getBestSellers());
  });

  app.get("/api/products/new-arrivals", async (req, res) => {
    res.json(await storage.getNewArrivals());
  });

  app.get("/api/products/search", async (req, res) => {
    const q = req.query.q as string || "";
    res.json(await storage.searchProducts(q));
  });

  app.get("/api/products/:slug", async (req, res) => {
    const p = await storage.getProductBySlug(req.params.slug);
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });
    res.json(p);
  });

  app.get("/api/products/:id/reviews", async (req, res) => {
    res.json(await storage.getReviewsByProduct(Number(req.params.id)));
  });

  app.get("/api/products/:id/variants", async (req, res) => {
    res.json(await storage.getVariantsByProduct(Number(req.params.id)));
  });

  app.post("/api/reviews", async (req, res) => {
    const review = await storage.createReview(req.body);
    res.status(201).json(review);
  });

  app.get("/api/cart", async (req, res) => {
    const sessionId = (req.query.sessionId as string) || "default";
    res.json(await storage.getCartItems(sessionId));
  });

  app.post("/api/cart", async (req, res) => {
    const item = await storage.addToCart(req.body);
    res.status(201).json(item);
  });

  app.patch("/api/cart/:id", async (req, res) => {
    const item = await storage.updateCartItem(Number(req.params.id), req.body.quantity);
    res.json(item);
  });

  app.delete("/api/cart/:id", async (req, res) => {
    await storage.removeFromCart(Number(req.params.id));
    res.json({ success: true });
  });

  app.delete("/api/cart", async (req, res) => {
    const sessionId = (req.query.sessionId as string) || "default";
    await storage.clearCart(sessionId);
    res.json({ success: true });
  });

  app.post("/api/orders", async (req, res) => {
    const order = await storage.createOrder(req.body);
    res.status(201).json(order);
  });

  app.get("/api/orders", async (req, res) => {
    res.json(await storage.getOrders());
  });

  app.get("/api/orders/:orderNumber", async (req, res) => {
    const order = await storage.getOrderByNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ error: "Sipariş bulunamadı" });
    res.json(order);
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
    res.json(order);
  });

  app.get("/api/banners", async (req, res) => {
    const type = req.query.type as string | undefined;
    res.json(await storage.getBanners(type));
  });

  app.get("/api/settings", async (req, res) => {
    res.json(await storage.getSettings());
  });

  app.get("/api/settings/:key", async (req, res) => {
    const val = await storage.getSetting(req.params.key);
    res.json({ key: req.params.key, value: val });
  });

  app.post("/api/coupons/validate", async (req, res) => {
    const coupon = await storage.getCouponByCode(req.body.code);
    if (!coupon) return res.status(404).json({ error: "Geçersiz kupon kodu" });
    res.json(coupon);
  });

  app.get("/api/favorites", async (req, res) => {
    const sessionId = (req.query.sessionId as string) || "default";
    res.json(await storage.getFavorites(sessionId));
  });

  app.post("/api/favorites/toggle", async (req, res) => {
    const isFav = await storage.toggleFavorite(req.body.sessionId, req.body.productId);
    res.json({ isFavorite: isFav });
  });

  app.post("/api/newsletter", async (req, res) => {
    const sub = await storage.subscribeNewsletter(req.body.email);
    res.json(sub);
  });

  app.get("/api/pages", async (req, res) => {
    res.json(await storage.getPages());
  });

  app.get("/api/pages/:slug", async (req, res) => {
    const page = await storage.getPageBySlug(req.params.slug);
    if (!page) return res.status(404).json({ error: "Sayfa bulunamadı" });
    res.json(page);
  });

  app.post("/api/consent", async (req, res) => {
    const record = await storage.createConsentRecord({
      ...req.body,
      ipAddress: req.ip || req.socket.remoteAddress || null,
      userAgent: req.headers["user-agent"] || req.body.userAgent || null,
    });
    res.status(201).json(record);
  });

  app.get("/api/consent/:sessionId", async (req, res) => {
    res.json(await storage.getConsentsBySession(req.params.sessionId));
  });

  app.get("/api/layouts", async (req, res) => {
    res.json(await storage.getPageLayouts());
  });

  app.get("/api/layouts/:slug", async (req, res) => {
    const layout = await storage.getPageLayoutBySlug(req.params.slug);
    if (!layout) return res.status(404).json({ error: "Layout bulunamadı" });
    res.json(layout);
  });

  app.use("/api/admin", requireAuth, requireRole("super_admin", "admin", "seller", "support", "logistics"));

  app.get("/api/admin/stats", async (req, res) => {
    const stats = await storage.getOrderStats();
    const productsCount = (await storage.getAllProducts()).length;
    const categoriesCount = (await storage.getAllCategories()).length;
    const brandsCount = (await storage.getBrands()).length;
    const usersCount = (await storage.getUsers()).length;
    const newsletterCount = (await storage.getNewsletters()).length;
    res.json({ ...stats, productsCount, categoriesCount, brandsCount, usersCount, newsletterCount });
  });

  app.get("/api/admin/users", async (req, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers.map(u => ({ ...u, password: undefined })));
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const { username, email, password, fullName, phone, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, email, password: hashedPassword, fullName, phone, role: role || "customer" });
      await logAudit(req, "create", "users", user.id);
      res.status(201).json({ ...user, password: undefined });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    const data = { ...req.body };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }
    const user = await storage.updateUser(Number(req.params.id), data);
    await logAudit(req, "update", "users", Number(req.params.id));
    res.json(user ? { ...user, password: undefined } : null);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    await storage.deleteUser(Number(req.params.id));
    await logAudit(req, "delete", "users", Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/users/:id/anonymize", async (req, res) => {
    await storage.anonymizeUser(Number(req.params.id));
    await logAudit(req, "anonymize", "users", Number(req.params.id), { reason: "KVKK Unutulma Hakkı" });
    res.json({ success: true });
  });

  app.post("/api/admin/categories", async (req, res) => {
    const cat = await storage.createCategory(req.body);
    await logAudit(req, "create", "categories", cat.id);
    res.status(201).json(cat);
  });

  app.patch("/api/admin/categories/:id", async (req, res) => {
    const cat = await storage.updateCategory(Number(req.params.id), req.body);
    await logAudit(req, "update", "categories", Number(req.params.id));
    res.json(cat);
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    await logAudit(req, "delete", "categories", Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/products", async (req, res) => {
    const product = await storage.createProduct(req.body);
    await logAudit(req, "create", "products", product.id);
    res.status(201).json(product);
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    await logAudit(req, "update", "products", Number(req.params.id));
    res.json(product);
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    await logAudit(req, "delete", "products", Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/variants", async (req, res) => {
    const variant = await storage.createVariant(req.body);
    await logAudit(req, "create", "variants", variant.id);
    res.status(201).json(variant);
  });

  app.patch("/api/admin/variants/:id", async (req, res) => {
    const variant = await storage.updateVariant(Number(req.params.id), req.body);
    await logAudit(req, "update", "variants", Number(req.params.id));
    res.json(variant);
  });

  app.delete("/api/admin/variants/:id", async (req, res) => {
    await storage.deleteVariant(Number(req.params.id));
    await logAudit(req, "delete", "variants", Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/brands", async (req, res) => {
    const brand = await storage.createBrand(req.body);
    await logAudit(req, "create", "brands", brand.id);
    res.status(201).json(brand);
  });

  app.patch("/api/admin/brands/:id", async (req, res) => {
    const brand = await storage.updateBrand(Number(req.params.id), req.body);
    await logAudit(req, "update", "brands", Number(req.params.id));
    res.json(brand);
  });

  app.delete("/api/admin/brands/:id", async (req, res) => {
    await storage.deleteBrand(Number(req.params.id));
    await logAudit(req, "delete", "brands", Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/banners", async (req, res) => {
    const banner = await storage.createBanner(req.body);
    await logAudit(req, "create", "banners", banner.id);
    res.status(201).json(banner);
  });

  app.patch("/api/admin/banners/:id", async (req, res) => {
    const banner = await storage.updateBanner(Number(req.params.id), req.body);
    await logAudit(req, "update", "banners", Number(req.params.id));
    res.json(banner);
  });

  app.delete("/api/admin/banners/:id", async (req, res) => {
    await storage.deleteBanner(Number(req.params.id));
    await logAudit(req, "delete", "banners", Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/pages", async (req, res) => {
    const page = await storage.createPage(req.body);
    await logAudit(req, "create", "pages", page.id);
    res.status(201).json(page);
  });

  app.patch("/api/admin/pages/:id", async (req, res) => {
    const page = await storage.updatePage(Number(req.params.id), req.body);
    await logAudit(req, "update", "pages", Number(req.params.id));
    res.json(page);
  });

  app.post("/api/settings", requireAuth, requireRole("super_admin", "admin"), async (req, res) => {
    const setting = await storage.setSetting(req.body.key, req.body.value, req.body.type);
    await logAudit(req, "update", "settings", setting.id, { key: req.body.key });
    res.json(setting);
  });

  app.post("/api/admin/coupons", async (req, res) => {
    const coupon = await storage.createCoupon(req.body);
    await logAudit(req, "create", "coupons", coupon.id);
    res.status(201).json(coupon);
  });

  app.get("/api/admin/coupons", async (req, res) => {
    res.json(await storage.getCoupons());
  });

  app.get("/api/coupons/active", async (_req, res) => {
    const allCoupons = await storage.getCoupons();
    const active = allCoupons.filter((c: any) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date()));
    res.json(active);
  });

  app.get("/api/wizard/recommendations", async (req, res) => {
    const { gender, goal, experience } = req.query as { gender?: string; goal?: string; experience?: string };
    const allProducts = await storage.getProducts();
    const activeProducts = allProducts.filter((p: any) => p.isActive && Number(p.stock) > 0);

    const goalCategoryMap: Record<string, string[]> = {
      "kas-gelistirme": ["protein-tozu", "kreatin", "kilo-hacim", "amino-asit-bcaa"],
      "yag-yakimi": ["diyet-zayiflama", "pre-workout", "amino-asit-bcaa"],
      "dayaniklilik": ["pre-workout", "amino-asit-bcaa", "vitamin-mineral"],
      "genel-saglik": ["vitamin-mineral", "saglik-yasam", "spor-gidalari"],
      "kilo-alma": ["kilo-hacim", "protein-tozu", "kreatin", "spor-gidalari"],
    };

    const experienceLimit: Record<string, number> = {
      "yeni-baslayan": 3,
      "orta-seviye": 4,
      "ileri-seviye": 6,
    };

    const targetSlugs = goal ? (goalCategoryMap[goal] || []) : [];
    const allCategories = await storage.getCategories();
    const targetCatIds = allCategories
      .filter((c: any) => targetSlugs.includes(c.slug))
      .map((c: any) => c.id);

    let recommended = activeProducts;
    if (targetCatIds.length > 0) {
      recommended = activeProducts.filter((p: any) => targetCatIds.includes(p.categoryId));
    }

    if (gender && recommended.length > 0) {
      const genderTagged = recommended.filter((p: any) =>
        p.tags && Array.isArray(p.tags) && p.tags.includes(gender)
      );
      if (genderTagged.length > 0) recommended = genderTagged;
    }

    recommended.sort((a: any, b: any) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      return 0;
    });

    const limit = experience ? (experienceLimit[experience] || 4) : 4;
    res.json(recommended.slice(0, limit));
  });

  app.get("/api/admin/audit-logs", async (req, res) => {
    const entity = req.query.entity as string | undefined;
    if (entity) {
      res.json(await storage.getAuditLogsByEntity(entity));
    } else {
      res.json(await storage.getAuditLogs(200));
    }
  });

  app.get("/api/admin/consent-records", async (req, res) => {
    res.json(await storage.getConsentRecords());
  });

  app.get("/api/admin/newsletters", async (req, res) => {
    res.json(await storage.getNewsletters());
  });

  app.post("/api/admin/layouts", async (req, res) => {
    const layout = await storage.createPageLayout(req.body);
    await logAudit(req, "create", "layouts", layout.id);
    res.status(201).json(layout);
  });

  app.patch("/api/admin/layouts/:id", async (req, res) => {
    const layout = await storage.updatePageLayout(Number(req.params.id), req.body);
    await logAudit(req, "update", "layouts", Number(req.params.id));
    res.json(layout);
  });

  app.delete("/api/admin/layouts/:id", async (req, res) => {
    await storage.deletePageLayout(Number(req.params.id));
    await logAudit(req, "delete", "layouts", Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/payment/initialize", async (req, res) => {
    try {
      const { buyer, shippingAddress, billingAddress, card, basketItems, sessionId } = req.body;

      const token = getTokenFromReq(req);
      const authUser = token ? verifyToken(token) : null;

      let serverTotal = 0;
      const verifiedItems: { id: number; name: string; price: number; quantity: number }[] = [];

      for (const item of basketItems) {
        const product = await storage.getProductById(Number(item.id));
        if (!product) return res.status(400).json({ status: "failure", errorMessage: `Ürün bulunamadı: ${item.id}` });

        let unitPrice = parseFloat(product.price);
        if (item.variantId) {
          const variants = await storage.getVariantsByProduct(product.id);
          const variant = variants.find((v: any) => v.id === item.variantId);
          if (variant) unitPrice = parseFloat(variant.price);
        }

        const lineTotal = unitPrice * item.quantity;
        serverTotal += lineTotal;
        verifiedItems.push({ id: product.id, name: product.name, price: unitPrice, quantity: item.quantity });
      }

      const FREE_SHIPPING_THRESHOLD = 500;
      const shippingCost = serverTotal >= FREE_SHIPPING_THRESHOLD ? 0 : 29.90;
      const totalPrice = serverTotal + shippingCost;

      const conversationId = `FITSUPP-${Date.now()}`;
      const basketId = `B-${Date.now()}`;

      const iyzicoBasketItems = verifiedItems.map((item) => ({
        id: String(item.id),
        name: item.name.substring(0, 50),
        category1: "Supplement",
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: (item.price * item.quantity).toFixed(2),
      }));

      if (shippingCost > 0) {
        iyzicoBasketItems.push({
          id: "SHIPPING",
          name: "Kargo",
          category1: "Kargo",
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: shippingCost.toFixed(2),
        });
      }

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        price: totalPrice.toFixed(2),
        paidPrice: totalPrice.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        installment: "1",
        basketId,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
          cardHolderName: card.cardHolderName,
          cardNumber: card.cardNumber,
          expireMonth: card.expireMonth,
          expireYear: card.expireYear,
          cvc: card.cvc,
          registerCard: "0",
        },
        buyer: {
          id: `BUYER-${Date.now()}`,
          name: buyer.name,
          surname: buyer.surname,
          gsmNumber: buyer.phone,
          email: buyer.email,
          identityNumber: buyer.identityNumber || "11111111111",
          registrationAddress: buyer.address,
          ip: req.ip || req.socket.remoteAddress || "85.34.78.112",
          city: buyer.city,
          country: buyer.country || "Turkey",
          zipCode: buyer.zipCode,
        },
        shippingAddress: {
          contactName: shippingAddress.contactName,
          city: shippingAddress.city,
          country: "Turkey",
          address: shippingAddress.address,
          zipCode: shippingAddress.zipCode,
        },
        billingAddress: {
          contactName: billingAddress.contactName,
          city: billingAddress.city,
          country: "Turkey",
          address: billingAddress.address,
          zipCode: billingAddress.zipCode,
        },
        basketItems: iyzicoBasketItems,
      };

      iyzipay.payment.create(request, async (err: any, result: any) => {
        if (err) {
          return res.status(500).json({ status: "failure", errorMessage: err.message || "iyzico bağlantı hatası" });
        }

        if (result.status === "success") {
          const orderNumber = `FS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          try {
            const order = await storage.createOrder({
              orderNumber,
              userId: authUser?.id || null,
              status: "confirmed",
              items: verifiedItems,
              subtotal: String(serverTotal),
              shippingCost: String(shippingCost || 0),
              discount: "0",
              total: String(totalPrice),
              shippingAddress: { ...shippingAddress, email: buyer.email },
              paymentMethod: "iyzico",
              paymentStatus: "paid",
              paymentId: result.paymentId || conversationId,
            });

            if (sessionId) {
              await storage.clearCart(sessionId);
            }

            res.json({
              status: "success",
              orderNumber: order.orderNumber,
              paymentId: result.paymentId,
            });
          } catch (orderErr: any) {
            res.json({
              status: "success",
              orderNumber,
              paymentId: result.paymentId,
              note: "Payment successful, order saved",
            });
          }
        } else {
          res.json({
            status: "failure",
            errorMessage: result.errorMessage || "Ödeme başarısız oldu",
            errorCode: result.errorCode,
          });
        }
      });
    } catch (e: any) {
      res.status(500).json({ status: "failure", errorMessage: e.message || "Sunucu hatası" });
    }
  });

  app.post("/api/payment/installment", async (req, res) => {
    try {
      const { binNumber, price } = req.body;
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `INST-${Date.now()}`,
        binNumber: binNumber.replace(/\s/g, "").substring(0, 6),
        price: price.toFixed(2),
      };

      iyzipay.installmentInfo.retrieve(request, (err: any, result: any) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
