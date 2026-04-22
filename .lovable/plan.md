

## Garantir trocas isocalóricas e isomácros nas refeições

Hoje as substituições mostradas na aba **Dieta** são apenas nomes ("Pão de forma, Tapioca, Cuscuz") — sem porção, sem kcal, sem macros. O usuário não consegue trocar com confiança porque uma porção padrão de tapioca tem mais carbo que o pão. Além disso, as 3 "Opções" de cada refeição podem variar bastante em calorias entre si.

Vou ajustar o gerador de IA + a tela para que **toda troca seja equivalente em kcal e macros** ao item original (tolerância de ±5%).

### O que muda

**1. Prompt do gerador (`supabase/functions/generate-protocol/index.ts`)**
Adicionar regras explícitas e atualizar o schema de saída:

- **Opções da refeição (Opção 1/2/3)**: as 3 opções devem ter **mesma soma de kcal e macros (±5%)** entre si. Adicionar uma checagem interna obrigatória antes de finalizar o JSON.
- **Substituições**: deixam de ser strings soltas e passam a ser objetos com porção em gramas + macros calculados, equivalentes ao item de referência da refeição. Cada categoria de substituição passa a ter:
  - `referenceFood`: alimento base e seus macros (o que está sendo substituído)
  - `options`: lista de substitutos, cada um com `name`, `amount` (gramas), `protein`, `carbs`, `fat`, `calories` — **dentro de ±5% das kcal e do macro principal** do alimento de referência
- Reforço no prompt: a IA deve calcular a porção do substituto (ex.: 50g de pão de forma ≈ 140 kcal / 24g carb → tapioca ≈ 38g para bater 140 kcal e ~24g carb, em vez dos 80g padrão).

**2. Tipo TypeScript (`src/lib/generateProtocol.ts`)**
Atualizar `Meal.substitutions` para refletir a nova estrutura:
```ts
substitutions: {
  category: string;
  referenceFood: { name: string; amount: string; calories: number; protein: number; carbs: number; fat: number };
  options: { name: string; amount: string; calories: number; protein: number; carbs: number; fat: number }[];
}[]
```
Manter compatibilidade lendo o formato antigo se vier (fallback).

**3. Renderização das substituições (`src/pages/Diet.tsx`)**
Trocar os `Badge` simples por linhas mais informativas:
- Cabeçalho da categoria mostra: "Carboidrato — referência: Pão de forma 50g · 140 kcal · C24g"
- Cada opção em uma linha: nome + porção em destaque + kcal + P/C/G compacto
- Layout mantém o estilo glass dark + lime já existente
- Fallback: se vier o formato antigo (array de strings), renderiza como antes para não quebrar protocolos já gerados

**4. Compatibilidade com protocolos existentes**
Protocolos já gerados antes da mudança continuam funcionando (fallback no render). Quando o usuário regerar o protocolo, a nova estrutura entra automaticamente.

### Detalhes técnicos

- Não muda schema do banco — `protocols.diet` é `jsonb`, aceita o novo formato direto.
- Sem migração necessária.
- Tolerância ±5% é uma regra do prompt; a IA já segue tabela de macros embutida no prompt para calcular porções.
- Arquivos editados: `supabase/functions/generate-protocol/index.ts`, `src/lib/generateProtocol.ts`, `src/pages/Diet.tsx`.

