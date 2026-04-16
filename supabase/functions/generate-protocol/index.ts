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
    let assessmentContext = "";
    if (bodyAssessment) {
      assessmentContext = `
## AVALIAÇÃO CORPORAL (fotos analisadas por IA)
- Gordura estimada: ${bodyAssessment.body_fat_estimate || "N/A"}
- Categoria: ${bodyAssessment.body_fat_category || "N/A"}
- Pontos fortes: ${(bodyAssessment.strong_points || []).join(", ") || "N/A"}
- Pontos fracos: ${(bodyAssessment.weak_points || []).join(", ") || "N/A"}
- Desvios posturais: ${(bodyAssessment.posture_deviations || []).join(", ") || "N/A"}
- Desenvolvimento muscular: ${JSON.stringify(bodyAssessment.muscle_development || {})}
- Recomendações da avaliação: ${(bodyAssessment.recommendations || []).join("; ") || "N/A"}
- Resumo: ${bodyAssessment.overall_summary || "N/A"}

IMPORTANTE: Use esses dados para PRIORIZAR grupos musculares fracos no treino e ajustar macros baseado na composição corporal real.`;
    }

    const systemPrompt = `Você é um preparador físico profissional especializado em hipertrofia e recomposição corporal. Você segue uma metodologia ESPECÍFICA que deve ser respeitada em TODOS os protocolos gerados. Responda APENAS com o JSON solicitado.

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
- Iniciante: 1-2 exercícios por grupo muscular
- Intermediário: 2-3 exercícios por grupo muscular

**Avançado (PROGRESSÃO COM TÉCNICAS):**
- Cada exercício: 2 séries de aquecimento (50% e 75%) + 3 séries válidas próximas da falha
- 3-4 exercícios por grupo, 18-24+ séries por grupo/semana
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

### NOTA DE DINÂMICA OBRIGATÓRIA:
Para CADA dia de treino, gerar um campo "dynamicNotes" curto (2-3 frases) explicando:
- A LÓGICA da ordem dos exercícios (por que esse antes daquele)
- A dinâmica de execução (aquecimento → válidas próximas da falha → última à falha)
- NÃO explicar tecnicamente cada exercício, só a dinâmica geral do treino

## DIETA

### Cálculo calórico:
- BMR = peso(kg) × 24 (homem) ou peso(kg) × 22 (mulher)
- TDEE = BMR × fator de atividade:
  - Sedentário: 1.2
  - Levemente ativo: 1.375
  - Moderadamente ativo: 1.55
  - Muito ativo: 1.725
  - Extremamente ativo: 1.9
- Emagrecimento: TDEE - 400kcal
- Hipertrofia: TDEE + 300kcal
- Recomposição: TDEE (manutenção)
- Saúde Geral: TDEE

### Macronutrientes:
- Proteína: 2g/kg de peso corporal
- Gordura: 0.9g/kg de peso corporal
- Carboidratos: restante das calorias (TDEE - proteína×4 - gordura×9) / 4

### Carb Front Loading:
- Concentrar a MAIORIA dos carboidratos nas 2 refeições ANTES do treino e na refeição PÓS-treino
- Refeições distantes do treino: menos carboidratos, mais proteína e vegetais

### Estrutura das refeições:
- Cada refeição deve ter 3 OPÇÕES intercambiáveis (para variar)
- Cada refeição deve ter uma lista de SUBSTITUIÇÕES por categoria (carboidrato, proteína, fruta, leguminosa)
- RESPEITAR alimentos preferidos (priorizar), detestados (excluir), alergias (excluir)
- Café da manhã: carboidrato leve + proteína + fruta
- Almoço/Jantar: carboidrato + proteína + leguminosa/vegetais
- Lanches: proteína + fruta ± carboidrato leve

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

## BANCO DE ALIMENTOS COM MACROS (usar para cálculos):
Arroz 150g: P4 C42 G0 195kcal | Batata inglesa 200g: P4 C34 G0 154kcal | Batata doce 200g: P3 C40 G0 172kcal
Macarrão 150g: P5 C44 G1 200kcal | Pão de forma 2fatias: P5 C24 G2 140kcal | Pão francês 1un: P4 C28 G1 135kcal
Tapioca 2un: P1 C36 G0 150kcal | Cuscuz 150g: P4 C38 G1 170kcal | Mandioca 150g: P2 C39 G0 160kcal
Peito frango 150g: P45 C0 G3 210kcal | Patinho 150g: P42 C0 G5 215kcal | Tilápia 150g: P35 C0 G3 170kcal
Salmão 150g: P34 C0 G14 270kcal | Ovo 3un: P18 C2 G15 210kcal | Atum lata: P30 C0 G1 130kcal
Whey 1scoop: P25 C3 G1 120kcal | Banana 1un: P1 C27 G0 105kcal | Aveia 40g: P5 C28 G3 150kcal
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
      "exercises": [
        { "id": "0-0", "name": "Supino reto barra", "sets": 3, "reps": "8-12", "rest": "90s", "technique": "standard", "done": false }
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
              { "name": "Pão de forma", "amount": "2 fatias", "protein": 5, "carbs": 24, "fat": 2, "calories": 140 }
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
${assessmentContext}

Gere o JSON completo seguindo TODAS as regras da metodologia.`;

    console.log("Calling AI for protocol generation...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
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

    // Ensure exercises have id and done fields
    protocol.training = protocol.training.map((day: any, di: number) => ({
      ...day,
      exercises: (day.exercises || []).map((ex: any, ei: number) => ({
        ...ex,
        id: ex.id || `${di}-${ei}`,
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
