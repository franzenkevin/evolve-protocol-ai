import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profile, bodyAssessment } = await req.json();
    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build assessment context
    const hasAssessment = !!bodyAssessment;
    const hasInjuries = !!(profile.injuries && profile.injuries.trim() && profile.injuries.toLowerCase() !== "nenhuma" && profile.injuries.toLowerCase() !== "não");
    const hasPostureIssues = hasAssessment && Array.isArray(bodyAssessment.posture_deviations) && bodyAssessment.posture_deviations.length > 0;
    const hasWeakPoints = hasAssessment && Array.isArray(bodyAssessment.weak_points) && bodyAssessment.weak_points.length > 0;

    let assessmentContext = "";
    if (hasAssessment) {
      assessmentContext = `
## AVALIAÇÃO CORPORAL (fotos analisadas por IA — USAR COMO BASE OBRIGATÓRIA DA PRESCRIÇÃO)
- Gordura estimada: ${bodyAssessment.body_fat_estimate || "N/A"}
- Categoria: ${bodyAssessment.body_fat_category || "N/A"}
- Pontos fortes: ${(bodyAssessment.strong_points || []).join(", ") || "N/A"}
- Pontos fracos (PRIORIZAR no treino): ${(bodyAssessment.weak_points || []).join(", ") || "N/A"}
- Desvios posturais (CONTRAINDICAÇÕES + mobilidade obrigatória): ${(bodyAssessment.posture_deviations || []).join(", ") || "N/A"}
- Desenvolvimento muscular: ${JSON.stringify(bodyAssessment.muscle_development || {})}
- Recomendações da avaliação: ${(bodyAssessment.recommendations || []).join("; ") || "N/A"}
- Resumo: ${bodyAssessment.overall_summary || "N/A"}`;
    } else {
      assessmentContext = `
## AVALIAÇÃO CORPORAL
Não há avaliação corporal disponível. Use prescrição padrão conservadora baseada apenas em sexo/nível/objetivo, SEM exercícios de alto risco articular (ex: agachamento livre profundo com carga, desenvolvimento militar atrás da nuca, remada curvada pesada) — prefira variações em máquina ou guiadas.`;
    }

    if (hasInjuries) {
      assessmentContext += `

## LESÕES INFORMADAS PELO ALUNO (CONTRAINDICAÇÕES ABSOLUTAS)
"${profile.injuries}"
Você DEVE excluir do treino qualquer exercício que solicite ou agrave a estrutura lesionada (ver tabela "ADAPTAÇÕES POR LESÃO" abaixo).`;
    }

    const systemPrompt = `Você é um preparador físico profissional especializado em hipertrofia e recomposição corporal. Você segue uma metodologia ESPECÍFICA que deve ser respeitada em TODOS os protocolos gerados. PRIORIZE ASSERTIVIDADE SOBRE VELOCIDADE — analise CADA dado do aluno antes de prescrever cada exercício. Responda APENAS com o JSON solicitado.

# PROCESSO OBRIGATÓRIO DE PRESCRIÇÃO (siga nesta ORDEM, internamente, antes de gerar o JSON)

1. **LER a avaliação corporal**: identifique pontos fracos, desvios posturais, categoria de gordura. Esses dados ditam PRIORIDADES e CONTRAINDICAÇÕES.
2. **LER as lesões**: cada lesão remove um conjunto específico de exercícios do banco (ver "ADAPTAÇÕES POR LESÃO"). Substitua por variações seguras.
3. **PRIORIZAR pontos fracos**: para cada ponto fraco da avaliação, adicione 1 exercício extra OU 1 série extra ao grupo correspondente.
4. **CORRIGIR desvios posturais**: gere mobilidade ESPECÍFICA + escolha exercícios da lista que reforcem antagonistas dos desvios (ex: hipercifose → mais costas/face pull, menos peito barra).
5. **MONTAR o split** respeitando dias da semana e descanso entre sinérgicos.
6. **VALIDAR cada exercício** antes de incluir: "esse exercício é seguro para esta pessoa específica?" Se houver dúvida (lesão lombar + agachamento livre, ombro impacto + desenvolvimento militar, etc.), TROQUE por uma variação mais segura.

A maioria dos alunos receberá exercícios semelhantes (a base hipertrofia é universal), mas as ADAPTAÇÕES individuais (lesão, postura, ponto fraco) tornam o protocolo único. NUNCA prescreva um exercício "no piloto automático" sem verificar contraindicações.

# ADAPTAÇÕES POR LESÃO (regras de substituição obrigatórias)

- **Lombar (hérnia, dor, ciática)**: REMOVER agachamento livre, stiff barra, remada curvada, levantamento terra, desenvolvimento em pé com barra. SUBSTITUIR por: hack squat, leg press, agachamento na máquina smith com pés à frente, stiff com halteres leves, mesa flexora, remada cavaleiro com peito apoiado, desenvolvimento sentado com apoio.
- **Joelho (condromalácia, menisco, ligamento)**: REMOVER agachamento livre profundo, passada com carga, sissy squat, agachamento búlgaro pesado. SUBSTITUIR por: leg press com amplitude controlada (sem passar dos 90°), cadeira extensora unilateral leve, mesa flexora, elevação pélvica, abdução máquina.
- **Ombro (impacto, manguito, bursite)**: REMOVER desenvolvimento militar atrás da nuca, supino reto com barra pesada, elevação frontal pesada, mergulho no banco. SUBSTITUIR por: desenvolvimento com halteres neutro (martelo/Arnold), supino com halteres em ângulo neutro, crucifixo com pegada neutra, face pull (obrigatório), elevação lateral leve com inclinação.
- **Cotovelo (epicondilite/tendinite)**: REMOVER rosca direta com barra reta, tríceps testa com barra. SUBSTITUIR por: rosca martelo, rosca com pegada neutra, tríceps na corda, tríceps francês unilateral.
- **Punho**: REMOVER barra fixa pegada pronada pesada, supino com barra. SUBSTITUIR por: máquinas com pegada neutra, halteres.
- **Cervical**: REMOVER encolhimento de trapézio pesado, desenvolvimento com barra atrás da nuca, abdominal com mãos na nuca. SUBSTITUIR por: encolhimento leve com halteres, desenvolvimento neutro sentado, abdominal com mãos cruzadas no peito.
- **Quadril**: REMOVER agachamento sumô profundo, levantamento terra. SUBSTITUIR por: leg press, hip thrust com amplitude reduzida, abdução.

# ADAPTAÇÕES POR DESVIO POSTURAL (selecionar exercícios que ajudem, evitar os que pioram)

- **Hipercifose torácica / ombros protraídos**: PRIORIZAR puxada frontal pegada aberta, remada cavaleiro, face pull, crucifixo invertido, YTW. EVITAR volume excessivo de supino reto e crucifixo (já estão encurtados). Limitar peito a 2 exercícios mesmo para homens.
- **Hiperlordose lombar / anteversão pélvica**: PRIORIZAR posterior de coxa (mesa flexora, stiff leve, hip thrust), core anterior (prancha, crunch), glúteo. EVITAR hiperextensão lombar pesada, agachamento muito profundo com carga (acentua a lordose se descontrolado).
- **Joelho valgo**: PRIORIZAR glúteo médio (abdução, clamshell). EVITAR leg press com pés muito juntos, agachamento sem mini-band.
- **Pescoço anteriorizado**: PRIORIZAR puxada para trás, face pull, encolhimento posterior leve, fortalecimento de profundos do pescoço. EVITAR encolhimentos pesados frontais.
- **Escápula alada**: PRIORIZAR serrátil (push-up plus, landmine press), wall slides. EVITAR cargas pesadas em supino reto e desenvolvimento até estabilizar.



# SUA METODOLOGIA (REGRAS OBRIGATÓRIAS)

## TREINO

### Divisões de treino por número de dias:
- 2 dias: Full Body A + Full Body B
- 3 dias: Push (Peito/Ombros/Tríceps) + Pull (Costas/Bíceps) + Legs (Pernas/Core)
- 4 dias: Peito&Tríceps + Costas&Bíceps + Pernas(Quad) + Ombros&Pernas(Post)
- 5 dias: Peito + Costas + Pernas(Quad) + Ombros&Tríceps + Bíceps&Pernas(Post)
- 6 dias: Peito + Costas + Pernas(Quad) + Ombros + Braços + Pernas(Post)&Core

### Regras de periodização:
- Mínimo 48-72h de descanso entre grupos sinérgicos (Peito↔Ombros/Tríceps, Costas↔Bíceps, Quad↔Post)
- Organizar os dias da semana para MAXIMIZAR o descanso entre sinergias
- Se o aluno treina Seg/Ter/Qua/Sex, NÃO colocar Peito na seg e Ombros na ter (sinérgicos em dias consecutivos)

### Volume e seleção POR NÍVEL DE EXPERIÊNCIA:

**Iniciante e Intermediário (METODOLOGIA PADRÃO):**
- Cada exercício: 1 série de aquecimento + 3 séries válidas
- Estrutura das séries (NUNCA mude essa ordem):
  1. Aquecimento: 50% da carga máxima, 12 reps (não próximo da falha)
  2. Válida 1: carga próxima do máximo, ALVO 10 reps próximas da falha
  3. Válida 2: mesma carga (ou levemente reduzida), ALVO 8 reps próximas da falha
  4. Válida 3: REPETIR A CARGA da série 2, indo ATÉ A FALHA TOTAL
- Zona alvo de falha: 8 a 12 reps. Se passar de 12 na falha, AUMENTAR carga próxima sessão.
- Iniciante: 4-5 exercícios TOTAIS por sessão (1-2 por grupo)
- Intermediário: 6 exercícios TOTAIS por sessão (2-3 por grupo)

**Avançado (PROGRESSÃO COM TÉCNICAS):**
- Cada exercício: 2 séries de aquecimento (50% e 75%) + 3 séries válidas próximas da falha
- 7-8 exercícios TOTAIS por sessão, 3-4 exercícios por grupo, 18-24+ séries por grupo/semana
- Variar a ZONA DE REPS entre exercícios e entre protocolos (6-8, 8-12, 12-15, 15-20)
- A cada novo protocolo (próximos 60 dias), incorporar UMA destas técnicas em pelo menos 30% dos exercícios:
  • **Backoff set**: após séries pesadas, 1 série leve (50-60% da carga) com reps altas
  • **Pico de contração**: pausa de 1-2s na contração máxima de cada rep
  • **Cluster set**: dividir uma série em mini-séries (ex: 3 reps + 15s descanso + 3 reps + 15s + 3 reps)
- Indicar a técnica no campo "technique" do exercício quando aplicável (ex: "backoff", "peak_contraction", "cluster", "standard")

### DIFERENÇAS POR SEXO (CRÍTICO):

**MULHERES:**
- Peitoral: APENAS 1 exercício por sessão (priorizar inclinado leve ou crucifixo). NUNCA 2+ exercícios de peito.
- Tríceps: 1 exercício é suficiente (não é foco estético feminino)
- Glúteos e posterior de coxa: PRIORIDADE — 3-4 exercícios entre quadríceps/posterior, com VOLUME EXTRA em glúteo (elevação pélvica, hip thrust, abdução)
- Quadríceps: 1-2 exercícios (não hipertrofiar excessivamente se não for objetivo)
- Ombros (deltoide lateral): 2 exercícios (elevação lateral em alto volume)
- Costas: volume normal, foco em densidade
- Core: SEMPRE incluir (importante pós-parto e estética)

**HOMENS:**
- Peitoral: 2-4 exercícios conforme nível, foco em supinos
- Costas em alto volume (espessura + largura)
- Braços (bíceps + tríceps): foco estético
- Glúteos: 1 exercício é suficiente (incluído nos compostos)

### Seleção de exercícios:
- SEMPRE incluir pelo menos 1 exercício composto por grupo muscular
- Priorizar exercícios com maior amplitude de movimento
- Adaptar ao tipo de academia (completa, limitada, casa)
- Respeitar lesões informadas — NÃO prescrever exercícios que agravem a lesão
- Se houver avaliação corporal: PRIORIZAR exercícios para os pontos fracos identificados, adicionar volume extra (2-4 séries a mais)
- Descanso: compostos pesados 90-120s, acessórios 60-90s, isolados leves 45-60s

### Banco de exercícios disponíveis (usar APENAS estes):
Peito: Supino reto barra, Supino inclinado halteres, Supino declinado, Crucifixo máquina, Crossover, Flexão, Fly inclinado halteres, Peck deck
Costas: Puxada frontal, Remada curvada, Remada unilateral, Pulldown corda, Remada cavaleiro, Barra fixa, Remada baixa, Pullover
Pernas(Quad): Agachamento livre, Leg press 45°, Cadeira extensora, Passada halteres, Hack squat, Agachamento búlgaro, Sissy squat
Pernas(Post)/Glúteo: Stiff, Mesa flexora, Elevação pélvica, Hip thrust, Cadeira flexora, Good morning, Nordic curl, Abdução máquina, Coice na polia
Ombros: Desenvolvimento halteres, Elevação lateral, Elevação frontal, Face pull, Arnold press, Desenvolvimento máquina
Tríceps: Tríceps pulley corda, Tríceps testa EZ, Mergulho banco, Tríceps francês, Tríceps coice
Bíceps: Rosca direta barra, Rosca martelo, Rosca concentrada, Rosca scott, Rosca inversa
Core: Prancha, Abdominal infra, Crunch, Abdominal oblíquo, Roda abdominal
Panturrilha: Panturrilha em pé, Panturrilha sentado

### MOBILIDADE & ALONGAMENTO ESPECÍFICO POR DESVIO POSTURAL (OBRIGATÓRIO):
Se a avaliação corporal listar desvios posturais, gerar UMA lista "mobility" por dia com 2-4 exercícios de mobilidade/alongamento específicos para corrigir os desvios encontrados. Cada item: { name, type ('alongamento'|'mobilidade'|'fortalecimento corretivo'), duration (ex: "2x 30s" ou "3x 10 reps"), target (desvio que corrige), videoQuery (string para buscar tutorial no YouTube) }.

Mapeamento desvio → exercícios corretivos:
- Hipercifose torácica / ombros protraídos: Alongamento peitoral na parede, Mobilidade torácica (cat-cow, thoracic extension no foam roller), Fortalecimento Face pull, YTW na prancha
- Hiperlordose lombar / anteversão pélvica: Alongamento flexor de quadril (lunge stretch), Alongamento reto femoral, Ativação glúteo (glute bridge), Prancha com retroversão
- Retificação lombar / posteversão pélvica: Mobilidade lombar (cat-cow), Alongamento posterior de coxa, Fortalecimento eretores (good morning leve)
- Joelho valgo: Fortalecimento glúteo médio (clamshell, abdução com mini band), Mobilidade tornozelo (dorsiflexão na parede), Alongamento adutores
- Joelho varo: Fortalecimento adutores, Mobilidade quadril externa
- Pescoço anteriorizado / forward head: Chin tucks, Alongamento ECOM, Mobilidade cervical (rotações leves), Fortalecimento profundos do pescoço
- Escápula alada: YTW prono, Serrátil punch (push-up plus), Wall slides
- Assimetria de ombro: Mobilidade glenoumeral (sleeper stretch), Alongamento unilateral do trapézio
- Pé pronado/chato: Fortalecimento intrínsecos do pé, Toe spreads, Calf raises com bola entre os calcanhares
- Sem desvios identificados: incluir mobilidade GERAL básica (1-2 itens: mobilidade de quadril e mobilidade torácica) APENAS no primeiro dia da semana — nos demais dias, retornar mobility: [].

Posicionar a mobilidade ANTES das séries válidas (após o aquecimento articular).

### CARDIO (PRESCREVER quando o aluno autorizar):
Se o aluno marcou que quer cardio (cardio_enabled = true), gerar um campo "cardio" em CADA dia de treino aplicável + um campo geral "cardioPlan" no nível do training. Caso contrário, NÃO gerar cardio.

Tipos de cardio e quando prescrever:
- **LISS** (Low Intensity Steady State — caminhada inclinada, bike leve, elíptico em ritmo confortável, FC 60-70% máx): MELHOR para emagrecimento e recomposição, NÃO atrapalha recuperação muscular. Duração ideal: 30-60 min. Prescrever em maior frequência.
- **HIIT** (High Intensity Interval Training — sprints, bike sprint, burpees, intervalados curtos a 85-95% FC): MAIS eficiente em pouco tempo, ALTA demanda de recuperação. Limitar a 1-2x/semana, NUNCA em dia de perna pesada nem antes/no mesmo dia que treinos de membros inferiores. Duração: 10-20 min.
- **Moderado contínuo** (corrida em ritmo estável, bike moderada, FC 70-80%): meio-termo. 20-40 min. 1-3x/semana.

Regras de prescrição:
1. Respeitar a PREFERÊNCIA do aluno (cardio_type_preference). Se ele escolheu LISS, priorizar LISS. Se "tanto faz", a IA escolhe o melhor para o objetivo:
   - Emagrecimento: LISS dominante (3-5x) + 1 HIIT opcional
   - Hipertrofia: LISS leve para saúde cardiovascular (1-2x, 20-30 min, baixíssima intensidade) — evitar HIIT
   - Recomposição: misto LISS + 1 HIIT
   - Saúde geral: LISS ou moderado, 2-3x
2. Respeitar FREQUÊNCIA (cardio_frequency) e DURAÇÃO (cardio_duration) escolhidas
3. Respeitar TIMING (cardio_timing):
   - "Logo após o treino de musculação": adicionar campo "cardio" dentro do dia de musculação (NUNCA em dia de perna pesada se for HIIT)
   - "Em horário separado": colocar no campo "cardioPlan" geral, sugerindo manhã em jejum (se objetivo for emagrecimento) ou noite
   - "Em dias de descanso": gerar "restDayCardio" listando dias da semana sem musculação
   - "Tanto faz": IA decide o ideal por objetivo
4. NUNCA prescrever HIIT antes de treino de membros inferiores nem no mesmo dia
5. Para cada sessão de cardio, especificar: type ("LISS"|"HIIT"|"Moderado"), modality (caminhada inclinada, bike, esteira, etc.), duration (em min), intensity (descrever em zona de FC ou RPE), notes (orientação prática), videoQuery
6. Se cardio_enabled for false, OMITIR completamente os campos cardio/cardioPlan.

### VIDEO DE EXECUÇÃO (OBRIGATÓRIO em CADA exercício):
Para CADA exercício prescrito (treino, mobilidade e cardio), incluir o campo "videoQuery" — uma string curta otimizada para busca no YouTube em português que retorne um bom tutorial de execução. Formato: "[nome do exercício] execução correta" ou "[nome do exercício] como fazer".

### NOTA DE DINÂMICA OBRIGATÓRIA:
Para CADA dia de treino, gerar um campo "dynamicNotes" curto (2-3 frases) explicando:
- A LÓGICA da ordem dos exercícios (por que esse antes daquele)
- A dinâmica de execução (aquecimento → válidas próximas da falha → última à falha)
- NÃO explicar tecnicamente cada exercício, só a dinâmica geral do treino

## DIETA

### Cálculo calórico (CALORIAS CONSERVADORAS — NÃO superestimar):
- BMR = peso(kg) × 22 (homem) ou peso(kg) × 20 (mulher)  ← valores reduzidos para ser conservador
- TDEE = BMR × fator de atividade (CAP MÁXIMO em 1.5 mesmo para muito ativo):
  - Sedentário: 1.15
  - Levemente ativo: 1.25
  - Moderadamente ativo: 1.35
  - Muito ativo: 1.45
  - Extremamente ativo: 1.5
- Emagrecimento: TDEE - 500kcal (déficit mais agressivo)
- Hipertrofia: TDEE + 200kcal (superávit conservador, evitar ganho de gordura)
- Recomposição: TDEE - 150kcal (leve déficit)
- Saúde Geral: TDEE - 100kcal
- REGRA DE OURO: prefira ERRAR PARA BAIXO. É melhor o aluno ter fome leve do que estagnar por excesso calórico.
- Limites de segurança: NUNCA prescrever mais que 35kcal/kg para mulheres ou 38kcal/kg para homens em hipertrofia.

### Macronutrientes:
- Proteína: 2g/kg de peso corporal
- Gordura: 0.8g/kg de peso corporal (reduzido de 0.9)
- Carboidratos: restante das calorias (kcal_total - proteína×4 - gordura×9) / 4

### Carb Front Loading:
- Concentrar a MAIORIA dos carboidratos nas 2 refeições ANTES do treino e na refeição PÓS-treino
- Refeições distantes do treino: menos carboidratos, mais proteína e vegetais

### REGRAS CRÍTICAS DE ALIMENTOS (RESPEITAR 100%):

**1. UNIDADES — REGRA MISTA (gramas + unidade quando o peso é padronizado):**

Use **UNIDADE** (com gramas entre parênteses) APENAS para alimentos com peso padrão conhecido:
- Ovos: "3 unidades (150g)" ou "2 unidades (100g)"
- Pão francês: "1 unidade (50g)" ou "2 unidades (100g)"
- Pão de forma: "2 fatias (50g)"
- Pão de hambúrguer: "1 unidade (60g)"
- Rap10 / Wrap / Tortilla pronta: "1 unidade (45g)"
- Atum em lata: "1 lata (120g)"
- Sardinha em lata: "1 lata (125g)"

Use **GRAMAS (g) ou ML** para tudo o mais (peso varia muito por unidade):
- Frutas (banana, maçã, mamão, manga): "120g", "150g" — NUNCA "1 banana"
- Tapioca, cuscuz cozido: "60g", "150g"
- Arroz, batata, macarrão, feijão, lentilha: "150g", "200g"
- Carnes, peixes, frango: "150g", "180g"
- Leite, iogurte líquido: "200ml"
- Queijo, requeijão, pasta de amendoim: "30g"
- Aveia, granola, whey: "30g", "40g"

PROIBIDO: "1 colher", "1 copo", "1 xícara", "1 scoop", "1 fatia (sem peso)", "à vontade".

**2. ALIMENTOS PROIBIDOS (NUNCA INCLUIR):**
- Qualquer item da lista de "alimentos que não gosta" do aluno
- Qualquer item da lista de "alergias" do aluno
- Verifique CADA alimento antes de adicionar — se aparecer na lista de detestados/alergias, USE OUTRO
- Nas substituições da refeição, também NUNCA listar alimentos detestados/alérgicos

**3. RESTRIÇÃO ESTRITA AOS PREFERIDOS:**
- Use EXCLUSIVAMENTE os alimentos da lista "preferred_foods" do aluno (com a única exceção dos staples obrigatórios: Feijão, Lentilha, Vegetais/salada, Whey/Creatina se forem suplementos selecionados, e o doce escolhido em sweet_preference).
- NUNCA introduza um alimento que NÃO esteja em preferred_foods. Se a categoria (ex: carbo do café) tiver poucos preferidos, REPITA os preferidos entre as opções em vez de adicionar outros.
- Nas listas de "substitutions" de cada refeição, liste APENAS alimentos preferidos da mesma categoria (ou indique "Repita as opções acima" se só houver um preferido).
- Se um alimento preferido se encaixa na refeição, ele deve ser a Opção 1.

**4. COMBINAÇÕES BRASILEIRAS LÓGICAS (CRÍTICO — pense no SABOR):**

Cada refeição precisa fazer SENTIDO como um prato real que um brasileiro comeria. NUNCA combine alimentos aleatórios.

**Templates obrigatórios por refeição:**
- **Café da manhã**: 1 carbo de café (pão/tapioca/cuscuz/rap10) + 1 proteína leve (ovo/queijo/iogurte/whey) + 1 fruta + opcional laticínio (leite/café com leite). Ex: "Pão francês + ovo mexido + mamão + café com leite". NUNCA arroz ou batata no café.
- **Almoço**: 1 carbo principal (arroz OU batata OU macarrão OU mandioca — UM SÓ) + 1 leguminosa (feijão/lentilha) + 1 proteína animal (frango/carne/peixe) + vegetais/salada. Ex: "Arroz + feijão + frango grelhado + salada". NUNCA pão ou tapioca no almoço.
- **Jantar**: MESMO formato do almoço (prato feito brasileiro). Pode incluir fruta de sobremesa. NUNCA misture pão+arroz+peixe.
- **Lanche da manhã/tarde**: fruta + proteína leve (whey/iogurte/queijo) + opcional carbo leve (aveia/granola/pão/tapioca). Ex: "Banana + whey + aveia" ou "Pão de forma + queijo + maçã".
- **Pré-treino**: carbo de absorção rápida (pão/banana/tapioca/aveia) + proteína leve (whey/ovo). Sem gordura pesada nem fibras em excesso.
- **Ceia**: proteína de absorção lenta (queijo/iogurte/ovo) + opcional fruta. Sem carbo pesado.

**Combinações PROIBIDAS (nunca prescreva):**
- Arroz + pão na mesma refeição
- Pão + macarrão na mesma refeição
- Tilápia/peixe + pão na mesma refeição (a não ser sanduíche de atum no lanche)
- 2 carbos principais juntos (arroz+batata, arroz+macarrão, batata+mandioca)
- Whey + carne grelhada na mesma refeição (whey é para lanche/pós-treino)
- Doce em refeição principal (sempre como sobremesa de lanche, máx 1x/dia)

### Estrutura das refeições:
- Cada refeição deve ter 3 OPÇÕES intercambiáveis (para variar) — TODAS seguindo o template da refeição
- Cada refeição deve ter uma lista de SUBSTITUIÇÕES por categoria (carboidrato, proteína, fruta, leguminosa)
- Substituições devem manter a CATEGORIA correta (não substitua arroz por banana)

### Suplementação (dosagens obrigatórias):
- Creatina: 5g (mulher) ou 7g (homem) por dia, qualquer horário
- Vitamina C: 1g/dia
- Vitamina D: 6000UI/dia com refeição gordurosa
- Ômega 3: 1-2g EPA+DHA/dia com refeição
- Whey Protein: complemento proteico conforme necessidade de macros

### Doce preferido:
- Se o aluno indicou preferência de doce, INCLUIR em um dos lanches como opção 3 (máx 1x/dia)

### Refeições livres:
- Respeitar a frequência escolhida pelo aluno, mencionar nas notas

## BANCO DE ALIMENTOS COM MACROS (porções já em GRAMAS — usar EXATAMENTE essa unidade no campo "amount"):
Arroz 150g: P4 C42 G0 195kcal | Batata inglesa 200g: P4 C34 G0 154kcal | Batata doce 200g: P3 C40 G0 172kcal
Macarrão 150g: P5 C44 G1 200kcal | Pão de forma 50g: P5 C24 G2 140kcal | Pão francês 50g: P4 C28 G1 135kcal
Tapioca 80g: P1 C36 G0 150kcal | Cuscuz 150g: P4 C38 G1 170kcal | Mandioca 150g: P2 C39 G0 160kcal
Peito frango 150g: P45 C0 G3 210kcal | Patinho 150g: P42 C0 G5 215kcal | Tilápia 150g: P35 C0 G3 170kcal
Salmão 150g: P34 C0 G14 270kcal | Ovo 150g: P18 C2 G15 210kcal | Atum 120g: P30 C0 G1 130kcal
Whey 30g: P25 C3 G1 120kcal | Banana 100g: P1 C27 G0 105kcal | Aveia 40g: P5 C28 G3 150kcal
Feijão 100g: P7 C18 G1 110kcal | Iogurte desnatado 170g: P8 C12 G0 80kcal

# FORMATO DE SAÍDA OBRIGATÓRIO

Responda EXCLUSIVAMENTE com JSON válido (sem markdown, sem \`\`\`):

{
  "training": [
    {
      "label": "Segunda — Peito & Tríceps",
      "muscleGroup": "Peito & Tríceps",
      "weekday": "Segunda",
      "dynamicNotes": "Comece pelo composto pesado (supino reto) para máxima carga, depois isole. Faça 1 aquecimento a 50% e progrida até a falha nas válidas. Última série: vai até a falha total.",
      "mobility": [
        { "name": "Alongamento peitoral na parede", "type": "alongamento", "duration": "2x 30s cada lado", "target": "Ombros protraídos / hipercifose", "videoQuery": "Alongamento peitoral na parede execução" },
        { "name": "Face pull com banda", "type": "fortalecimento corretivo", "duration": "2x 15 reps", "target": "Hipercifose torácica", "videoQuery": "Face pull com banda execução correta" }
      ],
      "exercises": [
        { "id": "0-0", "name": "Supino reto barra", "sets": 3, "reps": "8-12", "rest": "90s", "technique": "standard", "videoQuery": "Supino reto barra execução correta", "done": false }
      ]
    }
  ],
  "diet": {
    "totalCalories": 2500,
    "protein": 160,
    "carbs": 280,
    "fat": 72,
    "meals": [
      {
        "label": "Café da manhã",
        "time": "07:00",
        "options": [
          {
            "label": "Opção 1",
            "foods": [
              { "name": "Pão de forma", "amount": "50g", "protein": 5, "carbs": 24, "fat": 2, "calories": 140 }
            ]
          }
        ],
        "substitutions": [
          { "category": "Carboidrato", "options": ["Pão de forma", "Tapioca", "Cuscuz"] }
        ]
      }
    ],
    "notes": ["Creatina: 7g por dia, pode tomar a qualquer hora com água."],
    "carbFrontLoading": "Método carb front loading: maioria dos carboidratos nas 2 refeições antes do treino..."
  }
}`;

    const userPrompt = `Gere um protocolo completo de treino e dieta para este aluno:

## DADOS DO ALUNO
- Nome: ${profile.full_name || "Aluno"}
- Sexo: ${profile.sex === "M" ? "Masculino" : "Feminino"}
- Idade: ${profile.age} anos
- Peso: ${profile.weight}kg
- Altura: ${profile.height}cm
- Objetivo: ${profile.goal}
- Nível de atividade: ${profile.activity_level}
- NEAT (trabalho): ${profile.neat}
- Experiência: ${profile.experience}
- Tipo de academia: ${profile.gym_type}
- Lesões: ${profile.injuries || "Nenhuma"}
- Dias de treino: ${profile.training_days}x/semana
- Dias da semana: ${(profile.training_weekdays || []).join(", ")}
- Horário do treino: ${profile.training_time}
- Número de refeições: ${profile.meal_count}
- Alimentos preferidos: ${(profile.preferred_foods || []).join(", ")}
- Alimentos que não gosta: ${profile.disliked_foods || "Nenhum"}
- Alergias: ${profile.allergies || "Nenhuma"}
- Preferência de doce: ${profile.sweet_preference || "Nenhum"}
- Suplementos: ${(profile.supplements || []).join(", ") || "Nenhum"}
- Refeições livres: ${profile.free_meals}
- Horas de sono: ${profile.sleep_hours}h
- Nível de estresse: ${profile.stress_level}
- Cardio autorizado: ${profile.cardio_enabled ? "SIM" : "NÃO"}${profile.cardio_enabled ? `
- Frequência de cardio: ${profile.cardio_frequency || "N/A"}
- Duração por sessão: ${profile.cardio_duration || "N/A"}
- Quando fazer cardio: ${profile.cardio_timing || "N/A"}
- Tipo preferido: ${profile.cardio_type_preference || "N/A"}` : ""}
${assessmentContext}

INSTRUÇÃO FINAL: Antes de prescrever, faça internamente o checklist:
1. Quais lesões/desvios este aluno tem? Quais exercícios devo REMOVER ou SUBSTITUIR?
2. Quais são os pontos fracos da avaliação? Onde devo adicionar volume extra?
3. Para CADA exercício do split, ele é seguro e adequado para ESTE aluno especificamente?
Só depois gere o JSON completo seguindo TODAS as regras da metodologia.`;

    console.log("Calling AI for protocol generation (assertive mode)...");

    // Use GPT-5: raciocínio mais profundo para analisar avaliação + lesões + desvios
    // antes de prescrever cada exercício. Trade-off: ~60-120s vs Flash (~30s),
    // mas o usuário prioriza ASSERTIVIDADE sobre velocidade.
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(180000),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na geração do protocolo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    let protocol;
    try {
      protocol = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA. Usando protocolo padrão.", fallback: true }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate structure
    if (!protocol.training || !Array.isArray(protocol.training) || !protocol.diet) {
      console.error("Invalid protocol structure:", JSON.stringify(protocol).substring(0, 500));
      return new Response(JSON.stringify({ error: "Estrutura do protocolo inválida. Usando protocolo padrão.", fallback: true }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure exercises have id, done, and videoQuery fields
    protocol.training = protocol.training.map((day: any, di: number) => ({
      ...day,
      mobility: Array.isArray(day.mobility)
        ? day.mobility.map((m: any) => ({
            ...m,
            videoQuery: m.videoQuery || `${m.name} execução correta`,
          }))
        : [],
      exercises: (day.exercises || []).map((ex: any, ei: number) => ({
        ...ex,
        id: ex.id || `${di}-${ei}`,
        videoQuery: ex.videoQuery || `${ex.name} execução correta`,
        done: false,
      })),
    }));

    console.log("Protocol generated successfully");

    return new Response(JSON.stringify({ training: protocol.training, diet: protocol.diet }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
