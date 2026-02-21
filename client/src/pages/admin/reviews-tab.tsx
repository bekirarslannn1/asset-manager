import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Star, Trash2 } from "lucide-react";
import type { Review } from "@shared/schema";

export default function ReviewsTab() {
  const { data: reviews = [] } = useQuery<(Review & { productName?: string })[]>({ queryKey: ["/api/admin/reviews"] });
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      apiRequest("PATCH", `/api/admin/reviews/${id}`, { isApproved: approved }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Yorum guncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Yorum silindi" });
    },
  });

  const pending = reviews.filter(r => !r.isApproved);
  const approved = reviews.filter(r => r.isApproved);

  return (
    <div data-testid="admin-reviews">
      <h3 className="text-lg font-semibold mb-4">Yorum Moderasyonu ({reviews.length})</h3>

      {pending.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Onay Bekleyenler <Badge variant="destructive">{pending.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((review) => (
              <div key={review.id} className="p-3 bg-muted/50 rounded-lg border border-border" data-testid={`review-pending-${review.id}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium">{review.userName}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      {review.productName && <span className="text-xs text-muted-foreground">- {review.productName}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment || "(Yorum yok)"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{review.createdAt ? new Date(review.createdAt).toLocaleString("tr-TR") : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-green-400 border-green-400/30" onClick={() => approveMutation.mutate({ id: review.id, approved: true })} data-testid={`button-approve-review-${review.id}`}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Onayla
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-400 border-red-400/30" onClick={() => deleteMutation.mutate(review.id)} data-testid={`button-reject-review-${review.id}`}>
                      <XCircle className="w-4 h-4 mr-1" /> Sil
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Onaylanmis Yorumlar ({approved.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {approved.map((review) => (
            <div key={review.id} className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg flex-wrap" data-testid={`review-approved-${review.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{review.userName}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">{review.comment || "(Yorum yok)"}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => approveMutation.mutate({ id: review.id, approved: false })}>
                  <XCircle className="w-4 h-4 text-yellow-400" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(review.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
          {approved.length === 0 && <p className="text-sm text-muted-foreground">Onaylanmis yorum yok.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
