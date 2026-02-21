import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Mail } from "lucide-react";

export default function NewslettersTab() {
  const { data: newsletters = [] } = useQuery<{ id: number; email: string; createdAt: string }[]>({ queryKey: ["/api/admin/newsletters"] });

  const exportCSV = () => {
    const header = "E-posta,Tarih\n";
    const rows = newsletters.map(n => `${n.email},${n.createdAt ? new Date(n.createdAt).toLocaleDateString("tr-TR") : "-"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulten-aboneleri.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="admin-newsletters">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" /> Bulten Aboneleri ({newsletters.length})
        </h3>
        <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-newsletters">
          <Download className="w-4 h-4 mr-2" /> CSV Olarak Indir
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">E-posta</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Kayit Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {newsletters.map((n, i) => (
                  <tr key={n.id} className="border-b border-border last:border-0" data-testid={`newsletter-row-${n.id}`}>
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3">{n.email}</td>
                    <td className="p-3 text-muted-foreground">{n.createdAt ? new Date(n.createdAt).toLocaleString("tr-TR") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {newsletters.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">Henuz abone yok.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
