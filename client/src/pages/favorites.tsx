import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import ProductCard from "@/components/product-card";

export default function FavoritesPage() {
  const { favorites, isLoading } = useFavorites();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold font-heading mb-8">Favorilerim</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
              <div className="aspect-square bg-muted rounded-t-xl" />
              <div className="p-4 space-y-3"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-6 bg-muted rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" data-testid="empty-favorites">
        <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Favori Listeniz Boş</h1>
        <p className="text-muted-foreground mt-2">Beğendiğiniz ürünleri favorilere ekleyin!</p>
        <Link href="/urunler">
          <Button className="mt-6 neon-glow" data-testid="button-browse-products">Ürünlere Göz At</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="favorites-page">
      <h1 className="text-2xl font-bold font-heading mb-8">Favorilerim ({favorites.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((fav) => (
          <ProductCard key={fav.id} product={fav.product} />
        ))}
      </div>
    </div>
  );
}
