import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, X, Shield, Users } from "lucide-react";
import { ROLE_COLORS } from "./shared";
import type { User } from "@shared/schema";

export default function UsersTab() {
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", fullName: "", phone: "", role: "customer" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setForm({ username: "", email: "", password: "", fullName: "", phone: "", role: "customer" });
      setShowForm(false);
      toast({ title: "Kullanici olusturuldu" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingId(null);
      toast({ title: "Kullanici guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanici silindi" });
    },
  });

  const anonymizeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/users/${id}/anonymize`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Kullanici verileri anonimlestirildi (KVKK)" });
    },
  });

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setShowForm(true);
    setForm({ username: user.username, email: user.email, password: "", fullName: user.fullName, phone: user.phone || "", role: user.role });
  };

  return (
    <div data-testid="admin-users">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Kullanici Yonetimi ({users.length})
        </h3>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); }} data-testid="button-toggle-user-form">
          <Plus className="w-4 h-4 mr-2" /> Yeni Kullanici
        </Button>
      </div>

      {(showForm || editingId !== null) && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-sm">{editingId ? "Kullanici Duzenle" : "Yeni Kullanici Ekle"}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input placeholder="Kullanici adi" value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} data-testid="input-user-username" />
              <Input placeholder="E-posta" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} data-testid="input-user-email" />
              <Input placeholder="Sifre" type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} data-testid="input-user-password" />
              <Input placeholder="Ad Soyad" value={form.fullName} onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))} data-testid="input-user-fullname" />
              <Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} data-testid="input-user-phone" />
              <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger data-testid="select-user-role"><SelectValue placeholder="Rol secin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Musteri</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Satici</SelectItem>
                  <SelectItem value="support">Destek</SelectItem>
                  <SelectItem value="logistics">Lojistik</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                onClick={() => {
                  if (editingId) {
                    const payload: any = { ...form };
                    if (!payload.password) delete payload.password;
                    updateMutation.mutate({ id: editingId, data: payload });
                  } else {
                    createMutation.mutate(form);
                  }
                }}
                disabled={!form.username || !form.email || !form.fullName || (!editingId && !form.password)}
                data-testid="button-save-user"
              >
                <Save className="w-4 h-4 mr-2" /> {editingId ? "Guncelle" : "Kaydet"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} data-testid="button-cancel-user">
                <X className="w-4 h-4 mr-2" /> Iptal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-user-${user.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{user.fullName}</p>
                <Badge variant="secondary" className={ROLE_COLORS[user.role] || ""}>{user.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user.email} | @{user.username}</p>
            </div>
            <div className="flex gap-1 flex-wrap">
              <Button variant="ghost" size="icon" onClick={() => startEdit(user)} data-testid={`button-edit-user-${user.id}`}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => anonymizeMutation.mutate(user.id)} data-testid={`button-anonymize-user-${user.id}`}>
                <Shield className="w-4 h-4 text-yellow-400" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(user.id)} data-testid={`button-delete-user-${user.id}`}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
