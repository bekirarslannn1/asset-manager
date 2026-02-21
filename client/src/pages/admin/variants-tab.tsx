import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Save, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductVariant } from "@shared/schema";

export default function VariantsTab() {
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const productId = selectedProduct ? parseInt(selectedProduct) : null;
  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["/api/products", productId, "variants"],
    enabled: !!productId,
  });
  const [form, setForm] = useState({ flavor: "", weight: "", sku: "", barcode: "", price: "", comparePrice: "", stock: "0" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/variants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
      setForm({ flavor: "", weight: "", sku: "", barcode: "", price: "", comparePrice: "", stock: "0" });
      toast({ title: "Varyant olusturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/variants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
      setEditingId(null);
      toast({ title: "Varyant guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/variants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "variants"] });
      toast({ title: "Varyant silindi" });
    },
  });

  const startEdit = (v: ProductVariant) => {
    setEditingId(v.id);
    setForm({
      flavor: v.flavor || "", weight: v.weight || "", sku: v.sku,
      barcode: v.barcode || "", price: String(v.price),
      comparePrice: v.comparePrice ? String(v.comparePrice) : "",
      stock: String(v.stock ?? 0),
    });
  };

  return (
    <div data-testid="admin-variants">
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Urun Secin</label>
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger data-testid="select-variant-product"><SelectValue placeholder="Urun secin" /></SelectTrigger>
          <SelectContent>
            {products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {productId && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-sm">{editingId ? "Varyant Duzenle" : "Yeni Varyant Ekle"}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Input placeholder="Aroma" value={form.flavor} onChange={(e) => setForm(p => ({ ...p, flavor: e.target.value }))} data-testid="input-variant-flavor" />
                <Input placeholder="Agirlik" value={form.weight} onChange={(e) => setForm(p => ({ ...p, weight: e.target.value }))} data-testid="input-variant-weight" />
                <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))} data-testid="input-variant-sku" />
                <Input placeholder="Barkod" value={form.barcode} onChange={(e) => setForm(p => ({ ...p, barcode: e.target.value }))} data-testid="input-variant-barcode" />
                <Input placeholder="Fiyat" type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} data-testid="input-variant-price" />
                <Input placeholder="Karsilastirma Fiyati" type="number" value={form.comparePrice} onChange={(e) => setForm(p => ({ ...p, comparePrice: e.target.value }))} data-testid="input-variant-compare-price" />
                <Input placeholder="Stok" type="number" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} data-testid="input-variant-stock" />
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button
                  onClick={() => {
                    const payload = { ...form, productId, price: form.price, comparePrice: form.comparePrice || undefined, stock: parseInt(form.stock) || 0 };
                    if (editingId) { updateMutation.mutate({ id: editingId, data: payload }); }
                    else { createMutation.mutate(payload); }
                  }}
                  disabled={!form.sku || !form.price}
                  data-testid="button-save-variant"
                >
                  <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Ekle"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={() => { setEditingId(null); setForm({ flavor: "", weight: "", sku: "", barcode: "", price: "", comparePrice: "", stock: "0" }); }}>
                    <X className="w-4 h-4 mr-2" /> Iptal
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-variant-${v.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{v.flavor || "-"} / {v.weight || "-"}</p>
                  <p className="text-xs text-muted-foreground">SKU: {v.sku} | Barkod: {v.barcode || "-"} | Stok: {v.stock}</p>
                </div>
                <span className="text-sm font-bold">{formatPrice(v.price)}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(v)} data-testid={`button-edit-variant-${v.id}`}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(v.id)} data-testid={`button-delete-variant-${v.id}`}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                </div>
              </div>
            ))}
            {variants.length === 0 && <p className="text-sm text-muted-foreground">Bu urun icin varyant bulunmuyor.</p>}
          </div>
        </>
      )}
    </div>
  );
}
