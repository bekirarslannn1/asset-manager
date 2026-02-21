import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Eye, X, Save, Package, Truck, CheckCircle, XCircle, Clock, StickyNote, Send, Trash2 } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, PAYMENT_METHOD_LABELS } from "./shared";
import type { Order, OrderNote } from "@shared/schema";

export default function OrdersTab() {
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newStatus, setNewStatus] = useState("");
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const { data: orderNotes = [] } = useQuery<OrderNote[]>({
    queryKey: ["/api/admin/orders", selectedOrder?.id, "notes"],
    enabled: !!selectedOrder?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Sipariş durumu güncellendi" });
      setNewStatus("");
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note: string }) =>
      apiRequest("POST", `/api/admin/orders/${orderId}/notes`, { note, isInternal: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", selectedOrder?.id, "notes"] });
      toast({ title: "Not eklendi" });
      setNoteText("");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/order-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", selectedOrder?.id, "notes"] });
      toast({ title: "Not silindi" });
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
        <h3 className="text-lg font-semibold">Sipariş Yönetimi ({orders.length})</h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-order-status-filter">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü ({orders.length})</SelectItem>
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
              <CardTitle className="text-sm">Sipariş Detayı - #{selectedOrder.orderNumber}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Müşteri:</span> {selectedOrder.customerName}</p>
                <p className="text-sm"><span className="text-muted-foreground">E-posta:</span> {selectedOrder.customerEmail}</p>
                <p className="text-sm"><span className="text-muted-foreground">Telefon:</span> {selectedOrder.customerPhone || "-"}</p>
                <p className="text-sm"><span className="text-muted-foreground">Adres:</span> {(() => { const a = selectedOrder.shippingAddress as any; return a ? (typeof a === "string" ? a : `${a.address || ""}, ${a.district || ""}/${a.city || ""}`) : "-"; })()}</p>
                <p className="text-sm"><span className="text-muted-foreground">Ödeme:</span> {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod || ""] || selectedOrder.paymentMethod || "-"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Ara Toplam:</span> {formatPrice(selectedOrder.subtotal)}</p>
                <p className="text-sm"><span className="text-muted-foreground">Kargo:</span> {formatPrice(selectedOrder.shippingCost || "0")}</p>
                {selectedOrder.discount && parseFloat(selectedOrder.discount) > 0 && (
                  <p className="text-sm"><span className="text-muted-foreground">İndirim:</span> -{formatPrice(selectedOrder.discount)}</p>
                )}
                <p className="text-sm font-bold"><span className="text-muted-foreground">Toplam:</span> {formatPrice(selectedOrder.total)}</p>
                <p className="text-sm"><span className="text-muted-foreground">Tarih:</span> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("tr-TR") : "-"}</p>
              </div>
            </div>
            {(() => {
              const rawItems = selectedOrder.items;
              const items: any[] = Array.isArray(rawItems) ? rawItems : (typeof rawItems === "string" ? (() => { try { return JSON.parse(rawItems); } catch { return []; } })() : []);
              if (items.length === 0) return null;
              return (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Ürünler:</p>
                  <div className="space-y-1">
                    {items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                        <span>{item.name || item.productName || `Ürün #${item.productId}`}{item.flavor ? ` (${item.flavor})` : ""}{item.weight ? ` - ${item.weight}` : ""} x{item.quantity}</span>
                        <span className="font-medium">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-48" data-testid="select-order-new-status">
                  <SelectValue placeholder="Durum değiştir" />
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
                <Save className="w-4 h-4 mr-2" /> Güncelle
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-medium">Sipariş Notları ({orderNotes.length})</h4>
              </div>
              {orderNotes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {orderNotes.map((note) => (
                    <div key={note.id} className="flex items-start justify-between gap-2 p-2 bg-muted/30 rounded text-sm" data-testid={`order-note-${note.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-xs">{note.userName}</span>
                          <span className="text-xs text-muted-foreground">{note.createdAt ? new Date(note.createdAt).toLocaleString("tr-TR") : ""}</span>
                          {note.isInternal && <Badge variant="outline" className="text-[10px] px-1 py-0">İç Not</Badge>}
                        </div>
                        <p className="text-muted-foreground">{note.note}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteNoteMutation.mutate(note.id)}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Sipariş notu ekle..." className="flex-1" data-testid="input-order-note" />
                <Button size="sm" onClick={() => addNoteMutation.mutate({ orderId: selectedOrder.id, note: noteText })} disabled={!noteText.trim() || addNoteMutation.isPending} data-testid="button-add-order-note">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
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
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Sipariş bulunamadı.</p>}
      </div>
    </div>
  );
}
