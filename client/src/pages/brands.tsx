import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Brand } from "@shared/schema";

export default function BrandsPage() {
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="brands-page">
      <h1 className="text-3xl font-bold font-heading mb-8">Markalar</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/urunler?brandId=${brand.id}`}>
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border hover:border-primary/30 bg-card transition-all cursor-pointer" data-testid={`card-brand-${brand.id}`}>
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-12 w-auto object-contain" />
              ) : (
                <div className="h-12 flex items-center justify-center text-xl font-bold text-primary">{brand.name.substring(0, 2)}</div>
              )}
              <span className="text-sm font-medium text-center">{brand.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
