import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, ShoppingCart, Star, ArrowLeftRight, Eye, X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, discountPercent } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useCompare } from "@/hooks/use-compare";
import type { Product } from "@shared/schema";

function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addToCart, isAdding } = useCart();
  const [, setLocation] = useLocation();
  const [qty, setQty] = useState(1);
  const discount = product.comparePrice ? discountPercent(product.price, product.comparePrice) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="quick-view-modal">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted z-10" data-testid="button-close-quickview">
          <X className="w-5 h-5" />
        </button>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-12 h-12" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {discount > 0 && <Badge className="bg-red-500 text-white text-xs">%{discount}</Badge>}
                {product.isNewArrival && <Badge className="bg-blue-500 text-white text-xs">Yeni</Badge>}
                {product.isBestSeller && <Badge className="bg-primary text-primary-foreground text-xs">Çok Satan</Badge>}
              </div>
              <h3 className="text-lg font-bold font-heading" data-testid="text-quickview-name">{product.name}</h3>
              {product.shortDescription && <p className="text-sm text-muted-foreground mt-1">{product.shortDescription}</p>}
              {product.rating && parseFloat(product.rating) > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(parseFloat(product.rating!)) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                  ))}
                  <span className="text-xs font-medium ml-1">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                </div>
              )}
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
                {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-muted transition-colors" data-testid="button-quickview-qty-minus"><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center text-sm font-medium" data-testid="text-quickview-qty">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-muted transition-colors" data-testid="button-quickview-qty-plus"><Plus className="w-4 h-4" /></button>
                </div>
                <Button
                  className="flex-1 neon-glow"
                  onClick={() => { addToCart({ productId: product.id, quantity: qty }); onClose(); }}
                  disabled={isAdding || (product.stock !== null && product.stock <= 0)}
                  data-testid="button-quickview-add-cart"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Sepete Ekle
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { onClose(); setLocation(`/urun/${product.slug}`); }} data-testid="button-quickview-detail">
                Ürün Detayına Git
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, isAdding } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleCompare, isInCompare } = useCompare();
  const [showQuickView, setShowQuickView] = useState(false);
  const discount = product.comparePrice ? discountPercent(product.price, product.comparePrice) : 0;
  const fav = isFavorite(product.id);
  const inCompare = isInCompare(product.id);

  return (
    <>
    {showQuickView && <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />}
    <div className="group relative rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-300" data-testid={`card-product-${product.id}`}>
      <Link href={`/urun/${product.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted cursor-pointer">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="w-8 h-8" />
            </div>
          )}

          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-[5]">
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 font-bold" data-testid={`badge-discount-${product.id}`}>
                %{discount}
              </Badge>
            )}
            {product.isBestSeller && (
              <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5" data-testid={`badge-bestseller-${product.id}`}>Çok Satan</Badge>
            )}
            {product.stock !== null && product.stock > 0 && product.stock <= 5 && (
              <Badge className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 animate-pulse" data-testid={`badge-lowstock-${product.id}`}>Son {product.stock} Adet!</Badge>
            )}
            {product.stock !== null && product.stock <= 0 && (
              <Badge className="bg-gray-500 text-white text-[9px] px-1.5 py-0.5" data-testid={`badge-outofstock-${product.id}`}>Tükendi</Badge>
            )}
          </div>
          <div className="absolute top-1.5 right-10 flex flex-col gap-1 z-[5]">
            {product.isNewArrival && (
              <Badge className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5" data-testid={`badge-new-${product.id}`}>Yeni</Badge>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-background/70 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
        data-testid={`button-favorite-${product.id}`}
      >
        <Heart className={`w-3.5 h-3.5 ${fav ? "fill-red-500 text-red-500" : "text-foreground"}`} />
      </button>

      <button
        onClick={(e) => { e.preventDefault(); toggleCompare(product.id); }}
        className="absolute top-9 right-1.5 p-1.5 rounded-full bg-background/70 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
        data-testid={`button-compare-${product.id}`}
      >
        <ArrowLeftRight className={`w-3.5 h-3.5 ${inCompare ? "text-primary" : "text-foreground"}`} />
      </button>

      <button
        onClick={(e) => { e.preventDefault(); setShowQuickView(true); }}
        className="absolute top-[4.25rem] right-1.5 p-1.5 rounded-full bg-background/70 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
        data-testid={`button-quickview-${product.id}`}
      >
        <Eye className="w-3.5 h-3.5 text-foreground" />
      </button>

      <div className="p-2.5">
        {parseFloat(product.price) >= 500 && (
          <div className="flex items-center gap-1 mb-1">
            <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1 py-0 border-0" data-testid={`badge-freeship-${product.id}`}>Ücretsiz Kargo</Badge>
          </div>
        )}
        <Link href={`/urun/${product.slug}`}>
          <h3 className="font-medium text-xs line-clamp-2 hover:text-primary transition-colors cursor-pointer leading-tight min-h-[2rem]" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>

        {product.rating && parseFloat(product.rating) > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-medium">{product.rating}</span>
            {product.reviewCount && product.reviewCount > 0 && (
              <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-1.5 gap-1">
          <div className="min-w-0">
            <span className="text-sm font-bold text-primary block" data-testid={`text-price-${product.id}`}>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="h-7 w-7 p-0 neon-glow flex-shrink-0"
            onClick={(e) => {
              e.preventDefault();
              addToCart({ productId: product.id, quantity: 1 });
            }}
            disabled={isAdding || (product.stock !== null && product.stock <= 0)}
            data-testid={`button-add-cart-${product.id}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
