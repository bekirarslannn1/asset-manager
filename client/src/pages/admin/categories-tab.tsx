import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, ChevronRight, FolderTree } from "lucide-react";
import type { Category } from "@shared/schema";

export default function CategoriesTab() {
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const [form, setForm] = useState({ name: "", slug: "", description: "", image: "", parentId: "", sortOrder: "0", icon: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      toast({ title: "Kategori eklendi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      toast({ title: "Kategori guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Kategori silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", slug: "", description: "", image: "", parentId: "", sortOrder: "0", icon: "" });
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setShowForm(true);
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description || "",
      image: cat.image || "", parentId: cat.parentId ? String(cat.parentId) : "",
      sortOrder: String(cat.sortOrder || 0), icon: "",
    });
  };

  const handleSave = () => {
    const payload: any = {
      name: form.name, slug: form.slug, description: form.description || undefined,
      image: form.image || undefined, sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (form.parentId) payload.parentId = parseInt(form.parentId);
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const topLevel = categories.filter(c => !c.parentId);
  const getChildren = (parentId: number) => categories.filter(c => c.parentId === parentId);

  const renderCategory = (cat: Category, level: number = 0) => {
    const children = getChildren(cat.id);
    return (
      <div key={cat.id}>
        <div
          className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded-md flex-wrap"
          style={{ marginLeft: `${level * 24}px` }}
          data-testid={`admin-category-${cat.id}`}
        >
          <div className="flex items-center gap-2">
            {level > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                {cat.name}
                {level === 0 && <Badge variant="outline" className="text-[10px]">Ana</Badge>}
                {level === 1 && <Badge variant="outline" className="text-[10px]">Alt</Badge>}
                {level === 2 && <Badge variant="outline" className="text-[10px]">3. Seviye</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">/{cat.slug} | Sira: {cat.sortOrder}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => startEdit(cat)} data-testid={`button-edit-category-${cat.id}`}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cat.id)} data-testid={`button-delete-category-${cat.id}`}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        </div>
        {children.length > 0 && (
          <div className="space-y-2 mt-2">
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div data-testid="admin-categories">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-primary" /> Kategori Hiyerarsisi ({categories.length})
        </h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-category-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Kategori
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Kategori Duzenle" : "Yeni Kategori Ekle"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Kategori adi" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value, slug: editingId ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} data-testid="input-new-category-name" />
              <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} data-testid="input-new-category-slug" />
              <Select value={form.parentId || "none"} onValueChange={(v) => setForm(p => ({ ...p, parentId: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-category-parent"><SelectValue placeholder="Ust Kategori (Opsiyonel)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ana Kategori (Ust Yok)</SelectItem>
                  {categories.filter(c => c.id !== editingId).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.parentId ? `  -- ${c.name}` : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Aciklama" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} data-testid="input-category-description" />
              <Input placeholder="Gorsel URL" value={form.image} onChange={(e) => setForm(p => ({ ...p, image: e.target.value }))} data-testid="input-category-image" />
              <Input placeholder="Siralama (0, 1, 2...)" type="number" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: e.target.value }))} data-testid="input-category-sort" />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={handleSave} disabled={!form.name || !form.slug} data-testid="button-create-category">
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Ekle"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" /> Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {topLevel.map(cat => renderCategory(cat, 0))}
        {categories.length === 0 && <p className="text-sm text-muted-foreground">Henuz kategori eklenmemis.</p>}
      </div>
    </div>
  );
}
