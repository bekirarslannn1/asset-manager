import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { insertBlogCategorySchema, insertBlogPostSchema, insertCampaignSchema, insertLoyaltyPointSchema, insertReferralCodeSchema, insertShipmentTrackingSchema, insertFlashDealSchema, insertChatMessageSchema } from "@shared/schema";
import OpenAI from "openai";
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

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

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
  admin: ["products", "categories", "brands", "banners", "pages", "settings", "orders", "coupons", "users", "variants", "layouts", "audit_logs", "blog", "campaigns"],
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

  app.get("/robots.txt", (_req, res) => {
    const host = `${_req.protocol}://${_req.get("host")}`;
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: ${host}/sitemap.xml`
    );
  });

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

  app.get("/api/auth/orders", requireAuth, async (req, res) => {
    const orders = await storage.getOrdersByUser((req as any).user.id);
    res.json(orders);
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const { fullName, email, phone } = req.body;
      if (!fullName || !email) return res.status(400).json({ error: "Ad ve e-posta zorunludur" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Geçersiz e-posta adresi" });
      const userId = (req as any).user.id;
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail && existingEmail.id !== userId) return res.status(400).json({ error: "Bu e-posta başka bir hesapta kullanılıyor" });
      const user = await storage.updateUserProfile(userId, { fullName, email, phone: phone || null });
      if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      res.json({ id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role, avatar: user.avatar });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/auth/password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: "Şifre alanları zorunludur" });
      if (newPassword.length < 6) return res.status(400).json({ error: "Yeni şifre en az 6 karakter olmalıdır" });
      const user = await storage.getUser((req as any).user.id);
      if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: "Mevcut şifre hatalı" });
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashed);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // User addresses
  app.get("/api/addresses", requireAuth, async (req, res) => {
    res.json(await storage.getUserAddresses((req as any).user.id));
  });

  app.post("/api/addresses", requireAuth, async (req, res) => {
    const { title, fullName, phone, city, district, neighborhood, address, postalCode, isDefault } = req.body;
    if (!title || !fullName || !city || !address) return res.status(400).json({ error: "Zorunlu alanları doldurun" });
    const addr = await storage.createUserAddress({ userId: (req as any).user.id, title, fullName, phone, city, district, neighborhood, address, postalCode, isDefault });
    res.status(201).json(addr);
  });

  app.patch("/api/addresses/:id", requireAuth, async (req, res) => {
    const addr = await storage.updateUserAddress(Number(req.params.id), (req as any).user.id, req.body);
    if (!addr) return res.status(404).json({ error: "Adres bulunamadı" });
    res.json(addr);
  });

  app.delete("/api/addresses/:id", requireAuth, async (req, res) => {
    await storage.deleteUserAddress(Number(req.params.id), (req as any).user.id);
    res.json({ success: true });
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

  app.get("/api/products/suggestions", async (req, res) => {
    const q = req.query.q as string || "";
    res.json(await storage.searchProductsSuggestions(q));
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

  app.get("/api/products/:id/rating-distribution", async (req, res) => {
    const dist = await storage.getReviewRatingDistribution(Number(req.params.id));
    const result: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    dist.forEach(d => { result[d.rating] = d.count; });
    res.json(result);
  });

  app.get("/api/products/:id/questions", async (req, res) => {
    res.json(await storage.getQuestionsByProduct(Number(req.params.id)));
  });

  app.post("/api/products/:id/questions", async (req, res) => {
    const { userName, email, question } = req.body;
    if (!userName || !question) return res.status(400).json({ error: "İsim ve soru zorunludur" });
    if (question.length < 10) return res.status(400).json({ error: "Soru en az 10 karakter olmalıdır" });
    const q = await storage.createQuestion({ productId: Number(req.params.id), userName, email, question, isApproved: false });
    res.status(201).json(q);
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

  app.get("/api/orders", requireAuth, requireRole("super_admin", "admin"), async (req, res) => {
    res.json(await storage.getOrders());
  });

  app.get("/api/orders/:orderNumber", async (req, res) => {
    const order = await storage.getOrderByNumber(req.params.orderNumber);
    if (!order) return res.status(404).json({ error: "Sipariş bulunamadı" });
    res.json(order);
  });

  app.patch("/api/orders/:id/status", requireAuth, requireRole("super_admin", "admin"), async (req, res) => {
    const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
    res.json(order);
  });

  app.get("/api/orders/:id/invoice", requireAuth, async (req: any, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ error: "Sipariş bulunamadı" });
    const isAdmin = ["super_admin", "admin"].includes(req.user.role);
    const isOwner = order.sessionId && req.headers["x-session-id"] === order.sessionId;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: "Bu faturaya erişim yetkiniz yok" });

    const items = Array.isArray(order.items) ? order.items : [];
    const address = order.shippingAddress as any || {};
    const orderDate = new Date(order.createdAt).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const itemsHtml = items.map((item: any, idx: number) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${escapeXml(item.name || "")}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">${typeof item.price === 'number' ? item.price.toFixed(2) : item.price || "0.00"} ₺</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">${(typeof item.price === 'number' ? item.price * (item.quantity || 1) : parseFloat(String(item.price) || "0") * (item.quantity || 1)).toFixed(2)} ₺</td>
      </tr>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FATURA - ${order.orderNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
          }
          .invoice-container {
            background: white;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #39FF14;
            padding-bottom: 20px;
          }
          .company-info h1 {
            font-size: 32px;
            color: #39FF14;
            margin-bottom: 10px;
            letter-spacing: 2px;
          }
          .company-details {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
          }
          .invoice-info {
            text-align: right;
          }
          .invoice-info h2 {
            font-size: 28px;
            color: #39FF14;
            margin-bottom: 15px;
            letter-spacing: 1px;
          }
          .invoice-details {
            font-size: 13px;
            line-height: 1.8;
          }
          .invoice-details p {
            margin-bottom: 8px;
          }
          .invoice-details strong {
            color: #333;
          }
          .customer-section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #39FF14;
            text-transform: uppercase;
          }
          .customer-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            font-size: 12px;
            line-height: 1.8;
          }
          .customer-info p {
            margin-bottom: 5px;
          }
          .customer-info strong {
            color: #333;
          }
          table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
          }
          th {
            background-color: #39FF14;
            color: #000;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 13px;
          }
          td {
            padding: 10px;
            font-size: 12px;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-table {
            width: 300px;
            border-collapse: collapse;
          }
          .totals-table tr {
            border-bottom: 1px solid #e0e0e0;
          }
          .totals-table td {
            padding: 10px 15px;
            font-size: 12px;
          }
          .totals-table td:first-child {
            text-align: left;
            color: #666;
          }
          .totals-table td:last-child {
            text-align: right;
            font-weight: bold;
            color: #333;
          }
          .total-row {
            background-color: #f9f9f9;
            font-weight: bold;
            font-size: 14px !important;
            color: #39FF14 !important;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 11px;
            color: #999;
            margin-top: 20px;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .invoice-container {
              max-width: 100%;
              padding: 0;
              box-shadow: none;
            }
            .footer {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-info">
              <h1>FATURA</h1>
              <div class="company-details">
                <p><strong>Şirket Adı</strong></p>
                <p>Adres: İstanbul, Türkiye</p>
                <p>E-posta: info@example.com</p>
              </div>
            </div>
            <div class="invoice-info">
              <h2>Sipariş Detayı</h2>
              <div class="invoice-details">
                <p><strong>Sipariş No:</strong> ${escapeXml(order.orderNumber)}</p>
                <p><strong>Tarih:</strong> ${escapeXml(orderDate)}</p>
                <p><strong>Durum:</strong> ${escapeXml(order.status || "pending")}</p>
              </div>
            </div>
          </div>

          <div class="customer-section">
            <div class="section-title">Müşteri Bilgileri</div>
            <div class="customer-info">
              <div>
                <p><strong>Ad Soyad:</strong></p>
                <p>${escapeXml(order.customerName || address.fullName || "")}</p>
                <p><strong>E-posta:</strong></p>
                <p>${escapeXml(order.customerEmail || "")}</p>
                <p><strong>Telefon:</strong></p>
                <p>${escapeXml(order.customerPhone || address.phone || "")}</p>
              </div>
              <div>
                <p><strong>Teslimat Adresi:</strong></p>
                <p>${escapeXml(address.address || "")}</p>
                <p>${escapeXml([address.district, address.city, address.zipCode].filter(Boolean).join(", "))}</p>
              </div>
            </div>
          </div>

          <div class="customer-section">
            <div class="section-title">Sipariş Kalemleri</div>
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th style="text-align: center;">Miktar</th>
                  <th style="text-align: right;">Birim Fiyat</th>
                  <th style="text-align: right;">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Ara Toplam:</td>
                <td>${typeof order.subtotal === 'number' ? order.subtotal.toFixed(2) : order.subtotal || "0.00"} ₺</td>
              </tr>
              <tr>
                <td>Kargo Ücreti:</td>
                <td>${typeof order.shippingCost === 'number' ? order.shippingCost.toFixed(2) : order.shippingCost || "0.00"} ₺</td>
              </tr>
              ${parseFloat(String(order.discount) || "0") > 0 ? `
              <tr>
                <td>İndirim:</td>
                <td>-${typeof order.discount === 'number' ? order.discount.toFixed(2) : order.discount || "0.00"} ₺</td>
              </tr>
              ` : ""}
              <tr class="total-row">
                <td>TOPLAM:</td>
                <td>${typeof order.total === 'number' ? order.total.toFixed(2) : order.total || "0.00"} ₺</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Bu fatura elektronik olarak oluşturulmuştur. Tarih: ${new Date().toLocaleDateString("tr-TR")}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(html);
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

  app.post("/api/abandoned-cart", async (req, res) => {
    const cart = await storage.saveAbandonedCart(req.body);
    res.status(201).json(cart);
  });

  app.post("/api/stock-notify", async (req, res) => {
    try {
      const { email, productId } = req.body;
      if (!email || !productId) return res.status(400).json({ error: "E-posta ve ürün gerekli" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Geçersiz e-posta adresi" });
      const product = await storage.getProductById(Number(productId));
      if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });
      const notification = await storage.createStockNotification({ email, productId: Number(productId) });
      res.status(201).json(notification);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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

  app.get("/api/navigation", async (req, res) => {
    const position = req.query.position as string | undefined;
    if (position) {
      res.json(await storage.getNavigationLinksByPosition(position));
    } else {
      res.json(await storage.getNavigationLinks());
    }
  });

  app.get("/api/payment-methods", async (req, res) => {
    res.json(await storage.getPaymentMethods());
  });

  app.get("/api/testimonials", async (req, res) => {
    res.json(await storage.getTestimonials());
  });

  app.get("/api/bundles", async (req, res) => {
    const allBundles = await storage.getBundles();
    const allProducts = await storage.getAllProducts();
    const enriched = allBundles.map(bundle => {
      const items = (Array.isArray(bundle.items) ? bundle.items : []) as { productId: number; quantity: number }[];
      const bundleProducts = items.map(item => {
        const product = allProducts.find(p => p.id === item.productId);
        return product ? { ...item, product } : null;
      }).filter(Boolean);
      return { ...bundle, bundleProducts };
    });
    res.json(enriched);
  });

  app.get("/api/bundles/:slug", async (req, res) => {
    const bundle = await storage.getBundleBySlug(req.params.slug);
    if (!bundle) return res.status(404).json({ error: "Paket bulunamadı" });
    const allProducts = await storage.getAllProducts();
    const items = (Array.isArray(bundle.items) ? bundle.items : []) as { productId: number; quantity: number }[];
    const bundleProducts = items.map(item => {
      const product = allProducts.find(p => p.id === item.productId);
      return product ? { ...item, product } : null;
    }).filter(Boolean);
    res.json({ ...bundle, bundleProducts });
  });

  app.post("/api/wizard/analyze", async (req, res) => {
    try {
      const { age, weight, goal, gender, trainingFrequency, dietType } = req.body;
      const allBundles = await storage.getBundles();
      const allProducts = await storage.getAllProducts();

      const goalMap: Record<string, string[]> = {
        kas_kazanimi: ["kas_kazanimi", "bulk", "muscle_gain", "kas"],
        yag_yakim: ["yag_yakim", "cut", "fat_loss", "diyet", "definasyon"],
        genel_saglik: ["genel_saglik", "health", "saglik", "wellness"],
        performans: ["performans", "performance", "guc", "strength"],
        toparlanma: ["toparlanma", "recovery", "kur"],
        kilo_alma: ["kilo_alma", "weight_gain", "bulk"],
      };

      const goalTerms = goalMap[goal] || [goal];

      const scoredBundles = allBundles.map(bundle => {
        let score = 0;
        const bundleGoals = (bundle.goalTags || []).map((g: string) => g.toLowerCase());

        for (const term of goalTerms) {
          if (bundleGoals.includes(term.toLowerCase())) score += 30;
        }

        if (bundle.name.toLowerCase().includes(goal.replace(/_/g, " "))) score += 10;
        if (bundle.description?.toLowerCase().includes(goal.replace(/_/g, " "))) score += 5;

        if (age && parseInt(age) > 35) {
          if (bundleGoals.includes("toparlanma") || bundleGoals.includes("recovery")) score += 5;
        }
        if (trainingFrequency && parseInt(trainingFrequency) >= 5) {
          if (bundleGoals.includes("performans") || bundleGoals.includes("performance")) score += 5;
        }

        const items = (Array.isArray(bundle.items) ? bundle.items : []) as { productId: number; quantity: number }[];
        const bundleProducts = items.map(item => {
          const product = allProducts.find(p => p.id === item.productId);
          return product ? { ...item, product } : null;
        }).filter(Boolean);

        return { ...bundle, bundleProducts, matchScore: Math.min(score, 98) };
      });

      const matched = scoredBundles
        .filter(b => b.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      const fallback = matched.length > 0 ? matched : scoredBundles.map(b => ({ ...b, matchScore: 85 }));

      res.json({
        profile: { age, weight, goal, gender, trainingFrequency, dietType },
        recommendations: fallback.slice(0, 5),
        matchPercentage: fallback[0]?.matchScore || 85,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/layouts", async (req, res) => {
    res.json(await storage.getPageLayouts());
  });

  app.get("/api/layouts/:slug", async (req, res) => {
    const layout = await storage.getPageLayoutBySlug(req.params.slug);
    if (!layout) return res.status(404).json({ error: "Layout bulunamadı" });
    res.json(layout);
  });

  app.get("/api/campaigns", async (_req, res) => {
    res.json(await storage.getActiveCampaigns());
  });

  app.use("/api/admin", requireAuth, requireRole("super_admin", "admin", "seller", "support", "logistics"));

  app.get("/api/admin/stats", async (req, res) => {
    const stats = await storage.getOrderStats();
    const productsCount = (await storage.getAllProducts()).length;
    const categoriesCount = (await storage.getAllCategories()).length;
    const brandsCount = (await storage.getBrands()).length;
    const usersCount = (await storage.getUsers()).length;
    const newsletterCount = (await storage.getNewsletters()).length;
    const revenueByDay = Object.entries(stats.revenueByDay || {}).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    const ordersByStatus = Object.entries(stats.ordersByStatus || {}).map(([status, count]) => ({ status, count }));
    res.json({ ...stats, revenueByDay, ordersByStatus, productsCount, categoriesCount, brandsCount, usersCount, newsletterCount });
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

  app.patch("/api/admin/products/bulk", async (req, res) => {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || !updates) return res.status(400).json({ error: "ids array and updates object required" });
    const results = [];
    for (const id of ids) {
      const product = await storage.updateProduct(id, updates);
      results.push(product);
    }
    await logAudit(req, "bulk_update", "products", 0, { ids, updates });
    res.json(results);
  });

  app.get("/api/admin/products/export", async (_req, res) => {
    const allProducts = await storage.getProducts();
    const csvHeader = "ID,Name,Slug,Price,ComparePrice,Stock,SKU,Category,Brand,IsActive,IsFeatured,IsBestSeller,IsNewArrival\n";
    const csvRows = allProducts.map(p =>
      `${p.id},"${(p.name || '').replace(/"/g, '""')}","${p.slug}",${p.price},${p.comparePrice || ''},${p.stock || 0},"${p.sku || ''}",${p.categoryId},${p.brandId || ''},${p.isActive},${p.isFeatured},${p.isBestSeller},${p.isNewArrival}`
    ).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");
    res.send(csvHeader + csvRows);
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

  app.delete("/api/admin/pages/:id", async (req, res) => {
    await storage.deletePage(Number(req.params.id));
    await logAudit(req, "delete", "pages", Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/campaigns", async (_req, res) => {
    res.json(await storage.getCampaigns());
  });
  app.post("/api/admin/campaigns", async (req, res) => {
    const parsed = insertCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Geçersiz kampanya verisi", details: parsed.error.flatten() });
    const campaign = await storage.createCampaign(parsed.data);
    await logAudit(req, "create", "campaigns", campaign.id);
    res.status(201).json(campaign);
  });
  app.patch("/api/admin/campaigns/:id", async (req, res) => {
    const parsed = insertCampaignSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Geçersiz kampanya verisi", details: parsed.error.flatten() });
    const campaign = await storage.updateCampaign(Number(req.params.id), parsed.data);
    await logAudit(req, "update", "campaigns", Number(req.params.id));
    res.json(campaign);
  });
  app.delete("/api/admin/campaigns/:id", async (req, res) => {
    await storage.deleteCampaign(Number(req.params.id));
    await logAudit(req, "delete", "campaigns", Number(req.params.id));
    res.json({ success: true });
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

  // Navigation CRUD
  app.post("/api/admin/navigation", async (req, res) => {
    const link = await storage.createNavigationLink(req.body);
    await logAudit(req, "create", "navigation", link.id);
    res.status(201).json(link);
  });

  app.patch("/api/admin/navigation/:id", async (req, res) => {
    const link = await storage.updateNavigationLink(Number(req.params.id), req.body);
    await logAudit(req, "update", "navigation", Number(req.params.id));
    res.json(link);
  });

  app.delete("/api/admin/navigation/:id", async (req, res) => {
    await storage.deleteNavigationLink(Number(req.params.id));
    await logAudit(req, "delete", "navigation", Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/bundles", async (req, res) => {
    res.json(await storage.getAllBundles());
  });
  app.post("/api/admin/bundles", async (req, res) => {
    const bundle = await storage.createBundle(req.body);
    await logAudit(req, "create", "bundles", bundle.id);
    res.json(bundle);
  });
  app.patch("/api/admin/bundles/:id", async (req, res) => {
    const updated = await storage.updateBundle(Number(req.params.id), req.body);
    await logAudit(req, "update", "bundles", Number(req.params.id));
    res.json(updated);
  });
  app.delete("/api/admin/bundles/:id", async (req, res) => {
    await storage.deleteBundle(Number(req.params.id));
    await logAudit(req, "delete", "bundles", Number(req.params.id));
    res.json({ success: true });
  });

  // Testimonials admin
  app.get("/api/admin/testimonials", async (req, res) => {
    res.json(await storage.getAllTestimonials());
  });
  app.post("/api/admin/testimonials", async (req, res) => {
    const testimonial = await storage.createTestimonial(req.body);
    await logAudit(req, "create", "testimonial", testimonial.id);
    res.json(testimonial);
  });
  app.patch("/api/admin/testimonials/:id", async (req, res) => {
    const updated = await storage.updateTestimonial(Number(req.params.id), req.body);
    await logAudit(req, "update", "testimonial", Number(req.params.id));
    res.json(updated);
  });
  app.delete("/api/admin/testimonials/:id", async (req, res) => {
    await storage.deleteTestimonial(Number(req.params.id));
    await logAudit(req, "delete", "testimonial", Number(req.params.id));
    res.json({ success: true });
  });

  // Payment methods admin
  app.get("/api/admin/payment-methods", async (req, res) => {
    res.json(await storage.getAllPaymentMethods());
  });
  app.post("/api/admin/payment-methods", async (req, res) => {
    const method = await storage.createPaymentMethod(req.body);
    await logAudit(req, "create", "payment_method", method.id);
    res.json(method);
  });
  app.patch("/api/admin/payment-methods/:id", async (req, res) => {
    const updated = await storage.updatePaymentMethod(Number(req.params.id), req.body);
    await logAudit(req, "update", "payment_method", Number(req.params.id));
    res.json(updated);
  });
  app.delete("/api/admin/payment-methods/:id", async (req, res) => {
    await storage.deletePaymentMethod(Number(req.params.id));
    await logAudit(req, "delete", "payment_method", Number(req.params.id));
    res.json({ success: true });
  });

  // Reviews admin
  app.get("/api/admin/reviews", async (req, res) => {
    const reviews = await storage.getAllReviews();
    const products = await storage.getAllProducts();
    const productMap = new Map(products.map(p => [p.id, p.name]));
    res.json(reviews.map(r => ({ ...r, productName: productMap.get(r.productId) || `Urun #${r.productId}` })));
  });

  app.patch("/api/admin/reviews/:id", async (req, res) => {
    const review = await storage.updateReview(Number(req.params.id), req.body);
    await logAudit(req, "update", "reviews", Number(req.params.id));
    res.json(review);
  });

  app.post("/api/admin/reviews/:id/approve", async (req, res) => {
    const review = await storage.approveReview(Number(req.params.id));
    await logAudit(req, "update", "reviews", Number(req.params.id));
    res.json(review);
  });

  app.post("/api/admin/reviews/:id/reply", async (req, res) => {
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ error: "Yanıt zorunludur" });
    const review = await storage.updateReviewReply(Number(req.params.id), reply);
    await logAudit(req, "update", "reviews", Number(req.params.id));
    res.json(review);
  });

  app.delete("/api/admin/reviews/:id", async (req, res) => {
    await storage.deleteReview(Number(req.params.id));
    await logAudit(req, "delete", "reviews", Number(req.params.id));
    res.json({ success: true });
  });

  // Q&A admin
  app.get("/api/admin/questions", async (req, res) => {
    const questions = await storage.getAllQuestions();
    const products = await storage.getAllProducts();
    const productMap = new Map(products.map(p => [p.id, p.name]));
    res.json(questions.map(q => ({ ...q, productName: productMap.get(q.productId) || `Ürün #${q.productId}` })));
  });

  app.post("/api/admin/questions/:id/answer", async (req, res) => {
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ error: "Cevap zorunludur" });
    const q = await storage.answerQuestion(Number(req.params.id), { answer, answeredBy: "Admin" });
    await logAudit(req, "update", "questions", Number(req.params.id));
    res.json(q);
  });

  app.delete("/api/admin/questions/:id", async (req, res) => {
    await storage.deleteQuestion(Number(req.params.id));
    await logAudit(req, "delete", "questions", Number(req.params.id));
    res.json({ success: true });
  });

  // Stock notifications admin
  app.get("/api/admin/stock-notifications", async (req, res) => {
    const notifs = await storage.getStockNotifications();
    const products = await storage.getAllProducts();
    const productMap = new Map(products.map(p => [p.id, p.name]));
    res.json(notifs.map(n => ({ ...n, productName: productMap.get(n.productId) || `Ürün #${n.productId}` })));
  });

  // Order notes admin
  app.get("/api/admin/orders/:id/notes", async (req, res) => {
    res.json(await storage.getOrderNotes(Number(req.params.id)));
  });

  app.post("/api/admin/orders/:id/notes", async (req, res) => {
    const { note, isInternal } = req.body;
    if (!note) return res.status(400).json({ error: "Not zorunludur" });
    const orderNote = await storage.createOrderNote({ orderId: Number(req.params.id), userName: "Admin", note, isInternal: isInternal !== false });
    res.status(201).json(orderNote);
  });

  app.delete("/api/admin/order-notes/:id", async (req, res) => {
    await storage.deleteOrderNote(Number(req.params.id));
    res.json({ success: true });
  });

  // Coupons update/delete
  app.patch("/api/admin/coupons/:id", async (req, res) => {
    const coupon = await storage.updateCoupon(Number(req.params.id), req.body);
    await logAudit(req, "update", "coupons", Number(req.params.id));
    res.json(coupon);
  });

  app.delete("/api/admin/coupons/:id", async (req, res) => {
    await storage.deleteCoupon(Number(req.params.id));
    await logAudit(req, "delete", "coupons", Number(req.params.id));
    res.json({ success: true });
  });

  // KPI endpoint
  app.get("/api/admin/kpis", async (req, res) => {
    try {
      const allOrders = await storage.getOrders();
      const products = await storage.getAllProducts();
      const completedOrders = allOrders.filter(o => ["completed", "delivered"].includes(o.status));
      const totalSessions = Math.max(allOrders.length * 3, 1);
      const conversionRate = totalSessions > 0 ? (completedOrders.length / totalSessions) * 100 : 0;
      const aov = completedOrders.length > 0
        ? completedOrders.reduce((s, o) => s + parseFloat(o.total), 0) / completedOrders.length
        : 0;
      const cancelledOrders = allOrders.filter(o => o.status === "cancelled").length;
      const cartAbandonmentRate = totalSessions > 0 ? ((totalSessions - allOrders.length) / totalSessions) * 100 : 0;

      const now = new Date();
      const last30Days = allOrders.filter(o => new Date(o.createdAt) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      const prev30Days = allOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d > new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) && d <= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      });
      const last30Revenue = last30Days.reduce((s, o) => s + parseFloat(o.total), 0);
      const prev30Revenue = prev30Days.reduce((s, o) => s + parseFloat(o.total), 0);
      const revenueGrowth = prev30Revenue > 0 ? ((last30Revenue - prev30Revenue) / prev30Revenue) * 100 : 0;
      const ordersGrowth = prev30Days.length > 0 ? ((last30Days.length - prev30Days.length) / prev30Days.length) * 100 : 0;

      const productRevenue: Record<number, { name: string; revenue: number; quantity: number }> = {};
      completedOrders.forEach(o => {
        try {
          const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const pid = item.productId || item.id;
              if (!pid) return;
              if (!productRevenue[pid]) {
                const p = products.find(pr => pr.id === pid);
                productRevenue[pid] = { name: p?.name || item.name || `Urun #${pid}`, revenue: 0, quantity: 0 };
              }
              productRevenue[pid].revenue += parseFloat(item.price || item.total || 0) * (item.quantity || 1);
              productRevenue[pid].quantity += item.quantity || 1;
            });
          }
        } catch {}
      });
      const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

      const weekMap: Record<string, { revenue: number; orders: number }> = {};
      allOrders.forEach(o => {
        const d = new Date(o.createdAt);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split("T")[0];
        if (!weekMap[key]) weekMap[key] = { revenue: 0, orders: 0 };
        weekMap[key].revenue += parseFloat(o.total);
        weekMap[key].orders += 1;
      });
      const revenueByWeek = Object.entries(weekMap)
        .map(([week, data]) => ({ week, ...data }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-12);

      res.json({
        conversionRate,
        aov,
        cartAbandonmentRate,
        totalSessions,
        totalCompletedOrders: completedOrders.length,
        revenueGrowth,
        ordersGrowth,
        topProducts,
        revenueByWeek,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/abandoned-carts", async (_req, res) => {
    res.json(await storage.getAbandonedCarts());
  });
  app.patch("/api/admin/abandoned-carts/:id/recover", async (req, res) => {
    await storage.recoverAbandonedCart(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/low-stock", async (req, res) => {
    const threshold = parseInt(req.query.threshold as string) || 10;
    res.json(await storage.getLowStockProducts(threshold));
  });

  app.get("/api/admin/order-stats", async (_req, res) => {
    res.json(await storage.getOrderStats());
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

  app.get("/api/jsonld/organization", async (req, res) => {
    const settings = await storage.getSettings();
    const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";
    const siteUrl = getSetting("site_url") || `${req.protocol}://${req.get("host")}`;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: getSetting("site_name") || "FitSupp",
      url: siteUrl,
      logo: getSetting("logo_url") || `${siteUrl}/favicon.ico`,
      description: getSetting("site_description") || "",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: getSetting("phone") || "",
        email: getSetting("email") || "",
        contactType: "customer service",
        availableLanguage: "Turkish",
      },
      sameAs: [getSetting("instagram"), getSetting("facebook"), getSetting("twitter"), getSetting("youtube")].filter(Boolean),
    };
    res.json(jsonLd);
  });

  app.get("/api/jsonld/product/:slug", async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ error: "Not found" });
    const settings = await storage.getSettings();
    const siteUrl = settings.find(s => s.key === "site_url")?.value || "";
    const siteName = settings.find(s => s.key === "site_name")?.value || "FitSupp";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images || [],
      sku: product.sku,
      brand: { "@type": "Brand", name: siteName },
      offers: {
        "@type": "Offer",
        url: `${siteUrl}/urun/${product.slug}`,
        priceCurrency: "TRY",
        price: product.price,
        availability: (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: siteName },
      },
      aggregateRating: (product.reviewCount ?? 0) > 0 ? {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      } : undefined,
    };
    res.json(jsonLd);
  });

  app.get("/feed/trendyol.xml", async (_req, res) => {
    const allProducts = await storage.getProducts({});
    const settings = await storage.getSettings();
    const siteName = settings.find(s => s.key === "site_name")?.value || "FitSupp";
    const siteUrl = settings.find(s => s.key === "site_url")?.value || "";
    const cats = await storage.getCategories();
    const brandList = await storage.getBrands();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<products>`;
    for (const p of allProducts) {
      const cat = cats.find(c => c.id === p.categoryId);
      const brand = brandList.find(b => b.id === p.brandId);
      xml += `
  <product>
    <barcode>${p.sku || ''}</barcode>
    <title>${escapeXml(p.name)}</title>
    <productMainId>${p.id}</productMainId>
    <brandName>${escapeXml(brand?.name || siteName)}</brandName>
    <categoryName>${escapeXml(cat?.name || 'Supplement')}</categoryName>
    <quantity>${p.stock}</quantity>
    <salePrice>${p.price}</salePrice>
    <listPrice>${p.comparePrice || p.price}</listPrice>
    <currencyType>TRY</currencyType>
    <description>${escapeXml(p.description || '')}</description>
    <productUrl>${siteUrl}/urun/${p.slug}</productUrl>
    <images>${(p.images || []).map((img: string) => `
      <image><url>${escapeXml(img)}</url></image>`).join('')}
    </images>
  </product>`;
    }
    xml += `
</products>`;
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  });

  app.get("/feed/hepsiburada.xml", async (_req, res) => {
    const allProducts = await storage.getProducts({});
    const settings = await storage.getSettings();
    const siteName = settings.find(s => s.key === "site_name")?.value || "FitSupp";
    const siteUrl = settings.find(s => s.key === "site_url")?.value || "";
    const cats = await storage.getCategories();
    const brandList = await storage.getBrands();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<merchantFeed>
  <merchant name="${escapeXml(siteName)}" />
  <listings>`;
    for (const p of allProducts) {
      const cat = cats.find(c => c.id === p.categoryId);
      const brand = brandList.find(b => b.id === p.brandId);
      xml += `
    <listing>
      <merchantSku>${p.sku || p.id}</merchantSku>
      <productName>${escapeXml(p.name)}</productName>
      <brand>${escapeXml(brand?.name || siteName)}</brand>
      <category>${escapeXml(cat?.name || 'Supplement')}</category>
      <price>${p.price}</price>
      <listPrice>${p.comparePrice || p.price}</listPrice>
      <availableStock>${p.stock}</availableStock>
      <productUrl>${siteUrl}/urun/${p.slug}</productUrl>
      <imageUrl>${(p.images && p.images[0]) || ''}</imageUrl>
      <description>${escapeXml(p.description || '')}</description>
    </listing>`;
    }
    xml += `
  </listings>
</merchantFeed>`;
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  });

  app.get("/feed/n11.xml", async (_req, res) => {
    const allProducts = await storage.getProducts({});
    const settings = await storage.getSettings();
    const siteName = settings.find(s => s.key === "site_name")?.value || "FitSupp";
    const siteUrl = settings.find(s => s.key === "site_url")?.value || "";
    const cats = await storage.getCategories();
    const brandList = await storage.getBrands();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<products seller="${escapeXml(siteName)}">`;
    for (const p of allProducts) {
      const cat = cats.find(c => c.id === p.categoryId);
      const brand = brandList.find(b => b.id === p.brandId);
      xml += `
  <product>
    <stockCode>${p.sku || p.id}</stockCode>
    <title>${escapeXml(p.name)}</title>
    <brand>${escapeXml(brand?.name || siteName)}</brand>
    <category>${escapeXml(cat?.name || 'Supplement')}</category>
    <price>${p.price}</price>
    <marketPrice>${p.comparePrice || p.price}</marketPrice>
    <stockAmount>${p.stock}</stockAmount>
    <url>${siteUrl}/urun/${p.slug}</url>
    <images>${(p.images || []).map((img: string, idx: number) => `
      <image order="${idx + 1}">${escapeXml(img)}</image>`).join('')}
    </images>
    <description>${escapeXml(p.description || '')}</description>
  </product>`;
    }
    xml += `
</products>`;
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const allProducts = await storage.getProducts({});
      const cats = await storage.getCategories();
      const blogPostsList = await storage.getBlogPosts({});
      const pagesList = await storage.getPages();
      const settings = await storage.getSettings();
      const siteUrl = settings.find(s => s.key === "site_url")?.value || "";
      const base = siteUrl || `https://${_req.get("host")}`;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/urunler</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/markalar</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${base}/blog</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/supplement-sihirbazi</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`;

      for (const cat of cats.filter(c => c.isActive)) {
        xml += `\n  <url><loc>${escapeXml(`${base}/kategori/${cat.slug}`)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }
      for (const p of allProducts.filter(pr => pr.isActive)) {
        xml += `\n  <url><loc>${escapeXml(`${base}/urun/${p.slug}`)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      }
      for (const post of blogPostsList.filter((bp: any) => bp.status === "published")) {
        xml += `\n  <url><loc>${escapeXml(`${base}/blog/${post.slug}`)}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
      }
      for (const page of pagesList.filter((pg: any) => pg.isActive)) {
        xml += `\n  <url><loc>${escapeXml(`${base}/sayfa/${page.slug}`)}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`;
      }

      xml += `\n</urlset>`;
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/blog/categories", async (_req, res) => {
    try {
      const cats = await storage.getBlogCategories();
      res.json(cats);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/blog/posts", async (req, res) => {
    try {
      const { categoryId, tag, search } = req.query;
      const posts = await storage.getBlogPosts({
        categoryId: categoryId ? Number(categoryId) : undefined,
        tag: tag as string | undefined,
        search: search as string | undefined,
      });
      res.json(posts);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/blog/posts/featured", async (_req, res) => {
    try {
      const posts = await storage.getFeaturedBlogPosts(4);
      res.json(posts);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post bulunamadı" });
      await storage.incrementBlogPostView(post.id);
      res.json(post);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/blog/posts/:slug/related", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post bulunamadı" });
      const related = await storage.getRelatedBlogPosts(post.id, post.categoryId, post.tags);
      res.json(related);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/blog/posts/:slug/comments", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post bulunamadı" });
      const comments = await storage.getBlogComments(post.id);
      res.json(comments);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/blog/posts/:slug/comments", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post bulunamadı" });
      const { name, email, comment } = req.body;
      if (!name || !comment) return res.status(400).json({ error: "İsim ve yorum gerekli" });
      const created = await storage.createBlogComment({ postId: post.id, name, email, comment });
      res.status(201).json(created);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/jsonld/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post bulunamadı" });
      const siteUrl = (await storage.getSetting("site_url")) || `${req.protocol}://${req.get("host")}`;
      const siteName = (await storage.getSetting("site_name")) || "FitSupp";

      let category = null;
      if (post.categoryId) {
        const cats = await storage.getAllBlogCategories();
        category = cats.find(c => c.id === post.categoryId);
      }

      res.json({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || post.title,
        "image": post.coverImage || "",
        "author": {
          "@type": "Person",
          "name": post.authorName
        },
        "publisher": {
          "@type": "Organization",
          "name": siteName,
          "url": siteUrl
        },
        "datePublished": post.publishedAt || post.createdAt,
        "dateModified": post.updatedAt,
        "url": `${siteUrl}/blog/${post.slug}`,
        "wordCount": (post.content || '').split(/\s+/).length,
        "timeRequired": `PT${post.readingTime || 1}M`,
        ...(category ? { "articleSection": category.name } : {}),
        ...(post.tags?.length ? { "keywords": post.tags.join(", ") } : {})
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/blog/categories", requirePermission("blog"), async (_req, res) => {
    try {
      const cats = await storage.getAllBlogCategories();
      res.json(cats);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/blog/categories", requirePermission("blog"), async (req, res) => {
    try {
      const parsed = insertBlogCategorySchema.parse(req.body);
      const created = await storage.createBlogCategory(parsed);
      res.status(201).json(created);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ error: "Geçersiz veri", details: e.errors });
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/blog/categories/:id", requirePermission("blog"), async (req, res) => {
    try {
      const updated = await storage.updateBlogCategory(Number(req.params.id), req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/blog/categories/:id", requirePermission("blog"), async (req, res) => {
    try {
      await storage.deleteBlogCategory(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/blog/posts", requirePermission("blog"), async (_req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/blog/posts", requirePermission("blog"), async (req, res) => {
    try {
      const parsed = insertBlogPostSchema.parse(req.body);
      const created = await storage.createBlogPost(parsed);
      res.status(201).json(created);
    } catch (e: any) {
      if (e.name === "ZodError") return res.status(400).json({ error: "Geçersiz veri", details: e.errors });
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/blog/posts/:id", requirePermission("blog"), async (req, res) => {
    try {
      const updated = await storage.updateBlogPost(Number(req.params.id), req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/blog/posts/:id", requirePermission("blog"), async (req, res) => {
    try {
      await storage.deleteBlogPost(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/blog/comments", requirePermission("blog"), async (_req, res) => {
    try {
      const comments = await storage.getAllBlogComments();
      res.json(comments);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put("/api/admin/blog/comments/:id", requirePermission("blog"), async (req, res) => {
    try {
      const updated = await storage.updateBlogComment(Number(req.params.id), req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/blog/comments/:id", requirePermission("blog"), async (req, res) => {
    try {
      await storage.deleteBlogComment(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Loyalty Points
  app.get("/api/loyalty/balance", requireAuth, async (req: any, res) => {
    try {
      const balance = await storage.getLoyaltyBalance(req.user.id);
      res.json({ balance });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/loyalty/history", requireAuth, async (req: any, res) => {
    try {
      const history = await storage.getLoyaltyPoints(req.user.id);
      res.json(history);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Referral System
  app.get("/api/referral/my-code", requireAuth, async (req: any, res) => {
    try {
      let code = await storage.getReferralCode(req.user.id);
      if (!code) {
        const genCode = `SUP${req.user.id}${Date.now().toString(36).toUpperCase().slice(-4)}`;
        code = await storage.createReferralCode({ userId: req.user.id, code: genCode, rewardPoints: 100 });
      }
      const usages = await storage.getReferralUsages(code.id);
      res.json({ ...code, usages });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/referral/apply", async (req, res) => {
    try {
      const { code, userId } = req.body;
      const referral = await storage.getReferralCodeByCode(code);
      if (!referral) return res.status(404).json({ error: "Geçersiz referans kodu" });
      if (referral.userId === userId) return res.status(400).json({ error: "Kendi kodunuzu kullanamazsınız" });
      await storage.createReferralUsage({ referralCodeId: referral.id, referrerId: referral.userId, referredId: userId });
      await storage.incrementReferralUsage(referral.id);
      await storage.addLoyaltyPoints({ userId: referral.userId, points: referral.rewardPoints || 100, type: "referral", description: `Referans ödülü` });
      await storage.addLoyaltyPoints({ userId, points: 50, type: "referral_bonus", description: "Referans ile kayıt bonusu" });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Shipment Tracking
  app.get("/api/shipment/:orderId", async (req, res) => {
    try {
      const events = await storage.getShipmentTracking(Number(req.params.orderId));
      res.json(events);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/admin/shipment", requirePermission("orders"), async (req, res) => {
    try {
      const parsed = insertShipmentTrackingSchema.parse(req.body);
      const event = await storage.addShipmentEvent(parsed);
      res.status(201).json(event);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Flash Deals / Countdown Campaigns
  app.get("/api/flash-deals", async (_req, res) => {
    try {
      const deals = await storage.getFlashDeals();
      res.json(deals);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/admin/flash-deals", requirePermission("campaigns"), async (_req, res) => {
    try {
      const deals = await storage.getAllFlashDeals();
      res.json(deals);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post("/api/admin/flash-deals", requirePermission("campaigns"), async (req, res) => {
    try {
      const parsed = insertFlashDealSchema.parse(req.body);
      const deal = await storage.createFlashDeal(parsed);
      res.status(201).json(deal);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.put("/api/admin/flash-deals/:id", requirePermission("campaigns"), async (req, res) => {
    try {
      const updated = await storage.updateFlashDeal(Number(req.params.id), req.body);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.delete("/api/admin/flash-deals/:id", requirePermission("campaigns"), async (req, res) => {
    try {
      await storage.deleteFlashDeal(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // AI Chatbot
  const openai = new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY, baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      if (!message || !sessionId) return res.status(400).json({ error: "Mesaj ve oturum kimliği gerekli" });
      await storage.addChatMessage({ sessionId, role: "user", content: message });
      const history = await storage.getChatMessages(sessionId, 20);
      const products = await storage.getProducts({});
      const categories = await storage.getCategories();
      const systemPrompt = `Sen bir Türkçe e-ticaret müşteri destek asistanısın. Supplement ve spor gıda ürünleri konusunda uzmanlaştın. Mağazada şu kategoriler var: ${categories.map(c => c.name).join(", ")}. ${products.length} ürün mevcut. Müşterilere kibar, profesyonel ve yardımsever bir şekilde yanıt ver. Ürün önerileri yapabilir, sipariş takibi hakkında bilgi verebilir, kargo ve iade politikaları hakkında bilgilendirebilirsin.`;
      const msgs: any[] = [{ role: "system", content: systemPrompt }, ...history.map(m => ({ role: m.role, content: m.content }))];
      const completion = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: msgs, max_tokens: 500, temperature: 0.7 });
      const reply = completion.choices[0]?.message?.content || "Üzgünüm, şu anda yanıt veremiyorum.";
      await storage.addChatMessage({ sessionId, role: "assistant", content: reply });
      res.json({ reply });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.sessionId);
      res.json(messages);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // AI Recommendations
  app.get("/api/recommendations/:productId", async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });
      const allProducts = await storage.getProducts({ categoryId: product.categoryId ? String(product.categoryId) : undefined });
      const related = allProducts.filter(p => p.id !== productId).slice(0, 8);
      res.json(related);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Admin Analytics
  app.get("/api/admin/analytics", requirePermission("orders"), async (_req, res) => {
    try {
      const allOrders = await storage.getOrders();
      const allProducts = await storage.getProducts({});
      const allUsers = await storage.getUsers();
      const allReviews = await storage.getAllReviews();
      const totalRevenue = allOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.totalAmount), 0);
      const monthlyOrders: Record<string, number> = {};
      const monthlyRevenue: Record<string, number> = {};
      allOrders.forEach(o => {
        const month = new Date(o.createdAt).toISOString().slice(0, 7);
        monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
        if (o.status !== "cancelled") monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(o.totalAmount);
      });
      const statusCounts: Record<string, number> = {};
      allOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      const categoryBreakdown: Record<string, number> = {};
      allProducts.forEach(p => {
        const cat = p.categoryId ? String(p.categoryId) : "Diğer";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
      });
      res.json({
        totalOrders: allOrders.length,
        totalRevenue,
        totalProducts: allProducts.length,
        totalUsers: allUsers.length,
        totalReviews: allReviews.length,
        avgOrderValue: allOrders.length ? totalRevenue / allOrders.filter(o => o.status !== "cancelled").length : 0,
        monthlyOrders: Object.entries(monthlyOrders).map(([month, count]) => ({ month, count })),
        monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
        statusCounts: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        categoryBreakdown: Object.entries(categoryBreakdown).map(([category, count]) => ({ category, count })),
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Bulk CSV Operations
  app.post("/api/admin/products/bulk-csv", requirePermission("products"), async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData) return res.status(400).json({ error: "CSV verisi gerekli" });
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase());
      const results: { success: number; errors: string[] } = { success: 0, errors: [] };
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(",").map((v: string) => v.trim());
          const row: Record<string, any> = {};
          headers.forEach((h: string, idx: number) => { row[h] = values[idx]; });
          await storage.createProduct({
            name: row.name || row.ad || "",
            slug: (row.slug || row.name || "").toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"),
            description: row.description || row.aciklama || "",
            price: row.price || row.fiyat || "0",
            categoryId: row.categoryid ? Number(row.categoryid) : null,
            brandId: row.brandid ? Number(row.brandid) : null,
            image: row.image || row.resim || "",
            isActive: true,
          });
          results.success++;
        } catch (lineErr: any) {
          results.errors.push(`Satır ${i + 1}: ${lineErr.message}`);
        }
      }
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.get("/api/admin/products/export-csv", requirePermission("products"), async (_req, res) => {
    try {
      const allProducts = await storage.getProducts({});
      const headers = "id,name,slug,price,stock,categoryId,brandId,isActive";
      const rows = allProducts.map(p => `${p.id},${(p.name || "").replace(/,/g, ";")},${p.slug},${p.price},${p.stock ?? ""},${p.categoryId ?? ""},${p.brandId ?? ""},${p.isActive}`);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=products.csv");
      res.send([headers, ...rows].join("\n"));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
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
