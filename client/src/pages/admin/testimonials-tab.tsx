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
import { MessageSquareQuote, Star, Plus, Edit, Trash2, Save, X, User } from "lucide-react";
import type { Testimonial, InsertTestimonial } from "@shared/schema";

export default function TestimonialsTab() {
  const { data: testimonials = [] } = useQuery<Testimonial[]>({ queryKey: ["/api/admin/testimonials"] });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    title: "",
    comment: "",
    photo: "",
    rating: "5",
    sortOrder: "0",
    isActive: true,
  });
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: InsertTestimonial) => apiRequest("POST", "/api/admin/testimonials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      resetForm();
      toast({ title: "Tesimonya eklendi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertTestimonial }) =>
      apiRequest("PATCH", `/api/admin/testimonials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      resetForm();
      toast({ title: "Tesimonya guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Tesimonya silindi" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      title: "",
      comment: "",
      photo: "",
      rating: "5",
      sortOrder: "0",
      isActive: true,
    });
  };

  const startEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setShowForm(true);
    setForm({
      name: testimonial.name,
      title: testimonial.title || "",
      comment: testimonial.comment,
      photo: testimonial.photo || "",
      rating: String(testimonial.rating || 5),
      sortOrder: String(testimonial.sortOrder || 0),
      isActive: testimonial.isActive ?? true,
    });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.comment.trim()) {
      toast({ title: "Uyari", description: "Müşteri Adı ve Yorum zorunludur" });
      return;
    }

    const payload: InsertTestimonial = {
      name: form.name,
      title: form.title || null,
      comment: form.comment,
      photo: form.photo || null,
      rating: parseInt(form.rating) || 5,
      sortOrder: parseInt(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );

  return (
    <div data-testid="admin-testimonials">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-primary" /> Tesimonya Yonetimi
        </h3>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
          data-testid="button-toggle-testimonial-form"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni Tesimonya
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">
              {editingId ? "Tesimonya Duzenle" : "Yeni Tesimonya Ekle"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Müşteri Adı"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  data-testid="input-testimonial-name"
                />
                <Input
                  placeholder="Ünvan/Meslek (isteğe bağlı)"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  data-testid="input-testimonial-title"
                />
              </div>

              <Textarea
                placeholder="Yorum"
                value={form.comment}
                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                data-testid="textarea-testimonial-comment"
                className="min-h-24"
              />

              <Input
                placeholder="Fotograf URL"
                value={form.photo}
                onChange={(e) => setForm((p) => ({ ...p, photo: e.target.value }))}
                data-testid="input-testimonial-photo"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={form.rating} onValueChange={(v) => setForm((p) => ({ ...p, rating: v }))}>
                  <SelectTrigger data-testid="select-testimonial-rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Yildiz</SelectItem>
                    <SelectItem value="2">2 Yildiz</SelectItem>
                    <SelectItem value="3">3 Yildiz</SelectItem>
                    <SelectItem value="4">4 Yildiz</SelectItem>
                    <SelectItem value="5">5 Yildiz</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Siralama"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  data-testid="input-testimonial-sort"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                    className="rounded"
                    data-testid="checkbox-testimonial-active"
                  />
                  Aktif
                </label>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleSave}
                  disabled={!form.name.trim() || !form.comment.trim()}
                  data-testid="button-save-testimonial"
                >
                  <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Ekle"}
                </Button>
                <Button variant="outline" onClick={resetForm} data-testid="button-cancel-testimonial">
                  <X className="w-4 h-4 mr-2" /> Iptal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Testinya ({testimonials.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="p-4 bg-muted/50 rounded-lg border border-border"
              data-testid={`testimonial-item-${testimonial.id}`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start gap-3">
                    {testimonial.photo ? (
                      <img
                        src={testimonial.photo}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        data-testid={`testimonial-photo-${testimonial.id}`}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{testimonial.name}</span>
                        <Badge
                          variant={testimonial.isActive ? "default" : "secondary"}
                          className="text-xs"
                          data-testid={`testimonial-status-${testimonial.id}`}
                        >
                          {testimonial.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      {testimonial.title && (
                        <p className="text-xs text-muted-foreground">{testimonial.title}</p>
                      )}
                      <div className="mt-1">{renderStars(testimonial.rating)}</div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        "{testimonial.comment}"
                      </p>
                      {testimonial.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(testimonial.createdAt).toLocaleString("tr-TR")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(testimonial)}
                    data-testid={`button-edit-testimonial-${testimonial.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(testimonial.id)}
                    data-testid={`button-delete-testimonial-${testimonial.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && (
            <p className="text-sm text-muted-foreground">Henuz tesimonya eklenmemis.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
