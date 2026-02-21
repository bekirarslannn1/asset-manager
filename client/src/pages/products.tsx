import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SlidersHorizontal, Grid3X3, LayoutList, X, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import ProductCard from "@/components/product-card";
import FlashDeals from "@/components/flash-deals";
import PriceRangeSlider from "@/components/price-range-slider";
import type { Product, Category, Brand } from "@shared/schema";

const ITEMS_PER_PAGE = 12;

export default function ProductsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [sortBy, setSortBy] = useState(params.get("sort") || "newest");
  const [gridView, setGridView] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: params.get("categoryId") || "",
    brandId: params.get("brandId") || "",
    isVegan: false,
    isGlutenFree: false,
    isLactoseFree: false,
    isSugarFree: false,
    searchQuery: params.get("search") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
  });

  const queryString = new URLSearchParams();
  if (filters.categoryId) queryString.set("categoryId", filters.categoryId);
  if (filters.brandId) queryString.set("brandId", filters.brandId);
  if (filters.isVegan) queryString.set("isVegan", "true");
  if (filters.isGlutenFree) queryString.set("isGlutenFree", "true");
  if (filters.isLactoseFree) queryString.set("isLactoseFree", "true");
  if (filters.isSugarFree) queryString.set("isSugarFree", "true");
  if (sortBy) queryString.set("sortBy", sortBy);
  if (filters.searchQuery) queryString.set("search", filters.searchQuery);
  if (filters.minPrice) queryString.set("minPrice", filters.minPrice);
  if (filters.maxPrice) queryString.set("maxPrice", filters.maxPrice);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [`/api/products?${queryString.toString()}`],
  });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });

  const displayedProducts = useMemo(() => {
    return products.slice(0, displayCount);
  }, [products, displayCount]);

  const hasMore = displayCount < products.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, products.length));
      setIsLoadingMore(false);
    }, 300);
  };

  const activeFilterCount = [filters.categoryId, filters.brandId, filters.isVegan, filters.isGlutenFree, filters.isLactoseFree, filters.isSugarFree, filters.minPrice, filters.maxPrice].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ categoryId: "", brandId: "", isVegan: false, isGlutenFree: false, isLactoseFree: false, isSugarFree: false, searchQuery: "", minPrice: "", maxPrice: "" });
  };

  const FilterSidebar = () => (
    <div className="space-y-6" data-testid="filter-sidebar">
      <div>
        <h3 className="font-semibold text-sm mb-3">Kategori</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setFilters(f => ({ ...f, categoryId: "" }))}
            className={`block text-sm w-full text-left px-3 py-2 rounded-lg transition-colors ${!filters.categoryId ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
            data-testid="button-filter-all-categories"
          >
            Tüm Kategoriler
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters(f => ({ ...f, categoryId: String(cat.id) }))}
              className={`block text-sm w-full text-left px-3 py-2 rounded-lg transition-colors ${filters.categoryId === String(cat.id) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              data-testid={`button-filter-category-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Marka</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setFilters(f => ({ ...f, brandId: "" }))}
            className={`block text-sm w-full text-left px-3 py-2 rounded-lg transition-colors ${!filters.brandId ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
            data-testid="button-filter-all-brands"
          >
            Tüm Markalar
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setFilters(f => ({ ...f, brandId: String(brand.id) }))}
              className={`block text-sm w-full text-left px-3 py-2 rounded-lg transition-colors ${filters.brandId === String(brand.id) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              data-testid={`button-filter-brand-${brand.id}`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Fiyat Aralığı</h3>
        <PriceRangeSlider
          minValue={filters.minPrice}
          maxValue={filters.maxPrice}
          onMinChange={(value) => setFilters(f => ({ ...f, minPrice: value }))}
          onMaxChange={(value) => setFilters(f => ({ ...f, maxPrice: value }))}
          minBound={0}
          maxBound={5000}
        />
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Özellikler</h3>
        <div className="space-y-3">
          {[
            { key: "isVegan" as const, label: "Vegan" },
            { key: "isGlutenFree" as const, label: "Gluten Free" },
            { key: "isLactoseFree" as const, label: "Laktoz Free" },
            { key: "isSugarFree" as const, label: "Şekersiz" },
          ].map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters[f.key]}
                onCheckedChange={(val) => setFilters(prev => ({ ...prev, [f.key]: !!val }))}
                data-testid={`checkbox-filter-${f.key}`}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full" data-testid="button-clear-filters">
          <X className="w-4 h-4 mr-2" /> Filtreleri Temizle
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="products-page">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" data-testid="breadcrumb">
        <Link href="/"><span className="hover:text-primary cursor-pointer" data-testid="link-breadcrumb-home">Ana Sayfa</span></Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground" data-testid="text-breadcrumb-current">Ürünler</span>
      </nav>
      <FlashDeals />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">
            {filters.searchQuery ? `"${filters.searchQuery}" için sonuçlar` : "Tüm Ürünler"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} ürün bulundu</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-lg border border-border hover:bg-muted transition-colors"
            onClick={() => setFiltersOpen(!filtersOpen)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">En Yeni</SelectItem>
              <SelectItem value="price_asc">Fiyat: Düşükten Yükseğe</SelectItem>
              <SelectItem value="price_desc">Fiyat: Yüksekten Düşüğe</SelectItem>
              <SelectItem value="rating">En Yüksek Puan</SelectItem>
              <SelectItem value="best_seller">Çok Satanlar</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex items-center border border-border rounded-lg">
            <button
              onClick={() => setGridView(true)}
              className={`p-2 ${gridView ? "bg-muted" : ""} rounded-l-lg transition-colors`}
              data-testid="button-grid-view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridView(false)}
              className={`p-2 ${!gridView ? "bg-muted" : ""} rounded-r-lg transition-colors`}
              data-testid="button-list-view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className={`${filtersOpen ? "fixed inset-0 z-50 bg-background p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0" : "hidden"} lg:block lg:w-64 flex-shrink-0`}>
          {filtersOpen && (
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="font-bold text-lg">Filtreler</h2>
              <button onClick={() => setFiltersOpen(false)} data-testid="button-close-filters"><X className="w-6 h-6" /></button>
            </div>
          )}
          <FilterSidebar />
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className={`grid ${gridView ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"} gap-4`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-6 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Ürün bulunamadı</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters} data-testid="button-reset-search">
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className={`grid ${gridView ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"} gap-4`}>
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {hasMore ? (
                <div className="flex justify-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="min-w-[200px]"
                    data-testid="button-load-more"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      "Daha Fazla Yükle"
                    )}
                  </Button>
                </div>
              ) : products.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-all-products-loaded">
                    Tüm ürünler yüklendi
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
