import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, Megaphone } from "lucide-react";
import type { Campaign } from "@shared/schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CampaignsTab() {
  const { data: campaigns = [] } = useQuery<Campaign[]>({ queryKey: ["/api/admin/campaigns"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", image: "",
    discountType: "percentage", discountValue: "", minOrderAmount: "",
    startDate: "", endDate: "", isActive: true, sortOrder: "0",
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      resetForm();
      toast({ title: "Kampanya olusturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/campaigns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      resetForm();
      toast({ title: "Kampanya guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Kampanya silindi" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/campaigns/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Kampanya durumu guncellendi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "", slug: "", description: "", image: "",
      discountType: "percentage", discountValue: "", minOrderAmount: "",
      startDate: "", endDate: "", isActive: true, sortOrder: "0",
    });
  };

  const startEdit = (c: Campaign) => {
    setEditingId(c.id);
    setShowForm(true);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      image: c.image || "",
      discountType: c.discountType || "percentage",
      discountValue: c.discountValue ? String(c.discountValue) : "",
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      startDate: c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
      isActive: c.isActive ?? true,
      sortOrder: String(c.sortOrder || 0),
    });
  };

  const handleNameChange = (value: string) => {
    setForm(p => ({ ...p, name: value, slug: generateSlug(value) }));
  };

  const handleSave = () => {
    const payload: any = {
      name: form.name,
      slug: form.slug,
      discountType: form.discountType,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (form.description) payload.description = form.description;
    if (form.image) payload.image = form.image;
    if (form.discountValue) payload.discountValue = form.discountValue;
    if (form.minOrderAmount) payload.minOrderAmount = form.minOrderAmount;
    if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
    if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div data-testid="admin-campaigns">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" /> Kampanyalar ({campaigns.length})
        </h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-campaign-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Kampanya
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Kampanya Duzenle" : "Yeni Kampanya Olustur"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Kampanya Adi" value={form.name} onChange={(e) => handleNameChange(e.target.value)} data-testid="input-campaign-name" />
              <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} data-testid="input-campaign-slug" />
              <Input placeholder="Gorsel URL" value={form.image} onChange={(e) => setForm(p => ({ ...p, image: e.target.value }))} data-testid="input-campaign-image" />
              <Select value={form.discountType} onValueChange={(v) => setForm(p => ({ ...p, discountType: v }))}>
                <SelectTrigger data-testid="select-campaign-discount-type"><SelectValue placeholder="Indirim Tipi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yuzde (%)</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar (TL)</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Indirim Degeri" type="number" value={form.discountValue} onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))} data-testid="input-campaign-discount-value" />
              <Input placeholder="Min. Siparis Tutari (TL)" type="number" value={form.minOrderAmount} onChange={(e) => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} data-testid="input-campaign-min-order" />
              <Input placeholder="Baslangic Tarihi" type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} data-testid="input-campaign-start-date" />
              <Input placeholder="Bitis Tarihi" type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} data-testid="input-campaign-end-date" />
              <Input placeholder="Siralama" type="number" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: e.target.value }))} data-testid="input-campaign-sort-order" />
            </div>
            <div className="mt-3">
              <Textarea placeholder="Aciklama" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="resize-none" rows={3} data-testid="input-campaign-description" />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" data-testid="checkbox-campaign-active" />
                Aktif
              </label>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.name || !form.slug} data-testid="button-save-campaign">
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-campaign">
                <X className="w-4 h-4 mr-2" /> Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-campaign-${campaign.id}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {campaign.image && (
                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img src={campaign.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{campaign.name}</p>
                  <Badge
                    variant={campaign.isActive ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleActiveMutation.mutate({ id: campaign.id, isActive: !campaign.isActive })}
                    data-testid={`badge-campaign-status-${campaign.id}`}
                  >
                    {campaign.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {campaign.discountType === "percentage"
                    ? `%${campaign.discountValue}`
                    : `${campaign.discountValue} TL`} indirim
                  {campaign.minOrderAmount ? ` | Min: ${campaign.minOrderAmount} TL` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {campaign.startDate
                    ? new Date(campaign.startDate).toLocaleDateString("tr-TR")
                    : "-"}
                  {" - "}
                  {campaign.endDate
                    ? new Date(campaign.endDate).toLocaleDateString("tr-TR")
                    : "-"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(campaign)} data-testid={`button-edit-campaign-${campaign.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(campaign.id)} data-testid={`button-delete-campaign-${campaign.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && <p className="text-sm text-muted-foreground" data-testid="text-no-campaigns">Henuz kampanya olusturulmamis.</p>}
      </div>
    </div>
  );
}
