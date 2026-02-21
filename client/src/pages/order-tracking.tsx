import { useState } from "react";
import { Link } from "wouter";
import { Search, Package, Truck, CheckCircle, Clock, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@shared/schema";

const statusMap: Record<string, string> = {
  pending: "Sipariş Alındı",
  processing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const statusSteps = [
  { key: "pending", label: "Sipariş Alındı", icon: Clock },
  { key: "processing", label: "Hazırlanıyor", icon: Package },
  { key: "shipped", label: "Kargoya Verildi", icon: Truck },
  { key: "delivered", label: "Teslim Edildi", icon: CheckCircle },
];

const statusOrder = ["pending", "processing", "shipped", "delivered"];

function getStatusIndex(status: string): number {
  const idx = statusOrder.indexOf(status);
  return idx >= 0 ? idx : -1;
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);

    try {
      const res = await apiRequest("GET", `/api/orders/${trimmed}`);
      const data = await res.json();
      setOrder(data);
    } catch {
      setError("Sipariş bulunamadı. Lütfen sipariş numaranızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  const shippingAddress = order?.shippingAddress as {
    address?: string;
    city?: string;
    district?: string;
    zipCode?: string;
  } | null;

  const items = (order?.items ?? []) as Array<{
    name?: string;
    productName?: string;
    quantity?: number;
    price?: string | number;
    selectedFlavor?: string;
    selectedWeight?: string;
  }>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap" data-testid="breadcrumb-nav">
        <Link href="/" className="hover:text-primary transition-colors" data-testid="breadcrumb-home">
          Ana Sayfa
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium" data-testid="breadcrumb-current">Sipariş Takip</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" data-testid="page-title">Sipariş Takip</h1>
        <p className="text-muted-foreground" data-testid="page-description">
          Sipariş numaranızı girerek siparişinizin durumunu takip edebilirsiniz.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap" data-testid="order-search-form">
            <Input
              placeholder="Sipariş numaranızı girin (örn: ORD-12345)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="flex-1 min-w-[200px]"
              data-testid="input-order-number"
            />
            <Button type="submit" disabled={loading || !orderNumber.trim()} data-testid="button-search-order">
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Aranıyor..." : "Sorgula"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3" data-testid="text-email-note">
            Sipariş numaranızı, sipariş onay e-postanızda bulabilirsiniz.
          </p>
        </CardContent>
      </Card>

      {error && searched && (
        <Card className="mb-8 border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive text-center" data-testid="text-error-message">{error}</p>
          </CardContent>
        </Card>
      )}

      {order && !isCancelled && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Sipariş Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between relative" data-testid="status-timeline">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
              />
              {statusSteps.map((step, index) => {
                const isReached = index <= currentStatusIndex;
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10" data-testid={`status-step-${step.key}`}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isReached
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-muted text-muted-foreground"
                      }`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-xs mt-2 text-center max-w-[80px] ${
                        isReached ? "text-primary font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {order && (
        <>
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-lg" data-testid="text-order-number">
                Sipariş #{order.orderNumber}
              </CardTitle>
              <Badge
                variant={isCancelled ? "destructive" : "default"}
                data-testid="badge-order-status"
              >
                {statusMap[order.status] || order.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Sipariş Kalemleri</h3>
                <div className="space-y-3" data-testid="order-items-list">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2 flex-wrap"
                      data-testid={`order-item-${index}`}
                    >
                      <div className="flex-1 min-w-[150px]">
                        <p className="font-medium" data-testid={`text-item-name-${index}`}>
                          {item.name || item.productName || "Ürün"}
                        </p>
                        {(item.selectedFlavor || item.selectedWeight) && (
                          <p className="text-xs text-muted-foreground">
                            {item.selectedFlavor && `Aroma: ${item.selectedFlavor}`}
                            {item.selectedFlavor && item.selectedWeight && " | "}
                            {item.selectedWeight && `Boyut: ${item.selectedWeight}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground" data-testid={`text-item-quantity-${index}`}>
                          x{item.quantity || 1}
                        </span>
                        <span className="font-medium min-w-[80px] text-right" data-testid={`text-item-price-${index}`}>
                          {item.price ? formatPrice(item.price) : "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2" data-testid="order-totals">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span data-testid="text-subtotal">{formatPrice(order.subtotal)}</span>
                </div>
                {order.shippingCost && Number(order.shippingCost) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kargo</span>
                    <span data-testid="text-shipping-cost">{formatPrice(order.shippingCost)}</span>
                  </div>
                )}
                {order.discount && Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">İndirim</span>
                    <span className="text-green-500" data-testid="text-discount">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                  <span>Toplam</span>
                  <span data-testid="text-total">{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    <MapPin className="h-4 w-4 text-primary" />
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent data-testid="shipping-address">
                  <p className="text-sm">{shippingAddress.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {[shippingAddress.district, shippingAddress.city].filter(Boolean).join(", ")}
                  </p>
                  {shippingAddress.zipCode && (
                    <p className="text-sm text-muted-foreground">{shippingAddress.zipCode}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {order.paymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ödeme Yöntemi</CardTitle>
                </CardHeader>
                <CardContent data-testid="payment-method">
                  <p className="text-sm">{order.paymentMethod}</p>
                  {order.couponCode && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Kupon: <Badge variant="outline">{order.couponCode}</Badge>
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}