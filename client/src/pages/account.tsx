import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Package,
  Lock,
  ChevronDown,
  ChevronUp,
  Home,
  ChevronRight,
  ShoppingBag,
  MapPin,
  Calendar,
  Hash,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: string | number;
  flavor?: string;
  weight?: string;
  image?: string;
}

interface ShippingAddress {
  fullName?: string;
  address?: string;
  city?: string;
  district?: string;
  zipCode?: string;
  phone?: string;
}

interface OrderData {
  id: number;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  subtotal: string;
  shippingCost: string;
  discount: string;
  total: string;
  shippingAddress: ShippingAddress | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  processing: { label: "Hazırlanıyor", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  shipped: { label: "Kargoda", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  delivered: { label: "Teslim Edildi", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "İptal Edildi", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

function OrderCard({ order }: { order: OrderData }) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const orderDate = new Date(order.createdAt).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const address = order.shippingAddress as ShippingAddress | null;

  return (
    <Card data-testid={`card-order-${order.id}`}>
      <CardContent className="p-4">
        <div
          className="flex flex-wrap items-center justify-between gap-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          data-testid={`button-toggle-order-${order.id}`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-[#39FF14]" />
              <span className="font-semibold" data-testid={`text-order-number-${order.id}`}>
                {order.orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span data-testid={`text-order-date-${order.id}`}>{orderDate}</span>
            </div>
            <Badge
              className={`${statusInfo.color} border no-default-hover-elevate no-default-active-elevate`}
              data-testid={`badge-order-status-${order.id}`}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#39FF14]" data-testid={`text-order-total-${order.id}`}>
              {formatPrice(order.total)}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#39FF14]" />
                Sipariş Kalemleri
              </h4>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm p-2 rounded-md bg-muted/30"
                    data-testid={`text-order-item-${order.id}-${idx}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.name}</span>
                      {item.flavor && (
                        <span className="text-muted-foreground text-xs">({item.flavor})</span>
                      )}
                      {item.weight && (
                        <span className="text-muted-foreground text-xs">{item.weight}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">x{item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {address && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#39FF14]" />
                  Teslimat Adresi
                </h4>
                <div className="text-sm text-muted-foreground p-2 rounded-md bg-muted/30" data-testid={`text-order-address-${order.id}`}>
                  {address.fullName && <p className="font-medium text-foreground">{address.fullName}</p>}
                  {address.address && <p>{address.address}</p>}
                  <p>
                    {[address.district, address.city, address.zipCode].filter(Boolean).join(", ")}
                  </p>
                  {address.phone && <p>{address.phone}</p>}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-4 text-sm border-t border-border pt-3">
              <div className="flex gap-2">
                <span className="text-muted-foreground">Ara Toplam:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Kargo:</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              {parseFloat(String(order.discount)) > 0 && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground">İndirim:</span>
                  <span className="text-green-400">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-semibold">Toplam:</span>
                <span className="font-bold text-[#39FF14]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrdersTab() {
  const { data: orders, isLoading, error } = useQuery<OrderData[]>({
    queryKey: ["/api/auth/orders"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/auth/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Siparişler yüklenemedi");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="loading-orders">
        <Loader2 className="h-6 w-6 animate-spin text-[#39FF14]" />
        <span className="ml-2 text-muted-foreground">Siparişler yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground" data-testid="error-orders">
        Siparişler yüklenirken bir hata oluştu.
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-orders">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Henüz siparişiniz bulunmuyor.</p>
        <Link href="/urunler">
          <Button className="mt-4" data-testid="link-shop">
            Alışverişe Başla
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="orders-list">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (data.phone) setPhone(data.phone);
        })
        .catch(() => {});
    }
  }, []);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/auth/profile", { fullName, email, phone });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profil güncellendi", description: "Bilgileriniz başarıyla kaydedildi." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-[#39FF14]" />
          Profil Bilgilerim
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            profileMutation.mutate();
          }}
          data-testid="form-profile"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ad Soyad"
              data-testid="input-fullName"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefon numaranız"
              data-testid="input-phone"
            />
          </div>
          <Button type="submit" disabled={profileMutation.isPending} data-testid="button-save-profile">
            {profileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Kaydet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordTab() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Yeni şifreler eşleşmiyor");
      }
      if (newPassword.length < 6) {
        throw new Error("Şifre en az 6 karakter olmalıdır");
      }
      const res = await apiRequest("PATCH", "/api/auth/password", {
        currentPassword,
        newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Şifre değiştirildi", description: "Şifreniz başarıyla güncellendi." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-5 w-5 text-[#39FF14]" />
          Şifre Değiştir
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            passwordMutation.mutate();
          }}
          data-testid="form-password"
        >
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifreniz"
                data-testid="input-currentPassword"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowCurrent(!showCurrent)}
                data-testid="button-toggle-current-password"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifreniz"
                data-testid="input-newPassword"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowNew(!showNew)}
                data-testid="button-toggle-new-password"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifrenizi tekrar girin"
                data-testid="input-confirmPassword"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirm(!showConfirm)}
                data-testid="button-toggle-confirm-password"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={passwordMutation.isPending} data-testid="button-change-password">
            {passwordMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            Şifreyi Değiştir
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AccountPage() {
  const { user, isLoading, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      setLocation("/giris");
    }
  }, [isLoading, isLoggedIn, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-account">
        <Loader2 className="h-8 w-8 animate-spin text-[#39FF14]" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap" data-testid="breadcrumb-account">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors" data-testid="link-breadcrumb-home">
          <Home className="h-4 w-4" />
          Ana Sayfa
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Hesabım</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Hesabım</h1>
        <p className="text-muted-foreground mt-1" data-testid="text-welcome">
          Hoş geldin, <span className="text-[#39FF14] font-medium">{user?.fullName || user?.username}</span>
        </p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6" data-testid="tabs-account">
          <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Siparişlerim</span>
            <span className="sm:hidden">Siparişler</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2" data-testid="tab-profile">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil Bilgilerim</span>
            <span className="sm:hidden">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2" data-testid="tab-password">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Şifre Değiştir</span>
            <span className="sm:hidden">Şifre</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="password">
          <PasswordTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
