import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useJournalArticles } from "@/hooks/useJournal";
import { Newspaper, ExternalLink, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const Journal = () => {
  const { data: articles = [], isLoading } = useJournalArticles();
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  if (selectedArticle) {
    return (
      <AppLayout>
        <div className="p-4 max-w-lg mx-auto animate-fade-in pb-24">
          <Button variant="ghost" size="sm" className="gap-1 mb-3 text-muted-foreground" onClick={() => setSelectedArticle(null)}>
            <ArrowLeft size={14} />Voltar
          </Button>
          <Card className="p-5 card-gradient border-border">
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">{selectedArticle.category}</span>
            <h1 className="text-lg font-heading font-bold text-foreground mt-2 mb-2">{selectedArticle.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-4">
              <Calendar size={10} />
              <span>{new Date(selectedArticle.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            <div className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-line">
              {selectedArticle.summary}
            </div>
            {selectedArticle.source_url && (
              <a
                href={selectedArticle.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink size={12} />Ver estudo original
              </a>
            )}
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Journal</h1>
        <p className="text-xs text-muted-foreground">Novidades sobre fitness, estética, peptídeos e ciência — com resumos de IA.</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 card-gradient border-border animate-pulse h-24" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <Card className="p-8 card-gradient border-border text-center">
            <Newspaper size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum artigo publicado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Novos conteúdos são adicionados semanalmente.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="p-4 card-gradient border-border cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Newspaper size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{article.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{article.category}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(article.published_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Journal;
