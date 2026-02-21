import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.get("/api/categories", async (req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.get("/api/categories/:slug", async (req, res) => {
    const cat = await storage.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ error: "Kategori bulunamadı" });
    res.json(cat);
  });

  app.get("/api/brands", async (req, res) => {
    const b = await storage.getBrands();
    res.json(b);
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
    const prods = await storage.getProducts(filters);
    res.json(prods);
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

  app.post("/api/banners", async (req, res) => {
    const banner = await storage.createBanner(req.body);
    res.status(201).json(banner);
  });

  app.patch("/api/banners/:id", async (req, res) => {
    const banner = await storage.updateBanner(Number(req.params.id), req.body);
    res.json(banner);
  });

  app.delete("/api/banners/:id", async (req, res) => {
    await storage.deleteBanner(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/settings", async (req, res) => {
    res.json(await storage.getSettings());
  });

  app.get("/api/settings/:key", async (req, res) => {
    const val = await storage.getSetting(req.params.key);
    res.json({ key: req.params.key, value: val });
  });

  app.post("/api/settings", async (req, res) => {
    const setting = await storage.setSetting(req.body.key, req.body.value, req.body.type);
    res.json(setting);
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

  app.post("/api/admin/categories", async (req, res) => {
    const cat = await storage.createCategory(req.body);
    res.status(201).json(cat);
  });

  app.patch("/api/admin/categories/:id", async (req, res) => {
    const cat = await storage.updateCategory(Number(req.params.id), req.body);
    res.json(cat);
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/products", async (req, res) => {
    const product = await storage.createProduct(req.body);
    res.status(201).json(product);
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/brands", async (req, res) => {
    const brand = await storage.createBrand(req.body);
    res.status(201).json(brand);
  });

  app.patch("/api/admin/brands/:id", async (req, res) => {
    const brand = await storage.updateBrand(Number(req.params.id), req.body);
    res.json(brand);
  });

  app.delete("/api/admin/brands/:id", async (req, res) => {
    await storage.deleteBrand(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/admin/pages", async (req, res) => {
    const page = await storage.createPage(req.body);
    res.status(201).json(page);
  });

  app.patch("/api/admin/pages/:id", async (req, res) => {
    const page = await storage.updatePage(Number(req.params.id), req.body);
    res.json(page);
  });

  app.post("/api/admin/coupons", async (req, res) => {
    const coupon = await storage.createCoupon(req.body);
    res.status(201).json(coupon);
  });

  return httpServer;
}
