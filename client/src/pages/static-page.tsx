import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { Page } from "@shared/schema";

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = useQuery<Page>({ queryKey: [`/api/pages/${slug}`] });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Sayfa Bulunamadı</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="static-page">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/"><span className="hover:text-primary cursor-pointer">Ana Sayfa</span></Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">{page.title}</span>
      </nav>
      <div
        className="prose prose-invert max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-4 [&_p]:mb-4 [&_p]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: page.content || "" }}
        data-testid="text-page-content"
      />
    </div>
  );
}
