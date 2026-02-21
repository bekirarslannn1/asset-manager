import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { PIE_COLORS, STATUS_LABELS } from "./shared";
import { TrendingUp, Package, Users, ShoppingCart, DollarSign } from "lucide-react";

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  totalReviews: number;
  avgOrderValue: number;
  monthlyOrders: { month: string; count: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  statusCounts: { status: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export function AnalyticsTab() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
  });

  const kpiCards = [
    {
      label: "Toplam Sipariş",
      value: analytics?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Toplam Gelir",
      value: formatPrice(analytics?.totalRevenue || 0),
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Toplam Ürün",
      value: analytics?.totalProducts || 0,
      icon: Package,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Toplam Kullanıcı",
      value: analytics?.totalUsers || 0,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Ort. Sipariş Değeri",
      value: formatPrice(analytics?.avgOrderValue || 0),
      icon: TrendingUp,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ];

  const LoadingCard = () => (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  const LoadingChart = () => (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full h-80" />
      </CardContent>
    </Card>
  );

  return (
    <div data-testid="analytics-tab" className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <LoadingCard key={i} />)
          : kpiCards.map((kpi, i) => (
              <Card key={i} className="overflow-hidden" data-testid={`kpi-card-${i}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {kpi.label}
                      </p>
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

      {/* Monthly Orders Line Chart */}
      <Card data-testid="monthly-orders-chart">
        <CardHeader>
          <CardTitle className="text-lg">Aylık Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-80" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.monthlyOrders || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [value, "Sipariş"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#39FF14"
                  strokeWidth={2}
                  dot={{ fill: "#39FF14", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Monthly Revenue Bar Chart */}
      <Card data-testid="monthly-revenue-chart">
        <CardHeader>
          <CardTitle className="text-lg">Aylık Gelir</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-80" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [formatPrice(value), "Gelir"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#39FF14"
                  radius={[4, 4, 0, 0]}
                  name="Gelir"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Order Status Pie Chart */}
      <Card data-testid="status-distribution-chart">
        <CardHeader>
          <CardTitle className="text-lg">Sipariş Durumu Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-80" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={(analytics?.statusCounts || []).map((s) => ({
                    ...s,
                    label: STATUS_LABELS[s.status] || s.status,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="count"
                  nameKey="label"
                  label={({ label, count }: { label: string; count: number }) =>
                    `${label}: ${count}`
                  }
                >
                  {(analytics?.statusCounts || []).map((_: any, idx: number) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card data-testid="category-breakdown">
        <CardHeader>
          <CardTitle className="text-lg">Kategori Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {analytics.categoryBreakdown.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`category-item-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Kategori {item.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: "#39FF14" }}>
                      {item.count} ürün
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Kategori verisi bulunmamaktadır.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
