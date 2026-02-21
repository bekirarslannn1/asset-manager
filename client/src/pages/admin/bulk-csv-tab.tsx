import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";

interface BulkImportResult {
  successCount: number;
  errorCount: number;
  errors: string[];
}

const CSV_TEMPLATE = `name,slug,price,compareAtPrice,description,category,brand,stock,isActive
"Whey Protein 1kg","whey-protein-1kg",599.99,749.99,"Yuksek kaliteli whey protein","Protein","BrandX",100,true
"BCAA 300g","bcaa-300g",349.99,449.99,"BCAA amino asit takviyesi","Amino Asit","BrandY",50,true`;

export function BulkCsvTab() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState("");
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (data: { csvData: string }) => {
      const res = await apiRequest("POST", "/api/admin/products/bulk-csv", data);
      return res.json();
    },
    onSuccess: (data: BulkImportResult) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Icerik aktarildi",
        description: `${data.successCount} urun basariyla eklendi.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const handleExport = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/products/export-csv");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `urunler-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "CSV dosyasi indirildi" });
    } catch (error: any) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      setImportResult(null);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = () => {
    if (!csvData.trim()) return;
    setImportResult(null);
    importMutation.mutate({ csvData: csvData.trim() });
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(CSV_TEMPLATE);
    toast({ title: "Sablon panoya kopyalandi" });
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "urun-sablonu.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({ title: "Sablon indirildi" });
  };

  return (
    <div data-testid="admin-bulk-csv">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" /> Toplu Urun Yonetimi (CSV)
        </h3>
        <Button onClick={handleExport} variant="outline" data-testid="button-export-csv">
          <Download className="w-4 h-4 mr-2" /> CSV Disari Aktar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">CSV Verisi Iceri Aktar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Textarea
                placeholder="CSV verisini buraya yapistirin veya dosya yukleyin..."
                value={csvData}
                onChange={(e) => { setCsvData(e.target.value); setImportResult(null); }}
                className="resize-none font-mono text-xs"
                rows={12}
                data-testid="textarea-csv-data"
              />

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleImport}
                  disabled={!csvData.trim() || importMutation.isPending}
                  data-testid="button-import-csv"
                >
                  {importMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Iceri Aktar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-csv-file"
                >
                  <Upload className="w-4 h-4 mr-2" /> Dosya Yukle
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-csv-file"
                />

                {csvData && (
                  <Button
                    variant="ghost"
                    onClick={() => { setCsvData(""); setImportResult(null); }}
                    data-testid="button-clear-csv"
                  >
                    Temizle
                  </Button>
                )}
              </div>
            </div>

            {importResult && (
              <div className="mt-4 space-y-2" data-testid="csv-import-result">
                <div className="flex items-center gap-3 flex-wrap">
                  {importResult.successCount > 0 && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {importResult.successCount} basarili
                    </Badge>
                  )}
                  {importResult.errorCount > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {importResult.errorCount} hata
                    </Badge>
                  )}
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive" data-testid={`text-csv-error-${i}`}>
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CSV Sablon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Asagidaki sablonu kullanarak CSV dosyanizi hazirlayabilirsiniz.
              Ilk satir baslik satirini icermelidir.
            </p>
            <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap mb-3 font-mono" data-testid="text-csv-template">
              {CSV_TEMPLATE}
            </pre>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} data-testid="button-download-csv-template">
                <Download className="w-3 h-3 mr-1" /> Indir
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyTemplate} data-testid="button-copy-csv-template">
                <Copy className="w-3 h-3 mr-1" /> Kopyala
              </Button>
            </div>
            <div className="mt-4">
              <p className="text-xs font-medium mb-2">Desteklenen Alanlar:</p>
              <div className="space-y-1">
                {["name - Urun adi (zorunlu)", "slug - URL slug (zorunlu)", "price - Fiyat (zorunlu)", "compareAtPrice - Karsilastirma fiyati", "description - Aciklama", "category - Kategori", "brand - Marka", "stock - Stok miktari", "isActive - Aktif durumu (true/false)"].map((field, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {field}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
