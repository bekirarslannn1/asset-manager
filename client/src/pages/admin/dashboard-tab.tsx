import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Package, Tag, Layers, ShoppingCart, BarChart3, Users, FileText,
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { PIE_COLORS, STATUS_LABELS, STATUS_COLORS } from "./shared";
import type { Order } from "@shared/schema";

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  last30Revenue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  productsCount: number;
  categoriesCount: number;
  brandsCount: number;
  usersCount: number;
  newsletterCount: number;
}

interface KPIData {
  conversionRate: number;
  aov: number;
  cartAbandonmentRate: number;
  totalSessions: number;
  totalCompletedOrders: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topProducts: { name: string; revenue: number; quantity: number }[];
  revenueByWeek: { week: string; revenue: number; orders: number }[];
}

export default function DashboardTab() {
  const { data: stats } = useQuery<AdminStats>({ queryKey: ["/api/admin/stats"] });
  const { data: kpis } = useQuery<KPIData>({ queryKey: ["/api/admin/kpis"] });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const mainKpis = [
    { label: "Toplam Gelir", value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Toplam Siparis", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Ort. Siparis Degeri", value: formatPrice(kpis?.aov || stats?.avgOrderValue || 0), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Son 30 Gun Gelir", value: formatPrice(stats?.last30Revenue || 0), icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  const secondaryKpis = [
    { label: "Donusum Orani", value: `${(kpis?.conversionRate || 0).toFixed(1)}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Sepet Terk Orani", value: `${(kpis?.cartAbandonmentRate || 0).toFixed(1)}%`, icon: ShoppingBag, color: "text-orange-400", bg: "bg-orange-500/10", warning: (kpis?.cartAbandonmentRate || 0) > 70 },
    { label: "Urunler", value: stats?.productsCount || 0, icon: Package, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Kategoriler", value: stats?.categoriesCount || 0, icon: Layers, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Markalar", value: stats?.brandsCount || 0, icon: Tag, color: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "Kullanicilar", value: stats?.usersCount || 0, icon: Users, color: "text-teal-400", bg: "bg-teal-500/10" },
    { label: "Bulten Aboneleri", value: stats?.newsletterCount || 0, icon: FileText, color: "text-violet-400", bg: "bg-violet-500/10" },
    {
      label: "Gelir Buyumesi",
      value: `${(kpis?.revenueGrowth || 0) >= 0 ? "+" : ""}${(kpis?.revenueGrowth || 0).toFixed(1)}%`,
      icon: (kpis?.revenueGrowth || 0) >= 0 ? TrendingUp : TrendingDown,
      color: (kpis?.revenueGrowth || 0) >= 0 ? "text-green-400" : "text-red-400",
      bg: (kpis?.revenueGrowth || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainKpis.map((kpi, i) => (
          <Card key={i} className="overflow-hidden" data-testid={`stat-card-${i}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
        {secondaryKpis.map((kpi, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg" data-testid={`secondary-kpi-${i}`}>
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              <p className="text-sm font-bold flex items-center gap-1">
                {kpi.value}
                {"warning" in kpi && kpi.warning && <AlertTriangle className="w-3 h-3 text-orange-400" />}
              </p>
            </div>
          </div>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Son 30 Gun Gelir Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatPrice(value), "Gelir"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Siparis Durumlari</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={(stats.ordersByStatus || []).map(s => ({ ...s, label: STATUS_LABELS[s.status] || s.status }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    dataKey="count"
                    nameKey="label"
                    label={({ label, count }: { label: string; count: number }) => `${label}: ${count}`}
                  >
                    {(stats.ordersByStatus || []).map((_: { status: string; count: number }, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {kpis?.revenueByWeek && kpis.revenueByWeek.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Haftalik Gelir ve Siparis Karsilastirmasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={kpis.revenueByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" name="Gelir (TL)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" name="Siparis" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {kpis?.topProducts && kpis.topProducts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">En Cok Satan Urunler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg" data-testid={`top-product-${i}`}>
                  <span className="w-8 h-8 flex items-center justify-center bg-primary/20 text-primary rounded-full text-sm font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.quantity} adet satildi</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Son Siparisler</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henuz siparis yok</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex justify-between items-center py-2.5 border-b border-border last:border-0 flex-wrap gap-2" data-testid={`order-row-${order.id}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">#{order.orderNumber}</span>
                    <Badge variant="secondary" className={STATUS_COLORS[order.status] || ""}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("tr-TR") : "-"}
                    </span>
                    <span className="font-bold">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
