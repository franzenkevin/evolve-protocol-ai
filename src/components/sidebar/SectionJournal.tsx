import { useJournalArticles } from "@/hooks/useJournal";
import { Card } from "@/components/ui/card";
import { Newspaper, ExternalLink } from "lucide-react";

const SectionJournal = () => {
  const { data: articles = [], isLoading } = useJournalArticles();

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Journal</h3>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i} className="p-3 card-gradient border-border animate-pulse h-20" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card className="p-4 card-gradient border-border text-center">
          <Newspaper size={20} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum artigo publicado ainda.</p>
          <p className="text-[10px] text-muted-foreground mt-1">Novos conteúdos são adicionados semanalmente.</p>
        </Card>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {articles.map((article) => (
            <Card key={article.id} className="p-3 card-gradient border-border">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2">{article.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{article.category}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(article.published_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                {article.source_url && (
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionJournal;
