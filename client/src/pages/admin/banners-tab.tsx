import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import type { Banner } from "@shared/schema";

export default function BannersTab() {
  const { data: banners = [] } = useQuery<Banner[]>({ queryKey: ["/api/banners"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", image: "", link: "", type: "hero", sortOrder: "0" });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/banners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      resetForm();
      toast({ title: "Banner eklendi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/banners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      resetForm();
      toast({ title: "Banner guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: "Banner silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", subtitle: "", image: "", link: "", type: "hero", sortOrder: "0" });
  };

  const startEdit = (b: Banner) => {
    setEditingId(b.id);
    setShowForm(true);
    setForm({ title: b.title, subtitle: b.subtitle || "", image: b.image, link: b.link || "", type: b.type || "hero", sortOrder: String(b.sortOrder || 0) });
  };

  const handleSave = () => {
    const payload: any = { title: form.title, image: form.image, type: form.type, sortOrder: parseInt(form.sortOrder) || 0 };
    if (form.subtitle) payload.subtitle = form.subtitle;
    if (form.link) payload.link = form.link;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div data-testid="admin-banners">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Banner Yonetimi ({banners.length})</h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-banner-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Banner
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Banner Duzenle" : "Yeni Banner Ekle"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Baslik" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} data-testid="input-banner-title" />
              <Input placeholder="Alt baslik" value={form.subtitle} onChange={(e) => setForm(p => ({ ...p, subtitle: e.target.value }))} data-testid="input-banner-subtitle" />
              <Input placeholder="Gorsel URL" value={form.image} onChange={(e) => setForm(p => ({ ...p, image: e.target.value }))} data-testid="input-banner-image" />
              <Input placeholder="Link" value={form.link} onChange={(e) => setForm(p => ({ ...p, link: e.target.value }))} data-testid="input-banner-link" />
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger data-testid="select-banner-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="promo">Promosyon</SelectItem>
                  <SelectItem value="category">Kategori</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Siralama" type="number" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: e.target.value }))} data-testid="input-banner-sort" />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.title || !form.image} data-testid="button-save-banner">
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Ekle"}
              </Button>
              <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" /> Iptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center gap-4 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-banner-${banner.id}`}>
            <div className="w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {banner.image && <img src={banner.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{banner.title}</p>
              {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(banner)} data-testid={`button-edit-banner-${banner.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(banner.id)} data-testid={`button-delete-banner-${banner.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
