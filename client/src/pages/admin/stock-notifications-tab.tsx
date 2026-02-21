import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Package } from "lucide-react";
import type { StockNotification } from "@shared/schema";

export default function StockNotificationsTab() {
  const { data: notifications = [] } = useQuery<(StockNotification & { productName?: string })[]>({ queryKey: ["/api/admin/stock-notifications"] });

  const waiting = notifications.filter(n => !n.isNotified);
  const notified = notifications.filter(n => n.isNotified);

  return (
    <div data-testid="admin-stock-notifications">
      <h3 className="text-lg font-semibold mb-4">Stok Bildirimleri ({notifications.length})</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{notifications.length}</div>
            <div className="text-xs text-muted-foreground">Toplam Kayıt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Mail className="w-8 h-8 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold">{waiting.length}</div>
            <div className="text-xs text-muted-foreground">Bekleyen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold">{notified.length}</div>
            <div className="text-xs text-muted-foreground">Bildirildi</div>
          </CardContent>
        </Card>
      </div>

      {waiting.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Bekleyen Bildirimler <Badge variant="destructive">{waiting.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-2">E-posta</th>
                    <th className="p-2">Ürün</th>
                    <th className="p-2">Tarih</th>
                    <th className="p-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {waiting.map((n) => (
                    <tr key={n.id} className="border-b border-border/50" data-testid={`stock-notif-${n.id}`}>
                      <td className="p-2 text-muted-foreground">{n.email}</td>
                      <td className="p-2">{n.productName || `Ürün #${n.productId}`}</td>
                      <td className="p-2 text-muted-foreground text-xs">{n.createdAt ? new Date(n.createdAt).toLocaleString("tr-TR") : ""}</td>
                      <td className="p-2"><Badge variant="outline" className="text-orange-400 border-orange-400/30">Bekliyor</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bildirim Geçmişi ({notified.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notified.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-2">E-posta</th>
                    <th className="p-2">Ürün</th>
                    <th className="p-2">Tarih</th>
                    <th className="p-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {notified.map((n) => (
                    <tr key={n.id} className="border-b border-border/50">
                      <td className="p-2 text-muted-foreground">{n.email}</td>
                      <td className="p-2">{n.productName || `Ürün #${n.productId}`}</td>
                      <td className="p-2 text-muted-foreground text-xs">{n.createdAt ? new Date(n.createdAt).toLocaleString("tr-TR") : ""}</td>
                      <td className="p-2"><Badge variant="outline" className="text-green-400 border-green-400/30">Bildirildi</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Henüz bildirim gönderilmedi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
