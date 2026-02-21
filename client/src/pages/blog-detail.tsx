import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, Eye, User, ArrowLeft, MessageCircle, Send, Tag, Share2 } from "lucide-react";
import type { BlogPost, BlogComment, BlogCategory } from "@shared/schema";

function formatDate(date: string | Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [commentForm, setCommentForm] = useState({ name: "", email: "", comment: "" });

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog/posts", slug],
  });

  const { data: relatedPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts", slug, "related"],
    enabled: !!post,
  });

  const { data: comments = [] } = useQuery<BlogComment[]>({
    queryKey: ["/api/blog/posts", slug, "comments"],
    enabled: !!post,
  });

  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ["/api/blog/categories"],
  });

  const { data: jsonLd } = useQuery<Record<string, unknown>>({
    queryKey: ["/api/jsonld/blog", slug],
    enabled: !!post,
  });

  const commentMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; comment: string }) => {
      const res = await apiRequest("POST", `/api/blog/posts/${slug}/comments`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Yorumunuz gönderildi", description: "Onaylandıktan sonra yayınlanacaktır." });
      setCommentForm({ name: "", email: "", comment: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts", slug, "comments"] });
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.name || !commentForm.comment) {
      toast({ title: "Hata", description: "İsim ve yorum alanları zorunludur.", variant: "destructive" });
      return;
    }
    commentMutation.mutate(commentForm);
  };

  const category = categories.find(c => c.id === post?.categoryId);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link kopyalandı!" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl mb-6" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Makale Bulunamadı</h1>
        <Link href="/blog">
          <Button variant="outline" data-testid="button-back-to-blog"><ArrowLeft className="h-4 w-4 mr-2" /> Blog'a Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="page-blog-detail">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-blog">
            <ArrowLeft className="h-4 w-4 mr-2" /> Blog'a Dön
          </Button>
        </Link>

        <article>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {category && <Badge variant="secondary" data-testid="badge-post-category">{category.name}</Badge>}
            {post.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs" data-testid={`badge-post-tag-${tag}`}>{tag}</Badge>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" data-testid="text-post-title">{post.title}</h1>

          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
              <span className="font-medium text-foreground" data-testid="text-post-author">{post.authorName}</span>
            </div>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.readingTime} dk okuma</span>
            <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{post.viewCount} görüntülenme</span>
            <Button variant="ghost" size="sm" onClick={handleShare} data-testid="button-share-post">
              <Share2 className="h-4 w-4 mr-1" /> Paylaş
            </Button>
          </div>

          {post.coverImage && (
            <div className="rounded-xl overflow-hidden mb-8 aspect-video">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" data-testid="img-post-cover" />
            </div>
          )}

          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-10 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
            data-testid="text-post-content"
          />

          <Separator className="my-10" />

          {relatedPosts.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Tag className="h-5 w-5" /> İlgili Yazılar
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedPosts.map(rp => (
                  <Link key={rp.id} href={`/blog/${rp.slug}`}>
                    <div className="group border rounded-xl overflow-hidden bg-card hover:border-primary/50 transition-all cursor-pointer" data-testid={`card-related-post-${rp.id}`}>
                      {rp.coverImage && (
                        <div className="aspect-video overflow-hidden">
                          <img src={rp.coverImage} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">{rp.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{rp.readingTime} dk</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(rp.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" /> Yorumlar ({comments.length})
            </h2>

            {comments.length > 0 ? (
              <div className="space-y-4 mb-8">
                {comments.map(c => (
                  <div key={c.id} className="border rounded-xl p-4 bg-card" data-testid={`card-comment-${c.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pl-10">{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-6">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
            )}

            <form onSubmit={handleCommentSubmit} className="border rounded-xl p-5 bg-card space-y-4" data-testid="form-blog-comment">
              <h3 className="font-bold">Yorum Yaz</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Adınız *"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm(f => ({ ...f, name: e.target.value }))}
                  data-testid="input-comment-name"
                />
                <Input
                  placeholder="E-posta (isteğe bağlı)"
                  type="email"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm(f => ({ ...f, email: e.target.value }))}
                  data-testid="input-comment-email"
                />
              </div>
              <Textarea
                placeholder="Yorumunuz *"
                rows={4}
                value={commentForm.comment}
                onChange={(e) => setCommentForm(f => ({ ...f, comment: e.target.value }))}
                data-testid="input-comment-text"
              />
              <Button type="submit" className="neon-glow" disabled={commentMutation.isPending} data-testid="button-submit-comment">
                <Send className="h-4 w-4 mr-2" /> {commentMutation.isPending ? "Gönderiliyor..." : "Yorum Gönder"}
              </Button>
            </form>
          </section>
        </article>
      </div>
    </div>
  );
}
