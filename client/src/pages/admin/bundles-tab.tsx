import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Plus, Trash2, Edit, Save, X, Package, Image } from "lucide-react";
import type { Bundle, Product } from "@shared/schema";

interface BundleItem {
  productId: number;
  quantity: number;
}

const GOAL_TAGS = [
  { value: "kas_kazanimi", label: "Kas Kazanımı" },
  { value: "yag_yakim", label: "Yağ Yakım" },
  { value: "genel_saglik", label: "Genel Sağlık" },
  { value: "performans", label: "Performans" },
  { value: "toparlanma", label: "Toparlanma" },
  { value: "kilo_alma", label: "Kilo Alma" },
] as const;

const goalLabelMap: Record<string, string> = {
  kas_kazanimi: "Kas Kazanımı",
  yag_yakim: "Yağ Yakım",
  genel_saglik: "Genel Sağlık",
  performans: "Performans",
  toparlanma: "Toparlanma",
  kilo_alma: "Kilo Alma",
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function BundlesTab() {
  const { data: bundles = [] } = useQuery<Bundle[]>({ queryKey: ["/api/admin/bundles"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    discountPercent: "10",
    price: "",
    comparePrice: "",
    isActive: true,
    sortOrder: "0",
  });
  const [selectedGoalTags, setSelectedGoalTags] = useState<string[]>([]);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/bundles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      resetForm();
      toast({ title: "Paket oluşturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/bundles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      resetForm();
      toast({ title: "Paket güncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/bundles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      toast({ title: "Paket silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
      discountPercent: "10",
      price: "",
      comparePrice: "",
      isActive: true,
      sortOrder: "0",
    });
    setSelectedGoalTags([]);
    setBundleItems([]);
  };

  const startEdit = (b: Bundle) => {
    setEditingId(b.id);
    setShowForm(true);
    setForm({
      name: b.name,
      slug: b.slug,
      description: b.description || "",
      image: b.image || "",
      discountPercent: String(b.discountPercent ?? 10),
      price: b.price ? String(b.price) : "",
      comparePrice: b.comparePrice ? String(b.comparePrice) : "",
      isActive: b.isActive ?? true,
      sortOrder: String(b.sortOrder ?? 0),
    });
    setSelectedGoalTags(b.goalTags || []);
    const items = Array.isArray(b.items) ? (b.items as BundleItem[]) : [];
    setBundleItems(items);
  };

  const handleSave = () => {
    const payload: any = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      image: form.image || null,
      goalTags: selectedGoalTags.length > 0 ? selectedGoalTags : null,
      items: bundleItems,
      discountPercent: parseInt(form.discountPercent) || 0,
      price: form.price || null,
      comparePrice: form.comparePrice || null,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleGoalTag = (tag: string) => {
    setSelectedGoalTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleProductInBundle = (productId: number) => {
    setBundleItems((prev) => {
      const exists = prev.find((item) => item.productId === productId);
      if (exists) {
        return prev.filter((item) => item.productId !== productId);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateItemQuantity = (productId: number, quantity: number) => {
    setBundleItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const getProductName = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || `Ürün #${productId}`;
  };

  return (
    <div data-testid="admin-bundles">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Paket Yönetimi ({bundles.length})</h3>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) resetForm();
            else setEditingId(null);
          }}
          data-testid="button-toggle-bundle-form"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni Paket
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">
              {editingId ? "Paket Düzenle" : "Yeni Paket Ekle"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Temel Bilgiler</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-name" className="text-xs text-muted-foreground">
                    Paket Adı
                  </Label>
                  <Input
                    id="bundle-name"
                    placeholder="Paket adı"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        name: e.target.value,
                        slug: editingId ? p.slug : generateSlug(e.target.value),
                      }))
                    }
                    data-testid="input-bundle-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-slug" className="text-xs text-muted-foreground">
                    Slug
                  </Label>
                  <Input
                    id="bundle-slug"
                    placeholder="paket-slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    data-testid="input-bundle-slug"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-sort" className="text-xs text-muted-foreground">
                    Sıralama
                  </Label>
                  <Input
                    id="bundle-sort"
                    placeholder="0"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                    data-testid="input-bundle-sort-order"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                  <Label htmlFor="bundle-description" className="text-xs text-muted-foreground">
                    Açıklama
                  </Label>
                  <Textarea
                    id="bundle-description"
                    placeholder="Paket açıklaması..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="min-h-[80px] resize-y"
                    data-testid="textarea-bundle-description"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Görsel</h4>
              </div>
              <Separator className="mb-4" />
              <div className="flex items-center gap-3">
                {form.image && (
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                    <img
                      src={form.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                <Input
                  placeholder="Görsel URL"
                  value={form.image}
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                  className="flex-1"
                  data-testid="input-bundle-image"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Fiyatlandırma</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-discount" className="text-xs text-muted-foreground">
                    İndirim Yüzdesi (%)
                  </Label>
                  <Input
                    id="bundle-discount"
                    placeholder="10"
                    type="number"
                    value={form.discountPercent}
                    onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))}
                    data-testid="input-bundle-discount"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-price" className="text-xs text-muted-foreground">
                    Fiyat
                  </Label>
                  <Input
                    id="bundle-price"
                    placeholder="Fiyat"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    data-testid="input-bundle-price"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bundle-compare-price" className="text-xs text-muted-foreground">
                    Karşılaştırma Fiyatı
                  </Label>
                  <Input
                    id="bundle-compare-price"
                    placeholder="Karşılaştırma fiyatı"
                    type="number"
                    value={form.comparePrice}
                    onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))}
                    data-testid="input-bundle-compare-price"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Hedef Etiketleri</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GOAL_TAGS.map((tag) => (
                  <div key={tag.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`goal-${tag.value}`}
                      checked={selectedGoalTags.includes(tag.value)}
                      onCheckedChange={() => toggleGoalTag(tag.value)}
                      data-testid={`checkbox-goal-${tag.value}`}
                    />
                    <Label htmlFor={`goal-${tag.value}`} className="text-sm cursor-pointer">
                      {tag.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Ürün Seçimi ({bundleItems.length} ürün)</h4>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {products.map((product) => {
                  const bundleItem = bundleItems.find((item) => item.productId === product.id);
                  const isSelected = !!bundleItem;
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-md border ${
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      data-testid={`bundle-product-${product.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProductInBundle(product.id)}
                        data-testid={`checkbox-bundle-product-${product.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(product.price)} · Stok: {product.stock ?? 0}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Adet:</Label>
                          <Input
                            type="number"
                            min={1}
                            value={bundleItem.quantity}
                            onChange={(e) =>
                              updateItemQuantity(product.id, parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                            data-testid={`input-bundle-product-qty-${product.id}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Henüz ürün bulunmuyor.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Separator className="mb-4" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bundle-active"
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((p) => ({ ...p, isActive: checked === true }))
                    }
                    data-testid="checkbox-bundle-active"
                  />
                  <Label htmlFor="bundle-active" className="text-sm cursor-pointer">
                    Aktif
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleSave}
                disabled={
                  !form.name || !form.slug || bundleItems.length === 0 ||
                  createMutation.isPending || updateMutation.isPending
                }
                data-testid="button-save-bundle"
              >
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Güncelle" : "Ekle"}
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-bundle">
                <X className="w-4 h-4 mr-2" /> İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bundles.map((bundle) => {
          const items = Array.isArray(bundle.items) ? (bundle.items as BundleItem[]) : [];
          return (
            <Card key={bundle.id} data-testid={`card-bundle-${bundle.id}`}>
              <CardContent className="p-4 space-y-3">
                {bundle.image && (
                  <div className="w-full h-32 rounded-md overflow-hidden bg-muted">
                    <img
                      src={bundle.image}
                      alt={bundle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" data-testid={`text-bundle-name-${bundle.id}`}>
                      {bundle.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{bundle.slug}</p>
                  </div>
                  <Badge
                    variant={bundle.isActive ? "default" : "secondary"}
                    className="flex-shrink-0"
                    data-testid={`badge-bundle-status-${bundle.id}`}
                  >
                    {bundle.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>

                {bundle.goalTags && bundle.goalTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bundle.goalTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {goalLabelMap[tag] || tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs text-muted-foreground" data-testid={`text-bundle-products-${bundle.id}`}>
                    {items.length} ürün
                  </div>
                  {bundle.discountPercent != null && bundle.discountPercent > 0 && (
                    <Badge variant="secondary" className="text-xs" data-testid={`badge-bundle-discount-${bundle.id}`}>
                      %{bundle.discountPercent} indirim
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {bundle.price && (
                    <span className="text-sm font-semibold" data-testid={`text-bundle-price-${bundle.id}`}>
                      {formatPrice(bundle.price)}
                    </span>
                  )}
                  {bundle.comparePrice && (
                    <span className="text-xs text-muted-foreground line-through" data-testid={`text-bundle-compare-price-${bundle.id}`}>
                      {formatPrice(bundle.comparePrice)}
                    </span>
                  )}
                </div>

                <Separator />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(bundle)}
                    data-testid={`button-edit-bundle-${bundle.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(bundle.id)}
                    data-testid={`button-delete-bundle-${bundle.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {bundles.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Henüz paket bulunmuyor.</p>
          <p className="text-xs mt-1">Yeni bir paket eklemek için yukarıdaki butonu kullanın.</p>
        </div>
      )}
    </div>
  );
}
