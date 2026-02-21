import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, Edit, Save, X, Package } from "lucide-react";
import type { Product, Category, Brand } from "@shared/schema";

export default function ProductsTab() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", shortDescription: "", price: "", comparePrice: "",
    categoryId: "", brandId: "", images: "", sku: "", stock: "0", tags: "",
    isFeatured: false, isBestSeller: false, isNewArrival: false,
    isVegan: false, isGlutenFree: false, isLactoseFree: false, isSugarFree: false,
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
      toast({ title: "Urun olusturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
      toast({ title: "Urun guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Urun silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "", slug: "", description: "", shortDescription: "", price: "", comparePrice: "",
      categoryId: "", brandId: "", images: "", sku: "", stock: "0", tags: "",
      isFeatured: false, isBestSeller: false, isNewArrival: false,
      isVegan: false, isGlutenFree: false, isLactoseFree: false, isSugarFree: false,
    });
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setShowForm(true);
    setForm({
      name: p.name, slug: p.slug, description: p.description || "", shortDescription: p.shortDescription || "",
      price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      categoryId: String(p.categoryId), brandId: p.brandId ? String(p.brandId) : "",
      images: (p.images || []).join(", "), sku: p.sku || "", stock: String(p.stock || 0),
      tags: (p.tags || []).join(", "),
      isFeatured: p.isFeatured || false, isBestSeller: p.isBestSeller || false, isNewArrival: p.isNewArrival || false,
      isVegan: p.isVegan || false, isGlutenFree: p.isGlutenFree || false,
      isLactoseFree: p.isLactoseFree || false, isSugarFree: p.isSugarFree || false,
    });
  };

  const handleSave = () => {
    const payload: any = {
      name: form.name, slug: form.slug, description: form.description, shortDescription: form.shortDescription,
      price: form.price, categoryId: parseInt(form.categoryId), sku: form.sku,
      stock: parseInt(form.stock) || 0,
      images: form.images.split(",").map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      isFeatured: form.isFeatured, isBestSeller: form.isBestSeller, isNewArrival: form.isNewArrival,
      isVegan: form.isVegan, isGlutenFree: form.isGlutenFree, isLactoseFree: form.isLactoseFree, isSugarFree: form.isSugarFree,
    };
    if (form.comparePrice) payload.comparePrice = form.comparePrice;
    if (form.brandId) payload.brandId = parseInt(form.brandId);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div data-testid="admin-products">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Urun Yonetimi ({products.length})</h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-product-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Urun
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Urun Duzenle" : "Yeni Urun Ekle"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Urun adi" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value, slug: editingId ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9\u00e7\u015f\u0131\u00f6\u00fc\u011f]+/g, "-") }))} data-testid="input-product-name" />
              <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} data-testid="input-product-slug" />
              <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))} data-testid="input-product-sku" />
              <Input placeholder="Fiyat" type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} data-testid="input-product-price" />
              <Input placeholder="Karsilastirma Fiyati" type="number" value={form.comparePrice} onChange={(e) => setForm(p => ({ ...p, comparePrice: e.target.value }))} data-testid="input-product-compare-price" />
              <Input placeholder="Stok" type="number" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} data-testid="input-product-stock" />
              <Select value={form.categoryId} onValueChange={(v) => setForm(p => ({ ...p, categoryId: v }))}>
                <SelectTrigger data-testid="select-product-category"><SelectValue placeholder="Kategori secin" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.brandId} onValueChange={(v) => setForm(p => ({ ...p, brandId: v }))}>
                <SelectTrigger data-testid="select-product-brand"><SelectValue placeholder="Marka secin" /></SelectTrigger>
                <SelectContent>
                  {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Etiketler (virgul ile)" value={form.tags} onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))} data-testid="input-product-tags" />
            </div>
            <div className="mt-3">
              <Input placeholder="Gorsel URL'leri (virgul ile)" value={form.images} onChange={(e) => setForm(p => ({ ...p, images: e.target.value }))} data-testid="input-product-images" />
            </div>
            <div className="mt-3">
              <textarea placeholder="Aciklama" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="w-full h-24 p-3 bg-muted border border-border rounded-md text-sm resize-y" data-testid="textarea-product-description" />
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { key: "isFeatured", label: "One Cikan" },
                { key: "isBestSeller", label: "Cok Satan" },
                { key: "isNewArrival", label: "Yeni Urun" },
                { key: "isVegan", label: "Vegan" },
                { key: "isGlutenFree", label: "Glutensiz" },
                { key: "isLactoseFree", label: "Laktozsuz" },
                { key: "isSugarFree", label: "Sekersiz" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={(form as any)[key]} onChange={(e) => setForm(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.name || !form.slug || !form.price || !form.categoryId} data-testid="button-save-product">
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Kaydet"}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-product">
                <X className="w-4 h-4 mr-2" /> Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-md" data-testid={`admin-product-${product.id}`}>
            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">Stok: {product.stock} | SKU: {product.sku}</p>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {product.isFeatured && <Badge variant="secondary" className="text-xs">One Cikan</Badge>}
              {product.isBestSeller && <Badge variant="secondary" className="text-xs">Cok Satan</Badge>}
            </div>
            <span className="text-sm font-bold">{formatPrice(product.price)}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(product)} data-testid={`button-edit-product-${product.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(product.id)} data-testid={`button-delete-product-${product.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
