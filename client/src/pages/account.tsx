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
  Plus,
  Trash2,
  Star,
  MapPinned,
  Award,
  Gift,
  Copy,
  Users,
  TrendingUp,
  Check,
  FileText,
} from "lucide-react";
import type { UserAddress } from "@shared/schema";

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

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3">
              <div className="flex flex-wrap gap-4 text-sm">
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`/api/orders/${order.id}/invoice`, "_blank")}
                data-testid={`button-download-invoice-${order.id}`}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Fatura İndir
              </Button>
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

function LoyaltyPointsTab() {
  const { data: balanceData, isLoading: balanceLoading } = useQuery<{ balance: number }>({
    queryKey: ["/api/loyalty/balance"],
  });

  const { data: historyData = [], isLoading: historyLoading } = useQuery<
    Array<{ id: number; userId: number; points: number; type: string; description: string; orderId?: number; createdAt: string }>
  >({
    queryKey: ["/api/loyalty/history"],
  });

  const balance = balanceData?.balance || 0;

  if (balanceLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="loading-loyalty">
        <Loader2 className="h-6 w-6 animate-spin text-[#39FF14]" />
        <span className="ml-2 text-muted-foreground">Sadakat puanları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#39FF14]/10 to-transparent border-[#39FF14]/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Toplam Sadakat Puanları</p>
              <p className="text-4xl font-bold text-[#39FF14]" data-testid="text-loyalty-balance">
                {balance.toLocaleString("tr-TR")}
              </p>
            </div>
            <Award className="h-16 w-16 text-[#39FF14] opacity-50" />
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[#39FF14]" />
          İşlem Geçmişi
        </h3>
        {historyData && historyData.length > 0 ? (
          <div className="space-y-2">
            {historyData.map((transaction: any) => {
              const isEarned = transaction.points > 0;
              const date = new Date(transaction.createdAt).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card
                  key={transaction.id}
                  className="hover-elevate"
                  data-testid={`card-loyalty-transaction-${transaction.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`rounded-full p-2 ${
                            isEarned
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isEarned ? (
                            <Plus className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium" data-testid={`text-loyalty-description-${transaction.id}`}>
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-loyalty-date-${transaction.id}`}>
                            {date}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-bold text-lg ${
                          isEarned ? "text-green-400" : "text-red-400"
                        }`}
                        data-testid={`text-loyalty-points-${transaction.id}`}
                      >
                        {isEarned ? "+" : ""}{transaction.points}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Henüz işlem geçmişi bulunmuyor.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ReferralUsage {
  id: number;
  userId: number;
  referralCodeId: number;
  userName?: string;
  rewardPoints: number;
  createdAt: string;
}

interface ReferralCode {
  id: number;
  userId: number;
  code: string;
  usedCount: number;
  rewardPoints: number;
  isActive: boolean;
  usages: ReferralUsage[];
}

function ReferralSystemTab() {
  const { toast } = useToast();
  const { data: referralData, isLoading: referralLoading } = useQuery<ReferralCode>({
    queryKey: ["/api/referral/my-code"],
  });

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (referralData?.code) {
      navigator.clipboard.writeText(referralData.code).then(() => {
        setCopied(true);
        toast({ title: "Kopya yapıldı", description: "Referans kodu panoya kopyalandı." });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (referralLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="loading-referral">
        <Loader2 className="h-6 w-6 animate-spin text-[#39FF14]" />
        <span className="ml-2 text-muted-foreground">Referans sistemi yükleniyor...</span>
      </div>
    );
  }

  if (!referralData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Referans kodu bulunmuyor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#39FF14]/10 to-transparent border-[#39FF14]/30">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm mb-2">Sizin Referans Kodunuz</p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 bg-muted p-3 rounded-md font-mono text-lg font-bold text-[#39FF14] text-center"
                  data-testid="text-referral-code"
                >
                  {referralData.code}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyCode}
                  data-testid="button-copy-referral-code"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {referralData.isActive ? (
                <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30 no-default-hover-elevate no-default-active-elevate">
                  Aktif
                </Badge>
              ) : (
                <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30 no-default-hover-elevate no-default-active-elevate">
                  Pasif
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Kullanım Sayısı</p>
                <p className="text-2xl font-bold text-[#39FF14]" data-testid="text-referral-used-count">
                  {referralData.usedCount}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Ödül Puanları</p>
                <p className="text-2xl font-bold text-[#39FF14]" data-testid="text-referral-reward-points">
                  {referralData.rewardPoints}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {referralData.usages && referralData.usages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[#39FF14]" />
            Referans Kullanımları
          </h3>
          <div className="space-y-2">
            {referralData.usages.map((usage: any, index: number) => {
              const date = new Date(usage.createdAt).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <Card
                  key={`${usage.id || index}`}
                  className="hover-elevate"
                  data-testid={`card-referral-usage-${index}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-[#39FF14]/20 text-[#39FF14] p-2">
                          <Gift className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-referral-usage-user-${index}`}>
                            {usage.userName || "Bilinmeyen Kullanıcı"}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-referral-usage-date-${index}`}>
                            {date}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-[#39FF14]" data-testid={`text-referral-usage-reward-${index}`}>
                        +{usage.rewardPoints} Puan
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AddressesTab() {
  const { toast } = useToast();
  const { data: addresses = [], isLoading } = useQuery<UserAddress[]>({ queryKey: ["/api/addresses"] });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", fullName: "", phone: "", city: "", district: "", neighborhood: "", address: "", postalCode: "", isDefault: false });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        return apiRequest("PATCH", `/api/addresses/${editId}`, form);
      }
      return apiRequest("POST", "/api/addresses", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: editId ? "Adres güncellendi" : "Adres eklendi" });
      setShowForm(false);
      setEditId(null);
      setForm({ title: "", fullName: "", phone: "", city: "", district: "", neighborhood: "", address: "", postalCode: "", isDefault: false });
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/addresses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Adres silindi" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/addresses/${id}`, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Varsayılan adres güncellendi" });
    },
  });

  const startEdit = (addr: UserAddress) => {
    setEditId(addr.id);
    setForm({
      title: addr.title,
      fullName: addr.fullName,
      phone: addr.phone || "",
      city: addr.city,
      district: addr.district || "",
      neighborhood: addr.neighborhood || "",
      address: addr.address,
      postalCode: addr.postalCode || "",
      isDefault: addr.isDefault || false,
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-[#39FF14]" />
          Adreslerim ({addresses.length})
        </h3>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ title: "", fullName: "", phone: "", city: "", district: "", neighborhood: "", address: "", postalCode: "", isDefault: false }); }} data-testid="button-add-address">
          <Plus className="w-4 h-4 mr-1" /> Yeni Adres
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">{editId ? "Adresi Düzenle" : "Yeni Adres Ekle"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-3" data-testid="form-address">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Adres Başlığı *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ev, İş, vb." required data-testid="input-address-title" />
                </div>
                <div>
                  <Label>Ad Soyad *</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Teslimat alıcısı" required data-testid="input-address-fullname" />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05XX XXX XX XX" data-testid="input-address-phone" />
                </div>
                <div>
                  <Label>İl *</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="İstanbul" required data-testid="input-address-city" />
                </div>
                <div>
                  <Label>İlçe</Label>
                  <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Kadıköy" data-testid="input-address-district" />
                </div>
                <div>
                  <Label>Mahalle</Label>
                  <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Mahalle adı" data-testid="input-address-neighborhood" />
                </div>
              </div>
              <div>
                <Label>Açık Adres *</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Sokak, bina no, daire" required data-testid="input-address-detail" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Posta Kodu</Label>
                  <Input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="34000" data-testid="input-address-postalcode" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} id="isDefault" className="rounded" data-testid="checkbox-address-default" />
                  <Label htmlFor="isDefault" className="text-sm cursor-pointer">Varsayılan adres olarak ayarla</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-address">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editId ? "Güncelle" : "Kaydet"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>İptal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPinned className="w-12 h-12 mx-auto mb-3 text-muted" />
            <p>Henüz kayıtlı adresiniz yok.</p>
            <p className="text-sm">Teslimat için bir adres ekleyin.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <Card key={addr.id} className={addr.isDefault ? "border-primary/50" : ""} data-testid={`address-card-${addr.id}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{addr.title}</span>
                      {addr.isDefault && <Badge className="bg-primary/20 text-primary text-[10px]">Varsayılan</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{addr.fullName}</p>
                    <p className="text-sm text-muted-foreground">{addr.address}</p>
                    <p className="text-sm text-muted-foreground">{[addr.neighborhood, addr.district, addr.city].filter(Boolean).join(", ")} {addr.postalCode || ""}</p>
                    {addr.phone && <p className="text-sm text-muted-foreground">{addr.phone}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!addr.isDefault && (
                      <Button variant="ghost" size="sm" onClick={() => setDefaultMutation.mutate(addr.id)} data-testid={`button-set-default-${addr.id}`}>
                        <Star className="w-4 h-4 text-yellow-400" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => startEdit(addr)} data-testid={`button-edit-address-${addr.id}`}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(addr.id)} data-testid={`button-delete-address-${addr.id}`}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
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
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-6 mb-6 gap-1" data-testid="tabs-account">
          <TabsTrigger value="orders" className="gap-1 text-xs sm:text-sm" data-testid="tab-orders">
            <Package className="h-4 w-4" />
            <span className="hidden lg:inline">Siparişler</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-1 text-xs sm:text-sm" data-testid="tab-addresses">
            <MapPinned className="h-4 w-4" />
            <span className="hidden lg:inline">Adresler</span>
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-1 text-xs sm:text-sm" data-testid="tab-loyalty">
            <Award className="h-4 w-4" />
            <span className="hidden lg:inline">Sadakat</span>
          </TabsTrigger>
          <TabsTrigger value="referral" className="gap-1 text-xs sm:text-sm" data-testid="tab-referral">
            <Gift className="h-4 w-4" />
            <span className="hidden lg:inline">Referans</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1 text-xs sm:text-sm" data-testid="tab-profile">
            <User className="h-4 w-4" />
            <span className="hidden lg:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-1 text-xs sm:text-sm" data-testid="tab-password">
            <Lock className="h-4 w-4" />
            <span className="hidden lg:inline">Şifre</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="addresses">
          <AddressesTab />
        </TabsContent>
        <TabsContent value="loyalty">
          <LoyaltyPointsTab />
        </TabsContent>
        <TabsContent value="referral">
          <ReferralSystemTab />
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
