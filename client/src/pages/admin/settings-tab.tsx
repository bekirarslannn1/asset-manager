import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import type { SiteSetting } from "@shared/schema";

export default function SettingsTab() {
  const { data: settings = [] } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("POST", "/api/settings", { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Ayar kaydedildi" });
    },
  });

  const getVal = (key: string) => editValues[key] ?? settings.find((s) => s.key === key)?.value ?? "";
  const saveField = (key: string) => saveMutation.mutate({ key, value: getVal(key) });

  const settingGroups = [
    {
      title: "Genel Ayarlar",
      fields: [
        { key: "site_name", label: "Site Adi", type: "text" },
        { key: "site_description", label: "Site Aciklamasi", type: "text" },
        { key: "logo_url", label: "Logo URL", type: "text", placeholder: "https://example.com/logo.png" },
        { key: "favicon_url", label: "Favicon URL", type: "text", placeholder: "https://example.com/favicon.ico" },
        { key: "announcement_text", label: "Duyuru Cubugu", type: "text" },
        { key: "free_shipping_threshold", label: "Ucretsiz Kargo Limiti", type: "text" },
        { key: "footer_text", label: "Footer Metni", type: "text" },
      ],
    },
    {
      title: "SEO Ayarlari",
      fields: [
        { key: "seo_title", label: "SEO Baslik (Title Tag)", type: "text", placeholder: "Site Adi - Aciklama" },
        { key: "seo_description", label: "Meta Aciklama", type: "text", placeholder: "Arama motorlarinda gorunecek aciklama" },
        { key: "seo_keywords", label: "Anahtar Kelimeler", type: "text", placeholder: "kelime1, kelime2, kelime3" },
        { key: "og_image", label: "OG Image URL", type: "text", placeholder: "Sosyal medya paylasim gorseli" },
      ],
    },
    {
      title: "Iletisim Bilgileri",
      fields: [
        { key: "phone", label: "Telefon", type: "text" },
        { key: "email", label: "E-posta", type: "text" },
        { key: "whatsapp", label: "WhatsApp Numarasi", type: "text", placeholder: "905xxxxxxxxx" },
        { key: "address", label: "Adres", type: "text" },
      ],
    },
    {
      title: "Sosyal Medya",
      fields: [
        { key: "instagram", label: "Instagram URL", type: "text" },
        { key: "twitter", label: "Twitter / X URL", type: "text" },
        { key: "facebook", label: "Facebook URL", type: "text" },
        { key: "youtube", label: "YouTube URL", type: "text" },
        { key: "tiktok", label: "TikTok URL", type: "text" },
      ],
    },
  ];

  const groupedKeys = settingGroups.flatMap(g => g.fields.map(f => f.key));
  const themeKeys = ["primary_color", "secondary_color", "accent_color", "background_color", "card_color", "text_color", "font_heading", "font_body", "border_radius"];
  const ungroupedSettings = settings.filter(s => s.key && !groupedKeys.includes(s.key) && !themeKeys.includes(s.key!));

  return (
    <div className="space-y-6" data-testid="admin-settings">
      {settingGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.fields.map((field) => (
              <div key={field.key} className="flex items-center gap-3 flex-wrap" data-testid={`setting-${field.key}`}>
                <label className="text-sm font-medium w-52 flex-shrink-0 text-muted-foreground">{field.label}</label>
                <Input
                  value={getVal(field.key)}
                  onChange={(e) => setEditValues((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="flex-1 min-w-[200px]"
                  placeholder={field.placeholder || ""}
                  data-testid={`input-setting-${field.key}`}
                />
                <Button size="icon" variant="outline" onClick={() => saveField(field.key)} disabled={saveMutation.isPending} data-testid={`button-save-setting-${field.key}`}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {ungroupedSettings.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Diger Ayarlar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ungroupedSettings.map((setting) => (
              <div key={setting.id} className="flex items-center gap-3 flex-wrap" data-testid={`setting-${setting.key}`}>
                <label className="text-sm font-medium w-52 flex-shrink-0 text-muted-foreground">{setting.key}</label>
                <Input
                  value={getVal(setting.key!)}
                  onChange={(e) => setEditValues((p) => ({ ...p, [setting.key!]: e.target.value }))}
                  className="flex-1 min-w-[200px]"
                  data-testid={`input-setting-${setting.key}`}
                />
                <Button size="icon" variant="outline" onClick={() => saveField(setting.key!)} disabled={saveMutation.isPending} data-testid={`button-save-setting-${setting.key}`}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
