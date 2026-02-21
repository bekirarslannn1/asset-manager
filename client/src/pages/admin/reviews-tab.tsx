import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Star, Trash2, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import type { Review } from "@shared/schema";

export default function ReviewsTab() {
  const { data: reviews = [] } = useQuery<(Review & { productName?: string })[]>({ queryKey: ["/api/admin/reviews"] });
  const { toast } = useToast();
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const approveMutation = useMutation({
    mutationFn: ({ id, approved }: { id: number; approved: boolean }) =>
      approved ? apiRequest("POST", `/api/admin/reviews/${id}/approve`) : apiRequest("PATCH", `/api/admin/reviews/${id}`, { isApproved: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Yorum güncellendi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Yorum silindi" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      apiRequest("POST", `/api/admin/reviews/${id}/reply`, { reply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Yanıt eklendi" });
      setReplyId(null);
      setReplyText("");
    },
  });

  const pending = reviews.filter(r => !r.isApproved);
  const approved = reviews.filter(r => r.isApproved);

  const ReviewCard = ({ review, showApprove }: { review: Review & { productName?: string }; showApprove: boolean }) => (
    <div className="p-3 bg-muted/50 rounded-lg border border-border" data-testid={`review-${showApprove ? 'pending' : 'approved'}-${review.id}`}>
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
          {review.adminReply && (
            <div className="mt-2 ml-3 pl-3 border-l-2 border-primary/50">
              <span className="text-xs font-medium text-primary">Mağaza Yanıtı:</span>
              <p className="text-sm text-muted-foreground">{review.adminReply}</p>
            </div>
          )}
          {replyId === review.id && (
            <div className="mt-3 flex gap-2">
              <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Yanıtınızı yazın..." className="flex-1" data-testid={`input-reply-${review.id}`} />
              <Button size="sm" onClick={() => replyMutation.mutate({ id: review.id, reply: replyText })} disabled={!replyText.trim() || replyMutation.isPending} data-testid={`button-send-reply-${review.id}`}>
                <Send className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setReplyId(null); setReplyText(""); }}>İptal</Button>
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {showApprove && (
            <Button size="sm" variant="outline" className="text-green-400 border-green-400/30" onClick={() => approveMutation.mutate({ id: review.id, approved: true })} data-testid={`button-approve-review-${review.id}`}>
              <CheckCircle className="w-4 h-4 mr-1" /> Onayla
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => { setReplyId(review.id); setReplyText(review.adminReply || ""); }} data-testid={`button-reply-review-${review.id}`}>
            <MessageSquare className="w-4 h-4 mr-1" /> Yanıtla
          </Button>
          <Button size="sm" variant="outline" className="text-red-400 border-red-400/30" onClick={() => deleteMutation.mutate(review.id)} data-testid={`button-delete-review-${review.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

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
            {pending.map((review) => <ReviewCard key={review.id} review={review} showApprove={true} />)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Onaylanmış Yorumlar ({approved.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approved.map((review) => <ReviewCard key={review.id} review={review} showApprove={false} />)}
          {approved.length === 0 && <p className="text-sm text-muted-foreground">Onaylanmış yorum yok.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
