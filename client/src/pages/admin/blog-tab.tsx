import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, FileText, Tag, MessageCircle, Eye, Clock, Check, XCircle } from "lucide-react";
import type { BlogPost, BlogCategory, BlogComment } from "@shared/schema";

const generateSlug = (name: string) =>
  name.toLowerCase()
    .replace(/ç/g, "c").replace(/ş/g, "s").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function PostsSection() {
  const { toast } = useToast();
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({ queryKey: ["/api/admin/blog/posts"] });
  const { data: categories = [] } = useQuery<BlogCategory[]>({ queryKey: ["/api/admin/blog/categories"] });
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", coverImage: "",
    categoryId: null as number | null, authorName: "", authorAvatar: "",
    tags: "" , isPublished: false, isFeatured: false,
    publishedAt: null as string | null,
  });

  const resetForm = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", coverImage: "", categoryId: null, authorName: "", authorAvatar: "", tags: "", isPublished: false, isFeatured: false, publishedAt: null });
    setEditing(null);
    setCreating(false);
  };

  const startEdit = (p: BlogPost) => {
    setEditing(p);
    setCreating(false);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt || "", content: p.content,
      coverImage: p.coverImage || "", categoryId: p.categoryId, authorName: p.authorName,
      authorAvatar: p.authorAvatar || "", tags: (p.tags || []).join(", "),
      isPublished: p.isPublished ?? false, isFeatured: p.isFeatured ?? false,
      publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 16) : null,
    });
  };

  const startCreate = () => {
    resetForm();
    setCreating(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        publishedAt: form.publishedAt ? new Date(form.publishedAt) : (form.isPublished ? new Date() : null),
      };
      if (editing) {
        await apiRequest("PUT", `/api/admin/blog/posts/${editing.id}`, body);
      } else {
        await apiRequest("POST", "/api/admin/blog/posts", body);
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Yazı güncellendi" : "Yazı oluşturuldu" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Hata", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/admin/blog/posts/${id}`); },
    onSuccess: () => {
      toast({ title: "Yazı silindi" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
    },
  });

  if (creating || editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editing ? "Yazı Düzenle" : "Yeni Yazı"}</span>
            <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Başlık *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value, slug: editing ? f.slug : generateSlug(e.target.value) }))} data-testid="input-blog-post-title" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} data-testid="input-blog-post-slug" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Yazar Adı *</Label>
              <Input value={form.authorName} onChange={(e) => setForm(f => ({ ...f, authorName: e.target.value }))} data-testid="input-blog-post-author" />
            </div>
            <div>
              <Label>Yazar Avatar URL</Label>
              <Input value={form.authorAvatar} onChange={(e) => setForm(f => ({ ...f, authorAvatar: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kategori</Label>
              <Select value={form.categoryId ? String(form.categoryId) : "none"} onValueChange={(v) => setForm(f => ({ ...f, categoryId: v === "none" ? null : Number(v) }))}>
                <SelectTrigger data-testid="select-blog-post-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kategori Yok</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kapak Görseli URL</Label>
              <Input value={form.coverImage} onChange={(e) => setForm(f => ({ ...f, coverImage: e.target.value }))} data-testid="input-blog-post-cover" />
            </div>
          </div>
          <div>
            <Label>Özet</Label>
            <Textarea value={form.excerpt} onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} data-testid="input-blog-post-excerpt" />
          </div>
          <div>
            <Label>İçerik (HTML destekli) *</Label>
            <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={12} className="font-mono text-sm" data-testid="input-blog-post-content" />
          </div>
          <div>
            <Label>Etiketler (virgülle ayırın)</Label>
            <Input value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="protein, beslenme, supplement" data-testid="input-blog-post-tags" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Yayın Tarihi</Label>
              <Input type="datetime-local" value={form.publishedAt || ""} onChange={(e) => setForm(f => ({ ...f, publishedAt: e.target.value || null }))} data-testid="input-blog-post-date" />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm(f => ({ ...f, isPublished: v }))} data-testid="switch-blog-post-published" />
              <Label>Yayınla</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm(f => ({ ...f, isFeatured: v }))} data-testid="switch-blog-post-featured" />
              <Label>Öne Çıkar</Label>
            </div>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button className="neon-glow" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.content || !form.authorName} data-testid="button-save-blog-post">
              <Save className="h-4 w-4 mr-2" /> {saveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button variant="outline" onClick={resetForm}>İptal</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Blog Yazıları ({posts.length})</h3>
        <Button onClick={startCreate} data-testid="button-new-blog-post"><Plus className="h-4 w-4 mr-2" /> Yeni Yazı</Button>
      </div>
      {isLoading ? <p className="text-muted-foreground">Yükleniyor...</p> : posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Henüz blog yazısı yok.</p>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <Card key={p.id} data-testid={`card-admin-blog-post-${p.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold truncate">{p.title}</h4>
                      {p.isPublished ? <Badge variant="default" className="text-xs">Yayında</Badge> : <Badge variant="secondary" className="text-xs">Taslak</Badge>}
                      {p.isFeatured && <Badge variant="outline" className="text-xs">Öne Çıkan</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">{p.excerpt || p.content?.substring(0, 100)}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {p.authorName}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readingTime} dk</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.viewCount}</span>
                      {p.tags?.length ? <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {p.tags.slice(0, 3).join(", ")}</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(p)} data-testid={`button-edit-blog-post-${p.id}`}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-blog-post-${p.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesSection() {
  const { toast } = useToast();
  const { data: categories = [] } = useQuery<BlogCategory[]>({ queryKey: ["/api/admin/blog/categories"] });
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: 0, isActive: true });

  const resetForm = () => { setForm({ name: "", slug: "", description: "", sortOrder: 0, isActive: true }); setEditing(null); };

  const startEdit = (c: BlogCategory) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || "", sortOrder: c.sortOrder ?? 0, isActive: c.isActive ?? true });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await apiRequest("PUT", `/api/admin/blog/categories/${editing.id}`, form);
      } else {
        await apiRequest("POST", "/api/admin/blog/categories", form);
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Kategori güncellendi" : "Kategori oluşturuldu" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/categories"] });
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Hata", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/admin/blog/categories/${id}`); },
    onSuccess: () => {
      toast({ title: "Kategori silindi" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/categories"] });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{editing ? "Kategori Düzenle" : "Yeni Kategori"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Ad *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : generateSlug(e.target.value) }))} data-testid="input-blog-cat-name" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} data-testid="input-blog-cat-slug" />
            </div>
            <div>
              <Label>Sıra</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label>Açıklama</Label>
            <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm(f => ({ ...f, isActive: v }))} />
            <Label>Aktif</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name} data-testid="button-save-blog-cat">
              <Save className="h-4 w-4 mr-2" /> Kaydet
            </Button>
            {editing && <Button variant="outline" onClick={resetForm}>İptal</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {categories.map(c => (
          <Card key={c.id} data-testid={`card-admin-blog-cat-${c.id}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium">{c.name}</span>
                <Badge variant="outline" className="text-xs">{c.slug}</Badge>
                {!c.isActive && <Badge variant="secondary" className="text-xs">Pasif</Badge>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(c)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CommentsSection() {
  const { toast } = useToast();
  const { data: comments = [] } = useQuery<BlogComment[]>({ queryKey: ["/api/admin/blog/comments"] });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      await apiRequest("PUT", `/api/admin/blog/comments/${id}`, { isApproved: approved });
    },
    onSuccess: () => {
      toast({ title: "Yorum güncellendi" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/comments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/admin/blog/comments/${id}`); },
    onSuccess: () => {
      toast({ title: "Yorum silindi" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/comments"] });
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold">Yorumlar ({comments.length})</h3>
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Henüz yorum yok.</p>
      ) : (
        comments.map(c => (
          <Card key={c.id} data-testid={`card-admin-blog-comment-${c.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                    {c.isApproved ? (
                      <Badge variant="default" className="text-xs">Onaylı</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Bekliyor</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{c.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">Yazı #{c.postId} • {new Date(c.createdAt).toLocaleDateString("tr-TR")}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!c.isApproved && (
                    <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate({ id: c.id, approved: true })} data-testid={`button-approve-comment-${c.id}`}>
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  {c.isApproved && (
                    <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate({ id: c.id, approved: false })} data-testid={`button-unapprove-comment-${c.id}`}>
                      <XCircle className="h-4 w-4 text-yellow-500" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)} data-testid={`button-delete-comment-${c.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

export default function BlogTab() {
  return (
    <div data-testid="admin-blog-tab">
      <Tabs defaultValue="posts">
        <TabsList className="mb-4">
          <TabsTrigger value="posts" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Yazılar</TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5"><Tag className="w-3.5 h-3.5" /> Kategoriler</TabsTrigger>
          <TabsTrigger value="comments" className="gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Yorumlar</TabsTrigger>
        </TabsList>
        <TabsContent value="posts"><PostsSection /></TabsContent>
        <TabsContent value="categories"><CategoriesSection /></TabsContent>
        <TabsContent value="comments"><CommentsSection /></TabsContent>
      </Tabs>
    </div>
  );
}
