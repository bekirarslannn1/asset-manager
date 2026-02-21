import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import {
  Package, Tag, Layers, Image, Settings, FileText, ShoppingCart, BarChart3,
  Plus, Trash2, Edit, Save, X,
} from "lucide-react";
import type { Product, Category, Brand, Banner, SiteSetting, Page, Order } from "@shared/schema";

function DashboardTab() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const stats = [
    { label: "Toplam Ürün", value: products.length, icon: Package, color: "text-blue-400" },
    { label: "Kategoriler", value: categories.length, icon: Layers, color: "text-green-400" },
    { label: "Markalar", value: brands.length, icon: Tag, color: "text-purple-400" },
    { label: "Siparişler", value: orders.length, icon: ShoppingCart, color: "text-orange-400" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card border-border" data-testid={`stat-card-${i}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg">Son Siparişler</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz sipariş yok</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center py-2 border-b border-border last:border-0" data-testid={`order-row-${order.id}`}>
                  <div>
                    <span className="font-medium text-sm">#{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground ml-2">{order.status}</span>
                  </div>
                  <span className="font-bold text-primary">{formatPrice(order.total)}</span>
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
          <div key={product.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg" data-testid={`admin-product-${product.id}`}>
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">Stok: {product.stock} | SKU: {product.sku}</p>
            </div>
            <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
              onClick={() => deleteMutation.mutate(product.id)}
              data-testid={`button-delete-product-${product.id}`}
            >
              <Trash2 className="w-4 h-4" />
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
      <Card className="bg-card border-border mb-6">
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
          <div key={cat.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg" data-testid={`admin-category-${cat.id}`}>
            <div>
              <p className="text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-muted-foreground">/{cat.slug}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(cat.id)} data-testid={`button-delete-category-${cat.id}`}>
              <Trash2 className="w-4 h-4" />
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
          <div key={banner.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg" data-testid={`admin-banner-${banner.id}`}>
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {banner.image && <img src={banner.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{banner.title}</p>
              {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
            </div>
            <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(banner.id)} data-testid={`button-delete-banner-${banner.id}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
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

  const getVal = (key: string) => editValues[key] ?? settings.find(s => s.key === key)?.value ?? "";

  const settingLabels: Record<string, string> = {
    site_name: "Site Adı",
    site_description: "Site Açıklaması",
    phone: "Telefon",
    email: "E-posta",
    whatsapp: "WhatsApp Numarası",
    address: "Adres",
    free_shipping_threshold: "Ücretsiz Kargo Limiti (₺)",
    announcement_text: "Duyuru Çubuğu",
    primary_color: "Ana Renk",
    instagram: "Instagram URL",
    twitter: "Twitter URL",
    facebook: "Facebook URL",
    youtube: "YouTube URL",
  };

  return (
    <div className="space-y-4" data-testid="admin-settings">
      {settings.map((setting) => (
        <div key={setting.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg" data-testid={`setting-${setting.key}`}>
          <label className="text-sm font-medium w-48 flex-shrink-0">
            {settingLabels[setting.key!] || setting.key}
          </label>
          <Input
            value={getVal(setting.key!)}
            onChange={(e) => setEditValues(p => ({ ...p, [setting.key!]: e.target.value }))}
            className="flex-1"
            type={setting.type === "color" ? "color" : "text"}
            data-testid={`input-setting-${setting.key}`}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveMutation.mutate({ key: setting.key!, value: getVal(setting.key!) })}
            data-testid={`button-save-setting-${setting.key}`}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
      ))}
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
        <Card key={page.id} className="bg-card border-border" data-testid={`admin-page-${page.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-medium text-sm">{page.title}</h3>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
              {editing === page.id ? (
                <div className="flex gap-2">
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
                className="w-full h-40 p-3 bg-muted border border-border rounded-lg text-sm font-mono resize-y mt-2"
                data-testid={`textarea-page-content-${page.id}`}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="admin-page">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-heading">Yönetim Paneli</h1>
          <p className="text-sm text-muted-foreground">İçerik ve site ayarlarını yönetin</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" data-testid="admin-tabs">
        <TabsList className="bg-card border border-border mb-6 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Panel</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5"><Package className="w-3.5 h-3.5" /> Ürünler</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><Layers className="w-3.5 h-3.5" /> Kategoriler</TabsTrigger>
          <TabsTrigger value="banners" className="gap-1.5"><Image className="w-3.5 h-3.5" /> Bannerlar</TabsTrigger>
          <TabsTrigger value="pages" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Sayfalar</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-3.5 h-3.5" /> Ayarlar</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="products"><ProductsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="banners"><BannersTab /></TabsContent>
        <TabsContent value="pages"><PagesTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
