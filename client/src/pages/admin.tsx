import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import {
  Package, Tag, Layers, Image, Settings, FileText, ShoppingCart, BarChart3,
  Plus, Trash2, Edit, Save, X, Users, Boxes, ScrollText, Palette, LayoutGrid,
  Shield, Download, Eye, Lock, LogOut, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type {
  Product, Category, Brand, Banner, SiteSetting, Page, Order, User,
  ProductVariant, AuditLog, ConsentRecord, PageLayout,
} from "@shared/schema";

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  last30Revenue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  productsCount: number;
  categoriesCount: number;
  brandsCount: number;
  usersCount: number;
  newsletterCount: number;
}

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

const ROLE_COLORS: Record<string, string> = {
  customer: "bg-blue-500/20 text-blue-400",
  admin: "bg-red-500/20 text-red-400",
  seller: "bg-green-500/20 text-green-400",
  support: "bg-yellow-500/20 text-yellow-400",
  logistics: "bg-purple-500/20 text-purple-400",
  super_admin: "bg-pink-500/20 text-pink-400",
};

function DashboardTab() {
  const { data: stats } = useQuery<AdminStats>({ queryKey: ["/api/admin/stats"] });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const kpis = stats
    ? [
        { label: "Toplam Gelir", value: formatPrice(stats.totalRevenue), icon: BarChart3, color: "text-green-400" },
        { label: "Toplam Sipariş", value: stats.totalOrders, icon: ShoppingCart, color: "text-blue-400" },
        { label: "Ort. Sipariş Değeri", value: formatPrice(stats.avgOrderValue), icon: Tag, color: "text-purple-400" },
        { label: "Ürünler", value: stats.productsCount, icon: Package, color: "text-orange-400" },
        { label: "Kategoriler", value: stats.categoriesCount, icon: Layers, color: "text-cyan-400" },
        { label: "Markalar", value: stats.brandsCount, icon: Tag, color: "text-yellow-400" },
        { label: "Kullanıcılar", value: stats.usersCount, icon: Users, color: "text-pink-400" },
        { label: "Bülten Aboneleri", value: stats.newsletterCount, icon: FileText, color: "text-indigo-400" },
      ]
    : [];

  return (
    <div data-testid="admin-dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <Card key={i} data-testid={`stat-card-${i}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Son 30 Gün Gelir</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatPrice(value), "Gelir"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sipariş Durumları</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }: { status: string; count: number }) => `${status}: ${count}`}
                  >
                    {(stats.ordersByStatus || []).map((_: { status: string; count: number }, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Son Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz sipariş yok</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex justify-between items-center py-2 border-b border-border last:border-0 flex-wrap gap-2" data-testid={`order-row-${order.id}`}>
                  <div>
                    <span className="font-medium text-sm">#{order.orderNumber}</span>
                    <Badge variant="secondary" className="ml-2">{order.status}</Badge>
                  </div>
                  <span className="font-bold">{formatPrice(order.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductsTab() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Ürün silindi" });
    },
  });

  return (
    <div data-testid="admin-products">
      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-md" data-testid={`admin-product-${product.id}`}>
            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">Stok: {product.stock} | SKU: {product.sku}</p>
            </div>
            <span className="text-sm font-bold">{formatPrice(product.price)}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(product.id)}
              data-testid={`button-delete-product-${product.id}`}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const [newCat, setNewCat] = useState({ name: "", slug: "", description: "" });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCat({ name: "", slug: "", description: "" });
      toast({ title: "Kategori eklendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Kategori silindi" });
    },
  });

  return (
    <div data-testid="admin-categories">
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Yeni Kategori Ekle</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Kategori adı" value={newCat.name} onChange={(e) => setNewCat(p => ({ ...p, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} data-testid="input-new-category-name" />
            <Input placeholder="Slug" value={newCat.slug} onChange={(e) => setNewCat(p => ({ ...p, slug: e.target.value }))} data-testid="input-new-category-slug" />
            <Button onClick={() => createMutation.mutate(newCat)} disabled={!newCat.name || !newCat.slug} data-testid="button-create-category">
              <Plus className="w-4 h-4 mr-2" /> Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-category-${cat.id}`}>
            <div>
              <p className="text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-muted-foreground">/{cat.slug}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)} data-testid={`button-delete-category-${cat.id}`}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BannersTab() {
  const { data: banners = [] } = useQuery<Banner[]>({ queryKey: ["/api/banners"] });
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: "Banner silindi" });
    },
  });

  return (
    <div data-testid="admin-banners">
      <div className="space-y-2">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-banner-${banner.id}`}>
            <div className="w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {banner.image && <img src={banner.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{banner.title}</p>
              {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(banner.id)} data-testid={`button-delete-banner-${banner.id}`}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", fullName: "", phone: "", role: "customer" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setForm({ username: "", email: "", password: "", fullName: "", phone: "", role: "customer" });
      setShowForm(false);
      toast({ title: "Kullanıcı oluşturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingId(null);
      toast({ title: "Kullanıcı güncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı silindi" });
    },
  });

  const anonymizeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/users/${id}/anonymize`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanıcı verileri anonimleştirildi (KVKK)" });
    },
  });

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setForm({ username: user.username, email: user.email, password: "", fullName: user.fullName, phone: user.phone || "", role: user.role });
  };

  return (
    <div data-testid="admin-users">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Kullanıcı Yönetimi</h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-user-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Kullanıcı
        </Button>
      </div>

      {(showForm || editingId !== null) && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Kullanıcı adı" value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} data-testid="input-user-username" />
              <Input placeholder="E-posta" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} data-testid="input-user-email" />
              <Input placeholder="Şifre" type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} data-testid="input-user-password" />
              <Input placeholder="Ad Soyad" value={form.fullName} onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))} data-testid="input-user-fullname" />
              <Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} data-testid="input-user-phone" />
              <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Müşteri</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Satıcı</SelectItem>
                  <SelectItem value="support">Destek</SelectItem>
                  <SelectItem value="logistics">Lojistik</SelectItem>
                  <SelectItem value="super_admin">Süper Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                onClick={() => {
                  if (editingId) {
                    const payload: any = { ...form };
                    if (!payload.password) delete payload.password;
                    updateMutation.mutate({ id: editingId, data: payload });
                  } else {
                    createMutation.mutate(form);
                  }
                }}
                disabled={!form.username || !form.email || !form.fullName || (!editingId && !form.password)}
                data-testid="button-save-user"
              >
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Güncelle" : "Kaydet"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} data-testid="button-cancel-user">
                <X className="w-4 h-4 mr-2" /> İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-user-${user.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{user.fullName}</p>
                <Badge variant="secondary" className={ROLE_COLORS[user.role] || ""}>{user.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user.email} | @{user.username}</p>
            </div>
            <div className="flex gap-1 flex-wrap">
              <Button variant="ghost" size="icon" onClick={() => startEdit(user)} data-testid={`button-edit-user-${user.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => anonymizeMutation.mutate(user.id)} data-testid={`button-anonymize-user-${user.id}`}>
                <Shield className="w-4 h-4 text-yellow-400" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(user.id)} data-testid={`button-delete-user-${user.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantsTab() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const productId = selectedProduct ? parseInt(selectedProduct) : null;
  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["/api/products", productId, "variants"],
    enabled: !!productId,
  });
  const [form, setForm] = useState({ flavor: "", weight: "", sku: "", barcode: "", price: "", comparePrice: "", stock: "0" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/variants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
      setForm({ flavor: "", weight: "", sku: "", barcode: "", price: "", comparePrice: "", stock: "0" });
      toast({ title: "Varyant oluşturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/variants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
      setEditingId(null);
      toast({ title: "Varyant güncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/variants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
      toast({ title: "Varyant silindi" });
    },
  });

  const startEdit = (v: ProductVariant) => {
    setEditingId(v.id);
    setForm({
      flavor: v.flavor || "",
      weight: v.weight || "",
      sku: v.sku,
      barcode: v.barcode || "",
      price: String(v.price),
      comparePrice: v.comparePrice ? String(v.comparePrice) : "",
      stock: String(v.stock ?? 0),
    });
  };

  return (
    <div data-testid="admin-variants">
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Ürün Seçin</label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger data-testid="select-variant-product">
            <SelectValue placeholder="Ürün seçin" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {productId && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-sm">{editingId ? "Varyant Düzenle" : "Yeni Varyant Ekle"}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Input placeholder="Aroma" value={form.flavor} onChange={(e) => setForm(p => ({ ...p, flavor: e.target.value }))} data-testid="input-variant-flavor" />
                <Input placeholder="Ağırlık" value={form.weight} onChange={(e) => setForm(p => ({ ...p, weight: e.target.value }))} data-testid="input-variant-weight" />
                <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))} data-testid="input-variant-sku" />
                <Input placeholder="Barkod" value={form.barcode} onChange={(e) => setForm(p => ({ ...p, barcode: e.target.value }))} data-testid="input-variant-barcode" />
                <Input placeholder="Fiyat" type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} data-testid="input-variant-price" />
                <Input placeholder="Karşılaştırma Fiyatı" type="number" value={form.comparePrice} onChange={(e) => setForm(p => ({ ...p, comparePrice: e.target.value }))} data-testid="input-variant-compare-price" />
                <Input placeholder="Stok" type="number" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} data-testid="input-variant-stock" />
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button
                  onClick={() => {
                    const payload = { ...form, productId, price: form.price, comparePrice: form.comparePrice || undefined, stock: parseInt(form.stock) || 0 };
                    if (editingId) {
                      updateMutation.mutate({ id: editingId, data: payload });
                    } else {
                      createMutation.mutate(payload);
                    }
                  }}
                  disabled={!form.sku || !form.price}
                  data-testid="button-save-variant"
                >
                  <Save className="w-4 h-4 mr-2" /> {editingId ? "Güncelle" : "Ekle"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={() => { setEditingId(null); setForm({ flavor: "", weight: "", sku: "", barcode: "", price: "", comparePrice: "", stock: "0" }); }}>
                    <X className="w-4 h-4 mr-2" /> İptal
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-variant-${v.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{v.flavor || "-"} / {v.weight || "-"}</p>
                  <p className="text-xs text-muted-foreground">SKU: {v.sku} | Barkod: {v.barcode || "-"} | Stok: {v.stock}</p>
                </div>
                <span className="text-sm font-bold">{formatPrice(v.price)}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(v)} data-testid={`button-edit-variant-${v.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(v.id)} data-testid={`button-delete-variant-${v.id}`}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
            {variants.length === 0 && <p className="text-sm text-muted-foreground">Bu ürün için varyant bulunmuyor.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function AuditLogsTab() {
  const { data: logs = [] } = useQuery<AuditLog[]>({ queryKey: ["/api/admin/audit-logs"] });
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const entities = Array.from(new Set(logs.map((l) => l.entity)));
  const filtered = entityFilter === "all" ? logs : logs.filter((l) => l.entity === entityFilter);

  return (
    <div data-testid="admin-audit-logs">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-semibold">Denetim Kayıtları</h3>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48" data-testid="select-audit-entity-filter">
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((log) => (
          <div key={log.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`audit-log-${log.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{log.userName || "Sistem"}</span>
                <Badge variant="secondary">{log.action}</Badge>
                <Badge variant="outline">{log.entity}</Badge>
                {log.entityId && <span className="text-xs text-muted-foreground">#{log.entityId}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                IP: {log.ipAddress || "-"} | {log.createdAt ? new Date(log.createdAt).toLocaleString("tr-TR") : "-"}
              </p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Kayıt bulunamadı.</p>}
      </div>
    </div>
  );
}

function ThemeEngineTab() {
  const { data: settings = [] } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("POST", "/api/settings", { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Tema ayarı kaydedildi" });
    },
  });

  const getVal = (key: string) => editValues[key] ?? settings.find((s) => s.key === key)?.value ?? "";

  const colorKeys = [
    { key: "primary_color", label: "Ana Renk" },
    { key: "secondary_color", label: "İkincil Renk" },
    { key: "accent_color", label: "Vurgu Rengi" },
    { key: "background_color", label: "Arka Plan Rengi" },
    { key: "card_color", label: "Kart Rengi" },
    { key: "text_color", label: "Metin Rengi" },
  ];

  const fontKeys = [
    { key: "font_heading", label: "Başlık Fontu" },
    { key: "font_body", label: "Gövde Fontu" },
  ];

  return (
    <div data-testid="admin-theme-engine">
      <h3 className="text-lg font-semibold mb-4">Tema Motoru</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Renkler</h4>
          {colorKeys.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-card border border-border rounded-md" data-testid={`theme-color-${key}`}>
              <label className="text-sm font-medium w-40 flex-shrink-0">{label}</label>
              <Input
                type="color"
                value={getVal(key) || "#000000"}
                onChange={(e) => setEditValues((p) => ({ ...p, [key]: e.target.value }))}
                className="w-12 p-1"
                data-testid={`input-theme-${key}`}
              />
              <Input
                value={getVal(key)}
                onChange={(e) => setEditValues((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="#hex"
                className="flex-1"
                data-testid={`input-theme-${key}-text`}
              />
              <Button size="icon" variant="outline" onClick={() => saveMutation.mutate({ key, value: getVal(key) })} data-testid={`button-save-theme-${key}`}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <h4 className="text-sm font-medium text-muted-foreground mt-6">Fontlar</h4>
          {fontKeys.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-card border border-border rounded-md" data-testid={`theme-font-${key}`}>
              <label className="text-sm font-medium w-40 flex-shrink-0">{label}</label>
              <Input
                value={getVal(key)}
                onChange={(e) => setEditValues((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="Inter, sans-serif"
                className="flex-1"
                data-testid={`input-theme-${key}`}
              />
              <Button size="icon" variant="outline" onClick={() => saveMutation.mutate({ key, value: getVal(key) })} data-testid={`button-save-theme-${key}`}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <h4 className="text-sm font-medium text-muted-foreground mt-6">Kenarlık Yarıçapı</h4>
          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-md" data-testid="theme-border-radius">
            <label className="text-sm font-medium w-40 flex-shrink-0">Border Radius (px)</label>
            <Input
              type="number"
              value={getVal("border_radius")}
              onChange={(e) => setEditValues((p) => ({ ...p, border_radius: e.target.value }))}
              placeholder="8"
              className="flex-1"
              data-testid="input-theme-border-radius"
            />
            <Button size="icon" variant="outline" onClick={() => saveMutation.mutate({ key: "border_radius", value: getVal("border_radius") })} data-testid="button-save-theme-border-radius">
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Canlı Önizleme</h4>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {colorKeys.map(({ key, label }) => (
                    <div key={key} className="text-center">
                      <div
                        className="w-full h-16 rounded-md border border-border mb-2"
                        style={{ backgroundColor: getVal(key) || "#888" }}
                        data-testid={`preview-color-${key}`}
                      />
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xs font-mono">{getVal(key) || "-"}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border border-border rounded-md" style={{ borderRadius: `${getVal("border_radius") || 8}px` }}>
                  <p style={{ fontFamily: getVal("font_heading") || "inherit" }} className="text-lg font-bold mb-1">Başlık Önizleme</p>
                  <p style={{ fontFamily: getVal("font_body") || "inherit" }} className="text-sm text-muted-foreground">Gövde metin önizlemesi. Bu alan tema ayarlarınızın nasıl görüneceğini gösterir.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SDUIPageBuilderTab() {
  const { data: layouts = [] } = useQuery<PageLayout[]>({ queryKey: ["/api/layouts"] });
  const [form, setForm] = useState({ name: "", slug: "", blocks: "[]" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const blockTypes = [
    "hero_slider", "categories_grid", "featured_products", "best_sellers",
    "new_arrivals", "brands_carousel", "newsletter", "banner_strip", "advantages_bar",
  ];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/layouts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      setForm({ name: "", slug: "", blocks: "[]" });
      toast({ title: "Düzen oluşturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/layouts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      setEditingId(null);
      setForm({ name: "", slug: "", blocks: "[]" });
      toast({ title: "Düzen güncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/layouts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({ title: "Düzen silindi" });
    },
  });

  const startEdit = (layout: PageLayout) => {
    setEditingId(layout.id);
    setForm({ name: layout.name, slug: layout.slug, blocks: JSON.stringify(layout.blocks, null, 2) });
  };

  const handleSave = () => {
    let blocks: any[];
    try {
      blocks = JSON.parse(form.blocks);
    } catch {
      toast({ title: "Geçersiz JSON formatı", variant: "destructive" });
      return;
    }
    const payload = { name: form.name, slug: form.slug, blocks };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div data-testid="admin-sdui-builder">
      <h3 className="text-lg font-semibold mb-4">SDUI Sayfa Oluşturucu</h3>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">{editingId ? "Düzen Düzenle" : "Yeni Düzen Oluştur"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <Input placeholder="Düzen adı" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value, slug: editingId ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} data-testid="input-layout-name" />
            <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} data-testid="input-layout-slug" />
          </div>
          <div className="mb-3">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Bloklar (JSON) - Tipleri: {blockTypes.join(", ")}
            </label>
            <textarea
              value={form.blocks}
              onChange={(e) => setForm(p => ({ ...p, blocks: e.target.value }))}
              className="w-full h-48 p-3 bg-muted border border-border rounded-md text-sm font-mono resize-y"
              placeholder='[{"type": "hero_slider", "order": 1, "config": {}}]'
              data-testid="textarea-layout-blocks"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={!form.name || !form.slug} data-testid="button-save-layout">
              <Save className="w-4 h-4 mr-2" /> {editingId ? "Güncelle" : "Oluştur"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => { setEditingId(null); setForm({ name: "", slug: "", blocks: "[]" }); }}>
                <X className="w-4 h-4 mr-2" /> İptal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {layouts.map((layout) => (
          <div key={layout.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-layout-${layout.id}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{layout.name}</p>
              <p className="text-xs text-muted-foreground">/{layout.slug} | {Array.isArray(layout.blocks) ? layout.blocks.length : 0} blok</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(layout)} data-testid={`button-edit-layout-${layout.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(layout.id)} data-testid={`button-delete-layout-${layout.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
        {layouts.length === 0 && <p className="text-sm text-muted-foreground">Henüz düzen oluşturulmamış.</p>}
      </div>
    </div>
  );
}

function KVKKTab() {
  const { data: consents = [] } = useQuery<ConsentRecord[]>({ queryKey: ["/api/admin/consent-records"] });
  const { data: newsletters = [] } = useQuery<{ id: number; email: string; createdAt: string }[]>({ queryKey: ["/api/admin/newsletters"] });

  const exportData = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="admin-kvkk">
      <h3 className="text-lg font-semibold mb-4">KVKK Uyumluluk</h3>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm">Onay Kayıtları</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportData(consents, "consent-records.json")} data-testid="button-export-consents">
              <Download className="w-4 h-4 mr-2" /> Dışa Aktar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {consents.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 bg-muted rounded-md flex-wrap" data-testid={`consent-record-${c.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{c.consentType}</span>
                    <Badge variant={c.granted ? "default" : "destructive"}>{c.granted ? "Verildi" : "Reddedildi"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Oturum: {c.sessionId || "-"} | IP: {c.ipAddress || "-"} | {c.createdAt ? new Date(c.createdAt).toLocaleString("tr-TR") : "-"}
                  </p>
                </div>
              </div>
            ))}
            {consents.length === 0 && <p className="text-sm text-muted-foreground">Onay kaydı bulunmuyor.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm">Bülten Aboneleri</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportData(newsletters, "newsletters.json")} data-testid="button-export-newsletters">
              <Download className="w-4 h-4 mr-2" /> Dışa Aktar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {newsletters.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-md flex-wrap" data-testid={`newsletter-${n.id}`}>
                <span className="text-sm">{n.email}</span>
                <span className="text-xs text-muted-foreground">{n.createdAt ? new Date(n.createdAt).toLocaleString("tr-TR") : "-"}</span>
              </div>
            ))}
            {newsletters.length === 0 && <p className="text-sm text-muted-foreground">Henüz abone yok.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PagesTab() {
  const { data: pages = [] } = useQuery<Page[]>({ queryKey: ["/api/pages"] });
  const [editing, setEditing] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      apiRequest("PATCH", `/api/admin/pages/${id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setEditing(null);
      toast({ title: "Sayfa güncellendi" });
    },
  });

  return (
    <div className="space-y-3" data-testid="admin-pages">
      {pages.map((page) => (
        <Card key={page.id} data-testid={`admin-page-${page.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div>
                <h3 className="font-medium text-sm">{page.title}</h3>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
              {editing === page.id ? (
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: page.id, content: editContent })} data-testid={`button-save-page-${page.id}`}>
                    <Save className="w-4 h-4 mr-1" /> Kaydet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setEditing(page.id); setEditContent(page.content || ""); }} data-testid={`button-edit-page-${page.id}`}>
                  <Edit className="w-4 h-4 mr-1" /> Düzenle
                </Button>
              )}
            </div>
            {editing === page.id && (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-40 p-3 bg-muted border border-border rounded-md text-sm font-mono resize-y mt-2"
                data-testid={`textarea-page-content-${page.id}`}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SettingsTab() {
  const { data: settings = [] } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("POST", "/api/settings", { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Ayar kaydedildi" });
    },
  });

  const getVal = (key: string) => editValues[key] ?? settings.find((s) => s.key === key)?.value ?? "";

  const saveField = (key: string) => {
    saveMutation.mutate({ key, value: getVal(key) });
  };

  const settingGroups = [
    {
      title: "Genel Ayarlar",
      fields: [
        { key: "site_name", label: "Site Adi", type: "text" },
        { key: "site_description", label: "Site Aciklamasi", type: "text" },
        { key: "logo_url", label: "Logo URL", type: "text", placeholder: "https://example.com/logo.png" },
        { key: "favicon_url", label: "Favicon URL", type: "text", placeholder: "https://example.com/favicon.ico" },
        { key: "announcement_text", label: "Duyuru Cubugu", type: "text" },
        { key: "free_shipping_threshold", label: "Ucretsiz Kargo Limiti", type: "text" },
        { key: "footer_text", label: "Footer Metni", type: "text" },
      ],
    },
    {
      title: "SEO Ayarlari",
      fields: [
        { key: "seo_title", label: "SEO Baslik (Title Tag)", type: "text", placeholder: "Site Adi - Aciklama" },
        { key: "seo_description", label: "Meta Aciklama", type: "text", placeholder: "Arama motorlarinda gorunecek aciklama" },
        { key: "seo_keywords", label: "Anahtar Kelimeler", type: "text", placeholder: "kelime1, kelime2, kelime3" },
        { key: "og_image", label: "OG Image URL", type: "text", placeholder: "Sosyal medya paylasim gorseli" },
      ],
    },
    {
      title: "Iletisim Bilgileri",
      fields: [
        { key: "phone", label: "Telefon", type: "text" },
        { key: "email", label: "E-posta", type: "text" },
        { key: "whatsapp", label: "WhatsApp Numarasi", type: "text", placeholder: "905xxxxxxxxx" },
        { key: "address", label: "Adres", type: "text" },
      ],
    },
    {
      title: "Sosyal Medya",
      fields: [
        { key: "instagram", label: "Instagram URL", type: "text" },
        { key: "twitter", label: "Twitter / X URL", type: "text" },
        { key: "facebook", label: "Facebook URL", type: "text" },
        { key: "youtube", label: "YouTube URL", type: "text" },
        { key: "tiktok", label: "TikTok URL", type: "text" },
      ],
    },
    {
      title: "Tema ve Gorunum",
      fields: [
        { key: "primary_color", label: "Ana Renk", type: "color" },
        { key: "secondary_color", label: "Ikincil Renk", type: "color" },
        { key: "accent_color", label: "Vurgu Rengi", type: "color" },
        { key: "background_color", label: "Arka Plan Rengi", type: "color" },
        { key: "card_color", label: "Kart Rengi", type: "color" },
        { key: "text_color", label: "Metin Rengi", type: "color" },
        { key: "font_heading", label: "Baslik Fontu", type: "text" },
        { key: "font_body", label: "Govde Fontu", type: "text" },
        { key: "border_radius", label: "Kenarlik Yaricapi", type: "text" },
      ],
    },
  ];

  const groupedKeys = settingGroups.flatMap(g => g.fields.map(f => f.key));
  const ungroupedSettings = settings.filter(s => s.key && !groupedKeys.includes(s.key));

  return (
    <div className="space-y-6" data-testid="admin-settings">
      {settingGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.fields.map((field) => (
              <div key={field.key} className="flex items-center gap-3 flex-wrap" data-testid={`setting-${field.key}`}>
                <label className="text-sm font-medium w-52 flex-shrink-0 text-muted-foreground">
                  {field.label}
                </label>
                <Input
                  value={getVal(field.key)}
                  onChange={(e) => setEditValues((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="flex-1 min-w-[200px]"
                  placeholder={field.placeholder || ""}
                  type={field.type === "color" ? "color" : "text"}
                  data-testid={`input-setting-${field.key}`}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => saveField(field.key)}
                  disabled={saveMutation.isPending}
                  data-testid={`button-save-setting-${field.key}`}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {ungroupedSettings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Diger Ayarlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ungroupedSettings.map((setting) => (
              <div key={setting.id} className="flex items-center gap-3 flex-wrap" data-testid={`setting-${setting.key}`}>
                <label className="text-sm font-medium w-52 flex-shrink-0 text-muted-foreground">
                  {setting.key}
                </label>
                <Input
                  value={getVal(setting.key!)}
                  onChange={(e) => setEditValues((p) => ({ ...p, [setting.key!]: e.target.value }))}
                  className="flex-1 min-w-[200px]"
                  type={setting.type === "color" ? "color" : "text"}
                  data-testid={`input-setting-${setting.key}`}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => saveField(setting.key!)}
                  disabled={saveMutation.isPending}
                  data-testid={`button-save-setting-${setting.key}`}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminLoginGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((user) => {
          const allowed = ["super_admin", "admin", "seller", "support", "logistics"];
          if (!allowed.includes(user.role)) {
            localStorage.removeItem("admin_token");
            setToken(null);
            setAdminUser(null);
          } else {
            setAdminUser(user);
          }
          setChecking(false);
        })
        .catch(() => {
          localStorage.removeItem("admin_token");
          setToken(null);
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [token]);

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) return;
    setLoginLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", loginForm);
      const data = await res.json();
      const allowed = ["super_admin", "admin", "seller", "support", "logistics"];
      if (!allowed.includes(data.user.role)) {
        toast({ title: "Erişim reddedildi", description: "Admin paneline erişim yetkiniz yok.", variant: "destructive" });
        setLoginLoading(false);
        return;
      }
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      setAdminUser(data.user);
      toast({ title: "Giriş başarılı", description: `Hoş geldiniz, ${data.user.fullName}` });
    } catch {
      toast({ title: "Giriş başarısız", description: "Kullanıcı adı veya şifre hatalı.", variant: "destructive" });
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setAdminUser(null);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !adminUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16" data-testid="admin-login">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Yönetim Paneli Girişi</CardTitle>
            <p className="text-sm text-muted-foreground">Devam etmek için giriş yapın</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-username">Kullanıcı Adı</Label>
              <Input
                id="admin-username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="admin"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-testid="input-admin-username"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Şifre</Label>
              <Input
                id="admin-password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-testid="input-admin-password"
              />
            </div>
            <Button className="w-full neon-glow" onClick={handleLogin} disabled={loginLoading} data-testid="button-admin-login">
              {loginLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-4 pt-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Badge className={ROLE_COLORS[adminUser.role] || ""}>{adminUser.role}</Badge>
          <span className="text-sm text-muted-foreground">{adminUser.fullName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-admin-logout">
          <LogOut className="w-4 h-4 mr-2" /> Çıkış
        </Button>
      </div>
      {children}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminLoginGate>
      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="admin-page">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-heading">Yönetim Paneli</h1>
            <p className="text-sm text-muted-foreground">Tüm içerik, kullanıcı ve site ayarlarını yönetin</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" data-testid="admin-tabs">
          <TabsList className="bg-card border border-border mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="gap-1.5" data-testid="tab-dashboard"><BarChart3 className="w-3.5 h-3.5" /> Panel</TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5" data-testid="tab-products"><Package className="w-3.5 h-3.5" /> Ürünler</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5" data-testid="tab-categories"><Layers className="w-3.5 h-3.5" /> Kategoriler</TabsTrigger>
            <TabsTrigger value="banners" className="gap-1.5" data-testid="tab-banners"><Image className="w-3.5 h-3.5" /> Bannerlar</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5" data-testid="tab-users"><Users className="w-3.5 h-3.5" /> Kullanıcılar</TabsTrigger>
            <TabsTrigger value="variants" className="gap-1.5" data-testid="tab-variants"><Boxes className="w-3.5 h-3.5" /> Varyantlar</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5" data-testid="tab-audit"><ScrollText className="w-3.5 h-3.5" /> Denetim</TabsTrigger>
            <TabsTrigger value="theme" className="gap-1.5" data-testid="tab-theme"><Palette className="w-3.5 h-3.5" /> Tema</TabsTrigger>
            <TabsTrigger value="sdui" className="gap-1.5" data-testid="tab-sdui"><LayoutGrid className="w-3.5 h-3.5" /> SDUI</TabsTrigger>
            <TabsTrigger value="kvkk" className="gap-1.5" data-testid="tab-kvkk"><Shield className="w-3.5 h-3.5" /> KVKK</TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5" data-testid="tab-pages"><FileText className="w-3.5 h-3.5" /> Sayfalar</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5" data-testid="tab-settings"><Settings className="w-3.5 h-3.5" /> Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="banners"><BannersTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="variants"><VariantsTab /></TabsContent>
          <TabsContent value="audit"><AuditLogsTab /></TabsContent>
          <TabsContent value="theme"><ThemeEngineTab /></TabsContent>
          <TabsContent value="sdui"><SDUIPageBuilderTab /></TabsContent>
          <TabsContent value="kvkk"><KVKKTab /></TabsContent>
          <TabsContent value="pages"><PagesTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLoginGate>
  );
}
