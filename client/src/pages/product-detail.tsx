import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw, ChevronRight, Tag, Share2, Bell } from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp, SiTelegram } from "react-icons/si";
import { formatPrice, discountPercent } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import ProductCard from "@/components/product-card";
import { ProductJsonLd } from "@/components/seo-head";
import type { Product, Review, ProductVariant } from "@shared/schema";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { addToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    if (product?.id) {
      addToRecentlyViewed(product.id);
    }
  }, [product?.id]);

  const { addToCart, isAdding } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/reviews", {
        productId: product?.id,
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product?.id, "reviews"] });
      toast({ title: "Yorumunuz g\u00F6nderildi", description: "De\u011Ferlendirmeniz i\u00E7in te\u015Fekk\u00FCr ederiz." });
      setReviewName("");
      setReviewRating(0);
      setReviewComment("");
    },
  });

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
      {slug && <ProductJsonLd slug={slug} />}
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

          {displayStock !== null && displayStock !== undefined && displayStock <= 0 && !notifySubmitted && (
            <div className="mt-4 p-4 bg-muted rounded-xl border border-border" data-testid="stock-notify-section">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Stoğa Gelince Haber Ver</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Bu ürün tekrar stoğa girdiğinde size e-posta ile bildirim göndeririz.</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-stock-notify-email"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!notifyEmail || !product) return;
                    try {
                      await apiRequest("POST", "/api/stock-notify", { email: notifyEmail, productId: product.id });
                      setNotifySubmitted(true);
                      toast({ title: "Kaydedildi!", description: "Ürün stoğa girince bildirim alacaksınız." });
                    } catch {
                      toast({ title: "Hata", variant: "destructive" });
                    }
                  }}
                  data-testid="button-stock-notify-submit"
                >
                  Bildir
                </Button>
              </div>
            </div>
          )}
          {notifySubmitted && displayStock !== null && displayStock !== undefined && displayStock <= 0 && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary flex items-center gap-2" data-testid="text-stock-notify-success">
              <Bell className="w-4 h-4" />
              Bildirim kaydınız alındı. Ürün stoğa girince size haber vereceğiz.
            </div>
          )}

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

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Share2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Paylaş:</span>
              <div className="flex gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
                  data-testid="button-share-facebook"
                >
                  <SiFacebook className="w-4 h-4" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-foreground/10 hover:text-foreground transition-colors"
                  data-testid="button-share-twitter"
                >
                  <SiX className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(product.name + " " + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-green-500/20 hover:text-green-400 transition-colors"
                  data-testid="button-share-whatsapp"
                >
                  <SiWhatsapp className="w-4 h-4" />
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-blue-400/20 hover:text-blue-300 transition-colors"
                  data-testid="button-share-telegram"
                >
                  <SiTelegram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
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

          <div className="bg-card border border-border rounded-xl p-6 mt-8" data-testid="review-form">
            <h3 className="font-bold text-lg mb-4">Yorum Yaz</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!reviewName.trim() || reviewRating === 0) return;
                reviewMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium block mb-1.5">Ad Soyad *</label>
                <Input
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Adınızı girin"
                  required
                  data-testid="input-review-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Puanınız *</label>
                <div className="flex gap-1" data-testid="input-review-rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i + 1)}
                      onMouseEnter={() => setReviewHoverRating(i + 1)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="p-0.5"
                      data-testid={`button-review-star-${i + 1}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          i < (reviewHoverRating || reviewRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Yorumunuz</label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ürün hakkındaki düşüncelerinizi yazın..."
                  rows={4}
                  data-testid="input-review-comment"
                />
              </div>
              <Button
                type="submit"
                disabled={reviewMutation.isPending || !reviewName.trim() || reviewRating === 0}
                data-testid="button-submit-review"
              >
                {reviewMutation.isPending ? "Gönderiliyor..." : "Yorum Gönder"}
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {(() => {
        const otherFeatured = featured.filter(p => p.id !== product.id);
        const sameCategoryProducts = otherFeatured.filter(p => p.categoryId === product.categoryId);
        const otherProducts = otherFeatured.filter(p => p.categoryId !== product.categoryId);
        const relatedProducts = [...sameCategoryProducts, ...otherProducts].slice(0, 4);
        return relatedProducts.length > 0 ? (
          <section className="mt-16">
            <h2 className="text-2xl font-bold font-heading mb-8">Benzer Ürünler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null;
      })()}
    </div>
  );
}
