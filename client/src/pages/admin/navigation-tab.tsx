import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, Navigation } from "lucide-react";
import type { NavigationLink } from "@shared/schema";

export default function NavigationTab() {
  const { data: links = [] } = useQuery<NavigationLink[]>({ queryKey: ["/api/navigation"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ label: "", url: "", position: "header", sortOrder: "0", parentId: "", isActive: true });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/navigation", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/navigation"] });
      resetForm();
      toast({ title: "Link eklendi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/navigation/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/navigation"] });
      resetForm();
      toast({ title: "Link guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/navigation/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/navigation"] });
      toast({ title: "Link silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ label: "", url: "", position: "header", sortOrder: "0", parentId: "", isActive: true });
  };

  const startEdit = (link: NavigationLink) => {
    setEditingId(link.id);
    setShowForm(true);
    setForm({
      label: link.label, url: link.url, position: link.position,
      sortOrder: String(link.sortOrder || 0), parentId: link.parentId ? String(link.parentId) : "",
      isActive: link.isActive ?? true,
    });
  };

  const handleSave = () => {
    const payload: any = {
      label: form.label, url: form.url, position: form.position,
      sortOrder: parseInt(form.sortOrder) || 0, isActive: form.isActive,
    };
    if (form.parentId) payload.parentId = parseInt(form.parentId);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const headerLinks = links.filter(l => l.position === "header");
  const footerLinks = links.filter(l => l.position === "footer");

  const renderLinkGroup = (groupLinks: NavigationLink[], title: string) => (
    <Card className="mb-4">
      <CardHeader><CardTitle className="text-sm">{title} ({groupLinks.length})</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {groupLinks.map((link) => (
          <div key={link.id} className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg flex-wrap" data-testid={`nav-link-${link.id}`}>
            <div className="flex items-center gap-2">
              <Badge variant={link.isActive ? "default" : "secondary"} className="text-xs">{link.isActive ? "Aktif" : "Pasif"}</Badge>
              <div>
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.url} | Sira: {link.sortOrder}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(link)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(link.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
            </div>
          </div>
        ))}
        {groupLinks.length === 0 && <p className="text-sm text-muted-foreground">Henuz link eklenmemis.</p>}
      </CardContent>
    </Card>
  );

  return (
    <div data-testid="admin-navigation">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" /> Menu Yonetimi
        </h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-nav-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Link
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Link Duzenle" : "Yeni Link Ekle"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Link metni" value={form.label} onChange={(e) => setForm(p => ({ ...p, label: e.target.value }))} data-testid="input-nav-label" />
              <Input placeholder="URL (orn: /urunler)" value={form.url} onChange={(e) => setForm(p => ({ ...p, url: e.target.value }))} data-testid="input-nav-url" />
              <Select value={form.position} onValueChange={(v) => setForm(p => ({ ...p, position: v }))}>
                <SelectTrigger data-testid="select-nav-position"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header (Ust Menu)</SelectItem>
                  <SelectItem value="footer">Footer (Alt Menu)</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Siralama" type="number" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: e.target.value }))} data-testid="input-nav-sort" />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                Aktif
              </label>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.label || !form.url} data-testid="button-save-nav">
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Ekle"}
              </Button>
              <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" /> Iptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {renderLinkGroup(headerLinks, "Header Menuleri")}
      {renderLinkGroup(footerLinks, "Footer Menuleri")}
    </div>
  );
}
