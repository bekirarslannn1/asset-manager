import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Shield, Filter } from "lucide-react";
import type { ConsentRecord } from "@shared/schema";

export default function KVKKTab() {
  const { data: consents = [] } = useQuery<ConsentRecord[]>({ queryKey: ["/api/admin/consent-records"] });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const consentTypes = Array.from(new Set(consents.map(c => c.consentType)));
  const filtered = consents.filter(c => {
    if (typeFilter !== "all" && c.consentType !== typeFilter) return false;
    if (dateFrom && c.createdAt && new Date(c.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && c.createdAt && new Date(c.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const exportCSV = () => {
    const header = "ID,Tip,Durum,Oturum,IP,Kullanici ID,Tarih\n";
    const rows = filtered.map(c =>
      `${c.id},${c.consentType},${c.granted ? "Verildi" : "Reddedildi"},${c.sessionId || "-"},${c.ipAddress || "-"},${c.userId || "-"},${c.createdAt ? new Date(c.createdAt).toLocaleString("tr-TR") : "-"}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kvkk-consent-records-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kvkk-consent-records-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: consents.length,
    granted: consents.filter(c => c.granted).length,
    rejected: consents.filter(c => !c.granted).length,
    marketing: consents.filter(c => c.consentType === "marketing").length,
    analytics: consents.filter(c => c.consentType === "analytics").length,
    necessary: consents.filter(c => c.consentType === "necessary").length,
  };

  return (
    <div data-testid="admin-kvkk">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> KVKK Uyumluluk Paneli
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-consents-csv">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportJSON} data-testid="button-export-consents-json">
            <Download className="w-4 h-4 mr-2" /> JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Toplam Kayit", value: stats.total, color: "text-blue-400" },
          { label: "Onaylanan", value: stats.granted, color: "text-green-400" },
          { label: "Reddedilen", value: stats.rejected, color: "text-red-400" },
          { label: "Pazarlama", value: stats.marketing, color: "text-purple-400" },
          { label: "Analitik", value: stats.analytics, color: "text-orange-400" },
          { label: "Zorunlu", value: stats.necessary, color: "text-cyan-400" },
        ].map((s, i) => (
          <div key={i} className="p-3 bg-card border border-border rounded-lg text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" placeholder="Baslangic" data-testid="input-kvkk-date-from" />
            <span className="text-muted-foreground text-sm">-</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" placeholder="Bitis" data-testid="input-kvkk-date-to" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-md border border-border bg-background text-sm" data-testid="select-kvkk-type-filter">
              <option value="all">Tum Tipler</option>
              {consentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">{filtered.length} kayit</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Tip</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Durum</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Oturum</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">IP</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0" data-testid={`consent-record-${c.id}`}>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{c.consentType}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={c.granted ? "default" : "destructive"} className="text-xs">
                        {c.granted ? "Verildi" : "Reddedildi"}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground font-mono">{c.sessionId?.slice(0, 12) || "-"}...</td>
                    <td className="p-3 text-xs text-muted-foreground">{c.ipAddress || "-"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleString("tr-TR") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">Kayit bulunamadi.</p>}
            {filtered.length > 100 && <p className="text-xs text-muted-foreground p-3 text-center">Ilk 100 kayit gosteriliyor. Tum verileri CSV olarak indirebilirsiniz.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
