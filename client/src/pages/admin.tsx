import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Package, Layers, Users, Shield, Settings, Palette, LayoutGrid, FileText,
  Image, ScrollText, Lock, LogOut, Boxes, Loader2, Tag, ShoppingCart, Star, Ticket,
  Navigation, Mail, MessageSquareQuote, CreditCard, BookOpen, Megaphone, MessageCircleQuestion, Bell,
  LineChart, Zap, Truck, Upload,
} from "lucide-react";
import { ROLE_COLORS } from "./admin/shared";

import DashboardTab from "./admin/dashboard-tab";
import { AnalyticsTab } from "./admin/analytics-tab";
import ProductsTab from "./admin/products-tab";
import CategoriesTab from "./admin/categories-tab";
import OrdersTab from "./admin/orders-tab";
import ReviewsTab from "./admin/reviews-tab";
import CouponsTab from "./admin/coupons-tab";
import BrandsTab from "./admin/brands-tab";
import BannersTab from "./admin/banners-tab";
import NewslettersTab from "./admin/newsletters-tab";
import NavigationTab from "./admin/navigation-tab";
import UsersTab from "./admin/users-tab";
import VariantsTab from "./admin/variants-tab";
import AuditLogsTab from "./admin/audit-logs-tab";
import ThemeTab from "./admin/theme-tab";
import SDUITab from "./admin/sdui-tab";
import KVKKTab from "./admin/kvkk-tab";
import PagesTab from "./admin/pages-tab";
import SettingsTab from "./admin/settings-tab";
import TestimonialsTab from "./admin/testimonials-tab";
import PaymentMethodsTab from "./admin/payment-methods-tab";
import BundlesTab from "./admin/bundles-tab";
import BlogTab from "./admin/blog-tab";
import CampaignsTab from "./admin/campaigns-tab";
import QuestionsTab from "./admin/questions-tab";
import StockNotificationsTab from "./admin/stock-notifications-tab";
import { FlashDealsTab } from "./admin/flash-deals-tab";
import { ShipmentTab } from "./admin/shipment-tab";
import { BulkCsvTab } from "./admin/bulk-csv-tab";

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
        toast({ title: "Erisim reddedildi", description: "Admin paneline erisim yetkiniz yok.", variant: "destructive" });
        setLoginLoading(false);
        return;
      }
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
      setAdminUser(data.user);
      toast({ title: "Giris basarili", description: `Hos geldiniz, ${data.user.fullName}` });
    } catch {
      toast({ title: "Giris basarisiz", description: "Kullanici adi veya sifre hatali.", variant: "destructive" });
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
            <CardTitle className="text-xl">Yonetim Paneli Girisi</CardTitle>
            <p className="text-sm text-muted-foreground">Devam etmek icin giris yapin</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="admin-username">Kullanici Adi</Label>
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
              <Label htmlFor="admin-password">Sifre</Label>
              <Input
                id="admin-password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="********"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-testid="input-admin-password"
              />
            </div>
            <Button className="w-full neon-glow" onClick={handleLogin} disabled={loginLoading} data-testid="button-admin-login">
              {loginLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              Giris Yap
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
          <LogOut className="w-4 h-4 mr-2" /> Cikis
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
            <h1 className="text-2xl font-bold font-heading">Yonetim Paneli</h1>
            <p className="text-sm text-muted-foreground">Tum icerik, kullanici ve site ayarlarini yonetin</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" data-testid="admin-tabs">
          <TabsList className="bg-card border border-border mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="gap-1.5" data-testid="tab-dashboard"><BarChart3 className="w-3.5 h-3.5" /> Panel</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5" data-testid="tab-analytics"><LineChart className="w-3.5 h-3.5" /> Analitik</TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5" data-testid="tab-products"><Package className="w-3.5 h-3.5" /> Urunler</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5" data-testid="tab-categories"><Layers className="w-3.5 h-3.5" /> Kategoriler</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5" data-testid="tab-orders"><ShoppingCart className="w-3.5 h-3.5" /> Siparisler</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5" data-testid="tab-reviews"><Star className="w-3.5 h-3.5" /> Yorumlar</TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-1.5" data-testid="tab-testimonials"><MessageSquareQuote className="w-3.5 h-3.5" /> Testinya</TabsTrigger>
            <TabsTrigger value="coupons" className="gap-1.5" data-testid="tab-coupons"><Ticket className="w-3.5 h-3.5" /> Kuponlar</TabsTrigger>
            <TabsTrigger value="brands" className="gap-1.5" data-testid="tab-brands"><Tag className="w-3.5 h-3.5" /> Markalar</TabsTrigger>
            <TabsTrigger value="banners" className="gap-1.5" data-testid="tab-banners"><Image className="w-3.5 h-3.5" /> Bannerlar</TabsTrigger>
            <TabsTrigger value="navigation" className="gap-1.5" data-testid="tab-navigation"><Navigation className="w-3.5 h-3.5" /> Menuler</TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5" data-testid="tab-users"><Users className="w-3.5 h-3.5" /> Kullanicilar</TabsTrigger>
            <TabsTrigger value="variants" className="gap-1.5" data-testid="tab-variants"><Boxes className="w-3.5 h-3.5" /> Varyantlar</TabsTrigger>
            <TabsTrigger value="newsletters" className="gap-1.5" data-testid="tab-newsletters"><Mail className="w-3.5 h-3.5" /> Bulten</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5" data-testid="tab-audit"><ScrollText className="w-3.5 h-3.5" /> Denetim</TabsTrigger>
            <TabsTrigger value="theme" className="gap-1.5" data-testid="tab-theme"><Palette className="w-3.5 h-3.5" /> Tema</TabsTrigger>
            <TabsTrigger value="sdui" className="gap-1.5" data-testid="tab-sdui"><LayoutGrid className="w-3.5 h-3.5" /> SDUI</TabsTrigger>
            <TabsTrigger value="kvkk" className="gap-1.5" data-testid="tab-kvkk"><Shield className="w-3.5 h-3.5" /> KVKK</TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5" data-testid="tab-campaigns"><Megaphone className="w-3.5 h-3.5" /> Kampanyalar</TabsTrigger>
            <TabsTrigger value="bundles" className="gap-1.5" data-testid="tab-bundles"><Boxes className="w-3.5 h-3.5" /> Paketler</TabsTrigger>
            <TabsTrigger value="payment-methods" className="gap-1.5" data-testid="tab-payment-methods"><CreditCard className="w-3.5 h-3.5" /> Ödeme</TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5" data-testid="tab-blog"><BookOpen className="w-3.5 h-3.5" /> Blog</TabsTrigger>
            <TabsTrigger value="questions" className="gap-1.5" data-testid="tab-questions"><MessageCircleQuestion className="w-3.5 h-3.5" /> S&C</TabsTrigger>
            <TabsTrigger value="stock-notifications" className="gap-1.5" data-testid="tab-stock-notifications"><Bell className="w-3.5 h-3.5" /> Stok Bildirim</TabsTrigger>
            <TabsTrigger value="flash-deals" className="gap-1.5" data-testid="tab-flash-deals"><Zap className="w-3.5 h-3.5" /> Flash</TabsTrigger>
            <TabsTrigger value="shipment" className="gap-1.5" data-testid="tab-shipment"><Truck className="w-3.5 h-3.5" /> Kargo</TabsTrigger>
            <TabsTrigger value="bulk-csv" className="gap-1.5" data-testid="tab-bulk-csv"><Upload className="w-3.5 h-3.5" /> CSV</TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5" data-testid="tab-pages"><FileText className="w-3.5 h-3.5" /> Sayfalar</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5" data-testid="tab-settings"><Settings className="w-3.5 h-3.5" /> Ayarlar</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="reviews"><ReviewsTab /></TabsContent>
          <TabsContent value="testimonials"><TestimonialsTab /></TabsContent>
          <TabsContent value="coupons"><CouponsTab /></TabsContent>
          <TabsContent value="brands"><BrandsTab /></TabsContent>
          <TabsContent value="banners"><BannersTab /></TabsContent>
          <TabsContent value="navigation"><NavigationTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="variants"><VariantsTab /></TabsContent>
          <TabsContent value="newsletters"><NewslettersTab /></TabsContent>
          <TabsContent value="audit"><AuditLogsTab /></TabsContent>
          <TabsContent value="theme"><ThemeTab /></TabsContent>
          <TabsContent value="sdui"><SDUITab /></TabsContent>
          <TabsContent value="kvkk"><KVKKTab /></TabsContent>
          <TabsContent value="campaigns"><CampaignsTab /></TabsContent>
          <TabsContent value="bundles"><BundlesTab /></TabsContent>
          <TabsContent value="payment-methods"><PaymentMethodsTab /></TabsContent>
          <TabsContent value="blog"><BlogTab /></TabsContent>
          <TabsContent value="questions"><QuestionsTab /></TabsContent>
          <TabsContent value="stock-notifications"><StockNotificationsTab /></TabsContent>
          <TabsContent value="flash-deals"><FlashDealsTab /></TabsContent>
          <TabsContent value="shipment"><ShipmentTab /></TabsContent>
          <TabsContent value="bulk-csv"><BulkCsvTab /></TabsContent>
          <TabsContent value="pages"><PagesTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLoginGate>
  );
}
