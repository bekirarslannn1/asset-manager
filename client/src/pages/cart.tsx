import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, ShoppingCart, Tag, ArrowRight, ArrowLeft, UserCheck, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/product-card";
import type { Coupon, Product } from "@shared/schema";

function GuestCheckoutInfo() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return null;
  return (
    <div className="mt-4 flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-lg p-3" data-testid="guest-checkout-info">
      <UserCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <div className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground">Üye olmadan sipariş verebilirsiniz.</span>{" "}
        Teslimat bilgilerinizi bir sonraki adımda gireceksiniz.
        <Link href="/giris">
          <span className="text-primary hover:underline ml-1 cursor-pointer">Giriş yap</span>
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const { isLoggedIn } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await apiRequest("POST", "/api/coupons/validate", { code: couponCode.trim().toUpperCase() });
      const coupon = await res.json();
      setAppliedCoupon(coupon);
      toast({ title: "Kupon uygulandı!", description: `${coupon.discountValue}${coupon.discountType === "percentage" ? "%" : "₺"} indirim` });
    } catch {
      toast({ title: "Geçersiz kupon kodu", variant: "destructive" });
      setAppliedCoupon(null);
    }
    setCouponLoading(false);
  };

  const discount = appliedCoupon
    ? appliedCoupon.discountType === "percentage"
      ? totalPrice * (parseFloat(appliedCoupon.discountValue) / 100)
      : parseFloat(appliedCoupon.discountValue)
    : 0;

  const shippingCost = totalPrice >= 500 ? 0 : 29.90;
  const finalTotal = totalPrice - discount + shippingCost;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" data-testid="empty-cart">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Sepetiniz Boş</h1>
        <p className="text-muted-foreground mt-2">Hemen alışverişe başlayın!</p>
        <Link href="/urunler">
          <Button className="mt-6 neon-glow" data-testid="button-start-shopping">
            Alışverişe Başla <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="cart-page">
      <h1 className="text-2xl font-bold font-heading mb-8">
        Sepetim <span className="text-muted-foreground text-lg font-normal">({totalItems} ürün)</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex gap-4" data-testid={`cart-item-${item.id}`}>
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/urun/${item.product.slug}`}>
                  <h3 className="font-medium text-sm hover:text-primary transition-colors cursor-pointer line-clamp-1" data-testid={`text-cart-item-name-${item.id}`}>
                    {item.product.name}
                  </h3>
                </Link>
                <div className="flex gap-2 mt-1">
                  {item.selectedFlavor && (
                    <span className="text-xs text-muted-foreground">Aroma: {item.selectedFlavor}</span>
                  )}
                  {item.selectedWeight && (
                    <span className="text-xs text-muted-foreground">Boyut: {item.selectedWeight}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                      className="p-1.5 hover:bg-muted transition-colors"
                      data-testid={`button-cart-minus-${item.id}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity({ id: item.id, quantity: item.quantity + 1 })}
                      className="p-1.5 hover:bg-muted transition-colors"
                      data-testid={`button-cart-plus-${item.id}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary" data-testid={`text-cart-item-total-${item.id}`}>
                      {formatPrice(parseFloat(item.product.price) * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                      data-testid={`button-cart-remove-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4">
            <Link href="/urunler">
              <Button variant="outline" data-testid="button-continue-shopping">
                <ArrowLeft className="w-4 h-4 mr-2" /> Alışverişe Devam Et
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => clearCart()} className="text-red-500 hover:text-red-400" data-testid="button-clear-cart">
              <Trash2 className="w-4 h-4 mr-2" /> Sepeti Temizle
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-24" data-testid="cart-summary">
            <h2 className="font-bold text-lg mb-4">Sipariş Özeti</h2>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Kupon kodu"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                data-testid="input-coupon-code"
              />
              <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading} data-testid="button-apply-coupon">
                <Tag className="w-4 h-4" />
              </Button>
            </div>
            {appliedCoupon && (
              <div className="text-xs text-primary mb-4 bg-primary/10 px-3 py-2 rounded-lg" data-testid="text-coupon-applied">
                Kupon: {appliedCoupon.code} uygulandı!
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>İndirim</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kargo</span>
                <span className={shippingCost === 0 ? "text-primary" : ""}>
                  {shippingCost === 0 ? "Ücretsiz" : formatPrice(shippingCost)}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatPrice(500 - totalPrice)} daha ekleyin, kargo bedava!
                </p>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Toplam</span>
                <span className="text-primary" data-testid="text-cart-total">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <Link href="/odeme">
              <Button className="w-full mt-6 neon-glow py-6 text-base" data-testid="button-checkout">
                Siparişi Tamamla <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <GuestCheckoutInfo />
          </div>
        </div>
      </div>

      <CartSuggestions cartProductIds={items.map(i => i.productId)} />
    </div>
  );
}

function CartSuggestions({ cartProductIds }: { cartProductIds: number[] }) {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products/best-sellers"] });
  const suggestions = products.filter(p => !cartProductIds.includes(p.id)).slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <section className="mt-12" data-testid="cart-suggestions">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold font-heading">Bunları da Beğenebilirsiniz</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {suggestions.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
