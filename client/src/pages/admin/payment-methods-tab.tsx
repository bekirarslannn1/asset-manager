import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, CreditCard, Building2, MessageCircle } from "lucide-react";
import type { PaymentMethod } from "@shared/schema";

const TYPE_LABELS: Record<string, string> = {
  credit_card: "Kredi Kartı",
  bank_transfer: "Havale/EFT",
  whatsapp: "WhatsApp Sipariş",
};

const TYPE_ICONS: Record<string, any> = {
  credit_card: CreditCard,
  bank_transfer: Building2,
  whatsapp: MessageCircle,
};

interface BankDetails {
  bankName: string;
  accountHolder: string;
  iban: string;
  branchCode?: string;
  accountNumber?: string;
}

interface WhatsAppDetails {
  phoneNumber: string;
  messageTemplate?: string;
}

export default function PaymentMethodsTab() {
  const { data: methods = [] } = useQuery<PaymentMethod[]>({ queryKey: ["/api/admin/payment-methods"] });
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    type: "bank_transfer",
    name: "",
    description: "",
    isActive: true,
    sortOrder: 0,
  });

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: "",
    accountHolder: "",
    iban: "",
    branchCode: "",
    accountNumber: "",
  });

  const [whatsappDetails, setWhatsappDetails] = useState<WhatsAppDetails>({
    phoneNumber: "",
    messageTemplate: "Merhaba, sipariş vermek istiyorum.\n\nSipariş Detayları:\n{items}\n\nToplam: {total}",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/payment-methods", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Ödeme yöntemi eklendi" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/payment-methods/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Ödeme yöntemi güncellendi" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/payment-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Ödeme yöntemi silindi" });
    },
  });

  const resetForm = () => {
    setEditing(null);
    setIsNew(false);
    setForm({ type: "bank_transfer", name: "", description: "", isActive: true, sortOrder: 0 });
    setBankDetails({ bankName: "", accountHolder: "", iban: "", branchCode: "", accountNumber: "" });
    setWhatsappDetails({ phoneNumber: "", messageTemplate: "Merhaba, sipariş vermek istiyorum.\n\nSipariş Detayları:\n{items}\n\nToplam: {total}" });
  };

  const startEdit = (m: PaymentMethod) => {
    setEditing(m);
    setIsNew(false);
    setForm({
      type: m.type,
      name: m.name,
      description: m.description || "",
      isActive: m.isActive !== false,
      sortOrder: m.sortOrder || 0,
    });
    const details = m.details as any || {};
    if (m.type === "bank_transfer") {
      setBankDetails({
        bankName: details.bankName || "",
        accountHolder: details.accountHolder || "",
        iban: details.iban || "",
        branchCode: details.branchCode || "",
        accountNumber: details.accountNumber || "",
      });
    } else if (m.type === "whatsapp") {
      setWhatsappDetails({
        phoneNumber: details.phoneNumber || "",
        messageTemplate: details.messageTemplate || "",
      });
    }
  };

  const handleSave = () => {
    if (!form.name) {
      toast({ title: "İsim zorunlu", variant: "destructive" });
      return;
    }

    let details: any = {};
    if (form.type === "bank_transfer") {
      if (!bankDetails.bankName || !bankDetails.iban || !bankDetails.accountHolder) {
        toast({ title: "Banka bilgileri eksik", description: "Banka adı, hesap sahibi ve IBAN zorunludur.", variant: "destructive" });
        return;
      }
      details = { ...bankDetails };
    } else if (form.type === "whatsapp") {
      if (!whatsappDetails.phoneNumber) {
        toast({ title: "WhatsApp numarası zorunlu", variant: "destructive" });
        return;
      }
      details = { ...whatsappDetails };
    }

    const payload = {
      type: form.type,
      name: form.name,
      description: form.description || null,
      details,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };

    if (editing && !isNew) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const showForm = editing || isNew;

  return (
    <div data-testid="admin-payment-methods">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Ödeme Yöntemleri ({methods.length})</h3>
        {!showForm && (
          <Button size="sm" onClick={() => { resetForm(); setIsNew(true); }} data-testid="button-add-payment-method">
            <Plus className="w-4 h-4 mr-1" /> Yeni Ekle
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editing && !isNew ? "Ödeme Yöntemi Düzenle" : "Yeni Ödeme Yöntemi"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Tür *</Label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                    <SelectItem value="bank_transfer">Havale/EFT</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Sipariş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>İsim *</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Örn: Ziraat Bankası, WhatsApp Sipariş" data-testid="input-payment-name" />
              </div>
            </div>

            <div>
              <Label>Açıklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Müşteriye gösterilecek açıklama" rows={2} data-testid="input-payment-description" />
            </div>

            {form.type === "bank_transfer" && (
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Banka Hesap Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Banka Adı *</Label>
                      <Input value={bankDetails.bankName} onChange={(e) => setBankDetails(p => ({ ...p, bankName: e.target.value }))} placeholder="Ziraat Bankası" data-testid="input-bank-name" />
                    </div>
                    <div>
                      <Label>Hesap Sahibi *</Label>
                      <Input value={bankDetails.accountHolder} onChange={(e) => setBankDetails(p => ({ ...p, accountHolder: e.target.value }))} placeholder="Ad Soyad / Şirket Adı" data-testid="input-account-holder" />
                    </div>
                  </div>
                  <div>
                    <Label>IBAN *</Label>
                    <Input value={bankDetails.iban} onChange={(e) => setBankDetails(p => ({ ...p, iban: e.target.value.toUpperCase() }))} placeholder="TR00 0000 0000 0000 0000 0000 00" data-testid="input-iban" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Şube Kodu</Label>
                      <Input value={bankDetails.branchCode} onChange={(e) => setBankDetails(p => ({ ...p, branchCode: e.target.value }))} placeholder="İsteğe bağlı" data-testid="input-branch-code" />
                    </div>
                    <div>
                      <Label>Hesap Numarası</Label>
                      <Input value={bankDetails.accountNumber} onChange={(e) => setBankDetails(p => ({ ...p, accountNumber: e.target.value }))} placeholder="İsteğe bağlı" data-testid="input-account-number" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {form.type === "whatsapp" && (
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> WhatsApp Ayarları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>WhatsApp Numarası *</Label>
                    <Input value={whatsappDetails.phoneNumber} onChange={(e) => setWhatsappDetails(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="905xxxxxxxxx (başında + olmadan)" data-testid="input-whatsapp-number" />
                    <p className="text-xs text-muted-foreground mt-1">Uluslararası formatta yazın. Örn: 905321234567</p>
                  </div>
                  <div>
                    <Label>Mesaj Şablonu</Label>
                    <Textarea
                      value={whatsappDetails.messageTemplate}
                      onChange={(e) => setWhatsappDetails(p => ({ ...p, messageTemplate: e.target.value }))}
                      placeholder="WhatsApp mesaj şablonu. {items} ve {total} değişkenlerini kullanabilirsiniz."
                      rows={4}
                      data-testid="input-whatsapp-template"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Kullanılabilir değişkenler: {"{items}"} = Ürün listesi, {"{total}"} = Toplam tutar, {"{name}"} = Müşteri adı</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {form.type === "credit_card" && (
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Kredi kartı ödemeleri iyzico altyapısı üzerinden işlenir. Ek ayar gerekmez.
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Sıralama</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} data-testid="input-payment-sort" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm(p => ({ ...p, isActive: v }))} data-testid="switch-payment-active" />
                <Label>Aktif</Label>
              </div>
            </div>

            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-payment-method">
              <Save className="w-4 h-4 mr-1" /> Kaydet
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {methods.map((m) => {
          const Icon = TYPE_ICONS[m.type] || CreditCard;
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`payment-method-${m.id}`}>
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[m.type] || m.type}</p>
                  {m.type === "bank_transfer" && (m.details as any)?.iban && (
                    <p className="text-xs text-muted-foreground font-mono">{(m.details as any).iban}</p>
                  )}
                  {m.type === "whatsapp" && (m.details as any)?.phoneNumber && (
                    <p className="text-xs text-muted-foreground">+{(m.details as any).phoneNumber}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.isActive ? "default" : "secondary"}>
                  {m.isActive ? "Aktif" : "Pasif"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => startEdit(m)} data-testid={`button-edit-payment-${m.id}`}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(m.id)} data-testid={`button-delete-payment-${m.id}`}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          );
        })}
        {methods.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz ödeme yöntemi eklenmedi.</p>
            <p className="text-xs mt-1">Banka havale bilgileri ve WhatsApp sipariş numarası ekleyebilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
