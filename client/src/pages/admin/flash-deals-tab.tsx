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
import { Plus, Trash2, Edit, Save, X, Zap, Loader2 } from "lucide-react";

interface FlashDeal {
  id: number;
  title: string;
  description?: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

function getDealStatus(deal: FlashDeal): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const now = new Date();
  const start = new Date(deal.startDate);
  const end = new Date(deal.endDate);
  if (!deal.isActive) return { label: "Pasif", variant: "secondary" };
  if (now < start) return { label: "Yakinda", variant: "outline" };
  if (now > end) return { label: "Suresi Dolmus", variant: "destructive" };
  return { label: "Aktif", variant: "default" };
}

export function FlashDealsTab() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const { data: deals = [], isLoading } = useQuery<FlashDeal[]>({
    queryKey: ["/api/admin/flash-deals"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/flash-deals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flash-deals"] });
      resetForm();
      toast({ title: "Flash firsat olusturuldu" });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/admin/flash-deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flash-deals"] });
      resetForm();
      toast({ title: "Flash firsat guncellendi" });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/flash-deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flash-deals"] });
      toast({ title: "Flash firsat silindi" });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      startDate: "",
      endDate: "",
      isActive: true,
    });
  };

  const startEdit = (deal: FlashDeal) => {
    setEditingId(deal.id);
    setShowForm(true);
    setForm({
      title: deal.title,
      description: deal.description || "",
      discountType: deal.discountType,
      discountValue: String(deal.discountValue),
      startDate: deal.startDate ? new Date(deal.startDate).toISOString().split("T")[0] : "",
      endDate: deal.endDate ? new Date(deal.endDate).toISOString().split("T")[0] : "",
      isActive: deal.isActive,
    });
  };

  const handleSave = () => {
    const payload: any = {
      title: form.title,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue) || 0,
      isActive: form.isActive,
    };
    if (form.description) payload.description = form.description;
    if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
    if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div data-testid="admin-flash-deals">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Flash Firsatlar ({deals.length})
        </h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-flash-deal-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Flash Firsat
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">{editingId ? "Flash Firsat Duzenle" : "Yeni Flash Firsat Olustur"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input
                placeholder="Baslik"
                value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                data-testid="input-flash-deal-title"
              />
              <Select value={form.discountType} onValueChange={(v) => setForm(p => ({ ...p, discountType: v }))}>
                <SelectTrigger data-testid="select-flash-deal-discount-type">
                  <SelectValue placeholder="Indirim Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yuzde (%)</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar (TL)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Indirim Degeri"
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))}
                data-testid="input-flash-deal-discount-value"
              />
              <Input
                placeholder="Baslangic Tarihi"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))}
                data-testid="input-flash-deal-start-date"
              />
              <Input
                placeholder="Bitis Tarihi"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))}
                data-testid="input-flash-deal-end-date"
              />
            </div>
            <div className="mt-3">
              <Textarea
                placeholder="Aciklama"
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                className="resize-none"
                rows={3}
                data-testid="input-flash-deal-description"
              />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                  data-testid="checkbox-flash-deal-active"
                />
                Aktif
              </label>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.title || !form.discountValue || isSaving} data-testid="button-save-flash-deal">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Kaydet
              </Button>
              <Button variant="outline" onClick={resetForm} data-testid="button-cancel-flash-deal">
                <X className="w-4 h-4 mr-2" /> Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8" data-testid="loading-flash-deals">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-2">
        {deals.map((deal) => {
          const status = getDealStatus(deal);
          return (
            <div
              key={deal.id}
              className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap"
              data-testid={`admin-flash-deal-${deal.id}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{deal.title}</p>
                    <Badge variant={status.variant} data-testid={`badge-flash-deal-status-${deal.id}`}>
                      {status.label}
                    </Badge>
                  </div>
                  {deal.description && (
                    <p className="text-xs text-muted-foreground mt-1">{deal.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {deal.discountType === "percentage"
                      ? `%${deal.discountValue}`
                      : `${deal.discountValue} TL`} indirim
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deal.startDate
                      ? new Date(deal.startDate).toLocaleDateString("tr-TR")
                      : "-"}
                    {" - "}
                    {deal.endDate
                      ? new Date(deal.endDate).toLocaleDateString("tr-TR")
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(deal)} data-testid={`button-edit-flash-deal-${deal.id}`}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(deal.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-flash-deal-${deal.id}`}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          );
        })}
        {!isLoading && deals.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="text-no-flash-deals">
            Henuz flash firsat olusturulmamis.
          </p>
        )}
      </div>
    </div>
  );
}
