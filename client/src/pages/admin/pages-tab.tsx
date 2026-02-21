import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Save, X } from "lucide-react";
import type { Page } from "@shared/schema";

export default function PagesTab() {
  const { data: pages = [] } = useQuery<Page[]>({ queryKey: ["/api/pages"] });
  const [editing, setEditing] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", slug: "", content: "" });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/pages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setShowNew(false);
      setNewForm({ title: "", slug: "", content: "" });
      toast({ title: "Sayfa olusturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      apiRequest("PATCH", `/api/admin/pages/${id}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setEditing(null);
      toast({ title: "Sayfa guncellendi" });
    },
  });

  return (
    <div data-testid="admin-pages">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Sayfa Yonetimi ({pages.length})</h3>
        <Button onClick={() => setShowNew(!showNew)} data-testid="button-toggle-page-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Sayfa
        </Button>
      </div>

      {showNew && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">Yeni Sayfa Olustur</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Input placeholder="Sayfa basligi" value={newForm.title} onChange={(e) => setNewForm(p => ({ ...p, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") }))} data-testid="input-new-page-title" />
              <Input placeholder="Slug" value={newForm.slug} onChange={(e) => setNewForm(p => ({ ...p, slug: e.target.value }))} data-testid="input-new-page-slug" />
            </div>
            <textarea placeholder="Sayfa icerigi (HTML)" value={newForm.content} onChange={(e) => setNewForm(p => ({ ...p, content: e.target.value }))} className="w-full h-40 p-3 bg-muted border border-border rounded-md text-sm font-mono resize-y" data-testid="textarea-new-page-content" />
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button onClick={() => createMutation.mutate(newForm)} disabled={!newForm.title || !newForm.slug} data-testid="button-create-page">
                <Save className="w-4 h-4 mr-2" /> Olustur
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}><X className="w-4 h-4 mr-2" /> Iptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {pages.map((page) => (
          <Card key={page.id} data-testid={`admin-page-${page.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div>
                  <h3 className="font-medium text-sm">{page.title}</h3>
                  <p className="text-xs text-muted-foreground">/{page.slug}</p>
                </div>
                {editing === page.id ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: page.id, content: editContent })} data-testid={`button-save-page-${page.id}`}>
                      <Save className="w-4 h-4 mr-1" /> Kaydet
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => { setEditing(page.id); setEditContent(page.content || ""); }} data-testid={`button-edit-page-${page.id}`}>
                    <Edit className="w-4 h-4 mr-1" /> Duzenle
                  </Button>
                )}
              </div>
              {editing === page.id && (
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-40 p-3 bg-muted border border-border rounded-md text-sm font-mono resize-y mt-2" data-testid={`textarea-page-content-${page.id}`} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
