import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import type { Brand } from "@shared/schema";

export default function BrandsTab() {
  const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo: "", description: "", sortOrder: "0" });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/brands", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      resetForm();
      toast({ title: "Marka eklendi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/brands/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      resetForm();
      toast({ title: "Marka guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Marka silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", slug: "", logo: "", description: "", sortOrder: "0" });
  };

  const startEdit = (b: Brand) => {
    setEditingId(b.id);
    setShowForm(true);
    setForm({ name: b.name, slug: b.slug, logo: b.logo || "", description: b.description || "", sortOrder: String(b.sortOrder || 0) });
  };

  const handleSave = () => {
    const payload: any = { name: form.name, slug: form.slug, sortOrder: parseInt(form.sortOrder) || 0 };
    if (form.logo) payload.logo = form.logo;
    if (form.description) payload.description = form.description;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div data-testid="admin-brands">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Marka Yonetimi ({brands.length})</h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-brand-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Marka
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Marka Duzenle" : "Yeni Marka Ekle"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Marka adi" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value, slug: editingId ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} data-testid="input-brand-name" />
              <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} data-testid="input-brand-slug" />
              <Input placeholder="Logo URL" value={form.logo} onChange={(e) => setForm(p => ({ ...p, logo: e.target.value }))} data-testid="input-brand-logo" />
              <Input placeholder="Aciklama" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} data-testid="input-brand-description" />
              <Input placeholder="Siralama" type="number" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: e.target.value }))} data-testid="input-brand-sort" />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.name || !form.slug} data-testid="button-save-brand">
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Ekle"}
              </Button>
              <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" /> Iptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {brands.map((brand) => (
          <div key={brand.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-brand-${brand.id}`}>
            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
              {brand.logo ? <img src={brand.logo} alt="" className="w-full h-full object-contain" /> : <span className="text-xs text-muted-foreground">{brand.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{brand.name}</p>
              <p className="text-xs text-muted-foreground">/{brand.slug} | Sira: {brand.sortOrder}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(brand)} data-testid={`button-edit-brand-${brand.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(brand.id)} data-testid={`button-delete-brand-${brand.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
