import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw } from "lucide-react";
import type { SiteSetting } from "@shared/schema";

const DEFAULT_THEME = {
  primary_color: "#39FF14",
  secondary_color: "#1a1a1a",
  accent_color: "#39FF14",
  background_color: "#0a0a0a",
  card_color: "#1a1a1a",
  text_color: "#ffffff",
  font_heading: "Inter, sans-serif",
  font_body: "Inter, sans-serif",
  border_radius: "0.5",
};

export default function ThemeTab() {
  const { data: settings = [] } = useQuery<SiteSetting[]>({ queryKey: ["/api/settings"] });
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("POST", "/api/settings", { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Tema ayari kaydedildi" });
    },
  });

  const saveAllMutation = useMutation({
    mutationFn: async (values: Record<string, string>) => {
      for (const [key, value] of Object.entries(values)) {
        await apiRequest("POST", "/api/settings", { key, value });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Tum tema ayarlari kaydedildi" });
    },
  });

  const getVal = (key: string) => editValues[key] ?? settings.find((s) => s.key === key)?.value ?? DEFAULT_THEME[key as keyof typeof DEFAULT_THEME] ?? "";

  const colorKeys = [
    { key: "primary_color", label: "Ana Renk (Primary)" },
    { key: "secondary_color", label: "Ikincil Renk (Secondary)" },
    { key: "accent_color", label: "Vurgu Rengi (Accent)" },
    { key: "background_color", label: "Arka Plan Rengi" },
    { key: "card_color", label: "Kart Rengi" },
    { key: "text_color", label: "Metin Rengi" },
  ];

  const fontKeys = [
    { key: "font_heading", label: "Baslik Fontu" },
    { key: "font_body", label: "Govde Fontu" },
  ];

  const handleResetToDefault = () => {
    setEditValues(DEFAULT_THEME);
    toast({ title: "Varsayilan tema yuklendi. Kaydetmeyi unutmayin." });
  };

  const handleSaveAll = () => {
    const allValues: Record<string, string> = {};
    [...colorKeys, ...fontKeys, { key: "border_radius", label: "" }].forEach(({ key }) => {
      allValues[key] = getVal(key);
    });
    saveAllMutation.mutate(allValues);
  };

  return (
    <div data-testid="admin-theme-engine">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Tema Motoru</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetToDefault} data-testid="button-reset-theme">
            <RotateCcw className="w-4 h-4 mr-2" /> Varsayilana Don
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saveAllMutation.isPending} data-testid="button-save-all-theme">
            <Save className="w-4 h-4 mr-2" /> Tumunu Kaydet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Renkler</h4>
          {colorKeys.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-card border border-border rounded-md" data-testid={`theme-color-${key}`}>
              <label className="text-sm font-medium w-44 flex-shrink-0">{label}</label>
              <Input
                type="color"
                value={getVal(key) || "#000000"}
                onChange={(e) => setEditValues((p) => ({ ...p, [key]: e.target.value }))}
                className="w-12 h-10 p-1 cursor-pointer"
                data-testid={`input-theme-${key}`}
              />
              <Input
                value={getVal(key)}
                onChange={(e) => setEditValues((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="#hex"
                className="flex-1"
                data-testid={`input-theme-${key}-text`}
              />
              <Button size="icon" variant="outline" onClick={() => saveMutation.mutate({ key, value: getVal(key) })} data-testid={`button-save-theme-${key}`}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <h4 className="text-sm font-medium text-muted-foreground mt-6">Fontlar</h4>
          {fontKeys.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-card border border-border rounded-md" data-testid={`theme-font-${key}`}>
              <label className="text-sm font-medium w-44 flex-shrink-0">{label}</label>
              <Input
                value={getVal(key)}
                onChange={(e) => setEditValues((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="Inter, sans-serif"
                className="flex-1"
                data-testid={`input-theme-${key}`}
              />
              <Button size="icon" variant="outline" onClick={() => saveMutation.mutate({ key, value: getVal(key) })} data-testid={`button-save-theme-${key}`}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <h4 className="text-sm font-medium text-muted-foreground mt-6">Kenarlik Yaricapi</h4>
          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-md" data-testid="theme-border-radius">
            <label className="text-sm font-medium w-44 flex-shrink-0">Border Radius (rem)</label>
            <Input
              type="number"
              step="0.1"
              value={getVal("border_radius")}
              onChange={(e) => setEditValues((p) => ({ ...p, border_radius: e.target.value }))}
              placeholder="0.5"
              className="flex-1"
              data-testid="input-theme-border-radius"
            />
            <Button size="icon" variant="outline" onClick={() => saveMutation.mutate({ key: "border_radius", value: getVal("border_radius") })} data-testid="button-save-theme-border-radius">
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Canli Onizleme</h4>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {colorKeys.map(({ key, label }) => (
                    <div key={key} className="text-center">
                      <div className="w-full h-16 rounded-md border border-border mb-2" style={{ backgroundColor: getVal(key) || "#888" }} data-testid={`preview-color-${key}`} />
                      <p className="text-xs text-muted-foreground">{label.split(" (")[0]}</p>
                      <p className="text-xs font-mono">{getVal(key) || "-"}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border border-border rounded-md" style={{ backgroundColor: getVal("card_color") || "#1a1a1a", borderRadius: `${getVal("border_radius") || 0.5}rem` }}>
                  <p style={{ fontFamily: getVal("font_heading") || "inherit", color: getVal("text_color") || "#fff" }} className="text-lg font-bold mb-1">Baslik Onizleme</p>
                  <p style={{ fontFamily: getVal("font_body") || "inherit", color: getVal("text_color") || "#fff", opacity: 0.7 }} className="text-sm">Govde metin onizlemesi. Bu alan tema ayarlarinizin nasil gorunecegini gosterir.</p>
                  <button style={{ backgroundColor: getVal("primary_color") || "#39FF14", color: "#000", borderRadius: `${getVal("border_radius") || 0.5}rem` }} className="mt-3 px-4 py-2 text-sm font-bold">Ornek Buton</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
