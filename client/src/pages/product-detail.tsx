import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw, ChevronRight, Tag } from "lucide-react";
import { formatPrice, discountPercent } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import ProductCard from "@/components/product-card";
import type { Product, Review, ProductVariant } from "@shared/schema";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useQuery<Product>({ queryKey: [`/api/products/${slug}`] });
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/products", product?.id, "reviews"],
    enabled: !!product?.id,
  });
  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["/api/products", product?.id, "variants"],
    enabled: !!product?.id,
  });
  const { data: featured = [] } = useQuery<Product[]>({ queryKey: ["/api/products/featured"] });

  const { addToCart, isAdding } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [quantity, setQuantity] = useState(1);

  const hasVariants = variants.length > 0;

  const activeVariant = useMemo(() => {
    if (!hasVariants) return null;
    return variants.find(v =>
      v.isActive &&
      (!selectedFlavor || v.flavor === selectedFlavor) &&
      (!selectedWeight || v.weight === selectedWeight)
    ) || null;
  }, [variants, selectedFlavor, selectedWeight, hasVariants]);

  const displayPrice = activeVariant ? activeVariant.price : product?.price || "0";
  const displayComparePrice = activeVariant ? activeVariant.comparePrice : product?.comparePrice;
  const displayStock = activeVariant ? activeVariant.stock : product?.stock;
  const displaySku = activeVariant ? activeVariant.sku : product?.sku;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-muted rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Ürün Bulunamadı</h1>
        <Link href="/urunler"><Button className="mt-4">Ürünlere Dön</Button></Link>
      </div>
    );
  }

  const discount = displayComparePrice ? discountPercent(displayPrice, displayComparePrice) : 0;
  const images = product.images?.length ? product.images : [];
  const nutrition = product.nutritionFacts as Record<string, string> | null;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      variantId: activeVariant?.id || undefined,
      quantity,
      selectedFlavor: selectedFlavor || undefined,
      selectedWeight: selectedWeight || undefined,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="product-detail-page">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" data-testid="breadcrumb">
        <Link href="/"><span className="hover:text-primary cursor-pointer">Ana Sayfa</span></Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/urunler"><span className="hover:text-primary cursor-pointer">Ürünler</span></Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" data-testid="img-product-main" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ShoppingCart className="w-16 h-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === selectedImage ? "border-primary" : "border-border"}`}
                  data-testid={`button-thumbnail-${i}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            {discount > 0 && <Badge className="bg-red-500 text-white">%{discount} İndirim</Badge>}
            {product.isNewArrival && <Badge className="bg-blue-500 text-white">Yeni</Badge>}
            {product.isBestSeller && <Badge className="bg-primary text-primary-foreground">Çok Satan</Badge>}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold font-heading" data-testid="text-product-title">{product.name}</h1>

          {product.shortDescription && (
            <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            {product.rating && parseFloat(product.rating) > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(product.rating!)) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                ))}
                <span className="text-sm font-medium ml-1">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviewCount} yorum)</span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary" data-testid="text-product-price">{formatPrice(displayPrice)}</span>
              {displayComparePrice && parseFloat(displayComparePrice) > parseFloat(displayPrice) && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(displayComparePrice)}</span>
              )}
            </div>
            {hasVariants && activeVariant && (
              <div className="flex items-center gap-2 mt-2">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">SKU: {activeVariant.sku}</span>
                {activeVariant.barcode && <span className="text-xs text-muted-foreground">| Barkod: {activeVariant.barcode}</span>}
                <span className="text-xs text-muted-foreground">| Stok: {activeVariant.stock}</span>
              </div>
            )}
          </div>

          {product.flavors && product.flavors.length > 0 && (
            <div className="mt-6">
              <label className="text-sm font-semibold block mb-2">Aroma</label>
              <div className="flex flex-wrap gap-2">
                {product.flavors.map((flavor) => (
                  <button
                    key={flavor}
                    onClick={() => setSelectedFlavor(flavor)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${selectedFlavor === flavor ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    data-testid={`button-flavor-${flavor}`}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.weights && product.weights.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-semibold block mb-2">Boyut</label>
              <div className="flex flex-wrap gap-2">
                {product.weights.map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setSelectedWeight(weight)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${selectedWeight === weight ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                    data-testid={`button-weight-${weight}`}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-8">
            <div className="flex items-center border border-border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-muted transition-colors" data-testid="button-qty-minus">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium" data-testid="text-quantity">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-muted transition-colors" data-testid="button-qty-plus">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button
              className="flex-1 neon-glow py-6 text-base"
              onClick={handleAddToCart}
              disabled={isAdding || (displayStock !== null && displayStock !== undefined && displayStock <= 0)}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Sepete Ekle
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={() => toggleFavorite(product.id)}
              data-testid="button-toggle-favorite"
            >
              <Heart className={`w-5 h-5 ${isFavorite(product.id) ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Truck, text: "Hızlı Kargo" },
              { icon: Shield, text: "Orijinal Ürün" },
              { icon: RotateCcw, text: "14 Gün İade" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted text-center">
                <item.icon className="w-5 h-5 text-primary" />
                <span className="text-xs">{item.text}</span>
              </div>
            ))}
          </div>

          {displaySku && (
            <p className="text-xs text-muted-foreground mt-4">SKU: {displaySku}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="description" className="mt-12">
        <TabsList className="w-full justify-start bg-card border border-border" data-testid="tabs-product-info">
          <TabsTrigger value="description">Açıklama</TabsTrigger>
          {nutrition && <TabsTrigger value="nutrition">Besin Değerleri</TabsTrigger>}
          {product.usageInstructions && <TabsTrigger value="usage">Kullanım</TabsTrigger>}
          <TabsTrigger value="reviews">Yorumlar ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose prose-invert max-w-none text-muted-foreground" data-testid="text-product-description">
            {product.description}
          </div>
        </TabsContent>

        {nutrition && (
          <TabsContent value="nutrition" className="mt-6">
            <div className="bg-card border border-border rounded-xl p-6 max-w-md" data-testid="nutrition-facts">
              <h3 className="font-bold text-lg mb-4">Besin Değerleri (1 Servis)</h3>
              <div className="divide-y divide-border">
                {Object.entries(nutrition).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2.5 text-sm">
                    <span className="capitalize text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {product.usageInstructions && (
          <TabsContent value="usage" className="mt-6">
            <p className="text-muted-foreground" data-testid="text-usage">{product.usageInstructions}</p>
          </TabsContent>
        )}

        <TabsContent value="reviews" className="mt-6">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground">Henüz yorum yapılmamış.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-4" data-testid={`review-${review.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{review.userName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {featured.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold font-heading mb-8">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.filter(p => p.id !== product.id).slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
