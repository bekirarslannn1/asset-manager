import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import type { PageLayout } from "@shared/schema";

const BLOCK_TYPES = [
  { type: "hero_slider", label: "Hero Slider", description: "Ana gorsel slider" },
  { type: "categories_grid", label: "Kategoriler", description: "Kategori kartlari" },
  { type: "featured_products", label: "One Cikan Urunler", description: "One cikan urun listesi" },
  { type: "best_sellers", label: "Cok Satanlar", description: "Cok satan urunler" },
  { type: "new_arrivals", label: "Yeni Urunler", description: "Yeni eklenen urunler" },
  { type: "brands_carousel", label: "Markalar", description: "Marka karuseli" },
  { type: "newsletter", label: "Bulten", description: "E-posta kayit formu" },
  { type: "banner_strip", label: "Banner Seridi", description: "Promosyon banneri" },
  { type: "advantages_bar", label: "Avantajlar", description: "Kargo, iade vb. bilgiler" },
  { type: "wizard_promo", label: "Sihirbaz Promo", description: "Supplement sihirbazi tanitimi" },
  { type: "campaigns", label: "Kampanyalar", description: "Aktif kupon kampanyalari" },
];

interface BlockConfig {
  type: string;
  order: number;
  config: Record<string, any>;
  isVisible: boolean;
}

export default function SDUITab() {
  const { data: layouts = [] } = useQuery<PageLayout[]>({ queryKey: ["/api/layouts"] });
  const [form, setForm] = useState({ name: "", slug: "" });
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/layouts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      resetForm();
      toast({ title: "Duzen olusturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/layouts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      resetForm();
      toast({ title: "Duzen guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/layouts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({ title: "Duzen silindi" });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", slug: "" });
    setBlocks([]);
  };

  const startEdit = (layout: PageLayout) => {
    setEditingId(layout.id);
    setForm({ name: layout.name, slug: layout.slug });
    const existingBlocks = Array.isArray(layout.blocks) ? layout.blocks : [];
    setBlocks(existingBlocks.map((b: any, i: number) => ({
      type: b.type || "", order: b.order ?? i, config: b.config || {},
      isVisible: b.isVisible !== false,
    })));
  };

  const addBlock = (type: string) => {
    setBlocks(prev => [...prev, { type, order: prev.length, config: {}, isVisible: true }]);
  };

  const removeBlock = (index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    setBlocks(prev => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr.map((b, i) => ({ ...b, order: i }));
    });
  };

  const toggleVisibility = (index: number) => {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, isVisible: !b.isVisible } : b));
  };

  const handleSave = () => {
    const payload = { name: form.name, slug: form.slug, blocks: blocks.map((b, i) => ({ ...b, order: i })) };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div data-testid="admin-sdui-builder">
      <h3 className="text-lg font-semibold mb-4">SDUI Sayfa Olusturucu</h3>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">{editingId ? "Duzen Duzenle" : "Yeni Duzen Olustur"}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <Input placeholder="Duzen adi (orn: Ana Sayfa)" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value, slug: editingId ? p.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} data-testid="input-layout-name" />
            <Input placeholder="Slug (orn: homepage)" value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} data-testid="input-layout-slug" />
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Blok Ekle:</p>
            <div className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map(bt => (
                <Button key={bt.type} variant="outline" size="sm" onClick={() => addBlock(bt.type)} data-testid={`button-add-block-${bt.type}`}>
                  <Plus className="w-3 h-3 mr-1" /> {bt.label}
                </Button>
              ))}
            </div>
          </div>

          {blocks.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium">Aktif Bloklar ({blocks.length}):</p>
              {blocks.map((block, index) => {
                const info = BLOCK_TYPES.find(bt => bt.type === block.type);
                return (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${block.isVisible ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"}`} data-testid={`block-item-${index}`}>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{info?.label || block.type}</p>
                      <p className="text-xs text-muted-foreground">{info?.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => moveBlock(index, "up")} disabled={index === 0}><ArrowUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => moveBlock(index, "down")} disabled={index === blocks.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleVisibility(index)}>
                        <Badge variant={block.isVisible ? "default" : "secondary"} className="text-[10px] px-1">{block.isVisible ? "Acik" : "Kapali"}</Badge>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeBlock(index)}><Trash2 className="w-3 h-3 text-red-400" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={!form.name || !form.slug} data-testid="button-save-layout">
              <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Olustur"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" /> Iptal</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {layouts.map((layout) => (
          <div key={layout.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-layout-${layout.id}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{layout.name}</p>
              <p className="text-xs text-muted-foreground">/{layout.slug} | {Array.isArray(layout.blocks) ? layout.blocks.length : 0} blok</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(layout)} data-testid={`button-edit-layout-${layout.id}`}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(layout.id)} data-testid={`button-delete-layout-${layout.id}`}><Trash2 className="w-4 h-4 text-red-400" /></Button>
            </div>
          </div>
        ))}
        {layouts.length === 0 && <p className="text-sm text-muted-foreground">Henuz duzen olusturulmamis.</p>}
      </div>
    </div>
  );
}
