import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ArrowRight, Send } from "lucide-react";
import ProductCard from "@/components/product-card";
import { useSettings } from "@/hooks/use-settings";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, Brand, Banner } from "@shared/schema";

function HeroSlider() {
  const { data: banners = [] } = useQuery<Banner[]>({ queryKey: ["/api/banners?type=hero"] });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <section className="relative h-[400px] md:h-[500px] overflow-hidden" data-testid="hero-slider">
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          {banner.image && (
            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 w-full">
              <div className="max-w-lg">
                <h1 className="text-3xl md:text-5xl font-bold font-heading leading-tight" data-testid={`text-banner-title-${banner.id}`}>
                  {banner.title}
                </h1>
                {banner.subtitle && (
                  <p className="mt-3 text-lg text-muted-foreground">{banner.subtitle}</p>
                )}
                {banner.link && banner.buttonText && (
                  <Link href={banner.link}>
                    <Button className="mt-6 neon-glow text-base px-6 py-5" data-testid={`button-banner-cta-${banner.id}`}>
                      {banner.buttonText} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(c => (c - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/50 backdrop-blur hover:bg-background transition-colors"
            data-testid="button-slider-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent(c => (c + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-background/50 backdrop-blur hover:bg-background transition-colors"
            data-testid="button-slider-next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary w-8" : "bg-white/50"}`}
                data-testid={`button-slider-dot-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CategoryShowcase() {
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  return (
    <section className="py-12" data-testid="category-showcase">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-heading">Kategoriler</h2>
          <Link href="/urunler">
            <span className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.slice(0, 10).map((cat) => (
            <Link key={cat.id} href={`/kategori/${cat.slug}`}>
              <div className="group relative rounded-xl overflow-hidden aspect-square bg-muted cursor-pointer border border-border hover:border-primary/30 transition-all" data-testid={`card-category-${cat.id}`}>
                {cat.image && (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white text-sm font-semibold">{cat.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductSection({ title, queryKey, linkHref }: { title: string; queryKey: string; linkHref: string }) {
  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: [queryKey] });

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold font-heading mb-8">{title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                <div className="aspect-square bg-muted rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="py-12" data-testid={`section-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-heading">{title}</h2>
          <Link href={linkHref}>
            <span className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer">
              Tümünü Gör <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandShowcase() {
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });

  return (
    <section className="py-12 bg-card" data-testid="brand-showcase">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold font-heading text-center mb-8">Markalar</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/urunler?brandId=${brand.id}`}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer bg-background" data-testid={`card-brand-${brand.id}`}>
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-10 w-auto object-contain" />
                ) : (
                  <div className="h-10 flex items-center justify-center text-sm font-bold text-primary">
                    {brand.name.substring(0, 2)}
                  </div>
                )}
                <span className="text-xs text-muted-foreground text-center">{brand.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await apiRequest("POST", "/api/newsletter", { email });
      toast({ title: "Başarılı!", description: "Bültenimize kaydoldunuz." });
      setEmail("");
    } catch {
      toast({ title: "Hata", description: "Bir sorun oluştu.", variant: "destructive" });
    }
  };

  return (
    <section className="py-16 bg-muted" data-testid="newsletter-section">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold font-heading">Fırsatları Kaçırma!</h2>
        <p className="text-muted-foreground mt-2">E-bültenimize kayıt olun, kampanyalardan ilk siz haberdar olun.</p>
        <form onSubmit={handleSubmit} className="flex gap-2 mt-6 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="E-posta adresiniz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            data-testid="input-newsletter-email"
          />
          <Button type="submit" className="neon-glow" data-testid="button-newsletter-submit">
            <Send className="w-4 h-4 mr-2" /> Kaydol
          </Button>
        </form>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <CategoryShowcase />
      <ProductSection title="Öne Çıkan Ürünler" queryKey="/api/products/featured" linkHref="/urunler?featured=true" />
      <ProductSection title="Çok Satanlar" queryKey="/api/products/best-sellers" linkHref="/urunler?sort=best_seller" />
      <BrandShowcase />
      <ProductSection title="Yeni Ürünler" queryKey="/api/products/new-arrivals" linkHref="/urunler?sort=newest" />
      <NewsletterSection />
    </>
  );
}
