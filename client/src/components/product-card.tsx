import { Link } from "wouter";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, discountPercent } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import type { Product } from "@shared/schema";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, isAdding } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const discount = product.comparePrice ? discountPercent(product.price, product.comparePrice) : 0;
  const fav = isFavorite(product.id);

  return (
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

          {discount > 0 && (
            <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 font-bold" data-testid={`badge-discount-${product.id}`}>
              %{discount}
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[9px] px-1.5 py-0.5">Yeni</Badge>
          )}
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-background/70 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity z-10"
        data-testid={`button-favorite-${product.id}`}
      >
        <Heart className={`w-3.5 h-3.5 ${fav ? "fill-red-500 text-red-500" : "text-foreground"}`} />
      </button>

      <div className="p-2.5">
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
  );
}
