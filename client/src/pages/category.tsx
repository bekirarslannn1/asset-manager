import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ChevronRight } from "lucide-react";
import ProductCard from "@/components/product-card";
import type { Product, Category } from "@shared/schema";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: category } = useQuery<Category>({ queryKey: [`/api/categories/${slug}`] });
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [`/api/products?categoryId=${category?.id || ""}`],
    enabled: !!category?.id,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="category-page">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/"><span className="hover:text-primary cursor-pointer">Ana Sayfa</span></Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">{category?.name || "Kategori"}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading">{category?.name}</h1>
        {category?.description && <p className="text-muted-foreground mt-2">{category.description}</p>}
        <p className="text-sm text-muted-foreground mt-1">{products.length} ürün</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
              <div className="aspect-square bg-muted rounded-t-xl" />
              <div className="p-4 space-y-3"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-6 bg-muted rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
