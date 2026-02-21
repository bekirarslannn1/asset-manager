export const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

export const ROLE_COLORS: Record<string, string> = {
  customer: "bg-blue-500/20 text-blue-400",
  admin: "bg-red-500/20 text-red-400",
  seller: "bg-green-500/20 text-green-400",
  support: "bg-yellow-500/20 text-yellow-400",
  logistics: "bg-purple-500/20 text-purple-400",
  super_admin: "bg-pink-500/20 text-pink-400",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  refunded: "İade Edildi",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  preparing: "bg-cyan-500/20 text-cyan-400",
  shipped: "bg-purple-500/20 text-purple-400",
  delivered: "bg-green-500/20 text-green-400",
  completed: "bg-green-600/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-400",
  refunded: "bg-orange-500/20 text-orange-400",
};
