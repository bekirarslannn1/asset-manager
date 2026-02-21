import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Eye, Search, Tag, ChevronRight, User } from "lucide-react";
import type { BlogPost, BlogCategory } from "@shared/schema";

function formatDate(date: string | Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [searchQuery, setSearchQuery] = useState(params.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(params.get("category") || "");

  const queryString = new URLSearchParams();
  if (searchQuery) queryString.set("search", searchQuery);
  if (selectedCategory) queryString.set("categoryId", selectedCategory);

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: [`/api/blog/posts?${queryString.toString()}`],
  });

  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ["/api/blog/categories"],
  });

  const { data: featuredPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts/featured"],
  });

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  return (
    <div className="min-h-screen" data-testid="page-blog">
      <div className="bg-gradient-to-r from-background to-muted/50 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-blog-title">Blog & Makaleler</h1>
          <p className="text-muted-foreground text-lg">Supplement dünyasından en güncel bilgiler ve uzman tavsiyeleri</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Makale ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-blog-search"
                />
              </div>
              {(searchQuery || selectedCategory) && (
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory(""); }} data-testid="button-clear-blog-filters">
                  Temizle
                </Button>
              )}
            </div>

            {featuredPosts.length > 0 && !searchQuery && !selectedCategory && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4">Öne Çıkan Yazılar</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredPosts.map(post => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="group rounded-xl border bg-card overflow-hidden hover:border-primary/50 transition-all cursor-pointer" data-testid={`card-featured-post-${post.id}`}>
                        {post.coverImage && (
                          <div className="aspect-video overflow-hidden">
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}
                        <div className="p-5">
                          {post.tags?.[0] && <Badge variant="secondary" className="mb-2">{post.tags[0]}</Badge>}
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.authorName}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.publishedAt)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} dk</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 border rounded-xl p-4">
                    <Skeleton className="w-48 h-32 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground" data-testid="text-no-blog-posts">
                <p className="text-lg">Henüz makale bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">
                  {selectedCategory ? `${categories.find(c => String(c.id) === selectedCategory)?.name || "Kategori"} Yazıları` : "Tüm Yazılar"}
                  <span className="text-muted-foreground text-base font-normal ml-2">({posts.length})</span>
                </h2>
                {posts.map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <article className="group flex flex-col sm:flex-row gap-4 border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer bg-card" data-testid={`card-blog-post-${post.id}`}>
                      {post.coverImage && (
                        <div className="w-full sm:w-48 h-40 sm:h-32 rounded-lg overflow-hidden shrink-0">
                          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {post.tags?.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{post.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.authorName}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.publishedAt)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} dk</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.viewCount}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="w-full lg:w-72 space-y-6 shrink-0">
            <div className="border rounded-xl p-5 bg-card">
              <h3 className="font-bold mb-3 flex items-center gap-2"><Tag className="h-4 w-4" /> Kategoriler</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
                  data-testid="button-blog-category-all"
                >
                  Tümü
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(String(cat.id))}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === String(cat.id) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
                    data-testid={`button-blog-category-${cat.id}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="border rounded-xl p-5 bg-card">
                <h3 className="font-bold mb-3">Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 20).map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setSearchQuery(tag)}
                      data-testid={`badge-blog-tag-${tag}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
