import { useNavigate } from "react-router-dom";
import { useJournalArticles } from "@/hooks/useJournal";
import { Card } from "@/components/ui/card";
import { Newspaper, ChevronRight } from "lucide-react";

const SectionJournal = () => {
  const navigate = useNavigate();
  const { data: articles = [], isLoading } = useJournalArticles();

  const latest = articles.slice(0, 2);
  const totalCount = articles.length;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Journal</h3>

      <Card
        onClick={() => navigate("/journal")}
        className="p-3 card-gradient border-border cursor-pointer hover:border-primary/30 transition-colors"
        role="button"
        aria-label="Abrir Journal"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Newspaper size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Todas as novidades</p>
            <p className="text-[10px] text-muted-foreground">
              {isLoading ? "Carregando..." : `${totalCount} ${totalCount === 1 ? "artigo" : "artigos"} publicados`}
            </p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        </div>

        {latest.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border/50">
            {latest.map((a) => (
              <div key={a.id} className="flex items-start gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground line-clamp-1 flex-1">{a.title}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SectionJournal;
