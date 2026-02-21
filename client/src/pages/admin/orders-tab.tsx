import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Eye, X, Save, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS } from "./shared";
import type { Order } from "@shared/schema";

export default function OrdersTab() {
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Siparis durumu guncellendi" });
      setNewStatus("");
    },
  });

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
  const statuses = Array.from(new Set(orders.map(o => o.status)));

  const statusIcons: Record<string, any> = {
    pending: Clock,
    confirmed: CheckCircle,
    preparing: Package,
    shipped: Truck,
    delivered: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
  };

  return (
    <div data-testid="admin-orders">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-semibold">Siparis Yonetimi ({orders.length})</h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-order-status-filter">
              <SelectValue placeholder="Tumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tumu ({orders.length})</SelectItem>
              {statuses.map(s => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s] || s} ({orders.filter(o => o.status === s).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedOrder && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm">Siparis Detayi - #{selectedOrder.orderNumber}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Musteri:</span> {selectedOrder.customerName}</p>
                <p className="text-sm"><span className="text-muted-foreground">E-posta:</span> {selectedOrder.customerEmail}</p>
                <p className="text-sm"><span className="text-muted-foreground">Telefon:</span> {selectedOrder.customerPhone || "-"}</p>
                <p className="text-sm"><span className="text-muted-foreground">Adres:</span> {selectedOrder.shippingAddress}</p>
                <p className="text-sm"><span className="text-muted-foreground">Odeme:</span> {selectedOrder.paymentMethod}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Ara Toplam:</span> {formatPrice(selectedOrder.subtotal)}</p>
                <p className="text-sm"><span className="text-muted-foreground">Kargo:</span> {formatPrice(selectedOrder.shippingCost)}</p>
                {selectedOrder.discount && parseFloat(selectedOrder.discount) > 0 && (
                  <p className="text-sm"><span className="text-muted-foreground">Indirim:</span> -{formatPrice(selectedOrder.discount)}</p>
                )}
                <p className="text-sm font-bold"><span className="text-muted-foreground">Toplam:</span> {formatPrice(selectedOrder.total)}</p>
                <p className="text-sm"><span className="text-muted-foreground">Tarih:</span> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("tr-TR") : "-"}</p>
              </div>
            </div>
            {selectedOrder.items && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Urunler:</p>
                <div className="space-y-1">
                  {(typeof selectedOrder.items === "string" ? JSON.parse(selectedOrder.items) : selectedOrder.items).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                      <span>{item.name || item.productName || `Urun #${item.productId}`} x{item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.price || item.total || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-48" data-testid="select-order-new-status">
                  <SelectValue placeholder="Durum degistir" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!newStatus || updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: newStatus })}
                data-testid="button-update-order-status"
              >
                <Save className="w-4 h-4 mr-2" /> Guncelle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((order) => {
          const StatusIcon = statusIcons[order.status] || Clock;
          return (
            <div key={order.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`admin-order-${order.id}`}>
              <div className="flex items-center gap-3">
                <StatusIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.customerName} | {order.createdAt ? new Date(order.createdAt).toLocaleDateString("tr-TR") : "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={STATUS_COLORS[order.status] || ""}>
                  {STATUS_LABELS[order.status] || order.status}
                </Badge>
                <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} data-testid={`button-view-order-${order.id}`}>
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Siparis bulunamadi.</p>}
      </div>
    </div>
  );
}
