import { Link } from "wouter";
import { Home, ShoppingBag, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";
import type { Product } from "@shared/schema";

export default function NotFound() {
  const { data: featuredProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const products = featuredProducts?.slice(0, 4) ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="page-not-found">
      <div className="flex flex-col items-center justify-center px-4 pt-20 pb-12">
        <h1
          className="text-[10rem] font-black leading-none text-primary select-none"
          style={{ textShadow: "0 0 40px rgba(57, 255, 20, 0.3), 0 0 80px rgba(57, 255, 20, 0.1)" }}
          data-testid="text-404"
        >
          404
        </h1>

        <h2 className="text-3xl font-bold mt-4 font-heading" data-testid="text-not-found-heading">
          Sayfa Bulunamadı
        </h2>

        <p className="text-muted-foreground mt-3 text-center max-w-md" data-testid="text-not-found-subtitle">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>

        <div className="flex items-center gap-3 mt-8 flex-wrap justify-center">
          <Link href="/">
            <Button className="neon-glow" data-testid="link-home">
              <Home className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Button>
          </Link>
          <Link href="/urunler">
            <Button variant="outline" data-testid="link-products">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Ürünleri Keşfet
            </Button>
          </Link>
        </div>
      </div>

      {(isLoading || products.length > 0) && (
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
            <h3 className="text-xl font-bold font-heading" data-testid="text-popular-products-heading">
              Popüler Ürünler
            </h3>
            <Link href="/urunler">
              <Button variant="ghost" size="sm" data-testid="link-view-all-products">
                Tümünü Gör
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="grid-featured-products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
