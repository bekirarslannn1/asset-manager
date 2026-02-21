import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Loader2, Package, MapPin, Clock } from "lucide-react";

interface ShipmentEvent {
  id: number;
  orderId: number;
  status: string;
  description: string;
  location: string;
  trackingNumber: string;
  carrier: string;
  createdAt: string;
}

interface Order {
  id: number;
  orderNumber?: string;
  status?: string;
}

const SHIPMENT_STATUSES = [
  { value: "Sipariş Alındı", label: "Siparis Alindi" },
  { value: "Hazırlanıyor", label: "Hazirlaniyor" },
  { value: "Kargoya Verildi", label: "Kargoya Verildi" },
  { value: "Dağıtımda", label: "Dagitimda" },
  { value: "Teslim Edildi", label: "Teslim Edildi" },
];

const STATUS_TIMELINE_COLORS: Record<string, string> = {
  "Sipariş Alındı": "bg-blue-500",
  "Hazırlanıyor": "bg-yellow-500",
  "Kargoya Verildi": "bg-purple-500",
  "Dağıtımda": "bg-orange-500",
  "Teslim Edildi": "bg-green-500",
};

export function ShipmentTab() {
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [form, setForm] = useState({
    status: "",
    description: "",
    location: "",
    trackingNumber: "",
    carrier: "",
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<ShipmentEvent[]>({
    queryKey: ["/api/admin/shipment", selectedOrderId],
    enabled: !!selectedOrderId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/shipment", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipment", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setForm({ status: "", description: "", location: "", trackingNumber: "", carrier: "" });
      toast({ title: "Kargo durumu eklendi" });
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!selectedOrderId || !form.status) return;
    createMutation.mutate({
      orderId: parseInt(selectedOrderId),
      status: form.status,
      description: form.description,
      location: form.location,
      trackingNumber: form.trackingNumber,
      carrier: form.carrier,
    });
  };

  return (
    <div data-testid="admin-shipment">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary" /> Kargo Takip Yonetimi
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kargo Durumu Ekle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger data-testid="select-shipment-order">
                  <SelectValue placeholder="Siparis Secin" />
                </SelectTrigger>
                <SelectContent>
                  {ordersLoading && (
                    <SelectItem value="loading" disabled>Yukleniyor...</SelectItem>
                  )}
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={String(order.id)}>
                      #{order.orderNumber || order.id} {order.status ? `(${order.status})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger data-testid="select-shipment-status">
                  <SelectValue placeholder="Kargo Durumu" />
                </SelectTrigger>
                <SelectContent>
                  {SHIPMENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Takip Numarasi"
                value={form.trackingNumber}
                onChange={(e) => setForm(p => ({ ...p, trackingNumber: e.target.value }))}
                data-testid="input-shipment-tracking-number"
              />

              <Input
                placeholder="Kargo Firmasi"
                value={form.carrier}
                onChange={(e) => setForm(p => ({ ...p, carrier: e.target.value }))}
                data-testid="input-shipment-carrier"
              />

              <Input
                placeholder="Konum"
                value={form.location}
                onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                data-testid="input-shipment-location"
              />

              <Textarea
                placeholder="Aciklama"
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                className="resize-none"
                rows={3}
                data-testid="input-shipment-description"
              />

              <Button
                onClick={handleSubmit}
                disabled={!selectedOrderId || !form.status || createMutation.isPending}
                className="w-full"
                data-testid="button-add-shipment-event"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Kargo Durumu Ekle
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              {selectedOrderId ? `Siparis #${selectedOrderId} - Kargo Gecmisi` : "Siparis Secin"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedOrderId && (
              <p className="text-sm text-muted-foreground" data-testid="text-select-order-prompt">
                Kargo gecmisini goruntulemek icin bir siparis secin.
              </p>
            )}

            {selectedOrderId && eventsLoading && (
              <div className="flex items-center justify-center py-8" data-testid="loading-shipment-events">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {selectedOrderId && !eventsLoading && events.length === 0 && (
              <p className="text-sm text-muted-foreground" data-testid="text-no-shipment-events">
                Bu siparis icin henuz kargo hareketi bulunmuyor.
              </p>
            )}

            {selectedOrderId && !eventsLoading && events.length > 0 && (
              <div className="relative space-y-0" data-testid="shipment-timeline">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="relative flex gap-3 pb-6 last:pb-0"
                    data-testid={`shipment-event-${event.id}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_TIMELINE_COLORS[event.status] || "bg-muted-foreground"}`} />
                      {index < events.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {event.status}
                        </Badge>
                        {event.carrier && (
                          <span className="text-xs text-muted-foreground">{event.carrier}</span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {event.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </span>
                        )}
                        {event.trackingNumber && (
                          <span className="text-xs text-muted-foreground">
                            Takip: {event.trackingNumber}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
