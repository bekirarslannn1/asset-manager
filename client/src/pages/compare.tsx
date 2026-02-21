import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeftRight, ShoppingCart, Star } from "lucide-react";
import { formatPrice, discountPercent } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useCompare } from "@/hooks/use-compare";
import type { Product } from "@shared/schema";

export default function ComparePage() {
  const { compareIds, toggleCompare, clearCompare } = useCompare();
  const { data: allProducts = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { addToCart } = useCart();

  const products = compareIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as Product[];

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center" data-testid="compare-empty">
        <ArrowLeftRight className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Karşılaştırma Listeniz Boş</h1>
        <p className="text-muted-foreground mb-6">Karşılaştırmak istediğiniz ürünleri ürün kartlarındaki karşılaştırma butonunu kullanarak ekleyebilirsiniz.</p>
        <Link href="/urunler"><Button data-testid="button-go-products">Ürünlere Git</Button></Link>
      </div>
    );
  }

  const compareFields = [
    { key: "price", label: "Fiyat", render: (p: Product) => formatPrice(p.price) },
    { key: "comparePrice", label: "Eski Fiyat", render: (p: Product) => p.comparePrice ? formatPrice(p.comparePrice) : "-" },
    { key: "discount", label: "İndirim", render: (p: Product) => p.comparePrice ? `%${discountPercent(p.price, p.comparePrice)}` : "-" },
    { key: "rating", label: "Puan", render: (p: Product) => p.rating ? `${p.rating} / 5` : "-" },
    { key: "stock", label: "Stok", render: (p: Product) => p.stock !== null && p.stock !== undefined ? (p.stock > 0 ? `${p.stock} adet` : "Tükendi") : "-" },
    { key: "flavors", label: "Aromalar", render: (p: Product) => p.flavors?.length ? p.flavors.join(", ") : "-" },
    { key: "weights", label: "Boyutlar", render: (p: Product) => p.weights?.length ? p.weights.join(", ") : "-" },
    { key: "isVegan", label: "Vegan", render: (p: Product) => p.isVegan ? "✓" : "✗" },
    { key: "isGlutenFree", label: "Gluten Free", render: (p: Product) => p.isGlutenFree ? "✓" : "✗" },
    { key: "isLactoseFree", label: "Laktoz Free", render: (p: Product) => p.isLactoseFree ? "✓" : "✗" },
    { key: "isSugarFree", label: "Şekersiz", render: (p: Product) => p.isSugarFree ? "✓" : "✗" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="compare-page">
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h1 className="text-2xl font-bold font-heading">Ürün Karşılaştırma ({products.length})</h1>
        <Button variant="outline" size="sm" onClick={clearCompare} data-testid="button-clear-compare">
          Temizle
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left p-3 bg-muted/50 rounded-tl-lg w-40 text-sm font-medium text-muted-foreground">Özellik</th>
              {products.map((p) => (
                <th key={p.id} className="p-3 bg-muted/50 text-center min-w-[200px]" data-testid={`compare-product-${p.id}`}>
                  <div className="relative">
                    <button
                      onClick={() => toggleCompare(p.id)}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors"
                      data-testid={`button-remove-compare-${p.id}`}
                    >
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </button>
                    <Link href={`/urun/${p.slug}`}>
                      <div className="cursor-pointer">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-24 h-24 object-cover rounded-lg mx-auto mb-2" />
                        ) : (
                          <div className="w-24 h-24 bg-muted rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-sm font-semibold hover:text-primary transition-colors">{p.name}</p>
                      </div>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareFields.map((field, i) => (
              <tr key={field.key} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                <td className="p-3 text-sm font-medium text-muted-foreground">{field.label}</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center text-sm font-medium">
                    {field.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-card">
              <td className="p-3 text-sm font-medium text-muted-foreground">İşlem</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  <Button
                    size="sm"
                    onClick={() => addToCart({ productId: p.id, quantity: 1 })}
                    className="neon-glow"
                    data-testid={`button-add-to-cart-compare-${p.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" /> Sepete Ekle
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
