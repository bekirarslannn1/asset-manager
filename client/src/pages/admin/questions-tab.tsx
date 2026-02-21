import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageCircleQuestion, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ProductQuestion } from "@shared/schema";

export default function QuestionsTab() {
  const { data: questions = [] } = useQuery<(ProductQuestion & { productName?: string })[]>({ queryKey: ["/api/admin/questions"] });
  const { toast } = useToast();
  const [answerId, setAnswerId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");

  const answerMutation = useMutation({
    mutationFn: ({ id, answer }: { id: number; answer: string }) =>
      apiRequest("POST", `/api/admin/questions/${id}/answer`, { answer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({ title: "Cevap eklendi ve soru onaylandı" });
      setAnswerId(null);
      setAnswerText("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({ title: "Soru silindi" });
    },
  });

  const unanswered = questions.filter(q => !q.answer);
  const answered = questions.filter(q => q.answer);

  return (
    <div data-testid="admin-questions">
      <h3 className="text-lg font-semibold mb-4">Soru & Cevap Yönetimi ({questions.length})</h3>

      {unanswered.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Cevaplanmamış Sorular <Badge variant="destructive">{unanswered.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unanswered.map((q) => (
              <div key={q.id} className="p-3 bg-muted/50 rounded-lg border border-border" data-testid={`question-unanswered-${q.id}`}>
                <div className="flex items-start gap-3">
                  <MessageCircleQuestion className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium">{q.userName}</span>
                      {q.productName && <span className="text-xs text-muted-foreground">- {q.productName}</span>}
                      <span className="text-xs text-muted-foreground">{q.createdAt ? new Date(q.createdAt).toLocaleString("tr-TR") : ""}</span>
                    </div>
                    <p className="text-sm">{q.question}</p>
                    {q.email && <p className="text-xs text-muted-foreground mt-1">E-posta: {q.email}</p>}
                    {answerId === q.id && (
                      <div className="mt-3 flex gap-2">
                        <Input value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Cevabınızı yazın..." className="flex-1" data-testid={`input-answer-${q.id}`} />
                        <Button size="sm" onClick={() => answerMutation.mutate({ id: q.id, answer: answerText })} disabled={!answerText.trim() || answerMutation.isPending} data-testid={`button-send-answer-${q.id}`}>
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAnswerId(null); setAnswerText(""); }}>İptal</Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setAnswerId(q.id); setAnswerText(""); }} data-testid={`button-answer-${q.id}`}>
                      Cevapla
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-400 border-red-400/30" onClick={() => deleteMutation.mutate(q.id)} data-testid={`button-delete-question-${q.id}`}>
                      <Trash2 className="w-4 h-4" />
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
          <CardTitle className="text-sm">Cevaplanmış Sorular ({answered.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {answered.map((q) => (
            <div key={q.id} className="p-3 bg-muted/30 rounded-lg border border-border" data-testid={`question-answered-${q.id}`}>
              <div className="flex items-start gap-3">
                <MessageCircleQuestion className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium">{q.userName}</span>
                    {q.productName && <span className="text-xs text-muted-foreground">- {q.productName}</span>}
                  </div>
                  <p className="text-sm">{q.question}</p>
                  <div className="mt-2 ml-3 pl-3 border-l-2 border-primary/50">
                    <span className="text-xs font-medium text-primary">Cevap:</span>
                    <p className="text-sm text-muted-foreground">{q.answer}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(q.id)} data-testid={`button-delete-answered-${q.id}`}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
          {answered.length === 0 && <p className="text-sm text-muted-foreground">Henüz cevaplanmış soru yok.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
