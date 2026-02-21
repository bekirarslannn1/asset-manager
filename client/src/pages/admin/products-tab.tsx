import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, Edit, Save, X, Package, Image, Search, Tags, FileText, Info } from "lucide-react";
import type { Product, Category, Brand } from "@shared/schema";

interface NutritionEntry {
  key: string;
  value: string;
}

export default function ProductsTab() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", shortDescription: "", price: "", comparePrice: "",
    categoryId: "", brandId: "", sku: "", stock: "0", tags: "",
    usageInstructions: "", flavors: "", weights: "",
    isFeatured: false, isBestSeller: false, isNewArrival: false,
    isVegan: false, isGlutenFree: false, isLactoseFree: false, isSugarFree: false,
    goalTags: [] as string[],
  });
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([]);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
      toast({ title: "Ürün oluşturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
      toast({ title: "Ürün güncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Ürün silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "", slug: "", description: "", shortDescription: "", price: "", comparePrice: "",
      categoryId: "", brandId: "", sku: "", stock: "0", tags: "",
      usageInstructions: "", flavors: "", weights: "",
      isFeatured: false, isBestSeller: false, isNewArrival: false,
      isVegan: false, isGlutenFree: false, isLactoseFree: false, isSugarFree: false,
      goalTags: [],
    });
    setImageUrls([""]);
    setNutritionEntries([]);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setShowForm(true);
    setForm({
      name: p.name, slug: p.slug, description: p.description || "", shortDescription: p.shortDescription || "",
      price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : "",
      categoryId: String(p.categoryId), brandId: p.brandId ? String(p.brandId) : "",
      sku: p.sku || "", stock: String(p.stock || 0),
      tags: (p.tags || []).join(", "),
      usageInstructions: p.usageInstructions || "",
      flavors: (p.flavors || []).join(", "),
      weights: (p.weights || []).join(", "),
      isFeatured: p.isFeatured || false, isBestSeller: p.isBestSeller || false, isNewArrival: p.isNewArrival || false,
      isVegan: p.isVegan || false, isGlutenFree: p.isGlutenFree || false,
      isLactoseFree: p.isLactoseFree || false, isSugarFree: p.isSugarFree || false,
      goalTags: (p as any).goalTags || [],
    });
    const imgs = p.images && p.images.length > 0 ? [...p.images] : [""];
    setImageUrls(imgs);
    if (p.nutritionFacts && typeof p.nutritionFacts === "object" && !Array.isArray(p.nutritionFacts)) {
      const entries = Object.entries(p.nutritionFacts as Record<string, string>).map(([key, value]) => ({ key, value: String(value) }));
      setNutritionEntries(entries.length > 0 ? entries : []);
    } else {
      setNutritionEntries([]);
    }
  };

  const handleSave = () => {
    const filteredImages = imageUrls.map(s => s.trim()).filter(Boolean);
    const nutritionFacts: Record<string, string> = {};
    nutritionEntries.forEach(entry => {
      if (entry.key.trim()) {
        nutritionFacts[entry.key.trim()] = entry.value.trim();
      }
    });

    const payload: any = {
      name: form.name, slug: form.slug, description: form.description, shortDescription: form.shortDescription,
      price: form.price, categoryId: parseInt(form.categoryId), sku: form.sku,
      stock: parseInt(form.stock) || 0,
      images: filteredImages,
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      usageInstructions: form.usageInstructions || null,
      flavors: form.flavors.split(",").map(s => s.trim()).filter(Boolean),
      weights: form.weights.split(",").map(s => s.trim()).filter(Boolean),
      nutritionFacts: Object.keys(nutritionFacts).length > 0 ? nutritionFacts : null,
      isFeatured: form.isFeatured, isBestSeller: form.isBestSeller, isNewArrival: form.isNewArrival,
      isVegan: form.isVegan, isGlutenFree: form.isGlutenFree, isLactoseFree: form.isLactoseFree, isSugarFree: form.isSugarFree,
      goalTags: form.goalTags.length > 0 ? form.goalTags : null,
    };
    if (form.comparePrice) payload.comparePrice = form.comparePrice;
    if (form.brandId) payload.brandId = parseInt(form.brandId);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addImageUrl = () => setImageUrls(prev => [...prev, ""]);
  const removeImageUrl = (index: number) => setImageUrls(prev => prev.filter((_, i) => i !== index));
  const updateImageUrl = (index: number, value: string) => setImageUrls(prev => prev.map((v, i) => i === index ? value : v));

  const addNutritionEntry = () => setNutritionEntries(prev => [...prev, { key: "", value: "" }]);
  const removeNutritionEntry = (index: number) => setNutritionEntries(prev => prev.filter((_, i) => i !== index));
  const updateNutritionEntry = (index: number, field: "key" | "value", val: string) =>
    setNutritionEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: val } : entry));

  const generateSlug = (name: string) =>
    name.toLowerCase()
      .replace(/ç/g, "c").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const seoTitle = form.name || "Ürün Başlığı";
  const seoDescription = form.shortDescription || "Ürün açıklaması burada görünecek...";
  const seoUrl = `orneksite.com/urun/${form.slug || "urun-slug"}`;

  return (
    <div data-testid="admin-products">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Ürün Yönetimi ({products.length})</h3>
        <Button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); else setEditingId(null); }} data-testid="button-toggle-product-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Ürün
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">{editingId ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Temel Bilgiler</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="product-name" className="text-xs text-muted-foreground">Ürün Adı</Label>
                  <Input
                    id="product-name"
                    placeholder="Ürün adı"
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value, slug: editingId ? p.slug : generateSlug(e.target.value) }))}
                    data-testid="input-product-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-slug" className="text-xs text-muted-foreground">Slug</Label>
                  <Input
                    id="product-slug"
                    placeholder="urun-slug"
                    value={form.slug}
                    onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))}
                    data-testid="input-product-slug"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-sku" className="text-xs text-muted-foreground">SKU</Label>
                  <Input
                    id="product-sku"
                    placeholder="SKU"
                    value={form.sku}
                    onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))}
                    data-testid="input-product-sku"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                  <Label htmlFor="product-short-desc" className="text-xs text-muted-foreground">Kısa Açıklama</Label>
                  <Input
                    id="product-short-desc"
                    placeholder="Kısa açıklama"
                    value={form.shortDescription}
                    onChange={(e) => setForm(p => ({ ...p, shortDescription: e.target.value }))}
                    data-testid="input-product-short-description"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-price" className="text-xs text-muted-foreground">Fiyat</Label>
                  <Input
                    id="product-price"
                    placeholder="Fiyat"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))}
                    data-testid="input-product-price"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-compare-price" className="text-xs text-muted-foreground">Karşılaştırma Fiyatı</Label>
                  <Input
                    id="product-compare-price"
                    placeholder="Karşılaştırma fiyatı"
                    type="number"
                    value={form.comparePrice}
                    onChange={(e) => setForm(p => ({ ...p, comparePrice: e.target.value }))}
                    data-testid="input-product-compare-price"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-stock" className="text-xs text-muted-foreground">Stok</Label>
                  <Input
                    id="product-stock"
                    placeholder="Stok"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))}
                    data-testid="input-product-stock"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kategori</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm(p => ({ ...p, categoryId: v }))}>
                    <SelectTrigger data-testid="select-product-category"><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Marka</Label>
                  <Select value={form.brandId} onValueChange={(v) => setForm(p => ({ ...p, brandId: v }))}>
                    <SelectTrigger data-testid="select-product-brand"><SelectValue placeholder="Marka seçin" /></SelectTrigger>
                    <SelectContent>
                      {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Açıklama ve İçerik</h4>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="product-description" className="text-xs text-muted-foreground">Detaylı Açıklama</Label>
                    <span className="text-xs text-muted-foreground" data-testid="text-description-count">{form.description.length} karakter</span>
                  </div>
                  <Textarea
                    id="product-description"
                    placeholder="Detaylı ürün açıklaması..."
                    value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    className="min-h-[120px] resize-y"
                    data-testid="textarea-product-description"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product-usage" className="text-xs text-muted-foreground">Kullanım Talimatları</Label>
                  <Textarea
                    id="product-usage"
                    placeholder="Kullanım talimatları..."
                    value={form.usageInstructions}
                    onChange={(e) => setForm(p => ({ ...p, usageInstructions: e.target.value }))}
                    className="min-h-[80px] resize-y"
                    data-testid="textarea-product-usage-instructions"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Besin Değerleri</Label>
                    <Button variant="outline" size="sm" onClick={addNutritionEntry} data-testid="button-add-nutrition">
                      <Plus className="w-3 h-3 mr-1" /> Ekle
                    </Button>
                  </div>
                  {nutritionEntries.length === 0 && (
                    <p className="text-xs text-muted-foreground">Henüz besin değeri eklenmedi.</p>
                  )}
                  {nutritionEntries.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Anahtar (ör: Protein)"
                        value={entry.key}
                        onChange={(e) => updateNutritionEntry(idx, "key", e.target.value)}
                        className="flex-1"
                        data-testid={`input-nutrition-key-${idx}`}
                      />
                      <Input
                        placeholder="Değer (ör: 25g)"
                        value={entry.value}
                        onChange={(e) => updateNutritionEntry(idx, "value", e.target.value)}
                        className="flex-1"
                        data-testid={`input-nutrition-value-${idx}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeNutritionEntry(idx)} data-testid={`button-remove-nutrition-${idx}`}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="product-flavors" className="text-xs text-muted-foreground">Aromaları (virgülle ayırın)</Label>
                    <Input
                      id="product-flavors"
                      placeholder="Çikolata, Vanilya, Çilek"
                      value={form.flavors}
                      onChange={(e) => setForm(p => ({ ...p, flavors: e.target.value }))}
                      data-testid="input-product-flavors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="product-weights" className="text-xs text-muted-foreground">Gramajlar (virgülle ayırın)</Label>
                    <Input
                      id="product-weights"
                      placeholder="500g, 1kg, 2.5kg"
                      value={form.weights}
                      onChange={(e) => setForm(p => ({ ...p, weights: e.target.value }))}
                      data-testid="input-product-weights"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Görseller</h4>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-3">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {url && (
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                        <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                    <Input
                      placeholder={`Görsel URL ${idx + 1}`}
                      value={url}
                      onChange={(e) => updateImageUrl(idx, e.target.value)}
                      className="flex-1"
                      data-testid={`input-product-image-${idx}`}
                    />
                    {imageUrls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeImageUrl(idx)} data-testid={`button-remove-image-${idx}`}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addImageUrl} data-testid="button-add-image">
                  <Plus className="w-3 h-3 mr-1" /> Görsel Ekle
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">SEO Ayarları</h4>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo-meta-title" className="text-xs text-muted-foreground">Meta Başlık</Label>
                    <span className={`text-xs ${form.name.length > 60 ? "text-red-500" : "text-muted-foreground"}`} data-testid="text-meta-title-count">
                      {form.name.length}/60
                    </span>
                  </div>
                  <Input
                    id="seo-meta-title"
                    placeholder="Meta başlık (ürün adından otomatik alınır)"
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value, slug: editingId ? p.slug : generateSlug(e.target.value) }))}
                    data-testid="input-seo-meta-title"
                  />
                  <p className="text-xs text-muted-foreground">Ürün adı meta başlık olarak kullanılır.</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo-meta-desc" className="text-xs text-muted-foreground">Meta Açıklama</Label>
                    <span className={`text-xs ${form.shortDescription.length > 160 ? "text-red-500" : "text-muted-foreground"}`} data-testid="text-meta-desc-count">
                      {form.shortDescription.length}/160
                    </span>
                  </div>
                  <Textarea
                    id="seo-meta-desc"
                    placeholder="Meta açıklama (kısa açıklamadan otomatik alınır)"
                    value={form.shortDescription}
                    onChange={(e) => setForm(p => ({ ...p, shortDescription: e.target.value }))}
                    className="min-h-[60px] resize-y"
                    data-testid="input-seo-meta-description"
                  />
                  <p className="text-xs text-muted-foreground">Kısa açıklama meta açıklama olarak kullanılır.</p>
                </div>

                <div className="rounded-md border border-border p-4 bg-muted/30" data-testid="seo-preview">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Google Önizleme</p>
                  <div className="space-y-0.5">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate" data-testid="seo-preview-title">
                      {seoTitle.length > 60 ? seoTitle.substring(0, 57) + "..." : seoTitle}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-500" data-testid="seo-preview-url">{seoUrl}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2" data-testid="seo-preview-description">
                      {seoDescription.length > 160 ? seoDescription.substring(0, 157) + "..." : seoDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tags className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Etiketler ve Özellikler</h4>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="product-tags" className="text-xs text-muted-foreground">Etiketler (virgülle ayırın)</Label>
                  <Input
                    id="product-tags"
                    placeholder="protein, supplement, fitness"
                    value={form.tags}
                    onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))}
                    data-testid="input-product-tags"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Hedef Etiketleri (Sihirbaz için)</Label>
                  <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {[
                      { value: "kas_kazanimi", label: "Kas Kazanımı" },
                      { value: "yag_yakim", label: "Yağ Yakım" },
                      { value: "genel_saglik", label: "Genel Sağlık" },
                      { value: "performans", label: "Performans" },
                      { value: "toparlanma", label: "Toparlanma" },
                      { value: "kilo_alma", label: "Kilo Alma" },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 text-sm cursor-pointer" data-testid={`checkbox-label-goal-${value}`}>
                        <Checkbox
                          checked={form.goalTags.includes(value)}
                          onCheckedChange={(checked) => {
                            setForm(p => ({
                              ...p,
                              goalTags: checked
                                ? [...p.goalTags, value]
                                : p.goalTags.filter(t => t !== value),
                            }));
                          }}
                          data-testid={`checkbox-goal-${value}`}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {[
                    { key: "isFeatured", label: "Öne Çıkan" },
                    { key: "isBestSeller", label: "Çok Satan" },
                    { key: "isNewArrival", label: "Yeni Ürün" },
                    { key: "isVegan", label: "Vegan" },
                    { key: "isGlutenFree", label: "Glutensiz" },
                    { key: "isLactoseFree", label: "Laktozsuz" },
                    { key: "isSugarFree", label: "Şekersiz" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer" data-testid={`checkbox-label-${key}`}>
                      <Checkbox
                        checked={(form as any)[key]}
                        onCheckedChange={(checked) => setForm(p => ({ ...p, [key]: !!checked }))}
                        data-testid={`checkbox-${key}`}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Separator />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} disabled={!form.name || !form.slug || !form.price || !form.categoryId || createMutation.isPending || updateMutation.isPending} data-testid="button-save-product">
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Güncelle" : "Kaydet"}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-product">
                <X className="w-4 h-4 mr-2" /> İptal
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
              {product.isFeatured && <Badge variant="secondary" className="text-xs">Öne Çıkan</Badge>}
              {product.isBestSeller && <Badge variant="secondary" className="text-xs">Çok Satan</Badge>}
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