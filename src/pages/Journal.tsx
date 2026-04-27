import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { useJournalArticles, JournalArticle } from "@/hooks/useJournal";
import { Newspaper, ExternalLink, ArrowLeft, Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Journal = () => {
  const { data: articles = [], isLoading } = useJournalArticles();
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);

  if (selectedArticle) {
    return (
      <AppLayout>
        <div className="p-4 max-w-lg mx-auto animate-fade-in pb-24">
          <Button variant="ghost" size="sm" className="gap-1 mb-3 text-muted-foreground" onClick={() => setSelectedArticle(null)}>
            <ArrowLeft size={14} />Voltar
          </Button>

          {selectedArticle.image_url && (
            <img
              src={selectedArticle.image_url}
              alt={selectedArticle.title}
              className="w-full aspect-video object-cover rounded-lg mb-3 border border-border"
              loading="lazy"
            />
          )}

          <Card className="p-5 card-gradient border-border">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {selectedArticle.category && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">{selectedArticle.category}</Badge>
              )}
              {selectedArticle.tags?.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] bg-secondary/50 text-muted-foreground px-1.5 py-0.5 rounded">#{t}</span>
              ))}
            </div>

            <h1 className="text-xl font-heading font-bold text-foreground mb-2 leading-tight">{selectedArticle.title}</h1>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-4 flex-wrap">
              <span className="flex items-center gap-1"><User size={10} />{selectedArticle.author || "Equipe EVORIA"}</span>
              <span className="flex items-center gap-1"><Calendar size={10} />
                {new Date(selectedArticle.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
              {selectedArticle.read_time_minutes && (
                <span className="flex items-center gap-1"><Clock size={10} />{selectedArticle.read_time_minutes} min</span>
              )}
            </div>

            {selectedArticle.excerpt && (
              <p className="text-sm font-medium text-foreground/90 mb-3 leading-relaxed border-l-2 border-primary pl-3 italic">
                {selectedArticle.excerpt}
              </p>
            )}

            <div className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-line">
              {selectedArticle.content || selectedArticle.summary}
            </div>

            {selectedArticle.source_url && (
              <a
                href={selectedArticle.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink size={12} />Ver fonte original
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
        <div className="pt-2">
          <h1 className="text-2xl font-heading font-bold text-foreground">Journal</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Notícias, ciência e novidades sobre fitness, estética e hipertrofia.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 card-gradient border-border animate-pulse h-32" />
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
                className="overflow-hidden card-gradient border-border cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedArticle(article)}
              >
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full aspect-[16/9] object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {article.category && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">{article.category}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(article.published_at).toLocaleDateString("pt-BR")}
                    </span>
                    {article.read_time_minutes && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={9} />{article.read_time_minutes} min
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{article.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {article.excerpt || article.summary}
                  </p>
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
