import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, Download, ShoppingBag, Mail } from "lucide-react";

type Purchase = {
  id: string;
  user_id: string | null;
  buyer_email: string;
  buyer_name: string | null;
  product_id: string;
  product_label: string | null;
  amount_brl: number;
  status: string;
  category: string | null;
  stripe_session_id: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  exam: "Exames",
  protocol_regeneration: "Regeneração",
  other: "Outros",
};

const toCSV = (rows: Record<string, any>[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => JSON.stringify(r[h] ?? "")).join(","));
  return lines.join("\n");
};

const AdminPurchases = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Purchase[];
    },
  });

  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.buyer_email?.toLowerCase().includes(q) ||
        p.buyer_name?.toLowerCase().includes(q) ||
        p.product_label?.toLowerCase().includes(q) ||
        p.product_id?.toLowerCase().includes(q)
      );
    });
  }, [purchases, search, category]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, p) => s + Number(p.amount_brl || 0), 0);
    const exams = filtered.filter((p) => p.category === "exam").length;
    return { total, exams, count: filtered.length };
  }, [filtered]);

  const exportCSV = () => {
    const csv = toCSV(
      filtered.map((p) => ({
        data: new Date(p.created_at).toLocaleString("pt-BR"),
        email: p.buyer_email,
        nome: p.buyer_name || "",
        produto: p.product_label || p.product_id,
        categoria: CATEGORY_LABEL[p.category || "other"] || p.category || "",
        valor_brl: Number(p.amount_brl || 0).toFixed(2),
        status: p.status,
        sessao_stripe: p.stripe_session_id || "",
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compras-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Compras (filtro)</p>
          <p className="text-xl font-bold text-foreground">{totals.count}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Exames vendidos</p>
          <p className="text-xl font-bold text-primary">{totals.exams}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Receita avulsa</p>
          <p className="text-xl font-bold text-foreground">
            {totals.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>
      </div>

      <Card className="p-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por email, nome ou produto"
              className="pl-7 h-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="exam">Exames</SelectItem>
              <SelectItem value="protocol_regeneration">Regeneração</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-9">
            <Download size={14} className="mr-1" />
            CSV
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma compra encontrada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-foreground">
                    {p.buyer_name || p.buyer_email}
                  </p>
                  <a
                    href={`mailto:${p.buyer_email}`}
                    className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <Mail size={10} />
                    {p.buyer_email}
                  </a>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-xs text-foreground">{p.product_label || p.product_id}</p>
                  <Badge variant="outline" className="text-[9px] mt-0.5">
                    {CATEGORY_LABEL[p.category || "other"] || p.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {Number(p.amount_brl).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminPurchases;
