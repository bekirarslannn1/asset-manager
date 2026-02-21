import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, Ticket } from "lucide-react";
import type { Coupon } from "@shared/schema";

export default function CouponsTab() {
  const { data: coupons = [] } = useQuery<Coupon[]>({ queryKey: ["/api/admin/coupons"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "", discountType: "percentage", discountValue: "", minOrderAmount: "",
    usageLimit: "", expiresAt: "", isActive: true,
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/coupons", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      resetForm();
      toast({ title: "Kupon olusturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      resetForm();
      toast({ title: "Kupon guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Kupon silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ code: "", discountType: "percentage", discountValue: "", minOrderAmount: "", usageLimit: "", expiresAt: "", isActive: true });
  };

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setShowForm(true);
    setForm({
      code: c.code, discountType: c.discountType, discountValue: String(c.discountValue),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : "",
      isActive: c.isActive ?? true,
    });
  };

  const handleSave = () => {
    const payload: any = {
      code: form.code.toUpperCase(), discountType: form.discountType,
      discountValue: form.discountValue, isActive: form.isActive,
    };
    if (form.minOrderAmount) payload.minOrderAmount = form.minOrderAmount;
    if (form.usageLimit) payload.usageLimit = parseInt(form.usageLimit);
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div data-testid="admin-coupons">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" /> Kupon Yonetimi ({coupons.length})
        </h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-coupon-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Kupon
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Kupon Duzenle" : "Yeni Kupon Olustur"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Kupon kodu (orn: YAZ25)" value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} data-testid="input-coupon-code" />
              <Select value={form.discountType} onValueChange={(v) => setForm(p => ({ ...p, discountType: v }))}>
                <SelectTrigger data-testid="select-coupon-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Yuzde (%)</SelectItem>
                  <SelectItem value="fixed">Sabit Tutar (TL)</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Indirim degeri" type="number" value={form.discountValue} onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))} data-testid="input-coupon-value" />
              <Input placeholder="Min. siparis tutari (TL)" type="number" value={form.minOrderAmount} onChange={(e) => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} data-testid="input-coupon-min-order" />
              <Input placeholder="Kullanim limiti" type="number" value={form.usageLimit} onChange={(e) => setForm(p => ({ ...p, usageLimit: e.target.value }))} data-testid="input-coupon-limit" />
              <Input placeholder="Son gecerlilik" type="date" value={form.expiresAt} onChange={(e) => setForm(p => ({ ...p, expiresAt: e.target.value }))} data-testid="input-coupon-expires" />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                Aktif
              </label>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.code || !form.discountValue} data-testid="button-save-coupon">
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Olustur"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" /> Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-coupon-${coupon.id}`}>
            <div className="flex items-center gap-3">
              <Badge variant={coupon.isActive ? "default" : "secondary"} className="font-mono text-sm">
                {coupon.code}
              </Badge>
              <div>
                <p className="text-sm">
                  {coupon.discountType === "percentage" ? `%${coupon.discountValue}` : `${coupon.discountValue} TL`} indirim
                </p>
                <p className="text-xs text-muted-foreground">
                  Min: {coupon.minOrderAmount ? `${coupon.minOrderAmount} TL` : "-"} |
                  Kullanildi: {coupon.usedCount || 0}/{coupon.usageLimit || "Sinirsiz"} |
                  {coupon.expiresAt ? ` Son: ${new Date(coupon.expiresAt).toLocaleDateString("tr-TR")}` : " Suresiz"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(coupon)} data-testid={`button-edit-coupon-${coupon.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(coupon.id)} data-testid={`button-delete-coupon-${coupon.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-sm text-muted-foreground">Henuz kupon olusturulmamis.</p>}
      </div>
    </div>
  );
}
