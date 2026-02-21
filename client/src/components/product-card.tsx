import { Link } from "wouter";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="group overflow-hidden border-border hover:border-primary/30 transition-all duration-300 bg-card" data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] font-bold" data-testid={`badge-discount-${product.id}`}>
              %{discount} İndirim
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge className="bg-blue-500 text-white text-[10px]">Yeni</Badge>
          )}
          {product.isBestSeller && (
            <Badge className="bg-primary text-primary-foreground text-[10px]">Çok Satan</Badge>
          )}
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
            className="p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
            data-testid={`button-favorite-${product.id}`}
          >
            <Heart className={`w-4 h-4 ${fav ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          <Link href={`/urun/${product.slug}`}>
            <span className="p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors block cursor-pointer" data-testid={`button-quickview-${product.id}`}>
              <Eye className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>

      <CardContent className="p-4">
        <Link href={`/urun/${product.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors cursor-pointer min-h-[2.5rem]" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.shortDescription}</p>
        )}

        <div className="flex items-center gap-1 mt-2">
          {product.rating && parseFloat(product.rating) > 0 && (
            <>
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{product.rating}</span>
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
              )}
            </>
          )}
        </div>

        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-primary" data-testid={`text-price-${product.id}`}>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
              <span className="text-xs text-muted-foreground line-through ml-2">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="h-8 px-3 text-xs neon-glow"
            onClick={(e) => {
              e.preventDefault();
              addToCart({ productId: product.id, quantity: 1 });
            }}
            disabled={isAdding || (product.stock !== null && product.stock <= 0)}
            data-testid={`button-add-cart-${product.id}`}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
            Ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
